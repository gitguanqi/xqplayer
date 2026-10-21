/**
 * 包入口：只在这里汇总导出，构建脚本据此产出 UMD / ESM 两种包装。
 */
import { XQVideoPlayer } from './player.mjs';
import { VERSION } from './config.mjs';
import { useShare } from './share.mjs';

XQVideoPlayer.version = VERSION;
/** 打包场景注入分享组件：`import XqShare from 'xqshare'; XQVideoPlayer.useShare(XqShare);` */
XQVideoPlayer.useShare = useShare;

export { XQVideoPlayer, VERSION, useShare };
export default XQVideoPlayer;
