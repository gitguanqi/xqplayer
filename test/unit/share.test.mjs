import test from 'node:test';
import assert from 'node:assert/strict';
import { createFixture } from '../helpers/fixture.mjs';

/**
 * 分享按钮这一块的历史问题：0.0.x 直接 `new XqShare(...)`，没引脚本就抛
 * ReferenceError，点一下分享整个实例就停在那。现在改成三条路 + 降级。
 */

function makeFakeShare() {
    const calls = [];
    function FakeShare(options) {
        calls.push({ type: 'new', options });
        this.options = options;
        this.visible = false;
    }
    FakeShare.prototype.show = function () {
        this.visible = true;
        calls.push({ type: 'show' });
        return this;
    };
    FakeShare.prototype.hide = function () {
        this.visible = false;
        calls.push({ type: 'hide' });
        return this;
    };
    FakeShare.prototype.toggle = function () {
        this.visible = !this.visible;
        calls.push({ type: 'toggle' });
        return this;
    };
    FakeShare.prototype.destroy = function () {
        calls.push({ type: 'destroy' });
    };
    return { FakeShare, calls };
}

test('没有 xqshare 时点击分享不抛错，返回 null 并提示', () => {
    const fixture = createFixture();
    const player = fixture.make();
    let result = null;
    assert.doesNotThrow(() => {
        result = player.shareVideo();
    });
    assert.equal(result, null);
    player.destroy();
});

test('window.XqShare 存在时创建实例并 show，链接与标题传对', () => {
    const fixture = createFixture();
    const { FakeShare, calls } = makeFakeShare();
    fixture.env.sandbox.XqShare = FakeShare;
    const player = fixture.make({ title: '我的视频' });
    const widget = player.shareVideo();

    assert.ok(widget instanceof FakeShare);
    const created = calls.find((item) => item.type === 'new');
    assert.ok(created, '应当 new 出一个分享实例');
    assert.equal(created.options.type, 'pop');
    assert.equal(created.options.title, '我的视频');
    assert.ok(created.options.el, '应把弹层容器传进去');
    assert.equal(widget.visible, true);
    player.destroy();
});

test('options.share 优先于全局构造器', () => {
    const fixture = createFixture();
    const globalFake = makeFakeShare();
    const localFake = makeFakeShare();
    fixture.env.sandbox.XqShare = globalFake.FakeShare;

    const player = fixture.make({ share: localFake.FakeShare });
    const widget = player.shareVideo();

    assert.ok(widget instanceof localFake.FakeShare);
    assert.equal(globalFake.calls.length, 0, '不应回落到全局构造器');
    player.destroy();
});

test('XQVideoPlayer.useShare() 全局注册后可用', () => {
    const fixture = createFixture();
    const { FakeShare } = makeFakeShare();
    fixture.Ctor.useShare(FakeShare);

    const player = fixture.make();
    const widget = player.shareVideo();
    assert.ok(widget instanceof FakeShare);

    // 传 null 应能取消注册
    fixture.Ctor.useShare(null);
    fixture.Ctor.useShare(null);
    player.destroy();
});

test('重复点击走 toggle，不再重复 new', () => {
    const fixture = createFixture();
    const { FakeShare, calls } = makeFakeShare();
    fixture.env.sandbox.XqShare = FakeShare;
    const player = fixture.make();

    player.shareVideo();
    player.shareVideo();

    assert.equal(calls.filter((item) => item.type === 'new').length, 1, '只应创建一次');
    assert.equal(calls.filter((item) => item.type === 'toggle').length, 1, '第二次应走 toggle');
    player.destroy();
});

test('destroy 时连带销毁分享实例', () => {
    const fixture = createFixture();
    const { FakeShare, calls } = makeFakeShare();
    fixture.env.sandbox.XqShare = FakeShare;
    const player = fixture.make();
    player.shareVideo();

    player.destroy();
    assert.ok(calls.some((item) => item.type === 'destroy'), '分享实例应被销毁');
});

test('构造器抛错时降级为 null，不影响实例', () => {
    const fixture = createFixture();
    function Broken() {
        throw new Error('boom');
    }
    const player = fixture.make({ share: Broken });
    let widget = null;
    assert.doesNotThrow(() => {
        widget = player.shareVideo();
    });
    assert.equal(widget, null);
    assert.ok(player.root, '播放器本身仍然可用');
    player.destroy();
});
