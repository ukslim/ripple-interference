import { setupCounter } from "../counter";

describe("Counter", () => {
  it("initializes the counter with 0", () => {
    // Create a mock button
    const button = document.createElement("button");

    // Set up the counter
    setupCounter(button);

    // Check that the button's text has been set correctly
    expect(button.innerHTML).toBe("count is 0");
  });

  it("increments the counter when clicked", () => {
    // Create a mock button
    const button = document.createElement("button");

    // Set up the counter
    setupCounter(button);

    // Trigger a click event
    button.click();

    // Check that the counter was incremented
    expect(button.innerHTML).toBe("count is 1");
  });
});
