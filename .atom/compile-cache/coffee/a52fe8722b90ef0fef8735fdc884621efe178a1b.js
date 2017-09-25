(function() {
  var Base, CurrentSelection, Find, FindBackwards, Motion, MoveDown, MoveDownScreen, MoveDownToEdge, MoveDownWrap, MoveLeft, MoveRight, MoveRightBufferColumn, MoveToBeginningOfLine, MoveToBeginningOfScreenLine, MoveToBottomOfScreen, MoveToColumn, MoveToEndOfAlphanumericWord, MoveToEndOfSmartWord, MoveToEndOfSubword, MoveToEndOfWholeWord, MoveToEndOfWord, MoveToFirstCharacterOfLine, MoveToFirstCharacterOfLineAndDown, MoveToFirstCharacterOfLineDown, MoveToFirstCharacterOfLineUp, MoveToFirstCharacterOfScreenLine, MoveToFirstLine, MoveToLastCharacterOfLine, MoveToLastCharacterOfScreenLine, MoveToLastLine, MoveToLastNonblankCharacterOfLineAndDown, MoveToLineByPercent, MoveToMark, MoveToMarkLine, MoveToMiddleOfScreen, MoveToNextAlphanumericWord, MoveToNextFoldEnd, MoveToNextFoldStart, MoveToNextFoldStartWithSameIndent, MoveToNextFunction, MoveToNextNumber, MoveToNextOccurrence, MoveToNextParagraph, MoveToNextSentence, MoveToNextSentenceSkipBlankRow, MoveToNextSmartWord, MoveToNextString, MoveToNextSubword, MoveToNextWholeWord, MoveToNextWord, MoveToPair, MoveToPositionByScope, MoveToPreviousAlphanumericWord, MoveToPreviousEndOfWholeWord, MoveToPreviousEndOfWord, MoveToPreviousFoldEnd, MoveToPreviousFoldStart, MoveToPreviousFoldStartWithSameIndent, MoveToPreviousFunction, MoveToPreviousNumber, MoveToPreviousOccurrence, MoveToPreviousParagraph, MoveToPreviousSentence, MoveToPreviousSentenceSkipBlankRow, MoveToPreviousSmartWord, MoveToPreviousString, MoveToPreviousSubword, MoveToPreviousWholeWord, MoveToPreviousWord, MoveToRelativeLine, MoveToRelativeLineMinimumOne, MoveToScreenColumn, MoveToTopOfScreen, MoveUp, MoveUpScreen, MoveUpToEdge, MoveUpWrap, Point, Range, Scroll, ScrollFullScreenDown, ScrollFullScreenUp, ScrollHalfScreenDown, ScrollHalfScreenUp, Till, TillBackwards, _, detectScopeStartPositionForScope, findRangeInBufferRow, getBufferRows, getCodeFoldRowRanges, getEndOfLineForBufferRow, getFirstVisibleScreenRow, getIndex, getLargestFoldRangeContainsBufferRow, getLastVisibleScreenRow, getTextInScreenRange, getValidVimBufferRow, getValidVimScreenRow, isEmptyRow, isIncludeFunctionScopeForRow, limitNumber, moveCursorDownScreen, moveCursorLeft, moveCursorRight, moveCursorToFirstCharacterAtRow, moveCursorToNextNonWhitespace, moveCursorUpScreen, pointIsAtEndOfLineAtNonEmptyRow, pointIsAtVimEndOfFile, pointIsOnWhiteSpace, ref, ref1, setBufferColumn, setBufferRow, smartScrollToBufferPosition, sortRanges,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require('underscore-plus');

  ref = require('atom'), Point = ref.Point, Range = ref.Range;

  ref1 = require('./utils'), moveCursorLeft = ref1.moveCursorLeft, moveCursorRight = ref1.moveCursorRight, moveCursorUpScreen = ref1.moveCursorUpScreen, moveCursorDownScreen = ref1.moveCursorDownScreen, pointIsAtVimEndOfFile = ref1.pointIsAtVimEndOfFile, getFirstVisibleScreenRow = ref1.getFirstVisibleScreenRow, getLastVisibleScreenRow = ref1.getLastVisibleScreenRow, getValidVimScreenRow = ref1.getValidVimScreenRow, getValidVimBufferRow = ref1.getValidVimBufferRow, moveCursorToFirstCharacterAtRow = ref1.moveCursorToFirstCharacterAtRow, sortRanges = ref1.sortRanges, pointIsOnWhiteSpace = ref1.pointIsOnWhiteSpace, moveCursorToNextNonWhitespace = ref1.moveCursorToNextNonWhitespace, isEmptyRow = ref1.isEmptyRow, getCodeFoldRowRanges = ref1.getCodeFoldRowRanges, getLargestFoldRangeContainsBufferRow = ref1.getLargestFoldRangeContainsBufferRow, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, detectScopeStartPositionForScope = ref1.detectScopeStartPositionForScope, getBufferRows = ref1.getBufferRows, getTextInScreenRange = ref1.getTextInScreenRange, setBufferRow = ref1.setBufferRow, setBufferColumn = ref1.setBufferColumn, limitNumber = ref1.limitNumber, getIndex = ref1.getIndex, smartScrollToBufferPosition = ref1.smartScrollToBufferPosition, pointIsAtEndOfLineAtNonEmptyRow = ref1.pointIsAtEndOfLineAtNonEmptyRow, getEndOfLineForBufferRow = ref1.getEndOfLineForBufferRow, findRangeInBufferRow = ref1.findRangeInBufferRow;

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

    Find.prototype.initialize = function() {
      var charsMax, options;
      Find.__super__.initialize.apply(this, arguments);
      this.repeatIfNecessary();
      if (this.isComplete()) {
        return;
      }
      charsMax = this.getConfig("findCharsMax");
      if (charsMax > 1) {
        options = {
          autoConfirmTimeout: this.getConfig("findConfirmByTimeout"),
          onChange: (function(_this) {
            return function(char) {
              return _this.highlightTextInCursorRows(char, "pre-confirm");
            };
          })(this),
          onCancel: (function(_this) {
            return function() {
              _this.vimState.highlightFind.clearMarkers();
              return _this.cancelOperation();
            };
          })(this)
        };
      }
      if (options == null) {
        options = {};
      }
      options.purpose = "find";
      options.charsMax = charsMax;
      return this.focusInput(options);
    };

    Find.prototype.repeatIfNecessary = function() {
      var ref2;
      if (this.getConfig("reuseFindForRepeatFind")) {
        if ((ref2 = this.vimState.operationStack.getLastCommandName()) === "Find" || ref2 === "FindBackwards" || ref2 === "Till" || ref2 === "TillBackwards") {
          this.input = this.vimState.globalState.get("currentFind").input;
          return this.repeated = true;
        }
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

    Find.prototype.getScanInfo = function(fromPoint) {
      var end, method, offset, ref2, scanRange, start, unOffset;
      ref2 = this.editor.bufferRangeForBufferRow(fromPoint.row), start = ref2.start, end = ref2.end;
      offset = this.isBackwards() ? this.offset : -this.offset;
      unOffset = -offset * this.repeated;
      if (this.isBackwards()) {
        if (this.getConfig("findAcrossLines")) {
          start = Point.ZERO;
        }
        scanRange = [start, fromPoint.translate([0, unOffset])];
        method = 'backwardsScanInBufferRange';
      } else {
        if (this.getConfig("findAcrossLines")) {
          end = this.editor.getEofBufferPosition();
        }
        scanRange = [fromPoint.translate([0, 1 + unOffset]), end];
        method = 'scanInBufferRange';
      }
      return {
        scanRange: scanRange,
        method: method,
        offset: offset
      };
    };

    Find.prototype.getPoint = function(fromPoint) {
      var indexWantAccess, method, offset, points, ref2, ref3, scanRange;
      ref2 = this.getScanInfo(fromPoint), scanRange = ref2.scanRange, method = ref2.method, offset = ref2.offset;
      points = [];
      indexWantAccess = this.getCount(-1);
      this.editor[method](this.getRegex(this.input), scanRange, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        points.push(range.start);
        if (points.length > indexWantAccess) {
          return stop();
        }
      });
      return (ref3 = points[indexWantAccess]) != null ? ref3.translate([0, offset]) : void 0;
    };

    Find.prototype.highlightTextInCursorRows = function(text, decorationType) {
      if (!this.getConfig("highlightFindChar")) {
        return;
      }
      return this.vimState.highlightFind.highlightCursorRows(this.getRegex(text), decorationType, this.isBackwards(), this.getCount(-1));
    };

    Find.prototype.moveCursor = function(cursor) {
      var point;
      point = this.getPoint(cursor.getBufferPosition());
      this.setBufferPositionSafely(cursor, point);
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
      this.ranges = this.getRanges();
      return MoveToNextOccurrence.__super__.execute.apply(this, arguments);
    };

    MoveToNextOccurrence.prototype.moveCursor = function(cursor) {
      var index, offset, point, range;
      index = this.getIndex(cursor.getBufferPosition());
      if (index != null) {
        offset = (function() {
          switch (this.direction) {
            case 'next':
              return this.getCount(-1);
            case 'previous':
              return -this.getCount(-1);
          }
        }).call(this);
        range = this.ranges[getIndex(index + offset, this.ranges)];
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
      }
    };

    MoveToNextOccurrence.prototype.getIndex = function(fromPoint) {
      var i, j, len, range, ref2;
      ref2 = this.ranges;
      for (i = j = 0, len = ref2.length; j < len; i = ++j) {
        range = ref2[i];
        if (range.start.isGreaterThan(fromPoint)) {
          return i;
        }
      }
      return 0;
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
      var i, j, range, ref2;
      ref2 = this.ranges;
      for (i = j = ref2.length - 1; j >= 0; i = j += -1) {
        range = ref2[i];
        if (range.end.isLessThan(fromPoint)) {
          return i;
        }
      }
      return this.ranges.length - 1;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSwrM0VBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQUFpQixPQUFBLENBQVEsTUFBUixDQUFqQixFQUFDLGlCQUFELEVBQVE7O0VBRVIsT0F5QkksT0FBQSxDQUFRLFNBQVIsQ0F6QkosRUFDRSxvQ0FERixFQUNrQixzQ0FEbEIsRUFFRSw0Q0FGRixFQUVzQixnREFGdEIsRUFHRSxrREFIRixFQUlFLHdEQUpGLEVBSTRCLHNEQUo1QixFQUtFLGdEQUxGLEVBS3dCLGdEQUx4QixFQU1FLHNFQU5GLEVBT0UsNEJBUEYsRUFRRSw4Q0FSRixFQVNFLGtFQVRGLEVBVUUsNEJBVkYsRUFXRSxnREFYRixFQVlFLGdGQVpGLEVBYUUsZ0VBYkYsRUFjRSx3RUFkRixFQWVFLGtDQWZGLEVBZ0JFLGdEQWhCRixFQWlCRSxnQ0FqQkYsRUFrQkUsc0NBbEJGLEVBbUJFLDhCQW5CRixFQW9CRSx3QkFwQkYsRUFxQkUsOERBckJGLEVBc0JFLHNFQXRCRixFQXVCRSx3REF2QkYsRUF3QkU7O0VBR0YsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUVEOzs7SUFDSixNQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O0lBQ0EsTUFBQyxDQUFBLGFBQUQsR0FBZ0I7O3FCQUNoQixTQUFBLEdBQVc7O3FCQUNYLElBQUEsR0FBTTs7cUJBQ04sSUFBQSxHQUFNOztxQkFDTixjQUFBLEdBQWdCOztxQkFDaEIsYUFBQSxHQUFlOztxQkFDZixxQkFBQSxHQUF1Qjs7SUFFVixnQkFBQTtNQUNYLHlDQUFBLFNBQUE7TUFFQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtRQUNFLElBQUMsQ0FBQSxJQUFELEdBQVEsSUFBQyxDQUFBLFFBRFg7O01BRUEsSUFBQyxDQUFBLFVBQUQsQ0FBQTtJQUxXOztxQkFPYixVQUFBLEdBQVksU0FBQTthQUFHLElBQUMsQ0FBQSxJQUFELEtBQVM7SUFBWjs7cUJBQ1osV0FBQSxHQUFhLFNBQUE7YUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTO0lBQVo7O3FCQUViLFNBQUEsR0FBVyxTQUFDLElBQUQ7TUFDVCxJQUFHLElBQUEsS0FBUSxlQUFYO1FBQ0UsSUFBRyxJQUFDLENBQUEsSUFBRCxLQUFTLFVBQVo7VUFDRSxJQUFDLENBQUEsU0FBRCxHQUFhLE1BRGY7U0FBQSxNQUFBO1VBR0UsSUFBQyxDQUFBLFNBQUQsR0FBYSxDQUFJLElBQUMsQ0FBQSxVQUhwQjtTQURGOzthQUtBLElBQUMsQ0FBQSxJQUFELEdBQVE7SUFOQzs7cUJBUVgsdUJBQUEsR0FBeUIsU0FBQyxNQUFELEVBQVMsS0FBVDtNQUN2QixJQUFtQyxhQUFuQztlQUFBLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUF6QixFQUFBOztJQUR1Qjs7cUJBR3pCLHVCQUFBLEdBQXlCLFNBQUMsTUFBRCxFQUFTLEtBQVQ7TUFDdkIsSUFBbUMsYUFBbkM7ZUFBQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekIsRUFBQTs7SUFEdUI7O3FCQUd6QixnQkFBQSxHQUFrQixTQUFDLE1BQUQ7QUFDaEIsVUFBQTtNQUFBLElBQUcsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFBLElBQTBCLElBQUMsQ0FBQSxJQUE5QjtRQUNFLGNBQUEsR0FBaUIsTUFBTSxDQUFDLGlCQUFQLENBQUEsRUFEbkI7O01BR0EsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaO01BRUEsSUFBRyx3QkFBQSxJQUFvQixDQUFJLGNBQWMsQ0FBQyxPQUFmLENBQXVCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQXZCLENBQTNCO1FBQ0UsSUFBQyxDQUFBLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBZixDQUFtQixHQUFuQixFQUF3QixjQUF4QjtlQUNBLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQWYsQ0FBbUIsR0FBbkIsRUFBd0IsY0FBeEIsRUFGRjs7SUFOZ0I7O3FCQVVsQixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxJQUFHLHFCQUFIO1FBQ0UsSUFBQyxDQUFBLE1BQUQsQ0FBQSxFQURGO09BQUEsTUFBQTtBQUdFO0FBQUEsYUFBQSxzQ0FBQTs7VUFBQSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsTUFBbEI7QUFBQSxTQUhGOztNQUlBLElBQUMsQ0FBQSxNQUFNLENBQUMsWUFBUixDQUFBO2FBQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQywyQkFBUixDQUFBO0lBTk87O3FCQVNULE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLGFBQUEsR0FBZ0IsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFULElBQXFCLElBQUMsQ0FBQSxFQUFELENBQUksa0JBQUo7QUFDckM7QUFBQSxXQUFBLHNDQUFBOztRQUNFLFNBQVMsQ0FBQyxlQUFWLENBQTBCLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUE7bUJBQ3hCLEtBQUMsQ0FBQSxnQkFBRCxDQUFrQixTQUFTLENBQUMsTUFBNUI7VUFEd0I7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTFCO1FBR0EsU0FBQSxpREFBNkIsQ0FBSSxTQUFTLENBQUMsT0FBVixDQUFBLEVBQXJCLElBQTRDLENBQUMsSUFBQyxDQUFBLHFCQUFELElBQTJCLElBQUMsQ0FBQSxVQUFELENBQUEsQ0FBNUI7UUFDeEQsSUFBRyxhQUFBLElBQWlCLENBQUMsU0FBQSxJQUFjLENBQUMsSUFBQyxDQUFBLFNBQUQsSUFBYyxJQUFDLENBQUEsVUFBRCxDQUFBLENBQWYsQ0FBZixDQUFwQjtVQUNFLFVBQUEsR0FBYSxJQUFDLENBQUEsS0FBRCxDQUFPLFNBQVA7VUFDYixVQUFVLENBQUMsY0FBWCxDQUEwQixJQUExQjtVQUNBLFVBQVUsQ0FBQyxTQUFYLENBQXFCLElBQUMsQ0FBQSxJQUF0QixFQUhGOztBQUxGO01BVUEsSUFBc0QsSUFBQyxDQUFBLElBQUQsS0FBUyxXQUEvRDtlQUFBLElBQUMsQ0FBQSxRQUFRLENBQUMseUJBQVYsQ0FBQSxDQUFxQyxDQUFDLFVBQXRDLENBQUEsRUFBQTs7SUFaTTs7cUJBY1Isa0JBQUEsR0FBb0IsU0FBQyxNQUFELEVBQVMsR0FBVCxFQUFjLE9BQWQ7TUFDbEIsSUFBRyxJQUFDLENBQUEsY0FBRCxJQUFvQixDQUFJLElBQUMsQ0FBQSxTQUFELENBQVcsc0JBQVgsQ0FBM0I7ZUFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsSUFBQyxDQUFBLHFDQUFELENBQXVDLEdBQXZDLENBQXpCLEVBQXNFLE9BQXRFLEVBREY7T0FBQSxNQUFBO2VBR0UsWUFBQSxDQUFhLE1BQWIsRUFBcUIsR0FBckIsRUFBMEIsT0FBMUIsRUFIRjs7SUFEa0I7O3FCQVdwQixvQkFBQSxHQUFzQixTQUFDLE1BQUQsRUFBUyxFQUFUO0FBQ3BCLFVBQUE7TUFBQSxXQUFBLEdBQWMsTUFBTSxDQUFDLGlCQUFQLENBQUE7YUFDZCxJQUFDLENBQUEsVUFBRCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBWixFQUF5QixTQUFDLEtBQUQ7QUFDdkIsWUFBQTtRQUFBLEVBQUEsQ0FBRyxLQUFIO1FBQ0EsSUFBRyxDQUFDLFdBQUEsR0FBYyxNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFmLENBQTBDLENBQUMsT0FBM0MsQ0FBbUQsV0FBbkQsQ0FBSDtVQUNFLEtBQUssQ0FBQyxJQUFOLENBQUEsRUFERjs7ZUFFQSxXQUFBLEdBQWM7TUFKUyxDQUF6QjtJQUZvQjs7cUJBUXRCLGVBQUEsR0FBaUIsU0FBQyxJQUFEO01BQ2YsSUFBRyxJQUFDLENBQUEsU0FBRCxDQUFXLGlCQUFBLEdBQWtCLElBQUMsQ0FBQSxtQkFBOUIsQ0FBSDtlQUNFLElBQUksQ0FBQyxNQUFMLENBQVksT0FBWixDQUFBLEtBQTBCLENBQUMsRUFEN0I7T0FBQSxNQUFBO2VBR0UsQ0FBSSxJQUFDLENBQUEsU0FBRCxDQUFXLGVBQUEsR0FBZ0IsSUFBQyxDQUFBLG1CQUE1QixFQUhOOztJQURlOzs7O0tBdEZFOztFQTZGZjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7OytCQUNBLGVBQUEsR0FBaUI7OytCQUNqQix3QkFBQSxHQUEwQjs7K0JBQzFCLFNBQUEsR0FBVzs7K0JBRVgsVUFBQSxHQUFZLFNBQUE7TUFDVixrREFBQSxTQUFBO2FBQ0EsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUk7SUFGZjs7K0JBSVosVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxJQUFHLElBQUMsQ0FBQSxJQUFELEtBQVMsUUFBWjtRQUNFLElBQUcsSUFBQyxDQUFBLFdBQUQsQ0FBQSxDQUFIO2lCQUNFLElBQUMsQ0FBQSx3QkFBRCxHQUE0QixJQUFDLENBQUEsS0FBRCxDQUFPLE1BQU0sQ0FBQyxTQUFkLENBQXdCLENBQUMsMkJBQXpCLENBQUEsRUFEOUI7U0FBQSxNQUFBO2lCQUdFLElBQUMsQ0FBQSxlQUFELEdBQW1CLElBQUMsQ0FBQSxNQUFNLENBQUMsc0JBQVIsQ0FBQSxDQUFnQyxDQUFDLFNBQWpDLENBQUEsRUFIckI7U0FERjtPQUFBLE1BQUE7UUFPRSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlCQUFQLENBQUE7UUFFUixJQUFHLHFDQUFIO2lCQUNFLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUFLLENBQUMsU0FBTixDQUFnQixJQUFDLENBQUEsd0JBQWpCLENBQXpCLEVBREY7U0FBQSxNQUFBO2lCQUdFLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUFLLENBQUMsUUFBTixDQUFlLElBQUMsQ0FBQSxlQUFoQixDQUF6QixFQUhGO1NBVEY7O0lBRFU7OytCQWVaLE1BQUEsR0FBUSxTQUFBO0FBQ04sVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLElBQUQsS0FBUyxRQUFaO1FBQ0UsOENBQUEsU0FBQSxFQURGO09BQUEsTUFBQTtBQUdFO0FBQUEsYUFBQSxzQ0FBQTs7Z0JBQXdDLFNBQUEsR0FBWSxJQUFDLENBQUEsaUJBQWlCLENBQUMsR0FBbkIsQ0FBdUIsTUFBdkI7OztVQUNqRCx5Q0FBRCxFQUFpQjtVQUNqQixJQUFHLGNBQWMsQ0FBQyxPQUFmLENBQXVCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQXZCLENBQUg7WUFDRSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsZ0JBQXpCLEVBREY7O0FBRkY7UUFJQSw4Q0FBQSxTQUFBLEVBUEY7O0FBZUE7QUFBQTtXQUFBLHdDQUFBOztRQUNFLGdCQUFBLEdBQW1CLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBakIsQ0FBQSxDQUFpQyxDQUFDO3FCQUNyRCxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQTtZQUNwQixjQUFBLEdBQWlCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO21CQUNqQixLQUFDLENBQUEsaUJBQWlCLENBQUMsR0FBbkIsQ0FBdUIsTUFBdkIsRUFBK0I7Y0FBQyxrQkFBQSxnQkFBRDtjQUFtQixnQkFBQSxjQUFuQjthQUEvQjtVQUZvQjtRQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBdEI7QUFGRjs7SUFoQk07Ozs7S0F6QnFCOztFQStDekI7Ozs7Ozs7SUFDSixRQUFDLENBQUEsTUFBRCxDQUFBOzt1QkFDQSxVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLFNBQUEsR0FBWSxJQUFDLENBQUEsU0FBRCxDQUFXLHFCQUFYO2FBQ1osSUFBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLFNBQUE7ZUFDNUIsY0FBQSxDQUFlLE1BQWYsRUFBdUI7VUFBQyxXQUFBLFNBQUQ7U0FBdkI7TUFENEIsQ0FBOUI7SUFGVTs7OztLQUZTOztFQU9qQjs7Ozs7OztJQUNKLFNBQUMsQ0FBQSxNQUFELENBQUE7O3dCQUNBLGlCQUFBLEdBQW1CLFNBQUMsTUFBRDtNQUNqQixJQUFHLElBQUMsQ0FBQSxzQkFBRCxDQUFBLENBQUEsSUFBOEIsQ0FBSSxNQUFNLENBQUMsYUFBUCxDQUFBLENBQXJDO2VBQ0UsTUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsU0FBRCxDQUFXLHFCQUFYLEVBSEY7O0lBRGlCOzt3QkFNbkIsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixNQUF0QixFQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDNUIsY0FBQTtVQUFBLGNBQUEsR0FBaUIsTUFBTSxDQUFDLGlCQUFQLENBQUE7VUFDakIsS0FBQyxDQUFBLE1BQU0sQ0FBQyxlQUFSLENBQXdCLGNBQWMsQ0FBQyxHQUF2QztVQUNBLFNBQUEsR0FBWSxLQUFDLENBQUEsaUJBQUQsQ0FBbUIsTUFBbkI7VUFDWixlQUFBLENBQWdCLE1BQWhCO1VBQ0EsSUFBRyxNQUFNLENBQUMsYUFBUCxDQUFBLENBQUEsSUFBMkIsU0FBM0IsSUFBeUMsQ0FBSSxxQkFBQSxDQUFzQixLQUFDLENBQUEsTUFBdkIsRUFBK0IsY0FBL0IsQ0FBaEQ7bUJBQ0UsZUFBQSxDQUFnQixNQUFoQixFQUF3QjtjQUFDLFdBQUEsU0FBRDthQUF4QixFQURGOztRQUw0QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7SUFEVTs7OztLQVJVOztFQWlCbEI7Ozs7Ozs7SUFDSixxQkFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztvQ0FFQSxVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsZUFBQSxDQUFnQixNQUFoQixFQUF3QixNQUFNLENBQUMsZUFBUCxDQUFBLENBQUEsR0FBMkIsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFuRDtJQURVOzs7O0tBSHNCOztFQU05Qjs7Ozs7OztJQUNKLE1BQUMsQ0FBQSxNQUFELENBQUE7O3FCQUNBLElBQUEsR0FBTTs7cUJBQ04sSUFBQSxHQUFNOztxQkFFTixZQUFBLEdBQWMsU0FBQyxHQUFEO01BQ1osR0FBQSxHQUFNLElBQUMsQ0FBQSxVQUFELENBQVksR0FBWjtNQUNOLElBQUcsSUFBQyxDQUFBLE1BQU0sQ0FBQyxtQkFBUixDQUE0QixHQUE1QixDQUFIO2VBQ0Usb0NBQUEsQ0FBcUMsSUFBQyxDQUFBLE1BQXRDLEVBQThDLEdBQTlDLENBQWtELENBQUMsS0FBSyxDQUFDLElBRDNEO09BQUEsTUFBQTtlQUdFLElBSEY7O0lBRlk7O3FCQU9kLFVBQUEsR0FBWSxTQUFDLEdBQUQ7QUFDVixVQUFBO01BQUEsR0FBQSxHQUFNO01BQ04sSUFBRyxJQUFDLENBQUEsSUFBRCxJQUFVLEdBQUEsS0FBTyxHQUFwQjtlQUNFLElBQUMsQ0FBQSxtQkFBRCxDQUFBLEVBREY7T0FBQSxNQUFBO2VBR0UsV0FBQSxDQUFZLEdBQUEsR0FBTSxDQUFsQixFQUFxQjtVQUFDLEtBQUEsR0FBRDtTQUFyQixFQUhGOztJQUZVOztxQkFPWixVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDNUIsWUFBQSxDQUFhLE1BQWIsRUFBcUIsS0FBQyxDQUFBLFlBQUQsQ0FBYyxNQUFNLENBQUMsWUFBUCxDQUFBLENBQWQsQ0FBckI7UUFENEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBRFU7Ozs7S0FuQk87O0VBdUJmOzs7Ozs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBQTs7eUJBQ0EsSUFBQSxHQUFNOzs7O0tBRmlCOztFQUluQjs7Ozs7OztJQUNKLFFBQUMsQ0FBQSxNQUFELENBQUE7O3VCQUNBLElBQUEsR0FBTTs7dUJBQ04sSUFBQSxHQUFNOzt1QkFFTixZQUFBLEdBQWMsU0FBQyxHQUFEO01BQ1osSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLG1CQUFSLENBQTRCLEdBQTVCLENBQUg7UUFDRSxHQUFBLEdBQU0sb0NBQUEsQ0FBcUMsSUFBQyxDQUFBLE1BQXRDLEVBQThDLEdBQTlDLENBQWtELENBQUMsR0FBRyxDQUFDLElBRC9EOzthQUVBLElBQUMsQ0FBQSxVQUFELENBQVksR0FBWjtJQUhZOzt1QkFLZCxVQUFBLEdBQVksU0FBQyxHQUFEO0FBQ1YsVUFBQTtNQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsbUJBQUQsQ0FBQTtNQUNOLElBQUcsSUFBQyxDQUFBLElBQUQsSUFBVSxHQUFBLElBQU8sR0FBcEI7ZUFDRSxFQURGO09BQUEsTUFBQTtlQUdFLFdBQUEsQ0FBWSxHQUFBLEdBQU0sQ0FBbEIsRUFBcUI7VUFBQyxLQUFBLEdBQUQ7U0FBckIsRUFIRjs7SUFGVTs7OztLQVZTOztFQWlCakI7Ozs7Ozs7SUFDSixZQUFDLENBQUEsTUFBRCxDQUFBOzsyQkFDQSxJQUFBLEdBQU07Ozs7S0FGbUI7O0VBSXJCOzs7Ozs7O0lBQ0osWUFBQyxDQUFBLE1BQUQsQ0FBQTs7MkJBQ0EsSUFBQSxHQUFNOzsyQkFDTixTQUFBLEdBQVc7OzJCQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsU0FBQTtlQUM1QixrQkFBQSxDQUFtQixNQUFuQjtNQUQ0QixDQUE5QjtJQURVOzs7O0tBTGE7O0VBU3JCOzs7Ozs7O0lBQ0osY0FBQyxDQUFBLE1BQUQsQ0FBQTs7NkJBQ0EsSUFBQSxHQUFNOzs2QkFDTixTQUFBLEdBQVc7OzZCQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsU0FBQTtlQUM1QixvQkFBQSxDQUFxQixNQUFyQjtNQUQ0QixDQUE5QjtJQURVOzs7O0tBTGU7O0VBY3ZCOzs7Ozs7O0lBQ0osWUFBQyxDQUFBLE1BQUQsQ0FBQTs7MkJBQ0EsSUFBQSxHQUFNOzsyQkFDTixJQUFBLEdBQU07OzJCQUNOLFNBQUEsR0FBVzs7SUFDWCxZQUFDLENBQUEsV0FBRCxHQUFjOzsyQkFFZCxVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDNUIsS0FBQyxDQUFBLHVCQUFELENBQXlCLE1BQXpCLEVBQWlDLEtBQUMsQ0FBQSxRQUFELENBQVUsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBVixDQUFqQztRQUQ0QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7SUFEVTs7MkJBSVosUUFBQSxHQUFVLFNBQUMsU0FBRDtBQUNSLFVBQUE7TUFBQSxNQUFBLEdBQVMsU0FBUyxDQUFDO0FBQ25CO0FBQUEsV0FBQSxzQ0FBQTs7WUFBd0MsSUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFBLEdBQVksSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLE1BQVgsQ0FBcEI7QUFDdEMsaUJBQU87O0FBRFQ7SUFGUTs7MkJBS1YsV0FBQSxHQUFhLFNBQUMsR0FBRDtBQUNYLFVBQUE7TUFEYSxNQUFEO01BQ1osUUFBQSxHQUFXLG9CQUFvQixDQUFDLElBQXJCLENBQTBCLElBQTFCLEVBQWdDLElBQUMsQ0FBQSxNQUFqQztBQUNYLGNBQU8sSUFBQyxDQUFBLFNBQVI7QUFBQSxhQUNPLElBRFA7aUJBQ2lCOzs7OztBQURqQixhQUVPLE1BRlA7aUJBRW1COzs7OztBQUZuQjtJQUZXOzsyQkFNYixNQUFBLEdBQVEsU0FBQyxLQUFEO0FBQ04sVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLGdCQUFELENBQWtCLEtBQWxCLENBQUg7UUFFRSxLQUFBLEdBQVEsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsQ0FBQyxDQUFDLENBQUYsRUFBSyxDQUFMLENBQWhCO1FBQ1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxTQUFOLENBQWdCLENBQUMsQ0FBQyxDQUFGLEVBQUssQ0FBTCxDQUFoQjtlQUNSLENBQUMsQ0FBSSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FBTCxDQUFBLElBQWtDLENBQUMsQ0FBSSxJQUFDLENBQUEsZ0JBQUQsQ0FBa0IsS0FBbEIsQ0FBTCxFQUpwQztPQUFBLE1BQUE7ZUFNRSxNQU5GOztJQURNOzsyQkFTUixnQkFBQSxHQUFrQixTQUFDLEtBQUQ7QUFDaEIsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLG9CQUFELENBQXNCLEtBQXRCLENBQUg7ZUFDRSxLQURGO09BQUEsTUFBQTtRQUdFLFNBQUEsR0FBWSxLQUFLLENBQUMsU0FBTixDQUFnQixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBaEI7UUFDWixVQUFBLEdBQWEsS0FBSyxDQUFDLFNBQU4sQ0FBZ0IsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWhCO2VBQ2IsSUFBQyxDQUFBLG9CQUFELENBQXNCLFNBQXRCLENBQUEsSUFBcUMsSUFBQyxDQUFBLG9CQUFELENBQXNCLFVBQXRCLEVBTHZDOztJQURnQjs7MkJBUWxCLG9CQUFBLEdBQXNCLFNBQUMsS0FBRDtBQUNwQixVQUFBO01BQUEsSUFBQSxHQUFPLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixLQUFLLENBQUMsa0JBQU4sQ0FBeUIsS0FBekIsRUFBZ0MsQ0FBaEMsRUFBbUMsQ0FBbkMsQ0FBOUI7YUFDUCxjQUFBLElBQVUsSUFBSSxDQUFDLElBQUwsQ0FBVSxJQUFWO0lBRlU7Ozs7S0F2Q0c7O0VBMkNyQjs7Ozs7OztJQUNKLGNBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsY0FBQyxDQUFBLFdBQUQsR0FBYzs7NkJBQ2QsU0FBQSxHQUFXOzs7O0tBSGdCOztFQU92Qjs7Ozs7OztJQUNKLGNBQUMsQ0FBQSxNQUFELENBQUE7OzZCQUNBLFNBQUEsR0FBVzs7NkJBRVgsUUFBQSxHQUFVLFNBQUMsT0FBRCxFQUFVLElBQVY7QUFDUixVQUFBO01BQUEsU0FBQSxHQUFZO01BQ1osS0FBQSxHQUFRO01BQ1IsTUFBQSxHQUFTLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixJQUFDLENBQUEsTUFBMUI7TUFFVCxJQUFDLENBQUEsV0FBRCxDQUFhLE9BQWIsRUFBc0I7UUFBQyxNQUFBLElBQUQ7T0FBdEIsRUFBOEIsU0FBQyxHQUFEO0FBQzVCLFlBQUE7UUFEOEIsbUJBQU8sMkJBQVc7UUFDaEQsU0FBQSxHQUFZO1FBRVosSUFBVSxTQUFBLEtBQWEsRUFBYixJQUFvQixLQUFLLENBQUMsS0FBSyxDQUFDLE1BQVosS0FBd0IsQ0FBdEQ7QUFBQSxpQkFBQTs7UUFDQSxJQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsYUFBWixDQUEwQixJQUExQixDQUFIO1VBQ0UsS0FBQSxHQUFRO2lCQUNSLElBQUEsQ0FBQSxFQUZGOztNQUo0QixDQUE5QjtNQVFBLElBQUcsS0FBSDtRQUNFLEtBQUEsR0FBUSxTQUFTLENBQUM7UUFDbEIsSUFBRywrQkFBQSxDQUFnQyxJQUFDLENBQUEsTUFBakMsRUFBeUMsS0FBekMsQ0FBQSxJQUFvRCxDQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsTUFBZCxDQUEzRDtpQkFDRSxLQUFLLENBQUMsUUFBTixDQUFlLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBZixFQURGO1NBQUEsTUFBQTtpQkFHRSxNQUhGO1NBRkY7T0FBQSxNQUFBO29GQU9tQixLQVBuQjs7SUFiUTs7NkJBZ0NWLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsY0FBQSxHQUFpQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUNqQixJQUFVLHFCQUFBLENBQXNCLElBQUMsQ0FBQSxNQUF2QixFQUErQixjQUEvQixDQUFWO0FBQUEsZUFBQTs7TUFDQSxlQUFBLEdBQWtCLG1CQUFBLENBQW9CLElBQUMsQ0FBQSxNQUFyQixFQUE2QixjQUE3QjtNQUVsQixzQkFBQSxHQUF5QixJQUFDLENBQUEsc0JBQUQsQ0FBQTthQUN6QixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDNUIsY0FBQTtVQUQ4QixVQUFEO1VBQzdCLGNBQUEsR0FBaUIsTUFBTSxDQUFDLGlCQUFQLENBQUE7VUFDakIsSUFBRyxVQUFBLENBQVcsS0FBQyxDQUFBLE1BQVosRUFBb0IsY0FBYyxDQUFDLEdBQW5DLENBQUEsSUFBNEMsc0JBQS9DO1lBQ0UsS0FBQSxHQUFRLGNBQWMsQ0FBQyxRQUFmLENBQXdCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBeEIsRUFEVjtXQUFBLE1BQUE7WUFHRSxPQUFBLDZDQUF1QixNQUFNLENBQUMsVUFBUCxDQUFBO1lBQ3ZCLEtBQUEsR0FBUSxLQUFDLENBQUEsUUFBRCxDQUFVLE9BQVYsRUFBbUIsY0FBbkI7WUFDUixJQUFHLE9BQUEsSUFBWSxzQkFBZjtjQUNFLElBQUcsS0FBQyxDQUFBLFFBQVEsQ0FBQyxFQUFWLENBQWEsUUFBYixDQUFBLElBQTJCLENBQUMsQ0FBSSxlQUFMLENBQTlCO2dCQUNFLEtBQUEsR0FBUSxNQUFNLENBQUMsaUNBQVAsQ0FBeUM7a0JBQUUsV0FBRCxLQUFDLENBQUEsU0FBRjtpQkFBekMsRUFEVjtlQUFBLE1BQUE7Z0JBR0UsS0FBQSxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsS0FBVixFQUFpQix3QkFBQSxDQUF5QixLQUFDLENBQUEsTUFBMUIsRUFBa0MsY0FBYyxDQUFDLEdBQWpELENBQWpCLEVBSFY7ZUFERjthQUxGOztpQkFVQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7UUFaNEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBTlU7Ozs7S0FwQ2U7O0VBeUR2Qjs7Ozs7OztJQUNKLGtCQUFDLENBQUEsTUFBRCxDQUFBOztpQ0FDQSxTQUFBLEdBQVc7O2lDQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQzVCLGNBQUE7VUFBQSxLQUFBLEdBQVEsTUFBTSxDQUFDLHVDQUFQLENBQStDO1lBQUUsV0FBRCxLQUFDLENBQUEsU0FBRjtXQUEvQztpQkFDUixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7UUFGNEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBRFU7Ozs7S0FKbUI7O0VBUzNCOzs7Ozs7O0lBQ0osZUFBQyxDQUFBLE1BQUQsQ0FBQTs7OEJBQ0EsU0FBQSxHQUFXOzs4QkFDWCxTQUFBLEdBQVc7OzhCQUVYLG1CQUFBLEdBQXFCLFNBQUMsTUFBRDtBQUNuQixVQUFBO01BQUEsNkJBQUEsQ0FBOEIsTUFBOUI7TUFDQSxLQUFBLEdBQVEsTUFBTSxDQUFDLGlDQUFQLENBQXlDO1FBQUUsV0FBRCxJQUFDLENBQUEsU0FBRjtPQUF6QyxDQUFzRCxDQUFDLFNBQXZELENBQWlFLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUFqRTtNQUNSLEtBQUEsR0FBUSxLQUFLLENBQUMsR0FBTixDQUFVLEtBQVYsRUFBaUIsSUFBQyxDQUFBLHVCQUFELENBQUEsQ0FBakI7YUFDUixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7SUFKbUI7OzhCQU1yQixVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtBQUM1QixjQUFBO1VBQUEsYUFBQSxHQUFnQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtVQUNoQixLQUFDLENBQUEsbUJBQUQsQ0FBcUIsTUFBckI7VUFDQSxJQUFHLGFBQWEsQ0FBQyxPQUFkLENBQXNCLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQXRCLENBQUg7WUFFRSxNQUFNLENBQUMsU0FBUCxDQUFBO21CQUNBLEtBQUMsQ0FBQSxtQkFBRCxDQUFxQixNQUFyQixFQUhGOztRQUg0QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7SUFEVTs7OztLQVhnQjs7RUFxQnhCOzs7Ozs7O0lBQ0osdUJBQUMsQ0FBQSxNQUFELENBQUE7O3NDQUNBLFNBQUEsR0FBVzs7c0NBRVgsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBQTtNQUNSLFNBQUEsR0FBWSxNQUFNLENBQUMseUJBQVAsQ0FBQTtNQUNaLGNBQUEsR0FBaUIsTUFBTSxDQUFDLGlCQUFQLENBQUE7TUFHakIsSUFBRyxjQUFjLENBQUMsYUFBZixDQUE2QixTQUFTLENBQUMsS0FBdkMsQ0FBQSxJQUFrRCxjQUFjLENBQUMsVUFBZixDQUEwQixTQUFTLENBQUMsR0FBcEMsQ0FBckQ7UUFDRSxLQUFBLElBQVMsRUFEWDs7QUFHQSxXQUFJLDZFQUFKO1FBQ0UsS0FBQSxHQUFRLE1BQU0sQ0FBQyx1Q0FBUCxDQUErQztVQUFFLFdBQUQsSUFBQyxDQUFBLFNBQUY7U0FBL0M7UUFDUixNQUFNLENBQUMsaUJBQVAsQ0FBeUIsS0FBekI7QUFGRjtNQUlBLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixNQUFyQjtNQUNBLElBQUcsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBMEIsQ0FBQyxvQkFBM0IsQ0FBZ0QsY0FBaEQsQ0FBSDtlQUNFLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixDQUFDLENBQUQsRUFBSSxDQUFKLENBQXpCLEVBREY7O0lBZFU7O3NDQWlCWixtQkFBQSxHQUFxQixTQUFDLE1BQUQ7QUFDbkIsVUFBQTtNQUFBLEtBQUEsR0FBUSxNQUFNLENBQUMsaUNBQVAsQ0FBeUM7UUFBRSxXQUFELElBQUMsQ0FBQSxTQUFGO09BQXpDLENBQXNELENBQUMsU0FBdkQsQ0FBaUUsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQWpFO01BQ1IsS0FBQSxHQUFRLEtBQUssQ0FBQyxHQUFOLENBQVUsS0FBVixFQUFpQixJQUFDLENBQUEsdUJBQUQsQ0FBQSxDQUFqQjthQUNSLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUF6QjtJQUhtQjs7OztLQXJCZTs7RUE0QmhDOzs7Ozs7O0lBQ0osbUJBQUMsQ0FBQSxNQUFELENBQUE7O2tDQUNBLFNBQUEsR0FBVzs7OztLQUZxQjs7RUFJNUI7Ozs7Ozs7SUFDSix1QkFBQyxDQUFBLE1BQUQsQ0FBQTs7c0NBQ0EsU0FBQSxHQUFXOzs7O0tBRnlCOztFQUloQzs7Ozs7OztJQUNKLG9CQUFDLENBQUEsTUFBRCxDQUFBOzttQ0FDQSxTQUFBLEdBQVc7Ozs7S0FGc0I7O0VBSzdCOzs7Ozs7O0lBQ0osNEJBQUMsQ0FBQSxNQUFELENBQUE7OzJDQUNBLFNBQUEsR0FBVzs7OztLQUY4Qjs7RUFNckM7Ozs7Ozs7SUFDSiwwQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSwwQkFBQyxDQUFBLFdBQUQsR0FBYzs7eUNBQ2QsU0FBQSxHQUFXOzs7O0tBSDRCOztFQUtuQzs7Ozs7OztJQUNKLDhCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLDhCQUFDLENBQUEsV0FBRCxHQUFjOzs2Q0FDZCxTQUFBLEdBQVc7Ozs7S0FIZ0M7O0VBS3ZDOzs7Ozs7O0lBQ0osMkJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsMkJBQUMsQ0FBQSxXQUFELEdBQWM7OzBDQUNkLFNBQUEsR0FBVzs7OztLQUg2Qjs7RUFPcEM7Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxtQkFBQyxDQUFBLFdBQUQsR0FBYzs7a0NBQ2QsU0FBQSxHQUFXOzs7O0tBSHFCOztFQUs1Qjs7Ozs7OztJQUNKLHVCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLHVCQUFDLENBQUEsV0FBRCxHQUFjOztzQ0FDZCxTQUFBLEdBQVc7Ozs7S0FIeUI7O0VBS2hDOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0Esb0JBQUMsQ0FBQSxXQUFELEdBQWM7O21DQUNkLFNBQUEsR0FBVzs7OztLQUhzQjs7RUFPN0I7Ozs7Ozs7SUFDSixpQkFBQyxDQUFBLE1BQUQsQ0FBQTs7Z0NBQ0EsVUFBQSxHQUFZLFNBQUMsTUFBRDtNQUNWLElBQUMsQ0FBQSxTQUFELEdBQWEsTUFBTSxDQUFDLGFBQVAsQ0FBQTthQUNiLG1EQUFBLFNBQUE7SUFGVTs7OztLQUZrQjs7RUFNMUI7Ozs7Ozs7SUFDSixxQkFBQyxDQUFBLE1BQUQsQ0FBQTs7b0NBQ0EsVUFBQSxHQUFZLFNBQUMsTUFBRDtNQUNWLElBQUMsQ0FBQSxTQUFELEdBQWEsTUFBTSxDQUFDLGFBQVAsQ0FBQTthQUNiLHVEQUFBLFNBQUE7SUFGVTs7OztLQUZzQjs7RUFNOUI7Ozs7Ozs7SUFDSixrQkFBQyxDQUFBLE1BQUQsQ0FBQTs7aUNBQ0EsVUFBQSxHQUFZLFNBQUMsTUFBRDtNQUNWLElBQUMsQ0FBQSxTQUFELEdBQWEsTUFBTSxDQUFDLGFBQVAsQ0FBQTthQUNiLG9EQUFBLFNBQUE7SUFGVTs7OztLQUZtQjs7RUFjM0I7Ozs7Ozs7SUFDSixrQkFBQyxDQUFBLE1BQUQsQ0FBQTs7aUNBQ0EsSUFBQSxHQUFNOztpQ0FDTixhQUFBLEdBQWU7O2lDQUNmLFNBQUEsR0FBVzs7aUNBRVgsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixNQUF0QixFQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzVCLEtBQUMsQ0FBQSx1QkFBRCxDQUF5QixNQUF6QixFQUFpQyxLQUFDLENBQUEsUUFBRCxDQUFVLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQVYsQ0FBakM7UUFENEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBRFU7O2lDQUlaLFFBQUEsR0FBVSxTQUFDLFNBQUQ7TUFDUixJQUFHLElBQUMsQ0FBQSxTQUFELEtBQWMsTUFBakI7ZUFDRSxJQUFDLENBQUEsc0JBQUQsQ0FBd0IsU0FBeEIsRUFERjtPQUFBLE1BRUssSUFBRyxJQUFDLENBQUEsU0FBRCxLQUFjLFVBQWpCO2VBQ0gsSUFBQyxDQUFBLDBCQUFELENBQTRCLFNBQTVCLEVBREc7O0lBSEc7O2lDQU1WLFVBQUEsR0FBWSxTQUFDLEdBQUQ7YUFDVixJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQXlCLEdBQXpCO0lBRFU7O2lDQUdaLHNCQUFBLEdBQXdCLFNBQUMsSUFBRDtBQUN0QixVQUFBO01BQUEsVUFBQSxHQUFhO01BQ2IsSUFBQyxDQUFBLFdBQUQsQ0FBYSxJQUFDLENBQUEsYUFBZCxFQUE2QjtRQUFDLE1BQUEsSUFBRDtPQUE3QixFQUFxQyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsR0FBRDtBQUNuQyxjQUFBO1VBRHFDLG1CQUFPLDJCQUFXLG1CQUFPO1VBQzlELElBQUcsZ0JBQUg7WUFDRSxPQUFxQixDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBYixFQUFrQixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQTVCLENBQXJCLEVBQUMsa0JBQUQsRUFBVztZQUNYLElBQVUsS0FBQyxDQUFBLFlBQUQsSUFBa0IsS0FBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLENBQTVCO0FBQUEscUJBQUE7O1lBQ0EsSUFBRyxLQUFDLENBQUEsVUFBRCxDQUFZLFFBQVosQ0FBQSxLQUEyQixLQUFDLENBQUEsVUFBRCxDQUFZLE1BQVosQ0FBOUI7Y0FDRSxVQUFBLEdBQWEsS0FBQyxDQUFBLHFDQUFELENBQXVDLE1BQXZDLEVBRGY7YUFIRjtXQUFBLE1BQUE7WUFNRSxVQUFBLEdBQWEsS0FBSyxDQUFDLElBTnJCOztVQU9BLElBQVUsa0JBQVY7bUJBQUEsSUFBQSxDQUFBLEVBQUE7O1FBUm1DO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFyQztrQ0FTQSxhQUFhLElBQUMsQ0FBQSx1QkFBRCxDQUFBO0lBWFM7O2lDQWF4QiwwQkFBQSxHQUE0QixTQUFDLElBQUQ7QUFDMUIsVUFBQTtNQUFBLFVBQUEsR0FBYTtNQUNiLElBQUMsQ0FBQSxZQUFELENBQWMsSUFBQyxDQUFBLGFBQWYsRUFBOEI7UUFBQyxNQUFBLElBQUQ7T0FBOUIsRUFBc0MsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7QUFDcEMsY0FBQTtVQURzQyxtQkFBTyxtQkFBTyxpQkFBTTtVQUMxRCxJQUFHLGdCQUFIO1lBQ0UsT0FBcUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQWIsRUFBa0IsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUE1QixDQUFyQixFQUFDLGtCQUFELEVBQVc7WUFDWCxJQUFHLENBQUksS0FBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLENBQUosSUFBNEIsS0FBQyxDQUFBLFVBQUQsQ0FBWSxRQUFaLENBQS9CO2NBQ0UsS0FBQSxHQUFRLEtBQUMsQ0FBQSxxQ0FBRCxDQUF1QyxNQUF2QztjQUNSLElBQUcsS0FBSyxDQUFDLFVBQU4sQ0FBaUIsSUFBakIsQ0FBSDtnQkFDRSxVQUFBLEdBQWEsTUFEZjtlQUFBLE1BQUE7Z0JBR0UsSUFBVSxLQUFDLENBQUEsWUFBWDtBQUFBLHlCQUFBOztnQkFDQSxVQUFBLEdBQWEsS0FBQyxDQUFBLHFDQUFELENBQXVDLFFBQXZDLEVBSmY7ZUFGRjthQUZGO1dBQUEsTUFBQTtZQVVFLElBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFWLENBQXFCLElBQXJCLENBQUg7Y0FDRSxVQUFBLEdBQWEsS0FBSyxDQUFDLElBRHJCO2FBVkY7O1VBWUEsSUFBVSxrQkFBVjttQkFBQSxJQUFBLENBQUEsRUFBQTs7UUFib0M7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQXRDO2tDQWNBLGFBQWEsQ0FBQyxDQUFELEVBQUksQ0FBSjtJQWhCYTs7OztLQWhDRzs7RUFrRDNCOzs7Ozs7O0lBQ0osc0JBQUMsQ0FBQSxNQUFELENBQUE7O3FDQUNBLFNBQUEsR0FBVzs7OztLQUZ3Qjs7RUFJL0I7Ozs7Ozs7SUFDSiw4QkFBQyxDQUFBLE1BQUQsQ0FBQTs7NkNBQ0EsWUFBQSxHQUFjOzs7O0tBRjZCOztFQUl2Qzs7Ozs7OztJQUNKLGtDQUFDLENBQUEsTUFBRCxDQUFBOztpREFDQSxZQUFBLEdBQWM7Ozs7S0FGaUM7O0VBTTNDOzs7Ozs7O0lBQ0osbUJBQUMsQ0FBQSxNQUFELENBQUE7O2tDQUNBLElBQUEsR0FBTTs7a0NBQ04sU0FBQSxHQUFXOztrQ0FFWCxVQUFBLEdBQVksU0FBQyxNQUFEO2FBQ1YsSUFBQyxDQUFBLG9CQUFELENBQXNCLE1BQXRCLEVBQThCLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQTtpQkFDNUIsS0FBQyxDQUFBLHVCQUFELENBQXlCLE1BQXpCLEVBQWlDLEtBQUMsQ0FBQSxRQUFELENBQVUsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBVixDQUFqQztRQUQ0QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7SUFEVTs7a0NBSVosUUFBQSxHQUFVLFNBQUMsU0FBRDtBQUNSLFVBQUE7TUFBQSxRQUFBLEdBQVcsU0FBUyxDQUFDO01BQ3JCLGdCQUFBLEdBQW1CLENBQUksSUFBQyxDQUFBLE1BQU0sQ0FBQyxnQkFBUixDQUF5QixRQUF6QjtBQUN2Qjs7OztBQUFBLFdBQUEsc0NBQUE7O1FBQ0UsSUFBRyxJQUFDLENBQUEsTUFBTSxDQUFDLGdCQUFSLENBQXlCLEdBQXpCLENBQUg7VUFDRSxJQUE0QixnQkFBNUI7QUFBQSxtQkFBVyxJQUFBLEtBQUEsQ0FBTSxHQUFOLEVBQVcsQ0FBWCxFQUFYO1dBREY7U0FBQSxNQUFBO1VBR0UsZ0JBQUEsR0FBbUIsS0FIckI7O0FBREY7QUFPQSxjQUFPLElBQUMsQ0FBQSxTQUFSO0FBQUEsYUFDTyxVQURQO2lCQUMyQixJQUFBLEtBQUEsQ0FBTSxDQUFOLEVBQVMsQ0FBVDtBQUQzQixhQUVPLE1BRlA7aUJBRW1CLElBQUMsQ0FBQSx1QkFBRCxDQUFBO0FBRm5CO0lBVlE7Ozs7S0FUc0I7O0VBdUI1Qjs7Ozs7OztJQUNKLHVCQUFDLENBQUEsTUFBRCxDQUFBOztzQ0FDQSxTQUFBLEdBQVc7Ozs7S0FGeUI7O0VBTWhDOzs7Ozs7O0lBQ0oscUJBQUMsQ0FBQSxNQUFELENBQUE7O29DQUVBLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixlQUFBLENBQWdCLE1BQWhCLEVBQXdCLENBQXhCO0lBRFU7Ozs7S0FIc0I7O0VBTTlCOzs7Ozs7O0lBQ0osWUFBQyxDQUFBLE1BQUQsQ0FBQTs7MkJBRUEsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLGVBQUEsQ0FBZ0IsTUFBaEIsRUFBd0IsSUFBQyxDQUFBLFFBQUQsQ0FBVSxDQUFDLENBQVgsQ0FBeEI7SUFEVTs7OztLQUhhOztFQU1yQjs7Ozs7OztJQUNKLHlCQUFDLENBQUEsTUFBRCxDQUFBOzt3Q0FFQSxVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEdBQUEsR0FBTSxvQkFBQSxDQUFxQixJQUFDLENBQUEsTUFBdEIsRUFBOEIsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFBLEdBQXdCLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYLENBQXREO01BQ04sTUFBTSxDQUFDLGlCQUFQLENBQXlCLENBQUMsR0FBRCxFQUFNLEtBQU4sQ0FBekI7YUFDQSxNQUFNLENBQUMsVUFBUCxHQUFvQjtJQUhWOzs7O0tBSDBCOztFQVFsQzs7Ozs7OztJQUNKLHdDQUFDLENBQUEsTUFBRCxDQUFBOzt1REFDQSxTQUFBLEdBQVc7O3VEQUVYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsS0FBQSxHQUFRLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBTSxDQUFDLGlCQUFQLENBQUEsQ0FBVjthQUNSLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUF6QjtJQUZVOzt1REFJWixRQUFBLEdBQVUsU0FBQyxHQUFEO0FBQ1IsVUFBQTtNQURVLE1BQUQ7TUFDVCxHQUFBLEdBQU0sV0FBQSxDQUFZLEdBQUEsR0FBTSxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWCxDQUFsQixFQUFpQztRQUFBLEdBQUEsRUFBSyxJQUFDLENBQUEsbUJBQUQsQ0FBQSxDQUFMO09BQWpDO01BQ04sS0FBQSxHQUFRLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixNQUE5QixFQUFzQyxHQUF0QyxFQUEyQztRQUFBLFNBQUEsRUFBVyxVQUFYO09BQTNDOzRFQUNXLElBQUEsS0FBQSxDQUFNLEdBQU4sRUFBVyxDQUFYO0lBSFg7Ozs7S0FSMkM7O0VBZ0JqRDs7Ozs7OztJQUNKLDBCQUFDLENBQUEsTUFBRCxDQUFBOzt5Q0FDQSxVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEscUNBQUQsQ0FBdUMsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUF2QzthQUNSLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixNQUF6QixFQUFpQyxLQUFqQztJQUZVOzs7O0tBRjJCOztFQU1uQzs7Ozs7OztJQUNKLDRCQUFDLENBQUEsTUFBRCxDQUFBOzsyQ0FDQSxJQUFBLEdBQU07OzJDQUNOLFVBQUEsR0FBWSxTQUFDLE1BQUQ7TUFDVixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsU0FBQTtBQUM1QixZQUFBO1FBQUEsS0FBQSxHQUFRLE1BQU0sQ0FBQyxpQkFBUCxDQUFBO1FBQ1IsSUFBTyxLQUFLLENBQUMsR0FBTixLQUFhLENBQXBCO2lCQUNFLE1BQU0sQ0FBQyxpQkFBUCxDQUF5QixLQUFLLENBQUMsU0FBTixDQUFnQixDQUFDLENBQUMsQ0FBRixFQUFLLENBQUwsQ0FBaEIsQ0FBekIsRUFERjs7TUFGNEIsQ0FBOUI7YUFJQSw4REFBQSxTQUFBO0lBTFU7Ozs7S0FINkI7O0VBVXJDOzs7Ozs7O0lBQ0osOEJBQUMsQ0FBQSxNQUFELENBQUE7OzZDQUNBLElBQUEsR0FBTTs7NkNBQ04sVUFBQSxHQUFZLFNBQUMsTUFBRDtNQUNWLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixNQUF0QixFQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7QUFDNUIsY0FBQTtVQUFBLEtBQUEsR0FBUSxNQUFNLENBQUMsaUJBQVAsQ0FBQTtVQUNSLElBQU8sS0FBQyxDQUFBLG1CQUFELENBQUEsQ0FBQSxLQUEwQixLQUFLLENBQUMsR0FBdkM7bUJBQ0UsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQUssQ0FBQyxTQUFOLENBQWdCLENBQUMsQ0FBQyxDQUFGLEVBQUssQ0FBTCxDQUFoQixDQUF6QixFQURGOztRQUY0QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBOUI7YUFJQSxnRUFBQSxTQUFBO0lBTFU7Ozs7S0FIK0I7O0VBVXZDOzs7Ozs7O0lBQ0osaUNBQUMsQ0FBQSxNQUFELENBQUE7O2dEQUNBLFlBQUEsR0FBYzs7Z0RBQ2QsUUFBQSxHQUFVLFNBQUE7YUFBRyxpRUFBQSxTQUFBLENBQUEsR0FBUTtJQUFYOzs7O0tBSG9DOztFQU0xQzs7Ozs7OztJQUNKLGVBQUMsQ0FBQSxNQUFELENBQUE7OzhCQUNBLElBQUEsR0FBTTs7OEJBQ04sSUFBQSxHQUFNOzs4QkFDTixjQUFBLEdBQWdCOzs4QkFDaEIscUJBQUEsR0FBdUI7OzhCQUV2QixVQUFBLEdBQVksU0FBQyxNQUFEO01BQ1YsSUFBQyxDQUFBLGtCQUFELENBQW9CLE1BQXBCLEVBQTRCLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixJQUFDLENBQUEsTUFBRCxDQUFBLENBQTlCLENBQTVCO2FBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0I7UUFBQSxNQUFBLEVBQVEsSUFBUjtPQUFsQjtJQUZVOzs4QkFJWixNQUFBLEdBQVEsU0FBQTthQUNOLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0lBRE07Ozs7S0FYb0I7O0VBY3hCOzs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7aUNBQ0EsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxzQkFBQSxHQUF5QixJQUFDLENBQUEsU0FBRCxDQUFXLDhDQUFYO01BQ3pCLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQUssQ0FBQyw2QkFBaEIsQ0FBOEMsSUFBQyxDQUFBLE1BQS9DLEVBQXVELE1BQU0sQ0FBQyxZQUFQLENBQUEsQ0FBdkQsRUFBOEUsSUFBQyxDQUFBLEtBQS9FLEVBQXNGO1FBQUMsd0JBQUEsc0JBQUQ7T0FBdEY7YUFDUixJQUFDLENBQUEsdUJBQUQsQ0FBeUIsTUFBekIsRUFBaUMsS0FBakM7SUFIVTs7OztLQUZtQjs7RUFRM0I7Ozs7Ozs7SUFDSiwyQkFBQyxDQUFBLE1BQUQsQ0FBQTs7MENBQ0EsS0FBQSxHQUFPOzs7O0tBRmlDOztFQUtwQzs7Ozs7OztJQUNKLGdDQUFDLENBQUEsTUFBRCxDQUFBOzsrQ0FDQSxLQUFBLEdBQU87Ozs7S0FGc0M7O0VBS3pDOzs7Ozs7O0lBQ0osK0JBQUMsQ0FBQSxNQUFELENBQUE7OzhDQUNBLEtBQUEsR0FBTzs7OztLQUZxQzs7RUFLeEM7Ozs7Ozs7SUFDSixjQUFDLENBQUEsTUFBRCxDQUFBOzs2QkFDQSxZQUFBLEdBQWM7Ozs7S0FGYTs7RUFLdkI7Ozs7Ozs7SUFDSixtQkFBQyxDQUFBLE1BQUQsQ0FBQTs7a0NBRUEsTUFBQSxHQUFRLFNBQUE7QUFDTixVQUFBO01BQUEsT0FBQSxHQUFVLFdBQUEsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFBLENBQVosRUFBeUI7UUFBQSxHQUFBLEVBQUssR0FBTDtPQUF6QjthQUNWLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxJQUFDLENBQUEsTUFBTSxDQUFDLFlBQVIsQ0FBQSxDQUFBLEdBQXlCLENBQTFCLENBQUEsR0FBK0IsQ0FBQyxPQUFBLEdBQVUsR0FBWCxDQUExQztJQUZNOzs7O0tBSHdCOztFQU81Qjs7Ozs7OztJQUNKLGtCQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O2lDQUNBLElBQUEsR0FBTTs7aUNBQ04scUJBQUEsR0FBdUI7O2lDQUV2QixVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFyQjtNQUVOLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWDtBQUNSLGFBQU8sS0FBQSxHQUFRLENBQWY7UUFDRSxHQUFBLEdBQU0sSUFBQyxDQUFBLG1CQUFELENBQXFCLEdBQUEsR0FBTSxDQUEzQjtRQUNOLEtBQUE7TUFGRjthQUlBLFlBQUEsQ0FBYSxNQUFiLEVBQXFCLEdBQXJCO0lBUlU7Ozs7S0FMbUI7O0VBZTNCOzs7Ozs7O0lBQ0osNEJBQUMsQ0FBQSxNQUFELENBQVEsS0FBUjs7MkNBRUEsUUFBQSxHQUFVLFNBQUE7YUFDUixXQUFBLENBQVksNERBQUEsU0FBQSxDQUFaLEVBQW1CO1FBQUEsR0FBQSxFQUFLLENBQUw7T0FBbkI7SUFEUTs7OztLQUgrQjs7RUFTckM7Ozs7Ozs7SUFDSixpQkFBQyxDQUFBLE1BQUQsQ0FBQTs7Z0NBQ0EsSUFBQSxHQUFNOztnQ0FDTixJQUFBLEdBQU07O2dDQUNOLFNBQUEsR0FBVzs7Z0NBQ1gsWUFBQSxHQUFjOztnQ0FDZCxjQUFBLEdBQWdCOztnQ0FFaEIsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLE1BQU0sQ0FBQyxxQkFBUixDQUE4QixJQUFDLENBQUEsWUFBRCxDQUFBLENBQTlCO2FBQ1osSUFBQyxDQUFBLGtCQUFELENBQW9CLE1BQXBCLEVBQTRCLFNBQTVCO0lBRlU7O2dDQUlaLFlBQUEsR0FBYyxTQUFBO01BQ1osSUFBRyxJQUFDLENBQUEsc0JBQUQsQ0FBQSxDQUFIO2VBQ0UsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsVUFISDs7SUFEWTs7Z0NBTWQsWUFBQSxHQUFjLFNBQUE7QUFDWixVQUFBO01BQUEsUUFBQSxHQUFXLHdCQUFBLENBQXlCLElBQUMsQ0FBQSxNQUExQjtNQUNYLE1BQUEsR0FBUyxJQUFDLENBQUEsWUFBRCxDQUFBO01BQ1QsSUFBYyxRQUFBLEtBQVksQ0FBMUI7UUFBQSxNQUFBLEdBQVMsRUFBVDs7TUFDQSxNQUFBLEdBQVMsV0FBQSxDQUFZLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYLENBQVosRUFBMkI7UUFBQSxHQUFBLEVBQUssTUFBTDtPQUEzQjthQUNULFFBQUEsR0FBVztJQUxDOzs7O0tBbEJnQjs7RUEwQjFCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O21DQUNBLFlBQUEsR0FBYyxTQUFBO0FBQ1osVUFBQTtNQUFBLFFBQUEsR0FBVyx3QkFBQSxDQUF5QixJQUFDLENBQUEsTUFBMUI7TUFDWCxNQUFBLEdBQVMsV0FBQSxDQUFZLElBQUMsQ0FBQSxNQUFNLENBQUMsdUJBQVIsQ0FBQSxDQUFaLEVBQStDO1FBQUEsR0FBQSxFQUFLLElBQUMsQ0FBQSxtQkFBRCxDQUFBLENBQUw7T0FBL0M7YUFDVCxRQUFBLEdBQVcsSUFBSSxDQUFDLEtBQUwsQ0FBVyxDQUFDLE1BQUEsR0FBUyxRQUFWLENBQUEsR0FBc0IsQ0FBakM7SUFIQzs7OztLQUZtQjs7RUFRN0I7Ozs7Ozs7SUFDSixvQkFBQyxDQUFBLE1BQUQsQ0FBQTs7bUNBQ0EsWUFBQSxHQUFjLFNBQUE7QUFNWixVQUFBO01BQUEsZ0JBQUEsR0FBbUIsSUFBQyxDQUFBLG1CQUFELENBQUE7TUFDbkIsR0FBQSxHQUFNLFdBQUEsQ0FBWSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQUEsQ0FBWixFQUErQztRQUFBLEdBQUEsRUFBSyxnQkFBTDtPQUEvQztNQUNOLE1BQUEsR0FBUyxJQUFDLENBQUEsWUFBRCxDQUFBLENBQUEsR0FBa0I7TUFDM0IsSUFBYyxHQUFBLEtBQU8sZ0JBQXJCO1FBQUEsTUFBQSxHQUFTLEVBQVQ7O01BQ0EsTUFBQSxHQUFTLFdBQUEsQ0FBWSxJQUFDLENBQUEsUUFBRCxDQUFVLENBQUMsQ0FBWCxDQUFaLEVBQTJCO1FBQUEsR0FBQSxFQUFLLE1BQUw7T0FBM0I7YUFDVCxHQUFBLEdBQU07SUFYTTs7OztLQUZtQjs7RUFvQjdCOzs7Ozs7O0lBQ0osTUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztxQkFDQSxjQUFBLEdBQWdCOztxQkFFaEIscUJBQUEsR0FBdUIsU0FBQTtNQUNyQixJQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLFlBQVYsQ0FBQSxLQUEyQixDQUE5QjtlQUNFLElBQUMsQ0FBQSxTQUFELENBQVcsZ0NBQVgsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsU0FBRCxDQUFXLGdDQUFYLEVBSEY7O0lBRHFCOztxQkFNdkIsc0JBQUEsR0FBd0IsU0FBQTtNQUN0QixJQUFHLElBQUksQ0FBQyxHQUFMLENBQVMsSUFBQyxDQUFBLFlBQVYsQ0FBQSxLQUEyQixDQUE5QjtlQUNFLElBQUMsQ0FBQSxTQUFELENBQVcsd0NBQVgsRUFERjtPQUFBLE1BQUE7ZUFHRSxJQUFDLENBQUEsU0FBRCxDQUFXLHdDQUFYLEVBSEY7O0lBRHNCOztxQkFNeEIsMEJBQUEsR0FBNEIsU0FBQyxHQUFEO0FBQzFCLFVBQUE7TUFBQSxLQUFBLEdBQVksSUFBQSxLQUFBLENBQU0sR0FBTixFQUFXLENBQVg7YUFDWixJQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBaEIsQ0FBNEMsSUFBQSxLQUFBLENBQU0sS0FBTixFQUFhLEtBQWIsQ0FBNUMsQ0FBZ0UsQ0FBQztJQUZ2Qzs7cUJBSTVCLFlBQUEsR0FBYyxTQUFDLE9BQUQsRUFBVSxLQUFWLEVBQWlCLElBQWpCO0FBQ1osVUFBQTtNQUFBLFlBQUEsR0FBZTtRQUFDLEdBQUEsRUFBSyxJQUFDLENBQUEsMEJBQUQsQ0FBNEIsT0FBNUIsQ0FBTjs7TUFDZixVQUFBLEdBQWE7UUFBQyxHQUFBLEVBQUssSUFBQyxDQUFBLDBCQUFELENBQTRCLEtBQTVCLENBQU47O01BSWIsSUFBQSxHQUFPLENBQUEsU0FBQSxLQUFBO2VBQUEsU0FBQyxNQUFEO1VBQ0wsSUFBRyxzQ0FBSDtZQUNFLEtBQUMsQ0FBQSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUExQixDQUF1QyxNQUF2QzttQkFDQSxLQUFDLENBQUEsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBMUIsQ0FBQSxFQUZGOztRQURLO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQTtNQUtQLFFBQUEsR0FBVyxJQUFDLENBQUEsc0JBQUQsQ0FBQTthQUNYLElBQUMsQ0FBQSxRQUFRLENBQUMsc0JBQVYsQ0FBaUMsWUFBakMsRUFBK0MsVUFBL0MsRUFBMkQ7UUFBQyxVQUFBLFFBQUQ7UUFBVyxNQUFBLElBQVg7UUFBaUIsTUFBQSxJQUFqQjtPQUEzRDtJQVpZOztxQkFjZCxlQUFBLEdBQWlCLFNBQUE7YUFDZixJQUFJLENBQUMsSUFBTCxDQUFVLElBQUMsQ0FBQSxZQUFELEdBQWdCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBLENBQWhCLEdBQTJDLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBckQ7SUFEZTs7cUJBR2pCLFlBQUEsR0FBYyxTQUFDLE1BQUQ7QUFDWixVQUFBO01BQUEsU0FBQSxHQUFZLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixFQUE4QixNQUFNLENBQUMsWUFBUCxDQUFBLENBQUEsR0FBd0IsSUFBQyxDQUFBLGVBQUQsQ0FBQSxDQUF0RDthQUNaLElBQUMsQ0FBQSxNQUFNLENBQUMscUJBQVIsQ0FBOEIsU0FBOUI7SUFGWTs7cUJBSWQsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxTQUFBLEdBQVksSUFBQyxDQUFBLFlBQUQsQ0FBYyxNQUFkO01BQ1osSUFBQyxDQUFBLGtCQUFELENBQW9CLE1BQXBCLEVBQTRCLElBQUMsQ0FBQSxZQUFELENBQWMsTUFBZCxDQUE1QixFQUFtRDtRQUFBLFVBQUEsRUFBWSxLQUFaO09BQW5EO01BRUEsSUFBRyxNQUFNLENBQUMsWUFBUCxDQUFBLENBQUg7UUFDRSxJQUFHLElBQUMsQ0FBQSxxQkFBRCxDQUFBLENBQUg7VUFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLHFCQUFWLENBQUEsRUFERjs7UUFHQSxzQkFBQSxHQUF5QixJQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQUE7UUFDekIseUJBQUEsR0FBNEIsSUFBQyxDQUFBLE1BQU0sQ0FBQyxxQkFBUixDQUE4QixzQkFBQSxHQUF5QixJQUFDLENBQUEsZUFBRCxDQUFBLENBQXZEO1FBQzVCLHlCQUFBLEdBQTRCLElBQUMsQ0FBQSxNQUFNLENBQUMscUJBQVIsQ0FBOEIseUJBQTlCO1FBQzVCLElBQUEsR0FBTyxDQUFBLFNBQUEsS0FBQTtpQkFBQSxTQUFBO0FBQ0wsZ0JBQUE7WUFBQSxLQUFDLENBQUEsTUFBTSxDQUFDLHdCQUFSLENBQWlDLHlCQUFqQzt5RUFHeUIsQ0FBRSxVQUEzQixDQUFBO1VBSks7UUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBO1FBTVAsSUFBRyxJQUFDLENBQUEscUJBQUQsQ0FBQSxDQUFIO2lCQUNFLElBQUMsQ0FBQSxZQUFELENBQWMsc0JBQWQsRUFBc0MseUJBQXRDLEVBQWlFLElBQWpFLEVBREY7U0FBQSxNQUFBO2lCQUdFLElBQUEsQ0FBQSxFQUhGO1NBYkY7O0lBSlU7Ozs7S0F6Q087O0VBaUVmOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQVEsSUFBUjs7bUNBQ0EsWUFBQSxHQUFjLENBQUM7Ozs7S0FGa0I7O0VBSzdCOzs7Ozs7O0lBQ0osa0JBQUMsQ0FBQSxNQUFELENBQUE7O2lDQUNBLFlBQUEsR0FBYyxDQUFDOzs7O0tBRmdCOztFQUszQjs7Ozs7OztJQUNKLG9CQUFDLENBQUEsTUFBRCxDQUFBOzttQ0FDQSxZQUFBLEdBQWMsQ0FBQyxDQUFELEdBQUs7Ozs7S0FGYzs7RUFLN0I7Ozs7Ozs7SUFDSixrQkFBQyxDQUFBLE1BQUQsQ0FBQTs7aUNBQ0EsWUFBQSxHQUFjLENBQUMsQ0FBRCxHQUFLOzs7O0tBRlk7O0VBTzNCOzs7Ozs7O0lBQ0osSUFBQyxDQUFBLE1BQUQsQ0FBQTs7bUJBQ0EsU0FBQSxHQUFXOzttQkFDWCxTQUFBLEdBQVc7O21CQUNYLE1BQUEsR0FBUTs7bUJBQ1IsWUFBQSxHQUFjOzttQkFDZCxtQkFBQSxHQUFxQjs7bUJBRXJCLFVBQUEsR0FBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLHNDQUFBLFNBQUE7TUFFQSxJQUFDLENBQUEsaUJBQUQsQ0FBQTtNQUNBLElBQVUsSUFBQyxDQUFBLFVBQUQsQ0FBQSxDQUFWO0FBQUEsZUFBQTs7TUFFQSxRQUFBLEdBQVcsSUFBQyxDQUFBLFNBQUQsQ0FBVyxjQUFYO01BRVgsSUFBSSxRQUFBLEdBQVcsQ0FBZjtRQUNFLE9BQUEsR0FDRTtVQUFBLGtCQUFBLEVBQW9CLElBQUMsQ0FBQSxTQUFELENBQVcsc0JBQVgsQ0FBcEI7VUFDQSxRQUFBLEVBQVUsQ0FBQSxTQUFBLEtBQUE7bUJBQUEsU0FBQyxJQUFEO3FCQUFVLEtBQUMsQ0FBQSx5QkFBRCxDQUEyQixJQUEzQixFQUFpQyxhQUFqQztZQUFWO1VBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQURWO1VBRUEsUUFBQSxFQUFVLENBQUEsU0FBQSxLQUFBO21CQUFBLFNBQUE7Y0FDUixLQUFDLENBQUEsUUFBUSxDQUFDLGFBQWEsQ0FBQyxZQUF4QixDQUFBO3FCQUNBLEtBQUMsQ0FBQSxlQUFELENBQUE7WUFGUTtVQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FGVjtVQUZKOzs7UUFRQSxVQUFXOztNQUNYLE9BQU8sQ0FBQyxPQUFSLEdBQWtCO01BQ2xCLE9BQU8sQ0FBQyxRQUFSLEdBQW1CO2FBRW5CLElBQUMsQ0FBQSxVQUFELENBQVksT0FBWjtJQXBCVTs7bUJBc0JaLGlCQUFBLEdBQW1CLFNBQUE7QUFDakIsVUFBQTtNQUFBLElBQUcsSUFBQyxDQUFBLFNBQUQsQ0FBVyx3QkFBWCxDQUFIO1FBQ0UsWUFBRyxJQUFDLENBQUEsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBekIsQ0FBQSxFQUFBLEtBQWtELE1BQWxELElBQUEsSUFBQSxLQUEwRCxlQUExRCxJQUFBLElBQUEsS0FBMkUsTUFBM0UsSUFBQSxJQUFBLEtBQW1GLGVBQXRGO1VBQ0UsSUFBQyxDQUFBLEtBQUQsR0FBUyxJQUFDLENBQUEsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUF0QixDQUEwQixhQUExQixDQUF3QyxDQUFDO2lCQUNsRCxJQUFDLENBQUEsUUFBRCxHQUFZLEtBRmQ7U0FERjs7SUFEaUI7O21CQU1uQixXQUFBLEdBQWEsU0FBQTthQUNYLElBQUMsQ0FBQTtJQURVOzttQkFHYixPQUFBLEdBQVMsU0FBQTtBQUNQLFVBQUE7TUFBQSxtQ0FBQSxTQUFBO01BQ0EsY0FBQSxHQUFpQjtNQUNqQixJQUE2QixJQUFDLENBQUEsc0JBQUQsQ0FBQSxDQUE3QjtRQUFBLGNBQUEsSUFBa0IsUUFBbEI7O01BQ0EsSUFBQyxDQUFBLE1BQU0sQ0FBQyxTQUFTLENBQUMsb0JBQWxCLENBQUEsQ0FBd0MsQ0FBQyxJQUF6QyxDQUE4QyxDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzVDLEtBQUMsQ0FBQSx5QkFBRCxDQUEyQixLQUFDLENBQUEsS0FBNUIsRUFBbUMsY0FBbkM7UUFENEM7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlDO0lBSk87O21CQVNULFdBQUEsR0FBYSxTQUFDLFNBQUQ7QUFDWCxVQUFBO01BQUEsT0FBZSxJQUFDLENBQUEsTUFBTSxDQUFDLHVCQUFSLENBQWdDLFNBQVMsQ0FBQyxHQUExQyxDQUFmLEVBQUMsa0JBQUQsRUFBUTtNQUVSLE1BQUEsR0FBWSxJQUFDLENBQUEsV0FBRCxDQUFBLENBQUgsR0FBdUIsSUFBQyxDQUFBLE1BQXhCLEdBQW9DLENBQUMsSUFBQyxDQUFBO01BQy9DLFFBQUEsR0FBVyxDQUFDLE1BQUQsR0FBVSxJQUFDLENBQUE7TUFDdEIsSUFBRyxJQUFDLENBQUEsV0FBRCxDQUFBLENBQUg7UUFDRSxJQUFzQixJQUFDLENBQUEsU0FBRCxDQUFXLGlCQUFYLENBQXRCO1VBQUEsS0FBQSxHQUFRLEtBQUssQ0FBQyxLQUFkOztRQUNBLFNBQUEsR0FBWSxDQUFDLEtBQUQsRUFBUSxTQUFTLENBQUMsU0FBVixDQUFvQixDQUFDLENBQUQsRUFBSSxRQUFKLENBQXBCLENBQVI7UUFDWixNQUFBLEdBQVMsNkJBSFg7T0FBQSxNQUFBO1FBS0UsSUFBd0MsSUFBQyxDQUFBLFNBQUQsQ0FBVyxpQkFBWCxDQUF4QztVQUFBLEdBQUEsR0FBTSxJQUFDLENBQUEsTUFBTSxDQUFDLG9CQUFSLENBQUEsRUFBTjs7UUFDQSxTQUFBLEdBQVksQ0FBQyxTQUFTLENBQUMsU0FBVixDQUFvQixDQUFDLENBQUQsRUFBSSxDQUFBLEdBQUksUUFBUixDQUFwQixDQUFELEVBQXlDLEdBQXpDO1FBQ1osTUFBQSxHQUFTLG9CQVBYOzthQVFBO1FBQUMsV0FBQSxTQUFEO1FBQVksUUFBQSxNQUFaO1FBQW9CLFFBQUEsTUFBcEI7O0lBYlc7O21CQWViLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFDUixVQUFBO01BQUEsT0FBOEIsSUFBQyxDQUFBLFdBQUQsQ0FBYSxTQUFiLENBQTlCLEVBQUMsMEJBQUQsRUFBWSxvQkFBWixFQUFvQjtNQUNwQixNQUFBLEdBQVM7TUFDVCxlQUFBLEdBQWtCLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO01BQ2xCLElBQUMsQ0FBQSxNQUFPLENBQUEsTUFBQSxDQUFSLENBQWdCLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBQyxDQUFBLEtBQVgsQ0FBaEIsRUFBbUMsU0FBbkMsRUFBOEMsU0FBQyxHQUFEO0FBQzVDLFlBQUE7UUFEOEMsbUJBQU87UUFDckQsTUFBTSxDQUFDLElBQVAsQ0FBWSxLQUFLLENBQUMsS0FBbEI7UUFDQSxJQUFVLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLGVBQTFCO2lCQUFBLElBQUEsQ0FBQSxFQUFBOztNQUY0QyxDQUE5Qzs0REFJdUIsQ0FBRSxTQUF6QixDQUFtQyxDQUFDLENBQUQsRUFBSSxNQUFKLENBQW5DO0lBUlE7O21CQVVWLHlCQUFBLEdBQTJCLFNBQUMsSUFBRCxFQUFPLGNBQVA7TUFDekIsSUFBQSxDQUFjLElBQUMsQ0FBQSxTQUFELENBQVcsbUJBQVgsQ0FBZDtBQUFBLGVBQUE7O2FBQ0EsSUFBQyxDQUFBLFFBQVEsQ0FBQyxhQUFhLENBQUMsbUJBQXhCLENBQTRDLElBQUMsQ0FBQSxRQUFELENBQVUsSUFBVixDQUE1QyxFQUE2RCxjQUE3RCxFQUE2RSxJQUFDLENBQUEsV0FBRCxDQUFBLENBQTdFLEVBQTZGLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYLENBQTdGO0lBRnlCOzttQkFJM0IsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLFVBQUE7TUFBQSxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBVSxNQUFNLENBQUMsaUJBQVAsQ0FBQSxDQUFWO01BQ1IsSUFBQyxDQUFBLHVCQUFELENBQXlCLE1BQXpCLEVBQWlDLEtBQWpDO01BQ0EsSUFBQSxDQUE2QyxJQUFDLENBQUEsUUFBOUM7ZUFBQSxJQUFDLENBQUEsV0FBVyxDQUFDLEdBQWIsQ0FBaUIsYUFBakIsRUFBZ0MsSUFBaEMsRUFBQTs7SUFIVTs7bUJBS1osUUFBQSxHQUFVLFNBQUMsSUFBRDtBQUNSLFVBQUE7TUFBQSxTQUFBLEdBQWUsSUFBQyxDQUFBLGVBQUQsQ0FBaUIsSUFBakIsQ0FBSCxHQUErQixHQUEvQixHQUF3QzthQUNoRCxJQUFBLE1BQUEsQ0FBTyxDQUFDLENBQUMsWUFBRixDQUFlLElBQWYsQ0FBUCxFQUE2QixTQUE3QjtJQUZJOzs7O0tBbEZPOztFQXVGYjs7Ozs7OztJQUNKLGFBQUMsQ0FBQSxNQUFELENBQUE7OzRCQUNBLFNBQUEsR0FBVzs7NEJBQ1gsU0FBQSxHQUFXOzs7O0tBSGU7O0VBTXRCOzs7Ozs7O0lBQ0osSUFBQyxDQUFBLE1BQUQsQ0FBQTs7bUJBQ0EsTUFBQSxHQUFROzttQkFFUixRQUFBLEdBQVUsU0FBQTtNQUNSLElBQUMsQ0FBQSxLQUFELEdBQVMsb0NBQUEsU0FBQTtNQUNULElBQUMsQ0FBQSxhQUFELEdBQWlCO0FBQ2pCLGFBQU8sSUFBQyxDQUFBO0lBSEE7Ozs7S0FKTzs7RUFVYjs7Ozs7OztJQUNKLGFBQUMsQ0FBQSxNQUFELENBQUE7OzRCQUNBLFNBQUEsR0FBVzs7NEJBQ1gsU0FBQSxHQUFXOzs7O0tBSGU7O0VBUXRCOzs7Ozs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBQTs7eUJBQ0EsSUFBQSxHQUFNOzt5QkFDTixZQUFBLEdBQWM7O3lCQUNkLEtBQUEsR0FBTzs7eUJBRVAsVUFBQSxHQUFZLFNBQUE7TUFDViw0Q0FBQSxTQUFBO01BQ0EsSUFBQSxDQUFtQixJQUFDLENBQUEsVUFBRCxDQUFBLENBQW5CO2VBQUEsSUFBQyxDQUFBLFFBQUQsQ0FBQSxFQUFBOztJQUZVOzt5QkFJWixRQUFBLEdBQVUsU0FBQTthQUNSLElBQUMsQ0FBQSxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQWYsQ0FBbUIsSUFBQyxDQUFBLEtBQXBCO0lBRFE7O3lCQUdWLFVBQUEsR0FBWSxTQUFDLE1BQUQ7QUFDVixVQUFBO01BQUEsSUFBRyxLQUFBLEdBQVEsSUFBQyxDQUFBLFFBQUQsQ0FBQSxDQUFYO1FBQ0UsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO2VBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0I7VUFBQSxNQUFBLEVBQVEsSUFBUjtTQUFsQixFQUZGOztJQURVOzs7O0tBYlc7O0VBbUJuQjs7Ozs7OztJQUNKLGNBQUMsQ0FBQSxNQUFELENBQUE7OzZCQUNBLElBQUEsR0FBTTs7NkJBRU4sUUFBQSxHQUFVLFNBQUE7QUFDUixVQUFBO01BQUEsSUFBRyxLQUFBLEdBQVEsOENBQUEsU0FBQSxDQUFYO2VBQ0UsSUFBQyxDQUFBLHFDQUFELENBQXVDLEtBQUssQ0FBQyxHQUE3QyxFQURGOztJQURROzs7O0tBSmlCOztFQVV2Qjs7Ozs7OztJQUNKLHVCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLHVCQUFDLENBQUEsV0FBRCxHQUFjOztzQ0FDZCxJQUFBLEdBQU07O3NDQUNOLEtBQUEsR0FBTzs7c0NBQ1AsU0FBQSxHQUFXOztzQ0FFWCxVQUFBLEdBQVksU0FBQTtNQUNWLHlEQUFBLFNBQUE7TUFDQSxJQUFDLENBQUEsSUFBRCxHQUFRLElBQUMsQ0FBQSxXQUFELENBQWEsSUFBQyxDQUFBLEtBQWQ7TUFDUixJQUFtQixJQUFDLENBQUEsU0FBRCxLQUFjLE1BQWpDO2VBQUEsSUFBQyxDQUFBLElBQUksQ0FBQyxPQUFOLENBQUEsRUFBQTs7SUFIVTs7c0NBS1osV0FBQSxHQUFhLFNBQUMsS0FBRDtBQUNYLFVBQUE7TUFBQSxLQUFBLEdBQVcsS0FBQSxLQUFTLE9BQVosR0FBeUIsQ0FBekIsR0FBZ0M7TUFDeEMsSUFBQSxHQUFPLG9CQUFBLENBQXFCLElBQUMsQ0FBQSxNQUF0QixDQUE2QixDQUFDLEdBQTlCLENBQWtDLFNBQUMsUUFBRDtlQUN2QyxRQUFTLENBQUEsS0FBQTtNQUQ4QixDQUFsQzthQUVQLENBQUMsQ0FBQyxNQUFGLENBQVMsQ0FBQyxDQUFDLElBQUYsQ0FBTyxJQUFQLENBQVQsRUFBdUIsU0FBQyxHQUFEO2VBQVM7TUFBVCxDQUF2QjtJQUpXOztzQ0FNYixXQUFBLEdBQWEsU0FBQyxNQUFEO0FBQ1gsVUFBQTtNQUFBLFNBQUEsR0FBWSxNQUFNLENBQUMsWUFBUCxDQUFBO01BQ1osVUFBQTtBQUFhLGdCQUFPLElBQUMsQ0FBQSxTQUFSO0FBQUEsZUFDTixNQURNO21CQUNNLFNBQUMsR0FBRDtxQkFBUyxHQUFBLEdBQU07WUFBZjtBQUROLGVBRU4sTUFGTTttQkFFTSxTQUFDLEdBQUQ7cUJBQVMsR0FBQSxHQUFNO1lBQWY7QUFGTjs7YUFHYixJQUFDLENBQUEsSUFBSSxDQUFDLE1BQU4sQ0FBYSxVQUFiO0lBTFc7O3NDQU9iLFNBQUEsR0FBVyxTQUFDLE1BQUQ7YUFDVCxJQUFDLENBQUEsV0FBRCxDQUFhLE1BQWIsQ0FBcUIsQ0FBQSxDQUFBO0lBRFo7O3NDQUdYLFVBQUEsR0FBWSxTQUFDLE1BQUQ7YUFDVixJQUFDLENBQUEsb0JBQUQsQ0FBc0IsTUFBdEIsRUFBOEIsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO0FBQzVCLGNBQUE7VUFBQSxJQUFHLHVDQUFIO21CQUNFLCtCQUFBLENBQWdDLE1BQWhDLEVBQXdDLEdBQXhDLEVBREY7O1FBRDRCO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUE5QjtJQURVOzs7O0tBNUJ3Qjs7RUFpQ2hDOzs7Ozs7O0lBQ0osbUJBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsbUJBQUMsQ0FBQSxXQUFELEdBQWM7O2tDQUNkLFNBQUEsR0FBVzs7OztLQUhxQjs7RUFLNUI7Ozs7Ozs7SUFDSixxQ0FBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxxQ0FBQyxDQUFBLFdBQUQsR0FBYzs7b0RBQ2QsU0FBQSxHQUFXLFNBQUMsTUFBRDtBQUNULFVBQUE7TUFBQSxlQUFBLEdBQWtCLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixNQUFNLENBQUMsWUFBUCxDQUFBLENBQTVCO0FBQ2xCO0FBQUEsV0FBQSxzQ0FBQTs7UUFDRSxJQUFHLElBQUMsQ0FBQSwwQkFBRCxDQUE0QixHQUE1QixDQUFBLEtBQW9DLGVBQXZDO0FBQ0UsaUJBQU8sSUFEVDs7QUFERjthQUdBO0lBTFM7Ozs7S0FIdUM7O0VBVTlDOzs7Ozs7O0lBQ0osaUNBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0EsaUNBQUMsQ0FBQSxXQUFELEdBQWM7O2dEQUNkLFNBQUEsR0FBVzs7OztLQUhtQzs7RUFLMUM7Ozs7Ozs7SUFDSixxQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxxQkFBQyxDQUFBLFdBQUQsR0FBYzs7b0NBQ2QsS0FBQSxHQUFPOzs7O0tBSDJCOztFQUs5Qjs7Ozs7OztJQUNKLGlCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGlCQUFDLENBQUEsV0FBRCxHQUFjOztnQ0FDZCxTQUFBLEdBQVc7Ozs7S0FIbUI7O0VBTTFCOzs7Ozs7O0lBQ0osc0JBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0Esc0JBQUMsQ0FBQSxXQUFELEdBQWM7O3FDQUNkLFNBQUEsR0FBVzs7cUNBQ1gsU0FBQSxHQUFXLFNBQUMsTUFBRDthQUNULENBQUMsQ0FBQyxNQUFGLENBQVMsSUFBQyxDQUFBLFdBQUQsQ0FBYSxNQUFiLENBQVQsRUFBK0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFDLEdBQUQ7aUJBQzdCLDRCQUFBLENBQTZCLEtBQUMsQ0FBQSxNQUE5QixFQUFzQyxHQUF0QztRQUQ2QjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBL0I7SUFEUzs7OztLQUp3Qjs7RUFRL0I7Ozs7Ozs7SUFDSixrQkFBQyxDQUFBLE1BQUQsQ0FBQTs7SUFDQSxrQkFBQyxDQUFBLFdBQUQsR0FBYzs7aUNBQ2QsU0FBQSxHQUFXOzs7O0tBSG9COztFQU8zQjs7Ozs7OztJQUNKLHFCQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O29DQUNBLFNBQUEsR0FBVzs7b0NBQ1gsS0FBQSxHQUFPOztvQ0FFUCxRQUFBLEdBQVUsU0FBQyxTQUFEO2FBQ1IsZ0NBQUEsQ0FBaUMsSUFBQyxDQUFBLE1BQWxDLEVBQTBDLFNBQTFDLEVBQXFELElBQUMsQ0FBQSxTQUF0RCxFQUFpRSxJQUFDLENBQUEsS0FBbEU7SUFEUTs7b0NBR1YsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSxvQkFBRCxDQUFzQixNQUF0QixFQUE4QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUE7aUJBQzVCLEtBQUMsQ0FBQSx1QkFBRCxDQUF5QixNQUF6QixFQUFpQyxLQUFDLENBQUEsUUFBRCxDQUFVLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQVYsQ0FBakM7UUFENEI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQTlCO0lBRFU7Ozs7S0FSc0I7O0VBWTlCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O0lBQ0Esb0JBQUMsQ0FBQSxXQUFELEdBQWM7O21DQUNkLFNBQUEsR0FBVzs7bUNBQ1gsS0FBQSxHQUFPOzs7O0tBSjBCOztFQU03Qjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGdCQUFDLENBQUEsV0FBRCxHQUFjOzsrQkFDZCxTQUFBLEdBQVc7Ozs7S0FIa0I7O0VBS3pCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O21DQUNBLFNBQUEsR0FBVzs7SUFDWCxvQkFBQyxDQUFBLFdBQUQsR0FBYzs7bUNBQ2QsS0FBQSxHQUFPOzs7O0tBSjBCOztFQU03Qjs7Ozs7OztJQUNKLGdCQUFDLENBQUEsTUFBRCxDQUFBOztJQUNBLGdCQUFDLENBQUEsV0FBRCxHQUFjOzsrQkFDZCxTQUFBLEdBQVc7Ozs7S0FIa0I7O0VBS3pCOzs7Ozs7O0lBQ0osb0JBQUMsQ0FBQSxNQUFELENBQUE7O0lBRUEsb0JBQUMsQ0FBQSxZQUFELEdBQWU7O21DQUNmLElBQUEsR0FBTTs7bUNBQ04sU0FBQSxHQUFXOzttQ0FFWCxTQUFBLEdBQVcsU0FBQTthQUNULElBQUMsQ0FBQSxRQUFRLENBQUMsaUJBQWlCLENBQUMsVUFBNUIsQ0FBQSxDQUF3QyxDQUFDLEdBQXpDLENBQTZDLFNBQUMsTUFBRDtlQUMzQyxNQUFNLENBQUMsY0FBUCxDQUFBO01BRDJDLENBQTdDO0lBRFM7O21DQUlYLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLE1BQUQsR0FBVSxJQUFDLENBQUEsU0FBRCxDQUFBO2FBQ1YsbURBQUEsU0FBQTtJQUZPOzttQ0FJVCxVQUFBLEdBQVksU0FBQyxNQUFEO0FBQ1YsVUFBQTtNQUFBLEtBQUEsR0FBUSxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQU0sQ0FBQyxpQkFBUCxDQUFBLENBQVY7TUFDUixJQUFHLGFBQUg7UUFDRSxNQUFBO0FBQVMsa0JBQU8sSUFBQyxDQUFBLFNBQVI7QUFBQSxpQkFDRixNQURFO3FCQUNVLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0FBRFYsaUJBRUYsVUFGRTtxQkFFYyxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsQ0FBQyxDQUFYO0FBRmY7O1FBR1QsS0FBQSxHQUFRLElBQUMsQ0FBQSxNQUFPLENBQUEsUUFBQSxDQUFTLEtBQUEsR0FBUSxNQUFqQixFQUF5QixJQUFDLENBQUEsTUFBMUIsQ0FBQTtRQUNoQixLQUFBLEdBQVEsS0FBSyxDQUFDO1FBRWQsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCLEVBQWdDO1VBQUEsVUFBQSxFQUFZLEtBQVo7U0FBaEM7UUFFQSxJQUFHLE1BQU0sQ0FBQyxZQUFQLENBQUEsQ0FBSDtVQUNFLElBQUMsQ0FBQSxNQUFNLENBQUMsZUFBUixDQUF3QixLQUFLLENBQUMsR0FBOUI7VUFDQSwyQkFBQSxDQUE0QixJQUFDLENBQUEsTUFBN0IsRUFBcUMsS0FBckMsRUFGRjs7UUFJQSxJQUFHLElBQUMsQ0FBQSxTQUFELENBQVcseUJBQVgsQ0FBSDtpQkFDRSxJQUFDLENBQUEsUUFBUSxDQUFDLEtBQVYsQ0FBZ0IsS0FBaEIsRUFBdUI7WUFBQSxJQUFBLEVBQU0sUUFBTjtXQUF2QixFQURGO1NBYkY7O0lBRlU7O21DQWtCWixRQUFBLEdBQVUsU0FBQyxTQUFEO0FBQ1IsVUFBQTtBQUFBO0FBQUEsV0FBQSw4Q0FBQTs7WUFBNkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxhQUFaLENBQTBCLFNBQTFCO0FBQzNCLGlCQUFPOztBQURUO2FBRUE7SUFIUTs7OztLQWpDdUI7O0VBc0M3Qjs7Ozs7OztJQUNKLHdCQUFDLENBQUEsTUFBRCxDQUFBOzt1Q0FDQSxTQUFBLEdBQVc7O3VDQUVYLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFDUixVQUFBO0FBQUE7QUFBQSxXQUFBLDRDQUFBOztZQUFtQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVYsQ0FBcUIsU0FBckI7QUFDakMsaUJBQU87O0FBRFQ7YUFFQSxJQUFDLENBQUEsTUFBTSxDQUFDLE1BQVIsR0FBaUI7SUFIVDs7OztLQUoyQjs7RUFXakM7Ozs7Ozs7SUFDSixVQUFDLENBQUEsTUFBRCxDQUFBOzt5QkFDQSxTQUFBLEdBQVc7O3lCQUNYLElBQUEsR0FBTTs7eUJBQ04sTUFBQSxHQUFRLENBQUMsYUFBRCxFQUFnQixjQUFoQixFQUFnQyxlQUFoQzs7eUJBRVIsVUFBQSxHQUFZLFNBQUMsTUFBRDthQUNWLElBQUMsQ0FBQSx1QkFBRCxDQUF5QixNQUF6QixFQUFpQyxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsQ0FBakM7SUFEVTs7eUJBR1osY0FBQSxHQUFnQixTQUFDLEtBQUQ7QUFDZCxVQUFBO01BQUEsUUFBQSxHQUFXLElBQUMsRUFBQSxHQUFBLEVBQUQsQ0FBSyxNQUFMLENBQVksQ0FBQyxXQUFiLENBQXlCLEtBQXpCO01BQ1gsSUFBbUIsZ0JBQW5CO0FBQUEsZUFBTyxLQUFQOztNQUNDLDhCQUFELEVBQVk7TUFDWixTQUFBLEdBQVksU0FBUyxDQUFDLFNBQVYsQ0FBb0IsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQXBCLEVBQTZCLENBQUMsQ0FBRCxFQUFJLENBQUMsQ0FBTCxDQUE3QjtNQUNaLFVBQUEsR0FBYSxVQUFVLENBQUMsU0FBWCxDQUFxQixDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBckIsRUFBOEIsQ0FBQyxDQUFELEVBQUksQ0FBQyxDQUFMLENBQTlCO01BQ2IsSUFBMkIsU0FBUyxDQUFDLGFBQVYsQ0FBd0IsS0FBeEIsQ0FBQSxJQUFtQyxDQUFDLENBQUksS0FBSyxDQUFDLE9BQU4sQ0FBYyxTQUFTLENBQUMsR0FBeEIsQ0FBTCxDQUE5RDtBQUFBLGVBQU8sVUFBVSxDQUFDLE1BQWxCOztNQUNBLElBQTBCLFVBQVUsQ0FBQyxhQUFYLENBQXlCLEtBQXpCLENBQUEsSUFBb0MsQ0FBQyxDQUFJLEtBQUssQ0FBQyxPQUFOLENBQWMsVUFBVSxDQUFDLEdBQXpCLENBQUwsQ0FBOUQ7QUFBQSxlQUFPLFNBQVMsQ0FBQyxNQUFqQjs7SUFQYzs7eUJBU2hCLFFBQUEsR0FBVSxTQUFDLE1BQUQ7QUFDUixVQUFBO01BQUEsY0FBQSxHQUFpQixNQUFNLENBQUMsaUJBQVAsQ0FBQTtNQUNqQixTQUFBLEdBQVksY0FBYyxDQUFDO01BQzNCLElBQWdCLEtBQUEsR0FBUSxJQUFDLENBQUEsY0FBRCxDQUFnQixjQUFoQixDQUF4QjtBQUFBLGVBQU8sTUFBUDs7TUFHQSxLQUFBLEdBQVEsSUFBQyxFQUFBLEdBQUEsRUFBRCxDQUFLLHlCQUFMLEVBQWdDO1FBQUUsUUFBRCxJQUFDLENBQUEsTUFBRjtPQUFoQyxDQUEwQyxDQUFDLFFBQTNDLENBQW9ELE1BQU0sQ0FBQyxTQUEzRDtNQUNSLElBQW1CLGFBQW5CO0FBQUEsZUFBTyxLQUFQOztNQUNDLG1CQUFELEVBQVE7TUFDUixJQUFHLENBQUMsS0FBSyxDQUFDLEdBQU4sS0FBYSxTQUFkLENBQUEsSUFBNkIsS0FBSyxDQUFDLG9CQUFOLENBQTJCLGNBQTNCLENBQWhDO2VBRUUsR0FBRyxDQUFDLFNBQUosQ0FBYyxDQUFDLENBQUQsRUFBSSxDQUFDLENBQUwsQ0FBZCxFQUZGO09BQUEsTUFHSyxJQUFHLEdBQUcsQ0FBQyxHQUFKLEtBQVcsY0FBYyxDQUFDLEdBQTdCO2VBR0gsTUFIRzs7SUFaRzs7OztLQWxCYTtBQTFxQ3pCIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcbntQb2ludCwgUmFuZ2V9ID0gcmVxdWlyZSAnYXRvbSdcblxue1xuICBtb3ZlQ3Vyc29yTGVmdCwgbW92ZUN1cnNvclJpZ2h0XG4gIG1vdmVDdXJzb3JVcFNjcmVlbiwgbW92ZUN1cnNvckRvd25TY3JlZW5cbiAgcG9pbnRJc0F0VmltRW5kT2ZGaWxlXG4gIGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdywgZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3dcbiAgZ2V0VmFsaWRWaW1TY3JlZW5Sb3csIGdldFZhbGlkVmltQnVmZmVyUm93XG4gIG1vdmVDdXJzb3JUb0ZpcnN0Q2hhcmFjdGVyQXRSb3dcbiAgc29ydFJhbmdlc1xuICBwb2ludElzT25XaGl0ZVNwYWNlXG4gIG1vdmVDdXJzb3JUb05leHROb25XaGl0ZXNwYWNlXG4gIGlzRW1wdHlSb3dcbiAgZ2V0Q29kZUZvbGRSb3dSYW5nZXNcbiAgZ2V0TGFyZ2VzdEZvbGRSYW5nZUNvbnRhaW5zQnVmZmVyUm93XG4gIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3dcbiAgZGV0ZWN0U2NvcGVTdGFydFBvc2l0aW9uRm9yU2NvcGVcbiAgZ2V0QnVmZmVyUm93c1xuICBnZXRUZXh0SW5TY3JlZW5SYW5nZVxuICBzZXRCdWZmZXJSb3dcbiAgc2V0QnVmZmVyQ29sdW1uXG4gIGxpbWl0TnVtYmVyXG4gIGdldEluZGV4XG4gIHNtYXJ0U2Nyb2xsVG9CdWZmZXJQb3NpdGlvblxuICBwb2ludElzQXRFbmRPZkxpbmVBdE5vbkVtcHR5Um93XG4gIGdldEVuZE9mTGluZUZvckJ1ZmZlclJvd1xuICBmaW5kUmFuZ2VJbkJ1ZmZlclJvd1xufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5cbkJhc2UgPSByZXF1aXJlICcuL2Jhc2UnXG5cbmNsYXNzIE1vdGlvbiBleHRlbmRzIEJhc2VcbiAgQGV4dGVuZChmYWxzZSlcbiAgQG9wZXJhdGlvbktpbmQ6ICdtb3Rpb24nXG4gIGluY2x1c2l2ZTogZmFsc2VcbiAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gIGp1bXA6IGZhbHNlXG4gIHZlcnRpY2FsTW90aW9uOiBmYWxzZVxuICBtb3ZlU3VjY2VlZGVkOiBudWxsXG4gIG1vdmVTdWNjZXNzT25MaW5ld2lzZTogZmFsc2VcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlclxuXG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIEB3aXNlID0gQHN1Ym1vZGVcbiAgICBAaW5pdGlhbGl6ZSgpXG5cbiAgaXNMaW5ld2lzZTogLT4gQHdpc2UgaXMgJ2xpbmV3aXNlJ1xuICBpc0Jsb2Nrd2lzZTogLT4gQHdpc2UgaXMgJ2Jsb2Nrd2lzZSdcblxuICBmb3JjZVdpc2U6ICh3aXNlKSAtPlxuICAgIGlmIHdpc2UgaXMgJ2NoYXJhY3Rlcndpc2UnXG4gICAgICBpZiBAd2lzZSBpcyAnbGluZXdpc2UnXG4gICAgICAgIEBpbmNsdXNpdmUgPSBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBAaW5jbHVzaXZlID0gbm90IEBpbmNsdXNpdmVcbiAgICBAd2lzZSA9IHdpc2VcblxuICBzZXRCdWZmZXJQb3NpdGlvblNhZmVseTogKGN1cnNvciwgcG9pbnQpIC0+XG4gICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KSBpZiBwb2ludD9cblxuICBzZXRTY3JlZW5Qb3NpdGlvblNhZmVseTogKGN1cnNvciwgcG9pbnQpIC0+XG4gICAgY3Vyc29yLnNldFNjcmVlblBvc2l0aW9uKHBvaW50KSBpZiBwb2ludD9cblxuICBtb3ZlV2l0aFNhdmVKdW1wOiAoY3Vyc29yKSAtPlxuICAgIGlmIGN1cnNvci5pc0xhc3RDdXJzb3IoKSBhbmQgQGp1bXBcbiAgICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcblxuICAgIEBtb3ZlQ3Vyc29yKGN1cnNvcilcblxuICAgIGlmIGN1cnNvclBvc2l0aW9uPyBhbmQgbm90IGN1cnNvclBvc2l0aW9uLmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICBAdmltU3RhdGUubWFyay5zZXQoJ2AnLCBjdXJzb3JQb3NpdGlvbilcbiAgICAgIEB2aW1TdGF0ZS5tYXJrLnNldChcIidcIiwgY3Vyc29yUG9zaXRpb24pXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBpZiBAb3BlcmF0b3I/XG4gICAgICBAc2VsZWN0KClcbiAgICBlbHNlXG4gICAgICBAbW92ZVdpdGhTYXZlSnVtcChjdXJzb3IpIGZvciBjdXJzb3IgaW4gQGVkaXRvci5nZXRDdXJzb3JzKClcbiAgICBAZWRpdG9yLm1lcmdlQ3Vyc29ycygpXG4gICAgQGVkaXRvci5tZXJnZUludGVyc2VjdGluZ1NlbGVjdGlvbnMoKVxuXG4gICMgTk9URTogTW9kaWZ5IHNlbGVjdGlvbiBieSBtb2R0aW9uLCBzZWxlY3Rpb24gaXMgYWxyZWFkeSBcIm5vcm1hbGl6ZWRcIiBiZWZvcmUgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQuXG4gIHNlbGVjdDogLT5cbiAgICBpc09yV2FzVmlzdWFsID0gQG1vZGUgaXMgJ3Zpc3VhbCcgb3IgQGlzKCdDdXJyZW50U2VsZWN0aW9uJykgIyBuZWVkIHRvIGNhcmUgd2FzIHZpc3VhbCBmb3IgYC5gIHJlcGVhdGVkLlxuICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgIHNlbGVjdGlvbi5tb2RpZnlTZWxlY3Rpb24gPT5cbiAgICAgICAgQG1vdmVXaXRoU2F2ZUp1bXAoc2VsZWN0aW9uLmN1cnNvcilcblxuICAgICAgc3VjY2VlZGVkID0gQG1vdmVTdWNjZWVkZWQgPyBub3Qgc2VsZWN0aW9uLmlzRW1wdHkoKSBvciAoQG1vdmVTdWNjZXNzT25MaW5ld2lzZSBhbmQgQGlzTGluZXdpc2UoKSlcbiAgICAgIGlmIGlzT3JXYXNWaXN1YWwgb3IgKHN1Y2NlZWRlZCBhbmQgKEBpbmNsdXNpdmUgb3IgQGlzTGluZXdpc2UoKSkpXG4gICAgICAgICRzZWxlY3Rpb24gPSBAc3dyYXAoc2VsZWN0aW9uKVxuICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKHRydWUpICMgc2F2ZSBwcm9wZXJ0eSBvZiBcImFscmVhZHktbm9ybWFsaXplZC1zZWxlY3Rpb25cIlxuICAgICAgICAkc2VsZWN0aW9uLmFwcGx5V2lzZShAd2lzZSlcblxuICAgIEB2aW1TdGF0ZS5nZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKCkuYXV0b3Njcm9sbCgpIGlmIEB3aXNlIGlzICdibG9ja3dpc2UnXG5cbiAgc2V0Q3Vyc29yQnVmZmVyUm93OiAoY3Vyc29yLCByb3csIG9wdGlvbnMpIC0+XG4gICAgaWYgQHZlcnRpY2FsTW90aW9uIGFuZCBub3QgQGdldENvbmZpZygnc3RheU9uVmVydGljYWxNb3Rpb24nKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKEBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KHJvdyksIG9wdGlvbnMpXG4gICAgZWxzZVxuICAgICAgc2V0QnVmZmVyUm93KGN1cnNvciwgcm93LCBvcHRpb25zKVxuXG4gICMgW05PVEVdXG4gICMgU2luY2UgdGhpcyBmdW5jdGlvbiBjaGVja3MgY3Vyc29yIHBvc2l0aW9uIGNoYW5nZSwgYSBjdXJzb3IgcG9zaXRpb24gTVVTVCBiZVxuICAjIHVwZGF0ZWQgSU4gY2FsbGJhY2soPWZuKVxuICAjIFVwZGF0aW5nIHBvaW50IG9ubHkgaW4gY2FsbGJhY2sgaXMgd3JvbmctdXNlIG9mIHRoaXMgZnVuY2l0b24sXG4gICMgc2luY2UgaXQgc3RvcHMgaW1tZWRpYXRlbHkgYmVjYXVzZSBvZiBub3QgY3Vyc29yIHBvc2l0aW9uIGNoYW5nZS5cbiAgbW92ZUN1cnNvckNvdW50VGltZXM6IChjdXJzb3IsIGZuKSAtPlxuICAgIG9sZFBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICBAY291bnRUaW1lcyBAZ2V0Q291bnQoKSwgKHN0YXRlKSAtPlxuICAgICAgZm4oc3RhdGUpXG4gICAgICBpZiAobmV3UG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkuaXNFcXVhbChvbGRQb3NpdGlvbilcbiAgICAgICAgc3RhdGUuc3RvcCgpXG4gICAgICBvbGRQb3NpdGlvbiA9IG5ld1Bvc2l0aW9uXG5cbiAgaXNDYXNlU2Vuc2l0aXZlOiAodGVybSkgLT5cbiAgICBpZiBAZ2V0Q29uZmlnKFwidXNlU21hcnRjYXNlRm9yI3tAY2FzZVNlbnNpdGl2aXR5S2luZH1cIilcbiAgICAgIHRlcm0uc2VhcmNoKC9bQS1aXS8pIGlzbnQgLTFcbiAgICBlbHNlXG4gICAgICBub3QgQGdldENvbmZpZyhcImlnbm9yZUNhc2VGb3Ije0BjYXNlU2Vuc2l0aXZpdHlLaW5kfVwiKVxuXG4jIFVzZWQgYXMgb3BlcmF0b3IncyB0YXJnZXQgaW4gdmlzdWFsLW1vZGUuXG5jbGFzcyBDdXJyZW50U2VsZWN0aW9uIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoZmFsc2UpXG4gIHNlbGVjdGlvbkV4dGVudDogbnVsbFxuICBibG9ja3dpc2VTZWxlY3Rpb25FeHRlbnQ6IG51bGxcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEBwb2ludEluZm9CeUN1cnNvciA9IG5ldyBNYXBcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICBpZiBAaXNCbG9ja3dpc2UoKVxuICAgICAgICBAYmxvY2t3aXNlU2VsZWN0aW9uRXh0ZW50ID0gQHN3cmFwKGN1cnNvci5zZWxlY3Rpb24pLmdldEJsb2Nrd2lzZVNlbGVjdGlvbkV4dGVudCgpXG4gICAgICBlbHNlXG4gICAgICAgIEBzZWxlY3Rpb25FeHRlbnQgPSBAZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKS5nZXRFeHRlbnQoKVxuICAgIGVsc2VcbiAgICAgICMgYC5gIHJlcGVhdCBjYXNlXG4gICAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIGlmIEBibG9ja3dpc2VTZWxlY3Rpb25FeHRlbnQ/XG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoQGJsb2Nrd2lzZVNlbGVjdGlvbkV4dGVudCkpXG4gICAgICBlbHNlXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmF2ZXJzZShAc2VsZWN0aW9uRXh0ZW50KSlcblxuICBzZWxlY3Q6IC0+XG4gICAgaWYgQG1vZGUgaXMgJ3Zpc3VhbCdcbiAgICAgIHN1cGVyXG4gICAgZWxzZVxuICAgICAgZm9yIGN1cnNvciBpbiBAZWRpdG9yLmdldEN1cnNvcnMoKSB3aGVuIHBvaW50SW5mbyA9IEBwb2ludEluZm9CeUN1cnNvci5nZXQoY3Vyc29yKVxuICAgICAgICB7Y3Vyc29yUG9zaXRpb24sIHN0YXJ0T2ZTZWxlY3Rpb259ID0gcG9pbnRJbmZvXG4gICAgICAgIGlmIGN1cnNvclBvc2l0aW9uLmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHN0YXJ0T2ZTZWxlY3Rpb24pXG4gICAgICBzdXBlclxuXG4gICAgIyAqIFB1cnBvc2Ugb2YgcG9pbnRJbmZvQnlDdXJzb3I/IHNlZSAjMjM1IGZvciBkZXRhaWwuXG4gICAgIyBXaGVuIHN0YXlPblRyYW5zZm9ybVN0cmluZyBpcyBlbmFibGVkLCBjdXJzb3IgcG9zIGlzIG5vdCBzZXQgb24gc3RhcnQgb2ZcbiAgICAjIG9mIHNlbGVjdGVkIHJhbmdlLlxuICAgICMgQnV0IEkgd2FudCBmb2xsb3dpbmcgYmVoYXZpb3IsIHNvIG5lZWQgdG8gcHJlc2VydmUgcG9zaXRpb24gaW5mby5cbiAgICAjICAxLiBgdmo+LmAgLT4gaW5kZW50IHNhbWUgdHdvIHJvd3MgcmVnYXJkbGVzcyBvZiBjdXJyZW50IGN1cnNvcidzIHJvdy5cbiAgICAjICAyLiBgdmo+ai5gIC0+IGluZGVudCB0d28gcm93cyBmcm9tIGN1cnNvcidzIHJvdy5cbiAgICBmb3IgY3Vyc29yIGluIEBlZGl0b3IuZ2V0Q3Vyc29ycygpXG4gICAgICBzdGFydE9mU2VsZWN0aW9uID0gY3Vyc29yLnNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnN0YXJ0XG4gICAgICBAb25EaWRGaW5pc2hPcGVyYXRpb24gPT5cbiAgICAgICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgICBAcG9pbnRJbmZvQnlDdXJzb3Iuc2V0KGN1cnNvciwge3N0YXJ0T2ZTZWxlY3Rpb24sIGN1cnNvclBvc2l0aW9ufSlcblxuY2xhc3MgTW92ZUxlZnQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgYWxsb3dXcmFwID0gQGdldENvbmZpZygnd3JhcExlZnRSaWdodE1vdGlvbicpXG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgLT5cbiAgICAgIG1vdmVDdXJzb3JMZWZ0KGN1cnNvciwge2FsbG93V3JhcH0pXG5cbmNsYXNzIE1vdmVSaWdodCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgY2FuV3JhcFRvTmV4dExpbmU6IChjdXJzb3IpIC0+XG4gICAgaWYgQGlzQXNUYXJnZXRFeGNlcHRTZWxlY3QoKSBhbmQgbm90IGN1cnNvci5pc0F0RW5kT2ZMaW5lKClcbiAgICAgIGZhbHNlXG4gICAgZWxzZVxuICAgICAgQGdldENvbmZpZygnd3JhcExlZnRSaWdodE1vdGlvbicpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgQGVkaXRvci51bmZvbGRCdWZmZXJSb3coY3Vyc29yUG9zaXRpb24ucm93KVxuICAgICAgYWxsb3dXcmFwID0gQGNhbldyYXBUb05leHRMaW5lKGN1cnNvcilcbiAgICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IpXG4gICAgICBpZiBjdXJzb3IuaXNBdEVuZE9mTGluZSgpIGFuZCBhbGxvd1dyYXAgYW5kIG5vdCBwb2ludElzQXRWaW1FbmRPZkZpbGUoQGVkaXRvciwgY3Vyc29yUG9zaXRpb24pXG4gICAgICAgIG1vdmVDdXJzb3JSaWdodChjdXJzb3IsIHthbGxvd1dyYXB9KVxuXG5jbGFzcyBNb3ZlUmlnaHRCdWZmZXJDb2x1bW4gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZChmYWxzZSlcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHNldEJ1ZmZlckNvbHVtbihjdXJzb3IsIGN1cnNvci5nZXRCdWZmZXJDb2x1bW4oKSArIEBnZXRDb3VudCgpKVxuXG5jbGFzcyBNb3ZlVXAgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgd3JhcDogZmFsc2VcblxuICBnZXRCdWZmZXJSb3c6IChyb3cpIC0+XG4gICAgcm93ID0gQGdldE5leHRSb3cocm93KVxuICAgIGlmIEBlZGl0b3IuaXNGb2xkZWRBdEJ1ZmZlclJvdyhyb3cpXG4gICAgICBnZXRMYXJnZXN0Rm9sZFJhbmdlQ29udGFpbnNCdWZmZXJSb3coQGVkaXRvciwgcm93KS5zdGFydC5yb3dcbiAgICBlbHNlXG4gICAgICByb3dcblxuICBnZXROZXh0Um93OiAocm93KSAtPlxuICAgIG1pbiA9IDBcbiAgICBpZiBAd3JhcCBhbmQgcm93IGlzIG1pblxuICAgICAgQGdldFZpbUxhc3RCdWZmZXJSb3coKVxuICAgIGVsc2VcbiAgICAgIGxpbWl0TnVtYmVyKHJvdyAtIDEsIHttaW59KVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIHNldEJ1ZmZlclJvdyhjdXJzb3IsIEBnZXRCdWZmZXJSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKSlcblxuY2xhc3MgTW92ZVVwV3JhcCBleHRlbmRzIE1vdmVVcFxuICBAZXh0ZW5kKClcbiAgd3JhcDogdHJ1ZVxuXG5jbGFzcyBNb3ZlRG93biBleHRlbmRzIE1vdmVVcFxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICB3cmFwOiBmYWxzZVxuXG4gIGdldEJ1ZmZlclJvdzogKHJvdykgLT5cbiAgICBpZiBAZWRpdG9yLmlzRm9sZGVkQXRCdWZmZXJSb3cocm93KVxuICAgICAgcm93ID0gZ2V0TGFyZ2VzdEZvbGRSYW5nZUNvbnRhaW5zQnVmZmVyUm93KEBlZGl0b3IsIHJvdykuZW5kLnJvd1xuICAgIEBnZXROZXh0Um93KHJvdylcblxuICBnZXROZXh0Um93OiAocm93KSAtPlxuICAgIG1heCA9IEBnZXRWaW1MYXN0QnVmZmVyUm93KClcbiAgICBpZiBAd3JhcCBhbmQgcm93ID49IG1heFxuICAgICAgMFxuICAgIGVsc2VcbiAgICAgIGxpbWl0TnVtYmVyKHJvdyArIDEsIHttYXh9KVxuXG5jbGFzcyBNb3ZlRG93bldyYXAgZXh0ZW5kcyBNb3ZlRG93blxuICBAZXh0ZW5kKClcbiAgd3JhcDogdHJ1ZVxuXG5jbGFzcyBNb3ZlVXBTY3JlZW4gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgZGlyZWN0aW9uOiAndXAnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCAtPlxuICAgICAgbW92ZUN1cnNvclVwU2NyZWVuKGN1cnNvcilcblxuY2xhc3MgTW92ZURvd25TY3JlZW4gZXh0ZW5kcyBNb3ZlVXBTY3JlZW5cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgZGlyZWN0aW9uOiAnZG93bidcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsIC0+XG4gICAgICBtb3ZlQ3Vyc29yRG93blNjcmVlbihjdXJzb3IpXG5cbiMgTW92ZSBkb3duL3VwIHRvIEVkZ2VcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBTZWUgdDltZC9hdG9tLXZpbS1tb2RlLXBsdXMjMjM2XG4jIEF0IGxlYXN0IHYxLjcuMC4gYnVmZmVyUG9zaXRpb24gYW5kIHNjcmVlblBvc2l0aW9uIGNhbm5vdCBjb252ZXJ0IGFjY3VyYXRlbHlcbiMgd2hlbiByb3cgaXMgZm9sZGVkLlxuY2xhc3MgTW92ZVVwVG9FZGdlIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGp1bXA6IHRydWVcbiAgZGlyZWN0aW9uOiAndXAnXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIGN1cnNvciB1cCB0byAqKmVkZ2UqKiBjaGFyIGF0IHNhbWUtY29sdW1uXCJcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBtb3ZlQ3Vyc29yQ291bnRUaW1lcyBjdXJzb3IsID0+XG4gICAgICBAc2V0U2NyZWVuUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBAZ2V0UG9pbnQoY3Vyc29yLmdldFNjcmVlblBvc2l0aW9uKCkpKVxuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIGNvbHVtbiA9IGZyb21Qb2ludC5jb2x1bW5cbiAgICBmb3Igcm93IGluIEBnZXRTY2FuUm93cyhmcm9tUG9pbnQpIHdoZW4gQGlzRWRnZShwb2ludCA9IG5ldyBQb2ludChyb3csIGNvbHVtbikpXG4gICAgICByZXR1cm4gcG9pbnRcblxuICBnZXRTY2FuUm93czogKHtyb3d9KSAtPlxuICAgIHZhbGlkUm93ID0gZ2V0VmFsaWRWaW1TY3JlZW5Sb3cuYmluZChudWxsLCBAZWRpdG9yKVxuICAgIHN3aXRjaCBAZGlyZWN0aW9uXG4gICAgICB3aGVuICd1cCcgdGhlbiBbdmFsaWRSb3cocm93IC0gMSkuLjBdXG4gICAgICB3aGVuICdkb3duJyB0aGVuIFt2YWxpZFJvdyhyb3cgKyAxKS4uQGdldFZpbUxhc3RTY3JlZW5Sb3coKV1cblxuICBpc0VkZ2U6IChwb2ludCkgLT5cbiAgICBpZiBAaXNTdG9wcGFibGVQb2ludChwb2ludClcbiAgICAgICMgSWYgb25lIG9mIGFib3ZlL2JlbG93IHBvaW50IHdhcyBub3Qgc3RvcHBhYmxlLCBpdCdzIEVkZ2UhXG4gICAgICBhYm92ZSA9IHBvaW50LnRyYW5zbGF0ZShbLTEsIDBdKVxuICAgICAgYmVsb3cgPSBwb2ludC50cmFuc2xhdGUoWysxLCAwXSlcbiAgICAgIChub3QgQGlzU3RvcHBhYmxlUG9pbnQoYWJvdmUpKSBvciAobm90IEBpc1N0b3BwYWJsZVBvaW50KGJlbG93KSlcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIGlzU3RvcHBhYmxlUG9pbnQ6IChwb2ludCkgLT5cbiAgICBpZiBAaXNOb25XaGl0ZVNwYWNlUG9pbnQocG9pbnQpXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgbGVmdFBvaW50ID0gcG9pbnQudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgICByaWdodFBvaW50ID0gcG9pbnQudHJhbnNsYXRlKFswLCArMV0pXG4gICAgICBAaXNOb25XaGl0ZVNwYWNlUG9pbnQobGVmdFBvaW50KSBhbmQgQGlzTm9uV2hpdGVTcGFjZVBvaW50KHJpZ2h0UG9pbnQpXG5cbiAgaXNOb25XaGl0ZVNwYWNlUG9pbnQ6IChwb2ludCkgLT5cbiAgICBjaGFyID0gZ2V0VGV4dEluU2NyZWVuUmFuZ2UoQGVkaXRvciwgUmFuZ2UuZnJvbVBvaW50V2l0aERlbHRhKHBvaW50LCAwLCAxKSlcbiAgICBjaGFyPyBhbmQgL1xcUy8udGVzdChjaGFyKVxuXG5jbGFzcyBNb3ZlRG93blRvRWRnZSBleHRlbmRzIE1vdmVVcFRvRWRnZVxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgY3Vyc29yIGRvd24gdG8gKiplZGdlKiogY2hhciBhdCBzYW1lLWNvbHVtblwiXG4gIGRpcmVjdGlvbjogJ2Rvd24nXG5cbiMgd29yZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0V29yZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiBudWxsXG5cbiAgZ2V0UG9pbnQ6IChwYXR0ZXJuLCBmcm9tKSAtPlxuICAgIHdvcmRSYW5nZSA9IG51bGxcbiAgICBmb3VuZCA9IGZhbHNlXG4gICAgdmltRU9GID0gQGdldFZpbUVvZkJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IpXG5cbiAgICBAc2NhbkZvcndhcmQgcGF0dGVybiwge2Zyb219LCAoe3JhbmdlLCBtYXRjaFRleHQsIHN0b3B9KSAtPlxuICAgICAgd29yZFJhbmdlID0gcmFuZ2VcbiAgICAgICMgSWdub3JlICdlbXB0eSBsaW5lJyBtYXRjaGVzIGJldHdlZW4gJ1xccicgYW5kICdcXG4nXG4gICAgICByZXR1cm4gaWYgbWF0Y2hUZXh0IGlzICcnIGFuZCByYW5nZS5zdGFydC5jb2x1bW4gaXNudCAwXG4gICAgICBpZiByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuKGZyb20pXG4gICAgICAgIGZvdW5kID0gdHJ1ZVxuICAgICAgICBzdG9wKClcblxuICAgIGlmIGZvdW5kXG4gICAgICBwb2ludCA9IHdvcmRSYW5nZS5zdGFydFxuICAgICAgaWYgcG9pbnRJc0F0RW5kT2ZMaW5lQXROb25FbXB0eVJvdyhAZWRpdG9yLCBwb2ludCkgYW5kIG5vdCBwb2ludC5pc0VxdWFsKHZpbUVPRilcbiAgICAgICAgcG9pbnQudHJhdmVyc2UoWzEsIDBdKVxuICAgICAgZWxzZVxuICAgICAgICBwb2ludFxuICAgIGVsc2VcbiAgICAgIHdvcmRSYW5nZT8uZW5kID8gZnJvbVxuXG4gICMgU3BlY2lhbCBjYXNlOiBcImN3XCIgYW5kIFwiY1dcIiBhcmUgdHJlYXRlZCBsaWtlIFwiY2VcIiBhbmQgXCJjRVwiIGlmIHRoZSBjdXJzb3IgaXNcbiAgIyBvbiBhIG5vbi1ibGFuay4gIFRoaXMgaXMgYmVjYXVzZSBcImN3XCIgaXMgaW50ZXJwcmV0ZWQgYXMgY2hhbmdlLXdvcmQsIGFuZCBhXG4gICMgd29yZCBkb2VzIG5vdCBpbmNsdWRlIHRoZSBmb2xsb3dpbmcgd2hpdGUgc3BhY2UuICB7Vmk6IFwiY3dcIiB3aGVuIG9uIGEgYmxhbmtcbiAgIyBmb2xsb3dlZCBieSBvdGhlciBibGFua3MgY2hhbmdlcyBvbmx5IHRoZSBmaXJzdCBibGFuazsgdGhpcyBpcyBwcm9iYWJseSBhXG4gICMgYnVnLCBiZWNhdXNlIFwiZHdcIiBkZWxldGVzIGFsbCB0aGUgYmxhbmtzfVxuICAjXG4gICMgQW5vdGhlciBzcGVjaWFsIGNhc2U6IFdoZW4gdXNpbmcgdGhlIFwid1wiIG1vdGlvbiBpbiBjb21iaW5hdGlvbiB3aXRoIGFuXG4gICMgb3BlcmF0b3IgYW5kIHRoZSBsYXN0IHdvcmQgbW92ZWQgb3ZlciBpcyBhdCB0aGUgZW5kIG9mIGEgbGluZSwgdGhlIGVuZCBvZlxuICAjIHRoYXQgd29yZCBiZWNvbWVzIHRoZSBlbmQgb2YgdGhlIG9wZXJhdGVkIHRleHQsIG5vdCB0aGUgZmlyc3Qgd29yZCBpbiB0aGVcbiAgIyBuZXh0IGxpbmUuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIHJldHVybiBpZiBwb2ludElzQXRWaW1FbmRPZkZpbGUoQGVkaXRvciwgY3Vyc29yUG9zaXRpb24pXG4gICAgd2FzT25XaGl0ZVNwYWNlID0gcG9pbnRJc09uV2hpdGVTcGFjZShAZWRpdG9yLCBjdXJzb3JQb3NpdGlvbilcblxuICAgIGlzQXNUYXJnZXRFeGNlcHRTZWxlY3QgPSBAaXNBc1RhcmdldEV4Y2VwdFNlbGVjdCgpXG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgKHtpc0ZpbmFsfSkgPT5cbiAgICAgIGN1cnNvclBvc2l0aW9uID0gY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKClcbiAgICAgIGlmIGlzRW1wdHlSb3coQGVkaXRvciwgY3Vyc29yUG9zaXRpb24ucm93KSBhbmQgaXNBc1RhcmdldEV4Y2VwdFNlbGVjdFxuICAgICAgICBwb2ludCA9IGN1cnNvclBvc2l0aW9uLnRyYXZlcnNlKFsxLCAwXSlcbiAgICAgIGVsc2VcbiAgICAgICAgcGF0dGVybiA9IEB3b3JkUmVnZXggPyBjdXJzb3Iud29yZFJlZ0V4cCgpXG4gICAgICAgIHBvaW50ID0gQGdldFBvaW50KHBhdHRlcm4sIGN1cnNvclBvc2l0aW9uKVxuICAgICAgICBpZiBpc0ZpbmFsIGFuZCBpc0FzVGFyZ2V0RXhjZXB0U2VsZWN0XG4gICAgICAgICAgaWYgQG9wZXJhdG9yLmlzKCdDaGFuZ2UnKSBhbmQgKG5vdCB3YXNPbldoaXRlU3BhY2UpXG4gICAgICAgICAgICBwb2ludCA9IGN1cnNvci5nZXRFbmRPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24oe0B3b3JkUmVnZXh9KVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBnZXRFbmRPZkxpbmVGb3JCdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yUG9zaXRpb24ucm93KSlcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcblxuIyBiXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1dvcmQgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogbnVsbFxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIHBvaW50ID0gY3Vyc29yLmdldEJlZ2lubmluZ09mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbmNsYXNzIE1vdmVUb0VuZE9mV29yZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiBudWxsXG4gIGluY2x1c2l2ZTogdHJ1ZVxuXG4gIG1vdmVUb05leHRFbmRPZldvcmQ6IChjdXJzb3IpIC0+XG4gICAgbW92ZUN1cnNvclRvTmV4dE5vbldoaXRlc3BhY2UoY3Vyc29yKVxuICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgb3JpZ2luYWxQb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBAbW92ZVRvTmV4dEVuZE9mV29yZChjdXJzb3IpXG4gICAgICBpZiBvcmlnaW5hbFBvaW50LmlzRXF1YWwoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgICMgUmV0cnkgZnJvbSByaWdodCBjb2x1bW4gaWYgY3Vyc29yIHdhcyBhbHJlYWR5IG9uIEVuZE9mV29yZFxuICAgICAgICBjdXJzb3IubW92ZVJpZ2h0KClcbiAgICAgICAgQG1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKVxuXG4jIFtUT0RPOiBJbXByb3ZlLCBhY2N1cmFjeV1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHRpbWVzID0gQGdldENvdW50KClcbiAgICB3b3JkUmFuZ2UgPSBjdXJzb3IuZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuXG4gICAgIyBpZiB3ZSdyZSBpbiB0aGUgbWlkZGxlIG9mIGEgd29yZCB0aGVuIHdlIG5lZWQgdG8gbW92ZSB0byBpdHMgc3RhcnRcbiAgICBpZiBjdXJzb3JQb3NpdGlvbi5pc0dyZWF0ZXJUaGFuKHdvcmRSYW5nZS5zdGFydCkgYW5kIGN1cnNvclBvc2l0aW9uLmlzTGVzc1RoYW4od29yZFJhbmdlLmVuZClcbiAgICAgIHRpbWVzICs9IDFcblxuICAgIGZvciBbMS4udGltZXNdXG4gICAgICBwb2ludCA9IGN1cnNvci5nZXRCZWdpbm5pbmdPZkN1cnJlbnRXb3JkQnVmZmVyUG9zaXRpb24oe0B3b3JkUmVnZXh9KVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gICAgQG1vdmVUb05leHRFbmRPZldvcmQoY3Vyc29yKVxuICAgIGlmIGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpLmlzR3JlYXRlclRoYW5PckVxdWFsKGN1cnNvclBvc2l0aW9uKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKFswLCAwXSlcblxuICBtb3ZlVG9OZXh0RW5kT2ZXb3JkOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gY3Vyc29yLmdldEVuZE9mQ3VycmVudFdvcmRCdWZmZXJQb3NpdGlvbih7QHdvcmRSZWdleH0pLnRyYW5zbGF0ZShbMCwgLTFdKVxuICAgIHBvaW50ID0gUG9pbnQubWluKHBvaW50LCBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiMgV2hvbGUgd29yZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0V2hvbGVXb3JkIGV4dGVuZHMgTW92ZVRvTmV4dFdvcmRcbiAgQGV4dGVuZCgpXG4gIHdvcmRSZWdleDogL14kfFxcUysvZ1xuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1dob2xlV29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXiR8XFxTKy9nXG5cbmNsYXNzIE1vdmVUb0VuZE9mV2hvbGVXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICB3b3JkUmVnZXg6IC9cXFMrL1xuXG4jIFtUT0RPOiBJbXByb3ZlLCBhY2N1cmFjeV1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRW5kT2ZXaG9sZVdvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgd29yZFJlZ2V4OiAvXFxTKy9cblxuIyBBbHBoYW51bWVyaWMgd29yZCBbRXhwZXJpbWVudGFsXVxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0QWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IGFscGhhbnVtZXJpYyhgL1xcdysvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1xcdysvZ1xuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0FscGhhbnVtZXJpY1dvcmQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c1dvcmRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGFscGhhbnVtZXJpYyhgL1xcdysvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1xcdysvXG5cbmNsYXNzIE1vdmVUb0VuZE9mQWxwaGFudW1lcmljV29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gZW5kIG9mIGFscGhhbnVtZXJpYyhgL1xcdysvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1xcdysvXG5cbiMgQWxwaGFudW1lcmljIHdvcmQgW0V4cGVyaW1lbnRhbF1cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvTmV4dFNtYXJ0V29yZCBleHRlbmRzIE1vdmVUb05leHRXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IHNtYXJ0IHdvcmQgKGAvW1xcdy1dKy9gKSB3b3JkXCJcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9nXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBzbWFydCB3b3JkIChgL1tcXHctXSsvYCkgd29yZFwiXG4gIHdvcmRSZWdleDogL1tcXHctXSsvXG5cbmNsYXNzIE1vdmVUb0VuZE9mU21hcnRXb3JkIGV4dGVuZHMgTW92ZVRvRW5kT2ZXb3JkXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBlbmQgb2Ygc21hcnQgd29yZCAoYC9bXFx3LV0rL2ApIHdvcmRcIlxuICB3b3JkUmVnZXg6IC9bXFx3LV0rL1xuXG4jIFN1YndvcmRcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgTW92ZVRvTmV4dFN1YndvcmQgZXh0ZW5kcyBNb3ZlVG9OZXh0V29yZFxuICBAZXh0ZW5kKClcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAd29yZFJlZ2V4ID0gY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHN1cGVyXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU3Vid29yZCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzV29yZFxuICBAZXh0ZW5kKClcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAd29yZFJlZ2V4ID0gY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHN1cGVyXG5cbmNsYXNzIE1vdmVUb0VuZE9mU3Vid29yZCBleHRlbmRzIE1vdmVUb0VuZE9mV29yZFxuICBAZXh0ZW5kKClcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAd29yZFJlZ2V4ID0gY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHN1cGVyXG5cbiMgU2VudGVuY2VcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBTZW50ZW5jZSBpcyBkZWZpbmVkIGFzIGJlbG93XG4jICAtIGVuZCB3aXRoIFsnLicsICchJywgJz8nXVxuIyAgLSBvcHRpb25hbGx5IGZvbGxvd2VkIGJ5IFsnKScsICddJywgJ1wiJywgXCInXCJdXG4jICAtIGZvbGxvd2VkIGJ5IFsnJCcsICcgJywgJ1xcdCddXG4jICAtIHBhcmFncmFwaCBib3VuZGFyeSBpcyBhbHNvIHNlbnRlbmNlIGJvdW5kYXJ5XG4jICAtIHNlY3Rpb24gYm91bmRhcnkgaXMgYWxzbyBzZW50ZW5jZSBib3VuZGFyeShpZ25vcmUpXG5jbGFzcyBNb3ZlVG9OZXh0U2VudGVuY2UgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIGp1bXA6IHRydWVcbiAgc2VudGVuY2VSZWdleDogLy8vKD86W1xcLiFcXD9dW1xcKVxcXVwiJ10qXFxzKyl8KFxcbnxcXHJcXG4pLy8vZ1xuICBkaXJlY3Rpb246ICduZXh0J1xuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpXG5cbiAgZ2V0UG9pbnQ6IChmcm9tUG9pbnQpIC0+XG4gICAgaWYgQGRpcmVjdGlvbiBpcyAnbmV4dCdcbiAgICAgIEBnZXROZXh0U3RhcnRPZlNlbnRlbmNlKGZyb21Qb2ludClcbiAgICBlbHNlIGlmIEBkaXJlY3Rpb24gaXMgJ3ByZXZpb3VzJ1xuICAgICAgQGdldFByZXZpb3VzU3RhcnRPZlNlbnRlbmNlKGZyb21Qb2ludClcblxuICBpc0JsYW5rUm93OiAocm93KSAtPlxuICAgIEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpXG5cbiAgZ2V0TmV4dFN0YXJ0T2ZTZW50ZW5jZTogKGZyb20pIC0+XG4gICAgZm91bmRQb2ludCA9IG51bGxcbiAgICBAc2NhbkZvcndhcmQgQHNlbnRlbmNlUmVnZXgsIHtmcm9tfSwgKHtyYW5nZSwgbWF0Y2hUZXh0LCBtYXRjaCwgc3RvcH0pID0+XG4gICAgICBpZiBtYXRjaFsxXT9cbiAgICAgICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gW3JhbmdlLnN0YXJ0LnJvdywgcmFuZ2UuZW5kLnJvd11cbiAgICAgICAgcmV0dXJuIGlmIEBza2lwQmxhbmtSb3cgYW5kIEBpc0JsYW5rUm93KGVuZFJvdylcbiAgICAgICAgaWYgQGlzQmxhbmtSb3coc3RhcnRSb3cpIGlzbnQgQGlzQmxhbmtSb3coZW5kUm93KVxuICAgICAgICAgIGZvdW5kUG9pbnQgPSBAZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyhlbmRSb3cpXG4gICAgICBlbHNlXG4gICAgICAgIGZvdW5kUG9pbnQgPSByYW5nZS5lbmRcbiAgICAgIHN0b3AoKSBpZiBmb3VuZFBvaW50P1xuICAgIGZvdW5kUG9pbnQgPyBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKVxuXG4gIGdldFByZXZpb3VzU3RhcnRPZlNlbnRlbmNlOiAoZnJvbSkgLT5cbiAgICBmb3VuZFBvaW50ID0gbnVsbFxuICAgIEBzY2FuQmFja3dhcmQgQHNlbnRlbmNlUmVnZXgsIHtmcm9tfSwgKHtyYW5nZSwgbWF0Y2gsIHN0b3AsIG1hdGNoVGV4dH0pID0+XG4gICAgICBpZiBtYXRjaFsxXT9cbiAgICAgICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gW3JhbmdlLnN0YXJ0LnJvdywgcmFuZ2UuZW5kLnJvd11cbiAgICAgICAgaWYgbm90IEBpc0JsYW5rUm93KGVuZFJvdykgYW5kIEBpc0JsYW5rUm93KHN0YXJ0Um93KVxuICAgICAgICAgIHBvaW50ID0gQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coZW5kUm93KVxuICAgICAgICAgIGlmIHBvaW50LmlzTGVzc1RoYW4oZnJvbSlcbiAgICAgICAgICAgIGZvdW5kUG9pbnQgPSBwb2ludFxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHJldHVybiBpZiBAc2tpcEJsYW5rUm93XG4gICAgICAgICAgICBmb3VuZFBvaW50ID0gQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coc3RhcnRSb3cpXG4gICAgICBlbHNlXG4gICAgICAgIGlmIHJhbmdlLmVuZC5pc0xlc3NUaGFuKGZyb20pXG4gICAgICAgICAgZm91bmRQb2ludCA9IHJhbmdlLmVuZFxuICAgICAgc3RvcCgpIGlmIGZvdW5kUG9pbnQ/XG4gICAgZm91bmRQb2ludCA/IFswLCAwXVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1NlbnRlbmNlIGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlXG4gIEBleHRlbmQoKVxuICBkaXJlY3Rpb246ICdwcmV2aW91cydcblxuY2xhc3MgTW92ZVRvTmV4dFNlbnRlbmNlU2tpcEJsYW5rUm93IGV4dGVuZHMgTW92ZVRvTmV4dFNlbnRlbmNlXG4gIEBleHRlbmQoKVxuICBza2lwQmxhbmtSb3c6IHRydWVcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNTZW50ZW5jZVNraXBCbGFua1JvdyBleHRlbmRzIE1vdmVUb1ByZXZpb3VzU2VudGVuY2VcbiAgQGV4dGVuZCgpXG4gIHNraXBCbGFua1JvdzogdHJ1ZVxuXG4jIFBhcmFncmFwaFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9OZXh0UGFyYWdyYXBoIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBqdW1wOiB0cnVlXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgQHNldEJ1ZmZlclBvc2l0aW9uU2FmZWx5KGN1cnNvciwgQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKSlcblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICBzdGFydFJvdyA9IGZyb21Qb2ludC5yb3dcbiAgICB3YXNBdE5vbkJsYW5rUm93ID0gbm90IEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhzdGFydFJvdylcbiAgICBmb3Igcm93IGluIGdldEJ1ZmZlclJvd3MoQGVkaXRvciwge3N0YXJ0Um93LCBAZGlyZWN0aW9ufSlcbiAgICAgIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQocm93LCAwKSBpZiB3YXNBdE5vbkJsYW5rUm93XG4gICAgICBlbHNlXG4gICAgICAgIHdhc0F0Tm9uQmxhbmtSb3cgPSB0cnVlXG5cbiAgICAjIGZhbGxiYWNrXG4gICAgc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3ByZXZpb3VzJyB0aGVuIG5ldyBQb2ludCgwLCAwKVxuICAgICAgd2hlbiAnbmV4dCcgdGhlbiBAZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKVxuXG5jbGFzcyBNb3ZlVG9QcmV2aW91c1BhcmFncmFwaCBleHRlbmRzIE1vdmVUb05leHRQYXJhZ3JhcGhcbiAgQGV4dGVuZCgpXG4gIGRpcmVjdGlvbjogJ3ByZXZpb3VzJ1xuXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiMga2V5bWFwOiAwXG5jbGFzcyBNb3ZlVG9CZWdpbm5pbmdPZkxpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBzZXRCdWZmZXJDb2x1bW4oY3Vyc29yLCAwKVxuXG5jbGFzcyBNb3ZlVG9Db2x1bW4gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBzZXRCdWZmZXJDb2x1bW4oY3Vyc29yLCBAZ2V0Q291bnQoLTEpKVxuXG5jbGFzcyBNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcm93ID0gZ2V0VmFsaWRWaW1CdWZmZXJSb3coQGVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpICsgQGdldENvdW50KC0xKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24oW3JvdywgSW5maW5pdHldKVxuICAgIGN1cnNvci5nb2FsQ29sdW1uID0gSW5maW5pdHlcblxuY2xhc3MgTW92ZVRvTGFzdE5vbmJsYW5rQ2hhcmFjdGVyT2ZMaW5lQW5kRG93biBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBwb2ludCA9IEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG5cbiAgZ2V0UG9pbnQ6ICh7cm93fSkgLT5cbiAgICByb3cgPSBsaW1pdE51bWJlcihyb3cgKyBAZ2V0Q291bnQoLTEpLCBtYXg6IEBnZXRWaW1MYXN0QnVmZmVyUm93KCkpXG4gICAgcmFuZ2UgPSBmaW5kUmFuZ2VJbkJ1ZmZlclJvdyhAZWRpdG9yLCAvXFxTfF4vLCByb3csIGRpcmVjdGlvbjogJ2JhY2t3YXJkJylcbiAgICByYW5nZT8uc3RhcnQgPyBuZXcgUG9pbnQocm93LCAwKVxuXG4jIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGZhaW1pbHlcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIF5cbmNsYXNzIE1vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KVxuXG5jbGFzcyBNb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZVVwIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCAtPlxuICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgdW5sZXNzIHBvaW50LnJvdyBpcyAwXG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoWy0xLCAwXSkpXG4gICAgc3VwZXJcblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVcbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAbW92ZUN1cnNvckNvdW50VGltZXMgY3Vyc29yLCA9PlxuICAgICAgcG9pbnQgPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgdW5sZXNzIEBnZXRWaW1MYXN0QnVmZmVyUm93KCkgaXMgcG9pbnQucm93XG4gICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludC50cmFuc2xhdGUoWysxLCAwXSkpXG4gICAgc3VwZXJcblxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVBbmREb3duIGV4dGVuZHMgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmVEb3duXG4gIEBleHRlbmQoKVxuICBkZWZhdWx0Q291bnQ6IDBcbiAgZ2V0Q291bnQ6IC0+IHN1cGVyIC0gMVxuXG4jIGtleW1hcDogZyBnXG5jbGFzcyBNb3ZlVG9GaXJzdExpbmUgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZCgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAganVtcDogdHJ1ZVxuICB2ZXJ0aWNhbE1vdGlvbjogdHJ1ZVxuICBtb3ZlU3VjY2Vzc09uTGluZXdpc2U6IHRydWVcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBzZXRDdXJzb3JCdWZmZXJSb3coY3Vyc29yLCBnZXRWYWxpZFZpbUJ1ZmZlclJvdyhAZWRpdG9yLCBAZ2V0Um93KCkpKVxuICAgIGN1cnNvci5hdXRvc2Nyb2xsKGNlbnRlcjogdHJ1ZSlcblxuICBnZXRSb3c6IC0+XG4gICAgQGdldENvdW50KC0xKVxuXG5jbGFzcyBNb3ZlVG9TY3JlZW5Db2x1bW4gZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZChmYWxzZSlcbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBhbGxvd09mZlNjcmVlblBvc2l0aW9uID0gQGdldENvbmZpZyhcImFsbG93TW92ZVRvT2ZmU2NyZWVuQ29sdW1uT25TY3JlZW5MaW5lTW90aW9uXCIpXG4gICAgcG9pbnQgPSBAdmltU3RhdGUudXRpbHMuZ2V0U2NyZWVuUG9zaXRpb25Gb3JTY3JlZW5Sb3coQGVkaXRvciwgY3Vyc29yLmdldFNjcmVlblJvdygpLCBAd2hpY2gsIHthbGxvd09mZlNjcmVlblBvc2l0aW9ufSlcbiAgICBAc2V0U2NyZWVuUG9zaXRpb25TYWZlbHkoY3Vyc29yLCBwb2ludClcblxuIyBrZXltYXA6IGcgMFxuY2xhc3MgTW92ZVRvQmVnaW5uaW5nT2ZTY3JlZW5MaW5lIGV4dGVuZHMgTW92ZVRvU2NyZWVuQ29sdW1uXG4gIEBleHRlbmQoKVxuICB3aGljaDogXCJiZWdpbm5pbmdcIlxuXG4jIGcgXjogYG1vdmUtdG8tZmlyc3QtY2hhcmFjdGVyLW9mLXNjcmVlbi1saW5lYFxuY2xhc3MgTW92ZVRvRmlyc3RDaGFyYWN0ZXJPZlNjcmVlbkxpbmUgZXh0ZW5kcyBNb3ZlVG9TY3JlZW5Db2x1bW5cbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiBcImZpcnN0LWNoYXJhY3RlclwiXG5cbiMga2V5bWFwOiBnICRcbmNsYXNzIE1vdmVUb0xhc3RDaGFyYWN0ZXJPZlNjcmVlbkxpbmUgZXh0ZW5kcyBNb3ZlVG9TY3JlZW5Db2x1bW5cbiAgQGV4dGVuZCgpXG4gIHdoaWNoOiBcImxhc3QtY2hhcmFjdGVyXCJcblxuIyBrZXltYXA6IEdcbmNsYXNzIE1vdmVUb0xhc3RMaW5lIGV4dGVuZHMgTW92ZVRvRmlyc3RMaW5lXG4gIEBleHRlbmQoKVxuICBkZWZhdWx0Q291bnQ6IEluZmluaXR5XG5cbiMga2V5bWFwOiBOJSBlLmcuIDEwJVxuY2xhc3MgTW92ZVRvTGluZUJ5UGVyY2VudCBleHRlbmRzIE1vdmVUb0ZpcnN0TGluZVxuICBAZXh0ZW5kKClcblxuICBnZXRSb3c6IC0+XG4gICAgcGVyY2VudCA9IGxpbWl0TnVtYmVyKEBnZXRDb3VudCgpLCBtYXg6IDEwMClcbiAgICBNYXRoLmZsb29yKChAZWRpdG9yLmdldExpbmVDb3VudCgpIC0gMSkgKiAocGVyY2VudCAvIDEwMCkpXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIG1vdmVTdWNjZXNzT25MaW5ld2lzZTogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgcm93ID0gQGdldEZvbGRFbmRSb3dGb3JSb3coY3Vyc29yLmdldEJ1ZmZlclJvdygpKVxuXG4gICAgY291bnQgPSBAZ2V0Q291bnQoLTEpXG4gICAgd2hpbGUgKGNvdW50ID4gMClcbiAgICAgIHJvdyA9IEBnZXRGb2xkRW5kUm93Rm9yUm93KHJvdyArIDEpXG4gICAgICBjb3VudC0tXG5cbiAgICBzZXRCdWZmZXJSb3coY3Vyc29yLCByb3cpXG5cbmNsYXNzIE1vdmVUb1JlbGF0aXZlTGluZU1pbmltdW1PbmUgZXh0ZW5kcyBNb3ZlVG9SZWxhdGl2ZUxpbmVcbiAgQGV4dGVuZChmYWxzZSlcblxuICBnZXRDb3VudDogLT5cbiAgICBsaW1pdE51bWJlcihzdXBlciwgbWluOiAxKVxuXG4jIFBvc2l0aW9uIGN1cnNvciB3aXRob3V0IHNjcm9sbGluZy4sIEgsIE0sIExcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBrZXltYXA6IEhcbmNsYXNzIE1vdmVUb1RvcE9mU2NyZWVuIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIGp1bXA6IHRydWVcbiAgc2Nyb2xsb2ZmOiAyXG4gIGRlZmF1bHRDb3VudDogMFxuICB2ZXJ0aWNhbE1vdGlvbjogdHJ1ZVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgYnVmZmVyUm93ID0gQGVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coQGdldFNjcmVlblJvdygpKVxuICAgIEBzZXRDdXJzb3JCdWZmZXJSb3coY3Vyc29yLCBidWZmZXJSb3cpXG5cbiAgZ2V0U2Nyb2xsb2ZmOiAtPlxuICAgIGlmIEBpc0FzVGFyZ2V0RXhjZXB0U2VsZWN0KClcbiAgICAgIDBcbiAgICBlbHNlXG4gICAgICBAc2Nyb2xsb2ZmXG5cbiAgZ2V0U2NyZWVuUm93OiAtPlxuICAgIGZpcnN0Um93ID0gZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KEBlZGl0b3IpXG4gICAgb2Zmc2V0ID0gQGdldFNjcm9sbG9mZigpXG4gICAgb2Zmc2V0ID0gMCBpZiBmaXJzdFJvdyBpcyAwXG4gICAgb2Zmc2V0ID0gbGltaXROdW1iZXIoQGdldENvdW50KC0xKSwgbWluOiBvZmZzZXQpXG4gICAgZmlyc3RSb3cgKyBvZmZzZXRcblxuIyBrZXltYXA6IE1cbmNsYXNzIE1vdmVUb01pZGRsZU9mU2NyZWVuIGV4dGVuZHMgTW92ZVRvVG9wT2ZTY3JlZW5cbiAgQGV4dGVuZCgpXG4gIGdldFNjcmVlblJvdzogLT5cbiAgICBzdGFydFJvdyA9IGdldEZpcnN0VmlzaWJsZVNjcmVlblJvdyhAZWRpdG9yKVxuICAgIGVuZFJvdyA9IGxpbWl0TnVtYmVyKEBlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSwgbWF4OiBAZ2V0VmltTGFzdFNjcmVlblJvdygpKVxuICAgIHN0YXJ0Um93ICsgTWF0aC5mbG9vcigoZW5kUm93IC0gc3RhcnRSb3cpIC8gMilcblxuIyBrZXltYXA6IExcbmNsYXNzIE1vdmVUb0JvdHRvbU9mU2NyZWVuIGV4dGVuZHMgTW92ZVRvVG9wT2ZTY3JlZW5cbiAgQGV4dGVuZCgpXG4gIGdldFNjcmVlblJvdzogLT5cbiAgICAjIFtGSVhNRV1cbiAgICAjIEF0IGxlYXN0IEF0b20gdjEuNi4wLCB0aGVyZSBhcmUgdHdvIGltcGxlbWVudGF0aW9uIG9mIGdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICAjIGVkaXRvci5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpIGFuZCBlZGl0b3JFbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICAjIFRob3NlIHR3byBtZXRob2RzIHJldHVybiBkaWZmZXJlbnQgdmFsdWUsIGVkaXRvcidzIG9uZSBpcyBjb3JyZW50LlxuICAgICMgU28gSSBpbnRlbnRpb25hbGx5IHVzZSBlZGl0b3IuZ2V0TGFzdFNjcmVlblJvdyBoZXJlLlxuICAgIHZpbUxhc3RTY3JlZW5Sb3cgPSBAZ2V0VmltTGFzdFNjcmVlblJvdygpXG4gICAgcm93ID0gbGltaXROdW1iZXIoQGVkaXRvci5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpLCBtYXg6IHZpbUxhc3RTY3JlZW5Sb3cpXG4gICAgb2Zmc2V0ID0gQGdldFNjcm9sbG9mZigpICsgMVxuICAgIG9mZnNldCA9IDAgaWYgcm93IGlzIHZpbUxhc3RTY3JlZW5Sb3dcbiAgICBvZmZzZXQgPSBsaW1pdE51bWJlcihAZ2V0Q291bnQoLTEpLCBtaW46IG9mZnNldClcbiAgICByb3cgLSBvZmZzZXRcblxuIyBTY3JvbGxpbmdcbiMgSGFsZjogY3RybC1kLCBjdHJsLXVcbiMgRnVsbDogY3RybC1mLCBjdHJsLWJcbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBbRklYTUVdIGNvdW50IGJlaGF2ZSBkaWZmZXJlbnRseSBmcm9tIG9yaWdpbmFsIFZpbS5cbmNsYXNzIFNjcm9sbCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICB2ZXJ0aWNhbE1vdGlvbjogdHJ1ZVxuXG4gIGlzU21vb3RoU2Nyb2xsRW5hYmxlZDogLT5cbiAgICBpZiBNYXRoLmFicyhAYW1vdW50T2ZQYWdlKSBpcyAxXG4gICAgICBAZ2V0Q29uZmlnKCdzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb24nKVxuICAgIGVsc2VcbiAgICAgIEBnZXRDb25maWcoJ3Ntb290aFNjcm9sbE9uSGFsZlNjcm9sbE1vdGlvbicpXG5cbiAgZ2V0U21vb3RoU2Nyb2xsRHVhdGlvbjogLT5cbiAgICBpZiBNYXRoLmFicyhAYW1vdW50T2ZQYWdlKSBpcyAxXG4gICAgICBAZ2V0Q29uZmlnKCdzbW9vdGhTY3JvbGxPbkZ1bGxTY3JvbGxNb3Rpb25EdXJhdGlvbicpXG4gICAgZWxzZVxuICAgICAgQGdldENvbmZpZygnc21vb3RoU2Nyb2xsT25IYWxmU2Nyb2xsTW90aW9uRHVyYXRpb24nKVxuXG4gIGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93OiAocm93KSAtPlxuICAgIHBvaW50ID0gbmV3IFBvaW50KHJvdywgMClcbiAgICBAZWRpdG9yLmVsZW1lbnQucGl4ZWxSZWN0Rm9yU2NyZWVuUmFuZ2UobmV3IFJhbmdlKHBvaW50LCBwb2ludCkpLnRvcFxuXG4gIHNtb290aFNjcm9sbDogKGZyb21Sb3csIHRvUm93LCBkb25lKSAtPlxuICAgIHRvcFBpeGVsRnJvbSA9IHt0b3A6IEBnZXRQaXhlbFJlY3RUb3BGb3JTY2VlblJvdyhmcm9tUm93KX1cbiAgICB0b3BQaXhlbFRvID0ge3RvcDogQGdldFBpeGVsUmVjdFRvcEZvclNjZWVuUm93KHRvUm93KX1cbiAgICAjIFtOT1RFXVxuICAgICMgaW50ZW50aW9uYWxseSB1c2UgYGVsZW1lbnQuY29tcG9uZW50LnNldFNjcm9sbFRvcGAgaW5zdGVhZCBvZiBgZWxlbWVudC5zZXRTY3JvbGxUb3BgLlxuICAgICMgU0luY2UgZWxlbWVudC5zZXRTY3JvbGxUb3Agd2lsbCB0aHJvdyBleGNlcHRpb24gd2hlbiBlbGVtZW50LmNvbXBvbmVudCBubyBsb25nZXIgZXhpc3RzLlxuICAgIHN0ZXAgPSAobmV3VG9wKSA9PlxuICAgICAgaWYgQGVkaXRvci5lbGVtZW50LmNvbXBvbmVudD9cbiAgICAgICAgQGVkaXRvci5lbGVtZW50LmNvbXBvbmVudC5zZXRTY3JvbGxUb3AobmV3VG9wKVxuICAgICAgICBAZWRpdG9yLmVsZW1lbnQuY29tcG9uZW50LnVwZGF0ZVN5bmMoKVxuXG4gICAgZHVyYXRpb24gPSBAZ2V0U21vb3RoU2Nyb2xsRHVhdGlvbigpXG4gICAgQHZpbVN0YXRlLnJlcXVlc3RTY3JvbGxBbmltYXRpb24odG9wUGl4ZWxGcm9tLCB0b3BQaXhlbFRvLCB7ZHVyYXRpb24sIHN0ZXAsIGRvbmV9KVxuXG4gIGdldEFtb3VudE9mUm93czogLT5cbiAgICBNYXRoLmNlaWwoQGFtb3VudE9mUGFnZSAqIEBlZGl0b3IuZ2V0Um93c1BlclBhZ2UoKSAqIEBnZXRDb3VudCgpKVxuXG4gIGdldEJ1ZmZlclJvdzogKGN1cnNvcikgLT5cbiAgICBzY3JlZW5Sb3cgPSBnZXRWYWxpZFZpbVNjcmVlblJvdyhAZWRpdG9yLCBjdXJzb3IuZ2V0U2NyZWVuUm93KCkgKyBAZ2V0QW1vdW50T2ZSb3dzKCkpXG4gICAgQGVkaXRvci5idWZmZXJSb3dGb3JTY3JlZW5Sb3coc2NyZWVuUm93KVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgYnVmZmVyUm93ID0gQGdldEJ1ZmZlclJvdyhjdXJzb3IpXG4gICAgQHNldEN1cnNvckJ1ZmZlclJvdyhjdXJzb3IsIEBnZXRCdWZmZXJSb3coY3Vyc29yKSwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiAgICBpZiBjdXJzb3IuaXNMYXN0Q3Vyc29yKClcbiAgICAgIGlmIEBpc1Ntb290aFNjcm9sbEVuYWJsZWQoKVxuICAgICAgICBAdmltU3RhdGUuZmluaXNoU2Nyb2xsQW5pbWF0aW9uKClcblxuICAgICAgZmlyc3RWaXNpYmlsZVNjcmVlblJvdyA9IEBlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KClcbiAgICAgIG5ld0ZpcnN0VmlzaWJpbGVCdWZmZXJSb3cgPSBAZWRpdG9yLmJ1ZmZlclJvd0ZvclNjcmVlblJvdyhmaXJzdFZpc2liaWxlU2NyZWVuUm93ICsgQGdldEFtb3VudE9mUm93cygpKVxuICAgICAgbmV3Rmlyc3RWaXNpYmlsZVNjcmVlblJvdyA9IEBlZGl0b3Iuc2NyZWVuUm93Rm9yQnVmZmVyUm93KG5ld0ZpcnN0VmlzaWJpbGVCdWZmZXJSb3cpXG4gICAgICBkb25lID0gPT5cbiAgICAgICAgQGVkaXRvci5zZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cobmV3Rmlyc3RWaXNpYmlsZVNjcmVlblJvdylcbiAgICAgICAgIyBbRklYTUVdIHNvbWV0aW1lcywgc2Nyb2xsVG9wIGlzIG5vdCB1cGRhdGVkLCBjYWxsaW5nIHRoaXMgZml4LlxuICAgICAgICAjIEludmVzdGlnYXRlIGFuZCBmaW5kIGJldHRlciBhcHByb2FjaCB0aGVuIHJlbW92ZSB0aGlzIHdvcmthcm91bmQuXG4gICAgICAgIEBlZGl0b3IuZWxlbWVudC5jb21wb25lbnQ/LnVwZGF0ZVN5bmMoKVxuXG4gICAgICBpZiBAaXNTbW9vdGhTY3JvbGxFbmFibGVkKClcbiAgICAgICAgQHNtb290aFNjcm9sbChmaXJzdFZpc2liaWxlU2NyZWVuUm93LCBuZXdGaXJzdFZpc2liaWxlU2NyZWVuUm93LCBkb25lKVxuICAgICAgZWxzZVxuICAgICAgICBkb25lKClcblxuXG4jIGtleW1hcDogY3RybC1mXG5jbGFzcyBTY3JvbGxGdWxsU2NyZWVuRG93biBleHRlbmRzIFNjcm9sbFxuICBAZXh0ZW5kKHRydWUpXG4gIGFtb3VudE9mUGFnZTogKzFcblxuIyBrZXltYXA6IGN0cmwtYlxuY2xhc3MgU2Nyb2xsRnVsbFNjcmVlblVwIGV4dGVuZHMgU2Nyb2xsXG4gIEBleHRlbmQoKVxuICBhbW91bnRPZlBhZ2U6IC0xXG5cbiMga2V5bWFwOiBjdHJsLWRcbmNsYXNzIFNjcm9sbEhhbGZTY3JlZW5Eb3duIGV4dGVuZHMgU2Nyb2xsXG4gIEBleHRlbmQoKVxuICBhbW91bnRPZlBhZ2U6ICsxIC8gMlxuXG4jIGtleW1hcDogY3RybC11XG5jbGFzcyBTY3JvbGxIYWxmU2NyZWVuVXAgZXh0ZW5kcyBTY3JvbGxcbiAgQGV4dGVuZCgpXG4gIGFtb3VudE9mUGFnZTogLTEgLyAyXG5cbiMgRmluZFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogZlxuY2xhc3MgRmluZCBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgYmFja3dhcmRzOiBmYWxzZVxuICBpbmNsdXNpdmU6IHRydWVcbiAgb2Zmc2V0OiAwXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuICBjYXNlU2Vuc2l0aXZpdHlLaW5kOiBcIkZpbmRcIlxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcblxuICAgIEByZXBlYXRJZk5lY2Vzc2FyeSgpXG4gICAgcmV0dXJuIGlmIEBpc0NvbXBsZXRlKClcblxuICAgIGNoYXJzTWF4ID0gQGdldENvbmZpZyhcImZpbmRDaGFyc01heFwiKVxuXG4gICAgaWYgKGNoYXJzTWF4ID4gMSlcbiAgICAgIG9wdGlvbnMgPVxuICAgICAgICBhdXRvQ29uZmlybVRpbWVvdXQ6IEBnZXRDb25maWcoXCJmaW5kQ29uZmlybUJ5VGltZW91dFwiKVxuICAgICAgICBvbkNoYW5nZTogKGNoYXIpID0+IEBoaWdobGlnaHRUZXh0SW5DdXJzb3JSb3dzKGNoYXIsIFwicHJlLWNvbmZpcm1cIilcbiAgICAgICAgb25DYW5jZWw6ID0+XG4gICAgICAgICAgQHZpbVN0YXRlLmhpZ2hsaWdodEZpbmQuY2xlYXJNYXJrZXJzKClcbiAgICAgICAgICBAY2FuY2VsT3BlcmF0aW9uKClcblxuICAgIG9wdGlvbnMgPz0ge31cbiAgICBvcHRpb25zLnB1cnBvc2UgPSBcImZpbmRcIlxuICAgIG9wdGlvbnMuY2hhcnNNYXggPSBjaGFyc01heFxuXG4gICAgQGZvY3VzSW5wdXQob3B0aW9ucylcblxuICByZXBlYXRJZk5lY2Vzc2FyeTogLT5cbiAgICBpZiBAZ2V0Q29uZmlnKFwicmV1c2VGaW5kRm9yUmVwZWF0RmluZFwiKVxuICAgICAgaWYgQHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLmdldExhc3RDb21tYW5kTmFtZSgpIGluIFtcIkZpbmRcIiwgXCJGaW5kQmFja3dhcmRzXCIsIFwiVGlsbFwiLCBcIlRpbGxCYWNrd2FyZHNcIl1cbiAgICAgICAgQGlucHV0ID0gQHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldChcImN1cnJlbnRGaW5kXCIpLmlucHV0XG4gICAgICAgIEByZXBlYXRlZCA9IHRydWVcblxuICBpc0JhY2t3YXJkczogLT5cbiAgICBAYmFja3dhcmRzXG5cbiAgZXhlY3V0ZTogLT5cbiAgICBzdXBlclxuICAgIGRlY29yYXRpb25UeXBlID0gXCJwb3N0LWNvbmZpcm1cIlxuICAgIGRlY29yYXRpb25UeXBlICs9IFwiIGxvbmdcIiBpZiBAaXNBc1RhcmdldEV4Y2VwdFNlbGVjdCgpXG4gICAgQGVkaXRvci5jb21wb25lbnQuZ2V0TmV4dFVwZGF0ZVByb21pc2UoKS50aGVuID0+XG4gICAgICBAaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93cyhAaW5wdXQsIGRlY29yYXRpb25UeXBlKVxuXG4gICAgcmV0dXJuICMgRG9uJ3QgcmV0dXJuIFByb21pc2UgaGVyZS4gT3BlcmF0aW9uU3RhY2sgdHJlYXQgUHJvbWlzZSBkaWZmZXJlbnRseS5cblxuICBnZXRTY2FuSW5mbzogKGZyb21Qb2ludCkgLT5cbiAgICB7c3RhcnQsIGVuZH0gPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KGZyb21Qb2ludC5yb3cpXG5cbiAgICBvZmZzZXQgPSBpZiBAaXNCYWNrd2FyZHMoKSB0aGVuIEBvZmZzZXQgZWxzZSAtQG9mZnNldFxuICAgIHVuT2Zmc2V0ID0gLW9mZnNldCAqIEByZXBlYXRlZFxuICAgIGlmIEBpc0JhY2t3YXJkcygpXG4gICAgICBzdGFydCA9IFBvaW50LlpFUk8gaWYgQGdldENvbmZpZyhcImZpbmRBY3Jvc3NMaW5lc1wiKVxuICAgICAgc2NhblJhbmdlID0gW3N0YXJ0LCBmcm9tUG9pbnQudHJhbnNsYXRlKFswLCB1bk9mZnNldF0pXVxuICAgICAgbWV0aG9kID0gJ2JhY2t3YXJkc1NjYW5JbkJ1ZmZlclJhbmdlJ1xuICAgIGVsc2VcbiAgICAgIGVuZCA9IEBlZGl0b3IuZ2V0RW9mQnVmZmVyUG9zaXRpb24oKSBpZiBAZ2V0Q29uZmlnKFwiZmluZEFjcm9zc0xpbmVzXCIpXG4gICAgICBzY2FuUmFuZ2UgPSBbZnJvbVBvaW50LnRyYW5zbGF0ZShbMCwgMSArIHVuT2Zmc2V0XSksIGVuZF1cbiAgICAgIG1ldGhvZCA9ICdzY2FuSW5CdWZmZXJSYW5nZSdcbiAgICB7c2NhblJhbmdlLCBtZXRob2QsIG9mZnNldH1cblxuICBnZXRQb2ludDogKGZyb21Qb2ludCkgLT5cbiAgICB7c2NhblJhbmdlLCBtZXRob2QsIG9mZnNldH0gPSBAZ2V0U2NhbkluZm8oZnJvbVBvaW50KVxuICAgIHBvaW50cyA9IFtdXG4gICAgaW5kZXhXYW50QWNjZXNzID0gQGdldENvdW50KC0xKVxuICAgIEBlZGl0b3JbbWV0aG9kXSBAZ2V0UmVnZXgoQGlucHV0KSwgc2NhblJhbmdlLCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIHBvaW50cy5wdXNoKHJhbmdlLnN0YXJ0KVxuICAgICAgc3RvcCgpIGlmIHBvaW50cy5sZW5ndGggPiBpbmRleFdhbnRBY2Nlc3NcblxuICAgIHBvaW50c1tpbmRleFdhbnRBY2Nlc3NdPy50cmFuc2xhdGUoWzAsIG9mZnNldF0pXG5cbiAgaGlnaGxpZ2h0VGV4dEluQ3Vyc29yUm93czogKHRleHQsIGRlY29yYXRpb25UeXBlKSAtPlxuICAgIHJldHVybiB1bmxlc3MgQGdldENvbmZpZyhcImhpZ2hsaWdodEZpbmRDaGFyXCIpXG4gICAgQHZpbVN0YXRlLmhpZ2hsaWdodEZpbmQuaGlnaGxpZ2h0Q3Vyc29yUm93cyhAZ2V0UmVnZXgodGV4dCksIGRlY29yYXRpb25UeXBlLCBAaXNCYWNrd2FyZHMoKSwgQGdldENvdW50KC0xKSlcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIHBvaW50ID0gQGdldFBvaW50KGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpKVxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIHBvaW50KVxuICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2N1cnJlbnRGaW5kJywgdGhpcykgdW5sZXNzIEByZXBlYXRlZFxuXG4gIGdldFJlZ2V4OiAodGVybSkgLT5cbiAgICBtb2RpZmllcnMgPSBpZiBAaXNDYXNlU2Vuc2l0aXZlKHRlcm0pIHRoZW4gJ2cnIGVsc2UgJ2dpJ1xuICAgIG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcblxuIyBrZXltYXA6IEZcbmNsYXNzIEZpbmRCYWNrd2FyZHMgZXh0ZW5kcyBGaW5kXG4gIEBleHRlbmQoKVxuICBpbmNsdXNpdmU6IGZhbHNlXG4gIGJhY2t3YXJkczogdHJ1ZVxuXG4jIGtleW1hcDogdFxuY2xhc3MgVGlsbCBleHRlbmRzIEZpbmRcbiAgQGV4dGVuZCgpXG4gIG9mZnNldDogMVxuXG4gIGdldFBvaW50OiAtPlxuICAgIEBwb2ludCA9IHN1cGVyXG4gICAgQG1vdmVTdWNjZWVkZWQgPSBAcG9pbnQ/XG4gICAgcmV0dXJuIEBwb2ludFxuXG4jIGtleW1hcDogVFxuY2xhc3MgVGlsbEJhY2t3YXJkcyBleHRlbmRzIFRpbGxcbiAgQGV4dGVuZCgpXG4gIGluY2x1c2l2ZTogZmFsc2VcbiAgYmFja3dhcmRzOiB0cnVlXG5cbiMgTWFya1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogYFxuY2xhc3MgTW92ZVRvTWFyayBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAganVtcDogdHJ1ZVxuICByZXF1aXJlSW5wdXQ6IHRydWVcbiAgaW5wdXQ6IG51bGwgIyBzZXQgd2hlbiBpbnN0YXRudGlhdGVkIHZpYSB2aW1TdGF0ZTo6bW92ZVRvTWFyaygpXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEByZWFkQ2hhcigpIHVubGVzcyBAaXNDb21wbGV0ZSgpXG5cbiAgZ2V0UG9pbnQ6IC0+XG4gICAgQHZpbVN0YXRlLm1hcmsuZ2V0KEBpbnB1dClcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGlmIHBvaW50ID0gQGdldFBvaW50KClcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICAgIGN1cnNvci5hdXRvc2Nyb2xsKGNlbnRlcjogdHJ1ZSlcblxuIyBrZXltYXA6ICdcbmNsYXNzIE1vdmVUb01hcmtMaW5lIGV4dGVuZHMgTW92ZVRvTWFya1xuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGdldFBvaW50OiAtPlxuICAgIGlmIHBvaW50ID0gc3VwZXJcbiAgICAgIEBnZXRGaXJzdENoYXJhY3RlclBvc2l0aW9uRm9yQnVmZmVyUm93KHBvaW50LnJvdylcblxuIyBGb2xkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0IGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBmb2xkIHN0YXJ0XCJcbiAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gIHdoaWNoOiAnc3RhcnQnXG4gIGRpcmVjdGlvbjogJ3ByZXYnXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBzdXBlclxuICAgIEByb3dzID0gQGdldEZvbGRSb3dzKEB3aGljaClcbiAgICBAcm93cy5yZXZlcnNlKCkgaWYgQGRpcmVjdGlvbiBpcyAncHJldidcblxuICBnZXRGb2xkUm93czogKHdoaWNoKSAtPlxuICAgIGluZGV4ID0gaWYgd2hpY2ggaXMgJ3N0YXJ0JyB0aGVuIDAgZWxzZSAxXG4gICAgcm93cyA9IGdldENvZGVGb2xkUm93UmFuZ2VzKEBlZGl0b3IpLm1hcCAocm93UmFuZ2UpIC0+XG4gICAgICByb3dSYW5nZVtpbmRleF1cbiAgICBfLnNvcnRCeShfLnVuaXEocm93cyksIChyb3cpIC0+IHJvdylcblxuICBnZXRTY2FuUm93czogKGN1cnNvcikgLT5cbiAgICBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICBpc1ZhbGlkUm93ID0gc3dpdGNoIEBkaXJlY3Rpb25cbiAgICAgIHdoZW4gJ3ByZXYnIHRoZW4gKHJvdykgLT4gcm93IDwgY3Vyc29yUm93XG4gICAgICB3aGVuICduZXh0JyB0aGVuIChyb3cpIC0+IHJvdyA+IGN1cnNvclJvd1xuICAgIEByb3dzLmZpbHRlcihpc1ZhbGlkUm93KVxuXG4gIGRldGVjdFJvdzogKGN1cnNvcikgLT5cbiAgICBAZ2V0U2NhblJvd3MoY3Vyc29yKVswXVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIGlmIChyb3cgPSBAZGV0ZWN0Um93KGN1cnNvcikpP1xuICAgICAgICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93KGN1cnNvciwgcm93KVxuXG5jbGFzcyBNb3ZlVG9OZXh0Rm9sZFN0YXJ0IGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZm9sZCBzdGFydFwiXG4gIGRpcmVjdGlvbjogJ25leHQnXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnQgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgc2FtZS1pbmRlbnRlZCBmb2xkIHN0YXJ0XCJcbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIGJhc2VJbmRlbnRMZXZlbCA9IEBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhjdXJzb3IuZ2V0QnVmZmVyUm93KCkpXG4gICAgZm9yIHJvdyBpbiBAZ2V0U2NhblJvd3MoY3Vyc29yKVxuICAgICAgaWYgQGdldEluZGVudExldmVsRm9yQnVmZmVyUm93KHJvdykgaXMgYmFzZUluZGVudExldmVsXG4gICAgICAgIHJldHVybiByb3dcbiAgICBudWxsXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkU3RhcnRXaXRoU2FtZUluZGVudCBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRm9sZFN0YXJ0V2l0aFNhbWVJbmRlbnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgc2FtZS1pbmRlbnRlZCBmb2xkIHN0YXJ0XCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZvbGQgZW5kXCJcbiAgd2hpY2g6ICdlbmQnXG5cbmNsYXNzIE1vdmVUb05leHRGb2xkRW5kIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkRW5kXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBuZXh0IGZvbGQgZW5kXCJcbiAgZGlyZWN0aW9uOiAnbmV4dCdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBNb3ZlVG9QcmV2aW91c0Z1bmN0aW9uIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNGb2xkU3RhcnRcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIHByZXZpb3VzIGZ1bmN0aW9uXCJcbiAgZGlyZWN0aW9uOiAncHJldidcbiAgZGV0ZWN0Um93OiAoY3Vyc29yKSAtPlxuICAgIF8uZGV0ZWN0IEBnZXRTY2FuUm93cyhjdXJzb3IpLCAocm93KSA9PlxuICAgICAgaXNJbmNsdWRlRnVuY3Rpb25TY29wZUZvclJvdyhAZWRpdG9yLCByb3cpXG5cbmNsYXNzIE1vdmVUb05leHRGdW5jdGlvbiBleHRlbmRzIE1vdmVUb1ByZXZpb3VzRnVuY3Rpb25cbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgZnVuY3Rpb25cIlxuICBkaXJlY3Rpb246ICduZXh0J1xuXG4jIFNjb3BlIGJhc2VkXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIE1vdmVUb1Bvc2l0aW9uQnlTY29wZSBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKGZhbHNlKVxuICBkaXJlY3Rpb246ICdiYWNrd2FyZCdcbiAgc2NvcGU6ICcuJ1xuXG4gIGdldFBvaW50OiAoZnJvbVBvaW50KSAtPlxuICAgIGRldGVjdFNjb3BlU3RhcnRQb3NpdGlvbkZvclNjb3BlKEBlZGl0b3IsIGZyb21Qb2ludCwgQGRpcmVjdGlvbiwgQHNjb3BlKVxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgQG1vdmVDdXJzb3JDb3VudFRpbWVzIGN1cnNvciwgPT5cbiAgICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSkpXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzU3RyaW5nIGV4dGVuZHMgTW92ZVRvUG9zaXRpb25CeVNjb3BlXG4gIEBleHRlbmQoKVxuICBAZGVzY3JpcHRpb246IFwiTW92ZSB0byBwcmV2aW91cyBzdHJpbmcoc2VhcmNoZWQgYnkgYHN0cmluZy5iZWdpbmAgc2NvcGUpXCJcbiAgZGlyZWN0aW9uOiAnYmFja3dhcmQnXG4gIHNjb3BlOiAnc3RyaW5nLmJlZ2luJ1xuXG5jbGFzcyBNb3ZlVG9OZXh0U3RyaW5nIGV4dGVuZHMgTW92ZVRvUHJldmlvdXNTdHJpbmdcbiAgQGV4dGVuZCgpXG4gIEBkZXNjcmlwdGlvbjogXCJNb3ZlIHRvIG5leHQgc3RyaW5nKHNlYXJjaGVkIGJ5IGBzdHJpbmcuYmVnaW5gIHNjb3BlKVwiXG4gIGRpcmVjdGlvbjogJ2ZvcndhcmQnXG5cbmNsYXNzIE1vdmVUb1ByZXZpb3VzTnVtYmVyIGV4dGVuZHMgTW92ZVRvUG9zaXRpb25CeVNjb3BlXG4gIEBleHRlbmQoKVxuICBkaXJlY3Rpb246ICdiYWNrd2FyZCdcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gcHJldmlvdXMgbnVtYmVyKHNlYXJjaGVkIGJ5IGBjb25zdGFudC5udW1lcmljYCBzY29wZSlcIlxuICBzY29wZTogJ2NvbnN0YW50Lm51bWVyaWMnXG5cbmNsYXNzIE1vdmVUb05leHROdW1iZXIgZXh0ZW5kcyBNb3ZlVG9QcmV2aW91c051bWJlclxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIk1vdmUgdG8gbmV4dCBudW1iZXIoc2VhcmNoZWQgYnkgYGNvbnN0YW50Lm51bWVyaWNgIHNjb3BlKVwiXG4gIGRpcmVjdGlvbjogJ2ZvcndhcmQnXG5cbmNsYXNzIE1vdmVUb05leHRPY2N1cnJlbmNlIGV4dGVuZHMgTW90aW9uXG4gIEBleHRlbmQoKVxuICAjIEVuc3VyZSB0aGlzIGNvbW1hbmQgaXMgYXZhaWxhYmxlIHdoZW4gaGFzLW9jY3VycmVuY2VcbiAgQGNvbW1hbmRTY29wZTogJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1cy5oYXMtb2NjdXJyZW5jZSdcbiAganVtcDogdHJ1ZVxuICBkaXJlY3Rpb246ICduZXh0J1xuXG4gIGdldFJhbmdlczogLT5cbiAgICBAdmltU3RhdGUub2NjdXJyZW5jZU1hbmFnZXIuZ2V0TWFya2VycygpLm1hcCAobWFya2VyKSAtPlxuICAgICAgbWFya2VyLmdldEJ1ZmZlclJhbmdlKClcblxuICBleGVjdXRlOiAtPlxuICAgIEByYW5nZXMgPSBAZ2V0UmFuZ2VzKClcbiAgICBzdXBlclxuXG4gIG1vdmVDdXJzb3I6IChjdXJzb3IpIC0+XG4gICAgaW5kZXggPSBAZ2V0SW5kZXgoY3Vyc29yLmdldEJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgaWYgaW5kZXg/XG4gICAgICBvZmZzZXQgPSBzd2l0Y2ggQGRpcmVjdGlvblxuICAgICAgICB3aGVuICduZXh0JyB0aGVuIEBnZXRDb3VudCgtMSlcbiAgICAgICAgd2hlbiAncHJldmlvdXMnIHRoZW4gLUBnZXRDb3VudCgtMSlcbiAgICAgIHJhbmdlID0gQHJhbmdlc1tnZXRJbmRleChpbmRleCArIG9mZnNldCwgQHJhbmdlcyldXG4gICAgICBwb2ludCA9IHJhbmdlLnN0YXJ0XG5cbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludCwgYXV0b3Njcm9sbDogZmFsc2UpXG5cbiAgICAgIGlmIGN1cnNvci5pc0xhc3RDdXJzb3IoKVxuICAgICAgICBAZWRpdG9yLnVuZm9sZEJ1ZmZlclJvdyhwb2ludC5yb3cpXG4gICAgICAgIHNtYXJ0U2Nyb2xsVG9CdWZmZXJQb3NpdGlvbihAZWRpdG9yLCBwb2ludClcblxuICAgICAgaWYgQGdldENvbmZpZygnZmxhc2hPbk1vdmVUb09jY3VycmVuY2UnKVxuICAgICAgICBAdmltU3RhdGUuZmxhc2gocmFuZ2UsIHR5cGU6ICdzZWFyY2gnKVxuXG4gIGdldEluZGV4OiAoZnJvbVBvaW50KSAtPlxuICAgIGZvciByYW5nZSwgaSBpbiBAcmFuZ2VzIHdoZW4gcmFuZ2Uuc3RhcnQuaXNHcmVhdGVyVGhhbihmcm9tUG9pbnQpXG4gICAgICByZXR1cm4gaVxuICAgIDBcblxuY2xhc3MgTW92ZVRvUHJldmlvdXNPY2N1cnJlbmNlIGV4dGVuZHMgTW92ZVRvTmV4dE9jY3VycmVuY2VcbiAgQGV4dGVuZCgpXG4gIGRpcmVjdGlvbjogJ3ByZXZpb3VzJ1xuXG4gIGdldEluZGV4OiAoZnJvbVBvaW50KSAtPlxuICAgIGZvciByYW5nZSwgaSBpbiBAcmFuZ2VzIGJ5IC0xIHdoZW4gcmFuZ2UuZW5kLmlzTGVzc1RoYW4oZnJvbVBvaW50KVxuICAgICAgcmV0dXJuIGlcbiAgICBAcmFuZ2VzLmxlbmd0aCAtIDFcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIGtleW1hcDogJVxuY2xhc3MgTW92ZVRvUGFpciBleHRlbmRzIE1vdGlvblxuICBAZXh0ZW5kKClcbiAgaW5jbHVzaXZlOiB0cnVlXG4gIGp1bXA6IHRydWVcbiAgbWVtYmVyOiBbJ1BhcmVudGhlc2lzJywgJ0N1cmx5QnJhY2tldCcsICdTcXVhcmVCcmFja2V0J11cblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIEBzZXRCdWZmZXJQb3NpdGlvblNhZmVseShjdXJzb3IsIEBnZXRQb2ludChjdXJzb3IpKVxuXG4gIGdldFBvaW50Rm9yVGFnOiAocG9pbnQpIC0+XG4gICAgcGFpckluZm8gPSBAbmV3KFwiQVRhZ1wiKS5nZXRQYWlySW5mbyhwb2ludClcbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgcGFpckluZm8/XG4gICAge29wZW5SYW5nZSwgY2xvc2VSYW5nZX0gPSBwYWlySW5mb1xuICAgIG9wZW5SYW5nZSA9IG9wZW5SYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICBjbG9zZVJhbmdlID0gY2xvc2VSYW5nZS50cmFuc2xhdGUoWzAsICsxXSwgWzAsIC0xXSlcbiAgICByZXR1cm4gY2xvc2VSYW5nZS5zdGFydCBpZiBvcGVuUmFuZ2UuY29udGFpbnNQb2ludChwb2ludCkgYW5kIChub3QgcG9pbnQuaXNFcXVhbChvcGVuUmFuZ2UuZW5kKSlcbiAgICByZXR1cm4gb3BlblJhbmdlLnN0YXJ0IGlmIGNsb3NlUmFuZ2UuY29udGFpbnNQb2ludChwb2ludCkgYW5kIChub3QgcG9pbnQuaXNFcXVhbChjbG9zZVJhbmdlLmVuZCkpXG5cbiAgZ2V0UG9pbnQ6IChjdXJzb3IpIC0+XG4gICAgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIGN1cnNvclJvdyA9IGN1cnNvclBvc2l0aW9uLnJvd1xuICAgIHJldHVybiBwb2ludCBpZiBwb2ludCA9IEBnZXRQb2ludEZvclRhZyhjdXJzb3JQb3NpdGlvbilcblxuICAgICMgQUFueVBhaXJBbGxvd0ZvcndhcmRpbmcgcmV0dXJuIGZvcndhcmRpbmcgcmFuZ2Ugb3IgZW5jbG9zaW5nIHJhbmdlLlxuICAgIHJhbmdlID0gQG5ldyhcIkFBbnlQYWlyQWxsb3dGb3J3YXJkaW5nXCIsIHtAbWVtYmVyfSkuZ2V0UmFuZ2UoY3Vyc29yLnNlbGVjdGlvbilcbiAgICByZXR1cm4gbnVsbCB1bmxlc3MgcmFuZ2U/XG4gICAge3N0YXJ0LCBlbmR9ID0gcmFuZ2VcbiAgICBpZiAoc3RhcnQucm93IGlzIGN1cnNvclJvdykgYW5kIHN0YXJ0LmlzR3JlYXRlclRoYW5PckVxdWFsKGN1cnNvclBvc2l0aW9uKVxuICAgICAgIyBGb3J3YXJkaW5nIHJhbmdlIGZvdW5kXG4gICAgICBlbmQudHJhbnNsYXRlKFswLCAtMV0pXG4gICAgZWxzZSBpZiBlbmQucm93IGlzIGN1cnNvclBvc2l0aW9uLnJvd1xuICAgICAgIyBFbmNsb3NpbmcgcmFuZ2Ugd2FzIHJldHVybmVkXG4gICAgICAjIFdlIG1vdmUgdG8gc3RhcnQoIG9wZW4tcGFpciApIG9ubHkgd2hlbiBjbG9zZS1wYWlyIHdhcyBhdCBzYW1lIHJvdyBhcyBjdXJzb3Itcm93LlxuICAgICAgc3RhcnRcbiJdfQ==
