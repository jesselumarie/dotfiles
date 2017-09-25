(function() {
  var Motion, Search, SearchBackwards, SearchBase, SearchCurrentWord, SearchCurrentWordBackwards, SearchModel, _, getNonWordCharactersForCursor, ref, saveEditorState, searchByProjectFind,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('underscore-plus');

  ref = require('./utils'), saveEditorState = ref.saveEditorState, getNonWordCharactersForCursor = ref.getNonWordCharactersForCursor, searchByProjectFind = ref.searchByProjectFind;

  SearchModel = require('./search-model');

  Motion = require('./base').getClass('Motion');

  SearchBase = (function(superClass) {
    extend(SearchBase, superClass);

    function SearchBase() {
      return SearchBase.__super__.constructor.apply(this, arguments);
    }

    SearchBase.extend(false);

    SearchBase.prototype.jump = true;

    SearchBase.prototype.backwards = false;

    SearchBase.prototype.useRegexp = true;

    SearchBase.prototype.caseSensitivityKind = null;

    SearchBase.prototype.landingPoint = null;

    SearchBase.prototype.defaultLandingPoint = 'start';

    SearchBase.prototype.relativeIndex = null;

    SearchBase.prototype.updatelastSearchPattern = true;

    SearchBase.prototype.isBackwards = function() {
      return this.backwards;
    };

    SearchBase.prototype.isIncrementalSearch = function() {
      return this["instanceof"]('Search') && !this.repeated && this.getConfig('incrementalSearch');
    };

    SearchBase.prototype.initialize = function() {
      SearchBase.__super__.initialize.apply(this, arguments);
      return this.onDidFinishOperation((function(_this) {
        return function() {
          return _this.finish();
        };
      })(this));
    };

    SearchBase.prototype.getCount = function() {
      var count;
      count = SearchBase.__super__.getCount.apply(this, arguments);
      if (this.isBackwards()) {
        return -count;
      } else {
        return count;
      }
    };

    SearchBase.prototype.finish = function() {
      var ref1;
      if (this.isIncrementalSearch() && this.getConfig('showHoverSearchCounter')) {
        this.vimState.hoverSearchCounter.reset();
      }
      this.relativeIndex = null;
      if ((ref1 = this.searchModel) != null) {
        ref1.destroy();
      }
      return this.searchModel = null;
    };

    SearchBase.prototype.getLandingPoint = function() {
      return this.landingPoint != null ? this.landingPoint : this.landingPoint = this.defaultLandingPoint;
    };

    SearchBase.prototype.getPoint = function(cursor) {
      var point, range;
      if (this.searchModel != null) {
        this.relativeIndex = this.getCount() + this.searchModel.getRelativeIndex();
      } else {
        if (this.relativeIndex == null) {
          this.relativeIndex = this.getCount();
        }
      }
      if (range = this.search(cursor, this.input, this.relativeIndex)) {
        point = range[this.getLandingPoint()];
      }
      this.searchModel.destroy();
      this.searchModel = null;
      return point;
    };

    SearchBase.prototype.moveCursor = function(cursor) {
      var input, point;
      input = this.input;
      if (!input) {
        return;
      }
      if (point = this.getPoint(cursor)) {
        cursor.setBufferPosition(point, {
          autoscroll: false
        });
      }
      if (!this.repeated) {
        this.globalState.set('currentSearch', this);
        this.vimState.searchHistory.save(input);
      }
      if (this.updatelastSearchPattern) {
        return this.globalState.set('lastSearchPattern', this.getPattern(input));
      }
    };

    SearchBase.prototype.getSearchModel = function() {
      return this.searchModel != null ? this.searchModel : this.searchModel = new SearchModel(this.vimState, {
        incrementalSearch: this.isIncrementalSearch()
      });
    };

    SearchBase.prototype.search = function(cursor, input, relativeIndex) {
      var fromPoint, searchModel;
      searchModel = this.getSearchModel();
      if (input) {
        fromPoint = this.getBufferPositionForCursor(cursor);
        return searchModel.search(fromPoint, this.getPattern(input), relativeIndex);
      } else {
        this.vimState.hoverSearchCounter.reset();
        return searchModel.clearMarkers();
      }
    };

    return SearchBase;

  })(Motion);

  Search = (function(superClass) {
    extend(Search, superClass);

    function Search() {
      this.handleConfirmSearch = bind(this.handleConfirmSearch, this);
      return Search.__super__.constructor.apply(this, arguments);
    }

    Search.extend();

    Search.prototype.caseSensitivityKind = "Search";

    Search.prototype.requireInput = true;

    Search.prototype.initialize = function() {
      Search.__super__.initialize.apply(this, arguments);
      if (this.isComplete()) {
        return;
      }
      if (this.isIncrementalSearch()) {
        this.restoreEditorState = saveEditorState(this.editor);
        this.onDidCommandSearch(this.handleCommandEvent.bind(this));
      }
      this.onDidConfirmSearch(this.handleConfirmSearch.bind(this));
      this.onDidCancelSearch(this.handleCancelSearch.bind(this));
      this.onDidChangeSearch(this.handleChangeSearch.bind(this));
      return this.focusSearchInputEditor();
    };

    Search.prototype.focusSearchInputEditor = function() {
      var classList;
      classList = [];
      if (this.backwards) {
        classList.push('backwards');
      }
      return this.vimState.searchInput.focus({
        classList: classList
      });
    };

    Search.prototype.handleCommandEvent = function(commandEvent) {
      var direction, input, operation;
      if (!commandEvent.input) {
        return;
      }
      switch (commandEvent.name) {
        case 'visit':
          direction = commandEvent.direction;
          if (this.isBackwards() && this.getConfig('incrementalSearchVisitDirection') === 'relative') {
            direction = (function() {
              switch (direction) {
                case 'next':
                  return 'prev';
                case 'prev':
                  return 'next';
              }
            })();
          }
          switch (direction) {
            case 'next':
              return this.getSearchModel().visit(+1);
            case 'prev':
              return this.getSearchModel().visit(-1);
          }
          break;
        case 'occurrence':
          operation = commandEvent.operation, input = commandEvent.input;
          this.vimState.occurrenceManager.addPattern(this.getPattern(input), {
            reset: operation != null
          });
          this.vimState.occurrenceManager.saveLastPattern();
          this.vimState.searchHistory.save(input);
          this.vimState.searchInput.cancel();
          if (operation != null) {
            return this.vimState.operationStack.run(operation);
          }
          break;
        case 'project-find':
          input = commandEvent.input;
          this.vimState.searchHistory.save(input);
          this.vimState.searchInput.cancel();
          return searchByProjectFind(this.editor, input);
      }
    };

    Search.prototype.handleCancelSearch = function() {
      var ref1;
      if ((ref1 = this.mode) !== 'visual' && ref1 !== 'insert') {
        this.vimState.resetNormalMode();
      }
      if (typeof this.restoreEditorState === "function") {
        this.restoreEditorState();
      }
      this.vimState.reset();
      return this.finish();
    };

    Search.prototype.isSearchRepeatCharacter = function(char) {
      var searchChar;
      if (this.isIncrementalSearch()) {
        return char === '';
      } else {
        searchChar = this.isBackwards() ? '?' : '/';
        return char === '' || char === searchChar;
      }
    };

    Search.prototype.handleConfirmSearch = function(arg) {
      this.input = arg.input, this.landingPoint = arg.landingPoint;
      if (this.isSearchRepeatCharacter(this.input)) {
        this.input = this.vimState.searchHistory.get('prev');
        if (!this.input) {
          atom.beep();
        }
      }
      return this.processOperation();
    };

    Search.prototype.handleChangeSearch = function(input) {
      if (input.startsWith(' ')) {
        input = input.replace(/^ /, '');
        this.useRegexp = false;
      }
      this.vimState.searchInput.updateOptionSettings({
        useRegexp: this.useRegexp
      });
      if (this.isIncrementalSearch()) {
        return this.search(this.editor.getLastCursor(), input, this.getCount());
      }
    };

    Search.prototype.getPattern = function(term) {
      var modifiers;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      if (term.indexOf('\\c') >= 0) {
        term = term.replace('\\c', '');
        if (indexOf.call(modifiers, 'i') < 0) {
          modifiers += 'i';
        }
      }
      if (this.useRegexp) {
        try {
          return new RegExp(term, modifiers);
        } catch (error) {
          null;
        }
      }
      return new RegExp(_.escapeRegExp(term), modifiers);
    };

    return Search;

  })(SearchBase);

  SearchBackwards = (function(superClass) {
    extend(SearchBackwards, superClass);

    function SearchBackwards() {
      return SearchBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchBackwards.extend();

    SearchBackwards.prototype.backwards = true;

    return SearchBackwards;

  })(Search);

  SearchCurrentWord = (function(superClass) {
    extend(SearchCurrentWord, superClass);

    function SearchCurrentWord() {
      return SearchCurrentWord.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWord.extend();

    SearchCurrentWord.prototype.caseSensitivityKind = "SearchCurrentWord";

    SearchCurrentWord.prototype.moveCursor = function(cursor) {
      var wordRange;
      if (this.input == null) {
        this.input = (wordRange = this.getCurrentWordBufferRange(), wordRange != null ? (this.editor.setCursorBufferPosition(wordRange.start), this.editor.getTextInBufferRange(wordRange)) : '');
      }
      return SearchCurrentWord.__super__.moveCursor.apply(this, arguments);
    };

    SearchCurrentWord.prototype.getPattern = function(term) {
      var modifiers, pattern;
      modifiers = this.isCaseSensitive(term) ? 'g' : 'gi';
      pattern = _.escapeRegExp(term);
      if (/\W/.test(term)) {
        return new RegExp(pattern + "\\b", modifiers);
      } else {
        return new RegExp("\\b" + pattern + "\\b", modifiers);
      }
    };

    SearchCurrentWord.prototype.getCurrentWordBufferRange = function() {
      var cursor, found, nonWordCharacters, point, wordRegex;
      cursor = this.editor.getLastCursor();
      point = cursor.getBufferPosition();
      nonWordCharacters = getNonWordCharactersForCursor(cursor);
      wordRegex = new RegExp("[^\\s" + (_.escapeRegExp(nonWordCharacters)) + "]+", 'g');
      found = null;
      this.scanForward(wordRegex, {
        from: [point.row, 0],
        allowNextLine: false
      }, function(arg) {
        var range, stop;
        range = arg.range, stop = arg.stop;
        if (range.end.isGreaterThan(point)) {
          found = range;
          return stop();
        }
      });
      return found;
    };

    return SearchCurrentWord;

  })(SearchBase);

  SearchCurrentWordBackwards = (function(superClass) {
    extend(SearchCurrentWordBackwards, superClass);

    function SearchCurrentWordBackwards() {
      return SearchCurrentWordBackwards.__super__.constructor.apply(this, arguments);
    }

    SearchCurrentWordBackwards.extend();

    SearchCurrentWordBackwards.prototype.backwards = true;

    return SearchCurrentWordBackwards;

  })(SearchCurrentWord);

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL2xpYi9tb3Rpb24tc2VhcmNoLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0xBQUE7SUFBQTs7Ozs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLE1BQXdFLE9BQUEsQ0FBUSxTQUFSLENBQXhFLEVBQUMscUNBQUQsRUFBa0IsaUVBQWxCLEVBQWlEOztFQUNqRCxXQUFBLEdBQWMsT0FBQSxDQUFRLGdCQUFSOztFQUNkLE1BQUEsR0FBUyxPQUFBLENBQVEsUUFBUixDQUFpQixDQUFDLFFBQWxCLENBQTJCLFFBQTNCOztFQUVIOzs7Ozs7O0lBQ0osVUFBQyxDQUFBLE1BQUQsQ0FBUSxLQUFSOzt5QkFDQSxJQUFBLEdBQU07O3lCQUNOLFNBQUEsR0FBVzs7eUJBQ1gsU0FBQSxHQUFXOzt5QkFDWCxtQkFBQSxHQUFxQjs7eUJBQ3JCLFlBQUEsR0FBYzs7eUJBQ2QsbUJBQUEsR0FBcUI7O3lCQUNyQixhQUFBLEdBQWU7O3lCQUNmLHVCQUFBLEdBQXlCOzt5QkFFekIsV0FBQSxHQUFhLFNBQUE7YUFDWCxJQUFDLENBQUE7SUFEVTs7eUJBR2IsbUJBQUEsR0FBcUIsU0FBQTthQUNuQixJQUFDLEVBQUEsVUFBQSxFQUFELENBQVksUUFBWixDQUFBLElBQTBCLENBQUksSUFBQyxDQUFBLFFBQS9CLElBQTRDLElBQUMsQ0FBQSxTQUFELENBQVcsbUJBQVg7SUFEekI7O3lCQUdyQixVQUFBLEdBQVksU0FBQTtNQUNWLDRDQUFBLFNBQUE7YUFDQSxJQUFDLENBQUEsb0JBQUQsQ0FBc0IsQ0FBQSxTQUFBLEtBQUE7ZUFBQSxTQUFBO2lCQUNwQixLQUFDLENBQUEsTUFBRCxDQUFBO1FBRG9CO01BQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUF0QjtJQUZVOzt5QkFLWixRQUFBLEdB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QUFDLEdBQUQ7QUFDcEUsWUFBQTtRQURzRSxtQkFBTztRQUM3RSxJQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsYUFBVixDQUF3QixLQUF4QixDQUFIO1VBQ0UsS0FBQSxHQUFRO2lCQUNSLElBQUEsQ0FBQSxFQUZGOztNQURvRSxDQUF0RTthQUlBO0lBWnlCOzs7O0tBdkJHOztFQXFDMUI7Ozs7Ozs7SUFDSiwwQkFBQyxDQUFBLE1BQUQsQ0FBQTs7eUNBQ0EsU0FBQSxHQUFXOzs7O0tBRjRCO0FBck96QyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICd1bmRlcnNjb3JlLXBsdXMnXG5cbntzYXZlRWRpdG9yU3RhdGUsIGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yLCBzZWFyY2hCeVByb2plY3RGaW5kfSA9IHJlcXVpcmUgJy4vdXRpbHMnXG5TZWFyY2hNb2RlbCA9IHJlcXVpcmUgJy4vc2VhcmNoLW1vZGVsJ1xuTW90aW9uID0gcmVxdWlyZSgnLi9iYXNlJykuZ2V0Q2xhc3MoJ01vdGlvbicpXG5cbmNsYXNzIFNlYXJjaEJhc2UgZXh0ZW5kcyBNb3Rpb25cbiAgQGV4dGVuZChmYWxzZSlcbiAganVtcDogdHJ1ZVxuICBiYWNrd2FyZHM6IGZhbHNlXG4gIHVzZVJlZ2V4cDogdHJ1ZVxuICBjYXNlU2Vuc2l0aXZpdHlLaW5kOiBudWxsXG4gIGxhbmRpbmdQb2ludDogbnVsbCAjIFsnc3RhcnQnIG9yICdlbmQnXVxuICBkZWZhdWx0TGFuZGluZ1BvaW50OiAnc3RhcnQnICMgWydzdGFydCcgb3IgJ2VuZCddXG4gIHJlbGF0aXZlSW5kZXg6IG51bGxcbiAgdXBkYXRlbGFzdFNlYXJjaFBhdHRlcm46IHRydWVcblxuICBpc0JhY2t3YXJkczogLT5cbiAgICBAYmFja3dhcmRzXG5cbiAgaXNJbmNyZW1lbnRhbFNlYXJjaDogLT5cbiAgICBAaW5zdGFuY2VvZignU2VhcmNoJykgYW5kIG5vdCBAcmVwZWF0ZWQgYW5kIEBnZXRDb25maWcoJ2luY3JlbWVudGFsU2VhcmNoJylcblxuICBpbml0aWFsaXplOiAtPlxuICAgIHN1cGVyXG4gICAgQG9uRGlkRmluaXNoT3BlcmF0aW9uID0+XG4gICAgICBAZmluaXNoKClcblxuICBnZXRDb3VudDogLT5cbiAgICBjb3VudCA9IHN1cGVyXG4gICAgaWYgQGlzQmFja3dhcmRzKClcbiAgICAgIC1jb3VudFxuICAgIGVsc2VcbiAgICAgIGNvdW50XG5cbiAgZmluaXNoOiAtPlxuICAgIGlmIEBpc0luY3JlbWVudGFsU2VhcmNoKCkgYW5kIEBnZXRDb25maWcoJ3Nob3dIb3ZlclNlYXJjaENvdW50ZXInKVxuICAgICAgQHZpbVN0YXRlLmhvdmVyU2VhcmNoQ291bnRlci5yZXNldCgpXG4gICAgQHJlbGF0aXZlSW5kZXggPSBudWxsXG4gICAgQHNlYXJjaE1vZGVsPy5kZXN0cm95KClcbiAgICBAc2VhcmNoTW9kZWwgPSBudWxsXG5cbiAgZ2V0TGFuZGluZ1BvaW50OiAtPlxuICAgIEBsYW5kaW5nUG9pbnQgPz0gQGRlZmF1bHRMYW5kaW5nUG9pbnRcblxuICBnZXRQb2ludDogKGN1cnNvcikgLT5cbiAgICBpZiBAc2VhcmNoTW9kZWw/XG4gICAgICBAcmVsYXRpdmVJbmRleCA9IEBnZXRDb3VudCgpICsgQHNlYXJjaE1vZGVsLmdldFJlbGF0aXZlSW5kZXgoKVxuICAgIGVsc2VcbiAgICAgIEByZWxhdGl2ZUluZGV4ID89IEBnZXRDb3VudCgpXG5cbiAgICBpZiByYW5nZSA9IEBzZWFyY2goY3Vyc29yLCBAaW5wdXQsIEByZWxhdGl2ZUluZGV4KVxuICAgICAgcG9pbnQgPSByYW5nZVtAZ2V0TGFuZGluZ1BvaW50KCldXG5cbiAgICBAc2VhcmNoTW9kZWwuZGVzdHJveSgpXG4gICAgQHNlYXJjaE1vZGVsID0gbnVsbFxuXG4gICAgcG9pbnRcblxuICBtb3ZlQ3Vyc29yOiAoY3Vyc29yKSAtPlxuICAgIGlucHV0ID0gQGlucHV0XG4gICAgcmV0dXJuIHVubGVzcyBpbnB1dFxuXG4gICAgaWYgcG9pbnQgPSBAZ2V0UG9pbnQoY3Vyc29yKVxuICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50LCBhdXRvc2Nyb2xsOiBmYWxzZSlcblxuICAgIHVubGVzcyBAcmVwZWF0ZWRcbiAgICAgIEBnbG9iYWxTdGF0ZS5zZXQoJ2N1cnJlbnRTZWFyY2gnLCB0aGlzKVxuICAgICAgQHZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZShpbnB1dClcblxuICAgIGlmIEB1cGRhdGVsYXN0U2VhcmNoUGF0dGVyblxuICAgICAgQGdsb2JhbFN0YXRlLnNldCgnbGFzdFNlYXJjaFBhdHRlcm4nLCBAZ2V0UGF0dGVybihpbnB1dCkpXG5cbiAgZ2V0U2VhcmNoTW9kZWw6IC0+XG4gICAgQHNlYXJjaE1vZGVsID89IG5ldyBTZWFyY2hNb2RlbChAdmltU3RhdGUsIGluY3JlbWVudGFsU2VhcmNoOiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpKVxuXG4gIHNlYXJjaDogKGN1cnNvciwgaW5wdXQsIHJlbGF0aXZlSW5kZXgpIC0+XG4gICAgc2VhcmNoTW9kZWwgPSBAZ2V0U2VhcmNoTW9kZWwoKVxuICAgIGlmIGlucHV0XG4gICAgICBmcm9tUG9pbnQgPSBAZ2V0QnVmZmVyUG9zaXRpb25Gb3JDdXJzb3IoY3Vyc29yKVxuICAgICAgcmV0dXJuIHNlYXJjaE1vZGVsLnNlYXJjaChmcm9tUG9pbnQsIEBnZXRQYXR0ZXJuKGlucHV0KSwgcmVsYXRpdmVJbmRleClcbiAgICBlbHNlXG4gICAgICBAdmltU3RhdGUuaG92ZXJTZWFyY2hDb3VudGVyLnJlc2V0KClcbiAgICAgIHNlYXJjaE1vZGVsLmNsZWFyTWFya2VycygpXG5cbiMgLywgP1xuIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5jbGFzcyBTZWFyY2ggZXh0ZW5kcyBTZWFyY2hCYXNlXG4gIEBleHRlbmQoKVxuICBjYXNlU2Vuc2l0aXZpdHlLaW5kOiBcIlNlYXJjaFwiXG4gIHJlcXVpcmVJbnB1dDogdHJ1ZVxuXG4gIGluaXRpYWxpemU6IC0+XG4gICAgc3VwZXJcbiAgICByZXR1cm4gaWYgQGlzQ29tcGxldGUoKSAjIFdoZW4gcmVwZWF0ZWQsIG5vIG5lZWQgdG8gZ2V0IHVzZXIgaW5wdXRcblxuICAgIGlmIEBpc0luY3JlbWVudGFsU2VhcmNoKClcbiAgICAgIEByZXN0b3JlRWRpdG9yU3RhdGUgPSBzYXZlRWRpdG9yU3RhdGUoQGVkaXRvcilcbiAgICAgIEBvbkRpZENvbW1hbmRTZWFyY2goQGhhbmRsZUNvbW1hbmRFdmVudC5iaW5kKHRoaXMpKVxuXG4gICAgQG9uRGlkQ29uZmlybVNlYXJjaChAaGFuZGxlQ29uZmlybVNlYXJjaC5iaW5kKHRoaXMpKVxuICAgIEBvbkRpZENhbmNlbFNlYXJjaChAaGFuZGxlQ2FuY2VsU2VhcmNoLmJpbmQodGhpcykpXG4gICAgQG9uRGlkQ2hhbmdlU2VhcmNoKEBoYW5kbGVDaGFuZ2VTZWFyY2guYmluZCh0aGlzKSlcblxuICAgIEBmb2N1c1NlYXJjaElucHV0RWRpdG9yKClcblxuICBmb2N1c1NlYXJjaElucHV0RWRpdG9yOiAtPlxuICAgIGNsYXNzTGlzdCA9IFtdXG4gICAgY2xhc3NMaXN0LnB1c2goJ2JhY2t3YXJkcycpIGlmIEBiYWNrd2FyZHNcbiAgICBAdmltU3RhdGUuc2VhcmNoSW5wdXQuZm9jdXMoe2NsYXNzTGlzdH0pXG5cbiAgaGFuZGxlQ29tbWFuZEV2ZW50OiAoY29tbWFuZEV2ZW50KSAtPlxuICAgIHJldHVybiB1bmxlc3MgY29tbWFuZEV2ZW50LmlucHV0XG4gICAgc3dpdGNoIGNvbW1hbmRFdmVudC5uYW1lXG4gICAgICB3aGVuICd2aXNpdCdcbiAgICAgICAge2RpcmVjdGlvbn0gPSBjb21tYW5kRXZlbnRcbiAgICAgICAgaWYgQGlzQmFja3dhcmRzKCkgYW5kIEBnZXRDb25maWcoJ2luY3JlbWVudGFsU2VhcmNoVmlzaXREaXJlY3Rpb24nKSBpcyAncmVsYXRpdmUnXG4gICAgICAgICAgZGlyZWN0aW9uID0gc3dpdGNoIGRpcmVjdGlvblxuICAgICAgICAgICAgd2hlbiAnbmV4dCcgdGhlbiAncHJldidcbiAgICAgICAgICAgIHdoZW4gJ3ByZXYnIHRoZW4gJ25leHQnXG5cbiAgICAgICAgc3dpdGNoIGRpcmVjdGlvblxuICAgICAgICAgIHdoZW4gJ25leHQnIHRoZW4gQGdldFNlYXJjaE1vZGVsKCkudmlzaXQoKzEpXG4gICAgICAgICAgd2hlbiAncHJldicgdGhlbiBAZ2V0U2VhcmNoTW9kZWwoKS52aXNpdCgtMSlcblxuICAgICAgd2hlbiAnb2NjdXJyZW5jZSdcbiAgICAgICAge29wZXJhdGlvbiwgaW5wdXR9ID0gY29tbWFuZEV2ZW50XG4gICAgICAgIEB2aW1TdGF0ZS5vY2N1cnJlbmNlTWFuYWdlci5hZGRQYXR0ZXJuKEBnZXRQYXR0ZXJuKGlucHV0KSwgcmVzZXQ6IG9wZXJhdGlvbj8pXG4gICAgICAgIEB2aW1TdGF0ZS5vY2N1cnJlbmNlTWFuYWdlci5zYXZlTGFzdFBhdHRlcm4oKVxuXG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LnNhdmUoaW5wdXQpXG4gICAgICAgIEB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKVxuXG4gICAgICAgIEB2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5ydW4ob3BlcmF0aW9uKSBpZiBvcGVyYXRpb24/XG5cbiAgICAgIHdoZW4gJ3Byb2plY3QtZmluZCdcbiAgICAgICAge2lucHV0fSA9IGNvbW1hbmRFdmVudFxuICAgICAgICBAdmltU3RhdGUuc2VhcmNoSGlzdG9yeS5zYXZlKGlucHV0KVxuICAgICAgICBAdmltU3RhdGUuc2VhcmNoSW5wdXQuY2FuY2VsKClcbiAgICAgICAgc2VhcmNoQnlQcm9qZWN0RmluZChAZWRpdG9yLCBpbnB1dClcblxuICBoYW5kbGVDYW5jZWxTZWFyY2g6IC0+XG4gICAgQHZpbVN0YXRlLnJlc2V0Tm9ybWFsTW9kZSgpIHVubGVzcyBAbW9kZSBpbiBbJ3Zpc3VhbCcsICdpbnNlcnQnXVxuICAgIEByZXN0b3JlRWRpdG9yU3RhdGU/KClcbiAgICBAdmltU3RhdGUucmVzZXQoKVxuICAgIEBmaW5pc2goKVxuXG4gIGlzU2VhcmNoUmVwZWF0Q2hhcmFjdGVyOiAoY2hhcikgLT5cbiAgICBpZiBAaXNJbmNyZW1lbnRhbFNlYXJjaCgpXG4gICAgICBjaGFyIGlzICcnXG4gICAgZWxzZVxuICAgICAgc2VhcmNoQ2hhciA9IGlmIEBpc0JhY2t3YXJkcygpIHRoZW4gJz8nIGVsc2UgJy8nXG4gICAgICBjaGFyIGluIFsnJywgc2VhcmNoQ2hhcl1cblxuICBoYW5kbGVDb25maXJtU2VhcmNoOiAoe0BpbnB1dCwgQGxhbmRpbmdQb2ludH0pID0+XG4gICAgaWYgQGlzU2VhcmNoUmVwZWF0Q2hhcmFjdGVyKEBpbnB1dClcbiAgICAgIEBpbnB1dCA9IEB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5LmdldCgncHJldicpXG4gICAgICBhdG9tLmJlZXAoKSB1bmxlc3MgQGlucHV0XG4gICAgQHByb2Nlc3NPcGVyYXRpb24oKVxuXG4gIGhhbmRsZUNoYW5nZVNlYXJjaDogKGlucHV0KSAtPlxuICAgICMgSWYgaW5wdXQgc3RhcnRzIHdpdGggc3BhY2UsIHJlbW92ZSBmaXJzdCBzcGFjZSBhbmQgZGlzYWJsZSB1c2VSZWdleHAuXG4gICAgaWYgaW5wdXQuc3RhcnRzV2l0aCgnICcpXG4gICAgICBpbnB1dCA9IGlucHV0LnJlcGxhY2UoL14gLywgJycpXG4gICAgICBAdXNlUmVnZXhwID0gZmFsc2VcbiAgICBAdmltU3RhdGUuc2VhcmNoSW5wdXQudXBkYXRlT3B0aW9uU2V0dGluZ3Moe0B1c2VSZWdleHB9KVxuXG4gICAgaWYgQGlzSW5jcmVtZW50YWxTZWFyY2goKVxuICAgICAgQHNlYXJjaChAZWRpdG9yLmdldExhc3RDdXJzb3IoKSwgaW5wdXQsIEBnZXRDb3VudCgpKVxuXG4gIGdldFBhdHRlcm46ICh0ZXJtKSAtPlxuICAgIG1vZGlmaWVycyA9IGlmIEBpc0Nhc2VTZW5zaXRpdmUodGVybSkgdGhlbiAnZycgZWxzZSAnZ2knXG4gICAgIyBGSVhNRSB0aGlzIHByZXZlbnQgc2VhcmNoIFxcXFxjIGl0c2VsZi5cbiAgICAjIERPTlQgdGhpbmtsZXNzbHkgbWltaWMgcHVyZSBWaW0uIEluc3RlYWQsIHByb3ZpZGUgaWdub3JlY2FzZSBidXR0b24gYW5kIHNob3J0Y3V0LlxuICAgIGlmIHRlcm0uaW5kZXhPZignXFxcXGMnKSA+PSAwXG4gICAgICB0ZXJtID0gdGVybS5yZXBsYWNlKCdcXFxcYycsICcnKVxuICAgICAgbW9kaWZpZXJzICs9ICdpJyB1bmxlc3MgJ2knIGluIG1vZGlmaWVyc1xuXG4gICAgaWYgQHVzZVJlZ2V4cFxuICAgICAgdHJ5XG4gICAgICAgIHJldHVybiBuZXcgUmVnRXhwKHRlcm0sIG1vZGlmaWVycylcbiAgICAgIGNhdGNoXG4gICAgICAgIG51bGxcblxuICAgIG5ldyBSZWdFeHAoXy5lc2NhcGVSZWdFeHAodGVybSksIG1vZGlmaWVycylcblxuY2xhc3MgU2VhcmNoQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoXG4gIEBleHRlbmQoKVxuICBiYWNrd2FyZHM6IHRydWVcblxuIyAqLCAjXG4jIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkIGV4dGVuZHMgU2VhcmNoQmFzZVxuICBAZXh0ZW5kKClcbiAgY2FzZVNlbnNpdGl2aXR5S2luZDogXCJTZWFyY2hDdXJyZW50V29yZFwiXG5cbiAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICBAaW5wdXQgPz0gKFxuICAgICAgd29yZFJhbmdlID0gQGdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2UoKVxuICAgICAgaWYgd29yZFJhbmdlP1xuICAgICAgICBAZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKHdvcmRSYW5nZS5zdGFydClcbiAgICAgICAgQGVkaXRvci5nZXRUZXh0SW5CdWZmZXJSYW5nZSh3b3JkUmFuZ2UpXG4gICAgICBlbHNlXG4gICAgICAgICcnXG4gICAgKVxuICAgIHN1cGVyXG5cbiAgZ2V0UGF0dGVybjogKHRlcm0pIC0+XG4gICAgbW9kaWZpZXJzID0gaWYgQGlzQ2FzZVNlbnNpdGl2ZSh0ZXJtKSB0aGVuICdnJyBlbHNlICdnaSdcbiAgICBwYXR0ZXJuID0gXy5lc2NhcGVSZWdFeHAodGVybSlcbiAgICBpZiAvXFxXLy50ZXN0KHRlcm0pXG4gICAgICBuZXcgUmVnRXhwKFwiI3twYXR0ZXJufVxcXFxiXCIsIG1vZGlmaWVycylcbiAgICBlbHNlXG4gICAgICBuZXcgUmVnRXhwKFwiXFxcXGIje3BhdHRlcm59XFxcXGJcIiwgbW9kaWZpZXJzKVxuXG4gIGdldEN1cnJlbnRXb3JkQnVmZmVyUmFuZ2U6IC0+XG4gICAgY3Vyc29yID0gQGVkaXRvci5nZXRMYXN0Q3Vyc29yKClcbiAgICBwb2ludCA9IGN1cnNvci5nZXRCdWZmZXJQb3NpdGlvbigpXG5cbiAgICBub25Xb3JkQ2hhcmFjdGVycyA9IGdldE5vbldvcmRDaGFyYWN0ZXJzRm9yQ3Vyc29yKGN1cnNvcilcbiAgICB3b3JkUmVnZXggPSBuZXcgUmVnRXhwKFwiW15cXFxccyN7Xy5lc2NhcGVSZWdFeHAobm9uV29yZENoYXJhY3RlcnMpfV0rXCIsICdnJylcblxuICAgIGZvdW5kID0gbnVsbFxuICAgIEBzY2FuRm9yd2FyZCB3b3JkUmVnZXgsIHtmcm9tOiBbcG9pbnQucm93LCAwXSwgYWxsb3dOZXh0TGluZTogZmFsc2V9LCAoe3JhbmdlLCBzdG9wfSkgLT5cbiAgICAgIGlmIHJhbmdlLmVuZC5pc0dyZWF0ZXJUaGFuKHBvaW50KVxuICAgICAgICBmb3VuZCA9IHJhbmdlXG4gICAgICAgIHN0b3AoKVxuICAgIGZvdW5kXG5cbmNsYXNzIFNlYXJjaEN1cnJlbnRXb3JkQmFja3dhcmRzIGV4dGVuZHMgU2VhcmNoQ3VycmVudFdvcmRcbiAgQGV4dGVuZCgpXG4gIGJhY2t3YXJkczogdHJ1ZVxuIl19
