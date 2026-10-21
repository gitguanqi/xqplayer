/**
 * 测试页专用：把 xqshare 的样式与 UMD 产物加载进来，让分享按钮真的能用。
 *
 * 顺序：本地 node_modules 优先（离线可用，`npm i` 后一定在），取不到再退 CDN。
 * 加载失败不会让页面报错 —— 播放器会降级成一句提示，这正是要验的行为之一。
 */
(function () {
    var VERSION = '0.1.2';
    var LOCAL = '../node_modules/xqshare/lib';
    var CDNS = ['https://cdn.jsdelivr.net/npm/xqshare@' + VERSION, 'https://unpkg.com/xqshare@' + VERSION];

    var CSS = [LOCAL + '/css/xqshare.min.css'].concat(
        CDNS.map(function (base) {
            return base + '/css/xqshare.min.css';
        })
    );
    var JS = [LOCAL + '/js/xqshare.min.js'].concat(
        CDNS.map(function (base) {
            return base + '/js/xqshare.min.js';
        })
    );

    function loadCss(index) {
        if (index >= CSS.length) {
            return Promise.reject(new Error('xqshare 样式不可用'));
        }
        return new Promise(function (resolve, reject) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = CSS[index];
            link.onload = function () {
                resolve(link.href);
            };
            link.onerror = function () {
                loadCss(index + 1).then(resolve, reject);
            };
            document.head.appendChild(link);
        });
    }

    function loadJs(index) {
        if (index >= JS.length) {
            return Promise.reject(new Error('xqshare 脚本不可用'));
        }
        return new Promise(function (resolve, reject) {
            var el = document.createElement('script');
            el.src = JS[index];
            el.async = false;
            el.onload = function () {
                if (window.XqShare) {
                    resolve(el.src);
                } else {
                    loadJs(index + 1).then(resolve, reject);
                }
            };
            el.onerror = function () {
                loadJs(index + 1).then(resolve, reject);
            };
            document.head.appendChild(el);
        });
    }

    /** @returns {Promise<void>} 失败也 resolve（降级路径要能演示） */
    window.XqLoadShare = function () {
        if (window.XqShare) {
            return Promise.resolve();
        }
        return loadCss(0)
            .catch(function () {
                return null;
            })
            .then(function () {
                return loadJs(0);
            })
            .then(function () {
                window.__xqShareLoaded = true;
            })
            .catch(function (error) {
                window.__xqShareError = error.message;
            });
    };
})();
