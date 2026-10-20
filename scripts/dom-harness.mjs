#!/usr/bin/env node
/**
 * stub DOM 行为回归。
 *
 * node --check 只能证明产物能解析；这里的每个场景都把**构建产物**真正跑起来，
 * 覆盖多实例隔离、监听器只注册一次、缺依赖降级、XSS、拖拽换算、销毁清理。
 *
 * 用法：
 *   node scripts/dom-harness.mjs --all
 *   node scripts/dom-harness.mjs --entry lib/js/xqplayer.min.js --all
 *   node scripts/dom-harness.mjs --json
 */
import { createFixture, fire, isVisible } from '../test/helpers/fixture.mjs';

const scenarios = [];
function scenario(name, fn) {
    scenarios.push({ name, fn });
}

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

/* --------------------------------------------------------------- 场景定义 */

scenario('basic-construct', () => {
    const fixture = createFixture();
    const player = fixture.make({ poster: './data/poster.jpg' });
    assert(player.root, '构造后应注入根节点');
    assert(player.refs.video, '应有 video 引用');
    assert(player.refs.video.getAttribute('src') === './data/movie.mp4', 'mp4 应写入 src');
    assert(player.refs.video.getAttribute('poster') === './data/poster.jpg', '应写入 poster');
    assert(player.refs.play.listenerCount('click') === 1, '播放按钮只应绑定一次');
    assert(fixture.env.messages('error').length === 0, '构造不应产生 console.error');
});

scenario('option-defaults', () => {
    const fixture = createFixture();
    // 不传 poster / barrages / width / height，0.0.x 会因为 poster 默认空串而抛错
    const player = fixture.make();
    assert(player.refs.video.getAttribute('src'), '未传 poster 也应正常构造');
    assert(player.options.width === 1200 && player.options.height === 600, '尺寸默认值应为 1200x600');
    assert(player.video.barrageList.length === 0, '默认弹幕应为空数组');
});

scenario('two-instances', () => {
    const fixture = createFixture();
    const a = fixture.make();
    const b = fixture.make();

    fire(b.refs.play, 'click');
    assert(b.refs.video.playCount === 1, 'B 点播放应只调用 B 的 video.play');
    assert(a.refs.video.playCount === 0, 'A 的 video.play 不应被调用');
    assert(a.refs.video.paused === true, 'A 应仍在暂停');

    // 进度条只影响自己的实例
    a.refs.video.duration = 100;
    b.refs.video.duration = 100;
    a.refs.progress.clientWidth = 200;
    a.refs.progress.offsetLeft = 0;
    fire(a.refs.progress, 'pointerdown', { clientX: 100 });
    assert(Math.abs(a.refs.video.currentTime - 50) < 0.001, 'A 的进度应跳到 50%');
    assert(b.refs.video.currentTime === 0, 'B 的进度不应被 A 影响');

    // 状态提示文本互不干扰
    b.setStatus('B 的提示');
    assert(b.refs.statusText.textContent === 'B 的提示', 'B 的状态文本应更新');
    assert(a.refs.statusText.textContent === '', 'A 的状态文本不应变化');
});

scenario('destroy-cleanup', () => {
    const fixture = createFixture();
    const player = fixture.make();
    const root = player.root;
    const video = player.refs.video;
    const before = video.listenerCount();
    const windowBefore = fixture.env.window.listenerCount('scroll');

    player.destroy();

    assert(before > 0, '销毁前应存在媒体监听器');
    assert(windowBefore === 1, '构造时应注册 1 个 window scroll 监听，实际 ' + windowBefore);
    assert(video.listenerCount() === 0, '销毁后媒体监听器应清空');
    assert(
        fixture.env.window.listenerCount('scroll') === 0,
        '销毁后应摘除 window scroll 监听'
    );
    assert(root.parentNode === null, '根节点应从 DOM 移除');
    assert(player.root === null, 'root 引用应清空');

    player.destroy();
    assert(player.root === null, '重复 destroy 应幂等');
});

scenario('missing-hls', () => {
    const fixture = createFixture();
    const player = fixture.make({ mode: 'm3u8' });
    assert(player.video.error === true, '缺少 hls.js 时应进入错误态');
    assert(isVisible(player.refs.error), '错误遮罩应可见');
    const warns = fixture.env.messages('warn').filter((line) => line.indexOf('hls.js') !== -1);
    assert(warns.length === 1, '缺少 hls.js 应只告警一次，实际：' + warns.length);
});

scenario('hls-stub', () => {
    const fixture = createFixture();
    const calls = [];
    function FakeHls() {
        this.attachMedia = (el) => calls.push(['attachMedia', el]);
        this.on = (event, fn) => {
            calls.push(['on', event]);
            if (event === 'media_attached') {
                fn();
            }
            return this;
        };
        this.loadSource = (src) => calls.push(['loadSource', src]);
        this.destroy = () => calls.push(['destroy']);
    }
    FakeHls.isSupported = () => true;
    FakeHls.Events = { MEDIA_ATTACHED: 'media_attached', MANIFEST_PARSED: 'manifest_parsed' };
    fixture.env.sandbox.Hls = FakeHls;

    const player = fixture.make({ mode: 'm3u8' });
    const names = calls.map((call) => call[0]);
    assert(names.indexOf('attachMedia') !== -1, '应调用 attachMedia');
    assert(names.indexOf('loadSource') !== -1, '应调用 loadSource');
    assert(player.video.error === false, '有 hls.js 时不应进入错误态');

    player.destroy();
    assert(calls.some((call) => call[0] === 'destroy'), 'destroy 应销毁 hls 实例');
});

scenario('xss-barrage', () => {
    const fixture = createFixture();
    const player = fixture.make({
        barrages: [{ content: '<img src=x onerror=alert(1)>', name: 'a' }],
    });
    player.refs.barrageToggle.dispatchEvent({ type: 'click' });
    const items = player.refs.barrageList.children;
    assert(items.length === 1, '应渲染 1 条弹幕');
    assert(items[0].querySelectorAll('img').length === 0, '内容里的 img 不应被解析成节点');
    assert(
        items[0].textContent.indexOf('<img src=x onerror=alert(1)>') !== -1,
        '内容应作为纯文本显示'
    );
    assert(items[0].querySelectorAll('script').length === 0, '不应出现 script 节点');
});

scenario('drag-volume', () => {
    const fixture = createFixture();
    const player = fixture.make();
    const bar = player.refs.volBar;
    bar.clientHeight = 100;
    bar.offsetTop = 500;

    fire(bar, 'pointerdown', { clientY: 550 });
    assert(Math.abs(player.refs.video.volume - 0.5) < 0.001, '点在中间应为 0.5，实际 ' + player.refs.video.volume);

    fire(bar, 'pointerdown', { clientY: 500 });
    assert(Math.abs(player.refs.video.volume - 1) < 0.001, '点在顶端应为 1');

    fire(bar, 'pointerdown', { clientY: 700 });
    assert(player.refs.video.volume === 0, '拖到下方应被夹到 0');
    assert(player.video.muted === true, '音量为 0 应视为静音');

    fire(bar, 'pointerup', {});
    fire(bar, 'pointermove', { clientY: 550 });
    assert(Math.abs(player.refs.video.volume - 0) < 0.001, '松开后移动指针不应改变音量');
});

scenario('drag-progress', () => {
    const fixture = createFixture();
    const player = fixture.make();
    const bar = player.refs.progress;
    bar.clientWidth = 200;
    bar.offsetLeft = 0;
    player.refs.video.duration = 100;

    fire(bar, 'pointerdown', { clientX: 100 });
    assert(Math.abs(player.refs.video.currentTime - 50) < 0.001, '点到中间应跳到 50 秒');
    assert(player.refs.current.textContent === '00:00:50', '时间文本应为 00:00:50');

    fire(bar, 'pointerdown', { clientX: 400 });
    assert(Math.abs(player.refs.video.currentTime - 100) < 0.001, '超出右边界应夹到 100%');
    assert(player.video.process === 100, '进度百分比应为 100');
});

scenario('error-recovery', () => {
    const fixture = createFixture();
    const player = fixture.make();

    player.refs.video.error = { code: 4 };
    fire(player.refs.video, 'error');
    assert(player.video.error === true, 'error 事件应进入错误态');
    assert(isVisible(player.refs.error), '错误遮罩应显示');
    assert(player.refs.errorText.textContent.indexOf('地址不可用') !== -1, '应给出可读原因');

    fire(player.refs.video, 'canplay');
    assert(player.video.error === false, 'canplay 后应清除错误态');
    assert(!isVisible(player.refs.error), 'canplay 后错误遮罩应隐藏');
});

scenario('legacy-api', () => {
    const fixture = createFixture();
    const player = fixture.make();
    const other = fixture.make();

    assert(player.gid('myvideo') === player.refs.video, 'gid 仍应返回本实例的 video');
    assert(player.gid('myvideo') !== other.refs.video, 'gid 不应返回另一个实例的节点');
    assert(player.dom('.video-control') !== null, 'dom 应限定在实例内');
    assert(typeof player.secondToTime(3661) === 'string', 'secondToTime 应可用');
    assert(player.secondToTime(3661) === '01:01:01', '时间格式应为 hh:mm:ss');
});

scenario('status-timer', () => {
    const fixture = createFixture();
    const player = fixture.make();
    player.setStatus('第一次');
    player.setStatus('第二次');
    player.setStatus('第三次');
    assert(player.refs.statusText.textContent === '第三次', '连续调用应保留最后一次文本');
    assert(isVisible(player.refs.status), '状态条应可见');
});

/* ------------------------------------------------------------------ 执行 */

function main() {
    const args = process.argv.slice(2);
    const entryIndex = args.indexOf('--entry');
    const entry = entryIndex !== -1 ? args[entryIndex + 1] : undefined;
    const asJson = args.indexOf('--json') !== -1;
    const only = args.indexOf('--only') !== -1 ? args[args.indexOf('--only') + 1] : '';

    const selected = only
        ? scenarios.filter((item) => item.name.indexOf(only) !== -1)
        : scenarios;

    const results = [];
    let failed = 0;

    if (entry) {
        process.env.XQ_HARNESS_ENTRY = entry;
    }

    for (const item of selected) {
        try {
            item.fn();
            results.push({ name: item.name, status: 'PASS' });
            if (!asJson) {
                console.log('PASS  ' + item.name);
            }
        } catch (error) {
            failed += 1;
            results.push({ name: item.name, status: 'FAIL', error: String(error && error.message) });
            if (!asJson) {
                console.log('FAIL  ' + item.name + '  -> ' + (error && error.message));
            }
        }
    }

    if (asJson) {
        console.log(JSON.stringify({ entry: entry || 'lib/js/xqplayer.js', results }, null, 2));
    } else {
        console.log('');
        console.log(
            (failed ? 'FAILED' : 'PASSED') +
                ': ' +
                (results.length - failed) +
                '/' +
                results.length +
                ' 场景通过'
        );
    }

    if (failed) {
        process.exit(1);
    }
}

main();
