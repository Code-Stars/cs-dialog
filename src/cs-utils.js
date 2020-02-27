/**
 * CsUtils object.
 */
var CsUtils = {};

/**
 * Checks if the current browser is Internet Explorer.
 *
 * @returns {boolean}
 */
CsUtils.isIe = function () {
    return window.navigator.userAgent.indexOf("MSIE ") > 0
        || !!navigator.userAgent.match(/Trident.*rv\:11\./);
};

/**
 * Checks if the DOM is ready.
 *
 * @param callback {function}
 */
CsUtils.isDomReady = function (callback) {
    /in/.test(document.readyState) ? setTimeout(function () {
        CsUtils.isDomReady(callback);
    }, 10) : callback()
};

/**
 * Load polyfill if Promise object is not supported
 * as soon as the head tag is loaded.
 */
CsUtils.loadPolyFills = function () {
    if (typeof Promise === 'undefined' && document.getElementById('script-promise-polyfill') === null) {

        CsUtils.waitForElement(document.getElementsByTagName('head')[0], function (head) {
            var script = document.createElement("script");

            script.type = 'text/javascript';
            script.src = 'https://cdn.jsdelivr.net' +
                '/npm/promise-polyfill@8/dist/polyfill.min.js';
            script.id = 'script-promise-polyfill';

            head.insertBefore(script, head.firstChild);
        });
    }
};

/**
 * Wait for poly fill to load.
 *
 * @param callback {function}
 */
CsUtils.waitForPolyfillsToLoad = function (callback) {
    if (typeof Promise === 'undefined') {
        CsUtils.loadPolyFills();
        console.info('Waiting for Promise polyfill to load...');

        setTimeout(function () {
            CsUtils.waitForPolyfillsToLoad(callback);
        }.bind(this), 50);

    } else {
        callback();
    }
};

/**
 * Add event.
 *
 * @param obj {object}
 * @param type {string}
 * @param fn {function}
 */
CsUtils.addEvent = function (obj, type, fn) {

    if (obj.attachEvent) {
        obj['e' + type + fn] = fn;
        obj[type + fn] = function () {
            obj['e' + type + fn](window.event);
        };
        obj.attachEvent('on' + type, obj[type + fn]);
    } else
        obj.addEventListener(type, fn, false);
};

/**
 * Performs a GET HTTP-request.
 *
 * @param url {string}
 */
CsUtils.get = function (url) {

    var requestPromise = new Promise(function (resolve, reject) {

        var req = new XMLHttpRequest();
        req.open('GET', url);
        req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        req.onload = function () {
            if (req.status === 200) {
                resolve(req.response);
            } else {
                reject(Error(req.statusText));
            }
        };

        req.send();
    });

    return Promise.all([requestPromise]).then(function (results) {
        return results[0];
    });
};

/**
 * Wait for element.
 *
 * @param element
 * @param callback
 */
CsUtils.waitForElement = function (element, callback) {
    var ticks = setInterval(function () {
        if (element) {
            clearInterval(ticks);
            callback(element);
        }
    }, 10);
};

/**
 * Fade's an element in.
 *
 * @param el {Element}
 * @param callback {function}
 */
CsUtils.fadeIn = function (el, callback) {

    el.style.opacity = 0;

    var tick = function () {
        el.style.opacity = +el.style.opacity + 0.05;

        if (+el.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16)
        } else {
            if (typeof callback === 'function')
                callback();
        }
    };
    tick();
};

/**
 * Merge objects.
 *
 * @param obj1 {object}
 * @param obj2 {object}
 *
 * @returns {{}}
 */
CsUtils.mergeOptions = function (obj1, obj2) {
    var obj3 = {};

    for (var attrName in obj1) {
        if (obj1.hasOwnProperty(attrName)) {
            obj3[attrName] = obj1[attrName];
        }
    }
    for (var attrName2 in obj2) {
        if (obj2.hasOwnProperty(attrName2)) {
            obj3[attrName2] = obj2[attrName2];
        }
    }
    return obj3;
};

/**
 * Run Javascript that is embedded in the dialog.
 *
 * @param {Element} container
 */
CsUtils.runEmbeddedJs = function (container) {
    if (typeof container !== 'undefined') {

        var scripts = container.getElementsByTagName('script');

        for (var i = 0; i < scripts.length; i++) {
            eval(scripts[i].text);
        }
    }
};