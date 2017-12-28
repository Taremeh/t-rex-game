export const IS_IOS =
    window.navigator.userAgent.indexOf('UIWebViewForStaticFileContent') > -1;

export const IS_MOBILE = false;
export const FPS = 60;
export const DEFAULT_WIDTH = 600;
export const IS_HIDPI = window.devicePixelRatio > 1;

export interface IHashMap<T> {
    [key: string]: T;
}

/**
 * Return the current timestamp.
 */
export function getTimeStamp(): number {
    return IS_IOS ? new Date().getTime() : performance.now();
}

/**
 * Get random number.
 * @param {number} min
 * @param {number} max
 * @param {number}
 */
export function getRandomNum(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }