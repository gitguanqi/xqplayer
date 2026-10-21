# Changelog

## 0.1.0

仓库结构与实现的一次性重构。源码从「两份手工同步的副本」收敛到单一源，
并修掉了一批会让多实例场景直接错乱的缺陷。

### 破坏性变更

- **根入口语义变了**：`xqplayer` 现在导出播放器本体（`main: lib/js/xqplayer.js`）。
  0.0.x 里它指向一个 `import './index.vue'` 的 Vue 包装器，Node 侧 `require` 必失败。
  Vue 用户请改用 `xqplayer/vue`。
- **版本号跳到 0.1.0**：包内的 `about.version` 与 `package.json` 现在保持一致。

### 修复

- 多实例隔离：模板里 18 处写死的 `id`（`#myvideo`、`#play-btn` …）改为容器内作用域的
  `data-xq` 引用表，第二个实例不再操作第一个实例的节点。
- 生命周期：新增 `destroy()`，一次性摘掉所有监听器、移除 DOM、销毁 hls/flv 实例。
- 不再抢占宿主的 `window.onscroll`，改为 `addEventListener` + `destroy` 时解绑。
- 参数校验：不再因为 `poster` 等默认值是空字符串就抛 "xxx is must!"；只有 `el` 与 `url` 必填。
- 拖拽：音量条与进度条改用 Pointer Events + `getBoundingClientRect`，
  修正了原来的「clamp 是条没赋值的空语句」「拖动无响应」「横竖轴混用」。
- 时间格式化：`> 10` 改成 `>= 10`（10 秒不再输出 `010`），并对 NaN / 负数 / Infinity 兜底。
- 外部依赖：hls.js / flv.js / xqshare 改为运行时探测，缺失时进入错误态并 `console.warn`，
  不再抛 `ReferenceError` 中断初始化。
- 弹幕：内容改走 `textContent`（此前直接拼 `innerHTML`，用户输入即执行），
  头像为空时不渲染 `<img src="">`（此前会请求当前页 URL），颜色只在归一化时生成一次。
- 交互细节：`mouseover/mouseout` 改 `mouseenter/mouseleave`，控制条不再因为划过子元素闪隐；
  错误遮罩在 `loadstart` / `seeking` / `seeked` / `canplaythrough` 后收回；
  「刷新重试」不再触发页面跳转。
- Vue 组件：图标类从无效的 `xqvideo-*` 改为 `xvicon-*`；不再 `import 'xqshare'`（改为运行时可选 + 空壳兜底）；
  `$route` 改为带守卫的 `routeType` 计算属性；两处 `addEventListener` 的普通 `function` 回调改箭头函数；
  `document.body.className` 改为只增删自己的滚动锁类；checkbox id 按实例唯一化；
  新增 `beforeUnmount`(Vue 3) / `beforeDestroy`(Vue 2) 双钩子与共用的 `teardown()`。
- 控制条布局：左侧时间不再被 flex 压缩换行到播放按钮下方；弹幕行的「发送」不再掉到第二行
  （输入框改为可收缩 + 按钮不参与收缩）。
- 弹层定位：音量、倍速、清晰度、设置面板原先各自写死 `right: 150px/200px/245px`（相对整条控制条），
  图标一增减就整体偏移；现在锚定到各自的 `.video-control-alone`，用 `left: 50%` + `translateX(-50%)` 居中。
- 窄实例：按 `width` 分级（<680 收起清晰度/倍速，<520 再收起弹幕输入），480px 实例的图标不再被压到 17px。
- 样式自洽：`box-sizing` 与按钮外观重置收进 `.xqvideo-box` 作用域，宿主有没有全局 reset 都不再影响外观
  （此前裸 `<button>` 会露出浏览器原生边框与底色）。
- Vue 空壳组件：`render()` 不再假设第一个参数是 `h`（Vue 3 传的是实例），改为两个版本都安全的空渲染。
- 分享按钮真的能用了：`xqshare` 重新作为依赖引入（`dependencies`），播放器按三条路解析构造器 ——
  `options.share` > `XQVideoPlayer.useShare()` > `window.XqShare`；
  点击创建实例并 `show()`，再次点击走 `toggle()` 而不是重复 new，`destroy()` 时连带销毁。
  缺失时仍只是提示，不抛错。
- Vue 组件：`shareComponent` 不再只有空壳，`window.XqShare` 存在时把 UMD 构造器包成组件
  （自己建宿主、同步 `show`/`url`/`title`、卸载时 destroy）；`share-resolver` 仍可传入 `xqshare/vue` 的组件。
  点分享时才解析，兼容 xqshare 异步加载。
- 弹幕/分享相关的窄宽度与首帧问题一并修掉：`title`、`share` 进入默认参数表，`destroy()` 幂等清理分享实例。

### 工程化

- 新增 `src/` 作为唯一源，`scripts/build.mjs`（esbuild）生成 UMD / ESM 及其压缩产物。
- 新增 `npm run check`：产物与源码不一致时报错退出，避免再次出现手工改 `lib/` 却没同步的问题。
- `package.json` 补全 `module` / `browser` / `unpkg` / `jsdelivr` / `exports` / `types` / `files` / `sideEffects`；
  `files` 让发包体积从约 860KB 降到约 215KB（不再带上 `test/data`）。
- 手写类型声明：`types/index.d.ts` 与 `lib/vue/index.d.ts`。
- 测试：59 条 `node:test` 断言 + 12 个基于桩 DOM 的行为场景 + 5 个浏览器自检页
  （UMD / ESM / Vue 2 / Vue 3 / 导航），并新增零依赖静态服务器（支持 HTTP Range）。
- 删除 `deploy.sh` 的 `git push -f`，改为 `npm run release` —— 前置检查、普通推送、支持 `--dry-run`。

## 0.0.7

- 最后一个旧版本：UMD 与 ESM 两份手工维护的副本，压缩产物没有对应的构建脚本。
