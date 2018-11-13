/**
 * CsDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 01-11-2018
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 */
var CsDialog = function (config) {

    this.id = Date.now();

    this.cloak = this.renderCloakHtml();
    this.activeDialog = null;

    this.content = '';
    this.footerText = '';

    this.config = CsUtils.mergeOptions({
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
        this.crawlDialogLinks();
    }
};

/**
 * Bind events to the dialog links on the page.
 */
CsDialog.prototype.crawlDialogLinks = function () {

    var elements = document.querySelectorAll('[data-cs-dialog]');

    for (var i = 0; i < elements.length; i++) {

        CsUtils.addEvent(elements[i], 'click', function (event) {
            event.preventDefault();

            var target = (event.currentTarget) ? event.currentTarget : event.srcElement;
            var type = target.getAttribute('data-cs-dialog');

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
CsDialog.prototype.partialHandler = function (target) {
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
CsDialog.prototype.hiddenElementHandler = function (target) {

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
CsDialog.prototype.imageHandler = function (target) {

    var attr = {
        title: target.getAttribute('data-title'),
        imageUrl: target.getAttribute('data-image-url')
    };

    if (attr.imageUrl !== null) {
        var image = document.createElement('img');

        image.src = attr.imageUrl;
        image.className = 'cs-dialog__img';

        this.content = image.outerHTML;
        this.openDialog(attr.title);
    }
};

/**
 * Loads content or URL into a dialog.
 *
 * @param title {string}
 * @param url {string}
 * @param callback {function=}
 */
CsDialog.prototype.openUrl = function (title, url, callback) {
    var self = this;

    CsUtils.get(url).then(function (response) {

        self.content = response;
        self.positionDialog();  // Re-position dialog after loading dynamic content.
        self.openDialog(title, callback);

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
CsDialog.prototype.openDialog = function (title, callback) {

    var self = this;
    this.title = title;

    if (typeof Promise === 'undefined') {
        CsUtils.waitForPolyfillsToLoad(function () {
            self.openDialog(title, callback);
        });
        return;
    }

    if (!self.activeDialog) {
        self.renderDialog().then(function (dialog) {
            self.positionDialog();

            if (typeof callback === 'function')
                callback();

        }).catch(function (error) {
            console.error(error);
        });
    } else {
        self.resetContent();
        self.updateActiveDialog().then(function () {
            self.positionDialog();

            if (typeof callback === 'function') {
                callback();
            }
        });
    }
};

/**
 * Creates a new dialog DOM element.
 */
CsDialog.prototype.renderDialog = function () {

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
CsDialog.prototype.updateActiveDialog = function () {

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
CsDialog.prototype.showDialog = function () {

    var dialog = this.activeDialog,
        self = this;

    return new Promise(function (resolve, reject) {

        self.openCloak();
        self.positionDialog();

        if (!self.config.effect.fade) {
            CsUtils.runEmbeddedJs();
            resolve();
        } else {
            dialog.style.display = 'block';

            CsUtils.fadeIn(dialog, function () {
                CsUtils.runEmbeddedJs(self.activeDialog);
                resolve();
            });
        }
    });
};

/**
 * Positions the dialog in the center of the screen.
 * Can be changed via the settings.
 */
CsDialog.prototype.positionDialog = function () {

    var positionTop = (window.pageYOffset || document.body.scrollTop) - (document.body.clientTop || 0),
        screenHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
        dialog = this.activeDialog;

    CsUtils.waitForElement(dialog, function () { // first wait content to be loaded in the DOM

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
 * Close dialog.
 */
CsDialog.prototype.closeDialog = function () {

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
CsDialog.prototype.openCloak = function () {

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
CsDialog.prototype.closeCloak = function () {

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
CsDialog.prototype.appendTitle = function (title) {
    var obj = this;

    if (typeof obj.activeDialog !== 'undefined') {

        return new Promise(function (resolve, reject) {

            var headerElement = obj.activeDialog.getElementsByClassName('cs-dialog__header')[0],
                titleElement;

            if (typeof headerElement !== 'undefined') {

                titleElement = headerElement.getElementsByClassName('cs-dialog__title')[0];
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
CsDialog.prototype.appendContent = function (content, delay) {
    delay = delay || 0;

    var obj = this;

    if (typeof obj.activeDialog !== 'undefined') {

        return new Promise(function (resolve, reject) {

            setTimeout(function () {
                var container = obj.activeDialog.getElementsByClassName('cs-dialog__body')[0];

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

/**
 * Resets the content of a cached dialog.
 */
CsDialog.prototype.resetContent = function () {

    var obj = this;

    var container = obj.activeDialog.getElementsByClassName('cs-dialog__body')[0];
    container.innerHTML = obj.renderSpinnerHtml();
};

/**
 * Render the HTML used for the dialog's cloak effect.
 */
CsDialog.prototype.renderCloakHtml = function () {

    var cloak = document.createElement('div'),
        body = document.getElementsByTagName('body')[0];

    cloak.className = 'cs-dialog-cloak hide';
    body.insertBefore(cloak, body.firstChild);

    // close dialog via cloak trigger
    CsUtils.addEvent(cloak, 'click', function (event) {
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
CsDialog.prototype.renderDialogHtml = function () {

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

    container.id = 'cs-dialog-' + this.id;
    container.className = 'cs-dialog extend hide';

    containerInner.className = 'cs-dialog__inner';
    container.appendChild(containerInner);

    header.className = 'cs-dialog__header';
    containerInner.appendChild(header);

    headerColumn1.className = 'cs-dialog__container-master';
    header.appendChild(headerColumn1);

    headerTitle.className = 'cs-dialog__title';
    headerColumn1.appendChild(headerTitle);

    headerColumn2.className = 'cs-dialog__container-slave';
    headerColumn2.style.textAlign = 'right';
    header.appendChild(headerColumn2);

    headerCloseIcon.className = 'fas fa-times';
    headerCloseBtn.appendChild(headerCloseIcon);

    headerCloseBtn.href = 'JavaScript:;';
    headerCloseBtn.className = 'cs-dialog__close-btn';
    headerColumn2.appendChild(headerCloseBtn);

    CsUtils.addEvent(headerCloseBtn, 'click', this.closeDialog.bind(this));

    containerContent.className = 'cs-dialog__body';
    containerContent.innerHTML = this.renderSpinnerHtml();
    containerInner.appendChild(containerContent);

    if (this.footerText !== '') {
        footer.className = 'cs-dialog__footer';
        footer.innerHTML = this.footerText;
        containerInner.appendChild(footer);
    }

    return container;
};

/**
 * Set footer text.
 *
 * @param text {string}
 */
CsDialog.prototype.setFooterText = function (text) {
    this.footerText = text;
};

/**
 * Load spinner HTML.
 *
 * @returns {string}
 */
CsDialog.prototype.renderSpinnerHtml = function () {
    return '<svg class="cs-dialog__spinner" viewBox="0 0 100 100" width="20" height="20"> ' +
        '<circle cx="50" cy="50" r="42" transform="rotate(-90,50,50)" />' +
        '</svg>';
};

/**
 * Opens dialog with given title and content.
 *
 * @param {string} title
 * @param {string} content
 * @param {function=} callback
 */
CsDialog.prototype.openWithContent = function (title, content, callback) {
    this.openDialog(title, function () {
        this.appendContent(content).then(function (response) {
            if (typeof callback === 'function') {
                callback();
            }
        });
    }.bind(this));
};
