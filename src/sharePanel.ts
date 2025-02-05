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
   * Converts the canvas to a PNG image (with the entered name drawn in the center) and downloads it.
   */
  private shareCanvas(): void {
    // Prompt the user to enter a name.
    const name = window.prompt("Enter your name:", "Your Name") || "";

    // Create an off-screen canvas to work on a copy so we don't alter the original.
    const tempCanvas = document.createElement("canvas");
    // Use the provided canvas dimensions if available, otherwise fallback to the canvas's own width and height.
    tempCanvas.width = this.canvasDimensions.width || this.canvas.width;
    tempCanvas.height = this.canvasDimensions.height || this.canvas.height;

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      console.error("Could not get canvas context.");
      return;
    }

    // Draw the original canvas onto the temporary canvas.
    tempCtx.drawImage(this.canvas, 0, 0);

    // Set text properties.
    const fontSize = 60;
    tempCtx.font = `${fontSize}px sans-serif`;
    tempCtx.textAlign = "center";
    tempCtx.textBaseline = "middle";

    // Calculate the center position.
    const centerX = tempCanvas.width / 2;
    const centerY = (tempCanvas.height / 2) + 35;

    // Only draw the text and background if a name was entered.
    if (name.trim().length > 0) {
      // Measure text dimensions.
      const textMetrics = tempCtx.measureText(name);
      // Calculate the text width and an approximate height.
      const textWidth = textMetrics.width;
      const textHeight = fontSize; // approximation

      // Define padding around the text for the background rectangle.
      const paddingX = 10;
      const paddingY = 5;

      // Set the rectangle's background color.
      tempCtx.fillStyle = "#535353";
      // Draw the rectangle centered around the text.
      tempCtx.fillRect(
        centerX - textWidth / 2 - paddingX,
        centerY - textHeight / 2 - paddingY,
        textWidth + paddingX * 2,
        textHeight + paddingY * 2
      );

      // Set the text color to white.
      tempCtx.fillStyle = "white";
      // Draw the text on top of the rectangle.
      tempCtx.fillText(name, centerX, centerY);
    }

    // Convert the modified canvas to a PNG data URL.
    const imageURL = tempCanvas.toDataURL('image/png');

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
