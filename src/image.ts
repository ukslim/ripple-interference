interface Point {
  x: number;
  y: number;
  phase: number;
  frequency: number; // Each point now has its own frequency
}

export class InterferencePattern {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private points: Point[];
  private time: number;
  private baseFrequency = 0.15; // Base frequency for all points
  private wavelength = (2 * Math.PI) / 0.15; // Wavelength based on base frequency

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
    this.time = 0;

    // Calculate square dimensions
    const margin = width * 0.2;
    const squareSize = width - 2 * margin;
    const squareTop = (height - squareSize) / 2;

    // Helper function to add controlled randomness
    const randomizePosition = (basePos: number) => {
      // Random offset within one wavelength
      return basePos + (Math.random() - 0.5) * this.wavelength;
    };

    // Helper function to generate random frequency variation
    const randomizeFrequency = () => {
      // Random frequency within ±50% of base frequency
      return this.baseFrequency * (1 + (Math.random() - 0.5));
    };

    // Initialize 4 points in a roughly square pattern
    this.points = [
      {
        // Top Left
        x: randomizePosition(margin),
        y: randomizePosition(squareTop),
        phase: 0,
        frequency: randomizeFrequency(),
      },
      {
        // Top Right
        x: randomizePosition(width - margin),
        y: randomizePosition(squareTop),
        phase: Math.PI / 2,
        frequency: randomizeFrequency(),
      },
      {
        // Bottom Left
        x: randomizePosition(margin),
        y: randomizePosition(squareTop + squareSize),
        phase: Math.PI,
        frequency: randomizeFrequency(),
      },
      {
        // Bottom Right
        x: randomizePosition(width - margin),
        y: randomizePosition(squareTop + squareSize),
        phase: (3 * Math.PI) / 2,
        frequency: randomizeFrequency(),
      },
    ];

    // Log the variations for debugging
    console.log(
      "Point variations:",
      this.points.map((p) => ({
        frequency: (p.frequency / this.baseFrequency - 1) * 100 + "%",
        positionOffset: {
          x: p.x % this.wavelength,
          y: p.y % this.wavelength,
        },
      }))
    );
  }

  private calculateIntensity(x: number, y: number): number {
    let value = 0;

    for (const point of this.points) {
      const dx = x - point.x;
      const dy = y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Use point-specific frequency with small modulation
      const frequency = point.frequency + Math.sin(distance * 0.002) * 0.01;
      const wave = Math.sin(distance * frequency + point.phase + this.time);

      // Reduce noise and make it higher frequency
      const noise = Math.sin(x * 0.2 + y * 0.2) * 0.05;

      value += wave + noise;
    }

    // Normalize and sharpen the contrast
    value = (value / this.points.length + 1) / 2;

    // Apply contrast enhancement
    value = Math.pow(value, 1.5);
    value = value < 0.5 ? value * 0.8 : value * 1.2;
    return Math.max(0, Math.min(1, value));
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
  targetCanvas: HTMLCanvasElement
): void {
  const pattern = new InterferencePattern(width, height);
  const imageData = pattern.generate();
  const ctx = targetCanvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);
}
