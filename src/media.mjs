/**
 * 视频源加载。
 *
 * Hls / flvjs 是可选的外部全局库，原实现直接裸引用，未加载时抛 ReferenceError
 * 并让整个实例构造中断。这里统一做运行时探测：缺失就走 warn + 错误态降级。
 */
import { SUPPORTED_MODES, LOG_PREFIX } from './config.mjs';

function globalScope() {
    if (typeof globalThis !== 'undefined') {
        return globalThis;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if (typeof self !== 'undefined') {
        return self;
    }
    return {};
}

const NOOP_HANDLE = { kind: 'none', destroy: function () {} };

/**
 * @param {object} params
 * @param {HTMLVideoElement} params.video 目标 video 元素
 * @param {string} params.type mp4 / m3u8 / flv
 * @param {string} params.url 视频地址
 * @param {string} params.poster 封面地址
 * @param {(msg: string) => void} params.warn 降级告警
 * @param {(msg: string) => void} params.fail 进入错误态
 * @returns {{ kind: string, destroy: () => void }}
 */
export function loadSource(params) {
    const video = params.video;
    const type = params.type;
    const url = params.url;
    const poster = params.poster;
    const warn = typeof params.warn === 'function' ? params.warn : function () {};
    const fail = typeof params.fail === 'function' ? params.fail : function () {};

    if (!video) {
        warn('video 元素不存在，无法加载视频源');
        return NOOP_HANDLE;
    }

    // 封面与鉴权无关，先挂上
    if (poster) {
        video.setAttribute('poster', poster);
    }

    if (!type || SUPPORTED_MODES.indexOf(type) === -1) {
        warn('不支持的视频类型：' + type);
        fail('不支持的视频类型：' + type);
        return NOOP_HANDLE;
    }

    if (type === 'mp4') {
        video.setAttribute('src', url);
        return { kind: 'mp4', destroy: function () {} };
    }

    if (type === 'm3u8') {
        return loadHls(video, url, warn, fail);
    }

    return loadFlv(video, url, warn, fail);
}

function loadHls(video, url, warn, fail) {
    const scope = globalScope();
    const Hls = scope.Hls;

    if (!Hls || typeof Hls.isSupported !== 'function') {
        warn('未检测到 hls.js，m3u8 无法播放；请自行引入 hls.js');
        fail('需要引入 hls.js 才能播放 m3u8');
        return NOOP_HANDLE;
    }
    if (!Hls.isSupported()) {
        warn('当前环境不支持 hls.js 播放');
        fail('当前环境不支持 m3u8 播放');
        return NOOP_HANDLE;
    }

    const hls = new Hls();
    const events = Hls.Events || {};

    hls.attachMedia(video);
    if (events.MEDIA_ATTACHED) {
        hls.on(events.MEDIA_ATTACHED, function () {
            hls.loadSource(url);
            if (events.MANIFEST_PARSED) {
                hls.on(events.MANIFEST_PARSED, function (_event, data) {
                    const levels = data && data.levels ? data.levels.length : 0;
                    console.log(LOG_PREFIX + ' m3u8 manifest loaded, ' + levels + ' quality level(s)');
                });
            }
        });
    } else {
        hls.loadSource(url);
    }

    let destroyed = false;
    return {
        kind: 'm3u8',
        destroy: function () {
            if (destroyed) {
                return;
            }
            destroyed = true;
            try {
                hls.destroy();
            } catch (err) {
                /* 销毁失败不应影响页面卸载 */
            }
        },
    };
}

function loadFlv(video, url, warn, fail) {
    const scope = globalScope();
    const flvjs = scope.flvjs;

    if (!flvjs || typeof flvjs.isSupported !== 'function') {
        warn('未检测到 flv.js，flv 无法播放；请自行引入 flv.js');
        fail('需要引入 flv.js 才能播放 flv');
        return NOOP_HANDLE;
    }
    if (!flvjs.isSupported()) {
        warn('当前环境不支持 flv.js 播放');
        fail('当前环境不支持 flv 播放');
        return NOOP_HANDLE;
    }

    const player = flvjs.createPlayer({ type: 'flv', url: url });
    player.attachMediaElement(video);
    player.load();
    const playing = player.play();
    // 自动播放策略会 reject，静默处理即可
    if (playing && typeof playing.catch === 'function') {
        playing.catch(function () {});
    }

    let destroyed = false;
    return {
        kind: 'flv',
        destroy: function () {
            if (destroyed) {
                return;
            }
            destroyed = true;
            try {
                player.destroy();
            } catch (err) {
                /* 同上 */
            }
        },
    };
}
