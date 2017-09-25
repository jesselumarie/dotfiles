(function() {
  var TextData, dispatch, getView, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView;

  settings = require('../lib/settings');

  describe("Motion Search", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      jasmine.attachToDOM(getView(atom.workspace));
      return getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
    });
    describe("the / keybinding", function() {
      var pane;
      pane = null;
      beforeEach(function() {
        pane = {
          activate: jasmine.createSpy("activate")
        };
        set({
          text: "abc\ndef\nabc\ndef\n",
          cursor: [0, 0]
        });
        return spyOn(atom.workspace, 'getActivePane').andReturn(pane);
      });
      describe("as a motion", function() {
        it("moves the cursor to the specified search pattern", function() {
          ensure('/ def enter', {
            cursor: [1, 0]
          });
          return expect(pane.activate).toHaveBeenCalled();
        });
        it("loops back around", function() {
          set({
            cursor: [3, 0]
          });
          return ensure('/ def enter', {
            cursor: [1, 0]
          });
        });
        it("uses a valid regex as a regex", function() {
          ensure('/ [abc] enter', {
            cursor: [0, 1]
          });
          return ensure('n', {
            cursor: [0, 2]
          });
        });
        it("uses an invalid regex as a literal string", function() {
          set({
            text: "abc\n[abc]\n"
          });
          ensure('/ [abc enter', {
            cursor: [1, 0]
          });
          return ensure('n', {
            cursor: [1, 0]
          });
        });
        it("uses ? as a literal string", function() {
          set({
            text: "abc\n[a?c?\n"
          });
          ensure('/ ? enter', {
            cursor: [1, 2]
          });
          return ensure('n', {
            cursor: [1, 4]
          });
        });
        it('works with selection in visual mode', function() {
          set({
            text: 'one two three'
          });
          ensure('v / th enter', {
            cursor: [0, 9]
          });
          return ensure('d', {
            text: 'hree'
          });
        });
        it('extends selection when repeating search in visual mode', function() {
          set({
            text: "line1\nline2\nline3"
          });
          ensure('v / line enter', {
            selectedBufferRange: [[0, 0], [1, 1]]
          });
          return ensure('n', {
            selectedBufferRange: [[0, 0], [2, 1]]
          });
        });
        it('searches to the correct column in visual linewise mode', function() {
          return ensure('V / ef enter', {
            selectedText: "abc\ndef\n",
            propertyHead: [1, 1],
            cursor: [2, 0],
            mode: ['visual', 'linewise']
          });
        });
        it('not extend linwise selection if search matches on same line', function() {
          set({
            text: "abc def\ndef\n"
          });
          return ensure('V / ef enter', {
            selectedText: "abc def\n"
          });
        });
        describe("case sensitivity", function() {
          beforeEach(function() {
            return set({
              text: "\nabc\nABC\n",
              cursor: [0, 0]
            });
          });
          it("works in case sensitive mode", function() {
            ensure('/ ABC enter', {
              cursor: [2, 0]
            });
            return ensure('n', {
              cursor: [2, 0]
            });
          });
          it("works in case insensitive mode", function() {
            ensure('/ \\cAbC enter', {
              cursor: [1, 0]
            });
            return ensure('n', {
              cursor: [2, 0]
            });
          });
          it("works in case insensitive mode wherever \\c is", function() {
            ensure('/ AbC\\c enter', {
              cursor: [1, 0]
            });
            return ensure('n', {
              cursor: [2, 0]
            });
          });
          describe("when ignoreCaseForSearch is enabled", function() {
            beforeEach(function() {
              return settings.set('ignoreCaseForSearch', true);
            });
            it("ignore case when search [case-1]", function() {
              ensure('/ abc enter', {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
            return it("ignore case when search [case-2]", function() {
              ensure('/ ABC enter', {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
          });
          return describe("when useSmartcaseForSearch is enabled", function() {
            beforeEach(function() {
              return settings.set('useSmartcaseForSearch', true);
            });
            it("ignore case when searh term includes A-Z", function() {
              ensure('/ ABC enter', {
                cursor: [2, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
            it("ignore case when searh term NOT includes A-Z regardress of `ignoreCaseForSearch`", function() {
              settings.set('ignoreCaseForSearch', false);
              ensure('/ abc enter', {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
            return it("ignore case when searh term NOT includes A-Z regardress of `ignoreCaseForSearch`", function() {
              settings.set('ignoreCaseForSearch', true);
              ensure('/ abc enter', {
                cursor: [1, 0]
              });
              return ensure('n', {
                cursor: [2, 0]
              });
            });
          });
        });
        describe("repeating", function() {
          return it("does nothing with no search history", function() {
            set({
              cursor: [0, 0]
            });
            ensure('n', {
              cursor: [0, 0]
            });
            set({
              cursor: [1, 1]
            });
            return ensure('n', {
              cursor: [1, 1]
            });
          });
        });
        describe("repeating with search history", function() {
          beforeEach(function() {
            return keystroke('/ def enter');
          });
          it("repeats previous search with /<enter>", function() {
            return ensure('/  enter', {
              cursor: [3, 0]
            });
          });
          describe("non-incrementalSearch only feature", function() {
            beforeEach(function() {
              return settings.set("incrementalSearch", false);
            });
            return it("repeats previous search with //", function() {
              return ensure('/ / enter', {
                cursor: [3, 0]
              });
            });
          });
          describe("the n keybinding", function() {
            return it("repeats the last search", function() {
              return ensure('n', {
                cursor: [3, 0]
              });
            });
          });
          return describe("the N keybinding", function() {
            return it("repeats the last search backwards", function() {
              set({
                cursor: [0, 0]
              });
              ensure('N', {
                cursor: [3, 0]
              });
              return ensure('N', {
                cursor: [1, 0]
              });
            });
          });
        });
        return describe("composing", function() {
          it("composes with operators", function() {
            return ensure('d / def enter', {
              text: "def\nabc\ndef\n"
            });
          });
          return it("repeats correctly with operators", function() {
            ensure('d / def enter', {
              text: "def\nabc\ndef\n"
            });
            return ensure('.', {
              text: "def\n"
            });
          });
        });
      });
      describe("when reversed as ?", function() {
        it("moves the cursor backwards to the specified search pattern", function() {
          return ensure('? def enter', {
            cursor: [3, 0]
          });
        });
        it("accepts / as a literal search pattern", function() {
          set({
            text: "abc\nd/f\nabc\nd/f\n",
            cursor: [0, 0]
          });
          ensure('? / enter', {
            cursor: [3, 1]
          });
          return ensure('? / enter', {
            cursor: [1, 1]
          });
        });
        return describe("repeating", function() {
          beforeEach(function() {
            return keystroke('? def enter');
          });
          it("repeats previous search as reversed with ?<enter>", function() {
            return ensure("? enter", {
              cursor: [1, 0]
            });
          });
          describe("non-incrementalSearch only feature", function() {
            beforeEach(function() {
              return settings.set("incrementalSearch", false);
            });
            return it("repeats previous search as reversed with ??", function() {
              return ensure('? ? enter', {
                cursor: [1, 0]
              });
            });
          });
          describe('the n keybinding', function() {
            return it("repeats the last search backwards", function() {
              set({
                cursor: [0, 0]
              });
              return ensure('n', {
                cursor: [3, 0]
              });
            });
          });
          return describe('the N keybinding', function() {
            return it("repeats the last search forwards", function() {
              set({
                cursor: [0, 0]
              });
              return ensure('N', {
                cursor: [1, 0]
              });
            });
          });
        });
      });
      describe("using search history", function() {
        var ensureInputEditor, inputEditor;
        inputEditor = null;
        ensureInputEditor = function(command, arg) {
          var text;
          text = arg.text;
          dispatch(inputEditor, command);
          return expect(inputEditor.getModel().getText()).toEqual(text);
        };
        beforeEach(function() {
          ensure('/ def enter', {
            cursor: [1, 0]
          });
          ensure('/ abc enter', {
            cursor: [2, 0]
          });
          return inputEditor = vimState.searchInput.editorElement;
        });
        it("allows searching history in the search field", function() {
          keystroke('/');
          ensureInputEditor('core:move-up', {
            text: 'abc'
          });
          ensureInputEditor('core:move-up', {
            text: 'def'
          });
          return ensureInputEditor('core:move-up', {
            text: 'def'
          });
        });
        return it("resets the search field to empty when scrolling back", function() {
          keystroke('/');
          ensureInputEditor('core:move-up', {
            text: 'abc'
          });
          ensureInputEditor('core:move-up', {
            text: 'def'
          });
          ensureInputEditor('core:move-down', {
            text: 'abc'
          });
          return ensureInputEditor('core:move-down', {
            text: ''
          });
        });
      });
      return describe("highlightSearch", function() {
        var ensureHightlightSearch, textForMarker;
        textForMarker = function(marker) {
          return editor.getTextInBufferRange(marker.getBufferRange());
        };
        ensureHightlightSearch = function(options) {
          var markers, text;
          markers = vimState.highlightSearch.getMarkers();
          if (options.length != null) {
            expect(markers).toHaveLength(options.length);
          }
          if (options.text != null) {
            text = markers.map(function(marker) {
              return textForMarker(marker);
            });
            expect(text).toEqual(options.text);
          }
          if (options.mode != null) {
            return ensure({
              mode: options.mode
            });
          }
        };
        beforeEach(function() {
          jasmine.attachToDOM(getView(atom.workspace));
          settings.set('highlightSearch', true);
          expect(vimState.highlightSearch.hasMarkers()).toBe(false);
          return ensure('/ def enter', {
            cursor: [1, 0]
          });
        });
        describe("clearHighlightSearch command", function() {
          return it("clear highlightSearch marker", function() {
            ensureHightlightSearch({
              length: 2,
              text: ["def", "def"],
              mode: 'normal'
            });
            dispatch(editorElement, 'vim-mode-plus:clear-highlight-search');
            return expect(vimState.highlightSearch.hasMarkers()).toBe(false);
          });
        });
        return describe("clearHighlightSearchOnResetNormalMode", function() {
          describe("when disabled", function() {
            return it("it won't clear highlightSearch", function() {
              settings.set('clearHighlightSearchOnResetNormalMode', false);
              ensureHightlightSearch({
                length: 2,
                text: ["def", "def"],
                mode: 'normal'
              });
              ensure("escape", {
                mode: 'normal'
              });
              return ensureHightlightSearch({
                length: 2,
                text: ["def", "def"],
                mode: 'normal'
              });
            });
          });
          return describe("when enabled", function() {
            return it("it clear highlightSearch on reset-normal-mode", function() {
              settings.set('clearHighlightSearchOnResetNormalMode', true);
              ensureHightlightSearch({
                length: 2,
                text: ["def", "def"],
                mode: 'normal'
              });
              ensure("escape", {
                mode: 'normal'
              });
              expect(vimState.highlightSearch.hasMarkers()).toBe(false);
              return ensure({
                mode: 'normal'
              });
            });
          });
        });
      });
    });
    describe("IncrementalSearch", function() {
      beforeEach(function() {
        return jasmine.attachToDOM(getView(atom.workspace));
      });
      describe("with multiple-cursors", function() {
        beforeEach(function() {
          return set({
            text: "0:    abc\n1:    abc\n2:    abc\n3:    abc",
            cursor: [[0, 0], [1, 0]]
          });
        });
        it("[forward] move each cursor to match", function() {
          return ensure('/ abc enter', {
            cursor: [[0, 6], [1, 6]]
          });
        });
        it("[forward: count specified], move each cursor to match", function() {
          return ensure('2 / abc enter', {
            cursor: [[1, 6], [2, 6]]
          });
        });
        it("[backward] move each cursor to match", function() {
          return ensure('? abc enter', {
            cursor: [[3, 6], [0, 6]]
          });
        });
        return it("[backward: count specified] move each cursor to match", function() {
          return ensure('2 ? abc enter', {
            cursor: [[2, 6], [3, 6]]
          });
        });
      });
      return describe("blank input repeat last search", function() {
        beforeEach(function() {
          return set({
            text: "0:    abc\n1:    abc\n2:    abc\n3:    abc\n4:"
          });
        });
        it("Do nothing when search history is empty", function() {
          set({
            cursor: [2, 1]
          });
          ensure('/  enter', {
            cursor: [2, 1]
          });
          return ensure('?  enter', {
            cursor: [2, 1]
          });
        });
        it("Repeat forward direction", function() {
          set({
            cursor: [0, 0]
          });
          ensure('/ abc enter', {
            cursor: [0, 6]
          });
          ensure('/  enter', {
            cursor: [1, 6]
          });
          return ensure('2 /  enter', {
            cursor: [3, 6]
          });
        });
        return it("Repeat backward direction", function() {
          set({
            cursor: [4, 0]
          });
          ensure('? abc enter', {
            cursor: [3, 6]
          });
          ensure('?  enter', {
            cursor: [2, 6]
          });
          return ensure('2 ?  enter', {
            cursor: [0, 6]
          });
        });
      });
    });
    describe("the * keybinding", function() {
      beforeEach(function() {
        return set({
          text: "abd\n@def\nabd\ndef\n",
          cursor: [0, 0]
        });
      });
      describe("as a motion", function() {
        it("moves cursor to next occurrence of word under cursor", function() {
          return ensure('*', {
            cursor: [2, 0]
          });
        });
        it("repeats with the n key", function() {
          ensure('*', {
            cursor: [2, 0]
          });
          return ensure('n', {
            cursor: [0, 0]
          });
        });
        it("doesn't move cursor unless next occurrence is the exact word (no partial matches)", function() {
          set({
            text: "abc\ndef\nghiabc\njkl\nabcdef",
            cursor: [0, 0]
          });
          return ensure('*', {
            cursor: [0, 0]
          });
        });
        describe("with words that contain 'non-word' characters", function() {
          it("skips non-word-char when picking cursor-word then place cursor to next occurrence of word", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursor: [1, 0]
            });
            return ensure('*', {
              cursor: [3, 1]
            });
          });
          it("doesn't move cursor unless next match has exact word ending", function() {
            set({
              text: "abc\n@def\nabc\n@def1\n",
              cursor: [1, 1]
            });
            return ensure('*', {
              cursor: [1, 1]
            });
          });
          return it("moves cursor to the start of valid word char", function() {
            set({
              text: "abc\ndef\nabc\n@def\n",
              cursor: [1, 0]
            });
            return ensure('*', {
              cursor: [3, 1]
            });
          });
        });
        describe("when cursor is on non-word char column", function() {
          return it("matches only the non-word char", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursor: [1, 0]
            });
            return ensure('*', {
              cursor: [3, 1]
            });
          });
        });
        describe("when cursor is not on a word", function() {
          return it("does a match with the next word", function() {
            set({
              text: "abc\na  @def\n abc\n @def",
              cursor: [1, 1]
            });
            return ensure('*', {
              cursor: [3, 2]
            });
          });
        });
        return describe("when cursor is at EOF", function() {
          return it("doesn't try to do any match", function() {
            set({
              text: "abc\n@def\nabc\n ",
              cursor: [3, 0]
            });
            return ensure('*', {
              cursor: [3, 0]
            });
          });
        });
      });
      return describe("caseSensitivity setting", function() {
        beforeEach(function() {
          return set({
            text: "abc\nABC\nabC\nabc\nABC",
            cursor: [0, 0]
          });
        });
        it("search case sensitively when `ignoreCaseForSearchCurrentWord` is false(=default)", function() {
          expect(settings.get('ignoreCaseForSearchCurrentWord')).toBe(false);
          ensure('*', {
            cursor: [3, 0]
          });
          return ensure('n', {
            cursor: [0, 0]
          });
        });
        it("search case insensitively when `ignoreCaseForSearchCurrentWord` true", function() {
          settings.set('ignoreCaseForSearchCurrentWord', true);
          ensure('*', {
            cursor: [1, 0]
          });
          ensure('n', {
            cursor: [2, 0]
          });
          ensure('n', {
            cursor: [3, 0]
          });
          return ensure('n', {
            cursor: [4, 0]
          });
        });
        return describe("useSmartcaseForSearchCurrentWord is enabled", function() {
          beforeEach(function() {
            return settings.set('useSmartcaseForSearchCurrentWord', true);
          });
          it("search case sensitively when enable and search term includes uppercase", function() {
            set({
              cursor: [1, 0]
            });
            ensure('*', {
              cursor: [4, 0]
            });
            return ensure('n', {
              cursor: [1, 0]
            });
          });
          return it("search case insensitively when enable and search term NOT includes uppercase", function() {
            set({
              cursor: [0, 0]
            });
            ensure('*', {
              cursor: [1, 0]
            });
            ensure('n', {
              cursor: [2, 0]
            });
            ensure('n', {
              cursor: [3, 0]
            });
            return ensure('n', {
              cursor: [4, 0]
            });
          });
        });
      });
    });
    describe("the hash keybinding", function() {
      describe("as a motion", function() {
        it("moves cursor to previous occurrence of word under cursor", function() {
          set({
            text: "abc\n@def\nabc\ndef\n",
            cursor: [2, 1]
          });
          return ensure('#', {
            cursor: [0, 0]
          });
        });
        it("repeats with n", function() {
          set({
            text: "abc\n@def\nabc\ndef\nabc\n",
            cursor: [2, 1]
          });
          ensure('#', {
            cursor: [0, 0]
          });
          ensure('n', {
            cursor: [4, 0]
          });
          return ensure('n', {
            cursor: [2, 0]
          });
        });
        it("doesn't move cursor unless next occurrence is the exact word (no partial matches)", function() {
          set({
            text: "abc\ndef\nghiabc\njkl\nabcdef",
            cursor: [0, 0]
          });
          return ensure('#', {
            cursor: [0, 0]
          });
        });
        describe("with words that containt 'non-word' characters", function() {
          it("moves cursor to next occurrence of word under cursor", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursor: [3, 0]
            });
            return ensure('#', {
              cursor: [1, 1]
            });
          });
          return it("moves cursor to the start of valid word char", function() {
            set({
              text: "abc\n@def\nabc\ndef\n",
              cursor: [3, 0]
            });
            return ensure('#', {
              cursor: [1, 1]
            });
          });
        });
        return describe("when cursor is on non-word char column", function() {
          return it("matches only the non-word char", function() {
            set({
              text: "abc\n@def\nabc\n@def\n",
              cursor: [1, 0]
            });
            return ensure('*', {
              cursor: [3, 1]
            });
          });
        });
      });
      return describe("caseSensitivity setting", function() {
        beforeEach(function() {
          return set({
            text: "abc\nABC\nabC\nabc\nABC",
            cursor: [4, 0]
          });
        });
        it("search case sensitively when `ignoreCaseForSearchCurrentWord` is false(=default)", function() {
          expect(settings.get('ignoreCaseForSearchCurrentWord')).toBe(false);
          ensure('#', {
            cursor: [1, 0]
          });
          return ensure('n', {
            cursor: [4, 0]
          });
        });
        it("search case insensitively when `ignoreCaseForSearchCurrentWord` true", function() {
          settings.set('ignoreCaseForSearchCurrentWord', true);
          ensure('#', {
            cursor: [3, 0]
          });
          ensure('n', {
            cursor: [2, 0]
          });
          ensure('n', {
            cursor: [1, 0]
          });
          return ensure('n', {
            cursor: [0, 0]
          });
        });
        return describe("useSmartcaseForSearchCurrentWord is enabled", function() {
          beforeEach(function() {
            return settings.set('useSmartcaseForSearchCurrentWord', true);
          });
          it("search case sensitively when enable and search term includes uppercase", function() {
            set({
              cursor: [4, 0]
            });
            ensure('#', {
              cursor: [1, 0]
            });
            return ensure('n', {
              cursor: [4, 0]
            });
          });
          return it("search case insensitively when enable and search term NOT includes uppercase", function() {
            set({
              cursor: [0, 0]
            });
            ensure('#', {
              cursor: [4, 0]
            });
            ensure('n', {
              cursor: [3, 0]
            });
            ensure('n', {
              cursor: [2, 0]
            });
            ensure('n', {
              cursor: [1, 0]
            });
            return ensure('n', {
              cursor: [0, 0]
            });
          });
        });
      });
    });
    return describe('the % motion', function() {
      describe("Parenthesis", function() {
        beforeEach(function() {
          return set({
            text: "(___)"
          });
        });
        describe("as operator target", function() {
          beforeEach(function() {
            return set({
              text: "(_(_)_)"
            });
          });
          it('behave inclusively when is at open pair', function() {
            set({
              cursor: [0, 2]
            });
            return ensure('d %', {
              text: "(__)"
            });
          });
          return it('behave inclusively when is at open pair', function() {
            set({
              cursor: [0, 4]
            });
            return ensure('d %', {
              text: "(__)"
            });
          });
        });
        describe("cursor is at pair char", function() {
          it("cursor is at open pair, it move to closing pair", function() {
            set({
              cursor: [0, 0]
            });
            ensure('%', {
              cursor: [0, 4]
            });
            return ensure('%', {
              cursor: [0, 0]
            });
          });
          return it("cursor is at close pair, it move to open pair", function() {
            set({
              cursor: [0, 4]
            });
            ensure('%', {
              cursor: [0, 0]
            });
            return ensure('%', {
              cursor: [0, 4]
            });
          });
        });
        describe("cursor is enclosed by pair", function() {
          beforeEach(function() {
            return set({
              text: "(___)",
              cursor: [0, 2]
            });
          });
          return it("move to open pair", function() {
            return ensure('%', {
              cursor: [0, 0]
            });
          });
        });
        describe("cursor is bofore open pair", function() {
          beforeEach(function() {
            return set({
              text: "__(___)",
              cursor: [0, 0]
            });
          });
          return it("move to open pair", function() {
            return ensure('%', {
              cursor: [0, 6]
            });
          });
        });
        describe("cursor is after close pair", function() {
          beforeEach(function() {
            return set({
              text: "__(___)__",
              cursor: [0, 7]
            });
          });
          return it("fail to move", function() {
            return ensure('%', {
              cursor: [0, 7]
            });
          });
        });
        return describe("multi line", function() {
          beforeEach(function() {
            return set({
              text: "___\n___(__\n___\n___)"
            });
          });
          describe("when open and close pair is not at cursor line", function() {
            it("fail to move", function() {
              set({
                cursor: [0, 0]
              });
              return ensure('%', {
                cursor: [0, 0]
              });
            });
            return it("fail to move", function() {
              set({
                cursor: [2, 0]
              });
              return ensure('%', {
                cursor: [2, 0]
              });
            });
          });
          describe("when open pair is forwarding to cursor in same row", function() {
            return it("move to closing pair", function() {
              set({
                cursor: [1, 0]
              });
              return ensure('%', {
                cursor: [3, 3]
              });
            });
          });
          describe("when cursor position is greater than open pair", function() {
            return it("fail to move", function() {
              set({
                cursor: [1, 4]
              });
              return ensure('%', {
                cursor: [1, 4]
              });
            });
          });
          return describe("when close pair is forwarding to cursor in same row", function() {
            return it("move to closing pair", function() {
              set({
                cursor: [3, 0]
              });
              return ensure('%', {
                cursor: [1, 3]
              });
            });
          });
        });
      });
      describe("CurlyBracket", function() {
        beforeEach(function() {
          return set({
            text: "{___}"
          });
        });
        it("cursor is at open pair, it move to closing pair", function() {
          set({
            cursor: [0, 0]
          });
          ensure('%', {
            cursor: [0, 4]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
        return it("cursor is at close pair, it move to open pair", function() {
          set({
            cursor: [0, 4]
          });
          ensure('%', {
            cursor: [0, 0]
          });
          return ensure('%', {
            cursor: [0, 4]
          });
        });
      });
      describe("SquareBracket", function() {
        beforeEach(function() {
          return set({
            text: "[___]"
          });
        });
        it("cursor is at open pair, it move to closing pair", function() {
          set({
            cursor: [0, 0]
          });
          ensure('%', {
            cursor: [0, 4]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
        return it("cursor is at close pair, it move to open pair", function() {
          set({
            cursor: [0, 4]
          });
          ensure('%', {
            cursor: [0, 0]
          });
          return ensure('%', {
            cursor: [0, 4]
          });
        });
      });
      describe("complex situation", function() {
        beforeEach(function() {
          return set({
            text: "(_____)__{__[___]__}\n_"
          });
        });
        it('move to closing pair which open pair come first', function() {
          set({
            cursor: [0, 7]
          });
          ensure('%', {
            cursor: [0, 19]
          });
          set({
            cursor: [0, 10]
          });
          return ensure('%', {
            cursor: [0, 16]
          });
        });
        return it('enclosing pair is prioritized over forwarding range', function() {
          set({
            cursor: [0, 2]
          });
          return ensure('%', {
            cursor: [0, 0]
          });
        });
      });
      return describe("complex situation with html tag", function() {
        beforeEach(function() {
          return set({
            text: "<div>\n  <span>\n    some text\n  </span>\n</div>"
          });
        });
        return it('move to pair tag only when cursor is on open or close tag but not on AngleBracket(<, >)', function() {
          set({
            cursor: [0, 1]
          });
          ensure('%', {
            cursor: [4, 1]
          });
          set({
            cursor: [0, 2]
          });
          ensure('%', {
            cursor: [4, 1]
          });
          set({
            cursor: [0, 3]
          });
          ensure('%', {
            cursor: [4, 1]
          });
          set({
            cursor: [4, 1]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 2]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 3]
          });
          ensure('%', {
            cursor: [0, 1]
          });
          set({
            cursor: [4, 4]
          });
          return ensure('%', {
            cursor: [0, 1]
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvbW90aW9uLXNlYXJjaC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBNkMsT0FBQSxDQUFRLGVBQVIsQ0FBN0MsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCLHVCQUF4QixFQUFrQzs7RUFDbEMsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsZUFBVCxFQUEwQixTQUFBO0FBQ3hCLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7TUFDVCxPQUFPLENBQUMsV0FBUixDQUFvQixPQUFBLENBQVEsSUFBSSxDQUFDLFNBQWIsQ0FBcEI7YUFDQSxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsSUFBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixjQUFELEVBQU0sb0JBQU4sRUFBYywwQkFBZCxFQUEyQjtNQUhqQixDQUFaO0lBRlMsQ0FBWDtJQU9BLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO0FBQzNCLFVBQUE7TUFBQSxJQUFBLEdBQU87TUFFUCxVQUFBLENBQVcsU0FBQTtRQUNULElBQUEsR0FBTztVQUFDLFFBQUEsRUFBVSxPQUFPLENBQUMsU0FBUixDQUFrQixVQUFsQixDQUFYOztRQUNQLEdBQUEsQ0FDRTtVQUFBLElBQUEsRUFBTSxzQkFBTjtVQU1BLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBTlI7U0FERjtlQVFBLEtBQUEsQ0FBTSxJQUFJLENBQUMsU0FBWCxFQUFzQixlQUF0QixDQUFzQyxDQUFDLFNBQXZDLENBQWlELElBQWpEO01B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Q0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFBb0IsTUFBQSxDQUFPLEdBQVAsRUFBWTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBWjtVQUNwQixHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7aUJBQW9CLE1BQUEsQ0FBTyxHQUFQLEVBQVk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQVo7UUFSd0UsQ0FBOUY7TUFWMEMsQ0FBNUM7SUFoSHVCLENBQXpCO0VBdGdCd0IsQ0FBMUI7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgZGlzcGF0Y2gsIFRleHREYXRhLCBnZXRWaWV3fSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuZGVzY3JpYmUgXCJNb3Rpb24gU2VhcmNoXCIsIC0+XG4gIFtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlLCBlZGl0b3IsIGVkaXRvckVsZW1lbnQsIHZpbVN0YXRlXSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGphc21pbmUuYXR0YWNoVG9ET00oZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpXG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCBfdmltKSAtPlxuICAgICAgdmltU3RhdGUgPSBzdGF0ZSAjIHRvIHJlZmVyIGFzIHZpbVN0YXRlIGxhdGVyLlxuICAgICAge2VkaXRvciwgZWRpdG9yRWxlbWVudH0gPSB2aW1TdGF0ZVxuICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gX3ZpbVxuXG4gIGRlc2NyaWJlIFwidGhlIC8ga2V5YmluZGluZ1wiLCAtPlxuICAgIHBhbmUgPSBudWxsXG5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBwYW5lID0ge2FjdGl2YXRlOiBqYXNtaW5lLmNyZWF0ZVNweShcImFjdGl2YXRlXCIpfVxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIGFiY1xuICAgICAgICAgIGRlZlxuICAgICAgICAgIGFiY1xuICAgICAgICAgIGRlZlxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgc3B5T24oYXRvbS53b3Jrc3BhY2UsICdnZXRBY3RpdmVQYW5lJykuYW5kUmV0dXJuKHBhbmUpXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIHNwZWNpZmllZCBzZWFyY2ggcGF0dGVyblwiLCAtPlxuICAgICAgICBlbnN1cmUgJy8gZGVmIGVudGVyJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZXhwZWN0KHBhbmUuYWN0aXZhdGUpLnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gICAgICBpdCBcImxvb3BzIGJhY2sgYXJvdW5kXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFszLCAwXVxuICAgICAgICBlbnN1cmUgJy8gZGVmIGVudGVyJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJ1c2VzIGEgdmFsaWQgcmVnZXggYXMgYSByZWdleFwiLCAtPlxuICAgICAgICAjIEN5Y2xlIHRocm91Z2ggdGhlICdhYmMnIG9uIHRoZSBmaXJzdCBsaW5lIHdpdGggYSBjaGFyYWN0ZXIgcGF0dGVyblxuICAgICAgICBlbnN1cmUgJy8gW2FiY10gZW50ZXInLCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICBpdCBcInVzZXMgYW4gaW52YWxpZCByZWdleCBhcyBhIGxpdGVyYWwgc3RyaW5nXCIsIC0+XG4gICAgICAgICMgR28gc3RyYWlnaHQgdG8gdGhlIGxpdGVyYWwgW2FiY1xuICAgICAgICBzZXQgdGV4dDogXCJhYmNcXG5bYWJjXVxcblwiXG4gICAgICAgIGVuc3VyZSAnLyBbYWJjIGVudGVyJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJ1c2VzID8gYXMgYSBsaXRlcmFsIHN0cmluZ1wiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCJhYmNcXG5bYT9jP1xcblwiXG4gICAgICAgIGVuc3VyZSAnLyA/IGVudGVyJywgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMSwgNF1cblxuICAgICAgaXQgJ3dvcmtzIHdpdGggc2VsZWN0aW9uIGluIHZpc3VhbCBtb2RlJywgLT5cbiAgICAgICAgc2V0IHRleHQ6ICdvbmUgdHdvIHRocmVlJ1xuICAgICAgICBlbnN1cmUgJ3YgLyB0aCBlbnRlcicsIGN1cnNvcjogWzAsIDldXG4gICAgICAgIGVuc3VyZSAnZCcsIHRleHQ6ICdocmVlJ1xuXG4gICAgICBpdCAnZXh0ZW5kcyBzZWxlY3Rpb24gd2hlbiByZXBlYXRpbmcgc2VhcmNoIGluIHZpc3VhbCBtb2RlJywgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiXCJcIlxuICAgICAgICAgIGxpbmUxXG4gICAgICAgICAgbGluZTJcbiAgICAgICAgICBsaW5lM1xuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGVuc3VyZSAndiAvIGxpbmUgZW50ZXInLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMCwgMF0sIFsxLCAxXV1cbiAgICAgICAgZW5zdXJlICduJyxcbiAgICAgICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzAsIDBdLCBbMiwgMV1dXG5cbiAgICAgIGl0ICdzZWFyY2hlcyB0byB0aGUgY29ycmVjdCBjb2x1bW4gaW4gdmlzdWFsIGxpbmV3aXNlIG1vZGUnLCAtPlxuICAgICAgICBlbnN1cmUgJ1YgLyBlZiBlbnRlcicsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcImFiY1xcbmRlZlxcblwiLFxuICAgICAgICAgIHByb3BlcnR5SGVhZDogWzEsIDFdXG4gICAgICAgICAgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG5cbiAgICAgIGl0ICdub3QgZXh0ZW5kIGxpbndpc2Ugc2VsZWN0aW9uIGlmIHNlYXJjaCBtYXRjaGVzIG9uIHNhbWUgbGluZScsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBhYmMgZGVmXG4gICAgICAgICAgZGVmXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnViAvIGVmIGVudGVyJywgc2VsZWN0ZWRUZXh0OiBcImFiYyBkZWZcXG5cIixcblxuICAgICAgZGVzY3JpYmUgXCJjYXNlIHNlbnNpdGl2aXR5XCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiXFxuYWJjXFxuQUJDXFxuXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgICAgaXQgXCJ3b3JrcyBpbiBjYXNlIHNlbnNpdGl2ZSBtb2RlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICcvIEFCQyBlbnRlcicsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICBpdCBcIndvcmtzIGluIGNhc2UgaW5zZW5zaXRpdmUgbW9kZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnLyBcXFxcY0FiQyBlbnRlcicsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICBpdCBcIndvcmtzIGluIGNhc2UgaW5zZW5zaXRpdmUgbW9kZSB3aGVyZXZlciBcXFxcYyBpc1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnLyBBYkNcXFxcYyBlbnRlcicsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICBkZXNjcmliZSBcIndoZW4gaWdub3JlQ2FzZUZvclNlYXJjaCBpcyBlbmFibGVkXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0dGluZ3Muc2V0ICdpZ25vcmVDYXNlRm9yU2VhcmNoJywgdHJ1ZVxuXG4gICAgICAgICAgaXQgXCJpZ25vcmUgY2FzZSB3aGVuIHNlYXJjaCBbY2FzZS0xXVwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlICcvIGFiYyBlbnRlcicsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICAgICAgaXQgXCJpZ25vcmUgY2FzZSB3aGVuIHNlYXJjaCBbY2FzZS0yXVwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlICcvIEFCQyBlbnRlcicsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiB1c2VTbWFydGNhc2VGb3JTZWFyY2ggaXMgZW5hYmxlZFwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHNldHRpbmdzLnNldCAndXNlU21hcnRjYXNlRm9yU2VhcmNoJywgdHJ1ZVxuXG4gICAgICAgICAgaXQgXCJpZ25vcmUgY2FzZSB3aGVuIHNlYXJoIHRlcm0gaW5jbHVkZXMgQS1aXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJy8gQUJDIGVudGVyJywgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgICAgICBpdCBcImlnbm9yZSBjYXNlIHdoZW4gc2VhcmggdGVybSBOT1QgaW5jbHVkZXMgQS1aIHJlZ2FyZHJlc3Mgb2YgYGlnbm9yZUNhc2VGb3JTZWFyY2hgXCIsIC0+XG4gICAgICAgICAgICBzZXR0aW5ncy5zZXQgJ2lnbm9yZUNhc2VGb3JTZWFyY2gnLCBmYWxzZSAjIGRlZmF1bHRcbiAgICAgICAgICAgIGVuc3VyZSAnLyBhYmMgZW50ZXInLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgICAgIGl0IFwiaWdub3JlIGNhc2Ugd2hlbiBzZWFyaCB0ZXJtIE5PVCBpbmNsdWRlcyBBLVogcmVnYXJkcmVzcyBvZiBgaWdub3JlQ2FzZUZvclNlYXJjaGBcIiwgLT5cbiAgICAgICAgICAgIHNldHRpbmdzLnNldCAnaWdub3JlQ2FzZUZvclNlYXJjaCcsIHRydWUgIyBkZWZhdWx0XG4gICAgICAgICAgICBlbnN1cmUgJy8gYWJjIGVudGVyJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwicmVwZWF0aW5nXCIsIC0+XG4gICAgICAgIGl0IFwiZG9lcyBub3RoaW5nIHdpdGggbm8gc2VhcmNoIGhpc3RvcnlcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzEsIDFdXG5cbiAgICAgIGRlc2NyaWJlIFwicmVwZWF0aW5nIHdpdGggc2VhcmNoIGhpc3RvcnlcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnLyBkZWYgZW50ZXInXG5cbiAgICAgICAgaXQgXCJyZXBlYXRzIHByZXZpb3VzIHNlYXJjaCB3aXRoIC88ZW50ZXI+XCIsIC0+XG4gICAgICAgICAgZW5zdXJlICcvICBlbnRlcicsIGN1cnNvcjogWzMsIDBdXG5cbiAgICAgICAgZGVzY3JpYmUgXCJub24taW5jcmVtZW50YWxTZWFyY2ggb25seSBmZWF0dXJlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0dGluZ3Muc2V0KFwiaW5jcmVtZW50YWxTZWFyY2hcIiwgZmFsc2UpXG5cbiAgICAgICAgICBpdCBcInJlcGVhdHMgcHJldmlvdXMgc2VhcmNoIHdpdGggLy9cIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSAnLyAvIGVudGVyJywgY3Vyc29yOiBbMywgMF1cblxuICAgICAgICBkZXNjcmliZSBcInRoZSBuIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgICAgICBpdCBcInJlcGVhdHMgdGhlIGxhc3Qgc2VhcmNoXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFszLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwidGhlIE4ga2V5YmluZGluZ1wiLCAtPlxuICAgICAgICAgIGl0IFwicmVwZWF0cyB0aGUgbGFzdCBzZWFyY2ggYmFja3dhcmRzXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnTicsIGN1cnNvcjogWzMsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ04nLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBkZXNjcmliZSBcImNvbXBvc2luZ1wiLCAtPlxuICAgICAgICBpdCBcImNvbXBvc2VzIHdpdGggb3BlcmF0b3JzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIC8gZGVmIGVudGVyJywgdGV4dDogXCJkZWZcXG5hYmNcXG5kZWZcXG5cIlxuXG4gICAgICAgIGl0IFwicmVwZWF0cyBjb3JyZWN0bHkgd2l0aCBvcGVyYXRvcnNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgLyBkZWYgZW50ZXInLCB0ZXh0OiBcImRlZlxcbmFiY1xcbmRlZlxcblwiXG4gICAgICAgICAgZW5zdXJlICcuJywgdGV4dDogXCJkZWZcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHJldmVyc2VkIGFzID9cIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciBiYWNrd2FyZHMgdG8gdGhlIHNwZWNpZmllZCBzZWFyY2ggcGF0dGVyblwiLCAtPlxuICAgICAgICBlbnN1cmUgJz8gZGVmIGVudGVyJywgY3Vyc29yOiBbMywgMF1cblxuICAgICAgaXQgXCJhY2NlcHRzIC8gYXMgYSBsaXRlcmFsIHNlYXJjaCBwYXR0ZXJuXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiYWJjXFxuZC9mXFxuYWJjXFxuZC9mXFxuXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJz8gLyBlbnRlcicsIGN1cnNvcjogWzMsIDFdXG4gICAgICAgIGVuc3VyZSAnPyAvIGVudGVyJywgY3Vyc29yOiBbMSwgMV1cblxuICAgICAgZGVzY3JpYmUgXCJyZXBlYXRpbmdcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnPyBkZWYgZW50ZXInXG5cbiAgICAgICAgaXQgXCJyZXBlYXRzIHByZXZpb3VzIHNlYXJjaCBhcyByZXZlcnNlZCB3aXRoID88ZW50ZXI+XCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiPyBlbnRlclwiLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwibm9uLWluY3JlbWVudGFsU2VhcmNoIG9ubHkgZmVhdHVyZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHNldHRpbmdzLnNldChcImluY3JlbWVudGFsU2VhcmNoXCIsIGZhbHNlKVxuXG4gICAgICAgICAgaXQgXCJyZXBlYXRzIHByZXZpb3VzIHNlYXJjaCBhcyByZXZlcnNlZCB3aXRoID8/XCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJz8gPyBlbnRlcicsIGN1cnNvcjogWzEsIDBdXG5cbiAgICAgICAgZGVzY3JpYmUgJ3RoZSBuIGtleWJpbmRpbmcnLCAtPlxuICAgICAgICAgIGl0IFwicmVwZWF0cyB0aGUgbGFzdCBzZWFyY2ggYmFja3dhcmRzXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzMsIDBdXG5cbiAgICAgICAgZGVzY3JpYmUgJ3RoZSBOIGtleWJpbmRpbmcnLCAtPlxuICAgICAgICAgIGl0IFwicmVwZWF0cyB0aGUgbGFzdCBzZWFyY2ggZm9yd2FyZHNcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgZW5zdXJlICdOJywgY3Vyc29yOiBbMSwgMF1cblxuICAgIGRlc2NyaWJlIFwidXNpbmcgc2VhcmNoIGhpc3RvcnlcIiwgLT5cbiAgICAgIGlucHV0RWRpdG9yID0gbnVsbFxuICAgICAgZW5zdXJlSW5wdXRFZGl0b3IgPSAoY29tbWFuZCwge3RleHR9KSAtPlxuICAgICAgICBkaXNwYXRjaChpbnB1dEVkaXRvciwgY29tbWFuZClcbiAgICAgICAgZXhwZWN0KGlucHV0RWRpdG9yLmdldE1vZGVsKCkuZ2V0VGV4dCgpKS50b0VxdWFsKHRleHQpXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgZW5zdXJlICcvIGRlZiBlbnRlcicsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgIGVuc3VyZSAnLyBhYmMgZW50ZXInLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBpbnB1dEVkaXRvciA9IHZpbVN0YXRlLnNlYXJjaElucHV0LmVkaXRvckVsZW1lbnRcblxuICAgICAgaXQgXCJhbGxvd3Mgc2VhcmNoaW5nIGhpc3RvcnkgaW4gdGhlIHNlYXJjaCBmaWVsZFwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJy8nXG4gICAgICAgIGVuc3VyZUlucHV0RWRpdG9yICdjb3JlOm1vdmUtdXAnLCB0ZXh0OiAnYWJjJ1xuICAgICAgICBlbnN1cmVJbnB1dEVkaXRvciAnY29yZTptb3ZlLXVwJywgdGV4dDogJ2RlZidcbiAgICAgICAgZW5zdXJlSW5wdXRFZGl0b3IgJ2NvcmU6bW92ZS11cCcsIHRleHQ6ICdkZWYnXG5cbiAgICAgIGl0IFwicmVzZXRzIHRoZSBzZWFyY2ggZmllbGQgdG8gZW1wdHkgd2hlbiBzY3JvbGxpbmcgYmFja1wiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJy8nXG4gICAgICAgIGVuc3VyZUlucHV0RWRpdG9yICdjb3JlOm1vdmUtdXAnLCB0ZXh0OiAnYWJjJ1xuICAgICAgICBlbnN1cmVJbnB1dEVkaXRvciAnY29yZTptb3ZlLXVwJywgdGV4dDogJ2RlZidcbiAgICAgICAgZW5zdXJlSW5wdXRFZGl0b3IgJ2NvcmU6bW92ZS1kb3duJywgdGV4dDogJ2FiYydcbiAgICAgICAgZW5zdXJlSW5wdXRFZGl0b3IgJ2NvcmU6bW92ZS1kb3duJywgdGV4dDogJydcblxuICAgIGRlc2NyaWJlIFwiaGlnaGxpZ2h0U2VhcmNoXCIsIC0+XG4gICAgICB0ZXh0Rm9yTWFya2VyID0gKG1hcmtlcikgLT5cbiAgICAgICAgZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKG1hcmtlci5nZXRCdWZmZXJSYW5nZSgpKVxuXG4gICAgICBlbnN1cmVIaWdodGxpZ2h0U2VhcmNoID0gKG9wdGlvbnMpIC0+XG4gICAgICAgIG1hcmtlcnMgPSB2aW1TdGF0ZS5oaWdobGlnaHRTZWFyY2guZ2V0TWFya2VycygpXG4gICAgICAgIGlmIG9wdGlvbnMubGVuZ3RoP1xuICAgICAgICAgIGV4cGVjdChtYXJrZXJzKS50b0hhdmVMZW5ndGgob3B0aW9ucy5sZW5ndGgpXG5cbiAgICAgICAgaWYgb3B0aW9ucy50ZXh0P1xuICAgICAgICAgIHRleHQgPSBtYXJrZXJzLm1hcCAobWFya2VyKSAtPiB0ZXh0Rm9yTWFya2VyKG1hcmtlcilcbiAgICAgICAgICBleHBlY3QodGV4dCkudG9FcXVhbChvcHRpb25zLnRleHQpXG5cbiAgICAgICAgaWYgb3B0aW9ucy5tb2RlP1xuICAgICAgICAgIGVuc3VyZSB7bW9kZTogb3B0aW9ucy5tb2RlfVxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpXG4gICAgICAgIHNldHRpbmdzLnNldCgnaGlnaGxpZ2h0U2VhcmNoJywgdHJ1ZSlcbiAgICAgICAgZXhwZWN0KHZpbVN0YXRlLmhpZ2hsaWdodFNlYXJjaC5oYXNNYXJrZXJzKCkpLnRvQmUoZmFsc2UpXG4gICAgICAgIGVuc3VyZSAnLyBkZWYgZW50ZXInLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBkZXNjcmliZSBcImNsZWFySGlnaGxpZ2h0U2VhcmNoIGNvbW1hbmRcIiwgLT5cbiAgICAgICAgaXQgXCJjbGVhciBoaWdobGlnaHRTZWFyY2ggbWFya2VyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlSGlnaHRsaWdodFNlYXJjaCBsZW5ndGg6IDIsIHRleHQ6IFtcImRlZlwiLCBcImRlZlwiXSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBkaXNwYXRjaChlZGl0b3JFbGVtZW50LCAndmltLW1vZGUtcGx1czpjbGVhci1oaWdobGlnaHQtc2VhcmNoJylcbiAgICAgICAgICBleHBlY3QodmltU3RhdGUuaGlnaGxpZ2h0U2VhcmNoLmhhc01hcmtlcnMoKSkudG9CZShmYWxzZSlcblxuICAgICAgZGVzY3JpYmUgXCJjbGVhckhpZ2hsaWdodFNlYXJjaE9uUmVzZXROb3JtYWxNb2RlXCIsIC0+XG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiBkaXNhYmxlZFwiLCAtPlxuICAgICAgICAgIGl0IFwiaXQgd29uJ3QgY2xlYXIgaGlnaGxpZ2h0U2VhcmNoXCIsIC0+XG4gICAgICAgICAgICBzZXR0aW5ncy5zZXQoJ2NsZWFySGlnaGxpZ2h0U2VhcmNoT25SZXNldE5vcm1hbE1vZGUnLCBmYWxzZSlcbiAgICAgICAgICAgIGVuc3VyZUhpZ2h0bGlnaHRTZWFyY2ggbGVuZ3RoOiAyLCB0ZXh0OiBbXCJkZWZcIiwgXCJkZWZcIl0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICBlbnN1cmUgXCJlc2NhcGVcIiwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICAgIGVuc3VyZUhpZ2h0bGlnaHRTZWFyY2ggbGVuZ3RoOiAyLCB0ZXh0OiBbXCJkZWZcIiwgXCJkZWZcIl0sIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgICAgZGVzY3JpYmUgXCJ3aGVuIGVuYWJsZWRcIiwgLT5cbiAgICAgICAgICBpdCBcIml0IGNsZWFyIGhpZ2hsaWdodFNlYXJjaCBvbiByZXNldC1ub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgICAgICAgc2V0dGluZ3Muc2V0KCdjbGVhckhpZ2hsaWdodFNlYXJjaE9uUmVzZXROb3JtYWxNb2RlJywgdHJ1ZSlcbiAgICAgICAgICAgIGVuc3VyZUhpZ2h0bGlnaHRTZWFyY2ggbGVuZ3RoOiAyLCB0ZXh0OiBbXCJkZWZcIiwgXCJkZWZcIl0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICBlbnN1cmUgXCJlc2NhcGVcIiwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5oaWdobGlnaHRTZWFyY2guaGFzTWFya2VycygpKS50b0JlKGZhbHNlKVxuICAgICAgICAgICAgZW5zdXJlIG1vZGU6ICdub3JtYWwnXG5cbiAgZGVzY3JpYmUgXCJJbmNyZW1lbnRhbFNlYXJjaFwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZ2V0VmlldyhhdG9tLndvcmtzcGFjZSkpXG5cbiAgICBkZXNjcmliZSBcIndpdGggbXVsdGlwbGUtY3Vyc29yc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAwOiAgICBhYmNcbiAgICAgICAgICAxOiAgICBhYmNcbiAgICAgICAgICAyOiAgICBhYmNcbiAgICAgICAgICAzOiAgICBhYmNcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgICAgaXQgXCJbZm9yd2FyZF0gbW92ZSBlYWNoIGN1cnNvciB0byBtYXRjaFwiLCAtPlxuICAgICAgICBlbnN1cmUgJy8gYWJjIGVudGVyJywgY3Vyc29yOiBbWzAsIDZdLCBbMSwgNl1dXG4gICAgICBpdCBcIltmb3J3YXJkOiBjb3VudCBzcGVjaWZpZWRdLCBtb3ZlIGVhY2ggY3Vyc29yIHRvIG1hdGNoXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnMiAvIGFiYyBlbnRlcicsIGN1cnNvcjogW1sxLCA2XSwgWzIsIDZdXVxuXG4gICAgICBpdCBcIltiYWNrd2FyZF0gbW92ZSBlYWNoIGN1cnNvciB0byBtYXRjaFwiLCAtPlxuICAgICAgICBlbnN1cmUgJz8gYWJjIGVudGVyJywgY3Vyc29yOiBbWzMsIDZdLCBbMCwgNl1dXG4gICAgICBpdCBcIltiYWNrd2FyZDogY291bnQgc3BlY2lmaWVkXSBtb3ZlIGVhY2ggY3Vyc29yIHRvIG1hdGNoXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnMiA/IGFiYyBlbnRlcicsIGN1cnNvcjogW1syLCA2XSwgWzMsIDZdXVxuXG4gICAgZGVzY3JpYmUgXCJibGFuayBpbnB1dCByZXBlYXQgbGFzdCBzZWFyY2hcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMDogICAgYWJjXG4gICAgICAgICAgMTogICAgYWJjXG4gICAgICAgICAgMjogICAgYWJjXG4gICAgICAgICAgMzogICAgYWJjXG4gICAgICAgICAgNDpcbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgaXQgXCJEbyBub3RoaW5nIHdoZW4gc2VhcmNoIGhpc3RvcnkgaXMgZW1wdHlcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDFdXG4gICAgICAgIGVuc3VyZSAnLyAgZW50ZXInLCBjdXJzb3I6IFsyLCAxXVxuICAgICAgICBlbnN1cmUgJz8gIGVudGVyJywgY3Vyc29yOiBbMiwgMV1cblxuICAgICAgaXQgXCJSZXBlYXQgZm9yd2FyZCBkaXJlY3Rpb25cIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnLyBhYmMgZW50ZXInLCBjdXJzb3I6IFswLCA2XVxuICAgICAgICBlbnN1cmUgJy8gIGVudGVyJywgY3Vyc29yOiBbMSwgNl1cbiAgICAgICAgZW5zdXJlICcyIC8gIGVudGVyJywgY3Vyc29yOiBbMywgNl1cblxuICAgICAgaXQgXCJSZXBlYXQgYmFja3dhcmQgZGlyZWN0aW9uXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAwXVxuICAgICAgICBlbnN1cmUgJz8gYWJjIGVudGVyJywgY3Vyc29yOiBbMywgNl1cbiAgICAgICAgZW5zdXJlICc/ICBlbnRlcicsIGN1cnNvcjogWzIsIDZdXG4gICAgICAgIGVuc3VyZSAnMiA/ICBlbnRlcicsIGN1cnNvcjogWzAsIDZdXG5cbiAgZGVzY3JpYmUgXCJ0aGUgKiBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiYWJkXFxuQGRlZlxcbmFiZFxcbmRlZlxcblwiXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIGN1cnNvciB0byBuZXh0IG9jY3VycmVuY2Ugb2Ygd29yZCB1bmRlciBjdXJzb3JcIiwgLT5cbiAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgaXQgXCJyZXBlYXRzIHdpdGggdGhlIG4ga2V5XCIsIC0+XG4gICAgICAgIGVuc3VyZSAnKicsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwiZG9lc24ndCBtb3ZlIGN1cnNvciB1bmxlc3MgbmV4dCBvY2N1cnJlbmNlIGlzIHRoZSBleGFjdCB3b3JkIChubyBwYXJ0aWFsIG1hdGNoZXMpXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiYWJjXFxuZGVmXFxuZ2hpYWJjXFxuamtsXFxuYWJjZGVmXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBkZXNjcmliZSBcIndpdGggd29yZHMgdGhhdCBjb250YWluICdub24td29yZCcgY2hhcmFjdGVyc1wiLCAtPlxuICAgICAgICBpdCBcInNraXBzIG5vbi13b3JkLWNoYXIgd2hlbiBwaWNraW5nIGN1cnNvci13b3JkIHRoZW4gcGxhY2UgY3Vyc29yIHRvIG5leHQgb2NjdXJyZW5jZSBvZiB3b3JkXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgQGRlZlxuICAgICAgICAgICAgYWJjXG4gICAgICAgICAgICBAZGVmXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yOiBbMywgMV1cblxuICAgICAgICBpdCBcImRvZXNuJ3QgbW92ZSBjdXJzb3IgdW5sZXNzIG5leHQgbWF0Y2ggaGFzIGV4YWN0IHdvcmQgZW5kaW5nXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgQGRlZlxuICAgICAgICAgICAgYWJjXG4gICAgICAgICAgICBAZGVmMVxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvcjogWzEsIDFdXG5cbiAgICAgICAgaXQgXCJtb3ZlcyBjdXJzb3IgdG8gdGhlIHN0YXJ0IG9mIHZhbGlkIHdvcmQgY2hhclwiLCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJhYmNcXG5kZWZcXG5hYmNcXG5AZGVmXFxuXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yOiBbMywgMV1cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGN1cnNvciBpcyBvbiBub24td29yZCBjaGFyIGNvbHVtblwiLCAtPlxuICAgICAgICBpdCBcIm1hdGNoZXMgb25seSB0aGUgbm9uLXdvcmQgY2hhclwiLCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJhYmNcXG5AZGVmXFxuYWJjXFxuQGRlZlxcblwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvcjogWzMsIDFdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgbm90IG9uIGEgd29yZFwiLCAtPlxuICAgICAgICBpdCBcImRvZXMgYSBtYXRjaCB3aXRoIHRoZSBuZXh0IHdvcmRcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjXFxuYSAgQGRlZlxcbiBhYmNcXG4gQGRlZlwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvcjogWzMsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgYXQgRU9GXCIsIC0+XG4gICAgICAgIGl0IFwiZG9lc24ndCB0cnkgdG8gZG8gYW55IG1hdGNoXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbkBkZWZcXG5hYmNcXG4gXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzMsIDBdXG4gICAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yOiBbMywgMF1cblxuICAgIGRlc2NyaWJlIFwiY2FzZVNlbnNpdGl2aXR5IHNldHRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgYWJjXG4gICAgICAgICAgQUJDXG4gICAgICAgICAgYWJDXG4gICAgICAgICAgYWJjXG4gICAgICAgICAgQUJDXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJzZWFyY2ggY2FzZSBzZW5zaXRpdmVseSB3aGVuIGBpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmRgIGlzIGZhbHNlKD1kZWZhdWx0KVwiLCAtPlxuICAgICAgICBleHBlY3Qoc2V0dGluZ3MuZ2V0KCdpZ25vcmVDYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQnKSkudG9CZShmYWxzZSlcbiAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJzZWFyY2ggY2FzZSBpbnNlbnNpdGl2ZWx5IHdoZW4gYGlnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZGAgdHJ1ZVwiLCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQgJ2lnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZCcsIHRydWVcbiAgICAgICAgZW5zdXJlICcqJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbNCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ1c2VTbWFydGNhc2VGb3JTZWFyY2hDdXJyZW50V29yZCBpcyBlbmFibGVkXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQgJ3VzZVNtYXJ0Y2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkJywgdHJ1ZVxuXG4gICAgICAgIGl0IFwic2VhcmNoIGNhc2Ugc2Vuc2l0aXZlbHkgd2hlbiBlbmFibGUgYW5kIHNlYXJjaCB0ZXJtIGluY2x1ZGVzIHVwcGVyY2FzZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnKicsIGN1cnNvcjogWzQsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgICBpdCBcInNlYXJjaCBjYXNlIGluc2Vuc2l0aXZlbHkgd2hlbiBlbmFibGUgYW5kIHNlYXJjaCB0ZXJtIE5PVCBpbmNsdWRlcyB1cHBlcmNhc2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFs0LCAwXVxuXG4gIGRlc2NyaWJlIFwidGhlIGhhc2gga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgY3Vyc29yIHRvIHByZXZpb3VzIG9jY3VycmVuY2Ugb2Ygd29yZCB1bmRlciBjdXJzb3JcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJhYmNcXG5AZGVmXFxuYWJjXFxuZGVmXFxuXCJcbiAgICAgICAgICBjdXJzb3I6IFsyLCAxXVxuICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcInJlcGVhdHMgd2l0aCBuXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiYWJjXFxuQGRlZlxcbmFiY1xcbmRlZlxcbmFiY1xcblwiXG4gICAgICAgICAgY3Vyc29yOiBbMiwgMV1cbiAgICAgICAgZW5zdXJlICcjJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbNCwgMF1cbiAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgaXQgXCJkb2Vzbid0IG1vdmUgY3Vyc29yIHVubGVzcyBuZXh0IG9jY3VycmVuY2UgaXMgdGhlIGV4YWN0IHdvcmQgKG5vIHBhcnRpYWwgbWF0Y2hlcylcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJhYmNcXG5kZWZcXG5naGlhYmNcXG5qa2xcXG5hYmNkZWZcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnIycsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwid2l0aCB3b3JkcyB0aGF0IGNvbnRhaW50ICdub24td29yZCcgY2hhcmFjdGVyc1wiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIGN1cnNvciB0byBuZXh0IG9jY3VycmVuY2Ugb2Ygd29yZCB1bmRlciBjdXJzb3JcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjXFxuQGRlZlxcbmFiY1xcbkBkZWZcXG5cIlxuICAgICAgICAgICAgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3I6IFsxLCAxXVxuXG4gICAgICAgIGl0IFwibW92ZXMgY3Vyc29yIHRvIHRoZSBzdGFydCBvZiB2YWxpZCB3b3JkIGNoYXJcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjXFxuQGRlZlxcbmFiY1xcbmRlZlxcblwiXG4gICAgICAgICAgICBjdXJzb3I6IFszLCAwXVxuICAgICAgICAgIGVuc3VyZSAnIycsIGN1cnNvcjogWzEsIDFdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgb24gbm9uLXdvcmQgY2hhciBjb2x1bW5cIiwgLT5cbiAgICAgICAgaXQgXCJtYXRjaGVzIG9ubHkgdGhlIG5vbi13b3JkIGNoYXJcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjXFxuQGRlZlxcbmFiY1xcbkBkZWZcXG5cIlxuICAgICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJyonLCBjdXJzb3I6IFszLCAxXVxuXG4gICAgZGVzY3JpYmUgXCJjYXNlU2Vuc2l0aXZpdHkgc2V0dGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBBQkNcbiAgICAgICAgICBhYkNcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBBQkNcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFs0LCAwXVxuXG4gICAgICBpdCBcInNlYXJjaCBjYXNlIHNlbnNpdGl2ZWx5IHdoZW4gYGlnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZGAgaXMgZmFsc2UoPWRlZmF1bHQpXCIsIC0+XG4gICAgICAgIGV4cGVjdChzZXR0aW5ncy5nZXQoJ2lnbm9yZUNhc2VGb3JTZWFyY2hDdXJyZW50V29yZCcpKS50b0JlKGZhbHNlKVxuICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFs0LCAwXVxuXG4gICAgICBpdCBcInNlYXJjaCBjYXNlIGluc2Vuc2l0aXZlbHkgd2hlbiBgaWdub3JlQ2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkYCB0cnVlXCIsIC0+XG4gICAgICAgIHNldHRpbmdzLnNldCAnaWdub3JlQ2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkJywgdHJ1ZVxuICAgICAgICBlbnN1cmUgJyMnLCBjdXJzb3I6IFszLCAwXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBkZXNjcmliZSBcInVzZVNtYXJ0Y2FzZUZvclNlYXJjaEN1cnJlbnRXb3JkIGlzIGVuYWJsZWRcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCAndXNlU21hcnRjYXNlRm9yU2VhcmNoQ3VycmVudFdvcmQnLCB0cnVlXG5cbiAgICAgICAgaXQgXCJzZWFyY2ggY2FzZSBzZW5zaXRpdmVseSB3aGVuIGVuYWJsZSBhbmQgc2VhcmNoIHRlcm0gaW5jbHVkZXMgdXBwZXJjYXNlXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzQsIDBdXG4gICAgICAgICAgZW5zdXJlICcjJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFs0LCAwXVxuXG4gICAgICAgIGl0IFwic2VhcmNoIGNhc2UgaW5zZW5zaXRpdmVseSB3aGVuIGVuYWJsZSBhbmQgc2VhcmNoIHRlcm0gTk9UIGluY2x1ZGVzIHVwcGVyY2FzZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnIycsIGN1cnNvcjogWzQsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgICBlbnN1cmUgJ24nLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICAgIGVuc3VyZSAnbicsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICduJywgY3Vyc29yOiBbMCwgMF1cblxuICAjIEZJWE1FOiBObyBsb25nZXIgY2hpbGQgb2Ygc2VhcmNoIHNvIG1vdmUgdG8gbW90aW9uLWdlbmVyYWwtc3BlYy5jb2ZmZT9cbiAgZGVzY3JpYmUgJ3RoZSAlIG1vdGlvbicsIC0+XG4gICAgZGVzY3JpYmUgXCJQYXJlbnRoZXNpc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIoX19fKVwiXG4gICAgICBkZXNjcmliZSBcImFzIG9wZXJhdG9yIHRhcmdldFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHRleHQ6IFwiKF8oXylfKVwiXG4gICAgICAgIGl0ICdiZWhhdmUgaW5jbHVzaXZlbHkgd2hlbiBpcyBhdCBvcGVuIHBhaXInLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICAgIGVuc3VyZSAnZCAlJywgdGV4dDogXCIoX18pXCJcbiAgICAgICAgaXQgJ2JlaGF2ZSBpbmNsdXNpdmVseSB3aGVuIGlzIGF0IG9wZW4gcGFpcicsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICAgICAgZW5zdXJlICdkICUnLCB0ZXh0OiBcIihfXylcIlxuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgYXQgcGFpciBjaGFyXCIsIC0+XG4gICAgICAgIGl0IFwiY3Vyc29yIGlzIGF0IG9wZW4gcGFpciwgaXQgbW92ZSB0byBjbG9zaW5nIHBhaXJcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGl0IFwiY3Vyc29yIGlzIGF0IGNsb3NlIHBhaXIsIGl0IG1vdmUgdG8gb3BlbiBwYWlyXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgZW5jbG9zZWQgYnkgcGFpclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIihfX18pXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAyXVxuICAgICAgICBpdCBcIm1vdmUgdG8gb3BlbiBwYWlyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIGJvZm9yZSBvcGVuIHBhaXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJfXyhfX18pXCIsXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBpdCBcIm1vdmUgdG8gb3BlbiBwYWlyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIGFmdGVyIGNsb3NlIHBhaXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJfXyhfX18pX19cIixcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDddXG4gICAgICAgIGl0IFwiZmFpbCB0byBtb3ZlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgN11cbiAgICAgIGRlc2NyaWJlIFwibXVsdGkgbGluZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIF9fX1xuICAgICAgICAgICAgX19fKF9fXG4gICAgICAgICAgICBfX19cbiAgICAgICAgICAgIF9fXylcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBkZXNjcmliZSBcIndoZW4gb3BlbiBhbmQgY2xvc2UgcGFpciBpcyBub3QgYXQgY3Vyc29yIGxpbmVcIiwgLT5cbiAgICAgICAgICBpdCBcImZhaWwgdG8gbW92ZVwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGl0IFwiZmFpbCB0byBtb3ZlXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiBvcGVuIHBhaXIgaXMgZm9yd2FyZGluZyB0byBjdXJzb3IgaW4gc2FtZSByb3dcIiwgLT5cbiAgICAgICAgICBpdCBcIm1vdmUgdG8gY2xvc2luZyBwYWlyXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzMsIDNdXG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgcG9zaXRpb24gaXMgZ3JlYXRlciB0aGFuIG9wZW4gcGFpclwiLCAtPlxuICAgICAgICAgIGl0IFwiZmFpbCB0byBtb3ZlXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgNF1cbiAgICAgICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzEsIDRdXG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiBjbG9zZSBwYWlyIGlzIGZvcndhcmRpbmcgdG8gY3Vyc29yIGluIHNhbWUgcm93XCIsIC0+XG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGNsb3NpbmcgcGFpclwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzMsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFsxLCAzXVxuXG4gICAgZGVzY3JpYmUgXCJDdXJseUJyYWNrZXRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwie19fX31cIlxuICAgICAgaXQgXCJjdXJzb3IgaXMgYXQgb3BlbiBwYWlyLCBpdCBtb3ZlIHRvIGNsb3NpbmcgcGFpclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwiY3Vyc29yIGlzIGF0IGNsb3NlIHBhaXIsIGl0IG1vdmUgdG8gb3BlbiBwYWlyXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCA0XVxuXG4gICAgZGVzY3JpYmUgXCJTcXVhcmVCcmFja2V0XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIltfX19dXCJcbiAgICAgIGl0IFwiY3Vyc29yIGlzIGF0IG9wZW4gcGFpciwgaXQgbW92ZSB0byBjbG9zaW5nIHBhaXJcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDRdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG4gICAgICBpdCBcImN1cnNvciBpcyBhdCBjbG9zZSBwYWlyLCBpdCBtb3ZlIHRvIG9wZW4gcGFpclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgNF1cblxuICAgIGRlc2NyaWJlIFwiY29tcGxleCBzaXR1YXRpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgKF9fX19fKV9fe19fW19fX11fX31cbiAgICAgICAgICBfXG4gICAgICAgICAgXCJcIlwiXG4gICAgICBpdCAnbW92ZSB0byBjbG9zaW5nIHBhaXIgd2hpY2ggb3BlbiBwYWlyIGNvbWUgZmlyc3QnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgN11cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMTldXG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxMF1cbiAgICAgICAgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMTZdXG4gICAgICBpdCAnZW5jbG9zaW5nIHBhaXIgaXMgcHJpb3JpdGl6ZWQgb3ZlciBmb3J3YXJkaW5nIHJhbmdlJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcImNvbXBsZXggc2l0dWF0aW9uIHdpdGggaHRtbCB0YWdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgICBzb21lIHRleHRcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0ICdtb3ZlIHRvIHBhaXIgdGFnIG9ubHkgd2hlbiBjdXJzb3IgaXMgb24gb3BlbiBvciBjbG9zZSB0YWcgYnV0IG5vdCBvbiBBbmdsZUJyYWNrZXQoPCwgPiknLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV07IGVuc3VyZSAnJScsIGN1cnNvcjogWzQsIDFdXG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyXTsgZW5zdXJlICclJywgY3Vyc29yOiBbNCwgMV1cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDNdOyBlbnN1cmUgJyUnLCBjdXJzb3I6IFs0LCAxXVxuXG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAxXTsgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDJdOyBlbnN1cmUgJyUnLCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgM107IGVuc3VyZSAnJScsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCA0XTsgZW5zdXJlICclJywgY3Vyc29yOiBbMCwgMV1cbiJdfQ==
