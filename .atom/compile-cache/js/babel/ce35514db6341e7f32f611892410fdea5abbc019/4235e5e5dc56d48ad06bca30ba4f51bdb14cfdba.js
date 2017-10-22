"use babel";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var settings = require("./settings");

var CSON = undefined,
    path = undefined,
    selectList = undefined,
    OperationAbortedError = undefined,
    __plus = undefined;
var CLASS_REGISTRY = {};

function _plus() {
  return __plus || (__plus = require("underscore-plus"));
}

var VMP_LOADING_FILE = undefined;
function loadVmpOperationFile(filename) {
  // Call to loadVmpOperationFile can be nested.
  // 1. require("./operator-transform-string")
  // 2. in operator-transform-string.coffee call Base.getClass("Operator") cause operator.coffee required.
  // So we have to save original VMP_LOADING_FILE and restore it after require finished.
  var preserved = VMP_LOADING_FILE;
  VMP_LOADING_FILE = filename;
  require(filename);
  VMP_LOADING_FILE = preserved;
}

var Base = (function () {
  _createClass(Base, [{
    key: "name",
    get: function get() {
      return this.constructor.name;
    }
  }], [{
    key: "commandTable",
    value: null,
    enumerable: true
  }, {
    key: "commandPrefix",
    value: "vim-mode-plus",
    enumerable: true
  }, {
    key: "commandScope",
    value: "atom-text-editor",
    enumerable: true
  }, {
    key: "operationKind",
    value: null,
    enumerable: true
  }, {
    key: "getEditorState",
    value: null,
    // set through init()

    enumerable: true
  }]);

  function Base(vimState) {
    _classCallCheck(this, Base);

    this.requireTarget = false;
    this.requireInput = false;
    this.recordable = false;
    this.repeated = false;
    this.target = null;
    this.operator = null;
    this.count = null;
    this.defaultCount = 1;
    this.input = null;

    this.vimState = vimState;
  }

  // NOTE: initialize() must return `this`

  _createClass(Base, [{
    key: "initialize",
    value: function initialize() {
      return this;
    }

    // Called both on cancel and success
  }, {
    key: "resetState",
    value: function resetState() {}

    // Operation processor execute only when isComplete() return true.
    // If false, operation processor postpone its execution.
  }, {
    key: "isComplete",
    value: function isComplete() {
      if (this.requireInput && this.input == null) {
        return false;
      } else if (this.requireTarget) {
        // When this function is called in Base::constructor
        // tagert is still string like `MoveToRight`, in this case isComplete
        // is not available.
        return !!this.target && this.target.isComplete();
      } else {
        return true; // Set in operator's target( Motion or TextObject )
      }
    }
  }, {
    key: "isAsTargetExceptSelectInVisualMode",
    value: function isAsTargetExceptSelectInVisualMode() {
      return this.operator && !this.operator["instanceof"]("SelectInVisualMode");
    }
  }, {
    key: "abort",
    value: function abort() {
      if (!OperationAbortedError) OperationAbortedError = require("./errors");
      throw new OperationAbortedError("aborted");
    }
  }, {
    key: "getCount",
    value: function getCount() {
      var offset = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

      if (this.count == null) {
        this.count = this.vimState.hasCount() ? this.vimState.getCount() : this.defaultCount;
      }
      return this.count + offset;
    }
  }, {
    key: "resetCount",
    value: function resetCount() {
      this.count = null;
    }
  }, {
    key: "countTimes",
    value: function countTimes(last, fn) {
      if (last < 1) return;

      var stopped = false;
      var stop = function stop() {
        return stopped = true;
      };
      for (var count = 1; count <= last; count++) {
        fn({ count: count, isFinal: count === last, stop: stop });
        if (stopped) break;
      }
    }
  }, {
    key: "activateMode",
    value: function activateMode(mode, submode) {
      var _this = this;

      this.onDidFinishOperation(function () {
        return _this.vimState.activate(mode, submode);
      });
    }
  }, {
    key: "activateModeIfNecessary",
    value: function activateModeIfNecessary(mode, submode) {
      if (!this.vimState.isMode(mode, submode)) {
        this.activateMode(mode, submode);
      }
    }
  }, {
    key: "getInstance",
    value: function getInstance(name, properties) {
      return this.constructor.getInstance(this.vimState, name, properties);
    }
  }, {
    key: "cancelOperation",
    value: function cancelOperation() {
      this.vimState.operationStack.cancel(this);
    }
  }, {
    key: "processOperation",
    value: function processOperation() {
      this.vimState.operationStack.process();
    }
  }, {
    key: "focusSelectList",
    value: function focusSelectList() {
      var _this2 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      this.onDidCancelSelectList(function () {
        return _this2.cancelOperation();
      });
      if (!selectList) {
        selectList = new (require("./select-list"))();
      }
      selectList.show(this.vimState, options);
    }
  }, {
    key: "focusInput",
    value: function focusInput() {
      var _this3 = this;

      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      if (!options.onConfirm) {
        options.onConfirm = function (input) {
          _this3.input = input;
          _this3.processOperation();
        };
      }
      if (!options.onCancel) {
        options.onCancel = function () {
          return _this3.cancelOperation();
        };
      }
      if (!options.onChange) {
        options.onChange = function (input) {
          return _this3.vimState.hover.set(input);
        };
      }
      this.vimState.focusInput(options);
    }
  }, {
    key: "readChar",
    value: function readChar() {
      var _this4 = this;

      this.vimState.readChar({
        onConfirm: function onConfirm(input) {
          _this4.input = input;
          _this4.processOperation();
        },
        onCancel: function onCancel() {
          return _this4.cancelOperation();
        }
      });
    }
  }, {
    key: "getVimEofBufferPosition",
    value: function getVimEofBufferPosition() {
      return this.utils.getVimEofBufferPosition(this.editor);
    }
  }, {
    key: "getVimLastBufferRow",
    value: function getVimLastBufferRow() {
      return this.utils.getVimLastBufferRow(this.editor);
    }
  }, {
    key: "getVimLastScreenRow",
    value: function getVimLastScreenRow() {
      return this.utils.getVimLastScreenRow(this.editor);
    }
  }, {
    key: "getWordBufferRangeAndKindAtBufferPosition",
    value: function getWordBufferRangeAndKindAtBufferPosition(point, options) {
      return this.utils.getWordBufferRangeAndKindAtBufferPosition(this.editor, point, options);
    }
  }, {
    key: "getFirstCharacterPositionForBufferRow",
    value: function getFirstCharacterPositionForBufferRow(row) {
      return this.utils.getFirstCharacterPositionForBufferRow(this.editor, row);
    }
  }, {
    key: "getBufferRangeForRowRange",
    value: function getBufferRangeForRowRange(rowRange) {
      return this.utils.getBufferRangeForRowRange(this.editor, rowRange);
    }
  }, {
    key: "scanForward",
    value: function scanForward() {
      var _utils;

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return (_utils = this.utils).scanEditorInDirection.apply(_utils, [this.editor, "forward"].concat(args));
    }
  }, {
    key: "scanBackward",
    value: function scanBackward() {
      var _utils2;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return (_utils2 = this.utils).scanEditorInDirection.apply(_utils2, [this.editor, "backward"].concat(args));
    }
  }, {
    key: "getFoldStartRowForRow",
    value: function getFoldStartRowForRow() {
      var _utils3;

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return (_utils3 = this.utils).getFoldStartRowForRow.apply(_utils3, [this.editor].concat(args));
    }
  }, {
    key: "getFoldEndRowForRow",
    value: function getFoldEndRowForRow() {
      var _utils4;

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return (_utils4 = this.utils).getFoldEndRowForRow.apply(_utils4, [this.editor].concat(args));
    }
  }, {
    key: "instanceof",
    value: function _instanceof(klassName) {
      return this instanceof Base.getClass(klassName);
    }
  }, {
    key: "is",
    value: function is(klassName) {
      return this.constructor === Base.getClass(klassName);
    }
  }, {
    key: "isOperator",
    value: function isOperator() {
      // Don't use `instanceof` to postpone require for faster activation.
      return this.constructor.operationKind === "operator";
    }
  }, {
    key: "isMotion",
    value: function isMotion() {
      // Don't use `instanceof` to postpone require for faster activation.
      return this.constructor.operationKind === "motion";
    }
  }, {
    key: "isTextObject",
    value: function isTextObject() {
      // Don't use `instanceof` to postpone require for faster activation.
      return this.constructor.operationKind === "text-object";
    }
  }, {
    key: "getCursorBufferPosition",
    value: function getCursorBufferPosition() {
      return this.mode === "visual" ? this.getCursorPositionForSelection(this.editor.getLastSelection()) : this.editor.getCursorBufferPosition();
    }
  }, {
    key: "getCursorBufferPositions",
    value: function getCursorBufferPositions() {
      return this.mode === "visual" ? this.editor.getSelections().map(this.getCursorPositionForSelection.bind(this)) : this.editor.getCursorBufferPositions();
    }
  }, {
    key: "getBufferPositionForCursor",
    value: function getBufferPositionForCursor(cursor) {
      return this.mode === "visual" ? this.getCursorPositionForSelection(cursor.selection) : cursor.getBufferPosition();
    }
  }, {
    key: "getCursorPositionForSelection",
    value: function getCursorPositionForSelection(selection) {
      return this.swrap(selection).getBufferPositionFor("head", { from: ["property", "selection"] });
    }
  }, {
    key: "toString",
    value: function toString() {
      var targetStr = this.target ? ", target: " + this.target.toString() : "";
      return this.name + "{wise: " + this.wise + targetStr + "}";
    }
  }, {
    key: "getCommandName",
    value: function getCommandName() {
      return this.constructor.getCommandName();
    }
  }, {
    key: "getCommandNameWithoutPrefix",
    value: function getCommandNameWithoutPrefix() {
      return this.constructor.getCommandNameWithoutPrefix();
    }
  }, {
    key: "onDidChangeSearch",
    // prettier-ignore

    value: function onDidChangeSearch() {
      var _vimState;

      return (_vimState = this.vimState).onDidChangeSearch.apply(_vimState, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidConfirmSearch",
    value: function onDidConfirmSearch() {
      var _vimState2;

      return (_vimState2 = this.vimState).onDidConfirmSearch.apply(_vimState2, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidCancelSearch",
    value: function onDidCancelSearch() {
      var _vimState3;

      return (_vimState3 = this.vimState).onDidCancelSearch.apply(_vimState3, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidCommandSearch",
    value: function onDidCommandSearch() {
      var _vimState4;

      return (_vimState4 = this.vimState).onDidCommandSearch.apply(_vimState4, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidSetTarget",
    value: function onDidSetTarget() {
      var _vimState5;

      return (_vimState5 = this.vimState).onDidSetTarget.apply(_vimState5, arguments);
    }
    // prettier-ignore
  }, {
    key: "emitDidSetTarget",
    value: function emitDidSetTarget() {
      var _vimState6;

      return (_vimState6 = this.vimState).emitDidSetTarget.apply(_vimState6, arguments);
    }
    // prettier-ignore
  }, {
    key: "onWillSelectTarget",
    value: function onWillSelectTarget() {
      var _vimState7;

      return (_vimState7 = this.vimState).onWillSelectTarget.apply(_vimState7, arguments);
    }
    // prettier-ignore
  }, {
    key: "emitWillSelectTarget",
    value: function emitWillSelectTarget() {
      var _vimState8;

      return (_vimState8 = this.vimState).emitWillSelectTarget.apply(_vimState8, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidSelectTarget",
    value: function onDidSelectTarget() {
      var _vimState9;

      return (_vimState9 = this.vimState).onDidSelectTarget.apply(_vimState9, arguments);
    }
    // prettier-ignore
  }, {
    key: "emitDidSelectTarget",
    value: function emitDidSelectTarget() {
      var _vimState10;

      return (_vimState10 = this.vimState).emitDidSelectTarget.apply(_vimState10, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidFailSelectTarget",
    value: function onDidFailSelectTarget() {
      var _vimState11;

      return (_vimState11 = this.vimState).onDidFailSelectTarget.apply(_vimState11, arguments);
    }
    // prettier-ignore
  }, {
    key: "emitDidFailSelectTarget",
    value: function emitDidFailSelectTarget() {
      var _vimState12;

      return (_vimState12 = this.vimState).emitDidFailSelectTarget.apply(_vimState12, arguments);
    }
    // prettier-ignore
  }, {
    key: "onWillFinishMutation",
    value: function onWillFinishMutation() {
      var _vimState13;

      return (_vimState13 = this.vimState).onWillFinishMutation.apply(_vimState13, arguments);
    }
    // prettier-ignore
  }, {
    key: "emitWillFinishMutation",
    value: function emitWillFinishMutation() {
      var _vimState14;

      return (_vimState14 = this.vimState).emitWillFinishMutation.apply(_vimState14, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidFinishMutation",
    value: function onDidFinishMutation() {
      var _vimState15;

      return (_vimState15 = this.vimState).onDidFinishMutation.apply(_vimState15, arguments);
    }
    // prettier-ignore
  }, {
    key: "emitDidFinishMutation",
    value: function emitDidFinishMutation() {
      var _vimState16;

      return (_vimState16 = this.vimState).emitDidFinishMutation.apply(_vimState16, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidFinishOperation",
    value: function onDidFinishOperation() {
      var _vimState17;

      return (_vimState17 = this.vimState).onDidFinishOperation.apply(_vimState17, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidResetOperationStack",
    value: function onDidResetOperationStack() {
      var _vimState18;

      return (_vimState18 = this.vimState).onDidResetOperationStack.apply(_vimState18, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidSetOperatorModifier",
    value: function onDidSetOperatorModifier() {
      var _vimState19;

      return (_vimState19 = this.vimState).onDidSetOperatorModifier.apply(_vimState19, arguments);
    }
    // prettier-ignore
  }, {
    key: "onWillActivateMode",
    value: function onWillActivateMode() {
      var _vimState20;

      return (_vimState20 = this.vimState).onWillActivateMode.apply(_vimState20, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidActivateMode",
    value: function onDidActivateMode() {
      var _vimState21;

      return (_vimState21 = this.vimState).onDidActivateMode.apply(_vimState21, arguments);
    }
    // prettier-ignore
  }, {
    key: "preemptWillDeactivateMode",
    value: function preemptWillDeactivateMode() {
      var _vimState22;

      return (_vimState22 = this.vimState).preemptWillDeactivateMode.apply(_vimState22, arguments);
    }
    // prettier-ignore
  }, {
    key: "onWillDeactivateMode",
    value: function onWillDeactivateMode() {
      var _vimState23;

      return (_vimState23 = this.vimState).onWillDeactivateMode.apply(_vimState23, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidDeactivateMode",
    value: function onDidDeactivateMode() {
      var _vimState24;

      return (_vimState24 = this.vimState).onDidDeactivateMode.apply(_vimState24, arguments);
    }
    // prettier-ignore
  }, {
    key: "onDidCancelSelectList",
    value: function onDidCancelSelectList() {
      var _vimState25;

      return (_vimState25 = this.vimState).onDidCancelSelectList.apply(_vimState25, arguments);
    }
    // prettier-ignore
  }, {
    key: "subscribe",
    value: function subscribe() {
      var _vimState26;

      return (_vimState26 = this.vimState).subscribe.apply(_vimState26, arguments);
    }
    // prettier-ignore
  }, {
    key: "isMode",
    value: function isMode() {
      var _vimState27;

      return (_vimState27 = this.vimState).isMode.apply(_vimState27, arguments);
    }
    // prettier-ignore
  }, {
    key: "getBlockwiseSelections",
    value: function getBlockwiseSelections() {
      var _vimState28;

      return (_vimState28 = this.vimState).getBlockwiseSelections.apply(_vimState28, arguments);
    }
    // prettier-ignore
  }, {
    key: "getLastBlockwiseSelection",
    value: function getLastBlockwiseSelection() {
      var _vimState29;

      return (_vimState29 = this.vimState).getLastBlockwiseSelection.apply(_vimState29, arguments);
    }
    // prettier-ignore
  }, {
    key: "addToClassList",
    value: function addToClassList() {
      var _vimState30;

      return (_vimState30 = this.vimState).addToClassList.apply(_vimState30, arguments);
    }
    // prettier-ignore
  }, {
    key: "getConfig",
    value: function getConfig() {
      var _vimState31;

      return (_vimState31 = this.vimState).getConfig.apply(_vimState31, arguments);
    }
    // prettier-ignore
  }, {
    key: "mode",

    // Proxy propperties and methods
    //===========================================================================
    get: function get() {
      return this.vimState.mode;
    }
    // prettier-ignore
  }, {
    key: "submode",
    get: function get() {
      return this.vimState.submode;
    }
    // prettier-ignore
  }, {
    key: "swrap",
    get: function get() {
      return this.vimState.swrap;
    }
    // prettier-ignore
  }, {
    key: "utils",
    get: function get() {
      return this.vimState.utils;
    }
    // prettier-ignore
  }, {
    key: "editor",
    get: function get() {
      return this.vimState.editor;
    }
    // prettier-ignore
  }, {
    key: "editorElement",
    get: function get() {
      return this.vimState.editorElement;
    }
    // prettier-ignore
  }, {
    key: "globalState",
    get: function get() {
      return this.vimState.globalState;
    }
    // prettier-ignore
  }, {
    key: "mutationManager",
    get: function get() {
      return this.vimState.mutationManager;
    }
    // prettier-ignore
  }, {
    key: "occurrenceManager",
    get: function get() {
      return this.vimState.occurrenceManager;
    }
    // prettier-ignore
  }, {
    key: "persistentSelection",
    get: function get() {
      return this.vimState.persistentSelection;
    }
  }], [{
    key: "writeCommandTableOnDisk",
    value: function writeCommandTableOnDisk() {
      var commandTable = this.generateCommandTableByEagerLoad();
      var _ = _plus();
      if (_.isEqual(this.commandTable, commandTable)) {
        atom.notifications.addInfo("No changes in commandTable", { dismissable: true });
        return;
      }

      if (!CSON) CSON = require("season");
      if (!path) path = require("path");

      var loadableCSONText = "# This file is auto generated by `vim-mode-plus:write-command-table-on-disk` command.\n";
      loadableCSONText += "# DONT edit manually.\n";
      loadableCSONText += "module.exports =\n";
      loadableCSONText += CSON.stringify(commandTable) + "\n";

      var commandTablePath = path.join(__dirname, "command-table.coffee");
      atom.workspace.open(commandTablePath).then(function (editor) {
        editor.setText(loadableCSONText);
        editor.save();
        atom.notifications.addInfo("Updated commandTable", { dismissable: true });
      });
    }
  }, {
    key: "generateCommandTableByEagerLoad",
    value: function generateCommandTableByEagerLoad() {
      // NOTE: changing order affects output of lib/command-table.coffee
      var filesToLoad = ["./operator", "./operator-insert", "./operator-transform-string", "./motion", "./motion-search", "./text-object", "./misc-command"];
      filesToLoad.forEach(loadVmpOperationFile);
      var _ = _plus();
      var klassesGroupedByFile = _.groupBy(_.values(CLASS_REGISTRY), function (klass) {
        return klass.file;
      });

      var commandTable = {};
      for (var file of filesToLoad) {
        for (var klass of klassesGroupedByFile[file]) {
          commandTable[klass.name] = klass.isCommand() ? { file: klass.file, commandName: klass.getCommandName(), commandScope: klass.getCommandScope() } : { file: klass.file };
        }
      }
      return commandTable;
    }
  }, {
    key: "init",
    value: function init(getEditorState) {
      this.getEditorState = getEditorState;

      this.commandTable = require("./command-table");
      var subscriptions = [];
      for (var _name in this.commandTable) {
        var spec = this.commandTable[_name];
        if (spec.commandName) {
          subscriptions.push(this.registerCommandFromSpec(_name, spec));
        }
      }
      return subscriptions;
    }
  }, {
    key: "register",
    value: function register() {
      var command = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      this.command = command;
      this.file = VMP_LOADING_FILE;
      if (this.name in CLASS_REGISTRY) {
        console.warn("Duplicate constructor " + this.name);
      }
      CLASS_REGISTRY[this.name] = this;
    }
  }, {
    key: "extend",
    value: function extend() {
      console.error("calling deprecated Base.extend(), use Base.register instead!");
      this.register.apply(this, arguments);
    }
  }, {
    key: "getClass",
    value: function getClass(name) {
      if (name in CLASS_REGISTRY) return CLASS_REGISTRY[name];

      var fileToLoad = this.commandTable[name].file;
      if (atom.inDevMode() && settings.get("debug")) {
        console.log("lazy-require: " + fileToLoad + " for " + name);
      }
      loadVmpOperationFile(fileToLoad);
      if (name in CLASS_REGISTRY) return CLASS_REGISTRY[name];

      throw new Error("class '" + name + "' not found");
    }
  }, {
    key: "getInstance",
    value: function getInstance(vimState, klassOrName, properties) {
      var klass = typeof klassOrName === "function" ? klassOrName : Base.getClass(klassOrName);
      var instance = new klass(vimState);
      if (properties) Object.assign(instance, properties);
      return instance.initialize(); // initialize must return instance.
    }
  }, {
    key: "getClassRegistry",
    value: function getClassRegistry() {
      return CLASS_REGISTRY;
    }
  }, {
    key: "isCommand",
    value: function isCommand() {
      return this.command;
    }
  }, {
    key: "getCommandName",
    value: function getCommandName() {
      return this.commandPrefix + ":" + _plus().dasherize(this.name);
    }
  }, {
    key: "getCommandNameWithoutPrefix",
    value: function getCommandNameWithoutPrefix() {
      return _plus().dasherize(this.name);
    }
  }, {
    key: "getCommandScope",
    value: function getCommandScope() {
      return this.commandScope;
    }
  }, {
    key: "registerCommand",
    value: function registerCommand() {
      var _this5 = this;

      return this.registerCommandFromSpec(this.name, {
        commandScope: this.getCommandScope(),
        commandName: this.getCommandName(),
        getClass: function getClass() {
          return _this5;
        }
      });
    }
  }, {
    key: "registerCommandFromSpec",
    value: function registerCommandFromSpec(name, spec) {
      var _this6 = this;

      var _spec$commandScope = spec.commandScope;
      var commandScope = _spec$commandScope === undefined ? "atom-text-editor" : _spec$commandScope;
      var _spec$commandPrefix = spec.commandPrefix;
      var commandPrefix = _spec$commandPrefix === undefined ? "vim-mode-plus" : _spec$commandPrefix;
      var commandName = spec.commandName;
      var getClass = spec.getClass;

      if (!commandName) commandName = commandPrefix + ":" + _plus().dasherize(name);
      if (!getClass) getClass = function (name) {
        return _this6.getClass(name);
      };

      var getEditorState = this.getEditorState;
      return atom.commands.add(commandScope, commandName, function (event) {
        var vimState = getEditorState(this.getModel()) || getEditorState(atom.workspace.getActiveTextEditor());
        if (vimState) vimState.operationStack.run(getClass(name)); // vimState possibly be undefined See #85
        event.stopPropagation();
      });
    }
  }, {
    key: "getKindForCommandName",
    value: function getKindForCommandName(command) {
      var commandWithoutPrefix = command.replace(/^vim-mode-plus:/, "");

      var _plus2 = _plus();

      var capitalize = _plus2.capitalize;
      var camelize = _plus2.camelize;

      var commandClassName = capitalize(camelize(commandWithoutPrefix));
      if (commandClassName in CLASS_REGISTRY) {
        return CLASS_REGISTRY[commandClassName].operationKind;
      }
    }
  }]);

  return Base;
})();

Base.register(false);

module.exports = Base;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvYmFzZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7OztBQUVYLElBQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTs7QUFFdEMsSUFBSSxJQUFJLFlBQUE7SUFBRSxJQUFJLFlBQUE7SUFBRSxVQUFVLFlBQUE7SUFBRSxxQkFBcUIsWUFBQTtJQUFFLE1BQU0sWUFBQSxDQUFBO0FBQ3pELElBQU0sY0FBYyxHQUFHLEVBQUUsQ0FBQTs7QUFFekIsU0FBUyxLQUFLLEdBQUc7QUFDZixTQUFPLE1BQU0sS0FBSyxNQUFNLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUEsQUFBQyxDQUFBO0NBQ3ZEOztBQUVELElBQUksZ0JBQWdCLFlBQUEsQ0FBQTtBQUNwQixTQUFTLG9CQUFvQixDQUFDLFFBQVEsRUFBRTs7Ozs7QUFLdEMsTUFBTSxTQUFTLEdBQUcsZ0JBQWdCLENBQUE7QUFDbEMsa0JBQWdCLEdBQUcsUUFBUSxDQUFBO0FBQzNCLFNBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQTtBQUNqQixrQkFBZ0IsR0FBRyxTQUFTLENBQUE7Q0FDN0I7O0lBRUssSUFBSTtlQUFKLElBQUk7O1NBaUJBLGVBQUc7QUFDVCxhQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFBO0tBQzdCOzs7V0FsQnFCLElBQUk7Ozs7V0FDSCxlQUFlOzs7O1dBQ2hCLGtCQUFrQjs7OztXQUNqQixJQUFJOzs7O1dBQ0gsSUFBSTs7Ozs7O0FBZ0JqQixXQXJCUCxJQUFJLENBcUJJLFFBQVEsRUFBRTswQkFyQmxCLElBQUk7O1NBT1IsYUFBYSxHQUFHLEtBQUs7U0FDckIsWUFBWSxHQUFHLEtBQUs7U0FDcEIsVUFBVSxHQUFHLEtBQUs7U0FDbEIsUUFBUSxHQUFHLEtBQUs7U0FDaEIsTUFBTSxHQUFHLElBQUk7U0FD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QkFBbUIsRUFBRSxDQUFDLENBQUE7QUFDeEcsWUFBSSxRQUFRLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7QUFDekQsYUFBSyxDQUFDLGVBQWUsRUFBRSxDQUFBO09BQ3hCLENBQUMsQ0FBQTtLQUNIOzs7V0FFMkIsK0JBQUMsT0FBTyxFQUFFO0FBQ3BDLFVBQU0sb0JBQW9CLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsQ0FBQTs7bUJBQ3BDLEtBQUssRUFBRTs7VUFBL0IsVUFBVSxVQUFWLFVBQVU7VUFBRSxRQUFRLFVBQVIsUUFBUTs7QUFDM0IsVUFBTSxnQkFBZ0IsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQTtBQUNuRSxVQUFJLGdCQUFnQixJQUFJLGNBQWMsRUFBRTtBQUN0QyxlQUFPLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLGFBQWEsQ0FBQTtPQUN0RDtLQUNGOzs7U0F6WEcsSUFBSTs7O0FBd2FWLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUE7O0FBRXBCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFBIiwiZmlsZSI6Ii9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvYmFzZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCJcblxuY29uc3Qgc2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5nc1wiKVxuXG5sZXQgQ1NPTiwgcGF0aCwgc2VsZWN0TGlzdCwgT3BlcmF0aW9uQWJvcnRlZEVycm9yLCBfX3BsdXNcbmNvbnN0IENMQVNTX1JFR0lTVFJZID0ge31cblxuZnVuY3Rpb24gX3BsdXMoKSB7XG4gIHJldHVybiBfX3BsdXMgfHwgKF9fcGx1cyA9IHJlcXVpcmUoXCJ1bmRlcnNjb3JlLXBsdXNcIikpXG59XG5cbmxldCBWTVBfTE9BRElOR19GSUxFXG5mdW5jdGlvbiBsb2FkVm1wT3BlcmF0aW9uRmlsZShmaWxlbmFtZSkge1xuICAvLyBDYWxsIHRvIGxvYWRWbXBPcGVyYXRpb25GaWxlIGNhbiBiZSBuZXN0ZWQuXG4gIC8vIDEuIHJlcXVpcmUoXCIuL29wZXJhdG9yLXRyYW5zZm9ybS1zdHJpbmdcIilcbiAgLy8gMi4gaW4gb3BlcmF0b3ItdHJhbnNmb3JtLXN0cmluZy5jb2ZmZWUgY2FsbCBCYXNlLmdldENsYXNzKFwiT3BlcmF0b3JcIikgY2F1c2Ugb3BlcmF0b3IuY29mZmVlIHJlcXVpcmVkLlxuICAvLyBTbyB3ZSBoYXZlIHRvIHNhdmUgb3JpZ2luYWwgVk1QX0xPQURJTkdfRklMRSBhbmQgcmVzdG9yZSBpdCBhZnRlciByZXF1aXJlIGZpbmlzaGVkLlxuICBjb25zdCBwcmVzZXJ2ZWQgPSBWTVBfTE9BRElOR19GSUxFXG4gIFZNUF9MT0FESU5HX0ZJTEUgPSBmaWxlbmFtZVxuICByZXF1aXJlKGZpbGVuYW1lKVxuICBWTVBfTE9BRElOR19GSUxFID0gcHJlc2VydmVkXG59XG5cbmNsYXNzIEJhc2Uge1xuICBzdGF0aWMgY29tbWFuZFRhYmxlID0gbnVsbFxuICBzdGF0aWMgY29tbWFuZFByZWZpeCA9IFwidmltLW1vZGUtcGx1c1wiXG4gIHN0YXRpYyBjb21tYW5kU2NvcGUgPSBcImF0b20tdGV4dC1lZGl0b3JcIlxuICBzdGF0aWMgb3BlcmF0aW9uS2luZCA9IG51bGxcbiAgc3RhdGljIGdldEVkaXRvclN0YXRlID0gbnVsbCAvLyBzZXQgdGhyb3VnaCBpbml0KClcblxuICByZXF1aXJlVGFyZ2V0ID0gZmFsc2VcbiAgcmVxdWlyZUlucHV0ID0gZmFsc2VcbiAgcmVjb3JkYWJsZSA9IGZhbHNlXG4gIHJlcGVhdGVkID0gZmFsc2VcbiAgdGFyZ2V0ID0gbnVsbFxuICBvcGVyYXRvciA9IG51bGxcbiAgY291bnQgPSBudWxsXG4gIGRlZmF1bHRDb3VudCA9IDFcbiAgaW5wdXQgPSBudWxsXG5cbiAgZ2V0IG5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZVxuICB9XG5cbiAgY29uc3RydWN0b3IodmltU3RhdGUpIHtcbiAgICB0aGlzLnZpbVN0YXRlID0gdmltU3RhdGVcbiAgfVxuXG4gIC8vIE5PVEU6IGluaXRpYWxpemUoKSBtdXN0IHJldHVybiBgdGhpc2BcbiAgaW5pdGlhbGl6ZSgpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gQ2FsbGVkIGJvdGggb24gY2FuY2VsIGFuZCBzdWNjZXNzXG4gIHJlc2V0U3RhdGUoKSB7fVxuXG4gIC8vIE9wZXJhdGlvbiBwcm9jZXNzb3IgZXhlY3V0ZSBvbmx5IHdoZW4gaXNDb21wbGV0ZSgpIHJldHVybiB0cnVlLlxuICAvLyBJZiBmYWxzZSwgb3BlcmF0aW9uIHByb2Nlc3NvciBwb3N0cG9uZSBpdHMgZXhlY3V0aW9uLlxuICBpc0NvbXBsZXRlKCkge1xuICAgIGlmICh0aGlzLnJlcXVpcmVJbnB1dCAmJiB0aGlzLmlucHV0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0gZWxzZSBpZiAodGhpcy5yZXF1aXJlVGFyZ2V0KSB7XG4gICAgICAvLyBXaGVuIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGluIEJhc2U6OmNvbnN0cnVjdG9yXG4gICAgICAvLyB0YWdlcnQgaXMgc3RpbGwgc3RyaW5nIGxpa2UgYE1vdmVUb1JpZ2h0YCwgaW4gdGhpcyBjYXNlIGlzQ29tcGxldGVcbiAgICAgIC8vIGlzIG5vdCBhdmFpbGFibGUuXG4gICAgICByZXR1cm4gISF0aGlzLnRhcmdldCAmJiB0aGlzLnRhcmdldC5pc0NvbXBsZXRlKClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWUgLy8gU2V0IGluIG9wZXJhdG9yJ3MgdGFyZ2V0KCBNb3Rpb24gb3IgVGV4dE9iamVjdCApXG4gICAgfVxuICB9XG5cbiAgaXNBc1RhcmdldEV4Y2VwdFNlbGVjdEluVmlzdWFsTW9kZSgpIHtcbiAgICByZXR1cm4gdGhpcy5vcGVyYXRvciAmJiAhdGhpcy5vcGVyYXRvci5pbnN0YW5jZW9mKFwiU2VsZWN0SW5WaXN1YWxNb2RlXCIpXG4gIH1cblxuICBhYm9ydCgpIHtcbiAgICBpZiAoIU9wZXJhdGlvbkFib3J0ZWRFcnJvcikgT3BlcmF0aW9uQWJvcnRlZEVycm9yID0gcmVxdWlyZShcIi4vZXJyb3JzXCIpXG4gICAgdGhyb3cgbmV3IE9wZXJhdGlvbkFib3J0ZWRFcnJvcihcImFib3J0ZWRcIilcbiAgfVxuXG4gIGdldENvdW50KG9mZnNldCA9IDApIHtcbiAgICBpZiAodGhpcy5jb3VudCA9PSBudWxsKSB7XG4gICAgICB0aGlzLmNvdW50ID0gdGhpcy52aW1TdGF0ZS5oYXNDb3VudCgpID8gdGhpcy52aW1TdGF0ZS5nZXRDb3VudCgpIDogdGhpcy5kZWZhdWx0Q291bnRcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY291bnQgKyBvZmZzZXRcbiAgfVxuXG4gIHJlc2V0Q291bnQoKSB7XG4gICAgdGhpcy5jb3VudCA9IG51bGxcbiAgfVxuXG4gIGNvdW50VGltZXMobGFzdCwgZm4pIHtcbiAgICBpZiAobGFzdCA8IDEpIHJldHVyblxuXG4gICAgbGV0IHN0b3BwZWQgPSBmYWxzZVxuICAgIGNvbnN0IHN0b3AgPSAoKSA9PiAoc3RvcHBlZCA9IHRydWUpXG4gICAgZm9yIChsZXQgY291bnQgPSAxOyBjb3VudCA8PSBsYXN0OyBjb3VudCsrKSB7XG4gICAgICBmbih7Y291bnQsIGlzRmluYWw6IGNvdW50ID09PSBsYXN0LCBzdG9wfSlcbiAgICAgIGlmIChzdG9wcGVkKSBicmVha1xuICAgIH1cbiAgfVxuXG4gIGFjdGl2YXRlTW9kZShtb2RlLCBzdWJtb2RlKSB7XG4gICAgdGhpcy5vbkRpZEZpbmlzaE9wZXJhdGlvbigoKSA9PiB0aGlzLnZpbVN0YXRlLmFjdGl2YXRlKG1vZGUsIHN1Ym1vZGUpKVxuICB9XG5cbiAgYWN0aXZhdGVNb2RlSWZOZWNlc3NhcnkobW9kZSwgc3VibW9kZSkge1xuICAgIGlmICghdGhpcy52aW1TdGF0ZS5pc01vZGUobW9kZSwgc3VibW9kZSkpIHtcbiAgICAgIHRoaXMuYWN0aXZhdGVNb2RlKG1vZGUsIHN1Ym1vZGUpXG4gICAgfVxuICB9XG5cbiAgZ2V0SW5zdGFuY2UobmFtZSwgcHJvcGVydGllcykge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldEluc3RhbmNlKHRoaXMudmltU3RhdGUsIG5hbWUsIHByb3BlcnRpZXMpXG4gIH1cblxuICBjYW5jZWxPcGVyYXRpb24oKSB7XG4gICAgdGhpcy52aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5jYW5jZWwodGhpcylcbiAgfVxuXG4gIHByb2Nlc3NPcGVyYXRpb24oKSB7XG4gICAgdGhpcy52aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5wcm9jZXNzKClcbiAgfVxuXG4gIGZvY3VzU2VsZWN0TGlzdChvcHRpb25zID0ge30pIHtcbiAgICB0aGlzLm9uRGlkQ2FuY2VsU2VsZWN0TGlzdCgoKSA9PiB0aGlzLmNhbmNlbE9wZXJhdGlvbigpKVxuICAgIGlmICghc2VsZWN0TGlzdCkge1xuICAgICAgc2VsZWN0TGlzdCA9IG5ldyAocmVxdWlyZShcIi4vc2VsZWN0LWxpc3RcIikpKClcbiAgICB9XG4gICAgc2VsZWN0TGlzdC5zaG93KHRoaXMudmltU3RhdGUsIG9wdGlvbnMpXG4gIH1cblxuICBmb2N1c0lucHV0KG9wdGlvbnMgPSB7fSkge1xuICAgIGlmICghb3B0aW9ucy5vbkNvbmZpcm0pIHtcbiAgICAgIG9wdGlvbnMub25Db25maXJtID0gaW5wdXQgPT4ge1xuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgICAgICAgdGhpcy5wcm9jZXNzT3BlcmF0aW9uKClcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFvcHRpb25zLm9uQ2FuY2VsKSB7XG4gICAgICBvcHRpb25zLm9uQ2FuY2VsID0gKCkgPT4gdGhpcy5jYW5jZWxPcGVyYXRpb24oKVxuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMub25DaGFuZ2UpIHtcbiAgICAgIG9wdGlvbnMub25DaGFuZ2UgPSBpbnB1dCA9PiB0aGlzLnZpbVN0YXRlLmhvdmVyLnNldChpbnB1dClcbiAgICB9XG4gICAgdGhpcy52aW1TdGF0ZS5mb2N1c0lucHV0KG9wdGlvbnMpXG4gIH1cblxuICByZWFkQ2hhcigpIHtcbiAgICB0aGlzLnZpbVN0YXRlLnJlYWRDaGFyKHtcbiAgICAgIG9uQ29uZmlybTogaW5wdXQgPT4ge1xuICAgICAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgICAgICAgdGhpcy5wcm9jZXNzT3BlcmF0aW9uKClcbiAgICAgIH0sXG4gICAgICBvbkNhbmNlbDogKCkgPT4gdGhpcy5jYW5jZWxPcGVyYXRpb24oKSxcbiAgICB9KVxuICB9XG5cbiAgZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudXRpbHMuZ2V0VmltRW9mQnVmZmVyUG9zaXRpb24odGhpcy5lZGl0b3IpXG4gIH1cblxuICBnZXRWaW1MYXN0QnVmZmVyUm93KCkge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLmdldFZpbUxhc3RCdWZmZXJSb3codGhpcy5lZGl0b3IpXG4gIH1cblxuICBnZXRWaW1MYXN0U2NyZWVuUm93KCkge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLmdldFZpbUxhc3RTY3JlZW5Sb3codGhpcy5lZGl0b3IpXG4gIH1cblxuICBnZXRXb3JkQnVmZmVyUmFuZ2VBbmRLaW5kQXRCdWZmZXJQb3NpdGlvbihwb2ludCwgb3B0aW9ucykge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLmdldFdvcmRCdWZmZXJSYW5nZUFuZEtpbmRBdEJ1ZmZlclBvc2l0aW9uKHRoaXMuZWRpdG9yLCBwb2ludCwgb3B0aW9ucylcbiAgfVxuXG4gIGdldEZpcnN0Q2hhcmFjdGVyUG9zaXRpb25Gb3JCdWZmZXJSb3cocm93KSB7XG4gICAgcmV0dXJuIHRoaXMudXRpbHMuZ2V0Rmlyc3RDaGFyYWN0ZXJQb3NpdGlvbkZvckJ1ZmZlclJvdyh0aGlzLmVkaXRvciwgcm93KVxuICB9XG5cbiAgZ2V0QnVmZmVyUmFuZ2VGb3JSb3dSYW5nZShyb3dSYW5nZSkge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLmdldEJ1ZmZlclJhbmdlRm9yUm93UmFuZ2UodGhpcy5lZGl0b3IsIHJvd1JhbmdlKVxuICB9XG5cbiAgc2NhbkZvcndhcmQoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLnNjYW5FZGl0b3JJbkRpcmVjdGlvbih0aGlzLmVkaXRvciwgXCJmb3J3YXJkXCIsIC4uLmFyZ3MpXG4gIH1cblxuICBzY2FuQmFja3dhcmQoLi4uYXJncykge1xuICAgIHJldHVybiB0aGlzLnV0aWxzLnNjYW5FZGl0b3JJbkRpcmVjdGlvbih0aGlzLmVkaXRvciwgXCJiYWNrd2FyZFwiLCAuLi5hcmdzKVxuICB9XG5cbiAgZ2V0Rm9sZFN0YXJ0Um93Rm9yUm93KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy51dGlscy5nZXRGb2xkU3RhcnRSb3dGb3JSb3codGhpcy5lZGl0b3IsIC4uLmFyZ3MpXG4gIH1cblxuICBnZXRGb2xkRW5kUm93Rm9yUm93KC4uLmFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy51dGlscy5nZXRGb2xkRW5kUm93Rm9yUm93KHRoaXMuZWRpdG9yLCAuLi5hcmdzKVxuICB9XG5cbiAgaW5zdGFuY2VvZihrbGFzc05hbWUpIHtcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIEJhc2UuZ2V0Q2xhc3Moa2xhc3NOYW1lKVxuICB9XG5cbiAgaXMoa2xhc3NOYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IgPT09IEJhc2UuZ2V0Q2xhc3Moa2xhc3NOYW1lKVxuICB9XG5cbiAgaXNPcGVyYXRvcigpIHtcbiAgICAvLyBEb24ndCB1c2UgYGluc3RhbmNlb2ZgIHRvIHBvc3Rwb25lIHJlcXVpcmUgZm9yIGZhc3RlciBhY3RpdmF0aW9uLlxuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm9wZXJhdGlvbktpbmQgPT09IFwib3BlcmF0b3JcIlxuICB9XG5cbiAgaXNNb3Rpb24oKSB7XG4gICAgLy8gRG9uJ3QgdXNlIGBpbnN0YW5jZW9mYCB0byBwb3N0cG9uZSByZXF1aXJlIGZvciBmYXN0ZXIgYWN0aXZhdGlvbi5cbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5vcGVyYXRpb25LaW5kID09PSBcIm1vdGlvblwiXG4gIH1cblxuICBpc1RleHRPYmplY3QoKSB7XG4gICAgLy8gRG9uJ3QgdXNlIGBpbnN0YW5jZW9mYCB0byBwb3N0cG9uZSByZXF1aXJlIGZvciBmYXN0ZXIgYWN0aXZhdGlvbi5cbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5vcGVyYXRpb25LaW5kID09PSBcInRleHQtb2JqZWN0XCJcbiAgfVxuXG4gIGdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLm1vZGUgPT09IFwidmlzdWFsXCJcbiAgICAgID8gdGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbih0aGlzLmVkaXRvci5nZXRMYXN0U2VsZWN0aW9uKCkpXG4gICAgICA6IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKClcbiAgfVxuXG4gIGdldEN1cnNvckJ1ZmZlclBvc2l0aW9ucygpIHtcbiAgICByZXR1cm4gdGhpcy5tb2RlID09PSBcInZpc3VhbFwiXG4gICAgICA/IHRoaXMuZWRpdG9yLmdldFNlbGVjdGlvbnMoKS5tYXAodGhpcy5nZXRDdXJzb3JQb3NpdGlvbkZvclNlbGVjdGlvbi5iaW5kKHRoaXMpKVxuICAgICAgOiB0aGlzLmVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbnMoKVxuICB9XG5cbiAgZ2V0QnVmZmVyUG9zaXRpb25Gb3JDdXJzb3IoY3Vyc29yKSB7XG4gICAgcmV0dXJuIHRoaXMubW9kZSA9PT0gXCJ2aXN1YWxcIiA/IHRoaXMuZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oY3Vyc29yLnNlbGVjdGlvbikgOiBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKVxuICB9XG5cbiAgZ2V0Q3Vyc29yUG9zaXRpb25Gb3JTZWxlY3Rpb24oc2VsZWN0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuc3dyYXAoc2VsZWN0aW9uKS5nZXRCdWZmZXJQb3NpdGlvbkZvcihcImhlYWRcIiwge2Zyb206IFtcInByb3BlcnR5XCIsIFwic2VsZWN0aW9uXCJdfSlcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIGNvbnN0IHRhcmdldFN0ciA9IHRoaXMudGFyZ2V0ID8gYCwgdGFyZ2V0OiAke3RoaXMudGFyZ2V0LnRvU3RyaW5nKCl9YCA6IFwiXCJcbiAgICByZXR1cm4gYCR7dGhpcy5uYW1lfXt3aXNlOiAke3RoaXMud2lzZX0ke3RhcmdldFN0cn19YFxuICB9XG5cbiAgZ2V0Q29tbWFuZE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0Q29tbWFuZE5hbWUoKVxuICB9XG5cbiAgZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4KCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldENvbW1hbmROYW1lV2l0aG91dFByZWZpeCgpXG4gIH1cblxuICBzdGF0aWMgd3JpdGVDb21tYW5kVGFibGVPbkRpc2soKSB7XG4gICAgY29uc3QgY29tbWFuZFRhYmxlID0gdGhpcy5nZW5lcmF0ZUNvbW1hbmRUYWJsZUJ5RWFnZXJMb2FkKClcbiAgICBjb25zdCBfID0gX3BsdXMoKVxuICAgIGlmIChfLmlzRXF1YWwodGhpcy5jb21tYW5kVGFibGUsIGNvbW1hbmRUYWJsZSkpIHtcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiTm8gY2hhbmdlcyBpbiBjb21tYW5kVGFibGVcIiwge2Rpc21pc3NhYmxlOiB0cnVlfSlcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICghQ1NPTikgQ1NPTiA9IHJlcXVpcmUoXCJzZWFzb25cIilcbiAgICBpZiAoIXBhdGgpIHBhdGggPSByZXF1aXJlKFwicGF0aFwiKVxuXG4gICAgbGV0IGxvYWRhYmxlQ1NPTlRleHQgPSBcIiMgVGhpcyBmaWxlIGlzIGF1dG8gZ2VuZXJhdGVkIGJ5IGB2aW0tbW9kZS1wbHVzOndyaXRlLWNvbW1hbmQtdGFibGUtb24tZGlza2AgY29tbWFuZC5cXG5cIlxuICAgIGxvYWRhYmxlQ1NPTlRleHQgKz0gXCIjIERPTlQgZWRpdCBtYW51YWxseS5cXG5cIlxuICAgIGxvYWRhYmxlQ1NPTlRleHQgKz0gXCJtb2R1bGUuZXhwb3J0cyA9XFxuXCJcbiAgICBsb2FkYWJsZUNTT05UZXh0ICs9IENTT04uc3RyaW5naWZ5KGNvbW1hbmRUYWJsZSkgKyBcIlxcblwiXG5cbiAgICBjb25zdCBjb21tYW5kVGFibGVQYXRoID0gcGF0aC5qb2luKF9fZGlybmFtZSwgXCJjb21tYW5kLXRhYmxlLmNvZmZlZVwiKVxuICAgIGF0b20ud29ya3NwYWNlLm9wZW4oY29tbWFuZFRhYmxlUGF0aCkudGhlbihlZGl0b3IgPT4ge1xuICAgICAgZWRpdG9yLnNldFRleHQobG9hZGFibGVDU09OVGV4dClcbiAgICAgIGVkaXRvci5zYXZlKClcbiAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKFwiVXBkYXRlZCBjb21tYW5kVGFibGVcIiwge2Rpc21pc3NhYmxlOiB0cnVlfSlcbiAgICB9KVxuICB9XG5cbiAgc3RhdGljIGdlbmVyYXRlQ29tbWFuZFRhYmxlQnlFYWdlckxvYWQoKSB7XG4gICAgLy8gTk9URTogY2hhbmdpbmcgb3JkZXIgYWZmZWN0cyBvdXRwdXQgb2YgbGliL2NvbW1hbmQtdGFibGUuY29mZmVlXG4gICAgY29uc3QgZmlsZXNUb0xvYWQgPSBbXG4gICAgICBcIi4vb3BlcmF0b3JcIixcbiAgICAgIFwiLi9vcGVyYXRvci1pbnNlcnRcIixcbiAgICAgIFwiLi9vcGVyYXRvci10cmFuc2Zvcm0tc3RyaW5nXCIsXG4gICAgICBcIi4vbW90aW9uXCIsXG4gICAgICBcIi4vbW90aW9uLXNlYXJjaFwiLFxuICAgICAgXCIuL3RleHQtb2JqZWN0XCIsXG4gICAgICBcIi4vbWlzYy1jb21tYW5kXCIsXG4gICAgXVxuICAgIGZpbGVzVG9Mb2FkLmZvckVhY2gobG9hZFZtcE9wZXJhdGlvbkZpbGUpXG4gICAgY29uc3QgXyA9IF9wbHVzKClcbiAgICBjb25zdCBrbGFzc2VzR3JvdXBlZEJ5RmlsZSA9IF8uZ3JvdXBCeShfLnZhbHVlcyhDTEFTU19SRUdJU1RSWSksIGtsYXNzID0+IGtsYXNzLmZpbGUpXG5cbiAgICBjb25zdCBjb21tYW5kVGFibGUgPSB7fVxuICAgIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlc1RvTG9hZCkge1xuICAgICAgZm9yIChjb25zdCBrbGFzcyBvZiBrbGFzc2VzR3JvdXBlZEJ5RmlsZVtmaWxlXSkge1xuICAgICAgICBjb21tYW5kVGFibGVba2xhc3MubmFtZV0gPSBrbGFzcy5pc0NvbW1hbmQoKVxuICAgICAgICAgID8ge2ZpbGU6IGtsYXNzLmZpbGUsIGNvbW1hbmROYW1lOiBrbGFzcy5nZXRDb21tYW5kTmFtZSgpLCBjb21tYW5kU2NvcGU6IGtsYXNzLmdldENvbW1hbmRTY29wZSgpfVxuICAgICAgICAgIDoge2ZpbGU6IGtsYXNzLmZpbGV9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb21tYW5kVGFibGVcbiAgfVxuXG4gIHN0YXRpYyBpbml0KGdldEVkaXRvclN0YXRlKSB7XG4gICAgdGhpcy5nZXRFZGl0b3JTdGF0ZSA9IGdldEVkaXRvclN0YXRlXG5cbiAgICB0aGlzLmNvbW1hbmRUYWJsZSA9IHJlcXVpcmUoXCIuL2NvbW1hbmQtdGFibGVcIilcbiAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gW11cbiAgICBmb3IgKGNvbnN0IG5hbWUgaW4gdGhpcy5jb21tYW5kVGFibGUpIHtcbiAgICAgIGNvbnN0IHNwZWMgPSB0aGlzLmNvbW1hbmRUYWJsZVtuYW1lXVxuICAgICAgaWYgKHNwZWMuY29tbWFuZE5hbWUpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5wdXNoKHRoaXMucmVnaXN0ZXJDb21tYW5kRnJvbVNwZWMobmFtZSwgc3BlYykpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdWJzY3JpcHRpb25zXG4gIH1cblxuICBzdGF0aWMgcmVnaXN0ZXIoY29tbWFuZCA9IHRydWUpIHtcbiAgICB0aGlzLmNvbW1hbmQgPSBjb21tYW5kXG4gICAgdGhpcy5maWxlID0gVk1QX0xPQURJTkdfRklMRVxuICAgIGlmICh0aGlzLm5hbWUgaW4gQ0xBU1NfUkVHSVNUUlkpIHtcbiAgICAgIGNvbnNvbGUud2FybihgRHVwbGljYXRlIGNvbnN0cnVjdG9yICR7dGhpcy5uYW1lfWApXG4gICAgfVxuICAgIENMQVNTX1JFR0lTVFJZW3RoaXMubmFtZV0gPSB0aGlzXG4gIH1cblxuICBzdGF0aWMgZXh0ZW5kKC4uLmFyZ3MpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiY2FsbGluZyBkZXByZWNhdGVkIEJhc2UuZXh0ZW5kKCksIHVzZSBCYXNlLnJlZ2lzdGVyIGluc3RlYWQhXCIpXG4gICAgdGhpcy5yZWdpc3RlciguLi5hcmdzKVxuICB9XG5cbiAgc3RhdGljIGdldENsYXNzKG5hbWUpIHtcbiAgICBpZiAobmFtZSBpbiBDTEFTU19SRUdJU1RSWSkgcmV0dXJuIENMQVNTX1JFR0lTVFJZW25hbWVdXG5cbiAgICBjb25zdCBmaWxlVG9Mb2FkID0gdGhpcy5jb21tYW5kVGFibGVbbmFtZV0uZmlsZVxuICAgIGlmIChhdG9tLmluRGV2TW9kZSgpICYmIHNldHRpbmdzLmdldChcImRlYnVnXCIpKSB7XG4gICAgICBjb25zb2xlLmxvZyhgbGF6eS1yZXF1aXJlOiAke2ZpbGVUb0xvYWR9IGZvciAke25hbWV9YClcbiAgICB9XG4gICAgbG9hZFZtcE9wZXJhdGlvbkZpbGUoZmlsZVRvTG9hZClcbiAgICBpZiAobmFtZSBpbiBDTEFTU19SRUdJU1RSWSkgcmV0dXJuIENMQVNTX1JFR0lTVFJZW25hbWVdXG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoYGNsYXNzICcke25hbWV9JyBub3QgZm91bmRgKVxuICB9XG5cbiAgc3RhdGljIGdldEluc3RhbmNlKHZpbVN0YXRlLCBrbGFzc09yTmFtZSwgcHJvcGVydGllcykge1xuICAgIGNvbnN0IGtsYXNzID0gdHlwZW9mIGtsYXNzT3JOYW1lID09PSBcImZ1bmN0aW9uXCIgPyBrbGFzc09yTmFtZSA6IEJhc2UuZ2V0Q2xhc3Moa2xhc3NPck5hbWUpXG4gICAgY29uc3QgaW5zdGFuY2UgPSBuZXcga2xhc3ModmltU3RhdGUpXG4gICAgaWYgKHByb3BlcnRpZXMpIE9iamVjdC5hc3NpZ24oaW5zdGFuY2UsIHByb3BlcnRpZXMpXG4gICAgcmV0dXJuIGluc3RhbmNlLmluaXRpYWxpemUoKSAvLyBpbml0aWFsaXplIG11c3QgcmV0dXJuIGluc3RhbmNlLlxuICB9XG5cbiAgc3RhdGljIGdldENsYXNzUmVnaXN0cnkoKSB7XG4gICAgcmV0dXJuIENMQVNTX1JFR0lTVFJZXG4gIH1cblxuICBzdGF0aWMgaXNDb21tYW5kKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1hbmRcbiAgfVxuXG4gIHN0YXRpYyBnZXRDb21tYW5kTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb21tYW5kUHJlZml4ICsgXCI6XCIgKyBfcGx1cygpLmRhc2hlcml6ZSh0aGlzLm5hbWUpXG4gIH1cblxuICBzdGF0aWMgZ2V0Q29tbWFuZE5hbWVXaXRob3V0UHJlZml4KCkge1xuICAgIHJldHVybiBfcGx1cygpLmRhc2hlcml6ZSh0aGlzLm5hbWUpXG4gIH1cblxuICBzdGF0aWMgZ2V0Q29tbWFuZFNjb3BlKCkge1xuICAgIHJldHVybiB0aGlzLmNvbW1hbmRTY29wZVxuICB9XG5cbiAgc3RhdGljIHJlZ2lzdGVyQ29tbWFuZCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWdpc3RlckNvbW1hbmRGcm9tU3BlYyh0aGlzLm5hbWUsIHtcbiAgICAgIGNvbW1hbmRTY29wZTogdGhpcy5nZXRDb21tYW5kU2NvcGUoKSxcbiAgICAgIGNvbW1hbmROYW1lOiB0aGlzLmdldENvbW1hbmROYW1lKCksXG4gICAgICBnZXRDbGFzczogKCkgPT4gdGhpcyxcbiAgICB9KVxuICB9XG5cbiAgc3RhdGljIHJlZ2lzdGVyQ29tbWFuZEZyb21TcGVjKG5hbWUsIHNwZWMpIHtcbiAgICBsZXQge2NvbW1hbmRTY29wZSA9IFwiYXRvbS10ZXh0LWVkaXRvclwiLCBjb21tYW5kUHJlZml4ID0gXCJ2aW0tbW9kZS1wbHVzXCIsIGNvbW1hbmROYW1lLCBnZXRDbGFzc30gPSBzcGVjXG4gICAgaWYgKCFjb21tYW5kTmFtZSkgY29tbWFuZE5hbWUgPSBjb21tYW5kUHJlZml4ICsgXCI6XCIgKyBfcGx1cygpLmRhc2hlcml6ZShuYW1lKVxuICAgIGlmICghZ2V0Q2xhc3MpIGdldENsYXNzID0gbmFtZSA9PiB0aGlzLmdldENsYXNzKG5hbWUpXG5cbiAgICBjb25zdCBnZXRFZGl0b3JTdGF0ZSA9IHRoaXMuZ2V0RWRpdG9yU3RhdGVcbiAgICByZXR1cm4gYXRvbS5jb21tYW5kcy5hZGQoY29tbWFuZFNjb3BlLCBjb21tYW5kTmFtZSwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGNvbnN0IHZpbVN0YXRlID0gZ2V0RWRpdG9yU3RhdGUodGhpcy5nZXRNb2RlbCgpKSB8fCBnZXRFZGl0b3JTdGF0ZShhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkpXG4gICAgICBpZiAodmltU3RhdGUpIHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLnJ1bihnZXRDbGFzcyhuYW1lKSkgLy8gdmltU3RhdGUgcG9zc2libHkgYmUgdW5kZWZpbmVkIFNlZSAjODVcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpXG4gICAgfSlcbiAgfVxuXG4gIHN0YXRpYyBnZXRLaW5kRm9yQ29tbWFuZE5hbWUoY29tbWFuZCkge1xuICAgIGNvbnN0IGNvbW1hbmRXaXRob3V0UHJlZml4ID0gY29tbWFuZC5yZXBsYWNlKC9edmltLW1vZGUtcGx1czovLCBcIlwiKVxuICAgIGNvbnN0IHtjYXBpdGFsaXplLCBjYW1lbGl6ZX0gPSBfcGx1cygpXG4gICAgY29uc3QgY29tbWFuZENsYXNzTmFtZSA9IGNhcGl0YWxpemUoY2FtZWxpemUoY29tbWFuZFdpdGhvdXRQcmVmaXgpKVxuICAgIGlmIChjb21tYW5kQ2xhc3NOYW1lIGluIENMQVNTX1JFR0lTVFJZKSB7XG4gICAgICByZXR1cm4gQ0xBU1NfUkVHSVNUUllbY29tbWFuZENsYXNzTmFtZV0ub3BlcmF0aW9uS2luZFxuICAgIH1cbiAgfVxuXG4gIC8vIFByb3h5IHByb3BwZXJ0aWVzIGFuZCBtZXRob2RzXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIGdldCBtb2RlKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5tb2RlIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldCBzdWJtb2RlKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5zdWJtb2RlIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldCBzd3JhcCgpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuc3dyYXAgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IHV0aWxzKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS51dGlscyB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgZWRpdG9yKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5lZGl0b3IgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IGVkaXRvckVsZW1lbnQoKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVkaXRvckVsZW1lbnQgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IGdsb2JhbFN0YXRlKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5nbG9iYWxTdGF0ZSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgbXV0YXRpb25NYW5hZ2VyKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5tdXRhdGlvbk1hbmFnZXIgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZ2V0IG9jY3VycmVuY2VNYW5hZ2VyKCkgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vY2N1cnJlbmNlTWFuYWdlciB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXQgcGVyc2lzdGVudFNlbGVjdGlvbigpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbiB9IC8vIHByZXR0aWVyLWlnbm9yZVxuXG4gIG9uRGlkQ2hhbmdlU2VhcmNoKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRDaGFuZ2VTZWFyY2goLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25EaWRDb25maXJtU2VhcmNoKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRDb25maXJtU2VhcmNoKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkQ2FuY2VsU2VhcmNoKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRDYW5jZWxTZWFyY2goLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25EaWRDb21tYW5kU2VhcmNoKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRDb21tYW5kU2VhcmNoKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkU2V0VGFyZ2V0KC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRTZXRUYXJnZXQoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZW1pdERpZFNldFRhcmdldCguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVtaXREaWRTZXRUYXJnZXQoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25XaWxsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25XaWxsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXRXaWxsU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZW1pdFdpbGxTZWxlY3RUYXJnZXQoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25EaWRTZWxlY3RUYXJnZXQoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZFNlbGVjdFRhcmdldCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBlbWl0RGlkU2VsZWN0VGFyZ2V0KC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZW1pdERpZFNlbGVjdFRhcmdldCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZEZhaWxTZWxlY3RUYXJnZXQoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZEZhaWxTZWxlY3RUYXJnZXQoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgZW1pdERpZEZhaWxTZWxlY3RUYXJnZXQoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5lbWl0RGlkRmFpbFNlbGVjdFRhcmdldCguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbldpbGxGaW5pc2hNdXRhdGlvbiguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uV2lsbEZpbmlzaE11dGF0aW9uKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXRXaWxsRmluaXNoTXV0YXRpb24oLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5lbWl0V2lsbEZpbmlzaE11dGF0aW9uKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkRmluaXNoTXV0YXRpb24oLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZEZpbmlzaE11dGF0aW9uKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGVtaXREaWRGaW5pc2hNdXRhdGlvbiguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmVtaXREaWRGaW5pc2hNdXRhdGlvbiguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZEZpbmlzaE9wZXJhdGlvbiguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uRGlkRmluaXNoT3BlcmF0aW9uKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkUmVzZXRPcGVyYXRpb25TdGFjayguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLm9uRGlkUmVzZXRPcGVyYXRpb25TdGFjayguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZFNldE9wZXJhdG9yTW9kaWZpZXIoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZFNldE9wZXJhdG9yTW9kaWZpZXIoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25XaWxsQWN0aXZhdGVNb2RlKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25XaWxsQWN0aXZhdGVNb2RlKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIG9uRGlkQWN0aXZhdGVNb2RlKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWRBY3RpdmF0ZU1vZGUoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgcHJlZW1wdFdpbGxEZWFjdGl2YXRlTW9kZSguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLnByZWVtcHRXaWxsRGVhY3RpdmF0ZU1vZGUoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgb25XaWxsRGVhY3RpdmF0ZU1vZGUoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbldpbGxEZWFjdGl2YXRlTW9kZSguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZERlYWN0aXZhdGVNb2RlKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUub25EaWREZWFjdGl2YXRlTW9kZSguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBvbkRpZENhbmNlbFNlbGVjdExpc3QoLi4uYXJncykgeyByZXR1cm4gdGhpcy52aW1TdGF0ZS5vbkRpZENhbmNlbFNlbGVjdExpc3QoLi4uYXJncykgfSAvLyBwcmV0dGllci1pZ25vcmVcbiAgc3Vic2NyaWJlKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuc3Vic2NyaWJlKC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGlzTW9kZSguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmlzTW9kZSguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRCbG9ja3dpc2VTZWxlY3Rpb25zKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZ2V0QmxvY2t3aXNlU2VsZWN0aW9ucyguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBnZXRMYXN0QmxvY2t3aXNlU2VsZWN0aW9uKC4uLmFyZ3MpIHsgcmV0dXJuIHRoaXMudmltU3RhdGUuZ2V0TGFzdEJsb2Nrd2lzZVNlbGVjdGlvbiguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxuICBhZGRUb0NsYXNzTGlzdCguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmFkZFRvQ2xhc3NMaXN0KC4uLmFyZ3MpIH0gLy8gcHJldHRpZXItaWdub3JlXG4gIGdldENvbmZpZyguLi5hcmdzKSB7IHJldHVybiB0aGlzLnZpbVN0YXRlLmdldENvbmZpZyguLi5hcmdzKSB9IC8vIHByZXR0aWVyLWlnbm9yZVxufVxuQmFzZS5yZWdpc3RlcihmYWxzZSlcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlXG4iXX0=