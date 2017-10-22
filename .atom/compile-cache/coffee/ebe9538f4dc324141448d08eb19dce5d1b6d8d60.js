(function() {
  var APair, AngleBracket, AnyPair, AnyPairAllowForwarding, AnyQuote, Arguments, BackTick, Base, Comment, CommentOrParagraph, CurlyBracket, CurrentLine, DoubleQuote, Empty, Entire, Fold, Function, Indentation, LastPastedRange, LatestChange, Pair, PairFinder, Paragraph, Parenthesis, PersistentSelection, Point, PreviousSelection, Quote, Range, SearchMatchBackward, SearchMatchForward, SingleQuote, SmartWord, SquareBracket, Subword, Tag, TextObject, VisibleArea, WholeWord, Word, _, expandRangeToWhiteSpaces, getBufferRows, getCodeFoldRowRangesContainesForRow, getLineTextToBufferPosition, getValidVimBufferRow, getVisibleBufferRange, isIncludeFunctionScopeForRow, pointIsAtEndOfLine, ref, ref1, sortRanges, splitArguments, translatePointAndClip, traverseTextFromPoint, trimRange,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  ref = require('atom'), Range = ref.Range, Point = ref.Point;

  _ = require('underscore-plus');

  Base = require('./base');

  ref1 = require('./utils'), getLineTextToBufferPosition = ref1.getLineTextToBufferPosition, getCodeFoldRowRangesContainesForRow = ref1.getCodeFoldRowRangesContainesForRow, isIncludeFunctionScopeForRow = ref1.isIncludeFunctionScopeForRow, expandRangeToWhiteSpaces = ref1.expandRangeToWhiteSpaces, getVisibleBufferRange = ref1.getVisibleBufferRange, translatePointAndClip = ref1.translatePointAndClip, getBufferRows = ref1.getBufferRows, getValidVimBufferRow = ref1.getValidVimBufferRow, trimRange = ref1.trimRange, sortRanges = ref1.sortRanges, pointIsAtEndOfLine = ref1.pointIsAtEndOfLine, splitArguments = ref1.splitArguments, traverseTextFromPoint = ref1.traverseTextFromPoint;

  PairFinder = null;

  TextObject = (function(superClass) {
    extend(TextObject, superClass);

    TextObject.extend(false);

    TextObject.operationKind = 'text-object';

    TextObject.prototype.wise = 'characterwise';

    TextObject.prototype.supportCount = false;

    TextObject.prototype.selectOnce = false;

    TextObject.prototype.selectSucceeded = false;

    TextObject.deriveInnerAndA = function() {
      this.generateClass("A" + this.name, false);
      return this.generateClass("Inner" + this.name, true);
    };

    TextObject.deriveInnerAndAForAllowForwarding = function() {
      this.generateClass("A" + this.name + "AllowForwarding", false, true);
      return this.generateClass("Inner" + this.name + "AllowForwarding", true, true);
    };

    TextObject.generateClass = function(klassName, inner, allowForwarding) {
      var klass;
      klass = (function(superClass1) {
        extend(_Class, superClass1);

        function _Class() {
          return _Class.__super__.constructor.apply(this, arguments);
        }

        return _Class;

      })(this);
      Object.defineProperty(klass, 'name', {
        get: function() {
          return klassName;
        }
      });
      klass.prototype.inner = inner;
      if (allowForwarding) {
        klass.prototype.allowForwarding = true;
      }
      return klass.extend();
    };

    function TextObject() {
      TextObject.__super__.constructor.apply(this, arguments);
      this.initialize();
    }

    TextObject.prototype.isInner = function() {
      return this.inner;
    };

    TextObject.prototype.isA = function() {
      return !this.inner;
    };

    TextObject.prototype.isLinewise = function() {
      return this.wise === 'linewise';
    };

    TextObject.prototype.isBlockwise = function() {
      return this.wise === 'blockwise';
    };

    TextObject.prototype.forceWise = function(wise) {
      return this.wise = wise;
    };

    TextObject.prototype.resetState = function() {
      return this.selectSucceeded = false;
    };

    TextObject.prototype.execute = function() {
      if (this.operator != null) {
        return this.select();
      } else {
        throw new Error('in TextObject: Must not happen');
      }
    };

    TextObject.prototype.select = function() {
      var $selection, i, j, k, len, len1, len2, ref2, ref3, ref4, results;
      if (this.isMode('visual', 'blockwise')) {
        this.swrap.normalize(this.editor);
      }
      this.countTimes(this.getCount(), (function(_this) {
        return function(arg1) {
          var i, len, oldRange, ref2, results, selection, stop;
          stop = arg1.stop;
          if (!_this.supportCount) {
            stop();
          }
          ref2 = _this.editor.getSelections();
          results = [];
          for (i = 0, len = ref2.length; i < len; i++) {
            selection = ref2[i];
            oldRange = selection.getBufferRange();
            if (_this.selectTextObject(selection)) {
              _this.selectSucceeded = true;
            }
            if (selection.getBufferRange().isEqual(oldRange)) {
              stop();
            }
            if (_this.selectOnce) {
              break;
            } else {
              results.push(void 0);
            }
          }
          return results;
        };
      })(this));
      this.editor.mergeIntersectingSelections();
      if (this.wise == null) {
        this.wise = this.swrap.detectWise(this.editor);
      }
      if (this.operator["instanceof"]("SelectBase")) {
        if (this.selectSucceeded) {
          switch (this.wise) {
            case 'characterwise':
              ref2 = this.swrap.getSelections(this.editor);
              for (i = 0, len = ref2.length; i < len; i++) {
                $selection = ref2[i];
                $selection.saveProperties();
              }
              break;
            case 'linewise':
              ref3 = this.swrap.getSelections(this.editor);
              for (j = 0, len1 = ref3.length; j < len1; j++) {
                $selection = ref3[j];
                if (this.getConfig('stayOnSelectTextObject')) {
                  if (!$selection.hasProperties()) {
                    $selection.saveProperties();
                  }
                } else {
                  $selection.saveProperties();
                }
                $selection.fixPropertyRowToRowRange();
              }
          }
        }
        if (this.submode === 'blockwise') {
          ref4 = this.swrap.getSelections(this.editor);
          results = [];
          for (k = 0, len2 = ref4.length; k < len2; k++) {
            $selection = ref4[k];
            $selection.normalize();
            results.push($selection.applyWise('blockwise'));
          }
          return results;
        }
      }
    };

    TextObject.prototype.selectTextObject = function(selection) {
      var range;
      if (range = this.getRange(selection)) {
        this.swrap(selection).setBufferRange(range);
        return true;
      }
    };

    TextObject.prototype.getRange = function(selection) {
      return null;
    };

    return TextObject;

  })(Base);

  Word = (function(superClass) {
    extend(Word, superClass);

    function Word() {
      return Word.__super__.constructor.apply(this, arguments);
    }

    Word.extend(false);

    Word.deriveInnerAndA();

    Word.prototype.getRange = function(selection) {
      var point, range;
      point = this.getCursorPositionForSelection(selection);
      range = this.getWordBufferRangeAndKindAtBufferPosition(point, {
        wordRegex: this.wordRegex
      }).range;
      if (this.isA()) {
        return expandRangeToWhiteSpaces(this.editor, range);
      } else {
        return range;
      }
    };

    return Word;

  })(TextObject);

  WholeWord = (function(superClass) {
    extend(WholeWord, superClass);

    function WholeWord() {
      return WholeWord.__super__.constructor.apply(this, arguments);
    }

    WholeWord.extend(false);

    WholeWord.deriveInnerAndA();

    WholeWord.prototype.wordRegex = /\S+/;

    return WholeWord;

  })(Word);

  SmartWord = (function(superClass) {
    extend(SmartWord, superClass);

    function SmartWord() {
      return SmartWord.__super__.constructor.apply(this, arguments);
    }

    SmartWord.extend(false);

    SmartWord.deriveInnerAndA();

    SmartWord.description = "A word that consists of alphanumeric chars(`/[A-Za-z0-9_]/`) and hyphen `-`";

    SmartWord.prototype.wordRegex = /[\w-]+/;

    return SmartWord;

  })(Word);

  Subword = (function(superClass) {
    extend(Subword, superClass);

    function Subword() {
      return Subword.__super__.constructor.apply(this, arguments);
    }

    Subword.extend(false);

    Subword.deriveInnerAndA();

    Subword.prototype.getRange = function(selection) {
      this.wordRegex = selection.cursor.subwordRegExp();
      return Subword.__super__.getRange.apply(this, arguments);
    };

    return Subword;

  })(Word);

  Pair = (function(superClass) {
    extend(Pair, superClass);

    function Pair() {
      return Pair.__super__.constructor.apply(this, arguments);
    }

    Pair.extend(false);

    Pair.prototype.supportCount = true;

    Pair.prototype.allowNextLine = null;

    Pair.prototype.adjustInnerRange = true;

    Pair.prototype.pair = null;

    Pair.prototype.inclusive = true;

    Pair.prototype.initialize = function() {
      if (PairFinder == null) {
        PairFinder = require('./pair-finder');
      }
      return Pair.__super__.initialize.apply(this, arguments);
    };

    Pair.prototype.isAllowNextLine = function() {
      var ref2;
      return (ref2 = this.allowNextLine) != null ? ref2 : (this.pair != null) && this.pair[0] !== this.pair[1];
    };

    Pair.prototype.adjustRange = function(arg1) {
      var end, start;
      start = arg1.start, end = arg1.end;
      if (pointIsAtEndOfLine(this.editor, start)) {
        start = start.traverse([1, 0]);
      }
      if (getLineTextToBufferPosition(this.editor, end).match(/^\s*$/)) {
        if (this.mode === 'visual') {
          end = new Point(end.row - 1, 2e308);
        } else {
          end = new Point(end.row, 0);
        }
      }
      return new Range(start, end);
    };

    Pair.prototype.getFinder = function() {
      var options;
      options = {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        pair: this.pair,
        inclusive: this.inclusive
      };
      if (this.pair[0] === this.pair[1]) {
        return new PairFinder.QuoteFinder(this.editor, options);
      } else {
        return new PairFinder.BracketFinder(this.editor, options);
      }
    };

    Pair.prototype.getPairInfo = function(from) {
      var pairInfo;
      pairInfo = this.getFinder().find(from);
      if (pairInfo == null) {
        return null;
      }
      if (this.adjustInnerRange) {
        pairInfo.innerRange = this.adjustRange(pairInfo.innerRange);
      }
      pairInfo.targetRange = this.isInner() ? pairInfo.innerRange : pairInfo.aRange;
      return pairInfo;
    };

    Pair.prototype.getRange = function(selection) {
      var originalRange, pairInfo;
      originalRange = selection.getBufferRange();
      pairInfo = this.getPairInfo(this.getCursorPositionForSelection(selection));
      if (pairInfo != null ? pairInfo.targetRange.isEqual(originalRange) : void 0) {
        pairInfo = this.getPairInfo(pairInfo.aRange.end);
      }
      return pairInfo != null ? pairInfo.targetRange : void 0;
    };

    return Pair;

  })(TextObject);

  APair = (function(superClass) {
    extend(APair, superClass);

    function APair() {
      return APair.__super__.constructor.apply(this, arguments);
    }

    APair.extend(false);

    return APair;

  })(Pair);

  AnyPair = (function(superClass) {
    extend(AnyPair, superClass);

    function AnyPair() {
      return AnyPair.__super__.constructor.apply(this, arguments);
    }

    AnyPair.extend(false);

    AnyPair.deriveInnerAndA();

    AnyPair.prototype.allowForwarding = false;

    AnyPair.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick', 'CurlyBracket', 'AngleBracket', 'SquareBracket', 'Parenthesis'];

    AnyPair.prototype.getRanges = function(selection) {
      return this.member.map((function(_this) {
        return function(klass) {
          return _this["new"](klass, {
            inner: _this.inner,
            allowForwarding: _this.allowForwarding,
            inclusive: _this.inclusive
          }).getRange(selection);
        };
      })(this)).filter(function(range) {
        return range != null;
      });
    };

    AnyPair.prototype.getRange = function(selection) {
      return _.last(sortRanges(this.getRanges(selection)));
    };

    return AnyPair;

  })(Pair);

  AnyPairAllowForwarding = (function(superClass) {
    extend(AnyPairAllowForwarding, superClass);

    function AnyPairAllowForwarding() {
      return AnyPairAllowForwarding.__super__.constructor.apply(this, arguments);
    }

    AnyPairAllowForwarding.extend(false);

    AnyPairAllowForwarding.deriveInnerAndA();

    AnyPairAllowForwarding.description = "Range surrounded by auto-detected paired chars from enclosed and forwarding area";

    AnyPairAllowForwarding.prototype.allowForwarding = true;

    AnyPairAllowForwarding.prototype.getRange = function(selection) {
      var enclosingRange, enclosingRanges, forwardingRanges, from, ranges, ref2;
      ranges = this.getRanges(selection);
      from = selection.cursor.getBufferPosition();
      ref2 = _.partition(ranges, function(range) {
        return range.start.isGreaterThanOrEqual(from);
      }), forwardingRanges = ref2[0], enclosingRanges = ref2[1];
      enclosingRange = _.last(sortRanges(enclosingRanges));
      forwardingRanges = sortRanges(forwardingRanges);
      if (enclosingRange) {
        forwardingRanges = forwardingRanges.filter(function(range) {
          return enclosingRange.containsRange(range);
        });
      }
      return forwardingRanges[0] || enclosingRange;
    };

    return AnyPairAllowForwarding;

  })(AnyPair);

  AnyQuote = (function(superClass) {
    extend(AnyQuote, superClass);

    function AnyQuote() {
      return AnyQuote.__super__.constructor.apply(this, arguments);
    }

    AnyQuote.extend(false);

    AnyQuote.deriveInnerAndA();

    AnyQuote.prototype.allowForwarding = true;

    AnyQuote.prototype.member = ['DoubleQuote', 'SingleQuote', 'BackTick'];

    AnyQuote.prototype.getRange = function(selection) {
      var ranges;
      ranges = this.getRanges(selection);
      if (ranges.length) {
        return _.first(_.sortBy(ranges, function(r) {
          return r.end.column;
        }));
      }
    };

    return AnyQuote;

  })(AnyPair);

  Quote = (function(superClass) {
    extend(Quote, superClass);

    function Quote() {
      return Quote.__super__.constructor.apply(this, arguments);
    }

    Quote.extend(false);

    Quote.prototype.allowForwarding = true;

    return Quote;

  })(Pair);

  DoubleQuote = (function(superClass) {
    extend(DoubleQuote, superClass);

    function DoubleQuote() {
      return DoubleQuote.__super__.constructor.apply(this, arguments);
    }

    DoubleQuote.extend(false);

    DoubleQuote.deriveInnerAndA();

    DoubleQuote.prototype.pair = ['"', '"'];

    return DoubleQuote;

  })(Quote);

  SingleQuote = (function(superClass) {
    extend(SingleQuote, superClass);

    function SingleQuote() {
      return SingleQuote.__super__.constructor.apply(this, arguments);
    }

    SingleQuote.extend(false);

    SingleQuote.deriveInnerAndA();

    SingleQuote.prototype.pair = ["'", "'"];

    return SingleQuote;

  })(Quote);

  BackTick = (function(superClass) {
    extend(BackTick, superClass);

    function BackTick() {
      return BackTick.__super__.constructor.apply(this, arguments);
    }

    BackTick.extend(false);

    BackTick.deriveInnerAndA();

    BackTick.prototype.pair = ['`', '`'];

    return BackTick;

  })(Quote);

  CurlyBracket = (function(superClass) {
    extend(CurlyBracket, superClass);

    function CurlyBracket() {
      return CurlyBracket.__super__.constructor.apply(this, arguments);
    }

    CurlyBracket.extend(false);

    CurlyBracket.deriveInnerAndA();

    CurlyBracket.deriveInnerAndAForAllowForwarding();

    CurlyBracket.prototype.pair = ['{', '}'];

    return CurlyBracket;

  })(Pair);

  SquareBracket = (function(superClass) {
    extend(SquareBracket, superClass);

    function SquareBracket() {
      return SquareBracket.__super__.constructor.apply(this, arguments);
    }

    SquareBracket.extend(false);

    SquareBracket.deriveInnerAndA();

    SquareBracket.deriveInnerAndAForAllowForwarding();

    SquareBracket.prototype.pair = ['[', ']'];

    return SquareBracket;

  })(Pair);

  Parenthesis = (function(superClass) {
    extend(Parenthesis, superClass);

    function Parenthesis() {
      return Parenthesis.__super__.constructor.apply(this, arguments);
    }

    Parenthesis.extend(false);

    Parenthesis.deriveInnerAndA();

    Parenthesis.deriveInnerAndAForAllowForwarding();

    Parenthesis.prototype.pair = ['(', ')'];

    return Parenthesis;

  })(Pair);

  AngleBracket = (function(superClass) {
    extend(AngleBracket, superClass);

    function AngleBracket() {
      return AngleBracket.__super__.constructor.apply(this, arguments);
    }

    AngleBracket.extend(false);

    AngleBracket.deriveInnerAndA();

    AngleBracket.deriveInnerAndAForAllowForwarding();

    AngleBracket.prototype.pair = ['<', '>'];

    return AngleBracket;

  })(Pair);

  Tag = (function(superClass) {
    extend(Tag, superClass);

    function Tag() {
      return Tag.__super__.constructor.apply(this, arguments);
    }

    Tag.extend(false);

    Tag.deriveInnerAndA();

    Tag.prototype.allowNextLine = true;

    Tag.prototype.allowForwarding = true;

    Tag.prototype.adjustInnerRange = false;

    Tag.prototype.getTagStartPoint = function(from) {
      var pattern, tagRange;
      tagRange = null;
      pattern = PairFinder.TagFinder.pattern;
      this.scanForward(pattern, {
        from: [from.row, 0]
      }, function(arg1) {
        var range, stop;
        range = arg1.range, stop = arg1.stop;
        if (range.containsPoint(from, true)) {
          tagRange = range;
          return stop();
        }
      });
      return tagRange != null ? tagRange.start : void 0;
    };

    Tag.prototype.getFinder = function() {
      return new PairFinder.TagFinder(this.editor, {
        allowNextLine: this.isAllowNextLine(),
        allowForwarding: this.allowForwarding,
        inclusive: this.inclusive
      });
    };

    Tag.prototype.getPairInfo = function(from) {
      var ref2;
      return Tag.__super__.getPairInfo.call(this, (ref2 = this.getTagStartPoint(from)) != null ? ref2 : from);
    };

    return Tag;

  })(Pair);

  Paragraph = (function(superClass) {
    extend(Paragraph, superClass);

    function Paragraph() {
      return Paragraph.__super__.constructor.apply(this, arguments);
    }

    Paragraph.extend(false);

    Paragraph.deriveInnerAndA();

    Paragraph.prototype.wise = 'linewise';

    Paragraph.prototype.supportCount = true;

    Paragraph.prototype.findRow = function(fromRow, direction, fn) {
      var foundRow, i, len, ref2, row;
      if (typeof fn.reset === "function") {
        fn.reset();
      }
      foundRow = fromRow;
      ref2 = getBufferRows(this.editor, {
        startRow: fromRow,
        direction: direction
      });
      for (i = 0, len = ref2.length; i < len; i++) {
        row = ref2[i];
        if (!fn(row, direction)) {
          break;
        }
        foundRow = row;
      }
      return foundRow;
    };

    Paragraph.prototype.findRowRangeBy = function(fromRow, fn) {
      var endRow, startRow;
      startRow = this.findRow(fromRow, 'previous', fn);
      endRow = this.findRow(fromRow, 'next', fn);
      return [startRow, endRow];
    };

    Paragraph.prototype.getPredictFunction = function(fromRow, selection) {
      var directionToExtend, flip, fromRowResult, predict;
      fromRowResult = this.editor.isBufferRowBlank(fromRow);
      if (this.isInner()) {
        predict = (function(_this) {
          return function(row, direction) {
            return _this.editor.isBufferRowBlank(row) === fromRowResult;
          };
        })(this);
      } else {
        if (selection.isReversed()) {
          directionToExtend = 'previous';
        } else {
          directionToExtend = 'next';
        }
        flip = false;
        predict = (function(_this) {
          return function(row, direction) {
            var result;
            result = _this.editor.isBufferRowBlank(row) === fromRowResult;
            if (flip) {
              return !result;
            } else {
              if ((!result) && (direction === directionToExtend)) {
                flip = true;
                return true;
              }
              return result;
            }
          };
        })(this);
        predict.reset = function() {
          return flip = false;
        };
      }
      return predict;
    };

    Paragraph.prototype.getRange = function(selection) {
      var fromRow, originalRange, rowRange;
      originalRange = selection.getBufferRange();
      fromRow = this.getCursorPositionForSelection(selection).row;
      if (this.isMode('visual', 'linewise')) {
        if (selection.isReversed()) {
          fromRow--;
        } else {
          fromRow++;
        }
        fromRow = getValidVimBufferRow(this.editor, fromRow);
      }
      rowRange = this.findRowRangeBy(fromRow, this.getPredictFunction(fromRow, selection));
      return selection.getBufferRange().union(this.getBufferRangeForRowRange(rowRange));
    };

    return Paragraph;

  })(TextObject);

  Indentation = (function(superClass) {
    extend(Indentation, superClass);

    function Indentation() {
      return Indentation.__super__.constructor.apply(this, arguments);
    }

    Indentation.extend(false);

    Indentation.deriveInnerAndA();

    Indentation.prototype.getRange = function(selection) {
      var baseIndentLevel, fromRow, predict, rowRange;
      fromRow = this.getCursorPositionForSelection(selection).row;
      baseIndentLevel = this.getIndentLevelForBufferRow(fromRow);
      predict = (function(_this) {
        return function(row) {
          if (_this.editor.isBufferRowBlank(row)) {
            return _this.isA();
          } else {
            return _this.getIndentLevelForBufferRow(row) >= baseIndentLevel;
          }
        };
      })(this);
      rowRange = this.findRowRangeBy(fromRow, predict);
      return this.getBufferRangeForRowRange(rowRange);
    };

    return Indentation;

  })(Paragraph);

  Comment = (function(superClass) {
    extend(Comment, superClass);

    function Comment() {
      return Comment.__super__.constructor.apply(this, arguments);
    }

    Comment.extend(false);

    Comment.deriveInnerAndA();

    Comment.prototype.wise = 'linewise';

    Comment.prototype.getRange = function(selection) {
      var row, rowRange;
      row = this.getCursorPositionForSelection(selection).row;
      rowRange = this.editor.languageMode.rowRangeForCommentAtBufferRow(row);
      if (this.editor.isBufferRowCommented(row)) {
        if (rowRange == null) {
          rowRange = [row, row];
        }
      }
      if (rowRange != null) {
        return this.getBufferRangeForRowRange(rowRange);
      }
    };

    return Comment;

  })(TextObject);

  CommentOrParagraph = (function(superClass) {
    extend(CommentOrParagraph, superClass);

    function CommentOrParagraph() {
      return CommentOrParagraph.__super__.constructor.apply(this, arguments);
    }

    CommentOrParagraph.extend(false);

    CommentOrParagraph.deriveInnerAndA();

    CommentOrParagraph.prototype.wise = 'linewise';

    CommentOrParagraph.prototype.getRange = function(selection) {
      var i, klass, len, range, ref2;
      ref2 = ['Comment', 'Paragraph'];
      for (i = 0, len = ref2.length; i < len; i++) {
        klass = ref2[i];
        if (range = this["new"](klass, {
          inner: this.inner
        }).getRange(selection)) {
          return range;
        }
      }
    };

    return CommentOrParagraph;

  })(TextObject);

  Fold = (function(superClass) {
    extend(Fold, superClass);

    function Fold() {
      return Fold.__super__.constructor.apply(this, arguments);
    }

    Fold.extend(false);

    Fold.deriveInnerAndA();

    Fold.prototype.wise = 'linewise';

    Fold.prototype.adjustRowRange = function(rowRange) {
      var endRow, startRow;
      if (this.isA()) {
        return rowRange;
      }
      startRow = rowRange[0], endRow = rowRange[1];
      if (this.getIndentLevelForBufferRow(startRow) === this.getIndentLevelForBufferRow(endRow)) {
        endRow -= 1;
      }
      startRow += 1;
      return [startRow, endRow];
    };

    Fold.prototype.getFoldRowRangesContainsForRow = function(row) {
      return getCodeFoldRowRangesContainesForRow(this.editor, row).reverse();
    };

    Fold.prototype.getRange = function(selection) {
      var i, len, range, ref2, row, rowRange, selectedRange;
      row = this.getCursorPositionForSelection(selection).row;
      selectedRange = selection.getBufferRange();
      ref2 = this.getFoldRowRangesContainsForRow(row);
      for (i = 0, len = ref2.length; i < len; i++) {
        rowRange = ref2[i];
        range = this.getBufferRangeForRowRange(this.adjustRowRange(rowRange));
        if (!selectedRange.containsRange(range)) {
          return range;
        }
      }
    };

    return Fold;

  })(TextObject);

  Function = (function(superClass) {
    extend(Function, superClass);

    function Function() {
      return Function.__super__.constructor.apply(this, arguments);
    }

    Function.extend(false);

    Function.deriveInnerAndA();

    Function.prototype.scopeNamesOmittingEndRow = ['source.go', 'source.elixir'];

    Function.prototype.isGrammarNotFoldEndRow = function() {
      var packageName, ref2, scopeName;
      ref2 = this.editor.getGrammar(), scopeName = ref2.scopeName, packageName = ref2.packageName;
      if (indexOf.call(this.scopeNamesOmittingEndRow, scopeName) >= 0) {
        return true;
      } else {
        return scopeName === 'source.rust' && packageName === "language-rust";
      }
    };

    Function.prototype.getFoldRowRangesContainsForRow = function(row) {
      return (Function.__super__.getFoldRowRangesContainsForRow.apply(this, arguments)).filter((function(_this) {
        return function(rowRange) {
          return isIncludeFunctionScopeForRow(_this.editor, rowRange[0]);
        };
      })(this));
    };

    Function.prototype.adjustRowRange = function(rowRange) {
      var endRow, ref2, startRow;
      ref2 = Function.__super__.adjustRowRange.apply(this, arguments), startRow = ref2[0], endRow = ref2[1];
      if (this.isA() && this.isGrammarNotFoldEndRow()) {
        endRow += 1;
      }
      return [startRow, endRow];
    };

    return Function;

  })(Fold);

  Arguments = (function(superClass) {
    extend(Arguments, superClass);

    function Arguments() {
      return Arguments.__super__.constructor.apply(this, arguments);
    }

    Arguments.extend(false);

    Arguments.deriveInnerAndA();

    Arguments.prototype.newArgInfo = function(argStart, arg, separator) {
      var aRange, argEnd, argRange, innerRange, separatorEnd, separatorRange;
      argEnd = traverseTextFromPoint(argStart, arg);
      argRange = new Range(argStart, argEnd);
      separatorEnd = traverseTextFromPoint(argEnd, separator != null ? separator : '');
      separatorRange = new Range(argEnd, separatorEnd);
      innerRange = argRange;
      aRange = argRange.union(separatorRange);
      return {
        argRange: argRange,
        separatorRange: separatorRange,
        innerRange: innerRange,
        aRange: aRange
      };
    };

    Arguments.prototype.getArgumentsRangeForSelection = function(selection) {
      var member;
      member = ['CurlyBracket', 'SquareBracket', 'Parenthesis'];
      return this["new"]("InnerAnyPair", {
        inclusive: false,
        member: member
      }).getRange(selection);
    };

    Arguments.prototype.getRange = function(selection) {
      var aRange, allTokens, argInfo, argInfos, argStart, i, innerRange, lastArgInfo, len, pairRangeFound, point, range, ref2, ref3, separator, text, token;
      range = this.getArgumentsRangeForSelection(selection);
      pairRangeFound = range != null;
      if (range == null) {
        range = this["new"]("InnerCurrentLine").getRange(selection);
      }
      if (!range) {
        return;
      }
      range = trimRange(this.editor, range);
      text = this.editor.getTextInBufferRange(range);
      allTokens = splitArguments(text, pairRangeFound);
      argInfos = [];
      argStart = range.start;
      if (allTokens.length && allTokens[0].type === 'separator') {
        token = allTokens.shift();
        argStart = traverseTextFromPoint(argStart, token.text);
      }
      while (allTokens.length) {
        token = allTokens.shift();
        if (token.type === 'argument') {
          separator = (ref2 = allTokens.shift()) != null ? ref2.text : void 0;
          argInfo = this.newArgInfo(argStart, token.text, separator);
          if ((allTokens.length === 0) && (lastArgInfo = _.last(argInfos))) {
            argInfo.aRange = argInfo.argRange.union(lastArgInfo.separatorRange);
          }
          argStart = argInfo.aRange.end;
          argInfos.push(argInfo);
        } else {
          throw new Error('must not happen');
        }
      }
      point = this.getCursorPositionForSelection(selection);
      for (i = 0, len = argInfos.length; i < len; i++) {
        ref3 = argInfos[i], innerRange = ref3.innerRange, aRange = ref3.aRange;
        if (innerRange.end.isGreaterThanOrEqual(point)) {
          if (this.isInner()) {
            return innerRange;
          } else {
            return aRange;
          }
        }
      }
      return null;
    };

    return Arguments;

  })(TextObject);

  CurrentLine = (function(superClass) {
    extend(CurrentLine, superClass);

    function CurrentLine() {
      return CurrentLine.__super__.constructor.apply(this, arguments);
    }

    CurrentLine.extend(false);

    CurrentLine.deriveInnerAndA();

    CurrentLine.prototype.getRange = function(selection) {
      var range, row;
      row = this.getCursorPositionForSelection(selection).row;
      range = this.editor.bufferRangeForBufferRow(row);
      if (this.isA()) {
        return range;
      } else {
        return trimRange(this.editor, range);
      }
    };

    return CurrentLine;

  })(TextObject);

  Entire = (function(superClass) {
    extend(Entire, superClass);

    function Entire() {
      return Entire.__super__.constructor.apply(this, arguments);
    }

    Entire.extend(false);

    Entire.deriveInnerAndA();

    Entire.prototype.wise = 'linewise';

    Entire.prototype.selectOnce = true;

    Entire.prototype.getRange = function(selection) {
      return this.editor.buffer.getRange();
    };

    return Entire;

  })(TextObject);

  Empty = (function(superClass) {
    extend(Empty, superClass);

    function Empty() {
      return Empty.__super__.constructor.apply(this, arguments);
    }

    Empty.extend(false);

    Empty.prototype.selectOnce = true;

    return Empty;

  })(TextObject);

  LatestChange = (function(superClass) {
    extend(LatestChange, superClass);

    function LatestChange() {
      return LatestChange.__super__.constructor.apply(this, arguments);
    }

    LatestChange.extend(false);

    LatestChange.deriveInnerAndA();

    LatestChange.prototype.wise = null;

    LatestChange.prototype.selectOnce = true;

    LatestChange.prototype.getRange = function(selection) {
      var end, start;
      start = this.vimState.mark.get('[');
      end = this.vimState.mark.get(']');
      if ((start != null) && (end != null)) {
        return new Range(start, end);
      }
    };

    return LatestChange;

  })(TextObject);

  SearchMatchForward = (function(superClass) {
    extend(SearchMatchForward, superClass);

    function SearchMatchForward() {
      return SearchMatchForward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchForward.extend();

    SearchMatchForward.prototype.backward = false;

    SearchMatchForward.prototype.findMatch = function(fromPoint, pattern) {
      var found;
      if (this.mode === 'visual') {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "forward");
      }
      found = null;
      this.scanForward(pattern, {
        from: [fromPoint.row, 0]
      }, function(arg1) {
        var range, stop;
        range = arg1.range, stop = arg1.stop;
        if (range.end.isGreaterThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'end'
      };
    };

    SearchMatchForward.prototype.getRange = function(selection) {
      var fromPoint, pattern, range, ref2, whichIsHead;
      pattern = this.globalState.get('lastSearchPattern');
      if (pattern == null) {
        return;
      }
      fromPoint = selection.getHeadBufferPosition();
      ref2 = this.findMatch(fromPoint, pattern), range = ref2.range, whichIsHead = ref2.whichIsHead;
      if (range != null) {
        return this.unionRangeAndDetermineReversedState(selection, range, whichIsHead);
      }
    };

    SearchMatchForward.prototype.unionRangeAndDetermineReversedState = function(selection, found, whichIsHead) {
      var head, tail;
      if (selection.isEmpty()) {
        return found;
      } else {
        head = found[whichIsHead];
        tail = selection.getTailBufferPosition();
        if (this.backward) {
          if (tail.isLessThan(head)) {
            head = translatePointAndClip(this.editor, head, 'forward');
          }
        } else {
          if (head.isLessThan(tail)) {
            head = translatePointAndClip(this.editor, head, 'backward');
          }
        }
        this.reversed = head.isLessThan(tail);
        return new Range(tail, head).union(this.swrap(selection).getTailBufferRange());
      }
    };

    SearchMatchForward.prototype.selectTextObject = function(selection) {
      var range, ref2;
      if (range = this.getRange(selection)) {
        this.swrap(selection).setBufferRange(range, {
          reversed: (ref2 = this.reversed) != null ? ref2 : this.backward
        });
        return true;
      }
    };

    return SearchMatchForward;

  })(TextObject);

  SearchMatchBackward = (function(superClass) {
    extend(SearchMatchBackward, superClass);

    function SearchMatchBackward() {
      return SearchMatchBackward.__super__.constructor.apply(this, arguments);
    }

    SearchMatchBackward.extend();

    SearchMatchBackward.prototype.backward = true;

    SearchMatchBackward.prototype.findMatch = function(fromPoint, pattern) {
      var found;
      if (this.mode === 'visual') {
        fromPoint = translatePointAndClip(this.editor, fromPoint, "backward");
      }
      found = null;
      this.scanBackward(pattern, {
        from: [fromPoint.row, 2e308]
      }, function(arg1) {
        var range, stop;
        range = arg1.range, stop = arg1.stop;
        if (range.start.isLessThan(fromPoint)) {
          found = range;
          return stop();
        }
      });
      return {
        range: found,
        whichIsHead: 'start'
      };
    };

    return SearchMatchBackward;

  })(SearchMatchForward);

  PreviousSelection = (function(superClass) {
    extend(PreviousSelection, superClass);

    function PreviousSelection() {
      return PreviousSelection.__super__.constructor.apply(this, arguments);
    }

    PreviousSelection.extend();

    PreviousSelection.prototype.wise = null;

    PreviousSelection.prototype.selectOnce = true;

    PreviousSelection.prototype.selectTextObject = function(selection) {
      var properties, ref2, submode;
      ref2 = this.vimState.previousSelection, properties = ref2.properties, submode = ref2.submode;
      if ((properties != null) && (submode != null)) {
        this.wise = submode;
        this.swrap(this.editor.getLastSelection()).selectByProperties(properties);
        return true;
      }
    };

    return PreviousSelection;

  })(TextObject);

  PersistentSelection = (function(superClass) {
    extend(PersistentSelection, superClass);

    function PersistentSelection() {
      return PersistentSelection.__super__.constructor.apply(this, arguments);
    }

    PersistentSelection.extend(false);

    PersistentSelection.deriveInnerAndA();

    PersistentSelection.prototype.wise = null;

    PersistentSelection.prototype.selectOnce = true;

    PersistentSelection.prototype.selectTextObject = function(selection) {
      if (this.vimState.hasPersistentSelections()) {
        this.vimState.persistentSelection.setSelectedBufferRanges();
        return true;
      }
    };

    return PersistentSelection;

  })(TextObject);

  LastPastedRange = (function(superClass) {
    extend(LastPastedRange, superClass);

    function LastPastedRange() {
      return LastPastedRange.__super__.constructor.apply(this, arguments);
    }

    LastPastedRange.extend(false);

    LastPastedRange.prototype.wise = null;

    LastPastedRange.prototype.selectOnce = true;

    LastPastedRange.prototype.selectTextObject = function(selection) {
      var i, len, range, ref2;
      ref2 = this.editor.getSelections();
      for (i = 0, len = ref2.length; i < len; i++) {
        selection = ref2[i];
        range = this.vimState.sequentialPasteManager.getPastedRangeForSelection(selection);
        selection.setBufferRange(range);
      }
      return true;
    };

    return LastPastedRange;

  })(TextObject);

  VisibleArea = (function(superClass) {
    extend(VisibleArea, superClass);

    function VisibleArea() {
      return VisibleArea.__super__.constructor.apply(this, arguments);
    }

    VisibleArea.extend(false);

    VisibleArea.deriveInnerAndA();

    VisibleArea.prototype.selectOnce = true;

    VisibleArea.prototype.getRange = function(selection) {
      var bufferRange;
      bufferRange = getVisibleBufferRange(this.editor);
      if (bufferRange.getRows() > this.editor.getRowsPerPage()) {
        return bufferRange.translate([+1, 0], [-3, 0]);
      } else {
        return bufferRange;
      }
    };

    return VisibleArea;

  })(TextObject);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi90ZXh0LW9iamVjdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHF3QkFBQTtJQUFBOzs7O0VBQUEsTUFBaUIsT0FBQSxDQUFRLE1BQVIsQ0FBakIsRUFBQyxpQkFBRCxFQUFROztFQUNSLENBQUEsR0FBSSxPQUFBLENBQVEsaUJBQVI7O0VBS0osSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLE9BY0ksT0FBQSxDQUFRLFNBQVIsQ0FkSixFQUNFLDhEQURGLEVBRUUsOEVBRkYsRUFHRSxnRUFIRixFQUlFLHdEQUpGLEVBS0Usa0RBTEYsRUFNRSxrREFORixFQU9FLGtDQVBGLEVBUUUsZ0RBUkYsRUFTRSwwQkFURixFQVVFLDRCQVZGLEVBV0UsNENBWEYsRUFZRSxvQ0FaRixFQWFFOztFQUVGLFVBQUEsR0FBYTs7RUFFUDs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOztJQUNBLFVBQUMsQ0FBQSxhQUFELEdBQWdCOzt5QkFDaEIsSUFBQSxHQUFNOzt5QkFDTixZQUFBLEdBQWM7O3lCQUNkLFVBQUEsR0FBWTs7eUJBQ1osZUFBQSxHQUFpQjs7SUFFakIsVUFBQyxDQUFBLGVBQUQsR0FBa0IsU0FBQTtNQUNoQixJQUFDLENBQUEsYUFBRCxDQUFlLEdBQUEsR0FBTSxJQUFDLENBQUEsSUFBdEIsRUFBNEIsS0FBNUI7YUFDQSxJQUFDLENBQUEsYUFBRCxDQUFlLE9BQUEsR0FBVSxJQUFDLENBQUEsSUFBMUIsRUFBZ0MsSUFBaEM7SUFGZ0I7O0lBSWxCLFVBQUMsQ0FBQSxpQ0FBRCxHQUFvQyxTQUFBO01BQ2xDLElBQUMsQ0FBQSxhQUFELENBQWUsR0FBQSxHQUFNLElBQUMsQ0FBQSxJQUFQLEdBQWMsaUJBQTdCLEVBQWdELEtBQWhELEVBQXVELElB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OzBCQUVaLFFBQUEsR0FBVSxTQUFDLFNBQUQ7QUFHUixVQUFBO01BQUEsV0FBQSxHQUFjLHFCQUFBLENBQXNCLElBQUMsQ0FBQSxNQUF2QjtNQUNkLElBQUcsV0FBVyxDQUFDLE9BQVosQ0FBQSxDQUFBLEdBQXdCLElBQUMsQ0FBQSxNQUFNLENBQUMsY0FBUixDQUFBLENBQTNCO2VBQ0UsV0FBVyxDQUFDLFNBQVosQ0FBc0IsQ0FBQyxDQUFDLENBQUYsRUFBSyxDQUFMLENBQXRCLEVBQStCLENBQUMsQ0FBQyxDQUFGLEVBQUssQ0FBTCxDQUEvQixFQURGO09BQUEsTUFBQTtlQUdFLFlBSEY7O0lBSlE7Ozs7S0FMYztBQXpyQjFCIiwic291cmNlc0NvbnRlbnQiOlsie1JhbmdlLCBQb2ludH0gPSByZXF1aXJlICdhdG9tJ1xuXyA9IHJlcXVpcmUgJ3VuZGVyc2NvcmUtcGx1cydcblxuIyBbVE9ET10gTmVlZCBvdmVyaGF1bFxuIyAgLSBbIF0gTWFrZSBleHBhbmRhYmxlIGJ5IHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLnVuaW9uKEBnZXRSYW5nZShzZWxlY3Rpb24pKVxuIyAgLSBbIF0gQ291bnQgc3VwcG9ydChwcmlvcml0eSBsb3cpP1xuQmFzZSA9IHJlcXVpcmUgJy4vYmFzZSdcbntcbiAgZ2V0TGluZVRleHRUb0J1ZmZlclBvc2l0aW9uXG4gIGdldENvZGVGb2xkUm93UmFuZ2VzQ29udGFpbmVzRm9yUm93XG4gIGlzSW5jbHVkZUZ1bmN0aW9uU2NvcGVGb3JSb3dcbiAgZXhwYW5kUmFuZ2VUb1doaXRlU3BhY2VzXG4gIGdldFZpc2libGVCdWZmZXJSYW5nZVxuICB0cmFuc2xhdGVQb2ludEFuZENsaXBcbiAgZ2V0QnVmZmVyUm93c1xuICBnZXRWYWxpZFZpbUJ1ZmZlclJvd1xuICB0cmltUmFuZ2VcbiAgc29ydFJhbmdlc1xuICBwb2ludElzQXRFbmRPZkxpbmVcbiAgc3BsaXRBcmd1bWVudHNcbiAgdHJhdmVyc2VUZXh0RnJvbVBvaW50XG59ID0gcmVxdWlyZSAnLi91dGlscydcblBhaXJGaW5kZXIgPSBudWxsXG5cbmNsYXNzIFRleHRPYmplY3QgZXh0ZW5kcyBCYXNlXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBvcGVyYXRpb25LaW5kOiAndGV4dC1vYmplY3QnXG4gIHdpc2U6ICdjaGFyYWN0ZXJ3aXNlJ1xuICBzdXBwb3J0Q291bnQ6IGZhbHNlICMgRklYTUUgIzQ3MiwgIzY2XG4gIHNlbGVjdE9uY2U6IGZhbHNlXG4gIHNlbGVjdFN1Y2NlZWRlZDogZmFsc2VcblxuICBAZGVyaXZlSW5uZXJBbmRBOiAtPlxuICAgIEBnZW5lcmF0ZUNsYXNzKFwiQVwiICsgQG5hbWUsIGZhbHNlKVxuICAgIEBnZW5lcmF0ZUNsYXNzKFwiSW5uZXJcIiArIEBuYW1lLCB0cnVlKVxuXG4gIEBkZXJpdmVJbm5lckFuZEFGb3JBbGxvd0ZvcndhcmRpbmc6IC0+XG4gICAgQGdlbmVyYXRlQ2xhc3MoXCJBXCIgKyBAbmFtZSArIFwiQWxsb3dGb3J3YXJkaW5nXCIsIGZhbHNlLCB0cnVlKVxuICAgIEBnZW5lcmF0ZUNsYXNzKFwiSW5uZXJcIiArIEBuYW1lICsgXCJBbGxvd0ZvcndhcmRpbmdcIiwgdHJ1ZSwgdHJ1ZSlcblxuICBAZ2VuZXJhdGVDbGFzczogKGtsYXNzTmFtZSwgaW5uZXIsIGFsbG93Rm9yd2FyZGluZykgLT5cbiAgICBrbGFzcyA9IGNsYXNzIGV4dGVuZHMgdGhpc1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSBrbGFzcywgJ25hbWUnLCBnZXQ6IC0+IGtsYXNzTmFtZVxuICAgIGtsYXNzOjppbm5lciA9IGlubmVyXG4gICAga2xhc3M6OmFsbG93Rm9yd2FyZGluZyA9IHRydWUgaWYgYWxsb3dGb3J3YXJkaW5nXG4gICAga2xhc3MuZXh0ZW5kKClcblxuICBjb25zdHJ1Y3RvcjogLT5cbiAgICBzdXBlclxuICAgIEBpbml0aWFsaXplKClcblxuICBpc0lubmVyOiAtPlxuICAgIEBpbm5lclxuXG4gIGlzQTogLT5cbiAgICBub3QgQGlubmVyXG5cbiAgaXNMaW5ld2lzZTogLT4gQHdpc2UgaXMgJ2xpbmV3aXNlJ1xuICBpc0Jsb2Nrd2lzZTogLT4gQHdpc2UgaXMgJ2Jsb2Nrd2lzZSdcblxuICBmb3JjZVdpc2U6ICh3aXNlKSAtPlxuICAgIEB3aXNlID0gd2lzZSAjIEZJWE1FIGN1cnJlbnRseSBub3Qgd2VsbCBzdXBwb3J0ZWRcblxuICByZXNldFN0YXRlOiAtPlxuICAgIEBzZWxlY3RTdWNjZWVkZWQgPSBmYWxzZVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgIyBXaGVubmV2ZXIgVGV4dE9iamVjdCBpcyBleGVjdXRlZCwgaXQgaGFzIEBvcGVyYXRvclxuICAgICMgQ2FsbGVkIGZyb20gT3BlcmF0b3I6OnNlbGVjdFRhcmdldCgpXG4gICAgIyAgLSBgdiBpIHBgLCBpcyBgU2VsZWN0SW5WaXN1YWxNb2RlYCBvcGVyYXRvciB3aXRoIEB0YXJnZXQgPSBgSW5uZXJQYXJhZ3JhcGhgLlxuICAgICMgIC0gYGQgaSBwYCwgaXMgYERlbGV0ZWAgb3BlcmF0b3Igd2l0aCBAdGFyZ2V0ID0gYElubmVyUGFyYWdyYXBoYC5cbiAgICBpZiBAb3BlcmF0b3I/XG4gICAgICBAc2VsZWN0KClcbiAgICBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2luIFRleHRPYmplY3Q6IE11c3Qgbm90IGhhcHBlbicpXG5cbiAgc2VsZWN0OiAtPlxuICAgIGlmIEBpc01vZGUoJ3Zpc3VhbCcsICdibG9ja3dpc2UnKVxuICAgICAgQHN3cmFwLm5vcm1hbGl6ZShAZWRpdG9yKVxuXG4gICAgQGNvdW50VGltZXMgQGdldENvdW50KCksICh7c3RvcH0pID0+XG4gICAgICBzdG9wKCkgdW5sZXNzIEBzdXBwb3J0Q291bnQgIyBxdWljay1maXggZm9yICM1NjBcbiAgICAgIGZvciBzZWxlY3Rpb24gaW4gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgb2xkUmFuZ2UgPSBzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKVxuICAgICAgICBpZiBAc2VsZWN0VGV4dE9iamVjdChzZWxlY3Rpb24pXG4gICAgICAgICAgQHNlbGVjdFN1Y2NlZWRlZCA9IHRydWVcbiAgICAgICAgc3RvcCgpIGlmIHNlbGVjdGlvbi5nZXRCdWZmZXJSYW5nZSgpLmlzRXF1YWwob2xkUmFuZ2UpXG4gICAgICAgIGJyZWFrIGlmIEBzZWxlY3RPbmNlXG5cbiAgICBAZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgIyBTb21lIFRleHRPYmplY3QncyB3aXNlIGlzIE5PVCBkZXRlcm1pbmlzdGljLiBJdCBoYXMgdG8gYmUgZGV0ZWN0ZWQgZnJvbSBzZWxlY3RlZCByYW5nZS5cbiAgICBAd2lzZSA/PSBAc3dyYXAuZGV0ZWN0V2lzZShAZWRpdG9yKVxuXG4gICAgaWYgQG9wZXJhdG9yLmluc3RhbmNlb2YoXCJTZWxlY3RCYXNlXCIpXG4gICAgICBpZiBAc2VsZWN0U3VjY2VlZGVkXG4gICAgICAgIHN3aXRjaCBAd2lzZVxuICAgICAgICAgIHdoZW4gJ2NoYXJhY3Rlcndpc2UnXG4gICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKCkgZm9yICRzZWxlY3Rpb24gaW4gQHN3cmFwLmdldFNlbGVjdGlvbnMoQGVkaXRvcilcbiAgICAgICAgICB3aGVuICdsaW5ld2lzZSdcbiAgICAgICAgICAgICMgV2hlbiB0YXJnZXQgaXMgcGVyc2lzdGVudC1zZWxlY3Rpb24sIG5ldyBzZWxlY3Rpb24gaXMgYWRkZWQgYWZ0ZXIgc2VsZWN0VGV4dE9iamVjdC5cbiAgICAgICAgICAgICMgU28gd2UgaGF2ZSB0byBhc3N1cmUgYWxsIHNlbGVjdGlvbiBoYXZlIHNlbGN0aW9uIHByb3BlcnR5LlxuICAgICAgICAgICAgIyBNYXliZSB0aGlzIGxvZ2ljIGNhbiBiZSBtb3ZlZCB0byBvcGVyYXRpb24gc3RhY2suXG4gICAgICAgICAgICBmb3IgJHNlbGVjdGlvbiBpbiBAc3dyYXAuZ2V0U2VsZWN0aW9ucyhAZWRpdG9yKVxuICAgICAgICAgICAgICBpZiBAZ2V0Q29uZmlnKCdzdGF5T25TZWxlY3RUZXh0T2JqZWN0JylcbiAgICAgICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKCkgdW5sZXNzICRzZWxlY3Rpb24uaGFzUHJvcGVydGllcygpXG4gICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgICAgICAgICAgJHNlbGVjdGlvbi5maXhQcm9wZXJ0eVJvd1RvUm93UmFuZ2UoKVxuXG4gICAgICBpZiBAc3VibW9kZSBpcyAnYmxvY2t3aXNlJ1xuICAgICAgICBmb3IgJHNlbGVjdGlvbiBpbiBAc3dyYXAuZ2V0U2VsZWN0aW9ucyhAZWRpdG9yKVxuICAgICAgICAgICRzZWxlY3Rpb24ubm9ybWFsaXplKClcbiAgICAgICAgICAkc2VsZWN0aW9uLmFwcGx5V2lzZSgnYmxvY2t3aXNlJylcblxuICAjIFJldHVybiB0cnVlIG9yIGZhbHNlXG4gIHNlbGVjdFRleHRPYmplY3Q6IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgcmFuZ2UgPSBAZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgQHN3cmFwKHNlbGVjdGlvbikuc2V0QnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICByZXR1cm4gdHJ1ZVxuXG4gICMgdG8gb3ZlcnJpZGVcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgbnVsbFxuXG4jIFNlY3Rpb246IFdvcmRcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgV29yZCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcG9pbnQgPSBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIHtyYW5nZX0gPSBAZ2V0V29yZEJ1ZmZlclJhbmdlQW5kS2luZEF0QnVmZmVyUG9zaXRpb24ocG9pbnQsIHtAd29yZFJlZ2V4fSlcbiAgICBpZiBAaXNBKClcbiAgICAgIGV4cGFuZFJhbmdlVG9XaGl0ZVNwYWNlcyhAZWRpdG9yLCByYW5nZSlcbiAgICBlbHNlXG4gICAgICByYW5nZVxuXG5jbGFzcyBXaG9sZVdvcmQgZXh0ZW5kcyBXb3JkXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICB3b3JkUmVnZXg6IC9cXFMrL1xuXG4jIEp1c3QgaW5jbHVkZSBfLCAtXG5jbGFzcyBTbWFydFdvcmQgZXh0ZW5kcyBXb3JkXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVzY3JpcHRpb246IFwiQSB3b3JkIHRoYXQgY29uc2lzdHMgb2YgYWxwaGFudW1lcmljIGNoYXJzKGAvW0EtWmEtejAtOV9dL2ApIGFuZCBoeXBoZW4gYC1gXCJcbiAgd29yZFJlZ2V4OiAvW1xcdy1dKy9cblxuIyBKdXN0IGluY2x1ZGUgXywgLVxuY2xhc3MgU3Vid29yZCBleHRlbmRzIFdvcmRcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIEB3b3JkUmVnZXggPSBzZWxlY3Rpb24uY3Vyc29yLnN1YndvcmRSZWdFeHAoKVxuICAgIHN1cGVyXG5cbiMgU2VjdGlvbjogUGFpclxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBQYWlyIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBzdXBwb3J0Q291bnQ6IHRydWVcbiAgYWxsb3dOZXh0TGluZTogbnVsbFxuICBhZGp1c3RJbm5lclJhbmdlOiB0cnVlXG4gIHBhaXI6IG51bGxcbiAgaW5jbHVzaXZlOiB0cnVlXG5cbiAgaW5pdGlhbGl6ZTogLT5cbiAgICBQYWlyRmluZGVyID89IHJlcXVpcmUgJy4vcGFpci1maW5kZXInXG4gICAgc3VwZXJcblxuXG4gIGlzQWxsb3dOZXh0TGluZTogLT5cbiAgICBAYWxsb3dOZXh0TGluZSA/IChAcGFpcj8gYW5kIEBwYWlyWzBdIGlzbnQgQHBhaXJbMV0pXG5cbiAgYWRqdXN0UmFuZ2U6ICh7c3RhcnQsIGVuZH0pIC0+XG4gICAgIyBEaXJ0eSB3b3JrIHRvIGZlZWwgbmF0dXJhbCBmb3IgaHVtYW4sIHRvIGJlaGF2ZSBjb21wYXRpYmxlIHdpdGggcHVyZSBWaW0uXG4gICAgIyBXaGVyZSB0aGlzIGFkanVzdG1lbnQgYXBwZWFyIGlzIGluIGZvbGxvd2luZyBzaXR1YXRpb24uXG4gICAgIyBvcC0xOiBgY2l7YCByZXBsYWNlIG9ubHkgMm5kIGxpbmVcbiAgICAjIG9wLTI6IGBkaXtgIGRlbGV0ZSBvbmx5IDJuZCBsaW5lLlxuICAgICMgdGV4dDpcbiAgICAjICB7XG4gICAgIyAgICBhYWFcbiAgICAjICB9XG4gICAgaWYgcG9pbnRJc0F0RW5kT2ZMaW5lKEBlZGl0b3IsIHN0YXJ0KVxuICAgICAgc3RhcnQgPSBzdGFydC50cmF2ZXJzZShbMSwgMF0pXG5cbiAgICBpZiBnZXRMaW5lVGV4dFRvQnVmZmVyUG9zaXRpb24oQGVkaXRvciwgZW5kKS5tYXRjaCgvXlxccyokLylcbiAgICAgIGlmIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICAgICMgVGhpcyBpcyBzbGlnaHRseSBpbm5jb25zaXN0ZW50IHdpdGggcmVndWxhciBWaW1cbiAgICAgICAgIyAtIHJlZ3VsYXIgVmltOiBzZWxlY3QgbmV3IGxpbmUgYWZ0ZXIgRU9MXG4gICAgICAgICMgLSB2aW0tbW9kZS1wbHVzOiBzZWxlY3QgdG8gRU9MKGJlZm9yZSBuZXcgbGluZSlcbiAgICAgICAgIyBUaGlzIGlzIGludGVudGlvbmFsIHNpbmNlIHRvIG1ha2Ugc3VibW9kZSBgY2hhcmFjdGVyd2lzZWAgd2hlbiBhdXRvLWRldGVjdCBzdWJtb2RlXG4gICAgICAgICMgaW5uZXJFbmQgPSBuZXcgUG9pbnQoaW5uZXJFbmQucm93IC0gMSwgSW5maW5pdHkpXG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93IC0gMSwgSW5maW5pdHkpXG4gICAgICBlbHNlXG4gICAgICAgIGVuZCA9IG5ldyBQb2ludChlbmQucm93LCAwKVxuXG4gICAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG5cbiAgZ2V0RmluZGVyOiAtPlxuICAgIG9wdGlvbnMgPSB7YWxsb3dOZXh0TGluZTogQGlzQWxsb3dOZXh0TGluZSgpLCBAYWxsb3dGb3J3YXJkaW5nLCBAcGFpciwgQGluY2x1c2l2ZX1cbiAgICBpZiBAcGFpclswXSBpcyBAcGFpclsxXVxuICAgICAgbmV3IFBhaXJGaW5kZXIuUXVvdGVGaW5kZXIoQGVkaXRvciwgb3B0aW9ucylcbiAgICBlbHNlXG4gICAgICBuZXcgUGFpckZpbmRlci5CcmFja2V0RmluZGVyKEBlZGl0b3IsIG9wdGlvbnMpXG5cbiAgZ2V0UGFpckluZm86IChmcm9tKSAtPlxuICAgIHBhaXJJbmZvID0gQGdldEZpbmRlcigpLmZpbmQoZnJvbSlcbiAgICB1bmxlc3MgcGFpckluZm8/XG4gICAgICByZXR1cm4gbnVsbFxuICAgIHBhaXJJbmZvLmlubmVyUmFuZ2UgPSBAYWRqdXN0UmFuZ2UocGFpckluZm8uaW5uZXJSYW5nZSkgaWYgQGFkanVzdElubmVyUmFuZ2VcbiAgICBwYWlySW5mby50YXJnZXRSYW5nZSA9IGlmIEBpc0lubmVyKCkgdGhlbiBwYWlySW5mby5pbm5lclJhbmdlIGVsc2UgcGFpckluZm8uYVJhbmdlXG4gICAgcGFpckluZm9cblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBwYWlySW5mbyA9IEBnZXRQYWlySW5mbyhAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKSlcbiAgICAjIFdoZW4gcmFuZ2Ugd2FzIHNhbWUsIHRyeSB0byBleHBhbmQgcmFuZ2VcbiAgICBpZiBwYWlySW5mbz8udGFyZ2V0UmFuZ2UuaXNFcXVhbChvcmlnaW5hbFJhbmdlKVxuICAgICAgcGFpckluZm8gPSBAZ2V0UGFpckluZm8ocGFpckluZm8uYVJhbmdlLmVuZClcbiAgICBwYWlySW5mbz8udGFyZ2V0UmFuZ2VcblxuIyBVc2VkIGJ5IERlbGV0ZVN1cnJvdW5kXG5jbGFzcyBBUGFpciBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcblxuY2xhc3MgQW55UGFpciBleHRlbmRzIFBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIGFsbG93Rm9yd2FyZGluZzogZmFsc2VcbiAgbWVtYmVyOiBbXG4gICAgJ0RvdWJsZVF1b3RlJywgJ1NpbmdsZVF1b3RlJywgJ0JhY2tUaWNrJyxcbiAgICAnQ3VybHlCcmFja2V0JywgJ0FuZ2xlQnJhY2tldCcsICdTcXVhcmVCcmFja2V0JywgJ1BhcmVudGhlc2lzJ1xuICBdXG5cbiAgZ2V0UmFuZ2VzOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBtZW1iZXJcbiAgICAgIC5tYXAgKGtsYXNzKSA9PiBAbmV3KGtsYXNzLCB7QGlubmVyLCBAYWxsb3dGb3J3YXJkaW5nLCBAaW5jbHVzaXZlfSkuZ2V0UmFuZ2Uoc2VsZWN0aW9uKVxuICAgICAgLmZpbHRlciAocmFuZ2UpIC0+IHJhbmdlP1xuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIF8ubGFzdChzb3J0UmFuZ2VzKEBnZXRSYW5nZXMoc2VsZWN0aW9uKSkpXG5cbmNsYXNzIEFueVBhaXJBbGxvd0ZvcndhcmRpbmcgZXh0ZW5kcyBBbnlQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVzY3JpcHRpb246IFwiUmFuZ2Ugc3Vycm91bmRlZCBieSBhdXRvLWRldGVjdGVkIHBhaXJlZCBjaGFycyBmcm9tIGVuY2xvc2VkIGFuZCBmb3J3YXJkaW5nIGFyZWFcIlxuICBhbGxvd0ZvcndhcmRpbmc6IHRydWVcbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2VzID0gQGdldFJhbmdlcyhzZWxlY3Rpb24pXG4gICAgZnJvbSA9IHNlbGVjdGlvbi5jdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgIFtmb3J3YXJkaW5nUmFuZ2VzLCBlbmNsb3NpbmdSYW5nZXNdID0gXy5wYXJ0aXRpb24gcmFuZ2VzLCAocmFuZ2UpIC0+XG4gICAgICByYW5nZS5zdGFydC5pc0dyZWF0ZXJUaGFuT3JFcXVhbChmcm9tKVxuICAgIGVuY2xvc2luZ1JhbmdlID0gXy5sYXN0KHNvcnRSYW5nZXMoZW5jbG9zaW5nUmFuZ2VzKSlcbiAgICBmb3J3YXJkaW5nUmFuZ2VzID0gc29ydFJhbmdlcyhmb3J3YXJkaW5nUmFuZ2VzKVxuXG4gICAgIyBXaGVuIGVuY2xvc2luZ1JhbmdlIGlzIGV4aXN0cyxcbiAgICAjIFdlIGRvbid0IGdvIGFjcm9zcyBlbmNsb3NpbmdSYW5nZS5lbmQuXG4gICAgIyBTbyBjaG9vc2UgZnJvbSByYW5nZXMgY29udGFpbmVkIGluIGVuY2xvc2luZ1JhbmdlLlxuICAgIGlmIGVuY2xvc2luZ1JhbmdlXG4gICAgICBmb3J3YXJkaW5nUmFuZ2VzID0gZm9yd2FyZGluZ1Jhbmdlcy5maWx0ZXIgKHJhbmdlKSAtPlxuICAgICAgICBlbmNsb3NpbmdSYW5nZS5jb250YWluc1JhbmdlKHJhbmdlKVxuXG4gICAgZm9yd2FyZGluZ1Jhbmdlc1swXSBvciBlbmNsb3NpbmdSYW5nZVxuXG5jbGFzcyBBbnlRdW90ZSBleHRlbmRzIEFueVBhaXJcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBtZW1iZXI6IFsnRG91YmxlUXVvdGUnLCAnU2luZ2xlUXVvdGUnLCAnQmFja1RpY2snXVxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByYW5nZXMgPSBAZ2V0UmFuZ2VzKHNlbGVjdGlvbilcbiAgICAjIFBpY2sgcmFuZ2Ugd2hpY2ggZW5kLmNvbHVtIGlzIGxlZnRtb3N0KG1lYW4sIGNsb3NlZCBmaXJzdClcbiAgICBfLmZpcnN0KF8uc29ydEJ5KHJhbmdlcywgKHIpIC0+IHIuZW5kLmNvbHVtbikpIGlmIHJhbmdlcy5sZW5ndGhcblxuY2xhc3MgUXVvdGUgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuXG5jbGFzcyBEb3VibGVRdW90ZSBleHRlbmRzIFF1b3RlXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBwYWlyOiBbJ1wiJywgJ1wiJ11cblxuY2xhc3MgU2luZ2xlUXVvdGUgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgcGFpcjogW1wiJ1wiLCBcIidcIl1cblxuY2xhc3MgQmFja1RpY2sgZXh0ZW5kcyBRdW90ZVxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgcGFpcjogWydgJywgJ2AnXVxuXG5jbGFzcyBDdXJseUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKClcbiAgcGFpcjogWyd7JywgJ30nXVxuXG5jbGFzcyBTcXVhcmVCcmFja2V0IGV4dGVuZHMgUGFpclxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgQGRlcml2ZUlubmVyQW5kQUZvckFsbG93Rm9yd2FyZGluZygpXG4gIHBhaXI6IFsnWycsICddJ11cblxuY2xhc3MgUGFyZW50aGVzaXMgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKClcbiAgcGFpcjogWycoJywgJyknXVxuXG5jbGFzcyBBbmdsZUJyYWNrZXQgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBAZGVyaXZlSW5uZXJBbmRBRm9yQWxsb3dGb3J3YXJkaW5nKClcbiAgcGFpcjogWyc8JywgJz4nXVxuXG5jbGFzcyBUYWcgZXh0ZW5kcyBQYWlyXG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICBhbGxvd05leHRMaW5lOiB0cnVlXG4gIGFsbG93Rm9yd2FyZGluZzogdHJ1ZVxuICBhZGp1c3RJbm5lclJhbmdlOiBmYWxzZVxuXG4gIGdldFRhZ1N0YXJ0UG9pbnQ6IChmcm9tKSAtPlxuICAgIHRhZ1JhbmdlID0gbnVsbFxuICAgIHBhdHRlcm4gPSBQYWlyRmluZGVyLlRhZ0ZpbmRlci5wYXR0ZXJuXG4gICAgQHNjYW5Gb3J3YXJkIHBhdHRlcm4sIHtmcm9tOiBbZnJvbS5yb3csIDBdfSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBpZiByYW5nZS5jb250YWluc1BvaW50KGZyb20sIHRydWUpXG4gICAgICAgIHRhZ1JhbmdlID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgdGFnUmFuZ2U/LnN0YXJ0XG5cbiAgZ2V0RmluZGVyOiAtPlxuICAgIG5ldyBQYWlyRmluZGVyLlRhZ0ZpbmRlcihAZWRpdG9yLCB7YWxsb3dOZXh0TGluZTogQGlzQWxsb3dOZXh0TGluZSgpLCBAYWxsb3dGb3J3YXJkaW5nLCBAaW5jbHVzaXZlfSlcblxuICBnZXRQYWlySW5mbzogKGZyb20pIC0+XG4gICAgc3VwZXIoQGdldFRhZ1N0YXJ0UG9pbnQoZnJvbSkgPyBmcm9tKVxuXG4jIFNlY3Rpb246IFBhcmFncmFwaFxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG4jIFBhcmFncmFwaCBpcyBkZWZpbmVkIGFzIGNvbnNlY3V0aXZlIChub24tKWJsYW5rLWxpbmUuXG5jbGFzcyBQYXJhZ3JhcGggZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIHN1cHBvcnRDb3VudDogdHJ1ZVxuXG4gIGZpbmRSb3c6IChmcm9tUm93LCBkaXJlY3Rpb24sIGZuKSAtPlxuICAgIGZuLnJlc2V0PygpXG4gICAgZm91bmRSb3cgPSBmcm9tUm93XG4gICAgZm9yIHJvdyBpbiBnZXRCdWZmZXJSb3dzKEBlZGl0b3IsIHtzdGFydFJvdzogZnJvbVJvdywgZGlyZWN0aW9ufSlcbiAgICAgIGJyZWFrIHVubGVzcyBmbihyb3csIGRpcmVjdGlvbilcbiAgICAgIGZvdW5kUm93ID0gcm93XG5cbiAgICBmb3VuZFJvd1xuXG4gIGZpbmRSb3dSYW5nZUJ5OiAoZnJvbVJvdywgZm4pIC0+XG4gICAgc3RhcnRSb3cgPSBAZmluZFJvdyhmcm9tUm93LCAncHJldmlvdXMnLCBmbilcbiAgICBlbmRSb3cgPSBAZmluZFJvdyhmcm9tUm93LCAnbmV4dCcsIGZuKVxuICAgIFtzdGFydFJvdywgZW5kUm93XVxuXG4gIGdldFByZWRpY3RGdW5jdGlvbjogKGZyb21Sb3csIHNlbGVjdGlvbikgLT5cbiAgICBmcm9tUm93UmVzdWx0ID0gQGVkaXRvci5pc0J1ZmZlclJvd0JsYW5rKGZyb21Sb3cpXG5cbiAgICBpZiBAaXNJbm5lcigpXG4gICAgICBwcmVkaWN0ID0gKHJvdywgZGlyZWN0aW9uKSA9PlxuICAgICAgICBAZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KSBpcyBmcm9tUm93UmVzdWx0XG4gICAgZWxzZVxuICAgICAgaWYgc2VsZWN0aW9uLmlzUmV2ZXJzZWQoKVxuICAgICAgICBkaXJlY3Rpb25Ub0V4dGVuZCA9ICdwcmV2aW91cydcbiAgICAgIGVsc2VcbiAgICAgICAgZGlyZWN0aW9uVG9FeHRlbmQgPSAnbmV4dCdcblxuICAgICAgZmxpcCA9IGZhbHNlXG4gICAgICBwcmVkaWN0ID0gKHJvdywgZGlyZWN0aW9uKSA9PlxuICAgICAgICByZXN1bHQgPSBAZWRpdG9yLmlzQnVmZmVyUm93Qmxhbmsocm93KSBpcyBmcm9tUm93UmVzdWx0XG4gICAgICAgIGlmIGZsaXBcbiAgICAgICAgICBub3QgcmVzdWx0XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBpZiAobm90IHJlc3VsdCkgYW5kIChkaXJlY3Rpb24gaXMgZGlyZWN0aW9uVG9FeHRlbmQpXG4gICAgICAgICAgICBmbGlwID0gdHJ1ZVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICByZXN1bHRcblxuICAgICAgcHJlZGljdC5yZXNldCA9IC0+XG4gICAgICAgIGZsaXAgPSBmYWxzZVxuICAgIHByZWRpY3RcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBmcm9tUm93ID0gQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikucm93XG4gICAgaWYgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICAgIGlmIHNlbGVjdGlvbi5pc1JldmVyc2VkKClcbiAgICAgICAgZnJvbVJvdy0tXG4gICAgICBlbHNlXG4gICAgICAgIGZyb21Sb3crK1xuICAgICAgZnJvbVJvdyA9IGdldFZhbGlkVmltQnVmZmVyUm93KEBlZGl0b3IsIGZyb21Sb3cpXG5cbiAgICByb3dSYW5nZSA9IEBmaW5kUm93UmFuZ2VCeShmcm9tUm93LCBAZ2V0UHJlZGljdEZ1bmN0aW9uKGZyb21Sb3csIHNlbGVjdGlvbikpXG4gICAgc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkudW5pb24oQGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2Uocm93UmFuZ2UpKVxuXG5jbGFzcyBJbmRlbnRhdGlvbiBleHRlbmRzIFBhcmFncmFwaFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICBmcm9tUm93ID0gQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbikucm93XG5cbiAgICBiYXNlSW5kZW50TGV2ZWwgPSBAZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coZnJvbVJvdylcbiAgICBwcmVkaWN0ID0gKHJvdykgPT5cbiAgICAgIGlmIEBlZGl0b3IuaXNCdWZmZXJSb3dCbGFuayhyb3cpXG4gICAgICAgIEBpc0EoKVxuICAgICAgZWxzZVxuICAgICAgICBAZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3cocm93KSA+PSBiYXNlSW5kZW50TGV2ZWxcblxuICAgIHJvd1JhbmdlID0gQGZpbmRSb3dSYW5nZUJ5KGZyb21Sb3csIHByZWRpY3QpXG4gICAgQGdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2Uocm93UmFuZ2UpXG5cbiMgU2VjdGlvbjogQ29tbWVudFxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBDb21tZW50IGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJvdyA9IEBnZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbihzZWxlY3Rpb24pLnJvd1xuICAgIHJvd1JhbmdlID0gQGVkaXRvci5sYW5ndWFnZU1vZGUucm93UmFuZ2VGb3JDb21tZW50QXRCdWZmZXJSb3cocm93KVxuICAgIHJvd1JhbmdlID89IFtyb3csIHJvd10gaWYgQGVkaXRvci5pc0J1ZmZlclJvd0NvbW1lbnRlZChyb3cpXG4gICAgaWYgcm93UmFuZ2U/XG4gICAgICBAZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShyb3dSYW5nZSlcblxuY2xhc3MgQ29tbWVudE9yUGFyYWdyYXBoIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIGZvciBrbGFzcyBpbiBbJ0NvbW1lbnQnLCAnUGFyYWdyYXBoJ11cbiAgICAgIGlmIHJhbmdlID0gQG5ldyhrbGFzcywge0Bpbm5lcn0pLmdldFJhbmdlKHNlbGVjdGlvbilcbiAgICAgICAgcmV0dXJuIHJhbmdlXG5cbiMgU2VjdGlvbjogRm9sZFxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBGb2xkIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuXG4gIGFkanVzdFJvd1JhbmdlOiAocm93UmFuZ2UpIC0+XG4gICAgcmV0dXJuIHJvd1JhbmdlIGlmIEBpc0EoKVxuXG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gcm93UmFuZ2VcbiAgICBpZiBAZ2V0SW5kZW50TGV2ZWxGb3JCdWZmZXJSb3coc3RhcnRSb3cpIGlzIEBnZXRJbmRlbnRMZXZlbEZvckJ1ZmZlclJvdyhlbmRSb3cpXG4gICAgICBlbmRSb3cgLT0gMVxuICAgIHN0YXJ0Um93ICs9IDFcbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuICBnZXRGb2xkUm93UmFuZ2VzQ29udGFpbnNGb3JSb3c6IChyb3cpIC0+XG4gICAgZ2V0Q29kZUZvbGRSb3dSYW5nZXNDb250YWluZXNGb3JSb3coQGVkaXRvciwgcm93KS5yZXZlcnNlKClcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByb3cgPSBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICBzZWxlY3RlZFJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICBmb3Igcm93UmFuZ2UgaW4gQGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdyhyb3cpXG4gICAgICByYW5nZSA9IEBnZXRCdWZmZXJSYW5nZUZvclJvd1JhbmdlKEBhZGp1c3RSb3dSYW5nZShyb3dSYW5nZSkpXG5cbiAgICAgICMgRG9uJ3QgY2hhbmdlIHRvIGBpZiByYW5nZS5jb250YWluc1JhbmdlKHNlbGVjdGVkUmFuZ2UsIHRydWUpYFxuICAgICAgIyBUaGVyZSBpcyBiZWhhdmlvciBkaWZmIHdoZW4gY3Vyc29yIGlzIGF0IGJlZ2lubmluZyBvZiBsaW5lKCBjb2x1bW4gMCApLlxuICAgICAgdW5sZXNzIHNlbGVjdGVkUmFuZ2UuY29udGFpbnNSYW5nZShyYW5nZSlcbiAgICAgICAgcmV0dXJuIHJhbmdlXG5cbiMgTk9URTogRnVuY3Rpb24gcmFuZ2UgZGV0ZXJtaW5hdGlvbiBpcyBkZXBlbmRpbmcgb24gZm9sZC5cbmNsYXNzIEZ1bmN0aW9uIGV4dGVuZHMgRm9sZFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgIyBTb21lIGxhbmd1YWdlIGRvbid0IGluY2x1ZGUgY2xvc2luZyBgfWAgaW50byBmb2xkLlxuICBzY29wZU5hbWVzT21pdHRpbmdFbmRSb3c6IFsnc291cmNlLmdvJywgJ3NvdXJjZS5lbGl4aXInXVxuXG4gIGlzR3JhbW1hck5vdEZvbGRFbmRSb3c6IC0+XG4gICAge3Njb3BlTmFtZSwgcGFja2FnZU5hbWV9ID0gQGVkaXRvci5nZXRHcmFtbWFyKClcbiAgICBpZiBzY29wZU5hbWUgaW4gQHNjb3BlTmFtZXNPbWl0dGluZ0VuZFJvd1xuICAgICAgdHJ1ZVxuICAgIGVsc2VcbiAgICAgICMgSEFDSzogUnVzdCBoYXZlIHR3byBwYWNrYWdlIGBsYW5ndWFnZS1ydXN0YCBhbmQgYGF0b20tbGFuZ3VhZ2UtcnVzdGBcbiAgICAgICMgbGFuZ3VhZ2UtcnVzdCBkb24ndCBmb2xkIGVuZGluZyBgfWAsIGJ1dCBhdG9tLWxhbmd1YWdlLXJ1c3QgZG9lcy5cbiAgICAgIHNjb3BlTmFtZSBpcyAnc291cmNlLnJ1c3QnIGFuZCBwYWNrYWdlTmFtZSBpcyBcImxhbmd1YWdlLXJ1c3RcIlxuXG4gIGdldEZvbGRSb3dSYW5nZXNDb250YWluc0ZvclJvdzogKHJvdykgLT5cbiAgICAoc3VwZXIpLmZpbHRlciAocm93UmFuZ2UpID0+XG4gICAgICBpc0luY2x1ZGVGdW5jdGlvblNjb3BlRm9yUm93KEBlZGl0b3IsIHJvd1JhbmdlWzBdKVxuXG4gIGFkanVzdFJvd1JhbmdlOiAocm93UmFuZ2UpIC0+XG4gICAgW3N0YXJ0Um93LCBlbmRSb3ddID0gc3VwZXJcbiAgICAjIE5PVEU6IFRoaXMgYWRqdXN0bWVudCBzaG91ZCBub3QgYmUgbmVjZXNzYXJ5IGlmIGxhbmd1YWdlLXN5bnRheCBpcyBwcm9wZXJseSBkZWZpbmVkLlxuICAgIGlmIEBpc0EoKSBhbmQgQGlzR3JhbW1hck5vdEZvbGRFbmRSb3coKVxuICAgICAgZW5kUm93ICs9IDFcbiAgICBbc3RhcnRSb3csIGVuZFJvd11cblxuIyBTZWN0aW9uOiBPdGhlclxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBBcmd1bWVudHMgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIEBkZXJpdmVJbm5lckFuZEEoKVxuXG4gIG5ld0FyZ0luZm86IChhcmdTdGFydCwgYXJnLCBzZXBhcmF0b3IpIC0+XG4gICAgYXJnRW5kID0gdHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ1N0YXJ0LCBhcmcpXG4gICAgYXJnUmFuZ2UgPSBuZXcgUmFuZ2UoYXJnU3RhcnQsIGFyZ0VuZClcblxuICAgIHNlcGFyYXRvckVuZCA9IHRyYXZlcnNlVGV4dEZyb21Qb2ludChhcmdFbmQsIHNlcGFyYXRvciA/ICcnKVxuICAgIHNlcGFyYXRvclJhbmdlID0gbmV3IFJhbmdlKGFyZ0VuZCwgc2VwYXJhdG9yRW5kKVxuXG4gICAgaW5uZXJSYW5nZSA9IGFyZ1JhbmdlXG4gICAgYVJhbmdlID0gYXJnUmFuZ2UudW5pb24oc2VwYXJhdG9yUmFuZ2UpXG4gICAge2FyZ1JhbmdlLCBzZXBhcmF0b3JSYW5nZSwgaW5uZXJSYW5nZSwgYVJhbmdlfVxuXG4gIGdldEFyZ3VtZW50c1JhbmdlRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIG1lbWJlciA9IFtcbiAgICAgICdDdXJseUJyYWNrZXQnXG4gICAgICAnU3F1YXJlQnJhY2tldCdcbiAgICAgICdQYXJlbnRoZXNpcydcbiAgICBdXG4gICAgQG5ldyhcIklubmVyQW55UGFpclwiLCB7aW5jbHVzaXZlOiBmYWxzZSwgbWVtYmVyOiBtZW1iZXJ9KS5nZXRSYW5nZShzZWxlY3Rpb24pXG5cbiAgZ2V0UmFuZ2U6IChzZWxlY3Rpb24pIC0+XG4gICAgcmFuZ2UgPSBAZ2V0QXJndW1lbnRzUmFuZ2VGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIHBhaXJSYW5nZUZvdW5kID0gcmFuZ2U/XG4gICAgcmFuZ2UgPz0gQG5ldyhcIklubmVyQ3VycmVudExpbmVcIikuZ2V0UmFuZ2Uoc2VsZWN0aW9uKSAjIGZhbGxiYWNrXG4gICAgcmV0dXJuIHVubGVzcyByYW5nZVxuXG4gICAgcmFuZ2UgPSB0cmltUmFuZ2UoQGVkaXRvciwgcmFuZ2UpXG5cbiAgICB0ZXh0ID0gQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBhbGxUb2tlbnMgPSBzcGxpdEFyZ3VtZW50cyh0ZXh0LCBwYWlyUmFuZ2VGb3VuZClcblxuICAgIGFyZ0luZm9zID0gW11cbiAgICBhcmdTdGFydCA9IHJhbmdlLnN0YXJ0XG5cbiAgICAjIFNraXAgc3RhcnRpbmcgc2VwYXJhdG9yXG4gICAgaWYgYWxsVG9rZW5zLmxlbmd0aCBhbmQgYWxsVG9rZW5zWzBdLnR5cGUgaXMgJ3NlcGFyYXRvcidcbiAgICAgIHRva2VuID0gYWxsVG9rZW5zLnNoaWZ0KClcbiAgICAgIGFyZ1N0YXJ0ID0gdHJhdmVyc2VUZXh0RnJvbVBvaW50KGFyZ1N0YXJ0LCB0b2tlbi50ZXh0KVxuXG4gICAgd2hpbGUgYWxsVG9rZW5zLmxlbmd0aFxuICAgICAgdG9rZW4gPSBhbGxUb2tlbnMuc2hpZnQoKVxuICAgICAgaWYgdG9rZW4udHlwZSBpcyAnYXJndW1lbnQnXG4gICAgICAgIHNlcGFyYXRvciA9IGFsbFRva2Vucy5zaGlmdCgpPy50ZXh0XG4gICAgICAgIGFyZ0luZm8gPSBAbmV3QXJnSW5mbyhhcmdTdGFydCwgdG9rZW4udGV4dCwgc2VwYXJhdG9yKVxuXG4gICAgICAgIGlmIChhbGxUb2tlbnMubGVuZ3RoIGlzIDApIGFuZCAobGFzdEFyZ0luZm8gPSBfLmxhc3QoYXJnSW5mb3MpKVxuICAgICAgICAgIGFyZ0luZm8uYVJhbmdlID0gYXJnSW5mby5hcmdSYW5nZS51bmlvbihsYXN0QXJnSW5mby5zZXBhcmF0b3JSYW5nZSlcblxuICAgICAgICBhcmdTdGFydCA9IGFyZ0luZm8uYVJhbmdlLmVuZFxuICAgICAgICBhcmdJbmZvcy5wdXNoKGFyZ0luZm8pXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignbXVzdCBub3QgaGFwcGVuJylcblxuICAgIHBvaW50ID0gQGdldEN1cnNvclBvc2l0aW9uRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICBmb3Ige2lubmVyUmFuZ2UsIGFSYW5nZX0gaW4gYXJnSW5mb3NcbiAgICAgIGlmIGlubmVyUmFuZ2UuZW5kLmlzR3JlYXRlclRoYW5PckVxdWFsKHBvaW50KVxuICAgICAgICByZXR1cm4gaWYgQGlzSW5uZXIoKSB0aGVuIGlubmVyUmFuZ2UgZWxzZSBhUmFuZ2VcbiAgICBudWxsXG5cbmNsYXNzIEN1cnJlbnRMaW5lIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcblxuICBnZXRSYW5nZTogKHNlbGVjdGlvbikgLT5cbiAgICByb3cgPSBAZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKS5yb3dcbiAgICByYW5nZSA9IEBlZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3cocm93KVxuICAgIGlmIEBpc0EoKVxuICAgICAgcmFuZ2VcbiAgICBlbHNlXG4gICAgICB0cmltUmFuZ2UoQGVkaXRvciwgcmFuZ2UpXG5cbmNsYXNzIEVudGlyZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIHdpc2U6ICdsaW5ld2lzZSdcbiAgc2VsZWN0T25jZTogdHJ1ZVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBlZGl0b3IuYnVmZmVyLmdldFJhbmdlKClcblxuY2xhc3MgRW1wdHkgZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoZmFsc2UpXG4gIHNlbGVjdE9uY2U6IHRydWVcblxuY2xhc3MgTGF0ZXN0Q2hhbmdlIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgd2lzZTogbnVsbFxuICBzZWxlY3RPbmNlOiB0cnVlXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHN0YXJ0ID0gQHZpbVN0YXRlLm1hcmsuZ2V0KCdbJylcbiAgICBlbmQgPSBAdmltU3RhdGUubWFyay5nZXQoJ10nKVxuICAgIGlmIHN0YXJ0PyBhbmQgZW5kP1xuICAgICAgbmV3IFJhbmdlKHN0YXJ0LCBlbmQpXG5cbmNsYXNzIFNlYXJjaE1hdGNoRm9yd2FyZCBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZCgpXG4gIGJhY2t3YXJkOiBmYWxzZVxuXG4gIGZpbmRNYXRjaDogKGZyb21Qb2ludCwgcGF0dGVybikgLT5cbiAgICBmcm9tUG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgZnJvbVBvaW50LCBcImZvcndhcmRcIikgaWYgKEBtb2RlIGlzICd2aXN1YWwnKVxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBzY2FuRm9yd2FyZCBwYXR0ZXJuLCB7ZnJvbTogW2Zyb21Qb2ludC5yb3csIDBdfSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBpZiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbihmcm9tUG9pbnQpXG4gICAgICAgIGZvdW5kID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAge3JhbmdlOiBmb3VuZCwgd2hpY2hJc0hlYWQ6ICdlbmQnfVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgIHBhdHRlcm4gPSBAZ2xvYmFsU3RhdGUuZ2V0KCdsYXN0U2VhcmNoUGF0dGVybicpXG4gICAgcmV0dXJuIHVubGVzcyBwYXR0ZXJuP1xuXG4gICAgZnJvbVBvaW50ID0gc2VsZWN0aW9uLmdldEhlYWRCdWZmZXJQb3NpdGlvbigpXG4gICAge3JhbmdlLCB3aGljaElzSGVhZH0gPSBAZmluZE1hdGNoKGZyb21Qb2ludCwgcGF0dGVybilcbiAgICBpZiByYW5nZT9cbiAgICAgIEB1bmlvblJhbmdlQW5kRGV0ZXJtaW5lUmV2ZXJzZWRTdGF0ZShzZWxlY3Rpb24sIHJhbmdlLCB3aGljaElzSGVhZClcblxuICB1bmlvblJhbmdlQW5kRGV0ZXJtaW5lUmV2ZXJzZWRTdGF0ZTogKHNlbGVjdGlvbiwgZm91bmQsIHdoaWNoSXNIZWFkKSAtPlxuICAgIGlmIHNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICAgIGZvdW5kXG4gICAgZWxzZVxuICAgICAgaGVhZCA9IGZvdW5kW3doaWNoSXNIZWFkXVxuICAgICAgdGFpbCA9IHNlbGVjdGlvbi5nZXRUYWlsQnVmZmVyUG9zaXRpb24oKVxuXG4gICAgICBpZiBAYmFja3dhcmRcbiAgICAgICAgaGVhZCA9IHRyYW5zbGF0ZVBvaW50QW5kQ2xpcChAZWRpdG9yLCBoZWFkLCAnZm9yd2FyZCcpIGlmIHRhaWwuaXNMZXNzVGhhbihoZWFkKVxuICAgICAgZWxzZVxuICAgICAgICBoZWFkID0gdHJhbnNsYXRlUG9pbnRBbmRDbGlwKEBlZGl0b3IsIGhlYWQsICdiYWNrd2FyZCcpIGlmIGhlYWQuaXNMZXNzVGhhbih0YWlsKVxuXG4gICAgICBAcmV2ZXJzZWQgPSBoZWFkLmlzTGVzc1RoYW4odGFpbClcbiAgICAgIG5ldyBSYW5nZSh0YWlsLCBoZWFkKS51bmlvbihAc3dyYXAoc2VsZWN0aW9uKS5nZXRUYWlsQnVmZmVyUmFuZ2UoKSlcblxuICBzZWxlY3RUZXh0T2JqZWN0OiAoc2VsZWN0aW9uKSAtPlxuICAgIGlmIHJhbmdlID0gQGdldFJhbmdlKHNlbGVjdGlvbilcbiAgICAgIEBzd3JhcChzZWxlY3Rpb24pLnNldEJ1ZmZlclJhbmdlKHJhbmdlLCB7cmV2ZXJzZWQ6IEByZXZlcnNlZCA/IEBiYWNrd2FyZH0pXG4gICAgICByZXR1cm4gdHJ1ZVxuXG5jbGFzcyBTZWFyY2hNYXRjaEJhY2t3YXJkIGV4dGVuZHMgU2VhcmNoTWF0Y2hGb3J3YXJkXG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZDogdHJ1ZVxuXG4gIGZpbmRNYXRjaDogKGZyb21Qb2ludCwgcGF0dGVybikgLT5cbiAgICBmcm9tUG9pbnQgPSB0cmFuc2xhdGVQb2ludEFuZENsaXAoQGVkaXRvciwgZnJvbVBvaW50LCBcImJhY2t3YXJkXCIpIGlmIChAbW9kZSBpcyAndmlzdWFsJylcbiAgICBmb3VuZCA9IG51bGxcbiAgICBAc2NhbkJhY2t3YXJkIHBhdHRlcm4sIHtmcm9tOiBbZnJvbVBvaW50LnJvdywgSW5maW5pdHldfSwgKHtyYW5nZSwgc3RvcH0pIC0+XG4gICAgICBpZiByYW5nZS5zdGFydC5pc0xlc3NUaGFuKGZyb21Qb2ludClcbiAgICAgICAgZm91bmQgPSByYW5nZVxuICAgICAgICBzdG9wKClcbiAgICB7cmFuZ2U6IGZvdW5kLCB3aGljaElzSGVhZDogJ3N0YXJ0J31cblxuIyBbTGltaXRhdGlvbjogd29uJ3QgZml4XTogU2VsZWN0ZWQgcmFuZ2UgaXMgbm90IHN1Ym1vZGUgYXdhcmUuIGFsd2F5cyBjaGFyYWN0ZXJ3aXNlLlxuIyBTbyBldmVuIGlmIG9yaWdpbmFsIHNlbGVjdGlvbiB3YXMgdkwgb3IgdkIsIHNlbGVjdGVkIHJhbmdlIGJ5IHRoaXMgdGV4dC1vYmplY3RcbiMgaXMgYWx3YXlzIHZDIHJhbmdlLlxuY2xhc3MgUHJldmlvdXNTZWxlY3Rpb24gZXh0ZW5kcyBUZXh0T2JqZWN0XG4gIEBleHRlbmQoKVxuICB3aXNlOiBudWxsXG4gIHNlbGVjdE9uY2U6IHRydWVcblxuICBzZWxlY3RUZXh0T2JqZWN0OiAoc2VsZWN0aW9uKSAtPlxuICAgIHtwcm9wZXJ0aWVzLCBzdWJtb2RlfSA9IEB2aW1TdGF0ZS5wcmV2aW91c1NlbGVjdGlvblxuICAgIGlmIHByb3BlcnRpZXM/IGFuZCBzdWJtb2RlP1xuICAgICAgQHdpc2UgPSBzdWJtb2RlXG4gICAgICBAc3dyYXAoQGVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpLnNlbGVjdEJ5UHJvcGVydGllcyhwcm9wZXJ0aWVzKVxuICAgICAgcmV0dXJuIHRydWVcblxuY2xhc3MgUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgQGRlcml2ZUlubmVyQW5kQSgpXG4gIHdpc2U6IG51bGxcbiAgc2VsZWN0T25jZTogdHJ1ZVxuXG4gIHNlbGVjdFRleHRPYmplY3Q6IChzZWxlY3Rpb24pIC0+XG4gICAgaWYgQHZpbVN0YXRlLmhhc1BlcnNpc3RlbnRTZWxlY3Rpb25zKClcbiAgICAgIEB2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLnNldFNlbGVjdGVkQnVmZmVyUmFuZ2VzKClcbiAgICAgIHJldHVybiB0cnVlXG5cbiMgVXNlZCBvbmx5IGJ5IFJlcGxhY2VXaXRoUmVnaXN0ZXIgYW5kIFB1dEJlZm9yZSBhbmQgaXRzJyBjaGlsZHJlbi5cbmNsYXNzIExhc3RQYXN0ZWRSYW5nZSBleHRlbmRzIFRleHRPYmplY3RcbiAgQGV4dGVuZChmYWxzZSlcbiAgd2lzZTogbnVsbFxuICBzZWxlY3RPbmNlOiB0cnVlXG5cbiAgc2VsZWN0VGV4dE9iamVjdDogKHNlbGVjdGlvbikgLT5cbiAgICBmb3Igc2VsZWN0aW9uIGluIEBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICByYW5nZSA9IEB2aW1TdGF0ZS5zZXF1ZW50aWFsUGFzdGVNYW5hZ2VyLmdldFBhc3RlZFJhbmdlRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgICAgIHNlbGVjdGlvbi5zZXRCdWZmZXJSYW5nZShyYW5nZSlcblxuICAgIHJldHVybiB0cnVlXG5cbmNsYXNzIFZpc2libGVBcmVhIGV4dGVuZHMgVGV4dE9iamVjdFxuICBAZXh0ZW5kKGZhbHNlKVxuICBAZGVyaXZlSW5uZXJBbmRBKClcbiAgc2VsZWN0T25jZTogdHJ1ZVxuXG4gIGdldFJhbmdlOiAoc2VsZWN0aW9uKSAtPlxuICAgICMgW0JVRz9dIE5lZWQgdHJhbnNsYXRlIHRvIHNoaWxuayB0b3AgYW5kIGJvdHRvbSB0byBmaXQgYWN0dWFsIHJvdy5cbiAgICAjIFRoZSByZWFzb24gSSBuZWVkIC0yIGF0IGJvdHRvbSBpcyBiZWNhdXNlIG9mIHN0YXR1cyBiYXI/XG4gICAgYnVmZmVyUmFuZ2UgPSBnZXRWaXNpYmxlQnVmZmVyUmFuZ2UoQGVkaXRvcilcbiAgICBpZiBidWZmZXJSYW5nZS5nZXRSb3dzKCkgPiBAZWRpdG9yLmdldFJvd3NQZXJQYWdlKClcbiAgICAgIGJ1ZmZlclJhbmdlLnRyYW5zbGF0ZShbKzEsIDBdLCBbLTMsIDBdKVxuICAgIGVsc2VcbiAgICAgIGJ1ZmZlclJhbmdlXG4iXX0=
