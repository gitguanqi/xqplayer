/**
 * 测试夹具：把「读取构建产物 + 造假浏览器 + 建实例」这三步收在一处，
 * 避免每个测试文件各写一套，导致 harness 与 node:test 的行为口径漂移。
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createEnvironment, loadUmd, createHost, StubEvent } from './dom-stub.mjs';

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export function readArtifact(relative) {
    return readFileSync(join(ROOT, relative), 'utf8');
}

export function readProjectFile(relative) {
    return readFileSync(join(ROOT, relative), 'utf8');
}

export { StubEvent };

/**
 * @param {object} [options]
 * @param {string} [options.entry] 要加载的产物，默认可读版 UMD
 */
export function createFixture(options) {
    const config = options || {};
    const env = createEnvironment(config.env);
    const entry = config.entry || process.env.XQ_HARNESS_ENTRY || 'lib/js/xqplayer.js';
    const Ctor = loadUmd(env, readArtifact(entry));
    let seq = 0;

    return {
        env,
        Ctor,
        /** 新建一个带容器的实例 */
        make(instanceOptions) {
            seq += 1;
            const host = createHost(env, 'host-' + seq);
            const instance = new Ctor(
                Object.assign({ el: host, url: './data/movie.mp4' }, instanceOptions || {})
            );
            return instance;
        },
        /** 用选择器方式新建实例（容器已挂到 body） */
        makeBySelector(selector, instanceOptions) {
            seq += 1;
            const host = createHost(env, selector.replace(/^#/, ''));
            const instance = new Ctor(
                Object.assign({ el: selector, url: './data/movie.mp4' }, instanceOptions || {})
            );
            instance.__host = host;
            return instance;
        },
        dispose() {},
    };
}

/** 造一个可冒泡的事件 */
export function fire(target, type, init) {
    const event = new StubEvent(type, init || {});
    target.dispatchEvent(event);
    return event;
}

/** 元素上是否可见（没有 hide 类） */
export function isVisible(el) {
    return !!el && !el.classList.contains('hide');
}

/** 读取实例内第一个匹配节点的文本 */
export function textOf(instance, selector) {
    const el = instance.dom(selector);
    return el ? el.textContent : null;
}
