import { InterferencePatternNew } from "./image";
import "./style.css";

// Default parameters
const baseWavelength = 100; // 2π/0.15, converting from previous baseFrequency

// Animation parameters
const animationSpeeds = {
  wavelength: 0.05,
  xOffset: 0.1, // Faster x movement
  yOffset: 0.08, // Slightly slower y movement for elliptical orbits
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
  xOffset: { min: -1, max: 3 }, // Wider range for more noticeable orbits
  yOffset: { min: -1, max: 3 }, // Wider range for more noticeable orbits
  decay: { min: 0.0001, max: 0.0005 },
  hue: { min: 0, max: 2 * Math.PI }, // Full hue range
};

// Fixed threshold value (middle of original range)
const fixedThreshold = 0.35;

let time = 0;

// Base positions calculation function
function calculateBasePositions(width: number, height: number) {
  // Position sources at the corners with a small margin
  const margin = Math.min(width, height) * 0.3;

  // Base positions in a corner pattern in pixels
  return [
    { x: margin, y: margin }, // Top Left
    { x: width - margin, y: margin }, // Top Right
    { x: margin, y: height - margin }, // Bottom Left
    { x: width - margin, y: height - margin }, // Bottom Right
  ];
}

function getAnimatedParams(maxDistance: number) {
  return Array(4)
    .fill(null)
    .map((_, i) => {
      // Different orbit speeds for each point
      const orbitSpeedX = animationSpeeds.xOffset * (0.01 + i * 0.01);

      // Limit orbit distances to stay within margin
      // maxDistance already accounts for wavelength scaling
      const maxOrbitDistance = maxDistance * 0.8; // 80% of allowed distance for safety
      const orbitDistanceX = maxOrbitDistance * (0.3 + i * 0.15);

      // Calculate a comet-like orbit with a perihelion (close approach) and aphelion (far point)
      // Use a modified elliptical equation for irregular cometary motion
      const angle = time * orbitSpeedX + phaseOffsets.xOffset[i];
      const eccentricity = 0.6 + i * 0.1; // Different eccentricity for each comet (0-1)

      // Kepler's equation approximation for irregular orbit
      const r = orbitDistanceX * (1 - eccentricity * Math.cos(angle));

      // Different angles for each comet's orbit orientation
      const orbitAngle = (i * Math.PI) / 4 + Math.PI / 8;

      // Calculate the wobble scale (smaller than the main orbit)
      const wobbleScale = maxOrbitDistance * 0.2;

      return {
        wavelength:
          ranges.wavelength.min +
          ((Math.sin(
            time * animationSpeeds.wavelength + phaseOffsets.wavelength[i]
          ) +
            1) /
            2) *
            (ranges.wavelength.max - ranges.wavelength.min),

        // Parameterized orbit equation with limited distance
        xOffset:
          r * Math.cos(angle + orbitAngle) +
          Math.sin(time * 0.5 + i) * wobbleScale,

        // Add additional sine terms for "wobble" to make it more irregular
        yOffset:
          r * Math.sin(angle + orbitAngle) * (1 - eccentricity * 0.5) +
          Math.sin(time * 0.2 + i * 5) * wobbleScale,
      };
    });
}

// Set up the page
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="fullscreen">
    <canvas id="display"></canvas>
  </div>
`;

// Override any constraints from the main CSS for the #app element
const appElement = document.querySelector<HTMLDivElement>("#app")!;
appElement.style.maxWidth = "100vw";

// Create pattern generator with the display canvas
const canvas = document.querySelector<HTMLCanvasElement>("#display")!;

// Ensure canvas styling fills viewport
canvas.style.width = "100vw";
canvas.style.height = "100vh";
canvas.style.display = "block";

// Set initial canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create the pattern with pixel dimensions
let pattern = new InterferencePatternNew(
  window.innerWidth,
  window.innerHeight,
  canvas
);

// Handle window resize
window.addEventListener("resize", () => {
  // Update canvas dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Recreate the pattern with new dimensions
  pattern = new InterferencePatternNew(
    window.innerWidth,
    window.innerHeight,
    canvas
  );
});

function animate() {
  const decay =
    ranges.decay.min +
    ((Math.sin(time * animationSpeeds.decay + phaseOffsets.decay) + 1) / 2) *
      (ranges.decay.max - ranges.decay.min);

  const hue =
    ranges.hue.min +
    ((Math.sin(time * animationSpeeds.hue + phaseOffsets.hue) + 1) / 2) *
      (ranges.hue.max - ranges.hue.min);

  const basePositions = calculateBasePositions(
    window.innerWidth,
    window.innerHeight
  );

  // Calculate max orbit distance based on margin
  const margin = Math.min(window.innerWidth, window.innerHeight) * 0.3;

  // The maxDistance needs to be small enough that when multiplied by the wavelength,
  // it won't exceed the margin. Use a normalized fraction of margin to wavelength
  const maxDistance = (margin / baseWavelength) * 0.5; // Use 50% of margin-to-wavelength ratio

  const offsetParams = getAnimatedParams(maxDistance);

  // Convert from offset-based parameters to absolute positions
  const absoluteParams = offsetParams.map((params, i) => {
    return {
      x: basePositions[i].x + params.xOffset * params.wavelength,
      y: basePositions[i].y + params.yOffset * params.wavelength,
      phase: (i * Math.PI) / 2, // Same phase calculation as before
      wavelength: params.wavelength,
    };
  });

  // Call generate directly with absolute positions
  pattern.generate(
    absoluteParams as [any, any, any, any],
    decay,
    fixedThreshold,
    -time * 0.01, // Negate time to reverse the flow direction
    0.1, // noiseFrequency
    0.01, // noiseAmplitude
    hue
  );

  time += 0.016; // Approximately 60fps
  requestAnimationFrame(animate);
}

// Start animation
animate();
