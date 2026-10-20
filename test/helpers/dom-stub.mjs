/**
 * 极简 DOM 桩。
 *
 * 只实现播放器真正用到的那部分浏览器 API：HTML 片段解析、选择器、classList、
 * dataset、事件派发与冒泡、以及一个带 play/pause/currentTime 的媒体元素。
 *
 * 目的不是复刻浏览器，而是让「构建产物」能在 Node 里被真正执行，
 * 从而验证多实例隔离、监听器数量、销毁清理这类结构性事实。
 */
import vm from 'node:vm';

const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/* --------------------------------------------------------------- 事件对象 */

export class StubEvent {
    constructor(type, init) {
        const options = init || {};
        this.type = type;
        this.bubbles = options.bubbles !== false;
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.target = null;
        this.currentTarget = null;
        this.timeStamp = Date.now();
        Object.keys(options).forEach((key) => {
            if (key !== 'bubbles') {
                this[key] = options[key];
            }
        });
    }

    preventDefault() {
        this.defaultPrevented = true;
    }

    stopPropagation() {
        this.propagationStopped = true;
    }
}

/* ----------------------------------------------------------------- 节点基类 */

class StubNode {
    constructor(doc, nodeType) {
        this.ownerDocument = doc;
        this.nodeType = nodeType;
        this.parentNode = null;
        this.childNodes = [];
    }

    get firstChild() {
        return this.childNodes.length ? this.childNodes[0] : null;
    }

    get lastChild() {
        return this.childNodes.length ? this.childNodes[this.childNodes.length - 1] : null;
    }

    appendChild(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        node.parentNode = this;
        this.childNodes.push(node);
        return node;
    }

    insertBefore(node, reference) {
        if (!reference) {
            return this.appendChild(node);
        }
        const index = this.childNodes.indexOf(reference);
        if (index === -1) {
            return this.appendChild(node);
        }
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        node.parentNode = this;
        this.childNodes.splice(index, 0, node);
        return node;
    }

    removeChild(node) {
        const index = this.childNodes.indexOf(node);
        if (index === -1) {
            throw new Error('removeChild: 节点不是当前节点的子节点');
        }
        this.childNodes.splice(index, 1);
        node.parentNode = null;
        return node;
    }

    remove() {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }

    get textContent() {
        let text = '';
        for (const child of this.childNodes) {
            text += child.textContent;
        }
        return text;
    }

    set textContent(value) {
        this.childNodes.length = 0;
        const text = value == null ? '' : String(value);
        if (text !== '') {
            this.appendChild(new StubText(this.ownerDocument, text));
        }
    }
}

class StubText extends StubNode {
    constructor(doc, data) {
        super(doc, 3);
        this.data = String(data);
    }

    get textContent() {
        return this.data;
    }

    set textContent(value) {
        this.data = String(value);
    }

    get nodeValue() {
        return this.data;
    }
}

/* ------------------------------------------------------------------- 元素 */

class StubElement extends StubNode {
    constructor(doc, tag) {
        super(doc, 1);
        this.tagName = String(tag).toUpperCase();
        this._tag = String(tag).toLowerCase();
        this._attrs = new Map();
        this._classes = new Set();
        this._listeners = new Map();
        this._style = {};
        this.offsetTop = 0;
        this.offsetLeft = 0;
        this.offsetWidth = 0;
        this.offsetHeight = 0;
        this.clientWidth = 0;
        this.clientHeight = 0;
        this.scrollTop = 0;
        this.checked = false;
        this.value = '';
        this.disabled = false;
    }

    /* --- 属性 --- */

    setAttribute(name, value) {
        const key = String(name).toLowerCase();
        const text = value == null ? '' : String(value);
        this._attrs.set(key, text);
        if (key === 'class') {
            this._classes = new Set(text.split(/\s+/).filter(Boolean));
        }
        if (key === 'disabled') {
            this.disabled = true;
        }
    }

    getAttribute(name) {
        const key = String(name).toLowerCase();
        return this._attrs.has(key) ? this._attrs.get(key) : null;
    }

    hasAttribute(name) {
        return this._attrs.has(String(name).toLowerCase());
    }

    removeAttribute(name) {
        const key = String(name).toLowerCase();
        this._attrs.delete(key);
        if (key === 'class') {
            this._classes.clear();
        }
        if (key === 'disabled') {
            this.disabled = false;
        }
    }

    get id() {
        return this.getAttribute('id') || '';
    }

    set id(value) {
        this.setAttribute('id', value);
    }

    get className() {
        return Array.from(this._classes).join(' ');
    }

    set className(value) {
        this._classes = new Set(String(value).split(/\s+/).filter(Boolean));
        this._attrs.set('class', Array.from(this._classes).join(' '));
    }

    get classList() {
        const self = this;
        return {
            get length() {
                return self._classes.size;
            },
            add() {
                for (const name of arguments) {
                    self._classes.add(name);
                }
                self._syncClassAttr();
            },
            remove() {
                for (const name of arguments) {
                    self._classes.delete(name);
                }
                self._syncClassAttr();
            },
            contains(name) {
                return self._classes.has(name);
            },
            toggle(name, force) {
                const shouldAdd = typeof force === 'undefined' ? !self._classes.has(name) : !!force;
                if (shouldAdd) {
                    self._classes.add(name);
                } else {
                    self._classes.delete(name);
                }
                self._syncClassAttr();
                return shouldAdd;
            },
            item(index) {
                return Array.from(self._classes)[index] || null;
            },
            get value() {
                return Array.from(self._classes).join(' ');
            },
        };
    }

    _syncClassAttr() {
        this._attrs.set('class', Array.from(this._classes).join(' '));
    }

    get style() {
        return this._style;
    }

    get dataset() {
        const data = {};
        for (const [key, value] of this._attrs) {
            if (key.indexOf('data-') === 0) {
                const camel = key.slice(5).replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
                data[camel] = value;
            }
        }
        return data;
    }

    /* --- 树 --- */

    get children() {
        return this.childNodes.filter((node) => node.nodeType === 1);
    }

    get parentElement() {
        return this.parentNode && this.parentNode.nodeType === 1 ? this.parentNode : null;
    }

    contains(node) {
        let current = node;
        while (current) {
            if (current === this) {
                return true;
            }
            current = current.parentNode;
        }
        return false;
    }

    /* --- HTML --- */

    get innerHTML() {
        return this.childNodes.map(serialize).join('');
    }

    set innerHTML(html) {
        this.childNodes.length = 0;
        parseFragment(this.ownerDocument, String(html), this);
    }

    get innerText() {
        return this.textContent;
    }

    set innerText(value) {
        this.textContent = value;
    }

    /* --- 查询 --- */

    querySelector(selector) {
        const found = this.querySelectorAll(selector);
        return found.length ? found[0] : null;
    }

    querySelectorAll(selector) {
        const result = [];
        const groups = String(selector).split(',').map((item) => item.trim()).filter(Boolean);
        const walk = (node) => {
            for (const child of node.childNodes) {
                if (child.nodeType !== 1) {
                    continue;
                }
                if (groups.some((group) => matchesSelector(child, group))) {
                    result.push(child);
                }
                walk(child);
            }
        };
        walk(this);
        return result;
    }

    matches(selector) {
        return matchesSelector(this, selector);
    }

    closest(selector) {
        let node = this;
        while (node && node.nodeType === 1) {
            if (matchesSelector(node, selector)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    /* --- 事件 --- */

    addEventListener(type, handler, options) {
        if (typeof handler !== 'function') {
            return;
        }
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type).push({ handler, options, once: !!(options && options.once) });
    }

    removeEventListener(type, handler) {
        const list = this._listeners.get(type);
        if (!list) {
            return;
        }
        const index = list.findIndex((item) => item.handler === handler);
        if (index !== -1) {
            list.splice(index, 1);
        }
    }

    listenerCount(type) {
        if (type) {
            const list = this._listeners.get(type);
            return list ? list.length : 0;
        }
        let total = 0;
        for (const list of this._listeners.values()) {
            total += list.length;
        }
        return total;
    }

    dispatchEvent(event) {
        if (!event.target) {
            event.target = this;
        }
        let node = this;
        while (node) {
            if (node.nodeType === 1 || node.nodeType === 9) {
                const inline = node['on' + event.type];
                if (typeof inline === 'function') {
                    inline.call(node, event);
                }
                const list = node._listeners ? node._listeners.get(event.type) : null;
                if (list) {
                    for (const item of list.slice()) {
                        item.handler.call(node, event);
                        if (item.once) {
                            node.removeEventListener(event.type, item.handler);
                        }
                    }
                }
            }
            if (!event.bubbles || event.propagationStopped) {
                break;
            }
            node = node.parentNode;
        }
        return !event.defaultPrevented;
    }

    /* --- 布局与杂项 --- */

    getBoundingClientRect() {
        const width = this.clientWidth || this.offsetWidth || 0;
        const height = this.clientHeight || this.offsetHeight || 0;
        const left = this.offsetLeft || 0;
        const top = this.offsetTop || 0;
        return {
            left,
            top,
            width,
            height,
            right: left + width,
            bottom: top + height,
            x: left,
            y: top,
        };
    }

    setPointerCapture() {}

    releasePointerCapture() {}

    focus() {}

    blur() {}
}

class StubMediaElement extends StubElement {
    constructor(doc, tag) {
        super(doc, tag);
        this._paused = true;
        this._currentTime = 0;
        this.duration = NaN;
        this.volume = 1;
        this.muted = false;
        this.playbackRate = 1;
        this.readyState = 0;
        this.error = null;
        this.autoplay = false;
        this.preload = 'auto';
        this.playCount = 0;
        this.pauseCount = 0;
    }

    get paused() {
        return this._paused;
    }

    get src() {
        return this.getAttribute('src') || '';
    }

    set src(value) {
        this.setAttribute('src', value);
    }

    get poster() {
        return this.getAttribute('poster') || '';
    }

    set poster(value) {
        this.setAttribute('poster', value);
    }

    get currentTime() {
        return this._currentTime;
    }

    set currentTime(value) {
        const num = Number(value);
        this._currentTime = Number.isFinite(num) && num >= 0 ? num : 0;
        this.dispatchEvent(new StubEvent('seeking'));
        this.dispatchEvent(new StubEvent('seeked'));
    }

    play() {
        this.playCount += 1;
        this._paused = false;
        this.dispatchEvent(new StubEvent('play'));
        this.dispatchEvent(new StubEvent('playing'));
        return Promise.resolve();
    }

    pause() {
        this.pauseCount += 1;
        this._paused = true;
        this.dispatchEvent(new StubEvent('pause'));
    }

    load() {
        this.dispatchEvent(new StubEvent('loadstart'));
    }
}

/* ------------------------------------------------------------------ 文档 */

class StubDocument extends StubNode {
    constructor() {
        super(null, 9);
        this.ownerDocument = this;
        this.title = 'xqplayer test';
        this.documentElement = new StubElement(this, 'html');
        this.head = new StubElement(this, 'head');
        this.body = new StubElement(this, 'body');
        this.documentElement.appendChild(this.head);
        this.documentElement.appendChild(this.body);
        this.appendChild(this.documentElement);
    }

    createElement(tag) {
        const name = String(tag).toLowerCase();
        if (name === 'video' || name === 'audio') {
            return new StubMediaElement(this, name);
        }
        return new StubElement(this, name);
    }

    createTextNode(data) {
        return new StubText(this, data);
    }

    createDocumentFragment() {
        return new StubNode(this, 11);
    }

    getElementById(id) {
        const found = this.querySelectorAll('#' + id);
        return found.length ? found[0] : null;
    }

    querySelector(selector) {
        if (matchesSelector(this.documentElement, selector)) {
            return this.documentElement;
        }
        return this.documentElement.querySelector(selector);
    }

    querySelectorAll(selector) {
        const result = [];
        if (matchesSelector(this.documentElement, selector)) {
            result.push(this.documentElement);
        }
        return result.concat(this.documentElement.querySelectorAll(selector));
    }

    addEventListener() {}

    removeEventListener() {}

    dispatchEvent(event) {
        return this.documentElement.dispatchEvent(event);
    }
}

/* ------------------------------------------------------------- HTML 解析 */

function serialize(node) {
    if (node.nodeType === 3) {
        return escapeText(node.data);
    }
    const attrs = [];
    for (const [key, value] of node._attrs) {
        attrs.push(value === '' ? key : key + '="' + escapeAttr(value) + '"');
    }
    const open = '<' + node._tag + (attrs.length ? ' ' + attrs.join(' ') : '') + '>';
    if (VOID_TAGS.has(node._tag)) {
        return open;
    }
    return open + node.childNodes.map(serialize).join('') + '</' + node._tag + '>';
}

function escapeText(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(text) {
    return String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function parseFragment(doc, html, parent) {
    let index = 0;
    const stack = [parent];

    const current = () => stack[stack.length - 1];
    const appendText = (text) => {
        if (text) {
            current().appendChild(doc.createTextNode(decodeEntities(text)));
        }
    };

    while (index < html.length) {
        const lt = html.indexOf('<', index);
        if (lt === -1) {
            appendText(html.slice(index));
            break;
        }
        if (lt > index) {
            appendText(html.slice(index, lt));
        }
        if (html.startsWith('<!--', lt)) {
            const end = html.indexOf('-->', lt + 4);
            index = end === -1 ? html.length : end + 3;
            continue;
        }
        if (html.startsWith('<!', lt)) {
            const end = html.indexOf('>', lt);
            index = end === -1 ? html.length : end + 1;
            continue;
        }
        if (html[lt + 1] === '/') {
            const end = html.indexOf('>', lt);
            const name = html.slice(lt + 2, end).trim().toLowerCase();
            for (let level = stack.length - 1; level >= 1; level -= 1) {
                if (stack[level]._tag === name) {
                    stack.length = level;
                    break;
                }
            }
            index = end === -1 ? html.length : end + 1;
            continue;
        }

        const tagEnd = findTagEnd(html, lt);
        const raw = html.slice(lt + 1, tagEnd);
        const selfClosing = raw.trim().endsWith('/');
        const parsed = parseTag(raw);
        if (!parsed.name) {
            index = tagEnd + 1;
            continue;
        }
        const el = doc.createElement(parsed.name);
        for (const [name, value] of parsed.attrs) {
            el.setAttribute(name, value);
        }
        current().appendChild(el);
        if (!selfClosing && !VOID_TAGS.has(parsed.name)) {
            stack.push(el);
        }
        index = tagEnd + 1;
    }
}

function findTagEnd(html, start) {
    let quote = '';
    for (let i = start + 1; i < html.length; i += 1) {
        const char = html[i];
        if (quote) {
            if (char === quote) {
                quote = '';
            }
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            continue;
        }
        if (char === '>') {
            return i;
        }
    }
    return html.length;
}

function parseTag(raw) {
    const text = raw.replace(/\/\s*$/, '');
    const nameMatch = /^([a-zA-Z][\w:-]*)/.exec(text);
    if (!nameMatch) {
        return { name: '', attrs: [] };
    }
    const name = nameMatch[1].toLowerCase();
    const attrs = [];
    let index = nameMatch[0].length;

    while (index < text.length) {
        while (index < text.length && /\s/.test(text[index])) {
            index += 1;
        }
        if (index >= text.length) {
            break;
        }
        const nameStart = index;
        while (index < text.length && !/[\s=]/.test(text[index])) {
            index += 1;
        }
        const attrName = text.slice(nameStart, index);
        if (!attrName) {
            index += 1;
            continue;
        }
        while (index < text.length && /\s/.test(text[index])) {
            index += 1;
        }
        let value = '';
        if (text[index] === '=') {
            index += 1;
            while (index < text.length && /\s/.test(text[index])) {
                index += 1;
            }
            const quote = text[index];
            if (quote === '"' || quote === "'") {
                index += 1;
                const end = text.indexOf(quote, index);
                value = text.slice(index, end === -1 ? text.length : end);
                index = end === -1 ? text.length : end + 1;
            } else {
                const start = index;
                while (index < text.length && !/\s/.test(text[index])) {
                    index += 1;
                }
                value = text.slice(start, index);
            }
        }
        attrs.push([attrName.toLowerCase(), decodeEntities(value)]);
    }
    return { name, attrs };
}

function decodeEntities(text) {
    return String(text)
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

/* --------------------------------------------------------------- 选择器 */

const COMPOUND_RE = /([.#]?[\w-]+|\[[^\]]+\]|:[\w-]+(?:\([^)]*\))?|\*)/g;

export function matchesSelector(el, selector) {
    if (!el || el.nodeType !== 1) {
        return false;
    }
    const groups = String(selector).split(',').map((item) => item.trim()).filter(Boolean);
    return groups.some((group) => matchGroup(el, group));
}

function matchGroup(el, group) {
    const tokens = group.replace(/>/g, ' > ').split(/\s+/).filter(Boolean);
    let index = tokens.length - 1;
    let node = el;

    if (tokens[index] === '>') {
        return false;
    }
    if (!matchCompound(node, tokens[index])) {
        return false;
    }
    index -= 1;

    while (index >= 0) {
        let combinator = ' ';
        if (tokens[index] === '>') {
            combinator = '>';
            index -= 1;
        }
        const compound = tokens[index];
        if (combinator === '>') {
            node = node.parentNode;
            if (!node || node.nodeType !== 1 || !matchCompound(node, compound)) {
                return false;
            }
        } else {
            let ancestor = node.parentNode;
            let matched = false;
            while (ancestor && ancestor.nodeType === 1) {
                if (matchCompound(ancestor, compound)) {
                    matched = true;
                    node = ancestor;
                    break;
                }
                ancestor = ancestor.parentNode;
            }
            if (!matched) {
                return false;
            }
        }
        index -= 1;
    }
    return true;
}

function matchCompound(el, compound) {
    const parts = String(compound).match(COMPOUND_RE);
    if (!parts) {
        return false;
    }
    for (const part of parts) {
        if (!matchPart(el, part)) {
            return false;
        }
    }
    return true;
}

function matchPart(el, part) {
    if (part === '*') {
        return true;
    }
    if (part[0] === '#') {
        return el.getAttribute('id') === part.slice(1);
    }
    if (part[0] === '.') {
        return el.classList.contains(part.slice(1));
    }
    if (part[0] === '[') {
        return matchAttribute(el, part.slice(1, -1));
    }
    if (part[0] === ':') {
        return matchPseudo(el, part);
    }
    return el._tag === part.toLowerCase();
}

function matchAttribute(el, expression) {
    const eq = expression.indexOf('=');
    if (eq === -1) {
        return el.hasAttribute(expression.trim());
    }
    const name = expression.slice(0, eq).trim();
    let value = expression.slice(eq + 1).trim();
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        value = value.slice(1, -1);
    }
    return el.getAttribute(name) === value;
}

function matchPseudo(el, part) {
    const name = part.slice(1).split('(')[0];
    if (name === 'checked') {
        return !!el.checked;
    }
    if (name === 'disabled') {
        return !!el.disabled;
    }
    if (name === 'first-child') {
        return !!el.parentNode && el.parentNode.children[0] === el;
    }
    return false;
}

/* ------------------------------------------------------------- 环境组装 */

/** 最小 window：只保留事件、文档引用与尺寸，播放器只用到这些 */
export class StubWindow {
    constructor() {
        this._listeners = new Map();
        this.document = null;
        this.location = null;
        this.innerWidth = 1280;
        this.innerHeight = 800;
        this.scrollY = 0;
        this.pageYOffset = 0;
    }

    addEventListener(type, handler, options) {
        if (typeof handler !== 'function') {
            return;
        }
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type).push({ handler, options, once: !!(options && options.once) });
    }

    removeEventListener(type, handler) {
        const list = this._listeners.get(type);
        if (!list) {
            return;
        }
        const index = list.findIndex((item) => item.handler === handler);
        if (index !== -1) {
            list.splice(index, 1);
        }
    }

    listenerCount(type) {
        if (type) {
            const list = this._listeners.get(type);
            return list ? list.length : 0;
        }
        let total = 0;
        for (const list of this._listeners.values()) {
            total += list.length;
        }
        return total;
    }

    dispatchEvent(event) {
        const list = this._listeners.get(event.type);
        if (list) {
            for (const item of list.slice()) {
                item.handler.call(this, event);
                if (item.once) {
                    this.removeEventListener(event.type, item.handler);
                }
            }
        }
        return !event.defaultPrevented;
    }

    getComputedStyle(el) {
        return el.style || {};
    }

    requestAnimationFrame(fn) {
        return setTimeout(fn, 16);
    }

    cancelAnimationFrame(id) {
        clearTimeout(id);
    }
}

/**
 * 创建一个可以跑播放器的假浏览器环境。
 * @param {object} [options]
 * @param {string} [options.origin]
 * @param {string} [options.pathname]
 */
export function createEnvironment(options) {
    const config = options || {};
    const document = new StubDocument();
    const logs = [];
    const window = new StubWindow();

    const sandbox = {
        document,
        window,
        location: {
            origin: config.origin || 'http://localhost:5173',
            pathname: config.pathname || '/test/browser.html',
            href: (config.origin || 'http://localhost:5173') + (config.pathname || '/test/browser.html'),
            search: '',
        },
        navigator: { userAgent: 'node-stub' },
        console: {
            log: (...args) => logs.push({ level: 'log', args }),
            warn: (...args) => logs.push({ level: 'warn', args }),
            error: (...args) => logs.push({ level: 'error', args }),
        },
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: (id) => clearTimeout(id),
        requestAnimationFrame: (fn) => setTimeout(fn, 16),
        cancelAnimationFrame: (id) => clearTimeout(id),
    };
    sandbox.self = window;
    sandbox.globalThis = sandbox;

    window.document = document;
    window.location = sandbox.location;
    window.setTimeout = sandbox.setTimeout;
    window.clearTimeout = sandbox.clearTimeout;
    window.console = sandbox.console;

    const context = vm.createContext(sandbox);

    return {
        sandbox,
        window,
        context,
        document,
        logs,
        /** 取某级别的日志文本 */
        messages(level) {
            return logs
                .filter((item) => !level || item.level === level)
                .map((item) => item.args.map(String).join(' '));
        },
        /** 在沙箱里执行一段代码（用于加载 UMD 产物） */
        run(code, filename) {
            return vm.runInContext(code, context, { filename: filename || 'bundle.js' });
        },
    };
}

/** 加载 UMD 产物并返回全局构造器 */
export function loadUmd(env, code) {
    env.run(code, 'xqplayer.umd.js');
    const ctor = env.sandbox.XQVideoPlayer;
    if (typeof ctor !== 'function') {
        throw new Error('UMD 产物没有暴露 XQVideoPlayer 构造函数');
    }
    return ctor;
}

/** 造一个容器并挂到 body 上 */
export function createHost(env, id) {
    const host = env.document.createElement('div');
    host.id = id || 'host';
    env.document.body.appendChild(host);
    return host;
}
