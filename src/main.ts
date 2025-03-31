import { InterferencePattern } from "./image";
import "./style.css";

// Physical dimensions in millimeters
const WIDTH_MM = 110;
const HEIGHT_MM = 178;

// Default parameters
const baseWavelength = 41.89; // 2π/0.15, converting from previous baseFrequency

// Point names for labels
const pointNames = ["Top Left", "Top Right", "Bottom Left", "Bottom Right"];

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Interference Pattern Generator</h1>
    <nav style="margin-bottom: 1rem;">
      <a href="/ripple-interference/animate.html">View Animated Version</a>
    </nav>
    <div class="layout">
      <div class="controls">
        <div class="global-controls">
          <div class="slider-group">
            <div class="slider-label">
              <span>Decay</span>
              <span class="value-display" id="decay-value">0.00026</span>
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
              <span>Thresh</span>
              <span class="value-display" id="threshold-value">0.5</span>
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
              <span>Noise F</span>
              <span class="value-display" id="noiseFreq-value">0.2</span>
            </div>
            <input type="range" 
                   id="noiseFreq" 
                   min="0.001" 
                   max="2" 
                   step="0.001" 
                   value="0.2">
          </div>
          <div class="slider-group">
            <div class="slider-label">
              <span>Noise A</span>
              <span class="value-display" id="noiseAmp-value">0.05</span>
            </div>
            <input type="range" 
                   id="noiseAmp" 
                   min="0" 
                   max="0.2" 
                   step="0.001" 
                   value="0.05">
          </div>
          <div class="slider-group">
            <div class="slider-label">
              <span>Hue</span>
              <span class="value-display" id="hue-value">0.00</span>
            </div>
            <input type="range" 
                   id="hue" 
                   min="0" 
                   max="6.283" 
                   step="0.01" 
                   value="0">
          </div>
        </div>
        ${pointNames
          .map(
            (name, i) => `
          <div class="point-controls">
            <h3>${name}</h3>
            <div class="slider-group">
              <div class="slider-label">
                <span>λ (mm)</span>
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
                <span>X</span>
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
                <span>Y</span>
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
        <button id="regenerate">Randomize All</button>
      </div>
      <div class="canvas-container">
        <canvas id="display"></canvas>
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
const noiseFreqSlider = {
  slider: document.querySelector<HTMLInputElement>("#noiseFreq")!,
  display: document.querySelector<HTMLSpanElement>("#noiseFreq-value")!,
};
const noiseAmpSlider = {
  slider: document.querySelector<HTMLInputElement>("#noiseAmp")!,
  display: document.querySelector<HTMLSpanElement>("#noiseAmp-value")!,
};
const hueSlider = {
  slider: document.querySelector<HTMLInputElement>("#hue")!,
  display: document.querySelector<HTMLSpanElement>("#hue-value")!,
};

// Create pattern generator with the display canvas
const canvas = document.querySelector<HTMLCanvasElement>("#display")!;
const pattern = new InterferencePattern(WIDTH_MM, HEIGHT_MM, canvas);

function updateValueDisplay(slider: {
  slider: HTMLInputElement;
  display: HTMLSpanElement;
}) {
  slider.display.textContent = parseFloat(slider.slider.value).toFixed(3);
}

function getPointParams() {
  return sliders.map((slider) => ({
    wavelength: parseFloat(slider.wavelength.slider.value),
    xOffset: parseFloat(slider.xOffset.slider.value),
    yOffset: parseFloat(slider.yOffset.slider.value),
  }));
}

function displayPattern() {
  pattern.generate(
    getPointParams() as [any, any, any, any],
    parseFloat(decaySlider.slider.value),
    parseFloat(thresholdSlider.slider.value),
    0,
    parseFloat(noiseFreqSlider.slider.value),
    parseFloat(noiseAmpSlider.slider.value),
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

[
  decaySlider,
  thresholdSlider,
  noiseFreqSlider,
  noiseAmpSlider,
  hueSlider,
].forEach((slider) => {
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

// Generate initial pattern
displayPattern();
