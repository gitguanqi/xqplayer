# xqplayer integration examples

Every snippet is complete for the stated host. Adjust paths/CSS URLs, nothing else.

## 1. Plain HTML, UMD build

```html
<!doctype html>
<html lang="zh-CN">
    <head>
        <meta charset="utf-8" />
        <link rel="stylesheet" href="https://unpkg.com/xqplayer/lib/css/xqplayer.min.css" />
    </head>
    <body>
        <div id="myPlayer"></div>

        <!-- optional: only needed for m3u8 -->
        <script src="https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js"></script>
        <script src="https://unpkg.com/xqplayer/lib/js/xqplayer.min.js"></script>
        <script>
            var player = new XQVideoPlayer({
                el: '#myPlayer',
                url: './stream.m3u8',
                mode: 'm3u8',
                width: 960,
                height: 540,
            });
        </script>
    </body>
</html>
```

`mode` must be set — the library does not look at the file extension.

## 2. Bundler SPA (Vite / webpack)

```js
import XQVideoPlayer from 'xqplayer';
import XQShare from 'xqshare';
import 'xqshare/css/xqshare.min.css';
import 'xqplayer/css/xqplayer.css';

// once per page, before any player is created
XQVideoPlayer.useShare(XQShare);

let player = null;

export function mountPlayer(host, url) {
    player = new XQVideoPlayer({ el: host, url, mode: 'mp4', poster: './poster.jpg' });
    return player;
}

export function switchSource(url, mode) {
    if (!player) return;
    // options are read again by reload(), so this is the supported way to change source
    player.options.url = url;
    player.options.mode = mode;
    player.reload();
}

export function unmountPlayer() {
    if (player) {
        player.destroy(); // removes the DOM node and every listener
        player = null;
    }
}
```

## 3. Vue 3

```js
// main.js
import { createApp } from 'vue';
import xqVideo from 'xqplayer/vue';
import 'xqplayer/css/xqplayer.css';
import App from './App.vue';

createApp(App).use(xqVideo).mount('#app');
```

```vue
<!-- App.vue -->
<script>
import { component as XQShareComponent } from 'xqshare/vue';

export default {
    data() {
        return {
            url: './movie.mp4',
            barrages: [{ content: 'hello', name: 'guest' }],
            shareResolver: () => XQShareComponent,
        };
    },
    methods: {
        onSaveBarrage(content) {
            this.barrages = this.barrages.concat([{ content, name: 'me' }]);
        },
        playPause() {
            this.$refs.player.playVideo();
        },
    },
};
</script>

<template>
    <div>
        <xq-video
            ref="player"
            :url="url"
            :width="720"
            :height="405"
            mode="mp4"
            :barrages="barrages"
            :share-resolver="shareResolver"
            @saveBarrages="onSaveBarrage"
        />
        <button @click="playPause">播放 / 暂停</button>
    </div>
</template>
```

`width` / `height` are `Number` props here, unlike the constructor which also accepts strings.

## 4. Vue 2

```js
// main.js
import Vue from 'vue';
import xqVideo from 'xqplayer/vue';
import 'xqplayer/css/xqplayer.css';

Vue.use(xqVideo); // registers <xq-video>
```

```vue
<template>
    <xq-video :url="url" :width="720" :height="405" :barrages="barrages" />
</template>

<script>
export default {
    data() {
        return { url: './movie.mp4', barrages: [] };
    },
};
</script>
```

Both Vue versions need `vue-loader` / `@vitejs/plugin-vue` and a `less` compiler, because
`xqplayer/vue` ships the raw `.vue` source.

## 5. Injecting bullet-screen items yourself

`sendBarrage()` reads the built-in input, so to push items from your own state write the list and re-render:

```js
function pushBarrage(player, text, name) {
    player.video.barrageList = player.video.barrageList.concat([
        { content: text, name, avatar: '', bg: '#ff8800' },
    ]);
    player.showBarrage();
}
```

## 6. Share popup without a bundler

```html
<link rel="stylesheet" href="./node_modules/xqshare/lib/css/xqshare.min.css" />
<script src="./node_modules/xqshare/lib/js/xqshare.min.js"></script>
<script src="https://unpkg.com/xqplayer/lib/js/xqplayer.min.js"></script>
<script>
    // window.XqShare is detected automatically; nothing else to wire
    new XQVideoPlayer({ el: '#myPlayer', url: './movie.mp4', title: '分享标题' });
</script>
```

Without xqshare the share icon still renders — clicking it shows the toast `分享组件未加载`.
