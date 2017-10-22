"use babel";

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require("underscore-plus");

var _require = require("atom");

var Point = _require.Point;
var Range = _require.Range;

var _require2 = require("./utils");

var moveCursorLeft = _require2.moveCursorLeft;
var moveCursorRight = _require2.moveCursorRight;
var moveCursorUpScreen = _require2.moveCursorUpScreen;
var moveCursorDownScreen = _require2.moveCursorDownScreen;
var pointIsAtVimEndOfFile = _require2.pointIsAtVimEndOfFile;
var getFirstVisibleScreenRow = _require2.getFirstVisibleScreenRow;
var getLastVisibleScreenRow = _require2.getLastVisibleScreenRow;
var getValidVimScreenRow = _require2.getValidVimScreenRow;
var getValidVimBufferRow = _require2.getValidVimBufferRow;
var moveCursorToFirstCharacterAtRow = _require2.moveCursorToFirstCharacterAtRow;
var sortRanges = _require2.sortRanges;
var pointIsOnWhiteSpace = _require2.pointIsOnWhiteSpace;
var moveCursorToNextNonWhitespace = _require2.moveCursorToNextNonWhitespace;
var isEmptyRow = _require2.isEmptyRow;
var getCodeFoldRowRanges = _require2.getCodeFoldRowRanges;
var getLargestFoldRangeContainsBufferRow = _require2.getLargestFoldRangeContainsBufferRow;
var isIncludeFunctionScopeForRow = _require2.isIncludeFunctionScopeForRow;
var detectScopeStartPositionForScope = _require2.detectScopeStartPositionForScope;
var getBufferRows = _require2.getBufferRows;
var getTextInScreenRange = _require2.getTextInScreenRange;
var setBufferRow = _require2.setBufferRow;
var setBufferColumn = _require2.setBufferColumn;
var limitNumber = _require2.limitNumber;
var getIndex = _require2.getIndex;
var smartScrollToBufferPosition = _require2.smartScrollToBufferPosition;
var pointIsAtEndOfLineAtNonEmptyRow = _require2.pointIsAtEndOfLineAtNonEmptyRow;
var getEndOfLineForBufferRow = _require2.getEndOfLineForBufferRow;
var findRangeInBufferRow = _require2.findRangeInBufferRow;
var saveEditorState = _require2.saveEditorState;
var getList = _require2.getList;
var getScreenPositionForScreenRow = _require2.getScreenPositionForScreenRow;

var Base = require("./base");

var Motion = (function (_Base) {
  _inherits(Motion, _Base);

  function Motion() {
    _classCallCheck(this, Motion);

    _get(Object.getPrototypeOf(Motion.prototype), "constructor", this).apply(this, arguments);

    this.inclusive = false;
    this.wise = "characterwise";
    this.jump = false;
    this.verticalMotion = false;
    this.moveSucceeded = null;
    this.moveSuccessOnLinewise = false;
    this.selectSucceeded = false;
  }

  _createClass(Motion, [{
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
      if (wise === "characterwise") {
        this.inclusive = this.wise === "linewise" ? false : !this.inclusive;
      }
      this.wise = wise;
    }
  }, {
    key: "resetState",
    value: function resetState() {
      this.selectSucceeded = false;
    }
  }, {
    key: "setBufferPositionSafely",
    value: function setBufferPositionSafely(cursor, point) {
      if (point) cursor.setBufferPosition(point);
    }
  }, {
    key: "setScreenPositionSafely",
    value: function setScreenPositionSafely(cursor, point) {
      if (point) cursor.setScreenPosition(point);
    }
  }, {
    key: "moveWithSaveJump",
    value: function moveWithSaveJump(cursor) {
      var cursorPosition = undefined;
      if (cursor.isLastCursor() && this.jump) {
        cursorPosition = cursor.getBufferPosition();
      }

      this.moveCursor(cursor);

      if (cursorPosition && !cursorPosition.isEqual(cursor.getBufferPosition())) {
        this.vimState.mark.set("`", cursorPosition);
        this.vimState.mark.set("'", cursorPosition);
      }
    }
  }, {
    key: "execute",
    value: function execute() {
      if (this.operator) {
        this.select();
      } else {
        for (var cursor of this.editor.getCursors()) {
          this.moveWithSaveJump(cursor);
        }
      }
      this.editor.mergeCursors();
      this.editor.mergeIntersectingSelections();
    }

    // NOTE: Modify selection by modtion, selection is already "normalized" before this function is called.
  }, {
    key: "select",
    value: function select() {
      var _this = this;

      // need to care was visual for `.` repeated.
      var isOrWasVisual = this.operator && this.operator["instanceof"]("SelectBase") || this.is("CurrentSelection");

      var _loop = function (selection) {
        selection.modifySelection(function () {
          return _this.moveWithSaveJump(selection.cursor);
        });

        var selectSucceeded = _this.moveSucceeded != null ? _this.moveSucceeded : !selection.isEmpty() || _this.isLinewise() && _this.moveSuccessOnLinewise;
        if (!_this.selectSucceeded) _this.selectSucceeded = selectSucceeded;

        if (isOrWasVisual || selectSucceeded && (_this.inclusive || _this.isLinewise())) {
          var $selection = _this.swrap(selection);
          $selection.saveProperties(true); // save property of "already-normalized-selection"
          $selection.applyWise(_this.wise);
        }
      };

      for (var selection of this.editor.getSelections()) {
        _loop(selection);
      }

      if (this.wise === "blockwise") {
        this.vimState.getLastBlockwiseSelection().autoscroll();
      }
    }
  }, {
    key: "setCursorBufferRow",
    value: function setCursorBufferRow(cursor, row, options) {
      if (this.verticalMotion && !this.getConfig("stayOnVerticalMotion")) {
        cursor.setBufferPosition(this.getFirstCharacterPositionForBufferRow(row), options);
      } else {
        setBufferRow(cursor, row, options);
      }
    }

    // [NOTE]
    // Since this function checks cursor position change, a cursor position MUST be
    // updated IN callback(=fn)
    // Updating point only in callback is wrong-use of this funciton,
    // since it stops immediately because of not cursor position change.
  }, {
    key: "moveCursorCountTimes",
    value: function moveCursorCountTimes(cursor, fn) {
      var oldPosition = cursor.getBufferPosition();
      this.countTimes(this.getCount(), function (state) {
        fn(state);
        var newPosition = cursor.getBufferPosition();
        if (newPosition.isEqual(oldPosition)) state.stop();
        oldPosition = newPosition;
      });
    }
  }, {
    key: "isCaseSensitive",
    value: function isCaseSensitive(term) {
      return this.getConfig("useSmartcaseFor" + this.caseSensitivityKind) ? term.search(/[A-Z]/) !== -1 : !this.getConfig("ignoreCaseFor" + this.caseSensitivityKind);
    }
  }], [{
    key: "operationKind",
    value: "motion",
    enumerable: true
  }]);

  return Motion;
})(Base);

Motion.register(false);

// Used as operator's target in visual-mode.

var CurrentSelection = (function (_Motion) {
  _inherits(CurrentSelection, _Motion);

  function CurrentSelection() {
    _classCallCheck(this, CurrentSelection);

    _get(Object.getPrototypeOf(CurrentSelection.prototype), "constructor", this).apply(this, arguments);

    this.selectionExtent = null;
    this.blockwiseSelectionExtent = null;
    this.inclusive = true;
  }

  _createClass(CurrentSelection, [{
    key: "initialize",
    value: function initialize() {
      this.pointInfoByCursor = new Map();
      return _get(Object.getPrototypeOf(CurrentSelection.prototype), "initialize", this).call(this);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      if (this.mode === "visual") {
        this.selectionExtent = this.isBlockwise() ? this.swrap(cursor.selection).getBlockwiseSelectionExtent() : this.editor.getSelectedBufferRange().getExtent();
      } else {
        // `.` repeat case
        cursor.setBufferPosition(cursor.getBufferPosition().translate(this.selectionExtent));
      }
    }
  }, {
    key: "select",
    value: function select() {
      var _this2 = this;

      if (this.mode === "visual") {
        _get(Object.getPrototypeOf(CurrentSelection.prototype), "select", this).call(this);
      } else {
        for (var cursor of this.editor.getCursors()) {
          var pointInfo = this.pointInfoByCursor.get(cursor);
          if (pointInfo) {
            var _cursorPosition = pointInfo.cursorPosition;
            var startOfSelection = pointInfo.startOfSelection;

            if (_cursorPosition.isEqual(cursor.getBufferPosition())) {
              cursor.setBufferPosition(startOfSelection);
            }
          }
        }
        _get(Object.getPrototypeOf(CurrentSelection.prototype), "select", this).call(this);
      }

      // * Purpose of pointInfoByCursor? see #235 for detail.
      // When stayOnTransformString is enabled, cursor pos is not set on start of
      // of selected range.
      // But I want following behavior, so need to preserve position info.
      //  1. `vj>.` -> indent same two rows regardless of current cursor's row.
      //  2. `vj>j.` -> indent two rows from cursor's row.

      var _loop2 = function (cursor) {
        var startOfSelection = cursor.selection.getBufferRange().start;
        _this2.onDidFinishOperation(function () {
          cursorPosition = cursor.getBufferPosition();
          _this2.pointInfoByCursor.set(cursor, { startOfSelection: startOfSelection, cursorPosition: cursorPosition });
        });
      };

      for (var cursor of this.editor.getCursors()) {
        _loop2(cursor);
      }
    }
  }]);

  return CurrentSelection;
})(Motion);

CurrentSelection.register(false);

var MoveLeft = (function (_Motion2) {
  _inherits(MoveLeft, _Motion2);

  function MoveLeft() {
    _classCallCheck(this, MoveLeft);

    _get(Object.getPrototypeOf(MoveLeft.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveLeft, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var allowWrap = this.getConfig("wrapLeftRightMotion");
      this.moveCursorCountTimes(cursor, function () {
        return moveCursorLeft(cursor, { allowWrap: allowWrap });
      });
    }
  }]);

  return MoveLeft;
})(Motion);

MoveLeft.register();

var MoveRight = (function (_Motion3) {
  _inherits(MoveRight, _Motion3);

  function MoveRight() {
    _classCallCheck(this, MoveRight);

    _get(Object.getPrototypeOf(MoveRight.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveRight, [{
    key: "canWrapToNextLine",
    value: function canWrapToNextLine(cursor) {
      if (this.isAsTargetExceptSelectInVisualMode() && !cursor.isAtEndOfLine()) {
        return false;
      } else {
        return this.getConfig("wrapLeftRightMotion");
      }
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this3 = this;

      this.moveCursorCountTimes(cursor, function () {
        var cursorPosition = cursor.getBufferPosition();
        _this3.editor.unfoldBufferRow(cursorPosition.row);
        var allowWrap = _this3.canWrapToNextLine(cursor);
        moveCursorRight(cursor);
        if (cursor.isAtEndOfLine() && allowWrap && !pointIsAtVimEndOfFile(_this3.editor, cursorPosition)) {
          moveCursorRight(cursor, { allowWrap: allowWrap });
        }
      });
    }
  }]);

  return MoveRight;
})(Motion);

MoveRight.register();

var MoveRightBufferColumn = (function (_Motion4) {
  _inherits(MoveRightBufferColumn, _Motion4);

  function MoveRightBufferColumn() {
    _classCallCheck(this, MoveRightBufferColumn);

    _get(Object.getPrototypeOf(MoveRightBufferColumn.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveRightBufferColumn, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      setBufferColumn(cursor, cursor.getBufferColumn() + this.getCount());
    }
  }]);

  return MoveRightBufferColumn;
})(Motion);

MoveRightBufferColumn.register(false);

var MoveUp = (function (_Motion5) {
  _inherits(MoveUp, _Motion5);

  function MoveUp() {
    _classCallCheck(this, MoveUp);

    _get(Object.getPrototypeOf(MoveUp.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.wrap = false;
  }

  _createClass(MoveUp, [{
    key: "getBufferRow",
    value: function getBufferRow(row) {
      var min = 0;
      row = this.wrap && row === min ? this.getVimLastBufferRow() : limitNumber(row - 1, { min: min });
      return this.getFoldStartRowForRow(row);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this4 = this;

      this.moveCursorCountTimes(cursor, function () {
        return setBufferRow(cursor, _this4.getBufferRow(cursor.getBufferRow()));
      });
    }
  }]);

  return MoveUp;
})(Motion);

MoveUp.register();

var MoveUpWrap = (function (_MoveUp) {
  _inherits(MoveUpWrap, _MoveUp);

  function MoveUpWrap() {
    _classCallCheck(this, MoveUpWrap);

    _get(Object.getPrototypeOf(MoveUpWrap.prototype), "constructor", this).apply(this, arguments);

    this.wrap = true;
  }

  return MoveUpWrap;
})(MoveUp);

MoveUpWrap.register();

var MoveDown = (function (_MoveUp2) {
  _inherits(MoveDown, _MoveUp2);

  function MoveDown() {
    _classCallCheck(this, MoveDown);

    _get(Object.getPrototypeOf(MoveDown.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.wrap = false;
  }

  _createClass(MoveDown, [{
    key: "getBufferRow",
    value: function getBufferRow(row) {
      if (this.editor.isFoldedAtBufferRow(row)) {
        row = getLargestFoldRangeContainsBufferRow(this.editor, row).end.row;
      }
      var max = this.getVimLastBufferRow();
      return this.wrap && row >= max ? 0 : limitNumber(row + 1, { max: max });
    }
  }]);

  return MoveDown;
})(MoveUp);

MoveDown.register();

var MoveDownWrap = (function (_MoveDown) {
  _inherits(MoveDownWrap, _MoveDown);

  function MoveDownWrap() {
    _classCallCheck(this, MoveDownWrap);

    _get(Object.getPrototypeOf(MoveDownWrap.prototype), "constructor", this).apply(this, arguments);

    this.wrap = true;
  }

  return MoveDownWrap;
})(MoveDown);

MoveDownWrap.register();

var MoveUpScreen = (function (_Motion6) {
  _inherits(MoveUpScreen, _Motion6);

  function MoveUpScreen() {
    _classCallCheck(this, MoveUpScreen);

    _get(Object.getPrototypeOf(MoveUpScreen.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.direction = "up";
  }

  _createClass(MoveUpScreen, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.moveCursorCountTimes(cursor, function () {
        return moveCursorUpScreen(cursor);
      });
    }
  }]);

  return MoveUpScreen;
})(Motion);

MoveUpScreen.register();

var MoveDownScreen = (function (_MoveUpScreen) {
  _inherits(MoveDownScreen, _MoveUpScreen);

  function MoveDownScreen() {
    _classCallCheck(this, MoveDownScreen);

    _get(Object.getPrototypeOf(MoveDownScreen.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.direction = "down";
  }

  _createClass(MoveDownScreen, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.moveCursorCountTimes(cursor, function () {
        return moveCursorDownScreen(cursor);
      });
    }
  }]);

  return MoveDownScreen;
})(MoveUpScreen);

MoveDownScreen.register();

// Move down/up to Edge
// -------------------------
// See t9md/atom-vim-mode-plus#236
// At least v1.7.0. bufferPosition and screenPosition cannot convert accurately
// when row is folded.

var MoveUpToEdge = (function (_Motion7) {
  _inherits(MoveUpToEdge, _Motion7);

  function MoveUpToEdge() {
    _classCallCheck(this, MoveUpToEdge);

    _get(Object.getPrototypeOf(MoveUpToEdge.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.jump = true;
    this.direction = "up";
  }

  _createClass(MoveUpToEdge, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this5 = this;

      this.moveCursorCountTimes(cursor, function () {
        _this5.setScreenPositionSafely(cursor, _this5.getPoint(cursor.getScreenPosition()));
      });
    }
  }, {
    key: "getPoint",
    value: function getPoint(fromPoint) {
      var column = fromPoint.column;

      for (var row of this.getScanRows(fromPoint)) {
        var point = new Point(row, column);
        if (this.isEdge(point)) return point;
      }
    }
  }, {
    key: "getScanRows",
    value: function getScanRows(_ref) {
      var row = _ref.row;

      return this.direction === "up" ? getList(getValidVimScreenRow(this.editor, row - 1), 0, true) : getList(getValidVimScreenRow(this.editor, row + 1), this.getVimLastScreenRow(), true);
    }
  }, {
    key: "isEdge",
    value: function isEdge(point) {
      if (this.isStoppablePoint(point)) {
        // If one of above/below point was not stoppable, it's Edge!
        var above = point.translate([-1, 0]);
        var below = point.translate([+1, 0]);
        return !this.isStoppablePoint(above) || !this.isStoppablePoint(below);
      } else {
        return false;
      }
    }
  }, {
    key: "isStoppablePoint",
    value: function isStoppablePoint(point) {
      if (this.isNonWhiteSpacePoint(point) || this.isFirstRowOrLastRowAndStoppable(point)) {
        return true;
      } else {
        var leftPoint = point.translate([0, -1]);
        var rightPoint = point.translate([0, +1]);
        return this.isNonWhiteSpacePoint(leftPoint) && this.isNonWhiteSpacePoint(rightPoint);
      }
    }
  }, {
    key: "isNonWhiteSpacePoint",
    value: function isNonWhiteSpacePoint(point) {
      var char = getTextInScreenRange(this.editor, Range.fromPointWithDelta(point, 0, 1));
      return char != null && /\S/.test(char);
    }
  }, {
    key: "isFirstRowOrLastRowAndStoppable",
    value: function isFirstRowOrLastRowAndStoppable(point) {
      // In normal-mode we adjust cursor by moving-left if cursor at EOL of non-blank row.
      // So explicitly guard to not answer it stoppable.
      if (this.isMode("normal") && pointIsAtEndOfLineAtNonEmptyRow(this.editor, point)) {
        return false;
      } else {
        return point.isEqual(this.editor.clipScreenPosition(point)) && (point.row === 0 || point.row === this.getVimLastScreenRow());
      }
    }
  }]);

  return MoveUpToEdge;
})(Motion);

MoveUpToEdge.register();

var MoveDownToEdge = (function (_MoveUpToEdge) {
  _inherits(MoveDownToEdge, _MoveUpToEdge);

  function MoveDownToEdge() {
    _classCallCheck(this, MoveDownToEdge);

    _get(Object.getPrototypeOf(MoveDownToEdge.prototype), "constructor", this).apply(this, arguments);

    this.direction = "down";
  }

  return MoveDownToEdge;
})(MoveUpToEdge);

MoveDownToEdge.register();

// word
// -------------------------

var MoveToNextWord = (function (_Motion8) {
  _inherits(MoveToNextWord, _Motion8);

  function MoveToNextWord() {
    _classCallCheck(this, MoveToNextWord);

    _get(Object.getPrototypeOf(MoveToNextWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = null;
  }

  _createClass(MoveToNextWord, [{
    key: "getPoint",
    value: function getPoint(regex, from) {
      var wordRange = undefined;
      var found = false;

      this.scanForward(regex, { from: from }, function (_ref2) {
        var range = _ref2.range;
        var matchText = _ref2.matchText;
        var stop = _ref2.stop;

        wordRange = range;
        // Ignore 'empty line' matches between '\r' and '\n'
        if (matchText === "" && range.start.column !== 0) return;
        if (range.start.isGreaterThan(from)) {
          found = true;
          stop();
        }
      });

      if (found) {
        var point = wordRange.start;
        return pointIsAtEndOfLineAtNonEmptyRow(this.editor, point) && !point.isEqual(this.getVimEofBufferPosition()) ? point.traverse([1, 0]) : point;
      } else {
        return wordRange ? wordRange.end : from;
      }
    }

    // Special case: "cw" and "cW" are treated like "ce" and "cE" if the cursor is
    // on a non-blank.  This is because "cw" is interpreted as change-word, and a
    // word does not include the following white space.  {Vi: "cw" when on a blank
    // followed by other blanks changes only the first blank; this is probably a
    // bug, because "dw" deletes all the blanks}
    //
    // Another special case: When using the "w" motion in combination with an
    // operator and the last word moved over is at the end of a line, the end of
    // that word becomes the end of the operated text, not the first word in the
    // next line.
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this6 = this;

      var cursorPosition = cursor.getBufferPosition();
      if (pointIsAtVimEndOfFile(this.editor, cursorPosition)) return;

      var wasOnWhiteSpace = pointIsOnWhiteSpace(this.editor, cursorPosition);
      var isAsTargetExceptSelectInVisualMode = this.isAsTargetExceptSelectInVisualMode();

      this.moveCursorCountTimes(cursor, function (_ref3) {
        var isFinal = _ref3.isFinal;

        var cursorPosition = cursor.getBufferPosition();
        if (isEmptyRow(_this6.editor, cursorPosition.row) && isAsTargetExceptSelectInVisualMode) {
          cursor.setBufferPosition(cursorPosition.traverse([1, 0]));
        } else {
          var regex = _this6.wordRegex || cursor.wordRegExp();
          var point = _this6.getPoint(regex, cursorPosition);
          if (isFinal && isAsTargetExceptSelectInVisualMode) {
            if (_this6.operator.is("Change") && !wasOnWhiteSpace) {
              point = cursor.getEndOfCurrentWordBufferPosition({ wordRegex: _this6.wordRegex });
            } else {
              point = Point.min(point, getEndOfLineForBufferRow(_this6.editor, cursorPosition.row));
            }
          }
          cursor.setBufferPosition(point);
        }
      });
    }
  }]);

  return MoveToNextWord;
})(Motion);

MoveToNextWord.register();

// b

var MoveToPreviousWord = (function (_Motion9) {
  _inherits(MoveToPreviousWord, _Motion9);

  function MoveToPreviousWord() {
    _classCallCheck(this, MoveToPreviousWord);

    _get(Object.getPrototypeOf(MoveToPreviousWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = null;
  }

  _createClass(MoveToPreviousWord, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this7 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = cursor.getBeginningOfCurrentWordBufferPosition({ wordRegex: _this7.wordRegex });
        cursor.setBufferPosition(point);
      });
    }
  }]);

  return MoveToPreviousWord;
})(Motion);

MoveToPreviousWord.register();

var MoveToEndOfWord = (function (_Motion10) {
  _inherits(MoveToEndOfWord, _Motion10);

  function MoveToEndOfWord() {
    _classCallCheck(this, MoveToEndOfWord);

    _get(Object.getPrototypeOf(MoveToEndOfWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = null;
    this.inclusive = true;
  }

  _createClass(MoveToEndOfWord, [{
    key: "moveToNextEndOfWord",
    value: function moveToNextEndOfWord(cursor) {
      moveCursorToNextNonWhitespace(cursor);
      var point = cursor.getEndOfCurrentWordBufferPosition({ wordRegex: this.wordRegex }).translate([0, -1]);
      cursor.setBufferPosition(Point.min(point, this.getVimEofBufferPosition()));
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this8 = this;

      this.moveCursorCountTimes(cursor, function () {
        var originalPoint = cursor.getBufferPosition();
        _this8.moveToNextEndOfWord(cursor);
        if (originalPoint.isEqual(cursor.getBufferPosition())) {
          // Retry from right column if cursor was already on EndOfWord
          cursor.moveRight();
          _this8.moveToNextEndOfWord(cursor);
        }
      });
    }
  }]);

  return MoveToEndOfWord;
})(Motion);

MoveToEndOfWord.register();

// [TODO: Improve, accuracy]

var MoveToPreviousEndOfWord = (function (_MoveToPreviousWord) {
  _inherits(MoveToPreviousEndOfWord, _MoveToPreviousWord);

  function MoveToPreviousEndOfWord() {
    _classCallCheck(this, MoveToPreviousEndOfWord);

    _get(Object.getPrototypeOf(MoveToPreviousEndOfWord.prototype), "constructor", this).apply(this, arguments);

    this.inclusive = true;
  }

  _createClass(MoveToPreviousEndOfWord, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var wordRange = cursor.getCurrentWordBufferRange();
      var cursorPosition = cursor.getBufferPosition();

      // if we're in the middle of a word then we need to move to its start
      var times = this.getCount();
      if (cursorPosition.isGreaterThan(wordRange.start) && cursorPosition.isLessThan(wordRange.end)) {
        times += 1;
      }

      for (var i in getList(1, times)) {
        var point = cursor.getBeginningOfCurrentWordBufferPosition({ wordRegex: this.wordRegex });
        cursor.setBufferPosition(point);
      }

      this.moveToNextEndOfWord(cursor);
      if (cursor.getBufferPosition().isGreaterThanOrEqual(cursorPosition)) {
        cursor.setBufferPosition([0, 0]);
      }
    }
  }, {
    key: "moveToNextEndOfWord",
    value: function moveToNextEndOfWord(cursor) {
      var point = cursor.getEndOfCurrentWordBufferPosition({ wordRegex: this.wordRegex }).translate([0, -1]);
      cursor.setBufferPosition(Point.min(point, this.getVimEofBufferPosition()));
    }
  }]);

  return MoveToPreviousEndOfWord;
})(MoveToPreviousWord);

MoveToPreviousEndOfWord.register();

// Whole word
// -------------------------

var MoveToNextWholeWord = (function (_MoveToNextWord) {
  _inherits(MoveToNextWholeWord, _MoveToNextWord);

  function MoveToNextWholeWord() {
    _classCallCheck(this, MoveToNextWholeWord);

    _get(Object.getPrototypeOf(MoveToNextWholeWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /^$|\S+/g;
  }

  return MoveToNextWholeWord;
})(MoveToNextWord);

MoveToNextWholeWord.register();

var MoveToPreviousWholeWord = (function (_MoveToPreviousWord2) {
  _inherits(MoveToPreviousWholeWord, _MoveToPreviousWord2);

  function MoveToPreviousWholeWord() {
    _classCallCheck(this, MoveToPreviousWholeWord);

    _get(Object.getPrototypeOf(MoveToPreviousWholeWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /^$|\S+/g;
  }

  return MoveToPreviousWholeWord;
})(MoveToPreviousWord);

MoveToPreviousWholeWord.register();

var MoveToEndOfWholeWord = (function (_MoveToEndOfWord) {
  _inherits(MoveToEndOfWholeWord, _MoveToEndOfWord);

  function MoveToEndOfWholeWord() {
    _classCallCheck(this, MoveToEndOfWholeWord);

    _get(Object.getPrototypeOf(MoveToEndOfWholeWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /\S+/;
  }

  return MoveToEndOfWholeWord;
})(MoveToEndOfWord);

MoveToEndOfWholeWord.register();

// [TODO: Improve, accuracy]

var MoveToPreviousEndOfWholeWord = (function (_MoveToPreviousEndOfWord) {
  _inherits(MoveToPreviousEndOfWholeWord, _MoveToPreviousEndOfWord);

  function MoveToPreviousEndOfWholeWord() {
    _classCallCheck(this, MoveToPreviousEndOfWholeWord);

    _get(Object.getPrototypeOf(MoveToPreviousEndOfWholeWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /\S+/;
  }

  return MoveToPreviousEndOfWholeWord;
})(MoveToPreviousEndOfWord);

MoveToPreviousEndOfWholeWord.register();

// Alphanumeric word [Experimental]
// -------------------------

var MoveToNextAlphanumericWord = (function (_MoveToNextWord2) {
  _inherits(MoveToNextAlphanumericWord, _MoveToNextWord2);

  function MoveToNextAlphanumericWord() {
    _classCallCheck(this, MoveToNextAlphanumericWord);

    _get(Object.getPrototypeOf(MoveToNextAlphanumericWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /\w+/g;
  }

  return MoveToNextAlphanumericWord;
})(MoveToNextWord);

MoveToNextAlphanumericWord.register();

var MoveToPreviousAlphanumericWord = (function (_MoveToPreviousWord3) {
  _inherits(MoveToPreviousAlphanumericWord, _MoveToPreviousWord3);

  function MoveToPreviousAlphanumericWord() {
    _classCallCheck(this, MoveToPreviousAlphanumericWord);

    _get(Object.getPrototypeOf(MoveToPreviousAlphanumericWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /\w+/;
  }

  return MoveToPreviousAlphanumericWord;
})(MoveToPreviousWord);

MoveToPreviousAlphanumericWord.register();

var MoveToEndOfAlphanumericWord = (function (_MoveToEndOfWord2) {
  _inherits(MoveToEndOfAlphanumericWord, _MoveToEndOfWord2);

  function MoveToEndOfAlphanumericWord() {
    _classCallCheck(this, MoveToEndOfAlphanumericWord);

    _get(Object.getPrototypeOf(MoveToEndOfAlphanumericWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /\w+/;
  }

  return MoveToEndOfAlphanumericWord;
})(MoveToEndOfWord);

MoveToEndOfAlphanumericWord.register();

// Alphanumeric word [Experimental]
// -------------------------

var MoveToNextSmartWord = (function (_MoveToNextWord3) {
  _inherits(MoveToNextSmartWord, _MoveToNextWord3);

  function MoveToNextSmartWord() {
    _classCallCheck(this, MoveToNextSmartWord);

    _get(Object.getPrototypeOf(MoveToNextSmartWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /[\w-]+/g;
  }

  return MoveToNextSmartWord;
})(MoveToNextWord);

MoveToNextSmartWord.register();

var MoveToPreviousSmartWord = (function (_MoveToPreviousWord4) {
  _inherits(MoveToPreviousSmartWord, _MoveToPreviousWord4);

  function MoveToPreviousSmartWord() {
    _classCallCheck(this, MoveToPreviousSmartWord);

    _get(Object.getPrototypeOf(MoveToPreviousSmartWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /[\w-]+/;
  }

  return MoveToPreviousSmartWord;
})(MoveToPreviousWord);

MoveToPreviousSmartWord.register();

var MoveToEndOfSmartWord = (function (_MoveToEndOfWord3) {
  _inherits(MoveToEndOfSmartWord, _MoveToEndOfWord3);

  function MoveToEndOfSmartWord() {
    _classCallCheck(this, MoveToEndOfSmartWord);

    _get(Object.getPrototypeOf(MoveToEndOfSmartWord.prototype), "constructor", this).apply(this, arguments);

    this.wordRegex = /[\w-]+/;
  }

  return MoveToEndOfSmartWord;
})(MoveToEndOfWord);

MoveToEndOfSmartWord.register();

// Subword
// -------------------------

var MoveToNextSubword = (function (_MoveToNextWord4) {
  _inherits(MoveToNextSubword, _MoveToNextWord4);

  function MoveToNextSubword() {
    _classCallCheck(this, MoveToNextSubword);

    _get(Object.getPrototypeOf(MoveToNextSubword.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToNextSubword, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.wordRegex = cursor.subwordRegExp();
      _get(Object.getPrototypeOf(MoveToNextSubword.prototype), "moveCursor", this).call(this, cursor);
    }
  }]);

  return MoveToNextSubword;
})(MoveToNextWord);

MoveToNextSubword.register();

var MoveToPreviousSubword = (function (_MoveToPreviousWord5) {
  _inherits(MoveToPreviousSubword, _MoveToPreviousWord5);

  function MoveToPreviousSubword() {
    _classCallCheck(this, MoveToPreviousSubword);

    _get(Object.getPrototypeOf(MoveToPreviousSubword.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToPreviousSubword, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.wordRegex = cursor.subwordRegExp();
      _get(Object.getPrototypeOf(MoveToPreviousSubword.prototype), "moveCursor", this).call(this, cursor);
    }
  }]);

  return MoveToPreviousSubword;
})(MoveToPreviousWord);

MoveToPreviousSubword.register();

var MoveToEndOfSubword = (function (_MoveToEndOfWord4) {
  _inherits(MoveToEndOfSubword, _MoveToEndOfWord4);

  function MoveToEndOfSubword() {
    _classCallCheck(this, MoveToEndOfSubword);

    _get(Object.getPrototypeOf(MoveToEndOfSubword.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToEndOfSubword, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.wordRegex = cursor.subwordRegExp();
      _get(Object.getPrototypeOf(MoveToEndOfSubword.prototype), "moveCursor", this).call(this, cursor);
    }
  }]);

  return MoveToEndOfSubword;
})(MoveToEndOfWord);

MoveToEndOfSubword.register();

// Sentence
// -------------------------
// Sentence is defined as below
//  - end with ['.', '!', '?']
//  - optionally followed by [')', ']', '"', "'"]
//  - followed by ['$', ' ', '\t']
//  - paragraph boundary is also sentence boundary
//  - section boundary is also sentence boundary(ignore)

var MoveToNextSentence = (function (_Motion11) {
  _inherits(MoveToNextSentence, _Motion11);

  function MoveToNextSentence() {
    _classCallCheck(this, MoveToNextSentence);

    _get(Object.getPrototypeOf(MoveToNextSentence.prototype), "constructor", this).apply(this, arguments);

    this.jump = true;
    this.sentenceRegex = new RegExp("(?:[\\.!\\?][\\)\\]\"']*\\s+)|(\\n|\\r\\n)", "g");
    this.direction = "next";
  }

  _createClass(MoveToNextSentence, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this9 = this;

      this.moveCursorCountTimes(cursor, function () {
        _this9.setBufferPositionSafely(cursor, _this9.getPoint(cursor.getBufferPosition()));
      });
    }
  }, {
    key: "getPoint",
    value: function getPoint(fromPoint) {
      if (this.direction === "next") {
        return this.getNextStartOfSentence(fromPoint);
      } else if (this.direction === "previous") {
        return this.getPreviousStartOfSentence(fromPoint);
      }
    }
  }, {
    key: "isBlankRow",
    value: function isBlankRow(row) {
      return this.editor.isBufferRowBlank(row);
    }
  }, {
    key: "getNextStartOfSentence",
    value: function getNextStartOfSentence(from) {
      var _this10 = this;

      var foundPoint = undefined;
      this.scanForward(this.sentenceRegex, { from: from }, function (_ref4) {
        var range = _ref4.range;
        var matchText = _ref4.matchText;
        var match = _ref4.match;
        var stop = _ref4.stop;

        if (match[1] != null) {
          var _Array$from = Array.from([range.start.row, range.end.row]);

          var _Array$from2 = _slicedToArray(_Array$from, 2);

          var startRow = _Array$from2[0];
          var endRow = _Array$from2[1];

          if (_this10.skipBlankRow && _this10.isBlankRow(endRow)) return;
          if (_this10.isBlankRow(startRow) !== _this10.isBlankRow(endRow)) {
            foundPoint = _this10.getFirstCharacterPositionForBufferRow(endRow);
          }
        } else {
          foundPoint = range.end;
        }
        if (foundPoint) stop();
      });
      return foundPoint || this.getVimEofBufferPosition();
    }
  }, {
    key: "getPreviousStartOfSentence",
    value: function getPreviousStartOfSentence(from) {
      var _this11 = this;

      var foundPoint = undefined;
      this.scanBackward(this.sentenceRegex, { from: from }, function (_ref5) {
        var range = _ref5.range;
        var match = _ref5.match;
        var stop = _ref5.stop;
        var matchText = _ref5.matchText;

        if (match[1] != null) {
          var _Array$from3 = Array.from([range.start.row, range.end.row]);

          var _Array$from32 = _slicedToArray(_Array$from3, 2);

          var startRow = _Array$from32[0];
          var endRow = _Array$from32[1];

          if (!_this11.isBlankRow(endRow) && _this11.isBlankRow(startRow)) {
            var point = _this11.getFirstCharacterPositionForBufferRow(endRow);
            if (point.isLessThan(from)) {
              foundPoint = point;
            } else {
              if (_this11.skipBlankRow) return;
              foundPoint = _this11.getFirstCharacterPositionForBufferRow(startRow);
            }
          }
        } else {
          if (range.end.isLessThan(from)) foundPoint = range.end;
        }
        if (foundPoint) stop();
      });
      return foundPoint || [0, 0];
    }
  }]);

  return MoveToNextSentence;
})(Motion);

MoveToNextSentence.register();

var MoveToPreviousSentence = (function (_MoveToNextSentence) {
  _inherits(MoveToPreviousSentence, _MoveToNextSentence);

  function MoveToPreviousSentence() {
    _classCallCheck(this, MoveToPreviousSentence);

    _get(Object.getPrototypeOf(MoveToPreviousSentence.prototype), "constructor", this).apply(this, arguments);

    this.direction = "previous";
  }

  return MoveToPreviousSentence;
})(MoveToNextSentence);

MoveToPreviousSentence.register();

var MoveToNextSentenceSkipBlankRow = (function (_MoveToNextSentence2) {
  _inherits(MoveToNextSentenceSkipBlankRow, _MoveToNextSentence2);

  function MoveToNextSentenceSkipBlankRow() {
    _classCallCheck(this, MoveToNextSentenceSkipBlankRow);

    _get(Object.getPrototypeOf(MoveToNextSentenceSkipBlankRow.prototype), "constructor", this).apply(this, arguments);

    this.skipBlankRow = true;
  }

  return MoveToNextSentenceSkipBlankRow;
})(MoveToNextSentence);

MoveToNextSentenceSkipBlankRow.register();

var MoveToPreviousSentenceSkipBlankRow = (function (_MoveToPreviousSentence) {
  _inherits(MoveToPreviousSentenceSkipBlankRow, _MoveToPreviousSentence);

  function MoveToPreviousSentenceSkipBlankRow() {
    _classCallCheck(this, MoveToPreviousSentenceSkipBlankRow);

    _get(Object.getPrototypeOf(MoveToPreviousSentenceSkipBlankRow.prototype), "constructor", this).apply(this, arguments);

    this.skipBlankRow = true;
  }

  return MoveToPreviousSentenceSkipBlankRow;
})(MoveToPreviousSentence);

MoveToPreviousSentenceSkipBlankRow.register();

// Paragraph
// -------------------------

var MoveToNextParagraph = (function (_Motion12) {
  _inherits(MoveToNextParagraph, _Motion12);

  function MoveToNextParagraph() {
    _classCallCheck(this, MoveToNextParagraph);

    _get(Object.getPrototypeOf(MoveToNextParagraph.prototype), "constructor", this).apply(this, arguments);

    this.jump = true;
    this.direction = "next";
  }

  _createClass(MoveToNextParagraph, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this12 = this;

      this.moveCursorCountTimes(cursor, function () {
        _this12.setBufferPositionSafely(cursor, _this12.getPoint(cursor.getBufferPosition()));
      });
    }
  }, {
    key: "getPoint",
    value: function getPoint(fromPoint) {
      var startRow = fromPoint.row;
      var wasAtNonBlankRow = !this.editor.isBufferRowBlank(startRow);
      for (var row of getBufferRows(this.editor, { startRow: startRow, direction: this.direction })) {
        if (this.editor.isBufferRowBlank(row)) {
          if (wasAtNonBlankRow) return new Point(row, 0);
        } else {
          wasAtNonBlankRow = true;
        }
      }

      // fallback
      return this.direction === "previous" ? new Point(0, 0) : this.getVimEofBufferPosition();
    }
  }]);

  return MoveToNextParagraph;
})(Motion);

MoveToNextParagraph.register();

var MoveToPreviousParagraph = (function (_MoveToNextParagraph) {
  _inherits(MoveToPreviousParagraph, _MoveToNextParagraph);

  function MoveToPreviousParagraph() {
    _classCallCheck(this, MoveToPreviousParagraph);

    _get(Object.getPrototypeOf(MoveToPreviousParagraph.prototype), "constructor", this).apply(this, arguments);

    this.direction = "previous";
  }

  return MoveToPreviousParagraph;
})(MoveToNextParagraph);

MoveToPreviousParagraph.register();

// -------------------------
// keymap: 0

var MoveToBeginningOfLine = (function (_Motion13) {
  _inherits(MoveToBeginningOfLine, _Motion13);

  function MoveToBeginningOfLine() {
    _classCallCheck(this, MoveToBeginningOfLine);

    _get(Object.getPrototypeOf(MoveToBeginningOfLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToBeginningOfLine, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      setBufferColumn(cursor, 0);
    }
  }]);

  return MoveToBeginningOfLine;
})(Motion);

MoveToBeginningOfLine.register();

var MoveToColumn = (function (_Motion14) {
  _inherits(MoveToColumn, _Motion14);

  function MoveToColumn() {
    _classCallCheck(this, MoveToColumn);

    _get(Object.getPrototypeOf(MoveToColumn.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToColumn, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      setBufferColumn(cursor, this.getCount(-1));
    }
  }]);

  return MoveToColumn;
})(Motion);

MoveToColumn.register();

var MoveToLastCharacterOfLine = (function (_Motion15) {
  _inherits(MoveToLastCharacterOfLine, _Motion15);

  function MoveToLastCharacterOfLine() {
    _classCallCheck(this, MoveToLastCharacterOfLine);

    _get(Object.getPrototypeOf(MoveToLastCharacterOfLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToLastCharacterOfLine, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var row = getValidVimBufferRow(this.editor, cursor.getBufferRow() + this.getCount(-1));
      cursor.setBufferPosition([row, Infinity]);
      cursor.goalColumn = Infinity;
    }
  }]);

  return MoveToLastCharacterOfLine;
})(Motion);

MoveToLastCharacterOfLine.register();

var MoveToLastNonblankCharacterOfLineAndDown = (function (_Motion16) {
  _inherits(MoveToLastNonblankCharacterOfLineAndDown, _Motion16);

  function MoveToLastNonblankCharacterOfLineAndDown() {
    _classCallCheck(this, MoveToLastNonblankCharacterOfLineAndDown);

    _get(Object.getPrototypeOf(MoveToLastNonblankCharacterOfLineAndDown.prototype), "constructor", this).apply(this, arguments);

    this.inclusive = true;
  }

  _createClass(MoveToLastNonblankCharacterOfLineAndDown, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      cursor.setBufferPosition(this.getPoint(cursor.getBufferPosition()));
    }
  }, {
    key: "getPoint",
    value: function getPoint(_ref6) {
      var row = _ref6.row;

      row = limitNumber(row + this.getCount(-1), { max: this.getVimLastBufferRow() });
      var range = findRangeInBufferRow(this.editor, /\S|^/, row, { direction: "backward" });
      return range ? range.start : new Point(row, 0);
    }
  }]);

  return MoveToLastNonblankCharacterOfLineAndDown;
})(Motion);

MoveToLastNonblankCharacterOfLineAndDown.register();

// MoveToFirstCharacterOfLine faimily
// ------------------------------------
// ^

var MoveToFirstCharacterOfLine = (function (_Motion17) {
  _inherits(MoveToFirstCharacterOfLine, _Motion17);

  function MoveToFirstCharacterOfLine() {
    _classCallCheck(this, MoveToFirstCharacterOfLine);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToFirstCharacterOfLine, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var point = this.getFirstCharacterPositionForBufferRow(cursor.getBufferRow());
      this.setBufferPositionSafely(cursor, point);
    }
  }]);

  return MoveToFirstCharacterOfLine;
})(Motion);

MoveToFirstCharacterOfLine.register();

var MoveToFirstCharacterOfLineUp = (function (_MoveToFirstCharacterOfLine) {
  _inherits(MoveToFirstCharacterOfLineUp, _MoveToFirstCharacterOfLine);

  function MoveToFirstCharacterOfLineUp() {
    _classCallCheck(this, MoveToFirstCharacterOfLineUp);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineUp.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
  }

  _createClass(MoveToFirstCharacterOfLineUp, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.moveCursorCountTimes(cursor, function () {
        var point = cursor.getBufferPosition();
        if (point.row > 0) {
          cursor.setBufferPosition(point.translate([-1, 0]));
        }
      });
      _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineUp.prototype), "moveCursor", this).call(this, cursor);
    }
  }]);

  return MoveToFirstCharacterOfLineUp;
})(MoveToFirstCharacterOfLine);

MoveToFirstCharacterOfLineUp.register();

var MoveToFirstCharacterOfLineDown = (function (_MoveToFirstCharacterOfLine2) {
  _inherits(MoveToFirstCharacterOfLineDown, _MoveToFirstCharacterOfLine2);

  function MoveToFirstCharacterOfLineDown() {
    _classCallCheck(this, MoveToFirstCharacterOfLineDown);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineDown.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
  }

  _createClass(MoveToFirstCharacterOfLineDown, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this13 = this;

      this.moveCursorCountTimes(cursor, function () {
        var point = cursor.getBufferPosition();
        if (point.row < _this13.getVimLastBufferRow()) {
          cursor.setBufferPosition(point.translate([+1, 0]));
        }
      });
      _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineDown.prototype), "moveCursor", this).call(this, cursor);
    }
  }]);

  return MoveToFirstCharacterOfLineDown;
})(MoveToFirstCharacterOfLine);

MoveToFirstCharacterOfLineDown.register();

var MoveToFirstCharacterOfLineAndDown = (function (_MoveToFirstCharacterOfLineDown) {
  _inherits(MoveToFirstCharacterOfLineAndDown, _MoveToFirstCharacterOfLineDown);

  function MoveToFirstCharacterOfLineAndDown() {
    _classCallCheck(this, MoveToFirstCharacterOfLineAndDown);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineAndDown.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToFirstCharacterOfLineAndDown, [{
    key: "getCount",
    value: function getCount() {
      return _get(Object.getPrototypeOf(MoveToFirstCharacterOfLineAndDown.prototype), "getCount", this).call(this, -1);
    }
  }]);

  return MoveToFirstCharacterOfLineAndDown;
})(MoveToFirstCharacterOfLineDown);

MoveToFirstCharacterOfLineAndDown.register();

// keymap: g g

var MoveToFirstLine = (function (_Motion18) {
  _inherits(MoveToFirstLine, _Motion18);

  function MoveToFirstLine() {
    _classCallCheck(this, MoveToFirstLine);

    _get(Object.getPrototypeOf(MoveToFirstLine.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.jump = true;
    this.verticalMotion = true;
    this.moveSuccessOnLinewise = true;
  }

  _createClass(MoveToFirstLine, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.setCursorBufferRow(cursor, getValidVimBufferRow(this.editor, this.getRow()));
      cursor.autoscroll({ center: true });
    }
  }, {
    key: "getRow",
    value: function getRow() {
      return this.getCount(-1);
    }
  }]);

  return MoveToFirstLine;
})(Motion);

MoveToFirstLine.register();

var MoveToScreenColumn = (function (_Motion19) {
  _inherits(MoveToScreenColumn, _Motion19);

  function MoveToScreenColumn() {
    _classCallCheck(this, MoveToScreenColumn);

    _get(Object.getPrototypeOf(MoveToScreenColumn.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToScreenColumn, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var allowOffScreenPosition = this.getConfig("allowMoveToOffScreenColumnOnScreenLineMotion");
      var point = getScreenPositionForScreenRow(this.editor, cursor.getScreenRow(), this.which, {
        allowOffScreenPosition: allowOffScreenPosition
      });
      this.setScreenPositionSafely(cursor, point);
    }
  }]);

  return MoveToScreenColumn;
})(Motion);

MoveToScreenColumn.register(false);

// keymap: g 0

var MoveToBeginningOfScreenLine = (function (_MoveToScreenColumn) {
  _inherits(MoveToBeginningOfScreenLine, _MoveToScreenColumn);

  function MoveToBeginningOfScreenLine() {
    _classCallCheck(this, MoveToBeginningOfScreenLine);

    _get(Object.getPrototypeOf(MoveToBeginningOfScreenLine.prototype), "constructor", this).apply(this, arguments);

    this.which = "beginning";
  }

  return MoveToBeginningOfScreenLine;
})(MoveToScreenColumn);

MoveToBeginningOfScreenLine.register();

// g ^: `move-to-first-character-of-screen-line`

var MoveToFirstCharacterOfScreenLine = (function (_MoveToScreenColumn2) {
  _inherits(MoveToFirstCharacterOfScreenLine, _MoveToScreenColumn2);

  function MoveToFirstCharacterOfScreenLine() {
    _classCallCheck(this, MoveToFirstCharacterOfScreenLine);

    _get(Object.getPrototypeOf(MoveToFirstCharacterOfScreenLine.prototype), "constructor", this).apply(this, arguments);

    this.which = "first-character";
  }

  return MoveToFirstCharacterOfScreenLine;
})(MoveToScreenColumn);

MoveToFirstCharacterOfScreenLine.register();

// keymap: g $

var MoveToLastCharacterOfScreenLine = (function (_MoveToScreenColumn3) {
  _inherits(MoveToLastCharacterOfScreenLine, _MoveToScreenColumn3);

  function MoveToLastCharacterOfScreenLine() {
    _classCallCheck(this, MoveToLastCharacterOfScreenLine);

    _get(Object.getPrototypeOf(MoveToLastCharacterOfScreenLine.prototype), "constructor", this).apply(this, arguments);

    this.which = "last-character";
  }

  return MoveToLastCharacterOfScreenLine;
})(MoveToScreenColumn);

MoveToLastCharacterOfScreenLine.register();

// keymap: G

var MoveToLastLine = (function (_MoveToFirstLine) {
  _inherits(MoveToLastLine, _MoveToFirstLine);

  function MoveToLastLine() {
    _classCallCheck(this, MoveToLastLine);

    _get(Object.getPrototypeOf(MoveToLastLine.prototype), "constructor", this).apply(this, arguments);

    this.defaultCount = Infinity;
  }

  return MoveToLastLine;
})(MoveToFirstLine);

MoveToLastLine.register();

// keymap: N% e.g. 10%

var MoveToLineByPercent = (function (_MoveToFirstLine2) {
  _inherits(MoveToLineByPercent, _MoveToFirstLine2);

  function MoveToLineByPercent() {
    _classCallCheck(this, MoveToLineByPercent);

    _get(Object.getPrototypeOf(MoveToLineByPercent.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToLineByPercent, [{
    key: "getRow",
    value: function getRow() {
      var percent = limitNumber(this.getCount(), { max: 100 });
      return Math.floor((this.editor.getLineCount() - 1) * (percent / 100));
    }
  }]);

  return MoveToLineByPercent;
})(MoveToFirstLine);

MoveToLineByPercent.register();

var MoveToRelativeLine = (function (_Motion20) {
  _inherits(MoveToRelativeLine, _Motion20);

  function MoveToRelativeLine() {
    _classCallCheck(this, MoveToRelativeLine);

    _get(Object.getPrototypeOf(MoveToRelativeLine.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.moveSuccessOnLinewise = true;
  }

  _createClass(MoveToRelativeLine, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var row = undefined;
      var count = this.getCount();
      if (count < 0) {
        // Support negative count
        // Negative count can be passed like `operationStack.run("MoveToRelativeLine", {count: -5})`.
        // Currently used in vim-mode-plus-ex-mode pkg.
        count += 1;
        row = this.getFoldStartRowForRow(cursor.getBufferRow());
        while (count++ < 0) row = this.getFoldStartRowForRow(row - 1);
      } else {
        count -= 1;
        row = this.getFoldEndRowForRow(cursor.getBufferRow());
        while (count-- > 0) row = this.getFoldEndRowForRow(row + 1);
      }
      setBufferRow(cursor, row);
    }
  }]);

  return MoveToRelativeLine;
})(Motion);

MoveToRelativeLine.register(false);

var MoveToRelativeLineMinimumTwo = (function (_MoveToRelativeLine) {
  _inherits(MoveToRelativeLineMinimumTwo, _MoveToRelativeLine);

  function MoveToRelativeLineMinimumTwo() {
    _classCallCheck(this, MoveToRelativeLineMinimumTwo);

    _get(Object.getPrototypeOf(MoveToRelativeLineMinimumTwo.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToRelativeLineMinimumTwo, [{
    key: "getCount",
    value: function getCount() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return limitNumber(_get(Object.getPrototypeOf(MoveToRelativeLineMinimumTwo.prototype), "getCount", this).apply(this, args), { min: 2 });
    }
  }]);

  return MoveToRelativeLineMinimumTwo;
})(MoveToRelativeLine);

MoveToRelativeLineMinimumTwo.register(false);

// Position cursor without scrolling., H, M, L
// -------------------------
// keymap: H

var MoveToTopOfScreen = (function (_Motion21) {
  _inherits(MoveToTopOfScreen, _Motion21);

  function MoveToTopOfScreen() {
    _classCallCheck(this, MoveToTopOfScreen);

    _get(Object.getPrototypeOf(MoveToTopOfScreen.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.jump = true;
    this.scrolloff = 2;
    this.defaultCount = 0;
    this.verticalMotion = true;
  }

  _createClass(MoveToTopOfScreen, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var bufferRow = this.editor.bufferRowForScreenRow(this.getScreenRow());
      this.setCursorBufferRow(cursor, bufferRow);
    }
  }, {
    key: "getScrolloff",
    value: function getScrolloff() {
      return this.isAsTargetExceptSelectInVisualMode() ? 0 : this.scrolloff;
    }
  }, {
    key: "getScreenRow",
    value: function getScreenRow() {
      var firstRow = getFirstVisibleScreenRow(this.editor);
      var offset = this.getScrolloff();
      if (firstRow === 0) {
        offset = 0;
      }
      offset = limitNumber(this.getCount(-1), { min: offset });
      return firstRow + offset;
    }
  }]);

  return MoveToTopOfScreen;
})(Motion);

MoveToTopOfScreen.register();

// keymap: M

var MoveToMiddleOfScreen = (function (_MoveToTopOfScreen) {
  _inherits(MoveToMiddleOfScreen, _MoveToTopOfScreen);

  function MoveToMiddleOfScreen() {
    _classCallCheck(this, MoveToMiddleOfScreen);

    _get(Object.getPrototypeOf(MoveToMiddleOfScreen.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToMiddleOfScreen, [{
    key: "getScreenRow",
    value: function getScreenRow() {
      var startRow = getFirstVisibleScreenRow(this.editor);
      var endRow = limitNumber(this.editor.getLastVisibleScreenRow(), { max: this.getVimLastScreenRow() });
      return startRow + Math.floor((endRow - startRow) / 2);
    }
  }]);

  return MoveToMiddleOfScreen;
})(MoveToTopOfScreen);

MoveToMiddleOfScreen.register();

// keymap: L

var MoveToBottomOfScreen = (function (_MoveToTopOfScreen2) {
  _inherits(MoveToBottomOfScreen, _MoveToTopOfScreen2);

  function MoveToBottomOfScreen() {
    _classCallCheck(this, MoveToBottomOfScreen);

    _get(Object.getPrototypeOf(MoveToBottomOfScreen.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToBottomOfScreen, [{
    key: "getScreenRow",
    value: function getScreenRow() {
      // [FIXME]
      // At least Atom v1.6.0, there are two implementation of getLastVisibleScreenRow()
      // editor.getLastVisibleScreenRow() and editorElement.getLastVisibleScreenRow()
      // Those two methods return different value, editor's one is corrent.
      // So I intentionally use editor.getLastScreenRow here.
      var vimLastScreenRow = this.getVimLastScreenRow();
      var row = limitNumber(this.editor.getLastVisibleScreenRow(), { max: vimLastScreenRow });
      var offset = this.getScrolloff() + 1;
      if (row === vimLastScreenRow) {
        offset = 0;
      }
      offset = limitNumber(this.getCount(-1), { min: offset });
      return row - offset;
    }
  }]);

  return MoveToBottomOfScreen;
})(MoveToTopOfScreen);

MoveToBottomOfScreen.register();

// Scrolling
// Half: ctrl-d, ctrl-u
// Full: ctrl-f, ctrl-b
// -------------------------
// [FIXME] count behave differently from original Vim.

var Scroll = (function (_Motion22) {
  _inherits(Scroll, _Motion22);

  function Scroll() {
    _classCallCheck(this, Scroll);

    _get(Object.getPrototypeOf(Scroll.prototype), "constructor", this).apply(this, arguments);

    this.verticalMotion = true;
  }

  _createClass(Scroll, [{
    key: "isSmoothScrollEnabled",
    value: function isSmoothScrollEnabled() {
      return Math.abs(this.amountOfPage) === 1 ? this.getConfig("smoothScrollOnFullScrollMotion") : this.getConfig("smoothScrollOnHalfScrollMotion");
    }
  }, {
    key: "getSmoothScrollDuation",
    value: function getSmoothScrollDuation() {
      return Math.abs(this.amountOfPage) === 1 ? this.getConfig("smoothScrollOnFullScrollMotionDuration") : this.getConfig("smoothScrollOnHalfScrollMotionDuration");
    }
  }, {
    key: "getPixelRectTopForSceenRow",
    value: function getPixelRectTopForSceenRow(row) {
      var point = new Point(row, 0);
      return this.editor.element.pixelRectForScreenRange(new Range(point, point)).top;
    }
  }, {
    key: "smoothScroll",
    value: function smoothScroll(fromRow, toRow, done) {
      var _this14 = this;

      var topPixelFrom = { top: this.getPixelRectTopForSceenRow(fromRow) };
      var topPixelTo = { top: this.getPixelRectTopForSceenRow(toRow) };
      // [NOTE]
      // intentionally use `element.component.setScrollTop` instead of `element.setScrollTop`.
      // SInce element.setScrollTop will throw exception when element.component no longer exists.
      var step = function step(newTop) {
        if (_this14.editor.element.component) {
          _this14.editor.element.component.setScrollTop(newTop);
          _this14.editor.element.component.updateSync();
        }
      };

      var duration = this.getSmoothScrollDuation();
      this.vimState.requestScrollAnimation(topPixelFrom, topPixelTo, { duration: duration, step: step, done: done });
    }
  }, {
    key: "getAmountOfRows",
    value: function getAmountOfRows() {
      return Math.ceil(this.amountOfPage * this.editor.getRowsPerPage() * this.getCount());
    }
  }, {
    key: "getBufferRow",
    value: function getBufferRow(cursor) {
      var screenRow = getValidVimScreenRow(this.editor, cursor.getScreenRow() + this.getAmountOfRows());
      return this.editor.bufferRowForScreenRow(screenRow);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this15 = this;

      var bufferRow = this.getBufferRow(cursor);
      this.setCursorBufferRow(cursor, this.getBufferRow(cursor), { autoscroll: false });

      if (cursor.isLastCursor()) {
        (function () {
          if (_this15.isSmoothScrollEnabled()) _this15.vimState.finishScrollAnimation();

          var firstVisibileScreenRow = _this15.editor.getFirstVisibleScreenRow();
          var newFirstVisibileBufferRow = _this15.editor.bufferRowForScreenRow(firstVisibileScreenRow + _this15.getAmountOfRows());
          var newFirstVisibileScreenRow = _this15.editor.screenRowForBufferRow(newFirstVisibileBufferRow);
          var done = function done() {
            _this15.editor.setFirstVisibleScreenRow(newFirstVisibileScreenRow);
            // [FIXME] sometimes, scrollTop is not updated, calling this fix.
            // Investigate and find better approach then remove this workaround.
            if (_this15.editor.element.component) _this15.editor.element.component.updateSync();
          };

          if (_this15.isSmoothScrollEnabled()) _this15.smoothScroll(firstVisibileScreenRow, newFirstVisibileScreenRow, done);else done();
        })();
      }
    }
  }]);

  return Scroll;
})(Motion);

Scroll.register(false);

// keymap: ctrl-f

var ScrollFullScreenDown = (function (_Scroll) {
  _inherits(ScrollFullScreenDown, _Scroll);

  function ScrollFullScreenDown() {
    _classCallCheck(this, ScrollFullScreenDown);

    _get(Object.getPrototypeOf(ScrollFullScreenDown.prototype), "constructor", this).apply(this, arguments);

    this.amountOfPage = +1;
  }

  return ScrollFullScreenDown;
})(Scroll);

ScrollFullScreenDown.register();

// keymap: ctrl-b

var ScrollFullScreenUp = (function (_Scroll2) {
  _inherits(ScrollFullScreenUp, _Scroll2);

  function ScrollFullScreenUp() {
    _classCallCheck(this, ScrollFullScreenUp);

    _get(Object.getPrototypeOf(ScrollFullScreenUp.prototype), "constructor", this).apply(this, arguments);

    this.amountOfPage = -1;
  }

  return ScrollFullScreenUp;
})(Scroll);

ScrollFullScreenUp.register();

// keymap: ctrl-d

var ScrollHalfScreenDown = (function (_Scroll3) {
  _inherits(ScrollHalfScreenDown, _Scroll3);

  function ScrollHalfScreenDown() {
    _classCallCheck(this, ScrollHalfScreenDown);

    _get(Object.getPrototypeOf(ScrollHalfScreenDown.prototype), "constructor", this).apply(this, arguments);

    this.amountOfPage = +1 / 2;
  }

  return ScrollHalfScreenDown;
})(Scroll);

ScrollHalfScreenDown.register();

// keymap: ctrl-u

var ScrollHalfScreenUp = (function (_Scroll4) {
  _inherits(ScrollHalfScreenUp, _Scroll4);

  function ScrollHalfScreenUp() {
    _classCallCheck(this, ScrollHalfScreenUp);

    _get(Object.getPrototypeOf(ScrollHalfScreenUp.prototype), "constructor", this).apply(this, arguments);

    this.amountOfPage = -1 / 2;
  }

  return ScrollHalfScreenUp;
})(Scroll);

ScrollHalfScreenUp.register();

// Find
// -------------------------
// keymap: f

var Find = (function (_Motion23) {
  _inherits(Find, _Motion23);

  function Find() {
    _classCallCheck(this, Find);

    _get(Object.getPrototypeOf(Find.prototype), "constructor", this).apply(this, arguments);

    this.backwards = false;
    this.inclusive = true;
    this.offset = 0;
    this.requireInput = true;
    this.caseSensitivityKind = "Find";
  }

  _createClass(Find, [{
    key: "restoreEditorState",
    value: function restoreEditorState() {
      if (this._restoreEditorState) this._restoreEditorState();
      this._restoreEditorState = null;
    }
  }, {
    key: "cancelOperation",
    value: function cancelOperation() {
      this.restoreEditorState();
      _get(Object.getPrototypeOf(Find.prototype), "cancelOperation", this).call(this);
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var _this16 = this;

      if (this.getConfig("reuseFindForRepeatFind")) this.repeatIfNecessary();
      if (!this.isComplete()) {
        var charsMax = this.getConfig("findCharsMax");
        var optionsBase = { purpose: "find", charsMax: charsMax };

        if (charsMax === 1) {
          this.focusInput(optionsBase);
        } else {
          this._restoreEditorState = saveEditorState(this.editor);
          var options = {
            autoConfirmTimeout: this.getConfig("findConfirmByTimeout"),
            onConfirm: function onConfirm(input) {
              _this16.input = input;
              if (input) _this16.processOperation();else _this16.cancelOperation();
            },
            onChange: function onChange(preConfirmedChars) {
              _this16.preConfirmedChars = preConfirmedChars;
              _this16.highlightTextInCursorRows(_this16.preConfirmedChars, "pre-confirm", _this16.isBackwards());
            },
            onCancel: function onCancel() {
              _this16.vimState.highlightFind.clearMarkers();
              _this16.cancelOperation();
            },
            commands: {
              "vim-mode-plus:find-next-pre-confirmed": function vimModePlusFindNextPreConfirmed() {
                return _this16.findPreConfirmed(+1);
              },
              "vim-mode-plus:find-previous-pre-confirmed": function vimModePlusFindPreviousPreConfirmed() {
                return _this16.findPreConfirmed(-1);
              }
            }
          };
          this.focusInput(Object.assign(options, optionsBase));
        }
      }
      return _get(Object.getPrototypeOf(Find.prototype), "initialize", this).call(this);
    }
  }, {
    key: "findPreConfirmed",
    value: function findPreConfirmed(delta) {
      if (this.preConfirmedChars && this.getConfig("highlightFindChar")) {
        var index = this.highlightTextInCursorRows(this.preConfirmedChars, "pre-confirm", this.isBackwards(), this.getCount(-1) + delta, true);
        this.count = index + 1;
      }
    }
  }, {
    key: "repeatIfNecessary",
    value: function repeatIfNecessary() {
      var findCommandNames = ["Find", "FindBackwards", "Till", "TillBackwards"];
      var currentFind = this.globalState.get("currentFind");
      if (currentFind && findCommandNames.includes(this.vimState.operationStack.getLastCommandName())) {
        this.input = currentFind.input;
        this.repeated = true;
      }
    }
  }, {
    key: "isBackwards",
    value: function isBackwards() {
      return this.backwards;
    }
  }, {
    key: "execute",
    value: function execute() {
      var _this17 = this;

      _get(Object.getPrototypeOf(Find.prototype), "execute", this).call(this);
      var decorationType = "post-confirm";
      if (this.operator && !this.operator["instanceof"]("SelectBase")) {
        decorationType += " long";
      }

      // HACK: When repeated by ",", this.backwards is temporary inverted and
      // restored after execution finished.
      // But final highlightTextInCursorRows is executed in async(=after operation finished).
      // Thus we need to preserve before restored `backwards` value and pass it.
      var backwards = this.isBackwards();
      this.editor.component.getNextUpdatePromise().then(function () {
        _this17.highlightTextInCursorRows(_this17.input, decorationType, backwards);
      });
    }
  }, {
    key: "getPoint",
    value: function getPoint(fromPoint) {
      var scanRange = this.editor.bufferRangeForBufferRow(fromPoint.row);
      var points = [];
      var regex = this.getRegex(this.input);
      var indexWantAccess = this.getCount(-1);

      var translation = new Point(0, this.isBackwards() ? this.offset : -this.offset);
      if (this.repeated) {
        fromPoint = fromPoint.translate(translation.negate());
      }

      if (this.isBackwards()) {
        if (this.getConfig("findAcrossLines")) scanRange.start = Point.ZERO;

        this.editor.backwardsScanInBufferRange(regex, scanRange, function (_ref7) {
          var range = _ref7.range;
          var stop = _ref7.stop;

          if (range.start.isLessThan(fromPoint)) {
            points.push(range.start);
            if (points.length > indexWantAccess) {
              stop();
            }
          }
        });
      } else {
        if (this.getConfig("findAcrossLines")) scanRange.end = this.editor.getEofBufferPosition();
        this.editor.scanInBufferRange(regex, scanRange, function (_ref8) {
          var range = _ref8.range;
          var stop = _ref8.stop;

          if (range.start.isGreaterThan(fromPoint)) {
            points.push(range.start);
            if (points.length > indexWantAccess) {
              stop();
            }
          }
        });
      }

      var point = points[indexWantAccess];
      if (point) return point.translate(translation);
    }

    // FIXME: bad naming, this function must return index
  }, {
    key: "highlightTextInCursorRows",
    value: function highlightTextInCursorRows(text, decorationType, backwards) {
      var index = arguments.length <= 3 || arguments[3] === undefined ? this.getCount(-1) : arguments[3];
      var adjustIndex = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

      if (!this.getConfig("highlightFindChar")) return;

      return this.vimState.highlightFind.highlightCursorRows(this.getRegex(text), decorationType, backwards, this.offset, index, adjustIndex);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var point = this.getPoint(cursor.getBufferPosition());
      if (point) cursor.setBufferPosition(point);else this.restoreEditorState();

      if (!this.repeated) this.globalState.set("currentFind", this);
    }
  }, {
    key: "getRegex",
    value: function getRegex(term) {
      var modifiers = this.isCaseSensitive(term) ? "g" : "gi";
      return new RegExp(_.escapeRegExp(term), modifiers);
    }
  }]);

  return Find;
})(Motion);

Find.register();

// keymap: F

var FindBackwards = (function (_Find) {
  _inherits(FindBackwards, _Find);

  function FindBackwards() {
    _classCallCheck(this, FindBackwards);

    _get(Object.getPrototypeOf(FindBackwards.prototype), "constructor", this).apply(this, arguments);

    this.inclusive = false;
    this.backwards = true;
  }

  return FindBackwards;
})(Find);

FindBackwards.register();

// keymap: t

var Till = (function (_Find2) {
  _inherits(Till, _Find2);

  function Till() {
    _classCallCheck(this, Till);

    _get(Object.getPrototypeOf(Till.prototype), "constructor", this).apply(this, arguments);

    this.offset = 1;
  }

  _createClass(Till, [{
    key: "getPoint",
    value: function getPoint() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var point = _get(Object.getPrototypeOf(Till.prototype), "getPoint", this).apply(this, args);
      this.moveSucceeded = point != null;
      return point;
    }
  }]);

  return Till;
})(Find);

Till.register();

// keymap: T

var TillBackwards = (function (_Till) {
  _inherits(TillBackwards, _Till);

  function TillBackwards() {
    _classCallCheck(this, TillBackwards);

    _get(Object.getPrototypeOf(TillBackwards.prototype), "constructor", this).apply(this, arguments);

    this.inclusive = false;
    this.backwards = true;
  }

  return TillBackwards;
})(Till);

TillBackwards.register();

// Mark
// -------------------------
// keymap: `

var MoveToMark = (function (_Motion24) {
  _inherits(MoveToMark, _Motion24);

  function MoveToMark() {
    _classCallCheck(this, MoveToMark);

    _get(Object.getPrototypeOf(MoveToMark.prototype), "constructor", this).apply(this, arguments);

    this.jump = true;
    this.requireInput = true;
    this.input = null;
  }

  _createClass(MoveToMark, [{
    key: "initialize",
    value: function initialize() {
      if (!this.isComplete()) this.readChar();
      return _get(Object.getPrototypeOf(MoveToMark.prototype), "initialize", this).call(this);
    }
  }, {
    key: "getPoint",
    value: function getPoint() {
      return this.vimState.mark.get(this.input);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var point = this.getPoint();
      if (point) {
        cursor.setBufferPosition(point);
        cursor.autoscroll({ center: true });
      }
    }
  }]);

  return MoveToMark;
})(Motion);

MoveToMark.register();

// keymap: '

var MoveToMarkLine = (function (_MoveToMark) {
  _inherits(MoveToMarkLine, _MoveToMark);

  function MoveToMarkLine() {
    _classCallCheck(this, MoveToMarkLine);

    _get(Object.getPrototypeOf(MoveToMarkLine.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
  }

  _createClass(MoveToMarkLine, [{
    key: "getPoint",
    value: function getPoint() {
      var point = _get(Object.getPrototypeOf(MoveToMarkLine.prototype), "getPoint", this).call(this);
      if (point) {
        return this.getFirstCharacterPositionForBufferRow(point.row);
      }
    }
  }]);

  return MoveToMarkLine;
})(MoveToMark);

MoveToMarkLine.register();

// Fold
// -------------------------

var MoveToPreviousFoldStart = (function (_Motion25) {
  _inherits(MoveToPreviousFoldStart, _Motion25);

  function MoveToPreviousFoldStart() {
    _classCallCheck(this, MoveToPreviousFoldStart);

    _get(Object.getPrototypeOf(MoveToPreviousFoldStart.prototype), "constructor", this).apply(this, arguments);

    this.wise = "characterwise";
    this.which = "start";
    this.direction = "prev";
  }

  _createClass(MoveToPreviousFoldStart, [{
    key: "execute",
    value: function execute() {
      this.rows = this.getFoldRows(this.which);
      if (this.direction === "prev") this.rows.reverse();

      _get(Object.getPrototypeOf(MoveToPreviousFoldStart.prototype), "execute", this).call(this);
    }
  }, {
    key: "getFoldRows",
    value: function getFoldRows(which) {
      var index = which === "start" ? 0 : 1;
      var rows = getCodeFoldRowRanges(this.editor).map(function (rowRange) {
        return rowRange[index];
      });
      return _.sortBy(_.uniq(rows), function (row) {
        return row;
      });
    }
  }, {
    key: "getScanRows",
    value: function getScanRows(cursor) {
      var cursorRow = cursor.getBufferRow();
      var isVald = this.direction === "prev" ? function (row) {
        return row < cursorRow;
      } : function (row) {
        return row > cursorRow;
      };
      return this.rows.filter(isVald);
    }
  }, {
    key: "detectRow",
    value: function detectRow(cursor) {
      return this.getScanRows(cursor)[0];
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this18 = this;

      this.moveCursorCountTimes(cursor, function () {
        var row = _this18.detectRow(cursor);
        if (row != null) moveCursorToFirstCharacterAtRow(cursor, row);
      });
    }
  }]);

  return MoveToPreviousFoldStart;
})(Motion);

MoveToPreviousFoldStart.register();

var MoveToNextFoldStart = (function (_MoveToPreviousFoldStart) {
  _inherits(MoveToNextFoldStart, _MoveToPreviousFoldStart);

  function MoveToNextFoldStart() {
    _classCallCheck(this, MoveToNextFoldStart);

    _get(Object.getPrototypeOf(MoveToNextFoldStart.prototype), "constructor", this).apply(this, arguments);

    this.direction = "next";
  }

  return MoveToNextFoldStart;
})(MoveToPreviousFoldStart);

MoveToNextFoldStart.register();

var MoveToPreviousFoldStartWithSameIndent = (function (_MoveToPreviousFoldStart2) {
  _inherits(MoveToPreviousFoldStartWithSameIndent, _MoveToPreviousFoldStart2);

  function MoveToPreviousFoldStartWithSameIndent() {
    _classCallCheck(this, MoveToPreviousFoldStartWithSameIndent);

    _get(Object.getPrototypeOf(MoveToPreviousFoldStartWithSameIndent.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MoveToPreviousFoldStartWithSameIndent, [{
    key: "detectRow",
    value: function detectRow(cursor) {
      var _this19 = this;

      var baseIndentLevel = this.editor.indentationForBufferRow(cursor.getBufferRow());
      return this.getScanRows(cursor).find(function (row) {
        return _this19.editor.indentationForBufferRow(row) === baseIndentLevel;
      });
    }
  }]);

  return MoveToPreviousFoldStartWithSameIndent;
})(MoveToPreviousFoldStart);

MoveToPreviousFoldStartWithSameIndent.register();

var MoveToNextFoldStartWithSameIndent = (function (_MoveToPreviousFoldStartWithSameIndent) {
  _inherits(MoveToNextFoldStartWithSameIndent, _MoveToPreviousFoldStartWithSameIndent);

  function MoveToNextFoldStartWithSameIndent() {
    _classCallCheck(this, MoveToNextFoldStartWithSameIndent);

    _get(Object.getPrototypeOf(MoveToNextFoldStartWithSameIndent.prototype), "constructor", this).apply(this, arguments);

    this.direction = "next";
  }

  return MoveToNextFoldStartWithSameIndent;
})(MoveToPreviousFoldStartWithSameIndent);

MoveToNextFoldStartWithSameIndent.register();

var MoveToPreviousFoldEnd = (function (_MoveToPreviousFoldStart3) {
  _inherits(MoveToPreviousFoldEnd, _MoveToPreviousFoldStart3);

  function MoveToPreviousFoldEnd() {
    _classCallCheck(this, MoveToPreviousFoldEnd);

    _get(Object.getPrototypeOf(MoveToPreviousFoldEnd.prototype), "constructor", this).apply(this, arguments);

    this.which = "end";
  }

  return MoveToPreviousFoldEnd;
})(MoveToPreviousFoldStart);

MoveToPreviousFoldEnd.register();

var MoveToNextFoldEnd = (function (_MoveToPreviousFoldEnd) {
  _inherits(MoveToNextFoldEnd, _MoveToPreviousFoldEnd);

  function MoveToNextFoldEnd() {
    _classCallCheck(this, MoveToNextFoldEnd);

    _get(Object.getPrototypeOf(MoveToNextFoldEnd.prototype), "constructor", this).apply(this, arguments);

    this.direction = "next";
  }

  return MoveToNextFoldEnd;
})(MoveToPreviousFoldEnd);

MoveToNextFoldEnd.register();

// -------------------------

var MoveToPreviousFunction = (function (_MoveToPreviousFoldStart4) {
  _inherits(MoveToPreviousFunction, _MoveToPreviousFoldStart4);

  function MoveToPreviousFunction() {
    _classCallCheck(this, MoveToPreviousFunction);

    _get(Object.getPrototypeOf(MoveToPreviousFunction.prototype), "constructor", this).apply(this, arguments);

    this.direction = "prev";
  }

  _createClass(MoveToPreviousFunction, [{
    key: "detectRow",
    value: function detectRow(cursor) {
      var _this20 = this;

      return this.getScanRows(cursor).find(function (row) {
        return isIncludeFunctionScopeForRow(_this20.editor, row);
      });
    }
  }]);

  return MoveToPreviousFunction;
})(MoveToPreviousFoldStart);

MoveToPreviousFunction.register();

var MoveToNextFunction = (function (_MoveToPreviousFunction) {
  _inherits(MoveToNextFunction, _MoveToPreviousFunction);

  function MoveToNextFunction() {
    _classCallCheck(this, MoveToNextFunction);

    _get(Object.getPrototypeOf(MoveToNextFunction.prototype), "constructor", this).apply(this, arguments);

    this.direction = "next";
  }

  return MoveToNextFunction;
})(MoveToPreviousFunction);

MoveToNextFunction.register();

// Scope based
// -------------------------

var MoveToPositionByScope = (function (_Motion26) {
  _inherits(MoveToPositionByScope, _Motion26);

  function MoveToPositionByScope() {
    _classCallCheck(this, MoveToPositionByScope);

    _get(Object.getPrototypeOf(MoveToPositionByScope.prototype), "constructor", this).apply(this, arguments);

    this.direction = "backward";
    this.scope = ".";
  }

  _createClass(MoveToPositionByScope, [{
    key: "getPoint",
    value: function getPoint(fromPoint) {
      return detectScopeStartPositionForScope(this.editor, fromPoint, this.direction, this.scope);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var _this21 = this;

      this.moveCursorCountTimes(cursor, function () {
        _this21.setBufferPositionSafely(cursor, _this21.getPoint(cursor.getBufferPosition()));
      });
    }
  }]);

  return MoveToPositionByScope;
})(Motion);

MoveToPositionByScope.register(false);

var MoveToPreviousString = (function (_MoveToPositionByScope) {
  _inherits(MoveToPreviousString, _MoveToPositionByScope);

  function MoveToPreviousString() {
    _classCallCheck(this, MoveToPreviousString);

    _get(Object.getPrototypeOf(MoveToPreviousString.prototype), "constructor", this).apply(this, arguments);

    this.direction = "backward";
    this.scope = "string.begin";
  }

  return MoveToPreviousString;
})(MoveToPositionByScope);

MoveToPreviousString.register();

var MoveToNextString = (function (_MoveToPreviousString) {
  _inherits(MoveToNextString, _MoveToPreviousString);

  function MoveToNextString() {
    _classCallCheck(this, MoveToNextString);

    _get(Object.getPrototypeOf(MoveToNextString.prototype), "constructor", this).apply(this, arguments);

    this.direction = "forward";
  }

  return MoveToNextString;
})(MoveToPreviousString);

MoveToNextString.register();

var MoveToPreviousNumber = (function (_MoveToPositionByScope2) {
  _inherits(MoveToPreviousNumber, _MoveToPositionByScope2);

  function MoveToPreviousNumber() {
    _classCallCheck(this, MoveToPreviousNumber);

    _get(Object.getPrototypeOf(MoveToPreviousNumber.prototype), "constructor", this).apply(this, arguments);

    this.direction = "backward";
    this.scope = "constant.numeric";
  }

  return MoveToPreviousNumber;
})(MoveToPositionByScope);

MoveToPreviousNumber.register();

var MoveToNextNumber = (function (_MoveToPreviousNumber) {
  _inherits(MoveToNextNumber, _MoveToPreviousNumber);

  function MoveToNextNumber() {
    _classCallCheck(this, MoveToNextNumber);

    _get(Object.getPrototypeOf(MoveToNextNumber.prototype), "constructor", this).apply(this, arguments);

    this.direction = "forward";
  }

  return MoveToNextNumber;
})(MoveToPreviousNumber);

MoveToNextNumber.register();

var MoveToNextOccurrence = (function (_Motion27) {
  _inherits(MoveToNextOccurrence, _Motion27);

  function MoveToNextOccurrence() {
    _classCallCheck(this, MoveToNextOccurrence);

    _get(Object.getPrototypeOf(MoveToNextOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.jump = true;
    this.direction = "next";
  }

  _createClass(MoveToNextOccurrence, [{
    key: "execute",
    value: function execute() {
      this.ranges = sortRanges(this.occurrenceManager.getMarkers().map(function (marker) {
        return marker.getBufferRange();
      }));
      _get(Object.getPrototypeOf(MoveToNextOccurrence.prototype), "execute", this).call(this);
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      var range = this.ranges[getIndex(this.getIndex(cursor.getBufferPosition()), this.ranges)];
      var point = range.start;
      cursor.setBufferPosition(point, { autoscroll: false });

      if (cursor.isLastCursor()) {
        this.editor.unfoldBufferRow(point.row);
        smartScrollToBufferPosition(this.editor, point);
      }

      if (this.getConfig("flashOnMoveToOccurrence")) {
        this.vimState.flash(range, { type: "search" });
      }
    }
  }, {
    key: "getIndex",
    value: function getIndex(fromPoint) {
      var index = this.ranges.findIndex(function (range) {
        return range.start.isGreaterThan(fromPoint);
      });
      return (index >= 0 ? index : 0) + this.getCount(-1);
    }
  }], [{
    key: "commandScope",

    // Ensure this command is available when only has-occurrence
    value: "atom-text-editor.vim-mode-plus.has-occurrence",
    enumerable: true
  }]);

  return MoveToNextOccurrence;
})(Motion);

MoveToNextOccurrence.register();

var MoveToPreviousOccurrence = (function (_MoveToNextOccurrence) {
  _inherits(MoveToPreviousOccurrence, _MoveToNextOccurrence);

  function MoveToPreviousOccurrence() {
    _classCallCheck(this, MoveToPreviousOccurrence);

    _get(Object.getPrototypeOf(MoveToPreviousOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.direction = "previous";
  }

  _createClass(MoveToPreviousOccurrence, [{
    key: "getIndex",
    value: function getIndex(fromPoint) {
      var ranges = this.ranges.slice().reverse();
      var range = ranges.find(function (range) {
        return range.end.isLessThan(fromPoint);
      });
      var index = range ? this.ranges.indexOf(range) : this.ranges.length - 1;
      return index - this.getCount(-1);
    }
  }]);

  return MoveToPreviousOccurrence;
})(MoveToNextOccurrence);

MoveToPreviousOccurrence.register();

// -------------------------
// keymap: %

var MoveToPair = (function (_Motion28) {
  _inherits(MoveToPair, _Motion28);

  function MoveToPair() {
    _classCallCheck(this, MoveToPair);

    _get(Object.getPrototypeOf(MoveToPair.prototype), "constructor", this).apply(this, arguments);

    this.inclusive = true;
    this.jump = true;
    this.member = ["Parenthesis", "CurlyBracket", "SquareBracket"];
  }

  _createClass(MoveToPair, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      this.setBufferPositionSafely(cursor, this.getPoint(cursor));
    }
  }, {
    key: "getPointForTag",
    value: function getPointForTag(point) {
      var pairInfo = this.getInstance("ATag").getPairInfo(point);
      if (!pairInfo) return;

      var openRange = pairInfo.openRange;
      var closeRange = pairInfo.closeRange;

      openRange = openRange.translate([0, +1], [0, -1]);
      closeRange = closeRange.translate([0, +1], [0, -1]);
      if (openRange.containsPoint(point) && !point.isEqual(openRange.end)) {
        return closeRange.start;
      }
      if (closeRange.containsPoint(point) && !point.isEqual(closeRange.end)) {
        return openRange.start;
      }
    }
  }, {
    key: "getPoint",
    value: function getPoint(cursor) {
      var cursorPosition = cursor.getBufferPosition();
      var cursorRow = cursorPosition.row;
      var point = this.getPointForTag(cursorPosition);
      if (point) return point;

      // AAnyPairAllowForwarding return forwarding range or enclosing range.
      var range = this.getInstance("AAnyPairAllowForwarding", { member: this.member }).getRange(cursor.selection);
      if (!range) return;

      var start = range.start;
      var end = range.end;

      if (start.row === cursorRow && start.isGreaterThanOrEqual(cursorPosition)) {
        // Forwarding range found
        return end.translate([0, -1]);
      } else if (end.row === cursorPosition.row) {
        // Enclosing range was returned
        // We move to start( open-pair ) only when close-pair was at same row as cursor-row.
        return start;
      }
    }
  }]);

  return MoveToPair;
})(Motion);

MoveToPair.register();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW90aW9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7Ozs7O0FBRVgsSUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUE7O2VBQ2IsT0FBTyxDQUFDLE1BQU0sQ0FBQzs7SUFBL0IsS0FBSyxZQUFMLEtBQUs7SUFBRSxLQUFLLFlBQUwsS0FBSzs7Z0JBa0NmLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBL0JwQixjQUFjLGFBQWQsY0FBYztJQUNkLGVBQWUsYUFBZixlQUFlO0lBQ2Ysa0JBQWtCLGFBQWxCLGtCQUFrQjtJQUNsQixvQkFBb0IsYUFBcEIsb0JBQW9CO0lBQ3BCLHFCQUFxQixhQUFyQixxQkFBcUI7SUFDckIsd0JBQXdCLGFBQXhCLHdCQUF3QjtJQUN4Qix1QkFBdUIsYUFBdkIsdUJBQXVCO0lBQ3ZCLG9CQUFvQixhQUFwQixvQkFBb0I7SUFDcEIsb0JBQW9CLGFBQXBCLG9CQUFvQjtJQUNwQiwrQkFBK0IsYUFBL0IsK0JBQStCO0lBQy9CLFVBQVUsYUFBVixVQUFVO0lBQ1YsbUJBQW1CLGFBQW5CLG1CQUFtQjtJQUNuQiw2QkFBNkIsYUFBN0IsNkJBQTZCO0lBQzdCLFVBQVUsYUFBVixVQUFVO0lBQ1Ysb0JBQW9CLGFBQXBCLG9CQUFvQjtJQUNwQixvQ0FBb0MsYUFBcEMsb0NBQW9DO0lBQ3BDLDRCQUE0QixhQUE1Qiw0QkFBNEI7SUFDNUIsZ0NBQWdDLGFBQWhDLGdDQUFnQztJQUNoQyxhQUFhLGFBQWIsYUFBYTtJQUNiLG9CQUFvQixhQUFwQixvQkFBb0I7SUFDcEIsWUFBWSxhQUFaLFlBQVk7SUFDWixlQUFlLGFBQWYsZUFBZTtJQUNmLFdBQVcsYUFBWCxXQUFXO0lBQ1gsUUFBUSxhQUFSLFFBQVE7SUFDUiwyQkFBMkIsYUFBM0IsMkJBQTJCO0lBQzNCLCtCQUEr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QVMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFBO0FBQ3BDLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUE7QUFDakQsVUFBSSxLQUFLLEVBQUUsT0FBTyxLQUFLLENBQUE7OztBQUd2QixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLHlCQUF5QixFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7QUFDM0csVUFBSSxDQUFDLEtBQUssRUFBRSxPQUFNOztVQUVYLEtBQUssR0FBUyxLQUFLLENBQW5CLEtBQUs7VUFBRSxHQUFHLEdBQUksS0FBSyxDQUFaLEdBQUc7O0FBQ2pCLFVBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxTQUFTLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxFQUFFOztBQUV6RSxlQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO09BQzlCLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxLQUFLLGNBQWMsQ0FBQyxHQUFHLEVBQUU7OztBQUd6QyxlQUFPLEtBQUssQ0FBQTtPQUNiO0tBQ0Y7OztTQTNDRyxVQUFVO0dBQVMsTUFBTTs7QUE2Qy9CLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQSIsImZpbGUiOiIvVXNlcnMvamVzc2VsdW1hcmllL2RvdGZpbGVzLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21vdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCJcblxuY29uc3QgXyA9IHJlcXVpcmUoXCJ1bmRlcnNjb3JlLXBsdXNcIilcbmNvbnN0IHtQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZShcImF0b21cIilcblxuY29uc3Qge1xuICBtb3ZlQ3Vyc29yTGVmdCxcbiAgbW92ZUN1cnNvclJpZ2h0LFxuICBtb3ZlQ3Vyc29yVXBTY3JlZW4sXG4gIG1vdmVDdXJzb3JEb3duU2NyZWVuLFxuICBwb2ludElzQXRWaW1FbmRPZkZpbGUsXG4gIGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdyxcbiAgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3csXG4gIGdldFZhbGlkVmltU2NyZWVuUm93LFxuICBnZXRWYWxpZFZpbUJ1ZmZlclJvdyxcbiAgbW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvdyxcbiAgc29ydFJhbmdlcyxcbiAgcG9pbnRJc09uV2hpdGVTcGFjZSxcbiAgbW92ZUN1cnNvclRvTmV4dE5vbldoaXRlc3BhY2UsXG4gIGlzRW1wdHlSb3csXG4gIGdldENvZGVGb2xkUm93UmFuZ2VzLFxuICBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3csXG4gIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3csXG4gIGRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlLFxuICBnZXRCdWZmZXJSb3dzLFxuICBnZXRUZXh0SW5TY3JlZW5SYW5nZSxcbiAgc2V0QnVmZmVyUm93LFxuICBzZXRCdWZmZXJDb2x1bW4sXG4gIGxpbWl0TnVtYmVyLFxuICBnZXRJbmRleCxcbiAgc21hcnRTY3JvbGxUb0J1ZmZlclBvc2l0aW9uLFxuICBwb2ludElzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93LFxuICBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3csXG4gIGZpbmRSYW5nZUluQnVmZmVyUm93LFxuICBzYXZlRWRpdG9yU3RhdGUsXG4gIGdldExpc3QsXG4gIGdldFNjcmVlblBvc2l0aW9uRm9yU2NyZWVuUm93LFxufSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5cbmNvbnN0IEJhc2UgPSByZXF1aXJlKFwiLi9iYXNlXCIpXG5cbmNsYXNzIE1vdGlvbiBleHRlbmRzIEJhc2Uge1xuICBzdGF0aWMgb3BlcmF0aW9uS2luZCA9IFwibW90aW9uXCJcbiAgaW5jbHVzaXZlID0gZmFsc2VcbiAgd2lzZSA9IFwiY2hhcmFjdGVyd2lzZVwiXG4gIGp1bXAgPSBmYWxzZVxuICB2ZXJ0aWNhbE1vdGlvbiA9IGZhbHNlXG4gIG1vdmVTdWNjZWVkZWQgPSBudWxsXG4gIG1vdmVTdWNjZXNzT25MaW5ld2lzZSA9IGZhbHNlXG4gIHNlbGVjdFN1Y2NlZWRlZCA9IGZhbHNlXG5cbiAgaXNMaW5ld2lzZSgpIHtcbiAgICByZXR1cm4gdGhpcy53aXNlID09PSBcImxpbmV3aXNlXCJcbiAgfVxuXG4gIGlzQmxvY2t3aXNlKCkge1xuICAgIHJldHVybiB0aGlzLndpc2UgPT09IFwiYmxvY2t3aXNlXCJcbiAgfVxuXG4gIGZvcmNlV2lzZSh3aXNlKSB7XG4gICAgaWYgKHdpc2UgPT09IFwiY2hhcmFjdGVyd2lzZVwiKSB7XG4gICAgICB0aGlzLmluY2x1c2l2ZSA9IHRoaXMud2lzZSA9PT0gXCJsaW5ld2lzZVwiID8gZmFsc2UgOiAhdGhpcy5pbmNsdXNpdmVcbiAgICB9XG4gICAgdGhpcy53aXNlID0gd2lzZVxuICB9XG5cbiAgcmVzZXRTdGF0ZSgpIHtcbiAgICB0aGlzLnNlbGVjdFN1Y2NlZWRlZCA9IGZhbHNlXG4gIH1cblxuICBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KSB7XG4gICAgaWYgKHBvaW50KSBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gIH1cblxuICBzZXRTY3JlZW5Qb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KSB7XG4gICAgaWYgKHBvaW50KSBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24ocG9pbnQpXG4gIH1cblxuICBtb3ZlV2l0aFNhdmVKdW1wKGN1cnNvcikge1xuICAgIGxldCBjdXJzb3JQb3NpdGlvblxuICAgIGlmIChjdXJzb3IuaXNMYXN0Q3Vyc29yKCkgJiYgdGhpcy5qdW1wKSB7XG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgfVxuXG4gICAgdGhpcy5tb3ZlQ3Vyc29yKGN1cnNvcilcblxuICAgIGlmIChjdXJzb3JQb3NpdGlvbiAmJiAhY3Vyc29yUG9zaXRpb24uaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpIHtcbiAgICAgIHRoaXMudmltU3RhdGUubWFyay5zZXQoXCJgXCIsIGN1cnNvclBvc2l0aW9uKVxuICAgICAgdGhpcy52aW1TdGF0ZS5tYXJrLnNldChcIidcIiwgY3Vyc29yUG9zaXRpb24pXG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZSgpIHtcbiAgICBpZiAodGhpcy5vcGVyYXRvcikge1xuICAgICAgdGhpcy5zZWxlY3QoKVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGNvbnN0IGN1cnNvciBvZiB0aGlzLmVkaXRvci5nZXRDdXJzb3JzKCkpIHtcbiAgICAgICAgdGhpcy5tb3ZlV2l0aFNhdmVKdW1wKGN1cnNvcilcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5lZGl0b3IubWVyZ2VDdXJzb3JzKClcbiAgICB0aGlzLmVkaXRvci5tZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuICB9XG5cbiAgLy8gTk9URTogTW9kaWZ5IHNlbGVjdGlvbiBieSBtb2R0aW9uLCBzZWxlY3Rpb24gaXMgYWxyZWFkeSBcIm5vcm1hbGl6ZWRcIiBiZWZvcmUgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQuXG4gIHNlbGVjdCgpIHtcbiAgICAvLyBuZWVkIHRvIGNhcmUgd2FzIHZpc3VhbCBmb3IgYC5gIHJlcGVhdGVkLlxuICAgIGNvbnN0IGlzT3JXYXNWaXN1YWwgPSAodGhpcy5vcGVyYXRvciAmJiB0aGlzLm9wZXJhdG9yLmluc3RhbmNlb2YoXCJTZWxlY3RCYXNlXCIpKSB8fCB0aGlzLmlzKFwiQ3VycmVudFNlbGVjdGlvblwiKVxuXG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICBzZWxlY3Rpb24ubW9kaWZ5U2VsZWN0aW9uKCgpID0+IHRoaXMubW92ZVdpdGhTYXZlSnVtcChzZWxlY3Rpb24uY3Vyc29yKSlcblxuICAgICAgY29uc3Qgc2VsZWN0U3VjY2VlZGVkID1cbiAgICAgICAgdGhpcy5tb3ZlU3VjY2VlZGVkICE9IG51bGxcbiAgICAgICAgICA/IHRoaXMubW92ZVN1Y2NlZWRlZFxuICAgICAgICAgIDogIXNlbGVjdGlvbi5pc0VtcHR5KCkgfHwgKHRoaXMuaXNMaW5ld2lzZSgpICYmIHRoaXMubW92ZVN1Y2Nlc3NPbkxpbmV3aXNlKVxuICAgICAgaWYgKCF0aGlzLnNlbGVjdFN1Y2NlZWRlZCkgdGhpcy5zZWxlY3RTdWNjZWVkZWQgPSBzZWxlY3RTdWNjZWVkZWRcblxuICAgICAgaWYgKGlzT3JXYXNWaXN1YWwgfHwgKHNlbGVjdFN1Y2NlZWRlZCAmJiAodGhpcy5pbmNsdXNpdmUgfHwgdGhpcy5pc0xpbmV3aXNlKCkpKSkge1xuICAgICAgICBjb25zdCAkc2VsZWN0aW9uID0gdGhpcy5zd3JhcChzZWxlY3Rpb24pXG4gICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXModHJ1ZSkgLy8gc2F2ZSBwcm9wZXJ0eSBvZiBcImFscmVhZHktbm9ybWFsaXplZC1zZWxlY3Rpb25cIlxuICAgICAgICAkc2VsZWN0aW9uLmFwcGx5V2lzZSh0aGlzLndpc2UpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMud2lzZSA9PT0gXCJibG9ja3dpc2VcIikge1xuICAgICAgdGhpcy52aW1TdGF0ZS5nZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCkuYXV0b3Njcm9sbCgpXG4gICAgfVxuICB9XG5cbiAgc2V0Q3Vyc29yQnVmZmVyUm93KGN1cnNvciwgcm93LCBvcHRpb25zKSB7XG4gICAgaWYgKHRoaXMudmVydGljYWxNb3Rpb24gJiYgIXRoaXMuZ2V0Q29uZmlnKFwic3RheU9uVmVydGljYWxNb3Rpb25cIikpIHtcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbih0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cocm93KSwgb3B0aW9ucylcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0QnVmZmVyUm93KGN1cnNvciwgcm93LCBvcHRpb25zKVxuICAgIH1cbiAgfVxuXG4gIC8vIFtOT1RFXVxuICAvLyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGNoZWNrcyBjdXJzb3IgcG9zaXRpb24gY2hhbmdlLCBhIGN1cnNvciBwb3NpdGlvbiBNVVNUIGJlXG4gIC8vIHVwZGF0ZWQgSU4gY2FsbGJhY2soPWZuKVxuICAvLyBVcGRhdGluZyBwb2ludCBvbmx5IGluIGNhbGxiYWNrIGlzIHdyb25nLXVzZSBvZiB0aGlzIGZ1bmNpdG9uLFxuICAvLyBzaW5jZSBpdCBzdG9wcyBpbW1lZGlhdGVseSBiZWNhdXNlIG9mIG5vdCBjdXJzb3IgcG9zaXRpb24gY2hhbmdlLlxuICBtb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsIGZuKSB7XG4gICAgbGV0IG9sZFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICB0aGlzLmNvdW50VGltZXModGhpcy5nZXRDb3VudCgpLCBzdGF0ZSA9PiB7XG4gICAgICBmbihzdGF0ZSlcbiAgICAgIGNvbnN0IG5ld1Bvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGlmIChuZXdQb3NpdGlvbi5pc0VxdWFsKG9sZFBvc2l0aW9uKSkgc3RhdGUuc3RvcCgpXG4gICAgICBvbGRQb3NpdGlvbiA9IG5ld1Bvc2l0aW9uXG4gICAgfSlcbiAgfVxuXG4gIGlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29uZmlnKGB1c2VTbWFydGNhc2VGb3Ike3RoaXMuY2FzZVNlbnNpdGl2aXR5S2luZH1gKVxuICAgICAgPyB0ZXJtLnNlYXJjaCgvW0EtWl0vKSAhPT0gLTFcbiAgICAgIDogIXRoaXMuZ2V0Q29uZmlnKGBpZ25vcmVDYXNlRm9yJHt0aGlzLmNhc2VTZW5zaXRpdml0eUtpbmR9YClcbiAgfVxufVxuTW90aW9uLnJlZ2lzdGVyKGZhbHNlKVxuXG4vLyBVc2VkIGFzIG9wZXJhdG9yJ3MgdGFyZ2V0IGluIHZpc3VhbC1tb2RlLlxuY2xhc3MgQ3VycmVudFNlbGVjdGlvbiBleHRlbmRzIE1vdGlvbiB7XG4gIHNlbGVjdGlvbkV4dGVudCA9IG51bGxcbiAgYmxvY2t3aXNlU2VsZWN0aW9uRXh0ZW50ID0gbnVsbFxuICBpbmNsdXNpdmUgPSB0cnVlXG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICB0aGlzLnBvaW50SW5mb0J5Q3Vyc29yID0gbmV3IE1hcCgpXG4gICAgcmV0dXJuIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcInZpc3VhbFwiKSB7XG4gICAgICB0aGlzLnNlbGVjdGlvbkV4dGVudCA9IHRoaXMuaXNCbG9ja3dpc2UoKVxuICAgICAgICA/IHRoaXMuc3dyYXAoY3Vyc29yLnNlbGVjdGlvbikuZ2V0QmxvY2t3aXNlU2VsZWN0aW9uRXh0ZW50KClcbiAgICAgICAgOiB0aGlzLmVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCkuZ2V0RXh0ZW50KClcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYC5gIHJlcGVhdCBjYXNlXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkudHJhbnNsYXRlKHRoaXMuc2VsZWN0aW9uRXh0ZW50KSlcbiAgICB9XG4gIH1cblxuICBzZWxlY3QoKSB7XG4gICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ2aXN1YWxcIikge1xuICAgICAgc3VwZXIuc2VsZWN0KClcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChjb25zdCBjdXJzb3Igb2YgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29ycygpKSB7XG4gICAgICAgIGNvbnN0IHBvaW50SW5mbyA9IHRoaXMucG9pbnRJbmZvQnlDdXJzb3IuZ2V0KGN1cnNvcilcbiAgICAgICAgaWYgKHBvaW50SW5mbykge1xuICAgICAgICAgIGNvbnN0IHtjdXJzb3JQb3NpdGlvbiwgc3RhcnRPZlNlbGVjdGlvbn0gPSBwb2ludEluZm9cbiAgICAgICAgICBpZiAoY3Vyc29yUG9zaXRpb24uaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpIHtcbiAgICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihzdGFydE9mU2VsZWN0aW9uKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc3VwZXIuc2VsZWN0KClcbiAgICB9XG5cbiAgICAvLyAqIFB1cnBvc2Ugb2YgcG9pbnRJbmZvQnlDdXJzb3I/IHNlZSAjMjM1IGZvciBkZXRhaWwuXG4gICAgLy8gV2hlbiBzdGF5T25UcmFuc2Zvcm1TdHJpbmcgaXMgZW5hYmxlZCwgY3Vyc29yIHBvcyBpcyBub3Qgc2V0IG9uIHN0YXJ0IG9mXG4gICAgLy8gb2Ygc2VsZWN0ZWQgcmFuZ2UuXG4gICAgLy8gQnV0IEkgd2FudCBmb2xsb3dpbmcgYmVoYXZpb3IsIHNvIG5lZWQgdG8gcHJlc2VydmUgcG9zaXRpb24gaW5mby5cbiAgICAvLyAgMS4gYHZqPi5gIC0+IGluZGVudCBzYW1lIHR3byByb3dzIHJlZ2FyZGxlc3Mgb2YgY3VycmVudCBjdXJzb3IncyByb3cuXG4gICAgLy8gIDIuIGB2aj5qLmAgLT4gaW5kZW50IHR3byByb3dzIGZyb20gY3Vyc29yJ3Mgcm93LlxuICAgIGZvciAoY29uc3QgY3Vyc29yIG9mIHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKSkge1xuICAgICAgY29uc3Qgc3RhcnRPZlNlbGVjdGlvbiA9IGN1cnNvci5zZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKS5zdGFydFxuICAgICAgdGhpcy5vbkRpZEZpbmlzaE9wZXJhdGlvbigoKSA9PiB7XG4gICAgICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgICAgdGhpcy5wb2ludEluZm9CeUN1cnNvci5zZXQoY3Vyc29yLCB7c3RhcnRPZlNlbGVjdGlvbiwgY3Vyc29yUG9zaXRpb259KVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbkN1cnJlbnRTZWxlY3Rpb24ucmVnaXN0ZXIoZmFsc2UpXG5cbmNsYXNzIE1vdmVMZWZ0IGV4dGVuZHMgTW90aW9uIHtcbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBjb25zdCBhbGxvd1dyYXAgPSB0aGlzLmdldENvbmZpZyhcIndyYXBMZWZ0UmlnaHRNb3Rpb25cIilcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKCkgPT4gbW92ZUN1cnNvckxlZnQoY3Vyc29yLCB7YWxsb3dXcmFwfSkpXG4gIH1cbn1cbk1vdmVMZWZ0LnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVJpZ2h0IGV4dGVuZHMgTW90aW9uIHtcbiAgY2FuV3JhcFRvTmV4dExpbmUoY3Vyc29yKSB7XG4gICAgaWYgKHRoaXMuaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSgpICYmICFjdXJzb3IuaXNBdEVuZE9mTGluZSgpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29uZmlnKFwid3JhcExlZnRSaWdodE1vdGlvblwiKVxuICAgIH1cbiAgfVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHRoaXMuZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhjdXJzb3JQb3NpdGlvbi5yb3cpXG4gICAgICBjb25zdCBhbGxvd1dyYXAgPSB0aGlzLmNhbldyYXBUb05leHRMaW5lKGN1cnNvcilcbiAgICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IpXG4gICAgICBpZiAoY3Vyc29yLmlzQXRFbmRPZkxpbmUoKSAmJiBhbGxvd1dyYXAgJiYgIXBvaW50SXNBdFZpbUVuZE9mRmlsZSh0aGlzLmVkaXRvciwgY3Vyc29yUG9zaXRpb24pKSB7XG4gICAgICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IsIHthbGxvd1dyYXB9KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbk1vdmVSaWdodC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVSaWdodEJ1ZmZlckNvbHVtbiBleHRlbmRzIE1vdGlvbiB7XG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgc2V0QnVmZmVyQ29sdW1uKGN1cnNvciwgY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpICsgdGhpcy5nZXRDb3VudCgpKVxuICB9XG59XG5Nb3ZlUmlnaHRCdWZmZXJDb2x1bW4ucmVnaXN0ZXIoZmFsc2UpXG5cbmNsYXNzIE1vdmVVcCBleHRlbmRzIE1vdGlvbiB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAgd3JhcCA9IGZhbHNlXG5cbiAgZ2V0QnVmZmVyUm93KHJvdykge1xuICAgIGNvbnN0IG1pbiA9IDBcbiAgICByb3cgPSB0aGlzLndyYXAgJiYgcm93ID09PSBtaW4gPyB0aGlzLmdldFZpbUxhc3RCdWZmZXJSb3coKSA6IGxpbWl0TnVtYmVyKHJvdyAtIDEsIHttaW59KVxuICAgIHJldHVybiB0aGlzLmdldEZvbGRTdGFydFJvd0ZvclJvdyhyb3cpXG4gIH1cblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiBzZXRCdWZmZXJSb3coY3Vyc29yLCB0aGlzLmdldEJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpKSlcbiAgfVxufVxuTW92ZVVwLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVVwV3JhcCBleHRlbmRzIE1vdmVVcCB7XG4gIHdyYXAgPSB0cnVlXG59XG5Nb3ZlVXBXcmFwLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZURvd24gZXh0ZW5kcyBNb3ZlVXAge1xuICB3aXNlID0gXCJsaW5ld2lzZVwiXG4gIHdyYXAgPSBmYWxzZVxuXG4gIGdldEJ1ZmZlclJvdyhyb3cpIHtcbiAgICBpZiAodGhpcy5lZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpKSB7XG4gICAgICByb3cgPSBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3codGhpcy5lZGl0b3IsIHJvdykuZW5kLnJvd1xuICAgIH1cbiAgICBjb25zdCBtYXggPSB0aGlzLmdldFZpbUxhc3RCdWZmZXJSb3coKVxuICAgIHJldHVybiB0aGlzLndyYXAgJiYgcm93ID49IG1heCA/IDAgOiBsaW1pdE51bWJlcihyb3cgKyAxLCB7bWF4fSlcbiAgfVxufVxuTW92ZURvd24ucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlRG93bldyYXAgZXh0ZW5kcyBNb3ZlRG93biB7XG4gIHdyYXAgPSB0cnVlXG59XG5Nb3ZlRG93bldyYXAucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVXBTY3JlZW4gZXh0ZW5kcyBNb3Rpb24ge1xuICB3aXNlID0gXCJsaW5ld2lzZVwiXG4gIGRpcmVjdGlvbiA9IFwidXBcIlxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiBtb3ZlQ3Vyc29yVXBTY3JlZW4oY3Vyc29yKSlcbiAgfVxufVxuTW92ZVVwU2NyZWVuLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZURvd25TY3JlZW4gZXh0ZW5kcyBNb3ZlVXBTY3JlZW4ge1xuICB3aXNlID0gXCJsaW5ld2lzZVwiXG4gIGRpcmVjdGlvbiA9IFwiZG93blwiXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IG1vdmVDdXJzb3JEb3duU2NyZWVuKGN1cnNvcikpXG4gIH1cbn1cbk1vdmVEb3duU2NyZWVuLnJlZ2lzdGVyKClcblxuLy8gTW92ZSBkb3duL3VwIHRvIEVkZ2Vcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNlZSB0OW1kL2F0b20tdmltLW1vZGUtcGx1cyMyMzZcbi8vIEF0IGxlYXN0IHYxLjcuMC4gYnVmZmVyUG9zaXRpb24gYW5kIHNjcmVlblBvc2l0aW9uIGNhbm5vdCBjb252ZXJ0IGFjY3VyYXRlbHlcbi8vIHdoZW4gcm93IGlzIGZvbGRlZC5cbmNsYXNzIE1vdmVVcFRvRWRnZSBleHRlbmRzIE1vdGlvbiB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAganVtcCA9IHRydWVcbiAgZGlyZWN0aW9uID0gXCJ1cFwiXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIHRoaXMuc2V0U2NyZWVuUG9zaXRpb25TYWZlbHkoY3Vyc29yLCB0aGlzLmdldFBvaW50KGN1cnNvci5nZXRTY3JlZW5Qb3NpdGlvbigpKSlcbiAgICB9KVxuICB9XG5cbiAgZ2V0UG9pbnQoZnJvbVBvaW50KSB7XG4gICAgY29uc3Qge2NvbHVtbn0gPSBmcm9tUG9pbnRcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiB0aGlzLmdldFNjYW5Sb3dzKGZyb21Qb2ludCkpIHtcbiAgICAgIGNvbnN0IHBvaW50ID0gbmV3IFBvaW50KHJvdywgY29sdW1uKVxuICAgICAgaWYgKHRoaXMuaXNFZGdlKHBvaW50KSkgcmV0dXJuIHBvaW50XG4gICAgfVxuICB9XG5cbiAgZ2V0U2NhblJvd3Moe3Jvd30pIHtcbiAgICByZXR1cm4gdGhpcy5kaXJlY3Rpb24gPT09IFwidXBcIlxuICAgICAgPyBnZXRMaXN0KGdldFZhbGlkVmltU2NyZWVuUm93KHRoaXMuZWRpdG9yLCByb3cgLSAxKSwgMCwgdHJ1ZSlcbiAgICAgIDogZ2V0TGlzdChnZXRWYWxpZFZpbVNjcmVlblJvdyh0aGlzLmVkaXRvciwgcm93ICsgMSksIHRoaXMuZ2V0VmltTGFzdFNjcmVlblJvdygpLCB0cnVlKVxuICB9XG5cbiAgaXNFZGdlKHBvaW50KSB7XG4gICAgaWYgKHRoaXMuaXNTdG9wcGFibGVQb2ludChwb2ludCkpIHtcbiAgICAgIC8vIElmIG9uZSBvZiBhYm92ZS9iZWxvdyBwb2ludCB3YXMgbm90IHN0b3BwYWJsZSwgaXQncyBFZGdlIVxuICAgICAgY29uc3QgYWJvdmUgPSBwb2ludC50cmFuc2xhdGUoWy0xLCAwXSlcbiAgICAgIGNvbnN0IGJlbG93ID0gcG9pbnQudHJhbnNsYXRlKFsrMSwgMF0pXG4gICAgICByZXR1cm4gIXRoaXMuaXNTdG9wcGFibGVQb2ludChhYm92ZSkgfHwgIXRoaXMuaXNTdG9wcGFibGVQb2ludChiZWxvdylcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG5cbiAgaXNTdG9wcGFibGVQb2ludChwb2ludCkge1xuICAgIGlmICh0aGlzLmlzTm9uV2hpdGVTcGFjZVBvaW50KHBvaW50KSB8fCB0aGlzLmlzRmlyc3RSb3dPckxhc3RSb3dBbmRTdG9wcGFibGUocG9pbnQpKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBsZWZ0UG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIGNvbnN0IHJpZ2h0UG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsICsxXSlcbiAgICAgIHJldHVybiB0aGlzLmlzTm9uV2hpdGVTcGFjZVBvaW50KGxlZnRQb2ludCkgJiYgdGhpcy5pc05vbldoaXRlU3BhY2VQb2ludChyaWdodFBvaW50KVxuICAgIH1cbiAgfVxuXG4gIGlzTm9uV2hpdGVTcGFjZVBvaW50KHBvaW50KSB7XG4gICAgY29uc3QgY2hhciA9IGdldFRleHRJblNjcmVlblJhbmdlKHRoaXMuZWRpdG9yLCBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9pbnQsIDAsIDEpKVxuICAgIHJldHVybiBjaGFyICE9IG51bGwgJiYgL1xcUy8udGVzdChjaGFyKVxuICB9XG5cbiAgaXNGaXJzdFJvd09yTGFzdFJvd0FuZFN0b3BwYWJsZShwb2ludCkge1xuICAgIC8vIEluIG5vcm1hbC1tb2RlIHdlIGFkanVzdCBjdXJzb3IgYnkgbW92aW5nLWxlZnQgaWYgY3Vyc29yIGF0IEVPTCBvZiBub24tYmxhbmsgcm93LlxuICAgIC8vIFNvIGV4cGxpY2l0bHkgZ3VhcmQgdG8gbm90IGFuc3dlciBpdCBzdG9wcGFibGUuXG4gICAgaWYgKHRoaXMuaXNNb2RlKFwibm9ybWFsXCIpICYmIHBvaW50SXNBdEVuZE9mTGluZUF0Tm9uRW1wdHlSb3codGhpcy5lZGl0b3IsIHBvaW50KSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHBvaW50LmlzRXF1YWwodGhpcy5lZGl0b3IuY2xpcFNjcmVlblBvc2l0aW9uKHBvaW50KSkgJiZcbiAgICAgICAgKHBvaW50LnJvdyA9PT0gMCB8fCBwb2ludC5yb3cgPT09IHRoaXMuZ2V0VmltTGFzdFNjcmVlblJvdygpKVxuICAgICAgKVxuICAgIH1cbiAgfVxufVxuTW92ZVVwVG9FZGdlLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZURvd25Ub0VkZ2UgZXh0ZW5kcyBNb3ZlVXBUb0VkZ2Uge1xuICBkaXJlY3Rpb24gPSBcImRvd25cIlxufVxuTW92ZURvd25Ub0VkZ2UucmVnaXN0ZXIoKVxuXG4vLyB3b3JkXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0V29yZCBleHRlbmRzIE1vdGlvbiB7XG4gIHdvcmRSZWdleCA9IG51bGxcblxuICBnZXRQb2ludChyZWdleCwgZnJvbSkge1xuICAgIGxldCB3b3JkUmFuZ2VcbiAgICBsZXQgZm91bmQgPSBmYWxzZVxuXG4gICAgdGhpcy5zY2FuRm9yd2FyZChyZWdleCwge2Zyb219LCBmdW5jdGlvbih7cmFuZ2UsIG1hdGNoVGV4dCwgc3RvcH0pIHtcbiAgICAgIHdvcmRSYW5nZSA9IHJhbmdlXG4gICAgICAvLyBJZ25vcmUgJ2VtcHR5IGxpbmUnIG1hdGNoZXMgYmV0d2VlbiAnXFxyJyBhbmQgJ1xcbidcbiAgICAgIGlmIChtYXRjaFRleHQgPT09IFwiXCIgJiYgcmFuZ2Uuc3RhcnQuY29sdW1uICE9PSAwKSByZXR1cm5cbiAgICAgIGlmIChyYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuKGZyb20pKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICBzdG9wKClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKGZvdW5kKSB7XG4gICAgICBjb25zdCBwb2ludCA9IHdvcmRSYW5nZS5zdGFydFxuICAgICAgcmV0dXJuIHBvaW50SXNBdEVuZE9mTGluZUF0Tm9uRW1wdHlSb3codGhpcy5lZGl0b3IsIHBvaW50KSAmJiAhcG9pbnQuaXNFcXVhbCh0aGlzLmdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgID8gcG9pbnQudHJhdmVyc2UoWzEsIDBdKVxuICAgICAgICA6IHBvaW50XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB3b3JkUmFuZ2UgPyB3b3JkUmFuZ2UuZW5kIDogZnJvbVxuICAgIH1cbiAgfVxuXG4gIC8vIFNwZWNpYWwgY2FzZTogXCJjd1wiIGFuZCBcImNXXCIgYXJlIHRyZWF0ZWQgbGlrZSBcImNlXCIgYW5kIFwiY0VcIiBpZiB0aGUgY3Vyc29yIGlzXG4gIC8vIG9uIGEgbm9uLWJsYW5rLiAgVGhpcyBpcyBiZWNhdXNlIFwiY3dcIiBpcyBpbnRlcnByZXRlZCBhcyBjaGFuZ2Utd29yZCwgYW5kIGFcbiAgLy8gd29yZCBkb2VzIG5vdCBpbmNsdWRlIHRoZSBmb2xsb3dpbmcgd2hpdGUgc3BhY2UuICB7Vmk6IFwiY3dcIiB3aGVuIG9uIGEgYmxhbmtcbiAgLy8gZm9sbG93ZWQgYnkgb3RoZXIgYmxhbmtzIGNoYW5nZXMgb25seSB0aGUgZmlyc3QgYmxhbms7IHRoaXMgaXMgcHJvYmFibHkgYVxuICAvLyBidWcsIGJlY2F1c2UgXCJkd1wiIGRlbGV0ZXMgYWxsIHRoZSBibGFua3N9XG4gIC8vXG4gIC8vIEFub3RoZXIgc3BlY2lhbCBjYXNlOiBXaGVuIHVzaW5nIHRoZSBcIndcIiBtb3Rpb24gaW4gY29tYmluYXRpb24gd2l0aCBhblxuICAvLyBvcGVyYXRvciBhbmQgdGhlIGxhc3Qgd29yZCBtb3ZlZCBvdmVyIGlzIGF0IHRoZSBlbmQgb2YgYSBsaW5lLCB0aGUgZW5kIG9mXG4gIC8vIHRoYXQgd29yZCBiZWNvbWVzIHRoZSBlbmQgb2YgdGhlIG9wZXJhdGVkIHRleHQsIG5vdCB0aGUgZmlyc3Qgd29yZCBpbiB0aGVcbiAgLy8gbmV4dCBsaW5lLlxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBpZiAocG9pbnRJc0F0VmltRW5kT2ZGaWxlKHRoaXMuZWRpdG9yLCBjdXJzb3JQb3NpdGlvbikpIHJldHVyblxuXG4gICAgY29uc3Qgd2FzT25XaGl0ZVNwYWNlID0gcG9pbnRJc09uV2hpdGVTcGFjZSh0aGlzLmVkaXRvciwgY3Vyc29yUG9zaXRpb24pXG4gICAgY29uc3QgaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSA9IHRoaXMuaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSgpXG5cbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKHtpc0ZpbmFsfSkgPT4ge1xuICAgICAgY29uc3QgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgaWYgKGlzRW1wdHlSb3codGhpcy5lZGl0b3IsIGN1cnNvclBvc2l0aW9uLnJvdykgJiYgaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSkge1xuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oY3Vyc29yUG9zaXRpb24udHJhdmVyc2UoWzEsIDBdKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gdGhpcy53b3JkUmVnZXggfHwgY3Vyc29yLndvcmRSZWdFeHAoKVxuICAgICAgICBsZXQgcG9pbnQgPSB0aGlzLmdldFBvaW50KHJlZ2V4LCBjdXJzb3JQb3NpdGlvbilcbiAgICAgICAgaWYgKGlzRmluYWwgJiYgaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSkge1xuICAgICAgICAgIGlmICh0aGlzLm9wZXJhdG9yLmlzKFwiQ2hhbmdlXCIpICYmICF3YXNPbldoaXRlU3BhY2UpIHtcbiAgICAgICAgICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7d29yZFJlZ2V4OiB0aGlzLndvcmRSZWdleH0pXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3codGhpcy5lZGl0b3IsIGN1cnNvclBvc2l0aW9uLnJvdykpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5Nb3ZlVG9OZXh0V29yZC5yZWdpc3RlcigpXG5cbi8vIGJcbmNsYXNzIE1vdmVUb1ByZXZpb3VzV29yZCBleHRlbmRzIE1vdGlvbiB7XG4gIHdvcmRSZWdleCA9IG51bGxcblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICBjb25zdCBwb2ludCA9IGN1cnNvci5nZXRCZWdpbm5pbmdPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24oe3dvcmRSZWdleDogdGhpcy53b3JkUmVnZXh9KVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgIH0pXG4gIH1cbn1cbk1vdmVUb1ByZXZpb3VzV29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb0VuZE9mV29yZCBleHRlbmRzIE1vdGlvbiB7XG4gIHdvcmRSZWdleCA9IG51bGxcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuXG4gIG1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKSB7XG4gICAgbW92ZUN1cnNvclRvTmV4dE5vbldoaXRlc3BhY2UoY3Vyc29yKVxuICAgIGNvbnN0IHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7d29yZFJlZ2V4OiB0aGlzLndvcmRSZWdleH0pLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihQb2ludC5taW4ocG9pbnQsIHRoaXMuZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKSkpXG4gIH1cblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICBjb25zdCBvcmlnaW5hbFBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHRoaXMubW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG4gICAgICBpZiAob3JpZ2luYWxQb2ludC5pc0VxdWFsKGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKSkge1xuICAgICAgICAvLyBSZXRyeSBmcm9tIHJpZ2h0IGNvbHVtbiBpZiBjdXJzb3Igd2FzIGFscmVhZHkgb24gRW5kT2ZXb3JkXG4gICAgICAgIGN1cnNvci5tb3ZlUmlnaHQoKVxuICAgICAgICB0aGlzLm1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbk1vdmVUb0VuZE9mV29yZC5yZWdpc3RlcigpXG5cbi8vIFtUT0RPOiBJbXByb3ZlLCBhY2N1cmFjeV1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkIHtcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgY29uc3Qgd29yZFJhbmdlID0gY3Vyc29yLmdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2UoKVxuICAgIGNvbnN0IGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIC8vIGlmIHdlJ3JlIGluIHRoZSBtaWRkbGUgb2YgYSB3b3JkIHRoZW4gd2UgbmVlZCB0byBtb3ZlIHRvIGl0cyBzdGFydFxuICAgIGxldCB0aW1lcyA9IHRoaXMuZ2V0Q291bnQoKVxuICAgIGlmIChjdXJzb3JQb3NpdGlvbi5pc0dyZWF0ZXJUaGFuKHdvcmRSYW5nZS5zdGFydCkgJiYgY3Vyc29yUG9zaXRpb24uaXNMZXNzVGhhbih3b3JkUmFuZ2UuZW5kKSkge1xuICAgICAgdGltZXMgKz0gMVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgaSBpbiBnZXRMaXN0KDEsIHRpbWVzKSkge1xuICAgICAgY29uc3QgcG9pbnQgPSBjdXJzb3IuZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHt3b3JkUmVnZXg6IHRoaXMud29yZFJlZ2V4fSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICB9XG5cbiAgICB0aGlzLm1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKVxuICAgIGlmIChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS5pc0dyZWF0ZXJUaGFuT3JFcXVhbChjdXJzb3JQb3NpdGlvbikpIHtcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbMCwgMF0pXG4gICAgfVxuICB9XG5cbiAgbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpIHtcbiAgICBjb25zdCBwb2ludCA9IGN1cnNvci5nZXRFbmRPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24oe3dvcmRSZWdleDogdGhpcy53b3JkUmVnZXh9KS50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oUG9pbnQubWluKHBvaW50LCB0aGlzLmdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKCkpKVxuICB9XG59XG5Nb3ZlVG9QcmV2aW91c0VuZE9mV29yZC5yZWdpc3RlcigpXG5cbi8vIFdob2xlIHdvcmRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZCB7XG4gIHdvcmRSZWdleCA9IC9eJHxcXFMrL2dcbn1cbk1vdmVUb05leHRXaG9sZVdvcmQucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1dob2xlV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZCB7XG4gIHdvcmRSZWdleCA9IC9eJHxcXFMrL2dcbn1cbk1vdmVUb1ByZXZpb3VzV2hvbGVXb3JkLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvRW5kT2ZXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmQge1xuICB3b3JkUmVnZXggPSAvXFxTKy9cbn1cbk1vdmVUb0VuZE9mV2hvbGVXb3JkLnJlZ2lzdGVyKClcblxuLy8gW1RPRE86IEltcHJvdmUsIGFjY3VyYWN5XVxuY2xhc3MgTW92ZVRvUHJldmlvdXNFbmRPZldob2xlV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXb3JkIHtcbiAgd29yZFJlZ2V4ID0gL1xcUysvXG59XG5Nb3ZlVG9QcmV2aW91c0VuZE9mV2hvbGVXb3JkLnJlZ2lzdGVyKClcblxuLy8gQWxwaGFudW1lcmljIHdvcmQgW0V4cGVyaW1lbnRhbF1cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRBbHBoYW51bWVyaWNXb3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmQge1xuICB3b3JkUmVnZXggPSAvXFx3Ky9nXG59XG5Nb3ZlVG9OZXh0QWxwaGFudW1lcmljV29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzQWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZCB7XG4gIHdvcmRSZWdleCA9IC9cXHcrL1xufVxuTW92ZVRvUHJldmlvdXNBbHBoYW51bWVyaWNXb3JkLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvRW5kT2ZBbHBoYW51bWVyaWNXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkIHtcbiAgd29yZFJlZ2V4ID0gL1xcdysvXG59XG5Nb3ZlVG9FbmRPZkFscGhhbnVtZXJpY1dvcmQucmVnaXN0ZXIoKVxuXG4vLyBBbHBoYW51bWVyaWMgd29yZCBbRXhwZXJpbWVudGFsXVxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvTmV4dFNtYXJ0V29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkIHtcbiAgd29yZFJlZ2V4ID0gL1tcXHctXSsvZ1xufVxuTW92ZVRvTmV4dFNtYXJ0V29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkIHtcbiAgd29yZFJlZ2V4ID0gL1tcXHctXSsvXG59XG5Nb3ZlVG9QcmV2aW91c1NtYXJ0V29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb0VuZE9mU21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkIHtcbiAgd29yZFJlZ2V4ID0gL1tcXHctXSsvXG59XG5Nb3ZlVG9FbmRPZlNtYXJ0V29yZC5yZWdpc3RlcigpXG5cbi8vIFN1YndvcmRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRTdWJ3b3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmQge1xuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMud29yZFJlZ2V4ID0gY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHN1cGVyLm1vdmVDdXJzb3IoY3Vyc29yKVxuICB9XG59XG5Nb3ZlVG9OZXh0U3Vid29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU3Vid29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZCB7XG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy53b3JkUmVnZXggPSBjdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgc3VwZXIubW92ZUN1cnNvcihjdXJzb3IpXG4gIH1cbn1cbk1vdmVUb1ByZXZpb3VzU3Vid29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb0VuZE9mU3Vid29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZCB7XG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy53b3JkUmVnZXggPSBjdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgc3VwZXIubW92ZUN1cnNvcihjdXJzb3IpXG4gIH1cbn1cbk1vdmVUb0VuZE9mU3Vid29yZC5yZWdpc3RlcigpXG5cbi8vIFNlbnRlbmNlXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBTZW50ZW5jZSBpcyBkZWZpbmVkIGFzIGJlbG93XG4vLyAgLSBlbmQgd2l0aCBbJy4nLCAnIScsICc/J11cbi8vICAtIG9wdGlvbmFsbHkgZm9sbG93ZWQgYnkgWycpJywgJ10nLCAnXCInLCBcIidcIl1cbi8vICAtIGZvbGxvd2VkIGJ5IFsnJCcsICcgJywgJ1xcdCddXG4vLyAgLSBwYXJhZ3JhcGggYm91bmRhcnkgaXMgYWxzbyBzZW50ZW5jZSBib3VuZGFyeVxuLy8gIC0gc2VjdGlvbiBib3VuZGFyeSBpcyBhbHNvIHNlbnRlbmNlIGJvdW5kYXJ5KGlnbm9yZSlcbmNsYXNzIE1vdmVUb05leHRTZW50ZW5jZSBleHRlbmRzIE1vdGlvbiB7XG4gIGp1bXAgPSB0cnVlXG4gIHNlbnRlbmNlUmVnZXggPSBuZXcgUmVnRXhwKGAoPzpbXFxcXC4hXFxcXD9dW1xcXFwpXFxcXF1cIiddKlxcXFxzKyl8KFxcXFxufFxcXFxyXFxcXG4pYCwgXCJnXCIpXG4gIGRpcmVjdGlvbiA9IFwibmV4dFwiXG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKCkgPT4ge1xuICAgICAgdGhpcy5zZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpKVxuICAgIH0pXG4gIH1cblxuICBnZXRQb2ludChmcm9tUG9pbnQpIHtcbiAgICBpZiAodGhpcy5kaXJlY3Rpb24gPT09IFwibmV4dFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXROZXh0U3RhcnRPZlNlbnRlbmNlKGZyb21Qb2ludClcbiAgICB9IGVsc2UgaWYgKHRoaXMuZGlyZWN0aW9uID09PSBcInByZXZpb3VzXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldFByZXZpb3VzU3RhcnRPZlNlbnRlbmNlKGZyb21Qb2ludClcbiAgICB9XG4gIH1cblxuICBpc0JsYW5rUm93KHJvdykge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgfVxuXG4gIGdldE5leHRTdGFydE9mU2VudGVuY2UoZnJvbSkge1xuICAgIGxldCBmb3VuZFBvaW50XG4gICAgdGhpcy5zY2FuRm9yd2FyZCh0aGlzLnNlbnRlbmNlUmVnZXgsIHtmcm9tfSwgKHtyYW5nZSwgbWF0Y2hUZXh0LCBtYXRjaCwgc3RvcH0pID0+IHtcbiAgICAgIGlmIChtYXRjaFsxXSAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IFtzdGFydFJvdywgZW5kUm93XSA9IEFycmF5LmZyb20oW3JhbmdlLnN0YXJ0LnJvdywgcmFuZ2UuZW5kLnJvd10pXG4gICAgICAgIGlmICh0aGlzLnNraXBCbGFua1JvdyAmJiB0aGlzLmlzQmxhbmtSb3coZW5kUm93KSkgcmV0dXJuXG4gICAgICAgIGlmICh0aGlzLmlzQmxhbmtSb3coc3RhcnRSb3cpICE9PSB0aGlzLmlzQmxhbmtSb3coZW5kUm93KSkge1xuICAgICAgICAgIGZvdW5kUG9pbnQgPSB0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coZW5kUm93KVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZFBvaW50ID0gcmFuZ2UuZW5kXG4gICAgICB9XG4gICAgICBpZiAoZm91bmRQb2ludCkgc3RvcCgpXG4gICAgfSlcbiAgICByZXR1cm4gZm91bmRQb2ludCB8fCB0aGlzLmdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgfVxuXG4gIGdldFByZXZpb3VzU3RhcnRPZlNlbnRlbmNlKGZyb20pIHtcbiAgICBsZXQgZm91bmRQb2ludFxuICAgIHRoaXMuc2NhbkJhY2t3YXJkKHRoaXMuc2VudGVuY2VSZWdleCwge2Zyb219LCAoe3JhbmdlLCBtYXRjaCwgc3RvcCwgbWF0Y2hUZXh0fSkgPT4ge1xuICAgICAgaWYgKG1hdGNoWzFdICE9IG51bGwpIHtcbiAgICAgICAgY29uc3QgW3N0YXJ0Um93LCBlbmRSb3ddID0gQXJyYXkuZnJvbShbcmFuZ2Uuc3RhcnQucm93LCByYW5nZS5lbmQucm93XSlcbiAgICAgICAgaWYgKCF0aGlzLmlzQmxhbmtSb3coZW5kUm93KSAmJiB0aGlzLmlzQmxhbmtSb3coc3RhcnRSb3cpKSB7XG4gICAgICAgICAgY29uc3QgcG9pbnQgPSB0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coZW5kUm93KVxuICAgICAgICAgIGlmIChwb2ludC5pc0xlc3NUaGFuKGZyb20pKSB7XG4gICAgICAgICAgICBmb3VuZFBvaW50ID0gcG9pbnRcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuc2tpcEJsYW5rUm93KSByZXR1cm5cbiAgICAgICAgICAgIGZvdW5kUG9pbnQgPSB0aGlzLmdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coc3RhcnRSb3cpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocmFuZ2UuZW5kLmlzTGVzc1RoYW4oZnJvbSkpIGZvdW5kUG9pbnQgPSByYW5nZS5lbmRcbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZFBvaW50KSBzdG9wKClcbiAgICB9KVxuICAgIHJldHVybiBmb3VuZFBvaW50IHx8IFswLCAwXVxuICB9XG59XG5Nb3ZlVG9OZXh0U2VudGVuY2UucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlIGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlIHtcbiAgZGlyZWN0aW9uID0gXCJwcmV2aW91c1wiXG59XG5Nb3ZlVG9QcmV2aW91c1NlbnRlbmNlLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvTmV4dFNlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlIHtcbiAgc2tpcEJsYW5rUm93ID0gdHJ1ZVxufVxuTW92ZVRvTmV4dFNlbnRlbmNlU2tpcEJsYW5rUm93LnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTZW50ZW5jZVNraXBCbGFua1JvdyBleHRlbmRzIE1vdmVUb1ByZXZpb3VzU2VudGVuY2Uge1xuICBza2lwQmxhbmtSb3cgPSB0cnVlXG59XG5Nb3ZlVG9QcmV2aW91c1NlbnRlbmNlU2tpcEJsYW5rUm93LnJlZ2lzdGVyKClcblxuLy8gUGFyYWdyYXBoXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0UGFyYWdyYXBoIGV4dGVuZHMgTW90aW9uIHtcbiAganVtcCA9IHRydWVcbiAgZGlyZWN0aW9uID0gXCJuZXh0XCJcblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMubW92ZUN1cnNvckNvdW50VGltZXMoY3Vyc29yLCAoKSA9PiB7XG4gICAgICB0aGlzLnNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5KGN1cnNvciwgdGhpcy5nZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpXG4gICAgfSlcbiAgfVxuXG4gIGdldFBvaW50KGZyb21Qb2ludCkge1xuICAgIGNvbnN0IHN0YXJ0Um93ID0gZnJvbVBvaW50LnJvd1xuICAgIGxldCB3YXNBdE5vbkJsYW5rUm93ID0gIXRoaXMuZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsoc3RhcnRSb3cpXG4gICAgZm9yIChsZXQgcm93IG9mIGdldEJ1ZmZlclJvd3ModGhpcy5lZGl0b3IsIHtzdGFydFJvdywgZGlyZWN0aW9uOiB0aGlzLmRpcmVjdGlvbn0pKSB7XG4gICAgICBpZiAodGhpcy5lZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpKSB7XG4gICAgICAgIGlmICh3YXNBdE5vbkJsYW5rUm93KSByZXR1cm4gbmV3IFBvaW50KHJvdywgMClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHdhc0F0Tm9uQmxhbmtSb3cgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZmFsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5kaXJlY3Rpb24gPT09IFwicHJldmlvdXNcIiA/IG5ldyBQb2ludCgwLCAwKSA6IHRoaXMuZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKVxuICB9XG59XG5Nb3ZlVG9OZXh0UGFyYWdyYXBoLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNQYXJhZ3JhcGggZXh0ZW5kcyBNb3ZlVG9OZXh0UGFyYWdyYXBoIHtcbiAgZGlyZWN0aW9uID0gXCJwcmV2aW91c1wiXG59XG5Nb3ZlVG9QcmV2aW91c1BhcmFncmFwaC5yZWdpc3RlcigpXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGtleW1hcDogMFxuY2xhc3MgTW92ZVRvQmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBzZXRCdWZmZXJDb2x1bW4oY3Vyc29yLCAwKVxuICB9XG59XG5Nb3ZlVG9CZWdpbm5pbmdPZkxpbmUucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9Db2x1bW4gZXh0ZW5kcyBNb3Rpb24ge1xuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHNldEJ1ZmZlckNvbHVtbihjdXJzb3IsIHRoaXMuZ2V0Q291bnQoLTEpKVxuICB9XG59XG5Nb3ZlVG9Db2x1bW4ucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBjb25zdCByb3cgPSBnZXRWYWxpZFZpbUJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpICsgdGhpcy5nZXRDb3VudCgtMSkpXG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFtyb3csIEluZmluaXR5XSlcbiAgICBjdXJzb3IuZ29hbENvbHVtbiA9IEluZmluaXR5XG4gIH1cbn1cbk1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9MYXN0Tm9uYmxhbmtDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW90aW9uIHtcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpKVxuICB9XG5cbiAgZ2V0UG9pbnQoe3Jvd30pIHtcbiAgICByb3cgPSBsaW1pdE51bWJlcihyb3cgKyB0aGlzLmdldENvdW50KC0xKSwge21heDogdGhpcy5nZXRWaW1MYXN0QnVmZmVyUm93KCl9KVxuICAgIGNvbnN0IHJhbmdlID0gZmluZFJhbmdlSW5CdWZmZXJSb3codGhpcy5lZGl0b3IsIC9cXFN8Xi8sIHJvdywge2RpcmVjdGlvbjogXCJiYWNrd2FyZFwifSlcbiAgICByZXR1cm4gcmFuZ2UgPyByYW5nZS5zdGFydCA6IG5ldyBQb2ludChyb3csIDApXG4gIH1cbn1cbk1vdmVUb0xhc3ROb25ibGFua0NoYXJhY3Rlck9mTGluZUFuZERvd24ucmVnaXN0ZXIoKVxuXG4vLyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSBmYWltaWx5XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIF5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgdGhpcy5zZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KVxuICB9XG59XG5Nb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZS5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lVXAgZXh0ZW5kcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgZnVuY3Rpb24oKSB7XG4gICAgICBjb25zdCBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBpZiAocG9pbnQucm93ID4gMCkge1xuICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQudHJhbnNsYXRlKFstMSwgMF0pKVxuICAgICAgfVxuICAgIH0pXG4gICAgc3VwZXIubW92ZUN1cnNvcihjdXJzb3IpXG4gIH1cbn1cbk1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lVXAucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZURvd24gZXh0ZW5kcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKCkgPT4ge1xuICAgICAgY29uc3QgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgaWYgKHBvaW50LnJvdyA8IHRoaXMuZ2V0VmltTGFzdEJ1ZmZlclJvdygpKSB7XG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoWysxLCAwXSkpXG4gICAgICB9XG4gICAgfSlcbiAgICBzdXBlci5tb3ZlQ3Vyc29yKGN1cnNvcilcbiAgfVxufVxuTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duIHtcbiAgZ2V0Q291bnQoKSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldENvdW50KC0xKVxuICB9XG59XG5Nb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZUFuZERvd24ucmVnaXN0ZXIoKVxuXG4vLyBrZXltYXA6IGcgZ1xuY2xhc3MgTW92ZVRvRmlyc3RMaW5lIGV4dGVuZHMgTW90aW9uIHtcbiAgd2lzZSA9IFwibGluZXdpc2VcIlxuICBqdW1wID0gdHJ1ZVxuICB2ZXJ0aWNhbE1vdGlvbiA9IHRydWVcbiAgbW92ZVN1Y2Nlc3NPbkxpbmV3aXNlID0gdHJ1ZVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy5zZXRDdXJzb3JCdWZmZXJSb3coY3Vyc29yLCBnZXRWYWxpZFZpbUJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgdGhpcy5nZXRSb3coKSkpXG4gICAgY3Vyc29yLmF1dG9zY3JvbGwoe2NlbnRlcjogdHJ1ZX0pXG4gIH1cblxuICBnZXRSb3coKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q291bnQoLTEpXG4gIH1cbn1cbk1vdmVUb0ZpcnN0TGluZS5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb1NjcmVlbkNvbHVtbiBleHRlbmRzIE1vdGlvbiB7XG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgY29uc3QgYWxsb3dPZmZTY3JlZW5Qb3NpdGlvbiA9IHRoaXMuZ2V0Q29uZmlnKFwiYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb25cIilcbiAgICBjb25zdCBwb2ludCA9IGdldFNjcmVlblBvc2l0aW9uRm9yU2NyZWVuUm93KHRoaXMuZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCksIHRoaXMud2hpY2gsIHtcbiAgICAgIGFsbG93T2ZmU2NyZWVuUG9zaXRpb24sXG4gICAgfSlcbiAgICB0aGlzLnNldFNjcmVlblBvc2l0aW9uU2FmZWx5KGN1cnNvciwgcG9pbnQpXG4gIH1cbn1cbk1vdmVUb1NjcmVlbkNvbHVtbi5yZWdpc3RlcihmYWxzZSlcblxuLy8ga2V5bWFwOiBnIDBcbmNsYXNzIE1vdmVUb0JlZ2lubmluZ09mU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb1NjcmVlbkNvbHVtbiB7XG4gIHdoaWNoID0gXCJiZWdpbm5pbmdcIlxufVxuTW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lLnJlZ2lzdGVyKClcblxuLy8gZyBeOiBgbW92ZS10by1maXJzdC1jaGFyYWN0ZXItb2Ytc2NyZWVuLWxpbmVgXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb1NjcmVlbkNvbHVtbiB7XG4gIHdoaWNoID0gXCJmaXJzdC1jaGFyYWN0ZXJcIlxufVxuTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZlNjcmVlbkxpbmUucmVnaXN0ZXIoKVxuXG4vLyBrZXltYXA6IGcgJFxuY2xhc3MgTW92ZVRvTGFzdENoYXJhY3Rlck9mU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb1NjcmVlbkNvbHVtbiB7XG4gIHdoaWNoID0gXCJsYXN0LWNoYXJhY3RlclwiXG59XG5Nb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZTY3JlZW5MaW5lLnJlZ2lzdGVyKClcblxuLy8ga2V5bWFwOiBHXG5jbGFzcyBNb3ZlVG9MYXN0TGluZSBleHRlbmRzIE1vdmVUb0ZpcnN0TGluZSB7XG4gIGRlZmF1bHRDb3VudCA9IEluZmluaXR5XG59XG5Nb3ZlVG9MYXN0TGluZS5yZWdpc3RlcigpXG5cbi8vIGtleW1hcDogTiUgZS5nLiAxMCVcbmNsYXNzIE1vdmVUb0xpbmVCeVBlcmNlbnQgZXh0ZW5kcyBNb3ZlVG9GaXJzdExpbmUge1xuICBnZXRSb3coKSB7XG4gICAgY29uc3QgcGVyY2VudCA9IGxpbWl0TnVtYmVyKHRoaXMuZ2V0Q291bnQoKSwge21heDogMTAwfSlcbiAgICByZXR1cm4gTWF0aC5mbG9vcigodGhpcy5lZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxKSAqIChwZXJjZW50IC8gMTAwKSlcbiAgfVxufVxuTW92ZVRvTGluZUJ5UGVyY2VudC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZSBleHRlbmRzIE1vdGlvbiB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAgbW92ZVN1Y2Nlc3NPbkxpbmV3aXNlID0gdHJ1ZVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgbGV0IHJvd1xuICAgIGxldCBjb3VudCA9IHRoaXMuZ2V0Q291bnQoKVxuICAgIGlmIChjb3VudCA8IDApIHtcbiAgICAgIC8vIFN1cHBvcnQgbmVnYXRpdmUgY291bnRcbiAgICAgIC8vIE5lZ2F0aXZlIGNvdW50IGNhbiBiZSBwYXNzZWQgbGlrZSBgb3BlcmF0aW9uU3RhY2sucnVuKFwiTW92ZVRvUmVsYXRpdmVMaW5lXCIsIHtjb3VudDogLTV9KWAuXG4gICAgICAvLyBDdXJyZW50bHkgdXNlZCBpbiB2aW0tbW9kZS1wbHVzLWV4LW1vZGUgcGtnLlxuICAgICAgY291bnQgKz0gMVxuICAgICAgcm93ID0gdGhpcy5nZXRGb2xkU3RhcnRSb3dGb3JSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgICAgd2hpbGUgKGNvdW50KysgPCAwKSByb3cgPSB0aGlzLmdldEZvbGRTdGFydFJvd0ZvclJvdyhyb3cgLSAxKVxuICAgIH0gZWxzZSB7XG4gICAgICBjb3VudCAtPSAxXG4gICAgICByb3cgPSB0aGlzLmdldEZvbGRFbmRSb3dGb3JSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgICAgd2hpbGUgKGNvdW50LS0gPiAwKSByb3cgPSB0aGlzLmdldEZvbGRFbmRSb3dGb3JSb3cocm93ICsgMSlcbiAgICB9XG4gICAgc2V0QnVmZmVyUm93KGN1cnNvciwgcm93KVxuICB9XG59XG5Nb3ZlVG9SZWxhdGl2ZUxpbmUucmVnaXN0ZXIoZmFsc2UpXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZU1pbmltdW1Ud28gZXh0ZW5kcyBNb3ZlVG9SZWxhdGl2ZUxpbmUge1xuICBnZXRDb3VudCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIGxpbWl0TnVtYmVyKHN1cGVyLmdldENvdW50KC4uLmFyZ3MpLCB7bWluOiAyfSlcbiAgfVxufVxuTW92ZVRvUmVsYXRpdmVMaW5lTWluaW11bVR3by5yZWdpc3RlcihmYWxzZSlcblxuLy8gUG9zaXRpb24gY3Vyc29yIHdpdGhvdXQgc2Nyb2xsaW5nLiwgSCwgTSwgTFxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8ga2V5bWFwOiBIXG5jbGFzcyBNb3ZlVG9Ub3BPZlNjcmVlbiBleHRlbmRzIE1vdGlvbiB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAganVtcCA9IHRydWVcbiAgc2Nyb2xsb2ZmID0gMlxuICBkZWZhdWx0Q291bnQgPSAwXG4gIHZlcnRpY2FsTW90aW9uID0gdHJ1ZVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgY29uc3QgYnVmZmVyUm93ID0gdGhpcy5lZGl0b3IuYnVmZmVyUm93Rm9yU2NyZWVuUm93KHRoaXMuZ2V0U2NyZWVuUm93KCkpXG4gICAgdGhpcy5zZXRDdXJzb3JCdWZmZXJSb3coY3Vyc29yLCBidWZmZXJSb3cpXG4gIH1cblxuICBnZXRTY3JvbGxvZmYoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSgpID8gMCA6IHRoaXMuc2Nyb2xsb2ZmXG4gIH1cblxuICBnZXRTY3JlZW5Sb3coKSB7XG4gICAgY29uc3QgZmlyc3RSb3cgPSBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3codGhpcy5lZGl0b3IpXG4gICAgbGV0IG9mZnNldCA9IHRoaXMuZ2V0U2Nyb2xsb2ZmKClcbiAgICBpZiAoZmlyc3RSb3cgPT09IDApIHtcbiAgICAgIG9mZnNldCA9IDBcbiAgICB9XG4gICAgb2Zmc2V0ID0gbGltaXROdW1iZXIodGhpcy5nZXRDb3VudCgtMSksIHttaW46IG9mZnNldH0pXG4gICAgcmV0dXJuIGZpcnN0Um93ICsgb2Zmc2V0XG4gIH1cbn1cbk1vdmVUb1RvcE9mU2NyZWVuLnJlZ2lzdGVyKClcblxuLy8ga2V5bWFwOiBNXG5jbGFzcyBNb3ZlVG9NaWRkbGVPZlNjcmVlbiBleHRlbmRzIE1vdmVUb1RvcE9mU2NyZWVuIHtcbiAgZ2V0U2NyZWVuUm93KCkge1xuICAgIGNvbnN0IHN0YXJ0Um93ID0gZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KHRoaXMuZWRpdG9yKVxuICAgIGNvbnN0IGVuZFJvdyA9IGxpbWl0TnVtYmVyKHRoaXMuZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCksIHttYXg6IHRoaXMuZ2V0VmltTGFzdFNjcmVlblJvdygpfSlcbiAgICByZXR1cm4gc3RhcnRSb3cgKyBNYXRoLmZsb29yKChlbmRSb3cgLSBzdGFydFJvdykgLyAyKVxuICB9XG59XG5Nb3ZlVG9NaWRkbGVPZlNjcmVlbi5yZWdpc3RlcigpXG5cbi8vIGtleW1hcDogTFxuY2xhc3MgTW92ZVRvQm90dG9tT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9Ub3BPZlNjcmVlbiB7XG4gIGdldFNjcmVlblJvdygpIHtcbiAgICAvLyBbRklYTUVdXG4gICAgLy8gQXQgbGVhc3QgQXRvbSB2MS42LjAsIHRoZXJlIGFyZSB0d28gaW1wbGVtZW50YXRpb24gb2YgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIC8vIGVkaXRvci5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpIGFuZCBlZGl0b3JFbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICAvLyBUaG9zZSB0d28gbWV0aG9kcyByZXR1cm4gZGlmZmVyZW50IHZhbHVlLCBlZGl0b3IncyBvbmUgaXMgY29ycmVudC5cbiAgICAvLyBTbyBJIGludGVudGlvbmFsbHkgdXNlIGVkaXRvci5nZXRMYXN0U2NyZWVuUm93IGhlcmUuXG4gICAgY29uc3QgdmltTGFzdFNjcmVlblJvdyA9IHRoaXMuZ2V0VmltTGFzdFNjcmVlblJvdygpXG4gICAgY29uc3Qgcm93ID0gbGltaXROdW1iZXIodGhpcy5lZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSwge21heDogdmltTGFzdFNjcmVlblJvd30pXG4gICAgbGV0IG9mZnNldCA9IHRoaXMuZ2V0U2Nyb2xsb2ZmKCkgKyAxXG4gICAgaWYgKHJvdyA9PT0gdmltTGFzdFNjcmVlblJvdykge1xuICAgICAgb2Zmc2V0ID0gMFxuICAgIH1cbiAgICBvZmZzZXQgPSBsaW1pdE51bWJlcih0aGlzLmdldENvdW50KC0xKSwge21pbjogb2Zmc2V0fSlcbiAgICByZXR1cm4gcm93IC0gb2Zmc2V0XG4gIH1cbn1cbk1vdmVUb0JvdHRvbU9mU2NyZWVuLnJlZ2lzdGVyKClcblxuLy8gU2Nyb2xsaW5nXG4vLyBIYWxmOiBjdHJsLWQsIGN0cmwtdVxuLy8gRnVsbDogY3RybC1mLCBjdHJsLWJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFtGSVhNRV0gY291bnQgYmVoYXZlIGRpZmZlcmVudGx5IGZyb20gb3JpZ2luYWwgVmltLlxuY2xhc3MgU2Nyb2xsIGV4dGVuZHMgTW90aW9uIHtcbiAgdmVydGljYWxNb3Rpb24gPSB0cnVlXG5cbiAgaXNTbW9vdGhTY3JvbGxFbmFibGVkKCkge1xuICAgIHJldHVybiBNYXRoLmFicyh0aGlzLmFtb3VudE9mUGFnZSkgPT09IDFcbiAgICAgID8gdGhpcy5nZXRDb25maWcoXCJzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb25cIilcbiAgICAgIDogdGhpcy5nZXRDb25maWcoXCJzbW9vdGhTY3JvbGxPbkhhbGZTY3JvbGxNb3Rpb25cIilcbiAgfVxuXG4gIGdldFNtb290aFNjcm9sbER1YXRpb24oKSB7XG4gICAgcmV0dXJuIE1hdGguYWJzKHRoaXMuYW1vdW50T2ZQYWdlKSA9PT0gMVxuICAgICAgPyB0aGlzLmdldENvbmZpZyhcInNtb290aFNjcm9sbE9uRnVsbFNjcm9sbE1vdGlvbkR1cmF0aW9uXCIpXG4gICAgICA6IHRoaXMuZ2V0Q29uZmlnKFwic21vb3RoU2Nyb2xsT25IYWxmU2Nyb2xsTW90aW9uRHVyYXRpb25cIilcbiAgfVxuXG4gIGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KHJvdykge1xuICAgIGNvbnN0IHBvaW50ID0gbmV3IFBvaW50KHJvdywgMClcbiAgICByZXR1cm4gdGhpcy5lZGl0b3IuZWxlbWVudC5waXhlbFJlY3RGb3JTY3JlZW5SYW5nZShuZXcgUmFuZ2UocG9pbnQsIHBvaW50KSkudG9wXG4gIH1cblxuICBzbW9vdGhTY3JvbGwoZnJvbVJvdywgdG9Sb3csIGRvbmUpIHtcbiAgICBjb25zdCB0b3BQaXhlbEZyb20gPSB7dG9wOiB0aGlzLmdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KGZyb21Sb3cpfVxuICAgIGNvbnN0IHRvcFBpeGVsVG8gPSB7dG9wOiB0aGlzLmdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KHRvUm93KX1cbiAgICAvLyBbTk9URV1cbiAgICAvLyBpbnRlbnRpb25hbGx5IHVzZSBgZWxlbWVudC5jb21wb25lbnQuc2V0U2Nyb2xsVG9wYCBpbnN0ZWFkIG9mIGBlbGVtZW50LnNldFNjcm9sbFRvcGAuXG4gICAgLy8gU0luY2UgZWxlbWVudC5zZXRTY3JvbGxUb3Agd2lsbCB0aHJvdyBleGNlcHRpb24gd2hlbiBlbGVtZW50LmNvbXBvbmVudCBubyBsb25nZXIgZXhpc3RzLlxuICAgIGNvbnN0IHN0ZXAgPSBuZXdUb3AgPT4ge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yLmVsZW1lbnQuY29tcG9uZW50KSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmVsZW1lbnQuY29tcG9uZW50LnNldFNjcm9sbFRvcChuZXdUb3ApXG4gICAgICAgIHRoaXMuZWRpdG9yLmVsZW1lbnQuY29tcG9uZW50LnVwZGF0ZVN5bmMoKVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGR1cmF0aW9uID0gdGhpcy5nZXRTbW9vdGhTY3JvbGxEdWF0aW9uKClcbiAgICB0aGlzLnZpbVN0YXRlLnJlcXVlc3RTY3JvbGxBbmltYXRpb24odG9wUGl4ZWxGcm9tLCB0b3BQaXhlbFRvLCB7ZHVyYXRpb24sIHN0ZXAsIGRvbmV9KVxuICB9XG5cbiAgZ2V0QW1vdW50T2ZSb3dzKCkge1xuICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5hbW91bnRPZlBhZ2UgKiB0aGlzLmVkaXRvci5nZXRSb3dzUGVyUGFnZSgpICogdGhpcy5nZXRDb3VudCgpKVxuICB9XG5cbiAgZ2V0QnVmZmVyUm93KGN1cnNvcikge1xuICAgIGNvbnN0IHNjcmVlblJvdyA9IGdldFZhbGlkVmltU2NyZWVuUm93KHRoaXMuZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCkgKyB0aGlzLmdldEFtb3VudE9mUm93cygpKVxuICAgIHJldHVybiB0aGlzLmVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coc2NyZWVuUm93KVxuICB9XG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBjb25zdCBidWZmZXJSb3cgPSB0aGlzLmdldEJ1ZmZlclJvdyhjdXJzb3IpXG4gICAgdGhpcy5zZXRDdXJzb3JCdWZmZXJSb3coY3Vyc29yLCB0aGlzLmdldEJ1ZmZlclJvdyhjdXJzb3IpLCB7YXV0b3Njcm9sbDogZmFsc2V9KVxuXG4gICAgaWYgKGN1cnNvci5pc0xhc3RDdXJzb3IoKSkge1xuICAgICAgaWYgKHRoaXMuaXNTbW9vdGhTY3JvbGxFbmFibGVkKCkpIHRoaXMudmltU3RhdGUuZmluaXNoU2Nyb2xsQW5pbWF0aW9uKClcblxuICAgICAgY29uc3QgZmlyc3RWaXNpYmlsZVNjcmVlblJvdyA9IHRoaXMuZWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgICBjb25zdCBuZXdGaXJzdFZpc2liaWxlQnVmZmVyUm93ID0gdGhpcy5lZGl0b3IuYnVmZmVyUm93Rm9yU2NyZWVuUm93KFxuICAgICAgICBmaXJzdFZpc2liaWxlU2NyZWVuUm93ICsgdGhpcy5nZXRBbW91bnRPZlJvd3MoKVxuICAgICAgKVxuICAgICAgY29uc3QgbmV3Rmlyc3RWaXNpYmlsZVNjcmVlblJvdyA9IHRoaXMuZWRpdG9yLnNjcmVlblJvd0ZvckJ1ZmZlclJvdyhuZXdGaXJzdFZpc2liaWxlQnVmZmVyUm93KVxuICAgICAgY29uc3QgZG9uZSA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5lZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KG5ld0ZpcnN0VmlzaWJpbGVTY3JlZW5Sb3cpXG4gICAgICAgIC8vIFtGSVhNRV0gc29tZXRpbWVzLCBzY3JvbGxUb3AgaXMgbm90IHVwZGF0ZWQsIGNhbGxpbmcgdGhpcyBmaXguXG4gICAgICAgIC8vIEludmVzdGlnYXRlIGFuZCBmaW5kIGJldHRlciBhcHByb2FjaCB0aGVuIHJlbW92ZSB0aGlzIHdvcmthcm91bmQuXG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5lbGVtZW50LmNvbXBvbmVudCkgdGhpcy5lZGl0b3IuZWxlbWVudC5jb21wb25lbnQudXBkYXRlU3luYygpXG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmlzU21vb3RoU2Nyb2xsRW5hYmxlZCgpKSB0aGlzLnNtb290aFNjcm9sbChmaXJzdFZpc2liaWxlU2NyZWVuUm93LCBuZXdGaXJzdFZpc2liaWxlU2NyZWVuUm93LCBkb25lKVxuICAgICAgZWxzZSBkb25lKClcbiAgICB9XG4gIH1cbn1cblNjcm9sbC5yZWdpc3RlcihmYWxzZSlcblxuLy8ga2V5bWFwOiBjdHJsLWZcbmNsYXNzIFNjcm9sbEZ1bGxTY3JlZW5Eb3duIGV4dGVuZHMgU2Nyb2xsIHtcbiAgYW1vdW50T2ZQYWdlID0gKzFcbn1cblNjcm9sbEZ1bGxTY3JlZW5Eb3duLnJlZ2lzdGVyKClcblxuLy8ga2V5bWFwOiBjdHJsLWJcbmNsYXNzIFNjcm9sbEZ1bGxTY3JlZW5VcCBleHRlbmRzIFNjcm9sbCB7XG4gIGFtb3VudE9mUGFnZSA9IC0xXG59XG5TY3JvbGxGdWxsU2NyZWVuVXAucmVnaXN0ZXIoKVxuXG4vLyBrZXltYXA6IGN0cmwtZFxuY2xhc3MgU2Nyb2xsSGFsZlNjcmVlbkRvd24gZXh0ZW5kcyBTY3JvbGwge1xuICBhbW91bnRPZlBhZ2UgPSArMSAvIDJcbn1cblNjcm9sbEhhbGZTY3JlZW5Eb3duLnJlZ2lzdGVyKClcblxuLy8ga2V5bWFwOiBjdHJsLXVcbmNsYXNzIFNjcm9sbEhhbGZTY3JlZW5VcCBleHRlbmRzIFNjcm9sbCB7XG4gIGFtb3VudE9mUGFnZSA9IC0xIC8gMlxufVxuU2Nyb2xsSGFsZlNjcmVlblVwLnJlZ2lzdGVyKClcblxuLy8gRmluZFxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8ga2V5bWFwOiBmXG5jbGFzcyBGaW5kIGV4dGVuZHMgTW90aW9uIHtcbiAgYmFja3dhcmRzID0gZmFsc2VcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuICBvZmZzZXQgPSAwXG4gIHJlcXVpcmVJbnB1dCA9IHRydWVcbiAgY2FzZVNlbnNpdGl2aXR5S2luZCA9IFwiRmluZFwiXG5cbiAgcmVzdG9yZUVkaXRvclN0YXRlKCkge1xuICAgIGlmICh0aGlzLl9yZXN0b3JlRWRpdG9yU3RhdGUpIHRoaXMuX3Jlc3RvcmVFZGl0b3JTdGF0ZSgpXG4gICAgdGhpcy5fcmVzdG9yZUVkaXRvclN0YXRlID0gbnVsbFxuICB9XG5cbiAgY2FuY2VsT3BlcmF0aW9uKCkge1xuICAgIHRoaXMucmVzdG9yZUVkaXRvclN0YXRlKClcbiAgICBzdXBlci5jYW5jZWxPcGVyYXRpb24oKVxuICB9XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBpZiAodGhpcy5nZXRDb25maWcoXCJyZXVzZUZpbmRGb3JSZXBlYXRGaW5kXCIpKSB0aGlzLnJlcGVhdElmTmVjZXNzYXJ5KClcbiAgICBpZiAoIXRoaXMuaXNDb21wbGV0ZSgpKSB7XG4gICAgICBjb25zdCBjaGFyc01heCA9IHRoaXMuZ2V0Q29uZmlnKFwiZmluZENoYXJzTWF4XCIpXG4gICAgICBjb25zdCBvcHRpb25zQmFzZSA9IHtwdXJwb3NlOiBcImZpbmRcIiwgY2hhcnNNYXh9XG5cbiAgICAgIGlmIChjaGFyc01heCA9PT0gMSkge1xuICAgICAgICB0aGlzLmZvY3VzSW5wdXQob3B0aW9uc0Jhc2UpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9yZXN0b3JlRWRpdG9yU3RhdGUgPSBzYXZlRWRpdG9yU3RhdGUodGhpcy5lZGl0b3IpXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgYXV0b0NvbmZpcm1UaW1lb3V0OiB0aGlzLmdldENvbmZpZyhcImZpbmRDb25maXJtQnlUaW1lb3V0XCIpLFxuICAgICAgICAgIG9uQ29uZmlybTogaW5wdXQgPT4ge1xuICAgICAgICAgICAgdGhpcy5pbnB1dCA9IGlucHV0XG4gICAgICAgICAgICBpZiAoaW5wdXQpIHRoaXMucHJvY2Vzc09wZXJhdGlvbigpXG4gICAgICAgICAgICBlbHNlIHRoaXMuY2FuY2VsT3BlcmF0aW9uKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2hhbmdlOiBwcmVDb25maXJtZWRDaGFycyA9PiB7XG4gICAgICAgICAgICB0aGlzLnByZUNvbmZpcm1lZENoYXJzID0gcHJlQ29uZmlybWVkQ2hhcnNcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93cyh0aGlzLnByZUNvbmZpcm1lZENoYXJzLCBcInByZS1jb25maXJtXCIsIHRoaXMuaXNCYWNrd2FyZHMoKSlcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQ2FuY2VsOiAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpbVN0YXRlLmhpZ2hsaWdodEZpbmQuY2xlYXJNYXJrZXJzKClcbiAgICAgICAgICAgIHRoaXMuY2FuY2VsT3BlcmF0aW9uKClcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNvbW1hbmRzOiB7XG4gICAgICAgICAgICBcInZpbS1tb2RlLXBsdXM6ZmluZC1uZXh0LXByZS1jb25maXJtZWRcIjogKCkgPT4gdGhpcy5maW5kUHJlQ29uZmlybWVkKCsxKSxcbiAgICAgICAgICAgIFwidmltLW1vZGUtcGx1czpmaW5kLXByZXZpb3VzLXByZS1jb25maXJtZWRcIjogKCkgPT4gdGhpcy5maW5kUHJlQ29uZmlybWVkKC0xKSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XG4gICAgICAgIHRoaXMuZm9jdXNJbnB1dChPYmplY3QuYXNzaWduKG9wdGlvbnMsIG9wdGlvbnNCYXNlKSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgZmluZFByZUNvbmZpcm1lZChkZWx0YSkge1xuICAgIGlmICh0aGlzLnByZUNvbmZpcm1lZENoYXJzICYmIHRoaXMuZ2V0Q29uZmlnKFwiaGlnaGxpZ2h0RmluZENoYXJcIikpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5oaWdobGlnaHRUZXh0SW5DdXJzb3JSb3dzKFxuICAgICAgICB0aGlzLnByZUNvbmZpcm1lZENoYXJzLFxuICAgICAgICBcInByZS1jb25maXJtXCIsXG4gICAgICAgIHRoaXMuaXNCYWNrd2FyZHMoKSxcbiAgICAgICAgdGhpcy5nZXRDb3VudCgtMSkgKyBkZWx0YSxcbiAgICAgICAgdHJ1ZVxuICAgICAgKVxuICAgICAgdGhpcy5jb3VudCA9IGluZGV4ICsgMVxuICAgIH1cbiAgfVxuXG4gIHJlcGVhdElmTmVjZXNzYXJ5KCkge1xuICAgIGNvbnN0IGZpbmRDb21tYW5kTmFtZXMgPSBbXCJGaW5kXCIsIFwiRmluZEJhY2t3YXJkc1wiLCBcIlRpbGxcIiwgXCJUaWxsQmFja3dhcmRzXCJdXG4gICAgY29uc3QgY3VycmVudEZpbmQgPSB0aGlzLmdsb2JhbFN0YXRlLmdldChcImN1cnJlbnRGaW5kXCIpXG4gICAgaWYgKGN1cnJlbnRGaW5kICYmIGZpbmRDb21tYW5kTmFtZXMuaW5jbHVkZXModGhpcy52aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5nZXRMYXN0Q29tbWFuZE5hbWUoKSkpIHtcbiAgICAgIHRoaXMuaW5wdXQgPSBjdXJyZW50RmluZC5pbnB1dFxuICAgICAgdGhpcy5yZXBlYXRlZCA9IHRydWVcbiAgICB9XG4gIH1cblxuICBpc0JhY2t3YXJkcygpIHtcbiAgICByZXR1cm4gdGhpcy5iYWNrd2FyZHNcbiAgfVxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gICAgbGV0IGRlY29yYXRpb25UeXBlID0gXCJwb3N0LWNvbmZpcm1cIlxuICAgIGlmICh0aGlzLm9wZXJhdG9yICYmICF0aGlzLm9wZXJhdG9yLmluc3RhbmNlb2YoXCJTZWxlY3RCYXNlXCIpKSB7XG4gICAgICBkZWNvcmF0aW9uVHlwZSArPSBcIiBsb25nXCJcbiAgICB9XG5cbiAgICAvLyBIQUNLOiBXaGVuIHJlcGVhdGVkIGJ5IFwiLFwiLCB0aGlzLmJhY2t3YXJkcyBpcyB0ZW1wb3JhcnkgaW52ZXJ0ZWQgYW5kXG4gICAgLy8gcmVzdG9yZWQgYWZ0ZXIgZXhlY3V0aW9uIGZpbmlzaGVkLlxuICAgIC8vIEJ1dCBmaW5hbCBoaWdobGlnaHRUZXh0SW5DdXJzb3JSb3dzIGlzIGV4ZWN1dGVkIGluIGFzeW5jKD1hZnRlciBvcGVyYXRpb24gZmluaXNoZWQpLlxuICAgIC8vIFRodXMgd2UgbmVlZCB0byBwcmVzZXJ2ZSBiZWZvcmUgcmVzdG9yZWQgYGJhY2t3YXJkc2AgdmFsdWUgYW5kIHBhc3MgaXQuXG4gICAgY29uc3QgYmFja3dhcmRzID0gdGhpcy5pc0JhY2t3YXJkcygpXG4gICAgdGhpcy5lZGl0b3IuY29tcG9uZW50LmdldE5leHRVcGRhdGVQcm9taXNlKCkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmhpZ2hsaWdodFRleHRJbkN1cnNvclJvd3ModGhpcy5pbnB1dCwgZGVjb3JhdGlvblR5cGUsIGJhY2t3YXJkcylcbiAgICB9KVxuICB9XG5cbiAgZ2V0UG9pbnQoZnJvbVBvaW50KSB7XG4gICAgY29uc3Qgc2NhblJhbmdlID0gdGhpcy5lZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coZnJvbVBvaW50LnJvdylcbiAgICBjb25zdCBwb2ludHMgPSBbXVxuICAgIGNvbnN0IHJlZ2V4ID0gdGhpcy5nZXRSZWdleCh0aGlzLmlucHV0KVxuICAgIGNvbnN0IGluZGV4V2FudEFjY2VzcyA9IHRoaXMuZ2V0Q291bnQoLTEpXG5cbiAgICBjb25zdCB0cmFuc2xhdGlvbiA9IG5ldyBQb2ludCgwLCB0aGlzLmlzQmFja3dhcmRzKCkgPyB0aGlzLm9mZnNldCA6IC10aGlzLm9mZnNldClcbiAgICBpZiAodGhpcy5yZXBlYXRlZCkge1xuICAgICAgZnJvbVBvaW50ID0gZnJvbVBvaW50LnRyYW5zbGF0ZSh0cmFuc2xhdGlvbi5uZWdhdGUoKSlcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0JhY2t3YXJkcygpKSB7XG4gICAgICBpZiAodGhpcy5nZXRDb25maWcoXCJmaW5kQWNyb3NzTGluZXNcIikpIHNjYW5SYW5nZS5zdGFydCA9IFBvaW50LlpFUk9cblxuICAgICAgdGhpcy5lZGl0b3IuYmFja3dhcmRzU2NhbkluQnVmZmVyUmFuZ2UocmVnZXgsIHNjYW5SYW5nZSwgKHtyYW5nZSwgc3RvcH0pID0+IHtcbiAgICAgICAgaWYgKHJhbmdlLnN0YXJ0LmlzTGVzc1RoYW4oZnJvbVBvaW50KSkge1xuICAgICAgICAgIHBvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KVxuICAgICAgICAgIGlmIChwb2ludHMubGVuZ3RoID4gaW5kZXhXYW50QWNjZXNzKSB7XG4gICAgICAgICAgICBzdG9wKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmdldENvbmZpZyhcImZpbmRBY3Jvc3NMaW5lc1wiKSkgc2NhblJhbmdlLmVuZCA9IHRoaXMuZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIHRoaXMuZWRpdG9yLnNjYW5JbkJ1ZmZlclJhbmdlKHJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSA9PiB7XG4gICAgICAgIGlmIChyYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludCkpIHtcbiAgICAgICAgICBwb2ludHMucHVzaChyYW5nZS5zdGFydClcbiAgICAgICAgICBpZiAocG9pbnRzLmxlbmd0aCA+IGluZGV4V2FudEFjY2Vzcykge1xuICAgICAgICAgICAgc3RvcCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IHBvaW50ID0gcG9pbnRzW2luZGV4V2FudEFjY2Vzc11cbiAgICBpZiAocG9pbnQpIHJldHVybiBwb2ludC50cmFuc2xhdGUodHJhbnNsYXRpb24pXG4gIH1cblxuICAvLyBGSVhNRTogYmFkIG5hbWluZywgdGhpcyBmdW5jdGlvbiBtdXN0IHJldHVybiBpbmRleFxuICBoaWdobGlnaHRUZXh0SW5DdXJzb3JSb3dzKHRleHQsIGRlY29yYXRpb25UeXBlLCBiYWNrd2FyZHMsIGluZGV4ID0gdGhpcy5nZXRDb3VudCgtMSksIGFkanVzdEluZGV4ID0gZmFsc2UpIHtcbiAgICBpZiAoIXRoaXMuZ2V0Q29uZmlnKFwiaGlnaGxpZ2h0RmluZENoYXJcIikpIHJldHVyblxuXG4gICAgcmV0dXJuIHRoaXMudmltU3RhdGUuaGlnaGxpZ2h0RmluZC5oaWdobGlnaHRDdXJzb3JSb3dzKFxuICAgICAgdGhpcy5nZXRSZWdleCh0ZXh0KSxcbiAgICAgIGRlY29yYXRpb25UeXBlLFxuICAgICAgYmFja3dhcmRzLFxuICAgICAgdGhpcy5vZmZzZXQsXG4gICAgICBpbmRleCxcbiAgICAgIGFkanVzdEluZGV4XG4gICAgKVxuICB9XG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgaWYgKHBvaW50KSBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgZWxzZSB0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSgpXG5cbiAgICBpZiAoIXRoaXMucmVwZWF0ZWQpIHRoaXMuZ2xvYmFsU3RhdGUuc2V0KFwiY3VycmVudEZpbmRcIiwgdGhpcylcbiAgfVxuXG4gIGdldFJlZ2V4KHRlcm0pIHtcbiAgICBjb25zdCBtb2RpZmllcnMgPSB0aGlzLmlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSA/IFwiZ1wiIDogXCJnaVwiXG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcbiAgfVxufVxuRmluZC5yZWdpc3RlcigpXG5cbi8vIGtleW1hcDogRlxuY2xhc3MgRmluZEJhY2t3YXJkcyBleHRlbmRzIEZpbmQge1xuICBpbmNsdXNpdmUgPSBmYWxzZVxuICBiYWNrd2FyZHMgPSB0cnVlXG59XG5GaW5kQmFja3dhcmRzLnJlZ2lzdGVyKClcblxuLy8ga2V5bWFwOiB0XG5jbGFzcyBUaWxsIGV4dGVuZHMgRmluZCB7XG4gIG9mZnNldCA9IDFcbiAgZ2V0UG9pbnQoLi4uYXJncykge1xuICAgIGNvbnN0IHBvaW50ID0gc3VwZXIuZ2V0UG9pbnQoLi4uYXJncylcbiAgICB0aGlzLm1vdmVTdWNjZWVkZWQgPSBwb2ludCAhPSBudWxsXG4gICAgcmV0dXJuIHBvaW50XG4gIH1cbn1cblRpbGwucmVnaXN0ZXIoKVxuXG4vLyBrZXltYXA6IFRcbmNsYXNzIFRpbGxCYWNrd2FyZHMgZXh0ZW5kcyBUaWxsIHtcbiAgaW5jbHVzaXZlID0gZmFsc2VcbiAgYmFja3dhcmRzID0gdHJ1ZVxufVxuVGlsbEJhY2t3YXJkcy5yZWdpc3RlcigpXG5cbi8vIE1hcmtcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIGtleW1hcDogYFxuY2xhc3MgTW92ZVRvTWFyayBleHRlbmRzIE1vdGlvbiB7XG4gIGp1bXAgPSB0cnVlXG4gIHJlcXVpcmVJbnB1dCA9IHRydWVcbiAgaW5wdXQgPSBudWxsXG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICBpZiAoIXRoaXMuaXNDb21wbGV0ZSgpKSB0aGlzLnJlYWRDaGFyKClcbiAgICByZXR1cm4gc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBnZXRQb2ludCgpIHtcbiAgICByZXR1cm4gdGhpcy52aW1TdGF0ZS5tYXJrLmdldCh0aGlzLmlucHV0KVxuICB9XG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZ2V0UG9pbnQoKVxuICAgIGlmIChwb2ludCkge1xuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgY3Vyc29yLmF1dG9zY3JvbGwoe2NlbnRlcjogdHJ1ZX0pXG4gICAgfVxuICB9XG59XG5Nb3ZlVG9NYXJrLnJlZ2lzdGVyKClcblxuLy8ga2V5bWFwOiAnXG5jbGFzcyBNb3ZlVG9NYXJrTGluZSBleHRlbmRzIE1vdmVUb01hcmsge1xuICB3aXNlID0gXCJsaW5ld2lzZVwiXG5cbiAgZ2V0UG9pbnQoKSB7XG4gICAgY29uc3QgcG9pbnQgPSBzdXBlci5nZXRQb2ludCgpXG4gICAgaWYgKHBvaW50KSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KHBvaW50LnJvdylcbiAgICB9XG4gIH1cbn1cbk1vdmVUb01hcmtMaW5lLnJlZ2lzdGVyKClcblxuLy8gRm9sZFxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnQgZXh0ZW5kcyBNb3Rpb24ge1xuICB3aXNlID0gXCJjaGFyYWN0ZXJ3aXNlXCJcbiAgd2hpY2ggPSBcInN0YXJ0XCJcbiAgZGlyZWN0aW9uID0gXCJwcmV2XCJcblxuICBleGVjdXRlKCkge1xuICAgIHRoaXMucm93cyA9IHRoaXMuZ2V0Rm9sZFJvd3ModGhpcy53aGljaClcbiAgICBpZiAodGhpcy5kaXJlY3Rpb24gPT09IFwicHJldlwiKSB0aGlzLnJvd3MucmV2ZXJzZSgpXG5cbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxuXG4gIGdldEZvbGRSb3dzKHdoaWNoKSB7XG4gICAgY29uc3QgaW5kZXggPSB3aGljaCA9PT0gXCJzdGFydFwiID8gMCA6IDFcbiAgICBjb25zdCByb3dzID0gZ2V0Q29kZUZvbGRSb3dSYW5nZXModGhpcy5lZGl0b3IpLm1hcChyb3dSYW5nZSA9PiByb3dSYW5nZVtpbmRleF0pXG4gICAgcmV0dXJuIF8uc29ydEJ5KF8udW5pcShyb3dzKSwgcm93ID0+IHJvdylcbiAgfVxuXG4gIGdldFNjYW5Sb3dzKGN1cnNvcikge1xuICAgIGNvbnN0IGN1cnNvclJvdyA9IGN1cnNvci5nZXRCdWZmZXJSb3coKVxuICAgIGNvbnN0IGlzVmFsZCA9IHRoaXMuZGlyZWN0aW9uID09PSBcInByZXZcIiA/IHJvdyA9PiByb3cgPCBjdXJzb3JSb3cgOiByb3cgPT4gcm93ID4gY3Vyc29yUm93XG4gICAgcmV0dXJuIHRoaXMucm93cy5maWx0ZXIoaXNWYWxkKVxuICB9XG5cbiAgZGV0ZWN0Um93KGN1cnNvcikge1xuICAgIHJldHVybiB0aGlzLmdldFNjYW5Sb3dzKGN1cnNvcilbMF1cbiAgfVxuXG4gIG1vdmVDdXJzb3IoY3Vyc29yKSB7XG4gICAgdGhpcy5tb3ZlQ3Vyc29yQ291bnRUaW1lcyhjdXJzb3IsICgpID0+IHtcbiAgICAgIGNvbnN0IHJvdyA9IHRoaXMuZGV0ZWN0Um93KGN1cnNvcilcbiAgICAgIGlmIChyb3cgIT0gbnVsbCkgbW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvdyhjdXJzb3IsIHJvdylcbiAgICB9KVxuICB9XG59XG5Nb3ZlVG9QcmV2aW91c0ZvbGRTdGFydC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydCB7XG4gIGRpcmVjdGlvbiA9IFwibmV4dFwiXG59XG5Nb3ZlVG9OZXh0Rm9sZFN0YXJ0LnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0IHtcbiAgZGV0ZWN0Um93KGN1cnNvcikge1xuICAgIGNvbnN0IGJhc2VJbmRlbnRMZXZlbCA9IHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KGN1cnNvci5nZXRCdWZmZXJSb3coKSlcbiAgICByZXR1cm4gdGhpcy5nZXRTY2FuUm93cyhjdXJzb3IpLmZpbmQocm93ID0+IHRoaXMuZWRpdG9yLmluZGVudGF0aW9uRm9yQnVmZmVyUm93KHJvdykgPT09IGJhc2VJbmRlbnRMZXZlbClcbiAgfVxufVxuTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRXaXRoU2FtZUluZGVudC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnQge1xuICBkaXJlY3Rpb24gPSBcIm5leHRcIlxufVxuTW92ZVRvTmV4dEZvbGRTdGFydFdpdGhTYW1lSW5kZW50LnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnQge1xuICB3aGljaCA9IFwiZW5kXCJcbn1cbk1vdmVUb1ByZXZpb3VzRm9sZEVuZC5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkRW5kIHtcbiAgZGlyZWN0aW9uID0gXCJuZXh0XCJcbn1cbk1vdmVUb05leHRGb2xkRW5kLnJlZ2lzdGVyKClcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvUHJldmlvdXNGdW5jdGlvbiBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0IHtcbiAgZGlyZWN0aW9uID0gXCJwcmV2XCJcbiAgZGV0ZWN0Um93KGN1cnNvcikge1xuICAgIHJldHVybiB0aGlzLmdldFNjYW5Sb3dzKGN1cnNvcikuZmluZChyb3cgPT4gaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyh0aGlzLmVkaXRvciwgcm93KSlcbiAgfVxufVxuTW92ZVRvUHJldmlvdXNGdW5jdGlvbi5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb05leHRGdW5jdGlvbiBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRnVuY3Rpb24ge1xuICBkaXJlY3Rpb24gPSBcIm5leHRcIlxufVxuTW92ZVRvTmV4dEZ1bmN0aW9uLnJlZ2lzdGVyKClcblxuLy8gU2NvcGUgYmFzZWRcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1Bvc2l0aW9uQnlTY29wZSBleHRlbmRzIE1vdGlvbiB7XG4gIGRpcmVjdGlvbiA9IFwiYmFja3dhcmRcIlxuICBzY29wZSA9IFwiLlwiXG5cbiAgZ2V0UG9pbnQoZnJvbVBvaW50KSB7XG4gICAgcmV0dXJuIGRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlKHRoaXMuZWRpdG9yLCBmcm9tUG9pbnQsIHRoaXMuZGlyZWN0aW9uLCB0aGlzLnNjb3BlKVxuICB9XG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICB0aGlzLm1vdmVDdXJzb3JDb3VudFRpbWVzKGN1cnNvciwgKCkgPT4ge1xuICAgICAgdGhpcy5zZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHRoaXMuZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpKVxuICAgIH0pXG4gIH1cbn1cbk1vdmVUb1Bvc2l0aW9uQnlTY29wZS5yZWdpc3RlcihmYWxzZSlcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTdHJpbmcgZXh0ZW5kcyBNb3ZlVG9Qb3NpdGlvbkJ5U2NvcGUge1xuICBkaXJlY3Rpb24gPSBcImJhY2t3YXJkXCJcbiAgc2NvcGUgPSBcInN0cmluZy5iZWdpblwiXG59XG5Nb3ZlVG9QcmV2aW91c1N0cmluZy5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb05leHRTdHJpbmcgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1N0cmluZyB7XG4gIGRpcmVjdGlvbiA9IFwiZm9yd2FyZFwiXG59XG5Nb3ZlVG9OZXh0U3RyaW5nLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNOdW1iZXIgZXh0ZW5kcyBNb3ZlVG9Qb3NpdGlvbkJ5U2NvcGUge1xuICBkaXJlY3Rpb24gPSBcImJhY2t3YXJkXCJcbiAgc2NvcGUgPSBcImNvbnN0YW50Lm51bWVyaWNcIlxufVxuTW92ZVRvUHJldmlvdXNOdW1iZXIucmVnaXN0ZXIoKVxuXG5jbGFzcyBNb3ZlVG9OZXh0TnVtYmVyIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNOdW1iZXIge1xuICBkaXJlY3Rpb24gPSBcImZvcndhcmRcIlxufVxuTW92ZVRvTmV4dE51bWJlci5yZWdpc3RlcigpXG5cbmNsYXNzIE1vdmVUb05leHRPY2N1cnJlbmNlIGV4dGVuZHMgTW90aW9uIHtcbiAgLy8gRW5zdXJlIHRoaXMgY29tbWFuZCBpcyBhdmFpbGFibGUgd2hlbiBvbmx5IGhhcy1vY2N1cnJlbmNlXG4gIHN0YXRpYyBjb21tYW5kU2NvcGUgPSBcImF0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5oYXMtb2NjdXJyZW5jZVwiXG4gIGp1bXAgPSB0cnVlXG4gIGRpcmVjdGlvbiA9IFwibmV4dFwiXG5cbiAgZXhlY3V0ZSgpIHtcbiAgICB0aGlzLnJhbmdlcyA9IHNvcnRSYW5nZXModGhpcy5vY2N1cnJlbmNlTWFuYWdlci5nZXRNYXJrZXJzKCkubWFwKG1hcmtlciA9PiBtYXJrZXIuZ2V0QnVmZmVyUmFuZ2UoKSkpXG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5yYW5nZXNbZ2V0SW5kZXgodGhpcy5nZXRJbmRleChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSksIHRoaXMucmFuZ2VzKV1cbiAgICBjb25zdCBwb2ludCA9IHJhbmdlLnN0YXJ0XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LCB7YXV0b3Njcm9sbDogZmFsc2V9KVxuXG4gICAgaWYgKGN1cnNvci5pc0xhc3RDdXJzb3IoKSkge1xuICAgICAgdGhpcy5lZGl0b3IudW5mb2xkQnVmZmVyUm93KHBvaW50LnJvdylcbiAgICAgIHNtYXJ0U2Nyb2xsVG9CdWZmZXJQb3NpdGlvbih0aGlzLmVkaXRvciwgcG9pbnQpXG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZ2V0Q29uZmlnKFwiZmxhc2hPbk1vdmVUb09jY3VycmVuY2VcIikpIHtcbiAgICAgIHRoaXMudmltU3RhdGUuZmxhc2gocmFuZ2UsIHt0eXBlOiBcInNlYXJjaFwifSlcbiAgICB9XG4gIH1cblxuICBnZXRJbmRleChmcm9tUG9pbnQpIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMucmFuZ2VzLmZpbmRJbmRleChyYW5nZSA9PiByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuKGZyb21Qb2ludCkpXG4gICAgcmV0dXJuIChpbmRleCA+PSAwID8gaW5kZXggOiAwKSArIHRoaXMuZ2V0Q291bnQoLTEpXG4gIH1cbn1cbk1vdmVUb05leHRPY2N1cnJlbmNlLnJlZ2lzdGVyKClcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNPY2N1cnJlbmNlIGV4dGVuZHMgTW92ZVRvTmV4dE9jY3VycmVuY2Uge1xuICBkaXJlY3Rpb24gPSBcInByZXZpb3VzXCJcblxuICBnZXRJbmRleChmcm9tUG9pbnQpIHtcbiAgICBjb25zdCByYW5nZXMgPSB0aGlzLnJhbmdlcy5zbGljZSgpLnJldmVyc2UoKVxuICAgIGNvbnN0IHJhbmdlID0gcmFuZ2VzLmZpbmQocmFuZ2UgPT4gcmFuZ2UuZW5kLmlzTGVzc1RoYW4oZnJvbVBvaW50KSlcbiAgICBjb25zdCBpbmRleCA9IHJhbmdlID8gdGhpcy5yYW5nZXMuaW5kZXhPZihyYW5nZSkgOiB0aGlzLnJhbmdlcy5sZW5ndGggLSAxXG4gICAgcmV0dXJuIGluZGV4IC0gdGhpcy5nZXRDb3VudCgtMSlcbiAgfVxufVxuTW92ZVRvUHJldmlvdXNPY2N1cnJlbmNlLnJlZ2lzdGVyKClcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8ga2V5bWFwOiAlXG5jbGFzcyBNb3ZlVG9QYWlyIGV4dGVuZHMgTW90aW9uIHtcbiAgaW5jbHVzaXZlID0gdHJ1ZVxuICBqdW1wID0gdHJ1ZVxuICBtZW1iZXIgPSBbXCJQYXJlbnRoZXNpc1wiLCBcIkN1cmx5QnJhY2tldFwiLCBcIlNxdWFyZUJyYWNrZXRcIl1cblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIHRoaXMuc2V0QnVmZmVyUG9zaXRpb25TYWZlbHkoY3Vyc29yLCB0aGlzLmdldFBvaW50KGN1cnNvcikpXG4gIH1cblxuICBnZXRQb2ludEZvclRhZyhwb2ludCkge1xuICAgIGNvbnN0IHBhaXJJbmZvID0gdGhpcy5nZXRJbnN0YW5jZShcIkFUYWdcIikuZ2V0UGFpckluZm8ocG9pbnQpXG4gICAgaWYgKCFwYWlySW5mbykgcmV0dXJuXG5cbiAgICBsZXQge29wZW5SYW5nZSwgY2xvc2VSYW5nZX0gPSBwYWlySW5mb1xuICAgIG9wZW5SYW5nZSA9IG9wZW5SYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICBjbG9zZVJhbmdlID0gY2xvc2VSYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICBpZiAob3BlblJhbmdlLmNvbnRhaW5zUG9pbnQocG9pbnQpICYmICFwb2ludC5pc0VxdWFsKG9wZW5SYW5nZS5lbmQpKSB7XG4gICAgICByZXR1cm4gY2xvc2VSYW5nZS5zdGFydFxuICAgIH1cbiAgICBpZiAoY2xvc2VSYW5nZS5jb250YWluc1BvaW50KHBvaW50KSAmJiAhcG9pbnQuaXNFcXVhbChjbG9zZVJhbmdlLmVuZCkpIHtcbiAgICAgIHJldHVybiBvcGVuUmFuZ2Uuc3RhcnRcbiAgICB9XG4gIH1cblxuICBnZXRQb2ludChjdXJzb3IpIHtcbiAgICBjb25zdCBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgY29uc3QgY3Vyc29yUm93ID0gY3Vyc29yUG9zaXRpb24ucm93XG4gICAgY29uc3QgcG9pbnQgPSB0aGlzLmdldFBvaW50Rm9yVGFnKGN1cnNvclBvc2l0aW9uKVxuICAgIGlmIChwb2ludCkgcmV0dXJuIHBvaW50XG5cbiAgICAvLyBBQW55UGFpckFsbG93Rm9yd2FyZGluZyByZXR1cm4gZm9yd2FyZGluZyByYW5nZSBvciBlbmNsb3NpbmcgcmFuZ2UuXG4gICAgY29uc3QgcmFuZ2UgPSB0aGlzLmdldEluc3RhbmNlKFwiQUFueVBhaXJBbGxvd0ZvcndhcmRpbmdcIiwge21lbWJlcjogdGhpcy5tZW1iZXJ9KS5nZXRSYW5nZShjdXJzb3Iuc2VsZWN0aW9uKVxuICAgIGlmICghcmFuZ2UpIHJldHVyblxuXG4gICAgY29uc3Qge3N0YXJ0LCBlbmR9ID0gcmFuZ2VcbiAgICBpZiAoc3RhcnQucm93ID09PSBjdXJzb3JSb3cgJiYgc3RhcnQuaXNHcmVhdGVyVGhhbk9yRXF1YWwoY3Vyc29yUG9zaXRpb24pKSB7XG4gICAgICAvLyBGb3J3YXJkaW5nIHJhbmdlIGZvdW5kXG4gICAgICByZXR1cm4gZW5kLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgIH0gZWxzZSBpZiAoZW5kLnJvdyA9PT0gY3Vyc29yUG9zaXRpb24ucm93KSB7XG4gICAgICAvLyBFbmNsb3NpbmcgcmFuZ2Ugd2FzIHJldHVybmVkXG4gICAgICAvLyBXZSBtb3ZlIHRvIHN0YXJ0KCBvcGVuLXBhaXIgKSBvbmx5IHdoZW4gY2xvc2UtcGFpciB3YXMgYXQgc2FtZSByb3cgYXMgY3Vyc29yLXJvdy5cbiAgICAgIHJldHVybiBzdGFydFxuICAgIH1cbiAgfVxufVxuTW92ZVRvUGFpci5yZWdpc3RlcigpXG4iXX0=