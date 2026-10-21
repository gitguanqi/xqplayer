/**
 * Vue SFC 静态契约测试。
 *
 * lib/vue/index.vue 不可能在无浏览器环境下真正挂载，所以这里守住的是
 * 「曾经踩过的坑不会再回来」——每条断言都对应一个已经修掉的真实缺陷。
 * 真正的运行时验证交给 test/vue2.html / test/vue3.html 自检页。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const source = readFileSync(join(root, 'lib', 'vue', 'index.vue'), 'utf8');

const VOID_TAGS = new Set([
    'img',
    'input',
    'br',
    'hr',
    'meta',
    'link',
    'source',
    'area',
    'base',
    'col',
    'embed',
    'param',
    'track',
    'wbr',
]);

function blockText(tag, attrs) {
    const re = new RegExp('<' + tag + attrs + '>([\\s\\S]*?)</' + tag + '>');
    const match = source.match(re);
    return match ? match[1] : '';
}

const template = blockText('template', '');
const script = blockText('script', '');
const styles = [...source.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)].map((m) => ({
    attrs: m[1],
    body: m[2],
}));

test('SFC 三个块都存在', () => {
    assert.ok(template.length > 0, '应有 template');
    assert.ok(script.length > 0, '应有 script');
    assert.ok(styles.length >= 2, '应有非 scoped 样式与 less 样式两块');
});

test('template 标签闭合且没有游离的硬编码 id', () => {
    const stack = [];
    const re = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
    let item;
    while ((item = re.exec(template))) {
        const closing = item[1] === '/';
        const tag = item[2];
        const selfClosing = item[4] === '/';
        if (VOID_TAGS.has(tag) || selfClosing) {
            continue;
        }
        if (!closing) {
            stack.push(tag);
        } else {
            const top = stack.pop();
            assert.equal(top, tag, '闭合顺序应正确');
        }
    }
    assert.deepEqual(stack, [], '不应有未闭合的标签');

    const rawIds = template.match(/\sid="/g) || [];
    assert.deepEqual(rawIds, [], '多实例下不能出现写死的 id，请用 uid 拼');
});

test('不再依赖名为 xqshare 的包', () => {
    assert.ok(!/from\s+['"]xqshare['"]/.test(script), '不能 import xqshare');
    assert.ok(!/require\(['"]xqshare['"]\)/.test(script), '不能 require xqshare');
    assert.ok(/shareComponent/.test(script), '应改为运行时解析分享组件');
    assert.ok(/XQ_SHARE_STUB/.test(script), '应有分享组件的空壳兜底');
});

test('不再直接用全局 document 取节点', () => {
    assert.ok(!/getElementById/.test(script), '不能再用 getElementById');
    assert.ok(!/document\.querySelector\(/.test(script), '不能再用全局 querySelector');
    assert.ok(!/document\.body\.className\s*=/.test(script), '不能整体覆盖 body 的 class');
    assert.ok(/toggleScrollLock/.test(script), '应只增删自己的滚动锁类');
});

test('不再直接读 $route', () => {
    // 只允许 routeType 计算属性碰 $route，methods/watch 必须走它
    const linesWithRoute = script.split('\n').filter((line) => line.includes('this.$route'));
    assert.equal(linesWithRoute.length, 1, '$route 只应出现在 routeType 里');
    assert.ok(/return this\.\$route && this\.\$route\.query/.test(linesWithRoute[0]), '应做存在性守卫');
    assert.ok(/routeType\(\)\s*\{[\s\S]{0,160}return this\.\$route/.test(script), '应在 routeType 里做守卫');
    assert.ok(/watch[\s\S]*'routeType'/.test(script), 'watch 应监听 routeType');
});

test('addEventListener 的回调不能用普通 function', () => {
    const offenders = script.match(/addEventListener\([^,]+,\s*function\s*\(/g) || [];
    assert.deepEqual(offenders, [], '普通 function 回调里的 this 不是组件实例');
});

test('图标使用 xvicon 前缀且宿主必须引入主样式表', () => {
    const legacy = template.match(/class="xqvideo xqvideo-/g) || [];
    assert.deepEqual(legacy, [], 'Vue 模板里的图标类应改成 xvicon');
    assert.ok(/class="xvicon xvicon-/.test(template), '应存在 xvicon 图标类');
    const plain = styles.find((item) => item.attrs.trim() === '');
    assert.ok(plain, '应有一个非 scoped 的 style 块');
    assert.ok(/xqvideo-lock-scroll/.test(plain.body), '非 scoped 样式应放 body 滚动锁');
    assert.ok(
        !/@import/.test(plain.body),
        '不在组件里 @import 主样式表，避免和宿主引入的 css 重复'
    );
});

test('悬浮弹层改用不冒泡的悬停事件并补齐连接区', () => {
    for (const binding of [
        '@mouseenter="showQualBar" @mouseleave="hideQualBar"',
        '@mouseenter="showSpeedBar" @mouseleave="hideSpeedBar"',
        '@mouseenter="showSetBar" @mouseleave="hideSetBar"',
        '@mouseenter="showVolBar" @mouseleave="hideVolBar"',
    ]) {
        assert.ok(template.includes(binding), '缺少悬停绑定：' + binding);
    }
    assert.equal(/@mouseover="show(?:Qual|Speed|Set|Vol)Bar"/.test(template), false);
    assert.equal(/@mouseout="hide(?:Qual|Speed|Set|Vol)Bar"/.test(template), false);

    const less = styles.find((item) => /lang=['"]less['"]/.test(item.attrs));
    assert.ok(less, '应有 less 样式块');
    const bridge = /\.video-control-speed::before,[\s\S]*?\.video-control-volum::before\s*\{([\s\S]*?)\}/.exec(
        less.body
    );
    assert.ok(bridge, '悬浮弹层缺少透明连接区');
    assert.match(bridge[1], /position:\s*absolute/);
    assert.match(bridge[1], /bottom:\s*-8px/);
    assert.match(bridge[1], /height:\s*8px/);
    assert.match(bridge[1], /content:\s*['"]{2}/);
});

test('存在 Vue 2 与 Vue 3 双卸载钩子', () => {
    assert.ok(/beforeUnmount\s*\(/.test(script), '应有 Vue 3 的 beforeUnmount');
    assert.ok(/beforeDestroy\s*\(/.test(script), '应有 Vue 2 的 beforeDestroy');
    assert.ok(/teardown\(\)\s*\{/.test(script), '两个钩子应共用 teardown');
});

/** 用花括号配平取出某个方法的函数体 */
function methodBody(name) {
    const start = script.indexOf(name + '() {');
    assert.ok(start !== -1, '应存在方法 ' + name);
    let depth = 0;
    let began = false;
    for (let i = start; i < script.length; i += 1) {
        const ch = script[i];
        if (ch === '{') {
            depth += 1;
            began = true;
        } else if (ch === '}') {
            depth -= 1;
            if (began && depth === 0) {
                return script.slice(start, i + 1);
            }
        }
    }
    return '';
}

test('teardown 真的摘掉所有外部监听', () => {
    const body = methodBody('teardown');
    for (const cleanup of [
        'removeEventListener(\'scroll\'',
        'removeEventListener(\'mouseup\'',
        'destroyMedia',
        'clearTimeout',
        'toggleScrollLock(false)',
    ]) {
        assert.ok(body.includes(cleanup), 'teardown 应包含 ' + cleanup);
    }
});

test('secondToTime 修好了边界条件', () => {
    // 原来的实现用 `> 10` 补零，10 秒会输出 010；这里直接查 promotive 写法
    assert.ok(!/s > 10 \?/.test(script), '不应保留旧的 `> 10` 补零判断');
    assert.ok(/pad\s*=\s*\(val\)/.test(script), '应使用统一的补零函数');
    assert.ok(/Number\.isFinite\(num\)/.test(script), '应对 NaN / Infinity 兜底');
});

test('不再给 img 渲染空 src', () => {
    const imgTags = template.match(/<img[^>]*>/g) || [];
    assert.ok(imgTags.length > 0, '模板里应有 img');
    for (const tag of imgTags) {
        assert.ok(/v-if=/.test(tag), 'img 必须带 v-if 守卫，避免空 src 请求当前页：' + tag);
    }
});

test('poster 不是必填项', () => {
    const posterProp = script.match(/'poster':\s*\{[\s\S]*?\}/)[0];
    assert.ok(!/required:\s*true/.test(posterProp), 'poster 不能是 required');
});
