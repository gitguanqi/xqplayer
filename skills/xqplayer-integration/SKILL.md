---
name: xqplayer-integration
description: Embed the xqplayer HTML5 video player into a page or app — pick the UMD, ESM, or Vue 2/3 entry, wire the stylesheet and the optional hls.js / flv.js / xqshare libraries, and tear player instances down safely in a SPA.
---

# xqplayer integration

`xqplayer` renders its own DOM inside a container element. It does not ship hls.js, flv.js or xqshare;
it probes for them at runtime. The root entry is the player constructor — the Vue plugin lives at
`xqplayer/vue`.

Load `references/api.md` when you need exact signatures, defaults, or state field meanings.
Load `references/examples.md` for full runnable files (UMD page, bundler SPA, Vue 3, Vue 2).

## 1. Pick the entry

| Host setup | Import | Notes |
| --- | --- | --- |
| Plain HTML, no build | `<script src="https://unpkg.com/xqplayer/lib/js/xqplayer.min.js">` | Global is `XQVideoPlayer`. Also link `lib/css/xqplayer.min.css`. |
| Vite / webpack / Rollup | `import XQVideoPlayer from 'xqplayer'` | Named `VERSION`, `useShare` also exported. |
| Vue 2 or Vue 3 | `import xqVideo from 'xqplayer/vue'` | Plugin; registers `<xq-video>`. Never import the root entry for Vue. |

Do not use `require('xqplayer')` expecting the Vue plugin — that changed in 0.1.0.

## 2. Wire it in this order

1. Import the stylesheet (`xqplayer/css/xqplayer.css`, or the `.min.css`). Without it the icon font and
   control-bar layout are unstyled and the player looks broken.
2. If the source is `m3u8` or `flv`, attach the library to the global **before** constructing the player:
   `window.Hls = Hls` / `window.flvjs = flvjs`. For share, either set `window.XqShare`, call
   `XQVideoPlayer.useShare(XQShare)`, or pass `share: XQShare` per instance.
3. Give the container a real box. `width` / `height` default to `1200` / `600` and are written onto the
   player root; a zero-size container renders a zero-size player.
4. `new XQVideoPlayer({ el, url, mode, ... })`.
5. On unmount or route change, call `player.destroy()` **before** removing the container.

## 3. Constraints that break integrations

- **`mode` is not inferred.** It defaults to `'mp4'`. An `.m3u8` URL with no `mode` is handed to the
  native `<video>` element and simply never plays. Always pass `mode` explicitly.
- **`playVideo()` toggles.** It pauses when the media is already playing. Use it for a UI button, not as
  "start playback".
- **Two volume scales.** `setVolume(0..1)` in, but `player.video.vol` stores `0..100`.
- **`loadVideo()` is the internal loader.** It expects `{ video, type, url, poster }`. `loadVideo({ url })`
  is a silent no-op. To switch source, assign `player.options.url` / `player.options.mode` then call
  `reload()`, or destroy and rebuild the instance.
- **Construction throws** `Error` with the `[xqplayer] ` prefix for a non-object argument, missing `el`,
  missing `url`, a selector that matches nothing, or no `document`. Validate the container exists first
  when the player is created from data that loads asynchronously.
- **Missing optional libraries degrade, they do not throw.** No `window.Hls` → error state
  "需要引入 hls.js 才能播放 m3u8"; no xqshare → toast "分享组件未加载". Surface these to users instead of
  reporting a generic failure.
- **Vue component is a raw SFC.** The host build needs `vue-loader` or `@vitejs/plugin-vue`, plus a `less`
  compiler (`<style lang="less" scoped>`). It still relies on `xqplayer/css/xqplayer.css` for the icon
  font, which the SFC does not bundle.
- **Vue props differ from options.** The component takes `url`, `poster`, `barrages`, `mode`, `width`,
  `height` (`Number`), `shareTitle`, `shareResolver`; it emits `clickBarrage` and `saveBarrages(content)`.
  There is no `el`, `title`, or `share` prop.

## 4. Verify the integration

- Console shows no `[xqplayer]` warnings (warnings are de-duplicated per instance, so one line is enough
  to prove a missing dependency).
- The controls render with icons — if buttons show square glyphs, the stylesheet or its `fonts/` sibling
  is not being served.
- `m3u8` fixture plays and the error overlay stays hidden.
- In a SPA, mount/unmount the same route three times; each time the previous container must be empty
  (`player.root === null` after `destroy()`), with no scroll listener still firing on `window`.
