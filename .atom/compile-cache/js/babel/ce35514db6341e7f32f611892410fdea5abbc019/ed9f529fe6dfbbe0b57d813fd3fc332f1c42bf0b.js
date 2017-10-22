"use babel";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require("underscore-plus");

var _require = require("./utils");

var saveEditorState = _require.saveEditorState;
var getNonWordCharactersForCursor = _require.getNonWordCharactersForCursor;
var searchByProjectFind = _require.searchByProjectFind;

var SearchModel = require("./search-model");
var Motion = require("./base").getClass("Motion");

var SearchBase = (function (_Motion) {
  _inherits(SearchBase, _Motion);

  function SearchBase() {
    _classCallCheck(this, SearchBase);

    _get(Object.getPrototypeOf(SearchBase.prototype), "constructor", this).apply(this, arguments);

    this.jump = true;
    this.backwards = false;
    this.useRegexp = true;
    this.caseSensitivityKind = null;
    this.landingPoint = null;
    this.defaultLandingPoint = "start";
    this.relativeIndex = null;
    this.updatelastSearchPattern = true;
  }

  _createClass(SearchBase, [{
    key: "isBackwards",
    value: function isBackwards() {
      return this.backwards;
    }
  }, {
    key: "resetState",
    value: function resetState() {
      _get(Object.getPrototypeOf(SearchBase.prototype), "resetState", this).call(this);
      this.relativeIndex = null;
    }
  }, {
    key: "isIncrementalSearch",
    value: function isIncrementalSearch() {
      return this["instanceof"]("Search") && !this.repeated && this.getConfig("incrementalSearch");
    }
  }, {
    key: "initialize",
    value: function initialize() {
      var _this = this;

      this.onDidFinishOperation(function () {
        return _this.finish();
      });
      return _get(Object.getPrototypeOf(SearchBase.prototype), "initialize", this).call(this);
    }
  }, {
    key: "getCount",
    value: function getCount() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _get(Object.getPrototypeOf(SearchBase.prototype), "getCount", this).apply(this, args) * (this.isBackwards() ? -1 : 1);
    }
  }, {
    key: "finish",
    value: function finish() {
      if (this.isIncrementalSearch() && this.getConfig("showHoverSearchCounter")) {
        this.vimState.hoverSearchCounter.reset();
      }
      if (this.searchModel) this.searchModel.destroy();

      this.relativeIndex = null;
      this.searchModel = null;
    }
  }, {
    key: "getLandingPoint",
    value: function getLandingPoint() {
      if (!this.landingPoint) this.landingPoint = this.defaultLandingPoint;
      return this.landingPoint;
    }
  }, {
    key: "getPoint",
    value: function getPoint(cursor) {
      if (this.searchModel) {
        this.relativeIndex = this.getCount() + this.searchModel.getRelativeIndex();
      } else if (this.relativeIndex == null) {
        this.relativeIndex = this.getCount();
      }

      var range = this.search(cursor, this.input, this.relativeIndex);

      this.searchModel.destroy();
      this.searchModel = null;

      if (range) return range[this.getLandingPoint()];
    }
  }, {
    key: "moveCursor",
    value: function moveCursor(cursor) {
      if (!this.input) return;
      var point = this.getPoint(cursor);

      if (point) cursor.setBufferPosition(point, { autoscroll: false });

      if (!this.repeated) {
        this.globalState.set("currentSearch", this);
        this.vimState.searchHistory.save(this.input);
      }

      if (this.updatelastSearchPattern) {
        this.globalState.set("lastSearchPattern", this.getPattern(this.input));
      }
    }
  }, {
    key: "getSearchModel",
    value: function getSearchModel() {
      if (!this.searchModel) {
        this.searchModel = new SearchModel(this.vimState, { incrementalSearch: this.isIncrementalSearch() });
      }
      return this.searchModel;
    }
  }, {
    key: "search",
    value: function search(cursor, input, relativeIndex) {
      var searchModel = this.getSearchModel();
      if (input) {
        var fromPoint = this.getBufferPositionForCursor(cursor);
        return searchModel.search(fromPoint, this.getPattern(input), relativeIndex);
      }
      this.vimState.hoverSearchCounter.reset();
      searchModel.clearMarkers();
    }
  }]);

  return SearchBase;
})(Motion);

SearchBase.register(false);

// /, ?
// -------------------------

var Search = (function (_SearchBase) {
  _inherits(Search, _SearchBase);

  function Search() {
    _classCallCheck(this, Search);

    _get(Object.getPrototypeOf(Search.prototype), "constructor", this).apply(this, arguments);

    this.caseSensitivityKind = "Search";
    this.requireInput = true;
  }

  _createClass(Search, [{
    key: "initialize",
    value: function initialize() {
      if (!this.isComplete()) {
        if (this.isIncrementalSearch()) {
          this.restoreEditorState = saveEditorState(this.editor);
          this.onDidCommandSearch(this.handleCommandEvent.bind(this));
        }

        this.onDidConfirmSearch(this.handleConfirmSearch.bind(this));
        this.onDidCancelSearch(this.handleCancelSearch.bind(this));
        this.onDidChangeSearch(this.handleChangeSearch.bind(this));

        this.focusSearchInputEditor();
      }

      return _get(Object.getPrototypeOf(Search.prototype), "initialize", this).call(this);
    }
  }, {
    key: "focusSearchInputEditor",
    value: function focusSearchInputEditor() {
      var classList = this.isBackwards() ? ["backwards"] : [];
      this.vimState.searchInput.focus({ classList: classList });
    }
  }, {
    key: "handleCommandEvent",
    value: function handleCommandEvent(event) {
      if (!event.input) return;

      if (event.name === "visit") {
        var direction = event.direction;

        if (this.isBackwards() && this.getConfig("incrementalSearchVisitDirection") === "relative") {
          direction = direction === "next" ? "prev" : "next";
        }
        this.getSearchModel().visit(direction === "next" ? +1 : -1);
      } else if (event.name === "occurrence") {
        var operation = event.operation;
        var input = event.input;

        this.occurrenceManager.addPattern(this.getPattern(input), { reset: operation != null });
        this.occurrenceManager.saveLastPattern();

        this.vimState.searchHistory.save(input);
        this.vimState.searchInput.cancel();
        if (operation != null) this.vimState.operationStack.run(operation);
      } else if (event.name === "project-find") {
        this.vimState.searchHistory.save(event.input);
        this.vimState.searchInput.cancel();
        searchByProjectFind(this.editor, event.input);
      }
    }
  }, {
    key: "handleCancelSearch",
    value: function handleCancelSearch() {
      if (!["visual", "insert"].includes(this.mode)) this.vimState.resetNormalMode();

      if (this.restoreEditorState) this.restoreEditorState();
      this.vimState.reset();
      this.finish();
    }
  }, {
    key: "isSearchRepeatCharacter",
    value: function isSearchRepeatCharacter(char) {
      return this.isIncrementalSearch() ? char === "" : ["", this.isBackwards() ? "?" : "/"].includes(char); // empty confirm or invoking-char
    }
  }, {
    key: "handleConfirmSearch",
    value: function handleConfirmSearch(_ref) {
      var input = _ref.input;
      var landingPoint = _ref.landingPoint;

      this.input = input;
      this.landingPoint = landingPoint;
      if (this.isSearchRepeatCharacter(this.input)) {
        this.input = this.vimState.searchHistory.get("prev");
        if (!this.input) atom.beep();
      }
      this.processOperation();
    }
  }, {
    key: "handleChangeSearch",
    value: function handleChangeSearch(input) {
      // If input starts with space, remove first space and disable useRegexp.
      if (input.startsWith(" ")) {
        // FIXME: Sould I remove this unknown hack and implement visible button to togle regexp?
        input = input.replace(/^ /, "");
        this.useRegexp = false;
      }
      this.vimState.searchInput.updateOptionSettings({ useRegexp: this.useRegexp });

      if (this.isIncrementalSearch()) {
        this.search(this.editor.getLastCursor(), input, this.getCount());
      }
    }
  }, {
    key: "getPattern",
    value: function getPattern(term) {
      var modifiers = this.isCaseSensitive(term) ? "g" : "gi";
      // FIXME this prevent search \\c itself.
      // DONT thinklessly mimic pure Vim. Instead, provide ignorecase button and shortcut.
      if (term.indexOf("\\c") >= 0) {
        term = term.replace("\\c", "");
        if (!modifiers.includes("i")) modifiers += "i";
      }

      if (this.useRegexp) {
        try {
          return new RegExp(term, modifiers);
        } catch (error) {}
      }
      return new RegExp(_.escapeRegExp(term), modifiers);
    }
  }]);

  return Search;
})(SearchBase);

Search.register();

var SearchBackwards = (function (_Search) {
  _inherits(SearchBackwards, _Search);

  function SearchBackwards() {
    _classCallCheck(this, SearchBackwards);

    _get(Object.getPrototypeOf(SearchBackwards.prototype), "constructor", this).apply(this, arguments);

    this.backwards = true;
  }

  return SearchBackwards;
})(Search);

SearchBackwards.register();

// *, #
// -------------------------

var SearchCurrentWord = (function (_SearchBase2) {
  _inherits(SearchCurrentWord, _SearchBase2);

  function SearchCurrentWord() {
    _classCallCheck(this, SearchCurrentWord);

    _get(Object.getPrototypeOf(SearchCurrentWord.prototype), "constructor", this).apply(this, arguments);

    this.caseSensitivityKind = "SearchCurrentWord";
  }

  _createClass(SearchCurrentWord, [{
    key: "moveCursor",
    value: function moveCursor(cursor) {
      if (this.input == null) {
        var wordRange = this.getCurrentWordBufferRange();
        if (wordRange) {
          this.editor.setCursorBufferPosition(wordRange.start);
          this.input = this.editor.getTextInBufferRange(wordRange);
        } else {
          this.input = "";
        }
      }

      _get(Object.getPrototypeOf(SearchCurrentWord.prototype), "moveCursor", this).call(this, cursor);
    }
  }, {
    key: "getPattern",
    value: function getPattern(term) {
      var escaped = _.escapeRegExp(term);
      var source = /\W/.test(term) ? escaped + "\\b" : "\\b" + escaped + "\\b";
      return new RegExp(source, this.isCaseSensitive(term) ? "g" : "gi");
    }
  }, {
    key: "getCurrentWordBufferRange",
    value: function getCurrentWordBufferRange() {
      var cursor = this.editor.getLastCursor();
      var point = cursor.getBufferPosition();

      var nonWordCharacters = getNonWordCharactersForCursor(cursor);
      var wordRegex = new RegExp("[^\\s" + _.escapeRegExp(nonWordCharacters) + "]+", "g");

      var foundRange = undefined;
      this.scanForward(wordRegex, { from: [point.row, 0], allowNextLine: false }, function (_ref2) {
        var range = _ref2.range;
        var stop = _ref2.stop;

        if (range.end.isGreaterThan(point)) {
          foundRange = range;
          stop();
        }
      });
      return foundRange;
    }
  }]);

  return SearchCurrentWord;
})(SearchBase);

SearchCurrentWord.register();

var SearchCurrentWordBackwards = (function (_SearchCurrentWord) {
  _inherits(SearchCurrentWordBackwards, _SearchCurrentWord);

  function SearchCurrentWordBackwards() {
    _classCallCheck(this, SearchCurrentWordBackwards);

    _get(Object.getPrototypeOf(SearchCurrentWordBackwards.prototype), "constructor", this).apply(this, arguments);

    this.backwards = true;
  }

  return SearchCurrentWordBackwards;
})(SearchCurrentWord);

SearchCurrentWordBackwards.register();
// ['start' or 'end']
// ['start' or 'end']
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9saWIvbW90aW9uLXNlYXJjaC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7Ozs7Ozs7QUFFWCxJQUFNLENBQUMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQTs7ZUFFMEMsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7SUFBekYsZUFBZSxZQUFmLGVBQWU7SUFBRSw2QkFBNkIsWUFBN0IsNkJBQTZCO0lBQUUsbUJBQW1CLFlBQW5CLG1CQUFtQjs7QUFDMUUsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDN0MsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTs7SUFFN0MsVUFBVTtZQUFWLFVBQVU7O1dBQVYsVUFBVTswQkFBVixVQUFVOzsrQkFBVixVQUFVOztTQUNkLElBQUksR0FBRyxJQUFJO1NBQ1gsU0FBUyxHQUFHLEtBQUs7U0FDakIsU0FBUyxHQUFHLElBQUk7U0FDaEIsbUJBQW1CLEdBQUcsSUFBSTtTQUMxQixZQUFZLEdBQUcsSUFBSTtTQUNuQixtQkFBbUIsR0FBRyxPQUFPO1NBQzdCLGFBQWEsR0FBRyxJQUFJO1NBQ3BCLHVCQUF1QixHQUFHLElBQUk7OztlQVIxQixVQUFVOztXQVVILHVCQUFHO0FBQ1osYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFBO0tBQ3RCOzs7V0FFUyxzQkFBRztBQUNYLGlDQWZFLFVBQVUsNENBZU07QUFDbEIsVUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUE7S0FDMUI7OztXQUVrQiwrQkFBRztBQUNwQixhQUFPLElBQUksY0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENB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QUcsQ0FBQyxDQUFBOztBQUVoRixVQUFJLFVBQVUsWUFBQSxDQUFBO0FBQ2QsVUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUMsRUFBRSxVQUFDLEtBQWEsRUFBSztZQUFqQixLQUFLLEdBQU4sS0FBYSxDQUFaLEtBQUs7WUFBRSxJQUFJLEdBQVosS0FBYSxDQUFMLElBQUk7O0FBQ3JGLFlBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDbEMsb0JBQVUsR0FBRyxLQUFLLENBQUE7QUFDbEIsY0FBSSxFQUFFLENBQUE7U0FDUDtPQUNGLENBQUMsQ0FBQTtBQUNGLGFBQU8sVUFBVSxDQUFBO0tBQ2xCOzs7U0F0Q0csaUJBQWlCO0dBQVMsVUFBVTs7QUF3QzFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFBOztJQUV0QiwwQkFBMEI7WUFBMUIsMEJBQTBCOztXQUExQiwwQkFBMEI7MEJBQTFCLDBCQUEwQjs7K0JBQTFCLDBCQUEwQjs7U0FDOUIsU0FBUyxHQUFHLElBQUk7OztTQURaLDBCQUEwQjtHQUFTLGlCQUFpQjs7QUFHMUQsMEJBQTBCLENBQUMsUUFBUSxFQUFFLENBQUEiLCJmaWxlIjoiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24tc2VhcmNoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXCJ1c2UgYmFiZWxcIlxuXG5jb25zdCBfID0gcmVxdWlyZShcInVuZGVyc2NvcmUtcGx1c1wiKVxuXG5jb25zdCB7c2F2ZUVkaXRvclN0YXRlLCBnZXROb25Xb3JkQ2hhcmFjdGVyc0ZvckN1cnNvciwgc2VhcmNoQnlQcm9qZWN0RmluZH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKVxuY29uc3QgU2VhcmNoTW9kZWwgPSByZXF1aXJlKFwiLi9zZWFyY2gtbW9kZWxcIilcbmNvbnN0IE1vdGlvbiA9IHJlcXVpcmUoXCIuL2Jhc2VcIikuZ2V0Q2xhc3MoXCJNb3Rpb25cIilcblxuY2xhc3MgU2VhcmNoQmFzZSBleHRlbmRzIE1vdGlvbiB7XG4gIGp1bXAgPSB0cnVlXG4gIGJhY2t3YXJkcyA9IGZhbHNlXG4gIHVzZVJlZ2V4cCA9IHRydWVcbiAgY2FzZVNlbnNpdGl2aXR5S2luZCA9IG51bGxcbiAgbGFuZGluZ1BvaW50ID0gbnVsbCAvLyBbJ3N0YXJ0JyBvciAnZW5kJ11cbiAgZGVmYXVsdExhbmRpbmdQb2ludCA9IFwic3RhcnRcIiAvLyBbJ3N0YXJ0JyBvciAnZW5kJ11cbiAgcmVsYXRpdmVJbmRleCA9IG51bGxcbiAgdXBkYXRlbGFzdFNlYXJjaFBhdHRlcm4gPSB0cnVlXG5cbiAgaXNCYWNrd2FyZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuYmFja3dhcmRzXG4gIH1cblxuICByZXNldFN0YXRlKCkge1xuICAgIHN1cGVyLnJlc2V0U3RhdGUoKVxuICAgIHRoaXMucmVsYXRpdmVJbmRleCA9IG51bGxcbiAgfVxuXG4gIGlzSW5jcmVtZW50YWxTZWFyY2goKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFuY2VvZihcIlNlYXJjaFwiKSAmJiAhdGhpcy5yZXBlYXRlZCAmJiB0aGlzLmdldENvbmZpZyhcImluY3JlbWVudGFsU2VhcmNoXCIpXG4gIH1cblxuICBpbml0aWFsaXplKCkge1xuICAgIHRoaXMub25EaWRGaW5pc2hPcGVyYXRpb24oKCkgPT4gdGhpcy5maW5pc2goKSlcbiAgICByZXR1cm4gc3VwZXIuaW5pdGlhbGl6ZSgpXG4gIH1cblxuICBnZXRDb3VudCguLi5hcmdzKSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldENvdW50KC4uLmFyZ3MpICogKHRoaXMuaXNCYWNrd2FyZHMoKSA/IC0xIDogMSlcbiAgfVxuXG4gIGZpbmlzaCgpIHtcbiAgICBpZiAodGhpcy5pc0luY3JlbWVudGFsU2VhcmNoKCkgJiYgdGhpcy5nZXRDb25maWcoXCJzaG93SG92ZXJTZWFyY2hDb3VudGVyXCIpKSB7XG4gICAgICB0aGlzLnZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgfVxuICAgIGlmICh0aGlzLnNlYXJjaE1vZGVsKSB0aGlzLnNlYXJjaE1vZGVsLmRlc3Ryb3koKVxuXG4gICAgdGhpcy5yZWxhdGl2ZUluZGV4ID0gbnVsbFxuICAgIHRoaXMuc2VhcmNoTW9kZWwgPSBudWxsXG4gIH1cblxuICBnZXRMYW5kaW5nUG9pbnQoKSB7XG4gICAgaWYgKCF0aGlzLmxhbmRpbmdQb2ludCkgdGhpcy5sYW5kaW5nUG9pbnQgPSB0aGlzLmRlZmF1bHRMYW5kaW5nUG9pbnRcbiAgICByZXR1cm4gdGhpcy5sYW5kaW5nUG9pbnRcbiAgfVxuXG4gIGdldFBvaW50KGN1cnNvcikge1xuICAgIGlmICh0aGlzLnNlYXJjaE1vZGVsKSB7XG4gICAgICB0aGlzLnJlbGF0aXZlSW5kZXggPSB0aGlzLmdldENvdW50KCkgKyB0aGlzLnNlYXJjaE1vZGVsLmdldFJlbGF0aXZlSW5kZXgoKVxuICAgIH0gZWxzZSBpZiAodGhpcy5yZWxhdGl2ZUluZGV4ID09IG51bGwpIHtcbiAgICAgIHRoaXMucmVsYXRpdmVJbmRleCA9IHRoaXMuZ2V0Q291bnQoKVxuICAgIH1cblxuICAgIGNvbnN0IHJhbmdlID0gdGhpcy5zZWFyY2goY3Vyc29yLCB0aGlzLmlucHV0LCB0aGlzLnJlbGF0aXZlSW5kZXgpXG5cbiAgICB0aGlzLnNlYXJjaE1vZGVsLmRlc3Ryb3koKVxuICAgIHRoaXMuc2VhcmNoTW9kZWwgPSBudWxsXG5cbiAgICBpZiAocmFuZ2UpIHJldHVybiByYW5nZVt0aGlzLmdldExhbmRpbmdQb2ludCgpXVxuICB9XG5cbiAgbW92ZUN1cnNvcihjdXJzb3IpIHtcbiAgICBpZiAoIXRoaXMuaW5wdXQpIHJldHVyblxuICAgIGNvbnN0IHBvaW50ID0gdGhpcy5nZXRQb2ludChjdXJzb3IpXG5cbiAgICBpZiAocG9pbnQpIGN1cnNvci5zZXRCdWZmZXJQb3NpdGlvbihwb2ludCwge2F1dG9zY3JvbGw6IGZhbHNlfSlcblxuICAgIGlmICghdGhpcy5yZXBlYXRlZCkge1xuICAgICAgdGhpcy5nbG9iYWxTdGF0ZS5zZXQoXCJjdXJyZW50U2VhcmNoXCIsIHRoaXMpXG4gICAgICB0aGlzLnZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZSh0aGlzLmlucHV0KVxuICAgIH1cblxuICAgIGlmICh0aGlzLnVwZGF0ZWxhc3RTZWFyY2hQYXR0ZXJuKSB7XG4gICAgICB0aGlzLmdsb2JhbFN0YXRlLnNldChcImxhc3RTZWFyY2hQYXR0ZXJuXCIsIHRoaXMuZ2V0UGF0dGVybih0aGlzLmlucHV0KSlcbiAgICB9XG4gIH1cblxuICBnZXRTZWFyY2hNb2RlbCgpIHtcbiAgICBpZiAoIXRoaXMuc2VhcmNoTW9kZWwpIHtcbiAgICAgIHRoaXMuc2VhcmNoTW9kZWwgPSBuZXcgU2VhcmNoTW9kZWwodGhpcy52aW1TdGF0ZSwge2luY3JlbWVudGFsU2VhcmNoOiB0aGlzLmlzSW5jcmVtZW50YWxTZWFyY2goKX0pXG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNlYXJjaE1vZGVsXG4gIH1cblxuICBzZWFyY2goY3Vyc29yLCBpbnB1dCwgcmVsYXRpdmVJbmRleCkge1xuICAgIGNvbnN0IHNlYXJjaE1vZGVsID0gdGhpcy5nZXRTZWFyY2hNb2RlbCgpXG4gICAgaWYgKGlucHV0KSB7XG4gICAgICBjb25zdCBmcm9tUG9pbnQgPSB0aGlzLmdldEJ1ZmZlclBvc2l0aW9uRm9yQ3Vyc29yKGN1cnNvcilcbiAgICAgIHJldHVybiBzZWFyY2hNb2RlbC5zZWFyY2goZnJvbVBvaW50LCB0aGlzLmdldFBhdHRlcm4oaW5wdXQpLCByZWxhdGl2ZUluZGV4KVxuICAgIH1cbiAgICB0aGlzLnZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgc2VhcmNoTW9kZWwuY2xlYXJNYXJrZXJzKClcbiAgfVxufVxuU2VhcmNoQmFzZS5yZWdpc3RlcihmYWxzZSlcblxuLy8gLywgP1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuY2xhc3MgU2VhcmNoIGV4dGVuZHMgU2VhcmNoQmFzZSB7XG4gIGNhc2VTZW5zaXRpdml0eUtpbmQgPSBcIlNlYXJjaFwiXG4gIHJlcXVpcmVJbnB1dCA9IHRydWVcblxuICBpbml0aWFsaXplKCkge1xuICAgIGlmICghdGhpcy5pc0NvbXBsZXRlKCkpIHtcbiAgICAgIGlmICh0aGlzLmlzSW5jcmVtZW50YWxTZWFyY2goKSkge1xuICAgICAgICB0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSA9IHNhdmVFZGl0b3JTdGF0ZSh0aGlzLmVkaXRvcilcbiAgICAgICAgdGhpcy5vbkRpZENvbW1hbmRTZWFyY2godGhpcy5oYW5kbGVDb21tYW5kRXZlbnQuYmluZCh0aGlzKSlcbiAgICAgIH1cblxuICAgICAgdGhpcy5vbkRpZENvbmZpcm1TZWFyY2godGhpcy5oYW5kbGVDb25maXJtU2VhcmNoLmJpbmQodGhpcykpXG4gICAgICB0aGlzLm9uRGlkQ2FuY2VsU2VhcmNoKHRoaXMuaGFuZGxlQ2FuY2VsU2VhcmNoLmJpbmQodGhpcykpXG4gICAgICB0aGlzLm9uRGlkQ2hhbmdlU2VhcmNoKHRoaXMuaGFuZGxlQ2hhbmdlU2VhcmNoLmJpbmQodGhpcykpXG5cbiAgICAgIHRoaXMuZm9jdXNTZWFyY2hJbnB1dEVkaXRvcigpXG4gICAgfVxuXG4gICAgcmV0dXJuIHN1cGVyLmluaXRpYWxpemUoKVxuICB9XG5cbiAgZm9jdXNTZWFyY2hJbnB1dEVkaXRvcigpIHtcbiAgICBjb25zdCBjbGFzc0xpc3QgPSB0aGlzLmlzQmFja3dhcmRzKCkgPyBbXCJiYWNrd2FyZHNcIl0gOiBbXVxuICAgIHRoaXMudmltU3RhdGUuc2VhcmNoSW5wdXQuZm9jdXMoe2NsYXNzTGlzdH0pXG4gIH1cblxuICBoYW5kbGVDb21tYW5kRXZlbnQoZXZlbnQpIHtcbiAgICBpZiAoIWV2ZW50LmlucHV0KSByZXR1cm5cblxuICAgIGlmIChldmVudC5uYW1lID09PSBcInZpc2l0XCIpIHtcbiAgICAgIGxldCB7ZGlyZWN0aW9ufSA9IGV2ZW50XG4gICAgICBpZiAodGhpcy5pc0JhY2t3YXJkcygpICYmIHRoaXMuZ2V0Q29uZmlnKFwiaW5jcmVtZW50YWxTZWFyY2hWaXNpdERpcmVjdGlvblwiKSA9PT0gXCJyZWxhdGl2ZVwiKSB7XG4gICAgICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiA9PT0gXCJuZXh0XCIgPyBcInByZXZcIiA6IFwibmV4dFwiXG4gICAgICB9XG4gICAgICB0aGlzLmdldFNlYXJjaE1vZGVsKCkudmlzaXQoZGlyZWN0aW9uID09PSBcIm5leHRcIiA/ICsxIDogLTEpXG4gICAgfSBlbHNlIGlmIChldmVudC5uYW1lID09PSBcIm9jY3VycmVuY2VcIikge1xuICAgICAgY29uc3Qge29wZXJhdGlvbiwgaW5wdXR9ID0gZXZlbnRcbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuYWRkUGF0dGVybih0aGlzLmdldFBhdHRlcm4oaW5wdXQpLCB7cmVzZXQ6IG9wZXJhdGlvbiAhPSBudWxsfSlcbiAgICAgIHRoaXMub2NjdXJyZW5jZU1hbmFnZXIuc2F2ZUxhc3RQYXR0ZXJuKClcblxuICAgICAgdGhpcy52aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnNhdmUoaW5wdXQpXG4gICAgICB0aGlzLnZpbVN0YXRlLnNlYXJjaElucHV0LmNhbmNlbCgpXG4gICAgICBpZiAob3BlcmF0aW9uICE9IG51bGwpIHRoaXMudmltU3RhdGUub3BlcmF0aW9uU3RhY2sucnVuKG9wZXJhdGlvbilcbiAgICB9IGVsc2UgaWYgKGV2ZW50Lm5hbWUgPT09IFwicHJvamVjdC1maW5kXCIpIHtcbiAgICAgIHRoaXMudmltU3RhdGUuc2VhcmNoSGlzdG9yeS5zYXZlKGV2ZW50LmlucHV0KVxuICAgICAgdGhpcy52aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKVxuICAgICAgc2VhcmNoQnlQcm9qZWN0RmluZCh0aGlzLmVkaXRvciwgZXZlbnQuaW5wdXQpXG4gICAgfVxuICB9XG5cbiAgaGFuZGxlQ2FuY2VsU2VhcmNoKCkge1xuICAgIGlmICghW1widmlzdWFsXCIsIFwiaW5zZXJ0XCJdLmluY2x1ZGVzKHRoaXMubW9kZSkpIHRoaXMudmltU3RhdGUucmVzZXROb3JtYWxNb2RlKClcblxuICAgIGlmICh0aGlzLnJlc3RvcmVFZGl0b3JTdGF0ZSkgdGhpcy5yZXN0b3JlRWRpdG9yU3RhdGUoKVxuICAgIHRoaXMudmltU3RhdGUucmVzZXQoKVxuICAgIHRoaXMuZmluaXNoKClcbiAgfVxuXG4gIGlzU2VhcmNoUmVwZWF0Q2hhcmFjdGVyKGNoYXIpIHtcbiAgICByZXR1cm4gdGhpcy5pc0luY3JlbWVudGFsU2VhcmNoKCkgPyBjaGFyID09PSBcIlwiIDogW1wiXCIsIHRoaXMuaXNCYWNrd2FyZHMoKSA/IFwiP1wiIDogXCIvXCJdLmluY2x1ZGVzKGNoYXIpIC8vIGVtcHR5IGNvbmZpcm0gb3IgaW52b2tpbmctY2hhclxuICB9XG5cbiAgaGFuZGxlQ29uZmlybVNlYXJjaCh7aW5wdXQsIGxhbmRpbmdQb2ludH0pIHtcbiAgICB0aGlzLmlucHV0ID0gaW5wdXRcbiAgICB0aGlzLmxhbmRpbmdQb2ludCA9IGxhbmRpbmdQb2ludFxuICAgIGlmICh0aGlzLmlzU2VhcmNoUmVwZWF0Q2hhcmFjdGVyKHRoaXMuaW5wdXQpKSB7XG4gICAgICB0aGlzLmlucHV0ID0gdGhpcy52aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LmdldChcInByZXZcIilcbiAgICAgIGlmICghdGhpcy5pbnB1dCkgYXRvbS5iZWVwKClcbiAgICB9XG4gICAgdGhpcy5wcm9jZXNzT3BlcmF0aW9uKClcbiAgfVxuXG4gIGhhbmRsZUNoYW5nZVNlYXJjaChpbnB1dCkge1xuICAgIC8vIElmIGlucHV0IHN0YXJ0cyB3aXRoIHNwYWNlLCByZW1vdmUgZmlyc3Qgc3BhY2UgYW5kIGRpc2FibGUgdXNlUmVnZXhwLlxuICAgIGlmIChpbnB1dC5zdGFydHNXaXRoKFwiIFwiKSkge1xuICAgICAgLy8gRklYTUU6IFNvdWxkIEkgcmVtb3ZlIHRoaXMgdW5rbm93biBoYWNrIGFuZCBpbXBsZW1lbnQgdmlzaWJsZSBidXR0b24gdG8gdG9nbGUgcmVnZXhwP1xuICAgICAgaW5wdXQgPSBpbnB1dC5yZXBsYWNlKC9eIC8sIFwiXCIpXG4gICAgICB0aGlzLnVzZVJlZ2V4cCA9IGZhbHNlXG4gICAgfVxuICAgIHRoaXMudmltU3RhdGUuc2VhcmNoSW5wdXQudXBkYXRlT3B0aW9uU2V0dGluZ3Moe3VzZVJlZ2V4cDogdGhpcy51c2VSZWdleHB9KVxuXG4gICAgaWYgKHRoaXMuaXNJbmNyZW1lbnRhbFNlYXJjaCgpKSB7XG4gICAgICB0aGlzLnNlYXJjaCh0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKCksIGlucHV0LCB0aGlzLmdldENvdW50KCkpXG4gICAgfVxuICB9XG5cbiAgZ2V0UGF0dGVybih0ZXJtKSB7XG4gICAgbGV0IG1vZGlmaWVycyA9IHRoaXMuaXNDYXNlU2Vuc2l0aXZlKHRlcm0pID8gXCJnXCIgOiBcImdpXCJcbiAgICAvLyBGSVhNRSB0aGlzIHByZXZlbnQgc2VhcmNoIFxcXFxjIGl0c2VsZi5cbiAgICAvLyBET05UIHRoaW5rbGVzc2x5IG1pbWljIHB1cmUgVmltLiBJbnN0ZWFkLCBwcm92aWRlIGlnbm9yZWNhc2UgYnV0dG9uIGFuZCBzaG9ydGN1dC5cbiAgICBpZiAodGVybS5pbmRleE9mKFwiXFxcXGNcIikgPj0gMCkge1xuICAgICAgdGVybSA9IHRlcm0ucmVwbGFjZShcIlxcXFxjXCIsIFwiXCIpXG4gICAgICBpZiAoIW1vZGlmaWVycy5pbmNsdWRlcyhcImlcIikpIG1vZGlmaWVycyArPSBcImlcIlxuICAgIH1cblxuICAgIGlmICh0aGlzLnVzZVJlZ2V4cCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAodGVybSwgbW9kaWZpZXJzKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHt9XG4gICAgfVxuICAgIHJldHVybiBuZXcgUmVnRXhwKF8uZXNjYXBlUmVnRXhwKHRlcm0pLCBtb2RpZmllcnMpXG4gIH1cbn1cblNlYXJjaC5yZWdpc3RlcigpXG5cbmNsYXNzIFNlYXJjaEJhY2t3YXJkcyBleHRlbmRzIFNlYXJjaCB7XG4gIGJhY2t3YXJkcyA9IHRydWVcbn1cblNlYXJjaEJhY2t3YXJkcy5yZWdpc3RlcigpXG5cbi8vICosICNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkIGV4dGVuZHMgU2VhcmNoQmFzZSB7XG4gIGNhc2VTZW5zaXRpdml0eUtpbmQgPSBcIlNlYXJjaEN1cnJlbnRXb3JkXCJcblxuICBtb3ZlQ3Vyc29yKGN1cnNvcikge1xuICAgIGlmICh0aGlzLmlucHV0ID09IG51bGwpIHtcbiAgICAgIGNvbnN0IHdvcmRSYW5nZSA9IHRoaXMuZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpXG4gICAgICBpZiAod29yZFJhbmdlKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHdvcmRSYW5nZS5zdGFydClcbiAgICAgICAgdGhpcy5pbnB1dCA9IHRoaXMuZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHdvcmRSYW5nZSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5wdXQgPSBcIlwiXG4gICAgICB9XG4gICAgfVxuXG4gICAgc3VwZXIubW92ZUN1cnNvcihjdXJzb3IpXG4gIH1cblxuICBnZXRQYXR0ZXJuKHRlcm0pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gXy5lc2NhcGVSZWdFeHAodGVybSlcbiAgICBjb25zdCBzb3VyY2UgPSAvXFxXLy50ZXN0KHRlcm0pID8gYCR7ZXNjYXBlZH1cXFxcYmAgOiBgXFxcXGIke2VzY2FwZWR9XFxcXGJgXG4gICAgcmV0dXJuIG5ldyBSZWdFeHAoc291cmNlLCB0aGlzLmlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSA/IFwiZ1wiIDogXCJnaVwiKVxuICB9XG5cbiAgZ2V0Q3VycmVudFdvcmRCdWZmZXJSYW5nZSgpIHtcbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBjb25zdCBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBjb25zdCBub25Xb3JkQ2hhcmFjdGVycyA9IGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yKGN1cnNvcilcbiAgICBjb25zdCB3b3JkUmVnZXggPSBuZXcgUmVnRXhwKGBbXlxcXFxzJHtfLmVzY2FwZVJlZ0V4cChub25Xb3JkQ2hhcmFjdGVycyl9XStgLCBcImdcIilcblxuICAgIGxldCBmb3VuZFJhbmdlXG4gICAgdGhpcy5zY2FuRm9yd2FyZCh3b3JkUmVnZXgsIHtmcm9tOiBbcG9pbnQucm93LCAwXSwgYWxsb3dOZXh0TGluZTogZmFsc2V9LCAoe3JhbmdlLCBzdG9wfSkgPT4ge1xuICAgICAgaWYgKHJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuKHBvaW50KSkge1xuICAgICAgICBmb3VuZFJhbmdlID0gcmFuZ2VcbiAgICAgICAgc3RvcCgpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gZm91bmRSYW5nZVxuICB9XG59XG5TZWFyY2hDdXJyZW50V29yZC5yZWdpc3RlcigpXG5cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoQ3VycmVudFdvcmQge1xuICBiYWNrd2FyZHMgPSB0cnVlXG59XG5TZWFyY2hDdXJyZW50V29yZEJhY2t3YXJkcy5yZWdpc3RlcigpXG4iXX0=