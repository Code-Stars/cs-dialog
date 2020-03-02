/**
 * CsDialog - Modal dialog script in vanilla JavaScript.
 *
 * @version 27-02-2020
 * @author Floris Weijenburg <https://github.com/Code-Stars>
 */
var CsDialog = function (config) {

	this.id = 'cs-dialog-' + Date.now();

	this.cloak = null;
	this.activeDialog = null;

	this.content = '';
	this.footerText = '';

	this.config = CsUtils.mergeOptions({
		debug: false,
		cache: true,
		cloak: true,
		padding: true,
		keyboard: true,
		dialogLinks: true,
		position: 'absolute',
		closeOnCloakClick: true,
		effect: {
			fade: false
		}
	}, config);

	if (this.config.cloak) {
		this.renderCloakHtml();
	}

	if (this.config.dialogLinks) {
		this.dialogLinksHandler();
	}

	if (this.config.keyboard) {
		this.keyboardHandler();
	}
};

/**
 * Bind events to the dialog links on the page.
 */
CsDialog.prototype.dialogLinksHandler = function () {

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
				case 'gallery':
					this.galleryHandler(target);
					break;
			}

		}.bind(this));
	}
};

/**
 * Init keyboard actions for navigating
 * through gallery images and for closing the dialog.
 */
CsDialog.prototype.keyboardHandler = function () {
	document.onkeydown = function (e) {
		switch (e.keyCode) {
			case 37:
				this.switchImageHandler(null, 'backwards');
				break;
			case 39:
				this.switchImageHandler(null, 'forwards');
				break;
			case 27:
				this.closeDialog();
				break;
		}
	}.bind(this);
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
		title: target.getAttribute('data-cs-title'),
		imageUrl: target.getAttribute('data-cs-image-url')
	};

	this.config.padding = false;

	if (attr.imageUrl !== null) {
		var image = document.createElement('img');

		image.src = attr.imageUrl;
		image.className = 'cs-dialog__img';

		this.content = image.outerHTML;
		this.openDialog(attr.title);
	}
};

/**
 * Handles the 'gallery' type dialogs.
 * By loading its content from an image src path.
 *
 * @param target {object}
 */
CsDialog.prototype.galleryHandler = function (target) {

	var attr = {
		title: target.getAttribute('data-cs-title'),
		imageUrl: target.getAttribute('data-cs-image-url'),
		index: parseInt(target.getAttribute('data-cs-index'))
	};

	// disable dialog padding
	this.config.padding = false;

	if (attr.imageUrl !== null) {
		var image = document.createElement('img');

		image.src = attr.imageUrl;
		image.className = 'cs-dialog__img';

		var container = document.createElement('div');
		container.appendChild(image);

		// get gallery items
		var gallery_items = document.querySelectorAll('[data-cs-dialog="gallery"]');
		if (gallery_items.length > 1) {

			if (attr.index < gallery_items.length) {
				var nextBtn = document.createElement('a');
				nextBtn.href = 'javascript:;';
				nextBtn.className = 'cs-dialog__nav cs-dialog__nav--next';
				nextBtn.setAttribute('data-cs-index', (attr.index + 1).toString());

				var nextIcon = document.createElement('i');
				nextIcon.className = 'fas fa-angle-right';
				nextBtn.appendChild(nextIcon);

				CsUtils.addEvent(nextBtn, 'click', function (event) {
					this.switchImageHandler(event, 1);
				}.bind(this));

				container.appendChild(nextBtn);
			}

			if (attr.index > 1) {
				var prevBtn = document.createElement('a');
				prevBtn.href = 'javascript:;';
				prevBtn.className = 'cs-dialog__nav cs-dialog__nav--previous';
				prevBtn.setAttribute('data-cs-index', (attr.index - 1).toString());

				var prevIcon = document.createElement('i');
				prevIcon.className = 'fas fa-angle-left';
				prevBtn.appendChild(prevIcon);

				CsUtils.addEvent(prevBtn, 'click', function (event) {
					this.switchImageHandler(event, -1);
				}.bind(this));

				container.appendChild(prevBtn);
			}
		}

		this.content = container;

		this.openDialog(attr.title);
	}
};

/**
 * Switch image handler.
 *
 * We only fade once to open dialog, not when switching image.
 *
 * @param event
 * @param {string=} direction
 */
CsDialog.prototype.switchImageHandler = function (event, direction) {

	var target = null,
		nextElement = null,
		galleryItems = document.querySelectorAll('[data-cs-dialog="gallery"]');

	if (event) {
		// change image based on clicked nav button
		target = (event.currentTarget) ? event.currentTarget : event.srcElement;
	} else {
		// change image based on arrow keys
		target = (direction === 'backwards') ? this.activeDialog.getElementsByClassName('cs-dialog__nav--previous')[0] : this.activeDialog.getElementsByClassName('cs-dialog__nav--next')[0];
	}

	if (!target) {
		return;
	}

	for (var i = 0; i < galleryItems.length; i++) {
		var index = galleryItems[i].getAttribute('data-cs-index');
		if (target.getAttribute('data-cs-index') === index) {
			nextElement = galleryItems[i];
		}
	}

	if (nextElement !== null) {
		var cachedFade = this.config.effect.fade;

		this.config.effect.fade = false;
		this.galleryHandler(nextElement);
		this.config.effect.fade = cachedFade;
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
		// Re-position dialog after loading dynamic content.
		self.positionDialog();
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

		if (self.config.cloak) {
			self.openCloak();
		}
		self.positionDialog();

		dialog.style.display = 'block';

		if (!self.config.effect.fade) {

			CsUtils.runEmbeddedJs(dialog);
			dialog.style.opacity = '1';

			resolve();
		} else {
			// settings: fade
			CsUtils.fadeIn(dialog, function () {

				CsUtils.runEmbeddedJs(dialog);

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

		this.activeDialog.style.display = 'none';

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
					if (typeof content === 'object') {
						container.innerHTML = '';
						container.append(content);
					} else {
						container.innerHTML = content;
					}
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
	if (this.config.closeOnCloakClick) {
		CsUtils.addEvent(cloak, 'click', function (event) {
			if (event.target !== this.activeDialog) {
				this.closeDialog();
			}
		}.bind(this));
	}

	this.cloak = cloak;

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

	container.id = this.id;
	container.className = 'cs-dialog extend hide';

	if (this.config.padding) {
		container.className += ' cs-dialog--padding';
	}

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
	return '<svg class="cs-dialog__spinner" viewBox="0 0 100 100" width="50" height="50"> ' +
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