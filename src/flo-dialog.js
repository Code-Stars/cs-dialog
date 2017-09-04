/**
 * FloDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 03-09-2017
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 */
var FloDialog = function (config) {

    this.id = Date.now();
    this.cloak = this.renderCloakHtml();
    this.activeDialog = null;

    this.config = this.mergeConfig({
        cache: true,
        fade: false,
        footerText: ''
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
FloDialog.prototype.mergeConfig = function (obj1, obj2) {
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


    var tick = function() {
        el.style.opacity = +el.style.opacity + 0.01;


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

            var target = (event.currentTarget) ? event.currentTarget : event.srcElement,
                title = target.getAttribute('data-title'),
                url = target.getAttribute('data-url'),
                contents = '';

            // load content from hidden element
            if (target.getAttribute('data-id')) {
                contents = document.getElementById(target.getAttribute('data-id')).innerHTML;
            }

            // load content from URL
            if (url !== null && url !== '' && url !== "javascript:" && url !== '#') {
                event.preventDefault();
                contents = 'Loading...';
                this.loadContentFromUrl(url);
            }

            this.openDialog(this.renderContainerHtml(contents));
            this.setTitle(title);

        }.bind(this), false);
    }
};

/**
 * Set dialog height for scrollable content. (optional).
 */
FloDialog.prototype.setHeight = function (dialog, height) {

    if (typeof dialog !== 'undefined') {
        var dialogBody = dialog.getElementsByClassName('dialog__body')[0];
        dialogBody.setAttribute("style", "height:" + height + "px; overflow-y: scroll");
    }
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

        var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0);
        var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        if (!this.config.fade) {
            dialog.className = dialog.className.replace(/\bhide\b/, '');
        } else {
            this.fadeIn(dialog);
        }

        dialog.setAttribute("style", "top:" + (positionTop + screenHeight / 2 - dialog.offsetHeight / 2) + "px");
    }
};

/**
 * Initialize close triggers for opened dialog.
 *
 * @param dialog
 */
FloDialog.prototype.initCloseTriggers = function (dialog) {

    var closeTriggers = dialog.getElementsByClassName('flo-dialog--close');

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
            // if (dialog.className.indexOf('hide') === -1) {
            //     dialog.className += " hide";
            // }
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
 * Clear contents of a container.
 * @param container
 */
FloDialog.prototype.clearContainer = function (container) {

    container.innerHTML = "";

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
 * Load content from URL.
 * @param url
 */
FloDialog.prototype.loadContentFromUrl = function (url) {

    this.get(url, function (response) {
        setTimeout(
            function () {
                this.addElementToActiveDialogContent(response.data);
            }.bind(this), 1000
        )
    }.bind(this));
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
 * Adds HTML to the dialogs content container.
 */
FloDialog.prototype.addElementToActiveDialogContent = function (html) {
    var dialogBody = this.activeDialog.getElementsByClassName('flo-dialog__body')[0];
    dialogBody.innerHTML = html;
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
 * @param contents {string}
 * @returns {Element}
 */
FloDialog.prototype.renderContainerHtml = function (contents) {

    var container = document.createElement('div'),
        header = document.createElement('header'),
        content = document.createElement('div'),
        footer = document.createElement('footer');

    var headerColumn1 = document.createElement('div'),
        headerColumn2 = document.createElement('div'),
        headerTitle = document.createElement('h2'),
        headerCloseBtn = document.createElement('a');

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
    headerColumn2.style = 'text-align: right';
    header.appendChild(headerColumn2);

    headerCloseBtn.href = 'JavaScript:;';
    headerCloseBtn.className = 'flo-dialog--close gutters--double fa fa-times';
    headerCloseBtn.innerHTML = 'x';
    headerColumn2.appendChild(headerCloseBtn);

    content.className = 'flo-dialog__body gutters--double';
    content.innerHTML = 'This is a example dialog. Loaded from HTML.';
    if (typeof contents !== 'undefined' && contents !== null) {
        content.innerHTML = contents;
    }
    container.appendChild(content);

    footer.className = 'flo-dialog__footer gutters--double';
    footer.innerHTML = this.config.footerText !== '' ? this.config.footerText : '&copy; FloDialog 2017. All rights reserved.';
    container.appendChild(footer);

    return container;
};

/**
 * Set footer text.
 *
 * @param text
 */
FloDialog.prototype.setFooterText = function (text) {
    this.config.footerText = text;
};