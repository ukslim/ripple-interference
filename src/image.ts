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
    uniform vec4 points[4];  // x, y, phase, frequency
    uniform float decayRate;
    uniform float threshold;
    uniform float time;

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
      vec2 noiseCoord = pos * 0.2;
      float noiseBase = sin(noiseCoord.x + noiseCoord.y) * 0.05;

      // Process all points in a single loop
      for (int i = 0; i < 4; i++) {
        vec2 pointPos = points[i].xy;
        float phase = points[i].z;
        float frequency = points[i].w;
        
        float distSq = fastDistance(pos, pointPos);
        float dist = sqrt(distSq);
        
        float amplitude = exp(-dist * decayRate);
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

      fragColor = vec4(255.0 * value, 120.0 * value, 0.0, 255.0) / 255.0;
    }
  `;

  constructor(width: number, height: number, canvas: HTMLCanvasElement) {
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

    // Initialize WebGL2 with the provided canvas
    this.initWebGL(canvas);
  }

  private initWebGL(canvas: HTMLCanvasElement): void {
    // Use WebGL2 context
    this.gl = canvas.getContext("webgl2")!;

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
    this.gl.uniform2f(resolutionLocation, this.width, this.height);
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
    time: number = 0
  ): void {
    // Update points uniforms
    const pointsLocation = this.gl.getUniformLocation(this.program, "points");
    const points = pointParams.map((params, i) => {
      const x = this.basePositions[i].x + params.xOffset * this.wavelength;
      const y = this.basePositions[i].y + params.yOffset * this.wavelength;
      const phase = (i * Math.PI) / 2;
      return [x, y, phase, params.frequency];
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

    // Render
    this.gl.viewport(0, 0, this.width, this.height);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
}
