#!/usr/bin/env node
/**
 * 产物生成脚本。
 *
 * 设计要点：核心段（src -> IIFE）只编译一次，UMD 与 ESM 共用同一份文本，
 * 因此两种格式不可能再出现逻辑漂移。压缩同样只做一次 transform，
 * 所以 umd.min 与 esm.min 的差异仅在包装头尾。
 *
 * 用法：
 *   node scripts/build.mjs           生成全部产物
 *   node scripts/build.mjs --check   只校验磁盘产物是否与源码一致（CI 用）
 *   node scripts/build.mjs --no-minify  离线降级：跳过压缩
 */
import { build, transform } from 'esbuild';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

/* 这四段常量同时被测试引用，保证「构建」与「校验」用的是同一份契约 */
export const BANNER = '/*! xqplayer v' + PKG.version + ' | MIT | ' + PKG.repository.url + ' */\n';

export const UMD_PREFIX = `(function (root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof define === 'function' && define.cmd) {
        define(function (require, exports, module) {
            module.exports = factory();
        });
    } else {
        root.XQVideoPlayer = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function () {
`;

export const UMD_FOOTER = `
var __XQ_NS = __XQ || {};
var __XQ_EXPORT = __XQ_NS.default ? __XQ_NS.default : __XQ_NS;
// 浏览器/CJS 分支拿到的都是构造函数本身，这里把具名 exports 挂到它上面，
// 这样 \`import XQVideoPlayer, { VERSION } from 'xqplayer'\` 与 require 的两种取法都能工作。
var isObjectLike = __XQ_EXPORT && typeof __XQ_EXPORT === 'object';
if (isObjectLike || typeof __XQ_EXPORT === 'function') {
    __XQ_EXPORT.default = __XQ_EXPORT;
    __XQ_EXPORT.XQVideoPlayer = __XQ_EXPORT;
    __XQ_EXPORT.VERSION = __XQ_NS.VERSION;
}
return __XQ_EXPORT;
});
`;

export const ESM_EXPORT = `
var __XQ_NS = __XQ || {};
var __XQ_EXPORT = __XQ_NS.default ? __XQ_NS.default : __XQ_NS;
var __XQ_VERSION = __XQ_NS.VERSION;
export default __XQ_EXPORT;
export { __XQ_EXPORT as XQVideoPlayer, __XQ_VERSION as VERSION };
`;

const TARGET = ['es2018'];

async function compileCore() {
    const result = await build({
        entryPoints: [join(ROOT, 'src/index.mjs')],
        bundle: true,
        write: false,
        format: 'iife',
        globalName: '__XQ',
        platform: 'browser',
        target: TARGET,
        charset: 'utf8',
        legalComments: 'none',
        logLevel: 'silent',
        define: {
            __XQ_VERSION__: JSON.stringify(PKG.version),
        },
    });
    return result.outputFiles[0].text.replace(/\r\n/g, '\n');
}

async function minify(code, loader) {
    const result = await transform(code, {
        loader: loader,
        minify: true,
        target: TARGET,
        charset: 'utf8',
        legalComments: 'none',
    });
    return result.code.replace(/\r\n/g, '\n');
}

/** 由 iconfont.json 生成独立图标样式，供 Vue 组件在未引入主样式表时使用 */
function renderIconCss() {
    const font = JSON.parse(readFileSync(join(ROOT, 'lib/fonts/iconfont.json'), 'utf8'));
    const lines = [
        '/* 由 lib/fonts/iconfont.json 生成，请勿手改 */',
        '@font-face {',
        '  font-family: "xqvideo";',
        '  src: url(\'../fonts/iconfont.eot?t=1664871125951\');',
        '  src: url(\'../fonts/iconfont.eot?t=1664871125951#iefix\') format(\'embedded-opentype\'),',
        '    url(\'../fonts/iconfont.woff2?t=1664871125951\') format(\'woff2\'),',
        '    url(\'../fonts/iconfont.woff?t=1664871125951\') format(\'woff\'),',
        '    url(\'../fonts/iconfont.ttf?t=1664871125951\') format(\'truetype\'),',
        '    url(\'../fonts/iconfont.svg?t=1664871125951#xqvideo\') format(\'svg\');',
        '}',
        '',
        '.xvicon {',
        '  font-family: "xqvideo" !important;',
        '  font-size: 16px;',
        '  font-style: normal;',
        '  -webkit-font-smoothing: antialiased;',
        '  -moz-osx-font-smoothing: grayscale;',
        '}',
        '',
    ];
    const glyphs = Array.isArray(font.glyphs) ? font.glyphs : [];
    for (const glyph of glyphs) {
        lines.push('.xvicon-' + glyph.font_class + ':before {');
        lines.push('  content: "\\' + glyph.unicode + '";');
        lines.push('}');
        lines.push('');
    }
    return lines.join('\n');
}

/** 生成「相对路径 -> 内容」的产物表，不落盘 */
async function collectArtifacts(options) {
    const minifyEnabled = options.minify !== false;
    const core = await compileCore();
    const banner = BANNER;

    const umd = UMD_PREFIX + banner + core + UMD_FOOTER;
    const esm = banner + core + ESM_EXPORT;

    let umdMin = umd;
    let esmMin = esm;
    if (minifyEnabled) {
        umdMin = await minify(umd, 'js');
        esmMin = await minify(esm, 'js');
    }

    const css = readFileSync(join(ROOT, 'lib/css/xqplayer.css'), 'utf8');
    const cssMin = minifyEnabled ? await minify(css, 'css') : css;

    const files = new Map();
    files.set('lib/js/xqplayer.js', umd);
    files.set('lib/js/xqplayer.min.js', umdMin);
    files.set('lib/js/xqplayer-esm.mjs', esm);
    files.set('lib/js/xqplayer-esm.min.mjs', esmMin);
    // 旧 CDN 与旧文档里的 .js 路径继续可用（浏览器里靠 <script type="module"> 加载）
    files.set('lib/js/xqplayer-esm.js', esm);
    files.set('lib/js/xqplayer-esm.min.js', esmMin);
    files.set('lib/css/xqplayer.min.css', cssMin);
    files.set('lib/css/xqplayer-icon.css', renderIconCss());
    return files;
}

async function main() {
    const args = process.argv.slice(2);
    const checkOnly = args.indexOf('--check') !== -1;
    const minifyEnabled = args.indexOf('--no-minify') === -1;

    const files = await collectArtifacts({ minify: minifyEnabled });

    if (checkOnly) {
        const stale = [];
        for (const [relative, content] of files) {
            const absolute = join(ROOT, relative);
            if (!existsSync(absolute)) {
                stale.push(relative + ' (missing)');
                continue;
            }
            const current = readFileSync(absolute, 'utf8').replace(/\r\n/g, '\n');
            if (current !== content) {
                stale.push(relative + ' (differs)');
            }
        }
        if (stale.length) {
            console.error('[build] 产物与源码不一致：');
            for (const item of stale) {
                console.error('  - ' + item);
            }
            console.error('[build] 请运行 npm run build 重新生成，不要手改 lib/ 下的产物。');
            process.exit(1);
        }
        console.log('[build] check ok，' + files.size + ' 个产物与源码一致');
        return;
    }

    for (const [relative, content] of files) {
        const absolute = join(ROOT, relative);
        mkdirSync(dirname(absolute), { recursive: true });
        writeFileSync(absolute, content, 'utf8');
        console.log('[build] wrote ' + relative + ' (' + Buffer.byteLength(content) + ' bytes)');
    }
    if (!minifyEnabled) {
        console.warn('[build] --no-minify：.min.* 产物为未压缩副本');
    }
}

const isDirectRun =
    process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
    main().catch((error) => {
        console.error('[build] 失败：' + (error && error.message ? error.message : error));
        process.exit(1);
    });
}
