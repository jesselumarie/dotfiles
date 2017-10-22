"use babel";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require("underscore-plus");

var _require = require("atom");

var Range = _require.Range;

var _require2 = require("./utils");

var moveCursorLeft = _require2.moveCursorLeft;
var moveCursorRight = _require2.moveCursorRight;
var limitNumber = _require2.limitNumber;
var isEmptyRow = _require2.isEmptyRow;
var setBufferRow = _require2.setBufferRow;

var Operator = require("./base").getClass("Operator");

// Operator which start 'insert-mode'
// -------------------------
// [NOTE]
// Rule: Don't make any text mutation before calling `@selectTarget()`.

var ActivateInsertMode = (function (_Operator) {
  _inherits(ActivateInsertMode, _Operator);

  function ActivateInsertMode() {
    _classCallCheck(this, ActivateInsertMode);

    _get(Object.getPrototypeOf(ActivateInsertMode.prototype), "constructor", this).apply(this, arguments);

    this.requireTarget = false;
    this.flashTarget = false;
    this.finalSubmode = null;
    this.supportInsertionCount = true;
  }

  _createClass(ActivateInsertMode, [{
    key: "observeWillDeactivateMode",
    value: function observeWillDeactivateMode() {
      var _this = this;

      var disposable = this.vimState.modeManager.preemptWillDeactivateMode(function (_ref) {
        var mode = _ref.mode;

        if (mode !== "insert") return;
        disposable.dispose();

        _this.vimState.mark.set("^", _this.editor.getCursorBufferPosition()); // Last insert-mode position
        var textByUserInput = "";
        var change = _this.getChangeSinceCheckpoint("insert");
        if (change) {
          _this.lastChange = change;
          _this.setMarkForChange(new Range(change.start, change.start.traverse(change.newExtent)));
          textByUserInput = change.newText;
        }
        _this.vimState.register.set(".", { text: textByUserInput }); // Last inserted text

        _.times(_this.getInsertionCount(), function () {
          var textToInsert = _this.textByOperator + textByUserInput;
          for (var selection of _this.editor.getSelections()) {
            selection.insertText(textToInsert, { autoIndent: true });
          }
        });

        // This cursor state is restored on undo.
        // So cursor state has to be updated before next groupChangesSinceCheckpoint()
        if (_this.getConfig("clearMultipleCursorsOnEscapeInsertMode")) {
          _this.vimState.clearSelections();
        }

        // grouping changes for undo checkpoint need to come last
        if (_this.getConfig("groupChangesWhenLeavingInsertMode")) {
          return _this.groupChangesSinceBufferCheckpoint("undo");
        }
      });
    }

    // When each mutaion's extent is not intersecting, muitiple changes are recorded
    // e.g
    //  - Multicursors edit
    //  - Cursor moved in insert-mode(e.g ctrl-f, ctrl-b)
    // But I don't care multiple changes just because I'm lazy(so not perfect implementation).
    // I only take care of one change happened at earliest(topCursor's change) position.
    // Thats' why I save topCursor's position to @topCursorPositionAtInsertionStart to compare traversal to deletionStart
    // Why I use topCursor's change? Just because it's easy to use first change returned by getChangeSinceCheckpoint().
  }, {
    key: "getChangeSinceCheckpoint",
    value: function getChangeSinceCheckpoint(purpose) {
      var checkpoint = this.getBufferCheckpoint(purpose);
      return this.editor.buffer.getChangesSinceCheckpoint(checkpoint)[0];
    }

    // [BUG-BUT-OK] Replaying text-deletion-operation is not compatible to pure Vim.
    // Pure Vim record all operation in insert-mode as keystroke level and can distinguish
    // character deleted by `Delete` or by `ctrl-u`.
    // But I can not and don't trying to minic this level of compatibility.
    // So basically deletion-done-in-one is expected to work well.
  }, {
    key: "replayLastChange",
    value: function replayLastChange(selection) {
      var textToInsert = undefined;
      if (this.lastChange != null) {
        var _lastChange = this.lastChange;
        var start = _lastChange.start;
        var newExtent = _lastChange.newExtent;
        var oldExtent = _lastChange.oldExtent;
        var newText = _lastChange.newText;

        if (!oldExtent.isZero()) {
          var traversalToStartOfDelete = start.traversalFrom(this.topCursorPositionAtInsertionStart);
          var deletionStart = selection.cursor.getBufferPosition().traverse(traversalToStartOfDelete);
          var deletionEnd = deletionStart.traverse(oldExtent);
          selection.setBufferRange([deletionStart, deletionEnd]);
        }
        textToInsert = newText;
      } else {
        textToInsert = "";
      }
      selection.insertText(textToInsert, { autoIndent: true });
    }

    // called when repeated
    // [FIXME] to use replayLastChange in repeatInsert overriding subclasss.
  }, {
    key: "repeatInsert",
    value: function repeatInsert(selection, text) {
      this.replayLastChange(selection);
    }
  }, {
    key: "getInsertionCount",
    value: function getInsertionCount() {
      if (this.insertionCount == null) {
        this.insertionCount = this.supportInsertionCount ? this.getCount(-1) : 0;
      }
      // Avoid freezing by acccidental big count(e.g. `5555555555555i`), See #560, #596
      return limitNumber(this.insertionCount, { max: 100 });
    }
  }, {
    key: "execute",
    value: function execute() {
      var _this2 = this;

      if (this.repeated) {
        this.flashTarget = this.trackChange = true;

        this.startMutation(function () {
          if (_this2.target) _this2.selectTarget();
          if (_this2.mutateText) _this2.mutateText();

          for (var selection of _this2.editor.getSelections()) {
            var textToInsert = _this2.lastChange && _this2.lastChange.newText || "";
            _this2.repeatInsert(selection, textToInsert);
            moveCursorLeft(selection.cursor);
          }
          _this2.mutationManager.setCheckpoint("did-finish");
        });

        if (this.getConfig("clearMultipleCursorsOnEscapeInsertMode")) this.vimState.clearSelections();
      } else {
        this.normalizeSelectionsIfNecessary();
        this.createBufferCheckpoint("undo");
        if (this.target) this.selectTarget();
        this.observeWillDeactivateMode();
        if (this.mutateText) this.mutateText();

        if (this.getInsertionCount() > 0) {
          var change = this.getChangeSinceCheckpoint("undo");
          this.textByOperator = change && change.newText || "";
        }

        this.createBufferCheckpoint("insert");
        var topCursor = this.editor.getCursorsOrderedByBufferPosition()[0];
        this.topCursorPositionAtInsertionStart = topCursor.getBufferPosition();

        // Skip normalization of blockwiseSelection.
        // Since want to keep multi-cursor and it's position in when shift to insert-mode.
        for (var blockwiseSelection of this.getBlockwiseSelections()) {
          blockwiseSelection.skipNormalization();
        }
        this.activateMode("insert", this.finalSubmode);
      }
    }
  }]);

  return ActivateInsertMode;
})(Operator);

ActivateInsertMode.register();

var ActivateReplaceMode = (function (_ActivateInsertMode) {
  _inherits(ActivateReplaceMode, _ActivateInsertMode);

  function ActivateReplaceMode() {
    _classCallCheck(this, ActivateReplaceMode);

    _get(Object.getPrototypeOf(ActivateReplaceMode.prototype), "constructor", this).apply(this, arguments);

    this.finalSubmode = "replace";
  }

  _createClass(ActivateReplaceMode, [{
    key: "repeatInsert",
    value: function repeatInsert(selection, text) {
      for (var char of text) {
        if (char === "\n") continue;
        if (selection.cursor.isAtEndOfLine()) break;
        selection.selectRight();
      }
      selection.insertText(text, { autoIndent: false });
    }
  }]);

  return ActivateReplaceMode;
})(ActivateInsertMode);

ActivateReplaceMode.register();

var InsertAfter = (function (_ActivateInsertMode2) {
  _inherits(InsertAfter, _ActivateInsertMode2);

  function InsertAfter() {
    _classCallCheck(this, InsertAfter);

    _get(Object.getPrototypeOf(InsertAfter.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertAfter, [{
    key: "execute",
    value: function execute() {
      for (var cursor of this.editor.getCursors()) {
        moveCursorRight(cursor);
      }
      _get(Object.getPrototypeOf(InsertAfter.prototype), "execute", this).call(this);
    }
  }]);

  return InsertAfter;
})(ActivateInsertMode);

InsertAfter.register();

// key: 'g I' in all mode

var InsertAtBeginningOfLine = (function (_ActivateInsertMode3) {
  _inherits(InsertAtBeginningOfLine, _ActivateInsertMode3);

  function InsertAtBeginningOfLine() {
    _classCallCheck(this, InsertAtBeginningOfLine);

    _get(Object.getPrototypeOf(InsertAtBeginningOfLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertAtBeginningOfLine, [{
    key: "execute",
    value: function execute() {
      if (this.mode === "visual" && this.submode !== "blockwise") {
        this.editor.splitSelectionsIntoLines();
      }
      this.editor.moveToBeginningOfLine();
      _get(Object.getPrototypeOf(InsertAtBeginningOfLine.prototype), "execute", this).call(this);
    }
  }]);

  return InsertAtBeginningOfLine;
})(ActivateInsertMode);

InsertAtBeginningOfLine.register();

// key: normal 'A'

var InsertAfterEndOfLine = (function (_ActivateInsertMode4) {
  _inherits(InsertAfterEndOfLine, _ActivateInsertMode4);

  function InsertAfterEndOfLine() {
    _classCallCheck(this, InsertAfterEndOfLine);

    _get(Object.getPrototypeOf(InsertAfterEndOfLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertAfterEndOfLine, [{
    key: "execute",
    value: function execute() {
      this.editor.moveToEndOfLine();
      _get(Object.getPrototypeOf(InsertAfterEndOfLine.prototype), "execute", this).call(this);
    }
  }]);

  return InsertAfterEndOfLine;
})(ActivateInsertMode);

InsertAfterEndOfLine.register();

// key: normal 'I'

var InsertAtFirstCharacterOfLine = (function (_ActivateInsertMode5) {
  _inherits(InsertAtFirstCharacterOfLine, _ActivateInsertMode5);

  function InsertAtFirstCharacterOfLine() {
    _classCallCheck(this, InsertAtFirstCharacterOfLine);

    _get(Object.getPrototypeOf(InsertAtFirstCharacterOfLine.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertAtFirstCharacterOfLine, [{
    key: "execute",
    value: function execute() {
      this.editor.moveToBeginningOfLine();
      this.editor.moveToFirstCharacterOfLine();
      _get(Object.getPrototypeOf(InsertAtFirstCharacterOfLine.prototype), "execute", this).call(this);
    }
  }]);

  return InsertAtFirstCharacterOfLine;
})(ActivateInsertMode);

InsertAtFirstCharacterOfLine.register();

var InsertAtLastInsert = (function (_ActivateInsertMode6) {
  _inherits(InsertAtLastInsert, _ActivateInsertMode6);

  function InsertAtLastInsert() {
    _classCallCheck(this, InsertAtLastInsert);

    _get(Object.getPrototypeOf(InsertAtLastInsert.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertAtLastInsert, [{
    key: "execute",
    value: function execute() {
      var point = this.vimState.mark.get("^");
      if (point) {
        this.editor.setCursorBufferPosition(point);
        this.editor.scrollToCursorPosition({ center: true });
      }
      _get(Object.getPrototypeOf(InsertAtLastInsert.prototype), "execute", this).call(this);
    }
  }]);

  return InsertAtLastInsert;
})(ActivateInsertMode);

InsertAtLastInsert.register();

var InsertAboveWithNewline = (function (_ActivateInsertMode7) {
  _inherits(InsertAboveWithNewline, _ActivateInsertMode7);

  function InsertAboveWithNewline() {
    _classCallCheck(this, InsertAboveWithNewline);

    _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertAboveWithNewline, [{
    key: "initialize",
    value: function initialize() {
      if (this.getConfig("groupChangesWhenLeavingInsertMode")) {
        this.originalCursorPositionMarker = this.editor.markBufferPosition(this.editor.getCursorBufferPosition());
      }
      return _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), "initialize", this).call(this);
    }

    // This is for `o` and `O` operator.
    // On undo/redo put cursor at original point where user type `o` or `O`.
  }, {
    key: "groupChangesSinceBufferCheckpoint",
    value: function groupChangesSinceBufferCheckpoint(purpose) {
      var lastCursor = this.editor.getLastCursor();
      var cursorPosition = lastCursor.getBufferPosition();
      lastCursor.setBufferPosition(this.originalCursorPositionMarker.getHeadBufferPosition());
      this.originalCursorPositionMarker.destroy();

      _get(Object.getPrototypeOf(InsertAboveWithNewline.prototype), "groupChangesSinceBufferCheckpoint", this).call(this, purpose);

      lastCursor.setBufferPosition(cursorPosition);
    }
  }, {
    key: "autoIndentEmptyRows",
    value: function autoIndentEmptyRows() {
      for (var cursor of this.editor.getCursors()) {
        var row = cursor.getBufferRow();
        if (isEmptyRow(this.editor, row)) {
          this.editor.autoIndentBufferRow(row);
        }
      }
    }
  }, {
    key: "mutateText",
    value: function mutateText() {
      this.editor.insertNewlineAbove();
      if (this.editor.autoIndent) {
        this.autoIndentEmptyRows();
      }
    }
  }, {
    key: "repeatInsert",
    value: function repeatInsert(selection, text) {
      selection.insertText(text.trimLeft(), { autoIndent: true });
    }
  }]);

  return InsertAboveWithNewline;
})(ActivateInsertMode);

InsertAboveWithNewline.register();

var InsertBelowWithNewline = (function (_InsertAboveWithNewline) {
  _inherits(InsertBelowWithNewline, _InsertAboveWithNewline);

  function InsertBelowWithNewline() {
    _classCallCheck(this, InsertBelowWithNewline);

    _get(Object.getPrototypeOf(InsertBelowWithNewline.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(InsertBelowWithNewline, [{
    key: "mutateText",
    value: function mutateText() {
      for (var cursor of this.editor.getCursors()) {
        setBufferRow(cursor, this.getFoldEndRowForRow(cursor.getBufferRow()));
      }

      this.editor.insertNewlineBelow();
      if (this.editor.autoIndent) this.autoIndentEmptyRows();
    }
  }]);

  return InsertBelowWithNewline;
})(InsertAboveWithNewline);

InsertBelowWithNewline.register();

// Advanced Insertion
// -------------------------

var InsertByTarget = (function (_ActivateInsertMode8) {
  _inherits(InsertByTarget, _ActivateInsertMode8);

  function InsertByTarget() {
    _classCallCheck(this, InsertByTarget);

    _get(Object.getPrototypeOf(InsertByTarget.prototype), "constructor", this).apply(this, arguments);

    this.requireTarget = true;
    this.which = null;
  }

  _createClass(InsertByTarget, [{
    key: "initialize",
    // one of ['start', 'end', 'head', 'tail']

    value: function initialize() {
      // HACK
      // When g i is mapped to `insert-at-start-of-target`.
      // `g i 3 l` start insert at 3 column right position.
      // In this case, we don't want repeat insertion 3 times.
      // This @getCount() call cache number at the timing BEFORE '3' is specified.
      this.getCount();
      return _get(Object.getPrototypeOf(InsertByTarget.prototype), "initialize", this).call(this);
    }
  }, {
    key: "execute",
    value: function execute() {
      var _this3 = this;

      this.onDidSelectTarget(function () {
        // In vC/vL, when occurrence marker was NOT selected,
        // it behave's very specially
        // vC: `I` and `A` behaves as shoft hand of `ctrl-v I` and `ctrl-v A`.
        // vL: `I` and `A` place cursors at each selected lines of start( or end ) of non-white-space char.
        if (!_this3.occurrenceSelected && _this3.mode === "visual" && _this3.submode !== "blockwise") {
          for (var $selection of _this3.swrap.getSelections(_this3.editor)) {
            $selection.normalize();
            $selection.applyWise("blockwise");
          }

          if (_this3.submode === "linewise") {
            for (var blockwiseSelection of _this3.getBlockwiseSelections()) {
              blockwiseSelection.expandMemberSelectionsOverLineWithTrimRange();
            }
          }
        }

        for (var $selection of _this3.swrap.getSelections(_this3.editor)) {
          $selection.setBufferPositionTo(_this3.which);
        }
      });
      _get(Object.getPrototypeOf(InsertByTarget.prototype), "execute", this).call(this);
    }
  }]);

  return InsertByTarget;
})(ActivateInsertMode);

InsertByTarget.register(false);

// key: 'I', Used in 'visual-mode.characterwise', visual-mode.blockwise

var InsertAtStartOfTarget = (function (_InsertByTarget) {
  _inherits(InsertAtStartOfTarget, _InsertByTarget);

  function InsertAtStartOfTarget() {
    _classCallCheck(this, InsertAtStartOfTarget);

    _get(Object.getPrototypeOf(InsertAtStartOfTarget.prototype), "constructor", this).apply(this, arguments);

    this.which = "start";
  }

  return InsertAtStartOfTarget;
})(InsertByTarget);

InsertAtStartOfTarget.register();

// key: 'A', Used in 'visual-mode.characterwise', 'visual-mode.blockwise'

var InsertAtEndOfTarget = (function (_InsertByTarget2) {
  _inherits(InsertAtEndOfTarget, _InsertByTarget2);

  function InsertAtEndOfTarget() {
    _classCallCheck(this, InsertAtEndOfTarget);

    _get(Object.getPrototypeOf(InsertAtEndOfTarget.prototype), "constructor", this).apply(this, arguments);

    this.which = "end";
  }

  return InsertAtEndOfTarget;
})(InsertByTarget);

InsertAtEndOfTarget.register();

var InsertAtHeadOfTarget = (function (_InsertByTarget3) {
  _inherits(InsertAtHeadOfTarget, _InsertByTarget3);

  function InsertAtHeadOfTarget() {
    _classCallCheck(this, InsertAtHeadOfTarget);

    _get(Object.getPrototypeOf(InsertAtHeadOfTarget.prototype), "constructor", this).apply(this, arguments);

    this.which = "head";
  }

  return InsertAtHeadOfTarget;
})(InsertByTarget);

InsertAtHeadOfTarget.register();

var InsertAtStartOfOccurrence = (function (_InsertAtStartOfTarget) {
  _inherits(InsertAtStartOfOccurrence, _InsertAtStartOfTarget);

  function InsertAtStartOfOccurrence() {
    _classCallCheck(this, InsertAtStartOfOccurrence);

    _get(Object.getPrototypeOf(InsertAtStartOfOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrence = true;
  }

  return InsertAtStartOfOccurrence;
})(InsertAtStartOfTarget);

InsertAtStartOfOccurrence.register();

var InsertAtEndOfOccurrence = (function (_InsertAtEndOfTarget) {
  _inherits(InsertAtEndOfOccurrence, _InsertAtEndOfTarget);

  function InsertAtEndOfOccurrence() {
    _classCallCheck(this, InsertAtEndOfOccurrence);

    _get(Object.getPrototypeOf(InsertAtEndOfOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrence = true;
  }

  return InsertAtEndOfOccurrence;
})(InsertAtEndOfTarget);

InsertAtEndOfOccurrence.register();

var InsertAtHeadOfOccurrence = (function (_InsertAtHeadOfTarget) {
  _inherits(InsertAtHeadOfOccurrence, _InsertAtHeadOfTarget);

  function InsertAtHeadOfOccurrence() {
    _classCallCheck(this, InsertAtHeadOfOccurrence);

    _get(Object.getPrototypeOf(InsertAtHeadOfOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrence = true;
  }

  return InsertAtHeadOfOccurrence;
})(InsertAtHeadOfTarget);

InsertAtHeadOfOccurrence.register();

var InsertAtStartOfSubwordOccurrence = (function (_InsertAtStartOfOccurrence) {
  _inherits(InsertAtStartOfSubwordOccurrence, _InsertAtStartOfOccurrence);

  function InsertAtStartOfSubwordOccurrence() {
    _classCallCheck(this, InsertAtStartOfSubwordOccurrence);

    _get(Object.getPrototypeOf(InsertAtStartOfSubwordOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrenceType = "subword";
  }

  return InsertAtStartOfSubwordOccurrence;
})(InsertAtStartOfOccurrence);

InsertAtStartOfSubwordOccurrence.register();

var InsertAtEndOfSubwordOccurrence = (function (_InsertAtEndOfOccurrence) {
  _inherits(InsertAtEndOfSubwordOccurrence, _InsertAtEndOfOccurrence);

  function InsertAtEndOfSubwordOccurrence() {
    _classCallCheck(this, InsertAtEndOfSubwordOccurrence);

    _get(Object.getPrototypeOf(InsertAtEndOfSubwordOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrenceType = "subword";
  }

  return InsertAtEndOfSubwordOccurrence;
})(InsertAtEndOfOccurrence);

InsertAtEndOfSubwordOccurrence.register();

var InsertAtHeadOfSubwordOccurrence = (function (_InsertAtHeadOfOccurrence) {
  _inherits(InsertAtHeadOfSubwordOccurrence, _InsertAtHeadOfOccurrence);

  function InsertAtHeadOfSubwordOccurrence() {
    _classCallCheck(this, InsertAtHeadOfSubwordOccurrence);

    _get(Object.getPrototypeOf(InsertAtHeadOfSubwordOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrenceType = "subword";
  }

  return InsertAtHeadOfSubwordOccurrence;
})(InsertAtHeadOfOccurrence);

InsertAtHeadOfSubwordOccurrence.register();

var InsertAtStartOfSmartWord = (function (_InsertByTarget4) {
  _inherits(InsertAtStartOfSmartWord, _InsertByTarget4);

  function InsertAtStartOfSmartWord() {
    _classCallCheck(this, InsertAtStartOfSmartWord);

    _get(Object.getPrototypeOf(InsertAtStartOfSmartWord.prototype), "constructor", this).apply(this, arguments);

    this.which = "start";
    this.target = "MoveToPreviousSmartWord";
  }

  return InsertAtStartOfSmartWord;
})(InsertByTarget);

InsertAtStartOfSmartWord.register();

var InsertAtEndOfSmartWord = (function (_InsertByTarget5) {
  _inherits(InsertAtEndOfSmartWord, _InsertByTarget5);

  function InsertAtEndOfSmartWord() {
    _classCallCheck(this, InsertAtEndOfSmartWord);

    _get(Object.getPrototypeOf(InsertAtEndOfSmartWord.prototype), "constructor", this).apply(this, arguments);

    this.which = "end";
    this.target = "MoveToEndOfSmartWord";
  }

  return InsertAtEndOfSmartWord;
})(InsertByTarget);

InsertAtEndOfSmartWord.register();

var InsertAtPreviousFoldStart = (function (_InsertByTarget6) {
  _inherits(InsertAtPreviousFoldStart, _InsertByTarget6);

  function InsertAtPreviousFoldStart() {
    _classCallCheck(this, InsertAtPreviousFoldStart);

    _get(Object.getPrototypeOf(InsertAtPreviousFoldStart.prototype), "constructor", this).apply(this, arguments);

    this.which = "start";
    this.target = "MoveToPreviousFoldStart";
  }

  return InsertAtPreviousFoldStart;
})(InsertByTarget);

InsertAtPreviousFoldStart.register();

var InsertAtNextFoldStart = (function (_InsertByTarget7) {
  _inherits(InsertAtNextFoldStart, _InsertByTarget7);

  function InsertAtNextFoldStart() {
    _classCallCheck(this, InsertAtNextFoldStart);

    _get(Object.getPrototypeOf(InsertAtNextFoldStart.prototype), "constructor", this).apply(this, arguments);

    this.which = "end";
    this.target = "MoveToNextFoldStart";
  }

  return InsertAtNextFoldStart;
})(InsertByTarget);

InsertAtNextFoldStart.register();

// -------------------------

var Change = (function (_ActivateInsertMode9) {
  _inherits(Change, _ActivateInsertMode9);

  function Change() {
    _classCallCheck(this, Change);

    _get(Object.getPrototypeOf(Change.prototype), "constructor", this).apply(this, arguments);

    this.requireTarget = true;
    this.trackChange = true;
    this.supportInsertionCount = false;
  }

  _createClass(Change, [{
    key: "mutateText",
    value: function mutateText() {
      // Allways dynamically determine selection wise wthout consulting target.wise
      // Reason: when `c i {`, wise is 'characterwise', but actually selected range is 'linewise'
      //   {
      //     a
      //   }
      var isLinewiseTarget = this.swrap.detectWise(this.editor) === "linewise";
      for (var selection of this.editor.getSelections()) {
        if (!this.getConfig("dontUpdateRegisterOnChangeOrSubstitute")) {
          this.setTextToRegisterForSelection(selection);
        }
        if (isLinewiseTarget) {
          selection.insertText("\n", { autoIndent: true });
          selection.cursor.moveLeft();
        } else {
          selection.insertText("", { autoIndent: true });
        }
      }
    }
  }]);

  return Change;
})(ActivateInsertMode);

Change.register();

var ChangeOccurrence = (function (_Change) {
  _inherits(ChangeOccurrence, _Change);

  function ChangeOccurrence() {
    _classCallCheck(this, ChangeOccurrence);

    _get(Object.getPrototypeOf(ChangeOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrence = true;
  }

  return ChangeOccurrence;
})(Change);

ChangeOccurrence.register();

var Substitute = (function (_Change2) {
  _inherits(Substitute, _Change2);

  function Substitute() {
    _classCallCheck(this, Substitute);

    _get(Object.getPrototypeOf(Substitute.prototype), "constructor", this).apply(this, arguments);

    this.target = "MoveRight";
  }

  return Substitute;
})(Change);

Substitute.register();

var SubstituteLine = (function (_Change3) {
  _inherits(SubstituteLine, _Change3);

  function SubstituteLine() {
    _classCallCheck(this, SubstituteLine);

    _get(Object.getPrototypeOf(SubstituteLine.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.target = "MoveToRelativeLine";
  }

  return SubstituteLine;
})(Change);

SubstituteLine.register();

// alias

var ChangeLine = (function (_SubstituteLine) {
  _inherits(ChangeLine, _SubstituteLine);

  function ChangeLine() {
    _classCallCheck(this, ChangeLine);

    _get(Object.getPrototypeOf(ChangeLine.prototype), "constructor", this).apply(this, arguments);
  }

  return ChangeLine;
})(SubstituteLine);

ChangeLine.register();

var ChangeToLastCharacterOfLine = (function (_Change4) {
  _inherits(ChangeToLastCharacterOfLine, _Change4);

  function ChangeToLastCharacterOfLine() {
    _classCallCheck(this, ChangeToLastCharacterOfLine);

    _get(Object.getPrototypeOf(ChangeToLastCharacterOfLine.prototype), "constructor", this).apply(this, arguments);

    this.target = "MoveToLastCharacterOfLine";
  }

  _createClass(ChangeToLastCharacterOfLine, [{
    key: "execute",
    value: function execute() {
      var _this4 = this;

      this.onDidSelectTarget(function () {
        if (_this4.target.wise === "blockwise") {
          for (var blockwiseSelection of _this4.getBlockwiseSelections()) {
            blockwiseSelection.extendMemberSelectionsToEndOfLine();
          }
        }
      });
      _get(Object.getPrototypeOf(ChangeToLastCharacterOfLine.prototype), "execute", this).call(this);
    }
  }]);

  return ChangeToLastCharacterOfLine;
})(Change);

ChangeToLastCharacterOfLine.register();
// [FIXME] to re-override target.wise in visual-mode
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3ItaW5zZXJ0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFdBQVcsQ0FBQTs7Ozs7Ozs7OztBQUVYLElBQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFBOztlQUNwQixPQUFPLENBQUMsTUFBTSxDQUFDOztJQUF4QixLQUFLLFlBQUwsS0FBSzs7Z0JBRXFFLE9BQU8sQ0FBQyxTQUFTLENBQUM7O0lBQTVGLGNBQWMsYUFBZCxjQUFjO0lBQUUsZUFBZSxhQUFmLGVBQWU7SUFBRSxXQUFXLGFBQVgsV0FBVztJQUFFLFVBQVUsYUFBVixVQUFVO0lBQUUsWUFBWSxhQUFaLFlBQVk7O0FBQzdFLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUE7Ozs7Ozs7SUFNakQsa0JBQWtCO1lBQWxCLGtCQUFrQjs7V0FBbEIsa0JBQWtCOzBCQUFsQixrQkFBa0I7OytCQUFsQixrQkFBa0I7O1NBQ3RCLGFBQWEsR0FBRyxLQUFLO1NBQ3JCLFdBQVcsR0FBRyxLQUFLO1NBQ25CLFlBQVksR0FBRyxJQUFJO1NBQ25CLHFCQUFxQixHQUFHLElBQUk7OztlQUp4QixrQkFBa0I7O1dBTUcscUNBQUc7OztBQUMxQixVQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyx5QkFBeUIsQ0FBQyxVQUFDLElBQU0sRUFBSztZQUFWLElBQUksR0FBTCxJQUFNLENBQUwsSUFBSTs7QUFDekUsWUFBSSxJQUFJLEtBQUssUUFBUSxFQUFFLE9BQU07QUFDN0Isa0JBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQTs7QUFFcEIsY0FBSyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsTUFBSyxNQUFNLENBQUMsdUJBQXVCLEVBQUUs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QUFVOztXQUFWLFVBQVU7MEJBQVYsVUFBVTs7K0JBQVYsVUFBVTs7U0FDZCxNQUFNLEdBQUcsV0FBVzs7O1NBRGhCLFVBQVU7R0FBUyxNQUFNOztBQUcvQixVQUFVLENBQUMsUUFBUSxFQUFFLENBQUE7O0lBRWYsY0FBYztZQUFkLGNBQWM7O1dBQWQsY0FBYzswQkFBZCxjQUFjOzsrQkFBZCxjQUFjOztTQUNsQixJQUFJLEdBQUcsVUFBVTtTQUNqQixNQUFNLEdBQUcsb0JBQW9COzs7U0FGekIsY0FBYztHQUFTLE1BQU07O0FBSW5DLGNBQWMsQ0FBQyxRQUFRLEVBQUUsQ0FBQTs7OztJQUduQixVQUFVO1lBQVYsVUFBVTs7V0FBVixVQUFVOzBCQUFWLFVBQVU7OytCQUFWLFVBQVU7OztTQUFWLFVBQVU7R0FBUyxjQUFjOztBQUN2QyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUE7O0lBRWYsMkJBQTJCO1lBQTNCLDJCQUEyQjs7V0FBM0IsMkJBQTJCOzBCQUEzQiwyQkFBMkI7OytCQUEzQiwyQkFBMkI7O1NBQy9CLE1BQU0sR0FBRywyQkFBMkI7OztlQURoQywyQkFBMkI7O1dBR3hCLG1CQUFHOzs7QUFDUixVQUFJLENBQUMsaUJBQWlCLENBQUMsWUFBTTtBQUMzQixZQUFJLE9BQUssTUFBTSxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7QUFDcEMsZUFBSyxJQUFNLGtCQUFrQixJQUFJLE9BQUssc0JBQXNCLEVBQUUsRUFBRTtBQUM5RCw4QkFBa0IsQ0FBQyxpQ0FBaUMsRUFBRSxDQUFBO1dBQ3ZEO1NBQ0Y7T0FDRixDQUFDLENBQUE7QUFDRixpQ0FYRSwyQkFBMkIseUNBV2Q7S0FDaEI7OztTQVpHLDJCQUEyQjtHQUFTLE1BQU07O0FBY2hELDJCQUEyQixDQUFDLFFBQVEsRUFBRSxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3ItaW5zZXJ0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgYmFiZWxcIlxuXG5jb25zdCBfID0gcmVxdWlyZShcInVuZGVyc2NvcmUtcGx1c1wiKVxuY29uc3Qge1JhbmdlfSA9IHJlcXVpcmUoXCJhdG9tXCIpXG5cbmNvbnN0IHttb3ZlQ3Vyc29yTGVmdCwgbW92ZUN1cnNvclJpZ2h0LCBsaW1pdE51bWJlciwgaXNFbXB0eVJvdywgc2V0QnVmZmVyUm93fSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpXG5jb25zdCBPcGVyYXRvciA9IHJlcXVpcmUoXCIuL2Jhc2VcIikuZ2V0Q2xhc3MoXCJPcGVyYXRvclwiKVxuXG4vLyBPcGVyYXRvciB3aGljaCBzdGFydCAnaW5zZXJ0LW1vZGUnXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBbTk9URV1cbi8vIFJ1bGU6IERvbid0IG1ha2UgYW55IHRleHQgbXV0YXRpb24gYmVmb3JlIGNhbGxpbmcgYEBzZWxlY3RUYXJnZXQoKWAuXG5jbGFzcyBBY3RpdmF0ZUluc2VydE1vZGUgZXh0ZW5kcyBPcGVyYXRvciB7XG4gIHJlcXVpcmVUYXJnZXQgPSBmYWxzZVxuICBmbGFzaFRhcmdldCA9IGZhbHNlXG4gIGZpbmFsU3VibW9kZSA9IG51bGxcbiAgc3VwcG9ydEluc2VydGlvbkNvdW50ID0gdHJ1ZVxuXG4gIG9ic2VydmVXaWxsRGVhY3RpdmF0ZU1vZGUoKSB7XG4gICAgbGV0IGRpc3Bvc2FibGUgPSB0aGlzLnZpbVN0YXRlLm1vZGVNYW5hZ2VyLnByZWVtcHRXaWxsRGVhY3RpdmF0ZU1vZGUoKHttb2RlfSkgPT4ge1xuICAgICAgaWYgKG1vZGUgIT09IFwiaW5zZXJ0XCIpIHJldHVyblxuICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcblxuICAgICAgdGhpcy52aW1TdGF0ZS5tYXJrLnNldChcIl5cIiwgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkgLy8gTGFzdCBpbnNlcnQtbW9kZSBwb3NpdGlvblxuICAgICAgbGV0IHRleHRCeVVzZXJJbnB1dCA9IFwiXCJcbiAgICAgIGNvbnN0IGNoYW5nZSA9IHRoaXMuZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50KFwiaW5zZXJ0XCIpXG4gICAgICBpZiAoY2hhbmdlKSB7XG4gICAgICAgIHRoaXMubGFzdENoYW5nZSA9IGNoYW5nZVxuICAgICAgICB0aGlzLnNldE1hcmtGb3JDaGFuZ2UobmV3IFJhbmdlKGNoYW5nZS5zdGFydCwgY2hhbmdlLnN0YXJ0LnRyYXZlcnNlKGNoYW5nZS5uZXdFeHRlbnQpKSlcbiAgICAgICAgdGV4dEJ5VXNlcklucHV0ID0gY2hhbmdlLm5ld1RleHRcbiAgICAgIH1cbiAgICAgIHRoaXMudmltU3RhdGUucmVnaXN0ZXIuc2V0KFwiLlwiLCB7dGV4dDogdGV4dEJ5VXNlcklucHV0fSkgLy8gTGFzdCBpbnNlcnRlZCB0ZXh0XG5cbiAgICAgIF8udGltZXModGhpcy5nZXRJbnNlcnRpb25Db3VudCgpLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHRleHRUb0luc2VydCA9IHRoaXMudGV4dEJ5T3BlcmF0b3IgKyB0ZXh0QnlVc2VySW5wdXRcbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dFRvSW5zZXJ0LCB7YXV0b0luZGVudDogdHJ1ZX0pXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIC8vIFRoaXMgY3Vyc29yIHN0YXRlIGlzIHJlc3RvcmVkIG9uIHVuZG8uXG4gICAgICAvLyBTbyBjdXJzb3Igc3RhdGUgaGFzIHRvIGJlIHVwZGF0ZWQgYmVmb3JlIG5leHQgZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50KClcbiAgICAgIGlmICh0aGlzLmdldENvbmZpZyhcImNsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlXCIpKSB7XG4gICAgICAgIHRoaXMudmltU3RhdGUuY2xlYXJTZWxlY3Rpb25zKClcbiAgICAgIH1cblxuICAgICAgLy8gZ3JvdXBpbmcgY2hhbmdlcyBmb3IgdW5kbyBjaGVja3BvaW50IG5lZWQgdG8gY29tZSBsYXN0XG4gICAgICBpZiAodGhpcy5nZXRDb25maWcoXCJncm91cENoYW5nZXNXaGVuTGVhdmluZ0luc2VydE1vZGVcIikpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50KFwidW5kb1wiKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICAvLyBXaGVuIGVhY2ggbXV0YWlvbidzIGV4dGVudCBpcyBub3QgaW50ZXJzZWN0aW5nLCBtdWl0aXBsZSBjaGFuZ2VzIGFyZSByZWNvcmRlZFxuICAvLyBlLmdcbiAgLy8gIC0gTXVsdGljdXJzb3JzIGVkaXRcbiAgLy8gIC0gQ3Vyc29yIG1vdmVkIGluIGluc2VydC1tb2RlKGUuZyBjdHJsLWYsIGN0cmwtYilcbiAgLy8gQnV0IEkgZG9uJ3QgY2FyZSBtdWx0aXBsZSBjaGFuZ2VzIGp1c3QgYmVjYXVzZSBJJ20gbGF6eShzbyBub3QgcGVyZmVjdCBpbXBsZW1lbnRhdGlvbikuXG4gIC8vIEkgb25seSB0YWtlIGNhcmUgb2Ygb25lIGNoYW5nZSBoYXBwZW5lZCBhdCBlYXJsaWVzdCh0b3BDdXJzb3IncyBjaGFuZ2UpIHBvc2l0aW9uLlxuICAvLyBUaGF0cycgd2h5IEkgc2F2ZSB0b3BDdXJzb3IncyBwb3NpdGlvbiB0byBAdG9wQ3Vyc29yUG9zaXRpb25BdEluc2VydGlvblN0YXJ0IHRvIGNvbXBhcmUgdHJhdmVyc2FsIHRvIGRlbGV0aW9uU3RhcnRcbiAgLy8gV2h5IEkgdXNlIHRvcEN1cnNvcidzIGNoYW5nZT8gSnVzdCBiZWNhdXNlIGl0J3MgZWFzeSB0byB1c2UgZmlyc3QgY2hhbmdlIHJldHVybmVkIGJ5IGdldENoYW5nZVNpbmNlQ2hlY2twb2ludCgpLlxuICBnZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQocHVycG9zZSkge1xuICAgIGNvbnN0IGNoZWNrcG9pbnQgPSB0aGlzLmdldEJ1ZmZlckNoZWNrcG9pbnQocHVycG9zZSlcbiAgICByZXR1cm4gdGhpcy5lZGl0b3IuYnVmZmVyLmdldENoYW5nZXNTaW5jZUNoZWNrcG9pbnQoY2hlY2twb2ludClbMF1cbiAgfVxuXG4gIC8vIFtCVUctQlVULU9LXSBSZXBsYXlpbmcgdGV4dC1kZWxldGlvbi1vcGVyYXRpb24gaXMgbm90IGNvbXBhdGlibGUgdG8gcHVyZSBWaW0uXG4gIC8vIFB1cmUgVmltIHJlY29yZCBhbGwgb3BlcmF0aW9uIGluIGluc2VydC1tb2RlIGFzIGtleXN0cm9rZSBsZXZlbCBhbmQgY2FuIGRpc3Rpbmd1aXNoXG4gIC8vIGNoYXJhY3RlciBkZWxldGVkIGJ5IGBEZWxldGVgIG9yIGJ5IGBjdHJsLXVgLlxuICAvLyBCdXQgSSBjYW4gbm90IGFuZCBkb24ndCB0cnlpbmcgdG8gbWluaWMgdGhpcyBsZXZlbCBvZiBjb21wYXRpYmlsaXR5LlxuICAvLyBTbyBiYXNpY2FsbHkgZGVsZXRpb24tZG9uZS1pbi1vbmUgaXMgZXhwZWN0ZWQgdG8gd29yayB3ZWxsLlxuICByZXBsYXlMYXN0Q2hhbmdlKHNlbGVjdGlvbikge1xuICAgIGxldCB0ZXh0VG9JbnNlcnRcbiAgICBpZiAodGhpcy5sYXN0Q2hhbmdlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IHtzdGFydCwgbmV3RXh0ZW50LCBvbGRFeHRlbnQsIG5ld1RleHR9ID0gdGhpcy5sYXN0Q2hhbmdlXG4gICAgICBpZiAoIW9sZEV4dGVudC5pc1plcm8oKSkge1xuICAgICAgICBjb25zdCB0cmF2ZXJzYWxUb1N0YXJ0T2ZEZWxldGUgPSBzdGFydC50cmF2ZXJzYWxGcm9tKHRoaXMudG9wQ3Vyc29yUG9zaXRpb25BdEluc2VydGlvblN0YXJ0KVxuICAgICAgICBjb25zdCBkZWxldGlvblN0YXJ0ID0gc2VsZWN0aW9uLmN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLnRyYXZlcnNlKHRyYXZlcnNhbFRvU3RhcnRPZkRlbGV0ZSlcbiAgICAgICAgY29uc3QgZGVsZXRpb25FbmQgPSBkZWxldGlvblN0YXJ0LnRyYXZlcnNlKG9sZEV4dGVudClcbiAgICAgICAgc2VsZWN0aW9uLnNldEJ1ZmZlclJhbmdlKFtkZWxldGlvblN0YXJ0LCBkZWxldGlvbkVuZF0pXG4gICAgICB9XG4gICAgICB0ZXh0VG9JbnNlcnQgPSBuZXdUZXh0XG4gICAgfSBlbHNlIHtcbiAgICAgIHRleHRUb0luc2VydCA9IFwiXCJcbiAgICB9XG4gICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dFRvSW5zZXJ0LCB7YXV0b0luZGVudDogdHJ1ZX0pXG4gIH1cblxuICAvLyBjYWxsZWQgd2hlbiByZXBlYXRlZFxuICAvLyBbRklYTUVdIHRvIHVzZSByZXBsYXlMYXN0Q2hhbmdlIGluIHJlcGVhdEluc2VydCBvdmVycmlkaW5nIHN1YmNsYXNzcy5cbiAgcmVwZWF0SW5zZXJ0KHNlbGVjdGlvbiwgdGV4dCkge1xuICAgIHRoaXMucmVwbGF5TGFzdENoYW5nZShzZWxlY3Rpb24pXG4gIH1cblxuICBnZXRJbnNlcnRpb25Db3VudCgpIHtcbiAgICBpZiAodGhpcy5pbnNlcnRpb25Db3VudCA9PSBudWxsKSB7XG4gICAgICB0aGlzLmluc2VydGlvbkNvdW50ID0gdGhpcy5zdXBwb3J0SW5zZXJ0aW9uQ291bnQgPyB0aGlzLmdldENvdW50KC0xKSA6IDBcbiAgICB9XG4gICAgLy8gQXZvaWQgZnJlZXppbmcgYnkgYWNjY2lkZW50YWwgYmlnIGNvdW50KGUuZy4gYDU1NTU1NTU1NTU1NTVpYCksIFNlZSAjNTYwLCAjNTk2XG4gICAgcmV0dXJuIGxpbWl0TnVtYmVyKHRoaXMuaW5zZXJ0aW9uQ291bnQsIHttYXg6IDEwMH0pXG4gIH1cblxuICBleGVjdXRlKCkge1xuICAgIGlmICh0aGlzLnJlcGVhdGVkKSB7XG4gICAgICB0aGlzLmZsYXNoVGFyZ2V0ID0gdGhpcy50cmFja0NoYW5nZSA9IHRydWVcblxuICAgICAgdGhpcy5zdGFydE11dGF0aW9uKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMudGFyZ2V0KSB0aGlzLnNlbGVjdFRhcmdldCgpXG4gICAgICAgIGlmICh0aGlzLm11dGF0ZVRleHQpIHRoaXMubXV0YXRlVGV4dCgpXG5cbiAgICAgICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICAgICAgY29uc3QgdGV4dFRvSW5zZXJ0ID0gKHRoaXMubGFzdENoYW5nZSAmJiB0aGlzLmxhc3RDaGFuZ2UubmV3VGV4dCkgfHwgXCJcIlxuICAgICAgICAgIHRoaXMucmVwZWF0SW5zZXJ0KHNlbGVjdGlvbiwgdGV4dFRvSW5zZXJ0KVxuICAgICAgICAgIG1vdmVDdXJzb3JMZWZ0KHNlbGVjdGlvbi5jdXJzb3IpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludChcImRpZC1maW5pc2hcIilcbiAgICAgIH0pXG5cbiAgICAgIGlmICh0aGlzLmdldENvbmZpZyhcImNsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlXCIpKSB0aGlzLnZpbVN0YXRlLmNsZWFyU2VsZWN0aW9ucygpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubm9ybWFsaXplU2VsZWN0aW9uc0lmTmVjZXNzYXJ5KClcbiAgICAgIHRoaXMuY3JlYXRlQnVmZmVyQ2hlY2twb2ludChcInVuZG9cIilcbiAgICAgIGlmICh0aGlzLnRhcmdldCkgdGhpcy5zZWxlY3RUYXJnZXQoKVxuICAgICAgdGhpcy5vYnNlcnZlV2lsbERlYWN0aXZhdGVNb2RlKClcbiAgICAgIGlmICh0aGlzLm11dGF0ZVRleHQpIHRoaXMubXV0YXRlVGV4dCgpXG5cbiAgICAgIGlmICh0aGlzLmdldEluc2VydGlvbkNvdW50KCkgPiAwKSB7XG4gICAgICAgIGNvbnN0IGNoYW5nZSA9IHRoaXMuZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50KFwidW5kb1wiKVxuICAgICAgICB0aGlzLnRleHRCeU9wZXJhdG9yID0gKGNoYW5nZSAmJiBjaGFuZ2UubmV3VGV4dCkgfHwgXCJcIlxuICAgICAgfVxuXG4gICAgICB0aGlzLmNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQoXCJpbnNlcnRcIilcbiAgICAgIGNvbnN0IHRvcEN1cnNvciA9IHRoaXMuZWRpdG9yLmdldEN1cnNvcnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpWzBdXG4gICAgICB0aGlzLnRvcEN1cnNvclBvc2l0aW9uQXRJbnNlcnRpb25TdGFydCA9IHRvcEN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIC8vIFNraXAgbm9ybWFsaXphdGlvbiBvZiBibG9ja3dpc2VTZWxlY3Rpb24uXG4gICAgICAvLyBTaW5jZSB3YW50IHRvIGtlZXAgbXVsdGktY3Vyc29yIGFuZCBpdCdzIHBvc2l0aW9uIGluIHdoZW4gc2hpZnQgdG8gaW5zZXJ0LW1vZGUuXG4gICAgICBmb3IgKGNvbnN0IGJsb2Nrd2lzZVNlbGVjdGlvbiBvZiB0aGlzLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKSkge1xuICAgICAgICBibG9ja3dpc2VTZWxlY3Rpb24uc2tpcE5vcm1hbGl6YXRpb24oKVxuICAgICAgfVxuICAgICAgdGhpcy5hY3RpdmF0ZU1vZGUoXCJpbnNlcnRcIiwgdGhpcy5maW5hbFN1Ym1vZGUpXG4gICAgfVxuICB9XG59XG5BY3RpdmF0ZUluc2VydE1vZGUucmVnaXN0ZXIoKVxuXG5jbGFzcyBBY3RpdmF0ZVJlcGxhY2VNb2RlIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZmluYWxTdWJtb2RlID0gXCJyZXBsYWNlXCJcblxuICByZXBlYXRJbnNlcnQoc2VsZWN0aW9uLCB0ZXh0KSB7XG4gICAgZm9yIChjb25zdCBjaGFyIG9mIHRleHQpIHtcbiAgICAgIGlmIChjaGFyID09PSBcIlxcblwiKSBjb250aW51ZVxuICAgICAgaWYgKHNlbGVjdGlvbi5jdXJzb3IuaXNBdEVuZE9mTGluZSgpKSBicmVha1xuICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICB9XG4gICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwge2F1dG9JbmRlbnQ6IGZhbHNlfSlcbiAgfVxufVxuQWN0aXZhdGVSZXBsYWNlTW9kZS5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEFmdGVyIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSgpIHtcbiAgICBmb3IgKGNvbnN0IGN1cnNvciBvZiB0aGlzLmVkaXRvci5nZXRDdXJzb3JzKCkpIHtcbiAgICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IpXG4gICAgfVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5JbnNlcnRBZnRlci5yZWdpc3RlcigpXG5cbi8vIGtleTogJ2cgSScgaW4gYWxsIG1vZGVcbmNsYXNzIEluc2VydEF0QmVnaW5uaW5nT2ZMaW5lIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSgpIHtcbiAgICBpZiAodGhpcy5tb2RlID09PSBcInZpc3VhbFwiICYmIHRoaXMuc3VibW9kZSAhPT0gXCJibG9ja3dpc2VcIikge1xuICAgICAgdGhpcy5lZGl0b3Iuc3BsaXRTZWxlY3Rpb25zSW50b0xpbmVzKClcbiAgICB9XG4gICAgdGhpcy5lZGl0b3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxufVxuSW5zZXJ0QXRCZWdpbm5pbmdPZkxpbmUucmVnaXN0ZXIoKVxuXG4vLyBrZXk6IG5vcm1hbCAnQSdcbmNsYXNzIEluc2VydEFmdGVyRW5kT2ZMaW5lIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlIHtcbiAgZXhlY3V0ZSgpIHtcbiAgICB0aGlzLmVkaXRvci5tb3ZlVG9FbmRPZkxpbmUoKVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5JbnNlcnRBZnRlckVuZE9mTGluZS5yZWdpc3RlcigpXG5cbi8vIGtleTogbm9ybWFsICdJJ1xuY2xhc3MgSW5zZXJ0QXRGaXJzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZSB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5lZGl0b3IubW92ZVRvQmVnaW5uaW5nT2ZMaW5lKClcbiAgICB0aGlzLmVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSgpXG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cbn1cbkluc2VydEF0Rmlyc3RDaGFyYWN0ZXJPZkxpbmUucmVnaXN0ZXIoKVxuXG5jbGFzcyBJbnNlcnRBdExhc3RJbnNlcnQgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGUge1xuICBleGVjdXRlKCkge1xuICAgIGNvbnN0IHBvaW50ID0gdGhpcy52aW1TdGF0ZS5tYXJrLmdldChcIl5cIilcbiAgICBpZiAocG9pbnQpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuICAgICAgdGhpcy5lZGl0b3Iuc2Nyb2xsVG9DdXJzb3JQb3NpdGlvbih7Y2VudGVyOiB0cnVlfSlcbiAgICB9XG4gICAgc3VwZXIuZXhlY3V0ZSgpXG4gIH1cbn1cbkluc2VydEF0TGFzdEluc2VydC5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEFib3ZlV2l0aE5ld2xpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGUge1xuICBpbml0aWFsaXplKCkge1xuICAgIGlmICh0aGlzLmdldENvbmZpZyhcImdyb3VwQ2hhbmdlc1doZW5MZWF2aW5nSW5zZXJ0TW9kZVwiKSkge1xuICAgICAgdGhpcy5vcmlnaW5hbEN1cnNvclBvc2l0aW9uTWFya2VyID0gdGhpcy5lZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgfVxuICAgIHJldHVybiBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIC8vIFRoaXMgaXMgZm9yIGBvYCBhbmQgYE9gIG9wZXJhdG9yLlxuICAvLyBPbiB1bmRvL3JlZG8gcHV0IGN1cnNvciBhdCBvcmlnaW5hbCBwb2ludCB3aGVyZSB1c2VyIHR5cGUgYG9gIG9yIGBPYC5cbiAgZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50KHB1cnBvc2UpIHtcbiAgICBjb25zdCBsYXN0Q3Vyc29yID0gdGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgY29uc3QgY3Vyc29yUG9zaXRpb24gPSBsYXN0Q3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHRoaXMub3JpZ2luYWxDdXJzb3JQb3NpdGlvbk1hcmtlci5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKSlcbiAgICB0aGlzLm9yaWdpbmFsQ3Vyc29yUG9zaXRpb25NYXJrZXIuZGVzdHJveSgpXG5cbiAgICBzdXBlci5ncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQocHVycG9zZSlcblxuICAgIGxhc3RDdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oY3Vyc29yUG9zaXRpb24pXG4gIH1cblxuICBhdXRvSW5kZW50RW1wdHlSb3dzKCkge1xuICAgIGZvciAoY29uc3QgY3Vyc29yIG9mIHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKSkge1xuICAgICAgY29uc3Qgcm93ID0gY3Vyc29yLmdldEJ1ZmZlclJvdygpXG4gICAgICBpZiAoaXNFbXB0eVJvdyh0aGlzLmVkaXRvciwgcm93KSkge1xuICAgICAgICB0aGlzLmVkaXRvci5hdXRvSW5kZW50QnVmZmVyUm93KHJvdylcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBtdXRhdGVUZXh0KCkge1xuICAgIHRoaXMuZWRpdG9yLmluc2VydE5ld2xpbmVBYm92ZSgpXG4gICAgaWYgKHRoaXMuZWRpdG9yLmF1dG9JbmRlbnQpIHtcbiAgICAgIHRoaXMuYXV0b0luZGVudEVtcHR5Um93cygpXG4gICAgfVxuICB9XG5cbiAgcmVwZWF0SW5zZXJ0KHNlbGVjdGlvbiwgdGV4dCkge1xuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQudHJpbUxlZnQoKSwge2F1dG9JbmRlbnQ6IHRydWV9KVxuICB9XG59XG5JbnNlcnRBYm92ZVdpdGhOZXdsaW5lLnJlZ2lzdGVyKClcblxuY2xhc3MgSW5zZXJ0QmVsb3dXaXRoTmV3bGluZSBleHRlbmRzIEluc2VydEFib3ZlV2l0aE5ld2xpbmUge1xuICBtdXRhdGVUZXh0KCkge1xuICAgIGZvciAoY29uc3QgY3Vyc29yIG9mIHRoaXMuZWRpdG9yLmdldEN1cnNvcnMoKSkge1xuICAgICAgc2V0QnVmZmVyUm93KGN1cnNvciwgdGhpcy5nZXRGb2xkRW5kUm93Rm9yUm93KGN1cnNvci5nZXRCdWZmZXJSb3coKSkpXG4gICAgfVxuXG4gICAgdGhpcy5lZGl0b3IuaW5zZXJ0TmV3bGluZUJlbG93KClcbiAgICBpZiAodGhpcy5lZGl0b3IuYXV0b0luZGVudCkgdGhpcy5hdXRvSW5kZW50RW1wdHlSb3dzKClcbiAgfVxufVxuSW5zZXJ0QmVsb3dXaXRoTmV3bGluZS5yZWdpc3RlcigpXG5cbi8vIEFkdmFuY2VkIEluc2VydGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgSW5zZXJ0QnlUYXJnZXQgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGUge1xuICByZXF1aXJlVGFyZ2V0ID0gdHJ1ZVxuICB3aGljaCA9IG51bGwgLy8gb25lIG9mIFsnc3RhcnQnLCAnZW5kJywgJ2hlYWQnLCAndGFpbCddXG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICAvLyBIQUNLXG4gICAgLy8gV2hlbiBnIGkgaXMgbWFwcGVkIHRvIGBpbnNlcnQtYXQtc3RhcnQtb2YtdGFyZ2V0YC5cbiAgICAvLyBgZyBpIDMgbGAgc3RhcnQgaW5zZXJ0IGF0IDMgY29sdW1uIHJpZ2h0IHBvc2l0aW9uLlxuICAgIC8vIEluIHRoaXMgY2FzZSwgd2UgZG9uJ3Qgd2FudCByZXBlYXQgaW5zZXJ0aW9uIDMgdGltZXMuXG4gICAgLy8gVGhpcyBAZ2V0Q291bnQoKSBjYWxsIGNhY2hlIG51bWJlciBhdCB0aGUgdGltaW5nIEJFRk9SRSAnMycgaXMgc3BlY2lmaWVkLlxuICAgIHRoaXMuZ2V0Q291bnQoKVxuICAgIHJldHVybiBzdXBlci5pbml0aWFsaXplKClcbiAgfVxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5vbkRpZFNlbGVjdFRhcmdldCgoKSA9PiB7XG4gICAgICAvLyBJbiB2Qy92TCwgd2hlbiBvY2N1cnJlbmNlIG1hcmtlciB3YXMgTk9UIHNlbGVjdGVkLFxuICAgICAgLy8gaXQgYmVoYXZlJ3MgdmVyeSBzcGVjaWFsbHlcbiAgICAgIC8vIHZDOiBgSWAgYW5kIGBBYCBiZWhhdmVzIGFzIHNob2Z0IGhhbmQgb2YgYGN0cmwtdiBJYCBhbmQgYGN0cmwtdiBBYC5cbiAgICAgIC8vIHZMOiBgSWAgYW5kIGBBYCBwbGFjZSBjdXJzb3JzIGF0IGVhY2ggc2VsZWN0ZWQgbGluZXMgb2Ygc3RhcnQoIG9yIGVuZCApIG9mIG5vbi13aGl0ZS1zcGFjZSBjaGFyLlxuICAgICAgaWYgKCF0aGlzLm9jY3VycmVuY2VTZWxlY3RlZCAmJiB0aGlzLm1vZGUgPT09IFwidmlzdWFsXCIgJiYgdGhpcy5zdWJtb2RlICE9PSBcImJsb2Nrd2lzZVwiKSB7XG4gICAgICAgIGZvciAoY29uc3QgJHNlbGVjdGlvbiBvZiB0aGlzLnN3cmFwLmdldFNlbGVjdGlvbnModGhpcy5lZGl0b3IpKSB7XG4gICAgICAgICAgJHNlbGVjdGlvbi5ub3JtYWxpemUoKVxuICAgICAgICAgICRzZWxlY3Rpb24uYXBwbHlXaXNlKFwiYmxvY2t3aXNlXCIpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5zdWJtb2RlID09PSBcImxpbmV3aXNlXCIpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGJsb2Nrd2lzZVNlbGVjdGlvbiBvZiB0aGlzLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgICAgYmxvY2t3aXNlU2VsZWN0aW9uLmV4cGFuZE1lbWJlclNlbGVjdGlvbnNPdmVyTGluZVdpdGhUcmltUmFuZ2UoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0ICRzZWxlY3Rpb24gb2YgdGhpcy5zd3JhcC5nZXRTZWxlY3Rpb25zKHRoaXMuZWRpdG9yKSkge1xuICAgICAgICAkc2VsZWN0aW9uLnNldEJ1ZmZlclBvc2l0aW9uVG8odGhpcy53aGljaClcbiAgICAgIH1cbiAgICB9KVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5JbnNlcnRCeVRhcmdldC5yZWdpc3RlcihmYWxzZSlcblxuLy8ga2V5OiAnSScsIFVzZWQgaW4gJ3Zpc3VhbC1tb2RlLmNoYXJhY3Rlcndpc2UnLCB2aXN1YWwtbW9kZS5ibG9ja3dpc2VcbmNsYXNzIEluc2VydEF0U3RhcnRPZlRhcmdldCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0IHtcbiAgd2hpY2ggPSBcInN0YXJ0XCJcbn1cbkluc2VydEF0U3RhcnRPZlRhcmdldC5yZWdpc3RlcigpXG5cbi8vIGtleTogJ0EnLCBVc2VkIGluICd2aXN1YWwtbW9kZS5jaGFyYWN0ZXJ3aXNlJywgJ3Zpc3VhbC1tb2RlLmJsb2Nrd2lzZSdcbmNsYXNzIEluc2VydEF0RW5kT2ZUYXJnZXQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldCB7XG4gIHdoaWNoID0gXCJlbmRcIlxufVxuSW5zZXJ0QXRFbmRPZlRhcmdldC5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEF0SGVhZE9mVGFyZ2V0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXQge1xuICB3aGljaCA9IFwiaGVhZFwiXG59XG5JbnNlcnRBdEhlYWRPZlRhcmdldC5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEF0U3RhcnRPZk9jY3VycmVuY2UgZXh0ZW5kcyBJbnNlcnRBdFN0YXJ0T2ZUYXJnZXQge1xuICBvY2N1cnJlbmNlID0gdHJ1ZVxufVxuSW5zZXJ0QXRTdGFydE9mT2NjdXJyZW5jZS5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEF0RW5kT2ZPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRFbmRPZlRhcmdldCB7XG4gIG9jY3VycmVuY2UgPSB0cnVlXG59XG5JbnNlcnRBdEVuZE9mT2NjdXJyZW5jZS5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEF0SGVhZE9mT2NjdXJyZW5jZSBleHRlbmRzIEluc2VydEF0SGVhZE9mVGFyZ2V0IHtcbiAgb2NjdXJyZW5jZSA9IHRydWVcbn1cbkluc2VydEF0SGVhZE9mT2NjdXJyZW5jZS5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEF0U3RhcnRPZlN1YndvcmRPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRTdGFydE9mT2NjdXJyZW5jZSB7XG4gIG9jY3VycmVuY2VUeXBlID0gXCJzdWJ3b3JkXCJcbn1cbkluc2VydEF0U3RhcnRPZlN1YndvcmRPY2N1cnJlbmNlLnJlZ2lzdGVyKClcblxuY2xhc3MgSW5zZXJ0QXRFbmRPZlN1YndvcmRPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRFbmRPZk9jY3VycmVuY2Uge1xuICBvY2N1cnJlbmNlVHlwZSA9IFwic3Vid29yZFwiXG59XG5JbnNlcnRBdEVuZE9mU3Vid29yZE9jY3VycmVuY2UucmVnaXN0ZXIoKVxuXG5jbGFzcyBJbnNlcnRBdEhlYWRPZlN1YndvcmRPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRIZWFkT2ZPY2N1cnJlbmNlIHtcbiAgb2NjdXJyZW5jZVR5cGUgPSBcInN1YndvcmRcIlxufVxuSW5zZXJ0QXRIZWFkT2ZTdWJ3b3JkT2NjdXJyZW5jZS5yZWdpc3RlcigpXG5cbmNsYXNzIEluc2VydEF0U3RhcnRPZlNtYXJ0V29yZCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0IHtcbiAgd2hpY2ggPSBcInN0YXJ0XCJcbiAgdGFyZ2V0ID0gXCJNb3ZlVG9QcmV2aW91c1NtYXJ0V29yZFwiXG59XG5JbnNlcnRBdFN0YXJ0T2ZTbWFydFdvcmQucmVnaXN0ZXIoKVxuXG5jbGFzcyBJbnNlcnRBdEVuZE9mU21hcnRXb3JkIGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXQge1xuICB3aGljaCA9IFwiZW5kXCJcbiAgdGFyZ2V0ID0gXCJNb3ZlVG9FbmRPZlNtYXJ0V29yZFwiXG59XG5JbnNlcnRBdEVuZE9mU21hcnRXb3JkLnJlZ2lzdGVyKClcblxuY2xhc3MgSW5zZXJ0QXRQcmV2aW91c0ZvbGRTdGFydCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0IHtcbiAgd2hpY2ggPSBcInN0YXJ0XCJcbiAgdGFyZ2V0ID0gXCJNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFwiXG59XG5JbnNlcnRBdFByZXZpb3VzRm9sZFN0YXJ0LnJlZ2lzdGVyKClcblxuY2xhc3MgSW5zZXJ0QXROZXh0Rm9sZFN0YXJ0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXQge1xuICB3aGljaCA9IFwiZW5kXCJcbiAgdGFyZ2V0ID0gXCJNb3ZlVG9OZXh0Rm9sZFN0YXJ0XCJcbn1cbkluc2VydEF0TmV4dEZvbGRTdGFydC5yZWdpc3RlcigpXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIENoYW5nZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZSB7XG4gIHJlcXVpcmVUYXJnZXQgPSB0cnVlXG4gIHRyYWNrQ2hhbmdlID0gdHJ1ZVxuICBzdXBwb3J0SW5zZXJ0aW9uQ291bnQgPSBmYWxzZVxuXG4gIG11dGF0ZVRleHQoKSB7XG4gICAgLy8gQWxsd2F5cyBkeW5hbWljYWxseSBkZXRlcm1pbmUgc2VsZWN0aW9uIHdpc2Ugd3Rob3V0IGNvbnN1bHRpbmcgdGFyZ2V0Lndpc2VcbiAgICAvLyBSZWFzb246IHdoZW4gYGMgaSB7YCwgd2lzZSBpcyAnY2hhcmFjdGVyd2lzZScsIGJ1dCBhY3R1YWxseSBzZWxlY3RlZCByYW5nZSBpcyAnbGluZXdpc2UnXG4gICAgLy8gICB7XG4gICAgLy8gICAgIGFcbiAgICAvLyAgIH1cbiAgICBjb25zdCBpc0xpbmV3aXNlVGFyZ2V0ID0gdGhpcy5zd3JhcC5kZXRlY3RXaXNlKHRoaXMuZWRpdG9yKSA9PT0gXCJsaW5ld2lzZVwiXG4gICAgZm9yIChjb25zdCBzZWxlY3Rpb24gb2YgdGhpcy5lZGl0b3IuZ2V0U2VsZWN0aW9ucygpKSB7XG4gICAgICBpZiAoIXRoaXMuZ2V0Q29uZmlnKFwiZG9udFVwZGF0ZVJlZ2lzdGVyT25DaGFuZ2VPclN1YnN0aXR1dGVcIikpIHtcbiAgICAgICAgdGhpcy5zZXRUZXh0VG9SZWdpc3RlckZvclNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICB9XG4gICAgICBpZiAoaXNMaW5ld2lzZVRhcmdldCkge1xuICAgICAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChcIlxcblwiLCB7YXV0b0luZGVudDogdHJ1ZX0pXG4gICAgICAgIHNlbGVjdGlvbi5jdXJzb3IubW92ZUxlZnQoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoXCJcIiwge2F1dG9JbmRlbnQ6IHRydWV9KVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuQ2hhbmdlLnJlZ2lzdGVyKClcblxuY2xhc3MgQ2hhbmdlT2NjdXJyZW5jZSBleHRlbmRzIENoYW5nZSB7XG4gIG9jY3VycmVuY2UgPSB0cnVlXG59XG5DaGFuZ2VPY2N1cnJlbmNlLnJlZ2lzdGVyKClcblxuY2xhc3MgU3Vic3RpdHV0ZSBleHRlbmRzIENoYW5nZSB7XG4gIHRhcmdldCA9IFwiTW92ZVJpZ2h0XCJcbn1cblN1YnN0aXR1dGUucmVnaXN0ZXIoKVxuXG5jbGFzcyBTdWJzdGl0dXRlTGluZSBleHRlbmRzIENoYW5nZSB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCIgLy8gW0ZJWE1FXSB0byByZS1vdmVycmlkZSB0YXJnZXQud2lzZSBpbiB2aXN1YWwtbW9kZVxuICB0YXJnZXQgPSBcIk1vdmVUb1JlbGF0aXZlTGluZVwiXG59XG5TdWJzdGl0dXRlTGluZS5yZWdpc3RlcigpXG5cbi8vIGFsaWFzXG5jbGFzcyBDaGFuZ2VMaW5lIGV4dGVuZHMgU3Vic3RpdHV0ZUxpbmUge31cbkNoYW5nZUxpbmUucmVnaXN0ZXIoKVxuXG5jbGFzcyBDaGFuZ2VUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBDaGFuZ2Uge1xuICB0YXJnZXQgPSBcIk1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmVcIlxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgdGhpcy5vbkRpZFNlbGVjdFRhcmdldCgoKSA9PiB7XG4gICAgICBpZiAodGhpcy50YXJnZXQud2lzZSA9PT0gXCJibG9ja3dpc2VcIikge1xuICAgICAgICBmb3IgKGNvbnN0IGJsb2Nrd2lzZVNlbGVjdGlvbiBvZiB0aGlzLmdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKSkge1xuICAgICAgICAgIGJsb2Nrd2lzZVNlbGVjdGlvbi5leHRlbmRNZW1iZXJTZWxlY3Rpb25zVG9FbmRPZkxpbmUoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxufVxuQ2hhbmdlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lLnJlZ2lzdGVyKClcbiJdfQ==