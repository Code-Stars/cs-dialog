/**
 * FloDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 05-09-2017
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 */
var FloDialog = function (config) {

    this.id = Date.now();
    this.cloak = this.renderCloakHtml();
    this.activeDialog = null;
    this.footerText = '';

    this.config = this.mergeOptions({
        cache: true,
        position: 'absolute',
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
 * @param obj1
 * @param obj2
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
 * @param el
 */
FloDialog.prototype.fadeIn = function (el) {

    el.style.opacity = 0;

    var tick = function () {
        el.style.opacity = +el.style.opacity + 0.05;

        if (+el.style.opacity < 1) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16)
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
            }

            // load content from image src
            if (attr.imageUrl !== null) {
                var image = this.loadImageContent(attr.imageUrl);
                content.appendChild(image);
            }

            // load content from URL (asynchronous)
            if (attr.url !== null && attr.url !== '' && attr.url !== "javascript:" && attr.url !== '#') {
                this.openUrl(attr.title, attr.url);
            }

            this.openDialog(this.renderContainerHtml(content));
            this.setTitle(attr.title);

        }.bind(this), false);
    }
};

/**
 * Loads content or URL into a dialog.
 *
 * @param title {string}
 * @param url {string}
 */
FloDialog.prototype.openUrl = function (title, url) {

    var message = document.createElement('span');
    var content = document.createElement('div');

    message.textContent = 'Loading...';
    content.appendChild(message);

    this.get(url, function (response) {

        content.innerHTML = response.data;

        this.waitForElement(content, function () {

            // re-position dialog after loading dynamic content
            this.positionDialog(this.activeDialog);

            this.openDialog(this.renderContainerHtml(content));
            this.setTitle(title);

        }.bind(this));

    }.bind(this));
};

/**
 * Open dialog.
 * @param dialog
 */
FloDialog.prototype.openDialog = function (dialog) {

    var body = document.getElementsByTagName('body')[0];
    body.appendChild(dialog);

    this.initCloseTriggers(dialog);

    if (typeof dialog !== 'undefined') {

        this.activeDialog = dialog;
        this.openCloak();

        // first position dialog
        this.positionDialog(dialog, function () {

            // then show dialog
            if (!this.config.effect.fade) {
                dialog.className = dialog.className.replace(/\bhide\b/, '');
            } else {
                this.fadeIn(dialog);
            }

        }.bind(this));
    }
};

FloDialog.prototype.positionDialog = function (dialog, callback) {

    var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0);
    var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // first wait content to be loaded in the DOM
    this.waitForElement(dialog, function () {

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
    if (typeof this.cloak !== 'undefined') {
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
 * Set title.
 * @param title
 */
FloDialog.prototype.setTitle = function (title) {

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
 * @param content {Element}
 * @returns {Element}
 */
FloDialog.prototype.renderContainerHtml = function (content) {

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

    if (typeof content !== 'undefined' && content !== null) {
        content.className = 'flo-dialog__body gutters--double';
        container.appendChild(content);
    }

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

/**
 * Set dialog Y offset.
 *
 * @param yOffset
 */
FloDialog.prototype.setYOffset = function (yOffset) {
    var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    this.activeDialog.setAttribute("style", "top:" + (yOffset + screenHeight / 2 - this.activeDialog.offsetHeight / 2) + "px");
};

/**
 * Clear contents of a container.
 * @param container
 */
FloDialog.prototype.clearContainer = function (container) {
    container.innerHTML = "";
};

/**
 * Set dialog height for scrollable content. (optional).
 */
FloDialog.prototype.setHeight = function (dialog, height) {

    if (typeof dialog !== 'undefined') {
        var dialogBody = dialog.getElementsByClassName('flo-dialog__body')[0];
        dialogBody.setAttribute("style", "height:" + height + "px; overflow-y: scroll");
    }
};