import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from '../helpers/fixture.mjs';

test('只传 el 与 url 即可构造（poster 不再是必填）', () => {
    const fixture = createFixture();
    const player = fixture.make({ url: './a.mp4' });
    assert.ok(player.root);
    assert.equal(player.refs.video.getAttribute('src'), './a.mp4');
    assert.equal(player.refs.video.getAttribute('poster'), null);
    player.destroy();
});

test('el 可以是 DOM 元素，也可以是选择器', () => {
    const fixture = createFixture();
    const bySelector = fixture.makeBySelector('#p1');
    assert.ok(bySelector.root);
    assert.ok(bySelector.__host.contains(bySelector.root));
    bySelector.destroy();

    const host = fixture.env.document.createElement('div');
    fixture.env.document.body.appendChild(host);
    const byElement = new fixture.Ctor({ el: host, url: './b.mp4' });
    assert.ok(host.contains(byElement.root));
    byElement.destroy();
});

test('缺少 el 或 url 时抛出带前缀的可读错误', () => {
    const fixture = createFixture();
    assert.throws(() => new fixture.Ctor({ url: './a.mp4' }), /\[xqplayer\].*el/);
    assert.throws(() => new fixture.Ctor({ el: '#nope' }), /\[xqplayer\].*url/);
    assert.throws(() => new fixture.Ctor(), /\[xqplayer\]/);
});

test('选择器找不到容器时给出明确报错', () => {
    const fixture = createFixture();
    assert.throws(
        () => new fixture.Ctor({ el: '#not-exist', url: './a.mp4' }),
        /找不到容器元素/
    );
});

test('非法 mode 进入错误态而不是抛异常', () => {
    const fixture = createFixture();
    const player = fixture.make({ mode: 'avi' });
    assert.equal(player.video.error, true);
    assert.equal(player.refs.error.classList.contains('hide'), false);
    const warns = fixture.env.messages('warn');
    assert.ok(
        warns.some((line) => line.indexOf('不支持的视频类型') !== -1),
        '应给出不支持的告警，实际：' + JSON.stringify(warns)
    );
    player.destroy();
});

test('默认值与 0.0.x 保持一致', () => {
    const fixture = createFixture();
    const player = fixture.make();
    assert.equal(player.options.mode, 'mp4');
    assert.equal(player.options.width, 1200);
    assert.equal(player.options.height, 600);
    assert.equal(player.video.vol, 100);
    assert.equal(player.video.curSpeed, 1);
    assert.equal(player.video.draw, true);
    assert.equal(player.video.barrageList.length, 0);
    player.destroy();
});

test('容器里的旧内容不会被清空（仍以 append 方式注入）', () => {
    const fixture = createFixture();
    const host = fixture.env.document.createElement('div');
    host.innerHTML = '<p class="keep">保留</p>';
    fixture.env.document.body.appendChild(host);
    const player = new fixture.Ctor({ el: host, url: './a.mp4' });
    assert.equal(host.querySelector('.keep').textContent, '保留');
    assert.ok(host.querySelector('.xqvideo'));
    player.destroy();
    assert.equal(host.querySelector('.xqvideo'), null, 'destroy 只移除播放器自身');
    assert.equal(host.querySelector('.keep').textContent, '保留');
});
