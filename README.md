# xqplayer

This is a simplify firendly video player.

[View Chinese documents](./zh.md)

## use

### import cdn

```html
<!-- cdn css -->
<link rel="stylesheet" href="https://unpkg.com/xqshare/lib/css/xqshare.min.css">
<link rel="stylesheet" href="https://unpkg.com/xqplayer/lib/css/xqplayer.min.css">
<!-- cdn js -->
<script src="https://cdn.guanqi.xyz/libs/flv.js/1.6.1/js/flv.min.js"></script>
<script src="https://cdn.guanqi.xyz/libs/hls.js/1.0.8/js/hls.min.js"></script>
<script src="https://unpkg.com/xqshare/lib/js/xqshare.min.js"></script>
<script src="https://unpkg.com/xqplayer/lib/js/xqplayer.min.js"></script>
```

### use npm

```sh
npm i xqplayer
```

### browser

```html
<div id="myPlayer"></div>
```

```js
// options
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
    :shareTitle="video.video.name" 
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
                mode: 'mp4', // mp4/flv/m3u8
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

### preview

[demo](https://unpkg.com/xqplayer/test/browser.html)

![preview](https://unpkg.com/xqplayer/test/data/preview.jpg)

## issue

[submit your question](https://github.com/gitguanqi/xqplayer/issues/new)

## author

[@gitguanqi](https://github.com/gitguanqi)
