/**
 * 分享弹层的运行时探测。
 *
 * xqshare 是本包的依赖（`npm i xqplayer` 会一并装上），但播放器本身是零依赖的独立产物，
 * 不会把它打进去 —— UMD 直接引脚本的场景拿不到 `import`。所以三条路都留着：
 *
 *   1. `options.share` —— 单个实例指定构造器（打包场景）
 *   2. `XQVideoPlayer.useShare(XqShare)` —— 一次性注册（打包场景）
 *   3. `window.XqShare` —— 直接 `<script>` 引了 xqshare 的 UMD 产物
 *
 * 三条都没有时分享按钮降级成一句提示，不再抛 ReferenceError。
 */
let injectedCtor = null;

function globalScope() {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    return {};
}

/**
 * 取可用的 XqShare 构造器，没有则返回 null。
 * @param {object} [options] 构造函数入参，可带 `share`
 */
export function resolveShareCtor(options) {
    const fromOptions = options && options.share;
    if (typeof fromOptions === 'function') {
        return fromOptions;
    }
    if (typeof injectedCtor === 'function') {
        return injectedCtor;
    }
    const ctor = globalScope().XqShare;
    return typeof ctor === 'function' ? ctor : null;
}

/**
 * 全局注册一次 XqShare 构造器。
 * 打包场景：`import XqShare from 'xqshare'; XQVideoPlayer.useShare(XqShare);`
 *
 * @param {Function} ctor
 * @returns {Function|null} 注册成功返回该构造器
 */
export function useShare(ctor) {
    injectedCtor = typeof ctor === 'function' ? ctor : null;
    return injectedCtor;
}

/** 仅供测试：清掉注入的构造器 */
export function resetShareCtor() {
    injectedCtor = null;
}

/**
 * 打开分享弹层。
 * @param {object} config
 * @param {string} config.selector 弹层容器选择器（实例唯一）
 * @param {string} [config.url]    分享链接，默认当前页面
 * @param {string} [config.title]  分享标题，默认 document.title
 * @param {'default'|'pop'|'slide'} [config.type]
 * @param {object} [config.share]  构造器（同 options.share）
 * @returns {object|null} XqShare 实例；不可用时返回 null
 */
export function openShare(config) {
    const options = config || {};
    const Ctor = resolveShareCtor(options);
    if (!Ctor) {
        return null;
    }

    const scope = globalScope();
    let url = options.url;
    let title = options.title;
    if (!url && scope.document && scope.document.location) {
        url = scope.document.location.href;
    }
    if (!title && scope.document) {
        title = scope.document.title || '';
    }

    let instance = null;
    try {
        instance = new Ctor({
            el: options.selector,
            type: options.type || 'pop',
            url: url,
            title: title,
        });
    } catch (error) {
        return null;
    }
    if (instance && typeof instance.show === 'function' && options.open !== false) {
        instance.show();
    }
    return instance;
}
