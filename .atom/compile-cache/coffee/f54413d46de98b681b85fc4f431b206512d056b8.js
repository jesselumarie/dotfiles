(function() {
  var ActivateInsertMode, ActivateReplaceMode, Change, ChangeLine, ChangeOccurrence, ChangeToLastCharacterOfLine, InsertAboveWithNewline, InsertAfter, InsertAfterEndOfLine, InsertAtBeginningOfLine, InsertAtEndOfOccurrence, InsertAtEndOfSmartWord, InsertAtEndOfSubwordOccurrence, InsertAtEndOfTarget, InsertAtFirstCharacterOfLine, InsertAtHeadOfTarget, InsertAtLastInsert, InsertAtNextFoldStart, InsertAtPreviousFoldStart, InsertAtStartOfOccurrence, InsertAtStartOfSmartWord, InsertAtStartOfSubwordOccurrence, InsertAtStartOfTarget, InsertBelowWithNewline, InsertByTarget, Operator, Range, Substitute, SubstituteLine, _, isEmptyRow, limitNumber, moveCursorLeft, moveCursorRight, ref, setBufferRow,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  Range = require('atom').Range;

  ref = require('./utils'), moveCursorLeft = ref.moveCursorLeft, moveCursorRight = ref.moveCursorRight, limitNumber = ref.limitNumber, isEmptyRow = ref.isEmptyRow, setBufferRow = ref.setBufferRow;

  Operator = require('./base').getClass('Operator');

  ActivateInsertMode = (function(superClass) {
    extend(ActivateInsertMode, superClass);

    function ActivateInsertMode() {
      return ActivateInsertMode.__super__.constructor.apply(this, arguments);
    }

    ActivateInsertMode.extend();

    ActivateInsertMode.prototype.requireTarget = false;

    ActivateInsertMode.prototype.flashTarget = false;

    ActivateInsertMode.prototype.finalSubmode = null;

    ActivateInsertMode.prototype.supportInsertionCount = true;

    ActivateInsertMode.prototype.observeWillDeactivateMode = function() {
      var disposable;
      return disposable = this.vimState.modeManager.preemptWillDeactivateMode((function(_this) {
        return function(arg) {
          var change, mode, textByUserInput;
          mode = arg.mode;
          if (mode !== 'insert') {
            return;
          }
          disposable.dispose();
          _this.vimState.mark.set('^', _this.editor.getCursorBufferPosition());
          textByUserInput = '';
          if (change = _this.getChangeSinceCheckpoint('insert')) {
            _this.lastChange = change;
            _this.setMarkForChange(new Range(change.start, change.start.traverse(change.newExtent)));
            textByUserInput = change.newText;
          }
          _this.vimState.register.set('.', {
            text: textByUserInput
          });
          _.times(_this.getInsertionCount(), function() {
            var i, len, ref1, results, selection, text;
            text = _this.textByOperator + textByUserInput;
            ref1 = _this.editor.getSelections();
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              results.push(selection.insertText(text, {
                autoIndent: true
              }));
            }
            return results;
          });
          if (_this.getConfig('clearMultipleCursorsOnEscapeInsertMode')) {
            _this.vimState.clearSelections();
          }
          if (_this.getConfig('groupChangesWhenLeavingInsertMode')) {
            return _this.groupChangesSinceBufferCheckpoint('undo');
          }
        };
      })(this));
    };

    ActivateInsertMode.prototype.getChangeSinceCheckpoint = function(purpose) {
      var checkpoint;
      checkpoint = this.getBufferCheckpoint(purpose);
      return this.editor.buffer.getChangesSinceCheckpoint(checkpoint)[0];
    };

    ActivateInsertMode.prototype.replayLastChange = function(selection) {
      var deletionEnd, deletionStart, newExtent, newText, oldExtent, ref1, start, traversalToStartOfDelete;
      if (this.lastChange != null) {
        ref1 = this.lastChange, start = ref1.start, newExtent = ref1.newExtent, oldExtent = ref1.oldExtent, newText = ref1.newText;
        if (!oldExtent.isZero()) {
          traversalToStartOfDelete = start.traversalFrom(this.topCursorPositionAtInsertionStart);
          deletionStart = selection.cursor.getBufferPosition().traverse(traversalToStartOfDelete);
          deletionEnd = deletionStart.traverse(oldExtent);
          selection.setBufferRange([deletionStart, deletionEnd]);
        }
      } else {
        newText = '';
      }
      return selection.insertText(newText, {
        autoIndent: true
      });
    };

    ActivateInsertMode.prototype.repeatInsert = function(selection, text) {
      return this.replayLastChange(selection);
    };

    ActivateInsertMode.prototype.getInsertionCount = function() {
      if (this.insertionCount == null) {
        this.insertionCount = this.supportInsertionCount ? this.getCount(-1) : 0;
      }
      return limitNumber(this.insertionCount, {
        max: 100
      });
    };

    ActivateInsertMode.prototype.investigateCursorPosition = function() {
      var c1, c2, c3, ref1;
      ref1 = [], c1 = ref1[0], c2 = ref1[1], c3 = ref1[2];
      c1 = this.editor.getCursorBufferPosition();
      this.onWillActivateMode((function(_this) {
        return function(arg) {
          var mode, submode;
          mode = arg.mode, submode = arg.submode;
          c2 = _this.editor.getCursorBufferPosition();
          if (!c1.isEqual(c2)) {
            return console.info('diff c1, c2', c1.toString(), c2.toString());
          }
        };
      })(this));
      return this.onDidActivateMode((function(_this) {
        return function(arg) {
          var mode, submode;
          mode = arg.mode, submode = arg.submode;
          c3 = _this.editor.getCursorBufferPosition();
          if (c2.row !== c3.row) {
            return console.warn('dff c2, c3', c2.toString(), c3.toString());
          }
        };
      })(this));
    };

    ActivateInsertMode.prototype.execute = function() {
      var blockwiseSelection, i, len, ref1, ref2, ref3, topCursor;
      if (this.repeated) {
        this.flashTarget = this.trackChange = true;
        this.startMutation((function(_this) {
          return function() {
            var i, len, ref1, ref2, ref3, selection;
            if (_this.target != null) {
              _this.selectTarget();
            }
            if (typeof _this.mutateText === "function") {
              _this.mutateText();
            }
            ref1 = _this.editor.getSelections();
            for (i = 0, len = ref1.length; i < len; i++) {
              selection = ref1[i];
              _this.repeatInsert(selection, (ref2 = (ref3 = _this.lastChange) != null ? ref3.newText : void 0) != null ? ref2 : '');
              moveCursorLeft(selection.cursor);
            }
            return _this.mutationManager.setCheckpoint('did-finish');
          };
        })(this));
        if (this.getConfig('clearMultipleCursorsOnEscapeInsertMode')) {
          return this.vimState.clearSelections();
        }
      } else {
        if (this.getConfig("debug")) {
          this.investigateCursorPosition();
        }
        this.normalizeSelectionsIfNecessary();
        this.createBufferCheckpoint('undo');
        if (this.target != null) {
          this.selectTarget();
        }
        this.observeWillDeactivateMode();
        if (typeof this.mutateText === "function") {
          this.mutateText();
        }
        if (this.getInsertionCount() > 0) {
          this.textByOperator = (ref1 = (ref2 = this.getChangeSinceCheckpoint('undo')) != null ? ref2.newText : void 0) != null ? ref1 : '';
        }
        this.createBufferCheckpoint('insert');
        topCursor = this.editor.getCursorsOrderedByBufferPosition()[0];
        this.topCursorPositionAtInsertionStart = topCursor.getBufferPosition();
        ref3 = this.getBlockwiseSelections();
        for (i = 0, len = ref3.length; i < len; i++) {
          blockwiseSelection = ref3[i];
          blockwiseSelection.skipNormalization();
        }
        return this.activateMode('insert', this.finalSubmode);
      }
    };

    return ActivateInsertMode;

  })(Operator);

  ActivateReplaceMode = (function(superClass) {
    extend(ActivateReplaceMode, superClass);

    function ActivateReplaceMode() {
      return ActivateReplaceMode.__super__.constructor.apply(this, arguments);
    }

    ActivateReplaceMode.extend();

    ActivateReplaceMode.prototype.finalSubmode = 'replace';

    ActivateReplaceMode.prototype.repeatInsert = function(selection, text) {
      var char, i, len;
      for (i = 0, len = text.length; i < len; i++) {
        char = text[i];
        if (!(char !== "\n")) {
          continue;
        }
        if (selection.cursor.isAtEndOfLine()) {
          break;
        }
        selection.selectRight();
      }
      return selection.insertText(text, {
        autoIndent: false
      });
    };

    return ActivateReplaceMode;

  })(ActivateInsertMode);

  InsertAfter = (function(superClass) {
    extend(InsertAfter, superClass);

    function InsertAfter() {
      return InsertAfter.__super__.constructor.apply(this, arguments);
    }

    InsertAfter.extend();

    InsertAfter.prototype.execute = function() {
      var cursor, i, len, ref1;
      ref1 = this.editor.getCursors();
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        moveCursorRight(cursor);
      }
      return InsertAfter.__super__.execute.apply(this, arguments);
    };

    return InsertAfter;

  })(ActivateInsertMode);

  InsertAtBeginningOfLine = (function(superClass) {
    extend(InsertAtBeginningOfLine, superClass);

    function InsertAtBeginningOfLine() {
      return InsertAtBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAtBeginningOfLine.extend();

    InsertAtBeginningOfLine.prototype.execute = function() {
      var ref1;
      if (this.mode === 'visual' && ((ref1 = this.submode) === 'characterwise' || ref1 === 'linewise')) {
        this.editor.splitSelectionsIntoLines();
      }
      this.editor.moveToBeginningOfLine();
      return InsertAtBeginningOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAtBeginningOfLine;

  })(ActivateInsertMode);

  InsertAfterEndOfLine = (function(superClass) {
    extend(InsertAfterEndOfLine, superClass);

    function InsertAfterEndOfLine() {
      return InsertAfterEndOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAfterEndOfLine.extend();

    InsertAfterEndOfLine.prototype.execute = function() {
      this.editor.moveToEndOfLine();
      return InsertAfterEndOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAfterEndOfLine;

  })(ActivateInsertMode);

  InsertAtFirstCharacterOfLine = (function(superClass) {
    extend(InsertAtFirstCharacterOfLine, superClass);

    function InsertAtFirstCharacterOfLine() {
      return InsertAtFirstCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    InsertAtFirstCharacterOfLine.extend();

    InsertAtFirstCharacterOfLine.prototype.execute = function() {
      this.editor.moveToBeginningOfLine();
      this.editor.moveToFirstCharacterOfLine();
      return InsertAtFirstCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return InsertAtFirstCharacterOfLine;

  })(ActivateInsertMode);

  InsertAtLastInsert = (function(superClass) {
    extend(InsertAtLastInsert, superClass);

    function InsertAtLastInsert() {
      return InsertAtLastInsert.__super__.constructor.apply(this, arguments);
    }

    InsertAtLastInsert.extend();

    InsertAtLastInsert.prototype.execute = function() {
      var point;
      if ((point = this.vimState.mark.get('^'))) {
        this.editor.setCursorBufferPosition(point);
        this.editor.scrollToCursorPosition({
          center: true
        });
      }
      return InsertAtLastInsert.__super__.execute.apply(this, arguments);
    };

    return InsertAtLastInsert;

  })(ActivateInsertMode);

  InsertAboveWithNewline = (function(superClass) {
    extend(InsertAboveWithNewline, superClass);

    function InsertAboveWithNewline() {
      return InsertAboveWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertAboveWithNewline.extend();

    InsertAboveWithNewline.prototype.initialize = function() {
      if (this.getConfig('groupChangesWhenLeavingInsertMode')) {
        return this.originalCursorPositionMarker = this.editor.markBufferPosition(this.editor.getCursorBufferPosition());
      }
    };

    InsertAboveWithNewline.prototype.groupChangesSinceBufferCheckpoint = function() {
      var cursorPosition, lastCursor;
      lastCursor = this.editor.getLastCursor();
      cursorPosition = lastCursor.getBufferPosition();
      lastCursor.setBufferPosition(this.originalCursorPositionMarker.getHeadBufferPosition());
      this.originalCursorPositionMarker.destroy();
      InsertAboveWithNewline.__super__.groupChangesSinceBufferCheckpoint.apply(this, arguments);
      return lastCursor.setBufferPosition(cursorPosition);
    };

    InsertAboveWithNewline.prototype.autoIndentEmptyRows = function() {
      var cursor, i, len, ref1, results, row;
      ref1 = this.editor.getCursors();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        row = cursor.getBufferRow();
        if (isEmptyRow(this.editor, row)) {
          results.push(this.editor.autoIndentBufferRow(row));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    InsertAboveWithNewline.prototype.mutateText = function() {
      this.editor.insertNewlineAbove();
      if (this.editor.autoIndent) {
        return this.autoIndentEmptyRows();
      }
    };

    InsertAboveWithNewline.prototype.repeatInsert = function(selection, text) {
      return selection.insertText(text.trimLeft(), {
        autoIndent: true
      });
    };

    return InsertAboveWithNewline;

  })(ActivateInsertMode);

  InsertBelowWithNewline = (function(superClass) {
    extend(InsertBelowWithNewline, superClass);

    function InsertBelowWithNewline() {
      return InsertBelowWithNewline.__super__.constructor.apply(this, arguments);
    }

    InsertBelowWithNewline.extend();

    InsertBelowWithNewline.prototype.mutateText = function() {
      var cursor, cursorRow, i, len, ref1;
      ref1 = this.editor.getCursors();
      for (i = 0, len = ref1.length; i < len; i++) {
        cursor = ref1[i];
        if (cursorRow = cursor.getBufferRow()) {
          setBufferRow(cursor, this.getFoldEndRowForRow(cursorRow));
        }
      }
      this.editor.insertNewlineBelow();
      if (this.editor.autoIndent) {
        return this.autoIndentEmptyRows();
      }
    };

    return InsertBelowWithNewline;

  })(InsertAboveWithNewline);

  InsertByTarget = (function(superClass) {
    extend(InsertByTarget, superClass);

    function InsertByTarget() {
      return InsertByTarget.__super__.constructor.apply(this, arguments);
    }

    InsertByTarget.extend(false);

    InsertByTarget.prototype.requireTarget = true;

    InsertByTarget.prototype.which = null;

    InsertByTarget.prototype.initialize = function() {
      this.getCount();
      return InsertByTarget.__super__.initialize.apply(this, arguments);
    };

    InsertByTarget.prototype.execute = function() {
      this.onDidSelectTarget((function(_this) {
        return function() {
          var $selection, blockwiseSelection, i, j, k, len, len1, len2, ref1, ref2, ref3, ref4, results;
          if (!_this.occurrenceSelected && _this.mode === 'visual' && ((ref1 = _this.submode) === 'characterwise' || ref1 === 'linewise')) {
            ref2 = _this.swrap.getSelections(_this.editor);
            for (i = 0, len = ref2.length; i < len; i++) {
              $selection = ref2[i];
              $selection.normalize();
              $selection.applyWise('blockwise');
            }
            if (_this.submode === 'linewise') {
              ref3 = _this.getBlockwiseSelections();
              for (j = 0, len1 = ref3.length; j < len1; j++) {
                blockwiseSelection = ref3[j];
                blockwiseSelection.expandMemberSelectionsOverLineWithTrimRange();
              }
            }
          }
          ref4 = _this.swrap.getSelections(_this.editor);
          results = [];
          for (k = 0, len2 = ref4.length; k < len2; k++) {
            $selection = ref4[k];
            results.push($selection.setBufferPositionTo(_this.which));
          }
          return results;
        };
      })(this));
      return InsertByTarget.__super__.execute.apply(this, arguments);
    };

    return InsertByTarget;

  })(ActivateInsertMode);

  InsertAtStartOfTarget = (function(superClass) {
    extend(InsertAtStartOfTarget, superClass);

    function InsertAtStartOfTarget() {
      return InsertAtStartOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfTarget.extend();

    InsertAtStartOfTarget.prototype.which = 'start';

    return InsertAtStartOfTarget;

  })(InsertByTarget);

  InsertAtEndOfTarget = (function(superClass) {
    extend(InsertAtEndOfTarget, superClass);

    function InsertAtEndOfTarget() {
      return InsertAtEndOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfTarget.extend();

    InsertAtEndOfTarget.prototype.which = 'end';

    return InsertAtEndOfTarget;

  })(InsertByTarget);

  InsertAtHeadOfTarget = (function(superClass) {
    extend(InsertAtHeadOfTarget, superClass);

    function InsertAtHeadOfTarget() {
      return InsertAtHeadOfTarget.__super__.constructor.apply(this, arguments);
    }

    InsertAtHeadOfTarget.extend();

    InsertAtHeadOfTarget.prototype.which = 'head';

    return InsertAtHeadOfTarget;

  })(InsertByTarget);

  InsertAtStartOfOccurrence = (function(superClass) {
    extend(InsertAtStartOfOccurrence, superClass);

    function InsertAtStartOfOccurrence() {
      return InsertAtStartOfOccurrence.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfOccurrence.extend();

    InsertAtStartOfOccurrence.prototype.which = 'start';

    InsertAtStartOfOccurrence.prototype.occurrence = true;

    return InsertAtStartOfOccurrence;

  })(InsertByTarget);

  InsertAtEndOfOccurrence = (function(superClass) {
    extend(InsertAtEndOfOccurrence, superClass);

    function InsertAtEndOfOccurrence() {
      return InsertAtEndOfOccurrence.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfOccurrence.extend();

    InsertAtEndOfOccurrence.prototype.which = 'end';

    InsertAtEndOfOccurrence.prototype.occurrence = true;

    return InsertAtEndOfOccurrence;

  })(InsertByTarget);

  InsertAtStartOfSubwordOccurrence = (function(superClass) {
    extend(InsertAtStartOfSubwordOccurrence, superClass);

    function InsertAtStartOfSubwordOccurrence() {
      return InsertAtStartOfSubwordOccurrence.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfSubwordOccurrence.extend();

    InsertAtStartOfSubwordOccurrence.prototype.occurrenceType = 'subword';

    return InsertAtStartOfSubwordOccurrence;

  })(InsertAtStartOfOccurrence);

  InsertAtEndOfSubwordOccurrence = (function(superClass) {
    extend(InsertAtEndOfSubwordOccurrence, superClass);

    function InsertAtEndOfSubwordOccurrence() {
      return InsertAtEndOfSubwordOccurrence.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfSubwordOccurrence.extend();

    InsertAtEndOfSubwordOccurrence.prototype.occurrenceType = 'subword';

    return InsertAtEndOfSubwordOccurrence;

  })(InsertAtEndOfOccurrence);

  InsertAtStartOfSmartWord = (function(superClass) {
    extend(InsertAtStartOfSmartWord, superClass);

    function InsertAtStartOfSmartWord() {
      return InsertAtStartOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    InsertAtStartOfSmartWord.extend();

    InsertAtStartOfSmartWord.prototype.which = 'start';

    InsertAtStartOfSmartWord.prototype.target = "MoveToPreviousSmartWord";

    return InsertAtStartOfSmartWord;

  })(InsertByTarget);

  InsertAtEndOfSmartWord = (function(superClass) {
    extend(InsertAtEndOfSmartWord, superClass);

    function InsertAtEndOfSmartWord() {
      return InsertAtEndOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    InsertAtEndOfSmartWord.extend();

    InsertAtEndOfSmartWord.prototype.which = 'end';

    InsertAtEndOfSmartWord.prototype.target = "MoveToEndOfSmartWord";

    return InsertAtEndOfSmartWord;

  })(InsertByTarget);

  InsertAtPreviousFoldStart = (function(superClass) {
    extend(InsertAtPreviousFoldStart, superClass);

    function InsertAtPreviousFoldStart() {
      return InsertAtPreviousFoldStart.__super__.constructor.apply(this, arguments);
    }

    InsertAtPreviousFoldStart.extend();

    InsertAtPreviousFoldStart.description = "Move to previous fold start then enter insert-mode";

    InsertAtPreviousFoldStart.prototype.which = 'start';

    InsertAtPreviousFoldStart.prototype.target = 'MoveToPreviousFoldStart';

    return InsertAtPreviousFoldStart;

  })(InsertByTarget);

  InsertAtNextFoldStart = (function(superClass) {
    extend(InsertAtNextFoldStart, superClass);

    function InsertAtNextFoldStart() {
      return InsertAtNextFoldStart.__super__.constructor.apply(this, arguments);
    }

    InsertAtNextFoldStart.extend();

    InsertAtNextFoldStart.description = "Move to next fold start then enter insert-mode";

    InsertAtNextFoldStart.prototype.which = 'end';

    InsertAtNextFoldStart.prototype.target = 'MoveToNextFoldStart';

    return InsertAtNextFoldStart;

  })(InsertByTarget);

  Change = (function(superClass) {
    extend(Change, superClass);

    function Change() {
      return Change.__super__.constructor.apply(this, arguments);
    }

    Change.extend();

    Change.prototype.requireTarget = true;

    Change.prototype.trackChange = true;

    Change.prototype.supportInsertionCount = false;

    Change.prototype.mutateText = function() {
      var i, isLinewiseTarget, len, ref1, results, selection;
      isLinewiseTarget = this.swrap.detectWise(this.editor) === 'linewise';
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (!this.getConfig('dontUpdateRegisterOnChangeOrSubstitute')) {
          this.setTextToRegisterForSelection(selection);
        }
        if (isLinewiseTarget) {
          selection.insertText("\n", {
            autoIndent: true
          });
          results.push(selection.cursor.moveLeft());
        } else {
          results.push(selection.insertText('', {
            autoIndent: true
          }));
        }
      }
      return results;
    };

    return Change;

  })(ActivateInsertMode);

  ChangeOccurrence = (function(superClass) {
    extend(ChangeOccurrence, superClass);

    function ChangeOccurrence() {
      return ChangeOccurrence.__super__.constructor.apply(this, arguments);
    }

    ChangeOccurrence.extend();

    ChangeOccurrence.description = "Change all matching word within target range";

    ChangeOccurrence.prototype.occurrence = true;

    return ChangeOccurrence;

  })(Change);

  Substitute = (function(superClass) {
    extend(Substitute, superClass);

    function Substitute() {
      return Substitute.__super__.constructor.apply(this, arguments);
    }

    Substitute.extend();

    Substitute.prototype.target = 'MoveRight';

    return Substitute;

  })(Change);

  SubstituteLine = (function(superClass) {
    extend(SubstituteLine, superClass);

    function SubstituteLine() {
      return SubstituteLine.__super__.constructor.apply(this, arguments);
    }

    SubstituteLine.extend();

    SubstituteLine.prototype.wise = 'linewise';

    SubstituteLine.prototype.target = 'MoveToRelativeLine';

    return SubstituteLine;

  })(Change);

  ChangeLine = (function(superClass) {
    extend(ChangeLine, superClass);

    function ChangeLine() {
      return ChangeLine.__super__.constructor.apply(this, arguments);
    }

    ChangeLine.extend();

    return ChangeLine;

  })(SubstituteLine);

  ChangeToLastCharacterOfLine = (function(superClass) {
    extend(ChangeToLastCharacterOfLine, superClass);

    function ChangeToLastCharacterOfLine() {
      return ChangeToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    ChangeToLastCharacterOfLine.extend();

    ChangeToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    ChangeToLastCharacterOfLine.prototype.execute = function() {
      if (this.target.wise === 'blockwise') {
        this.onDidSelectTarget((function(_this) {
          return function() {
            var blockwiseSelection, i, len, ref1, results;
            ref1 = _this.getBlockwiseSelections();
            results = [];
            for (i = 0, len = ref1.length; i < len; i++) {
              blockwiseSelection = ref1[i];
              results.push(blockwiseSelection.extendMemberSelectionsToEndOfLine());
            }
            return results;
          };
        })(this));
      }
      return ChangeToLastCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return ChangeToLastCharacterOfLine;

  })(Change);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRvci1pbnNlcnQuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpckJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSCxRQUFTLE9BQUEsQ0FBUSxNQUFSOztFQUVWLE1BTUksT0FBQSxDQUFRLFNBQVIsQ0FOSixFQUNFLG1DQURGLEVBRUUscUNBRkYsRUFHRSw2QkFIRixFQUlFLDJCQUpGLEVBS0U7O0VBRUYsUUFBQSxHQUFXLE9BQUEsQ0FBUSxRQUFSLENBQWlCLENBQUMsUUFBbEIsQ0FBMkIsVUFBM0I7O0VBTUw7Ozs7Ozs7SUFDSixrQkFBQyxDQUFBLE1BQUQsQ0FBQTs7aUNBQ0EsYUFBQSxHQUFlOztpQ0FDZixXQUFBLEdBQWE7O2lDQUNiLFlBQUEsR0FBYzs7aUNBQ2QscUJBQUEsR0FBdUI7O2lDQUV2Qix5QkFBQSxHQUEyQixTQUFBO0FBQ3pCLFVBQUE7YUFBQSxVQUFBLEdBQWEsSUFBQyxDQUFBLFFBQVEsQ0FBQyxXQUFXLENBQUMseUJBQXRCLENBQWdELENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxHQUFEO0FBQzNELGNBQUE7VUFENkQsT0FBRDtVQUM1RCxJQUFjLElBQUEsS0FBUSxRQUF0QjtBQUFBLG1CQUFBOztVQUNBLFVBQVUsQ0FBQyxPQUFYLENBQUE7VUFFQSxLQUFDLENBQUEsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFmLENBQW1CLEdBQW5CLEVBQXdCLEtBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUF4QjtVQUNBLGVBQUEsR0FBa0I7VUFDbEIsSUFBRyxNQUFBLEdBQVMsS0FBQyxDQUFBLHdCQUFELENBQTBCLFFBQTFCLENBQVo7WUFDRSxLQUFDLENBQUEsVUFBRCxHQUFjO1lBQ2QsS0FBQyxDQUFB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R0FKRjs7QUFGRjs7SUFQVTs7OztLQU5POztFQXFCZjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGdCQUFDLENBQUEsV0FBRCxHQUFjOzsrQkFDZCxVQUFBLEdBQVk7Ozs7S0FIaUI7O0VBS3pCOzs7Ozs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBQTs7eUJBQ0EsTUFBQSxHQUFROzs7O0tBRmU7O0VBSW5COzs7Ozs7O0lBQ0osY0FBQyxDQUFBLE1BQUQsQ0FBQTs7NkJBQ0EsSUFBQSxHQUFNOzs2QkFDTixNQUFBLEdBQVE7Ozs7S0FIbUI7O0VBTXZCOzs7Ozs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBQTs7OztLQUR1Qjs7RUFHbkI7Ozs7Ozs7SUFDSiwyQkFBQyxDQUFBLE1BQUQsQ0FBQTs7MENBQ0EsTUFBQSxHQUFROzswQ0FFUixPQUFBLEdBQVMsU0FBQTtNQUNQLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxJQUFSLEtBQWdCLFdBQW5CO1FBQ0UsSUFBQyxDQUFBLGlCQUFELENBQW1CLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7QUFDakIsZ0JBQUE7QUFBQTtBQUFBO2lCQUFBLHNDQUFBOzsyQkFDRSxrQkFBa0IsQ0FBQyxpQ0FBbkIsQ0FBQTtBQURGOztVQURpQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBbkIsRUFERjs7YUFJQSwwREFBQSxTQUFBO0lBTE87Ozs7S0FKK0I7QUFyVzFDIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntSYW5nZX0gPSByZXF1aXJlICdhdG9tJ1xuXG57XG4gIG1vdmVDdXJzb3JMZWZ0XG4gIG1vdmVDdXJzb3JSaWdodFxuICBsaW1pdE51bWJlclxuICBpc0VtcHR5Um93XG4gIHNldEJ1ZmZlclJvd1xufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5PcGVyYXRvciA9IHJlcXVpcmUoJy4vYmFzZScpLmdldENsYXNzKCdPcGVyYXRvcicpXG5cbiMgT3BlcmF0b3Igd2hpY2ggc3RhcnQgJ2luc2VydC1tb2RlJ1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtOT1RFXVxuIyBSdWxlOiBEb24ndCBtYWtlIGFueSB0ZXh0IG11dGF0aW9uIGJlZm9yZSBjYWxsaW5nIGBAc2VsZWN0VGFyZ2V0KClgLlxuY2xhc3MgQWN0aXZhdGVJbnNlcnRNb2RlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIHJlcXVpcmVUYXJnZXQ6IGZhbHNlXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICBmaW5hbFN1Ym1vZGU6IG51bGxcbiAgc3VwcG9ydEluc2VydGlvbkNvdW50OiB0cnVlXG5cbiAgb2JzZXJ2ZVdpbGxEZWFjdGl2YXRlTW9kZTogLT5cbiAgICBkaXNwb3NhYmxlID0gQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLnByZWVtcHRXaWxsRGVhY3RpdmF0ZU1vZGUgKHttb2RlfSkgPT5cbiAgICAgIHJldHVybiB1bmxlc3MgbW9kZSBpcyAnaW5zZXJ0J1xuICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKClcblxuICAgICAgQHZpbVN0YXRlLm1hcmsuc2V0KCdeJywgQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKSAjIExhc3QgaW5zZXJ0LW1vZGUgcG9zaXRpb25cbiAgICAgIHRleHRCeVVzZXJJbnB1dCA9ICcnXG4gICAgICBpZiBjaGFuZ2UgPSBAZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50KCdpbnNlcnQnKVxuICAgICAgICBAbGFzdENoYW5nZSA9IGNoYW5nZVxuICAgICAgICBAc2V0TWFya0ZvckNoYW5nZShuZXcgUmFuZ2UoY2hhbmdlLnN0YXJ0LCBjaGFuZ2Uuc3RhcnQudHJhdmVyc2UoY2hhbmdlLm5ld0V4dGVudCkpKVxuICAgICAgICB0ZXh0QnlVc2VySW5wdXQgPSBjaGFuZ2UubmV3VGV4dFxuICAgICAgQHZpbVN0YXRlLnJlZ2lzdGVyLnNldCgnLicsIHRleHQ6IHRleHRCeVVzZXJJbnB1dCkgIyBMYXN0IGluc2VydGVkIHRleHRcblxuICAgICAgXy50aW1lcyBAZ2V0SW5zZXJ0aW9uQ291bnQoKSwgPT5cbiAgICAgICAgdGV4dCA9IEB0ZXh0QnlPcGVyYXRvciArIHRleHRCeVVzZXJJbnB1dFxuICAgICAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dCwgYXV0b0luZGVudDogdHJ1ZSlcblxuICAgICAgIyBUaGlzIGN1cnNvciBzdGF0ZSBpcyByZXN0b3JlZCBvbiB1bmRvLlxuICAgICAgIyBTbyBjdXJzb3Igc3RhdGUgaGFzIHRvIGJlIHVwZGF0ZWQgYmVmb3JlIG5leHQgZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50KClcbiAgICAgIGlmIEBnZXRDb25maWcoJ2NsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlJylcbiAgICAgICAgQHZpbVN0YXRlLmNsZWFyU2VsZWN0aW9ucygpXG5cbiAgICAgICMgZ3JvdXBpbmcgY2hhbmdlcyBmb3IgdW5kbyBjaGVja3BvaW50IG5lZWQgdG8gY29tZSBsYXN0XG4gICAgICBpZiBAZ2V0Q29uZmlnKCdncm91cENoYW5nZXNXaGVuTGVhdmluZ0luc2VydE1vZGUnKVxuICAgICAgICBAZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50KCd1bmRvJylcblxuICAjIFdoZW4gZWFjaCBtdXRhaW9uJ3MgZXh0ZW50IGlzIG5vdCBpbnRlcnNlY3RpbmcsIG11aXRpcGxlIGNoYW5nZXMgYXJlIHJlY29yZGVkXG4gICMgZS5nXG4gICMgIC0gTXVsdGljdXJzb3JzIGVkaXRcbiAgIyAgLSBDdXJzb3IgbW92ZWQgaW4gaW5zZXJ0LW1vZGUoZS5nIGN0cmwtZiwgY3RybC1iKVxuICAjIEJ1dCBJIGRvbid0IGNhcmUgbXVsdGlwbGUgY2hhbmdlcyBqdXN0IGJlY2F1c2UgSSdtIGxhenkoc28gbm90IHBlcmZlY3QgaW1wbGVtZW50YXRpb24pLlxuICAjIEkgb25seSB0YWtlIGNhcmUgb2Ygb25lIGNoYW5nZSBoYXBwZW5lZCBhdCBlYXJsaWVzdCh0b3BDdXJzb3IncyBjaGFuZ2UpIHBvc2l0aW9uLlxuICAjIFRoYXRzJyB3aHkgSSBzYXZlIHRvcEN1cnNvcidzIHBvc2l0aW9uIHRvIEB0b3BDdXJzb3JQb3NpdGlvbkF0SW5zZXJ0aW9uU3RhcnQgdG8gY29tcGFyZSB0cmF2ZXJzYWwgdG8gZGVsZXRpb25TdGFydFxuICAjIFdoeSBJIHVzZSB0b3BDdXJzb3IncyBjaGFuZ2U/IEp1c3QgYmVjYXVzZSBpdCdzIGVhc3kgdG8gdXNlIGZpcnN0IGNoYW5nZSByZXR1cm5lZCBieSBnZXRDaGFuZ2VTaW5jZUNoZWNrcG9pbnQoKS5cbiAgZ2V0Q2hhbmdlU2luY2VDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBjaGVja3BvaW50ID0gQGdldEJ1ZmZlckNoZWNrcG9pbnQocHVycG9zZSlcbiAgICBAZWRpdG9yLmJ1ZmZlci5nZXRDaGFuZ2VzU2luY2VDaGVja3BvaW50KGNoZWNrcG9pbnQpWzBdXG5cbiAgIyBbQlVHLUJVVC1PS10gUmVwbGF5aW5nIHRleHQtZGVsZXRpb24tb3BlcmF0aW9uIGlzIG5vdCBjb21wYXRpYmxlIHRvIHB1cmUgVmltLlxuICAjIFB1cmUgVmltIHJlY29yZCBhbGwgb3BlcmF0aW9uIGluIGluc2VydC1tb2RlIGFzIGtleXN0cm9rZSBsZXZlbCBhbmQgY2FuIGRpc3Rpbmd1aXNoXG4gICMgY2hhcmFjdGVyIGRlbGV0ZWQgYnkgYERlbGV0ZWAgb3IgYnkgYGN0cmwtdWAuXG4gICMgQnV0IEkgY2FuIG5vdCBhbmQgZG9uJ3QgdHJ5aW5nIHRvIG1pbmljIHRoaXMgbGV2ZWwgb2YgY29tcGF0aWJpbGl0eS5cbiAgIyBTbyBiYXNpY2FsbHkgZGVsZXRpb24tZG9uZS1pbi1vbmUgaXMgZXhwZWN0ZWQgdG8gd29yayB3ZWxsLlxuICByZXBsYXlMYXN0Q2hhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGlmIEBsYXN0Q2hhbmdlP1xuICAgICAge3N0YXJ0LCBuZXdFeHRlbnQsIG9sZEV4dGVudCwgbmV3VGV4dH0gPSBAbGFzdENoYW5nZVxuICAgICAgdW5sZXNzIG9sZEV4dGVudC5pc1plcm8oKVxuICAgICAgICB0cmF2ZXJzYWxUb1N0YXJ0T2ZEZWxldGUgPSBzdGFydC50cmF2ZXJzYWxGcm9tKEB0b3BDdXJzb3JQb3NpdGlvbkF0SW5zZXJ0aW9uU3RhcnQpXG4gICAgICAgIGRlbGV0aW9uU3RhcnQgPSBzZWxlY3Rpb24uY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkudHJhdmVyc2UodHJhdmVyc2FsVG9TdGFydE9mRGVsZXRlKVxuICAgICAgICBkZWxldGlvbkVuZCA9IGRlbGV0aW9uU3RhcnQudHJhdmVyc2Uob2xkRXh0ZW50KVxuICAgICAgICBzZWxlY3Rpb24uc2V0QnVmZmVyUmFuZ2UoW2RlbGV0aW9uU3RhcnQsIGRlbGV0aW9uRW5kXSlcbiAgICBlbHNlXG4gICAgICBuZXdUZXh0ID0gJydcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dChuZXdUZXh0LCBhdXRvSW5kZW50OiB0cnVlKVxuXG4gICMgY2FsbGVkIHdoZW4gcmVwZWF0ZWRcbiAgIyBbRklYTUVdIHRvIHVzZSByZXBsYXlMYXN0Q2hhbmdlIGluIHJlcGVhdEluc2VydCBvdmVycmlkaW5nIHN1YmNsYXNzcy5cbiAgcmVwZWF0SW5zZXJ0OiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIEByZXBsYXlMYXN0Q2hhbmdlKHNlbGVjdGlvbilcblxuICBnZXRJbnNlcnRpb25Db3VudDogLT5cbiAgICBAaW5zZXJ0aW9uQ291bnQgPz0gaWYgQHN1cHBvcnRJbnNlcnRpb25Db3VudCB0aGVuIEBnZXRDb3VudCgtMSkgZWxzZSAwXG4gICAgIyBBdm9pZCBmcmVlemluZyBieSBhY2NjaWRlbnRhbCBiaWcgY291bnQoZS5nLiBgNTU1NTU1NTU1NTU1NWlgKSwgU2VlICM1NjAsICM1OTZcbiAgICBsaW1pdE51bWJlcihAaW5zZXJ0aW9uQ291bnQsIG1heDogMTAwKVxuXG4gIGludmVzdGlnYXRlQ3Vyc29yUG9zaXRpb246IC0+XG4gICAgW2MxLCBjMiwgYzNdID0gW11cbiAgICBjMSA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuXG4gICAgQG9uV2lsbEFjdGl2YXRlTW9kZSAoe21vZGUsIHN1Ym1vZGV9KSA9PlxuICAgICAgYzIgPSBAZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGNvbnNvbGUuaW5mbyAnZGlmZiBjMSwgYzInLCBjMS50b1N0cmluZygpLCBjMi50b1N0cmluZygpIHVubGVzcyBjMS5pc0VxdWFsKGMyKVxuXG4gICAgQG9uRGlkQWN0aXZhdGVNb2RlICh7bW9kZSwgc3VibW9kZX0pID0+XG4gICAgICBjMyA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgICAgaWYgYzIucm93IGlzbnQgYzMucm93XG4gICAgICAgIGNvbnNvbGUud2FybiAnZGZmIGMyLCBjMycsIGMyLnRvU3RyaW5nKCksIGMzLnRvU3RyaW5nKClcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEByZXBlYXRlZFxuICAgICAgQGZsYXNoVGFyZ2V0ID0gQHRyYWNrQ2hhbmdlID0gdHJ1ZVxuXG4gICAgICBAc3RhcnRNdXRhdGlvbiA9PlxuICAgICAgICBAc2VsZWN0VGFyZ2V0KCkgaWYgQHRhcmdldD9cbiAgICAgICAgQG11dGF0ZVRleHQ/KClcbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgICAgIEByZXBlYXRJbnNlcnQoc2VsZWN0aW9uLCBAbGFzdENoYW5nZT8ubmV3VGV4dCA/ICcnKVxuICAgICAgICAgIG1vdmVDdXJzb3JMZWZ0KHNlbGVjdGlvbi5jdXJzb3IpXG4gICAgICAgIEBtdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludCgnZGlkLWZpbmlzaCcpXG5cbiAgICAgIGlmIEBnZXRDb25maWcoJ2NsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlJylcbiAgICAgICAgQHZpbVN0YXRlLmNsZWFyU2VsZWN0aW9ucygpXG5cbiAgICBlbHNlXG4gICAgICBAaW52ZXN0aWdhdGVDdXJzb3JQb3NpdGlvbigpIGlmIEBnZXRDb25maWcoXCJkZWJ1Z1wiKVxuICAgICAgXG4gICAgICBAbm9ybWFsaXplU2VsZWN0aW9uc0lmTmVjZXNzYXJ5KClcbiAgICAgIEBjcmVhdGVCdWZmZXJDaGVja3BvaW50KCd1bmRvJylcbiAgICAgIEBzZWxlY3RUYXJnZXQoKSBpZiBAdGFyZ2V0P1xuICAgICAgQG9ic2VydmVXaWxsRGVhY3RpdmF0ZU1vZGUoKVxuXG4gICAgICBAbXV0YXRlVGV4dD8oKVxuXG4gICAgICBpZiBAZ2V0SW5zZXJ0aW9uQ291bnQoKSA+IDBcbiAgICAgICAgQHRleHRCeU9wZXJhdG9yID0gQGdldENoYW5nZVNpbmNlQ2hlY2twb2ludCgndW5kbycpPy5uZXdUZXh0ID8gJydcblxuICAgICAgQGNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQoJ2luc2VydCcpXG4gICAgICB0b3BDdXJzb3IgPSBAZWRpdG9yLmdldEN1cnNvcnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpWzBdXG4gICAgICBAdG9wQ3Vyc29yUG9zaXRpb25BdEluc2VydGlvblN0YXJ0ID0gdG9wQ3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgICAgIyBTa2lwIG5vcm1hbGl6YXRpb24gb2YgYmxvY2t3aXNlU2VsZWN0aW9uLlxuICAgICAgIyBTaW5jZSB3YW50IHRvIGtlZXAgbXVsdGktY3Vyc29yIGFuZCBpdCdzIHBvc2l0aW9uIGluIHdoZW4gc2hpZnQgdG8gaW5zZXJ0LW1vZGUuXG4gICAgICBmb3IgYmxvY2t3aXNlU2VsZWN0aW9uIGluIEBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zKClcbiAgICAgICAgYmxvY2t3aXNlU2VsZWN0aW9uLnNraXBOb3JtYWxpemF0aW9uKClcbiAgICAgIEBhY3RpdmF0ZU1vZGUoJ2luc2VydCcsIEBmaW5hbFN1Ym1vZGUpXG5cbmNsYXNzIEFjdGl2YXRlUmVwbGFjZU1vZGUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGZpbmFsU3VibW9kZTogJ3JlcGxhY2UnXG5cbiAgcmVwZWF0SW5zZXJ0OiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIGZvciBjaGFyIGluIHRleHQgd2hlbiAoY2hhciBpc250IFwiXFxuXCIpXG4gICAgICBicmVhayBpZiBzZWxlY3Rpb24uY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgICAgc2VsZWN0aW9uLnNlbGVjdFJpZ2h0KClcbiAgICBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0LCBhdXRvSW5kZW50OiBmYWxzZSlcblxuY2xhc3MgSW5zZXJ0QWZ0ZXIgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvcikgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgIHN1cGVyXG5cbiMga2V5OiAnZyBJJyBpbiBhbGwgbW9kZVxuY2xhc3MgSW5zZXJ0QXRCZWdpbm5pbmdPZkxpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCcgYW5kIEBzdWJtb2RlIGluIFsnY2hhcmFjdGVyd2lzZScsICdsaW5ld2lzZSddXG4gICAgICBAZWRpdG9yLnNwbGl0U2VsZWN0aW9uc0ludG9MaW5lcygpXG4gICAgQGVkaXRvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgIHN1cGVyXG5cbiMga2V5OiBub3JtYWwgJ0EnXG5jbGFzcyBJbnNlcnRBZnRlckVuZE9mTGluZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBAZWRpdG9yLm1vdmVUb0VuZE9mTGluZSgpXG4gICAgc3VwZXJcblxuIyBrZXk6IG5vcm1hbCAnSSdcbmNsYXNzIEluc2VydEF0Rmlyc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBBY3RpdmF0ZUluc2VydE1vZGVcbiAgQGV4dGVuZCgpXG4gIGV4ZWN1dGU6IC0+XG4gICAgQGVkaXRvci5tb3ZlVG9CZWdpbm5pbmdPZkxpbmUoKVxuICAgIEBlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUoKVxuICAgIHN1cGVyXG5cbmNsYXNzIEluc2VydEF0TGFzdEluc2VydCBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBpZiAocG9pbnQgPSBAdmltU3RhdGUubWFyay5nZXQoJ14nKSlcbiAgICAgIEBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgICBAZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oe2NlbnRlcjogdHJ1ZX0pXG4gICAgc3VwZXJcblxuY2xhc3MgSW5zZXJ0QWJvdmVXaXRoTmV3bGluZSBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKClcblxuICBpbml0aWFsaXplOiAtPlxuICAgIGlmIEBnZXRDb25maWcoJ2dyb3VwQ2hhbmdlc1doZW5MZWF2aW5nSW5zZXJ0TW9kZScpXG4gICAgICBAb3JpZ2luYWxDdXJzb3JQb3NpdGlvbk1hcmtlciA9IEBlZGl0b3IubWFya0J1ZmZlclBvc2l0aW9uKEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcblxuICAjIFRoaXMgaXMgZm9yIGBvYCBhbmQgYE9gIG9wZXJhdG9yLlxuICAjIE9uIHVuZG8vcmVkbyBwdXQgY3Vyc29yIGF0IG9yaWdpbmFsIHBvaW50IHdoZXJlIHVzZXIgdHlwZSBgb2Agb3IgYE9gLlxuICBncm91cENoYW5nZXNTaW5jZUJ1ZmZlckNoZWNrcG9pbnQ6IC0+XG4gICAgbGFzdEN1cnNvciA9IEBlZGl0b3IuZ2V0TGFzdEN1cnNvcigpXG4gICAgY3Vyc29yUG9zaXRpb24gPSBsYXN0Q3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBsYXN0Q3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKEBvcmlnaW5hbEN1cnNvclBvc2l0aW9uTWFya2VyLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpKVxuICAgIEBvcmlnaW5hbEN1cnNvclBvc2l0aW9uTWFya2VyLmRlc3Ryb3koKVxuXG4gICAgc3VwZXJcblxuICAgIGxhc3RDdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oY3Vyc29yUG9zaXRpb24pXG5cbiAgYXV0b0luZGVudEVtcHR5Um93czogLT5cbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICByb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICAgIEBlZGl0b3IuYXV0b0luZGVudEJ1ZmZlclJvdyhyb3cpIGlmIGlzRW1wdHlSb3coQGVkaXRvciwgcm93KVxuXG4gIG11dGF0ZVRleHQ6IC0+XG4gICAgQGVkaXRvci5pbnNlcnROZXdsaW5lQWJvdmUoKVxuICAgIEBhdXRvSW5kZW50RW1wdHlSb3dzKCkgaWYgQGVkaXRvci5hdXRvSW5kZW50XG5cbiAgcmVwZWF0SW5zZXJ0OiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KHRleHQudHJpbUxlZnQoKSwgYXV0b0luZGVudDogdHJ1ZSlcblxuY2xhc3MgSW5zZXJ0QmVsb3dXaXRoTmV3bGluZSBleHRlbmRzIEluc2VydEFib3ZlV2l0aE5ld2xpbmVcbiAgQGV4dGVuZCgpXG4gIG11dGF0ZVRleHQ6IC0+XG4gICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIGN1cnNvclJvdyA9IGN1cnNvci5nZXRCdWZmZXJSb3coKVxuICAgICAgc2V0QnVmZmVyUm93KGN1cnNvciwgQGdldEZvbGRFbmRSb3dGb3JSb3coY3Vyc29yUm93KSlcblxuICAgIEBlZGl0b3IuaW5zZXJ0TmV3bGluZUJlbG93KClcbiAgICBAYXV0b0luZGVudEVtcHR5Um93cygpIGlmIEBlZGl0b3IuYXV0b0luZGVudFxuXG4jIEFkdmFuY2VkIEluc2VydGlvblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBJbnNlcnRCeVRhcmdldCBleHRlbmRzIEFjdGl2YXRlSW5zZXJ0TW9kZVxuICBAZXh0ZW5kKGZhbHNlKVxuICByZXF1aXJlVGFyZ2V0OiB0cnVlXG4gIHdoaWNoOiBudWxsICMgb25lIG9mIFsnc3RhcnQnLCAnZW5kJywgJ2hlYWQnLCAndGFpbCddXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICAjIEhBQ0tcbiAgICAjIFdoZW4gZyBpIGlzIG1hcHBlZCB0byBgaW5zZXJ0LWF0LXN0YXJ0LW9mLXRhcmdldGAuXG4gICAgIyBgZyBpIDMgbGAgc3RhcnQgaW5zZXJ0IGF0IDMgY29sdW1uIHJpZ2h0IHBvc2l0aW9uLlxuICAgICMgSW4gdGhpcyBjYXNlLCB3ZSBkb24ndCB3YW50IHJlcGVhdCBpbnNlcnRpb24gMyB0aW1lcy5cbiAgICAjIFRoaXMgQGdldENvdW50KCkgY2FsbCBjYWNoZSBudW1iZXIgYXQgdGhlIHRpbWluZyBCRUZPUkUgJzMnIGlzIHNwZWNpZmllZC5cbiAgICBAZ2V0Q291bnQoKVxuICAgIHN1cGVyXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBAb25EaWRTZWxlY3RUYXJnZXQgPT5cbiAgICAgICMgSW4gdkMvdkwsIHdoZW4gb2NjdXJyZW5jZSBtYXJrZXIgd2FzIE5PVCBzZWxlY3RlZCxcbiAgICAgICMgaXQgYmVoYXZlJ3MgdmVyeSBzcGVjaWFsbHlcbiAgICAgICMgdkM6IGBJYCBhbmQgYEFgIGJlaGF2ZXMgYXMgc2hvZnQgaGFuZCBvZiBgY3RybC12IElgIGFuZCBgY3RybC12IEFgLlxuICAgICAgIyB2TDogYElgIGFuZCBgQWAgcGxhY2UgY3Vyc29ycyBhdCBlYWNoIHNlbGVjdGVkIGxpbmVzIG9mIHN0YXJ0KCBvciBlbmQgKSBvZiBub24td2hpdGUtc3BhY2UgY2hhci5cbiAgICAgIGlmIG5vdCBAb2NjdXJyZW5jZVNlbGVjdGVkIGFuZCBAbW9kZSBpcyAndmlzdWFsJyBhbmQgQHN1Ym1vZGUgaW4gWydjaGFyYWN0ZXJ3aXNlJywgJ2xpbmV3aXNlJ11cbiAgICAgICAgZm9yICRzZWxlY3Rpb24gaW4gQHN3cmFwLmdldFNlbGVjdGlvbnMoQGVkaXRvcilcbiAgICAgICAgICAkc2VsZWN0aW9uLm5vcm1hbGl6ZSgpXG4gICAgICAgICAgJHNlbGVjdGlvbi5hcHBseVdpc2UoJ2Jsb2Nrd2lzZScpXG5cbiAgICAgICAgaWYgQHN1Ym1vZGUgaXMgJ2xpbmV3aXNlJ1xuICAgICAgICAgIGZvciBibG9ja3dpc2VTZWxlY3Rpb24gaW4gQGdldEJsb2Nrd2lzZVNlbGVjdGlvbnMoKVxuICAgICAgICAgICAgYmxvY2t3aXNlU2VsZWN0aW9uLmV4cGFuZE1lbWJlclNlbGVjdGlvbnNPdmVyTGluZVdpdGhUcmltUmFuZ2UoKVxuXG4gICAgICBmb3IgJHNlbGVjdGlvbiBpbiBAc3dyYXAuZ2V0U2VsZWN0aW9ucyhAZWRpdG9yKVxuICAgICAgICAkc2VsZWN0aW9uLnNldEJ1ZmZlclBvc2l0aW9uVG8oQHdoaWNoKVxuICAgIHN1cGVyXG5cbiMga2V5OiAnSScsIFVzZWQgaW4gJ3Zpc3VhbC1tb2RlLmNoYXJhY3Rlcndpc2UnLCB2aXN1YWwtbW9kZS5ibG9ja3dpc2VcbmNsYXNzIEluc2VydEF0U3RhcnRPZlRhcmdldCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ3N0YXJ0J1xuXG4jIGtleTogJ0EnLCBVc2VkIGluICd2aXN1YWwtbW9kZS5jaGFyYWN0ZXJ3aXNlJywgJ3Zpc3VhbC1tb2RlLmJsb2Nrd2lzZSdcbmNsYXNzIEluc2VydEF0RW5kT2ZUYXJnZXQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldFxuICBAZXh0ZW5kKClcbiAgd2hpY2g6ICdlbmQnXG5cbmNsYXNzIEluc2VydEF0SGVhZE9mVGFyZ2V0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAnaGVhZCdcblxuY2xhc3MgSW5zZXJ0QXRTdGFydE9mT2NjdXJyZW5jZSBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ3N0YXJ0J1xuICBvY2N1cnJlbmNlOiB0cnVlXG5cbmNsYXNzIEluc2VydEF0RW5kT2ZPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiAnZW5kJ1xuICBvY2N1cnJlbmNlOiB0cnVlXG5cbmNsYXNzIEluc2VydEF0U3RhcnRPZlN1YndvcmRPY2N1cnJlbmNlIGV4dGVuZHMgSW5zZXJ0QXRTdGFydE9mT2NjdXJyZW5jZVxuICBAZXh0ZW5kKClcbiAgb2NjdXJyZW5jZVR5cGU6ICdzdWJ3b3JkJ1xuXG5jbGFzcyBJbnNlcnRBdEVuZE9mU3Vid29yZE9jY3VycmVuY2UgZXh0ZW5kcyBJbnNlcnRBdEVuZE9mT2NjdXJyZW5jZVxuICBAZXh0ZW5kKClcbiAgb2NjdXJyZW5jZVR5cGU6ICdzdWJ3b3JkJ1xuXG5jbGFzcyBJbnNlcnRBdFN0YXJ0T2ZTbWFydFdvcmQgZXh0ZW5kcyBJbnNlcnRCeVRhcmdldFxuICBAZXh0ZW5kKClcbiAgd2hpY2g6ICdzdGFydCdcbiAgdGFyZ2V0OiBcIk1vdmVUb1ByZXZpb3VzU21hcnRXb3JkXCJcblxuY2xhc3MgSW5zZXJ0QXRFbmRPZlNtYXJ0V29yZCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICB3aGljaDogJ2VuZCdcbiAgdGFyZ2V0OiBcIk1vdmVUb0VuZE9mU21hcnRXb3JkXCJcblxuY2xhc3MgSW5zZXJ0QXRQcmV2aW91c0ZvbGRTdGFydCBleHRlbmRzIEluc2VydEJ5VGFyZ2V0XG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmb2xkIHN0YXJ0IHRoZW4gZW50ZXIgaW5zZXJ0LW1vZGVcIlxuICB3aGljaDogJ3N0YXJ0J1xuICB0YXJnZXQ6ICdNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydCdcblxuY2xhc3MgSW5zZXJ0QXROZXh0Rm9sZFN0YXJ0IGV4dGVuZHMgSW5zZXJ0QnlUYXJnZXRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZm9sZCBzdGFydCB0aGVuIGVudGVyIGluc2VydC1tb2RlXCJcbiAgd2hpY2g6ICdlbmQnXG4gIHRhcmdldDogJ01vdmVUb05leHRGb2xkU3RhcnQnXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgQ2hhbmdlIGV4dGVuZHMgQWN0aXZhdGVJbnNlcnRNb2RlXG4gIEBleHRlbmQoKVxuICByZXF1aXJlVGFyZ2V0OiB0cnVlXG4gIHRyYWNrQ2hhbmdlOiB0cnVlXG4gIHN1cHBvcnRJbnNlcnRpb25Db3VudDogZmFsc2VcblxuICBtdXRhdGVUZXh0OiAtPlxuICAgICMgQWxsd2F5cyBkeW5hbWljYWxseSBkZXRlcm1pbmUgc2VsZWN0aW9uIHdpc2Ugd3Rob3V0IGNvbnN1bHRpbmcgdGFyZ2V0Lndpc2VcbiAgICAjIFJlYXNvbjogd2hlbiBgYyBpIHtgLCB3aXNlIGlzICdjaGFyYWN0ZXJ3aXNlJywgYnV0IGFjdHVhbGx5IHNlbGVjdGVkIHJhbmdlIGlzICdsaW5ld2lzZSdcbiAgICAjICAge1xuICAgICMgICAgIGFcbiAgICAjICAgfVxuICAgIGlzTGluZXdpc2VUYXJnZXQgPSBAc3dyYXAuZGV0ZWN0V2lzZShAZWRpdG9yKSBpcyAnbGluZXdpc2UnXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgQHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikgdW5sZXNzIEBnZXRDb25maWcoJ2RvbnRVcGRhdGVSZWdpc3Rlck9uQ2hhbmdlT3JTdWJzdGl0dXRlJylcbiAgICAgIGlmIGlzTGluZXdpc2VUYXJnZXRcbiAgICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQoXCJcXG5cIiwgYXV0b0luZGVudDogdHJ1ZSlcbiAgICAgICAgc2VsZWN0aW9uLmN1cnNvci5tb3ZlTGVmdCgpXG4gICAgICBlbHNlXG4gICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KCcnLCBhdXRvSW5kZW50OiB0cnVlKVxuXG5jbGFzcyBDaGFuZ2VPY2N1cnJlbmNlIGV4dGVuZHMgQ2hhbmdlXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiQ2hhbmdlIGFsbCBtYXRjaGluZyB3b3JkIHdpdGhpbiB0YXJnZXQgcmFuZ2VcIlxuICBvY2N1cnJlbmNlOiB0cnVlXG5cbmNsYXNzIFN1YnN0aXR1dGUgZXh0ZW5kcyBDaGFuZ2VcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogJ01vdmVSaWdodCdcblxuY2xhc3MgU3Vic3RpdHV0ZUxpbmUgZXh0ZW5kcyBDaGFuZ2VcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZScgIyBbRklYTUVdIHRvIHJlLW92ZXJyaWRlIHRhcmdldC53aXNlIGluIHZpc3VhbC1tb2RlXG4gIHRhcmdldDogJ01vdmVUb1JlbGF0aXZlTGluZSdcblxuIyBhbGlhc1xuY2xhc3MgQ2hhbmdlTGluZSBleHRlbmRzIFN1YnN0aXR1dGVMaW5lXG4gIEBleHRlbmQoKVxuXG5jbGFzcyBDaGFuZ2VUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBDaGFuZ2VcbiAgQGV4dGVuZCgpXG4gIHRhcmdldDogJ01vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUnXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBpZiBAdGFyZ2V0Lndpc2UgaXMgJ2Jsb2Nrd2lzZSdcbiAgICAgIEBvbkRpZFNlbGVjdFRhcmdldCA9PlxuICAgICAgICBmb3IgYmxvY2t3aXNlU2VsZWN0aW9uIGluIEBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zKClcbiAgICAgICAgICBibG9ja3dpc2VTZWxlY3Rpb24uZXh0ZW5kTWVtYmVyU2VsZWN0aW9uc1RvRW5kT2ZMaW5lKClcbiAgICBzdXBlclxuIl19
