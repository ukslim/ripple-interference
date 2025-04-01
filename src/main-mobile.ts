import { InterferencePatternNew } from "./image";
import "./style-mobile.css";

// Physical dimensions in millimeters (for use in the wrapper)
const WIDTH_MM = 110;
const HEIGHT_MM = 178;
const PIXELS_PER_MM = 96 / 25.4;

// Set fixed canvas dimensions for consistent display
// Use a reasonable size that maintains the aspect ratio
const CANVAS_WIDTH = WIDTH_MM * PIXELS_PER_MM;
const CANVAS_HEIGHT = HEIGHT_MM * PIXELS_PER_MM;

// Default parameters
const baseWavelength = 41.89; // 2π/0.15, converting from previous baseFrequency

// Point positions for 2x2 grid
const pointPositions = ["TL", "TR", "BL", "BR"];

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="mobile-layout">
    <div class="canvas-container">
      <canvas id="display"></canvas>
      <div id="rotate-message">
        <div id="rotate-icon">
          <img src="rotate-icon.svg" width="28" height="28" alt="Rotation icon">
        </div>
        <div>rotate to edit</div>
      </div>
    </div>
    <div class="controls">
      <div class="controls-content">
        <div class="global-controls">
          <div class="slider-group">
            <div class="slider-label">
              <span class="label-text">Decay</span>
              <span class="value-display" id="decay-value">2.60</span>
            </div>
            <input type="range" 
                  id="decay" 
                  min="0" 
                  max="0.013" 
                  step="0.000026" 
                  value="0.00026">
          </div>
          <div class="slider-group">
            <div class="slider-label">
              <span class="label-text">Thresh</span>
              <span class="value-display" id="threshold-value">0.50</span>
            </div>
            <input type="range" 
                  id="threshold" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value="0.5">
          </div>
          <div class="slider-group">
            <div class="slider-label">
              <span class="label-text">Hue</span>
              <span class="value-display" id="hue-value">0.34</span>
            </div>
            <input type="range" 
                  id="hue" 
                  min="0" 
                  max="6.283" 
                  step="0.01" 
                  value="0.340">
          </div>
        </div>
        <div class="points-grid">
          ${pointPositions
            .map(
              (pos, i) => `
            <div class="point-controls" id="point-${pos}">
              <div class="slider-group">
                <div class="slider-label">
                  <span class="label-text">λ (mm)</span>
                  <span class="value-display" id="wavelength-value-${i}">${baseWavelength.toFixed(
                1
              )}</span>
                </div>
                <input type="range" 
                      id="freq-${i}" 
                      min="${baseWavelength / 5.0}" 
                      max="${baseWavelength * 10.0}" 
                      step="0.1" 
                      value="${baseWavelength}">
              </div>
              <div class="slider-group">
                <div class="slider-label">
                  <span class="label-text">X</span>
                  <span class="value-display" id="x-value-${i}">0.00</span>
                </div>
                <input type="range" 
                      id="x-${i}" 
                      min="-3" 
                      max="3" 
                      step="0.01" 
                      value="0">
              </div>
              <div class="slider-group">
                <div class="slider-label">
                  <span class="label-text">Y</span>
                  <span class="value-display" id="y-value-${i}">0.00</span>
                </div>
                <input type="range" 
                      id="y-${i}" 
                      min="-3" 
                      max="3" 
                      step="0.01" 
                      value="0">
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        <button id="regenerate">Randomize All</button>
        <a href="/ripple-interference/animate.html">Animated</a>
      </div>
    </div>
  </div>
`;

// Get all sliders and their value displays
const sliders = Array(4)
  .fill(null)
  .map((_, i) => ({
    wavelength: {
      slider: document.querySelector<HTMLInputElement>(`#freq-${i}`)!,
      display: document.querySelector<HTMLSpanElement>(
        `#wavelength-value-${i}`
      )!,
    },
    xOffset: {
      slider: document.querySelector<HTMLInputElement>(`#x-${i}`)!,
      display: document.querySelector<HTMLSpanElement>(`#x-value-${i}`)!,
    },
    yOffset: {
      slider: document.querySelector<HTMLInputElement>(`#y-${i}`)!,
      display: document.querySelector<HTMLSpanElement>(`#y-value-${i}`)!,
    },
  }));

const decaySlider = {
  slider: document.querySelector<HTMLInputElement>("#decay")!,
  display: document.querySelector<HTMLSpanElement>("#decay-value")!,
};
const thresholdSlider = {
  slider: document.querySelector<HTMLInputElement>("#threshold")!,
  display: document.querySelector<HTMLSpanElement>("#threshold-value")!,
};
const hueSlider = {
  slider: document.querySelector<HTMLInputElement>("#hue")!,
  display: document.querySelector<HTMLSpanElement>("#hue-value")!,
};

// Create pattern generator with the display canvas
const canvas = document.querySelector<HTMLCanvasElement>("#display")!;

// Handle orientation changes
function handleOrientationChange() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  document.body.classList.toggle("landscape", isLandscape);
  document.body.classList.toggle("portrait", !isLandscape);

  // Show/hide rotation message based on orientation
  const rotateMessage =
    document.querySelector<HTMLDivElement>("#rotate-message");
  if (rotateMessage) {
    if (!isLandscape) {
      rotateMessage.style.display = "flex";
      // Auto-hide message after 3 seconds
      setTimeout(() => {
        rotateMessage.style.opacity = "0";
        setTimeout(() => {
          rotateMessage.style.display = "none";
        }, 1000);
      }, 3000);
    } else {
      rotateMessage.style.display = "none";
    }
  }

  // For iOS to recalculate scrollable area correctly after orientation change
  if (isLandscape) {
    // Force reflow of the controls container to fix iOS scroll issues
    const controls = document.querySelector<HTMLElement>(".controls");
    if (controls) {
      controls.style.display = "none";
      // Force reflow
      void controls.offsetHeight;
      controls.style.display = "block";
    }
  }

  // Force layout recalculation
  updateCanvasSize();

  // Create new pattern generator with updated dimensions but using fixed canvas size
  initializePattern();

  // Update the display
  displayPattern();
}

// Initialize the pattern with the fixed portrait dimensions
function initializePattern() {
  // Always use fixed portrait dimensions for the WebGL pattern
  pattern = new InterferencePatternNew(CANVAS_WIDTH, CANVAS_HEIGHT, canvas);
}

// Update canvas size based on available space but maintain fixed pattern dimensions
function updateCanvasSize() {
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;

  // Always use the same canvas dimensions to maintain consistency
  // We'll only change the CSS styling to make it fit

  // Set canvas webgl dimensions once to fixed portrait dimensions
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  if (isLandscape) {
    // In landscape, we want to scale the canvas to fill the left half while maintaining aspect ratio
    canvas.style.width = "auto";
    canvas.style.height = "100vh";
    canvas.style.maxWidth = "50vw";
    canvas.style.objectFit = "contain";
  } else {
    // In portrait, fill entire screen
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.maxWidth = "none";
    canvas.style.objectFit = "contain";
  }
}

// Initialize pattern with portrait dimensions
let pattern = new InterferencePatternNew(CANVAS_WIDTH, CANVAS_HEIGHT, canvas);

// Add orientation change and resize event listeners
window.addEventListener("orientationchange", handleOrientationChange);
window.addEventListener("resize", handleOrientationChange);

// Secret debug mode - triple tap on title area
let tapCount = 0;
document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  if (
    target.classList.contains("controls") ||
    target.parentElement?.classList.contains("controls")
  ) {
    tapCount++;
    if (tapCount >= 3) {
      document.body.classList.toggle("debug-mode");
      tapCount = 0;
    }
    setTimeout(() => {
      tapCount = 0;
    }, 500);
  }
});

// Initial orientation setup
handleOrientationChange();

function updateValueDisplay(slider: {
  slider: HTMLInputElement;
  display: HTMLSpanElement;
}) {
  // Format the value based on the magnitude
  const value = parseFloat(slider.slider.value);

  // Use fewer decimal places for display clarity
  let displayValue = value.toFixed(2);

  // For very small values like decay, use scientific notation
  if (value < 0.01 && value > 0) {
    displayValue = value.toExponential(1);
  }

  // For decay, multiply by 10000 for display clarity
  if (slider.display.id.includes("decay-value")) {
    displayValue = (value * 10000).toFixed(2);
  }

  // For wavelength values, use just one decimal place
  if (slider.display.id.includes("wavelength-value")) {
    displayValue = value.toFixed(1);
  }

  slider.display.textContent = displayValue;
}

// Base positions calculation function
function calculateBasePositions() {
  const margin = CANVAS_WIDTH * 0.2;
  const squareSize = CANVAS_WIDTH - 2 * margin;
  const squareTop = (CANVAS_HEIGHT - squareSize) / 2 - CANVAS_HEIGHT / 9;

  // Base positions in a square pattern in pixels
  return [
    { x: margin, y: squareTop }, // Top Left
    { x: CANVAS_WIDTH - margin, y: squareTop }, // Top Right
    { x: margin, y: squareTop + squareSize }, // Bottom Left
    { x: CANVAS_WIDTH - margin, y: squareTop + squareSize }, // Bottom Right
  ];
}

function getPointParams() {
  return sliders.map((slider) => ({
    wavelength: parseFloat(slider.wavelength.slider.value),
    xOffset: parseFloat(slider.xOffset.slider.value),
    yOffset: parseFloat(slider.yOffset.slider.value),
  }));
}

function displayPattern() {
  const offsetParams = getPointParams();
  const basePositions = calculateBasePositions();

  // Convert from offset-based parameters to absolute positions
  const absoluteParams = offsetParams.map((params, i) => {
    return {
      x: basePositions[i].x + params.xOffset * params.wavelength,
      y: basePositions[i].y + params.yOffset * params.wavelength,
      phase: (i * Math.PI) / 2, // Same phase calculation as before
      wavelength: params.wavelength,
    };
  });

  // Call generate directly with absolute positions and set noise amplitude to 0
  pattern.generate(
    absoluteParams as [any, any, any, any],
    parseFloat(decaySlider.slider.value),
    parseFloat(thresholdSlider.slider.value),
    0,
    0.2, // Fixed noise frequency value
    0, // Set noise amplitude permanently to 0
    parseFloat(hueSlider.slider.value)
  );
}

// Update pattern and value displays when any slider changes
sliders.forEach((slider) => {
  Object.values(slider).forEach((input) => {
    input.slider.addEventListener("input", () => {
      updateValueDisplay(input);
      displayPattern();
    });
  });
});

[decaySlider, thresholdSlider, hueSlider].forEach((slider) => {
  slider.slider.addEventListener("input", () => {
    updateValueDisplay(slider);
    displayPattern();
  });
});

// Randomize button handler
document
  .querySelector<HTMLButtonElement>("#regenerate")!
  .addEventListener("click", () => {
    sliders.forEach((slider) => {
      slider.wavelength.slider.value = (
        baseWavelength *
        (1 + (Math.random() - 0.5))
      ).toString();
      slider.xOffset.slider.value = (Math.random() - 0.5).toString();
      slider.yOffset.slider.value = (Math.random() - 0.5).toString();
      updateValueDisplay(slider.wavelength);
      updateValueDisplay(slider.xOffset);
      updateValueDisplay(slider.yOffset);
    });
    displayPattern();
  });
