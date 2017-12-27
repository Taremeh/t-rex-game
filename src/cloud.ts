import { getRandomNum, IS_HIDPI } from "./globals";
/**
* Cloud background item.
* Similar to an obstacle object but without collision boxes.
* @param {HTMLCanvasElement} canvas Canvas element.
* @param {Image} cloudImg
* @param {number} containerWidth
*/
export default class Cloud {
    /**
    * Cloud object config.
    */
    private static readonly config = {
        HEIGHT: 14,
        MAX_CLOUD_GAP: 400,
        MAX_SKY_LEVEL: 30,
        MIN_CLOUD_GAP: 100,
        MIN_SKY_LEVEL: 71,
        WIDTH: 46
    };
    private canvasCtx: CanvasRenderingContext2D
    public xPos: number = 0;
    private yPos: number = getRandomNum(Cloud.config.MAX_SKY_LEVEL,
        Cloud.config.MIN_SKY_LEVEL);
    public remove: boolean = false;
    public cloudGap = getRandomNum(Cloud.config.MIN_CLOUD_GAP,
        Cloud.config.MAX_CLOUD_GAP);
    constructor(private canvas: HTMLCanvasElement, private image: HTMLImageElement, private containerWidth: number) {
        this.canvasCtx = this.canvas.getContext('2d');
        this.xPos = containerWidth;
        this.init();
    }
    /**
     * Initialise the cloud. Sets the Cloud height.
     */
    private init() {
        this.draw();
    }
    /**
     * Draw the cloud.
     */
    private draw() {
        this.canvasCtx.save();
        var sourceWidth = Cloud.config.WIDTH;
        var sourceHeight = Cloud.config.HEIGHT;
        if (IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
        this.canvasCtx.drawImage(this.image, 0, 0,
            sourceWidth, sourceHeight,
            this.xPos, this.yPos,
            Cloud.config.WIDTH, Cloud.config.HEIGHT);
        this.canvasCtx.restore();
    }
    /**
     * Update the cloud position.
     */
    public update(speed: number) {
        if (!this.remove) {
            this.xPos -= Math.ceil(speed);
            this.draw();
            // Mark as removeable if no longer in the canvas.
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    }
    /**
     * Check if the cloud is visible on the stage.
     * @return {boolean}
     */
    private isVisible(): boolean {
        return this.xPos + Cloud.config.WIDTH > 0;
    }
}