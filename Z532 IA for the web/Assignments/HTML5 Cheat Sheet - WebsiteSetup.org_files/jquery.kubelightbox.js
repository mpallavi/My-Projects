/*
 * Kube Lightbox v 2.0
 */
(function (window, document, $, undefined) {
	"use strict";
	var H = $("html"),
		W = $(window),
		D = $(document),
		K = $.kube = function () {
			K.open.apply(this, arguments);
		},
		IE = navigator.userAgent.match(/msie/i),
		didUpdate = null,
		isTouch = document.createTouch !== undefined || ('ontouchstart' in window) || ('onmsgesturechange' in window) || navigator.msMaxTouchPoints,
		isQuery = function (obj) {
			return obj && obj.hasOwnProperty && obj instanceof $;
		},
		isString = function (str) {
			return str && $.type(str) === "string";
		},
		isPercentage = function (str) {
			return isString(str) && str.indexOf('%') > 0;
		},
		isScrollable = function (el) {
			return (el && !(el.style.overflow && el.style.overflow === 'hidden') && ((el.clientWidth && el.scrollWidth > el.clientWidth) || (el.clientHeight && el.scrollHeight > el.clientHeight)));
		},
		getScalar = function (orig, dim) {
			var value = parseInt(orig, 10) || 0;
			if (dim && isPercentage(orig)) {
				value = K.getViewport()[dim] / 100 * value;
			}
			return Math.ceil(value);
		},
		getValue = function (value, dim) {
			return getScalar(value, dim) + 'px';
		},
		format = function (url, rez, params) {
			params = params || '';
			if ($.type(params) === "object") {
				params = $.param(params, true);
			}
			$.each(rez, function (key, value) {
				url = url.replace('$' + key, value || '');
			});
			if (params.length) {
				url += (url.indexOf('?') > 0 ? '&' : '?') + params;
			}
			return url;
		};
	$.extend(K, {
		defaults: {
			theme: 'dark',
			padding: 0,
			margin: 20,
			width: 800,
			height: 450,
			minWidth: 100,
			minHeight: 100,
			maxWidth: 9999,
			maxHeight: 9999,
			pixelRatio: 1, // Set to 2 for retina display support
			autoSize: false,
			autoHeight: false,
			autoWidth: false,
			autoResize: true,
			autoCenter: true,
			fitToView: true,
			aspectRatio: true,
			topRatio: 0.5,
			leftRatio: 0.5,
			scrolling: 'no', // 'auto', 'yes' or 'no'
			wrapCSS: '',
			nextClick: false,
			mouseWheel: true,
			autoPlay: false,
			playSpeed: 3000,
			preload: 3,
			modal: false,
			loop: false,
			ajax: {
				dataType: 'html',
				headers: {
					'X-Kube': true
				}
			},
			iframe: {
				scrolling: 'auto',
				preload: true
			},
			swf: {
				wmode: 'transparent',
				allowfullscreen: 'true',
				allowscriptaccess: 'always'
			},
			keys: {
				next: {
					13: 'left', // enter
					34: 'up', // page down
					39: 'left', // right arrow
					40: 'up' // down arrow
				},
				prev: {
					8: 'right', // backspace
					33: 'down', // page up
					37: 'right', // left arrow
					38: 'down' // up arrow
				},
				close: [27], // escape key
				play: [32], // space - start/stop slideshow
				toggle: [70] // letter "f" - toggle fullscreen
			},
			direction: {
				next: 'left',
				prev: 'right'
			},
			scrollOutside: true,
			// Override some properties
			index: 0,
			type: null,
			href: null,
			content: null,
			title: null,
			// HTML templates
			tpl: {
				wrap: '<div class="kube-wrap" tabIndex="-1"><div class="kube-skin"><div class="kube-outer"><div class="kube-inner"></div></div></div></div>',
				image: '<img class="kube-image" src="{href}" alt="" />',
				iframe: '<iframe id="kube-frame{rnd}" name="kube-frame{rnd}" class="kube-iframe" frameborder="0" vspace="0" hspace="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen' + (IE ? ' allowtransparency="true"' : '') + '></iframe>',
				error: '<p class="kube-error">The requested content cannot be loaded.<br/>Please try again later.</p>'
			},
			// Properties for each animation type
			// Opening Kube
			openEffect: 'fade', // 'elastic', 'fade' or 'none'
			openSpeed: 400,
			openEasing: 'in',
			openOpacity: true,
			openMethod: 'zoomIn',
			// Closing Kube
			closeEffect: 'fade', // 'elastic', 'fade' or 'none'
			closeSpeed: 250,
			closeEasing: 'out',
			closeOpacity: true,
			closeMethod: 'zoomOut',
			// Changing next gallery item
			nextEffect: 'fade', // 'elastic', 'fade' or 'none'
			nextSpeed: 400,
			nextEasing: 'in',
			nextMethod: 'changeIn',
			// Changing previous gallery item
			prevEffect: 'fade', // 'elastic', 'fade' or 'none'
			prevSpeed: 400,
			prevEasing: 'in',
			prevMethod: 'changeOut',
			// Enable default helpers
			helpers: {
				overlay: true,
				title: true,
				media: true,
				buttons: true,
				social: false
			},
			// Callbacks
			onCancel: $.noop, // If canceling
			beforeLoad: $.noop, // Before loading
			afterLoad: $.noop, // After loading
			beforeShow: $.noop, // Before changing in current item
			afterShow: $.noop, // After opening
			beforeChange: $.noop, // Before changing gallery item
			beforeClose: $.noop, // Before closing
			afterClose: $.noop // After closing
		},
		//Current state
		group: {}, // Selected group
		opts: {}, // Group options
		previous: null, // Previous element
		coming: null, // Element being loaded
		current: null, // Currently loaded element
		isActive: false, // Is activated
		isOpen: false, // Is currently open
		isOpened: false, // Have been fully opened at least once
		wrap: null,
		skin: null,
		outer: null,
		inner: null,
		player: {
			timer: null,
			isActive: false
		},
		// Loaders
		ajaxLoad: null,
		imgPreload: null,
		// Some collections
		transitions: {},
		helpers: {},
		/*
		 *	Static methods
		 */
		open: function (group, opts) {
			if (!group) {
				return;
			}
			if (!$.isPlainObject(opts)) {
				opts = {};
			}
			// Close if already active
			if (false === K.close(true)) {
				return;
			}
			// Normalize group
			if (!$.isArray(group)) {
				group = isQuery(group) ? $(group).get() : [group];
			}
			// Recheck if the type of each element is `object` and set content type (image, ajax, etc)
			$.each(group, function (i, element) {
				var obj = {},
					href,
					title,
					content,
					type,
					rez,
					hrefParts,
					selector;
				if ($.type(element) === "object") {
					// Check if is DOM element
					if (element.nodeType) {
						element = $(element);
					}
					if (isQuery(element)) {
						obj = {
							href: element.data('kube-href') || element.attr('href'),
							title: element.data('kube-title') || element.attr('title') || element.find('> img').attr('title') || element.find('> img').attr('alt'),
							isDom: true,
							element: element
						};
						if ($.metadata) {
							$.extend(true, obj, element.metadata());
						}
					} else {
						obj = element;
					}
				}
				href = opts.href || obj.href || (isString(element) ? element : null);
				title = opts.title !== undefined ? opts.title : obj.title || '';
				content = opts.content || obj.content;
				type = content ? 'html' : (opts.type || obj.type);
				if (!type && obj.isDom) {
					type = element.data('kube-type');
					if (!type) {
						rez = element.prop('class').match(/kube\.(\w+)/);
						type = rez ? rez[1] : null;
					}
				}
				if (isString(href)) {
					// Try to guess the content type
					if (!type) {
						if (K.isImage(href)) {
							type = 'image';
						} else if (K.isSWF(href)) {
							type = 'swf';
						} else if (href.charAt(0) === '#') {
							type = 'inline';
						} else if (isString(element)) {
							type = 'html';
							content = element;
						}
					}
					// Split url into two pieces with source url and content selector, e.g,
					// "/mypage.html #my_id" will load "/mypage.html" and display element having id "my_id"
					if (type === 'ajax') {
						hrefParts = href.split(/\s+/, 2);
						href = hrefParts.shift();
						selector = hrefParts.shift();
					}
				}
				if (!content) {
					if (type === 'inline') {
						if (href) {
							content = $(isString(href) ? href.replace(/.*(?=#[^\s]+$)/, '') : href); //strip for ie7
						} else if (obj.isDom) {
							content = element;
						}
					} else if (type === 'html') {
						content = href;
					} else if (!type && !href && obj.isDom) {
						type = 'inline';
						content = element;
					}
				}
				$.extend(obj, {
					href: href,
					type: type,
					content: content,
					title: title,
					selector: selector
				});
				group[i] = obj;
			});
			// Extend the defaults
			K.opts = $.extend(true, {}, K.defaults, opts);
			// All options are merged recursive except keys
			if (opts.keys !== undefined) {
				K.opts.keys = opts.keys ? $.extend({}, K.defaults.keys, opts.keys) : false;
			}
			K.group = group;
			return K._start(K.opts.index);
		},
		// Cancel image loading or abort ajax request
		cancel: function () {
			var coming = K.coming;
			if (!coming || false === K.trigger('onCancel')) {
				return;
			}
			K.hideLoading();
			if (K.ajaxLoad) {
				K.ajaxLoad.abort();
			}
			K.ajaxLoad = null;
			if (K.imgPreload) {
				K.imgPreload.onload = K.imgPreload.onerror = null;
			}
			if (coming.wrap) {
				coming.wrap.stop(true, true).trigger('onReset').remove();
			}
			K.coming = null;
			// If the first item has been canceled, then clear everything
			if (!K.current) {
				K._afterZoomOut(coming);
			}
		},
		// Start closing animation if is open; remove immediately if opening/closing
		close: function (event) {
			K.cancel();
			if (false === K.trigger('beforeClose')) {
				return;
			}
			K.unbindEvents();
			if (!K.isActive) {
				return;
			}
			if (!K.isOpen || event === true) {
				$('.kube-wrap').stop(true).trigger('onReset').remove();
				K._afterZoomOut();
			} else {
				K.isOpen = K.isOpened = false;
				K.isClosing = true;
				$('.kube-item').remove();
				K.wrap.stop(true, true).removeClass('kube-opened');
				K.transitions[K.current.closeMethod]();
			}
		},
		// Manage slideshow:
		//   $.kube.play(); - toggle slideshow
		//   $.kube.play( true ); - start
		//   $.kube.play( false ); - stop
		play: function (action) {
			var clear = function () {
					clearTimeout(K.player.timer);
				},
				set = function () {
					clear();
					if (K.current && K.player.isActive) {
						K.player.timer = setTimeout(K.next, K.current.playSpeed);
					}
				},
				stop = function () {
					clear();
					D.unbind('.player');
					K.player.isActive = false;
					K.trigger('onPlayEnd');
				},
				start = function () {
					if (K.current && (K.current.loop || K.current.index < K.group.length - 1)) {
						K.player.isActive = true;
						D.bind({
							'onCancel.player beforeClose.player': stop,
							'onUpdate.player': set,
							'beforeLoad.player': clear
						});
						set();
						K.trigger('onPlayStart');
					}
				};
			if (action === true || (!K.player.isActive && action !== false)) {
				start();
			} else {
				stop();
			}
		},
		// Navigate to next gallery item
		next: function (direction) {
			var current = K.current;
			if (current) {
				if (!isString(direction)) {
					direction = current.direction.next;
				}
				K.jumpto(current.index + 1, direction, 'next');
			}
		},
		// Navigate to previous gallery item
		prev: function (direction) {
			var current = K.current;
			if (current) {
				if (!isString(direction)) {
					direction = current.direction.prev;
				}
				K.jumpto(current.index - 1, direction, 'prev');
			}
		},
		// Navigate to gallery item by index
		jumpto: function (index, direction, router) {
			var current = K.current;
			if (!current) {
				return;
			}
			index = getScalar(index);
			K.direction = direction || current.direction[(index >= current.index ? 'next' : 'prev')];
			K.router = router || 'jumpto';
			if (current.loop) {
				if (index < 0) {
					index = current.group.length + (index % current.group.length);
				}
				index = index % current.group.length;
			}
			if (current.group[index] !== undefined) {
				K.cancel();
				K._start(index);
			}
		},
		// Center inside viewport and toggle position type to fixed or absolute if needed
		reposition: function (e, onlyAbsolute) {
			var current = K.current,
				wrap = current ? current.wrap : null,
				pos;
			if (wrap) {
				pos = K._getPosition(onlyAbsolute);
				if (e && e.type === 'scroll') {
					delete pos.position;
					wrap.stop(true, true).transition(pos, 200);
				} else {
					wrap.css(pos);
					current.pos = $.extend({}, current.dim, pos);
				}
			}
		},
		update: function (e) {
			var type = (e && e.type),
				anyway = !type || type === 'orientationchange';
			if (anyway) {
				clearTimeout(didUpdate);
				didUpdate = null;
			}
			if (!K.isOpen || didUpdate) {
				return;
			}
			didUpdate = setTimeout(function () {
				var current = K.current;
				if (!current || K.isClosing) {
					return;
				}
				K.wrap.removeClass('kube-tmp');
				if (anyway || type === 'load' || (type === 'resize' && current.autoResize)) {
					K._setDimension();
				}
				if (!(type === 'scroll' && current.canShrink)) {
					K.reposition(e);
				}
				K.trigger('onUpdate');
				didUpdate = null;
			}, (anyway && !isTouch ? 0 : 300));
		},
		// Shrink content to fit inside viewport or restore if resized
		toggle: function (action) {
			if (K.isOpen) {
				K.current.fitToView = $.type(action) === "boolean" ? action : !K.current.fitToView;
				// Help browser to restore document dimensions
				if (isTouch) {
					K.wrap.removeAttr('style').addClass('kube-tmp');
					K.trigger('onUpdate');
				}
				K.update();
			}
		},
		hideLoading: function () {
			D.unbind('.loading');
			$('.kube-loading').remove();
		},
		showLoading: function () {
			var el, viewport;
			K.hideLoading();
			el = $('<div class="kube-loading"><div></div></div>').click(K.cancel).appendTo('body');
			// If user will press the escape-button, the request will be canceled
			D.bind('keydown.loading', function (e) {
				if ((e.which || e.keyCode) === 27) {
					e.preventDefault();
					K.cancel();
				}
			});
			if (!K.defaults.fixed) {
				viewport = K.getViewport();
				el.css({
					position: 'absolute',
					top: (viewport.h * 0.5) + viewport.y,
					left: (viewport.w * 0.5) + viewport.x
				});
			}
		},
		getViewport: function () {
			var locked = (K.current && K.current.locked) || false,
				rez = {
					x: W.scrollLeft(),
					y: W.scrollTop()
				};
			if (locked) {
				rez.w = locked[0].clientWidth;
				rez.h = locked[0].clientHeight;
			} else {
				// See http://bugs.jquery.com/ticket/6724
				rez.w = isTouch && window.innerWidth ? window.innerWidth : W.width();
				rez.h = isTouch && window.innerHeight ? window.innerHeight : W.height();
			}
			return rez;
		},
		// Unbind the keyboard / clicking actions
		unbindEvents: function () {
			if (K.wrap && isQuery(K.wrap)) {
				K.wrap.unbind('.k');
			}
			D.unbind('.k');
			W.unbind('.k');
		},
		bindEvents: function () {
			var current = K.current,
				keys;
			if (!current) {
				return;
			}
			// Changing document height on iOS devices triggers a 'resize' event,
			// that can change document height... repeating infinitely
			W.bind('orientationchange.k' + (isTouch ? '' : ' resize.k') + (current.autoCenter && !current.locked ? ' scroll.k' : ''), K.update);
			keys = current.keys;
			if (keys) {
				D.bind('keydown.k', function (e) {
					var code = e.which || e.keyCode,
						target = e.target || e.srcElement;
					// Skip esc key if loading, because showLoading will cancel preloading
					if (code === 27 && K.coming) {
						return false;
					}
					// Ignore key combinations and key events within form elements
					if (!e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey && !(target && (target.type || $(target).is('[contenteditable]')))) {
						$.each(keys, function (i, val) {
							if (current.group.length > 1 && val[code] !== undefined) {
								K[i](val[code]);
								e.preventDefault();
								return false;
							}
							if ($.inArray(code, val) > -1) {
								K[i]();
								e.preventDefault();
								return false;
							}
						});
					}
				});
			}
			if (isTouch) {
				var startCoords = {},
					endCoords = {};
				K.wrap.bind('touchstart.k', function (e) {
					if(K.current.canExpand) {
						endCoords = e.originalEvent.targetTouches[0];
						startCoords.pageX = e.originalEvent.targetTouches[0].pageX;
						startCoords.pageY = e.originalEvent.targetTouches[0].pageY;
					}
				});
				K.wrap.bind('touchmove.k', function (e) {
					if(K.current.canExpand) {
						var orig = e.originalEvent;
						endCoords = orig.targetTouches[0];
						e.preventDefault();
					}
				});
				K.wrap.bind('touchend.k', function (e) {
					if(K.current.canExpand) {					
						var distance = endCoords.pageX - startCoords.pageX,
							swipeThreshold = 50;
						if (distance >= swipeThreshold) {
							K.prev('left');
						} else if (distance <= -swipeThreshold) {
							K.next('right');
						}
					}
				});
			}
			if ($.fn.mousewheel && current.mouseWheel) {
				K.wrap.bind('mousewheel.k', function (e, delta, deltaX, deltaY) {
					var target = e.target || null,
						parent = $(target),
						canScroll = false;
					while (parent.length) {
						if (canScroll || parent.is('.kube-skin') || parent.is('.kube-wrap')) {
							break;
						}
						canScroll = isScrollable(parent[0]);
						parent = $(parent).parent();
					}
					if (delta !== 0 && !canScroll) {
						if (K.group.length > 1 && !current.canShrink) {
							if (deltaY > 0 || deltaX > 0) {
								K.prev(deltaY > 0 ? 'down' : 'left');
							} else if (deltaY < 0 || deltaX < 0) {
								K.next(deltaY < 0 ? 'up' : 'right');
							}
							e.preventDefault();
						}
					}
				});
			}
		},
		trigger: function (event, o) {
			var ret, obj = o || K.coming || K.current;
			if (!obj) {
				return;
			}
			if ($.isFunction(obj[event])) {
				ret = obj[event].apply(obj, Array.prototype.slice.call(arguments, 1));
			}
			if (ret === false) {
				return false;
			}
			if (obj.helpers) {
				$.each(obj.helpers, function (helper, opts) {
					if (opts && K.helpers[helper] && $.isFunction(K.helpers[helper][event])) {
						K.helpers[helper][event]($.extend(true, {}, K.helpers[helper].defaults, opts), obj);
					}
				});
			}
			D.trigger(event);
		},
		isImage: function (str) {
			return isString(str) && str.match(/(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|webp|svg)((\?|#).*)?$)/i);
		},
		isSWF: function (str) {
			return isString(str) && str.match(/\.(swf)((\?|#).*)?$/i);
		},
		_start: function (index) {
			var coming = {},
				obj,
				href,
				type,
				margin,
				padding;
			index = getScalar(index);
			obj = K.group[index] || null;
			if (!obj) {
				return false;
			}
			coming = $.extend(true, {}, K.opts, obj);
			// Convert margin and padding properties to array - top, right, bottom, left
			margin = coming.margin;
			padding = coming.padding;
			if ($.type(margin) === 'number') {
				coming.margin = [margin, margin, margin, margin];
			}
			if ($.type(padding) === 'number') {
				coming.padding = [padding, padding, padding, padding];
			}
			// 'modal' propery is just a shortcut
			if (coming.modal) {
				$.extend(true, coming, {
					nextClick: false,
					arrows: false,
					mouseWheel: false,
					keys: null,
					helpers: {
						overlay: {
							closeClick: false
						}
					}
				});
			}
			// 'autoSize' property is a shortcut, too
			if (coming.autoSize) {
				coming.autoWidth = coming.autoHeight = true;
			}
			if (coming.width === 'auto') {
				coming.autoWidth = true;
			}
			if (coming.height === 'auto') {
				coming.autoHeight = true;
			}
			/*
			 * Add reference to the group, so it`s possible to access from callbacks, example:
			 * afterLoad : function() {
			 *     this.title = 'Image ' + (this.index + 1) + ' of ' + this.group.length + (this.title ? ' - ' + this.title : '');
			 * }
			 */
			coming.group = K.group;
			coming.index = index;
			// Give a chance for callback or helpers to update coming item (type, title, etc)
			K.coming = coming;
			if (false === K.trigger('beforeLoad')) {
				K.coming = null;
				return;
			}
			type = coming.type;
			href = coming.href;
			if (!type) {
				K.coming = null;
				//If we can not determine content type then drop silently or display next/prev item if looping through gallery
				if (K.current && K.router && K.router !== 'jumpto') {
					K.current.index = index;
					return K[K.router](K.direction);
				}
				return false;
			}
			K.isActive = true;
			if (type === 'image' || type === 'swf') {
				coming.autoHeight = coming.autoWidth = false;
				coming.scrolling = 'visible';
			}
			if (type === 'image') {
				coming.aspectRatio = true;
			}
			if (type === 'iframe' && isTouch) {
				coming.scrolling = 'scroll';
			}
			// Build the neccessary markup
			coming.wrap = $(coming.tpl.wrap).addClass('kube-' + (isTouch ? 'mobile' : 'desktop') + ' kube-type-' + type + ' kube-theme-' + coming.theme + ' kube-tmp ' + coming.wrapCSS).appendTo(coming.parent || 'body');
			$.extend(coming, {
				skin: $('.kube-skin', coming.wrap),
				outer: $('.kube-outer', coming.wrap),
				inner: $('.kube-inner', coming.wrap)
			});
			$.each(["Top", "Right", "Bottom", "Left"], function (i, v) {
				coming.skin.css('padding' + v, getValue(coming.padding[i]));
			});
			K.trigger('onReady');
			// Check before try to load; 'inline' and 'html' types need content, others - href
			if (type === 'inline' || type === 'html') {
				if (!coming.content || !coming.content.length) {
					return K._error('content');
				}
			} else if (!href) {
				return K._error('href');
			}
			if (type === 'image') {
				K._loadImage();
			} else if (type === 'ajax') {
				K._loadAjax();
			} else if (type === 'iframe') {
				K._loadIframe();
			} else {
				K._afterLoad();
			}
		},
		_error: function (type) {
			$.extend(K.coming, {
				type: 'html',
				autoWidth: true,
				autoHeight: true,
				minWidth: 0,
				minHeight: 0,
				scrolling: 'no',
				hasError: type,
				content: K.coming.tpl.error
			});
			K._afterLoad();
		},
		_loadImage: function () {
			// Reset preload image so it is later possible to check "complete" property
			var img = K.imgPreload = new Image();
			img.onload = function () {
				this.onload = this.onerror = null;
				K.coming.width = this.width / K.opts.pixelRatio;
				K.coming.height = this.height / K.opts.pixelRatio;
				K._afterLoad();
			};
			img.onerror = function () {
				this.onload = this.onerror = null;
				K._error('image');
			};
			img.src = K.coming.href;
			if (img.complete !== true) {
				K.showLoading();
			}
		},
		_loadAjax: function () {
			var coming = K.coming;
			K.showLoading();
			K.ajaxLoad = $.ajax($.extend({}, coming.ajax, {
				url: coming.href,
				error: function (jqXHR, textStatus) {
					if (K.coming && textStatus !== 'abort') {
						K._error('ajax', jqXHR);
					} else {
						K.hideLoading();
					}
				},
				success: function (data, textStatus) {
					if (textStatus === 'success') {
						coming.content = data;
						K._afterLoad();
					}
				}
			}));
		},
		_loadIframe: function () {
			var coming = K.coming,
				iframe = $(coming.tpl.iframe.replace(/\{rnd\}/g, new Date().getTime()))
				.attr('scrolling', isTouch ? 'auto' : coming.iframe.scrolling)
				.attr('src', coming.href);
			// This helps IE
			$(coming.wrap).bind('onReset', function () {
				try {
					$(this).find('iframe').hide().attr('src', '//about:blank').end().empty();
				} catch (e) {}
			});
			if (coming.iframe.preload) {
				K.showLoading();
				iframe.one('load', function () {
					$(this).data('ready', 1);
					// iOS will lose scrolling if we resize
					if (!isTouch) {
						$(this).bind('load.k', K.update);
					}
					// Without this trick:
					//   - iframe won't scroll on iOS devices
					//   - IE7 sometimes displays empty iframe
					$(this).parents('.kube-wrap').width('100%').removeClass('kube-tmp').show();
					K._afterLoad();
				});
			}
			coming.content = iframe.appendTo(coming.inner);
			if (!coming.iframe.preload) {
				K._afterLoad();
			}
		},
		_preloadImages: function () {
			var group = K.group,
				current = K.current,
				len = group.length,
				cnt = current.preload ? Math.min(current.preload, len - 1) : 0,
				item,
				i;
			for (i = 1; i <= cnt; i += 1) {
				item = group[(current.index + i) % len];
				if (item.type === 'image' && item.href) {
					new Image().src = item.href;
				}
			}
		},
		_afterLoad: function () {
			var coming = K.coming,
				previous = K.current,
				placeholder = 'kube-placeholder',
				current,
				content,
				type,
				scrolling,
				href,
				embed;
			K.hideLoading();
			if (!coming || K.isActive === false) {
				return;
			}
			if (false === K.trigger('afterLoad', coming, previous)) {
				coming.wrap.stop(true).trigger('onReset').remove();
				K.coming = null;
				return;
			}
			if (previous) {
				K.trigger('beforeChange', previous);
				previous.wrap.stop(true).removeClass('kube-opened')
					.find('.kube-item')
					.remove();
			}
			K.unbindEvents();
			current = coming;
			content = coming.content;
			type = coming.type;
			scrolling = coming.scrolling;
			$.extend(K, {
				wrap: current.wrap,
				skin: current.skin,
				outer: current.outer,
				inner: current.inner,
				current: current,
				previous: previous
			});
			href = current.href;
			switch (type) {
			case 'inline':
			case 'ajax':
			case 'html':
				if (current.selector) {
					content = $('<div>').html(content).find(current.selector);
				} else if (isQuery(content)) {
					if (!content.data(placeholder)) {
						content.data(placeholder, $('<div class="' + placeholder + '"></div>').insertAfter(content).hide());
					}
					content = content.show().detach();
					current.wrap.bind('onReset', function () {
						if ($(this).find(content).length) {
							content.hide().replaceAll(content.data(placeholder)).data(placeholder, false);
						}
					});
				}
				break;
			case 'image':
				content = current.tpl.image.replace('{href}', href);
				break;
			case 'swf':
				content = '<object id="kube-swf" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%"><param name="movie" value="' + href + '"></param>';
				embed = '';
				$.each(current.swf, function (name, val) {
					content += '<param name="' + name + '" value="' + val + '"></param>';
					embed += ' ' + name + '="' + val + '"';
				});
				content += '<embed src="' + href + '" type="application/x-shockwave-flash" width="100%" height="100%"' + embed + '></embed></object>';
				break;
			}
			if (!(isQuery(content) && content.parent().is(current.inner))) {
				current.inner.append(content);
			}
			// Give a chance for helpers or callbacks to update elements
			K.trigger('beforeShow');
			// Set scrolling before calculating dimensions
			current.inner.css('overflow', scrolling === 'yes' ? 'scroll' : (scrolling === 'no' ? 'hidden' : scrolling));
			// Set initial dimensions and start position
			K._setDimension();
			K.reposition();
			K.isOpen = false;
			K.coming = null;
			K.bindEvents();
			if (!K.isOpened) {
				$('.kube-wrap').not(current.wrap).stop(true).trigger('onReset').remove();
			} else if (previous.prevMethod) {
				K.transitions[previous.prevMethod]();
			}
			K.transitions[K.isOpened ? current.nextMethod : current.openMethod]();
			K._preloadImages();
		},
		_setDimension: function () {
			var viewport = K.getViewport(),
				steps = 0,
				canShrink = false,
				canExpand = false,
				wrap = K.wrap,
				skin = K.skin,
				inner = K.inner,
				current = K.current,
				width = current.width,
				height = current.height,
				minWidth = current.minWidth,
				minHeight = current.minHeight,
				maxWidth = current.maxWidth,
				maxHeight = current.maxHeight,
				scrolling = current.scrolling,
				scrollOut = current.scrollOutside ? current.scrollbarWidth : 0,
				margin = current.margin,
				wMargin = getScalar(margin[1] + margin[3]),
				hMargin = getScalar(margin[0] + margin[2]),
				wPadding,
				hPadding,
				wSpace,
				hSpace,
				origWidth,
				origHeight,
				origMaxWidth,
				origMaxHeight,
				ratio,
				width_,
				height_,
				maxWidth_,
				maxHeight_,
				iframe,
				body;
			// Reset dimensions so we could re-check actual size
			wrap.add(skin).add(inner).width('auto').height('auto').removeClass('kube-tmp');
			wPadding = getScalar(skin.outerWidth(true) - skin.width());
			hPadding = getScalar(skin.outerHeight(true) - skin.height());
			// Any space between content and viewport (margin, padding, border, title)
			wSpace = wMargin + wPadding;
			hSpace = hMargin + hPadding;
			origWidth = isPercentage(width) ? (viewport.w - wSpace) * getScalar(width) / 100 : width;
			origHeight = isPercentage(height) ? (viewport.h - hSpace) * getScalar(height) / 100 : height;
			if (current.type === 'iframe') {
				iframe = current.content;
				if (current.autoHeight && iframe.data('ready') === 1) {
					try {
						if (iframe[0].contentWindow.document.location) {
							inner.width(origWidth).height(9999);
							body = iframe.contents().find('body');
							if (scrollOut) {
								body.css('overflow-x', 'hidden');
							}
							origHeight = body.outerHeight(true);
						}
					} catch (e) {}
				}
			} else if (current.autoWidth || current.autoHeight) {
				inner.addClass('kube-tmp');
				// Set width or height in case we need to calculate only one dimension
				if (!current.autoWidth) {
					inner.width(origWidth);
				}
				if (!current.autoHeight) {
					inner.height(origHeight);
				}
				if (current.autoWidth) {
					origWidth = inner.width();
				}
				if (current.autoHeight) {
					origHeight = inner.height();
				}
				inner.removeClass('kube-tmp');
			}
			width = getScalar(origWidth);
			height = getScalar(origHeight);
			ratio = origWidth / origHeight;
			// Calculations for the content
			minWidth = getScalar(isPercentage(minWidth) ? getScalar(minWidth, 'w') - wSpace : minWidth);
			maxWidth = getScalar(isPercentage(maxWidth) ? getScalar(maxWidth, 'w') - wSpace : maxWidth);
			minHeight = getScalar(isPercentage(minHeight) ? getScalar(minHeight, 'h') - hSpace : minHeight);
			maxHeight = getScalar(isPercentage(maxHeight) ? getScalar(maxHeight, 'h') - hSpace : maxHeight);
			// These will be used to determine if wrap can fit in the viewport
			origMaxWidth = maxWidth;
			origMaxHeight = maxHeight;
			if (current.fitToView) {
				maxWidth = Math.min(viewport.w - wSpace, maxWidth);
				maxHeight = Math.min(viewport.h - hSpace, maxHeight);
			}
			maxWidth_ = viewport.w - wMargin;
			maxHeight_ = viewport.h - hMargin;
			if (current.aspectRatio) {
				if (width > maxWidth) {
					width = maxWidth;
					height = getScalar(width / ratio);
				}
				if (height > maxHeight) {
					height = maxHeight;
					width = getScalar(height * ratio);
				}
				if (width < minWidth) {
					width = minWidth;
					height = getScalar(width / ratio);
				}
				if (height < minHeight) {
					height = minHeight;
					width = getScalar(height * ratio);
				}
			} else {
				width = Math.max(minWidth, Math.min(width, maxWidth));
				if (current.autoHeight && current.type !== 'iframe') {
					inner.width(width);
					height = inner.height();
				}
				height = Math.max(minHeight, Math.min(height, maxHeight));
			}
			// Try to fit inside viewport (including the title)
			if (current.fitToView) {
				inner.width(width).height(height);
				wrap.width(width + wPadding);
				// Real wrap dimensions
				width_ = wrap.width();
				height_ = wrap.height();
				if (current.aspectRatio) {
					while ((width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight) {
						if (steps++ > 19) {
							break;
						}
						height = Math.max(minHeight, Math.min(maxHeight, height - 10));
						width = getScalar(height * ratio);
						if (width < minWidth) {
							width = minWidth;
							height = getScalar(width / ratio);
						}
						if (width > maxWidth) {
							width = maxWidth;
							height = getScalar(width / ratio);
						}
						inner.width(width).height(height);
						wrap.width(width + wPadding);
						width_ = wrap.width();
						height_ = wrap.height();

					}
				} else {
					width = Math.max(minWidth, Math.min(width, width - (width_ - maxWidth_)));
					height = Math.max(minHeight, Math.min(height, height - (height_ - maxHeight_)));
				}
			}
			if (scrollOut && scrolling === 'auto' && height < origHeight && (width + wPadding + scrollOut) < maxWidth_) {
				width += scrollOut;
			}
			inner.width(width).height(height);
			wrap.width(width + wPadding);
			width_ = wrap.width();
			height_ = wrap.height();
			canShrink = (width_ > maxWidth_ || height_ > maxHeight_) && width > minWidth && height > minHeight;
			canExpand = current.aspectRatio ? (width < origMaxWidth && height < origMaxHeight && width < origWidth && height < origHeight) : ((width < origMaxWidth || height < origMaxHeight) && (width < origWidth || height < origHeight));
			$.extend(current, {
				dim: {
					width: getValue(width_),
					height: getValue(height_)
				},
				origWidth: origWidth,
				origHeight: origHeight,
				canShrink: canShrink,
				canExpand: canExpand,
				wPadding: wPadding,
				hPadding: hPadding,
				wrapSpace: height_ - skin.outerHeight(true),
				skinSpace: skin.height() - height
			});
			if (!iframe && current.autoHeight && height > minHeight && height < maxHeight && !canExpand) {
				inner.height('auto');
			}
		},
		_getPosition: function (onlyAbsolute) {
			var current = K.current,
				viewport = K.getViewport(),
				margin = current.margin,
				width = K.wrap.width() + margin[1] + margin[3],
				height = K.wrap.height() + margin[0] + margin[2],
				rez = {
					position: 'absolute',
					top: margin[0],
					left: margin[3]
				};
			if (current.autoCenter && current.fixed && !onlyAbsolute && height <= viewport.h && width <= viewport.w) {
				rez.position = 'fixed';
			} else if (!current.locked) {
				rez.top += viewport.y;
				rez.left += viewport.x;
			}
			rez.top = getValue(Math.max(rez.top, rez.top + ((viewport.h - height) * current.topRatio)));
			rez.left = getValue(Math.max(rez.left, rez.left + ((viewport.w - width) * current.leftRatio)));
			return rez;
		},
		_afterZoomIn: function () {
			var current = K.current;
			if (!current) {
				return;
			}
			K.isOpen = K.isOpened = true;
			K.wrap.css('overflow', 'visible').addClass('kube-opened');
			K.update();
			// Assign a click event
			if (current.closeClick || (current.nextClick && K.group.length > 1)) {
				K.inner.css('cursor', 'pointer').bind('click.k', function (e) {
					if (!$(e.target).is('a') && !$(e.target).parent().is('a')) {
						e.preventDefault();
						K[current.closeClick ? 'close' : 'next']();
					}
				});
			}
			K.trigger('afterShow');
			// Stop the slideshow if this is the last item
			if (!current.loop && current.index === current.group.length - 1) {
				K.play(false);
			} else if (K.opts.autoPlay && !K.player.isActive) {
				K.opts.autoPlay = false;
				K.play();
			}
		},
		_afterZoomOut: function (obj) {
			obj = obj || K.current;
			$('.kube-wrap').trigger('onReset').remove();
			$.extend(K, {
				group: {},
				opts: {},
				router: false,
				current: null,
				isActive: false,
				isOpened: false,
				isOpen: false,
				isClosing: false,
				wrap: null,
				skin: null,
				outer: null,
				inner: null
			});
			K.trigger('afterClose', obj);
		}
	});
	/*
	 *	Default transitions
	 */
	K.transitions = {
		getOrigPosition: function () {
			var current = K.current,
				element = current.element,
				orig = current.orig,
				pos = {},
				width = 50,
				height = 50,
				hPadding = current.hPadding,
				wPadding = current.wPadding,
				viewport = K.getViewport();
			if (!orig && current.isDom && element.is(':visible')) {
				orig = element.find('img:first');
				if (!orig.length) {
					orig = element;
				}
			}
			if (isQuery(orig)) {
				pos = orig.offset();
				if (orig.is('img')) {
					width = orig.outerWidth();
					height = orig.outerHeight();
				}
			} else {
				pos.top = viewport.y + (viewport.h - height) * current.topRatio;
				pos.left = viewport.x + (viewport.w - width) * current.leftRatio;
			}
			if (K.wrap.css('position') === 'fixed' || current.locked) {
				pos.top -= viewport.y;
				pos.left -= viewport.x;
			}
			pos = {
				top: getValue(pos.top - hPadding * current.topRatio),
				left: getValue(pos.left - wPadding * current.leftRatio),
				width: getValue(width + wPadding),
				height: getValue(height + hPadding)
			};
			return pos;
		},
		step: function (now, fx) {
			var ratio,
				padding,
				value,
				prop = fx.prop,
				current = K.current,
				wrapSpace = current.wrapSpace,
				skinSpace = current.skinSpace;
			if (prop === 'width' || prop === 'height') {
				ratio = fx.end === fx.start ? 1 : (now - fx.start) / (fx.end - fx.start);
				if (K.isClosing) {
					ratio = 1 - ratio;
				}
				padding = prop === 'width' ? current.wPadding : current.hPadding;
				value = now - padding;
				K.skin[prop](getScalar(prop === 'width' ? value : value - (wrapSpace * ratio)));
				K.inner[prop](getScalar(prop === 'width' ? value : value - (wrapSpace * ratio) - (skinSpace * ratio)));
			}
		},
		zoomIn: function () {
			var current = K.current,
				startPos = current.pos,
				effect = current.openEffect,
				elastic = effect === 'elastic',
				endPos = $.extend({
					opacity: 1
				}, startPos);
			// Remove "position" property that breaks older IE
			delete endPos.position;
			if (elastic) {
				startPos = this.getOrigPosition();
				if (current.openOpacity) {
					startPos.opacity = 0.1;
				}
			} else if (effect === 'fade') {
				startPos.opacity = 0.1;
			}
			K.wrap.css(startPos).transition(endPos, {
				duration: effect === 'none' ? 0 : current.openSpeed,
				easing: current.openEasing,
				complete: K._afterZoomIn
			});
		},
		zoomOut: function () {
			var current = K.current,
				effect = current.closeEffect,
				elastic = effect === 'elastic',
				endPos = {
					opacity: 0.1
				};
			if (elastic) {
				endPos = this.getOrigPosition();
				if (current.closeOpacity) {
					endPos.opacity = 0.1;
				}
			}
			K.wrap.transition(endPos, {
				duration: effect === 'none' ? 0 : current.closeSpeed,
				easing: current.closeEasing,
				complete: K._afterZoomOut
			});
		},
		changeIn: function () {
			var current = K.current,
				effect = current.nextEffect,
				startPos = current.pos,
				endPos = {
					opacity: 1
				},
				direction = K.direction,
				distance = 200,
				field;
			startPos.opacity = 0.1;
			if (effect === 'elastic') {
				field = direction === 'down' || direction === 'up' ? 'top' : 'left';
				if (direction === 'down' || direction === 'right') {
					startPos[field] = getValue(getScalar(startPos[field]) - distance);
					endPos[field] = '+=' + distance + 'px';
				} else {
					startPos[field] = getValue(getScalar(startPos[field]) + distance);
					endPos[field] = '-=' + distance + 'px';
				}
			}
			// Workaround for http://bugs.jquery.com/ticket/12273
			if (effect === 'none') {
				K._afterZoomIn();
			} else {
				K.wrap.css(startPos).transition(endPos, {
					duration: current.nextSpeed,
					easing: current.nextEasing,
					complete: K._afterZoomIn
				});
			}
		},
		changeOut: function () {
			var previous = K.previous,
				effect = previous.prevEffect,
				endPos = {
					opacity: 0.1
				},
				direction = K.direction,
				distance = 200;
			if (effect === 'elastic') {
				endPos[direction === 'down' || direction === 'up' ? 'top' : 'left'] = (direction === 'up' || direction === 'left' ? '-' : '+') + '=' + distance + 'px';
			}
			previous.wrap.transition(endPos, {
				duration: effect === 'none' ? 0 : previous.prevSpeed,
				easing: previous.prevEasing,
				complete: function () {
					$(this).trigger('onReset').remove();
				}
			});
		}
	};
	/*
	 *	Overlay helper
	 */
	K.helpers.overlay = {
		defaults: {
			closeClick: true, // if true, Kube will be closed when user clicks on the overlay
			speedOut: 200, // duration of fadeOut animation
			showEarly: false, // indicates if should be opened immediately or wait until the content is ready
			css: {}, // custom CSS properties
			locked: false, // if true, the content will be locked into overlay
			fixed: true // if false, the overlay CSS position property will not be set to "fixed"
		},
		overlay: null, // current handle
		fixed: false, // indicates if the overlay has position "fixed"
		el: $('html'), // element that contains "the lock"
		// Public methods
		create: function (opts) {
			opts = $.extend({}, this.defaults, opts);
			if (this.overlay) {
				this.close();
			}
			this.overlay = $('<div class="kube-overlay"></div>').appendTo(K.coming ? K.coming.parent : opts.parent);
			this.fixed = false;
			if (opts.fixed && K.defaults.fixed) {
				this.overlay.addClass('kube-overlay-fixed');
				this.fixed = true;
			}
		},
		open: function (opts) {
			var that = this;
			opts = $.extend({}, this.defaults, opts);
			if (this.overlay) {
				this.overlay.unbind('.overlay').width('auto').height('auto');
			} else {
				this.create(opts);
			}
			if (!this.fixed) {
				W.bind('resize.overlay', $.proxy(this.update, this));
				this.update();
			}
			if (opts.closeClick) {
				this.overlay.bind('click.overlay', function (e) {
					if ($(e.target).hasClass('kube-overlay')) {
						if (K.isActive) {
							K.close();
						} else {
							that.close();
						}
						return false;
					}
				});
			}
			this.overlay.css(opts.css).show();
		},
		close: function () {
			var scrollV, scrollH;
			W.unbind('resize.overlay');
			if (this.el.hasClass('kube-lock')) {
				$('.kube-margin').removeClass('kube-margin');
				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();
				this.el.removeClass('kube-lock');
				W.scrollTop(scrollV).scrollLeft(scrollH);
			}
			$('.kube-overlay').remove().hide();
			$.extend(this, {
				overlay: null,
				fixed: false
			});
		},
		// Private, callbacks
		update: function () {
			var width = '100%',
				offsetWidth;
			// Reset width/height so it will not mess
			this.overlay.width(width).height('100%');
			// jQuery does not return reliable result for IE
			if (IE) {
				offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);
				if (D.width() > offsetWidth) {
					width = D.width();
				}
			} else if (D.width() > W.width()) {
				width = D.width();
			}
			this.overlay.width(width).height(D.height());
		},
		// This is where we can manipulate DOM, because later it would cause iframes to reload
		onReady: function (opts, obj) {
			var overlay = this.overlay;
			$('.kube-overlay').stop(true, true);
			if (!overlay) {
				this.create(opts);
			}
			if (opts.locked && this.fixed && obj.fixed) {
				if (!overlay) {
					this.margin = D.height() > W.height() ? $('html').css('margin-right').replace("px", "") : false;
				}
				obj.locked = this.overlay.append(obj.wrap);
				obj.fixed = false;
			}
			if (opts.showEarly === true) {
				this.beforeShow.apply(this, arguments);
			}
		},
		beforeShow: function (opts, obj) {
			var scrollV, scrollH;
			if (obj.locked) {
				if (this.margin !== false) {
					$('*').filter(function () {
						return ($(this).css('position') === 'fixed' && !$(this).hasClass("kube-overlay") && !$(this).hasClass("kube-wrap"));
					}).addClass('kube-margin');
					this.el.addClass('kube-margin');
				}
				scrollV = W.scrollTop();
				scrollH = W.scrollLeft();
				this.el.addClass('kube-lock');
				W.scrollTop(scrollV).scrollLeft(scrollH);
			}
			this.open(opts);
		},
		onUpdate: function () {
			if (!this.fixed) {
				this.update();
			}
		},
		afterClose: function (opts) {
			// Remove overlay if exists and Kube is not opening
			// (e.g., it is not being open using afterClose callback)
			//if (this.overlay && !K.isActive) {
			if (this.overlay && !K.coming) {
				this.overlay.fadeOut(opts.speedOut, $.proxy(this.close, this));
			}
		}
	};
	/*
	 *	Title helper
	 */
	K.helpers.title = {
		defaults: {
			type: 'over', // 'float', 'inside', 'outside' or 'over',
			position: 'bottom' // 'top' or 'bottom'
		},
		beforeShow: function (opts) {
			var current = K.current,
				text = current.title,
				type = opts.type,
				title,
				target;
			if ($.isFunction(text)) {
				text = text.call(current.element, current);
			}
			if (!isString(text) || $.trim(text) === '') {
				return;
			}
			title = $('<div class="kube-title kube-title-' + type + '-wrap"><span>' + text + '</span></div>');
			switch (type) {
			case 'over':
				target = K.wrap;
				break;
			}
			title[(opts.position === 'top' ? 'prependTo' : 'appendTo')](target);
		}
	};
	/*
	 *	Button helper
	 */
	K.helpers.buttons = {
		defaults: {
			skipSingle: true, // disables if gallery contains single image
			tpl: '<div class="kube-controls"><a class="kube-prev" title="Previous" href="javascript:;"><span></span></a><a class="kube-slideshow" title="Start slideshow" href="javascript:;"><span></span></a><a class="kube-toggle" title="Toggle fullscreen" href="javascript:;"><span></span></a><a class="kube-close" title="Close" href="javascript:;"><span></span></a><a class="kube-next" title="Next" href="javascript:;"><span></span></a></div>'
		},
		list: null,
		buttons: null,
		beforeShow: function (opts, obj) {
			this.list = $(opts.tpl).appendTo(K.skin);
			//Remove self if gallery do not have at least two items
			this.buttons = {
				prev: this.list.find('.kube-prev').click(K.prev),
				next: this.list.find('.kube-next').click(K.next),
				play: this.list.find('.kube-slideshow').click(K.play),
				toggle: this.list.find('.kube-toggle').click(K.toggle),
				close: this.list.find('.kube-close').click(K.close)
			};
			if (opts.skipSingle && obj.group.length < 2) {
				this.buttons.play.remove();
				this.buttons.prev.remove();
				this.buttons.next.remove();
			}
			if (K.player.isActive)
				this.buttons.play.addClass('playing');
		},
		onPlayStart: function () {
			if (this.buttons) {
				this.buttons.play.attr('title', 'Pause slideshow').addClass('playing');
			}
		},
		onPlayEnd: function () {
			if (this.buttons) {
				this.buttons.play.attr('title', 'Start slideshow').removeClass('playing');
			}
		},
		afterShow: function (opts, obj) {
			//Prev
			if (obj.index > 0 || obj.loop) {
				this.buttons.prev.removeClass('btnDisabled');
			} else {
				this.buttons.prev.addClass('btnDisabled');
			}
			//Next / Play
			if (obj.loop || obj.index < obj.group.length - 1) {
				this.buttons.next.removeClass('btnDisabled');
				this.buttons.play.removeClass('btnDisabled');
			} else {
				this.buttons.next.addClass('btnDisabled');
				this.buttons.play.addClass('btnDisabled');
			}
			this.onUpdate(opts, obj);
		},
		onUpdate: function (opts, obj) {
			var toggle;
			if (!this.buttons) {
				return;
			}
			toggle = this.buttons.toggle.removeClass('btnDisabled fs');
			//Size toggle button
			if (obj.canShrink) {
				toggle.addClass('fs');
			} else if (!obj.canExpand) {
				toggle.addClass('btnDisabled');
			}
		},
		beforeClose: function () {
			if (this.list) {
				this.list.remove();
			}
			this.list = null;
			this.buttons = null;
		}
	};
	/*
	 *	Social helper
	 */
	K.helpers.social = {
		defaults: {
			facebook: true,
			twitter: true,
			plusone: true,
			tpl: {
				twitter: '<a href="https://twitter.com/share" class="twitter-share-button" data-count="none" data-url="{url}"></a>',
				facebook: '<div class="fb-share-button" data-href="{url}" data-type="button"></div>',
				plusone: '<div class="g-plusone" data-size="medium" data-annotation="none" data-href="{url}"></div>'
			}
		},
		beforeShow: function (opts) {
			var current = K.current,
				href = current.href,
				target = K.skin,
				social;
			if (!opts.facebook && !opts.twitter && !opts.plusone) {
				return;
			}
			social = $('<div />', {
				'class': 'kube-social'
			});
			var tw = opts.tpl.twitter.replace('{url}', href),
				fb = opts.tpl.facebook.replace('{url}', href),
				po = opts.tpl.plusone.replace('{url}', href);
			if (opts.facebook)
				social.append(fb);
			if (opts.twitter)
				social.append(tw);
			if (opts.plusone)
				social.append(po);
			K.wrap.addClass('kube-has-social');
			social.appendTo(target);
		},
		afterShow: function (opts) {
			var current = K.current;
			// Render tweet button
			if (!opts.facebook && !opts.twitter && !opts.plusone)
				return;
			else {
				if (opts.facebook)
					FB.XFBML.parse();
				if (opts.twitter)
					twttr.widgets.load();
				if (opts.plusone)
					gapi.plusone.go();
			}
		}
	};
	/*
	 *	Media helper
	 */
	K.helpers.media = {
		defaults: {
			youtube: {
				matcher: /(youtube\.com|youtu\.be|youtube-nocookie\.com)\/(watch\?v=|v\/|u\/|embed\/?)?(videoseries\?list=(.*)|[\w-]{11}|\?listType=(.*)&list=(.*)).*/i,
				params: {
					autoplay: 1,
					autohide: 1,
					fs: 1,
					rel: 0,
					hd: 1,
					wmode: 'opaque',
					enablejsapi: 1
				},
				type: 'iframe',
				url: '//www.youtube.com/embed/$3'
			},
			vimeo: {
				matcher: /(?:vimeo(?:pro)?.com)\/(?:[^\d]+)?(\d+)(?:.*)/,
				params: {
					autoplay: 1,
					hd: 1,
					show_title: 1,
					show_byline: 1,
					show_portrait: 0,
					fullscreen: 1
				},
				type: 'iframe',
				url: '//player.vimeo.com/video/$1'
			},
			metacafe: {
				matcher: /metacafe.com\/(?:watch|fplayer)\/([\w\-]{1,10})/,
				params: {
					autoPlay: 'yes'
				},
				type: 'swf',
				url: function (rez, params, obj) {
					obj.swf.flashVars = 'playerVars=' + $.param(params, true);
					return '//www.metacafe.com/fplayer/' + rez[1] + '/.swf';
				}
			},
			dailymotion: {
				matcher: /dailymotion.com\/video\/(.*)\/?(.*)/,
				params: {
					additionalInfos: 0,
					autoStart: 1
				},
				type: 'iframe',
				url: '//www.dailymotion.com/swf/video/$1'
			},
			telly: {
				matcher: /telly\.com\/([a-zA-Z0-9_\-\?\=]+)/i,
				params: {
					autoplay: 1
				},
				type: 'iframe',
				url: '//www.telly.com/embed.php?guid=$1'
			},
			twitvid: {
				matcher: /twitvid\.com\/([a-zA-Z0-9_\-\?\=]+)/i,
				params: {
					autoplay: 0
				},
				type: 'iframe',
				url: '//www.twitvid.com/embed.php?guid=$1'
			},
			twitpic: {
				matcher: /twitpic\.com\/(?!(?:place|photos|events)\/)([a-zA-Z0-9\?\=\-]+)/i,
				type: 'image',
				url: '//twitpic.com/show/full/$1/'
			},
			instagram: {
				matcher: /(instagr\.am|instagram\.com)\/p\/([a-zA-Z0-9_\-]+)\/?/i,
				type: 'image',
				url: '//$1/p/$2/media/?size=l'
			},
			google_maps: {
				matcher: /maps\.google\.([a-z]{2,3}(\.[a-z]{2})?)\/(\?ll=|maps\?)(.*)/i,
				type: 'iframe',
				url: function (rez) {
					return '//maps.google.' + rez[1] + '/' + rez[3] + '' + rez[4] + '&output=' + (rez[4].indexOf('layer=c') > 0 ? 'svembed' : 'embed');
				}
			}
		},
		beforeLoad: function (opts, obj) {
			var url = obj.href || '',
				type = false,
				what,
				item,
				rez,
				params;
			for (what in opts) {
				if (opts.hasOwnProperty(what)) {
					item = opts[what];
					rez = url.match(item.matcher);
					if (rez) {
						type = item.type;
						params = $.extend(true, {}, item.params, obj[what] || ($.isPlainObject(opts[what]) ? opts[what].params : null));
						url = $.type(item.url) === "function" ? item.url.call(this, rez, params, obj) : format(item.url, rez, params);
						break;
					}
				}
			}
			if (type) {
				obj.href = url;
				obj.type = type;
				obj.autoHeight = false;
			}
		}
	};
	// jQuery plugin initialization
	$.fn.kube = function (options) {
		var index,
			that = $(this),
			selector = this.selector || '',
			run = function (e) {
				var what = $(this).blur(),
					idx = index,
					relType, relVal;
				if (!(e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) && !what.is('.kube-wrap')) {
					relType = options.groupAttr || 'data-kube-group';
					relVal = what.attr(relType);
					if (!relVal) {
						relType = 'rel';
						relVal = what.get(0)[relType];
					}
					if (relVal && relVal !== '' && relVal !== 'nofollow') {
						what = selector.length ? $(selector) : that;

						what = what.filter('[' + relType + '="' + relVal + '"]');
						idx = what.index(this);
					}
					options.index = idx;
					// Stop an event from bubbling if everything is fine
					if (K.open(what, options) !== false) {
						e.preventDefault();
					}
				}
			};
		options = options || {};
		index = options.index || 0;
		if (!selector || options.live === false) {
			that.unbind('click.k-start').bind('click.k-start', run);
		} else {
			D.undelegate(selector, 'click.k-start').delegate(selector + ":not('.kube-item')", 'click.k-start', run);
		}
		this.filter('[data-kube-start=1]').trigger('click');
		return this;
	};
	// Tests that need a body at doc ready
	D.ready(function () {
		var w1, w2;
		if ($.scrollbarWidth === undefined) {
			// http://benalman.com/projects/jquery-misc-plugins/#scrollbarwidth
			$.scrollbarWidth = function () {
				var parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body'),
					child = parent.children(),
					width = child.innerWidth() - child.height(99).innerWidth();
				parent.remove();
				return width;
			};
		}
		if ($.support.fixedPosition === undefined) {
			$.support.fixedPosition = (function () {
				var elem = $('<div style="position:fixed;top:20px;"></div>').appendTo('body'),
					fixed = (elem[0].offsetTop === 20 || elem[0].offsetTop === 15);
				elem.remove();
				return fixed;
			}());
		}
		$.extend(K.defaults, {
			scrollbarWidth: $.scrollbarWidth(),
			fixed: $.support.fixedPosition,
			parent: $('body')
		});
		//Get real width of page scroll-bar
		w1 = $(window).width();
		H.addClass('kube-lock-test');
		w2 = $(window).width();
		H.removeClass('kube-lock-test');
		$("<style type='text/css'>.kube-margin{margin-right:" + (w2 - w1) + "px;}</style>").appendTo("head");
	});
}(window, document, jQuery));