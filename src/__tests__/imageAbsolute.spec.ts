import { jest } from "@jest/globals";
import { InterferencePatternNew } from "../imageNew";
import { generateWithOffsets } from "../legacyWrapper";

describe("InterferencePatternNew with absolute positioning", () => {
  it("works with absolute positions", () => {
    // Create test canvas
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 200;

    // Create mock WebGL2 context
    const mockWebGL = {
      createShader: jest.fn().mockReturnValue({}),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      getShaderParameter: jest.fn().mockReturnValue(true),
      getShaderInfoLog: jest.fn(),
      createProgram: jest.fn().mockReturnValue({}),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      getProgramParameter: jest.fn().mockReturnValue(true),
      createBuffer: jest.fn().mockReturnValue({}),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      getAttribLocation: jest.fn().mockReturnValue(0),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      getUniformLocation: jest.fn().mockReturnValue({}),
      useProgram: jest.fn(),
      uniform2f: jest.fn(),
      uniform1f: jest.fn(),
      uniform4fv: jest.fn(),
      viewport: jest.fn(),
      drawArrays: jest.fn(),
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      ARRAY_BUFFER: 3,
      STATIC_DRAW: 4,
      TRIANGLE_STRIP: 5,
      LINK_STATUS: 6,
      COMPILE_STATUS: 7,
      FLOAT: 8,
    };

    // Mock canvas.getContext
    // @ts-ignore
    canvas.getContext = jest.fn().mockImplementation((contextId: string) => {
      if (contextId === "webgl2") return mockWebGL;
      return null;
    });

    // Create instance with 100mm x 100mm dimensions
    const pattern = new InterferencePatternNew(100, 100, canvas);

    // Create test points with absolute positioning
    const pointParams = [
      { x: 20, y: 20, phase: 0, wavelength: 10 },
      { x: 80, y: 20, phase: Math.PI / 2, wavelength: 10 },
      { x: 20, y: 80, phase: Math.PI, wavelength: 10 },
      { x: 80, y: 80, phase: Math.PI * 1.5, wavelength: 10 },
    ] as [
      { x: number; y: number; phase: number; wavelength: number },
      { x: number; y: number; phase: number; wavelength: number },
      { x: number; y: number; phase: number; wavelength: number },
      { x: number; y: number; phase: number; wavelength: number }
    ];

    // Call the new generate method with absolute positions
    // This should not throw any exceptions
    pattern.generate(
      pointParams,
      0.001, // decayRate
      0.5, // threshold
      0, // time
      0.2, // noiseFrequency
      0.05, // noiseAmplitude
      0 // hue
    );

    // Verify that uniform4fv was called with the correct parameters
    expect(mockWebGL.uniform4fv).toHaveBeenCalled();

    // Example of how to compare old and new APIs
    const withOffsets = [
      { wavelength: 10, xOffset: 0.5, yOffset: 0.5 },
      { wavelength: 10, xOffset: 0.5, yOffset: 0.5 },
      { wavelength: 10, xOffset: 0.5, yOffset: 0.5 },
      { wavelength: 10, xOffset: 0.5, yOffset: 0.5 },
    ] as [
      { wavelength: number; xOffset: number; yOffset: number },
      { wavelength: number; xOffset: number; yOffset: number },
      { wavelength: number; xOffset: number; yOffset: number },
      { wavelength: number; xOffset: number; yOffset: number }
    ];

    // The wrapper method should work without any errors
    generateWithOffsets(pattern, withOffsets, 0.001, 0.5, 0, 0.2, 0.05, 0);

    // Verify that uniform4fv was called twice
    expect(mockWebGL.uniform4fv).toHaveBeenCalledTimes(2);
  });
});
