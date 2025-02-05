import { IHashMap } from "./globals";

export default class SharePanel {
  private shareButton: HTMLButtonElement;

  /**
   * @param canvas The canvas element to capture.
   * @param canvasDimensions An object containing the canvas dimensions.
   */
  constructor(private canvas: HTMLCanvasElement, private canvasDimensions: IHashMap<number>) {
    this.createShareButton();
  }

  /**
   * Creates an HTML button that downloads the canvas as a PNG when clicked.
   */
  private createShareButton(): void {
    // Create the button element.
    this.shareButton = document.createElement('button');
    this.shareButton.innerText = 'Share';

    // Position the button. Adjust styling as needed.
    this.shareButton.style.position = 'absolute';
    const canvasRect = this.canvas.getBoundingClientRect();
    // Position the button at the bottom center of the canvas.
    this.shareButton.style.left = `${canvasRect.left + canvasRect.width / 2 - 23}px`;
    this.shareButton.style.top = `${canvasRect.top + canvasRect.height + 20}px`;
    this.shareButton.style.padding = '5px 5px';
    this.shareButton.style.fontSize = '13px';

    // Append the button to the document body (or a different container if desired).
    document.body.appendChild(this.shareButton);

    // Attach the click handler that triggers the share logic.
    this.shareButton.addEventListener('click', () => {
      this.shareCanvas();
    });
  }

  /**
   * Converts the canvas to a PNG image and downloads it.
   */
  private shareCanvas(): void {
    // Convert the canvas to a PNG data URL.
    const imageURL = this.canvas.toDataURL('image/png');

    // Create a temporary anchor element to facilitate the download.
    const link = document.createElement('a');
    link.href = imageURL;
    link.download = 'game-snapshot.png';

    // Append, trigger the download, then remove the link.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Optionally remove the share button from the DOM (for example, on restart).
   */
  public remove(): void {
    if (this.shareButton && this.shareButton.parentNode) {
      this.shareButton.parentNode.removeChild(this.shareButton);
    }
  }
}
