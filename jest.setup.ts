// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
import "@testing-library/jest-dom";
import "jest-canvas-mock";

// Add custom matchers
import { expect } from "@jest/globals";

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

expect.extend({
  toHaveSimilarImageData(
    received: Uint8ClampedArray,
    expected: Uint8ClampedArray,
    options = {}
  ) {
    const threshold = options.threshold || 0.1; // Default threshold for pixel differences
    const maxDiffPercentage = options.diffPercentage || 0.1; // Default max percentage of different pixels (0.1%)

    // Check if arrays have the same length
    if (received.length !== expected.length) {
      return {
        message: () =>
          `Image data has different sizes: ${received.length} vs ${expected.length}`,
        pass: false,
      };
    }

    let diffCount = 0;

    // Compare each pixel with a threshold
    for (let i = 0; i < received.length; i += 4) {
      const rDiff = Math.abs(received[i] - expected[i]);
      const gDiff = Math.abs(received[i + 1] - expected[i + 1]);
      const bDiff = Math.abs(received[i + 2] - expected[i + 2]);
      const aDiff = Math.abs(received[i + 3] - expected[i + 3]);

      // If any channel differs more than the threshold, count it as a different pixel
      if (
        rDiff > threshold * 255 ||
        gDiff > threshold * 255 ||
        bDiff > threshold * 255 ||
        aDiff > threshold * 255
      ) {
        diffCount++;
      }
    }

    // Calculate percentage of different pixels
    const pixelCount = received.length / 4;
    const diffPercentage = (diffCount / pixelCount) * 100;

    const pass = diffPercentage <= maxDiffPercentage * 100;

    return {
      message: () =>
        pass
          ? `Images are similar enough. Different pixels: ${diffCount} (${diffPercentage.toFixed(
              4
            )}%)`
          : `Images differ too much. Different pixels: ${diffCount} (${diffPercentage.toFixed(
              4
            )}%)`,
      pass,
    };
  },
});
