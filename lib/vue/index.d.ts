/**
 * xqplayer/vue 的类型声明。
 * 组件本体仍在 index.vue（SFC），这里只描述插件与 props。
 */
import type { App, Plugin } from 'vue';
import type { XQBarrageInput } from '../../types/index';

export interface XQVideoProps {
    /** 视频地址（必填） */
    url: string;
    /** 封面图地址（可选，0.1.0 起不再是必填） */
    poster?: string;
    /** 弹幕列表 */
    barrages?: XQBarrageInput[];
    /** 播放类型 */
    mode?: 'mp4' | 'm3u8' | 'flv';
    /** 宽度 */
    width?: number;
    /** 高度 */
    height?: number;
    /** 分享标题 */
    shareTitle?: string;
    /** 自定义分享组件，不传则退回 window.XqShare，都没有时分享按钮给出提示 */
    shareResolver?: unknown;
}

export interface XQVideoExpose {
    /** 组件实例的 uid，用于隔离内部 id */
    uid: string;
    /** 当前时长（秒） */
    duration: number;
    playVideo: () => void;
    videoMuted: () => void;
    fullScreenOpen: () => void;
    fullScreenCancel: () => void;
    reloadVideo: () => void;
    toggleBarrage: () => void;
    setStatus: (text: string) => void;
    destroy: () => void;
}

export interface XQVideoSlots {
    default?: () => unknown;
}

/** Vue 2 / Vue 3 都能用的插件对象 */
export declare const xqVideo: Plugin;

/** 注册到全局的组件名 */
export declare const componentName: string;

/** 裸组件入口，便于按需注册 */
export declare const videoComponent: unknown;

export declare function install(app: App): void;

export default xqVideo;
