/**
 * 零依赖静态服务器，用来跑 test/ 下的自检页面。
 *
 * 刻意不引入 live-server/http-server：
 * - 仓库里不必再挂一条第三方依赖；
 * - 需要自己实现 HTTP Range —— 视频的 seek / 进度条拖拽依赖 206 响应，
 *   大多数开箱即用的静态服务器虽然支持，但这里连同 range 单元一起自测更可控。
 *
 * 用法：
 *   npm run serve            # 默认 5173
 *   npm run serve -- 8080
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.m3u8': 'application/vnd.apple.mpegurl',
    '.flv': 'video/x-flv',
    '.ts': 'video/mp2t',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.map': 'application/json; charset=utf-8',
};

/** 把 Range 头解析成 {start, end}，不合法返回 null */
function parseRange(header, size) {
    if (!header || !header.startsWith('bytes=')) {
        return null;
    }
    const spec = header.slice('bytes='.length).split(',')[0].trim();
    const [startRaw, endRaw] = spec.split('-');
    if (!startRaw && !endRaw) {
        return null;
    }
    let start = 0;
    let end = size - 1;
    if (startRaw) {
        start = Number(startRaw);
        if (!Number.isFinite(start) || start < 0) {
            return null;
        }
        end = endRaw ? Number(endRaw) : size - 1;
        if (!Number.isFinite(end)) {
            return null;
        }
    } else {
        // bytes=-500 表示最后 500 字节
        const suffix = Number(endRaw);
        if (!Number.isFinite(suffix) || suffix <= 0) {
            return null;
        }
        start = Math.max(0, size - suffix);
    }
    if (start > end || start >= size) {
        return null;
    }
    return { start, end: Math.min(end, size - 1) };
}

function resolvePath(urlPath) {
    const clean = decodeURIComponent(urlPath.split('?')[0]);
    const relative = normalize(clean).replace(/^(\.\.[/\\])+/, '');
    const absolute = join(ROOT, relative.startsWith('/') ? relative.slice(1) : relative);
    if (!absolute.startsWith(ROOT)) {
        return null;
    }
    return absolute;
}

function sendFile(request, response, absolute, stat) {
    const type = MIME[extname(absolute).toLowerCase()] || 'application/octet-stream';
    const range = parseRange(request.headers.range, stat.size);

    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Type', type);
    response.setHeader('Cache-Control', 'no-cache');

    if (range) {
        response.statusCode = 206;
        response.setHeader(
            'Content-Range',
            'bytes ' + range.start + '-' + range.end + '/' + stat.size
        );
        response.setHeader('Content-Length', range.end - range.start + 1);
        const stream = createReadStream(absolute, { start: range.start, end: range.end });
        // 客户端提前断开时就别再读了
        response.on('close', () => stream.destroy());
        stream.pipe(response);
        return;
    }

    response.statusCode = 200;
    response.setHeader('Content-Length', stat.size);
    createReadStream(absolute).pipe(response);
}

const server = createServer((request, response) => {
    let pathname = request.url === '/' ? '/test/index.html' : request.url;
    // 方便直接访问 http://localhost:5173/test/browser.html，也容错 /browser.html
    const absolute = resolvePath(pathname) || resolvePath('/test' + pathname);

    if (!absolute) {
        response.statusCode = 403;
        response.end('Forbidden');
        return;
    }

    let stat;
    try {
        stat = statSync(absolute);
    } catch (error) {
        response.statusCode = 404;
        response.end('Not Found: ' + pathname);
        return;
    }

    if (stat.isDirectory()) {
        const indexPath = join(absolute, 'index.html');
        if (existsSync(indexPath)) {
            sendFile(request, response, indexPath, statSync(indexPath));
            return;
        }
        response.statusCode = 404;
        response.end('Not Found: ' + pathname);
        return;
    }

    sendFile(request, response, absolute, stat);
});

const port = Number(process.argv[2]) || Number(process.env.PORT) || 5173;
server.listen(port, '127.0.0.1', () => {
    console.log('[serve] xqplayer 测试页已启动： http://localhost:' + port + '/test/index.html');
    console.log('[serve] Ctrl+C 退出');
});
