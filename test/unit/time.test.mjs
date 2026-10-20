import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from '../helpers/fixture.mjs';

let shared = null;
function player() {
    if (!shared) {
        shared = createFixture().make();
    }
    return shared;
}

test('secondToTime 的边界值', () => {
    const p = player();
    const cases = [
        [0, '00:00:00'],
        [9, '00:00:09'],
        [10, '00:00:10'], // 原实现输出 010
        [59, '00:00:59'],
        [60, '00:01:00'],
        [599, '00:09:59'],
        [600, '00:10:00'], // 原实现分钟位同样少补零
        [3599, '00:59:59'],
        [3600, '01:00:00'],
        [3661, '01:01:01'],
        [35999, '09:59:59'],
        [36000, '10:00:00'],
    ];
    for (const [input, expected] of cases) {
        assert.equal(p.secondToTime(input), expected, input + ' 秒应格式化为 ' + expected);
    }
});

test('secondToTime 对 NaN / 负数 / Infinity 兜底', () => {
    const p = player();
    assert.equal(p.secondToTime(NaN), '00:00:00');
    assert.equal(p.secondToTime(-5), '00:00:00');
    assert.equal(p.secondToTime(Infinity), '00:00:00');
    assert.equal(p.secondToTime(undefined), '00:00:00');
    assert.equal(p.secondToTime('12.8'), '00:00:12');
});

test('timeupdate 同步时间文本与进度', () => {
    const fixture = createFixture();
    const p = fixture.make();
    const video = p.refs.video;
    video.duration = 200;
    video.currentTime = 100;
    video.dispatchEvent({ type: 'timeupdate' });

    assert.equal(p.refs.current.textContent, '00:01:40');
    assert.equal(p.refs.duration.textContent, '00:03:20');
    assert.equal(p.video.process, 50);
    assert.equal(p.refs.progressDot.style.width, '50%');
    p.destroy();
});

test('duration 不可用时进度归零而不是 NaN', () => {
    const fixture = createFixture();
    const p = fixture.make();
    p.refs.video.duration = NaN;
    p.refs.video.currentTime = 3;
    p.refs.video.dispatchEvent({ type: 'timeupdate' });
    assert.equal(p.video.process, 0);
    assert.equal(p.refs.progressDot.style.width, '0%');
    p.destroy();
});
