(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.generate = factory());
})(this, (function () { 'use strict';

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  // resolves . and .. elements in a path array with directory names there
  // must be no slashes, empty elements, or device names (c:\) in the array
  // (so also no leading and trailing slashes - it does not distinguish
  // relative and absolute paths)
  function normalizeArray(parts, allowAboveRoot) {
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = parts.length - 1; i >= 0; i--) {
      var last = parts[i];
      if (last === '.') {
        parts.splice(i, 1);
      } else if (last === '..') {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }

    // if the path is allowed to go above the root, restore leading ..s
    if (allowAboveRoot) {
      for (; up--; up) {
        parts.unshift('..');
      }
    }

    return parts;
  }

  // Split a filename into [root, dir, basename, ext], unix version
  // 'root' is just a slash, or nothing.
  var splitPathRe =
      /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  var splitPath = function(filename) {
    return splitPathRe.exec(filename).slice(1);
  };

  // path.resolve([from ...], to)
  // posix version
  function resolve() {
    var resolvedPath = '',
        resolvedAbsolute = false;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path = (i >= 0) ? arguments[i] : '/';

      // Skip empty and invalid entries
      if (typeof path !== 'string') {
        throw new TypeError('Arguments to path.resolve must be strings');
      } else if (!path) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charAt(0) === '/';
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
      return !!p;
    }), !resolvedAbsolute).join('/');

    return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
  }
  // path.normalize(path)
  // posix version
  function normalize(path) {
    var isPathAbsolute = isAbsolute(path),
        trailingSlash = substr(path, -1) === '/';

    // Normalize the path
    path = normalizeArray(filter(path.split('/'), function(p) {
      return !!p;
    }), !isPathAbsolute).join('/');

    if (!path && !isPathAbsolute) {
      path = '.';
    }
    if (path && trailingSlash) {
      path += '/';
    }

    return (isPathAbsolute ? '/' : '') + path;
  }
  // posix version
  function isAbsolute(path) {
    return path.charAt(0) === '/';
  }

  // posix version
  function join() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return normalize(filter(paths, function(p, index) {
      if (typeof p !== 'string') {
        throw new TypeError('Arguments to path.join must be strings');
      }
      return p;
    }).join('/'));
  }


  // path.relative(from, to)
  // posix version
  function relative(from, to) {
    from = resolve(from).substr(1);
    to = resolve(to).substr(1);

    function trim(arr) {
      var start = 0;
      for (; start < arr.length; start++) {
        if (arr[start] !== '') break;
      }

      var end = arr.length - 1;
      for (; end >= 0; end--) {
        if (arr[end] !== '') break;
      }

      if (start > end) return [];
      return arr.slice(start, end - start + 1);
    }

    var fromParts = trim(from.split('/'));
    var toParts = trim(to.split('/'));

    var length = Math.min(fromParts.length, toParts.length);
    var samePartsLength = length;
    for (var i = 0; i < length; i++) {
      if (fromParts[i] !== toParts[i]) {
        samePartsLength = i;
        break;
      }
    }

    var outputParts = [];
    for (var i = samePartsLength; i < fromParts.length; i++) {
      outputParts.push('..');
    }

    outputParts = outputParts.concat(toParts.slice(samePartsLength));

    return outputParts.join('/');
  }

  var sep = '/';
  var delimiter$1 = ':';

  function dirname(path) {
    var result = splitPath(path),
        root = result[0],
        dir = result[1];

    if (!root && !dir) {
      // No dirname whatsoever
      return '.';
    }

    if (dir) {
      // It has a dirname, strip trailing slash
      dir = dir.substr(0, dir.length - 1);
    }

    return root + dir;
  }

  function basename(path, ext) {
    var f = splitPath(path)[2];
    // TODO: make this comparison case-insensitive on windows?
    if (ext && f.substr(-1 * ext.length) === ext) {
      f = f.substr(0, f.length - ext.length);
    }
    return f;
  }


  function extname(path) {
    return splitPath(path)[3];
  }
  var path = {
    extname: extname,
    basename: basename,
    dirname: dirname,
    sep: sep,
    delimiter: delimiter$1,
    relative: relative,
    join: join,
    isAbsolute: isAbsolute,
    normalize: normalize,
    resolve: resolve
  };
  function filter (xs, f) {
      if (xs.filter) return xs.filter(f);
      var res = [];
      for (var i = 0; i < xs.length; i++) {
          if (f(xs[i], i, xs)) res.push(xs[i]);
      }
      return res;
  }

  // String.prototype.substr - negative index don't work in IE8
  var substr = 'ab'.substr(-1) === 'b' ?
      function (str, start, len) { return str.substr(start, len) } :
      function (str, start, len) {
          if (start < 0) start = str.length + start;
          return str.substr(start, len);
      }
  ;

  var fs = {};

  const ANSI_BACKGROUND_OFFSET = 10;

  const wrapAnsi16 = (offset = 0) => code => `\u001B[${code + offset}m`;

  const wrapAnsi256 = (offset = 0) => code => `\u001B[${38 + offset};5;${code}m`;

  const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;

  function assembleStyles() {
  	const codes = new Map();
  	const styles = {
  		modifier: {
  			reset: [0, 0],
  			// 21 isn't widely supported and 22 does the same thing
  			bold: [1, 22],
  			dim: [2, 22],
  			italic: [3, 23],
  			underline: [4, 24],
  			overline: [53, 55],
  			inverse: [7, 27],
  			hidden: [8, 28],
  			strikethrough: [9, 29],
  		},
  		color: {
  			black: [30, 39],
  			red: [31, 39],
  			green: [32, 39],
  			yellow: [33, 39],
  			blue: [34, 39],
  			magenta: [35, 39],
  			cyan: [36, 39],
  			white: [37, 39],

  			// Bright color
  			blackBright: [90, 39],
  			redBright: [91, 39],
  			greenBright: [92, 39],
  			yellowBright: [93, 39],
  			blueBright: [94, 39],
  			magentaBright: [95, 39],
  			cyanBright: [96, 39],
  			whiteBright: [97, 39],
  		},
  		bgColor: {
  			bgBlack: [40, 49],
  			bgRed: [41, 49],
  			bgGreen: [42, 49],
  			bgYellow: [43, 49],
  			bgBlue: [44, 49],
  			bgMagenta: [45, 49],
  			bgCyan: [46, 49],
  			bgWhite: [47, 49],

  			// Bright color
  			bgBlackBright: [100, 49],
  			bgRedBright: [101, 49],
  			bgGreenBright: [102, 49],
  			bgYellowBright: [103, 49],
  			bgBlueBright: [104, 49],
  			bgMagentaBright: [105, 49],
  			bgCyanBright: [106, 49],
  			bgWhiteBright: [107, 49],
  		},
  	};

  	// Alias bright black as gray (and grey)
  	styles.color.gray = styles.color.blackBright;
  	styles.bgColor.bgGray = styles.bgColor.bgBlackBright;
  	styles.color.grey = styles.color.blackBright;
  	styles.bgColor.bgGrey = styles.bgColor.bgBlackBright;

  	for (const [groupName, group] of Object.entries(styles)) {
  		for (const [styleName, style] of Object.entries(group)) {
  			styles[styleName] = {
  				open: `\u001B[${style[0]}m`,
  				close: `\u001B[${style[1]}m`,
  			};

  			group[styleName] = styles[styleName];

  			codes.set(style[0], style[1]);
  		}

  		Object.defineProperty(styles, groupName, {
  			value: group,
  			enumerable: false,
  		});
  	}

  	Object.defineProperty(styles, 'codes', {
  		value: codes,
  		enumerable: false,
  	});

  	styles.color.close = '\u001B[39m';
  	styles.bgColor.close = '\u001B[49m';

  	styles.color.ansi = wrapAnsi16();
  	styles.color.ansi256 = wrapAnsi256();
  	styles.color.ansi16m = wrapAnsi16m();
  	styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  	styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  	styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);

  	// From https://github.com/Qix-/color-convert/blob/3f0e0d4e92e235796ccb17f6e85c72094a651f49/conversions.js
  	Object.defineProperties(styles, {
  		rgbToAnsi256: {
  			value: (red, green, blue) => {
  				// We use the extended greyscale palette here, with the exception of
  				// black and white. normal palette only has 4 greyscale shades.
  				if (red === green && green === blue) {
  					if (red < 8) {
  						return 16;
  					}

  					if (red > 248) {
  						return 231;
  					}

  					return Math.round(((red - 8) / 247) * 24) + 232;
  				}

  				return 16
  					+ (36 * Math.round(red / 255 * 5))
  					+ (6 * Math.round(green / 255 * 5))
  					+ Math.round(blue / 255 * 5);
  			},
  			enumerable: false,
  		},
  		hexToRgb: {
  			value: hex => {
  				const matches = /(?<colorString>[a-f\d]{6}|[a-f\d]{3})/i.exec(hex.toString(16));
  				if (!matches) {
  					return [0, 0, 0];
  				}

  				let {colorString} = matches.groups;

  				if (colorString.length === 3) {
  					colorString = [...colorString].map(character => character + character).join('');
  				}

  				const integer = Number.parseInt(colorString, 16);

  				return [
  					/* eslint-disable no-bitwise */
  					(integer >> 16) & 0xFF,
  					(integer >> 8) & 0xFF,
  					integer & 0xFF,
  					/* eslint-enable no-bitwise */
  				];
  			},
  			enumerable: false,
  		},
  		hexToAnsi256: {
  			value: hex => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
  			enumerable: false,
  		},
  		ansi256ToAnsi: {
  			value: code => {
  				if (code < 8) {
  					return 30 + code;
  				}

  				if (code < 16) {
  					return 90 + (code - 8);
  				}

  				let red;
  				let green;
  				let blue;

  				if (code >= 232) {
  					red = (((code - 232) * 10) + 8) / 255;
  					green = red;
  					blue = red;
  				} else {
  					code -= 16;

  					const remainder = code % 36;

  					red = Math.floor(code / 36) / 5;
  					green = Math.floor(remainder / 6) / 5;
  					blue = (remainder % 6) / 5;
  				}

  				const value = Math.max(red, green, blue) * 2;

  				if (value === 0) {
  					return 30;
  				}

  				// eslint-disable-next-line no-bitwise
  				let result = 30 + ((Math.round(blue) << 2) | (Math.round(green) << 1) | Math.round(red));

  				if (value === 2) {
  					result += 60;
  				}

  				return result;
  			},
  			enumerable: false,
  		},
  		rgbToAnsi: {
  			value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
  			enumerable: false,
  		},
  		hexToAnsi: {
  			value: hex => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
  			enumerable: false,
  		},
  	});

  	return styles;
  }

  const ansiStyles = assembleStyles();

  /* eslint-env browser */

  const isBlinkBasedBrowser = /\b(Chrome|Chromium)\//.test(navigator.userAgent);

  const colorSupport = isBlinkBasedBrowser ? {
  	level: 1,
  	hasBasic: true,
  	has256: false,
  	has16m: false,
  } : false;

  const supportsColor = {
  	stdout: colorSupport,
  	stderr: colorSupport,
  };

  // TODO: When targeting Node.js 16, use `String.prototype.replaceAll`.
  function stringReplaceAll(string, substring, replacer) {
  	let index = string.indexOf(substring);
  	if (index === -1) {
  		return string;
  	}

  	const substringLength = substring.length;
  	let endIndex = 0;
  	let returnValue = '';
  	do {
  		returnValue += string.substr(endIndex, index - endIndex) + substring + replacer;
  		endIndex = index + substringLength;
  		index = string.indexOf(substring, endIndex);
  	} while (index !== -1);

  	returnValue += string.slice(endIndex);
  	return returnValue;
  }

  function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  	let endIndex = 0;
  	let returnValue = '';
  	do {
  		const gotCR = string[index - 1] === '\r';
  		returnValue += string.substr(endIndex, (gotCR ? index - 1 : index) - endIndex) + prefix + (gotCR ? '\r\n' : '\n') + postfix;
  		endIndex = index + 1;
  		index = string.indexOf('\n', endIndex);
  	} while (index !== -1);

  	returnValue += string.slice(endIndex);
  	return returnValue;
  }

  const {stdout: stdoutColor, stderr: stderrColor} = supportsColor;

  const GENERATOR = Symbol('GENERATOR');
  const STYLER = Symbol('STYLER');
  const IS_EMPTY = Symbol('IS_EMPTY');

  // `supportsColor.level` → `ansiStyles.color[name]` mapping
  const levelMapping = [
  	'ansi',
  	'ansi',
  	'ansi256',
  	'ansi16m',
  ];

  const styles = Object.create(null);

  const applyOptions = (object, options = {}) => {
  	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
  		throw new Error('The `level` option should be an integer from 0 to 3');
  	}

  	// Detect level if not set manually
  	const colorLevel = stdoutColor ? stdoutColor.level : 0;
  	object.level = options.level === undefined ? colorLevel : options.level;
  };

  const chalkFactory = options => {
  	const chalk = (...strings) => strings.join(' ');
  	applyOptions(chalk, options);

  	Object.setPrototypeOf(chalk, createChalk.prototype);

  	return chalk;
  };

  function createChalk(options) {
  	return chalkFactory(options);
  }

  Object.setPrototypeOf(createChalk.prototype, Function.prototype);

  for (const [styleName, style] of Object.entries(ansiStyles)) {
  	styles[styleName] = {
  		get() {
  			const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
  			Object.defineProperty(this, styleName, {value: builder});
  			return builder;
  		},
  	};
  }

  styles.visible = {
  	get() {
  		const builder = createBuilder(this, this[STYLER], true);
  		Object.defineProperty(this, 'visible', {value: builder});
  		return builder;
  	},
  };

  const getModelAnsi = (model, level, type, ...arguments_) => {
  	if (model === 'rgb') {
  		if (level === 'ansi16m') {
  			return ansiStyles[type].ansi16m(...arguments_);
  		}

  		if (level === 'ansi256') {
  			return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
  		}

  		return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
  	}

  	if (model === 'hex') {
  		return getModelAnsi('rgb', level, type, ...ansiStyles.hexToRgb(...arguments_));
  	}

  	return ansiStyles[type][model](...arguments_);
  };

  const usedModels = ['rgb', 'hex', 'ansi256'];

  for (const model of usedModels) {
  	styles[model] = {
  		get() {
  			const {level} = this;
  			return function (...arguments_) {
  				const styler = createStyler(getModelAnsi(model, levelMapping[level], 'color', ...arguments_), ansiStyles.color.close, this[STYLER]);
  				return createBuilder(this, styler, this[IS_EMPTY]);
  			};
  		},
  	};

  	const bgModel = 'bg' + model[0].toUpperCase() + model.slice(1);
  	styles[bgModel] = {
  		get() {
  			const {level} = this;
  			return function (...arguments_) {
  				const styler = createStyler(getModelAnsi(model, levelMapping[level], 'bgColor', ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
  				return createBuilder(this, styler, this[IS_EMPTY]);
  			};
  		},
  	};
  }

  const proto$1 = Object.defineProperties(() => {}, {
  	...styles,
  	level: {
  		enumerable: true,
  		get() {
  			return this[GENERATOR].level;
  		},
  		set(level) {
  			this[GENERATOR].level = level;
  		},
  	},
  });

  const createStyler = (open, close, parent) => {
  	let openAll;
  	let closeAll;
  	if (parent === undefined) {
  		openAll = open;
  		closeAll = close;
  	} else {
  		openAll = parent.openAll + open;
  		closeAll = close + parent.closeAll;
  	}

  	return {
  		open,
  		close,
  		openAll,
  		closeAll,
  		parent,
  	};
  };

  const createBuilder = (self, _styler, _isEmpty) => {
  	// Single argument is hot path, implicit coercion is faster than anything
  	// eslint-disable-next-line no-implicit-coercion
  	const builder = (...arguments_) => applyStyle(builder, (arguments_.length === 1) ? ('' + arguments_[0]) : arguments_.join(' '));

  	// We alter the prototype because we must return a function, but there is
  	// no way to create a function with a different prototype
  	Object.setPrototypeOf(builder, proto$1);

  	builder[GENERATOR] = self;
  	builder[STYLER] = _styler;
  	builder[IS_EMPTY] = _isEmpty;

  	return builder;
  };

  const applyStyle = (self, string) => {
  	if (self.level <= 0 || !string) {
  		return self[IS_EMPTY] ? '' : string;
  	}

  	let styler = self[STYLER];

  	if (styler === undefined) {
  		return string;
  	}

  	const {openAll, closeAll} = styler;
  	if (string.includes('\u001B')) {
  		while (styler !== undefined) {
  			// Replace any instances already present with a re-opening code
  			// otherwise only the part of the string until said closing code
  			// will be colored, and the rest will simply be 'plain'.
  			string = stringReplaceAll(string, styler.close, styler.open);

  			styler = styler.parent;
  		}
  	}

  	// We can move both next actions out of loop, because remaining actions in loop won't have
  	// any/visible effect on parts we add here. Close the styling before a linebreak and reopen
  	// after next line to fix a bleed issue on macOS: https://github.com/chalk/chalk/pull/92
  	const lfIndex = string.indexOf('\n');
  	if (lfIndex !== -1) {
  		string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  	}

  	return openAll + string + closeAll;
  };

  Object.defineProperties(createChalk.prototype, styles);

  const chalk = createChalk();
  createChalk({level: stderrColor ? stderrColor.level : 0});

  const errorLog = (error) => { console.log(chalk.red(`${error}`)); };
  // 递归创建目录
  function mkdirs(directory, callback) {
      var exists = fs.existsSync(directory);
      if (exists) {
          callback();
      }
      else {
          mkdirs(path.dirname(directory), function () {
              fs.mkdirSync(directory);
              callback();
          });
      }
  }
  // 创建目录
  function dotExistDirectoryCreate(directory) {
      return new Promise((resolve) => {
          mkdirs(directory, function () {
              resolve(true);
          });
      });
  }
  // 根据路径和数据写文件
  const generateFile = (path, data) => {
      if (fs.existsSync(path)) {
          errorLog(`${path}文件已存在`);
          return;
      }
      return new Promise((resolve, reject) => {
          fs.writeFile(path, data, 'utf8', (err) => {
              if (err) {
                  errorLog(err.message);
                  reject(err);
              }
              else {
                  resolve(true);
              }
          });
      });
  };

  var fileUtil = /*#__PURE__*/Object.freeze({
    __proto__: null,
    dotExistDirectoryCreate: dotExistDirectoryCreate,
    generateFile: generateFile
  });

  function getAugmentedNamespace(n) {
  	if (n.__esModule) return n;
  	var a = Object.defineProperty({}, '__esModule', {value: true});
  	Object.keys(n).forEach(function (k) {
  		var d = Object.getOwnPropertyDescriptor(n, k);
  		Object.defineProperty(a, k, d.get ? d : {
  			enumerable: true,
  			get: function () {
  				return n[k];
  			}
  		});
  	});
  	return a;
  }

  var mysql$1 = {};

  var global$1 = (typeof global !== "undefined" ? global :
    typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window : {});

  // shim for using process in browser
  // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

  function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout () {
      throw new Error('clearTimeout has not been defined');
  }
  var cachedSetTimeout = defaultSetTimout;
  var cachedClearTimeout = defaultClearTimeout;
  if (typeof global$1.setTimeout === 'function') {
      cachedSetTimeout = setTimeout;
  }
  if (typeof global$1.clearTimeout === 'function') {
      cachedClearTimeout = clearTimeout;
  }

  function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
      } catch(e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
          } catch(e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
          }
      }


  }
  function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
      } catch (e){
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
          } catch (e){
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
          }
      }



  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }

  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while(len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
  }
  function nextTick(fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
      }
  }
  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  var title = 'browser';
  var platform = 'browser';
  var browser = true;
  var env = {};
  var argv = [];
  var version = ''; // empty string to avoid regexp issues
  var versions = {};
  var release = {};
  var config = {};

  function noop() {}

  var on = noop;
  var addListener = noop;
  var once = noop;
  var off = noop;
  var removeListener = noop;
  var removeAllListeners = noop;
  var emit = noop;

  function binding(name) {
      throw new Error('process.binding is not supported');
  }

  function cwd () { return '/' }
  function chdir (dir) {
      throw new Error('process.chdir is not supported');
  }function umask() { return 0; }

  // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
  var performance = global$1.performance || {};
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() };

  // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  function hrtime(previousTimestamp){
    var clocktime = performanceNow.call(performance)*1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor((clocktime%1)*1e9);
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      if (nanoseconds<0) {
        seconds--;
        nanoseconds += 1e9;
      }
    }
    return [seconds,nanoseconds]
  }

  var startTime = new Date();
  function uptime() {
    var currentTime = new Date();
    var dif = currentTime - startTime;
    return dif / 1000;
  }

  var browser$1 = {
    nextTick: nextTick,
    title: title,
    browser: browser,
    env: env,
    argv: argv,
    version: version,
    versions: versions,
    on: on,
    addListener: addListener,
    once: once,
    off: off,
    removeListener: removeListener,
    removeAllListeners: removeAllListeners,
    emit: emit,
    binding: binding,
    cwd: cwd,
    chdir: chdir,
    umask: umask,
    hrtime: hrtime,
    platform: platform,
    release: release,
    config: config,
    uptime: uptime
  };

  var Crypto           = require('crypto');
  var Events           = require('events');
  var Net              = require('net');
  var tls              = require('tls');
  var ConnectionConfig$2 = require('./ConnectionConfig');
  var Protocol         = require('./protocol/Protocol');
  var SqlString$3        = require('./protocol/SqlString');
  var Query            = require('./protocol/sequences/Query');
  var Util$2             = require('util');

  module.exports = Connection$2;
  Util$2.inherits(Connection$2, Events.EventEmitter);
  function Connection$2(options) {
    Events.EventEmitter.call(this);

    this.config = options.config;

    this._socket        = options.socket;
    this._protocol      = new Protocol({config: this.config, connection: this});
    this._connectCalled = false;
    this.state          = 'disconnected';
    this.threadId       = null;
  }

  Connection$2.createQuery = function createQuery(sql, values, callback) {
    if (sql instanceof Query) {
      return sql;
    }

    var cb      = callback;
    var options = {};

    if (typeof sql === 'function') {
      cb = sql;
    } else if (typeof sql === 'object') {
      options = Object.create(sql);

      if (typeof values === 'function') {
        cb = values;
      } else if (values !== undefined) {
        Object.defineProperty(options, 'values', { value: values });
      }
    } else {
      options.sql = sql;

      if (typeof values === 'function') {
        cb = values;
      } else if (values !== undefined) {
        options.values = values;
      }
    }

    if (cb !== undefined) {
      cb = wrapCallbackInDomain(null, cb);

      if (cb === undefined) {
        throw new TypeError('argument callback must be a function when provided');
      }
    }

    return new Query(options, cb);
  };

  Connection$2.prototype.connect = function connect(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    if (!this._connectCalled) {
      this._connectCalled = true;

      // Connect either via a UNIX domain socket or a TCP socket.
      this._socket = (this.config.socketPath)
        ? Net.createConnection(this.config.socketPath)
        : Net.createConnection(this.config.port, this.config.host);

      // Connect socket to connection domain
      if (Events.usingDomains) {
        this._socket.domain = this.domain;
      }

      var connection = this;
      this._protocol.on('data', function(data) {
        connection._socket.write(data);
      });
      this._socket.on('data', wrapToDomain(connection, function (data) {
        connection._protocol.write(data);
      }));
      this._protocol.on('end', function() {
        connection._socket.end();
      });
      this._socket.on('end', wrapToDomain(connection, function () {
        connection._protocol.end();
      }));

      this._socket.on('error', this._handleNetworkError.bind(this));
      this._socket.on('connect', this._handleProtocolConnect.bind(this));
      this._protocol.on('handshake', this._handleProtocolHandshake.bind(this));
      this._protocol.on('initialize', this._handleProtocolInitialize.bind(this));
      this._protocol.on('unhandledError', this._handleProtocolError.bind(this));
      this._protocol.on('drain', this._handleProtocolDrain.bind(this));
      this._protocol.on('end', this._handleProtocolEnd.bind(this));
      this._protocol.on('enqueue', this._handleProtocolEnqueue.bind(this));

      if (this.config.connectTimeout) {
        var handleConnectTimeout = this._handleConnectTimeout.bind(this);

        this._socket.setTimeout(this.config.connectTimeout, handleConnectTimeout);
        this._socket.once('connect', function() {
          this.setTimeout(0, handleConnectTimeout);
        });
      }
    }

    this._protocol.handshake(options, wrapCallbackInDomain(this, callback));
  };

  Connection$2.prototype.changeUser = function changeUser(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    this._implyConnect();

    var charsetNumber = (options.charset)
      ? ConnectionConfig$2.getCharsetNumber(options.charset)
      : this.config.charsetNumber;

    return this._protocol.changeUser({
      user          : options.user || this.config.user,
      password      : options.password || this.config.password,
      database      : options.database || this.config.database,
      timeout       : options.timeout,
      charsetNumber : charsetNumber,
      currentConfig : this.config
    }, wrapCallbackInDomain(this, callback));
  };

  Connection$2.prototype.beginTransaction = function beginTransaction(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};
    options.sql = 'START TRANSACTION';
    options.values = null;

    return this.query(options, callback);
  };

  Connection$2.prototype.commit = function commit(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};
    options.sql = 'COMMIT';
    options.values = null;

    return this.query(options, callback);
  };

  Connection$2.prototype.rollback = function rollback(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    options = options || {};
    options.sql = 'ROLLBACK';
    options.values = null;

    return this.query(options, callback);
  };

  Connection$2.prototype.query = function query(sql, values, cb) {
    var query = Connection$2.createQuery(sql, values, cb);
    query._connection = this;

    if (!(typeof sql === 'object' && 'typeCast' in sql)) {
      query.typeCast = this.config.typeCast;
    }

    if (query.sql) {
      query.sql = this.format(query.sql, query.values);
    }

    if (query._callback) {
      query._callback = wrapCallbackInDomain(this, query._callback);
    }

    this._implyConnect();

    return this._protocol._enqueue(query);
  };

  Connection$2.prototype.ping = function ping(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    this._implyConnect();
    this._protocol.ping(options, wrapCallbackInDomain(this, callback));
  };

  Connection$2.prototype.statistics = function statistics(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    this._implyConnect();
    this._protocol.stats(options, wrapCallbackInDomain(this, callback));
  };

  Connection$2.prototype.end = function end(options, callback) {
    var cb   = callback;
    var opts = options;

    if (!callback && typeof options === 'function') {
      cb   = options;
      opts = null;
    }

    // create custom options reference
    opts = Object.create(opts || null);

    if (opts.timeout === undefined) {
      // default timeout of 30 seconds
      opts.timeout = 30000;
    }

    this._implyConnect();
    this._protocol.quit(opts, wrapCallbackInDomain(this, cb));
  };

  Connection$2.prototype.destroy = function() {
    this.state = 'disconnected';
    this._implyConnect();
    this._socket.destroy();
    this._protocol.destroy();
  };

  Connection$2.prototype.pause = function() {
    this._socket.pause();
    this._protocol.pause();
  };

  Connection$2.prototype.resume = function() {
    this._socket.resume();
    this._protocol.resume();
  };

  Connection$2.prototype.escape = function(value) {
    return SqlString$3.escape(value, false, this.config.timezone);
  };

  Connection$2.prototype.escapeId = function escapeId(value) {
    return SqlString$3.escapeId(value, false);
  };

  Connection$2.prototype.format = function(sql, values) {
    if (typeof this.config.queryFormat === 'function') {
      return this.config.queryFormat.call(this, sql, values, this.config.timezone);
    }
    return SqlString$3.format(sql, values, this.config.stringifyObjects, this.config.timezone);
  };

  if (tls.TLSSocket) {
    // 0.11+ environment
    Connection$2.prototype._startTLS = function _startTLS(onSecure) {
      var connection = this;

      createSecureContext(this.config, function (err, secureContext) {
        if (err) {
          onSecure(err);
          return;
        }

        // "unpipe"
        connection._socket.removeAllListeners('data');
        connection._protocol.removeAllListeners('data');

        // socket <-> encrypted
        var rejectUnauthorized = connection.config.ssl.rejectUnauthorized;
        var secureEstablished  = false;
        var secureSocket       = new tls.TLSSocket(connection._socket, {
          rejectUnauthorized : rejectUnauthorized,
          requestCert        : true,
          secureContext      : secureContext,
          isServer           : false
        });

        // error handler for secure socket
        secureSocket.on('_tlsError', function(err) {
          if (secureEstablished) {
            connection._handleNetworkError(err);
          } else {
            onSecure(err);
          }
        });

        // cleartext <-> protocol
        secureSocket.pipe(connection._protocol);
        connection._protocol.on('data', function(data) {
          secureSocket.write(data);
        });

        secureSocket.on('secure', function() {
          secureEstablished = true;

          onSecure(rejectUnauthorized ? this.ssl.verifyError() : null);
        });

        // start TLS communications
        secureSocket._start();
      });
    };
  } else {
    // pre-0.11 environment
    Connection$2.prototype._startTLS = function _startTLS(onSecure) {
      // before TLS:
      //  _socket <-> _protocol
      // after:
      //  _socket <-> securePair.encrypted <-> securePair.cleartext <-> _protocol

      var connection  = this;
      var credentials = Crypto.createCredentials({
        ca         : this.config.ssl.ca,
        cert       : this.config.ssl.cert,
        ciphers    : this.config.ssl.ciphers,
        key        : this.config.ssl.key,
        passphrase : this.config.ssl.passphrase
      });

      var rejectUnauthorized = this.config.ssl.rejectUnauthorized;
      var secureEstablished  = false;
      var securePair         = tls.createSecurePair(credentials, false, true, rejectUnauthorized);

      // error handler for secure pair
      securePair.on('error', function(err) {
        if (secureEstablished) {
          connection._handleNetworkError(err);
        } else {
          onSecure(err);
        }
      });

      // "unpipe"
      this._socket.removeAllListeners('data');
      this._protocol.removeAllListeners('data');

      // socket <-> encrypted
      securePair.encrypted.pipe(this._socket);
      this._socket.on('data', function(data) {
        securePair.encrypted.write(data);
      });

      // cleartext <-> protocol
      securePair.cleartext.pipe(this._protocol);
      this._protocol.on('data', function(data) {
        securePair.cleartext.write(data);
      });

      // secure established
      securePair.on('secure', function() {
        secureEstablished = true;

        if (!rejectUnauthorized) {
          onSecure();
          return;
        }

        var verifyError = this.ssl.verifyError();
        var err = verifyError;

        // node.js 0.6 support
        if (typeof err === 'string') {
          err = new Error(verifyError);
          err.code = verifyError;
        }

        onSecure(err);
      });

      // node.js 0.8 bug
      securePair._cycle = securePair.cycle;
      securePair.cycle  = function cycle() {
        if (this.ssl && this.ssl.error) {
          this.error();
        }

        return this._cycle.apply(this, arguments);
      };
    };
  }

  Connection$2.prototype._handleConnectTimeout = function() {
    if (this._socket) {
      this._socket.setTimeout(0);
      this._socket.destroy();
    }

    var err = new Error('connect ETIMEDOUT');
    err.errorno = 'ETIMEDOUT';
    err.code = 'ETIMEDOUT';
    err.syscall = 'connect';

    this._handleNetworkError(err);
  };

  Connection$2.prototype._handleNetworkError = function(err) {
    this._protocol.handleNetworkError(err);
  };

  Connection$2.prototype._handleProtocolError = function(err) {
    this.state = 'protocol_error';
    this.emit('error', err);
  };

  Connection$2.prototype._handleProtocolDrain = function() {
    this.emit('drain');
  };

  Connection$2.prototype._handleProtocolConnect = function() {
    this.state = 'connected';
    this.emit('connect');
  };

  Connection$2.prototype._handleProtocolHandshake = function _handleProtocolHandshake() {
    this.state = 'authenticated';
  };

  Connection$2.prototype._handleProtocolInitialize = function _handleProtocolInitialize(packet) {
    this.threadId = packet.threadId;
  };

  Connection$2.prototype._handleProtocolEnd = function(err) {
    this.state = 'disconnected';
    this.emit('end', err);
  };

  Connection$2.prototype._handleProtocolEnqueue = function _handleProtocolEnqueue(sequence) {
    this.emit('enqueue', sequence);
  };

  Connection$2.prototype._implyConnect = function() {
    if (!this._connectCalled) {
      this.connect();
    }
  };

  function createSecureContext (config, cb) {
    var context = null;
    var error   = null;

    try {
      context = tls.createSecureContext({
        ca         : config.ssl.ca,
        cert       : config.ssl.cert,
        ciphers    : config.ssl.ciphers,
        key        : config.ssl.key,
        passphrase : config.ssl.passphrase
      });
    } catch (err) {
      error = err;
    }

    cb(error, context);
  }

  function unwrapFromDomain(fn) {
    return function () {
      var domains = [];
      var ret;

      while (browser$1.domain) {
        domains.shift(browser$1.domain);
        browser$1.domain.exit();
      }

      try {
        ret = fn.apply(this, arguments);
      } finally {
        for (var i = 0; i < domains.length; i++) {
          domains[i].enter();
        }
      }

      return ret;
    };
  }

  function wrapCallbackInDomain(ee, fn) {
    if (typeof fn !== 'function') {
      return undefined;
    }

    if (fn.domain) {
      return fn;
    }

    var domain = browser$1.domain;

    if (domain) {
      return domain.bind(fn);
    } else if (ee) {
      return unwrapFromDomain(wrapToDomain(ee, fn));
    } else {
      return fn;
    }
  }

  function wrapToDomain(ee, fn) {
    return function () {
      if (Events.usingDomains && ee.domain) {
        ee.domain.enter();
        fn.apply(this, arguments);
        ee.domain.exit();
      } else {
        fn.apply(this, arguments);
      }
    };
  }

  var Connection$3 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var require$$0$3 = /*@__PURE__*/getAugmentedNamespace(Connection$3);

  /*! https://mths.be/punycode v1.4.1 by @mathias */


  /** Highest positive signed 32-bit float value */
  var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

  /** Bootstring parameters */
  var base = 36;
  var tMin = 1;
  var tMax = 26;
  var skew = 38;
  var damp = 700;
  var initialBias = 72;
  var initialN = 128; // 0x80
  var delimiter = '-'; // '\x2D'
  var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars
  var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

  /** Error messages */
  var errors = {
    'overflow': 'Overflow: input needs wider integers to process',
    'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
    'invalid-input': 'Invalid input'
  };

  /** Convenience shortcuts */
  var baseMinusTMin = base - tMin;
  var floor = Math.floor;
  var stringFromCharCode = String.fromCharCode;

  /*--------------------------------------------------------------------------*/

  /**
   * A generic error utility function.
   * @private
   * @param {String} type The error type.
   * @returns {Error} Throws a `RangeError` with the applicable error message.
   */
  function error(type) {
    throw new RangeError(errors[type]);
  }

  /**
   * A generic `Array#map` utility function.
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function that gets called for every array
   * item.
   * @returns {Array} A new array of values returned by the callback function.
   */
  function map$1(array, fn) {
    var length = array.length;
    var result = [];
    while (length--) {
      result[length] = fn(array[length]);
    }
    return result;
  }

  /**
   * A simple `Array#map`-like wrapper to work with domain name strings or email
   * addresses.
   * @private
   * @param {String} domain The domain name or email address.
   * @param {Function} callback The function that gets called for every
   * character.
   * @returns {Array} A new string of characters returned by the callback
   * function.
   */
  function mapDomain(string, fn) {
    var parts = string.split('@');
    var result = '';
    if (parts.length > 1) {
      // In email addresses, only the domain name should be punycoded. Leave
      // the local part (i.e. everything up to `@`) intact.
      result = parts[0] + '@';
      string = parts[1];
    }
    // Avoid `split(regex)` for IE8 compatibility. See #17.
    string = string.replace(regexSeparators, '\x2E');
    var labels = string.split('.');
    var encoded = map$1(labels, fn).join('.');
    return result + encoded;
  }

  /**
   * Creates an array containing the numeric code points of each Unicode
   * character in the string. While JavaScript uses UCS-2 internally,
   * this function will convert a pair of surrogate halves (each of which
   * UCS-2 exposes as separate characters) into a single code point,
   * matching UTF-16.
   * @see `punycode.ucs2.encode`
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode.ucs2
   * @name decode
   * @param {String} string The Unicode input string (UCS-2).
   * @returns {Array} The new array of code points.
   */
  function ucs2decode(string) {
    var output = [],
      counter = 0,
      length = string.length,
      value,
      extra;
    while (counter < length) {
      value = string.charCodeAt(counter++);
      if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
        // high surrogate, and there is a next character
        extra = string.charCodeAt(counter++);
        if ((extra & 0xFC00) == 0xDC00) { // low surrogate
          output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
        } else {
          // unmatched surrogate; only append this code unit, in case the next
          // code unit is the high surrogate of a surrogate pair
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }
    return output;
  }

  /**
   * Converts a digit/integer into a basic code point.
   * @see `basicToDigit()`
   * @private
   * @param {Number} digit The numeric value of a basic code point.
   * @returns {Number} The basic code point whose value (when used for
   * representing integers) is `digit`, which needs to be in the range
   * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
   * used; else, the lowercase form is used. The behavior is undefined
   * if `flag` is non-zero and `digit` has no uppercase form.
   */
  function digitToBasic(digit, flag) {
    //  0..25 map to ASCII a..z or A..Z
    // 26..35 map to ASCII 0..9
    return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
  }

  /**
   * Bias adaptation function as per section 3.4 of RFC 3492.
   * https://tools.ietf.org/html/rfc3492#section-3.4
   * @private
   */
  function adapt(delta, numPoints, firstTime) {
    var k = 0;
    delta = firstTime ? floor(delta / damp) : delta >> 1;
    delta += floor(delta / numPoints);
    for ( /* no initialization */ ; delta > baseMinusTMin * tMax >> 1; k += base) {
      delta = floor(delta / baseMinusTMin);
    }
    return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
  }

  /**
   * Converts a string of Unicode symbols (e.g. a domain name label) to a
   * Punycode string of ASCII-only symbols.
   * @memberOf punycode
   * @param {String} input The string of Unicode symbols.
   * @returns {String} The resulting Punycode string of ASCII-only symbols.
   */
  function encode(input) {
    var n,
      delta,
      handledCPCount,
      basicLength,
      bias,
      j,
      m,
      q,
      k,
      t,
      currentValue,
      output = [],
      /** `inputLength` will hold the number of code points in `input`. */
      inputLength,
      /** Cached calculation results */
      handledCPCountPlusOne,
      baseMinusT,
      qMinusT;

    // Convert the input in UCS-2 to Unicode
    input = ucs2decode(input);

    // Cache the length
    inputLength = input.length;

    // Initialize the state
    n = initialN;
    delta = 0;
    bias = initialBias;

    // Handle the basic code points
    for (j = 0; j < inputLength; ++j) {
      currentValue = input[j];
      if (currentValue < 0x80) {
        output.push(stringFromCharCode(currentValue));
      }
    }

    handledCPCount = basicLength = output.length;

    // `handledCPCount` is the number of code points that have been handled;
    // `basicLength` is the number of basic code points.

    // Finish the basic string - if it is not empty - with a delimiter
    if (basicLength) {
      output.push(delimiter);
    }

    // Main encoding loop:
    while (handledCPCount < inputLength) {

      // All non-basic code points < n have been handled already. Find the next
      // larger one:
      for (m = maxInt, j = 0; j < inputLength; ++j) {
        currentValue = input[j];
        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      }

      // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
      // but guard against overflow
      handledCPCountPlusOne = handledCPCount + 1;
      if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
        error('overflow');
      }

      delta += (m - n) * handledCPCountPlusOne;
      n = m;

      for (j = 0; j < inputLength; ++j) {
        currentValue = input[j];

        if (currentValue < n && ++delta > maxInt) {
          error('overflow');
        }

        if (currentValue == n) {
          // Represent delta as a generalized variable-length integer
          for (q = delta, k = base; /* no condition */ ; k += base) {
            t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
            if (q < t) {
              break;
            }
            qMinusT = q - t;
            baseMinusT = base - t;
            output.push(
              stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
            );
            q = floor(qMinusT / baseMinusT);
          }

          output.push(stringFromCharCode(digitToBasic(q, 0)));
          bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
          delta = 0;
          ++handledCPCount;
        }
      }

      ++delta;
      ++n;

    }
    return output.join('');
  }

  /**
   * Converts a Unicode string representing a domain name or an email address to
   * Punycode. Only the non-ASCII parts of the domain name will be converted,
   * i.e. it doesn't matter if you call it with a domain that's already in
   * ASCII.
   * @memberOf punycode
   * @param {String} input The domain name or email address to convert, as a
   * Unicode string.
   * @returns {String} The Punycode representation of the given domain name or
   * email address.
   */
  function toASCII(input) {
    return mapDomain(input, function(string) {
      return regexNonASCII.test(string) ?
        'xn--' + encode(string) :
        string;
    });
  }

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;
  function init () {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray (b64) {
    if (!inited) {
      init();
    }
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

    // base64 is 4/3 + up to two characters of the original data
    arr = new Arr(len * 3 / 4 - placeHolders);

    // if there are placeholders, only get up to the last complete 4 chars
    l = placeHolders > 0 ? len - 4 : len;

    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 0xFF;
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr
  }

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
  }

  function encodeChunk (uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output.push(tripletToBase64(tmp));
    }
    return output.join('')
  }

  function fromByteArray (uint8) {
    if (!inited) {
      init();
    }
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[(tmp << 4) & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
      output += lookup[tmp >> 10];
      output += lookup[(tmp >> 4) & 0x3F];
      output += lookup[(tmp << 2) & 0x3F];
      output += '=';
    }

    parts.push(output);

    return parts.join('')
  }

  function read (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  }

  function write (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;

  var isArray$1 = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */

  var INSPECT_MAX_BYTES = 50;

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */
  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
    ? global$1.TYPED_ARRAY_SUPPORT
    : true;

  function kMaxLength () {
    return Buffer.TYPED_ARRAY_SUPPORT
      ? 0x7fffffff
      : 0x3fffffff
  }

  function createBuffer (that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length')
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }
      that.length = length;
    }

    return that
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer (arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length)
    }

    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error(
          'If encoding is specified then the first argument must be a string'
        )
      }
      return allocUnsafe(this, arg)
    }
    return from(this, arg, encodingOrOffset, length)
  }

  Buffer.poolSize = 8192; // not used by this implementation

  // TODO: Legacy, not needed anymore. Remove in next major version.
  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr
  };

  function from (that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number')
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length)
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset)
    }

    return fromObject(that, value)
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length)
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
  }

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number')
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative')
    }
  }

  function alloc (that, size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(that, size).fill(fill, encoding)
        : createBuffer(that, size).fill(fill)
    }
    return createBuffer(that, size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding)
  };

  function allocUnsafe (that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size)
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size)
  };

  function fromString (that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding')
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);

    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that
  }

  function fromArrayLike (that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that
  }

  function fromArrayBuffer (that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds')
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }
    return that
  }

  function fromObject (that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that
      }

      obj.copy(that, 0, 0, len);
      return that
    }

    if (obj) {
      if ((typeof ArrayBuffer !== 'undefined' &&
          obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0)
        }
        return fromArrayLike(that, obj)
      }

      if (obj.type === 'Buffer' && isArray$1(obj.data)) {
        return fromArrayLike(that, obj.data)
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
  }

  function checked (length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + kMaxLength().toString(16) + ' bytes')
    }
    return length | 0
  }
  Buffer.isBuffer = isBuffer;
  function internalIsBuffer (b) {
    return !!(b != null && b._isBuffer)
  }

  Buffer.compare = function compare (a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a === b) return 0

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  Buffer.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  };

  Buffer.concat = function concat (list, length) {
    if (!isArray$1(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer.alloc(0)
    }

    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer
  };

  function byteLength (string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
        (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0

    // Use a for loop to avoid recursion
    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) return utf8ToBytes(string).length // assume utf8
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;

  function slowToString (encoding, start, end) {
    var loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return ''
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }

  // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.
  Buffer.prototype._isBuffer = true;

  function swap (b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16 () {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this
  };

  Buffer.prototype.swap32 = function swap32 () {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this
  };

  Buffer.prototype.swap64 = function swap64 () {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this
  };

  Buffer.prototype.toString = function toString () {
    var length = this.length | 0;
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  };

  Buffer.prototype.equals = function equals (b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer.compare(this, b) === 0
  };

  Buffer.prototype.inspect = function inspect () {
    var str = '';
    var max = INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }
    return '<Buffer ' + str + '>'
  };

  Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer')
    }

    if (start === undefined) {
      start = 0;
    }
    if (end === undefined) {
      end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
      thisStart = 0;
    }
    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0

    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);

    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset;  // Coerce to Number.
    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1);
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]
      if (Buffer.TYPED_ARRAY_SUPPORT &&
          typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Buffer')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  };

  Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  };

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }

    // must be an even number of digits
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i
      buf[offset + i] = parsed;
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function latin1Write (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Buffer.prototype.write = function write (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    // legacy write(string, encoding, offset, length) - remove in v0.13
    } else {
      throw new Error(
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8';

    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
          return asciiWrite(this, string, offset, length)

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  };

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf)
    } else {
      return fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];

    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
        : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray (codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    var len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    var out = '';
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res
  }

  Buffer.prototype.slice = function slice (start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;

    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf
  };

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val
  };

  Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val
  };

  Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset]
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | (this[offset + 1] << 8)
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return (this[offset] << 8) | this[offset + 1]
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  };

  Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  };

  Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  };

  Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  };

  Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4)
  };

  Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4)
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8)
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8)
  };

  function checkInt (buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = (value & 0xff);
    return offset + 1
  };

  function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24);
      this[offset + 2] = (value >>> 16);
      this[offset + 1] = (value >>> 8);
      this[offset] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = (value & 0xff);
    return offset + 1
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
      this[offset + 2] = (value >>> 16);
      this[offset + 3] = (value >>> 24);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  };

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  };

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, start + len),
        targetStart
      );
    }

    return len
  };

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    var i;
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val)
        ? val
        : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this
  };

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str
  }

  function stringtrim (str) {
    if (str.trim) return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          }

          // valid lead
          leadSurrogate = codePoint;

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null;

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray
  }


  function base64ToBytes (str) {
    return toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i];
    }
    return i
  }

  function isnan (val) {
    return val !== val // eslint-disable-line no-self-compare
  }


  // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
  }

  function isFastBuffer (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
  }

  function isNull(arg) {
    return arg === null;
  }

  function isNullOrUndefined(arg) {
    return arg == null;
  }

  function isString(arg) {
    return typeof arg === 'string';
  }

  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.


  // If obj.hasOwnProperty has been overridden, then calling
  // obj.hasOwnProperty(prop) will break.
  // See: https://github.com/joyent/node/issues/1707
  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
  };
  function stringifyPrimitive(v) {
    switch (typeof v) {
      case 'string':
        return v;

      case 'boolean':
        return v ? 'true' : 'false';

      case 'number':
        return isFinite(v) ? v : '';

      default:
        return '';
    }
  }

  function stringify (obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';
    if (obj === null) {
      obj = undefined;
    }

    if (typeof obj === 'object') {
      return map(objectKeys(obj), function(k) {
        var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
        if (isArray(obj[k])) {
          return map(obj[k], function(v) {
            return ks + encodeURIComponent(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        }
      }).join(sep);

    }

    if (!name) return '';
    return encodeURIComponent(stringifyPrimitive(name)) + eq +
           encodeURIComponent(stringifyPrimitive(obj));
  }
  function map (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
      res.push(f(xs[i], i));
    }
    return res;
  }

  var objectKeys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
  };

  function parse$1(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};

    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }

    var regexp = /\+/g;
    qs = qs.split(sep);

    var maxKeys = 1000;
    if (options && typeof options.maxKeys === 'number') {
      maxKeys = options.maxKeys;
    }

    var len = qs.length;
    // maxKeys <= 0 means that we should not limit keys count
    if (maxKeys > 0 && len > maxKeys) {
      len = maxKeys;
    }

    for (var i = 0; i < len; ++i) {
      var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr, vstr, k, v;

      if (idx >= 0) {
        kstr = x.substr(0, idx);
        vstr = x.substr(idx + 1);
      } else {
        kstr = x;
        vstr = '';
      }

      k = decodeURIComponent(kstr);
      v = decodeURIComponent(vstr);

      if (!hasOwnProperty(obj, k)) {
        obj[k] = v;
      } else if (isArray(obj[k])) {
        obj[k].push(v);
      } else {
        obj[k] = [obj[k], v];
      }
    }

    return obj;
  }

  // Copyright Joyent, Inc. and other Node contributors.
  var _polyfillNode_url = {
    parse: urlParse$1,
    resolve: urlResolve,
    resolveObject: urlResolveObject,
    format: urlFormat,
    Url: Url
  };
  function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.host = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.query = null;
    this.pathname = null;
    this.path = null;
    this.href = null;
  }

  // Reference: RFC 3986, RFC 1808, RFC 2396

  // define these here so at least they only have to be
  // compiled once on the first module load.
  var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    };

  function urlParse$1(url, parseQueryString, slashesDenoteHost) {
    if (url && isObject(url) && url instanceof Url) return url;

    var u = new Url;
    u.parse(url, parseQueryString, slashesDenoteHost);
    return u;
  }
  Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
    return parse(this, url, parseQueryString, slashesDenoteHost);
  };

  function parse(self, url, parseQueryString, slashesDenoteHost) {
    if (!isString(url)) {
      throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
    }

    // Copy chrome, IE, opera backslash-handling behavior.
    // Back slashes before the query string get converted to forward slashes
    // See: https://code.google.com/p/chromium/issues/detail?id=25916
    var queryIndex = url.indexOf('?'),
      splitter =
      (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
    uSplit[0] = uSplit[0].replace(slashRegex, '/');
    url = uSplit.join(splitter);

    var rest = url;

    // trim before proceeding.
    // This is to support parse stuff like "  http://foo.com  \n"
    rest = rest.trim();

    if (!slashesDenoteHost && url.split('#').length === 1) {
      // Try fast path regexp
      var simplePath = simplePathPattern.exec(rest);
      if (simplePath) {
        self.path = rest;
        self.href = rest;
        self.pathname = simplePath[1];
        if (simplePath[2]) {
          self.search = simplePath[2];
          if (parseQueryString) {
            self.query = parse$1(self.search.substr(1));
          } else {
            self.query = self.search.substr(1);
          }
        } else if (parseQueryString) {
          self.search = '';
          self.query = {};
        }
        return self;
      }
    }

    var proto = protocolPattern.exec(rest);
    if (proto) {
      proto = proto[0];
      var lowerProto = proto.toLowerCase();
      self.protocol = lowerProto;
      rest = rest.substr(proto.length);
    }

    // figure out if it's got a host
    // user@server is *always* interpreted as a hostname, and url
    // resolution will treat //foo/bar as host=foo,path=bar because that's
    // how the browser resolves relative URLs.
    if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
      var slashes = rest.substr(0, 2) === '//';
      if (slashes && !(proto && hostlessProtocol[proto])) {
        rest = rest.substr(2);
        self.slashes = true;
      }
    }
    var i, hec, l, p;
    if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

      // there's a hostname.
      // the first instance of /, ?, ;, or # ends the host.
      //
      // If there is an @ in the hostname, then non-host chars *are* allowed
      // to the left of the last @ sign, unless some host-ending character
      // comes *before* the @-sign.
      // URLs are obnoxious.
      //
      // ex:
      // http://a@b@c/ => user:a@b host:c
      // http://a@b?@c => user:a host:c path:/?@c

      // v0.12 TODO(isaacs): This is not quite how Chrome does things.
      // Review our test case against browsers more comprehensively.

      // find the first instance of any hostEndingChars
      var hostEnd = -1;
      for (i = 0; i < hostEndingChars.length; i++) {
        hec = rest.indexOf(hostEndingChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
          hostEnd = hec;
      }

      // at this point, either we have an explicit point where the
      // auth portion cannot go past, or the last @ char is the decider.
      var auth, atSign;
      if (hostEnd === -1) {
        // atSign can be anywhere.
        atSign = rest.lastIndexOf('@');
      } else {
        // atSign must be in auth portion.
        // http://a@b/c@d => host:b auth:a path:/c@d
        atSign = rest.lastIndexOf('@', hostEnd);
      }

      // Now we have a portion which is definitely the auth.
      // Pull that off.
      if (atSign !== -1) {
        auth = rest.slice(0, atSign);
        rest = rest.slice(atSign + 1);
        self.auth = decodeURIComponent(auth);
      }

      // the host is the remaining to the left of the first non-host char
      hostEnd = -1;
      for (i = 0; i < nonHostChars.length; i++) {
        hec = rest.indexOf(nonHostChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
          hostEnd = hec;
      }
      // if we still have not hit it, then the entire thing is a host.
      if (hostEnd === -1)
        hostEnd = rest.length;

      self.host = rest.slice(0, hostEnd);
      rest = rest.slice(hostEnd);

      // pull out port.
      parseHost(self);

      // we've indicated that there is a hostname,
      // so even if it's empty, it has to be present.
      self.hostname = self.hostname || '';

      // if hostname begins with [ and ends with ]
      // assume that it's an IPv6 address.
      var ipv6Hostname = self.hostname[0] === '[' &&
        self.hostname[self.hostname.length - 1] === ']';

      // validate a little.
      if (!ipv6Hostname) {
        var hostparts = self.hostname.split(/\./);
        for (i = 0, l = hostparts.length; i < l; i++) {
          var part = hostparts[i];
          if (!part) continue;
          if (!part.match(hostnamePartPattern)) {
            var newpart = '';
            for (var j = 0, k = part.length; j < k; j++) {
              if (part.charCodeAt(j) > 127) {
                // we replace non-ASCII char with a temporary placeholder
                // we need this to make sure size of hostname is not
                // broken by replacing non-ASCII by nothing
                newpart += 'x';
              } else {
                newpart += part[j];
              }
            }
            // we test again with ASCII char only
            if (!newpart.match(hostnamePartPattern)) {
              var validParts = hostparts.slice(0, i);
              var notHost = hostparts.slice(i + 1);
              var bit = part.match(hostnamePartStart);
              if (bit) {
                validParts.push(bit[1]);
                notHost.unshift(bit[2]);
              }
              if (notHost.length) {
                rest = '/' + notHost.join('.') + rest;
              }
              self.hostname = validParts.join('.');
              break;
            }
          }
        }
      }

      if (self.hostname.length > hostnameMaxLen) {
        self.hostname = '';
      } else {
        // hostnames are always lower case.
        self.hostname = self.hostname.toLowerCase();
      }

      if (!ipv6Hostname) {
        // IDNA Support: Returns a punycoded representation of "domain".
        // It only converts parts of the domain name that
        // have non-ASCII characters, i.e. it doesn't matter if
        // you call it with a domain that already is ASCII-only.
        self.hostname = toASCII(self.hostname);
      }

      p = self.port ? ':' + self.port : '';
      var h = self.hostname || '';
      self.host = h + p;
      self.href += self.host;

      // strip [ and ] from the hostname
      // the host field still retains them, though
      if (ipv6Hostname) {
        self.hostname = self.hostname.substr(1, self.hostname.length - 2);
        if (rest[0] !== '/') {
          rest = '/' + rest;
        }
      }
    }

    // now rest is set to the post-host stuff.
    // chop off any delim chars.
    if (!unsafeProtocol[lowerProto]) {

      // First, make 100% sure that any "autoEscape" chars get
      // escaped, even if encodeURIComponent doesn't think they
      // need to be.
      for (i = 0, l = autoEscape.length; i < l; i++) {
        var ae = autoEscape[i];
        if (rest.indexOf(ae) === -1)
          continue;
        var esc = encodeURIComponent(ae);
        if (esc === ae) {
          esc = escape(ae);
        }
        rest = rest.split(ae).join(esc);
      }
    }


    // chop off from the tail first.
    var hash = rest.indexOf('#');
    if (hash !== -1) {
      // got a fragment string.
      self.hash = rest.substr(hash);
      rest = rest.slice(0, hash);
    }
    var qm = rest.indexOf('?');
    if (qm !== -1) {
      self.search = rest.substr(qm);
      self.query = rest.substr(qm + 1);
      if (parseQueryString) {
        self.query = parse$1(self.query);
      }
      rest = rest.slice(0, qm);
    } else if (parseQueryString) {
      // no query string, but parseQueryString still requested
      self.search = '';
      self.query = {};
    }
    if (rest) self.pathname = rest;
    if (slashedProtocol[lowerProto] &&
      self.hostname && !self.pathname) {
      self.pathname = '/';
    }

    //to support http.request
    if (self.pathname || self.search) {
      p = self.pathname || '';
      var s = self.search || '';
      self.path = p + s;
    }

    // finally, reconstruct the href based on what has been validated.
    self.href = format(self);
    return self;
  }

  // format a parsed object into a url string
  function urlFormat(obj) {
    // ensure it's an object, and not a string url.
    // If it's an obj, this is a no-op.
    // this way, you can call url_format() on strings
    // to clean up potentially wonky urls.
    if (isString(obj)) obj = parse({}, obj);
    return format(obj);
  }

  function format(self) {
    var auth = self.auth || '';
    if (auth) {
      auth = encodeURIComponent(auth);
      auth = auth.replace(/%3A/i, ':');
      auth += '@';
    }

    var protocol = self.protocol || '',
      pathname = self.pathname || '',
      hash = self.hash || '',
      host = false,
      query = '';

    if (self.host) {
      host = auth + self.host;
    } else if (self.hostname) {
      host = auth + (self.hostname.indexOf(':') === -1 ?
        self.hostname :
        '[' + this.hostname + ']');
      if (self.port) {
        host += ':' + self.port;
      }
    }

    if (self.query &&
      isObject(self.query) &&
      Object.keys(self.query).length) {
      query = stringify(self.query);
    }

    var search = self.search || (query && ('?' + query)) || '';

    if (protocol && protocol.substr(-1) !== ':') protocol += ':';

    // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
    // unless they had them to begin with.
    if (self.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
      host = '//' + (host || '');
      if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
    } else if (!host) {
      host = '';
    }

    if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
    if (search && search.charAt(0) !== '?') search = '?' + search;

    pathname = pathname.replace(/[?#]/g, function(match) {
      return encodeURIComponent(match);
    });
    search = search.replace('#', '%23');

    return protocol + host + pathname + search + hash;
  }

  Url.prototype.format = function() {
    return format(this);
  };

  function urlResolve(source, relative) {
    return urlParse$1(source, false, true).resolve(relative);
  }

  Url.prototype.resolve = function(relative) {
    return this.resolveObject(urlParse$1(relative, false, true)).format();
  };

  function urlResolveObject(source, relative) {
    if (!source) return relative;
    return urlParse$1(source, false, true).resolveObject(relative);
  }

  Url.prototype.resolveObject = function(relative) {
    if (isString(relative)) {
      var rel = new Url();
      rel.parse(relative, false, true);
      relative = rel;
    }

    var result = new Url();
    var tkeys = Object.keys(this);
    for (var tk = 0; tk < tkeys.length; tk++) {
      var tkey = tkeys[tk];
      result[tkey] = this[tkey];
    }

    // hash is always overridden, no matter what.
    // even href="" will remove it.
    result.hash = relative.hash;

    // if the relative url is empty, then there's nothing left to do here.
    if (relative.href === '') {
      result.href = result.format();
      return result;
    }

    // hrefs like //foo/bar always cut to the protocol.
    if (relative.slashes && !relative.protocol) {
      // take everything except the protocol from relative
      var rkeys = Object.keys(relative);
      for (var rk = 0; rk < rkeys.length; rk++) {
        var rkey = rkeys[rk];
        if (rkey !== 'protocol')
          result[rkey] = relative[rkey];
      }

      //urlParse appends trailing / to urls like http://www.example.com
      if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
        result.path = result.pathname = '/';
      }

      result.href = result.format();
      return result;
    }
    var relPath;
    if (relative.protocol && relative.protocol !== result.protocol) {
      // if it's a known url protocol, then changing
      // the protocol does weird things
      // first, if it's not file:, then we MUST have a host,
      // and if there was a path
      // to begin with, then we MUST have a path.
      // if it is file:, then the host is dropped,
      // because that's known to be hostless.
      // anything else is assumed to be absolute.
      if (!slashedProtocol[relative.protocol]) {
        var keys = Object.keys(relative);
        for (var v = 0; v < keys.length; v++) {
          var k = keys[v];
          result[k] = relative[k];
        }
        result.href = result.format();
        return result;
      }

      result.protocol = relative.protocol;
      if (!relative.host && !hostlessProtocol[relative.protocol]) {
        relPath = (relative.pathname || '').split('/');
        while (relPath.length && !(relative.host = relPath.shift()));
        if (!relative.host) relative.host = '';
        if (!relative.hostname) relative.hostname = '';
        if (relPath[0] !== '') relPath.unshift('');
        if (relPath.length < 2) relPath.unshift('');
        result.pathname = relPath.join('/');
      } else {
        result.pathname = relative.pathname;
      }
      result.search = relative.search;
      result.query = relative.query;
      result.host = relative.host || '';
      result.auth = relative.auth;
      result.hostname = relative.hostname || relative.host;
      result.port = relative.port;
      // to support http.request
      if (result.pathname || result.search) {
        var p = result.pathname || '';
        var s = result.search || '';
        result.path = p + s;
      }
      result.slashes = result.slashes || relative.slashes;
      result.href = result.format();
      return result;
    }

    var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
        relative.host ||
        relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
        (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];
    relPath = relative.pathname && relative.pathname.split('/') || [];
    // if the url is a non-slashed url, then relative
    // links like ../.. should be able
    // to crawl up to the hostname, as well.  This is strange.
    // result.protocol has already been set by now.
    // Later on, put the first path part into the host field.
    if (psychotic) {
      result.hostname = '';
      result.port = null;
      if (result.host) {
        if (srcPath[0] === '') srcPath[0] = result.host;
        else srcPath.unshift(result.host);
      }
      result.host = '';
      if (relative.protocol) {
        relative.hostname = null;
        relative.port = null;
        if (relative.host) {
          if (relPath[0] === '') relPath[0] = relative.host;
          else relPath.unshift(relative.host);
        }
        relative.host = null;
      }
      mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
    }
    var authInHost;
    if (isRelAbs) {
      // it's absolute.
      result.host = (relative.host || relative.host === '') ?
        relative.host : result.host;
      result.hostname = (relative.hostname || relative.hostname === '') ?
        relative.hostname : result.hostname;
      result.search = relative.search;
      result.query = relative.query;
      srcPath = relPath;
      // fall through to the dot-handling below.
    } else if (relPath.length) {
      // it's relative
      // throw away the existing file, and take the new path instead.
      if (!srcPath) srcPath = [];
      srcPath.pop();
      srcPath = srcPath.concat(relPath);
      result.search = relative.search;
      result.query = relative.query;
    } else if (!isNullOrUndefined(relative.search)) {
      // just pull out the search.
      // like href='?foo'.
      // Put this after the other two cases because it simplifies the booleans
      if (psychotic) {
        result.hostname = result.host = srcPath.shift();
        //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
        authInHost = result.host && result.host.indexOf('@') > 0 ?
          result.host.split('@') : false;
        if (authInHost) {
          result.auth = authInHost.shift();
          result.host = result.hostname = authInHost.shift();
        }
      }
      result.search = relative.search;
      result.query = relative.query;
      //to support http.request
      if (!isNull(result.pathname) || !isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') +
          (result.search ? result.search : '');
      }
      result.href = result.format();
      return result;
    }

    if (!srcPath.length) {
      // no path at all.  easy.
      // we've already handled the other stuff above.
      result.pathname = null;
      //to support http.request
      if (result.search) {
        result.path = '/' + result.search;
      } else {
        result.path = null;
      }
      result.href = result.format();
      return result;
    }

    // if a url ENDs in . or .., then it must get a trailing slash.
    // however, if it ends in anything else non-slashy,
    // then it must NOT get a trailing slash.
    var last = srcPath.slice(-1)[0];
    var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

    // strip single dots, resolve double dots to parent dir
    // if the path tries to go above the root, `up` ends up > 0
    var up = 0;
    for (var i = srcPath.length; i >= 0; i--) {
      last = srcPath[i];
      if (last === '.') {
        srcPath.splice(i, 1);
      } else if (last === '..') {
        srcPath.splice(i, 1);
        up++;
      } else if (up) {
        srcPath.splice(i, 1);
        up--;
      }
    }

    // if the path is allowed to go above the root, restore leading ..s
    if (!mustEndAbs && !removeAllDots) {
      for (; up--; up) {
        srcPath.unshift('..');
      }
    }

    if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
      srcPath.unshift('');
    }

    if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
      srcPath.push('');
    }

    var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

    // put the host back
    if (psychotic) {
      result.hostname = result.host = isAbsolute ? '' :
        srcPath.length ? srcPath.shift() : '';
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      authInHost = result.host && result.host.indexOf('@') > 0 ?
        result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }

    mustEndAbs = mustEndAbs || (result.host && srcPath.length);

    if (mustEndAbs && !isAbsolute) {
      srcPath.unshift('');
    }

    if (!srcPath.length) {
      result.pathname = null;
      result.path = null;
    } else {
      result.pathname = srcPath.join('/');
    }

    //to support request.http
    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
        (result.search ? result.search : '');
    }
    result.auth = relative.auth || result.auth;
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  };

  Url.prototype.parseHost = function() {
    return parseHost(this);
  };

  function parseHost(self) {
    var host = self.host;
    var port = portPattern.exec(host);
    if (port) {
      port = port[0];
      if (port !== ':') {
        self.port = port.substr(1);
      }
      host = host.substr(0, host.length - port.length);
    }
    if (host) self.hostname = host;
  }

  var _polyfillNode_url$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    parse: urlParse$1,
    resolve: urlResolve,
    resolveObject: urlResolveObject,
    format: urlFormat,
    'default': _polyfillNode_url,
    Url: Url
  });

  var require$$0$2 = /*@__PURE__*/getAugmentedNamespace(_polyfillNode_url$1);

  var client = {};

  // Manually extracted from mysql-5.5.23/include/mysql_com.h
  client.CLIENT_LONG_PASSWORD     = 1; /* new more secure passwords */
  client.CLIENT_FOUND_ROWS        = 2; /* Found instead of affected rows */
  client.CLIENT_LONG_FLAG         = 4; /* Get all column flags */
  client.CLIENT_CONNECT_WITH_DB   = 8; /* One can specify db on connect */
  client.CLIENT_NO_SCHEMA         = 16; /* Don't allow database.table.column */
  client.CLIENT_COMPRESS          = 32; /* Can use compression protocol */
  client.CLIENT_ODBC              = 64; /* Odbc client */
  client.CLIENT_LOCAL_FILES       = 128; /* Can use LOAD DATA LOCAL */
  client.CLIENT_IGNORE_SPACE      = 256; /* Ignore spaces before '(' */
  client.CLIENT_PROTOCOL_41       = 512; /* New 4.1 protocol */
  client.CLIENT_INTERACTIVE       = 1024; /* This is an interactive client */
  client.CLIENT_SSL               = 2048; /* Switch to SSL after handshake */
  client.CLIENT_IGNORE_SIGPIPE    = 4096;    /* IGNORE sigpipes */
  client.CLIENT_TRANSACTIONS      = 8192; /* Client knows about transactions */
  client.CLIENT_RESERVED          = 16384;   /* Old flag for 4.1 protocol  */
  client.CLIENT_SECURE_CONNECTION = 32768;  /* New 4.1 authentication */

  client.CLIENT_MULTI_STATEMENTS = 65536; /* Enable/disable multi-stmt support */
  client.CLIENT_MULTI_RESULTS    = 131072; /* Enable/disable multi-results */
  client.CLIENT_PS_MULTI_RESULTS = 262144; /* Multi-results in PS-protocol */

  client.CLIENT_PLUGIN_AUTH = 524288; /* Client supports plugin authentication */

  client.CLIENT_SSL_VERIFY_SERVER_CERT = 1073741824;
  client.CLIENT_REMEMBER_OPTIONS       = 2147483648;

  var charsets = {};

  (function (exports) {
  exports.BIG5_CHINESE_CI              = 1;
  exports.LATIN2_CZECH_CS              = 2;
  exports.DEC8_SWEDISH_CI              = 3;
  exports.CP850_GENERAL_CI             = 4;
  exports.LATIN1_GERMAN1_CI            = 5;
  exports.HP8_ENGLISH_CI               = 6;
  exports.KOI8R_GENERAL_CI             = 7;
  exports.LATIN1_SWEDISH_CI            = 8;
  exports.LATIN2_GENERAL_CI            = 9;
  exports.SWE7_SWEDISH_CI              = 10;
  exports.ASCII_GENERAL_CI             = 11;
  exports.UJIS_JAPANESE_CI             = 12;
  exports.SJIS_JAPANESE_CI             = 13;
  exports.CP1251_BULGARIAN_CI          = 14;
  exports.LATIN1_DANISH_CI             = 15;
  exports.HEBREW_GENERAL_CI            = 16;
  exports.TIS620_THAI_CI               = 18;
  exports.EUCKR_KOREAN_CI              = 19;
  exports.LATIN7_ESTONIAN_CS           = 20;
  exports.LATIN2_HUNGARIAN_CI          = 21;
  exports.KOI8U_GENERAL_CI             = 22;
  exports.CP1251_UKRAINIAN_CI          = 23;
  exports.GB2312_CHINESE_CI            = 24;
  exports.GREEK_GENERAL_CI             = 25;
  exports.CP1250_GENERAL_CI            = 26;
  exports.LATIN2_CROATIAN_CI           = 27;
  exports.GBK_CHINESE_CI               = 28;
  exports.CP1257_LITHUANIAN_CI         = 29;
  exports.LATIN5_TURKISH_CI            = 30;
  exports.LATIN1_GERMAN2_CI            = 31;
  exports.ARMSCII8_GENERAL_CI          = 32;
  exports.UTF8_GENERAL_CI              = 33;
  exports.CP1250_CZECH_CS              = 34;
  exports.UCS2_GENERAL_CI              = 35;
  exports.CP866_GENERAL_CI             = 36;
  exports.KEYBCS2_GENERAL_CI           = 37;
  exports.MACCE_GENERAL_CI             = 38;
  exports.MACROMAN_GENERAL_CI          = 39;
  exports.CP852_GENERAL_CI             = 40;
  exports.LATIN7_GENERAL_CI            = 41;
  exports.LATIN7_GENERAL_CS            = 42;
  exports.MACCE_BIN                    = 43;
  exports.CP1250_CROATIAN_CI           = 44;
  exports.UTF8MB4_GENERAL_CI           = 45;
  exports.UTF8MB4_BIN                  = 46;
  exports.LATIN1_BIN                   = 47;
  exports.LATIN1_GENERAL_CI            = 48;
  exports.LATIN1_GENERAL_CS            = 49;
  exports.CP1251_BIN                   = 50;
  exports.CP1251_GENERAL_CI            = 51;
  exports.CP1251_GENERAL_CS            = 52;
  exports.MACROMAN_BIN                 = 53;
  exports.UTF16_GENERAL_CI             = 54;
  exports.UTF16_BIN                    = 55;
  exports.UTF16LE_GENERAL_CI           = 56;
  exports.CP1256_GENERAL_CI            = 57;
  exports.CP1257_BIN                   = 58;
  exports.CP1257_GENERAL_CI            = 59;
  exports.UTF32_GENERAL_CI             = 60;
  exports.UTF32_BIN                    = 61;
  exports.UTF16LE_BIN                  = 62;
  exports.BINARY                       = 63;
  exports.ARMSCII8_BIN                 = 64;
  exports.ASCII_BIN                    = 65;
  exports.CP1250_BIN                   = 66;
  exports.CP1256_BIN                   = 67;
  exports.CP866_BIN                    = 68;
  exports.DEC8_BIN                     = 69;
  exports.GREEK_BIN                    = 70;
  exports.HEBREW_BIN                   = 71;
  exports.HP8_BIN                      = 72;
  exports.KEYBCS2_BIN                  = 73;
  exports.KOI8R_BIN                    = 74;
  exports.KOI8U_BIN                    = 75;
  exports.LATIN2_BIN                   = 77;
  exports.LATIN5_BIN                   = 78;
  exports.LATIN7_BIN                   = 79;
  exports.CP850_BIN                    = 80;
  exports.CP852_BIN                    = 81;
  exports.SWE7_BIN                     = 82;
  exports.UTF8_BIN                     = 83;
  exports.BIG5_BIN                     = 84;
  exports.EUCKR_BIN                    = 85;
  exports.GB2312_BIN                   = 86;
  exports.GBK_BIN                      = 87;
  exports.SJIS_BIN                     = 88;
  exports.TIS620_BIN                   = 89;
  exports.UCS2_BIN                     = 90;
  exports.UJIS_BIN                     = 91;
  exports.GEOSTD8_GENERAL_CI           = 92;
  exports.GEOSTD8_BIN                  = 93;
  exports.LATIN1_SPANISH_CI            = 94;
  exports.CP932_JAPANESE_CI            = 95;
  exports.CP932_BIN                    = 96;
  exports.EUCJPMS_JAPANESE_CI          = 97;
  exports.EUCJPMS_BIN                  = 98;
  exports.CP1250_POLISH_CI             = 99;
  exports.UTF16_UNICODE_CI             = 101;
  exports.UTF16_ICELANDIC_CI           = 102;
  exports.UTF16_LATVIAN_CI             = 103;
  exports.UTF16_ROMANIAN_CI            = 104;
  exports.UTF16_SLOVENIAN_CI           = 105;
  exports.UTF16_POLISH_CI              = 106;
  exports.UTF16_ESTONIAN_CI            = 107;
  exports.UTF16_SPANISH_CI             = 108;
  exports.UTF16_SWEDISH_CI             = 109;
  exports.UTF16_TURKISH_CI             = 110;
  exports.UTF16_CZECH_CI               = 111;
  exports.UTF16_DANISH_CI              = 112;
  exports.UTF16_LITHUANIAN_CI          = 113;
  exports.UTF16_SLOVAK_CI              = 114;
  exports.UTF16_SPANISH2_CI            = 115;
  exports.UTF16_ROMAN_CI               = 116;
  exports.UTF16_PERSIAN_CI             = 117;
  exports.UTF16_ESPERANTO_CI           = 118;
  exports.UTF16_HUNGARIAN_CI           = 119;
  exports.UTF16_SINHALA_CI             = 120;
  exports.UTF16_GERMAN2_CI             = 121;
  exports.UTF16_CROATIAN_MYSQL561_CI   = 122;
  exports.UTF16_UNICODE_520_CI         = 123;
  exports.UTF16_VIETNAMESE_CI          = 124;
  exports.UCS2_UNICODE_CI              = 128;
  exports.UCS2_ICELANDIC_CI            = 129;
  exports.UCS2_LATVIAN_CI              = 130;
  exports.UCS2_ROMANIAN_CI             = 131;
  exports.UCS2_SLOVENIAN_CI            = 132;
  exports.UCS2_POLISH_CI               = 133;
  exports.UCS2_ESTONIAN_CI             = 134;
  exports.UCS2_SPANISH_CI              = 135;
  exports.UCS2_SWEDISH_CI              = 136;
  exports.UCS2_TURKISH_CI              = 137;
  exports.UCS2_CZECH_CI                = 138;
  exports.UCS2_DANISH_CI               = 139;
  exports.UCS2_LITHUANIAN_CI           = 140;
  exports.UCS2_SLOVAK_CI               = 141;
  exports.UCS2_SPANISH2_CI             = 142;
  exports.UCS2_ROMAN_CI                = 143;
  exports.UCS2_PERSIAN_CI              = 144;
  exports.UCS2_ESPERANTO_CI            = 145;
  exports.UCS2_HUNGARIAN_CI            = 146;
  exports.UCS2_SINHALA_CI              = 147;
  exports.UCS2_GERMAN2_CI              = 148;
  exports.UCS2_CROATIAN_MYSQL561_CI    = 149;
  exports.UCS2_UNICODE_520_CI          = 150;
  exports.UCS2_VIETNAMESE_CI           = 151;
  exports.UCS2_GENERAL_MYSQL500_CI     = 159;
  exports.UTF32_UNICODE_CI             = 160;
  exports.UTF32_ICELANDIC_CI           = 161;
  exports.UTF32_LATVIAN_CI             = 162;
  exports.UTF32_ROMANIAN_CI            = 163;
  exports.UTF32_SLOVENIAN_CI           = 164;
  exports.UTF32_POLISH_CI              = 165;
  exports.UTF32_ESTONIAN_CI            = 166;
  exports.UTF32_SPANISH_CI             = 167;
  exports.UTF32_SWEDISH_CI             = 168;
  exports.UTF32_TURKISH_CI             = 169;
  exports.UTF32_CZECH_CI               = 170;
  exports.UTF32_DANISH_CI              = 171;
  exports.UTF32_LITHUANIAN_CI          = 172;
  exports.UTF32_SLOVAK_CI              = 173;
  exports.UTF32_SPANISH2_CI            = 174;
  exports.UTF32_ROMAN_CI               = 175;
  exports.UTF32_PERSIAN_CI             = 176;
  exports.UTF32_ESPERANTO_CI           = 177;
  exports.UTF32_HUNGARIAN_CI           = 178;
  exports.UTF32_SINHALA_CI             = 179;
  exports.UTF32_GERMAN2_CI             = 180;
  exports.UTF32_CROATIAN_MYSQL561_CI   = 181;
  exports.UTF32_UNICODE_520_CI         = 182;
  exports.UTF32_VIETNAMESE_CI          = 183;
  exports.UTF8_UNICODE_CI              = 192;
  exports.UTF8_ICELANDIC_CI            = 193;
  exports.UTF8_LATVIAN_CI              = 194;
  exports.UTF8_ROMANIAN_CI             = 195;
  exports.UTF8_SLOVENIAN_CI            = 196;
  exports.UTF8_POLISH_CI               = 197;
  exports.UTF8_ESTONIAN_CI             = 198;
  exports.UTF8_SPANISH_CI              = 199;
  exports.UTF8_SWEDISH_CI              = 200;
  exports.UTF8_TURKISH_CI              = 201;
  exports.UTF8_CZECH_CI                = 202;
  exports.UTF8_DANISH_CI               = 203;
  exports.UTF8_LITHUANIAN_CI           = 204;
  exports.UTF8_SLOVAK_CI               = 205;
  exports.UTF8_SPANISH2_CI             = 206;
  exports.UTF8_ROMAN_CI                = 207;
  exports.UTF8_PERSIAN_CI              = 208;
  exports.UTF8_ESPERANTO_CI            = 209;
  exports.UTF8_HUNGARIAN_CI            = 210;
  exports.UTF8_SINHALA_CI              = 211;
  exports.UTF8_GERMAN2_CI              = 212;
  exports.UTF8_CROATIAN_MYSQL561_CI    = 213;
  exports.UTF8_UNICODE_520_CI          = 214;
  exports.UTF8_VIETNAMESE_CI           = 215;
  exports.UTF8_GENERAL_MYSQL500_CI     = 223;
  exports.UTF8MB4_UNICODE_CI           = 224;
  exports.UTF8MB4_ICELANDIC_CI         = 225;
  exports.UTF8MB4_LATVIAN_CI           = 226;
  exports.UTF8MB4_ROMANIAN_CI          = 227;
  exports.UTF8MB4_SLOVENIAN_CI         = 228;
  exports.UTF8MB4_POLISH_CI            = 229;
  exports.UTF8MB4_ESTONIAN_CI          = 230;
  exports.UTF8MB4_SPANISH_CI           = 231;
  exports.UTF8MB4_SWEDISH_CI           = 232;
  exports.UTF8MB4_TURKISH_CI           = 233;
  exports.UTF8MB4_CZECH_CI             = 234;
  exports.UTF8MB4_DANISH_CI            = 235;
  exports.UTF8MB4_LITHUANIAN_CI        = 236;
  exports.UTF8MB4_SLOVAK_CI            = 237;
  exports.UTF8MB4_SPANISH2_CI          = 238;
  exports.UTF8MB4_ROMAN_CI             = 239;
  exports.UTF8MB4_PERSIAN_CI           = 240;
  exports.UTF8MB4_ESPERANTO_CI         = 241;
  exports.UTF8MB4_HUNGARIAN_CI         = 242;
  exports.UTF8MB4_SINHALA_CI           = 243;
  exports.UTF8MB4_GERMAN2_CI           = 244;
  exports.UTF8MB4_CROATIAN_MYSQL561_CI = 245;
  exports.UTF8MB4_UNICODE_520_CI       = 246;
  exports.UTF8MB4_VIETNAMESE_CI        = 247;
  exports.UTF8_GENERAL50_CI            = 253;

  // short aliases
  exports.ARMSCII8 = exports.ARMSCII8_GENERAL_CI;
  exports.ASCII    = exports.ASCII_GENERAL_CI;
  exports.BIG5     = exports.BIG5_CHINESE_CI;
  exports.BINARY   = exports.BINARY;
  exports.CP1250   = exports.CP1250_GENERAL_CI;
  exports.CP1251   = exports.CP1251_GENERAL_CI;
  exports.CP1256   = exports.CP1256_GENERAL_CI;
  exports.CP1257   = exports.CP1257_GENERAL_CI;
  exports.CP866    = exports.CP866_GENERAL_CI;
  exports.CP850    = exports.CP850_GENERAL_CI;
  exports.CP852    = exports.CP852_GENERAL_CI;
  exports.CP932    = exports.CP932_JAPANESE_CI;
  exports.DEC8     = exports.DEC8_SWEDISH_CI;
  exports.EUCJPMS  = exports.EUCJPMS_JAPANESE_CI;
  exports.EUCKR    = exports.EUCKR_KOREAN_CI;
  exports.GB2312   = exports.GB2312_CHINESE_CI;
  exports.GBK      = exports.GBK_CHINESE_CI;
  exports.GEOSTD8  = exports.GEOSTD8_GENERAL_CI;
  exports.GREEK    = exports.GREEK_GENERAL_CI;
  exports.HEBREW   = exports.HEBREW_GENERAL_CI;
  exports.HP8      = exports.HP8_ENGLISH_CI;
  exports.KEYBCS2  = exports.KEYBCS2_GENERAL_CI;
  exports.KOI8R    = exports.KOI8R_GENERAL_CI;
  exports.KOI8U    = exports.KOI8U_GENERAL_CI;
  exports.LATIN1   = exports.LATIN1_SWEDISH_CI;
  exports.LATIN2   = exports.LATIN2_GENERAL_CI;
  exports.LATIN5   = exports.LATIN5_TURKISH_CI;
  exports.LATIN7   = exports.LATIN7_GENERAL_CI;
  exports.MACCE    = exports.MACCE_GENERAL_CI;
  exports.MACROMAN = exports.MACROMAN_GENERAL_CI;
  exports.SJIS     = exports.SJIS_JAPANESE_CI;
  exports.SWE7     = exports.SWE7_SWEDISH_CI;
  exports.TIS620   = exports.TIS620_THAI_CI;
  exports.UCS2     = exports.UCS2_GENERAL_CI;
  exports.UJIS     = exports.UJIS_JAPANESE_CI;
  exports.UTF16    = exports.UTF16_GENERAL_CI;
  exports.UTF16LE  = exports.UTF16LE_GENERAL_CI;
  exports.UTF8     = exports.UTF8_GENERAL_CI;
  exports.UTF8MB4  = exports.UTF8MB4_GENERAL_CI;
  exports.UTF32    = exports.UTF32_GENERAL_CI;
  }(charsets));

  var ssl_profiles = {};

  (function (exports) {
  // Certificates for Amazon RDS
  exports['Amazon RDS'] = {
    ca: [
      /**
       * Amazon RDS global certificate 2010 to 2015
       *
       *   CN = aws.amazon.com/rds/
       *   OU = RDS
       *   O = Amazon.com
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2010-04-05T22:44:31Z/2015-04-04T22:41:31Z
       *   F = 7F:09:8D:A5:7D:BB:A6:EF:7C:70:D8:CA:4E:49:11:55:7E:89:A7:D3
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIDQzCCAqygAwIBAgIJAOd1tlfiGoEoMA0GCSqGSIb3DQEBBQUAMHUxCzAJBgNV\n'
      + 'BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdTZWF0dGxlMRMw\n'
      + 'EQYDVQQKEwpBbWF6b24uY29tMQwwCgYDVQQLEwNSRFMxHDAaBgNVBAMTE2F3cy5h\n'
      + 'bWF6b24uY29tL3Jkcy8wHhcNMTAwNDA1MjI0NDMxWhcNMTUwNDA0MjI0NDMxWjB1\n'
      + 'MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHU2Vh\n'
      + 'dHRsZTETMBEGA1UEChMKQW1hem9uLmNvbTEMMAoGA1UECxMDUkRTMRwwGgYDVQQD\n'
      + 'ExNhd3MuYW1hem9uLmNvbS9yZHMvMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKB\n'
      + 'gQDKhXGU7tizxUR5WaFoMTFcxNxa05PEjZaIOEN5ctkWrqYSRov0/nOMoZjqk8bC\n'
      + 'med9vPFoQGD0OTakPs0jVe3wwmR735hyVwmKIPPsGlaBYj1O6llIpZeQVyupNx56\n'
      + 'UzqtiLaDzh1KcmfqP3qP2dInzBfJQKjiRudo1FWnpPt33QIDAQABo4HaMIHXMB0G\n'
      + 'A1UdDgQWBBT/H3x+cqSkR/ePSIinPtc4yWKe3DCBpwYDVR0jBIGfMIGcgBT/H3x+\n'
      + 'cqSkR/ePSIinPtc4yWKe3KF5pHcwdTELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldh\n'
      + 'c2hpbmd0b24xEDAOBgNVBAcTB1NlYXR0bGUxEzARBgNVBAoTCkFtYXpvbi5jb20x\n'
      + 'DDAKBgNVBAsTA1JEUzEcMBoGA1UEAxMTYXdzLmFtYXpvbi5jb20vcmRzL4IJAOd1\n'
      + 'tlfiGoEoMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEFBQADgYEAvguZy/BDT66x\n'
      + 'GfgnJlyQwnFSeVLQm9u/FIvz4huGjbq9dqnD6h/Gm56QPFdyMEyDiZWaqY6V08lY\n'
      + 'LTBNb4kcIc9/6pc0/ojKciP5QJRm6OiZ4vgG05nF4fYjhU7WClUx7cxq1fKjNc2J\n'
      + 'UCmmYqgiVkAGWRETVo+byOSDZ4swb10=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS global root CA 2015 to 2020
       *
       *   CN = Amazon RDS Root CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T09:11:31Z/2020-03-05T09:11:31Z
       *   F = E8:11:88:56:E7:A7:CE:3E:5E:DC:9A:31:25:1B:93:AC:DC:43:CE:B0
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID9DCCAtygAwIBAgIBQjANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUwOTExMzFaFw0y\n'
      + 'MDAzMDUwOTExMzFaMIGKMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEbMBkGA1UEAwwSQW1hem9uIFJE\n'
      + 'UyBSb290IENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuD8nrZ8V\n'
      + 'u+VA8yVlUipCZIKPTDcOILYpUe8Tct0YeQQr0uyl018StdBsa3CjBgvwpDRq1HgF\n'
      + 'Ji2N3+39+shCNspQeE6aYU+BHXhKhIIStt3r7gl/4NqYiDDMWKHxHq0nsGDFfArf\n'
      + 'AOcjZdJagOMqb3fF46flc8k2E7THTm9Sz4L7RY1WdABMuurpICLFE3oHcGdapOb9\n'
      + 'T53pQR+xpHW9atkcf3pf7gbO0rlKVSIoUenBlZipUlp1VZl/OD/E+TtRhDDNdI2J\n'
      + 'P/DSMM3aEsq6ZQkfbz/Ilml+Lx3tJYXUDmp+ZjzMPLk/+3beT8EhrwtcG3VPpvwp\n'
      + 'BIOqsqVVTvw/CwIDAQABo2MwYTAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUw\n'
      + 'AwEB/zAdBgNVHQ4EFgQUTgLurD72FchM7Sz1BcGPnIQISYMwHwYDVR0jBBgwFoAU\n'
      + 'TgLurD72FchM7Sz1BcGPnIQISYMwDQYJKoZIhvcNAQEFBQADggEBAHZcgIio8pAm\n'
      + 'MjHD5cl6wKjXxScXKtXygWH2BoDMYBJF9yfyKO2jEFxYKbHePpnXB1R04zJSWAw5\n'
      + '2EUuDI1pSBh9BA82/5PkuNlNeSTB3dXDD2PEPdzVWbSKvUB8ZdooV+2vngL0Zm4r\n'
      + '47QPyd18yPHrRIbtBtHR/6CwKevLZ394zgExqhnekYKIqqEX41xsUV0Gm6x4vpjf\n'
      + '2u6O/+YE2U+qyyxHE5Wd5oqde0oo9UUpFETJPVb6Q2cEeQib8PBAyi0i6KnF+kIV\n'
      + 'A9dY7IHSubtCK/i8wxMVqfd5GtbA8mmpeJFwnDvm9rBEsHybl08qlax9syEwsUYr\n'
      + '/40NawZfTUU=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS global root CA 2019 to 2024
       *
       *   CN = Amazon RDS Root 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-08-22T17:08:50Z/2024-08-22T17:08:50Z
       *   F = D4:0D:DB:29:E3:75:0D:FF:A6:71:C3:14:0B:BF:5F:47:8D:1C:80:96
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBjCCAu6gAwIBAgIJAMc0ZzaSUK51MA0GCSqGSIb3DQEBCwUAMIGPMQswCQYD\n'
      + 'VQQGEwJVUzEQMA4GA1UEBwwHU2VhdHRsZTETMBEGA1UECAwKV2FzaGluZ3RvbjEi\n'
      + 'MCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1h\n'
      + 'em9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJEUyBSb290IDIwMTkgQ0EwHhcNMTkw\n'
      + 'ODIyMTcwODUwWhcNMjQwODIyMTcwODUwWjCBjzELMAkGA1UEBhMCVVMxEDAOBgNV\n'
      + 'BAcMB1NlYXR0bGUxEzARBgNVBAgMCldhc2hpbmd0b24xIjAgBgNVBAoMGUFtYXpv\n'
      + 'biBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMxIDAeBgNV\n'
      + 'BAMMF0FtYXpvbiBSRFMgUm9vdCAyMDE5IENBMIIBIjANBgkqhkiG9w0BAQEFAAOC\n'
      + 'AQ8AMIIBCgKCAQEArXnF/E6/Qh+ku3hQTSKPMhQQlCpoWvnIthzX6MK3p5a0eXKZ\n'
      + 'oWIjYcNNG6UwJjp4fUXl6glp53Jobn+tWNX88dNH2n8DVbppSwScVE2LpuL+94vY\n'
      + '0EYE/XxN7svKea8YvlrqkUBKyxLxTjh+U/KrGOaHxz9v0l6ZNlDbuaZw3qIWdD/I\n'
      + '6aNbGeRUVtpM6P+bWIoxVl/caQylQS6CEYUk+CpVyJSkopwJlzXT07tMoDL5WgX9\n'
      + 'O08KVgDNz9qP/IGtAcRduRcNioH3E9v981QO1zt/Gpb2f8NqAjUUCUZzOnij6mx9\n'
      + 'McZ+9cWX88CRzR0vQODWuZscgI08NvM69Fn2SQIDAQABo2MwYTAOBgNVHQ8BAf8E\n'
      + 'BAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUc19g2LzLA5j0Kxc0LjZa\n'
      + 'pmD/vB8wHwYDVR0jBBgwFoAUc19g2LzLA5j0Kxc0LjZapmD/vB8wDQYJKoZIhvcN\n'
      + 'AQELBQADggEBAHAG7WTmyjzPRIM85rVj+fWHsLIvqpw6DObIjMWokpliCeMINZFV\n'
      + 'ynfgBKsf1ExwbvJNzYFXW6dihnguDG9VMPpi2up/ctQTN8tm9nDKOy08uNZoofMc\n'
      + 'NUZxKCEkVKZv+IL4oHoeayt8egtv3ujJM6V14AstMQ6SwvwvA93EP/Ug2e4WAXHu\n'
      + 'cbI1NAbUgVDqp+DRdfvZkgYKryjTWd/0+1fS8X1bBZVWzl7eirNVnHbSH2ZDpNuY\n'
      + '0SBd8dj5F6ld3t58ydZbrTHze7JJOd8ijySAp4/kiu9UfZWuTPABzDa/DSdz9Dk/\n'
      + 'zPW4CXXvhLmE02TA9/HeCw3KEHIwicNuEfw=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-northeast-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS ap-northeast-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:06Z/2020-03-05T22:03:06Z
       *   F = 4B:2D:8A:E0:C1:A3:A9:AF:A7:BB:65:0C:5A:16:8A:39:3C:03:F2:C5
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEATCCAumgAwIBAgIBRDANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzMDZaFw0y\n'
      + 'MDAzMDUyMjAzMDZaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1hem9uIFJE\n'
      + 'UyBhcC1ub3J0aGVhc3QtMSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n'
      + 'ggEBAMmM2B4PfTXCZjbZMWiDPyxvk/eeNwIRJAhfzesiGUiLozX6CRy3rwC1ZOPV\n'
      + 'AcQf0LB+O8wY88C/cV+d4Q2nBDmnk+Vx7o2MyMh343r5rR3Na+4izd89tkQVt0WW\n'
      + 'vO21KRH5i8EuBjinboOwAwu6IJ+HyiQiM0VjgjrmEr/YzFPL8MgHD/YUHehqjACn\n'
      + 'C0+B7/gu7W4qJzBL2DOf7ub2qszGtwPE+qQzkCRDwE1A4AJmVE++/FLH2Zx78Egg\n'
      + 'fV1sUxPtYgjGH76VyyO6GNKM6rAUMD/q5mnPASQVIXgKbupr618bnH+SWHFjBqZq\n'
      + 'HvDGPMtiiWII41EmGUypyt5AbysCAwEAAaNmMGQwDgYDVR0PAQH/BAQDAgEGMBIG\n'
      + 'A1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFIiKM0Q6n1K4EmLxs3ZXxINbwEwR\n'
      + 'MB8GA1UdIwQYMBaAFE4C7qw+9hXITO0s9QXBj5yECEmDMA0GCSqGSIb3DQEBBQUA\n'
      + 'A4IBAQBezGbE9Rw/k2e25iGjj5n8r+M3dlye8ORfCE/dijHtxqAKasXHgKX8I9Tw\n'
      + 'JkBiGWiuzqn7gO5MJ0nMMro1+gq29qjZnYX1pDHPgsRjUX8R+juRhgJ3JSHijRbf\n'
      + '4qNJrnwga7pj94MhcLq9u0f6dxH6dXbyMv21T4TZMTmcFduf1KgaiVx1PEyJjC6r\n'
      + 'M+Ru+A0eM+jJ7uCjUoZKcpX8xkj4nmSnz9NMPog3wdOSB9cAW7XIc5mHa656wr7I\n'
      + 'WJxVcYNHTXIjCcng2zMKd1aCcl2KSFfy56sRfT7J5Wp69QSr+jq8KM55gw8uqAwi\n'
      + 'VPrXn2899T1rcTtFYFP16WXjGuc0\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-northeast-2 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS ap-northeast-2 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-11-06T00:05:46Z/2020-03-05T00:05:46Z
       *   F = 77:D9:33:4E:CE:56:FC:42:7B:29:57:8D:67:59:ED:29:4E:18:CB:6B
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEATCCAumgAwIBAgIBTDANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTExMDYwMDA1NDZaFw0y\n'
      + 'MDAzMDUwMDA1NDZaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1hem9uIFJE\n'
      + 'UyBhcC1ub3J0aGVhc3QtMiBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n'
      + 'ggEBAKSwd+RVUzTRH0FgnbwoTK8TMm/zMT4+2BvALpAUe6YXbkisg2goycWuuWLg\n'
      + 'jOpFBB3GtyvXZnkqi7MkDWUmj1a2kf8l2oLyoaZ+Hm9x/sV+IJzOqPvj1XVUGjP6\n'
      + 'yYYnPJmUYqvZeI7fEkIGdFkP2m4/sgsSGsFvpD9FK1bL1Kx2UDpYX0kHTtr18Zm/\n'
      + '1oN6irqWALSmXMDydb8hE0FB2A1VFyeKE6PnoDj/Y5cPHwPPdEi6/3gkDkSaOG30\n'
      + 'rWeQfL3pOcKqzbHaWTxMphd0DSL/quZ64Nr+Ly65Q5PRcTrtr55ekOUziuqXwk+o\n'
      + '9QpACMwcJ7ROqOznZTqTzSFVXFECAwEAAaNmMGQwDgYDVR0PAQH/BAQDAgEGMBIG\n'
      + 'A1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFM6Nox/QWbhzWVvzoJ/y0kGpNPK+\n'
      + 'MB8GA1UdIwQYMBaAFE4C7qw+9hXITO0s9QXBj5yECEmDMA0GCSqGSIb3DQEBBQUA\n'
      + 'A4IBAQCTkWBqNvyRf3Y/W21DwFx3oT/AIWrHt0BdGZO34tavummXemTH9LZ/mqv9\n'
      + 'aljt6ZuDtf5DEQjdsAwXMsyo03ffnP7doWm8iaF1+Mui77ot0TmTsP/deyGwukvJ\n'
      + 'tkxX8bZjDh+EaNauWKr+CYnniNxCQLfFtXYJsfOdVBzK3xNL+Z3ucOQRhr2helWc\n'
      + 'CDQgwfhP1+3pRVKqHvWCPC4R3fT7RZHuRmZ38kndv476GxRntejh+ePffif78bFI\n'
      + '3rIZCPBGobrrUMycafSbyXteoGca/kA+/IqrAPlk0pWQ4aEL0yTWN2h2dnjoD7oX\n'
      + 'byIuL/g9AGRh97+ssn7D6bDRPTbW\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-southeast-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS ap-southeast-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:19Z/2020-03-05T22:03:19Z
       *   F = 0E:EC:5D:BD:F9:80:EE:A9:A0:8D:81:AC:37:D9:8D:34:1C:CD:27:D1
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEATCCAumgAwIBAgIBRTANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzMTlaFw0y\n'
      + 'MDAzMDUyMjAzMTlaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1hem9uIFJE\n'
      + 'UyBhcC1zb3V0aGVhc3QtMSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n'
      + 'ggEBANaXElmSEYt/UtxHFsARFhSUahTf1KNJzR0Dmay6hqOXQuRVbKRwPd19u5vx\n'
      + 'DdF1sLT7D69IK3VDnUiQScaCv2Dpu9foZt+rLx+cpx1qiQd1UHrvqq8xPzQOqCdC\n'
      + 'RFStq6yVYZ69yfpfoI67AjclMOjl2Vph3ftVnqP0IgVKZdzeC7fd+umGgR9xY0Qr\n'
      + 'Ubhd/lWdsbNvzK3f1TPWcfIKQnpvSt85PIEDJir6/nuJUKMtmJRwTymJf0i+JZ4x\n'
      + '7dJa341p2kHKcHMgOPW7nJQklGBA70ytjUV6/qebS3yIugr/28mwReflg3TJzVDl\n'
      + 'EOvi6pqbqNbkMuEwGDCmEQIVqgkCAwEAAaNmMGQwDgYDVR0PAQH/BAQDAgEGMBIG\n'
      + 'A1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFAu93/4k5xbWOsgdCdn+/KdiRuit\n'
      + 'MB8GA1UdIwQYMBaAFE4C7qw+9hXITO0s9QXBj5yECEmDMA0GCSqGSIb3DQEBBQUA\n'
      + 'A4IBAQBlcjSyscpPjf5+MgzMuAsCxByqUt+WFspwcMCpwdaBeHOPSQrXNqX2Sk6P\n'
      + 'kth6oCivA64trWo8tFMvPYlUA1FYVD5WpN0kCK+P5pD4KHlaDsXhuhClJzp/OP8t\n'
      + 'pOyUr5109RHLxqoKB5J5m1XA7rgcFjnMxwBSWFe3/4uMk/+4T53YfCVXuc6QV3i7\n'
      + 'I/2LAJwFf//pTtt6fZenYfCsahnr2nvrNRNyAxcfvGZ/4Opn/mJtR6R/AjvQZHiR\n'
      + 'bkRNKF2GW0ueK5W4FkZVZVhhX9xh1Aj2Ollb+lbOqADaVj+AT3PoJPZ3MPQHKCXm\n'
      + 'xwG0LOLlRr/TfD6li1AfOVTAJXv9\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-southeast-2 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS ap-southeast-2 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:24Z/2020-03-05T22:03:24Z
       *   F = 20:D9:A8:82:23:AB:B9:E5:C5:24:10:D3:4D:0F:3D:B1:31:DF:E5:14
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEATCCAumgAwIBAgIBRjANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzMjRaFw0y\n'
      + 'MDAzMDUyMjAzMjRaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1hem9uIFJE\n'
      + 'UyBhcC1zb3V0aGVhc3QtMiBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n'
      + 'ggEBAJqBAJutz69hFOh3BtLHZTbwE8eejGGKayn9hu98YMDPzWzGXWCmW+ZYWELA\n'
      + 'cY3cNWNF8K4FqKXFr2ssorBYim1UtYFX8yhydT2hMD5zgQ2sCGUpuidijuPA6zaq\n'
      + 'Z3tdhVR94f0q8mpwpv2zqR9PcqaGDx2VR1x773FupRPRo7mEW1vC3IptHCQlP/zE\n'
      + '7jQiLl28bDIH2567xg7e7E9WnZToRnhlYdTaDaJsHTzi5mwILi4cihSok7Shv/ME\n'
      + 'hnukvxeSPUpaVtFaBhfBqq055ePq9I+Ns4KGreTKMhU0O9fkkaBaBmPaFgmeX/XO\n'
      + 'n2AX7gMouo3mtv34iDTZ0h6YCGkCAwEAAaNmMGQwDgYDVR0PAQH/BAQDAgEGMBIG\n'
      + 'A1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFIlQnY0KHYWn1jYumSdJYfwj/Nfw\n'
      + 'MB8GA1UdIwQYMBaAFE4C7qw+9hXITO0s9QXBj5yECEmDMA0GCSqGSIb3DQEBBQUA\n'
      + 'A4IBAQA0wVU6/l41cTzHc4azc4CDYY2Wd90DFWiH9C/mw0SgToYfCJ/5Cfi0NT/Y\n'
      + 'PRnk3GchychCJgoPA/k9d0//IhYEAIiIDjyFVgjbTkKV3sh4RbdldKVOUB9kumz/\n'
      + 'ZpShplsGt3z4QQiVnKfrAgqxWDjR0I0pQKkxXa6Sjkicos9LQxVtJ0XA4ieG1E7z\n'
      + 'zJr+6t80wmzxvkInSaWP3xNJK9azVRTrgQZQlvkbpDbExl4mNTG66VD3bAp6t3Wa\n'
      + 'B49//uDdfZmPkqqbX+hsxp160OH0rxJppwO3Bh869PkDnaPEd/Pxw7PawC+li0gi\n'
      + 'NRV8iCEx85aFxcyOhqn0WZOasxee\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-central-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS eu-central-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:31Z/2020-03-05T22:03:31Z
       *   F = 94:B4:DF:B9:6D:7E:F7:C3:B7:BF:51:E9:A6:B7:44:A0:D0:82:11:84
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/zCCAuegAwIBAgIBRzANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzMzFaFw0y\n'
      + 'MDAzMDUyMjAzMzFaMIGSMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEjMCEGA1UEAwwaQW1hem9uIFJE\n'
      + 'UyBldS1jZW50cmFsLTEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB\n'
      + 'AQDFtP2dhSLuaPOI4ZrrPWsK4OY9ocQBp3yApH1KJYmI9wpQKZG/KCH2E6Oo7JAw\n'
      + 'QORU519r033T+FO2Z7pFPlmz1yrxGXyHpJs8ySx3Yo5S8ncDCdZJCLmtPiq/hahg\n'
      + '5/0ffexMFUCQaYicFZsrJ/cStdxUV+tSw2JQLD7UxS9J97LQWUPyyG+ZrjYVTVq+\n'
      + 'zudnFmNSe4QoecXMhAFTGJFQXxP7nhSL9Ao5FGgdXy7/JWeWdQIAj8ku6cBDKPa6\n'
      + 'Y6kP+ak+In+Lye8z9qsCD/afUozfWjPR2aA4JoIZVF8dNRShIMo8l0XfgfM2q0+n\n'
      + 'ApZWZ+BjhIO5XuoUgHS3D2YFAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNV\n'
      + 'HRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBRm4GsWIA/M6q+tK8WGHWDGh2gcyTAf\n'
      + 'BgNVHSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQUFAAOC\n'
      + 'AQEAHpMmeVQNqcxgfQdbDIi5UIy+E7zZykmtAygN1XQrvga9nXTis4kOTN6g5/+g\n'
      + 'HCx7jIXeNJzAbvg8XFqBN84Quqgpl/tQkbpco9Jh1HDs558D5NnZQxNqH5qXQ3Mm\n'
      + 'uPgCw0pYcPOa7bhs07i+MdVwPBsX27CFDtsgAIru8HvKxY1oTZrWnyIRo93tt/pk\n'
      + 'WuItVMVHjaQZVfTCow0aDUbte6Vlw82KjUFq+n2NMSCJDiDKsDDHT6BJc4AJHIq3\n'
      + '/4Z52MSC9KMr0yAaaoWfW/yMEj9LliQauAgwVjArF4q78rxpfKTG9Rfd8U1BZANP\n'
      + '7FrFMN0ThjfA1IvmOYcgskY5bQ==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-west-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS eu-west-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:35Z/2020-03-05T22:03:35Z
       *   F = 1A:95:F0:43:82:D2:5D:A6:AD:F5:13:27:0B:40:8A:72:D9:92:F3:E0
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBSDANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzMzVaFw0y\n'
      + 'MDAzMDUyMjAzMzVaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyBldS13ZXN0LTEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCx\n'
      + 'PdbqQ0HKRj79Pmocxvjc+P6i4Ux24kgFIl+ckiir1vzkmesc3a58gjrMlCksEObt\n'
      + 'Yihs5IhzEq1ePT0gbfS9GYFp34Uj/MtPwlrfCBWG4d2TcrsKRHr1/EXUYhWqmdrb\n'
      + 'RhX8XqoRhVkbF/auzFSBhTzcGGvZpQ2KIaxRcQfcXlMVhj/pxxAjh8U4F350Fb0h\n'
      + 'nX1jw4/KvEreBL0Xb2lnlGTkwVxaKGSgXEnOgIyOFdOQc61vdome0+eeZsP4jqeR\n'
      + 'TGYJA9izJsRbe2YJxHuazD+548hsPlM3vFzKKEVURCha466rAaYAHy3rKur3HYQx\n'
      + 'Yt+SoKcEz9PXuSGj96ejAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBTebg//h2oeXbZjQ4uuoiuLYzuiPDAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQUFAAOCAQEA\n'
      + 'TikPaGeZasTPw+4RBemlsyPAjtFFQLo7ddaFdORLgdEysVf8aBqndvbA6MT/v4lj\n'
      + 'GtEtUdF59ZcbWOrVm+fBZ2h/jYJ59dYF/xzb09nyRbdMSzB9+mkSsnOMqluq5y8o\n'
      + 'DY/PfP2vGhEg/2ZncRC7nlQU1Dm8F4lFWEiQ2fi7O1cW852Vmbq61RIfcYsH/9Ma\n'
      + 'kpgk10VZ75b8m3UhmpZ/2uRY+JEHImH5WpcTJ7wNiPNJsciZMznGtrgOnPzYco8L\n'
      + 'cDleOASIZifNMQi9PKOJKvi0ITz0B/imr8KBsW0YjZVJ54HMa7W1lwugSM7aMAs+\n'
      + 'E3Sd5lS+SHwWaOCHwhOEVA==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS sa-east-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS sa-east-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:40Z/2020-03-05T22:03:40Z
       *   F = 32:10:3D:FA:6D:42:F5:35:98:40:15:F4:4C:74:74:27:CB:CE:D4:B5
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBSTANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzNDBaFw0y\n'
      + 'MDAzMDUyMjAzNDBaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyBzYS1lYXN0LTEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCU\n'
      + 'X4OBnQ5xA6TLJAiFEI6l7bUWjoVJBa/VbMdCCSs2i2dOKmqUaXu2ix2zcPILj3lZ\n'
      + 'GMk3d/2zvTK/cKhcFrewHUBamTeVHdEmynhMQamqNmkM4ptYzFcvEUw1TGxHT4pV\n'
      + 'Q6gSN7+/AJewQvyHexHo8D0+LDN0/Wa9mRm4ixCYH2CyYYJNKaZt9+EZfNu+PPS4\n'
      + '8iB0TWH0DgQkbWMBfCRgolLLitAZklZ4dvdlEBS7evN1/7ttBxUK6SvkeeSx3zBl\n'
      + 'ww3BlXqc3bvTQL0A+RRysaVyFbvtp9domFaDKZCpMmDFAN/ntx215xmQdrSt+K3F\n'
      + 'cXdGQYHx5q410CAclGnbAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBT6iVWnm/uakS+tEX2mzIfw+8JL0zAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQUFAAOCAQEA\n'
      + 'FmDD+QuDklXn2EgShwQxV13+txPRuVdOSrutHhoCgMwFWCMtPPtBAKs6KPY7Guvw\n'
      + 'DpJoZSehDiOfsgMirjOWjvfkeWSNvKfjWTVneX7pZD9W5WPnsDBvTbCGezm+v87z\n'
      + 'b+ZM2ZMo98m/wkMcIEAgdSKilR2fuw8rLkAjhYFfs0A7tDgZ9noKwgHvoE4dsrI0\n'
      + 'KZYco6DlP/brASfHTPa2puBLN9McK3v+h0JaSqqm5Ro2Bh56tZkQh8AWy/miuDuK\n'
      + '3+hNEVdxosxlkM1TPa1DGj0EzzK0yoeerXuH2HX7LlCrrxf6/wdKnjR12PMrLQ4A\n'
      + 'pCqkcWw894z6bV9MAvKe6A==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-east-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS us-east-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T21:54:04Z/2020-03-05T21:54:04Z
       *   F = 34:47:8A:90:8A:83:AE:45:DC:B6:16:76:D2:35:EC:E9:75:C6:2C:63
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBQzANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMTU0MDRaFw0y\n'
      + 'MDAzMDUyMTU0MDRaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyB1cy1lYXN0LTEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDI\n'
      + 'UIuwh8NusKHk1SqPXcP7OqxY3S/M2ZyQWD3w7Bfihpyyy/fc1w0/suIpX3kbMhAV\n'
      + '2ESwged2/2zSx4pVnjp/493r4luhSqQYzru78TuPt9bhJIJ51WXunZW2SWkisSaf\n'
      + 'USYUzVN9ezR/bjXTumSUQaLIouJt3OHLX49s+3NAbUyOI8EdvgBQWD68H1epsC0n\n'
      + 'CI5s+pIktyOZ59c4DCDLQcXErQ+tNbDC++oct1ANd/q8p9URonYwGCGOBy7sbCYq\n'
      + '9eVHh1Iy2M+SNXddVOGw5EuruvHoCIQyOz5Lz4zSuZA9dRbrfztNOpezCNYu6NKM\n'
      + 'n+hzcvdiyxv77uNm8EaxAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBQSQG3TmMe6Sa3KufaPBa72v4QFDzAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQUFAAOCAQEA\n'
      + 'L/mOZfB3187xTmjOHMqN2G2oSKHBKiQLM9uv8+97qT+XR+TVsBT6b3yoPpMAGhHA\n'
      + 'Pc7nxAF5gPpuzatx0OTLPcmYucFmfqT/1qA5WlgCnMNtczyNMH97lKFTNV7Njtek\n'
      + 'jWEzAEQSyEWrkNpNlC4j6kMYyPzVXQeXUeZTgJ9FNnVZqmvfjip2N22tawMjrCn5\n'
      + '7KN/zN65EwY2oO9XsaTwwWmBu3NrDdMbzJnbxoWcFWj4RBwanR1XjQOVNhDwmCOl\n'
      + '/1Et13b8CPyj69PC8BOVU6cfTSx8WUVy0qvYOKHNY9Bqa5BDnIL3IVmUkeTlM1mt\n'
      + 'enRpyBj+Bk9rh/ICdiRKmA==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-west-1 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS us-west-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:45Z/2020-03-05T22:03:45Z
       *   F = EF:94:2F:E3:58:0E:09:D6:79:C2:16:97:91:FB:37:EA:D7:70:A8:4B
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBSjANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzNDVaFw0y\n'
      + 'MDAzMDUyMjAzNDVaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyB1cy13ZXN0LTEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDE\n'
      + 'Dhw+uw/ycaiIhhyu2pXFRimq0DlB8cNtIe8hdqndH8TV/TFrljNgR8QdzOgZtZ9C\n'
      + 'zzQ2GRpInN/qJF6slEd6wO+6TaDBQkPY+07TXNt52POFUhdVkhJXHpE2BS7Xn6J7\n'
      + '7RFAOeG1IZmc2DDt+sR1BgXzUqHslQGfFYNS0/MBO4P+ya6W7IhruB1qfa4HiYQS\n'
      + 'dbe4MvGWnv0UzwAqdR7OF8+8/5c58YXZIXCO9riYF2ql6KNSL5cyDPcYK5VK0+Q9\n'
      + 'VI6vuJHSMYcF7wLePw8jtBktqAFE/wbdZiIHhZvNyiNWPPNTGUmQbaJ+TzQEHDs5\n'
      + '8en+/W7JKnPyBOkxxENbAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBS0nw/tFR9bCjgqWTPJkyy4oOD8bzAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQUFAAOCAQEA\n'
      + 'CXGAY3feAak6lHdqj6+YWjy6yyUnLK37bRxZDsyDVXrPRQaXRzPTzx79jvDwEb/H\n'
      + 'Q/bdQ7zQRWqJcbivQlwhuPJ4kWPUZgSt3JUUuqkMsDzsvj/bwIjlrEFDOdHGh0mi\n'
      + 'eVIngFEjUXjMh+5aHPEF9BlQnB8LfVtKj18e15UDTXFa+xJPFxUR7wDzCfo4WI1m\n'
      + 'sUMG4q1FkGAZgsoyFPZfF8IVvgCuGdR8z30VWKklFxttlK0eGLlPAyIO0CQxPQlo\n'
      + 'saNJrHf4tLOgZIWk+LpDhNd9Et5EzvJ3aURUsKY4pISPPF5WdvM9OE59bERwUErd\n'
      + 'nuOuQWQeeadMceZnauRzJQ==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-west-2 certificate CA 2015 to 2020
       *
       *   CN = Amazon RDS us-west-2 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2015-02-05T22:03:50Z/2020-03-05T22:03:50Z
       *   F = 94:2C:A8:B0:23:48:17:F0:CD:2F:19:7F:C1:E0:21:7C:65:79:13:3A
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBSzANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNTAyMDUyMjAzNTBaFw0y\n'
      + 'MDAzMDUyMjAzNTBaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyB1cy13ZXN0LTIgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDM\n'
      + 'H58SR48U6jyERC1vYTnub34smf5EQVXyzaTmspWGWGzT31NLNZGSDFaa7yef9kdO\n'
      + 'mzJsgebR5tXq6LdwlIoWkKYQ7ycUaadtVKVYdI40QcI3cHn0qLFlg2iBXmWp/B+i\n'
      + 'Z34VuVlCh31Uj5WmhaBoz8t/GRqh1V/aCsf3Wc6jCezH3QfuCjBpzxdOOHN6Ie2v\n'
      + 'xX09O5qmZTvMoRBAvPkxdaPg/Mi7fxueWTbEVk78kuFbF1jHYw8U1BLILIAhcqlq\n'
      + 'x4u8nl73t3O3l/soNUcIwUDK0/S+Kfqhwn9yQyPlhb4Wy3pfnZLJdkyHldktnQav\n'
      + '9TB9u7KH5Lk0aAYslMLxAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBT8roM4lRnlFHWMPWRz0zkwFZog1jAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQUFAAOCAQEA\n'
      + 'JwrxwgwmPtcdaU7O7WDdYa4hprpOMamI49NDzmE0s10oGrqmLwZygcWU0jT+fJ+Y\n'
      + 'pJe1w0CVfKaeLYNsOBVW3X4ZPmffYfWBheZiaiEflq/P6t7/Eg81gaKYnZ/x1Dfa\n'
      + 'sUYkzPvCkXe9wEz5zdUTOCptDt89rBR9CstL9vE7WYUgiVVmBJffWbHQLtfjv6OF\n'
      + 'NMb0QME981kGRzc2WhgP71YS2hHd1kXtsoYP1yTu4vThSKsoN4bkiHsaC1cRkLoy\n'
      + '0fFA4wpB3WloMEvCDaUvvH1LZlBXTNlwi9KtcwD4tDxkkBt4tQczKLGpQ/nF/W9n\n'
      + '8YDWk3IIc1sd0bkZqoau2Q==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-south-1 certificate CA 2016 to 2020
       *
       *   CN = Amazon RDS ap-south-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2016-05-03T21:29:22Z/2020-03-05T21:29:22Z
       *   F = F3:A3:C2:52:D9:82:20:AC:8C:62:31:2A:8C:AD:5D:7B:1C:31:F1:DD
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/TCCAuWgAwIBAgIBTTANBgkqhkiG9w0BAQsFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNjA1MDMyMTI5MjJaFw0y\n'
      + 'MDAzMDUyMTI5MjJaMIGQMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEhMB8GA1UEAwwYQW1hem9uIFJE\n'
      + 'UyBhcC1zb3V0aC0xIENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n'
      + '06eWGLE0TeqL9kyWOLkS8q0fXO97z+xyBV3DKSB2lg2GkgBz3B98MkmkeB0SZy3G\n'
      + 'Ce4uCpCPbFKiFEdiUclOlhZsrBuCeaimxLM3Ig2wuenElO/7TqgaYHYUbT3d+VQW\n'
      + 'GUbLn5GRZJZe1OAClYdOWm7A1CKpuo+cVV1vxbY2nGUQSJPpVn2sT9gnwvjdE60U\n'
      + 'JGYU/RLCTm8zmZBvlWaNIeKDnreIc4rKn6gUnJ2cQn1ryCVleEeyc3xjYDSrjgdn\n'
      + 'FLYGcp9mphqVT0byeQMOk0c7RHpxrCSA0V5V6/CreFV2LteK50qcDQzDSM18vWP/\n'
      + 'p09FoN8O7QrtOeZJzH/lmwIDAQABo2YwZDAOBgNVHQ8BAf8EBAMCAQYwEgYDVR0T\n'
      + 'AQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQU2i83QHuEl/d0keXF+69HNJph7cMwHwYD\n'
      + 'VR0jBBgwFoAUTgLurD72FchM7Sz1BcGPnIQISYMwDQYJKoZIhvcNAQELBQADggEB\n'
      + 'ACqnH2VjApoDqoSQOky52QBwsGaj+xWYHW5Gm7EvCqvQuhWMkeBuD6YJmMvNyA9G\n'
      + 'I2lh6/o+sUk/RIsbYbxPRdhNPTOgDR9zsNRw6qxaHztq/CEC+mxDCLa3O1hHBaDV\n'
      + 'BmB3nCZb93BvO0EQSEk7aytKq/f+sjyxqOcs385gintdHGU9uM7gTZHnU9vByJsm\n'
      + '/TL07Miq67X0NlhIoo3jAk+xHaeKJdxdKATQp0448P5cY20q4b8aMk1twcNaMvCP\n'
      + 'dG4M5doaoUA8OQ/0ukLLae/LBxLeTw04q1/a2SyFaVUX2Twbb1S3xVWwLA8vsyGr\n'
      + 'igXx7B5GgP+IHb6DTjPJAi0=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-east-2 certificate CA 2016 to 2020
       *
       *   CN = Amazon RDS us-east-2 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2016-08-11T19:58:45Z/2020-03-05T19:58:45Z
       *   F = 9B:78:E3:64:7F:74:BC:B2:52:18:CF:13:C3:62:B8:35:9D:3D:5F:B6
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBTjANBgkqhkiG9w0BAQsFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNjA4MTExOTU4NDVaFw0y\n'
      + 'MDAzMDUxOTU4NDVaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyB1cy1lYXN0LTIgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCp\n'
      + 'WnnUX7wM0zzstccX+4iXKJa9GR0a2PpvB1paEX4QRCgfhEdQWDaSqyrWNgdVCKkt\n'
      + '1aQkWu5j6VAC2XIG7kKoonm1ZdBVyBLqW5lXNywlaiU9yhJkwo8BR+/OqgE+PLt/\n'
      + 'EO1mlN0PQudja/XkExCXTO29TG2j7F/O7hox6vTyHNHc0H88zS21uPuBE+jivViS\n'
      + 'yzj/BkyoQ85hnkues3f9R6gCGdc+J51JbZnmgzUkvXjAEuKhAm9JksVOxcOKUYe5\n'
      + 'ERhn0U9zjzpfbAITIkul97VVa5IxskFFTHIPJbvRKHJkiF6wTJww/tc9wm+fSCJ1\n'
      + '+DbQTGZgkQ3bJrqRN29/AgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBSAHQzUYYZbepwKEMvGdHp8wzHnfDAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQsFAAOCAQEA\n'
      + 'MbaEzSYZ+aZeTBxf8yi0ta8K4RdwEJsEmP6IhFFQHYUtva2Cynl4Q9tZg3RMsybT\n'
      + '9mlnSQQlbN/wqIIXbkrcgFcHoXG9Odm/bDtUwwwDaiEhXVfeQom3G77QHOWMTCGK\n'
      + 'qadwuh5msrb17JdXZoXr4PYHDKP7j0ONfAyFNER2+uecblHfRSpVq5UeF3L6ZJb8\n'
      + 'fSw/GtAV6an+/0r+Qm+PiI2H5XuZ4GmRJYnGMhqWhBYrY7p3jtVnKcsh39wgfUnW\n'
      + 'AvZEZG/yhFyAZW0Essa39LiL5VSq14Y1DOj0wgnhSY/9WHxaAo1HB1T9OeZknYbD\n'
      + 'fl/EGSZ0TEvZkENrXcPlVA==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ca-central-1 certificate CA 2016 to 2020
       *
       *   CN = Amazon RDS ca-central-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2016-09-15T00:10:11Z/2020-03-05T00:10:11Z
       *   F = D7:E0:16:AB:8A:0B:63:9F:67:1F:16:87:42:F4:0A:EE:73:A6:FC:04
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/zCCAuegAwIBAgIBTzANBgkqhkiG9w0BAQsFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNjA5MTUwMDEwMTFaFw0y\n'
      + 'MDAzMDUwMDEwMTFaMIGSMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEjMCEGA1UEAwwaQW1hem9uIFJE\n'
      + 'UyBjYS1jZW50cmFsLTEgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB\n'
      + 'AQCZYI/iQ6DrS3ny3t1EwX1wAD+3LMgh7Fd01EW5LIuaK2kYIIQpsVKhxLCit/V5\n'
      + 'AGc/1qiJS1Qz9ODLTh0Na6bZW6EakRzuHJLe32KJtoFYPC7Z09UqzXrpA/XL+1hM\n'
      + 'P0ZmCWsU7Nn/EmvfBp9zX3dZp6P6ATrvDuYaVFr+SA7aT3FXpBroqBS1fyzUPs+W\n'
      + 'c6zTR6+yc4zkHX0XQxC5RH6xjgpeRkoOajA/sNo7AQF7KlWmKHbdVF44cvvAhRKZ\n'
      + 'XaoVs/C4GjkaAEPTCbopYdhzg+KLx9eB2BQnYLRrIOQZtRfbQI2Nbj7p3VsRuOW1\n'
      + 'tlcks2w1Gb0YC6w6SuIMFkl1AgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNV\n'
      + 'HRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBToYWxE1lawl6Ks6NsvpbHQ3GKEtzAf\n'
      + 'BgNVHSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQsFAAOC\n'
      + 'AQEAG/8tQ0ooi3hoQpa5EJz0/E5VYBsAz3YxA2HoIonn0jJyG16bzB4yZt4vNQMA\n'
      + 'KsNlQ1uwDWYL1nz63axieUUFIxqxl1KmwfhsmLgZ0Hd2mnTPIl2Hw3uj5+wdgGBg\n'
      + 'agnAZ0bajsBYgD2VGQbqjdk2Qn7Fjy3LEWIvGZx4KyZ99OJ2QxB7JOPdauURAtWA\n'
      + 'DKYkP4LLJxtj07DSzG8kuRWb9B47uqUD+eKDIyjfjbnzGtd9HqqzYFau7EX3HVD9\n'
      + '9Qhnjl7bTZ6YfAEZ3nH2t3Vc0z76XfGh47rd0pNRhMV+xpok75asKf/lNh5mcUrr\n'
      + 'VKwflyMkQpSbDCmcdJ90N2xEXQ==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-west-2 certificate CA 2016 to 2020
       *
       *   CN = Amazon RDS eu-west-2 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2016-10-10T17:44:42Z/2020-03-05T17:44:42Z
       *   F = 47:79:51:9F:FF:07:D3:F4:27:D3:AB:64:56:7F:00:45:BB:84:C1:71
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBUDANBgkqhkiG9w0BAQsFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNjEwMTAxNzQ0NDJaFw0y\n'
      + 'MDAzMDUxNzQ0NDJaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyBldS13ZXN0LTIgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDO\n'
      + 'cttLJfubB4XMMIGWNfJISkIdCMGJyOzLiMJaiWB5GYoXKhEl7YGotpy0qklwW3BQ\n'
      + 'a0fmVdcCLX+dIuVQ9iFK+ZcK7zwm7HtdDTCHOCKeOh2IcnU4c/VIokFi6Gn8udM6\n'
      + 'N/Zi5M5OGpVwLVALQU7Yctsn3c95el6MdVx6mJiIPVu7tCVZn88Z2koBQ2gq9P4O\n'
      + 'Sb249SHFqOb03lYDsaqy1NDsznEOhaRBw7DPJFpvmw1lA3/Y6qrExRI06H2VYR2i\n'
      + '7qxwDV50N58fs10n7Ye1IOxTVJsgEA7X6EkRRXqYaM39Z76R894548WHfwXWjUsi\n'
      + 'MEX0RS0/t1GmnUQjvevDAgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBQBxmcuRSxERYCtNnSr5xNfySokHjAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQsFAAOCAQEA\n'
      + 'UyCUQjsF3nUAABjfEZmpksTuUo07aT3KGYt+EMMFdejnBQ0+2lJJFGtT+CDAk1SD\n'
      + 'RSgfEBon5vvKEtlnTf9a3pv8WXOAkhfxnryr9FH6NiB8obISHNQNPHn0ljT2/T+I\n'
      + 'Y6ytfRvKHa0cu3V0NXbJm2B4KEOt4QCDiFxUIX9z6eB4Kditwu05OgQh6KcogOiP\n'
      + 'JesWxBMXXGoDC1rIYTFO7szwDyOHlCcVXJDNsTJhc32oDWYdeIbW7o/5I+aQsrXZ\n'
      + 'C96HykZcgWzz6sElrQxUaT3IoMw/5nmw4uWKKnZnxgI9bY4fpQwMeBZ96iHfFxvH\n'
      + 'mqfEEuC7uUoPofXdBp2ObQ==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-gov-west-1 CA 2017 to 2022
       *
       *   CN = Amazon RDS us-gov-west-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2017-05-19T22:31:19Z/2022-05-18T12:00:00Z
       *   F = 77:55:8C:C4:5E:71:1F:1B:57:E3:DA:6E:5B:74:27:12:4E:E8:69:E8
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECjCCAvKgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgZMxCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSQwIgYDVQQDDBtBbWF6b24gUkRTIEdvdkNsb3VkIFJvb3QgQ0EwHhcNMTcwNTE5\n'
      + 'MjIzMTE5WhcNMjIwNTE4MTIwMDAwWjCBkzELMAkGA1UEBhMCVVMxEzARBgNVBAgM\n'
      + 'Cldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoMGUFtYXpvbiBX\n'
      + 'ZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMxJDAiBgNVBAMM\n'
      + 'G0FtYXpvbiBSRFMgdXMtZ292LXdlc3QtMSBDQTCCASIwDQYJKoZIhvcNAQEBBQAD\n'
      + 'ggEPADCCAQoCggEBAM8YZLKAzzOdNnoi7Klih26Zkj+OCpDfwx4ZYB6f8L8UoQi5\n'
      + '8z9ZtIwMjiJ/kO08P1yl4gfc7YZcNFvhGruQZNat3YNpxwUpQcr4mszjuffbL4uz\n'
      + '+/8FBxALdqCVOJ5Q0EVSfz3d9Bd1pUPL7ARtSpy7bn/tUPyQeI+lODYO906C0TQ3\n'
      + 'b9bjOsgAdBKkHfjLdsknsOZYYIzYWOJyFJJa0B11XjDUNBy/3IuC0KvDl6At0V5b\n'
      + '8M6cWcKhte2hgjwTYepV+/GTadeube1z5z6mWsN5arOAQUtYDLH6Aztq9mCJzLHm\n'
      + 'RccBugnGl3fRLJ2VjioN8PoGoN9l9hFBy5fnFgsCAwEAAaNmMGQwDgYDVR0PAQH/\n'
      + 'BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFEG7+br8KkvwPd5g\n'
      + '71Rvh2stclJbMB8GA1UdIwQYMBaAFEkQz6S4NS5lOYKcDjBSuCcVpdzjMA0GCSqG\n'
      + 'SIb3DQEBCwUAA4IBAQBMA327u5ABmhX+aPxljoIbxnydmAFWxW6wNp5+rZrvPig8\n'
      + 'zDRqGQWWr7wWOIjfcWugSElYtf/m9KZHG/Z6+NG7nAoUrdcd1h/IQhb+lFQ2b5g9\n'
      + 'sVzQv/H2JNkfZA8fL/Ko/Tm/f9tcqe0zrGCtT+5u0Nvz35Wl8CEUKLloS5xEb3k5\n'
      + '7D9IhG3fsE3vHWlWrGCk1cKry3j12wdPG5cUsug0vt34u6rdhP+FsM0tHI15Kjch\n'
      + 'RuUCvyQecy2ZFNAa3jmd5ycNdL63RWe8oayRBpQBxPPCbHfILxGZEdJbCH9aJ2D/\n'
      + 'l8oHIDnvOLdv7/cBjyYuvmprgPtu3QEkbre5Hln/\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-west-3 certificate CA 2017 to 2020
       *
       *   CN = Amazon RDS eu-west-3 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2017-08-25T21:39:26Z/2020-03-05T21:39:26Z
       *   F = FD:35:A7:84:60:68:98:00:12:54:ED:34:26:8C:66:0F:72:DD:B2:F4
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIID/DCCAuSgAwIBAgIBUTANBgkqhkiG9w0BAQsFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNzA4MjUyMTM5MjZaFw0y\n'
      + 'MDAzMDUyMTM5MjZaMIGPMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEgMB4GA1UEAwwXQW1hem9uIFJE\n'
      + 'UyBldS13ZXN0LTMgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC+\n'
      + 'xmlEC/3a4cJH+UPwXCE02lC7Zq5NHd0dn6peMeLN8agb6jW4VfSY0NydjRj2DJZ8\n'
      + 'K7wV6sub5NUGT1NuFmvSmdbNR2T59KX0p2dVvxmXHHtIpQ9Y8Aq3ZfhmC5q5Bqgw\n'
      + 'tMA1xayDi7HmoPX3R8kk9ktAZQf6lDeksCvok8idjTu9tiSpDiMwds5BjMsWfyjZ\n'
      + 'd13PTGGNHYVdP692BSyXzSP1Vj84nJKnciW8tAqwIiadreJt5oXyrCXi8ekUMs80\n'
      + 'cUTuGm3aA3Q7PB5ljJMPqz0eVddaiIvmTJ9O3Ez3Du/HpImyMzXjkFaf+oNXf/Hx\n'
      + '/EW5jCRR6vEiXJcDRDS7AgMBAAGjZjBkMA4GA1UdDwEB/wQEAwIBBjASBgNVHRMB\n'
      + 'Af8ECDAGAQH/AgEAMB0GA1UdDgQWBBRZ9mRtS5fHk3ZKhG20Oack4cAqMTAfBgNV\n'
      + 'HSMEGDAWgBROAu6sPvYVyEztLPUFwY+chAhJgzANBgkqhkiG9w0BAQsFAAOCAQEA\n'
      + 'F/u/9L6ExQwD73F/bhCw7PWcwwqsK1mypIdrjdIsu0JSgwWwGCXmrIspA3n3Dqxq\n'
      + 'sMhAJD88s9Em7337t+naar2VyLO63MGwjj+vA4mtvQRKq8ScIpiEc7xN6g8HUMsd\n'
      + 'gPG9lBGfNjuAZsrGJflrko4HyuSM7zHExMjXLH+CXcv/m3lWOZwnIvlVMa4x0Tz0\n'
      + 'A4fklaawryngzeEjuW6zOiYCzjZtPlP8Fw0SpzppJ8VpQfrZ751RDo4yudmPqoPK\n'
      + '5EUe36L8U+oYBXnC5TlYs9bpVv9o5wJQI5qA9oQE2eFWxF1E0AyZ4V5sgGUBStaX\n'
      + 'BjDDWul0wSo7rt1Tq7XpnA==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-northeast-3 certificate CA 2017 to 2020
       *
       *   CN = Amazon RDS ap-northeast-3 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2017-12-01T00:55:42Z/2020-03-05T00:55:42Z
       *   F = C0:C7:D4:B3:91:40:A0:77:43:28:BF:AF:77:57:DF:FD:98:FB:10:3F
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEATCCAumgAwIBAgIBTjANBgkqhkiG9w0BAQUFADCBijELMAkGA1UEBhMCVVMx\n'
      + 'EzARBgNVBAgMCldhc2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'GzAZBgNVBAMMEkFtYXpvbiBSRFMgUm9vdCBDQTAeFw0xNzEyMDEwMDU1NDJaFw0y\n'
      + 'MDAzMDUwMDU1NDJaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2FzaGluZ3Rv\n'
      + 'bjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNl\n'
      + 'cywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1hem9uIFJE\n'
      + 'UyBhcC1ub3J0aGVhc3QtMyBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC\n'
      + 'ggEBAMZtQNnm/XT19mTa10ftHLzg5UhajoI65JHv4TQNdGXdsv+CQdGYU49BJ9Eu\n'
      + '3bYgiEtTzR2lQe9zGMvtuJobLhOWuavzp7IixoIQcHkFHN6wJ1CvqrxgvJfBq6Hy\n'
      + 'EuCDCiU+PPDLUNA6XM6Qx3IpHd1wrJkjRB80dhmMSpxmRmx849uFafhN+P1QybsM\n'
      + 'TI0o48VON2+vj+mNuQTyLMMP8D4odSQHjaoG+zyJfJGZeAyqQyoOUOFEyQaHC3TT\n'
      + '3IDSNCQlpxb9LerbCoKu79WFBBq3CS5cYpg8/fsnV2CniRBFFUumBt5z4dhw9RJU\n'
      + 'qlUXXO1ZyzpGd+c5v6FtrfXtnIUCAwEAAaNmMGQwDgYDVR0PAQH/BAQDAgEGMBIG\n'
      + 'A1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFETv7ELNplYy/xTeIOInl6nzeiHg\n'
      + 'MB8GA1UdIwQYMBaAFE4C7qw+9hXITO0s9QXBj5yECEmDMA0GCSqGSIb3DQEBBQUA\n'
      + 'A4IBAQCpKxOQcd0tEKb3OtsOY8q/MPwTyustGk2Rt7t9G68idADp8IytB7M0SDRo\n'
      + 'wWZqynEq7orQVKdVOanhEWksNDzGp0+FPAf/KpVvdYCd7ru3+iI+V4ZEp2JFdjuZ\n'
      + 'Zz0PIjS6AgsZqE5Ri1J+NmfmjGZCPhsHnGZiBaenX6K5VRwwwmLN6xtoqrrfR5zL\n'
      + 'QfBeeZNJG6KiM3R/DxJ5rAa6Fz+acrhJ60L7HprhB7SFtj1RCijau3+ZwiGmUOMr\n'
      + 'yKlMv+VgmzSw7o4Hbxy1WVrA6zQsTHHSGf+vkQn2PHvnFMUEu/ZLbTDYFNmTLK91\n'
      + 'K6o4nMsEvhBKgo4z7H1EqqxXhvN2\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS GovCloud Root CA 2017 to 2022
       *
       *   CN = Amazon RDS GovCloud Root CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2017-05-19T22:29:11Z/2022-05-18T22:29:11Z
       *   F = A3:61:F9:C9:A2:5B:91:FE:73:A6:52:E3:59:14:8E:CE:35:12:0F:FD
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEDjCCAvagAwIBAgIJAMM61RQn3/kdMA0GCSqGSIb3DQEBCwUAMIGTMQswCQYD\n'
      + 'VQQGEwJVUzEQMA4GA1UEBwwHU2VhdHRsZTETMBEGA1UECAwKV2FzaGluZ3RvbjEi\n'
      + 'MCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1h\n'
      + 'em9uIFJEUzEkMCIGA1UEAwwbQW1hem9uIFJEUyBHb3ZDbG91ZCBSb290IENBMB4X\n'
      + 'DTE3MDUxOTIyMjkxMVoXDTIyMDUxODIyMjkxMVowgZMxCzAJBgNVBAYTAlVTMRAw\n'
      + 'DgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQKDBlB\n'
      + 'bWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRTMSQw\n'
      + 'IgYDVQQDDBtBbWF6b24gUkRTIEdvdkNsb3VkIFJvb3QgQ0EwggEiMA0GCSqGSIb3\n'
      + 'DQEBAQUAA4IBDwAwggEKAoIBAQDGS9bh1FGiJPT+GRb3C5aKypJVDC1H2gbh6n3u\n'
      + 'j8cUiyMXfmm+ak402zdLpSYMaxiQ7oL/B3wEmumIpRDAsQrSp3B/qEeY7ipQGOfh\n'
      + 'q2TXjXGIUjiJ/FaoGqkymHRLG+XkNNBtb7MRItsjlMVNELXECwSiMa3nJL2/YyHW\n'
      + 'nTr1+11/weeZEKgVbCUrOugFkMXnfZIBSn40j6EnRlO2u/NFU5ksK5ak2+j8raZ7\n'
      + 'xW7VXp9S1Tgf1IsWHjGZZZguwCkkh1tHOlHC9gVA3p63WecjrIzcrR/V27atul4m\n'
      + 'tn56s5NwFvYPUIx1dbC8IajLUrepVm6XOwdQCfd02DmOyjWJAgMBAAGjYzBhMA4G\n'
      + 'A1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRJEM+kuDUu\n'
      + 'ZTmCnA4wUrgnFaXc4zAfBgNVHSMEGDAWgBRJEM+kuDUuZTmCnA4wUrgnFaXc4zAN\n'
      + 'BgkqhkiG9w0BAQsFAAOCAQEAcfA7uirXsNZyI2j4AJFVtOTKOZlQwqbyNducnmlg\n'
      + '/5nug9fAkwM4AgvF5bBOD1Hw6khdsccMwIj+1S7wpL+EYb/nSc8G0qe1p/9lZ/mZ\n'
      + 'ff5g4JOa26lLuCrZDqAk4TzYnt6sQKfa5ZXVUUn0BK3okhiXS0i+NloMyaBCL7vk\n'
      + 'kDwkHwEqflRKfZ9/oFTcCfoiHPA7AdBtaPVr0/Kj9L7k+ouz122huqG5KqX0Zpo8\n'
      + 'S0IGvcd2FZjNSNPttNAK7YuBVsZ0m2nIH1SLp//00v7yAHIgytQwwB17PBcp4NXD\n'
      + 'pCfTa27ng9mMMC2YLqWQpW4TkqjDin2ZC+5X/mbrjzTvVg==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-east-1 certificate CA 2019 to 2022
       *
       *   CN = Amazon RDS ap-east-1 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-02-17T02:47:00Z/2022-06-01T12:00:00Z
       *   F = BC:F8:70:75:1F:93:3F:A7:82:86:67:63:A8:86:1F:A4:E8:07:CE:06
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwgZQxCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSUwIwYDVQQDDBxBbWF6b24gUkRTIGFwLWVhc3QtMSBSb290IENBMB4XDTE5MDIx\n'
      + 'NzAyNDcwMFoXDTIyMDYwMTEyMDAwMFowgY8xCzAJBgNVBAYTAlVTMRMwEQYDVQQI\n'
      + 'DApXYXNoaW5ndG9uMRAwDgYDVQQHDAdTZWF0dGxlMSIwIAYDVQQKDBlBbWF6b24g\n'
      + 'V2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRTMSAwHgYDVQQD\n'
      + 'DBdBbWF6b24gUkRTIGFwLWVhc3QtMSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBAOcJAUofyJuBuPr5ISHi/Ha5ed8h3eGdzn4MBp6rytPOg9NVGRQs\n'
      + 'O93fNGCIKsUT6gPuk+1f1ncMTV8Y0Fdf4aqGWme+Khm3ZOP3V1IiGnVq0U2xiOmn\n'
      + 'SQ4Q7LoeQC4lC6zpoCHVJyDjZ4pAknQQfsXb77Togdt/tK5ahev0D+Q3gCwAoBoO\n'
      + 'DHKJ6t820qPi63AeGbJrsfNjLKiXlFPDUj4BGir4dUzjEeH7/hx37na1XG/3EcxP\n'
      + '399cT5k7sY/CR9kctMlUyEEUNQOmhi/ly1Lgtihm3QfjL6K9aGLFNwX35Bkh9aL2\n'
      + 'F058u+n8DP/dPeKUAcJKiQZUmzuen5n57x8CAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFFlqgF4FQlb9yP6c+Q3E\n'
      + 'O3tXv+zOMB8GA1UdIwQYMBaAFK9T6sY/PBZVbnHcNcQXf58P4OuPMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQDeXiS3v1z4jWAo1UvVyKDeHjtrtEH1Rida1eOXauFuEQa5tuOk\n'
      + 'E53Os4haZCW4mOlKjigWs4LN+uLIAe1aFXGo92nGIqyJISHJ1L+bopx/JmIbHMCZ\n'
      + '0lTNJfR12yBma5VQy7vzeFku/SisKwX0Lov1oHD4MVhJoHbUJYkmAjxorcIHORvh\n'
      + 'I3Vj5XrgDWtLDPL8/Id/roul/L+WX5ir+PGScKBfQIIN2lWdZoqdsx8YWqhm/ikL\n'
      + 'C6qNieSwcvWL7C03ri0DefTQMY54r5wP33QU5hJ71JoaZI3YTeT0Nf+NRL4hM++w\n'
      + 'Q0veeNzBQXg1f/JxfeA39IDIX1kiCf71tGlT\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-northeast-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ap-northeast-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-18T16:56:20Z/2024-08-22T17:08:50Z
       *   F = 47:A3:F9:20:64:5C:9F:9D:48:8C:7D:E6:0B:86:D6:05:13:00:16:A1
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEDDCCAvSgAwIBAgICcEUwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTgxNjU2\n'
      + 'MjBaFw0yNDA4MjIxNzA4NTBaMIGZMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEqMCgGA1UEAwwhQW1h\n'
      + 'em9uIFJEUyBhcC1ub3J0aGVhc3QtMSAyMDE5IENBMIIBIjANBgkqhkiG9w0BAQEF\n'
      + 'AAOCAQ8AMIIBCgKCAQEAndtkldmHtk4TVQAyqhAvtEHSMb6pLhyKrIFved1WO3S7\n'
      + '+I+bWwv9b2W/ljJxLq9kdT43bhvzonNtI4a1LAohS6bqyirmk8sFfsWT3akb+4Sx\n'
      + '1sjc8Ovc9eqIWJCrUiSvv7+cS7ZTA9AgM1PxvHcsqrcUXiK3Jd/Dax9jdZE1e15s\n'
      + 'BEhb2OEPE+tClFZ+soj8h8Pl2Clo5OAppEzYI4LmFKtp1X/BOf62k4jviXuCSst3\n'
      + 'UnRJzE/CXtjmN6oZySVWSe0rQYuyqRl6//9nK40cfGKyxVnimB8XrrcxUN743Vud\n'
      + 'QQVU0Esm8OVTX013mXWQXJHP2c0aKkog8LOga0vobQIDAQABo2YwZDAOBgNVHQ8B\n'
      + 'Af8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQULmoOS1mFSjj+\n'
      + 'snUPx4DgS3SkLFYwHwYDVR0jBBgwFoAUc19g2LzLA5j0Kxc0LjZapmD/vB8wDQYJ\n'
      + 'KoZIhvcNAQELBQADggEBAAkVL2P1M2/G9GM3DANVAqYOwmX0Xk58YBHQu6iiQg4j\n'
      + 'b4Ky/qsZIsgT7YBsZA4AOcPKQFgGTWhe9pvhmXqoN3RYltN8Vn7TbUm/ZVDoMsrM\n'
      + 'gwv0+TKxW1/u7s8cXYfHPiTzVSJuOogHx99kBW6b2f99GbP7O1Sv3sLq4j6lVvBX\n'
      + 'Fiacf5LAWC925nvlTzLlBgIc3O9xDtFeAGtZcEtxZJ4fnGXiqEnN4539+nqzIyYq\n'
      + 'nvlgCzyvcfRAxwltrJHuuRu6Maw5AGcd2Y0saMhqOVq9KYKFKuD/927BTrbd2JVf\n'
      + '2sGWyuPZPCk3gq+5pCjbD0c6DkhcMGI6WwxvM5V/zSM=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-northeast-2 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ap-northeast-2 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-10T17:46:21Z/2024-08-22T17:08:50Z
       *   F = 8E:1C:70:C1:64:BD:FC:F9:93:9B:A2:67:CA:CF:52:F0:E1:F7:B4:F0
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEDDCCAvSgAwIBAgICOFAwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTAxNzQ2\n'
      + 'MjFaFw0yNDA4MjIxNzA4NTBaMIGZMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEqMCgGA1UEAwwhQW1h\n'
      + 'em9uIFJEUyBhcC1ub3J0aGVhc3QtMiAyMDE5IENBMIIBIjANBgkqhkiG9w0BAQEF\n'
      + 'AAOCAQ8AMIIBCgKCAQEAzU72e6XbaJbi4HjJoRNjKxzUEuChKQIt7k3CWzNnmjc5\n'
      + '8I1MjCpa2W1iw1BYVysXSNSsLOtUsfvBZxi/1uyMn5ZCaf9aeoA9UsSkFSZBjOCN\n'
      + 'DpKPCmfV1zcEOvJz26+1m8WDg+8Oa60QV0ou2AU1tYcw98fOQjcAES0JXXB80P2s\n'
      + '3UfkNcnDz+l4k7j4SllhFPhH6BQ4lD2NiFAP4HwoG6FeJUn45EPjzrydxjq6v5Fc\n'
      + 'cQ8rGuHADVXotDbEhaYhNjIrsPL+puhjWfhJjheEw8c4whRZNp6gJ/b6WEes/ZhZ\n'
      + 'h32DwsDsZw0BfRDUMgUn8TdecNexHUw8vQWeC181hwIDAQABo2YwZDAOBgNVHQ8B\n'
      + 'Af8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQUwW9bWgkWkr0U\n'
      + 'lrOsq2kvIdrECDgwHwYDVR0jBBgwFoAUc19g2LzLA5j0Kxc0LjZapmD/vB8wDQYJ\n'
      + 'KoZIhvcNAQELBQADggEBAEugF0Gj7HVhX0ehPZoGRYRt3PBuI2YjfrrJRTZ9X5wc\n'
      + '9T8oHmw07mHmNy1qqWvooNJg09bDGfB0k5goC2emDiIiGfc/kvMLI7u+eQOoMKj6\n'
      + 'mkfCncyRN3ty08Po45vTLBFZGUvtQmjM6yKewc4sXiASSBmQUpsMbiHRCL72M5qV\n'
      + 'obcJOjGcIdDTmV1BHdWT+XcjynsGjUqOvQWWhhLPrn4jWe6Xuxll75qlrpn3IrIx\n'
      + 'CRBv/5r7qbcQJPOgwQsyK4kv9Ly8g7YT1/vYBlR3cRsYQjccw5ceWUj2DrMVWhJ4\n'
      + 'prf+E3Aa4vYmLLOUUvKnDQ1k3RGNu56V0tonsQbfsaM=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-northeast-3 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ap-northeast-3 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-17T20:05:29Z/2024-08-22T17:08:50Z
       *   F = D1:08:B1:40:6D:6C:80:8E:F4:C1:2C:8A:1F:66:17:01:54:CD:1A:4E
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEDDCCAvSgAwIBAgICOYIwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTcyMDA1\n'
      + 'MjlaFw0yNDA4MjIxNzA4NTBaMIGZMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEqMCgGA1UEAwwhQW1h\n'
      + 'em9uIFJEUyBhcC1ub3J0aGVhc3QtMyAyMDE5IENBMIIBIjANBgkqhkiG9w0BAQEF\n'
      + 'AAOCAQ8AMIIBCgKCAQEA4dMak8W+XW8y/2F6nRiytFiA4XLwePadqWebGtlIgyCS\n'
      + 'kbug8Jv5w7nlMkuxOxoUeD4WhI6A9EkAn3r0REM/2f0aYnd2KPxeqS2MrtdxxHw1\n'
      + 'xoOxk2x0piNSlOz6yog1idsKR5Wurf94fvM9FdTrMYPPrDabbGqiBMsZZmoHLvA3\n'
      + 'Z+57HEV2tU0Ei3vWeGIqnNjIekS+E06KhASxrkNU5vi611UsnYZlSi0VtJsH4UGV\n'
      + 'LhnHl53aZL0YFO5mn/fzuNG/51qgk/6EFMMhaWInXX49Dia9FnnuWXwVwi6uX1Wn\n'
      + '7kjoHi5VtmC8ZlGEHroxX2DxEr6bhJTEpcLMnoQMqwIDAQABo2YwZDAOBgNVHQ8B\n'
      + 'Af8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQUsUI5Cb3SWB8+\n'
      + 'gv1YLN/ABPMdxSAwHwYDVR0jBBgwFoAUc19g2LzLA5j0Kxc0LjZapmD/vB8wDQYJ\n'
      + 'KoZIhvcNAQELBQADggEBAJAF3E9PM1uzVL8YNdzb6fwJrxxqI2shvaMVmC1mXS+w\n'
      + 'G0zh4v2hBZOf91l1EO0rwFD7+fxoI6hzQfMxIczh875T6vUXePKVOCOKI5wCrDad\n'
      + 'zQbVqbFbdhsBjF4aUilOdtw2qjjs9JwPuB0VXN4/jY7m21oKEOcnpe36+7OiSPjN\n'
      + 'xngYewCXKrSRqoj3mw+0w/+exYj3Wsush7uFssX18av78G+ehKPIVDXptOCP/N7W\n'
      + '8iKVNeQ2QGTnu2fzWsGUSvMGyM7yqT+h1ILaT//yQS8er511aHMLc142bD4D9VSy\n'
      + 'DgactwPDTShK/PXqhvNey9v/sKXm4XatZvwcc8KYlW4=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-south-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ap-south-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-04T17:13:04Z/2024-08-22T17:08:50Z
       *   F = D6:AD:45:A9:54:36:E4:BA:9C:B7:9B:06:8C:0C:CD:CC:1E:81:B5:00
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECDCCAvCgAwIBAgICVIYwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MDQxNzEz\n'
      + 'MDRaFw0yNDA4MjIxNzA4NTBaMIGVMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEmMCQGA1UEAwwdQW1h\n'
      + 'em9uIFJEUyBhcC1zb3V0aC0xIDIwMTkgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB\n'
      + 'DwAwggEKAoIBAQDUYOz1hGL42yUCrcsMSOoU8AeD/3KgZ4q7gP+vAz1WnY9K/kim\n'
      + 'eWN/2Qqzlo3+mxSFQFyD4MyV3+CnCPnBl9Sh1G/F6kThNiJ7dEWSWBQGAB6HMDbC\n'
      + 'BaAsmUc1UIz8sLTL3fO+S9wYhA63Wun0Fbm/Rn2yk/4WnJAaMZcEtYf6e0KNa0LM\n'
      + 'p/kN/70/8cD3iz3dDR8zOZFpHoCtf0ek80QqTich0A9n3JLxR6g6tpwoYviVg89e\n'
      + 'qCjQ4axxOkWWeusLeTJCcY6CkVyFvDAKvcUl1ytM5AiaUkXblE7zDFXRM4qMMRdt\n'
      + 'lPm8d3pFxh0fRYk8bIKnpmtOpz3RIctDrZZxAgMBAAGjZjBkMA4GA1UdDwEB/wQE\n'
      + 'AwIBBjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBT99wKJftD3jb4sHoHG\n'
      + 'i3uGlH6W6TAfBgNVHSMEGDAWgBRzX2DYvMsDmPQrFzQuNlqmYP+8HzANBgkqhkiG\n'
      + '9w0BAQsFAAOCAQEAZ17hhr3dII3hUfuHQ1hPWGrpJOX/G9dLzkprEIcCidkmRYl+\n'
      + 'hu1Pe3caRMh/17+qsoEErmnVq5jNY9X1GZL04IZH8YbHc7iRHw3HcWAdhN8633+K\n'
      + 'jYEB2LbJ3vluCGnCejq9djDb6alOugdLMJzxOkHDhMZ6/gYbECOot+ph1tQuZXzD\n'
      + 'tZ7prRsrcuPBChHlPjmGy8M9z8u+kF196iNSUGC4lM8vLkHM7ycc1/ZOwRq9aaTe\n'
      + 'iOghbQQyAEe03MWCyDGtSmDfr0qEk+CHN+6hPiaL8qKt4s+V9P7DeK4iW08ny8Ox\n'
      + 'AVS7u0OK/5+jKMAMrKwpYrBydOjTUTHScocyNw==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-southeast-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ap-southeast-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-13T20:11:42Z/2024-08-22T17:08:50Z
       *   F = 0D:20:FB:91:DE:BE:D2:CF:F3:F8:F8:43:AF:68:C6:03:76:F3:DD:B8
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEDDCCAvSgAwIBAgICY4kwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTMyMDEx\n'
      + 'NDJaFw0yNDA4MjIxNzA4NTBaMIGZMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEqMCgGA1UEAwwhQW1h\n'
      + 'em9uIFJEUyBhcC1zb3V0aGVhc3QtMSAyMDE5IENBMIIBIjANBgkqhkiG9w0BAQEF\n'
      + 'AAOCAQ8AMIIBCgKCAQEAr5u9OuLL/OF/fBNUX2kINJLzFl4DnmrhnLuSeSnBPgbb\n'
      + 'qddjf5EFFJBfv7IYiIWEFPDbDG5hoBwgMup5bZDbas+ZTJTotnnxVJTQ6wlhTmns\n'
      + 'eHECcg2pqGIKGrxZfbQhlj08/4nNAPvyYCTS0bEcmQ1emuDPyvJBYDDLDU6AbCB5\n'
      + '6Z7YKFQPTiCBblvvNzchjLWF9IpkqiTsPHiEt21sAdABxj9ityStV3ja/W9BfgxH\n'
      + 'wzABSTAQT6FbDwmQMo7dcFOPRX+hewQSic2Rn1XYjmNYzgEHisdUsH7eeXREAcTw\n'
      + '61TRvaLH8AiOWBnTEJXPAe6wYfrcSd1pD0MXpoB62wIDAQABo2YwZDAOBgNVHQ8B\n'
      + 'Af8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQUytwMiomQOgX5\n'
      + 'Ichd+2lDWRUhkikwHwYDVR0jBBgwFoAUc19g2LzLA5j0Kxc0LjZapmD/vB8wDQYJ\n'
      + 'KoZIhvcNAQELBQADggEBACf6lRDpfCD7BFRqiWM45hqIzffIaysmVfr+Jr+fBTjP\n'
      + 'uYe/ba1omSrNGG23bOcT9LJ8hkQJ9d+FxUwYyICQNWOy6ejicm4z0C3VhphbTPqj\n'
      + 'yjpt9nG56IAcV8BcRJh4o/2IfLNzC/dVuYJV8wj7XzwlvjysenwdrJCoLadkTr1h\n'
      + 'eIdG6Le07sB9IxrGJL9e04afk37h7c8ESGSE4E+oS4JQEi3ATq8ne1B9DQ9SasXi\n'
      + 'IRmhNAaISDzOPdyLXi9N9V9Lwe/DHcja7hgLGYx3UqfjhLhOKwp8HtoZORixAmOI\n'
      + 'HfILgNmwyugAbuZoCazSKKBhQ0wgO0WZ66ZKTMG8Oho=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ap-southeast-2 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ap-southeast-2 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-16T19:53:47Z/2024-08-22T17:08:50Z
       *   F = D5:D4:51:83:D9:A3:AC:47:B0:0A:5A:77:D8:A0:79:A9:6A:3F:6D:96
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEDDCCAvSgAwIBAgICEkYwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTYxOTUz\n'
      + 'NDdaFw0yNDA4MjIxNzA4NTBaMIGZMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEqMCgGA1UEAwwhQW1h\n'
      + 'em9uIFJEUyBhcC1zb3V0aGVhc3QtMiAyMDE5IENBMIIBIjANBgkqhkiG9w0BAQEF\n'
      + 'AAOCAQ8AMIIBCgKCAQEAufodI2Flker8q7PXZG0P0vmFSlhQDw907A6eJuF/WeMo\n'
      + 'GHnll3b4S6nC3oRS3nGeRMHbyU2KKXDwXNb3Mheu+ox+n5eb/BJ17eoj9HbQR1cd\n'
      + 'gEkIciiAltf8gpMMQH4anP7TD+HNFlZnP7ii3geEJB2GGXSxgSWvUzH4etL67Zmn\n'
      + 'TpGDWQMB0T8lK2ziLCMF4XAC/8xDELN/buHCNuhDpxpPebhct0T+f6Arzsiswt2j\n'
      + '7OeNeLLZwIZvVwAKF7zUFjC6m7/VmTQC8nidVY559D6l0UhhU0Co/txgq3HVsMOH\n'
      + 'PbxmQUwJEKAzQXoIi+4uZzHFZrvov/nDTNJUhC6DqwIDAQABo2YwZDAOBgNVHQ8B\n'
      + 'Af8EBAMCAQYwEgYDVR0TAQH/BAgwBgEB/wIBADAdBgNVHQ4EFgQUwaZpaCme+EiV\n'
      + 'M5gcjeHZSTgOn4owHwYDVR0jBBgwFoAUc19g2LzLA5j0Kxc0LjZapmD/vB8wDQYJ\n'
      + 'KoZIhvcNAQELBQADggEBAAR6a2meCZuXO2TF9bGqKGtZmaah4pH2ETcEVUjkvXVz\n'
      + 'sl+ZKbYjrun+VkcMGGKLUjS812e7eDF726ptoku9/PZZIxlJB0isC/0OyixI8N4M\n'
      + 'NsEyvp52XN9QundTjkl362bomPnHAApeU0mRbMDRR2JdT70u6yAzGLGsUwMkoNnw\n'
      + '1VR4XKhXHYGWo7KMvFrZ1KcjWhubxLHxZWXRulPVtGmyWg/MvE6KF+2XMLhojhUL\n'
      + '+9jB3Fpn53s6KMx5tVq1x8PukHmowcZuAF8k+W4gk8Y68wIwynrdZrKRyRv6CVtR\n'
      + 'FZ8DeJgoNZT3y/GT254VqMxxfuy2Ccb/RInd16tEvVk=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS ca-central-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS ca-central-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-10T20:52:25Z/2024-08-22T17:08:50Z
       *   F = A1:03:46:F2:BB:29:BF:4F:EC:04:7E:82:9A:A6:C0:11:4D:AB:82:25
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECjCCAvKgAwIBAgICEzUwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTAyMDUy\n'
      + 'MjVaFw0yNDA4MjIxNzA4NTBaMIGXMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEoMCYGA1UEAwwfQW1h\n'
      + 'em9uIFJEUyBjYS1jZW50cmFsLTEgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQAD\n'
      + 'ggEPADCCAQoCggEBAOxHqdcPSA2uBjsCP4DLSlqSoPuQ/X1kkJLusVRKiQE2zayB\n'
      + 'viuCBt4VB9Qsh2rW3iYGM+usDjltGnI1iUWA5KHcvHszSMkWAOYWLiMNKTlg6LCp\n'
      + 'XnE89tvj5dIH6U8WlDvXLdjB/h30gW9JEX7S8supsBSci2GxEzb5mRdKaDuuF/0O\n'
      + 'qvz4YE04pua3iZ9QwmMFuTAOYzD1M72aOpj+7Ac+YLMM61qOtU+AU6MndnQkKoQi\n'
      + 'qmUN2A9IFaqHFzRlSdXwKCKUA4otzmz+/N3vFwjb5F4DSsbsrMfjeHMo6o/nb6Nh\n'
      + 'YDb0VJxxPee6TxSuN7CQJ2FxMlFUezcoXqwqXD0CAwEAAaNmMGQwDgYDVR0PAQH/\n'
      + 'BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFDGGpon9WfIpsggE\n'
      + 'CxHq8hZ7E2ESMB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqG\n'
      + 'SIb3DQEBCwUAA4IBAQAvpeQYEGZvoTVLgV9rd2+StPYykMsmFjWQcyn3dBTZRXC2\n'
      + 'lKq7QhQczMAOhEaaN29ZprjQzsA2X/UauKzLR2Uyqc2qOeO9/YOl0H3qauo8C/W9\n'
      + 'r8xqPbOCDLEXlOQ19fidXyyEPHEq5WFp8j+fTh+s8WOx2M7IuC0ANEetIZURYhSp\n'
      + 'xl9XOPRCJxOhj7JdelhpweX0BJDNHeUFi0ClnFOws8oKQ7sQEv66d5ddxqqZ3NVv\n'
      + 'RbCvCtEutQMOUMIuaygDlMn1anSM8N7Wndx8G6+Uy67AnhjGx7jw/0YPPxopEj6x\n'
      + 'JXP8j0sJbcT9K/9/fPVLNT25RvQ/93T2+IQL4Ca2\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-central-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS eu-central-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-11T19:36:20Z/2024-08-22T17:08:50Z
       *   F = 53:46:18:4A:42:65:A2:8C:5F:5B:0A:AD:E2:2C:80:E5:E6:8A:6D:2F
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECjCCAvKgAwIBAgICV2YwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTExOTM2\n'
      + 'MjBaFw0yNDA4MjIxNzA4NTBaMIGXMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEoMCYGA1UEAwwfQW1h\n'
      + 'em9uIFJEUyBldS1jZW50cmFsLTEgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQAD\n'
      + 'ggEPADCCAQoCggEBAMEx54X2pHVv86APA0RWqxxRNmdkhAyp2R1cFWumKQRofoFv\n'
      + 'n+SPXdkpIINpMuEIGJANozdiEz7SPsrAf8WHyD93j/ZxrdQftRcIGH41xasetKGl\n'
      + 'I67uans8d+pgJgBKGb/Z+B5m+UsIuEVekpvgpwKtmmaLFC/NCGuSsJoFsRqoa6Gh\n'
      + 'm34W6yJoY87UatddCqLY4IIXaBFsgK9Q/wYzYLbnWM6ZZvhJ52VMtdhcdzeTHNW0\n'
      + '5LGuXJOF7Ahb4JkEhoo6TS2c0NxB4l4MBfBPgti+O7WjR3FfZHpt18A6Zkq6A2u6\n'
      + 'D/oTSL6c9/3sAaFTFgMyL3wHb2YlW0BPiljZIqECAwEAAaNmMGQwDgYDVR0PAQH/\n'
      + 'BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFOcAToAc6skWffJa\n'
      + 'TnreaswAfrbcMB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqG\n'
      + 'SIb3DQEBCwUAA4IBAQA1d0Whc1QtspK496mFWfFEQNegLh0a9GWYlJm+Htcj5Nxt\n'
      + 'DAIGXb+8xrtOZFHmYP7VLCT5Zd2C+XytqseK/+s07iAr0/EPF+O2qcyQWMN5KhgE\n'
      + 'cXw2SwuP9FPV3i+YAm11PBVeenrmzuk9NrdHQ7TxU4v7VGhcsd2C++0EisrmquWH\n'
      + 'mgIfmVDGxphwoES52cY6t3fbnXmTkvENvR+h3rj+fUiSz0aSo+XZUGHPgvuEKM/W\n'
      + 'CBD9Smc9CBoBgvy7BgHRgRUmwtABZHFUIEjHI5rIr7ZvYn+6A0O6sogRfvVYtWFc\n'
      + 'qpyrW1YX8mD0VlJ8fGKM3G+aCOsiiPKDV/Uafrm+\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-north-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS eu-north-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-12T18:19:44Z/2024-08-22T17:08:50Z
       *   F = D0:CA:9C:6E:47:4C:4F:DB:85:28:03:4A:60:AC:14:E0:E6:DF:D4:42
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECDCCAvCgAwIBAgICGAcwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTIxODE5\n'
      + 'NDRaFw0yNDA4MjIxNzA4NTBaMIGVMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzEmMCQGA1UEAwwdQW1h\n'
      + 'em9uIFJEUyBldS1ub3J0aC0xIDIwMTkgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB\n'
      + 'DwAwggEKAoIBAQCiIYnhe4UNBbdBb/nQxl5giM0XoVHWNrYV5nB0YukA98+TPn9v\n'
      + 'Aoj1RGYmtryjhrf01Kuv8SWO+Eom95L3zquoTFcE2gmxCfk7bp6qJJ3eHOJB+QUO\n'
      + 'XsNRh76fwDzEF1yTeZWH49oeL2xO13EAx4PbZuZpZBttBM5zAxgZkqu4uWQczFEs\n'
      + 'JXfla7z2fvWmGcTagX10O5C18XaFroV0ubvSyIi75ue9ykg/nlFAeB7O0Wxae88e\n'
      + 'uhiBEFAuLYdqWnsg3459NfV8Yi1GnaitTym6VI3tHKIFiUvkSiy0DAlAGV2iiyJE\n'
      + 'q+DsVEO4/hSINJEtII4TMtysOsYPpINqeEzRAgMBAAGjZjBkMA4GA1UdDwEB/wQE\n'
      + 'AwIBBjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBRR0UpnbQyjnHChgmOc\n'
      + 'hnlc0PogzTAfBgNVHSMEGDAWgBRzX2DYvMsDmPQrFzQuNlqmYP+8HzANBgkqhkiG\n'
      + '9w0BAQsFAAOCAQEAKJD4xVzSf4zSGTBJrmamo86jl1NHQxXUApAZuBZEc8tqC6TI\n'
      + 'T5CeoSr9CMuVC8grYyBjXblC4OsM5NMvmsrXl/u5C9dEwtBFjo8mm53rOOIm1fxl\n'
      + 'I1oYB/9mtO9ANWjkykuLzWeBlqDT/i7ckaKwalhLODsRDO73vRhYNjsIUGloNsKe\n'
      + 'pxw3dzHwAZx4upSdEVG4RGCZ1D0LJ4Gw40OfD69hfkDfRVVxKGrbEzqxXRvovmDc\n'
      + 'tKLdYZO/6REoca36v4BlgIs1CbUXJGLSXUwtg7YXGLSVBJ/U0+22iGJmBSNcoyUN\n'
      + 'cjPFD9JQEhDDIYYKSGzIYpvslvGc4T5ISXFiuQ==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-west-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS eu-west-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-11T17:31:48Z/2024-08-22T17:08:50Z
       *   F = 2D:1A:A6:3E:0D:EB:D6:26:03:3E:A1:8A:0A:DF:14:80:78:EC:B6:63
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICYpgwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTExNzMx\n'
      + 'NDhaFw0yNDA4MjIxNzA4NTBaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1h\n'
      + 'em9uIFJEUyBldS13ZXN0LTEgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBAMk3YdSZ64iAYp6MyyKtYJtNzv7zFSnnNf6vv0FB4VnfITTMmOyZ\n'
      + 'LXqKAT2ahZ00hXi34ewqJElgU6eUZT/QlzdIu359TEZyLVPwURflL6SWgdG01Q5X\n'
      + 'O++7fSGcBRyIeuQWs9FJNIIqK8daF6qw0Rl5TXfu7P9dBc3zkgDXZm2DHmxGDD69\n'
      + '7liQUiXzoE1q2Z9cA8+jirDioJxN9av8hQt12pskLQumhlArsMIhjhHRgF03HOh5\n'
      + 'tvi+RCfihVOxELyIRTRpTNiIwAqfZxxTWFTgfn+gijTmd0/1DseAe82aYic8JbuS\n'
      + 'EMbrDduAWsqrnJ4GPzxHKLXX0JasCUcWyMECAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFPLtsq1NrwJXO13C9eHt\n'
      + 'sLY11AGwMB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQAnWBKj5xV1A1mYd0kIgDdkjCwQkiKF5bjIbGkT3YEFFbXoJlSP\n'
      + '0lZZ/hDaOHI8wbLT44SzOvPEEmWF9EE7SJzkvSdQrUAWR9FwDLaU427ALI3ngNHy\n'
      + 'lGJ2hse1fvSRNbmg8Sc9GBv8oqNIBPVuw+AJzHTacZ1OkyLZrz1c1QvwvwN2a+Jd\n'
      + 'vH0V0YIhv66llKcYDMUQJAQi4+8nbRxXWv6Gq3pvrFoorzsnkr42V3JpbhnYiK+9\n'
      + 'nRKd4uWl62KRZjGkfMbmsqZpj2fdSWMY1UGyN1k+kDmCSWYdrTRDP0xjtIocwg+A\n'
      + 'J116n4hV/5mbA0BaPiS2krtv17YAeHABZcvz\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-west-2 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS eu-west-2 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-12T21:32:32Z/2024-08-22T17:08:50Z
       *   F = 60:65:44:F4:74:6E:2E:29:50:19:38:7C:4B:BE:18:B9:5B:D4:CD:23
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICZIEwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTIyMTMy\n'
      + 'MzJaFw0yNDA4MjIxNzA4NTBaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1h\n'
      + 'em9uIFJEUyBldS13ZXN0LTIgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBALGiwqjiF7xIjT0Sx7zB3764K2T2a1DHnAxEOr+/EIftWKxWzT3u\n'
      + 'PFwS2eEZcnKqSdRQ+vRzonLBeNLO4z8aLjQnNbkizZMBuXGm4BqRm1Kgq3nlLDQn\n'
      + '7YqdijOq54SpShvR/8zsO4sgMDMmHIYAJJOJqBdaus2smRt0NobIKc0liy7759KB\n'
      + '6kmQ47Gg+kfIwxrQA5zlvPLeQImxSoPi9LdbRoKvu7Iot7SOa+jGhVBh3VdqndJX\n'
      + '7tm/saj4NE375csmMETFLAOXjat7zViMRwVorX4V6AzEg1vkzxXpA9N7qywWIT5Y\n'
      + 'fYaq5M8i6vvLg0CzrH9fHORtnkdjdu1y+0MCAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFFOhOx1yt3Z7mvGB9jBv\n'
      + '2ymdZwiOMB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQBehqY36UGDvPVU9+vtaYGr38dBbp+LzkjZzHwKT1XJSSUc2wqM\n'
      + 'hnCIQKilonrTIvP1vmkQi8qHPvDRtBZKqvz/AErW/ZwQdZzqYNFd+BmOXaeZWV0Q\n'
      + 'oHtDzXmcwtP8aUQpxN0e1xkWb1E80qoy+0uuRqb/50b/R4Q5qqSfJhkn6z8nwB10\n'
      + '7RjLtJPrK8igxdpr3tGUzfAOyiPrIDncY7UJaL84GFp7WWAkH0WG3H8Y8DRcRXOU\n'
      + 'mqDxDLUP3rNuow3jnGxiUY+gGX5OqaZg4f4P6QzOSmeQYs6nLpH0PiN00+oS1BbD\n'
      + 'bpWdZEttILPI+vAYkU4QuBKKDjJL6HbSd+cn\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS eu-west-3 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS eu-west-3 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-18T17:03:15Z/2024-08-22T17:08:50Z
       *   F = 6F:79:56:B0:74:9C:C6:3E:3B:50:26:C8:51:55:08:F0:BB:7E:32:04
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICJDQwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTgxNzAz\n'
      + 'MTVaFw0yNDA4MjIxNzA4NTBaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1h\n'
      + 'em9uIFJEUyBldS13ZXN0LTMgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBAL9bL7KE0n02DLVtlZ2PL+g/BuHpMYFq2JnE2RgompGurDIZdjmh\n'
      + '1pxfL3nT+QIVMubuAOy8InRfkRxfpxyjKYdfLJTPJG+jDVL+wDcPpACFVqoV7Prg\n'
      + 'pVYEV0lc5aoYw4bSeYFhdzgim6F8iyjoPnObjll9mo4XsHzSoqJLCd0QC+VG9Fw2\n'
      + 'q+GDRZrLRmVM2oNGDRbGpGIFg77aRxRapFZa8SnUgs2AqzuzKiprVH5i0S0M6dWr\n'
      + 'i+kk5epmTtkiDHceX+dP/0R1NcnkCPoQ9TglyXyPdUdTPPRfKCq12dftqll+u4mV\n'
      + 'ARdN6WFjovxax8EAP2OAUTi1afY+1JFMj+sCAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFLfhrbrO5exkCVgxW0x3\n'
      + 'Y2mAi8lNMB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQAigQ5VBNGyw+OZFXwxeJEAUYaXVoP/qrhTOJ6mCE2DXUVEoJeV\n'
      + 'SxScy/TlFA9tJXqmit8JH8VQ/xDL4ubBfeMFAIAo4WzNWDVoeVMqphVEcDWBHsI1\n'
      + 'AETWzfsapRS9yQekOMmxg63d/nV8xewIl8aNVTHdHYXMqhhik47VrmaVEok1UQb3\n'
      + 'O971RadLXIEbVd9tjY5bMEHm89JsZDnDEw1hQXBb67Elu64OOxoKaHBgUH8AZn/2\n'
      + 'zFsL1ynNUjOhCSAA15pgd1vjwc0YsBbAEBPcHBWYBEyME6NLNarjOzBl4FMtATSF\n'
      + 'wWCKRGkvqN8oxYhwR2jf2rR5Mu4DWkK5Q8Ep\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS me-south-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS me-south-1 Root CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-05-10T21:48:27Z/2024-05-08T21:48:27Z
       *   F = 8A:69:D7:00:FB:5D:62:9C:B0:D1:75:6F:B7:B6:38:AA:76:C4:BD:1F
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEEjCCAvqgAwIBAgIJANew34ehz5l8MA0GCSqGSIb3DQEBCwUAMIGVMQswCQYD\n'
      + 'VQQGEwJVUzEQMA4GA1UEBwwHU2VhdHRsZTETMBEGA1UECAwKV2FzaGluZ3RvbjEi\n'
      + 'MCAGA1UECgwZQW1hem9uIFdlYiBTZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1h\n'
      + 'em9uIFJEUzEmMCQGA1UEAwwdQW1hem9uIFJEUyBtZS1zb3V0aC0xIFJvb3QgQ0Ew\n'
      + 'HhcNMTkwNTEwMjE0ODI3WhcNMjQwNTA4MjE0ODI3WjCBlTELMAkGA1UEBhMCVVMx\n'
      + 'EDAOBgNVBAcMB1NlYXR0bGUxEzARBgNVBAgMCldhc2hpbmd0b24xIjAgBgNVBAoM\n'
      + 'GUFtYXpvbiBXZWIgU2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMx\n'
      + 'JjAkBgNVBAMMHUFtYXpvbiBSRFMgbWUtc291dGgtMSBSb290IENBMIIBIjANBgkq\n'
      + 'hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAp7BYV88MukcY+rq0r79+C8UzkT30fEfT\n'
      + 'aPXbx1d6M7uheGN4FMaoYmL+JE1NZPaMRIPTHhFtLSdPccInvenRDIatcXX+jgOk\n'
      + 'UA6lnHQ98pwN0pfDUyz/Vph4jBR9LcVkBbe0zdoKKp+HGbMPRU0N2yNrog9gM5O8\n'
      + 'gkU/3O2csJ/OFQNnj4c2NQloGMUpEmedwJMOyQQfcUyt9CvZDfIPNnheUS29jGSw\n'
      + 'ERpJe/AENu8Pxyc72jaXQuD+FEi2Ck6lBkSlWYQFhTottAeGvVFNCzKszCntrtqd\n'
      + 'rdYUwurYsLTXDHv9nW2hfDUQa0mhXf9gNDOBIVAZugR9NqNRNyYLHQIDAQABo2Mw\n'
      + 'YTAOBgNVHQ8BAf8EBAMCAQYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQU54cf\n'
      + 'DjgwBx4ycBH8+/r8WXdaiqYwHwYDVR0jBBgwFoAU54cfDjgwBx4ycBH8+/r8WXda\n'
      + 'iqYwDQYJKoZIhvcNAQELBQADggEBAIIMTSPx/dR7jlcxggr+O6OyY49Rlap2laKA\n'
      + 'eC/XI4ySP3vQkIFlP822U9Kh8a9s46eR0uiwV4AGLabcu0iKYfXjPkIprVCqeXV7\n'
      + 'ny9oDtrbflyj7NcGdZLvuzSwgl9SYTJp7PVCZtZutsPYlbJrBPHwFABvAkMvRtDB\n'
      + 'hitIg4AESDGPoCl94sYHpfDfjpUDMSrAMDUyO6DyBdZH5ryRMAs3lGtsmkkNUrso\n'
      + 'aTW6R05681Z0mvkRdb+cdXtKOSuDZPoe2wJJIaz3IlNQNSrB5TImMYgmt6iAsFhv\n'
      + '3vfTSTKrZDNTJn4ybG6pq1zWExoXsktZPylJly6R3RBwV6nwqBM=\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS sa-east-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS sa-east-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-05T18:46:29Z/2024-08-22T17:08:50Z
       *   F = 8C:34:0F:AA:FB:10:80:9C:05:CE:D7:BF:0B:12:4D:07:42:39:74:7A
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICQ2QwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MDUxODQ2\n'
      + 'MjlaFw0yNDA4MjIxNzA4NTBaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1h\n'
      + 'em9uIFJEUyBzYS1lYXN0LTEgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBAMMvR+ReRnOzqJzoaPipNTt1Z2VA968jlN1+SYKUrYM3No+Vpz0H\n'
      + 'M6Tn0oYB66ByVsXiGc28ulsqX1HbHsxqDPwvQTKvO7SrmDokoAkjJgLocOLUAeld\n'
      + '5AwvUjxGRP6yY90NV7X786MpnYb2Il9DIIaV9HjCmPt+rjy2CZjS0UjPjCKNfB8J\n'
      + 'bFjgW6GGscjeyGb/zFwcom5p4j0rLydbNaOr9wOyQrtt3ZQWLYGY9Zees/b8pmcc\n'
      + 'Jt+7jstZ2UMV32OO/kIsJ4rMUn2r/uxccPwAc1IDeRSSxOrnFKhW3Cu69iB3bHp7\n'
      + 'JbawY12g7zshE4I14sHjv3QoXASoXjx4xgMCAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFI1Fc/Ql2jx+oJPgBVYq\n'
      + 'ccgP0pQ8MB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQB4VVVabVp70myuYuZ3vltQIWqSUMhkaTzehMgGcHjMf9iLoZ/I\n'
      + '93KiFUSGnek5cRePyS9wcpp0fcBT3FvkjpUdCjVtdttJgZFhBxgTd8y26ImdDDMR\n'
      + '4+BUuhI5msvjL08f+Vkkpu1GQcGmyFVPFOy/UY8iefu+QyUuiBUnUuEDd49Hw0Fn\n'
      + '/kIPII6Vj82a2mWV/Q8e+rgN8dIRksRjKI03DEoP8lhPlsOkhdwU6Uz9Vu6NOB2Q\n'
      + 'Ls1kbcxAc7cFSyRVJEhh12Sz9d0q/CQSTFsVJKOjSNQBQfVnLz1GwO/IieUEAr4C\n'
      + 'jkTntH0r1LX5b/GwN4R887LvjAEdTbg1his7\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-east-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS us-east-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-19T18:16:53Z/2024-08-22T17:08:50Z
       *   F = F0:ED:82:3E:D1:44:47:BA:B5:57:FD:F3:E4:92:74:66:98:8C:1C:78
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICJVUwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTkxODE2\n'
      + 'NTNaFw0yNDA4MjIxNzA4NTBaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1h\n'
      + 'em9uIFJEUyB1cy1lYXN0LTEgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBAM3i/k2u6cqbMdcISGRvh+m+L0yaSIoOXjtpNEoIftAipTUYoMhL\n'
      + 'InXGlQBVA4shkekxp1N7HXe1Y/iMaPEyb3n+16pf3vdjKl7kaSkIhjdUz3oVUEYt\n'
      + 'i8Z/XeJJ9H2aEGuiZh3kHixQcZczn8cg3dA9aeeyLSEnTkl/npzLf//669Ammyhs\n'
      + 'XcAo58yvT0D4E0D/EEHf2N7HRX7j/TlyWvw/39SW0usiCrHPKDLxByLojxLdHzso\n'
      + 'QIp/S04m+eWn6rmD+uUiRteN1hI5ncQiA3wo4G37mHnUEKo6TtTUh+sd/ku6a8HK\n'
      + 'glMBcgqudDI90s1OpuIAWmuWpY//8xEG2YECAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFPqhoWZcrVY9mU7tuemR\n'
      + 'RBnQIj1jMB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQB6zOLZ+YINEs72heHIWlPZ8c6WY8MDU+Be5w1M+BK2kpcVhCUK\n'
      + 'PJO4nMXpgamEX8DIiaO7emsunwJzMSvavSPRnxXXTKIc0i/g1EbiDjnYX9d85DkC\n'
      + 'E1LaAUCmCZBVi9fIe0H2r9whIh4uLWZA41oMnJx/MOmo3XyMfQoWcqaSFlMqfZM4\n'
      + '0rNoB/tdHLNuV4eIdaw2mlHxdWDtF4oH+HFm+2cVBUVC1jXKrFv/euRVtsTT+A6i\n'
      + 'h2XBHKxQ1Y4HgAn0jACP2QSPEmuoQEIa57bEKEcZsBR8SDY6ZdTd2HLRIApcCOSF\n'
      + 'MRM8CKLeF658I0XgF8D5EsYoKPsA+74Z+jDH\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-east-2 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS us-east-2 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-13T17:06:41Z/2024-08-22T17:08:50Z
       *   F = E9:FE:27:2A:A0:0F:CE:DF:AD:51:03:A6:94:F7:1F:6F:BD:1E:28:D3
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECDCCAvCgAwIBAgIDAIVCMA0GCSqGSIb3DQEBCwUAMIGPMQswCQYDVQQGEwJV\n'
      + 'UzEQMA4GA1UEBwwHU2VhdHRsZTETMBEGA1UECAwKV2FzaGluZ3RvbjEiMCAGA1UE\n'
      + 'CgwZQW1hem9uIFdlYiBTZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJE\n'
      + 'UzEgMB4GA1UEAwwXQW1hem9uIFJEUyBSb290IDIwMTkgQ0EwHhcNMTkwOTEzMTcw\n'
      + 'NjQxWhcNMjQwODIyMTcwODUwWjCBlDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCldh\n'
      + 'c2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoMGUFtYXpvbiBXZWIg\n'
      + 'U2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMxJTAjBgNVBAMMHEFt\n'
      + 'YXpvbiBSRFMgdXMtZWFzdC0yIDIwMTkgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB\n'
      + 'DwAwggEKAoIBAQDE+T2xYjUbxOp+pv+gRA3FO24+1zCWgXTDF1DHrh1lsPg5k7ht\n'
      + '2KPYzNc+Vg4E+jgPiW0BQnA6jStX5EqVh8BU60zELlxMNvpg4KumniMCZ3krtMUC\n'
      + 'au1NF9rM7HBh+O+DYMBLK5eSIVt6lZosOb7bCi3V6wMLA8YqWSWqabkxwN4w0vXI\n'
      + '8lu5uXXFRemHnlNf+yA/4YtN4uaAyd0ami9+klwdkZfkrDOaiy59haOeBGL8EB/c\n'
      + 'dbJJlguHH5CpCscs3RKtOOjEonXnKXldxarFdkMzi+aIIjQ8GyUOSAXHtQHb3gZ4\n'
      + 'nS6Ey0CMlwkB8vUObZU9fnjKJcL5QCQqOfwvAgMBAAGjZjBkMA4GA1UdDwEB/wQE\n'
      + 'AwIBBjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBQUPuRHohPxx4VjykmH\n'
      + '6usGrLL1ETAfBgNVHSMEGDAWgBRzX2DYvMsDmPQrFzQuNlqmYP+8HzANBgkqhkiG\n'
      + '9w0BAQsFAAOCAQEAUdR9Vb3y33Yj6X6KGtuthZ08SwjImVQPtknzpajNE5jOJAh8\n'
      + 'quvQnU9nlnMO85fVDU1Dz3lLHGJ/YG1pt1Cqq2QQ200JcWCvBRgdvH6MjHoDQpqZ\n'
      + 'HvQ3vLgOGqCLNQKFuet9BdpsHzsctKvCVaeBqbGpeCtt3Hh/26tgx0rorPLw90A2\n'
      + 'V8QSkZJjlcKkLa58N5CMM8Xz8KLWg3MZeT4DmlUXVCukqK2RGuP2L+aME8dOxqNv\n'
      + 'OnOz1zrL5mR2iJoDpk8+VE/eBDmJX40IJk6jBjWoxAO/RXq+vBozuF5YHN1ujE92\n'
      + 'tO8HItgTp37XT8bJBAiAnt5mxw+NLSqtxk2QdQ==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-west-1 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS us-west-1 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-06T17:40:21Z/2024-08-22T17:08:50Z
       *   F = 1C:9F:DF:84:E6:13:32:F3:91:12:2D:0D:A5:9A:16:5D:AC:DC:E8:93
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIECDCCAvCgAwIBAgIDAIkHMA0GCSqGSIb3DQEBCwUAMIGPMQswCQYDVQQGEwJV\n'
      + 'UzEQMA4GA1UEBwwHU2VhdHRsZTETMBEGA1UECAwKV2FzaGluZ3RvbjEiMCAGA1UE\n'
      + 'CgwZQW1hem9uIFdlYiBTZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJE\n'
      + 'UzEgMB4GA1UEAwwXQW1hem9uIFJEUyBSb290IDIwMTkgQ0EwHhcNMTkwOTA2MTc0\n'
      + 'MDIxWhcNMjQwODIyMTcwODUwWjCBlDELMAkGA1UEBhMCVVMxEzARBgNVBAgMCldh\n'
      + 'c2hpbmd0b24xEDAOBgNVBAcMB1NlYXR0bGUxIjAgBgNVBAoMGUFtYXpvbiBXZWIg\n'
      + 'U2VydmljZXMsIEluYy4xEzARBgNVBAsMCkFtYXpvbiBSRFMxJTAjBgNVBAMMHEFt\n'
      + 'YXpvbiBSRFMgdXMtd2VzdC0xIDIwMTkgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IB\n'
      + 'DwAwggEKAoIBAQDD2yzbbAl77OofTghDMEf624OvU0eS9O+lsdO0QlbfUfWa1Kd6\n'
      + '0WkgjkLZGfSRxEHMCnrv4UPBSK/Qwn6FTjkDLgemhqBtAnplN4VsoDL+BkRX4Wwq\n'
      + '/dSQJE2b+0hm9w9UMVGFDEq1TMotGGTD2B71eh9HEKzKhGzqiNeGsiX4VV+LJzdH\n'
      + 'uM23eGisNqmd4iJV0zcAZ+Gbh2zK6fqTOCvXtm7Idccv8vZZnyk1FiWl3NR4WAgK\n'
      + 'AkvWTIoFU3Mt7dIXKKClVmvssG8WHCkd3Xcb4FHy/G756UZcq67gMMTX/9fOFM/v\n'
      + 'l5C0+CHl33Yig1vIDZd+fXV1KZD84dEJfEvHAgMBAAGjZjBkMA4GA1UdDwEB/wQE\n'
      + 'AwIBBjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBR+ap20kO/6A7pPxo3+\n'
      + 'T3CfqZpQWjAfBgNVHSMEGDAWgBRzX2DYvMsDmPQrFzQuNlqmYP+8HzANBgkqhkiG\n'
      + '9w0BAQsFAAOCAQEAHCJky2tPjPttlDM/RIqExupBkNrnSYnOK4kr9xJ3sl8UF2DA\n'
      + 'PAnYsjXp3rfcjN/k/FVOhxwzi3cXJF/2Tjj39Bm/OEfYTOJDNYtBwB0VVH4ffa/6\n'
      + 'tZl87jaIkrxJcreeeHqYMnIxeN0b/kliyA+a5L2Yb0VPjt9INq34QDc1v74FNZ17\n'
      + '4z8nr1nzg4xsOWu0Dbjo966lm4nOYIGBRGOKEkHZRZ4mEiMgr3YLkv8gSmeitx57\n'
      + 'Z6dVemNtUic/LVo5Iqw4n3TBS0iF2C1Q1xT/s3h+0SXZlfOWttzSluDvoMv5PvCd\n'
      + 'pFjNn+aXLAALoihL1MJSsxydtsLjOBro5eK0Vw==\n'
      + '-----END CERTIFICATE-----\n',

      /**
       * Amazon RDS us-west-2 certificate CA 2019 to 2024
       *
       *   CN = Amazon RDS us-west-2 2019 CA
       *   OU = Amazon RDS
       *   O = Amazon Web Services, Inc.
       *   L = Seattle
       *   ST = Washington
       *   C = US
       *   P = 2019-09-16T18:21:15Z/2024-08-22T17:08:50Z
       *   F = C8:DE:1D:13:AD:35:9B:3D:EA:18:2A:DC:B4:79:6D:22:47:75:3C:4A
       */
      '-----BEGIN CERTIFICATE-----\n'
      + 'MIIEBzCCAu+gAwIBAgICUYkwDQYJKoZIhvcNAQELBQAwgY8xCzAJBgNVBAYTAlVT\n'
      + 'MRAwDgYDVQQHDAdTZWF0dGxlMRMwEQYDVQQIDApXYXNoaW5ndG9uMSIwIAYDVQQK\n'
      + 'DBlBbWF6b24gV2ViIFNlcnZpY2VzLCBJbmMuMRMwEQYDVQQLDApBbWF6b24gUkRT\n'
      + 'MSAwHgYDVQQDDBdBbWF6b24gUkRTIFJvb3QgMjAxOSBDQTAeFw0xOTA5MTYxODIx\n'
      + 'MTVaFw0yNDA4MjIxNzA4NTBaMIGUMQswCQYDVQQGEwJVUzETMBEGA1UECAwKV2Fz\n'
      + 'aGluZ3RvbjEQMA4GA1UEBwwHU2VhdHRsZTEiMCAGA1UECgwZQW1hem9uIFdlYiBT\n'
      + 'ZXJ2aWNlcywgSW5jLjETMBEGA1UECwwKQW1hem9uIFJEUzElMCMGA1UEAwwcQW1h\n'
      + 'em9uIFJEUyB1cy13ZXN0LTIgMjAxOSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEP\n'
      + 'ADCCAQoCggEBANCEZBZyu6yJQFZBJmSUZfSZd3Ui2gitczMKC4FLr0QzkbxY+cLa\n'
      + 'uVONIOrPt4Rwi+3h/UdnUg917xao3S53XDf1TDMFEYp4U8EFPXqCn/GXBIWlU86P\n'
      + 'PvBN+gzw3nS+aco7WXb+woTouvFVkk8FGU7J532llW8o/9ydQyDIMtdIkKTuMfho\n'
      + 'OiNHSaNc+QXQ32TgvM9A/6q7ksUoNXGCP8hDOkSZ/YOLiI5TcdLh/aWj00ziL5bj\n'
      + 'pvytiMZkilnc9dLY9QhRNr0vGqL0xjmWdoEXz9/OwjmCihHqJq+20MJPsvFm7D6a\n'
      + '2NKybR9U+ddrjb8/iyLOjURUZnj5O+2+OPcCAwEAAaNmMGQwDgYDVR0PAQH/BAQD\n'
      + 'AgEGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0OBBYEFEBxMBdv81xuzqcK5TVu\n'
      + 'pHj+Aor8MB8GA1UdIwQYMBaAFHNfYNi8ywOY9CsXNC42WqZg/7wfMA0GCSqGSIb3\n'
      + 'DQEBCwUAA4IBAQBZkfiVqGoJjBI37aTlLOSjLcjI75L5wBrwO39q+B4cwcmpj58P\n'
      + '3sivv+jhYfAGEbQnGRzjuFoyPzWnZ1DesRExX+wrmHsLLQbF2kVjLZhEJMHF9eB7\n'
      + 'GZlTPdTzHErcnuXkwA/OqyXMpj9aghcQFuhCNguEfnROY9sAoK2PTfnTz9NJHL+Q\n'
      + 'UpDLEJEUfc0GZMVWYhahc0x38ZnSY2SKacIPECQrTI0KpqZv/P+ijCEcMD9xmYEb\n'
      + 'jL4en+XKS1uJpw5fIU5Sj0MxhdGstH6S84iAE5J3GM3XHklGSFwwqPYvuTXvANH6\n'
      + 'uboynxRgSae59jIlAK6Jrr6GWMwQRbgcaAlW\n'
      + '-----END CERTIFICATE-----\n'
    ]
  };
  }(ssl_profiles));

  var urlParse        = require$$0$2.parse;
  var ClientConstants = client;
  var Charsets        = charsets;
  var SSLProfiles     = null;

  var ConnectionConfig_1 = ConnectionConfig$1;
  function ConnectionConfig$1(options) {
    if (typeof options === 'string') {
      options = ConnectionConfig$1.parseUrl(options);
    }

    this.host               = options.host || 'localhost';
    this.port               = options.port || 3306;
    this.localAddress       = options.localAddress;
    this.socketPath         = options.socketPath;
    this.user               = options.user || undefined;
    this.password           = options.password || undefined;
    this.database           = options.database;
    this.connectTimeout     = (options.connectTimeout === undefined)
      ? (10 * 1000)
      : options.connectTimeout;
    this.insecureAuth       = options.insecureAuth || false;
    this.supportBigNumbers  = options.supportBigNumbers || false;
    this.bigNumberStrings   = options.bigNumberStrings || false;
    this.dateStrings        = options.dateStrings || false;
    this.debug              = options.debug;
    this.trace              = options.trace !== false;
    this.stringifyObjects   = options.stringifyObjects || false;
    this.timezone           = options.timezone || 'local';
    this.flags              = options.flags || '';
    this.queryFormat        = options.queryFormat;
    this.pool               = options.pool || undefined;
    this.ssl                = (typeof options.ssl === 'string')
      ? ConnectionConfig$1.getSSLProfile(options.ssl)
      : (options.ssl || false);
    this.localInfile        = (options.localInfile === undefined)
      ? true
      : options.localInfile;
    this.multipleStatements = options.multipleStatements || false;
    this.typeCast           = (options.typeCast === undefined)
      ? true
      : options.typeCast;

    if (this.timezone[0] === ' ') {
      // "+" is a url encoded char for space so it
      // gets translated to space when giving a
      // connection string..
      this.timezone = '+' + this.timezone.substr(1);
    }

    if (this.ssl) {
      // Default rejectUnauthorized to true
      this.ssl.rejectUnauthorized = this.ssl.rejectUnauthorized !== false;
    }

    this.maxPacketSize = 0;
    this.charsetNumber = (options.charset)
      ? ConnectionConfig$1.getCharsetNumber(options.charset)
      : options.charsetNumber || Charsets.UTF8_GENERAL_CI;

    // Set the client flags
    var defaultFlags = ConnectionConfig$1.getDefaultFlags(options);
    this.clientFlags = ConnectionConfig$1.mergeFlags(defaultFlags, options.flags);
  }

  ConnectionConfig$1.mergeFlags = function mergeFlags(defaultFlags, userFlags) {
    var allFlags = ConnectionConfig$1.parseFlagList(defaultFlags);
    var newFlags = ConnectionConfig$1.parseFlagList(userFlags);

    // Merge the new flags
    for (var flag in newFlags) {
      if (allFlags[flag] !== false) {
        allFlags[flag] = newFlags[flag];
      }
    }

    // Build flags
    var flags = 0x0;
    for (var flag in allFlags) {
      if (allFlags[flag]) {
        // TODO: Throw here on some future release
        flags |= ClientConstants['CLIENT_' + flag] || 0x0;
      }
    }

    return flags;
  };

  ConnectionConfig$1.getCharsetNumber = function getCharsetNumber(charset) {
    var num = Charsets[charset.toUpperCase()];

    if (num === undefined) {
      throw new TypeError('Unknown charset \'' + charset + '\'');
    }

    return num;
  };

  ConnectionConfig$1.getDefaultFlags = function getDefaultFlags(options) {
    var defaultFlags = [
      '-COMPRESS',          // Compression protocol *NOT* supported
      '-CONNECT_ATTRS',     // Does *NOT* send connection attributes in Protocol::HandshakeResponse41
      '+CONNECT_WITH_DB',   // One can specify db on connect in Handshake Response Packet
      '+FOUND_ROWS',        // Send found rows instead of affected rows
      '+IGNORE_SIGPIPE',    // Don't issue SIGPIPE if network failures
      '+IGNORE_SPACE',      // Let the parser ignore spaces before '('
      '+LOCAL_FILES',       // Can use LOAD DATA LOCAL
      '+LONG_FLAG',         // Longer flags in Protocol::ColumnDefinition320
      '+LONG_PASSWORD',     // Use the improved version of Old Password Authentication
      '+MULTI_RESULTS',     // Can handle multiple resultsets for COM_QUERY
      '+ODBC',              // Special handling of ODBC behaviour
      '-PLUGIN_AUTH',       // Does *NOT* support auth plugins
      '+PROTOCOL_41',       // Uses the 4.1 protocol
      '+PS_MULTI_RESULTS',  // Can handle multiple resultsets for COM_STMT_EXECUTE
      '+RESERVED',          // Unused
      '+SECURE_CONNECTION', // Supports Authentication::Native41
      '+TRANSACTIONS'       // Expects status flags
    ];

    if (options && options.localInfile !== undefined && !options.localInfile) {
      // Disable LOCAL modifier for LOAD DATA INFILE
      defaultFlags.push('-LOCAL_FILES');
    }

    if (options && options.multipleStatements) {
      // May send multiple statements per COM_QUERY and COM_STMT_PREPARE
      defaultFlags.push('+MULTI_STATEMENTS');
    }

    return defaultFlags;
  };

  ConnectionConfig$1.getSSLProfile = function getSSLProfile(name) {
    if (!SSLProfiles) {
      SSLProfiles = ssl_profiles;
    }

    var ssl = SSLProfiles[name];

    if (ssl === undefined) {
      throw new TypeError('Unknown SSL profile \'' + name + '\'');
    }

    return ssl;
  };

  ConnectionConfig$1.parseFlagList = function parseFlagList(flagList) {
    var allFlags = Object.create(null);

    if (!flagList) {
      return allFlags;
    }

    var flags = !Array.isArray(flagList)
      ? String(flagList || '').toUpperCase().split(/\s*,+\s*/)
      : flagList;

    for (var i = 0; i < flags.length; i++) {
      var flag   = flags[i];
      var offset = 1;
      var state  = flag[0];

      if (state === undefined) {
        // TODO: throw here on some future release
        continue;
      }

      if (state !== '-' && state !== '+') {
        offset = 0;
        state  = '+';
      }

      allFlags[flag.substr(offset)] = state === '+';
    }

    return allFlags;
  };

  ConnectionConfig$1.parseUrl = function(url) {
    url = urlParse(url, true);

    var options = {
      host     : url.hostname,
      port     : url.port,
      database : url.pathname.substr(1)
    };

    if (url.auth) {
      var auth = url.auth.split(':');
      options.user     = auth.shift();
      options.password = auth.join(':');
    }

    if (url.query) {
      for (var key in url.query) {
        var value = url.query[key];

        try {
          // Try to parse this as a JSON expression first
          options[key] = JSON.parse(value);
        } catch (err) {
          // Otherwise assume it is a plain string
          options[key] = value;
        }
      }
    }

    return options;
  };

  var mysql          = require('../');
  var Connection$1     = require('./Connection');
  var EventEmitter$1   = require('events').EventEmitter;
  var Util$1           = require('util');
  var PoolConnection = require('./PoolConnection');

  module.exports = Pool$2;

  Util$1.inherits(Pool$2, EventEmitter$1);
  function Pool$2(options) {
    EventEmitter$1.call(this);
    this.config = options.config;
    this.config.connectionConfig.pool = this;

    this._acquiringConnections = [];
    this._allConnections       = [];
    this._freeConnections      = [];
    this._connectionQueue      = [];
    this._closed               = false;
  }

  Pool$2.prototype.getConnection = function (cb) {

    if (this._closed) {
      var err = new Error('Pool is closed.');
      err.code = 'POOL_CLOSED';
      browser$1.nextTick(function () {
        cb(err);
      });
      return;
    }

    var connection;
    var pool = this;

    if (this._freeConnections.length > 0) {
      connection = this._freeConnections.shift();
      this.acquireConnection(connection, cb);
      return;
    }

    if (this.config.connectionLimit === 0 || this._allConnections.length < this.config.connectionLimit) {
      connection = new PoolConnection(this, { config: this.config.newConnectionConfig() });

      this._acquiringConnections.push(connection);
      this._allConnections.push(connection);

      connection.connect({timeout: this.config.acquireTimeout}, function onConnect(err) {
        spliceConnection(pool._acquiringConnections, connection);

        if (pool._closed) {
          err = new Error('Pool is closed.');
          err.code = 'POOL_CLOSED';
        }

        if (err) {
          pool._purgeConnection(connection);
          cb(err);
          return;
        }

        pool.emit('connection', connection);
        pool.emit('acquire', connection);
        cb(null, connection);
      });
      return;
    }

    if (!this.config.waitForConnections) {
      browser$1.nextTick(function(){
        var err = new Error('No connections available.');
        err.code = 'POOL_CONNLIMIT';
        cb(err);
      });
      return;
    }

    this._enqueueCallback(cb);
  };

  Pool$2.prototype.acquireConnection = function acquireConnection(connection, cb) {
    if (connection._pool !== this) {
      throw new Error('Connection acquired from wrong pool.');
    }

    var changeUser = this._needsChangeUser(connection);
    var pool       = this;

    this._acquiringConnections.push(connection);

    function onOperationComplete(err) {
      spliceConnection(pool._acquiringConnections, connection);

      if (pool._closed) {
        err = new Error('Pool is closed.');
        err.code = 'POOL_CLOSED';
      }

      if (err) {
        pool._connectionQueue.unshift(cb);
        pool._purgeConnection(connection);
        return;
      }

      if (changeUser) {
        pool.emit('connection', connection);
      }

      pool.emit('acquire', connection);
      cb(null, connection);
    }

    if (changeUser) {
      // restore user back to pool configuration
      connection.config = this.config.newConnectionConfig();
      connection.changeUser({timeout: this.config.acquireTimeout}, onOperationComplete);
    } else {
      // ping connection
      connection.ping({timeout: this.config.acquireTimeout}, onOperationComplete);
    }
  };

  Pool$2.prototype.releaseConnection = function releaseConnection(connection) {

    if (this._acquiringConnections.indexOf(connection) !== -1) {
      // connection is being acquired
      return;
    }

    if (connection._pool) {
      if (connection._pool !== this) {
        throw new Error('Connection released to wrong pool');
      }

      if (this._freeConnections.indexOf(connection) !== -1) {
        // connection already in free connection pool
        // this won't catch all double-release cases
        throw new Error('Connection already released');
      } else {
        // add connection to end of free queue
        this._freeConnections.push(connection);
        this.emit('release', connection);
      }
    }

    if (this._closed) {
      // empty the connection queue
      this._connectionQueue.splice(0).forEach(function (cb) {
        var err = new Error('Pool is closed.');
        err.code = 'POOL_CLOSED';
        browser$1.nextTick(function () {
          cb(err);
        });
      });
    } else if (this._connectionQueue.length) {
      // get connection with next waiting callback
      this.getConnection(this._connectionQueue.shift());
    }
  };

  Pool$2.prototype.end = function (cb) {
    this._closed = true;

    if (typeof cb !== 'function') {
      cb = function (err) {
        if (err) throw err;
      };
    }

    var calledBack   = false;
    var waitingClose = 0;

    function onEnd(err) {
      if (!calledBack && (err || --waitingClose <= 0)) {
        calledBack = true;
        cb(err);
      }
    }

    while (this._allConnections.length !== 0) {
      waitingClose++;
      this._purgeConnection(this._allConnections[0], onEnd);
    }

    if (waitingClose === 0) {
      browser$1.nextTick(onEnd);
    }
  };

  Pool$2.prototype.query = function (sql, values, cb) {
    var query = Connection$1.createQuery(sql, values, cb);

    if (!(typeof sql === 'object' && 'typeCast' in sql)) {
      query.typeCast = this.config.connectionConfig.typeCast;
    }

    if (this.config.connectionConfig.trace) {
      // Long stack trace support
      query._callSite = new Error();
    }

    this.getConnection(function (err, conn) {
      if (err) {
        query.on('error', function () {});
        query.end(err);
        return;
      }

      // Release connection based off event
      query.once('end', function() {
        conn.release();
      });

      conn.query(query);
    });

    return query;
  };

  Pool$2.prototype._enqueueCallback = function _enqueueCallback(callback) {

    if (this.config.queueLimit && this._connectionQueue.length >= this.config.queueLimit) {
      browser$1.nextTick(function () {
        var err = new Error('Queue limit reached.');
        err.code = 'POOL_ENQUEUELIMIT';
        callback(err);
      });
      return;
    }

    // Bind to domain, as dequeue will likely occur in a different domain
    var cb = browser$1.domain
      ? browser$1.domain.bind(callback)
      : callback;

    this._connectionQueue.push(cb);
    this.emit('enqueue');
  };

  Pool$2.prototype._needsChangeUser = function _needsChangeUser(connection) {
    var connConfig = connection.config;
    var poolConfig = this.config.connectionConfig;

    // check if changeUser values are different
    return connConfig.user !== poolConfig.user
      || connConfig.database !== poolConfig.database
      || connConfig.password !== poolConfig.password
      || connConfig.charsetNumber !== poolConfig.charsetNumber;
  };

  Pool$2.prototype._purgeConnection = function _purgeConnection(connection, callback) {
    var cb = callback || function () {};

    if (connection.state === 'disconnected') {
      connection.destroy();
    }

    this._removeConnection(connection);

    if (connection.state !== 'disconnected' && !connection._protocol._quitSequence) {
      connection._realEnd(cb);
      return;
    }

    browser$1.nextTick(cb);
  };

  Pool$2.prototype._removeConnection = function(connection) {
    connection._pool = null;

    // Remove connection from all connections
    spliceConnection(this._allConnections, connection);

    // Remove connection from free connections
    spliceConnection(this._freeConnections, connection);

    this.releaseConnection(connection);
  };

  Pool$2.prototype.escape = function(value) {
    return mysql.escape(value, this.config.connectionConfig.stringifyObjects, this.config.connectionConfig.timezone);
  };

  Pool$2.prototype.escapeId = function escapeId(value) {
    return mysql.escapeId(value, false);
  };

  function spliceConnection(array, connection) {
    var index;
    if ((index = array.indexOf(connection)) !== -1) {
      // Remove connection from all connections
      array.splice(index, 1);
    }
  }

  var Pool$3 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var require$$2 = /*@__PURE__*/getAugmentedNamespace(Pool$3);

  var Pool$1          = require('./Pool');
  var PoolConfig$1    = require('./PoolConfig');
  var PoolNamespace = require('./PoolNamespace');
  var PoolSelector  = require('./PoolSelector');
  var Util          = require('util');
  var EventEmitter  = require('events').EventEmitter;

  module.exports = PoolCluster;

  /**
   * PoolCluster
   * @constructor
   * @param {object} [config] The pool cluster configuration
   * @public
   */
  function PoolCluster(config) {
    EventEmitter.call(this);

    config = config || {};
    this._canRetry = typeof config.canRetry === 'undefined' ? true : config.canRetry;
    this._defaultSelector = config.defaultSelector || 'RR';
    this._removeNodeErrorCount = config.removeNodeErrorCount || 5;
    this._restoreNodeTimeout = config.restoreNodeTimeout || 0;

    this._closed = false;
    this._findCaches = Object.create(null);
    this._lastId = 0;
    this._namespaces = Object.create(null);
    this._nodes = Object.create(null);
  }

  Util.inherits(PoolCluster, EventEmitter);

  PoolCluster.prototype.add = function add(id, config) {
    if (this._closed) {
      throw new Error('PoolCluster is closed.');
    }

    var nodeId = typeof id === 'object'
      ? 'CLUSTER::' + (++this._lastId)
      : String(id);

    if (this._nodes[nodeId] !== undefined) {
      throw new Error('Node ID "' + nodeId + '" is already defined in PoolCluster.');
    }

    var poolConfig = typeof id !== 'object'
      ? new PoolConfig$1(config)
      : new PoolConfig$1(id);

    this._nodes[nodeId] = {
      id            : nodeId,
      errorCount    : 0,
      pool          : new Pool$1({config: poolConfig}),
      _offlineUntil : 0
    };

    this._clearFindCaches();
  };

  PoolCluster.prototype.end = function end(callback) {
    var cb = callback !== undefined
      ? callback
      : _cb;

    if (typeof cb !== 'function') {
      throw TypeError('callback argument must be a function');
    }

    if (this._closed) {
      browser$1.nextTick(cb);
      return;
    }

    this._closed = true;

    var calledBack   = false;
    var nodeIds      = Object.keys(this._nodes);
    var waitingClose = 0;

    function onEnd(err) {
      if (!calledBack && (err || --waitingClose <= 0)) {
        calledBack = true;
        cb(err);
      }
    }

    for (var i = 0; i < nodeIds.length; i++) {
      var nodeId = nodeIds[i];
      var node = this._nodes[nodeId];

      waitingClose++;
      node.pool.end(onEnd);
    }

    if (waitingClose === 0) {
      browser$1.nextTick(onEnd);
    }
  };

  PoolCluster.prototype.of = function(pattern, selector) {
    pattern = pattern || '*';

    selector = selector || this._defaultSelector;
    selector = selector.toUpperCase();
    if (typeof PoolSelector[selector] === 'undefined') {
      selector = this._defaultSelector;
    }

    var key = pattern + selector;

    if (typeof this._namespaces[key] === 'undefined') {
      this._namespaces[key] = new PoolNamespace(this, pattern, selector);
    }

    return this._namespaces[key];
  };

  PoolCluster.prototype.remove = function remove(pattern) {
    var foundNodeIds = this._findNodeIds(pattern, true);

    for (var i = 0; i < foundNodeIds.length; i++) {
      var node = this._getNode(foundNodeIds[i]);

      if (node) {
        this._removeNode(node);
      }
    }
  };

  PoolCluster.prototype.getConnection = function(pattern, selector, cb) {
    var namespace;
    if (typeof pattern === 'function') {
      cb = pattern;
      namespace = this.of();
    } else {
      if (typeof selector === 'function') {
        cb = selector;
        selector = this._defaultSelector;
      }

      namespace = this.of(pattern, selector);
    }

    namespace.getConnection(cb);
  };

  PoolCluster.prototype._clearFindCaches = function _clearFindCaches() {
    this._findCaches = Object.create(null);
  };

  PoolCluster.prototype._decreaseErrorCount = function _decreaseErrorCount(node) {
    var errorCount = node.errorCount;

    if (errorCount > this._removeNodeErrorCount) {
      errorCount = this._removeNodeErrorCount;
    }

    if (errorCount < 1) {
      errorCount = 1;
    }

    node.errorCount = errorCount - 1;

    if (node._offlineUntil) {
      node._offlineUntil = 0;
      this.emit('online', node.id);
    }
  };

  PoolCluster.prototype._findNodeIds = function _findNodeIds(pattern, includeOffline) {
    var currentTime  = 0;
    var foundNodeIds = this._findCaches[pattern];

    if (foundNodeIds === undefined) {
      var expression = patternRegExp(pattern);
      var nodeIds    = Object.keys(this._nodes);

      foundNodeIds = nodeIds.filter(function (id) {
        return id.match(expression);
      });

      this._findCaches[pattern] = foundNodeIds;
    }

    if (includeOffline) {
      return foundNodeIds;
    }

    return foundNodeIds.filter(function (nodeId) {
      var node = this._getNode(nodeId);

      if (!node._offlineUntil) {
        return true;
      }

      if (!currentTime) {
        currentTime = getMonotonicMilliseconds();
      }

      return node._offlineUntil <= currentTime;
    }, this);
  };

  PoolCluster.prototype._getNode = function _getNode(id) {
    return this._nodes[id] || null;
  };

  PoolCluster.prototype._increaseErrorCount = function _increaseErrorCount(node) {
    var errorCount = ++node.errorCount;

    if (this._removeNodeErrorCount > errorCount) {
      return;
    }

    if (this._restoreNodeTimeout > 0) {
      node._offlineUntil = getMonotonicMilliseconds() + this._restoreNodeTimeout;
      this.emit('offline', node.id);
      return;
    }

    this._removeNode(node);
    this.emit('remove', node.id);
  };

  PoolCluster.prototype._getConnection = function(node, cb) {
    var self = this;

    node.pool.getConnection(function (err, connection) {
      if (err) {
        self._increaseErrorCount(node);
        cb(err);
        return;
      } else {
        self._decreaseErrorCount(node);
      }

      connection._clusterId = node.id;

      cb(null, connection);
    });
  };

  PoolCluster.prototype._removeNode = function _removeNode(node) {
    delete this._nodes[node.id];

    this._clearFindCaches();

    node.pool.end(_noop);
  };

  function getMonotonicMilliseconds() {
    var ms;

    if (typeof browser$1.hrtime === 'function') {
      ms = browser$1.hrtime();
      ms = ms[0] * 1e3 + ms[1] * 1e-6;
    } else {
      ms = browser$1.uptime() * 1000;
    }

    return Math.floor(ms);
  }

  function isRegExp(val) {
    return typeof val === 'object'
      && Object.prototype.toString.call(val) === '[object RegExp]';
  }

  function patternRegExp(pattern) {
    if (isRegExp(pattern)) {
      return pattern;
    }

    var source = pattern
      .replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1')
      .replace(/\*/g, '.*');

    return new RegExp('^' + source + '$');
  }

  function _cb(err) {
    if (err) {
      throw err;
    }
  }

  function _noop() {}

  var PoolCluster$1 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var require$$3 = /*@__PURE__*/getAugmentedNamespace(PoolCluster$1);

  var ConnectionConfig = ConnectionConfig_1;

  var PoolConfig_1 = PoolConfig;
  function PoolConfig(options) {
    if (typeof options === 'string') {
      options = ConnectionConfig.parseUrl(options);
    }

    this.acquireTimeout     = (options.acquireTimeout === undefined)
      ? 10 * 1000
      : Number(options.acquireTimeout);
    this.connectionConfig   = new ConnectionConfig(options);
    this.waitForConnections = (options.waitForConnections === undefined)
      ? true
      : Boolean(options.waitForConnections);
    this.connectionLimit    = (options.connectionLimit === undefined)
      ? 10
      : Number(options.connectionLimit);
    this.queueLimit         = (options.queueLimit === undefined)
      ? 0
      : Number(options.queueLimit);
  }

  PoolConfig.prototype.newConnectionConfig = function newConnectionConfig() {
    var connectionConfig = new ConnectionConfig(this.connectionConfig);

    connectionConfig.clientFlags   = this.connectionConfig.clientFlags;
    connectionConfig.maxPacketSize = this.connectionConfig.maxPacketSize;

    return connectionConfig;
  };

  var SqlString$1  = exports;

  var ID_GLOBAL_REGEXP    = /`/g;
  var QUAL_GLOBAL_REGEXP  = /\./g;
  var CHARS_GLOBAL_REGEXP = /[\0\b\t\n\r\x1a\"\'\\]/g; // eslint-disable-line no-control-regex
  var CHARS_ESCAPE_MAP    = {
    '\0'   : '\\0',
    '\b'   : '\\b',
    '\t'   : '\\t',
    '\n'   : '\\n',
    '\r'   : '\\r',
    '\x1a' : '\\Z',
    '"'    : '\\"',
    '\''   : '\\\'',
    '\\'   : '\\\\'
  };

  SqlString$1.escapeId = function escapeId(val, forbidQualified) {
    if (Array.isArray(val)) {
      var sql = '';

      for (var i = 0; i < val.length; i++) {
        sql += (i === 0 ? '' : ', ') + SqlString$1.escapeId(val[i], forbidQualified);
      }

      return sql;
    } else if (forbidQualified) {
      return '`' + String(val).replace(ID_GLOBAL_REGEXP, '``') + '`';
    } else {
      return '`' + String(val).replace(ID_GLOBAL_REGEXP, '``').replace(QUAL_GLOBAL_REGEXP, '`.`') + '`';
    }
  };

  SqlString$1.escape = function escape(val, stringifyObjects, timeZone) {
    if (val === undefined || val === null) {
      return 'NULL';
    }

    switch (typeof val) {
      case 'boolean': return (val) ? 'true' : 'false';
      case 'number': return val + '';
      case 'object':
        if (val instanceof Date) {
          return SqlString$1.dateToString(val, timeZone || 'local');
        } else if (Array.isArray(val)) {
          return SqlString$1.arrayToList(val, timeZone);
        } else if (Buffer.isBuffer(val)) {
          return SqlString$1.bufferToString(val);
        } else if (typeof val.toSqlString === 'function') {
          return String(val.toSqlString());
        } else if (stringifyObjects) {
          return escapeString(val.toString());
        } else {
          return SqlString$1.objectToValues(val, timeZone);
        }
      default: return escapeString(val);
    }
  };

  SqlString$1.arrayToList = function arrayToList(array, timeZone) {
    var sql = '';

    for (var i = 0; i < array.length; i++) {
      var val = array[i];

      if (Array.isArray(val)) {
        sql += (i === 0 ? '' : ', ') + '(' + SqlString$1.arrayToList(val, timeZone) + ')';
      } else {
        sql += (i === 0 ? '' : ', ') + SqlString$1.escape(val, true, timeZone);
      }
    }

    return sql;
  };

  SqlString$1.format = function format(sql, values, stringifyObjects, timeZone) {
    if (values == null) {
      return sql;
    }

    if (!(values instanceof Array || Array.isArray(values))) {
      values = [values];
    }

    var chunkIndex        = 0;
    var placeholdersRegex = /\?+/g;
    var result            = '';
    var valuesIndex       = 0;
    var match;

    while (valuesIndex < values.length && (match = placeholdersRegex.exec(sql))) {
      var len = match[0].length;

      if (len > 2) {
        continue;
      }

      var value = len === 2
        ? SqlString$1.escapeId(values[valuesIndex])
        : SqlString$1.escape(values[valuesIndex], stringifyObjects, timeZone);

      result += sql.slice(chunkIndex, match.index) + value;
      chunkIndex = placeholdersRegex.lastIndex;
      valuesIndex++;
    }

    if (chunkIndex === 0) {
      // Nothing was replaced
      return sql;
    }

    if (chunkIndex < sql.length) {
      return result + sql.slice(chunkIndex);
    }

    return result;
  };

  SqlString$1.dateToString = function dateToString(date, timeZone) {
    var dt = new Date(date);

    if (isNaN(dt.getTime())) {
      return 'NULL';
    }

    var year;
    var month;
    var day;
    var hour;
    var minute;
    var second;
    var millisecond;

    if (timeZone === 'local') {
      year        = dt.getFullYear();
      month       = dt.getMonth() + 1;
      day         = dt.getDate();
      hour        = dt.getHours();
      minute      = dt.getMinutes();
      second      = dt.getSeconds();
      millisecond = dt.getMilliseconds();
    } else {
      var tz = convertTimezone(timeZone);

      if (tz !== false && tz !== 0) {
        dt.setTime(dt.getTime() + (tz * 60000));
      }

      year       = dt.getUTCFullYear();
      month       = dt.getUTCMonth() + 1;
      day         = dt.getUTCDate();
      hour        = dt.getUTCHours();
      minute      = dt.getUTCMinutes();
      second      = dt.getUTCSeconds();
      millisecond = dt.getUTCMilliseconds();
    }

    // YYYY-MM-DD HH:mm:ss.mmm
    var str = zeroPad(year, 4) + '-' + zeroPad(month, 2) + '-' + zeroPad(day, 2) + ' ' +
      zeroPad(hour, 2) + ':' + zeroPad(minute, 2) + ':' + zeroPad(second, 2) + '.' +
      zeroPad(millisecond, 3);

    return escapeString(str);
  };

  SqlString$1.bufferToString = function bufferToString(buffer) {
    return 'X' + escapeString(buffer.toString('hex'));
  };

  SqlString$1.objectToValues = function objectToValues(object, timeZone) {
    var sql = '';

    for (var key in object) {
      var val = object[key];

      if (typeof val === 'function') {
        continue;
      }

      sql += (sql.length === 0 ? '' : ', ') + SqlString$1.escapeId(key) + ' = ' + SqlString$1.escape(val, true, timeZone);
    }

    return sql;
  };

  SqlString$1.raw = function raw(sql) {
    if (typeof sql !== 'string') {
      throw new TypeError('argument sql must be a string');
    }

    return {
      toSqlString: function toSqlString() { return sql; }
    };
  };

  function escapeString(val) {
    var chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex = 0;
    var escapedVal = '';
    var match;

    while ((match = CHARS_GLOBAL_REGEXP.exec(val))) {
      escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]];
      chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex;
    }

    if (chunkIndex === 0) {
      // Nothing was escaped
      return "'" + val + "'";
    }

    if (chunkIndex < val.length) {
      return "'" + escapedVal + val.slice(chunkIndex) + "'";
    }

    return "'" + escapedVal + "'";
  }

  function zeroPad(number, length) {
    number = number.toString();
    while (number.length < length) {
      number = '0' + number;
    }

    return number;
  }

  function convertTimezone(tz) {
    if (tz === 'Z') {
      return 0;
    }

    var m = tz.match(/([\+\-\s])(\d\d):?(\d\d)?/);
    if (m) {
      return (m[1] === '-' ? -1 : 1) * (parseInt(m[2], 10) + ((m[3] ? parseInt(m[3], 10) : 0) / 60)) * 60;
    }
    return false;
  }

  var SqlString$2 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var require$$0$1 = /*@__PURE__*/getAugmentedNamespace(SqlString$2);

  var sqlstring = require$$0$1;

  var SqlString = sqlstring;

  var types = {};

  /**
   * MySQL type constants
   *
   * Extracted from version 5.7.29
   *
   * !! Generated by generate-type-constants.js, do not modify by hand !!
   */

  (function (exports) {
  exports.DECIMAL     = 0;
  exports.TINY        = 1;
  exports.SHORT       = 2;
  exports.LONG        = 3;
  exports.FLOAT       = 4;
  exports.DOUBLE      = 5;
  exports.NULL        = 6;
  exports.TIMESTAMP   = 7;
  exports.LONGLONG    = 8;
  exports.INT24       = 9;
  exports.DATE        = 10;
  exports.TIME        = 11;
  exports.DATETIME    = 12;
  exports.YEAR        = 13;
  exports.NEWDATE     = 14;
  exports.VARCHAR     = 15;
  exports.BIT         = 16;
  exports.TIMESTAMP2  = 17;
  exports.DATETIME2   = 18;
  exports.TIME2       = 19;
  exports.JSON        = 245;
  exports.NEWDECIMAL  = 246;
  exports.ENUM        = 247;
  exports.SET         = 248;
  exports.TINY_BLOB   = 249;
  exports.MEDIUM_BLOB = 250;
  exports.LONG_BLOB   = 251;
  exports.BLOB        = 252;
  exports.VAR_STRING  = 253;
  exports.STRING      = 254;
  exports.GEOMETRY    = 255;

  // Lookup-by-number table
  exports[0]   = 'DECIMAL';
  exports[1]   = 'TINY';
  exports[2]   = 'SHORT';
  exports[3]   = 'LONG';
  exports[4]   = 'FLOAT';
  exports[5]   = 'DOUBLE';
  exports[6]   = 'NULL';
  exports[7]   = 'TIMESTAMP';
  exports[8]   = 'LONGLONG';
  exports[9]   = 'INT24';
  exports[10]  = 'DATE';
  exports[11]  = 'TIME';
  exports[12]  = 'DATETIME';
  exports[13]  = 'YEAR';
  exports[14]  = 'NEWDATE';
  exports[15]  = 'VARCHAR';
  exports[16]  = 'BIT';
  exports[17]  = 'TIMESTAMP2';
  exports[18]  = 'DATETIME2';
  exports[19]  = 'TIME2';
  exports[245] = 'JSON';
  exports[246] = 'NEWDECIMAL';
  exports[247] = 'ENUM';
  exports[248] = 'SET';
  exports[249] = 'TINY_BLOB';
  exports[250] = 'MEDIUM_BLOB';
  exports[251] = 'LONG_BLOB';
  exports[252] = 'BLOB';
  exports[253] = 'VAR_STRING';
  exports[254] = 'STRING';
  exports[255] = 'GEOMETRY';
  }(types));

  (function (exports) {
  var Classes = Object.create(null);

  /**
   * Create a new Connection instance.
   * @param {object|string} config Configuration or connection string for new MySQL connection
   * @return {Connection} A new MySQL connection
   * @public
   */
  exports.createConnection = function createConnection(config) {
    var Connection       = loadClass('Connection');
    var ConnectionConfig = loadClass('ConnectionConfig');

    return new Connection({config: new ConnectionConfig(config)});
  };

  /**
   * Create a new Pool instance.
   * @param {object|string} config Configuration or connection string for new MySQL connections
   * @return {Pool} A new MySQL pool
   * @public
   */
  exports.createPool = function createPool(config) {
    var Pool       = loadClass('Pool');
    var PoolConfig = loadClass('PoolConfig');

    return new Pool({config: new PoolConfig(config)});
  };

  /**
   * Create a new PoolCluster instance.
   * @param {object} [config] Configuration for pool cluster
   * @return {PoolCluster} New MySQL pool cluster
   * @public
   */
  exports.createPoolCluster = function createPoolCluster(config) {
    var PoolCluster = loadClass('PoolCluster');

    return new PoolCluster(config);
  };

  /**
   * Create a new Query instance.
   * @param {string} sql The SQL for the query
   * @param {array} [values] Any values to insert into placeholders in sql
   * @param {function} [callback] The callback to use when query is complete
   * @return {Query} New query object
   * @public
   */
  exports.createQuery = function createQuery(sql, values, callback) {
    var Connection = loadClass('Connection');

    return Connection.createQuery(sql, values, callback);
  };

  /**
   * Escape a value for SQL.
   * @param {*} value The value to escape
   * @param {boolean} [stringifyObjects=false] Setting if objects should be stringified
   * @param {string} [timeZone=local] Setting for time zone to use for Date conversion
   * @return {string} Escaped string value
   * @public
   */
  exports.escape = function escape(value, stringifyObjects, timeZone) {
    var SqlString = loadClass('SqlString');

    return SqlString.escape(value, stringifyObjects, timeZone);
  };

  /**
   * Escape an identifier for SQL.
   * @param {*} value The value to escape
   * @param {boolean} [forbidQualified=false] Setting to treat '.' as part of identifier
   * @return {string} Escaped string value
   * @public
   */
  exports.escapeId = function escapeId(value, forbidQualified) {
    var SqlString = loadClass('SqlString');

    return SqlString.escapeId(value, forbidQualified);
  };

  /**
   * Format SQL and replacement values into a SQL string.
   * @param {string} sql The SQL for the query
   * @param {array} [values] Any values to insert into placeholders in sql
   * @param {boolean} [stringifyObjects=false] Setting if objects should be stringified
   * @param {string} [timeZone=local] Setting for time zone to use for Date conversion
   * @return {string} Formatted SQL string
   * @public
   */
  exports.format = function format(sql, values, stringifyObjects, timeZone) {
    var SqlString = loadClass('SqlString');

    return SqlString.format(sql, values, stringifyObjects, timeZone);
  };

  /**
   * Wrap raw SQL strings from escape overriding.
   * @param {string} sql The raw SQL
   * @return {object} Wrapped object
   * @public
   */
  exports.raw = function raw(sql) {
    var SqlString = loadClass('SqlString');

    return SqlString.raw(sql);
  };

  /**
   * The type constants.
   * @public
   */
  Object.defineProperty(exports, 'Types', {
    get: loadClass.bind(null, 'Types')
  });

  /**
   * Load the given class.
   * @param {string} className Name of class to default
   * @return {function|object} Class constructor or exports
   * @private
   */
  function loadClass(className) {
    var Class = Classes[className];

    if (Class !== undefined) {
      return Class;
    }

    // This uses a switch for static require analysis
    switch (className) {
      case 'Connection':
        Class = require$$0$3;
        break;
      case 'ConnectionConfig':
        Class = ConnectionConfig_1;
        break;
      case 'Pool':
        Class = require$$2;
        break;
      case 'PoolCluster':
        Class = require$$3;
        break;
      case 'PoolConfig':
        Class = PoolConfig_1;
        break;
      case 'SqlString':
        Class = SqlString;
        break;
      case 'Types':
        Class = types;
        break;
      default:
        throw new Error('Cannot find class \'' + className + '\'');
    }

    // Store to prevent invoking require()
    Classes[className] = Class;

    return Class;
  }
  }(mysql$1));

  const convertToHump = (str, char = '_') => {
      if (!str)
          return '';
      str = str.toLocaleLowerCase();
      let arr = [];
      let strArr = str.split(char);
      for (let i = 0; i < strArr.length; i++) {
          let a = strArr[i];
          if (i > 0) {
              a = strArr[i].slice(0, 1).toLocaleUpperCase() + strArr[i].slice(1);
          }
          arr.push(a);
      }
      return arr.join('');
  };

  /**
   * @decription mysql数据库配置
   * @author wl
  */
  /**
   * 请求数据库 查询表结构
   * @param {string} tableName 表名
   */
  const connectDatabase$1 = (config, tableName) => {
      return new Promise((resolve, reject) => {
          // 创建连接
          const connection = mysql$1.createConnection(config);
          connection.connect();
          connection.query(`
    SELECT 
    t.TABLE_NAME,
    t.TABLE_COMMENT,
    c.COLUMN_NAME,
    c.COLUMN_TYPE,
    c.COLUMN_COMMENT 
    FROM 
    information_schema.TABLES t,
    INFORMATION_SCHEMA.Columns c 
    WHERE
    t.TABLE_SCHEMA = '${config.database}'
    and
    c.TABLE_SCHEMA = '${config.database}'
    and
    t.TABLE_NAME = '${tableName}'
    and
    c.TABLE_NAME = '${tableName}'
    `, function (error, results) {
              if (error) {
                  reject(error);
                  throw error;
              }
              if (results.length === 0) {
                  // eslint-disable-next-line prefer-promise-reject-errors
                  reject({ message: '未查询到表信息，检查输入表名称是否正确' });
              }
              // 打印返回的表结构
              let column = [];
              let tableName = convertToHump(results[0].TABLE_NAME);
              let tableComment = convertToHump(results[0].TABLE_COMMENT);
              results.forEach((r) => {
                  column.push({
                      name: convertToHump(r.COLUMN_NAME),
                      comment: r.COLUMN_COMMENT
                  });
              });
              resolve({
                  column,
                  tableName,
                  tableComment
              });
          });
          connection.end(err => {
              if (err)
                  throw err;
              console.log('连接数据库关闭');
          });
      });
  };

  var __dirname = '/:\workspace\wl\@wastone\generate';

  const nodbUtil = require('./util.js');
  const util = require('util');

  // This version of node-oracledb works with Node.js 8.16, 10.16 or
  // later.  The test stops hard-to-interpret runtime errors and crashes
  // with older Node.js versions.  Also Node.js 8.16 and 10.16 (and
  // 12.0) contain an important Node-API performance regression fix.  If
  // you're using the obsolete Node.js 9 or 11 versions, you're on your
  // own regarding performance and functionality
  let vs = browser$1.version.substring(1).split(".").map(Number);
  if (vs[0] < 8 || (vs[0] === 8 && vs[1] < 16)) {
    throw new Error(nodbUtil.getErrorMessage('NJS-069', nodbUtil.PACKAGE_JSON_VERSION, "8.16"));
  } else if ((vs[0] === 10 && vs[1] < 16)) {
    throw new Error(nodbUtil.getErrorMessage('NJS-069', nodbUtil.PACKAGE_JSON_VERSION, "10.16"));
  }

  const AqDeqOptions = require('./aqDeqOptions.js');
  const AqEnqOptions = require('./aqEnqOptions.js');
  const AqMessage = require('./aqMessage.js');
  const AqQueue = require('./aqQueue.js');
  const BaseDbObject = require('./dbObject.js');
  const Connection = require('./connection.js');
  const Lob = require('./lob.js');
  const Pool = require('./pool.js');
  const PoolStatistics = require('./poolStatistics.js');
  const ResultSet = require('./resultset.js');
  const SodaDatabase = require('./sodaDatabase.js');
  const SodaCollection = require('./sodaCollection.js');
  const SodaDocCursor = require('./sodaDocCursor.js');
  const SodaDocument = require('./sodaDocument.js');
  const SodaOperation = require('./sodaOperation.js');

  let poolCache = {};
  let tempUsedPoolAliases = {};
  const defaultPoolAlias = 'default';

  // Load the Oracledb binary

  /*global __non_webpack_require__*/  // quieten eslint
  const requireBinary = (typeof __non_webpack_require__ === 'function') ? __non_webpack_require__ : require; // See Issue 1156

  const binaryLocations = [
    '../' + nodbUtil.RELEASE_DIR + '/' + nodbUtil.BINARY_FILE,  // pre-built binary
    '../' + nodbUtil.RELEASE_DIR + '/' + 'oracledb.node',       // binary built from source
    '../build/Debug/oracledb.node',                             // debug binary
    // For Webpack.  A Webpack copy plugin is still needed to copy 'node_modules/oracledb/build/' to the output directory
    // See https://github.com/oracle/node-oracledb/issues/1156
    './node_modules/oracledb/' + nodbUtil.RELEASE_DIR + '/' + nodbUtil.BINARY_FILE,
    './node_modules/oracledb/' + nodbUtil.RELEASE_DIR + '/' + 'oracledb.node'
  ];

  let oracledbCLib;
  for (let i = 0; i < binaryLocations.length; i++) {
    try {
      oracledbCLib = requireBinary(binaryLocations[i]);
      break;
    } catch (err) {
      if (err.code !== 'MODULE_NOT_FOUND' || i == binaryLocations.length - 1) {
        let nodeInfo;
        if (err.code === 'MODULE_NOT_FOUND') {
          // A binary was not found in any of the search directories.
          // Note this message may not be accurate for Webpack users since Webpack changes __dirname
          nodeInfo = `\n  Looked for ${binaryLocations.map(x => require('path').resolve(__dirname, x)).join(', ')}\n  ${nodbUtil.getInstallURL()}\n`;
        } else {
          nodeInfo = `\n  Node.js require('oracledb') error was:\n  ${err.message}\n  ${nodbUtil.getInstallHelp()}\n`;
        }
        throw new Error(nodbUtil.getErrorMessage('NJS-045', nodeInfo));
      }
    }
  }


  class OracleDb {

    constructor() {
      this.queueTimeout = 60000;
      this.queueMax     = 500;
      this.errorOnConcurrentExecute = false;
    }

    // extend class with promisified functions
    _extend(_oracledb) {
      this.getConnection = nodbUtil.callbackify(getConnection).bind(_oracledb);
      this.createPool = nodbUtil.callbackify(createPool).bind(_oracledb);
      this.shutdown = nodbUtil.callbackify(shutdown).bind(_oracledb);
      this.startup = nodbUtil.callbackify(startup).bind(_oracledb);
    }

    // temporary method for determining if an object is a date until
    // napi_is_date() can be used (when Node-API v5 can be used)
    _isDate(val) {
      return util.isDate(val);
    }

    // retrieves a pool from the pool cache (synchronous method)
    getPool(poolAlias) {
      let pool;

      nodbUtil.checkArgCount(arguments, 0, 1);

      if (poolAlias) {
        nodbUtil.assert(typeof poolAlias === 'string' || typeof poolAlias === 'number', 'NJS-005', 1);
      }

      poolAlias = poolAlias || defaultPoolAlias;

      pool = poolCache[poolAlias];

      if (!pool) {
        throw new Error(nodbUtil.getErrorMessage('NJS-047', poolAlias));
      }

      return pool;
    }

    initOracleClient(arg1) {
      let options = {};
      nodbUtil.checkArgCount(arguments, 0, 1);
      if (arg1 !== undefined) {
        nodbUtil.assert(nodbUtil.isObject(arg1), 'NJS-005', 1);
        options = arg1;
      }
      this._initOracleClient(options);
    }

  }

  // Oracledb functions and classes

  //-----------------------------------------------------------------------------
  // createPool()
  //   Create a pool with the specified options and return it to the caller.
  //-----------------------------------------------------------------------------
  async function createPool(poolAttrs) {
    let poolAlias;

    // check arguments
    nodbUtil.checkArgCount(arguments, 1, 1);
    nodbUtil.assert(nodbUtil.isObject(poolAttrs), 'NJS-005', 1);
    if (poolAttrs.poolAlias !== undefined) {
      if (typeof poolAttrs.poolAlias !== 'string' ||
          poolAttrs.poolAlias.length === 0) {
        throw new Error(nodbUtil.getErrorMessage('NJS-004',
          'poolAttrs.poolAlias'));
      }
      poolAlias = poolAttrs.poolAlias;
    } else if (poolAttrs.poolAlias === undefined
        && !poolCache[defaultPoolAlias]
        && !tempUsedPoolAliases[defaultPoolAlias]) {
      poolAlias = defaultPoolAlias;
    }
    if (poolCache[poolAlias] || tempUsedPoolAliases[poolAlias]) {
      throw new Error(nodbUtil.getErrorMessage('NJS-046', poolAlias));
    }

    // create an adjusted set of pool attributes to pass to the C layer; the
    // session callback must be removed if it is a JavaScript function and the
    // queue timeout is used to specify the maximum amount of time that the C
    // layer will wait for a connection to be returned; ordinarily since the
    // JavaScript layer never calls the C layer to get a connection unless one is
    // known to be available, this should not be needed, but in some cases (such
    // as when the maximum for a particular shard is specified) this may not be
    // known, so this prevents an unnecessarily long wait from taking place
    const adjustedPoolAttrs = Object.defineProperties({},
      Object.getOwnPropertyDescriptors(poolAttrs));
    if (typeof poolAttrs.sessionCallback === 'function') {
      delete adjustedPoolAttrs.sessionCallback;
    }
    if (adjustedPoolAttrs.queueTimeout === undefined) {
      adjustedPoolAttrs.queueTimeout = this.queueTimeout;
    }

    // Need to prevent another call in the same stack from succeeding, otherwise
    // two pools could be created with the same poolAlias and the second one that
    // comes back would overwrite the first in the cache.
    if (poolAlias) {
      tempUsedPoolAliases[poolAlias] = true;
    }

    try {
      const pool = await this._createPool(adjustedPoolAttrs);

      if (poolAlias) {
        poolCache[poolAlias] = pool;

        // It's now safe to remove this alias from the tempUsedPoolAliases.
        delete tempUsedPoolAliases[poolAlias];
      }

      pool._setup(poolAttrs, poolAlias, this);
      pool.on('_afterPoolClose', () => {
        if (pool.poolAlias) {
          delete poolCache[pool.poolAlias];
        }
      });

      return pool;

    } catch (err) {

      // We need to free this up since the creation of the pool failed.
      if (poolAlias) {
        delete tempUsedPoolAliases[poolAlias];
      }

      // add installation help instructions to error message, if applicable
      if (err.message.match(/DPI-1047/)) {
        err.message += "\n" + nodbUtil.getInstallHelp();
      }

      throw err;
    }
  }


  //-----------------------------------------------------------------------------
  // getConnection()
  //   Gets either a standalone connection, or a connection from a pool cache
  //-----------------------------------------------------------------------------
  async function getConnection(a1) {
    let pool;
    let poolAlias;
    let connAttrs = {};

    // verify the number and types of arguments
    nodbUtil.checkArgCount(arguments, 0, 1);
    if (arguments.length == 0) {
      poolAlias = defaultPoolAlias;
    } else {
      nodbUtil.assert(typeof a1 === 'string' || nodbUtil.isObject(a1),
        'NJS-005', 1);
      if (typeof a1 === 'string') {
        poolAlias = a1;
      } else {
        connAttrs = a1;
        if (connAttrs.poolAlias) {
          poolAlias = connAttrs.poolAlias;
        }
      }
    }

    // if a pool alias is available, acquire a connection from the specified pool
    if (poolAlias) {
      pool = poolCache[poolAlias];
      if (!pool) {
        throw new Error(nodbUtil.getErrorMessage('NJS-047', poolAlias));
      }
      return await pool.getConnection(connAttrs);

    // otherwise, create a new standalone connection
    } else {
      try {
        return await this._getConnection(connAttrs);
      } catch (err) {
        if (err.message.match(/DPI-1047/)) {
          err.message += "\n" + nodbUtil.getInstallHelp();
        }
        throw err;
      }
    }
  }


  //-----------------------------------------------------------------------------
  // shutdown()
  //   Shuts down the database.
  //-----------------------------------------------------------------------------
  async function shutdown(a1, a2) {
    let connAttr = {};
    let shutdownMode = this.SHUTDOWN_MODE_DEFAULT;

    // verify the number and types of arguments
    nodbUtil.checkArgCount(arguments, 0, 2);
    if (arguments.length == 2) {
      nodbUtil.assert(typeof a1 === 'object', 'NJS-005', 1);
      nodbUtil.assert(typeof a2 === 'number', 'NJS-005', 2);
      connAttr = a1;
      shutdownMode = a2;
    } else if (arguments.length == 1) {
      nodbUtil.assert(typeof a1 === 'object', 'NJS-005', 1);
      connAttr = a1;
    }

    // only look for the keys that are used for shutting down the database
    // use SYSOPER privilege
    const dbConfig = {
      user: connAttr.user,
      password: connAttr.password,
      connectString: connAttr.connectString,
      connectionString: connAttr.connectionString,
      externalAuth: connAttr.externalAuth,
      privilege: this.SYSOPER
    };

    const conn = await this.getConnection(dbConfig);
    await conn.shutdown(shutdownMode);
    if (shutdownMode != this.SHUTDOWN_MODE_ABORT) {
      await conn.execute("ALTER DATABASE CLOSE");
      await conn.execute("ALTER DATABASE DISMOUNT");
      await conn.shutdown(this.SHUTDOWN_MODE_FINAL);
    }
    await conn.close();
  }


  //-----------------------------------------------------------------------------
  // startup()
  //   Starts up the database.
  //-----------------------------------------------------------------------------
  async function startup(a1, a2) {
    let connAttr = {};
    let startupAttr = {};

    // verify the number and types of arguments
    nodbUtil.checkArgCount(arguments, 0, 2);
    if (arguments.length == 2) {
      nodbUtil.assert (typeof a1 === 'object', 'NJS-005', 1);
      nodbUtil.assert (typeof a2 === 'object', 'NJS-005', 2);
      connAttr = a1;
      startupAttr = a2;
    } else if (arguments.length == 1) {
      nodbUtil.assert(typeof a1 === 'object', 'NJS-005', 1);
      connAttr = a1;
    }

    // only look for the keys that are used for starting up the database
    // use SYSOPER and SYSPRELIM privileges
    const dbConfig = {
      user: connAttr.user,
      password: connAttr.password,
      connectString: connAttr.connectString,
      connectionString: connAttr.connectionString,
      externalAuth: connAttr.externalAuth,
      privilege: this.SYSOPER | this.SYSPRELIM
    };

    let conn = await this.getConnection(dbConfig);
    await conn.startup(startupAttr);
    await conn.close();

    dbConfig.privilege = this.SYSOPER;
    conn = await this.getConnection(dbConfig);
    await conn.execute("ALTER DATABASE MOUNT");
    await conn.execute("ALTER DATABASE OPEN");
    await conn.close();
  }


  // create instance which will be exported
  let oracleDbInst = new OracleDb();

  // add classes to prototype
  let proto = Object.getPrototypeOf(oracleDbInst);
  proto.OracleDb = OracleDb;
  proto.AqDeqOptions = AqDeqOptions;
  proto.AqEnqOptions = AqEnqOptions;
  proto.AqMessage = AqMessage;
  proto.AqQueue = AqQueue;
  proto.BaseDbObject = BaseDbObject;
  proto.Connection = Connection;
  proto.Lob = Lob;
  proto.Pool = Pool;
  proto.PoolStatistics = PoolStatistics;
  proto.ResultSet = ResultSet;
  proto.SodaDatabase = SodaDatabase;
  proto.SodaCollection = SodaCollection;
  proto.SodaDocCursor = SodaDocCursor;
  proto.SodaDocument = SodaDocument;
  proto.SodaOperation = SodaOperation;

  // call C to extend classes
  oracledbCLib.init(oracleDbInst);

  module.exports = oracleDbInst;

  var oracledb$1 = /*#__PURE__*/Object.freeze({
    __proto__: null
  });

  var require$$0 = /*@__PURE__*/getAugmentedNamespace(oracledb$1);

  var oracledb = require$$0;

  /**
   * @decription oracle数据库配置
   * @author wl
  */
  /**
   * 请求数据库 查询表结构
   * @param {string} tableName 表名
   */
  const connectDatabase = (config, tableName) => {
      return new Promise((resolve, reject) => {
          oracledb.getConnection(config, function (err, connection) {
              if (err) {
                  console.error(err.message);
                  return;
              }
              // 查询某表一条数据测试，注意替换你的表名
              connection.execute(`SELECT
        ut.TABLE_NAME,
        uc.comments,
        ut.COLUMN_NAME,
        UCC.comments
      FROM
        user_tab_columns ut,
        user_tab_comments uc,
        user_col_comments ucc
      WHERE
        ut.TABLE_NAME = uc.TABLE_NAME
      AND ut.column_name = ucc.column_name
      AND UT.TABLE_NAME = UCC.TABLE_NAME
      AND ut.Table_Name = '${tableName}'`, function (err, result) {
                  if (err) {
                      console.error(err.message);
                      reject(err);
                      doRelease(connection);
                      return;
                  }
                  if (result.rows.length === 0) {
                      // eslint-disable-next-line prefer-promise-reject-errors
                      reject({ message: '未查询到表信息，检查输入表名称是否正确' });
                      return;
                  }
                  // 打印返回的表结构
                  let column = [];
                  let tableName = convertToHump(result.rows[0][0]);
                  let tableComment = convertToHump(result.rows[0][1]);
                  result.rows.forEach((r) => {
                      column.push({
                          name: convertToHump(r[2]),
                          comment: r[3]
                      });
                  });
                  resolve({
                      column,
                      tableName,
                      tableComment
                  });
              });
          });
      });
  };
  function doRelease(connection) {
      connection.close(function (err) {
          if (err) {
              console.log('error1');
              console.error(err.message);
          }
          console.log('========= 关闭连接 ==========');
      });
  }

  /**
   * 目标：
   *  - 支持批量生成
   *  - 支持多数据库
   *  - 支持可视化操作
   *  - vscode 插件支持
   */
  class Generate {
      // 配置参数
      option;
      constructor(option) {
          this.option = option;
          this.run();
      }
      run() {
          console.log(this.option);
          console.log(fileUtil);
          const connectDatabase$2 = this.option.databaseType === 'mysql' ? connectDatabase$1 : connectDatabase;
          console.log(connectDatabase$2);
      }
  }

  return Generate;

}));
