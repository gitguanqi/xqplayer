/**
 * 分享弹层的运行时探测。
 *
 * xqshare 是可选的全局库（`window.XqShare`）。原实现在点击分享时直接 `new XqShare(...)`，
 * 没加载就抛 ReferenceError，连点击都不该让页面报错。
 */
function globalScope() {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    return {};
}

/** 取可用的 XqShare 构造器，没有则返回 null */
export function resolveShareCtor() {
    const scope = globalScope();
    const ctor = scope.XqShare;
    return typeof ctor === 'function' ? ctor : null;
}

/**
 * 打开分享弹层。
 * @param {string} selector 弹层容器的选择器（实例唯一的 id）
 * @returns {object|null} XqShare 实例；不可用时返回 null
 */
export function openShare(selector) {
    const XqShare = resolveShareCtor();
    if (!XqShare) {
        return null;
    }
    const instance = new XqShare({ el: selector, type: 'pop' });
    if (instance && typeof instance.show === 'function') {
        instance.show();
    }
    return instance;
}
