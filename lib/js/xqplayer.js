(function (root, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory());
    } else if (typeof define === 'function' && define.cmd) {
        define(function (require, exports, module) {  
            module.exports = factory();
        });
    } else {
        root.XQVideoPlayer = factory();
    }
})(this, function factory () {
    /**
     * 
     * @param {el}, element selector 
     * @param {url}, video url 
     * @param {poster}, video poster 
     * @param {barrages}, video barrage list 
     * @param {mode}, video  play mode (mp4/flv/m3u8) 
     * @param {width}, video box width 
     * @param {height}, video box height 
     */

    function XQVideoPlayer (option) {
        let defaultOptions = {
            el: '',
            url: '',
            poster: '',
            barrages: [],
            mode: 'm3u8',
            width: 1200,
            height: 600,
        }
        let options = {...defaultOptions, ...option};
        if (!Object.keys(options).length) {
            throw new Error('Options is must!');
        }
        for (const key in options) {
        if (!options[key]) {
                throw new Error(key + ' is must!');
        }
        }
        this.options = options;
        this.video = {
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
        };
        this.video.barrageList = this.options.barrages;
        this.initElem();
        this.initVideo();
        this.initEvent();
    }

    XQVideoPlayer.prototype.initElem = function () {  
        let container = this.dom(this.options.el);
        let videoBox = document.createElement('div');
        videoBox.className = 'xqvideo';
        videoBox.innerHTML = `<div class="xqvideo-box" style="width: ${this.options.width+'px'}; height: ${this.options.height+'px'}">
            <div class="video-info-box">
                <video tabindex="-1" id="myvideo" preload="auto"></video>
                <div class="video-loading">
                    <p>
                        <span>
                            <i class="xvicon xvicon-video"></i>
                        </span>
                    </p>
                </div>
                <div class="video-loading video-error hide">
                    <p>
                        <i class="xvicon xvicon-error"></i>
                        <small>视频加载出错！</small>
                        <a href="">刷新重试！</a>
                    </p>
                </div>
                <div class="xqvideo-video-status hide">
                    <i class="xvicon xvicon-info-circle"></i><span id="statusText"></span>
                </div>
                <div class="xqvideo-video-info">
                    <i class="xvicon xvicon-times"></i>
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
                            <small>${location.origin+location.pathname}</small>
                        </p>
                        <p>
                            <span>Type：</span>
                            <small>${this.options.mode}</small>
                        </p>
                    </div>
                </div>
                <div class="video-info-close hide" title="关闭画中画">
                    <i class="xvicon xvicon-times"></i>
                </div>
                <div class="video-info-barrages">
                        <ul></ul>
                    </div>
                <div class="video-control">
                    <div id="progressbar" class="video-control-bar">
                        <span id="progress-dot" style="width: ${this.video.process};"></span>
                    </div>
                    <div class="video-control-btn">
                        <div class="video-control-left">
                            <button id="play-btn" class="mobile-play show" title="播放">
                                <i class="xvicon xvicon-play1"></i>
                            </button>
                            <button id="pause-btn" class="mobile-play hide" title="暂停">
                                <i class="xvicon xvicon-pause"></i>
                            </button>
                            <span id="startTime">00:00</span><span>/</span><span id="endTime">00:00</span>
                        </div>
                        <div class="video-control-right">
                            <div class="video-control-barrage">
                                <span id="video-open-barrage" class="switch">弹</span>
                                <input id="video-barrage-content" type="text" disabled placeholder="随便说点吧~" maxlength="16">
                                <button id="video-barrage-send" class="send" disabled>发送</button>
                            </div>
                            <div class="video-control-alone video-qua mobile-no">
                                <button class="quality">标清</button>
                                <div class="video-control-speed qua hide">
                                    <span class="active">标清</span>
                                </div>
                            </div>
                            <div class="video-control-alone video-speed mobile-no">
                                <button title="倍速">
                                    <i class="xvicon xvicon-dashboard"></i>
                                </button>
                                <div class="video-control-speed spe hide">
                                    <span data-id="2">2倍</span>
                                    <span data-id="1.5">1.5倍</span>
                                    <span data-id="1.25">1.25倍</span>
                                    <span data-id="1">1.0倍</span>
                                    <span data-id="0.75">0.75倍</span>
                                </div>
                            </div>
                            <div class="video-control-alone video-set">
                                <button title="设置">
                                    <i class="xvicon xvicon-set"></i>
                                </button>
                                <div class="video-control-set hide">
                                    <p>
                                        小窗播放：
                                        <input class="offscreen" id="draw" type="checkbox">
                                        <label class="switch" for="draw"></label>
                                    </p>
                                    <p>
                                        循环播放：
                                        <input class="offscreen" id="replay" type="checkbox">
                                        <label class="switch" for="replay"></label>
                                    </p>
                                </div>
                            </div>
                            <div class="video-control-alone vol video-vol">
                                <button title="音量">
                                    <i class="xvicon xvicon-volume"></i>
                                    <i class="xvicon xvicon-muted hide"></i>
                                </button>
                                <div class="video-control-volum hide">
                                    <span id="volBar">
                                        <small id="volDot" style="height: ${this.video.vol}%;"></small>
                                    </span>
                                </div>
                            </div>
                            <button title="全屏" class="full-btn">
                                <i class="xvicon xvicon-fullscreen"></i>
                            </button>
                            <button title="复原" class="cancel-btn hide">
                                <i class="xvicon xvicon-fullscreen-exit"></i>
                            </button>
                            <button title="视频信息" id="info-btn">
                                <i class="xvicon xvicon-info-circle"></i>
                            </button>
                            <button title="分享" id="share-btn">
                                <i class="xvicon xvicon-share"></i>
                            </button>
                            <a title="举报" href="https://www.12377.cn/" target="_blank">
                                <i class="xvicon xvicon-error"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div id="popShare"></div>
        </div>`;
        container.appendChild(videoBox);
    }

    // 获取id
    XQVideoPlayer.prototype.gid = function (id) {  
        return document.getElementById(id);
    }

    // 获取单个dom
    XQVideoPlayer.prototype.dom = function (select) {  
        return document.querySelector(select);
    }

    // 获取多个dom
    XQVideoPlayer.prototype.domAll = function (select) {  
        return document.querySelectorAll(select);
    }

    // 加载视频
    XQVideoPlayer.prototype.loadVideo = function ({
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
    }

    // 初始化视频
    XQVideoPlayer.prototype.initVideo = function () {  
        let myVideo = this.gid('myvideo');
        let loading = this.dom('.video-loading');
        let url = this.options.url;
        let poster = this.options.poster;
        let startTime = this.gid('startTime');
        let endTime = this.gid('endTime');
        let error = this.dom('.video-error');
        let progressDot = this.gid('progress-dot');
        let pauseBtn = this.gid('pause-btn');
        let playBtn = this.gid('play-btn');
        let videoBox = this.dom('.video-info-box');

        this.loadVideo({
            video: myVideo,
            type: this.options.mode,
            url,
            poster,
        });

        // 禁止右键菜单
        myVideo.oncontextmenu = function (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // 移入显示
        videoBox.addEventListener('mouseover', () => {
            this.toggleControl(true);
        }, false);
        videoBox.addEventListener('mouseout', () => {
            this.toggleControl(false);
        }, false);

        // 加载开始
        myVideo.addEventListener('loadstart', function () {  
            loading.classList.add('hide');
        });

        // 时间更新
        myVideo.addEventListener('timeupdate', () => {
            let currentTime = 0;
            currentTime = myVideo.currentTime;
            this.video.process = (currentTime / myVideo.duration) * 100;
            startTime.innerText = this.secondToTime(currentTime);
            endTime.innerText = this.secondToTime(myVideo.duration);
            progressDot.style.width = this.video.process + '%';
        }, false);

        // 发生错误
        myVideo.addEventListener('error', function (e) {
            error.classList.remove('hide');
        });

        // 点击播放
        myVideo.addEventListener('click', () => {
            this.playVideo();
        },false);

        // 监听结束
        myVideo.addEventListener('ended', () => {
            if (this.video.replay) {
                myVideo.play();
                this.video.play = true;
            } else {
                this.video.play = false;
                playBtn.classList.add('show');
                pauseBtn.classList.add('hide');
            }
        }, false);

        // 添加画中画
        this.addDraw();

        // 添加音量控制
        this.addVol();

        // 添加进度条控制
        this.addProgree();

        // 显示弹幕
        this.showBarrage();

    }

    // 控制条
    XQVideoPlayer.prototype.toggleControl = function (type) {  
        let videoControl = this.dom('.video-control');
        if (type) {
            videoControl.classList.remove('hide');
        } else {
            videoControl.classList.add('hide');
        }
    }

    // 画中画
    XQVideoPlayer.prototype.addDraw = function () {
        window.onscroll = () => {
            let top = document.documentElement.scrollTop;
            let videoBox = this.dom('.video-info-box');
            let closeBtn = this.dom('.video-info-close');
            if (this.video.draw) {
                if (top > 800) {
                    this.video.isDraw = true;
                    videoBox.classList.add('draw');
                    closeBtn.classList.remove('hide');
                }
                if (top < 199) {
                    this.video.isDraw = false;
                    videoBox.classList.remove('draw');
                    closeBtn.classList.add('hide');
                }
            }
        }
    }

    // 添加歌曲音量控制事件
    XQVideoPlayer.prototype.addVol = function () {
        let xqVideo = this.gid('myvideo');
        let volBar = this.gid('volBar');
        let volDot = this.gid('volDot');

        // 鼠标按下
        volBar.addEventListener('mousedown', (e) => {
            
            let volBox = this.dom('.video-control');
            let num = e.clientY - volBox.offsetTop - 30;
            let hei = e.target.clientHeight;
            let vol = num / hei;
            vol = vol > 1 ? 1 : vol < 0.1 ? 0.01 : vol;
            let volFin = 1 - vol;
            this.video.vol = volFin * 100;
            volDot.style.height = this.video.vol + '%';
            xqVideo.volume = volFin;
            if (volFin <= 0) {
                this.video.muted = true;
            } else {
                this.video.muted = false;
            }

        }, false);

        // 鼠标抬起
        volBar.addEventListener('mouseup', function () {
            volBar.onmousemove = null;
        }, false);
    },

    // 添加进度条事件
    XQVideoPlayer.prototype.addProgree = function () {
        let progressBar = this.gid('progressbar');
        let myVideo = this.gid('myvideo');
        let startTime = this.gid('startTime');
        let dotBox = this.gid('progress-dot');

        // 鼠标按下
        progressBar.addEventListener('mousedown', function (e) {

            let num = e.offsetX / e.target.clientWidth;
            num > 1 ? 1 : num < 0.1 ? 0.01 : num;
            let dotWin = num * 100;
            let currentTime = num * myVideo.duration;
            dotBox.style.width = dotWin + '%';
            startTime.innerText = parseFloat(currentTime.toFixed(6));
            myVideo.currentTime = currentTime;

        }, false);

        // 鼠标抬起
        progressBar.addEventListener('mouseup', function () {
            progressBar.onmousemove = null;
        }, false);
    }

    // 静音
    XQVideoPlayer.prototype.videoMuted = function () {
        let myVideo = this.gid('myvideo');
        let volumBox = this.dom('.xvicon-volume');
        let mutedBox = this.dom('.xvicon-muted');
        let volDot = this.gid('volDot');
        this.video.muted = !this.video.muted;
        if (this.video.muted) {
            myVideo.muted = true;
            myVideo.volume = 0;
            this.video.vol = 0;
            volDot.style.height = 0;
            volumBox.classList.add('hide');
            mutedBox.classList.remove('hide');
        } else {
            myVideo.muted = false;
            myVideo.volume = 1;
            this.video.vol = 100;
            volDot.style.height = '100%';
            volumBox.classList.remove('hide');
            mutedBox.classList.add('hide');
        }
    },

    // 计算秒数
    XQVideoPlayer.prototype.secondToTime = function (second) {  
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
    }


    // 初始化事件
    XQVideoPlayer.prototype.initEvent = function () {  
        // 信息
        let infoBtn = this.gid('info-btn');
        let infoClose = this.dom('.xvicon-times');
        let playBtn = this.gid('play-btn');
        let pauseBtn = this.gid('pause-btn');
        let qualityBtn = this.dom('.video-qua');
        let speedBtn = this.dom('.video-speed');
        let speLs = this.domAll('.spe span');
        let setBtn = this.dom('.video-set');
        let volBtn = this.dom('.video-vol');
        let volumeBtn = this.dom('.xvicon-volume');
        let mutedBtn = this.dom('.xvicon-muted');
        let drawBtn = this.gid('draw');
        let replayBtn = this.gid('replay');
        let fullBtn = this.dom('.full-btn');
        let fullCancelBtn = this.dom('.cancel-btn');
        let closeBtn = this.dom('.video-info-close');
        let videoBtn = this.dom('.video-info-box');
        let shareBtn = this.gid('share-btn');
        let openBarrage = this.gid('video-open-barrage');
        let barrageLs = this.dom('.video-info-barrages');
        let barrageContent = this.gid('video-barrage-content');
        let barrageSend = this.gid('video-barrage-send');

        // 信息切换
        infoBtn.addEventListener('click', () => {
            this.toggleInfo(true);
        }, false);
        infoClose.addEventListener('click', () => {
            this.toggleInfo(false);
        }, false);

        // 播放视频
        playBtn.addEventListener('click', () => {
            this.playVideo();
        });

        pauseBtn.addEventListener('click', () => {
            this.playVideo();
        });

        // 清晰度
        qualityBtn.addEventListener('mouseover', () => {
            this.toggleQualBar(true);
        });
        
        qualityBtn.addEventListener('mouseout', () => {
            this.toggleQualBar(false);
        });

        // 倍速
        speedBtn.addEventListener('mouseover', () => {
            this.toggleSpeed(true);
        });
        
        speedBtn.addEventListener('mouseout', () => {
            this.toggleSpeed(false);
        });

        for (let i = 0; i < speLs.length; i++) {
            const item = speLs[i];
            item.addEventListener('click', (e) => {
                let id = e.target.dataset.id;
                this.setSpeed(id);
            }, false);
        }

        this.showSpeedAct();

        // 设置
        setBtn.addEventListener('mouseover', () => {
            this.toggleSet(true);
        });
        
        setBtn.addEventListener('mouseout', () => {
            this.toggleSet(false);
        });

        drawBtn.addEventListener('change', (e) => {
            let value = e.target.checked;
            this.video.draw = value;
            this.setPlayType('draw', value);
        });

        replayBtn.addEventListener('change', (e) => {
            let value = e.target.checked;
            this.video.replay = value;
            this.setPlayType('replay', value);
        });

        // 音量
        volBtn.addEventListener('mouseover', () => {
            this.toggleVol(true);
        });
        
        volBtn.addEventListener('mouseout', () => {
            this.toggleVol(false);
        });

        volumeBtn.addEventListener('click', () => {
            this.videoMuted();
        });

        mutedBtn.addEventListener('click', () => {
            this.videoMuted();
        });

        // 全屏设置
        fullBtn.addEventListener('click', () => {
            this.fullScreenOpen();
            fullBtn.classList.add('hide');
            fullCancelBtn.classList.remove('hide');
        });
        
        fullCancelBtn.addEventListener('click', () => {
            this.fullScreenCancel();
            fullBtn.classList.remove('hide');
            fullCancelBtn.classList.add('hide');
        });
        
        // 关闭画中画
        closeBtn.addEventListener('click', () => {
            videoBtn.classList.remove('draw');
            closeBtn.classList.add('hide');
            document.documentElement.scrollTop = 0;
        });

        // 分享按钮
        shareBtn.addEventListener('click', () => {
            // 2.pop mode
            let popShare = new XqShare({
                el: '#popShare',
                type: 'pop',
            });
            popShare.show();
        });

        // 开启弹幕
        openBarrage.addEventListener('click', () => {
            this.video.barrage = !this.video.barrage;
            if (this.video.barrage) {
                barrageLs.classList.add('show');
                openBarrage.classList.add('active');
                barrageContent.removeAttribute('disabled');
                barrageSend.removeAttribute('disabled');
                // 显示弹幕
                this.showBarrage();
            } else {
                barrageLs.classList.remove('show');
                openBarrage.classList.remove('active');
                barrageContent.setAttribute('disabled');
                barrageSend.setAttribute('disabled');
            }
            
        }, false);

        // 发送弹幕
        barrageContent.addEventListener('keydown', (e) => {
            let value = barrageContent.value;
            if (!value) {
                return this.setStatus('请输入弹幕内容！');
            }
            this.video.barrageContent = value;
            if (e.key === 'Enter') {
                this.video.barrageList.push({
                    avatar: '',
                    name: '用户'+ parseInt(Math.random(0,1000000)*100),
                    content: this.video.barrageContent,
                    bg: this.randomColor(),
                });
                barrageContent.value = '';
                this.showBarrage();
            }
        }, false);

        barrageSend.addEventListener('click', () => {
            let value = barrageContent.value;
            if (!value) {
                return this.setStatus('请输入弹幕内容！');
            }
            this.video.barrageContent = value;
            this.video.barrageList.push({
                avatar: '',
                name: '用户'+parseInt(Math.random(0,1000000)*100),
                content: this.video.barrageContent,
                bg: this.randomColor(),
            });
            barrageContent.value = '';
            this.showBarrage();
        }, false);
        
    }

    // 显示弹幕
    XQVideoPlayer.prototype.showBarrage = function () {
        let list = this.video.barrageList,
        newArr = [],
        strs = '',
        barrageBox = this.dom('.video-info-barrages ul');
        if (list && list.length) {
            for (const item of list) {
                newArr.push({
                    avatar: item.avatar,
                    name: item.name || '用户'+parseInt(Math.random(0,1000000)*100),
                    content: item.content,
                    bg: this.randomColor(),
                });
            }
            this.video.barrageList = newArr;
            for (const item of this.video.barrageList) {
                strs += `
                    <li>
                        <img src="${item.avatar}">
                        <span>${item.name}</span>
                        <small style="color: ${item.bg};">${item.content}</small>
                    </li>
                `;
            }
            barrageBox.innerHTML = strs;
        }
    }

    // 随机颜色
    XQVideoPlayer.prototype.randomColor = function () {  
        let r = Math.floor(Math.random()*256);
        let g = Math.floor(Math.random()*256);
        let b = Math.floor(Math.random()*256);
        r = r < 120 ? 120 : r;
        g = g < 120 ? 120 : g;
        b = b < 120 ? 120 : b;
        let color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
        return color;
    }

    // 切换信息
    XQVideoPlayer.prototype.toggleInfo = function (type) {
        let infoBox = this.dom('.xqvideo-video-info');
        if (type) {
            infoBox.classList.add('show');
        } else {
            infoBox.classList.remove('show');
        }
    }

    // 视频操作
    XQVideoPlayer.prototype.playVideo = function () {
        let video = this.gid('myvideo');
        let pauseBtn = this.gid('pause-btn');
        let playBtn = this.gid('play-btn');
        this.video.play = !this.video.play;
        let isMobile = 'ontouchstart' in document;
        if (this.video.play) {
            video.play();
            playBtn.classList.remove('show');
            pauseBtn.classList.remove('hide');
        } else {
            video.pause();
            playBtn.classList.add('show');
            pauseBtn.classList.add('hide');
        }
        if (isMobile) {
            pauseBtn.classList.add('hide');
        }
    }

    // 切换清晰度
    XQVideoPlayer.prototype.toggleQualBar = function (type) {
        let quaBox = this.dom('.qua');
        if (type) {
            quaBox.classList.remove('hide');
        } else {
            quaBox.classList.add('hide');
        }
    }

    // 切换倍速
    XQVideoPlayer.prototype.toggleSpeed = function (type) {
        let speedBox = this.dom('.spe');
        if (type) {
            speedBox.classList.remove('hide');
        } else {
            speedBox.classList.add('hide');
        }
    }

    // 切换设置
    XQVideoPlayer.prototype.toggleSet = function (type) {
        let speedBox = this.dom('.video-control-set');
        if (type) {
            speedBox.classList.remove('hide');
        } else {
            speedBox.classList.add('hide');
        }
    }

    // 切换音量
    XQVideoPlayer.prototype.toggleVol = function (type) {
        let speedBox = this.dom('.video-control-volum');
        if (type) {
            speedBox.classList.remove('hide');
        } else {
            speedBox.classList.add('hide');
        }
    }

    // 设置速度
    XQVideoPlayer.prototype.setSpeed = function (val) {
        let myVideo = document.getElementById('myvideo');
        this.video.curSpeed = val;
        myVideo.playbackRate = val;
        this.showSpeedAct();
        this.setStatus(`已切换到${val}倍速！`);
    }

    // 显示当前速度
    XQVideoPlayer.prototype.showSpeedAct = function () {  
        let speLs = this.domAll('.spe span');
        for (const item of speLs) {
            if (item.getAttribute('data-id') == this.video.curSpeed) {
                item.className = 'active';
            } else {
                item.className = '';
            }
        }
    }

    // 设置状态
    XQVideoPlayer.prototype.setStatus = function (val) {
        let statusBox = this.dom('.xqvideo-video-status');
        let statusText = this.gid('statusText');
        this.video.status = true;
        statusBox.classList.remove('hide');
        statusText.innerText = val;
        setTimeout(() => {
            this.video.status = false;
            statusBox.classList.add('hide');
            statusText.innerText = '';
        }, 1000);
    }

    // 设置播放类型
    XQVideoPlayer.prototype.setPlayType = function (type, value) {
        let text = type == 'draw' ? '小窗播放' : '循环播放';
        let val = value ? '已开启' : '已关闭';
        this.video[type] = value;
        this.setStatus(`${text}${val}`);
    }

    // 设置全屏
    XQVideoPlayer.prototype.fullScreenOpen = function () {
        let xqvideoBox = this.dom('.video-info-box');
        this.video.scale = true;
        xqvideoBox.classList.add('scale');
    }

    // 取消全屏
    XQVideoPlayer.prototype.fullScreenCancel = function () {
        let xqvideoBox = this.dom('.video-info-box');
        this.video.scale = false;
        xqvideoBox.classList.remove('scale');
    }
    return XQVideoPlayer;
});