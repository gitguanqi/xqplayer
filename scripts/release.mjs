#!/usr/bin/env node
/**
 * 发布脚本。
 *
 * 替代原来的 deploy.sh：那个脚本 `git push -f` 会强覆盖远端，
 * 这里改成先做前置检查，再普通推送，危险操作一律先确认。
 *
 * 用法：
 *   node scripts/release.mjs patch|minor|major|x.y.z
 *   node scripts/release.mjs patch --dry-run
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'package.json');

function run(command, args, options) {
    return execFileSync(command, args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options,
    }).trim();
}

/** 本仓库的远端不一定叫 origin（例如这里叫 gitee），缺 --remote 时自动推断 */
function resolveRemote() {
    const given = process.argv.slice(2).find((arg) => arg.startsWith('--remote='));
    if (given) {
        return given.slice('--remote='.length);
    }
    const remotes = run('git', ['remote']).split('\n').filter(Boolean);
    if (!remotes.length) {
        throw new Error('没有配置任何 git remote');
    }
    return remotes.indexOf('origin') !== -1 ? 'origin' : remotes[0];
}

function readVersion() {
    return JSON.parse(readFileSync(PKG, 'utf8')).version;
}

function bump(version, release) {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) {
        throw new Error('package.json 里的版本号格式不合法：' + version);
    }
    if (/^\d+\.\d+\.\d+$/.test(release)) {
        return release;
    }
    const index = ['patch', 'minor', 'major'].indexOf(release);
    if (index === -1) {
        throw new Error('发布类型只能是 patch / minor / major / x.y.z：' + release);
    }
    if (index === 1) {
        parts[1] += 1;
        parts[2] = 0;
    } else if (index === 2) {
        parts[0] += 1;
        parts[1] = 0;
        parts[2] = 0;
    } else {
        parts[2] += 1;
    }
    return parts.join('.');
}

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const release = args.find((arg) => !arg.startsWith('--')) || 'patch';
    const current = readVersion();
    const next = bump(current, release);

    console.log('[release] ' + current + ' -> ' + next + (dryRun ? '（预演）' : ''));

    const branch = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
    const status = run('git', ['status', '--porcelain']);
    if (status) {
        console.error('[release] 工作区还有未提交的改动：');
        console.error(status);
        console.error('[release] 请先提交或暂存，我不想替你决定要不要一起带上。');
        process.exit(1);
    }
    if (branch !== 'main' && branch !== 'master') {
        console.error('[release] 当前分支是 ' + branch + '，请切到主干再发布。');
        process.exit(1);
    }

    // 1. 先把版本号写进 package.json，构建脚本会把它注入产物
    const raw = readFileSync(PKG, 'utf8');
    writeFileSync(PKG, raw.replace(/"version": "[^"]+"/, '"version": "' + next + '"'));

    // 2. 重建产物并跑测试，保证发布出去的一定是源码生成的最新版本
    run('npm', ['run', 'build'], { stdio: 'inherit' });
    run('npm', ['test'], { stdio: 'inherit' });

    if (dryRun) {
        writeFileSync(PKG, raw);
        console.log('[release] 预演完成，package.json 已还原，未做任何提交与推送。');
        return;
    }

    run('git', ['add', '-A']);
    run('git', ['commit', '-m', 'release: v' + next], { stdio: 'inherit' });
    run('git', ['tag', '-a', 'v' + next, '-m', 'v' + next]);
    // 普通推送；远端领先时先拉取再重试，绝不使用 -f
    const remote = resolveRemote();
    console.log('[release] 推送到 ' + remote + '/' + branch);
    try {
        run('git', ['push', remote, branch, '--follow-tags'], { stdio: 'inherit' });
    } catch (error) {
        console.error('[release] 推送失败，请先 git pull 解决冲突后重试（不要用 -f）。');
        process.exit(1);
    }
    console.log('[release] v' + next + ' 已推送，接下来可以 npm publish。');
}

try {
    main();
} catch (error) {
    console.error('[release] 失败：' + (error && error.message ? error.message : error));
    process.exit(1);
}
