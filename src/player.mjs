/**
 * 播放器实例。
 *
 * 相比 0.0.x 的核心变化：
 * - 所有节点查询限定在实例根节点内（`data-xq` 引用表），同页多实例互不干扰；
 * - 所有监听器登记在 `_listeners`，`destroy()` 一次摘干净（含 hls/flv 实例）；
 * - 外部库（hls.js / flv.js / xqshare）改为运行时探测，缺失时降级而不是抛 ReferenceError；
 * - 弹幕渲染走 textContent，不再拼 innerHTML；
 * - 拖拽用 Pointer Events + getBoundingClientRect，修正原实现失效的 onmousemove 与混轴取值。
 */
import { VERSION, DEFAULTS, SUPPORTED_MODES, LOG_PREFIX } from './config.mjs';
import { collectRefs, on, offAll, clamp, toggleClass, setText } from './dom.mjs';
import { secondToTime } from './time.mjs';
import { randomColor } from './color.mjs';
import { normalizeBarrages, normalizeBarrage, renderBarrage } from './barrage.mjs';
import { buildTemplate } from './template.mjs';
import { loadSource } from './media.mjs';
import { openShare } from './share.mjs';

let instanceSeq = 0;

/** 0.0.x 的内部 id 到 refs 键的映射，只为兼容外部误用 gid() 的代码 */
const LEGACY_ID_MAP = {
    myvideo: 'video',
    progressbar: 'progress',
    'progress-dot': 'progressDot',
    'play-btn': 'play',
    'pause-btn': 'pause',
    startTime: 'current',
    endTime: 'duration',
    statusText: 'statusText',
    'video-open-barrage': 'barrageToggle',
    'video-barrage-content': 'barrageInput',
    'video-barrage-send': 'barrageSend',
    draw: 'optDraw',
    replay: 'optLoop',
    volBar: 'volBar',
    volDot: 'volDot',
    'info-btn': 'infoToggle',
    'share-btn': 'share',
    popShare: 'sharePop',
};

/**
 * @param {object} option
 * @param {string|HTMLElement} option.el 容器选择器或元素（必填）
 * @param {string} option.url 视频地址（必填）
 * @param {string} [option.poster] 封面
 * @param {Array} [option.barrages] 弹幕列表
 * @param {'mp4'|'m3u8'|'flv'} [option.mode] 播放类型
 * @param {number} [option.width] 宽度
 * @param {number} [option.height] 高度
 */
export function XQVideoPlayer(option) {
    if (!(this instanceof XQVideoPlayer)) {
        return new XQVideoPlayer(option);
    }

    const options = normalizeOptions(option);

    this.uid = 'xq-' + (instanceSeq += 1);
    this.options = options;
    this.container = resolveContainer(options.el);
    this.root = null;
    this.refs = Object.create(null);
    this._listeners = [];
    this._statusTimer = 0;
    this._mediaHandle = null;
    this._share = null;
    this._destroyed = false;
    this._warned = Object.create(null);
    this.video = createInitialState(options);

    this.initElem();
    this.initVideo();
    this.initEvent();
}

/* ------------------------------------------------------------------ 初始化 */

XQVideoPlayer.prototype.initElem = function () {
    const pageUrl =
        typeof location !== 'undefined' && location
            ? location.origin + location.pathname
            : '';

    this.video.about.url = pageUrl;
    this.video.about.type = this.options.mode;
    this.video.about.version = VERSION;

    const root = document.createElement('div');
    root.className = 'xqvideo';
    root.innerHTML = buildTemplate({
        uid: this.uid,
        width: this.options.width,
        height: this.options.height,
        mode: this.options.mode,
        pageUrl: pageUrl,
        version: VERSION,
        vol: this.video.vol,
    });

    this.container.appendChild(root);
    this.root = root;
    this.refs = collectRefs(root);
};

XQVideoPlayer.prototype.initVideo = function () {
    const video = this.refs.video;
    if (!video) {
        return;
    }

    this.bindMediaEvents(video);
    this.loadVideo({
        video: video,
        type: this.options.mode,
        url: this.options.url,
        poster: this.options.poster,
    });

    this.addDraw();
    this.addVol();
    this.addProgree();
    this.showBarrage();
    this.syncProgressDom();
};

XQVideoPlayer.prototype.bindMediaEvents = function (video) {
    const store = this._listeners;
    const self = this;

    on(store, video, 'loadstart', function () {
        self.setLoading(false);
    });
    on(store, video, 'loadedmetadata', function () {
        self.syncTimeDom();
    });
    on(store, video, 'canplay', function () {
        self.setLoading(false);
        self.clearError();
    });
    on(store, video, 'playing', function () {
        self.setLoading(false);
        self.clearError();
        self.syncPlayState();
    });
    on(store, video, 'timeupdate', function () {
        self.syncTimeDom();
    });
    on(store, video, 'play', function () {
        self.syncPlayState();
    });
    on(store, video, 'pause', function () {
        self.syncPlayState();
    });
    on(store, video, 'ended', function () {
        self.handleEnded();
    });
    on(store, video, 'error', function () {
        self.setError(self.describeMediaError(video));
    });
    on(store, video, 'click', function () {
        self.playVideo();
    });
    // 禁止右键菜单（保持 0.0.x 行为）
    on(store, video, 'contextmenu', function (event) {
        event.preventDefault();
        event.stopPropagation();
    });
};

XQVideoPlayer.prototype.initEvent = function () {
    const store = this._listeners;
    const refs = this.refs;
    const self = this;

    if (refs.play) {
        on(store, refs.play, 'click', function () {
            self.playVideo();
        });
    }
    if (refs.pause) {
        on(store, refs.pause, 'click', function () {
            self.playVideo();
        });
    }

    // 信息面板
    if (refs.infoToggle) {
        on(store, refs.infoToggle, 'click', function () {
            self.toggleInfo(true);
        });
    }
    if (refs.infoClose) {
        on(store, refs.infoClose, 'click', function () {
            self.toggleInfo(false);
        });
    }

    // 错误重试
    if (refs.retry) {
        on(store, refs.retry, 'click', function () {
            self.reload();
        });
    }

    // 全屏 / 复原
    if (refs.fullscreen) {
        on(store, refs.fullscreen, 'click', function () {
            self.fullScreenOpen();
        });
    }
    if (refs.fullscreenExit) {
        on(store, refs.fullscreenExit, 'click', function () {
            self.fullScreenCancel();
        });
    }

    // 关闭小窗
    if (refs.drawClose) {
        on(store, refs.drawClose, 'click', function () {
            self.hideDraw();
        });
    }

    // 静音
    if (refs.mute) {
        on(store, refs.mute, 'click', function () {
            self.videoMuted();
        });
    }

    // 分享
    if (refs.share) {
        on(store, refs.share, 'click', function () {
            self.shareVideo();
        });
    }

    // 悬停显示控制条：mouseenter / mouseleave 不会因子元素冒泡而抖动
    if (refs.box) {
        on(store, refs.box, 'mouseenter', function () {
            self.toggleControl(true);
        });
        on(store, refs.box, 'mouseleave', function () {
            self.toggleControl(false);
        });
    }

    // 清晰度
    if (refs.quaWrap) {
        on(store, refs.quaWrap, 'mouseenter', function () {
            self.toggleQualBar(true);
        });
        on(store, refs.quaWrap, 'mouseleave', function () {
            self.toggleQualBar(false);
        });
    }

    // 倍速
    if (refs.speedWrap) {
        on(store, refs.speedWrap, 'mouseenter', function () {
            self.toggleSpeed(true);
        });
        on(store, refs.speedWrap, 'mouseleave', function () {
            self.toggleSpeed(false);
        });
    }
    const speedItems = this.qa('.spe span');
    for (let i = 0; i < speedItems.length; i += 1) {
        on(store, speedItems[i], 'click', function (event) {
            const target = event.currentTarget || event.target;
            if (target && target.getAttribute) {
                self.setSpeed(target.getAttribute('data-id'));
            }
        });
    }
    this.showSpeedAct();

    // 设置
    if (refs.setWrap) {
        on(store, refs.setWrap, 'mouseenter', function () {
            self.toggleSet(true);
        });
        on(store, refs.setWrap, 'mouseleave', function () {
            self.toggleSet(false);
        });
    }
    if (refs.optDraw) {
        on(store, refs.optDraw, 'change', function (event) {
            const checked = !!(event.target && event.target.checked);
            self.video.draw = checked;
            self.setPlayType('draw', checked);
        });
    }
    if (refs.optLoop) {
        on(store, refs.optLoop, 'change', function (event) {
            const checked = !!(event.target && event.target.checked);
            self.video.replay = checked;
            self.setPlayType('replay', checked);
        });
    }

    // 音量条
    if (refs.volWrap) {
        on(store, refs.volWrap, 'mouseenter', function () {
            self.toggleVol(true);
        });
        on(store, refs.volWrap, 'mouseleave', function () {
            self.toggleVol(false);
        });
    }

    // 弹幕
    if (refs.barrageToggle) {
        on(store, refs.barrageToggle, 'click', function () {
            self.toggleBarrage();
        });
    }
    if (refs.barrageSend) {
        on(store, refs.barrageSend, 'click', function () {
            self.sendBarrage();
        });
    }
    if (refs.barrageInput) {
        on(store, refs.barrageInput, 'keydown', function (event) {
            if (event.key === 'Enter') {
                self.sendBarrage();
            }
        });
    }
};

/* -------------------------------------------------------------- 媒体与状态 */

/** 记一次告警（同一条只报一次，避免刷屏） */
XQVideoPlayer.prototype.warn = function (message) {
    const text = String(message);
    if (this._warned[text]) {
        return;
    }
    this._warned[text] = true;
    if (typeof console !== 'undefined' && console.warn) {
        console.warn(LOG_PREFIX + ' ' + text);
    }
};

XQVideoPlayer.prototype.loadVideo = function (params) {
    if (this._mediaHandle) {
        this._mediaHandle.destroy();
        this._mediaHandle = null;
    }
    this._mediaHandle = loadSource({
        video: params.video,
        type: params.type,
        url: params.url,
        poster: params.poster,
        warn: this.warn.bind(this),
        fail: this.setError.bind(this),
    });
    return this._mediaHandle;
};

/** 重新加载当前视频源（错误重试按钮与外部调用共用） */
XQVideoPlayer.prototype.reload = function () {
    if (this._destroyed) {
        return;
    }
    this.clearError();
    this.setLoading(true);
    this.video.process = 0;
    this.syncProgressDom();

    const video = this.refs.video;
    if (!video) {
        return;
    }
    this.loadVideo({
        video: video,
        type: this.options.mode,
        url: this.options.url,
        poster: this.options.poster,
    });
};

XQVideoPlayer.prototype.setLoading = function (show) {
    this.video.loading = !!show;
    toggleClass(this.refs.loading, 'hide', !show);
};

XQVideoPlayer.prototype.setError = function (message) {
    this.video.error = true;
    this.video.loading = false;
    toggleClass(this.refs.loading, 'hide', true);
    toggleClass(this.refs.error, 'hide', false);
    setText(this.refs.errorText, message || '视频加载出错！');
};

XQVideoPlayer.prototype.clearError = function () {
    this.video.error = false;
    toggleClass(this.refs.error, 'hide', true);
};

XQVideoPlayer.prototype.describeMediaError = function (video) {
    const code = video && video.error ? video.error.code : 0;
    switch (code) {
        case 1:
            return '视频加载被中断，请重试';
        case 2:
            return '网络错误，视频加载失败';
        case 3:
            return '视频解码失败';
        case 4:
            return '视频地址不可用或格式不受支持';
        default:
            return '视频加载出错！';
    }
};

XQVideoPlayer.prototype.syncTimeDom = function () {
    const video = this.refs.video;
    if (!video) {
        return;
    }
    const current = Number(video.currentTime) || 0;
    const duration = Number(video.duration);
    const total = Number.isFinite(duration) && duration > 0 ? duration : 0;

    this.video.about.duration = total;
    this.video.process = total ? (current / total) * 100 : 0;

    setText(this.refs.current, secondToTime(current));
    setText(this.refs.duration, secondToTime(total));
    this.syncProgressDom();
};

XQVideoPlayer.prototype.syncProgressDom = function () {
    if (this.refs.progressDot) {
        this.refs.progressDot.style.width = clamp(this.video.process, 0, 100) + '%';
    }
};

XQVideoPlayer.prototype.syncPlayState = function () {
    const video = this.refs.video;
    if (!video) {
        return;
    }
    this.video.play = !video.paused;
    // 播放按钮靠 .show 显示，暂停按钮靠 .hide 隐藏（与既有样式保持一致）
    toggleClass(this.refs.play, 'show', !this.video.play);
    toggleClass(this.refs.pause, 'hide', !this.video.play);
};

XQVideoPlayer.prototype.handleEnded = function () {
    const video = this.refs.video;
    if (!video) {
        return;
    }
    if (this.video.replay) {
        const result = video.play();
        if (result && typeof result.catch === 'function') {
            result.catch(function () {});
        }
    }
    this.syncPlayState();
};

/* -------------------------------------------------------------- 播放控制 */

XQVideoPlayer.prototype.playVideo = function () {
    const video = this.refs.video;
    if (!video) {
        return;
    }
    if (video.paused) {
        const result = video.play();
        if (result && typeof result.catch === 'function') {
            result.catch(function () {});
        }
    } else {
        video.pause();
    }
    this.syncPlayState();
    if (isTouchDevice()) {
        toggleClass(this.refs.pause, 'hide', true);
    }
};

XQVideoPlayer.prototype.setVolume = function (value) {
    const vol = clamp(value, 0, 1);
    const video = this.refs.video;

    if (video) {
        video.volume = vol;
        video.muted = vol === 0;
    }
    this.video.vol = Math.round(vol * 100);
    this.video.muted = vol === 0;

    if (this.refs.volDot) {
        this.refs.volDot.style.height = this.video.vol + '%';
    }
    toggleClass(this.refs.volIcon, 'hide', this.video.muted);
    toggleClass(this.refs.mutedIcon, 'hide', !this.video.muted);
};

XQVideoPlayer.prototype.videoMuted = function () {
    this.setVolume(this.video.muted ? 1 : 0);
};

/** 按比例定位播放进度（0-1） */
XQVideoPlayer.prototype.setProgressRatio = function (ratio) {
    const safe = clamp(ratio, 0, 1);
    const video = this.refs.video;
    const duration = video ? Number(video.duration) : 0;

    this.video.process = safe * 100;
    this.syncProgressDom();

    if (video && Number.isFinite(duration) && duration > 0) {
        video.currentTime = safe * duration;
        setText(this.refs.current, secondToTime(video.currentTime));
    }
};

/** 按比例设置音量（0-1） */
XQVideoPlayer.prototype.setVolumeRatio = function (ratio) {
    this.setVolume(clamp(ratio, 0, 1));
};

XQVideoPlayer.prototype.setSpeed = function (val) {
    const rate = Number(val);
    if (!Number.isFinite(rate) || rate <= 0) {
        return;
    }
    const video = this.refs.video;
    if (video) {
        video.playbackRate = rate;
    }
    this.video.curSpeed = rate;
    this.showSpeedAct();
    this.setStatus('已切换到' + rate + '倍速！');
};

XQVideoPlayer.prototype.showSpeedAct = function () {
    const items = this.qa('.spe span');
    for (let i = 0; i < items.length; i += 1) {
        const item = items[i];
        const id = Number(item.getAttribute('data-id'));
        toggleClass(item, 'active', id === Number(this.video.curSpeed));
    }
};

XQVideoPlayer.prototype.setStatus = function (val) {
    const text = val == null ? '' : String(val);

    if (this._statusTimer) {
        clearTimeout(this._statusTimer);
        this._statusTimer = 0;
    }
    this.video.status = true;
    this.video.statusText = text;
    toggleClass(this.refs.status, 'hide', false);
    setText(this.refs.statusText, text);

    this._statusTimer = setTimeout(() => {
        this._statusTimer = 0;
        this.video.status = false;
        toggleClass(this.refs.status, 'hide', true);
        setText(this.refs.statusText, '');
    }, 1000);
};

XQVideoPlayer.prototype.setPlayType = function (type, value) {
    const text = type === 'draw' ? '小窗播放' : '循环播放';
    const val = value ? '已开启' : '已关闭';
    this.video[type] = value;
    this.setStatus(text + val);
};

XQVideoPlayer.prototype.fullScreenOpen = function () {
    this.video.scale = true;
    toggleClass(this.refs.box, 'scale', true);
    toggleClass(this.refs.fullscreen, 'hide', true);
    toggleClass(this.refs.fullscreenExit, 'hide', false);
};

XQVideoPlayer.prototype.fullScreenCancel = function () {
    this.video.scale = false;
    toggleClass(this.refs.box, 'scale', false);
    toggleClass(this.refs.fullscreen, 'hide', false);
    toggleClass(this.refs.fullscreenExit, 'hide', true);
};

/* ------------------------------------------------------------- 控制条显隐 */

XQVideoPlayer.prototype.toggleControl = function (type) {
    toggleClass(this.refs.control, 'hide', !type);
};

XQVideoPlayer.prototype.toggleInfo = function (type) {
    toggleClass(this.refs.info, 'show', !!type);
};

XQVideoPlayer.prototype.toggleQualBar = function (type) {
    toggleClass(this.refs.qua, 'hide', !type);
};

XQVideoPlayer.prototype.toggleSpeed = function (type) {
    toggleClass(this.refs.speed, 'hide', !type);
};

XQVideoPlayer.prototype.toggleSet = function (type) {
    toggleClass(this.refs.set, 'hide', !type);
};

XQVideoPlayer.prototype.toggleVol = function (type) {
    toggleClass(this.refs.vol, 'hide', !type);
};

/* ------------------------------------------------------------- 小窗 / 弹幕 */

XQVideoPlayer.prototype.addDraw = function () {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }
    const self = this;
    on(this._listeners, window, 'scroll', function () {
        if (self._destroyed || !self.video.draw) {
            return;
        }
        const top = document.documentElement ? document.documentElement.scrollTop : 0;
        if (top > 800) {
            self.video.isDraw = true;
            toggleClass(self.refs.box, 'draw', true);
            toggleClass(self.refs.drawClose, 'hide', false);
        } else if (top < 199) {
            self.video.isDraw = false;
            toggleClass(self.refs.box, 'draw', false);
            toggleClass(self.refs.drawClose, 'hide', true);
        }
    }, { passive: true });
};

XQVideoPlayer.prototype.hideDraw = function () {
    this.video.isDraw = false;
    toggleClass(this.refs.box, 'draw', false);
    toggleClass(this.refs.drawClose, 'hide', true);
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.scrollTop = 0;
    }
};

XQVideoPlayer.prototype.toggleBarrage = function () {
    this.video.barrage = !this.video.barrage;
    toggleClass(this.refs.barrage, 'show', this.video.barrage);
    toggleClass(this.refs.barrageToggle, 'active', this.video.barrage);

    if (this.refs.barrageInput) {
        if (this.video.barrage) {
            this.refs.barrageInput.removeAttribute('disabled');
        } else {
            this.refs.barrageInput.setAttribute('disabled', 'disabled');
        }
    }
    if (this.refs.barrageSend) {
        if (this.video.barrage) {
            this.refs.barrageSend.removeAttribute('disabled');
        } else {
            this.refs.barrageSend.setAttribute('disabled', 'disabled');
        }
    }

    if (this.video.barrage) {
        this.showBarrage();
    }
    this.setStatus(this.video.barrage ? '弹幕已开启' : '弹幕已关闭');
};

XQVideoPlayer.prototype.sendBarrage = function () {
    const input = this.refs.barrageInput;
    const raw = input ? input.value : this.video.barrageContent;
    const value = String(raw == null ? '' : raw).trim();

    if (!value) {
        this.setStatus('请输入弹幕内容！');
        return null;
    }

    this.video.barrageContent = value;
    const item = normalizeBarrage({ content: value });
    this.video.barrageList.push(item);

    if (input) {
        input.value = '';
    }
    this.showBarrage();
    return item;
};

XQVideoPlayer.prototype.showBarrage = function () {
    if (typeof document === 'undefined') {
        return;
    }
    renderBarrage(document, this.refs.barrageList, this.video.barrageList);
};

XQVideoPlayer.prototype.randomColor = function () {
    return randomColor();
};

XQVideoPlayer.prototype.shareVideo = function () {
    const host = this.refs.sharePop;
    if (!host) {
        return null;
    }
    const selector = '#' + (host.id || this.uid + '-share-pop');
    // 已经打开过就只切换显隐，避免每次点击都 new 一个实例
    if (this._share) {
        this._share.toggle();
        return this._share;
    }
    const instance = openShare({
        selector: selector,
        url: this.video.about.url || undefined,
        title: this.options.title || undefined,
        share: this.options.share,
    });
    if (!instance) {
        this.warn('未检测到 xqshare，分享按钮已降级');
        this.setStatus('分享组件未加载');
        return null;
    }
    this._share = instance;
    return instance;
};

/* ------------------------------------------------------------------ 音量条 */

XQVideoPlayer.prototype.addVol = function () {
    const bar = this.refs.volBar;
    if (!bar || typeof bar.addEventListener !== 'function') {
        return;
    }
    const self = this;
    let dragging = false;

    const apply = function (clientY) {
        const rect = rectOf(bar);
        const ratio = clamp((clientY - rect.top) / (rect.height || 1), 0, 1);
        // 柱体顶端是 100%
        self.setVolume(1 - ratio);
    };

    on(this._listeners, bar, 'pointerdown', function (event) {
        dragging = true;
        if (typeof bar.setPointerCapture === 'function' && event.pointerId != null) {
            try {
                bar.setPointerCapture(event.pointerId);
            } catch (err) {
                /* 某些环境下不支持，忽略 */
            }
        }
        apply(event.clientY);
    });
    on(this._listeners, bar, 'pointermove', function (event) {
        if (!dragging) {
            return;
        }
        apply(event.clientY);
    });
    const stop = function () {
        dragging = false;
    };
    on(this._listeners, bar, 'pointerup', stop);
    on(this._listeners, bar, 'pointercancel', stop);
};

/* ------------------------------------------------------------------ 进度条 */

XQVideoPlayer.prototype.addProgree = function () {
    const bar = this.refs.progress;
    if (!bar || typeof bar.addEventListener !== 'function') {
        return;
    }
    const self = this;
    let dragging = false;

    const apply = function (clientX) {
        const rect = rectOf(bar);
        self.setProgressRatio((clientX - rect.left) / (rect.width || 1));
    };

    on(this._listeners, bar, 'pointerdown', function (event) {
        dragging = true;
        if (typeof bar.setPointerCapture === 'function' && event.pointerId != null) {
            try {
                bar.setPointerCapture(event.pointerId);
            } catch (err) {
                /* 忽略 */
            }
        }
        apply(event.clientX);
    });
    on(this._listeners, bar, 'pointermove', function (event) {
        if (!dragging) {
            return;
        }
        apply(event.clientX);
    });
    const stop = function () {
        dragging = false;
    };
    on(this._listeners, bar, 'pointerup', stop);
    on(this._listeners, bar, 'pointercancel', stop);
};

/* -------------------------------------------------------------- 查询与兼容 */

/** 实例内查单个节点（不再全局 querySelector） */
XQVideoPlayer.prototype.dom = function (select) {
    return this.root ? this.root.querySelector(select) : null;
};

/** 实例内查多个节点，返回真数组 */
XQVideoPlayer.prototype.domAll = function (select) {
    if (!this.root) {
        return [];
    }
    const nodes = this.root.querySelectorAll(select);
    return Array.prototype.slice.call(nodes);
};

/** 简写：实例内单节点 */
XQVideoPlayer.prototype.q = function (select) {
    return this.dom(select);
};

/** 简写：实例内多节点 */
XQVideoPlayer.prototype.qa = function (select) {
    return this.domAll(select);
};

/** @deprecated 0.0.x 的全局 id 取节点，已废弃；仅在实例内按映射查找 */
XQVideoPlayer.prototype.gid = function (id) {
    if (!this._warned.__gid) {
        this._warned.__gid = true;
        if (typeof console !== 'undefined' && console.warn) {
            console.warn(LOG_PREFIX + ' gid() 已废弃，请改用实例的 dom()/q() 或 refs');
        }
    }
    const key = LEGACY_ID_MAP[id];
    return key ? this.refs[key] || null : null;
};

XQVideoPlayer.prototype.secondToTime = function (second) {
    return secondToTime(second);
};

/* ------------------------------------------------------------------ 生命周期 */

/**
 * 销毁实例：摘除全部监听器、清理定时器、销毁 hls/flv 实例、移除自身 DOM。
 * 重复调用幂等。
 */
XQVideoPlayer.prototype.destroy = function () {
    if (this._destroyed) {
        return;
    }
    this._destroyed = true;

    if (this._statusTimer) {
        clearTimeout(this._statusTimer);
        this._statusTimer = 0;
    }
    if (this._mediaHandle) {
        try {
            this._mediaHandle.destroy();
        } catch (err) {
            /* 销毁失败不应阻断后续清理 */
        }
        this._mediaHandle = null;
    }
    if (this._share && typeof this._share.destroy === 'function') {
        try {
            this._share.destroy();
        } catch (err) {
            /* 同上 */
        }
        this._share = null;
    }

    offAll(this._listeners);

    const root = this.root;
    if (root && root.parentNode) {
        root.parentNode.removeChild(root);
    }
    this.root = null;
    this.refs = Object.create(null);
};

/* -------------------------------------------------------------------- 内部 */

function normalizeOptions(option) {
    if (!option || typeof option !== 'object') {
        throw new Error(LOG_PREFIX + ' 构造参数必须是对象');
    }
    const options = {};
    const keys = Object.keys(DEFAULTS);
    for (let i = 0; i < keys.length; i += 1) {
        options[keys[i]] = option[keys[i]] === undefined ? DEFAULTS[keys[i]] : option[keys[i]];
    }
    if (!options.el) {
        throw new Error(LOG_PREFIX + ' el 是必填项');
    }
    if (!options.url) {
        throw new Error(LOG_PREFIX + ' url 是必填项');
    }
    if (!Array.isArray(options.barrages)) {
        options.barrages = [];
    }
    return options;
}

function resolveContainer(el) {
    if (typeof document === 'undefined') {
        throw new Error(LOG_PREFIX + ' 需要在浏览器环境中使用');
    }
    if (typeof el === 'string') {
        const node = document.querySelector(el);
        if (!node) {
            throw new Error(LOG_PREFIX + ' 找不到容器元素：' + el);
        }
        return node;
    }
    if (el && el.nodeType === 1) {
        return el;
    }
    throw new Error(LOG_PREFIX + ' el 必须是选择器字符串或 DOM 元素');
}

function createInitialState(options) {
    return {
        play: false, // 播放
        scale: false, // 缩放
        loading: true, // 加载
        error: false, // 错误
        muted: false, // 静音
        mutedBar: false, // 静音条
        vol: 100, // 音量
        isDraw: false, // 画中画
        draw: true, // 画面
        set: false, // 设置条
        curSpeed: 1, // 当前速度
        speed: false, // 速度
        replay: false, // 重播
        status: false, // 状态
        statusText: '', // 状态描述
        barrage: false, // 弹幕
        barrageContent: '',
        barrageList: normalizeBarrages(options.barrages),
        process: 0, // 当前进度百分比
        about: {
            // 关于我们
            name: 'XQVideoPlayer',
            version: VERSION,
            url: '',
            type: '',
            duration: 0,
        },
        speeds: [
            // 倍速表
            { id: 1, name: '2.0倍', val: 2 },
            { id: 2, name: '1.5倍', val: 1.5 },
            { id: 3, name: '1.25倍', val: 1.25 },
            { id: 4, name: '1.0倍', val: 1 },
            { id: 5, name: '0.75倍', val: 0.75 },
        ],
        qualities: [{ id: 1, name: '标清', val: 1 }],
        url: options.url,
        poster: options.poster,
        mode: options.mode,
        width: options.width,
        height: options.height,
    };
}

function isTouchDevice() {
    return typeof document !== 'undefined' && 'ontouchstart' in document;
}

function rectOf(el) {
    if (el && typeof el.getBoundingClientRect === 'function') {
        const rect = el.getBoundingClientRect();
        return {
            top: rect.top || 0,
            left: rect.left || 0,
            width: rect.width || el.clientWidth || 0,
            height: rect.height || el.clientHeight || 0,
        };
    }
    return {
        top: (el && el.offsetTop) || 0,
        left: (el && el.offsetLeft) || 0,
        width: (el && el.clientWidth) || 0,
        height: (el && el.clientHeight) || 0,
    };
}

/** 供外部判断类型是否受支持 */
XQVideoPlayer.isSupportedMode = function (mode) {
    return SUPPORTED_MODES.indexOf(mode) !== -1;
};
