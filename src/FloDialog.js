/**
 * FloDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 29-08-2017
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 *
 * @todo maybe work with the observer pattern for triggering load events?
 * @todo take the latest version from the Praktix project.
 */
var FloDialog = function () {

    this.cloak = document.getElementsByClassName('flo-dialog-cloak')[0];
    this.activeDialog = null;

    this.bindTriggers();
};

/**
 * Bind events to the elements.
 */
FloDialog.prototype.bindTriggers = function () {

    var openTriggers = document.getElementsByClassName('trigger-dialog--open');

    for (var i = 0; i < openTriggers.length; i++) {

        this.addEvent(openTriggers[i], "click", function (event) {

            var target = (event.currentTarget) ? event.currentTarget : event.srcElement,
                title = target.getAttribute('data-title'),
                href = target.getAttribute('href'),
                dialog = document.getElementById(target.getAttribute('data-dialog-id'));

            this.openDialog(dialog);
            this.setTitle(title);

            // load content from URL
            if (href !== null && href !== '' && href !== "javascript:" && href !== '#') {
                event.preventDefault();
                this.loadContentFromUrl(href);
            }

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

    //window.App.Event.fire('app.dialog.open');

    this.initCloseTriggers(dialog);

    if (typeof dialog !== "undefined") {

        this.activeDialog = dialog;
        this.openCloak();

        var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0);
        var screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

        dialog.className = dialog.className.replace(/\bhide\b/, '');
        dialog.setAttribute("style", "top:" + (positionTop + screenHeight / 2 - dialog.offsetHeight / 2) + "px");
    }
};

/**
 * Initialize close triggers for opened dialog.
 *
 * @param dialog
 */
FloDialog.prototype.initCloseTriggers = function (dialog) {

    var closeTriggers = dialog.getElementsByClassName('trigger-dialog--close');

    for (var j = 0; j < closeTriggers.length; j++) {

        this.addEvent(closeTriggers[j], "click", function () {
            this.closeActiveDialog();

        }.bind(this), false);
    }

    // close dialog via cloak trigger
    if (typeof this.cloak !== 'undefined') {

        this.addEvent(this.cloak, "click", function (event) {
            if (event.target !== this.activeDialog) {
                this.closeActiveDialog();
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
        if (dialog.className.indexOf('hide') === -1) {
            dialog.className += " hide";
        }
        this.closeCloak();
    }
};

/**
 * Close open dialogs.
 */
FloDialog.prototype.closeActiveDialog = function () {

    this.closeDialog(this.activeDialog);
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

    window.Request.get(url, function (response) {
        this.addElementToActiveDialogContent(response.data);
    }.bind(this));
};

/**
 * Adds HTML to the dialogs content container.
 */
FloDialog.prototype.addElementToActiveDialogContent = function (html) {

    var dialogBody = this.activeDialog.getElementsByClassName('dialog__body')[0];
    dialogBody.innerHTML = html;
};
