(function() {
  var TextData, dispatch, getView, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView;

  settings = require('../lib/settings');

  describe("Occurrence", function() {
    var classList, dispatchSearchCommand, editor, editorElement, ensure, inputSearchText, keystroke, ref1, ref2, searchEditor, searchEditorElement, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5], classList = ref1[6];
    ref2 = [], searchEditor = ref2[0], searchEditorElement = ref2[1];
    inputSearchText = function(text) {
      return searchEditor.insertText(text);
    };
    dispatchSearchCommand = function(name) {
      return dispatch(searchEditorElement, name);
    };
    beforeEach(function() {
      getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke;
        classList = editorElement.classList;
        searchEditor = vimState.searchInput.editor;
        return searchEditorElement = vimState.searchInput.editorElement;
      });
      return runs(function() {
        return jasmine.attachToDOM(editorElement);
      });
    });
    describe("operator-modifier-occurrence", function() {
      beforeEach(function() {
        return set({
          text: "\nooo: xxx: ooo:\n---: ooo: xxx: ooo:\nooo: xxx: ---: xxx: ooo:\nxxx: ---: ooo: ooo:\n\nooo: xxx: ooo:\n---: ooo: xxx: ooo:\nooo: xxx: ---: xxx: ooo:\nxxx: ---: ooo: ooo:\n"
        });
      });
      describe("o modifier", function() {
        return it("change occurrence of cursor word in inner-paragraph", function() {
          set({
            cursor: [1, 0]
          });
          ensure("c o i p", {
            mode: 'insert',
            textC: "\n!: xxx: |:\n---: |: xxx: |:\n|: xxx: ---: xxx: |:\nxxx: ---: |: |:\n\nooo: xxx: ooo:\n---: ooo: xxx: ooo:\nooo: xxx: ---: xxx: ooo:\nxxx: ---: ooo: ooo:\n"
          });
          editor.insertText('===');
          ensure("escape", {
            mode: 'normal',
            textC: "\n==!=: xxx: ==|=:\n---: ==|=: xxx: ==|=:\n==|=: xxx: ---: xxx: ==|=:\nxxx: ---: ==|=: ==|=:\n\nooo: xxx: ooo:\n---: ooo: xxx: ooo:\nooo: xxx: ---: xxx: ooo:\nxxx: ---: ooo: ooo:\n"
          });
          return ensure("} j .", {
            mode: 'normal',
            textC: "\n===: xxx: ===:\n---: ===: xxx: ===:\n===: xxx: ---: xxx: ===:\nxxx: ---: ===: ===:\n\n==!=: xxx: ==|=:\n---: ==|=: xxx: ==|=:\n==|=: xxx: ---: xxx: ==|=:\nxxx: ---: ==|=: ==|=:\n"
          });
        });
      });
      describe("O modifier", function() {
        beforeEach(function() {
          return set({
            textC: "\ncamelCa|se Cases\n\"CaseStudy\" SnakeCase\nUP_CASE\n\nother ParagraphCase"
          });
        });
        return it("delete subword-occurrence in paragraph and repeatable", function() {
          ensure("d O p", {
            textC: "\ncamel| Cases\n\"Study\" Snake\nUP_CASE\n\nother ParagraphCase"
          });
          return ensure("G .", {
            textC: "\ncamel Cases\n\"Study\" Snake\nUP_CASE\n\nother| Paragraph"
          });
        });
      });
      describe("apply various operator to occurrence in various target", function() {
        beforeEach(function() {
          return set({
            textC: "ooo: xxx: o!oo:\n===: ooo: xxx: ooo:\nooo: xxx: ===: xxx: ooo:\nxxx: ===: ooo: ooo:"
          });
        });
        it("upper case inner-word", function() {
          ensure("g U o i l", {
            textC: "OOO: xxx: O!OO:\n===: ooo: xxx: ooo:\nooo: xxx: ===: xxx: ooo:\nxxx: ===: ooo: ooo:"
          });
          ensure("2 j .", {
            textC: "OOO: xxx: OOO:\n===: ooo: xxx: ooo:\nOOO: xxx: =!==: xxx: OOO:\nxxx: ===: ooo: ooo:"
          });
          return ensure("j .", {
            textC: "OOO: xxx: OOO:\n===: ooo: xxx: ooo:\nOOO: xxx: ===: xxx: OOO:\nxxx: ===: O!OO: OOO:"
          });
        });
        return describe("clip to mutation end behavior", function() {
          beforeEach(function() {
            return set({
              textC: "\noo|o:xxx:ooo:\nxxx:ooo:xxx\n\n"
            });
          });
          it("[d o p] delete occurrence and cursor is at mutation end", function() {
            return ensure("d o p", {
              textC: "\n|:xxx::\nxxx::xxx\n\n"
            });
          });
          it("[d o j] delete occurrence and cursor is at mutation end", function() {
            return ensure("d o j", {
              textC: "\n|:xxx::\nxxx::xxx\n\n"
            });
          });
          return it("not clip if original cursor not intersects any occurence-marker", function() {
            ensure('g o', {
              occurrenceText: ['ooo', 'ooo', 'ooo'],
              cursor: [1, 2]
            });
            keystroke('j', {
              cursor: [2, 2]
            });
            return ensure("d p", {
              textC: "\n:xxx::\nxx|x::xxx\n\n"
            });
          });
        });
      });
      describe("auto extend target range to include occurrence", function() {
        var textFinal, textOriginal;
        textOriginal = "This text have 3 instance of 'text' in the whole text.\n";
        textFinal = textOriginal.replace(/text/g, '');
        beforeEach(function() {
          return set({
            text: textOriginal
          });
        });
        it("[from start of 1st]", function() {
          set({
            cursor: [0, 5]
          });
          return ensure('d o $', {
            text: textFinal
          });
        });
        it("[from middle of 1st]", function() {
          set({
            cursor: [0, 7]
          });
          return ensure('d o $', {
            text: textFinal
          });
        });
        it("[from end of last]", function() {
          set({
            cursor: [0, 52]
          });
          return ensure('d o 0', {
            text: textFinal
          });
        });
        return it("[from middle of last]", function() {
          set({
            cursor: [0, 51]
          });
          return ensure('d o 0', {
            text: textFinal
          });
        });
      });
      return describe("select-occurrence", function() {
        beforeEach(function() {
          return set({
            text: "vim-mode-plus vim-mode-plus"
          });
        });
        return describe("what the cursor-word", function() {
          var ensureCursorWord;
          ensureCursorWord = function(initialPoint, arg) {
            var selectedText;
            selectedText = arg.selectedText;
            set({
              cursor: initialPoint
            });
            ensure("g cmd-d i p", {
              selectedText: selectedText,
              mode: ['visual', 'characterwise']
            });
            return ensure("escape", {
              mode: "normal"
            });
          };
          describe("cursor is on normal word", function() {
            return it("pick word but not pick partially matched one [by select]", function() {
              ensureCursorWord([0, 0], {
                selectedText: ['vim', 'vim']
              });
              ensureCursorWord([0, 3], {
                selectedText: ['-', '-', '-', '-']
              });
              ensureCursorWord([0, 4], {
                selectedText: ['mode', 'mode']
              });
              return ensureCursorWord([0, 9], {
                selectedText: ['plus', 'plus']
              });
            });
          });
          describe("cursor is at single white space [by delete]", function() {
            return it("pick single white space only", function() {
              set({
                text: "ooo ooo ooo\n ooo ooo ooo",
                cursor: [0, 3]
              });
              return ensure("d o i p", {
                text: "ooooooooo\nooooooooo"
              });
            });
          });
          return describe("cursor is at sequnce of space [by delete]", function() {
            return it("select sequnce of white spaces including partially mached one", function() {
              set({
                cursor: [0, 3],
                text_: "ooo___ooo ooo\n ooo ooo____ooo________ooo"
              });
              return ensure("d o i p", {
                text_: "oooooo ooo\n ooo ooo ooo  ooo"
              });
            });
          });
        });
      });
    });
    describe("stayOnOccurrence settings", function() {
      beforeEach(function() {
        return set({
          textC: "\naaa, bbb, ccc\nbbb, a|aa, aaa\n"
        });
      });
      describe("when true (= default)", function() {
        return it("keep cursor position after operation finished", function() {
          return ensure('g U o p', {
            textC: "\nAAA, bbb, ccc\nbbb, A|AA, AAA\n"
          });
        });
      });
      return describe("when false", function() {
        beforeEach(function() {
          return settings.set('stayOnOccurrence', false);
        });
        return it("move cursor to start of target as like non-ocurrence operator", function() {
          return ensure('g U o p', {
            textC: "\n|AAA, bbb, ccc\nbbb, AAA, AAA\n"
          });
        });
      });
    });
    describe("from visual-mode.is-narrowed", function() {
      beforeEach(function() {
        return set({
          text: "ooo: xxx: ooo\n|||: ooo: xxx: ooo\nooo: xxx: |||: xxx: ooo\nxxx: |||: ooo: ooo",
          cursor: [0, 0]
        });
      });
      describe("[vC] select-occurrence", function() {
        return it("select cursor-word which intersecting selection then apply upper-case", function() {
          ensure("v 2 j cmd-d", {
            selectedText: ['ooo', 'ooo', 'ooo', 'ooo', 'ooo'],
            mode: ['visual', 'characterwise']
          });
          return ensure("U", {
            text: "OOO: xxx: OOO\n|||: OOO: xxx: OOO\nOOO: xxx: |||: xxx: ooo\nxxx: |||: ooo: ooo",
            numCursors: 5,
            mode: 'normal'
          });
        });
      });
      describe("[vL] select-occurrence", function() {
        return it("select cursor-word which intersecting selection then apply upper-case", function() {
          ensure("5 l V 2 j cmd-d", {
            selectedText: ['xxx', 'xxx', 'xxx', 'xxx'],
            mode: ['visual', 'characterwise']
          });
          return ensure("U", {
            text: "ooo: XXX: ooo\n|||: ooo: XXX: ooo\nooo: XXX: |||: XXX: ooo\nxxx: |||: ooo: ooo",
            numCursors: 4,
            mode: 'normal'
          });
        });
      });
      return describe("[vB] select-occurrence", function() {
        it("select cursor-word which intersecting selection then apply upper-case", function() {
          return ensure("W ctrl-v 2 j $ h cmd-d U", {
            text: "ooo: xxx: OOO\n|||: OOO: xxx: OOO\nooo: xxx: |||: xxx: OOO\nxxx: |||: ooo: ooo",
            numCursors: 4
          });
        });
        return it("pick cursor-word from vB range", function() {
          return ensure("ctrl-v 7 l 2 j o cmd-d U", {
            text: "OOO: xxx: ooo\n|||: OOO: xxx: ooo\nOOO: xxx: |||: xxx: ooo\nxxx: |||: ooo: ooo",
            numCursors: 3
          });
        });
      });
    });
    describe("incremental search integration: change-occurrence-from-search, select-occurrence-from-search", function() {
      beforeEach(function() {
        settings.set('incrementalSearch', true);
        return set({
          text: "ooo: xxx: ooo: 0000\n1: ooo: 22: ooo:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:",
          cursor: [0, 0]
        });
      });
      describe("from normal mode", function() {
        it("select occurrence by pattern match", function() {
          keystroke('/');
          inputSearchText('\\d{3,4}');
          dispatchSearchCommand('vim-mode-plus:select-occurrence-from-search');
          return ensure('i e', {
            selectedText: ['3333', '444', '0000'],
            mode: ['visual', 'characterwise']
          });
        });
        return it("change occurrence by pattern match", function() {
          keystroke('/');
          inputSearchText('^\\w+:');
          dispatchSearchCommand('vim-mode-plus:change-occurrence-from-search');
          ensure('i e', {
            mode: 'insert'
          });
          editor.insertText('hello');
          return ensure({
            text: "hello xxx: ooo: 0000\nhello ooo: 22: ooo:\nhello xxx: |||: xxx: 3333:\nhello |||: ooo: ooo:"
          });
        });
      });
      describe("from visual mode", function() {
        describe("visual characterwise", function() {
          return it("change occurrence in narrowed selection", function() {
            keystroke('v j /');
            inputSearchText('o+');
            dispatchSearchCommand('vim-mode-plus:select-occurrence-from-search');
            return ensure('U', {
              text: "OOO: xxx: OOO: 0000\n1: ooo: 22: ooo:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:"
            });
          });
        });
        describe("visual linewise", function() {
          return it("change occurrence in narrowed selection", function() {
            keystroke('V j /');
            inputSearchText('o+');
            dispatchSearchCommand('vim-mode-plus:select-occurrence-from-search');
            return ensure('U', {
              text: "OOO: xxx: OOO: 0000\n1: OOO: 22: OOO:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:"
            });
          });
        });
        return describe("visual blockwise", function() {
          return it("change occurrence in narrowed selection", function() {
            set({
              cursor: [0, 5]
            });
            keystroke('ctrl-v 2 j 1 0 l /');
            inputSearchText('o+');
            dispatchSearchCommand('vim-mode-plus:select-occurrence-from-search');
            return ensure('U', {
              text: "ooo: xxx: OOO: 0000\n1: OOO: 22: OOO:\nooo: xxx: |||: xxx: 3333:\n444: |||: ooo: ooo:"
            });
          });
        });
      });
      describe("persistent-selection is exists", function() {
        beforeEach(function() {
          atom.keymaps.add("create-persistent-selection", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'm': 'vim-mode-plus:create-persistent-selection'
            }
          });
          set({
            text: "ooo: xxx: ooo:\n|||: ooo: xxx: ooo:\nooo: xxx: |||: xxx: ooo:\nxxx: |||: ooo: ooo:\n",
            cursor: [0, 0]
          });
          return ensure('V j m G m m', {
            persistentSelectionBufferRange: [[[0, 0], [2, 0]], [[3, 0], [4, 0]]]
          });
        });
        describe("when no selection is exists", function() {
          return it("select occurrence in all persistent-selection", function() {
            set({
              cursor: [0, 0]
            });
            keystroke('/');
            inputSearchText('xxx');
            dispatchSearchCommand('vim-mode-plus:select-occurrence-from-search');
            return ensure('U', {
              text: "ooo: XXX: ooo:\n|||: ooo: XXX: ooo:\nooo: xxx: |||: xxx: ooo:\nXXX: |||: ooo: ooo:\n",
              persistentSelectionCount: 0
            });
          });
        });
        return describe("when both exits, operator applied to both", function() {
          return it("select all occurrence in selection", function() {
            set({
              cursor: [0, 0]
            });
            keystroke('V 2 j /');
            inputSearchText('xxx');
            dispatchSearchCommand('vim-mode-plus:select-occurrence-from-search');
            return ensure('U', {
              text: "ooo: XXX: ooo:\n|||: ooo: XXX: ooo:\nooo: XXX: |||: XXX: ooo:\nXXX: |||: ooo: ooo:\n",
              persistentSelectionCount: 0
            });
          });
        });
      });
      return describe("demonstrate persistent-selection's practical scenario", function() {
        var oldGrammar;
        oldGrammar = [][0];
        afterEach(function() {
          return editor.setGrammar(oldGrammar);
        });
        beforeEach(function() {
          atom.keymaps.add("create-persistent-selection", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'm': 'vim-mode-plus:toggle-persistent-selection'
            }
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('language-coffee-script');
          });
          runs(function() {
            oldGrammar = editor.getGrammar();
            return editor.setGrammar(atom.grammars.grammarForScopeName('source.coffee'));
          });
          return set({
            text: "constructor: (@main, @editor, @statusBarManager) ->\n  @editorElement = @editor.element\n  @emitter = new Emitter\n  @subscriptions = new CompositeDisposable\n  @modeManager = new ModeManager(this)\n  @mark = new MarkManager(this)\n  @register = new RegisterManager(this)\n  @persistentSelections = []\n\n  @highlightSearchSubscription = @editorElement.onDidChangeScrollTop =>\n    @refreshHighlightSearch()\n\n  @operationStack = new OperationStack(this)\n  @cursorStyleManager = new CursorStyleManager(this)\n\nanotherFunc: ->\n  @hello = []"
          });
        });
        return it('change all assignment("=") of current-function to "?="', function() {
          set({
            cursor: [0, 0]
          });
          ensure('j f =', {
            cursor: [1, 17]
          });
          runs(function() {
            var textsInBufferRange, textsInBufferRangeIsAllEqualChar;
            keystroke(['g cmd-d', 'i f', 'm'].join(" "));
            textsInBufferRange = vimState.persistentSelection.getMarkerBufferRanges().map(function(range) {
              return editor.getTextInBufferRange(range);
            });
            textsInBufferRangeIsAllEqualChar = textsInBufferRange.every(function(text) {
              return text === '=';
            });
            expect(textsInBufferRangeIsAllEqualChar).toBe(true);
            expect(vimState.persistentSelection.getMarkers()).toHaveLength(11);
            keystroke('2 l');
            ensure('/ => enter', {
              cursor: [9, 69]
            });
            keystroke("m");
            return expect(vimState.persistentSelection.getMarkers()).toHaveLength(10);
          });
          waitsFor(function() {
            return classList.contains('has-persistent-selection');
          });
          return runs(function() {
            keystroke("ctrl-cmd-g I");
            editor.insertText('?');
            return ensure('escape', {
              text: "constructor: (@main, @editor, @statusBarManager) ->\n  @editorElement ?= @editor.element\n  @emitter ?= new Emitter\n  @subscriptions ?= new CompositeDisposable\n  @modeManager ?= new ModeManager(this)\n  @mark ?= new MarkManager(this)\n  @register ?= new RegisterManager(this)\n  @persistentSelections ?= []\n\n  @highlightSearchSubscription ?= @editorElement.onDidChangeScrollTop =>\n    @refreshHighlightSearch()\n\n  @operationStack ?= new OperationStack(this)\n  @cursorStyleManager ?= new CursorStyleManager(this)\n\nanotherFunc: ->\n  @hello = []"
            });
          });
        });
      });
    });
    describe("preset occurrence marker", function() {
      beforeEach(function() {
        return set({
          text: "This text have 3 instance of 'text' in the whole text",
          cursor: [0, 0]
        });
      });
      describe("toggle-preset-occurrence commands", function() {
        describe("in normal-mode", function() {
          describe("add preset occurrence", function() {
            return it('set cursor-ward as preset occurrence marker and not move cursor', function() {
              ensure('g o', {
                occurrenceText: 'This',
                cursor: [0, 0]
              });
              ensure('w', {
                cursor: [0, 5]
              });
              return ensure('g o', {
                occurrenceText: ['This', 'text', 'text', 'text'],
                cursor: [0, 5]
              });
            });
          });
          describe("remove preset occurrence", function() {
            it('removes occurrence one by one separately', function() {
              ensure('g o', {
                occurrenceText: 'This',
                cursor: [0, 0]
              });
              ensure('w', {
                cursor: [0, 5]
              });
              ensure('g o', {
                occurrenceText: ['This', 'text', 'text', 'text'],
                cursor: [0, 5]
              });
              ensure('g o', {
                occurrenceText: ['This', 'text', 'text'],
                cursor: [0, 5]
              });
              return ensure('b g o', {
                occurrenceText: ['text', 'text'],
                cursor: [0, 0]
              });
            });
            it('removes all occurrence in this editor by escape', function() {
              ensure('g o', {
                occurrenceText: 'This',
                cursor: [0, 0]
              });
              ensure('w', {
                cursor: [0, 5]
              });
              ensure('g o', {
                occurrenceText: ['This', 'text', 'text', 'text'],
                cursor: [0, 5]
              });
              return ensure('escape', {
                occurrenceCount: 0
              });
            });
            return it('can recall previously set occurence pattern by `g .`', function() {
              ensure('w v l g o', {
                occurrenceText: ['te', 'te', 'te'],
                cursor: [0, 6]
              });
              ensure('escape', {
                occurrenceCount: 0
              });
              expect(vimState.globalState.get('lastOccurrencePattern')).toEqual(/te/g);
              ensure('w', {
                cursor: [0, 10]
              });
              ensure('g .', {
                occurrenceText: ['te', 'te', 'te'],
                cursor: [0, 10]
              });
              ensure('g U o $', {
                textC: "This text |HAVE 3 instance of 'text' in the whole text"
              });
              return expect(vimState.globalState.get('lastOccurrencePattern')).toEqual(/te/g);
            });
          });
          describe("restore last occurrence marker by add-preset-occurrence-from-last-occurrence-pattern", function() {
            beforeEach(function() {
              return set({
                textC: "camel\ncamelCase\ncamels\ncamel"
              });
            });
            it("can restore occurrence-marker added by `g o` in normal-mode", function() {
              set({
                cursor: [0, 0]
              });
              ensure("g o", {
                occurrenceText: ['camel', 'camel']
              });
              ensure('escape', {
                occurrenceCount: 0
              });
              return ensure("g .", {
                occurrenceText: ['camel', 'camel']
              });
            });
            it("can restore occurrence-marker added by `g o` in visual-mode", function() {
              set({
                cursor: [0, 0]
              });
              ensure("v i w", {
                selectedText: "camel"
              });
              ensure("g o", {
                occurrenceText: ['camel', 'camel', 'camel', 'camel']
              });
              ensure('escape', {
                occurrenceCount: 0
              });
              return ensure("g .", {
                occurrenceText: ['camel', 'camel', 'camel', 'camel']
              });
            });
            return it("can restore occurrence-marker added by `g O` in normal-mode", function() {
              set({
                cursor: [0, 0]
              });
              ensure("g O", {
                occurrenceText: ['camel', 'camel', 'camel']
              });
              ensure('escape', {
                occurrenceCount: 0
              });
              return ensure("g .", {
                occurrenceText: ['camel', 'camel', 'camel']
              });
            });
          });
          return describe("css class has-occurrence", function() {
            describe("manually toggle by toggle-preset-occurrence command", function() {
              return it('is auto-set/unset wheter at least one preset-occurrence was exists or not', function() {
                expect(classList.contains('has-occurrence')).toBe(false);
                ensure('g o', {
                  occurrenceText: 'This',
                  cursor: [0, 0]
                });
                expect(classList.contains('has-occurrence')).toBe(true);
                ensure('g o', {
                  occurrenceCount: 0,
                  cursor: [0, 0]
                });
                return expect(classList.contains('has-occurrence')).toBe(false);
              });
            });
            return describe("change 'INSIDE' of marker", function() {
              var markerLayerUpdated;
              markerLayerUpdated = null;
              beforeEach(function() {
                return markerLayerUpdated = false;
              });
              return it('destroy marker and reflect to "has-occurrence" CSS', function() {
                runs(function() {
                  expect(classList.contains('has-occurrence')).toBe(false);
                  ensure('g o', {
                    occurrenceText: 'This',
                    cursor: [0, 0]
                  });
                  expect(classList.contains('has-occurrence')).toBe(true);
                  ensure('l i', {
                    mode: 'insert'
                  });
                  vimState.occurrenceManager.markerLayer.onDidUpdate(function() {
                    return markerLayerUpdated = true;
                  });
                  editor.insertText('--');
                  return ensure("escape", {
                    textC: "T-|-his text have 3 instance of 'text' in the whole text",
                    mode: 'normal'
                  });
                });
                waitsFor(function() {
                  return markerLayerUpdated;
                });
                return runs(function() {
                  ensure({
                    occurrenceCount: 0
                  });
                  return expect(classList.contains('has-occurrence')).toBe(false);
                });
              });
            });
          });
        });
        describe("in visual-mode", function() {
          describe("add preset occurrence", function() {
            return it('set selected-text as preset occurrence marker and not move cursor', function() {
              ensure('w v l', {
                mode: ['visual', 'characterwise'],
                selectedText: 'te'
              });
              return ensure('g o', {
                mode: 'normal',
                occurrenceText: ['te', 'te', 'te']
              });
            });
          });
          return describe("is-narrowed selection", function() {
            var textOriginal;
            textOriginal = [][0];
            beforeEach(function() {
              textOriginal = "This text have 3 instance of 'text' in the whole text\nThis text have 3 instance of 'text' in the whole text\n";
              return set({
                cursor: [0, 0],
                text: textOriginal
              });
            });
            return it("pick ocurrence-word from cursor position and continue visual-mode", function() {
              ensure('w V j', {
                mode: ['visual', 'linewise'],
                selectedText: textOriginal
              });
              ensure('g o', {
                mode: ['visual', 'linewise'],
                selectedText: textOriginal,
                occurrenceText: ['text', 'text', 'text', 'text', 'text', 'text']
              });
              return ensure('r !', {
                mode: 'normal',
                text: "This !!!! have 3 instance of '!!!!' in the whole !!!!\nThis !!!! have 3 instance of '!!!!' in the whole !!!!\n"
              });
            });
          });
        });
        return describe("in incremental-search", function() {
          beforeEach(function() {
            return settings.set('incrementalSearch', true);
          });
          return describe("add-occurrence-pattern-from-search", function() {
            return it('mark as occurrence which matches regex entered in search-ui', function() {
              keystroke('/');
              inputSearchText('\\bt\\w+');
              dispatchSearchCommand('vim-mode-plus:add-occurrence-pattern-from-search');
              return ensure({
                occurrenceText: ['text', 'text', 'the', 'text']
              });
            });
          });
        });
      });
      describe("mutate preset occurrence", function() {
        beforeEach(function() {
          set({
            text: "ooo: xxx: ooo xxx: ooo:\n!!!: ooo: xxx: ooo xxx: ooo:"
          });
          return {
            cursor: [0, 0]
          };
        });
        describe("normal-mode", function() {
          it('[delete] apply operation to preset-marker intersecting selected target', function() {
            return ensure('l g o D', {
              text: ": xxx:  xxx: :\n!!!: ooo: xxx: ooo xxx: ooo:"
            });
          });
          it('[upcase] apply operation to preset-marker intersecting selected target', function() {
            set({
              cursor: [0, 6]
            });
            return ensure('l g o g U j', {
              text: "ooo: XXX: ooo XXX: ooo:\n!!!: ooo: XXX: ooo XXX: ooo:"
            });
          });
          it('[upcase exclude] won\'t mutate removed marker', function() {
            set({
              cursor: [0, 0]
            });
            ensure('g o', {
              occurrenceCount: 6
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('g U j', {
              text: "ooo: xxx: OOO xxx: OOO:\n!!!: OOO: xxx: OOO xxx: OOO:"
            });
          });
          it('[delete] apply operation to preset-marker intersecting selected target', function() {
            set({
              cursor: [0, 10]
            });
            return ensure('g o g U $', {
              text: "ooo: xxx: OOO xxx: OOO:\n!!!: ooo: xxx: ooo xxx: ooo:"
            });
          });
          it('[change] apply operation to preset-marker intersecting selected target', function() {
            ensure('l g o C', {
              mode: 'insert',
              text: ": xxx:  xxx: :\n!!!: ooo: xxx: ooo xxx: ooo:"
            });
            editor.insertText('YYY');
            return ensure('l g o C', {
              mode: 'insert',
              text: "YYY: xxx: YYY xxx: YYY:\n!!!: ooo: xxx: ooo xxx: ooo:",
              numCursors: 3
            });
          });
          return describe("predefined keymap on when has-occurrence", function() {
            beforeEach(function() {
              return set({
                textC: "Vim is editor I used before\nV|im is editor I used before\nVim is editor I used before\nVim is editor I used before"
              });
            });
            it('[insert-at-start] apply operation to preset-marker intersecting selected target', function() {
              ensure('g o', {
                occurrenceText: ['Vim', 'Vim', 'Vim', 'Vim']
              });
              classList.contains('has-occurrence');
              ensure('v k I', {
                mode: 'insert',
                numCursors: 2
              });
              editor.insertText("pure-");
              return ensure('escape', {
                mode: 'normal',
                textC: "pure!-Vim is editor I used before\npure|-Vim is editor I used before\nVim is editor I used before\nVim is editor I used before"
              });
            });
            return it('[insert-after-start] apply operation to preset-marker intersecting selected target', function() {
              set({
                cursor: [1, 1]
              });
              ensure('g o', {
                occurrenceText: ['Vim', 'Vim', 'Vim', 'Vim']
              });
              classList.contains('has-occurrence');
              ensure('v j A', {
                mode: 'insert',
                numCursors: 2
              });
              editor.insertText(" and Emacs");
              return ensure('escape', {
                mode: 'normal',
                textC: "Vim is editor I used before\nVim and Emac|s is editor I used before\nVim and Emac!s is editor I used before\nVim is editor I used before"
              });
            });
          });
        });
        describe("visual-mode", function() {
          return it('[upcase] apply to preset-marker as long as it intersects selection', function() {
            set({
              textC: "ooo: x|xx: ooo xxx: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('v j U', {
              text: "ooo: XXX: ooo XXX: ooo:\nXXX: ooo: xxx: ooo xxx: ooo:"
            });
          });
        });
        describe("visual-linewise-mode", function() {
          return it('[upcase] apply to preset-marker as long as it intersects selection', function() {
            set({
              cursor: [0, 6],
              text: "ooo: xxx: ooo xxx: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('V U', {
              text: "ooo: XXX: ooo XXX: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
          });
        });
        return describe("visual-blockwise-mode", function() {
          return it('[upcase] apply to preset-marker as long as it intersects selection', function() {
            set({
              cursor: [0, 6],
              text: "ooo: xxx: ooo xxx: ooo:\nxxx: ooo: xxx: ooo xxx: ooo:"
            });
            ensure('g o', {
              occurrenceCount: 5
            });
            return ensure('ctrl-v j 2 w U', {
              text: "ooo: XXX: ooo xxx: ooo:\nxxx: ooo: XXX: ooo xxx: ooo:"
            });
          });
        });
      });
      describe("MoveToNextOccurrence, MoveToPreviousOccurrence", function() {
        beforeEach(function() {
          set({
            textC: "|ooo: xxx: ooo\n___: ooo: xxx:\nooo: xxx: ooo:"
          });
          return ensure('g o', {
            occurrenceText: ['ooo', 'ooo', 'ooo', 'ooo', 'ooo']
          });
        });
        describe("tab, shift-tab", function() {
          describe("cursor is at start of occurrence", function() {
            return it("search next/previous occurrence marker", function() {
              ensure('tab tab', {
                cursor: [1, 5]
              });
              ensure('2 tab', {
                cursor: [2, 10]
              });
              ensure('2 shift-tab', {
                cursor: [1, 5]
              });
              return ensure('2 shift-tab', {
                cursor: [0, 0]
              });
            });
          });
          return describe("when cursor is inside of occurrence", function() {
            beforeEach(function() {
              ensure("escape", {
                occurrenceCount: 0
              });
              set({
                textC: "oooo oo|oo oooo"
              });
              return ensure('g o', {
                occurrenceCount: 3
              });
            });
            describe("tab", function() {
              return it("move to next occurrence", function() {
                return ensure('tab', {
                  textC: 'oooo oooo |oooo'
                });
              });
            });
            return describe("shift-tab", function() {
              return it("move to previous occurrence", function() {
                return ensure('shift-tab', {
                  textC: '|oooo oooo oooo'
                });
              });
            });
          });
        });
        describe("as operator's target", function() {
          describe("tab", function() {
            it("operate on next occurrence and repeatable", function() {
              ensure("g U tab", {
                text: "OOO: xxx: OOO\n___: ooo: xxx:\nooo: xxx: ooo:",
                occurrenceCount: 3
              });
              ensure(".", {
                text: "OOO: xxx: OOO\n___: OOO: xxx:\nooo: xxx: ooo:",
                occurrenceCount: 2
              });
              ensure("2 .", {
                text: "OOO: xxx: OOO\n___: OOO: xxx:\nOOO: xxx: OOO:",
                occurrenceCount: 0
              });
              return expect(classList.contains('has-occurrence')).toBe(false);
            });
            return it("[o-modifier] operate on next occurrence and repeatable", function() {
              ensure("escape", {
                mode: 'normal',
                occurrenceCount: 0
              });
              ensure("g U o tab", {
                text: "OOO: xxx: OOO\n___: ooo: xxx:\nooo: xxx: ooo:",
                occurrenceCount: 0
              });
              ensure(".", {
                text: "OOO: xxx: OOO\n___: OOO: xxx:\nooo: xxx: ooo:",
                occurrenceCount: 0
              });
              return ensure("2 .", {
                text: "OOO: xxx: OOO\n___: OOO: xxx:\nOOO: xxx: OOO:",
                occurrenceCount: 0
              });
            });
          });
          return describe("shift-tab", function() {
            return it("operate on next previous and repeatable", function() {
              set({
                cursor: [2, 10]
              });
              ensure("g U shift-tab", {
                text: "ooo: xxx: ooo\n___: ooo: xxx:\nOOO: xxx: OOO:",
                occurrenceCount: 3
              });
              ensure(".", {
                text: "ooo: xxx: ooo\n___: OOO: xxx:\nOOO: xxx: OOO:",
                occurrenceCount: 2
              });
              ensure("2 .", {
                text: "OOO: xxx: OOO\n___: OOO: xxx:\nOOO: xxx: OOO:",
                occurrenceCount: 0
              });
              return expect(classList.contains('has-occurrence')).toBe(false);
            });
          });
        });
        describe("excude particular occurence by `.` repeat", function() {
          it("clear preset-occurrence and move to next", function() {
            return ensure('2 tab . g U i p', {
              textC: "OOO: xxx: OOO\n___: |ooo: xxx:\nOOO: xxx: OOO:"
            });
          });
          return it("clear preset-occurrence and move to previous", function() {
            return ensure('2 shift-tab . g U i p', {
              textC: "OOO: xxx: OOO\n___: OOO: xxx:\n|ooo: xxx: OOO:"
            });
          });
        });
        return describe("when multiple preset-occurrence created at different timing", function() {
          beforeEach(function() {
            set({
              cursor: [0, 5]
            });
            return ensure('g o', {
              occurrenceText: ['ooo', 'ooo', 'ooo', 'ooo', 'ooo', 'xxx', 'xxx', 'xxx']
            });
          });
          return it("visit occurrences ordered by buffer position", function() {
            ensure("tab", {
              textC: "ooo: xxx: |ooo\n___: ooo: xxx:\nooo: xxx: ooo:"
            });
            ensure("tab", {
              textC: "ooo: xxx: ooo\n___: |ooo: xxx:\nooo: xxx: ooo:"
            });
            ensure("tab", {
              textC: "ooo: xxx: ooo\n___: ooo: |xxx:\nooo: xxx: ooo:"
            });
            ensure("tab", {
              textC: "ooo: xxx: ooo\n___: ooo: xxx:\n|ooo: xxx: ooo:"
            });
            ensure("tab", {
              textC: "ooo: xxx: ooo\n___: ooo: xxx:\nooo: |xxx: ooo:"
            });
            ensure("tab", {
              textC: "ooo: xxx: ooo\n___: ooo: xxx:\nooo: xxx: |ooo:"
            });
            ensure("shift-tab", {
              textC: "ooo: xxx: ooo\n___: ooo: xxx:\nooo: |xxx: ooo:"
            });
            ensure("shift-tab", {
              textC: "ooo: xxx: ooo\n___: ooo: xxx:\n|ooo: xxx: ooo:"
            });
            ensure("shift-tab", {
              textC: "ooo: xxx: ooo\n___: ooo: |xxx:\nooo: xxx: ooo:"
            });
            ensure("shift-tab", {
              textC: "ooo: xxx: ooo\n___: |ooo: xxx:\nooo: xxx: ooo:"
            });
            return ensure("shift-tab", {
              textC: "ooo: xxx: |ooo\n___: ooo: xxx:\nooo: xxx: ooo:"
            });
          });
        });
      });
      describe("explict operator-modifier o and preset-marker", function() {
        beforeEach(function() {
          return set({
            textC: "|ooo: xxx: ooo xxx: ooo:\n___: ooo: xxx: ooo xxx: ooo:"
          });
        });
        describe("'o' modifier when preset occurrence already exists", function() {
          return it("'o' always pick cursor-word and overwrite existing preset marker)", function() {
            ensure("g o", {
              occurrenceText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"]
            });
            ensure("2 w d o", {
              occurrenceText: ["xxx", "xxx", "xxx", "xxx"],
              mode: 'operator-pending'
            });
            return ensure("j", {
              text: "ooo: : ooo : ooo:\n___: ooo: : ooo : ooo:",
              mode: 'normal'
            });
          });
        });
        return describe("occurrence bound operator don't overwite pre-existing preset marker", function() {
          return it("'o' always pick cursor-word and clear existing preset marker", function() {
            ensure("g o", {
              occurrenceText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"]
            });
            ensure("2 w g cmd-d", {
              occurrenceText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"],
              mode: 'operator-pending'
            });
            return ensure("j", {
              selectedText: ["ooo", "ooo", "ooo", "ooo", "ooo", "ooo"]
            });
          });
        });
      });
      return describe("toggle-preset-subword-occurrence commands", function() {
        beforeEach(function() {
          return set({
            textC: "\ncamelCa|se Cases\n\"CaseStudy\" SnakeCase\nUP_CASE\n\nother ParagraphCase"
          });
        });
        return describe("add preset subword-occurrence", function() {
          return it("mark subword under cursor", function() {
            return ensure('g O', {
              occurrenceText: ['Case', 'Case', 'Case', 'Case']
            });
          });
        });
      });
    });
    return describe("linewise-bound-operation in occurrence operation", function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage("language-javascript");
        });
        return runs(function() {
          return set({
            grammar: 'source.js',
            textC: "function hello(name) {\n  console.log(\"debug-1\")\n  |console.log(\"debug-2\")\n\n  const greeting = \"hello\"\n  console.log(\"debug-3\")\n\n  console.log(\"debug-4, includ `console` word\")\n  returrn name + \" \" + greeting\n}"
          });
        });
      });
      describe("with preset-occurrence", function() {
        it("works characterwise for `delete` operator", function() {
          ensure("g o v i f", {
            mode: ['visual', 'linewise']
          });
          return ensure("d", {
            textC: "function hello(name) {\n  |.log(\"debug-1\")\n  .log(\"debug-2\")\n\n  const greeting = \"hello\"\n  .log(\"debug-3\")\n\n  .log(\"debug-4, includ `` word\")\n  returrn name + \" \" + greeting\n}"
          });
        });
        return it("works linewise for `delete-line` operator", function() {
          return ensure("g o v i f D", {
            textC: "function hello(name) {\n|\n  const greeting = \"hello\"\n\n  returrn name + \" \" + greeting\n}"
          });
        });
      });
      describe("when specified both o and V operator-modifier", function() {
        it("delete `console` including line by `V` modifier", function() {
          return ensure("d o V f", {
            textC: "function hello(name) {\n|\n  const greeting = \"hello\"\n\n  returrn name + \" \" + greeting\n}"
          });
        });
        return it("upper-case `console` including line by `V` modifier", function() {
          return ensure("g U o V f", {
            textC: "function hello(name) {\n  CONSOLE.LOG(\"DEBUG-1\")\n  |CONSOLE.LOG(\"DEBUG-2\")\n\n  const greeting = \"hello\"\n  CONSOLE.LOG(\"DEBUG-3\")\n\n  CONSOLE.LOG(\"DEBUG-4, INCLUD `CONSOLE` WORD\")\n  returrn name + \" \" + greeting\n}"
          });
        });
      });
      return describe("with o operator-modifier", function() {
        return it("toggle-line-comments of `occurrence` inclding **lines**", function() {
          ensure("g / o f", {
            textC: "function hello(name) {\n  // console.log(\"debug-1\")\n  // |console.log(\"debug-2\")\n\n  const greeting = \"hello\"\n  // console.log(\"debug-3\")\n\n  // console.log(\"debug-4, includ `console` word\")\n  returrn name + \" \" + greeting\n}"
          });
          return ensure('.', {
            textC: "function hello(name) {\n  console.log(\"debug-1\")\n  |console.log(\"debug-2\")\n\n  const greeting = \"hello\"\n  console.log(\"debug-3\")\n\n  console.log(\"debug-4, includ `console` word\")\n  returrn name + \" \" + greeting\n}"
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvb2NjdXJyZW5jZS1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsTUFBNkMsT0FBQSxDQUFRLGVBQVIsQ0FBN0MsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCLHVCQUF4QixFQUFrQzs7RUFDbEMsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsWUFBVCxFQUF1QixTQUFBO0FBQ3JCLFFBQUE7SUFBQSxPQUF1RSxFQUF2RSxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Qsa0JBQWhELEVBQTBEO0lBQzFELE9BQXNDLEVBQXRDLEVBQUMsc0JBQUQsRUFBZTtJQUNmLGVBQUEsR0FBa0IsU0FBQyxJQUFEO2FBQ2hCLFlBQVksQ0FBQyxVQUFiLENBQXdCLElBQXhCO0lBRGdCO0lBRWxCLHFCQUFBLEdBQXdCLFNBQUMsSUFBRDthQUN0QixRQUFBLENBQVMsbUJBQVQsRUFBOEIsSUFBOUI7SUFEc0I7SUFHeEIsVUFBQSxDQUFXLFNBQUE7TUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7UUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYztRQUNkLFNBQUEsR0FBWSxhQUFhLENBQUM7UUFDMUIsWUFBQSxHQUFlLFFBQVEsQ0FBQyxXQUFXLENBQUM7ZUFDcEMsbUJBQUEsR0FBc0IsUUFBUSxDQUFDLFdBQVcsQ0FBQztNQU5qQyxDQUFaO2FBUUEsSUFBQSxDQUFLLFNBQUE7ZUFDSCxPQUFPLENBQUMsV0FBUixDQUFvQixhQUFwQjtNQURHLENBQUw7SUFUUyxDQUFYO0lBWUEsUUFBQSxDQUFTLDhCQUFULEVBQXlDLFNBQUE7TUFDdkMsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQ0U7VUFBQSxJQUFBLEVBQU0sOEtBQU47U0FERjtNQURTLENBQVg7TUFnQkEsUUFBQSxDQUFTLFlBQVQsRUFBdUIsU0FBQTtlQUNyQixFQUFBLENBQUcscURBQUgsRUFBMEQsU0FBQTtVQUN4RCxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO1dBQUo7VUFDQSxNQUFBLENBQU8sU0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLFFBQU47WUFDQSxLQUFBLEVBQU8sOEpBRFA7V0FERjtVQWVBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLEtBQWxCO1VBQ0EsTUFBQSxDQUFPLFFBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxRQUFOO1lBQ0EsS0FBQSxFQUFPLHNMQURQO1dBREY7aUJBZ0JBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sUUFBTjtZQUNBLEtBQUEsRUFBTyxzTEFEUDtXQURGO1FBbEN3RCxDQUExRDtNQURxQixDQUF2QjtNQW1EQSxRQUFBLENBQVMsWUFBVCxFQUF1QixTQUFBO1FBQ3JCLFVBQUEsQ0FBVyxTQUFBO2lCQUNULEdBQUEsQ0FDRTtZQUFBLEtBQUEsRUFBTyw2RUFBUDtXQURGO1FBRFMsQ0FBWDtlQVVBLEVBQUEsQ0FBRyx1REFBSCxFQUE0RCxTQUFBO1VBQzFELE1BQUEsQ0FBTyxPQUFQLEVBQ0U7WUFBQSxLQUFBLEVBQU8saUVBQVA7V0FERjtpQkFTQSxNQUFBLENBQU8sS0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLDZEQUFQO1dBREY7UUFWMEQsQ0FBNUQ7TUFYcUIsQ0FBdkI7TUErQkEsUUFBQSxDQUFTLHdEQUFULEVBQW1FLFNBQUE7UUFDakUsVUFBQSxDQUFXLFNBQUE7aUJBQ1QsR0FBQSxDQUNFO1lBQUEsS0FBQSxFQUFPLHFGQUFQO1dBREY7UUFEUyxDQUFYO1FBUUEsRUFBQSxDQUFHLHVCQUFILEVBQTRCLFNBQUE7VUFDMUIsTUFBQSxDQUFPLFdBQVAsRUFDRTtZQUFBLEtBQUEsRUFBTyxxRkFBUDtXQURGO1VBT0EsTUFBQSxDQUFPLE9BQVAsRUFDRTtZQUFBLEtBQUEsRUFBTyxxRkFBUDtXQURGO2lCQU9BLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7WUFBQSxLQUFBLEVBQU8scUZBQVA7V0FERjtRQWYwQixDQUE1QjtlQXVCQSxRQUFBLENBQVMsK0JBQVQsRUFBMEMsU0FBQTtVQUN4QyxVQUFBLENBQVcsU0FBQTttQkFDVCxHQUFBLENBQ0U7Y0FBQSxLQUFBLEVBQU8sa0NBQVA7YUFERjtVQURTLENBQVg7VUFRQSxFQUFBLENBQUcseURBQUgsRUFBOEQsU0FBQTttQkFDNUQsTUFBQSxDQUFPLE9BQVAsRUFDRTtjQUFBLEtBQUEsRUFBTyx5QkFBUDthQURGO1VBRDRELENBQTlEO1VBUUEsRUFBQSxDQUFHLHlEQUFILEVBQThELFNBQUE7bUJBQzVELE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxLQUFBLEVBQU8seUJBQVA7YUFERjtVQUQ0RCxDQUE5RDtpQkFRQSxFQUFBLENBQUcsaUVBQUgsRUFBc0UsU0FBQTtZQUNwRSxNQUFBLENBQU8sS0FBUCxFQUFjO2NBQUEsY0FBQSxFQUFnQixDQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZixDQUFoQjtjQUF1QyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUEvQzthQUFkO1lBQ0EsU0FBQSxDQUFVLEdBQVYsRUFBZTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBZjttQkFDQSxNQUFBLENBQU8sS0FBUCxFQUNFO2NBQUEsS0FBQSxFQUFPLHlCQUFQO2FBREY7VUFIb0UsQ0FBdEU7UUF6QndDLENBQTFDO01BaENpRSxDQUFuRTtNQW9FQSxRQUFBLENBQVMsZ0RBQVQsRUFBMkQsU0FBQTtBQUN6RCxZQUFBO1FBQUEsWUFBQSxHQUFlO1FBQ2YsU0FBQSxHQUFZLFlBQVksQ0FBQyxPQUFiLENBQXFCLE9BQXJCLEVBQThCLEVBQTlCO1FBRVosVUFBQSxDQUFXLFNBQUE7aUJBQ1QsR0FBQSxDQUFJO1lBQUEsSUFBQSxFQUFNLFlBQU47V0FBSjtRQURTLENBQVg7UUFHQSxFQUFBLENBQUcscUJBQUgsRUFBMEIsU0FBQTtVQUFHLEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7V0FBSjtpQkFBb0IsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7WUFBQSxJQUFBLEVBQU0sU0FBTjtXQUFoQjtRQUF2QixDQUExQjtRQUNBLEVBQUEsQ0FBRyxzQkFBSCxFQUEyQixTQUFBO1VBQUcsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO2lCQUFvQixNQUFBLENBQU8sT0FBUCxFQUFnQjtZQUFBLElBQUEsRUFBTSxTQUFOO1dBQWhCO1FBQXZCLENBQTNCO1FBQ0EsRUFBQSxDQUFHLG9CQUFILEVBQXlCLFNBQUE7VUFBRyxHQUFBLENBQUk7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksRUFBSixDQUFSO1dBQUo7aUJBQXFCLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO1lBQUEsSUFBQSxFQUFNLFNBQU47V0FBaEI7UUFBeEIsQ0FBekI7ZUFDQSxFQUFBLENBQUcsdUJBQUgsRUFBNEIsU0FBQTtVQUFHLEdBQUEsQ0FBSTtZQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7V0FBSjtpQkFBcUIsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7WUFBQSxJQUFBLEVBQU0sU0FBTjtXQUFoQjtRQUF4QixDQUE1QjtNQVZ5RCxDQUEzRDthQVlBLFFBQUEsQ0FBUyxtQkFBVCxFQUE4QixTQUFBO1FBQzVCLFVBQUEsQ0FBVyxTQUFBO2lCQUNULEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSw2QkFBTjtXQURGO1FBRFMsQ0FBWDtlQUtBLFFBQUEsQ0FBUyxzQkFBVCxFQUFpQyxTQUFBO0FBQy9CLGNBQUE7VUFBQSxnQkFBQSxHQUFtQixTQUFDLFlBQUQsRUFBZSxHQUFmO0FBQ2pCLGdCQUFBO1lBRGlDLGVBQUQ7WUFDaEMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLFlBQVI7YUFBSjtZQUNBLE1BQUEsQ0FBTyxhQUFQLEVBQ0U7Y0FBQSxZQUFBLEVBQWMsWUFBZDtjQUNBLElBQUEsRUFBTSxDQUFDLFFBQUQsRUFBVyxlQUFYLENBRE47YUFERjttQkFHQSxNQUFBLENBQU8sUUFBUCxFQUFpQjtjQUFBLElBQUEsRUFBTSxRQUFOO2FBQWpCO1VBTGlCO1VBT25CLFFBQUEsQ0FBUywwQkFBVCxFQUFxQyxTQUFBO21CQUNuQyxFQUFBLENBQUcsMERBQUgsRUFBK0QsU0FBQTtjQUM3RCxnQkFBQSxDQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLEVBQXlCO2dCQUFBLFlBQUEsRUFBYyxDQUFDLEtBQUQsRUFBUSxLQUFSLENBQWQ7ZUFBekI7Y0FDQSxnQkFBQSxDQUFpQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpCLEVBQXlCO2dCQUFBLFlBQUEsRUFBYyxDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixDQUFkO2VBQXpCO2NBQ0EsZ0JBQUEsQ0FBaUIsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFqQixFQUF5QjtnQkFBQSxZQUFBLEVBQWMsQ0FBQyxNQUFELEVBQVMsTUFBVCxDQUFkO2VBQXpCO3FCQUNBLGdCQUFBLENBQWlCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBakIsRUFBeUI7Z0JBQUEsWUFBQSxFQUFjLENBQUMsTUFBRCxFQUFTLE1BQVQsQ0FBZDtlQUF6QjtZQUo2RCxDQUEvRDtVQURtQyxDQUFyQztVQU9BLFFBQUEsQ0FBUyw2Q0FBVCxFQUF3RCxTQUFBO21CQUN0RCxFQUFBLENBQUcsOEJBQUgsRUFBbUMsU0FBQTtjQUNqQyxHQUFBLENBQ0U7Z0JBQUEsSUFBQSxFQUFNLDJCQUFOO2dCQUlBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBSlI7ZUFERjtxQkFNQSxNQUFBLENBQU8sU0FBUCxFQUNFO2dCQUFBLElBQUEsRUFBTSxzQkFBTjtlQURGO1lBUGlDLENBQW5DO1VBRHNELENBQXhEO2lCQWNBLFFBQUEsQ0FBUywyQ0FBVCxFQUFzRCxTQUFBO21CQUNwRCxFQUFBLENBQUcsK0RBQUgsRUFBb0UsU0FBQTtjQUNsRSxHQUFBLENBQ0U7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtnQkFDQSxLQUFBLEVBQU8sMkNBRFA7ZUFERjtxQkFNQSxNQUFBLENBQU8sU0FBUCxFQUNFO2dCQUFBLEtBQUEsRUFBTywrQkFBUDtlQURGO1lBUGtFLENBQXBFO1VBRG9ELENBQXREO1FBN0IrQixDQUFqQztNQU40QixDQUE5QjtJQW5MdUMsQ0FBekM7SUFvT0EsUUFBQSxDQUFTLDJCQUFULEVBQXNDLFNBQUE7TUFDcEMsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQ0U7VUFBQSxLQUFBLEVBQU8sbUNBQVA7U0FERjtNQURTLENBQVg7TUFTQSxRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTtlQUNoQyxFQUFBLENBQUcsK0NBQUgsRUFBb0QsU0FBQTtpQkFDbEQsTUFBQSxDQUFPLFNBQVAsRUFDRTtZQUFBLEtBQUEsRUFBTyxtQ0FBUDtXQURGO1FBRGtELENBQXBEO01BRGdDLENBQWxDO2FBVUEsUUFBQSxDQUFTLFlBQVQsRUFBdUIsU0FBQTtRQUNyQixVQUFBLENBQVcsU0FBQTtpQkFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLGtCQUFiLEVBQWlDLEtBQWpDO1FBRFMsQ0FBWDtlQUdBLEVBQUEsQ0FBRywrREFBSCxFQUFvRSxTQUFBO2lCQUNsRSxNQUFBLENBQU8sU0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLG1DQUFQO1dBREY7UUFEa0UsQ0FBcEU7TUFKcUIsQ0FBdkI7SUFwQm9DLENBQXRDO0lBa0NBLFFBQUEsQ0FBUyw4QkFBVCxFQUF5QyxTQUFBO01BQ3ZDLFVBQUEsQ0FBVyxTQUFBO2VBQ1QsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLGdGQUFOO1VBTUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FOUjtTQURGO01BRFMsQ0FBWDtNQVVBLFFBQUEsQ0FBUyx3QkFBVCxFQUFtQyxTQUFBO2VBQ2pDLEVBQUEsQ0FBRyx1RUFBSCxFQUE0RSxTQUFBO1VBQzFFLE1BQUEsQ0FBTyxhQUFQLEVBQ0U7WUFBQSxZQUFBLEVBQWMsQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsS0FBdEIsRUFBNkIsS0FBN0IsQ0FBZDtZQUNBLElBQUEsRUFBTSxDQUFDLFFBQUQsRUFBVyxlQUFYLENBRE47V0FERjtpQkFJQSxNQUFBLENBQU8sR0FBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLGdGQUFOO1lBTUEsVUFBQSxFQUFZLENBTlo7WUFPQSxJQUFBLEVBQU0sUUFQTjtXQURGO1FBTDBFLENBQTVFO01BRGlDLENBQW5DO01BZ0JBLFFBQUEsQ0FBUyx3QkFBVCxFQUFtQyxTQUFBO2VBQ2pDLEVBQUEsQ0FBRyx1RUFBSCxFQUE0RSxTQUFBO1VBQzFFLE1BQUEsQ0FBTyxpQkFBUCxFQUNFO1lBQUEsWUFBQSxFQUFjLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLEtBQXRCLENBQWQ7WUFDQSxJQUFBLEVBQU0sQ0FBQyxRQUFELEVBQVcsZUFBWCxDQUROO1dBREY7aUJBSUEsTUFBQSxDQUFPLEdBQVAsRUFDRTtZQUFBLElBQUEsRUFBTSxnRkFBTjtZQU1BLFVBQUEsRUFBWSxDQU5aO1lBT0EsSUFBQSxFQUFNLFFBUE47V0FERjtRQUwwRSxDQUE1RTtNQURpQyxDQUFuQzthQWdCQSxRQUFBLENBQVMsd0JBQVQsRUFBbUMsU0FBQTtRQUNqQyxFQUFBLENBQUcsdUVBQUgsRUFBNEUsU0FBQTtpQkFDMUUsTUFBQSxDQUFPLDBCQUFQLEVBQ0U7WUFBQSxJQUFBLEVBQU0sZ0ZBQU47WUFNQSxVQUFBLEVBQVksQ0FOWjtXQURGO1FBRDBFLENBQTVFO2VBVUEsRUFBQSxDQUFHLGdDQUFILEVBQXFDLFNBQUE7aUJBQ25DLE1BQUEsQ0FBTywwQkFBUCxFQUNFO1lBQUEsSUFBQSxFQUFNLGdGQUFOO1lBTUEsVUFBQSxFQUFZLENBTlo7V0FERjtRQURtQyxDQUFyQztNQVhpQyxDQUFuQztJQTNDdUMsQ0FBekM7SUFnRUEsUUFBQSxDQUFTLDhGQUFULEVBQXlHLFNBQUE7TUFDdkcsVUFBQSxDQUFXLFNBQUE7UUFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLG1CQUFiLEVBQWtDLElBQWxDO2VBQ0EsR0FBQSxDQUNFO1VBQUEsSUFBQSxFQUFNLHVGQUFOO1VBTUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FOUjtTQURGO01BRlMsQ0FBWDtNQVdBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO1FBQzNCLEVBQUEsQ0FBRyxvQ0FBSCxFQUF5QyxTQUFBO1VBQ3ZDLFNBQUEsQ0FBVSxHQUFWO1VBQ0EsZUFBQSxDQUFnQixVQUFoQjtVQUNBLHFCQUFBLENBQXNCLDZDQUF0QjtpQkFDQSxNQUFBLENBQU8sS0FBUCxFQUNFO1lBQUEsWUFBQSxFQUFjLENBQUMsTUFBRCxFQUFTLEtBQVQsRUFBZ0IsTUFBaEIsQ0FBZDtZQUNBLElBQUEsRUFBTSxDQUFDLFFBQUQsRUFBVyxlQUFYLENBRE47V0FERjtRQUp1QyxDQUF6QztlQVFBLEVBQUEsQ0FBRyxvQ0FBSCxFQUF5QyxTQUFBO1VBQ3ZDLFNBQUEsQ0FBVSxHQUFWO1VBQ0EsZUFBQSxDQUFnQixRQUFoQjtVQUNBLHFCQUFBLENBQXNCLDZDQUF0QjtVQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7WUFBQSxJQUFBLEVBQU0sUUFBTjtXQUFkO1VBQ0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsT0FBbEI7aUJBQ0EsTUFBQSxDQUNFO1lBQUEsSUFBQSxFQUFNLDZGQUFOO1dBREY7UUFOdUMsQ0FBekM7TUFUMkIsQ0FBN0I7TUF1QkEsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7UUFDM0IsUUFBQSxDQUFTLHNCQUFULEVBQWlDLFNBQUE7aUJBQy9CLEVBQUEsQ0FBRyx5Q0FBSCxFQUE4QyxTQUFBO1lBQzVDLFNBQUEsQ0FBVSxPQUFWO1lBQ0EsZUFBQSxDQUFnQixJQUFoQjtZQUNBLHFCQUFBLENBQXNCLDZDQUF0QjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUNFO2NBQUEsSUFBQSxFQUFNLHVGQUFOO2FBREY7VUFKNEMsQ0FBOUM7UUFEK0IsQ0FBakM7UUFhQSxRQUFBLENBQVMsaUJBQVQsRUFBNEIsU0FBQTtpQkFDMUIsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7WUFDNUMsU0FBQSxDQUFVLE9BQVY7WUFDQSxlQUFBLENBQWdCLElBQWhCO1lBQ0EscUJBQUEsQ0FBc0IsNkNBQXRCO21CQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sdUZBQU47YUFERjtVQUo0QyxDQUE5QztRQUQwQixDQUE1QjtlQWFBLFFBQUEsQ0FBUyxrQkFBVCxFQUE2QixTQUFBO2lCQUMzQixFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtZQUM1QyxHQUFBLENBQUk7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQUo7WUFDQSxTQUFBLENBQVUsb0JBQVY7WUFDQSxlQUFBLENBQWdCLElBQWhCO1lBQ0EscUJBQUEsQ0FBc0IsNkNBQXRCO21CQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sdUZBQU47YUFERjtVQUw0QyxDQUE5QztRQUQyQixDQUE3QjtNQTNCMkIsQ0FBN0I7TUF5Q0EsUUFBQSxDQUFTLGdDQUFULEVBQTJDLFNBQUE7UUFDekMsVUFBQSxDQUFXLFNBQUE7VUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQ0U7WUFBQSxrREFBQSxFQUNFO2NBQUEsR0FBQSxFQUFLLDJDQUFMO2FBREY7V0FERjtVQUlBLEdBQUEsQ0FDRTtZQUFBLElBQUEsRUFBTSxzRkFBTjtZQU1BLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBTlI7V0FERjtpQkFTQSxNQUFBLENBQU8sYUFBUCxFQUNFO1lBQUEsOEJBQUEsRUFBZ0MsQ0FDOUIsQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQsRUFBUyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVQsQ0FEOEIsRUFFOUIsQ0FBQyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQUQsRUFBUyxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVQsQ0FGOEIsQ0FBaEM7V0FERjtRQWRTLENBQVg7UUFvQkEsUUFBQSxDQUFTLDZCQUFULEVBQXdDLFNBQUE7aUJBQ3RDLEVBQUEsQ0FBRywrQ0FBSCxFQUFvRCxTQUFBO1lBQ2xELEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBSjtZQUNBLFNBQUEsQ0FBVSxHQUFWO1lBQ0EsZUFBQSxDQUFnQixLQUFoQjtZQUNBLHFCQUFBLENBQXNCLDZDQUF0QjttQkFDQSxNQUFBLENBQU8sR0FBUCxFQUNFO2NBQUEsSUFBQSxFQUFNLHNGQUFOO2NBTUEsd0JBQUEsRUFBMEIsQ0FOMUI7YUFERjtVQUxrRCxDQUFwRDtRQURzQyxDQUF4QztlQWVBLFFBQUEsQ0FBUywyQ0FBVCxFQUFzRCxTQUFBO2lCQUNwRCxFQUFBLENBQUcsb0NBQUgsRUFBeUMsU0FBQTtZQUN2QyxHQUFBLENBQUk7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2FBQUo7WUFDQSxTQUFBLENBQVUsU0FBVjtZQUNBLGVBQUEsQ0FBZ0IsS0FBaEI7WUFDQSxxQkFBQSxDQUFzQiw2Q0FBdEI7bUJBQ0EsTUFBQSxDQUFPLEdBQVAsRUFDRTtjQUFBLElBQUEsRUFBTSxzRkFBTjtjQU1BLHdCQUFBLEVBQTBCLENBTjFCO2FBREY7VUFMdUMsQ0FBekM7UUFEb0QsQ0FBdEQ7TUFwQ3lDLENBQTNDO2FBbURBLFFBQUEsQ0FBUyx1REFBVCxFQUFrRSxTQUFBO0FBQ2hFLFlBQUE7UUFBQyxhQUFjO1FBQ2YsU0FBQSxDQUFVLFNBQUE7aUJBQ1IsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsVUFBbEI7UUFEUSxDQUFWO1FBR0EsVUFBQSxDQUFXLFNBQUE7VUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQWIsQ0FBaUIsNkJBQWpCLEVBQ0U7WUFBQSxrREFBQSxFQUNFO2NBQUEsR0FBQSxFQUFLLDJDQUFMO2FBREY7V0FERjtVQUlBLGVBQUEsQ0FBZ0IsU0FBQTttQkFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsd0JBQTlCO1VBRGMsQ0FBaEI7VUFHQSxJQUFBLENBQUssU0FBQTtZQUNILFVBQUEsR0FBYSxNQUFNLENBQUMsVUFBUCxDQUFBO21CQUNiLE1BQU0sQ0FBQyxVQUFQLENBQWtCLElBQUksQ0FBQyxRQUFRLENBQUMsbUJBQWQsQ0FBa0MsZUFBbEMsQ0FBbEI7VUFGRyxDQUFMO2lCQUlBLEdBQUEsQ0FBSTtZQUFBLElBQUEsRUFBTSxpaUJBQU47V0FBSjtRQVpTLENBQVg7ZUFnQ0EsRUFBQSxDQUFHLHdEQUFILEVBQTZELFNBQUE7VUFDM0QsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO1VBQ0EsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7WUFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksRUFBSixDQUFSO1dBQWhCO1VBRUEsSUFBQSxDQUFLLFNBQUE7QUFDSCxnQkFBQTtZQUFBLFNBQUEsQ0FBVSxDQUNSLFNBRFEsRUFFUixLQUZRLEVBR1IsR0FIUSxDQUlULENBQUMsSUFKUSxDQUlILEdBSkcsQ0FBVjtZQU1BLGtCQUFBLEdBQXFCLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxxQkFBN0IsQ0FBQSxDQUFvRCxDQUFDLEdBQXJELENBQXlELFNBQUMsS0FBRDtxQkFDNUUsTUFBTSxDQUFDLG9CQUFQLENBQTRCLEtBQTVCO1lBRDRFLENBQXpEO1lBRXJCLGdDQUFBLEdBQW1DLGtCQUFrQixDQUFDLEtBQW5CLENBQXlCLFNBQUMsSUFBRDtxQkFBVSxJQUFBLEtBQVE7WUFBbEIsQ0FBekI7WUFDbkMsTUFBQSxDQUFPLGdDQUFQLENBQXdDLENBQUMsSUFBekMsQ0FBOEMsSUFBOUM7WUFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLG1CQUFtQixDQUFDLFVBQTdCLENBQUEsQ0FBUCxDQUFpRCxDQUFDLFlBQWxELENBQStELEVBQS9EO1lBRUEsU0FBQSxDQUFVLEtBQVY7WUFDQSxNQUFBLENBQU8sWUFBUCxFQUFxQjtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7YUFBckI7WUFDQSxTQUFBLENBQVUsR0FBVjttQkFDQSxNQUFBLENBQU8sUUFBUSxDQUFDLG1CQUFtQixDQUFDLFVBQTdCLENBQUEsQ0FBUCxDQUFpRCxDQUFDLFlBQWxELENBQStELEVBQS9EO1VBaEJHLENBQUw7VUFrQkEsUUFBQSxDQUFTLFNBQUE7bUJBQ1AsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsMEJBQW5CO1VBRE8sQ0FBVDtpQkFHQSxJQUFBLENBQUssU0FBQTtZQUNILFNBQUEsQ0FBVSxjQUFWO1lBRUEsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsR0FBbEI7bUJBQ0EsTUFBQSxDQUFPLFFBQVAsRUFDRTtjQUFBLElBQUEsRUFBTSwyaUJBQU47YUFERjtVQUpHLENBQUw7UUF6QjJELENBQTdEO01BckNnRSxDQUFsRTtJQS9IdUcsQ0FBekc7SUFzTkEsUUFBQSxDQUFTLDBCQUFULEVBQXFDLFNBQUE7TUFDbkMsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQ0U7VUFBQSxJQUFBLEVBQU0sdURBQU47VUFHQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUhSO1NBREY7TUFEUyxDQUFYO01BT0EsUUFBQSxDQUFTLG1DQUFULEVBQThDLFNBQUE7UUFDNUMsUUFBQSxDQUFTLGdCQUFULEVBQTJCLFNBQUE7VUFDekIsUUFBQSxDQUFTLHVCQUFULEVBQWtDLFNBQUE7bUJBQ2hDLEVBQUEsQ0FBRyxpRUFBSCxFQUFzRSxTQUFBO2NBQ3BFLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsY0FBQSxFQUFnQixNQUFoQjtnQkFBd0IsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBaEM7ZUFBZDtjQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFaO3FCQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsY0FBQSxFQUFnQixDQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLE1BQWpCLEVBQXlCLE1BQXpCLENBQWhCO2dCQUFrRCxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExRDtlQUFkO1lBSG9FLENBQXRFO1VBRGdDLENBQWxDO1VBTUEsUUFBQSxDQUFTLDBCQUFULEVBQXFDLFNBQUE7WUFDbkMsRUFBQSxDQUFHLDBDQUFILEVBQStDLFNBQUE7Y0FDN0MsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxjQUFBLEVBQWdCLE1BQWhCO2dCQUF3QixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFoQztlQUFkO2NBQ0EsTUFBQSxDQUFPLEdBQVAsRUFBWTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQVo7Y0FDQSxNQUFBLENBQU8sS0FBUCxFQUFjO2dCQUFBLGNBQUEsRUFBZ0IsQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixNQUFqQixFQUF5QixNQUF6QixDQUFoQjtnQkFBa0QsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBMUQ7ZUFBZDtjQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsY0FBQSxFQUFnQixDQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLE1BQWpCLENBQWhCO2dCQUEwQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFsRDtlQUFkO3FCQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO2dCQUFBLGNBQUEsRUFBZ0IsQ0FBQyxNQUFELEVBQVMsTUFBVCxDQUFoQjtnQkFBa0MsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBMUM7ZUFBaEI7WUFMNkMsQ0FBL0M7WUFNQSxFQUFBLENBQUcsaURBQUgsRUFBc0QsU0FBQTtjQUNwRCxNQUFBLENBQU8sS0FBUCxFQUFjO2dCQUFBLGNBQUEsRUFBZ0IsTUFBaEI7Z0JBQXdCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWhDO2VBQWQ7Y0FDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBWjtjQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsY0FBQSxFQUFnQixDQUFDLE1BQUQsRUFBUyxNQUFULEVBQWlCLE1BQWpCLEVBQXlCLE1BQXpCLENBQWhCO2dCQUFrRCxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUExRDtlQUFkO3FCQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQWlCO2dCQUFBLGVBQUEsRUFBaUIsQ0FBakI7ZUFBakI7WUFKb0QsQ0FBdEQ7bUJBTUEsRUFBQSxDQUFHLHNEQUFILEVBQTJELFNBQUE7Y0FDekQsTUFBQSxDQUFPLFdBQVAsRUFBb0I7Z0JBQUEsY0FBQSxFQUFnQixDQUFDLElBQUQsRUFBTyxJQUFQLEVBQWEsSUFBYixDQUFoQjtnQkFBb0MsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBNUM7ZUFBcEI7Y0FDQSxNQUFBLENBQU8sUUFBUCxFQUFpQjtnQkFBQSxlQUFBLEVBQWlCLENBQWpCO2VBQWpCO2NBQ0EsTUFBQSxDQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBckIsQ0FBeUIsdUJBQXpCLENBQVAsQ0FBeUQsQ0FBQyxPQUExRCxDQUFrRSxLQUFsRTtjQUVBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjtlQUFaO2NBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxjQUFBLEVBQWdCLENBQUMsSUFBRCxFQUFPLElBQVAsRUFBYSxJQUFiLENBQWhCO2dCQUFvQyxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksRUFBSixDQUE1QztlQUFkO2NBR0EsTUFBQSxDQUFPLFNBQVAsRUFBa0I7Z0JBQUEsS0FBQSxFQUFPLHdEQUFQO2VBQWxCO3FCQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQXJCLENBQXlCLHVCQUF6QixDQUFQLENBQXlELENBQUMsT0FBMUQsQ0FBa0UsS0FBbEU7WUFWeUQsQ0FBM0Q7VUFibUMsQ0FBckM7VUF5QkEsUUFBQSxDQUFTLHNGQUFULEVBQWlHLFNBQUE7WUFDL0YsVUFBQSxDQUFXLFNBQUE7cUJBQ1QsR0FBQSxDQUNFO2dCQUFBLEtBQUEsRUFBTyxpQ0FBUDtlQURGO1lBRFMsQ0FBWDtZQVFBLEVBQUEsQ0FBRyw2REFBSCxFQUFrRSxTQUFBO2NBQ2hFLEdBQUEsQ0FBSTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQUo7Y0FDQSxNQUFBLENBQU8sS0FBUCxFQUFjO2dCQUFBLGNBQUEsRUFBZ0IsQ0FBQyxPQUFELEVBQVUsT0FBVixDQUFoQjtlQUFkO2NBQ0EsTUFBQSxDQUFPLFFBQVAsRUFBaUI7Z0JBQUEsZUFBQSxFQUFpQixDQUFqQjtlQUFqQjtxQkFDQSxNQUFBLENBQU8sS0FBUCxFQUFjO2dCQUFBLGNBQUEsRUFBZ0IsQ0FBQyxPQUFELEVBQVUsT0FBVixDQUFoQjtlQUFkO1lBSmdFLENBQWxFO1lBTUEsRUFBQSxDQUFHLDZEQUFILEVBQWtFLFNBQUE7Y0FDaEUsR0FBQSxDQUFJO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBSjtjQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO2dCQUFBLFlBQUEsRUFBYyxPQUFkO2VBQWhCO2NBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxjQUFBLEVBQWdCLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEIsT0FBNUIsQ0FBaEI7ZUFBZDtjQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQWlCO2dCQUFBLGVBQUEsRUFBaUIsQ0FBakI7ZUFBakI7cUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxjQUFBLEVBQWdCLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsRUFBNEIsT0FBNUIsQ0FBaEI7ZUFBZDtZQUxnRSxDQUFsRTttQkFPQSxFQUFBLENBQUcsNkRBQUgsRUFBa0UsU0FBQTtjQUNoRSxHQUFBLENBQUk7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUFKO2NBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxjQUFBLEVBQWdCLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsQ0FBaEI7ZUFBZDtjQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQWlCO2dCQUFBLGVBQUEsRUFBaUIsQ0FBakI7ZUFBakI7cUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxjQUFBLEVBQWdCLENBQUMsT0FBRCxFQUFVLE9BQVYsRUFBbUIsT0FBbkIsQ0FBaEI7ZUFBZDtZQUpnRSxDQUFsRTtVQXRCK0YsQ0FBakc7aUJBNEJBLFFBQUEsQ0FBUywwQkFBVCxFQUFxQyxTQUFBO1lBQ25DLFFBQUEsQ0FBUyxxREFBVCxFQUFnRSxTQUFBO3FCQUM5RCxFQUFBLENBQUcsMkVBQUgsRUFBZ0YsU0FBQTtnQkFDOUUsTUFBQSxDQUFPLFNBQVMsQ0FBQyxRQUFWLENBQW1CLGdCQUFuQixDQUFQLENBQTRDLENBQUMsSUFBN0MsQ0FBa0QsS0FBbEQ7Z0JBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztrQkFBQSxjQUFBLEVBQWdCLE1BQWhCO2tCQUF3QixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFoQztpQkFBZDtnQkFDQSxNQUFBLENBQU8sU0FBUyxDQUFDLFFBQVYsQ0FBbUIsZ0JBQW5CLENBQVAsQ0FBNEMsQ0FBQyxJQUE3QyxDQUFrRCxJQUFsRDtnQkFDQSxNQUFBLENBQU8sS0FBUCxFQUFjO2tCQUFBLGVBQUEsRUFBaUIsQ0FBakI7a0JBQW9CLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQTVCO2lCQUFkO3VCQUNBLE1BQUEsQ0FBTyxTQUFTLENBQUMsUUFBVixDQUFtQixnQkFBbkIsQ0FBUCxDQUE0QyxDQUFDLElBQTdDLENBQWtELEtBQWxEO2NBTDhFLENBQWhGO1lBRDhELENBQWhFO21CQVFBLFFBQUEsQ0FBUywyQkFBVCxFQUFzQyxTQUFBO0FBQ3BDLGtCQUFBO2NBQUEsa0JBQUEsR0FBcUI7Y0FDckIsVUFBQSxDQUFXLFNBQUE7dUJBQ1Qsa0JBQUEsR0FBcUI7Y0FEWixDQUFYO3FCQUdBLEVBQUEsQ0FBRyxvREFBSCxFQUF5RCxTQUFBO2dCQUN2RCxJQUFBLENBQUssU0FBQTtrQkFDSCxNQUFBLENBQU8sU0FBUyxDQUFDLFFBQVYsQ0FBbUIsZ0JBQW5CLENBQVAsQ0FBNEMsQ0FBQyxJQUE3QyxDQUFrRCxLQUFsRDtrQkFDQSxNQUFBLENBQU8sS0FBUCxFQUFjO29CQUFBLGNBQUEsRUFBZ0IsTUFBaEI7b0JBQXdCLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWhDO21CQUFkO2tCQUNBLE1BQUEsQ0FBTyxTQUFTLENBQUMsUUFBVixDQUFtQixnQkFBbkIsQ0FBUCxDQUE0QyxDQUFDLElBQTdDLENBQWtELElBQWxEO2tCQUVBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7b0JBQUEsSUFBQSxFQUFNLFFBQU47bUJBQWQ7a0JBQ0EsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxXQUF2QyxDQUFtRCxTQUFBOzJCQUNqRCxrQkFBQSxHQUFxQjtrQkFENEIsQ0FBbkQ7a0JBR0EsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEI7eUJBQ0EsTUFBQSxDQUFPLFFBQVAsRUFDRTtvQkFBQSxLQUFBLEVBQU8sMERBQVA7b0JBQ0EsSUFBQSxFQUFNLFFBRE47bUJBREY7Z0JBVkcsQ0FBTDtnQkFjQSxRQUFBLENBQVMsU0FBQTt5QkFDUDtnQkFETyxDQUFUO3VCQUdBLElBQUEsQ0FBSyxTQUFBO2tCQUNILE1BQUEsQ0FBTztvQkFBQSxlQUFBLEVBQWlCLENBQWpCO21CQUFQO3lCQUNBLE1BQUEsQ0FBTyxTQUFTLENBQUMsUUFBVixDQUFtQixnQkFBbkIsQ0FBUCxDQUE0QyxDQUFDLElBQTdDLENBQWtELEtBQWxEO2dCQUZHLENBQUw7Y0FsQnVELENBQXpEO1lBTG9DLENBQXRDO1VBVG1DLENBQXJDO1FBNUR5QixDQUEzQjtRQWdHQSxRQUFBLENBQVMsZ0JBQVQsRUFBMkIsU0FBQTtVQUN6QixRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTttQkFDaEMsRUFBQSxDQUFHLG1FQUFILEVBQXdFLFNBQUE7Y0FDdEUsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7Z0JBQUEsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLGVBQVgsQ0FBTjtnQkFBbUMsWUFBQSxFQUFjLElBQWpEO2VBQWhCO3FCQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsSUFBQSxFQUFNLFFBQU47Z0JBQWdCLGNBQUEsRUFBZ0IsQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLElBQWIsQ0FBaEM7ZUFBZDtZQUZzRSxDQUF4RTtVQURnQyxDQUFsQztpQkFJQSxRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTtBQUNoQyxnQkFBQTtZQUFDLGVBQWdCO1lBQ2pCLFVBQUEsQ0FBVyxTQUFBO2NBQ1QsWUFBQSxHQUFlO3FCQUlmLEdBQUEsQ0FDRTtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2dCQUNBLElBQUEsRUFBTSxZQUROO2VBREY7WUFMUyxDQUFYO21CQVFBLEVBQUEsQ0FBRyxtRUFBSCxFQUF3RSxTQUFBO2NBQ3RFLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO2dCQUFBLElBQUEsRUFBTSxDQUFDLFFBQUQsRUFBVyxVQUFYLENBQU47Z0JBQThCLFlBQUEsRUFBYyxZQUE1QztlQUFoQjtjQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7Z0JBQUEsSUFBQSxFQUFNLENBQUMsUUFBRCxFQUFXLFVBQVgsQ0FBTjtnQkFDQSxZQUFBLEVBQWMsWUFEZDtnQkFFQSxjQUFBLEVBQWdCLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUIsTUFBakIsRUFBeUIsTUFBekIsRUFBaUMsTUFBakMsRUFBeUMsTUFBekMsQ0FGaEI7ZUFERjtxQkFJQSxNQUFBLENBQU8sS0FBUCxFQUNFO2dCQUFBLElBQUEsRUFBTSxRQUFOO2dCQUNBLElBQUEsRUFBTSxnSEFETjtlQURGO1lBTnNFLENBQXhFO1VBVmdDLENBQWxDO1FBTHlCLENBQTNCO2VBNEJBLFFBQUEsQ0FBUyx1QkFBVCxFQUFrQyxTQUFBO1VBQ2hDLFVBQUEsQ0FBVyxTQUFBO21CQUNULFFBQVEsQ0FBQyxHQUFULENBQWEsbUJBQWIsRUFBa0MsSUFBbEM7VUFEUyxDQUFYO2lCQUdBLFFBQUEsQ0FBUyxvQ0FBVCxFQUErQyxTQUFBO21CQUM3QyxFQUFBLENBQUcsNkRBQUgsRUFBa0UsU0FBQTtjQUNoRSxTQUFBLENBQVUsR0FBVjtjQUNBLGVBQUEsQ0FBZ0IsVUFBaEI7Y0FDQSxxQkFBQSxDQUFzQixrREFBdEI7cUJBQ0EsTUFBQSxDQUNFO2dCQUFBLGNBQUEsRUFBZ0IsQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixLQUFqQixFQUF3QixNQUF4QixDQUFoQjtlQURGO1lBSmdFLENBQWxFO1VBRDZDLENBQS9DO1FBSmdDLENBQWxDO01BN0g0QyxDQUE5QztNQXlJQSxRQUFBLENBQVMsMEJBQVQsRUFBcUMsU0FBQTtRQUNuQyxVQUFBLENBQVcsU0FBQTtVQUNULEdBQUEsQ0FBSTtZQUFBLElBQUEsRUFBTSx1REFBTjtXQUFKO2lCQUlBO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjs7UUFMUyxDQUFYO1FBT0EsUUFBQSxDQUFTLGFBQVQsRUFBd0IsU0FBQTtVQUN0QixFQUFBLENBQUcsd0VBQUgsRUFBNkUsU0FBQTttQkFDM0UsTUFBQSxDQUFPLFNBQVAsRUFDRTtjQUFBLElBQUEsRUFBTSw4Q0FBTjthQURGO1VBRDJFLENBQTdFO1VBTUEsRUFBQSxDQUFHLHdFQUFILEVBQTZFLFNBQUE7WUFDM0UsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxhQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sdURBQU47YUFERjtVQUYyRSxDQUE3RTtVQU9BLEVBQUEsQ0FBRywrQ0FBSCxFQUFvRCxTQUFBO1lBQ2xELEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7YUFBSjtZQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Y0FBQSxlQUFBLEVBQWlCLENBQWpCO2FBQWQ7WUFDQSxNQUFBLENBQU8sS0FBUCxFQUFjO2NBQUEsZUFBQSxFQUFpQixDQUFqQjthQUFkO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sdURBQU47YUFERjtVQUprRCxDQUFwRDtVQVNBLEVBQUEsQ0FBRyx3RUFBSCxFQUE2RSxTQUFBO1lBQzNFLEdBQUEsQ0FBSTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7YUFBSjttQkFDQSxNQUFBLENBQU8sV0FBUCxFQUNFO2NBQUEsSUFBQSxFQUFNLHVEQUFOO2FBREY7VUFGMkUsQ0FBN0U7VUFPQSxFQUFBLENBQUcsd0VBQUgsRUFBNkUsU0FBQTtZQUMzRSxNQUFBLENBQU8sU0FBUCxFQUNFO2NBQUEsSUFBQSxFQUFNLFFBQU47Y0FDQSxJQUFBLEVBQU0sOENBRE47YUFERjtZQU1BLE1BQU0sQ0FBQyxVQUFQLENBQWtCLEtBQWxCO21CQUNBLE1BQUEsQ0FBTyxTQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sUUFBTjtjQUNBLElBQUEsRUFBTSx1REFETjtjQUtBLFVBQUEsRUFBWSxDQUxaO2FBREY7VUFSMkUsQ0FBN0U7aUJBZUEsUUFBQSxDQUFTLDBDQUFULEVBQXFELFNBQUE7WUFDbkQsVUFBQSxDQUFXLFNBQUE7cUJBQ1QsR0FBQSxDQUNFO2dCQUFBLEtBQUEsRUFBTyxxSEFBUDtlQURGO1lBRFMsQ0FBWDtZQVNBLEVBQUEsQ0FBRyxpRkFBSCxFQUFzRixTQUFBO2NBQ3BGLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsY0FBQSxFQUFnQixDQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZixFQUFzQixLQUF0QixDQUFoQjtlQUFkO2NBQ0EsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsZ0JBQW5CO2NBQ0EsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7Z0JBQUEsSUFBQSxFQUFNLFFBQU47Z0JBQWdCLFVBQUEsRUFBWSxDQUE1QjtlQUFoQjtjQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLE9BQWxCO3FCQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQ0U7Z0JBQUEsSUFBQSxFQUFNLFFBQU47Z0JBQ0EsS0FBQSxFQUFPLGdJQURQO2VBREY7WUFMb0YsQ0FBdEY7bUJBY0EsRUFBQSxDQUFHLG9GQUFILEVBQXlGLFNBQUE7Y0FDdkYsR0FBQSxDQUFJO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBSjtjQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Z0JBQUEsY0FBQSxFQUFnQixDQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZixFQUFzQixLQUF0QixDQUFoQjtlQUFkO2NBQ0EsU0FBUyxDQUFDLFFBQVYsQ0FBbUIsZ0JBQW5CO2NBQ0EsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7Z0JBQUEsSUFBQSxFQUFNLFFBQU47Z0JBQWdCLFVBQUEsRUFBWSxDQUE1QjtlQUFoQjtjQUNBLE1BQU0sQ0FBQyxVQUFQLENBQWtCLFlBQWxCO3FCQUNBLE1BQUEsQ0FBTyxRQUFQLEVBQ0U7Z0JBQUEsSUFBQSxFQUFNLFFBQU47Z0JBQ0EsS0FBQSxFQUFPLDBJQURQO2VBREY7WUFOdUYsQ0FBekY7VUF4Qm1ELENBQXJEO1FBN0NzQixDQUF4QjtRQW9GQSxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO2lCQUN0QixFQUFBLENBQUcsb0VBQUgsRUFBeUUsU0FBQTtZQUN2RSxHQUFBLENBQ0U7Y0FBQSxLQUFBLEVBQU8sd0RBQVA7YUFERjtZQUtBLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Y0FBQSxlQUFBLEVBQWlCLENBQWpCO2FBQWQ7bUJBQ0EsTUFBQSxDQUFPLE9BQVAsRUFDRTtjQUFBLElBQUEsRUFBTSx1REFBTjthQURGO1VBUHVFLENBQXpFO1FBRHNCLENBQXhCO1FBY0EsUUFBQSxDQUFTLHNCQUFULEVBQWlDLFNBQUE7aUJBQy9CLEVBQUEsQ0FBRyxvRUFBSCxFQUF5RSxTQUFBO1lBQ3ZFLEdBQUEsQ0FDRTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7Y0FDQSxJQUFBLEVBQU0sdURBRE47YUFERjtZQU1BLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Y0FBQSxlQUFBLEVBQWlCLENBQWpCO2FBQWQ7bUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFDRTtjQUFBLElBQUEsRUFBTSx1REFBTjthQURGO1VBUnVFLENBQXpFO1FBRCtCLENBQWpDO2VBZUEsUUFBQSxDQUFTLHVCQUFULEVBQWtDLFNBQUE7aUJBQ2hDLEVBQUEsQ0FBRyxvRUFBSCxFQUF5RSxTQUFBO1lBQ3ZFLEdBQUEsQ0FDRTtjQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7Y0FDQSxJQUFBLEVBQU0sdURBRE47YUFERjtZQU1BLE1BQUEsQ0FBTyxLQUFQLEVBQWM7Y0FBQSxlQUFBLEVBQWlCLENBQWpCO2FBQWQ7bUJBQ0EsTUFBQSxDQUFPLGdCQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sdURBQU47YUFERjtVQVJ1RSxDQUF6RTtRQURnQyxDQUFsQztNQXpIbUMsQ0FBckM7TUF3SUEsUUFBQSxDQUFTLGdEQUFULEVBQTJELFNBQUE7UUFDekQsVUFBQSxDQUFXLFNBQUE7VUFDVCxHQUFBLENBQ0U7WUFBQSxLQUFBLEVBQU8sZ0RBQVA7V0FERjtpQkFPQSxNQUFBLENBQU8sS0FBUCxFQUNFO1lBQUEsY0FBQSxFQUFnQixDQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZixFQUFzQixLQUF0QixFQUE2QixLQUE3QixDQUFoQjtXQURGO1FBUlMsQ0FBWDtRQVdBLFFBQUEsQ0FBUyxnQkFBVCxFQUEyQixTQUFBO1VBQ3pCLFFBQUEsQ0FBUyxrQ0FBVCxFQUE2QyxTQUFBO21CQUMzQyxFQUFBLENBQUcsd0NBQUgsRUFBNkMsU0FBQTtjQUMzQyxNQUFBLENBQU8sU0FBUCxFQUFrQjtnQkFBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2VBQWxCO2NBQ0EsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLEVBQUosQ0FBUjtlQUFoQjtjQUNBLE1BQUEsQ0FBTyxhQUFQLEVBQXNCO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBQVI7ZUFBdEI7cUJBQ0EsTUFBQSxDQUFPLGFBQVAsRUFBc0I7Z0JBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtlQUF0QjtZQUoyQyxDQUE3QztVQUQyQyxDQUE3QztpQkFPQSxRQUFBLENBQVMscUNBQVQsRUFBZ0QsU0FBQTtZQUM5QyxVQUFBLENBQVcsU0FBQTtjQUNULE1BQUEsQ0FBTyxRQUFQLEVBQWlCO2dCQUFBLGVBQUEsRUFBaUIsQ0FBakI7ZUFBakI7Y0FDQSxHQUFBLENBQUk7Z0JBQUEsS0FBQSxFQUFPLGlCQUFQO2VBQUo7cUJBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBYztnQkFBQSxlQUFBLEVBQWlCLENBQWpCO2VBQWQ7WUFIUyxDQUFYO1lBS0EsUUFBQSxDQUFTLEtBQVQsRUFBZ0IsU0FBQTtxQkFDZCxFQUFBLENBQUcseUJBQUgsRUFBOEIsU0FBQTt1QkFDNUIsTUFBQSxDQUFPLEtBQVAsRUFBYztrQkFBQSxLQUFBLEVBQU8saUJBQVA7aUJBQWQ7Y0FENEIsQ0FBOUI7WUFEYyxDQUFoQjttQkFJQSxRQUFBLENBQVMsV0FBVCxFQUFzQixTQUFBO3FCQUNwQixFQUFBLENBQUcsNkJBQUgsRUFBa0MsU0FBQTt1QkFDaEMsTUFBQSxDQUFPLFdBQVAsRUFBb0I7a0JBQUEsS0FBQSxFQUFPLGlCQUFQO2lCQUFwQjtjQURnQyxDQUFsQztZQURvQixDQUF0QjtVQVY4QyxDQUFoRDtRQVJ5QixDQUEzQjtRQXNCQSxRQUFBLENBQVMsc0JBQVQsRUFBaUMsU0FBQTtVQUMvQixRQUFBLENBQVMsS0FBVCxFQUFnQixTQUFBO1lBQ2QsRUFBQSxDQUFHLDJDQUFILEVBQWdELFNBQUE7Y0FDOUMsTUFBQSxDQUFPLFNBQVAsRUFDRTtnQkFBQSxJQUFBLEVBQU0sK0NBQU47Z0JBS0EsZUFBQSxFQUFpQixDQUxqQjtlQURGO2NBT0EsTUFBQSxDQUFPLEdBQVAsRUFDRTtnQkFBQSxJQUFBLEVBQU0sK0NBQU47Z0JBS0EsZUFBQSxFQUFpQixDQUxqQjtlQURGO2NBT0EsTUFBQSxDQUFPLEtBQVAsRUFDRTtnQkFBQSxJQUFBLEVBQU0sK0NBQU47Z0JBS0EsZUFBQSxFQUFpQixDQUxqQjtlQURGO3FCQU9BLE1BQUEsQ0FBTyxTQUFTLENBQUMsUUFBVixDQUFtQixnQkFBbkIsQ0FBUCxDQUE0QyxDQUFDLElBQTdDLENBQWtELEtBQWxEO1lBdEI4QyxDQUFoRDttQkF3QkEsRUFBQSxDQUFHLHdEQUFILEVBQTZELFNBQUE7Y0FDM0QsTUFBQSxDQUFPLFFBQVAsRUFDRTtnQkFBQSxJQUFBLEVBQU0sUUFBTjtnQkFDQSxlQUFBLEVBQWlCLENBRGpCO2VBREY7Y0FJQSxNQUFBLENBQU8sV0FBUCxFQUNFO2dCQUFBLElBQUEsRUFBTSwrQ0FBTjtnQkFLQSxlQUFBLEVBQWlCLENBTGpCO2VBREY7Y0FRQSxNQUFBLENBQU8sR0FBUCxFQUNFO2dCQUFBLElBQUEsRUFBTSwrQ0FBTjtnQkFLQSxlQUFBLEVBQWlCLENBTGpCO2VBREY7cUJBUUEsTUFBQSxDQUFPLEtBQVAsRUFDRTtnQkFBQSxJQUFBLEVBQU0sK0NBQU47Z0JBS0EsZUFBQSxFQUFpQixDQUxqQjtlQURGO1lBckIyRCxDQUE3RDtVQXpCYyxDQUFoQjtpQkFzREEsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTttQkFDcEIsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7Y0FDNUMsR0FBQSxDQUFJO2dCQUFBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxFQUFKLENBQVI7ZUFBSjtjQUNBLE1BQUEsQ0FBTyxlQUFQLEVBQ0U7Z0JBQUEsSUFBQSxFQUFNLCtDQUFOO2dCQUtBLGVBQUEsRUFBaUIsQ0FMakI7ZUFERjtjQU9BLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7Z0JBQUEsSUFBQSxFQUFNLCtDQUFOO2dCQUtBLGVBQUEsRUFBaUIsQ0FMakI7ZUFERjtjQU9BLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7Z0JBQUEsSUFBQSxFQUFNLCtDQUFOO2dCQUtBLGVBQUEsRUFBaUIsQ0FMakI7ZUFERjtxQkFPQSxNQUFBLENBQU8sU0FBUyxDQUFDLFFBQVYsQ0FBbUIsZ0JBQW5CLENBQVAsQ0FBNEMsQ0FBQyxJQUE3QyxDQUFrRCxLQUFsRDtZQXZCNEMsQ0FBOUM7VUFEb0IsQ0FBdEI7UUF2RCtCLENBQWpDO1FBaUZBLFFBQUEsQ0FBUywyQ0FBVCxFQUFzRCxTQUFBO1VBQ3BELEVBQUEsQ0FBRywwQ0FBSCxFQUErQyxTQUFBO21CQUM3QyxNQUFBLENBQU8saUJBQVAsRUFDRTtjQUFBLEtBQUEsRUFBTyxnREFBUDthQURGO1VBRDZDLENBQS9DO2lCQVFBLEVBQUEsQ0FBRyw4Q0FBSCxFQUFtRCxTQUFBO21CQUNqRCxNQUFBLENBQU8sdUJBQVAsRUFDRTtjQUFBLEtBQUEsRUFBTyxnREFBUDthQURGO1VBRGlELENBQW5EO1FBVG9ELENBQXREO2VBaUJBLFFBQUEsQ0FBUyw2REFBVCxFQUF3RSxTQUFBO1VBQ3RFLFVBQUEsQ0FBVyxTQUFBO1lBQ1QsR0FBQSxDQUNFO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQURGO21CQUVBLE1BQUEsQ0FBTyxLQUFQLEVBQ0U7Y0FBQSxjQUFBLEVBQWdCLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLEtBQXRCLEVBQTZCLEtBQTdCLEVBQW9DLEtBQXBDLEVBQTJDLEtBQTNDLEVBQWtELEtBQWxELENBQWhCO2FBREY7VUFIUyxDQUFYO2lCQU1BLEVBQUEsQ0FBRyw4Q0FBSCxFQUFtRCxTQUFBO1lBQ2pELE1BQUEsQ0FBTyxLQUFQLEVBQW9CO2NBQUEsS0FBQSxFQUFPLGdEQUFQO2FBQXBCO1lBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBb0I7Y0FBQSxLQUFBLEVBQU8sZ0RBQVA7YUFBcEI7WUFDQSxNQUFBLENBQU8sS0FBUCxFQUFvQjtjQUFBLEtBQUEsRUFBTyxnREFBUDthQUFwQjtZQUNBLE1BQUEsQ0FBTyxLQUFQLEVBQW9CO2NBQUEsS0FBQSxFQUFPLGdEQUFQO2FBQXBCO1lBQ0EsTUFBQSxDQUFPLEtBQVAsRUFBb0I7Y0FBQSxLQUFBLEVBQU8sZ0RBQVA7YUFBcEI7WUFDQSxNQUFBLENBQU8sS0FBUCxFQUFvQjtjQUFBLEtBQUEsRUFBTyxnREFBUDthQUFwQjtZQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CO2NBQUEsS0FBQSxFQUFPLGdEQUFQO2FBQXBCO1lBQ0EsTUFBQSxDQUFPLFdBQVAsRUFBb0I7Y0FBQSxLQUFBLEVBQU8sZ0RBQVA7YUFBcEI7WUFDQSxNQUFBLENBQU8sV0FBUCxFQUFvQjtjQUFBLEtBQUEsRUFBTyxnREFBUDthQUFwQjtZQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CO2NBQUEsS0FBQSxFQUFPLGdEQUFQO2FBQXBCO21CQUNBLE1BQUEsQ0FBTyxXQUFQLEVBQW9CO2NBQUEsS0FBQSxFQUFPLGdEQUFQO2FBQXBCO1VBWGlELENBQW5EO1FBUHNFLENBQXhFO01BcEl5RCxDQUEzRDtNQXdKQSxRQUFBLENBQVMsK0NBQVQsRUFBMEQsU0FBQTtRQUN4RCxVQUFBLENBQVcsU0FBQTtpQkFDVCxHQUFBLENBQ0U7WUFBQSxLQUFBLEVBQU8sd0RBQVA7V0FERjtRQURTLENBQVg7UUFPQSxRQUFBLENBQVMsb0RBQVQsRUFBK0QsU0FBQTtpQkFDN0QsRUFBQSxDQUFHLG1FQUFILEVBQXdFLFNBQUE7WUFDdEUsTUFBQSxDQUFPLEtBQVAsRUFDRTtjQUFBLGNBQUEsRUFBZ0IsQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsS0FBdEIsRUFBNkIsS0FBN0IsRUFBb0MsS0FBcEMsQ0FBaEI7YUFERjtZQUVBLE1BQUEsQ0FBTyxTQUFQLEVBQ0U7Y0FBQSxjQUFBLEVBQWdCLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLEtBQXRCLENBQWhCO2NBQ0EsSUFBQSxFQUFNLGtCQUROO2FBREY7bUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFDRTtjQUFBLElBQUEsRUFBTSwyQ0FBTjtjQUlBLElBQUEsRUFBTSxRQUpOO2FBREY7VUFOc0UsQ0FBeEU7UUFENkQsQ0FBL0Q7ZUFjQSxRQUFBLENBQVMscUVBQVQsRUFBZ0YsU0FBQTtpQkFDOUUsRUFBQSxDQUFHLDhEQUFILEVBQW1FLFNBQUE7WUFDakUsTUFBQSxDQUFPLEtBQVAsRUFDRTtjQUFBLGNBQUEsRUFBZ0IsQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0IsS0FBdEIsRUFBNkIsS0FBN0IsRUFBb0MsS0FBcEMsQ0FBaEI7YUFERjtZQUVBLE1BQUEsQ0FBTyxhQUFQLEVBQ0U7Y0FBQSxjQUFBLEVBQWdCLENBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxLQUFmLEVBQXNCLEtBQXRCLEVBQTZCLEtBQTdCLEVBQW9DLEtBQXBDLENBQWhCO2NBQ0EsSUFBQSxFQUFNLGtCQUROO2FBREY7bUJBR0EsTUFBQSxDQUFPLEdBQVAsRUFDQztjQUFBLFlBQUEsRUFBYyxDQUFDLEtBQUQsRUFBUSxLQUFSLEVBQWUsS0FBZixFQUFzQixLQUF0QixFQUE2QixLQUE3QixFQUFvQyxLQUFwQyxDQUFkO2FBREQ7VUFOaUUsQ0FBbkU7UUFEOEUsQ0FBaEY7TUF0QndELENBQTFEO2FBZ0NBLFFBQUEsQ0FBUywyQ0FBVCxFQUFzRCxTQUFBO1FBQ3BELFVBQUEsQ0FBVyxTQUFBO2lCQUNULEdBQUEsQ0FDRTtZQUFBLEtBQUEsRUFBTyw2RUFBUDtXQURGO1FBRFMsQ0FBWDtlQVdBLFFBQUEsQ0FBUywrQkFBVCxFQUEwQyxTQUFBO2lCQUN4QyxFQUFBLENBQUcsMkJBQUgsRUFBZ0MsU0FBQTttQkFDOUIsTUFBQSxDQUFPLEtBQVAsRUFBYztjQUFBLGNBQUEsRUFBZ0IsQ0FBQyxNQUFELEVBQVMsTUFBVCxFQUFpQixNQUFqQixFQUF5QixNQUF6QixDQUFoQjthQUFkO1VBRDhCLENBQWhDO1FBRHdDLENBQTFDO01BWm9ELENBQXREO0lBamRtQyxDQUFyQztXQWllQSxRQUFBLENBQVMsa0RBQVQsRUFBNkQsU0FBQTtNQUMzRCxVQUFBLENBQVcsU0FBQTtRQUNULGVBQUEsQ0FBZ0IsU0FBQTtpQkFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIscUJBQTlCO1FBRGMsQ0FBaEI7ZUFHQSxJQUFBLENBQUssU0FBQTtpQkFDSCxHQUFBLENBQ0U7WUFBQSxPQUFBLEVBQVMsV0FBVDtZQUNBLEtBQUEsRUFBTyx3T0FEUDtXQURGO1FBREcsQ0FBTDtNQUpTLENBQVg7TUFvQkEsUUFBQSxDQUFTLHdCQUFULEVBQW1DLFNBQUE7UUFDakMsRUFBQSxDQUFHLDJDQUFILEVBQWdELFNBQUE7VUFDOUMsTUFBQSxDQUFPLFdBQVAsRUFBb0I7WUFBQSxJQUFBLEVBQU0sQ0FBQyxRQUFELEVBQVcsVUFBWCxDQUFOO1dBQXBCO2lCQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQ0U7WUFBQSxLQUFBLEVBQU8scU1BQVA7V0FERjtRQUY4QyxDQUFoRDtlQWVBLEVBQUEsQ0FBRywyQ0FBSCxFQUFnRCxTQUFBO2lCQUM5QyxNQUFBLENBQU8sYUFBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLGlHQUFQO1dBREY7UUFEOEMsQ0FBaEQ7TUFoQmlDLENBQW5DO01BMEJBLFFBQUEsQ0FBUywrQ0FBVCxFQUEwRCxTQUFBO1FBQ3hELEVBQUEsQ0FBRyxpREFBSCxFQUFzRCxTQUFBO2lCQUNwRCxNQUFBLENBQU8sU0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLGlHQUFQO1dBREY7UUFEb0QsQ0FBdEQ7ZUFVQSxFQUFBLENBQUcscURBQUgsRUFBMEQsU0FBQTtpQkFDeEQsTUFBQSxDQUFPLFdBQVAsRUFDRTtZQUFBLEtBQUEsRUFBTyx3T0FBUDtXQURGO1FBRHdELENBQTFEO01BWHdELENBQTFEO2FBeUJBLFFBQUEsQ0FBUywwQkFBVCxFQUFxQyxTQUFBO2VBQ25DLEVBQUEsQ0FBRyx5REFBSCxFQUE4RCxTQUFBO1VBQzVELE1BQUEsQ0FBTyxTQUFQLEVBQ0U7WUFBQSxLQUFBLEVBQU8sb1BBQVA7V0FERjtpQkFhQSxNQUFBLENBQU8sR0FBUCxFQUNFO1lBQUEsS0FBQSxFQUFPLHdPQUFQO1dBREY7UUFkNEQsQ0FBOUQ7TUFEbUMsQ0FBckM7SUF4RTJELENBQTdEO0VBamhDcUIsQ0FBdkI7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZSwgZGlzcGF0Y2gsIFRleHREYXRhLCBnZXRWaWV3fSA9IHJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5zZXR0aW5ncyA9IHJlcXVpcmUgJy4uL2xpYi9zZXR0aW5ncydcblxuZGVzY3JpYmUgXCJPY2N1cnJlbmNlXCIsIC0+XG4gIFtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlLCBlZGl0b3IsIGVkaXRvckVsZW1lbnQsIHZpbVN0YXRlLCBjbGFzc0xpc3RdID0gW11cbiAgW3NlYXJjaEVkaXRvciwgc2VhcmNoRWRpdG9yRWxlbWVudF0gPSBbXVxuICBpbnB1dFNlYXJjaFRleHQgPSAodGV4dCkgLT5cbiAgICBzZWFyY2hFZGl0b3IuaW5zZXJ0VGV4dCh0ZXh0KVxuICBkaXNwYXRjaFNlYXJjaENvbW1hbmQgPSAobmFtZSkgLT5cbiAgICBkaXNwYXRjaChzZWFyY2hFZGl0b3JFbGVtZW50LCBuYW1lKVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIHZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGVcbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbVxuICAgICAgY2xhc3NMaXN0ID0gZWRpdG9yRWxlbWVudC5jbGFzc0xpc3RcbiAgICAgIHNlYXJjaEVkaXRvciA9IHZpbVN0YXRlLnNlYXJjaElucHV0LmVkaXRvclxuICAgICAgc2VhcmNoRWRpdG9yRWxlbWVudCA9IHZpbVN0YXRlLnNlYXJjaElucHV0LmVkaXRvckVsZW1lbnRcblxuICAgIHJ1bnMgLT5cbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZWRpdG9yRWxlbWVudClcblxuICBkZXNjcmliZSBcIm9wZXJhdG9yLW1vZGlmaWVyLW9jY3VycmVuY2VcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG5cbiAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgLS0tOiBvb286IHh4eDogb29vOlxuICAgICAgICBvb286IHh4eDogLS0tOiB4eHg6IG9vbzpcbiAgICAgICAgeHh4OiAtLS06IG9vbzogb29vOlxuXG4gICAgICAgIG9vbzogeHh4OiBvb286XG4gICAgICAgIC0tLTogb29vOiB4eHg6IG9vbzpcbiAgICAgICAgb29vOiB4eHg6IC0tLTogeHh4OiBvb286XG4gICAgICAgIHh4eDogLS0tOiBvb286IG9vbzpcblxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwibyBtb2RpZmllclwiLCAtPlxuICAgICAgaXQgXCJjaGFuZ2Ugb2NjdXJyZW5jZSBvZiBjdXJzb3Igd29yZCBpbiBpbm5lci1wYXJhZ3JhcGhcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgIGVuc3VyZSBcImMgbyBpIHBcIixcbiAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgICE6IHh4eDogfDpcbiAgICAgICAgICAtLS06IHw6IHh4eDogfDpcbiAgICAgICAgICB8OiB4eHg6IC0tLTogeHh4OiB8OlxuICAgICAgICAgIHh4eDogLS0tOiB8OiB8OlxuXG4gICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICAtLS06IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgb29vOiB4eHg6IC0tLTogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiAtLS06IG9vbzogb29vOlxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCc9PT0nKVxuICAgICAgICBlbnN1cmUgXCJlc2NhcGVcIixcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgID09IT06IHh4eDogPT18PTpcbiAgICAgICAgICAtLS06ID09fD06IHh4eDogPT18PTpcbiAgICAgICAgICA9PXw9OiB4eHg6IC0tLTogeHh4OiA9PXw9OlxuICAgICAgICAgIHh4eDogLS0tOiA9PXw9OiA9PXw9OlxuXG4gICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICAtLS06IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgb29vOiB4eHg6IC0tLTogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiAtLS06IG9vbzogb29vOlxuXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgZW5zdXJlIFwifSBqIC5cIixcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgID09PTogeHh4OiA9PT06XG4gICAgICAgICAgLS0tOiA9PT06IHh4eDogPT09OlxuICAgICAgICAgID09PTogeHh4OiAtLS06IHh4eDogPT09OlxuICAgICAgICAgIHh4eDogLS0tOiA9PT06ID09PTpcblxuICAgICAgICAgID09IT06IHh4eDogPT18PTpcbiAgICAgICAgICAtLS06ID09fD06IHh4eDogPT18PTpcbiAgICAgICAgICA9PXw9OiB4eHg6IC0tLTogeHh4OiA9PXw9OlxuICAgICAgICAgIHh4eDogLS0tOiA9PXw9OiA9PXw9OlxuXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcIk8gbW9kaWZpZXJcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dEM6IFwiXCJcIlxuXG4gICAgICAgICAgY2FtZWxDYXxzZSBDYXNlc1xuICAgICAgICAgIFwiQ2FzZVN0dWR5XCIgU25ha2VDYXNlXG4gICAgICAgICAgVVBfQ0FTRVxuXG4gICAgICAgICAgb3RoZXIgUGFyYWdyYXBoQ2FzZVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgaXQgXCJkZWxldGUgc3Vid29yZC1vY2N1cnJlbmNlIGluIHBhcmFncmFwaCBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICBlbnN1cmUgXCJkIE8gcFwiLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgIGNhbWVsfCBDYXNlc1xuICAgICAgICAgIFwiU3R1ZHlcIiBTbmFrZVxuICAgICAgICAgIFVQX0NBU0VcblxuICAgICAgICAgIG90aGVyIFBhcmFncmFwaENhc2VcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlIFwiRyAuXCIsXG4gICAgICAgICAgdGV4dEM6IFwiXCJcIlxuXG4gICAgICAgICAgY2FtZWwgQ2FzZXNcbiAgICAgICAgICBcIlN0dWR5XCIgU25ha2VcbiAgICAgICAgICBVUF9DQVNFXG5cbiAgICAgICAgICBvdGhlcnwgUGFyYWdyYXBoXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcImFwcGx5IHZhcmlvdXMgb3BlcmF0b3IgdG8gb2NjdXJyZW5jZSBpbiB2YXJpb3VzIHRhcmdldFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgb29vOiB4eHg6IG8hb286XG4gICAgICAgICAgPT09OiBvb286IHh4eDogb29vOlxuICAgICAgICAgIG9vbzogeHh4OiA9PT06IHh4eDogb29vOlxuICAgICAgICAgIHh4eDogPT09OiBvb286IG9vbzpcbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwidXBwZXIgY2FzZSBpbm5lci13b3JkXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcImcgVSBvIGkgbFwiLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICBPT086IHh4eDogTyFPTzpcbiAgICAgICAgICA9PT06IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgb29vOiB4eHg6ID09PTogeHh4OiBvb286XG4gICAgICAgICAgeHh4OiA9PT06IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgXCIyIGogLlwiLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICBPT086IHh4eDogT09POlxuICAgICAgICAgID09PTogb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICBPT086IHh4eDogPSE9PTogeHh4OiBPT086XG4gICAgICAgICAgeHh4OiA9PT06IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgXCJqIC5cIixcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgT09POiB4eHg6IE9PTzpcbiAgICAgICAgICA9PT06IG9vbzogeHh4OiBvb286XG4gICAgICAgICAgT09POiB4eHg6ID09PTogeHh4OiBPT086XG4gICAgICAgICAgeHh4OiA9PT06IE8hT086IE9PTzpcbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJjbGlwIHRvIG11dGF0aW9uIGVuZCBiZWhhdmlvclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG5cbiAgICAgICAgICAgIG9vfG86eHh4Om9vbzpcbiAgICAgICAgICAgIHh4eDpvb286eHh4XG4gICAgICAgICAgICBcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBpdCBcIltkIG8gcF0gZGVsZXRlIG9jY3VycmVuY2UgYW5kIGN1cnNvciBpcyBhdCBtdXRhdGlvbiBlbmRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJkIG8gcFwiLFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuXG4gICAgICAgICAgICB8Onh4eDo6XG4gICAgICAgICAgICB4eHg6Onh4eFxuICAgICAgICAgICAgXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgXCJbZCBvIGpdIGRlbGV0ZSBvY2N1cnJlbmNlIGFuZCBjdXJzb3IgaXMgYXQgbXV0YXRpb24gZW5kXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiZCBvIGpcIixcbiAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgICAgfDp4eHg6OlxuICAgICAgICAgICAgeHh4Ojp4eHhcbiAgICAgICAgICAgIFxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIGl0IFwibm90IGNsaXAgaWYgb3JpZ2luYWwgY3Vyc29yIG5vdCBpbnRlcnNlY3RzIGFueSBvY2N1cmVuY2UtbWFya2VyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogWydvb28nLCAnb29vJywgJ29vbyddLCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIGtleXN0cm9rZSAnaicsIGN1cnNvcjogWzIsIDJdXG4gICAgICAgICAgZW5zdXJlIFwiZCBwXCIsXG4gICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG5cbiAgICAgICAgICAgIDp4eHg6OlxuICAgICAgICAgICAgeHh8eDo6eHh4XG4gICAgICAgICAgICBcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJhdXRvIGV4dGVuZCB0YXJnZXQgcmFuZ2UgdG8gaW5jbHVkZSBvY2N1cnJlbmNlXCIsIC0+XG4gICAgICB0ZXh0T3JpZ2luYWwgPSBcIlRoaXMgdGV4dCBoYXZlIDMgaW5zdGFuY2Ugb2YgJ3RleHQnIGluIHRoZSB3aG9sZSB0ZXh0LlxcblwiXG4gICAgICB0ZXh0RmluYWwgPSB0ZXh0T3JpZ2luYWwucmVwbGFjZSgvdGV4dC9nLCAnJylcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogdGV4dE9yaWdpbmFsXG5cbiAgICAgIGl0IFwiW2Zyb20gc3RhcnQgb2YgMXN0XVwiLCAtPiBzZXQgY3Vyc29yOiBbMCwgNV07IGVuc3VyZSAnZCBvICQnLCB0ZXh0OiB0ZXh0RmluYWxcbiAgICAgIGl0IFwiW2Zyb20gbWlkZGxlIG9mIDFzdF1cIiwgLT4gc2V0IGN1cnNvcjogWzAsIDddOyBlbnN1cmUgJ2QgbyAkJywgdGV4dDogdGV4dEZpbmFsXG4gICAgICBpdCBcIltmcm9tIGVuZCBvZiBsYXN0XVwiLCAtPiBzZXQgY3Vyc29yOiBbMCwgNTJdOyBlbnN1cmUgJ2QgbyAwJywgdGV4dDogdGV4dEZpbmFsXG4gICAgICBpdCBcIltmcm9tIG1pZGRsZSBvZiBsYXN0XVwiLCAtPiBzZXQgY3Vyc29yOiBbMCwgNTFdOyBlbnN1cmUgJ2QgbyAwJywgdGV4dDogdGV4dEZpbmFsXG5cbiAgICBkZXNjcmliZSBcInNlbGVjdC1vY2N1cnJlbmNlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIHZpbS1tb2RlLXBsdXMgdmltLW1vZGUtcGx1c1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgZGVzY3JpYmUgXCJ3aGF0IHRoZSBjdXJzb3Itd29yZFwiLCAtPlxuICAgICAgICBlbnN1cmVDdXJzb3JXb3JkID0gKGluaXRpYWxQb2ludCwge3NlbGVjdGVkVGV4dH0pIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogaW5pdGlhbFBvaW50XG4gICAgICAgICAgZW5zdXJlIFwiZyBjbWQtZCBpIHBcIixcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogc2VsZWN0ZWRUZXh0XG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBlbnN1cmUgXCJlc2NhcGVcIiwgbW9kZTogXCJub3JtYWxcIlxuXG4gICAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIG9uIG5vcm1hbCB3b3JkXCIsIC0+XG4gICAgICAgICAgaXQgXCJwaWNrIHdvcmQgYnV0IG5vdCBwaWNrIHBhcnRpYWxseSBtYXRjaGVkIG9uZSBbYnkgc2VsZWN0XVwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlQ3Vyc29yV29yZChbMCwgMF0sIHNlbGVjdGVkVGV4dDogWyd2aW0nLCAndmltJ10pXG4gICAgICAgICAgICBlbnN1cmVDdXJzb3JXb3JkKFswLCAzXSwgc2VsZWN0ZWRUZXh0OiBbJy0nLCAnLScsICctJywgJy0nXSlcbiAgICAgICAgICAgIGVuc3VyZUN1cnNvcldvcmQoWzAsIDRdLCBzZWxlY3RlZFRleHQ6IFsnbW9kZScsICdtb2RlJ10pXG4gICAgICAgICAgICBlbnN1cmVDdXJzb3JXb3JkKFswLCA5XSwgc2VsZWN0ZWRUZXh0OiBbJ3BsdXMnLCAncGx1cyddKVxuXG4gICAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIGF0IHNpbmdsZSB3aGl0ZSBzcGFjZSBbYnkgZGVsZXRlXVwiLCAtPlxuICAgICAgICAgIGl0IFwicGljayBzaW5nbGUgd2hpdGUgc3BhY2Ugb25seVwiLCAtPlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBvb28gb29vIG9vb1xuICAgICAgICAgICAgICAgb29vIG9vbyBvb29cbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgIGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgICBlbnN1cmUgXCJkIG8gaSBwXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBvb29vb29vb29cbiAgICAgICAgICAgICAgb29vb29vb29vXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGRlc2NyaWJlIFwiY3Vyc29yIGlzIGF0IHNlcXVuY2Ugb2Ygc3BhY2UgW2J5IGRlbGV0ZV1cIiwgLT5cbiAgICAgICAgICBpdCBcInNlbGVjdCBzZXF1bmNlIG9mIHdoaXRlIHNwYWNlcyBpbmNsdWRpbmcgcGFydGlhbGx5IG1hY2hlZCBvbmVcIiwgLT5cbiAgICAgICAgICAgIHNldFxuICAgICAgICAgICAgICBjdXJzb3I6IFswLCAzXVxuICAgICAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgICAgIG9vb19fX29vbyBvb29cbiAgICAgICAgICAgICAgIG9vbyBvb29fX19fb29vX19fX19fX19vb29cbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBlbnN1cmUgXCJkIG8gaSBwXCIsXG4gICAgICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgICAgb29vb29vIG9vb1xuICAgICAgICAgICAgICAgb29vIG9vbyBvb28gIG9vb1xuICAgICAgICAgICAgICBcIlwiXCJcblxuICBkZXNjcmliZSBcInN0YXlPbk9jY3VycmVuY2Ugc2V0dGluZ3NcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dEM6IFwiXCJcIlxuXG4gICAgICAgIGFhYSwgYmJiLCBjY2NcbiAgICAgICAgYmJiLCBhfGFhLCBhYWFcblxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwid2hlbiB0cnVlICg9IGRlZmF1bHQpXCIsIC0+XG4gICAgICBpdCBcImtlZXAgY3Vyc29yIHBvc2l0aW9uIGFmdGVyIG9wZXJhdGlvbiBmaW5pc2hlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2cgVSBvIHAnLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgIEFBQSwgYmJiLCBjY2NcbiAgICAgICAgICBiYmIsIEF8QUEsIEFBQVxuXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZmFsc2VcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25PY2N1cnJlbmNlJywgZmFsc2UpXG5cbiAgICAgIGl0IFwibW92ZSBjdXJzb3IgdG8gc3RhcnQgb2YgdGFyZ2V0IGFzIGxpa2Ugbm9uLW9jdXJyZW5jZSBvcGVyYXRvclwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2cgVSBvIHAnLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcblxuICAgICAgICAgIHxBQUEsIGJiYiwgY2NjXG4gICAgICAgICAgYmJiLCBBQUEsIEFBQVxuXG4gICAgICAgICAgXCJcIlwiXG5cblxuICBkZXNjcmliZSBcImZyb20gdmlzdWFsLW1vZGUuaXMtbmFycm93ZWRcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIG9vbzogeHh4OiBvb29cbiAgICAgICAgfHx8OiBvb286IHh4eDogb29vXG4gICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogb29vXG4gICAgICAgIHh4eDogfHx8OiBvb286IG9vb1xuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiW3ZDXSBzZWxlY3Qtb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3QgY3Vyc29yLXdvcmQgd2hpY2ggaW50ZXJzZWN0aW5nIHNlbGVjdGlvbiB0aGVuIGFwcGx5IHVwcGVyLWNhc2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwidiAyIGogY21kLWRcIixcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFsnb29vJywgJ29vbycsICdvb28nLCAnb29vJywgJ29vbyddXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG5cbiAgICAgICAgZW5zdXJlIFwiVVwiLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIE9PTzogeHh4OiBPT09cbiAgICAgICAgICB8fHw6IE9PTzogeHh4OiBPT09cbiAgICAgICAgICBPT086IHh4eDogfHx8OiB4eHg6IG9vb1xuICAgICAgICAgIHh4eDogfHx8OiBvb286IG9vb1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG51bUN1cnNvcnM6IDVcbiAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgZGVzY3JpYmUgXCJbdkxdIHNlbGVjdC1vY2N1cnJlbmNlXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdCBjdXJzb3Itd29yZCB3aGljaCBpbnRlcnNlY3Rpbmcgc2VsZWN0aW9uIHRoZW4gYXBwbHkgdXBwZXItY2FzZVwiLCAtPlxuICAgICAgICBlbnN1cmUgXCI1IGwgViAyIGogY21kLWRcIixcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFsneHh4JywgJ3h4eCcsICd4eHgnLCAneHh4J11cbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgICAgICBlbnN1cmUgXCJVXCIsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgb29vOiBYWFg6IG9vb1xuICAgICAgICAgIHx8fDogb29vOiBYWFg6IG9vb1xuICAgICAgICAgIG9vbzogWFhYOiB8fHw6IFhYWDogb29vXG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgbnVtQ3Vyc29yczogNFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBkZXNjcmliZSBcIlt2Ql0gc2VsZWN0LW9jY3VycmVuY2VcIiwgLT5cbiAgICAgIGl0IFwic2VsZWN0IGN1cnNvci13b3JkIHdoaWNoIGludGVyc2VjdGluZyBzZWxlY3Rpb24gdGhlbiBhcHBseSB1cHBlci1jYXNlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcIlcgY3RybC12IDIgaiAkIGggY21kLWQgVVwiLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIG9vbzogeHh4OiBPT09cbiAgICAgICAgICB8fHw6IE9PTzogeHh4OiBPT09cbiAgICAgICAgICBvb286IHh4eDogfHx8OiB4eHg6IE9PT1xuICAgICAgICAgIHh4eDogfHx8OiBvb286IG9vb1xuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG51bUN1cnNvcnM6IDRcblxuICAgICAgaXQgXCJwaWNrIGN1cnNvci13b3JkIGZyb20gdkIgcmFuZ2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiY3RybC12IDcgbCAyIGogbyBjbWQtZCBVXCIsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgT09POiB4eHg6IG9vb1xuICAgICAgICAgIHx8fDogT09POiB4eHg6IG9vb1xuICAgICAgICAgIE9PTzogeHh4OiB8fHw6IHh4eDogb29vXG4gICAgICAgICAgeHh4OiB8fHw6IG9vbzogb29vXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgbnVtQ3Vyc29yczogM1xuXG4gIGRlc2NyaWJlIFwiaW5jcmVtZW50YWwgc2VhcmNoIGludGVncmF0aW9uOiBjaGFuZ2Utb2NjdXJyZW5jZS1mcm9tLXNlYXJjaCwgc2VsZWN0LW9jY3VycmVuY2UtZnJvbS1zZWFyY2hcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXR0aW5ncy5zZXQoJ2luY3JlbWVudGFsU2VhcmNoJywgdHJ1ZSlcbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgb29vOiB4eHg6IG9vbzogMDAwMFxuICAgICAgICAxOiBvb286IDIyOiBvb286XG4gICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogMzMzMzpcbiAgICAgICAgNDQ0OiB8fHw6IG9vbzogb29vOlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiZnJvbSBub3JtYWwgbW9kZVwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3Qgb2NjdXJyZW5jZSBieSBwYXR0ZXJuIG1hdGNoXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnLydcbiAgICAgICAgaW5wdXRTZWFyY2hUZXh0KCdcXFxcZHszLDR9JylcbiAgICAgICAgZGlzcGF0Y2hTZWFyY2hDb21tYW5kKCd2aW0tbW9kZS1wbHVzOnNlbGVjdC1vY2N1cnJlbmNlLWZyb20tc2VhcmNoJylcbiAgICAgICAgZW5zdXJlICdpIGUnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogWyczMzMzJywgJzQ0NCcsICcwMDAwJ10gIyBXaHkgJzAwMDAnIGNvbWVzIGxhc3QgaXMgJzAwMDAnIGJlY29tZSBsYXN0IHNlbGVjdGlvbi5cbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgICAgaXQgXCJjaGFuZ2Ugb2NjdXJyZW5jZSBieSBwYXR0ZXJuIG1hdGNoXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAnLydcbiAgICAgICAgaW5wdXRTZWFyY2hUZXh0KCdeXFxcXHcrOicpXG4gICAgICAgIGRpc3BhdGNoU2VhcmNoQ29tbWFuZCgndmltLW1vZGUtcGx1czpjaGFuZ2Utb2NjdXJyZW5jZS1mcm9tLXNlYXJjaCcpXG4gICAgICAgIGVuc3VyZSAnaSBlJywgbW9kZTogJ2luc2VydCdcbiAgICAgICAgZWRpdG9yLmluc2VydFRleHQoJ2hlbGxvJylcbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgaGVsbG8geHh4OiBvb286IDAwMDBcbiAgICAgICAgICBoZWxsbyBvb286IDIyOiBvb286XG4gICAgICAgICAgaGVsbG8geHh4OiB8fHw6IHh4eDogMzMzMzpcbiAgICAgICAgICBoZWxsbyB8fHw6IG9vbzogb29vOlxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBkZXNjcmliZSBcInZpc3VhbCBjaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICAgIGl0IFwiY2hhbmdlIG9jY3VycmVuY2UgaW4gbmFycm93ZWQgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlICd2IGogLydcbiAgICAgICAgICBpbnB1dFNlYXJjaFRleHQoJ28rJylcbiAgICAgICAgICBkaXNwYXRjaFNlYXJjaENvbW1hbmQoJ3ZpbS1tb2RlLXBsdXM6c2VsZWN0LW9jY3VycmVuY2UtZnJvbS1zZWFyY2gnKVxuICAgICAgICAgIGVuc3VyZSAnVScsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIE9PTzogeHh4OiBPT086IDAwMDBcbiAgICAgICAgICAgIDE6IG9vbzogMjI6IG9vbzpcbiAgICAgICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogMzMzMzpcbiAgICAgICAgICAgIDQ0NDogfHx8OiBvb286IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcInZpc3VhbCBsaW5ld2lzZVwiLCAtPlxuICAgICAgICBpdCBcImNoYW5nZSBvY2N1cnJlbmNlIGluIG5hcnJvd2VkIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnViBqIC8nXG4gICAgICAgICAgaW5wdXRTZWFyY2hUZXh0KCdvKycpXG4gICAgICAgICAgZGlzcGF0Y2hTZWFyY2hDb21tYW5kKCd2aW0tbW9kZS1wbHVzOnNlbGVjdC1vY2N1cnJlbmNlLWZyb20tc2VhcmNoJylcbiAgICAgICAgICBlbnN1cmUgJ1UnLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBPT086IHh4eDogT09POiAwMDAwXG4gICAgICAgICAgICAxOiBPT086IDIyOiBPT086XG4gICAgICAgICAgICBvb286IHh4eDogfHx8OiB4eHg6IDMzMzM6XG4gICAgICAgICAgICA0NDQ6IHx8fDogb29vOiBvb286XG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJ2aXN1YWwgYmxvY2t3aXNlXCIsIC0+XG4gICAgICAgIGl0IFwiY2hhbmdlIG9jY3VycmVuY2UgaW4gbmFycm93ZWQgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAga2V5c3Ryb2tlICdjdHJsLXYgMiBqIDEgMCBsIC8nXG4gICAgICAgICAgaW5wdXRTZWFyY2hUZXh0KCdvKycpXG4gICAgICAgICAgZGlzcGF0Y2hTZWFyY2hDb21tYW5kKCd2aW0tbW9kZS1wbHVzOnNlbGVjdC1vY2N1cnJlbmNlLWZyb20tc2VhcmNoJylcbiAgICAgICAgICBlbnN1cmUgJ1UnLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IHh4eDogT09POiAwMDAwXG4gICAgICAgICAgICAxOiBPT086IDIyOiBPT086XG4gICAgICAgICAgICBvb286IHh4eDogfHx8OiB4eHg6IDMzMzM6XG4gICAgICAgICAgICA0NDQ6IHx8fDogb29vOiBvb286XG4gICAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwicGVyc2lzdGVudC1zZWxlY3Rpb24gaXMgZXhpc3RzXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJjcmVhdGUtcGVyc2lzdGVudC1zZWxlY3Rpb25cIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAgICdtJzogJ3ZpbS1tb2RlLXBsdXM6Y3JlYXRlLXBlcnNpc3RlbnQtc2VsZWN0aW9uJ1xuXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIG9vbzogeHh4OiBvb286XG4gICAgICAgICAgfHx8OiBvb286IHh4eDogb29vOlxuICAgICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogb29vOlxuICAgICAgICAgIHh4eDogfHx8OiBvb286IG9vbzpcXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgIGVuc3VyZSAnViBqIG0gRyBtIG0nLFxuICAgICAgICAgIHBlcnNpc3RlbnRTZWxlY3Rpb25CdWZmZXJSYW5nZTogW1xuICAgICAgICAgICAgW1swLCAwXSwgWzIsIDBdXVxuICAgICAgICAgICAgW1szLCAwXSwgWzQsIDBdXVxuICAgICAgICAgIF1cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIG5vIHNlbGVjdGlvbiBpcyBleGlzdHNcIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3Qgb2NjdXJyZW5jZSBpbiBhbGwgcGVyc2lzdGVudC1zZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBrZXlzdHJva2UgJy8nXG4gICAgICAgICAgaW5wdXRTZWFyY2hUZXh0KCd4eHgnKVxuICAgICAgICAgIGRpc3BhdGNoU2VhcmNoQ29tbWFuZCgndmltLW1vZGUtcGx1czpzZWxlY3Qtb2NjdXJyZW5jZS1mcm9tLXNlYXJjaCcpXG4gICAgICAgICAgZW5zdXJlICdVJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICAgIHx8fDogb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICAgIG9vbzogeHh4OiB8fHw6IHh4eDogb29vOlxuICAgICAgICAgICAgWFhYOiB8fHw6IG9vbzogb29vOlxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwZXJzaXN0ZW50U2VsZWN0aW9uQ291bnQ6IDBcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGJvdGggZXhpdHMsIG9wZXJhdG9yIGFwcGxpZWQgdG8gYm90aFwiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdCBhbGwgb2NjdXJyZW5jZSBpbiBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBrZXlzdHJva2UgJ1YgMiBqIC8nXG4gICAgICAgICAgaW5wdXRTZWFyY2hUZXh0KCd4eHgnKVxuICAgICAgICAgIGRpc3BhdGNoU2VhcmNoQ29tbWFuZCgndmltLW1vZGUtcGx1czpzZWxlY3Qtb2NjdXJyZW5jZS1mcm9tLXNlYXJjaCcpXG4gICAgICAgICAgZW5zdXJlICdVJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICAgIHx8fDogb29vOiBYWFg6IG9vbzpcbiAgICAgICAgICAgIG9vbzogWFhYOiB8fHw6IFhYWDogb29vOlxuICAgICAgICAgICAgWFhYOiB8fHw6IG9vbzogb29vOlxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBwZXJzaXN0ZW50U2VsZWN0aW9uQ291bnQ6IDBcblxuICAgIGRlc2NyaWJlIFwiZGVtb25zdHJhdGUgcGVyc2lzdGVudC1zZWxlY3Rpb24ncyBwcmFjdGljYWwgc2NlbmFyaW9cIiwgLT5cbiAgICAgIFtvbGRHcmFtbWFyXSA9IFtdXG4gICAgICBhZnRlckVhY2ggLT5cbiAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIob2xkR3JhbW1hcilcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLmtleW1hcHMuYWRkIFwiY3JlYXRlLXBlcnNpc3RlbnQtc2VsZWN0aW9uXCIsXG4gICAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgICAnbSc6ICd2aW0tbW9kZS1wbHVzOnRvZ2dsZS1wZXJzaXN0ZW50LXNlbGVjdGlvbidcblxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtY29mZmVlLXNjcmlwdCcpXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIG9sZEdyYW1tYXIgPSBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoYXRvbS5ncmFtbWFycy5ncmFtbWFyRm9yU2NvcGVOYW1lKCdzb3VyY2UuY29mZmVlJykpXG5cbiAgICAgICAgc2V0IHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgY29uc3RydWN0b3I6IChAbWFpbiwgQGVkaXRvciwgQHN0YXR1c0Jhck1hbmFnZXIpIC0+XG4gICAgICAgICAgICAgIEBlZGl0b3JFbGVtZW50ID0gQGVkaXRvci5lbGVtZW50XG4gICAgICAgICAgICAgIEBlbWl0dGVyID0gbmV3IEVtaXR0ZXJcbiAgICAgICAgICAgICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgICAgICAgICAgICBAbW9kZU1hbmFnZXIgPSBuZXcgTW9kZU1hbmFnZXIodGhpcylcbiAgICAgICAgICAgICAgQG1hcmsgPSBuZXcgTWFya01hbmFnZXIodGhpcylcbiAgICAgICAgICAgICAgQHJlZ2lzdGVyID0gbmV3IFJlZ2lzdGVyTWFuYWdlcih0aGlzKVxuICAgICAgICAgICAgICBAcGVyc2lzdGVudFNlbGVjdGlvbnMgPSBbXVxuXG4gICAgICAgICAgICAgIEBoaWdobGlnaHRTZWFyY2hTdWJzY3JpcHRpb24gPSBAZWRpdG9yRWxlbWVudC5vbkRpZENoYW5nZVNjcm9sbFRvcCA9PlxuICAgICAgICAgICAgICAgIEByZWZyZXNoSGlnaGxpZ2h0U2VhcmNoKClcblxuICAgICAgICAgICAgICBAb3BlcmF0aW9uU3RhY2sgPSBuZXcgT3BlcmF0aW9uU3RhY2sodGhpcylcbiAgICAgICAgICAgICAgQGN1cnNvclN0eWxlTWFuYWdlciA9IG5ldyBDdXJzb3JTdHlsZU1hbmFnZXIodGhpcylcblxuICAgICAgICAgICAgYW5vdGhlckZ1bmM6IC0+XG4gICAgICAgICAgICAgIEBoZWxsbyA9IFtdXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgaXQgJ2NoYW5nZSBhbGwgYXNzaWdubWVudChcIj1cIikgb2YgY3VycmVudC1mdW5jdGlvbiB0byBcIj89XCInLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdqIGYgPScsIGN1cnNvcjogWzEsIDE3XVxuXG4gICAgICAgIHJ1bnMgLT5cbiAgICAgICAgICBrZXlzdHJva2UgW1xuICAgICAgICAgICAgJ2cgY21kLWQnICMgc2VsZWN0LW9jY3VycmVuY2VcbiAgICAgICAgICAgICdpIGYnICAgICAjIGlubmVyLWZ1bmN0aW9uLXRleHQtb2JqZWN0XG4gICAgICAgICAgICAnbScgICAgICAgIyB0b2dnbGUtcGVyc2lzdGVudC1zZWxlY3Rpb25cbiAgICAgICAgICBdLmpvaW4oXCIgXCIpXG5cbiAgICAgICAgICB0ZXh0c0luQnVmZmVyUmFuZ2UgPSB2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlckJ1ZmZlclJhbmdlcygpLm1hcCAocmFuZ2UpIC0+XG4gICAgICAgICAgICBlZGl0b3IuZ2V0VGV4dEluQnVmZmVyUmFuZ2UocmFuZ2UpXG4gICAgICAgICAgdGV4dHNJbkJ1ZmZlclJhbmdlSXNBbGxFcXVhbENoYXIgPSB0ZXh0c0luQnVmZmVyUmFuZ2UuZXZlcnkoKHRleHQpIC0+IHRleHQgaXMgJz0nKVxuICAgICAgICAgIGV4cGVjdCh0ZXh0c0luQnVmZmVyUmFuZ2VJc0FsbEVxdWFsQ2hhcikudG9CZSh0cnVlKVxuICAgICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5wZXJzaXN0ZW50U2VsZWN0aW9uLmdldE1hcmtlcnMoKSkudG9IYXZlTGVuZ3RoKDExKVxuXG4gICAgICAgICAga2V5c3Ryb2tlICcyIGwnICMgdG8gbW92ZSB0byBvdXQtc2lkZSBvZiByYW5nZS1tcmtlclxuICAgICAgICAgIGVuc3VyZSAnLyA9PiBlbnRlcicsIGN1cnNvcjogWzksIDY5XVxuICAgICAgICAgIGtleXN0cm9rZSBcIm1cIiAjIGNsZWFyIHBlcnNpc3RlbnRTZWxlY3Rpb24gYXQgY3Vyc29yIHdoaWNoIGlzID0gc2lnbiBwYXJ0IG9mIGZhdCBhcnJvdy5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUucGVyc2lzdGVudFNlbGVjdGlvbi5nZXRNYXJrZXJzKCkpLnRvSGF2ZUxlbmd0aCgxMClcblxuICAgICAgICB3YWl0c0ZvciAtPlxuICAgICAgICAgIGNsYXNzTGlzdC5jb250YWlucygnaGFzLXBlcnNpc3RlbnQtc2VsZWN0aW9uJylcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAga2V5c3Ryb2tlIFwiY3RybC1jbWQtZyBJXCIgIyBcInNlbGVjdC1wZXJzaXN0ZW50LXNlbGVjdGlvblwiIHRoZW4gXCJJbnNlcnQgYXQgc3RhcnQgb2Ygc2VsZWN0aW9uXCJcblxuICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KCc/JylcbiAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yOiAoQG1haW4sIEBlZGl0b3IsIEBzdGF0dXNCYXJNYW5hZ2VyKSAtPlxuICAgICAgICAgICAgICBAZWRpdG9yRWxlbWVudCA/PSBAZWRpdG9yLmVsZW1lbnRcbiAgICAgICAgICAgICAgQGVtaXR0ZXIgPz0gbmV3IEVtaXR0ZXJcbiAgICAgICAgICAgICAgQHN1YnNjcmlwdGlvbnMgPz0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgICAgICAgICAgICAgQG1vZGVNYW5hZ2VyID89IG5ldyBNb2RlTWFuYWdlcih0aGlzKVxuICAgICAgICAgICAgICBAbWFyayA/PSBuZXcgTWFya01hbmFnZXIodGhpcylcbiAgICAgICAgICAgICAgQHJlZ2lzdGVyID89IG5ldyBSZWdpc3Rlck1hbmFnZXIodGhpcylcbiAgICAgICAgICAgICAgQHBlcnNpc3RlbnRTZWxlY3Rpb25zID89IFtdXG5cbiAgICAgICAgICAgICAgQGhpZ2hsaWdodFNlYXJjaFN1YnNjcmlwdGlvbiA/PSBAZWRpdG9yRWxlbWVudC5vbkRpZENoYW5nZVNjcm9sbFRvcCA9PlxuICAgICAgICAgICAgICAgIEByZWZyZXNoSGlnaGxpZ2h0U2VhcmNoKClcblxuICAgICAgICAgICAgICBAb3BlcmF0aW9uU3RhY2sgPz0gbmV3IE9wZXJhdGlvblN0YWNrKHRoaXMpXG4gICAgICAgICAgICAgIEBjdXJzb3JTdHlsZU1hbmFnZXIgPz0gbmV3IEN1cnNvclN0eWxlTWFuYWdlcih0aGlzKVxuXG4gICAgICAgICAgICBhbm90aGVyRnVuYzogLT5cbiAgICAgICAgICAgICAgQGhlbGxvID0gW11cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gIGRlc2NyaWJlIFwicHJlc2V0IG9jY3VycmVuY2UgbWFya2VyXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBUaGlzIHRleHQgaGF2ZSAzIGluc3RhbmNlIG9mICd0ZXh0JyBpbiB0aGUgd2hvbGUgdGV4dFxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwidG9nZ2xlLXByZXNldC1vY2N1cnJlbmNlIGNvbW1hbmRzXCIsIC0+XG4gICAgICBkZXNjcmliZSBcImluIG5vcm1hbC1tb2RlXCIsIC0+XG4gICAgICAgIGRlc2NyaWJlIFwiYWRkIHByZXNldCBvY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgaXQgJ3NldCBjdXJzb3Itd2FyZCBhcyBwcmVzZXQgb2NjdXJyZW5jZSBtYXJrZXIgYW5kIG5vdCBtb3ZlIGN1cnNvcicsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VUZXh0OiAnVGhpcycsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogWydUaGlzJywgJ3RleHQnLCAndGV4dCcsICd0ZXh0J10sIGN1cnNvcjogWzAsIDVdXG5cbiAgICAgICAgZGVzY3JpYmUgXCJyZW1vdmUgcHJlc2V0IG9jY3VycmVuY2VcIiwgLT5cbiAgICAgICAgICBpdCAncmVtb3ZlcyBvY2N1cnJlbmNlIG9uZSBieSBvbmUgc2VwYXJhdGVseScsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VUZXh0OiAnVGhpcycsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogWydUaGlzJywgJ3RleHQnLCAndGV4dCcsICd0ZXh0J10sIGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VUZXh0OiBbJ1RoaXMnLCAndGV4dCcsICd0ZXh0J10sIGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAgICBlbnN1cmUgJ2IgZyBvJywgb2NjdXJyZW5jZVRleHQ6IFsndGV4dCcsICd0ZXh0J10sIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgaXQgJ3JlbW92ZXMgYWxsIG9jY3VycmVuY2UgaW4gdGhpcyBlZGl0b3IgYnkgZXNjYXBlJywgLT5cbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZVRleHQ6ICdUaGlzJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAndycsIGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VUZXh0OiBbJ1RoaXMnLCAndGV4dCcsICd0ZXh0JywgJ3RleHQnXSwgY3Vyc29yOiBbMCwgNV1cbiAgICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgb2NjdXJyZW5jZUNvdW50OiAwXG5cbiAgICAgICAgICBpdCAnY2FuIHJlY2FsbCBwcmV2aW91c2x5IHNldCBvY2N1cmVuY2UgcGF0dGVybiBieSBgZyAuYCcsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ3cgdiBsIGcgbycsIG9jY3VycmVuY2VUZXh0OiBbJ3RlJywgJ3RlJywgJ3RlJ10sIGN1cnNvcjogWzAsIDZdXG4gICAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG9jY3VycmVuY2VDb3VudDogMFxuICAgICAgICAgICAgZXhwZWN0KHZpbVN0YXRlLmdsb2JhbFN0YXRlLmdldCgnbGFzdE9jY3VycmVuY2VQYXR0ZXJuJykpLnRvRXF1YWwoL3RlL2cpXG5cbiAgICAgICAgICAgIGVuc3VyZSAndycsIGN1cnNvcjogWzAsIDEwXSAjIHRvIG1vdmUgY3Vyc29yIHRvIHRleHQgYGhhdmVgXG4gICAgICAgICAgICBlbnN1cmUgJ2cgLicsIG9jY3VycmVuY2VUZXh0OiBbJ3RlJywgJ3RlJywgJ3RlJ10sIGN1cnNvcjogWzAsIDEwXVxuXG4gICAgICAgICAgICAjIEJ1dCBvcGVyYXRvciBtb2RpZmllciBub3QgdXBkYXRlIGxhc3RPY2N1cnJlbmNlUGF0dGVyblxuICAgICAgICAgICAgZW5zdXJlICdnIFUgbyAkJywgdGV4dEM6IFwiVGhpcyB0ZXh0IHxIQVZFIDMgaW5zdGFuY2Ugb2YgJ3RleHQnIGluIHRoZSB3aG9sZSB0ZXh0XCJcbiAgICAgICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5nbG9iYWxTdGF0ZS5nZXQoJ2xhc3RPY2N1cnJlbmNlUGF0dGVybicpKS50b0VxdWFsKC90ZS9nKVxuXG4gICAgICAgIGRlc2NyaWJlIFwicmVzdG9yZSBsYXN0IG9jY3VycmVuY2UgbWFya2VyIGJ5IGFkZC1wcmVzZXQtb2NjdXJyZW5jZS1mcm9tLWxhc3Qtb2NjdXJyZW5jZS1wYXR0ZXJuXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgICAgY2FtZWxcbiAgICAgICAgICAgICAgY2FtZWxDYXNlXG4gICAgICAgICAgICAgIGNhbWVsc1xuICAgICAgICAgICAgICBjYW1lbFxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBpdCBcImNhbiByZXN0b3JlIG9jY3VycmVuY2UtbWFya2VyIGFkZGVkIGJ5IGBnIG9gIGluIG5vcm1hbC1tb2RlXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSBcImcgb1wiLCBvY2N1cnJlbmNlVGV4dDogWydjYW1lbCcsICdjYW1lbCddXG4gICAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG9jY3VycmVuY2VDb3VudDogMFxuICAgICAgICAgICAgZW5zdXJlIFwiZyAuXCIsIG9jY3VycmVuY2VUZXh0OiBbJ2NhbWVsJywgJ2NhbWVsJ11cblxuICAgICAgICAgIGl0IFwiY2FuIHJlc3RvcmUgb2NjdXJyZW5jZS1tYXJrZXIgYWRkZWQgYnkgYGcgb2AgaW4gdmlzdWFsLW1vZGVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgZW5zdXJlIFwidiBpIHdcIiwgc2VsZWN0ZWRUZXh0OiBcImNhbWVsXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImcgb1wiLCBvY2N1cnJlbmNlVGV4dDogWydjYW1lbCcsICdjYW1lbCcsICdjYW1lbCcsICdjYW1lbCddXG4gICAgICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG9jY3VycmVuY2VDb3VudDogMFxuICAgICAgICAgICAgZW5zdXJlIFwiZyAuXCIsIG9jY3VycmVuY2VUZXh0OiBbJ2NhbWVsJywgJ2NhbWVsJywgJ2NhbWVsJywgJ2NhbWVsJ11cblxuICAgICAgICAgIGl0IFwiY2FuIHJlc3RvcmUgb2NjdXJyZW5jZS1tYXJrZXIgYWRkZWQgYnkgYGcgT2AgaW4gbm9ybWFsLW1vZGVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgZW5zdXJlIFwiZyBPXCIsIG9jY3VycmVuY2VUZXh0OiBbJ2NhbWVsJywgJ2NhbWVsJywgJ2NhbWVsJ11cbiAgICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgb2NjdXJyZW5jZUNvdW50OiAwXG4gICAgICAgICAgICBlbnN1cmUgXCJnIC5cIiwgb2NjdXJyZW5jZVRleHQ6IFsnY2FtZWwnLCAnY2FtZWwnLCAnY2FtZWwnXVxuXG4gICAgICAgIGRlc2NyaWJlIFwiY3NzIGNsYXNzIGhhcy1vY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgZGVzY3JpYmUgXCJtYW51YWxseSB0b2dnbGUgYnkgdG9nZ2xlLXByZXNldC1vY2N1cnJlbmNlIGNvbW1hbmRcIiwgLT5cbiAgICAgICAgICAgIGl0ICdpcyBhdXRvLXNldC91bnNldCB3aGV0ZXIgYXQgbGVhc3Qgb25lIHByZXNldC1vY2N1cnJlbmNlIHdhcyBleGlzdHMgb3Igbm90JywgLT5cbiAgICAgICAgICAgICAgZXhwZWN0KGNsYXNzTGlzdC5jb250YWlucygnaGFzLW9jY3VycmVuY2UnKSkudG9CZShmYWxzZSlcbiAgICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogJ1RoaXMnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgICBleHBlY3QoY2xhc3NMaXN0LmNvbnRhaW5zKCdoYXMtb2NjdXJyZW5jZScpKS50b0JlKHRydWUpXG4gICAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiAwLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgICBleHBlY3QoY2xhc3NMaXN0LmNvbnRhaW5zKCdoYXMtb2NjdXJyZW5jZScpKS50b0JlKGZhbHNlKVxuXG4gICAgICAgICAgZGVzY3JpYmUgXCJjaGFuZ2UgJ0lOU0lERScgb2YgbWFya2VyXCIsIC0+XG4gICAgICAgICAgICBtYXJrZXJMYXllclVwZGF0ZWQgPSBudWxsXG4gICAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICAgIG1hcmtlckxheWVyVXBkYXRlZCA9IGZhbHNlXG5cbiAgICAgICAgICAgIGl0ICdkZXN0cm95IG1hcmtlciBhbmQgcmVmbGVjdCB0byBcImhhcy1vY2N1cnJlbmNlXCIgQ1NTJywgLT5cbiAgICAgICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgICAgIGV4cGVjdChjbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJykpLnRvQmUoZmFsc2UpXG4gICAgICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogJ1RoaXMnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgICAgIGV4cGVjdChjbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJykpLnRvQmUodHJ1ZSlcblxuICAgICAgICAgICAgICAgIGVuc3VyZSAnbCBpJywgbW9kZTogJ2luc2VydCdcbiAgICAgICAgICAgICAgICB2aW1TdGF0ZS5vY2N1cnJlbmNlTWFuYWdlci5tYXJrZXJMYXllci5vbkRpZFVwZGF0ZSAtPlxuICAgICAgICAgICAgICAgICAgbWFya2VyTGF5ZXJVcGRhdGVkID0gdHJ1ZVxuXG4gICAgICAgICAgICAgICAgZWRpdG9yLmluc2VydFRleHQoJy0tJylcbiAgICAgICAgICAgICAgICBlbnN1cmUgXCJlc2NhcGVcIixcbiAgICAgICAgICAgICAgICAgIHRleHRDOiBcIlQtfC1oaXMgdGV4dCBoYXZlIDMgaW5zdGFuY2Ugb2YgJ3RleHQnIGluIHRoZSB3aG9sZSB0ZXh0XCJcbiAgICAgICAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgICAgICBtYXJrZXJMYXllclVwZGF0ZWRcblxuICAgICAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICAgICAgZW5zdXJlIG9jY3VycmVuY2VDb3VudDogMFxuICAgICAgICAgICAgICAgIGV4cGVjdChjbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJykpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGRlc2NyaWJlIFwiaW4gdmlzdWFsLW1vZGVcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJhZGQgcHJlc2V0IG9jY3VycmVuY2VcIiwgLT5cbiAgICAgICAgICBpdCAnc2V0IHNlbGVjdGVkLXRleHQgYXMgcHJlc2V0IG9jY3VycmVuY2UgbWFya2VyIGFuZCBub3QgbW92ZSBjdXJzb3InLCAtPlxuICAgICAgICAgICAgZW5zdXJlICd3IHYgbCcsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXSwgc2VsZWN0ZWRUZXh0OiAndGUnXG4gICAgICAgICAgICBlbnN1cmUgJ2cgbycsIG1vZGU6ICdub3JtYWwnLCBvY2N1cnJlbmNlVGV4dDogWyd0ZScsICd0ZScsICd0ZSddXG4gICAgICAgIGRlc2NyaWJlIFwiaXMtbmFycm93ZWQgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgICAgW3RleHRPcmlnaW5hbF0gPSBbXVxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHRleHRPcmlnaW5hbCA9IFwiXCJcIlxuICAgICAgICAgICAgICBUaGlzIHRleHQgaGF2ZSAzIGluc3RhbmNlIG9mICd0ZXh0JyBpbiB0aGUgd2hvbGUgdGV4dFxuICAgICAgICAgICAgICBUaGlzIHRleHQgaGF2ZSAzIGluc3RhbmNlIG9mICd0ZXh0JyBpbiB0aGUgd2hvbGUgdGV4dFxcblxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHNldFxuICAgICAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgICB0ZXh0OiB0ZXh0T3JpZ2luYWxcbiAgICAgICAgICBpdCBcInBpY2sgb2N1cnJlbmNlLXdvcmQgZnJvbSBjdXJzb3IgcG9zaXRpb24gYW5kIGNvbnRpbnVlIHZpc3VhbC1tb2RlXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ3cgViBqJywgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXSwgc2VsZWN0ZWRUZXh0OiB0ZXh0T3JpZ2luYWxcbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJyxcbiAgICAgICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICAgICAgICBzZWxlY3RlZFRleHQ6IHRleHRPcmlnaW5hbFxuICAgICAgICAgICAgICBvY2N1cnJlbmNlVGV4dDogWyd0ZXh0JywgJ3RleHQnLCAndGV4dCcsICd0ZXh0JywgJ3RleHQnLCAndGV4dCddXG4gICAgICAgICAgICBlbnN1cmUgJ3IgIScsXG4gICAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBUaGlzICEhISEgaGF2ZSAzIGluc3RhbmNlIG9mICchISEhJyBpbiB0aGUgd2hvbGUgISEhIVxuICAgICAgICAgICAgICBUaGlzICEhISEgaGF2ZSAzIGluc3RhbmNlIG9mICchISEhJyBpbiB0aGUgd2hvbGUgISEhIVxcblxuICAgICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJpbiBpbmNyZW1lbnRhbC1zZWFyY2hcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCgnaW5jcmVtZW50YWxTZWFyY2gnLCB0cnVlKVxuXG4gICAgICAgIGRlc2NyaWJlIFwiYWRkLW9jY3VycmVuY2UtcGF0dGVybi1mcm9tLXNlYXJjaFwiLCAtPlxuICAgICAgICAgIGl0ICdtYXJrIGFzIG9jY3VycmVuY2Ugd2hpY2ggbWF0Y2hlcyByZWdleCBlbnRlcmVkIGluIHNlYXJjaC11aScsIC0+XG4gICAgICAgICAgICBrZXlzdHJva2UgJy8nXG4gICAgICAgICAgICBpbnB1dFNlYXJjaFRleHQoJ1xcXFxidFxcXFx3KycpXG4gICAgICAgICAgICBkaXNwYXRjaFNlYXJjaENvbW1hbmQoJ3ZpbS1tb2RlLXBsdXM6YWRkLW9jY3VycmVuY2UtcGF0dGVybi1mcm9tLXNlYXJjaCcpXG4gICAgICAgICAgICBlbnN1cmVcbiAgICAgICAgICAgICAgb2NjdXJyZW5jZVRleHQ6IFsndGV4dCcsICd0ZXh0JywgJ3RoZScsICd0ZXh0J11cblxuICAgIGRlc2NyaWJlIFwibXV0YXRlIHByZXNldCBvY2N1cnJlbmNlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIlwiXCJcbiAgICAgICAgb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgISEhOiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgICBpdCAnW2RlbGV0ZV0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgZW5zdXJlICdsIGcgbyBEJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgOiB4eHg6ICB4eHg6IDpcbiAgICAgICAgICAgICEhITogb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBpdCAnW3VwY2FzZV0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDZdXG4gICAgICAgICAgZW5zdXJlICdsIGcgbyBnIFUgaicsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogWFhYOiBvb28gWFhYOiBvb286XG4gICAgICAgICAgICAhISE6IG9vbzogWFhYOiBvb28gWFhYOiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgaXQgJ1t1cGNhc2UgZXhjbHVkZV0gd29uXFwndCBtdXRhdGUgcmVtb3ZlZCBtYXJrZXInLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiA2XG4gICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDVcbiAgICAgICAgICBlbnN1cmUgJ2cgVSBqJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiB4eHg6IE9PTyB4eHg6IE9PTzpcbiAgICAgICAgICAgICEhITogT09POiB4eHg6IE9PTyB4eHg6IE9PTzpcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBpdCAnW2RlbGV0ZV0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDEwXVxuICAgICAgICAgIGVuc3VyZSAnZyBvIGcgVSAkJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiB4eHg6IE9PTyB4eHg6IE9PTzpcbiAgICAgICAgICAgICEhITogb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBpdCAnW2NoYW5nZV0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgZW5zdXJlICdsIGcgbyBDJyxcbiAgICAgICAgICAgIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDogeHh4OiAgeHh4OiA6XG4gICAgICAgICAgICAhISE6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCgnWVlZJylcbiAgICAgICAgICBlbnN1cmUgJ2wgZyBvIEMnLFxuICAgICAgICAgICAgbW9kZTogJ2luc2VydCdcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgWVlZOiB4eHg6IFlZWSB4eHg6IFlZWTpcbiAgICAgICAgICAgICEhITogb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgbnVtQ3Vyc29yczogM1xuICAgICAgICBkZXNjcmliZSBcInByZWRlZmluZWQga2V5bWFwIG9uIHdoZW4gaGFzLW9jY3VycmVuY2VcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBzZXRcbiAgICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgVnxpbSBpcyBlZGl0b3IgSSB1c2VkIGJlZm9yZVxuICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgVmltIGlzIGVkaXRvciBJIHVzZWQgYmVmb3JlXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgaXQgJ1tpbnNlcnQtYXQtc3RhcnRdIGFwcGx5IG9wZXJhdGlvbiB0byBwcmVzZXQtbWFya2VyIGludGVyc2VjdGluZyBzZWxlY3RlZCB0YXJnZXQnLCAtPlxuICAgICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlVGV4dDogWydWaW0nLCAnVmltJywgJ1ZpbScsICdWaW0nXVxuICAgICAgICAgICAgY2xhc3NMaXN0LmNvbnRhaW5zKCdoYXMtb2NjdXJyZW5jZScpXG4gICAgICAgICAgICBlbnN1cmUgJ3YgayBJJywgbW9kZTogJ2luc2VydCcsIG51bUN1cnNvcnM6IDJcbiAgICAgICAgICAgIGVkaXRvci5pbnNlcnRUZXh0KFwicHVyZS1cIilcbiAgICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgICBwdXJlIS1WaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgcHVyZXwtVmltIGlzIGVkaXRvciBJIHVzZWQgYmVmb3JlXG4gICAgICAgICAgICAgIFZpbSBpcyBlZGl0b3IgSSB1c2VkIGJlZm9yZVxuICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICBpdCAnW2luc2VydC1hZnRlci1zdGFydF0gYXBwbHkgb3BlcmF0aW9uIHRvIHByZXNldC1tYXJrZXIgaW50ZXJzZWN0aW5nIHNlbGVjdGVkIHRhcmdldCcsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZVRleHQ6IFsnVmltJywgJ1ZpbScsICdWaW0nLCAnVmltJ11cbiAgICAgICAgICAgIGNsYXNzTGlzdC5jb250YWlucygnaGFzLW9jY3VycmVuY2UnKVxuICAgICAgICAgICAgZW5zdXJlICd2IGogQScsIG1vZGU6ICdpbnNlcnQnLCBudW1DdXJzb3JzOiAyXG4gICAgICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dChcIiBhbmQgRW1hY3NcIilcbiAgICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgICBWaW0gaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgVmltIGFuZCBFbWFjfHMgaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgVmltIGFuZCBFbWFjIXMgaXMgZWRpdG9yIEkgdXNlZCBiZWZvcmVcbiAgICAgICAgICAgICAgVmltIGlzIGVkaXRvciBJIHVzZWQgYmVmb3JlXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcInZpc3VhbC1tb2RlXCIsIC0+XG4gICAgICAgIGl0ICdbdXBjYXNlXSBhcHBseSB0byBwcmVzZXQtbWFya2VyIGFzIGxvbmcgYXMgaXQgaW50ZXJzZWN0cyBzZWxlY3Rpb24nLCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiB4fHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICB4eHg6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbnN1cmUgJ2cgbycsIG9jY3VycmVuY2VDb3VudDogNVxuICAgICAgICAgIGVuc3VyZSAndiBqIFUnLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IFhYWDogb29vIFhYWDogb29vOlxuICAgICAgICAgICAgWFhYOiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwidmlzdWFsLWxpbmV3aXNlLW1vZGVcIiwgLT5cbiAgICAgICAgaXQgJ1t1cGNhc2VdIGFwcGx5IHRvIHByZXNldC1tYXJrZXIgYXMgbG9uZyBhcyBpdCBpbnRlcnNlY3RzIHNlbGVjdGlvbicsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgeHh4OiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDVcbiAgICAgICAgICBlbnN1cmUgJ1YgVScsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIG9vbzogWFhYOiBvb28gWFhYOiBvb286XG4gICAgICAgICAgICB4eHg6IG9vbzogeHh4OiBvb28geHh4OiBvb286XG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJ2aXN1YWwtYmxvY2t3aXNlLW1vZGVcIiwgLT5cbiAgICAgICAgaXQgJ1t1cGNhc2VdIGFwcGx5IHRvIHByZXNldC1tYXJrZXIgYXMgbG9uZyBhcyBpdCBpbnRlcnNlY3RzIHNlbGVjdGlvbicsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgeHh4OiBvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgZW5zdXJlICdnIG8nLCBvY2N1cnJlbmNlQ291bnQ6IDVcbiAgICAgICAgICBlbnN1cmUgJ2N0cmwtdiBqIDIgdyBVJyxcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgb29vOiBYWFg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIHh4eDogb29vOiBYWFg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJNb3ZlVG9OZXh0T2NjdXJyZW5jZSwgTW92ZVRvUHJldmlvdXNPY2N1cnJlbmNlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICB8b29vOiB4eHg6IG9vb1xuICAgICAgICAgIF9fXzogb29vOiB4eHg6XG4gICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgICBlbnN1cmUgJ2cgbycsXG4gICAgICAgICAgb2NjdXJyZW5jZVRleHQ6IFsnb29vJywgJ29vbycsICdvb28nLCAnb29vJywgJ29vbyddXG5cbiAgICAgIGRlc2NyaWJlIFwidGFiLCBzaGlmdC10YWJcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJjdXJzb3IgaXMgYXQgc3RhcnQgb2Ygb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgICAgIGl0IFwic2VhcmNoIG5leHQvcHJldmlvdXMgb2NjdXJyZW5jZSBtYXJrZXJcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSAndGFiIHRhYicsIGN1cnNvcjogWzEsIDVdXG4gICAgICAgICAgICBlbnN1cmUgJzIgdGFiJywgY3Vyc29yOiBbMiwgMTBdXG4gICAgICAgICAgICBlbnN1cmUgJzIgc2hpZnQtdGFiJywgY3Vyc29yOiBbMSwgNV1cbiAgICAgICAgICAgIGVuc3VyZSAnMiBzaGlmdC10YWInLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgaW5zaWRlIG9mIG9jY3VycmVuY2VcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBlbnN1cmUgXCJlc2NhcGVcIiwgb2NjdXJyZW5jZUNvdW50OiAwXG4gICAgICAgICAgICBzZXQgdGV4dEM6IFwib29vbyBvb3xvbyBvb29vXCJcbiAgICAgICAgICAgIGVuc3VyZSAnZyBvJywgb2NjdXJyZW5jZUNvdW50OiAzXG5cbiAgICAgICAgICBkZXNjcmliZSBcInRhYlwiLCAtPlxuICAgICAgICAgICAgaXQgXCJtb3ZlIHRvIG5leHQgb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgICAgICAgICBlbnN1cmUgJ3RhYicsIHRleHRDOiAnb29vbyBvb29vIHxvb29vJ1xuXG4gICAgICAgICAgZGVzY3JpYmUgXCJzaGlmdC10YWJcIiwgLT5cbiAgICAgICAgICAgIGl0IFwibW92ZSB0byBwcmV2aW91cyBvY2N1cnJlbmNlXCIsIC0+XG4gICAgICAgICAgICAgIGVuc3VyZSAnc2hpZnQtdGFiJywgdGV4dEM6ICd8b29vbyBvb29vIG9vb28nXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgb3BlcmF0b3IncyB0YXJnZXRcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJ0YWJcIiwgLT5cbiAgICAgICAgICBpdCBcIm9wZXJhdGUgb24gbmV4dCBvY2N1cnJlbmNlIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgXCJnIFUgdGFiXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBPT086IHh4eDogT09PXG4gICAgICAgICAgICAgIF9fXzogb29vOiB4eHg6XG4gICAgICAgICAgICAgIG9vbzogeHh4OiBvb286XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBvY2N1cnJlbmNlQ291bnQ6IDNcbiAgICAgICAgICAgIGVuc3VyZSBcIi5cIixcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIE9PTzogeHh4OiBPT09cbiAgICAgICAgICAgICAgX19fOiBPT086IHh4eDpcbiAgICAgICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgIG9jY3VycmVuY2VDb3VudDogMlxuICAgICAgICAgICAgZW5zdXJlIFwiMiAuXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBPT086IHh4eDogT09PXG4gICAgICAgICAgICAgIF9fXzogT09POiB4eHg6XG4gICAgICAgICAgICAgIE9PTzogeHh4OiBPT086XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBvY2N1cnJlbmNlQ291bnQ6IDBcbiAgICAgICAgICAgIGV4cGVjdChjbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJykpLnRvQmUoZmFsc2UpXG5cbiAgICAgICAgICBpdCBcIltvLW1vZGlmaWVyXSBvcGVyYXRlIG9uIG5leHQgb2NjdXJyZW5jZSBhbmQgcmVwZWF0YWJsZVwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlIFwiZXNjYXBlXCIsXG4gICAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICAgIG9jY3VycmVuY2VDb3VudDogMFxuXG4gICAgICAgICAgICBlbnN1cmUgXCJnIFUgbyB0YWJcIixcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIE9PTzogeHh4OiBPT09cbiAgICAgICAgICAgICAgX19fOiBvb286IHh4eDpcbiAgICAgICAgICAgICAgb29vOiB4eHg6IG9vbzpcbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgIG9jY3VycmVuY2VDb3VudDogMFxuXG4gICAgICAgICAgICBlbnN1cmUgXCIuXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBPT086IHh4eDogT09PXG4gICAgICAgICAgICAgIF9fXzogT09POiB4eHg6XG4gICAgICAgICAgICAgIG9vbzogeHh4OiBvb286XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBvY2N1cnJlbmNlQ291bnQ6IDBcblxuICAgICAgICAgICAgZW5zdXJlIFwiMiAuXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBPT086IHh4eDogT09PXG4gICAgICAgICAgICAgIF9fXzogT09POiB4eHg6XG4gICAgICAgICAgICAgIE9PTzogeHh4OiBPT086XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBvY2N1cnJlbmNlQ291bnQ6IDBcblxuICAgICAgICBkZXNjcmliZSBcInNoaWZ0LXRhYlwiLCAtPlxuICAgICAgICAgIGl0IFwib3BlcmF0ZSBvbiBuZXh0IHByZXZpb3VzIGFuZCByZXBlYXRhYmxlXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMTBdXG4gICAgICAgICAgICBlbnN1cmUgXCJnIFUgc2hpZnQtdGFiXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBvb286IHh4eDogb29vXG4gICAgICAgICAgICAgIF9fXzogb29vOiB4eHg6XG4gICAgICAgICAgICAgIE9PTzogeHh4OiBPT086XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBvY2N1cnJlbmNlQ291bnQ6IDNcbiAgICAgICAgICAgIGVuc3VyZSBcIi5cIixcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIG9vbzogeHh4OiBvb29cbiAgICAgICAgICAgICAgX19fOiBPT086IHh4eDpcbiAgICAgICAgICAgICAgT09POiB4eHg6IE9PTzpcbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICAgIG9jY3VycmVuY2VDb3VudDogMlxuICAgICAgICAgICAgZW5zdXJlIFwiMiAuXCIsXG4gICAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBPT086IHh4eDogT09PXG4gICAgICAgICAgICAgIF9fXzogT09POiB4eHg6XG4gICAgICAgICAgICAgIE9PTzogeHh4OiBPT086XG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBvY2N1cnJlbmNlQ291bnQ6IDBcbiAgICAgICAgICAgIGV4cGVjdChjbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1vY2N1cnJlbmNlJykpLnRvQmUoZmFsc2UpXG5cbiAgICAgIGRlc2NyaWJlIFwiZXhjdWRlIHBhcnRpY3VsYXIgb2NjdXJlbmNlIGJ5IGAuYCByZXBlYXRcIiwgLT5cbiAgICAgICAgaXQgXCJjbGVhciBwcmVzZXQtb2NjdXJyZW5jZSBhbmQgbW92ZSB0byBuZXh0XCIsIC0+XG4gICAgICAgICAgZW5zdXJlICcyIHRhYiAuIGcgVSBpIHAnLFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgT09POiB4eHg6IE9PT1xuICAgICAgICAgICAgX19fOiB8b29vOiB4eHg6XG4gICAgICAgICAgICBPT086IHh4eDogT09POlxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgaXQgXCJjbGVhciBwcmVzZXQtb2NjdXJyZW5jZSBhbmQgbW92ZSB0byBwcmV2aW91c1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnMiBzaGlmdC10YWIgLiBnIFUgaSBwJyxcbiAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgIE9PTzogeHh4OiBPT09cbiAgICAgICAgICAgIF9fXzogT09POiB4eHg6XG4gICAgICAgICAgICB8b29vOiB4eHg6IE9PTzpcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gbXVsdGlwbGUgcHJlc2V0LW9jY3VycmVuY2UgY3JlYXRlZCBhdCBkaWZmZXJlbnQgdGltaW5nXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDVdXG4gICAgICAgICAgZW5zdXJlICdnIG8nLFxuICAgICAgICAgICAgb2NjdXJyZW5jZVRleHQ6IFsnb29vJywgJ29vbycsICdvb28nLCAnb29vJywgJ29vbycsICd4eHgnLCAneHh4JywgJ3h4eCddXG5cbiAgICAgICAgaXQgXCJ2aXNpdCBvY2N1cnJlbmNlcyBvcmRlcmVkIGJ5IGJ1ZmZlciBwb3NpdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcInRhYlwiLCAgICAgICB0ZXh0QzogXCJvb286IHh4eDogfG9vb1xcbl9fXzogb29vOiB4eHg6XFxub29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInRhYlwiLCAgICAgICB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiB8b29vOiB4eHg6XFxub29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInRhYlwiLCAgICAgICB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHx4eHg6XFxub29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInRhYlwiLCAgICAgICB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHh4eDpcXG58b29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInRhYlwiLCAgICAgICB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHh4eDpcXG5vb286IHx4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInRhYlwiLCAgICAgICB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHh4eDpcXG5vb286IHh4eDogfG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInNoaWZ0LXRhYlwiLCB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHh4eDpcXG5vb286IHx4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInNoaWZ0LXRhYlwiLCB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHh4eDpcXG58b29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInNoaWZ0LXRhYlwiLCB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiBvb286IHx4eHg6XFxub29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInNoaWZ0LXRhYlwiLCB0ZXh0QzogXCJvb286IHh4eDogb29vXFxuX19fOiB8b29vOiB4eHg6XFxub29vOiB4eHg6IG9vbzpcIlxuICAgICAgICAgIGVuc3VyZSBcInNoaWZ0LXRhYlwiLCB0ZXh0QzogXCJvb286IHh4eDogfG9vb1xcbl9fXzogb29vOiB4eHg6XFxub29vOiB4eHg6IG9vbzpcIlxuXG4gICAgZGVzY3JpYmUgXCJleHBsaWN0IG9wZXJhdG9yLW1vZGlmaWVyIG8gYW5kIHByZXNldC1tYXJrZXJcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgIHxvb286IHh4eDogb29vIHh4eDogb29vOlxuICAgICAgICAgIF9fXzogb29vOiB4eHg6IG9vbyB4eHg6IG9vbzpcbiAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCInbycgbW9kaWZpZXIgd2hlbiBwcmVzZXQgb2NjdXJyZW5jZSBhbHJlYWR5IGV4aXN0c1wiLCAtPlxuICAgICAgICBpdCBcIidvJyBhbHdheXMgcGljayBjdXJzb3Itd29yZCBhbmQgb3ZlcndyaXRlIGV4aXN0aW5nIHByZXNldCBtYXJrZXIpXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiZyBvXCIsXG4gICAgICAgICAgICBvY2N1cnJlbmNlVGV4dDogW1wib29vXCIsIFwib29vXCIsIFwib29vXCIsIFwib29vXCIsIFwib29vXCIsIFwib29vXCJdXG4gICAgICAgICAgZW5zdXJlIFwiMiB3IGQgb1wiLFxuICAgICAgICAgICAgb2NjdXJyZW5jZVRleHQ6IFtcInh4eFwiLCBcInh4eFwiLCBcInh4eFwiLCBcInh4eFwiXVxuICAgICAgICAgICAgbW9kZTogJ29wZXJhdG9yLXBlbmRpbmcnXG4gICAgICAgICAgZW5zdXJlIFwialwiLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBvb286IDogb29vIDogb29vOlxuICAgICAgICAgICAgX19fOiBvb286IDogb29vIDogb29vOlxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICBkZXNjcmliZSBcIm9jY3VycmVuY2UgYm91bmQgb3BlcmF0b3IgZG9uJ3Qgb3ZlcndpdGUgcHJlLWV4aXN0aW5nIHByZXNldCBtYXJrZXJcIiwgLT5cbiAgICAgICAgaXQgXCInbycgYWx3YXlzIHBpY2sgY3Vyc29yLXdvcmQgYW5kIGNsZWFyIGV4aXN0aW5nIHByZXNldCBtYXJrZXJcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJnIG9cIixcbiAgICAgICAgICAgIG9jY3VycmVuY2VUZXh0OiBbXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIiwgXCJvb29cIl1cbiAgICAgICAgICBlbnN1cmUgXCIyIHcgZyBjbWQtZFwiLFxuICAgICAgICAgICAgb2NjdXJyZW5jZVRleHQ6IFtcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiXVxuICAgICAgICAgICAgbW9kZTogJ29wZXJhdG9yLXBlbmRpbmcnXG4gICAgICAgICAgZW5zdXJlIFwialwiLFxuICAgICAgICAgICBzZWxlY3RlZFRleHQ6IFtcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiLCBcIm9vb1wiXVxuXG4gICAgZGVzY3JpYmUgXCJ0b2dnbGUtcHJlc2V0LXN1YndvcmQtb2NjdXJyZW5jZSBjb21tYW5kc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG5cbiAgICAgICAgICBjYW1lbENhfHNlIENhc2VzXG4gICAgICAgICAgXCJDYXNlU3R1ZHlcIiBTbmFrZUNhc2VcbiAgICAgICAgICBVUF9DQVNFXG5cbiAgICAgICAgICBvdGhlciBQYXJhZ3JhcGhDYXNlXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwiYWRkIHByZXNldCBzdWJ3b3JkLW9jY3VycmVuY2VcIiwgLT5cbiAgICAgICAgaXQgXCJtYXJrIHN1YndvcmQgdW5kZXIgY3Vyc29yXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdnIE8nLCBvY2N1cnJlbmNlVGV4dDogWydDYXNlJywgJ0Nhc2UnLCAnQ2FzZScsICdDYXNlJ11cblxuICBkZXNjcmliZSBcImxpbmV3aXNlLWJvdW5kLW9wZXJhdGlvbiBpbiBvY2N1cnJlbmNlIG9wZXJhdGlvblwiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZShcImxhbmd1YWdlLWphdmFzY3JpcHRcIilcblxuICAgICAgcnVucyAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICBncmFtbWFyOiAnc291cmNlLmpzJ1xuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICBmdW5jdGlvbiBoZWxsbyhuYW1lKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImRlYnVnLTFcIilcbiAgICAgICAgICAgIHxjb25zb2xlLmxvZyhcImRlYnVnLTJcIilcblxuICAgICAgICAgICAgY29uc3QgZ3JlZXRpbmcgPSBcImhlbGxvXCJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVidWctM1wiKVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcImRlYnVnLTQsIGluY2x1ZCBgY29uc29sZWAgd29yZFwiKVxuICAgICAgICAgICAgcmV0dXJybiBuYW1lICsgXCIgXCIgKyBncmVldGluZ1xuICAgICAgICAgIH1cbiAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwid2l0aCBwcmVzZXQtb2NjdXJyZW5jZVwiLCAtPlxuICAgICAgaXQgXCJ3b3JrcyBjaGFyYWN0ZXJ3aXNlIGZvciBgZGVsZXRlYCBvcGVyYXRvclwiLCAtPlxuICAgICAgICBlbnN1cmUgXCJnIG8gdiBpIGZcIiwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICBlbnN1cmUgXCJkXCIsXG4gICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgIGZ1bmN0aW9uIGhlbGxvKG5hbWUpIHtcbiAgICAgICAgICAgIHwubG9nKFwiZGVidWctMVwiKVxuICAgICAgICAgICAgLmxvZyhcImRlYnVnLTJcIilcblxuICAgICAgICAgICAgY29uc3QgZ3JlZXRpbmcgPSBcImhlbGxvXCJcbiAgICAgICAgICAgIC5sb2coXCJkZWJ1Zy0zXCIpXG5cbiAgICAgICAgICAgIC5sb2coXCJkZWJ1Zy00LCBpbmNsdWQgYGAgd29yZFwiKVxuICAgICAgICAgICAgcmV0dXJybiBuYW1lICsgXCIgXCIgKyBncmVldGluZ1xuICAgICAgICAgIH1cbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwid29ya3MgbGluZXdpc2UgZm9yIGBkZWxldGUtbGluZWAgb3BlcmF0b3JcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiZyBvIHYgaSBmIERcIixcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgZnVuY3Rpb24gaGVsbG8obmFtZSkge1xuICAgICAgICAgIHxcbiAgICAgICAgICAgIGNvbnN0IGdyZWV0aW5nID0gXCJoZWxsb1wiXG5cbiAgICAgICAgICAgIHJldHVycm4gbmFtZSArIFwiIFwiICsgZ3JlZXRpbmdcbiAgICAgICAgICB9XG4gICAgICAgICAgXCJcIlwiXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHNwZWNpZmllZCBib3RoIG8gYW5kIFYgb3BlcmF0b3ItbW9kaWZpZXJcIiwgLT5cbiAgICAgIGl0IFwiZGVsZXRlIGBjb25zb2xlYCBpbmNsdWRpbmcgbGluZSBieSBgVmAgbW9kaWZpZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiZCBvIFYgZlwiLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICBmdW5jdGlvbiBoZWxsbyhuYW1lKSB7XG4gICAgICAgICAgfFxuICAgICAgICAgICAgY29uc3QgZ3JlZXRpbmcgPSBcImhlbGxvXCJcblxuICAgICAgICAgICAgcmV0dXJybiBuYW1lICsgXCIgXCIgKyBncmVldGluZ1xuICAgICAgICAgIH1cbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwidXBwZXItY2FzZSBgY29uc29sZWAgaW5jbHVkaW5nIGxpbmUgYnkgYFZgIG1vZGlmaWVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcImcgVSBvIFYgZlwiLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICBmdW5jdGlvbiBoZWxsbyhuYW1lKSB7XG4gICAgICAgICAgICBDT05TT0xFLkxPRyhcIkRFQlVHLTFcIilcbiAgICAgICAgICAgIHxDT05TT0xFLkxPRyhcIkRFQlVHLTJcIilcblxuICAgICAgICAgICAgY29uc3QgZ3JlZXRpbmcgPSBcImhlbGxvXCJcbiAgICAgICAgICAgIENPTlNPTEUuTE9HKFwiREVCVUctM1wiKVxuXG4gICAgICAgICAgICBDT05TT0xFLkxPRyhcIkRFQlVHLTQsIElOQ0xVRCBgQ09OU09MRWAgV09SRFwiKVxuICAgICAgICAgICAgcmV0dXJybiBuYW1lICsgXCIgXCIgKyBncmVldGluZ1xuICAgICAgICAgIH1cbiAgICAgICAgICBcIlwiXCJcbiAgICBkZXNjcmliZSBcIndpdGggbyBvcGVyYXRvci1tb2RpZmllclwiLCAtPlxuICAgICAgaXQgXCJ0b2dnbGUtbGluZS1jb21tZW50cyBvZiBgb2NjdXJyZW5jZWAgaW5jbGRpbmcgKipsaW5lcyoqXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcImcgLyBvIGZcIixcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgZnVuY3Rpb24gaGVsbG8obmFtZSkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJkZWJ1Zy0xXCIpXG4gICAgICAgICAgICAvLyB8Y29uc29sZS5sb2coXCJkZWJ1Zy0yXCIpXG5cbiAgICAgICAgICAgIGNvbnN0IGdyZWV0aW5nID0gXCJoZWxsb1wiXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcImRlYnVnLTNcIilcblxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJkZWJ1Zy00LCBpbmNsdWQgYGNvbnNvbGVgIHdvcmRcIilcbiAgICAgICAgICAgIHJldHVycm4gbmFtZSArIFwiIFwiICsgZ3JlZXRpbmdcbiAgICAgICAgICB9XG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnLicsXG4gICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgIGZ1bmN0aW9uIGhlbGxvKG5hbWUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVidWctMVwiKVxuICAgICAgICAgICAgfGNvbnNvbGUubG9nKFwiZGVidWctMlwiKVxuXG4gICAgICAgICAgICBjb25zdCBncmVldGluZyA9IFwiaGVsbG9cIlxuICAgICAgICAgICAgY29uc29sZS5sb2coXCJkZWJ1Zy0zXCIpXG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZGVidWctNCwgaW5jbHVkIGBjb25zb2xlYCB3b3JkXCIpXG4gICAgICAgICAgICByZXR1cnJuIG5hbWUgKyBcIiBcIiArIGdyZWV0aW5nXG4gICAgICAgICAgfVxuICAgICAgICAgIFwiXCJcIlxuIl19
