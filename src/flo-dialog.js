/**
 * FloDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 03-12-2017
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
    this.bindFloDialogLinks();
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

        }.bind(this), false);
    }
};

/**
 * Handles the 'partial' type dialogs.
 *
 * @param target
 */
FloDialog.prototype.partialHandler = function (target) {
    var attributes = {
        title: target.getAttribute('data-title'),
        url: target.getAttribute('data-url')
    };

    if (attributes.url !== null && attributes.url !== '' && attributes.url !== 'javascript:' && attributes.url !== '#') {
        this.openUrl(attributes.title, attributes.url, null);
    }
};

/**
 * Handles the 'hidden element' type dialogs.
 *
 * @param target
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

        this.content = content;
        this.openDialog(attributes.title);
    }
};

/**
 * Handles the 'image' type dialogs.
 *
 * @param target
 */
FloDialog.prototype.imageHandler = function (target) {
    var content = document.createElement('div');

    var attr = { // all possible flo-dialog element attributes
        title: target.getAttribute('data-title'),
        imageUrl: target.getAttribute('data-image-url')
    };

    // load content from image src
    if (attr.imageUrl !== null) {
        var image = this.loadImageContent(attr.imageUrl);
        content.appendChild(image);

        this.content = content;
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

    var message = document.createElement('span');
    var content = document.createElement('div');

    message.textContent = 'Loading...';
    content.appendChild(message);

    this.get(url, function (response) {

        content.innerHTML = response.data;

        this.waitForElement(content, function () {

            this.content = content;

            // Re-position dialog after loading dynamic content.
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

    this.title = title;
    this.callback = callback;

    if (!this.activeDialog) {
        this.renderDialog();
    } else {
        this.updateActiveDialog();
    }
};

/**
 * Creates a new dialog DOM element.
 */
FloDialog.prototype.renderDialog = function () {

    var dialog = this.renderContainerHtml(this.content),
        body = document.getElementsByTagName('body')[0];

    body.appendChild(dialog);

    if (typeof dialog !== 'undefined') {
        this.activeDialog = dialog;

        this.appendTitle(this.title);
        this.showDialog();
    }
};

/**
 * Update cached dialog element in DOM.
 */
FloDialog.prototype.updateActiveDialog = function () {

    this.appendContent(this.content);
    this.appendTitle(this.title);
    this.showDialog();
};

/**
 * Shows the dialog that exists in the DOM.
 * Based on the settings that were set.
 */
FloDialog.prototype.showDialog = function () {

    var dialog = this.activeDialog;
    var callback = this.callback;

    dialog.className = dialog.className.replace(/\bhide\b/, '');
    this.openCloak();
    this.positionDialog();

    if (!this.config.effect.fade) {
        if (typeof callback === 'function')
            callback();
    } else {
        dialog.style.display = 'block';

        this.fadeIn(dialog, function () {
            if (typeof callback === 'function') {
                callback();
            }
        }.bind(this));
    }
};

/**
 * Positions the dialog in the center of the screen.
 * Can be changed via the settings.
 *
 * @param callback
 */
FloDialog.prototype.positionDialog = function (callback) {

    var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0),
        screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    var dialog = this.activeDialog;

    this.waitForElement(dialog, function () { // first wait content to be loaded in the DOM

        var maxHeight = screenHeight - screenHeight / 10;
        if (dialog.offsetHeight > maxHeight) {
            dialog.style.overflowY = 'scroll';
            dialog.style.height = maxHeight + 'px';
        }

        dialog.style.top = (positionTop + screenHeight / 2 - dialog.offsetHeight / 2) + 'px';

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
 * Append content to existing dialog DOM element.
 *
 * @param content {Element}
 */
FloDialog.prototype.appendContent = function (content) {

    if (typeof this.activeDialog !== 'undefined') {

        var container = this.activeDialog.getElementsByClassName('flo-dialog__body')[0];

        if (typeof container !== 'undefined') {
            container.innerHTML = '';
            container.appendChild(content);
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

    // close dialog via cloak trigger
    this.addEvent(cloak, 'click', function (event) {
        if (event.target !== this.activeDialog) {
            this.closeDialog();
        }
    }.bind(this), false);

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
    this.addEvent(headerCloseBtn, 'click', this.closeDialog.bind(this));

    content.className = 'flo-dialog__body gutters--double';
    container.appendChild(content);

    footer.className = 'flo-dialog__footer gutters--double leader-inside--half';
    footer.innerHTML = this.footerText !== '' ? this.footerText : '&copy; FloDialog 2017. All rights reserved.';
    container.appendChild(footer);

    return container;
};

/**
 * Set footer text.
 *
 * @param text {string}
 */
FloDialog.prototype.setFooterText = function (text) {
    this.footerText = text;
};
