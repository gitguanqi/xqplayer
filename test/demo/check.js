/**
 * 自检页用的小框架。
 *
 * 这些页面在真实浏览器里跑，验证的东西和 node:test 不同：
 * 真媒体事件、真 CSSOM、真 pointer 交互。所以这里只做三件事：
 *   1. 收集 PASS / FAIL / SKIP 输出到页面，不用再开 devtools；
 *   2. 把页面上的 console.error 也捕获下来，任何未处理的报错都算失败；
 *   3. 汇总成 XQ_SUMMARY 全局变量，方便将来接入无头浏览器时直接读取。
 */
(function () {
    var results = [];
    var container = null;
    var summaryEl = null;

    function ensureContainer() {
        if (container) return container;
        container = document.querySelector('[data-xq-report]');
        if (!container) {
            container = document.createElement('pre');
            container.setAttribute('data-xq-report', '');
            document.body && document.body.appendChild(container);
        }
        summaryEl = document.createElement('div');
        summaryEl.className = 'summary running';
        summaryEl.textContent = '自检中…';
        container.insertBefore(summaryEl, container.firstChild);
        return container;
    }

    function push(status, name, detail) {
        results.push({ status: status, name: name, detail: detail || '' });
        window.XQ_SUMMARY = results;
        render();
    }

    function escapeHtml(text) {
        return String(text).replace(/[&<>"]/g, function (ch) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
        });
    }

    function render() {
        ensureContainer();
        var total = results.length;
        var passed = results.filter(function (r) { return r.status === 'PASS'; }).length;
        var failed = results.filter(function (r) { return r.status === 'FAIL'; }).length;
        var skipped = results.filter(function (r) { return r.status === 'SKIP'; }).length;
        summaryEl.className = 'summary ' + (failed ? 'bad' : 'good');
        summaryEl.innerHTML =
            'PASS ' + passed + ' / FAIL ' + failed + ' / SKIP ' + skipped + ' （共 ' + total + '）';

        var list = document.createElement('div');
        list.innerHTML = results
            .map(function (r) {
                return (
                    '<div class="line ' + r.status.toLowerCase() + '">' +
                    '<b>' + r.status + '</b> ' + escapeHtml(r.name) +
                    (r.detail ? '<span class="detail"> — ' + escapeHtml(r.detail) + '</span>' : '') +
                    '</div>'
                );
            })
            .join('');
        var old = container.querySelector('.lines');
        if (old) container.removeChild(old);
        list.className = 'lines';
        container.appendChild(list);
    }

    function assert(name, fn) {
        try {
            var maybe = fn();
            if (maybe === false) throw new Error('断言为 false');
            push('PASS', name);
        } catch (error) {
            push('FAIL', name, (error && error.message) || String(error));
        }
    }

    function skip(name, reason) {
        push('SKIP', name, reason);
    }

    function assertEqual(name, actual, expected) {
        assert(name, function () {
            if (actual !== expected) {
                throw new Error('期望 ' + JSON.stringify(expected) + '，实际 ' + JSON.stringify(actual));
            }
        });
    }

    // 页面里任何未被捕获的报错都计入失败
    window.addEventListener('error', function (event) {
        push('FAIL', '未捕获错误', event.message);
    });
    window.addEventListener('unhandledrejection', function (event) {
        push('FAIL', '未处理的 Promise 拒绝', String(event.reason));
    });

    window.XQCheck = { assert: assert, skip: skip, equal: assertEqual, results: results };
})();
