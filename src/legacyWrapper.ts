import { InterferencePatternNew } from "./imageNew";

// Type definitions for backward compatibility
interface PointParametersWithOffset {
  wavelength: number; // Wavelength in mm
  xOffset: number; // Offset from square corner in wavelengths
  yOffset: number; // Offset from square corner in wavelengths
}

/**
 * A wrapper function to provide backward compatibility with the offset-based API
 * Converts from offset-based coordinates to absolute coordinates
 */
export function generateWithOffsets(
  pattern: InterferencePatternNew,
  pointParams: [
    PointParametersWithOffset,
    PointParametersWithOffset,
    PointParametersWithOffset,
    PointParametersWithOffset
  ],
  decayRate: number = 0.001,
  threshold: number = 0.5,
  time: number = 0,
  noiseFrequency: number = 0.2,
  noiseAmplitude: number = 0.05,
  hue: number = 0
): void {
  // Get the wavelength constant from the pattern instance
  const wavelength = (2 * Math.PI) / 0.15;

  // Calculate base positions (the same logic that was in the constructor)
  const dimensions = pattern["dimensions"]; // Access private property
  if (!dimensions) {
    throw new Error("Pattern dimensions not accessible");
  }

  const physicalDims = dimensions.getPhysicalDimensions();
  const margin = physicalDims.width * 0.2;
  const squareSize = physicalDims.width - 2 * margin;
  const squareTop =
    (physicalDims.height - squareSize) / 2 - physicalDims.height / 9;

  // Base positions in a square pattern
  const basePositions = [
    { x: margin, y: squareTop }, // Top Left
    { x: physicalDims.width - margin, y: squareTop }, // Top Right
    { x: margin, y: squareTop + squareSize }, // Bottom Left
    { x: physicalDims.width - margin, y: squareTop + squareSize }, // Bottom Right
  ];

  // Convert from offset coordinates to absolute coordinates
  const absoluteParams = pointParams.map((params, i) => {
    return {
      x: basePositions[i].x + params.xOffset * wavelength,
      y: basePositions[i].y + params.yOffset * wavelength,
      phase: (i * Math.PI) / 2, // Use the same phase calculation as before
      wavelength: params.wavelength,
    };
  }) as [
    { x: number; y: number; phase: number; wavelength: number },
    { x: number; y: number; phase: number; wavelength: number },
    { x: number; y: number; phase: number; wavelength: number },
    { x: number; y: number; phase: number; wavelength: number }
  ];

  // Call the new generate method with absolute coordinates
  pattern.generate(
    absoluteParams,
    decayRate,
    threshold,
    time,
    noiseFrequency,
    noiseAmplitude,
    hue
  );
}
