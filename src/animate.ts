import { InterferencePatternNew } from "./imageNew";
import { generateWithOffsets } from "./legacyWrapper";
import "./style.css";

// Get viewport dimensions in millimeters (assuming 96 DPI)
const DPI = 96;
const PIXELS_PER_MM = DPI / 25.4;

// Calculate physical dimensions based on viewport size
const WIDTH_MM = window.innerWidth / PIXELS_PER_MM;
const HEIGHT_MM = window.innerHeight / PIXELS_PER_MM;

// Default parameters
const baseWavelength = 41.89; // 2π/0.15, converting from previous baseFrequency

// Animation parameters
const animationSpeeds = {
  wavelength: 0.05,
  xOffset: 0.02,
  yOffset: 0.02,
  decay: 0.02,
  hue: 0.1, // Slower hue animation
};

// Initial phase offsets for each parameter
const phaseOffsets = {
  wavelength: [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2],
  xOffset: [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI],
  yOffset: [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4],
  decay: 0,
  hue: 0,
};

// Parameter ranges
const ranges = {
  wavelength: { min: baseWavelength / 1.5, max: baseWavelength * 3.0 },
  xOffset: { min: -1, max: 1 }, // Reduced range for physical size
  yOffset: { min: -1, max: 1 }, // Reduced range for physical size
  decay: { min: 0.0001, max: 0.005 },
  hue: { min: 0, max: 2 * Math.PI }, // Full hue range
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
  <div class="fullscreen">
    <canvas id="display"></canvas>
  </div>
`;

// Create pattern generator with the display canvas
const canvas = document.querySelector<HTMLCanvasElement>("#display")!;
const pattern = new InterferencePatternNew(WIDTH_MM, HEIGHT_MM, canvas);

function animate() {
  const decay =
    ranges.decay.min +
    ((Math.sin(time * animationSpeeds.decay + phaseOffsets.decay) + 1) / 2) *
      (ranges.decay.max - ranges.decay.min);

  const hue =
    ranges.hue.min +
    ((Math.sin(time * animationSpeeds.hue + phaseOffsets.hue) + 1) / 2) *
      (ranges.hue.max - ranges.hue.min);

  generateWithOffsets(
    pattern,
    getAnimatedParams() as [any, any, any, any],
    decay,
    fixedThreshold,
    time,
    0.2, // noiseFrequency
    0.05, // noiseAmplitude
    hue
  );

  time += 0.016; // Approximately 60fps
  requestAnimationFrame(animate);
}

// Start animation
animate();
