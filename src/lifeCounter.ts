import { IS_HIDPI } from "./globals";

/**
 * Displays the player's remaining lives as a single-digit number.
 * The counter is drawn using the sprite sheet and is positioned
 * below the DistanceMeter, with a heart emoji drawn next to it.
 */
export default class LifeCounter {
  private static readonly dimensions = {
    WIDTH: 10,
    HEIGHT: 13,
    DEST_WIDTH: 11,
  };

  // Offset in pixels for the heart emoji relative to the life digit.
  // The heart is drawn to the left of the digit.
  private static readonly HEART_OFFSET = 20;

  private canvasCtx: CanvasRenderingContext2D;
  private x: number;
  private y: number;
  private currentLives: number = 3; // default starting lives

  /**
   * @param canvas The canvas element to draw on.
   * @param image The sprite sheet image containing the digit graphics.
   * @param canvasWidth The width of the canvas.
   *
   * This constructor sets the x position similar to DistanceMeter and
   * places the LifeCounter below the DistanceMeter (assuming DistanceMeter
   * is drawn at y=5 with a height of 13 and a 10px margin below it).
   */
  constructor(
    private canvas: HTMLCanvasElement,
    private image: HTMLImageElement,
    canvasWidth: number
  ) {
    this.canvasCtx = canvas.getContext("2d");

    // Align horizontally similar to DistanceMeter.
    // DistanceMeter positions itself with:
    //   x = canvasWidth - (DEST_WIDTH * (MAX_DISTANCE_UNITS + 1))
    // For a single digit, we use a fixed margin.
    this.x = canvasWidth - LifeCounter.dimensions.DEST_WIDTH - 10;

    // Position vertically: DistanceMeter's y is 5 and height is 13.
    // Placing LifeCounter 10px below DistanceMeter.
    this.y = 5 + 13 + 10;

    // Draw the initial life counter.
    this.draw();
  }

  /**
   * Update the life counter and redraw.
   * @param newLives The new life count (expected to be a single digit).
   */
  public update(newLives: number): void {
    this.currentLives = newLives;
    this.draw();
  }

  /**
   * Draw the life counter and heart emoji.
   */
  private draw(): void {
    // Clear the area covering both the heart and the digit.
    // We clear a rectangle starting from (x - HEART_OFFSET) with width covering the heart and digit.
    const clearX = this.x - LifeCounter.HEART_OFFSET;
    const clearWidth = LifeCounter.HEART_OFFSET + LifeCounter.dimensions.WIDTH;
    this.canvasCtx.clearRect(
      clearX,
      this.y,
      clearWidth,
      LifeCounter.dimensions.HEIGHT
    );
    this.drawDigit(this.currentLives);
    this.drawHeart();
  }

  /**
   * Draw the single digit representing the lives.
   * @param value The digit (0-9) to display.
   */
  private drawDigit(value: number): void {
    let sourceX = LifeCounter.dimensions.WIDTH * value;
    let sourceWidth = LifeCounter.dimensions.WIDTH;
    let sourceHeight = LifeCounter.dimensions.HEIGHT;

    // Adjust for high DPI displays.
    if (IS_HIDPI) {
      sourceX *= 2;
      sourceWidth *= 2;
      sourceHeight *= 2;
    }

    this.canvasCtx.drawImage(
      this.image,
      sourceX,
      0,
      sourceWidth,
      sourceHeight,
      this.x,
      this.y,
      LifeCounter.dimensions.WIDTH,
      LifeCounter.dimensions.HEIGHT
    );
  }

  /**
   * Draw a heart emoji to the left of the life counter.
   */
  private drawHeart(): void {
    // The heart emoji is drawn as text.
    const heart = "🖤";
    // Position the heart a fixed distance to the left of the life digit.
    const heartX = this.x - LifeCounter.HEART_OFFSET;
    // Align vertically to the top of the life counter.
    const heartY = this.y;

    // Set font size and style to match the counter height.
    // Adjust font family as needed.
    this.canvasCtx.font = `${LifeCounter.dimensions.HEIGHT}px sans-serif`;
    this.canvasCtx.textBaseline = "top";

    this.canvasCtx.fillText(heart, heartX, heartY);
  }
}
