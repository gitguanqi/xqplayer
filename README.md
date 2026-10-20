# xqplayer

A simple, friendly HTML5 video player — UMD + ESM + Vue 2/3, with HLS/FLV and bullet-screen support.

[中文文档](./zh.md)

> **Upgrading from 0.0.x?** The package root now exports the player itself. Vue users should import
> `xqplayer/vue` instead. See [Migrating from 0.0.x](#migrating-from-00x).

## Install

```sh
npm i xqplayer
```

## Three ways to use it

### 1. UMD (`<script>`)

```html
<link rel="stylesheet" href="https://unpkg.com/xqplayer/lib/css/xqplayer.min.css">
<div id="myPlayer"></div>

<script src="https://unpkg.com/xqplayer/lib/js/xqplayer.min.js"></script>
<script>
    var myVideo = new XQVideoPlayer({
        el: '#myPlayer',
        url: './data/movie.mp4',
    });
</script>
```

### 2. ESM (bundler)

```js
import XQVideoPlayer from 'xqplayer';
import 'xqplayer/css/xqplayer.css';

const player = new XQVideoPlayer({ el: '#myPlayer', url: './data/movie.mp4' });
```

Named exports are available too:

```js
import { XQVideoPlayer, VERSION } from 'xqplayer';
```

### 3. Vue 2 / Vue 3

```js
// Vue 2
import Vue from 'vue';
import xqVideo from 'xqplayer/vue';
Vue.use(xqVideo);

// Vue 3
import { createApp } from 'vue';
import xqVideo from 'xqplayer/vue';
createApp(App).use(xqVideo).mount('#app');
```

```html
<xq-video
    :url="video.url"
    :poster="video.poster"
    :mode="video.mode"
    :width="720"
    :height="405"
    :barrages="video.barrages"
    :shareTitle="video.name"
    @clickBarrage="someThings"
    @saveBarrages="sendBarrage"
></xq-video>
```

The Vue component ships as an `.vue` SFC, so you need `vue-loader` or `@vitejs/plugin-vue` on your side.

## Options

| Name | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | — | **yes** | Container selector or element |
| `url` | `string` | — | **yes** | Video source (mp4 / m3u8 / flv) |
| `poster` | `string` | `''` | no | Poster image |
| `barrages` | `Array` | `[]` | no | Initial bullet-screen items |
| `mode` | `'mp4' \| 'm3u8' \| 'flv'` | `'mp4'` | no | Source type |
| `width` | `number \| string` | `1200` | no | Width |
| `height` | `number \| string` | `600` | no | Height |

Only `el` and `url` are required. Everything else is optional — including `poster`.

## Optional external dependencies

The core player has zero runtime dependencies, but certain formats need extra libraries.
They are **not** bundled — you load them yourself, and the player detects them at runtime.
If a library is missing the player shows an error state instead of throwing.

| Feature | Required library | Global it must expose |
| --- | --- | --- |
| m3u8 / HLS | [hls.js](https://github.com/video-dev/hls.js) | `window.Hls` |
| flv | [flv.js](https://github.com/bilibili/flv.js) | `window.flvjs` |
| Share popup | `xqshare` (or your own component) | `window.XqShare` |

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.0.8/hls.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.6.1/flv.min.js"></script>
```

In Vue, the share component can also be supplied explicitly through the `share-resolver` prop,
which removes the global dependency entirely.

## Instance API

```js
const player = new XQVideoPlayer({ el: '#app', url: './movie.mp4' });

player.playVideo();          // toggle play / pause
player.setVolume(0.5);       // 0 - 1
player.setSpeed(1.5);
player.setStatus('hello');   // transient status hint
player.reload();             // reload the current source
player.loadVideo({ url: './another.mp4' });
player.secondToTime(3661);   // '01:01:01'
player.destroy();            // remove DOM, detach every listener, destroy hls/flv
```

Multiple instances on one page are fully isolated — each player scopes DOM lookups to its own
root node (no hardcoded `id`s), so controls never leak between players.

`destroy()` always clean up after itself: media listeners, scroll listeners and the `hls`/`flv`
instance are all released. Call it before you remove the container in an SPA.

## Migrating from 0.0.x

- `require('xqplayer')` returned the Vue plugin and blew up on the `.vue` import. It now returns
  the player itself; Vue users move to `xqplayer/vue`.
- `poster` used to be rejected when omitted ("poster is must!"). It is genuinely optional now.
- The player no longer assigns `window.onscroll`, and no longer writes `document.body.className`.
- Bullet-screen content is escaped instead of injected as raw HTML.
- HLS / FLV / share libraries are probed at runtime instead of being referenced directly.

## Development

```sh
npm run build          # regenerate lib/ artifacts from src/
npm run check          # fail if lib/ artifacts are out of sync with src/
npm test               # node:test unit suite (44 assertions)
npm run test:harness   # behavioural regression against a stub DOM
npm run serve          # serve test/ pages at http://localhost:5173
npm run release patch  # version bump + build + test + tag + push (no force push)
```

`lib/` holds committed build output generated from `src/`. Do not edit it by hand —
`npm run check` will fail, and a GitHub Action can run the same command in CI.

Test pages report PASS / FAIL / SKIP directly on the page:

| Page | Checks |
| --- | --- |
| `test/browser.html` | UMD export, multi-instance isolation, XSS escaping, destroy |
| `test/esm.html` | default vs named export, missing hls.js degradation |
| `test/vue2.html` | real mount under Vue 2, unique checkbox ids, teardown |
| `test/vue3.html` | real mount under Vue 3, unmount cleanup |

The two Vue pages load their runtime from a CDN and report **SKIP** rather than FAIL offline.

## Preview

![preview](./test/data/preview.jpg)

## Browser support

ES2019-capable browsers: Chrome ≥ 64, Edge ≥ 79, Firefox ≥ 62, Safari ≥ 12.
Pointer events are used for dragging, so no touch fallback layer is required.

## Issues

[Submit a question](https://github.com/gitguanqi/xqplayer/issues/new)

## Author

[@gitguanqi](https://github.com/gitguanqi)
