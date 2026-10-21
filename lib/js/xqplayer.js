(function (root, factory) {
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
/*! xqplayer v0.1.0 | MIT | git+https://github.com/gitguanqi/xqplayer.git */
var __XQ = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.mjs
  var index_exports = {};
  __export(index_exports, {
    VERSION: () => VERSION,
    XQVideoPlayer: () => XQVideoPlayer,
    default: () => index_default,
    useShare: () => useShare
  });

  // src/config.mjs
  var VERSION = true ? "0.1.0" : "0.0.0-dev";
  var SUPPORTED_MODES = ["mp4", "m3u8", "flv"];
  var DEFAULTS = {
    el: "",
    url: "",
    poster: "",
    barrages: [],
    mode: "mp4",
    width: 1200,
    height: 600,
    /** 分享标题，缺省用 document.title */
    title: "",
    /** xqshare 构造器（打包场景传入），缺省用 XQVideoPlayer.useShare() 或 window.XqShare */
    share: null
  };
  var LOG_PREFIX = "[xqplayer]";

  // src/dom.mjs
  var CAMEL_RE = /-([a-z])/g;
  function toCamel(name) {
    return String(name).replace(CAMEL_RE, function(_match, chr) {
      return chr.toUpperCase();
    });
  }
  function collectRefs(root) {
    const refs = /* @__PURE__ */ Object.create(null);
    if (!root || typeof root.querySelectorAll !== "function") {
      return refs;
    }
    const nodes = root.querySelectorAll("[data-xq]");
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      const key = el.getAttribute("data-xq");
      if (key && !(toCamel(key) in refs)) {
        refs[toCamel(key)] = el;
      }
    }
    return refs;
  }
  function on(store, target, type, handler, options) {
    if (!target || typeof target.addEventListener !== "function") {
      return handler;
    }
    target.addEventListener(type, handler, options);
    store.push({ target, type, handler, options });
    return handler;
  }
  function offAll(store) {
    while (store.length) {
      const item = store.pop();
      if (item.target && typeof item.target.removeEventListener === "function") {
        item.target.removeEventListener(item.type, item.handler, item.options);
      }
    }
  }
  function clamp(value, min, max) {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return min;
    }
    if (num < min) {
      return min;
    }
    return num > max ? max : num;
  }
  function toggleClass(el, name, force) {
    if (!el || !el.classList) {
      return;
    }
    if (typeof force === "undefined") {
      el.classList.toggle(name);
      return;
    }
    if (force) {
      el.classList.add(name);
    } else {
      el.classList.remove(name);
    }
  }
  function setText(el, text) {
    if (!el) {
      return;
    }
    el.textContent = text == null ? "" : String(text);
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // src/time.mjs
  function secondToTime(second) {
    let total = Number(second);
    if (!Number.isFinite(total) || total < 0) {
      total = 0;
    }
    total = Math.floor(total);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const seconds = total % 60;
    return pad2(hours) + ":" + pad2(minutes) + ":" + pad2(seconds);
  }
  function pad2(num) {
    return num < 10 ? "0" + num : String(num);
  }

  // src/color.mjs
  function randomColor() {
    return "#" + hex(randomChannel()) + hex(randomChannel()) + hex(randomChannel());
  }
  function randomChannel() {
    const value = Math.floor(Math.random() * 256);
    return value < 120 ? 120 : value;
  }
  function hex(value) {
    return value.toString(16).padStart(2, "0");
  }
  function randomUserName() {
    return "用户" + Math.floor(Math.random() * 100);
  }

  // src/barrage.mjs
  function normalizeBarrages(list) {
    const source = Array.isArray(list) ? list : [];
    const result = [];
    for (let i = 0; i < source.length; i += 1) {
      const item = source[i];
      if (!item || typeof item !== "object") {
        continue;
      }
      result.push(normalizeBarrage(item));
    }
    return result;
  }
  function normalizeBarrage(item) {
    return {
      id: item.id,
      avatar: typeof item.avatar === "string" ? item.avatar : "",
      name: item.name ? String(item.name) : randomUserName(),
      content: item.content == null ? "" : String(item.content),
      bg: item.bg || randomColor()
    };
  }
  function renderBarrage(doc, container, list) {
    if (!container) {
      return;
    }
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    for (let i = 0; i < list.length; i += 1) {
      container.appendChild(createBarrageItem(doc, list[i]));
    }
  }
  function createBarrageItem(doc, item) {
    const li = doc.createElement("li");
    if (item.avatar) {
      const img = doc.createElement("img");
      img.setAttribute("src", item.avatar);
      img.setAttribute("alt", item.name);
      li.appendChild(img);
    }
    const name = doc.createElement("span");
    name.textContent = item.name;
    li.appendChild(name);
    const content = doc.createElement("small");
    content.style.color = item.bg;
    content.textContent = item.content;
    li.appendChild(content);
    return li;
  }

  // src/template.mjs
  function buildTemplate(data) {
    const uid = data.uid;
    const width = Number(data.width) || 1200;
    const height = Number(data.height) || 600;
    const mode = escapeHtml(data.mode);
    const pageUrl = escapeHtml(data.pageUrl);
    const version = escapeHtml(data.version);
    const sizeClass = width < 520 ? " xq-compact" : width < 680 ? " xq-narrow" : "";
    return `<div class="xqvideo-box${sizeClass}" style="width: ${width}px; height: ${height}px">
            <div class="video-info-box" data-xq="box">
                <video tabindex="-1" data-xq="video" preload="auto"></video>
                <div class="video-loading" data-xq="loading">
                    <p>
                        <span>
                            <i class="xvicon xvicon-video"></i>
                        </span>
                    </p>
                </div>
                <div class="video-loading video-error hide" data-xq="error">
                    <p>
                        <i class="xvicon xvicon-error"></i>
                        <small data-xq="error-text">视频加载出错！</small>
                        <button type="button" class="video-error-retry" data-xq="retry">刷新重试！</button>
                    </p>
                </div>
                <div class="xqvideo-video-status hide" data-xq="status">
                    <i class="xvicon xvicon-info-circle"></i><span data-xq="status-text"></span>
                </div>
                <div class="xqvideo-video-info" data-xq="info">
                    <i class="xvicon xvicon-times" data-xq="info-close"></i>
                    <div class="xqvideo-video-intro">
                        <p>
                            <span>Name：</span>
                            <small>XQPlayer</small>
                        </p>
                        <p>
                            <span>Author：</span>
                            <small>gitguanqi</small>
                        </p>
                        <p>
                            <span>Date:</span>
                            <small>2022-10-07</small>
                        </p>
                        <p>
                            <span>Url：</span>
                            <small>${pageUrl}</small>
                        </p>
                        <p>
                            <span>Type：</span>
                            <small>${mode}</small>
                        </p>
                        <p>
                            <span>Version：</span>
                            <small>${version}</small>
                        </p>
                    </div>
                </div>
                <div class="video-info-close hide" title="关闭画中画" data-xq="draw-close">
                    <i class="xvicon xvicon-times"></i>
                </div>
                <div class="video-info-barrages" data-xq="barrage">
                        <ul data-xq="barrage-list"></ul>
                    </div>
                <div class="video-control" data-xq="control">
                    <div class="video-control-bar" data-xq="progress">
                        <span data-xq="progress-dot" style="width: 0%;"></span>
                    </div>
                    <div class="video-control-btn">
                        <div class="video-control-left">
                            <button type="button" data-xq="play" class="mobile-play show" title="播放">
                                <i class="xvicon xvicon-play1"></i>
                            </button>
                            <button type="button" data-xq="pause" class="mobile-play hide" title="暂停">
                                <i class="xvicon xvicon-pause"></i>
                            </button>
                            <span data-xq="current">00:00:00</span><span>/</span><span data-xq="duration">00:00:00</span>
                        </div>
                        <div class="video-control-right">
                            <div class="video-control-barrage">
                                <span data-xq="barrage-toggle" class="switch">弹</span>
                                <input data-xq="barrage-input" type="text" disabled placeholder="随便说点吧~" maxlength="16">
                                <button type="button" data-xq="barrage-send" class="send" disabled>发送</button>
                            </div>
                            <div class="video-control-alone video-qua mobile-no" data-xq="qua-wrap">
                                <button type="button" class="quality">标清</button>
                                <div class="video-control-speed qua hide" data-xq="qua">
                                    <span class="active">标清</span>
                                </div>
                            </div>
                            <div class="video-control-alone video-speed mobile-no" data-xq="speed-wrap">
                                <button type="button" title="倍速">
                                    <i class="xvicon xvicon-dashboard"></i>
                                </button>
                                <div class="video-control-speed spe hide" data-xq="speed">
                                    <span data-id="2">2倍</span>
                                    <span data-id="1.5">1.5倍</span>
                                    <span data-id="1.25">1.25倍</span>
                                    <span data-id="1">1.0倍</span>
                                    <span data-id="0.75">0.75倍</span>
                                </div>
                            </div>
                            <div class="video-control-alone video-set" data-xq="set-wrap">
                                <button type="button" title="设置">
                                    <i class="xvicon xvicon-set"></i>
                                </button>
                                <div class="video-control-set hide" data-xq="set">
                                    <p>
                                        小窗播放：
                                        <input class="offscreen" id="${uid}-draw" data-xq="opt-draw" type="checkbox">
                                        <label class="switch" for="${uid}-draw"></label>
                                    </p>
                                    <p>
                                        循环播放：
                                        <input class="offscreen" id="${uid}-loop" data-xq="opt-loop" type="checkbox">
                                        <label class="switch" for="${uid}-loop"></label>
                                    </p>
                                </div>
                            </div>
                            <div class="video-control-alone vol video-vol" data-xq="vol-wrap">
                                <button type="button" title="音量" data-xq="mute">
                                    <i class="xvicon xvicon-volume" data-xq="vol-icon"></i>
                                    <i class="xvicon xvicon-muted hide" data-xq="muted-icon"></i>
                                </button>
                                <div class="video-control-volum hide" data-xq="vol">
                                    <span data-xq="vol-bar">
                                        <small data-xq="vol-dot" style="height: ${Number(data.vol) || 100}%;"></small>
                                    </span>
                                </div>
                            </div>
                            <button type="button" data-xq="fullscreen" title="全屏" class="full-btn">
                                <i class="xvicon xvicon-fullscreen"></i>
                            </button>
                            <button type="button" data-xq="fullscreen-exit" title="复原" class="cancel-btn hide">
                                <i class="xvicon xvicon-fullscreen-exit"></i>
                            </button>
                            <button type="button" data-xq="info-toggle" title="视频信息">
                                <i class="xvicon xvicon-info-circle"></i>
                            </button>
                            <button type="button" data-xq="share" title="分享">
                                <i class="xvicon xvicon-share"></i>
                            </button>
                            <a title="举报" href="https://www.12377.cn/" target="_blank">
                                <i class="xvicon xvicon-error"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div id="${uid}-share-pop" data-xq="share-pop"></div>
        </div>`;
  }

  // src/media.mjs
  function globalScope() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    return {};
  }
  var NOOP_HANDLE = { kind: "none", destroy: function() {
  } };
  function loadSource(params) {
    const video = params.video;
    const type = params.type;
    const url = params.url;
    const poster = params.poster;
    const warn = typeof params.warn === "function" ? params.warn : function() {
    };
    const fail = typeof params.fail === "function" ? params.fail : function() {
    };
    if (!video) {
      warn("video 元素不存在，无法加载视频源");
      return NOOP_HANDLE;
    }
    if (poster) {
      video.setAttribute("poster", poster);
    }
    if (!type || SUPPORTED_MODES.indexOf(type) === -1) {
      warn("不支持的视频类型：" + type);
      fail("不支持的视频类型：" + type);
      return NOOP_HANDLE;
    }
    if (type === "mp4") {
      video.setAttribute("src", url);
      return { kind: "mp4", destroy: function() {
      } };
    }
    if (type === "m3u8") {
      return loadHls(video, url, warn, fail);
    }
    return loadFlv(video, url, warn, fail);
  }
  function loadHls(video, url, warn, fail) {
    const scope = globalScope();
    const Hls = scope.Hls;
    if (!Hls || typeof Hls.isSupported !== "function") {
      warn("未检测到 hls.js，m3u8 无法播放；请自行引入 hls.js");
      fail("需要引入 hls.js 才能播放 m3u8");
      return NOOP_HANDLE;
    }
    if (!Hls.isSupported()) {
      warn("当前环境不支持 hls.js 播放");
      fail("当前环境不支持 m3u8 播放");
      return NOOP_HANDLE;
    }
    const hls = new Hls();
    const events = Hls.Events || {};
    hls.attachMedia(video);
    if (events.MEDIA_ATTACHED) {
      hls.on(events.MEDIA_ATTACHED, function() {
        hls.loadSource(url);
        if (events.MANIFEST_PARSED) {
          hls.on(events.MANIFEST_PARSED, function(_event, data) {
            const levels = data && data.levels ? data.levels.length : 0;
            console.log(LOG_PREFIX + " m3u8 manifest loaded, " + levels + " quality level(s)");
          });
        }
      });
    } else {
      hls.loadSource(url);
    }
    let destroyed = false;
    return {
      kind: "m3u8",
      destroy: function() {
        if (destroyed) {
          return;
        }
        destroyed = true;
        try {
          hls.destroy();
        } catch (err) {
        }
      }
    };
  }
  function loadFlv(video, url, warn, fail) {
    const scope = globalScope();
    const flvjs = scope.flvjs;
    if (!flvjs || typeof flvjs.isSupported !== "function") {
      warn("未检测到 flv.js，flv 无法播放；请自行引入 flv.js");
      fail("需要引入 flv.js 才能播放 flv");
      return NOOP_HANDLE;
    }
    if (!flvjs.isSupported()) {
      warn("当前环境不支持 flv.js 播放");
      fail("当前环境不支持 flv 播放");
      return NOOP_HANDLE;
    }
    const player = flvjs.createPlayer({ type: "flv", url });
    player.attachMediaElement(video);
    player.load();
    const playing = player.play();
    if (playing && typeof playing.catch === "function") {
      playing.catch(function() {
      });
    }
    let destroyed = false;
    return {
      kind: "flv",
      destroy: function() {
        if (destroyed) {
          return;
        }
        destroyed = true;
        try {
          player.destroy();
        } catch (err) {
        }
      }
    };
  }

  // src/share.mjs
  var injectedCtor = null;
  function globalScope2() {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    return {};
  }
  function resolveShareCtor(options) {
    const fromOptions = options && options.share;
    if (typeof fromOptions === "function") {
      return fromOptions;
    }
    if (typeof injectedCtor === "function") {
      return injectedCtor;
    }
    const ctor = globalScope2().XqShare;
    return typeof ctor === "function" ? ctor : null;
  }
  function useShare(ctor) {
    injectedCtor = typeof ctor === "function" ? ctor : null;
    return injectedCtor;
  }
  function openShare(config) {
    const options = config || {};
    const Ctor = resolveShareCtor(options);
    if (!Ctor) {
      return null;
    }
    const scope = globalScope2();
    let url = options.url;
    let title = options.title;
    if (!url && scope.document && scope.document.location) {
      url = scope.document.location.href;
    }
    if (!title && scope.document) {
      title = scope.document.title || "";
    }
    let instance = null;
    try {
      instance = new Ctor({
        el: options.selector,
        type: options.type || "pop",
        url,
        title
      });
    } catch (error) {
      return null;
    }
    if (instance && typeof instance.show === "function" && options.open !== false) {
      instance.show();
    }
    return instance;
  }

  // src/player.mjs
  var instanceSeq = 0;
  var LEGACY_ID_MAP = {
    myvideo: "video",
    progressbar: "progress",
    "progress-dot": "progressDot",
    "play-btn": "play",
    "pause-btn": "pause",
    startTime: "current",
    endTime: "duration",
    statusText: "statusText",
    "video-open-barrage": "barrageToggle",
    "video-barrage-content": "barrageInput",
    "video-barrage-send": "barrageSend",
    draw: "optDraw",
    replay: "optLoop",
    volBar: "volBar",
    volDot: "volDot",
    "info-btn": "infoToggle",
    "share-btn": "share",
    popShare: "sharePop"
  };
  function XQVideoPlayer(option) {
    if (!(this instanceof XQVideoPlayer)) {
      return new XQVideoPlayer(option);
    }
    const options = normalizeOptions(option);
    this.uid = "xq-" + (instanceSeq += 1);
    this.options = options;
    this.container = resolveContainer(options.el);
    this.root = null;
    this.refs = /* @__PURE__ */ Object.create(null);
    this._listeners = [];
    this._statusTimer = 0;
    this._mediaHandle = null;
    this._share = null;
    this._destroyed = false;
    this._warned = /* @__PURE__ */ Object.create(null);
    this.video = createInitialState(options);
    this.initElem();
    this.initVideo();
    this.initEvent();
  }
  XQVideoPlayer.prototype.initElem = function() {
    const pageUrl = typeof location !== "undefined" && location ? location.origin + location.pathname : "";
    this.video.about.url = pageUrl;
    this.video.about.type = this.options.mode;
    this.video.about.version = VERSION;
    const root = document.createElement("div");
    root.className = "xqvideo";
    root.innerHTML = buildTemplate({
      uid: this.uid,
      width: this.options.width,
      height: this.options.height,
      mode: this.options.mode,
      pageUrl,
      version: VERSION,
      vol: this.video.vol
    });
    this.container.appendChild(root);
    this.root = root;
    this.refs = collectRefs(root);
  };
  XQVideoPlayer.prototype.initVideo = function() {
    const video = this.refs.video;
    if (!video) {
      return;
    }
    this.bindMediaEvents(video);
    this.loadVideo({
      video,
      type: this.options.mode,
      url: this.options.url,
      poster: this.options.poster
    });
    this.addDraw();
    this.addVol();
    this.addProgree();
    this.showBarrage();
    this.syncProgressDom();
  };
  XQVideoPlayer.prototype.bindMediaEvents = function(video) {
    const store = this._listeners;
    const self2 = this;
    on(store, video, "loadstart", function() {
      self2.setLoading(false);
    });
    on(store, video, "loadedmetadata", function() {
      self2.syncTimeDom();
    });
    on(store, video, "canplay", function() {
      self2.setLoading(false);
      self2.clearError();
    });
    on(store, video, "playing", function() {
      self2.setLoading(false);
      self2.clearError();
      self2.syncPlayState();
    });
    on(store, video, "timeupdate", function() {
      self2.syncTimeDom();
    });
    on(store, video, "play", function() {
      self2.syncPlayState();
    });
    on(store, video, "pause", function() {
      self2.syncPlayState();
    });
    on(store, video, "ended", function() {
      self2.handleEnded();
    });
    on(store, video, "error", function() {
      self2.setError(self2.describeMediaError(video));
    });
    on(store, video, "click", function() {
      self2.playVideo();
    });
    on(store, video, "contextmenu", function(event) {
      event.preventDefault();
      event.stopPropagation();
    });
  };
  XQVideoPlayer.prototype.initEvent = function() {
    const store = this._listeners;
    const refs = this.refs;
    const self2 = this;
    if (refs.play) {
      on(store, refs.play, "click", function() {
        self2.playVideo();
      });
    }
    if (refs.pause) {
      on(store, refs.pause, "click", function() {
        self2.playVideo();
      });
    }
    if (refs.infoToggle) {
      on(store, refs.infoToggle, "click", function() {
        self2.toggleInfo(true);
      });
    }
    if (refs.infoClose) {
      on(store, refs.infoClose, "click", function() {
        self2.toggleInfo(false);
      });
    }
    if (refs.retry) {
      on(store, refs.retry, "click", function() {
        self2.reload();
      });
    }
    if (refs.fullscreen) {
      on(store, refs.fullscreen, "click", function() {
        self2.fullScreenOpen();
      });
    }
    if (refs.fullscreenExit) {
      on(store, refs.fullscreenExit, "click", function() {
        self2.fullScreenCancel();
      });
    }
    if (refs.drawClose) {
      on(store, refs.drawClose, "click", function() {
        self2.hideDraw();
      });
    }
    if (refs.mute) {
      on(store, refs.mute, "click", function() {
        self2.videoMuted();
      });
    }
    if (refs.share) {
      on(store, refs.share, "click", function() {
        self2.shareVideo();
      });
    }
    if (refs.box) {
      on(store, refs.box, "mouseenter", function() {
        self2.toggleControl(true);
      });
      on(store, refs.box, "mouseleave", function() {
        self2.toggleControl(false);
      });
    }
    if (refs.quaWrap) {
      on(store, refs.quaWrap, "mouseenter", function() {
        self2.toggleQualBar(true);
      });
      on(store, refs.quaWrap, "mouseleave", function() {
        self2.toggleQualBar(false);
      });
    }
    if (refs.speedWrap) {
      on(store, refs.speedWrap, "mouseenter", function() {
        self2.toggleSpeed(true);
      });
      on(store, refs.speedWrap, "mouseleave", function() {
        self2.toggleSpeed(false);
      });
    }
    const speedItems = this.qa(".spe span");
    for (let i = 0; i < speedItems.length; i += 1) {
      on(store, speedItems[i], "click", function(event) {
        const target = event.currentTarget || event.target;
        if (target && target.getAttribute) {
          self2.setSpeed(target.getAttribute("data-id"));
        }
      });
    }
    this.showSpeedAct();
    if (refs.setWrap) {
      on(store, refs.setWrap, "mouseenter", function() {
        self2.toggleSet(true);
      });
      on(store, refs.setWrap, "mouseleave", function() {
        self2.toggleSet(false);
      });
    }
    if (refs.optDraw) {
      on(store, refs.optDraw, "change", function(event) {
        const checked = !!(event.target && event.target.checked);
        self2.video.draw = checked;
        self2.setPlayType("draw", checked);
      });
    }
    if (refs.optLoop) {
      on(store, refs.optLoop, "change", function(event) {
        const checked = !!(event.target && event.target.checked);
        self2.video.replay = checked;
        self2.setPlayType("replay", checked);
      });
    }
    if (refs.volWrap) {
      on(store, refs.volWrap, "mouseenter", function() {
        self2.toggleVol(true);
      });
      on(store, refs.volWrap, "mouseleave", function() {
        self2.toggleVol(false);
      });
    }
    if (refs.barrageToggle) {
      on(store, refs.barrageToggle, "click", function() {
        self2.toggleBarrage();
      });
    }
    if (refs.barrageSend) {
      on(store, refs.barrageSend, "click", function() {
        self2.sendBarrage();
      });
    }
    if (refs.barrageInput) {
      on(store, refs.barrageInput, "keydown", function(event) {
        if (event.key === "Enter") {
          self2.sendBarrage();
        }
      });
    }
  };
  XQVideoPlayer.prototype.warn = function(message) {
    const text = String(message);
    if (this._warned[text]) {
      return;
    }
    this._warned[text] = true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(LOG_PREFIX + " " + text);
    }
  };
  XQVideoPlayer.prototype.loadVideo = function(params) {
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
      fail: this.setError.bind(this)
    });
    return this._mediaHandle;
  };
  XQVideoPlayer.prototype.reload = function() {
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
      video,
      type: this.options.mode,
      url: this.options.url,
      poster: this.options.poster
    });
  };
  XQVideoPlayer.prototype.setLoading = function(show) {
    this.video.loading = !!show;
    toggleClass(this.refs.loading, "hide", !show);
  };
  XQVideoPlayer.prototype.setError = function(message) {
    this.video.error = true;
    this.video.loading = false;
    toggleClass(this.refs.loading, "hide", true);
    toggleClass(this.refs.error, "hide", false);
    setText(this.refs.errorText, message || "视频加载出错！");
  };
  XQVideoPlayer.prototype.clearError = function() {
    this.video.error = false;
    toggleClass(this.refs.error, "hide", true);
  };
  XQVideoPlayer.prototype.describeMediaError = function(video) {
    const code = video && video.error ? video.error.code : 0;
    switch (code) {
      case 1:
        return "视频加载被中断，请重试";
      case 2:
        return "网络错误，视频加载失败";
      case 3:
        return "视频解码失败";
      case 4:
        return "视频地址不可用或格式不受支持";
      default:
        return "视频加载出错！";
    }
  };
  XQVideoPlayer.prototype.syncTimeDom = function() {
    const video = this.refs.video;
    if (!video) {
      return;
    }
    const current = Number(video.currentTime) || 0;
    const duration = Number(video.duration);
    const total = Number.isFinite(duration) && duration > 0 ? duration : 0;
    this.video.about.duration = total;
    this.video.process = total ? current / total * 100 : 0;
    setText(this.refs.current, secondToTime(current));
    setText(this.refs.duration, secondToTime(total));
    this.syncProgressDom();
  };
  XQVideoPlayer.prototype.syncProgressDom = function() {
    if (this.refs.progressDot) {
      this.refs.progressDot.style.width = clamp(this.video.process, 0, 100) + "%";
    }
  };
  XQVideoPlayer.prototype.syncPlayState = function() {
    const video = this.refs.video;
    if (!video) {
      return;
    }
    this.video.play = !video.paused;
    toggleClass(this.refs.play, "show", !this.video.play);
    toggleClass(this.refs.pause, "hide", !this.video.play);
  };
  XQVideoPlayer.prototype.handleEnded = function() {
    const video = this.refs.video;
    if (!video) {
      return;
    }
    if (this.video.replay) {
      const result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function() {
        });
      }
    }
    this.syncPlayState();
  };
  XQVideoPlayer.prototype.playVideo = function() {
    const video = this.refs.video;
    if (!video) {
      return;
    }
    if (video.paused) {
      const result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function() {
        });
      }
    } else {
      video.pause();
    }
    this.syncPlayState();
    if (isTouchDevice()) {
      toggleClass(this.refs.pause, "hide", true);
    }
  };
  XQVideoPlayer.prototype.setVolume = function(value) {
    const vol = clamp(value, 0, 1);
    const video = this.refs.video;
    if (video) {
      video.volume = vol;
      video.muted = vol === 0;
    }
    this.video.vol = Math.round(vol * 100);
    this.video.muted = vol === 0;
    if (this.refs.volDot) {
      this.refs.volDot.style.height = this.video.vol + "%";
    }
    toggleClass(this.refs.volIcon, "hide", this.video.muted);
    toggleClass(this.refs.mutedIcon, "hide", !this.video.muted);
  };
  XQVideoPlayer.prototype.videoMuted = function() {
    this.setVolume(this.video.muted ? 1 : 0);
  };
  XQVideoPlayer.prototype.setProgressRatio = function(ratio) {
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
  XQVideoPlayer.prototype.setVolumeRatio = function(ratio) {
    this.setVolume(clamp(ratio, 0, 1));
  };
  XQVideoPlayer.prototype.setSpeed = function(val) {
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
    this.setStatus("已切换到" + rate + "倍速！");
  };
  XQVideoPlayer.prototype.showSpeedAct = function() {
    const items = this.qa(".spe span");
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const id = Number(item.getAttribute("data-id"));
      toggleClass(item, "active", id === Number(this.video.curSpeed));
    }
  };
  XQVideoPlayer.prototype.setStatus = function(val) {
    const text = val == null ? "" : String(val);
    if (this._statusTimer) {
      clearTimeout(this._statusTimer);
      this._statusTimer = 0;
    }
    this.video.status = true;
    this.video.statusText = text;
    toggleClass(this.refs.status, "hide", false);
    setText(this.refs.statusText, text);
    this._statusTimer = setTimeout(() => {
      this._statusTimer = 0;
      this.video.status = false;
      toggleClass(this.refs.status, "hide", true);
      setText(this.refs.statusText, "");
    }, 1e3);
  };
  XQVideoPlayer.prototype.setPlayType = function(type, value) {
    const text = type === "draw" ? "小窗播放" : "循环播放";
    const val = value ? "已开启" : "已关闭";
    this.video[type] = value;
    this.setStatus(text + val);
  };
  XQVideoPlayer.prototype.fullScreenOpen = function() {
    this.video.scale = true;
    toggleClass(this.refs.box, "scale", true);
    toggleClass(this.refs.fullscreen, "hide", true);
    toggleClass(this.refs.fullscreenExit, "hide", false);
  };
  XQVideoPlayer.prototype.fullScreenCancel = function() {
    this.video.scale = false;
    toggleClass(this.refs.box, "scale", false);
    toggleClass(this.refs.fullscreen, "hide", false);
    toggleClass(this.refs.fullscreenExit, "hide", true);
  };
  XQVideoPlayer.prototype.toggleControl = function(type) {
    toggleClass(this.refs.control, "hide", !type);
  };
  XQVideoPlayer.prototype.toggleInfo = function(type) {
    toggleClass(this.refs.info, "show", !!type);
  };
  XQVideoPlayer.prototype.toggleQualBar = function(type) {
    toggleClass(this.refs.qua, "hide", !type);
  };
  XQVideoPlayer.prototype.toggleSpeed = function(type) {
    toggleClass(this.refs.speed, "hide", !type);
  };
  XQVideoPlayer.prototype.toggleSet = function(type) {
    toggleClass(this.refs.set, "hide", !type);
  };
  XQVideoPlayer.prototype.toggleVol = function(type) {
    toggleClass(this.refs.vol, "hide", !type);
  };
  XQVideoPlayer.prototype.addDraw = function() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }
    const self2 = this;
    on(this._listeners, window, "scroll", function() {
      if (self2._destroyed || !self2.video.draw) {
        return;
      }
      const top = document.documentElement ? document.documentElement.scrollTop : 0;
      if (top > 800) {
        self2.video.isDraw = true;
        toggleClass(self2.refs.box, "draw", true);
        toggleClass(self2.refs.drawClose, "hide", false);
      } else if (top < 199) {
        self2.video.isDraw = false;
        toggleClass(self2.refs.box, "draw", false);
        toggleClass(self2.refs.drawClose, "hide", true);
      }
    }, { passive: true });
  };
  XQVideoPlayer.prototype.hideDraw = function() {
    this.video.isDraw = false;
    toggleClass(this.refs.box, "draw", false);
    toggleClass(this.refs.drawClose, "hide", true);
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
  };
  XQVideoPlayer.prototype.toggleBarrage = function() {
    this.video.barrage = !this.video.barrage;
    toggleClass(this.refs.barrage, "show", this.video.barrage);
    toggleClass(this.refs.barrageToggle, "active", this.video.barrage);
    if (this.refs.barrageInput) {
      if (this.video.barrage) {
        this.refs.barrageInput.removeAttribute("disabled");
      } else {
        this.refs.barrageInput.setAttribute("disabled", "disabled");
      }
    }
    if (this.refs.barrageSend) {
      if (this.video.barrage) {
        this.refs.barrageSend.removeAttribute("disabled");
      } else {
        this.refs.barrageSend.setAttribute("disabled", "disabled");
      }
    }
    if (this.video.barrage) {
      this.showBarrage();
    }
    this.setStatus(this.video.barrage ? "弹幕已开启" : "弹幕已关闭");
  };
  XQVideoPlayer.prototype.sendBarrage = function() {
    const input = this.refs.barrageInput;
    const raw = input ? input.value : this.video.barrageContent;
    const value = String(raw == null ? "" : raw).trim();
    if (!value) {
      this.setStatus("请输入弹幕内容！");
      return null;
    }
    this.video.barrageContent = value;
    const item = normalizeBarrage({ content: value });
    this.video.barrageList.push(item);
    if (input) {
      input.value = "";
    }
    this.showBarrage();
    return item;
  };
  XQVideoPlayer.prototype.showBarrage = function() {
    if (typeof document === "undefined") {
      return;
    }
    renderBarrage(document, this.refs.barrageList, this.video.barrageList);
  };
  XQVideoPlayer.prototype.randomColor = function() {
    return randomColor();
  };
  XQVideoPlayer.prototype.shareVideo = function() {
    const host = this.refs.sharePop;
    if (!host) {
      return null;
    }
    const selector = "#" + (host.id || this.uid + "-share-pop");
    if (this._share) {
      this._share.toggle();
      return this._share;
    }
    const instance = openShare({
      selector,
      url: this.video.about.url || void 0,
      title: this.options.title || void 0,
      share: this.options.share
    });
    if (!instance) {
      this.warn("未检测到 xqshare，分享按钮已降级");
      this.setStatus("分享组件未加载");
      return null;
    }
    this._share = instance;
    return instance;
  };
  XQVideoPlayer.prototype.addVol = function() {
    const bar = this.refs.volBar;
    if (!bar || typeof bar.addEventListener !== "function") {
      return;
    }
    const self2 = this;
    let dragging = false;
    const apply = function(clientY) {
      const rect = rectOf(bar);
      const ratio = clamp((clientY - rect.top) / (rect.height || 1), 0, 1);
      self2.setVolume(1 - ratio);
    };
    on(this._listeners, bar, "pointerdown", function(event) {
      dragging = true;
      if (typeof bar.setPointerCapture === "function" && event.pointerId != null) {
        try {
          bar.setPointerCapture(event.pointerId);
        } catch (err) {
        }
      }
      apply(event.clientY);
    });
    on(this._listeners, bar, "pointermove", function(event) {
      if (!dragging) {
        return;
      }
      apply(event.clientY);
    });
    const stop = function() {
      dragging = false;
    };
    on(this._listeners, bar, "pointerup", stop);
    on(this._listeners, bar, "pointercancel", stop);
  };
  XQVideoPlayer.prototype.addProgree = function() {
    const bar = this.refs.progress;
    if (!bar || typeof bar.addEventListener !== "function") {
      return;
    }
    const self2 = this;
    let dragging = false;
    const apply = function(clientX) {
      const rect = rectOf(bar);
      self2.setProgressRatio((clientX - rect.left) / (rect.width || 1));
    };
    on(this._listeners, bar, "pointerdown", function(event) {
      dragging = true;
      if (typeof bar.setPointerCapture === "function" && event.pointerId != null) {
        try {
          bar.setPointerCapture(event.pointerId);
        } catch (err) {
        }
      }
      apply(event.clientX);
    });
    on(this._listeners, bar, "pointermove", function(event) {
      if (!dragging) {
        return;
      }
      apply(event.clientX);
    });
    const stop = function() {
      dragging = false;
    };
    on(this._listeners, bar, "pointerup", stop);
    on(this._listeners, bar, "pointercancel", stop);
  };
  XQVideoPlayer.prototype.dom = function(select) {
    return this.root ? this.root.querySelector(select) : null;
  };
  XQVideoPlayer.prototype.domAll = function(select) {
    if (!this.root) {
      return [];
    }
    const nodes = this.root.querySelectorAll(select);
    return Array.prototype.slice.call(nodes);
  };
  XQVideoPlayer.prototype.q = function(select) {
    return this.dom(select);
  };
  XQVideoPlayer.prototype.qa = function(select) {
    return this.domAll(select);
  };
  XQVideoPlayer.prototype.gid = function(id) {
    if (!this._warned.__gid) {
      this._warned.__gid = true;
      if (typeof console !== "undefined" && console.warn) {
        console.warn(LOG_PREFIX + " gid() 已废弃，请改用实例的 dom()/q() 或 refs");
      }
    }
    const key = LEGACY_ID_MAP[id];
    return key ? this.refs[key] || null : null;
  };
  XQVideoPlayer.prototype.secondToTime = function(second) {
    return secondToTime(second);
  };
  XQVideoPlayer.prototype.destroy = function() {
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
      }
      this._mediaHandle = null;
    }
    if (this._share && typeof this._share.destroy === "function") {
      try {
        this._share.destroy();
      } catch (err) {
      }
      this._share = null;
    }
    offAll(this._listeners);
    const root = this.root;
    if (root && root.parentNode) {
      root.parentNode.removeChild(root);
    }
    this.root = null;
    this.refs = /* @__PURE__ */ Object.create(null);
  };
  function normalizeOptions(option) {
    if (!option || typeof option !== "object") {
      throw new Error(LOG_PREFIX + " 构造参数必须是对象");
    }
    const options = {};
    const keys = Object.keys(DEFAULTS);
    for (let i = 0; i < keys.length; i += 1) {
      options[keys[i]] = option[keys[i]] === void 0 ? DEFAULTS[keys[i]] : option[keys[i]];
    }
    if (!options.el) {
      throw new Error(LOG_PREFIX + " el 是必填项");
    }
    if (!options.url) {
      throw new Error(LOG_PREFIX + " url 是必填项");
    }
    if (!Array.isArray(options.barrages)) {
      options.barrages = [];
    }
    return options;
  }
  function resolveContainer(el) {
    if (typeof document === "undefined") {
      throw new Error(LOG_PREFIX + " 需要在浏览器环境中使用");
    }
    if (typeof el === "string") {
      const node = document.querySelector(el);
      if (!node) {
        throw new Error(LOG_PREFIX + " 找不到容器元素：" + el);
      }
      return node;
    }
    if (el && el.nodeType === 1) {
      return el;
    }
    throw new Error(LOG_PREFIX + " el 必须是选择器字符串或 DOM 元素");
  }
  function createInitialState(options) {
    return {
      play: false,
      // 播放
      scale: false,
      // 缩放
      loading: true,
      // 加载
      error: false,
      // 错误
      muted: false,
      // 静音
      mutedBar: false,
      // 静音条
      vol: 100,
      // 音量
      isDraw: false,
      // 画中画
      draw: true,
      // 画面
      set: false,
      // 设置条
      curSpeed: 1,
      // 当前速度
      speed: false,
      // 速度
      replay: false,
      // 重播
      status: false,
      // 状态
      statusText: "",
      // 状态描述
      barrage: false,
      // 弹幕
      barrageContent: "",
      barrageList: normalizeBarrages(options.barrages),
      process: 0,
      // 当前进度百分比
      about: {
        // 关于我们
        name: "XQVideoPlayer",
        version: VERSION,
        url: "",
        type: "",
        duration: 0
      },
      speeds: [
        // 倍速表
        { id: 1, name: "2.0倍", val: 2 },
        { id: 2, name: "1.5倍", val: 1.5 },
        { id: 3, name: "1.25倍", val: 1.25 },
        { id: 4, name: "1.0倍", val: 1 },
        { id: 5, name: "0.75倍", val: 0.75 }
      ],
      qualities: [{ id: 1, name: "标清", val: 1 }],
      url: options.url,
      poster: options.poster,
      mode: options.mode,
      width: options.width,
      height: options.height
    };
  }
  function isTouchDevice() {
    return typeof document !== "undefined" && "ontouchstart" in document;
  }
  function rectOf(el) {
    if (el && typeof el.getBoundingClientRect === "function") {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top || 0,
        left: rect.left || 0,
        width: rect.width || el.clientWidth || 0,
        height: rect.height || el.clientHeight || 0
      };
    }
    return {
      top: el && el.offsetTop || 0,
      left: el && el.offsetLeft || 0,
      width: el && el.clientWidth || 0,
      height: el && el.clientHeight || 0
    };
  }
  XQVideoPlayer.isSupportedMode = function(mode) {
    return SUPPORTED_MODES.indexOf(mode) !== -1;
  };

  // src/index.mjs
  XQVideoPlayer.version = VERSION;
  XQVideoPlayer.useShare = useShare;
  var index_default = XQVideoPlayer;
  return __toCommonJS(index_exports);
})();

var __XQ_NS = __XQ || {};
var __XQ_EXPORT = __XQ_NS.default ? __XQ_NS.default : __XQ_NS;
// 浏览器/CJS 分支拿到的都是构造函数本身，这里把具名 exports 挂到它上面，
// 这样 `import XQVideoPlayer, { VERSION } from 'xqplayer'` 与 require 的两种取法都能工作。
var isObjectLike = __XQ_EXPORT && typeof __XQ_EXPORT === 'object';
if (isObjectLike || typeof __XQ_EXPORT === 'function') {
    __XQ_EXPORT.default = __XQ_EXPORT;
    __XQ_EXPORT.XQVideoPlayer = __XQ_EXPORT;
    __XQ_EXPORT.VERSION = __XQ_NS.VERSION;
}
return __XQ_EXPORT;
});
