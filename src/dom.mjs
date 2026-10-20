/**
 * DOM 相关的通用助手。
 *
 * 这里的函数一律**不访问 document**：所有查询都从实例自己的根节点出发，
 * 这样同一个页面上挂多个播放器时不会互相抢到对方的节点。
 */

const CAMEL_RE = /-([a-z])/g;

/** data-xq 的短横线命名转驼峰：`vol-bar` -> `volBar` */
export function toCamel(name) {
    return String(name).replace(CAMEL_RE, function (_match, chr) {
        return chr.toUpperCase();
    });
}

/**
 * 收集实例内所有 `[data-xq]` 节点，返回 { video, play, ... } 的引用表。
 * 初始化时扫一次，之后所有交互都走引用，不再做全局查询。
 */
export function collectRefs(root) {
    const refs = Object.create(null);
    if (!root || typeof root.querySelectorAll !== 'function') {
        return refs;
    }
    const nodes = root.querySelectorAll('[data-xq]');
    for (let i = 0; i < nodes.length; i += 1) {
        const el = nodes[i];
        const key = el.getAttribute('data-xq');
        if (key && !(toCamel(key) in refs)) {
            refs[toCamel(key)] = el;
        }
    }
    return refs;
}

/**
 * 注册监听器并把登记信息塞进 store，供 destroy() 一次性摘除。
 * 原先直接赋 `window.onscroll = fn` 会覆盖宿主与其他实例的同名处理器。
 */
export function on(store, target, type, handler, options) {
    if (!target || typeof target.addEventListener !== 'function') {
        return handler;
    }
    target.addEventListener(type, handler, options);
    store.push({ target: target, type: type, handler: handler, options: options });
    return handler;
}

/** 摘除 store 里登记的全部监听器 */
export function offAll(store) {
    while (store.length) {
        const item = store.pop();
        if (item.target && typeof item.target.removeEventListener === 'function') {
            item.target.removeEventListener(item.type, item.handler, item.options);
        }
    }
}

/** 安全地取整定值，NaN / Infinity 归到下限 */
export function clamp(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
        return min;
    }
    if (num < min) {
        return min;
    }
    return num > max ? max : num;
}

/** classList 的可空封装，避免节点缺失时抛错 */
export function toggleClass(el, name, force) {
    if (!el || !el.classList) {
        return;
    }
    if (typeof force === 'undefined') {
        el.classList.toggle(name);
        return;
    }
    if (force) {
        el.classList.add(name);
    } else {
        el.classList.remove(name);
    }
}

/** 设置文本（用 textContent，绝不用 innerHTML，避免注入） */
export function setText(el, text) {
    if (!el) {
        return;
    }
    el.textContent = text == null ? '' : String(text);
}

/** 转义 HTML 片段里的特殊字符 */
export function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
