import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { ROOT } from '../helpers/fixture.mjs';
import { createFixture } from '../helpers/fixture.mjs';

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const require = createRequire(import.meta.url);

test('require("xqplayer") 返回构造函数', () => {
    const Ctor = require(join(ROOT, 'lib/js/xqplayer.js'));
    assert.equal(typeof Ctor, 'function');
    assert.equal(Ctor.version, pkg.version);
    assert.equal(typeof Ctor.isSupportedMode, 'function');
});

test('ESM 的默认导出与具名导出是同一个构造函数', async () => {
    // 未压缩与压缩两份都要验：压缩过程可能把具名导出丢掉
    for (const entry of ['lib/js/xqplayer-esm.mjs', 'lib/js/xqplayer-esm.min.mjs']) {
        const url = pathToFileURL(join(ROOT, entry)).href;
        const mod = await import(url);
        assert.equal(typeof mod.default, 'function', entry + ' 的 default 应是函数');
        assert.equal(mod.XQVideoPlayer, mod.default, entry + ' 的具名导出应等于 default');
        assert.equal(mod.VERSION, pkg.version, entry + ' 应导出 VERSION');
        assert.equal(mod.default.version, pkg.version, entry + ' 的静态 version 应与包版本一致');
    }
});

test('CJS 侧也能取到具名导出', () => {
    const Ctor = require(join(ROOT, 'lib/js/xqplayer.js'));
    assert.equal(Ctor.VERSION, pkg.version, '应能从 require 结果上取到 VERSION');
    assert.equal(Ctor.XQVideoPlayer, Ctor, 'XQVideoPlayer 应指回自身');
    assert.equal(Ctor.default, Ctor, 'default 应指回自身');
});

test('UMD 在浏览器全局下暴露 XQVideoPlayer', () => {
    const fixture = createFixture();
    assert.equal(typeof fixture.env.sandbox.XQVideoPlayer, 'function');
    assert.equal(fixture.env.sandbox.XQVideoPlayer, fixture.Ctor);
});

test('三种加载方式得到行为一致的构造器', async () => {
    const CjsCtor = require(join(ROOT, 'lib/js/xqplayer.js'));
    const mod = await import(pathToFileURL(join(ROOT, 'lib/js/xqplayer-esm.mjs')).href);
    const fixture = createFixture();

    assert.equal(CjsCtor.isSupportedMode('mp4'), true);
    assert.equal(mod.default.isSupportedMode('mp4'), true);
    assert.equal(fixture.Ctor.isSupportedMode('mp4'), true);

    for (const mode of ['mp4', 'm3u8', 'flv']) {
        assert.equal(CjsCtor.isSupportedMode(mode), true, mode + ' 应受支持');
    }
    assert.equal(CjsCtor.isSupportedMode('avi'), false, 'avi 不应受支持');
});

test('导出面保留了 0.0.x 的原型方法名', () => {
    const Ctor = require(join(ROOT, 'lib/js/xqplayer.js'));
    const expected = [
        'initElem', 'initVideo', 'initEvent', 'loadVideo', 'gid', 'dom', 'domAll',
        'toggleControl', 'addDraw', 'addVol', 'addProgree', 'videoMuted',
        'secondToTime', 'showBarrage', 'randomColor', 'toggleInfo', 'playVideo',
        'toggleQualBar', 'toggleSpeed', 'toggleSet', 'toggleVol', 'setSpeed',
        'showSpeedAct', 'setStatus', 'setPlayType', 'fullScreenOpen', 'fullScreenCancel',
    ];
    for (const name of expected) {
        assert.equal(typeof Ctor.prototype[name], 'function', '缺少原型方法 ' + name);
    }
});

test('新增了 destroy / reload 等生命周期方法', () => {
    const Ctor = require(join(ROOT, 'lib/js/xqplayer.js'));
    for (const name of ['destroy', 'reload', 'setVolume', 'setProgressRatio', 'shareVideo']) {
        assert.equal(typeof Ctor.prototype[name], 'function', '缺少新方法 ' + name);
    }
});
