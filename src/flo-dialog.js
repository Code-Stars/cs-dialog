/**
 * FloDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 15-11-2017
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 */
var FloDialog = function (config) {

    this.id = Date.now();
    this.cloak = this.renderCloakHtml();
    this.activeDialog = null;
    this.content = null;
    this.footerText = '';

    this.config = this.mergeOptions({
        cache: true,
        position: 'absolute',
        closeOnCloakClick: true,
        effect: {
            fade: false,
            fall: false
        }
    }, config);

    // bind triggers found in DOM
    this.bindTriggers();
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
 * @param callback {function=}
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
 * Bind events to the elements.
 */
FloDialog.prototype.bindTriggers = function () {

    var triggers = document.querySelectorAll('[data-dialog="flo-dialog"]');

    for (var i = 0; i < triggers.length; i++) {

        this.addEvent(triggers[i], "click", function (event) {
            event.preventDefault();

            var target = (event.currentTarget) ? event.currentTarget : event.srcElement,
                content = document.createElement('div');

            var attr = { // all possible flo-dialog element attributes
                id: target.getAttribute('data-id'),
                title: target.getAttribute('data-title'),
                url: target.getAttribute('data-url'),
                imageUrl: target.getAttribute('data-image-url')
            };

            // load content from hidden element
            if (attr.id !== null) {
                var hiddenContent = document.getElementById(attr.id);
                content.appendChild(hiddenContent.firstChild.cloneNode(true));

                this.setContent(content);
                this.openDialog(attr.title);
            }

            // load content from image src
            if (attr.imageUrl !== null) {
                var image = this.loadImageContent(attr.imageUrl);
                content.appendChild(image);

                this.setContent(content);
                this.openDialog(attr.title);
            }

            // load content from URL (asynchronous)
            if (attr.url !== null && attr.url !== '' && attr.url !== "javascript:" && attr.url !== '#') {
                this.openUrl(attr.title, attr.url, null);
            }

        }.bind(this), false);
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

    var message = document.createElement('span');
    var content = document.createElement('div');

    message.textContent = 'Loading...';
    content.appendChild(message);

    this.get(url, function (response) {

        content.innerHTML = response.data;

        this.waitForElement(content, function () {

            this.setContent(content);

            // re-position dialog after loading dynamic content
            this.positionDialog();
            this.openDialog(title);

            if (typeof callback === 'function') {
                callback();
            }
        }.bind(this));

    }.bind(this));
};

/**
 * Open dialog.
 *
 * @param title {string}
 * @param callback {function=}
 */
FloDialog.prototype.openDialog = function (title, callback) {

    var dialog = this.renderContainerHtml(this.content),
        body = document.getElementsByTagName('body')[0];

    body.appendChild(dialog);

    this.initCloseTriggers(dialog);

    if (typeof dialog !== 'undefined') {

        this.activeDialog = dialog;
        this.openCloak();

        // first position dialog
        this.positionDialog(function () {

            // then show dialog based on fade setting
            if (!this.config.effect.fade) {
                dialog.className = dialog.className.replace(/\bhide\b/, '');

                if (typeof callback === 'function')
                    callback();
            } else {
                this.fadeIn(dialog, function () {
                    if (typeof callback === 'function')
                        callback();
                });
            }
            this.appendTitle(title);

        }.bind(this));
    }
};

FloDialog.prototype.positionDialog = function (callback) {

    var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0),
        screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    var dialog = this.activeDialog;

    this.waitForElement(dialog, function () { // first wait content to be loaded in the DOM
        dialog.style.top = (positionTop + screenHeight / 2 - dialog.offsetHeight / 2) + "px";

        if (this.config.position === 'fixed') {
            dialog.style.position = 'fixed';
        }

        if (typeof callback === 'function') {
            callback();
        }
    }.bind(this));
};

/**
 * Wait for element.
 * @param element
 * @param callback
 */
FloDialog.prototype.waitForElement = function (element, callback) {
    var poops = setInterval(function () {
        if (element) {
            clearInterval(poops);
            callback();
        }
    }, 10);
};

/**
 * Initialize close triggers for opened dialog.
 *
 * @param dialog
 */
FloDialog.prototype.initCloseTriggers = function (dialog) {

    var closeTriggers = dialog.getElementsByClassName('flo-dialog__close-btn');

    for (var j = 0; j < closeTriggers.length; j++) {

        this.addEvent(closeTriggers[j], "click", function () {
            this.closeDialog(this.activeDialog);

        }.bind(this), false);
    }

    // close dialog via cloak trigger
    if (typeof this.cloak !== 'undefined' && this.config.closeOnCloakClick) {
        this.addEvent(this.cloak, "click", function (event) {
            if (event.target !== this.activeDialog) {
                this.closeDialog(this.activeDialog);
            }
        }.bind(this), false);
    }
};

/**
 * Close dialog.
 * @param dialog
 */
FloDialog.prototype.closeDialog = function (dialog) {

    if (typeof dialog !== 'undefined') {

        if (this.config.cache) {
            dialog.style.display = 'none';
        } else {
            dialog.parentNode.removeChild(dialog);
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
        this.cloak.setAttribute("style", "height: " + screenHeight + "px");
        this.cloak.className = this.cloak.className.replace(/\bhide\b/g, "");
    }
};


/**
 * Close cloak.
 */
FloDialog.prototype.closeCloak = function () {

    if (typeof this.cloak !== 'undefined') {
        if (this.cloak.className.indexOf('hide') === -1) {
            this.cloak.className += " hide";
        }
    }
};

/**
 * Append title to dialog DOM element.
 *
 * @param title {string}
 */
FloDialog.prototype.appendTitle = function (title) {
    if (typeof this.activeDialog !== 'undefined') {

        var header,
            titleEl;

        header = this.activeDialog.getElementsByClassName('flo-dialog__header')[0];
        if (typeof header !== 'undefined') {
            titleEl = header.getElementsByClassName('title')[0];
            titleEl.innerHTML = title;
        }
    }
};

/**
 * Add event (IE fallback).
 * @param obj
 * @param type
 * @param fn
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

FloDialog.prototype.loadImageContent = function (src) {

    var image = document.createElement('img');

    image.src = src;
    image.className = 'flo-dialog__img';

    return image;
};

FloDialog.prototype.get = function (url, callback) {

    var xhr = new XMLHttpRequest(),
        response = {};

    xhr.open('GET', url);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.onload = function () {
        if (xhr.status === 200) {
            response.data = xhr.responseText;
            callback(response);
        } else {
            console.error('Request failed.  Returned status of ' + xhr.status);
        }
    };

    xhr.send();
};

/**
 * Render the HTML used for the dialog's cloak effect.
 */
FloDialog.prototype.renderCloakHtml = function () {
    var cloak = document.createElement('div'),
        body = document.getElementsByTagName('body')[0];

    cloak.className = 'flo-dialog-cloak hide';
    body.insertBefore(cloak, body.firstChild);

    return cloak;
};

/**
 * Render the container HTML used by the dialog.
 * Content gets added later.
 *
 * @param content {Element=}
 * @returns {Element}
 */
FloDialog.prototype.renderContainerHtml = function (content) {
    content = content || document.createElement('div');

    var container = document.createElement('div'),
        header = document.createElement('header'),
        footer = document.createElement('footer');

    var headerColumn1 = document.createElement('div'),
        headerColumn2 = document.createElement('div'),
        headerTitle = document.createElement('h2'),
        headerCloseBtn = document.createElement('a'),
        headerCloseIcon = document.createElement('i');

    container.id = 'flo-dialog-' + this.id;
    container.className = 'flo-dialog hide';

    header.className = 'flo-dialog__header trailer--half';
    container.appendChild(header);

    headerColumn1.className = 'container container--master';
    header.appendChild(headerColumn1);

    headerTitle.className = 'title title--section gutters--double';
    headerTitle.innerHTML = 'No title was set!';
    headerColumn1.appendChild(headerTitle);

    headerColumn2.className = 'container container--slave';
    headerColumn2.style.textAlign = 'right';
    header.appendChild(headerColumn2);

    headerCloseIcon.className = 'fa fa-times';
    headerCloseBtn.appendChild(headerCloseIcon);

    headerCloseBtn.href = 'JavaScript:;';
    headerCloseBtn.className = 'flo-dialog__close-btn gutters--double';
    headerColumn2.appendChild(headerCloseBtn);

    content.className = 'flo-dialog__body gutters--double';
    container.appendChild(content);

    footer.className = 'flo-dialog__footer gutters--double leader-inside--half';
    footer.innerHTML = this.footerText !== '' ? this.footerText : '&copy; FloDialog 2017. All rights reserved.';
    container.appendChild(footer);

    return container;
};

/**
 * Set dialog content;
 *
 * @param content
 */
FloDialog.prototype.setContent = function (content) {
    this.content = content;
};

/**
 * Set footer text.
 *
 * @param text {string}
 */
FloDialog.prototype.setFooterText = function (text) {
    this.footerText = text;
};