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
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private points: Point[];
  private time: number;
  private wavelength = (2 * Math.PI) / 0.15;
  private decayRate: number;
  private threshold: number;

  constructor(
    width: number,
    height: number,
    pointParams: [
      PointParameters,
      PointParameters,
      PointParameters,
      PointParameters
    ],
    decayRate: number = 0.001,
    threshold: number = 0.5
  ) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
    this.time = 0;
    this.decayRate = decayRate;
    this.threshold = threshold;

    // Calculate square dimensions
    const margin = width * 0.2;
    const squareSize = width - 2 * margin;
    const squareTop = (height - squareSize) / 2 - 100;

    // Initialize 4 points in a roughly square pattern
    const basePositions = [
      { x: margin, y: squareTop }, // Top Left
      { x: width - margin, y: squareTop }, // Top Right
      { x: margin, y: squareTop + squareSize }, // Bottom Left
      { x: width - margin, y: squareTop + squareSize }, // Bottom Right
    ];

    this.points = pointParams.map((params, i) => ({
      x: basePositions[i].x + params.xOffset * this.wavelength,
      y: basePositions[i].y + params.yOffset * this.wavelength,
      phase: (i * Math.PI) / 2, // 0, π/2, π, 3π/2
      frequency: params.frequency,
    }));
  }

  private calculateIntensity(x: number, y: number): number {
    let value = 0;

    for (const point of this.points) {
      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Apply exponential decay based on distance
      const amplitude = Math.exp(-distance * this.decayRate);

      // Use point-specific frequency with small modulation
      const frequency = point.frequency + Math.sin(distance * 0.002) * 0.01;
      const wave =
        Math.sin(distance * frequency + point.phase + this.time) * amplitude;

      // Reduce noise and make it higher frequency
      const noise = Math.sin(x * 0.2 + y * 0.2) * 0.05 * amplitude;

      value += wave + noise;
    }

    // Normalize and sharpen the contrast
    value = (value / this.points.length + 1) / 2;

    // Apply contrast enhancement
    value = Math.pow(value, 1.5);
    value = value < 0.5 ? value * 0.8 : value * 1.2;

    // Apply threshold cutoff
    return value > this.threshold ? 1 : 0;
  }

  public setDecayRate(rate: number) {
    this.decayRate = rate;
  }

  public setThreshold(threshold: number) {
    this.threshold = threshold;
  }

  public generate(): ImageData {
    // Clear canvas
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw interference pattern
    const imageData = this.ctx.createImageData(this.width, this.height);

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const intensity = this.calculateIntensity(x, y);
        const idx = (y * this.width + x) * 4;

        // Use a more saturated orange color
        imageData.data[idx] = 255 * intensity; // R
        imageData.data[idx + 1] = 120 * intensity; // G
        imageData.data[idx + 2] = 0; // B
        imageData.data[idx + 3] = 255; // A
      }
    }

    return imageData;
  }
}

export function generateInterferencePattern(
  width: number,
  height: number,
  targetCanvas: HTMLCanvasElement,
  pointParams: [
    PointParameters,
    PointParameters,
    PointParameters,
    PointParameters
  ],
  decayRate: number = 0.001,
  threshold: number = 0.5
): void {
  const pattern = new InterferencePattern(
    width,
    height,
    pointParams,
    decayRate,
    threshold
  );
  const imageData = pattern.generate();
  const ctx = targetCanvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);
}
