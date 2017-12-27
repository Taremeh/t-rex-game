import CollisionBox from "./collisionBox";
import Runner from "./runner";
import { IHashMap, FPS, getTimeStamp, IS_HIDPI } from "./globals";

export default class Trex {
  private canvasCtx: CanvasRenderingContext2D;
  public xPos: number = 0;
  public yPos: number = 0;
  // Position when on the ground.
  private groundYPos: number = 0;
  private currentFrame: number = 0;
  private currentAnimFrames: number[] = [];
  private blinkDelay: number = 0;
  private animStartTime: number = 0;
  private timer: number = 0;
  private msPerFrame: number = 1000 / FPS;
  public config: any = Trex.config;
  // Current status.
  public status: string = Trex.status.WAITING;
  public jumping: boolean = false;
  private jumpVelocity: number = 0;
  private reachedMinHeight: boolean = false;
  public speedDrop: boolean = false;
  public jumpCount: number = 0;
  private jumpspotX: number = 0;
  private minJumpHeight: number;
  public playingIntro: boolean = false;
  private midair: boolean = false;
  /**
   * T-rex player config.
   */
  public static readonly config: IHashMap<number> = {
    DROP_VELOCITY: -5,
    GRAVITY: 0.6,
    HEIGHT: 47,
    INIITAL_JUMP_VELOCITY: -10,
    INTRO_DURATION: 1500,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    SPEED_DROP_COEFFICIENT: 3,
    SPRITE_WIDTH: 262,
    START_X_POS: 50,
    WIDTH: 44
  };
  /**
   * Used in collision detection.
   * @type {Array.<CollisionBox>}
   */
  public static readonly collisionBoxes = [
    new CollisionBox(1, -1, 30, 26),
    new CollisionBox(32, 0, 8, 16),
    new CollisionBox(10, 35, 14, 8),
    new CollisionBox(1, 24, 29, 5),
    new CollisionBox(5, 30, 21, 4),
    new CollisionBox(9, 34, 15, 4)
  ];
  /**
   * Animation states.
   */
  public static readonly status: IHashMap<string> = {
    CRASHED: 'CRASHED',
    JUMPING: 'JUMPING',
    RUNNING: 'RUNNING',
    WAITING: 'WAITING'
  };
  /**
   * Blinking coefficient.
   */
  private static readonly BLINK_TIMING = 7000;
  /**
   * Animation config for different states.
   */
  private static readonly animFrames: IHashMap<{ frames: number[], msPerFrame: number }> = {
    WAITING: {
      frames: [44, 0],
      msPerFrame: 1000 / 3
    },
    RUNNING: {
      frames: [88, 132],
      msPerFrame: 1000 / 12
    },
    CRASHED: {
      frames: [220],
      msPerFrame: 1000 / 60
    },
    JUMPING: {
      frames: [0],
      msPerFrame: 1000 / 60
    }
  };
  constructor(private canvas: HTMLCanvasElement, private image: HTMLImageElement) {
    this.init();
  };
  /**
   * T-rex player initaliser.
   * Sets the t-rex to blink at random intervals.
   */
  private init() {
    this.canvasCtx = this.canvas.getContext('2d');
    this.setBlinkDelay();
    this.groundYPos = Runner.defaultDimensions.HEIGHT - this.config.HEIGHT - Runner.config.BOTTOM_PAD;
    this.yPos = this.groundYPos;
    this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;
    this.draw(0, 0);
    this.update(0, Trex.status.WAITING);
  }
  /**
   * Setter for the jump velocity.
   * The approriate drop velocity is also set.
   */
  public setJumpVelocity(setting: any) {
    this.config.INIITAL_JUMP_VELOCITY = -setting;
    this.config.DROP_VELOCITY = -setting / 2;
  }
  /**
   * Set the animation status.
   * @param {!number} deltaTime
   * @param {Trex.status} status Optional status to switch to.
   */
  public update(deltaTime: number, opt_status?: string) {
    this.timer += deltaTime;
    // Update the status.
    if (opt_status) {
      this.status = opt_status;
      this.currentFrame = 0;
      this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
      this.currentAnimFrames = Trex.animFrames[opt_status].frames;
      if (opt_status == Trex.status.WAITING) {
        this.animStartTime = getTimeStamp();
        this.setBlinkDelay();
      }
    }
    // Game intro animation, T-rex moves in from the left.
    if (this.playingIntro && this.xPos < this.config.START_X_POS) {
      this.xPos += Math.round((this.config.START_X_POS /
        this.config.INTRO_DURATION) * deltaTime);
    }
    if (this.status == Trex.status.WAITING) {
      this.blink(getTimeStamp());
    } else {
      this.draw(this.currentAnimFrames[this.currentFrame], 0);
    }
    // Update the frame position.
    if (this.timer >= this.msPerFrame) {
      this.currentFrame = this.currentFrame ==
        this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
      this.timer = 0;
    }
  }
  /**
   * Draw the t-rex to a particular position.
   * @param {number} x
   * @param {number} y
   */
  public draw(x: number, y: number) {
    var sourceX = x;
    var sourceY = y;
    var sourceWidth = this.config.WIDTH;
    var sourceHeight = this.config.HEIGHT;
    if (IS_HIDPI) {
      sourceX *= 2;
      sourceY *= 2;
      sourceWidth *= 2;
      sourceHeight *= 2;
    }
    this.canvasCtx.drawImage(this.image, sourceX, sourceY,
      sourceWidth, sourceHeight,
      this.xPos, this.yPos,
      this.config.WIDTH, this.config.HEIGHT);
  }
  /**
   * Sets a random time for the blink to happen.
   */
  private setBlinkDelay() {
    this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
  }
  /**
   * Make t-rex blink at random intervals.
   * @param {number} time Current time in milliseconds.
   */
  private blink(time: number) {
    var deltaTime = time - this.animStartTime;
    if (deltaTime >= this.blinkDelay) {
      this.draw(this.currentAnimFrames[this.currentFrame], 0);
      if (this.currentFrame == 1) {
        // Set new random delay to blink.
        this.setBlinkDelay();
        this.animStartTime = time;
      }
    }
  }
  /**
   * Initialise a jump.
   */
  public startJump() {
    if (!this.jumping) {
      this.update(0, Trex.status.JUMPING);
      this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY;
      this.jumping = true;
      this.reachedMinHeight = false;
      this.speedDrop = false;
    }
  }
  /**
   * Jump is complete, falling down.
   */
  public endJump() {
    if (this.reachedMinHeight &&
      this.jumpVelocity < this.config.DROP_VELOCITY) {
      this.jumpVelocity = this.config.DROP_VELOCITY;
    }
  }
  /**
   * Update frame for a jump.
   * @param {number} deltaTime
   */
  public updateJump(deltaTime: number) {
    var msPerFrame = Trex.animFrames[this.status].msPerFrame;
    var framesElapsed = deltaTime / msPerFrame;
    // Speed drop makes Trex fall faster.
    if (this.speedDrop) {
      this.yPos += Math.round(this.jumpVelocity *
        this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
    } else {
      this.yPos += Math.round(this.jumpVelocity * framesElapsed);
    }
    this.jumpVelocity += this.config.GRAVITY * framesElapsed;
    // Minimum height has been reached.
    if (this.yPos < this.minJumpHeight || this.speedDrop) {
      this.reachedMinHeight = true;
    }
    // Reached max height
    if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
      this.endJump();
    }
    // Back down at ground level. Jump completed.
    if (this.yPos > this.groundYPos) {
      this.reset();
      this.jumpCount++;
    }
    this.update(deltaTime);
  }
  /**
   * Set the speed drop. Immediately cancels the current jump.
   */
  public setSpeedDrop() {
    this.speedDrop = true;
    this.jumpVelocity = 1;
  }
  /**
   * Reset the t-rex to running at start of game.
   */
  public reset() {
    this.yPos = this.groundYPos;
    this.jumpVelocity = 0;
    this.jumping = false;
    this.update(0, Trex.status.RUNNING);
    this.midair = false;
    this.speedDrop = false;
    this.jumpCount = 0;
  }
}