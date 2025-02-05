import { IS_HIDPI } from "./globals";

/**
 * Displays the player's remaining lives as a single-digit number.
 * Positioned below the DistanceMeter.
 */
export default class LifeCounter {
  private static readonly dimensions = {
    WIDTH: 10,
    HEIGHT: 13,
    DEST_WIDTH: 11,
  };

  private canvasCtx: CanvasRenderingContext2D;
  private x: number;
  private y: number;
  private currentLives: number = 3; // Default starting lives

  /**
   * @param canvas The canvas to draw on.
   * @param image The sprite sheet containing digit graphics.
   * @param canvasWidth Width of the canvas.
   * @param distanceMeterY Y position of the DistanceMeter.
   * @param distanceMeterHeight Height of the DistanceMeter.
   */
  constructor(
    private canvas: HTMLCanvasElement,
    private image: HTMLImageElement,
    canvasWidth: number,
    distanceMeterY: number,
    distanceMeterHeight: number
  ) {
    this.canvasCtx = canvas.getContext("2d");
    this.x = canvasWidth - LifeCounter.dimensions.DEST_WIDTH - 10; // Align with DistanceMeter
    this.y = distanceMeterY + distanceMeterHeight + 10; // Position below DistanceMeter
    this.draw();
  }

  /**
   * Update the life counter and redraw.
   * @param newLives The new life count (1-9).
   */
  public update(newLives: number): void {
    this.currentLives = newLives;
    this.draw();
  }

  /**
   * Draw the life counter.
   */
  private draw(): void {
    this.canvasCtx.clearRect(this.x, this.y, LifeCounter.dimensions.WIDTH, LifeCounter.dimensions.HEIGHT);
    this.drawDigit(this.currentLives);
  }

  /**
   * Draw the current lives as a single digit.
   * @param value The digit (1-9) to display.
   */
  private drawDigit(value: number): void {
    let sourceX = LifeCounter.dimensions.WIDTH * value;
    let width = LifeCounter.dimensions.WIDTH;
    let height = LifeCounter.dimensions.HEIGHT;

    if (IS_HIDPI) {
      sourceX *= 2;
      width *= 2;
      height *= 2;
    }

    this.canvasCtx.drawImage(
      this.image,
      sourceX,
      0,
      width,
      height,
      this.x,
      this.y,
      LifeCounter.dimensions.WIDTH,
      LifeCounter.dimensions.HEIGHT
    );
  }
}
