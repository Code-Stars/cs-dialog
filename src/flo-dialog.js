/**
 * FloDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 03-07-2018
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 */
var FloDialog = function (config) {

    this.id = Date.now();
    this.callback = null;

    this.cloak = this.renderCloakHtml();
    this.activeDialog = null;

    this.content = '';
    this.footerText = '';

    this.config = this.mergeOptions({
        debug: false,
        autoBind: true,
        cache: true,
        position: 'absolute',
        closeOnCloakClick: true,
        effect: {
            fade: false,
            fall: false
        }
    }, config);

    if (this.config.autoBind) {
        this.bindFloDialogLinks();
    }

    this.domReady(this.loadPolyFills());
};

/**
 * Merge config.
 *
 * @param obj1 {object}
 * @param obj2 {object}
 *
 * @returns {{}}
 */
FloDialog.prototype.mergeOptions = function (obj1, obj2) {
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
 * Fade's an element in.
 *
 * @param el {Element}
 * @param callback {function}
 */
FloDialog.prototype.fadeIn = function (el, callback) {

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
 * Bind events to the dialog links on the page.
 */
FloDialog.prototype.bindFloDialogLinks = function () {

    var elements = document.querySelectorAll('[data-flo-dialog]');

    for (var i = 0; i < elements.length; i++) {

        this.addEvent(elements[i], 'click', function (event) {
            event.preventDefault();

            var target = (event.currentTarget) ? event.currentTarget : event.srcElement;
            var type = target.getAttribute('data-flo-dialog');

            switch (type) {
                case 'partial':
                    this.partialHandler(target);
                    break;
                case 'hidden-element':
                    this.hiddenElementHandler(target);
                    break;
                case 'image':
                    this.imageHandler(target);
                    break;
            }

        }.bind(this));
    }
};

/**
 * Handles the 'partial' type dialogs.
 *
 * @param target {object}
 */
FloDialog.prototype.partialHandler = function (target) {
    var attributes = {
        title: target.getAttribute('data-title'),
        url: target.getAttribute('data-url')
    };

    if (attributes.url !== null && attributes.url !== '' && attributes.url !== 'javascript:' && attributes.url !== '#') {
        this.openUrl(attributes.title, attributes.url);
    }
};

/**
 * Handles the 'hidden element' type dialogs.
 *
 * @param target {object}
 */
FloDialog.prototype.hiddenElementHandler = function (target) {

    var attributes = {
        id: target.getAttribute('data-id'),
        title: target.getAttribute('data-title')
    };

    if (attributes.id !== null) {
        var hiddenContent = document.getElementById(attributes.id),
            content = document.createElement('div');

        content.appendChild(hiddenContent.firstChild.cloneNode(true));

        this.content = content.innerHTML;
        this.openDialog(attributes.title);
    }
};

/**
 * Handles the 'image' type dialogs.
 * By loading its content from an image src path.
 *
 * @param target {object}
 */
FloDialog.prototype.imageHandler = function (target) {

    var attr = {
        title: target.getAttribute('data-title'),
        imageUrl: target.getAttribute('data-image-url')
    };

    if (attr.imageUrl !== null) {
        var image = document.createElement('img');

        image.src = attr.imageUrl;
        image.className = 'flo-dialog__img';

        this.content = image.outerHTML;
        this.openDialog(attr.title);
    }
};

/**
 * Loads content or URL into a dialog.
 *
 * @param title {string}
 * @param url {string}
 * @param callback {function}
 */
FloDialog.prototype.openUrl = function (title, url, callback) {
    var obj = this;

    obj.get(url).then(function (response) {

        obj.content = response;
        obj.positionDialog();  // Re-position dialog after loading dynamic content.
        obj.openDialog(title, callback);

    }).catch(function (err) {
        console.error(err);
    });
};

/**
 * Open dialog.
 *
 * @param title {string}
 * @param callback {function=}
 */
FloDialog.prototype.openDialog = function (title, callback) {

    var obj = this;

    this.title = title;
    this.callback = callback || null;

    if (!obj.activeDialog) {
        obj.renderDialog().then(function (dialog) {
            obj.positionDialog();

            if (typeof callback === 'function')
                callback();

        }).catch(function (error) {
            console.error(error);
        });
    } else {
        obj.resetContent();
        obj.updateActiveDialog().then(function () {
            obj.positionDialog();
        });
    }
};

/**
 * Creates a new dialog DOM element.
 */
FloDialog.prototype.renderDialog = function () {

    var dialog = this.renderDialogHtml(),
        body = document.getElementsByTagName('body')[0],
        obj = this,
        delay = 0;

    if (obj.config.debug) {
        delay = 500;
    }

    body.appendChild(dialog);

    this.activeDialog = dialog;

    return Promise.all(
        [
            obj.showDialog(),
            obj.appendTitle(obj.title),
            obj.appendContent(obj.content, delay)
        ]).then(function () {
        return dialog;
    });
};

/**
 * Update cached dialog element in DOM.
 */
FloDialog.prototype.updateActiveDialog = function () {

    var obj = this,
        delay = 0;

    if (obj.config.debug) {
        delay = 500;
    }

    return Promise.all(
        [
            this.showDialog(),
            obj.appendTitle(obj.title),
            obj.appendContent(obj.content, delay)
        ]
    ).then(function () {
        return obj.activeDialog;
    });
};

/**
 * Shows the dialog that exists in the DOM.
 * Based on the settings that were set.
 */
FloDialog.prototype.showDialog = function () {

    var dialog = this.activeDialog,
        instance = this;

    return new Promise(function (resolve, reject) {

        instance.openCloak();
        instance.positionDialog();

        if (!instance.config.effect.fade) {
            instance.runEmbeddedJs();
            resolve();
        } else {
            dialog.style.display = 'block';

            instance.fadeIn(dialog, function () {
                instance.runEmbeddedJs();
                resolve();
            });
        }
    });
};

/**
 * Positions the dialog in the center of the screen.
 * Can be changed via the settings.
 */
FloDialog.prototype.positionDialog = function () {

    var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0),
        screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        dialog = this.activeDialog;

    this.waitForElement(dialog, function () { // first wait content to be loaded in the DOM

        var maxHeight = screenHeight - screenHeight / 10;

        dialog.style.height = 'auto';  // resets to default height
        dialog.style.overflowY = 'visible';

        if (dialog.offsetHeight > maxHeight) {
            dialog.style.overflowY = 'scroll';
            dialog.style.height = maxHeight + 'px';
        }

        if (this.config.position === 'fixed') {
            positionTop = 0;
            dialog.style.position = 'fixed';
        }

        dialog.style.top = (positionTop + screenHeight / 2 - dialog.offsetHeight / 2) + 'px';

        if (this.config.debug) {
            console.log('dialog.offsetHeight: ' + dialog.offsetHeight);
            console.log('screenHeight: ' + screenHeight);
            console.log('positionTop: ' + positionTop);
            console.log('maxHeight: ' + maxHeight);
        }

    }.bind(this));
};

/**
 * Wait for element.
 *
 * @param element
 * @param callback
 */
FloDialog.prototype.waitForElement = function (element, callback) {
    var ticks = setInterval(function () {
        if (element) {
            clearInterval(ticks);
            callback();
        }
    }, 10);
};

/**
 * Close dialog.
 */
FloDialog.prototype.closeDialog = function () {

    var dialog = this.activeDialog || null;

    if (typeof dialog !== 'undefined') {

        if (this.config.effect.fade) {
            this.activeDialog.style.display = 'none';
        }

        if (!this.config.cache) {
            dialog.parentNode.removeChild(dialog);
            this.activeDialog = null;
        }
        this.closeCloak();
    }
};

/**
 * Open cloak.
 */
FloDialog.prototype.openCloak = function () {

    var screenHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);

    if (typeof this.cloak !== 'undefined') {
        this.cloak.setAttribute('style', 'height: ' + screenHeight + 'px');
        this.cloak.className = this.cloak.className.replace(/\bhide\b/g, '');
    }
};

/**
 * Close cloak.
 */
FloDialog.prototype.closeCloak = function () {

    if (typeof this.cloak !== 'undefined') {
        if (this.cloak.className.indexOf('hide') === -1) {
            this.cloak.className += ' hide';
        }
    }
};

/**
 * Append title to existing dialog DOM element.
 *
 * @param title {string}
 */
FloDialog.prototype.appendTitle = function (title) {
    var obj = this;

    if (typeof obj.activeDialog !== 'undefined') {

        return new Promise(function (resolve, reject) {

            var headerElement = obj.activeDialog.getElementsByClassName('flo-dialog__header')[0],
                titleElement;

            if (typeof headerElement !== 'undefined') {

                titleElement = headerElement.getElementsByClassName('title')[0];
                titleElement.innerHTML = title;
                resolve();

            } else {
                reject();
            }
        });
    }
};

/**
 * Append content to existing dialog DOM element.
 *
 * @param content {string}
 * @param delay
 */
FloDialog.prototype.appendContent = function (content, delay) {
    delay = delay || 0;

    var obj = this;

    if (typeof obj.activeDialog !== 'undefined') {

        return new Promise(function (resolve, reject) {

            setTimeout(function () {
                var container = obj.activeDialog.getElementsByClassName('flo-dialog__body')[0];

                if (typeof container !== 'undefined') {
                    container.innerHTML = content;
                    resolve();
                } else {
                    reject();
                }
            }, delay);
        });
    }
};

FloDialog.prototype.resetContent = function () {

    var obj = this;

    var container = obj.activeDialog.getElementsByClassName('flo-dialog__body')[0];
    container.innerHTML = obj.renderSpinnerHtml();
};

/**
 * Add event.
 *
 * @param obj {object}
 * @param type {string}
 * @param fn {function}
 */
FloDialog.prototype.addEvent = function (obj, type, fn) {

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
FloDialog.prototype.get = function (url) {

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
 * Render the HTML used for the dialog's cloak effect.
 */
FloDialog.prototype.renderCloakHtml = function () {

    var cloak = document.createElement('div'),
        body = document.getElementsByTagName('body')[0];

    cloak.className = 'flo-dialog-cloak hide';
    body.insertBefore(cloak, body.firstChild);

    // close dialog via cloak trigger
    this.addEvent(cloak, 'click', function (event) {
        if (event.target !== this.activeDialog) {
            this.closeDialog();
        }
    }.bind(this));

    return cloak;
};

/**
 * Render the container HTML used by the dialog.
 * Content gets added later.
 *
 * @returns {Element}
 */
FloDialog.prototype.renderDialogHtml = function () {

    var container = document.createElement('div'),
        containerInner = document.createElement('div'),
        containerContent = document.createElement('div'),
        header = document.createElement('header'),
        footer = document.createElement('footer');

    var headerColumn1 = document.createElement('div'),
        headerColumn2 = document.createElement('div'),
        headerTitle = document.createElement('h2'),
        headerCloseBtn = document.createElement('a'),
        headerCloseIcon = document.createElement('i');

    container.id = 'flo-dialog-' + this.id;
    container.className = 'flo-dialog hide';

    containerInner.className = 'flo-dialog__inner';
    container.appendChild(containerInner);

    header.className = 'flo-dialog__header trailer--half';
    containerInner.appendChild(header);

    headerColumn1.className = 'container container--master';
    header.appendChild(headerColumn1);

    headerTitle.className = 'title title--dialog gutters--double';
    headerColumn1.appendChild(headerTitle);

    headerColumn2.className = 'container container--slave';
    headerColumn2.style.textAlign = 'right';
    header.appendChild(headerColumn2);

    headerCloseIcon.className = 'fa fa-times';
    headerCloseBtn.appendChild(headerCloseIcon);

    headerCloseBtn.href = 'JavaScript:;';
    headerCloseBtn.className = 'flo-dialog__close-btn gutters--double';
    headerColumn2.appendChild(headerCloseBtn);
    this.addEvent(headerCloseBtn, 'click', this.closeDialog.bind(this));

    containerContent.className = 'flo-dialog__body gutters--double';
    containerContent.innerHTML = this.renderSpinnerHtml();
    containerInner.appendChild(containerContent);

    footer.className = 'flo-dialog__footer gutters--double leader-inside--half';
    footer.innerHTML = this.footerText !== '' ? this.footerText : '&copy; FloDialog ' + (new Date()).getFullYear() + '. All rights reserved.';
    containerInner.appendChild(footer);

    return container;
};

/**
 * Run Javascript that is embedded in the dialog.
 */
FloDialog.prototype.runEmbeddedJs = function () {
    var scripts = this.activeDialog.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
        eval(scripts[i].text);
    }
};

/**
 * Set footer text.
 *
 * @param text {string}
 */
FloDialog.prototype.setFooterText = function (text) {
    this.footerText = text;
};

/**
 * Load spinner HTML.
 *
 * @returns {string}
 */
FloDialog.prototype.renderSpinnerHtml = function () {
    return '<svg class="flo-dialog__spinner" viewBox="0 0 100 100" width="20" height="20"> ' +
        '<circle cx="50" cy="50" r="42" transform="rotate(-90,50,50)" />' +
        '</svg>';
};

/**
 * IE: load polyfill for Promise object.
 */
FloDialog.prototype.loadPolyFills = function () {

    if (this.isIe()) {
        var polyfill = document.createElement("script"),
            head = document.getElementsByTagName('head')[0];

        polyfill.type = 'text/javascript';
        polyfill.src = 'https://cdn.jsdelivr.net' +
            '/npm/promise-polyfill@8/dist/polyfill.min.js';

        head.insertBefore(polyfill, head.firstChild);
    }
};

/**
 * Checks if the current browser is Internet Explorer.
 * @returns {boolean}
 */
FloDialog.prototype.isIe = function () {
    return window.navigator.userAgent.indexOf("MSIE ") > 0
        || !!navigator.userAgent.match(/Trident.*rv\:11\./);
};

/**
 * Checks if the DOM is ready.
 * @param fn {function}
 */
FloDialog.prototype.domReady = function (fn) {

    if (document.readyState !== 'loading') {
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState !== 'loading')
                fn();
        });
    }
};
