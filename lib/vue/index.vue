<template>
    <div class="xqvideo-box" :class="boxClass" :style="{'width': videoInfo.width+'px', 'height': videoInfo.height+'px'}">
        <div :class="{'video-info-box': true, 'scale': videoInfo.scale, 'draw': videoInfo.isDraw} " @mouseover="toggleControl(true)"  @mouseout="toggleControl(false)">
            <video ref="video" tabindex="-1" preload="auto" @click="playVideo"></video>
            <div :class="{'video-loading': true, 'video-loading-text': videoInfo.error}" v-if="videoInfo.loading">
                <p v-if="videoInfo.error">
                    <i class="xvicon xvicon-error"></i>
                    <small>视频加载出错！</small>
                    <a href="#refresh" @click.prevent="reloadVideo">刷新重试！</a>
                </p>
                <p v-else>
                    <span>
                        <i class="xvicon xvicon-video"></i>
                    </span>
                </p>
            </div>
            <div class="xqvideo-video-status" v-show="videoInfo.status">
                <i class="xvicon xvicon-info-circle"></i><span>{{ videoInfo.statusText }}</span>
            </div>
            <div class="xqvideo-video-info" v-show="videoInfo.aboutUs">
                <i class="xvicon xvicon-times" @click="videoInfo.aboutUs = false;"></i>
                <div class="xqvideo-video-intro">
                    <p v-for="(v, k) in videoInfo.about" :key="k">
                        <span>{{k}}：</span>
                        <small>{{v}}</small>
                    </p>
                </div>
            </div>
            <div class="video-info-close" title="关闭画中画" v-show="videoInfo.isDraw" @click="hideDraw">
                <i class="xvicon xvicon-times"></i>
            </div>
            <div class="video-info-barrages" v-show="videoInfo.barrage">
                    <ul>
                        <li v-for="item in videoInfo.barrageList" :key="item.id">
                            <img v-if="item.avatar" :src="item.avatar" :alt="item.name">
                            <span>{{item.name||'好奇宝宝'}}</span>
                            <small :style="{'color': item.bg}">{{ item.content }}</small>
                        </li>
                    </ul>
                </div>
            <div class="video-control" v-show="videoInfo.control">
                <div ref="progressbar" class="video-control-bar">
                    <span :style="{'width': videoInfo.process+'%'}"></span>
                </div>
                <div class="video-control-btn">
                    <div class="video-control-left">
                        <button class="mobile-play" title="播放" v-show="!videoInfo.play" @click="playVideo">
                            <i class="xvicon xvicon-play1"></i>
                        </button>
                        <button class="mobile-play" title="暂停" v-show="videoInfo.play && !videoInfo.hidePause"
                            @click="playVideo">
                            <i class="xvicon xvicon-pause"></i>
                        </button>
                        <span>{{ videoInfo.startTime }}/{{ videoInfo.endTime }}</span>
                    </div>
                    <div class="video-control-right" v-show="!videoInfo.isDraw">
                        <div class="video-control-barrage">
                            <span :class="{'switch': true, 'active': videoInfo.barrage}" @click="toggleBarrage">弹</span>
                            <input @click="clickBarrage" type="text" placeholder="随便说点吧~" :disabled="!videoInfo.barrage" v-model="videoInfo.barrageContent" @keydown.enter="sendBarrage" maxlength="16">
                            <button class="send" :disabled="!videoInfo.barrageContent||!videoInfo.barrage" @click="sendBarrage">发送</button>
                        </div>
                        <div class="video-control-alone mobile-no" @mouseover="showQualBar" @mouseout="hideQualBar">
                            <button class="quality">{{ videoInfo.qualityText }}</button>
                            <div class="video-control-speed qua" v-show="videoInfo.isQuality">
                                <span :class="{'active': videoInfo.quality === item.val}"
                                    v-for="item in videoInfo.qualities" :key="item.id">{{ item.name }}</span>
                            </div>
                        </div>
                        <div class="video-control-alone mobile-no" @mouseover="showSpeedBar" @mouseout="hideSpeedBar">
                            <button title="倍速">
                                <i class="xvicon xvicon-dashboard"></i>
                            </button>
                            <div class="video-control-speed" v-show="videoInfo.speed">
                                <span :class="{'active': videoInfo.curSpeed === item.val}" v-for="item in videoInfo.speeds"
                                    :key="item.id" @click="toggleSpeed(item.val)">{{ item.name }}</span>
                            </div>
                        </div>
                        <div class="video-control-alone" @mouseover="showSetBar" @mouseout="hideSetBar">
                            <button title="设置">
                                <i class="xvicon xvicon-set"></i>
                            </button>
                            <div class="video-control-set" v-show="videoInfo.set">
                                <p>
                                    小窗播放：
                                    <input class="offscreen" :id="uid + '-draw'" type="checkbox" v-model="videoInfo.draw"
                                        @change="toggleSetStatus('draw')">
                                    <label class="switch" :for="uid + '-draw'"></label>
                                </p>
                                <p>
                                    循环播放：
                                    <input class="offscreen" :id="uid + '-replay'" type="checkbox" v-model="videoInfo.replay"
                                        @change="toggleSetStatus('replay')">
                                    <label class="switch" :for="uid + '-replay'"></label>
                                </p>
                            </div>
                        </div>
                        <div class="video-control-alone vol" @mouseover="showVolBar" @mouseout="hideVolBar">
                            <button title="音量" @click="videoMuted">
                                <i class="xvicon xvicon-volume" v-show="!videoInfo.muted"></i>
                                <i class="xvicon xvicon-muted" v-show="videoInfo.muted"></i>
                            </button>
                            <div class="video-control-volum" v-show="videoInfo.mutedBar">
                                <span ref="volBar">
                                    <small ref="volDot" :style="{'height': videoInfo.vol + '%'}"></small>
                                </span>
                            </div>
                        </div>
                        <button title="全屏" v-show="!videoInfo.scale" @click="fullScreenOpen">
                            <i class="xvicon xvicon-fullscreen"></i>
                        </button>
                        <button title="复原" v-show="videoInfo.scale" @click="fullScreenCancel">
                            <i class="xvicon xvicon-fullscreen-exit"></i>
                        </button>
                        <button title="视频信息" @click="showAbout">
                            <i class="xvicon xvicon-info-circle"></i>
                        </button>
                        <button title="分享" @click="toggleShare">
                            <i class="xvicon xvicon-share"></i>
                        </button>
                        <a title="举报" href="https://www.12377.cn/" target="_blank">
                            <i class="xvicon xvicon-error"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <component :is="shareComponent" :type="share.type" :show="share.show" :url="share.url" :title="share.title"></component>
    </div>
</template>

<script>
    let instanceSeq = 0;

    /**
     * 分享组件空壳。xqshare 不再是硬依赖：宿主可通过 `share-resolver` 传入自己的分享组件，
     * 也可以用 CDN 挂到 window.XqShare，两者都没有时用它兜底，不渲染任何东西。
     */
    const XQ_SHARE_STUB = {
        name: 'xq-share-stub',
        props: {
            type: { type: String, default: 'pop' },
            show: { type: Boolean, default: false },
            url: { type: String, default: '' },
            title: { type: String, default: '' },
        },
        render() {
            // Vue 3 的 render 不再传 h（需要从 vue 里 import），Vue 2 返回 null 会渲染空 vnode；
            // 直接返回 null 在两个版本下都是安全的空渲染
            return null;
        },
    };

    export default {
        name: 'xqvideo',
        props: {
            'url': {
                type: String,
                required: true,
            },
            'poster': {
                type: String,
                default: '',
            },
            'barrages': {
                type: Array,
            },
            'mode': {
                type: String,
                default: 'mp4',
            },
            'width': {
                type: Number,
                default: 1200,
            },
            'height': {
                type: Number,
                default: 600,
            },
            'shareTitle': {
                type: String,
            },
            // 可选的分享组件（宿主 app.use(...) 之前塞进来，或 CDN 挂到 window.XqShare）
            'shareResolver': {
                type: [Object, Function],
                default: null,
            },
        },
        data() {
            return {
                // 同页多实例时用于隔离 label/checkbox 的 id
                uid: 'xqv-' + (instanceSeq += 1),
                // 视频总时长（秒），由 timeupdate 写入；原实现读 this.total 恒为 undefined
                duration: 0,
                statusTimer: 0,
                mediaHandle: null,
                videoInfo: {
                    play: false, // 播放
                    scale: false, // 缩放
                    startTime: '00:00:00', // 当前播放时间
                    endTime: '00:00:00', // 结束时间
                    process: 0, // 当前进度
                    loading: true, // 加载
                    error: false, // 错误
                    muted: false, // 静音
                    mutedBar: false, // 静音条
                    vol: 100, // 音量
                    hidePause: false, // 隐藏暂停
                    aboutUs: false, // 关于我们
                    control: true, // 控制条
                    isDraw: false, // 画中画
                    draw: true, // 画面
                    set: false, // 设置条
                    curSpeed: 1, // 当前速度
                    speed: false, // 速度
                    replay: false, // 重播
                    status: false, // 状态
                    statusText: '', // 状态描述
                    quality: 1,
                    isQuality: false, // 是否显示清晰度
                    barrage: false, // 弹幕
                    barrageContent: '',
                    barrageList: [],
                    about: { // 关于我们
                        name: 'XQVideoPlayer',
                        version: '0.1.0',
                        url: '',
                        type: '',
                        duration: 0,
                    },
                    speeds: [ // 倍速表
                        {
                            id: 1,
                            name: '2.0倍',
                            val: 2,
                        },
                        {
                            id: 2,
                            name: '1.5倍',
                            val: 1.5,
                        },
                        {
                            id: 3,
                            name: '1.25倍',
                            val: 1.25,
                        },
                        {
                            id: 4,
                            name: '1.0倍',
                            val: 1,
                        },
                        {
                            id: 5,
                            name: '0.75倍',
                            val: 0.75,
                        },
                    ],
                    qualities: [
                        {
                            id: 1,
                            name: '标清',
                            val: 1,
                        }
                    ],
                    url: '',
                    poster: '',
                    mode: 'mp4', // 'mp4', 'flv', 'm3u8'
                    width: 0,
                    height: 0,
                },
                share: {
                    url: '',
                    title: '',
                    show: false,
                    type: 'pop',
                },
            }
        },
        watch: {
            'routeType': function (val) {
                this.checkType(val);
            },
            'barrages': {
                handler(val) {
                    this.applyBarrages(val);
                },
                immediate: true,
            },
        },
        computed: {
            // 控制条内容比视频宽度更宽时按档位收起次要控件，避免图标被挤出/互相覆盖
            boxClass() {
                const w = Number(this.videoInfo.width) || 1200;
                if (w < 520) {
                    return { 'xq-compact': true };
                }
                if (w < 680) {
                    return { 'xq-narrow': true };
                }
                return {};
            },
            // 未安装 vue-router 时返回 undefined，不再抛错
            routeType() {
                return this.$route && this.$route.query ? this.$route.query.type : undefined;
            },
            // xqshare 降级为「运行时可选」：优先用宿主演进来的组件，
            // 其次用全局 XqShare（CDN 引入），都没有时用一个空壳，避免解析失败整页崩。
            shareComponent() {
                if (this.shareResolver) {
                    return this.shareResolver;
                }
                const globalShare =
                    typeof window !== 'undefined' && window.XqShare ? window.XqShare : null;
                return globalShare || XQ_SHARE_STUB;
            },
            hasShare() {
                return Boolean(this.shareResolver || (typeof window !== 'undefined' && window.XqShare));
            },
        },
        components: {
            'xq-share': XQ_SHARE_STUB,
        },
        mounted() {
            this.checkType();
            this.setVideo();
            this.videoEvent();
        },
        // Vue 3
        beforeUnmount() {
            this.teardown();
        },
        // Vue 2
        beforeDestroy() {
            this.teardown();
        },
        methods: {
            // 检测类型
            checkType(openType) {
                let type = openType || this.routeType;
                if (type && type == 'iframe') {
                    this.videoInfo.scale = true;
                }
            },
            // 设置信息
            setVideo () {
                let pageAddr = location.origin+location.pathname;
                this.videoInfo.url = this.url;
                this.videoInfo.poster = this.poster;
                this.videoInfo.mode = this.mode;
                this.videoInfo.about.url = pageAddr;
                this.videoInfo.about.type = this.mode;
                this.videoInfo.width = this.width;
                this.videoInfo.height = this.height;
                this.videoInfo.qualityText = this.videoInfo.quality == 2 ? '高清' : '标清';
                this.share.url = pageAddr+'?type=iframe';
                this.share.title = this.shareTitle || document.title;
            },
            // 显示分享
            toggleShare () {
                if (!this.videoInfo.url) return;
                if (!this.hasShare) {
                    this.setStatus('分享组件未加载');
                    return;
                }
                this.share.show = !this.share.show;
            },
            
            // 切换弹幕
            toggleBarrage () {  
                this.videoInfo.barrage = !this.videoInfo.barrage;
                let val = this.videoInfo.barrage ? '已开启' : '已关闭';
                this.setStatus(`弹幕${val}`);
            },

            // 点击弹幕
            clickBarrage () {
                this.$emit('clickBarrage');
            },
            // 保存弹幕
            sendBarrage () {
                this.$emit('saveBarrages', this.videoInfo.barrageContent);
                this.videoInfo.barrageContent = '';
            },

            // 把外部弹幕数据归一化一次，之后不再重复生成随机色
            applyBarrages (list) {
                if (!list || !list.length) {
                    this.videoInfo.barrageList = [];
                    return;
                }
                this.videoInfo.barrageList = list.map((item, index) => ({
                    id: item.id || index,
                    avatar: item.avatar || '',
                    name: item.name || '好奇宝宝',
                    content: item.content || '',
                    bg: this.randomColor(),
                }));
            },
            // 显示弹幕（保留旧调用名）
            showBarrage () {
                this.applyBarrages(this.barrages);
            },
            
            // 随机颜色
            randomColor () {  
                let r = Math.floor(Math.random()*256);
                let g = Math.floor(Math.random()*256);
                let b = Math.floor(Math.random()*256);
                r = r < 120 ? 120 : r;
                g = g < 120 ? 120 : g;
                b = b < 120 ? 120 : b;
                // r/g/b 已保证 >=120，转换后一定是两位十六进制
                let color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
                return color;
            },

            initVideo ({
                video, type, url, poster 
            }) {
                if (!video) {
                    console.error('[xqplayer] tip: video not null!');
                    return;
                }
                if (!type || ['mp4', 'flv', 'm3u8'].indexOf(type) === -1) {
                    console.error('[xqplayer] tip: type error!');
                    return;
                }
                // 先销毁上一个流实例，换源时不残留
                this.destroyMedia();

                // mp4播放
                if (type == 'mp4') {
                    video.src = url;
                }
                // m3u8格式播放：Hls 是外部可选依赖，先探测再使用
                if (type == 'm3u8') {
                    const HlsLib = typeof Hls !== 'undefined' ? Hls : (typeof window !== 'undefined' ? window.Hls : null);
                    if (HlsLib && HlsLib.isSupported()) {
                        const hls = new HlsLib();
                        this.mediaHandle = hls;
                        hls.attachMedia(video);
                        hls.on(HlsLib.Events.MEDIA_ATTACHED, () => {
                            hls.loadSource(url);
                            hls.on(HlsLib.Events.MANIFEST_PARSED, (event, data) => {
                                console.log(
                                    '[xqplayer] manifest loaded, found ' + data.levels.length + ' quality level'
                                );
                            });
                        });
                    } else {
                        console.error('[xqplayer] tip: m3u8 video play error!');
                        this.setErrorState('m3u8 需要引入 hls.js');
                    }
                }
                // flv播放：flvjs 同理
                if (type == 'flv') {
                    const FlvLib = typeof flvjs !== 'undefined' ? flvjs : (typeof window !== 'undefined' ? window.flvjs : null);
                    if (FlvLib && FlvLib.isSupported()) {
                        const flvPlayer = FlvLib.createPlayer({
                            type: 'flv',
                            url,
                        });
                        this.mediaHandle = flvPlayer;
                        flvPlayer.attachMediaElement(video);
                        flvPlayer.load();
                        flvPlayer.play();
                    } else {
                        console.error('[xqplayer] tip: flv video play error!');
                        this.setErrorState('flv 需要引入 flv.js');
                    }
                }

                // 设置海报
                if (poster) {
                    video.setAttribute('poster', poster);
                }
            },

            // 视频加载
            videoEvent() {
                let myVideo = this.$refs.video;
                let url = this.videoInfo.url;
                let poster = this.videoInfo.poster || '';

                if (!myVideo) {
                    console.error('[xqplayer] tip: video not mounted!');
                    return;
                }

                this.initVideo({
                    video: myVideo,
                    type: this.videoInfo.mode,
                    url,
                    poster,
                });

                myVideo.pause();

                myVideo.oncontextmenu = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                myVideo.addEventListener('loadstart', () => {
                    this.videoInfo.error = false;
                })

                myVideo.addEventListener('seeking', () => {
                    this.videoInfo.error = false;
                })

                myVideo.addEventListener('seeked', () => {
                    this.videoInfo.error = false;
                })

                myVideo.addEventListener('canplaythrough', () => {
                    this.videoInfo.loading = false;
                    this.videoInfo.error = false;
                })

                myVideo.addEventListener('timeupdate', () => {
                    let currentTime = myVideo.currentTime || 0;
                    // duration 可能是 NaN（直播 / 未加载完），这里统一收敛为数字
                    let total = Number.isFinite(myVideo.duration) ? myVideo.duration : 0;
                    if (total) {
                        this.duration = total;
                        this.videoInfo.endTime = this.secondToTime(total);
                        this.videoInfo.about.duration = total;
                    }
                    this.videoInfo.startTime = this.secondToTime(currentTime);
                    this.videoInfo.process = total ? (currentTime / total) * 100 : 0;
                }, false);
                myVideo.addEventListener('ended', () => {
                    if (this.videoInfo.replay) {
                        myVideo.play();
                        this.videoInfo.play = true;
                    } else {
                        this.videoInfo.play = false;
                    }
                })
                // 原来是普通函数，回调里的 this 是 video 元素，赋值直接抛 TypeError
                myVideo.addEventListener('error', () => {
                    this.videoInfo.error = true;
                    this.videoInfo.loading = false;
                })

                // 添加画中画
                this.addDraw();

                // 音量控制
                this.addVolEvent();

                // 进度条控制
                this.addProgreeEvent();
            },

            // 控制条
            toggleControl (type) {
                this.videoInfo.control = type;
            },

            // 计算秒数
            secondToTime(second) {  
                // NaN / 负数 / Infinity 一律按 0 处理，避免渲染出 "NaN:NaN:NaN"
                let num = Number(second);
                if (!Number.isFinite(num) || num < 0) {
                    num = 0;
                }
                let total = Math.floor(num);
                let s = total % 60;
                let m = Math.floor(total / 60) % 60;
                let h = Math.floor(total / 3600);
                // 注意是 >= 10 而不是 > 10：10 秒应该得到 "10" 而不是 "010"
                let pad = (val) => (val >= 10 ? String(val) : '0' + val);
                return pad(h) + ':' + pad(m) + ':' + pad(s);
            },

            // 画中画：原来直接覆盖 window.onscroll，多实例互相顶掉且无法解绑
            addDraw() {
                if (this._onScroll) {
                    return;
                }
                this._onScroll = () => {
                    let top = document.documentElement.scrollTop || document.body.scrollTop || 0;
                    if (this.videoInfo.draw) {
                        if (top > 800) {
                            this.videoInfo.isDraw = true;
                        }
                        if (top < 199) {
                            this.videoInfo.isDraw = false;
                        }
                    }
                };
                window.addEventListener('scroll', this._onScroll, { passive: true });
            },

            // 隐藏画中画
            hideDraw() {
                this.videoInfo.isDraw = false;
                document.documentElement.scrollTop = 0;
            },

            // 添加歌曲音量控制事件
            addVolEvent() {
                let volBar = this.$refs.volBar;
                if (!volBar) {
                    return;
                }
                const setVolume = (clientY, video) => {
                    const rect = volBar.getBoundingClientRect();
                    const ratio = (clientY - rect.top) / (rect.height || 1);
                    // 柱体顶端是 100%
                    const vol = 1 - Math.min(1, Math.max(0, ratio));
                    this.videoInfo.vol = Math.round(vol * 100);
                    if (video) {
                        video.volume = vol;
                        video.muted = vol <= 0;
                    }
                    this.videoInfo.muted = vol <= 0;
                };

                // 原来只在 mousedown 里算一次、且用音柱外的坐标做参考系，拖动完全无效
                this._volHandlers = {
                    down: (e) => {
                        this._volDragging = true;
                        setVolume(e.clientY, this.$refs.video);
                    },
                    move: (e) => {
                        if (!this._volDragging) {
                            return;
                        }
                        setVolume(e.clientY, this.$refs.video);
                    },
                    up: () => {
                        this._volDragging = false;
                    },
                };

                volBar.addEventListener('mousedown', this._volHandlers.down, false);
                volBar.addEventListener('mousemove', this._volHandlers.move, false);
                document.addEventListener('mouseup', this._volHandlers.up, false);
            },

            // 添加进度条事件
            addProgreeEvent() {
                let progressBar = this.$refs.progressbar;
                if (!progressBar) {
                    return;
                }

                const seek = (clientX) => {
                    const rect = progressBar.getBoundingClientRect();
                    if (!rect.width) {
                        return;
                    }
                    // 原实现的 clamp 是条空语句（`num > 1 ? 1 : ...;` 没赋值），
                    // 且拿 this.videoInfo.total（从不存在的 prop 读来）算时间 → NaN
                    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
                    const video = this.$refs.video;
                    this.videoInfo.process = ratio * 100;
                    if (video && Number.isFinite(video.duration) && video.duration > 0) {
                        video.currentTime = ratio * video.duration;
                        // 这里写的是格式化后的时间，原来的 parseFloat(currentTime.toFixed(6)) 会把秒数直接显示出来
                        this.videoInfo.startTime = this.secondToTime(video.currentTime);
                    }
                };

                this._proHandlers = {
                    down: (e) => {
                        this._proDragging = true;
                        seek(e.clientX);
                    },
                    move: (e) => {
                        if (!this._proDragging) {
                            return;
                        }
                        seek(e.clientX);
                    },
                    up: () => {
                        this._proDragging = false;
                    },
                };

                progressBar.addEventListener('mousedown', this._proHandlers.down, false);
                progressBar.addEventListener('mousemove', this._proHandlers.move, false);
                document.addEventListener('mouseup', this._proHandlers.up, false);
            },

            // 视频操作
            playVideo() {
                let video = this.$refs.video;
                if (!video) {
                    return;
                }
                this.videoInfo.play = !this.videoInfo.play;
                let isMobile = 'ontouchstart' in document;
                if (this.videoInfo.play) {
                    video.play();
                } else {
                    video.pause();
                }
                if (isMobile) {
                    this.videoInfo.hidePause = true;
                } else {
                    this.videoInfo.hidePause = false;
                }
            },  

            // 静音
            videoMuted() {
                let video = this.$refs.video;
                this.videoInfo.muted = !this.videoInfo.muted;
                if (video) {
                    video.muted = this.videoInfo.muted;
                    video.volume = this.videoInfo.muted ? 0 : 1;
                }
                this.videoInfo.vol = this.videoInfo.muted ? 0 : 100;
            },

            // fullscreen set：原来直接改写 document.body.className，会把宿主页面的类全清掉
            fullScreenOpen() {
                this.videoInfo.scale = true;
                this.toggleScrollLock(true);
            },

            fullScreenCancel() {
                this.videoInfo.scale = false;
                this.toggleScrollLock(false);
            },

            // 只增删自己的那一个类，不动宿主已有的 class
            toggleScrollLock(locked) {
                if (typeof document === 'undefined' || !document.body) {
                    return;
                }
                if (locked) {
                    document.body.classList.add('xqvideo-lock-scroll');
                } else {
                    document.body.classList.remove('xqvideo-lock-scroll');
                }
            },

            // 显示关于
            showAbout() {
                this.videoInfo.aboutUs = true;
            },

            // 显示控制台
            showControls() {
                this.videoInfo.control = true;
            },

            // 隐藏控制台
            hideControls() {
                this.videoInfo.control = false;
            },

            // 显示倍速条
            showSpeedBar() {
                this.videoInfo.speed = true;
            },

            // 隐藏倍速条
            hideSpeedBar() {
                this.videoInfo.speed = false;
            },


            // 显示设置条
            showSetBar() {
                this.videoInfo.set = true;
            },

            // 隐藏设置条
            hideSetBar() {
                this.videoInfo.set = false;
            },

            // 显示音量条
            showVolBar() {
                this.videoInfo.mutedBar = true;
            },

            // 隐藏音量条
            hideVolBar() {
                this.videoInfo.mutedBar = false;
            },

            // 设置
            toggleSetStatus(type) {
                let text = type == 'draw' ? '小窗播放' : '循环播放';
                let val = this.videoInfo[type] ? '已开启' : '已关闭';
                this.setStatus(`${text}${val}`);
            },

            // 切换速度
            toggleSpeed(val) {
                let myVideo = this.$refs.video;
                this.videoInfo.curSpeed = val;
                if (myVideo) {
                    myVideo.playbackRate = val;
                }
                this.setStatus(`已切换到${val}倍速！`);
            },

            // 设置清晰度
            showQualBar() {
                this.videoInfo.isQuality = true;
            },

            hideQualBar() {
                this.videoInfo.isQuality = false;
            },

            // 视频状态设置
            setStatus(val) {
                // 连续调用时清掉上一个定时器，否则后一条会被前一条提前关掉
                if (this.statusTimer) {
                    clearTimeout(this.statusTimer);
                }
                this.videoInfo.status = true;
                this.videoInfo.statusText = val;
                this.statusTimer = setTimeout(() => {
                    this.videoInfo.status = false;
                    this.videoInfo.statusText = '';
                    this.statusTimer = 0;
                }, 1000);
            },

            // 进入错误态
            setErrorState(text) {
                this.videoInfo.error = true;
                this.videoInfo.loading = false;
                if (text) {
                    this.setStatus(text);
                }
            },

            // 刷新重试
            reloadVideo() {
                const video = this.$refs.video;
                if (!video) {
                    return;
                }
                this.videoInfo.error = false;
                this.videoInfo.loading = true;
                this.videoInfo.play = false;
                this.initVideo({
                    video,
                    type: this.videoInfo.mode,
                    url: this.videoInfo.url,
                    poster: this.videoInfo.poster,
                });
            },

            // 销毁 hls/flv 实例
            destroyMedia() {
                if (this.mediaHandle && typeof this.mediaHandle.destroy === 'function') {
                    try {
                        this.mediaHandle.destroy();
                    } catch (err) {
                        /* 销毁失败不应影响组件卸载 */
                    }
                }
                this.mediaHandle = null;
            },

            // 组件卸载前统一收尾，beforeUnmount(Vue 3) 与 beforeDestroy(Vue 2) 都会调用
            teardown() {
                this.destroyMedia();
                if (this.statusTimer) {
                    clearTimeout(this.statusTimer);
                    this.statusTimer = 0;
                }
                if (this._onScroll) {
                    window.removeEventListener('scroll', this._onScroll);
                    this._onScroll = null;
                }
                if (this._volHandlers) {
                    document.removeEventListener('mouseup', this._volHandlers.up);
                    this._volHandlers = null;
                }
                if (this._proHandlers) {
                    document.removeEventListener('mouseup', this._proHandlers.up);
                    this._proHandlers = null;
                }
                // 避免误给宿主留下滚动锁
                this.toggleScrollLock(false);
            },
        },
    }
</script>

<!-- 非 scoped：只有全屏时给 body 加的滚动锁。
     图标用的是 lib/css/xqplayer.css 里的 .xvicon-* 定义，宿主照常引入即可，
     不再在组件里 @import 一份副本来避免重复打包。 -->
<style>
    .xqvideo-lock-scroll {
        overflow: hidden;
    }
</style>

<style lang="less" scoped>
    @mainColor: #d32d2d;
    @black: #000;
    @white: #fff;
    @one: #111;
    @three: #333;
    @six: #666;
    @nine: #999;
    @f8: #f8f8f8;
    @c: #ccc;
    .xqvideo-box {
        position: relative;

        /* 窄播放器：按实例宽度逐级收起次要控件 */
        &.xq-narrow .video-info-box .video-control .video-control-btn .mobile-no,
        &.xq-compact .video-info-box .video-control .video-control-btn .mobile-no {
            display: none;
        }

        &.xq-compact .video-control .video-control-barrage {
            padding-left: 12px;
            padding-right: 4px;
        }

        &.xq-compact .video-control .video-control-barrage input {
            display: none;
        }

        /* 组件自成一体：不依赖宿主页面的 reset（box-sizing 与按钮外观） */
        &,
        *,
        *::before,
        *::after {
            box-sizing: border-box;
        }

        button {
            margin: 0;
            padding: 0;
            border: 0;
            background: none;
            font: inherit;
            color: inherit;
            appearance: none;
        }

        a {
            text-decoration: none;
        }

        input {
            font: inherit;
            outline: none;
            border: 0;
        }

        .video-info-box {
            position: relative;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            background: @black;
            overflow: hidden;

            video {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;

                &::-webkit-media-controls {
                    display: none;
                }
            }

            .video-loading {
                position: absolute;
                top: 0;
                left: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0;
                width: 100%;
                height: 100%;
                font-size: 14px;
                background: fadeout(@black, 30);
                z-index: 9;

                p {
                    span {
                        display: inline-block;
                        animation: donut-spin 1.2s linear infinite;
                        i {
                            font-size: 30px;
                            color: @mainColor;
                        }
                    }
                }

                &.video-loading-text {
                    color: @white;
                    z-index: 11;

                    p {
                        display: flex;
                        justify-content: center;
                        flex-direction: column;
                        align-items: center;

                        i {
                            font-size: 30px;
                            margin-bottom: 10px;
                        }

                        a {
                            margin-top: 10px;
                            color: @white;
                            text-decoration: underline;
                        }
                    }
                }
            }

            .video-info-barrages {
                position: absolute;
                top: 10px;
                right: 0;
                width: 100%;
                height: 100px;
                color: @white;
                overflow: hidden;
                z-index: 11;
                ul {
                    display: flex;
                    flex-flow: row wrap;
                    justify-content: flex-start;
                    width: auto;
                    height: 100px;
                    animation: barrage 10s linear infinite;
                    li {
                        margin-bottom: 10px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 5px 10px;
                        height: 30px;
                        font-size: 13px;
                        line-height: 1.5;
                        img {
                            display: inline-block;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                        }
                        span {
                            margin: 0 3px;
                            color: fadeout(@f8, 40);
                        }
                        small {
                            font-size: 16px;
                        }
                        &:nth-child(2n) {
                            margin-left: 10px;
                        }
                        &:nth-child(3n) {
                            margin-left: 20px;
                        }
                        &:nth-child(4n) {
                            margin-left: 30px;
                        }
                        &:nth-child(5n) {
                            margin-left: 40px;
                        }
                    }
                    &:hover {
                        animation-play-state: paused;
                    }
                }
            }
            @keyframes barrage {
                0% {
                    transform: translateX(100%);
                }
                100% {
                    transform: translateX(-100%);
                }
            }

            .xqvideo-video-status {
                position: absolute;
                bottom: 70px;
                left: 10px;
                padding: 5px 10px;
                font-size: 14px;
                color: @f8;
                line-height: 2;
                background: @black;
                border-radius: 5px;
                z-index: 9;

                i {
                    margin-right: 5px;
                }
            }

            .xqvideo-video-info {
                position: absolute;
                left: 10px;
                top: 10px;
                padding: 20px 30px 10px 10px;
                font-size: 12px;
                color: @white;
                line-height: 1.5;
                background: fadeout(@black, 35);
                border: 1px solid fadeout(@f8, 55);
                z-index: 19;

                i {
                    position: absolute;
                    right: 10px;
                    top: 5px;
                    font-size: 12px;
                    cursor: pointer;
                }
            }

            .video-info-close {
                position: absolute;
                right: 10px;
                top: 10px;
                color: @white;
                font-size: 16px;
                cursor: pointer;
                z-index: 99;
            }

            .video-control {
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 60px;
                background: fadeout(@white, 80);
                z-index: 8;

                .video-control-bar {
                    width: 100%;
                    height: 5px;
                    background: @c;
                    overflow: hidden;

                    span {
                        display: block;
                        width: 1%;
                        height: 100%;
                        background: @mainColor;
                    }
                }

                .video-control-right {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    flex: 1 1 auto;
                    min-width: 0;
                    flex-wrap: nowrap;
                }

                .video-control-barrage {
                    position: relative;
                    display: flex;
                    align-items: center;
                    flex: 0 1 auto;
                    min-width: 0;
                    padding-left: 30px;
                    padding-right: 10px;
                    width: auto;
                    height: 25px;
                    font-size: 13px;
                    .switch {
                        display: inline-block;
                        flex: 0 0 auto;
                        padding: 0;
                        width: 25px;
                        height: 25px;
                        line-height: 23px;
                        cursor: pointer;
                        color: @f8;
                        text-align: center;
                        font-size: 12px;
                        border: 1px solid @c;
                        border-radius: 50%;
                        &.active {
                            color: @mainColor;
                            border-color: @mainColor;
                            font-weight: bold;
                        }
                    }
                    input {
                        box-sizing: border-box;
                        flex: 1 1 120px;
                        min-width: 70px;
                        width: auto;
                        margin-left: 8px;
                        padding-left: 10px;
                        height: 25px;
                        background: fadeout(@white, 80);
                        color: @white;
                        &::placeholder {
                            color: fadeout(@white, 20);
                        }
                    }
                    .send {
                        flex: 0 0 auto;
                        position: relative;
                        margin-left: 2px;
                        width: 50px;
                        height: 25px;
                        line-height: 25px;
                        font-size: 14px;
                        color: @f8;
                        background: fadeout(@white, 80);
                        cursor: pointer;
                        &:hover {
                            background: @mainColor;
                            color: @white;
                        }
                        &:disabled {
                            &:hover {
                                color: @f8;
                                background: fadeout(@white, 90);
                                cursor: no-drop;
                            }
                        }
                    }
                }

                .video-control-btn {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-sizing: border-box;
                    margin-top: 3px;
                    padding: 0 5px;
                    height: 42px;
                    min-width: 0;
                    flex-wrap: nowrap;

                    .video-control-left {
                        display: flex;
                        align-items: center;
                        flex: 0 0 auto;
                        white-space: nowrap;
                    }

                    button,
                    a {
                        display: inline-block;
                        flex: 0 0 auto;
                        width: 35px;
                        height: 30px;
                        line-height: 30px;
                        text-align: center;
                        color: rgba(255, 255, 255, .8);
                        font-size: 16px;
                        cursor: pointer;

                        &:hover {
                            color: @white;
                        }

                        &.video-control-draw {
                            &.active {
                                color: @white;
                            }
                        }

                        &.quality {
                            width: 50px;
                            font-size: 14px;
                        }
                    }

                    span {
                        margin-left: 5px;
                        color: @c;
                        font-size: 14px;
                        white-space: nowrap;
                    }

                    .video-control-alone {
                        position: relative;
                        display: inline-flex;
                        align-items: center;
                        flex: 0 0 auto;
                    }

                    .video-control-speed {
                        position: absolute;
                        bottom: calc(100% + 8px);
                        left: 50%;
                        right: auto;
                        transform: translateX(-50%);
                        box-sizing: border-box;
                        padding: 10px;
                        width: 70px;
                        height: auto;
                        background: fadeout(@black, 39);
                        border-radius: 5px;
                        font-size: 14px;
                        line-height: 1.8;
                        text-align: center;
                        z-index: 9;

                        span {
                            cursor: pointer;

                            &.active {
                                color: @mainColor;
                            }

                            &:hover {
                                color: @mainColor;
                            }
                        }
                    }

                    .video-control-set {
                        position: absolute;
                        bottom: calc(100% + 8px);
                        left: 50%;
                        right: auto;
                        transform: translateX(-50%);
                        box-sizing: border-box;
                        padding: 10px;
                        width: auto;
                        height: auto;
                        background: fadeout(@black, 39);
                        color: @white;
                        font-size: 12px;
                        border-radius: 5px;
                        white-space: nowrap;
                        z-index: 9;

                        p {
                            display: flex;
                            align-items: center;
                            line-height: 25px;

                            .offscreen {
                                position: absolute;
                                left: -9999px;
                            }

                            .switch {
                                position: relative;
                                display: inline-block;
                                width: 30px;
                                height: 15px;
                                background-color: fadeout(@c, 25);
                                border-radius: 20px;
                                transition: all .3s;

                                &::after {
                                    position: absolute;
                                    left: 1px;
                                    top: -1px;
                                    width: 15px;
                                    height: 15px;
                                    border-radius: 10px;
                                    background-color: @white;
                                    content: '';
                                    transition: all .3s;
                                }
                            }

                            input[type='checkbox']:checked+.switch::after {
                                transform: translateX(20px);
                            }

                            input[type='checkbox']:checked+.switch {
                                background-color: @mainColor;
                            }
                        }
                    }

                    .video-control-volum {
                        position: absolute;
                        left: 50%;
                        right: auto;
                        bottom: calc(100% + 8px);
                        transform: translateX(-50%);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 30px;
                        height: 100px;
                        background: fadeout(@black, 30);
                        border-radius: 5px;
                        z-index: 9;

                        span {
                            position: relative;
                            display: inline-block;
                            width: 8px;
                            height: 80px;
                            background: @c;
                            border-radius: 10px;
                            overflow: hidden;

                            small {
                                position: absolute;
                                left: 0;
                                bottom: 0;
                                display: inline-block;
                                width: 100%;
                                height: 0;
                                background: @mainColor;
                                transition: all .5s;
                            }
                        }
                    }
                }
            }

            &.scale {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100vh;
                overflow: hidden;
                z-index: 100;

                video {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100vh;
                }

                .video-control {
                    .video-control-bar {
                        background: @white;
                    }

                    .video-control-btn {

                        button,
                        span {
                            color: @white;
                        }
                    }
                }
            }

            &.draw {
                position: fixed;
                bottom: 150px;
                right: 10px;
                width: 300px;
                height: 200px;
            }
        }

        .video-info-func {
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
            padding: 0 5px;
            width: 100%;
            height: 60px;
            background: @black;
            color: @white;
            font-size: 12px;

            .video-info-share {

                button,
                a {
                    box-sizing: border-box;
                    padding: 0 10px;
                    width: auto;
                    height: 50px;
                    line-height: 50px;
                    text-align: center;
                    font-size: 14px;
                    color: @c;
                    cursor: pointer;

                    i {
                        margin-right: 5px;
                    }

                    &:hover {
                        color: @white;
                    }
                }
            }

            .video-info-barrage {
                position: relative;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-right: 10px;
                width: auto;
                height: 25px;
                font-size: 13px;
                overflow: hidden;

                span {
                    margin-right: 10px;
                    padding: 4px;
                    cursor: pointer;
                    color: @c;
                    font-size: 12px;
                    border: 1px solid @c;
                    border-radius: 50%;

                    &.active {
                        color: @mainColor;
                        border-color: @mainColor;
                        font-weight: bold;
                    }
                }

                input {
                    box-sizing: border-box;
                    padding-left: 10px;
                    width: 100%;
                    height: 25px;
                    background: fadeout(@six, 30);
                    color: @f8;
                }

                button {
                    position: absolute;
                    right: 10px;
                    top: 0;
                    width: 50px;
                    height: 25px;
                    line-height: 20px;
                    color: @f8;
                    background: fadeout(@six, 10);
                    cursor: pointer;

                    &:hover {
                        background: @mainColor;
                        color: @white;
                    }

                    &:disabled {
                        &:hover {
                            color: @f8;
                            background: fadeout(@six, 10);
                            cursor: no-drop;
                        }
                    }
                }
            }
        }
    }

    
    @keyframes donut-spin {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }

    @media all and (max-width: 768px) {
        .xqvideo-box {
            .video-info-box {
                height: 210px;

                .xqvideo-video-status {
                    bottom: 50px;
                }

                .video-control {
                    height: 40px;

                    .video-control-bar {
                        height: 3px;
                    }

                    .video-control-btn {
                        margin-top: 0;
                        height: 35px;

                        .mobile-play {
                            position: absolute;
                            top: -165%;
                            left: 50%;
                            margin-top: -15px;
                            margin-left: -15px;
                            font-size: 30px;
                            color: @white;
                        }
                    }

                    /* 小屏收起清晰度/倍速，保证弹幕行不换行 */
                    .mobile-no {
                        display: none;
                    }

                    .video-control-barrage input {
                        min-width: 60px;
                    }
                }
            }
        }
    }
</style>