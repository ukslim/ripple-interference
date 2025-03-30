interface Point {
  x: number;
  y: number;
  phase: number;
  frequency: number;
}

interface PointParameters {
  frequency: number;
  xOffset: number; // Offset from square corner in wavelengths
  yOffset: number; // Offset from square corner in wavelengths
}

export class InterferencePattern {
  private width: number;
  private height: number;
  private wavelength: number;
  private basePositions: { x: number; y: number }[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.wavelength = (2 * Math.PI) / 0.15;

    // Calculate square dimensions
    const margin = width * 0.2;
    const squareSize = width - 2 * margin;
    const squareTop = (height - squareSize) / 2 - height / 9;

    // Initialize 4 points in a roughly square pattern
    this.basePositions = [
      { x: margin, y: squareTop }, // Top Left
      { x: width - margin, y: squareTop }, // Top Right
      { x: margin, y: squareTop + squareSize }, // Bottom Left
      { x: width - margin, y: squareTop + squareSize }, // Bottom Right
    ];
  }

  private calculateIntensity(
    x: number,
    y: number,
    points: Point[],
    time: number,
    decayRate: number,
    threshold: number
  ): number {
    let value = 0;

    for (const point of points) {
      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply exponential decay based on distance
      const amplitude = Math.exp(-distance * decayRate);

      // Use point-specific frequency with small modulation
      const frequency = point.frequency + Math.sin(distance * 0.002) * 0.01;
      const wave =
        Math.sin(distance * frequency + point.phase + time) * amplitude;

      // Reduce noise and make it higher frequency
      const noise = Math.sin(x * 0.2 + y * 0.2) * 0.05 * amplitude;

      value += wave + noise;
    }

    // Normalize and sharpen the contrast
    value = (value / points.length + 1) / 2;

    // Apply contrast enhancement
    value = Math.pow(value, 1.5);
    value = value < 0.5 ? value * 0.8 : value * 1.2;

    // Apply threshold cutoff
    return value > threshold ? 1 : 0;
  }

  public generate(
    buffer: Uint8ClampedArray,
    pointParams: [
      PointParameters,
      PointParameters,
      PointParameters,
      PointParameters
    ],
    decayRate: number = 0.001,
    threshold: number = 0.5,
    time: number = 0
  ): void {
    if (buffer.length !== this.width * this.height * 4) {
      throw new Error(
        `Buffer size must be ${
          this.width * this.height * 4
        } (width * height * 4)`
      );
    }

    const points = pointParams.map((params, i) => ({
      x: this.basePositions[i].x + params.xOffset * this.wavelength,
      y: this.basePositions[i].y + params.yOffset * this.wavelength,
      phase: (i * Math.PI) / 2, // 0, π/2, π, 3π/2
      frequency: params.frequency,
    }));

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const intensity = this.calculateIntensity(
          x,
          y,
          points,
          time,
          decayRate,
          threshold
        );
        const idx = (y * this.width + x) * 4;

        // Use a more saturated orange color
        buffer[idx] = 255 * intensity; // R
        buffer[idx + 1] = 120 * intensity; // G
        buffer[idx + 2] = 0; // B
        buffer[idx + 3] = 255; // A
      }
    }
  }
}
