import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, readProjectFile } from '../helpers/fixture.mjs';

/**
 * 控制条布局契约。
 *
 * 这几条对应 0.0.x 在窄播放器上的真实故障：
 * 时间文本被压缩换行到播放按钮下面、弹幕输入行的「发送」掉到第二行、
 * 音量/倍速/设置弹层用写死的 right 值定位（图标一增减就整体偏移）。
 */

function boxOf(player) {
    return player.root.querySelector('.xqvideo-box');
}

test('480px 实例带 xq-compact（收起清晰度/倍速与弹幕输入）', () => {
    const fixture = createFixture();
    const player = fixture.make({ width: 480, height: 270 });
    assert.ok(boxOf(player).classList.contains('xq-compact'));
    player.destroy();
});

test('600px 实例带 xq-narrow（只收起清晰度/倍速）', () => {
    const fixture = createFixture();
    const player = fixture.make({ width: 600, height: 338 });
    const box = boxOf(player);
    assert.ok(box.classList.contains('xq-narrow'));
    assert.equal(box.classList.contains('xq-compact'), false);
    player.destroy();
});

test('720px 及以上不降级', () => {
    const fixture = createFixture();
    const player = fixture.make({ width: 720, height: 405 });
    const box = boxOf(player);
    assert.equal(box.classList.contains('xq-narrow'), false);
    assert.equal(box.classList.contains('xq-compact'), false);
    player.destroy();
});

test('时间与播放按钮同属 .video-control-left', () => {
    const fixture = createFixture();
    const player = fixture.make();
    const left = player.q('.video-control-left');
    assert.ok(left, '缺少左侧容器');
    assert.ok(left.contains(player.refs.current), '时间文本不在左侧容器内');
    assert.ok(left.contains(player.refs.duration), '总时长不在左侧容器内');
    player.destroy();
});

test('弹层全部锚定在各自的 .video-control-alone 上', () => {
    const fixture = createFixture();
    const player = fixture.make();
    for (const key of ['qua', 'speed', 'set', 'vol']) {
        const popup = player.refs[key];
        assert.ok(popup, key + ' 弹层缺失');
        assert.equal(
            popup.parentElement.classList.contains('video-control-alone'),
            true,
            key + ' 弹层不在触发按钮所在的容器里'
        );
    }
    player.destroy();
});

test('CSS 不再用写死的 right 偏移定位弹层', () => {
    const css = readProjectFile('lib/css/xqplayer.css');
    const popups = [
        'video-control-speed',
        'video-control-set',
        'video-control-volum',
    ];
    for (const name of popups) {
        const block = new RegExp('\\.' + name + '\\s*\\{([\\s\\S]*?)\\}').exec(css);
        assert.ok(block, '找不到 ' + name + ' 的规则');
        assert.ok(
            /left:\s*50%/.test(block[1]) && /translateX\(-50%\)/.test(block[1]),
            name + ' 应以自身容器水平居中，而不是靠 right 硬编码'
        );
    }
    assert.equal(/right:\s*(150|200|245)px/.test(css), false, '仍有硬编码的 right 偏移');
});

test('悬浮弹层用透明连接区跨过触发按钮与弹层之间的间隙', () => {
    const css = readProjectFile('lib/css/xqplayer.css');
    const popups = [
        'video-control-speed',
        'video-control-set',
        'video-control-volum',
    ];
    for (const name of popups) {
        assert.match(css, new RegExp('\\.' + name + '::before'));
    }
    const bridge = /\.video-control-speed::before,[\s\S]*?\.video-control-volum::before\s*\{([\s\S]*?)\}/.exec(
        css
    );
    assert.ok(bridge, '悬浮弹层缺少透明连接区');
    assert.match(bridge[1], /position:\s*absolute/);
    assert.match(bridge[1], /bottom:\s*-8px/);
    assert.match(bridge[1], /height:\s*8px/);
    assert.match(bridge[1], /content:\s*['"]{2}/);
});

test('CSS 里窄屏档位真的会隐藏次要控件', () => {
    const css = readProjectFile('lib/css/xqplayer.css');
    assert.ok(/\.xqvideo-box\.xq-narrow[^{]*\.mobile-no\s*\{[^}]*display:\s*none/.test(css));
    assert.ok(/\.xqvideo-box\.xq-compact[^{]*\.mobile-no\s*\{[^}]*display:\s*none/.test(css));
    assert.ok(/\.xqvideo-box\.xq-compact[^{]*\.video-control-barrage input\s*\{[^}]*display:\s*none/.test(css));
});

test('组件自带 box-sizing 与按钮重置，不依赖宿主页面', () => {
    const css = readProjectFile('lib/css/xqplayer.css');
    assert.ok(/\.xqvideo-box,\s*\.xqvideo-box \*,/.test(css), '缺少 box-sizing 重置');
    const button = /\.xqvideo-box button\s*\{([\s\S]*?)\}/.exec(css);
    assert.ok(button, '缺少 .xqvideo-box button 重置');
    assert.ok(/appearance:\s*none/.test(button[1]), '按钮应清掉原生外观');
    assert.ok(/border:\s*0/.test(button[1]), '按钮应清掉原生边框');
});
