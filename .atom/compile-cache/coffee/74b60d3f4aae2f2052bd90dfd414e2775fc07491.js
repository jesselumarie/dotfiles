(function() {
  var TextData, _, getVimState, ref, settings, withMockPlatform;

  _ = require('underscore-plus');

  ref = require('./spec-helper'), getVimState = ref.getVimState, TextData = ref.TextData, withMockPlatform = ref.withMockPlatform;

  settings = require('../lib/settings');

  describe("VimState", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
    });
    describe("initialization", function() {
      it("puts the editor in normal-mode initially by default", function() {
        return ensure({
          mode: 'normal'
        });
      });
      return it("puts the editor in insert-mode if startInInsertMode is true", function() {
        settings.set('startInInsertMode', true);
        return getVimState(function(state, vim) {
          return vim.ensure({
            mode: 'insert'
          });
        });
      });
    });
    describe("::destroy", function() {
      it("re-enables text input on the editor", function() {
        expect(editorElement.component.isInputEnabled()).toBeFalsy();
        vimState.destroy();
        return expect(editorElement.component.isInputEnabled()).toBeTruthy();
      });
      it("removes the mode classes from the editor", function() {
        ensure({
          mode: 'normal'
        });
        vimState.destroy();
        return expect(editorElement.classList.contains("normal-mode")).toBeFalsy();
      });
      return it("is a noop when the editor is already destroyed", function() {
        editorElement.getModel().destroy();
        return vimState.destroy();
      });
    });
    describe("normal-mode", function() {
      describe("when entering an insertable character", function() {
        beforeEach(function() {
          return keystroke('\\');
        });
        return it("stops propagation", function() {
          return ensure({
            text: ''
          });
        });
      });
      describe("when entering an operator", function() {
        beforeEach(function() {
          return keystroke('d');
        });
        describe("with an operator that can't be composed", function() {
          beforeEach(function() {
            return keystroke('x');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.operationStack.isEmpty()).toBe(true);
          });
        });
        describe("the escape keybinding", function() {
          beforeEach(function() {
            return keystroke('escape');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.operationStack.isEmpty()).toBe(true);
          });
        });
        return describe("the ctrl-c keybinding", function() {
          beforeEach(function() {
            return keystroke('ctrl-c');
          });
          return it("clears the operator stack", function() {
            return expect(vimState.operationStack.isEmpty()).toBe(true);
          });
        });
      });
      describe("the escape keybinding", function() {
        return it("clears any extra cursors", function() {
          set({
            text: "one-two-three",
            addCursor: [0, 3]
          });
          ensure({
            numCursors: 2
          });
          return ensure('escape', {
            numCursors: 1
          });
        });
      });
      describe("the v keybinding", function() {
        beforeEach(function() {
          set({
            text: "abc",
            cursor: [0, 0]
          });
          return keystroke('v');
        });
        return it("puts the editor into visual characterwise mode", function() {
          return ensure({
            mode: ['visual', 'characterwise']
          });
        });
      });
      describe("the V keybinding", function() {
        beforeEach(function() {
          return set({
            text: "012345\nabcdef",
            cursor: [0, 0]
          });
        });
        it("puts the editor into visual linewise mode", function() {
          return ensure('V', {
            mode: ['visual', 'linewise']
          });
        });
        return it("selects the current line", function() {
          return ensure('V', {
            selectedText: '012345\n'
          });
        });
      });
      describe("the ctrl-v keybinding", function() {
        return it("puts the editor into visual blockwise mode", function() {
          set({
            text: "012345\n\nabcdef",
            cursor: [0, 0]
          });
          return ensure('ctrl-v', {
            mode: ['visual', 'blockwise']
          });
        });
      });
      describe("selecting text", function() {
        beforeEach(function() {
          spyOn(_._, "now").andCallFake(function() {
            return window.now;
          });
          return set({
            text: "abc def",
            cursor: [0, 0]
          });
        });
        it("puts the editor into visual mode", function() {
          ensure({
            mode: 'normal'
          });
          advanceClock(200);
          atom.commands.dispatch(editorElement, "core:select-right");
          return ensure({
            mode: ['visual', 'characterwise'],
            selectedBufferRange: [[0, 0], [0, 1]]
          });
        });
        it("handles the editor being destroyed shortly after selecting text", function() {
          set({
            selectedBufferRange: [[0, 0], [0, 3]]
          });
          editor.destroy();
          vimState.destroy();
          return advanceClock(100);
        });
        return it('handles native selection such as core:select-all', function() {
          atom.commands.dispatch(editorElement, 'core:select-all');
          return ensure({
            selectedBufferRange: [[0, 0], [0, 7]]
          });
        });
      });
      describe("the i keybinding", function() {
        return it("puts the editor into insert mode", function() {
          return ensure('i', {
            mode: 'insert'
          });
        });
      });
      describe("the R keybinding", function() {
        return it("puts the editor into replace mode", function() {
          return ensure('R', {
            mode: ['insert', 'replace']
          });
        });
      });
      describe("with content", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef",
            cursor: [0, 0]
          });
        });
        describe("on a line with content", function() {
          return it("[Changed] won't adjust cursor position if outer command place the cursor on end of line('\\n') character", function() {
            ensure({
              mode: 'normal'
            });
            atom.commands.dispatch(editorElement, "editor:move-to-end-of-line");
            return ensure({
              cursor: [0, 6]
            });
          });
        });
        return describe("on an empty line", function() {
          return it("allows the cursor to be placed on the \n character", function() {
            set({
              cursor: [1, 0]
            });
            return ensure({
              cursor: [1, 0]
            });
          });
        });
      });
      return describe('with character-input operations', function() {
        beforeEach(function() {
          return set({
            text: '012345\nabcdef'
          });
        });
        return it('properly clears the operations', function() {
          ensure('d', {
            mode: 'operator-pending'
          });
          expect(vimState.operationStack.isEmpty()).toBe(false);
          ensure('r', {
            mode: 'normal'
          });
          expect(vimState.operationStack.isEmpty()).toBe(true);
          ensure('d', {
            mode: 'operator-pending'
          });
          expect(vimState.operationStack.isEmpty()).toBe(false);
          ensure('escape', {
            mode: 'normal',
            text: '012345\nabcdef'
          });
          return expect(vimState.operationStack.isEmpty()).toBe(true);
        });
      });
    });
    describe("activate-normal-mode-once command", function() {
      beforeEach(function() {
        set({
          text: "0 23456\n1 23456",
          cursor: [0, 2]
        });
        return ensure('i', {
          mode: 'insert',
          cursor: [0, 2]
        });
      });
      return it("activate normal mode without moving cursors left, then back to insert-mode once some command executed", function() {
        ensure('ctrl-o', {
          cursor: [0, 2],
          mode: 'normal'
        });
        return ensure('l', {
          cursor: [0, 3],
          mode: 'insert'
        });
      });
    });
    describe("insert-mode", function() {
      beforeEach(function() {
        return keystroke('i');
      });
      describe("with content", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef"
          });
        });
        describe("when cursor is in the middle of the line", function() {
          return it("moves the cursor to the left when exiting insert mode", function() {
            set({
              cursor: [0, 3]
            });
            return ensure('escape', {
              cursor: [0, 2]
            });
          });
        });
        describe("when cursor is at the beginning of line", function() {
          return it("leaves the cursor at the beginning of line", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('escape', {
              cursor: [1, 0]
            });
          });
        });
        return describe("on a line with content", function() {
          return it("allows the cursor to be placed on the \n character", function() {
            set({
              cursor: [0, 6]
            });
            return ensure({
              cursor: [0, 6]
            });
          });
        });
      });
      it("puts the editor into normal mode when <escape> is pressed", function() {
        return escape('escape', {
          mode: 'normal'
        });
      });
      it("puts the editor into normal mode when <ctrl-c> is pressed", function() {
        return withMockPlatform(editorElement, 'platform-darwin', function() {
          return ensure('ctrl-c', {
            mode: 'normal'
          });
        });
      });
      describe("clearMultipleCursorsOnEscapeInsertMode setting", function() {
        beforeEach(function() {
          return set({
            text: 'abc',
            cursor: [[0, 1], [0, 2]]
          });
        });
        describe("when enabled, clear multiple cursors on escaping insert-mode", function() {
          beforeEach(function() {
            return settings.set('clearMultipleCursorsOnEscapeInsertMode', true);
          });
          it("clear multiple cursors by respecting last cursor's position", function() {
            return ensure('escape', {
              mode: 'normal',
              numCursors: 1,
              cursor: [0, 1]
            });
          });
          return it("clear multiple cursors by respecting last cursor's position", function() {
            set({
              cursor: [[0, 2], [0, 1]]
            });
            return ensure('escape', {
              mode: 'normal',
              numCursors: 1,
              cursor: [0, 0]
            });
          });
        });
        return describe("when disabled", function() {
          beforeEach(function() {
            return settings.set('clearMultipleCursorsOnEscapeInsertMode', false);
          });
          return it("keep multiple cursors", function() {
            return ensure('escape', {
              mode: 'normal',
              numCursors: 2,
              cursor: [[0, 0], [0, 1]]
            });
          });
        });
      });
      return describe("automaticallyEscapeInsertModeOnActivePaneItemChange setting", function() {
        var otherEditor, otherVim, pane, ref2;
        ref2 = [], otherVim = ref2[0], otherEditor = ref2[1], pane = ref2[2];
        beforeEach(function() {
          getVimState(function(otherVimState, _other) {
            otherVim = _other;
            return otherEditor = otherVimState.editor;
          });
          return runs(function() {
            pane = atom.workspace.getActivePane();
            pane.activateItem(editor);
            set({
              textC: "|editor-1"
            });
            otherVim.set({
              textC: "|editor-2"
            });
            ensure('i', {
              mode: 'insert'
            });
            otherVim.ensure('i', {
              mode: 'insert'
            });
            return expect(pane.getActiveItem()).toBe(editor);
          });
        });
        describe("default behavior", function() {
          return it("remain in insert-mode on paneItem change by default", function() {
            pane.activateItem(otherEditor);
            expect(pane.getActiveItem()).toBe(otherEditor);
            ensure({
              mode: 'insert'
            });
            return otherVim.ensure({
              mode: 'insert'
            });
          });
        });
        return describe("automaticallyEscapeInsertModeOnActivePaneItemChange = true", function() {
          beforeEach(function() {
            settings.set('automaticallyEscapeInsertModeOnActivePaneItemChange', true);
            return jasmine.useRealClock();
          });
          return it("automatically shift to normal mode except new active editor", function() {
            var called;
            called = false;
            runs(function() {
              atom.workspace.onDidStopChangingActivePaneItem(function() {
                return called = true;
              });
              return pane.activateItem(otherEditor);
            });
            waitsFor(function() {
              return called;
            });
            return runs(function() {
              expect(pane.getActiveItem()).toBe(otherEditor);
              ensure({
                mode: 'normal'
              });
              return otherVim.ensure({
                mode: 'insert'
              });
            });
          });
        });
      });
    });
    describe("replace-mode", function() {
      describe("with content", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef"
          });
        });
        describe("when cursor is in the middle of the line", function() {
          return it("moves the cursor to the left when exiting replace mode", function() {
            set({
              cursor: [0, 3]
            });
            return ensure('R escape', {
              cursor: [0, 2]
            });
          });
        });
        describe("when cursor is at the beginning of line", function() {
          beforeEach(function() {});
          return it("leaves the cursor at the beginning of line", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('R escape', {
              cursor: [1, 0]
            });
          });
        });
        return describe("on a line with content", function() {
          return it("allows the cursor to be placed on the \n character", function() {
            keystroke('R');
            set({
              cursor: [0, 6]
            });
            return ensure({
              cursor: [0, 6]
            });
          });
        });
      });
      it("puts the editor into normal mode when <escape> is pressed", function() {
        return ensure('R escape', {
          mode: 'normal'
        });
      });
      return it("puts the editor into normal mode when <ctrl-c> is pressed", function() {
        return withMockPlatform(editorElement, 'platform-darwin', function() {
          return ensure('R ctrl-c', {
            mode: 'normal'
          });
        });
      });
    });
    describe("visual-mode", function() {
      beforeEach(function() {
        set({
          text: "one two three",
          cursor: [0, 4]
        });
        return keystroke('v');
      });
      it("selects the character under the cursor", function() {
        return ensure({
          selectedBufferRange: [[0, 4], [0, 5]],
          selectedText: 't'
        });
      });
      it("puts the editor into normal mode when <escape> is pressed", function() {
        return ensure('escape', {
          cursor: [0, 4],
          mode: 'normal'
        });
      });
      it("puts the editor into normal mode when <escape> is pressed on selection is reversed", function() {
        ensure({
          selectedText: 't'
        });
        ensure('h h', {
          selectedText: 'e t',
          selectionIsReversed: true
        });
        return ensure('escape', {
          mode: 'normal',
          cursor: [0, 2]
        });
      });
      describe("motions", function() {
        it("transforms the selection", function() {
          return ensure('w', {
            selectedText: 'two t'
          });
        });
        return it("always leaves the initially selected character selected", function() {
          ensure('h', {
            selectedText: ' t'
          });
          ensure('l', {
            selectedText: 't'
          });
          return ensure('l', {
            selectedText: 'tw'
          });
        });
      });
      describe("operators", function() {
        return it("operate on the current selection", function() {
          set({
            text: "012345\n\nabcdef",
            cursor: [0, 0]
          });
          return ensure('V d', {
            text: "\nabcdef"
          });
        });
      });
      describe("returning to normal-mode", function() {
        return it("operate on the current selection", function() {
          set({
            text: "012345\n\nabcdef"
          });
          return ensure('V escape', {
            selectedText: ''
          });
        });
      });
      describe("the o keybinding", function() {
        it("reversed each selection", function() {
          set({
            addCursor: [0, 12]
          });
          ensure('i w', {
            selectedText: ["two", "three"],
            selectionIsReversed: false
          });
          return ensure('o', {
            selectionIsReversed: true
          });
        });
        return xit("harmonizes selection directions", function() {
          set({
            cursor: [0, 0]
          });
          keystroke('e e');
          set({
            addCursor: [0, 2e308]
          });
          ensure('h h', {
            selectedBufferRange: [[[0, 0], [0, 5]], [[0, 11], [0, 13]]],
            cursor: [[0, 5], [0, 11]]
          });
          return ensure('o', {
            selectedBufferRange: [[[0, 0], [0, 5]], [[0, 11], [0, 13]]],
            cursor: [[0, 5], [0, 13]]
          });
        });
      });
      describe("activate visualmode within visualmode", function() {
        var cursorPosition;
        cursorPosition = null;
        beforeEach(function() {
          cursorPosition = [0, 4];
          set({
            text: "line one\nline two\nline three\n",
            cursor: cursorPosition
          });
          return ensure('escape', {
            mode: 'normal'
          });
        });
        describe("restore characterwise from linewise", function() {
          beforeEach(function() {
            ensure('v', {
              mode: ['visual', 'characterwise']
            });
            ensure('2 j V', {
              selectedText: "line one\nline two\nline three\n",
              mode: ['visual', 'linewise'],
              selectionIsReversed: false
            });
            return ensure('o', {
              selectedText: "line one\nline two\nline three\n",
              mode: ['visual', 'linewise'],
              selectionIsReversed: true
            });
          });
          it("v after o", function() {
            return ensure('v', {
              selectedText: " one\nline two\nline ",
              mode: ['visual', 'characterwise'],
              selectionIsReversed: true
            });
          });
          return it("escape after o", function() {
            return ensure('escape', {
              cursor: [0, 4],
              mode: 'normal'
            });
          });
        });
        describe("activateVisualMode with same type puts the editor into normal mode", function() {
          describe("characterwise: vv", function() {
            return it("activating twice make editor return to normal mode ", function() {
              ensure('v', {
                mode: ['visual', 'characterwise']
              });
              return ensure('v', {
                mode: 'normal',
                cursor: cursorPosition
              });
            });
          });
          describe("linewise: VV", function() {
            return it("activating twice make editor return to normal mode ", function() {
              ensure('V', {
                mode: ['visual', 'linewise']
              });
              return ensure('V', {
                mode: 'normal',
                cursor: cursorPosition
              });
            });
          });
          return describe("blockwise: ctrl-v twice", function() {
            return it("activating twice make editor return to normal mode ", function() {
              ensure('ctrl-v', {
                mode: ['visual', 'blockwise']
              });
              return ensure('ctrl-v', {
                mode: 'normal',
                cursor: cursorPosition
              });
            });
          });
        });
        describe("change submode within visualmode", function() {
          beforeEach(function() {
            return set({
              text: "line one\nline two\nline three\n",
              cursor: [[0, 5], [2, 5]]
            });
          });
          it("can change submode within visual mode", function() {
            ensure('v', {
              mode: ['visual', 'characterwise']
            });
            ensure('V', {
              mode: ['visual', 'linewise']
            });
            ensure('ctrl-v', {
              mode: ['visual', 'blockwise']
            });
            return ensure('v', {
              mode: ['visual', 'characterwise']
            });
          });
          return it("recover original range when shift from linewise to characterwise", function() {
            ensure('v i w', {
              selectedText: ['one', 'three']
            });
            ensure('V', {
              selectedText: ["line one\n", "line three\n"]
            });
            return ensure('v', {
              selectedText: ["one", "three"]
            });
          });
        });
        return describe("keep goalColum when submode change in visual-mode", function() {
          var text;
          text = null;
          beforeEach(function() {
            text = new TextData("0_34567890ABCDEF\n1_34567890\n2_34567\n3_34567890A\n4_34567890ABCDEF\n");
            return set({
              text: text.getRaw(),
              cursor: [0, 0]
            });
          });
          return it("keep goalColumn when shift linewise to characterwise", function() {
            ensure('V', {
              selectedText: text.getLines([0]),
              propertyHead: [0, 0],
              mode: ['visual', 'linewise']
            });
            ensure('$', {
              selectedText: text.getLines([0]),
              propertyHead: [0, 16],
              mode: ['visual', 'linewise']
            });
            ensure('j', {
              selectedText: text.getLines([0, 1]),
              propertyHead: [1, 10],
              mode: ['visual', 'linewise']
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2]),
              propertyHead: [2, 7],
              mode: ['visual', 'linewise']
            });
            ensure('v', {
              selectedText: text.getLines([0, 1, 2]),
              propertyHead: [2, 7],
              mode: ['visual', 'characterwise']
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2, 3]),
              propertyHead: [3, 11],
              mode: ['visual', 'characterwise']
            });
            ensure('v', {
              cursor: [3, 10],
              mode: 'normal'
            });
            return ensure('j', {
              cursor: [4, 15],
              mode: 'normal'
            });
          });
        });
      });
      describe("deactivating visual mode", function() {
        beforeEach(function() {
          ensure('escape', {
            mode: 'normal'
          });
          return set({
            text: "line one\nline two\nline three\n",
            cursor: [0, 7]
          });
        });
        it("can put cursor at in visual char mode", function() {
          return ensure('v', {
            mode: ['visual', 'characterwise'],
            cursor: [0, 8]
          });
        });
        it("adjust cursor position 1 column left when deactivated", function() {
          return ensure('v escape', {
            mode: 'normal',
            cursor: [0, 7]
          });
        });
        return it("can select new line in visual mode", function() {
          ensure('v', {
            cursor: [0, 8],
            propertyHead: [0, 7]
          });
          ensure('l', {
            cursor: [1, 0],
            propertyHead: [0, 8]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [0, 7]
          });
        });
      });
      return describe("deactivating visual mode on blank line", function() {
        beforeEach(function() {
          ensure('escape', {
            mode: 'normal'
          });
          return set({
            text: "0: abc\n\n2: abc",
            cursor: [1, 0]
          });
        });
        it("v case-1", function() {
          ensure('v', {
            mode: ['visual', 'characterwise'],
            cursor: [2, 0]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("v case-2 selection head is blank line", function() {
          set({
            cursor: [0, 1]
          });
          ensure('v j', {
            mode: ['visual', 'characterwise'],
            cursor: [2, 0],
            selectedText: ": abc\n\n"
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("V case-1", function() {
          ensure('V', {
            mode: ['visual', 'linewise'],
            cursor: [2, 0]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("V case-2 selection head is blank line", function() {
          set({
            cursor: [0, 1]
          });
          ensure('V j', {
            mode: ['visual', 'linewise'],
            cursor: [2, 0],
            selectedText: "0: abc\n\n"
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        it("ctrl-v", function() {
          ensure('ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedBufferRange: [[1, 0], [1, 0]]
          });
          return ensure('escape', {
            mode: 'normal',
            cursor: [1, 0]
          });
        });
        return it("ctrl-v and move over empty line", function() {
          ensure('ctrl-v', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[1, 0], [1, 0]]
          });
          ensure('k', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[[0, 0], [0, 1]], [[1, 0], [1, 0]]]
          });
          ensure('j', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[1, 0], [1, 0]]
          });
          return ensure('j', {
            mode: ['visual', 'blockwise'],
            selectedBufferRangeOrdered: [[[1, 0], [1, 0]], [[2, 0], [2, 1]]]
          });
        });
      });
    });
    describe("marks", function() {
      beforeEach(function() {
        return set({
          text: "text in line 1\ntext in line 2\ntext in line 3"
        });
      });
      it("basic marking functionality", function() {
        set({
          cursor: [1, 1]
        });
        keystroke('m t');
        set({
          cursor: [2, 2]
        });
        return ensure('` t', {
          cursor: [1, 1]
        });
      });
      it("real (tracking) marking functionality", function() {
        set({
          cursor: [2, 2]
        });
        keystroke('m q');
        set({
          cursor: [1, 2]
        });
        return ensure('o escape ` q', {
          cursor: [3, 2]
        });
      });
      return it("real (tracking) marking functionality", function() {
        set({
          cursor: [2, 2]
        });
        keystroke('m q');
        set({
          cursor: [1, 2]
        });
        return ensure('d d escape ` q', {
          cursor: [1, 2]
        });
      });
    });
    return describe("is-narrowed attribute", function() {
      var ensureNormalModeState;
      ensureNormalModeState = function() {
        return ensure("escape", {
          mode: 'normal',
          selectedText: '',
          selectionIsNarrowed: false
        });
      };
      beforeEach(function() {
        return set({
          text: "1:-----\n2:-----\n3:-----\n4:-----",
          cursor: [0, 0]
        });
      });
      describe("normal-mode", function() {
        return it("is not narrowed", function() {
          return ensure({
            mode: ['normal'],
            selectionIsNarrowed: false
          });
        });
      });
      describe("visual-mode.characterwise", function() {
        it("[single row] is narrowed", function() {
          ensure('v $', {
            selectedText: '1:-----\n',
            mode: ['visual', 'characterwise'],
            selectionIsNarrowed: false
          });
          return ensureNormalModeState();
        });
        return it("[multi-row] is narrowed", function() {
          ensure('v j', {
            selectedText: "1:-----\n2",
            mode: ['visual', 'characterwise'],
            selectionIsNarrowed: true
          });
          return ensureNormalModeState();
        });
      });
      describe("visual-mode.linewise", function() {
        it("[single row] is narrowed", function() {
          ensure('V', {
            selectedText: "1:-----\n",
            mode: ['visual', 'linewise'],
            selectionIsNarrowed: false
          });
          return ensureNormalModeState();
        });
        return it("[multi-row] is narrowed", function() {
          ensure('V j', {
            selectedText: "1:-----\n2:-----\n",
            mode: ['visual', 'linewise'],
            selectionIsNarrowed: true
          });
          return ensureNormalModeState();
        });
      });
      return describe("visual-mode.blockwise", function() {
        it("[single row] is narrowed", function() {
          ensure('ctrl-v l', {
            selectedText: "1:",
            mode: ['visual', 'blockwise'],
            selectionIsNarrowed: false
          });
          return ensureNormalModeState();
        });
        return it("[multi-row] is narrowed", function() {
          ensure('ctrl-v l j', {
            selectedText: ["1:", "2:"],
            mode: ['visual', 'blockwise'],
            selectionIsNarrowed: true
          });
          return ensureNormalModeState();
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvdmltLXN0YXRlLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUNKLE1BQTRDLE9BQUEsQ0FBUSxlQUFSLENBQTVDLEVBQUMsNkJBQUQsRUFBYyx1QkFBZCxFQUF3Qjs7RUFDeEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsVUFBVCxFQUFxQixTQUFBO0FBQ25CLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7YUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO0lBRFMsQ0FBWDtJQU1BLFFBQUEsQ0FBUyxnQkFBVCxFQUEyQixTQUFBO01BQ3pCLEVBQUEsQ0FBRyxxREFBSCxFQUEwRCxTQUFBO2VBQ3hELE1BQUEsQ0FBTztVQUFBLElBQUEsRUFBTSxRQUFOO1NBQVA7TUFEd0QsQ0FBMUQ7YUFHQSxFQUFBLENBQUcsNkRBQUgsRUFBa0UsU0FBQTtRQUNoRSxRQUFRLENBQUMsR0FBVCxDQUFhLG1CQUFiLEVBQWtDLElBQWxDO2VBQ0EsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLEdBQVI7aUJBQ1YsR0FBRyxDQUFDLE1BQUosQ0FBVztZQUFBLElBQUEsRUFBTSxRQUFOO1dBQVg7UUFEVSxDQUFaO01BRmdFLENBQWxFO0lBSnlCLENBQTNCO0lBU0EsUUFBQSxDQUFTLFdBQVQsRUFB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QWdCQSxRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTtRQUNoQyxFQUFBLENBQUcsMEJBQUgsRUFBK0IsU0FBQTtVQUM3QixNQUFBLENBQU8sVUFBUCxFQUNFO1lBQUEsWUFBQSxFQUFjLElBQWQ7WUFDQSxJQUFBLEVBQU0sQ0FBQyxRQUFELEVBQVcsV0FBWCxDQUROO1lBRUEsbUJBQUEsRUFBcUIsS0FGckI7V0FERjtpQkFJQSxxQkFBQSxDQUFBO1FBTDZCLENBQS9CO2VBTUEsRUFBQSxDQUFHLHlCQUFILEVBQThCLFNBQUE7VUFDNUIsTUFBQSxDQUFPLFlBQVAsRUFDRTtZQUFBLFlBQUEsRUFBYyxDQUFDLElBQUQsRUFBTyxJQUFQLENBQWQ7WUFDQSxJQUFBLEVBQU0sQ0FBQyxRQUFELEVBQVcsV0FBWCxDQUROO1lBRUEsbUJBQUEsRUFBcUIsSUFGckI7V0FERjtpQkFJQSxxQkFBQSxDQUFBO1FBTDRCLENBQTlCO01BUGdDLENBQWxDO0lBckRnQyxDQUFsQztFQXhqQm1CLENBQXJCO0FBSkEiLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xue2dldFZpbVN0YXRlLCBUZXh0RGF0YSwgd2l0aE1vY2tQbGF0Zm9ybX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiVmltU3RhdGVcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cblxuICBkZXNjcmliZSBcImluaXRpYWxpemF0aW9uXCIsIC0+XG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW4gbm9ybWFsLW1vZGUgaW5pdGlhbGx5IGJ5IGRlZmF1bHRcIiwgLT5cbiAgICAgIGVuc3VyZSBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW4gaW5zZXJ0LW1vZGUgaWYgc3RhcnRJbkluc2VydE1vZGUgaXMgdHJ1ZVwiLCAtPlxuICAgICAgc2V0dGluZ3Muc2V0ICdzdGFydEluSW5zZXJ0TW9kZScsIHRydWVcbiAgICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgdmltKSAtPlxuICAgICAgICB2aW0uZW5zdXJlIG1vZGU6ICdpbnNlcnQnXG5cbiAgZGVzY3JpYmUgXCI6OmRlc3Ryb3lcIiwgLT5cbiAgICBpdCBcInJlLWVuYWJsZXMgdGV4dCBpbnB1dCBvbiB0aGUgZWRpdG9yXCIsIC0+XG4gICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5jb21wb25lbnQuaXNJbnB1dEVuYWJsZWQoKSkudG9CZUZhbHN5KClcbiAgICAgIHZpbVN0YXRlLmRlc3Ryb3koKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuY29tcG9uZW50LmlzSW5wdXRFbmFibGVkKCkpLnRvQmVUcnV0aHkoKVxuXG4gICAgaXQgXCJyZW1vdmVzIHRoZSBtb2RlIGNsYXNzZXMgZnJvbSB0aGUgZWRpdG9yXCIsIC0+XG4gICAgICBlbnN1cmUgbW9kZTogJ25vcm1hbCdcbiAgICAgIHZpbVN0YXRlLmRlc3Ryb3koKVxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwibm9ybWFsLW1vZGVcIikpLnRvQmVGYWxzeSgpXG5cbiAgICBpdCBcImlzIGEgbm9vcCB3aGVuIHRoZSBlZGl0b3IgaXMgYWxyZWFkeSBkZXN0cm95ZWRcIiwgLT5cbiAgICAgIGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKS5kZXN0cm95KClcbiAgICAgIHZpbVN0YXRlLmRlc3Ryb3koKVxuXG4gIGRlc2NyaWJlIFwibm9ybWFsLW1vZGVcIiwgLT5cbiAgICBkZXNjcmliZSBcIndoZW4gZW50ZXJpbmcgYW4gaW5zZXJ0YWJsZSBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAga2V5c3Ryb2tlICdcXFxcJ1xuXG4gICAgICBpdCBcInN0b3BzIHByb3BhZ2F0aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSB0ZXh0OiAnJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGVudGVyaW5nIGFuIG9wZXJhdG9yXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGtleXN0cm9rZSAnZCdcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIGFuIG9wZXJhdG9yIHRoYXQgY2FuJ3QgYmUgY29tcG9zZWRcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAneCdcblxuICAgICAgICBpdCBcImNsZWFycyB0aGUgb3BlcmF0b3Igc3RhY2tcIiwgLT5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgICAgIGRlc2NyaWJlIFwidGhlIGVzY2FwZSBrZXliaW5kaW5nXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgJ2VzY2FwZSdcblxuICAgICAgICBpdCBcImNsZWFycyB0aGUgb3BlcmF0b3Igc3RhY2tcIiwgLT5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgICAgIGRlc2NyaWJlIFwidGhlIGN0cmwtYyBrZXliaW5kaW5nXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBrZXlzdHJva2UgJ2N0cmwtYydcblxuICAgICAgICBpdCBcImNsZWFycyB0aGUgb3BlcmF0b3Igc3RhY2tcIiwgLT5cbiAgICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgICBkZXNjcmliZSBcInRoZSBlc2NhcGUga2V5YmluZGluZ1wiLCAtPlxuICAgICAgaXQgXCJjbGVhcnMgYW55IGV4dHJhIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJvbmUtdHdvLXRocmVlXCJcbiAgICAgICAgICBhZGRDdXJzb3I6IFswLCAzXVxuICAgICAgICBlbnN1cmUgbnVtQ3Vyc29yczogMlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG51bUN1cnNvcnM6IDFcblxuICAgIGRlc2NyaWJlIFwidGhlIHYga2V5YmluZGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAga2V5c3Ryb2tlICd2J1xuXG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIHZpc3VhbCBjaGFyYWN0ZXJ3aXNlIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG5cbiAgICBkZXNjcmliZSBcInRoZSBWIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIwMTIzNDVcXG5hYmNkZWZcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gdmlzdWFsIGxpbmV3aXNlIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdWJywgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuXG4gICAgICBpdCBcInNlbGVjdHMgdGhlIGN1cnJlbnQgbGluZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1YnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogJzAxMjM0NVxcbidcblxuICAgIGRlc2NyaWJlIFwidGhlIGN0cmwtdiBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIHZpc3VhbCBibG9ja3dpc2UgbW9kZVwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIwMTIzNDVcXG5cXG5hYmNkZWZcIiwgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdjdHJsLXYnLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuXG4gICAgZGVzY3JpYmUgXCJzZWxlY3RpbmcgdGV4dFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzcHlPbihfLl8sIFwibm93XCIpLmFuZENhbGxGYWtlIC0+IHdpbmRvdy5ub3dcbiAgICAgICAgc2V0IHRleHQ6IFwiYWJjIGRlZlwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICAgIGFkdmFuY2VDbG9jaygyMDApXG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goZWRpdG9yRWxlbWVudCwgXCJjb3JlOnNlbGVjdC1yaWdodFwiKVxuICAgICAgICBlbnN1cmVcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzAsIDBdLCBbMCwgMV1dXG5cbiAgICAgIGl0IFwiaGFuZGxlcyB0aGUgZWRpdG9yIGJlaW5nIGRlc3Ryb3llZCBzaG9ydGx5IGFmdGVyIHNlbGVjdGluZyB0ZXh0XCIsIC0+XG4gICAgICAgIHNldCBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbWzAsIDBdLCBbMCwgM11dXG4gICAgICAgIGVkaXRvci5kZXN0cm95KClcbiAgICAgICAgdmltU3RhdGUuZGVzdHJveSgpXG4gICAgICAgIGFkdmFuY2VDbG9jaygxMDApXG5cbiAgICAgIGl0ICdoYW5kbGVzIG5hdGl2ZSBzZWxlY3Rpb24gc3VjaCBhcyBjb3JlOnNlbGVjdC1hbGwnLCAtPlxuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsICdjb3JlOnNlbGVjdC1hbGwnKVxuICAgICAgICBlbnN1cmUgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1swLCAwXSwgWzAsIDddXVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgaSBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIGluc2VydCBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnaScsIG1vZGU6ICdpbnNlcnQnXG5cbiAgICBkZXNjcmliZSBcInRoZSBSIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gcmVwbGFjZSBtb2RlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnUicsIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGNvbnRlbnRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMDEyMzQ1XFxuXFxuYWJjZGVmXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwib24gYSBsaW5lIHdpdGggY29udGVudFwiLCAtPlxuICAgICAgICBpdCBcIltDaGFuZ2VkXSB3b24ndCBhZGp1c3QgY3Vyc29yIHBvc2l0aW9uIGlmIG91dGVyIGNvbW1hbmQgcGxhY2UgdGhlIGN1cnNvciBvbiBlbmQgb2YgbGluZSgnXFxcXG4nKSBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGVkaXRvckVsZW1lbnQsIFwiZWRpdG9yOm1vdmUtdG8tZW5kLW9mLWxpbmVcIilcbiAgICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgNl1cblxuICAgICAgZGVzY3JpYmUgXCJvbiBhbiBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiYWxsb3dzIHRoZSBjdXJzb3IgdG8gYmUgcGxhY2VkIG9uIHRoZSBcXG4gY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlIGN1cnNvcjogWzEsIDBdXG5cbiAgICBkZXNjcmliZSAnd2l0aCBjaGFyYWN0ZXItaW5wdXQgb3BlcmF0aW9ucycsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiAnMDEyMzQ1XFxuYWJjZGVmJ1xuXG4gICAgICBpdCAncHJvcGVybHkgY2xlYXJzIHRoZSBvcGVyYXRpb25zJywgLT5cblxuICAgICAgICBlbnN1cmUgJ2QnLCBtb2RlOiAnb3BlcmF0b3ItcGVuZGluZydcbiAgICAgICAgZXhwZWN0KHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLmlzRW1wdHkoKSkudG9CZShmYWxzZSlcbiAgICAgICAgZW5zdXJlICdyJywgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgZXhwZWN0KHZpbVN0YXRlLm9wZXJhdGlvblN0YWNrLmlzRW1wdHkoKSkudG9CZSh0cnVlKVxuXG4gICAgICAgIGVuc3VyZSAnZCcsIG1vZGU6ICdvcGVyYXRvci1wZW5kaW5nJ1xuICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKGZhbHNlKVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCB0ZXh0OiAnMDEyMzQ1XFxuYWJjZGVmJ1xuICAgICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlKHRydWUpXG5cbiAgZGVzY3JpYmUgXCJhY3RpdmF0ZS1ub3JtYWwtbW9kZS1vbmNlIGNvbW1hbmRcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIDAgMjM0NTZcbiAgICAgICAgMSAyMzQ1NlxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMl1cbiAgICAgIGVuc3VyZSAnaScsIG1vZGU6ICdpbnNlcnQnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgaXQgXCJhY3RpdmF0ZSBub3JtYWwgbW9kZSB3aXRob3V0IG1vdmluZyBjdXJzb3JzIGxlZnQsIHRoZW4gYmFjayB0byBpbnNlcnQtbW9kZSBvbmNlIHNvbWUgY29tbWFuZCBleGVjdXRlZFwiLCAtPlxuICAgICAgZW5zdXJlICdjdHJsLW8nLCBjdXJzb3I6IFswLCAyXSwgbW9kZTogJ25vcm1hbCdcbiAgICAgIGVuc3VyZSAnbCcsIGN1cnNvcjogWzAsIDNdLCBtb2RlOiAnaW5zZXJ0J1xuXG4gIGRlc2NyaWJlIFwiaW5zZXJ0LW1vZGVcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+IGtleXN0cm9rZSAnaSdcblxuICAgIGRlc2NyaWJlIFwid2l0aCBjb250ZW50XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjAxMjM0NVxcblxcbmFiY2RlZlwiXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgaW4gdGhlIG1pZGRsZSBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGxlZnQgd2hlbiBleGl0aW5nIGluc2VydCBtb2RlXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgZW5zdXJlICdlc2NhcGUnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIGF0IHRoZSBiZWdpbm5pbmcgb2YgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImxlYXZlcyB0aGUgY3Vyc29yIGF0IHRoZSBiZWdpbm5pbmcgb2YgbGluZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJvbiBhIGxpbmUgd2l0aCBjb250ZW50XCIsIC0+XG4gICAgICAgIGl0IFwiYWxsb3dzIHRoZSBjdXJzb3IgdG8gYmUgcGxhY2VkIG9uIHRoZSBcXG4gY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDZdXG4gICAgICAgICAgZW5zdXJlIGN1cnNvcjogWzAsIDZdXG5cbiAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIG5vcm1hbCBtb2RlIHdoZW4gPGVzY2FwZT4gaXMgcHJlc3NlZFwiLCAtPlxuICAgICAgZXNjYXBlICdlc2NhcGUnLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW50byBub3JtYWwgbW9kZSB3aGVuIDxjdHJsLWM+IGlzIHByZXNzZWRcIiwgLT5cbiAgICAgIHdpdGhNb2NrUGxhdGZvcm0gZWRpdG9yRWxlbWVudCwgJ3BsYXRmb3JtLWRhcndpbicgLCAtPlxuICAgICAgICBlbnN1cmUgJ2N0cmwtYycsIG1vZGU6ICdub3JtYWwnXG5cbiAgICBkZXNjcmliZSBcImNsZWFyTXVsdGlwbGVDdXJzb3JzT25Fc2NhcGVJbnNlcnRNb2RlIHNldHRpbmdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogJ2FiYydcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMV0sIFswLCAyXV1cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGVuYWJsZWQsIGNsZWFyIG11bHRpcGxlIGN1cnNvcnMgb24gZXNjYXBpbmcgaW5zZXJ0LW1vZGVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCgnY2xlYXJNdWx0aXBsZUN1cnNvcnNPbkVzY2FwZUluc2VydE1vZGUnLCB0cnVlKVxuICAgICAgICBpdCBcImNsZWFyIG11bHRpcGxlIGN1cnNvcnMgYnkgcmVzcGVjdGluZyBsYXN0IGN1cnNvcidzIHBvc2l0aW9uXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdlc2NhcGUnLCBtb2RlOiAnbm9ybWFsJywgbnVtQ3Vyc29yczogMSwgY3Vyc29yOiBbMCwgMV1cblxuICAgICAgICBpdCBcImNsZWFyIG11bHRpcGxlIGN1cnNvcnMgYnkgcmVzcGVjdGluZyBsYXN0IGN1cnNvcidzIHBvc2l0aW9uXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogW1swLCAyXSwgWzAsIDFdXVxuICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIG51bUN1cnNvcnM6IDEsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBkaXNhYmxlZFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0KCdjbGVhck11bHRpcGxlQ3Vyc29yc09uRXNjYXBlSW5zZXJ0TW9kZScsIGZhbHNlKVxuICAgICAgICBpdCBcImtlZXAgbXVsdGlwbGUgY3Vyc29yc1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIG51bUN1cnNvcnM6IDIsIGN1cnNvcjogW1swLCAwXSwgWzAsIDFdXVxuXG4gICAgZGVzY3JpYmUgXCJhdXRvbWF0aWNhbGx5RXNjYXBlSW5zZXJ0TW9kZU9uQWN0aXZlUGFuZUl0ZW1DaGFuZ2Ugc2V0dGluZ1wiLCAtPlxuICAgICAgW290aGVyVmltLCBvdGhlckVkaXRvciwgcGFuZV0gPSBbXVxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGdldFZpbVN0YXRlIChvdGhlclZpbVN0YXRlLCBfb3RoZXIpIC0+XG4gICAgICAgICAgb3RoZXJWaW0gPSBfb3RoZXJcbiAgICAgICAgICBvdGhlckVkaXRvciA9IG90aGVyVmltU3RhdGUuZWRpdG9yXG5cbiAgICAgICAgcnVucyAtPlxuICAgICAgICAgIHBhbmUgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVQYW5lKClcbiAgICAgICAgICBwYW5lLmFjdGl2YXRlSXRlbShlZGl0b3IpXG5cbiAgICAgICAgICBzZXQgdGV4dEM6IFwifGVkaXRvci0xXCJcbiAgICAgICAgICBvdGhlclZpbS5zZXQgdGV4dEM6IFwifGVkaXRvci0yXCJcblxuICAgICAgICAgIGVuc3VyZSAnaScsIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgb3RoZXJWaW0uZW5zdXJlICdpJywgbW9kZTogJ2luc2VydCdcbiAgICAgICAgICBleHBlY3QocGFuZS5nZXRBY3RpdmVJdGVtKCkpLnRvQmUoZWRpdG9yKVxuXG4gICAgICBkZXNjcmliZSBcImRlZmF1bHQgYmVoYXZpb3JcIiwgLT5cbiAgICAgICAgaXQgXCJyZW1haW4gaW4gaW5zZXJ0LW1vZGUgb24gcGFuZUl0ZW0gY2hhbmdlIGJ5IGRlZmF1bHRcIiwgLT5cblxuICAgICAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKG90aGVyRWRpdG9yKVxuICAgICAgICAgIGV4cGVjdChwYW5lLmdldEFjdGl2ZUl0ZW0oKSkudG9CZShvdGhlckVkaXRvcilcblxuICAgICAgICAgIGVuc3VyZSBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICAgIG90aGVyVmltLmVuc3VyZSBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICBkZXNjcmliZSBcImF1dG9tYXRpY2FsbHlFc2NhcGVJbnNlcnRNb2RlT25BY3RpdmVQYW5lSXRlbUNoYW5nZSA9IHRydWVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCgnYXV0b21hdGljYWxseUVzY2FwZUluc2VydE1vZGVPbkFjdGl2ZVBhbmVJdGVtQ2hhbmdlJywgdHJ1ZSlcbiAgICAgICAgICBqYXNtaW5lLnVzZVJlYWxDbG9jaygpXG5cbiAgICAgICAgaXQgXCJhdXRvbWF0aWNhbGx5IHNoaWZ0IHRvIG5vcm1hbCBtb2RlIGV4Y2VwdCBuZXcgYWN0aXZlIGVkaXRvclwiLCAtPlxuICAgICAgICAgIGNhbGxlZCA9IGZhbHNlXG5cbiAgICAgICAgICBydW5zIC0+XG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vbkRpZFN0b3BDaGFuZ2luZ0FjdGl2ZVBhbmVJdGVtIC0+IGNhbGxlZCA9IHRydWVcbiAgICAgICAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKG90aGVyRWRpdG9yKVxuXG4gICAgICAgICAgd2FpdHNGb3IgLT5cbiAgICAgICAgICAgIGNhbGxlZFxuXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgZXhwZWN0KHBhbmUuZ2V0QWN0aXZlSXRlbSgpKS50b0JlKG90aGVyRWRpdG9yKVxuICAgICAgICAgICAgZW5zdXJlIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICBvdGhlclZpbS5lbnN1cmUgbW9kZTogJ2luc2VydCdcblxuICBkZXNjcmliZSBcInJlcGxhY2UtbW9kZVwiLCAtPlxuICAgIGRlc2NyaWJlIFwid2l0aCBjb250ZW50XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+IHNldCB0ZXh0OiBcIjAxMjM0NVxcblxcbmFiY2RlZlwiXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgaW4gdGhlIG1pZGRsZSBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGxlZnQgd2hlbiBleGl0aW5nIHJlcGxhY2UgbW9kZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgICAgIGVuc3VyZSAnUiBlc2NhcGUnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIGF0IHRoZSBiZWdpbm5pbmcgb2YgbGluZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG5cbiAgICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBhdCB0aGUgYmVnaW5uaW5nIG9mIGxpbmVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ1IgZXNjYXBlJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJvbiBhIGxpbmUgd2l0aCBjb250ZW50XCIsIC0+XG4gICAgICAgIGl0IFwiYWxsb3dzIHRoZSBjdXJzb3IgdG8gYmUgcGxhY2VkIG9uIHRoZSBcXG4gY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlICdSJ1xuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgICAgIGVuc3VyZSBjdXJzb3I6IFswLCA2XVxuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW50byBub3JtYWwgbW9kZSB3aGVuIDxlc2NhcGU+IGlzIHByZXNzZWRcIiwgLT5cbiAgICAgIGVuc3VyZSAnUiBlc2NhcGUnLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgaXQgXCJwdXRzIHRoZSBlZGl0b3IgaW50byBub3JtYWwgbW9kZSB3aGVuIDxjdHJsLWM+IGlzIHByZXNzZWRcIiwgLT5cbiAgICAgIHdpdGhNb2NrUGxhdGZvcm0gZWRpdG9yRWxlbWVudCwgJ3BsYXRmb3JtLWRhcndpbicgLCAtPlxuICAgICAgICBlbnN1cmUgJ1IgY3RybC1jJywgbW9kZTogJ25vcm1hbCdcblxuICBkZXNjcmliZSBcInZpc3VhbC1tb2RlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICBvbmUgdHdvIHRocmVlXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCA0XVxuICAgICAga2V5c3Ryb2tlICd2J1xuXG4gICAgaXQgXCJzZWxlY3RzIHRoZSBjaGFyYWN0ZXIgdW5kZXIgdGhlIGN1cnNvclwiLCAtPlxuICAgICAgZW5zdXJlXG4gICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtbMCwgNF0sIFswLCA1XV1cbiAgICAgICAgc2VsZWN0ZWRUZXh0OiAndCdcblxuICAgIGl0IFwicHV0cyB0aGUgZWRpdG9yIGludG8gbm9ybWFsIG1vZGUgd2hlbiA8ZXNjYXBlPiBpcyBwcmVzc2VkXCIsIC0+XG4gICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgIGN1cnNvcjogWzAsIDRdXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBpdCBcInB1dHMgdGhlIGVkaXRvciBpbnRvIG5vcm1hbCBtb2RlIHdoZW4gPGVzY2FwZT4gaXMgcHJlc3NlZCBvbiBzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgIGVuc3VyZSBzZWxlY3RlZFRleHQ6ICd0J1xuICAgICAgZW5zdXJlICdoIGgnLFxuICAgICAgICBzZWxlY3RlZFRleHQ6ICdlIHQnXG4gICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcbiAgICAgIGVuc3VyZSAnZXNjYXBlJyxcbiAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgY3Vyc29yOiBbMCwgMl1cblxuICAgIGRlc2NyaWJlIFwibW90aW9uc1wiLCAtPlxuICAgICAgaXQgXCJ0cmFuc2Zvcm1zIHRoZSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgZW5zdXJlICd3Jywgc2VsZWN0ZWRUZXh0OiAndHdvIHQnXG5cbiAgICAgIGl0IFwiYWx3YXlzIGxlYXZlcyB0aGUgaW5pdGlhbGx5IHNlbGVjdGVkIGNoYXJhY3RlciBzZWxlY3RlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2gnLCBzZWxlY3RlZFRleHQ6ICcgdCdcbiAgICAgICAgZW5zdXJlICdsJywgc2VsZWN0ZWRUZXh0OiAndCdcbiAgICAgICAgZW5zdXJlICdsJywgc2VsZWN0ZWRUZXh0OiAndHcnXG5cbiAgICBkZXNjcmliZSBcIm9wZXJhdG9yc1wiLCAtPlxuICAgICAgaXQgXCJvcGVyYXRlIG9uIHRoZSBjdXJyZW50IHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIjAxMjM0NVxcblxcbmFiY2RlZlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdWIGQnLCB0ZXh0OiBcIlxcbmFiY2RlZlwiXG5cbiAgICBkZXNjcmliZSBcInJldHVybmluZyB0byBub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgaXQgXCJvcGVyYXRlIG9uIHRoZSBjdXJyZW50IHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIwMTIzNDVcXG5cXG5hYmNkZWZcIlxuICAgICAgICBlbnN1cmUgJ1YgZXNjYXBlJywgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgZGVzY3JpYmUgXCJ0aGUgbyBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcInJldmVyc2VkIGVhY2ggc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIHNldCBhZGRDdXJzb3I6IFswLCAxMl1cbiAgICAgICAgZW5zdXJlICdpIHcnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogW1widHdvXCIsIFwidGhyZWVcIl1cbiAgICAgICAgICBzZWxlY3Rpb25Jc1JldmVyc2VkOiBmYWxzZVxuICAgICAgICBlbnN1cmUgJ28nLFxuICAgICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IHRydWVcblxuICAgICAgeGl0IFwiaGFybW9uaXplcyBzZWxlY3Rpb24gZGlyZWN0aW9uc1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAga2V5c3Ryb2tlICdlIGUnXG4gICAgICAgIHNldCBhZGRDdXJzb3I6IFswLCBJbmZpbml0eV1cbiAgICAgICAgZW5zdXJlICdoIGgnLFxuICAgICAgICAgIHNlbGVjdGVkQnVmZmVyUmFuZ2U6IFtcbiAgICAgICAgICAgIFtbMCwgMF0sIFswLCA1XV0sXG4gICAgICAgICAgICBbWzAsIDExXSwgWzAsIDEzXV1cbiAgICAgICAgICBdXG4gICAgICAgICAgY3Vyc29yOiBbXG4gICAgICAgICAgICBbMCwgNV1cbiAgICAgICAgICAgIFswLCAxMV1cbiAgICAgICAgICBdXG5cbiAgICAgICAgZW5zdXJlICdvJyxcbiAgICAgICAgICBzZWxlY3RlZEJ1ZmZlclJhbmdlOiBbXG4gICAgICAgICAgICBbWzAsIDBdLCBbMCwgNV1dLFxuICAgICAgICAgICAgW1swLCAxMV0sIFswLCAxM11dXG4gICAgICAgICAgXVxuICAgICAgICAgIGN1cnNvcjogW1xuICAgICAgICAgICAgWzAsIDVdXG4gICAgICAgICAgICBbMCwgMTNdXG4gICAgICAgICAgXVxuXG4gICAgZGVzY3JpYmUgXCJhY3RpdmF0ZSB2aXN1YWxtb2RlIHdpdGhpbiB2aXN1YWxtb2RlXCIsIC0+XG4gICAgICBjdXJzb3JQb3NpdGlvbiA9IG51bGxcbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgY3Vyc29yUG9zaXRpb24gPSBbMCwgNF1cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBsaW5lIG9uZVxuICAgICAgICAgICAgbGluZSB0d29cbiAgICAgICAgICAgIGxpbmUgdGhyZWVcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogY3Vyc29yUG9zaXRpb25cblxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGRlc2NyaWJlIFwicmVzdG9yZSBjaGFyYWN0ZXJ3aXNlIGZyb20gbGluZXdpc2VcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGVuc3VyZSAndicsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIGVuc3VyZSAnMiBqIFYnLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgbGluZSBvbmVcbiAgICAgICAgICAgICAgbGluZSB0d29cbiAgICAgICAgICAgICAgbGluZSB0aHJlZVxcblxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgICAgICAgIHNlbGVjdGlvbklzUmV2ZXJzZWQ6IGZhbHNlXG4gICAgICAgICAgZW5zdXJlICdvJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIGxpbmUgb25lXG4gICAgICAgICAgICAgIGxpbmUgdHdvXG4gICAgICAgICAgICAgIGxpbmUgdGhyZWVcXG5cbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgICBzZWxlY3Rpb25Jc1JldmVyc2VkOiB0cnVlXG5cbiAgICAgICAgaXQgXCJ2IGFmdGVyIG9cIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YnLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIiBvbmVcXG5saW5lIHR3b1xcbmxpbmUgXCJcbiAgICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgICAgc2VsZWN0aW9uSXNSZXZlcnNlZDogdHJ1ZVxuICAgICAgICBpdCBcImVzY2FwZSBhZnRlciBvXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdlc2NhcGUnLFxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGRlc2NyaWJlIFwiYWN0aXZhdGVWaXN1YWxNb2RlIHdpdGggc2FtZSB0eXBlIHB1dHMgdGhlIGVkaXRvciBpbnRvIG5vcm1hbCBtb2RlXCIsIC0+XG4gICAgICAgIGRlc2NyaWJlIFwiY2hhcmFjdGVyd2lzZTogdnZcIiwgLT5cbiAgICAgICAgICBpdCBcImFjdGl2YXRpbmcgdHdpY2UgbWFrZSBlZGl0b3IgcmV0dXJuIHRvIG5vcm1hbCBtb2RlIFwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlICd2JywgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICAgICAgICBlbnN1cmUgJ3YnLCBtb2RlOiAnbm9ybWFsJywgY3Vyc29yOiBjdXJzb3JQb3NpdGlvblxuXG4gICAgICAgIGRlc2NyaWJlIFwibGluZXdpc2U6IFZWXCIsIC0+XG4gICAgICAgICAgaXQgXCJhY3RpdmF0aW5nIHR3aWNlIG1ha2UgZWRpdG9yIHJldHVybiB0byBub3JtYWwgbW9kZSBcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSAnVicsIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgICAgICAgIGVuc3VyZSAnVicsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IGN1cnNvclBvc2l0aW9uXG5cbiAgICAgICAgZGVzY3JpYmUgXCJibG9ja3dpc2U6IGN0cmwtdiB0d2ljZVwiLCAtPlxuICAgICAgICAgIGl0IFwiYWN0aXZhdGluZyB0d2ljZSBtYWtlIGVkaXRvciByZXR1cm4gdG8gbm9ybWFsIG1vZGUgXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ2N0cmwtdicsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgICBlbnN1cmUgJ2N0cmwtdicsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IGN1cnNvclBvc2l0aW9uXG5cbiAgICAgIGRlc2NyaWJlIFwiY2hhbmdlIHN1Ym1vZGUgd2l0aGluIHZpc3VhbG1vZGVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJsaW5lIG9uZVxcbmxpbmUgdHdvXFxubGluZSB0aHJlZVxcblwiXG4gICAgICAgICAgICBjdXJzb3I6IFtbMCwgNV0sIFsyLCA1XV1cblxuICAgICAgICBpdCBcImNhbiBjaGFuZ2Ugc3VibW9kZSB3aXRoaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ3YnICAgICAgICAsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIGVuc3VyZSAnVicgICAgICAgICwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICAgIGVuc3VyZSAnY3RybC12JywgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ11cbiAgICAgICAgICBlbnN1cmUgJ3YnICAgICAgICAsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuXG4gICAgICAgIGl0IFwicmVjb3ZlciBvcmlnaW5hbCByYW5nZSB3aGVuIHNoaWZ0IGZyb20gbGluZXdpc2UgdG8gY2hhcmFjdGVyd2lzZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAndiBpIHcnLCBzZWxlY3RlZFRleHQ6IFsnb25lJywgJ3RocmVlJ11cbiAgICAgICAgICBlbnN1cmUgJ1YnLCBzZWxlY3RlZFRleHQ6IFtcImxpbmUgb25lXFxuXCIsIFwibGluZSB0aHJlZVxcblwiXVxuICAgICAgICAgIGVuc3VyZSAndicsIHNlbGVjdGVkVGV4dDogW1wib25lXCIsIFwidGhyZWVcIl1cblxuICAgICAgZGVzY3JpYmUgXCJrZWVwIGdvYWxDb2x1bSB3aGVuIHN1Ym1vZGUgY2hhbmdlIGluIHZpc3VhbC1tb2RlXCIsIC0+XG4gICAgICAgIHRleHQgPSBudWxsXG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICB0ZXh0ID0gbmV3IFRleHREYXRhIFwiXCJcIlxuICAgICAgICAgIDBfMzQ1Njc4OTBBQkNERUZcbiAgICAgICAgICAxXzM0NTY3ODkwXG4gICAgICAgICAgMl8zNDU2N1xuICAgICAgICAgIDNfMzQ1Njc4OTBBXG4gICAgICAgICAgNF8zNDU2Nzg5MEFCQ0RFRlxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogdGV4dC5nZXRSYXcoKVxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgICBpdCBcImtlZXAgZ29hbENvbHVtbiB3aGVuIHNoaWZ0IGxpbmV3aXNlIHRvIGNoYXJhY3Rlcndpc2VcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ1YnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzBdKSwgcHJvcGVydHlIZWFkOiBbMCwgMF0sIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ11cbiAgICAgICAgICBlbnN1cmUgJyQnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzBdKSwgcHJvcGVydHlIZWFkOiBbMCwgMTZdLCBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLCAxXSksIHByb3BlcnR5SGVhZDogWzEsIDEwXSwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uMl0pLCBwcm9wZXJ0eUhlYWQ6IFsyLCA3XSwgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXVxuICAgICAgICAgIGVuc3VyZSAndicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uMl0pLCBwcm9wZXJ0eUhlYWQ6IFsyLCA3XSwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLi4zXSksIHByb3BlcnR5SGVhZDogWzMsIDExXSwgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddXG4gICAgICAgICAgZW5zdXJlICd2JywgY3Vyc29yOiBbMywgMTBdLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgIGVuc3VyZSAnaicsIGN1cnNvcjogWzQsIDE1XSwgbW9kZTogJ25vcm1hbCdcblxuICAgIGRlc2NyaWJlIFwiZGVhY3RpdmF0aW5nIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBsaW5lIG9uZVxuICAgICAgICAgICAgbGluZSB0d29cbiAgICAgICAgICAgIGxpbmUgdGhyZWVcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDddXG4gICAgICBpdCBcImNhbiBwdXQgY3Vyc29yIGF0IGluIHZpc3VhbCBjaGFyIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2JywgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddLCBjdXJzb3I6IFswLCA4XVxuICAgICAgaXQgXCJhZGp1c3QgY3Vyc29yIHBvc2l0aW9uIDEgY29sdW1uIGxlZnQgd2hlbiBkZWFjdGl2YXRlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogWzAsIDddXG4gICAgICBpdCBcImNhbiBzZWxlY3QgbmV3IGxpbmUgaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2JywgY3Vyc29yOiBbMCwgOF0sIHByb3BlcnR5SGVhZDogWzAsIDddXG4gICAgICAgIGVuc3VyZSAnbCcsIGN1cnNvcjogWzEsIDBdLCBwcm9wZXJ0eUhlYWQ6IFswLCA4XVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFswLCA3XVxuXG4gICAgZGVzY3JpYmUgXCJkZWFjdGl2YXRpbmcgdmlzdWFsIG1vZGUgb24gYmxhbmsgbGluZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMDogYWJjXG5cbiAgICAgICAgICAgIDI6IGFiY1xuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgIGl0IFwidiBjYXNlLTFcIiwgLT5cbiAgICAgICAgZW5zdXJlICd2JywgbW9kZTogWyd2aXN1YWwnLCAnY2hhcmFjdGVyd2lzZSddLCBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgaXQgXCJ2IGNhc2UtMiBzZWxlY3Rpb24gaGVhZCBpcyBibGFuayBsaW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ3YgaicsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXSwgY3Vyc29yOiBbMiwgMF0sIHNlbGVjdGVkVGV4dDogXCI6IGFiY1xcblxcblwiXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogWzEsIDBdXG4gICAgICBpdCBcIlYgY2FzZS0xXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnVicsIG1vZGU6IFsndmlzdWFsJywgJ2xpbmV3aXNlJ10sIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgbW9kZTogJ25vcm1hbCcsIGN1cnNvcjogWzEsIDBdXG4gICAgICBpdCBcIlYgY2FzZS0yIHNlbGVjdGlvbiBoZWFkIGlzIGJsYW5rIGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSAnViBqJywgbW9kZTogWyd2aXN1YWwnLCAnbGluZXdpc2UnXSwgY3Vyc29yOiBbMiwgMF0sIHNlbGVjdGVkVGV4dDogXCIwOiBhYmNcXG5cXG5cIlxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgaXQgXCJjdHJsLXZcIiwgLT5cbiAgICAgICAgZW5zdXJlICdjdHJsLXYnLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXSwgc2VsZWN0ZWRCdWZmZXJSYW5nZTogW1sxLCAwXSwgWzEsIDBdXVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIG1vZGU6ICdub3JtYWwnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgaXQgXCJjdHJsLXYgYW5kIG1vdmUgb3ZlciBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnY3RybC12JywgbW9kZTogWyd2aXN1YWwnLCAnYmxvY2t3aXNlJ10sIHNlbGVjdGVkQnVmZmVyUmFuZ2VPcmRlcmVkOiBbWzEsIDBdLCBbMSwgMF1dXG4gICAgICAgIGVuc3VyZSAnaycsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddLCBzZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZDogW1tbMCwgMF0sIFswLCAxXV0sIFtbMSwgMF0sIFsxLCAwXV1dXG4gICAgICAgIGVuc3VyZSAnaicsIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddLCBzZWxlY3RlZEJ1ZmZlclJhbmdlT3JkZXJlZDogW1sxLCAwXSwgWzEsIDBdXVxuICAgICAgICBlbnN1cmUgJ2onLCBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXSwgc2VsZWN0ZWRCdWZmZXJSYW5nZU9yZGVyZWQ6IFtbWzEsIDBdLCBbMSwgMF1dLCBbWzIsIDBdLCBbMiwgMV1dXVxuXG4gIGRlc2NyaWJlIFwibWFya3NcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+IHNldCB0ZXh0OiBcInRleHQgaW4gbGluZSAxXFxudGV4dCBpbiBsaW5lIDJcXG50ZXh0IGluIGxpbmUgM1wiXG5cbiAgICBpdCBcImJhc2ljIG1hcmtpbmcgZnVuY3Rpb25hbGl0eVwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzEsIDFdXG4gICAgICBrZXlzdHJva2UgJ20gdCdcbiAgICAgIHNldCBjdXJzb3I6IFsyLCAyXVxuICAgICAgZW5zdXJlICdgIHQnLCBjdXJzb3I6IFsxLCAxXVxuXG4gICAgaXQgXCJyZWFsICh0cmFja2luZykgbWFya2luZyBmdW5jdGlvbmFsaXR5XCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMiwgMl1cbiAgICAgIGtleXN0cm9rZSAnbSBxJ1xuICAgICAgc2V0IGN1cnNvcjogWzEsIDJdXG4gICAgICBlbnN1cmUgJ28gZXNjYXBlIGAgcScsIGN1cnNvcjogWzMsIDJdXG5cbiAgICBpdCBcInJlYWwgKHRyYWNraW5nKSBtYXJraW5nIGZ1bmN0aW9uYWxpdHlcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsyLCAyXVxuICAgICAga2V5c3Ryb2tlICdtIHEnXG4gICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgIGVuc3VyZSAnZCBkIGVzY2FwZSBgIHEnLCBjdXJzb3I6IFsxLCAyXVxuXG4gIGRlc2NyaWJlIFwiaXMtbmFycm93ZWQgYXR0cmlidXRlXCIsIC0+XG4gICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlID0gLT5cbiAgICAgIGVuc3VyZSBcImVzY2FwZVwiLFxuICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBzZWxlY3RlZFRleHQ6ICcnXG4gICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IGZhbHNlXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAxOi0tLS0tXG4gICAgICAgIDI6LS0tLS1cbiAgICAgICAgMzotLS0tLVxuICAgICAgICA0Oi0tLS0tXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJub3JtYWwtbW9kZVwiLCAtPlxuICAgICAgaXQgXCJpcyBub3QgbmFycm93ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgbW9kZTogWydub3JtYWwnXVxuICAgICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IGZhbHNlXG4gICAgZGVzY3JpYmUgXCJ2aXN1YWwtbW9kZS5jaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICBpdCBcIltzaW5nbGUgcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgJCcsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnMTotLS0tLVxcbidcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cbiAgICAgICAgICBzZWxlY3Rpb25Jc05hcnJvd2VkOiBmYWxzZVxuICAgICAgICBlbnN1cmVOb3JtYWxNb2RlU3RhdGUoKVxuICAgICAgaXQgXCJbbXVsdGktcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgaicsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIlwiXCJcbiAgICAgICAgICAxOi0tLS0tXG4gICAgICAgICAgMlxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IHRydWVcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiAgICBkZXNjcmliZSBcInZpc3VhbC1tb2RlLmxpbmV3aXNlXCIsIC0+XG4gICAgICBpdCBcIltzaW5nbGUgcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1YnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCIxOi0tLS0tXFxuXCJcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgc2VsZWN0aW9uSXNOYXJyb3dlZDogZmFsc2VcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiAgICAgIGl0IFwiW211bHRpLXJvd10gaXMgbmFycm93ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICdWIGonLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCJcIlwiXG4gICAgICAgICAgMTotLS0tLVxuICAgICAgICAgIDI6LS0tLS1cXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdsaW5ld2lzZSddXG4gICAgICAgICAgc2VsZWN0aW9uSXNOYXJyb3dlZDogdHJ1ZVxuICAgICAgICBlbnN1cmVOb3JtYWxNb2RlU3RhdGUoKVxuICAgIGRlc2NyaWJlIFwidmlzdWFsLW1vZGUuYmxvY2t3aXNlXCIsIC0+XG4gICAgICBpdCBcIltzaW5nbGUgcm93XSBpcyBuYXJyb3dlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2N0cmwtdiBsJyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiMTpcIlxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0aW9uSXNOYXJyb3dlZDogZmFsc2VcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiAgICAgIGl0IFwiW211bHRpLXJvd10gaXMgbmFycm93ZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICdjdHJsLXYgbCBqJyxcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFtcIjE6XCIsIFwiMjpcIl1cbiAgICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdibG9ja3dpc2UnXVxuICAgICAgICAgIHNlbGVjdGlvbklzTmFycm93ZWQ6IHRydWVcbiAgICAgICAgZW5zdXJlTm9ybWFsTW9kZVN0YXRlKClcbiJdfQ==
