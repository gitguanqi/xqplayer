var dt=(()=>{var x=Object.defineProperty,j=Object.getOwnPropertyDescriptor,B=Object.getOwnPropertyNames,H=Object.prototype.hasOwnProperty,R=(t,e)=>{for(var o in e)x(t,o,{get:e[o],enumerable:!0})},W=(t,e,o,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let s of B(e))!H.call(t,s)&&s!==o&&x(t,s,{get:()=>e[s],enumerable:!(i=j(e,s))||i.enumerable});return t},X=t=>W(x({},"__esModule",{value:!0}),t),T={};R(T,{VERSION:()=>h,XQVideoPlayer:()=>n,default:()=>ct,useShare:()=>V});var h="0.1.0",C=["mp4","m3u8","flv"],P={el:"",url:"",poster:"",barrages:[],mode:"mp4",width:1200,height:600,title:"",share:null},d="[xqplayer]",Q=/-([a-z])/g;function D(t){return String(t).replace(Q,function(e,o){return o.toUpperCase()})}function $(t){const e=Object.create(null);if(!t||typeof t.querySelectorAll!="function")return e;const o=t.querySelectorAll("[data-xq]");for(let i=0;i<o.length;i+=1){const s=o[i],r=s.getAttribute("data-xq");r&&!(D(r)in e)&&(e[D(r)]=s)}return e}function a(t,e,o,i,s){return!e||typeof e.addEventListener!="function"||(e.addEventListener(o,i,s),t.push({target:e,type:o,handler:i,options:s})),i}function F(t){for(;t.length;){const e=t.pop();e.target&&typeof e.target.removeEventListener=="function"&&e.target.removeEventListener(e.type,e.handler,e.options)}}function v(t,e,o){const i=Number(t);return!Number.isFinite(i)||i<e?e:i>o?o:i}function c(t,e,o){if(!(!t||!t.classList)){if(typeof o=="undefined"){t.classList.toggle(e);return}o?t.classList.add(e):t.classList.remove(e)}}function f(t,e){t&&(t.textContent=e==null?"":String(e))}function w(t){return String(t==null?"":t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function y(t){let e=Number(t);(!Number.isFinite(e)||e<0)&&(e=0),e=Math.floor(e);const o=Math.floor(e/3600),i=Math.floor(e%3600/60),s=e%60;return _(o)+":"+_(i)+":"+_(s)}function _(t){return t<10?"0"+t:String(t)}function A(){return"#"+q(S())+q(S())+q(S())}function S(){const t=Math.floor(Math.random()*256);return t<120?120:t}function q(t){return t.toString(16).padStart(2,"0")}function U(){return"用户"+Math.floor(Math.random()*100)}function z(t){const e=Array.isArray(t)?t:[],o=[];for(let i=0;i<e.length;i+=1){const s=e[i];!s||typeof s!="object"||o.push(O(s))}return o}function O(t){return{id:t.id,avatar:typeof t.avatar=="string"?t.avatar:"",name:t.name?String(t.name):U(),content:t.content==null?"":String(t.content),bg:t.bg||A()}}function Y(t,e,o){if(e){for(;e.firstChild;)e.removeChild(e.firstChild);for(let i=0;i<o.length;i+=1)e.appendChild(G(t,o[i]))}}function G(t,e){const o=t.createElement("li");if(e.avatar){const r=t.createElement("img");r.setAttribute("src",e.avatar),r.setAttribute("alt",e.name),o.appendChild(r)}const i=t.createElement("span");i.textContent=e.name,o.appendChild(i);const s=t.createElement("small");return s.style.color=e.bg,s.textContent=e.content,o.appendChild(s),o}function J(t){const e=t.uid,o=Number(t.width)||1200,i=Number(t.height)||600,s=w(t.mode),r=w(t.pageUrl),l=w(t.version);return`<div class="xqvideo-box${o<520?" xq-compact":o<680?" xq-narrow":""}" style="width: ${o}px; height: ${i}px">
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
                            <small>${r}</small>
                        </p>
                        <p>
                            <span>Type：</span>
                            <small>${s}</small>
                        </p>
                        <p>
                            <span>Version：</span>
                            <small>${l}</small>
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
                                        <input class="offscreen" id="${e}-draw" data-xq="opt-draw" type="checkbox">
                                        <label class="switch" for="${e}-draw"></label>
                                    </p>
                                    <p>
                                        循环播放：
                                        <input class="offscreen" id="${e}-loop" data-xq="opt-loop" type="checkbox">
                                        <label class="switch" for="${e}-loop"></label>
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
                                        <small data-xq="vol-dot" style="height: ${Number(t.vol)||100}%;"></small>
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
            <div id="${e}-share-pop" data-xq="share-pop"></div>
        </div>`}function k(){return typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof self!="undefined"?self:{}}var p={kind:"none",destroy:function(){}};function K(t){const e=t.video,o=t.type,i=t.url,s=t.poster,r=typeof t.warn=="function"?t.warn:function(){},l=typeof t.fail=="function"?t.fail:function(){};return e?(s&&e.setAttribute("poster",s),!o||C.indexOf(o)===-1?(r("不支持的视频类型："+o),l("不支持的视频类型："+o),p):o==="mp4"?(e.setAttribute("src",i),{kind:"mp4",destroy:function(){}}):o==="m3u8"?Z(e,i,r,l):tt(e,i,r,l)):(r("video 元素不存在，无法加载视频源"),p)}function Z(t,e,o,i){const r=k().Hls;if(!r||typeof r.isSupported!="function")return o("未检测到 hls.js，m3u8 无法播放；请自行引入 hls.js"),i("需要引入 hls.js 才能播放 m3u8"),p;if(!r.isSupported())return o("当前环境不支持 hls.js 播放"),i("当前环境不支持 m3u8 播放"),p;const l=new r,u=r.Events||{};l.attachMedia(t),u.MEDIA_ATTACHED?l.on(u.MEDIA_ATTACHED,function(){l.loadSource(e),u.MANIFEST_PARSED&&l.on(u.MANIFEST_PARSED,function(L,E){const ut=E&&E.levels?E.levels.length:0;console.log(d+" m3u8 manifest loaded, "+ut+" quality level(s)")})}):l.loadSource(e);let g=!1;return{kind:"m3u8",destroy:function(){if(!g){g=!0;try{l.destroy()}catch(L){}}}}}function tt(t,e,o,i){const r=k().flvjs;if(!r||typeof r.isSupported!="function")return o("未检测到 flv.js，flv 无法播放；请自行引入 flv.js"),i("需要引入 flv.js 才能播放 flv"),p;if(!r.isSupported())return o("当前环境不支持 flv.js 播放"),i("当前环境不支持 flv 播放"),p;const l=r.createPlayer({type:"flv",url:e});l.attachMediaElement(t),l.load();const u=l.play();u&&typeof u.catch=="function"&&u.catch(function(){});let g=!1;return{kind:"flv",destroy:function(){if(!g){g=!0;try{l.destroy()}catch(L){}}}}}var m=null;function N(){return typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:{}}function et(t){const e=t&&t.share;if(typeof e=="function")return e;if(typeof m=="function")return m;const o=N().XqShare;return typeof o=="function"?o:null}function V(t){return m=typeof t=="function"?t:null,m}function ot(t){const e=t||{},o=et(e);if(!o)return null;const i=N();let s=e.url,r=e.title;!s&&i.document&&i.document.location&&(s=i.document.location.href),!r&&i.document&&(r=i.document.title||"");let l=null;try{l=new o({el:e.selector,type:e.type||"pop",url:s,title:r})}catch(u){return null}return l&&typeof l.show=="function"&&e.open!==!1&&l.show(),l}var it=0,nt={myvideo:"video",progressbar:"progress","progress-dot":"progressDot","play-btn":"play","pause-btn":"pause",startTime:"current",endTime:"duration",statusText:"statusText","video-open-barrage":"barrageToggle","video-barrage-content":"barrageInput","video-barrage-send":"barrageSend",draw:"optDraw",replay:"optLoop",volBar:"volBar",volDot:"volDot","info-btn":"infoToggle","share-btn":"share",popShare:"sharePop"};function n(t){if(!(this instanceof n))return new n(t);const e=rt(t);this.uid="xq-"+(it+=1),this.options=e,this.container=st(e.el),this.root=null,this.refs=Object.create(null),this._listeners=[],this._statusTimer=0,this._mediaHandle=null,this._share=null,this._destroyed=!1,this._warned=Object.create(null),this.video=at(e),this.initElem(),this.initVideo(),this.initEvent()}n.prototype.initElem=function(){const t=typeof location!="undefined"&&location?location.origin+location.pathname:"";this.video.about.url=t,this.video.about.type=this.options.mode,this.video.about.version=h;const e=document.createElement("div");e.className="xqvideo",e.innerHTML=J({uid:this.uid,width:this.options.width,height:this.options.height,mode:this.options.mode,pageUrl:t,version:h,vol:this.video.vol}),this.container.appendChild(e),this.root=e,this.refs=$(e)},n.prototype.initVideo=function(){const t=this.refs.video;t&&(this.bindMediaEvents(t),this.loadVideo({video:t,type:this.options.mode,url:this.options.url,poster:this.options.poster}),this.addDraw(),this.addVol(),this.addProgree(),this.showBarrage(),this.syncProgressDom())},n.prototype.bindMediaEvents=function(t){const e=this._listeners,o=this;a(e,t,"loadstart",function(){o.setLoading(!1)}),a(e,t,"loadedmetadata",function(){o.syncTimeDom()}),a(e,t,"canplay",function(){o.setLoading(!1),o.clearError()}),a(e,t,"playing",function(){o.setLoading(!1),o.clearError(),o.syncPlayState()}),a(e,t,"timeupdate",function(){o.syncTimeDom()}),a(e,t,"play",function(){o.syncPlayState()}),a(e,t,"pause",function(){o.syncPlayState()}),a(e,t,"ended",function(){o.handleEnded()}),a(e,t,"error",function(){o.setError(o.describeMediaError(t))}),a(e,t,"click",function(){o.playVideo()}),a(e,t,"contextmenu",function(i){i.preventDefault(),i.stopPropagation()})},n.prototype.initEvent=function(){const t=this._listeners,e=this.refs,o=this;e.play&&a(t,e.play,"click",function(){o.playVideo()}),e.pause&&a(t,e.pause,"click",function(){o.playVideo()}),e.infoToggle&&a(t,e.infoToggle,"click",function(){o.toggleInfo(!0)}),e.infoClose&&a(t,e.infoClose,"click",function(){o.toggleInfo(!1)}),e.retry&&a(t,e.retry,"click",function(){o.reload()}),e.fullscreen&&a(t,e.fullscreen,"click",function(){o.fullScreenOpen()}),e.fullscreenExit&&a(t,e.fullscreenExit,"click",function(){o.fullScreenCancel()}),e.drawClose&&a(t,e.drawClose,"click",function(){o.hideDraw()}),e.mute&&a(t,e.mute,"click",function(){o.videoMuted()}),e.share&&a(t,e.share,"click",function(){o.shareVideo()}),e.box&&(a(t,e.box,"mouseenter",function(){o.toggleControl(!0)}),a(t,e.box,"mouseleave",function(){o.toggleControl(!1)})),e.quaWrap&&(a(t,e.quaWrap,"mouseenter",function(){o.toggleQualBar(!0)}),a(t,e.quaWrap,"mouseleave",function(){o.toggleQualBar(!1)})),e.speedWrap&&(a(t,e.speedWrap,"mouseenter",function(){o.toggleSpeed(!0)}),a(t,e.speedWrap,"mouseleave",function(){o.toggleSpeed(!1)}));const i=this.qa(".spe span");for(let s=0;s<i.length;s+=1)a(t,i[s],"click",function(r){const l=r.currentTarget||r.target;l&&l.getAttribute&&o.setSpeed(l.getAttribute("data-id"))});this.showSpeedAct(),e.setWrap&&(a(t,e.setWrap,"mouseenter",function(){o.toggleSet(!0)}),a(t,e.setWrap,"mouseleave",function(){o.toggleSet(!1)})),e.optDraw&&a(t,e.optDraw,"change",function(s){const r=!!(s.target&&s.target.checked);o.video.draw=r,o.setPlayType("draw",r)}),e.optLoop&&a(t,e.optLoop,"change",function(s){const r=!!(s.target&&s.target.checked);o.video.replay=r,o.setPlayType("replay",r)}),e.volWrap&&(a(t,e.volWrap,"mouseenter",function(){o.toggleVol(!0)}),a(t,e.volWrap,"mouseleave",function(){o.toggleVol(!1)})),e.barrageToggle&&a(t,e.barrageToggle,"click",function(){o.toggleBarrage()}),e.barrageSend&&a(t,e.barrageSend,"click",function(){o.sendBarrage()}),e.barrageInput&&a(t,e.barrageInput,"keydown",function(s){s.key==="Enter"&&o.sendBarrage()})},n.prototype.warn=function(t){const e=String(t);this._warned[e]||(this._warned[e]=!0,typeof console!="undefined"&&console.warn&&console.warn(d+" "+e))},n.prototype.loadVideo=function(t){return this._mediaHandle&&(this._mediaHandle.destroy(),this._mediaHandle=null),this._mediaHandle=K({video:t.video,type:t.type,url:t.url,poster:t.poster,warn:this.warn.bind(this),fail:this.setError.bind(this)}),this._mediaHandle},n.prototype.reload=function(){if(this._destroyed)return;this.clearError(),this.setLoading(!0),this.video.process=0,this.syncProgressDom();const t=this.refs.video;t&&this.loadVideo({video:t,type:this.options.mode,url:this.options.url,poster:this.options.poster})},n.prototype.setLoading=function(t){this.video.loading=!!t,c(this.refs.loading,"hide",!t)},n.prototype.setError=function(t){this.video.error=!0,this.video.loading=!1,c(this.refs.loading,"hide",!0),c(this.refs.error,"hide",!1),f(this.refs.errorText,t||"视频加载出错！")},n.prototype.clearError=function(){this.video.error=!1,c(this.refs.error,"hide",!0)},n.prototype.describeMediaError=function(t){switch(t&&t.error?t.error.code:0){case 1:return"视频加载被中断，请重试";case 2:return"网络错误，视频加载失败";case 3:return"视频解码失败";case 4:return"视频地址不可用或格式不受支持";default:return"视频加载出错！"}},n.prototype.syncTimeDom=function(){const t=this.refs.video;if(!t)return;const e=Number(t.currentTime)||0,o=Number(t.duration),i=Number.isFinite(o)&&o>0?o:0;this.video.about.duration=i,this.video.process=i?e/i*100:0,f(this.refs.current,y(e)),f(this.refs.duration,y(i)),this.syncProgressDom()},n.prototype.syncProgressDom=function(){this.refs.progressDot&&(this.refs.progressDot.style.width=v(this.video.process,0,100)+"%")},n.prototype.syncPlayState=function(){const t=this.refs.video;t&&(this.video.play=!t.paused,c(this.refs.play,"show",!this.video.play),c(this.refs.pause,"hide",!this.video.play))},n.prototype.handleEnded=function(){const t=this.refs.video;if(t){if(this.video.replay){const e=t.play();e&&typeof e.catch=="function"&&e.catch(function(){})}this.syncPlayState()}},n.prototype.playVideo=function(){const t=this.refs.video;if(t){if(t.paused){const e=t.play();e&&typeof e.catch=="function"&&e.catch(function(){})}else t.pause();this.syncPlayState(),lt()&&c(this.refs.pause,"hide",!0)}},n.prototype.setVolume=function(t){const e=v(t,0,1),o=this.refs.video;o&&(o.volume=e,o.muted=e===0),this.video.vol=Math.round(e*100),this.video.muted=e===0,this.refs.volDot&&(this.refs.volDot.style.height=this.video.vol+"%"),c(this.refs.volIcon,"hide",this.video.muted),c(this.refs.mutedIcon,"hide",!this.video.muted)},n.prototype.videoMuted=function(){this.setVolume(this.video.muted?1:0)},n.prototype.setProgressRatio=function(t){const e=v(t,0,1),o=this.refs.video,i=o?Number(o.duration):0;this.video.process=e*100,this.syncProgressDom(),o&&Number.isFinite(i)&&i>0&&(o.currentTime=e*i,f(this.refs.current,y(o.currentTime)))},n.prototype.setVolumeRatio=function(t){this.setVolume(v(t,0,1))},n.prototype.setSpeed=function(t){const e=Number(t);if(!Number.isFinite(e)||e<=0)return;const o=this.refs.video;o&&(o.playbackRate=e),this.video.curSpeed=e,this.showSpeedAct(),this.setStatus("已切换到"+e+"倍速！")},n.prototype.showSpeedAct=function(){const t=this.qa(".spe span");for(let e=0;e<t.length;e+=1){const o=t[e],i=Number(o.getAttribute("data-id"));c(o,"active",i===Number(this.video.curSpeed))}},n.prototype.setStatus=function(t){const e=t==null?"":String(t);this._statusTimer&&(clearTimeout(this._statusTimer),this._statusTimer=0),this.video.status=!0,this.video.statusText=e,c(this.refs.status,"hide",!1),f(this.refs.statusText,e),this._statusTimer=setTimeout(()=>{this._statusTimer=0,this.video.status=!1,c(this.refs.status,"hide",!0),f(this.refs.statusText,"")},1e3)},n.prototype.setPlayType=function(t,e){const o=t==="draw"?"小窗播放":"循环播放",i=e?"已开启":"已关闭";this.video[t]=e,this.setStatus(o+i)},n.prototype.fullScreenOpen=function(){this.video.scale=!0,c(this.refs.box,"scale",!0),c(this.refs.fullscreen,"hide",!0),c(this.refs.fullscreenExit,"hide",!1)},n.prototype.fullScreenCancel=function(){this.video.scale=!1,c(this.refs.box,"scale",!1),c(this.refs.fullscreen,"hide",!1),c(this.refs.fullscreenExit,"hide",!0)},n.prototype.toggleControl=function(t){c(this.refs.control,"hide",!t)},n.prototype.toggleInfo=function(t){c(this.refs.info,"show",!!t)},n.prototype.toggleQualBar=function(t){c(this.refs.qua,"hide",!t)},n.prototype.toggleSpeed=function(t){c(this.refs.speed,"hide",!t)},n.prototype.toggleSet=function(t){c(this.refs.set,"hide",!t)},n.prototype.toggleVol=function(t){c(this.refs.vol,"hide",!t)},n.prototype.addDraw=function(){if(typeof window=="undefined"||typeof document=="undefined")return;const t=this;a(this._listeners,window,"scroll",function(){if(t._destroyed||!t.video.draw)return;const e=document.documentElement?document.documentElement.scrollTop:0;e>800?(t.video.isDraw=!0,c(t.refs.box,"draw",!0),c(t.refs.drawClose,"hide",!1)):e<199&&(t.video.isDraw=!1,c(t.refs.box,"draw",!1),c(t.refs.drawClose,"hide",!0))},{passive:!0})},n.prototype.hideDraw=function(){this.video.isDraw=!1,c(this.refs.box,"draw",!1),c(this.refs.drawClose,"hide",!0),typeof document!="undefined"&&document.documentElement&&(document.documentElement.scrollTop=0)},n.prototype.toggleBarrage=function(){this.video.barrage=!this.video.barrage,c(this.refs.barrage,"show",this.video.barrage),c(this.refs.barrageToggle,"active",this.video.barrage),this.refs.barrageInput&&(this.video.barrage?this.refs.barrageInput.removeAttribute("disabled"):this.refs.barrageInput.setAttribute("disabled","disabled")),this.refs.barrageSend&&(this.video.barrage?this.refs.barrageSend.removeAttribute("disabled"):this.refs.barrageSend.setAttribute("disabled","disabled")),this.video.barrage&&this.showBarrage(),this.setStatus(this.video.barrage?"弹幕已开启":"弹幕已关闭")},n.prototype.sendBarrage=function(){const t=this.refs.barrageInput,e=t?t.value:this.video.barrageContent,o=String(e==null?"":e).trim();if(!o)return this.setStatus("请输入弹幕内容！"),null;this.video.barrageContent=o;const i=O({content:o});return this.video.barrageList.push(i),t&&(t.value=""),this.showBarrage(),i},n.prototype.showBarrage=function(){typeof document!="undefined"&&Y(document,this.refs.barrageList,this.video.barrageList)},n.prototype.randomColor=function(){return A()},n.prototype.shareVideo=function(){const t=this.refs.sharePop;if(!t)return null;const e="#"+(t.id||this.uid+"-share-pop");if(this._share)return this._share.toggle(),this._share;const o=ot({selector:e,url:this.video.about.url||void 0,title:this.options.title||void 0,share:this.options.share});return o?(this._share=o,o):(this.warn("未检测到 xqshare，分享按钮已降级"),this.setStatus("分享组件未加载"),null)},n.prototype.addVol=function(){const t=this.refs.volBar;if(!t||typeof t.addEventListener!="function")return;const e=this;let o=!1;const i=function(r){const l=I(t),u=v((r-l.top)/(l.height||1),0,1);e.setVolume(1-u)};a(this._listeners,t,"pointerdown",function(r){if(o=!0,typeof t.setPointerCapture=="function"&&r.pointerId!=null)try{t.setPointerCapture(r.pointerId)}catch(l){}i(r.clientY)}),a(this._listeners,t,"pointermove",function(r){o&&i(r.clientY)});const s=function(){o=!1};a(this._listeners,t,"pointerup",s),a(this._listeners,t,"pointercancel",s)},n.prototype.addProgree=function(){const t=this.refs.progress;if(!t||typeof t.addEventListener!="function")return;const e=this;let o=!1;const i=function(r){const l=I(t);e.setProgressRatio((r-l.left)/(l.width||1))};a(this._listeners,t,"pointerdown",function(r){if(o=!0,typeof t.setPointerCapture=="function"&&r.pointerId!=null)try{t.setPointerCapture(r.pointerId)}catch(l){}i(r.clientX)}),a(this._listeners,t,"pointermove",function(r){o&&i(r.clientX)});const s=function(){o=!1};a(this._listeners,t,"pointerup",s),a(this._listeners,t,"pointercancel",s)},n.prototype.dom=function(t){return this.root?this.root.querySelector(t):null},n.prototype.domAll=function(t){if(!this.root)return[];const e=this.root.querySelectorAll(t);return Array.prototype.slice.call(e)},n.prototype.q=function(t){return this.dom(t)},n.prototype.qa=function(t){return this.domAll(t)},n.prototype.gid=function(t){this._warned.__gid||(this._warned.__gid=!0,typeof console!="undefined"&&console.warn&&console.warn(d+" gid() 已废弃，请改用实例的 dom()/q() 或 refs"));const e=nt[t];return e&&this.refs[e]||null},n.prototype.secondToTime=function(t){return y(t)},n.prototype.destroy=function(){if(this._destroyed)return;if(this._destroyed=!0,this._statusTimer&&(clearTimeout(this._statusTimer),this._statusTimer=0),this._mediaHandle){try{this._mediaHandle.destroy()}catch(e){}this._mediaHandle=null}if(this._share&&typeof this._share.destroy=="function"){try{this._share.destroy()}catch(e){}this._share=null}F(this._listeners);const t=this.root;t&&t.parentNode&&t.parentNode.removeChild(t),this.root=null,this.refs=Object.create(null)};function rt(t){if(!t||typeof t!="object")throw new Error(d+" 构造参数必须是对象");const e={},o=Object.keys(P);for(let i=0;i<o.length;i+=1)e[o[i]]=t[o[i]]===void 0?P[o[i]]:t[o[i]];if(!e.el)throw new Error(d+" el 是必填项");if(!e.url)throw new Error(d+" url 是必填项");return Array.isArray(e.barrages)||(e.barrages=[]),e}function st(t){if(typeof document=="undefined")throw new Error(d+" 需要在浏览器环境中使用");if(typeof t=="string"){const e=document.querySelector(t);if(!e)throw new Error(d+" 找不到容器元素："+t);return e}if(t&&t.nodeType===1)return t;throw new Error(d+" el 必须是选择器字符串或 DOM 元素")}function at(t){return{play:!1,scale:!1,loading:!0,error:!1,muted:!1,mutedBar:!1,vol:100,isDraw:!1,draw:!0,set:!1,curSpeed:1,speed:!1,replay:!1,status:!1,statusText:"",barrage:!1,barrageContent:"",barrageList:z(t.barrages),process:0,about:{name:"XQVideoPlayer",version:h,url:"",type:"",duration:0},speeds:[{id:1,name:"2.0倍",val:2},{id:2,name:"1.5倍",val:1.5},{id:3,name:"1.25倍",val:1.25},{id:4,name:"1.0倍",val:1},{id:5,name:"0.75倍",val:.75}],qualities:[{id:1,name:"标清",val:1}],url:t.url,poster:t.poster,mode:t.mode,width:t.width,height:t.height}}function lt(){return typeof document!="undefined"&&"ontouchstart"in document}function I(t){if(t&&typeof t.getBoundingClientRect=="function"){const e=t.getBoundingClientRect();return{top:e.top||0,left:e.left||0,width:e.width||t.clientWidth||0,height:e.height||t.clientHeight||0}}return{top:t&&t.offsetTop||0,left:t&&t.offsetLeft||0,width:t&&t.clientWidth||0,height:t&&t.clientHeight||0}}n.isSupportedMode=function(t){return C.indexOf(t)!==-1},n.version=h,n.useShare=V;var ct=n;return X(T)})(),b=dt||{},M=b.default?b.default:b,ft=b.VERSION;export default M;export{M as XQVideoPlayer,ft as VERSION};
