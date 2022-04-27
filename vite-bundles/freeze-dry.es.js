var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value2) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value: value2 }) : obj[key] = value2;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
function doctypeToString(doctype) {
  if (doctype === null) {
    return "";
  }
  if (!doctype || doctype.nodeType !== doctype.DOCUMENT_TYPE_NODE || typeof doctype.name !== "string" || typeof doctype.publicId !== "string" || typeof doctype.systemId !== "string") {
    throw new TypeError("Expected a DocumentType");
  }
  const doctypeString = `<!DOCTYPE ${doctype.name}` + (doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : "") + (doctype.systemId ? (doctype.publicId ? `` : ` SYSTEM`) + ` "${doctype.systemId}"` : ``) + `>`;
  return doctypeString;
}
function documentOuterHTML(document) {
  if (!document || document.nodeType === void 0 || document.nodeType !== document.DOCUMENT_NODE) {
    throw new TypeError("Expected a Document");
  }
  const html = [...document.childNodes].map((node2) => nodeToString(node2)).join("\n");
  return html;
}
function nodeToString(node2) {
  switch (node2.nodeType) {
    case node2.ELEMENT_NODE:
      return node2.outerHTML;
    case node2.TEXT_NODE:
      return node2.textContent;
    case node2.COMMENT_NODE:
      return `<!--${node2.textContent}-->`;
    case node2.DOCUMENT_TYPE_NODE:
      return doctypeToString(node2);
    default:
      throw new TypeError(`Unexpected node type: ${node2.nodeType}`);
  }
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getAugmentedNamespace(n) {
  if (n.__esModule)
    return n;
  var a = Object.defineProperty({}, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
var lib$1 = { exports: {} };
(function(module, exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function(obj) {
    return typeof obj;
  } : function(obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };
  exports.default = flatOptions2;
  function flatOptions2(options, defaults) {
    var result2 = Object.assign({}, defaults);
    if (options && (typeof options === "undefined" ? "undefined" : _typeof(options)) === "object") {
      Object.keys(options).forEach(function(key) {
        return validateOption(key, defaults) && copyOption(key, options, result2);
      });
    }
    return result2;
  }
  function copyOption(key, from, to) {
    if (from[key] !== void 0) {
      to[key] = from[key];
    }
  }
  function validateOption(key, defaults) {
    if (defaults && !Object.hasOwnProperty.call(defaults, key)) {
      throw new Error("Unknown option: " + key);
    }
    return true;
  }
  module.exports = exports["default"];
})(lib$1, lib$1.exports);
var flatOptions = /* @__PURE__ */ getDefaultExportFromCjs(lib$1.exports);
function areInputsEqual(newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }
  for (var i = 0; i < newInputs.length; i++) {
    if (newInputs[i] !== lastInputs[i]) {
      return false;
    }
  }
  return true;
}
function memoizeOne(resultFn, isEqual) {
  if (isEqual === void 0) {
    isEqual = areInputsEqual;
  }
  var lastThis;
  var lastArgs = [];
  var lastResult;
  var calledOnce = false;
  function memoized() {
    var newArgs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      newArgs[_i] = arguments[_i];
    }
    if (calledOnce && lastThis === this && isEqual(newArgs, lastArgs)) {
      return lastResult;
    }
    lastResult = resultFn.apply(this, newArgs);
    calledOnce = true;
    lastThis = this;
    lastArgs = newArgs;
    return lastResult;
  }
  return memoized;
}
function isPrimitive(value2) {
  return typeof value2 !== "object" && typeof value2 !== "function" || value2 === null;
}
function MapTree() {
  this.childBranches = /* @__PURE__ */ new WeakMap();
  this.primitiveKeys = /* @__PURE__ */ new Map();
  this.hasValue = false;
  this.value = void 0;
}
MapTree.prototype.has = function has(key) {
  var keyObject = isPrimitive(key) ? this.primitiveKeys.get(key) : key;
  return keyObject ? this.childBranches.has(keyObject) : false;
};
MapTree.prototype.get = function get(key) {
  var keyObject = isPrimitive(key) ? this.primitiveKeys.get(key) : key;
  return keyObject ? this.childBranches.get(keyObject) : void 0;
};
MapTree.prototype.resolveBranch = function resolveBranch(key) {
  if (this.has(key)) {
    return this.get(key);
  }
  var newBranch = new MapTree();
  var keyObject = this.createKey(key);
  this.childBranches.set(keyObject, newBranch);
  return newBranch;
};
MapTree.prototype.setValue = function setValue(value2) {
  this.hasValue = true;
  return this.value = value2;
};
MapTree.prototype.createKey = function createKey(key) {
  if (isPrimitive(key)) {
    var keyObject = {};
    this.primitiveKeys.set(key, keyObject);
    return keyObject;
  }
  return key;
};
MapTree.prototype.clear = function clear() {
  if (arguments.length === 0) {
    this.childBranches = /* @__PURE__ */ new WeakMap();
    this.primitiveKeys.clear();
    this.hasValue = false;
    this.value = void 0;
  } else if (arguments.length === 1) {
    var key = arguments[0];
    if (isPrimitive(key)) {
      var keyObject = this.primitiveKeys.get(key);
      if (keyObject) {
        this.childBranches.delete(keyObject);
        this.primitiveKeys.delete(key);
      }
    } else {
      this.childBranches.delete(key);
    }
  } else {
    var childKey = arguments[0];
    if (this.has(childKey)) {
      var childBranch = this.get(childKey);
      childBranch.clear.apply(childBranch, Array.prototype.slice.call(arguments, 1));
    }
  }
};
var memoize = function memoize2(fn) {
  var argsTree = new MapTree();
  function memoized() {
    var args = Array.prototype.slice.call(arguments);
    var argNode = args.reduce(function getBranch(parentBranch, arg) {
      return parentBranch.resolveBranch(arg);
    }, argsTree);
    if (argNode.hasValue) {
      return argNode.value;
    }
    var value2 = fn.apply(null, args);
    return argNode.setValue(value2);
  }
  memoized.clear = argsTree.clear.bind(argsTree);
  return memoized;
};
var memoizeWeak = memoize;
function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }
    return arr2;
  } else {
    return Array.from(arr);
  }
}
var build = function mutableProxyFactory(defaultTarget) {
  var mutableHandler = void 0;
  var mutableTarget = void 0;
  function setTarget(target) {
    if (!(target instanceof Object)) {
      throw new Error('Target "' + target + '" is not an object');
    }
    mutableTarget = target;
  }
  function setHandler(handler2) {
    Object.keys(handler2).forEach(function(key) {
      var value2 = handler2[key];
      if (typeof value2 !== "function") {
        throw new Error('Trap "' + key + ": " + value2 + '" is not a function');
      }
      if (!Reflect[key]) {
        throw new Error('Trap "' + key + ": " + value2 + '" is not a valid trap');
      }
    });
    mutableHandler = handler2;
  }
  setTarget(function() {
  });
  if (defaultTarget) {
    setTarget(defaultTarget);
  }
  setHandler(Reflect);
  var handler = new Proxy({}, {
    get: function get2(target, property) {
      return function() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        return mutableHandler[property].apply(null, [mutableTarget].concat(_toConsumableArray(args.slice(1))));
      };
    }
  });
  return {
    setTarget,
    setHandler,
    getTarget: function getTarget() {
      return mutableTarget;
    },
    getHandler: function getHandler() {
      return mutableHandler;
    },
    proxy: new Proxy(mutableTarget, handler)
  };
};
var postcss$1 = { exports: {} };
var declaration = { exports: {} };
var node = { exports: {} };
var cssSyntaxError = { exports: {} };
var __viteBrowserExternal = {};
var __viteBrowserExternal$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  "default": __viteBrowserExternal
}, Symbol.toStringTag, { value: "Module" }));
var require$$0 = /* @__PURE__ */ getAugmentedNamespace(__viteBrowserExternal$1);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _supportsColor = _interopRequireDefault(require$$0);
  var _chalk = _interopRequireDefault(require$$0);
  var _terminalHighlight = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? /* @__PURE__ */ new Map() : void 0;
    _wrapNativeSuper = function _wrapNativeSuper2(Class2) {
      if (Class2 === null || !_isNativeFunction(Class2))
        return Class2;
      if (typeof Class2 !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }
      if (typeof _cache !== "undefined") {
        if (_cache.has(Class2))
          return _cache.get(Class2);
        _cache.set(Class2, Wrapper);
      }
      function Wrapper() {
        return _construct(Class2, arguments, _getPrototypeOf(this).constructor);
      }
      Wrapper.prototype = Object.create(Class2.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } });
      return _setPrototypeOf(Wrapper, Class2);
    };
    return _wrapNativeSuper(Class);
  }
  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct)
      return false;
    if (Reflect.construct.sham)
      return false;
    if (typeof Proxy === "function")
      return true;
    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function() {
      }));
      return true;
    } catch (e) {
      return false;
    }
  }
  function _construct(Parent, args, Class) {
    if (isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct2(Parent2, args2, Class2) {
        var a = [null];
        a.push.apply(a, args2);
        var Constructor = Function.bind.apply(Parent2, a);
        var instance = new Constructor();
        if (Class2)
          _setPrototypeOf(instance, Class2.prototype);
        return instance;
      };
    }
    return _construct.apply(null, arguments);
  }
  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
      o2.__proto__ = p2;
      return o2;
    };
    return _setPrototypeOf(o, p);
  }
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o2) {
      return o2.__proto__ || Object.getPrototypeOf(o2);
    };
    return _getPrototypeOf(o);
  }
  var CssSyntaxError = /* @__PURE__ */ function(_Error) {
    _inheritsLoose(CssSyntaxError2, _Error);
    function CssSyntaxError2(message, line, column, source, file, plugin) {
      var _this;
      _this = _Error.call(this, message) || this;
      _this.name = "CssSyntaxError";
      _this.reason = message;
      if (file) {
        _this.file = file;
      }
      if (source) {
        _this.source = source;
      }
      if (plugin) {
        _this.plugin = plugin;
      }
      if (typeof line !== "undefined" && typeof column !== "undefined") {
        _this.line = line;
        _this.column = column;
      }
      _this.setMessage();
      if (Error.captureStackTrace) {
        Error.captureStackTrace(_assertThisInitialized(_this), CssSyntaxError2);
      }
      return _this;
    }
    var _proto = CssSyntaxError2.prototype;
    _proto.setMessage = function setMessage() {
      this.message = this.plugin ? this.plugin + ": " : "";
      this.message += this.file ? this.file : "<css input>";
      if (typeof this.line !== "undefined") {
        this.message += ":" + this.line + ":" + this.column;
      }
      this.message += ": " + this.reason;
    };
    _proto.showSourceCode = function showSourceCode(color) {
      var _this2 = this;
      if (!this.source)
        return "";
      var css = this.source;
      if (_terminalHighlight.default) {
        if (typeof color === "undefined")
          color = _supportsColor.default.stdout;
        if (color)
          css = (0, _terminalHighlight.default)(css);
      }
      var lines = css.split(/\r?\n/);
      var start = Math.max(this.line - 3, 0);
      var end = Math.min(this.line + 2, lines.length);
      var maxWidth = String(end).length;
      function mark(text) {
        if (color && _chalk.default.red) {
          return _chalk.default.red.bold(text);
        }
        return text;
      }
      function aside(text) {
        if (color && _chalk.default.gray) {
          return _chalk.default.gray(text);
        }
        return text;
      }
      return lines.slice(start, end).map(function(line, index) {
        var number2 = start + 1 + index;
        var gutter = " " + (" " + number2).slice(-maxWidth) + " | ";
        if (number2 === _this2.line) {
          var spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, _this2.column - 1).replace(/[^\t]/g, " ");
          return mark(">") + aside(gutter) + line + "\n " + spacing + mark("^");
        }
        return " " + aside(gutter) + line;
      }).join("\n");
    };
    _proto.toString = function toString() {
      var code = this.showSourceCode();
      if (code) {
        code = "\n\n" + code + "\n";
      }
      return this.name + ": " + this.message + code;
    };
    return CssSyntaxError2;
  }(_wrapNativeSuper(Error));
  var _default = CssSyntaxError;
  exports.default = _default;
  module.exports = exports.default;
})(cssSyntaxError, cssSyntaxError.exports);
var stringifier = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var DEFAULT_RAW = {
    colon: ": ",
    indent: "    ",
    beforeDecl: "\n",
    beforeRule: "\n",
    beforeOpen: " ",
    beforeClose: "\n",
    beforeComment: "\n",
    after: "\n",
    emptyBody: "",
    commentLeft: " ",
    commentRight: " ",
    semicolon: false
  };
  function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
  }
  var Stringifier = /* @__PURE__ */ function() {
    function Stringifier2(builder) {
      this.builder = builder;
    }
    var _proto = Stringifier2.prototype;
    _proto.stringify = function stringify2(node2, semicolon) {
      this[node2.type](node2, semicolon);
    };
    _proto.root = function root2(node2) {
      this.body(node2);
      if (node2.raws.after)
        this.builder(node2.raws.after);
    };
    _proto.comment = function comment2(node2) {
      var left = this.raw(node2, "left", "commentLeft");
      var right = this.raw(node2, "right", "commentRight");
      this.builder("/*" + left + node2.text + right + "*/", node2);
    };
    _proto.decl = function decl(node2, semicolon) {
      var between = this.raw(node2, "between", "colon");
      var string2 = node2.prop + between + this.rawValue(node2, "value");
      if (node2.important) {
        string2 += node2.raws.important || " !important";
      }
      if (semicolon)
        string2 += ";";
      this.builder(string2, node2);
    };
    _proto.rule = function rule2(node2) {
      this.block(node2, this.rawValue(node2, "selector"));
      if (node2.raws.ownSemicolon) {
        this.builder(node2.raws.ownSemicolon, node2, "end");
      }
    };
    _proto.atrule = function atrule(node2, semicolon) {
      var name = "@" + node2.name;
      var params = node2.params ? this.rawValue(node2, "params") : "";
      if (typeof node2.raws.afterName !== "undefined") {
        name += node2.raws.afterName;
      } else if (params) {
        name += " ";
      }
      if (node2.nodes) {
        this.block(node2, name + params);
      } else {
        var end = (node2.raws.between || "") + (semicolon ? ";" : "");
        this.builder(name + params + end, node2);
      }
    };
    _proto.body = function body(node2) {
      var last = node2.nodes.length - 1;
      while (last > 0) {
        if (node2.nodes[last].type !== "comment")
          break;
        last -= 1;
      }
      var semicolon = this.raw(node2, "semicolon");
      for (var i = 0; i < node2.nodes.length; i++) {
        var child = node2.nodes[i];
        var before = this.raw(child, "before");
        if (before)
          this.builder(before);
        this.stringify(child, last !== i || semicolon);
      }
    };
    _proto.block = function block(node2, start) {
      var between = this.raw(node2, "between", "beforeOpen");
      this.builder(start + between + "{", node2, "start");
      var after;
      if (node2.nodes && node2.nodes.length) {
        this.body(node2);
        after = this.raw(node2, "after");
      } else {
        after = this.raw(node2, "after", "emptyBody");
      }
      if (after)
        this.builder(after);
      this.builder("}", node2, "end");
    };
    _proto.raw = function raw(node2, own, detect) {
      var value2;
      if (!detect)
        detect = own;
      if (own) {
        value2 = node2.raws[own];
        if (typeof value2 !== "undefined")
          return value2;
      }
      var parent = node2.parent;
      if (detect === "before") {
        if (!parent || parent.type === "root" && parent.first === node2) {
          return "";
        }
      }
      if (!parent)
        return DEFAULT_RAW[detect];
      var root2 = node2.root();
      if (!root2.rawCache)
        root2.rawCache = {};
      if (typeof root2.rawCache[detect] !== "undefined") {
        return root2.rawCache[detect];
      }
      if (detect === "before" || detect === "after") {
        return this.beforeAfter(node2, detect);
      } else {
        var method = "raw" + capitalize(detect);
        if (this[method]) {
          value2 = this[method](root2, node2);
        } else {
          root2.walk(function(i) {
            value2 = i.raws[own];
            if (typeof value2 !== "undefined")
              return false;
          });
        }
      }
      if (typeof value2 === "undefined")
        value2 = DEFAULT_RAW[detect];
      root2.rawCache[detect] = value2;
      return value2;
    };
    _proto.rawSemicolon = function rawSemicolon(root2) {
      var value2;
      root2.walk(function(i) {
        if (i.nodes && i.nodes.length && i.last.type === "decl") {
          value2 = i.raws.semicolon;
          if (typeof value2 !== "undefined")
            return false;
        }
      });
      return value2;
    };
    _proto.rawEmptyBody = function rawEmptyBody(root2) {
      var value2;
      root2.walk(function(i) {
        if (i.nodes && i.nodes.length === 0) {
          value2 = i.raws.after;
          if (typeof value2 !== "undefined")
            return false;
        }
      });
      return value2;
    };
    _proto.rawIndent = function rawIndent(root2) {
      if (root2.raws.indent)
        return root2.raws.indent;
      var value2;
      root2.walk(function(i) {
        var p = i.parent;
        if (p && p !== root2 && p.parent && p.parent === root2) {
          if (typeof i.raws.before !== "undefined") {
            var parts = i.raws.before.split("\n");
            value2 = parts[parts.length - 1];
            value2 = value2.replace(/[^\s]/g, "");
            return false;
          }
        }
      });
      return value2;
    };
    _proto.rawBeforeComment = function rawBeforeComment(root2, node2) {
      var value2;
      root2.walkComments(function(i) {
        if (typeof i.raws.before !== "undefined") {
          value2 = i.raws.before;
          if (value2.indexOf("\n") !== -1) {
            value2 = value2.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value2 === "undefined") {
        value2 = this.raw(node2, null, "beforeDecl");
      } else if (value2) {
        value2 = value2.replace(/[^\s]/g, "");
      }
      return value2;
    };
    _proto.rawBeforeDecl = function rawBeforeDecl(root2, node2) {
      var value2;
      root2.walkDecls(function(i) {
        if (typeof i.raws.before !== "undefined") {
          value2 = i.raws.before;
          if (value2.indexOf("\n") !== -1) {
            value2 = value2.replace(/[^\n]+$/, "");
          }
          return false;
        }
      });
      if (typeof value2 === "undefined") {
        value2 = this.raw(node2, null, "beforeRule");
      } else if (value2) {
        value2 = value2.replace(/[^\s]/g, "");
      }
      return value2;
    };
    _proto.rawBeforeRule = function rawBeforeRule(root2) {
      var value2;
      root2.walk(function(i) {
        if (i.nodes && (i.parent !== root2 || root2.first !== i)) {
          if (typeof i.raws.before !== "undefined") {
            value2 = i.raws.before;
            if (value2.indexOf("\n") !== -1) {
              value2 = value2.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value2)
        value2 = value2.replace(/[^\s]/g, "");
      return value2;
    };
    _proto.rawBeforeClose = function rawBeforeClose(root2) {
      var value2;
      root2.walk(function(i) {
        if (i.nodes && i.nodes.length > 0) {
          if (typeof i.raws.after !== "undefined") {
            value2 = i.raws.after;
            if (value2.indexOf("\n") !== -1) {
              value2 = value2.replace(/[^\n]+$/, "");
            }
            return false;
          }
        }
      });
      if (value2)
        value2 = value2.replace(/[^\s]/g, "");
      return value2;
    };
    _proto.rawBeforeOpen = function rawBeforeOpen(root2) {
      var value2;
      root2.walk(function(i) {
        if (i.type !== "decl") {
          value2 = i.raws.between;
          if (typeof value2 !== "undefined")
            return false;
        }
      });
      return value2;
    };
    _proto.rawColon = function rawColon(root2) {
      var value2;
      root2.walkDecls(function(i) {
        if (typeof i.raws.between !== "undefined") {
          value2 = i.raws.between.replace(/[^\s:]/g, "");
          return false;
        }
      });
      return value2;
    };
    _proto.beforeAfter = function beforeAfter(node2, detect) {
      var value2;
      if (node2.type === "decl") {
        value2 = this.raw(node2, null, "beforeDecl");
      } else if (node2.type === "comment") {
        value2 = this.raw(node2, null, "beforeComment");
      } else if (detect === "before") {
        value2 = this.raw(node2, null, "beforeRule");
      } else {
        value2 = this.raw(node2, null, "beforeClose");
      }
      var buf = node2.parent;
      var depth = 0;
      while (buf && buf.type !== "root") {
        depth += 1;
        buf = buf.parent;
      }
      if (value2.indexOf("\n") !== -1) {
        var indent = this.raw(node2, null, "indent");
        if (indent.length) {
          for (var step = 0; step < depth; step++) {
            value2 += indent;
          }
        }
      }
      return value2;
    };
    _proto.rawValue = function rawValue(node2, prop) {
      var value2 = node2[prop];
      var raw = node2.raws[prop];
      if (raw && raw.value === value2) {
        return raw.raw;
      }
      return value2;
    };
    return Stringifier2;
  }();
  var _default = Stringifier;
  exports.default = _default;
  module.exports = exports.default;
})(stringifier, stringifier.exports);
var stringify = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _stringifier = _interopRequireDefault(stringifier.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function stringify2(node2, builder) {
    var str = new _stringifier.default(builder);
    str.stringify(node2);
  }
  var _default = stringify2;
  exports.default = _default;
  module.exports = exports.default;
})(stringify, stringify.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _cssSyntaxError = _interopRequireDefault(cssSyntaxError.exports);
  var _stringifier = _interopRequireDefault(stringifier.exports);
  var _stringify = _interopRequireDefault(stringify.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function cloneNode2(obj, parent) {
    var cloned = new obj.constructor();
    for (var i in obj) {
      if (!obj.hasOwnProperty(i))
        continue;
      var value2 = obj[i];
      var type = typeof value2;
      if (i === "parent" && type === "object") {
        if (parent)
          cloned[i] = parent;
      } else if (i === "source") {
        cloned[i] = value2;
      } else if (value2 instanceof Array) {
        cloned[i] = value2.map(function(j) {
          return cloneNode2(j, cloned);
        });
      } else {
        if (type === "object" && value2 !== null)
          value2 = cloneNode2(value2);
        cloned[i] = value2;
      }
    }
    return cloned;
  }
  var Node3 = /* @__PURE__ */ function() {
    function Node4(defaults) {
      if (defaults === void 0) {
        defaults = {};
      }
      this.raws = {};
      for (var name in defaults) {
        this[name] = defaults[name];
      }
    }
    var _proto = Node4.prototype;
    _proto.error = function error(message, opts) {
      if (opts === void 0) {
        opts = {};
      }
      if (this.source) {
        var pos = this.positionBy(opts);
        return this.source.input.error(message, pos.line, pos.column, opts);
      }
      return new _cssSyntaxError.default(message);
    };
    _proto.warn = function warn(result2, text, opts) {
      var data = {
        node: this
      };
      for (var i in opts) {
        data[i] = opts[i];
      }
      return result2.warn(text, data);
    };
    _proto.remove = function remove() {
      if (this.parent) {
        this.parent.removeChild(this);
      }
      this.parent = void 0;
      return this;
    };
    _proto.toString = function toString(stringifier2) {
      if (stringifier2 === void 0) {
        stringifier2 = _stringify.default;
      }
      if (stringifier2.stringify)
        stringifier2 = stringifier2.stringify;
      var result2 = "";
      stringifier2(this, function(i) {
        result2 += i;
      });
      return result2;
    };
    _proto.clone = function clone(overrides) {
      if (overrides === void 0) {
        overrides = {};
      }
      var cloned = cloneNode2(this);
      for (var name in overrides) {
        cloned[name] = overrides[name];
      }
      return cloned;
    };
    _proto.cloneBefore = function cloneBefore(overrides) {
      if (overrides === void 0) {
        overrides = {};
      }
      var cloned = this.clone(overrides);
      this.parent.insertBefore(this, cloned);
      return cloned;
    };
    _proto.cloneAfter = function cloneAfter(overrides) {
      if (overrides === void 0) {
        overrides = {};
      }
      var cloned = this.clone(overrides);
      this.parent.insertAfter(this, cloned);
      return cloned;
    };
    _proto.replaceWith = function replaceWith() {
      if (this.parent) {
        for (var _len = arguments.length, nodes = new Array(_len), _key = 0; _key < _len; _key++) {
          nodes[_key] = arguments[_key];
        }
        for (var _i = 0, _nodes = nodes; _i < _nodes.length; _i++) {
          var node2 = _nodes[_i];
          this.parent.insertBefore(this, node2);
        }
        this.remove();
      }
      return this;
    };
    _proto.next = function next() {
      if (!this.parent)
        return void 0;
      var index = this.parent.index(this);
      return this.parent.nodes[index + 1];
    };
    _proto.prev = function prev() {
      if (!this.parent)
        return void 0;
      var index = this.parent.index(this);
      return this.parent.nodes[index - 1];
    };
    _proto.before = function before(add) {
      this.parent.insertBefore(this, add);
      return this;
    };
    _proto.after = function after(add) {
      this.parent.insertAfter(this, add);
      return this;
    };
    _proto.toJSON = function toJSON() {
      var fixed = {};
      for (var name in this) {
        if (!this.hasOwnProperty(name))
          continue;
        if (name === "parent")
          continue;
        var value2 = this[name];
        if (value2 instanceof Array) {
          fixed[name] = value2.map(function(i) {
            if (typeof i === "object" && i.toJSON) {
              return i.toJSON();
            } else {
              return i;
            }
          });
        } else if (typeof value2 === "object" && value2.toJSON) {
          fixed[name] = value2.toJSON();
        } else {
          fixed[name] = value2;
        }
      }
      return fixed;
    };
    _proto.raw = function raw(prop, defaultType) {
      var str = new _stringifier.default();
      return str.raw(this, prop, defaultType);
    };
    _proto.root = function root2() {
      var result2 = this;
      while (result2.parent) {
        result2 = result2.parent;
      }
      return result2;
    };
    _proto.cleanRaws = function cleanRaws(keepBetween) {
      delete this.raws.before;
      delete this.raws.after;
      if (!keepBetween)
        delete this.raws.between;
    };
    _proto.positionInside = function positionInside(index) {
      var string2 = this.toString();
      var column = this.source.start.column;
      var line = this.source.start.line;
      for (var i = 0; i < index; i++) {
        if (string2[i] === "\n") {
          column = 1;
          line += 1;
        } else {
          column += 1;
        }
      }
      return {
        line,
        column
      };
    };
    _proto.positionBy = function positionBy(opts) {
      var pos = this.source.start;
      if (opts.index) {
        pos = this.positionInside(opts.index);
      } else if (opts.word) {
        var index = this.toString().indexOf(opts.word);
        if (index !== -1)
          pos = this.positionInside(index);
      }
      return pos;
    };
    return Node4;
  }();
  var _default = Node3;
  exports.default = _default;
  module.exports = exports.default;
})(node, node.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _node = _interopRequireDefault(node.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  var Declaration = /* @__PURE__ */ function(_Node) {
    _inheritsLoose(Declaration2, _Node);
    function Declaration2(defaults) {
      var _this;
      _this = _Node.call(this, defaults) || this;
      _this.type = "decl";
      return _this;
    }
    return Declaration2;
  }(_node.default);
  var _default = Declaration;
  exports.default = _default;
  module.exports = exports.default;
})(declaration, declaration.exports);
var processor = { exports: {} };
var lazyResult = { exports: {} };
var mapGenerator = { exports: {} };
var sourceMap = {};
var sourceMapGenerator = {};
var base64Vlq = {};
var base64$1 = {};
var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
base64$1.encode = function(number2) {
  if (0 <= number2 && number2 < intToCharMap.length) {
    return intToCharMap[number2];
  }
  throw new TypeError("Must be between 0 and 63: " + number2);
};
base64$1.decode = function(charCode) {
  var bigA = 65;
  var bigZ = 90;
  var littleA = 97;
  var littleZ = 122;
  var zero = 48;
  var nine = 57;
  var plus2 = 43;
  var slash2 = 47;
  var littleOffset = 26;
  var numberOffset = 52;
  if (bigA <= charCode && charCode <= bigZ) {
    return charCode - bigA;
  }
  if (littleA <= charCode && charCode <= littleZ) {
    return charCode - littleA + littleOffset;
  }
  if (zero <= charCode && charCode <= nine) {
    return charCode - zero + numberOffset;
  }
  if (charCode == plus2) {
    return 62;
  }
  if (charCode == slash2) {
    return 63;
  }
  return -1;
};
var base64 = base64$1;
var VLQ_BASE_SHIFT = 5;
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
var VLQ_BASE_MASK = VLQ_BASE - 1;
var VLQ_CONTINUATION_BIT = VLQ_BASE;
function toVLQSigned(aValue) {
  return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
}
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative ? -shifted : shifted;
}
base64Vlq.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;
  var vlq = toVLQSigned(aValue);
  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);
  return encoded;
};
base64Vlq.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result2 = 0;
  var shift = 0;
  var continuation, digit;
  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }
    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }
    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result2 = result2 + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);
  aOutParam.value = fromVLQSigned(result2);
  aOutParam.rest = aIndex;
};
var util$6 = {};
(function(exports) {
  function getArg(aArgs, aName, aDefaultValue) {
    if (aName in aArgs) {
      return aArgs[aName];
    } else if (arguments.length === 3) {
      return aDefaultValue;
    } else {
      throw new Error('"' + aName + '" is a required argument.');
    }
  }
  exports.getArg = getArg;
  var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
  var dataUrlRegexp = /^data:.+\,.+$/;
  function urlParse(aUrl) {
    var match = aUrl.match(urlRegexp);
    if (!match) {
      return null;
    }
    return {
      scheme: match[1],
      auth: match[2],
      host: match[3],
      port: match[4],
      path: match[5]
    };
  }
  exports.urlParse = urlParse;
  function urlGenerate(aParsedUrl) {
    var url = "";
    if (aParsedUrl.scheme) {
      url += aParsedUrl.scheme + ":";
    }
    url += "//";
    if (aParsedUrl.auth) {
      url += aParsedUrl.auth + "@";
    }
    if (aParsedUrl.host) {
      url += aParsedUrl.host;
    }
    if (aParsedUrl.port) {
      url += ":" + aParsedUrl.port;
    }
    if (aParsedUrl.path) {
      url += aParsedUrl.path;
    }
    return url;
  }
  exports.urlGenerate = urlGenerate;
  function normalize(aPath) {
    var path = aPath;
    var url = urlParse(aPath);
    if (url) {
      if (!url.path) {
        return aPath;
      }
      path = url.path;
    }
    var isAbsolute = exports.isAbsolute(path);
    var parts = path.split(/\/+/);
    for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
      part = parts[i];
      if (part === ".") {
        parts.splice(i, 1);
      } else if (part === "..") {
        up++;
      } else if (up > 0) {
        if (part === "") {
          parts.splice(i + 1, up);
          up = 0;
        } else {
          parts.splice(i, 2);
          up--;
        }
      }
    }
    path = parts.join("/");
    if (path === "") {
      path = isAbsolute ? "/" : ".";
    }
    if (url) {
      url.path = path;
      return urlGenerate(url);
    }
    return path;
  }
  exports.normalize = normalize;
  function join(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    if (aPath === "") {
      aPath = ".";
    }
    var aPathUrl = urlParse(aPath);
    var aRootUrl = urlParse(aRoot);
    if (aRootUrl) {
      aRoot = aRootUrl.path || "/";
    }
    if (aPathUrl && !aPathUrl.scheme) {
      if (aRootUrl) {
        aPathUrl.scheme = aRootUrl.scheme;
      }
      return urlGenerate(aPathUrl);
    }
    if (aPathUrl || aPath.match(dataUrlRegexp)) {
      return aPath;
    }
    if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
      aRootUrl.host = aPath;
      return urlGenerate(aRootUrl);
    }
    var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
    if (aRootUrl) {
      aRootUrl.path = joined;
      return urlGenerate(aRootUrl);
    }
    return joined;
  }
  exports.join = join;
  exports.isAbsolute = function(aPath) {
    return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
  };
  function relative(aRoot, aPath) {
    if (aRoot === "") {
      aRoot = ".";
    }
    aRoot = aRoot.replace(/\/$/, "");
    var level = 0;
    while (aPath.indexOf(aRoot + "/") !== 0) {
      var index = aRoot.lastIndexOf("/");
      if (index < 0) {
        return aPath;
      }
      aRoot = aRoot.slice(0, index);
      if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
        return aPath;
      }
      ++level;
    }
    return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
  }
  exports.relative = relative;
  var supportsNullProto = function() {
    var obj = /* @__PURE__ */ Object.create(null);
    return !("__proto__" in obj);
  }();
  function identity(s) {
    return s;
  }
  function toSetString(aStr) {
    if (isProtoString(aStr)) {
      return "$" + aStr;
    }
    return aStr;
  }
  exports.toSetString = supportsNullProto ? identity : toSetString;
  function fromSetString(aStr) {
    if (isProtoString(aStr)) {
      return aStr.slice(1);
    }
    return aStr;
  }
  exports.fromSetString = supportsNullProto ? identity : fromSetString;
  function isProtoString(s) {
    if (!s) {
      return false;
    }
    var length = s.length;
    if (length < 9) {
      return false;
    }
    if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
      return false;
    }
    for (var i = length - 10; i >= 0; i--) {
      if (s.charCodeAt(i) !== 36) {
        return false;
      }
    }
    return true;
  }
  function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
    var cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0 || onlyCompareOriginal) {
      return cmp;
    }
    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }
    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByOriginalPositions = compareByOriginalPositions;
  function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0 || onlyCompareGenerated) {
      return cmp;
    }
    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }
    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
  function strcmp(aStr1, aStr2) {
    if (aStr1 === aStr2) {
      return 0;
    }
    if (aStr1 === null) {
      return 1;
    }
    if (aStr2 === null) {
      return -1;
    }
    if (aStr1 > aStr2) {
      return 1;
    }
    return -1;
  }
  function compareByGeneratedPositionsInflated(mappingA, mappingB) {
    var cmp = mappingA.generatedLine - mappingB.generatedLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.generatedColumn - mappingB.generatedColumn;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = strcmp(mappingA.source, mappingB.source);
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalLine - mappingB.originalLine;
    if (cmp !== 0) {
      return cmp;
    }
    cmp = mappingA.originalColumn - mappingB.originalColumn;
    if (cmp !== 0) {
      return cmp;
    }
    return strcmp(mappingA.name, mappingB.name);
  }
  exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
  function parseSourceMapInput(str) {
    return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
  }
  exports.parseSourceMapInput = parseSourceMapInput;
  function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
    sourceURL = sourceURL || "";
    if (sourceRoot) {
      if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
        sourceRoot += "/";
      }
      sourceURL = sourceRoot + sourceURL;
    }
    if (sourceMapURL) {
      var parsed = urlParse(sourceMapURL);
      if (!parsed) {
        throw new Error("sourceMapURL could not be parsed");
      }
      if (parsed.path) {
        var index = parsed.path.lastIndexOf("/");
        if (index >= 0) {
          parsed.path = parsed.path.substring(0, index + 1);
        }
      }
      sourceURL = join(urlGenerate(parsed), sourceURL);
    }
    return normalize(sourceURL);
  }
  exports.computeSourceURL = computeSourceURL;
})(util$6);
var arraySet = {};
var util$5 = util$6;
var has2 = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";
function ArraySet$2() {
  this._array = [];
  this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
}
ArraySet$2.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet$2();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};
ArraySet$2.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};
ArraySet$2.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util$5.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has2.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};
ArraySet$2.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util$5.toSetString(aStr);
    return has2.call(this._set, sStr);
  }
};
ArraySet$2.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
      return idx;
    }
  } else {
    var sStr = util$5.toSetString(aStr);
    if (has2.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }
  throw new Error('"' + aStr + '" is not in the set.');
};
ArraySet$2.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error("No element indexed by " + aIdx);
};
ArraySet$2.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};
arraySet.ArraySet = ArraySet$2;
var mappingList = {};
var util$4 = util$6;
function generatedPositionAfter(mappingA, mappingB) {
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA || util$4.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}
function MappingList$1() {
  this._array = [];
  this._sorted = true;
  this._last = { generatedLine: -1, generatedColumn: 0 };
}
MappingList$1.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
  this._array.forEach(aCallback, aThisArg);
};
MappingList$1.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};
MappingList$1.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util$4.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};
mappingList.MappingList = MappingList$1;
var base64VLQ$1 = base64Vlq;
var util$3 = util$6;
var ArraySet$1 = arraySet.ArraySet;
var MappingList = mappingList.MappingList;
function SourceMapGenerator$1(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util$3.getArg(aArgs, "file", null);
  this._sourceRoot = util$3.getArg(aArgs, "sourceRoot", null);
  this._skipValidation = util$3.getArg(aArgs, "skipValidation", false);
  this._sources = new ArraySet$1();
  this._names = new ArraySet$1();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}
SourceMapGenerator$1.prototype._version = 3;
SourceMapGenerator$1.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
  var sourceRoot = aSourceMapConsumer.sourceRoot;
  var generator = new SourceMapGenerator$1({
    file: aSourceMapConsumer.file,
    sourceRoot
  });
  aSourceMapConsumer.eachMapping(function(mapping) {
    var newMapping = {
      generated: {
        line: mapping.generatedLine,
        column: mapping.generatedColumn
      }
    };
    if (mapping.source != null) {
      newMapping.source = mapping.source;
      if (sourceRoot != null) {
        newMapping.source = util$3.relative(sourceRoot, newMapping.source);
      }
      newMapping.original = {
        line: mapping.originalLine,
        column: mapping.originalColumn
      };
      if (mapping.name != null) {
        newMapping.name = mapping.name;
      }
    }
    generator.addMapping(newMapping);
  });
  aSourceMapConsumer.sources.forEach(function(sourceFile) {
    var sourceRelative = sourceFile;
    if (sourceRoot !== null) {
      sourceRelative = util$3.relative(sourceRoot, sourceFile);
    }
    if (!generator._sources.has(sourceRelative)) {
      generator._sources.add(sourceRelative);
    }
    var content = aSourceMapConsumer.sourceContentFor(sourceFile);
    if (content != null) {
      generator.setSourceContent(sourceFile, content);
    }
  });
  return generator;
};
SourceMapGenerator$1.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
  var generated = util$3.getArg(aArgs, "generated");
  var original = util$3.getArg(aArgs, "original", null);
  var source = util$3.getArg(aArgs, "source", null);
  var name = util$3.getArg(aArgs, "name", null);
  if (!this._skipValidation) {
    this._validateMapping(generated, original, source, name);
  }
  if (source != null) {
    source = String(source);
    if (!this._sources.has(source)) {
      this._sources.add(source);
    }
  }
  if (name != null) {
    name = String(name);
    if (!this._names.has(name)) {
      this._names.add(name);
    }
  }
  this._mappings.add({
    generatedLine: generated.line,
    generatedColumn: generated.column,
    originalLine: original != null && original.line,
    originalColumn: original != null && original.column,
    source,
    name
  });
};
SourceMapGenerator$1.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
  var source = aSourceFile;
  if (this._sourceRoot != null) {
    source = util$3.relative(this._sourceRoot, source);
  }
  if (aSourceContent != null) {
    if (!this._sourcesContents) {
      this._sourcesContents = /* @__PURE__ */ Object.create(null);
    }
    this._sourcesContents[util$3.toSetString(source)] = aSourceContent;
  } else if (this._sourcesContents) {
    delete this._sourcesContents[util$3.toSetString(source)];
    if (Object.keys(this._sourcesContents).length === 0) {
      this._sourcesContents = null;
    }
  }
};
SourceMapGenerator$1.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
  var sourceFile = aSourceFile;
  if (aSourceFile == null) {
    if (aSourceMapConsumer.file == null) {
      throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);
    }
    sourceFile = aSourceMapConsumer.file;
  }
  var sourceRoot = this._sourceRoot;
  if (sourceRoot != null) {
    sourceFile = util$3.relative(sourceRoot, sourceFile);
  }
  var newSources = new ArraySet$1();
  var newNames = new ArraySet$1();
  this._mappings.unsortedForEach(function(mapping) {
    if (mapping.source === sourceFile && mapping.originalLine != null) {
      var original = aSourceMapConsumer.originalPositionFor({
        line: mapping.originalLine,
        column: mapping.originalColumn
      });
      if (original.source != null) {
        mapping.source = original.source;
        if (aSourceMapPath != null) {
          mapping.source = util$3.join(aSourceMapPath, mapping.source);
        }
        if (sourceRoot != null) {
          mapping.source = util$3.relative(sourceRoot, mapping.source);
        }
        mapping.originalLine = original.line;
        mapping.originalColumn = original.column;
        if (original.name != null) {
          mapping.name = original.name;
        }
      }
    }
    var source = mapping.source;
    if (source != null && !newSources.has(source)) {
      newSources.add(source);
    }
    var name = mapping.name;
    if (name != null && !newNames.has(name)) {
      newNames.add(name);
    }
  }, this);
  this._sources = newSources;
  this._names = newNames;
  aSourceMapConsumer.sources.forEach(function(sourceFile2) {
    var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
    if (content != null) {
      if (aSourceMapPath != null) {
        sourceFile2 = util$3.join(aSourceMapPath, sourceFile2);
      }
      if (sourceRoot != null) {
        sourceFile2 = util$3.relative(sourceRoot, sourceFile2);
      }
      this.setSourceContent(sourceFile2, content);
    }
  }, this);
};
SourceMapGenerator$1.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
  if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
    throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
  }
  if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
    return;
  } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
    return;
  } else {
    throw new Error("Invalid mapping: " + JSON.stringify({
      generated: aGenerated,
      source: aSource,
      original: aOriginal,
      name: aName
    }));
  }
};
SourceMapGenerator$1.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
  var previousGeneratedColumn = 0;
  var previousGeneratedLine = 1;
  var previousOriginalColumn = 0;
  var previousOriginalLine = 0;
  var previousName = 0;
  var previousSource = 0;
  var result2 = "";
  var next;
  var mapping;
  var nameIdx;
  var sourceIdx;
  var mappings = this._mappings.toArray();
  for (var i = 0, len = mappings.length; i < len; i++) {
    mapping = mappings[i];
    next = "";
    if (mapping.generatedLine !== previousGeneratedLine) {
      previousGeneratedColumn = 0;
      while (mapping.generatedLine !== previousGeneratedLine) {
        next += ";";
        previousGeneratedLine++;
      }
    } else {
      if (i > 0) {
        if (!util$3.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
          continue;
        }
        next += ",";
      }
    }
    next += base64VLQ$1.encode(mapping.generatedColumn - previousGeneratedColumn);
    previousGeneratedColumn = mapping.generatedColumn;
    if (mapping.source != null) {
      sourceIdx = this._sources.indexOf(mapping.source);
      next += base64VLQ$1.encode(sourceIdx - previousSource);
      previousSource = sourceIdx;
      next += base64VLQ$1.encode(mapping.originalLine - 1 - previousOriginalLine);
      previousOriginalLine = mapping.originalLine - 1;
      next += base64VLQ$1.encode(mapping.originalColumn - previousOriginalColumn);
      previousOriginalColumn = mapping.originalColumn;
      if (mapping.name != null) {
        nameIdx = this._names.indexOf(mapping.name);
        next += base64VLQ$1.encode(nameIdx - previousName);
        previousName = nameIdx;
      }
    }
    result2 += next;
  }
  return result2;
};
SourceMapGenerator$1.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
  return aSources.map(function(source) {
    if (!this._sourcesContents) {
      return null;
    }
    if (aSourceRoot != null) {
      source = util$3.relative(aSourceRoot, source);
    }
    var key = util$3.toSetString(source);
    return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
  }, this);
};
SourceMapGenerator$1.prototype.toJSON = function SourceMapGenerator_toJSON() {
  var map = {
    version: this._version,
    sources: this._sources.toArray(),
    names: this._names.toArray(),
    mappings: this._serializeMappings()
  };
  if (this._file != null) {
    map.file = this._file;
  }
  if (this._sourceRoot != null) {
    map.sourceRoot = this._sourceRoot;
  }
  if (this._sourcesContents) {
    map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
  }
  return map;
};
SourceMapGenerator$1.prototype.toString = function SourceMapGenerator_toString() {
  return JSON.stringify(this.toJSON());
};
sourceMapGenerator.SourceMapGenerator = SourceMapGenerator$1;
var sourceMapConsumer = {};
var binarySearch$1 = {};
(function(exports) {
  exports.GREATEST_LOWER_BOUND = 1;
  exports.LEAST_UPPER_BOUND = 2;
  function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
    var mid = Math.floor((aHigh - aLow) / 2) + aLow;
    var cmp = aCompare(aNeedle, aHaystack[mid], true);
    if (cmp === 0) {
      return mid;
    } else if (cmp > 0) {
      if (aHigh - mid > 1) {
        return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
      }
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return aHigh < aHaystack.length ? aHigh : -1;
      } else {
        return mid;
      }
    } else {
      if (mid - aLow > 1) {
        return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
      }
      if (aBias == exports.LEAST_UPPER_BOUND) {
        return mid;
      } else {
        return aLow < 0 ? -1 : aLow;
      }
    }
  }
  exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
    if (aHaystack.length === 0) {
      return -1;
    }
    var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack, aCompare, aBias || exports.GREATEST_LOWER_BOUND);
    if (index < 0) {
      return -1;
    }
    while (index - 1 >= 0) {
      if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
        break;
      }
      --index;
    }
    return index;
  };
})(binarySearch$1);
var quickSort$1 = {};
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}
function randomIntInRange(low, high) {
  return Math.round(low + Math.random() * (high - low));
}
function doQuickSort(ary, comparator, p, r) {
  if (p < r) {
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;
    swap(ary, pivotIndex, r);
    var pivot = ary[r];
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }
    swap(ary, i + 1, j);
    var q = i + 1;
    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}
quickSort$1.quickSort = function(ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};
var util$2 = util$6;
var binarySearch = binarySearch$1;
var ArraySet = arraySet.ArraySet;
var base64VLQ = base64Vlq;
var quickSort = quickSort$1.quickSort;
function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap2 = aSourceMap;
  if (typeof aSourceMap === "string") {
    sourceMap2 = util$2.parseSourceMapInput(aSourceMap);
  }
  return sourceMap2.sections != null ? new IndexedSourceMapConsumer(sourceMap2, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap2, aSourceMapURL);
}
SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
};
SourceMapConsumer.prototype._version = 3;
SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
  configurable: true,
  enumerable: true,
  get: function() {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }
    return this.__generatedMappings;
  }
});
SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
  configurable: true,
  enumerable: true,
  get: function() {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }
    return this.__originalMappings;
  }
});
SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
  var c = aStr.charAt(index);
  return c === ";" || c === ",";
};
SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
  throw new Error("Subclasses must implement _parseMappings");
};
SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;
SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;
SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
  var context = aContext || null;
  var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
  var mappings;
  switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
  }
  var sourceRoot = this.sourceRoot;
  mappings.map(function(mapping) {
    var source = mapping.source === null ? null : this._sources.at(mapping.source);
    source = util$2.computeSourceURL(sourceRoot, source, this._sourceMapURL);
    return {
      source,
      generatedLine: mapping.generatedLine,
      generatedColumn: mapping.generatedColumn,
      originalLine: mapping.originalLine,
      originalColumn: mapping.originalColumn,
      name: mapping.name === null ? null : this._names.at(mapping.name)
    };
  }, this).forEach(aCallback, context);
};
SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
  var line = util$2.getArg(aArgs, "line");
  var needle = {
    source: util$2.getArg(aArgs, "source"),
    originalLine: line,
    originalColumn: util$2.getArg(aArgs, "column", 0)
  };
  needle.source = this._findSourceIndex(needle.source);
  if (needle.source < 0) {
    return [];
  }
  var mappings = [];
  var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util$2.compareByOriginalPositions, binarySearch.LEAST_UPPER_BOUND);
  if (index >= 0) {
    var mapping = this._originalMappings[index];
    if (aArgs.column === void 0) {
      var originalLine = mapping.originalLine;
      while (mapping && mapping.originalLine === originalLine) {
        mappings.push({
          line: util$2.getArg(mapping, "generatedLine", null),
          column: util$2.getArg(mapping, "generatedColumn", null),
          lastColumn: util$2.getArg(mapping, "lastGeneratedColumn", null)
        });
        mapping = this._originalMappings[++index];
      }
    } else {
      var originalColumn = mapping.originalColumn;
      while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
        mappings.push({
          line: util$2.getArg(mapping, "generatedLine", null),
          column: util$2.getArg(mapping, "generatedColumn", null),
          lastColumn: util$2.getArg(mapping, "lastGeneratedColumn", null)
        });
        mapping = this._originalMappings[++index];
      }
    }
  }
  return mappings;
};
sourceMapConsumer.SourceMapConsumer = SourceMapConsumer;
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap2 = aSourceMap;
  if (typeof aSourceMap === "string") {
    sourceMap2 = util$2.parseSourceMapInput(aSourceMap);
  }
  var version = util$2.getArg(sourceMap2, "version");
  var sources = util$2.getArg(sourceMap2, "sources");
  var names = util$2.getArg(sourceMap2, "names", []);
  var sourceRoot = util$2.getArg(sourceMap2, "sourceRoot", null);
  var sourcesContent = util$2.getArg(sourceMap2, "sourcesContent", null);
  var mappings = util$2.getArg(sourceMap2, "mappings");
  var file = util$2.getArg(sourceMap2, "file", null);
  if (version != this._version) {
    throw new Error("Unsupported version: " + version);
  }
  if (sourceRoot) {
    sourceRoot = util$2.normalize(sourceRoot);
  }
  sources = sources.map(String).map(util$2.normalize).map(function(source) {
    return sourceRoot && util$2.isAbsolute(sourceRoot) && util$2.isAbsolute(source) ? util$2.relative(sourceRoot, source) : source;
  });
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);
  this._absoluteSources = this._sources.toArray().map(function(s) {
    return util$2.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });
  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}
BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util$2.relative(this.sourceRoot, relativeSource);
  }
  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }
  return -1;
};
BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
  var smc = Object.create(BasicSourceMapConsumer.prototype);
  var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
  var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
  smc.sourceRoot = aSourceMap._sourceRoot;
  smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(), smc.sourceRoot);
  smc.file = aSourceMap._file;
  smc._sourceMapURL = aSourceMapURL;
  smc._absoluteSources = smc._sources.toArray().map(function(s) {
    return util$2.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
  });
  var generatedMappings = aSourceMap._mappings.toArray().slice();
  var destGeneratedMappings = smc.__generatedMappings = [];
  var destOriginalMappings = smc.__originalMappings = [];
  for (var i = 0, length = generatedMappings.length; i < length; i++) {
    var srcMapping = generatedMappings[i];
    var destMapping = new Mapping();
    destMapping.generatedLine = srcMapping.generatedLine;
    destMapping.generatedColumn = srcMapping.generatedColumn;
    if (srcMapping.source) {
      destMapping.source = sources.indexOf(srcMapping.source);
      destMapping.originalLine = srcMapping.originalLine;
      destMapping.originalColumn = srcMapping.originalColumn;
      if (srcMapping.name) {
        destMapping.name = names.indexOf(srcMapping.name);
      }
      destOriginalMappings.push(destMapping);
    }
    destGeneratedMappings.push(destMapping);
  }
  quickSort(smc.__originalMappings, util$2.compareByOriginalPositions);
  return smc;
};
BasicSourceMapConsumer.prototype._version = 3;
Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
  get: function() {
    return this._absoluteSources.slice();
  }
});
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}
BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings2(aStr, aSourceRoot) {
  var generatedLine = 1;
  var previousGeneratedColumn = 0;
  var previousOriginalLine = 0;
  var previousOriginalColumn = 0;
  var previousSource = 0;
  var previousName = 0;
  var length = aStr.length;
  var index = 0;
  var cachedSegments = {};
  var temp = {};
  var originalMappings = [];
  var generatedMappings = [];
  var mapping, str, segment, end, value2;
  while (index < length) {
    if (aStr.charAt(index) === ";") {
      generatedLine++;
      index++;
      previousGeneratedColumn = 0;
    } else if (aStr.charAt(index) === ",") {
      index++;
    } else {
      mapping = new Mapping();
      mapping.generatedLine = generatedLine;
      for (end = index; end < length; end++) {
        if (this._charIsMappingSeparator(aStr, end)) {
          break;
        }
      }
      str = aStr.slice(index, end);
      segment = cachedSegments[str];
      if (segment) {
        index += str.length;
      } else {
        segment = [];
        while (index < end) {
          base64VLQ.decode(aStr, index, temp);
          value2 = temp.value;
          index = temp.rest;
          segment.push(value2);
        }
        if (segment.length === 2) {
          throw new Error("Found a source, but no line and column");
        }
        if (segment.length === 3) {
          throw new Error("Found a source and line, but no column");
        }
        cachedSegments[str] = segment;
      }
      mapping.generatedColumn = previousGeneratedColumn + segment[0];
      previousGeneratedColumn = mapping.generatedColumn;
      if (segment.length > 1) {
        mapping.source = previousSource + segment[1];
        previousSource += segment[1];
        mapping.originalLine = previousOriginalLine + segment[2];
        previousOriginalLine = mapping.originalLine;
        mapping.originalLine += 1;
        mapping.originalColumn = previousOriginalColumn + segment[3];
        previousOriginalColumn = mapping.originalColumn;
        if (segment.length > 4) {
          mapping.name = previousName + segment[4];
          previousName += segment[4];
        }
      }
      generatedMappings.push(mapping);
      if (typeof mapping.originalLine === "number") {
        originalMappings.push(mapping);
      }
    }
  }
  quickSort(generatedMappings, util$2.compareByGeneratedPositionsDeflated);
  this.__generatedMappings = generatedMappings;
  quickSort(originalMappings, util$2.compareByOriginalPositions);
  this.__originalMappings = originalMappings;
};
BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
  if (aNeedle[aLineName] <= 0) {
    throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
  }
  if (aNeedle[aColumnName] < 0) {
    throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
  }
  return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
};
BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
  for (var index = 0; index < this._generatedMappings.length; ++index) {
    var mapping = this._generatedMappings[index];
    if (index + 1 < this._generatedMappings.length) {
      var nextMapping = this._generatedMappings[index + 1];
      if (mapping.generatedLine === nextMapping.generatedLine) {
        mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
        continue;
      }
    }
    mapping.lastGeneratedColumn = Infinity;
  }
};
BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
  var needle = {
    generatedLine: util$2.getArg(aArgs, "line"),
    generatedColumn: util$2.getArg(aArgs, "column")
  };
  var index = this._findMapping(needle, this._generatedMappings, "generatedLine", "generatedColumn", util$2.compareByGeneratedPositionsDeflated, util$2.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
  if (index >= 0) {
    var mapping = this._generatedMappings[index];
    if (mapping.generatedLine === needle.generatedLine) {
      var source = util$2.getArg(mapping, "source", null);
      if (source !== null) {
        source = this._sources.at(source);
        source = util$2.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
      }
      var name = util$2.getArg(mapping, "name", null);
      if (name !== null) {
        name = this._names.at(name);
      }
      return {
        source,
        line: util$2.getArg(mapping, "originalLine", null),
        column: util$2.getArg(mapping, "originalColumn", null),
        name
      };
    }
  }
  return {
    source: null,
    line: null,
    column: null,
    name: null
  };
};
BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
  if (!this.sourcesContent) {
    return false;
  }
  return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
    return sc == null;
  });
};
BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
  if (!this.sourcesContent) {
    return null;
  }
  var index = this._findSourceIndex(aSource);
  if (index >= 0) {
    return this.sourcesContent[index];
  }
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util$2.relative(this.sourceRoot, relativeSource);
  }
  var url;
  if (this.sourceRoot != null && (url = util$2.urlParse(this.sourceRoot))) {
    var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
    if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
      return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
    }
    if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
      return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
    }
  }
  if (nullOnMissing) {
    return null;
  } else {
    throw new Error('"' + relativeSource + '" is not in the SourceMap.');
  }
};
BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
  var source = util$2.getArg(aArgs, "source");
  source = this._findSourceIndex(source);
  if (source < 0) {
    return {
      line: null,
      column: null,
      lastColumn: null
    };
  }
  var needle = {
    source,
    originalLine: util$2.getArg(aArgs, "line"),
    originalColumn: util$2.getArg(aArgs, "column")
  };
  var index = this._findMapping(needle, this._originalMappings, "originalLine", "originalColumn", util$2.compareByOriginalPositions, util$2.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND));
  if (index >= 0) {
    var mapping = this._originalMappings[index];
    if (mapping.source === needle.source) {
      return {
        line: util$2.getArg(mapping, "generatedLine", null),
        column: util$2.getArg(mapping, "generatedColumn", null),
        lastColumn: util$2.getArg(mapping, "lastGeneratedColumn", null)
      };
    }
  }
  return {
    line: null,
    column: null,
    lastColumn: null
  };
};
sourceMapConsumer.BasicSourceMapConsumer = BasicSourceMapConsumer;
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap2 = aSourceMap;
  if (typeof aSourceMap === "string") {
    sourceMap2 = util$2.parseSourceMapInput(aSourceMap);
  }
  var version = util$2.getArg(sourceMap2, "version");
  var sections = util$2.getArg(sourceMap2, "sections");
  if (version != this._version) {
    throw new Error("Unsupported version: " + version);
  }
  this._sources = new ArraySet();
  this._names = new ArraySet();
  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function(s) {
    if (s.url) {
      throw new Error("Support for url field in sections not implemented.");
    }
    var offset = util$2.getArg(s, "offset");
    var offsetLine = util$2.getArg(offset, "line");
    var offsetColumn = util$2.getArg(offset, "column");
    if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
      throw new Error("Section offsets must be ordered and non-overlapping.");
    }
    lastOffset = offset;
    return {
      generatedOffset: {
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util$2.getArg(s, "map"), aSourceMapURL)
    };
  });
}
IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
IndexedSourceMapConsumer.prototype._version = 3;
Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
  get: function() {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});
IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
  var needle = {
    generatedLine: util$2.getArg(aArgs, "line"),
    generatedColumn: util$2.getArg(aArgs, "column")
  };
  var sectionIndex = binarySearch.search(needle, this._sections, function(needle2, section2) {
    var cmp = needle2.generatedLine - section2.generatedOffset.generatedLine;
    if (cmp) {
      return cmp;
    }
    return needle2.generatedColumn - section2.generatedOffset.generatedColumn;
  });
  var section = this._sections[sectionIndex];
  if (!section) {
    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  }
  return section.consumer.originalPositionFor({
    line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
    column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
    bias: aArgs.bias
  });
};
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
  return this._sections.every(function(s) {
    return s.consumer.hasContentsOfAllSources();
  });
};
IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
  for (var i = 0; i < this._sections.length; i++) {
    var section = this._sections[i];
    var content = section.consumer.sourceContentFor(aSource, true);
    if (content) {
      return content;
    }
  }
  if (nullOnMissing) {
    return null;
  } else {
    throw new Error('"' + aSource + '" is not in the SourceMap.');
  }
};
IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
  for (var i = 0; i < this._sections.length; i++) {
    var section = this._sections[i];
    if (section.consumer._findSourceIndex(util$2.getArg(aArgs, "source")) === -1) {
      continue;
    }
    var generatedPosition = section.consumer.generatedPositionFor(aArgs);
    if (generatedPosition) {
      var ret = {
        line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
        column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
      };
      return ret;
    }
  }
  return {
    line: null,
    column: null
  };
};
IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
  this.__generatedMappings = [];
  this.__originalMappings = [];
  for (var i = 0; i < this._sections.length; i++) {
    var section = this._sections[i];
    var sectionMappings = section.consumer._generatedMappings;
    for (var j = 0; j < sectionMappings.length; j++) {
      var mapping = sectionMappings[j];
      var source = section.consumer._sources.at(mapping.source);
      source = util$2.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
      this._sources.add(source);
      source = this._sources.indexOf(source);
      var name = null;
      if (mapping.name) {
        name = section.consumer._names.at(mapping.name);
        this._names.add(name);
        name = this._names.indexOf(name);
      }
      var adjustedMapping = {
        source,
        generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
        generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name
      };
      this.__generatedMappings.push(adjustedMapping);
      if (typeof adjustedMapping.originalLine === "number") {
        this.__originalMappings.push(adjustedMapping);
      }
    }
  }
  quickSort(this.__generatedMappings, util$2.compareByGeneratedPositionsDeflated);
  quickSort(this.__originalMappings, util$2.compareByOriginalPositions);
};
sourceMapConsumer.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
var sourceNode = {};
var SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
var util$1 = util$6;
var REGEX_NEWLINE = /(\r?\n)/;
var NEWLINE_CODE = 10;
var isSourceNode = "$$$isSourceNode$$$";
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null)
    this.add(aChunks);
}
SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
  var node2 = new SourceNode();
  var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
  var remainingLinesIndex = 0;
  var shiftNextLine = function() {
    var lineContents = getNextLine();
    var newLine = getNextLine() || "";
    return lineContents + newLine;
    function getNextLine() {
      return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
    }
  };
  var lastGeneratedLine = 1, lastGeneratedColumn = 0;
  var lastMapping = null;
  aSourceMapConsumer.eachMapping(function(mapping) {
    if (lastMapping !== null) {
      if (lastGeneratedLine < mapping.generatedLine) {
        addMappingWithCode(lastMapping, shiftNextLine());
        lastGeneratedLine++;
        lastGeneratedColumn = 0;
      } else {
        var nextLine = remainingLines[remainingLinesIndex] || "";
        var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
        addMappingWithCode(lastMapping, code);
        lastMapping = mapping;
        return;
      }
    }
    while (lastGeneratedLine < mapping.generatedLine) {
      node2.add(shiftNextLine());
      lastGeneratedLine++;
    }
    if (lastGeneratedColumn < mapping.generatedColumn) {
      var nextLine = remainingLines[remainingLinesIndex] || "";
      node2.add(nextLine.substr(0, mapping.generatedColumn));
      remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
      lastGeneratedColumn = mapping.generatedColumn;
    }
    lastMapping = mapping;
  }, this);
  if (remainingLinesIndex < remainingLines.length) {
    if (lastMapping) {
      addMappingWithCode(lastMapping, shiftNextLine());
    }
    node2.add(remainingLines.splice(remainingLinesIndex).join(""));
  }
  aSourceMapConsumer.sources.forEach(function(sourceFile) {
    var content = aSourceMapConsumer.sourceContentFor(sourceFile);
    if (content != null) {
      if (aRelativePath != null) {
        sourceFile = util$1.join(aRelativePath, sourceFile);
      }
      node2.setSourceContent(sourceFile, content);
    }
  });
  return node2;
  function addMappingWithCode(mapping, code) {
    if (mapping === null || mapping.source === void 0) {
      node2.add(code);
    } else {
      var source = aRelativePath ? util$1.join(aRelativePath, mapping.source) : mapping.source;
      node2.add(new SourceNode(mapping.originalLine, mapping.originalColumn, source, code, mapping.name));
    }
  }
};
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function(chunk) {
      this.add(chunk);
    }, this);
  } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  } else {
    throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
  }
  return this;
};
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length - 1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  } else {
    throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk);
  }
  return this;
};
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    } else {
      if (chunk !== "") {
        aFn(chunk, {
          source: this.source,
          line: this.line,
          column: this.column,
          name: this.name
        });
      }
    }
  }
};
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len - 1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  } else if (typeof lastChild === "string") {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  } else {
    this.children.push("".replace(aPattern, aReplacement));
  }
  return this;
};
SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
  this.sourceContents[util$1.toSetString(aSourceFile)] = aSourceContent;
};
SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
  for (var i = 0, len = this.children.length; i < len; i++) {
    if (this.children[i][isSourceNode]) {
      this.children[i].walkSourceContents(aFn);
    }
  }
  var sources = Object.keys(this.sourceContents);
  for (var i = 0, len = sources.length; i < len; i++) {
    aFn(util$1.fromSetString(sources[i]), this.sourceContents[sources[i]]);
  }
};
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function(chunk) {
    str += chunk;
  });
  return str;
};
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function(chunk, original) {
    generated.code += chunk;
    if (original.source !== null && original.line !== null && original.column !== null) {
      if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function(sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });
  return { code: generated.code, map };
};
sourceNode.SourceNode = SourceNode;
sourceMap.SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
sourceMap.SourceMapConsumer = sourceMapConsumer.SourceMapConsumer;
sourceMap.SourceNode = sourceNode.SourceNode;
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _sourceMap = _interopRequireDefault(sourceMap);
  var _path = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var MapGenerator = /* @__PURE__ */ function() {
    function MapGenerator2(stringify2, root2, opts) {
      this.stringify = stringify2;
      this.mapOpts = opts.map || {};
      this.root = root2;
      this.opts = opts;
    }
    var _proto = MapGenerator2.prototype;
    _proto.isMap = function isMap() {
      if (typeof this.opts.map !== "undefined") {
        return !!this.opts.map;
      }
      return this.previous().length > 0;
    };
    _proto.previous = function previous() {
      var _this = this;
      if (!this.previousMaps) {
        this.previousMaps = [];
        this.root.walk(function(node2) {
          if (node2.source && node2.source.input.map) {
            var map = node2.source.input.map;
            if (_this.previousMaps.indexOf(map) === -1) {
              _this.previousMaps.push(map);
            }
          }
        });
      }
      return this.previousMaps;
    };
    _proto.isInline = function isInline() {
      if (typeof this.mapOpts.inline !== "undefined") {
        return this.mapOpts.inline;
      }
      var annotation = this.mapOpts.annotation;
      if (typeof annotation !== "undefined" && annotation !== true) {
        return false;
      }
      if (this.previous().length) {
        return this.previous().some(function(i) {
          return i.inline;
        });
      }
      return true;
    };
    _proto.isSourcesContent = function isSourcesContent() {
      if (typeof this.mapOpts.sourcesContent !== "undefined") {
        return this.mapOpts.sourcesContent;
      }
      if (this.previous().length) {
        return this.previous().some(function(i) {
          return i.withContent();
        });
      }
      return true;
    };
    _proto.clearAnnotation = function clearAnnotation() {
      if (this.mapOpts.annotation === false)
        return;
      var node2;
      for (var i = this.root.nodes.length - 1; i >= 0; i--) {
        node2 = this.root.nodes[i];
        if (node2.type !== "comment")
          continue;
        if (node2.text.indexOf("# sourceMappingURL=") === 0) {
          this.root.removeChild(i);
        }
      }
    };
    _proto.setSourcesContent = function setSourcesContent() {
      var _this2 = this;
      var already = {};
      this.root.walk(function(node2) {
        if (node2.source) {
          var from = node2.source.input.from;
          if (from && !already[from]) {
            already[from] = true;
            var relative = _this2.relative(from);
            _this2.map.setSourceContent(relative, node2.source.input.css);
          }
        }
      });
    };
    _proto.applyPrevMaps = function applyPrevMaps() {
      for (var _iterator = this.previous(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ; ) {
        var _ref;
        if (_isArray) {
          if (_i >= _iterator.length)
            break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done)
            break;
          _ref = _i.value;
        }
        var prev = _ref;
        var from = this.relative(prev.file);
        var root2 = prev.root || _path.default.dirname(prev.file);
        var map = void 0;
        if (this.mapOpts.sourcesContent === false) {
          map = new _sourceMap.default.SourceMapConsumer(prev.text);
          if (map.sourcesContent) {
            map.sourcesContent = map.sourcesContent.map(function() {
              return null;
            });
          }
        } else {
          map = prev.consumer();
        }
        this.map.applySourceMap(map, from, this.relative(root2));
      }
    };
    _proto.isAnnotation = function isAnnotation() {
      if (this.isInline()) {
        return true;
      }
      if (typeof this.mapOpts.annotation !== "undefined") {
        return this.mapOpts.annotation;
      }
      if (this.previous().length) {
        return this.previous().some(function(i) {
          return i.annotation;
        });
      }
      return true;
    };
    _proto.toBase64 = function toBase64(str) {
      if (Buffer) {
        return Buffer.from(str).toString("base64");
      }
      return window.btoa(unescape(encodeURIComponent(str)));
    };
    _proto.addAnnotation = function addAnnotation() {
      var content;
      if (this.isInline()) {
        content = "data:application/json;base64," + this.toBase64(this.map.toString());
      } else if (typeof this.mapOpts.annotation === "string") {
        content = this.mapOpts.annotation;
      } else {
        content = this.outputFile() + ".map";
      }
      var eol = "\n";
      if (this.css.indexOf("\r\n") !== -1)
        eol = "\r\n";
      this.css += eol + "/*# sourceMappingURL=" + content + " */";
    };
    _proto.outputFile = function outputFile() {
      if (this.opts.to) {
        return this.relative(this.opts.to);
      }
      if (this.opts.from) {
        return this.relative(this.opts.from);
      }
      return "to.css";
    };
    _proto.generateMap = function generateMap() {
      this.generateString();
      if (this.isSourcesContent())
        this.setSourcesContent();
      if (this.previous().length > 0)
        this.applyPrevMaps();
      if (this.isAnnotation())
        this.addAnnotation();
      if (this.isInline()) {
        return [this.css];
      }
      return [this.css, this.map];
    };
    _proto.relative = function relative(file) {
      if (file.indexOf("<") === 0)
        return file;
      if (/^\w+:\/\//.test(file))
        return file;
      var from = this.opts.to ? _path.default.dirname(this.opts.to) : ".";
      if (typeof this.mapOpts.annotation === "string") {
        from = _path.default.dirname(_path.default.resolve(from, this.mapOpts.annotation));
      }
      file = _path.default.relative(from, file);
      if (_path.default.sep === "\\") {
        return file.replace(/\\/g, "/");
      }
      return file;
    };
    _proto.sourcePath = function sourcePath(node2) {
      if (this.mapOpts.from) {
        return this.mapOpts.from;
      }
      return this.relative(node2.source.input.from);
    };
    _proto.generateString = function generateString() {
      var _this3 = this;
      this.css = "";
      this.map = new _sourceMap.default.SourceMapGenerator({
        file: this.outputFile()
      });
      var line = 1;
      var column = 1;
      var lines, last;
      this.stringify(this.root, function(str, node2, type) {
        _this3.css += str;
        if (node2 && type !== "end") {
          if (node2.source && node2.source.start) {
            _this3.map.addMapping({
              source: _this3.sourcePath(node2),
              generated: {
                line,
                column: column - 1
              },
              original: {
                line: node2.source.start.line,
                column: node2.source.start.column - 1
              }
            });
          } else {
            _this3.map.addMapping({
              source: "<no source>",
              original: {
                line: 1,
                column: 0
              },
              generated: {
                line,
                column: column - 1
              }
            });
          }
        }
        lines = str.match(/\n/g);
        if (lines) {
          line += lines.length;
          last = str.lastIndexOf("\n");
          column = str.length - last;
        } else {
          column += str.length;
        }
        if (node2 && type !== "start") {
          var p = node2.parent || {
            raws: {}
          };
          if (node2.type !== "decl" || node2 !== p.last || p.raws.semicolon) {
            if (node2.source && node2.source.end) {
              _this3.map.addMapping({
                source: _this3.sourcePath(node2),
                generated: {
                  line,
                  column: column - 2
                },
                original: {
                  line: node2.source.end.line,
                  column: node2.source.end.column - 1
                }
              });
            } else {
              _this3.map.addMapping({
                source: "<no source>",
                original: {
                  line: 1,
                  column: 0
                },
                generated: {
                  line,
                  column: column - 1
                }
              });
            }
          }
        }
      });
    };
    _proto.generate = function generate() {
      this.clearAnnotation();
      if (this.isMap()) {
        return this.generateMap();
      }
      var result2 = "";
      this.stringify(this.root, function(i) {
        result2 += i;
      });
      return [result2];
    };
    return MapGenerator2;
  }();
  var _default = MapGenerator;
  exports.default = _default;
  module.exports = exports.default;
})(mapGenerator, mapGenerator.exports);
var warnOnce = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = warnOnce2;
  var printed = {};
  function warnOnce2(message) {
    if (printed[message])
      return;
    printed[message] = true;
    if (typeof console !== "undefined" && console.warn) {
      console.warn(message);
    }
  }
  module.exports = exports.default;
})(warnOnce, warnOnce.exports);
var result = { exports: {} };
var warning = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var Warning = /* @__PURE__ */ function() {
    function Warning2(text, opts) {
      if (opts === void 0) {
        opts = {};
      }
      this.type = "warning";
      this.text = text;
      if (opts.node && opts.node.source) {
        var pos = opts.node.positionBy(opts);
        this.line = pos.line;
        this.column = pos.column;
      }
      for (var opt in opts) {
        this[opt] = opts[opt];
      }
    }
    var _proto = Warning2.prototype;
    _proto.toString = function toString() {
      if (this.node) {
        return this.node.error(this.text, {
          plugin: this.plugin,
          index: this.index,
          word: this.word
        }).message;
      }
      if (this.plugin) {
        return this.plugin + ": " + this.text;
      }
      return this.text;
    };
    return Warning2;
  }();
  var _default = Warning;
  exports.default = _default;
  module.exports = exports.default;
})(warning, warning.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _warning = _interopRequireDefault(warning.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  var Result = /* @__PURE__ */ function() {
    function Result2(processor2, root2, opts) {
      this.processor = processor2;
      this.messages = [];
      this.root = root2;
      this.opts = opts;
      this.css = void 0;
      this.map = void 0;
    }
    var _proto = Result2.prototype;
    _proto.toString = function toString() {
      return this.css;
    };
    _proto.warn = function warn(text, opts) {
      if (opts === void 0) {
        opts = {};
      }
      if (!opts.plugin) {
        if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
          opts.plugin = this.lastPlugin.postcssPlugin;
        }
      }
      var warning2 = new _warning.default(text, opts);
      this.messages.push(warning2);
      return warning2;
    };
    _proto.warnings = function warnings() {
      return this.messages.filter(function(i) {
        return i.type === "warning";
      });
    };
    _createClass(Result2, [{
      key: "content",
      get: function get2() {
        return this.css;
      }
    }]);
    return Result2;
  }();
  var _default = Result;
  exports.default = _default;
  module.exports = exports.default;
})(result, result.exports);
var parse = { exports: {} };
var parser$2 = { exports: {} };
var tokenize$2 = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = tokenizer;
  var SINGLE_QUOTE = "'".charCodeAt(0);
  var DOUBLE_QUOTE = '"'.charCodeAt(0);
  var BACKSLASH = "\\".charCodeAt(0);
  var SLASH = "/".charCodeAt(0);
  var NEWLINE = "\n".charCodeAt(0);
  var SPACE = " ".charCodeAt(0);
  var FEED = "\f".charCodeAt(0);
  var TAB = "	".charCodeAt(0);
  var CR = "\r".charCodeAt(0);
  var OPEN_SQUARE = "[".charCodeAt(0);
  var CLOSE_SQUARE = "]".charCodeAt(0);
  var OPEN_PARENTHESES = "(".charCodeAt(0);
  var CLOSE_PARENTHESES = ")".charCodeAt(0);
  var OPEN_CURLY = "{".charCodeAt(0);
  var CLOSE_CURLY = "}".charCodeAt(0);
  var SEMICOLON = ";".charCodeAt(0);
  var ASTERISK = "*".charCodeAt(0);
  var COLON = ":".charCodeAt(0);
  var AT = "@".charCodeAt(0);
  var RE_AT_END = /[ \n\t\r\f{}()'"\\;/[\]#]/g;
  var RE_WORD_END = /[ \n\t\r\f(){}:;@!'"\\\][#]|\/(?=\*)/g;
  var RE_BAD_BRACKET = /.[\\/("'\n]/;
  var RE_HEX_ESCAPE = /[a-f0-9]/i;
  function tokenizer(input2, options) {
    if (options === void 0) {
      options = {};
    }
    var css = input2.css.valueOf();
    var ignore = options.ignoreErrors;
    var code, next, quote, lines, last, content, escape;
    var nextLine, nextOffset, escaped, escapePos, prev, n, currentToken;
    var length = css.length;
    var offset = -1;
    var line = 1;
    var pos = 0;
    var buffer = [];
    var returned = [];
    function position() {
      return pos;
    }
    function unclosed(what) {
      throw input2.error("Unclosed " + what, line, pos - offset);
    }
    function endOfFile() {
      return returned.length === 0 && pos >= length;
    }
    function nextToken(opts) {
      if (returned.length)
        return returned.pop();
      if (pos >= length)
        return;
      var ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
      code = css.charCodeAt(pos);
      if (code === NEWLINE || code === FEED || code === CR && css.charCodeAt(pos + 1) !== NEWLINE) {
        offset = pos;
        line += 1;
      }
      switch (code) {
        case NEWLINE:
        case SPACE:
        case TAB:
        case CR:
        case FEED:
          next = pos;
          do {
            next += 1;
            code = css.charCodeAt(next);
            if (code === NEWLINE) {
              offset = next;
              line += 1;
            }
          } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
          currentToken = ["space", css.slice(pos, next)];
          pos = next - 1;
          break;
        case OPEN_SQUARE:
        case CLOSE_SQUARE:
        case OPEN_CURLY:
        case CLOSE_CURLY:
        case COLON:
        case SEMICOLON:
        case CLOSE_PARENTHESES:
          var controlChar = String.fromCharCode(code);
          currentToken = [controlChar, controlChar, line, pos - offset];
          break;
        case OPEN_PARENTHESES:
          prev = buffer.length ? buffer.pop()[1] : "";
          n = css.charCodeAt(pos + 1);
          if (prev === "url" && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE && n !== SPACE && n !== NEWLINE && n !== TAB && n !== FEED && n !== CR) {
            next = pos;
            do {
              escaped = false;
              next = css.indexOf(")", next + 1);
              if (next === -1) {
                if (ignore || ignoreUnclosed) {
                  next = pos;
                  break;
                } else {
                  unclosed("bracket");
                }
              }
              escapePos = next;
              while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                escapePos -= 1;
                escaped = !escaped;
              }
            } while (escaped);
            currentToken = ["brackets", css.slice(pos, next + 1), line, pos - offset, line, next - offset];
            pos = next;
          } else {
            next = css.indexOf(")", pos + 1);
            content = css.slice(pos, next + 1);
            if (next === -1 || RE_BAD_BRACKET.test(content)) {
              currentToken = ["(", "(", line, pos - offset];
            } else {
              currentToken = ["brackets", content, line, pos - offset, line, next - offset];
              pos = next;
            }
          }
          break;
        case SINGLE_QUOTE:
        case DOUBLE_QUOTE:
          quote = code === SINGLE_QUOTE ? "'" : '"';
          next = pos;
          do {
            escaped = false;
            next = css.indexOf(quote, next + 1);
            if (next === -1) {
              if (ignore || ignoreUnclosed) {
                next = pos + 1;
                break;
              } else {
                unclosed("string");
              }
            }
            escapePos = next;
            while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
              escapePos -= 1;
              escaped = !escaped;
            }
          } while (escaped);
          content = css.slice(pos, next + 1);
          lines = content.split("\n");
          last = lines.length - 1;
          if (last > 0) {
            nextLine = line + last;
            nextOffset = next - lines[last].length;
          } else {
            nextLine = line;
            nextOffset = offset;
          }
          currentToken = ["string", css.slice(pos, next + 1), line, pos - offset, nextLine, next - nextOffset];
          offset = nextOffset;
          line = nextLine;
          pos = next;
          break;
        case AT:
          RE_AT_END.lastIndex = pos + 1;
          RE_AT_END.test(css);
          if (RE_AT_END.lastIndex === 0) {
            next = css.length - 1;
          } else {
            next = RE_AT_END.lastIndex - 2;
          }
          currentToken = ["at-word", css.slice(pos, next + 1), line, pos - offset, line, next - offset];
          pos = next;
          break;
        case BACKSLASH:
          next = pos;
          escape = true;
          while (css.charCodeAt(next + 1) === BACKSLASH) {
            next += 1;
            escape = !escape;
          }
          code = css.charCodeAt(next + 1);
          if (escape && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
            next += 1;
            if (RE_HEX_ESCAPE.test(css.charAt(next))) {
              while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                next += 1;
              }
              if (css.charCodeAt(next + 1) === SPACE) {
                next += 1;
              }
            }
          }
          currentToken = ["word", css.slice(pos, next + 1), line, pos - offset, line, next - offset];
          pos = next;
          break;
        default:
          if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
            next = css.indexOf("*/", pos + 2) + 1;
            if (next === 0) {
              if (ignore || ignoreUnclosed) {
                next = css.length;
              } else {
                unclosed("comment");
              }
            }
            content = css.slice(pos, next + 1);
            lines = content.split("\n");
            last = lines.length - 1;
            if (last > 0) {
              nextLine = line + last;
              nextOffset = next - lines[last].length;
            } else {
              nextLine = line;
              nextOffset = offset;
            }
            currentToken = ["comment", content, line, pos - offset, nextLine, next - nextOffset];
            offset = nextOffset;
            line = nextLine;
            pos = next;
          } else {
            RE_WORD_END.lastIndex = pos + 1;
            RE_WORD_END.test(css);
            if (RE_WORD_END.lastIndex === 0) {
              next = css.length - 1;
            } else {
              next = RE_WORD_END.lastIndex - 2;
            }
            currentToken = ["word", css.slice(pos, next + 1), line, pos - offset, line, next - offset];
            buffer.push(currentToken);
            pos = next;
          }
          break;
      }
      pos++;
      return currentToken;
    }
    function back(token) {
      returned.push(token);
    }
    return {
      back,
      nextToken,
      endOfFile,
      position
    };
  }
  module.exports = exports.default;
})(tokenize$2, tokenize$2.exports);
var comment$1 = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _node = _interopRequireDefault(node.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  var Comment2 = /* @__PURE__ */ function(_Node) {
    _inheritsLoose(Comment3, _Node);
    function Comment3(defaults) {
      var _this;
      _this = _Node.call(this, defaults) || this;
      _this.type = "comment";
      return _this;
    }
    return Comment3;
  }(_node.default);
  var _default = Comment2;
  exports.default = _default;
  module.exports = exports.default;
})(comment$1, comment$1.exports);
var atRule = { exports: {} };
var container$1 = { exports: {} };
var rule = { exports: {} };
var list = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var list2 = {
    split: function split(string2, separators, last) {
      var array = [];
      var current = "";
      var split2 = false;
      var func = 0;
      var quote = false;
      var escape = false;
      for (var i = 0; i < string2.length; i++) {
        var letter = string2[i];
        if (quote) {
          if (escape) {
            escape = false;
          } else if (letter === "\\") {
            escape = true;
          } else if (letter === quote) {
            quote = false;
          }
        } else if (letter === '"' || letter === "'") {
          quote = letter;
        } else if (letter === "(") {
          func += 1;
        } else if (letter === ")") {
          if (func > 0)
            func -= 1;
        } else if (func === 0) {
          if (separators.indexOf(letter) !== -1)
            split2 = true;
        }
        if (split2) {
          if (current !== "")
            array.push(current.trim());
          current = "";
          split2 = false;
        } else {
          current += letter;
        }
      }
      if (last || current !== "")
        array.push(current.trim());
      return array;
    },
    space: function space2(string2) {
      var spaces = [" ", "\n", "	"];
      return list2.split(string2, spaces);
    },
    comma: function comma2(string2) {
      return list2.split(string2, [","], true);
    }
  };
  var _default = list2;
  exports.default = _default;
  module.exports = exports.default;
})(list, list.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _container = _interopRequireDefault(container$1.exports);
  var _list = _interopRequireDefault(list.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  var Rule = /* @__PURE__ */ function(_Container) {
    _inheritsLoose(Rule2, _Container);
    function Rule2(defaults) {
      var _this;
      _this = _Container.call(this, defaults) || this;
      _this.type = "rule";
      if (!_this.nodes)
        _this.nodes = [];
      return _this;
    }
    _createClass(Rule2, [{
      key: "selectors",
      get: function get2() {
        return _list.default.comma(this.selector);
      },
      set: function set(values) {
        var match = this.selector ? this.selector.match(/,\s*/) : null;
        var sep = match ? match[0] : "," + this.raw("between", "beforeOpen");
        this.selector = values.join(sep);
      }
    }]);
    return Rule2;
  }(_container.default);
  var _default = Rule;
  exports.default = _default;
  module.exports = exports.default;
})(rule, rule.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _declaration = _interopRequireDefault(declaration.exports);
  var _comment = _interopRequireDefault(comment$1.exports);
  var _node = _interopRequireDefault(node.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  function cleanSource(nodes) {
    return nodes.map(function(i) {
      if (i.nodes)
        i.nodes = cleanSource(i.nodes);
      delete i.source;
      return i;
    });
  }
  var Container2 = /* @__PURE__ */ function(_Node) {
    _inheritsLoose(Container3, _Node);
    function Container3() {
      return _Node.apply(this, arguments) || this;
    }
    var _proto = Container3.prototype;
    _proto.push = function push(child) {
      child.parent = this;
      this.nodes.push(child);
      return this;
    };
    _proto.each = function each(callback) {
      if (!this.lastEach)
        this.lastEach = 0;
      if (!this.indexes)
        this.indexes = {};
      this.lastEach += 1;
      var id = this.lastEach;
      this.indexes[id] = 0;
      if (!this.nodes)
        return void 0;
      var index, result2;
      while (this.indexes[id] < this.nodes.length) {
        index = this.indexes[id];
        result2 = callback(this.nodes[index], index);
        if (result2 === false)
          break;
        this.indexes[id] += 1;
      }
      delete this.indexes[id];
      return result2;
    };
    _proto.walk = function walk(callback) {
      return this.each(function(child, i) {
        var result2;
        try {
          result2 = callback(child, i);
        } catch (e) {
          e.postcssNode = child;
          if (e.stack && child.source && /\n\s{4}at /.test(e.stack)) {
            var s = child.source;
            e.stack = e.stack.replace(/\n\s{4}at /, "$&" + s.input.from + ":" + s.start.line + ":" + s.start.column + "$&");
          }
          throw e;
        }
        if (result2 !== false && child.walk) {
          result2 = child.walk(callback);
        }
        return result2;
      });
    };
    _proto.walkDecls = function walkDecls(prop, callback) {
      if (!callback) {
        callback = prop;
        return this.walk(function(child, i) {
          if (child.type === "decl") {
            return callback(child, i);
          }
        });
      }
      if (prop instanceof RegExp) {
        return this.walk(function(child, i) {
          if (child.type === "decl" && prop.test(child.prop)) {
            return callback(child, i);
          }
        });
      }
      return this.walk(function(child, i) {
        if (child.type === "decl" && child.prop === prop) {
          return callback(child, i);
        }
      });
    };
    _proto.walkRules = function walkRules(selector, callback) {
      if (!callback) {
        callback = selector;
        return this.walk(function(child, i) {
          if (child.type === "rule") {
            return callback(child, i);
          }
        });
      }
      if (selector instanceof RegExp) {
        return this.walk(function(child, i) {
          if (child.type === "rule" && selector.test(child.selector)) {
            return callback(child, i);
          }
        });
      }
      return this.walk(function(child, i) {
        if (child.type === "rule" && child.selector === selector) {
          return callback(child, i);
        }
      });
    };
    _proto.walkAtRules = function walkAtRules(name, callback) {
      if (!callback) {
        callback = name;
        return this.walk(function(child, i) {
          if (child.type === "atrule") {
            return callback(child, i);
          }
        });
      }
      if (name instanceof RegExp) {
        return this.walk(function(child, i) {
          if (child.type === "atrule" && name.test(child.name)) {
            return callback(child, i);
          }
        });
      }
      return this.walk(function(child, i) {
        if (child.type === "atrule" && child.name === name) {
          return callback(child, i);
        }
      });
    };
    _proto.walkComments = function walkComments(callback) {
      return this.walk(function(child, i) {
        if (child.type === "comment") {
          return callback(child, i);
        }
      });
    };
    _proto.append = function append() {
      for (var _len = arguments.length, children = new Array(_len), _key = 0; _key < _len; _key++) {
        children[_key] = arguments[_key];
      }
      for (var _i = 0, _children = children; _i < _children.length; _i++) {
        var child = _children[_i];
        var nodes = this.normalize(child, this.last);
        for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i2 = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ; ) {
          var _ref;
          if (_isArray) {
            if (_i2 >= _iterator.length)
              break;
            _ref = _iterator[_i2++];
          } else {
            _i2 = _iterator.next();
            if (_i2.done)
              break;
            _ref = _i2.value;
          }
          var node2 = _ref;
          this.nodes.push(node2);
        }
      }
      return this;
    };
    _proto.prepend = function prepend() {
      for (var _len2 = arguments.length, children = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        children[_key2] = arguments[_key2];
      }
      children = children.reverse();
      for (var _iterator2 = children, _isArray2 = Array.isArray(_iterator2), _i3 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator](); ; ) {
        var _ref2;
        if (_isArray2) {
          if (_i3 >= _iterator2.length)
            break;
          _ref2 = _iterator2[_i3++];
        } else {
          _i3 = _iterator2.next();
          if (_i3.done)
            break;
          _ref2 = _i3.value;
        }
        var child = _ref2;
        var nodes = this.normalize(child, this.first, "prepend").reverse();
        for (var _iterator3 = nodes, _isArray3 = Array.isArray(_iterator3), _i4 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator](); ; ) {
          var _ref3;
          if (_isArray3) {
            if (_i4 >= _iterator3.length)
              break;
            _ref3 = _iterator3[_i4++];
          } else {
            _i4 = _iterator3.next();
            if (_i4.done)
              break;
            _ref3 = _i4.value;
          }
          var node2 = _ref3;
          this.nodes.unshift(node2);
        }
        for (var id in this.indexes) {
          this.indexes[id] = this.indexes[id] + nodes.length;
        }
      }
      return this;
    };
    _proto.cleanRaws = function cleanRaws(keepBetween) {
      _Node.prototype.cleanRaws.call(this, keepBetween);
      if (this.nodes) {
        for (var _iterator4 = this.nodes, _isArray4 = Array.isArray(_iterator4), _i5 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator](); ; ) {
          var _ref4;
          if (_isArray4) {
            if (_i5 >= _iterator4.length)
              break;
            _ref4 = _iterator4[_i5++];
          } else {
            _i5 = _iterator4.next();
            if (_i5.done)
              break;
            _ref4 = _i5.value;
          }
          var node2 = _ref4;
          node2.cleanRaws(keepBetween);
        }
      }
    };
    _proto.insertBefore = function insertBefore(exist, add) {
      exist = this.index(exist);
      var type = exist === 0 ? "prepend" : false;
      var nodes = this.normalize(add, this.nodes[exist], type).reverse();
      for (var _iterator5 = nodes, _isArray5 = Array.isArray(_iterator5), _i6 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator](); ; ) {
        var _ref5;
        if (_isArray5) {
          if (_i6 >= _iterator5.length)
            break;
          _ref5 = _iterator5[_i6++];
        } else {
          _i6 = _iterator5.next();
          if (_i6.done)
            break;
          _ref5 = _i6.value;
        }
        var node2 = _ref5;
        this.nodes.splice(exist, 0, node2);
      }
      var index;
      for (var id in this.indexes) {
        index = this.indexes[id];
        if (exist <= index) {
          this.indexes[id] = index + nodes.length;
        }
      }
      return this;
    };
    _proto.insertAfter = function insertAfter(exist, add) {
      exist = this.index(exist);
      var nodes = this.normalize(add, this.nodes[exist]).reverse();
      for (var _iterator6 = nodes, _isArray6 = Array.isArray(_iterator6), _i7 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator](); ; ) {
        var _ref6;
        if (_isArray6) {
          if (_i7 >= _iterator6.length)
            break;
          _ref6 = _iterator6[_i7++];
        } else {
          _i7 = _iterator6.next();
          if (_i7.done)
            break;
          _ref6 = _i7.value;
        }
        var node2 = _ref6;
        this.nodes.splice(exist + 1, 0, node2);
      }
      var index;
      for (var id in this.indexes) {
        index = this.indexes[id];
        if (exist < index) {
          this.indexes[id] = index + nodes.length;
        }
      }
      return this;
    };
    _proto.removeChild = function removeChild(child) {
      child = this.index(child);
      this.nodes[child].parent = void 0;
      this.nodes.splice(child, 1);
      var index;
      for (var id in this.indexes) {
        index = this.indexes[id];
        if (index >= child) {
          this.indexes[id] = index - 1;
        }
      }
      return this;
    };
    _proto.removeAll = function removeAll() {
      for (var _iterator7 = this.nodes, _isArray7 = Array.isArray(_iterator7), _i8 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator](); ; ) {
        var _ref7;
        if (_isArray7) {
          if (_i8 >= _iterator7.length)
            break;
          _ref7 = _iterator7[_i8++];
        } else {
          _i8 = _iterator7.next();
          if (_i8.done)
            break;
          _ref7 = _i8.value;
        }
        var node2 = _ref7;
        node2.parent = void 0;
      }
      this.nodes = [];
      return this;
    };
    _proto.replaceValues = function replaceValues(pattern, opts, callback) {
      if (!callback) {
        callback = opts;
        opts = {};
      }
      this.walkDecls(function(decl) {
        if (opts.props && opts.props.indexOf(decl.prop) === -1)
          return;
        if (opts.fast && decl.value.indexOf(opts.fast) === -1)
          return;
        decl.value = decl.value.replace(pattern, callback);
      });
      return this;
    };
    _proto.every = function every(condition) {
      return this.nodes.every(condition);
    };
    _proto.some = function some(condition) {
      return this.nodes.some(condition);
    };
    _proto.index = function index(child) {
      if (typeof child === "number") {
        return child;
      }
      return this.nodes.indexOf(child);
    };
    _proto.normalize = function normalize(nodes, sample) {
      var _this = this;
      if (typeof nodes === "string") {
        var parse$1 = parse.exports;
        nodes = cleanSource(parse$1(nodes).nodes);
      } else if (Array.isArray(nodes)) {
        nodes = nodes.slice(0);
        for (var _iterator8 = nodes, _isArray8 = Array.isArray(_iterator8), _i9 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator](); ; ) {
          var _ref8;
          if (_isArray8) {
            if (_i9 >= _iterator8.length)
              break;
            _ref8 = _iterator8[_i9++];
          } else {
            _i9 = _iterator8.next();
            if (_i9.done)
              break;
            _ref8 = _i9.value;
          }
          var i = _ref8;
          if (i.parent)
            i.parent.removeChild(i, "ignore");
        }
      } else if (nodes.type === "root") {
        nodes = nodes.nodes.slice(0);
        for (var _iterator9 = nodes, _isArray9 = Array.isArray(_iterator9), _i10 = 0, _iterator9 = _isArray9 ? _iterator9 : _iterator9[Symbol.iterator](); ; ) {
          var _ref9;
          if (_isArray9) {
            if (_i10 >= _iterator9.length)
              break;
            _ref9 = _iterator9[_i10++];
          } else {
            _i10 = _iterator9.next();
            if (_i10.done)
              break;
            _ref9 = _i10.value;
          }
          var _i11 = _ref9;
          if (_i11.parent)
            _i11.parent.removeChild(_i11, "ignore");
        }
      } else if (nodes.type) {
        nodes = [nodes];
      } else if (nodes.prop) {
        if (typeof nodes.value === "undefined") {
          throw new Error("Value field is missed in node creation");
        } else if (typeof nodes.value !== "string") {
          nodes.value = String(nodes.value);
        }
        nodes = [new _declaration.default(nodes)];
      } else if (nodes.selector) {
        var Rule = rule.exports;
        nodes = [new Rule(nodes)];
      } else if (nodes.name) {
        var AtRule = atRule.exports;
        nodes = [new AtRule(nodes)];
      } else if (nodes.text) {
        nodes = [new _comment.default(nodes)];
      } else {
        throw new Error("Unknown node type in node creation");
      }
      var processed = nodes.map(function(i2) {
        if (i2.parent)
          i2.parent.removeChild(i2);
        if (typeof i2.raws.before === "undefined") {
          if (sample && typeof sample.raws.before !== "undefined") {
            i2.raws.before = sample.raws.before.replace(/[^\s]/g, "");
          }
        }
        i2.parent = _this;
        return i2;
      });
      return processed;
    };
    _createClass(Container3, [{
      key: "first",
      get: function get2() {
        if (!this.nodes)
          return void 0;
        return this.nodes[0];
      }
    }, {
      key: "last",
      get: function get2() {
        if (!this.nodes)
          return void 0;
        return this.nodes[this.nodes.length - 1];
      }
    }]);
    return Container3;
  }(_node.default);
  var _default = Container2;
  exports.default = _default;
  module.exports = exports.default;
})(container$1, container$1.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _container = _interopRequireDefault(container$1.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  var AtRule = /* @__PURE__ */ function(_Container) {
    _inheritsLoose(AtRule2, _Container);
    function AtRule2(defaults) {
      var _this;
      _this = _Container.call(this, defaults) || this;
      _this.type = "atrule";
      return _this;
    }
    var _proto = AtRule2.prototype;
    _proto.append = function append() {
      var _Container$prototype$;
      if (!this.nodes)
        this.nodes = [];
      for (var _len = arguments.length, children = new Array(_len), _key = 0; _key < _len; _key++) {
        children[_key] = arguments[_key];
      }
      return (_Container$prototype$ = _Container.prototype.append).call.apply(_Container$prototype$, [this].concat(children));
    };
    _proto.prepend = function prepend() {
      var _Container$prototype$2;
      if (!this.nodes)
        this.nodes = [];
      for (var _len2 = arguments.length, children = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        children[_key2] = arguments[_key2];
      }
      return (_Container$prototype$2 = _Container.prototype.prepend).call.apply(_Container$prototype$2, [this].concat(children));
    };
    return AtRule2;
  }(_container.default);
  var _default = AtRule;
  exports.default = _default;
  module.exports = exports.default;
})(atRule, atRule.exports);
var root$1 = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _container = _interopRequireDefault(container$1.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }
  var Root3 = /* @__PURE__ */ function(_Container) {
    _inheritsLoose(Root4, _Container);
    function Root4(defaults) {
      var _this;
      _this = _Container.call(this, defaults) || this;
      _this.type = "root";
      if (!_this.nodes)
        _this.nodes = [];
      return _this;
    }
    var _proto = Root4.prototype;
    _proto.removeChild = function removeChild(child, ignore) {
      var index = this.index(child);
      if (!ignore && index === 0 && this.nodes.length > 1) {
        this.nodes[1].raws.before = this.nodes[index].raws.before;
      }
      return _Container.prototype.removeChild.call(this, child);
    };
    _proto.normalize = function normalize(child, sample, type) {
      var nodes = _Container.prototype.normalize.call(this, child);
      if (sample) {
        if (type === "prepend") {
          if (this.nodes.length > 1) {
            sample.raws.before = this.nodes[1].raws.before;
          } else {
            delete sample.raws.before;
          }
        } else if (this.first !== sample) {
          for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ; ) {
            var _ref;
            if (_isArray) {
              if (_i >= _iterator.length)
                break;
              _ref = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done)
                break;
              _ref = _i.value;
            }
            var node2 = _ref;
            node2.raws.before = sample.raws.before;
          }
        }
      }
      return nodes;
    };
    _proto.toResult = function toResult(opts) {
      if (opts === void 0) {
        opts = {};
      }
      var LazyResult = lazyResult.exports;
      var Processor = processor.exports;
      var lazy = new LazyResult(new Processor(), this, opts);
      return lazy.stringify();
    };
    return Root4;
  }(_container.default);
  var _default = Root3;
  exports.default = _default;
  module.exports = exports.default;
})(root$1, root$1.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _declaration = _interopRequireDefault(declaration.exports);
  var _tokenize = _interopRequireDefault(tokenize$2.exports);
  var _comment = _interopRequireDefault(comment$1.exports);
  var _atRule = _interopRequireDefault(atRule.exports);
  var _root = _interopRequireDefault(root$1.exports);
  var _rule = _interopRequireDefault(rule.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var Parser3 = /* @__PURE__ */ function() {
    function Parser4(input2) {
      this.input = input2;
      this.root = new _root.default();
      this.current = this.root;
      this.spaces = "";
      this.semicolon = false;
      this.createTokenizer();
      this.root.source = {
        input: input2,
        start: {
          line: 1,
          column: 1
        }
      };
    }
    var _proto = Parser4.prototype;
    _proto.createTokenizer = function createTokenizer() {
      this.tokenizer = (0, _tokenize.default)(this.input);
    };
    _proto.parse = function parse2() {
      var token;
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        switch (token[0]) {
          case "space":
            this.spaces += token[1];
            break;
          case ";":
            this.freeSemicolon(token);
            break;
          case "}":
            this.end(token);
            break;
          case "comment":
            this.comment(token);
            break;
          case "at-word":
            this.atrule(token);
            break;
          case "{":
            this.emptyRule(token);
            break;
          default:
            this.other(token);
            break;
        }
      }
      this.endFile();
    };
    _proto.comment = function comment2(token) {
      var node2 = new _comment.default();
      this.init(node2, token[2], token[3]);
      node2.source.end = {
        line: token[4],
        column: token[5]
      };
      var text = token[1].slice(2, -2);
      if (/^\s*$/.test(text)) {
        node2.text = "";
        node2.raws.left = text;
        node2.raws.right = "";
      } else {
        var match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
        node2.text = match[2];
        node2.raws.left = match[1];
        node2.raws.right = match[3];
      }
    };
    _proto.emptyRule = function emptyRule(token) {
      var node2 = new _rule.default();
      this.init(node2, token[2], token[3]);
      node2.selector = "";
      node2.raws.between = "";
      this.current = node2;
    };
    _proto.other = function other(start) {
      var end = false;
      var type = null;
      var colon2 = false;
      var bracket = null;
      var brackets = [];
      var tokens = [];
      var token = start;
      while (token) {
        type = token[0];
        tokens.push(token);
        if (type === "(" || type === "[") {
          if (!bracket)
            bracket = token;
          brackets.push(type === "(" ? ")" : "]");
        } else if (brackets.length === 0) {
          if (type === ";") {
            if (colon2) {
              this.decl(tokens);
              return;
            } else {
              break;
            }
          } else if (type === "{") {
            this.rule(tokens);
            return;
          } else if (type === "}") {
            this.tokenizer.back(tokens.pop());
            end = true;
            break;
          } else if (type === ":") {
            colon2 = true;
          }
        } else if (type === brackets[brackets.length - 1]) {
          brackets.pop();
          if (brackets.length === 0)
            bracket = null;
        }
        token = this.tokenizer.nextToken();
      }
      if (this.tokenizer.endOfFile())
        end = true;
      if (brackets.length > 0)
        this.unclosedBracket(bracket);
      if (end && colon2) {
        while (tokens.length) {
          token = tokens[tokens.length - 1][0];
          if (token !== "space" && token !== "comment")
            break;
          this.tokenizer.back(tokens.pop());
        }
        this.decl(tokens);
      } else {
        this.unknownWord(tokens);
      }
    };
    _proto.rule = function rule2(tokens) {
      tokens.pop();
      var node2 = new _rule.default();
      this.init(node2, tokens[0][2], tokens[0][3]);
      node2.raws.between = this.spacesAndCommentsFromEnd(tokens);
      this.raw(node2, "selector", tokens);
      this.current = node2;
    };
    _proto.decl = function decl(tokens) {
      var node2 = new _declaration.default();
      this.init(node2);
      var last = tokens[tokens.length - 1];
      if (last[0] === ";") {
        this.semicolon = true;
        tokens.pop();
      }
      if (last[4]) {
        node2.source.end = {
          line: last[4],
          column: last[5]
        };
      } else {
        node2.source.end = {
          line: last[2],
          column: last[3]
        };
      }
      while (tokens[0][0] !== "word") {
        if (tokens.length === 1)
          this.unknownWord(tokens);
        node2.raws.before += tokens.shift()[1];
      }
      node2.source.start = {
        line: tokens[0][2],
        column: tokens[0][3]
      };
      node2.prop = "";
      while (tokens.length) {
        var type = tokens[0][0];
        if (type === ":" || type === "space" || type === "comment") {
          break;
        }
        node2.prop += tokens.shift()[1];
      }
      node2.raws.between = "";
      var token;
      while (tokens.length) {
        token = tokens.shift();
        if (token[0] === ":") {
          node2.raws.between += token[1];
          break;
        } else {
          if (token[0] === "word" && /\w/.test(token[1])) {
            this.unknownWord([token]);
          }
          node2.raws.between += token[1];
        }
      }
      if (node2.prop[0] === "_" || node2.prop[0] === "*") {
        node2.raws.before += node2.prop[0];
        node2.prop = node2.prop.slice(1);
      }
      node2.raws.between += this.spacesAndCommentsFromStart(tokens);
      this.precheckMissedSemicolon(tokens);
      for (var i = tokens.length - 1; i > 0; i--) {
        token = tokens[i];
        if (token[1].toLowerCase() === "!important") {
          node2.important = true;
          var string2 = this.stringFrom(tokens, i);
          string2 = this.spacesFromEnd(tokens) + string2;
          if (string2 !== " !important")
            node2.raws.important = string2;
          break;
        } else if (token[1].toLowerCase() === "important") {
          var cache = tokens.slice(0);
          var str = "";
          for (var j = i; j > 0; j--) {
            var _type = cache[j][0];
            if (str.trim().indexOf("!") === 0 && _type !== "space") {
              break;
            }
            str = cache.pop()[1] + str;
          }
          if (str.trim().indexOf("!") === 0) {
            node2.important = true;
            node2.raws.important = str;
            tokens = cache;
          }
        }
        if (token[0] !== "space" && token[0] !== "comment") {
          break;
        }
      }
      this.raw(node2, "value", tokens);
      if (node2.value.indexOf(":") !== -1)
        this.checkMissedSemicolon(tokens);
    };
    _proto.atrule = function atrule(token) {
      var node2 = new _atRule.default();
      node2.name = token[1].slice(1);
      if (node2.name === "") {
        this.unnamedAtrule(node2, token);
      }
      this.init(node2, token[2], token[3]);
      var prev;
      var shift;
      var last = false;
      var open = false;
      var params = [];
      while (!this.tokenizer.endOfFile()) {
        token = this.tokenizer.nextToken();
        if (token[0] === ";") {
          node2.source.end = {
            line: token[2],
            column: token[3]
          };
          this.semicolon = true;
          break;
        } else if (token[0] === "{") {
          open = true;
          break;
        } else if (token[0] === "}") {
          if (params.length > 0) {
            shift = params.length - 1;
            prev = params[shift];
            while (prev && prev[0] === "space") {
              prev = params[--shift];
            }
            if (prev) {
              node2.source.end = {
                line: prev[4],
                column: prev[5]
              };
            }
          }
          this.end(token);
          break;
        } else {
          params.push(token);
        }
        if (this.tokenizer.endOfFile()) {
          last = true;
          break;
        }
      }
      node2.raws.between = this.spacesAndCommentsFromEnd(params);
      if (params.length) {
        node2.raws.afterName = this.spacesAndCommentsFromStart(params);
        this.raw(node2, "params", params);
        if (last) {
          token = params[params.length - 1];
          node2.source.end = {
            line: token[4],
            column: token[5]
          };
          this.spaces = node2.raws.between;
          node2.raws.between = "";
        }
      } else {
        node2.raws.afterName = "";
        node2.params = "";
      }
      if (open) {
        node2.nodes = [];
        this.current = node2;
      }
    };
    _proto.end = function end(token) {
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.semicolon = false;
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
      this.spaces = "";
      if (this.current.parent) {
        this.current.source.end = {
          line: token[2],
          column: token[3]
        };
        this.current = this.current.parent;
      } else {
        this.unexpectedClose(token);
      }
    };
    _proto.endFile = function endFile() {
      if (this.current.parent)
        this.unclosedBlock();
      if (this.current.nodes && this.current.nodes.length) {
        this.current.raws.semicolon = this.semicolon;
      }
      this.current.raws.after = (this.current.raws.after || "") + this.spaces;
    };
    _proto.freeSemicolon = function freeSemicolon(token) {
      this.spaces += token[1];
      if (this.current.nodes) {
        var prev = this.current.nodes[this.current.nodes.length - 1];
        if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
          prev.raws.ownSemicolon = this.spaces;
          this.spaces = "";
        }
      }
    };
    _proto.init = function init(node2, line, column) {
      this.current.push(node2);
      node2.source = {
        start: {
          line,
          column
        },
        input: this.input
      };
      node2.raws.before = this.spaces;
      this.spaces = "";
      if (node2.type !== "comment")
        this.semicolon = false;
    };
    _proto.raw = function raw(node2, prop, tokens) {
      var token, type;
      var length = tokens.length;
      var value2 = "";
      var clean = true;
      var next, prev;
      var pattern = /^([.|#])?([\w])+/i;
      for (var i = 0; i < length; i += 1) {
        token = tokens[i];
        type = token[0];
        if (type === "comment" && node2.type === "rule") {
          prev = tokens[i - 1];
          next = tokens[i + 1];
          if (prev[0] !== "space" && next[0] !== "space" && pattern.test(prev[1]) && pattern.test(next[1])) {
            value2 += token[1];
          } else {
            clean = false;
          }
          continue;
        }
        if (type === "comment" || type === "space" && i === length - 1) {
          clean = false;
        } else {
          value2 += token[1];
        }
      }
      if (!clean) {
        var raw2 = tokens.reduce(function(all, i2) {
          return all + i2[1];
        }, "");
        node2.raws[prop] = {
          value: value2,
          raw: raw2
        };
      }
      node2[prop] = value2;
    };
    _proto.spacesAndCommentsFromEnd = function spacesAndCommentsFromEnd(tokens) {
      var lastTokenType;
      var spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space" && lastTokenType !== "comment")
          break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    };
    _proto.spacesAndCommentsFromStart = function spacesAndCommentsFromStart(tokens) {
      var next;
      var spaces = "";
      while (tokens.length) {
        next = tokens[0][0];
        if (next !== "space" && next !== "comment")
          break;
        spaces += tokens.shift()[1];
      }
      return spaces;
    };
    _proto.spacesFromEnd = function spacesFromEnd(tokens) {
      var lastTokenType;
      var spaces = "";
      while (tokens.length) {
        lastTokenType = tokens[tokens.length - 1][0];
        if (lastTokenType !== "space")
          break;
        spaces = tokens.pop()[1] + spaces;
      }
      return spaces;
    };
    _proto.stringFrom = function stringFrom(tokens, from) {
      var result2 = "";
      for (var i = from; i < tokens.length; i++) {
        result2 += tokens[i][1];
      }
      tokens.splice(from, tokens.length - from);
      return result2;
    };
    _proto.colon = function colon2(tokens) {
      var brackets = 0;
      var token, type, prev;
      for (var i = 0; i < tokens.length; i++) {
        token = tokens[i];
        type = token[0];
        if (type === "(") {
          brackets += 1;
        }
        if (type === ")") {
          brackets -= 1;
        }
        if (brackets === 0 && type === ":") {
          if (!prev) {
            this.doubleColon(token);
          } else if (prev[0] === "word" && prev[1] === "progid") {
            continue;
          } else {
            return i;
          }
        }
        prev = token;
      }
      return false;
    };
    _proto.unclosedBracket = function unclosedBracket(bracket) {
      throw this.input.error("Unclosed bracket", bracket[2], bracket[3]);
    };
    _proto.unknownWord = function unknownWord(tokens) {
      throw this.input.error("Unknown word", tokens[0][2], tokens[0][3]);
    };
    _proto.unexpectedClose = function unexpectedClose(token) {
      throw this.input.error("Unexpected }", token[2], token[3]);
    };
    _proto.unclosedBlock = function unclosedBlock() {
      var pos = this.current.source.start;
      throw this.input.error("Unclosed block", pos.line, pos.column);
    };
    _proto.doubleColon = function doubleColon(token) {
      throw this.input.error("Double colon", token[2], token[3]);
    };
    _proto.unnamedAtrule = function unnamedAtrule(node2, token) {
      throw this.input.error("At-rule without name", token[2], token[3]);
    };
    _proto.precheckMissedSemicolon = function precheckMissedSemicolon() {
    };
    _proto.checkMissedSemicolon = function checkMissedSemicolon(tokens) {
      var colon2 = this.colon(tokens);
      if (colon2 === false)
        return;
      var founded = 0;
      var token;
      for (var j = colon2 - 1; j >= 0; j--) {
        token = tokens[j];
        if (token[0] !== "space") {
          founded += 1;
          if (founded === 2)
            break;
        }
      }
      throw this.input.error("Missed semicolon", token[2], token[3]);
    };
    return Parser4;
  }();
  exports.default = Parser3;
  module.exports = exports.default;
})(parser$2, parser$2.exports);
var input = { exports: {} };
var previousMap = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _sourceMap = _interopRequireDefault(sourceMap);
  var _path = _interopRequireDefault(require$$0);
  var _fs = _interopRequireDefault(require$$0);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function fromBase64(str) {
    if (Buffer) {
      return Buffer.from(str, "base64").toString();
    } else {
      return window.atob(str);
    }
  }
  var PreviousMap = /* @__PURE__ */ function() {
    function PreviousMap2(css, opts) {
      this.loadAnnotation(css);
      this.inline = this.startWith(this.annotation, "data:");
      var prev = opts.map ? opts.map.prev : void 0;
      var text = this.loadMap(opts.from, prev);
      if (text)
        this.text = text;
    }
    var _proto = PreviousMap2.prototype;
    _proto.consumer = function consumer() {
      if (!this.consumerCache) {
        this.consumerCache = new _sourceMap.default.SourceMapConsumer(this.text);
      }
      return this.consumerCache;
    };
    _proto.withContent = function withContent() {
      return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
    };
    _proto.startWith = function startWith(string2, start) {
      if (!string2)
        return false;
      return string2.substr(0, start.length) === start;
    };
    _proto.loadAnnotation = function loadAnnotation(css) {
      var match = css.match(/\/\*\s*# sourceMappingURL=(.*)\s*\*\//);
      if (match)
        this.annotation = match[1].trim();
    };
    _proto.decodeInline = function decodeInline(text) {
      var baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
      var baseUri = /^data:application\/json;base64,/;
      var uri = "data:application/json,";
      if (this.startWith(text, uri)) {
        return decodeURIComponent(text.substr(uri.length));
      }
      if (baseCharsetUri.test(text) || baseUri.test(text)) {
        return fromBase64(text.substr(RegExp.lastMatch.length));
      }
      var encoding = text.match(/data:application\/json;([^,]+),/)[1];
      throw new Error("Unsupported source map encoding " + encoding);
    };
    _proto.loadMap = function loadMap(file, prev) {
      if (prev === false)
        return false;
      if (prev) {
        if (typeof prev === "string") {
          return prev;
        } else if (typeof prev === "function") {
          var prevPath = prev(file);
          if (prevPath && _fs.default.existsSync && _fs.default.existsSync(prevPath)) {
            return _fs.default.readFileSync(prevPath, "utf-8").toString().trim();
          } else {
            throw new Error("Unable to load previous source map: " + prevPath.toString());
          }
        } else if (prev instanceof _sourceMap.default.SourceMapConsumer) {
          return _sourceMap.default.SourceMapGenerator.fromSourceMap(prev).toString();
        } else if (prev instanceof _sourceMap.default.SourceMapGenerator) {
          return prev.toString();
        } else if (this.isMap(prev)) {
          return JSON.stringify(prev);
        } else {
          throw new Error("Unsupported previous source map format: " + prev.toString());
        }
      } else if (this.inline) {
        return this.decodeInline(this.annotation);
      } else if (this.annotation) {
        var map = this.annotation;
        if (file)
          map = _path.default.join(_path.default.dirname(file), map);
        this.root = _path.default.dirname(map);
        if (_fs.default.existsSync && _fs.default.existsSync(map)) {
          return _fs.default.readFileSync(map, "utf-8").toString().trim();
        } else {
          return false;
        }
      }
    };
    _proto.isMap = function isMap(map) {
      if (typeof map !== "object")
        return false;
      return typeof map.mappings === "string" || typeof map._mappings === "string";
    };
    return PreviousMap2;
  }();
  var _default = PreviousMap;
  exports.default = _default;
  module.exports = exports.default;
})(previousMap, previousMap.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _path = _interopRequireDefault(require$$0);
  var _cssSyntaxError = _interopRequireDefault(cssSyntaxError.exports);
  var _previousMap = _interopRequireDefault(previousMap.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  var sequence = 0;
  var Input = /* @__PURE__ */ function() {
    function Input2(css, opts) {
      if (opts === void 0) {
        opts = {};
      }
      if (css === null || typeof css === "object" && !css.toString) {
        throw new Error("PostCSS received " + css + " instead of CSS string");
      }
      this.css = css.toString();
      if (this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE") {
        this.hasBOM = true;
        this.css = this.css.slice(1);
      } else {
        this.hasBOM = false;
      }
      if (opts.from) {
        if (/^\w+:\/\//.test(opts.from) || _path.default.isAbsolute(opts.from)) {
          this.file = opts.from;
        } else {
          this.file = _path.default.resolve(opts.from);
        }
      }
      var map = new _previousMap.default(this.css, opts);
      if (map.text) {
        this.map = map;
        var file = map.consumer().file;
        if (!this.file && file)
          this.file = this.mapResolve(file);
      }
      if (!this.file) {
        sequence += 1;
        this.id = "<input css " + sequence + ">";
      }
      if (this.map)
        this.map.file = this.from;
    }
    var _proto = Input2.prototype;
    _proto.error = function error(message, line, column, opts) {
      if (opts === void 0) {
        opts = {};
      }
      var result2;
      var origin = this.origin(line, column);
      if (origin) {
        result2 = new _cssSyntaxError.default(message, origin.line, origin.column, origin.source, origin.file, opts.plugin);
      } else {
        result2 = new _cssSyntaxError.default(message, line, column, this.css, this.file, opts.plugin);
      }
      result2.input = {
        line,
        column,
        source: this.css
      };
      if (this.file)
        result2.input.file = this.file;
      return result2;
    };
    _proto.origin = function origin(line, column) {
      if (!this.map)
        return false;
      var consumer = this.map.consumer();
      var from = consumer.originalPositionFor({
        line,
        column
      });
      if (!from.source)
        return false;
      var result2 = {
        file: this.mapResolve(from.source),
        line: from.line,
        column: from.column
      };
      var source = consumer.sourceContentFor(from.source);
      if (source)
        result2.source = source;
      return result2;
    };
    _proto.mapResolve = function mapResolve(file) {
      if (/^\w+:\/\//.test(file)) {
        return file;
      }
      return _path.default.resolve(this.map.consumer().sourceRoot || ".", file);
    };
    _createClass(Input2, [{
      key: "from",
      get: function get2() {
        return this.file || this.id;
      }
    }]);
    return Input2;
  }();
  var _default = Input;
  exports.default = _default;
  module.exports = exports.default;
})(input, input.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _parser = _interopRequireDefault(parser$2.exports);
  var _input = _interopRequireDefault(input.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function parse2(css, opts) {
    var input2 = new _input.default(css, opts);
    var parser2 = new _parser.default(input2);
    try {
      parser2.parse();
    } catch (e) {
      throw e;
    }
    return parser2.root;
  }
  var _default = parse2;
  exports.default = _default;
  module.exports = exports.default;
})(parse, parse.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _mapGenerator = _interopRequireDefault(mapGenerator.exports);
  var _stringify2 = _interopRequireDefault(stringify.exports);
  _interopRequireDefault(warnOnce.exports);
  var _result = _interopRequireDefault(result.exports);
  var _parse = _interopRequireDefault(parse.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor)
        descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps)
      _defineProperties(Constructor.prototype, protoProps);
    if (staticProps)
      _defineProperties(Constructor, staticProps);
    return Constructor;
  }
  function isPromise(obj) {
    return typeof obj === "object" && typeof obj.then === "function";
  }
  var LazyResult = /* @__PURE__ */ function() {
    function LazyResult2(processor2, css, opts) {
      this.stringified = false;
      this.processed = false;
      var root2;
      if (typeof css === "object" && css !== null && css.type === "root") {
        root2 = css;
      } else if (css instanceof LazyResult2 || css instanceof _result.default) {
        root2 = css.root;
        if (css.map) {
          if (typeof opts.map === "undefined")
            opts.map = {};
          if (!opts.map.inline)
            opts.map.inline = false;
          opts.map.prev = css.map;
        }
      } else {
        var parser2 = _parse.default;
        if (opts.syntax)
          parser2 = opts.syntax.parse;
        if (opts.parser)
          parser2 = opts.parser;
        if (parser2.parse)
          parser2 = parser2.parse;
        try {
          root2 = parser2(css, opts);
        } catch (error) {
          this.error = error;
        }
      }
      this.result = new _result.default(processor2, root2, opts);
    }
    var _proto = LazyResult2.prototype;
    _proto.warnings = function warnings() {
      return this.sync().warnings();
    };
    _proto.toString = function toString() {
      return this.css;
    };
    _proto.then = function then(onFulfilled, onRejected) {
      return this.async().then(onFulfilled, onRejected);
    };
    _proto.catch = function _catch(onRejected) {
      return this.async().catch(onRejected);
    };
    _proto.finally = function _finally(onFinally) {
      return this.async().then(onFinally, onFinally);
    };
    _proto.handleError = function handleError(error, plugin) {
      try {
        this.error = error;
        if (error.name === "CssSyntaxError" && !error.plugin) {
          error.plugin = plugin.postcssPlugin;
          error.setMessage();
        } else if (plugin.postcssVersion) {
          var pluginName, pluginVer, runtimeVer, a, b;
          if (false)
            ;
        }
      } catch (err) {
        if (console && console.error)
          console.error(err);
      }
    };
    _proto.asyncTick = function asyncTick(resolve2, reject) {
      var _this = this;
      if (this.plugin >= this.processor.plugins.length) {
        this.processed = true;
        return resolve2();
      }
      try {
        var plugin = this.processor.plugins[this.plugin];
        var promise = this.run(plugin);
        this.plugin += 1;
        if (isPromise(promise)) {
          promise.then(function() {
            _this.asyncTick(resolve2, reject);
          }).catch(function(error) {
            _this.handleError(error, plugin);
            _this.processed = true;
            reject(error);
          });
        } else {
          this.asyncTick(resolve2, reject);
        }
      } catch (error) {
        this.processed = true;
        reject(error);
      }
    };
    _proto.async = function async() {
      var _this2 = this;
      if (this.processed) {
        return new Promise(function(resolve2, reject) {
          if (_this2.error) {
            reject(_this2.error);
          } else {
            resolve2(_this2.stringify());
          }
        });
      }
      if (this.processing) {
        return this.processing;
      }
      this.processing = new Promise(function(resolve2, reject) {
        if (_this2.error)
          return reject(_this2.error);
        _this2.plugin = 0;
        _this2.asyncTick(resolve2, reject);
      }).then(function() {
        _this2.processed = true;
        return _this2.stringify();
      });
      return this.processing;
    };
    _proto.sync = function sync() {
      if (this.processed)
        return this.result;
      this.processed = true;
      if (this.processing) {
        throw new Error("Use process(css).then(cb) to work with async plugins");
      }
      if (this.error)
        throw this.error;
      for (var _iterator = this.result.processor.plugins, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ; ) {
        var _ref;
        if (_isArray) {
          if (_i >= _iterator.length)
            break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done)
            break;
          _ref = _i.value;
        }
        var plugin = _ref;
        var promise = this.run(plugin);
        if (isPromise(promise)) {
          throw new Error("Use process(css).then(cb) to work with async plugins");
        }
      }
      return this.result;
    };
    _proto.run = function run(plugin) {
      this.result.lastPlugin = plugin;
      try {
        return plugin(this.result.root, this.result);
      } catch (error) {
        this.handleError(error, plugin);
        throw error;
      }
    };
    _proto.stringify = function stringify2() {
      if (this.stringified)
        return this.result;
      this.stringified = true;
      this.sync();
      var opts = this.result.opts;
      var str = _stringify2.default;
      if (opts.syntax)
        str = opts.syntax.stringify;
      if (opts.stringifier)
        str = opts.stringifier;
      if (str.stringify)
        str = str.stringify;
      var map = new _mapGenerator.default(str, this.result.root, this.result.opts);
      var data = map.generate();
      this.result.css = data[0];
      this.result.map = data[1];
      return this.result;
    };
    _createClass(LazyResult2, [{
      key: "processor",
      get: function get2() {
        return this.result.processor;
      }
    }, {
      key: "opts",
      get: function get2() {
        return this.result.opts;
      }
    }, {
      key: "css",
      get: function get2() {
        return this.stringify().css;
      }
    }, {
      key: "content",
      get: function get2() {
        return this.stringify().content;
      }
    }, {
      key: "map",
      get: function get2() {
        return this.stringify().map;
      }
    }, {
      key: "root",
      get: function get2() {
        return this.sync().root;
      }
    }, {
      key: "messages",
      get: function get2() {
        return this.sync().messages;
      }
    }]);
    return LazyResult2;
  }();
  var _default = LazyResult;
  exports.default = _default;
  module.exports = exports.default;
})(lazyResult, lazyResult.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _lazyResult = _interopRequireDefault(lazyResult.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var Processor = /* @__PURE__ */ function() {
    function Processor2(plugins) {
      if (plugins === void 0) {
        plugins = [];
      }
      this.version = "7.0.30";
      this.plugins = this.normalize(plugins);
    }
    var _proto = Processor2.prototype;
    _proto.use = function use(plugin) {
      this.plugins = this.plugins.concat(this.normalize([plugin]));
      return this;
    };
    _proto.process = function(_process) {
      function process(_x) {
        return _process.apply(this, arguments);
      }
      process.toString = function() {
        return _process.toString();
      };
      return process;
    }(function(css, opts) {
      if (opts === void 0) {
        opts = {};
      }
      if (this.plugins.length === 0 && opts.parser === opts.stringifier)
        ;
      return new _lazyResult.default(this, css, opts);
    });
    _proto.normalize = function normalize(plugins) {
      var normalized = [];
      for (var _iterator = plugins, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ; ) {
        var _ref;
        if (_isArray) {
          if (_i >= _iterator.length)
            break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done)
            break;
          _ref = _i.value;
        }
        var i = _ref;
        if (i.postcss)
          i = i.postcss;
        if (typeof i === "object" && Array.isArray(i.plugins)) {
          normalized = normalized.concat(i.plugins);
        } else if (typeof i === "function") {
          normalized.push(i);
        } else if (typeof i === "object" && (i.parse || i.stringify))
          ;
        else {
          throw new Error(i + " is not a PostCSS plugin");
        }
      }
      return normalized;
    };
    return Processor2;
  }();
  var _default = Processor;
  exports.default = _default;
  module.exports = exports.default;
})(processor, processor.exports);
var vendor = { exports: {} };
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var vendor2 = {
    prefix: function prefix(prop) {
      var match = prop.match(/^(-\w+-)/);
      if (match) {
        return match[0];
      }
      return "";
    },
    unprefixed: function unprefixed(prop) {
      return prop.replace(/^-\w+-/, "");
    }
  };
  var _default = vendor2;
  exports.default = _default;
  module.exports = exports.default;
})(vendor, vendor.exports);
(function(module, exports) {
  exports.__esModule = true;
  exports.default = void 0;
  var _declaration = _interopRequireDefault(declaration.exports);
  var _processor = _interopRequireDefault(processor.exports);
  var _stringify = _interopRequireDefault(stringify.exports);
  var _comment = _interopRequireDefault(comment$1.exports);
  var _atRule = _interopRequireDefault(atRule.exports);
  var _vendor = _interopRequireDefault(vendor.exports);
  var _parse = _interopRequireDefault(parse.exports);
  var _list = _interopRequireDefault(list.exports);
  var _rule = _interopRequireDefault(rule.exports);
  var _root = _interopRequireDefault(root$1.exports);
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  function postcss2() {
    for (var _len = arguments.length, plugins = new Array(_len), _key = 0; _key < _len; _key++) {
      plugins[_key] = arguments[_key];
    }
    if (plugins.length === 1 && Array.isArray(plugins[0])) {
      plugins = plugins[0];
    }
    return new _processor.default(plugins);
  }
  postcss2.plugin = function plugin(name, initializer) {
    function creator() {
      var transformer = initializer.apply(void 0, arguments);
      transformer.postcssPlugin = name;
      transformer.postcssVersion = new _processor.default().version;
      return transformer;
    }
    var cache;
    Object.defineProperty(creator, "postcss", {
      get: function get2() {
        if (!cache)
          cache = creator();
        return cache;
      }
    });
    creator.process = function(css, processOpts, pluginOpts) {
      return postcss2([creator(pluginOpts)]).process(css, processOpts);
    };
    return creator;
  };
  postcss2.stringify = _stringify.default;
  postcss2.parse = _parse.default;
  postcss2.vendor = _vendor.default;
  postcss2.list = _list.default;
  postcss2.comment = function(defaults) {
    return new _comment.default(defaults);
  };
  postcss2.atRule = function(defaults) {
    return new _atRule.default(defaults);
  };
  postcss2.decl = function(defaults) {
    return new _declaration.default(defaults);
  };
  postcss2.rule = function(defaults) {
    return new _rule.default(defaults);
  };
  postcss2.root = function(defaults) {
    return new _root.default(defaults);
  };
  var _default = postcss2;
  exports.default = _default;
  module.exports = exports.default;
})(postcss$1, postcss$1.exports);
var postcss = /* @__PURE__ */ getDefaultExportFromCjs(postcss$1.exports);
let cloneNode = function(obj, parent) {
  let cloned = new obj.constructor();
  for (let i in obj) {
    if (!obj.hasOwnProperty(i))
      continue;
    let value2 = obj[i], type = typeof value2;
    if (i === "parent" && type === "object") {
      if (parent)
        cloned[i] = parent;
    } else if (i === "source") {
      cloned[i] = value2;
    } else if (value2 instanceof Array) {
      cloned[i] = value2.map((j) => cloneNode(j, cloned));
    } else if (i !== "before" && i !== "after" && i !== "between" && i !== "semicolon") {
      if (type === "object" && value2 !== null)
        value2 = cloneNode(value2);
      cloned[i] = value2;
    }
  }
  return cloned;
};
var node_1 = class Node {
  constructor(defaults) {
    defaults = defaults || {};
    this.raws = { before: "", after: "" };
    for (let name in defaults) {
      this[name] = defaults[name];
    }
  }
  remove() {
    if (this.parent) {
      this.parent.removeChild(this);
    }
    this.parent = void 0;
    return this;
  }
  toString() {
    return [
      this.raws.before,
      String(this.value),
      this.raws.after
    ].join("");
  }
  clone(overrides) {
    overrides = overrides || {};
    let cloned = cloneNode(this);
    for (let name in overrides) {
      cloned[name] = overrides[name];
    }
    return cloned;
  }
  cloneBefore(overrides) {
    overrides = overrides || {};
    let cloned = this.clone(overrides);
    this.parent.insertBefore(this, cloned);
    return cloned;
  }
  cloneAfter(overrides) {
    overrides = overrides || {};
    let cloned = this.clone(overrides);
    this.parent.insertAfter(this, cloned);
    return cloned;
  }
  replaceWith() {
    let nodes = Array.prototype.slice.call(arguments);
    if (this.parent) {
      for (let node2 of nodes) {
        this.parent.insertBefore(this, node2);
      }
      this.remove();
    }
    return this;
  }
  moveTo(container2) {
    this.cleanRaws(this.root() === container2.root());
    this.remove();
    container2.append(this);
    return this;
  }
  moveBefore(node2) {
    this.cleanRaws(this.root() === node2.root());
    this.remove();
    node2.parent.insertBefore(node2, this);
    return this;
  }
  moveAfter(node2) {
    this.cleanRaws(this.root() === node2.root());
    this.remove();
    node2.parent.insertAfter(node2, this);
    return this;
  }
  next() {
    let index = this.parent.index(this);
    return this.parent.nodes[index + 1];
  }
  prev() {
    let index = this.parent.index(this);
    return this.parent.nodes[index - 1];
  }
  toJSON() {
    let fixed = {};
    for (let name in this) {
      if (!this.hasOwnProperty(name))
        continue;
      if (name === "parent")
        continue;
      let value2 = this[name];
      if (value2 instanceof Array) {
        fixed[name] = value2.map((i) => {
          if (typeof i === "object" && i.toJSON) {
            return i.toJSON();
          } else {
            return i;
          }
        });
      } else if (typeof value2 === "object" && value2.toJSON) {
        fixed[name] = value2.toJSON();
      } else {
        fixed[name] = value2;
      }
    }
    return fixed;
  }
  root() {
    let result2 = this;
    while (result2.parent)
      result2 = result2.parent;
    return result2;
  }
  cleanRaws(keepBetween) {
    delete this.raws.before;
    delete this.raws.after;
    if (!keepBetween)
      delete this.raws.between;
  }
  positionInside(index) {
    let string2 = this.toString(), column = this.source.start.column, line = this.source.start.line;
    for (let i = 0; i < index; i++) {
      if (string2[i] === "\n") {
        column = 1;
        line += 1;
      } else {
        column += 1;
      }
    }
    return { line, column };
  }
  positionBy(opts) {
    let pos = this.source.start;
    if (opts.index) {
      pos = this.positionInside(opts.index);
    } else if (opts.word) {
      let index = this.toString().indexOf(opts.word);
      if (index !== -1)
        pos = this.positionInside(index);
    }
    return pos;
  }
};
const Node$9 = node_1;
class Container$d extends Node$9 {
  constructor(opts) {
    super(opts);
    if (!this.nodes) {
      this.nodes = [];
    }
  }
  push(child) {
    child.parent = this;
    this.nodes.push(child);
    return this;
  }
  each(callback) {
    if (!this.lastEach)
      this.lastEach = 0;
    if (!this.indexes)
      this.indexes = {};
    this.lastEach += 1;
    let id = this.lastEach, index, result2;
    this.indexes[id] = 0;
    if (!this.nodes)
      return void 0;
    while (this.indexes[id] < this.nodes.length) {
      index = this.indexes[id];
      result2 = callback(this.nodes[index], index);
      if (result2 === false)
        break;
      this.indexes[id] += 1;
    }
    delete this.indexes[id];
    return result2;
  }
  walk(callback) {
    return this.each((child, i) => {
      let result2 = callback(child, i);
      if (result2 !== false && child.walk) {
        result2 = child.walk(callback);
      }
      return result2;
    });
  }
  walkType(type, callback) {
    if (!type || !callback) {
      throw new Error("Parameters {type} and {callback} are required.");
    }
    type = type.name && type.prototype ? type.name : type;
    return this.walk((node2, index) => {
      if (node2.type === type) {
        return callback.call(this, node2, index);
      }
    });
  }
  append(node2) {
    node2.parent = this;
    this.nodes.push(node2);
    return this;
  }
  prepend(node2) {
    node2.parent = this;
    this.nodes.unshift(node2);
    return this;
  }
  cleanRaws(keepBetween) {
    super.cleanRaws(keepBetween);
    if (this.nodes) {
      for (let node2 of this.nodes)
        node2.cleanRaws(keepBetween);
    }
  }
  insertAfter(oldNode, newNode) {
    let oldIndex = this.index(oldNode), index;
    this.nodes.splice(oldIndex + 1, 0, newNode);
    for (let id in this.indexes) {
      index = this.indexes[id];
      if (oldIndex <= index) {
        this.indexes[id] = index + this.nodes.length;
      }
    }
    return this;
  }
  insertBefore(oldNode, newNode) {
    let oldIndex = this.index(oldNode), index;
    this.nodes.splice(oldIndex, 0, newNode);
    for (let id in this.indexes) {
      index = this.indexes[id];
      if (oldIndex <= index) {
        this.indexes[id] = index + this.nodes.length;
      }
    }
    return this;
  }
  removeChild(child) {
    child = this.index(child);
    this.nodes[child].parent = void 0;
    this.nodes.splice(child, 1);
    let index;
    for (let id in this.indexes) {
      index = this.indexes[id];
      if (index >= child) {
        this.indexes[id] = index - 1;
      }
    }
    return this;
  }
  removeAll() {
    for (let node2 of this.nodes)
      node2.parent = void 0;
    this.nodes = [];
    return this;
  }
  every(condition) {
    return this.nodes.every(condition);
  }
  some(condition) {
    return this.nodes.some(condition);
  }
  index(child) {
    if (typeof child === "number") {
      return child;
    } else {
      return this.nodes.indexOf(child);
    }
  }
  get first() {
    if (!this.nodes)
      return void 0;
    return this.nodes[0];
  }
  get last() {
    if (!this.nodes)
      return void 0;
    return this.nodes[this.nodes.length - 1];
  }
  toString() {
    let result2 = this.nodes.map(String).join("");
    if (this.value) {
      result2 = this.value + result2;
    }
    if (this.raws.before) {
      result2 = this.raws.before + result2;
    }
    if (this.raws.after) {
      result2 += this.raws.after;
    }
    return result2;
  }
}
Container$d.registerWalker = (constructor) => {
  let walkerName = "walk" + constructor.name;
  if (walkerName.lastIndexOf("s") !== walkerName.length - 1) {
    walkerName += "s";
  }
  if (Container$d.prototype[walkerName]) {
    return;
  }
  Container$d.prototype[walkerName] = function(callback) {
    return this.walkType(constructor, callback);
  };
};
var container = Container$d;
const Container$c = container;
var root = class Root extends Container$c {
  constructor(opts) {
    super(opts);
    this.type = "root";
  }
};
const Container$b = container;
var value = class Value extends Container$b {
  constructor(opts) {
    super(opts);
    this.type = "value";
    this.unbalanced = 0;
  }
};
const Container$a = container;
class AtWord$2 extends Container$a {
  constructor(opts) {
    super(opts);
    this.type = "atword";
  }
  toString() {
    this.quoted ? this.raws.quote : "";
    return [
      this.raws.before,
      "@",
      String.prototype.toString.call(this.value),
      this.raws.after
    ].join("");
  }
}
Container$a.registerWalker(AtWord$2);
var atword = AtWord$2;
const Container$9 = container;
const Node$8 = node_1;
class Colon$2 extends Node$8 {
  constructor(opts) {
    super(opts);
    this.type = "colon";
  }
}
Container$9.registerWalker(Colon$2);
var colon$1 = Colon$2;
const Container$8 = container;
const Node$7 = node_1;
class Comma$2 extends Node$7 {
  constructor(opts) {
    super(opts);
    this.type = "comma";
  }
}
Container$8.registerWalker(Comma$2);
var comma$1 = Comma$2;
const Container$7 = container;
const Node$6 = node_1;
class Comment$2 extends Node$6 {
  constructor(opts) {
    super(opts);
    this.type = "comment";
    this.inline = opts.inline || false;
  }
  toString() {
    return [
      this.raws.before,
      this.inline ? "//" : "/*",
      String(this.value),
      this.inline ? "" : "*/",
      this.raws.after
    ].join("");
  }
}
Container$7.registerWalker(Comment$2);
var comment = Comment$2;
const Container$6 = container;
class FunctionNode extends Container$6 {
  constructor(opts) {
    super(opts);
    this.type = "func";
    this.unbalanced = -1;
  }
}
Container$6.registerWalker(FunctionNode);
var _function = FunctionNode;
const Container$5 = container;
const Node$5 = node_1;
class NumberNode extends Node$5 {
  constructor(opts) {
    super(opts);
    this.type = "number";
    this.unit = opts.unit || "";
  }
  toString() {
    return [
      this.raws.before,
      String(this.value),
      this.unit,
      this.raws.after
    ].join("");
  }
}
Container$5.registerWalker(NumberNode);
var number = NumberNode;
const Container$4 = container;
const Node$4 = node_1;
class Operator$2 extends Node$4 {
  constructor(opts) {
    super(opts);
    this.type = "operator";
  }
}
Container$4.registerWalker(Operator$2);
var operator = Operator$2;
const Container$3 = container;
const Node$3 = node_1;
class Parenthesis extends Node$3 {
  constructor(opts) {
    super(opts);
    this.type = "paren";
    this.parenType = "";
  }
}
Container$3.registerWalker(Parenthesis);
var paren = Parenthesis;
const Container$2 = container;
const Node$2 = node_1;
class StringNode extends Node$2 {
  constructor(opts) {
    super(opts);
    this.type = "string";
  }
  toString() {
    let quote = this.quoted ? this.raws.quote : "";
    return [
      this.raws.before,
      quote,
      this.value + "",
      quote,
      this.raws.after
    ].join("");
  }
}
Container$2.registerWalker(StringNode);
var string = StringNode;
const Container$1 = container;
const Node$1 = node_1;
class Word$2 extends Node$1 {
  constructor(opts) {
    super(opts);
    this.type = "word";
  }
}
Container$1.registerWalker(Word$2);
var word = Word$2;
const Container = container;
const Node2 = node_1;
class UnicodeRange$2 extends Node2 {
  constructor(opts) {
    super(opts);
    this.type = "unicode-range";
  }
}
Container.registerWalker(UnicodeRange$2);
var unicodeRange$1 = UnicodeRange$2;
class TokenizeError$1 extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message || "An error ocurred while tokzenizing.";
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
var TokenizeError_1 = TokenizeError$1;
const openBracket = "{".charCodeAt(0);
const closeBracket = "}".charCodeAt(0);
const openParen = "(".charCodeAt(0);
const closeParen = ")".charCodeAt(0);
const singleQuote = "'".charCodeAt(0);
const doubleQuote = '"'.charCodeAt(0);
const backslash = "\\".charCodeAt(0);
const slash = "/".charCodeAt(0);
const period = ".".charCodeAt(0);
const comma = ",".charCodeAt(0);
const colon = ":".charCodeAt(0);
const asterisk = "*".charCodeAt(0);
const minus = "-".charCodeAt(0);
const plus = "+".charCodeAt(0);
const pound = "#".charCodeAt(0);
const newline = "\n".charCodeAt(0);
const space = " ".charCodeAt(0);
const feed = "\f".charCodeAt(0);
const tab = "	".charCodeAt(0);
const cr = "\r".charCodeAt(0);
const at = "@".charCodeAt(0);
const lowerE = "e".charCodeAt(0);
const upperE = "E".charCodeAt(0);
const digit0 = "0".charCodeAt(0);
const digit9 = "9".charCodeAt(0);
const lowerU = "u".charCodeAt(0);
const upperU = "U".charCodeAt(0);
const atEnd = /[ \n\t\r\{\(\)'"\\;,/]/g;
const wordEnd = /[ \n\t\r\(\)\{\}\*:;@!&'"\+\|~>,\[\]\\]|\/(?=\*)/g;
const wordEndNum = /[ \n\t\r\(\)\{\}\*:;@!&'"\-\+\|~>,\[\]\\]|\//g;
const alphaNum = /^[a-z0-9]/i;
const unicodeRange = /^[a-f0-9?\-]/i;
const util = require$$0;
const TokenizeError = TokenizeError_1;
var tokenize$1 = function tokenize(input2, options) {
  options = options || {};
  let tokens = [], css = input2.valueOf(), length = css.length, offset = -1, line = 1, pos = 0, parentCount = 0, isURLArg = null, code, next, quote, lines, last, content, nextLine, nextOffset, escaped, escapePos, nextChar;
  function unclosed(what) {
    let message = util.format("Unclosed %s at line: %d, column: %d, token: %d", what, line, pos - offset, pos);
    throw new TokenizeError(message);
  }
  while (pos < length) {
    code = css.charCodeAt(pos);
    if (code === newline) {
      offset = pos;
      line += 1;
    }
    switch (code) {
      case newline:
      case space:
      case tab:
      case cr:
      case feed:
        next = pos;
        do {
          next += 1;
          code = css.charCodeAt(next);
          if (code === newline) {
            offset = next;
            line += 1;
          }
        } while (code === space || code === newline || code === tab || code === cr || code === feed);
        tokens.push([
          "space",
          css.slice(pos, next),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next - 1;
        break;
      case colon:
        next = pos + 1;
        tokens.push([
          "colon",
          css.slice(pos, next),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next - 1;
        break;
      case comma:
        next = pos + 1;
        tokens.push([
          "comma",
          css.slice(pos, next),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next - 1;
        break;
      case openBracket:
        tokens.push([
          "{",
          "{",
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        break;
      case closeBracket:
        tokens.push([
          "}",
          "}",
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        break;
      case openParen:
        parentCount++;
        isURLArg = !isURLArg && parentCount === 1 && tokens.length > 0 && tokens[tokens.length - 1][0] === "word" && tokens[tokens.length - 1][1] === "url";
        tokens.push([
          "(",
          "(",
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        break;
      case closeParen:
        parentCount--;
        isURLArg = !isURLArg && parentCount === 1;
        tokens.push([
          ")",
          ")",
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        break;
      case singleQuote:
      case doubleQuote:
        quote = code === singleQuote ? "'" : '"';
        next = pos;
        do {
          escaped = false;
          next = css.indexOf(quote, next + 1);
          if (next === -1) {
            unclosed("quote");
          }
          escapePos = next;
          while (css.charCodeAt(escapePos - 1) === backslash) {
            escapePos -= 1;
            escaped = !escaped;
          }
        } while (escaped);
        tokens.push([
          "string",
          css.slice(pos, next + 1),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next;
        break;
      case at:
        atEnd.lastIndex = pos + 1;
        atEnd.test(css);
        if (atEnd.lastIndex === 0) {
          next = css.length - 1;
        } else {
          next = atEnd.lastIndex - 2;
        }
        tokens.push([
          "atword",
          css.slice(pos, next + 1),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next;
        break;
      case backslash:
        next = pos;
        code = css.charCodeAt(next + 1);
        tokens.push([
          "word",
          css.slice(pos, next + 1),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next;
        break;
      case plus:
      case minus:
      case asterisk:
        next = pos + 1;
        nextChar = css.slice(pos + 1, next + 1);
        css.slice(pos - 1, pos);
        if (code === minus && nextChar.charCodeAt(0) === minus) {
          next++;
          tokens.push([
            "word",
            css.slice(pos, next),
            line,
            pos - offset,
            line,
            next - offset,
            pos
          ]);
          pos = next - 1;
          break;
        }
        tokens.push([
          "operator",
          css.slice(pos, next),
          line,
          pos - offset,
          line,
          next - offset,
          pos
        ]);
        pos = next - 1;
        break;
      default:
        if (code === slash && (css.charCodeAt(pos + 1) === asterisk || options.loose && !isURLArg && css.charCodeAt(pos + 1) === slash)) {
          const isStandardComment = css.charCodeAt(pos + 1) === asterisk;
          if (isStandardComment) {
            next = css.indexOf("*/", pos + 2) + 1;
            if (next === 0) {
              unclosed("comment");
            }
          } else {
            const newlinePos = css.indexOf("\n", pos + 2);
            next = newlinePos !== -1 ? newlinePos - 1 : length;
          }
          content = css.slice(pos, next + 1);
          lines = content.split("\n");
          last = lines.length - 1;
          if (last > 0) {
            nextLine = line + last;
            nextOffset = next - lines[last].length;
          } else {
            nextLine = line;
            nextOffset = offset;
          }
          tokens.push([
            "comment",
            content,
            line,
            pos - offset,
            nextLine,
            next - nextOffset,
            pos
          ]);
          offset = nextOffset;
          line = nextLine;
          pos = next;
        } else if (code === pound && !alphaNum.test(css.slice(pos + 1, pos + 2))) {
          next = pos + 1;
          tokens.push([
            "#",
            css.slice(pos, next),
            line,
            pos - offset,
            line,
            next - offset,
            pos
          ]);
          pos = next - 1;
        } else if ((code === lowerU || code === upperU) && css.charCodeAt(pos + 1) === plus) {
          next = pos + 2;
          do {
            next += 1;
            code = css.charCodeAt(next);
          } while (next < length && unicodeRange.test(css.slice(next, next + 1)));
          tokens.push([
            "unicoderange",
            css.slice(pos, next),
            line,
            pos - offset,
            line,
            next - offset,
            pos
          ]);
          pos = next - 1;
        } else if (code === slash) {
          next = pos + 1;
          tokens.push([
            "operator",
            css.slice(pos, next),
            line,
            pos - offset,
            line,
            next - offset,
            pos
          ]);
          pos = next - 1;
        } else {
          let regex = wordEnd;
          if (code >= digit0 && code <= digit9) {
            regex = wordEndNum;
          }
          regex.lastIndex = pos + 1;
          regex.test(css);
          if (regex.lastIndex === 0) {
            next = css.length - 1;
          } else {
            next = regex.lastIndex - 2;
          }
          if (regex === wordEndNum || code === period) {
            let ncode = css.charCodeAt(next), ncode1 = css.charCodeAt(next + 1), ncode2 = css.charCodeAt(next + 2);
            if ((ncode === lowerE || ncode === upperE) && (ncode1 === minus || ncode1 === plus) && (ncode2 >= digit0 && ncode2 <= digit9)) {
              wordEndNum.lastIndex = next + 2;
              wordEndNum.test(css);
              if (wordEndNum.lastIndex === 0) {
                next = css.length - 1;
              } else {
                next = wordEndNum.lastIndex - 2;
              }
            }
          }
          tokens.push([
            "word",
            css.slice(pos, next + 1),
            line,
            pos - offset,
            line,
            next - offset,
            pos
          ]);
          pos = next;
        }
        break;
    }
    pos++;
  }
  return tokens;
};
var flatten$1 = function flatten(list2, depth) {
  depth = typeof depth == "number" ? depth : Infinity;
  if (!depth) {
    if (Array.isArray(list2)) {
      return list2.map(function(i) {
        return i;
      });
    }
    return list2;
  }
  return _flatten(list2, 1);
  function _flatten(list3, d) {
    return list3.reduce(function(acc, item) {
      if (Array.isArray(item) && d < depth) {
        return acc.concat(_flatten(item, d + 1));
      } else {
        return acc.concat(item);
      }
    }, []);
  }
};
var indexesOf$1 = function(ary, item) {
  var i = -1, indexes = [];
  while ((i = ary.indexOf(item, i + 1)) !== -1)
    indexes.push(i);
  return indexes;
};
function unique_pred(list2, compare) {
  var ptr = 1, len = list2.length, a = list2[0], b = list2[0];
  for (var i = 1; i < len; ++i) {
    b = a;
    a = list2[i];
    if (compare(a, b)) {
      if (i === ptr) {
        ptr++;
        continue;
      }
      list2[ptr++] = a;
    }
  }
  list2.length = ptr;
  return list2;
}
function unique_eq(list2) {
  var ptr = 1, len = list2.length, a = list2[0], b = list2[0];
  for (var i = 1; i < len; ++i, b = a) {
    b = a;
    a = list2[i];
    if (a !== b) {
      if (i === ptr) {
        ptr++;
        continue;
      }
      list2[ptr++] = a;
    }
  }
  list2.length = ptr;
  return list2;
}
function unique(list2, compare, sorted) {
  if (list2.length === 0) {
    return list2;
  }
  if (compare) {
    if (!sorted) {
      list2.sort(compare);
    }
    return unique_pred(list2, compare);
  }
  if (!sorted) {
    list2.sort();
  }
  return unique_eq(list2);
}
var uniq$2 = unique;
class ParserError$1 extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    this.message = message || "An error ocurred while parsing.";
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}
var ParserError_1 = ParserError$1;
const Root2 = root;
const Value$1 = value;
const AtWord$1 = atword;
const Colon$1 = colon$1;
const Comma$1 = comma$1;
const Comment$1 = comment;
const Func$1 = _function;
const Numbr = number;
const Operator$1 = operator;
const Paren$1 = paren;
const Str$1 = string;
const Word$1 = word;
const UnicodeRange$1 = unicodeRange$1;
const tokenize2 = tokenize$1;
const flatten2 = flatten$1;
const indexesOf = indexesOf$1;
const uniq$1 = uniq$2;
const ParserError = ParserError_1;
function sortAscending(list2) {
  return list2.sort((a, b) => a - b);
}
var parser$1 = class Parser {
  constructor(input2, options) {
    const defaults = { loose: false };
    this.cache = [];
    this.input = input2;
    this.options = Object.assign({}, defaults, options);
    this.position = 0;
    this.unbalanced = 0;
    this.root = new Root2();
    let value2 = new Value$1();
    this.root.append(value2);
    this.current = value2;
    this.tokens = tokenize2(input2, this.options);
  }
  parse() {
    return this.loop();
  }
  colon() {
    let token = this.currToken;
    this.newNode(new Colon$1({
      value: token[1],
      source: {
        start: {
          line: token[2],
          column: token[3]
        },
        end: {
          line: token[4],
          column: token[5]
        }
      },
      sourceIndex: token[6]
    }));
    this.position++;
  }
  comma() {
    let token = this.currToken;
    this.newNode(new Comma$1({
      value: token[1],
      source: {
        start: {
          line: token[2],
          column: token[3]
        },
        end: {
          line: token[4],
          column: token[5]
        }
      },
      sourceIndex: token[6]
    }));
    this.position++;
  }
  comment() {
    let inline = false, value2 = this.currToken[1].replace(/\/\*|\*\//g, ""), node2;
    if (this.options.loose && value2.startsWith("//")) {
      value2 = value2.substring(2);
      inline = true;
    }
    node2 = new Comment$1({
      value: value2,
      inline,
      source: {
        start: {
          line: this.currToken[2],
          column: this.currToken[3]
        },
        end: {
          line: this.currToken[4],
          column: this.currToken[5]
        }
      },
      sourceIndex: this.currToken[6]
    });
    this.newNode(node2);
    this.position++;
  }
  error(message, token) {
    throw new ParserError(message + ` at line: ${token[2]}, column ${token[3]}`);
  }
  loop() {
    while (this.position < this.tokens.length) {
      this.parseTokens();
    }
    if (!this.current.last && this.spaces) {
      this.current.raws.before += this.spaces;
    } else if (this.spaces) {
      this.current.last.raws.after += this.spaces;
    }
    this.spaces = "";
    return this.root;
  }
  operator() {
    let char = this.currToken[1], node2;
    if (char === "+" || char === "-") {
      if (!this.options.loose) {
        if (this.position > 0) {
          if (this.current.type === "func" && this.current.value === "calc") {
            if (this.prevToken[0] !== "space" && this.prevToken[0] !== "(") {
              this.error("Syntax Error", this.currToken);
            } else if (this.nextToken[0] !== "space" && this.nextToken[0] !== "word") {
              this.error("Syntax Error", this.currToken);
            } else if (this.nextToken[0] === "word" && this.current.last.type !== "operator" && this.current.last.value !== "(") {
              this.error("Syntax Error", this.currToken);
            }
          } else if (this.nextToken[0] === "space" || this.nextToken[0] === "operator" || this.prevToken[0] === "operator") {
            this.error("Syntax Error", this.currToken);
          }
        }
      }
      if (!this.options.loose) {
        if (this.nextToken[0] === "word") {
          return this.word();
        }
      } else {
        if ((!this.current.nodes.length || this.current.last && this.current.last.type === "operator") && this.nextToken[0] === "word") {
          return this.word();
        }
      }
    }
    node2 = new Operator$1({
      value: this.currToken[1],
      source: {
        start: {
          line: this.currToken[2],
          column: this.currToken[3]
        },
        end: {
          line: this.currToken[2],
          column: this.currToken[3]
        }
      },
      sourceIndex: this.currToken[4]
    });
    this.position++;
    return this.newNode(node2);
  }
  parseTokens() {
    switch (this.currToken[0]) {
      case "space":
        this.space();
        break;
      case "colon":
        this.colon();
        break;
      case "comma":
        this.comma();
        break;
      case "comment":
        this.comment();
        break;
      case "(":
        this.parenOpen();
        break;
      case ")":
        this.parenClose();
        break;
      case "atword":
      case "word":
        this.word();
        break;
      case "operator":
        this.operator();
        break;
      case "string":
        this.string();
        break;
      case "unicoderange":
        this.unicodeRange();
        break;
      default:
        this.word();
        break;
    }
  }
  parenOpen() {
    let unbalanced = 1, pos = this.position + 1, token = this.currToken, last;
    while (pos < this.tokens.length && unbalanced) {
      let tkn = this.tokens[pos];
      if (tkn[0] === "(") {
        unbalanced++;
      }
      if (tkn[0] === ")") {
        unbalanced--;
      }
      pos++;
    }
    if (unbalanced) {
      this.error("Expected closing parenthesis", token);
    }
    last = this.current.last;
    if (last && last.type === "func" && last.unbalanced < 0) {
      last.unbalanced = 0;
      this.current = last;
    }
    this.current.unbalanced++;
    this.newNode(new Paren$1({
      value: token[1],
      source: {
        start: {
          line: token[2],
          column: token[3]
        },
        end: {
          line: token[4],
          column: token[5]
        }
      },
      sourceIndex: token[6]
    }));
    this.position++;
    if (this.current.type === "func" && this.current.unbalanced && this.current.value === "url" && this.currToken[0] !== "string" && this.currToken[0] !== ")" && !this.options.loose) {
      let nextToken = this.nextToken, value2 = this.currToken[1], start = {
        line: this.currToken[2],
        column: this.currToken[3]
      };
      while (nextToken && nextToken[0] !== ")" && this.current.unbalanced) {
        this.position++;
        value2 += this.currToken[1];
        nextToken = this.nextToken;
      }
      if (this.position !== this.tokens.length - 1) {
        this.position++;
        this.newNode(new Word$1({
          value: value2,
          source: {
            start,
            end: {
              line: this.currToken[4],
              column: this.currToken[5]
            }
          },
          sourceIndex: this.currToken[6]
        }));
      }
    }
  }
  parenClose() {
    let token = this.currToken;
    this.newNode(new Paren$1({
      value: token[1],
      source: {
        start: {
          line: token[2],
          column: token[3]
        },
        end: {
          line: token[4],
          column: token[5]
        }
      },
      sourceIndex: token[6]
    }));
    this.position++;
    if (this.position >= this.tokens.length - 1 && !this.current.unbalanced) {
      return;
    }
    this.current.unbalanced--;
    if (this.current.unbalanced < 0) {
      this.error("Expected opening parenthesis", token);
    }
    if (!this.current.unbalanced && this.cache.length) {
      this.current = this.cache.pop();
    }
  }
  space() {
    let token = this.currToken;
    if (this.position === this.tokens.length - 1 || this.nextToken[0] === "," || this.nextToken[0] === ")") {
      this.current.last.raws.after += token[1];
      this.position++;
    } else {
      this.spaces = token[1];
      this.position++;
    }
  }
  unicodeRange() {
    let token = this.currToken;
    this.newNode(new UnicodeRange$1({
      value: token[1],
      source: {
        start: {
          line: token[2],
          column: token[3]
        },
        end: {
          line: token[4],
          column: token[5]
        }
      },
      sourceIndex: token[6]
    }));
    this.position++;
  }
  splitWord() {
    let nextToken = this.nextToken, word2 = this.currToken[1], rNumber = /^[\+\-]?((\d+(\.\d*)?)|(\.\d+))([eE][\+\-]?\d+)?/, rNoFollow = /^(?!\#([a-z0-9]+))[\#\{\}]/gi, hasAt, indices;
    if (!rNoFollow.test(word2)) {
      while (nextToken && nextToken[0] === "word") {
        this.position++;
        let current = this.currToken[1];
        word2 += current;
        nextToken = this.nextToken;
      }
    }
    hasAt = indexesOf(word2, "@");
    indices = sortAscending(uniq$1(flatten2([[0], hasAt])));
    indices.forEach((ind, i) => {
      let index = indices[i + 1] || word2.length, value2 = word2.slice(ind, index), node2;
      if (~hasAt.indexOf(ind)) {
        node2 = new AtWord$1({
          value: value2.slice(1),
          source: {
            start: {
              line: this.currToken[2],
              column: this.currToken[3] + ind
            },
            end: {
              line: this.currToken[4],
              column: this.currToken[3] + (index - 1)
            }
          },
          sourceIndex: this.currToken[6] + indices[i]
        });
      } else if (rNumber.test(this.currToken[1])) {
        let unit = value2.replace(rNumber, "");
        node2 = new Numbr({
          value: value2.replace(unit, ""),
          source: {
            start: {
              line: this.currToken[2],
              column: this.currToken[3] + ind
            },
            end: {
              line: this.currToken[4],
              column: this.currToken[3] + (index - 1)
            }
          },
          sourceIndex: this.currToken[6] + indices[i],
          unit
        });
      } else {
        node2 = new (nextToken && nextToken[0] === "(" ? Func$1 : Word$1)({
          value: value2,
          source: {
            start: {
              line: this.currToken[2],
              column: this.currToken[3] + ind
            },
            end: {
              line: this.currToken[4],
              column: this.currToken[3] + (index - 1)
            }
          },
          sourceIndex: this.currToken[6] + indices[i]
        });
        if (node2.constructor.name === "Word") {
          node2.isHex = /^#(.+)/.test(value2);
          node2.isColor = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value2);
        } else {
          this.cache.push(this.current);
        }
      }
      this.newNode(node2);
    });
    this.position++;
  }
  string() {
    let token = this.currToken, value2 = this.currToken[1], rQuote = /^(\"|\')/, quoted = rQuote.test(value2), quote = "", node2;
    if (quoted) {
      quote = value2.match(rQuote)[0];
      value2 = value2.slice(1, value2.length - 1);
    }
    node2 = new Str$1({
      value: value2,
      source: {
        start: {
          line: token[2],
          column: token[3]
        },
        end: {
          line: token[4],
          column: token[5]
        }
      },
      sourceIndex: token[6],
      quoted
    });
    node2.raws.quote = quote;
    this.newNode(node2);
    this.position++;
  }
  word() {
    return this.splitWord();
  }
  newNode(node2) {
    if (this.spaces) {
      node2.raws.before += this.spaces;
      this.spaces = "";
    }
    return this.current.append(node2);
  }
  get currToken() {
    return this.tokens[this.position];
  }
  get nextToken() {
    return this.tokens[this.position + 1];
  }
  get prevToken() {
    return this.tokens[this.position - 1];
  }
};
const Parser2 = parser$1;
const AtWord = atword;
const Colon = colon$1;
const Comma = comma$1;
const Comment = comment;
const Func = _function;
const Num = number;
const Operator = operator;
const Paren = paren;
const Str = string;
const UnicodeRange = unicodeRange$1;
const Value2 = value;
const Word = word;
let parser = function(source, options) {
  return new Parser2(source, options);
};
parser.atword = function(opts) {
  return new AtWord(opts);
};
parser.colon = function(opts) {
  opts.value = opts.value || ":";
  return new Colon(opts);
};
parser.comma = function(opts) {
  opts.value = opts.value || ",";
  return new Comma(opts);
};
parser.comment = function(opts) {
  return new Comment(opts);
};
parser.func = function(opts) {
  return new Func(opts);
};
parser.number = function(opts) {
  return new Num(opts);
};
parser.operator = function(opts) {
  return new Operator(opts);
};
parser.paren = function(opts) {
  opts.value = opts.value || "(";
  return new Paren(opts);
};
parser.string = function(opts) {
  opts.quote = opts.quote || "'";
  return new Str(opts);
};
parser.value = function(opts) {
  return new Value2(opts);
};
parser.word = function(opts) {
  return new Word(opts);
};
parser.unicodeRange = function(opts) {
  return new UnicodeRange(opts);
};
var lib = parser;
var relativeToAbsoluteIri = {};
var Resolve = {};
Object.defineProperty(Resolve, "__esModule", { value: true });
function resolve(relativeIRI, baseIRI) {
  baseIRI = baseIRI || "";
  const baseFragmentPos = baseIRI.indexOf("#");
  if (baseFragmentPos > 0) {
    baseIRI = baseIRI.substr(0, baseFragmentPos);
  }
  if (!relativeIRI.length) {
    return baseIRI;
  }
  if (relativeIRI.startsWith("?")) {
    const baseQueryPos = baseIRI.indexOf("?");
    if (baseQueryPos > 0) {
      baseIRI = baseIRI.substr(0, baseQueryPos);
    }
    return baseIRI + relativeIRI;
  }
  if (relativeIRI.startsWith("#")) {
    return baseIRI + relativeIRI;
  }
  if (!baseIRI.length) {
    return removeDotSegmentsOfPath(relativeIRI, relativeIRI.indexOf(":"));
  }
  const valueColonPos = relativeIRI.indexOf(":");
  if (valueColonPos >= 0) {
    return removeDotSegmentsOfPath(relativeIRI, valueColonPos);
  }
  const baseColonPos = baseIRI.indexOf(":");
  if (baseColonPos < 0) {
    throw new Error(`Found invalid baseIRI '${baseIRI}' for value '${relativeIRI}'`);
  }
  const baseIRIScheme = baseIRI.substr(0, baseColonPos + 1);
  if (relativeIRI.indexOf("//") === 0) {
    return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
  }
  let baseSlashAfterColonPos;
  if (baseIRI.indexOf("//", baseColonPos) === baseColonPos + 1) {
    baseSlashAfterColonPos = baseIRI.indexOf("/", baseColonPos + 3);
    if (baseSlashAfterColonPos < 0) {
      if (baseIRI.length > baseColonPos + 3) {
        return baseIRI + "/" + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
      } else {
        return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
      }
    }
  } else {
    baseSlashAfterColonPos = baseIRI.indexOf("/", baseColonPos + 1);
    if (baseSlashAfterColonPos < 0) {
      return baseIRIScheme + removeDotSegmentsOfPath(relativeIRI, valueColonPos);
    }
  }
  if (relativeIRI.indexOf("/") === 0) {
    return baseIRI.substr(0, baseSlashAfterColonPos) + removeDotSegments(relativeIRI);
  }
  let baseIRIPath = baseIRI.substr(baseSlashAfterColonPos);
  const baseIRILastSlashPos = baseIRIPath.lastIndexOf("/");
  if (baseIRILastSlashPos >= 0 && baseIRILastSlashPos < baseIRIPath.length - 1) {
    baseIRIPath = baseIRIPath.substr(0, baseIRILastSlashPos + 1);
    if (relativeIRI[0] === "." && relativeIRI[1] !== "." && relativeIRI[1] !== "/" && relativeIRI[2]) {
      relativeIRI = relativeIRI.substr(1);
    }
  }
  relativeIRI = baseIRIPath + relativeIRI;
  relativeIRI = removeDotSegments(relativeIRI);
  return baseIRI.substr(0, baseSlashAfterColonPos) + relativeIRI;
}
Resolve.resolve = resolve;
function removeDotSegments(path) {
  const segmentBuffers = [];
  let i = 0;
  while (i < path.length) {
    switch (path[i]) {
      case "/":
        if (path[i + 1] === ".") {
          if (path[i + 2] === ".") {
            if (!isCharacterAllowedAfterRelativePathSegment(path[i + 3])) {
              segmentBuffers.push([]);
              i++;
              break;
            }
            segmentBuffers.pop();
            if (!path[i + 3]) {
              segmentBuffers.push([]);
            }
            i += 3;
          } else {
            if (!isCharacterAllowedAfterRelativePathSegment(path[i + 2])) {
              segmentBuffers.push([]);
              i++;
              break;
            }
            if (!path[i + 2]) {
              segmentBuffers.push([]);
            }
            i += 2;
          }
        } else {
          segmentBuffers.push([]);
          i++;
        }
        break;
      case "#":
      case "?":
        if (!segmentBuffers.length) {
          segmentBuffers.push([]);
        }
        segmentBuffers[segmentBuffers.length - 1].push(path.substr(i));
        i = path.length;
        break;
      default:
        if (!segmentBuffers.length) {
          segmentBuffers.push([]);
        }
        segmentBuffers[segmentBuffers.length - 1].push(path[i]);
        i++;
        break;
    }
  }
  return "/" + segmentBuffers.map((buffer) => buffer.join("")).join("/");
}
Resolve.removeDotSegments = removeDotSegments;
function removeDotSegmentsOfPath(iri, colonPosition) {
  let searchOffset = colonPosition + 1;
  if (colonPosition >= 0) {
    if (iri[colonPosition + 1] === "/" && iri[colonPosition + 2] === "/") {
      searchOffset = colonPosition + 3;
    }
  } else {
    if (iri[0] === "/" && iri[1] === "/") {
      searchOffset = 2;
    }
  }
  const pathSeparator = iri.indexOf("/", searchOffset);
  if (pathSeparator < 0) {
    return iri;
  }
  const base = iri.substr(0, pathSeparator);
  const path = iri.substr(pathSeparator);
  return base + removeDotSegments(path);
}
Resolve.removeDotSegmentsOfPath = removeDotSegmentsOfPath;
function isCharacterAllowedAfterRelativePathSegment(character) {
  return !character || character === "#" || character === "?" || character === "/";
}
(function(exports) {
  function __export(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  Object.defineProperty(exports, "__esModule", { value: true });
  __export(Resolve);
})(relativeToAbsoluteIri);
function removeScripts(rootElement, config) {
  removeScriptElements(rootElement);
  removeEventHandlers(rootElement);
  removeJavascriptHrefs(rootElement, config);
}
function removeScriptElements(rootElement) {
  const scripts = Array.from(rootElement.querySelectorAll("script"));
  scripts.forEach((element) => {
    var _a;
    return (_a = element.parentNode) == null ? void 0 : _a.removeChild(element);
  });
}
function removeEventHandlers(rootElement) {
  const elements = Array.from(rootElement.querySelectorAll("*"));
  elements.forEach((element) => {
    Array.from(element.attributes).filter((attribute) => attribute.name.toLowerCase().startsWith("on")).forEach((attribute) => {
      element.removeAttribute(attribute.name);
    });
  });
}
function removeJavascriptHrefs(rootElement, config) {
  const linkElements = Array.from(rootElement.querySelectorAll("a, area")).filter((element) => element instanceof config.glob.HTMLElement);
  linkElements.filter((element) => element.href.startsWith("javascript:")).forEach((element) => {
    element.setAttribute("href", "javascript:");
  });
}
function makeDomStatic(doc, config) {
  removeScripts(doc.documentElement, config);
  const noscripts = Array.from(doc.querySelectorAll("noscript"));
  noscripts.forEach((element) => {
    var _a;
    return (_a = element.parentNode) == null ? void 0 : _a.removeChild(element);
  });
  const editableElements = Array.from(doc.querySelectorAll("*[contenteditable]")).filter((element) => element instanceof config.glob.HTMLElement);
  editableElements.forEach((element) => {
    element.contentEditable = "false";
  });
}
class Resource {
  get subresourceLinks() {
    return this.links.filter((link) => link.isSubresource).filter((link) => Resource.getResourceClass(link.subresourceType));
  }
  static async fromBlob({ url, blob, subresourceType, config }) {
    const resourceClass = this.getResourceClass(subresourceType);
    if (resourceClass === void 0) {
      throw new Error(`Not sure how to interpret resource of type '${subresourceType}'`);
    }
    const resource = await resourceClass.fromBlob({ url, blob, config });
    return resource;
  }
  static getResourceClass(subresourceType) {
    const resourceClasses = {
      document: DomResource,
      style: StylesheetResource,
      image: LeafResource,
      video: LeafResource,
      font: LeafResource
    };
    if (subresourceType === void 0) {
      return void 0;
    }
    return resourceClasses[subresourceType];
  }
}
function tryParseUrl(url, baseUrl) {
  try {
    return relativeToAbsoluteIri.resolve(url, baseUrl);
  } catch (err) {
    return void 0;
  }
}
const parsedView = (parse2) => (value2) => {
  const parsedValue = parse2(value2);
  const tokens = [];
  const glueStrings = [];
  let start = 0;
  for (const { token, index, note } of parsedValue) {
    glueStrings.push(value2.substring(start, index));
    tokens.push({
      token,
      get index() {
        return index;
      },
      get note() {
        return note;
      }
    });
    start = index + token.length;
  }
  glueStrings.push(value2.substring(start));
  tokens.toString = () => {
    let newValue = glueStrings[0];
    tokens.forEach(({ token }, i) => {
      newValue += token + glueStrings[i + 1];
    });
    return newValue;
  };
  return tokens;
};
const syncingParsedView = ({ parse: parse2, get: get2, set }) => deepSyncingProxy(transformingCache({
  get: get2,
  set,
  transform: parsedView(parse2),
  untransform: (stringView) => stringView.toString()
}));
function transformingCache({
  get: get2,
  set,
  transform,
  untransform,
  isEqual = (a, b) => a === b
}) {
  const uninitialised = Symbol("uninitialised");
  let lastValue = uninitialised;
  let lastTransformedValue = uninitialised;
  return {
    get() {
      const newValue = get2();
      if (lastValue === uninitialised || !isEqual(newValue, lastValue) || lastTransformedValue === uninitialised) {
        lastTransformedValue = transform(newValue);
      }
      lastValue = newValue;
      return lastTransformedValue;
    },
    set(transformedValue, { trustCache = false } = {}) {
      const newValue = untransform(transformedValue);
      const currentValue = trustCache ? lastValue : get2();
      if (currentValue === uninitialised || !isEqual(newValue, currentValue)) {
        set(newValue);
      }
      lastValue = newValue;
      lastTransformedValue = transformedValue;
    }
  };
}
function deepSyncingProxy({ get: get2, set, alwaysSet = false }) {
  let rootObject;
  const getRootObject = () => {
    rootObject = get2();
  };
  const writeBack = () => {
    set(rootObject);
  };
  function createProxy(object, path) {
    const { proxy, setTarget } = build(object);
    const refreshProxyTarget = () => {
      getRootObject();
      if (!isNonNullObject(rootObject))
        throw new TypeError(`Expected get()${path} to be an object, but get() is ${rootObject}.`);
      let targetWalker = rootObject;
      const properties = path.split(".").slice(1);
      for (let i = 0; i < properties.length; i++) {
        const child = targetWalker[properties[i]];
        if (!isNonNullObject(child)) {
          const pathSoFar = "." + properties.slice(0, i + 1).join(".");
          throw new TypeError(`Expected get()${path} to be an object, but get()${pathSoFar} is ${child}.`);
        }
        targetWalker = child;
      }
      setTarget(targetWalker);
    };
    const writeBackIfMutating = (method, args) => {
      if (modifyingOperations.includes(method)) {
        writeBack();
      }
    };
    const afterHook = alwaysSet ? writeBack : writeBackIfMutating;
    return makeListenerProxy(refreshProxyTarget, afterHook)(proxy);
  }
  const initialRootObject = get2();
  return deepProxy(createProxy)(initialRootObject);
}
function isNonNullObject(value2) {
  return typeof value2 === "object" && value2 !== null;
}
const modifyingOperations = [
  "set",
  "delete",
  "defineProperty",
  "deleteProperty",
  "preventExtensions",
  "setPrototypeOf"
];
function makeListenerProxy(before = () => {
}, after = () => {
}) {
  return (object) => {
    const handler = Object.assign({}, ...Object.getOwnPropertyNames(Reflect).map((method) => ({
      [method](...args) {
        before(method, args);
        const result2 = Reflect[method].apply(null, args);
        after(method, args);
        return result2;
      }
    })));
    return new Proxy(object, handler);
  };
}
function deepProxy(createProxy) {
  let createDeepProxy = (object, path) => {
    const target = createProxy(object, path);
    return new Proxy(target, {
      get(target2, property, receiver) {
        const value2 = Reflect.get(target2, property, receiver);
        if (value2 instanceof Object && target2.hasOwnProperty(property) && typeof property === "string") {
          const innerProxy = createDeepProxy(value2, `${path}.${property}`);
          return innerProxy;
        } else {
          return value2;
        }
      }
    });
  };
  createDeepProxy = memoizeWeak(createDeepProxy);
  return (object) => createDeepProxy(object, "");
}
function extractLinksFromCss(parsedCss, baseUrl) {
  const links = [];
  parsedCss.walkAtRules("import", (atRule2) => {
    let valueAst;
    try {
      valueAst = lib(atRule2.params).parse();
    } catch (err) {
      return;
    }
    let maybeUrlNode;
    const firstNode = valueAst.nodes[0].nodes[0];
    if (firstNode.type === "string") {
      maybeUrlNode = firstNode;
    } else if (firstNode.type === "func" && firstNode.value === "url") {
      const argument = firstNode.nodes[1];
      if (argument.type === "string" || argument.type === "word") {
        maybeUrlNode = argument;
      }
    }
    if (maybeUrlNode) {
      const urlNode = maybeUrlNode;
      const link = {
        get target() {
          return urlNode.value;
        },
        set target(newUrl) {
          urlNode.value = newUrl;
          atRule2.params = valueAst.toString();
        },
        get absoluteTarget() {
          return tryParseUrl(this.target, baseUrl);
        },
        get isSubresource() {
          return true;
        },
        get subresourceType() {
          return "style";
        },
        get from() {
          return {};
        }
      };
      links.push(link);
    }
  });
  parsedCss.walkDecls((decl) => {
    let valueAst;
    try {
      valueAst = lib(decl.value).parse();
    } catch (err) {
      return;
    }
    valueAst.walk((functionNode) => {
      if (functionNode.type !== "func")
        return;
      if (functionNode.value !== "url")
        return;
      let subresourceType;
      if (decl.prop === "src" && decl.parent.type === "atrule" && decl.parent.name === "font-face") {
        subresourceType = "font";
      } else {
        subresourceType = "image";
      }
      const argument = functionNode.nodes[1];
      if (argument.type === "string" || argument.type === "word") {
        const urlNode = argument;
        const link = {
          get target() {
            return urlNode.value;
          },
          set target(newUrl) {
            urlNode.value = newUrl;
            decl.value = valueAst.toString();
          },
          get absoluteTarget() {
            return tryParseUrl(this.target, baseUrl);
          },
          get isSubresource() {
            return true;
          },
          get subresourceType() {
            return subresourceType;
          },
          get from() {
            return {};
          }
        };
        links.push(link);
      }
    });
  });
  return links;
}
function extractLinksFromCssSynced({
  get: getCssString,
  set: setCssString,
  baseUrl
}) {
  const { get: getParsedCss, set: setParsedCss } = transformingCache({
    get: getCssString,
    set: setCssString,
    transform: (cssString) => postcss.parse(cssString),
    untransform: (parsedCss) => parsedCss.toResult().css
  });
  const memoizedExtractLinksFromCss = memoizeOne(extractLinksFromCss);
  let currentParsedCss;
  const links = deepSyncingProxy({
    get: () => {
      try {
        currentParsedCss = getParsedCss();
      } catch (err) {
        currentParsedCss = null;
        return [];
      }
      return memoizedExtractLinksFromCss(currentParsedCss, baseUrl);
    },
    set: (links2) => {
      if (currentParsedCss !== null) {
        setParsedCss(currentParsedCss);
      }
    }
  });
  return links;
}
function getBaseUrl(doc, docUrl = doc.URL) {
  const baseEl = doc.querySelector("base[href]");
  if (baseEl) {
    const baseHref = baseEl.getAttribute("href");
    if (baseHref !== null) {
      const baseUrl = tryParseUrl(baseHref, docUrl);
      if (baseUrl) {
        return baseUrl;
      }
    }
  }
  return docUrl;
}
const splitByRegex = (regex) => (value2) => {
  const tokens = [];
  let remainder = value2;
  let remainderIndex = 0;
  while (remainder.length > 0) {
    const match = remainder.match(regex);
    const leadingWhitespace = match[1];
    const token = match[2];
    if (token.length > 0) {
      tokens.push({
        token,
        index: remainderIndex + leadingWhitespace.length
      });
    }
    const charactersSeen = match[0].length;
    remainder = remainder.slice(charactersSeen);
    remainderIndex += charactersSeen;
  }
  return tokens;
};
const splitByWhitespace = splitByRegex(/^(\s*)([^]*?)(\s*)(\s|$)/);
const splitByComma = splitByRegex(/^(\s*)([^]*?)(\s*)(,|$)/);
const splitByCommaPickFirstTokens = splitByRegex(/^(\s*)(\S*)([^]*?)(,|$)/);
function mergeWith(mergeValues) {
  return (...objects) => {
    const result2 = {};
    for (const object of objects) {
      for (const [key, value2] of Object.entries(object)) {
        result2[key] = key in result2 ? mergeValues(result2[key], value2) : value2;
      }
    }
    return result2;
  };
}
function omit(keys) {
  return (object) => {
    const entries = Object.entries(object);
    const result2 = {};
    for (const [key, value2] of entries) {
      if (!keys.includes(key)) {
        result2[key] = value2;
      }
    }
    return result2;
  };
}
const uniq = (array) => {
  const newArray = [];
  const seen = /* @__PURE__ */ new Set();
  for (const value2 of array) {
    if (!seen.has(value2)) {
      seen.add(value2);
      newArray.push(value2);
    }
  }
  return newArray;
};
const defaultItem = {
  elements: ["*"],
  parse: (value2) => {
    const url = value2.trim();
    if (url.length === 0)
      return [];
    const index = value2.indexOf(url[0]);
    return [{ token: url, index }];
  },
  isSubresource: false,
  subresourceType: void 0,
  makeAbsolute(url, element, baseUrl = element.baseURI, documentURL = element.ownerDocument !== null ? element.ownerDocument.URL : void 0) {
    return tryParseUrl(url, baseUrl);
  }
};
const makeAbsoluteUsingCodebase = (url, element, ...etc) => {
  const codebaseValue = element.getAttribute("codebase");
  if (codebaseValue) {
    const [codebaseUrlLocation] = html40.codebase.parse(codebaseValue);
    if (codebaseUrlLocation) {
      const codebaseUrl = codebaseUrlLocation.token;
      const codebaseAbsoluteUrl = html40.codebase.makeAbsolute(codebaseUrl, element, ...etc);
      return tryParseUrl(url, codebaseAbsoluteUrl);
    }
  }
  return defaultItem.makeAbsolute(url, element, ...etc);
};
const html40 = {
  action: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "action",
    elements: ["form"]
  }),
  applet_archive: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "archive",
    elements: ["applet"],
    parse: splitByComma,
    isSubresource: true,
    makeAbsolute: makeAbsoluteUsingCodebase
  }),
  object_archive: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "archive",
    elements: ["object"],
    parse: splitByWhitespace,
    isSubresource: true,
    makeAbsolute: makeAbsoluteUsingCodebase
  }),
  background: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "background",
    elements: ["body"],
    isSubresource: true,
    subresourceType: "image"
  }),
  cite: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "cite",
    elements: ["blockquote", "q", "del", "ins"]
  }),
  classid: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "classid",
    elements: ["object"],
    isSubresource: true,
    makeAbsolute: makeAbsoluteUsingCodebase
  }),
  codebase: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "codebase",
    elements: ["object", "applet"]
  }),
  data: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "data",
    elements: ["object"],
    isSubresource: true,
    subresourceType: "object",
    makeAbsolute: makeAbsoluteUsingCodebase
  }),
  href: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "href",
    elements: ["a", "area", "base", "link:not([rel~=icon i]):not([rel~=stylesheet i])"]
  }),
  link_icon_href: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "href",
    elements: ["link[rel~=icon i]"],
    isSubresource: true,
    subresourceType: "image"
  }),
  link_stylesheet_href: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "href",
    elements: ["link[rel~=stylesheet i]"],
    isSubresource: true,
    subresourceType: "style"
  }),
  longdesc: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "longdesc",
    elements: ["img", "frame", "iframe"]
  }),
  profile: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "profile",
    elements: ["head"]
  }),
  img_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["img", "input[type=image i]"],
    isSubresource: true,
    subresourceType: "image"
  }),
  frame_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["frame", "iframe"],
    isSubresource: true,
    subresourceType: "document"
  }),
  script_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["script"],
    isSubresource: true,
    subresourceType: "script"
  }),
  param_ref_value: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "value",
    elements: ["param[valuetype=ref i]"]
  }),
  meta_refresh_content: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "content",
    elements: ["meta[http-equiv=refresh i]"],
    parse: (value2) => {
      const match = value2.match(/^(\s*[\d.]+\s*[;,\s]\s*(?:url\s*=\s*)?('|")?\s*)(.+)/i);
      if (!match)
        return [];
      const quote = match[2];
      let url = match[3];
      if (quote && url.includes(quote)) {
        url = url.slice(0, url.indexOf(quote));
      }
      const index = match[1].length;
      url = url.trim();
      return [{ token: url, index }];
    }
  })
};
const html52 = {
  action: html40.action,
  cite: html40.cite,
  data: __spreadProps(__spreadValues({}, html40.data), {
    makeAbsolute: defaultItem.makeAbsolute
  }),
  formaction: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "formaction",
    elements: ["button", "input"]
  }),
  href: html40.href,
  link_icon_href: html40.link_icon_href,
  link_stylesheet_href: html40.link_stylesheet_href,
  longdesc: __spreadProps(__spreadValues({}, html40.longdesc), {
    elements: ["img"]
  }),
  manifest: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "manifest",
    elements: ["html"],
    isSubresource: true,
    makeAbsolute(url, element, _, documentURL = element.ownerDocument !== null ? element.ownerDocument.URL : void 0) {
      return tryParseUrl(url, documentURL);
    }
  }),
  poster: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "poster",
    elements: ["video"],
    isSubresource: true,
    subresourceType: "image"
  }),
  audio_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["audio", "audio>source"],
    isSubresource: true,
    subresourceType: "audio"
  }),
  embed_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["embed"],
    isSubresource: true,
    subresourceType: "embed"
  }),
  frame_src: __spreadProps(__spreadValues({}, html40.frame_src), {
    elements: ["iframe"]
  }),
  img_src: html40.img_src,
  script_src: html40.script_src,
  track_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["track"],
    isSubresource: true,
    subresourceType: "track"
  }),
  video_src: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "src",
    elements: ["video", "video>source"],
    isSubresource: true,
    subresourceType: "video"
  }),
  srcset: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "srcset",
    elements: ["img", "picture>source"],
    parse: splitByCommaPickFirstTokens,
    isSubresource: true,
    subresourceType: "image"
  }),
  meta_refresh_content: html40.meta_refresh_content
};
const whatwg = __spreadProps(__spreadValues({}, omit(["longdesc"])(html52)), {
  itemprop: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "itemprop",
    parse: (value2) => {
      return splitByWhitespace(value2).filter(({ token }) => token.includes(":"));
    },
    makeAbsolute: (url) => tryParseUrl(url)
  }),
  itemtype: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "itemtype",
    parse: splitByWhitespace,
    makeAbsolute: (url) => tryParseUrl(url)
  }),
  itemid: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "itemid"
  }),
  ping: __spreadProps(__spreadValues({}, defaultItem), {
    attribute: "ping",
    elements: ["a", "area"]
  })
});
const mergeAttributeInfos = (info1, info2) => info1 === info2 ? info1 : __spreadProps(__spreadValues(__spreadValues({}, info1), info2), {
  elements: uniq(info1.elements.concat(info2.elements))
});
const allAttributes = mergeWith(mergeAttributeInfos)(whatwg, html52, html40);
function flatMap(arr, f) {
  return arr.map(f).reduce((newArr, item) => newArr.concat(item), []);
}
function extractLinksFromDom(doc, {
  docUrl = void 0
} = {}) {
  const baseUrl = docUrl !== void 0 ? getBaseUrl(doc, docUrl) : void 0;
  const rootElement = doc.documentElement;
  const links = [
    ...extractLinksFromAttributes({ rootElement, baseUrl, docUrl }),
    ...extractLinksFromStyleAttributes({ rootElement, baseUrl }),
    ...extractLinksFromStyleTags({ rootElement, baseUrl })
  ];
  return links;
}
function extractLinksFromAttributes({
  rootElement,
  baseUrl,
  docUrl
}) {
  const links = flatMap(Object.values(allAttributes), (attributeInfo) => {
    const { attribute, elements: elementNames } = attributeInfo;
    const selector = elementNames.map((name) => `${name}[${attribute}]`).join(", ");
    const elements = Array.from(rootElement.querySelectorAll(selector));
    const links2 = flatMap(elements, (element) => linksInAttribute({ element, attributeInfo, baseUrl, docUrl }));
    return links2;
  });
  return links;
}
function linksInAttribute({
  element,
  attributeInfo,
  baseUrl,
  docUrl
}) {
  const { attribute, parse: parse2, makeAbsolute } = attributeInfo;
  const parsedAttributeView = syncingParsedView({
    parse: parse2,
    get: () => element.getAttribute(attribute) || "",
    set: (value2) => {
      element.setAttribute(attribute, value2);
    }
  });
  const links = parsedAttributeView.map((tokenView) => ({
    get target() {
      return tokenView.token;
    },
    set target(newUrl) {
      tokenView.token = newUrl;
    },
    get absoluteTarget() {
      return makeAbsolute(this.target, element, baseUrl, docUrl);
    },
    get from() {
      const index = tokenView.index;
      return {
        get element() {
          return element;
        },
        get attribute() {
          return attribute;
        },
        get rangeWithinAttribute() {
          return [index, index + tokenView.token.length];
        }
      };
    },
    get isSubresource() {
      return attributeInfo.isSubresource;
    },
    get subresourceType() {
      return attributeInfo.subresourceType;
    }
  }));
  return links;
}
function extractLinksFromStyleAttributes({
  rootElement,
  baseUrl
}) {
  const querySelector = "*[style]";
  const elements = Array.from(rootElement.querySelectorAll(querySelector));
  const links = flatMap(elements, (element) => {
    const cssLinks = extractLinksFromCssSynced({
      get: () => element.getAttribute("style") || "",
      set: (newValue) => {
        element.setAttribute("style", newValue);
      },
      baseUrl: baseUrl || element.baseURI
    });
    const links2 = cssLinks.map((link) => {
      const newLink = Object.create(link, {
        from: {
          get: () => ({
            get element() {
              return element;
            },
            get attribute() {
              return "style";
            },
            get rangeWithinAttribute() {
              return link.from.range;
            }
          })
        }
      });
      return newLink;
    });
    return links2;
  });
  return links;
}
function extractLinksFromStyleTags({
  rootElement,
  baseUrl
}) {
  const querySelector = 'style[type="text/css" i], style:not([type])';
  const elements = Array.from(rootElement.querySelectorAll(querySelector));
  const links = flatMap(elements, (element) => {
    const cssLinks = extractLinksFromCssSynced({
      get: () => element.textContent || "",
      set: (newValue) => {
        element.textContent = newValue;
      },
      baseUrl: baseUrl || element.baseURI
    });
    const links2 = cssLinks.map((cssLink) => {
      const htmlLink = Object.create(cssLink, {
        from: {
          get: () => ({
            get element() {
              return element;
            },
            get rangeWithinTextContent() {
              return cssLink.from.range;
            }
          })
        }
      });
      return htmlLink;
    });
    return links2;
  });
  return links;
}
async function blobToText(blob, config) {
  const text = await new Promise((resolve2, reject) => {
    const reader = new config.glob.FileReader();
    reader.onload = () => resolve2(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
  return text;
}
class DomResource extends Resource {
  constructor(url, docOrHtml, originalDoc, config) {
    super();
    const doc = typeof docOrHtml === "string" ? new config.glob.DOMParser().parseFromString(docOrHtml, "text/html") : docOrHtml;
    this._url = url;
    this._doc = doc;
    this._originalDoc = originalDoc;
    this._config = config;
    this._links = extractLinksFromDom(doc, { docUrl: url });
  }
  get doc() {
    return this._doc;
  }
  get originalDoc() {
    return this._originalDoc;
  }
  get url() {
    var _a;
    return (_a = this._url) != null ? _a : this._doc.URL;
  }
  get blob() {
    return new this._config.glob.Blob([this.string], { type: "text/html" });
  }
  get string() {
    return documentOuterHTML(this._doc);
  }
  get links() {
    return this._links;
  }
  static async fromBlob({ url, blob, config }) {
    const html = await blobToText(blob, config);
    return new this(url, html, null, config);
  }
  static clone({ url, doc, config }) {
    const clonedDoc = doc.cloneNode(true);
    return new this(url, clonedDoc, doc, config);
  }
}
class StylesheetResource extends Resource {
  constructor(url, stylesheetContent, config) {
    super();
    this._url = url;
    this._config = config;
    try {
      const parsedCss = postcss.parse(stylesheetContent);
      this._links = extractLinksFromCss(parsedCss, url);
      this._getString = () => parsedCss.toResult().css;
    } catch (err) {
      this._links = [];
      this._getString = () => stylesheetContent;
    }
  }
  get url() {
    return this._url;
  }
  get blob() {
    return new this._config.glob.Blob([this.string], { type: "text/css" });
  }
  get string() {
    return this._getString();
  }
  get links() {
    return this._links;
  }
  static async fromBlob({ url, blob, config }) {
    const stylesheetText = await blobToText(blob, config);
    return new this(url, stylesheetText, config);
  }
}
class LeafResource extends Resource {
  constructor({ url, blob }) {
    super();
    this._url = url;
    this._blob = blob;
  }
  get url() {
    return this._url;
  }
  get blob() {
    return this._blob;
  }
  get links() {
    return [];
  }
  static async fromBlob({ url, blob }) {
    return new this({ url, blob });
  }
}
function dryResource(resource, config) {
  makeLinksAbsolute(resource);
  if (resource instanceof DomResource) {
    makeDomStatic(resource.doc, config);
  }
}
function makeLinksAbsolute(resource) {
  resource.links.forEach((link) => {
    const absoluteTarget = link.absoluteTarget;
    if (absoluteTarget === void 0)
      return;
    const targetHash = absoluteTarget.includes("#") ? absoluteTarget.substring(absoluteTarget.indexOf("#")) : void 0;
    const urlWithoutHash = (url) => url.split("#")[0];
    if (targetHash && urlWithoutHash(absoluteTarget) === urlWithoutHash(resource.url)) {
      link.target = targetHash;
    } else {
      link.target = absoluteTarget;
    }
  });
}
async function fetchSubresource(link, config) {
  if (link.absoluteTarget === void 0) {
    throw new Error(`Cannot fetch invalid target: ${link.target}`);
  }
  const targetUrl = link.absoluteTarget;
  const fetchFunction = config.fetchResource || config.glob.fetch;
  const resourceOrResponse = await fetchFunction(targetUrl, {
    cache: "force-cache",
    redirect: "follow"
  });
  const blob = typeof resourceOrResponse.blob === "function" ? await resourceOrResponse.blob() : resourceOrResponse.blob;
  const finalUrl = resourceOrResponse.url;
  return await Resource.fromBlob({
    url: finalUrl,
    blob,
    subresourceType: link.subresourceType,
    config
  });
}
function setMementoTags(doc, {
  originalUrl,
  datetime
}) {
  if (!doc.head) {
    const head = doc.createElement("head");
    doc.documentElement.insertBefore(head, doc.documentElement.firstChild);
  }
  if (originalUrl) {
    const linkEl = doc.createElement("link");
    linkEl.setAttribute("rel", "original");
    linkEl.setAttribute("href", originalUrl);
    doc.head.insertBefore(linkEl, doc.head.firstChild);
  }
  if (datetime) {
    const metaEl = doc.createElement("meta");
    metaEl.setAttribute("http-equiv", "Memento-Datetime");
    metaEl.setAttribute("content", datetimeToString(datetime));
    doc.head.insertBefore(metaEl, doc.head.firstChild);
  }
}
function datetimeToString(datetime) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const zeropad = (l) => (n) => `${n}`.padStart(l, "0");
  const datetimeString = weekdays[datetime.getUTCDay()] + ", " + zeropad(2)(datetime.getUTCDate()) + " " + months[datetime.getUTCMonth()] + " " + zeropad(4)(datetime.getUTCFullYear()) + " " + zeropad(2)(datetime.getUTCHours()) + ":" + zeropad(2)(datetime.getUTCMinutes()) + ":" + zeropad(2)(datetime.getUTCSeconds()) + " GMT";
  return datetimeString;
}
function setCharsetDeclaration(doc, charsetDeclaration) {
  if (!doc.head) {
    const head = doc.createElement("head");
    doc.documentElement.insertBefore(head, doc.documentElement.firstChild);
  }
  const existingElements = doc.head.querySelectorAll("meta[charset]");
  existingElements.forEach((element) => {
    var _a;
    return (_a = element.parentNode) == null ? void 0 : _a.removeChild(element);
  });
  if (charsetDeclaration !== null && charsetDeclaration !== "") {
    const metaEl = doc.createElement("meta");
    metaEl.setAttribute("charset", charsetDeclaration);
    doc.head.insertBefore(metaEl, doc.head.firstChild);
  }
}
function setContentSecurityPolicy(doc, csp) {
  if (!doc.head) {
    const head = doc.createElement("head");
    doc.documentElement.insertBefore(head, doc.documentElement.firstChild);
  }
  const existingCsps = doc.head.querySelectorAll("meta[http-equiv=Content-Security-Policy i]");
  existingCsps.forEach((element) => {
    var _a;
    return (_a = element.parentNode) == null ? void 0 : _a.removeChild(element);
  });
  const cspMetaEl = doc.createElement("meta");
  cspMetaEl.setAttribute("http-equiv", "Content-Security-Policy");
  cspMetaEl.setAttribute("content", csp);
  doc.head.insertBefore(cspMetaEl, doc.head.firstChild);
  const querySelector = "meta[charset], meta[http-equiv=Content-Type i]";
  const charsetMetaEl = doc.head.querySelector(querySelector);
  if (charsetMetaEl) {
    doc.head.insertBefore(charsetMetaEl, cspMetaEl);
  }
  doc.documentElement.removeAttribute("manifest");
  doc.head.removeAttribute("profile");
}
async function finaliseSnapshot(resource, config) {
  if (config.charsetDeclaration !== void 0) {
    setCharsetDeclaration(resource.doc, config.charsetDeclaration);
  }
  if (config.addMetadata) {
    setMementoTags(resource.doc, { originalUrl: resource.url, datetime: config.now });
  }
  if (config.setContentSecurityPolicy) {
    const csp = [
      "default-src 'none'",
      "img-src data:",
      "media-src data:",
      "style-src data: 'unsafe-inline'",
      "font-src data:",
      "frame-src data:"
    ].join("; ");
    setContentSecurityPolicy(resource.doc, csp);
  }
}
async function blobToDataUrl(blob, config) {
  const binaryString = await new Promise((resolve2, reject) => {
    const reader = new config.glob.FileReader();
    reader.onload = () => resolve2(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(blob);
  });
  const dataUrl = `data:${blob.type};base64,${config.glob.btoa(binaryString)}`;
  return dataUrl;
}
function setLinkTarget(link, target, config) {
  var _a;
  if (isHtmlAttributeDefinedLink(link) && config.keepOriginalAttributes) {
    const noteAttribute = `data-original-${link.from.attribute}`;
    if (!link.from.element.hasAttribute(noteAttribute)) {
      const originalValue = (_a = link.from.element.getAttribute(link.from.attribute)) != null ? _a : "";
      link.from.element.setAttribute(noteAttribute, originalValue);
    }
  }
  link.target = target;
  if (isHtmlAttributeDefinedLink(link) && link.from.element.hasAttribute("integrity")) {
    link.from.element.removeAttribute("integrity");
  }
}
function isHtmlAttributeDefinedLink(link) {
  const from = link.from;
  return from.element !== void 0 && from.attribute !== void 0;
}
async function freezeDry(doc = typeof window !== "undefined" && window.document || fail("No document given to freeze-dry"), options = {}) {
  const defaultOptions = {
    processLink: defaultProcessLink,
    timeout: Infinity,
    docUrl: void 0,
    charsetDeclaration: "utf-8",
    addMetadata: true,
    keepOriginalAttributes: true,
    setContentSecurityPolicy: true,
    now: new Date(),
    fetchResource: void 0,
    glob: options.glob || doc.defaultView || (typeof window !== "undefined" ? window : void 0) || fail("Lacking a global window object")
  };
  const config = flatOptions(options, defaultOptions);
  const domResource = DomResource.clone({ url: config.docUrl, doc, config });
  dryResource(domResource, config);
  async function processLinkWrapper(link, config2) {
    async function recurse(link2, _config = config2) {
      await processLinkWrapper(link2, _config);
    }
    await config2.processLink(link, config2, recurse);
  }
  await Promise.all(domResource.subresourceLinks.map((link) => processLinkWrapper(link, config)));
  finaliseSnapshot(domResource, config);
  const html = domResource.string;
  return html;
}
function fail(message) {
  throw new Error(message);
}
async function defaultProcessLink(link, config, recurse) {
  if (link.subresourceType === "document") {
    let innerDoc = getFramedDoc(link);
    if (innerDoc instanceof Promise)
      innerDoc = await innerDoc;
    link.resource = DomResource.clone({ doc: innerDoc, config });
  }
  if (!link.resource) {
    try {
      link.resource = await fetchSubresource(link, config);
    } catch (err) {
      return;
    }
  }
  dryResource(link.resource, config);
  await Promise.all(link.resource.subresourceLinks.map((link2) => recurse(link2)));
  const dataUrl = await blobToDataUrl(link.resource.blob, config);
  setLinkTarget(link, dataUrl, config);
}
export { freezeDry as default };
