/**
 * 弹幕用的随机色与随机昵称。
 *
 * 原实现有两点问题：
 * 1. `#${r.toString(16)}` 在分量小于 0x10 时会拼出 5 位十六进制（如 #ff1a2），颜色非法；
 * 2. `parseInt(Math.random(0, 1000000) * 100)` —— Math.random 不接收参数，语义是错的。
 */
export function randomColor() {
    return (
        '#' +
        hex(randomChannel()) +
        hex(randomChannel()) +
        hex(randomChannel())
    );
}

/** 亮色下限 120，保证在深色播放器上可读 */
function randomChannel() {
    const value = Math.floor(Math.random() * 256);
    return value < 120 ? 120 : value;
}

function hex(value) {
    return value.toString(16).padStart(2, '0');
}

/** 生成 0-99 的昵称后缀 */
export function randomUserName() {
    return '用户' + Math.floor(Math.random() * 100);
}
