(function() {
  var AddBlankLineAbove, AddBlankLineBelow, AddPresetOccurrenceFromLastOccurrencePattern, Base, CreatePersistentSelection, Decrease, DecrementNumber, Delete, DeleteLeft, DeleteLine, DeleteRight, DeleteToLastCharacterOfLine, Increase, IncrementNumber, Operator, PutAfter, PutAfterWithAutoIndent, PutBefore, PutBeforeWithAutoIndent, Select, SelectLatestChange, SelectOccurrence, SelectPersistentSelection, SelectPreviousSelection, TogglePersistentSelection, TogglePresetOccurrence, TogglePresetSubwordOccurrence, Yank, YankLine, YankToLastCharacterOfLine, _, adjustIndentWithKeepingLayout, ensureEndsWithNewLineForBufferRow, getSubwordPatternAtBufferPosition, getWordPatternAtBufferPosition, insertTextAtBufferPosition, isEmptyRow, isSingleLineText, moveCursorToFirstCharacterAtRow, ref, setBufferRow,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('./utils'), isEmptyRow = ref.isEmptyRow, getWordPatternAtBufferPosition = ref.getWordPatternAtBufferPosition, getSubwordPatternAtBufferPosition = ref.getSubwordPatternAtBufferPosition, insertTextAtBufferPosition = ref.insertTextAtBufferPosition, setBufferRow = ref.setBufferRow, moveCursorToFirstCharacterAtRow = ref.moveCursorToFirstCharacterAtRow, ensureEndsWithNewLineForBufferRow = ref.ensureEndsWithNewLineForBufferRow, adjustIndentWithKeepingLayout = ref.adjustIndentWithKeepingLayout, isSingleLineText = ref.isSingleLineText;

  Base = require('./base');

  Operator = (function(superClass) {
    extend(Operator, superClass);

    Operator.extend(false);

    Operator.operationKind = 'operator';

    Operator.prototype.requireTarget = true;

    Operator.prototype.recordable = true;

    Operator.prototype.wise = null;

    Operator.prototype.occurrence = false;

    Operator.prototype.occurrenceType = 'base';

    Operator.prototype.flashTarget = true;

    Operator.prototype.flashCheckpoint = 'did-finish';

    Operator.prototype.flashType = 'operator';

    Operator.prototype.flashTypeForOccurrence = 'operator-occurrence';

    Operator.prototype.trackChange = false;

    Operator.prototype.patternForOccurrence = null;

    Operator.prototype.stayAtSamePosition = null;

    Operator.prototype.stayOptionName = null;

    Operator.prototype.stayByMarker = false;

    Operator.prototype.restorePositions = true;

    Operator.prototype.setToFirstCharacterOnLinewise = false;

    Operator.prototype.acceptPresetOccurrence = true;

    Operator.prototype.acceptPersistentSelection = true;

    Operator.prototype.bufferCheckpointByPurpose = null;

    Operator.prototype.mutateSelectionOrderd = false;

    Operator.prototype.supportEarlySelect = false;

    Operator.prototype.targetSelected = null;

    Operator.prototype.canEarlySelect = function() {
      return this.supportEarlySelect && !this.repeated;
    };

    Operator.prototype.resetState = function() {
      this.targetSelected = null;
      return this.occurrenceSelected = false;
    };

    Operator.prototype.createBufferCheckpoint = function(purpose) {
      if (this.bufferCheckpointByPurpose == null) {
        this.bufferCheckpointByPurpose = {};
      }
      return this.bufferCheckpointByPurpose[purpose] = this.editor.createCheckpoint();
    };

    Operator.prototype.getBufferCheckpoint = function(purpose) {
      var ref1;
      return (ref1 = this.bufferCheckpointByPurpose) != null ? ref1[purpose] : void 0;
    };

    Operator.prototype.deleteBufferCheckpoint = function(purpose) {
      if (this.bufferCheckpointByPurpose != null) {
        return delete this.bufferCheckpointByPurpose[purpose];
      }
    };

    Operator.prototype.groupChangesSinceBufferCheckpoint = function(purpose) {
      var checkpoint;
      if (checkpoint = this.getBufferCheckpoint(purpose)) {
        this.editor.groupChangesSinceCheckpoint(checkpoint);
        return this.deleteBufferCheckpoint(purpose);
      }
    };

    Operator.prototype.setMarkForChange = function(range) {
      this.vimState.mark.set('[', range.start);
      return this.vimState.mark.set(']', range.end);
    };

    Operator.prototype.needFlash = function() {
      var ref1;
      return this.flashTarget && this.getConfig('flashOnOperate') && (ref1 = this.name, indexOf.call(this.getConfig('flashOnOperateBlacklist'), ref1) < 0) && ((this.mode !== 'visual') || (this.submode !== this.target.wise));
    };

    Operator.prototype.flashIfNecessary = function(ranges) {
      if (this.needFlash()) {
        return this.vimState.flash(ranges, {
          type: this.getFlashType()
        });
      }
    };

    Operator.prototype.flashChangeIfNecessary = function() {
      if (this.needFlash()) {
        return this.onDidFinishOperation((function(_this) {
          return function() {
            var ranges;
            ranges = _this.mutationManager.getSelectedBufferRangesForCheckpoint(_this.flashCheckpoint);
            return _this.vimState.flash(ranges, {
              type: _this.getFlashType()
            });
          };
        })(this));
      }
    };

    Operator.prototype.getFlashType = function() {
      if (this.occurrenceSelected) {
        return this.flashTypeForOccurrence;
      } else {
        return this.flashType;
      }
    };

    Operator.prototype.trackChangeIfNecessary = function() {
      if (!this.trackChange) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var range;
          if (range = _this.mutationManager.getMutatedBufferRangeForSelection(_this.editor.getLastSelection())) {
            return _this.setMarkForChange(range);
          }
        };
      })(this));
    };

    function Operator() {
      var ref1, ref2;
      Operator.__super__.constructor.apply(this, arguments);
      ref1 = this.vimState, this.mutationManager = ref1.mutationManager, this.occurrenceManager = ref1.occurrenceManager, this.persistentSelection = ref1.persistentSelection;
      this.subscribeResetOccurrencePatternIfNeeded();
      this.initialize();
      this.onDidSetOperatorModifier(this.setModifier.bind(this));
      if (this.acceptPresetOccurrence && this.occurrenceManager.hasMarkers()) {
        this.occurrence = true;
      }
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        this.occurrenceManager.addPattern((ref2 = this.patternForOccurrence) != null ? ref2 : this.getPatternForOccurrenceType(this.occurrenceType));
      }
      if (this.selectPersistentSelectionIfNecessary()) {
        if (this.mode !== 'visual') {
          this.vimState.modeManager.activate('visual', this.swrap.detectWise(this.editor));
        }
      }
      if (this.mode === 'visual' && this.requireTarget) {
        this.target = 'CurrentSelection';
      }
      if (_.isString(this.target)) {
        this.setTarget(this["new"](this.target));
      }
    }

    Operator.prototype.subscribeResetOccurrencePatternIfNeeded = function() {
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        return this.onDidResetOperationStack((function(_this) {
          return function() {
            return _this.occurrenceManager.resetPatterns();
          };
        })(this));
      }
    };

    Operator.prototype.setModifier = function(options) {
      var pattern;
      if (options.wise != null) {
        this.wise = options.wise;
        return;
      }
      if (options.occurrence != null) {
        this.occurrence = options.occurrence;
        if (this.occurrence) {
          this.occurrenceType = options.occurrenceType;
          pattern = this.getPatternForOccurrenceType(this.occurrenceType);
          this.occurrenceManager.addPattern(pattern, {
            reset: true,
            occurrenceType: this.occurrenceType
          });
          return this.onDidResetOperationStack((function(_this) {
            return function() {
              return _this.occurrenceManager.resetPatterns();
            };
          })(this));
        }
      }
    };

    Operator.prototype.selectPersistentSelectionIfNecessary = function() {
      var $selection, i, len, ref1;
      if (this.acceptPersistentSelection && this.getConfig('autoSelectPersistentSelectionOnOperate') && !this.persistentSelection.isEmpty()) {
        this.persistentSelection.select();
        this.editor.mergeIntersectingSelections();
        ref1 = this.swrap.getSelections(this.editor);
        for (i = 0, len = ref1.length; i < len; i++) {
          $selection = ref1[i];
          if (!$selection.hasProperties()) {
            $selection.saveProperties();
          }
        }
        return true;
      } else {
        return false;
      }
    };

    Operator.prototype.getPatternForOccurrenceType = function(occurrenceType) {
      switch (occurrenceType) {
        case 'base':
          return getWordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
        case 'subword':
          return getSubwordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
      }
    };

    Operator.prototype.setTarget = function(target1) {
      this.target = target1;
      this.target.operator = this;
      this.emitDidSetTarget(this);
      if (this.canEarlySelect()) {
        this.normalizeSelectionsIfNecessary();
        this.createBufferCheckpoint('undo');
        this.selectTarget();
      }
      return this;
    };

    Operator.prototype.setTextToRegisterForSelection = function(selection) {
      return this.setTextToRegister(selection.getText(), selection);
    };

    Operator.prototype.setTextToRegister = function(text, selection) {
      if (this.target.isLinewise() && (!text.endsWith('\n'))) {
        text += "\n";
      }
      if (text) {
        this.vimState.register.set(null, {
          text: text,
          selection: selection
        });
        if (this.vimState.register.isUnnamed()) {
          if (this["instanceof"]("Delete") || this["instanceof"]("Change")) {
            if (!this.needSaveToNumberedRegister(this.target) && isSingleLineText(text)) {
              return this.vimState.register.set('-', {
                text: text,
                selection: selection
              });
            } else {
              return this.vimState.register.set('1', {
                text: text,
                selection: selection
              });
            }
          } else if (this["instanceof"]("Yank")) {
            return this.vimState.register.set('0', {
              text: text,
              selection: selection
            });
          }
        }
      }
    };

    Operator.prototype.needSaveToNumberedRegister = function(target) {
      var goesToNumberedRegisterMotionNames;
      goesToNumberedRegisterMotionNames = ["MoveToPair", "MoveToNextSentence", "Search", "MoveToNextParagraph"];
      return goesToNumberedRegisterMotionNames.some(function(name) {
        return target["instanceof"](name);
      });
    };

    Operator.prototype.normalizeSelectionsIfNecessary = function() {
      var ref1;
      if (((ref1 = this.target) != null ? ref1.isMotion() : void 0) && (this.mode === 'visual')) {
        return this.swrap.normalize(this.editor);
      }
    };

    Operator.prototype.startMutation = function(fn) {
      if (this.canEarlySelect()) {
        fn();
        this.emitWillFinishMutation();
        this.groupChangesSinceBufferCheckpoint('undo');
      } else {
        this.normalizeSelectionsIfNecessary();
        this.editor.transact((function(_this) {
          return function() {
            fn();
            return _this.emitWillFinishMutation();
          };
        })(this));
      }
      return this.emitDidFinishMutation();
    };

    Operator.prototype.execute = function() {
      this.startMutation((function(_this) {
        return function() {
          var i, len, selection, selections;
          if (_this.selectTarget()) {
            if (_this.mutateSelectionOrderd) {
              selections = _this.editor.getSelectionsOrderedByBufferPosition();
            } else {
              selections = _this.editor.getSelections();
            }
            for (i = 0, len = selections.length; i < len; i++) {
              selection = selections[i];
              _this.mutateSelection(selection);
            }
            _this.mutationManager.setCheckpoint('did-finish');
            return _this.restoreCursorPositionsIfNecessary();
          }
        };
      })(this));
      return this.activateMode('normal');
    };

    Operator.prototype.selectTarget = function() {
      var ref1;
      if (this.targetSelected != null) {
        return this.targetSelected;
      }
      this.mutationManager.init({
        stayByMarker: this.stayByMarker
      });
      if (this.wise != null) {
        this.target.forceWise(this.wise);
      }
      this.emitWillSelectTarget();
      this.mutationManager.setCheckpoint('will-select');
      if (this.repeated && this.occurrence && !this.occurrenceManager.hasMarkers()) {
        this.occurrenceManager.addPattern(this.patternForOccurrence, {
          occurrenceType: this.occurrenceType
        });
      }
      this.target.execute();
      this.mutationManager.setCheckpoint('did-select');
      if (this.occurrence) {
        if (this.patternForOccurrence == null) {
          this.patternForOccurrence = this.occurrenceManager.buildPattern();
        }
        this.occurrenceWise = (ref1 = this.wise) != null ? ref1 : "characterwise";
        if (this.occurrenceManager.select(this.occurrenceWise)) {
          this.occurrenceSelected = true;
          this.mutationManager.setCheckpoint('did-select-occurrence');
        }
      }
      if (this.targetSelected = this.vimState.haveSomeNonEmptySelection() || this.target.name === "Empty") {
        this.emitDidSelectTarget();
        this.flashChangeIfNecessary();
        this.trackChangeIfNecessary();
      } else {
        this.emitDidFailSelectTarget();
      }
      return this.targetSelected;
    };

    Operator.prototype.restoreCursorPositionsIfNecessary = function() {
      var ref1, stay, wise;
      if (!this.restorePositions) {
        return;
      }
      stay = ((ref1 = this.stayAtSamePosition) != null ? ref1 : this.getConfig(this.stayOptionName)) || (this.occurrenceSelected && this.getConfig('stayOnOccurrence'));
      wise = this.occurrenceSelected ? this.occurrenceWise : this.target.wise;
      return this.mutationManager.restoreCursorPositions({
        stay: stay,
        wise: wise,
        setToFirstCharacterOnLinewise: this.setToFirstCharacterOnLinewise
      });
    };

    return Operator;

  })(Base);

  Select = (function(superClass) {
    extend(Select, superClass);

    function Select() {
      return Select.__super__.constructor.apply(this, arguments);
    }

    Select.extend(false);

    Select.prototype.flashTarget = false;

    Select.prototype.recordable = false;

    Select.prototype.acceptPresetOccurrence = false;

    Select.prototype.acceptPersistentSelection = false;

    Select.prototype.execute = function() {
      this.startMutation(this.selectTarget.bind(this));
      if (this.target.isTextObject() && this.target.selectSucceeded) {
        this.editor.scrollToCursorPosition();
        return this.activateModeIfNecessary('visual', this.target.wise);
      }
    };

    return Select;

  })(Operator);

  SelectLatestChange = (function(superClass) {
    extend(SelectLatestChange, superClass);

    function SelectLatestChange() {
      return SelectLatestChange.__super__.constructor.apply(this, arguments);
    }

    SelectLatestChange.extend();

    SelectLatestChange.description = "Select latest yanked or changed range";

    SelectLatestChange.prototype.target = 'ALatestChange';

    return SelectLatestChange;

  })(Select);

  SelectPreviousSelection = (function(superClass) {
    extend(SelectPreviousSelection, superClass);

    function SelectPreviousSelection() {
      return SelectPreviousSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPreviousSelection.extend();

    SelectPreviousSelection.prototype.target = "PreviousSelection";

    return SelectPreviousSelection;

  })(Select);

  SelectPersistentSelection = (function(superClass) {
    extend(SelectPersistentSelection, superClass);

    function SelectPersistentSelection() {
      return SelectPersistentSelection.__super__.constructor.apply(this, arguments);
    }

    SelectPersistentSelection.extend();

    SelectPersistentSelection.description = "Select persistent-selection and clear all persistent-selection, it's like convert to real-selection";

    SelectPersistentSelection.prototype.target = "APersistentSelection";

    return SelectPersistentSelection;

  })(Select);

  SelectOccurrence = (function(superClass) {
    extend(SelectOccurrence, superClass);

    function SelectOccurrence() {
      return SelectOccurrence.__super__.constructor.apply(this, arguments);
    }

    SelectOccurrence.extend();

    SelectOccurrence.description = "Add selection onto each matching word within target range";

    SelectOccurrence.prototype.occurrence = true;

    SelectOccurrence.prototype.execute = function() {
      return this.startMutation((function(_this) {
        return function() {
          if (_this.selectTarget()) {
            return _this.activateModeIfNecessary('visual', 'characterwise');
          }
        };
      })(this));
    };

    return SelectOccurrence;

  })(Operator);

  CreatePersistentSelection = (function(superClass) {
    extend(CreatePersistentSelection, superClass);

    function CreatePersistentSelection() {
      return CreatePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    CreatePersistentSelection.extend();

    CreatePersistentSelection.prototype.flashTarget = false;

    CreatePersistentSelection.prototype.stayAtSamePosition = true;

    CreatePersistentSelection.prototype.acceptPresetOccurrence = false;

    CreatePersistentSelection.prototype.acceptPersistentSelection = false;

    CreatePersistentSelection.prototype.mutateSelection = function(selection) {
      return this.persistentSelection.markBufferRange(selection.getBufferRange());
    };

    return CreatePersistentSelection;

  })(Operator);

  TogglePersistentSelection = (function(superClass) {
    extend(TogglePersistentSelection, superClass);

    function TogglePersistentSelection() {
      return TogglePersistentSelection.__super__.constructor.apply(this, arguments);
    }

    TogglePersistentSelection.extend();

    TogglePersistentSelection.prototype.isComplete = function() {
      var point;
      point = this.editor.getCursorBufferPosition();
      this.markerToRemove = this.persistentSelection.getMarkerAtPoint(point);
      if (this.markerToRemove) {
        return true;
      } else {
        return TogglePersistentSelection.__super__.isComplete.apply(this, arguments);
      }
    };

    TogglePersistentSelection.prototype.execute = function() {
      if (this.markerToRemove) {
        return this.markerToRemove.destroy();
      } else {
        return TogglePersistentSelection.__super__.execute.apply(this, arguments);
      }
    };

    return TogglePersistentSelection;

  })(CreatePersistentSelection);

  TogglePresetOccurrence = (function(superClass) {
    extend(TogglePresetOccurrence, superClass);

    function TogglePresetOccurrence() {
      return TogglePresetOccurrence.__super__.constructor.apply(this, arguments);
    }

    TogglePresetOccurrence.extend();

    TogglePresetOccurrence.prototype.target = "Empty";

    TogglePresetOccurrence.prototype.flashTarget = false;

    TogglePresetOccurrence.prototype.acceptPresetOccurrence = false;

    TogglePresetOccurrence.prototype.acceptPersistentSelection = false;

    TogglePresetOccurrence.prototype.occurrenceType = 'base';

    TogglePresetOccurrence.prototype.execute = function() {
      var isNarrowed, marker, pattern;
      if (marker = this.occurrenceManager.getMarkerAtPoint(this.editor.getCursorBufferPosition())) {
        return this.occurrenceManager.destroyMarkers([marker]);
      } else {
        pattern = null;
        isNarrowed = this.vimState.modeManager.isNarrowed();
        if (this.mode === 'visual' && !isNarrowed) {
          this.occurrenceType = 'base';
          pattern = new RegExp(_.escapeRegExp(this.editor.getSelectedText()), 'g');
        } else {
          pattern = this.getPatternForOccurrenceType(this.occurrenceType);
        }
        this.occurrenceManager.addPattern(pattern, {
          occurrenceType: this.occurrenceType
        });
        this.occurrenceManager.saveLastPattern(this.occurrenceType);
        if (!isNarrowed) {
          return this.activateMode('normal');
        }
      }
    };

    return TogglePresetOccurrence;

  })(Operator);

  TogglePresetSubwordOccurrence = (function(superClass) {
    extend(TogglePresetSubwordOccurrence, superClass);

    function TogglePresetSubwordOccurrence() {
      return TogglePresetSubwordOccurrence.__super__.constructor.apply(this, arguments);
    }

    TogglePresetSubwordOccurrence.extend();

    TogglePresetSubwordOccurrence.prototype.occurrenceType = 'subword';

    return TogglePresetSubwordOccurrence;

  })(TogglePresetOccurrence);

  AddPresetOccurrenceFromLastOccurrencePattern = (function(superClass) {
    extend(AddPresetOccurrenceFromLastOccurrencePattern, superClass);

    function AddPresetOccurrenceFromLastOccurrencePattern() {
      return AddPresetOccurrenceFromLastOccurrencePattern.__super__.constructor.apply(this, arguments);
    }

    AddPresetOccurrenceFromLastOccurrencePattern.extend();

    AddPresetOccurrenceFromLastOccurrencePattern.prototype.execute = function() {
      var occurrenceType, pattern;
      this.occurrenceManager.resetPatterns();
      if (pattern = this.vimState.globalState.get('lastOccurrencePattern')) {
        occurrenceType = this.vimState.globalState.get("lastOccurrenceType");
        this.occurrenceManager.addPattern(pattern, {
          occurrenceType: occurrenceType
        });
        return this.activateMode('normal');
      }
    };

    return AddPresetOccurrenceFromLastOccurrencePattern;

  })(TogglePresetOccurrence);

  Delete = (function(superClass) {
    extend(Delete, superClass);

    function Delete() {
      return Delete.__super__.constructor.apply(this, arguments);
    }

    Delete.extend();

    Delete.prototype.trackChange = true;

    Delete.prototype.flashCheckpoint = 'did-select-occurrence';

    Delete.prototype.flashTypeForOccurrence = 'operator-remove-occurrence';

    Delete.prototype.stayOptionName = 'stayOnDelete';

    Delete.prototype.setToFirstCharacterOnLinewise = true;

    Delete.prototype.execute = function() {
      this.onDidSelectTarget((function(_this) {
        return function() {
          if (_this.occurrenceSelected && _this.occurrenceWise === "linewise") {
            return _this.flashTarget = false;
          }
        };
      })(this));
      if (this.target.wise === 'blockwise') {
        this.restorePositions = false;
      }
      return Delete.__super__.execute.apply(this, arguments);
    };

    Delete.prototype.mutateSelection = function(selection) {
      this.setTextToRegisterForSelection(selection);
      return selection.deleteSelectedText();
    };

    return Delete;

  })(Operator);

  DeleteRight = (function(superClass) {
    extend(DeleteRight, superClass);

    function DeleteRight() {
      return DeleteRight.__super__.constructor.apply(this, arguments);
    }

    DeleteRight.extend();

    DeleteRight.prototype.target = 'MoveRight';

    return DeleteRight;

  })(Delete);

  DeleteLeft = (function(superClass) {
    extend(DeleteLeft, superClass);

    function DeleteLeft() {
      return DeleteLeft.__super__.constructor.apply(this, arguments);
    }

    DeleteLeft.extend();

    DeleteLeft.prototype.target = 'MoveLeft';

    return DeleteLeft;

  })(Delete);

  DeleteToLastCharacterOfLine = (function(superClass) {
    extend(DeleteToLastCharacterOfLine, superClass);

    function DeleteToLastCharacterOfLine() {
      return DeleteToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    DeleteToLastCharacterOfLine.extend();

    DeleteToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    DeleteToLastCharacterOfLine.prototype.execute = function() {
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
      return DeleteToLastCharacterOfLine.__super__.execute.apply(this, arguments);
    };

    return DeleteToLastCharacterOfLine;

  })(Delete);

  DeleteLine = (function(superClass) {
    extend(DeleteLine, superClass);

    function DeleteLine() {
      return DeleteLine.__super__.constructor.apply(this, arguments);
    }

    DeleteLine.extend();

    DeleteLine.prototype.wise = 'linewise';

    DeleteLine.prototype.target = "MoveToRelativeLine";

    DeleteLine.prototype.flashTarget = false;

    return DeleteLine;

  })(Delete);

  Yank = (function(superClass) {
    extend(Yank, superClass);

    function Yank() {
      return Yank.__super__.constructor.apply(this, arguments);
    }

    Yank.extend();

    Yank.prototype.trackChange = true;

    Yank.prototype.stayOptionName = 'stayOnYank';

    Yank.prototype.mutateSelection = function(selection) {
      return this.setTextToRegisterForSelection(selection);
    };

    return Yank;

  })(Operator);

  YankLine = (function(superClass) {
    extend(YankLine, superClass);

    function YankLine() {
      return YankLine.__super__.constructor.apply(this, arguments);
    }

    YankLine.extend();

    YankLine.prototype.wise = 'linewise';

    YankLine.prototype.target = "MoveToRelativeLine";

    return YankLine;

  })(Yank);

  YankToLastCharacterOfLine = (function(superClass) {
    extend(YankToLastCharacterOfLine, superClass);

    function YankToLastCharacterOfLine() {
      return YankToLastCharacterOfLine.__super__.constructor.apply(this, arguments);
    }

    YankToLastCharacterOfLine.extend();

    YankToLastCharacterOfLine.prototype.target = 'MoveToLastCharacterOfLine';

    return YankToLastCharacterOfLine;

  })(Yank);

  Increase = (function(superClass) {
    extend(Increase, superClass);

    function Increase() {
      return Increase.__super__.constructor.apply(this, arguments);
    }

    Increase.extend();

    Increase.prototype.target = "Empty";

    Increase.prototype.flashTarget = false;

    Increase.prototype.restorePositions = false;

    Increase.prototype.step = 1;

    Increase.prototype.execute = function() {
      var ref1;
      this.newRanges = [];
      Increase.__super__.execute.apply(this, arguments);
      if (this.newRanges.length) {
        if (this.getConfig('flashOnOperate') && (ref1 = this.name, indexOf.call(this.getConfig('flashOnOperateBlacklist'), ref1) < 0)) {
          return this.vimState.flash(this.newRanges, {
            type: this.flashTypeForOccurrence
          });
        }
      }
    };

    Increase.prototype.replaceNumberInBufferRange = function(scanRange, fn) {
      var newRanges;
      if (fn == null) {
        fn = null;
      }
      newRanges = [];
      if (this.pattern == null) {
        this.pattern = RegExp("" + (this.getConfig('numberRegex')), "g");
      }
      this.scanForward(this.pattern, {
        scanRange: scanRange
      }, (function(_this) {
        return function(event) {
          var matchText, nextNumber, replace;
          if ((fn != null) && !fn(event)) {
            return;
          }
          matchText = event.matchText, replace = event.replace;
          nextNumber = _this.getNextNumber(matchText);
          return newRanges.push(replace(String(nextNumber)));
        };
      })(this));
      return newRanges;
    };

    Increase.prototype.mutateSelection = function(selection) {
      var cursor, cursorPosition, newRanges, point, ref1, ref2, ref3, scanRange;
      cursor = selection.cursor;
      if (this.target.is('Empty')) {
        cursorPosition = cursor.getBufferPosition();
        scanRange = this.editor.bufferRangeForBufferRow(cursorPosition.row);
        newRanges = this.replaceNumberInBufferRange(scanRange, function(arg) {
          var range, stop;
          range = arg.range, stop = arg.stop;
          if (range.end.isGreaterThan(cursorPosition)) {
            stop();
            return true;
          } else {
            return false;
          }
        });
        point = (ref1 = (ref2 = newRanges[0]) != null ? ref2.end.translate([0, -1]) : void 0) != null ? ref1 : cursorPosition;
        return cursor.setBufferPosition(point);
      } else {
        scanRange = selection.getBufferRange();
        (ref3 = this.newRanges).push.apply(ref3, this.replaceNumberInBufferRange(scanRange));
        return cursor.setBufferPosition(scanRange.start);
      }
    };

    Increase.prototype.getNextNumber = function(numberString) {
      return Number.parseInt(numberString, 10) + this.step * this.getCount();
    };

    return Increase;

  })(Operator);

  Decrease = (function(superClass) {
    extend(Decrease, superClass);

    function Decrease() {
      return Decrease.__super__.constructor.apply(this, arguments);
    }

    Decrease.extend();

    Decrease.prototype.step = -1;

    return Decrease;

  })(Increase);

  IncrementNumber = (function(superClass) {
    extend(IncrementNumber, superClass);

    function IncrementNumber() {
      return IncrementNumber.__super__.constructor.apply(this, arguments);
    }

    IncrementNumber.extend();

    IncrementNumber.prototype.baseNumber = null;

    IncrementNumber.prototype.target = null;

    IncrementNumber.prototype.mutateSelectionOrderd = true;

    IncrementNumber.prototype.getNextNumber = function(numberString) {
      if (this.baseNumber != null) {
        this.baseNumber += this.step * this.getCount();
      } else {
        this.baseNumber = Number.parseInt(numberString, 10);
      }
      return this.baseNumber;
    };

    return IncrementNumber;

  })(Increase);

  DecrementNumber = (function(superClass) {
    extend(DecrementNumber, superClass);

    function DecrementNumber() {
      return DecrementNumber.__super__.constructor.apply(this, arguments);
    }

    DecrementNumber.extend();

    DecrementNumber.prototype.step = -1;

    return DecrementNumber;

  })(IncrementNumber);

  PutBefore = (function(superClass) {
    extend(PutBefore, superClass);

    function PutBefore() {
      return PutBefore.__super__.constructor.apply(this, arguments);
    }

    PutBefore.extend();

    PutBefore.prototype.location = 'before';

    PutBefore.prototype.target = 'Empty';

    PutBefore.prototype.flashType = 'operator-long';

    PutBefore.prototype.restorePositions = false;

    PutBefore.prototype.flashTarget = false;

    PutBefore.prototype.trackChange = false;

    PutBefore.prototype.initialize = function() {
      return this.vimState.sequentialPasteManager.onInitialize(this);
    };

    PutBefore.prototype.execute = function() {
      this.mutationsBySelection = new Map();
      this.sequentialPaste = this.vimState.sequentialPasteManager.onExecute(this);
      this.onDidFinishMutation((function(_this) {
        return function() {
          if (!_this.cancelled) {
            return _this.adjustCursorPosition();
          }
        };
      })(this));
      PutBefore.__super__.execute.apply(this, arguments);
      if (this.cancelled) {
        return;
      }
      return this.onDidFinishOperation((function(_this) {
        return function() {
          var newRange, ref1, toRange;
          if (newRange = _this.mutationsBySelection.get(_this.editor.getLastSelection())) {
            _this.setMarkForChange(newRange);
          }
          if (_this.getConfig('flashOnOperate') && (ref1 = _this.name, indexOf.call(_this.getConfig('flashOnOperateBlacklist'), ref1) < 0)) {
            toRange = function(selection) {
              return _this.mutationsBySelection.get(selection);
            };
            return _this.vimState.flash(_this.editor.getSelections().map(toRange), {
              type: _this.getFlashType()
            });
          }
        };
      })(this));
    };

    PutBefore.prototype.adjustCursorPosition = function() {
      var cursor, end, i, len, newRange, ref1, ref2, results, selection, start;
      ref1 = this.editor.getSelections();
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        selection = ref1[i];
        if (!(this.mutationsBySelection.has(selection))) {
          continue;
        }
        cursor = selection.cursor;
        ref2 = newRange = this.mutationsBySelection.get(selection), start = ref2.start, end = ref2.end;
        if (this.linewisePaste) {
          results.push(moveCursorToFirstCharacterAtRow(cursor, start.row));
        } else {
          if (newRange.isSingleLine()) {
            results.push(cursor.setBufferPosition(end.translate([0, -1])));
          } else {
            results.push(cursor.setBufferPosition(start));
          }
        }
      }
      return results;
    };

    PutBefore.prototype.mutateSelection = function(selection) {
      var newRange, ref1, text, type;
      ref1 = this.vimState.register.get(null, selection, this.sequentialPaste), text = ref1.text, type = ref1.type;
      if (!text) {
        this.cancelled = true;
        return;
      }
      text = _.multiplyString(text, this.getCount());
      this.linewisePaste = type === 'linewise' || this.isMode('visual', 'linewise');
      newRange = this.paste(selection, text, {
        linewisePaste: this.linewisePaste
      });
      this.mutationsBySelection.set(selection, newRange);
      return this.vimState.sequentialPasteManager.savePastedRangeForSelection(selection, newRange);
    };

    PutBefore.prototype.paste = function(selection, text, arg) {
      var linewisePaste;
      linewisePaste = arg.linewisePaste;
      if (this.sequentialPaste) {
        return this.pasteCharacterwise(selection, text);
      } else if (linewisePaste) {
        return this.pasteLinewise(selection, text);
      } else {
        return this.pasteCharacterwise(selection, text);
      }
    };

    PutBefore.prototype.pasteCharacterwise = function(selection, text) {
      var cursor;
      cursor = selection.cursor;
      if (selection.isEmpty() && this.location === 'after' && !isEmptyRow(this.editor, cursor.getBufferRow())) {
        cursor.moveRight();
      }
      return selection.insertText(text);
    };

    PutBefore.prototype.pasteLinewise = function(selection, text) {
      var cursor, cursorRow, targetRow;
      cursor = selection.cursor;
      cursorRow = cursor.getBufferRow();
      if (!text.endsWith("\n")) {
        text += "\n";
      }
      if (selection.isEmpty()) {
        if (this.location === 'before') {
          return insertTextAtBufferPosition(this.editor, [cursorRow, 0], text);
        } else if (this.location === 'after') {
          targetRow = this.getFoldEndRowForRow(cursorRow);
          ensureEndsWithNewLineForBufferRow(this.editor, targetRow);
          return insertTextAtBufferPosition(this.editor, [targetRow + 1, 0], text);
        }
      } else {
        if (!this.isMode('visual', 'linewise')) {
          selection.insertText("\n");
        }
        return selection.insertText(text);
      }
    };

    return PutBefore;

  })(Operator);

  PutAfter = (function(superClass) {
    extend(PutAfter, superClass);

    function PutAfter() {
      return PutAfter.__super__.constructor.apply(this, arguments);
    }

    PutAfter.extend();

    PutAfter.prototype.location = 'after';

    return PutAfter;

  })(PutBefore);

  PutBeforeWithAutoIndent = (function(superClass) {
    extend(PutBeforeWithAutoIndent, superClass);

    function PutBeforeWithAutoIndent() {
      return PutBeforeWithAutoIndent.__super__.constructor.apply(this, arguments);
    }

    PutBeforeWithAutoIndent.extend();

    PutBeforeWithAutoIndent.prototype.pasteLinewise = function(selection, text) {
      var newRange;
      newRange = PutBeforeWithAutoIndent.__super__.pasteLinewise.apply(this, arguments);
      adjustIndentWithKeepingLayout(this.editor, newRange);
      return newRange;
    };

    return PutBeforeWithAutoIndent;

  })(PutBefore);

  PutAfterWithAutoIndent = (function(superClass) {
    extend(PutAfterWithAutoIndent, superClass);

    function PutAfterWithAutoIndent() {
      return PutAfterWithAutoIndent.__super__.constructor.apply(this, arguments);
    }

    PutAfterWithAutoIndent.extend();

    PutAfterWithAutoIndent.prototype.location = 'after';

    return PutAfterWithAutoIndent;

  })(PutBeforeWithAutoIndent);

  AddBlankLineBelow = (function(superClass) {
    extend(AddBlankLineBelow, superClass);

    function AddBlankLineBelow() {
      return AddBlankLineBelow.__super__.constructor.apply(this, arguments);
    }

    AddBlankLineBelow.extend();

    AddBlankLineBelow.prototype.flashTarget = false;

    AddBlankLineBelow.prototype.target = "Empty";

    AddBlankLineBelow.prototype.stayAtSamePosition = true;

    AddBlankLineBelow.prototype.stayByMarker = true;

    AddBlankLineBelow.prototype.where = 'below';

    AddBlankLineBelow.prototype.mutateSelection = function(selection) {
      var point, row;
      row = selection.getHeadBufferPosition().row;
      if (this.where === 'below') {
        row += 1;
      }
      point = [row, 0];
      return this.editor.setTextInBufferRange([point, point], "\n".repeat(this.getCount()));
    };

    return AddBlankLineBelow;

  })(Operator);

  AddBlankLineAbove = (function(superClass) {
    extend(AddBlankLineAbove, superClass);

    function AddBlankLineAbove() {
      return AddBlankLineAbove.__super__.constructor.apply(this, arguments);
    }

    AddBlankLineAbove.extend();

    AddBlankLineAbove.prototype.where = 'above';

    return AddBlankLineAbove;

  })(AddBlankLineBelow);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRvci5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLHd4QkFBQTtJQUFBOzs7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxpQkFBUjs7RUFDSixNQVVJLE9BQUEsQ0FBUSxTQUFSLENBVkosRUFDRSwyQkFERixFQUVFLG1FQUZGLEVBR0UseUVBSEYsRUFJRSwyREFKRixFQUtFLCtCQUxGLEVBTUUscUVBTkYsRUFPRSx5RUFQRixFQVFFLGlFQVJGLEVBU0U7O0VBRUYsSUFBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUVEOzs7SUFDSixRQUFDLENBQUEsTUFBRCxDQUFRLEtBQVI7O0lBQ0EsUUFBQyxDQUFBLGFBQUQsR0FBZ0I7O3VCQUNoQixhQUFBLEdBQWU7O3VCQUNmLFVBQUEsR0FBWTs7dUJBRVosSUFBQSxHQUFNOzt1QkFDTixVQUFBLEdBQVk7O3VCQUNaLGNBQUEsR0FBZ0I7O3VCQUVoQixXQUFBLEdBQWE7O3VCQUNiLGVBQUEsR0FBaUI7O3VCQUNqQixTQUFBLEdBQVc7O3VCQUNYLHNCQUFBLEdBQXdCOzt1QkFDeEIsV0FBQSxHQUFhOzt1QkFFYixvQkFBQSxHQUFzQjs7dUJBQ3RCLGtCQUFBLEdBQW9COzt1QkFDcEIsY0FBQSxHQUFnQjs7dUJBQ2hCLFlBQUEsR0FBYzs7dUJBQ2QsZ0JBQUEsR0FBa0I7O3VCQUNsQiw2QkFBQSxHQUErQjs7dUJBRS9CLHNCQUFBLEdBQXdCOzt1QkFDeEIseUJBQUEsR0FBMkI7O3VCQUUzQix5QkFBQSxHQUEyQjs7dUJBQzNCLHFCQUFBLEdBQXVCOzt1QkFJdkIsa0JBQUEsR0FBb0I7O3VCQUNwQixjQUFBLEdBQWdCOzt1QkFDaEIsY0FBQSxHQUFnQixTQUFBO2FBQ2QsSUFBQyxDQUFBLGtCQUFELElBQXdCLENBQUksSUFBQyxD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cUJoQyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG57XG4gIGlzRW1wdHlSb3dcbiAgZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uXG4gIGdldFN1YndvcmRQYXR0ZXJuQXRCdWZmZXJQb3NpdGlvblxuICBpbnNlcnRUZXh0QXRCdWZmZXJQb3NpdGlvblxuICBzZXRCdWZmZXJSb3dcbiAgbW92ZUN1cnNvclRvRmlyc3RDaGFyYWN0ZXJBdFJvd1xuICBlbnN1cmVFbmRzV2l0aE5ld0xpbmVGb3JCdWZmZXJSb3dcbiAgYWRqdXN0SW5kZW50V2l0aEtlZXBpbmdMYXlvdXRcbiAgaXNTaW5nbGVMaW5lVGV4dFxufSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5CYXNlID0gcmVxdWlyZSAnLi9iYXNlJ1xuXG5jbGFzcyBPcGVyYXRvciBleHRlbmRzIEJhc2VcbiAgQGV4dGVuZChmYWxzZSlcbiAgQG9wZXJhdGlvbktpbmQ6ICdvcGVyYXRvcidcbiAgcmVxdWlyZVRhcmdldDogdHJ1ZVxuICByZWNvcmRhYmxlOiB0cnVlXG5cbiAgd2lzZTogbnVsbFxuICBvY2N1cnJlbmNlOiBmYWxzZVxuICBvY2N1cnJlbmNlVHlwZTogJ2Jhc2UnXG5cbiAgZmxhc2hUYXJnZXQ6IHRydWVcbiAgZmxhc2hDaGVja3BvaW50OiAnZGlkLWZpbmlzaCdcbiAgZmxhc2hUeXBlOiAnb3BlcmF0b3InXG4gIGZsYXNoVHlwZUZvck9jY3VycmVuY2U6ICdvcGVyYXRvci1vY2N1cnJlbmNlJ1xuICB0cmFja0NoYW5nZTogZmFsc2VcblxuICBwYXR0ZXJuRm9yT2NjdXJyZW5jZTogbnVsbFxuICBzdGF5QXRTYW1lUG9zaXRpb246IG51bGxcbiAgc3RheU9wdGlvbk5hbWU6IG51bGxcbiAgc3RheUJ5TWFya2VyOiBmYWxzZVxuICByZXN0b3JlUG9zaXRpb25zOiB0cnVlXG4gIHNldFRvRmlyc3RDaGFyYWN0ZXJPbkxpbmV3aXNlOiBmYWxzZVxuXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2U6IHRydWVcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbjogdHJ1ZVxuXG4gIGJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2U6IG51bGxcbiAgbXV0YXRlU2VsZWN0aW9uT3JkZXJkOiBmYWxzZVxuXG4gICMgRXhwZXJpbWVudGFseSBhbGxvdyBzZWxlY3RUYXJnZXQgYmVmb3JlIGlucHV0IENvbXBsZXRlXG4gICMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBzdXBwb3J0RWFybHlTZWxlY3Q6IGZhbHNlXG4gIHRhcmdldFNlbGVjdGVkOiBudWxsXG4gIGNhbkVhcmx5U2VsZWN0OiAtPlxuICAgIEBzdXBwb3J0RWFybHlTZWxlY3QgYW5kIG5vdCBAcmVwZWF0ZWRcbiAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgIyBDYWxsZWQgd2hlbiBvcGVyYXRpb24gZmluaXNoZWRcbiAgIyBUaGlzIGlzIGVzc2VudGlhbGx5IHRvIHJlc2V0IHN0YXRlIGZvciBgLmAgcmVwZWF0LlxuICByZXNldFN0YXRlOiAtPlxuICAgIEB0YXJnZXRTZWxlY3RlZCA9IG51bGxcbiAgICBAb2NjdXJyZW5jZVNlbGVjdGVkID0gZmFsc2VcblxuICAjIFR3byBjaGVja3BvaW50IGZvciBkaWZmZXJlbnQgcHVycG9zZVxuICAjIC0gb25lIGZvciB1bmRvKGhhbmRsZWQgYnkgbW9kZU1hbmFnZXIpXG4gICMgLSBvbmUgZm9yIHByZXNlcnZlIGxhc3QgaW5zZXJ0ZWQgdGV4dFxuICBjcmVhdGVCdWZmZXJDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBAYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZSA/PSB7fVxuICAgIEBidWZmZXJDaGVja3BvaW50QnlQdXJwb3NlW3B1cnBvc2VdID0gQGVkaXRvci5jcmVhdGVDaGVja3BvaW50KClcblxuICBnZXRCdWZmZXJDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBAYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZT9bcHVycG9zZV1cblxuICBkZWxldGVCdWZmZXJDaGVja3BvaW50OiAocHVycG9zZSkgLT5cbiAgICBpZiBAYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZT9cbiAgICAgIGRlbGV0ZSBAYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZVtwdXJwb3NlXVxuXG4gIGdyb3VwQ2hhbmdlc1NpbmNlQnVmZmVyQ2hlY2twb2ludDogKHB1cnBvc2UpIC0+XG4gICAgaWYgY2hlY2twb2ludCA9IEBnZXRCdWZmZXJDaGVja3BvaW50KHB1cnBvc2UpXG4gICAgICBAZWRpdG9yLmdyb3VwQ2hhbmdlc1NpbmNlQ2hlY2twb2ludChjaGVja3BvaW50KVxuICAgICAgQGRlbGV0ZUJ1ZmZlckNoZWNrcG9pbnQocHVycG9zZSlcblxuICBzZXRNYXJrRm9yQ2hhbmdlOiAocmFuZ2UpIC0+XG4gICAgQHZpbVN0YXRlLm1hcmsuc2V0KCdbJywgcmFuZ2Uuc3RhcnQpXG4gICAgQHZpbVN0YXRlLm1hcmsuc2V0KCddJywgcmFuZ2UuZW5kKVxuXG4gIG5lZWRGbGFzaDogLT5cbiAgICBAZmxhc2hUYXJnZXQgYW5kIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlJykgYW5kXG4gICAgICAoQG5hbWUgbm90IGluIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlQmxhY2tsaXN0JykpIGFuZFxuICAgICAgKChAbW9kZSBpc250ICd2aXN1YWwnKSBvciAoQHN1Ym1vZGUgaXNudCBAdGFyZ2V0Lndpc2UpKSAjIGUuZy4gWSBpbiB2Q1xuXG4gIGZsYXNoSWZOZWNlc3Nhcnk6IChyYW5nZXMpIC0+XG4gICAgaWYgQG5lZWRGbGFzaCgpXG4gICAgICBAdmltU3RhdGUuZmxhc2gocmFuZ2VzLCB0eXBlOiBAZ2V0Rmxhc2hUeXBlKCkpXG5cbiAgZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeTogLT5cbiAgICBpZiBAbmVlZEZsYXNoKClcbiAgICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgICByYW5nZXMgPSBAbXV0YXRpb25NYW5hZ2VyLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2VzRm9yQ2hlY2twb2ludChAZmxhc2hDaGVja3BvaW50KVxuICAgICAgICBAdmltU3RhdGUuZmxhc2gocmFuZ2VzLCB0eXBlOiBAZ2V0Rmxhc2hUeXBlKCkpXG5cbiAgZ2V0Rmxhc2hUeXBlOiAtPlxuICAgIGlmIEBvY2N1cnJlbmNlU2VsZWN0ZWRcbiAgICAgIEBmbGFzaFR5cGVGb3JPY2N1cnJlbmNlXG4gICAgZWxzZVxuICAgICAgQGZsYXNoVHlwZVxuXG4gIHRyYWNrQ2hhbmdlSWZOZWNlc3Nhcnk6IC0+XG4gICAgcmV0dXJuIHVubGVzcyBAdHJhY2tDaGFuZ2VcblxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgaWYgcmFuZ2UgPSBAbXV0YXRpb25NYW5hZ2VyLmdldE11dGF0ZWRCdWZmZXJSYW5nZUZvclNlbGVjdGlvbihAZWRpdG9yLmdldExhc3RTZWxlY3Rpb24oKSlcbiAgICAgICAgQHNldE1hcmtGb3JDaGFuZ2UocmFuZ2UpXG5cbiAgY29uc3RydWN0b3I6IC0+XG4gICAgc3VwZXJcbiAgICB7QG11dGF0aW9uTWFuYWdlciwgQG9jY3VycmVuY2VNYW5hZ2VyLCBAcGVyc2lzdGVudFNlbGVjdGlvbn0gPSBAdmltU3RhdGVcbiAgICBAc3Vic2NyaWJlUmVzZXRPY2N1cnJlbmNlUGF0dGVybklmTmVlZGVkKClcbiAgICBAaW5pdGlhbGl6ZSgpXG4gICAgQG9uRGlkU2V0T3BlcmF0b3JNb2RpZmllcihAc2V0TW9kaWZpZXIuYmluZCh0aGlzKSlcblxuICAgICMgV2hlbiBwcmVzZXQtb2NjdXJyZW5jZSB3YXMgZXhpc3RzLCBvcGVyYXRlIG9uIG9jY3VycmVuY2Utd2lzZVxuICAgIGlmIEBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlIGFuZCBAb2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpXG4gICAgICBAb2NjdXJyZW5jZSA9IHRydWVcblxuICAgICMgW0ZJWE1FXSBPUkRFUi1NQVRURVJcbiAgICAjIFRvIHBpY2sgY3Vyc29yLXdvcmQgdG8gZmluZCBvY2N1cnJlbmNlIGJhc2UgcGF0dGVybi5cbiAgICAjIFRoaXMgaGFzIHRvIGJlIGRvbmUgQkVGT1JFIGNvbnZlcnRpbmcgcGVyc2lzdGVudC1zZWxlY3Rpb24gaW50byByZWFsLXNlbGVjdGlvbi5cbiAgICAjIFNpbmNlIHdoZW4gcGVyc2lzdGVudC1zZWxlY3Rpb24gaXMgYWN0dWFsbCBzZWxlY3RlZCwgaXQgY2hhbmdlIGN1cnNvciBwb3NpdGlvbi5cbiAgICBpZiBAb2NjdXJyZW5jZSBhbmQgbm90IEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcbiAgICAgIEBvY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKEBwYXR0ZXJuRm9yT2NjdXJyZW5jZSA/IEBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGUoQG9jY3VycmVuY2VUeXBlKSlcblxuXG4gICAgIyBUaGlzIGNoYW5nZSBjdXJzb3IgcG9zaXRpb24uXG4gICAgaWYgQHNlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb25JZk5lY2Vzc2FyeSgpXG4gICAgICAjIFtGSVhNRV0gc2VsZWN0aW9uLXdpc2UgaXMgbm90IHN5bmNoZWQgaWYgaXQgYWxyZWFkeSB2aXN1YWwtbW9kZVxuICAgICAgdW5sZXNzIEBtb2RlIGlzICd2aXN1YWwnXG4gICAgICAgIEB2aW1TdGF0ZS5tb2RlTWFuYWdlci5hY3RpdmF0ZSgndmlzdWFsJywgQHN3cmFwLmRldGVjdFdpc2UoQGVkaXRvcikpXG5cbiAgICBAdGFyZ2V0ID0gJ0N1cnJlbnRTZWxlY3Rpb24nIGlmIEBtb2RlIGlzICd2aXN1YWwnIGFuZCBAcmVxdWlyZVRhcmdldFxuICAgIEBzZXRUYXJnZXQoQG5ldyhAdGFyZ2V0KSkgaWYgXy5pc1N0cmluZyhAdGFyZ2V0KVxuXG4gIHN1YnNjcmliZVJlc2V0T2NjdXJyZW5jZVBhdHRlcm5JZk5lZWRlZDogLT5cbiAgICAjIFtDQVVUSU9OXVxuICAgICMgVGhpcyBtZXRob2QgaGFzIHRvIGJlIGNhbGxlZCBpbiBQUk9QRVIgdGltaW5nLlxuICAgICMgSWYgb2NjdXJyZW5jZSBpcyB0cnVlIGJ1dCBubyBwcmVzZXQtb2NjdXJyZW5jZVxuICAgICMgVHJlYXQgdGhhdCBgb2NjdXJyZW5jZWAgaXMgQk9VTkRFRCB0byBvcGVyYXRvciBpdHNlbGYsIHNvIGNsZWFucCBhdCBmaW5pc2hlZC5cbiAgICBpZiBAb2NjdXJyZW5jZSBhbmQgbm90IEBvY2N1cnJlbmNlTWFuYWdlci5oYXNNYXJrZXJzKClcbiAgICAgIEBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2soPT4gQG9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSlcblxuICBzZXRNb2RpZmllcjogKG9wdGlvbnMpIC0+XG4gICAgaWYgb3B0aW9ucy53aXNlP1xuICAgICAgQHdpc2UgPSBvcHRpb25zLndpc2VcbiAgICAgIHJldHVyblxuXG4gICAgaWYgb3B0aW9ucy5vY2N1cnJlbmNlP1xuICAgICAgQG9jY3VycmVuY2UgPSBvcHRpb25zLm9jY3VycmVuY2VcbiAgICAgIGlmIEBvY2N1cnJlbmNlXG4gICAgICAgIEBvY2N1cnJlbmNlVHlwZSA9IG9wdGlvbnMub2NjdXJyZW5jZVR5cGVcbiAgICAgICAgIyBUaGlzIGlzIG8gbW9kaWZpZXIgY2FzZShlLmcuIGBjIG8gcGAsIGBkIE8gZmApXG4gICAgICAgICMgV2UgUkVTRVQgZXhpc3Rpbmcgb2NjdXJlbmNlLW1hcmtlciB3aGVuIGBvYCBvciBgT2AgbW9kaWZpZXIgaXMgdHlwZWQgYnkgdXNlci5cbiAgICAgICAgcGF0dGVybiA9IEBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGUoQG9jY3VycmVuY2VUeXBlKVxuICAgICAgICBAb2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybihwYXR0ZXJuLCB7cmVzZXQ6IHRydWUsIEBvY2N1cnJlbmNlVHlwZX0pXG4gICAgICAgIEBvbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2soPT4gQG9jY3VycmVuY2VNYW5hZ2VyLnJlc2V0UGF0dGVybnMoKSlcblxuICAjIHJldHVybiB0cnVlL2ZhbHNlIHRvIGluZGljYXRlIHN1Y2Nlc3NcbiAgc2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbklmTmVjZXNzYXJ5OiAtPlxuICAgIGlmIEBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uIGFuZFxuICAgICAgICBAZ2V0Q29uZmlnKCdhdXRvU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbk9uT3BlcmF0ZScpIGFuZFxuICAgICAgICBub3QgQHBlcnNpc3RlbnRTZWxlY3Rpb24uaXNFbXB0eSgpXG5cbiAgICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLnNlbGVjdCgpXG4gICAgICBAZWRpdG9yLm1lcmdlSW50ZXJzZWN0aW5nU2VsZWN0aW9ucygpXG4gICAgICBmb3IgJHNlbGVjdGlvbiBpbiBAc3dyYXAuZ2V0U2VsZWN0aW9ucyhAZWRpdG9yKSB3aGVuIG5vdCAkc2VsZWN0aW9uLmhhc1Byb3BlcnRpZXMoKVxuICAgICAgICAkc2VsZWN0aW9uLnNhdmVQcm9wZXJ0aWVzKClcbiAgICAgIHRydWVcbiAgICBlbHNlXG4gICAgICBmYWxzZVxuXG4gIGdldFBhdHRlcm5Gb3JPY2N1cnJlbmNlVHlwZTogKG9jY3VycmVuY2VUeXBlKSAtPlxuICAgIHN3aXRjaCBvY2N1cnJlbmNlVHlwZVxuICAgICAgd2hlbiAnYmFzZSdcbiAgICAgICAgZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IsIEBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgd2hlbiAnc3Vid29yZCdcbiAgICAgICAgZ2V0U3Vid29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uKEBlZGl0b3IsIEBnZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuXG4gICMgdGFyZ2V0IGlzIFRleHRPYmplY3Qgb3IgTW90aW9uIHRvIG9wZXJhdGUgb24uXG4gIHNldFRhcmdldDogKEB0YXJnZXQpIC0+XG4gICAgQHRhcmdldC5vcGVyYXRvciA9IHRoaXNcbiAgICBAZW1pdERpZFNldFRhcmdldCh0aGlzKVxuXG4gICAgaWYgQGNhbkVhcmx5U2VsZWN0KClcbiAgICAgIEBub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKVxuICAgICAgQGNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQoJ3VuZG8nKVxuICAgICAgQHNlbGVjdFRhcmdldCgpXG4gICAgdGhpc1xuXG4gIHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBzZXRUZXh0VG9SZWdpc3RlcihzZWxlY3Rpb24uZ2V0VGV4dCgpLCBzZWxlY3Rpb24pXG5cbiAgc2V0VGV4dFRvUmVnaXN0ZXI6ICh0ZXh0LCBzZWxlY3Rpb24pIC0+XG4gICAgdGV4dCArPSBcIlxcblwiIGlmIChAdGFyZ2V0LmlzTGluZXdpc2UoKSBhbmQgKG5vdCB0ZXh0LmVuZHNXaXRoKCdcXG4nKSkpXG4gICAgaWYgdGV4dFxuICAgICAgQHZpbVN0YXRlLnJlZ2lzdGVyLnNldChudWxsLCB7dGV4dCwgc2VsZWN0aW9ufSlcblxuICAgICAgaWYgQHZpbVN0YXRlLnJlZ2lzdGVyLmlzVW5uYW1lZCgpXG4gICAgICAgIGlmIEBpbnN0YW5jZW9mKFwiRGVsZXRlXCIpIG9yIEBpbnN0YW5jZW9mKFwiQ2hhbmdlXCIpXG4gICAgICAgICAgaWYgbm90IEBuZWVkU2F2ZVRvTnVtYmVyZWRSZWdpc3RlcihAdGFyZ2V0KSBhbmQgaXNTaW5nbGVMaW5lVGV4dCh0ZXh0KSAjIHNtYWxsLWNoYW5nZVxuICAgICAgICAgICAgQHZpbVN0YXRlLnJlZ2lzdGVyLnNldCgnLScsIHt0ZXh0LCBzZWxlY3Rpb259KVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5zZXQoJzEnLCB7dGV4dCwgc2VsZWN0aW9ufSlcblxuICAgICAgICBlbHNlIGlmIEBpbnN0YW5jZW9mKFwiWWFua1wiKVxuICAgICAgICAgIEB2aW1TdGF0ZS5yZWdpc3Rlci5zZXQoJzAnLCB7dGV4dCwgc2VsZWN0aW9ufSlcblxuICBuZWVkU2F2ZVRvTnVtYmVyZWRSZWdpc3RlcjogKHRhcmdldCkgLT5cbiAgICAjIFVzZWQgdG8gZGV0ZXJtaW5lIHdoYXQgcmVnaXN0ZXIgdG8gdXNlIG9uIGNoYW5nZSBhbmQgZGVsZXRlIG9wZXJhdGlvbi5cbiAgICAjIEZvbGxvd2luZyBtb3Rpb24gc2hvdWxkIHNhdmUgdG8gMS05IHJlZ2lzdGVyIHJlZ2VyZGxlc3Mgb2YgY29udGVudCBpcyBzbWFsbCBvciBiaWcuXG4gICAgZ29lc1RvTnVtYmVyZWRSZWdpc3Rlck1vdGlvbk5hbWVzID0gW1xuICAgICAgXCJNb3ZlVG9QYWlyXCIgIyAlXG4gICAgICBcIk1vdmVUb05leHRTZW50ZW5jZVwiICMgKCwgKVxuICAgICAgXCJTZWFyY2hcIiAjIC8sID8sIG4sIE5cbiAgICAgIFwiTW92ZVRvTmV4dFBhcmFncmFwaFwiICMgeywgfVxuICAgIF1cbiAgICBnb2VzVG9OdW1iZXJlZFJlZ2lzdGVyTW90aW9uTmFtZXMuc29tZSgobmFtZSkgLT4gdGFyZ2V0Lmluc3RhbmNlb2YobmFtZSkpXG5cbiAgbm9ybWFsaXplU2VsZWN0aW9uc0lmTmVjZXNzYXJ5OiAtPlxuICAgIGlmIEB0YXJnZXQ/LmlzTW90aW9uKCkgYW5kIChAbW9kZSBpcyAndmlzdWFsJylcbiAgICAgIEBzd3JhcC5ub3JtYWxpemUoQGVkaXRvcilcblxuICBzdGFydE11dGF0aW9uOiAoZm4pIC0+XG4gICAgaWYgQGNhbkVhcmx5U2VsZWN0KClcbiAgICAgICMgLSBTa2lwIHNlbGVjdGlvbiBub3JtYWxpemF0aW9uOiBhbHJlYWR5IG5vcm1hbGl6ZWQgYmVmb3JlIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgIyAtIE1hbnVhbCBjaGVja3BvaW50IGdyb3VwaW5nOiB0byBjcmVhdGUgY2hlY2twb2ludCBiZWZvcmUgQHNlbGVjdFRhcmdldCgpXG4gICAgICBmbigpXG4gICAgICBAZW1pdFdpbGxGaW5pc2hNdXRhdGlvbigpXG4gICAgICBAZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50KCd1bmRvJylcblxuICAgIGVsc2VcbiAgICAgIEBub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKVxuICAgICAgQGVkaXRvci50cmFuc2FjdCA9PlxuICAgICAgICBmbigpXG4gICAgICAgIEBlbWl0V2lsbEZpbmlzaE11dGF0aW9uKClcblxuICAgIEBlbWl0RGlkRmluaXNoTXV0YXRpb24oKVxuXG4gICMgTWFpblxuICBleGVjdXRlOiAtPlxuICAgIEBzdGFydE11dGF0aW9uID0+XG4gICAgICBpZiBAc2VsZWN0VGFyZ2V0KClcbiAgICAgICAgaWYgQG11dGF0ZVNlbGVjdGlvbk9yZGVyZFxuICAgICAgICAgIHNlbGVjdGlvbnMgPSBAZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBzZWxlY3Rpb25zID0gQGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgZm9yIHNlbGVjdGlvbiBpbiBzZWxlY3Rpb25zXG4gICAgICAgICAgQG11dGF0ZVNlbGVjdGlvbihzZWxlY3Rpb24pXG4gICAgICAgIEBtdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludCgnZGlkLWZpbmlzaCcpXG4gICAgICAgIEByZXN0b3JlQ3Vyc29yUG9zaXRpb25zSWZOZWNlc3NhcnkoKVxuXG4gICAgIyBFdmVuIHRob3VnaCB3ZSBmYWlsIHRvIHNlbGVjdCB0YXJnZXQgYW5kIGZhaWwgdG8gbXV0YXRlLFxuICAgICMgd2UgaGF2ZSB0byByZXR1cm4gdG8gbm9ybWFsLW1vZGUgZnJvbSBvcGVyYXRvci1wZW5kaW5nIG9yIHZpc3VhbFxuICAgIEBhY3RpdmF0ZU1vZGUoJ25vcm1hbCcpXG5cbiAgIyBSZXR1cm4gdHJ1ZSB1bmxlc3MgYWxsIHNlbGVjdGlvbiBpcyBlbXB0eS5cbiAgc2VsZWN0VGFyZ2V0OiAtPlxuICAgIHJldHVybiBAdGFyZ2V0U2VsZWN0ZWQgaWYgQHRhcmdldFNlbGVjdGVkP1xuICAgIEBtdXRhdGlvbk1hbmFnZXIuaW5pdCh7QHN0YXlCeU1hcmtlcn0pXG5cbiAgICBAdGFyZ2V0LmZvcmNlV2lzZShAd2lzZSkgaWYgQHdpc2U/XG4gICAgQGVtaXRXaWxsU2VsZWN0VGFyZ2V0KClcblxuICAgICMgQWxsb3cgY3Vyc29yIHBvc2l0aW9uIGFkanVzdG1lbnQgJ29uLXdpbGwtc2VsZWN0LXRhcmdldCcgaG9vay5cbiAgICAjIHNvIGNoZWNrcG9pbnQgY29tZXMgQUZURVIgQGVtaXRXaWxsU2VsZWN0VGFyZ2V0KClcbiAgICBAbXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoJ3dpbGwtc2VsZWN0JylcblxuICAgICMgTk9URVxuICAgICMgU2luY2UgTW92ZVRvTmV4dE9jY3VycmVuY2UsIE1vdmVUb1ByZXZpb3VzT2NjdXJyZW5jZSBtb3Rpb24gbW92ZSBieVxuICAgICMgIG9jY3VycmVuY2UtbWFya2VyLCBvY2N1cnJlbmNlLW1hcmtlciBoYXMgdG8gYmUgY3JlYXRlZCBCRUZPUkUgYEB0YXJnZXQuZXhlY3V0ZSgpYFxuICAgICMgQW5kIHdoZW4gcmVwZWF0ZWQsIG9jY3VycmVuY2UgcGF0dGVybiBpcyBhbHJlYWR5IGNhY2hlZCBhdCBAcGF0dGVybkZvck9jY3VycmVuY2VcbiAgICBpZiBAcmVwZWF0ZWQgYW5kIEBvY2N1cnJlbmNlIGFuZCBub3QgQG9jY3VycmVuY2VNYW5hZ2VyLmhhc01hcmtlcnMoKVxuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4oQHBhdHRlcm5Gb3JPY2N1cnJlbmNlLCB7QG9jY3VycmVuY2VUeXBlfSlcblxuICAgIEB0YXJnZXQuZXhlY3V0ZSgpXG5cbiAgICBAbXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoJ2RpZC1zZWxlY3QnKVxuICAgIGlmIEBvY2N1cnJlbmNlXG4gICAgICAjIFRvIHJlcG9lYXQoYC5gKSBvcGVyYXRpb24gd2hlcmUgbXVsdGlwbGUgb2NjdXJyZW5jZSBwYXR0ZXJucyB3YXMgc2V0LlxuICAgICAgIyBIZXJlIHdlIHNhdmUgcGF0dGVybnMgd2hpY2ggcmVwcmVzZW50IHVuaW9uZWQgcmVnZXggd2hpY2ggQG9jY3VycmVuY2VNYW5hZ2VyIGtub3dzLlxuICAgICAgQHBhdHRlcm5Gb3JPY2N1cnJlbmNlID89IEBvY2N1cnJlbmNlTWFuYWdlci5idWlsZFBhdHRlcm4oKVxuXG4gICAgICBAb2NjdXJyZW5jZVdpc2UgPSBAd2lzZSA/IFwiY2hhcmFjdGVyd2lzZVwiXG4gICAgICBpZiBAb2NjdXJyZW5jZU1hbmFnZXIuc2VsZWN0KEBvY2N1cnJlbmNlV2lzZSlcbiAgICAgICAgQG9jY3VycmVuY2VTZWxlY3RlZCA9IHRydWVcbiAgICAgICAgQG11dGF0aW9uTWFuYWdlci5zZXRDaGVja3BvaW50KCdkaWQtc2VsZWN0LW9jY3VycmVuY2UnKVxuXG4gICAgaWYgQHRhcmdldFNlbGVjdGVkID0gQHZpbVN0YXRlLmhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb24oKSBvciBAdGFyZ2V0Lm5hbWUgaXMgXCJFbXB0eVwiXG4gICAgICBAZW1pdERpZFNlbGVjdFRhcmdldCgpXG4gICAgICBAZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgICBAdHJhY2tDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgZWxzZVxuICAgICAgQGVtaXREaWRGYWlsU2VsZWN0VGFyZ2V0KClcbiAgICByZXR1cm4gQHRhcmdldFNlbGVjdGVkXG5cbiAgcmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5OiAtPlxuICAgIHJldHVybiB1bmxlc3MgQHJlc3RvcmVQb3NpdGlvbnNcbiAgICBzdGF5ID0gQHN0YXlBdFNhbWVQb3NpdGlvbiA/IEBnZXRDb25maWcoQHN0YXlPcHRpb25OYW1lKSBvciAoQG9jY3VycmVuY2VTZWxlY3RlZCBhbmQgQGdldENvbmZpZygnc3RheU9uT2NjdXJyZW5jZScpKVxuICAgIHdpc2UgPSBpZiBAb2NjdXJyZW5jZVNlbGVjdGVkIHRoZW4gQG9jY3VycmVuY2VXaXNlIGVsc2UgQHRhcmdldC53aXNlXG4gICAgQG11dGF0aW9uTWFuYWdlci5yZXN0b3JlQ3Vyc29yUG9zaXRpb25zKHtzdGF5LCB3aXNlLCBAc2V0VG9GaXJzdENoYXJhY3Rlck9uTGluZXdpc2V9KVxuXG4jIFNlbGVjdFxuIyBXaGVuIHRleHQtb2JqZWN0IGlzIGludm9rZWQgZnJvbSBub3JtYWwgb3Igdml1c2FsLW1vZGUsIG9wZXJhdGlvbiB3b3VsZCBiZVxuIyAgPT4gU2VsZWN0IG9wZXJhdG9yIHdpdGggdGFyZ2V0PXRleHQtb2JqZWN0XG4jIFdoZW4gbW90aW9uIGlzIGludm9rZWQgZnJvbSB2aXN1YWwtbW9kZSwgb3BlcmF0aW9uIHdvdWxkIGJlXG4jICA9PiBTZWxlY3Qgb3BlcmF0b3Igd2l0aCB0YXJnZXQ9bW90aW9uKVxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuIyBTZWxlY3QgaXMgdXNlZCBpbiBUV08gc2l0dWF0aW9uLlxuIyAtIHZpc3VhbC1tb2RlIG9wZXJhdGlvblxuIyAgIC0gZS5nOiBgdiBsYCwgYFYgamAsIGB2IGkgcGAuLi5cbiMgLSBEaXJlY3RseSBpbnZva2UgdGV4dC1vYmplY3QgZnJvbSBub3JtYWwtbW9kZVxuIyAgIC0gZS5nOiBJbnZva2UgYElubmVyIFBhcmFncmFwaGAgZnJvbSBjb21tYW5kLXBhbGV0dGUuXG5jbGFzcyBTZWxlY3QgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKGZhbHNlKVxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgcmVjb3JkYWJsZTogZmFsc2VcbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogZmFsc2VcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbjogZmFsc2VcblxuICBleGVjdXRlOiAtPlxuICAgIEBzdGFydE11dGF0aW9uKEBzZWxlY3RUYXJnZXQuYmluZCh0aGlzKSlcblxuICAgIGlmIEB0YXJnZXQuaXNUZXh0T2JqZWN0KCkgYW5kIEB0YXJnZXQuc2VsZWN0U3VjY2VlZGVkXG4gICAgICBAZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKVxuICAgICAgQGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCd2aXN1YWwnLCBAdGFyZ2V0Lndpc2UpXG5cbmNsYXNzIFNlbGVjdExhdGVzdENoYW5nZSBleHRlbmRzIFNlbGVjdFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlNlbGVjdCBsYXRlc3QgeWFua2VkIG9yIGNoYW5nZWQgcmFuZ2VcIlxuICB0YXJnZXQ6ICdBTGF0ZXN0Q2hhbmdlJ1xuXG5jbGFzcyBTZWxlY3RQcmV2aW91c1NlbGVjdGlvbiBleHRlbmRzIFNlbGVjdFxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiBcIlByZXZpb3VzU2VsZWN0aW9uXCJcblxuY2xhc3MgU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIFNlbGVjdFxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIlNlbGVjdCBwZXJzaXN0ZW50LXNlbGVjdGlvbiBhbmQgY2xlYXIgYWxsIHBlcnNpc3RlbnQtc2VsZWN0aW9uLCBpdCdzIGxpa2UgY29udmVydCB0byByZWFsLXNlbGVjdGlvblwiXG4gIHRhcmdldDogXCJBUGVyc2lzdGVudFNlbGVjdGlvblwiXG5cbmNsYXNzIFNlbGVjdE9jY3VycmVuY2UgZXh0ZW5kcyBPcGVyYXRvclxuICBAZXh0ZW5kKClcbiAgQGRlc2NyaXB0aW9uOiBcIkFkZCBzZWxlY3Rpb24gb250byBlYWNoIG1hdGNoaW5nIHdvcmQgd2l0aGluIHRhcmdldCByYW5nZVwiXG4gIG9jY3VycmVuY2U6IHRydWVcblxuICBleGVjdXRlOiAtPlxuICAgIEBzdGFydE11dGF0aW9uID0+XG4gICAgICBpZiBAc2VsZWN0VGFyZ2V0KClcbiAgICAgICAgQGFjdGl2YXRlTW9kZUlmTmVjZXNzYXJ5KCd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZScpXG5cbiMgUGVyc2lzdGVudCBTZWxlY3Rpb25cbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgQ3JlYXRlUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgc3RheUF0U2FtZVBvc2l0aW9uOiB0cnVlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2U6IGZhbHNlXG4gIGFjY2VwdFBlcnNpc3RlbnRTZWxlY3Rpb246IGZhbHNlXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIEBwZXJzaXN0ZW50U2VsZWN0aW9uLm1hcmtCdWZmZXJSYW5nZShzZWxlY3Rpb24uZ2V0QnVmZmVyUmFuZ2UoKSlcblxuY2xhc3MgVG9nZ2xlUGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIENyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb25cbiAgQGV4dGVuZCgpXG5cbiAgaXNDb21wbGV0ZTogLT5cbiAgICBwb2ludCA9IEBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuICAgIEBtYXJrZXJUb1JlbW92ZSA9IEBwZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckF0UG9pbnQocG9pbnQpXG4gICAgaWYgQG1hcmtlclRvUmVtb3ZlXG4gICAgICB0cnVlXG4gICAgZWxzZVxuICAgICAgc3VwZXJcblxuICBleGVjdXRlOiAtPlxuICAgIGlmIEBtYXJrZXJUb1JlbW92ZVxuICAgICAgQG1hcmtlclRvUmVtb3ZlLmRlc3Ryb3koKVxuICAgIGVsc2VcbiAgICAgIHN1cGVyXG5cbiMgUHJlc2V0IE9jY3VycmVuY2VcbiMgPT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgVG9nZ2xlUHJlc2V0T2NjdXJyZW5jZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiRW1wdHlcIlxuICBmbGFzaFRhcmdldDogZmFsc2VcbiAgYWNjZXB0UHJlc2V0T2NjdXJyZW5jZTogZmFsc2VcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbjogZmFsc2VcbiAgb2NjdXJyZW5jZVR5cGU6ICdiYXNlJ1xuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgbWFya2VyID0gQG9jY3VycmVuY2VNYW5hZ2VyLmdldE1hcmtlckF0UG9pbnQoQGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyLmRlc3Ryb3lNYXJrZXJzKFttYXJrZXJdKVxuICAgIGVsc2VcbiAgICAgIHBhdHRlcm4gPSBudWxsXG4gICAgICBpc05hcnJvd2VkID0gQHZpbVN0YXRlLm1vZGVNYW5hZ2VyLmlzTmFycm93ZWQoKVxuXG4gICAgICBpZiBAbW9kZSBpcyAndmlzdWFsJyBhbmQgbm90IGlzTmFycm93ZWRcbiAgICAgICAgQG9jY3VycmVuY2VUeXBlID0gJ2Jhc2UnXG4gICAgICAgIHBhdHRlcm4gPSBuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKEBlZGl0b3IuZ2V0U2VsZWN0ZWRUZXh0KCkpLCAnZycpXG4gICAgICBlbHNlXG4gICAgICAgIHBhdHRlcm4gPSBAZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKEBvY2N1cnJlbmNlVHlwZSlcblxuICAgICAgQG9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4ocGF0dGVybiwge0BvY2N1cnJlbmNlVHlwZX0pXG4gICAgICBAb2NjdXJyZW5jZU1hbmFnZXIuc2F2ZUxhc3RQYXR0ZXJuKEBvY2N1cnJlbmNlVHlwZSlcblxuICAgICAgQGFjdGl2YXRlTW9kZSgnbm9ybWFsJykgdW5sZXNzIGlzTmFycm93ZWRcblxuY2xhc3MgVG9nZ2xlUHJlc2V0U3Vid29yZE9jY3VycmVuY2UgZXh0ZW5kcyBUb2dnbGVQcmVzZXRPY2N1cnJlbmNlXG4gIEBleHRlbmQoKVxuICBvY2N1cnJlbmNlVHlwZTogJ3N1YndvcmQnXG5cbiMgV2FudCB0byByZW5hbWUgUmVzdG9yZU9jY3VycmVuY2VNYXJrZXJcbmNsYXNzIEFkZFByZXNldE9jY3VycmVuY2VGcm9tTGFzdE9jY3VycmVuY2VQYXR0ZXJuIGV4dGVuZHMgVG9nZ2xlUHJlc2V0T2NjdXJyZW5jZVxuICBAZXh0ZW5kKClcbiAgZXhlY3V0ZTogLT5cbiAgICBAb2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpXG4gICAgaWYgcGF0dGVybiA9IEB2aW1TdGF0ZS5nbG9iYWxTdGF0ZS5nZXQoJ2xhc3RPY2N1cnJlbmNlUGF0dGVybicpXG4gICAgICBvY2N1cnJlbmNlVHlwZSA9IEB2aW1TdGF0ZS5nbG9iYWxTdGF0ZS5nZXQoXCJsYXN0T2NjdXJyZW5jZVR5cGVcIilcbiAgICAgIEBvY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKHBhdHRlcm4sIHtvY2N1cnJlbmNlVHlwZX0pXG4gICAgICBAYWN0aXZhdGVNb2RlKCdub3JtYWwnKVxuXG4jIERlbGV0ZVxuIyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGVsZXRlIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIHRyYWNrQ2hhbmdlOiB0cnVlXG4gIGZsYXNoQ2hlY2twb2ludDogJ2RpZC1zZWxlY3Qtb2NjdXJyZW5jZSdcbiAgZmxhc2hUeXBlRm9yT2NjdXJyZW5jZTogJ29wZXJhdG9yLXJlbW92ZS1vY2N1cnJlbmNlJ1xuICBzdGF5T3B0aW9uTmFtZTogJ3N0YXlPbkRlbGV0ZSdcbiAgc2V0VG9GaXJzdENoYXJhY3Rlck9uTGluZXdpc2U6IHRydWVcblxuICBleGVjdXRlOiAtPlxuICAgIEBvbkRpZFNlbGVjdFRhcmdldCA9PlxuICAgICAgQGZsYXNoVGFyZ2V0ID0gZmFsc2UgaWYgKEBvY2N1cnJlbmNlU2VsZWN0ZWQgYW5kIEBvY2N1cnJlbmNlV2lzZSBpcyBcImxpbmV3aXNlXCIpXG5cbiAgICBAcmVzdG9yZVBvc2l0aW9ucyA9IGZhbHNlICBpZiBAdGFyZ2V0Lndpc2UgaXMgJ2Jsb2Nrd2lzZSdcbiAgICBzdXBlclxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICBAc2V0VGV4dFRvUmVnaXN0ZXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIHNlbGVjdGlvbi5kZWxldGVTZWxlY3RlZFRleHQoKVxuXG5jbGFzcyBEZWxldGVSaWdodCBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVJpZ2h0J1xuXG5jbGFzcyBEZWxldGVMZWZ0IGV4dGVuZHMgRGVsZXRlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6ICdNb3ZlTGVmdCdcblxuY2xhc3MgRGVsZXRlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgRGVsZXRlXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6ICdNb3ZlVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lJ1xuXG4gIGV4ZWN1dGU6IC0+XG4gICAgaWYgQHRhcmdldC53aXNlIGlzICdibG9ja3dpc2UnXG4gICAgICBAb25EaWRTZWxlY3RUYXJnZXQgPT5cbiAgICAgICAgZm9yIGJsb2Nrd2lzZVNlbGVjdGlvbiBpbiBAZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucygpXG4gICAgICAgICAgYmxvY2t3aXNlU2VsZWN0aW9uLmV4dGVuZE1lbWJlclNlbGVjdGlvbnNUb0VuZE9mTGluZSgpXG4gICAgc3VwZXJcblxuY2xhc3MgRGVsZXRlTGluZSBleHRlbmRzIERlbGV0ZVxuICBAZXh0ZW5kKClcbiAgd2lzZTogJ2xpbmV3aXNlJ1xuICB0YXJnZXQ6IFwiTW92ZVRvUmVsYXRpdmVMaW5lXCJcbiAgZmxhc2hUYXJnZXQ6IGZhbHNlXG5cbiMgWWFua1xuIyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBZYW5rIGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIHRyYWNrQ2hhbmdlOiB0cnVlXG4gIHN0YXlPcHRpb25OYW1lOiAnc3RheU9uWWFuaydcblxuICBtdXRhdGVTZWxlY3Rpb246IChzZWxlY3Rpb24pIC0+XG4gICAgQHNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcblxuY2xhc3MgWWFua0xpbmUgZXh0ZW5kcyBZYW5rXG4gIEBleHRlbmQoKVxuICB3aXNlOiAnbGluZXdpc2UnXG4gIHRhcmdldDogXCJNb3ZlVG9SZWxhdGl2ZUxpbmVcIlxuXG5jbGFzcyBZYW5rVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgWWFua1xuICBAZXh0ZW5kKClcbiAgdGFyZ2V0OiAnTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZSdcblxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIFtjdHJsLWFdXG5jbGFzcyBJbmNyZWFzZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICB0YXJnZXQ6IFwiRW1wdHlcIiAjIGN0cmwtYSBpbiBub3JtYWwtbW9kZSBmaW5kIHRhcmdldCBudW1iZXIgaW4gY3VycmVudCBsaW5lIG1hbnVhbGx5XG4gIGZsYXNoVGFyZ2V0OiBmYWxzZSAjIGRvIG1hbnVhbGx5XG4gIHJlc3RvcmVQb3NpdGlvbnM6IGZhbHNlICMgZG8gbWFudWFsbHlcbiAgc3RlcDogMVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG5ld1JhbmdlcyA9IFtdXG4gICAgc3VwZXJcbiAgICBpZiBAbmV3UmFuZ2VzLmxlbmd0aFxuICAgICAgaWYgQGdldENvbmZpZygnZmxhc2hPbk9wZXJhdGUnKSBhbmQgQG5hbWUgbm90IGluIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlQmxhY2tsaXN0JylcbiAgICAgICAgQHZpbVN0YXRlLmZsYXNoKEBuZXdSYW5nZXMsIHR5cGU6IEBmbGFzaFR5cGVGb3JPY2N1cnJlbmNlKVxuXG4gIHJlcGxhY2VOdW1iZXJJbkJ1ZmZlclJhbmdlOiAoc2NhblJhbmdlLCBmbj1udWxsKSAtPlxuICAgIG5ld1JhbmdlcyA9IFtdXG4gICAgQHBhdHRlcm4gPz0gLy8vI3tAZ2V0Q29uZmlnKCdudW1iZXJSZWdleCcpfS8vL2dcbiAgICBAc2NhbkZvcndhcmQgQHBhdHRlcm4sIHtzY2FuUmFuZ2V9LCAoZXZlbnQpID0+XG4gICAgICByZXR1cm4gaWYgZm4/IGFuZCBub3QgZm4oZXZlbnQpXG4gICAgICB7bWF0Y2hUZXh0LCByZXBsYWNlfSA9IGV2ZW50XG4gICAgICBuZXh0TnVtYmVyID0gQGdldE5leHROdW1iZXIobWF0Y2hUZXh0KVxuICAgICAgbmV3UmFuZ2VzLnB1c2gocmVwbGFjZShTdHJpbmcobmV4dE51bWJlcikpKVxuICAgIG5ld1Jhbmdlc1xuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgIGlmIEB0YXJnZXQuaXMoJ0VtcHR5JykgIyBjdHJsLWEsIGN0cmwteCBpbiBgbm9ybWFsLW1vZGVgXG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG4gICAgICBzY2FuUmFuZ2UgPSBAZWRpdG9yLmJ1ZmZlclJhbmdlRm9yQnVmZmVyUm93KGN1cnNvclBvc2l0aW9uLnJvdylcbiAgICAgIG5ld1JhbmdlcyA9IEByZXBsYWNlTnVtYmVySW5CdWZmZXJSYW5nZSBzY2FuUmFuZ2UsICh7cmFuZ2UsIHN0b3B9KSAtPlxuICAgICAgICBpZiByYW5nZS5lbmQuaXNHcmVhdGVyVGhhbihjdXJzb3JQb3NpdGlvbilcbiAgICAgICAgICBzdG9wKClcbiAgICAgICAgICB0cnVlXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBmYWxzZVxuXG4gICAgICBwb2ludCA9IG5ld1Jhbmdlc1swXT8uZW5kLnRyYW5zbGF0ZShbMCwgLTFdKSA/IGN1cnNvclBvc2l0aW9uXG4gICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24ocG9pbnQpXG4gICAgZWxzZVxuICAgICAgc2NhblJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIEBuZXdSYW5nZXMucHVzaChAcmVwbGFjZU51bWJlckluQnVmZmVyUmFuZ2Uoc2NhblJhbmdlKS4uLilcbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihzY2FuUmFuZ2Uuc3RhcnQpXG5cbiAgZ2V0TmV4dE51bWJlcjogKG51bWJlclN0cmluZykgLT5cbiAgICBOdW1iZXIucGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCkgKyBAc3RlcCAqIEBnZXRDb3VudCgpXG5cbiMgW2N0cmwteF1cbmNsYXNzIERlY3JlYXNlIGV4dGVuZHMgSW5jcmVhc2VcbiAgQGV4dGVuZCgpXG4gIHN0ZXA6IC0xXG5cbiMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuIyBbZyBjdHJsLWFdXG5jbGFzcyBJbmNyZW1lbnROdW1iZXIgZXh0ZW5kcyBJbmNyZWFzZVxuICBAZXh0ZW5kKClcbiAgYmFzZU51bWJlcjogbnVsbFxuICB0YXJnZXQ6IG51bGxcbiAgbXV0YXRlU2VsZWN0aW9uT3JkZXJkOiB0cnVlXG5cbiAgZ2V0TmV4dE51bWJlcjogKG51bWJlclN0cmluZykgLT5cbiAgICBpZiBAYmFzZU51bWJlcj9cbiAgICAgIEBiYXNlTnVtYmVyICs9IEBzdGVwICogQGdldENvdW50KClcbiAgICBlbHNlXG4gICAgICBAYmFzZU51bWJlciA9IE51bWJlci5wYXJzZUludChudW1iZXJTdHJpbmcsIDEwKVxuICAgIEBiYXNlTnVtYmVyXG5cbiMgW2cgY3RybC14XVxuY2xhc3MgRGVjcmVtZW50TnVtYmVyIGV4dGVuZHMgSW5jcmVtZW50TnVtYmVyXG4gIEBleHRlbmQoKVxuICBzdGVwOiAtMVxuXG4jIFB1dFxuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4jIEN1cnNvciBwbGFjZW1lbnQ6XG4jIC0gcGxhY2UgYXQgZW5kIG9mIG11dGF0aW9uOiBwYXN0ZSBub24tbXVsdGlsaW5lIGNoYXJhY3Rlcndpc2UgdGV4dFxuIyAtIHBsYWNlIGF0IHN0YXJ0IG9mIG11dGF0aW9uOiBub24tbXVsdGlsaW5lIGNoYXJhY3Rlcndpc2UgdGV4dChjaGFyYWN0ZXJ3aXNlLCBsaW5ld2lzZSlcbmNsYXNzIFB1dEJlZm9yZSBleHRlbmRzIE9wZXJhdG9yXG4gIEBleHRlbmQoKVxuICBsb2NhdGlvbjogJ2JlZm9yZSdcbiAgdGFyZ2V0OiAnRW1wdHknXG4gIGZsYXNoVHlwZTogJ29wZXJhdG9yLWxvbmcnXG4gIHJlc3RvcmVQb3NpdGlvbnM6IGZhbHNlICMgbWFuYWdlIG1hbnVhbGx5XG4gIGZsYXNoVGFyZ2V0OiBmYWxzZSAjIG1hbmFnZSBtYW51YWxseVxuICB0cmFja0NoYW5nZTogZmFsc2UgIyBtYW5hZ2UgbWFudWFsbHlcblxuICBpbml0aWFsaXplOiAtPlxuICAgIEB2aW1TdGF0ZS5zZXF1ZW50aWFsUGFzdGVNYW5hZ2VyLm9uSW5pdGlhbGl6ZSh0aGlzKVxuXG4gIGV4ZWN1dGU6IC0+XG4gICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uID0gbmV3IE1hcCgpXG4gICAgQHNlcXVlbnRpYWxQYXN0ZSA9IEB2aW1TdGF0ZS5zZXF1ZW50aWFsUGFzdGVNYW5hZ2VyLm9uRXhlY3V0ZSh0aGlzKVxuXG4gICAgQG9uRGlkRmluaXNoTXV0YXRpb24gPT5cbiAgICAgIEBhZGp1c3RDdXJzb3JQb3NpdGlvbigpIHVubGVzcyBAY2FuY2VsbGVkXG5cbiAgICBzdXBlclxuXG4gICAgcmV0dXJuIGlmIEBjYW5jZWxsZWRcblxuICAgIEBvbkRpZEZpbmlzaE9wZXJhdGlvbiA9PlxuICAgICAgIyBUcmFja0NoYW5nZVxuICAgICAgaWYgbmV3UmFuZ2UgPSBAbXV0YXRpb25zQnlTZWxlY3Rpb24uZ2V0KEBlZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgICAgICBAc2V0TWFya0ZvckNoYW5nZShuZXdSYW5nZSlcblxuICAgICAgIyBGbGFzaFxuICAgICAgaWYgQGdldENvbmZpZygnZmxhc2hPbk9wZXJhdGUnKSBhbmQgQG5hbWUgbm90IGluIEBnZXRDb25maWcoJ2ZsYXNoT25PcGVyYXRlQmxhY2tsaXN0JylcbiAgICAgICAgdG9SYW5nZSA9IChzZWxlY3Rpb24pID0+IEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQoc2VsZWN0aW9uKVxuICAgICAgICBAdmltU3RhdGUuZmxhc2goQGVkaXRvci5nZXRTZWxlY3Rpb25zKCkubWFwKHRvUmFuZ2UpLCB0eXBlOiBAZ2V0Rmxhc2hUeXBlKCkpXG5cbiAgYWRqdXN0Q3Vyc29yUG9zaXRpb246IC0+XG4gICAgZm9yIHNlbGVjdGlvbiBpbiBAZWRpdG9yLmdldFNlbGVjdGlvbnMoKSB3aGVuIEBtdXRhdGlvbnNCeVNlbGVjdGlvbi5oYXMoc2VsZWN0aW9uKVxuICAgICAge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICAgIHtzdGFydCwgZW5kfSA9IG5ld1JhbmdlID0gQG11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICBpZiBAbGluZXdpc2VQYXN0ZVxuICAgICAgICBtb3ZlQ3Vyc29yVG9GaXJzdENoYXJhY3RlckF0Um93KGN1cnNvciwgc3RhcnQucm93KVxuICAgICAgZWxzZVxuICAgICAgICBpZiBuZXdSYW5nZS5pc1NpbmdsZUxpbmUoKVxuICAgICAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihlbmQudHJhbnNsYXRlKFswLCAtMV0pKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHN0YXJ0KVxuXG4gIG11dGF0ZVNlbGVjdGlvbjogKHNlbGVjdGlvbikgLT5cbiAgICB7dGV4dCwgdHlwZX0gPSBAdmltU3RhdGUucmVnaXN0ZXIuZ2V0KG51bGwsIHNlbGVjdGlvbiwgQHNlcXVlbnRpYWxQYXN0ZSlcbiAgICB1bmxlc3MgdGV4dFxuICAgICAgQGNhbmNlbGxlZCA9IHRydWVcbiAgICAgIHJldHVyblxuXG4gICAgdGV4dCA9IF8ubXVsdGlwbHlTdHJpbmcodGV4dCwgQGdldENvdW50KCkpXG4gICAgQGxpbmV3aXNlUGFzdGUgPSB0eXBlIGlzICdsaW5ld2lzZScgb3IgQGlzTW9kZSgndmlzdWFsJywgJ2xpbmV3aXNlJylcbiAgICBuZXdSYW5nZSA9IEBwYXN0ZShzZWxlY3Rpb24sIHRleHQsIHtAbGluZXdpc2VQYXN0ZX0pXG4gICAgQG11dGF0aW9uc0J5U2VsZWN0aW9uLnNldChzZWxlY3Rpb24sIG5ld1JhbmdlKVxuICAgIEB2aW1TdGF0ZS5zZXF1ZW50aWFsUGFzdGVNYW5hZ2VyLnNhdmVQYXN0ZWRSYW5nZUZvclNlbGVjdGlvbihzZWxlY3Rpb24sIG5ld1JhbmdlKVxuXG4gIHBhc3RlOiAoc2VsZWN0aW9uLCB0ZXh0LCB7bGluZXdpc2VQYXN0ZX0pIC0+XG4gICAgaWYgQHNlcXVlbnRpYWxQYXN0ZVxuICAgICAgQHBhc3RlQ2hhcmFjdGVyd2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgZWxzZSBpZiBsaW5ld2lzZVBhc3RlXG4gICAgICBAcGFzdGVMaW5ld2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgZWxzZVxuICAgICAgQHBhc3RlQ2hhcmFjdGVyd2lzZShzZWxlY3Rpb24sIHRleHQpXG5cbiAgcGFzdGVDaGFyYWN0ZXJ3aXNlOiAoc2VsZWN0aW9uLCB0ZXh0KSAtPlxuICAgIHtjdXJzb3J9ID0gc2VsZWN0aW9uXG4gICAgaWYgc2VsZWN0aW9uLmlzRW1wdHkoKSBhbmQgQGxvY2F0aW9uIGlzICdhZnRlcicgYW5kIG5vdCBpc0VtcHR5Um93KEBlZGl0b3IsIGN1cnNvci5nZXRCdWZmZXJSb3coKSlcbiAgICAgIGN1cnNvci5tb3ZlUmlnaHQoKVxuICAgIHJldHVybiBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuXG4gICMgUmV0dXJuIG5ld1JhbmdlXG4gIHBhc3RlTGluZXdpc2U6IChzZWxlY3Rpb24sIHRleHQpIC0+XG4gICAge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICB0ZXh0ICs9IFwiXFxuXCIgdW5sZXNzIHRleHQuZW5kc1dpdGgoXCJcXG5cIilcbiAgICBpZiBzZWxlY3Rpb24uaXNFbXB0eSgpXG4gICAgICBpZiBAbG9jYXRpb24gaXMgJ2JlZm9yZSdcbiAgICAgICAgaW5zZXJ0VGV4dEF0QnVmZmVyUG9zaXRpb24oQGVkaXRvciwgW2N1cnNvclJvdywgMF0sIHRleHQpXG4gICAgICBlbHNlIGlmIEBsb2NhdGlvbiBpcyAnYWZ0ZXInXG4gICAgICAgIHRhcmdldFJvdyA9IEBnZXRGb2xkRW5kUm93Rm9yUm93KGN1cnNvclJvdylcbiAgICAgICAgZW5zdXJlRW5kc1dpdGhOZXdMaW5lRm9yQnVmZmVyUm93KEBlZGl0b3IsIHRhcmdldFJvdylcbiAgICAgICAgaW5zZXJ0VGV4dEF0QnVmZmVyUG9zaXRpb24oQGVkaXRvciwgW3RhcmdldFJvdyArIDEsIDBdLCB0ZXh0KVxuICAgIGVsc2VcbiAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KFwiXFxuXCIpIHVubGVzcyBAaXNNb2RlKCd2aXN1YWwnLCAnbGluZXdpc2UnKVxuICAgICAgc2VsZWN0aW9uLmluc2VydFRleHQodGV4dClcblxuY2xhc3MgUHV0QWZ0ZXIgZXh0ZW5kcyBQdXRCZWZvcmVcbiAgQGV4dGVuZCgpXG4gIGxvY2F0aW9uOiAnYWZ0ZXInXG5cbmNsYXNzIFB1dEJlZm9yZVdpdGhBdXRvSW5kZW50IGV4dGVuZHMgUHV0QmVmb3JlXG4gIEBleHRlbmQoKVxuXG4gIHBhc3RlTGluZXdpc2U6IChzZWxlY3Rpb24sIHRleHQpIC0+XG4gICAgbmV3UmFuZ2UgPSBzdXBlclxuICAgIGFkanVzdEluZGVudFdpdGhLZWVwaW5nTGF5b3V0KEBlZGl0b3IsIG5ld1JhbmdlKVxuICAgIHJldHVybiBuZXdSYW5nZVxuXG5jbGFzcyBQdXRBZnRlcldpdGhBdXRvSW5kZW50IGV4dGVuZHMgUHV0QmVmb3JlV2l0aEF1dG9JbmRlbnRcbiAgQGV4dGVuZCgpXG4gIGxvY2F0aW9uOiAnYWZ0ZXInXG5cbmNsYXNzIEFkZEJsYW5rTGluZUJlbG93IGV4dGVuZHMgT3BlcmF0b3JcbiAgQGV4dGVuZCgpXG4gIGZsYXNoVGFyZ2V0OiBmYWxzZVxuICB0YXJnZXQ6IFwiRW1wdHlcIlxuICBzdGF5QXRTYW1lUG9zaXRpb246IHRydWVcbiAgc3RheUJ5TWFya2VyOiB0cnVlXG4gIHdoZXJlOiAnYmVsb3cnXG5cbiAgbXV0YXRlU2VsZWN0aW9uOiAoc2VsZWN0aW9uKSAtPlxuICAgIHJvdyA9IHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKS5yb3dcbiAgICByb3cgKz0gMSBpZiBAd2hlcmUgaXMgJ2JlbG93J1xuICAgIHBvaW50ID0gW3JvdywgMF1cbiAgICBAZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtwb2ludCwgcG9pbnRdLCBcIlxcblwiLnJlcGVhdChAZ2V0Q291bnQoKSkpXG5cbmNsYXNzIEFkZEJsYW5rTGluZUFib3ZlIGV4dGVuZHMgQWRkQmxhbmtMaW5lQmVsb3dcbiAgQGV4dGVuZCgpXG4gIHdoZXJlOiAnYWJvdmUnXG4iXX0=
