# xqplayer

这是一个简化版视频播放器插件。

[查看英文文档](./README.md)

## 使用

### 导入CDN

```html
<!-- cdn css -->
<link rel="stylesheet" href="https://xqgj.cc/xqcdn/libs/xqshare/css/xqshare.min.css">
<link rel="stylesheet" href="https://xqgj.cc/xqcdn/libs/xqplayer/css/xqplayer.min.css">
<!-- cdn js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.6.1/flv.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.0.8/hls.min.js"></script>
<script src="https://xqgj.cc/xqcdn/libs/xqshare/js/xqshare.min.js"></script>
<script src="https://xqgj.cc/xqcdn/libs/xqplayer/js/xqplayer.min.js"></script>
```

### NPM安装

```sh
npm i xqplayer
```

### 游览器端

```html
<div id="myPlayer"></div>
```

```js
// 插件参数
let options = {
    el: '#myPlayer',
    url: './data/movie.mp4', //  mp4/flv/m3u8
    poster: './data/poster.jpg',
    barrages: [
        {
            id: 1,
            avatar: '',
            name: '测试1',
            content: '哈哈哈',
        },
        {
            id: 2,
            avatar: '',
            name: '测试2',
            content: '可以的',
        },
        {
            id: 3,
            avatar: '',
            name: '测试3',
            content: '真好啊',
        }
    ],
    mode: 'mp4', //  mp4/flv/m3u8
    width: 1200,
    height: 600,
}

// init
let myVideo = new XQVideoPlayer(options);
console.log(myVideo);
```

### vue

```js
import Vue from 'vue';
import xqplayer from 'xqplayer';
Vue.use(xqplayer);
```

+ html

```html
<xq-video 
    :url="video.url" 
    :poster="video.poster" 
    :mode="video.mode" 
    :barrages="video.barrages" 
    :shareTitle="video.shareTitle" 
    :width="video.width"
    :height="video.height"
    @clickBarrage="someThings" 
    @saveBarrages="sendBarrage"
>
</xq-video>
```

+ js

```js
export default {
    name: 'demo',
    data () {
        return {
            video: {
                url: 'https://xxx.xxx/xxx.mp4', // mp4/flv/m3u8
                poster: 'xxx.jpg',
                mode: 'mp4',
                barrages: [
                    {
                        id: 1,
                        avatar: 'xxx.jpg',
                        name: '测试1',
                        content: '哈哈哈',
                    },
                    {
                        id: 2,
                        avatar: 'xxx.jpg',
                        name: '测试2',
                        content: '可以的',
                    },
                    {
                        id: 3,
                        avatar: 'xxx.jpg',
                        name: '测试3',
                        content: '真好啊',
                    },
                ],
                mode: 'mp4',
                width: 1200,
                height: 600,
                shareTitle: 'demo',
            }
        },
    },
    methods: {
        someThings () {
            // some things
        },
        sendBarrage (val) {
            // barrage value
        },
    }
}
```

### 预览

[在线预览](https://xqgj.cc/xqplayer/test/browser.html)

![图片预览](https://xqgj.cc/xqplayer/test/data/preview.jpg)

## 问题

[提交问题](https://github.com/gitguanqi/xqplayer/issues/new)

## 作者

[@gitguanqi](https://github.com/gitguanqi)
