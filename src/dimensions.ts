export class PhysicalDimensions {
  private widthMm: number;
  private heightMm: number;
  private dpi: number;
  private canvas: HTMLCanvasElement;
  private cssWidth: number;
  private cssHeight: number;

  constructor(widthMm: number, heightMm: number, canvas: HTMLCanvasElement) {
    this.widthMm = widthMm;
    this.heightMm = heightMm;
    this.canvas = canvas;
    this.dpi = this.getDevicePixelRatio();
    this.cssWidth = 0;
    this.cssHeight = 0;

    // Ensure canvas is sized before any WebGL operations
    this.updateCanvasSize();
    this.setupResizeHandler();
  }

  private getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  public updateCanvasSize(): void {
    // Convert physical dimensions to CSS pixels (96 DPI standard)
    const cssPixelsPerMm = 96 / 25.4; // 96 DPI is standard CSS pixel density
    this.cssWidth = Math.round(this.widthMm * cssPixelsPerMm);
    this.cssHeight = Math.round(this.heightMm * cssPixelsPerMm);

    // Set canvas size in CSS pixels
    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;

    // Set canvas buffer size accounting for device pixel ratio
    this.canvas.width = Math.round(this.cssWidth * this.dpi);
    this.canvas.height = Math.round(this.cssHeight * this.dpi);
  }

  private setupResizeHandler(): void {
    window.addEventListener("resize", () => {
      const newDpi = this.getDevicePixelRatio();
      if (newDpi !== this.dpi) {
        this.dpi = newDpi;
        this.updateCanvasSize();
      }
    });
  }

  // Convert physical coordinates (mm) to CSS coordinates
  public mmToCss(x: number, y: number): { x: number; y: number } {
    const cssPixelsPerMm = 96 / 25.4;
    return {
      x: x * cssPixelsPerMm,
      y: y * cssPixelsPerMm,
    };
  }

  // Convert physical coordinates (mm) to buffer coordinates
  public mmToBuffer(x: number, y: number): { x: number; y: number } {
    const cssCoords = this.mmToCss(x, y);
    return {
      x: cssCoords.x * this.dpi,
      y: cssCoords.y * this.dpi,
    };
  }

  // Get the current DPI
  public getDpi(): number {
    return this.dpi;
  }

  // Get the physical dimensions in mm
  public getPhysicalDimensions(): { width: number; height: number } {
    return {
      width: this.widthMm,
      height: this.heightMm,
    };
  }

  // Get the CSS dimensions in pixels (96 DPI)
  public getCssDimensions(): { width: number; height: number } {
    return {
      width: this.cssWidth,
      height: this.cssHeight,
    };
  }

  // Get the buffer dimensions in pixels (actual device pixels)
  public getBufferDimensions(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }
}
