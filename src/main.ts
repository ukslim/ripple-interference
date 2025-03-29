import { generateInterferencePattern } from "./image";
import "./style.css";

// Paperback book aspect ratio (6:9)
const WIDTH = 600;
const HEIGHT = 900;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Interference Pattern Generator</h1>
    <div class="card">
      <canvas id="display" width="${WIDTH}" height="${HEIGHT}"></canvas>
      <button id="regenerate">Generate New Pattern</button>
    </div>
  </div>
`;

function displayPattern() {
  const canvas = document.querySelector<HTMLCanvasElement>("#display")!;
  generateInterferencePattern(WIDTH, HEIGHT, canvas);
}

// Generate initial pattern
displayPattern();

// Setup regenerate button
document
  .querySelector<HTMLButtonElement>("#regenerate")!
  .addEventListener("click", displayPattern);
