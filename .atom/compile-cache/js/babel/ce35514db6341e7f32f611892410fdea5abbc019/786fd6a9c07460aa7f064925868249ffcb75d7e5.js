"use babel";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("atom");

var Range = _require.Range;
var Point = _require.Point;

var _ = require("underscore-plus");

// [TODO] Need overhaul
//  - [ ] Make expandable by selection.getBufferRange().union(this.getRange(selection))
//  - [ ] Count support(priority low)?
var Base = require("./base");

var _require2 = require("./utils");

var getLineTextToBufferPosition = _require2.getLineTextToBufferPosition;
var getCodeFoldRowRangesContainesForRow = _require2.getCodeFoldRowRangesContainesForRow;
var isIncludeFunctionScopeForRow = _require2.isIncludeFunctionScopeForRow;
var expandRangeToWhiteSpaces = _require2.expandRangeToWhiteSpaces;
var getVisibleBufferRange = _require2.getVisibleBufferRange;
var translatePointAndClip = _require2.translatePointAndClip;
var getBufferRows = _require2.getBufferRows;
var getValidVimBufferRow = _require2.getValidVimBufferRow;
var trimRange = _require2.trimRange;
var sortRanges = _require2.sortRanges;
var pointIsAtEndOfLine = _require2.pointIsAtEndOfLine;
var splitArguments = _require2.splitArguments;
var traverseTextFromPoint = _require2.traverseTextFromPoint;

var PairFinder = undefined;

var TextObject = (function (_Base) {
  _inherits(TextObject, _Base);

  function TextObject() {
    _classCallCheck(this, TextObject);

    _get(Object.getPrototypeOf(TextObject.prototype), "constructor", this).apply(this, arguments);

    this.wise = "characterwise";
    this.supportCount = false;
    this.selectOnce = false;
    this.selectSucceeded = false;
  }

  _createClass(TextObject, [{
    key: "isInner",
    value: function isInner() {
      return this.inner;
    }
  }, {
    key: "isA",
    value: function isA() {
      return !this.inner;
    }
  }, {
    key: "isLinewise",
    value: function isLinewise() {
      return this.wise === "linewise";
    }
  }, {
    key: "isBlockwise",
    value: function isBlockwise() {
      return this.wise === "blockwise";
    }
  }, {
    key: "forceWise",
    value: function forceWise(wise) {
      return this.wise = wise; // FIXME currently not well supported
    }
  }, {
    key: "resetState",
    value: function resetState() {
      this.selectSucceeded = false;
    }

    // execute: Called from Operator::selectTarget()
    //  - `v i p`, is `SelectInVisualMode` operator with @target = `InnerParagraph`.
    //  - `d i p`, is `Delete` operator with @target = `InnerParagraph`.
  }, {
    key: "execute",
    value: function execute() {
      // Whennever TextObject is executed, it has @operator
      if (!this.operator) throw new Error("in TextObject: Must not happen");
      this.select();
    }
  }, {
    key: "select",
    value: function select() {
      var _this = this;

      if (this.isMode("visual", "blockwise")) {
        this.swrap.normalize(this.editor);
      }

      this.countTimes(this.getCount(), function (_ref2) {
        var stop = _ref2.stop;

        if (!_this.supportCount) stop(); // quick-fix for #560

        for (var selection of _this.editor.getSelections()) {
          var oldRange = selection.getBufferRange();
          if (_this.selectTextObject(selection)) _this.selectSucceeded = true;
          if (selection.getBufferRange().isEqual(oldRange)) stop();
          if (_this.selectOnce) break;
        }
      });

      this.editor.mergeIntersectingSelections();
      // Some TextObject's wise is NOT deterministic. It has to be detected from selected range.
      if (this.wise == null) this.wise = this.swrap.detectWise(this.editor);

      if (this.operator["instanceof"]("SelectBase")) {
        if (this.selectSucceeded) {
          if (this.wise === "characterwise") {
            this.swrap.getSelections(this.editor).forEach(function ($selection) {
              return $selection.saveProperties();
            });
            for (var $selection of this.swrap.getSelections(this.editor)) {
              $selection.saveProperties();
            }
          } else if (this.wise === "linewise") {
            // When target is persistent-selection, new selection is added after selectTextObject.
            // So we have to assure all selection have selction property.
            // Maybe this logic can be moved to operation stack.
            for (var $selection of this.swrap.getSelections(this.editor)) {
              if (this.getConfig("stayOnSelectTextObject")) {
                if (!$selection.hasProperties()) $selection.saveProperties();
              } else {
                $selection.saveProperties();
              }
              $selection.fixPropertyRowToRowRange();
            }
          }
        }

        if (this.submode === "blockwise") {
          for (var $selection of this.swrap.getSelections(this.editor)) {
            $selection.normalize();
            $selection.applyWise("blockwise");
          }
        }
      }
    }

    // Return true or false
  }, {
    key: "selectTextObject",
    value: function selectTextObject(selection) {
      var range = this.getRange(selection);
      if (range) {
        this.swrap(selection).setBufferRange(range);
        return true;
      } else {
        return false;
      }
    }

    // to override
  }, {
    key: "getRange",
    value: function getRange(selection) {}
  }], [{
    key: "register",
    value: function register(isCommand, deriveInnerAndA, deriveInnerAndAForAllowForwarding) {
      _get(Object.getPrototypeOf(TextObject), "register", this).call(this, isCommand);

      if (deriveInnerAndA) {
        this.generateClass("A" + this.name, false);
        this.generateClass("Inner" + this.name, true);
      }

      if (deriveInnerAndAForAllowForwarding) {
        this.generateClass("A" + this.name + "AllowForwarding", false, true);
        this.generateClass("Inner" + this.name + "AllowForwarding", true, true);
      }
    }
  }, {
    key: "generateClass",
    value: function generateClass(klassName, inner, allowForwarding) {
      var klass = (function (_ref) {
        _inherits(klass, _ref);

        _createClass(klass, null, [{
          key: "name",
          get: function get() {
            return klassName;
          }
        }]);

        function klass(vimState) {
          _classCallCheck(this, klass);

          _get(Object.getPrototypeOf(klass.prototype), "constructor", this).call(this, vimState);
          this.inner = inner;
          if (allowForwarding != null) this.allowForwarding = allowForwarding;
        }

        return klass;
      })(this);
      klass.register();
    }
  }, {
    key: "operationKind",
    value: "text-object",
    enumerable: true
  }]);

  return TextObject;
})(Base);

TextObject.register(false);

// Section: Word
// =========================

var Word = (function (_TextObject) {
  _inherits(Word, _TextObject);

  function Word() {
    _classCallCheck(this, Word);

    _get(Object.getPrototypeOf(Word.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Word, [{
    key: "getRange",
    value: function getRange(selection) {
      var point = this.getCursorPositionForSelection(selection);

      var _getWordBufferRangeAndKindAtBufferPosition = this.getWordBufferRangeAndKindAtBufferPosition(point, { wordRegex: this.wordRegex });

      var range = _getWordBufferRangeAndKindAtBufferPosition.range;

      return this.isA() ? expandRangeToWhiteSpaces(this.editor, range) : range;
    }
  }]);

  return Word;
})(TextObject);

Word.register(false, true);

var WholeWord = (function (_Word) {
  _inherits(WholeWord, _Word);

  function WholeWord() {
    _classCallCheck(this, WholeWord);

    _get(Object.getPrototypeOf(WholeWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /\S+/;
  }

  return WholeWord;
})(Word);

WholeWord.register(false, true);

// Just include _, -

var SmartWord = (function (_Word2) {
  _inherits(SmartWord, _Word2);

  function SmartWord() {
    _classCallCheck(this, SmartWord);

    _get(Object.getPrototypeOf(SmartWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /[\w-]+/;
  }

  return SmartWord;
})(Word);

SmartWord.register(false, true);

// Just include _, -

var Subword = (function (_Word3) {
  _inherits(Subword, _Word3);

  function Subword() {
    _classCallCheck(this, Subword);

    _get(Object.getPrototypeOf(Subword.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Subword, [{
    key: "getRange",
    value: function getRange(selection) {
      this.wordRegex = selection.cursor.subwordRegExp();
      return _get(Object.getPrototypeOf(Subword.prototype), "getRange", this).call(this, selection);
    }
  }]);

  return Subword;
})(Word);

Subword.register(false, true);

// Section: Pair
// =========================

var Pair = (function (_TextObject2) {
  _inherits(Pair, _TextObject2);

  function Pair() {
    _classCallCheck(this, Pair);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(Pair.prototype), "constructor", this).apply(this, args);
    this.supportCount = true;
    this.allowNextLine = null;
    this.adjustInnerRange = true;
    this.pair = null;
    this.inclusive = true;
    if (!PairFinder) PairFinder = require("./pair-finder");
  }

  _createClass(Pair, [{
    key: "isAllowNextLine",
    value: function isAllowNextLine() {
      return this.allowNextLine != null ? this.allowNextLine : this.pair != null && this.pair[0] !== this.pair[1];
    }
  }, {
    key: "adjustRange",
    value: function adjustRange(_ref3) {
      var start = _ref3.start;
      var end = _ref3.end;

      // Dirty work to feel natural for human, to behave compatible with pure Vim.
      // Where this adjustment appear is in following situation.
      // op-1: `ci{` replace only 2nd line
      // op-2: `di{` delete only 2nd line.
      // text:
      //  {
      //    aaa
      //  }
      if (pointIsAtEndOfLine(this.editor, start)) {
        start = start.traverse([1, 0]);
      }

      if (getLineTextToBufferPosition(this.editor, end).match(/^\s*$/)) {
        if (this.mode === "visual") {
          // This is slightly innconsistent with regular Vim
          // - regular Vim: select new line after EOL
          // - vim-mode-plus: select to EOL(before new line)
          // This is intentional since to make submode `characterwise` when auto-detect submode
          // innerEnd = new Point(innerEnd.row - 1, Infinity)
          end = new Point(end.row - 1, Infinity);
        } else {
          end = new Point(end.row, 0);
        }
      }
      return new Range(start, end);
    }
  }, {
    key: "getFinder",
    value: function getFinder() {
      var finderName = this.pair[0] === this.pair[1] ? "QuoteFinder" : "BracketFinder";
      return new PairFinder[finderName](this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        pair: this.pair,
        inclusive: this.inclusive
      });
    }
  }, {
    key: "getPairInfo",
    value: function getPairInfo(from) {
      var pairInfo = this.getFinder().find(from);
      if (pairInfo) {
        if (this.adjustInnerRange) pairInfo.innerRange = this.adjustRange(pairInfo.innerRange);
        pairInfo.targetRange = this.isInner() ? pairInfo.innerRange : pairInfo.aRange;
        return pairInfo;
      }
    }
  }, {
    key: "getRange",
    value: function getRange(selection) {
      var originalRange = selection.getBufferRange();
      var pairInfo = this.getPairInfo(this.getCursorPositionForSelection(selection));
      // When range was same, try to expand range
      if (pairInfo && pairInfo.targetRange.isEqual(originalRange)) {
        pairInfo = this.getPairInfo(pairInfo.aRange.end);
      }
      if (pairInfo) return pairInfo.targetRange;
    }
  }]);

  return Pair;
})(TextObject);

Pair.register(false);

// Used by DeleteSurround

var APair = (function (_Pair) {
  _inherits(APair, _Pair);

  function APair() {
    _classCallCheck(this, APair);

    _get(Object.getPrototypeOf(APair.prototype), "constructor", this).apply(this, arguments);
  }

  return APair;
})(Pair);

APair.register(false);

var AnyPair = (function (_Pair2) {
  _inherits(AnyPair, _Pair2);

  function AnyPair() {
    _classCallCheck(this, AnyPair);

    _get(Object.getPrototypeOf(AnyPair.prototype), "constructor", this).apply(this, arguments);

    this.allowForwarding = false;
    this.member = ["DoubleQuote", "SingleQuote", "BackTick", "CurlyBracket", "AngleBracket", "SquareBracket", "Parenthesis"];
  }

  _createClass(AnyPair, [{
    key: "getRanges",
    value: function getRanges(selection) {
      var _this2 = this;

      var options = { inner: this.inner, allowForwarding: this.allowForwarding, inclusive: this.inclusive };
      return this.member.map(function (member) {
        return _this2.getInstance(member, options).getRange(selection);
      }).filter(function (range) {
        return range;
      });
    }
  }, {
    key: "getRange",
    value: function getRange(selection) {
      return _.last(sortRanges(this.getRanges(selection)));
    }
  }]);

  return AnyPair;
})(Pair);

AnyPair.register(false, true);

var AnyPairAllowForwarding = (function (_AnyPair) {
  _inherits(AnyPairAllowForwarding, _AnyPair);

  function AnyPairAllowForwarding() {
    _classCallCheck(this, AnyPairAllowForwarding);

    _get(Object.getPrototypeOf(AnyPairAllowForwarding.prototype), "constructor", this).apply(this, arguments);

    this.allowForwarding = true;
  }

  _createClass(AnyPairAllowForwarding, [{
    key: "getRange",
    value: function getRange(selection) {
      var ranges = this.getRanges(selection);
      var from = selection.cursor.getBufferPosition();

      var _$partition = _.partition(ranges, function (range) {
        return range.start.isGreaterThanOrEqual(from);
      });

      var _$partition2 = _slicedToArray(_$partition, 2);

      var forwardingRanges = _$partition2[0];
      var enclosingRanges = _$partition2[1];

      var enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);

      // When enclosingRange is exists,
      // We don't go across enclosingRange.end.
      // So choose from ranges contained in enclosingRange.
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function (range) {
          return enclosingRange.containsRange(range);
        });
      }

      return forwardingRanges[0] || enclosingRange;
    }
  }]);

  return AnyPairAllowForwarding;
})(AnyPair);

AnyPairAllowForwarding.register(false, true);

var AnyQuote = (function (_AnyPair2) {
  _inherits(AnyQuote, _AnyPair2);

  function AnyQuote() {
    _classCallCheck(this, AnyQuote);

    _get(Object.getPrototypeOf(AnyQuote.prototype), "constructor", this).apply(this, arguments);

    this.allowForwarding = true;
    this.member = ["DoubleQuote", "SingleQuote", "BackTick"];
  }

  _createClass(AnyQuote, [{
    key: "getRange",
    value: function getRange(selection) {
      var ranges = this.getRanges(selection);
      // Pick range which end.colum is leftmost(mean, closed first)
      if (ranges.length) return _.first(_.sortBy(ranges, function (r) {
        return r.end.column;
      }));
    }
  }]);

  return AnyQuote;
})(AnyPair);

AnyQuote.register(false, true);

var Quote = (function (_Pair3) {
  _inherits(Quote, _Pair3);

  function Quote() {
    _classCallCheck(this, Quote);

    _get(Object.getPrototypeOf(Quote.prototype), "constructor", this).apply(this, arguments);

    this.allowForwarding = true;
  }

  return Quote;
})(Pair);

Quote.register(false);

var DoubleQuote = (function (_Quote) {
  _inherits(DoubleQuote, _Quote);

  function DoubleQuote() {
    _classCallCheck(this, DoubleQuote);

    _get(Object.getPrototypeOf(DoubleQuote.prototype), "constructor", this).apply(this, arguments);

    this.pair = ['"', '"'];
  }

  return DoubleQuote;
})(Quote);

DoubleQuote.register(false, true);

var SingleQuote = (function (_Quote2) {
  _inherits(SingleQuote, _Quote2);

  function SingleQuote() {
    _classCallCheck(this, SingleQuote);

    _get(Object.getPrototypeOf(SingleQuote.prototype), "constructor", this).apply(this, arguments);

    this.pair = ["'", "'"];
  }

  return SingleQuote;
})(Quote);

SingleQuote.register(false, true);

var BackTick = (function (_Quote3) {
  _inherits(BackTick, _Quote3);

  function BackTick() {
    _classCallCheck(this, BackTick);

    _get(Object.getPrototypeOf(BackTick.prototype), "constructor", this).apply(this, arguments);

    this.pair = ["`", "`"];
  }

  return BackTick;
})(Quote);

BackTick.register(false, true);

var CurlyBracket = (function (_Pair4) {
  _inherits(CurlyBracket, _Pair4);

  function CurlyBracket() {
    _classCallCheck(this, CurlyBracket);

    _get(Object.getPrototypeOf(CurlyBracket.prototype), "constructor", this).apply(this, arguments);

    this.pair = ["{", "}"];
  }

  return CurlyBracket;
})(Pair);

CurlyBracket.register(false, true, true);

var SquareBracket = (function (_Pair5) {
  _inherits(SquareBracket, _Pair5);

  function SquareBracket() {
    _classCallCheck(this, SquareBracket);

    _get(Object.getPrototypeOf(SquareBracket.prototype), "constructor", this).apply(this, arguments);

    this.pair = ["[", "]"];
  }

  return SquareBracket;
})(Pair);

SquareBracket.register(false, true, true);

var Parenthesis = (function (_Pair6) {
  _inherits(Parenthesis, _Pair6);

  function Parenthesis() {
    _classCallCheck(this, Parenthesis);

    _get(Object.getPrototypeOf(Parenthesis.prototype), "constructor", this).apply(this, arguments);

    this.pair = ["(", ")"];
  }

  return Parenthesis;
})(Pair);

Parenthesis.register(false, true, true);

var AngleBracket = (function (_Pair7) {
  _inherits(AngleBracket, _Pair7);

  function AngleBracket() {
    _classCallCheck(this, AngleBracket);

    _get(Object.getPrototypeOf(AngleBracket.prototype), "constructor", this).apply(this, arguments);

    this.pair = ["<", ">"];
  }

  return AngleBracket;
})(Pair);

AngleBracket.register(false, true, true);

var Tag = (function (_Pair8) {
  _inherits(Tag, _Pair8);

  function Tag() {
    _classCallCheck(this, Tag);

    _get(Object.getPrototypeOf(Tag.prototype), "constructor", this).apply(this, arguments);

    this.allowNextLine = true;
    this.allowForwarding = true;
    this.adjustInnerRange = false;
  }

  _createClass(Tag, [{
    key: "getTagStartPoint",
    value: function getTagStartPoint(from) {
      var tagRange = undefined;
      var pattern = PairFinder.TagFinder.pattern;

      this.scanForward(pattern, { from: [from.row, 0] }, function (_ref4) {
        var range = _ref4.range;
        var stop = _ref4.stop;

        if (range.containsPoint(from, true)) {
          tagRange = range;
          stop();
        }
      });
      if (tagRange) return tagRange.start;
    }
  }, {
    key: "getFinder",
    value: function getFinder() {
      return new PairFinder.TagFinder(this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        inclusive: this.inclusive
      });
    }
  }, {
    key: "getPairInfo",
    value: function getPairInfo(from) {
      return _get(Object.getPrototypeOf(Tag.prototype), "getPairInfo", this).call(this, this.getTagStartPoint(from) || from);
    }
  }]);

  return Tag;
})(Pair);

Tag.register(false, true);

// Section: Paragraph
// =========================
// Paragraph is defined as consecutive (non-)blank-line.

var Paragraph = (function (_TextObject3) {
  _inherits(Paragraph, _TextObject3);

  function Paragraph() {
    _classCallCheck(this, Paragraph);

    _get(Object.getPrototypeOf(Paragraph.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.supportCount = true;
  }

  _createClass(Paragraph, [{
    key: "findRow",
    value: function findRow(fromRow, direction, fn) {
      if (fn.reset) fn.reset();
      var foundRow = fromRow;
      for (var row of getBufferRows(this.editor, { startRow: fromRow, direction: direction })) {
        if (!fn(row, direction)) break;
        foundRow = row;
      }
      return foundRow;
    }
  }, {
    key: "findRowRangeBy",
    value: function findRowRangeBy(fromRow, fn) {
      var startRow = this.findRow(fromRow, "previous", fn);
      var endRow = this.findRow(fromRow, "next", fn);
      return [startRow, endRow];
    }
  }, {
    key: "getPredictFunction",
    value: function getPredictFunction(fromRow, selection) {
      var _this3 = this;

      var fromRowResult = this.editor.isBufferRowBlank(fromRow);

      if (this.isInner()) {
        return function (row, direction) {
          return _this3.editor.isBufferRowBlank(row) === fromRowResult;
        };
      } else {
        var _ret = (function () {
          var directionToExtend = selection.isReversed() ? "previous" : "next";

          var flip = false;
          var predict = function predict(row, direction) {
            var result = _this3.editor.isBufferRowBlank(row) === fromRowResult;
            if (flip) {
              return !result;
            } else {
              if (!result && direction === directionToExtend) {
                return flip = true;
              }
              return result;
            }
          };
          predict.reset = function () {
            return flip = false;
          };
          return {
            v: predict
          };
        })();

        if (typeof _ret === "object") return _ret.v;
      }
    }
  }, {
    key: "getRange",
    value: function getRange(selection) {
      var originalRange = selection.getBufferRange();
      var fromRow = this.getCursorPositionForSelection(selection).row;
      if (this.isMode("visual", "linewise")) {
        if (selection.isReversed()) fromRow--;else fromRow++;
        fromRow = getValidVimBufferRow(this.editor, fromRow);
      }
      var rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(this.getBufferRangeForRowRange(rowRange));
    }
  }]);

  return Paragraph;
})(TextObject);

Paragraph.register(false, true);

var Indentation = (function (_Paragraph) {
  _inherits(Indentation, _Paragraph);

  function Indentation() {
    _classCallCheck(this, Indentation);

    _get(Object.getPrototypeOf(Indentation.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Indentation, [{
    key: "getRange",
    value: function getRange(selection) {
      var _this4 = this;

      var fromRow = this.getCursorPositionForSelection(selection).row;
      var baseIndentLevel = this.editor.indentationForBufferRow(fromRow);
      var rowRange = this.findRowRangeBy(fromRow, function (row) {
        return _this4.editor.isBufferRowBlank(row) ? _this4.isA() : _this4.editor.indentationForBufferRow(row) >= baseIndentLevel;
      });
      return this.getBufferRangeForRowRange(rowRange);
    }
  }]);

  return Indentation;
})(Paragraph);

Indentation.register(false, true);

// Section: Comment
// =========================

var Comment = (function (_TextObject4) {
  _inherits(Comment, _TextObject4);

  function Comment() {
    _classCallCheck(this, Comment);

    _get(Object.getPrototypeOf(Comment.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
  }

  _createClass(Comment, [{
    key: "getRange",
    value: function getRange(selection) {
      var _getCursorPositionForSelection = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection.row;

      var rowRange = this.utils.getRowRangeForCommentAtBufferRow(this.editor, row);
      if (rowRange) {
        return this.getBufferRangeForRowRange(rowRange);
      }
    }
  }]);

  return Comment;
})(TextObject);

Comment.register(false, true);

var CommentOrParagraph = (function (_TextObject5) {
  _inherits(CommentOrParagraph, _TextObject5);

  function CommentOrParagraph() {
    _classCallCheck(this, CommentOrParagraph);

    _get(Object.getPrototypeOf(CommentOrParagraph.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
  }

  _createClass(CommentOrParagraph, [{
    key: "getRange",
    value: function getRange(selection) {
      var inner = this.inner;

      for (var klass of ["Comment", "Paragraph"]) {
        var range = this.getInstance(klass, { inner: inner }).getRange(selection);
        if (range) return range;
      }
    }
  }]);

  return CommentOrParagraph;
})(TextObject);

CommentOrParagraph.register(false, true);

// Section: Fold
// =========================

var Fold = (function (_TextObject6) {
  _inherits(Fold, _TextObject6);

  function Fold() {
    _classCallCheck(this, Fold);

    _get(Object.getPrototypeOf(Fold.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
  }

  _createClass(Fold, [{
    key: "adjustRowRange",
    value: function adjustRowRange(rowRange) {
      if (this.isA()) return rowRange;

      var _rowRange = _slicedToArray(rowRange, 2);

      var startRow = _rowRange[0];
      var endRow = _rowRange[1];

      if (this.editor.indentationForBufferRow(startRow) === this.editor.indentationForBufferRow(endRow)) {
        endRow -= 1;
      }
      startRow += 1;
      return [startRow, endRow];
    }
  }, {
    key: "getFoldRowRangesContainsForRow",
    value: function getFoldRowRangesContainsForRow(row) {
      return getCodeFoldRowRangesContainesForRow(this.editor, row).reverse();
    }
  }, {
    key: "getRange",
    value: function getRange(selection) {
      var _getCursorPositionForSelection2 = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection2.row;

      var selectedRange = selection.getBufferRange();
      for (var rowRange of this.getFoldRowRangesContainsForRow(row)) {
        var range = this.getBufferRangeForRowRange(this.adjustRowRange(rowRange));

        // Don't change to `if range.containsRange(selectedRange, true)`
        // There is behavior diff when cursor is at beginning of line( column 0 ).
        if (!selectedRange.containsRange(range)) return range;
      }
    }
  }]);

  return Fold;
})(TextObject);

Fold.register(false, true);

// NOTE: Function range determination is depending on fold.

var Function = (function (_Fold) {
  _inherits(Function, _Fold);

  function Function() {
    _classCallCheck(this, Function);

    _get(Object.getPrototypeOf(Function.prototype), "constructor", this).apply(this, arguments);

    this.scopeNamesOmittingEndRow = ["source.go", "source.elixir"];
  }

  _createClass(Function, [{
    key: "isGrammarNotFoldEndRow",
    value: function isGrammarNotFoldEndRow() {
      var _editor$getGrammar = this.editor.getGrammar();

      var scopeName = _editor$getGrammar.scopeName;
      var packageName = _editor$getGrammar.packageName;

      if (this.scopeNamesOmittingEndRow.includes(scopeName)) {
        return true;
      } else {
        // HACK: Rust have two package `language-rust` and `atom-language-rust`
        // language-rust don't fold ending `}`, but atom-language-rust does.
        return scopeName === "source.rust" && packageName === "language-rust";
      }
    }
  }, {
    key: "getFoldRowRangesContainsForRow",
    value: function getFoldRowRangesContainsForRow(row) {
      var _this5 = this;

      return _get(Object.getPrototypeOf(Function.prototype), "getFoldRowRangesContainsForRow", this).call(this, row).filter(function (rowRange) {
        return isIncludeFunctionScopeForRow(_this5.editor, rowRange[0]);
      });
    }
  }, {
    key: "adjustRowRange",
    value: function adjustRowRange(rowRange) {
      var _get$call = _get(Object.getPrototypeOf(Function.prototype), "adjustRowRange", this).call(this, rowRange);

      var _get$call2 = _slicedToArray(_get$call, 2);

      var startRow = _get$call2[0];
      var endRow = _get$call2[1];

      // NOTE: This adjustment shoud not be necessary if language-syntax is properly defined.
      if (this.isA() && this.isGrammarNotFoldEndRow()) endRow += 1;
      return [startRow, endRow];
    }
  }]);

  return Function;
})(Fold);

Function.register(false, true);

// Section: Other
// =========================

var Arguments = (function (_TextObject7) {
  _inherits(Arguments, _TextObject7);

  function Arguments() {
    _classCallCheck(this, Arguments);

    _get(Object.getPrototypeOf(Arguments.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Arguments, [{
    key: "newArgInfo",
    value: function newArgInfo(argStart, arg, separator) {
      var argEnd = traverseTextFromPoint(argStart, arg);
      var argRange = new Range(argStart, argEnd);

      var separatorEnd = traverseTextFromPoint(argEnd, separator != null ? separator : "");
      var separatorRange = new Range(argEnd, separatorEnd);

      var innerRange = argRange;
      var aRange = argRange.union(separatorRange);
      return { argRange: argRange, separatorRange: separatorRange, innerRange: innerRange, aRange: aRange };
    }
  }, {
    key: "getArgumentsRangeForSelection",
    value: function getArgumentsRangeForSelection(selection) {
      var options = {
        member: ["CurlyBracket", "SquareBracket", "Parenthesis"],
        inclusive: false
      };
      return this.getInstance("InnerAnyPair", options).getRange(selection);
    }
  }, {
    key: "getRange",
    value: function getRange(selection) {
      var range = this.getArgumentsRangeForSelection(selection);
      var pairRangeFound = range != null;

      range = range || this.getInstance("InnerCurrentLine").getRange(selection); // fallback
      if (!range) return;

      range = trimRange(this.editor, range);

      var text = this.editor.getTextInBufferRange(range);
      var allTokens = splitArguments(text, pairRangeFound);

      var argInfos = [];
      var argStart = range.start;

      // Skip starting separator
      if (allTokens.length && allTokens[0].type === "separator") {
        var token = allTokens.shift();
        argStart = traverseTextFromPoint(argStart, token.text);
      }

      while (allTokens.length) {
        var token = allTokens.shift();
        if (token.type === "argument") {
          var nextToken = allTokens.shift();
          var separator = nextToken ? nextToken.text : undefined;
          var argInfo = this.newArgInfo(argStart, token.text, separator);

          if (allTokens.length === 0 && argInfos.length) {
            argInfo.aRange = argInfo.argRange.union(_.last(argInfos).separatorRange);
          }

          argStart = argInfo.aRange.end;
          argInfos.push(argInfo);
        } else {
          throw new Error("must not happen");
        }
      }

      var point = this.getCursorPositionForSelection(selection);
      for (var _ref52 of argInfos) {
        var innerRange = _ref52.innerRange;
        var aRange = _ref52.aRange;

        if (innerRange.end.isGreaterThanOrEqual(point)) {
          return this.isInner() ? innerRange : aRange;
        }
      }
    }
  }]);

  return Arguments;
})(TextObject);

Arguments.register(false, true);

var CurrentLine = (function (_TextObject8) {
  _inherits(CurrentLine, _TextObject8);

  function CurrentLine() {
    _classCallCheck(this, CurrentLine);

    _get(Object.getPrototypeOf(CurrentLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(CurrentLine, [{
    key: "getRange",
    value: function getRange(selection) {
      var _getCursorPositionForSelection3 = this.getCursorPositionForSelection(selection);

      var row = _getCursorPositionForSelection3.row;

      var range = this.editor.bufferRangeForBufferRow(row);
      return this.isA() ? range : trimRange(this.editor, range);
    }
  }]);

  return CurrentLine;
})(TextObject);

CurrentLine.register(false, true);

var Entire = (function (_TextObject9) {
  _inherits(Entire, _TextObject9);

  function Entire() {
    _classCallCheck(this, Entire);

    _get(Object.getPrototypeOf(Entire.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.selectOnce = true;
  }

  _createClass(Entire, [{
    key: "getRange",
    value: function getRange(selection) {
      return this.editor.buffer.getRange();
    }
  }]);

  return Entire;
})(TextObject);

Entire.register(false, true);

var Empty = (function (_TextObject10) {
  _inherits(Empty, _TextObject10);

  function Empty() {
    _classCallCheck(this, Empty);

    _get(Object.getPrototypeOf(Empty.prototype), "constructor", this).apply(this, arguments);

    this.selectOnce = true;
  }

  return Empty;
})(TextObject);

Empty.register(false);

var LatestChange = (function (_TextObject11) {
  _inherits(LatestChange, _TextObject11);

  function LatestChange() {
    _classCallCheck(this, LatestChange);

    _get(Object.getPrototypeOf(LatestChange.prototype), "constructor", this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(LatestChange, [{
    key: "getRange",
    value: function getRange(selection) {
      var start = this.vimState.mark.get("[");
      var end = this.vimState.mark.get("]");
      if (start && end) {
        return new Range(start, end);
      }
    }
  }]);

  return LatestChange;
})(TextObject);

LatestChange.register(false, true);

var SearchMatchForward = (function (_TextObject12) {
  _inherits(SearchMatchForward, _TextObject12);

  function SearchMatchForward() {
    _classCallCheck(this, SearchMatchForward);

    _get(Object.getPrototypeOf(SearchMatchForward.prototype), "constructor", this).apply(this, arguments);

    this.backward = false;
  }

  _createClass(SearchMatchForward, [{
    key: "findMatch",
    value: function findMatch(fromPoint, pattern) {
      if (this.mode === "visual") {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "forward");
      }
      var foundRange = undefined;
      this.scanForward(pattern, { from: [fromPoint.row, 0] }, function (_ref6) {
        var range = _ref6.range;
        var stop = _ref6.stop;

        if (range.end.isGreaterThan(fromPoint)) {
          foundRange = range;
          stop();
        }
      });
      return { range: foundRange, whichIsHead: "end" };
    }
  }, {
    key: "getRange",
    value: function getRange(selection) {
      var pattern = this.globalState.get("lastSearchPattern");
      if (!pattern) return;

      var fromPoint = selection.getHeadBufferPosition();

      var _findMatch = this.findMatch(fromPoint, pattern);

      var range = _findMatch.range;
      var whichIsHead = _findMatch.whichIsHead;

      if (range) {
        return this.unionRangeAndDetermineReversedState(selection, range, whichIsHead);
      }
    }
  }, {
    key: "unionRangeAndDetermineReversedState",
    value: function unionRangeAndDetermineReversedState(selection, range, whichIsHead) {
      if (selection.isEmpty()) return range;

      var head = range[whichIsHead];
      var tail = selection.getTailBufferPosition();

      if (this.backward) {
        if (tail.isLessThan(head)) head = translatePointAndClip(this.editor, head, "forward");
      } else {
        if (head.isLessThan(tail)) head = translatePointAndClip(this.editor, head, "backward");
      }

      this.reversed = head.isLessThan(tail);
      return new Range(tail, head).union(this.swrap(selection).getTailBufferRange());
    }
  }, {
    key: "selectTextObject",
    value: function selectTextObject(selection) {
      var range = this.getRange(selection);
      if (range) {
        this.swrap(selection).setBufferRange(range, { reversed: this.reversed != null ? this.reversed : this.backward });
        return true;
      }
    }
  }]);

  return SearchMatchForward;
})(TextObject);

SearchMatchForward.register();

var SearchMatchBackward = (function (_SearchMatchForward) {
  _inherits(SearchMatchBackward, _SearchMatchForward);

  function SearchMatchBackward() {
    _classCallCheck(this, SearchMatchBackward);

    _get(Object.getPrototypeOf(SearchMatchBackward.prototype), "constructor", this).apply(this, arguments);

    this.backward = true;
  }

  _createClass(SearchMatchBackward, [{
    key: "findMatch",
    value: function findMatch(fromPoint, pattern) {
      if (this.mode === "visual") {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "backward");
      }
      var foundRange = undefined;
      this.scanBackward(pattern, { from: [fromPoint.row, Infinity] }, function (_ref7) {
        var range = _ref7.range;
        var stop = _ref7.stop;

        if (range.start.isLessThan(fromPoint)) {
          foundRange = range;
          stop();
        }
      });
      return { range: foundRange, whichIsHead: "start" };
    }
  }]);

  return SearchMatchBackward;
})(SearchMatchForward);

SearchMatchBackward.register();

// [Limitation: won't fix]: Selected range is not submode aware. always characterwise.
// So even if original selection was vL or vB, selected range by this text-object
// is always vC range.

var PreviousSelection = (function (_TextObject13) {
  _inherits(PreviousSelection, _TextObject13);

  function PreviousSelection() {
    _classCallCheck(this, PreviousSelection);

    _get(Object.getPrototypeOf(PreviousSelection.prototype), "constructor", this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(PreviousSelection, [{
    key: "selectTextObject",
    value: function selectTextObject(selection) {
      var _vimState$previousSelection = this.vimState.previousSelection;
      var properties = _vimState$previousSelection.properties;
      var submode = _vimState$previousSelection.submode;

      if (properties && submode) {
        this.wise = submode;
        this.swrap(this.editor.getLastSelection()).selectByProperties(properties);
        return true;
      }
    }
  }]);

  return PreviousSelection;
})(TextObject);

PreviousSelection.register();

var PersistentSelection = (function (_TextObject14) {
  _inherits(PersistentSelection, _TextObject14);

  function PersistentSelection() {
    _classCallCheck(this, PersistentSelection);

    _get(Object.getPrototypeOf(PersistentSelection.prototype), "constructor", this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(PersistentSelection, [{
    key: "selectTextObject",
    value: function selectTextObject(selection) {
      if (this.vimState.hasPersistentSelections()) {
        this.persistentSelection.setSelectedBufferRanges();
        return true;
      }
    }
  }]);

  return PersistentSelection;
})(TextObject);

PersistentSelection.register(false, true);

// Used only by ReplaceWithRegister and PutBefore and its' children.

var LastPastedRange = (function (_TextObject15) {
  _inherits(LastPastedRange, _TextObject15);

  function LastPastedRange() {
    _classCallCheck(this, LastPastedRange);

    _get(Object.getPrototypeOf(LastPastedRange.prototype), "constructor", this).apply(this, arguments);

    this.wise = null;
    this.selectOnce = true;
  }

  _createClass(LastPastedRange, [{
    key: "selectTextObject",
    value: function selectTextObject(selection) {
      for (selection of this.editor.getSelections()) {
        var range = this.vimState.sequentialPasteManager.getPastedRangeForSelection(selection);
        selection.setBufferRange(range);
      }
      return true;
    }
  }]);

  return LastPastedRange;
})(TextObject);

LastPastedRange.register(false);

var VisibleArea = (function (_TextObject16) {
  _inherits(VisibleArea, _TextObject16);

  function VisibleArea() {
    _classCallCheck(this, VisibleArea);

    _get(Object.getPrototypeOf(VisibleArea.prototype), "constructor", this).apply(this, arguments);

    this.selectOnce = true;
  }

  _createClass(VisibleArea, [{
    key: "getRange",
    value: function getRange(selection) {
      // [BUG?] Need translate to shilnk top and bottom to fit actual row.
      // The reason I need -2 at bottom is because of status bar?
      var range = getVisibleBufferRange(this.editor);
      return range.getRows() > this.editor.getRowsPerPage() ? range.translate([+1, 0], [-3, 0]) : range;
    }
  }]);

  return VisibleArea;
})(TextObject);

VisibleArea.register(false, true);
// FIXME #472, #66

// Some language don't include closing `}` into fold.
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvdGV4dC1vYmplY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFBOzs7Ozs7Ozs7Ozs7ZUFFWSxPQUFPLENBQUMsTUFBTSxDQUFDOztJQUEvQixLQUFLLFlBQUwsS0FBSztJQUFFLEtBQUssWUFBTCxLQUFLOztBQUNuQixJQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTs7Ozs7QUFLcEMsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBOztnQkFlMUIsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7SUFicEIsMkJBQTJCLGFBQTNCLDJCQUEyQjtJQUMzQixtQ0FBbUMsYUFBbkMsbUNBQW1DO0lBQ25DLDRCQUE0QixhQUE1Qiw0QkFBNEI7SUFDNUIsd0JBQXdCLGFBQXhCLHdCQUF3QjtJQUN4QixxQkFBcUIsYUFBckIscUJBQXFCO0lBQ3JCLHFCQUFxQixhQUFyQixxQkFBcUI7SUFDckIsYUFBYSxhQUFiLGFBQWE7SUFDYixvQkFBb0IsYUFBcEIsb0JBQW9CO0lBQ3BCLFNBQVMsYUFBVCxTQUFTO0lBQ1QsVUFBVSxhQUFWLFVBQVU7SUFDVixrQkFBa0IsYUFBbEIsa0JBQWtCO0lBQ2xCLGNBQWMsYUFBZCxjQUFjO0lBQ2QscUJBQXFCLGFBQXJCLHFCQUFxQjs7QUFFdkIsSUFBSSxVQUFVLFlBQUEsQ0FBQTs7SUFFUixVQUFVO1lBQVYsVUFBVTs7V0FBVixVQUFVOzBCQUFWLFVBQVU7OytCQUFWLFVBQVU7O1NBR2QsSUFBSSxHQUFHLGVBQWU7U0FDdEIsWUFBWSxHQUFHLEtBQUs7U0FDcEIsVUFBVSxHQUFHLEtBQUs7U0FDbEIsZUFBZSxHQUFHLEtBQUs7OztlQU5uQixVQUFVOztXQW9DUCxtQkFBRztBQUNSLGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQTtLQUNsQjs7O1dBRUUsZUFB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QUMsMEJBQTBCLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDeEYsaUJBQVMsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUE7T0FDaEM7QUFDRCxhQUFPLElBQUksQ0FBQTtLQUNaOzs7U0FWRyxlQUFlO0dBQVMsVUFBVTs7QUFZeEMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTs7SUFFekIsV0FBVztZQUFYLFdBQVc7O1dBQVgsV0FBVzswQkFBWCxXQUFXOzsrQkFBWCxXQUFXOztTQUNmLFVBQVUsR0FBRyxJQUFJOzs7ZUFEYixXQUFXOztXQUdQLGtCQUFDLFNBQVMsRUFBRTs7O0FBR2xCLFVBQU0sS0FBSyxHQUFHLHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtBQUNoRCxhQUFPLEtBQUssQ0FBQyxPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFBO0tBQ2xHOzs7U0FSRyxXQUFXO0dBQVMsVUFBVTs7QUFVcEMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUEiLCJmaWxlIjoiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi90ZXh0LW9iamVjdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCJcblxuY29uc3Qge1JhbmdlLCBQb2ludH0gPSByZXF1aXJlKFwiYXRvbVwiKVxuY29uc3QgXyA9IHJlcXVpcmUoXCJ1bmRlcnNjb3JlLXBsdXNcIilcblxuLy8gW1RPRE9dIE5lZWQgb3ZlcmhhdWxcbi8vICAtIFsgXSBNYWtlIGV4cGFuZGFibGUgYnkgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkudW5pb24odGhpcy5nZXRSYW5nZShzZWxlY3Rpb24pKVxuLy8gIC0gWyBdIENvdW50IHN1cHBvcnQocHJpb3JpdHkgbG93KT9cbmNvbnN0IEJhc2UgPSByZXF1aXJlKFwiLi9iYXNlXCIpXG5jb25zdCB7XG4gIGdldExpbmVUZXh0VG9CdWZmZXJQb3NpdGlvbixcbiAgZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3csXG4gIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3csXG4gIGV4cGFuZFJhbmdlVG9XaGl0ZVNwYWNlcyxcbiAgZ2V0VmlzaWJsZUJ1ZmZlclJhbmdlLFxuICB0cmFuc2xhdGVQb2ludEFuZENsaXAsXG4gIGdldEJ1ZmZlclJvd3MsXG4gIGdldFZhbGlkVmltQnVmZmVyUm93LFxuICB0cmltUmFuZ2UsXG4gIHNvcnRSYW5nZXMsXG4gIHBvaW50SXNBdEVuZE9mTGluZSxcbiAgc3BsaXRBcmd1bWVudHMsXG4gIHRyYXZlcnNlVGV4dEZyb21Qb2ludCxcbn0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxubGV0IFBhaXJGaW5kZXJcblxuY2xhc3MgVGV4dE9iamVjdCBleHRlbmRzIEJhc2Uge1xuICBzdGF0aWMgb3BlcmF0aW9uS2luZCA9IFwidGV4dC1vYmplY3RcIlxuXG4gIHdpc2UgPSBcImNoYXJhY3Rlcndpc2VcIlxuICBzdXBwb3J0Q291bnQgPSBmYWxzZSAvLyBGSVhNRSAjNDcyLCAjNjZcbiAgc2VsZWN0T25jZSA9IGZhbHNlXG4gIHNlbGVjdFN1Y2NlZWRlZCA9IGZhbHNlXG5cbiAgc3RhdGljIHJlZ2lzdGVyKGlzQ29tbWFuZCwgZGVyaXZlSW5uZXJBbmRBLCBkZXJpdmVJbm5lckFuZEFGb3JBbGxvd0ZvcndhcmRpbmcpIHtcbiAgICBzdXBlci5yZWdpc3Rlcihpc0NvbW1hbmQpXG5cbiAgICBpZiAoZGVyaXZlSW5uZXJBbmRBKSB7XG4gICAgICB0aGlzLmdlbmVyYXRlQ2xhc3MoYEEke3RoaXMubmFtZX1gLCBmYWxzZSlcbiAgICAgIHRoaXMuZ2VuZXJhdGVDbGFzcyhgSW5uZXIke3RoaXMubmFtZX1gLCB0cnVlKVxuICAgIH1cblxuICAgIGlmIChkZXJpdmVJbm5lckFuZEFGb3JBbGxvd0ZvcndhcmRpbmcpIHtcbiAgICAgIHRoaXMuZ2VuZXJhdGVDbGFzcyhgQSR7dGhpcy5uYW1lfUFsbG93Rm9yd2FyZGluZ2AsIGZhbHNlLCB0cnVlKVxuICAgICAgdGhpcy5nZW5lcmF0ZUNsYXNzKGBJbm5lciR7dGhpcy5uYW1lfUFsbG93Rm9yd2FyZGluZ2AsIHRydWUsIHRydWUpXG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGdlbmVyYXRlQ2xhc3Moa2xhc3NOYW1lLCBpbm5lciwgYWxsb3dGb3J3YXJkaW5nKSB7XG4gICAgY29uc3Qga2xhc3MgPSBjbGFzcyBleHRlbmRzIHRoaXMge1xuICAgICAgc3RhdGljIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4ga2xhc3NOYW1lXG4gICAgICB9XG4gICAgICBjb25zdHJ1Y3Rvcih2aW1TdGF0ZSkge1xuICAgICAgICBzdXBlcih2aW1TdGF0ZSlcbiAgICAgICAgdGhpcy5pbm5lciA9IGlubmVyXG4gICAgICAgIGlmIChhbGxvd0ZvcndhcmRpbmcgIT0gbnVsbCkgdGhpcy5hbGxvd0ZvcndhcmRpbmcgPSBhbGxvd0ZvcndhcmRpbmdcbiAgICAgIH1cbiAgICB9XG4gICAga2xhc3MucmVnaXN0ZXIoKVxuICB9XG5cbiAgaXNJbm5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5pbm5lclxuICB9XG5cbiAgaXNBKCkge1xuICAgIHJldHVybiAhdGhpcy5pbm5lclxuICB9XG5cbiAgaXNMaW5ld2lzZSgpIHtcbiAgICByZXR1cm4gdGhpcy53aXNlID09PSBcImxpbmV3aXNlXCJcbiAgfVxuXG4gIGlzQmxvY2t3aXNlKCkge1xuICAgIHJldHVybiB0aGlzLndpc2UgPT09IFwiYmxvY2t3aXNlXCJcbiAgfVxuXG4gIGZvcmNlV2lzZSh3aXNlKSB7XG4gICAgcmV0dXJuICh0aGlzLndpc2UgPSB3aXNlKSAvLyBGSVhNRSBjdXJyZW50bHkgbm90IHdlbGwgc3VwcG9ydGVkXG4gIH1cblxuICByZXNldFN0YXRlKCkge1xuICAgIHRoaXMuc2VsZWN0U3VjY2VlZGVkID0gZmFsc2VcbiAgfVxuXG4gIC8vIGV4ZWN1dGU6IENhbGxlZCBmcm9tIE9wZXJhdG9yOjpzZWxlY3RUYXJnZXQoKVxuICAvLyAgLSBgdiBpIHBgLCBpcyBgU2VsZWN0SW5WaXN1YWxNb2RlYCBvcGVyYXRvciB3aXRoIEB0YXJnZXQgPSBgSW5uZXJQYXJhZ3JhcGhgLlxuICAvLyAgLSBgZCBpIHBgLCBpcyBgRGVsZXRlYCBvcGVyYXRvciB3aXRoIEB0YXJnZXQgPSBgSW5uZXJQYXJhZ3JhcGhgLlxuICBleGVjdXRlKCkge1xuICAgIC8vIFdoZW5uZXZlciBUZXh0T2JqZWN0IGlzIGV4ZWN1dGVkLCBpdCBoYXMgQG9wZXJhdG9yXG4gICAgaWYgKCF0aGlzLm9wZXJhdG9yKSB0aHJvdyBuZXcgRXJyb3IoXCJpbiBUZXh0T2JqZWN0OiBNdXN0IG5vdCBoYXBwZW5cIilcbiAgICB0aGlzLnNlbGVjdCgpXG4gIH1cblxuICBzZWxlY3QoKSB7XG4gICAgaWYgKHRoaXMuaXNNb2RlKFwidmlzdWFsXCIsIFwiYmxvY2t3aXNlXCIpKSB7XG4gICAgICB0aGlzLnN3cmFwLm5vcm1hbGl6ZSh0aGlzLmVkaXRvcilcbiAgICB9XG5cbiAgICB0aGlzLmNvdW50VGltZXModGhpcy5nZXRDb3VudCgpLCAoe3N0b3B9KSA9PiB7XG4gICAgICBpZiAoIXRoaXMuc3VwcG9ydENvdW50KSBzdG9wKCkgLy8gcXVpY2stZml4IGZvciAjNTYwXG5cbiAgICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgICBjb25zdCBvbGRSYW5nZSA9IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdFRleHRPYmplY3Qoc2VsZWN0aW9uKSkgdGhpcy5zZWxlY3RTdWNjZWVkZWQgPSB0cnVlXG4gICAgICAgIGlmIChzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5pc0VxdWFsKG9sZFJhbmdlKSkgc3RvcCgpXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdE9uY2UpIGJyZWFrXG4gICAgICB9XG4gICAgfSlcblxuICAgIHRoaXMuZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgLy8gU29tZSBUZXh0T2JqZWN0J3Mgd2lzZSBpcyBOT1QgZGV0ZXJtaW5pc3RpYy4gSXQgaGFzIHRvIGJlIGRldGVjdGVkIGZyb20gc2VsZWN0ZWQgcmFuZ2UuXG4gICAgaWYgKHRoaXMud2lzZSA9PSBudWxsKSB0aGlzLndpc2UgPSB0aGlzLnN3cmFwLmRldGVjdFdpc2UodGhpcy5lZGl0b3IpXG5cbiAgICBpZiAodGhpcy5vcGVyYXRvci5pbnN0YW5jZW9mKFwiU2VsZWN0QmFzZVwiKSkge1xuICAgICAgaWYgKHRoaXMuc2VsZWN0U3VjY2VlZGVkKSB7XG4gICAgICAgIGlmICh0aGlzLndpc2UgPT09IFwiY2hhcmFjdGVyd2lzZVwiKSB7XG4gICAgICAgICAgdGhpcy5zd3JhcC5nZXRTZWxlY3Rpb25zKHRoaXMuZWRpdG9yKS5mb3JFYWNoKCRzZWxlY3Rpb24gPT4gJHNlbGVjdGlvbi5zYXZlUHJvcGVydGllcygpKVxuICAgICAgICAgIGZvciAoY29uc3QgJHNlbGVjdGlvbiBvZiB0aGlzLnN3cmFwLmdldFNlbGVjdGlvbnModGhpcy5lZGl0b3IpKSB7XG4gICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy53aXNlID09PSBcImxpbmV3aXNlXCIpIHtcbiAgICAgICAgICAvLyBXaGVuIHRhcmdldCBpcyBwZXJzaXN0ZW50LXNlbGVjdGlvbiwgbmV3IHNlbGVjdGlvbiBpcyBhZGRlZCBhZnRlciBzZWxlY3RUZXh0T2JqZWN0LlxuICAgICAgICAgIC8vIFNvIHdlIGhhdmUgdG8gYXNzdXJlIGFsbCBzZWxlY3Rpb24gaGF2ZSBzZWxjdGlvbiBwcm9wZXJ0eS5cbiAgICAgICAgICAvLyBNYXliZSB0aGlzIGxvZ2ljIGNhbiBiZSBtb3ZlZCB0byBvcGVyYXRpb24gc3RhY2suXG4gICAgICAgICAgZm9yIChjb25zdCAkc2VsZWN0aW9uIG9mIHRoaXMuc3dyYXAuZ2V0U2VsZWN0aW9ucyh0aGlzLmVkaXRvcikpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmdldENvbmZpZyhcInN0YXlPblNlbGVjdFRleHRPYmplY3RcIikpIHtcbiAgICAgICAgICAgICAgaWYgKCEkc2VsZWN0aW9uLmhhc1Byb3BlcnRpZXMoKSkgJHNlbGVjdGlvbi5zYXZlUHJvcGVydGllcygpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICRzZWxlY3Rpb24uZml4UHJvcGVydHlSb3dUb1Jvd1JhbmdlKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3VibW9kZSA9PT0gXCJibG9ja3dpc2VcIikge1xuICAgICAgICBmb3IgKGNvbnN0ICRzZWxlY3Rpb24gb2YgdGhpcy5zd3JhcC5nZXRTZWxlY3Rpb25zKHRoaXMuZWRpdG9yKSkge1xuICAgICAgICAgICRzZWxlY3Rpb24ubm9ybWFsaXplKClcbiAgICAgICAgICAkc2VsZWN0aW9uLmFwcGx5V2lzZShcImJsb2Nrd2lzZVwiKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJuIHRydWUgb3IgZmFsc2VcbiAgc2VsZWN0VGV4dE9iamVjdChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCByYW5nZSA9IHRoaXMuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgIGlmIChyYW5nZSkge1xuICAgICAgdGhpcy5zd3JhcChzZWxlY3Rpb24pLnNldEJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgLy8gdG8gb3ZlcnJpZGVcbiAgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSB7fVxufVxuVGV4dE9iamVjdC5yZWdpc3RlcihmYWxzZSlcblxuLy8gU2VjdGlvbjogV29yZFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgV29yZCBleHRlbmRzIFRleHRPYmplY3Qge1xuICBnZXRSYW5nZShzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHtyYW5nZX0gPSB0aGlzLmdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uKHBvaW50LCB7d29yZFJlZ2V4OiB0aGlzLndvcmRSZWdleH0pXG4gICAgcmV0dXJuIHRoaXMuaXNBKCkgPyBleHBhbmRSYW5nZVRvV2hpdGVTcGFjZXModGhpcy5lZGl0b3IsIHJhbmdlKSA6IHJhbmdlXG4gIH1cbn1cbldvcmQucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbmNsYXNzIFdob2xlV29yZCBleHRlbmRzIFdvcmQge1xuICB3b3JkUmVnZXggPSAvXFxTKy9cbn1cbldob2xlV29yZC5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuLy8gSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFNtYXJ0V29yZCBleHRlbmRzIFdvcmQge1xuICB3b3JkUmVnZXggPSAvW1xcdy1dKy9cbn1cblNtYXJ0V29yZC5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuLy8gSnVzdCBpbmNsdWRlIF8sIC1cbmNsYXNzIFN1YndvcmQgZXh0ZW5kcyBXb3JkIHtcbiAgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSB7XG4gICAgdGhpcy53b3JkUmVnZXggPSBzZWxlY3Rpb24uY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHJldHVybiBzdXBlci5nZXRSYW5nZShzZWxlY3Rpb24pXG4gIH1cbn1cblN1YndvcmQucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbi8vIFNlY3Rpb246IFBhaXJcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFBhaXIgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgc3VwcG9ydENvdW50ID0gdHJ1ZVxuICBhbGxvd05leHRMaW5lID0gbnVsbFxuICBhZGp1c3RJbm5lclJhbmdlID0gdHJ1ZVxuICBwYWlyID0gbnVsbFxuICBpbmNsdXNpdmUgPSB0cnVlXG5cbiAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgIHN1cGVyKC4uLmFyZ3MpXG4gICAgaWYgKCFQYWlyRmluZGVyKSBQYWlyRmluZGVyID0gcmVxdWlyZShcIi4vcGFpci1maW5kZXJcIilcbiAgfVxuXG4gIGlzQWxsb3dOZXh0TGluZSgpIHtcbiAgICByZXR1cm4gdGhpcy5hbGxvd05leHRMaW5lICE9IG51bGwgPyB0aGlzLmFsbG93TmV4dExpbmUgOiB0aGlzLnBhaXIgIT0gbnVsbCAmJiB0aGlzLnBhaXJbMF0gIT09IHRoaXMucGFpclsxXVxuICB9XG5cbiAgYWRqdXN0UmFuZ2Uoe3N0YXJ0LCBlbmR9KSB7XG4gICAgLy8gRGlydHkgd29yayB0byBmZWVsIG5hdHVyYWwgZm9yIGh1bWFuLCB0byBiZWhhdmUgY29tcGF0aWJsZSB3aXRoIHB1cmUgVmltLlxuICAgIC8vIFdoZXJlIHRoaXMgYWRqdXN0bWVudCBhcHBlYXIgaXMgaW4gZm9sbG93aW5nIHNpdHVhdGlvbi5cbiAgICAvLyBvcC0xOiBgY2l7YCByZXBsYWNlIG9ubHkgMm5kIGxpbmVcbiAgICAvLyBvcC0yOiBgZGl7YCBkZWxldGUgb25seSAybmQgbGluZS5cbiAgICAvLyB0ZXh0OlxuICAgIC8vICB7XG4gICAgLy8gICAgYWFhXG4gICAgLy8gIH1cbiAgICBpZiAocG9pbnRJc0F0RW5kT2ZMaW5lKHRoaXMuZWRpdG9yLCBzdGFydCkpIHtcbiAgICAgIHN0YXJ0ID0gc3RhcnQudHJhdmVyc2UoWzEsIDBdKVxuICAgIH1cblxuICAgIGlmIChnZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb24odGhpcy5lZGl0b3IsIGVuZCkubWF0Y2goL15cXHMqJC8pKSB7XG4gICAgICBpZiAodGhpcy5tb2RlID09PSBcInZpc3VhbFwiKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgc2xpZ2h0bHkgaW5uY29uc2lzdGVudCB3aXRoIHJlZ3VsYXIgVmltXG4gICAgICAgIC8vIC0gcmVndWxhciBWaW06IHNlbGVjdCBuZXcgbGluZSBhZnRlciBFT0xcbiAgICAgICAgLy8gLSB2aW0tbW9kZS1wbHVzOiBzZWxlY3QgdG8gRU9MKGJlZm9yZSBuZXcgbGluZSlcbiAgICAgICAgLy8gVGhpcyBpcyBpbnRlbnRpb25hbCBzaW5jZSB0byBtYWtlIHN1Ym1vZGUgYGNoYXJhY3Rlcndpc2VgIHdoZW4gYXV0by1kZXRlY3Qgc3VibW9kZVxuICAgICAgICAvLyBpbm5lckVuZCA9IG5ldyBQb2ludChpbm5lckVuZC5yb3cgLSAxLCBJbmZpbml0eSlcbiAgICAgICAgZW5kID0gbmV3IFBvaW50KGVuZC5yb3cgLSAxLCBJbmZpbml0eSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93LCAwKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG4gIH1cblxuICBnZXRGaW5kZXIoKSB7XG4gICAgY29uc3QgZmluZGVyTmFtZSA9IHRoaXMucGFpclswXSA9PT0gdGhpcy5wYWlyWzFdID8gXCJRdW90ZUZpbmRlclwiIDogXCJCcmFja2V0RmluZGVyXCJcbiAgICByZXR1cm4gbmV3IFBhaXJGaW5kZXJbZmluZGVyTmFtZV0odGhpcy5lZGl0b3IsIHtcbiAgICAgIGFsbG93TmV4dExpbmU6IHRoaXMuaXNBbGxvd05leHRMaW5lKCksXG4gICAgICBhbGxvd0ZvcndhcmRpbmc6IHRoaXMuYWxsb3dGb3J3YXJkaW5nLFxuICAgICAgcGFpcjogdGhpcy5wYWlyLFxuICAgICAgaW5jbHVzaXZlOiB0aGlzLmluY2x1c2l2ZSxcbiAgICB9KVxuICB9XG5cbiAgZ2V0UGFpckluZm8oZnJvbSkge1xuICAgIGNvbnN0IHBhaXJJbmZvID0gdGhpcy5nZXRGaW5kZXIoKS5maW5kKGZyb20pXG4gICAgaWYgKHBhaXJJbmZvKSB7XG4gICAgICBpZiAodGhpcy5hZGp1c3RJbm5lclJhbmdlKSBwYWlySW5mby5pbm5lclJhbmdlID0gdGhpcy5hZGp1c3RSYW5nZShwYWlySW5mby5pbm5lclJhbmdlKVxuICAgICAgcGFpckluZm8udGFyZ2V0UmFuZ2UgPSB0aGlzLmlzSW5uZXIoKSA/IHBhaXJJbmZvLmlubmVyUmFuZ2UgOiBwYWlySW5mby5hUmFuZ2VcbiAgICAgIHJldHVybiBwYWlySW5mb1xuICAgIH1cbiAgfVxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IG9yaWdpbmFsUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGxldCBwYWlySW5mbyA9IHRoaXMuZ2V0UGFpckluZm8odGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pKVxuICAgIC8vIFdoZW4gcmFuZ2Ugd2FzIHNhbWUsIHRyeSB0byBleHBhbmQgcmFuZ2VcbiAgICBpZiAocGFpckluZm8gJiYgcGFpckluZm8udGFyZ2V0UmFuZ2UuaXNFcXVhbChvcmlnaW5hbFJhbmdlKSkge1xuICAgICAgcGFpckluZm8gPSB0aGlzLmdldFBhaXJJbmZvKHBhaXJJbmZvLmFSYW5nZS5lbmQpXG4gICAgfVxuICAgIGlmIChwYWlySW5mbykgcmV0dXJuIHBhaXJJbmZvLnRhcmdldFJhbmdlXG4gIH1cbn1cblBhaXIucmVnaXN0ZXIoZmFsc2UpXG5cbi8vIFVzZWQgYnkgRGVsZXRlU3Vycm91bmRcbmNsYXNzIEFQYWlyIGV4dGVuZHMgUGFpciB7fVxuQVBhaXIucmVnaXN0ZXIoZmFsc2UpXG5cbmNsYXNzIEFueVBhaXIgZXh0ZW5kcyBQYWlyIHtcbiAgYWxsb3dGb3J3YXJkaW5nID0gZmFsc2VcbiAgbWVtYmVyID0gW1wiRG91YmxlUXVvdGVcIiwgXCJTaW5nbGVRdW90ZVwiLCBcIkJhY2tUaWNrXCIsIFwiQ3VybHlCcmFja2V0XCIsIFwiQW5nbGVCcmFja2V0XCIsIFwiU3F1YXJlQnJhY2tldFwiLCBcIlBhcmVudGhlc2lzXCJdXG5cbiAgZ2V0UmFuZ2VzKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7aW5uZXI6IHRoaXMuaW5uZXIsIGFsbG93Rm9yd2FyZGluZzogdGhpcy5hbGxvd0ZvcndhcmRpbmcsIGluY2x1c2l2ZTogdGhpcy5pbmNsdXNpdmV9XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyLm1hcChtZW1iZXIgPT4gdGhpcy5nZXRJbnN0YW5jZShtZW1iZXIsIG9wdGlvbnMpLmdldFJhbmdlKHNlbGVjdGlvbikpLmZpbHRlcihyYW5nZSA9PiByYW5nZSlcbiAgfVxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIHJldHVybiBfLmxhc3Qoc29ydFJhbmdlcyh0aGlzLmdldFJhbmdlcyhzZWxlY3Rpb24pKSlcbiAgfVxufVxuQW55UGFpci5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuY2xhc3MgQW55UGFpckFsbG93Rm9yd2FyZGluZyBleHRlbmRzIEFueVBhaXIge1xuICBhbGxvd0ZvcndhcmRpbmcgPSB0cnVlXG5cbiAgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcmFuZ2VzID0gdGhpcy5nZXRSYW5nZXMoc2VsZWN0aW9uKVxuICAgIGNvbnN0IGZyb20gPSBzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBsZXQgW2ZvcndhcmRpbmdSYW5nZXMsIGVuY2xvc2luZ1Jhbmdlc10gPSBfLnBhcnRpdGlvbihyYW5nZXMsIHJhbmdlID0+IHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW5PckVxdWFsKGZyb20pKVxuICAgIGNvbnN0IGVuY2xvc2luZ1JhbmdlID0gXy5sYXN0KHNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKSlcbiAgICBmb3J3YXJkaW5nUmFuZ2VzID0gc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgLy8gV2hlbiBlbmNsb3NpbmdSYW5nZSBpcyBleGlzdHMsXG4gICAgLy8gV2UgZG9uJ3QgZ28gYWNyb3NzIGVuY2xvc2luZ1JhbmdlLmVuZC5cbiAgICAvLyBTbyBjaG9vc2UgZnJvbSByYW5nZXMgY29udGFpbmVkIGluIGVuY2xvc2luZ1JhbmdlLlxuICAgIGlmIChlbmNsb3NpbmdSYW5nZSkge1xuICAgICAgZm9yd2FyZGluZ1JhbmdlcyA9IGZvcndhcmRpbmdSYW5nZXMuZmlsdGVyKHJhbmdlID0+IGVuY2xvc2luZ1JhbmdlLmNvbnRhaW5zUmFuZ2UocmFuZ2UpKVxuICAgIH1cblxuICAgIHJldHVybiBmb3J3YXJkaW5nUmFuZ2VzWzBdIHx8IGVuY2xvc2luZ1JhbmdlXG4gIH1cbn1cbkFueVBhaXJBbGxvd0ZvcndhcmRpbmcucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbmNsYXNzIEFueVF1b3RlIGV4dGVuZHMgQW55UGFpciB7XG4gIGFsbG93Rm9yd2FyZGluZyA9IHRydWVcbiAgbWVtYmVyID0gW1wiRG91YmxlUXVvdGVcIiwgXCJTaW5nbGVRdW90ZVwiLCBcIkJhY2tUaWNrXCJdXG5cbiAgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcmFuZ2VzID0gdGhpcy5nZXRSYW5nZXMoc2VsZWN0aW9uKVxuICAgIC8vIFBpY2sgcmFuZ2Ugd2hpY2ggZW5kLmNvbHVtIGlzIGxlZnRtb3N0KG1lYW4sIGNsb3NlZCBmaXJzdClcbiAgICBpZiAocmFuZ2VzLmxlbmd0aCkgcmV0dXJuIF8uZmlyc3QoXy5zb3J0QnkocmFuZ2VzLCByID0+IHIuZW5kLmNvbHVtbikpXG4gIH1cbn1cbkFueVF1b3RlLnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuXG5jbGFzcyBRdW90ZSBleHRlbmRzIFBhaXIge1xuICBhbGxvd0ZvcndhcmRpbmcgPSB0cnVlXG59XG5RdW90ZS5yZWdpc3RlcihmYWxzZSlcblxuY2xhc3MgRG91YmxlUXVvdGUgZXh0ZW5kcyBRdW90ZSB7XG4gIHBhaXIgPSBbJ1wiJywgJ1wiJ11cbn1cbkRvdWJsZVF1b3RlLnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuXG5jbGFzcyBTaW5nbGVRdW90ZSBleHRlbmRzIFF1b3RlIHtcbiAgcGFpciA9IFtcIidcIiwgXCInXCJdXG59XG5TaW5nbGVRdW90ZS5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuY2xhc3MgQmFja1RpY2sgZXh0ZW5kcyBRdW90ZSB7XG4gIHBhaXIgPSBbXCJgXCIsIFwiYFwiXVxufVxuQmFja1RpY2sucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbmNsYXNzIEN1cmx5QnJhY2tldCBleHRlbmRzIFBhaXIge1xuICBwYWlyID0gW1wie1wiLCBcIn1cIl1cbn1cbkN1cmx5QnJhY2tldC5yZWdpc3RlcihmYWxzZSwgdHJ1ZSwgdHJ1ZSlcblxuY2xhc3MgU3F1YXJlQnJhY2tldCBleHRlbmRzIFBhaXIge1xuICBwYWlyID0gW1wiW1wiLCBcIl1cIl1cbn1cblNxdWFyZUJyYWNrZXQucmVnaXN0ZXIoZmFsc2UsIHRydWUsIHRydWUpXG5cbmNsYXNzIFBhcmVudGhlc2lzIGV4dGVuZHMgUGFpciB7XG4gIHBhaXIgPSBbXCIoXCIsIFwiKVwiXVxufVxuUGFyZW50aGVzaXMucmVnaXN0ZXIoZmFsc2UsIHRydWUsIHRydWUpXG5cbmNsYXNzIEFuZ2xlQnJhY2tldCBleHRlbmRzIFBhaXIge1xuICBwYWlyID0gW1wiPFwiLCBcIj5cIl1cbn1cbkFuZ2xlQnJhY2tldC5yZWdpc3RlcihmYWxzZSwgdHJ1ZSwgdHJ1ZSlcblxuY2xhc3MgVGFnIGV4dGVuZHMgUGFpciB7XG4gIGFsbG93TmV4dExpbmUgPSB0cnVlXG4gIGFsbG93Rm9yd2FyZGluZyA9IHRydWVcbiAgYWRqdXN0SW5uZXJSYW5nZSA9IGZhbHNlXG5cbiAgZ2V0VGFnU3RhcnRQb2ludChmcm9tKSB7XG4gICAgbGV0IHRhZ1JhbmdlXG4gICAgY29uc3Qge3BhdHRlcm59ID0gUGFpckZpbmRlci5UYWdGaW5kZXJcbiAgICB0aGlzLnNjYW5Gb3J3YXJkKHBhdHRlcm4sIHtmcm9tOiBbZnJvbS5yb3csIDBdfSwgKHtyYW5nZSwgc3RvcH0pID0+IHtcbiAgICAgIGlmIChyYW5nZS5jb250YWluc1BvaW50KGZyb20sIHRydWUpKSB7XG4gICAgICAgIHRhZ1JhbmdlID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgICB9XG4gICAgfSlcbiAgICBpZiAodGFnUmFuZ2UpIHJldHVybiB0YWdSYW5nZS5zdGFydFxuICB9XG5cbiAgZ2V0RmluZGVyKCkge1xuICAgIHJldHVybiBuZXcgUGFpckZpbmRlci5UYWdGaW5kZXIodGhpcy5lZGl0b3IsIHtcbiAgICAgIGFsbG93TmV4dExpbmU6IHRoaXMuaXNBbGxvd05leHRMaW5lKCksXG4gICAgICBhbGxvd0ZvcndhcmRpbmc6IHRoaXMuYWxsb3dGb3J3YXJkaW5nLFxuICAgICAgaW5jbHVzaXZlOiB0aGlzLmluY2x1c2l2ZSxcbiAgICB9KVxuICB9XG5cbiAgZ2V0UGFpckluZm8oZnJvbSkge1xuICAgIHJldHVybiBzdXBlci5nZXRQYWlySW5mbyh0aGlzLmdldFRhZ1N0YXJ0UG9pbnQoZnJvbSkgfHwgZnJvbSlcbiAgfVxufVxuVGFnLnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuXG4vLyBTZWN0aW9uOiBQYXJhZ3JhcGhcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbi8vIFBhcmFncmFwaCBpcyBkZWZpbmVkIGFzIGNvbnNlY3V0aXZlIChub24tKWJsYW5rLWxpbmUuXG5jbGFzcyBQYXJhZ3JhcGggZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9IFwibGluZXdpc2VcIlxuICBzdXBwb3J0Q291bnQgPSB0cnVlXG5cbiAgZmluZFJvdyhmcm9tUm93LCBkaXJlY3Rpb24sIGZuKSB7XG4gICAgaWYgKGZuLnJlc2V0KSBmbi5yZXNldCgpXG4gICAgbGV0IGZvdW5kUm93ID0gZnJvbVJvd1xuICAgIGZvciAoY29uc3Qgcm93IG9mIGdldEJ1ZmZlclJvd3ModGhpcy5lZGl0b3IsIHtzdGFydFJvdzogZnJvbVJvdywgZGlyZWN0aW9ufSkpIHtcbiAgICAgIGlmICghZm4ocm93LCBkaXJlY3Rpb24pKSBicmVha1xuICAgICAgZm91bmRSb3cgPSByb3dcbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kUm93XG4gIH1cblxuICBmaW5kUm93UmFuZ2VCeShmcm9tUm93LCBmbikge1xuICAgIGNvbnN0IHN0YXJ0Um93ID0gdGhpcy5maW5kUm93KGZyb21Sb3csIFwicHJldmlvdXNcIiwgZm4pXG4gICAgY29uc3QgZW5kUm93ID0gdGhpcy5maW5kUm93KGZyb21Sb3csIFwibmV4dFwiLCBmbilcbiAgICByZXR1cm4gW3N0YXJ0Um93LCBlbmRSb3ddXG4gIH1cblxuICBnZXRQcmVkaWN0RnVuY3Rpb24oZnJvbVJvdywgc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgZnJvbVJvd1Jlc3VsdCA9IHRoaXMuZWRpdG9yLmlzQnVmZmVyUm93QmxhbmsoZnJvbVJvdylcblxuICAgIGlmICh0aGlzLmlzSW5uZXIoKSkge1xuICAgICAgcmV0dXJuIChyb3csIGRpcmVjdGlvbikgPT4gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpID09PSBmcm9tUm93UmVzdWx0XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGRpcmVjdGlvblRvRXh0ZW5kID0gc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKSA/IFwicHJldmlvdXNcIiA6IFwibmV4dFwiXG5cbiAgICAgIGxldCBmbGlwID0gZmFsc2VcbiAgICAgIGNvbnN0IHByZWRpY3QgPSAocm93LCBkaXJlY3Rpb24pID0+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpID09PSBmcm9tUm93UmVzdWx0XG4gICAgICAgIGlmIChmbGlwKSB7XG4gICAgICAgICAgcmV0dXJuICFyZXN1bHRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIXJlc3VsdCAmJiBkaXJlY3Rpb24gPT09IGRpcmVjdGlvblRvRXh0ZW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gKGZsaXAgPSB0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHByZWRpY3QucmVzZXQgPSAoKSA9PiAoZmxpcCA9IGZhbHNlKVxuICAgICAgcmV0dXJuIHByZWRpY3RcbiAgICB9XG4gIH1cblxuICBnZXRSYW5nZShzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBsZXQgZnJvbVJvdyA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICBpZiAodGhpcy5pc01vZGUoXCJ2aXN1YWxcIiwgXCJsaW5ld2lzZVwiKSkge1xuICAgICAgaWYgKHNlbGVjdGlvbi5pc1JldmVyc2VkKCkpIGZyb21Sb3ctLVxuICAgICAgZWxzZSBmcm9tUm93KytcbiAgICAgIGZyb21Sb3cgPSBnZXRWYWxpZFZpbUJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgZnJvbVJvdylcbiAgICB9XG4gICAgY29uc3Qgcm93UmFuZ2UgPSB0aGlzLmZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIHRoaXMuZ2V0UHJlZGljdEZ1bmN0aW9uKGZyb21Sb3csIHNlbGVjdGlvbikpXG4gICAgcmV0dXJuIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnVuaW9uKHRoaXMuZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShyb3dSYW5nZSkpXG4gIH1cbn1cblBhcmFncmFwaC5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuY2xhc3MgSW5kZW50YXRpb24gZXh0ZW5kcyBQYXJhZ3JhcGgge1xuICBnZXRSYW5nZShzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBmcm9tUm93ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIGNvbnN0IGJhc2VJbmRlbnRMZXZlbCA9IHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KGZyb21Sb3cpXG4gICAgY29uc3Qgcm93UmFuZ2UgPSB0aGlzLmZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIHJvdyA9PiB7XG4gICAgICByZXR1cm4gdGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpXG4gICAgICAgID8gdGhpcy5pc0EoKVxuICAgICAgICA6IHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHJvdykgPj0gYmFzZUluZGVudExldmVsXG4gICAgfSlcbiAgICByZXR1cm4gdGhpcy5nZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKHJvd1JhbmdlKVxuICB9XG59XG5JbmRlbnRhdGlvbi5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuLy8gU2VjdGlvbjogQ29tbWVudFxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ29tbWVudCBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gXCJsaW5ld2lzZVwiXG5cbiAgZ2V0UmFuZ2Uoc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qge3Jvd30gPSB0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBjb25zdCByb3dSYW5nZSA9IHRoaXMudXRpbHMuZ2V0Um93UmFuZ2VGb3JDb21tZW50QXRCdWZmZXJSb3codGhpcy5lZGl0b3IsIHJvdylcbiAgICBpZiAocm93UmFuZ2UpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2Uocm93UmFuZ2UpXG4gICAgfVxuICB9XG59XG5Db21tZW50LnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuXG5jbGFzcyBDb21tZW50T3JQYXJhZ3JhcGggZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9IFwibGluZXdpc2VcIlxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtpbm5lcn0gPSB0aGlzXG4gICAgZm9yIChjb25zdCBrbGFzcyBvZiBbXCJDb21tZW50XCIsIFwiUGFyYWdyYXBoXCJdKSB7XG4gICAgICBjb25zdCByYW5nZSA9IHRoaXMuZ2V0SW5zdGFuY2Uoa2xhc3MsIHtpbm5lcn0pLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgICAgIGlmIChyYW5nZSkgcmV0dXJuIHJhbmdlXG4gICAgfVxuICB9XG59XG5Db21tZW50T3JQYXJhZ3JhcGgucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbi8vIFNlY3Rpb246IEZvbGRcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIEZvbGQgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9IFwibGluZXdpc2VcIlxuXG4gIGFkanVzdFJvd1JhbmdlKHJvd1JhbmdlKSB7XG4gICAgaWYgKHRoaXMuaXNBKCkpIHJldHVybiByb3dSYW5nZVxuXG4gICAgbGV0IFtzdGFydFJvdywgZW5kUm93XSA9IHJvd1JhbmdlXG4gICAgaWYgKHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHN0YXJ0Um93KSA9PT0gdGhpcy5lZGl0b3IuaW5kZW50YXRpb25Gb3JCdWZmZXJSb3coZW5kUm93KSkge1xuICAgICAgZW5kUm93IC09IDFcbiAgICB9XG4gICAgc3RhcnRSb3cgKz0gMVxuICAgIHJldHVybiBbc3RhcnRSb3csIGVuZFJvd11cbiAgfVxuXG4gIGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdyhyb3cpIHtcbiAgICByZXR1cm4gZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3codGhpcy5lZGl0b3IsIHJvdykucmV2ZXJzZSgpXG4gIH1cblxuICBnZXRSYW5nZShzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB7cm93fSA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHNlbGVjdGVkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgIGZvciAoY29uc3Qgcm93UmFuZ2Ugb2YgdGhpcy5nZXRGb2xkUm93UmFuZ2VzQ29udGFpbnNGb3JSb3cocm93KSkge1xuICAgICAgY29uc3QgcmFuZ2UgPSB0aGlzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UodGhpcy5hZGp1c3RSb3dSYW5nZShyb3dSYW5nZSkpXG5cbiAgICAgIC8vIERvbid0IGNoYW5nZSB0byBgaWYgcmFuZ2UuY29udGFpbnNSYW5nZShzZWxlY3RlZFJhbmdlLCB0cnVlKWBcbiAgICAgIC8vIFRoZXJlIGlzIGJlaGF2aW9yIGRpZmYgd2hlbiBjdXJzb3IgaXMgYXQgYmVnaW5uaW5nIG9mIGxpbmUoIGNvbHVtbiAwICkuXG4gICAgICBpZiAoIXNlbGVjdGVkUmFuZ2UuY29udGFpbnNSYW5nZShyYW5nZSkpIHJldHVybiByYW5nZVxuICAgIH1cbiAgfVxufVxuRm9sZC5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuLy8gTk9URTogRnVuY3Rpb24gcmFuZ2UgZGV0ZXJtaW5hdGlvbiBpcyBkZXBlbmRpbmcgb24gZm9sZC5cbmNsYXNzIEZ1bmN0aW9uIGV4dGVuZHMgRm9sZCB7XG4gIC8vIFNvbWUgbGFuZ3VhZ2UgZG9uJ3QgaW5jbHVkZSBjbG9zaW5nIGB9YCBpbnRvIGZvbGQuXG4gIHNjb3BlTmFtZXNPbWl0dGluZ0VuZFJvdyA9IFtcInNvdXJjZS5nb1wiLCBcInNvdXJjZS5lbGl4aXJcIl1cblxuICBpc0dyYW1tYXJOb3RGb2xkRW5kUm93KCkge1xuICAgIGNvbnN0IHtzY29wZU5hbWUsIHBhY2thZ2VOYW1lfSA9IHRoaXMuZWRpdG9yLmdldEdyYW1tYXIoKVxuICAgIGlmICh0aGlzLnNjb3BlTmFtZXNPbWl0dGluZ0VuZFJvdy5pbmNsdWRlcyhzY29wZU5hbWUpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBIQUNLOiBSdXN0IGhhdmUgdHdvIHBhY2thZ2UgYGxhbmd1YWdlLXJ1c3RgIGFuZCBgYXRvbS1sYW5ndWFnZS1ydXN0YFxuICAgICAgLy8gbGFuZ3VhZ2UtcnVzdCBkb24ndCBmb2xkIGVuZGluZyBgfWAsIGJ1dCBhdG9tLWxhbmd1YWdlLXJ1c3QgZG9lcy5cbiAgICAgIHJldHVybiBzY29wZU5hbWUgPT09IFwic291cmNlLnJ1c3RcIiAmJiBwYWNrYWdlTmFtZSA9PT0gXCJsYW5ndWFnZS1ydXN0XCJcbiAgICB9XG4gIH1cblxuICBnZXRGb2xkUm93UmFuZ2VzQ29udGFpbnNGb3JSb3cocm93KSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdyhyb3cpLmZpbHRlcihyb3dSYW5nZSA9PiB7XG4gICAgICByZXR1cm4gaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyh0aGlzLmVkaXRvciwgcm93UmFuZ2VbMF0pXG4gICAgfSlcbiAgfVxuXG4gIGFkanVzdFJvd1JhbmdlKHJvd1JhbmdlKSB7XG4gICAgbGV0IFtzdGFydFJvdywgZW5kUm93XSA9IHN1cGVyLmFkanVzdFJvd1JhbmdlKHJvd1JhbmdlKVxuICAgIC8vIE5PVEU6IFRoaXMgYWRqdXN0bWVudCBzaG91ZCBub3QgYmUgbmVjZXNzYXJ5IGlmIGxhbmd1YWdlLXN5bnRheCBpcyBwcm9wZXJseSBkZWZpbmVkLlxuICAgIGlmICh0aGlzLmlzQSgpICYmIHRoaXMuaXNHcmFtbWFyTm90Rm9sZEVuZFJvdygpKSBlbmRSb3cgKz0gMVxuICAgIHJldHVybiBbc3RhcnRSb3csIGVuZFJvd11cbiAgfVxufVxuRnVuY3Rpb24ucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbi8vIFNlY3Rpb246IE90aGVyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBBcmd1bWVudHMgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgbmV3QXJnSW5mbyhhcmdTdGFydCwgYXJnLCBzZXBhcmF0b3IpIHtcbiAgICBjb25zdCBhcmdFbmQgPSB0cmF2ZXJzZVRleHRGcm9tUG9pbnQoYXJnU3RhcnQsIGFyZylcbiAgICBjb25zdCBhcmdSYW5nZSA9IG5ldyBSYW5nZShhcmdTdGFydCwgYXJnRW5kKVxuXG4gICAgY29uc3Qgc2VwYXJhdG9yRW5kID0gdHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ0VuZCwgc2VwYXJhdG9yICE9IG51bGwgPyBzZXBhcmF0b3IgOiBcIlwiKVxuICAgIGNvbnN0IHNlcGFyYXRvclJhbmdlID0gbmV3IFJhbmdlKGFyZ0VuZCwgc2VwYXJhdG9yRW5kKVxuXG4gICAgY29uc3QgaW5uZXJSYW5nZSA9IGFyZ1JhbmdlXG4gICAgY29uc3QgYVJhbmdlID0gYXJnUmFuZ2UudW5pb24oc2VwYXJhdG9yUmFuZ2UpXG4gICAgcmV0dXJuIHthcmdSYW5nZSwgc2VwYXJhdG9yUmFuZ2UsIGlubmVyUmFuZ2UsIGFSYW5nZX1cbiAgfVxuXG4gIGdldEFyZ3VtZW50c1JhbmdlRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICBtZW1iZXI6IFtcIkN1cmx5QnJhY2tldFwiLCBcIlNxdWFyZUJyYWNrZXRcIiwgXCJQYXJlbnRoZXNpc1wiXSxcbiAgICAgIGluY2x1c2l2ZTogZmFsc2UsXG4gICAgfVxuICAgIHJldHVybiB0aGlzLmdldEluc3RhbmNlKFwiSW5uZXJBbnlQYWlyXCIsIG9wdGlvbnMpLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgfVxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIGxldCByYW5nZSA9IHRoaXMuZ2V0QXJndW1lbnRzUmFuZ2VGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIGNvbnN0IHBhaXJSYW5nZUZvdW5kID0gcmFuZ2UgIT0gbnVsbFxuXG4gICAgcmFuZ2UgPSByYW5nZSB8fCB0aGlzLmdldEluc3RhbmNlKFwiSW5uZXJDdXJyZW50TGluZVwiKS5nZXRSYW5nZShzZWxlY3Rpb24pIC8vIGZhbGxiYWNrXG4gICAgaWYgKCFyYW5nZSkgcmV0dXJuXG5cbiAgICByYW5nZSA9IHRyaW1SYW5nZSh0aGlzLmVkaXRvciwgcmFuZ2UpXG5cbiAgICBjb25zdCB0ZXh0ID0gdGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgY29uc3QgYWxsVG9rZW5zID0gc3BsaXRBcmd1bWVudHModGV4dCwgcGFpclJhbmdlRm91bmQpXG5cbiAgICBjb25zdCBhcmdJbmZvcyA9IFtdXG4gICAgbGV0IGFyZ1N0YXJ0ID0gcmFuZ2Uuc3RhcnRcblxuICAgIC8vIFNraXAgc3RhcnRpbmcgc2VwYXJhdG9yXG4gICAgaWYgKGFsbFRva2Vucy5sZW5ndGggJiYgYWxsVG9rZW5zWzBdLnR5cGUgPT09IFwic2VwYXJhdG9yXCIpIHtcbiAgICAgIGNvbnN0IHRva2VuID0gYWxsVG9rZW5zLnNoaWZ0KClcbiAgICAgIGFyZ1N0YXJ0ID0gdHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ1N0YXJ0LCB0b2tlbi50ZXh0KVxuICAgIH1cblxuICAgIHdoaWxlIChhbGxUb2tlbnMubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0b2tlbiA9IGFsbFRva2Vucy5zaGlmdCgpXG4gICAgICBpZiAodG9rZW4udHlwZSA9PT0gXCJhcmd1bWVudFwiKSB7XG4gICAgICAgIGNvbnN0IG5leHRUb2tlbiA9IGFsbFRva2Vucy5zaGlmdCgpXG4gICAgICAgIGNvbnN0IHNlcGFyYXRvciA9IG5leHRUb2tlbiA/IG5leHRUb2tlbi50ZXh0IDogdW5kZWZpbmVkXG4gICAgICAgIGNvbnN0IGFyZ0luZm8gPSB0aGlzLm5ld0FyZ0luZm8oYXJnU3RhcnQsIHRva2VuLnRleHQsIHNlcGFyYXRvcilcblxuICAgICAgICBpZiAoYWxsVG9rZW5zLmxlbmd0aCA9PT0gMCAmJiBhcmdJbmZvcy5sZW5ndGgpIHtcbiAgICAgICAgICBhcmdJbmZvLmFSYW5nZSA9IGFyZ0luZm8uYXJnUmFuZ2UudW5pb24oXy5sYXN0KGFyZ0luZm9zKS5zZXBhcmF0b3JSYW5nZSlcbiAgICAgICAgfVxuXG4gICAgICAgIGFyZ1N0YXJ0ID0gYXJnSW5mby5hUmFuZ2UuZW5kXG4gICAgICAgIGFyZ0luZm9zLnB1c2goYXJnSW5mbylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIm11c3Qgbm90IGhhcHBlblwiKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgZm9yIChjb25zdCB7aW5uZXJSYW5nZSwgYVJhbmdlfSBvZiBhcmdJbmZvcykge1xuICAgICAgaWYgKGlubmVyUmFuZ2UuZW5kLmlzR3JlYXRlclRoYW5PckVxdWFsKHBvaW50KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc0lubmVyKCkgPyBpbm5lclJhbmdlIDogYVJhbmdlXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5Bcmd1bWVudHMucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbmNsYXNzIEN1cnJlbnRMaW5lIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHtyb3d9ID0gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgY29uc3QgcmFuZ2UgPSB0aGlzLmVkaXRvci5idWZmZXJSYW5nZUZvckJ1ZmZlclJvdyhyb3cpXG4gICAgcmV0dXJuIHRoaXMuaXNBKCkgPyByYW5nZSA6IHRyaW1SYW5nZSh0aGlzLmVkaXRvciwgcmFuZ2UpXG4gIH1cbn1cbkN1cnJlbnRMaW5lLnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuXG5jbGFzcyBFbnRpcmUgZXh0ZW5kcyBUZXh0T2JqZWN0IHtcbiAgd2lzZSA9IFwibGluZXdpc2VcIlxuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5idWZmZXIuZ2V0UmFuZ2UoKVxuICB9XG59XG5FbnRpcmUucmVnaXN0ZXIoZmFsc2UsIHRydWUpXG5cbmNsYXNzIEVtcHR5IGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHNlbGVjdE9uY2UgPSB0cnVlXG59XG5FbXB0eS5yZWdpc3RlcihmYWxzZSlcblxuY2xhc3MgTGF0ZXN0Q2hhbmdlIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHN0YXJ0ID0gdGhpcy52aW1TdGF0ZS5tYXJrLmdldChcIltcIilcbiAgICBjb25zdCBlbmQgPSB0aGlzLnZpbVN0YXRlLm1hcmsuZ2V0KFwiXVwiKVxuICAgIGlmIChzdGFydCAmJiBlbmQpIHtcbiAgICAgIHJldHVybiBuZXcgUmFuZ2Uoc3RhcnQsIGVuZClcbiAgICB9XG4gIH1cbn1cbkxhdGVzdENoYW5nZS5yZWdpc3RlcihmYWxzZSwgdHJ1ZSlcblxuY2xhc3MgU2VhcmNoTWF0Y2hGb3J3YXJkIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIGJhY2t3YXJkID0gZmFsc2VcblxuICBmaW5kTWF0Y2goZnJvbVBvaW50LCBwYXR0ZXJuKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ2aXN1YWxcIikge1xuICAgICAgZnJvbVBvaW50ID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKHRoaXMuZWRpdG9yLCBmcm9tUG9pbnQsIFwiZm9yd2FyZFwiKVxuICAgIH1cbiAgICBsZXQgZm91bmRSYW5nZVxuICAgIHRoaXMuc2NhbkZvcndhcmQocGF0dGVybiwge2Zyb206IFtmcm9tUG9pbnQucm93LCAwXX0sICh7cmFuZ2UsIHN0b3B9KSA9PiB7XG4gICAgICBpZiAocmFuZ2UuZW5kLmlzR3JlYXRlclRoYW4oZnJvbVBvaW50KSkge1xuICAgICAgICBmb3VuZFJhbmdlID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4ge3JhbmdlOiBmb3VuZFJhbmdlLCB3aGljaElzSGVhZDogXCJlbmRcIn1cbiAgfVxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIGNvbnN0IHBhdHRlcm4gPSB0aGlzLmdsb2JhbFN0YXRlLmdldChcImxhc3RTZWFyY2hQYXR0ZXJuXCIpXG4gICAgaWYgKCFwYXR0ZXJuKSByZXR1cm5cblxuICAgIGNvbnN0IGZyb21Qb2ludCA9IHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIGNvbnN0IHtyYW5nZSwgd2hpY2hJc0hlYWR9ID0gdGhpcy5maW5kTWF0Y2goZnJvbVBvaW50LCBwYXR0ZXJuKVxuICAgIGlmIChyYW5nZSkge1xuICAgICAgcmV0dXJuIHRoaXMudW5pb25SYW5nZUFuZERldGVybWluZVJldmVyc2VkU3RhdGUoc2VsZWN0aW9uLCByYW5nZSwgd2hpY2hJc0hlYWQpXG4gICAgfVxuICB9XG5cbiAgdW5pb25SYW5nZUFuZERldGVybWluZVJldmVyc2VkU3RhdGUoc2VsZWN0aW9uLCByYW5nZSwgd2hpY2hJc0hlYWQpIHtcbiAgICBpZiAoc2VsZWN0aW9uLmlzRW1wdHkoKSkgcmV0dXJuIHJhbmdlXG5cbiAgICBsZXQgaGVhZCA9IHJhbmdlW3doaWNoSXNIZWFkXVxuICAgIGNvbnN0IHRhaWwgPSBzZWxlY3Rpb24uZ2V0VGFpbEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIGlmICh0aGlzLmJhY2t3YXJkKSB7XG4gICAgICBpZiAodGFpbC5pc0xlc3NUaGFuKGhlYWQpKSBoZWFkID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKHRoaXMuZWRpdG9yLCBoZWFkLCBcImZvcndhcmRcIilcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGhlYWQuaXNMZXNzVGhhbih0YWlsKSkgaGVhZCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcCh0aGlzLmVkaXRvciwgaGVhZCwgXCJiYWNrd2FyZFwiKVxuICAgIH1cblxuICAgIHRoaXMucmV2ZXJzZWQgPSBoZWFkLmlzTGVzc1RoYW4odGFpbClcbiAgICByZXR1cm4gbmV3IFJhbmdlKHRhaWwsIGhlYWQpLnVuaW9uKHRoaXMuc3dyYXAoc2VsZWN0aW9uKS5nZXRUYWlsQnVmZmVyUmFuZ2UoKSlcbiAgfVxuXG4gIHNlbGVjdFRleHRPYmplY3Qoc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcmFuZ2UgPSB0aGlzLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgICBpZiAocmFuZ2UpIHtcbiAgICAgIHRoaXMuc3dyYXAoc2VsZWN0aW9uKS5zZXRCdWZmZXJSYW5nZShyYW5nZSwge3JldmVyc2VkOiB0aGlzLnJldmVyc2VkICE9IG51bGwgPyB0aGlzLnJldmVyc2VkIDogdGhpcy5iYWNrd2FyZH0pXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxufVxuU2VhcmNoTWF0Y2hGb3J3YXJkLnJlZ2lzdGVyKClcblxuY2xhc3MgU2VhcmNoTWF0Y2hCYWNrd2FyZCBleHRlbmRzIFNlYXJjaE1hdGNoRm9yd2FyZCB7XG4gIGJhY2t3YXJkID0gdHJ1ZVxuXG4gIGZpbmRNYXRjaChmcm9tUG9pbnQsIHBhdHRlcm4pIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcInZpc3VhbFwiKSB7XG4gICAgICBmcm9tUG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAodGhpcy5lZGl0b3IsIGZyb21Qb2ludCwgXCJiYWNrd2FyZFwiKVxuICAgIH1cbiAgICBsZXQgZm91bmRSYW5nZVxuICAgIHRoaXMuc2NhbkJhY2t3YXJkKHBhdHRlcm4sIHtmcm9tOiBbZnJvbVBvaW50LnJvdywgSW5maW5pdHldfSwgKHtyYW5nZSwgc3RvcH0pID0+IHtcbiAgICAgIGlmIChyYW5nZS5zdGFydC5pc0xlc3NUaGFuKGZyb21Qb2ludCkpIHtcbiAgICAgICAgZm91bmRSYW5nZSA9IHJhbmdlXG4gICAgICAgIHN0b3AoKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIHtyYW5nZTogZm91bmRSYW5nZSwgd2hpY2hJc0hlYWQ6IFwic3RhcnRcIn1cbiAgfVxufVxuU2VhcmNoTWF0Y2hCYWNrd2FyZC5yZWdpc3RlcigpXG5cbi8vIFtMaW1pdGF0aW9uOiB3b24ndCBmaXhdOiBTZWxlY3RlZCByYW5nZSBpcyBub3Qgc3VibW9kZSBhd2FyZS4gYWx3YXlzIGNoYXJhY3Rlcndpc2UuXG4vLyBTbyBldmVuIGlmIG9yaWdpbmFsIHNlbGVjdGlvbiB3YXMgdkwgb3IgdkIsIHNlbGVjdGVkIHJhbmdlIGJ5IHRoaXMgdGV4dC1vYmplY3Rcbi8vIGlzIGFsd2F5cyB2QyByYW5nZS5cbmNsYXNzIFByZXZpb3VzU2VsZWN0aW9uIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgc2VsZWN0VGV4dE9iamVjdChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCB7cHJvcGVydGllcywgc3VibW9kZX0gPSB0aGlzLnZpbVN0YXRlLnByZXZpb3VzU2VsZWN0aW9uXG4gICAgaWYgKHByb3BlcnRpZXMgJiYgc3VibW9kZSkge1xuICAgICAgdGhpcy53aXNlID0gc3VibW9kZVxuICAgICAgdGhpcy5zd3JhcCh0aGlzLmVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpLnNlbGVjdEJ5UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbn1cblByZXZpb3VzU2VsZWN0aW9uLnJlZ2lzdGVyKClcblxuY2xhc3MgUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIFRleHRPYmplY3Qge1xuICB3aXNlID0gbnVsbFxuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3Qoc2VsZWN0aW9uKSB7XG4gICAgaWYgKHRoaXMudmltU3RhdGUuaGFzUGVyc2lzdGVudFNlbGVjdGlvbnMoKSkge1xuICAgICAgdGhpcy5wZXJzaXN0ZW50U2VsZWN0aW9uLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKClcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG59XG5QZXJzaXN0ZW50U2VsZWN0aW9uLnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuXG4vLyBVc2VkIG9ubHkgYnkgUmVwbGFjZVdpdGhSZWdpc3RlciBhbmQgUHV0QmVmb3JlIGFuZCBpdHMnIGNoaWxkcmVuLlxuY2xhc3MgTGFzdFBhc3RlZFJhbmdlIGV4dGVuZHMgVGV4dE9iamVjdCB7XG4gIHdpc2UgPSBudWxsXG4gIHNlbGVjdE9uY2UgPSB0cnVlXG5cbiAgc2VsZWN0VGV4dE9iamVjdChzZWxlY3Rpb24pIHtcbiAgICBmb3IgKHNlbGVjdGlvbiBvZiB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb25zKCkpIHtcbiAgICAgIGNvbnN0IHJhbmdlID0gdGhpcy52aW1TdGF0ZS5zZXF1ZW50aWFsUGFzdGVNYW5hZ2VyLmdldFBhc3RlZFJhbmdlRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShyYW5nZSlcbiAgICB9XG4gICAgcmV0dXJuIHRydWVcbiAgfVxufVxuTGFzdFBhc3RlZFJhbmdlLnJlZ2lzdGVyKGZhbHNlKVxuXG5jbGFzcyBWaXNpYmxlQXJlYSBleHRlbmRzIFRleHRPYmplY3Qge1xuICBzZWxlY3RPbmNlID0gdHJ1ZVxuXG4gIGdldFJhbmdlKHNlbGVjdGlvbikge1xuICAgIC8vIFtCVUc/XSBOZWVkIHRyYW5zbGF0ZSB0byBzaGlsbmsgdG9wIGFuZCBib3R0b20gdG8gZml0IGFjdHVhbCByb3cuXG4gICAgLy8gVGhlIHJlYXNvbiBJIG5lZWQgLTIgYXQgYm90dG9tIGlzIGJlY2F1c2Ugb2Ygc3RhdHVzIGJhcj9cbiAgICBjb25zdCByYW5nZSA9IGdldFZpc2libGVCdWZmZXJSYW5nZSh0aGlzLmVkaXRvcilcbiAgICByZXR1cm4gcmFuZ2UuZ2V0Um93cygpID4gdGhpcy5lZGl0b3IuZ2V0Um93c1BlclBhZ2UoKSA/IHJhbmdlLnRyYW5zbGF0ZShbKzEsIDBdLCBbLTMsIDBdKSA6IHJhbmdlXG4gIH1cbn1cblZpc2libGVBcmVhLnJlZ2lzdGVyKGZhbHNlLCB0cnVlKVxuIl19