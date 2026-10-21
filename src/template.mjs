/**
 * 播放器骨架模板。
 *
 * 与 0.0.x 的差异只有一处：所有原本写死的 `id="myvideo"`、`id="play-btn"` 等
 * 全局 id 换成 `data-xq` 钩子，只有确实需要唯一 id 的少数节点（label[for]、
 * 第三方分享弹层选择器）才用 `${uid}-xxx` 派生，从而让同页多实例互不干扰。
 * 类名、层级、文案全部保持不变，因此已有样式表无需改写。
 */
import { escapeHtml } from './dom.mjs';

export function buildTemplate(data) {
    const uid = data.uid;
    const width = Number(data.width) || 1200;
    const height = Number(data.height) || 600;
    const mode = escapeHtml(data.mode);
    const pageUrl = escapeHtml(data.pageUrl);
    const version = escapeHtml(data.version);

    // 控制条内容比视频宽度更宽时按档位收起次要控件，避免图标被挤出/互相覆盖
    const sizeClass = width < 520 ? ' xq-compact' : width < 680 ? ' xq-narrow' : '';

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
