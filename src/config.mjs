/**
 * 构建期注入的版本号。
 * esbuild 会把 __XQ_VERSION__ 直接替换为字符串字面量；直接运行源码时该标识符不存在，
 * 因此用 typeof 兜底，避免 ReferenceError。
 */
export const VERSION =
    typeof __XQ_VERSION__ !== 'undefined' ? __XQ_VERSION__ : '0.0.0-dev';

/** 支持的点播类型 */
export const SUPPORTED_MODES = ['mp4', 'm3u8', 'flv'];

/** 构造参数的默认值，保持 0.0.x 的公开默认值不变 */
export const DEFAULTS = {
    el: '',
    url: '',
    poster: '',
    barrages: [],
    mode: 'mp4',
    width: 1200,
    height: 600,
};

/** 日志前缀，便于在控制台里区分来源 */
export const LOG_PREFIX = '[xqplayer]';
