/**
 * 包入口：只在这里汇总导出，构建脚本据此产出 UMD / ESM 两种包装。
 */
import { XQVideoPlayer } from './player.mjs';
import { VERSION } from './config.mjs';

XQVideoPlayer.version = VERSION;

export { XQVideoPlayer, VERSION };
export default XQVideoPlayer;
