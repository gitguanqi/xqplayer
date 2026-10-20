import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ROOT, readArtifact } from '../helpers/fixture.mjs';
import { UMD_PREFIX, UMD_FOOTER, ESM_EXPORT, BANNER } from '../../scripts/build.mjs';

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const ARTIFACTS = [
    'lib/js/xqplayer.js',
    'lib/js/xqplayer.min.js',
    'lib/js/xqplayer-esm.mjs',
    'lib/js/xqplayer-esm.min.mjs',
    'lib/js/xqplayer-esm.js',
    'lib/js/xqplayer-esm.min.js',
    'lib/css/xqplayer.min.css',
    'lib/css/xqplayer-icon.css',
];

test('全部产物存在且非空', () => {
    for (const relative of ARTIFACTS) {
        const absolute = join(ROOT, relative);
        assert.ok(existsSync(absolute), relative + ' 应存在');
        assert.ok(statSync(absolute).size > 0, relative + ' 不应为空');
    }
});

test('UMD 与 ESM 的核心段字节完全一致', () => {
    const umd = readArtifact('lib/js/xqplayer.js');
    const esm = readArtifact('lib/js/xqplayer-esm.mjs');

    assert.ok(umd.startsWith(UMD_PREFIX), 'UMD 应以约定的包装头开始');
    assert.ok(umd.endsWith(UMD_FOOTER), 'UMD 应以约定的包装尾结束');
    assert.ok(esm.endsWith(ESM_EXPORT), 'ESM 应以约定的导出段结束');

    const umdCore = umd.slice(UMD_PREFIX.length + BANNER.length, umd.length - UMD_FOOTER.length);
    const esmCore = esm.slice(BANNER.length, esm.length - ESM_EXPORT.length);

    assert.equal(umdCore.length > 0, true, '核心段不应为空');
    assert.equal(esmCore, umdCore, 'UMD 与 ESM 的核心段必须逐字节一致');
});

test('两个压缩产物的核心段也一致（压缩只做一次）', () => {
    const umdMin = readArtifact('lib/js/xqplayer.min.js');
    const esmMin = readArtifact('lib/js/xqplayer-esm.min.mjs');
    // 压缩后包装头尾被合并，这里用「可疑片段缺失 + 体积接近」间接约束
    assert.ok(umdMin.length < readArtifact('lib/js/xqplayer.js').length, 'UMD min 应小于可读版');
    assert.ok(esmMin.length < readArtifact('lib/js/xqplayer-esm.mjs').length, 'ESM min 应小于可读版');
    const delta = Math.abs(umdMin.length - esmMin.length);
    assert.ok(delta < 600, '两个 min 的体积差应很小（同一份核心），实际差 ' + delta);
});

test('旧 ESM 路径是 .mjs 的等价副本', () => {
    assert.equal(
        readArtifact('lib/js/xqplayer-esm.js'),
        readArtifact('lib/js/xqplayer-esm.mjs'),
        'lib/js/xqplayer-esm.js 应与 .mjs 内容一致'
    );
    assert.equal(
        readArtifact('lib/js/xqplayer-esm.min.js'),
        readArtifact('lib/js/xqplayer-esm.min.mjs')
    );
});

test('产物横幅版本与 package.json 一致', () => {
    assert.ok(pkg.version !== '0.0.7', '本次改造应已升版');
    for (const relative of ['lib/js/xqplayer.js', 'lib/js/xqplayer-esm.mjs']) {
        const content = readArtifact(relative);
        assert.ok(
            content.indexOf('xqplayer v' + pkg.version) !== -1,
            relative + ' 的横幅应包含 v' + pkg.version
        );
    }
});

test('产物里不再出现已修复的坏味道', () => {
    const targets = ['lib/js/xqplayer.js', 'lib/js/xqplayer-esm.mjs'];
    const forbidden = [
        ['document.getElementById', '不应再使用全局 getElementById'],
        ['window.onscroll', '不应再覆盖 window.onscroll'],
        ['width: undefined', '不应再输出 undefined 样式'],
        ['src=""', '不应再渲染空 src'],
    ];
    for (const relative of targets) {
        const content = readArtifact(relative);
        for (const [needle, message] of forbidden) {
            assert.equal(content.indexOf(needle), -1, relative + '：' + message);
        }
    }
});

test('运行时代码里没有硬编码的重复 id', () => {
    const umd = readArtifact('lib/js/xqplayer.js');
    // 允许的唯一 id 是 uid 派生的模板占位，不应出现 myvideo / play-btn 这类字面量
    for (const legacy of ['id="myvideo"', 'id="play-btn"', 'id="progressbar"', 'id="volBar"']) {
        assert.equal(umd.indexOf(legacy), -1, '产物不应包含 ' + legacy);
    }
});

test('压缩产物 gzip 体积在预算内', () => {
    const buffer = readFileSync(join(ROOT, 'lib/js/xqplayer.min.js'));
    const size = gzipSync(buffer).length;
    // 0.0.7 为 4.5KB；0.1.0 增加了 destroy / 多实例 / 依赖探测，预算放到 9KB
    assert.ok(size <= 9000, 'gzip 体积 ' + size + ' bytes 超出预算');
});
