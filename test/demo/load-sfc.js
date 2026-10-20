/**
 * 在浏览器里直接加载并挂载 lib/vue/index.vue。
 *
 * 浏览器不能解析 .vue，所以这里用 sfc-loader 家族（vue2-sfc-loader / vue3-sfc-loader）
 * 在运行时完成「template 编译 + less 编译 + 样式注入」。
 * 这些运行时从 CDN 取，取不到时整页 SKIP —— 宁可不测，也不假报失败。
 *
 * 页面依赖（都从 CDN）：
 *   less.min.js          -> 编译 <style lang="less">
 *   vue@2.7 / vue@3      -> 运行时
 *   vue2-sfc-loader / vue3-sfc-loader
 */
(function () {
    var SFC_URL = '../lib/vue/index.vue';
    var SCRIPT_TIMEOUT = 12000;

    function loadScript(url) {
        return new Promise(function (resolve, reject) {
            var el = document.createElement('script');
            el.src = url;
            el.async = false;
            el.onload = function () {
                resolve(url);
            };
            el.onerror = function () {
                reject(new Error('加载失败：' + url));
            };
            setTimeout(function () {
                reject(new Error('加载超时：' + url));
            }, SCRIPT_TIMEOUT);
            document.head.appendChild(el);
        });
    }

    /** 依次尝试多个 CDN，全部失败才算 SKIP */
    function loadScriptAny(urls) {
        return urls.reduce(function (chain, url) {
            return chain.catch(function () {
                return loadScript(url);
            });
        }, Promise.reject(new Error('no url')));
    }

    function makeOptions(deps) {
        return {
            moduleCache: deps,
            getFile: function (url) {
                return fetch(url).then(function (res) {
                    if (!res.ok) throw new Error(url + ' -> ' + res.status);
                    return res.text();
                });
            },
            addStyle: function (textContent) {
                var style = document.createElement('style');
                style.textContent = textContent;
                document.head.appendChild(style);
            },
            log: function () {},
        };
    }

    /**
     * @param {object} cfg
     * @param {string[]} cfg.vueUrls      Vue 运行时下载地址
     * @param {string[]} cfg.lessUrls     less 下载地址
     * @param {string[]} cfg.loaderUrls   sfc-loader 下载地址
     * @param {string}   cfg.loaderGlobal window 上的 loader 全局名
     * @param {string}   cfg.vueGlobal    window 上的 Vue 全局名
     * @param {function} cfg.bootstrap    (Vue, Component) => void，真正挂载的地方
     * @param {object}   cfg.check        XQCheck
     */
    window.XqSfcRunner = function (cfg) {
        var check = cfg.check;

        Promise.resolve()
            .then(function () {
                return loadScriptAny(cfg.vueUrls);
            })
            .then(function () {
                return loadScriptAny(cfg.lessUrls);
            })
            .then(function () {
                return loadScriptAny(cfg.loaderUrls);
            })
            .then(function () {
                var Vue = window[cfg.vueGlobal];
                var loader = window[cfg.loaderGlobal];
                if (!Vue || !loader || typeof loader.loadModule !== 'function') {
                    throw new Error('sfc-loader 未就绪');
                }
                return Promise.resolve()
                    .then(function () {
                        return loader.loadModule(SFC_URL, makeOptions({ vue: Vue, less: window.less }));
                    })
                    .catch(function () {
                        // 某些 loader 版本要求同步传入模块对象而不是 Promise
                        return loader.loadModule(SFC_URL, makeOptions({ vue: Vue, less: window.less }));
                    })
                    .then(function (component) {
                        cfg.bootstrap(Vue, component);
                    });
            })
            .catch(function (error) {
                check.skip('Vue ' + cfg.label + ' 自检', '依赖不可用（' + error.message + '）');
            });
    };
})();
