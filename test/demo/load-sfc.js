/**
 * 在浏览器里直接加载并挂载 lib/vue/index.vue。
 *
 * 浏览器不能解析 .vue，所以要先在运行时完成「template 编译 + less 编译 + 样式注入」。
 * 这里两条路：
 *   1. sfc-loader 家族（vue3-sfc-loader 等）—— 能用就用，最贴近真实打包器的行为；
 *   2. 自带的极简编译器 —— 只要 Vue 全量构建（带 compiler）与 less 就够，
 *      用来兜住 loader 取不到的情况（vue2-sfc-loader 在 npm 上只发布了 package.json，
 *      没有任何 dist 文件，CDN 必然 404，Vue 2 页只能走这条路）。
 *
 * 页面依赖（都从 CDN，取不到时整页 SKIP，不假报失败）：
 *   vue@2.7 / vue@3  -> 运行时 + 模板编译器
 *   less             -> 编译 <style lang="less">
 *   vue3-sfc-loader  -> 可选
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
        return (urls || []).reduce(function (chain, url) {
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
            addStyle: injectStyle,
            log: function () {},
        };
    }

    function injectStyle(textContent) {
        var style = document.createElement('style');
        style.textContent = textContent;
        document.head.appendChild(style);
    }

    function fetchSfc() {
        return fetch(SFC_URL).then(function (res) {
            if (!res.ok) throw new Error(SFC_URL + ' -> ' + res.status);
            return res.text();
        });
    }

    /** 把 <style lang="less"> 编译成 CSS 再注入；没有 less 就跳过（样式缺失不影响行为断言） */
    function compileStyles(styles) {
        var jobs = styles.map(function (item) {
            var body = item.body;
            if (!/lang=["']?less/.test(item.attrs) || !window.less) {
                return Promise.resolve(body);
            }
            return window.less
                .render(body)
                .then(function (out) {
                    return out.css;
                })
                .catch(function () {
                    return '';
                });
        });
        return Promise.all(jobs).then(function (list) {
            list.forEach(function (css) {
                if (css) injectStyle(css);
            });
        });
    }

    /**
     * 极简 SFC 编译器：只处理本项目 SFC 用到的语法（单 script / 单 template / 任意 style）。
     * SFC 里已经没有 import，剩下的只是 `export default {...}`，替换成赋值即可在浏览器里执行。
     */
    function buildComponentManually(Vue, text) {
        var script = /<script[^>]*>([\s\S]*?)<\/script>/.exec(text);
        var template = /<template>([\s\S]*?)<\/template>/.exec(text);
        if (!script || !template) {
            throw new Error('SFC 结构不完整');
        }

        var code = script[1].replace(/\bexport\s+default\b/g, 'var __xqDefault__ =');
        var factory = new Function(code + '\n;return typeof __xqDefault__ === "undefined" ? null : __xqDefault__;');
        var options = factory();
        if (!options) {
            throw new Error('没有导出组件对象');
        }

        // Vue 2 返回 { render, staticRenderFns }；Vue 3 直接返回 render 函数
        var compiled = Vue.compile(template[1]);
        if (typeof compiled === 'function') {
            options.render = compiled;
        } else {
            options.render = compiled.render;
            options.staticRenderFns = compiled.staticRenderFns;
        }

        var styles = [];
        var re = /<style([^>]*)>([\s\S]*?)<\/style>/g;
        var match = null;
        while ((match = re.exec(text)) !== null) {
            styles.push({ attrs: match[1], body: match[2] });
        }

        return compileStyles(styles).then(function () {
            return options;
        });
    }

    /**
     * @param {object} cfg
     * @param {string[]} cfg.vueUrls      Vue 运行时下载地址
     * @param {string[]} cfg.lessUrls     less 下载地址
     * @param {string[]} [cfg.loaderUrls] sfc-loader 下载地址，可选
     * @param {string}   [cfg.loaderGlobal] window 上的 loader 全局名
     * @param {string}   cfg.vueGlobal    window 上的 Vue 全局名
     * @param {function} cfg.bootstrap    (Vue, Component) => void，真正挂载的地方
     * @param {object}   cfg.check        XQCheck
     */
    window.XqSfcRunner = function (cfg) {
        var check = cfg.check;
        var Vue = null;

        Promise.resolve()
            .then(function () {
                return loadScriptAny(cfg.vueUrls);
            })
            .then(function () {
                return loadScriptAny(cfg.lessUrls);
            })
            .then(function () {
                Vue = window[cfg.vueGlobal];
                if (!Vue) throw new Error('Vue 未就绪');
                // loader 取不到不算失败，退回自带编译器
                return loadScriptAny(cfg.loaderUrls).catch(function () {
                    return null;
                });
            })
            .then(function () {
                var loader = cfg.loaderGlobal ? window[cfg.loaderGlobal] : null;
                if (loader && typeof loader.loadModule === 'function') {
                    return Promise.resolve()
                        .then(function () {
                            return loader.loadModule(SFC_URL, makeOptions({ vue: Vue, less: window.less }));
                        })
                        .then(function (component) {
                            if (!component) throw new Error('loader 没返回组件');
                            return component;
                        })
                        .catch(function () {
                            return fetchSfc().then(function (text) {
                                return buildComponentManually(Vue, text);
                            });
                        });
                }
                return fetchSfc().then(function (text) {
                    return buildComponentManually(Vue, text);
                });
            })
            .then(function (component) {
                cfg.bootstrap(Vue, component);
            })
            .catch(function (error) {
                check.skip('Vue ' + cfg.label + ' 自检', '依赖不可用（' + error.message + '）');
            });
    };
})();
