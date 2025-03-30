import { generateInterferencePattern } from "./image";
import "./style.css";

// Paperback book aspect ratio (6:9)
const WIDTH = 600;
const HEIGHT = 900;

// Default parameters
const baseFrequency = 0.15;

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
            <label>Decay</label>
            <input type="range" 
                   id="decay" 
                   min="0" 
                   max="0.01" 
                   step="0.0001" 
                   value="0.001">
          </div>
          <div class="slider-group">
            <label>Thresh</label>
            <input type="range" 
                   id="threshold" 
                   min="0" 
                   max="1" 
                   step="0.01" 
                   value="0.5">
          </div>
        </div>
        ${pointNames
          .map(
            (name, i) => `
          <div class="point-controls">
            <h3>${name}</h3>
            <div class="slider-group">
              <label>Freq</label>
              <input type="range" 
                     id="freq-${i}" 
                     min="${baseFrequency * 0.5}" 
                     max="${baseFrequency * 1.5}" 
                     step="0.001" 
                     value="${baseFrequency}">
            </div>
            <div class="slider-group">
              <label>X</label>
              <input type="range" 
                     id="x-${i}" 
                     min="-1" 
                     max="1" 
                     step="0.01" 
                     value="0">
            </div>
            <div class="slider-group">
              <label>Y</label>
              <input type="range" 
                     id="y-${i}" 
                     min="-1" 
                     max="1" 
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
        <canvas id="display" width="${WIDTH}" height="${HEIGHT}"></canvas>
      </div>
    </div>
  </div>
`;

// Get all sliders
const sliders = Array(4)
  .fill(null)
  .map((_, i) => ({
    frequency: document.querySelector<HTMLInputElement>(`#freq-${i}`)!,
    xOffset: document.querySelector<HTMLInputElement>(`#x-${i}`)!,
    yOffset: document.querySelector<HTMLInputElement>(`#y-${i}`)!,
  }));

const decaySlider = document.querySelector<HTMLInputElement>("#decay")!;
const thresholdSlider = document.querySelector<HTMLInputElement>("#threshold")!;

function getPointParams() {
  return sliders.map((slider) => ({
    frequency: parseFloat(slider.frequency.value),
    xOffset: parseFloat(slider.xOffset.value),
    yOffset: parseFloat(slider.yOffset.value),
  }));
}

function displayPattern() {
  const canvas = document.querySelector<HTMLCanvasElement>("#display")!;
  generateInterferencePattern(
    WIDTH,
    HEIGHT,
    canvas,
    getPointParams() as [any, any, any, any],
    parseFloat(decaySlider.value),
    parseFloat(thresholdSlider.value)
  );
}

// Update pattern when any slider changes
sliders.forEach((slider) => {
  Object.values(slider).forEach((input) => {
    input.addEventListener("input", displayPattern);
  });
});

decaySlider.addEventListener("input", displayPattern);
thresholdSlider.addEventListener("input", displayPattern);

// Randomize button handler
document
  .querySelector<HTMLButtonElement>("#regenerate")!
  .addEventListener("click", () => {
    sliders.forEach((slider) => {
      slider.frequency.value = (
        baseFrequency *
        (1 + (Math.random() - 0.5))
      ).toString();
      slider.xOffset.value = (Math.random() - 0.5).toString();
      slider.yOffset.value = (Math.random() - 0.5).toString();
    });
    displayPattern();
  });

// Generate initial pattern
displayPattern();
