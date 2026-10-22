/**
 * Agent 元数据契约测试。
 *
 * 守住三件事：
 * 1. `package.json` 里的 llms / agents 指向真实存在的文件，且这两个文件真的会被 npm 打上游包；
 * 2. `llms.txt` 描述的是已发布的运行时导出，而不是源码里的内部实现；
 * 3. `SKILL.md` 的 frontmatter 与 references 链接可用、可移植（跟着技能目录走，不依赖仓库路径）。
 *
 * 这几条一旦失守，消费方（人也好、AI 也好）拿到的就是错的 API —— 比没有文档更糟。
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, readProjectFile } from '../helpers/fixture.mjs';
import { DEFAULTS } from '../../src/config.mjs';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const Ctor = require(join(ROOT, 'lib/js/xqplayer.js'));

const LLMS = readProjectFile('llms.txt');
const SKILL_PATH = 'skills/xqplayer-integration/SKILL.md';
const SKILL = readProjectFile(SKILL_PATH);
const SKILL_DIR = posix.dirname(SKILL_PATH);

/** files 白名单是否覆盖某个相对路径（npm 里目录条目覆盖其下全部文件） */
function whitelisted(relative) {
    const target = relative.replace(/\\/g, '/');
    return pkg.files.some((entry) => {
        const normalized = entry.replace(/^\.\//, '').replace(/\/$/, '');
        return target === normalized || target.startsWith(normalized + '/');
    });
}

function normalize(text) {
    return text.replace(/\r\n/g, '\n');
}

test('package.json 声明了 llms 与 agents，且目标文件存在', () => {
    assert.equal(pkg.llms, './llms.txt');
    assert.equal(pkg.agents, './' + SKILL_PATH);
    for (const key of ['llms', 'agents']) {
        assert.ok(pkg[key].startsWith('./'), key + ' 必须是以 ./ 开头的包内相对路径');
        assert.ok(existsSync(join(ROOT, pkg[key])), key + ' 指向的文件不存在：' + pkg[key]);
    }
});

test('llms.txt 与技能目录都会被打进 tarball', () => {
    for (const relative of ['llms.txt', SKILL_PATH]) {
        assert.ok(whitelisted(relative), relative + ' 未被 files 白名单覆盖，不会发布到 npm');
    }
    assert.ok(whitelisted('skills/xqplayer-integration/references/api.md'));
});

test('llms.txt 覆盖全部运行时导出', () => {
    // 真实导出面：默认导出 + 具名导出（UMD 侧把它们挂在构造函数上）
    const runtime = {
        XQVideoPlayer: typeof Ctor,
        VERSION: typeof Ctor.VERSION,
        useShare: typeof Ctor.useShare,
    };
    for (const [name, kind] of Object.entries(runtime)) {
        assert.equal(kind === 'undefined', false, name + ' 应当存在于产物里');
        assert.ok(LLMS.includes(name), 'llms.txt 未记录运行时导出 ' + name);
    }
    for (const name of ['version', 'isSupportedMode']) {
        assert.equal(typeof Ctor[name], name === 'version' ? 'string' : 'function');
        assert.ok(LLMS.includes(name), 'llms.txt 未记录静态成员 XQVideoPlayer.' + name);
    }
});

test('llms.txt 记录了每一个构造参数及其真实默认值', () => {
    for (const key of Object.keys(DEFAULTS)) {
        assert.ok(LLMS.includes('`' + key + '`'), 'llms.txt 未记录构造参数 ' + key);
    }
    // 关键默认值抽检：写错默认值比不写更容易误导
    assert.ok(LLMS.includes("default `'mp4'`"), 'mode 默认值应为 mp4');
    assert.ok(LLMS.includes('default `1200`'), 'width 默认值应为 1200');
    assert.ok(LLMS.includes('default `600`'), 'height 默认值应为 600');
});

test('llms.txt 记录的实例方法都真实存在', () => {
    const methods = [
        'playVideo', 'setVolume', 'setVolumeRatio', 'setProgressRatio', 'setSpeed',
        'videoMuted', 'reload', 'loadVideo', 'setStatus', 'setLoading', 'setError',
        'clearError', 'fullScreenOpen', 'fullScreenCancel', 'toggleControl', 'toggleInfo',
        'toggleQualBar', 'toggleSpeed', 'toggleSet', 'toggleVol', 'toggleBarrage',
        'addDraw', 'hideDraw', 'sendBarrage', 'showBarrage', 'shareVideo',
        'secondToTime', 'syncTimeDom', 'syncProgressDom', 'syncPlayState',
        'q', 'qa', 'dom', 'domAll', 'gid', 'destroy',
    ];
    for (const name of methods) {
        assert.equal(typeof Ctor.prototype[name], 'function', '产物缺少方法 ' + name);
        assert.ok(LLMS.includes(name), 'llms.txt 未记录实例方法 ' + name);
    }
});

test('llms.txt 里的子路径导入都能在 exports 里解析', () => {
    const referenced = new Set(
        (LLMS.match(/xqplayer\/(?:css\/[\w.-]+|vue|fonts\/\*)/g) || []).map((item) => item)
    );
    assert.ok(referenced.size > 0, 'llms.txt 应至少给出一条子路径导入示例');
    for (const specifier of referenced) {
        const subpath = '.' + specifier.slice('xqplayer'.length);
        assert.ok(pkg.exports[subpath], 'exports 里没有 ' + subpath + '，但 llms.txt 提到了它');
        const target = pkg.exports[subpath];
        const file = typeof target === 'string' ? target : target.import || target.default;
        assert.ok(existsSync(join(ROOT, file)), subpath + ' 指向的 ' + file + ' 不存在');
    }
});

test('llms.txt 不引用未发布的源码路径', () => {
    for (const forbidden of ['src/', 'scripts/', 'test/', 'node_modules/']) {
        assert.equal(LLMS.includes(forbidden), false, 'llms.txt 不应出现 ' + forbidden);
    }
});

test('技能 frontmatter 合法，name 与目录同名', () => {
    const text = normalize(SKILL);
    const match = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(match, 'SKILL.md 必须以 YAML frontmatter 开头');
    const front = match[1];
    const name = (front.match(/^name:\s*(.+)$/m) || [])[1];
    const description = (front.match(/^description:\s*(.+)$/m) || [])[1];

    assert.ok(name, 'frontmatter 缺少 name');
    assert.equal(name, posix.basename(SKILL_DIR), 'name 应与技能目录同名');
    assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/, 'name 必须是全小写连字符形式');

    assert.ok(description, 'frontmatter 缺少 description');
    assert.ok(description.length >= 60, 'description 太短，应同时说明能力与加载时机');
    assert.ok(description.includes('xqplayer'), 'description 应点明包名');
});

test('SKILL.md 的 references 链接都存在且可移植', () => {
    const links = new Set((normalize(SKILL).match(/references\/[\w.-]+\.md/g) || []));
    assert.ok(links.size > 0, 'SKILL.md 应链接至少一个 references 文件');
    for (const link of links) {
        const relative = posix.join(SKILL_DIR, link);
        assert.ok(existsSync(join(ROOT, relative)), '引用的 ' + relative + ' 不存在');
        assert.ok(whitelisted(relative), relative + ' 不会被打进 tarball');
        // 引用必须相对技能目录，不能出现仓库绝对路径
        assert.equal(link.includes('..'), false, '技能内引用不应使用 ../ 越出技能目录');
    }
    for (const source of [normalize(LLMS), normalize(SKILL)]) {
        assert.equal(/[A-Z]:\\|\.\.\//.test(source), false, '文档里不应出现绝对路径或 ../ 引用');
    }
});

test('元数据里没有遗留占位符', () => {
    const files = ['llms.txt', SKILL_PATH, posix.join(SKILL_DIR, 'references/api.md'), posix.join(SKILL_DIR, 'references/examples.md')];
    for (const relative of files) {
        const text = readProjectFile(relative);
        for (const marker of ['TODO', 'FIXME', 'placeholder', 'xxx', '<TBD>']) {
            assert.equal(text.includes(marker), false, relative + ' 里还留着 ' + marker);
        }
    }
});

test('文档没有宣称不存在的依赖或宿主能力', () => {
    // 这三处是真实的坑：SSR 不支持、mode 不按后缀推断、Vue 需要宿主自带 less
    assert.ok(LLMS.includes('Browser only'), 'llms.txt 必须点明仅浏览器可用');
    assert.ok(/not inferred|Not inferred/.test(LLMS), 'llms.txt 必须说明 mode 不按后缀推断');
    assert.ok(LLMS.includes('less'), 'llms.txt 必须提示 Vue 侧需要 less 编译');
    assert.equal(LLMS.includes('Nuxt'), false, 'llms.txt 不应宣称未验证的 Nuxt 集成');
});
