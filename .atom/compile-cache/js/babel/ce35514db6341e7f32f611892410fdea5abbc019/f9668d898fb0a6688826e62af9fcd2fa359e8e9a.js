"use babel";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require("atom");

var Range = _require.Range;

var Base = require("./base");

var _require2 = require("./utils");

var moveCursorRight = _require2.moveCursorRight;
var isLinewiseRange = _require2.isLinewiseRange;
var setBufferRow = _require2.setBufferRow;
var sortRanges = _require2.sortRanges;
var findRangeContainsPoint = _require2.findRangeContainsPoint;
var isSingleLineRange = _require2.isSingleLineRange;
var isLeadingWhiteSpaceRange = _require2.isLeadingWhiteSpaceRange;
var humanizeBufferRange = _require2.humanizeBufferRange;
var getFoldInfoByKind = _require2.getFoldInfoByKind;
var limitNumber = _require2.limitNumber;
var getFoldRowRangesContainedByFoldStartsAtRow = _require2.getFoldRowRangesContainedByFoldStartsAtRow;
var getList = _require2.getList;

var MiscCommand = (function (_Base) {
  _inherits(MiscCommand, _Base);

  function MiscCommand() {
    _classCallCheck(this, MiscCommand);

    _get(Object.getPrototypeOf(MiscCommand.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(MiscCommand, null, [{
    key: "operationKind",
    value: "misc-command",
    enumerable: true
  }]);

  return MiscCommand;
})(Base);

MiscCommand.register(false);

var Mark = (function (_MiscCommand) {
  _inherits(Mark, _MiscCommand);

  function Mark() {
    _classCallCheck(this, Mark);

    _get(Object.getPrototypeOf(Mark.prototype), "constructor", this).apply(this, arguments);

    this.requireInput = true;
  }

  _createClass(Mark, [{
    key: "initialize",
    value: function initialize() {
      this.readChar();
      return _get(Object.getPrototypeOf(Mark.prototype), "initialize", this).call(this);
    }
  }, {
    key: "execute",
    value: function execute() {
      this.vimState.mark.set(this.input, this.editor.getCursorBufferPosition());
      this.activateMode("normal");
    }
  }]);

  return Mark;
})(MiscCommand);

Mark.register();

var ReverseSelections = (function (_MiscCommand2) {
  _inherits(ReverseSelections, _MiscCommand2);

  function ReverseSelections() {
    _classCallCheck(this, ReverseSelections);

    _get(Object.getPrototypeOf(ReverseSelections.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ReverseSelections, [{
    key: "execute",
    value: function execute() {
      this.swrap.setReversedState(this.editor, !this.editor.getLastSelection().isReversed());
      if (this.isMode("visual", "blockwise")) {
        this.getLastBlockwiseSelection().autoscroll();
      }
    }
  }]);

  return ReverseSelections;
})(MiscCommand);

ReverseSelections.register();

var BlockwiseOtherEnd = (function (_ReverseSelections) {
  _inherits(BlockwiseOtherEnd, _ReverseSelections);

  function BlockwiseOtherEnd() {
    _classCallCheck(this, BlockwiseOtherEnd);

    _get(Object.getPrototypeOf(BlockwiseOtherEnd.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(BlockwiseOtherEnd, [{
    key: "execute",
    value: function execute() {
      for (var blockwiseSelection of this.getBlockwiseSelections()) {
        blockwiseSelection.reverse();
      }
      _get(Object.getPrototypeOf(BlockwiseOtherEnd.prototype), "execute", this).call(this);
    }
  }]);

  return BlockwiseOtherEnd;
})(ReverseSelections);

BlockwiseOtherEnd.register();

var Undo = (function (_MiscCommand3) {
  _inherits(Undo, _MiscCommand3);

  function Undo() {
    _classCallCheck(this, Undo);

    _get(Object.getPrototypeOf(Undo.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Undo, [{
    key: "setCursorPosition",
    value: function setCursorPosition(_ref) {
      var newRanges = _ref.newRanges;
      var oldRanges = _ref.oldRanges;
      var strategy = _ref.strategy;

      var lastCursor = this.editor.getLastCursor(); // This is restored cursor

      var changedRange = strategy === "smart" ? findRangeContainsPoint(newRanges, lastCursor.getBufferPosition()) : sortRanges(newRanges.concat(oldRanges))[0];

      if (changedRange) {
        if (isLinewiseRange(changedRange)) setBufferRow(lastCursor, changedRange.start.row);else lastCursor.setBufferPosition(changedRange.start);
      }
    }
  }, {
    key: "mutateWithTrackChanges",
    value: function mutateWithTrackChanges() {
      var newRanges = [];
      var oldRanges = [];

      // Collect changed range while mutating text-state by fn callback.
      var disposable = this.editor.getBuffer().onDidChange(function (_ref2) {
        var newRange = _ref2.newRange;
        var oldRange = _ref2.oldRange;

        if (newRange.isEmpty()) {
          oldRanges.push(oldRange); // Remove only
        } else {
            newRanges.push(newRange);
          }
      });

      this.mutate();
      disposable.dispose();
      return { newRanges: newRanges, oldRanges: oldRanges };
    }
  }, {
    key: "flashChanges",
    value: function flashChanges(_ref3) {
      var _this = this;

      var newRanges = _ref3.newRanges;
      var oldRanges = _ref3.oldRanges;

      var isMultipleSingleLineRanges = function isMultipleSingleLineRanges(ranges) {
        return ranges.length > 1 && ranges.every(isSingleLineRange);
      };

      if (newRanges.length > 0) {
        if (this.isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows(newRanges)) return;

        newRanges = newRanges.map(function (range) {
          return humanizeBufferRange(_this.editor, range);
        });
        newRanges = this.filterNonLeadingWhiteSpaceRange(newRanges);

        var type = isMultipleSingleLineRanges(newRanges) ? "undo-redo-multiple-changes" : "undo-redo";
        this.flash(newRanges, { type: type });
      } else {
        if (this.isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows(oldRanges)) return;

        if (isMultipleSingleLineRanges(oldRanges)) {
          oldRanges = this.filterNonLeadingWhiteSpaceRange(oldRanges);
          this.flash(oldRanges, { type: "undo-redo-multiple-delete" });
        }
      }
    }
  }, {
    key: "filterNonLeadingWhiteSpaceRange",
    value: function filterNonLeadingWhiteSpaceRange(ranges) {
      var _this2 = this;

      return ranges.filter(function (range) {
        return !isLeadingWhiteSpaceRange(_this2.editor, range);
      });
    }

    // [TODO] Improve further by checking oldText, newText?
    // [Purpose of this function]
    // Suppress flash when undo/redoing toggle-comment while flashing undo/redo of occurrence operation.
    // This huristic approach never be perfect.
    // Ultimately cannnot distinguish occurrence operation.
  }, {
    key: "isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows",
    value: function isMultipleAndAllRangeHaveSameColumnAndConsecutiveRows(ranges) {
      if (ranges.length <= 1) {
        return false;
      }

      var _ranges$0 = ranges[0];
      var startColumn = _ranges$0.start.column;
      var endColumn = _ranges$0.end.column;

      var previousRow = undefined;

      for (var range of ranges) {
        var start = range.start;
        var end = range.end;

        if (start.column !== startColumn || end.column !== endColumn) return false;
        if (previousRow != null && previousRow + 1 !== start.row) return false;
        previousRow = start.row;
      }
      return true;
    }
  }, {
    key: "flash",
    value: function flash(ranges, options) {
      var _this3 = this;

      if (options.timeout == null) options.timeout = 500;
      this.onDidFinishOperation(function () {
        return _this3.vimState.flash(ranges, options);
      });
    }
  }, {
    key: "execute",
    value: function execute() {
      var _mutateWithTrackChanges = this.mutateWithTrackChanges();

      var newRanges = _mutateWithTrackChanges.newRanges;
      var oldRanges = _mutateWithTrackChanges.oldRanges;

      for (var selection of this.editor.getSelections()) {
        selection.clear();
      }

      if (this.getConfig("setCursorToStartOfChangeOnUndoRedo")) {
        var strategy = this.getConfig("setCursorToStartOfChangeOnUndoRedoStrategy");
        this.setCursorPosition({ newRanges: newRanges, oldRanges: oldRanges, strategy: strategy });
        this.vimState.clearSelections();
      }

      if (this.getConfig("flashOnUndoRedo")) this.flashChanges({ newRanges: newRanges, oldRanges: oldRanges });
      this.activateMode("normal");
    }
  }, {
    key: "mutate",
    value: function mutate() {
      this.editor.undo();
    }
  }]);

  return Undo;
})(MiscCommand);

Undo.register();

var Redo = (function (_Undo) {
  _inherits(Redo, _Undo);

  function Redo() {
    _classCallCheck(this, Redo);

    _get(Object.getPrototypeOf(Redo.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Redo, [{
    key: "mutate",
    value: function mutate() {
      this.editor.redo();
    }
  }]);

  return Redo;
})(Undo);

Redo.register();

// zc

var FoldCurrentRow = (function (_MiscCommand4) {
  _inherits(FoldCurrentRow, _MiscCommand4);

  function FoldCurrentRow() {
    _classCallCheck(this, FoldCurrentRow);

    _get(Object.getPrototypeOf(FoldCurrentRow.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(FoldCurrentRow, [{
    key: "execute",
    value: function execute() {
      for (var selection of this.editor.getSelections()) {
        this.editor.foldBufferRow(this.getCursorPositionForSelection(selection).row);
      }
    }
  }]);

  return FoldCurrentRow;
})(MiscCommand);

FoldCurrentRow.register();

// zo

var UnfoldCurrentRow = (function (_MiscCommand5) {
  _inherits(UnfoldCurrentRow, _MiscCommand5);

  function UnfoldCurrentRow() {
    _classCallCheck(this, UnfoldCurrentRow);

    _get(Object.getPrototypeOf(UnfoldCurrentRow.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(UnfoldCurrentRow, [{
    key: "execute",
    value: function execute() {
      for (var selection of this.editor.getSelections()) {
        this.editor.unfoldBufferRow(this.getCursorPositionForSelection(selection).row);
      }
    }
  }]);

  return UnfoldCurrentRow;
})(MiscCommand);

UnfoldCurrentRow.register();

// za

var ToggleFold = (function (_MiscCommand6) {
  _inherits(ToggleFold, _MiscCommand6);

  function ToggleFold() {
    _classCallCheck(this, ToggleFold);

    _get(Object.getPrototypeOf(ToggleFold.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ToggleFold, [{
    key: "execute",
    value: function execute() {
      this.editor.toggleFoldAtBufferRow(this.editor.getCursorBufferPosition().row);
    }
  }]);

  return ToggleFold;
})(MiscCommand);

ToggleFold.register();

// Base of zC, zO, zA

var FoldCurrentRowRecursivelyBase = (function (_MiscCommand7) {
  _inherits(FoldCurrentRowRecursivelyBase, _MiscCommand7);

  function FoldCurrentRowRecursivelyBase() {
    _classCallCheck(this, FoldCurrentRowRecursivelyBase);

    _get(Object.getPrototypeOf(FoldCurrentRowRecursivelyBase.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(FoldCurrentRowRecursivelyBase, [{
    key: "foldRecursively",
    value: function foldRecursively(row) {
      var rowRanges = getFoldRowRangesContainedByFoldStartsAtRow(this.editor, row);
      if (!rowRanges) return;
      var startRows = rowRanges.map(function (rowRange) {
        return rowRange[0];
      });
      for (var _row of startRows.reverse()) {
        if (!this.editor.isFoldedAtBufferRow(_row)) {
          this.editor.foldBufferRow(_row);
        }
      }
    }
  }, {
    key: "unfoldRecursively",
    value: function unfoldRecursively(row) {
      var rowRanges = getFoldRowRangesContainedByFoldStartsAtRow(this.editor, row);
      if (!rowRanges) return;
      var startRows = rowRanges.map(function (rowRange) {
        return rowRange[0];
      });
      for (row of startRows) {
        if (this.editor.isFoldedAtBufferRow(row)) {
          this.editor.unfoldBufferRow(row);
        }
      }
    }
  }, {
    key: "foldRecursivelyForAllSelections",
    value: function foldRecursivelyForAllSelections() {
      for (var selection of this.editor.getSelectionsOrderedByBufferPosition().reverse()) {
        this.foldRecursively(this.getCursorPositionForSelection(selection).row);
      }
    }
  }, {
    key: "unfoldRecursivelyForAllSelections",
    value: function unfoldRecursivelyForAllSelections() {
      for (var selection of this.editor.getSelectionsOrderedByBufferPosition()) {
        this.unfoldRecursively(this.getCursorPositionForSelection(selection).row);
      }
    }
  }]);

  return FoldCurrentRowRecursivelyBase;
})(MiscCommand);

FoldCurrentRowRecursivelyBase.register(false);

// zC

var FoldCurrentRowRecursively = (function (_FoldCurrentRowRecursivelyBase) {
  _inherits(FoldCurrentRowRecursively, _FoldCurrentRowRecursivelyBase);

  function FoldCurrentRowRecursively() {
    _classCallCheck(this, FoldCurrentRowRecursively);

    _get(Object.getPrototypeOf(FoldCurrentRowRecursively.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(FoldCurrentRowRecursively, [{
    key: "execute",
    value: function execute() {
      this.foldRecursivelyForAllSelections();
    }
  }]);

  return FoldCurrentRowRecursively;
})(FoldCurrentRowRecursivelyBase);

FoldCurrentRowRecursively.register();

// zO

var UnfoldCurrentRowRecursively = (function (_FoldCurrentRowRecursivelyBase2) {
  _inherits(UnfoldCurrentRowRecursively, _FoldCurrentRowRecursivelyBase2);

  function UnfoldCurrentRowRecursively() {
    _classCallCheck(this, UnfoldCurrentRowRecursively);

    _get(Object.getPrototypeOf(UnfoldCurrentRowRecursively.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(UnfoldCurrentRowRecursively, [{
    key: "execute",
    value: function execute() {
      this.unfoldRecursivelyForAllSelections();
    }
  }]);

  return UnfoldCurrentRowRecursively;
})(FoldCurrentRowRecursivelyBase);

UnfoldCurrentRowRecursively.register();

// zA

var ToggleFoldRecursively = (function (_FoldCurrentRowRecursivelyBase3) {
  _inherits(ToggleFoldRecursively, _FoldCurrentRowRecursivelyBase3);

  function ToggleFoldRecursively() {
    _classCallCheck(this, ToggleFoldRecursively);

    _get(Object.getPrototypeOf(ToggleFoldRecursively.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ToggleFoldRecursively, [{
    key: "execute",
    value: function execute() {
      var _getCursorPositionForSelection = this.getCursorPositionForSelection(this.editor.getLastSelection());

      var row = _getCursorPositionForSelection.row;

      if (this.editor.isFoldedAtBufferRow(row)) {
        this.unfoldRecursivelyForAllSelections();
      } else {
        this.foldRecursivelyForAllSelections();
      }
    }
  }]);

  return ToggleFoldRecursively;
})(FoldCurrentRowRecursivelyBase);

ToggleFoldRecursively.register();

// zR

var UnfoldAll = (function (_MiscCommand8) {
  _inherits(UnfoldAll, _MiscCommand8);

  function UnfoldAll() {
    _classCallCheck(this, UnfoldAll);

    _get(Object.getPrototypeOf(UnfoldAll.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(UnfoldAll, [{
    key: "execute",
    value: function execute() {
      this.editor.unfoldAll();
    }
  }]);

  return UnfoldAll;
})(MiscCommand);

UnfoldAll.register();

// zM

var FoldAll = (function (_MiscCommand9) {
  _inherits(FoldAll, _MiscCommand9);

  function FoldAll() {
    _classCallCheck(this, FoldAll);

    _get(Object.getPrototypeOf(FoldAll.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(FoldAll, [{
    key: "execute",
    value: function execute() {
      var _getFoldInfoByKind = getFoldInfoByKind(this.editor);

      var allFold = _getFoldInfoByKind.allFold;

      if (!allFold) return;

      this.editor.unfoldAll();
      for (var _ref42 of allFold.rowRangesWithIndent) {
        var indent = _ref42.indent;
        var startRow = _ref42.startRow;
        var endRow = _ref42.endRow;

        if (indent <= this.getConfig("maxFoldableIndentLevel")) {
          this.editor.foldBufferRowRange(startRow, endRow);
        }
      }
    }
  }]);

  return FoldAll;
})(MiscCommand);

FoldAll.register();

// zr

var UnfoldNextIndentLevel = (function (_MiscCommand10) {
  _inherits(UnfoldNextIndentLevel, _MiscCommand10);

  function UnfoldNextIndentLevel() {
    _classCallCheck(this, UnfoldNextIndentLevel);

    _get(Object.getPrototypeOf(UnfoldNextIndentLevel.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(UnfoldNextIndentLevel, [{
    key: "execute",
    value: function execute() {
      var _getFoldInfoByKind2 = getFoldInfoByKind(this.editor);

      var folded = _getFoldInfoByKind2.folded;

      if (!folded) return;
      var minIndent = folded.minIndent;
      var rowRangesWithIndent = folded.rowRangesWithIndent;

      var count = limitNumber(this.getCount() - 1, { min: 0 });
      var targetIndents = getList(minIndent, minIndent + count);
      for (var _ref52 of rowRangesWithIndent) {
        var indent = _ref52.indent;
        var startRow = _ref52.startRow;

        if (targetIndents.includes(indent)) {
          this.editor.unfoldBufferRow(startRow);
        }
      }
    }
  }]);

  return UnfoldNextIndentLevel;
})(MiscCommand);

UnfoldNextIndentLevel.register();

// zm

var FoldNextIndentLevel = (function (_MiscCommand11) {
  _inherits(FoldNextIndentLevel, _MiscCommand11);

  function FoldNextIndentLevel() {
    _classCallCheck(this, FoldNextIndentLevel);

    _get(Object.getPrototypeOf(FoldNextIndentLevel.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(FoldNextIndentLevel, [{
    key: "execute",
    value: function execute() {
      var _getFoldInfoByKind3 = getFoldInfoByKind(this.editor);

      var unfolded = _getFoldInfoByKind3.unfolded;
      var allFold = _getFoldInfoByKind3.allFold;

      if (!unfolded) return;
      // FIXME: Why I need unfoldAll()? Why can't I just fold non-folded-fold only?
      // Unless unfoldAll() here, @editor.unfoldAll() delete foldMarker but fail
      // to render unfolded rows correctly.
      // I believe this is bug of text-buffer's markerLayer which assume folds are
      // created **in-order** from top-row to bottom-row.
      this.editor.unfoldAll();

      var maxFoldable = this.getConfig("maxFoldableIndentLevel");
      var fromLevel = Math.min(unfolded.maxIndent, maxFoldable);
      var count = limitNumber(this.getCount() - 1, { min: 0 });
      fromLevel = limitNumber(fromLevel - count, { min: 0 });
      var targetIndents = getList(fromLevel, maxFoldable);
      for (var _ref62 of allFold.rowRangesWithIndent) {
        var indent = _ref62.indent;
        var startRow = _ref62.startRow;
        var endRow = _ref62.endRow;

        if (targetIndents.includes(indent)) {
          this.editor.foldBufferRowRange(startRow, endRow);
        }
      }
    }
  }]);

  return FoldNextIndentLevel;
})(MiscCommand);

FoldNextIndentLevel.register();

var ReplaceModeBackspace = (function (_MiscCommand12) {
  _inherits(ReplaceModeBackspace, _MiscCommand12);

  function ReplaceModeBackspace() {
    _classCallCheck(this, ReplaceModeBackspace);

    _get(Object.getPrototypeOf(ReplaceModeBackspace.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ReplaceModeBackspace, [{
    key: "execute",
    value: function execute() {
      for (var selection of this.editor.getSelections()) {
        // char might be empty.
        var char = this.vimState.modeManager.getReplacedCharForSelection(selection);
        if (char != null) {
          selection.selectLeft();
          if (!selection.insertText(char).isEmpty()) selection.cursor.moveLeft();
        }
      }
    }
  }], [{
    key: "commandScope",
    value: "atom-text-editor.vim-mode-plus.insert-mode.replace",
    enumerable: true
  }]);

  return ReplaceModeBackspace;
})(MiscCommand);

ReplaceModeBackspace.register();

var ScrollWithoutChangingCursorPosition = (function (_MiscCommand13) {
  _inherits(ScrollWithoutChangingCursorPosition, _MiscCommand13);

  function ScrollWithoutChangingCursorPosition() {
    _classCallCheck(this, ScrollWithoutChangingCursorPosition);

    _get(Object.getPrototypeOf(ScrollWithoutChangingCursorPosition.prototype), "constructor", this).apply(this, arguments);

    this.scrolloff = 2;
    this.cursorPixel = null;
  }

  _createClass(ScrollWithoutChangingCursorPosition, [{
    key: "getFirstVisibleScreenRow",
    value: function getFirstVisibleScreenRow() {
      return this.editorElement.getFirstVisibleScreenRow();
    }
  }, {
    key: "getLastVisibleScreenRow",
    value: function getLastVisibleScreenRow() {
      return this.editorElement.getLastVisibleScreenRow();
    }
  }, {
    key: "getLastScreenRow",
    value: function getLastScreenRow() {
      return this.editor.getLastScreenRow();
    }
  }, {
    key: "getCursorPixel",
    value: function getCursorPixel() {
      var point = this.editor.getCursorScreenPosition();
      return this.editorElement.pixelPositionForScreenPosition(point);
    }
  }]);

  return ScrollWithoutChangingCursorPosition;
})(MiscCommand);

ScrollWithoutChangingCursorPosition.register(false);

// ctrl-e scroll lines downwards

var ScrollDown = (function (_ScrollWithoutChangingCursorPosition) {
  _inherits(ScrollDown, _ScrollWithoutChangingCursorPosition);

  function ScrollDown() {
    _classCallCheck(this, ScrollDown);

    _get(Object.getPrototypeOf(ScrollDown.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollDown, [{
    key: "execute",
    value: function execute() {
      var count = this.getCount();
      var oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow + count);
      var newFirstRow = this.editor.getFirstVisibleScreenRow();

      var offset = 2;

      var _editor$getCursorScreenPosition = this.editor.getCursorScreenPosition();

      var row = _editor$getCursorScreenPosition.row;
      var column = _editor$getCursorScreenPosition.column;

      if (row < newFirstRow + offset) {
        var newPoint = [row + count, column];
        this.editor.setCursorScreenPosition(newPoint, { autoscroll: false });
      }
    }
  }]);

  return ScrollDown;
})(ScrollWithoutChangingCursorPosition);

ScrollDown.register();

// ctrl-y scroll lines upwards

var ScrollUp = (function (_ScrollWithoutChangingCursorPosition2) {
  _inherits(ScrollUp, _ScrollWithoutChangingCursorPosition2);

  function ScrollUp() {
    _classCallCheck(this, ScrollUp);

    _get(Object.getPrototypeOf(ScrollUp.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollUp, [{
    key: "execute",
    value: function execute() {
      var count = this.getCount();
      var oldFirstRow = this.editor.getFirstVisibleScreenRow();
      this.editor.setFirstVisibleScreenRow(oldFirstRow - count);
      var newLastRow = this.editor.getLastVisibleScreenRow();

      var offset = 2;

      var _editor$getCursorScreenPosition2 = this.editor.getCursorScreenPosition();

      var row = _editor$getCursorScreenPosition2.row;
      var column = _editor$getCursorScreenPosition2.column;

      if (row >= newLastRow - offset) {
        var newPoint = [row - count, column];
        this.editor.setCursorScreenPosition(newPoint, { autoscroll: false });
      }
    }
  }]);

  return ScrollUp;
})(ScrollWithoutChangingCursorPosition);

ScrollUp.register();

// ScrollWithoutChangingCursorPosition without Cursor Position change.
// -------------------------

var ScrollCursor = (function (_ScrollWithoutChangingCursorPosition3) {
  _inherits(ScrollCursor, _ScrollWithoutChangingCursorPosition3);

  function ScrollCursor() {
    _classCallCheck(this, ScrollCursor);

    _get(Object.getPrototypeOf(ScrollCursor.prototype), "constructor", this).apply(this, arguments);

    this.moveToFirstCharacterOfLine = true;
  }

  _createClass(ScrollCursor, [{
    key: "execute",
    value: function execute() {
      if (this.moveToFirstCharacterOfLine) this.editor.moveToFirstCharacterOfLine();
      if (this.isScrollable()) this.editorElement.setScrollTop(this.getScrollTop());
    }
  }, {
    key: "getOffSetPixelHeight",
    value: function getOffSetPixelHeight() {
      var lineDelta = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      return this.editor.getLineHeightInPixels() * (this.scrolloff + lineDelta);
    }
  }]);

  return ScrollCursor;
})(ScrollWithoutChangingCursorPosition);

ScrollCursor.register(false);

// z enter

var ScrollCursorToTop = (function (_ScrollCursor) {
  _inherits(ScrollCursorToTop, _ScrollCursor);

  function ScrollCursorToTop() {
    _classCallCheck(this, ScrollCursorToTop);

    _get(Object.getPrototypeOf(ScrollCursorToTop.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollCursorToTop, [{
    key: "isScrollable",
    value: function isScrollable() {
      return this.getLastVisibleScreenRow() !== this.getLastScreenRow();
    }
  }, {
    key: "getScrollTop",
    value: function getScrollTop() {
      return this.getCursorPixel().top - this.getOffSetPixelHeight();
    }
  }]);

  return ScrollCursorToTop;
})(ScrollCursor);

ScrollCursorToTop.register();

// zt

var ScrollCursorToTopLeave = (function (_ScrollCursorToTop) {
  _inherits(ScrollCursorToTopLeave, _ScrollCursorToTop);

  function ScrollCursorToTopLeave() {
    _classCallCheck(this, ScrollCursorToTopLeave);

    _get(Object.getPrototypeOf(ScrollCursorToTopLeave.prototype), "constructor", this).apply(this, arguments);

    this.moveToFirstCharacterOfLine = false;
  }

  return ScrollCursorToTopLeave;
})(ScrollCursorToTop);

ScrollCursorToTopLeave.register();

// z-

var ScrollCursorToBottom = (function (_ScrollCursor2) {
  _inherits(ScrollCursorToBottom, _ScrollCursor2);

  function ScrollCursorToBottom() {
    _classCallCheck(this, ScrollCursorToBottom);

    _get(Object.getPrototypeOf(ScrollCursorToBottom.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollCursorToBottom, [{
    key: "isScrollable",
    value: function isScrollable() {
      return this.getFirstVisibleScreenRow() !== 0;
    }
  }, {
    key: "getScrollTop",
    value: function getScrollTop() {
      return this.getCursorPixel().top - (this.editorElement.getHeight() - this.getOffSetPixelHeight(1));
    }
  }]);

  return ScrollCursorToBottom;
})(ScrollCursor);

ScrollCursorToBottom.register();

// zb

var ScrollCursorToBottomLeave = (function (_ScrollCursorToBottom) {
  _inherits(ScrollCursorToBottomLeave, _ScrollCursorToBottom);

  function ScrollCursorToBottomLeave() {
    _classCallCheck(this, ScrollCursorToBottomLeave);

    _get(Object.getPrototypeOf(ScrollCursorToBottomLeave.prototype), "constructor", this).apply(this, arguments);

    this.moveToFirstCharacterOfLine = false;
  }

  return ScrollCursorToBottomLeave;
})(ScrollCursorToBottom);

ScrollCursorToBottomLeave.register();

// z.

var ScrollCursorToMiddle = (function (_ScrollCursor3) {
  _inherits(ScrollCursorToMiddle, _ScrollCursor3);

  function ScrollCursorToMiddle() {
    _classCallCheck(this, ScrollCursorToMiddle);

    _get(Object.getPrototypeOf(ScrollCursorToMiddle.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollCursorToMiddle, [{
    key: "isScrollable",
    value: function isScrollable() {
      return true;
    }
  }, {
    key: "getScrollTop",
    value: function getScrollTop() {
      return this.getCursorPixel().top - this.editorElement.getHeight() / 2;
    }
  }]);

  return ScrollCursorToMiddle;
})(ScrollCursor);

ScrollCursorToMiddle.register();

// zz

var ScrollCursorToMiddleLeave = (function (_ScrollCursorToMiddle) {
  _inherits(ScrollCursorToMiddleLeave, _ScrollCursorToMiddle);

  function ScrollCursorToMiddleLeave() {
    _classCallCheck(this, ScrollCursorToMiddleLeave);

    _get(Object.getPrototypeOf(ScrollCursorToMiddleLeave.prototype), "constructor", this).apply(this, arguments);

    this.moveToFirstCharacterOfLine = false;
  }

  return ScrollCursorToMiddleLeave;
})(ScrollCursorToMiddle);

ScrollCursorToMiddleLeave.register();

// Horizontal ScrollWithoutChangingCursorPosition
// -------------------------
// zs

var ScrollCursorToLeft = (function (_ScrollWithoutChangingCursorPosition4) {
  _inherits(ScrollCursorToLeft, _ScrollWithoutChangingCursorPosition4);

  function ScrollCursorToLeft() {
    _classCallCheck(this, ScrollCursorToLeft);

    _get(Object.getPrototypeOf(ScrollCursorToLeft.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollCursorToLeft, [{
    key: "execute",
    value: function execute() {
      this.editorElement.setScrollLeft(this.getCursorPixel().left);
    }
  }]);

  return ScrollCursorToLeft;
})(ScrollWithoutChangingCursorPosition);

ScrollCursorToLeft.register();

// ze

var ScrollCursorToRight = (function (_ScrollCursorToLeft) {
  _inherits(ScrollCursorToRight, _ScrollCursorToLeft);

  function ScrollCursorToRight() {
    _classCallCheck(this, ScrollCursorToRight);

    _get(Object.getPrototypeOf(ScrollCursorToRight.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ScrollCursorToRight, [{
    key: "execute",
    value: function execute() {
      this.editorElement.setScrollRight(this.getCursorPixel().left);
    }
  }]);

  return ScrollCursorToRight;
})(ScrollCursorToLeft);

ScrollCursorToRight.register();

// insert-mode specific commands
// -------------------------

var InsertMode = (function (_MiscCommand14) {
  _inherits(InsertMode, _MiscCommand14);

  function InsertMode() {
    _classCallCheck(this, InsertMode);

    _get(Object.getPrototypeOf(InsertMode.prototype), "constructor", this).apply(this, arguments);
  }

  return InsertMode;
})(MiscCommand);

InsertMode.commandScope = "atom-text-editor.vim-mode-plus.insert-mode";

var ActivateNormalModeOnce = (function (_InsertMode) {
  _inherits(ActivateNormalModeOnce, _InsertMode);

  function ActivateNormalModeOnce() {
    _classCallCheck(this, ActivateNormalModeOnce);

    _get(Object.getPrototypeOf(ActivateNormalModeOnce.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(ActivateNormalModeOnce, [{
    key: "execute",
    value: function execute() {
      var _this4 = this;

      var cursorsToMoveRight = this.editor.getCursors().filter(function (cursor) {
        return !cursor.isAtBeginningOfLine();
      });
      this.vimState.activate("normal");
      for (var cursor of cursorsToMoveRight) {
        moveCursorRight(cursor);
      }

      var disposable = atom.commands.onDidDispatch(function (event) {
        if (event.type === _this4.getCommandName()) return;

        disposable.dispose();
        disposable = null;
        _this4.vimState.activate("insert");
      });
    }
  }]);

  return ActivateNormalModeOnce;
})(InsertMode);

ActivateNormalModeOnce.register();

var InsertRegister = (function (_InsertMode2) {
  _inherits(InsertRegister, _InsertMode2);

  function InsertRegister() {
    _classCallCheck(this, InsertRegister);

    _get(Object.getPrototypeOf(InsertRegister.prototype), "constructor", this).apply(this, arguments);

    this.requireInput = true;
  }

  _createClass(InsertRegister, [{
    key: "initialize",
    value: function initialize() {
      this.readChar();
      return _get(Object.getPrototypeOf(InsertRegister.prototype), "initialize", this).call(this);
    }
  }, {
    key: "execute",
    value: function execute() {
      var _this5 = this;

      this.editor.transact(function () {
        for (var selection of _this5.editor.getSelections()) {
          var text = _this5.vimState.register.getText(_this5.input, selection);
          selection.insertText(text);
        }
      });
    }
  }]);

  return InsertRegister;
})(InsertMode);

InsertRegister.register();

var InsertLastInserted = (function (_InsertMode3) {
  _inherits(InsertLastInserted, _InsertMode3);

  function InsertLastInserted() {
    _classCallCheck(this, InsertLastInserted);

    _get(Object.getPrototypeOf(InsertLastInserted.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertLastInserted, [{
    key: "execute",
    value: function execute() {
      var text = this.vimState.register.getText(".");
      this.editor.insertText(text);
    }
  }]);

  return InsertLastInserted;
})(InsertMode);

InsertLastInserted.register();

var CopyFromLineAbove = (function (_InsertMode4) {
  _inherits(CopyFromLineAbove, _InsertMode4);

  function CopyFromLineAbove() {
    _classCallCheck(this, CopyFromLineAbove);

    _get(Object.getPrototypeOf(CopyFromLineAbove.prototype), "constructor", this).apply(this, arguments);

    this.rowDelta = -1;
  }

  _createClass(CopyFromLineAbove, [{
    key: "execute",
    value: function execute() {
      var _this6 = this;

      var translation = [this.rowDelta, 0];
      this.editor.transact(function () {
        for (var selection of _this6.editor.getSelections()) {
          var point = selection.cursor.getBufferPosition().translate(translation);
          if (point.row < 0) continue;

          var range = Range.fromPointWithDelta(point, 0, 1);
          var text = _this6.editor.getTextInBufferRange(range);
          if (text) selection.insertText(text);
        }
      });
    }
  }]);

  return CopyFromLineAbove;
})(InsertMode);

CopyFromLineAbove.register();

var CopyFromLineBelow = (function (_CopyFromLineAbove) {
  _inherits(CopyFromLineBelow, _CopyFromLineAbove);

  function CopyFromLineBelow() {
    _classCallCheck(this, CopyFromLineBelow);

    _get(Object.getPrototypeOf(CopyFromLineBelow.prototype), "constructor", this).apply(this, arguments);

    this.rowDelta = +1;
  }

  return CopyFromLineBelow;
})(CopyFromLineAbove);

CopyFromLineBelow.register();

var NextTab = (function (_MiscCommand15) {
  _inherits(NextTab, _MiscCommand15);

  function NextTab() {
    _classCallCheck(this, NextTab);

    _get(Object.getPrototypeOf(NextTab.prototype), "constructor", this).apply(this, arguments);

    this.defaultCount = 0;
  }

  _createClass(NextTab, [{
    key: "execute",
    value: function execute() {
      var count = this.getCount();
      var pane = atom.workspace.paneForItem(this.editor);

      if (count) pane.activateItemAtIndex(count - 1);else pane.activateNextItem();
    }
  }]);

  return NextTab;
})(MiscCommand);

NextTab.register();

var PreviousTab = (function (_MiscCommand16) {
  _inherits(PreviousTab, _MiscCommand16);

  function PreviousTab() {
    _classCallCheck(this, PreviousTab);

    _get(Object.getPrototypeOf(PreviousTab.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(PreviousTab, [{
    key: "execute",
    value: function execute() {
      atom.workspace.paneForItem(this.editor).activatePreviousItem();
    }
  }]);

  return PreviousTab;
})(MiscCommand);

PreviousTab.register();
// atom default. Better to use editor.getVerticalScrollMargin()?
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbWlzYy1jb21tYW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7OztlQUVLLE9BQU8sQ0FBQyxNQUFNLENBQUM7O0lBQXhCLEtBQUssWUFBTCxLQUFLOztBQUNaLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7Z0JBYzFCLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBWnBCLGVBQWUsYUFBZixlQUFlO0lBQ2YsZUFBZSxhQUFmLGVBQWU7SUFDZixZQUFZLGFBQVosWUFBWTtJQUNaLFVBQVUsYUFBVixVQUFVO0lBQ1Ysc0JBQXNCLGFBQXRCLHNCQUFzQjtJQUN0QixpQkFBaUIsYUFBakIsaUJBQWlCO0lBQ2pCLHdCQUF3QixhQUF4Qix3QkFBd0I7SUFDeEIsbUJBQW1CLGFBQW5CLG1CQUFtQjtJQUNuQixpQkFBaUIsYUFBakIsaUJBQWlCO0lBQ2pCLFdBQVcsYUFBWCxXQUFXO0lBQ1gsMENBQTBDLGFBQTFDLDBDQUEwQztJQUMxQyxPQUFPLGFBQVAsT0FBTzs7SUFHSCxXQUFXO1lBQVgsV0FBVzs7V0FBWCxXQUFXOzBCQUFYLFdBQVc7OytCQUFYLFdBQVc7OztlQUFYLFdBQVc7O1dBQ1EsY0FBYzs7OztTQURqQyxXQUFXO0dBQVMsSUFBSTs7QUFHOUIsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQTs7SUFFckIsSUFBSTtZQUFKLElBQUk7O1dBQUosSUFBSTswQkFBSixJQUFJOzsrQkFBSixJQUFJOztTQUNSLFlBQVksR0FBRyxJQUFJOzs7ZUFEZixJQUFJOztXQUVFLHNCQUFHO0FBQ1gsVUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFBO0FBQ2Ysd0NBSkUsSUFBSSw0Q0FJbUI7S0FDMUI7OztXQUVNLG1CQUFHO0FBQ1IsVUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENB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LENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTs7QUFFcEQsVUFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQSxLQUN6QyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQTtLQUM3Qjs7O1NBVEcsT0FBTztHQUFTLFdBQVc7O0FBV2pDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQTs7SUFFWixXQUFXO1lBQVgsV0FBVzs7V0FBWCxXQUFXOzBCQUFYLFdBQVc7OytCQUFYLFdBQVc7OztlQUFYLFdBQVc7O1dBQ1IsbUJBQUc7QUFDUixVQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsb0JBQW9CLEVBQUUsQ0FBQTtLQUMvRDs7O1NBSEcsV0FBVztHQUFTLFdBQVc7O0FBS3JDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQSIsImZpbGUiOiIvVXNlcnMvamVzc2VsdW1hcmllL2RvdGZpbGVzLy5hdG9tL3BhY2thZ2VzL3ZpbS1tb2RlLXBsdXMvbGliL21pc2MtY29tbWFuZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCJcblxuY29uc3Qge1JhbmdlfSA9IHJlcXVpcmUoXCJhdG9tXCIpXG5jb25zdCBCYXNlID0gcmVxdWlyZShcIi4vYmFzZVwiKVxuY29uc3Qge1xuICBtb3ZlQ3Vyc29yUmlnaHQsXG4gIGlzTGluZXdpc2VSYW5nZSxcbiAgc2V0QnVmZmVyUm93LFxuICBzb3J0UmFuZ2VzLFxuICBmaW5kUmFuZ2VDb250YWluc1BvaW50LFxuICBpc1NpbmdsZUxpbmVSYW5nZSxcbiAgaXNMZWFkaW5nV2hpdGVTcGFjZVJhbmdlLFxuICBodW1hbml6ZUJ1ZmZlclJhbmdlLFxuICBnZXRGb2xkSW5mb0J5S2luZCxcbiAgbGltaXROdW1iZXIsXG4gIGdldEZvbGRSb3dSYW5nZXNDb250YWluZWRCeUZvbGRTdGFydHNBdFJvdyxcbiAgZ2V0TGlzdCxcbn0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxuXG5jbGFzcyBNaXNjQ29tbWFuZCBleHRlbmRzIEJhc2Uge1xuICBzdGF0aWMgb3BlcmF0aW9uS2luZCA9IFwibWlzYy1jb21tYW5kXCJcbn1cbk1pc2NDb21tYW5kLnJlZ2lzdGVyKGZhbHNlKVxuXG5jbGFzcyBNYXJrIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICByZXF1aXJlSW5wdXQgPSB0cnVlXG4gIGluaXRpYWxpemUoKSB7XG4gICAgdGhpcy5yZWFkQ2hhcigpXG4gICAgcmV0dXJuIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgZXhlY3V0ZSgpIHtcbiAgICB0aGlzLnZpbVN0YXRlLm1hcmsuc2V0KHRoaXMuaW5wdXQsIHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgdGhpcy5hY3RpdmF0ZU1vZGUoXCJub3JtYWxcIilcbiAgfVxufVxuTWFyay5yZWdpc3RlcigpXG5cbmNsYXNzIFJldmVyc2VTZWxlY3Rpb25zIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlKCkge1xuICAgIHRoaXMuc3dyYXAuc2V0UmV2ZXJzZWRTdGF0ZSh0aGlzLmVkaXRvciwgIXRoaXMuZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKS5pc1JldmVyc2VkKCkpXG4gICAgaWYgKHRoaXMuaXNNb2RlKFwidmlzdWFsXCIsIFwiYmxvY2t3aXNlXCIpKSB7XG4gICAgICB0aGlzLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKClcbiAgICB9XG4gIH1cbn1cblJldmVyc2VTZWxlY3Rpb25zLnJlZ2lzdGVyKClcblxuY2xhc3MgQmxvY2t3aXNlT3RoZXJFbmQgZXh0ZW5kcyBSZXZlcnNlU2VsZWN0aW9ucyB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgZm9yIChjb25zdCBibG9ja3dpc2VTZWxlY3Rpb24gb2YgdGhpcy5nZXRCbG9ja3dpc2VTZWxlY3Rpb25zKCkpIHtcbiAgICAgIGJsb2Nrd2lzZVNlbGVjdGlvbi5yZXZlcnNlKClcbiAgICB9XG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cbn1cbkJsb2Nrd2lzZU90aGVyRW5kLnJlZ2lzdGVyKClcblxuY2xhc3MgVW5kbyBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgc2V0Q3Vyc29yUG9zaXRpb24oe25ld1Jhbmdlcywgb2xkUmFuZ2VzLCBzdHJhdGVneX0pIHtcbiAgICBjb25zdCBsYXN0Q3Vyc29yID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpIC8vIFRoaXMgaXMgcmVzdG9yZWQgY3Vyc29yXG5cbiAgICBjb25zdCBjaGFuZ2VkUmFuZ2UgPVxuICAgICAgc3RyYXRlZ3kgPT09IFwic21hcnRcIlxuICAgICAgICA/IGZpbmRSYW5nZUNvbnRhaW5zUG9pbnQobmV3UmFuZ2VzLCBsYXN0Q3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgIDogc29ydFJhbmdlcyhuZXdSYW5nZXMuY29uY2F0KG9sZFJhbmdlcykpWzBdXG5cbiAgICBpZiAoY2hhbmdlZFJhbmdlKSB7XG4gICAgICBpZiAoaXNMaW5ld2lzZVJhbmdlKGNoYW5nZWRSYW5nZSkpIHNldEJ1ZmZlclJvdyhsYXN0Q3Vyc29yLCBjaGFuZ2VkUmFuZ2Uuc3RhcnQucm93KVxuICAgICAgZWxzZSBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKGNoYW5nZWRSYW5nZS5zdGFydClcbiAgICB9XG4gIH1cblxuICBtdXRhdGVXaXRoVHJhY2tDaGFuZ2VzKCkge1xuICAgIGNvbnN0IG5ld1JhbmdlcyA9IFtdXG4gICAgY29uc3Qgb2xkUmFuZ2VzID0gW11cblxuICAgIC8vIENvbGxlY3QgY2hhbmdlZCByYW5nZSB3aGlsZSBtdXRhdGluZyB0ZXh0LXN0YXRlIGJ5IGZuIGNhbGxiYWNrLlxuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLmVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSgoe25ld1JhbmdlLCBvbGRSYW5nZX0pID0+IHtcbiAgICAgIGlmIChuZXdSYW5nZS5pc0VtcHR5KCkpIHtcbiAgICAgICAgb2xkUmFuZ2VzLnB1c2gob2xkUmFuZ2UpIC8vIFJlbW92ZSBvbmx5XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdSYW5nZXMucHVzaChuZXdSYW5nZSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgdGhpcy5tdXRhdGUoKVxuICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgcmV0dXJuIHtuZXdSYW5nZXMsIG9sZFJhbmdlc31cbiAgfVxuXG4gIGZsYXNoQ2hhbmdlcyh7bmV3UmFuZ2VzLCBvbGRSYW5nZXN9KSB7XG4gICAgY29uc3QgaXNNdWx0aXBsZVNpbmdsZUxpbmVSYW5nZXMgPSByYW5nZXMgPT4gcmFuZ2VzLmxlbmd0aCA+IDEgJiYgcmFuZ2VzLmV2ZXJ5KGlzU2luZ2xlTGluZVJhbmdlKVxuXG4gICAgaWYgKG5ld1Jhbmdlcy5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAodGhpcy5pc011bHRpcGxlQW5kQWxsUmFuZ2VIYXZlU2FtZUNvbHVtbkFuZENvbnNlY3V0aXZlUm93cyhuZXdSYW5nZXMpKSByZXR1cm5cblxuICAgICAgbmV3UmFuZ2VzID0gbmV3UmFuZ2VzLm1hcChyYW5nZSA9PiBodW1hbml6ZUJ1ZmZlclJhbmdlKHRoaXMuZWRpdG9yLCByYW5nZSkpXG4gICAgICBuZXdSYW5nZXMgPSB0aGlzLmZpbHRlck5vbkxlYWRpbmdXaGl0ZVNwYWNlUmFuZ2UobmV3UmFuZ2VzKVxuXG4gICAgICBjb25zdCB0eXBlID0gaXNNdWx0aXBsZVNpbmdsZUxpbmVSYW5nZXMobmV3UmFuZ2VzKSA/IFwidW5kby1yZWRvLW11bHRpcGxlLWNoYW5nZXNcIiA6IFwidW5kby1yZWRvXCJcbiAgICAgIHRoaXMuZmxhc2gobmV3UmFuZ2VzLCB7dHlwZX0pXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLmlzTXVsdGlwbGVBbmRBbGxSYW5nZUhhdmVTYW1lQ29sdW1uQW5kQ29uc2VjdXRpdmVSb3dzKG9sZFJhbmdlcykpIHJldHVyblxuXG4gICAgICBpZiAoaXNNdWx0aXBsZVNpbmdsZUxpbmVSYW5nZXMob2xkUmFuZ2VzKSkge1xuICAgICAgICBvbGRSYW5nZXMgPSB0aGlzLmZpbHRlck5vbkxlYWRpbmdXaGl0ZVNwYWNlUmFuZ2Uob2xkUmFuZ2VzKVxuICAgICAgICB0aGlzLmZsYXNoKG9sZFJhbmdlcywge3R5cGU6IFwidW5kby1yZWRvLW11bHRpcGxlLWRlbGV0ZVwifSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmaWx0ZXJOb25MZWFkaW5nV2hpdGVTcGFjZVJhbmdlKHJhbmdlcykge1xuICAgIHJldHVybiByYW5nZXMuZmlsdGVyKHJhbmdlID0+ICFpc0xlYWRpbmdXaGl0ZVNwYWNlUmFuZ2UodGhpcy5lZGl0b3IsIHJhbmdlKSlcbiAgfVxuXG4gIC8vIFtUT0RPXSBJbXByb3ZlIGZ1cnRoZXIgYnkgY2hlY2tpbmcgb2xkVGV4dCwgbmV3VGV4dD9cbiAgLy8gW1B1cnBvc2Ugb2YgdGhpcyBmdW5jdGlvbl1cbiAgLy8gU3VwcHJlc3MgZmxhc2ggd2hlbiB1bmRvL3JlZG9pbmcgdG9nZ2xlLWNvbW1lbnQgd2hpbGUgZmxhc2hpbmcgdW5kby9yZWRvIG9mIG9jY3VycmVuY2Ugb3BlcmF0aW9uLlxuICAvLyBUaGlzIGh1cmlzdGljIGFwcHJvYWNoIG5ldmVyIGJlIHBlcmZlY3QuXG4gIC8vIFVsdGltYXRlbHkgY2Fubm5vdCBkaXN0aW5ndWlzaCBvY2N1cnJlbmNlIG9wZXJhdGlvbi5cbiAgaXNNdWx0aXBsZUFuZEFsbFJhbmdlSGF2ZVNhbWVDb2x1bW5BbmRDb25zZWN1dGl2ZVJvd3MocmFuZ2VzKSB7XG4gICAgaWYgKHJhbmdlcy5sZW5ndGggPD0gMSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuXG4gICAgY29uc3Qge3N0YXJ0OiB7Y29sdW1uOiBzdGFydENvbHVtbn0sIGVuZDoge2NvbHVtbjogZW5kQ29sdW1ufX0gPSByYW5nZXNbMF1cbiAgICBsZXQgcHJldmlvdXNSb3dcblxuICAgIGZvciAoY29uc3QgcmFuZ2Ugb2YgcmFuZ2VzKSB7XG4gICAgICBjb25zdCB7c3RhcnQsIGVuZH0gPSByYW5nZVxuICAgICAgaWYgKHN0YXJ0LmNvbHVtbiAhPT0gc3RhcnRDb2x1bW4gfHwgZW5kLmNvbHVtbiAhPT0gZW5kQ29sdW1uKSByZXR1cm4gZmFsc2VcbiAgICAgIGlmIChwcmV2aW91c1JvdyAhPSBudWxsICYmIHByZXZpb3VzUm93ICsgMSAhPT0gc3RhcnQucm93KSByZXR1cm4gZmFsc2VcbiAgICAgIHByZXZpb3VzUm93ID0gc3RhcnQucm93XG4gICAgfVxuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBmbGFzaChyYW5nZXMsIG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy50aW1lb3V0ID09IG51bGwpIG9wdGlvbnMudGltZW91dCA9IDUwMFxuICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4gdGhpcy52aW1TdGF0ZS5mbGFzaChyYW5nZXMsIG9wdGlvbnMpKVxuICB9XG5cbiAgZXhlY3V0ZSgpIHtcbiAgICBjb25zdCB7bmV3UmFuZ2VzLCBvbGRSYW5nZXN9ID0gdGhpcy5tdXRhdGVXaXRoVHJhY2tDaGFuZ2VzKClcblxuICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgc2VsZWN0aW9uLmNsZWFyKClcbiAgICB9XG5cbiAgICBpZiAodGhpcy5nZXRDb25maWcoXCJzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvXCIpKSB7XG4gICAgICBjb25zdCBzdHJhdGVneSA9IHRoaXMuZ2V0Q29uZmlnKFwic2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkb1N0cmF0ZWd5XCIpXG4gICAgICB0aGlzLnNldEN1cnNvclBvc2l0aW9uKHtuZXdSYW5nZXMsIG9sZFJhbmdlcywgc3RyYXRlZ3l9KVxuICAgICAgdGhpcy52aW1TdGF0ZS5jbGVhclNlbGVjdGlvbnMoKVxuICAgIH1cblxuICAgIGlmICh0aGlzLmdldENvbmZpZyhcImZsYXNoT25VbmRvUmVkb1wiKSkgdGhpcy5mbGFzaENoYW5nZXMoe25ld1Jhbmdlcywgb2xkUmFuZ2VzfSlcbiAgICB0aGlzLmFjdGl2YXRlTW9kZShcIm5vcm1hbFwiKVxuICB9XG5cbiAgbXV0YXRlKCkge1xuICAgIHRoaXMuZWRpdG9yLnVuZG8oKVxuICB9XG59XG5VbmRvLnJlZ2lzdGVyKClcblxuY2xhc3MgUmVkbyBleHRlbmRzIFVuZG8ge1xuICBtdXRhdGUoKSB7XG4gICAgdGhpcy5lZGl0b3IucmVkbygpXG4gIH1cbn1cblJlZG8ucmVnaXN0ZXIoKVxuXG4vLyB6Y1xuY2xhc3MgRm9sZEN1cnJlbnRSb3cgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICB0aGlzLmVkaXRvci5mb2xkQnVmZmVyUm93KHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3cpXG4gICAgfVxuICB9XG59XG5Gb2xkQ3VycmVudFJvdy5yZWdpc3RlcigpXG5cbi8vIHpvXG5jbGFzcyBVbmZvbGRDdXJyZW50Um93IGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBleGVjdXRlKCkge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgdGhpcy5lZGl0b3IudW5mb2xkQnVmZmVyUm93KHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3cpXG4gICAgfVxuICB9XG59XG5VbmZvbGRDdXJyZW50Um93LnJlZ2lzdGVyKClcblxuLy8gemFcbmNsYXNzIFRvZ2dsZUZvbGQgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5lZGl0b3IudG9nZ2xlRm9sZEF0QnVmZmVyUm93KHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkucm93KVxuICB9XG59XG5Ub2dnbGVGb2xkLnJlZ2lzdGVyKClcblxuLy8gQmFzZSBvZiB6Qywgek8sIHpBXG5jbGFzcyBGb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5QmFzZSBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgZm9sZFJlY3Vyc2l2ZWx5KHJvdykge1xuICAgIGNvbnN0IHJvd1JhbmdlcyA9IGdldEZvbGRSb3dSYW5nZXNDb250YWluZWRCeUZvbGRTdGFydHNBdFJvdyh0aGlzLmVkaXRvciwgcm93KVxuICAgIGlmICghcm93UmFuZ2VzKSByZXR1cm5cbiAgICBjb25zdCBzdGFydFJvd3MgPSByb3dSYW5nZXMubWFwKHJvd1JhbmdlID0+IHJvd1JhbmdlWzBdKVxuICAgIGZvciAoY29uc3Qgcm93IG9mIHN0YXJ0Um93cy5yZXZlcnNlKCkpIHtcbiAgICAgIGlmICghdGhpcy5lZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmZvbGRCdWZmZXJSb3cocm93KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHVuZm9sZFJlY3Vyc2l2ZWx5KHJvdykge1xuICAgIGNvbnN0IHJvd1JhbmdlcyA9IGdldEZvbGRSb3dSYW5nZXNDb250YWluZWRCeUZvbGRTdGFydHNBdFJvdyh0aGlzLmVkaXRvciwgcm93KVxuICAgIGlmICghcm93UmFuZ2VzKSByZXR1cm5cbiAgICBjb25zdCBzdGFydFJvd3MgPSByb3dSYW5nZXMubWFwKHJvd1JhbmdlID0+IHJvd1JhbmdlWzBdKVxuICAgIGZvciAocm93IG9mIHN0YXJ0Um93cykge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yLmlzRm9sZGVkQXRCdWZmZXJSb3cocm93KSkge1xuICAgICAgICB0aGlzLmVkaXRvci51bmZvbGRCdWZmZXJSb3cocm93KVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvbGRSZWN1cnNpdmVseUZvckFsbFNlbGVjdGlvbnMoKSB7XG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9uc09yZGVyZWRCeUJ1ZmZlclBvc2l0aW9uKCkucmV2ZXJzZSgpKSB7XG4gICAgICB0aGlzLmZvbGRSZWN1cnNpdmVseSh0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikucm93KVxuICAgIH1cbiAgfVxuXG4gIHVuZm9sZFJlY3Vyc2l2ZWx5Rm9yQWxsU2VsZWN0aW9ucygpIHtcbiAgICBmb3IgKGNvbnN0IHNlbGVjdGlvbiBvZiB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb25zT3JkZXJlZEJ5QnVmZmVyUG9zaXRpb24oKSkge1xuICAgICAgdGhpcy51bmZvbGRSZWN1cnNpdmVseSh0aGlzLmdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikucm93KVxuICAgIH1cbiAgfVxufVxuRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2UucmVnaXN0ZXIoZmFsc2UpXG5cbi8vIHpDXG5jbGFzcyBGb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5IGV4dGVuZHMgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2Uge1xuICBleGVjdXRlKCkge1xuICAgIHRoaXMuZm9sZFJlY3Vyc2l2ZWx5Rm9yQWxsU2VsZWN0aW9ucygpXG4gIH1cbn1cbkZvbGRDdXJyZW50Um93UmVjdXJzaXZlbHkucmVnaXN0ZXIoKVxuXG4vLyB6T1xuY2xhc3MgVW5mb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5IGV4dGVuZHMgRm9sZEN1cnJlbnRSb3dSZWN1cnNpdmVseUJhc2Uge1xuICBleGVjdXRlKCkge1xuICAgIHRoaXMudW5mb2xkUmVjdXJzaXZlbHlGb3JBbGxTZWxlY3Rpb25zKClcbiAgfVxufVxuVW5mb2xkQ3VycmVudFJvd1JlY3Vyc2l2ZWx5LnJlZ2lzdGVyKClcblxuLy8gekFcbmNsYXNzIFRvZ2dsZUZvbGRSZWN1cnNpdmVseSBleHRlbmRzIEZvbGRDdXJyZW50Um93UmVjdXJzaXZlbHlCYXNlIHtcbiAgZXhlY3V0ZSgpIHtcbiAgICBjb25zdCB7cm93fSA9IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24odGhpcy5lZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgIGlmICh0aGlzLmVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdykpIHtcbiAgICAgIHRoaXMudW5mb2xkUmVjdXJzaXZlbHlGb3JBbGxTZWxlY3Rpb25zKClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5mb2xkUmVjdXJzaXZlbHlGb3JBbGxTZWxlY3Rpb25zKClcbiAgICB9XG4gIH1cbn1cblRvZ2dsZUZvbGRSZWN1cnNpdmVseS5yZWdpc3RlcigpXG5cbi8vIHpSXG5jbGFzcyBVbmZvbGRBbGwgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5lZGl0b3IudW5mb2xkQWxsKClcbiAgfVxufVxuVW5mb2xkQWxsLnJlZ2lzdGVyKClcblxuLy8gek1cbmNsYXNzIEZvbGRBbGwgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgY29uc3Qge2FsbEZvbGR9ID0gZ2V0Rm9sZEluZm9CeUtpbmQodGhpcy5lZGl0b3IpXG4gICAgaWYgKCFhbGxGb2xkKSByZXR1cm5cblxuICAgIHRoaXMuZWRpdG9yLnVuZm9sZEFsbCgpXG4gICAgZm9yIChjb25zdCB7aW5kZW50LCBzdGFydFJvdywgZW5kUm93fSBvZiBhbGxGb2xkLnJvd1Jhbmdlc1dpdGhJbmRlbnQpIHtcbiAgICAgIGlmIChpbmRlbnQgPD0gdGhpcy5nZXRDb25maWcoXCJtYXhGb2xkYWJsZUluZGVudExldmVsXCIpKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLmZvbGRCdWZmZXJSb3dSYW5nZShzdGFydFJvdywgZW5kUm93KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuRm9sZEFsbC5yZWdpc3RlcigpXG5cbi8vIHpyXG5jbGFzcyBVbmZvbGROZXh0SW5kZW50TGV2ZWwgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgY29uc3Qge2ZvbGRlZH0gPSBnZXRGb2xkSW5mb0J5S2luZCh0aGlzLmVkaXRvcilcbiAgICBpZiAoIWZvbGRlZCkgcmV0dXJuXG4gICAgY29uc3Qge21pbkluZGVudCwgcm93UmFuZ2VzV2l0aEluZGVudH0gPSBmb2xkZWRcbiAgICBjb25zdCBjb3VudCA9IGxpbWl0TnVtYmVyKHRoaXMuZ2V0Q291bnQoKSAtIDEsIHttaW46IDB9KVxuICAgIGNvbnN0IHRhcmdldEluZGVudHMgPSBnZXRMaXN0KG1pbkluZGVudCwgbWluSW5kZW50ICsgY291bnQpXG4gICAgZm9yIChjb25zdCB7aW5kZW50LCBzdGFydFJvd30gb2Ygcm93UmFuZ2VzV2l0aEluZGVudCkge1xuICAgICAgaWYgKHRhcmdldEluZGVudHMuaW5jbHVkZXMoaW5kZW50KSkge1xuICAgICAgICB0aGlzLmVkaXRvci51bmZvbGRCdWZmZXJSb3coc3RhcnRSb3cpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5VbmZvbGROZXh0SW5kZW50TGV2ZWwucmVnaXN0ZXIoKVxuXG4vLyB6bVxuY2xhc3MgRm9sZE5leHRJbmRlbnRMZXZlbCBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgZXhlY3V0ZSgpIHtcbiAgICBjb25zdCB7dW5mb2xkZWQsIGFsbEZvbGR9ID0gZ2V0Rm9sZEluZm9CeUtpbmQodGhpcy5lZGl0b3IpXG4gICAgaWYgKCF1bmZvbGRlZCkgcmV0dXJuXG4gICAgLy8gRklYTUU6IFdoeSBJIG5lZWQgdW5mb2xkQWxsKCk/IFdoeSBjYW4ndCBJIGp1c3QgZm9sZCBub24tZm9sZGVkLWZvbGQgb25seT9cbiAgICAvLyBVbmxlc3MgdW5mb2xkQWxsKCkgaGVyZSwgQGVkaXRvci51bmZvbGRBbGwoKSBkZWxldGUgZm9sZE1hcmtlciBidXQgZmFpbFxuICAgIC8vIHRvIHJlbmRlciB1bmZvbGRlZCByb3dzIGNvcnJlY3RseS5cbiAgICAvLyBJIGJlbGlldmUgdGhpcyBpcyBidWcgb2YgdGV4dC1idWZmZXIncyBtYXJrZXJMYXllciB3aGljaCBhc3N1bWUgZm9sZHMgYXJlXG4gICAgLy8gY3JlYXRlZCAqKmluLW9yZGVyKiogZnJvbSB0b3Atcm93IHRvIGJvdHRvbS1yb3cuXG4gICAgdGhpcy5lZGl0b3IudW5mb2xkQWxsKClcblxuICAgIGNvbnN0IG1heEZvbGRhYmxlID0gdGhpcy5nZXRDb25maWcoXCJtYXhGb2xkYWJsZUluZGVudExldmVsXCIpXG4gICAgbGV0IGZyb21MZXZlbCA9IE1hdGgubWluKHVuZm9sZGVkLm1heEluZGVudCwgbWF4Rm9sZGFibGUpXG4gICAgY29uc3QgY291bnQgPSBsaW1pdE51bWJlcih0aGlzLmdldENvdW50KCkgLSAxLCB7bWluOiAwfSlcbiAgICBmcm9tTGV2ZWwgPSBsaW1pdE51bWJlcihmcm9tTGV2ZWwgLSBjb3VudCwge21pbjogMH0pXG4gICAgY29uc3QgdGFyZ2V0SW5kZW50cyA9IGdldExpc3QoZnJvbUxldmVsLCBtYXhGb2xkYWJsZSlcbiAgICBmb3IgKGNvbnN0IHtpbmRlbnQsIHN0YXJ0Um93LCBlbmRSb3d9IG9mIGFsbEZvbGQucm93UmFuZ2VzV2l0aEluZGVudCkge1xuICAgICAgaWYgKHRhcmdldEluZGVudHMuaW5jbHVkZXMoaW5kZW50KSkge1xuICAgICAgICB0aGlzLmVkaXRvci5mb2xkQnVmZmVyUm93UmFuZ2Uoc3RhcnRSb3csIGVuZFJvdylcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbkZvbGROZXh0SW5kZW50TGV2ZWwucmVnaXN0ZXIoKVxuXG5jbGFzcyBSZXBsYWNlTW9kZUJhY2tzcGFjZSBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgc3RhdGljIGNvbW1hbmRTY29wZSA9IFwiYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzLmluc2VydC1tb2RlLnJlcGxhY2VcIlxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICAvLyBjaGFyIG1pZ2h0IGJlIGVtcHR5LlxuICAgICAgY29uc3QgY2hhciA9IHRoaXMudmltU3RhdGUubW9kZU1hbmFnZXIuZ2V0UmVwbGFjZWRDaGFyRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgIGlmIChjaGFyICE9IG51bGwpIHtcbiAgICAgICAgc2VsZWN0aW9uLnNlbGVjdExlZnQoKVxuICAgICAgICBpZiAoIXNlbGVjdGlvbi5pbnNlcnRUZXh0KGNoYXIpLmlzRW1wdHkoKSkgc2VsZWN0aW9uLmN1cnNvci5tb3ZlTGVmdCgpXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5SZXBsYWNlTW9kZUJhY2tzcGFjZS5yZWdpc3RlcigpXG5cbmNsYXNzIFNjcm9sbFdpdGhvdXRDaGFuZ2luZ0N1cnNvclBvc2l0aW9uIGV4dGVuZHMgTWlzY0NvbW1hbmQge1xuICBzY3JvbGxvZmYgPSAyIC8vIGF0b20gZGVmYXVsdC4gQmV0dGVyIHRvIHVzZSBlZGl0b3IuZ2V0VmVydGljYWxTY3JvbGxNYXJnaW4oKT9cbiAgY3Vyc29yUGl4ZWwgPSBudWxsXG5cbiAgZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkge1xuICAgIHJldHVybiB0aGlzLmVkaXRvckVsZW1lbnQuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgfVxuXG4gIGdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkge1xuICAgIHJldHVybiB0aGlzLmVkaXRvckVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICB9XG5cbiAgZ2V0TGFzdFNjcmVlblJvdygpIHtcbiAgICByZXR1cm4gdGhpcy5lZGl0b3IuZ2V0TGFzdFNjcmVlblJvdygpXG4gIH1cblxuICBnZXRDdXJzb3JQaXhlbCgpIHtcbiAgICBjb25zdCBwb2ludCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcbiAgICByZXR1cm4gdGhpcy5lZGl0b3JFbGVtZW50LnBpeGVsUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihwb2ludClcbiAgfVxufVxuU2Nyb2xsV2l0aG91dENoYW5naW5nQ3Vyc29yUG9zaXRpb24ucmVnaXN0ZXIoZmFsc2UpXG5cbi8vIGN0cmwtZSBzY3JvbGwgbGluZXMgZG93bndhcmRzXG5jbGFzcyBTY3JvbGxEb3duIGV4dGVuZHMgU2Nyb2xsV2l0aG91dENoYW5naW5nQ3Vyc29yUG9zaXRpb24ge1xuICBleGVjdXRlKCkge1xuICAgIGNvbnN0IGNvdW50ID0gdGhpcy5nZXRDb3VudCgpXG4gICAgY29uc3Qgb2xkRmlyc3RSb3cgPSB0aGlzLmVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgIHRoaXMuZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhvbGRGaXJzdFJvdyArIGNvdW50KVxuICAgIGNvbnN0IG5ld0ZpcnN0Um93ID0gdGhpcy5lZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICAgIGNvbnN0IG9mZnNldCA9IDJcbiAgICBjb25zdCB7cm93LCBjb2x1bW59ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuICAgIGlmIChyb3cgPCBuZXdGaXJzdFJvdyArIG9mZnNldCkge1xuICAgICAgY29uc3QgbmV3UG9pbnQgPSBbcm93ICsgY291bnQsIGNvbHVtbl1cbiAgICAgIHRoaXMuZWRpdG9yLnNldEN1cnNvclNjcmVlblBvc2l0aW9uKG5ld1BvaW50LCB7YXV0b3Njcm9sbDogZmFsc2V9KVxuICAgIH1cbiAgfVxufVxuU2Nyb2xsRG93bi5yZWdpc3RlcigpXG5cbi8vIGN0cmwteSBzY3JvbGwgbGluZXMgdXB3YXJkc1xuY2xhc3MgU2Nyb2xsVXAgZXh0ZW5kcyBTY3JvbGxXaXRob3V0Q2hhbmdpbmdDdXJzb3JQb3NpdGlvbiB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmdldENvdW50KClcbiAgICBjb25zdCBvbGRGaXJzdFJvdyA9IHRoaXMuZWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpXG4gICAgdGhpcy5lZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KG9sZEZpcnN0Um93IC0gY291bnQpXG4gICAgY29uc3QgbmV3TGFzdFJvdyA9IHRoaXMuZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcblxuICAgIGNvbnN0IG9mZnNldCA9IDJcbiAgICBjb25zdCB7cm93LCBjb2x1bW59ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yU2NyZWVuUG9zaXRpb24oKVxuICAgIGlmIChyb3cgPj0gbmV3TGFzdFJvdyAtIG9mZnNldCkge1xuICAgICAgY29uc3QgbmV3UG9pbnQgPSBbcm93IC0gY291bnQsIGNvbHVtbl1cbiAgICAgIHRoaXMuZWRpdG9yLnNldEN1cnNvclNjcmVlblBvc2l0aW9uKG5ld1BvaW50LCB7YXV0b3Njcm9sbDogZmFsc2V9KVxuICAgIH1cbiAgfVxufVxuU2Nyb2xsVXAucmVnaXN0ZXIoKVxuXG4vLyBTY3JvbGxXaXRob3V0Q2hhbmdpbmdDdXJzb3JQb3NpdGlvbiB3aXRob3V0IEN1cnNvciBQb3NpdGlvbiBjaGFuZ2UuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTY3JvbGxDdXJzb3IgZXh0ZW5kcyBTY3JvbGxXaXRob3V0Q2hhbmdpbmdDdXJzb3JQb3NpdGlvbiB7XG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lID0gdHJ1ZVxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgaWYgKHRoaXMubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUpIHRoaXMuZWRpdG9yLm1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lKClcbiAgICBpZiAodGhpcy5pc1Njcm9sbGFibGUoKSkgdGhpcy5lZGl0b3JFbGVtZW50LnNldFNjcm9sbFRvcCh0aGlzLmdldFNjcm9sbFRvcCgpKVxuICB9XG5cbiAgZ2V0T2ZmU2V0UGl4ZWxIZWlnaHQobGluZURlbHRhID0gMCkge1xuICAgIHJldHVybiB0aGlzLmVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqICh0aGlzLnNjcm9sbG9mZiArIGxpbmVEZWx0YSlcbiAgfVxufVxuU2Nyb2xsQ3Vyc29yLnJlZ2lzdGVyKGZhbHNlKVxuXG4vLyB6IGVudGVyXG5jbGFzcyBTY3JvbGxDdXJzb3JUb1RvcCBleHRlbmRzIFNjcm9sbEN1cnNvciB7XG4gIGlzU2Nyb2xsYWJsZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpICE9PSB0aGlzLmdldExhc3RTY3JlZW5Sb3coKVxuICB9XG5cbiAgZ2V0U2Nyb2xsVG9wKCkge1xuICAgIHJldHVybiB0aGlzLmdldEN1cnNvclBpeGVsKCkudG9wIC0gdGhpcy5nZXRPZmZTZXRQaXhlbEhlaWdodCgpXG4gIH1cbn1cblNjcm9sbEN1cnNvclRvVG9wLnJlZ2lzdGVyKClcblxuLy8genRcbmNsYXNzIFNjcm9sbEN1cnNvclRvVG9wTGVhdmUgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb1RvcCB7XG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lID0gZmFsc2Vcbn1cblNjcm9sbEN1cnNvclRvVG9wTGVhdmUucmVnaXN0ZXIoKVxuXG4vLyB6LVxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9Cb3R0b20gZXh0ZW5kcyBTY3JvbGxDdXJzb3Ige1xuICBpc1Njcm9sbGFibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkgIT09IDBcbiAgfVxuXG4gIGdldFNjcm9sbFRvcCgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDdXJzb3JQaXhlbCgpLnRvcCAtICh0aGlzLmVkaXRvckVsZW1lbnQuZ2V0SGVpZ2h0KCkgLSB0aGlzLmdldE9mZlNldFBpeGVsSGVpZ2h0KDEpKVxuICB9XG59XG5TY3JvbGxDdXJzb3JUb0JvdHRvbS5yZWdpc3RlcigpXG5cbi8vIHpiXG5jbGFzcyBTY3JvbGxDdXJzb3JUb0JvdHRvbUxlYXZlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yVG9Cb3R0b20ge1xuICBtb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSA9IGZhbHNlXG59XG5TY3JvbGxDdXJzb3JUb0JvdHRvbUxlYXZlLnJlZ2lzdGVyKClcblxuLy8gei5cbmNsYXNzIFNjcm9sbEN1cnNvclRvTWlkZGxlIGV4dGVuZHMgU2Nyb2xsQ3Vyc29yIHtcbiAgaXNTY3JvbGxhYmxlKCkge1xuICAgIHJldHVybiB0cnVlXG4gIH1cblxuICBnZXRTY3JvbGxUb3AoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q3Vyc29yUGl4ZWwoKS50b3AgLSB0aGlzLmVkaXRvckVsZW1lbnQuZ2V0SGVpZ2h0KCkgLyAyXG4gIH1cbn1cblNjcm9sbEN1cnNvclRvTWlkZGxlLnJlZ2lzdGVyKClcblxuLy8genpcbmNsYXNzIFNjcm9sbEN1cnNvclRvTWlkZGxlTGVhdmUgZXh0ZW5kcyBTY3JvbGxDdXJzb3JUb01pZGRsZSB7XG4gIG1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lID0gZmFsc2Vcbn1cblNjcm9sbEN1cnNvclRvTWlkZGxlTGVhdmUucmVnaXN0ZXIoKVxuXG4vLyBIb3Jpem9udGFsIFNjcm9sbFdpdGhvdXRDaGFuZ2luZ0N1cnNvclBvc2l0aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyB6c1xuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9MZWZ0IGV4dGVuZHMgU2Nyb2xsV2l0aG91dENoYW5naW5nQ3Vyc29yUG9zaXRpb24ge1xuICBleGVjdXRlKCkge1xuICAgIHRoaXMuZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxMZWZ0KHRoaXMuZ2V0Q3Vyc29yUGl4ZWwoKS5sZWZ0KVxuICB9XG59XG5TY3JvbGxDdXJzb3JUb0xlZnQucmVnaXN0ZXIoKVxuXG4vLyB6ZVxuY2xhc3MgU2Nyb2xsQ3Vyc29yVG9SaWdodCBleHRlbmRzIFNjcm9sbEN1cnNvclRvTGVmdCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5lZGl0b3JFbGVtZW50LnNldFNjcm9sbFJpZ2h0KHRoaXMuZ2V0Q3Vyc29yUGl4ZWwoKS5sZWZ0KVxuICB9XG59XG5TY3JvbGxDdXJzb3JUb1JpZ2h0LnJlZ2lzdGVyKClcblxuLy8gaW5zZXJ0LW1vZGUgc3BlY2lmaWMgY29tbWFuZHNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIEluc2VydE1vZGUgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7fVxuSW5zZXJ0TW9kZS5jb21tYW5kU2NvcGUgPSBcImF0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5pbnNlcnQtbW9kZVwiXG5cbmNsYXNzIEFjdGl2YXRlTm9ybWFsTW9kZU9uY2UgZXh0ZW5kcyBJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSgpIHtcbiAgICBjb25zdCBjdXJzb3JzVG9Nb3ZlUmlnaHQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JzKCkuZmlsdGVyKGN1cnNvciA9PiAhY3Vyc29yLmlzQXRCZWdpbm5pbmdPZkxpbmUoKSlcbiAgICB0aGlzLnZpbVN0YXRlLmFjdGl2YXRlKFwibm9ybWFsXCIpXG4gICAgZm9yIChjb25zdCBjdXJzb3Igb2YgY3Vyc29yc1RvTW92ZVJpZ2h0KSB7XG4gICAgICBtb3ZlQ3Vyc29yUmlnaHQoY3Vyc29yKVxuICAgIH1cblxuICAgIGxldCBkaXNwb3NhYmxlID0gYXRvbS5jb21tYW5kcy5vbkRpZERpc3BhdGNoKGV2ZW50ID0+IHtcbiAgICAgIGlmIChldmVudC50eXBlID09PSB0aGlzLmdldENvbW1hbmROYW1lKCkpIHJldHVyblxuXG4gICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKVxuICAgICAgZGlzcG9zYWJsZSA9IG51bGxcbiAgICAgIHRoaXMudmltU3RhdGUuYWN0aXZhdGUoXCJpbnNlcnRcIilcbiAgICB9KVxuICB9XG59XG5BY3RpdmF0ZU5vcm1hbE1vZGVPbmNlLnJlZ2lzdGVyKClcblxuY2xhc3MgSW5zZXJ0UmVnaXN0ZXIgZXh0ZW5kcyBJbnNlcnRNb2RlIHtcbiAgcmVxdWlyZUlucHV0ID0gdHJ1ZVxuICBpbml0aWFsaXplKCkge1xuICAgIHRoaXMucmVhZENoYXIoKVxuICAgIHJldHVybiBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5lZGl0b3IudHJhbnNhY3QoKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLnZpbVN0YXRlLnJlZ2lzdGVyLmdldFRleHQodGhpcy5pbnB1dCwgc2VsZWN0aW9uKVxuICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbkluc2VydFJlZ2lzdGVyLnJlZ2lzdGVyKClcblxuY2xhc3MgSW5zZXJ0TGFzdEluc2VydGVkIGV4dGVuZHMgSW5zZXJ0TW9kZSB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgY29uc3QgdGV4dCA9IHRoaXMudmltU3RhdGUucmVnaXN0ZXIuZ2V0VGV4dChcIi5cIilcbiAgICB0aGlzLmVkaXRvci5pbnNlcnRUZXh0KHRleHQpXG4gIH1cbn1cbkluc2VydExhc3RJbnNlcnRlZC5yZWdpc3RlcigpXG5cbmNsYXNzIENvcHlGcm9tTGluZUFib3ZlIGV4dGVuZHMgSW5zZXJ0TW9kZSB7XG4gIHJvd0RlbHRhID0gLTFcblxuICBleGVjdXRlKCkge1xuICAgIGNvbnN0IHRyYW5zbGF0aW9uID0gW3RoaXMucm93RGVsdGEsIDBdXG4gICAgdGhpcy5lZGl0b3IudHJhbnNhY3QoKCkgPT4ge1xuICAgICAgZm9yIChsZXQgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgICBjb25zdCBwb2ludCA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKS50cmFuc2xhdGUodHJhbnNsYXRpb24pXG4gICAgICAgIGlmIChwb2ludC5yb3cgPCAwKSBjb250aW51ZVxuXG4gICAgICAgIGNvbnN0IHJhbmdlID0gUmFuZ2UuZnJvbVBvaW50V2l0aERlbHRhKHBvaW50LCAwLCAxKVxuICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5lZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgIGlmICh0ZXh0KSBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cbkNvcHlGcm9tTGluZUFib3ZlLnJlZ2lzdGVyKClcblxuY2xhc3MgQ29weUZyb21MaW5lQmVsb3cgZXh0ZW5kcyBDb3B5RnJvbUxpbmVBYm92ZSB7XG4gIHJvd0RlbHRhID0gKzFcbn1cbkNvcHlGcm9tTGluZUJlbG93LnJlZ2lzdGVyKClcblxuY2xhc3MgTmV4dFRhYiBleHRlbmRzIE1pc2NDb21tYW5kIHtcbiAgZGVmYXVsdENvdW50ID0gMFxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgY29uc3QgY291bnQgPSB0aGlzLmdldENvdW50KClcbiAgICBjb25zdCBwYW5lID0gYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0odGhpcy5lZGl0b3IpXG5cbiAgICBpZiAoY291bnQpIHBhbmUuYWN0aXZhdGVJdGVtQXRJbmRleChjb3VudCAtIDEpXG4gICAgZWxzZSBwYW5lLmFjdGl2YXRlTmV4dEl0ZW0oKVxuICB9XG59XG5OZXh0VGFiLnJlZ2lzdGVyKClcblxuY2xhc3MgUHJldmlvdXNUYWIgZXh0ZW5kcyBNaXNjQ29tbWFuZCB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgYXRvbS53b3Jrc3BhY2UucGFuZUZvckl0ZW0odGhpcy5lZGl0b3IpLmFjdGl2YXRlUHJldmlvdXNJdGVtKClcbiAgfVxufVxuUHJldmlvdXNUYWIucmVnaXN0ZXIoKVxuIl19