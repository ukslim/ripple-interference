import { PhysicalDimensions } from "./dimensions";

interface PointParameters {
  wavelength: number; // Wavelength in mm
  xOffset: number; // Offset from square corner in wavelengths
  yOffset: number; // Offset from square corner in wavelengths
}

export class InterferencePattern {
  private dimensions: PhysicalDimensions;
  private wavelength: number;
  private basePositions: { x: number; y: number }[];
  private gl!: WebGL2RenderingContext;
  private program!: WebGLProgram;

  // Vertex shader - just renders a full-screen quad
  private vertexShaderSource = `#version 300 es
    in vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  // Fragment shader - optimized interference pattern calculation
  private fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 fragColor;
    
    uniform vec2 resolution;
    uniform vec4 points[4];  // x, y, phase, wavelength
    uniform float decayRate;
    uniform float threshold;
    uniform float time;
    uniform float noiseFrequency;
    uniform float noiseAmplitude;
    uniform float hue;  // Hue in radians (0 to 2π)

    // Convert pixel distance to millimeters (96 DPI = 96/25.4 pixels per mm)
    float pixelToMm(float pixelDist) {
      return pixelDist * (25.4 / 96.0);
    }

    // Optimized distance calculation
    float fastDistance(vec2 a, vec2 b) {
      vec2 diff = a - b;
      return dot(diff, diff);
    }

    void main() {
      // Flip Y coordinate to match browser's coordinate system
      vec2 pos = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y);
      float value = 0.0;

      // Pre-calculate common values
      vec2 noiseCoord = pos * noiseFrequency;
      float noiseBase = sin(noiseCoord.x + noiseCoord.y) * noiseAmplitude;

      // Process all points in a single loop
      for (int i = 0; i < 4; i++) {
        vec2 pointPos = points[i].xy;
        float phase = points[i].z;
        float wavelength = points[i].w;
        float frequency = 6.28318530718 / wavelength; // Convert wavelength to frequency (2π/λ)
        
        float distSq = fastDistance(pos, pointPos);
        float dist = sqrt(distSq);
        float distMm = pixelToMm(dist);
        
        float amplitude = exp(-distMm * decayRate);
        float modFreq = frequency + sin(dist * 0.002) * 0.01;
        float wave = sin(dist * modFreq + phase + time) * amplitude;
        float noise = noiseBase * amplitude;
        
        value += wave + noise;
      }

      // Optimized color calculation
      value = (value / 4.0 + 1.0) / 2.0;
      value = pow(value, 1.5);
      value = value < 0.5 ? value * 0.8 : value * 1.2;
      value = value > threshold ? 1.0 : 0.0;

      // Convert HSV to RGB using smooth trigonometric functions
      float h = hue;
      float s = 1.0;
      float v = value;
      
      float c = v * s;
      float x = c * (1.0 - abs(mod(h / (2.0 * 3.14159), 2.0) - 1.0));
      float m = v - c;
      
      // Use smooth trigonometric functions for RGB components
      float r = c * (1.0 + cos(h)) / 2.0;
      float g = c * (1.0 + cos(h - 2.0 * 3.14159 / 3.0)) / 2.0;
      float b = c * (1.0 + cos(h - 4.0 * 3.14159 / 3.0)) / 2.0;
      
      fragColor = vec4(r + m, g + m, b + m, 1.0);
    }
  `;

  constructor(widthMm: number, heightMm: number, canvas: HTMLCanvasElement) {
    this.dimensions = new PhysicalDimensions(widthMm, heightMm, canvas);
    this.wavelength = (2 * Math.PI) / 0.15;

    // Calculate square dimensions in physical units
    const physicalDims = this.dimensions.getPhysicalDimensions();
    const margin = physicalDims.width * 0.2;
    const squareSize = physicalDims.width - 2 * margin;
    const squareTop =
      (physicalDims.height - squareSize) / 2 - physicalDims.height / 9;

    // Initialize 4 points in a roughly square pattern
    this.basePositions = [
      { x: margin, y: squareTop }, // Top Left
      { x: physicalDims.width - margin, y: squareTop }, // Top Right
      { x: margin, y: squareTop + squareSize }, // Bottom Left
      { x: physicalDims.width - margin, y: squareTop + squareSize }, // Bottom Right
    ];

    // Initialize WebGL2 with the provided canvas
    this.initWebGL(canvas);
  }

  private initWebGL(canvas: HTMLCanvasElement): void {
    // Get WebGL2 context with proper options
    this.gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      depth: false,
      desynchronized: true,
      failIfMajorPerformanceCaveat: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: false,
      premultipliedAlpha: false,
      stencil: false,
    })!;

    if (!this.gl) {
      throw new Error("WebGL2 not supported");
    }

    // Create and compile shaders
    const vertexShader = this.createShader(
      this.gl.VERTEX_SHADER,
      this.vertexShaderSource
    );
    const fragmentShader = this.createShader(
      this.gl.FRAGMENT_SHADER,
      this.fragmentShaderSource
    );

    // Create program
    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vertexShader);
    this.gl.attachShader(this.program, fragmentShader);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      throw new Error("Failed to link shader program");
    }

    // Create vertex buffer for full-screen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // Set up attributes and uniforms
    const positionLocation = this.gl.getAttribLocation(
      this.program,
      "position"
    );
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(
      positionLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );

    // Set up resolution uniform
    const resolutionLocation = this.gl.getUniformLocation(
      this.program,
      "resolution"
    );
    this.gl.useProgram(this.program);
    const bufferDims = this.dimensions.getBufferDimensions();
    this.gl.uniform2f(resolutionLocation, bufferDims.width, bufferDims.height);

    // Set initial noise parameters
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "noiseFrequency")!,
      0.2
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "noiseAmplitude")!,
      0.05
    );
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(
        "Shader compilation failed: " + this.gl.getShaderInfoLog(shader)
      );
    }

    return shader;
  }

  public generate(
    pointParams: [
      PointParameters,
      PointParameters,
      PointParameters,
      PointParameters
    ],
    decayRate: number = 0.001,
    threshold: number = 0.5,
    time: number = 0,
    noiseFrequency: number = 0.2,
    noiseAmplitude: number = 0.05,
    hue: number = 0
  ): void {
    // Update points uniforms
    const pointsLocation = this.gl.getUniformLocation(this.program, "points");
    const points = pointParams.map((params, i) => {
      const physicalPos = this.basePositions[i];
      const bufferPos = this.dimensions.mmToBuffer(
        physicalPos.x + params.xOffset * this.wavelength,
        physicalPos.y + params.yOffset * this.wavelength
      );
      const phase = (i * Math.PI) / 2;
      return [bufferPos.x, bufferPos.y, phase, params.wavelength];
    });
    this.gl.uniform4fv(pointsLocation, points.flat());

    // Update other uniforms
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "decayRate")!,
      decayRate
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "threshold")!,
      threshold
    );
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, "time")!, time);
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "noiseFrequency")!,
      noiseFrequency
    );
    this.gl.uniform1f(
      this.gl.getUniformLocation(this.program, "noiseAmplitude")!,
      noiseAmplitude
    );
    this.gl.uniform1f(this.gl.getUniformLocation(this.program, "hue")!, hue);

    // Render
    const bufferDims = this.dimensions.getBufferDimensions();
    this.gl.viewport(0, 0, bufferDims.width, bufferDims.height);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
