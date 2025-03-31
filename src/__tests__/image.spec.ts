import { jest } from "@jest/globals";
import { InterferencePattern } from "../image";
import { InterferencePatternNew } from "../imageNew";
import { generateWithOffsets } from "../legacyWrapper";

// Extended to include our custom matcher
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveSimilarImageData(
        expected: Uint8ClampedArray,
        options?: { threshold?: number; diffPercentage?: number }
      ): R;
    }
  }
}

describe("Image Interference Pattern", () => {
  // Common test parameters
  const canvasWidth = 300;
  const canvasHeight = 200;
  const pointParams = Array(4).fill({
    wavelength: 10,
    xOffset: 0.5,
    yOffset: 0.5,
  }) as [
    { wavelength: number; xOffset: number; yOffset: number },
    { wavelength: number; xOffset: number; yOffset: number },
    { wavelength: number; xOffset: number; yOffset: number },
    { wavelength: number; xOffset: number; yOffset: number }
  ];

  // Test parameters variations to try different scenarios
  const testCases = [
    {
      name: "default parameters",
      params: {
        decayRate: 0.001,
        threshold: 0.5,
        time: 0,
        noiseFrequency: 0.2,
        noiseAmplitude: 0.05,
        hue: 0,
      },
    },
    {
      name: "different decay",
      params: {
        decayRate: 0.002,
        threshold: 0.5,
        time: 0,
        noiseFrequency: 0.2,
        noiseAmplitude: 0.05,
        hue: 0,
      },
    },
    {
      name: "different time",
      params: {
        decayRate: 0.001,
        threshold: 0.5,
        time: 1.5,
        noiseFrequency: 0.2,
        noiseAmplitude: 0.05,
        hue: 0,
      },
    },
    {
      name: "different hue",
      params: {
        decayRate: 0.001,
        threshold: 0.5,
        time: 0,
        noiseFrequency: 0.2,
        noiseAmplitude: 0.05,
        hue: Math.PI / 3,
      },
    },
  ];

  // Create a mock WebGL rendering context that captures the rendering commands
  // but actually renders to a 2D canvas for comparison
  const createMockRenderingContext = (
    width: number,
    height: number,
    context2d: CanvasRenderingContext2D
  ) => {
    // Create a simple pattern rendering function that mimics what WebGL would do
    // This simulates the WebGL rendering for testing purposes
    const renderPattern = (
      points: number[],
      decayRate: number,
      threshold: number,
      time: number,
      noiseFrequency: number,
      noiseAmplitude: number,
      hue: number
    ) => {
      // Clear the canvas first
      context2d.clearRect(0, 0, width, height);

      // Create an ImageData object to write pixel data
      const imageData = context2d.createImageData(width, height);
      const data = imageData.data;

      // Extract point coordinates from flattened array
      const pointCoords = [];
      for (let i = 0; i < points.length; i += 4) {
        pointCoords.push({
          x: points[i],
          y: points[i + 1],
          phase: points[i + 2],
          wavelength: points[i + 3],
        });
      }

      // Simplified rendering logic - doesn't need to match the shader exactly
      // as we're just comparing that both implementations give the same result
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;

          // Calculate interference value (simplified version of fragment shader logic)
          let value = 0;
          for (let i = 0; i < pointCoords.length; i++) {
            const point = pointCoords[i];
            const dx = x - point.x;
            const dy = y - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const distMm = dist * (25.4 / 96.0); // pixelToMm conversion
            const frequency = 6.28318530718 / point.wavelength;
            const amplitude = Math.exp(-distMm * decayRate);
            const wave =
              Math.sin(dist * frequency + point.phase + time) * amplitude;
            value += wave;
          }

          // Normalize and apply threshold (simplified version of shader logic)
          value = (value / 4.0 + 1.0) / 2.0;
          value = Math.pow(value, 1.5);
          value = value < 0.5 ? value * 0.8 : value * 1.2;
          value = value > threshold ? 1.0 : 0.0;

          // Convert to RGB using simplified HSV conversion
          let r, g, b;
          if (value > 0) {
            // Very simplified HSV to RGB conversion
            const h = (hue * 180) / Math.PI; // Convert to degrees
            const s = 1.0;
            const v = value;

            const hi = Math.floor(h / 60) % 6;
            const f = h / 60 - Math.floor(h / 60);
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);

            switch (hi) {
              case 0:
                r = v;
                g = t;
                b = p;
                break;
              case 1:
                r = q;
                g = v;
                b = p;
                break;
              case 2:
                r = p;
                g = v;
                b = t;
                break;
              case 3:
                r = p;
                g = q;
                b = v;
                break;
              case 4:
                r = t;
                g = p;
                b = v;
                break;
              case 5:
                r = v;
                g = p;
                b = q;
                break;
              default:
                r = v;
                g = t;
                b = p;
                break;
            }
          } else {
            r = g = b = 0;
          }

          // Set pixel data
          data[pixelIndex] = Math.round(r * 255);
          data[pixelIndex + 1] = Math.round(g * 255);
          data[pixelIndex + 2] = Math.round(b * 255);
          data[pixelIndex + 3] = 255; // Alpha
        }
      }

      // Put the image data back to the canvas
      context2d.putImageData(imageData, 0, 0);
    };

    // Create mock WebGL context
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

      // Add our rendering implementation
      _points: [] as number[],
      _decayRate: 0.001,
      _threshold: 0.5,
      _time: 0,
      _noiseFrequency: 0.2,
      _noiseAmplitude: 0.05,
      _hue: 0,

      // Override drawArrays to actually render
      drawArrays: jest.fn().mockImplementation(() => {
        renderPattern(
          mockWebGL._points,
          mockWebGL._decayRate,
          mockWebGL._threshold,
          mockWebGL._time,
          mockWebGL._noiseFrequency,
          mockWebGL._noiseAmplitude,
          mockWebGL._hue
        );
      }),

      // Constants
      VERTEX_SHADER: 1,
      FRAGMENT_SHADER: 2,
      ARRAY_BUFFER: 3,
      STATIC_DRAW: 4,
      TRIANGLE_STRIP: 5,
      LINK_STATUS: 6,
      COMPILE_STATUS: 7,
      FLOAT: 8,
    };

    // Override uniform setters to store values
    const originalUniform4fv = mockWebGL.uniform4fv;
    mockWebGL.uniform4fv = jest.fn().mockImplementation((location, data) => {
      // Use type assertion for data to fix Array.from error
      mockWebGL._points = Array.from(data as ArrayLike<number>);
      return originalUniform4fv.call(mockWebGL, location, data);
    });

    const originalUniform1f = mockWebGL.uniform1f;
    mockWebGL.uniform1f = jest.fn().mockImplementation((location, value) => {
      // Use string conversion and type assertion to address TypeScript issues
      const locationStr = String(location);

      // Try to determine which uniform is being set
      if (locationStr.includes("decayRate")) {
        mockWebGL._decayRate = value as number;
      } else if (locationStr.includes("threshold")) {
        mockWebGL._threshold = value as number;
      } else if (locationStr.includes("time")) {
        mockWebGL._time = value as number;
      } else if (locationStr.includes("noiseFrequency")) {
        mockWebGL._noiseFrequency = value as number;
      } else if (locationStr.includes("noiseAmplitude")) {
        mockWebGL._noiseAmplitude = value as number;
      } else if (locationStr.includes("hue")) {
        mockWebGL._hue = value as number;
      }
      return originalUniform1f.call(mockWebGL, location, value);
    });

    return mockWebGL;
  };

  // Mock for getImageData
  const createMockContext = (width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d")!;

    return { canvas, context };
  };

  // Create a test for each parameter set
  testCases.forEach(({ name, params }) => {
    it(`produces similar output between original and new implementation with ${name}`, () => {
      // Create mock canvases and contexts
      const { canvas: originalCanvas, context: originalContext } =
        createMockContext(canvasWidth, canvasHeight);
      const { canvas: newCanvas, context: newContext } = createMockContext(
        canvasWidth,
        canvasHeight
      );

      // Create mock WebGL contexts that render to the 2D contexts
      const mockWebGL = createMockRenderingContext(
        canvasWidth,
        canvasHeight,
        originalContext
      );
      const mockWebGLNew = createMockRenderingContext(
        canvasWidth,
        canvasHeight,
        newContext
      );

      // Use any to bypass TypeScript checks for Canvas mocking
      // @ts-ignore - In tests we can use more flexible typing
      originalCanvas.getContext = (contextId: string) => {
        if (contextId === "webgl2") return mockWebGL;
        return contextId === "2d" ? originalContext : null;
      };

      // @ts-ignore - In tests we can use more flexible typing
      newCanvas.getContext = (contextId: string) => {
        if (contextId === "webgl2") return mockWebGLNew;
        return contextId === "2d" ? newContext : null;
      };

      // Create instances of both implementations
      const original = new InterferencePattern(100, 100, originalCanvas);
      const newImpl = new InterferencePatternNew(100, 100, newCanvas);

      // Generate patterns with same parameters
      original.generate(
        pointParams,
        params.decayRate,
        params.threshold,
        params.time,
        params.noiseFrequency,
        params.noiseAmplitude,
        params.hue
      );

      // Use the wrapper method for the new implementation
      generateWithOffsets(
        newImpl,
        pointParams,
        params.decayRate,
        params.threshold,
        params.time,
        params.noiseFrequency,
        params.noiseAmplitude,
        params.hue
      );

      // Check that both implementations received the same parameters
      if (
        mockWebGL.uniform4fv.mock.calls.length > 0 &&
        mockWebGLNew.uniform4fv.mock.calls.length > 0
      ) {
        const originalPoints = mockWebGL._points;
        const newPoints = mockWebGLNew._points;

        for (let i = 0; i < originalPoints.length; i++) {
          expect(
            Math.abs(originalPoints[i] - newPoints[i])
          ).toBeLessThanOrEqual(0.0001);
        }
      }

      // Compare other uniform parameters
      expect(mockWebGL._decayRate).toBeCloseTo(mockWebGLNew._decayRate, 6);
      expect(mockWebGL._threshold).toBeCloseTo(mockWebGLNew._threshold, 6);
      expect(mockWebGL._time).toBeCloseTo(mockWebGLNew._time, 6);
      expect(mockWebGL._noiseFrequency).toBeCloseTo(
        mockWebGLNew._noiseFrequency,
        6
      );
      expect(mockWebGL._noiseAmplitude).toBeCloseTo(
        mockWebGLNew._noiseAmplitude,
        6
      );
      expect(mockWebGL._hue).toBeCloseTo(mockWebGLNew._hue, 6);

      // Now compare the actual rendered images
      const originalData = originalContext.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight
      ).data;
      const newData = newContext.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight
      ).data;

      // Use our custom matcher to compare the images with tolerance for small differences
      expect(originalData).toHaveSimilarImageData(newData, {
        threshold: 0.05, // 5% threshold for individual pixel difference
        diffPercentage: 0.5, // Allow up to 0.5% of pixels to be different
      });
    });
  });
});
