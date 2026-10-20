/**
 * xqplayer 类型声明。
 * 手写而非生成，避免为了 .d.ts 再引入一条 TS 构建链。
 */
export interface XQPlayerOptions {
    /** 容器，CSS 选择器或 DOM 元素（必填） */
    el: string | HTMLElement;
    /** 视频地址（必填） */
    url: string;
    /** 封面图地址（可选） */
    poster?: string;
    /** 初始弹幕列表 */
    barrages?: XQBarrageInput[];
    /** 播放类型，缺省按后缀推断 */
    mode?: 'mp4' | 'm3u8' | 'flv';
    /** 宽度，默认 1200 */
    width?: number | string;
    /** 高度，默认 600 */
    height?: number | string;
}

export interface XQBarrageInput {
    /** 弹幕内容 */
    content?: string;
    /** 发送者昵称 */
    name?: string;
    /** 头像地址 */
    avatar?: string;
    /** 出现时间（秒） */
    time?: number | string;
    [key: string]: unknown;
}

export interface XQBarrage {
    content: string;
    name: string;
    avatar: string;
    time: number;
    [key: string]: unknown;
}

export interface XQAbout {
    name: string;
    version: string;
    url: string;
    type: string;
    duration: number;
}

export interface XQSpeed {
    id: number;
    name: string;
    val: number;
}

/** 实例的 UI / 媒体状态快照，可直接读写 */
export interface XQPlayerState {
    play: boolean;
    scale: boolean;
    loading: boolean;
    error: boolean;
    muted: boolean;
    mutedBar: boolean;
    vol: number;
    isDraw: boolean;
    draw: boolean;
    set: boolean;
    curSpeed: number;
    speed: boolean;
    replay: boolean;
    status: boolean;
    statusText: string;
    barrage: boolean;
    barrageContent: string;
    barrageList: XQBarrage[];
    process: number;
    about: XQAbout;
    speeds: XQSpeed[];
    qualities: XQSpeed[];
    url: string;
    poster: string;
    mode: 'mp4' | 'm3u8' | 'flv';
    width: number | string;
    height: number | string;
}

/** 内部节点引用表，键名即模板上的 data-xq */
export type XQRefs = Record<string, HTMLElement | null>;

export class XQVideoPlayer {
    constructor(options: XQPlayerOptions);

    /** 实例唯一标识 */
    readonly uid: string;
    /** 归一化后的构造参数 */
    readonly options: Required<XQPlayerOptions>;
    /** 宿主容器 */
    readonly container: HTMLElement;
    /** 播放器根节点，destroy() 后为 null */
    root: HTMLElement | null;
    /** 模板节点引用表 */
    refs: XQRefs;
    /** UI / 媒体状态 */
    video: XQPlayerState;

    static version: string;
    static isSupportedMode(mode: string): boolean;

    /** 切换播放/暂停 */
    playVideo(): void;
    /** 重新加载当前源 */
    reload(): void;
    /** 按指定参数换源，缺省沿用当前值 */
    loadVideo(params?: Partial<XQPlayerOptions>): void;

    setVolume(ratio: number): void;
    setVolumeRatio(ratio: number): void;
    setProgressRatio(ratio: number): void;
    setSpeed(speed: number): void;
    videoMuted(): void;

    setLoading(loading: boolean): void;
    setError(message: string): void;
    clearError(): void;
    setStatus(text: string, duration?: number): void;

    fullScreenOpen(): void;
    fullScreenCancel(): void;

    toggleControl(): void;
    toggleInfo(): void;
    toggleQualBar(): void;
    toggleSpeed(): void;
    toggleSet(): void;
    toggleVol(): void;
    toggleBarrage(): void;

    /** 滚动进入小窗模式 */
    addDraw(): void;
    hideDraw(): void;

    sendBarrage(content?: string): void;
    showBarrage(list?: XQBarrageInput[]): void;
    shareVideo(): void;

    /** 秒 -> HH:MM:SS */
    secondToTime(seconds: number): string;

    /** 同步 UI 到当前媒体状态 */
    syncTimeDom(): void;
    syncProgressDom(): void;
    syncPlayState(): void;

    /** 在实例内按 data-xq 取单个节点 */
    q(name: string): HTMLElement | null;
    /** 在实例内按 data-xq 取多个节点 */
    qa(name: string): HTMLElement[];
    /** 兼容旧版：按 data-xq 取节点 */
    dom(name: string): HTMLElement | null;
    domAll(name: string): HTMLElement[];
    /** 兼容旧版：按 id 在实例内取节点 */
    gid(id: string): HTMLElement | null;

    /** 移除 DOM、摘掉所有监听器并销毁 hls/flv 实例 */
    destroy(): void;
}

export const VERSION: string;
export default XQVideoPlayer;
