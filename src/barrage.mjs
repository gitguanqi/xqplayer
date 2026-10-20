/**
 * 弹幕列表的归一化与渲染。
 *
 * 原实现把 `item.content` 直接拼进 `innerHTML`，用户输入即 HTML（XSS），
 * 并且每次重渲染都重新 randomColor()，颜色会闪。这里改成 createElement + textContent，
 * 颜色只在归一化时算一次并持久化。
 */
import { randomColor, randomUserName } from './color.mjs';

/** 把外部传入的弹幕数组归一化成内部结构；颜色与昵称只在这里生成一次 */
export function normalizeBarrages(list) {
    const source = Array.isArray(list) ? list : [];
    const result = [];
    for (let i = 0; i < source.length; i += 1) {
        const item = source[i];
        if (!item || typeof item !== 'object') {
            continue;
        }
        result.push(normalizeBarrage(item));
    }
    return result;
}

/** 单个弹幕归一化（发送新弹幕时复用） */
export function normalizeBarrage(item) {
    return {
        id: item.id,
        avatar: typeof item.avatar === 'string' ? item.avatar : '',
        name: item.name ? String(item.name) : randomUserName(),
        content: item.content == null ? '' : String(item.content),
        bg: item.bg || randomColor(),
    };
}

/**
 * 渲染弹幕列表。
 * 全部节点都用 createElement 构造、文本走 textContent，因此 `content` 里的标签只会显示成文本。
 */
export function renderBarrage(doc, container, list) {
    if (!container) {
        return;
    }
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    for (let i = 0; i < list.length; i += 1) {
        container.appendChild(createBarrageItem(doc, list[i]));
    }
}

function createBarrageItem(doc, item) {
    const li = doc.createElement('li');

    if (item.avatar) {
        const img = doc.createElement('img');
        img.setAttribute('src', item.avatar);
        img.setAttribute('alt', item.name);
        li.appendChild(img);
    }

    const name = doc.createElement('span');
    name.textContent = item.name;
    li.appendChild(name);

    const content = doc.createElement('small');
    content.style.color = item.bg;
    content.textContent = item.content;
    li.appendChild(content);

    return li;
}
