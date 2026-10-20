import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture, fire } from '../helpers/fixture.mjs';

function twoPlayers() {
    const fixture = createFixture();
    const a = fixture.make();
    const b = fixture.make();
    return { fixture, a, b };
}

test('播放按钮只操作自己的 video', () => {
    const { a, b } = twoPlayers();
    fire(b.refs.play, 'click');
    assert.equal(b.refs.video.playCount, 1);
    assert.equal(a.refs.video.playCount, 0);
    assert.equal(b.refs.video.paused, false);
    assert.equal(a.refs.video.paused, true);
    a.destroy();
    b.destroy();
});

test('两个实例的按钮和输入不会互相绑定', () => {
    const { a, b } = twoPlayers();
    assert.notEqual(a.refs.video, b.refs.video);
    assert.notEqual(a.refs.play, b.refs.play);
    assert.notEqual(a.refs.progress, b.refs.progress);
    assert.notEqual(a.refs.barrageInput, b.refs.barrageInput);
    a.destroy();
    b.destroy();
});

test('进度条只影响自己的实例', () => {
    const { a, b } = twoPlayers();
    for (const p of [a, b]) {
        p.refs.video.duration = 100;
        p.refs.progress.clientWidth = 200;
        p.refs.progress.offsetLeft = 0;
    }
    fire(a.refs.progress, 'pointerdown', { clientX: 50 });
    assert.ok(Math.abs(a.refs.video.currentTime - 25) < 0.001, 'A 应跳到 25 秒');
    assert.equal(b.refs.video.currentTime, 0, 'B 不应变化');
    assert.equal(a.refs.current.textContent, '00:00:25');
    assert.equal(b.refs.current.textContent, '00:00:00', 'B 的时间文本应停留在初始值');
    a.destroy();
    b.destroy();
});

test('音量条只影响自己的实例', () => {
    const { a, b } = twoPlayers();
    for (const p of [a, b]) {
        p.refs.volBar.clientHeight = 100;
        p.refs.volBar.offsetTop = 0;
    }
    fire(a.refs.volBar, 'pointerdown', { clientY: 25 });
    assert.ok(Math.abs(a.refs.video.volume - 0.75) < 0.001, 'A 音量应为 75%');
    assert.equal(b.refs.video.volume, 1, 'B 音量应保持 100%');
    a.destroy();
    b.destroy();
});

test('状态提示与弹幕互不串台', () => {
    const { a, b } = twoPlayers();
    b.setStatus('只属于 B');
    assert.equal(b.refs.statusText.textContent, '只属于 B');
    assert.equal(a.refs.statusText.textContent, '');

    b.refs.barrageToggle.dispatchEvent({ type: 'click' });
    b.refs.barrageInput.value = 'B 的弹幕';
    b.sendBarrage();
    assert.equal(b.refs.barrageList.children.length, 1);
    assert.equal(a.refs.barrageList.children.length, 0);
    a.destroy();
    b.destroy();
});

test('滚动只驱动自己的小窗状态', () => {
    const { fixture, a, b } = twoPlayers();
    fixture.env.document.documentElement.scrollTop = 900;
    fixture.env.window.dispatchEvent({ type: 'scroll' });
    assert.equal(a.video.isDraw, true);
    assert.equal(b.video.isDraw, true, '两个实例都监听滚动，各自进入小窗');

    a.hideDraw();
    assert.equal(a.video.isDraw, false);
    assert.equal(a.refs.box.classList.contains('draw'), false);
    a.destroy();
    b.destroy();
});
