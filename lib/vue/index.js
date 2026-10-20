/**
 * xqplayer 的 Vue 插件。
 *
 * Vue 2 与 Vue 3 都可以直接用，区别在于：
 * - Vue 2：`Vue.use(xqVideo)`
 * - Vue 3：`app.use(xqVideo)`
 *
 * 组件本体在 ./index.vue，需要宿主自己有 vue-loader / @vitejs/plugin-vue 之类的
 * SFC 编译能力 —— 这是刻意的选择：不把编译后的结果塞进包里，避免版本与宿主冲突。
 *
 * 从 0.1.0 起，根入口 `xqplayer` 导出的是播放器本体；
 * Vue 用户请从 `xqplayer/vue` 引入本文件。
 */
import videoComponent from './index.vue';

/** 组件名，Vue 2 用 <xq-video>，Vue 3 里 <xq-video> / <XqVideo> 都可以 */
export const componentName = 'xqVideo';

/** 裸组件，便于按需注册而不用插件机制 */
export { videoComponent };

const xqVideo = {
    install: function (Vue) {
        Vue.component(componentName, videoComponent);
    },
};

export default xqVideo;
