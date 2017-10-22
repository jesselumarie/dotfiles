"use babel";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require("underscore-plus");

var _require = require("./utils");

var isEmptyRow = _require.isEmptyRow;
var getWordPatternAtBufferPosition = _require.getWordPatternAtBufferPosition;
var getSubwordPatternAtBufferPosition = _require.getSubwordPatternAtBufferPosition;
var insertTextAtBufferPosition = _require.insertTextAtBufferPosition;
var setBufferRow = _require.setBufferRow;
var moveCursorToFirstCharacterAtRow = _require.moveCursorToFirstCharacterAtRow;
var ensureEndsWithNewLineForBufferRow = _require.ensureEndsWithNewLineForBufferRow;
var adjustIndentWithKeepingLayout = _require.adjustIndentWithKeepingLayout;
var isSingleLineText = _require.isSingleLineText;

var Base = require("./base");

var Operator = (function (_Base) {
  _inherits(Operator, _Base);

  function Operator() {
    _classCallCheck(this, Operator);

    _get(Object.getPrototypeOf(Operator.prototype), "constructor", this).apply(this, arguments);

    this.requireTarget = true;
    this.recordable = true;
    this.wise = null;
    this.occurrence = false;
    this.occurrenceType = "base";
    this.flashTarget = true;
    this.flashCheckpoint = "did-finish";
    this.flashType = "operator";
    this.flashTypeForOccurrence = "operator-occurrence";
    this.trackChange = false;
    this.patternForOccurrence = null;
    this.stayAtSamePosition = null;
    this.stayOptionName = null;
    this.stayByMarker = false;
    this.restorePositions = true;
    this.setToFirstCharacterOnLinewise = false;
    this.acceptPresetOccurrence = true;
    this.acceptPersistentSelection = true;
    this.bufferCheckpointByPurpose = null;
    this.mutateSelectionOrderd = false;
    this.supportEarlySelect = false;
    this.targetSelected = null;
  }

  _createClass(Operator, [{
    key: "canEarlySelect",
    value: function canEarlySelect() {
      return this.supportEarlySelect && !this.repeated;
    }

    // -------------------------

    // Called when operation finished
    // This is essentially to reset state for `.` repeat.
  }, {
    key: "resetState",
    value: function resetState() {
      this.targetSelected = null;
      this.occurrenceSelected = false;
    }

    // Two checkpoint for different purpose
    // - one for undo(handled by modeManager)
    // - one for preserve last inserted text
  }, {
    key: "createBufferCheckpoint",
    value: function createBufferCheckpoint(purpose) {
      if (!this.bufferCheckpointByPurpose) this.bufferCheckpointByPurpose = {};
      this.bufferCheckpointByPurpose[purpose] = this.editor.createCheckpoint();
    }
  }, {
    key: "getBufferCheckpoint",
    value: function getBufferCheckpoint(purpose) {
      if (this.bufferCheckpointByPurpose) {
        return this.bufferCheckpointByPurpose[purpose];
      }
    }
  }, {
    key: "deleteBufferCheckpoint",
    value: function deleteBufferCheckpoint(purpose) {
      if (this.bufferCheckpointByPurpose) {
        delete this.bufferCheckpointByPurpose[purpose];
      }
    }
  }, {
    key: "groupChangesSinceBufferCheckpoint",
    value: function groupChangesSinceBufferCheckpoint(purpose) {
      var checkpoint = this.getBufferCheckpoint(purpose);
      if (checkpoint) {
        this.editor.groupChangesSinceCheckpoint(checkpoint);
        this.deleteBufferCheckpoint(purpose);
      }
    }
  }, {
    key: "setMarkForChange",
    value: function setMarkForChange(range) {
      this.vimState.mark.set("[", range.start);
      this.vimState.mark.set("]", range.end);
    }
  }, {
    key: "needFlash",
    value: function needFlash() {
      return this.flashTarget && this.getConfig("flashOnOperate") && !this.getConfig("flashOnOperateBlacklist").includes(this.name) && (this.mode !== "visual" || this.submode !== this.target.wise) // e.g. Y in vC
      ;
    }
  }, {
    key: "flashIfNecessary",
    value: function flashIfNecessary(ranges) {
      if (this.needFlash()) {
        this.vimState.flash(ranges, { type: this.getFlashType() });
      }
    }
  }, {
    key: "flashChangeIfNecessary",
    value: function flashChangeIfNecessary() {
      var _this = this;

      if (this.needFlash()) {
        this.onDidFinishOperation(function () {
          var ranges = _this.mutationManager.getSelectedBufferRangesForCheckpoint(_this.flashCheckpoint);
          _this.vimState.flash(ranges, { type: _this.getFlashType() });
        });
      }
    }
  }, {
    key: "getFlashType",
    value: function getFlashType() {
      return this.occurrenceSelected ? this.flashTypeForOccurrence : this.flashType;
    }
  }, {
    key: "trackChangeIfNecessary",
    value: function trackChangeIfNecessary() {
      var _this2 = this;

      if (!this.trackChange) return;
      this.onDidFinishOperation(function () {
        var range = _this2.mutationManager.getMutatedBufferRangeForSelection(_this2.editor.getLastSelection());
        if (range) _this2.setMarkForChange(range);
      });
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var _this3 = this;

      this.subscribeResetOccurrencePatternIfNeeded();
      this.onDidSetOperatorModifier(function (options) {
        return _this3.setModifier(options);
      });

      // When preset-occurrence was exists, operate on occurrence-wise
      if (this.acceptPresetOccurrence && this.occurrenceManager.hasMarkers()) {
        this.occurrence = true;
      }

      // [FIXME] ORDER-MATTER
      // To pick cursor-word to find occurrence base pattern.
      // This has to be done BEFORE converting persistent-selection into real-selection.
      // Since when persistent-selection is actuall selected, it change cursor position.
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        var regex = this.patternForOccurrence || this.getPatternForOccurrenceType(this.occurrenceType);
        this.occurrenceManager.addPattern(regex);
      }

      // This change cursor position.
      if (this.selectPersistentSelectionIfNecessary()) {
        // [FIXME] selection-wise is not synched if it already visual-mode
        if (this.mode !== "visual") {
          this.vimState.modeManager.activate("visual", this.swrap.detectWise(this.editor));
        }
      }

      if (this.mode === "visual" && this.requireTarget) {
        this.target = "CurrentSelection";
      }
      if (_.isString(this.target)) {
        this.setTarget(this.getInstance(this.target));
      }

      return _get(Object.getPrototypeOf(Operator.prototype), "initialize", this).call(this);
    }
  }, {
    key: "subscribeResetOccurrencePatternIfNeeded",
    value: function subscribeResetOccurrencePatternIfNeeded() {
      var _this4 = this;

      // [CAUTION]
      // This method has to be called in PROPER timing.
      // If occurrence is true but no preset-occurrence
      // Treat that `occurrence` is BOUNDED to operator itself, so cleanp at finished.
      if (this.occurrence && !this.occurrenceManager.hasMarkers()) {
        this.onDidResetOperationStack(function () {
          return _this4.occurrenceManager.resetPatterns();
        });
      }
    }
  }, {
    key: "setModifier",
    value: function setModifier(_ref) {
      var _this5 = this;

      var wise = _ref.wise;
      var occurrence = _ref.occurrence;
      var occurrenceType = _ref.occurrenceType;

      if (wise) {
        this.wise = wise;
      } else if (occurrence) {
        this.occurrence = occurrence;
        this.occurrenceType = occurrenceType;
        // This is o modifier case(e.g. `c o p`, `d O f`)
        // We RESET existing occurence-marker when `o` or `O` modifier is typed by user.
        var regex = this.getPatternForOccurrenceType(occurrenceType);
        this.occurrenceManager.addPattern(regex, { reset: true, occurrenceType: occurrenceType });
        this.onDidResetOperationStack(function () {
          return _this5.occurrenceManager.resetPatterns();
        });
      }
    }

    // return true/false to indicate success
  }, {
    key: "selectPersistentSelectionIfNecessary",
    value: function selectPersistentSelectionIfNecessary() {
      if (this.acceptPersistentSelection && this.getConfig("autoSelectPersistentSelectionOnOperate") && !this.persistentSelection.isEmpty()) {
        this.persistentSelection.select();
        this.editor.mergeIntersectingSelections();
        for (var $selection of this.swrap.getSelections(this.editor)) {
          if (!$selection.hasProperties()) $selection.saveProperties();
        }

        return true;
      } else {
        return false;
      }
    }
  }, {
    key: "getPatternForOccurrenceType",
    value: function getPatternForOccurrenceType(occurrenceType) {
      if (occurrenceType === "base") {
        return getWordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
      } else if (occurrenceType === "subword") {
        return getSubwordPatternAtBufferPosition(this.editor, this.getCursorBufferPosition());
      }
    }

    // target is TextObject or Motion to operate on.
  }, {
    key: "setTarget",
    value: function setTarget(target) {
      this.target = target;
      this.target.operator = this;
      this.emitDidSetTarget(this);

      if (this.canEarlySelect()) {
        this.normalizeSelectionsIfNecessary();
        this.createBufferCheckpoint("undo");
        this.selectTarget();
      }
      return this;
    }
  }, {
    key: "setTextToRegisterForSelection",
    value: function setTextToRegisterForSelection(selection) {
      this.setTextToRegister(selection.getText(), selection);
    }
  }, {
    key: "setTextToRegister",
    value: function setTextToRegister(text, selection) {
      if (this.vimState.register.isUnnamed() && this.isBlackholeRegisteredOperator()) {
        return;
      }

      if (this.target.isLinewise() && !text.endsWith("\n")) {
        text += "\n";
      }

      if (text) {
        this.vimState.register.set(null, { text: text, selection: selection });

        if (this.vimState.register.isUnnamed()) {
          if (this["instanceof"]("Delete") || this["instanceof"]("Change")) {
            if (!this.needSaveToNumberedRegister(this.target) && isSingleLineText(text)) {
              this.vimState.register.set("-", { text: text, selection: selection }); // small-change
            } else {
                this.vimState.register.set("1", { text: text, selection: selection });
              }
          } else if (this["instanceof"]("Yank")) {
            this.vimState.register.set("0", { text: text, selection: selection });
          }
        }
      }
    }
  }, {
    key: "isBlackholeRegisteredOperator",
    value: function isBlackholeRegisteredOperator() {
      var operators = this.getConfig("blackholeRegisteredOperators");
      var wildCardOperators = operators.filter(function (name) {
        return name.endsWith("*");
      });
      var commandName = this.getCommandNameWithoutPrefix();
      return wildCardOperators.some(function (name) {
        return new RegExp("^" + name.replace("*", ".*")).test(commandName);
      }) || operators.includes(commandName);
    }
  }, {
    key: "needSaveToNumberedRegister",
    value: function needSaveToNumberedRegister(target) {
      // Used to determine what register to use on change and delete operation.
      // Following motion should save to 1-9 register regerdless of content is small or big.
      var goesToNumberedRegisterMotionNames = ["MoveToPair", // %
      "MoveToNextSentence", // (, )
      "Search", // /, ?, n, N
      "MoveToNextParagraph"];
      // {, }
      return goesToNumberedRegisterMotionNames.some(function (name) {
        return target["instanceof"](name);
      });
    }
  }, {
    key: "normalizeSelectionsIfNecessary",
    value: function normalizeSelectionsIfNecessary() {
      if (this.target && this.target.isMotion() && this.mode === "visual") {
        this.swrap.normalize(this.editor);
      }
    }
  }, {
    key: "startMutation",
    value: function startMutation(fn) {
      var _this6 = this;

      if (this.canEarlySelect()) {
        // - Skip selection normalization: already normalized before @selectTarget()
        // - Manual checkpoint grouping: to create checkpoint before @selectTarget()
        fn();
        this.emitWillFinishMutation();
        this.groupChangesSinceBufferCheckpoint("undo");
      } else {
        this.normalizeSelectionsIfNecessary();
        this.editor.transact(function () {
          fn();
          _this6.emitWillFinishMutation();
        });
      }

      this.emitDidFinishMutation();
    }

    // Main
  }, {
    key: "execute",
    value: function execute() {
      var _this7 = this;

      this.startMutation(function () {
        if (_this7.selectTarget()) {
          var selections = _this7.mutateSelectionOrderd ? _this7.editor.getSelectionsOrderedByBufferPosition() : _this7.editor.getSelections();

          for (var selection of selections) {
            _this7.mutateSelection(selection);
          }
          _this7.mutationManager.setCheckpoint("did-finish");
          _this7.restoreCursorPositionsIfNecessary();
        }
      });

      // Even though we fail to select target and fail to mutate,
      // we have to return to normal-mode from operator-pending or visual
      this.activateMode("normal");
    }

    // Return true unless all selection is empty.
  }, {
    key: "selectTarget",
    value: function selectTarget() {
      if (this.targetSelected != null) {
        return this.targetSelected;
      }
      this.mutationManager.init({ stayByMarker: this.stayByMarker });

      if (this.target.isMotion() && this.mode === "visual") this.target.wise = this.submode;
      if (this.wise != null) this.target.forceWise(this.wise);

      this.emitWillSelectTarget();

      // Allow cursor position adjustment 'on-will-select-target' hook.
      // so checkpoint comes AFTER @emitWillSelectTarget()
      this.mutationManager.setCheckpoint("will-select");

      // NOTE
      // Since MoveToNextOccurrence, MoveToPreviousOccurrence motion move by
      //  occurrence-marker, occurrence-marker has to be created BEFORE `@target.execute()`
      // And when repeated, occurrence pattern is already cached at @patternForOccurrence
      if (this.repeated && this.occurrence && !this.occurrenceManager.hasMarkers()) {
        this.occurrenceManager.addPattern(this.patternForOccurrence, { occurrenceType: this.occurrenceType });
      }

      this.target.execute();

      this.mutationManager.setCheckpoint("did-select");
      if (this.occurrence) {
        // To repoeat(`.`) operation where multiple occurrence patterns was set.
        // Here we save patterns which represent unioned regex which @occurrenceManager knows.
        if (!this.patternForOccurrence) {
          this.patternForOccurrence = this.occurrenceManager.buildPattern();
        }

        this.occurrenceWise = this.wise || "characterwise";
        if (this.occurrenceManager.select(this.occurrenceWise)) {
          this.occurrenceSelected = true;
          this.mutationManager.setCheckpoint("did-select-occurrence");
        }
      }

      this.targetSelected = this.vimState.haveSomeNonEmptySelection() || this.target.name === "Empty";
      if (this.targetSelected) {
        this.emitDidSelectTarget();
        this.flashChangeIfNecessary();
        this.trackChangeIfNecessary();
      } else {
        this.emitDidFailSelectTarget();
      }

      return this.targetSelected;
    }
  }, {
    key: "restoreCursorPositionsIfNecessary",
    value: function restoreCursorPositionsIfNecessary() {
      if (!this.restorePositions) return;

      var stay = this.stayAtSamePosition != null ? this.stayAtSamePosition : this.getConfig(this.stayOptionName) || this.occurrenceSelected && this.getConfig("stayOnOccurrence");
      var wise = this.occurrenceSelected ? this.occurrenceWise : this.target.wise;
      var setToFirstCharacterOnLinewise = this.setToFirstCharacterOnLinewise;

      this.mutationManager.restoreCursorPositions({ stay: stay, wise: wise, setToFirstCharacterOnLinewise: setToFirstCharacterOnLinewise });
    }
  }], [{
    key: "operationKind",
    value: "operator",
    enumerable: true
  }]);

  return Operator;
})(Base);

Operator.register(false);

var SelectBase = (function (_Operator) {
  _inherits(SelectBase, _Operator);

  function SelectBase() {
    _classCallCheck(this, SelectBase);

    _get(Object.getPrototypeOf(SelectBase.prototype), "constructor", this).apply(this, arguments);

    this.flashTarget = false;
    this.recordable = false;
  }

  _createClass(SelectBase, [{
    key: "execute",
    value: function execute() {
      var _this8 = this;

      this.startMutation(function () {
        return _this8.selectTarget();
      });

      if (this.target.selectSucceeded) {
        if (this.target.isTextObject()) {
          this.editor.scrollToCursorPosition();
        }
        var wise = this.occurrenceSelected ? this.occurrenceWise : this.target.wise;
        this.activateModeIfNecessary("visual", wise);
      } else {
        this.cancelOperation();
      }
    }
  }]);

  return SelectBase;
})(Operator);

SelectBase.register(false);

var Select = (function (_SelectBase) {
  _inherits(Select, _SelectBase);

  function Select() {
    _classCallCheck(this, Select);

    _get(Object.getPrototypeOf(Select.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(Select, [{
    key: "execute",
    value: function execute() {
      for (var $selection of this.swrap.getSelections(this.editor)) {
        if (!$selection.hasProperties()) $selection.saveProperties();
      }
      _get(Object.getPrototypeOf(Select.prototype), "execute", this).call(this);
    }
  }]);

  return Select;
})(SelectBase);

Select.register();

var SelectLatestChange = (function (_SelectBase2) {
  _inherits(SelectLatestChange, _SelectBase2);

  function SelectLatestChange() {
    _classCallCheck(this, SelectLatestChange);

    _get(Object.getPrototypeOf(SelectLatestChange.prototype), "constructor", this).apply(this, arguments);

    this.target = "ALatestChange";
  }

  return SelectLatestChange;
})(SelectBase);

SelectLatestChange.register();

var SelectPreviousSelection = (function (_SelectBase3) {
  _inherits(SelectPreviousSelection, _SelectBase3);

  function SelectPreviousSelection() {
    _classCallCheck(this, SelectPreviousSelection);

    _get(Object.getPrototypeOf(SelectPreviousSelection.prototype), "constructor", this).apply(this, arguments);

    this.target = "PreviousSelection";
  }

  return SelectPreviousSelection;
})(SelectBase);

SelectPreviousSelection.register();

var SelectPersistentSelection = (function (_SelectBase4) {
  _inherits(SelectPersistentSelection, _SelectBase4);

  function SelectPersistentSelection() {
    _classCallCheck(this, SelectPersistentSelection);

    _get(Object.getPrototypeOf(SelectPersistentSelection.prototype), "constructor", this).apply(this, arguments);

    this.target = "APersistentSelection";
    this.acceptPersistentSelection = false;
  }

  return SelectPersistentSelection;
})(SelectBase);

SelectPersistentSelection.register();

var SelectOccurrence = (function (_SelectBase5) {
  _inherits(SelectOccurrence, _SelectBase5);

  function SelectOccurrence() {
    _classCallCheck(this, SelectOccurrence);

    _get(Object.getPrototypeOf(SelectOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrence = true;
  }

  return SelectOccurrence;
})(SelectBase);

SelectOccurrence.register();

// SelectInVisualMode: used in visual-mode
// When text-object is invoked from normal or viusal-mode, operation would be
//  => SelectInVisualMode operator with target=text-object
// When motion is invoked from visual-mode, operation would be
//  => SelectInVisualMode operator with target=motion)
// ================================
// SelectInVisualMode is used in TWO situation.
// - visual-mode operation
//   - e.g: `v l`, `V j`, `v i p`...
// - Directly invoke text-object from normal-mode
//   - e.g: Invoke `Inner Paragraph` from command-palette.

var SelectInVisualMode = (function (_SelectBase6) {
  _inherits(SelectInVisualMode, _SelectBase6);

  function SelectInVisualMode() {
    _classCallCheck(this, SelectInVisualMode);

    _get(Object.getPrototypeOf(SelectInVisualMode.prototype), "constructor", this).apply(this, arguments);

    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
  }

  return SelectInVisualMode;
})(SelectBase);

SelectInVisualMode.register(false);

// Persistent Selection
// =========================

var CreatePersistentSelection = (function (_Operator2) {
  _inherits(CreatePersistentSelection, _Operator2);

  function CreatePersistentSelection() {
    _classCallCheck(this, CreatePersistentSelection);

    _get(Object.getPrototypeOf(CreatePersistentSelection.prototype), "constructor", this).apply(this, arguments);

    this.flashTarget = false;
    this.stayAtSamePosition = true;
    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
  }

  _createClass(CreatePersistentSelection, [{
    key: "mutateSelection",
    value: function mutateSelection(selection) {
      this.persistentSelection.markBufferRange(selection.getBufferRange());
    }
  }]);

  return CreatePersistentSelection;
})(Operator);

CreatePersistentSelection.register();

var TogglePersistentSelection = (function (_CreatePersistentSelection) {
  _inherits(TogglePersistentSelection, _CreatePersistentSelection);

  function TogglePersistentSelection() {
    _classCallCheck(this, TogglePersistentSelection);

    _get(Object.getPrototypeOf(TogglePersistentSelection.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(TogglePersistentSelection, [{
    key: "isComplete",
    value: function isComplete() {
      var point = this.editor.getCursorBufferPosition();
      this.markerToRemove = this.persistentSelection.getMarkerAtPoint(point);
      return this.markerToRemove || _get(Object.getPrototypeOf(TogglePersistentSelection.prototype), "isComplete", this).call(this);
    }
  }, {
    key: "execute",
    value: function execute() {
      if (this.markerToRemove) {
        this.markerToRemove.destroy();
      } else {
        _get(Object.getPrototypeOf(TogglePersistentSelection.prototype), "execute", this).call(this);
      }
    }
  }]);

  return TogglePersistentSelection;
})(CreatePersistentSelection);

TogglePersistentSelection.register();

// Preset Occurrence
// =========================

var TogglePresetOccurrence = (function (_Operator3) {
  _inherits(TogglePresetOccurrence, _Operator3);

  function TogglePresetOccurrence() {
    _classCallCheck(this, TogglePresetOccurrence);

    _get(Object.getPrototypeOf(TogglePresetOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.target = "Empty";
    this.flashTarget = false;
    this.acceptPresetOccurrence = false;
    this.acceptPersistentSelection = false;
    this.occurrenceType = "base";
  }

  _createClass(TogglePresetOccurrence, [{
    key: "execute",
    value: function execute() {
      var marker = this.occurrenceManager.getMarkerAtPoint(this.editor.getCursorBufferPosition());
      if (marker) {
        this.occurrenceManager.destroyMarkers([marker]);
      } else {
        var isNarrowed = this.vimState.modeManager.isNarrowed();

        var regex = undefined;
        if (this.mode === "visual" && !isNarrowed) {
          this.occurrenceType = "base";
          regex = new RegExp(_.escapeRegExp(this.editor.getSelectedText()), "g");
        } else {
          regex = this.getPatternForOccurrenceType(this.occurrenceType);
        }

        this.occurrenceManager.addPattern(regex, { occurrenceType: this.occurrenceType });
        this.occurrenceManager.saveLastPattern(this.occurrenceType);

        if (!isNarrowed) this.activateMode("normal");
      }
    }
  }]);

  return TogglePresetOccurrence;
})(Operator);

TogglePresetOccurrence.register();

var TogglePresetSubwordOccurrence = (function (_TogglePresetOccurrence) {
  _inherits(TogglePresetSubwordOccurrence, _TogglePresetOccurrence);

  function TogglePresetSubwordOccurrence() {
    _classCallCheck(this, TogglePresetSubwordOccurrence);

    _get(Object.getPrototypeOf(TogglePresetSubwordOccurrence.prototype), "constructor", this).apply(this, arguments);

    this.occurrenceType = "subword";
  }

  return TogglePresetSubwordOccurrence;
})(TogglePresetOccurrence);

TogglePresetSubwordOccurrence.register();

// Want to rename RestoreOccurrenceMarker

var AddPresetOccurrenceFromLastOccurrencePattern = (function (_TogglePresetOccurrence2) {
  _inherits(AddPresetOccurrenceFromLastOccurrencePattern, _TogglePresetOccurrence2);

  function AddPresetOccurrenceFromLastOccurrencePattern() {
    _classCallCheck(this, AddPresetOccurrenceFromLastOccurrencePattern);

    _get(Object.getPrototypeOf(AddPresetOccurrenceFromLastOccurrencePattern.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(AddPresetOccurrenceFromLastOccurrencePattern, [{
    key: "execute",
    value: function execute() {
      this.occurrenceManager.resetPatterns();
      var regex = this.globalState.get("lastOccurrencePattern");
      if (regex) {
        var occurrenceType = this.globalState.get("lastOccurrenceType");
        this.occurrenceManager.addPattern(regex, { occurrenceType: occurrenceType });
        this.activateMode("normal");
      }
    }
  }]);

  return AddPresetOccurrenceFromLastOccurrencePattern;
})(TogglePresetOccurrence);

AddPresetOccurrenceFromLastOccurrencePattern.register();

// Delete
// ================================

var Delete = (function (_Operator4) {
  _inherits(Delete, _Operator4);

  function Delete() {
    _classCallCheck(this, Delete);

    _get(Object.getPrototypeOf(Delete.prototype), "constructor", this).apply(this, arguments);

    this.trackChange = true;
    this.flashCheckpoint = "did-select-occurrence";
    this.flashTypeForOccurrence = "operator-remove-occurrence";
    this.stayOptionName = "stayOnDelete";
    this.setToFirstCharacterOnLinewise = true;
  }

  _createClass(Delete, [{
    key: "execute",
    value: function execute() {
      var _this9 = this;

      this.onDidSelectTarget(function () {
        if (_this9.occurrenceSelected && _this9.occurrenceWise === "linewise") {
          _this9.flashTarget = false;
        }
      });

      if (this.target.wise === "blockwise") {
        this.restorePositions = false;
      }
      _get(Object.getPrototypeOf(Delete.prototype), "execute", this).call(this);
    }
  }, {
    key: "mutateSelection",
    value: function mutateSelection(selection) {
      this.setTextToRegisterForSelection(selection);
      selection.deleteSelectedText();
    }
  }]);

  return Delete;
})(Operator);

Delete.register();

var DeleteRight = (function (_Delete) {
  _inherits(DeleteRight, _Delete);

  function DeleteRight() {
    _classCallCheck(this, DeleteRight);

    _get(Object.getPrototypeOf(DeleteRight.prototype), "constructor", this).apply(this, arguments);

    this.target = "MoveRight";
  }

  return DeleteRight;
})(Delete);

DeleteRight.register();

var DeleteLeft = (function (_Delete2) {
  _inherits(DeleteLeft, _Delete2);

  function DeleteLeft() {
    _classCallCheck(this, DeleteLeft);

    _get(Object.getPrototypeOf(DeleteLeft.prototype), "constructor", this).apply(this, arguments);

    this.target = "MoveLeft";
  }

  return DeleteLeft;
})(Delete);

DeleteLeft.register();

var DeleteToLastCharacterOfLine = (function (_Delete3) {
  _inherits(DeleteToLastCharacterOfLine, _Delete3);

  function DeleteToLastCharacterOfLine() {
    _classCallCheck(this, DeleteToLastCharacterOfLine);

    _get(Object.getPrototypeOf(DeleteToLastCharacterOfLine.prototype), "constructor", this).apply(this, arguments);

    this.target = "MoveToLastCharacterOfLine";
  }

  _createClass(DeleteToLastCharacterOfLine, [{
    key: "execute",
    value: function execute() {
      var _this10 = this;

      this.onDidSelectTarget(function () {
        if (_this10.target.wise === "blockwise") {
          for (var blockwiseSelection of _this10.getBlockwiseSelections()) {
            blockwiseSelection.extendMemberSelectionsToEndOfLine();
          }
        }
      });
      _get(Object.getPrototypeOf(DeleteToLastCharacterOfLine.prototype), "execute", this).call(this);
    }
  }]);

  return DeleteToLastCharacterOfLine;
})(Delete);

DeleteToLastCharacterOfLine.register();

var DeleteLine = (function (_Delete4) {
  _inherits(DeleteLine, _Delete4);

  function DeleteLine() {
    _classCallCheck(this, DeleteLine);

    _get(Object.getPrototypeOf(DeleteLine.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.target = "MoveToRelativeLine";
    this.flashTarget = false;
  }

  return DeleteLine;
})(Delete);

DeleteLine.register();

// Yank
// =========================

var Yank = (function (_Operator5) {
  _inherits(Yank, _Operator5);

  function Yank() {
    _classCallCheck(this, Yank);

    _get(Object.getPrototypeOf(Yank.prototype), "constructor", this).apply(this, arguments);

    this.trackChange = true;
    this.stayOptionName = "stayOnYank";
  }

  _createClass(Yank, [{
    key: "mutateSelection",
    value: function mutateSelection(selection) {
      this.setTextToRegisterForSelection(selection);
    }
  }]);

  return Yank;
})(Operator);

Yank.register();

var YankLine = (function (_Yank) {
  _inherits(YankLine, _Yank);

  function YankLine() {
    _classCallCheck(this, YankLine);

    _get(Object.getPrototypeOf(YankLine.prototype), "constructor", this).apply(this, arguments);

    this.wise = "linewise";
    this.target = "MoveToRelativeLine";
  }

  return YankLine;
})(Yank);

YankLine.register();

var YankToLastCharacterOfLine = (function (_Yank2) {
  _inherits(YankToLastCharacterOfLine, _Yank2);

  function YankToLastCharacterOfLine() {
    _classCallCheck(this, YankToLastCharacterOfLine);

    _get(Object.getPrototypeOf(YankToLastCharacterOfLine.prototype), "constructor", this).apply(this, arguments);

    this.target = "MoveToLastCharacterOfLine";
  }

  return YankToLastCharacterOfLine;
})(Yank);

YankToLastCharacterOfLine.register();

// -------------------------
// [ctrl-a]

var Increase = (function (_Operator6) {
  _inherits(Increase, _Operator6);

  function Increase() {
    _classCallCheck(this, Increase);

    _get(Object.getPrototypeOf(Increase.prototype), "constructor", this).apply(this, arguments);

    this.target = "Empty";
    this.flashTarget = false;
    this.restorePositions = false;
    this.step = 1;
  }

  _createClass(Increase, [{
    key: "execute",
    value: function execute() {
      this.newRanges = [];
      if (!this.regex) this.regex = new RegExp("" + this.getConfig("numberRegex"), "g");

      _get(Object.getPrototypeOf(Increase.prototype), "execute", this).call(this);

      if (this.newRanges.length) {
        if (this.getConfig("flashOnOperate") && !this.getConfig("flashOnOperateBlacklist").includes(this.name)) {
          this.vimState.flash(this.newRanges, { type: this.flashTypeForOccurrence });
        }
      }
    }
  }, {
    key: "replaceNumberInBufferRange",
    value: function replaceNumberInBufferRange(scanRange, fn) {
      var _this11 = this;

      var newRanges = [];
      this.scanForward(this.regex, { scanRange: scanRange }, function (event) {
        if (fn) {
          if (fn(event)) event.stop();else return;
        }
        var nextNumber = _this11.getNextNumber(event.matchText);
        newRanges.push(event.replace(String(nextNumber)));
      });
      return newRanges;
    }
  }, {
    key: "mutateSelection",
    value: function mutateSelection(selection) {
      var _this12 = this;

      var cursor = selection.cursor;

      if (this.target.is("Empty")) {
        (function () {
          // ctrl-a, ctrl-x in `normal-mode`
          var cursorPosition = cursor.getBufferPosition();
          var scanRange = _this12.editor.bufferRangeForBufferRow(cursorPosition.row);
          var newRanges = _this12.replaceNumberInBufferRange(scanRange, function (event) {
            return event.range.end.isGreaterThan(cursorPosition);
          });
          var point = newRanges.length && newRanges[0].end.translate([0, -1]) || cursorPosition;
          cursor.setBufferPosition(point);
        })();
      } else {
        var _newRanges;

        var scanRange = selection.getBufferRange();
        (_newRanges = this.newRanges).push.apply(_newRanges, _toConsumableArray(this.replaceNumberInBufferRange(scanRange)));
        cursor.setBufferPosition(scanRange.start);
      }
    }
  }, {
    key: "getNextNumber",
    value: function getNextNumber(numberString) {
      return Number.parseInt(numberString, 10) + this.step * this.getCount();
    }
  }]);

  return Increase;
})(Operator);

Increase.register();

// [ctrl-x]

var Decrease = (function (_Increase) {
  _inherits(Decrease, _Increase);

  function Decrease() {
    _classCallCheck(this, Decrease);

    _get(Object.getPrototypeOf(Decrease.prototype), "constructor", this).apply(this, arguments);

    this.step = -1;
  }

  return Decrease;
})(Increase);

Decrease.register();

// -------------------------
// [g ctrl-a]

var IncrementNumber = (function (_Increase2) {
  _inherits(IncrementNumber, _Increase2);

  function IncrementNumber() {
    _classCallCheck(this, IncrementNumber);

    _get(Object.getPrototypeOf(IncrementNumber.prototype), "constructor", this).apply(this, arguments);

    this.baseNumber = null;
    this.target = null;
    this.mutateSelectionOrderd = true;
  }

  _createClass(IncrementNumber, [{
    key: "getNextNumber",
    value: function getNextNumber(numberString) {
      if (this.baseNumber != null) {
        this.baseNumber += this.step * this.getCount();
      } else {
        this.baseNumber = Number.parseInt(numberString, 10);
      }
      return this.baseNumber;
    }
  }]);

  return IncrementNumber;
})(Increase);

IncrementNumber.register();

// [g ctrl-x]

var DecrementNumber = (function (_IncrementNumber) {
  _inherits(DecrementNumber, _IncrementNumber);

  function DecrementNumber() {
    _classCallCheck(this, DecrementNumber);

    _get(Object.getPrototypeOf(DecrementNumber.prototype), "constructor", this).apply(this, arguments);

    this.step = -1;
  }

  return DecrementNumber;
})(IncrementNumber);

DecrementNumber.register();

// Put
// -------------------------
// Cursor placement:
// - place at end of mutation: paste non-multiline characterwise text
// - place at start of mutation: non-multiline characterwise text(characterwise, linewise)

var PutBefore = (function (_Operator7) {
  _inherits(PutBefore, _Operator7);

  function PutBefore() {
    _classCallCheck(this, PutBefore);

    _get(Object.getPrototypeOf(PutBefore.prototype), "constructor", this).apply(this, arguments);

    this.location = "before";
    this.target = "Empty";
    this.flashType = "operator-long";
    this.restorePositions = false;
    this.flashTarget = false;
    this.trackChange = false;
  }

  _createClass(PutBefore, [{
    key: "initialize",
    // manage manually

    value: function initialize() {
      this.vimState.sequentialPasteManager.onInitialize(this);
      return _get(Object.getPrototypeOf(PutBefore.prototype), "initialize", this).call(this);
    }
  }, {
    key: "execute",
    value: function execute() {
      var _this13 = this;

      this.mutationsBySelection = new Map();
      this.sequentialPaste = this.vimState.sequentialPasteManager.onExecute(this);

      this.onDidFinishMutation(function () {
        if (!_this13.cancelled) _this13.adjustCursorPosition();
      });

      _get(Object.getPrototypeOf(PutBefore.prototype), "execute", this).call(this);

      if (this.cancelled) return;

      this.onDidFinishOperation(function () {
        // TrackChange
        var newRange = _this13.mutationsBySelection.get(_this13.editor.getLastSelection());
        if (newRange) _this13.setMarkForChange(newRange);

        // Flash
        if (_this13.getConfig("flashOnOperate") && !_this13.getConfig("flashOnOperateBlacklist").includes(_this13.name)) {
          var ranges = _this13.editor.getSelections().map(function (selection) {
            return _this13.mutationsBySelection.get(selection);
          });
          _this13.vimState.flash(ranges, { type: _this13.getFlashType() });
        }
      });
    }
  }, {
    key: "adjustCursorPosition",
    value: function adjustCursorPosition() {
      for (var selection of this.editor.getSelections()) {
        if (!this.mutationsBySelection.has(selection)) continue;

        var cursor = selection.cursor;

        var newRange = this.mutationsBySelection.get(selection);
        if (this.linewisePaste) {
          moveCursorToFirstCharacterAtRow(cursor, newRange.start.row);
        } else {
          if (newRange.isSingleLine()) {
            cursor.setBufferPosition(newRange.end.translate([0, -1]));
          } else {
            cursor.setBufferPosition(newRange.start);
          }
        }
      }
    }
  }, {
    key: "mutateSelection",
    value: function mutateSelection(selection) {
      var value = this.vimState.register.get(null, selection, this.sequentialPaste);
      if (!value.text) {
        this.cancelled = true;
        return;
      }

      var textToPaste = _.multiplyString(value.text, this.getCount());
      this.linewisePaste = value.type === "linewise" || this.isMode("visual", "linewise");
      var newRange = this.paste(selection, textToPaste, { linewisePaste: this.linewisePaste });
      this.mutationsBySelection.set(selection, newRange);
      this.vimState.sequentialPasteManager.savePastedRangeForSelection(selection, newRange);
    }

    // Return pasted range
  }, {
    key: "paste",
    value: function paste(selection, text, _ref2) {
      var linewisePaste = _ref2.linewisePaste;

      if (this.sequentialPaste) {
        return this.pasteCharacterwise(selection, text);
      } else if (linewisePaste) {
        return this.pasteLinewise(selection, text);
      } else {
        return this.pasteCharacterwise(selection, text);
      }
    }
  }, {
    key: "pasteCharacterwise",
    value: function pasteCharacterwise(selection, text) {
      var cursor = selection.cursor;

      if (selection.isEmpty() && this.location === "after" && !isEmptyRow(this.editor, cursor.getBufferRow())) {
        cursor.moveRight();
      }
      return selection.insertText(text);
    }

    // Return newRange
  }, {
    key: "pasteLinewise",
    value: function pasteLinewise(selection, text) {
      var cursor = selection.cursor;

      var cursorRow = cursor.getBufferRow();
      if (!text.endsWith("\n")) {
        text += "\n";
      }
      if (selection.isEmpty()) {
        if (this.location === "before") {
          return insertTextAtBufferPosition(this.editor, [cursorRow, 0], text);
        } else if (this.location === "after") {
          var targetRow = this.getFoldEndRowForRow(cursorRow);
          ensureEndsWithNewLineForBufferRow(this.editor, targetRow);
          return insertTextAtBufferPosition(this.editor, [targetRow + 1, 0], text);
        }
      } else {
        if (!this.isMode("visual", "linewise")) {
          selection.insertText("\n");
        }
        return selection.insertText(text);
      }
    }
  }]);

  return PutBefore;
})(Operator);

PutBefore.register();

var PutAfter = (function (_PutBefore) {
  _inherits(PutAfter, _PutBefore);

  function PutAfter() {
    _classCallCheck(this, PutAfter);

    _get(Object.getPrototypeOf(PutAfter.prototype), "constructor", this).apply(this, arguments);

    this.location = "after";
  }

  return PutAfter;
})(PutBefore);

PutAfter.register();

var PutBeforeWithAutoIndent = (function (_PutBefore2) {
  _inherits(PutBeforeWithAutoIndent, _PutBefore2);

  function PutBeforeWithAutoIndent() {
    _classCallCheck(this, PutBeforeWithAutoIndent);

    _get(Object.getPrototypeOf(PutBeforeWithAutoIndent.prototype), "constructor", this).apply(this, arguments);
  }

  _createClass(PutBeforeWithAutoIndent, [{
    key: "pasteLinewise",
    value: function pasteLinewise(selection, text) {
      var newRange = _get(Object.getPrototypeOf(PutBeforeWithAutoIndent.prototype), "pasteLinewise", this).call(this, selection, text);
      adjustIndentWithKeepingLayout(this.editor, newRange);
      return newRange;
    }
  }]);

  return PutBeforeWithAutoIndent;
})(PutBefore);

PutBeforeWithAutoIndent.register();

var PutAfterWithAutoIndent = (function (_PutBeforeWithAutoIndent) {
  _inherits(PutAfterWithAutoIndent, _PutBeforeWithAutoIndent);

  function PutAfterWithAutoIndent() {
    _classCallCheck(this, PutAfterWithAutoIndent);

    _get(Object.getPrototypeOf(PutAfterWithAutoIndent.prototype), "constructor", this).apply(this, arguments);

    this.location = "after";
  }

  return PutAfterWithAutoIndent;
})(PutBeforeWithAutoIndent);

PutAfterWithAutoIndent.register();

var AddBlankLineBelow = (function (_Operator8) {
  _inherits(AddBlankLineBelow, _Operator8);

  function AddBlankLineBelow() {
    _classCallCheck(this, AddBlankLineBelow);

    _get(Object.getPrototypeOf(AddBlankLineBelow.prototype), "constructor", this).apply(this, arguments);

    this.flashTarget = false;
    this.target = "Empty";
    this.stayAtSamePosition = true;
    this.stayByMarker = true;
    this.where = "below";
  }

  _createClass(AddBlankLineBelow, [{
    key: "mutateSelection",
    value: function mutateSelection(selection) {
      var point = selection.getHeadBufferPosition();
      if (this.where === "below") point.row++;
      point.column = 0;
      this.editor.setTextInBufferRange([point, point], "\n".repeat(this.getCount()));
    }
  }]);

  return AddBlankLineBelow;
})(Operator);

AddBlankLineBelow.register();

var AddBlankLineAbove = (function (_AddBlankLineBelow) {
  _inherits(AddBlankLineAbove, _AddBlankLineBelow);

  function AddBlankLineAbove() {
    _classCallCheck(this, AddBlankLineAbove);

    _get(Object.getPrototypeOf(AddBlankLineAbove.prototype), "constructor", this).apply(this, arguments);

    this.where = "above";
  }

  return AddBlankLineAbove;
})(AddBlankLineBelow);

AddBlankLineAbove.register();

// Experimentaly allow selectTarget before input Complete
// -------------------------
// ctrl-a in normal-mode find target number in current line manually
// do manually
// do manually
// manage manually
// manage manually
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvb3BlcmF0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsV0FBVyxDQUFBOzs7Ozs7Ozs7Ozs7QUFFWCxJQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTs7ZUFXaEMsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7SUFUcEIsVUFBVSxZQUFWLFVBQVU7SUFDViw4QkFBOEIsWUFBOUIsOEJBQThCO0lBQzlCLGlDQUFpQyxZQUFqQyxpQ0FBaUM7SUFDakMsMEJBQTBCLFlBQTFCLDBCQUEwQjtJQUMxQixZQUFZLFlBQVosWUFBWTtJQUNaLCtCQUErQixZQUEvQiwrQkFBK0I7SUFDL0IsaUNBQWlDLFlBQWpDLGlDQUFpQztJQUNqQyw2QkFBNkIsWUFBN0IsNkJBQTZCO0lBQzdCLGdCQUFnQixZQUFoQixnQkFBZ0I7O0FBRWxCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTs7SUFFeEIsUUFBUTtZQUFSLFFBQVE7O1dBQVIsUUFBUTswQkFBUixRQUFROzsrQkFBUixRQUFROztTQUVaLGFBQWEsR0FBRyxJQUFJO1NBQ3BCLFVBQVUsR0FBRyxJQUFJO1NBRWpCLElBQUksR0FBRyxJQUFJO1NBQ1gsVUFBVSxHQUFHLEtBQUs7U0FDbEIsY0FBYyxHQUFHLE1BQU07U0FFdkIsV0FBVyxHQUFHLElBQUk7U0FDbEIsZUFBZSxHQUFHLFlBQVk7U0FDOUIsU0FBUyxHQUFHLFVBQVU7U0FDdEIsc0JBQXNCLEdBQUcscUJBQXFCO1NBQzlDLFdBQVcsR0FBRyxLQUFLO1NBRW5CLG9CQUFvQixHQUFHLElBQUk7U0FDM0Isa0JBQWtCLEdBQUcsSUFBSTtTQUN6QixjQUFjLEdBQUcsSUFBSTtTQUNyQixZQUFZLEdBQUcsS0FBSztTQUNwQixnQkFBZ0IsR0FBRyxJQUFJO1NBQ3ZCLDZCQUE2QixHQUFHLEtBQUs7U0FF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RSxLQUFLLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUE7S0FDL0U7OztTQVpHLGlCQUFpQjtHQUFTLFFBQVE7O0FBY3hDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFBOztJQUV0QixpQkFBaUI7WUFBakIsaUJBQWlCOztXQUFqQixpQkFBaUI7MEJBQWpCLGlCQUFpQjs7K0JBQWpCLGlCQUFpQjs7U0FDckIsS0FBSyxHQUFHLE9BQU87OztTQURYLGlCQUFpQjtHQUFTLGlCQUFpQjs7QUFHakQsaUJBQWlCLENBQUMsUUFBUSxFQUFFLENBQUEiLCJmaWxlIjoiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9vcGVyYXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCJcblxuY29uc3QgXyA9IHJlcXVpcmUoXCJ1bmRlcnNjb3JlLXBsdXNcIilcbmNvbnN0IHtcbiAgaXNFbXB0eVJvdyxcbiAgZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uLFxuICBnZXRTdWJ3b3JkUGF0dGVybkF0QnVmZmVyUG9zaXRpb24sXG4gIGluc2VydFRleHRBdEJ1ZmZlclBvc2l0aW9uLFxuICBzZXRCdWZmZXJSb3csXG4gIG1vdmVDdXJzb3JUb0ZpcnN0Q2hhcmFjdGVyQXRSb3csXG4gIGVuc3VyZUVuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvdyxcbiAgYWRqdXN0SW5kZW50V2l0aEtlZXBpbmdMYXlvdXQsXG4gIGlzU2luZ2xlTGluZVRleHQsXG59ID0gcmVxdWlyZShcIi4vdXRpbHNcIilcbmNvbnN0IEJhc2UgPSByZXF1aXJlKFwiLi9iYXNlXCIpXG5cbmNsYXNzIE9wZXJhdG9yIGV4dGVuZHMgQmFzZSB7XG4gIHN0YXRpYyBvcGVyYXRpb25LaW5kID0gXCJvcGVyYXRvclwiXG4gIHJlcXVpcmVUYXJnZXQgPSB0cnVlXG4gIHJlY29yZGFibGUgPSB0cnVlXG5cbiAgd2lzZSA9IG51bGxcbiAgb2NjdXJyZW5jZSA9IGZhbHNlXG4gIG9jY3VycmVuY2VUeXBlID0gXCJiYXNlXCJcblxuICBmbGFzaFRhcmdldCA9IHRydWVcbiAgZmxhc2hDaGVja3BvaW50ID0gXCJkaWQtZmluaXNoXCJcbiAgZmxhc2hUeXBlID0gXCJvcGVyYXRvclwiXG4gIGZsYXNoVHlwZUZvck9jY3VycmVuY2UgPSBcIm9wZXJhdG9yLW9jY3VycmVuY2VcIlxuICB0cmFja0NoYW5nZSA9IGZhbHNlXG5cbiAgcGF0dGVybkZvck9jY3VycmVuY2UgPSBudWxsXG4gIHN0YXlBdFNhbWVQb3NpdGlvbiA9IG51bGxcbiAgc3RheU9wdGlvbk5hbWUgPSBudWxsXG4gIHN0YXlCeU1hcmtlciA9IGZhbHNlXG4gIHJlc3RvcmVQb3NpdGlvbnMgPSB0cnVlXG4gIHNldFRvRmlyc3RDaGFyYWN0ZXJPbkxpbmV3aXNlID0gZmFsc2VcblxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlID0gdHJ1ZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gdHJ1ZVxuXG4gIGJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2UgPSBudWxsXG4gIG11dGF0ZVNlbGVjdGlvbk9yZGVyZCA9IGZhbHNlXG5cbiAgLy8gRXhwZXJpbWVudGFseSBhbGxvdyBzZWxlY3RUYXJnZXQgYmVmb3JlIGlucHV0IENvbXBsZXRlXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgc3VwcG9ydEVhcmx5U2VsZWN0ID0gZmFsc2VcbiAgdGFyZ2V0U2VsZWN0ZWQgPSBudWxsXG5cbiAgY2FuRWFybHlTZWxlY3QoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3VwcG9ydEVhcmx5U2VsZWN0ICYmICF0aGlzLnJlcGVhdGVkXG4gIH1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vIENhbGxlZCB3aGVuIG9wZXJhdGlvbiBmaW5pc2hlZFxuICAvLyBUaGlzIGlzIGVzc2VudGlhbGx5IHRvIHJlc2V0IHN0YXRlIGZvciBgLmAgcmVwZWF0LlxuICByZXNldFN0YXRlKCkge1xuICAgIHRoaXMudGFyZ2V0U2VsZWN0ZWQgPSBudWxsXG4gICAgdGhpcy5vY2N1cnJlbmNlU2VsZWN0ZWQgPSBmYWxzZVxuICB9XG5cbiAgLy8gVHdvIGNoZWNrcG9pbnQgZm9yIGRpZmZlcmVudCBwdXJwb3NlXG4gIC8vIC0gb25lIGZvciB1bmRvKGhhbmRsZWQgYnkgbW9kZU1hbmFnZXIpXG4gIC8vIC0gb25lIGZvciBwcmVzZXJ2ZSBsYXN0IGluc2VydGVkIHRleHRcbiAgY3JlYXRlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKSB7XG4gICAgaWYgKCF0aGlzLmJ1ZmZlckNoZWNrcG9pbnRCeVB1cnBvc2UpIHRoaXMuYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZSA9IHt9XG4gICAgdGhpcy5idWZmZXJDaGVja3BvaW50QnlQdXJwb3NlW3B1cnBvc2VdID0gdGhpcy5lZGl0b3IuY3JlYXRlQ2hlY2twb2ludCgpXG4gIH1cblxuICBnZXRCdWZmZXJDaGVja3BvaW50KHB1cnBvc2UpIHtcbiAgICBpZiAodGhpcy5idWZmZXJDaGVja3BvaW50QnlQdXJwb3NlKSB7XG4gICAgICByZXR1cm4gdGhpcy5idWZmZXJDaGVja3BvaW50QnlQdXJwb3NlW3B1cnBvc2VdXG4gICAgfVxuICB9XG5cbiAgZGVsZXRlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZSkge1xuICAgICAgZGVsZXRlIHRoaXMuYnVmZmVyQ2hlY2twb2ludEJ5UHVycG9zZVtwdXJwb3NlXVxuICAgIH1cbiAgfVxuXG4gIGdyb3VwQ2hhbmdlc1NpbmNlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKSB7XG4gICAgY29uc3QgY2hlY2twb2ludCA9IHRoaXMuZ2V0QnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKVxuICAgIGlmIChjaGVja3BvaW50KSB7XG4gICAgICB0aGlzLmVkaXRvci5ncm91cENoYW5nZXNTaW5jZUNoZWNrcG9pbnQoY2hlY2twb2ludClcbiAgICAgIHRoaXMuZGVsZXRlQnVmZmVyQ2hlY2twb2ludChwdXJwb3NlKVxuICAgIH1cbiAgfVxuXG4gIHNldE1hcmtGb3JDaGFuZ2UocmFuZ2UpIHtcbiAgICB0aGlzLnZpbVN0YXRlLm1hcmsuc2V0KFwiW1wiLCByYW5nZS5zdGFydClcbiAgICB0aGlzLnZpbVN0YXRlLm1hcmsuc2V0KFwiXVwiLCByYW5nZS5lbmQpXG4gIH1cblxuICBuZWVkRmxhc2goKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIHRoaXMuZmxhc2hUYXJnZXQgJiZcbiAgICAgIHRoaXMuZ2V0Q29uZmlnKFwiZmxhc2hPbk9wZXJhdGVcIikgJiZcbiAgICAgICF0aGlzLmdldENvbmZpZyhcImZsYXNoT25PcGVyYXRlQmxhY2tsaXN0XCIpLmluY2x1ZGVzKHRoaXMubmFtZSkgJiZcbiAgICAgICh0aGlzLm1vZGUgIT09IFwidmlzdWFsXCIgfHwgdGhpcy5zdWJtb2RlICE9PSB0aGlzLnRhcmdldC53aXNlKSAvLyBlLmcuIFkgaW4gdkNcbiAgICApXG4gIH1cblxuICBmbGFzaElmTmVjZXNzYXJ5KHJhbmdlcykge1xuICAgIGlmICh0aGlzLm5lZWRGbGFzaCgpKSB7XG4gICAgICB0aGlzLnZpbVN0YXRlLmZsYXNoKHJhbmdlcywge3R5cGU6IHRoaXMuZ2V0Rmxhc2hUeXBlKCl9KVxuICAgIH1cbiAgfVxuXG4gIGZsYXNoQ2hhbmdlSWZOZWNlc3NhcnkoKSB7XG4gICAgaWYgKHRoaXMubmVlZEZsYXNoKCkpIHtcbiAgICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4ge1xuICAgICAgICBjb25zdCByYW5nZXMgPSB0aGlzLm11dGF0aW9uTWFuYWdlci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlc0ZvckNoZWNrcG9pbnQodGhpcy5mbGFzaENoZWNrcG9pbnQpXG4gICAgICAgIHRoaXMudmltU3RhdGUuZmxhc2gocmFuZ2VzLCB7dHlwZTogdGhpcy5nZXRGbGFzaFR5cGUoKX0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIGdldEZsYXNoVHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5vY2N1cnJlbmNlU2VsZWN0ZWQgPyB0aGlzLmZsYXNoVHlwZUZvck9jY3VycmVuY2UgOiB0aGlzLmZsYXNoVHlwZVxuICB9XG5cbiAgdHJhY2tDaGFuZ2VJZk5lY2Vzc2FyeSgpIHtcbiAgICBpZiAoIXRoaXMudHJhY2tDaGFuZ2UpIHJldHVyblxuICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4ge1xuICAgICAgY29uc3QgcmFuZ2UgPSB0aGlzLm11dGF0aW9uTWFuYWdlci5nZXRNdXRhdGVkQnVmZmVyUmFuZ2VGb3JTZWxlY3Rpb24odGhpcy5lZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgICAgaWYgKHJhbmdlKSB0aGlzLnNldE1hcmtGb3JDaGFuZ2UocmFuZ2UpXG4gICAgfSlcbiAgfVxuXG4gIGluaXRpYWxpemUoKSB7XG4gICAgdGhpcy5zdWJzY3JpYmVSZXNldE9jY3VycmVuY2VQYXR0ZXJuSWZOZWVkZWQoKVxuICAgIHRoaXMub25EaWRTZXRPcGVyYXRvck1vZGlmaWVyKG9wdGlvbnMgPT4gdGhpcy5zZXRNb2RpZmllcihvcHRpb25zKSlcblxuICAgIC8vIFdoZW4gcHJlc2V0LW9jY3VycmVuY2Ugd2FzIGV4aXN0cywgb3BlcmF0ZSBvbiBvY2N1cnJlbmNlLXdpc2VcbiAgICBpZiAodGhpcy5hY2NlcHRQcmVzZXRPY2N1cnJlbmNlICYmIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpKSB7XG4gICAgICB0aGlzLm9jY3VycmVuY2UgPSB0cnVlXG4gICAgfVxuXG4gICAgLy8gW0ZJWE1FXSBPUkRFUi1NQVRURVJcbiAgICAvLyBUbyBwaWNrIGN1cnNvci13b3JkIHRvIGZpbmQgb2NjdXJyZW5jZSBiYXNlIHBhdHRlcm4uXG4gICAgLy8gVGhpcyBoYXMgdG8gYmUgZG9uZSBCRUZPUkUgY29udmVydGluZyBwZXJzaXN0ZW50LXNlbGVjdGlvbiBpbnRvIHJlYWwtc2VsZWN0aW9uLlxuICAgIC8vIFNpbmNlIHdoZW4gcGVyc2lzdGVudC1zZWxlY3Rpb24gaXMgYWN0dWFsbCBzZWxlY3RlZCwgaXQgY2hhbmdlIGN1cnNvciBwb3NpdGlvbi5cbiAgICBpZiAodGhpcy5vY2N1cnJlbmNlICYmICF0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmhhc01hcmtlcnMoKSkge1xuICAgICAgY29uc3QgcmVnZXggPSB0aGlzLnBhdHRlcm5Gb3JPY2N1cnJlbmNlIHx8IHRoaXMuZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKHRoaXMub2NjdXJyZW5jZVR5cGUpXG4gICAgICB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4ocmVnZXgpXG4gICAgfVxuXG4gICAgLy8gVGhpcyBjaGFuZ2UgY3Vyc29yIHBvc2l0aW9uLlxuICAgIGlmICh0aGlzLnNlbGVjdFBlcnNpc3RlbnRTZWxlY3Rpb25JZk5lY2Vzc2FyeSgpKSB7XG4gICAgICAvLyBbRklYTUVdIHNlbGVjdGlvbi13aXNlIGlzIG5vdCBzeW5jaGVkIGlmIGl0IGFscmVhZHkgdmlzdWFsLW1vZGVcbiAgICAgIGlmICh0aGlzLm1vZGUgIT09IFwidmlzdWFsXCIpIHtcbiAgICAgICAgdGhpcy52aW1TdGF0ZS5tb2RlTWFuYWdlci5hY3RpdmF0ZShcInZpc3VhbFwiLCB0aGlzLnN3cmFwLmRldGVjdFdpc2UodGhpcy5lZGl0b3IpKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1vZGUgPT09IFwidmlzdWFsXCIgJiYgdGhpcy5yZXF1aXJlVGFyZ2V0KSB7XG4gICAgICB0aGlzLnRhcmdldCA9IFwiQ3VycmVudFNlbGVjdGlvblwiXG4gICAgfVxuICAgIGlmIChfLmlzU3RyaW5nKHRoaXMudGFyZ2V0KSkge1xuICAgICAgdGhpcy5zZXRUYXJnZXQodGhpcy5nZXRJbnN0YW5jZSh0aGlzLnRhcmdldCkpXG4gICAgfVxuXG4gICAgcmV0dXJuIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgc3Vic2NyaWJlUmVzZXRPY2N1cnJlbmNlUGF0dGVybklmTmVlZGVkKCkge1xuICAgIC8vIFtDQVVUSU9OXVxuICAgIC8vIFRoaXMgbWV0aG9kIGhhcyB0byBiZSBjYWxsZWQgaW4gUFJPUEVSIHRpbWluZy5cbiAgICAvLyBJZiBvY2N1cnJlbmNlIGlzIHRydWUgYnV0IG5vIHByZXNldC1vY2N1cnJlbmNlXG4gICAgLy8gVHJlYXQgdGhhdCBgb2NjdXJyZW5jZWAgaXMgQk9VTkRFRCB0byBvcGVyYXRvciBpdHNlbGYsIHNvIGNsZWFucCBhdCBmaW5pc2hlZC5cbiAgICBpZiAodGhpcy5vY2N1cnJlbmNlICYmICF0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmhhc01hcmtlcnMoKSkge1xuICAgICAgdGhpcy5vbkRpZFJlc2V0T3BlcmF0aW9uU3RhY2soKCkgPT4gdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5yZXNldFBhdHRlcm5zKCkpXG4gICAgfVxuICB9XG5cbiAgc2V0TW9kaWZpZXIoe3dpc2UsIG9jY3VycmVuY2UsIG9jY3VycmVuY2VUeXBlfSkge1xuICAgIGlmICh3aXNlKSB7XG4gICAgICB0aGlzLndpc2UgPSB3aXNlXG4gICAgfSBlbHNlIGlmIChvY2N1cnJlbmNlKSB7XG4gICAgICB0aGlzLm9jY3VycmVuY2UgPSBvY2N1cnJlbmNlXG4gICAgICB0aGlzLm9jY3VycmVuY2VUeXBlID0gb2NjdXJyZW5jZVR5cGVcbiAgICAgIC8vIFRoaXMgaXMgbyBtb2RpZmllciBjYXNlKGUuZy4gYGMgbyBwYCwgYGQgTyBmYClcbiAgICAgIC8vIFdlIFJFU0VUIGV4aXN0aW5nIG9jY3VyZW5jZS1tYXJrZXIgd2hlbiBgb2Agb3IgYE9gIG1vZGlmaWVyIGlzIHR5cGVkIGJ5IHVzZXIuXG4gICAgICBjb25zdCByZWdleCA9IHRoaXMuZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKG9jY3VycmVuY2VUeXBlKVxuICAgICAgdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKHJlZ2V4LCB7cmVzZXQ6IHRydWUsIG9jY3VycmVuY2VUeXBlfSlcbiAgICAgIHRoaXMub25EaWRSZXNldE9wZXJhdGlvblN0YWNrKCgpID0+IHRoaXMub2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpKVxuICAgIH1cbiAgfVxuXG4gIC8vIHJldHVybiB0cnVlL2ZhbHNlIHRvIGluZGljYXRlIHN1Y2Nlc3NcbiAgc2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbklmTmVjZXNzYXJ5KCkge1xuICAgIGlmIChcbiAgICAgIHRoaXMuYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbiAmJlxuICAgICAgdGhpcy5nZXRDb25maWcoXCJhdXRvU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbk9uT3BlcmF0ZVwiKSAmJlxuICAgICAgIXRoaXMucGVyc2lzdGVudFNlbGVjdGlvbi5pc0VtcHR5KClcbiAgICApIHtcbiAgICAgIHRoaXMucGVyc2lzdGVudFNlbGVjdGlvbi5zZWxlY3QoKVxuICAgICAgdGhpcy5lZGl0b3IubWVyZ2VJbnRlcnNlY3RpbmdTZWxlY3Rpb25zKClcbiAgICAgIGZvciAoY29uc3QgJHNlbGVjdGlvbiBvZiB0aGlzLnN3cmFwLmdldFNlbGVjdGlvbnModGhpcy5lZGl0b3IpKSB7XG4gICAgICAgIGlmICghJHNlbGVjdGlvbi5oYXNQcm9wZXJ0aWVzKCkpICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXMoKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBnZXRQYXR0ZXJuRm9yT2NjdXJyZW5jZVR5cGUob2NjdXJyZW5jZVR5cGUpIHtcbiAgICBpZiAob2NjdXJyZW5jZVR5cGUgPT09IFwiYmFzZVwiKSB7XG4gICAgICByZXR1cm4gZ2V0V29yZFBhdHRlcm5BdEJ1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCB0aGlzLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgfSBlbHNlIGlmIChvY2N1cnJlbmNlVHlwZSA9PT0gXCJzdWJ3b3JkXCIpIHtcbiAgICAgIHJldHVybiBnZXRTdWJ3b3JkUGF0dGVybkF0QnVmZmVyUG9zaXRpb24odGhpcy5lZGl0b3IsIHRoaXMuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSlcbiAgICB9XG4gIH1cblxuICAvLyB0YXJnZXQgaXMgVGV4dE9iamVjdCBvciBNb3Rpb24gdG8gb3BlcmF0ZSBvbi5cbiAgc2V0VGFyZ2V0KHRhcmdldCkge1xuICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gICAgdGhpcy50YXJnZXQub3BlcmF0b3IgPSB0aGlzXG4gICAgdGhpcy5lbWl0RGlkU2V0VGFyZ2V0KHRoaXMpXG5cbiAgICBpZiAodGhpcy5jYW5FYXJseVNlbGVjdCgpKSB7XG4gICAgICB0aGlzLm5vcm1hbGl6ZVNlbGVjdGlvbnNJZk5lY2Vzc2FyeSgpXG4gICAgICB0aGlzLmNyZWF0ZUJ1ZmZlckNoZWNrcG9pbnQoXCJ1bmRvXCIpXG4gICAgICB0aGlzLnNlbGVjdFRhcmdldCgpXG4gICAgfVxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzZXRUZXh0VG9SZWdpc3RlckZvclNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICB0aGlzLnNldFRleHRUb1JlZ2lzdGVyKHNlbGVjdGlvbi5nZXRUZXh0KCksIHNlbGVjdGlvbilcbiAgfVxuXG4gIHNldFRleHRUb1JlZ2lzdGVyKHRleHQsIHNlbGVjdGlvbikge1xuICAgIGlmICh0aGlzLnZpbVN0YXRlLnJlZ2lzdGVyLmlzVW5uYW1lZCgpICYmIHRoaXMuaXNCbGFja2hvbGVSZWdpc3RlcmVkT3BlcmF0b3IoKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKHRoaXMudGFyZ2V0LmlzTGluZXdpc2UoKSAmJiAhdGV4dC5lbmRzV2l0aChcIlxcblwiKSkge1xuICAgICAgdGV4dCArPSBcIlxcblwiXG4gICAgfVxuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgIHRoaXMudmltU3RhdGUucmVnaXN0ZXIuc2V0KG51bGwsIHt0ZXh0LCBzZWxlY3Rpb259KVxuXG4gICAgICBpZiAodGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5pc1VubmFtZWQoKSkge1xuICAgICAgICBpZiAodGhpcy5pbnN0YW5jZW9mKFwiRGVsZXRlXCIpIHx8IHRoaXMuaW5zdGFuY2VvZihcIkNoYW5nZVwiKSkge1xuICAgICAgICAgIGlmICghdGhpcy5uZWVkU2F2ZVRvTnVtYmVyZWRSZWdpc3Rlcih0aGlzLnRhcmdldCkgJiYgaXNTaW5nbGVMaW5lVGV4dCh0ZXh0KSkge1xuICAgICAgICAgICAgdGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5zZXQoXCItXCIsIHt0ZXh0LCBzZWxlY3Rpb259KSAvLyBzbWFsbC1jaGFuZ2VcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5zZXQoXCIxXCIsIHt0ZXh0LCBzZWxlY3Rpb259KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmluc3RhbmNlb2YoXCJZYW5rXCIpKSB7XG4gICAgICAgICAgdGhpcy52aW1TdGF0ZS5yZWdpc3Rlci5zZXQoXCIwXCIsIHt0ZXh0LCBzZWxlY3Rpb259KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaXNCbGFja2hvbGVSZWdpc3RlcmVkT3BlcmF0b3IoKSB7XG4gICAgY29uc3Qgb3BlcmF0b3JzID0gdGhpcy5nZXRDb25maWcoXCJibGFja2hvbGVSZWdpc3RlcmVkT3BlcmF0b3JzXCIpXG4gICAgY29uc3Qgd2lsZENhcmRPcGVyYXRvcnMgPSBvcGVyYXRvcnMuZmlsdGVyKG5hbWUgPT4gbmFtZS5lbmRzV2l0aChcIipcIikpXG4gICAgY29uc3QgY29tbWFuZE5hbWUgPSB0aGlzLmdldENvbW1hbmROYW1lV2l0aG91dFByZWZpeCgpXG4gICAgcmV0dXJuIChcbiAgICAgIHdpbGRDYXJkT3BlcmF0b3JzLnNvbWUobmFtZSA9PiBuZXcgUmVnRXhwKFwiXlwiICsgbmFtZS5yZXBsYWNlKFwiKlwiLCBcIi4qXCIpKS50ZXN0KGNvbW1hbmROYW1lKSkgfHxcbiAgICAgIG9wZXJhdG9ycy5pbmNsdWRlcyhjb21tYW5kTmFtZSlcbiAgICApXG4gIH1cblxuICBuZWVkU2F2ZVRvTnVtYmVyZWRSZWdpc3Rlcih0YXJnZXQpIHtcbiAgICAvLyBVc2VkIHRvIGRldGVybWluZSB3aGF0IHJlZ2lzdGVyIHRvIHVzZSBvbiBjaGFuZ2UgYW5kIGRlbGV0ZSBvcGVyYXRpb24uXG4gICAgLy8gRm9sbG93aW5nIG1vdGlvbiBzaG91bGQgc2F2ZSB0byAxLTkgcmVnaXN0ZXIgcmVnZXJkbGVzcyBvZiBjb250ZW50IGlzIHNtYWxsIG9yIGJpZy5cbiAgICBjb25zdCBnb2VzVG9OdW1iZXJlZFJlZ2lzdGVyTW90aW9uTmFtZXMgPSBbXG4gICAgICBcIk1vdmVUb1BhaXJcIiwgLy8gJVxuICAgICAgXCJNb3ZlVG9OZXh0U2VudGVuY2VcIiwgLy8gKCwgKVxuICAgICAgXCJTZWFyY2hcIiwgLy8gLywgPywgbiwgTlxuICAgICAgXCJNb3ZlVG9OZXh0UGFyYWdyYXBoXCIsIC8vIHssIH1cbiAgICBdXG4gICAgcmV0dXJuIGdvZXNUb051bWJlcmVkUmVnaXN0ZXJNb3Rpb25OYW1lcy5zb21lKG5hbWUgPT4gdGFyZ2V0Lmluc3RhbmNlb2YobmFtZSkpXG4gIH1cblxuICBub3JtYWxpemVTZWxlY3Rpb25zSWZOZWNlc3NhcnkoKSB7XG4gICAgaWYgKHRoaXMudGFyZ2V0ICYmIHRoaXMudGFyZ2V0LmlzTW90aW9uKCkgJiYgdGhpcy5tb2RlID09PSBcInZpc3VhbFwiKSB7XG4gICAgICB0aGlzLnN3cmFwLm5vcm1hbGl6ZSh0aGlzLmVkaXRvcilcbiAgICB9XG4gIH1cblxuICBzdGFydE11dGF0aW9uKGZuKSB7XG4gICAgaWYgKHRoaXMuY2FuRWFybHlTZWxlY3QoKSkge1xuICAgICAgLy8gLSBTa2lwIHNlbGVjdGlvbiBub3JtYWxpemF0aW9uOiBhbHJlYWR5IG5vcm1hbGl6ZWQgYmVmb3JlIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgLy8gLSBNYW51YWwgY2hlY2twb2ludCBncm91cGluZzogdG8gY3JlYXRlIGNoZWNrcG9pbnQgYmVmb3JlIEBzZWxlY3RUYXJnZXQoKVxuICAgICAgZm4oKVxuICAgICAgdGhpcy5lbWl0V2lsbEZpbmlzaE11dGF0aW9uKClcbiAgICAgIHRoaXMuZ3JvdXBDaGFuZ2VzU2luY2VCdWZmZXJDaGVja3BvaW50KFwidW5kb1wiKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLm5vcm1hbGl6ZVNlbGVjdGlvbnNJZk5lY2Vzc2FyeSgpXG4gICAgICB0aGlzLmVkaXRvci50cmFuc2FjdCgoKSA9PiB7XG4gICAgICAgIGZuKClcbiAgICAgICAgdGhpcy5lbWl0V2lsbEZpbmlzaE11dGF0aW9uKClcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgdGhpcy5lbWl0RGlkRmluaXNoTXV0YXRpb24oKVxuICB9XG5cbiAgLy8gTWFpblxuICBleGVjdXRlKCkge1xuICAgIHRoaXMuc3RhcnRNdXRhdGlvbigoKSA9PiB7XG4gICAgICBpZiAodGhpcy5zZWxlY3RUYXJnZXQoKSkge1xuICAgICAgICBjb25zdCBzZWxlY3Rpb25zID0gdGhpcy5tdXRhdGVTZWxlY3Rpb25PcmRlcmRcbiAgICAgICAgICA/IHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnNPcmRlcmVkQnlCdWZmZXJQb3NpdGlvbigpXG4gICAgICAgICAgOiB0aGlzLmVkaXRvci5nZXRTZWxlY3Rpb25zKClcblxuICAgICAgICBmb3IgKGNvbnN0IHNlbGVjdGlvbiBvZiBzZWxlY3Rpb25zKSB7XG4gICAgICAgICAgdGhpcy5tdXRhdGVTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoXCJkaWQtZmluaXNoXCIpXG4gICAgICAgIHRoaXMucmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5KClcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gRXZlbiB0aG91Z2ggd2UgZmFpbCB0byBzZWxlY3QgdGFyZ2V0IGFuZCBmYWlsIHRvIG11dGF0ZSxcbiAgICAvLyB3ZSBoYXZlIHRvIHJldHVybiB0byBub3JtYWwtbW9kZSBmcm9tIG9wZXJhdG9yLXBlbmRpbmcgb3IgdmlzdWFsXG4gICAgdGhpcy5hY3RpdmF0ZU1vZGUoXCJub3JtYWxcIilcbiAgfVxuXG4gIC8vIFJldHVybiB0cnVlIHVubGVzcyBhbGwgc2VsZWN0aW9uIGlzIGVtcHR5LlxuICBzZWxlY3RUYXJnZXQoKSB7XG4gICAgaWYgKHRoaXMudGFyZ2V0U2VsZWN0ZWQgIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMudGFyZ2V0U2VsZWN0ZWRcbiAgICB9XG4gICAgdGhpcy5tdXRhdGlvbk1hbmFnZXIuaW5pdCh7c3RheUJ5TWFya2VyOiB0aGlzLnN0YXlCeU1hcmtlcn0pXG5cbiAgICBpZiAodGhpcy50YXJnZXQuaXNNb3Rpb24oKSAmJiB0aGlzLm1vZGUgPT09IFwidmlzdWFsXCIpIHRoaXMudGFyZ2V0Lndpc2UgPSB0aGlzLnN1Ym1vZGVcbiAgICBpZiAodGhpcy53aXNlICE9IG51bGwpIHRoaXMudGFyZ2V0LmZvcmNlV2lzZSh0aGlzLndpc2UpXG5cbiAgICB0aGlzLmVtaXRXaWxsU2VsZWN0VGFyZ2V0KClcblxuICAgIC8vIEFsbG93IGN1cnNvciBwb3NpdGlvbiBhZGp1c3RtZW50ICdvbi13aWxsLXNlbGVjdC10YXJnZXQnIGhvb2suXG4gICAgLy8gc28gY2hlY2twb2ludCBjb21lcyBBRlRFUiBAZW1pdFdpbGxTZWxlY3RUYXJnZXQoKVxuICAgIHRoaXMubXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoXCJ3aWxsLXNlbGVjdFwiKVxuXG4gICAgLy8gTk9URVxuICAgIC8vIFNpbmNlIE1vdmVUb05leHRPY2N1cnJlbmNlLCBNb3ZlVG9QcmV2aW91c09jY3VycmVuY2UgbW90aW9uIG1vdmUgYnlcbiAgICAvLyAgb2NjdXJyZW5jZS1tYXJrZXIsIG9jY3VycmVuY2UtbWFya2VyIGhhcyB0byBiZSBjcmVhdGVkIEJFRk9SRSBgQHRhcmdldC5leGVjdXRlKClgXG4gICAgLy8gQW5kIHdoZW4gcmVwZWF0ZWQsIG9jY3VycmVuY2UgcGF0dGVybiBpcyBhbHJlYWR5IGNhY2hlZCBhdCBAcGF0dGVybkZvck9jY3VycmVuY2VcbiAgICBpZiAodGhpcy5yZXBlYXRlZCAmJiB0aGlzLm9jY3VycmVuY2UgJiYgIXRoaXMub2NjdXJyZW5jZU1hbmFnZXIuaGFzTWFya2VycygpKSB7XG4gICAgICB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmFkZFBhdHRlcm4odGhpcy5wYXR0ZXJuRm9yT2NjdXJyZW5jZSwge29jY3VycmVuY2VUeXBlOiB0aGlzLm9jY3VycmVuY2VUeXBlfSlcbiAgICB9XG5cbiAgICB0aGlzLnRhcmdldC5leGVjdXRlKClcblxuICAgIHRoaXMubXV0YXRpb25NYW5hZ2VyLnNldENoZWNrcG9pbnQoXCJkaWQtc2VsZWN0XCIpXG4gICAgaWYgKHRoaXMub2NjdXJyZW5jZSkge1xuICAgICAgLy8gVG8gcmVwb2VhdChgLmApIG9wZXJhdGlvbiB3aGVyZSBtdWx0aXBsZSBvY2N1cnJlbmNlIHBhdHRlcm5zIHdhcyBzZXQuXG4gICAgICAvLyBIZXJlIHdlIHNhdmUgcGF0dGVybnMgd2hpY2ggcmVwcmVzZW50IHVuaW9uZWQgcmVnZXggd2hpY2ggQG9jY3VycmVuY2VNYW5hZ2VyIGtub3dzLlxuICAgICAgaWYgKCF0aGlzLnBhdHRlcm5Gb3JPY2N1cnJlbmNlKSB7XG4gICAgICAgIHRoaXMucGF0dGVybkZvck9jY3VycmVuY2UgPSB0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLmJ1aWxkUGF0dGVybigpXG4gICAgICB9XG5cbiAgICAgIHRoaXMub2NjdXJyZW5jZVdpc2UgPSB0aGlzLndpc2UgfHwgXCJjaGFyYWN0ZXJ3aXNlXCJcbiAgICAgIGlmICh0aGlzLm9jY3VycmVuY2VNYW5hZ2VyLnNlbGVjdCh0aGlzLm9jY3VycmVuY2VXaXNlKSkge1xuICAgICAgICB0aGlzLm9jY3VycmVuY2VTZWxlY3RlZCA9IHRydWVcbiAgICAgICAgdGhpcy5tdXRhdGlvbk1hbmFnZXIuc2V0Q2hlY2twb2ludChcImRpZC1zZWxlY3Qtb2NjdXJyZW5jZVwiKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMudGFyZ2V0U2VsZWN0ZWQgPSB0aGlzLnZpbVN0YXRlLmhhdmVTb21lTm9uRW1wdHlTZWxlY3Rpb24oKSB8fCB0aGlzLnRhcmdldC5uYW1lID09PSBcIkVtcHR5XCJcbiAgICBpZiAodGhpcy50YXJnZXRTZWxlY3RlZCkge1xuICAgICAgdGhpcy5lbWl0RGlkU2VsZWN0VGFyZ2V0KClcbiAgICAgIHRoaXMuZmxhc2hDaGFuZ2VJZk5lY2Vzc2FyeSgpXG4gICAgICB0aGlzLnRyYWNrQ2hhbmdlSWZOZWNlc3NhcnkoKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVtaXREaWRGYWlsU2VsZWN0VGFyZ2V0KClcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy50YXJnZXRTZWxlY3RlZFxuICB9XG5cbiAgcmVzdG9yZUN1cnNvclBvc2l0aW9uc0lmTmVjZXNzYXJ5KCkge1xuICAgIGlmICghdGhpcy5yZXN0b3JlUG9zaXRpb25zKSByZXR1cm5cblxuICAgIGNvbnN0IHN0YXkgPVxuICAgICAgdGhpcy5zdGF5QXRTYW1lUG9zaXRpb24gIT0gbnVsbFxuICAgICAgICA/IHRoaXMuc3RheUF0U2FtZVBvc2l0aW9uXG4gICAgICAgIDogdGhpcy5nZXRDb25maWcodGhpcy5zdGF5T3B0aW9uTmFtZSkgfHwgKHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkICYmIHRoaXMuZ2V0Q29uZmlnKFwic3RheU9uT2NjdXJyZW5jZVwiKSlcbiAgICBjb25zdCB3aXNlID0gdGhpcy5vY2N1cnJlbmNlU2VsZWN0ZWQgPyB0aGlzLm9jY3VycmVuY2VXaXNlIDogdGhpcy50YXJnZXQud2lzZVxuICAgIGNvbnN0IHtzZXRUb0ZpcnN0Q2hhcmFjdGVyT25MaW5ld2lzZX0gPSB0aGlzXG4gICAgdGhpcy5tdXRhdGlvbk1hbmFnZXIucmVzdG9yZUN1cnNvclBvc2l0aW9ucyh7c3RheSwgd2lzZSwgc2V0VG9GaXJzdENoYXJhY3Rlck9uTGluZXdpc2V9KVxuICB9XG59XG5PcGVyYXRvci5yZWdpc3RlcihmYWxzZSlcblxuY2xhc3MgU2VsZWN0QmFzZSBleHRlbmRzIE9wZXJhdG9yIHtcbiAgZmxhc2hUYXJnZXQgPSBmYWxzZVxuICByZWNvcmRhYmxlID0gZmFsc2VcblxuICBleGVjdXRlKCkge1xuICAgIHRoaXMuc3RhcnRNdXRhdGlvbigoKSA9PiB0aGlzLnNlbGVjdFRhcmdldCgpKVxuXG4gICAgaWYgKHRoaXMudGFyZ2V0LnNlbGVjdFN1Y2NlZWRlZCkge1xuICAgICAgaWYgKHRoaXMudGFyZ2V0LmlzVGV4dE9iamVjdCgpKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnNjcm9sbFRvQ3Vyc29yUG9zaXRpb24oKVxuICAgICAgfVxuICAgICAgY29uc3Qgd2lzZSA9IHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkID8gdGhpcy5vY2N1cnJlbmNlV2lzZSA6IHRoaXMudGFyZ2V0Lndpc2VcbiAgICAgIHRoaXMuYWN0aXZhdGVNb2RlSWZOZWNlc3NhcnkoXCJ2aXN1YWxcIiwgd2lzZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jYW5jZWxPcGVyYXRpb24oKVxuICAgIH1cbiAgfVxufVxuU2VsZWN0QmFzZS5yZWdpc3RlcihmYWxzZSlcblxuY2xhc3MgU2VsZWN0IGV4dGVuZHMgU2VsZWN0QmFzZSB7XG4gIGV4ZWN1dGUoKSB7XG4gICAgZm9yIChjb25zdCAkc2VsZWN0aW9uIG9mIHRoaXMuc3dyYXAuZ2V0U2VsZWN0aW9ucyh0aGlzLmVkaXRvcikpIHtcbiAgICAgIGlmICghJHNlbGVjdGlvbi5oYXNQcm9wZXJ0aWVzKCkpICRzZWxlY3Rpb24uc2F2ZVByb3BlcnRpZXMoKVxuICAgIH1cbiAgICBzdXBlci5leGVjdXRlKClcbiAgfVxufVxuU2VsZWN0LnJlZ2lzdGVyKClcblxuY2xhc3MgU2VsZWN0TGF0ZXN0Q2hhbmdlIGV4dGVuZHMgU2VsZWN0QmFzZSB7XG4gIHRhcmdldCA9IFwiQUxhdGVzdENoYW5nZVwiXG59XG5TZWxlY3RMYXRlc3RDaGFuZ2UucmVnaXN0ZXIoKVxuXG5jbGFzcyBTZWxlY3RQcmV2aW91c1NlbGVjdGlvbiBleHRlbmRzIFNlbGVjdEJhc2Uge1xuICB0YXJnZXQgPSBcIlByZXZpb3VzU2VsZWN0aW9uXCJcbn1cblNlbGVjdFByZXZpb3VzU2VsZWN0aW9uLnJlZ2lzdGVyKClcblxuY2xhc3MgU2VsZWN0UGVyc2lzdGVudFNlbGVjdGlvbiBleHRlbmRzIFNlbGVjdEJhc2Uge1xuICB0YXJnZXQgPSBcIkFQZXJzaXN0ZW50U2VsZWN0aW9uXCJcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbiA9IGZhbHNlXG59XG5TZWxlY3RQZXJzaXN0ZW50U2VsZWN0aW9uLnJlZ2lzdGVyKClcblxuY2xhc3MgU2VsZWN0T2NjdXJyZW5jZSBleHRlbmRzIFNlbGVjdEJhc2Uge1xuICBvY2N1cnJlbmNlID0gdHJ1ZVxufVxuU2VsZWN0T2NjdXJyZW5jZS5yZWdpc3RlcigpXG5cbi8vIFNlbGVjdEluVmlzdWFsTW9kZTogdXNlZCBpbiB2aXN1YWwtbW9kZVxuLy8gV2hlbiB0ZXh0LW9iamVjdCBpcyBpbnZva2VkIGZyb20gbm9ybWFsIG9yIHZpdXNhbC1tb2RlLCBvcGVyYXRpb24gd291bGQgYmVcbi8vICA9PiBTZWxlY3RJblZpc3VhbE1vZGUgb3BlcmF0b3Igd2l0aCB0YXJnZXQ9dGV4dC1vYmplY3Rcbi8vIFdoZW4gbW90aW9uIGlzIGludm9rZWQgZnJvbSB2aXN1YWwtbW9kZSwgb3BlcmF0aW9uIHdvdWxkIGJlXG4vLyAgPT4gU2VsZWN0SW5WaXN1YWxNb2RlIG9wZXJhdG9yIHdpdGggdGFyZ2V0PW1vdGlvbilcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBTZWxlY3RJblZpc3VhbE1vZGUgaXMgdXNlZCBpbiBUV08gc2l0dWF0aW9uLlxuLy8gLSB2aXN1YWwtbW9kZSBvcGVyYXRpb25cbi8vICAgLSBlLmc6IGB2IGxgLCBgViBqYCwgYHYgaSBwYC4uLlxuLy8gLSBEaXJlY3RseSBpbnZva2UgdGV4dC1vYmplY3QgZnJvbSBub3JtYWwtbW9kZVxuLy8gICAtIGUuZzogSW52b2tlIGBJbm5lciBQYXJhZ3JhcGhgIGZyb20gY29tbWFuZC1wYWxldHRlLlxuY2xhc3MgU2VsZWN0SW5WaXN1YWxNb2RlIGV4dGVuZHMgU2VsZWN0QmFzZSB7XG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2UgPSBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gZmFsc2Vcbn1cblNlbGVjdEluVmlzdWFsTW9kZS5yZWdpc3RlcihmYWxzZSlcblxuLy8gUGVyc2lzdGVudCBTZWxlY3Rpb25cbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIENyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb24gZXh0ZW5kcyBPcGVyYXRvciB7XG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgc3RheUF0U2FtZVBvc2l0aW9uID0gdHJ1ZVxuICBhY2NlcHRQcmVzZXRPY2N1cnJlbmNlID0gZmFsc2VcbiAgYWNjZXB0UGVyc2lzdGVudFNlbGVjdGlvbiA9IGZhbHNlXG5cbiAgbXV0YXRlU2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIHRoaXMucGVyc2lzdGVudFNlbGVjdGlvbi5tYXJrQnVmZmVyUmFuZ2Uoc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKCkpXG4gIH1cbn1cbkNyZWF0ZVBlcnNpc3RlbnRTZWxlY3Rpb24ucmVnaXN0ZXIoKVxuXG5jbGFzcyBUb2dnbGVQZXJzaXN0ZW50U2VsZWN0aW9uIGV4dGVuZHMgQ3JlYXRlUGVyc2lzdGVudFNlbGVjdGlvbiB7XG4gIGlzQ29tcGxldGUoKSB7XG4gICAgY29uc3QgcG9pbnQgPSB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG4gICAgdGhpcy5tYXJrZXJUb1JlbW92ZSA9IHRoaXMucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJBdFBvaW50KHBvaW50KVxuICAgIHJldHVybiB0aGlzLm1hcmtlclRvUmVtb3ZlIHx8IHN1cGVyLmlzQ29tcGxldGUoKVxuICB9XG5cbiAgZXhlY3V0ZSgpIHtcbiAgICBpZiAodGhpcy5tYXJrZXJUb1JlbW92ZSkge1xuICAgICAgdGhpcy5tYXJrZXJUb1JlbW92ZS5kZXN0cm95KClcbiAgICB9IGVsc2Uge1xuICAgICAgc3VwZXIuZXhlY3V0ZSgpXG4gICAgfVxuICB9XG59XG5Ub2dnbGVQZXJzaXN0ZW50U2VsZWN0aW9uLnJlZ2lzdGVyKClcblxuLy8gUHJlc2V0IE9jY3VycmVuY2Vcbi8vID09PT09PT09PT09PT09PT09PT09PT09PT1cbmNsYXNzIFRvZ2dsZVByZXNldE9jY3VycmVuY2UgZXh0ZW5kcyBPcGVyYXRvciB7XG4gIHRhcmdldCA9IFwiRW1wdHlcIlxuICBmbGFzaFRhcmdldCA9IGZhbHNlXG4gIGFjY2VwdFByZXNldE9jY3VycmVuY2UgPSBmYWxzZVxuICBhY2NlcHRQZXJzaXN0ZW50U2VsZWN0aW9uID0gZmFsc2VcbiAgb2NjdXJyZW5jZVR5cGUgPSBcImJhc2VcIlxuXG4gIGV4ZWN1dGUoKSB7XG4gICAgY29uc3QgbWFya2VyID0gdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5nZXRNYXJrZXJBdFBvaW50KHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgaWYgKG1hcmtlcikge1xuICAgICAgdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5kZXN0cm95TWFya2VycyhbbWFya2VyXSlcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgaXNOYXJyb3dlZCA9IHRoaXMudmltU3RhdGUubW9kZU1hbmFnZXIuaXNOYXJyb3dlZCgpXG5cbiAgICAgIGxldCByZWdleFxuICAgICAgaWYgKHRoaXMubW9kZSA9PT0gXCJ2aXN1YWxcIiAmJiAhaXNOYXJyb3dlZCkge1xuICAgICAgICB0aGlzLm9jY3VycmVuY2VUeXBlID0gXCJiYXNlXCJcbiAgICAgICAgcmVnZXggPSBuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKHRoaXMuZWRpdG9yLmdldFNlbGVjdGVkVGV4dCgpKSwgXCJnXCIpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWdleCA9IHRoaXMuZ2V0UGF0dGVybkZvck9jY3VycmVuY2VUeXBlKHRoaXMub2NjdXJyZW5jZVR5cGUpXG4gICAgICB9XG5cbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybihyZWdleCwge29jY3VycmVuY2VUeXBlOiB0aGlzLm9jY3VycmVuY2VUeXBlfSlcbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuc2F2ZUxhc3RQYXR0ZXJuKHRoaXMub2NjdXJyZW5jZVR5cGUpXG5cbiAgICAgIGlmICghaXNOYXJyb3dlZCkgdGhpcy5hY3RpdmF0ZU1vZGUoXCJub3JtYWxcIilcbiAgICB9XG4gIH1cbn1cblRvZ2dsZVByZXNldE9jY3VycmVuY2UucmVnaXN0ZXIoKVxuXG5jbGFzcyBUb2dnbGVQcmVzZXRTdWJ3b3JkT2NjdXJyZW5jZSBleHRlbmRzIFRvZ2dsZVByZXNldE9jY3VycmVuY2Uge1xuICBvY2N1cnJlbmNlVHlwZSA9IFwic3Vid29yZFwiXG59XG5Ub2dnbGVQcmVzZXRTdWJ3b3JkT2NjdXJyZW5jZS5yZWdpc3RlcigpXG5cbi8vIFdhbnQgdG8gcmVuYW1lIFJlc3RvcmVPY2N1cnJlbmNlTWFya2VyXG5jbGFzcyBBZGRQcmVzZXRPY2N1cnJlbmNlRnJvbUxhc3RPY2N1cnJlbmNlUGF0dGVybiBleHRlbmRzIFRvZ2dsZVByZXNldE9jY3VycmVuY2Uge1xuICBleGVjdXRlKCkge1xuICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIucmVzZXRQYXR0ZXJucygpXG4gICAgY29uc3QgcmVnZXggPSB0aGlzLmdsb2JhbFN0YXRlLmdldChcImxhc3RPY2N1cnJlbmNlUGF0dGVyblwiKVxuICAgIGlmIChyZWdleCkge1xuICAgICAgY29uc3Qgb2NjdXJyZW5jZVR5cGUgPSB0aGlzLmdsb2JhbFN0YXRlLmdldChcImxhc3RPY2N1cnJlbmNlVHlwZVwiKVxuICAgICAgdGhpcy5vY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKHJlZ2V4LCB7b2NjdXJyZW5jZVR5cGV9KVxuICAgICAgdGhpcy5hY3RpdmF0ZU1vZGUoXCJub3JtYWxcIilcbiAgICB9XG4gIH1cbn1cbkFkZFByZXNldE9jY3VycmVuY2VGcm9tTGFzdE9jY3VycmVuY2VQYXR0ZXJuLnJlZ2lzdGVyKClcblxuLy8gRGVsZXRlXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuY2xhc3MgRGVsZXRlIGV4dGVuZHMgT3BlcmF0b3Ige1xuICB0cmFja0NoYW5nZSA9IHRydWVcbiAgZmxhc2hDaGVja3BvaW50ID0gXCJkaWQtc2VsZWN0LW9jY3VycmVuY2VcIlxuICBmbGFzaFR5cGVGb3JPY2N1cnJlbmNlID0gXCJvcGVyYXRvci1yZW1vdmUtb2NjdXJyZW5jZVwiXG4gIHN0YXlPcHRpb25OYW1lID0gXCJzdGF5T25EZWxldGVcIlxuICBzZXRUb0ZpcnN0Q2hhcmFjdGVyT25MaW5ld2lzZSA9IHRydWVcblxuICBleGVjdXRlKCkge1xuICAgIHRoaXMub25EaWRTZWxlY3RUYXJnZXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMub2NjdXJyZW5jZVNlbGVjdGVkICYmIHRoaXMub2NjdXJyZW5jZVdpc2UgPT09IFwibGluZXdpc2VcIikge1xuICAgICAgICB0aGlzLmZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKHRoaXMudGFyZ2V0Lndpc2UgPT09IFwiYmxvY2t3aXNlXCIpIHtcbiAgICAgIHRoaXMucmVzdG9yZVBvc2l0aW9ucyA9IGZhbHNlXG4gICAgfVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG5cbiAgbXV0YXRlU2VsZWN0aW9uKHNlbGVjdGlvbikge1xuICAgIHRoaXMuc2V0VGV4dFRvUmVnaXN0ZXJGb3JTZWxlY3Rpb24oc2VsZWN0aW9uKVxuICAgIHNlbGVjdGlvbi5kZWxldGVTZWxlY3RlZFRleHQoKVxuICB9XG59XG5EZWxldGUucmVnaXN0ZXIoKVxuXG5jbGFzcyBEZWxldGVSaWdodCBleHRlbmRzIERlbGV0ZSB7XG4gIHRhcmdldCA9IFwiTW92ZVJpZ2h0XCJcbn1cbkRlbGV0ZVJpZ2h0LnJlZ2lzdGVyKClcblxuY2xhc3MgRGVsZXRlTGVmdCBleHRlbmRzIERlbGV0ZSB7XG4gIHRhcmdldCA9IFwiTW92ZUxlZnRcIlxufVxuRGVsZXRlTGVmdC5yZWdpc3RlcigpXG5cbmNsYXNzIERlbGV0ZVRvTGFzdENoYXJhY3Rlck9mTGluZSBleHRlbmRzIERlbGV0ZSB7XG4gIHRhcmdldCA9IFwiTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZVwiXG5cbiAgZXhlY3V0ZSgpIHtcbiAgICB0aGlzLm9uRGlkU2VsZWN0VGFyZ2V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnRhcmdldC53aXNlID09PSBcImJsb2Nrd2lzZVwiKSB7XG4gICAgICAgIGZvciAoY29uc3QgYmxvY2t3aXNlU2VsZWN0aW9uIG9mIHRoaXMuZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucygpKSB7XG4gICAgICAgICAgYmxvY2t3aXNlU2VsZWN0aW9uLmV4dGVuZE1lbWJlclNlbGVjdGlvbnNUb0VuZE9mTGluZSgpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuICB9XG59XG5EZWxldGVUb0xhc3RDaGFyYWN0ZXJPZkxpbmUucmVnaXN0ZXIoKVxuXG5jbGFzcyBEZWxldGVMaW5lIGV4dGVuZHMgRGVsZXRlIHtcbiAgd2lzZSA9IFwibGluZXdpc2VcIlxuICB0YXJnZXQgPSBcIk1vdmVUb1JlbGF0aXZlTGluZVwiXG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2Vcbn1cbkRlbGV0ZUxpbmUucmVnaXN0ZXIoKVxuXG4vLyBZYW5rXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09XG5jbGFzcyBZYW5rIGV4dGVuZHMgT3BlcmF0b3Ige1xuICB0cmFja0NoYW5nZSA9IHRydWVcbiAgc3RheU9wdGlvbk5hbWUgPSBcInN0YXlPbllhbmtcIlxuXG4gIG11dGF0ZVNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICB0aGlzLnNldFRleHRUb1JlZ2lzdGVyRm9yU2VsZWN0aW9uKHNlbGVjdGlvbilcbiAgfVxufVxuWWFuay5yZWdpc3RlcigpXG5cbmNsYXNzIFlhbmtMaW5lIGV4dGVuZHMgWWFuayB7XG4gIHdpc2UgPSBcImxpbmV3aXNlXCJcbiAgdGFyZ2V0ID0gXCJNb3ZlVG9SZWxhdGl2ZUxpbmVcIlxufVxuWWFua0xpbmUucmVnaXN0ZXIoKVxuXG5jbGFzcyBZYW5rVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lIGV4dGVuZHMgWWFuayB7XG4gIHRhcmdldCA9IFwiTW92ZVRvTGFzdENoYXJhY3Rlck9mTGluZVwiXG59XG5ZYW5rVG9MYXN0Q2hhcmFjdGVyT2ZMaW5lLnJlZ2lzdGVyKClcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gW2N0cmwtYV1cbmNsYXNzIEluY3JlYXNlIGV4dGVuZHMgT3BlcmF0b3Ige1xuICB0YXJnZXQgPSBcIkVtcHR5XCIgLy8gY3RybC1hIGluIG5vcm1hbC1tb2RlIGZpbmQgdGFyZ2V0IG51bWJlciBpbiBjdXJyZW50IGxpbmUgbWFudWFsbHlcbiAgZmxhc2hUYXJnZXQgPSBmYWxzZSAvLyBkbyBtYW51YWxseVxuICByZXN0b3JlUG9zaXRpb25zID0gZmFsc2UgLy8gZG8gbWFudWFsbHlcbiAgc3RlcCA9IDFcblxuICBleGVjdXRlKCkge1xuICAgIHRoaXMubmV3UmFuZ2VzID0gW11cbiAgICBpZiAoIXRoaXMucmVnZXgpIHRoaXMucmVnZXggPSBuZXcgUmVnRXhwKGAke3RoaXMuZ2V0Q29uZmlnKFwibnVtYmVyUmVnZXhcIil9YCwgXCJnXCIpXG5cbiAgICBzdXBlci5leGVjdXRlKClcblxuICAgIGlmICh0aGlzLm5ld1Jhbmdlcy5sZW5ndGgpIHtcbiAgICAgIGlmICh0aGlzLmdldENvbmZpZyhcImZsYXNoT25PcGVyYXRlXCIpICYmICF0aGlzLmdldENvbmZpZyhcImZsYXNoT25PcGVyYXRlQmxhY2tsaXN0XCIpLmluY2x1ZGVzKHRoaXMubmFtZSkpIHtcbiAgICAgICAgdGhpcy52aW1TdGF0ZS5mbGFzaCh0aGlzLm5ld1Jhbmdlcywge3R5cGU6IHRoaXMuZmxhc2hUeXBlRm9yT2NjdXJyZW5jZX0pXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmVwbGFjZU51bWJlckluQnVmZmVyUmFuZ2Uoc2NhblJhbmdlLCBmbikge1xuICAgIGNvbnN0IG5ld1JhbmdlcyA9IFtdXG4gICAgdGhpcy5zY2FuRm9yd2FyZCh0aGlzLnJlZ2V4LCB7c2NhblJhbmdlfSwgZXZlbnQgPT4ge1xuICAgICAgaWYgKGZuKSB7XG4gICAgICAgIGlmIChmbihldmVudCkpIGV2ZW50LnN0b3AoKVxuICAgICAgICBlbHNlIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgbmV4dE51bWJlciA9IHRoaXMuZ2V0TmV4dE51bWJlcihldmVudC5tYXRjaFRleHQpXG4gICAgICBuZXdSYW5nZXMucHVzaChldmVudC5yZXBsYWNlKFN0cmluZyhuZXh0TnVtYmVyKSkpXG4gICAgfSlcbiAgICByZXR1cm4gbmV3UmFuZ2VzXG4gIH1cblxuICBtdXRhdGVTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgY29uc3Qge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICBpZiAodGhpcy50YXJnZXQuaXMoXCJFbXB0eVwiKSkge1xuICAgICAgLy8gY3RybC1hLCBjdHJsLXggaW4gYG5vcm1hbC1tb2RlYFxuICAgICAgY29uc3QgY3Vyc29yUG9zaXRpb24gPSBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICAgICAgY29uc3Qgc2NhblJhbmdlID0gdGhpcy5lZGl0b3IuYnVmZmVyUmFuZ2VGb3JCdWZmZXJSb3coY3Vyc29yUG9zaXRpb24ucm93KVxuICAgICAgY29uc3QgbmV3UmFuZ2VzID0gdGhpcy5yZXBsYWNlTnVtYmVySW5CdWZmZXJSYW5nZShzY2FuUmFuZ2UsIGV2ZW50ID0+XG4gICAgICAgIGV2ZW50LnJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuKGN1cnNvclBvc2l0aW9uKVxuICAgICAgKVxuICAgICAgY29uc3QgcG9pbnQgPSAobmV3UmFuZ2VzLmxlbmd0aCAmJiBuZXdSYW5nZXNbMF0uZW5kLnRyYW5zbGF0ZShbMCwgLTFdKSkgfHwgY3Vyc29yUG9zaXRpb25cbiAgICAgIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludClcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc2NhblJhbmdlID0gc2VsZWN0aW9uLmdldEJ1ZmZlclJhbmdlKClcbiAgICAgIHRoaXMubmV3UmFuZ2VzLnB1c2goLi4udGhpcy5yZXBsYWNlTnVtYmVySW5CdWZmZXJSYW5nZShzY2FuUmFuZ2UpKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHNjYW5SYW5nZS5zdGFydClcbiAgICB9XG4gIH1cblxuICBnZXROZXh0TnVtYmVyKG51bWJlclN0cmluZykge1xuICAgIHJldHVybiBOdW1iZXIucGFyc2VJbnQobnVtYmVyU3RyaW5nLCAxMCkgKyB0aGlzLnN0ZXAgKiB0aGlzLmdldENvdW50KClcbiAgfVxufVxuSW5jcmVhc2UucmVnaXN0ZXIoKVxuXG4vLyBbY3RybC14XVxuY2xhc3MgRGVjcmVhc2UgZXh0ZW5kcyBJbmNyZWFzZSB7XG4gIHN0ZXAgPSAtMVxufVxuRGVjcmVhc2UucmVnaXN0ZXIoKVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBbZyBjdHJsLWFdXG5jbGFzcyBJbmNyZW1lbnROdW1iZXIgZXh0ZW5kcyBJbmNyZWFzZSB7XG4gIGJhc2VOdW1iZXIgPSBudWxsXG4gIHRhcmdldCA9IG51bGxcbiAgbXV0YXRlU2VsZWN0aW9uT3JkZXJkID0gdHJ1ZVxuXG4gIGdldE5leHROdW1iZXIobnVtYmVyU3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuYmFzZU51bWJlciAhPSBudWxsKSB7XG4gICAgICB0aGlzLmJhc2VOdW1iZXIgKz0gdGhpcy5zdGVwICogdGhpcy5nZXRDb3VudCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYmFzZU51bWJlciA9IE51bWJlci5wYXJzZUludChudW1iZXJTdHJpbmcsIDEwKVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5iYXNlTnVtYmVyXG4gIH1cbn1cbkluY3JlbWVudE51bWJlci5yZWdpc3RlcigpXG5cbi8vIFtnIGN0cmwteF1cbmNsYXNzIERlY3JlbWVudE51bWJlciBleHRlbmRzIEluY3JlbWVudE51bWJlciB7XG4gIHN0ZXAgPSAtMVxufVxuRGVjcmVtZW50TnVtYmVyLnJlZ2lzdGVyKClcblxuLy8gUHV0XG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDdXJzb3IgcGxhY2VtZW50OlxuLy8gLSBwbGFjZSBhdCBlbmQgb2YgbXV0YXRpb246IHBhc3RlIG5vbi1tdWx0aWxpbmUgY2hhcmFjdGVyd2lzZSB0ZXh0XG4vLyAtIHBsYWNlIGF0IHN0YXJ0IG9mIG11dGF0aW9uOiBub24tbXVsdGlsaW5lIGNoYXJhY3Rlcndpc2UgdGV4dChjaGFyYWN0ZXJ3aXNlLCBsaW5ld2lzZSlcbmNsYXNzIFB1dEJlZm9yZSBleHRlbmRzIE9wZXJhdG9yIHtcbiAgbG9jYXRpb24gPSBcImJlZm9yZVwiXG4gIHRhcmdldCA9IFwiRW1wdHlcIlxuICBmbGFzaFR5cGUgPSBcIm9wZXJhdG9yLWxvbmdcIlxuICByZXN0b3JlUG9zaXRpb25zID0gZmFsc2UgLy8gbWFuYWdlIG1hbnVhbGx5XG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2UgLy8gbWFuYWdlIG1hbnVhbGx5XG4gIHRyYWNrQ2hhbmdlID0gZmFsc2UgLy8gbWFuYWdlIG1hbnVhbGx5XG5cbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICB0aGlzLnZpbVN0YXRlLnNlcXVlbnRpYWxQYXN0ZU1hbmFnZXIub25Jbml0aWFsaXplKHRoaXMpXG4gICAgcmV0dXJuIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgZXhlY3V0ZSgpIHtcbiAgICB0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uID0gbmV3IE1hcCgpXG4gICAgdGhpcy5zZXF1ZW50aWFsUGFzdGUgPSB0aGlzLnZpbVN0YXRlLnNlcXVlbnRpYWxQYXN0ZU1hbmFnZXIub25FeGVjdXRlKHRoaXMpXG5cbiAgICB0aGlzLm9uRGlkRmluaXNoTXV0YXRpb24oKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmNhbmNlbGxlZCkgdGhpcy5hZGp1c3RDdXJzb3JQb3NpdGlvbigpXG4gICAgfSlcblxuICAgIHN1cGVyLmV4ZWN1dGUoKVxuXG4gICAgaWYgKHRoaXMuY2FuY2VsbGVkKSByZXR1cm5cblxuICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4ge1xuICAgICAgLy8gVHJhY2tDaGFuZ2VcbiAgICAgIGNvbnN0IG5ld1JhbmdlID0gdGhpcy5tdXRhdGlvbnNCeVNlbGVjdGlvbi5nZXQodGhpcy5lZGl0b3IuZ2V0TGFzdFNlbGVjdGlvbigpKVxuICAgICAgaWYgKG5ld1JhbmdlKSB0aGlzLnNldE1hcmtGb3JDaGFuZ2UobmV3UmFuZ2UpXG5cbiAgICAgIC8vIEZsYXNoXG4gICAgICBpZiAodGhpcy5nZXRDb25maWcoXCJmbGFzaE9uT3BlcmF0ZVwiKSAmJiAhdGhpcy5nZXRDb25maWcoXCJmbGFzaE9uT3BlcmF0ZUJsYWNrbGlzdFwiKS5pbmNsdWRlcyh0aGlzLm5hbWUpKSB7XG4gICAgICAgIGNvbnN0IHJhbmdlcyA9IHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5tYXAoc2VsZWN0aW9uID0+IHRoaXMubXV0YXRpb25zQnlTZWxlY3Rpb24uZ2V0KHNlbGVjdGlvbikpXG4gICAgICAgIHRoaXMudmltU3RhdGUuZmxhc2gocmFuZ2VzLCB7dHlwZTogdGhpcy5nZXRGbGFzaFR5cGUoKX0pXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGFkanVzdEN1cnNvclBvc2l0aW9uKCkge1xuICAgIGZvciAoY29uc3Qgc2VsZWN0aW9uIG9mIHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKSkge1xuICAgICAgaWYgKCF0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uLmhhcyhzZWxlY3Rpb24pKSBjb250aW51ZVxuXG4gICAgICBjb25zdCB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgICAgY29uc3QgbmV3UmFuZ2UgPSB0aGlzLm11dGF0aW9uc0J5U2VsZWN0aW9uLmdldChzZWxlY3Rpb24pXG4gICAgICBpZiAodGhpcy5saW5ld2lzZVBhc3RlKSB7XG4gICAgICAgIG1vdmVDdXJzb3JUb0ZpcnN0Q2hhcmFjdGVyQXRSb3coY3Vyc29yLCBuZXdSYW5nZS5zdGFydC5yb3cpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobmV3UmFuZ2UuaXNTaW5nbGVMaW5lKCkpIHtcbiAgICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obmV3UmFuZ2UuZW5kLnRyYW5zbGF0ZShbMCwgLTFdKSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjdXJzb3Iuc2V0QnVmZmVyUG9zaXRpb24obmV3UmFuZ2Uuc3RhcnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBtdXRhdGVTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0aGlzLnZpbVN0YXRlLnJlZ2lzdGVyLmdldChudWxsLCBzZWxlY3Rpb24sIHRoaXMuc2VxdWVudGlhbFBhc3RlKVxuICAgIGlmICghdmFsdWUudGV4dCkge1xuICAgICAgdGhpcy5jYW5jZWxsZWQgPSB0cnVlXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB0ZXh0VG9QYXN0ZSA9IF8ubXVsdGlwbHlTdHJpbmcodmFsdWUudGV4dCwgdGhpcy5nZXRDb3VudCgpKVxuICAgIHRoaXMubGluZXdpc2VQYXN0ZSA9IHZhbHVlLnR5cGUgPT09IFwibGluZXdpc2VcIiB8fCB0aGlzLmlzTW9kZShcInZpc3VhbFwiLCBcImxpbmV3aXNlXCIpXG4gICAgY29uc3QgbmV3UmFuZ2UgPSB0aGlzLnBhc3RlKHNlbGVjdGlvbiwgdGV4dFRvUGFzdGUsIHtsaW5ld2lzZVBhc3RlOiB0aGlzLmxpbmV3aXNlUGFzdGV9KVxuICAgIHRoaXMubXV0YXRpb25zQnlTZWxlY3Rpb24uc2V0KHNlbGVjdGlvbiwgbmV3UmFuZ2UpXG4gICAgdGhpcy52aW1TdGF0ZS5zZXF1ZW50aWFsUGFzdGVNYW5hZ2VyLnNhdmVQYXN0ZWRSYW5nZUZvclNlbGVjdGlvbihzZWxlY3Rpb24sIG5ld1JhbmdlKVxuICB9XG5cbiAgLy8gUmV0dXJuIHBhc3RlZCByYW5nZVxuICBwYXN0ZShzZWxlY3Rpb24sIHRleHQsIHtsaW5ld2lzZVBhc3RlfSkge1xuICAgIGlmICh0aGlzLnNlcXVlbnRpYWxQYXN0ZSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFzdGVDaGFyYWN0ZXJ3aXNlKHNlbGVjdGlvbiwgdGV4dClcbiAgICB9IGVsc2UgaWYgKGxpbmV3aXNlUGFzdGUpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhc3RlTGluZXdpc2Uoc2VsZWN0aW9uLCB0ZXh0KVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXN0ZUNoYXJhY3Rlcndpc2Uoc2VsZWN0aW9uLCB0ZXh0KVxuICAgIH1cbiAgfVxuXG4gIHBhc3RlQ2hhcmFjdGVyd2lzZShzZWxlY3Rpb24sIHRleHQpIHtcbiAgICBjb25zdCB7Y3Vyc29yfSA9IHNlbGVjdGlvblxuICAgIGlmIChzZWxlY3Rpb24uaXNFbXB0eSgpICYmIHRoaXMubG9jYXRpb24gPT09IFwiYWZ0ZXJcIiAmJiAhaXNFbXB0eVJvdyh0aGlzLmVkaXRvciwgY3Vyc29yLmdldEJ1ZmZlclJvdygpKSkge1xuICAgICAgY3Vyc29yLm1vdmVSaWdodCgpXG4gICAgfVxuICAgIHJldHVybiBzZWxlY3Rpb24uaW5zZXJ0VGV4dCh0ZXh0KVxuICB9XG5cbiAgLy8gUmV0dXJuIG5ld1JhbmdlXG4gIHBhc3RlTGluZXdpc2Uoc2VsZWN0aW9uLCB0ZXh0KSB7XG4gICAgY29uc3Qge2N1cnNvcn0gPSBzZWxlY3Rpb25cbiAgICBjb25zdCBjdXJzb3JSb3cgPSBjdXJzb3IuZ2V0QnVmZmVyUm93KClcbiAgICBpZiAoIXRleHQuZW5kc1dpdGgoXCJcXG5cIikpIHtcbiAgICAgIHRleHQgKz0gXCJcXG5cIlxuICAgIH1cbiAgICBpZiAoc2VsZWN0aW9uLmlzRW1wdHkoKSkge1xuICAgICAgaWYgKHRoaXMubG9jYXRpb24gPT09IFwiYmVmb3JlXCIpIHtcbiAgICAgICAgcmV0dXJuIGluc2VydFRleHRBdEJ1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCBbY3Vyc29yUm93LCAwXSwgdGV4dClcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5sb2NhdGlvbiA9PT0gXCJhZnRlclwiKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldFJvdyA9IHRoaXMuZ2V0Rm9sZEVuZFJvd0ZvclJvdyhjdXJzb3JSb3cpXG4gICAgICAgIGVuc3VyZUVuZHNXaXRoTmV3TGluZUZvckJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgdGFyZ2V0Um93KVxuICAgICAgICByZXR1cm4gaW5zZXJ0VGV4dEF0QnVmZmVyUG9zaXRpb24odGhpcy5lZGl0b3IsIFt0YXJnZXRSb3cgKyAxLCAwXSwgdGV4dClcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLmlzTW9kZShcInZpc3VhbFwiLCBcImxpbmV3aXNlXCIpKSB7XG4gICAgICAgIHNlbGVjdGlvbi5pbnNlcnRUZXh0KFwiXFxuXCIpXG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZWN0aW9uLmluc2VydFRleHQodGV4dClcbiAgICB9XG4gIH1cbn1cblB1dEJlZm9yZS5yZWdpc3RlcigpXG5cbmNsYXNzIFB1dEFmdGVyIGV4dGVuZHMgUHV0QmVmb3JlIHtcbiAgbG9jYXRpb24gPSBcImFmdGVyXCJcbn1cblB1dEFmdGVyLnJlZ2lzdGVyKClcblxuY2xhc3MgUHV0QmVmb3JlV2l0aEF1dG9JbmRlbnQgZXh0ZW5kcyBQdXRCZWZvcmUge1xuICBwYXN0ZUxpbmV3aXNlKHNlbGVjdGlvbiwgdGV4dCkge1xuICAgIGNvbnN0IG5ld1JhbmdlID0gc3VwZXIucGFzdGVMaW5ld2lzZShzZWxlY3Rpb24sIHRleHQpXG4gICAgYWRqdXN0SW5kZW50V2l0aEtlZXBpbmdMYXlvdXQodGhpcy5lZGl0b3IsIG5ld1JhbmdlKVxuICAgIHJldHVybiBuZXdSYW5nZVxuICB9XG59XG5QdXRCZWZvcmVXaXRoQXV0b0luZGVudC5yZWdpc3RlcigpXG5cbmNsYXNzIFB1dEFmdGVyV2l0aEF1dG9JbmRlbnQgZXh0ZW5kcyBQdXRCZWZvcmVXaXRoQXV0b0luZGVudCB7XG4gIGxvY2F0aW9uID0gXCJhZnRlclwiXG59XG5QdXRBZnRlcldpdGhBdXRvSW5kZW50LnJlZ2lzdGVyKClcblxuY2xhc3MgQWRkQmxhbmtMaW5lQmVsb3cgZXh0ZW5kcyBPcGVyYXRvciB7XG4gIGZsYXNoVGFyZ2V0ID0gZmFsc2VcbiAgdGFyZ2V0ID0gXCJFbXB0eVwiXG4gIHN0YXlBdFNhbWVQb3NpdGlvbiA9IHRydWVcbiAgc3RheUJ5TWFya2VyID0gdHJ1ZVxuICB3aGVyZSA9IFwiYmVsb3dcIlxuXG4gIG11dGF0ZVNlbGVjdGlvbihzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBwb2ludCA9IHNlbGVjdGlvbi5nZXRIZWFkQnVmZmVyUG9zaXRpb24oKVxuICAgIGlmICh0aGlzLndoZXJlID09PSBcImJlbG93XCIpIHBvaW50LnJvdysrXG4gICAgcG9pbnQuY29sdW1uID0gMFxuICAgIHRoaXMuZWRpdG9yLnNldFRleHRJbkJ1ZmZlclJhbmdlKFtwb2ludCwgcG9pbnRdLCBcIlxcblwiLnJlcGVhdCh0aGlzLmdldENvdW50KCkpKVxuICB9XG59XG5BZGRCbGFua0xpbmVCZWxvdy5yZWdpc3RlcigpXG5cbmNsYXNzIEFkZEJsYW5rTGluZUFib3ZlIGV4dGVuZHMgQWRkQmxhbmtMaW5lQmVsb3cge1xuICB3aGVyZSA9IFwiYWJvdmVcIlxufVxuQWRkQmxhbmtMaW5lQWJvdmUucmVnaXN0ZXIoKVxuIl19