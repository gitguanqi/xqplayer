# xqplayer API reference

Shipped surface only — mirrors `types/index.d.ts`, `lib/js/xqplayer.js` and `lib/vue/index.d.ts`.

## Package entry points

| Subpath | File | Format |
| --- | --- | --- |
| `xqplayer` | `lib/js/xqplayer.js` | UMD, also the CJS `require` target |
| `xqplayer` (import) | `lib/js/xqplayer-esm.mjs` | ESM |
| `xqplayer/vue` | `lib/vue/index.js` + `index.vue` | Vue plugin, raw SFC |
| `xqplayer/css/xqplayer.css` | full skin | |
| `xqplayer/css/xqplayer.min.css` | full skin, minified | |
| `xqplayer/css/xqplayer-icon.css` | icon font only | |
| `xqplayer/fonts/*` | icon font files referenced by the CSS | |

## Runtime exports

| Name | Kind | Notes |
| --- | --- | --- |
| `XQVideoPlayer` (default) | constructor | Works with and without `new`. In UMD it is `window.XQVideoPlayer`. |
| `XQVideoPlayer` (named) | constructor | Same reference as the default export. |
| `VERSION` | `string` | Package version; also `XQVideoPlayer.version`. |
| `useShare` | `(ctor) => ctor \| null` | Registers the `xqshare` constructor once per page. `null` clears it. Identical to the static. |

Statics: `XQVideoPlayer.version`, `XQVideoPlayer.isSupportedMode(mode)`, `XQVideoPlayer.useShare(ctor)`.

## Options

| Option | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `el` | `string \| HTMLElement` | — | yes | Selector is resolved with `querySelector` once, at construction. |
| `url` | `string` | — | yes | mp4 / m3u8 / flv URL. |
| `poster` | `string` | `''` | no | Only written to the `<video>` when non-empty. |
| `barrages` | `XQBarrageInput[]` | `[]` | no | Rendered into the bullet-screen panel; `time` is accepted but not used for scheduling. |
| `mode` | `'mp4' \| 'm3u8' \| 'flv'` | `'mp4'` | no | Not inferred from `url`. |
| `width` | `number \| string` | `1200` | no | Written as the root width. |
| `height` | `number \| string` | `600` | no | Written as the root height. |
| `title` | `string` | `''` | no | Share title; `shareVideo()` falls back to `document.title`. |
| `share` | `XQShareCtor \| null` | `null` | no | Per-instance constructor, highest priority. |

`XQBarrageInput`: `{ content?, name?, avatar?, time?, [key: string]: unknown }`.
`XQBarrage` — what the instance actually stores after normalisation: `{ id?, avatar: string, name: string, content: string, bg: string }`.
The declared type also carries `time: number`, but the renderer never reads it and normalisation drops it.

## Instance methods

### Playback

| Method | Behaviour |
| --- | --- |
| `playVideo()` | **Toggles** play/pause based on `video.paused`. Auto-play rejection is swallowed. |
| `setVolume(ratio: number)` | `ratio` is `0`–`1`, clamped. Sets `video.volume`, mutes at `0`, stores `video.vol = round(ratio * 100)`. |
| `setVolumeRatio(ratio)` | Clamped alias of `setVolume`. |
| `setProgressRatio(ratio)` | `0`–`1`; seeks only when `duration` is finite and `> 0`. |
| `setSpeed(rate)` | Ignores non-finite or `<= 0`. Sets `playbackRate`, updates the menu highlight, shows a toast. |
| `videoMuted()` | Toggles between volume `0` and `1` (drops the previous level). |
| `reload()` | Re-reads `player.options` (`url` / `mode` / `poster`) and reloads. No-op after `destroy()`. |
| `loadVideo({ video, type, url, poster })` | Low-level loader. Returns `{ kind, destroy }`. Passing only `{ url }` is a silent no-op. |

### Status and error UI

| Method | Behaviour |
| --- | --- |
| `setStatus(text)` | Shows the transient hint; hides itself after ~1s. A second call replaces the pending timer. |
| `setLoading(show)` | Toggles the loading overlay. |
| `setError(message)` | Shows the error overlay with `message` (default `视频加载出错！`). |
| `clearError()` | Hides the error overlay. |

### Layout and fullscreen

| Method | Behaviour |
| --- | --- |
| `fullScreenOpen()` / `fullScreenCancel()` | Toggle the CSS `scale` mode on the player root. **Does not call the Fullscreen API.** |
| `toggleControl(type)` | `type` truthy = show control bar. |
| `toggleInfo(type)`, `toggleQualBar(type)`, `toggleSpeed(type)`, `toggleSet(type)`, `toggleVol(type)` | Pass `true` to open the panel, `false` to close. Panels are not mutually exclusive — close the others yourself. |
| `addDraw()` | Binds a passive `window` scroll listener: `scrollTop > 800` enters the mini-window (`draw`), `< 199` leaves it. Called once during construction. |
| `hideDraw()` | Leaves mini-window mode and scrolls the document back to the top. |

### Bullet screen

| Method | Behaviour |
| --- | --- |
| `toggleBarrage()` | Flips `video.barrage`, enables/disables the input and send button, re-renders, shows a toast. |
| `sendBarrage()` | Reads the bullet-screen **input element** (falls back to `video.barrageContent`), trims it, appends a normalised item and re-renders. Returns the item, or `null` when empty. Arguments are ignored. |
| `showBarrage()` | Re-renders `video.barrageList`. Arguments are ignored. |
| `randomColor()` | Random colour with each channel `>= 120`. |

To inject items programmatically, replace the list and re-render:

```js
player.video.barrageList = [
    { content: 'first', name: 'guest', avatar: '', bg: '#ff8800' },
];
player.showBarrage();
```

### Share

| Method | Behaviour |
| --- | --- |
| `shareVideo()` | Resolves the constructor from `options.share` → `useShare()` → `window.XqShare`. First call creates the widget and calls `show()`; later calls `toggle()` the existing one. Returns the `xqshare` instance, or `null` plus the toast `分享组件未加载`. |

### DOM helpers

All lookups are scoped to this instance's root node, so multiple players never collide.

| Method | Behaviour |
| --- | --- |
| `q(name)` / `dom(name)` | Single node by `data-xq` name. |
| `qa(name)` / `domAll(name)` | All nodes by `data-xq` name. |
| `gid(id)` | Node by legacy 0.0.x id, mapped internally to a `data-xq` name. |

### Lifecycle

| Method | Behaviour |
| --- | --- |
| `destroy()` | Idempotent. Clears the status timer, destroys the hls/flv handle and the share widget, detaches every listener (media, scroll, pointer), removes its root node, then sets `root = null` and empties `refs`. |

`secondToTime(seconds)` returns `HH:MM:SS`, coercing `NaN` / negatives / `Infinity` to `0`.

## State snapshot (`instance.video`)

Readable and writable; the rendered DOM is not re-synced automatically after direct writes, so prefer the
methods.

| Field | Meaning |
| --- | --- |
| `play`, `loading`, `error`, `muted`, `mutedBar` | Media booleans |
| `vol` | `0`–`100` (note the scale difference from `setVolume`) |
| `scale` | CSS fullscreen mode |
| `isDraw`, `draw` | Mini-window state |
| `set`, `speed`, `curSpeed` | Settings panel and playback rate |
| `replay` | Loop-after-ended flag |
| `status`, `statusText` | Transient hint |
| `barrage`, `barrageContent`, `barrageList` | Bullet screen |
| `process` | Progress percentage `0`–`100` |
| `about` | `{ name, version, url, type, duration }` |
| `speeds`, `qualities` | Menu items |
| `url`, `poster`, `mode`, `width`, `height` | Current values |

## Vue plugin (`xqplayer/vue`)

Exports: `default` (plugin with `install`), `componentName` (`'xqVideo'`), `videoComponent` (raw component).

### Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `url` | `String` | — | Required. |
| `poster` | `String` | `''` | |
| `barrages` | `Array` | — | Re-normalised whenever the array reference changes. |
| `mode` | `String` | `'mp4'` | Same "no inference" rule as the constructor. |
| `width` | `Number` | `1200` | `Number` only. |
| `height` | `Number` | `600` | `Number` only. |
| `shareTitle` | `String` | — | Falls back to `document.title`. |
| `shareResolver` | `Object \| Function` | `null` | Share component; falls back to `window.XqShare`. |

### Events

| Event | Payload | When |
| --- | --- | --- |
| `clickBarrage` | — | The bullet-screen button is clicked. |
| `saveBarrages` | `string` (trimmed content) | The user sends a bullet-screen message; the input is cleared afterwards. |

### Template ref

The component is Options API, so a template ref reaches its methods directly:
`playVideo()`, `videoMuted()`, `fullScreenOpen()`, `fullScreenCancel()`, `reloadVideo()`,
`toggleBarrage()`, `hideDraw()`, `setStatus(text)`, plus `uid` and `duration`.

Cleanup is automatic: `beforeUnmount` (Vue 3) and `beforeDestroy` (Vue 2) both run an internal
`teardown()` that destroys the hls/flv handle, clears timers and removes the scroll / `mouseup` listeners.

## Errors thrown at construction

All are `Error` instances prefixed with `[xqplayer] `:

| Situation | Message |
| --- | --- |
| Argument is not an object | `构造参数必须是对象` |
| `el` missing | `el 是必填项` |
| `url` missing | `url 是必填项` |
| Selector matches nothing | `找不到容器元素：<selector>` |
| `el` is not a selector or element | `el 必须是选择器字符串或 DOM 元素` |
| No `document` (SSR / Node) | `需要在浏览器环境中使用` |

Runtime degradations are warnings, not throws: `未检测到 hls.js，m3u8 无法播放；请自行引入 hls.js`,
`未检测到 flv.js，flv 无法播放；请自行引入 flv.js`, `未检测到 xqshare，分享按钮已降级`,
`不支持的视频类型：<type>`. Each is logged once per instance.
