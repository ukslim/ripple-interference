import { InterferencePattern } from "./image";
import "./style.css";

// Physical dimensions in millimeters
const WIDTH_MM = 110;
const HEIGHT_MM = 178;

// Default parameters
const baseWavelength = 41.89; // 2π/0.15, converting from previous baseFrequency

// Animation parameters
const animationSpeeds = {
  wavelength: 0.05,
  xOffset: 0.02,
  yOffset: 0.02,
  decay: 0.02,
};

// Initial phase offsets for each parameter
const phaseOffsets = {
  wavelength: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
  xOffset: [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI],
  yOffset: [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4],
  decay: 0,
};

// Parameter ranges
const ranges = {
  wavelength: { min: baseWavelength / 1.5, max: baseWavelength * 3.0 },
  xOffset: { min: -1, max: 1 }, // Reduced range for physical size
  yOffset: { min: -1, max: 1 }, // Reduced range for physical size
  decay: { min: 0.0001, max: 0.005 },
};

// Fixed threshold value (middle of original range)
const fixedThreshold = 0.35;

let time = 0;

function getAnimatedParams() {
  return Array(4)
    .fill(null)
    .map((_, i) => ({
      wavelength:
        ranges.wavelength.min +
        ((Math.sin(
          time * animationSpeeds.wavelength + phaseOffsets.wavelength[i]
        ) +
          1) /
          2) *
          (ranges.wavelength.max - ranges.wavelength.min),
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
        <canvas id="display"></canvas>
      </div>
    </div>
  </div>
`;

// Create pattern generator with the display canvas
const canvas = document.querySelector<HTMLCanvasElement>("#display")!;
const pattern = new InterferencePattern(WIDTH_MM, HEIGHT_MM, canvas);

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
