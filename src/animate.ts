import { InterferencePattern } from "./image";
import "./style.css";

// Paperback book aspect ratio (6:9)
const WIDTH = 600;
const HEIGHT = 900;

// Default parameters
const baseFrequency = 0.15;

// Animation parameters
const animationSpeeds = {
  frequency: 0.05,
  xOffset: 0.02,
  yOffset: 0.02,
  decay: 0.02,
};

// Initial phase offsets for each parameter
const phaseOffsets = {
  frequency: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
  xOffset: [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI],
  yOffset: [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4],
  decay: 0,
};

// Parameter ranges
const ranges = {
  frequency: { min: baseFrequency * 0.2, max: baseFrequency * 3.0 },
  xOffset: { min: -3, max: 3 },
  yOffset: { min: -3, max: 3 },
  decay: { min: 0.0001, max: 0.005 },
};

// Fixed threshold value (middle of original range)
const fixedThreshold = 0.35;

let time = 0;

function getAnimatedParams() {
  return Array(4)
    .fill(null)
    .map((_, i) => ({
      frequency:
        ranges.frequency.min +
        ((Math.sin(
          time * animationSpeeds.frequency + phaseOffsets.frequency[i]
        ) +
          1) /
          2) *
          (ranges.frequency.max - ranges.frequency.min),
      xOffset:
        ranges.xOffset.min +
        ((Math.sin(time * animationSpeeds.xOffset + phaseOffsets.xOffset[i]) +
          1) /
          2) *
          (ranges.xOffset.max - ranges.xOffset.min),
      yOffset:
        ranges.yOffset.min +
        ((Math.sin(time * animationSpeeds.yOffset + phaseOffsets.yOffset[i]) +
          1) /
          2) *
          (ranges.yOffset.max - ranges.yOffset.min),
    }));
}

// Set up the page
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Animated Interference Pattern</h1>
    <nav style="margin-bottom: 1rem;">
      <a href="/ripple-interference/">Back to Interactive Version</a>
    </nav>
    <div class="layout">
      <div class="canvas-container">
        <canvas id="display" width="${WIDTH}" height="${HEIGHT}"></canvas>
      </div>
    </div>
  </div>
`;

// Create pattern generator with the display canvas
const canvas = document.querySelector<HTMLCanvasElement>("#display")!;
const pattern = new InterferencePattern(WIDTH, HEIGHT, canvas);

function animate() {
  const decay =
    ranges.decay.min +
    ((Math.sin(time * animationSpeeds.decay + phaseOffsets.decay) + 1) / 2) *
      (ranges.decay.max - ranges.decay.min);

  pattern.generate(
    getAnimatedParams() as [any, any, any, any],
    decay,
    fixedThreshold,
    time
  );

  time += 0.016; // Approximately 60fps
  requestAnimationFrame(animate);
}

// Start animation
animate();
