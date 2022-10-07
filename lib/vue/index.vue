<template>
    <div class="xqvideo-box" :style="{'width': videoInfo.width+'px', 'height': videoInfo.height+'px'}">
        <div :class="{'video-info-box': true, 'scale': videoInfo.scale, 'draw': videoInfo.isDraw} ">
            <video ref="video" tabindex="-1" id="myvideo" preload="auto" @click="playVideo"></video>
            <div :class="{'video-loading': true, 'video-loading-text': videoInfo.error}" v-if="videoInfo.loading">
                <p v-if="videoInfo.error">
                    <i class="xqvideo xqvideo-error"></i>
                    <small>视频加载出错！</small>
                    <a href="#refresh">刷新重试！</a>
                </p>
                <p v-else>
                    <span>
                        <i class="xqvideo xqvideo-video"></i>
                    </span>
                </p>
            </div>
            <div class="xqvideo-video-status" v-show="videoInfo.status">
                <i class="xqvideo xqvideo-info-circle"></i><span>{{ videoInfo.statusText }}</span>
            </div>
            <div class="xqvideo-video-info" v-show="videoInfo.aboutUs">
                <i class="xqvideo xqvideo-times" @click="videoInfo.aboutUs = false;"></i>
                <div class="xqvideo-video-intro">
                    <p v-for="(v, k) in videoInfo.about" :key="k">
                        <span>{{k}}：</span>
                        <small>{{v}}</small>
                    </p>
                </div>
            </div>
            <div class="video-info-close" title="关闭画中画" v-show="videoInfo.isDraw" @click="hideDraw">
                <i class="xqvideo xqvideo-times"></i>
            </div>
            <div class="video-info-barrages" v-show="videoInfo.barrage">
                    <ul>
                        <li v-for="item in videoInfo.barrageList" :key="item.id">
                            <img :src="item.avatar" :alt="item.name">
                            <span>{{item.name||'好奇宝宝'}}</span>
                            <small :style="{'color': item.bg}">{{ item.content }}</small>
                        </li>
                    </ul>
                </div>
            <div class="video-control">
                <div ref="progressbar" class="video-control-bar">
                    <span :style="{'width': videoInfo.process+'%'}"></span>
                </div>
                <div class="video-control-btn">
                    <div class="video-control-left">
                        <button class="mobile-play" title="播放" v-show="!videoInfo.play" @click="playVideo">
                            <i class="xqvideo xqvideo-play1"></i>
                        </button>
                        <button class="mobile-play" title="暂停" v-show="videoInfo.play && !videoInfo.hidePause"
                            @click="playVideo">
                            <i class="xqvideo xqvideo-pause"></i>
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
                                <i class="xqvideo xqvideo-dashboard"></i>
                            </button>
                            <div class="video-control-speed" v-show="videoInfo.speed">
                                <span :class="{'active': videoInfo.curSpeed === item.val}" v-for="item in videoInfo.speeds"
                                    :key="item.id" @click="toggleSpeed(item.val)">{{ item.name }}</span>
                            </div>
                        </div>
                        <div class="video-control-alone" @mouseover="showSetBar" @mouseout="hideSetBar">
                            <button title="设置">
                                <i class="xqvideo xqvideo-set"></i>
                            </button>
                            <div class="video-control-set" v-show="videoInfo.set">
                                <p>
                                    小窗播放：
                                    <input class="offscreen" id="draw" type="checkbox" v-model="videoInfo.draw"
                                        @change="toggleSetStatus('draw')">
                                    <label class="switch" for="draw"></label>
                                </p>
                                <p>
                                    循环播放：
                                    <input class="offscreen" id="replay" type="checkbox" v-model="videoInfo.replay"
                                        @change="toggleSetStatus('replay')">
                                    <label class="switch" for="replay"></label>
                                </p>
                            </div>
                        </div>
                        <div class="video-control-alone vol" @mouseover="showVolBar" @mouseout="hideVolBar">
                            <button title="音量" @click="videoMuted">
                                <i class="xqvideo xqvideo-volume" v-show="!videoInfo.muted"></i>
                                <i class="xqvideo xqvideo-muted" v-show="videoInfo.muted"></i>
                            </button>
                            <div class="video-control-volum" v-show="videoInfo.mutedBar">
                                <span ref="volBar">
                                    <small ref="volDot" :style="{'height': videoInfo.vol + '%'}"></small>
                                </span>
                            </div>
                        </div>
                        <button title="全屏" v-show="!videoInfo.scale" @click="fullScreenOpen">
                            <i class="xqvideo xqvideo-fullscreen"></i>
                        </button>
                        <button title="复原" v-show="videoInfo.scale" @click="fullScreenCancel">
                            <i class="xqvideo xqvideo-fullscreen-exit"></i>
                        </button>
                        <button title="视频信息" @click="showAbout">
                            <i class="xqvideo xqvideo-info-circle"></i>
                        </button>
                        <button title="分享" @click="toggleShare">
                            <i class="xqvideo xqvideo-share"></i>
                        </button>
                        <a title="举报" href="https://www.12377.cn/" target="_blank">
                            <i class="xqvideo xqvideo-error"></i>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <xq-share :type="share.type" :show="share.show" :url="share.url" :title="share.title"></xq-share>
    </div>
</template>

<script>
    import xqshare from 'xqshare'
    export default {
        name: 'xqvideo',
        props: {
            'url': {
                type: String,
                required: true,
            },
            'poster': {
                type: String,
                required: true,
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
        },
        data() {
            return {
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
                        version: 'v0.0.1',
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
            '$route.query.type': function (val) {
                this.checkType(val);
            },
            'barrages': function (val) {
                this.videoInfo.barrageList = val;
                this.showBarrage();
            }
        },
        components: {
            'xqshare': xqshare,
        },
        mounted() {
            this.checkType();
            this.setVideo();
            this.videoEvent();
        },
        methods: {
            // 检测类型
            checkType(openType) {
                let type = openType || this.$route.query.type;
                if (type && type == 'iframe') {
                    this.videoInfo.scale = true;
                }
            },
            // 设置信息
            setVideo () {
                let pageAddr = location.origin+location.pathname;
                this.videoInfo.url = this.url;
                this.videoInfo.poster = this.poster;
                this.videoInfo.total = this.total;
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

            // 显示弹幕
            showBarrage () {
                let list = this.videoInfo.barrageList,
                newArr = [];
                if (list && list.length) {
                    for (const item of list) {
                        newArr.push({
                            avatar: item.avatar || '/favicon.ico',
                            name: item.name || '用户'+Math.random(0,1000000)*100,
                            content: item.content,
                            bg: this.randomColor(),
                        }); 
                    }
                    this.videoInfo.barrageList = newArr;
                }
            },
            
            // 随机颜色
            randomColor () {  
                let r = Math.floor(Math.random()*256);
                let g = Math.floor(Math.random()*256);
                let b = Math.floor(Math.random()*256);
                r = r < 120 ? 120 : r;
                g = g < 120 ? 120 : g;
                b = b < 120 ? 120 : b;
                let color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
                return color;
            },

            initVideo ({
                video, type, url, poster 
            }) {
                if (video) {
                    if (type && ['mp4', 'flv', 'm3u8'].includes(type)) {

                        // mp4播放
                        if (type == 'mp4') {
                            video.src = url;
                        }
                        // m3u8格式播放
                        if (type == 'm3u8') {
                            if (Hls.isSupported()) {
                                var hls = new Hls();
                                // bind them together
                                hls.attachMedia(video);
                                hls.on(Hls.Events.MEDIA_ATTACHED, function () {
                                hls.loadSource(url);
                                hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                                        console.log(
                                        'manifest loaded, found ' + data.levels.length + ' quality level'
                                        );
                                    });
                                });
                            } else {
                                console.error('tip: m3u8 video play error!');
                            }
                        }
                        // flv播放
                        if (type == 'flv') {
                            if (flvjs.isSupported()) {
                                var flvPlayer = flvjs.createPlayer({
                                    type: 'flv',
                                    url,
                                });
                                flvPlayer.attachMediaElement(video);
                                flvPlayer.load();
                                flvPlayer.play();
                            } else {
                                console.error('tip: flv video play error!');
                            }
                        }
                    } else {
                        console.error('tip: type error!');
                    }

                    // 设置海报
                    if (poster) {
                        video.setAttribute('poster', poster);
                    }
                } else {
                    console.error('tip: video not null!');
                }
            },

            // 视频加载
            videoEvent() {
                let myVideo = document.getElementById('myvideo');
                let url = this.videoInfo.url;
                let poster = this.videoInfo.poster || '/img/fm1.png';

                this.initVideo({
                    video: myVideo,
                    type: this.videoInfo.mode,
                    url,
                    poster,
                });

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
                    let currentTime = 0;
                    currentTime = myVideo.currentTime;
                    this.videoInfo.process = (currentTime / myVideo.duration) * 100;
                    this.videoInfo.startTime = this.secondToTime(currentTime);
                    this.videoInfo.endTime = this.secondToTime(myVideo.duration);
                    this.videoInfo.about.duration = myVideo.duration;
                }, false);
                myVideo.addEventListener('ended', () => {
                    if (this.videoInfo.replay) {
                        myVideo.play();
                        this.videoInfo.play = true;
                    } else {
                        this.videoInfo.play = false;
                    }
                })
                myVideo.addEventListener('error', function (e) {
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

            // 计算秒数
            secondToTime(second) {  
                let s = 0;
                let m = 0;
                let h = 0;
                let sNum = second % 60;
                let res = '';
                if (second < 3600) {
                    s = sNum;
                    m = parseInt(second / 60);
                    h = 0;
                } else {
                    let mNum = second % 3600;
                    if (mNum % 60 < 60) {
                    s = mNum % 60;
                    m = parseInt(mNum / 60)
                    }
                    m = parseInt(mNum / 60);
                    h = parseInt(second / 3600);
                }
                s = s > 10 ? parseInt(s) : '0' + parseInt(s);
                m = m > 10 ? m : '0' + m;
                h = h > 10 ? h : '0' + h;
                res = h + ':' + m + ':' + s;
                return res;
            },

            // 画中画
            addDraw() {
                window.onscroll = () => {
                    let top = document.documentElement.scrollTop;
                    if (this.videoInfo.draw) {
                        if (top > 800) {
                            this.videoInfo.isDraw = true;
                        }
                        if (top < 199) {
                            this.videoInfo.isDraw = false;
                        }
                    }
                }
            },

            // 隐藏画中画
            hideDraw() {
                this.videoInfo.isDraw = false;
            },

            // 添加歌曲音量控制事件
            addVolEvent() {
                let xqVideo = document.getElementById('myvideo');
                let volBar = this.$refs.volBar;

                // 鼠标按下
                volBar.addEventListener('mousedown', (e) => {
                    
                    let volBox = document.querySelector('.video-control');
                    let num = e.clientY - volBox.offsetTop;
                    let hei = e.target.clientHeight;
                    let vol = num / hei;
                    vol = vol > 1 ? 1 : vol < 0.1 ? 0.01 : vol;
                    let volFin = 1 - vol;
                    this.videoInfo.vol = volFin * 100;
                    xqVideo.volume = volFin;
                    if (volFin <= 0) {
                        this.videoInfo.muted = true;
                    } else {
                        this.videoInfo.muted = false;
                    }

                }, false);

                // 鼠标抬起
                volBar.addEventListener('mouseup', function () {
                    volBar.onmousemove = null;
                }, false);
            },


            // 添加进度条事件
            addProgreeEvent() {
                let progressBar = this.$refs.progressbar;
                let xqvideo = document.getElementById('myvideo');

                // 鼠标按下
                progressBar.addEventListener('mousedown', function (e) {

                    let num = e.offsetX / e.target.clientWidth;
                    num > 1 ? 1 : num < 0.1 ? 0.01 : num;
                    let dotWin = num * 100;
                    let currentTime = num * this.videoInfo.total;
                    this.videoInfo.process = dotWin;
                    this.videoInfo.startTime = parseFloat(currentTime.toFixed(6));
                    xqvideo.currentTime = currentTime;

                }, false);

                // 鼠标抬起
                progressBar.addEventListener('mouseup', function () {
                    progressBar.onmousemove = null;
                }, false);
            },

            // 视频操作
            playVideo() {
                let video = document.getElementById('myvideo');
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
                let video = document.getElementById('myvideo');
                this.videoInfo.muted = !this.videoInfo.muted;
                if (this.videoInfo.muted) {
                    video.muted = true;
                    video.volume = 0;
                    this.videoInfo.vol = 0;
                } else {
                    video.muted = false;
                    video.volume = 1;
                    this.videoInfo.vol = 100;
                }
            },

            // fullscreen set
            fullScreenOpen() {
                let docElm = document.documentElement ||
                document.documentElement.body;
                if (docElm.requestFullscreen) {
                    docElm.requestFullscreen();
                } else if (docElm.msRequestFullscreen) {
                    docElm.msRequestFullscreen();
                } else if (docElm.mozRequestFullScreen) {
                    docElm.mozRequestFullScreen();
                } else if (docElm.webkitRequestFullScreen) {
                    docElm.webkitRequestFullScreen();
                }
                this.videoInfo.scale = true;
                document.body.className = 'hide';
            },

            fullScreenCancel() {
                let docElm = document.documentElement;
                if (docElm.exitFullscreen) {
                    docElm.exitFullscreen();
                } else if (docElm.msExitFullscreen) {
                    docElm.msExitFullscreen();
                } else if (docElm.mozCancelFullScreen) {
                    docElm.mozCancelFullScreen();
                } else if (docElm.webkitCancelFullScreen) {
                    docElm.webkitCancelFullScreen();
                }
                this.videoInfo.scale = false;
                document.body.className = '';
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
                let myVideo = document.getElementById('myvideo');
                this.videoInfo.curSpeed = val;
                myVideo.playbackRate = val;
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
                this.videoInfo.status = true;
                this.videoInfo.statusText = val;
                setTimeout(() => {
                    this.videoInfo.status = false;
                    this.videoInfo.statusText = '';
                }, 1000);
            },
        },
    }
</script>

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
                }

                .video-control-barrage {
                    position: relative;
                    display: inline-block;
                    padding-left: 30px;
                    padding-right: 10px;
                    width: auto;
                    height: 25px;
                    font-size: 13px;
                    .switch {
                        display: inline-block;
                        padding: 4px;
                        width: 15px;
                        height: 15px;
                        line-height: 15px;
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
                        margin-left: 10px;
                        padding-left: 10px;
                        width: 200px;
                        height: 25px;
                        background: fadeout(@white, 80);
                        color: @white;
                        &::placeholder {
                            color: fadeout(@white, 20);
                        }
                    }
                    .send {
                        width: 50px;
                        height: 25px;
                        line-height: 20px;
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

                    button,
                    a {
                        display: inline-block;
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
                    }

                    .video-control-alone {
                        display: inline-block;
                    }

                    .video-control-speed {
                        position: absolute;
                        bottom: 45px;
                        right: 200px;
                        box-sizing: border-box;
                        padding: 10px;
                        width: 70px;
                        height: auto;
                        background: fadeout(@black, 39);
                        border-radius: 5px;
                        font-size: 14px;
                        line-height: 1.8;
                        text-align: center;
                        z-index: 2;

                        span {
                            cursor: pointer;

                            &.active {
                                color: @mainColor;
                            }

                            &:hover {
                                color: @mainColor;
                            }
                        }

                        &.qua {
                            right: 245px;
                        }
                    }

                    .video-control-set {
                        position: absolute;
                        bottom: 45px;
                        right: 145px;
                        box-sizing: border-box;
                        padding: 10px;
                        width: auto;
                        height: auto;
                        background: fadeout(@black, 39);
                        color: @white;
                        font-size: 12px;
                        border-radius: 5px;
                        z-index: 2;

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
                        right: 150px;
                        bottom: 40px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 30px;
                        height: 100px;
                        background: fadeout(@black, 30);
                        border-radius: 5px;

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
        .video-info {
            padding: 0;
            border-top: 1px solid @c;
            flex-direction: column;

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
                }
            }
        }
    }
</style>