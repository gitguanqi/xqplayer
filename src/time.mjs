/**
 * 秒数格式化。
 *
 * 原实现用 `s > 10` 判断补零，10 秒会输出 010；`mNum % 60 < 60` 恒真；
 * 且 NaN / 负数会拼出 "0NaN"。这里重写为纯函数并补边界兜底。
 */
export function secondToTime(second) {
    let total = Number(second);
    if (!Number.isFinite(total) || total < 0) {
        total = 0;
    }
    total = Math.floor(total);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds);
}

function pad2(num) {
    return num < 10 ? '0' + num : String(num);
}
