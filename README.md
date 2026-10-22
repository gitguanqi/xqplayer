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
| `title` | `string` | `''` | no | Share title (defaults to `document.title`) |
| `share` | `Function` | `null` | no | xqshare constructor for this instance |

Only `el` and `url` are required. Everything else is optional — including `poster`.

The control bar adapts to `width` on its own: below 680px it drops the quality and
speed menus, below 520px it also drops the bullet-screen input, so the remaining
buttons never wrap or overlap. `<style>` resets (`box-sizing`, button appearance)
are scoped to the player — your page's own styles are left alone.

## Optional external dependencies

The player bundle has no runtime dependencies of its own — libraries are **not** bundled into
`xqplayer`. Each is detected at runtime, and a missing one only degrades that one feature
(error state for HLS/FLV, a toast for share) instead of throwing.

| Feature | Required library | Detected as |
| --- | --- | --- |
| m3u8 / HLS | [hls.js](https://github.com/video-dev/hls.js) | `window.Hls` |
| flv | [flv.js](https://github.com/bilibili/flv.js) | `window.flvjs` |
| Share popup | [`xqshare`](https://www.npmjs.com/package/xqshare) | `window.XqShare`, or injected |

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.0.8/hls.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/flv.js/1.6.1/flv.min.js"></script>
```

### Enabling the share button

`xqshare` is a declared dependency, so `npm i xqplayer` already installs it — but the player
will not inject it for you. Pick whichever matches your setup:

```html
<!-- 1. plain <script>: xqshare ships a UMD build, plus its own stylesheet -->
<link rel="stylesheet" href="./node_modules/xqshare/lib/css/xqshare.min.css">
<script src="./node_modules/xqshare/lib/js/xqshare.min.js"></script>
```

```js
// 2. bundler: register the constructor once
import XQShare from 'xqshare';
import 'xqshare/css/xqshare.min.css';
import XQVideoPlayer from 'xqplayer';

XQVideoPlayer.useShare(XQShare);
// or per instance: new XQVideoPlayer({ ..., share: XQShare })
```

```vue
<!-- 3. Vue: pass the component directly, no global needed -->
<script>
import { component as XQShare } from 'xqshare/vue';
export default { data: () => ({ resolveShare: () => XQShare }) };
</script>

<xq-video url="./movie.mp4" :share-resolver="resolveShare" />
```

Without any of these the share icon still works — it just shows a "share component not loaded"
toast and logs a warning.

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
player.shareVideo();         // open the share popup, returns the xqshare instance (or null)
player.destroy();            // remove DOM, detach listeners, destroy hls/flv + share widget
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

## For AI agents

The published package ships agent-facing metadata, declared in `package.json` and included in the tarball:

- `llms` → `llms.txt` — compact API reference: exports, options with real defaults, instance methods,
  optional-dependency behaviour and integration constraints.
- `agents` → `skills/xqplayer-integration/SKILL.md` — integration guide: which entry to pick, wiring order,
  teardown, and how to verify an integration. Exact tables live in
  `skills/xqplayer-integration/references/api.md`, runnable examples in `references/examples.md`.

Both are readable straight from `node_modules/xqplayer/`, so no network fetch is needed.

## Development

```sh
npm run build          # regenerate lib/ artifacts from src/
npm run check          # fail if lib/ artifacts are out of sync with src/
npm test               # node:test unit suite (72 assertions)
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
