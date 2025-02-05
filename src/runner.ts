import { DEFAULT_WIDTH, IHashMap, IS_HIDPI, IS_MOBILE, FPS, IS_IOS, getTimeStamp, getRandomNum } from "./globals";
import Trex from "./tRex";
import Horizon from "./horizon";
import DistanceMeter from "./distanceMeter";
import GameOverPanel from "./gameOverPanel";
import { checkForCollision } from "./collision";
import SharePanel from "./sharePanel";

interface RunnerConfig {
  ACCELERATION: number,
  BG_CLOUD_SPEED: number,
  BOTTOM_PAD: number,
  CLEAR_TIME: number,
  CLOUD_FREQUENCY: number,
  GAMEOVER_CLEAR_TIME: number,
  GAP_COEFFICIENT: number,
  GRAVITY: number,
  INITIAL_JUMP_VELOCITY: number,
  MAX_CLOUDS: number,
  MAX_OBSTACLE_LENGTH: number,
  MAX_SPEED: number,
  MIN_JUMP_HEIGHT: number,
  MOBILE_SPEED_COEFFICIENT: number,
  RESOURCE_TEMPLATE_ID: string,
  SPEED: number,
  SPEED_DROP_COEFFICIENT: number,
  [index: string]: string | number;
}

export default class Runner implements EventListenerObject {
  public static readonly config: RunnerConfig = {
    ACCELERATION: 0.001, // Acceleration of T-Rex
    BG_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: 10, // Bottom padding of canvas
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    GAMEOVER_CLEAR_TIME: 750,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_CLOUDS: 6,
    MAX_OBSTACLE_LENGTH: 3,
    MAX_SPEED: 12,
    MIN_JUMP_HEIGHT: 35,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    RESOURCE_TEMPLATE_ID: 'audio-resources',
    SPEED: 6,
    SPEED_DROP_COEFFICIENT: 3
  };
  /**
   * Key code mapping.
   * @enum {object}
   */
  private static readonly keycodes: any = {
    JUMP: { '38': 1, '32': 1 }, // Up, spacebar
    DUCK: { '40': 1 }, // Down
    RESTART: { '13': 1 } // Enter
  };
  /**
   * Runner event names.
   * @enum {string}
   */
  private static readonly events: any = {
    ANIM_END: 'webkitAnimationEnd',
    CLICK: 'click',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    MOUSEDOWN: 'mousedown',
    MOUSEUP: 'mouseup',
    RESIZE: 'resize',
    TOUCHEND: 'touchend',
    TOUCHSTART: 'touchstart',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
    FOCUS: 'focus',
    LOAD: 'load'
  };

  private static _instance: Runner = null;
  private outerContainerEl: HTMLElement = null;
  private containerEl: HTMLElement = null;
  private horizon: Horizon = null;
  private touchController: HTMLDivElement = null;

  private config = Runner.config;
  private dimensions = Runner.defaultDimensions;
  private canvas: HTMLCanvasElement = null;
  private canvasCtx: CanvasRenderingContext2D = null;
  private tRex: Trex = null;
  private distanceMeter: DistanceMeter = null;
  private distanceRan: number = 0;
  private highestScore: number = 0;
  private time: number = 0;
  private runningTime: number = 0;
  private msPerFrame: number = 1000 / FPS;
  private currentSpeed: number = Runner.config.SPEED;
  private obstacles: string[] = [];
  private started: boolean = false;
  private activated: boolean = false;
  private crashed: boolean = false;
  private paused: boolean = false;
  private resizeTimerId_: number = null;
  private playCount: number = 0;
  private gameOverPanel: GameOverPanel = null;
  private sharePanel: SharePanel = null;
  private playingIntro: boolean = false;
  private drawPending: boolean = false;
  private raqId: number = 0;
  // Sound FX.
  private audioBuffer: AudioBuffer = null;
  private soundFx: IHashMap<AudioBuffer> = {};
  // Global web audio context for playing sounds.
  private audioContext: AudioContext = null;
  // Images.
  private images: IHashMap<HTMLImageElement> = {};
  private imagesLoaded: number = 0;

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  /**
   * Game initialiser.
   */
  private init() {
    this.adjustDimensions();
    this.setSpeed();
    this.containerEl = document.createElement('div');
    this.containerEl.className = Runner.classes.CONTAINER;
    this.containerEl.style.width = "44px";
    // Player canvas container.
    this.canvas = Runner.createCanvas(this.containerEl, this.dimensions.WIDTH,
      this.dimensions.HEIGHT, Runner.classes.PLAYER);
    this.canvasCtx = this.canvas.getContext('2d');
    this.canvasCtx.fillStyle = '#f7f7f7';
    this.canvasCtx.fill();
    Runner.updateCanvasScaling(this.canvas);
    // Horizon contains clouds, obstacles and the ground.
    this.horizon = new Horizon(this.canvas, this.images, this.dimensions,
      this.config.GAP_COEFFICIENT);
    // Distance meter
    this.distanceMeter = new DistanceMeter(this.canvas,
      this.images.TEXT_SPRITE, this.dimensions.WIDTH);
    // Draw t-rex
    this.tRex = new Trex(this.canvas, this.images.TREX);
    this.outerContainerEl.appendChild(this.containerEl);
    if (IS_MOBILE) {
      this.createTouchController();
    }
    this.startListening();
    this.update();
    window.addEventListener(Runner.events.RESIZE,
      this.debounceResize.bind(this));
  }
  /**
   * Play the game intro.
   * Canvas container width expands out to the full width.
   */
  private playIntro() {
    if (!this.started && !this.crashed) {
      this.playingIntro = true;
      this.tRex.playingIntro = true;
      // CSS animation definition.
      var keyframes = '@-webkit-keyframes intro { ' +
        'from { width:' + Trex.config.WIDTH + 'px }' +
        'to { width: ' + this.dimensions.WIDTH + 'px }' +
        '}';
      (document.styleSheets[0] as CSSStyleSheet).insertRule(keyframes, 0);
      this.containerEl.addEventListener(Runner.events.ANIM_END,
        this.startGame.bind(this));
      this.containerEl.style.webkitAnimation = 'intro .4s ease-out 1 both';
      this.containerEl.style.width = this.dimensions.WIDTH + 'px';
      if (this.touchController) {
        this.outerContainerEl.appendChild(this.touchController);
      }
      this.activated = true;
      this.started = true;
    } else if (this.crashed) {
      this.restart();
    }
  }
  /**
   * Update the game status to started.
   */
  private startGame() {
    this.runningTime = 0;
    this.playingIntro = false;
    this.tRex.playingIntro = false;
    this.containerEl.style.webkitAnimation = '';
    this.playCount++;
    // Handle tabbing off the page. Pause the current game.
    window.addEventListener(Runner.events.VISIBILITY,
      this.onVisibilityChange.bind(this));
    window.addEventListener(Runner.events.BLUR,
      this.onVisibilityChange.bind(this));
    window.addEventListener(Runner.events.FOCUS,
      this.onVisibilityChange.bind(this));
  }
  private clearCanvas() {
    this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
      this.dimensions.HEIGHT);
  }
  /**
   * Update the game frame.
   */
  private update() {
    this.drawPending = false;
    var now = getTimeStamp();
    var deltaTime = now - (this.time || now);
    this.time = now;
    if (this.activated) {
      this.clearCanvas();
      if (this.tRex.jumping) {
        this.tRex.updateJump(deltaTime);
      }
      this.runningTime += deltaTime;
      var hasObstacles = this.runningTime > this.config.CLEAR_TIME;
      // First jump triggers the intro.
      if (this.tRex.jumpCount == 1 && !this.playingIntro) {
        this.playIntro();
      }
      // The horizon doesn't move until the intro is over.
      if (this.playingIntro) {
        this.horizon.update(0, this.currentSpeed, hasObstacles);
      } else {
        deltaTime = !this.started ? 0 : deltaTime;
        this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);
      }
      // Check for collisions.
      var collision = hasObstacles &&
        checkForCollision(this.horizon.obstacles[0], this.tRex);
      if (!collision) {
        this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;
        if (this.currentSpeed < this.config.MAX_SPEED) {
          this.currentSpeed += this.config.ACCELERATION;
        }
      } else {
        this.gameOver();
      }
      if (this.distanceMeter.getActualDistance(this.distanceRan) >
        this.distanceMeter.maxScore) {
        this.distanceRan = 0;
      }
      var playAcheivementSound = this.distanceMeter.update(deltaTime,
        Math.ceil(this.distanceRan));
      if (playAcheivementSound) {
        this.playSound(this.soundFx.SCORE);
      }
    }
    if (!this.crashed) {
      this.tRex.update(deltaTime);
      this.raq();
    }
  }
  /**
   * Event handler.
   */
  public handleEvent(e: KeyboardEvent) {
    return (function (evtType: KeyboardEvent, events: IHashMap<KeyboardEvent>) {
      switch (evtType) {
        case events.KEYDOWN:
        case events.TOUCHSTART:
        case events.MOUSEDOWN:
          this.onKeyDown(e);
          break;
        case events.KEYUP:
        case events.TOUCHEND:
        case events.MOUSEUP:
          this.onKeyUp(e);
          break;
      }
    }.bind(this))(e.type, Runner.events);
  }
  /**
   * Process keydown.
   */
  private onKeyDown(e: KeyboardEvent) {
    if (!this.crashed && (Runner.keycodes.JUMP[String(e.keyCode)] ||
      e.type == Runner.events.TOUCHSTART)) {
      if (!this.activated) {
        this.loadSounds();
        this.activated = true;
      }
      if (!this.tRex.jumping) {
        this.playSound(this.soundFx.BUTTON_PRESS);
        this.tRex.startJump();
      }
    }
    if (this.crashed && e.type == Runner.events.TOUCHSTART &&
      e.currentTarget == this.containerEl) {
      this.restart();
    }

    // Speed drop, activated only when jump key is not pressed.
    if (Runner.keycodes.DUCK[e.keyCode] && this.tRex.jumping) {
      e.preventDefault();
      this.tRex.setSpeedDrop();
    }
  }
  /**
   * Process key up.
   */
  private onKeyUp(e: KeyboardEvent) {
    var keyCode = String(e.keyCode);
    var isjumpKey = Runner.keycodes.JUMP[keyCode] ||
      e.type == Runner.events.TOUCHEND ||
      e.type == Runner.events.MOUSEDOWN;
    if (this.isRunning() && isjumpKey) {
      this.tRex.endJump();
    } else if (Runner.keycodes.DUCK[keyCode]) {
      this.tRex.speedDrop = false;
    } else if (this.crashed) {
      // Check that enough time has elapsed before allowing jump key to restart.
      var deltaTime = getTimeStamp() - this.time;
      if (Runner.keycodes.RESTART[keyCode] ||
        (e.type == Runner.events.MOUSEUP && e.target == this.canvas) ||
        (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
          Runner.keycodes.JUMP[keyCode])) {
        this.restart();
      }
    } else if (this.paused && isjumpKey) {
      this.play();
    }
  }
  /**
   * Whether the game is running.
   * @return {boolean}
   */
  private isRunning() {
    return !!this.raqId;
  }
  /**
   * Game over state.
   */
  private gameOver() {
    this.playSound(this.soundFx.HIT);
    vibrate(200);
    this.stop();
    this.crashed = true;
    this.distanceMeter.acheivement = false;
    this.tRex.update(100, Trex.status.CRASHED);
    // Game over panel.
    if (!this.gameOverPanel) {
      this.gameOverPanel = new GameOverPanel(this.canvas,
        this.images.TEXT_SPRITE, this.images.RESTART,
        this.dimensions);
    } else {
      this.gameOverPanel.draw();
    }
    // Update the high score.
    if (this.distanceRan > this.highestScore) {
      this.highestScore = Math.ceil(this.distanceRan);
      this.distanceMeter.setHighScore(this.highestScore);
    }
    // Reset the time clock.
    this.time = getTimeStamp();
    // Show the share button.
    this.sharePanel = new SharePanel(this.canvas, this.dimensions);
  }
  private stop() {
    this.activated = false;
    this.paused = true;
    cancelAnimationFrame(this.raqId);
    this.raqId = 0;
  }
  private play() {
    if (!this.crashed) {
      this.activated = true;
      this.paused = false;
      this.tRex.update(0, Trex.status.RUNNING);
      this.time = getTimeStamp();
      this.update();
    }
  }
  private restart() {
    if (!this.raqId) {
      this.playCount++;
      this.runningTime = 0;
      this.activated = true;
      this.crashed = false;
      this.distanceRan = 0;
      this.setSpeed(this.config.SPEED);
      this.time = getTimeStamp();
      this.containerEl.classList.remove(Runner.classes.CRASHED);
      this.clearCanvas();
      this.distanceMeter.reset(); // TODO: original code is (this.highestScore)
      this.horizon.reset();
      this.tRex.reset();
      this.sharePanel.remove();
      this.playSound(this.soundFx.BUTTON_PRESS);
      this.update();
    }
  }

  
  /***************************************************
   *                                                 *
   *         GAME RUNNER HELPER FUNCTIONS            *
   *                                                 *
   ***************************************************/
  /**
   * Pause the game if the tab is not in focus.
   */
  private onVisibilityChange(e: Event) {
    if (document.hidden || (<any>document).webkitHidden || e.type == 'blur') {
      this.stop();
    } else {
      this.play();
    }
  }
  /**
   * Bind relevant key / mouse / touch listeners.
   */
  private startListening() {
    // Keys.
    document.addEventListener(Runner.events.KEYDOWN, this);
    document.addEventListener(Runner.events.KEYUP, this);
    if (IS_MOBILE) {
      // Mobile only touch devices.
      this.touchController.addEventListener(Runner.events.TOUCHSTART, this);
      this.touchController.addEventListener(Runner.events.TOUCHEND, this);
      this.containerEl.addEventListener(Runner.events.TOUCHSTART, this);
    } else {
      // Mouse.
      document.addEventListener(Runner.events.MOUSEDOWN, this);
      document.addEventListener(Runner.events.MOUSEUP, this);
    }
  }
  /**
   * Remove all listeners.
   */
  private stopListening() {
    document.removeEventListener(Runner.events.KEYDOWN, this);
    document.removeEventListener(Runner.events.KEYUP, this);
    if (IS_MOBILE) {
      this.touchController.removeEventListener(Runner.events.TOUCHSTART, this);
      this.touchController.removeEventListener(Runner.events.TOUCHEND, this);
      this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this);
    } else {
      document.removeEventListener(Runner.events.MOUSEDOWN, this);
      document.removeEventListener(Runner.events.MOUSEUP, this);
    }
  }
  /**
   * RequestAnimationFrame wrapper.
   */
  private raq() {
    if (!this.drawPending) {
      this.drawPending = true;
      this.raqId = requestAnimationFrame(this.update.bind(this));
    }
  }
  public attachTo(outerContainerId: string, config?: RunnerConfig) {
    this.outerContainerEl = document.querySelector(outerContainerId);
    if (config) this.config = config;
    this.loadImages();
    this.init();
  }
  /**
   * Load and cache the image assets from the page.
   */
  private loadImages() {
    var imageSources = IS_HIDPI ? Runner.imageSources.HDPI : Runner.imageSources.LDPI;
    imageSources.forEach((img: any) => this.images[img.name] = document.getElementById(img.id) as HTMLImageElement);
  }
  /**
   * Default dimensions.
   * @enum {string}
   */
  public static readonly defaultDimensions = {
    WIDTH: DEFAULT_WIDTH,
    HEIGHT: 150
  };
  /**
   * CSS class names.
   * @enum {string}
   */
  // TODO: this classes only used within this module.
  private static readonly classes: IHashMap<string> = {
    CANVAS: 'runner-canvas',
    CONTAINER: 'runner-container',
    CRASHED: 'crashed',
    ICON: 'icon-offline',
    TOUCH_CONTROLLER: 'controller'
  };
  /**
   * Image source urls.
   * @enum {array.<object>}
   */
  private static readonly imageSources = {
    LDPI: [
      { name: 'CACTUS_LARGE', id: '1x-obstacle-large' },
      { name: 'CACTUS_SMALL', id: '1x-obstacle-small' },
      { name: 'CLOUD', id: '1x-cloud' },
      { name: 'HORIZON', id: '1x-horizon' },
      { name: 'RESTART', id: '1x-restart' },
      { name: 'TEXT_SPRITE', id: '1x-text' },
      { name: 'TREX', id: '1x-trex' }
    ],
    HDPI: [
      { name: 'CACTUS_LARGE', id: '2x-obstacle-large' },
      { name: 'CACTUS_SMALL', id: '2x-obstacle-small' },
      { name: 'CLOUD', id: '2x-cloud' },
      { name: 'HORIZON', id: '2x-horizon' },
      { name: 'RESTART', id: '2x-restart' },
      { name: 'TEXT_SPRITE', id: '2x-text' },
      { name: 'TREX', id: '2x-trex' }
    ]
  };
  /**
   * Sound FX. Reference to the ID of the audio tag on interstitial page.
   * @enum {string}
   */
  private static readonly sounds: any = {
    BUTTON_PRESS: 'offline-sound-press',
    HIT: 'offline-sound-hit',
    SCORE: 'offline-sound-reached'
  };
  /**
   * Play a sound.
   * @param {SoundBuffer} soundBuffer
   */
  private playSound(soundBuffer: AudioBuffer) {
    if (soundBuffer) {
      var sourceNode = this.audioContext.createBufferSource();
      sourceNode.buffer = soundBuffer;
      sourceNode.connect(this.audioContext.destination);
      sourceNode.start(0);
    }
  }
  /**
   * Create canvas element.
   * @param {HTMLElement} container Element to append canvas to.
   */
  private static createCanvas(container: HTMLElement, width: number, height: number, classname?: string): HTMLCanvasElement {
    var canvas = document.createElement('canvas');
    canvas.className = classname ? Runner.classes.CANVAS + ' ' +
      classname : Runner.classes.CANVAS;
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    return canvas;
  }

  /**
   * Setting individual settings for debugging.
   * @param {string} setting
   * @param {*} value
   */
  private updateConfigSetting(setting: string, value: any) {
    if (setting in this.config && value != undefined) {
      this.config[setting] = value;
      switch (setting) {
        case 'GRAVITY':
        case 'MIN_JUMP_HEIGHT':
        case 'SPEED_DROP_COEFFICIENT':
          this.tRex.config[setting] = value;
          break;
        case 'INITIAL_JUMP_VELOCITY':
          this.tRex.setJumpVelocity(value);
          break;
        case 'SPEED':
          this.setSpeed(value);
          break;
      }
    }
  }

  /**
   * Load and decode base 64 encoded sounds.
   */
  private loadSounds() {
    if (!IS_IOS) {
      this.audioContext = new AudioContext();
      var resourceTemplate =
        (document.getElementById(this.config.RESOURCE_TEMPLATE_ID) as HTMLTemplateElement).content;
      for (var sound in Runner.sounds) {
        var soundSrc =
          (resourceTemplate.getElementById(Runner.sounds[sound]) as HTMLAudioElement).src;
        soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);
        var buffer = decodeBase64ToArrayBuffer(soundSrc);
        // Async, so no guarantee of order in array.
        this.audioContext.decodeAudioData(buffer, function (index: number, audioData: AudioBuffer) {
          this.soundFx[index] = audioData;
        }.bind(this, sound));
      }
    }
  }
  /**
   * Updates the canvas size taking into
   * account the backing store pixel ratio and
   * the device pixel ratio.
   *
   * See article by Paul Lewis:
   * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
   *
   * @param {HTMLCanvasElement} canvas
   * @param {number} opt_width
   * @param {number} opt_height
   * @return {boolean} Whether the canvas was scaled.
   */
  private static updateCanvasScaling = function (canvas: HTMLCanvasElement, opt_width?: number, opt_height?: number) {
    var context = canvas.getContext('2d');
    // Query the various pixel ratios
    var devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    var backingStoreRatio = Math.floor((<any>context).webkitBackingStorePixelRatio) || 1;
    var ratio = devicePixelRatio / backingStoreRatio;
    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
      var oldWidth = opt_width || canvas.width;
      var oldHeight = opt_height || canvas.height;
      canvas.width = oldWidth * ratio;
      canvas.height = oldHeight * ratio;
      canvas.style.width = oldWidth + 'px';
      canvas.style.height = oldHeight + 'px';
      // Scale the context to counter the fact that we've manually scaled
      // our canvas element.
      context.scale(ratio, ratio);
      return true;
    }
    return false;
  };

  /**
   * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
   */
  private setSpeed(opt_speed?: number) {
    var speed = opt_speed || this.currentSpeed;
    // Reduce the speed on smaller mobile screens.
    if (this.dimensions.WIDTH < DEFAULT_WIDTH) {
      var mobileSpeed = speed * this.dimensions.WIDTH / DEFAULT_WIDTH *
        this.config.MOBILE_SPEED_COEFFICIENT;
      this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
    } else if (opt_speed) {
      this.currentSpeed = opt_speed;
    }
  }

  /**
   * Create the touch controller. A div that covers whole screen.
   */
  private createTouchController() {
    this.touchController = document.createElement('div');
    this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
  }
  /**
   * Debounce the resize event.
   */
  private debounceResize() {
    if (!this.resizeTimerId_) {
      this.resizeTimerId_ =
        setInterval(this.adjustDimensions.bind(this), 250);
    }
  }
  /**
   * Adjust game space dimensions on resize.
   */
  private adjustDimensions() {
    clearInterval(this.resizeTimerId_);
    this.resizeTimerId_ = null;
    var boxStyles = window.getComputedStyle(this.outerContainerEl);
    var padding = Number(boxStyles.paddingLeft.substr(0,
      boxStyles.paddingLeft.length - 2));
    this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
    // Redraw the elements back onto the canvas.
    if (this.canvas) {
      this.canvas.width = this.dimensions.WIDTH;
      this.canvas.height = this.dimensions.HEIGHT;
      Runner.updateCanvasScaling(this.canvas);
      this.distanceMeter.calcXPos(this.dimensions.WIDTH);
      this.clearCanvas();
      this.horizon.update(0, 0, true);
      this.tRex.update(0);
      // Outer container and distance meter.
      if (this.activated || this.crashed) {
        this.containerEl.style.width = this.dimensions.WIDTH + 'px';
        this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
        this.distanceMeter.update(0, Math.ceil(this.distanceRan));
        this.stop();
      } else {
        this.tRex.draw(0, 0);
      }
      // Game over panel.
      if (this.crashed && this.gameOverPanel) {
        this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
        this.gameOverPanel.draw();
      }
    }
  }
}


/**
 * Vibrate on mobile devices.
 * @param {number} duration Duration of the vibration in milliseconds.
 */
function vibrate(duration: number) {
  if (IS_MOBILE && window.navigator.vibrate) {
    window.navigator.vibrate(duration);
  }
}

/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 */
function decodeBase64ToArrayBuffer(base64String: string) {
  var len = (base64String.length / 4) * 3;
  var str = atob(base64String);
  var arrayBuffer = new ArrayBuffer(len);
  var bytes = new Uint8Array(arrayBuffer);
  for (var i = 0; i < len; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes.buffer;
}
