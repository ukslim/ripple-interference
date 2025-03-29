import { generateInterferencePattern } from "./image";
import "./style.css";

// Paperback book aspect ratio (6:9)
const WIDTH = 600;
const HEIGHT = 900;

// Default parameters
const baseFrequency = 0.15;
const defaultParams = Array(4).fill({
  frequency: baseFrequency,
  xOffset: 0,
  yOffset: 0,
});

// Point names for labels
const pointNames = ["Top Left", "Top Right", "Bottom Left", "Bottom Right"];

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Interference Pattern Generator</h1>
    <div class="layout">
      <div class="controls">
        ${pointNames
          .map(
            (name, i) => `
          <div class="point-controls">
            <h3>${name}</h3>
            <div class="slider-group">
              <label>Frequency (${(baseFrequency * 0.5).toFixed(3)} - ${(
              baseFrequency * 1.5
            ).toFixed(3)})</label>
              <input type="range" 
                     id="freq-${i}" 
                     min="${baseFrequency * 0.5}" 
                     max="${baseFrequency * 1.5}" 
                     step="0.001" 
                     value="${baseFrequency}">
            </div>
            <div class="slider-group">
              <label>X Offset (-0.5 to 0.5 wavelengths)</label>
              <input type="range" 
                     id="x-${i}" 
                     min="-0.5" 
                     max="0.5" 
                     step="0.01" 
                     value="0">
            </div>
            <div class="slider-group">
              <label>Y Offset (-0.5 to 0.5 wavelengths)</label>
              <input type="range" 
                     id="y-${i}" 
                     min="-0.5" 
                     max="0.5" 
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
    getPointParams() as [any, any, any, any]
  );
}

// Update pattern when any slider changes
sliders.forEach((slider) => {
  Object.values(slider).forEach((input) => {
    input.addEventListener("input", displayPattern);
  });
});

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
