(function() {
  var Base, CurrentSelection, Find, FindBackwards, Motion, MoveDown, MoveDownScreen, MoveDownToEdge, MoveDownWrap, MoveLeft, MoveRight, MoveRightBufferColumn, MoveToBeginningOfLine, MoveToBeginningOfScreenLine, MoveToBottomOfScreen, MoveToColumn, MoveToEndOfAlphanumericWord, MoveToEndOfSmartWord, MoveToEndOfSubword, MoveToEndOfWholeWord, MoveToEndOfWord, MoveToFirstCharacterOfLine, MoveToFirstCharacterOfLineAndDown, MoveToFirstCharacterOfLineDown, MoveToFirstCharacterOfLineUp, MoveToFirstCharacterOfScreenLine, MoveToFirstLine, MoveToLastCharacterOfLine, MoveToLastCharacterOfScreenLine, MoveToLastLine, MoveToLastNonblankCharacterOfLineAndDown, MoveToLineByPercent, MoveToMark, MoveToMarkLine, MoveToMiddleOfScreen, MoveToNextAlphanumericWord, MoveToNextFoldEnd, MoveToNextFoldStart, MoveToNextFoldStartWithSameIndent, MoveToNextFunction, MoveToNextNumber, MoveToNextOccurrence, MoveToNextParagraph, MoveToNextSentence, MoveToNextSentenceSkipBlankRow, MoveToNextSmartWord, MoveToNextString, MoveToNextSubword, MoveToNextWholeWord, MoveToNextWord, MoveToPair, MoveToPositionByScope, MoveToPreviousAlphanumericWord, MoveToPreviousEndOfWholeWord, MoveToPreviousEndOfWord, MoveToPreviousFoldEnd, MoveToPreviousFoldStart, MoveToPreviousFoldStartWithSameIndent, MoveToPreviousFunction, MoveToPreviousNumber, MoveToPreviousOccurrence, MoveToPreviousParagraph, MoveToPreviousSentence, MoveToPreviousSentenceSkipBlankRow, MoveToPreviousSmartWord, MoveToPreviousString, MoveToPreviousSubword, MoveToPreviousWholeWord, MoveToPreviousWord, MoveToRelativeLine, MoveToRelativeLineMinimumOne, MoveToScreenColumn, MoveToTopOfScreen, MoveUp, MoveUpScreen, MoveUpToEdge, MoveUpWrap, Point, Range, Scroll, ScrollFullScreenDown, ScrollFullScreenUp, ScrollHalfScreenDown, ScrollHalfScreenUp, Till, TillBackwards, _, detectScopeStartPositionForScope, findRangeInBufferRow, getBufferRows, getCodeFoldRowRanges, getEndOfLineForBufferRow, getFirstVisibleScreenRow, getIndex, getLargestFoldRangeContainsBufferRow, getLastVisibleScreenRow, getTextInScreenRange, getValidVimBufferRow, getValidVimScreenRow, isEmptyRow, isIncludeFunctionScopeForRow, limitNumber, moveCursorDownScreen, moveCursorLeft, moveCursorRight, moveCursorToFirstCharacterAtRow, moveCursorToNextNonWhitespace, moveCursorUpScreen, pointIsAtEndOfLineAtNonEmptyRow, pointIsAtVimEndOfFile, pointIsOnWhiteSpace, ref, ref1, saveEditorState, setBufferColumn, setBufferRow, smartScrollToBufferPosition, sortRanges,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  ref1 = require('./utils'), moveCursorLeft = ref1.moveCursorLeft, moveCursorRight = ref1.moveCursorRight, moveCursorUpScreen = ref1.moveCursorUpScreen, moveCursorDownScreen = ref1.moveCursorDownScreen, pointIsAtVimEndOfFile = ref1.pointIsAtVimEndOfFile, getFirstVisibleScreenRow = ref1.getFirstVisibleScreenRow, getLastVisibleScreenRow = ref1.getLastVisibleScreenRow, getValidVimScreenRow = ref1.getValidVimScreenRow, getValidVimBufferRow = ref1.getValidVimBufferRow, moveCursorToFirstCharacterAtRow = ref1.moveCursorToFirstCharacterAtRow, sortRanges = ref1.sortRanges, pointIsOnWhiteSpace = ref1.pointIsOnWhiteSpace, moveCursorToNextNonWhitespace = ref1.moveCursorToNextNonWhitespace, isEmptyRow = ref1.isEmptyRow, getCodeFoldRowRanges = ref1.getCodeFoldRowRanges, getLargestFoldRangeContainsBufferRow = ref1.getLargestFoldRangeContainsBufferRow, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, detectScopeStartPositionForScope = ref1.detectScopeStartPositionForScope, getBufferRows = ref1.getBufferRows, getTextInScreenRange = ref1.getTextInScreenRange, setBufferRow = ref1.setBufferRow, setBufferColumn = ref1.setBufferColumn, limitNumber = ref1.limitNumber, getIndex = ref1.getIndex, smartScrollToBufferPosition = ref1.smartScrollToBufferPosition, pointIsAtEndOfLineAtNonEmptyRow = ref1.pointIsAtEndOfLineAtNonEmptyRow, getEndOfLineForBufferRow = ref1.getEndOfLineForBufferRow, findRangeInBufferRow = ref1.findRangeInBufferRow, saveEditorState = ref1.saveEditorState;

  Base = require('./base');

  Motion = (function(superClass) {
    extend(Motion, superClass);

    Motion.extend(false);

    Motion.operationKind = 'motion';

    Motion.prototype.inclusive = false;

    Motion.prototype.wise = 'characterwise';

    Motion.prototype.jump = false;

    Motion.prototype.verticalMotion = false;

    Motion.prototype.moveSucceeded = null;

    Motion.prototype.moveSuccessOnLinewise = false;

    function Motion() {
      Motion.__super__.constructor.apply(this, arguments);
      if (this.mode === 'visual') {
        this.wise = this.submode;
      }
      this.initialize();
    }

    Motion.prototype.isLinewise = function() {
      return this.wise === 'linewise';
    };

    Motion.prototype.isBlockwise = function() {
      return this.wise === 'blockwise';
    };

    Motion.prototype.forceWise = function(wise) {
      if (wise === 'characterwise') {
        if (this.wise === 'linewise') {
          this.inclusive = false;
        } else {
          this.inclusive = !this.inclusive;
        }
      }
      return this.wise = wise;
    };

    Motion.prototype.setBufferPositionSafely = function(cursor, point) {
      if (point != null) {
        return cursor.setBufferPosition(point);
      }
    };

    Motion.prototype.setScreenPositionSafely = function(cursor, point) {
      if (point != null) {
        return cursor.setScreenPosition(point);
      }
    };

    Motion.prototype.moveWithSaveJump = function(cursor) {
      var cursorPosition;
      if (cursor.isLastCursor() && this.jump) {
        cursorPosition = cursor.getBufferPosition();
      }
      this.moveCursor(cursor);
      if ((cursorPosition != null) && !cursorPosition.isEqual(cursor.getBufferPosition())) {
        this.vimState.mark.set('`', cursorPosition);
        return this.vimState.mark.set("'", cursorPosition);
      }
    };

    Motion.prototype.execute = function() {
      var cursor, j, len, ref2;
      if (this.operator != null) {
        this.select();
      } else {
        ref2 = this.editor.getCursors();
        for (j = 0, len = ref2.length; j < len; j++) {
          cursor = ref2[j];
          this.moveWithSaveJump(cursor);
        }
      }
      this.editor.mergeCursors();
      return this.editor.mergeIntersectingSelections();
    };

    Motion.prototype.select = function() {
      var $selection, isOrWasVisual, j, len, ref2, ref3, selection, succeeded;
      isOrWasVisual = this.mode === 'visual' || this.is('CurrentSelection');
      ref2 = this.editor.getSelections();
      for (j = 0, len = ref2.length; j < len; j++) {
        selection = ref2[j];
        selection.modifySelection((function(_this) {
          return function() {
            return _this.moveWithSaveJump(selection.cursor);
          };
        })(this));
        succeeded = ((ref3 = this.moveSucceeded) != null ? ref3 : !selection.isEmpty()) || (this.moveSuccessOnLinewise && this.isLinewise());
        if (isOrWasVisual || (succeeded && (this.inclusive || this.isLinewise()))) {
          $selection = this.swrap(selection);
          $selection.saveProperties(true);
          $selection.applyWise(this.wise);
        }
      }
      if (this.wise === 'blockwise') {
        return this.vimState.getLastBlockwiseSelection().autoscroll();
      }
    };

    Motion.prototype.setCursorBufferRow = function(cursor, row, options) {
      if (this.verticalMotion && !this.getConfig('stayOnVerticalMotion')) {
        return cursor.setBufferPosition(this.getFirstCharacterPositionForBufferRow(row), options);
      } else {
        return setBufferRow(cursor, row, options);
      }
    };

    Motion.prototype.moveCursorCountTimes = function(cursor, fn) {
      var oldPosition;
      oldPosition = cursor.getBufferPosition();
      return this.countTimes(this.getCount(), function(state) {
        var newPosition;
        fn(state);
        if ((newPosition = cursor.getBufferPosition()).isEqual(oldPosition)) {
          state.stop();
        }
        return oldPosition = newPosition;
      });
    };

    Motion.prototype.isCaseSensitive = function(term) {
      if (this.getConfig("useSmartcaseFor" + this.caseSensitivityKind)) {
        return term.search(/[A-Z]/) !== -1;
      } else {
        return !this.getConfig("ignoreCaseFor" + this.caseSensitivityKind);
      }
    };

    return Motion;

  })(Base);

  CurrentSelection = (function(superClass) {
    extend(CurrentSelection, superClass);

    function CurrentSelection() {
      return CurrentSelection.__super__.constructor.apply(this, arguments);
    }

    CurrentSelection.extend(false);

    CurrentSelection.prototype.selectionExtent = null;

    CurrentSelection.prototype.blockwiseSelectionExtent = null;

    CurrentSelection.prototype.inclusive = true;

    CurrentSelection.prototype.initialize = function() {
      CurrentSelection.__super__.initialize.apply(this, arguments);
      return this.pointInfoByCursor = new Map;
    };

    CurrentSelection.prototype.moveCursor = function(cursor) {
      var point;
      if (this.mode === 'visual') {
        if (this.isBlockwise()) {
          return this.blockwiseSelectionExtent = this.swrap(cursor.selection).getBlockwiseSelectionExtent();
        } else {
          return this.selectionExtent = this.editor.getSelectedBufferRange().getExtent();
        }
      } else {
        point = cursor.getBufferPosition();
        if (this.blockwiseSelectionExtent != null) {
          return cursor.setBufferPosition(point.translate(this.blockwiseSelectionExtent));
        } else {
          return cursor.setBufferPosition(point.traverse(this.selectionExtent));
        }
      }
    };

    CurrentSelection.prototype.select = function() {
      var cursor, cursorPosition, j, k, len, len1, pointInfo, ref2, ref3, results, startOfSelection;
      if (this.mode === 'visual') {
        CurrentSelection.__super__.select.apply(this, arguments);
      } else {
        ref2 = this.editor.getCursors();
        for (j = 0, len = ref2.length; j < len; j++) {
          cursor = ref2[j];
          if (!(pointInfo = this.pointInfoByCursor.get(cursor))) {
            continue;
          }
          cursorPosition = pointInfo.cursorPosition, startOfSelection = pointInfo.startOfSelection;
          if (cursorPosition.isEqual(cursor.getBufferPosition())) {
            cursor.setBufferPosition(startOfSelection);
          }
        }
        CurrentSelection.__super__.select.apply(this, arguments);
      }
      ref3 = this.editor.getCursors();
      results = [];
      for (k = 0, len1 = ref3.length; k < len1; k++) {
        cursor = ref3[k];
        startOfSelection = cursor.selection.getBufferRange().start;
        results.push(this.onDidFinishOperation((function(_this) {
          return function() {
            cursorPosition = cursor.getBufferPosition();
            return _this.pointInfoByCursor.set(cursor, {
              startOfSelection: startOfSelection,
              cursorPosition: cursorPosition
            });
          };
        })(this)));
      }
      return results;
    };

    return CurrentSelection;

  })(Motion);

  MoveLeft = (function(superClass) {
    extend(MoveLeft, superClass);

    function MoveLeft() {
      return MoveLeft.__super__.constructor.apply(this, arguments);
    }

    MoveLeft.extend();

    MoveLeft.prototype.moveCursor = function(cursor) {
      var allowWrap;
      allowWrap = this.getConfig('wrapLeftRightMotion');
      return this.moveCursorCountTimes(cursor, function() {
        return moveCursorLeft(cursor, {
          allowWrap: allowWrap
        });
      });
    };

    return MoveLeft;

  })(Motion);

  MoveRight = (function(superClass) {
    extend(MoveRight, superClass);

    function MoveRight() {
      return MoveRight.__super__.constructor.apply(this, arguments);
    }

    MoveRight.extend();

    MoveRight.prototype.canWrapToNextLine = function(cursor) {
      if (this.isAsTargetExceptSelect() && !cursor.isAtEndOfLine()) {
        return false;
      } else {
        return this.getConfig('wrapLeftRightMotion');
      }
    };

    MoveRight.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          var allowWrap, cursorPosition;
          cursorPosition = cursor.getBufferPosition();
          _this.editor.unfoldBufferRow(cursorPosition.row);
          allowWrap = _this.canWrapToNextLine(cursor);
          moveCursorRight(cursor);
          if (cursor.isAtEndOfLine() && allowWrap && !pointIsAtVimEndOfFile(_this.editor, cursorPosition)) {
            return moveCursorRight(cursor, {
              allowWrap: allowWrap
            });
          }
        };
      })(this));
    };

    return MoveRight;

  })(Motion);

  MoveRightBufferColumn = (function(superClass) {
    extend(MoveRightBufferColumn, superClass);

    function MoveRightBufferColumn() {
      return MoveRightBufferColumn.__super__.constructor.apply(this, arguments);
    }

    MoveRightBufferColumn.extend(false);

    MoveRightBufferColumn.prototype.moveCursor = function(cursor) {
      return setBufferColumn(cursor, cursor.getBufferColumn() + this.getCount());
    };

    return MoveRightBufferColumn;

  })(Motion);

  MoveUp = (function(superClass) {
    extend(MoveUp, superClass);

    function MoveUp() {
      return MoveUp.__super__.constructor.apply(this, arguments);
    }

    MoveUp.extend();

    MoveUp.prototype.wise = 'linewise';

    MoveUp.prototype.wrap = false;

    MoveUp.prototype.getBufferRow = function(row) {
      row = this.getNextRow(row);
      if (this.editor.isFoldedAtBufferRow(row)) {
        return getLargestFoldRangeContainsBufferRow(this.editor, row).start.row;
      } else {
        return row;
      }
    };

    MoveUp.prototype.getNextRow = function(row) {
      var min;
      min = 0;
      if (this.wrap && row === min) {
        return this.getVimLastBufferRow();
      } else {
        return limitNumber(row - 1, {
          min: min
        });
      }
    };

    MoveUp.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          return setBufferRow(cursor, _this.getBufferRow(cursor.getBufferRow()));
        };
      })(this));
    };

    return MoveUp;

  })(Motion);

  MoveUpWrap = (function(superClass) {
    extend(MoveUpWrap, superClass);

    function MoveUpWrap() {
      return MoveUpWrap.__super__.constructor.apply(this, arguments);
    }

    MoveUpWrap.extend();

    MoveUpWrap.prototype.wrap = true;

    return MoveUpWrap;

  })(MoveUp);

  MoveDown = (function(superClass) {
    extend(MoveDown, superClass);

    function MoveDown() {
      return MoveDown.__super__.constructor.apply(this, arguments);
    }

    MoveDown.extend();

    MoveDown.prototype.wise = 'linewise';

    MoveDown.prototype.wrap = false;

    MoveDown.prototype.getBufferRow = function(row) {
      if (this.editor.isFoldedAtBufferRow(row)) {
        row = getLargestFoldRangeContainsBufferRow(this.editor, row).end.row;
      }
      return this.getNextRow(row);
    };

    MoveDown.prototype.getNextRow = function(row) {
      var max;
      max = this.getVimLastBufferRow();
      if (this.wrap && row >= max) {
        return 0;
      } else {
        return limitNumber(row + 1, {
          max: max
        });
      }
    };

    return MoveDown;

  })(MoveUp);

  MoveDownWrap = (function(superClass) {
    extend(MoveDownWrap, superClass);

    function MoveDownWrap() {
      return MoveDownWrap.__super__.constructor.apply(this, arguments);
    }

    MoveDownWrap.extend();

    MoveDownWrap.prototype.wrap = true;

    return MoveDownWrap;

  })(MoveDown);

  MoveUpScreen = (function(superClass) {
    extend(MoveUpScreen, superClass);

    function MoveUpScreen() {
      return MoveUpScreen.__super__.constructor.apply(this, arguments);
    }

    MoveUpScreen.extend();

    MoveUpScreen.prototype.wise = 'linewise';

    MoveUpScreen.prototype.direction = 'up';

    MoveUpScreen.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, function() {
        return moveCursorUpScreen(cursor);
      });
    };

    return MoveUpScreen;

  })(Motion);

  MoveDownScreen = (function(superClass) {
    extend(MoveDownScreen, superClass);

    function MoveDownScreen() {
      return MoveDownScreen.__super__.constructor.apply(this, arguments);
    }

    MoveDownScreen.extend();

    MoveDownScreen.prototype.wise = 'linewise';

    MoveDownScreen.prototype.direction = 'down';

    MoveDownScreen.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, function() {
        return moveCursorDownScreen(cursor);
      });
    };

    return MoveDownScreen;

  })(MoveUpScreen);

  MoveUpToEdge = (function(superClass) {
    extend(MoveUpToEdge, superClass);

    function MoveUpToEdge() {
      return MoveUpToEdge.__super__.constructor.apply(this, arguments);
    }

    MoveUpToEdge.extend();

    MoveUpToEdge.prototype.wise = 'linewise';

    MoveUpToEdge.prototype.jump = true;

    MoveUpToEdge.prototype.direction = 'up';

    MoveUpToEdge.description = "Move cursor up to **edge** char at same-column";

    MoveUpToEdge.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          return _this.setScreenPositionSafely(cursor, _this.getPoint(cursor.getScreenPosition()));
        };
      })(this));
    };

    MoveUpToEdge.prototype.getPoint = function(fromPoint) {
      var column, j, len, point, ref2, row;
      column = fromPoint.column;
      ref2 = this.getScanRows(fromPoint);
      for (j = 0, len = ref2.length; j < len; j++) {
        row = ref2[j];
        if (this.isEdge(point = new Point(row, column))) {
          return point;
        }
      }
    };

    MoveUpToEdge.prototype.getScanRows = function(arg) {
      var j, k, ref2, ref3, ref4, results, results1, row, validRow;
      row = arg.row;
      validRow = getValidVimScreenRow.bind(null, this.editor);
      switch (this.direction) {
        case 'up':
          return (function() {
            results = [];
            for (var j = ref2 = validRow(row - 1); ref2 <= 0 ? j <= 0 : j >= 0; ref2 <= 0 ? j++ : j--){ results.push(j); }
            return results;
          }).apply(this);
        case 'down':
          return (function() {
            results1 = [];
            for (var k = ref3 = validRow(row + 1), ref4 = this.getVimLastScreenRow(); ref3 <= ref4 ? k <= ref4 : k >= ref4; ref3 <= ref4 ? k++ : k--){ results1.push(k); }
            return results1;
          }).apply(this);
      }
    };

    MoveUpToEdge.prototype.isEdge = function(point) {
      var above, below;
      if (this.isStoppablePoint(point)) {
        above = point.translate([-1, 0]);
        below = point.translate([+1, 0]);
        return (!this.isStoppablePoint(above)) || (!this.isStoppablePoint(below));
      } else {
        return false;
      }
    };

    MoveUpToEdge.prototype.isStoppablePoint = function(point) {
      var leftPoint, rightPoint;
      if (this.isNonWhiteSpacePoint(point)) {
        return true;
      } else {
        leftPoint = point.translate([0, -1]);
        rightPoint = point.translate([0, +1]);
        return this.isNonWhiteSpacePoint(leftPoint) && this.isNonWhiteSpacePoint(rightPoint);
      }
    };

    MoveUpToEdge.prototype.isNonWhiteSpacePoint = function(point) {
      var char;
      char = getTextInScreenRange(this.editor, Range.fromPointWithDelta(point, 0, 1));
      return (char != null) && /\S/.test(char);
    };

    return MoveUpToEdge;

  })(Motion);

  MoveDownToEdge = (function(superClass) {
    extend(MoveDownToEdge, superClass);

    function MoveDownToEdge() {
      return MoveDownToEdge.__super__.constructor.apply(this, arguments);
    }

    MoveDownToEdge.extend();

    MoveDownToEdge.description = "Move cursor down to **edge** char at same-column";

    MoveDownToEdge.prototype.direction = 'down';

    return MoveDownToEdge;

  })(MoveUpToEdge);

  MoveToNextWord = (function(superClass) {
    extend(MoveToNextWord, superClass);

    function MoveToNextWord() {
      return MoveToNextWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWord.extend();

    MoveToNextWord.prototype.wordRegex = null;

    MoveToNextWord.prototype.getPoint = function(pattern, from) {
      var found, point, ref2, vimEOF, wordRange;
      wordRange = null;
      found = false;
      vimEOF = this.getVimEofBufferPosition(this.editor);
      this.scanForward(pattern, {
        from: from
      }, function(arg) {
        var matchText, range, stop;
        range = arg.range, matchText = arg.matchText, stop = arg.stop;
        wordRange = range;
        if (matchText === '' && range.start.column !== 0) {
          return;
        }
        if (range.start.isGreaterThan(from)) {
          found = true;
          return stop();
        }
      });
      if (found) {
        point = wordRange.start;
        if (pointIsAtEndOfLineAtNonEmptyRow(this.editor, point) && !point.isEqual(vimEOF)) {
          return point.traverse([1, 0]);
        } else {
          return point;
        }
      } else {
        return (ref2 = wordRange != null ? wordRange.end : void 0) != null ? ref2 : from;
      }
    };

    MoveToNextWord.prototype.moveCursor = function(cursor) {
      var cursorPosition, isAsTargetExceptSelect, wasOnWhiteSpace;
      cursorPosition = cursor.getBufferPosition();
      if (pointIsAtVimEndOfFile(this.editor, cursorPosition)) {
        return;
      }
      wasOnWhiteSpace = pointIsOnWhiteSpace(this.editor, cursorPosition);
      isAsTargetExceptSelect = this.isAsTargetExceptSelect();
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function(arg) {
          var isFinal, pattern, point, ref2;
          isFinal = arg.isFinal;
          cursorPosition = cursor.getBufferPosition();
          if (isEmptyRow(_this.editor, cursorPosition.row) && isAsTargetExceptSelect) {
            point = cursorPosition.traverse([1, 0]);
          } else {
            pattern = (ref2 = _this.wordRegex) != null ? ref2 : cursor.wordRegExp();
            point = _this.getPoint(pattern, cursorPosition);
            if (isFinal && isAsTargetExceptSelect) {
              if (_this.operator.is('Change') && (!wasOnWhiteSpace)) {
                point = cursor.getEndOfCurrentWordBufferPosition({
                  wordRegex: _this.wordRegex
                });
              } else {
                point = Point.min(point, getEndOfLineForBufferRow(_this.editor, cursorPosition.row));
              }
            }
          }
          return cursor.setBufferPosition(point);
        };
      })(this));
    };

    return MoveToNextWord;

  })(Motion);

  MoveToPreviousWord = (function(superClass) {
    extend(MoveToPreviousWord, superClass);

    function MoveToPreviousWord() {
      return MoveToPreviousWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWord.extend();

    MoveToPreviousWord.prototype.wordRegex = null;

    MoveToPreviousWord.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          var point;
          point = cursor.getBeginningOfCurrentWordBufferPosition({
            wordRegex: _this.wordRegex
          });
          return cursor.setBufferPosition(point);
        };
      })(this));
    };

    return MoveToPreviousWord;

  })(Motion);

  MoveToEndOfWord = (function(superClass) {
    extend(MoveToEndOfWord, superClass);

    function MoveToEndOfWord() {
      return MoveToEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWord.extend();

    MoveToEndOfWord.prototype.wordRegex = null;

    MoveToEndOfWord.prototype.inclusive = true;

    MoveToEndOfWord.prototype.moveToNextEndOfWord = function(cursor) {
      var point;
      moveCursorToNextNonWhitespace(cursor);
      point = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.wordRegex
      }).translate([0, -1]);
      point = Point.min(point, this.getVimEofBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToEndOfWord.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          var originalPoint;
          originalPoint = cursor.getBufferPosition();
          _this.moveToNextEndOfWord(cursor);
          if (originalPoint.isEqual(cursor.getBufferPosition())) {
            cursor.moveRight();
            return _this.moveToNextEndOfWord(cursor);
          }
        };
      })(this));
    };

    return MoveToEndOfWord;

  })(Motion);

  MoveToPreviousEndOfWord = (function(superClass) {
    extend(MoveToPreviousEndOfWord, superClass);

    function MoveToPreviousEndOfWord() {
      return MoveToPreviousEndOfWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousEndOfWord.extend();

    MoveToPreviousEndOfWord.prototype.inclusive = true;

    MoveToPreviousEndOfWord.prototype.moveCursor = function(cursor) {
      var cursorPosition, j, point, ref2, times, wordRange;
      times = this.getCount();
      wordRange = cursor.getCurrentWordBufferRange();
      cursorPosition = cursor.getBufferPosition();
      if (cursorPosition.isGreaterThan(wordRange.start) && cursorPosition.isLessThan(wordRange.end)) {
        times += 1;
      }
      for (j = 1, ref2 = times; 1 <= ref2 ? j <= ref2 : j >= ref2; 1 <= ref2 ? j++ : j--) {
        point = cursor.getBeginningOfCurrentWordBufferPosition({
          wordRegex: this.wordRegex
        });
        cursor.setBufferPosition(point);
      }
      this.moveToNextEndOfWord(cursor);
      if (cursor.getBufferPosition().isGreaterThanOrEqual(cursorPosition)) {
        return cursor.setBufferPosition([0, 0]);
      }
    };

    MoveToPreviousEndOfWord.prototype.moveToNextEndOfWord = function(cursor) {
      var point;
      point = cursor.getEndOfCurrentWordBufferPosition({
        wordRegex: this.wordRegex
      }).translate([0, -1]);
      point = Point.min(point, this.getVimEofBufferPosition());
      return cursor.setBufferPosition(point);
    };

    return MoveToPreviousEndOfWord;

  })(MoveToPreviousWord);

  MoveToNextWholeWord = (function(superClass) {
    extend(MoveToNextWholeWord, superClass);

    function MoveToNextWholeWord() {
      return MoveToNextWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextWholeWord.extend();

    MoveToNextWholeWord.prototype.wordRegex = /^$|\S+/g;

    return MoveToNextWholeWord;

  })(MoveToNextWord);

  MoveToPreviousWholeWord = (function(superClass) {
    extend(MoveToPreviousWholeWord, superClass);

    function MoveToPreviousWholeWord() {
      return MoveToPreviousWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousWholeWord.extend();

    MoveToPreviousWholeWord.prototype.wordRegex = /^$|\S+/g;

    return MoveToPreviousWholeWord;

  })(MoveToPreviousWord);

  MoveToEndOfWholeWord = (function(superClass) {
    extend(MoveToEndOfWholeWord, superClass);

    function MoveToEndOfWholeWord() {
      return MoveToEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfWholeWord.extend();

    MoveToEndOfWholeWord.prototype.wordRegex = /\S+/;

    return MoveToEndOfWholeWord;

  })(MoveToEndOfWord);

  MoveToPreviousEndOfWholeWord = (function(superClass) {
    extend(MoveToPreviousEndOfWholeWord, superClass);

    function MoveToPreviousEndOfWholeWord() {
      return MoveToPreviousEndOfWholeWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousEndOfWholeWord.extend();

    MoveToPreviousEndOfWholeWord.prototype.wordRegex = /\S+/;

    return MoveToPreviousEndOfWholeWord;

  })(MoveToPreviousEndOfWord);

  MoveToNextAlphanumericWord = (function(superClass) {
    extend(MoveToNextAlphanumericWord, superClass);

    function MoveToNextAlphanumericWord() {
      return MoveToNextAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextAlphanumericWord.extend();

    MoveToNextAlphanumericWord.description = "Move to next alphanumeric(`/\w+/`) word";

    MoveToNextAlphanumericWord.prototype.wordRegex = /\w+/g;

    return MoveToNextAlphanumericWord;

  })(MoveToNextWord);

  MoveToPreviousAlphanumericWord = (function(superClass) {
    extend(MoveToPreviousAlphanumericWord, superClass);

    function MoveToPreviousAlphanumericWord() {
      return MoveToPreviousAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousAlphanumericWord.extend();

    MoveToPreviousAlphanumericWord.description = "Move to previous alphanumeric(`/\w+/`) word";

    MoveToPreviousAlphanumericWord.prototype.wordRegex = /\w+/;

    return MoveToPreviousAlphanumericWord;

  })(MoveToPreviousWord);

  MoveToEndOfAlphanumericWord = (function(superClass) {
    extend(MoveToEndOfAlphanumericWord, superClass);

    function MoveToEndOfAlphanumericWord() {
      return MoveToEndOfAlphanumericWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfAlphanumericWord.extend();

    MoveToEndOfAlphanumericWord.description = "Move to end of alphanumeric(`/\w+/`) word";

    MoveToEndOfAlphanumericWord.prototype.wordRegex = /\w+/;

    return MoveToEndOfAlphanumericWord;

  })(MoveToEndOfWord);

  MoveToNextSmartWord = (function(superClass) {
    extend(MoveToNextSmartWord, superClass);

    function MoveToNextSmartWord() {
      return MoveToNextSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSmartWord.extend();

    MoveToNextSmartWord.description = "Move to next smart word (`/[\w-]+/`) word";

    MoveToNextSmartWord.prototype.wordRegex = /[\w-]+/g;

    return MoveToNextSmartWord;

  })(MoveToNextWord);

  MoveToPreviousSmartWord = (function(superClass) {
    extend(MoveToPreviousSmartWord, superClass);

    function MoveToPreviousSmartWord() {
      return MoveToPreviousSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSmartWord.extend();

    MoveToPreviousSmartWord.description = "Move to previous smart word (`/[\w-]+/`) word";

    MoveToPreviousSmartWord.prototype.wordRegex = /[\w-]+/;

    return MoveToPreviousSmartWord;

  })(MoveToPreviousWord);

  MoveToEndOfSmartWord = (function(superClass) {
    extend(MoveToEndOfSmartWord, superClass);

    function MoveToEndOfSmartWord() {
      return MoveToEndOfSmartWord.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfSmartWord.extend();

    MoveToEndOfSmartWord.description = "Move to end of smart word (`/[\w-]+/`) word";

    MoveToEndOfSmartWord.prototype.wordRegex = /[\w-]+/;

    return MoveToEndOfSmartWord;

  })(MoveToEndOfWord);

  MoveToNextSubword = (function(superClass) {
    extend(MoveToNextSubword, superClass);

    function MoveToNextSubword() {
      return MoveToNextSubword.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSubword.extend();

    MoveToNextSubword.prototype.moveCursor = function(cursor) {
      this.wordRegex = cursor.subwordRegExp();
      return MoveToNextSubword.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToNextSubword;

  })(MoveToNextWord);

  MoveToPreviousSubword = (function(superClass) {
    extend(MoveToPreviousSubword, superClass);

    function MoveToPreviousSubword() {
      return MoveToPreviousSubword.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSubword.extend();

    MoveToPreviousSubword.prototype.moveCursor = function(cursor) {
      this.wordRegex = cursor.subwordRegExp();
      return MoveToPreviousSubword.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToPreviousSubword;

  })(MoveToPreviousWord);

  MoveToEndOfSubword = (function(superClass) {
    extend(MoveToEndOfSubword, superClass);

    function MoveToEndOfSubword() {
      return MoveToEndOfSubword.__super__.constructor.apply(this, arguments);
    }

    MoveToEndOfSubword.extend();

    MoveToEndOfSubword.prototype.moveCursor = function(cursor) {
      this.wordRegex = cursor.subwordRegExp();
      return MoveToEndOfSubword.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToEndOfSubword;

  })(MoveToEndOfWord);

  MoveToNextSentence = (function(superClass) {
    extend(MoveToNextSentence, superClass);

    function MoveToNextSentence() {
      return MoveToNextSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentence.extend();

    MoveToNextSentence.prototype.jump = true;

    MoveToNextSentence.prototype.sentenceRegex = /(?:[\.!\?][\)\]"']*\s+)|(\n|\r\n)/g;

    MoveToNextSentence.prototype.direction = 'next';

    MoveToNextSentence.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          return _this.setBufferPositionSafely(cursor, _this.getPoint(cursor.getBufferPosition()));
        };
      })(this));
    };

    MoveToNextSentence.prototype.getPoint = function(fromPoint) {
      if (this.direction === 'next') {
        return this.getNextStartOfSentence(fromPoint);
      } else if (this.direction === 'previous') {
        return this.getPreviousStartOfSentence(fromPoint);
      }
    };

    MoveToNextSentence.prototype.isBlankRow = function(row) {
      return this.editor.isBufferRowBlank(row);
    };

    MoveToNextSentence.prototype.getNextStartOfSentence = function(from) {
      var foundPoint;
      foundPoint = null;
      this.scanForward(this.sentenceRegex, {
        from: from
      }, (function(_this) {
        return function(arg) {
          var endRow, match, matchText, range, ref2, startRow, stop;
          range = arg.range, matchText = arg.matchText, match = arg.match, stop = arg.stop;
          if (match[1] != null) {
            ref2 = [range.start.row, range.end.row], startRow = ref2[0], endRow = ref2[1];
            if (_this.skipBlankRow && _this.isBlankRow(endRow)) {
              return;
            }
            if (_this.isBlankRow(startRow) !== _this.isBlankRow(endRow)) {
              foundPoint = _this.getFirstCharacterPositionForBufferRow(endRow);
            }
          } else {
            foundPoint = range.end;
          }
          if (foundPoint != null) {
            return stop();
          }
        };
      })(this));
      return foundPoint != null ? foundPoint : this.getVimEofBufferPosition();
    };

    MoveToNextSentence.prototype.getPreviousStartOfSentence = function(from) {
      var foundPoint;
      foundPoint = null;
      this.scanBackward(this.sentenceRegex, {
        from: from
      }, (function(_this) {
        return function(arg) {
          var endRow, match, matchText, point, range, ref2, startRow, stop;
          range = arg.range, match = arg.match, stop = arg.stop, matchText = arg.matchText;
          if (match[1] != null) {
            ref2 = [range.start.row, range.end.row], startRow = ref2[0], endRow = ref2[1];
            if (!_this.isBlankRow(endRow) && _this.isBlankRow(startRow)) {
              point = _this.getFirstCharacterPositionForBufferRow(endRow);
              if (point.isLessThan(from)) {
                foundPoint = point;
              } else {
                if (_this.skipBlankRow) {
                  return;
                }
                foundPoint = _this.getFirstCharacterPositionForBufferRow(startRow);
              }
            }
          } else {
            if (range.end.isLessThan(from)) {
              foundPoint = range.end;
            }
          }
          if (foundPoint != null) {
            return stop();
          }
        };
      })(this));
      return foundPoint != null ? foundPoint : [0, 0];
    };

    return MoveToNextSentence;

  })(Motion);

  MoveToPreviousSentence = (function(superClass) {
    extend(MoveToPreviousSentence, superClass);

    function MoveToPreviousSentence() {
      return MoveToPreviousSentence.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentence.extend();

    MoveToPreviousSentence.prototype.direction = 'previous';

    return MoveToPreviousSentence;

  })(MoveToNextSentence);

  MoveToNextSentenceSkipBlankRow = (function(superClass) {
    extend(MoveToNextSentenceSkipBlankRow, superClass);

    function MoveToNextSentenceSkipBlankRow() {
      return MoveToNextSentenceSkipBlankRow.__super__.constructor.apply(this, arguments);
    }

    MoveToNextSentenceSkipBlankRow.extend();

    MoveToNextSentenceSkipBlankRow.prototype.skipBlankRow = true;

    return MoveToNextSentenceSkipBlankRow;

  })(MoveToNextSentence);

  MoveToPreviousSentenceSkipBlankRow = (function(superClass) {
    extend(MoveToPreviousSentenceSkipBlankRow, superClass);

    function MoveToPreviousSentenceSkipBlankRow() {
      return MoveToPreviousSentenceSkipBlankRow.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousSentenceSkipBlankRow.extend();

    MoveToPreviousSentenceSkipBlankRow.prototype.skipBlankRow = true;

    return MoveToPreviousSentenceSkipBlankRow;

  })(MoveToPreviousSentence);

  MoveToNextParagraph = (function(superClass) {
    extend(MoveToNextParagraph, superClass);

    function MoveToNextParagraph() {
      return MoveToNextParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToNextParagraph.extend();

    MoveToNextParagraph.prototype.jump = true;

    MoveToNextParagraph.prototype.direction = 'next';

    MoveToNextParagraph.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          return _this.setBufferPositionSafely(cursor, _this.getPoint(cursor.getBufferPosition()));
        };
      })(this));
    };

    MoveToNextParagraph.prototype.getPoint = function(fromPoint) {
      var j, len, ref2, row, startRow, wasAtNonBlankRow;
      startRow = fromPoint.row;
      wasAtNonBlankRow = !this.editor.isBufferRowBlank(startRow);
      ref2 = getBufferRows(this.editor, {
        startRow: startRow,
        direction: this.direction
      });
      for (j = 0, len = ref2.length; j < len; j++) {
        row = ref2[j];
        if (this.editor.isBufferRowBlank(row)) {
          if (wasAtNonBlankRow) {
            return new Point(row, 0);
          }
        } else {
          wasAtNonBlankRow = true;
        }
      }
      switch (this.direction) {
        case 'previous':
          return new Point(0, 0);
        case 'next':
          return this.getVimEofBufferPosition();
      }
    };

    return MoveToNextParagraph;

  })(Motion);

  MoveToPreviousParagraph = (function(superClass) {
    extend(MoveToPreviousParagraph, superClass);

    function MoveToPreviousParagraph() {
      return MoveToPreviousParagraph.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousParagraph.extend();

    MoveToPreviousParagraph.prototype.direction = 'previous';

    return MoveToPreviousParagraph;

  })(MoveToNextParagraph);

  MoveToBeginningOfLine = (function(superClass) {
    extend(MoveToBeginningOfLine, superClass);

    function MoveToBeginningOfLine() {
      return MoveToBeginningOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToBeginningOfLine.extend();

    MoveToBeginningOfLine.prototype.moveCursor = function(cursor) {
      return setBufferColumn(cursor, 0);
    };

    return MoveToBeginningOfLine;

  })(Motion);

  MoveToColumn = (function(superClass) {
    extend(MoveToColumn, superClass);

    function MoveToColumn() {
      return MoveToColumn.__super__.constructor.apply(this, arguments);
    }

    MoveToColumn.extend();

    MoveToColumn.prototype.moveCursor = function(cursor) {
      return setBufferColumn(cursor, this.getCount(-1));
    };

    return MoveToColumn;

  })(Motion);

  MoveToLastCharacterOfLine = (function(superClass) {
    extend(MoveToLastCharacterOfLine, superClass);

    function MoveToLastCharacterOfLine() {
      return MoveToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastCharacterOfLine.extend();

    MoveToLastCharacterOfLine.prototype.moveCursor = function(cursor) {
      var row;
      row = getValidVimBufferRow(this.editor, cursor.getBufferRow() + this.getCount(-1));
      cursor.setBufferPosition([row, 2e308]);
      return cursor.goalColumn = 2e308;
    };

    return MoveToLastCharacterOfLine;

  })(Motion);

  MoveToLastNonblankCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToLastNonblankCharacterOfLineAndDown, superClass);

    function MoveToLastNonblankCharacterOfLineAndDown() {
      return MoveToLastNonblankCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToLastNonblankCharacterOfLineAndDown.extend();

    MoveToLastNonblankCharacterOfLineAndDown.prototype.inclusive = true;

    MoveToLastNonblankCharacterOfLineAndDown.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      return cursor.setBufferPosition(point);
    };

    MoveToLastNonblankCharacterOfLineAndDown.prototype.getPoint = function(arg) {
      var range, ref2, row;
      row = arg.row;
      row = limitNumber(row + this.getCount(-1), {
        max: this.getVimLastBufferRow()
      });
      range = findRangeInBufferRow(this.editor, /\S|^/, row, {
        direction: 'backward'
      });
      return (ref2 = range != null ? range.start : void 0) != null ? ref2 : new Point(row, 0);
    };

    return MoveToLastNonblankCharacterOfLineAndDown;

  })(Motion);

  MoveToFirstCharacterOfLine = (function(superClass) {
    extend(MoveToFirstCharacterOfLine, superClass);

    function MoveToFirstCharacterOfLine() {
      return MoveToFirstCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLine.extend();

    MoveToFirstCharacterOfLine.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getFirstCharacterPositionForBufferRow(cursor.getBufferRow());
      return this.setBufferPositionSafely(cursor, point);
    };

    return MoveToFirstCharacterOfLine;

  })(Motion);

  MoveToFirstCharacterOfLineUp = (function(superClass) {
    extend(MoveToFirstCharacterOfLineUp, superClass);

    function MoveToFirstCharacterOfLineUp() {
      return MoveToFirstCharacterOfLineUp.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineUp.extend();

    MoveToFirstCharacterOfLineUp.prototype.wise = 'linewise';

    MoveToFirstCharacterOfLineUp.prototype.moveCursor = function(cursor) {
      this.moveCursorCountTimes(cursor, function() {
        var point;
        point = cursor.getBufferPosition();
        if (point.row !== 0) {
          return cursor.setBufferPosition(point.translate([-1, 0]));
        }
      });
      return MoveToFirstCharacterOfLineUp.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToFirstCharacterOfLineUp;

  })(MoveToFirstCharacterOfLine);

  MoveToFirstCharacterOfLineDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineDown, superClass);

    function MoveToFirstCharacterOfLineDown() {
      return MoveToFirstCharacterOfLineDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineDown.extend();

    MoveToFirstCharacterOfLineDown.prototype.wise = 'linewise';

    MoveToFirstCharacterOfLineDown.prototype.moveCursor = function(cursor) {
      this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          var point;
          point = cursor.getBufferPosition();
          if (_this.getVimLastBufferRow() !== point.row) {
            return cursor.setBufferPosition(point.translate([+1, 0]));
          }
        };
      })(this));
      return MoveToFirstCharacterOfLineDown.__super__.moveCursor.apply(this, arguments);
    };

    return MoveToFirstCharacterOfLineDown;

  })(MoveToFirstCharacterOfLine);

  MoveToFirstCharacterOfLineAndDown = (function(superClass) {
    extend(MoveToFirstCharacterOfLineAndDown, superClass);

    function MoveToFirstCharacterOfLineAndDown() {
      return MoveToFirstCharacterOfLineAndDown.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfLineAndDown.extend();

    MoveToFirstCharacterOfLineAndDown.prototype.defaultCount = 0;

    MoveToFirstCharacterOfLineAndDown.prototype.getCount = function() {
      return MoveToFirstCharacterOfLineAndDown.__super__.getCount.apply(this, arguments) - 1;
    };

    return MoveToFirstCharacterOfLineAndDown;

  })(MoveToFirstCharacterOfLineDown);

  MoveToFirstLine = (function(superClass) {
    extend(MoveToFirstLine, superClass);

    function MoveToFirstLine() {
      return MoveToFirstLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstLine.extend();

    MoveToFirstLine.prototype.wise = 'linewise';

    MoveToFirstLine.prototype.jump = true;

    MoveToFirstLine.prototype.verticalMotion = true;

    MoveToFirstLine.prototype.moveSuccessOnLinewise = true;

    MoveToFirstLine.prototype.moveCursor = function(cursor) {
      this.setCursorBufferRow(cursor, getValidVimBufferRow(this.editor, this.getRow()));
      return cursor.autoscroll({
        center: true
      });
    };

    MoveToFirstLine.prototype.getRow = function() {
      return this.getCount(-1);
    };

    return MoveToFirstLine;

  })(Motion);

  MoveToScreenColumn = (function(superClass) {
    extend(MoveToScreenColumn, superClass);

    function MoveToScreenColumn() {
      return MoveToScreenColumn.__super__.constructor.apply(this, arguments);
    }

    MoveToScreenColumn.extend(false);

    MoveToScreenColumn.prototype.moveCursor = function(cursor) {
      var allowOffScreenPosition, point;
      allowOffScreenPosition = this.getConfig("allowMoveToOffScreenColumnOnScreenLineMotion");
      point = this.vimState.utils.getScreenPositionForScreenRow(this.editor, cursor.getScreenRow(), this.which, {
        allowOffScreenPosition: allowOffScreenPosition
      });
      return this.setScreenPositionSafely(cursor, point);
    };

    return MoveToScreenColumn;

  })(Motion);

  MoveToBeginningOfScreenLine = (function(superClass) {
    extend(MoveToBeginningOfScreenLine, superClass);

    function MoveToBeginningOfScreenLine() {
      return MoveToBeginningOfScreenLine.__super__.constructor.apply(this, arguments);
    }

    MoveToBeginningOfScreenLine.extend();

    MoveToBeginningOfScreenLine.prototype.which = "beginning";

    return MoveToBeginningOfScreenLine;

  })(MoveToScreenColumn);

  MoveToFirstCharacterOfScreenLine = (function(superClass) {
    extend(MoveToFirstCharacterOfScreenLine, superClass);

    function MoveToFirstCharacterOfScreenLine() {
      return MoveToFirstCharacterOfScreenLine.__super__.constructor.apply(this, arguments);
    }

    MoveToFirstCharacterOfScreenLine.extend();

    MoveToFirstCharacterOfScreenLine.prototype.which = "first-character";

    return MoveToFirstCharacterOfScreenLine;

  })(MoveToScreenColumn);

  MoveToLastCharacterOfScreenLine = (function(superClass) {
    extend(MoveToLastCharacterOfScreenLine, superClass);

    function MoveToLastCharacterOfScreenLine() {
      return MoveToLastCharacterOfScreenLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastCharacterOfScreenLine.extend();

    MoveToLastCharacterOfScreenLine.prototype.which = "last-character";

    return MoveToLastCharacterOfScreenLine;

  })(MoveToScreenColumn);

  MoveToLastLine = (function(superClass) {
    extend(MoveToLastLine, superClass);

    function MoveToLastLine() {
      return MoveToLastLine.__super__.constructor.apply(this, arguments);
    }

    MoveToLastLine.extend();

    MoveToLastLine.prototype.defaultCount = 2e308;

    return MoveToLastLine;

  })(MoveToFirstLine);

  MoveToLineByPercent = (function(superClass) {
    extend(MoveToLineByPercent, superClass);

    function MoveToLineByPercent() {
      return MoveToLineByPercent.__super__.constructor.apply(this, arguments);
    }

    MoveToLineByPercent.extend();

    MoveToLineByPercent.prototype.getRow = function() {
      var percent;
      percent = limitNumber(this.getCount(), {
        max: 100
      });
      return Math.floor((this.editor.getLineCount() - 1) * (percent / 100));
    };

    return MoveToLineByPercent;

  })(MoveToFirstLine);

  MoveToRelativeLine = (function(superClass) {
    extend(MoveToRelativeLine, superClass);

    function MoveToRelativeLine() {
      return MoveToRelativeLine.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLine.extend(false);

    MoveToRelativeLine.prototype.wise = 'linewise';

    MoveToRelativeLine.prototype.moveSuccessOnLinewise = true;

    MoveToRelativeLine.prototype.moveCursor = function(cursor) {
      var count, row;
      row = this.getFoldEndRowForRow(cursor.getBufferRow());
      count = this.getCount(-1);
      while (count > 0) {
        row = this.getFoldEndRowForRow(row + 1);
        count--;
      }
      return setBufferRow(cursor, row);
    };

    return MoveToRelativeLine;

  })(Motion);

  MoveToRelativeLineMinimumOne = (function(superClass) {
    extend(MoveToRelativeLineMinimumOne, superClass);

    function MoveToRelativeLineMinimumOne() {
      return MoveToRelativeLineMinimumOne.__super__.constructor.apply(this, arguments);
    }

    MoveToRelativeLineMinimumOne.extend(false);

    MoveToRelativeLineMinimumOne.prototype.getCount = function() {
      return limitNumber(MoveToRelativeLineMinimumOne.__super__.getCount.apply(this, arguments), {
        min: 1
      });
    };

    return MoveToRelativeLineMinimumOne;

  })(MoveToRelativeLine);

  MoveToTopOfScreen = (function(superClass) {
    extend(MoveToTopOfScreen, superClass);

    function MoveToTopOfScreen() {
      return MoveToTopOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToTopOfScreen.extend();

    MoveToTopOfScreen.prototype.wise = 'linewise';

    MoveToTopOfScreen.prototype.jump = true;

    MoveToTopOfScreen.prototype.scrolloff = 2;

    MoveToTopOfScreen.prototype.defaultCount = 0;

    MoveToTopOfScreen.prototype.verticalMotion = true;

    MoveToTopOfScreen.prototype.moveCursor = function(cursor) {
      var bufferRow;
      bufferRow = this.editor.bufferRowForScreenRow(this.getScreenRow());
      return this.setCursorBufferRow(cursor, bufferRow);
    };

    MoveToTopOfScreen.prototype.getScrolloff = function() {
      if (this.isAsTargetExceptSelect()) {
        return 0;
      } else {
        return this.scrolloff;
      }
    };

    MoveToTopOfScreen.prototype.getScreenRow = function() {
      var firstRow, offset;
      firstRow = getFirstVisibleScreenRow(this.editor);
      offset = this.getScrolloff();
      if (firstRow === 0) {
        offset = 0;
      }
      offset = limitNumber(this.getCount(-1), {
        min: offset
      });
      return firstRow + offset;
    };

    return MoveToTopOfScreen;

  })(Motion);

  MoveToMiddleOfScreen = (function(superClass) {
    extend(MoveToMiddleOfScreen, superClass);

    function MoveToMiddleOfScreen() {
      return MoveToMiddleOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToMiddleOfScreen.extend();

    MoveToMiddleOfScreen.prototype.getScreenRow = function() {
      var endRow, startRow;
      startRow = getFirstVisibleScreenRow(this.editor);
      endRow = limitNumber(this.editor.getLastVisibleScreenRow(), {
        max: this.getVimLastScreenRow()
      });
      return startRow + Math.floor((endRow - startRow) / 2);
    };

    return MoveToMiddleOfScreen;

  })(MoveToTopOfScreen);

  MoveToBottomOfScreen = (function(superClass) {
    extend(MoveToBottomOfScreen, superClass);

    function MoveToBottomOfScreen() {
      return MoveToBottomOfScreen.__super__.constructor.apply(this, arguments);
    }

    MoveToBottomOfScreen.extend();

    MoveToBottomOfScreen.prototype.getScreenRow = function() {
      var offset, row, vimLastScreenRow;
      vimLastScreenRow = this.getVimLastScreenRow();
      row = limitNumber(this.editor.getLastVisibleScreenRow(), {
        max: vimLastScreenRow
      });
      offset = this.getScrolloff() + 1;
      if (row === vimLastScreenRow) {
        offset = 0;
      }
      offset = limitNumber(this.getCount(-1), {
        min: offset
      });
      return row - offset;
    };

    return MoveToBottomOfScreen;

  })(MoveToTopOfScreen);

  Scroll = (function(superClass) {
    extend(Scroll, superClass);

    function Scroll() {
      return Scroll.__super__.constructor.apply(this, arguments);
    }

    Scroll.extend(false);

    Scroll.prototype.verticalMotion = true;

    Scroll.prototype.isSmoothScrollEnabled = function() {
      if (Math.abs(this.amountOfPage) === 1) {
        return this.getConfig('smoothScrollOnFullScrollMotion');
      } else {
        return this.getConfig('smoothScrollOnHalfScrollMotion');
      }
    };

    Scroll.prototype.getSmoothScrollDuation = function() {
      if (Math.abs(this.amountOfPage) === 1) {
        return this.getConfig('smoothScrollOnFullScrollMotionDuration');
      } else {
        return this.getConfig('smoothScrollOnHalfScrollMotionDuration');
      }
    };

    Scroll.prototype.getPixelRectTopForSceenRow = function(row) {
      var point;
      point = new Point(row, 0);
      return this.editor.element.pixelRectForScreenRange(new Range(point, point)).top;
    };

    Scroll.prototype.smoothScroll = function(fromRow, toRow, done) {
      var duration, step, topPixelFrom, topPixelTo;
      topPixelFrom = {
        top: this.getPixelRectTopForSceenRow(fromRow)
      };
      topPixelTo = {
        top: this.getPixelRectTopForSceenRow(toRow)
      };
      step = (function(_this) {
        return function(newTop) {
          if (_this.editor.element.component != null) {
            _this.editor.element.component.setScrollTop(newTop);
            return _this.editor.element.component.updateSync();
          }
        };
      })(this);
      duration = this.getSmoothScrollDuation();
      return this.vimState.requestScrollAnimation(topPixelFrom, topPixelTo, {
        duration: duration,
        step: step,
        done: done
      });
    };

    Scroll.prototype.getAmountOfRows = function() {
      return Math.ceil(this.amountOfPage * this.editor.getRowsPerPage() * this.getCount());
    };

    Scroll.prototype.getBufferRow = function(cursor) {
      var screenRow;
      screenRow = getValidVimScreenRow(this.editor, cursor.getScreenRow() + this.getAmountOfRows());
      return this.editor.bufferRowForScreenRow(screenRow);
    };

    Scroll.prototype.moveCursor = function(cursor) {
      var bufferRow, done, firstVisibileScreenRow, newFirstVisibileBufferRow, newFirstVisibileScreenRow;
      bufferRow = this.getBufferRow(cursor);
      this.setCursorBufferRow(cursor, this.getBufferRow(cursor), {
        autoscroll: false
      });
      if (cursor.isLastCursor()) {
        if (this.isSmoothScrollEnabled()) {
          this.vimState.finishScrollAnimation();
        }
        firstVisibileScreenRow = this.editor.getFirstVisibleScreenRow();
        newFirstVisibileBufferRow = this.editor.bufferRowForScreenRow(firstVisibileScreenRow + this.getAmountOfRows());
        newFirstVisibileScreenRow = this.editor.screenRowForBufferRow(newFirstVisibileBufferRow);
        done = (function(_this) {
          return function() {
            var ref2;
            _this.editor.setFirstVisibleScreenRow(newFirstVisibileScreenRow);
            return (ref2 = _this.editor.element.component) != null ? ref2.updateSync() : void 0;
          };
        })(this);
        if (this.isSmoothScrollEnabled()) {
          return this.smoothScroll(firstVisibileScreenRow, newFirstVisibileScreenRow, done);
        } else {
          return done();
        }
      }
    };

    return Scroll;

  })(Motion);

  ScrollFullScreenDown = (function(superClass) {
    extend(ScrollFullScreenDown, superClass);

    function ScrollFullScreenDown() {
      return ScrollFullScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollFullScreenDown.extend(true);

    ScrollFullScreenDown.prototype.amountOfPage = +1;

    return ScrollFullScreenDown;

  })(Scroll);

  ScrollFullScreenUp = (function(superClass) {
    extend(ScrollFullScreenUp, superClass);

    function ScrollFullScreenUp() {
      return ScrollFullScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollFullScreenUp.extend();

    ScrollFullScreenUp.prototype.amountOfPage = -1;

    return ScrollFullScreenUp;

  })(Scroll);

  ScrollHalfScreenDown = (function(superClass) {
    extend(ScrollHalfScreenDown, superClass);

    function ScrollHalfScreenDown() {
      return ScrollHalfScreenDown.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenDown.extend();

    ScrollHalfScreenDown.prototype.amountOfPage = +1 / 2;

    return ScrollHalfScreenDown;

  })(Scroll);

  ScrollHalfScreenUp = (function(superClass) {
    extend(ScrollHalfScreenUp, superClass);

    function ScrollHalfScreenUp() {
      return ScrollHalfScreenUp.__super__.constructor.apply(this, arguments);
    }

    ScrollHalfScreenUp.extend();

    ScrollHalfScreenUp.prototype.amountOfPage = -1 / 2;

    return ScrollHalfScreenUp;

  })(Scroll);

  Find = (function(superClass) {
    extend(Find, superClass);

    function Find() {
      return Find.__super__.constructor.apply(this, arguments);
    }

    Find.extend();

    Find.prototype.backwards = false;

    Find.prototype.inclusive = true;

    Find.prototype.offset = 0;

    Find.prototype.requireInput = true;

    Find.prototype.caseSensitivityKind = "Find";

    Find.prototype.restoreEditorState = function() {
      if (typeof this._restoreEditorState === "function") {
        this._restoreEditorState();
      }
      return this._restoreEditorState = null;
    };

    Find.prototype.cancelOperation = function() {
      this.restoreEditorState();
      return Find.__super__.cancelOperation.apply(this, arguments);
    };

    Find.prototype.initialize = function() {
      var charsMax, options;
      Find.__super__.initialize.apply(this, arguments);
      if (this.getConfig("reuseFindForRepeatFind")) {
        this.repeatIfNecessary();
      }
      if (this.isComplete()) {
        return;
      }
      charsMax = this.getConfig("findCharsMax");
      if (charsMax > 1) {
        this._restoreEditorState = saveEditorState(this.editor);
        options = {
          autoConfirmTimeout: this.getConfig("findConfirmByTimeout"),
          onConfirm: (function(_this) {
            return function(input) {
              _this.input = input;
              if (_this.input) {
                return _this.processOperation();
              } else {
                return _this.cancelOperation();
              }
            };
          })(this),
          onChange: (function(_this) {
            return function(preConfirmedChars) {
              _this.preConfirmedChars = preConfirmedChars;
              return _this.highlightTextInCursorRows(_this.preConfirmedChars, "pre-confirm");
            };
          })(this),
          onCancel: (function(_this) {
            return function() {
              _this.vimState.highlightFind.clearMarkers();
              return _this.cancelOperation();
            };
          })(this),
          commands: {
            "vim-mode-plus:find-next-pre-confirmed": (function(_this) {
              return function() {
                return _this.findPreConfirmed(+1);
              };
            })(this),
            "vim-mode-plus:find-previous-pre-confirmed": (function(_this) {
              return function() {
                return _this.findPreConfirmed(-1);
              };
            })(this)
          }
        };
      }
      if (options == null) {
        options = {};
      }
      options.purpose = "find";
      options.charsMax = charsMax;
      return this.focusInput(options);
    };

    Find.prototype.findPreConfirmed = function(delta) {
      var index;
      if (this.preConfirmedChars && this.getConfig("highlightFindChar")) {
        index = this.highlightTextInCursorRows(this.preConfirmedChars, "pre-confirm", this.getCount(-1) + delta, true);
        return this.count = index + 1;
      }
    };

    Find.prototype.repeatIfNecessary = function() {
      var currentFind, isSequentialExecution, ref2;
      currentFind = this.vimState.globalState.get("currentFind");
      isSequentialExecution = (ref2 = this.vimState.operationStack.getLastCommandName()) === "Find" || ref2 === "FindBackwards" || ref2 === "Till" || ref2 === "TillBackwards";
      if ((currentFind != null) && isSequentialExecution) {
        this.input = currentFind.input;
        return this.repeated = true;
      }
    };

    Find.prototype.isBackwards = function() {
      return this.backwards;
    };

    Find.prototype.execute = function() {
      var decorationType;
      Find.__super__.execute.apply(this, arguments);
      decorationType = "post-confirm";
      if (this.isAsTargetExceptSelect()) {
        decorationType += " long";
      }
      this.editor.component.getNextUpdatePromise().then((function(_this) {
        return function() {
          return _this.highlightTextInCursorRows(_this.input, decorationType);
        };
      })(this));
    };

    Find.prototype.getPoint = function(fromPoint) {
      var indexWantAccess, points, ref2, regex, scanRange, translation;
      scanRange = this.editor.bufferRangeForBufferRow(fromPoint.row);
      points = [];
      regex = this.getRegex(this.input);
      indexWantAccess = this.getCount(-1);
      translation = new Point(0, this.isBackwards() ? this.offset : -this.offset);
      if (this.repeated) {
        fromPoint = fromPoint.translate(translation.negate());
      }
      if (this.isBackwards()) {
        if (this.getConfig("findAcrossLines")) {
          scanRange.start = Point.ZERO;
        }
        this.editor.backwardsScanInBufferRange(regex, scanRange, function(arg) {
          var range, stop;
          range = arg.range, stop = arg.stop;
          if (range.start.isLessThan(fromPoint)) {
            points.push(range.start);
            if (points.length > indexWantAccess) {
              return stop();
            }
          }
        });
      } else {
        if (this.getConfig("findAcrossLines")) {
          scanRange.end = this.editor.getEofBufferPosition();
        }
        this.editor.scanInBufferRange(regex, scanRange, function(arg) {
          var range, stop;
          range = arg.range, stop = arg.stop;
          if (range.start.isGreaterThan(fromPoint)) {
            points.push(range.start);
            if (points.length > indexWantAccess) {
              return stop();
            }
          }
        });
      }
      return (ref2 = points[indexWantAccess]) != null ? ref2.translate(translation) : void 0;
    };

    Find.prototype.highlightTextInCursorRows = function(text, decorationType, index, adjustIndex) {
      if (index == null) {
        index = this.getCount(-1);
      }
      if (adjustIndex == null) {
        adjustIndex = false;
      }
      if (!this.getConfig("highlightFindChar")) {
        return;
      }
      return this.vimState.highlightFind.highlightCursorRows(this.getRegex(text), decorationType, this.isBackwards(), this.offset, index, adjustIndex);
    };

    Find.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      if (point != null) {
        cursor.setBufferPosition(point);
      } else {
        this.restoreEditorState();
      }
      if (!this.repeated) {
        return this.globalState.set('currentFind', this);
      }
    };

    Find.prototype.getRegex = function(term) {
      var modifiers;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      return new RegExp(_.escapeRegExp(term), modifiers);
    };

    return Find;

  })(Motion);

  FindBackwards = (function(superClass) {
    extend(FindBackwards, superClass);

    function FindBackwards() {
      return FindBackwards.__super__.constructor.apply(this, arguments);
    }

    FindBackwards.extend();

    FindBackwards.prototype.inclusive = false;

    FindBackwards.prototype.backwards = true;

    return FindBackwards;

  })(Find);

  Till = (function(superClass) {
    extend(Till, superClass);

    function Till() {
      return Till.__super__.constructor.apply(this, arguments);
    }

    Till.extend();

    Till.prototype.offset = 1;

    Till.prototype.getPoint = function() {
      this.point = Till.__super__.getPoint.apply(this, arguments);
      this.moveSucceeded = this.point != null;
      return this.point;
    };

    return Till;

  })(Find);

  TillBackwards = (function(superClass) {
    extend(TillBackwards, superClass);

    function TillBackwards() {
      return TillBackwards.__super__.constructor.apply(this, arguments);
    }

    TillBackwards.extend();

    TillBackwards.prototype.inclusive = false;

    TillBackwards.prototype.backwards = true;

    return TillBackwards;

  })(Till);

  MoveToMark = (function(superClass) {
    extend(MoveToMark, superClass);

    function MoveToMark() {
      return MoveToMark.__super__.constructor.apply(this, arguments);
    }

    MoveToMark.extend();

    MoveToMark.prototype.jump = true;

    MoveToMark.prototype.requireInput = true;

    MoveToMark.prototype.input = null;

    MoveToMark.prototype.initialize = function() {
      MoveToMark.__super__.initialize.apply(this, arguments);
      if (!this.isComplete()) {
        return this.readChar();
      }
    };

    MoveToMark.prototype.getPoint = function() {
      return this.vimState.mark.get(this.input);
    };

    MoveToMark.prototype.moveCursor = function(cursor) {
      var point;
      if (point = this.getPoint()) {
        cursor.setBufferPosition(point);
        return cursor.autoscroll({
          center: true
        });
      }
    };

    return MoveToMark;

  })(Motion);

  MoveToMarkLine = (function(superClass) {
    extend(MoveToMarkLine, superClass);

    function MoveToMarkLine() {
      return MoveToMarkLine.__super__.constructor.apply(this, arguments);
    }

    MoveToMarkLine.extend();

    MoveToMarkLine.prototype.wise = 'linewise';

    MoveToMarkLine.prototype.getPoint = function() {
      var point;
      if (point = MoveToMarkLine.__super__.getPoint.apply(this, arguments)) {
        return this.getFirstCharacterPositionForBufferRow(point.row);
      }
    };

    return MoveToMarkLine;

  })(MoveToMark);

  MoveToPreviousFoldStart = (function(superClass) {
    extend(MoveToPreviousFoldStart, superClass);

    function MoveToPreviousFoldStart() {
      return MoveToPreviousFoldStart.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldStart.extend();

    MoveToPreviousFoldStart.description = "Move to previous fold start";

    MoveToPreviousFoldStart.prototype.wise = 'characterwise';

    MoveToPreviousFoldStart.prototype.which = 'start';

    MoveToPreviousFoldStart.prototype.direction = 'prev';

    MoveToPreviousFoldStart.prototype.initialize = function() {
      MoveToPreviousFoldStart.__super__.initialize.apply(this, arguments);
      this.rows = this.getFoldRows(this.which);
      if (this.direction === 'prev') {
        return this.rows.reverse();
      }
    };

    MoveToPreviousFoldStart.prototype.getFoldRows = function(which) {
      var index, rows;
      index = which === 'start' ? 0 : 1;
      rows = getCodeFoldRowRanges(this.editor).map(function(rowRange) {
        return rowRange[index];
      });
      return _.sortBy(_.uniq(rows), function(row) {
        return row;
      });
    };

    MoveToPreviousFoldStart.prototype.getScanRows = function(cursor) {
      var cursorRow, isValidRow;
      cursorRow = cursor.getBufferRow();
      isValidRow = (function() {
        switch (this.direction) {
          case 'prev':
            return function(row) {
              return row < cursorRow;
            };
          case 'next':
            return function(row) {
              return row > cursorRow;
            };
        }
      }).call(this);
      return this.rows.filter(isValidRow);
    };

    MoveToPreviousFoldStart.prototype.detectRow = function(cursor) {
      return this.getScanRows(cursor)[0];
    };

    MoveToPreviousFoldStart.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          var row;
          if ((row = _this.detectRow(cursor)) != null) {
            return moveCursorToFirstCharacterAtRow(cursor, row);
          }
        };
      })(this));
    };

    return MoveToPreviousFoldStart;

  })(Motion);

  MoveToNextFoldStart = (function(superClass) {
    extend(MoveToNextFoldStart, superClass);

    function MoveToNextFoldStart() {
      return MoveToNextFoldStart.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldStart.extend();

    MoveToNextFoldStart.description = "Move to next fold start";

    MoveToNextFoldStart.prototype.direction = 'next';

    return MoveToNextFoldStart;

  })(MoveToPreviousFoldStart);

  MoveToPreviousFoldStartWithSameIndent = (function(superClass) {
    extend(MoveToPreviousFoldStartWithSameIndent, superClass);

    function MoveToPreviousFoldStartWithSameIndent() {
      return MoveToPreviousFoldStartWithSameIndent.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldStartWithSameIndent.extend();

    MoveToPreviousFoldStartWithSameIndent.description = "Move to previous same-indented fold start";

    MoveToPreviousFoldStartWithSameIndent.prototype.detectRow = function(cursor) {
      var baseIndentLevel, j, len, ref2, row;
      baseIndentLevel = this.getIndentLevelForBufferRow(cursor.getBufferRow());
      ref2 = this.getScanRows(cursor);
      for (j = 0, len = ref2.length; j < len; j++) {
        row = ref2[j];
        if (this.getIndentLevelForBufferRow(row) === baseIndentLevel) {
          return row;
        }
      }
      return null;
    };

    return MoveToPreviousFoldStartWithSameIndent;

  })(MoveToPreviousFoldStart);

  MoveToNextFoldStartWithSameIndent = (function(superClass) {
    extend(MoveToNextFoldStartWithSameIndent, superClass);

    function MoveToNextFoldStartWithSameIndent() {
      return MoveToNextFoldStartWithSameIndent.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldStartWithSameIndent.extend();

    MoveToNextFoldStartWithSameIndent.description = "Move to next same-indented fold start";

    MoveToNextFoldStartWithSameIndent.prototype.direction = 'next';

    return MoveToNextFoldStartWithSameIndent;

  })(MoveToPreviousFoldStartWithSameIndent);

  MoveToPreviousFoldEnd = (function(superClass) {
    extend(MoveToPreviousFoldEnd, superClass);

    function MoveToPreviousFoldEnd() {
      return MoveToPreviousFoldEnd.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFoldEnd.extend();

    MoveToPreviousFoldEnd.description = "Move to previous fold end";

    MoveToPreviousFoldEnd.prototype.which = 'end';

    return MoveToPreviousFoldEnd;

  })(MoveToPreviousFoldStart);

  MoveToNextFoldEnd = (function(superClass) {
    extend(MoveToNextFoldEnd, superClass);

    function MoveToNextFoldEnd() {
      return MoveToNextFoldEnd.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFoldEnd.extend();

    MoveToNextFoldEnd.description = "Move to next fold end";

    MoveToNextFoldEnd.prototype.direction = 'next';

    return MoveToNextFoldEnd;

  })(MoveToPreviousFoldEnd);

  MoveToPreviousFunction = (function(superClass) {
    extend(MoveToPreviousFunction, superClass);

    function MoveToPreviousFunction() {
      return MoveToPreviousFunction.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousFunction.extend();

    MoveToPreviousFunction.description = "Move to previous function";

    MoveToPreviousFunction.prototype.direction = 'prev';

    MoveToPreviousFunction.prototype.detectRow = function(cursor) {
      return _.detect(this.getScanRows(cursor), (function(_this) {
        return function(row) {
          return isIncludeFunctionScopeForRow(_this.editor, row);
        };
      })(this));
    };

    return MoveToPreviousFunction;

  })(MoveToPreviousFoldStart);

  MoveToNextFunction = (function(superClass) {
    extend(MoveToNextFunction, superClass);

    function MoveToNextFunction() {
      return MoveToNextFunction.__super__.constructor.apply(this, arguments);
    }

    MoveToNextFunction.extend();

    MoveToNextFunction.description = "Move to next function";

    MoveToNextFunction.prototype.direction = 'next';

    return MoveToNextFunction;

  })(MoveToPreviousFunction);

  MoveToPositionByScope = (function(superClass) {
    extend(MoveToPositionByScope, superClass);

    function MoveToPositionByScope() {
      return MoveToPositionByScope.__super__.constructor.apply(this, arguments);
    }

    MoveToPositionByScope.extend(false);

    MoveToPositionByScope.prototype.direction = 'backward';

    MoveToPositionByScope.prototype.scope = '.';

    MoveToPositionByScope.prototype.getPoint = function(fromPoint) {
      return detectScopeStartPositionForScope(this.editor, fromPoint, this.direction, this.scope);
    };

    MoveToPositionByScope.prototype.moveCursor = function(cursor) {
      return this.moveCursorCountTimes(cursor, (function(_this) {
        return function() {
          return _this.setBufferPositionSafely(cursor, _this.getPoint(cursor.getBufferPosition()));
        };
      })(this));
    };

    return MoveToPositionByScope;

  })(Motion);

  MoveToPreviousString = (function(superClass) {
    extend(MoveToPreviousString, superClass);

    function MoveToPreviousString() {
      return MoveToPreviousString.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousString.extend();

    MoveToPreviousString.description = "Move to previous string(searched by `string.begin` scope)";

    MoveToPreviousString.prototype.direction = 'backward';

    MoveToPreviousString.prototype.scope = 'string.begin';

    return MoveToPreviousString;

  })(MoveToPositionByScope);

  MoveToNextString = (function(superClass) {
    extend(MoveToNextString, superClass);

    function MoveToNextString() {
      return MoveToNextString.__super__.constructor.apply(this, arguments);
    }

    MoveToNextString.extend();

    MoveToNextString.description = "Move to next string(searched by `string.begin` scope)";

    MoveToNextString.prototype.direction = 'forward';

    return MoveToNextString;

  })(MoveToPreviousString);

  MoveToPreviousNumber = (function(superClass) {
    extend(MoveToPreviousNumber, superClass);

    function MoveToPreviousNumber() {
      return MoveToPreviousNumber.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousNumber.extend();

    MoveToPreviousNumber.prototype.direction = 'backward';

    MoveToPreviousNumber.description = "Move to previous number(searched by `constant.numeric` scope)";

    MoveToPreviousNumber.prototype.scope = 'constant.numeric';

    return MoveToPreviousNumber;

  })(MoveToPositionByScope);

  MoveToNextNumber = (function(superClass) {
    extend(MoveToNextNumber, superClass);

    function MoveToNextNumber() {
      return MoveToNextNumber.__super__.constructor.apply(this, arguments);
    }

    MoveToNextNumber.extend();

    MoveToNextNumber.description = "Move to next number(searched by `constant.numeric` scope)";

    MoveToNextNumber.prototype.direction = 'forward';

    return MoveToNextNumber;

  })(MoveToPreviousNumber);

  MoveToNextOccurrence = (function(superClass) {
    extend(MoveToNextOccurrence, superClass);

    function MoveToNextOccurrence() {
      return MoveToNextOccurrence.__super__.constructor.apply(this, arguments);
    }

    MoveToNextOccurrence.extend();

    MoveToNextOccurrence.commandScope = 'atom-text-editor.vim-mode-plus.has-occurrence';

    MoveToNextOccurrence.prototype.jump = true;

    MoveToNextOccurrence.prototype.direction = 'next';

    MoveToNextOccurrence.prototype.getRanges = function() {
      return this.vimState.occurrenceManager.getMarkers().map(function(marker) {
        return marker.getBufferRange();
      });
    };

    MoveToNextOccurrence.prototype.execute = function() {
      this.ranges = this.vimState.utils.sortRanges(this.getRanges());
      return MoveToNextOccurrence.__super__.execute.apply(this, arguments);
    };

    MoveToNextOccurrence.prototype.moveCursor = function(cursor) {
      var point, range;
      range = this.ranges[getIndex(this.getIndex(cursor.getBufferPosition()), this.ranges)];
      point = range.start;
      cursor.setBufferPosition(point, {
        autoscroll: false
      });
      if (cursor.isLastCursor()) {
        this.editor.unfoldBufferRow(point.row);
        smartScrollToBufferPosition(this.editor, point);
      }
      if (this.getConfig('flashOnMoveToOccurrence')) {
        return this.vimState.flash(range, {
          type: 'search'
        });
      }
    };

    MoveToNextOccurrence.prototype.getIndex = function(fromPoint) {
      var i, index, j, len, range, ref2;
      index = null;
      ref2 = this.ranges;
      for (i = j = 0, len = ref2.length; j < len; i = ++j) {
        range = ref2[i];
        if (!(range.start.isGreaterThan(fromPoint))) {
          continue;
        }
        index = i;
        break;
      }
      return (index != null ? index : 0) + this.getCount(-1);
    };

    return MoveToNextOccurrence;

  })(Motion);

  MoveToPreviousOccurrence = (function(superClass) {
    extend(MoveToPreviousOccurrence, superClass);

    function MoveToPreviousOccurrence() {
      return MoveToPreviousOccurrence.__super__.constructor.apply(this, arguments);
    }

    MoveToPreviousOccurrence.extend();

    MoveToPreviousOccurrence.prototype.direction = 'previous';

    MoveToPreviousOccurrence.prototype.getIndex = function(fromPoint) {
      var i, index, j, range, ref2;
      index = null;
      ref2 = this.ranges;
      for (i = j = ref2.length - 1; j >= 0; i = j += -1) {
        range = ref2[i];
        if (!(range.end.isLessThan(fromPoint))) {
          continue;
        }
        index = i;
        break;
      }
      return (index != null ? index : this.ranges.length - 1) - this.getCount(-1);
    };

    return MoveToPreviousOccurrence;

  })(MoveToNextOccurrence);

  MoveToPair = (function(superClass) {
    extend(MoveToPair, superClass);

    function MoveToPair() {
      return MoveToPair.__super__.constructor.apply(this, arguments);
    }

    MoveToPair.extend();

    MoveToPair.prototype.inclusive = true;

    MoveToPair.prototype.jump = true;

    MoveToPair.prototype.member = ['Parenthesis', 'CurlyBracket', 'SquareBracket'];

    MoveToPair.prototype.moveCursor = function(cursor) {
      return this.setBufferPositionSafely(cursor, this.getPoint(cursor));
    };

    MoveToPair.prototype.getPointForTag = function(point) {
      var closeRange, openRange, pairInfo;
      pairInfo = this["new"]("ATag").getPairInfo(point);
      if (pairInfo == null) {
        return null;
      }
      openRange = pairInfo.openRange, closeRange = pairInfo.closeRange;
      openRange = openRange.translate([0, +1], [0, -1]);
      closeRange = closeRange.translate([0, +1], [0, -1]);
      if (openRange.containsPoint(point) && (!point.isEqual(openRange.end))) {
        return closeRange.start;
      }
      if (closeRange.containsPoint(point) && (!point.isEqual(closeRange.end))) {
        return openRange.start;
      }
    };

    MoveToPair.prototype.getPoint = function(cursor) {
      var cursorPosition, cursorRow, end, point, range, start;
      cursorPosition = cursor.getBufferPosition();
      cursorRow = cursorPosition.row;
      if (point = this.getPointForTag(cursorPosition)) {
        return point;
      }
      range = this["new"]("AAnyPairAllowForwarding", {
        member: this.member
      }).getRange(cursor.selection);
      if (range == null) {
        return null;
      }
      start = range.start, end = range.end;
      if ((start.row === cursorRow) && start.isGreaterThanOrEqual(cursorPosition)) {
        return end.translate([0, -1]);
      } else if (end.row === cursorPosition.row) {
        return start;
      }
    };

    return MoveToPair;

  })(Motion);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxnNUVBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBRVIsT0EwQkksT0FBQSxDQUFRLFNBQVIsQ0ExQkosRUFDRSxvQ0FERixFQUNrQixzQ0FEbEIsRUFFRSw0Q0FGRixFQUVzQixnREFGdEIsRUFHRSxrREFIRixFQUlFLHdEQUpGLEVBSTRCLHNEQUo1QixFQUtFLGdEQUxGLEVBS3dCLGdEQUx4QixFQU1FLHNFQU5GLEVBT0UsNEJBUEYsRUFRRSw4Q0FSRixFQVNFLGtFQVRGLEVBVUUsNEJBVkYsRUFXRSxnREFYRixFQVlFLGdGQVpGLEVBYUUsZ0VBYkYsRUFjRSx3RUFkRixFQWVFLGtDQWZGLEVBZ0JFLGdEQWhCRixFQWlCRSxnQ0FqQkYsRUFrQkUsc0NBbEJGLEVBbUJFLDhCQW5CRixFQW9CRSx3QkFwQkYsRUFxQkUsOERBckJGLEVBc0JFLHNFQXRCRixFQXVCRSx3REF2QkYsRUF3QkUsZ0RBeEJGLEVBeUJFOztFQUdGLElBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFRDs7O0lBQ0osTUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztJQUNBLE1BQUMsQ0FBQSxhQUFELEdBQWdCOztxQkFDaEIsU0FBQSxHQUFXOztxQkFDWCxJQUFBLEdBQU07O3FCQUNOLElBQUEsR0FBTTs7cUJBQ04sY0FBQSxHQUFnQjs7cUJBQ2hCLGFBQUEsR0FBZTs7cUJBQ2YscUJBQUEsR0FBdUI7O0lBRVYsZ0JBQUE7TUFDWCx5Q0FBQSxTQUFBO01BRUEsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFFBQVo7UUFDRSxJQUFD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LENBQUwsQ0FBOUQ7QUFBQSxlQUFPLFVBQVUsQ0FBQyxNQUFsQjs7TUFDQSxJQUEwQixVQUFVLENBQUMsYUFBWCxDQUF5QixLQUF6QixDQUFBLElBQW9DLENBQUMsQ0FBSSxLQUFLLENBQUMsT0FBTixDQUFjLFVBQVUsQ0FBQyxHQUF6QixDQUFMLENBQTlEO0FBQUEsZUFBTyxTQUFTLENBQUMsTUFBakI7O0lBUGM7O3lCQVNoQixRQUFBLEdBQVUsU0FBQyxNQUFEO0FBQ1IsVUFBQTtNQUFBLGNBQUEsR0FBaUIsTUFBTSxDQUFDLGlCQUFQLENBQUE7TUFDakIsU0FBQSxHQUFZLGNBQWMsQ0FBQztNQUMzQixJQUFnQixLQUFBLEdBQVEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsY0FBaEIsQ0FBeEI7QUFBQSxlQUFPLE1BQVA7O01BR0EsS0FBQSxHQUFRLElBQUMsRUFBQSxHQUFBLEVBQUQsQ0FBSyx5QkFBTCxFQUFnQztRQUFFLFFBQUQsSUFBQyxDQUFBLE1BQUY7T0FBaEMsQ0FBMEMsQ0FBQyxRQUEzQyxDQUFvRCxNQUFNLENBQUMsU0FBM0Q7TUFDUixJQUFtQixhQUFuQjtBQUFBLGVBQU8sS0FBUDs7TUFDQyxtQkFBRCxFQUFRO01BQ1IsSUFBRyxDQUFDLEtBQUssQ0FBQyxHQUFOLEtBQWEsU0FBZCxDQUFBLElBQTZCLEtBQUssQ0FBQyxvQkFBTixDQUEyQixjQUEzQixDQUFoQztlQUVFLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWQsRUFGRjtPQUFBLE1BR0ssSUFBRyxHQUFHLENBQUMsR0FBSixLQUFXLGNBQWMsQ0FBQyxHQUE3QjtlQUdILE1BSEc7O0lBWkc7Ozs7S0FsQmE7QUFoc0N6QiIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57UG9pbnQsIFJhbmdlfSA9IHJlcXVpcmUgJ2F0b20nXG5cbntcbiAgbW92ZUN1cnNvckxlZnQsIG1vdmVDdXJzb3JSaWdodFxuICBtb3ZlQ3Vyc29yVXBTY3JlZW4sIG1vdmVDdXJzb3JEb3duU2NyZWVuXG4gIHBvaW50SXNBdFZpbUVuZE9mRmlsZVxuICBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3csIGdldExhc3RWaXNpYmxlU2NyZWVuUm93XG4gIGdldFZhbGlkVmltU2NyZWVuUm93LCBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93XG4gIHNvcnRSYW5nZXNcbiAgcG9pbnRJc09uV2hpdGVTcGFjZVxuICBtb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZVxuICBpc0VtcHR5Um93XG4gIGdldENvZGVGb2xkUm93UmFuZ2VzXG4gIGdldExhcmdlc3RGb2xkUmFuZ2VDb250YWluc0J1ZmZlclJvd1xuICBpc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93XG4gIGRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlXG4gIGdldEJ1ZmZlclJvd3NcbiAgZ2V0VGV4dEluU2NyZWVuUmFuZ2VcbiAgc2V0QnVmZmVyUm93XG4gIHNldEJ1ZmZlckNvbHVtblxuICBsaW1pdE51bWJlclxuICBnZXRJbmRleFxuICBzbWFydFNjcm9sbFRvQnVmZmVyUG9zaXRpb25cbiAgcG9pbnRJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvd1xuICBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3dcbiAgZmluZFJhbmdlSW5CdWZmZXJSb3dcbiAgc2F2ZUVkaXRvclN0YXRlXG59ID0gcmVxdWlyZSAnLi91dGlscydcblxuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcblxuY2xhc3MgTW90aW9uIGV4dGVuZHMgQmFzZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBAb3BlcmF0aW9uS2luZDogJ21vdGlvbidcbiAgaW5jbHVzaXZlOiBmYWxzZVxuICB3aXNlOiAnY2hhcmFjdGVyd2lzZSdcbiAganVtcDogZmFsc2VcbiAgdmVydGljYWxNb3Rpb246IGZhbHNlXG4gIG1vdmVTdWNjZWVkZWQ6IG51bGxcbiAgbW92ZVN1Y2Nlc3NPbkxpbmV3aXNlOiBmYWxzZVxuXG4gIGNvbnN0cnVjdG9yOiAtPlxuICAgIHN1cGVyXG5cbiAgICBpZiBAbW9kZSBpcyAndmlzdWFsJ1xuICAgICAgQHdpc2UgPSBAc3VibW9kZVxuICAgIEBpbml0aWFsaXplKClcblxuICBpc0xpbmV3aXNlOiAtPiBAd2lzZSBpcyAnbGluZXdpc2UnXG4gIGlzQmxvY2t3aXNlOiAtPiBAd2lzZSBpcyAnYmxvY2t3aXNlJ1xuXG4gIGZvcmNlV2lzZTogKHdpc2UpIC0+XG4gICAgaWYgd2lzZSBpcyAnY2hhcmFjdGVyd2lzZSdcbiAgICAgIGlmIEB3aXNlIGlzICdsaW5ld2lzZSdcbiAgICAgICAgQGluY2x1c2l2ZSA9IGZhbHNlXG4gICAgICBlbHNlXG4gICAgICAgIEBpbmNsdXNpdmUgPSBub3QgQGluY2x1c2l2ZVxuICAgIEB3aXNlID0gd2lzZVxuXG4gIHNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5OiAoY3Vyc29yLCBwb2ludCkgLT5cbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpIGlmIHBvaW50P1xuXG4gIHNldFNjcmVlblBvc2l0aW9uU2FmZWx5OiAoY3Vyc29yLCBwb2ludCkgLT5cbiAgICBjdXJzb3Iuc2V0U2NyZWVuUG9zaXRpb24ocG9pbnQpIGlmIHBvaW50P1xuXG4gIG1vdmVXaXRoU2F2ZUp1bXA6IChjdXJzb3IpIC0+XG4gICAgaWYgY3Vyc29yLmlzTGFzdEN1cnNvcigpIGFuZCBAanVtcFxuICAgICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgQG1vdmVDdXJzb3IoY3Vyc29yKVxuXG4gICAgaWYgY3Vyc29yUG9zaXRpb24/IGFuZCBub3QgY3Vyc29yUG9zaXRpb24uaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIEB2aW1TdGF0ZS5tYXJrLnNldCgnYCcsIGN1cnNvclBvc2l0aW9uKVxuICAgICAgQHZpbVN0YXRlLm1hcmsuc2V0KFwiJ1wiLCBjdXJzb3JQb3NpdGlvbilcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEBvcGVyYXRvcj9cbiAgICAgIEBzZWxlY3QoKVxuICAgIGVsc2VcbiAgICAgIEBtb3ZlV2l0aFNhdmVKdW1wKGN1cnNvcikgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKVxuICAgIEBlZGl0b3IubWVyZ2VDdXJzb3JzKClcbiAgICBAZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG5cbiAgIyBOT1RFOiBNb2RpZnkgc2VsZWN0aW9uIGJ5IG1vZHRpb24sIHNlbGVjdGlvbiBpcyBhbHJlYWR5IFwibm9ybWFsaXplZFwiIGJlZm9yZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZC5cbiAgc2VsZWN0OiAtPlxuICAgIGlzT3JXYXNWaXN1YWwgPSBAbW9kZSBpcyAndmlzdWFsJyBvciBAaXMoJ0N1cnJlbnRTZWxlY3Rpb24nKSAjIG5lZWQgdG8gY2FyZSB3YXMgdmlzdWFsIGZvciBgLmAgcmVwZWF0ZWQuXG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKVxuICAgICAgc2VsZWN0aW9uLm1vZGlmeVNlbGVjdGlvbiA9PlxuICAgICAgICBAbW92ZVdpdGhTYXZlSnVtcChzZWxlY3Rpb24uY3Vyc29yKVxuXG4gICAgICBzdWNjZWVkZWQgPSBAbW92ZVN1Y2NlZWRlZCA/IG5vdCBzZWxlY3Rpb24uaXNFbXB0eSgpIG9yIChAbW92ZVN1Y2Nlc3NPbkxpbmV3aXNlIGFuZCBAaXNMaW5ld2lzZSgpKVxuICAgICAgaWYgaXNPcldhc1Zpc3VhbCBvciAoc3VjY2VlZGVkIGFuZCAoQGluY2x1c2l2ZSBvciBAaXNMaW5ld2lzZSgpKSlcbiAgICAgICAgJHNlbGVjdGlvbiA9IEBzd3JhcChzZWxlY3Rpb24pXG4gICAgICAgICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXModHJ1ZSkgIyBzYXZlIHByb3BlcnR5IG9mIFwiYWxyZWFkeS1ub3JtYWxpemVkLXNlbGVjdGlvblwiXG4gICAgICAgICRzZWxlY3Rpb24uYXBwbHlXaXNlKEB3aXNlKVxuXG4gICAgQHZpbVN0YXRlLmdldExhc3RCbG9ja3dpc2VTZWxlY3Rpb24oKS5hdXRvc2Nyb2xsKCkgaWYgQHdpc2UgaXMgJ2Jsb2Nrd2lzZSdcblxuICBzZXRDdXJzb3JCdWZmZXJSb3c6IChjdXJzb3IsIHJvdywgb3B0aW9ucykgLT5cbiAgICBpZiBAdmVydGljYWxNb3Rpb24gYW5kIG5vdCBAZ2V0Q29uZmlnKCdzdGF5T25WZXJ0aWNhbE1vdGlvbicpXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cocm93KSwgb3B0aW9ucylcbiAgICBlbHNlXG4gICAgICBzZXRCdWZmZXJSb3coY3Vyc29yLCByb3csIG9wdGlvbnMpXG5cbiAgIyBbTk9URV1cbiAgIyBTaW5jZSB0aGlzIGZ1bmN0aW9uIGNoZWNrcyBjdXJzb3IgcG9zaXRpb24gY2hhbmdlLCBhIGN1cnNvciBwb3NpdGlvbiBNVVNUIGJlXG4gICMgdXBkYXRlZCBJTiBjYWxsYmFjayg9Zm4pXG4gICMgVXBkYXRpbmcgcG9pbnQgb25seSBpbiBjYWxsYmFjayBpcyB3cm9uZy11c2Ugb2YgdGhpcyBmdW5jaXRvbixcbiAgIyBzaW5jZSBpdCBzdG9wcyBpbW1lZGlhdGVseSBiZWNhdXNlIG9mIG5vdCBjdXJzb3IgcG9zaXRpb24gY2hhbmdlLlxuICBtb3ZlQ3Vyc29yQ291bnRUaW1lczogKGN1cnNvciwgZm4pIC0+XG4gICAgb2xkUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIEBjb3VudFRpbWVzIEBnZXRDb3VudCgpLCAoc3RhdGUpIC0+XG4gICAgICBmbihzdGF0ZSlcbiAgICAgIGlmIChuZXdQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKS5pc0VxdWFsKG9sZFBvc2l0aW9uKVxuICAgICAgICBzdGF0ZS5zdG9wKClcbiAgICAgIG9sZFBvc2l0aW9uID0gbmV3UG9zaXRpb25cblxuICBpc0Nhc2VTZW5zaXRpdmU6ICh0ZXJtKSAtPlxuICAgIGlmIEBnZXRDb25maWcoXCJ1c2VTbWFydGNhc2VGb3Ije0BjYXNlU2Vuc2l0aXZpdHlLaW5kfVwiKVxuICAgICAgdGVybS5zZWFyY2goL1tBLVpdLykgaXNudCAtMVxuICAgIGVsc2VcbiAgICAgIG5vdCBAZ2V0Q29uZmlnKFwiaWdub3JlQ2FzZUZvciN7QGNhc2VTZW5zaXRpdml0eUtpbmR9XCIpXG5cbiMgVXNlZCBhcyBvcGVyYXRvcidzIHRhcmdldCBpbiB2aXN1YWwtbW9kZS5cbmNsYXNzIEN1cnJlbnRTZWxlY3Rpb24gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZChmYWxzZSlcbiAgc2VsZWN0aW9uRXh0ZW50OiBudWxsXG4gIGJsb2Nrd2lzZVNlbGVjdGlvbkV4dGVudDogbnVsbFxuICBpbmNsdXNpdmU6IHRydWVcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQHBvaW50SW5mb0J5Q3Vyc29yID0gbmV3IE1hcFxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIGlmIEBpc0Jsb2Nrd2lzZSgpXG4gICAgICAgIEBibG9ja3dpc2VTZWxlY3Rpb25FeHRlbnQgPSBAc3dyYXAoY3Vyc29yLnNlbGVjdGlvbikuZ2V0QmxvY2t3aXNlU2VsZWN0aW9uRXh0ZW50KClcbiAgICAgIGVsc2VcbiAgICAgICAgQHNlbGVjdGlvbkV4dGVudCA9IEBlZGl0b3IuZ2V0U2VsZWN0ZWRCdWZmZXJSYW5nZSgpLmdldEV4dGVudCgpXG4gICAgZWxzZVxuICAgICAgIyBgLmAgcmVwZWF0IGNhc2VcbiAgICAgIHBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgICAgaWYgQGJsb2Nrd2lzZVNlbGVjdGlvbkV4dGVudD9cbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYW5zbGF0ZShAYmxvY2t3aXNlU2VsZWN0aW9uRXh0ZW50KSlcbiAgICAgIGVsc2VcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYXZlcnNlKEBzZWxlY3Rpb25FeHRlbnQpKVxuXG4gIHNlbGVjdDogLT5cbiAgICBpZiBAbW9kZSBpcyAndmlzdWFsJ1xuICAgICAgc3VwZXJcbiAgICBlbHNlXG4gICAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpIHdoZW4gcG9pbnRJbmZvID0gQHBvaW50SW5mb0J5Q3Vyc29yLmdldChjdXJzb3IpXG4gICAgICAgIHtjdXJzb3JQb3NpdGlvbiwgc3RhcnRPZlNlbGVjdGlvbn0gPSBwb2ludEluZm9cbiAgICAgICAgaWYgY3Vyc29yUG9zaXRpb24uaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oc3RhcnRPZlNlbGVjdGlvbilcbiAgICAgIHN1cGVyXG5cbiAgICAjICogUHVycG9zZSBvZiBwb2ludEluZm9CeUN1cnNvcj8gc2VlICMyMzUgZm9yIGRldGFpbC5cbiAgICAjIFdoZW4gc3RheU9uVHJhbnNmb3JtU3RyaW5nIGlzIGVuYWJsZWQsIGN1cnNvciBwb3MgaXMgbm90IHNldCBvbiBzdGFydCBvZlxuICAgICMgb2Ygc2VsZWN0ZWQgcmFuZ2UuXG4gICAgIyBCdXQgSSB3YW50IGZvbGxvd2luZyBiZWhhdmlvciwgc28gbmVlZCB0byBwcmVzZXJ2ZSBwb3NpdGlvbiBpbmZvLlxuICAgICMgIDEuIGB2aj4uYCAtPiBpbmRlbnQgc2FtZSB0d28gcm93cyByZWdhcmRsZXNzIG9mIGN1cnJlbnQgY3Vyc29yJ3Mgcm93LlxuICAgICMgIDIuIGB2aj5qLmAgLT4gaW5kZW50IHR3byByb3dzIGZyb20gY3Vyc29yJ3Mgcm93LlxuICAgIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICAgIHN0YXJ0T2ZTZWxlY3Rpb24gPSBjdXJzb3Iuc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkuc3RhcnRcbiAgICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIEBwb2ludEluZm9CeUN1cnNvci5zZXQoY3Vyc29yLCB7c3RhcnRPZlNlbGVjdGlvbiwgY3Vyc29yUG9zaXRpb259KVxuXG5jbGFzcyBNb3ZlTGVmdCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBhbGxvd1dyYXAgPSBAZ2V0Q29uZmlnKCd3cmFwTGVmdFJpZ2h0TW90aW9uJylcbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCAtPlxuICAgICAgbW92ZUN1cnNvckxlZnQoY3Vyc29yLCB7YWxsb3dXcmFwfSlcblxuY2xhc3MgTW92ZVJpZ2h0IGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBjYW5XcmFwVG9OZXh0TGluZTogKGN1cnNvcikgLT5cbiAgICBpZiBAaXNBc1RhcmdldEV4Y2VwdFNlbGVjdCgpIGFuZCBub3QgY3Vyc29yLmlzQXRFbmRPZkxpbmUoKVxuICAgICAgZmFsc2VcbiAgICBlbHNlXG4gICAgICBAZ2V0Q29uZmlnKCd3cmFwTGVmdFJpZ2h0TW90aW9uJylcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsID0+XG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhjdXJzb3JQb3NpdGlvbi5yb3cpXG4gICAgICBhbGxvd1dyYXAgPSBAY2FuV3JhcFRvTmV4dExpbmUoY3Vyc29yKVxuICAgICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvcilcbiAgICAgIGlmIGN1cnNvci5pc0F0RW5kT2ZMaW5lKCkgYW5kIGFsbG93V3JhcCBhbmQgbm90IHBvaW50SXNBdFZpbUVuZE9mRmlsZShAZWRpdG9yLCBjdXJzb3JQb3NpdGlvbilcbiAgICAgICAgbW92ZUN1cnNvclJpZ2h0KGN1cnNvciwge2FsbG93V3JhcH0pXG5cbmNsYXNzIE1vdmVSaWdodEJ1ZmZlckNvbHVtbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgc2V0QnVmZmVyQ29sdW1uKGN1cnNvciwgY3Vyc29yLmdldEJ1ZmZlckNvbHVtbigpICsgQGdldENvdW50KCkpXG5cbmNsYXNzIE1vdmVVcCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICB3cmFwOiBmYWxzZVxuXG4gIGdldEJ1ZmZlclJvdzogKHJvdykgLT5cbiAgICByb3cgPSBAZ2V0TmV4dFJvdyhyb3cpXG4gICAgaWYgQGVkaXRvci5pc0ZvbGRlZEF0QnVmZmVyUm93KHJvdylcbiAgICAgIGdldExhcmdlc3RGb2xkUmFuZ2VDb250YWluc0J1ZmZlclJvdyhAZWRpdG9yLCByb3cpLnN0YXJ0LnJvd1xuICAgIGVsc2VcbiAgICAgIHJvd1xuXG4gIGdldE5leHRSb3c6IChyb3cpIC0+XG4gICAgbWluID0gMFxuICAgIGlmIEB3cmFwIGFuZCByb3cgaXMgbWluXG4gICAgICBAZ2V0VmltTGFzdEJ1ZmZlclJvdygpXG4gICAgZWxzZVxuICAgICAgbGltaXROdW1iZXIocm93IC0gMSwge21pbn0pXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgc2V0QnVmZmVyUm93KGN1cnNvciwgQGdldEJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpKVxuXG5jbGFzcyBNb3ZlVXBXcmFwIGV4dGVuZHMgTW92ZVVwXG4gIEBleHRlbmQoKVxuICB3cmFwOiB0cnVlXG5cbmNsYXNzIE1vdmVEb3duIGV4dGVuZHMgTW92ZVVwXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIHdyYXA6IGZhbHNlXG5cbiAgZ2V0QnVmZmVyUm93OiAocm93KSAtPlxuICAgIGlmIEBlZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgICByb3cgPSBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3coQGVkaXRvciwgcm93KS5lbmQucm93XG4gICAgQGdldE5leHRSb3cocm93KVxuXG4gIGdldE5leHRSb3c6IChyb3cpIC0+XG4gICAgbWF4ID0gQGdldFZpbUxhc3RCdWZmZXJSb3coKVxuICAgIGlmIEB3cmFwIGFuZCByb3cgPj0gbWF4XG4gICAgICAwXG4gICAgZWxzZVxuICAgICAgbGltaXROdW1iZXIocm93ICsgMSwge21heH0pXG5cbmNsYXNzIE1vdmVEb3duV3JhcCBleHRlbmRzIE1vdmVEb3duXG4gIEBleHRlbmQoKVxuICB3cmFwOiB0cnVlXG5cbmNsYXNzIE1vdmVVcFNjcmVlbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBkaXJlY3Rpb246ICd1cCdcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsIC0+XG4gICAgICBtb3ZlQ3Vyc29yVXBTY3JlZW4oY3Vyc29yKVxuXG5jbGFzcyBNb3ZlRG93blNjcmVlbiBleHRlbmRzIE1vdmVVcFNjcmVlblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBkaXJlY3Rpb246ICdkb3duJ1xuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgLT5cbiAgICAgIG1vdmVDdXJzb3JEb3duU2NyZWVuKGN1cnNvcilcblxuIyBNb3ZlIGRvd24vdXAgdG8gRWRnZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNlZSB0OW1kL2F0b20tdmltLW1vZGUtcGx1cyMyMzZcbiMgQXQgbGVhc3QgdjEuNy4wLiBidWZmZXJQb3NpdGlvbiBhbmQgc2NyZWVuUG9zaXRpb24gY2Fubm90IGNvbnZlcnQgYWNjdXJhdGVseVxuIyB3aGVuIHJvdyBpcyBmb2xkZWQuXG5jbGFzcyBNb3ZlVXBUb0VkZ2UgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAganVtcDogdHJ1ZVxuICBkaXJlY3Rpb246ICd1cCdcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgY3Vyc29yIHVwIHRvICoqZWRnZSoqIGNoYXIgYXQgc2FtZS1jb2x1bW5cIlxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIEBzZXRTY3JlZW5Qb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IuZ2V0U2NyZWVuUG9zaXRpb24oKSkpXG5cbiAgZ2V0UG9pbnQ6IChmcm9tUG9pbnQpIC0+XG4gICAgY29sdW1uID0gZnJvbVBvaW50LmNvbHVtblxuICAgIGZvciByb3cgaW4gQGdldFNjYW5Sb3dzKGZyb21Qb2ludCkgd2hlbiBAaXNFZGdlKHBvaW50ID0gbmV3IFBvaW50KHJvdywgY29sdW1uKSlcbiAgICAgIHJldHVybiBwb2ludFxuXG4gIGdldFNjYW5Sb3dzOiAoe3Jvd30pIC0+XG4gICAgdmFsaWRSb3cgPSBnZXRWYWxpZFZpbVNjcmVlblJvdy5iaW5kKG51bGwsIEBlZGl0b3IpXG4gICAgc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3VwJyB0aGVuIFt2YWxpZFJvdyhyb3cgLSAxKS4uMF1cbiAgICAgIHdoZW4gJ2Rvd24nIHRoZW4gW3ZhbGlkUm93KHJvdyArIDEpLi5AZ2V0VmltTGFzdFNjcmVlblJvdygpXVxuXG4gIGlzRWRnZTogKHBvaW50KSAtPlxuICAgIGlmIEBpc1N0b3BwYWJsZVBvaW50KHBvaW50KVxuICAgICAgIyBJZiBvbmUgb2YgYWJvdmUvYmVsb3cgcG9pbnQgd2FzIG5vdCBzdG9wcGFibGUsIGl0J3MgRWRnZSFcbiAgICAgIGFib3ZlID0gcG9pbnQudHJhbnNsYXRlKFstMSwgMF0pXG4gICAgICBiZWxvdyA9IHBvaW50LnRyYW5zbGF0ZShbKzEsIDBdKVxuICAgICAgKG5vdCBAaXNTdG9wcGFibGVQb2ludChhYm92ZSkpIG9yIChub3QgQGlzU3RvcHBhYmxlUG9pbnQoYmVsb3cpKVxuICAgIGVsc2VcbiAgICAgIGZhbHNlXG5cbiAgaXNTdG9wcGFibGVQb2ludDogKHBvaW50KSAtPlxuICAgIGlmIEBpc05vbldoaXRlU3BhY2VQb2ludChwb2ludClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBsZWZ0UG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsIC0xXSlcbiAgICAgIHJpZ2h0UG9pbnQgPSBwb2ludC50cmFuc2xhdGUoWzAsICsxXSlcbiAgICAgIEBpc05vbldoaXRlU3BhY2VQb2ludChsZWZ0UG9pbnQpIGFuZCBAaXNOb25XaGl0ZVNwYWNlUG9pbnQocmlnaHRQb2ludClcblxuICBpc05vbldoaXRlU3BhY2VQb2ludDogKHBvaW50KSAtPlxuICAgIGNoYXIgPSBnZXRUZXh0SW5TY3JlZW5SYW5nZShAZWRpdG9yLCBSYW5nZS5mcm9tUG9pbnRXaXRoRGVsdGEocG9pbnQsIDAsIDEpKVxuICAgIGNoYXI/IGFuZCAvXFxTLy50ZXN0KGNoYXIpXG5cbmNsYXNzIE1vdmVEb3duVG9FZGdlIGV4dGVuZHMgTW92ZVVwVG9FZGdlXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSBjdXJzb3IgZG93biB0byAqKmVkZ2UqKiBjaGFyIGF0IHNhbWUtY29sdW1uXCJcbiAgZGlyZWN0aW9uOiAnZG93bidcblxuIyB3b3JkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRXb3JkIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IG51bGxcblxuICBnZXRQb2ludDogKHBhdHRlcm4sIGZyb20pIC0+XG4gICAgd29yZFJhbmdlID0gbnVsbFxuICAgIGZvdW5kID0gZmFsc2VcbiAgICB2aW1FT0YgPSBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oQGVkaXRvcilcblxuICAgIEBzY2FuRm9yd2FyZCBwYXR0ZXJuLCB7ZnJvbX0sICh7cmFuZ2UsIG1hdGNoVGV4dCwgc3RvcH0pIC0+XG4gICAgICB3b3JkUmFuZ2UgPSByYW5nZVxuICAgICAgIyBJZ25vcmUgJ2VtcHR5IGxpbmUnIG1hdGNoZXMgYmV0d2VlbiAnXFxyJyBhbmQgJ1xcbidcbiAgICAgIHJldHVybiBpZiBtYXRjaFRleHQgaXMgJycgYW5kIHJhbmdlLnN0YXJ0LmNvbHVtbiBpc250IDBcbiAgICAgIGlmIHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbSlcbiAgICAgICAgZm91bmQgPSB0cnVlXG4gICAgICAgIHN0b3AoKVxuXG4gICAgaWYgZm91bmRcbiAgICAgIHBvaW50ID0gd29yZFJhbmdlLnN0YXJ0XG4gICAgICBpZiBwb2ludElzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93KEBlZGl0b3IsIHBvaW50KSBhbmQgbm90IHBvaW50LmlzRXF1YWwodmltRU9GKVxuICAgICAgICBwb2ludC50cmF2ZXJzZShbMSwgMF0pXG4gICAgICBlbHNlXG4gICAgICAgIHBvaW50XG4gICAgZWxzZVxuICAgICAgd29yZFJhbmdlPy5lbmQgPyBmcm9tXG5cbiAgIyBTcGVjaWFsIGNhc2U6IFwiY3dcIiBhbmQgXCJjV1wiIGFyZSB0cmVhdGVkIGxpa2UgXCJjZVwiIGFuZCBcImNFXCIgaWYgdGhlIGN1cnNvciBpc1xuICAjIG9uIGEgbm9uLWJsYW5rLiAgVGhpcyBpcyBiZWNhdXNlIFwiY3dcIiBpcyBpbnRlcnByZXRlZCBhcyBjaGFuZ2Utd29yZCwgYW5kIGFcbiAgIyB3b3JkIGRvZXMgbm90IGluY2x1ZGUgdGhlIGZvbGxvd2luZyB3aGl0ZSBzcGFjZS4gIHtWaTogXCJjd1wiIHdoZW4gb24gYSBibGFua1xuICAjIGZvbGxvd2VkIGJ5IG90aGVyIGJsYW5rcyBjaGFuZ2VzIG9ubHkgdGhlIGZpcnN0IGJsYW5rOyB0aGlzIGlzIHByb2JhYmx5IGFcbiAgIyBidWcsIGJlY2F1c2UgXCJkd1wiIGRlbGV0ZXMgYWxsIHRoZSBibGFua3N9XG4gICNcbiAgIyBBbm90aGVyIHNwZWNpYWwgY2FzZTogV2hlbiB1c2luZyB0aGUgXCJ3XCIgbW90aW9uIGluIGNvbWJpbmF0aW9uIHdpdGggYW5cbiAgIyBvcGVyYXRvciBhbmQgdGhlIGxhc3Qgd29yZCBtb3ZlZCBvdmVyIGlzIGF0IHRoZSBlbmQgb2YgYSBsaW5lLCB0aGUgZW5kIG9mXG4gICMgdGhhdCB3b3JkIGJlY29tZXMgdGhlIGVuZCBvZiB0aGUgb3BlcmF0ZWQgdGV4dCwgbm90IHRoZSBmaXJzdCB3b3JkIGluIHRoZVxuICAjIG5leHQgbGluZS5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgcmV0dXJuIGlmIHBvaW50SXNBdFZpbUVuZE9mRmlsZShAZWRpdG9yLCBjdXJzb3JQb3NpdGlvbilcbiAgICB3YXNPbldoaXRlU3BhY2UgPSBwb2ludElzT25XaGl0ZVNwYWNlKEBlZGl0b3IsIGN1cnNvclBvc2l0aW9uKVxuXG4gICAgaXNBc1RhcmdldEV4Y2VwdFNlbGVjdCA9IEBpc0FzVGFyZ2V0RXhjZXB0U2VsZWN0KClcbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCAoe2lzRmluYWx9KSA9PlxuICAgICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgaWYgaXNFbXB0eVJvdyhAZWRpdG9yLCBjdXJzb3JQb3NpdGlvbi5yb3cpIGFuZCBpc0FzVGFyZ2V0RXhjZXB0U2VsZWN0XG4gICAgICAgIHBvaW50ID0gY3Vyc29yUG9zaXRpb24udHJhdmVyc2UoWzEsIDBdKVxuICAgICAgZWxzZVxuICAgICAgICBwYXR0ZXJuID0gQHdvcmRSZWdleCA/IGN1cnNvci53b3JkUmVnRXhwKClcbiAgICAgICAgcG9pbnQgPSBAZ2V0UG9pbnQocGF0dGVybiwgY3Vyc29yUG9zaXRpb24pXG4gICAgICAgIGlmIGlzRmluYWwgYW5kIGlzQXNUYXJnZXRFeGNlcHRTZWxlY3RcbiAgICAgICAgICBpZiBAb3BlcmF0b3IuaXMoJ0NoYW5nZScpIGFuZCAobm90IHdhc09uV2hpdGVTcGFjZSlcbiAgICAgICAgICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pXG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcG9pbnQgPSBQb2ludC5taW4ocG9pbnQsIGdldEVuZE9mTGluZUZvckJ1ZmZlclJvdyhAZWRpdG9yLCBjdXJzb3JQb3NpdGlvbi5yb3cpKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4jIGJcbmNsYXNzIE1vdmVUb1ByZXZpb3VzV29yZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiBudWxsXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0QmVnaW5uaW5nT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuY2xhc3MgTW92ZVRvRW5kT2ZXb3JkIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IG51bGxcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgbW92ZVRvTmV4dEVuZE9mV29yZDogKGN1cnNvcikgLT5cbiAgICBtb3ZlQ3Vyc29yVG9OZXh0Tm9uV2hpdGVzcGFjZShjdXJzb3IpXG4gICAgcG9pbnQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSkudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgcG9pbnQgPSBQb2ludC5taW4ocG9pbnQsIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsID0+XG4gICAgICBvcmlnaW5hbFBvaW50ID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIEBtb3ZlVG9OZXh0RW5kT2ZXb3JkKGN1cnNvcilcbiAgICAgIGlmIG9yaWdpbmFsUG9pbnQuaXNFcXVhbChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgICAgIyBSZXRyeSBmcm9tIHJpZ2h0IGNvbHVtbiBpZiBjdXJzb3Igd2FzIGFscmVhZHkgb24gRW5kT2ZXb3JkXG4gICAgICAgIGN1cnNvci5tb3ZlUmlnaHQoKVxuICAgICAgICBAbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG5cbiMgW1RPRE86IEltcHJvdmUsIGFjY3VyYWN5XVxuY2xhc3MgTW92ZVRvUHJldmlvdXNFbmRPZldvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmRcbiAgQGV4dGVuZCgpXG4gIGluY2x1c2l2ZTogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgdGltZXMgPSBAZ2V0Q291bnQoKVxuICAgIHdvcmRSYW5nZSA9IGN1cnNvci5nZXRDdXJyZW50V29yZEJ1ZmZlclJhbmdlKClcbiAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAjIGlmIHdlJ3JlIGluIHRoZSBtaWRkbGUgb2YgYSB3b3JkIHRoZW4gd2UgbmVlZCB0byBtb3ZlIHRvIGl0cyBzdGFydFxuICAgIGlmIGN1cnNvclBvc2l0aW9uLmlzR3JlYXRlclRoYW4od29yZFJhbmdlLnN0YXJ0KSBhbmQgY3Vyc29yUG9zaXRpb24uaXNMZXNzVGhhbih3b3JkUmFuZ2UuZW5kKVxuICAgICAgdGltZXMgKz0gMVxuXG4gICAgZm9yIFsxLi50aW1lc11cbiAgICAgIHBvaW50ID0gY3Vyc29yLmdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgICBAbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG4gICAgaWYgY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkuaXNHcmVhdGVyVGhhbk9yRXF1YWwoY3Vyc29yUG9zaXRpb24pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oWzAsIDBdKVxuXG4gIG1vdmVUb05leHRFbmRPZldvcmQ6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBjdXJzb3IuZ2V0RW5kT2ZDdXJyZW50V29yZEJ1ZmZlclBvc2l0aW9uKHtAd29yZFJlZ2V4fSkudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgcG9pbnQgPSBQb2ludC5taW4ocG9pbnQsIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuIyBXaG9sZSB3b3JkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXiR8XFxTKy9nXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzV2hvbGVXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IC9eJHxcXFMrL2dcblxuY2xhc3MgTW92ZVRvRW5kT2ZXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmRcbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogL1xcUysvXG5cbiMgW1RPRE86IEltcHJvdmUsIGFjY3VyYWN5XVxuY2xhc3MgTW92ZVRvUHJldmlvdXNFbmRPZldob2xlV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IC9cXFMrL1xuXG4jIEFscGhhbnVtZXJpYyB3b3JkIFtFeHBlcmltZW50YWxdXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRBbHBoYW51bWVyaWNXb3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgYWxwaGFudW1lcmljKGAvXFx3Ky9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvXFx3Ky9nXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzQWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgYWxwaGFudW1lcmljKGAvXFx3Ky9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvXFx3Ky9cblxuY2xhc3MgTW92ZVRvRW5kT2ZBbHBoYW51bWVyaWNXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBlbmQgb2YgYWxwaGFudW1lcmljKGAvXFx3Ky9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvXFx3Ky9cblxuIyBBbHBoYW51bWVyaWMgd29yZCBbRXhwZXJpbWVudGFsXVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0U21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgc21hcnQgd29yZCAoYC9bXFx3LV0rL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9bXFx3LV0rL2dcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTbWFydFdvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIHNtYXJ0IHdvcmQgKGAvW1xcdy1dKy9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9cblxuY2xhc3MgTW92ZVRvRW5kT2ZTbWFydFdvcmQgZXh0ZW5kcyBNb3ZlVG9FbmRPZldvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIGVuZCBvZiBzbWFydCB3b3JkIChgL1tcXHctXSsvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1tcXHctXSsvXG5cbiMgU3Vid29yZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0U3Vid29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkXG4gIEBleHRlbmQoKVxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEB3b3JkUmVnZXggPSBjdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgc3VwZXJcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTdWJ3b3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEB3b3JkUmVnZXggPSBjdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgc3VwZXJcblxuY2xhc3MgTW92ZVRvRW5kT2ZTdWJ3b3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEB3b3JkUmVnZXggPSBjdXJzb3Iuc3Vid29yZFJlZ0V4cCgpXG4gICAgc3VwZXJcblxuIyBTZW50ZW5jZVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFNlbnRlbmNlIGlzIGRlZmluZWQgYXMgYmVsb3dcbiMgIC0gZW5kIHdpdGggWycuJywgJyEnLCAnPyddXG4jICAtIG9wdGlvbmFsbHkgZm9sbG93ZWQgYnkgWycpJywgJ10nLCAnXCInLCBcIidcIl1cbiMgIC0gZm9sbG93ZWQgYnkgWyckJywgJyAnLCAnXFx0J11cbiMgIC0gcGFyYWdyYXBoIGJvdW5kYXJ5IGlzIGFsc28gc2VudGVuY2UgYm91bmRhcnlcbiMgIC0gc2VjdGlvbiBib3VuZGFyeSBpcyBhbHNvIHNlbnRlbmNlIGJvdW5kYXJ5KGlnbm9yZSlcbmNsYXNzIE1vdmVUb05leHRTZW50ZW5jZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAganVtcDogdHJ1ZVxuICBzZW50ZW5jZVJlZ2V4OiAvLy8oPzpbXFwuIVxcP11bXFwpXFxdXCInXSpcXHMrKXwoXFxufFxcclxcbikvLy9nXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgQHNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5KGN1cnNvciwgQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKSlcblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBpZiBAZGlyZWN0aW9uIGlzICduZXh0J1xuICAgICAgQGdldE5leHRTdGFydE9mU2VudGVuY2UoZnJvbVBvaW50KVxuICAgIGVsc2UgaWYgQGRpcmVjdGlvbiBpcyAncHJldmlvdXMnXG4gICAgICBAZ2V0UHJldmlvdXNTdGFydE9mU2VudGVuY2UoZnJvbVBvaW50KVxuXG4gIGlzQmxhbmtSb3c6IChyb3cpIC0+XG4gICAgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcblxuICBnZXROZXh0U3RhcnRPZlNlbnRlbmNlOiAoZnJvbSkgLT5cbiAgICBmb3VuZFBvaW50ID0gbnVsbFxuICAgIEBzY2FuRm9yd2FyZCBAc2VudGVuY2VSZWdleCwge2Zyb219LCAoe3JhbmdlLCBtYXRjaFRleHQsIG1hdGNoLCBzdG9wfSkgPT5cbiAgICAgIGlmIG1hdGNoWzFdP1xuICAgICAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBbcmFuZ2Uuc3RhcnQucm93LCByYW5nZS5lbmQucm93XVxuICAgICAgICByZXR1cm4gaWYgQHNraXBCbGFua1JvdyBhbmQgQGlzQmxhbmtSb3coZW5kUm93KVxuICAgICAgICBpZiBAaXNCbGFua1JvdyhzdGFydFJvdykgaXNudCBAaXNCbGFua1JvdyhlbmRSb3cpXG4gICAgICAgICAgZm91bmRQb2ludCA9IEBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KGVuZFJvdylcbiAgICAgIGVsc2VcbiAgICAgICAgZm91bmRQb2ludCA9IHJhbmdlLmVuZFxuICAgICAgc3RvcCgpIGlmIGZvdW5kUG9pbnQ/XG4gICAgZm91bmRQb2ludCA/IEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpXG5cbiAgZ2V0UHJldmlvdXNTdGFydE9mU2VudGVuY2U6IChmcm9tKSAtPlxuICAgIGZvdW5kUG9pbnQgPSBudWxsXG4gICAgQHNjYW5CYWNrd2FyZCBAc2VudGVuY2VSZWdleCwge2Zyb219LCAoe3JhbmdlLCBtYXRjaCwgc3RvcCwgbWF0Y2hUZXh0fSkgPT5cbiAgICAgIGlmIG1hdGNoWzFdP1xuICAgICAgICBbc3RhcnRSb3csIGVuZFJvd10gPSBbcmFuZ2Uuc3RhcnQucm93LCByYW5nZS5lbmQucm93XVxuICAgICAgICBpZiBub3QgQGlzQmxhbmtSb3coZW5kUm93KSBhbmQgQGlzQmxhbmtSb3coc3RhcnRSb3cpXG4gICAgICAgICAgcG9pbnQgPSBAZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhlbmRSb3cpXG4gICAgICAgICAgaWYgcG9pbnQuaXNMZXNzVGhhbihmcm9tKVxuICAgICAgICAgICAgZm91bmRQb2ludCA9IHBvaW50XG4gICAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGlmIEBza2lwQmxhbmtSb3dcbiAgICAgICAgICAgIGZvdW5kUG9pbnQgPSBAZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhzdGFydFJvdylcbiAgICAgIGVsc2VcbiAgICAgICAgaWYgcmFuZ2UuZW5kLmlzTGVzc1RoYW4oZnJvbSlcbiAgICAgICAgICBmb3VuZFBvaW50ID0gcmFuZ2UuZW5kXG4gICAgICBzdG9wKCkgaWYgZm91bmRQb2ludD9cbiAgICBmb3VuZFBvaW50ID8gWzAsIDBdXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU2VudGVuY2UgZXh0ZW5kcyBNb3ZlVG9OZXh0U2VudGVuY2VcbiAgQGV4dGVuZCgpXG4gIGRpcmVjdGlvbjogJ3ByZXZpb3VzJ1xuXG5jbGFzcyBNb3ZlVG9OZXh0U2VudGVuY2VTa2lwQmxhbmtSb3cgZXh0ZW5kcyBNb3ZlVG9OZXh0U2VudGVuY2VcbiAgQGV4dGVuZCgpXG4gIHNraXBCbGFua1JvdzogdHJ1ZVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvUHJldmlvdXNTZW50ZW5jZVxuICBAZXh0ZW5kKClcbiAgc2tpcEJsYW5rUm93OiB0cnVlXG5cbiMgUGFyYWdyYXBoXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb05leHRQYXJhZ3JhcGggZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGp1bXA6IHRydWVcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsID0+XG4gICAgICBAc2V0QnVmZmVyUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBAZ2V0UG9pbnQoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpKVxuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIHN0YXJ0Um93ID0gZnJvbVBvaW50LnJvd1xuICAgIHdhc0F0Tm9uQmxhbmtSb3cgPSBub3QgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHN0YXJ0Um93KVxuICAgIGZvciByb3cgaW4gZ2V0QnVmZmVyUm93cyhAZWRpdG9yLCB7c3RhcnRSb3csIEBkaXJlY3Rpb259KVxuICAgICAgaWYgQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKHJvdylcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChyb3csIDApIGlmIHdhc0F0Tm9uQmxhbmtSb3dcbiAgICAgIGVsc2VcbiAgICAgICAgd2FzQXROb25CbGFua1JvdyA9IHRydWVcblxuICAgICMgZmFsbGJhY2tcbiAgICBzd2l0Y2ggQGRpcmVjdGlvblxuICAgICAgd2hlbiAncHJldmlvdXMnIHRoZW4gbmV3IFBvaW50KDAsIDApXG4gICAgICB3aGVuICduZXh0JyB0aGVuIEBnZXRWaW1Fb2ZCdWZmZXJQb3NpdGlvbigpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzUGFyYWdyYXBoIGV4dGVuZHMgTW92ZVRvTmV4dFBhcmFncmFwaFxuICBAZXh0ZW5kKClcbiAgZGlyZWN0aW9uOiAncHJldmlvdXMnXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBrZXltYXA6IDBcbmNsYXNzIE1vdmVUb0JlZ2lubmluZ09mTGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHNldEJ1ZmZlckNvbHVtbihjdXJzb3IsIDApXG5cbmNsYXNzIE1vdmVUb0NvbHVtbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHNldEJ1ZmZlckNvbHVtbihjdXJzb3IsIEBnZXRDb3VudCgtMSkpXG5cbmNsYXNzIE1vdmVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICByb3cgPSBnZXRWYWxpZFZpbUJ1ZmZlclJvdyhAZWRpdG9yLCBjdXJzb3IuZ2V0QnVmZmVyUm93KCkgKyBAZ2V0Q291bnQoLTEpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihbcm93LCBJbmZpbml0eV0pXG4gICAgY3Vyc29yLmdvYWxDb2x1bW4gPSBJbmZpbml0eVxuXG5jbGFzcyBNb3ZlVG9MYXN0Tm9uYmxhbmtDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuICBnZXRQb2ludDogKHtyb3d9KSAtPlxuICAgIHJvdyA9IGxpbWl0TnVtYmVyKHJvdyArIEBnZXRDb3VudCgtMSksIG1heDogQGdldFZpbUxhc3RCdWZmZXJSb3coKSlcbiAgICByYW5nZSA9IGZpbmRSYW5nZUluQnVmZmVyUm93KEBlZGl0b3IsIC9cXFN8Xi8sIHJvdywgZGlyZWN0aW9uOiAnYmFja3dhcmQnKVxuICAgIHJhbmdlPy5zdGFydCA/IG5ldyBQb2ludChyb3csIDApXG5cbiMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgZmFpbWlseVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMgXlxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcG9pbnQgPSBAZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgQHNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5KGN1cnNvciwgcG9pbnQpXG5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lVXAgZXh0ZW5kcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZVxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsIC0+XG4gICAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICB1bmxlc3MgcG9pbnQucm93IGlzIDBcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYW5zbGF0ZShbLTEsIDBdKSlcbiAgICBzdXBlclxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZURvd24gZXh0ZW5kcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZVxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsID0+XG4gICAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICB1bmxlc3MgQGdldFZpbUxhc3RCdWZmZXJSb3coKSBpcyBwb2ludC5yb3dcbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LnRyYW5zbGF0ZShbKzEsIDBdKSlcbiAgICBzdXBlclxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZUFuZERvd24gZXh0ZW5kcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZURvd25cbiAgQGV4dGVuZCgpXG4gIGRlZmF1bHRDb3VudDogMFxuICBnZXRDb3VudDogLT4gc3VwZXIgLSAxXG5cbiMga2V5bWFwOiBnIGdcbmNsYXNzIE1vdmVUb0ZpcnN0TGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICBqdW1wOiB0cnVlXG4gIHZlcnRpY2FsTW90aW9uOiB0cnVlXG4gIG1vdmVTdWNjZXNzT25MaW5ld2lzZTogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQHNldEN1cnNvckJ1ZmZlclJvdyhjdXJzb3IsIGdldFZhbGlkVmltQnVmZmVyUm93KEBlZGl0b3IsIEBnZXRSb3coKSkpXG4gICAgY3Vyc29yLmF1dG9zY3JvbGwoY2VudGVyOiB0cnVlKVxuXG4gIGdldFJvdzogLT5cbiAgICBAZ2V0Q291bnQoLTEpXG5cbmNsYXNzIE1vdmVUb1NjcmVlbkNvbHVtbiBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGFsbG93T2ZmU2NyZWVuUG9zaXRpb24gPSBAZ2V0Q29uZmlnKFwiYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb25cIilcbiAgICBwb2ludCA9IEB2aW1TdGF0ZS51dGlscy5nZXRTY3JlZW5Qb3NpdGlvbkZvclNjcmVlblJvdyhAZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCksIEB3aGljaCwge2FsbG93T2ZmU2NyZWVuUG9zaXRpb259KVxuICAgIEBzZXRTY3JlZW5Qb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KVxuXG4jIGtleW1hcDogZyAwXG5jbGFzcyBNb3ZlVG9CZWdpbm5pbmdPZlNjcmVlbkxpbmUgZXh0ZW5kcyBNb3ZlVG9TY3JlZW5Db2x1bW5cbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiBcImJlZ2lubmluZ1wiXG5cbiMgZyBeOiBgbW92ZS10by1maXJzdC1jaGFyYWN0ZXItb2Ytc2NyZWVuLWxpbmVgXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb1NjcmVlbkNvbHVtblxuICBAZXh0ZW5kKClcbiAgd2hpY2g6IFwiZmlyc3QtY2hhcmFjdGVyXCJcblxuIyBrZXltYXA6IGcgJFxuY2xhc3MgTW92ZVRvTGFzdENoYXJhY3Rlck9mU2NyZWVuTGluZSBleHRlbmRzIE1vdmVUb1NjcmVlbkNvbHVtblxuICBAZXh0ZW5kKClcbiAgd2hpY2g6IFwibGFzdC1jaGFyYWN0ZXJcIlxuXG4jIGtleW1hcDogR1xuY2xhc3MgTW92ZVRvTGFzdExpbmUgZXh0ZW5kcyBNb3ZlVG9GaXJzdExpbmVcbiAgQGV4dGVuZCgpXG4gIGRlZmF1bHRDb3VudDogSW5maW5pdHlcblxuIyBrZXltYXA6IE4lIGUuZy4gMTAlXG5jbGFzcyBNb3ZlVG9MaW5lQnlQZXJjZW50IGV4dGVuZHMgTW92ZVRvRmlyc3RMaW5lXG4gIEBleHRlbmQoKVxuXG4gIGdldFJvdzogLT5cbiAgICBwZXJjZW50ID0gbGltaXROdW1iZXIoQGdldENvdW50KCksIG1heDogMTAwKVxuICAgIE1hdGguZmxvb3IoKEBlZGl0b3IuZ2V0TGluZUNvdW50KCkgLSAxKSAqIChwZXJjZW50IC8gMTAwKSlcblxuY2xhc3MgTW92ZVRvUmVsYXRpdmVMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoZmFsc2UpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgbW92ZVN1Y2Nlc3NPbkxpbmV3aXNlOiB0cnVlXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICByb3cgPSBAZ2V0Rm9sZEVuZFJvd0ZvclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG5cbiAgICBjb3VudCA9IEBnZXRDb3VudCgtMSlcbiAgICB3aGlsZSAoY291bnQgPiAwKVxuICAgICAgcm93ID0gQGdldEZvbGRFbmRSb3dGb3JSb3cocm93ICsgMSlcbiAgICAgIGNvdW50LS1cblxuICAgIHNldEJ1ZmZlclJvdyhjdXJzb3IsIHJvdylcblxuY2xhc3MgTW92ZVRvUmVsYXRpdmVMaW5lTWluaW11bU9uZSBleHRlbmRzIE1vdmVUb1JlbGF0aXZlTGluZVxuICBAZXh0ZW5kKGZhbHNlKVxuXG4gIGdldENvdW50OiAtPlxuICAgIGxpbWl0TnVtYmVyKHN1cGVyLCBtaW46IDEpXG5cbiMgUG9zaXRpb24gY3Vyc29yIHdpdGhvdXQgc2Nyb2xsaW5nLiwgSCwgTSwgTFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogSFxuY2xhc3MgTW92ZVRvVG9wT2ZTY3JlZW4gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAganVtcDogdHJ1ZVxuICBzY3JvbGxvZmY6IDJcbiAgZGVmYXVsdENvdW50OiAwXG4gIHZlcnRpY2FsTW90aW9uOiB0cnVlXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBidWZmZXJSb3cgPSBAZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhAZ2V0U2NyZWVuUm93KCkpXG4gICAgQHNldEN1cnNvckJ1ZmZlclJvdyhjdXJzb3IsIGJ1ZmZlclJvdylcblxuICBnZXRTY3JvbGxvZmY6IC0+XG4gICAgaWYgQGlzQXNUYXJnZXRFeGNlcHRTZWxlY3QoKVxuICAgICAgMFxuICAgIGVsc2VcbiAgICAgIEBzY3JvbGxvZmZcblxuICBnZXRTY3JlZW5Sb3c6IC0+XG4gICAgZmlyc3RSb3cgPSBnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coQGVkaXRvcilcbiAgICBvZmZzZXQgPSBAZ2V0U2Nyb2xsb2ZmKClcbiAgICBvZmZzZXQgPSAwIGlmIGZpcnN0Um93IGlzIDBcbiAgICBvZmZzZXQgPSBsaW1pdE51bWJlcihAZ2V0Q291bnQoLTEpLCBtaW46IG9mZnNldClcbiAgICBmaXJzdFJvdyArIG9mZnNldFxuXG4jIGtleW1hcDogTVxuY2xhc3MgTW92ZVRvTWlkZGxlT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9Ub3BPZlNjcmVlblxuICBAZXh0ZW5kKClcbiAgZ2V0U2NyZWVuUm93OiAtPlxuICAgIHN0YXJ0Um93ID0gZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KEBlZGl0b3IpXG4gICAgZW5kUm93ID0gbGltaXROdW1iZXIoQGVkaXRvci5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpLCBtYXg6IEBnZXRWaW1MYXN0U2NyZWVuUm93KCkpXG4gICAgc3RhcnRSb3cgKyBNYXRoLmZsb29yKChlbmRSb3cgLSBzdGFydFJvdykgLyAyKVxuXG4jIGtleW1hcDogTFxuY2xhc3MgTW92ZVRvQm90dG9tT2ZTY3JlZW4gZXh0ZW5kcyBNb3ZlVG9Ub3BPZlNjcmVlblxuICBAZXh0ZW5kKClcbiAgZ2V0U2NyZWVuUm93OiAtPlxuICAgICMgW0ZJWE1FXVxuICAgICMgQXQgbGVhc3QgQXRvbSB2MS42LjAsIHRoZXJlIGFyZSB0d28gaW1wbGVtZW50YXRpb24gb2YgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICMgZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkgYW5kIGVkaXRvckVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICMgVGhvc2UgdHdvIG1ldGhvZHMgcmV0dXJuIGRpZmZlcmVudCB2YWx1ZSwgZWRpdG9yJ3Mgb25lIGlzIGNvcnJlbnQuXG4gICAgIyBTbyBJIGludGVudGlvbmFsbHkgdXNlIGVkaXRvci5nZXRMYXN0U2NyZWVuUm93IGhlcmUuXG4gICAgdmltTGFzdFNjcmVlblJvdyA9IEBnZXRWaW1MYXN0U2NyZWVuUm93KClcbiAgICByb3cgPSBsaW1pdE51bWJlcihAZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCksIG1heDogdmltTGFzdFNjcmVlblJvdylcbiAgICBvZmZzZXQgPSBAZ2V0U2Nyb2xsb2ZmKCkgKyAxXG4gICAgb2Zmc2V0ID0gMCBpZiByb3cgaXMgdmltTGFzdFNjcmVlblJvd1xuICAgIG9mZnNldCA9IGxpbWl0TnVtYmVyKEBnZXRDb3VudCgtMSksIG1pbjogb2Zmc2V0KVxuICAgIHJvdyAtIG9mZnNldFxuXG4jIFNjcm9sbGluZ1xuIyBIYWxmOiBjdHJsLWQsIGN0cmwtdVxuIyBGdWxsOiBjdHJsLWYsIGN0cmwtYlxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtGSVhNRV0gY291bnQgYmVoYXZlIGRpZmZlcmVudGx5IGZyb20gb3JpZ2luYWwgVmltLlxuY2xhc3MgU2Nyb2xsIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoZmFsc2UpXG4gIHZlcnRpY2FsTW90aW9uOiB0cnVlXG5cbiAgaXNTbW9vdGhTY3JvbGxFbmFibGVkOiAtPlxuICAgIGlmIE1hdGguYWJzKEBhbW91bnRPZlBhZ2UpIGlzIDFcbiAgICAgIEBnZXRDb25maWcoJ3Ntb290aFNjcm9sbE9uRnVsbFNjcm9sbE1vdGlvbicpXG4gICAgZWxzZVxuICAgICAgQGdldENvbmZpZygnc21vb3RoU2Nyb2xsT25IYWxmU2Nyb2xsTW90aW9uJylcblxuICBnZXRTbW9vdGhTY3JvbGxEdWF0aW9uOiAtPlxuICAgIGlmIE1hdGguYWJzKEBhbW91bnRPZlBhZ2UpIGlzIDFcbiAgICAgIEBnZXRDb25maWcoJ3Ntb290aFNjcm9sbE9uRnVsbFNjcm9sbE1vdGlvbkR1cmF0aW9uJylcbiAgICBlbHNlXG4gICAgICBAZ2V0Q29uZmlnKCdzbW9vdGhTY3JvbGxPbkhhbGZTY3JvbGxNb3Rpb25EdXJhdGlvbicpXG5cbiAgZ2V0UGl4ZWxSZWN0VG9wRm9yU2NlZW5Sb3c6IChyb3cpIC0+XG4gICAgcG9pbnQgPSBuZXcgUG9pbnQocm93LCAwKVxuICAgIEBlZGl0b3IuZWxlbWVudC5waXhlbFJlY3RGb3JTY3JlZW5SYW5nZShuZXcgUmFuZ2UocG9pbnQsIHBvaW50KSkudG9wXG5cbiAgc21vb3RoU2Nyb2xsOiAoZnJvbVJvdywgdG9Sb3csIGRvbmUpIC0+XG4gICAgdG9wUGl4ZWxGcm9tID0ge3RvcDogQGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KGZyb21Sb3cpfVxuICAgIHRvcFBpeGVsVG8gPSB7dG9wOiBAZ2V0UGl4ZWxSZWN0VG9wRm9yU2NlZW5Sb3codG9Sb3cpfVxuICAgICMgW05PVEVdXG4gICAgIyBpbnRlbnRpb25hbGx5IHVzZSBgZWxlbWVudC5jb21wb25lbnQuc2V0U2Nyb2xsVG9wYCBpbnN0ZWFkIG9mIGBlbGVtZW50LnNldFNjcm9sbFRvcGAuXG4gICAgIyBTSW5jZSBlbGVtZW50LnNldFNjcm9sbFRvcCB3aWxsIHRocm93IGV4Y2VwdGlvbiB3aGVuIGVsZW1lbnQuY29tcG9uZW50IG5vIGxvbmdlciBleGlzdHMuXG4gICAgc3RlcCA9IChuZXdUb3ApID0+XG4gICAgICBpZiBAZWRpdG9yLmVsZW1lbnQuY29tcG9uZW50P1xuICAgICAgICBAZWRpdG9yLmVsZW1lbnQuY29tcG9uZW50LnNldFNjcm9sbFRvcChuZXdUb3ApXG4gICAgICAgIEBlZGl0b3IuZWxlbWVudC5jb21wb25lbnQudXBkYXRlU3luYygpXG5cbiAgICBkdXJhdGlvbiA9IEBnZXRTbW9vdGhTY3JvbGxEdWF0aW9uKClcbiAgICBAdmltU3RhdGUucmVxdWVzdFNjcm9sbEFuaW1hdGlvbih0b3BQaXhlbEZyb20sIHRvcFBpeGVsVG8sIHtkdXJhdGlvbiwgc3RlcCwgZG9uZX0pXG5cbiAgZ2V0QW1vdW50T2ZSb3dzOiAtPlxuICAgIE1hdGguY2VpbChAYW1vdW50T2ZQYWdlICogQGVkaXRvci5nZXRSb3dzUGVyUGFnZSgpICogQGdldENvdW50KCkpXG5cbiAgZ2V0QnVmZmVyUm93OiAoY3Vyc29yKSAtPlxuICAgIHNjcmVlblJvdyA9IGdldFZhbGlkVmltU2NyZWVuUm93KEBlZGl0b3IsIGN1cnNvci5nZXRTY3JlZW5Sb3coKSArIEBnZXRBbW91bnRPZlJvd3MoKSlcbiAgICBAZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhzY3JlZW5Sb3cpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBidWZmZXJSb3cgPSBAZ2V0QnVmZmVyUm93KGN1cnNvcilcbiAgICBAc2V0Q3Vyc29yQnVmZmVyUm93KGN1cnNvciwgQGdldEJ1ZmZlclJvdyhjdXJzb3IpLCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICAgIGlmIGN1cnNvci5pc0xhc3RDdXJzb3IoKVxuICAgICAgaWYgQGlzU21vb3RoU2Nyb2xsRW5hYmxlZCgpXG4gICAgICAgIEB2aW1TdGF0ZS5maW5pc2hTY3JvbGxBbmltYXRpb24oKVxuXG4gICAgICBmaXJzdFZpc2liaWxlU2NyZWVuUm93ID0gQGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKVxuICAgICAgbmV3Rmlyc3RWaXNpYmlsZUJ1ZmZlclJvdyA9IEBlZGl0b3IuYnVmZmVyUm93Rm9yU2NyZWVuUm93KGZpcnN0VmlzaWJpbGVTY3JlZW5Sb3cgKyBAZ2V0QW1vdW50T2ZSb3dzKCkpXG4gICAgICBuZXdGaXJzdFZpc2liaWxlU2NyZWVuUm93ID0gQGVkaXRvci5zY3JlZW5Sb3dGb3JCdWZmZXJSb3cobmV3Rmlyc3RWaXNpYmlsZUJ1ZmZlclJvdylcbiAgICAgIGRvbmUgPSA9PlxuICAgICAgICBAZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhuZXdGaXJzdFZpc2liaWxlU2NyZWVuUm93KVxuICAgICAgICAjIFtGSVhNRV0gc29tZXRpbWVzLCBzY3JvbGxUb3AgaXMgbm90IHVwZGF0ZWQsIGNhbGxpbmcgdGhpcyBmaXguXG4gICAgICAgICMgSW52ZXN0aWdhdGUgYW5kIGZpbmQgYmV0dGVyIGFwcHJvYWNoIHRoZW4gcmVtb3ZlIHRoaXMgd29ya2Fyb3VuZC5cbiAgICAgICAgQGVkaXRvci5lbGVtZW50LmNvbXBvbmVudD8udXBkYXRlU3luYygpXG5cbiAgICAgIGlmIEBpc1Ntb290aFNjcm9sbEVuYWJsZWQoKVxuICAgICAgICBAc21vb3RoU2Nyb2xsKGZpcnN0VmlzaWJpbGVTY3JlZW5Sb3csIG5ld0ZpcnN0VmlzaWJpbGVTY3JlZW5Sb3csIGRvbmUpXG4gICAgICBlbHNlXG4gICAgICAgIGRvbmUoKVxuXG5cbiMga2V5bWFwOiBjdHJsLWZcbmNsYXNzIFNjcm9sbEZ1bGxTY3JlZW5Eb3duIGV4dGVuZHMgU2Nyb2xsXG4gIEBleHRlbmQodHJ1ZSlcbiAgYW1vdW50T2ZQYWdlOiArMVxuXG4jIGtleW1hcDogY3RybC1iXG5jbGFzcyBTY3JvbGxGdWxsU2NyZWVuVXAgZXh0ZW5kcyBTY3JvbGxcbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogLTFcblxuIyBrZXltYXA6IGN0cmwtZFxuY2xhc3MgU2Nyb2xsSGFsZlNjcmVlbkRvd24gZXh0ZW5kcyBTY3JvbGxcbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogKzEgLyAyXG5cbiMga2V5bWFwOiBjdHJsLXVcbmNsYXNzIFNjcm9sbEhhbGZTY3JlZW5VcCBleHRlbmRzIFNjcm9sbFxuICBAZXh0ZW5kKClcbiAgYW1vdW50T2ZQYWdlOiAtMSAvIDJcblxuIyBGaW5kXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMga2V5bWFwOiBmXG5jbGFzcyBGaW5kIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZHM6IGZhbHNlXG4gIGluY2x1c2l2ZTogdHJ1ZVxuICBvZmZzZXQ6IDBcbiAgcmVxdWlyZUlucHV0OiB0cnVlXG4gIGNhc2VTZW5zaXRpdml0eUtpbmQ6IFwiRmluZFwiXG5cbiAgcmVzdG9yZUVkaXRvclN0YXRlOiAtPlxuICAgIEBfcmVzdG9yZUVkaXRvclN0YXRlPygpXG4gICAgQF9yZXN0b3JlRWRpdG9yU3RhdGUgPSBudWxsXG5cbiAgY2FuY2VsT3BlcmF0aW9uOiAtPlxuICAgIEByZXN0b3JlRWRpdG9yU3RhdGUoKVxuICAgIHN1cGVyXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuXG4gICAgQHJlcGVhdElmTmVjZXNzYXJ5KCkgaWYgQGdldENvbmZpZyhcInJldXNlRmluZEZvclJlcGVhdEZpbmRcIilcbiAgICByZXR1cm4gaWYgQGlzQ29tcGxldGUoKVxuXG4gICAgY2hhcnNNYXggPSBAZ2V0Q29uZmlnKFwiZmluZENoYXJzTWF4XCIpXG5cbiAgICBpZiAoY2hhcnNNYXggPiAxKVxuICAgICAgQF9yZXN0b3JlRWRpdG9yU3RhdGUgPSBzYXZlRWRpdG9yU3RhdGUoQGVkaXRvcilcblxuICAgICAgb3B0aW9ucyA9XG4gICAgICAgIGF1dG9Db25maXJtVGltZW91dDogQGdldENvbmZpZyhcImZpbmRDb25maXJtQnlUaW1lb3V0XCIpXG4gICAgICAgIG9uQ29uZmlybTogKEBpbnB1dCkgPT4gaWYgQGlucHV0IHRoZW4gQHByb2Nlc3NPcGVyYXRpb24oKSBlbHNlIEBjYW5jZWxPcGVyYXRpb24oKVxuICAgICAgICBvbkNoYW5nZTogKEBwcmVDb25maXJtZWRDaGFycykgPT4gQGhpZ2hsaWdodFRleHRJbkN1cnNvclJvd3MoQHByZUNvbmZpcm1lZENoYXJzLCBcInByZS1jb25maXJtXCIpXG4gICAgICAgIG9uQ2FuY2VsOiA9PlxuICAgICAgICAgIEB2aW1TdGF0ZS5oaWdobGlnaHRGaW5kLmNsZWFyTWFya2VycygpXG4gICAgICAgICAgQGNhbmNlbE9wZXJhdGlvbigpXG4gICAgICAgIGNvbW1hbmRzOlxuICAgICAgICAgIFwidmltLW1vZGUtcGx1czpmaW5kLW5leHQtcHJlLWNvbmZpcm1lZFwiOiA9PiBAZmluZFByZUNvbmZpcm1lZCgrMSlcbiAgICAgICAgICBcInZpbS1tb2RlLXBsdXM6ZmluZC1wcmV2aW91cy1wcmUtY29uZmlybWVkXCI6ID0+ICBAZmluZFByZUNvbmZpcm1lZCgtMSlcblxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBvcHRpb25zLnB1cnBvc2UgPSBcImZpbmRcIlxuICAgIG9wdGlvbnMuY2hhcnNNYXggPSBjaGFyc01heFxuXG4gICAgQGZvY3VzSW5wdXQob3B0aW9ucylcblxuICBmaW5kUHJlQ29uZmlybWVkOiAoZGVsdGEpIC0+XG4gICAgaWYgQHByZUNvbmZpcm1lZENoYXJzIGFuZCBAZ2V0Q29uZmlnKFwiaGlnaGxpZ2h0RmluZENoYXJcIilcbiAgICAgIGluZGV4ID0gQGhpZ2hsaWdodFRleHRJbkN1cnNvclJvd3MoQHByZUNvbmZpcm1lZENoYXJzLCBcInByZS1jb25maXJtXCIsIEBnZXRDb3VudCgtMSkgKyBkZWx0YSwgdHJ1ZSlcbiAgICAgIEBjb3VudCA9IGluZGV4ICsgMVxuXG4gIHJlcGVhdElmTmVjZXNzYXJ5OiAtPlxuICAgIGN1cnJlbnRGaW5kID0gQHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldChcImN1cnJlbnRGaW5kXCIpXG4gICAgaXNTZXF1ZW50aWFsRXhlY3V0aW9uID0gQHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLmdldExhc3RDb21tYW5kTmFtZSgpIGluIFtcIkZpbmRcIiwgXCJGaW5kQmFja3dhcmRzXCIsIFwiVGlsbFwiLCBcIlRpbGxCYWNrd2FyZHNcIl1cbiAgICBpZiBjdXJyZW50RmluZD8gYW5kIGlzU2VxdWVudGlhbEV4ZWN1dGlvblxuICAgICAgQGlucHV0ID0gY3VycmVudEZpbmQuaW5wdXRcbiAgICAgIEByZXBlYXRlZCA9IHRydWVcblxuICBpc0JhY2t3YXJkczogLT5cbiAgICBAYmFja3dhcmRzXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBzdXBlclxuICAgIGRlY29yYXRpb25UeXBlID0gXCJwb3N0LWNvbmZpcm1cIlxuICAgIGRlY29yYXRpb25UeXBlICs9IFwiIGxvbmdcIiBpZiBAaXNBc1RhcmdldEV4Y2VwdFNlbGVjdCgpXG4gICAgQGVkaXRvci5jb21wb25lbnQuZ2V0TmV4dFVwZGF0ZVByb21pc2UoKS50aGVuID0+XG4gICAgICBAaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93cyhAaW5wdXQsIGRlY29yYXRpb25UeXBlKVxuXG4gICAgcmV0dXJuICMgRG9uJ3QgcmV0dXJuIFByb21pc2UgaGVyZS4gT3BlcmF0aW9uU3RhY2sgdHJlYXQgUHJvbWlzZSBkaWZmZXJlbnRseS5cblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBzY2FuUmFuZ2UgPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KGZyb21Qb2ludC5yb3cpXG4gICAgcG9pbnRzID0gW11cbiAgICByZWdleCA9IEBnZXRSZWdleChAaW5wdXQpXG4gICAgaW5kZXhXYW50QWNjZXNzID0gQGdldENvdW50KC0xKVxuXG4gICAgdHJhbnNsYXRpb24gPSBuZXcgUG9pbnQoMCwgaWYgQGlzQmFja3dhcmRzKCkgdGhlbiBAb2Zmc2V0IGVsc2UgLUBvZmZzZXQpXG4gICAgZnJvbVBvaW50ID0gZnJvbVBvaW50LnRyYW5zbGF0ZSh0cmFuc2xhdGlvbi5uZWdhdGUoKSkgaWYgQHJlcGVhdGVkXG5cbiAgICBpZiBAaXNCYWNrd2FyZHMoKVxuICAgICAgc2NhblJhbmdlLnN0YXJ0ID0gUG9pbnQuWkVSTyBpZiBAZ2V0Q29uZmlnKFwiZmluZEFjcm9zc0xpbmVzXCIpXG4gICAgICBAZWRpdG9yLmJhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlIHJlZ2V4LCBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgICBpZiByYW5nZS5zdGFydC5pc0xlc3NUaGFuKGZyb21Qb2ludClcbiAgICAgICAgICBwb2ludHMucHVzaChyYW5nZS5zdGFydClcbiAgICAgICAgICBzdG9wKCkgaWYgcG9pbnRzLmxlbmd0aCA+IGluZGV4V2FudEFjY2Vzc1xuICAgIGVsc2VcbiAgICAgIHNjYW5SYW5nZS5lbmQgPSBAZWRpdG9yLmdldEVvZkJ1ZmZlclBvc2l0aW9uKCkgaWYgQGdldENvbmZpZyhcImZpbmRBY3Jvc3NMaW5lc1wiKVxuICAgICAgQGVkaXRvci5zY2FuSW5CdWZmZXJSYW5nZSByZWdleCwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgICAgaWYgcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbihmcm9tUG9pbnQpXG4gICAgICAgICAgcG9pbnRzLnB1c2gocmFuZ2Uuc3RhcnQpXG4gICAgICAgICAgc3RvcCgpIGlmIHBvaW50cy5sZW5ndGggPiBpbmRleFdhbnRBY2Nlc3NcblxuICAgIHBvaW50c1tpbmRleFdhbnRBY2Nlc3NdPy50cmFuc2xhdGUodHJhbnNsYXRpb24pXG5cbiAgaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93czogKHRleHQsIGRlY29yYXRpb25UeXBlLCBpbmRleCA9IEBnZXRDb3VudCgtMSksIGFkanVzdEluZGV4ID0gZmFsc2UpIC0+XG4gICAgcmV0dXJuIHVubGVzcyBAZ2V0Q29uZmlnKFwiaGlnaGxpZ2h0RmluZENoYXJcIilcbiAgICBAdmltU3RhdGUuaGlnaGxpZ2h0RmluZC5oaWdobGlnaHRDdXJzb3JSb3dzKEBnZXRSZWdleCh0ZXh0KSwgZGVjb3JhdGlvblR5cGUsIEBpc0JhY2t3YXJkcygpLCBAb2Zmc2V0LCBpbmRleCwgYWRqdXN0SW5kZXgpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBpZiBwb2ludD9cbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICBlbHNlXG4gICAgICBAcmVzdG9yZUVkaXRvclN0YXRlKClcblxuICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2N1cnJlbnRGaW5kJywgdGhpcykgdW5sZXNzIEByZXBlYXRlZFxuXG4gIGdldFJlZ2V4OiAodGVybSkgLT5cbiAgICBtb2RpZmllcnMgPSBpZiBAaXNDYXNlU2Vuc2l0aXZlKHRlcm0pIHRoZW4gJ2cnIGVsc2UgJ2dpJ1xuICAgIG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcblxuIyBrZXltYXA6IEZcbmNsYXNzIEZpbmRCYWNrd2FyZHMgZXh0ZW5kcyBGaW5kXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IGZhbHNlXG4gIGJhY2t3YXJkczogdHJ1ZVxuXG4jIGtleW1hcDogdFxuY2xhc3MgVGlsbCBleHRlbmRzIEZpbmRcbiAgQGV4dGVuZCgpXG4gIG9mZnNldDogMVxuXG4gIGdldFBvaW50OiAtPlxuICAgIEBwb2ludCA9IHN1cGVyXG4gICAgQG1vdmVTdWNjZWVkZWQgPSBAcG9pbnQ/XG4gICAgcmV0dXJuIEBwb2ludFxuXG4jIGtleW1hcDogVFxuY2xhc3MgVGlsbEJhY2t3YXJkcyBleHRlbmRzIFRpbGxcbiAgQGV4dGVuZCgpXG4gIGluY2x1c2l2ZTogZmFsc2VcbiAgYmFja3dhcmRzOiB0cnVlXG5cbiMgTWFya1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogYFxuY2xhc3MgTW92ZVRvTWFyayBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAganVtcDogdHJ1ZVxuICByZXF1aXJlSW5wdXQ6IHRydWVcbiAgaW5wdXQ6IG51bGwgIyBzZXQgd2hlbiBpbnN0YXRudGlhdGVkIHZpYSB2aW1TdGF0ZTo6bW92ZVRvTWFyaygpXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEByZWFkQ2hhcigpIHVubGVzcyBAaXNDb21wbGV0ZSgpXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgQHZpbVN0YXRlLm1hcmsuZ2V0KEBpbnB1dClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGlmIHBvaW50ID0gQGdldFBvaW50KClcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIGN1cnNvci5hdXRvc2Nyb2xsKGNlbnRlcjogdHJ1ZSlcblxuIyBrZXltYXA6ICdcbmNsYXNzIE1vdmVUb01hcmtMaW5lIGV4dGVuZHMgTW92ZVRvTWFya1xuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGdldFBvaW50OiAtPlxuICAgIGlmIHBvaW50ID0gc3VwZXJcbiAgICAgIEBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KHBvaW50LnJvdylcblxuIyBGb2xkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0IGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmb2xkIHN0YXJ0XCJcbiAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gIHdoaWNoOiAnc3RhcnQnXG4gIGRpcmVjdGlvbjogJ3ByZXYnXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEByb3dzID0gQGdldEZvbGRSb3dzKEB3aGljaClcbiAgICBAcm93cy5yZXZlcnNlKCkgaWYgQGRpcmVjdGlvbiBpcyAncHJldidcblxuICBnZXRGb2xkUm93czogKHdoaWNoKSAtPlxuICAgIGluZGV4ID0gaWYgd2hpY2ggaXMgJ3N0YXJ0JyB0aGVuIDAgZWxzZSAxXG4gICAgcm93cyA9IGdldENvZGVGb2xkUm93UmFuZ2VzKEBlZGl0b3IpLm1hcCAocm93UmFuZ2UpIC0+XG4gICAgICByb3dSYW5nZVtpbmRleF1cbiAgICBfLnNvcnRCeShfLnVuaXEocm93cyksIChyb3cpIC0+IHJvdylcblxuICBnZXRTY2FuUm93czogKGN1cnNvcikgLT5cbiAgICBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICBpc1ZhbGlkUm93ID0gc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3ByZXYnIHRoZW4gKHJvdykgLT4gcm93IDwgY3Vyc29yUm93XG4gICAgICB3aGVuICduZXh0JyB0aGVuIChyb3cpIC0+IHJvdyA+IGN1cnNvclJvd1xuICAgIEByb3dzLmZpbHRlcihpc1ZhbGlkUm93KVxuXG4gIGRldGVjdFJvdzogKGN1cnNvcikgLT5cbiAgICBAZ2V0U2NhblJvd3MoY3Vyc29yKVswXVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIGlmIChyb3cgPSBAZGV0ZWN0Um93KGN1cnNvcikpP1xuICAgICAgICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93KGN1cnNvciwgcm93KVxuXG5jbGFzcyBNb3ZlVG9OZXh0Rm9sZFN0YXJ0IGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZm9sZCBzdGFydFwiXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgc2FtZS1pbmRlbnRlZCBmb2xkIHN0YXJ0XCJcbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIGJhc2VJbmRlbnRMZXZlbCA9IEBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgZm9yIHJvdyBpbiBAZ2V0U2NhblJvd3MoY3Vyc29yKVxuICAgICAgaWYgQGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KHJvdykgaXMgYmFzZUluZGVudExldmVsXG4gICAgICAgIHJldHVybiByb3dcbiAgICBudWxsXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgc2FtZS1pbmRlbnRlZCBmb2xkIHN0YXJ0XCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZvbGQgZW5kXCJcbiAgd2hpY2g6ICdlbmQnXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkRW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IGZvbGQgZW5kXCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZ1bmN0aW9uXCJcbiAgZGlyZWN0aW9uOiAncHJldidcbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIF8uZGV0ZWN0IEBnZXRTY2FuUm93cyhjdXJzb3IpLCAocm93KSA9PlxuICAgICAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhAZWRpdG9yLCByb3cpXG5cbmNsYXNzIE1vdmVUb05leHRGdW5jdGlvbiBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRnVuY3Rpb25cbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZnVuY3Rpb25cIlxuICBkaXJlY3Rpb246ICduZXh0J1xuXG4jIFNjb3BlIGJhc2VkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1Bvc2l0aW9uQnlTY29wZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBkaXJlY3Rpb246ICdiYWNrd2FyZCdcbiAgc2NvcGU6ICcuJ1xuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIGRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlKEBlZGl0b3IsIGZyb21Qb2ludCwgQGRpcmVjdGlvbiwgQHNjb3BlKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU3RyaW5nIGV4dGVuZHMgTW92ZVRvUG9zaXRpb25CeVNjb3BlXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBzdHJpbmcoc2VhcmNoZWQgYnkgYHN0cmluZy5iZWdpbmAgc2NvcGUpXCJcbiAgZGlyZWN0aW9uOiAnYmFja3dhcmQnXG4gIHNjb3BlOiAnc3RyaW5nLmJlZ2luJ1xuXG5jbGFzcyBNb3ZlVG9OZXh0U3RyaW5nIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNTdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgc3RyaW5nKHNlYXJjaGVkIGJ5IGBzdHJpbmcuYmVnaW5gIHNjb3BlKVwiXG4gIGRpcmVjdGlvbjogJ2ZvcndhcmQnXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzTnVtYmVyIGV4dGVuZHMgTW92ZVRvUG9zaXRpb25CeVNjb3BlXG4gIEBleHRlbmQoKVxuICBkaXJlY3Rpb246ICdiYWNrd2FyZCdcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgbnVtYmVyKHNlYXJjaGVkIGJ5IGBjb25zdGFudC5udW1lcmljYCBzY29wZSlcIlxuICBzY29wZTogJ2NvbnN0YW50Lm51bWVyaWMnXG5cbmNsYXNzIE1vdmVUb05leHROdW1iZXIgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c051bWJlclxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBudW1iZXIoc2VhcmNoZWQgYnkgYGNvbnN0YW50Lm51bWVyaWNgIHNjb3BlKVwiXG4gIGRpcmVjdGlvbjogJ2ZvcndhcmQnXG5cbmNsYXNzIE1vdmVUb05leHRPY2N1cnJlbmNlIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICAjIEVuc3VyZSB0aGlzIGNvbW1hbmQgaXMgYXZhaWxhYmxlIHdoZW4gaGFzLW9jY3VycmVuY2VcbiAgQGNvbW1hbmRTY29wZTogJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5oYXMtb2NjdXJyZW5jZSdcbiAganVtcDogdHJ1ZVxuICBkaXJlY3Rpb246ICduZXh0J1xuXG4gIGdldFJhbmdlczogLT5cbiAgICBAdmltU3RhdGUub2NjdXJyZW5jZU1hbmFnZXIuZ2V0TWFya2VycygpLm1hcCAobWFya2VyKSAtPlxuICAgICAgbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcblxuICBleGVjdXRlOiAtPlxuICAgIEByYW5nZXMgPSBAdmltU3RhdGUudXRpbHMuc29ydFJhbmdlcyhAZ2V0UmFuZ2VzKCkpXG4gICAgc3VwZXJcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHJhbmdlID0gQHJhbmdlc1tnZXRJbmRleChAZ2V0SW5kZXgoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpLCBAcmFuZ2VzKV1cbiAgICBwb2ludCA9IHJhbmdlLnN0YXJ0XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICAgIGlmIGN1cnNvci5pc0xhc3RDdXJzb3IoKVxuICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3cocG9pbnQucm93KVxuICAgICAgc21hcnRTY3JvbGxUb0J1ZmZlclBvc2l0aW9uKEBlZGl0b3IsIHBvaW50KVxuXG4gICAgaWYgQGdldENvbmZpZygnZmxhc2hPbk1vdmVUb09jY3VycmVuY2UnKVxuICAgICAgQHZpbVN0YXRlLmZsYXNoKHJhbmdlLCB0eXBlOiAnc2VhcmNoJylcblxuICBnZXRJbmRleDogKGZyb21Qb2ludCkgLT5cbiAgICBpbmRleCA9IG51bGxcbiAgICBmb3IgcmFuZ2UsIGkgaW4gQHJhbmdlcyB3aGVuIHJhbmdlLnN0YXJ0LmlzR3JlYXRlclRoYW4oZnJvbVBvaW50KVxuICAgICAgaW5kZXggPSBpXG4gICAgICBicmVha1xuICAgIChpbmRleCA/IDApICsgQGdldENvdW50KC0xKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c09jY3VycmVuY2UgZXh0ZW5kcyBNb3ZlVG9OZXh0T2NjdXJyZW5jZVxuICBAZXh0ZW5kKClcbiAgZGlyZWN0aW9uOiAncHJldmlvdXMnXG5cbiAgZ2V0SW5kZXg6IChmcm9tUG9pbnQpIC0+XG4gICAgaW5kZXggPSBudWxsXG4gICAgZm9yIHJhbmdlLCBpIGluIEByYW5nZXMgYnkgLTEgd2hlbiByYW5nZS5lbmQuaXNMZXNzVGhhbihmcm9tUG9pbnQpXG4gICAgICBpbmRleCA9IGlcbiAgICAgIGJyZWFrXG4gICAgKGluZGV4ID8gQHJhbmdlcy5sZW5ndGggLSAxKSAtIEBnZXRDb3VudCgtMSlcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogJVxuY2xhc3MgTW92ZVRvUGFpciBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgaW5jbHVzaXZlOiB0cnVlXG4gIGp1bXA6IHRydWVcbiAgbWVtYmVyOiBbJ1BhcmVudGhlc2lzJywgJ0N1cmx5QnJhY2tldCcsICdTcXVhcmVCcmFja2V0J11cblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IpKVxuXG4gIGdldFBvaW50Rm9yVGFnOiAocG9pbnQpIC0+XG4gICAgcGFpckluZm8gPSBAbmV3KFwiQVRhZ1wiKS5nZXRQYWlySW5mbyhwb2ludClcbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgcGFpckluZm8/XG4gICAge29wZW5SYW5nZSwgY2xvc2VSYW5nZX0gPSBwYWlySW5mb1xuICAgIG9wZW5SYW5nZSA9IG9wZW5SYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICBjbG9zZVJhbmdlID0gY2xvc2VSYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICByZXR1cm4gY2xvc2VSYW5nZS5zdGFydCBpZiBvcGVuUmFuZ2UuY29udGFpbnNQb2ludChwb2ludCkgYW5kIChub3QgcG9pbnQuaXNFcXVhbChvcGVuUmFuZ2UuZW5kKSlcbiAgICByZXR1cm4gb3BlblJhbmdlLnN0YXJ0IGlmIGNsb3NlUmFuZ2UuY29udGFpbnNQb2ludChwb2ludCkgYW5kIChub3QgcG9pbnQuaXNFcXVhbChjbG9zZVJhbmdlLmVuZCkpXG5cbiAgZ2V0UG9pbnQ6IChjdXJzb3IpIC0+XG4gICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGN1cnNvclJvdyA9IGN1cnNvclBvc2l0aW9uLnJvd1xuICAgIHJldHVybiBwb2ludCBpZiBwb2ludCA9IEBnZXRQb2ludEZvclRhZyhjdXJzb3JQb3NpdGlvbilcblxuICAgICMgQUFueVBhaXJBbGxvd0ZvcndhcmRpbmcgcmV0dXJuIGZvcndhcmRpbmcgcmFuZ2Ugb3IgZW5jbG9zaW5nIHJhbmdlLlxuICAgIHJhbmdlID0gQG5ldyhcIkFBbnlQYWlyQWxsb3dGb3J3YXJkaW5nXCIsIHtAbWVtYmVyfSkuZ2V0UmFuZ2UoY3Vyc29yLnNlbGVjdGlvbilcbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgcmFuZ2U/XG4gICAge3N0YXJ0LCBlbmR9ID0gcmFuZ2VcbiAgICBpZiAoc3RhcnQucm93IGlzIGN1cnNvclJvdykgYW5kIHN0YXJ0LmlzR3JlYXRlclRoYW5PckVxdWFsKGN1cnNvclBvc2l0aW9uKVxuICAgICAgIyBGb3J3YXJkaW5nIHJhbmdlIGZvdW5kXG4gICAgICBlbmQudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgZWxzZSBpZiBlbmQucm93IGlzIGN1cnNvclBvc2l0aW9uLnJvd1xuICAgICAgIyBFbmNsb3NpbmcgcmFuZ2Ugd2FzIHJldHVybmVkXG4gICAgICAjIFdlIG1vdmUgdG8gc3RhcnQoIG9wZW4tcGFpciApIG9ubHkgd2hlbiBjbG9zZS1wYWlyIHdhcyBhdCBzYW1lIHJvdyBhcyBjdXJzb3Itcm93LlxuICAgICAgc3RhcnRcbiJdfQ==
