(function() {
  var Point, TextData, dispatch, getView, getVimState, ref, setEditorWidthInCharacters, settings;

  Point = require('atom').Point;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView;

  settings = require('../lib/settings');

  setEditorWidthInCharacters = function(editor, widthInCharacters) {
    var component;
    editor.setDefaultCharWidth(1);
    component = editor.component;
    component.element.style.width = component.getGutterContainerWidth() + widthInCharacters * component.measurements.baseCharacterWidth + "px";
    return component.getNextUpdatePromise();
  };

  describe("Motion general", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      return getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
    });
    describe("simple motions", function() {
      var text;
      text = null;
      beforeEach(function() {
        text = new TextData("12345\nabcd\nABCDE\n");
        return set({
          text: text.getRaw(),
          cursor: [1, 1]
        });
      });
      describe("the h keybinding", function() {
        describe("as a motion", function() {
          it("moves the cursor left, but not to the previous line", function() {
            ensure('h', {
              cursor: [1, 0]
            });
            return ensure('h', {
              cursor: [1, 0]
            });
          });
          return it("moves the cursor to the previous line if wrapLeftRightMotion is true", function() {
            settings.set('wrapLeftRightMotion', true);
            return ensure('h h', {
              cursor: [0, 4]
            });
          });
        });
        return describe("as a selection", function() {
          return it("selects the character to the left", function() {
            return ensure('y h', {
              cursor: [1, 0],
              register: {
                '"': {
                  text: 'a'
                }
              }
            });
          });
        });
      });
      describe("the j keybinding", function() {
        it("moves the cursor down, but not to the end of the last line", function() {
          ensure('j', {
            cursor: [2, 1]
          });
          return ensure('j', {
            cursor: [2, 1]
          });
        });
        it("moves the cursor to the end of the line, not past it", function() {
          set({
            cursor: [0, 4]
          });
          return ensure('j', {
            cursor: [1, 3]
          });
        });
        it("remembers the column it was in after moving to shorter line", function() {
          set({
            cursor: [0, 4]
          });
          ensure('j', {
            cursor: [1, 3]
          });
          return ensure('j', {
            cursor: [2, 4]
          });
        });
        it("never go past last newline", function() {
          return ensure('1 0 j', {
            cursor: [2, 1]
          });
        });
        return describe("when visual mode", function() {
          beforeEach(function() {
            return ensure('v', {
              cursor: [1, 2],
              selectedText: 'b'
            });
          });
          it("moves the cursor down", function() {
            return ensure('j', {
              cursor: [2, 2],
              selectedText: "bcd\nAB"
            });
          });
          it("doesn't go over after the last line", function() {
            return ensure('j', {
              cursor: [2, 2],
              selectedText: "bcd\nAB"
            });
          });
          it("keep same column(goalColumn) even after across the empty line", function() {
            keystroke('escape');
            set({
              text: "abcdefg\n\nabcdefg",
              cursor: [0, 3]
            });
            ensure('v', {
              cursor: [0, 4]
            });
            return ensure('j j', {
              cursor: [2, 4],
              selectedText: "defg\n\nabcd"
            });
          });
          return it("original visual line remains when jk across orignal selection", function() {
            text = new TextData("line0\nline1\nline2\n");
            set({
              text: text.getRaw(),
              cursor: [1, 1]
            });
            ensure('V', {
              selectedText: text.getLines([1])
            });
            ensure('j', {
              selectedText: text.getLines([1, 2])
            });
            ensure('k', {
              selectedText: text.getLines([1])
            });
            ensure('k', {
              selectedText: text.getLines([0, 1])
            });
            ensure('j', {
              selectedText: text.getLines([1])
            });
            return ensure('j', {
              selectedText: text.getLines([1, 2])
            });
          });
        });
      });
      describe("move-down-wrap, move-up-wrap", function() {
        beforeEach(function() {
          atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'k': 'vim-mode-plus:move-up-wrap',
              'j': 'vim-mode-plus:move-down-wrap'
            }
          });
          return set({
            text: "hello\nhello\nhello\nhello\n"
          });
        });
        describe('move-down-wrap', function() {
          beforeEach(function() {
            return set({
              cursor: [3, 1]
            });
          });
          it("move down with wrawp", function() {
            return ensure('j', {
              cursor: [0, 1]
            });
          });
          it("move down with wrawp", function() {
            return ensure('2 j', {
              cursor: [1, 1]
            });
          });
          return it("move down with wrawp", function() {
            return ensure('4 j', {
              cursor: [3, 1]
            });
          });
        });
        return describe('move-up-wrap', function() {
          beforeEach(function() {
            return set({
              cursor: [0, 1]
            });
          });
          it("move down with wrawp", function() {
            return ensure('k', {
              cursor: [3, 1]
            });
          });
          it("move down with wrawp", function() {
            return ensure('2 k', {
              cursor: [2, 1]
            });
          });
          return it("move down with wrawp", function() {
            return ensure('4 k', {
              cursor: [0, 1]
            });
          });
        });
      });
      xdescribe("with big count was given", function() {
        var BIG_NUMBER, ensureBigCountMotion;
        BIG_NUMBER = Number.MAX_SAFE_INTEGER;
        ensureBigCountMotion = function(keystrokes, options) {
          var count;
          count = String(BIG_NUMBER).split('').join(' ');
          keystrokes = keystrokes.split('').join(' ');
          return ensure(count + " " + keystrokes, options);
        };
        beforeEach(function() {
          atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              'g {': 'vim-mode-plus:move-to-previous-fold-start',
              'g }': 'vim-mode-plus:move-to-next-fold-start',
              ', N': 'vim-mode-plus:move-to-previous-number',
              ', n': 'vim-mode-plus:move-to-next-number'
            }
          });
          return set({
            text: "0000\n1111\n2222\n",
            cursor: [1, 2]
          });
        });
        it("by `j`", function() {
          return ensureBigCountMotion('j', {
            cursor: [2, 2]
          });
        });
        it("by `k`", function() {
          return ensureBigCountMotion('k', {
            cursor: [0, 2]
          });
        });
        it("by `h`", function() {
          return ensureBigCountMotion('h', {
            cursor: [1, 0]
          });
        });
        it("by `l`", function() {
          return ensureBigCountMotion('l', {
            cursor: [1, 3]
          });
        });
        it("by `[`", function() {
          return ensureBigCountMotion('[', {
            cursor: [0, 2]
          });
        });
        it("by `]`", function() {
          return ensureBigCountMotion(']', {
            cursor: [2, 2]
          });
        });
        it("by `w`", function() {
          return ensureBigCountMotion('w', {
            cursor: [2, 3]
          });
        });
        it("by `W`", function() {
          return ensureBigCountMotion('W', {
            cursor: [2, 3]
          });
        });
        it("by `b`", function() {
          return ensureBigCountMotion('b', {
            cursor: [0, 0]
          });
        });
        it("by `B`", function() {
          return ensureBigCountMotion('B', {
            cursor: [0, 0]
          });
        });
        it("by `e`", function() {
          return ensureBigCountMotion('e', {
            cursor: [2, 3]
          });
        });
        it("by `(`", function() {
          return ensureBigCountMotion('(', {
            cursor: [0, 0]
          });
        });
        it("by `)`", function() {
          return ensureBigCountMotion(')', {
            cursor: [2, 3]
          });
        });
        it("by `{`", function() {
          return ensureBigCountMotion('{', {
            cursor: [0, 0]
          });
        });
        it("by `}`", function() {
          return ensureBigCountMotion('}', {
            cursor: [2, 3]
          });
        });
        it("by `-`", function() {
          return ensureBigCountMotion('-', {
            cursor: [0, 0]
          });
        });
        it("by `_`", function() {
          return ensureBigCountMotion('_', {
            cursor: [2, 0]
          });
        });
        it("by `g {`", function() {
          return ensureBigCountMotion('g {', {
            cursor: [1, 2]
          });
        });
        it("by `g }`", function() {
          return ensureBigCountMotion('g }', {
            cursor: [1, 2]
          });
        });
        it("by `, N`", function() {
          return ensureBigCountMotion(', N', {
            cursor: [1, 2]
          });
        });
        return it("by `, n`", function() {
          return ensureBigCountMotion(', n', {
            cursor: [1, 2]
          });
        });
      });
      describe("the k keybinding", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 1]
          });
        });
        it("moves the cursor up", function() {
          return ensure('k', {
            cursor: [1, 1]
          });
        });
        it("moves the cursor up and remember column it was in", function() {
          set({
            cursor: [2, 4]
          });
          ensure('k', {
            cursor: [1, 3]
          });
          return ensure('k', {
            cursor: [0, 4]
          });
        });
        it("moves the cursor up, but not to the beginning of the first line", function() {
          return ensure('1 0 k', {
            cursor: [0, 1]
          });
        });
        return describe("when visual mode", function() {
          return it("keep same column(goalColumn) even after across the empty line", function() {
            set({
              text: "abcdefg\n\nabcdefg",
              cursor: [2, 3]
            });
            ensure('v', {
              cursor: [2, 4],
              selectedText: 'd'
            });
            return ensure('k k', {
              cursor: [0, 3],
              selectedText: "defg\n\nabcd"
            });
          });
        });
      });
      describe("gj gk in softwrap", function() {
        text = [][0];
        beforeEach(function() {
          editor.setSoftWrapped(true);
          editor.setEditorWidthInChars(10);
          editor.setDefaultCharWidth(1);
          text = new TextData("1st line of buffer\n2nd line of buffer, Very long line\n3rd line of buffer\n\n5th line of buffer\n");
          return set({
            text: text.getRaw(),
            cursor: [0, 0]
          });
        });
        describe("selection is not reversed", function() {
          it("screen position and buffer position is different", function() {
            ensure('g j', {
              cursorScreen: [1, 0],
              cursor: [0, 9]
            });
            ensure('g j', {
              cursorScreen: [2, 0],
              cursor: [1, 0]
            });
            ensure('g j', {
              cursorScreen: [3, 0],
              cursor: [1, 9]
            });
            return ensure('g j', {
              cursorScreen: [4, 0],
              cursor: [1, 12]
            });
          });
          return it("jk move selection buffer-line wise", function() {
            ensure('V', {
              selectedText: text.getLines([0])
            });
            ensure('j', {
              selectedText: text.getLines([0, 1])
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2])
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2, 3])
            });
            ensure('j', {
              selectedText: text.getLines([0, 1, 2, 3, 4])
            });
            ensure('k', {
              selectedText: text.getLines([0, 1, 2, 3])
            });
            ensure('k', {
              selectedText: text.getLines([0, 1, 2])
            });
            ensure('k', {
              selectedText: text.getLines([0, 1])
            });
            ensure('k', {
              selectedText: text.getLines([0])
            });
            return ensure('k', {
              selectedText: text.getLines([0])
            });
          });
        });
        return describe("selection is reversed", function() {
          it("screen position and buffer position is different", function() {
            ensure('g j', {
              cursorScreen: [1, 0],
              cursor: [0, 9]
            });
            ensure('g j', {
              cursorScreen: [2, 0],
              cursor: [1, 0]
            });
            ensure('g j', {
              cursorScreen: [3, 0],
              cursor: [1, 9]
            });
            return ensure('g j', {
              cursorScreen: [4, 0],
              cursor: [1, 12]
            });
          });
          return it("jk move selection buffer-line wise", function() {
            set({
              cursor: [4, 0]
            });
            ensure('V', {
              selectedText: text.getLines([4])
            });
            ensure('k', {
              selectedText: text.getLines([3, 4])
            });
            ensure('k', {
              selectedText: text.getLines([2, 3, 4])
            });
            ensure('k', {
              selectedText: text.getLines([1, 2, 3, 4])
            });
            ensure('k', {
              selectedText: text.getLines([0, 1, 2, 3, 4])
            });
            ensure('j', {
              selectedText: text.getLines([1, 2, 3, 4])
            });
            ensure('j', {
              selectedText: text.getLines([2, 3, 4])
            });
            ensure('j', {
              selectedText: text.getLines([3, 4])
            });
            ensure('j', {
              selectedText: text.getLines([4])
            });
            return ensure('j', {
              selectedText: text.getLines([4])
            });
          });
        });
      });
      describe("the l keybinding", function() {
        beforeEach(function() {
          return set({
            cursor: [1, 2]
          });
        });
        it("moves the cursor right, but not to the next line", function() {
          ensure('l', {
            cursor: [1, 3]
          });
          return ensure('l', {
            cursor: [1, 3]
          });
        });
        it("moves the cursor to the next line if wrapLeftRightMotion is true", function() {
          settings.set('wrapLeftRightMotion', true);
          return ensure('l l', {
            cursor: [2, 0]
          });
        });
        return describe("on a blank line", function() {
          return it("doesn't move the cursor", function() {
            set({
              text: "\n\n\n",
              cursor: [1, 0]
            });
            return ensure('l', {
              cursor: [1, 0]
            });
          });
        });
      });
      return describe("move-(up/down)-to-edge", function() {
        text = null;
        beforeEach(function() {
          text = new TextData("0:  4 67  01234567890123456789\n1:         1234567890123456789\n2:    6 890         0123456789\n3:    6 890         0123456789\n4:   56 890         0123456789\n5:                  0123456789\n6:                  0123456789\n7:  4 67            0123456789\n");
          return set({
            text: text.getRaw(),
            cursor: [4, 3]
          });
        });
        describe("edgeness of first-line and last-line", function() {
          beforeEach(function() {
            return set({
              text_: "____this is line 0\n____this is text of line 1\n____this is text of line 2\n______hello line 3\n______hello line 4",
              cursor: [2, 2]
            });
          });
          describe("when column is leading spaces", function() {
            return it("doesn't move cursor", function() {
              ensure('[', {
                cursor: [2, 2]
              });
              return ensure(']', {
                cursor: [2, 2]
              });
            });
          });
          return describe("when column is trailing spaces", function() {
            return it("doesn't move cursor", function() {
              set({
                cursor: [1, 20]
              });
              ensure(']', {
                cursor: [2, 20]
              });
              ensure(']', {
                cursor: [2, 20]
              });
              ensure('[', {
                cursor: [1, 20]
              });
              return ensure('[', {
                cursor: [1, 20]
              });
            });
          });
        });
        it("move to non-blank-char on both first and last row", function() {
          set({
            cursor: [4, 4]
          });
          ensure('[', {
            cursor: [0, 4]
          });
          return ensure(']', {
            cursor: [7, 4]
          });
        });
        it("move to white space char when both side column is non-blank char", function() {
          set({
            cursor: [4, 5]
          });
          ensure('[', {
            cursor: [0, 5]
          });
          ensure(']', {
            cursor: [4, 5]
          });
          return ensure(']', {
            cursor: [7, 5]
          });
        });
        it("only stops on row one of [first row, last row, up-or-down-row is blank] case-1", function() {
          set({
            cursor: [4, 6]
          });
          ensure('[', {
            cursor: [2, 6]
          });
          ensure('[', {
            cursor: [0, 6]
          });
          ensure(']', {
            cursor: [2, 6]
          });
          ensure(']', {
            cursor: [4, 6]
          });
          return ensure(']', {
            cursor: [7, 6]
          });
        });
        it("only stops on row one of [first row, last row, up-or-down-row is blank] case-2", function() {
          set({
            cursor: [4, 7]
          });
          ensure('[', {
            cursor: [2, 7]
          });
          ensure('[', {
            cursor: [0, 7]
          });
          ensure(']', {
            cursor: [2, 7]
          });
          ensure(']', {
            cursor: [4, 7]
          });
          return ensure(']', {
            cursor: [7, 7]
          });
        });
        it("support count", function() {
          set({
            cursor: [4, 6]
          });
          ensure('2 [', {
            cursor: [0, 6]
          });
          return ensure('3 ]', {
            cursor: [7, 6]
          });
        });
        return describe('editor for hardTab', function() {
          var pack;
          pack = 'language-go';
          beforeEach(function() {
            waitsForPromise(function() {
              return atom.packages.activatePackage(pack);
            });
            getVimState('sample.go', function(state, vimEditor) {
              editor = state.editor, editorElement = state.editorElement;
              return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
            });
            return runs(function() {
              set({
                cursorScreen: [8, 2]
              });
              return ensure({
                cursor: [8, 1]
              });
            });
          });
          afterEach(function() {
            return atom.packages.deactivatePackage(pack);
          });
          return it("move up/down to next edge of same *screen* column", function() {
            ensure('[', {
              cursorScreen: [5, 2]
            });
            ensure('[', {
              cursorScreen: [3, 2]
            });
            ensure('[', {
              cursorScreen: [2, 2]
            });
            ensure('[', {
              cursorScreen: [0, 2]
            });
            ensure(']', {
              cursorScreen: [2, 2]
            });
            ensure(']', {
              cursorScreen: [3, 2]
            });
            ensure(']', {
              cursorScreen: [5, 2]
            });
            ensure(']', {
              cursorScreen: [9, 2]
            });
            ensure(']', {
              cursorScreen: [11, 2]
            });
            ensure(']', {
              cursorScreen: [14, 2]
            });
            ensure(']', {
              cursorScreen: [17, 2]
            });
            ensure('[', {
              cursorScreen: [14, 2]
            });
            ensure('[', {
              cursorScreen: [11, 2]
            });
            ensure('[', {
              cursorScreen: [9, 2]
            });
            ensure('[', {
              cursorScreen: [5, 2]
            });
            ensure('[', {
              cursorScreen: [3, 2]
            });
            ensure('[', {
              cursorScreen: [2, 2]
            });
            return ensure('[', {
              cursorScreen: [0, 2]
            });
          });
        });
      });
    });
    describe('moveSuccessOnLinewise behaviral characteristic', function() {
      var originalText;
      originalText = null;
      beforeEach(function() {
        settings.set('useClipboardAsDefaultRegister', false);
        set({
          text: "000\n111\n222\n"
        });
        originalText = editor.getText();
        return ensure({
          register: {
            '"': {
              text: void 0
            }
          }
        });
      });
      describe("moveSuccessOnLinewise=false motion", function() {
        describe("when it can move", function() {
          beforeEach(function() {
            return set({
              cursor: [1, 0]
            });
          });
          it("delete by j", function() {
            return ensure("d j", {
              text: "000\n",
              mode: 'normal'
            });
          });
          it("yank by j", function() {
            return ensure("y j", {
              text: originalText,
              register: {
                '"': {
                  text: "111\n222\n"
                }
              },
              mode: 'normal'
            });
          });
          it("change by j", function() {
            return ensure("c j", {
              textC: "000\n|\n",
              register: {
                '"': {
                  text: "111\n222\n"
                }
              },
              mode: 'insert'
            });
          });
          it("delete by k", function() {
            return ensure("d k", {
              text: "222\n",
              mode: 'normal'
            });
          });
          it("yank by k", function() {
            return ensure("y k", {
              text: originalText,
              register: {
                '"': {
                  text: "000\n111\n"
                }
              },
              mode: 'normal'
            });
          });
          return it("change by k", function() {
            return ensure("c k", {
              textC: "|\n222\n",
              register: {
                '"': {
                  text: "000\n111\n"
                }
              },
              mode: 'insert'
            });
          });
        });
        describe("when it can not move-up", function() {
          beforeEach(function() {
            return set({
              cursor: [0, 0]
            });
          });
          it("delete by dk", function() {
            return ensure("d k", {
              text: originalText,
              mode: 'normal'
            });
          });
          it("yank by yk", function() {
            return ensure("y k", {
              text: originalText,
              register: {
                '"': {
                  text: void 0
                }
              },
              mode: 'normal'
            });
          });
          return it("change by ck", function() {
            return ensure("c k", {
              textC: "|000\n111\n222\n",
              register: {
                '"': {
                  text: "\n"
                }
              },
              mode: 'insert'
            });
          });
        });
        return describe("when it can not move-down", function() {
          beforeEach(function() {
            return set({
              cursor: [2, 0]
            });
          });
          it("delete by dj", function() {
            return ensure("d j", {
              text: originalText,
              mode: 'normal'
            });
          });
          it("yank by yj", function() {
            return ensure("y j", {
              text: originalText,
              register: {
                '"': {
                  text: void 0
                }
              },
              mode: 'normal'
            });
          });
          return it("change by cj", function() {
            return ensure("c j", {
              textC: "000\n111\n|222\n",
              register: {
                '"': {
                  text: "\n"
                }
              },
              mode: 'insert'
            });
          });
        });
      });
      return describe("moveSuccessOnLinewise=true motion", function() {
        describe("when it can move", function() {
          beforeEach(function() {
            return set({
              cursor: [1, 0]
            });
          });
          it("delete by G", function() {
            return ensure("d G", {
              text: "000\n",
              mode: 'normal'
            });
          });
          it("yank by G", function() {
            return ensure("y G", {
              text: originalText,
              register: {
                '"': {
                  text: "111\n222\n"
                }
              },
              mode: 'normal'
            });
          });
          it("change by G", function() {
            return ensure("c G", {
              textC: "000\n|\n",
              register: {
                '"': {
                  text: "111\n222\n"
                }
              },
              mode: 'insert'
            });
          });
          it("delete by gg", function() {
            return ensure("d g g", {
              text: "222\n",
              mode: 'normal'
            });
          });
          it("yank by gg", function() {
            return ensure("y g g", {
              text: originalText,
              register: {
                '"': {
                  text: "000\n111\n"
                }
              },
              mode: 'normal'
            });
          });
          return it("change by gg", function() {
            return ensure("c g g", {
              textC: "|\n222\n",
              register: {
                '"': {
                  text: "000\n111\n"
                }
              },
              mode: 'insert'
            });
          });
        });
        describe("when it can not move-up", function() {
          beforeEach(function() {
            return set({
              cursor: [0, 0]
            });
          });
          it("delete by gg", function() {
            return ensure("d g g", {
              text: "111\n222\n",
              mode: 'normal'
            });
          });
          it("yank by gg", function() {
            return ensure("y g g", {
              text: originalText,
              register: {
                '"': {
                  text: "000\n"
                }
              },
              mode: 'normal'
            });
          });
          return it("change by gg", function() {
            return ensure("c g g", {
              textC: "|\n111\n222\n",
              register: {
                '"': {
                  text: "000\n"
                }
              },
              mode: 'insert'
            });
          });
        });
        return describe("when it can not move-down", function() {
          beforeEach(function() {
            return set({
              cursor: [2, 0]
            });
          });
          it("delete by G", function() {
            return ensure("d G", {
              text: "000\n111\n",
              mode: 'normal'
            });
          });
          it("yank by G", function() {
            return ensure("y G", {
              text: originalText,
              register: {
                '"': {
                  text: "222\n"
                }
              },
              mode: 'normal'
            });
          });
          return it("change by G", function() {
            return ensure("c G", {
              textC: "000\n111\n|\n",
              register: {
                '"': {
                  text: "222\n"
                }
              },
              mode: 'insert'
            });
          });
        });
      });
    });
    describe("the w keybinding", function() {
      var baseText;
      baseText = "ab cde1+-\n xyz\n\nzip";
      beforeEach(function() {
        return set({
          text: baseText
        });
      });
      describe("as a motion", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        it("moves the cursor to the beginning of the next word", function() {
          ensure('w', {
            cursor: [0, 3]
          });
          ensure('w', {
            cursor: [0, 7]
          });
          ensure('w', {
            cursor: [1, 1]
          });
          ensure('w', {
            cursor: [2, 0]
          });
          ensure('w', {
            cursor: [3, 0]
          });
          ensure('w', {
            cursor: [3, 2]
          });
          return ensure('w', {
            cursor: [3, 2]
          });
        });
        it("moves the cursor to the end of the word if last word in file", function() {
          set({
            text: 'abc',
            cursor: [0, 0]
          });
          return ensure('w', {
            cursor: [0, 2]
          });
        });
        it("move to next word by skipping trailing white spaces", function() {
          set({
            textC_: "012|___\n  234"
          });
          return ensure('w', {
            textC_: "012___\n  |234"
          });
        });
        it("move to next word from EOL", function() {
          set({
            textC_: "|\n__234\""
          });
          return ensure('w', {
            textC_: "\n__|234\""
          });
        });
        return describe("for CRLF buffer", function() {
          beforeEach(function() {
            return set({
              text: baseText.replace(/\n/g, "\r\n")
            });
          });
          return describe("as a motion", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 0]
              });
            });
            return it("moves the cursor to the beginning of the next word", function() {
              ensure('w', {
                cursor: [0, 3]
              });
              ensure('w', {
                cursor: [0, 7]
              });
              ensure('w', {
                cursor: [1, 1]
              });
              ensure('w', {
                cursor: [2, 0]
              });
              ensure('w', {
                cursor: [3, 0]
              });
              ensure('w', {
                cursor: [3, 2]
              });
              return ensure('w', {
                cursor: [3, 2]
              });
            });
          });
        });
      });
      describe("when used by Change operator", function() {
        beforeEach(function() {
          return set({
            text_: "__var1 = 1\n__var2 = 2\n"
          });
        });
        describe("when cursor is on word", function() {
          return it("not eat whitespace", function() {
            set({
              cursor: [0, 3]
            });
            return ensure('c w', {
              text_: "__v = 1\n__var2 = 2\n",
              cursor: [0, 3]
            });
          });
        });
        describe("when cursor is on white space", function() {
          return it("only eat white space", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('c w', {
              text_: "var1 = 1\n__var2 = 2\n",
              cursor: [0, 0]
            });
          });
        });
        return describe("when text to EOL is all white space", function() {
          it("wont eat new line character", function() {
            set({
              text_: "abc__\ndef\n",
              cursor: [0, 3]
            });
            return ensure('c w', {
              text: "abc\ndef\n",
              cursor: [0, 3]
            });
          });
          return it("cant eat new line when count is specified", function() {
            set({
              text: "\n\n\n\n\nline6\n",
              cursor: [0, 0]
            });
            return ensure('5 c w', {
              text: "\nline6\n",
              cursor: [0, 0]
            });
          });
        });
      });
      return describe("as a selection", function() {
        describe("within a word", function() {
          return it("selects to the end of the word", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('y w', {
              register: {
                '"': {
                  text: 'ab '
                }
              }
            });
          });
        });
        return describe("between words", function() {
          return it("selects the whitespace", function() {
            set({
              cursor: [0, 2]
            });
            return ensure('y w', {
              register: {
                '"': {
                  text: ' '
                }
              }
            });
          });
        });
      });
    });
    describe("the W keybinding", function() {
      beforeEach(function() {
        return set({
          text: "cde1+- ab \n xyz\n\nzip"
        });
      });
      describe("as a motion", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        it("moves the cursor to the beginning of the next word", function() {
          ensure('W', {
            cursor: [0, 7]
          });
          ensure('W', {
            cursor: [1, 1]
          });
          ensure('W', {
            cursor: [2, 0]
          });
          return ensure('W', {
            cursor: [3, 0]
          });
        });
        it("moves the cursor to beginning of the next word of next line when all remaining text is white space.", function() {
          set({
            text_: "012___\n__234",
            cursor: [0, 3]
          });
          return ensure('W', {
            cursor: [1, 2]
          });
        });
        return it("moves the cursor to beginning of the next word of next line when cursor is at EOL.", function() {
          set({
            text_: "\n__234",
            cursor: [0, 0]
          });
          return ensure('W', {
            cursor: [1, 2]
          });
        });
      });
      describe("when used by Change operator", function() {
        beforeEach(function() {
          return set({
            text_: "__var1 = 1\n__var2 = 2\n"
          });
        });
        describe("when cursor is on word", function() {
          return it("not eat whitespace", function() {
            set({
              cursor: [0, 3]
            });
            return ensure('c W', {
              text_: "__v = 1\n__var2 = 2\n",
              cursor: [0, 3]
            });
          });
        });
        describe("when cursor is on white space", function() {
          return it("only eat white space", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('c W', {
              text_: "var1 = 1\n__var2 = 2\n",
              cursor: [0, 0]
            });
          });
        });
        return describe("when text to EOL is all white space", function() {
          it("wont eat new line character", function() {
            set({
              text: "abc  \ndef\n",
              cursor: [0, 3]
            });
            return ensure('c W', {
              text: "abc\ndef\n",
              cursor: [0, 3]
            });
          });
          return it("cant eat new line when count is specified", function() {
            set({
              text: "\n\n\n\n\nline6\n",
              cursor: [0, 0]
            });
            return ensure('5 c W', {
              text: "\nline6\n",
              cursor: [0, 0]
            });
          });
        });
      });
      return describe("as a selection", function() {
        describe("within a word", function() {
          return it("selects to the end of the whole word", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('y W', {
              register: {
                '"': {
                  text: 'cde1+- '
                }
              }
            });
          });
        });
        it("continues past blank lines", function() {
          set({
            cursor: [2, 0]
          });
          return ensure('d W', {
            text_: "cde1+- ab_\n_xyz\nzip",
            register: {
              '"': {
                text: "\n"
              }
            }
          });
        });
        return it("doesn't go past the end of the file", function() {
          set({
            cursor: [3, 0]
          });
          return ensure('d W', {
            text_: "cde1+- ab_\n_xyz\n\n",
            register: {
              '"': {
                text: 'zip'
              }
            }
          });
        });
      });
    });
    describe("the e keybinding", function() {
      beforeEach(function() {
        return set({
          text_: "ab cde1+-_\n_xyz\n\nzip"
        });
      });
      describe("as a motion", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        it("moves the cursor to the end of the current word", function() {
          ensure('e', {
            cursor: [0, 1]
          });
          ensure('e', {
            cursor: [0, 6]
          });
          ensure('e', {
            cursor: [0, 8]
          });
          ensure('e', {
            cursor: [1, 3]
          });
          return ensure('e', {
            cursor: [3, 2]
          });
        });
        return it("skips whitespace until EOF", function() {
          set({
            text: "012\n\n\n012\n\n",
            cursor: [0, 0]
          });
          ensure('e', {
            cursor: [0, 2]
          });
          ensure('e', {
            cursor: [3, 2]
          });
          return ensure('e', {
            cursor: [4, 0]
          });
        });
      });
      return describe("as selection", function() {
        describe("within a word", function() {
          return it("selects to the end of the current word", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('y e', {
              register: {
                '"': {
                  text: 'ab'
                }
              }
            });
          });
        });
        return describe("between words", function() {
          return it("selects to the end of the next word", function() {
            set({
              cursor: [0, 2]
            });
            return ensure('y e', {
              register: {
                '"': {
                  text: ' cde1'
                }
              }
            });
          });
        });
      });
    });
    describe("the ge keybinding", function() {
      describe("as a motion", function() {
        it("moves the cursor to the end of the previous word", function() {
          set({
            text: "1234 5678 wordword"
          });
          set({
            cursor: [0, 16]
          });
          ensure('g e', {
            cursor: [0, 8]
          });
          ensure('g e', {
            cursor: [0, 3]
          });
          ensure('g e', {
            cursor: [0, 0]
          });
          return ensure('g e', {
            cursor: [0, 0]
          });
        });
        it("moves corrently when starting between words", function() {
          set({
            text: "1 leading     end"
          });
          set({
            cursor: [0, 12]
          });
          return ensure('g e', {
            cursor: [0, 8]
          });
        });
        it("takes a count", function() {
          set({
            text: "vim mode plus is getting there"
          });
          set({
            cursor: [0, 28]
          });
          return ensure('5 g e', {
            cursor: [0, 2]
          });
        });
        xit("handles non-words inside words like vim", function() {
          set({
            text: "1234 5678 word-word"
          });
          set({
            cursor: [0, 18]
          });
          ensure('g e', {
            cursor: [0, 14]
          });
          ensure('g e', {
            cursor: [0, 13]
          });
          return ensure('g e', {
            cursor: [0, 8]
          });
        });
        return xit("handles newlines like vim", function() {
          set({
            text: "1234\n\n\n\n5678"
          });
          set({
            cursor: [5, 2]
          });
          ensure('g e', {
            cursor: [4, 0]
          });
          ensure('g e', {
            cursor: [3, 0]
          });
          ensure('g e', {
            cursor: [2, 0]
          });
          ensure('g e', {
            cursor: [1, 0]
          });
          ensure('g e', {
            cursor: [1, 0]
          });
          ensure('g e', {
            cursor: [0, 3]
          });
          return ensure('g e', {
            cursor: [0, 0]
          });
        });
      });
      describe("when used by Change operator", function() {
        it("changes word fragments", function() {
          set({
            text: "cet document"
          });
          set({
            cursor: [0, 7]
          });
          return ensure('c g e', {
            cursor: [0, 2],
            text: "cement",
            mode: 'insert'
          });
        });
        return it("changes whitespace properly", function() {
          set({
            text: "ce    doc"
          });
          set({
            cursor: [0, 4]
          });
          return ensure('c g e', {
            cursor: [0, 1],
            text: "c doc",
            mode: 'insert'
          });
        });
      });
      return describe("in characterwise visual mode", function() {
        return it("selects word fragments", function() {
          set({
            text: "cet document"
          });
          set({
            cursor: [0, 7]
          });
          return ensure('v g e', {
            cursor: [0, 2],
            selectedText: "t docu"
          });
        });
      });
    });
    describe("the E keybinding", function() {
      beforeEach(function() {
        return set({
          text_: "ab  cde1+-_\n_xyz_\n\nzip\n"
        });
      });
      describe("as a motion", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        return it("moves the cursor to the end of the current word", function() {
          ensure('E', {
            cursor: [0, 1]
          });
          ensure('E', {
            cursor: [0, 9]
          });
          ensure('E', {
            cursor: [1, 3]
          });
          ensure('E', {
            cursor: [3, 2]
          });
          return ensure('E', {
            cursor: [3, 2]
          });
        });
      });
      return describe("as selection", function() {
        describe("within a word", function() {
          return it("selects to the end of the current word", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('y E', {
              register: {
                '"': {
                  text: 'ab'
                }
              }
            });
          });
        });
        describe("between words", function() {
          return it("selects to the end of the next word", function() {
            set({
              cursor: [0, 2]
            });
            return ensure('y E', {
              register: {
                '"': {
                  text: '  cde1+-'
                }
              }
            });
          });
        });
        return describe("press more than once", function() {
          return it("selects to the end of the current word", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('v E E y', {
              register: {
                '"': {
                  text: 'ab  cde1+-'
                }
              }
            });
          });
        });
      });
    });
    describe("the gE keybinding", function() {
      return describe("as a motion", function() {
        return it("moves the cursor to the end of the previous word", function() {
          set({
            text: "12.4 5~7- word-word"
          });
          set({
            cursor: [0, 16]
          });
          ensure('g E', {
            cursor: [0, 8]
          });
          ensure('g E', {
            cursor: [0, 3]
          });
          ensure('g E', {
            cursor: [0, 0]
          });
          return ensure('g E', {
            cursor: [0, 0]
          });
        });
      });
    });
    describe("the (,) sentence keybinding", function() {
      describe("as a motion", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0],
            text: "sentence one.])'\"    sen.tence .two.\nhere.  sentence three\nmore three\n\n   sentence four\n\n\nsentence five.\nmore five\nmore six\n\n last sentence\nall done seven"
          });
        });
        it("moves the cursor to the end of the sentence", function() {
          ensure(')', {
            cursor: [0, 21]
          });
          ensure(')', {
            cursor: [1, 0]
          });
          ensure(')', {
            cursor: [1, 7]
          });
          ensure(')', {
            cursor: [3, 0]
          });
          ensure(')', {
            cursor: [4, 3]
          });
          ensure(')', {
            cursor: [5, 0]
          });
          ensure(')', {
            cursor: [7, 0]
          });
          ensure(')', {
            cursor: [8, 0]
          });
          ensure(')', {
            cursor: [10, 0]
          });
          ensure(')', {
            cursor: [11, 1]
          });
          ensure(')', {
            cursor: [12, 13]
          });
          ensure(')', {
            cursor: [12, 13]
          });
          ensure('(', {
            cursor: [11, 1]
          });
          ensure('(', {
            cursor: [10, 0]
          });
          ensure('(', {
            cursor: [8, 0]
          });
          ensure('(', {
            cursor: [7, 0]
          });
          ensure('(', {
            cursor: [6, 0]
          });
          ensure('(', {
            cursor: [4, 3]
          });
          ensure('(', {
            cursor: [3, 0]
          });
          ensure('(', {
            cursor: [1, 7]
          });
          ensure('(', {
            cursor: [1, 0]
          });
          ensure('(', {
            cursor: [0, 21]
          });
          ensure('(', {
            cursor: [0, 0]
          });
          return ensure('(', {
            cursor: [0, 0]
          });
        });
        it("skips to beginning of sentence", function() {
          set({
            cursor: [4, 15]
          });
          return ensure('(', {
            cursor: [4, 3]
          });
        });
        it("supports a count", function() {
          set({
            cursor: [0, 0]
          });
          ensure('3 )', {
            cursor: [1, 7]
          });
          return ensure('3 (', {
            cursor: [0, 0]
          });
        });
        it("can move start of buffer or end of buffer at maximum", function() {
          set({
            cursor: [0, 0]
          });
          ensure('2 0 )', {
            cursor: [12, 13]
          });
          return ensure('2 0 (', {
            cursor: [0, 0]
          });
        });
        return describe("sentence motion with skip-blank-row", function() {
          beforeEach(function() {
            return atom.keymaps.add("test", {
              'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
                'g )': 'vim-mode-plus:move-to-next-sentence-skip-blank-row',
                'g (': 'vim-mode-plus:move-to-previous-sentence-skip-blank-row'
              }
            });
          });
          return it("moves the cursor to the end of the sentence", function() {
            ensure('g )', {
              cursor: [0, 21]
            });
            ensure('g )', {
              cursor: [1, 0]
            });
            ensure('g )', {
              cursor: [1, 7]
            });
            ensure('g )', {
              cursor: [4, 3]
            });
            ensure('g )', {
              cursor: [7, 0]
            });
            ensure('g )', {
              cursor: [8, 0]
            });
            ensure('g )', {
              cursor: [11, 1]
            });
            ensure('g )', {
              cursor: [12, 13]
            });
            ensure('g )', {
              cursor: [12, 13]
            });
            ensure('g (', {
              cursor: [11, 1]
            });
            ensure('g (', {
              cursor: [8, 0]
            });
            ensure('g (', {
              cursor: [7, 0]
            });
            ensure('g (', {
              cursor: [4, 3]
            });
            ensure('g (', {
              cursor: [1, 7]
            });
            ensure('g (', {
              cursor: [1, 0]
            });
            ensure('g (', {
              cursor: [0, 21]
            });
            ensure('g (', {
              cursor: [0, 0]
            });
            return ensure('g (', {
              cursor: [0, 0]
            });
          });
        });
      });
      describe("moving inside a blank document", function() {
        beforeEach(function() {
          return set({
            text_: "_____\n_____"
          });
        });
        return it("moves without crashing", function() {
          set({
            cursor: [0, 0]
          });
          ensure(')', {
            cursor: [1, 4]
          });
          ensure(')', {
            cursor: [1, 4]
          });
          ensure('(', {
            cursor: [0, 0]
          });
          return ensure('(', {
            cursor: [0, 0]
          });
        });
      });
      return describe("as a selection", function() {
        beforeEach(function() {
          return set({
            text: "sentence one. sentence two.\n  sentence three."
          });
        });
        it('selects to the end of the current sentence', function() {
          set({
            cursor: [0, 20]
          });
          return ensure('y )', {
            register: {
              '"': {
                text: "ce two.\n  "
              }
            }
          });
        });
        return it('selects to the beginning of the current sentence', function() {
          set({
            cursor: [0, 20]
          });
          return ensure('y (', {
            register: {
              '"': {
                text: "senten"
              }
            }
          });
        });
      });
    });
    describe("the {,} keybinding", function() {
      beforeEach(function() {
        return set({
          text: "\n\n\n3: paragraph-1\n4: paragraph-1\n\n\n\n8: paragraph-2\n\n\n\n12: paragraph-3\n13: paragraph-3\n\n\n16: paragprah-4\n",
          cursor: [0, 0]
        });
      });
      describe("as a motion", function() {
        it("moves the cursor to the end of the paragraph", function() {
          set({
            cursor: [0, 0]
          });
          ensure('}', {
            cursor: [5, 0]
          });
          ensure('}', {
            cursor: [9, 0]
          });
          ensure('}', {
            cursor: [14, 0]
          });
          ensure('{', {
            cursor: [11, 0]
          });
          ensure('{', {
            cursor: [7, 0]
          });
          return ensure('{', {
            cursor: [2, 0]
          });
        });
        it("support count", function() {
          set({
            cursor: [0, 0]
          });
          ensure('3 }', {
            cursor: [14, 0]
          });
          return ensure('3 {', {
            cursor: [2, 0]
          });
        });
        return it("can move start of buffer or end of buffer at maximum", function() {
          set({
            cursor: [0, 0]
          });
          ensure('1 0 }', {
            cursor: [16, 14]
          });
          return ensure('1 0 {', {
            cursor: [0, 0]
          });
        });
      });
      return describe("as a selection", function() {
        it('selects to the end of the current paragraph', function() {
          set({
            cursor: [3, 3]
          });
          return ensure('y }', {
            register: {
              '"': {
                text: "paragraph-1\n4: paragraph-1\n"
              }
            }
          });
        });
        return it('selects to the end of the current paragraph', function() {
          set({
            cursor: [4, 3]
          });
          return ensure('y {', {
            register: {
              '"': {
                text: "\n3: paragraph-1\n4: "
              }
            }
          });
        });
      });
    });
    describe("the b keybinding", function() {
      beforeEach(function() {
        return set({
          textC_: "_ab cde1+-_\n_xyz\n\nzip }\n_|last"
        });
      });
      describe("as a motion", function() {
        return it("moves the cursor to the beginning of the previous word", function() {
          ensure('b', {
            textC: " ab cde1+- \n xyz\n\nzip |}\n last"
          });
          ensure('b', {
            textC: " ab cde1+- \n xyz\n\n|zip }\n last"
          });
          ensure('b', {
            textC: " ab cde1+- \n xyz\n|\nzip }\n last"
          });
          ensure('b', {
            textC: " ab cde1+- \n |xyz\n\nzip }\n last"
          });
          ensure('b', {
            textC: " ab cde1|+- \n xyz\n\nzip }\n last"
          });
          ensure('b', {
            textC: " ab |cde1+- \n xyz\n\nzip }\n last"
          });
          ensure('b', {
            textC: " |ab cde1+- \n xyz\n\nzip }\n last"
          });
          ensure('b', {
            textC: "| ab cde1+- \n xyz\n\nzip }\n last"
          });
          return ensure('b', {
            textC: "| ab cde1+- \n xyz\n\nzip }\n last"
          });
        });
      });
      return describe("as a selection", function() {
        describe("within a word", function() {
          return it("selects to the beginning of the current word", function() {
            set({
              textC: " a|b cd"
            });
            return ensure('y b', {
              textC: " |ab cd",
              register: {
                '"': {
                  text: 'a'
                }
              }
            });
          });
        });
        return describe("between words", function() {
          return it("selects to the beginning of the last word", function() {
            set({
              textC: " ab |cd"
            });
            return ensure('y b', {
              textC: " |ab cd",
              register: {
                '"': {
                  text: 'ab '
                }
              }
            });
          });
        });
      });
    });
    describe("the B keybinding", function() {
      beforeEach(function() {
        return set({
          text: "cde1+- ab\n\t xyz-123\n\n zip\n"
        });
      });
      describe("as a motion", function() {
        beforeEach(function() {
          return set({
            cursor: [4, 0]
          });
        });
        return it("moves the cursor to the beginning of the previous word", function() {
          ensure('B', {
            cursor: [3, 1]
          });
          ensure('B', {
            cursor: [2, 0]
          });
          ensure('B', {
            cursor: [1, 2]
          });
          ensure('B', {
            cursor: [0, 7]
          });
          return ensure('B', {
            cursor: [0, 0]
          });
        });
      });
      return describe("as a selection", function() {
        it("selects to the beginning of the whole word", function() {
          set({
            cursor: [1, 8]
          });
          return ensure('y B', {
            register: {
              '"': {
                text: 'xyz-12'
              }
            }
          });
        });
        return it("doesn't go past the beginning of the file", function() {
          set({
            cursor: [0, 0],
            register: {
              '"': {
                text: 'abc'
              }
            }
          });
          return ensure('y B', {
            register: {
              '"': {
                text: 'abc'
              }
            }
          });
        });
      });
    });
    describe("the ^ keybinding", function() {
      beforeEach(function() {
        return set({
          textC: "|  abcde"
        });
      });
      describe("from the beginning of the line", function() {
        describe("as a motion", function() {
          return it("moves the cursor to the first character of the line", function() {
            return ensure('^', {
              cursor: [0, 2]
            });
          });
        });
        return describe("as a selection", function() {
          it('selects to the first character of the line', function() {
            return ensure('d ^', {
              text: 'abcde',
              cursor: [0, 0]
            });
          });
          return it('selects to the first character of the line', function() {
            return ensure('d I', {
              text: 'abcde',
              cursor: [0, 0]
            });
          });
        });
      });
      describe("from the first character of the line", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 2]
          });
        });
        describe("as a motion", function() {
          return it("stays put", function() {
            return ensure('^', {
              cursor: [0, 2]
            });
          });
        });
        return describe("as a selection", function() {
          return it("does nothing", function() {
            return ensure('d ^', {
              text: '  abcde',
              cursor: [0, 2]
            });
          });
        });
      });
      return describe("from the middle of a word", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 4]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of the line", function() {
            return ensure('^', {
              cursor: [0, 2]
            });
          });
        });
        return describe("as a selection", function() {
          it('selects to the first character of the line', function() {
            return ensure('d ^', {
              text: '  cde',
              cursor: [0, 2]
            });
          });
          return it('selects to the first character of the line', function() {
            return ensure('d I', {
              text: '  cde',
              cursor: [0, 2]
            });
          });
        });
      });
    });
    describe("the 0 keybinding", function() {
      beforeEach(function() {
        return set({
          textC: "  ab|cde"
        });
      });
      describe("as a motion", function() {
        return it("moves the cursor to the first column", function() {
          return ensure('0', {
            cursor: [0, 0]
          });
        });
      });
      return describe("as a selection", function() {
        return it('selects to the first column of the line', function() {
          return ensure('d 0', {
            text: 'cde',
            cursor: [0, 0]
          });
        });
      });
    });
    describe("g 0, g ^ and g $", function() {
      var enableSoftWrapAndEnsure;
      enableSoftWrapAndEnsure = function() {
        editor.setSoftWrapped(true);
        expect(editor.lineTextForScreenRow(0)).toBe(" 1234567");
        expect(editor.lineTextForScreenRow(1)).toBe(" 89B1234");
        expect(editor.lineTextForScreenRow(2)).toBe(" 56789C1");
        expect(editor.lineTextForScreenRow(3)).toBe(" 2345678");
        return expect(editor.lineTextForScreenRow(4)).toBe(" 9");
      };
      beforeEach(function() {
        var scrollbarStyle;
        scrollbarStyle = document.createElement('style');
        scrollbarStyle.textContent = '::-webkit-scrollbar { -webkit-appearance: none }';
        jasmine.attachToDOM(scrollbarStyle);
        set({
          text_: "_123456789B123456789C123456789"
        });
        jasmine.attachToDOM(getView(atom.workspace));
        return waitsForPromise(function() {
          return setEditorWidthInCharacters(editor, 10);
        });
      });
      describe("the g 0 keybinding", function() {
        describe("allowMoveToOffScreenColumnOnScreenLineMotion = true(default)", function() {
          beforeEach(function() {
            return settings.set('allowMoveToOffScreenColumnOnScreenLineMotion', true);
          });
          describe("softwrap = false, firstColumnIsVisible = true", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 3]
              });
            });
            return it("move to column 0 of screen line", function() {
              return ensure("g 0", {
                cursor: [0, 0]
              });
            });
          });
          describe("softwrap = false, firstColumnIsVisible = false", function() {
            beforeEach(function() {
              set({
                cursor: [0, 15]
              });
              return editor.setFirstVisibleScreenColumn(10);
            });
            return it("move to column 0 of screen line", function() {
              return ensure("g 0", {
                cursor: [0, 0]
              });
            });
          });
          return describe("softwrap = true", function() {
            beforeEach(function() {
              return enableSoftWrapAndEnsure();
            });
            return it("move to column 0 of screen line", function() {
              set({
                cursorScreen: [0, 3]
              });
              ensure("g 0", {
                cursorScreen: [0, 0]
              });
              set({
                cursorScreen: [1, 3]
              });
              return ensure("g 0", {
                cursorScreen: [1, 1]
              });
            });
          });
        });
        return describe("allowMoveToOffScreenColumnOnScreenLineMotion = false", function() {
          beforeEach(function() {
            return settings.set('allowMoveToOffScreenColumnOnScreenLineMotion', false);
          });
          describe("softwrap = false, firstColumnIsVisible = true", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 3]
              });
            });
            return it("move to column 0 of screen line", function() {
              return ensure("g 0", {
                cursor: [0, 0]
              });
            });
          });
          describe("softwrap = false, firstColumnIsVisible = false", function() {
            beforeEach(function() {
              set({
                cursor: [0, 15]
              });
              return editor.setFirstVisibleScreenColumn(10);
            });
            return it("move to first visible colum of screen line", function() {
              return ensure("g 0", {
                cursor: [0, 10]
              });
            });
          });
          return describe("softwrap = true", function() {
            beforeEach(function() {
              return enableSoftWrapAndEnsure();
            });
            return it("move to column 0 of screen line", function() {
              set({
                cursorScreen: [0, 3]
              });
              ensure("g 0", {
                cursorScreen: [0, 0]
              });
              set({
                cursorScreen: [1, 3]
              });
              return ensure("g 0", {
                cursorScreen: [1, 1]
              });
            });
          });
        });
      });
      describe("the g ^ keybinding", function() {
        describe("allowMoveToOffScreenColumnOnScreenLineMotion = true(default)", function() {
          beforeEach(function() {
            return settings.set('allowMoveToOffScreenColumnOnScreenLineMotion', true);
          });
          describe("softwrap = false, firstColumnIsVisible = true", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 3]
              });
            });
            return it("move to first-char of screen line", function() {
              return ensure("g ^", {
                cursor: [0, 1]
              });
            });
          });
          describe("softwrap = false, firstColumnIsVisible = false", function() {
            beforeEach(function() {
              set({
                cursor: [0, 15]
              });
              return editor.setFirstVisibleScreenColumn(10);
            });
            return it("move to first-char of screen line", function() {
              return ensure("g ^", {
                cursor: [0, 1]
              });
            });
          });
          return describe("softwrap = true", function() {
            beforeEach(function() {
              return enableSoftWrapAndEnsure();
            });
            return it("move to first-char of screen line", function() {
              set({
                cursorScreen: [0, 3]
              });
              ensure("g ^", {
                cursorScreen: [0, 1]
              });
              set({
                cursorScreen: [1, 3]
              });
              return ensure("g ^", {
                cursorScreen: [1, 1]
              });
            });
          });
        });
        return describe("allowMoveToOffScreenColumnOnScreenLineMotion = false", function() {
          beforeEach(function() {
            return settings.set('allowMoveToOffScreenColumnOnScreenLineMotion', false);
          });
          describe("softwrap = false, firstColumnIsVisible = true", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 3]
              });
            });
            return it("move to first-char of screen line", function() {
              return ensure("g ^", {
                cursor: [0, 1]
              });
            });
          });
          describe("softwrap = false, firstColumnIsVisible = false", function() {
            beforeEach(function() {
              set({
                cursor: [0, 15]
              });
              return editor.setFirstVisibleScreenColumn(10);
            });
            return it("move to first-char of screen line", function() {
              return ensure("g ^", {
                cursor: [0, 10]
              });
            });
          });
          return describe("softwrap = true", function() {
            beforeEach(function() {
              return enableSoftWrapAndEnsure();
            });
            return it("move to first-char of screen line", function() {
              set({
                cursorScreen: [0, 3]
              });
              ensure("g ^", {
                cursorScreen: [0, 1]
              });
              set({
                cursorScreen: [1, 3]
              });
              return ensure("g ^", {
                cursorScreen: [1, 1]
              });
            });
          });
        });
      });
      return describe("the g $ keybinding", function() {
        describe("allowMoveToOffScreenColumnOnScreenLineMotion = true(default)", function() {
          beforeEach(function() {
            return settings.set('allowMoveToOffScreenColumnOnScreenLineMotion', true);
          });
          describe("softwrap = false, lastColumnIsVisible = true", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 27]
              });
            });
            return it("move to last-char of screen line", function() {
              return ensure("g $", {
                cursor: [0, 29]
              });
            });
          });
          describe("softwrap = false, lastColumnIsVisible = false", function() {
            beforeEach(function() {
              set({
                cursor: [0, 15]
              });
              return editor.setFirstVisibleScreenColumn(10);
            });
            return it("move to last-char of screen line", function() {
              return ensure("g $", {
                cursor: [0, 29]
              });
            });
          });
          return describe("softwrap = true", function() {
            beforeEach(function() {
              return enableSoftWrapAndEnsure();
            });
            return it("move to last-char of screen line", function() {
              set({
                cursorScreen: [0, 3]
              });
              ensure("g $", {
                cursorScreen: [0, 7]
              });
              set({
                cursorScreen: [1, 3]
              });
              return ensure("g $", {
                cursorScreen: [1, 7]
              });
            });
          });
        });
        return describe("allowMoveToOffScreenColumnOnScreenLineMotion = false", function() {
          beforeEach(function() {
            return settings.set('allowMoveToOffScreenColumnOnScreenLineMotion', false);
          });
          describe("softwrap = false, lastColumnIsVisible = true", function() {
            beforeEach(function() {
              return set({
                cursor: [0, 27]
              });
            });
            return it("move to last-char of screen line", function() {
              return ensure("g $", {
                cursor: [0, 29]
              });
            });
          });
          describe("softwrap = false, lastColumnIsVisible = false", function() {
            beforeEach(function() {
              set({
                cursor: [0, 15]
              });
              return editor.setFirstVisibleScreenColumn(10);
            });
            return it("move to last-char in visible screen line", function() {
              return ensure("g $", {
                cursor: [0, 18]
              });
            });
          });
          return describe("softwrap = true", function() {
            beforeEach(function() {
              return enableSoftWrapAndEnsure();
            });
            return it("move to last-char of screen line", function() {
              set({
                cursorScreen: [0, 3]
              });
              ensure("g $", {
                cursorScreen: [0, 7]
              });
              set({
                cursorScreen: [1, 3]
              });
              return ensure("g $", {
                cursorScreen: [1, 7]
              });
            });
          });
        });
      });
    });
    describe("the | keybinding", function() {
      beforeEach(function() {
        return set({
          text: "  abcde",
          cursor: [0, 4]
        });
      });
      describe("as a motion", function() {
        return it("moves the cursor to the number column", function() {
          ensure('|', {
            cursor: [0, 0]
          });
          ensure('1 |', {
            cursor: [0, 0]
          });
          ensure('3 |', {
            cursor: [0, 2]
          });
          return ensure('4 |', {
            cursor: [0, 3]
          });
        });
      });
      return describe("as operator's target", function() {
        return it('behave exclusively', function() {
          set({
            cursor: [0, 0]
          });
          return ensure('d 4 |', {
            text: 'bcde',
            cursor: [0, 0]
          });
        });
      });
    });
    describe("the $ keybinding", function() {
      beforeEach(function() {
        return set({
          text: "  abcde\n\n1234567890",
          cursor: [0, 4]
        });
      });
      describe("as a motion from empty line", function() {
        return it("moves the cursor to the end of the line", function() {
          set({
            cursor: [1, 0]
          });
          return ensure('$', {
            cursor: [1, 0]
          });
        });
      });
      describe("as a motion", function() {
        it("moves the cursor to the end of the line", function() {
          return ensure('$', {
            cursor: [0, 6]
          });
        });
        it("set goalColumn Infinity", function() {
          expect(editor.getLastCursor().goalColumn).toBe(null);
          ensure('$', {
            cursor: [0, 6]
          });
          return expect(editor.getLastCursor().goalColumn).toBe(2e308);
        });
        it("should remain in the last column when moving down", function() {
          ensure('$ j', {
            cursor: [1, 0]
          });
          return ensure('j', {
            cursor: [2, 9]
          });
        });
        return it("support count", function() {
          return ensure('3 $', {
            cursor: [2, 9]
          });
        });
      });
      return describe("as a selection", function() {
        return it("selects to the end of the lines", function() {
          return ensure('d $', {
            text: "  ab\n\n1234567890",
            cursor: [0, 3]
          });
        });
      });
    });
    describe("the - keybinding", function() {
      beforeEach(function() {
        return set({
          text: "abcdefg\n  abc\n  abc\n"
        });
      });
      describe("from the middle of a line", function() {
        beforeEach(function() {
          return set({
            cursor: [1, 3]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the last character of the previous line", function() {
            return ensure('-', {
              cursor: [0, 0]
            });
          });
        });
        return describe("as a selection", function() {
          return it("deletes the current and previous line", function() {
            return ensure('d -', {
              text: "  abc\n",
              cursor: [0, 2]
            });
          });
        });
      });
      describe("from the first character of a line indented the same as the previous one", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 2]
          });
        });
        describe("as a motion", function() {
          return it("moves to the first character of the previous line (directly above)", function() {
            return ensure('-', {
              cursor: [1, 2]
            });
          });
        });
        return describe("as a selection", function() {
          return it("selects to the first character of the previous line (directly above)", function() {
            return ensure('d -', {
              text: "abcdefg\n"
            });
          });
        });
      });
      describe("from the beginning of a line preceded by an indented line", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 0]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of the previous line", function() {
            return ensure('-', {
              cursor: [1, 2]
            });
          });
        });
        return describe("as a selection", function() {
          return it("selects to the first character of the previous line", function() {
            return ensure('d -', {
              text: "abcdefg\n"
            });
          });
        });
      });
      return describe("with a count", function() {
        beforeEach(function() {
          return set({
            text: "1\n2\n3\n4\n5\n6\n",
            cursor: [4, 0]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of that many lines previous", function() {
            return ensure('3 -', {
              cursor: [1, 0]
            });
          });
        });
        return describe("as a selection", function() {
          return it("deletes the current line plus that many previous lines", function() {
            return ensure('d 3 -', {
              text: "1\n6\n",
              cursor: [1, 0]
            });
          });
        });
      });
    });
    describe("the + keybinding", function() {
      beforeEach(function() {
        return set({
          text_: "__abc\n__abc\nabcdefg\n"
        });
      });
      describe("from the middle of a line", function() {
        beforeEach(function() {
          return set({
            cursor: [1, 3]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of the next line", function() {
            return ensure('+', {
              cursor: [2, 0]
            });
          });
        });
        return describe("as a selection", function() {
          return it("deletes the current and next line", function() {
            return ensure('d +', {
              text: "  abc\n"
            });
          });
        });
      });
      describe("from the first character of a line indented the same as the next one", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 2]
          });
        });
        describe("as a motion", function() {
          return it("moves to the first character of the next line (directly below)", function() {
            return ensure('+', {
              cursor: [1, 2]
            });
          });
        });
        return describe("as a selection", function() {
          return it("selects to the first character of the next line (directly below)", function() {
            return ensure('d +', {
              text: "abcdefg\n"
            });
          });
        });
      });
      describe("from the beginning of a line followed by an indented line", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of the next line", function() {
            return ensure('+', {
              cursor: [1, 2]
            });
          });
        });
        return describe("as a selection", function() {
          return it("selects to the first character of the next line", function() {
            return ensure('d +', {
              text: "abcdefg\n",
              cursor: [0, 0]
            });
          });
        });
      });
      return describe("with a count", function() {
        beforeEach(function() {
          return set({
            text: "1\n2\n3\n4\n5\n6\n",
            cursor: [1, 0]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of that many lines following", function() {
            return ensure('3 +', {
              cursor: [4, 0]
            });
          });
        });
        return describe("as a selection", function() {
          return it("deletes the current line plus that many following lines", function() {
            return ensure('d 3 +', {
              text: "1\n6\n",
              cursor: [1, 0]
            });
          });
        });
      });
    });
    describe("the _ keybinding", function() {
      beforeEach(function() {
        return set({
          text_: "__abc\n__abc\nabcdefg\n"
        });
      });
      describe("from the middle of a line", function() {
        beforeEach(function() {
          return set({
            cursor: [1, 3]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of the current line", function() {
            return ensure('_', {
              cursor: [1, 2]
            });
          });
        });
        return describe("as a selection", function() {
          return it("deletes the current line", function() {
            return ensure('d _', {
              text_: "__abc\nabcdefg\n",
              cursor: [1, 0]
            });
          });
        });
      });
      return describe("with a count", function() {
        beforeEach(function() {
          return set({
            text: "1\n2\n3\n4\n5\n6\n",
            cursor: [1, 0]
          });
        });
        describe("as a motion", function() {
          return it("moves the cursor to the first character of that many lines following", function() {
            return ensure('3 _', {
              cursor: [3, 0]
            });
          });
        });
        return describe("as a selection", function() {
          return it("deletes the current line plus that many following lines", function() {
            return ensure('d 3 _', {
              text: "1\n5\n6\n",
              cursor: [1, 0]
            });
          });
        });
      });
    });
    describe("the enter keybinding", function() {
      var startingText;
      startingText = "  abc\n  abc\nabcdefg\n";
      return describe("from the middle of a line", function() {
        var startingCursorPosition;
        startingCursorPosition = [1, 3];
        describe("as a motion", function() {
          return it("acts the same as the + keybinding", function() {
            var referenceCursorPosition;
            set({
              text: startingText,
              cursor: startingCursorPosition
            });
            keystroke('+');
            referenceCursorPosition = editor.getCursorScreenPosition();
            set({
              text: startingText,
              cursor: startingCursorPosition
            });
            return ensure('enter', {
              cursor: referenceCursorPosition
            });
          });
        });
        return describe("as a selection", function() {
          return it("acts the same as the + keybinding", function() {
            var referenceCursorPosition, referenceText;
            set({
              text: startingText,
              cursor: startingCursorPosition
            });
            keystroke('d +');
            referenceText = editor.getText();
            referenceCursorPosition = editor.getCursorScreenPosition();
            set({
              text: startingText,
              cursor: startingCursorPosition
            });
            return ensure('d enter', {
              text: referenceText,
              cursor: referenceCursorPosition
            });
          });
        });
      });
    });
    describe("the gg keybinding with stayOnVerticalMotion = false", function() {
      beforeEach(function() {
        settings.set('stayOnVerticalMotion', false);
        return set({
          text: " 1abc\n 2\n3\n",
          cursor: [0, 2]
        });
      });
      describe("as a motion", function() {
        describe("in normal mode", function() {
          it("moves the cursor to the beginning of the first line", function() {
            set({
              cursor: [2, 0]
            });
            return ensure('g g', {
              cursor: [0, 1]
            });
          });
          return it("move to same position if its on first line and first char", function() {
            return ensure('g g', {
              cursor: [0, 1]
            });
          });
        });
        describe("in linewise visual mode", function() {
          return it("selects to the first line in the file", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('V g g', {
              selectedText: " 1abc\n 2\n",
              cursor: [0, 0]
            });
          });
        });
        return describe("in characterwise visual mode", function() {
          beforeEach(function() {
            return set({
              cursor: [1, 1]
            });
          });
          return it("selects to the first line in the file", function() {
            return ensure('v g g', {
              selectedText: "1abc\n 2",
              cursor: [0, 1]
            });
          });
        });
      });
      return describe("when count specified", function() {
        describe("in normal mode", function() {
          return it("moves the cursor to first char of a specified line", function() {
            return ensure('2 g g', {
              cursor: [1, 1]
            });
          });
        });
        describe("in linewise visual motion", function() {
          return it("selects to a specified line", function() {
            set({
              cursor: [2, 0]
            });
            return ensure('V 2 g g', {
              selectedText: " 2\n3\n",
              cursor: [1, 0]
            });
          });
        });
        return describe("in characterwise visual motion", function() {
          return it("selects to a first character of specified line", function() {
            set({
              cursor: [2, 0]
            });
            return ensure('v 2 g g', {
              selectedText: "2\n3",
              cursor: [1, 1]
            });
          });
        });
      });
    });
    describe("the g_ keybinding", function() {
      beforeEach(function() {
        return set({
          text_: "1__\n    2__\n 3abc\n_"
        });
      });
      describe("as a motion", function() {
        it("moves the cursor to the last nonblank character", function() {
          set({
            cursor: [1, 0]
          });
          return ensure('g _', {
            cursor: [1, 4]
          });
        });
        return it("will move the cursor to the beginning of the line if necessary", function() {
          set({
            cursor: [0, 2]
          });
          return ensure('g _', {
            cursor: [0, 0]
          });
        });
      });
      describe("as a repeated motion", function() {
        return it("moves the cursor downward and outward", function() {
          set({
            cursor: [0, 0]
          });
          return ensure('2 g _', {
            cursor: [1, 4]
          });
        });
      });
      return describe("as a selection", function() {
        return it("selects the current line excluding whitespace", function() {
          set({
            cursor: [1, 2]
          });
          return ensure('v 2 g _', {
            selectedText: "  2  \n 3abc"
          });
        });
      });
    });
    describe("the G keybinding (stayOnVerticalMotion = false)", function() {
      beforeEach(function() {
        settings.set('stayOnVerticalMotion', false);
        return set({
          text_: "1\n____2\n_3abc\n_",
          cursor: [0, 2]
        });
      });
      describe("as a motion", function() {
        return it("moves the cursor to the last line after whitespace", function() {
          return ensure('G', {
            cursor: [3, 0]
          });
        });
      });
      describe("as a repeated motion", function() {
        return it("moves the cursor to a specified line", function() {
          return ensure('2 G', {
            cursor: [1, 4]
          });
        });
      });
      return describe("as a selection", function() {
        return it("selects to the last line in the file", function() {
          set({
            cursor: [1, 0]
          });
          return ensure('v G', {
            selectedText: "    2\n 3abc\n ",
            cursor: [3, 1]
          });
        });
      });
    });
    describe("the N% keybinding", function() {
      beforeEach(function() {
        var i, results;
        return set({
          text: (function() {
            results = [];
            for (i = 0; i <= 999; i++){ results.push(i); }
            return results;
          }).apply(this).join("\n"),
          cursor: [0, 0]
        });
      });
      return describe("put cursor on line specified by percent", function() {
        it("50%", function() {
          return ensure('5 0 %', {
            cursor: [499, 0]
          });
        });
        it("30%", function() {
          return ensure('3 0 %', {
            cursor: [299, 0]
          });
        });
        it("100%", function() {
          return ensure('1 0 0 %', {
            cursor: [999, 0]
          });
        });
        return it("120%", function() {
          return ensure('1 2 0 %', {
            cursor: [999, 0]
          });
        });
      });
    });
    describe("the H, M, L keybinding( stayOnVerticalMotio = false )", function() {
      var eel;
      eel = [][0];
      beforeEach(function() {
        settings.set('stayOnVerticalMotion', false);
        eel = editorElement;
        return set({
          text: "  1\n2\n3\n4\n  5\n6\n7\n8\n9\n  10",
          cursor: [8, 0]
        });
      });
      describe("the H keybinding", function() {
        it("moves the cursor to the non-blank-char on first row if visible", function() {
          spyOn(eel, 'getFirstVisibleScreenRow').andReturn(0);
          return ensure('H', {
            cursor: [0, 2]
          });
        });
        it("moves the cursor to the non-blank-char on first visible row plus scroll offset", function() {
          spyOn(eel, 'getFirstVisibleScreenRow').andReturn(2);
          return ensure('H', {
            cursor: [4, 2]
          });
        });
        return it("respects counts", function() {
          spyOn(eel, 'getFirstVisibleScreenRow').andReturn(0);
          return ensure('4 H', {
            cursor: [3, 0]
          });
        });
      });
      describe("the L keybinding", function() {
        it("moves the cursor to non-blank-char on last row if visible", function() {
          spyOn(editor, 'getLastVisibleScreenRow').andReturn(9);
          return ensure('L', {
            cursor: [9, 2]
          });
        });
        it("moves the cursor to the first visible row plus offset", function() {
          spyOn(editor, 'getLastVisibleScreenRow').andReturn(7);
          return ensure('L', {
            cursor: [4, 2]
          });
        });
        return it("respects counts", function() {
          spyOn(editor, 'getLastVisibleScreenRow').andReturn(9);
          return ensure('3 L', {
            cursor: [7, 0]
          });
        });
      });
      return describe("the M keybinding", function() {
        beforeEach(function() {
          spyOn(eel, 'getFirstVisibleScreenRow').andReturn(0);
          return spyOn(editor, 'getLastVisibleScreenRow').andReturn(10);
        });
        return it("moves the cursor to the non-blank-char of middle of screen", function() {
          return ensure('M', {
            cursor: [4, 2]
          });
        });
      });
    });
    describe("stayOnVerticalMotion setting", function() {
      beforeEach(function() {
        settings.set('stayOnVerticalMotion', true);
        return set({
          text: "  0 000000000000\n  1 111111111111\n2 222222222222\n",
          cursor: [2, 10]
        });
      });
      describe("gg, G, N%", function() {
        return it("go to row with keep column and respect cursor.goalColum", function() {
          ensure('g g', {
            cursor: [0, 10]
          });
          ensure('$', {
            cursor: [0, 15]
          });
          ensure('G', {
            cursor: [2, 13]
          });
          expect(editor.getLastCursor().goalColumn).toBe(2e308);
          ensure('1 %', {
            cursor: [0, 15]
          });
          expect(editor.getLastCursor().goalColumn).toBe(2e308);
          ensure('1 0 h', {
            cursor: [0, 5]
          });
          ensure('5 0 %', {
            cursor: [1, 5]
          });
          return ensure('1 0 0 %', {
            cursor: [2, 5]
          });
        });
      });
      return describe("H, M, L", function() {
        beforeEach(function() {
          spyOn(editorElement, 'getFirstVisibleScreenRow').andReturn(0);
          return spyOn(editor, 'getLastVisibleScreenRow').andReturn(3);
        });
        return it("go to row with keep column and respect cursor.goalColum", function() {
          ensure('H', {
            cursor: [0, 10]
          });
          ensure('M', {
            cursor: [1, 10]
          });
          ensure('L', {
            cursor: [2, 10]
          });
          ensure('$', {
            cursor: [2, 13]
          });
          expect(editor.getLastCursor().goalColumn).toBe(2e308);
          ensure('H', {
            cursor: [0, 15]
          });
          ensure('M', {
            cursor: [1, 15]
          });
          ensure('L', {
            cursor: [2, 13]
          });
          return expect(editor.getLastCursor().goalColumn).toBe(2e308);
        });
      });
    });
    describe('the mark keybindings', function() {
      beforeEach(function() {
        return set({
          text: "  12\n    34\n56\n",
          cursor: [0, 1]
        });
      });
      it('moves to the beginning of the line of a mark', function() {
        set({
          cursor: [1, 1]
        });
        keystroke('m a');
        set({
          cursor: [0, 0]
        });
        return ensure("' a", {
          cursor: [1, 4]
        });
      });
      it('moves literally to a mark', function() {
        set({
          cursor: [1, 2]
        });
        keystroke('m a');
        set({
          cursor: [0, 0]
        });
        return ensure('` a', {
          cursor: [1, 2]
        });
      });
      it('deletes to a mark by line', function() {
        set({
          cursor: [1, 5]
        });
        keystroke('m a');
        set({
          cursor: [0, 0]
        });
        return ensure("d ' a", {
          text: '56\n'
        });
      });
      it('deletes before to a mark literally', function() {
        set({
          cursor: [1, 5]
        });
        keystroke('m a');
        set({
          cursor: [0, 2]
        });
        return ensure('d ` a', {
          text: '  4\n56\n'
        });
      });
      it('deletes after to a mark literally', function() {
        set({
          cursor: [1, 5]
        });
        keystroke('m a');
        set({
          cursor: [2, 1]
        });
        return ensure('d ` a', {
          text: '  12\n    36\n'
        });
      });
      return it('moves back to previous', function() {
        set({
          cursor: [1, 5]
        });
        keystroke('` `');
        set({
          cursor: [2, 1]
        });
        return ensure('` `', {
          cursor: [1, 5]
        });
      });
    });
    describe("jump command update ` and ' mark", function() {
      var ensureJumpAndBack, ensureJumpAndBackLinewise, ensureJumpMark;
      ensureJumpMark = function(value) {
        ensure({
          mark: {
            "`": value
          }
        });
        return ensure({
          mark: {
            "'": value
          }
        });
      };
      ensureJumpAndBack = function(keystroke, option) {
        var afterMove, beforeMove;
        afterMove = option.cursor;
        beforeMove = editor.getCursorBufferPosition();
        ensure(keystroke, {
          cursor: afterMove
        });
        ensureJumpMark(beforeMove);
        expect(beforeMove.isEqual(afterMove)).toBe(false);
        ensure("` `", {
          cursor: beforeMove
        });
        return ensureJumpMark(afterMove);
      };
      ensureJumpAndBackLinewise = function(keystroke, option) {
        var afterMove, beforeMove;
        afterMove = option.cursor;
        beforeMove = editor.getCursorBufferPosition();
        expect(beforeMove.column).not.toBe(0);
        ensure(keystroke, {
          cursor: afterMove
        });
        ensureJumpMark(beforeMove);
        expect(beforeMove.isEqual(afterMove)).toBe(false);
        ensure("' '", {
          cursor: [beforeMove.row, 0]
        });
        return ensureJumpMark(afterMove);
      };
      beforeEach(function() {
        var i, len, mark, ref2, ref3;
        ref2 = "`'";
        for (i = 0, len = ref2.length; i < len; i++) {
          mark = ref2[i];
          if ((ref3 = vimState.mark.marks[mark]) != null) {
            ref3.destroy();
          }
          vimState.mark.marks[mark] = null;
        }
        return set({
          text: "0: oo 0\n1: 1111\n2: 2222\n3: oo 3\n4: 4444\n5: oo 5",
          cursor: [1, 0]
        });
      });
      describe("initial state", function() {
        return it("return [0, 0]", function() {
          ensure({
            mark: {
              "'": [0, 0]
            }
          });
          return ensure({
            mark: {
              "`": [0, 0]
            }
          });
        });
      });
      return describe("jump motion in normal-mode", function() {
        var initial;
        initial = [3, 3];
        beforeEach(function() {
          var component;
          jasmine.attachToDOM(getView(atom.workspace));
          if (editorElement.measureDimensions != null) {
            component = editor.component;
            component.element.style.height = component.getLineHeight() * editor.getLineCount() + 'px';
            editorElement.measureDimensions();
          }
          ensure({
            mark: {
              "'": [0, 0]
            }
          });
          ensure({
            mark: {
              "`": [0, 0]
            }
          });
          return set({
            cursor: initial
          });
        });
        it("G jump&back", function() {
          return ensureJumpAndBack('G', {
            cursor: [5, 3]
          });
        });
        it("g g jump&back", function() {
          return ensureJumpAndBack("g g", {
            cursor: [0, 3]
          });
        });
        it("100 % jump&back", function() {
          return ensureJumpAndBack("1 0 0 %", {
            cursor: [5, 3]
          });
        });
        it(") jump&back", function() {
          return ensureJumpAndBack(")", {
            cursor: [5, 6]
          });
        });
        it("( jump&back", function() {
          return ensureJumpAndBack("(", {
            cursor: [0, 0]
          });
        });
        it("] jump&back", function() {
          return ensureJumpAndBack("]", {
            cursor: [5, 3]
          });
        });
        it("[ jump&back", function() {
          return ensureJumpAndBack("[", {
            cursor: [0, 3]
          });
        });
        it("} jump&back", function() {
          return ensureJumpAndBack("}", {
            cursor: [5, 6]
          });
        });
        it("{ jump&back", function() {
          return ensureJumpAndBack("{", {
            cursor: [0, 0]
          });
        });
        it("L jump&back", function() {
          return ensureJumpAndBack("L", {
            cursor: [5, 3]
          });
        });
        it("H jump&back", function() {
          return ensureJumpAndBack("H", {
            cursor: [0, 3]
          });
        });
        it("M jump&back", function() {
          return ensureJumpAndBack("M", {
            cursor: [2, 3]
          });
        });
        it("* jump&back", function() {
          return ensureJumpAndBack("*", {
            cursor: [5, 3]
          });
        });
        it("Sharp(#) jump&back", function() {
          return ensureJumpAndBack('#', {
            cursor: [0, 3]
          });
        });
        it("/ jump&back", function() {
          return ensureJumpAndBack('/ oo enter', {
            cursor: [5, 3]
          });
        });
        it("? jump&back", function() {
          return ensureJumpAndBack('? oo enter', {
            cursor: [0, 3]
          });
        });
        it("n jump&back", function() {
          set({
            cursor: [0, 0]
          });
          ensure('/ oo enter', {
            cursor: [0, 3]
          });
          ensureJumpAndBack("n", {
            cursor: [3, 3]
          });
          return ensureJumpAndBack("N", {
            cursor: [5, 3]
          });
        });
        it("N jump&back", function() {
          set({
            cursor: [0, 0]
          });
          ensure('? oo enter', {
            cursor: [5, 3]
          });
          ensureJumpAndBack("n", {
            cursor: [3, 3]
          });
          return ensureJumpAndBack("N", {
            cursor: [0, 3]
          });
        });
        it("G jump&back linewise", function() {
          return ensureJumpAndBackLinewise('G', {
            cursor: [5, 3]
          });
        });
        it("g g jump&back linewise", function() {
          return ensureJumpAndBackLinewise("g g", {
            cursor: [0, 3]
          });
        });
        it("100 % jump&back linewise", function() {
          return ensureJumpAndBackLinewise("1 0 0 %", {
            cursor: [5, 3]
          });
        });
        it(") jump&back linewise", function() {
          return ensureJumpAndBackLinewise(")", {
            cursor: [5, 6]
          });
        });
        it("( jump&back linewise", function() {
          return ensureJumpAndBackLinewise("(", {
            cursor: [0, 0]
          });
        });
        it("] jump&back linewise", function() {
          return ensureJumpAndBackLinewise("]", {
            cursor: [5, 3]
          });
        });
        it("[ jump&back linewise", function() {
          return ensureJumpAndBackLinewise("[", {
            cursor: [0, 3]
          });
        });
        it("} jump&back linewise", function() {
          return ensureJumpAndBackLinewise("}", {
            cursor: [5, 6]
          });
        });
        it("{ jump&back linewise", function() {
          return ensureJumpAndBackLinewise("{", {
            cursor: [0, 0]
          });
        });
        it("L jump&back linewise", function() {
          return ensureJumpAndBackLinewise("L", {
            cursor: [5, 3]
          });
        });
        it("H jump&back linewise", function() {
          return ensureJumpAndBackLinewise("H", {
            cursor: [0, 3]
          });
        });
        it("M jump&back linewise", function() {
          return ensureJumpAndBackLinewise("M", {
            cursor: [2, 3]
          });
        });
        return it("* jump&back linewise", function() {
          return ensureJumpAndBackLinewise("*", {
            cursor: [5, 3]
          });
        });
      });
    });
    describe('the V keybinding', function() {
      var text;
      text = [][0];
      beforeEach(function() {
        text = new TextData("01\n002\n0003\n00004\n000005\n");
        return set({
          text: text.getRaw(),
          cursor: [1, 1]
        });
      });
      it("selects down a line", function() {
        return ensure('V j j', {
          selectedText: text.getLines([1, 2, 3])
        });
      });
      return it("selects up a line", function() {
        return ensure('V k', {
          selectedText: text.getLines([0, 1])
        });
      });
    });
    describe('MoveTo(Previous|Next)Fold(Start|End)', function() {
      beforeEach(function() {
        waitsForPromise(function() {
          return atom.packages.activatePackage('language-coffee-script');
        });
        getVimState('sample.coffee', function(state, vim) {
          editor = state.editor, editorElement = state.editorElement;
          return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
        });
        return runs(function() {
          return atom.keymaps.add("test", {
            'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
              '[ [': 'vim-mode-plus:move-to-previous-fold-start',
              '] [': 'vim-mode-plus:move-to-next-fold-start',
              '[ ]': 'vim-mode-plus:move-to-previous-fold-end',
              '] ]': 'vim-mode-plus:move-to-next-fold-end'
            }
          });
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage('language-coffee-script');
      });
      describe("MoveToPreviousFoldStart", function() {
        beforeEach(function() {
          return set({
            cursor: [30, 0]
          });
        });
        return it("move to first char of previous fold start row", function() {
          ensure('[ [', {
            cursor: [22, 6]
          });
          ensure('[ [', {
            cursor: [20, 6]
          });
          ensure('[ [', {
            cursor: [18, 4]
          });
          ensure('[ [', {
            cursor: [9, 2]
          });
          return ensure('[ [', {
            cursor: [8, 0]
          });
        });
      });
      describe("MoveToNextFoldStart", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        return it("move to first char of next fold start row", function() {
          ensure('] [', {
            cursor: [8, 0]
          });
          ensure('] [', {
            cursor: [9, 2]
          });
          ensure('] [', {
            cursor: [18, 4]
          });
          ensure('] [', {
            cursor: [20, 6]
          });
          return ensure('] [', {
            cursor: [22, 6]
          });
        });
      });
      describe("MoveToPrevisFoldEnd", function() {
        beforeEach(function() {
          return set({
            cursor: [30, 0]
          });
        });
        return it("move to first char of previous fold end row", function() {
          ensure('[ ]', {
            cursor: [28, 2]
          });
          ensure('[ ]', {
            cursor: [25, 4]
          });
          ensure('[ ]', {
            cursor: [23, 8]
          });
          return ensure('[ ]', {
            cursor: [21, 8]
          });
        });
      });
      return describe("MoveToNextFoldEnd", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0]
          });
        });
        return it("move to first char of next fold end row", function() {
          ensure('] ]', {
            cursor: [21, 8]
          });
          ensure('] ]', {
            cursor: [23, 8]
          });
          ensure('] ]', {
            cursor: [25, 4]
          });
          return ensure('] ]', {
            cursor: [28, 2]
          });
        });
      });
    });
    describe('MoveTo(Previous|Next)String', function() {
      beforeEach(function() {
        return atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g s': 'vim-mode-plus:move-to-next-string',
            'g S': 'vim-mode-plus:move-to-previous-string'
          }
        });
      });
      describe('editor for softTab', function() {
        var pack;
        pack = 'language-coffee-script';
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage(pack);
          });
          return runs(function() {
            return set({
              text: "disposable?.dispose()\ndisposable = atom.commands.add 'atom-workspace',\n  'check-up': -> fun('backward')\n  'check-down': -> fun('forward')\n\n",
              grammar: 'source.coffee'
            });
          });
        });
        afterEach(function() {
          return atom.packages.deactivatePackage(pack);
        });
        it("move to next string", function() {
          set({
            cursor: [0, 0]
          });
          ensure('g s', {
            cursor: [1, 31]
          });
          ensure('g s', {
            cursor: [2, 2]
          });
          ensure('g s', {
            cursor: [2, 21]
          });
          ensure('g s', {
            cursor: [3, 2]
          });
          return ensure('g s', {
            cursor: [3, 23]
          });
        });
        it("move to previous string", function() {
          set({
            cursor: [4, 0]
          });
          ensure('g S', {
            cursor: [3, 23]
          });
          ensure('g S', {
            cursor: [3, 2]
          });
          ensure('g S', {
            cursor: [2, 21]
          });
          ensure('g S', {
            cursor: [2, 2]
          });
          return ensure('g S', {
            cursor: [1, 31]
          });
        });
        return it("support count", function() {
          set({
            cursor: [0, 0]
          });
          ensure('3 g s', {
            cursor: [2, 21]
          });
          return ensure('3 g S', {
            cursor: [1, 31]
          });
        });
      });
      return describe('editor for hardTab', function() {
        var pack;
        pack = 'language-go';
        beforeEach(function() {
          waitsForPromise(function() {
            return atom.packages.activatePackage(pack);
          });
          return getVimState('sample.go', function(state, vimEditor) {
            editor = state.editor, editorElement = state.editorElement;
            return set = vimEditor.set, ensure = vimEditor.ensure, keystroke = vimEditor.keystroke, vimEditor;
          });
        });
        afterEach(function() {
          return atom.packages.deactivatePackage(pack);
        });
        it("move to next string", function() {
          set({
            cursorScreen: [0, 0]
          });
          ensure('g s', {
            cursorScreen: [2, 7]
          });
          ensure('g s', {
            cursorScreen: [3, 7]
          });
          ensure('g s', {
            cursorScreen: [8, 8]
          });
          ensure('g s', {
            cursorScreen: [9, 8]
          });
          ensure('g s', {
            cursorScreen: [11, 20]
          });
          ensure('g s', {
            cursorScreen: [12, 15]
          });
          ensure('g s', {
            cursorScreen: [13, 15]
          });
          ensure('g s', {
            cursorScreen: [15, 15]
          });
          return ensure('g s', {
            cursorScreen: [16, 15]
          });
        });
        return it("move to previous string", function() {
          set({
            cursorScreen: [18, 0]
          });
          ensure('g S', {
            cursorScreen: [16, 15]
          });
          ensure('g S', {
            cursorScreen: [15, 15]
          });
          ensure('g S', {
            cursorScreen: [13, 15]
          });
          ensure('g S', {
            cursorScreen: [12, 15]
          });
          ensure('g S', {
            cursorScreen: [11, 20]
          });
          ensure('g S', {
            cursorScreen: [9, 8]
          });
          ensure('g S', {
            cursorScreen: [8, 8]
          });
          ensure('g S', {
            cursorScreen: [3, 7]
          });
          return ensure('g S', {
            cursorScreen: [2, 7]
          });
        });
      });
    });
    describe('MoveTo(Previous|Next)Number', function() {
      var pack;
      pack = 'language-coffee-script';
      beforeEach(function() {
        atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'g n': 'vim-mode-plus:move-to-next-number',
            'g N': 'vim-mode-plus:move-to-previous-number'
          }
        });
        waitsForPromise(function() {
          return atom.packages.activatePackage(pack);
        });
        runs(function() {
          return set({
            grammar: 'source.coffee'
          });
        });
        return set({
          text: "num1 = 1\narr1 = [1, 101, 1001]\narr2 = [\"1\", \"2\", \"3\"]\nnum2 = 2\nfun(\"1\", 2, 3)\n\n"
        });
      });
      afterEach(function() {
        return atom.packages.deactivatePackage(pack);
      });
      it("move to next number", function() {
        set({
          cursor: [0, 0]
        });
        ensure('g n', {
          cursor: [0, 7]
        });
        ensure('g n', {
          cursor: [1, 8]
        });
        ensure('g n', {
          cursor: [1, 11]
        });
        ensure('g n', {
          cursor: [1, 16]
        });
        ensure('g n', {
          cursor: [3, 7]
        });
        ensure('g n', {
          cursor: [4, 9]
        });
        return ensure('g n', {
          cursor: [4, 12]
        });
      });
      it("move to previous number", function() {
        set({
          cursor: [5, 0]
        });
        ensure('g N', {
          cursor: [4, 12]
        });
        ensure('g N', {
          cursor: [4, 9]
        });
        ensure('g N', {
          cursor: [3, 7]
        });
        ensure('g N', {
          cursor: [1, 16]
        });
        ensure('g N', {
          cursor: [1, 11]
        });
        ensure('g N', {
          cursor: [1, 8]
        });
        return ensure('g N', {
          cursor: [0, 7]
        });
      });
      return it("support count", function() {
        set({
          cursor: [0, 0]
        });
        ensure('5 g n', {
          cursor: [3, 7]
        });
        return ensure('3 g N', {
          cursor: [1, 8]
        });
      });
    });
    return describe('subword motion', function() {
      beforeEach(function() {
        return atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus:not(.insert-mode)': {
            'q': 'vim-mode-plus:move-to-next-subword',
            'Q': 'vim-mode-plus:move-to-previous-subword',
            'ctrl-e': 'vim-mode-plus:move-to-end-of-subword'
          }
        });
      });
      it("move to next/previous subword", function() {
        set({
          textC: "|camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camel|Case => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase| => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase =>| (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (|with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with |special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special|) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) |ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) Cha|RActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaR|ActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActer|Rs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\n|dash-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash|-case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-|case\n\nsnake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\n|snake_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake|_case_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case|_word\n"
        });
        ensure('q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_wor|d\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case|_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake|_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\n|snake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-|case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash|-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActerRs\n\n|dash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaRActer|Rs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) ChaR|ActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) Cha|RActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special) |ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with special|) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (with |special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase => (|with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase =>| (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camelCase| => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('Q', {
          textC: "camel|Case => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        return ensure('Q', {
          textC: "|camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
      });
      return it("move-to-end-of-subword", function() {
        set({
          textC: "|camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "came|lCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCas|e => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase =|> (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => |(with special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (wit|h special) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with specia|l) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special|) ChaRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) Ch|aRActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) Cha|RActerRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActe|rRs\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerR|s\n\ndash-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndas|h-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash|-case\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-cas|e\n\nsnake_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnak|e_case_word\n"
        });
        ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_cas|e_word\n"
        });
        return ensure('ctrl-e', {
          textC: "camelCase => (with special) ChaRActerRs\n\ndash-case\n\nsnake_case_wor|d\n"
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvbW90aW9uLWdlbmVyYWwtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLFFBQVMsT0FBQSxDQUFRLE1BQVI7O0VBQ1YsTUFBNkMsT0FBQSxDQUFRLGVBQVIsQ0FBN0MsRUFBQyw2QkFBRCxFQUFjLHVCQUFkLEVBQXdCLHVCQUF4QixFQUFrQzs7RUFDbEMsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCwwQkFBQSxHQUE2QixTQUFDLE1BQUQsRUFBUyxpQkFBVDtBQUMzQixRQUFBO0lBQUEsTUFBTSxDQUFDLG1CQUFQLENBQTJCLENBQTNCO0lBQ0EsU0FBQSxHQUFZLE1BQU0sQ0FBQztJQUNuQixTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxLQUF4QixHQUNFLFNBQVMsQ0FBQyx1QkFBVixDQUFBLENBQUEsR0FBc0MsaUJBQUEsR0FBb0IsU0FBUyxDQUFDLFlBQVksQ0FBQyxrQkFBakYsR0FBc0c7QUFDeEcsV0FBTyxTQUFTLENBQUMsb0JBQVYsQ0FBQTtFQUxvQjs7RUFPN0IsUUFBQSxDQUFTLGdCQUFULEVBQTJCLFNBQUE7QUFDekIsUUFBQTtJQUFBLE9BQTRELEVBQTVELEVBQUMsYUFBRCxFQUFNLGdCQUFOLEVBQWMsbUJBQWQsRUFBeUIsZ0JBQXpCLEVBQWlDLHVCQUFqQyxFQUFnRDtJQUVoRCxVQUFBLENBQVcsU0FBQTthQUNULFdBQUEsQ0FBWSxTQUFDLEtBQUQsRUFBUSxJQUFSO1FBQ1YsUUFBQSxHQUFXO1FBQ1Ysd0JBQUQsRUFBUztlQUNSLGNBQUQsRUFBTSxvQkFBTixFQUFjLDBCQUFkLEVBQTJCO01BSGpCLENBQVo7SUFEUyxDQUFYO0lBTUEsUUFBQSxDQUFTLGdCQUFULEVBQTJCLFNBQUE7QUFDekIsVUFBQTtNQUFBLElBQUEs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LEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxHQUFQLEVBQVk7VUFBQSxLQUFBLEVBQU8sNEVBQVA7U0FBWjtRQUNBLE1BQUEsQ0FBTyxH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Olsie1BvaW50fSA9IHJlcXVpcmUgJ2F0b20nXG57Z2V0VmltU3RhdGUsIGRpc3BhdGNoLCBUZXh0RGF0YSwgZ2V0Vmlld30gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbnNldEVkaXRvcldpZHRoSW5DaGFyYWN0ZXJzID0gKGVkaXRvciwgd2lkdGhJbkNoYXJhY3RlcnMpIC0+XG4gIGVkaXRvci5zZXREZWZhdWx0Q2hhcldpZHRoKDEpXG4gIGNvbXBvbmVudCA9IGVkaXRvci5jb21wb25lbnRcbiAgY29tcG9uZW50LmVsZW1lbnQuc3R5bGUud2lkdGggPVxuICAgIGNvbXBvbmVudC5nZXRHdXR0ZXJDb250YWluZXJXaWR0aCgpICsgd2lkdGhJbkNoYXJhY3RlcnMgKiBjb21wb25lbnQubWVhc3VyZW1lbnRzLmJhc2VDaGFyYWN0ZXJXaWR0aCArIFwicHhcIlxuICByZXR1cm4gY29tcG9uZW50LmdldE5leHRVcGRhdGVQcm9taXNlKClcblxuZGVzY3JpYmUgXCJNb3Rpb24gZ2VuZXJhbFwiLCAtPlxuICBbc2V0LCBlbnN1cmUsIGtleXN0cm9rZSwgZWRpdG9yLCBlZGl0b3JFbGVtZW50LCB2aW1TdGF0ZV0gPSBbXVxuXG4gIGJlZm9yZUVhY2ggLT5cbiAgICBnZXRWaW1TdGF0ZSAoc3RhdGUsIF92aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlICMgdG8gcmVmZXIgYXMgdmltU3RhdGUgbGF0ZXIuXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSBfdmltXG5cbiAgZGVzY3JpYmUgXCJzaW1wbGUgbW90aW9uc1wiLCAtPlxuICAgIHRleHQgPSBudWxsXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgdGV4dCA9IG5ldyBUZXh0RGF0YSBcIlwiXCJcbiAgICAgICAgMTIzNDVcbiAgICAgICAgYWJjZFxuICAgICAgICBBQkNERVxcblxuICAgICAgICBcIlwiXCJcblxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IHRleHQuZ2V0UmF3KClcbiAgICAgICAgY3Vyc29yOiBbMSwgMV1cblxuICAgIGRlc2NyaWJlIFwidGhlIGgga2V5YmluZGluZ1wiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgbGVmdCwgYnV0IG5vdCB0byB0aGUgcHJldmlvdXMgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnaCcsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICdoJywgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIHByZXZpb3VzIGxpbmUgaWYgd3JhcExlZnRSaWdodE1vdGlvbiBpcyB0cnVlXCIsIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJywgdHJ1ZSlcbiAgICAgICAgICBlbnN1cmUgJ2ggaCcsIGN1cnNvcjogWzAsIDRdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRoZSBjaGFyYWN0ZXIgdG8gdGhlIGxlZnRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ3kgaCcsXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdhJ1xuXG4gICAgZGVzY3JpYmUgXCJ0aGUgaiBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgZG93biwgYnV0IG5vdCB0byB0aGUgZW5kIG9mIHRoZSBsYXN0IGxpbmVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdqJywgY3Vyc29yOiBbMiwgMV1cbiAgICAgICAgZW5zdXJlICdqJywgY3Vyc29yOiBbMiwgMV1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIGxpbmUsIG5vdCBwYXN0IGl0XCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgICBlbnN1cmUgJ2onLCBjdXJzb3I6IFsxLCAzXVxuXG4gICAgICBpdCBcInJlbWVtYmVycyB0aGUgY29sdW1uIGl0IHdhcyBpbiBhZnRlciBtb3ZpbmcgdG8gc2hvcnRlciBsaW5lXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuICAgICAgICBlbnN1cmUgJ2onLCBjdXJzb3I6IFsxLCAzXVxuICAgICAgICBlbnN1cmUgJ2onLCBjdXJzb3I6IFsyLCA0XVxuXG4gICAgICBpdCBcIm5ldmVyIGdvIHBhc3QgbGFzdCBuZXdsaW5lXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnMSAwIGonLCBjdXJzb3I6IFsyLCAxXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGVuc3VyZSAndicsIGN1cnNvcjogWzEsIDJdLCBzZWxlY3RlZFRleHQ6ICdiJ1xuXG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciBkb3duXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdqJywgY3Vyc29yOiBbMiwgMl0sIHNlbGVjdGVkVGV4dDogXCJiY2RcXG5BQlwiXG5cbiAgICAgICAgaXQgXCJkb2Vzbid0IGdvIG92ZXIgYWZ0ZXIgdGhlIGxhc3QgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnaicsIGN1cnNvcjogWzIsIDJdLCBzZWxlY3RlZFRleHQ6IFwiYmNkXFxuQUJcIlxuXG4gICAgICAgIGl0IFwia2VlcCBzYW1lIGNvbHVtbihnb2FsQ29sdW1uKSBldmVuIGFmdGVyIGFjcm9zcyB0aGUgZW1wdHkgbGluZVwiLCAtPlxuICAgICAgICAgIGtleXN0cm9rZSAnZXNjYXBlJ1xuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIGFiY2RlZmdcblxuICAgICAgICAgICAgICBhYmNkZWZnXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgICBlbnN1cmUgJ3YnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgICAgIGVuc3VyZSAnaiBqJywgY3Vyc29yOiBbMiwgNF0sIHNlbGVjdGVkVGV4dDogXCJkZWZnXFxuXFxuYWJjZFwiXG5cbiAgICAgICAgIyBbRklYTUVdIHRoZSBwbGFjZSBvZiB0aGlzIHNwZWMgaXMgbm90IGFwcHJvcHJpYXRlLlxuICAgICAgICBpdCBcIm9yaWdpbmFsIHZpc3VhbCBsaW5lIHJlbWFpbnMgd2hlbiBqayBhY3Jvc3Mgb3JpZ25hbCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgICB0ZXh0ID0gbmV3IFRleHREYXRhIFwiXCJcIlxuICAgICAgICAgICAgbGluZTBcbiAgICAgICAgICAgIGxpbmUxXG4gICAgICAgICAgICBsaW5lMlxcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiB0ZXh0LmdldFJhdygpXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuXG4gICAgICAgICAgZW5zdXJlICdWJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFsxXSlcbiAgICAgICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzEsIDJdKVxuICAgICAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMV0pXG4gICAgICAgICAgZW5zdXJlICdrJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLCAxXSlcbiAgICAgICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzFdKVxuICAgICAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMSwgMl0pXG5cbiAgICBkZXNjcmliZSBcIm1vdmUtZG93bi13cmFwLCBtb3ZlLXVwLXdyYXBcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAgICdrJzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS11cC13cmFwJ1xuICAgICAgICAgICAgJ2onOiAndmltLW1vZGUtcGx1czptb3ZlLWRvd24td3JhcCdcblxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBoZWxsb1xuICAgICAgICAgIGhlbGxvXG4gICAgICAgICAgaGVsbG9cbiAgICAgICAgICBoZWxsb1xcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgZGVzY3JpYmUgJ21vdmUtZG93bi13cmFwJywgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFszLCAxXVxuICAgICAgICBpdCBcIm1vdmUgZG93biB3aXRoIHdyYXdwXCIsIC0+IGVuc3VyZSAnaicsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGl0IFwibW92ZSBkb3duIHdpdGggd3Jhd3BcIiwgLT4gZW5zdXJlICcyIGonLCBjdXJzb3I6IFsxLCAxXVxuICAgICAgICBpdCBcIm1vdmUgZG93biB3aXRoIHdyYXdwXCIsIC0+IGVuc3VyZSAnNCBqJywgY3Vyc29yOiBbMywgMV1cblxuICAgICAgZGVzY3JpYmUgJ21vdmUtdXAtd3JhcCcsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV1cblxuICAgICAgICBpdCBcIm1vdmUgZG93biB3aXRoIHdyYXdwXCIsIC0+IGVuc3VyZSAnaycsIGN1cnNvcjogWzMsIDFdXG4gICAgICAgIGl0IFwibW92ZSBkb3duIHdpdGggd3Jhd3BcIiwgLT4gZW5zdXJlICcyIGsnLCBjdXJzb3I6IFsyLCAxXVxuICAgICAgICBpdCBcIm1vdmUgZG93biB3aXRoIHdyYXdwXCIsIC0+IGVuc3VyZSAnNCBrJywgY3Vyc29yOiBbMCwgMV1cblxuXG4gICAgIyBbTk9URV0gU2VlICM1NjBcbiAgICAjIFRoaXMgc3BlYyBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGluIGxvY2FsIHRlc3QsIG5vdCBhdCBDSSBzZXJ2aWNlLlxuICAgICMgU2FmZSB0byBleGVjdXRlIGlmIGl0IHBhc3NlcywgYnV0IGZyZWV6ZSBlZGl0b3Igd2hlbiBpdCBmYWlsLlxuICAgICMgU28gZXhwbGljaXRseSBkaXNhYmxlZCBiZWNhdXNlIEkgZG9uJ3Qgd2FudCBiZSBiYW5uZWQgYnkgQ0kgc2VydmljZS5cbiAgICAjIEVuYWJsZSB0aGlzIG9uIGRlbW1hbmQgd2hlbiBmcmVlemluZyBoYXBwZW5zIGFnYWluIVxuICAgIHhkZXNjcmliZSBcIndpdGggYmlnIGNvdW50IHdhcyBnaXZlblwiLCAtPlxuICAgICAgQklHX05VTUJFUiA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSXG4gICAgICBlbnN1cmVCaWdDb3VudE1vdGlvbiA9IChrZXlzdHJva2VzLCBvcHRpb25zKSAtPlxuICAgICAgICBjb3VudCA9IFN0cmluZyhCSUdfTlVNQkVSKS5zcGxpdCgnJykuam9pbignICcpXG4gICAgICAgIGtleXN0cm9rZXMgPSBrZXlzdHJva2VzLnNwbGl0KCcnKS5qb2luKCcgJylcbiAgICAgICAgZW5zdXJlKFwiI3tjb3VudH0gI3trZXlzdHJva2VzfVwiLCBvcHRpb25zKVxuXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJ0ZXN0XCIsXG4gICAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgICAnZyB7JzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS10by1wcmV2aW91cy1mb2xkLXN0YXJ0J1xuICAgICAgICAgICAgJ2cgfSc6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tbmV4dC1mb2xkLXN0YXJ0J1xuICAgICAgICAgICAgJywgTic6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tcHJldmlvdXMtbnVtYmVyJ1xuICAgICAgICAgICAgJywgbic6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tbmV4dC1udW1iZXInXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDAwMDBcbiAgICAgICAgICAxMTExXG4gICAgICAgICAgMjIyMlxcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDJdXG5cbiAgICAgIGl0IFwiYnkgYGpgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdqJywgY3Vyc29yOiBbMiwgMl1cbiAgICAgIGl0IFwiYnkgYGtgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdrJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgIGl0IFwiYnkgYGhgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdoJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgIGl0IFwiYnkgYGxgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdsJywgY3Vyc29yOiBbMSwgM11cbiAgICAgIGl0IFwiYnkgYFtgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdbJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgIGl0IFwiYnkgYF1gXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICddJywgY3Vyc29yOiBbMiwgMl1cbiAgICAgIGl0IFwiYnkgYHdgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICd3JywgY3Vyc29yOiBbMiwgM11cbiAgICAgIGl0IFwiYnkgYFdgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdXJywgY3Vyc29yOiBbMiwgM11cbiAgICAgIGl0IFwiYnkgYGJgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdiJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwiYnkgYEJgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdCJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwiYnkgYGVgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdlJywgY3Vyc29yOiBbMiwgM11cbiAgICAgIGl0IFwiYnkgYChgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICcoJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwiYnkgYClgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICcpJywgY3Vyc29yOiBbMiwgM11cbiAgICAgIGl0IFwiYnkgYHtgXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICd7JywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwiYnkgYH1gXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICd9JywgY3Vyc29yOiBbMiwgM11cbiAgICAgIGl0IFwiYnkgYC1gXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICctJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwiYnkgYF9gXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdfJywgY3Vyc29yOiBbMiwgMF1cbiAgICAgIGl0IFwiYnkgYGcge2BcIiwgLT4gZW5zdXJlQmlnQ291bnRNb3Rpb24gJ2cgeycsIGN1cnNvcjogWzEsIDJdICMgTm8gZm9sZCBubyBtb3ZlIGJ1dCB3b24ndCBmcmVlemUuXG4gICAgICBpdCBcImJ5IGBnIH1gXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICdnIH0nLCBjdXJzb3I6IFsxLCAyXSAjIE5vIGZvbGQgbm8gbW92ZSBidXQgd29uJ3QgZnJlZXplLlxuICAgICAgaXQgXCJieSBgLCBOYFwiLCAtPiBlbnN1cmVCaWdDb3VudE1vdGlvbiAnLCBOJywgY3Vyc29yOiBbMSwgMl0gIyBObyBncmFtbWFyLCBubyBtb3ZlIGJ1dCB3b24ndCBmcmVlemUuXG4gICAgICBpdCBcImJ5IGAsIG5gXCIsIC0+IGVuc3VyZUJpZ0NvdW50TW90aW9uICcsIG4nLCBjdXJzb3I6IFsxLCAyXSAjIE5vIGdyYW1tYXIsIG5vIG1vdmUgYnV0IHdvbid0IGZyZWV6ZS5cblxuICAgIGRlc2NyaWJlIFwidGhlIGsga2V5YmluZGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMV1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHVwXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnaycsIGN1cnNvcjogWzEsIDFdXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB1cCBhbmQgcmVtZW1iZXIgY29sdW1uIGl0IHdhcyBpblwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgNF1cbiAgICAgICAgZW5zdXJlICdrJywgY3Vyc29yOiBbMSwgM11cbiAgICAgICAgZW5zdXJlICdrJywgY3Vyc29yOiBbMCwgNF1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHVwLCBidXQgbm90IHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpcnN0IGxpbmVcIiwgLT5cbiAgICAgICAgZW5zdXJlICcxIDAgaycsIGN1cnNvcjogWzAsIDFdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgICBpdCBcImtlZXAgc2FtZSBjb2x1bW4oZ29hbENvbHVtbikgZXZlbiBhZnRlciBhY3Jvc3MgdGhlIGVtcHR5IGxpbmVcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICBhYmNkZWZnXG5cbiAgICAgICAgICAgICAgYWJjZGVmZ1xuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzIsIDNdXG4gICAgICAgICAgZW5zdXJlICd2JywgY3Vyc29yOiBbMiwgNF0sIHNlbGVjdGVkVGV4dDogJ2QnXG4gICAgICAgICAgZW5zdXJlICdrIGsnLCBjdXJzb3I6IFswLCAzXSwgc2VsZWN0ZWRUZXh0OiBcImRlZmdcXG5cXG5hYmNkXCJcblxuICAgIGRlc2NyaWJlIFwiZ2ogZ2sgaW4gc29mdHdyYXBcIiwgLT5cbiAgICAgIFt0ZXh0XSA9IFtdXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpXG4gICAgICAgIGVkaXRvci5zZXRFZGl0b3JXaWR0aEluQ2hhcnMoMTApXG4gICAgICAgIGVkaXRvci5zZXREZWZhdWx0Q2hhcldpZHRoKDEpXG4gICAgICAgIHRleHQgPSBuZXcgVGV4dERhdGEgXCJcIlwiXG4gICAgICAgICAgMXN0IGxpbmUgb2YgYnVmZmVyXG4gICAgICAgICAgMm5kIGxpbmUgb2YgYnVmZmVyLCBWZXJ5IGxvbmcgbGluZVxuICAgICAgICAgIDNyZCBsaW5lIG9mIGJ1ZmZlclxuXG4gICAgICAgICAgNXRoIGxpbmUgb2YgYnVmZmVyXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHNldCB0ZXh0OiB0ZXh0LmdldFJhdygpLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBkZXNjcmliZSBcInNlbGVjdGlvbiBpcyBub3QgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgXCJzY3JlZW4gcG9zaXRpb24gYW5kIGJ1ZmZlciBwb3NpdGlvbiBpcyBkaWZmZXJlbnRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2cgaicsIGN1cnNvclNjcmVlbjogWzEsIDBdLCBjdXJzb3I6IFswLCA5XVxuICAgICAgICAgIGVuc3VyZSAnZyBqJywgY3Vyc29yU2NyZWVuOiBbMiwgMF0sIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICdnIGonLCBjdXJzb3JTY3JlZW46IFszLCAwXSwgY3Vyc29yOiBbMSwgOV1cbiAgICAgICAgICBlbnN1cmUgJ2cgaicsIGN1cnNvclNjcmVlbjogWzQsIDBdLCBjdXJzb3I6IFsxLCAxMl1cblxuICAgICAgICBpdCBcImprIG1vdmUgc2VsZWN0aW9uIGJ1ZmZlci1saW5lIHdpc2VcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ1YnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzAuLjBdKVxuICAgICAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uMV0pXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLi4yXSlcbiAgICAgICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzAuLjNdKVxuICAgICAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uNF0pXG4gICAgICAgICAgZW5zdXJlICdrJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLi4zXSlcbiAgICAgICAgICBlbnN1cmUgJ2snLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzAuLjJdKVxuICAgICAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uMV0pXG4gICAgICAgICAgZW5zdXJlICdrJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFswLi4wXSlcbiAgICAgICAgICBlbnN1cmUgJ2snLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzAuLjBdKSAjIGRvIG5vdGhpbmdcblxuICAgICAgZGVzY3JpYmUgXCJzZWxlY3Rpb24gaXMgcmV2ZXJzZWRcIiwgLT5cbiAgICAgICAgaXQgXCJzY3JlZW4gcG9zaXRpb24gYW5kIGJ1ZmZlciBwb3NpdGlvbiBpcyBkaWZmZXJlbnRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2cgaicsIGN1cnNvclNjcmVlbjogWzEsIDBdLCBjdXJzb3I6IFswLCA5XVxuICAgICAgICAgIGVuc3VyZSAnZyBqJywgY3Vyc29yU2NyZWVuOiBbMiwgMF0sIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICdnIGonLCBjdXJzb3JTY3JlZW46IFszLCAwXSwgY3Vyc29yOiBbMSwgOV1cbiAgICAgICAgICBlbnN1cmUgJ2cgaicsIGN1cnNvclNjcmVlbjogWzQsIDBdLCBjdXJzb3I6IFsxLCAxMl1cblxuICAgICAgICBpdCBcImprIG1vdmUgc2VsZWN0aW9uIGJ1ZmZlci1saW5lIHdpc2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbNCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ1YnLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzQuLjRdKVxuICAgICAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMy4uNF0pXG4gICAgICAgICAgZW5zdXJlICdrJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFsyLi40XSlcbiAgICAgICAgICBlbnN1cmUgJ2snLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzEuLjRdKVxuICAgICAgICAgIGVuc3VyZSAnaycsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uNF0pXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFsxLi40XSlcbiAgICAgICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzIuLjRdKVxuICAgICAgICAgIGVuc3VyZSAnaicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMy4uNF0pXG4gICAgICAgICAgZW5zdXJlICdqJywgc2VsZWN0ZWRUZXh0OiB0ZXh0LmdldExpbmVzKFs0Li40XSlcbiAgICAgICAgICBlbnN1cmUgJ2onLCBzZWxlY3RlZFRleHQ6IHRleHQuZ2V0TGluZXMoWzQuLjRdKSAjIGRvIG5vdGhpbmdcblxuICAgIGRlc2NyaWJlIFwidGhlIGwga2V5YmluZGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHJpZ2h0LCBidXQgbm90IHRvIHRoZSBuZXh0IGxpbmVcIiwgLT5cbiAgICAgICAgZW5zdXJlICdsJywgY3Vyc29yOiBbMSwgM11cbiAgICAgICAgZW5zdXJlICdsJywgY3Vyc29yOiBbMSwgM11cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBuZXh0IGxpbmUgaWYgd3JhcExlZnRSaWdodE1vdGlvbiBpcyB0cnVlXCIsIC0+XG4gICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG4gICAgICAgIGVuc3VyZSAnbCBsJywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJvbiBhIGJsYW5rIGxpbmVcIiwgLT5cbiAgICAgICAgaXQgXCJkb2Vzbid0IG1vdmUgdGhlIGN1cnNvclwiLCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcIlxcblxcblxcblwiLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnbCcsIGN1cnNvcjogWzEsIDBdXG5cbiAgICBkZXNjcmliZSBcIm1vdmUtKHVwL2Rvd24pLXRvLWVkZ2VcIiwgLT5cbiAgICAgIHRleHQgPSBudWxsXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHRleHQgPSBuZXcgVGV4dERhdGEgXCJcIlwiXG4gICAgICAgICAgMDogIDQgNjcgIDAxMjM0NTY3ODkwMTIzNDU2Nzg5XG4gICAgICAgICAgMTogICAgICAgICAxMjM0NTY3ODkwMTIzNDU2Nzg5XG4gICAgICAgICAgMjogICAgNiA4OTAgICAgICAgICAwMTIzNDU2Nzg5XG4gICAgICAgICAgMzogICAgNiA4OTAgICAgICAgICAwMTIzNDU2Nzg5XG4gICAgICAgICAgNDogICA1NiA4OTAgICAgICAgICAwMTIzNDU2Nzg5XG4gICAgICAgICAgNTogICAgICAgICAgICAgICAgICAwMTIzNDU2Nzg5XG4gICAgICAgICAgNjogICAgICAgICAgICAgICAgICAwMTIzNDU2Nzg5XG4gICAgICAgICAgNzogIDQgNjcgICAgICAgICAgICAwMTIzNDU2Nzg5XFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIHNldCB0ZXh0OiB0ZXh0LmdldFJhdygpLCBjdXJzb3I6IFs0LCAzXVxuXG4gICAgICBkZXNjcmliZSBcImVkZ2VuZXNzIG9mIGZpcnN0LWxpbmUgYW5kIGxhc3QtbGluZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgICBfX19fdGhpcyBpcyBsaW5lIDBcbiAgICAgICAgICAgIF9fX190aGlzIGlzIHRleHQgb2YgbGluZSAxXG4gICAgICAgICAgICBfX19fdGhpcyBpcyB0ZXh0IG9mIGxpbmUgMlxuICAgICAgICAgICAgX19fX19faGVsbG8gbGluZSAzXG4gICAgICAgICAgICBfX19fX19oZWxsbyBsaW5lIDRcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMiwgMl1cblxuICAgICAgICBkZXNjcmliZSBcIndoZW4gY29sdW1uIGlzIGxlYWRpbmcgc3BhY2VzXCIsIC0+XG4gICAgICAgICAgaXQgXCJkb2Vzbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3I6IFsyLCAyXVxuICAgICAgICAgICAgZW5zdXJlICddJywgY3Vyc29yOiBbMiwgMl1cblxuICAgICAgICBkZXNjcmliZSBcIndoZW4gY29sdW1uIGlzIHRyYWlsaW5nIHNwYWNlc1wiLCAtPlxuICAgICAgICAgIGl0IFwiZG9lc24ndCBtb3ZlIGN1cnNvclwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDIwXVxuICAgICAgICAgICAgZW5zdXJlICddJywgY3Vyc29yOiBbMiwgMjBdXG4gICAgICAgICAgICBlbnN1cmUgJ10nLCBjdXJzb3I6IFsyLCAyMF1cbiAgICAgICAgICAgIGVuc3VyZSAnWycsIGN1cnNvcjogWzEsIDIwXVxuICAgICAgICAgICAgZW5zdXJlICdbJywgY3Vyc29yOiBbMSwgMjBdXG5cbiAgICAgIGl0IFwibW92ZSB0byBub24tYmxhbmstY2hhciBvbiBib3RoIGZpcnN0IGFuZCBsYXN0IHJvd1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgNF1cbiAgICAgICAgZW5zdXJlICdbJywgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgZW5zdXJlICddJywgY3Vyc29yOiBbNywgNF1cbiAgICAgIGl0IFwibW92ZSB0byB3aGl0ZSBzcGFjZSBjaGFyIHdoZW4gYm90aCBzaWRlIGNvbHVtbiBpcyBub24tYmxhbmsgY2hhclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgNV1cbiAgICAgICAgZW5zdXJlICdbJywgY3Vyc29yOiBbMCwgNV1cbiAgICAgICAgZW5zdXJlICddJywgY3Vyc29yOiBbNCwgNV1cbiAgICAgICAgZW5zdXJlICddJywgY3Vyc29yOiBbNywgNV1cbiAgICAgIGl0IFwib25seSBzdG9wcyBvbiByb3cgb25lIG9mIFtmaXJzdCByb3csIGxhc3Qgcm93LCB1cC1vci1kb3duLXJvdyBpcyBibGFua10gY2FzZS0xXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCA2XVxuICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3I6IFsyLCA2XVxuICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3I6IFswLCA2XVxuICAgICAgICBlbnN1cmUgJ10nLCBjdXJzb3I6IFsyLCA2XVxuICAgICAgICBlbnN1cmUgJ10nLCBjdXJzb3I6IFs0LCA2XVxuICAgICAgICBlbnN1cmUgJ10nLCBjdXJzb3I6IFs3LCA2XVxuICAgICAgaXQgXCJvbmx5IHN0b3BzIG9uIHJvdyBvbmUgb2YgW2ZpcnN0IHJvdywgbGFzdCByb3csIHVwLW9yLWRvd24tcm93IGlzIGJsYW5rXSBjYXNlLTJcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDddXG4gICAgICAgIGVuc3VyZSAnWycsIGN1cnNvcjogWzIsIDddXG4gICAgICAgIGVuc3VyZSAnWycsIGN1cnNvcjogWzAsIDddXG4gICAgICAgIGVuc3VyZSAnXScsIGN1cnNvcjogWzIsIDddXG4gICAgICAgIGVuc3VyZSAnXScsIGN1cnNvcjogWzQsIDddXG4gICAgICAgIGVuc3VyZSAnXScsIGN1cnNvcjogWzcsIDddXG4gICAgICBpdCBcInN1cHBvcnQgY291bnRcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzQsIDZdXG4gICAgICAgIGVuc3VyZSAnMiBbJywgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgZW5zdXJlICczIF0nLCBjdXJzb3I6IFs3LCA2XVxuXG4gICAgICBkZXNjcmliZSAnZWRpdG9yIGZvciBoYXJkVGFiJywgLT5cbiAgICAgICAgcGFjayA9ICdsYW5ndWFnZS1nbydcbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgICAgICAgIGdldFZpbVN0YXRlICdzYW1wbGUuZ28nLCAoc3RhdGUsIHZpbUVkaXRvcikgLT5cbiAgICAgICAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gc3RhdGVcbiAgICAgICAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IHZpbUVkaXRvclxuXG4gICAgICAgICAgcnVucyAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvclNjcmVlbjogWzgsIDJdXG4gICAgICAgICAgICAjIEluIGhhcmRUYWIgaW5kZW50IGJ1ZmZlclBvc2l0aW9uIGlzIG5vdCBzYW1lIGFzIHNjcmVlblBvc2l0aW9uXG4gICAgICAgICAgICBlbnN1cmUgY3Vyc29yOiBbOCwgMV1cblxuICAgICAgICBhZnRlckVhY2ggLT5cbiAgICAgICAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKHBhY2spXG5cbiAgICAgICAgaXQgXCJtb3ZlIHVwL2Rvd24gdG8gbmV4dCBlZGdlIG9mIHNhbWUgKnNjcmVlbiogY29sdW1uXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdbJywgY3Vyc29yU2NyZWVuOiBbNSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3JTY3JlZW46IFszLCAyXVxuICAgICAgICAgIGVuc3VyZSAnWycsIGN1cnNvclNjcmVlbjogWzIsIDJdXG4gICAgICAgICAgZW5zdXJlICdbJywgY3Vyc29yU2NyZWVuOiBbMCwgMl1cblxuICAgICAgICAgIGVuc3VyZSAnXScsIGN1cnNvclNjcmVlbjogWzIsIDJdXG4gICAgICAgICAgZW5zdXJlICddJywgY3Vyc29yU2NyZWVuOiBbMywgMl1cbiAgICAgICAgICBlbnN1cmUgJ10nLCBjdXJzb3JTY3JlZW46IFs1LCAyXVxuICAgICAgICAgIGVuc3VyZSAnXScsIGN1cnNvclNjcmVlbjogWzksIDJdXG4gICAgICAgICAgZW5zdXJlICddJywgY3Vyc29yU2NyZWVuOiBbMTEsIDJdXG4gICAgICAgICAgZW5zdXJlICddJywgY3Vyc29yU2NyZWVuOiBbMTQsIDJdXG4gICAgICAgICAgZW5zdXJlICddJywgY3Vyc29yU2NyZWVuOiBbMTcsIDJdXG5cbiAgICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3JTY3JlZW46IFsxNCwgMl1cbiAgICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3JTY3JlZW46IFsxMSwgMl1cbiAgICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3JTY3JlZW46IFs5LCAyXVxuICAgICAgICAgIGVuc3VyZSAnWycsIGN1cnNvclNjcmVlbjogWzUsIDJdXG4gICAgICAgICAgZW5zdXJlICdbJywgY3Vyc29yU2NyZWVuOiBbMywgMl1cbiAgICAgICAgICBlbnN1cmUgJ1snLCBjdXJzb3JTY3JlZW46IFsyLCAyXVxuICAgICAgICAgIGVuc3VyZSAnWycsIGN1cnNvclNjcmVlbjogWzAsIDJdXG5cbiAgZGVzY3JpYmUgJ21vdmVTdWNjZXNzT25MaW5ld2lzZSBiZWhhdmlyYWwgY2hhcmFjdGVyaXN0aWMnLCAtPlxuICAgIG9yaWdpbmFsVGV4dCA9IG51bGxcbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXR0aW5ncy5zZXQoJ3VzZUNsaXBib2FyZEFzRGVmYXVsdFJlZ2lzdGVyJywgZmFsc2UpXG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMDAwXG4gICAgICAgICAgMTExXG4gICAgICAgICAgMjIyXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICBvcmlnaW5hbFRleHQgPSBlZGl0b3IuZ2V0VGV4dCgpXG4gICAgICBlbnN1cmUgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiB1bmRlZmluZWR9XG5cbiAgICBkZXNjcmliZSBcIm1vdmVTdWNjZXNzT25MaW5ld2lzZT1mYWxzZSBtb3Rpb25cIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBpdCBjYW4gbW92ZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBpdCBcImRlbGV0ZSBieSBqXCIsIC0+IGVuc3VyZSBcImQgalwiLCB0ZXh0OiBcIjAwMFxcblwiLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBpdCBcInlhbmsgYnkgalwiLCAtPiBlbnN1cmUgXCJ5IGpcIiwgdGV4dDogb3JpZ2luYWxUZXh0LCByZWdpc3RlcjogeydcIic6IHRleHQ6IFwiMTExXFxuMjIyXFxuXCJ9LCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBpdCBcImNoYW5nZSBieSBqXCIsIC0+IGVuc3VyZSBcImMgalwiLCB0ZXh0QzogXCIwMDBcXG58XFxuXCIsIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogXCIxMTFcXG4yMjJcXG5cIn0sIG1vZGU6ICdpbnNlcnQnXG5cbiAgICAgICAgaXQgXCJkZWxldGUgYnkga1wiLCAtPiBlbnN1cmUgXCJkIGtcIiwgdGV4dDogXCIyMjJcXG5cIiwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgaXQgXCJ5YW5rIGJ5IGtcIiwgLT4gZW5zdXJlIFwieSBrXCIsIHRleHQ6IG9yaWdpbmFsVGV4dCwgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiBcIjAwMFxcbjExMVxcblwifSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgaXQgXCJjaGFuZ2UgYnkga1wiLCAtPiBlbnN1cmUgXCJjIGtcIiwgdGV4dEM6IFwifFxcbjIyMlxcblwiLCByZWdpc3RlcjogeydcIic6IHRleHQ6IFwiMDAwXFxuMTExXFxuXCJ9LCBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICBkZXNjcmliZSBcIndoZW4gaXQgY2FuIG5vdCBtb3ZlLXVwXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGl0IFwiZGVsZXRlIGJ5IGRrXCIsIC0+IGVuc3VyZSBcImQga1wiLCB0ZXh0OiBvcmlnaW5hbFRleHQsIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGl0IFwieWFuayBieSB5a1wiLCAtPiBlbnN1cmUgXCJ5IGtcIiwgdGV4dDogb3JpZ2luYWxUZXh0LCByZWdpc3RlcjogeydcIic6IHRleHQ6IHVuZGVmaW5lZH0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGl0IFwiY2hhbmdlIGJ5IGNrXCIsIC0+IGVuc3VyZSBcImMga1wiLCB0ZXh0QzogXCJ8MDAwXFxuMTExXFxuMjIyXFxuXCIsIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogXCJcXG5cIn0sIG1vZGU6ICdpbnNlcnQnICMgRklYTUUsIGluY29tcGF0aWJsZTogc2hvdWQgcmVtYWluIGluIG5vcm1hbC5cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGl0IGNhbiBub3QgbW92ZS1kb3duXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGl0IFwiZGVsZXRlIGJ5IGRqXCIsIC0+IGVuc3VyZSBcImQgalwiLCB0ZXh0OiBvcmlnaW5hbFRleHQsIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGl0IFwieWFuayBieSB5alwiLCAtPiBlbnN1cmUgXCJ5IGpcIiwgdGV4dDogb3JpZ2luYWxUZXh0LCByZWdpc3RlcjogeydcIic6IHRleHQ6IHVuZGVmaW5lZH0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGl0IFwiY2hhbmdlIGJ5IGNqXCIsIC0+IGVuc3VyZSBcImMgalwiLCB0ZXh0QzogXCIwMDBcXG4xMTFcXG58MjIyXFxuXCIsIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogXCJcXG5cIn0sIG1vZGU6ICdpbnNlcnQnICMgRklYTUUsIGluY29tcGF0aWJsZTogc2hvdWQgcmVtYWluIGluIG5vcm1hbC5cblxuICAgIGRlc2NyaWJlIFwibW92ZVN1Y2Nlc3NPbkxpbmV3aXNlPXRydWUgbW90aW9uXCIsIC0+XG4gICAgICBkZXNjcmliZSBcIndoZW4gaXQgY2FuIG1vdmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgaXQgXCJkZWxldGUgYnkgR1wiLCAtPiBlbnN1cmUgXCJkIEdcIiwgdGV4dDogXCIwMDBcXG5cIiwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgaXQgXCJ5YW5rIGJ5IEdcIiwgLT4gZW5zdXJlIFwieSBHXCIsIHRleHQ6IG9yaWdpbmFsVGV4dCwgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiBcIjExMVxcbjIyMlxcblwifSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgaXQgXCJjaGFuZ2UgYnkgR1wiLCAtPiBlbnN1cmUgXCJjIEdcIiwgdGV4dEM6IFwiMDAwXFxufFxcblwiLCByZWdpc3RlcjogeydcIic6IHRleHQ6IFwiMTExXFxuMjIyXFxuXCJ9LCBtb2RlOiAnaW5zZXJ0J1xuXG4gICAgICAgIGl0IFwiZGVsZXRlIGJ5IGdnXCIsIC0+IGVuc3VyZSBcImQgZyBnXCIsIHRleHQ6IFwiMjIyXFxuXCIsIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGl0IFwieWFuayBieSBnZ1wiLCAtPiBlbnN1cmUgXCJ5IGcgZ1wiLCB0ZXh0OiBvcmlnaW5hbFRleHQsIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogXCIwMDBcXG4xMTFcXG5cIn0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGl0IFwiY2hhbmdlIGJ5IGdnXCIsIC0+IGVuc3VyZSBcImMgZyBnXCIsIHRleHRDOiBcInxcXG4yMjJcXG5cIiwgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiBcIjAwMFxcbjExMVxcblwifSwgbW9kZTogJ2luc2VydCdcblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGl0IGNhbiBub3QgbW92ZS11cFwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBpdCBcImRlbGV0ZSBieSBnZ1wiLCAtPiBlbnN1cmUgXCJkIGcgZ1wiLCB0ZXh0OiBcIjExMVxcbjIyMlxcblwiLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBpdCBcInlhbmsgYnkgZ2dcIiwgLT4gZW5zdXJlIFwieSBnIGdcIiwgdGV4dDogb3JpZ2luYWxUZXh0LCByZWdpc3RlcjogeydcIic6IHRleHQ6IFwiMDAwXFxuXCJ9LCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBpdCBcImNoYW5nZSBieSBnZ1wiLCAtPiBlbnN1cmUgXCJjIGcgZ1wiLCB0ZXh0QzogXCJ8XFxuMTExXFxuMjIyXFxuXCIsIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogXCIwMDBcXG5cIn0sIG1vZGU6ICdpbnNlcnQnXG4gICAgICBkZXNjcmliZSBcIndoZW4gaXQgY2FuIG5vdCBtb3ZlLWRvd25cIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgaXQgXCJkZWxldGUgYnkgR1wiLCAtPiBlbnN1cmUgXCJkIEdcIiwgdGV4dDogXCIwMDBcXG4xMTFcXG5cIiwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgaXQgXCJ5YW5rIGJ5IEdcIiwgLT4gZW5zdXJlIFwieSBHXCIsIHRleHQ6IG9yaWdpbmFsVGV4dCwgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiBcIjIyMlxcblwifSwgbW9kZTogJ25vcm1hbCdcbiAgICAgICAgaXQgXCJjaGFuZ2UgYnkgR1wiLCAtPiBlbnN1cmUgXCJjIEdcIiwgdGV4dEM6IFwiMDAwXFxuMTExXFxufFxcblwiLCByZWdpc3RlcjogeydcIic6IHRleHQ6IFwiMjIyXFxuXCJ9LCBtb2RlOiAnaW5zZXJ0J1xuXG4gIGRlc2NyaWJlIFwidGhlIHcga2V5YmluZGluZ1wiLCAtPlxuICAgIGJhc2VUZXh0ID0gXCJcIlwiXG4gICAgICBhYiBjZGUxKy1cbiAgICAgICB4eXpcblxuICAgICAgemlwXG4gICAgICBcIlwiXCJcbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogYmFzZVRleHRcblxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHdvcmRcIiwgLT5cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMCwgN11cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMywgMl1cbiAgICAgICAgIyBXaGVuIHRoZSBjdXJzb3IgZ2V0cyB0byB0aGUgRU9GLCBpdCBzaG91bGQgc3RheSB0aGVyZS5cbiAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMywgMl1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIHdvcmQgaWYgbGFzdCB3b3JkIGluIGZpbGVcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6ICdhYmMnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICBpdCBcIm1vdmUgdG8gbmV4dCB3b3JkIGJ5IHNraXBwaW5nIHRyYWlsaW5nIHdoaXRlIHNwYWNlc1wiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICAgICAgMDEyfF9fX1xuICAgICAgICAgICAgICAyMzRcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ3cnLFxuICAgICAgICAgIHRleHRDXzogXCJcIlwiXG4gICAgICAgICAgICAwMTJfX19cbiAgICAgICAgICAgICAgfDIzNFxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGl0IFwibW92ZSB0byBuZXh0IHdvcmQgZnJvbSBFT0xcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dENfOiBcIlwiXCJcbiAgICAgICAgICAgIHxcbiAgICAgICAgICAgIF9fMjM0XCJcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ3cnLFxuICAgICAgICAgIHRleHRDXzogXCJcIlwiXG5cbiAgICAgICAgICAgIF9ffDIzNFwiXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgIyBbRklYTUVdIGltcHJvdmUgc3BlYyB0byBsb29wIHNhbWUgc2VjdGlvbiB3aXRoIGRpZmZlcmVudCB0ZXh0XG4gICAgICBkZXNjcmliZSBcImZvciBDUkxGIGJ1ZmZlclwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHRleHQ6IGJhc2VUZXh0LnJlcGxhY2UoL1xcbi9nLCBcIlxcclxcblwiKVxuXG4gICAgICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHdvcmRcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSAndycsIGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFswLCA3XVxuICAgICAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgICAgIGVuc3VyZSAndycsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFszLCAwXVxuICAgICAgICAgICAgZW5zdXJlICd3JywgY3Vyc29yOiBbMywgMl1cbiAgICAgICAgICAgICMgV2hlbiB0aGUgY3Vyc29yIGdldHMgdG8gdGhlIEVPRiwgaXQgc2hvdWxkIHN0YXkgdGhlcmUuXG4gICAgICAgICAgICBlbnN1cmUgJ3cnLCBjdXJzb3I6IFszLCAyXVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHVzZWQgYnkgQ2hhbmdlIG9wZXJhdG9yXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBfX3ZhcjEgPSAxXG4gICAgICAgICAgX192YXIyID0gMlxcblxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIG9uIHdvcmRcIiwgLT5cbiAgICAgICAgaXQgXCJub3QgZWF0IHdoaXRlc3BhY2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgICBlbnN1cmUgJ2MgdycsXG4gICAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgICBfX3YgPSAxXG4gICAgICAgICAgICBfX3ZhcjIgPSAyXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDNdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgb24gd2hpdGUgc3BhY2VcIiwgLT5cbiAgICAgICAgaXQgXCJvbmx5IGVhdCB3aGl0ZSBzcGFjZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnYyB3JyxcbiAgICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgIHZhcjEgPSAxXG4gICAgICAgICAgICBfX3ZhcjIgPSAyXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiB0ZXh0IHRvIEVPTCBpcyBhbGwgd2hpdGUgc3BhY2VcIiwgLT5cbiAgICAgICAgaXQgXCJ3b250IGVhdCBuZXcgbGluZSBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgIGFiY19fXG4gICAgICAgICAgICBkZWZcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgICBlbnN1cmUgJ2MgdycsXG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgZGVmXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDNdXG5cbiAgICAgICAgaXQgXCJjYW50IGVhdCBuZXcgbGluZSB3aGVuIGNvdW50IGlzIHNwZWNpZmllZFwiLCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcIlxcblxcblxcblxcblxcbmxpbmU2XFxuXCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICc1IGMgdycsIHRleHQ6IFwiXFxubGluZTZcXG5cIiwgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwid2l0aGluIGEgd29yZFwiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdHMgdG8gdGhlIGVuZCBvZiB0aGUgd29yZFwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAneSB3JywgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdhYiAnXG5cbiAgICAgIGRlc2NyaWJlIFwiYmV0d2VlbiB3b3Jkc1wiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdHMgdGhlIHdoaXRlc3BhY2VcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgICBlbnN1cmUgJ3kgdycsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnICdcblxuICBkZXNjcmliZSBcInRoZSBXIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogXCJjZGUxKy0gYWIgXFxuIHh5elxcblxcbnppcFwiXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbmV4dCB3b3JkXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnVycsIGN1cnNvcjogWzAsIDddXG4gICAgICAgIGVuc3VyZSAnVycsIGN1cnNvcjogWzEsIDFdXG4gICAgICAgIGVuc3VyZSAnVycsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnVycsIGN1cnNvcjogWzMsIDBdXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byBiZWdpbm5pbmcgb2YgdGhlIG5leHQgd29yZCBvZiBuZXh0IGxpbmUgd2hlbiBhbGwgcmVtYWluaW5nIHRleHQgaXMgd2hpdGUgc3BhY2UuXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgIDAxMl9fX1xuICAgICAgICAgICAgX18yMzRcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDNdXG4gICAgICAgIGVuc3VyZSAnVycsIGN1cnNvcjogWzEsIDJdXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byBiZWdpbm5pbmcgb2YgdGhlIG5leHQgd29yZCBvZiBuZXh0IGxpbmUgd2hlbiBjdXJzb3IgaXMgYXQgRU9MLlwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0XzogXCJcIlwiXG5cbiAgICAgICAgICBfXzIzNFxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnVycsIGN1cnNvcjogWzEsIDJdXG5cbiAgICAjIFRoaXMgc3BlYyBpcyByZWR1bmRhbnQgc2luY2UgVyhNb3ZlVG9OZXh0V2hvbGVXb3JkKSBpcyBjaGlsZCBvZiB3KE1vdmVUb05leHRXb3JkKS5cbiAgICBkZXNjcmliZSBcIndoZW4gdXNlZCBieSBDaGFuZ2Ugb3BlcmF0b3JcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgICAgX192YXIxID0gMVxuICAgICAgICAgICAgX192YXIyID0gMlxcblxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgb24gd29yZFwiLCAtPlxuICAgICAgICBpdCBcIm5vdCBlYXQgd2hpdGVzcGFjZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgICAgIGVuc3VyZSAnYyBXJyxcbiAgICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgICAgX192ID0gMVxuICAgICAgICAgICAgICBfX3ZhcjIgPSAyXFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgM11cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIGN1cnNvciBpcyBvbiB3aGl0ZSBzcGFjZVwiLCAtPlxuICAgICAgICBpdCBcIm9ubHkgZWF0IHdoaXRlIHNwYWNlXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICdjIFcnLFxuICAgICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgICAgICB2YXIxID0gMVxuICAgICAgICAgICAgICBfX3ZhcjIgPSAyXFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIHRleHQgdG8gRU9MIGlzIGFsbCB3aGl0ZSBzcGFjZVwiLCAtPlxuICAgICAgICBpdCBcIndvbnQgZWF0IG5ldyBsaW5lIGNoYXJhY3RlclwiLCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcImFiYyAgXFxuZGVmXFxuXCIsIGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgZW5zdXJlICdjIFcnLCB0ZXh0OiBcImFiY1xcbmRlZlxcblwiLCBjdXJzb3I6IFswLCAzXVxuXG4gICAgICAgIGl0IFwiY2FudCBlYXQgbmV3IGxpbmUgd2hlbiBjb3VudCBpcyBzcGVjaWZpZWRcIiwgLT5cbiAgICAgICAgICBzZXQgdGV4dDogXCJcXG5cXG5cXG5cXG5cXG5saW5lNlxcblwiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnNSBjIFcnLCB0ZXh0OiBcIlxcbmxpbmU2XFxuXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICBkZXNjcmliZSBcIndpdGhpbiBhIHdvcmRcIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBlbmQgb2YgdGhlIHdob2xlIHdvcmRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ3kgVycsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnY2RlMSstICdcblxuICAgICAgaXQgXCJjb250aW51ZXMgcGFzdCBibGFuayBsaW5lc1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgZW5zdXJlICdkIFcnLFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBjZGUxKy0gYWJfXG4gICAgICAgICAgX3h5elxuICAgICAgICAgIHppcFxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIlxcblwiXG5cbiAgICAgIGl0IFwiZG9lc24ndCBnbyBwYXN0IHRoZSBlbmQgb2YgdGhlIGZpbGVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzMsIDBdXG4gICAgICAgIGVuc3VyZSAnZCBXJyxcbiAgICAgICAgICB0ZXh0XzogXCJcIlwiXG4gICAgICAgICAgY2RlMSstIGFiX1xuICAgICAgICAgIF94eXpcXG5cXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJ3ppcCdcblxuICBkZXNjcmliZSBcInRoZSBlIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dF86IFwiXCJcIlxuICAgICAgYWIgY2RlMSstX1xuICAgICAgX3h5elxuXG4gICAgICB6aXBcbiAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgd29yZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFswLCA2XVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFswLCA4XVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFsxLCAzXVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFszLCAyXVxuXG4gICAgICBpdCBcInNraXBzIHdoaXRlc3BhY2UgdW50aWwgRU9GXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiMDEyXFxuXFxuXFxuMDEyXFxuXFxuXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFszLCAyXVxuICAgICAgICBlbnN1cmUgJ2UnLCBjdXJzb3I6IFs0LCAwXVxuXG4gICAgZGVzY3JpYmUgXCJhcyBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwid2l0aGluIGEgd29yZFwiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdHMgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB3b3JkXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgZW5zdXJlICd5IGUnLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJ2FiJ1xuXG4gICAgICBkZXNjcmliZSBcImJldHdlZW4gd29yZHNcIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBlbmQgb2YgdGhlIG5leHQgd29yZFwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICAgIGVuc3VyZSAneSBlJywgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcgY2RlMSdcblxuICBkZXNjcmliZSBcInRoZSBnZSBrZXliaW5kaW5nXCIsIC0+XG4gICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIHByZXZpb3VzIHdvcmRcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiMTIzNCA1Njc4IHdvcmR3b3JkXCJcbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDE2XVxuICAgICAgICBlbnN1cmUgJ2cgZScsIGN1cnNvcjogWzAsIDhdXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgZW5zdXJlICdnIGUnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgZScsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwibW92ZXMgY29ycmVudGx5IHdoZW4gc3RhcnRpbmcgYmV0d2VlbiB3b3Jkc1wiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIxIGxlYWRpbmcgICAgIGVuZFwiXG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAxMl1cbiAgICAgICAgZW5zdXJlICdnIGUnLCBjdXJzb3I6IFswLCA4XVxuXG4gICAgICBpdCBcInRha2VzIGEgY291bnRcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6IFwidmltIG1vZGUgcGx1cyBpcyBnZXR0aW5nIHRoZXJlXCJcbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDI4XVxuICAgICAgICBlbnN1cmUgJzUgZyBlJywgY3Vyc29yOiBbMCwgMl1cblxuICAgICAgIyB0ZXN0IHdpbGwgZmFpbCB1bnRpbCB0aGUgY29kZSBpcyBmaXhlZFxuICAgICAgeGl0IFwiaGFuZGxlcyBub24td29yZHMgaW5zaWRlIHdvcmRzIGxpa2UgdmltXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjEyMzQgNTY3OCB3b3JkLXdvcmRcIlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMThdXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbMCwgMTRdXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbMCwgMTNdXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbMCwgOF1cblxuICAgICAgIyB0ZXN0IHdpbGwgZmFpbCB1bnRpbCB0aGUgY29kZSBpcyBmaXhlZFxuICAgICAgeGl0IFwiaGFuZGxlcyBuZXdsaW5lcyBsaWtlIHZpbVwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIxMjM0XFxuXFxuXFxuXFxuNTY3OFwiXG4gICAgICAgIHNldCBjdXJzb3I6IFs1LCAyXVxuICAgICAgICAjIHZpbSBzZWVtcyB0byB0aGluayBhbiBlbmQtb2Ytd29yZCBpcyBhdCBldmVyeSBibGFuayBsaW5lXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbNCwgMF1cbiAgICAgICAgZW5zdXJlICdnIGUnLCBjdXJzb3I6IFszLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgZScsIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICdnIGUnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgZScsIGN1cnNvcjogWzAsIDNdXG4gICAgICAgIGVuc3VyZSAnZyBlJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwid2hlbiB1c2VkIGJ5IENoYW5nZSBvcGVyYXRvclwiLCAtPlxuICAgICAgaXQgXCJjaGFuZ2VzIHdvcmQgZnJhZ21lbnRzXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcImNldCBkb2N1bWVudFwiXG4gICAgICAgIHNldCBjdXJzb3I6IFswLCA3XVxuICAgICAgICBlbnN1cmUgJ2MgZyBlJywgY3Vyc29yOiBbMCwgMl0sIHRleHQ6IFwiY2VtZW50XCIsIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICMgVE9ETzogSSdtIG5vdCBzdXJlIGhvdyB0byBjaGVjayB0aGUgcmVnaXN0ZXIgYWZ0ZXIgY2hlY2tpbmcgdGhlIGRvY3VtZW50XG4gICAgICAgICMgZW5zdXJlIHJlZ2lzdGVyOiAnXCInLCB0ZXh0OiAndCBkb2N1J1xuXG4gICAgICBpdCBcImNoYW5nZXMgd2hpdGVzcGFjZSBwcm9wZXJseVwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCJjZSAgICBkb2NcIlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgZW5zdXJlICdjIGcgZScsIGN1cnNvcjogWzAsIDFdLCB0ZXh0OiBcImMgZG9jXCIsIG1vZGU6ICdpbnNlcnQnXG5cbiAgICBkZXNjcmliZSBcImluIGNoYXJhY3Rlcndpc2UgdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgIGl0IFwic2VsZWN0cyB3b3JkIGZyYWdtZW50c1wiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCJjZXQgZG9jdW1lbnRcIlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgN11cbiAgICAgICAgZW5zdXJlICd2IGcgZScsIGN1cnNvcjogWzAsIDJdLCBzZWxlY3RlZFRleHQ6IFwidCBkb2N1XCJcblxuICBkZXNjcmliZSBcInRoZSBFIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dF86IFwiXCJcIlxuICAgICAgYWIgIGNkZTErLV9cbiAgICAgIF94eXpfXG5cbiAgICAgIHppcFxcblxuICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB3b3JkXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnRScsIGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVuc3VyZSAnRScsIGN1cnNvcjogWzAsIDldXG4gICAgICAgIGVuc3VyZSAnRScsIGN1cnNvcjogWzEsIDNdXG4gICAgICAgIGVuc3VyZSAnRScsIGN1cnNvcjogWzMsIDJdXG4gICAgICAgIGVuc3VyZSAnRScsIGN1cnNvcjogWzMsIDJdXG5cbiAgICBkZXNjcmliZSBcImFzIHNlbGVjdGlvblwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJ3aXRoaW4gYSB3b3JkXCIsIC0+XG4gICAgICAgIGl0IFwic2VsZWN0cyB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHdvcmRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ3kgRScsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnYWInXG5cbiAgICAgIGRlc2NyaWJlIFwiYmV0d2VlbiB3b3Jkc1wiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdHMgdG8gdGhlIGVuZCBvZiB0aGUgbmV4dCB3b3JkXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzAsIDJdXG4gICAgICAgICAgZW5zdXJlICd5IEUnLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJyAgY2RlMSstJ1xuXG4gICAgICBkZXNjcmliZSBcInByZXNzIG1vcmUgdGhhbiBvbmNlXCIsIC0+XG4gICAgICAgIGl0IFwic2VsZWN0cyB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHdvcmRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgJ3YgRSBFIHknLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJ2FiICBjZGUxKy0nXG5cbiAgZGVzY3JpYmUgXCJ0aGUgZ0Uga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBwcmV2aW91cyB3b3JkXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjEyLjQgNX43LSB3b3JkLXdvcmRcIlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMTZdXG4gICAgICAgIGVuc3VyZSAnZyBFJywgY3Vyc29yOiBbMCwgOF1cbiAgICAgICAgZW5zdXJlICdnIEUnLCBjdXJzb3I6IFswLCAzXVxuICAgICAgICBlbnN1cmUgJ2cgRScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnZyBFJywgY3Vyc29yOiBbMCwgMF1cblxuICBkZXNjcmliZSBcInRoZSAoLCkgc2VudGVuY2Uga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBzZW50ZW5jZSBvbmUuXSknXCIgICAgc2VuLnRlbmNlIC50d28uXG4gICAgICAgICAgaGVyZS4gIHNlbnRlbmNlIHRocmVlXG4gICAgICAgICAgbW9yZSB0aHJlZVxuXG4gICAgICAgICAgICAgc2VudGVuY2UgZm91clxuXG5cbiAgICAgICAgICBzZW50ZW5jZSBmaXZlLlxuICAgICAgICAgIG1vcmUgZml2ZVxuICAgICAgICAgIG1vcmUgc2l4XG5cbiAgICAgICAgICAgbGFzdCBzZW50ZW5jZVxuICAgICAgICAgIGFsbCBkb25lIHNldmVuXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBzZW50ZW5jZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJyknLCBjdXJzb3I6IFswLCAyMV1cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbMSwgN11cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbMywgMF1cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbNCwgM11cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbNSwgMF0gIyBib3VuZGFyeSBpcyBkaWZmZXJlbnQgYnkgZGlyZWN0aW9uXG4gICAgICAgIGVuc3VyZSAnKScsIGN1cnNvcjogWzcsIDBdXG4gICAgICAgIGVuc3VyZSAnKScsIGN1cnNvcjogWzgsIDBdXG4gICAgICAgIGVuc3VyZSAnKScsIGN1cnNvcjogWzEwLCAwXVxuICAgICAgICBlbnN1cmUgJyknLCBjdXJzb3I6IFsxMSwgMV1cblxuICAgICAgICBlbnN1cmUgJyknLCBjdXJzb3I6IFsxMiwgMTNdXG4gICAgICAgIGVuc3VyZSAnKScsIGN1cnNvcjogWzEyLCAxM11cblxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFsxMSwgMV1cbiAgICAgICAgZW5zdXJlICcoJywgY3Vyc29yOiBbMTAsIDBdXG4gICAgICAgIGVuc3VyZSAnKCcsIGN1cnNvcjogWzgsIDBdXG4gICAgICAgIGVuc3VyZSAnKCcsIGN1cnNvcjogWzcsIDBdXG4gICAgICAgIGVuc3VyZSAnKCcsIGN1cnNvcjogWzYsIDBdICMgYm91bmRhcnkgaXMgZGlmZmVyZW50IGJ5IGRpcmVjdGlvblxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFs0LCAzXVxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFszLCAwXVxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFsxLCA3XVxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFswLCAyMV1cblxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJygnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcInNraXBzIHRvIGJlZ2lubmluZyBvZiBzZW50ZW5jZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgMTVdXG4gICAgICAgIGVuc3VyZSAnKCcsIGN1cnNvcjogWzQsIDNdXG5cbiAgICAgIGl0IFwic3VwcG9ydHMgYSBjb3VudFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICczICknLCBjdXJzb3I6IFsxLCA3XVxuICAgICAgICBlbnN1cmUgJzMgKCcsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGl0IFwiY2FuIG1vdmUgc3RhcnQgb2YgYnVmZmVyIG9yIGVuZCBvZiBidWZmZXIgYXQgbWF4aW11bVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICcyIDAgKScsIGN1cnNvcjogWzEyLCAxM11cbiAgICAgICAgZW5zdXJlICcyIDAgKCcsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwic2VudGVuY2UgbW90aW9uIHdpdGggc2tpcC1ibGFuay1yb3dcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJ0ZXN0XCIsXG4gICAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAgICAgJ2cgKSc6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tbmV4dC1zZW50ZW5jZS1za2lwLWJsYW5rLXJvdydcbiAgICAgICAgICAgICAgJ2cgKCc6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tcHJldmlvdXMtc2VudGVuY2Utc2tpcC1ibGFuay1yb3cnXG5cbiAgICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIHNlbnRlbmNlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdnICknLCBjdXJzb3I6IFswLCAyMV1cbiAgICAgICAgICBlbnN1cmUgJ2cgKScsIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICdnICknLCBjdXJzb3I6IFsxLCA3XVxuICAgICAgICAgIGVuc3VyZSAnZyApJywgY3Vyc29yOiBbNCwgM11cbiAgICAgICAgICBlbnN1cmUgJ2cgKScsIGN1cnNvcjogWzcsIDBdXG4gICAgICAgICAgZW5zdXJlICdnICknLCBjdXJzb3I6IFs4LCAwXVxuICAgICAgICAgIGVuc3VyZSAnZyApJywgY3Vyc29yOiBbMTEsIDFdXG5cbiAgICAgICAgICBlbnN1cmUgJ2cgKScsIGN1cnNvcjogWzEyLCAxM11cbiAgICAgICAgICBlbnN1cmUgJ2cgKScsIGN1cnNvcjogWzEyLCAxM11cblxuICAgICAgICAgIGVuc3VyZSAnZyAoJywgY3Vyc29yOiBbMTEsIDFdXG4gICAgICAgICAgZW5zdXJlICdnICgnLCBjdXJzb3I6IFs4LCAwXVxuICAgICAgICAgIGVuc3VyZSAnZyAoJywgY3Vyc29yOiBbNywgMF1cbiAgICAgICAgICBlbnN1cmUgJ2cgKCcsIGN1cnNvcjogWzQsIDNdXG4gICAgICAgICAgZW5zdXJlICdnICgnLCBjdXJzb3I6IFsxLCA3XVxuICAgICAgICAgIGVuc3VyZSAnZyAoJywgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICBlbnN1cmUgJ2cgKCcsIGN1cnNvcjogWzAsIDIxXVxuXG4gICAgICAgICAgZW5zdXJlICdnICgnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZyAoJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwibW92aW5nIGluc2lkZSBhIGJsYW5rIGRvY3VtZW50XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBfX19fX1xuICAgICAgICAgIF9fX19fXG4gICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGl0IFwibW92ZXMgd2l0aG91dCBjcmFzaGluZ1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbMSwgNF1cbiAgICAgICAgZW5zdXJlICcpJywgY3Vyc29yOiBbMSwgNF1cbiAgICAgICAgZW5zdXJlICcoJywgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICcoJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwic2VudGVuY2Ugb25lLiBzZW50ZW5jZSB0d28uXFxuICBzZW50ZW5jZSB0aHJlZS5cIlxuXG4gICAgICBpdCAnc2VsZWN0cyB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHNlbnRlbmNlJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDIwXVxuICAgICAgICBlbnN1cmUgJ3kgKScsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcImNlIHR3by5cXG4gIFwiXG5cbiAgICAgIGl0ICdzZWxlY3RzIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGN1cnJlbnQgc2VudGVuY2UnLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMjBdXG4gICAgICAgIGVuc3VyZSAneSAoJywgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwic2VudGVuXCJcblxuICBkZXNjcmliZSBcInRoZSB7LH0ga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcblxuXG5cbiAgICAgICAgMzogcGFyYWdyYXBoLTFcbiAgICAgICAgNDogcGFyYWdyYXBoLTFcblxuXG5cbiAgICAgICAgODogcGFyYWdyYXBoLTJcblxuXG5cbiAgICAgICAgMTI6IHBhcmFncmFwaC0zXG4gICAgICAgIDEzOiBwYXJhZ3JhcGgtM1xuXG5cbiAgICAgICAgMTY6IHBhcmFncHJhaC00XFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhlIHBhcmFncmFwaFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICd9JywgY3Vyc29yOiBbNSwgMF1cbiAgICAgICAgZW5zdXJlICd9JywgY3Vyc29yOiBbOSwgMF1cbiAgICAgICAgZW5zdXJlICd9JywgY3Vyc29yOiBbMTQsIDBdXG4gICAgICAgIGVuc3VyZSAneycsIGN1cnNvcjogWzExLCAwXVxuICAgICAgICBlbnN1cmUgJ3snLCBjdXJzb3I6IFs3LCAwXVxuICAgICAgICBlbnN1cmUgJ3snLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICBpdCBcInN1cHBvcnQgY291bnRcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnMyB9JywgY3Vyc29yOiBbMTQsIDBdXG4gICAgICAgIGVuc3VyZSAnMyB7JywgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgaXQgXCJjYW4gbW92ZSBzdGFydCBvZiBidWZmZXIgb3IgZW5kIG9mIGJ1ZmZlciBhdCBtYXhpbXVtXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJzEgMCB9JywgY3Vyc29yOiBbMTYsIDE0XVxuICAgICAgICBlbnN1cmUgJzEgMCB7JywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGl0ICdzZWxlY3RzIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgcGFyYWdyYXBoJywgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzMsIDNdXG4gICAgICAgIGVuc3VyZSAneSB9JywgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwicGFyYWdyYXBoLTFcXG40OiBwYXJhZ3JhcGgtMVxcblwiXG4gICAgICBpdCAnc2VsZWN0cyB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHBhcmFncmFwaCcsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAzXVxuICAgICAgICBlbnN1cmUgJ3kgeycsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIlxcbjM6IHBhcmFncmFwaC0xXFxuNDogXCJcblxuICBkZXNjcmliZSBcInRoZSBiIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dENfOiBcIlwiXCJcbiAgICAgICAgX2FiIGNkZTErLV9cbiAgICAgICAgX3h5elxuXG4gICAgICAgIHppcCB9XG4gICAgICAgIF98bGFzdFxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBwcmV2aW91cyB3b3JkXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnYicsIHRleHRDOiBcIiBhYiBjZGUxKy0gXFxuIHh5elxcblxcbnppcCB8fVxcbiBsYXN0XCJcbiAgICAgICAgZW5zdXJlICdiJywgdGV4dEM6IFwiIGFiIGNkZTErLSBcXG4geHl6XFxuXFxufHppcCB9XFxuIGxhc3RcIlxuICAgICAgICBlbnN1cmUgJ2InLCB0ZXh0QzogXCIgYWIgY2RlMSstIFxcbiB4eXpcXG58XFxuemlwIH1cXG4gbGFzdFwiXG4gICAgICAgIGVuc3VyZSAnYicsIHRleHRDOiBcIiBhYiBjZGUxKy0gXFxuIHx4eXpcXG5cXG56aXAgfVxcbiBsYXN0XCJcbiAgICAgICAgZW5zdXJlICdiJywgdGV4dEM6IFwiIGFiIGNkZTF8Ky0gXFxuIHh5elxcblxcbnppcCB9XFxuIGxhc3RcIlxuICAgICAgICBlbnN1cmUgJ2InLCB0ZXh0QzogXCIgYWIgfGNkZTErLSBcXG4geHl6XFxuXFxuemlwIH1cXG4gbGFzdFwiXG4gICAgICAgIGVuc3VyZSAnYicsIHRleHRDOiBcIiB8YWIgY2RlMSstIFxcbiB4eXpcXG5cXG56aXAgfVxcbiBsYXN0XCJcblxuICAgICAgICAjIEdvIHRvIHN0YXJ0IG9mIHRoZSBmaWxlLCBhZnRlciBtb3ZpbmcgcGFzdCB0aGUgZmlyc3Qgd29yZFxuICAgICAgICBlbnN1cmUgJ2InLCB0ZXh0QzogXCJ8IGFiIGNkZTErLSBcXG4geHl6XFxuXFxuemlwIH1cXG4gbGFzdFwiXG4gICAgICAgICMgRG8gbm90aGluZ1xuICAgICAgICBlbnN1cmUgJ2InLCB0ZXh0QzogXCJ8IGFiIGNkZTErLSBcXG4geHl6XFxuXFxuemlwIH1cXG4gbGFzdFwiXG5cbiAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICBkZXNjcmliZSBcIndpdGhpbiBhIHdvcmRcIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGN1cnJlbnQgd29yZFwiLCAtPlxuICAgICAgICAgIHNldCB0ZXh0QzogXCIgYXxiIGNkXCI7IGVuc3VyZSAneSBiJywgdGV4dEM6IFwiIHxhYiBjZFwiLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJ2EnXG5cbiAgICAgIGRlc2NyaWJlIFwiYmV0d2VlbiB3b3Jkc1wiLCAtPlxuICAgICAgICBpdCBcInNlbGVjdHMgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGFzdCB3b3JkXCIsIC0+XG4gICAgICAgICAgc2V0IHRleHRDOiBcIiBhYiB8Y2RcIjsgZW5zdXJlICd5IGInLCB0ZXh0QzogXCIgfGFiIGNkXCIsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnYWIgJ1xuXG4gIGRlc2NyaWJlIFwidGhlIEIga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBjZGUxKy0gYWJcbiAgICAgICAgICBcXHQgeHl6LTEyM1xuXG4gICAgICAgICAgIHppcFxcblxuICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbNCwgMF1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHByZXZpb3VzIHdvcmRcIiwgLT5cbiAgICAgICAgZW5zdXJlICdCJywgY3Vyc29yOiBbMywgMV1cbiAgICAgICAgZW5zdXJlICdCJywgY3Vyc29yOiBbMiwgMF1cbiAgICAgICAgZW5zdXJlICdCJywgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgZW5zdXJlICdCJywgY3Vyc29yOiBbMCwgN11cbiAgICAgICAgZW5zdXJlICdCJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGl0IFwic2VsZWN0cyB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSB3aG9sZSB3b3JkXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCA4XVxuICAgICAgICBlbnN1cmUgJ3kgQicsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAneHl6LTEyJyAjIGJlY2F1c2UgY3Vyc29yIGlzIG9uIHRoZSBgM2BcblxuICAgICAgaXQgXCJkb2Vzbid0IGdvIHBhc3QgdGhlIGJlZ2lubmluZyBvZiB0aGUgZmlsZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnYWJjJ1xuICAgICAgICBlbnN1cmUgJ3kgQicsIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnYWJjJ1xuXG4gIGRlc2NyaWJlIFwidGhlIF4ga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0QzogXCJ8ICBhYmNkZVwiXG5cbiAgICBkZXNjcmliZSBcImZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnXicsIGN1cnNvcjogWzAsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgJ3NlbGVjdHMgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgbGluZScsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIF4nLFxuICAgICAgICAgICAgdGV4dDogJ2FiY2RlJ1xuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgaXQgJ3NlbGVjdHMgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgbGluZScsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIEknLCB0ZXh0OiAnYWJjZGUnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzdGF5cyBwdXRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ14nLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGl0IFwiZG9lcyBub3RoaW5nXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIF4nLFxuICAgICAgICAgICAgdGV4dDogJyAgYWJjZGUnXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAyXVxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHRoZSBtaWRkbGUgb2YgYSB3b3JkXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCA0XVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdeJywgY3Vyc29yOiBbMCwgMl1cblxuICAgICAgZGVzY3JpYmUgXCJhcyBhIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBpdCAnc2VsZWN0cyB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBsaW5lJywgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgXicsXG4gICAgICAgICAgICB0ZXh0OiAnICBjZGUnXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAyXVxuICAgICAgICBpdCAnc2VsZWN0cyB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBsaW5lJywgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgSScsIHRleHQ6ICcgIGNkZScsIGN1cnNvcjogWzAsIDJdLFxuXG4gIGRlc2NyaWJlIFwidGhlIDAga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0QzogXCIgIGFifGNkZVwiXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGZpcnN0IGNvbHVtblwiLCAtPlxuICAgICAgICBlbnN1cmUgJzAnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIHNlbGVjdGlvblwiLCAtPlxuICAgICAgaXQgJ3NlbGVjdHMgdG8gdGhlIGZpcnN0IGNvbHVtbiBvZiB0aGUgbGluZScsIC0+XG4gICAgICAgIGVuc3VyZSAnZCAwJywgdGV4dDogJ2NkZScsIGN1cnNvcjogWzAsIDBdXG5cbiAgZGVzY3JpYmUgXCJnIDAsIGcgXiBhbmQgZyAkXCIsIC0+XG4gICAgZW5hYmxlU29mdFdyYXBBbmRFbnN1cmUgPSAtPlxuICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpXG4gICAgICBleHBlY3QoZWRpdG9yLmxpbmVUZXh0Rm9yU2NyZWVuUm93KDApKS50b0JlKFwiIDEyMzQ1NjdcIilcbiAgICAgIGV4cGVjdChlZGl0b3IubGluZVRleHRGb3JTY3JlZW5Sb3coMSkpLnRvQmUoXCIgODlCMTIzNFwiKSAjIGZpcnN0IHNwYWNlIGlzIHNvZnR3cmFwIGluZGVudGF0aW9uXG4gICAgICBleHBlY3QoZWRpdG9yLmxpbmVUZXh0Rm9yU2NyZWVuUm93KDIpKS50b0JlKFwiIDU2Nzg5QzFcIikgIyBmaXJzdCBzcGFjZSBpcyBzb2Z0d3JhcCBpbmRlbnRhdGlvblxuICAgICAgZXhwZWN0KGVkaXRvci5saW5lVGV4dEZvclNjcmVlblJvdygzKSkudG9CZShcIiAyMzQ1Njc4XCIpICMgZmlyc3Qgc3BhY2UgaXMgc29mdHdyYXAgaW5kZW50YXRpb25cbiAgICAgIGV4cGVjdChlZGl0b3IubGluZVRleHRGb3JTY3JlZW5Sb3coNCkpLnRvQmUoXCIgOVwiKSAjIGZpcnN0IHNwYWNlIGlzIHNvZnR3cmFwIGluZGVudGF0aW9uXG5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAjIEZvcmNlIHNjcm9sbGJhcnMgdG8gYmUgdmlzaWJsZSByZWdhcmRsZXNzIG9mIGxvY2FsIHN5c3RlbSBjb25maWd1cmF0aW9uXG4gICAgICBzY3JvbGxiYXJTdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJylcbiAgICAgIHNjcm9sbGJhclN0eWxlLnRleHRDb250ZW50ID0gJzo6LXdlYmtpdC1zY3JvbGxiYXIgeyAtd2Via2l0LWFwcGVhcmFuY2U6IG5vbmUgfSdcbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oc2Nyb2xsYmFyU3R5bGUpXG5cblxuICAgICAgc2V0IHRleHRfOiBcIlwiXCJcbiAgICAgIF8xMjM0NTY3ODlCMTIzNDU2Nzg5QzEyMzQ1Njc4OVxuICAgICAgXCJcIlwiXG4gICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGdldFZpZXcoYXRvbS53b3Jrc3BhY2UpKVxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIHNldEVkaXRvcldpZHRoSW5DaGFyYWN0ZXJzKGVkaXRvciwgMTApXG5cbiAgICBkZXNjcmliZSBcInRoZSBnIDAga2V5YmluZGluZ1wiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJhbGxvd01vdmVUb09mZlNjcmVlbkNvbHVtbk9uU2NyZWVuTGluZU1vdGlvbiA9IHRydWUoZGVmYXVsdClcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXR0aW5ncy5zZXQoJ2FsbG93TW92ZVRvT2ZmU2NyZWVuQ29sdW1uT25TY3JlZW5MaW5lTW90aW9uJywgdHJ1ZSlcblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gZmFsc2UsIGZpcnN0Q29sdW1uSXNWaXNpYmxlID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGNvbHVtbiAwIG9mIHNjcmVlbiBsaW5lXCIsIC0+IGVuc3VyZSBcImcgMFwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwic29mdHdyYXAgPSBmYWxzZSwgZmlyc3RDb2x1bW5Jc1Zpc2libGUgPSBmYWxzZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDE1XTsgZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtbigxMClcbiAgICAgICAgICBpdCBcIm1vdmUgdG8gY29sdW1uIDAgb2Ygc2NyZWVuIGxpbmVcIiwgLT4gZW5zdXJlIFwiZyAwXCIsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzb2Z0d3JhcCA9IHRydWVcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+IGVuYWJsZVNvZnRXcmFwQW5kRW5zdXJlKClcbiAgICAgICAgICBpdCBcIm1vdmUgdG8gY29sdW1uIDAgb2Ygc2NyZWVuIGxpbmVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3JTY3JlZW46IFswLCAzXTsgZW5zdXJlIFwiZyAwXCIsIGN1cnNvclNjcmVlbjogWzAsIDBdXG4gICAgICAgICAgICBzZXQgY3Vyc29yU2NyZWVuOiBbMSwgM107IGVuc3VyZSBcImcgMFwiLCBjdXJzb3JTY3JlZW46IFsxLCAxXSAjIHNraXAgc29mdHdyYXAgaW5kZW50YXRpb24uXG5cbiAgICAgIGRlc2NyaWJlIFwiYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24gPSBmYWxzZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IHNldHRpbmdzLnNldCgnYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24nLCBmYWxzZSlcblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gZmFsc2UsIGZpcnN0Q29sdW1uSXNWaXNpYmxlID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGNvbHVtbiAwIG9mIHNjcmVlbiBsaW5lXCIsIC0+IGVuc3VyZSBcImcgMFwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAgIGRlc2NyaWJlIFwic29mdHdyYXAgPSBmYWxzZSwgZmlyc3RDb2x1bW5Jc1Zpc2libGUgPSBmYWxzZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDE1XTsgZWRpdG9yLnNldEZpcnN0VmlzaWJsZVNjcmVlbkNvbHVtbigxMClcbiAgICAgICAgICBpdCBcIm1vdmUgdG8gZmlyc3QgdmlzaWJsZSBjb2x1bSBvZiBzY3JlZW4gbGluZVwiLCAtPiBlbnN1cmUgXCJnIDBcIiwgY3Vyc29yOiBbMCwgMTBdXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzb2Z0d3JhcCA9IHRydWVcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+IGVuYWJsZVNvZnRXcmFwQW5kRW5zdXJlKClcbiAgICAgICAgICBpdCBcIm1vdmUgdG8gY29sdW1uIDAgb2Ygc2NyZWVuIGxpbmVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3JTY3JlZW46IFswLCAzXTsgZW5zdXJlIFwiZyAwXCIsIGN1cnNvclNjcmVlbjogWzAsIDBdXG4gICAgICAgICAgICBzZXQgY3Vyc29yU2NyZWVuOiBbMSwgM107IGVuc3VyZSBcImcgMFwiLCBjdXJzb3JTY3JlZW46IFsxLCAxXSAjIHNraXAgc29mdHdyYXAgaW5kZW50YXRpb24uXG5cbiAgICBkZXNjcmliZSBcInRoZSBnIF4ga2V5YmluZGluZ1wiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJhbGxvd01vdmVUb09mZlNjcmVlbkNvbHVtbk9uU2NyZWVuTGluZU1vdGlvbiA9IHRydWUoZGVmYXVsdClcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXR0aW5ncy5zZXQoJ2FsbG93TW92ZVRvT2ZmU2NyZWVuQ29sdW1uT25TY3JlZW5MaW5lTW90aW9uJywgdHJ1ZSlcblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gZmFsc2UsIGZpcnN0Q29sdW1uSXNWaXNpYmxlID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGZpcnN0LWNoYXIgb2Ygc2NyZWVuIGxpbmVcIiwgLT4gZW5zdXJlIFwiZyBeXCIsIGN1cnNvcjogWzAsIDFdXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzb2Z0d3JhcCA9IGZhbHNlLCBmaXJzdENvbHVtbklzVmlzaWJsZSA9IGZhbHNlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXQgY3Vyc29yOiBbMCwgMTVdOyBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uKDEwKVxuICAgICAgICAgIGl0IFwibW92ZSB0byBmaXJzdC1jaGFyIG9mIHNjcmVlbiBsaW5lXCIsIC0+IGVuc3VyZSBcImcgXlwiLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgICAgIGRlc2NyaWJlIFwic29mdHdyYXAgPSB0cnVlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPiBlbmFibGVTb2Z0V3JhcEFuZEVuc3VyZSgpXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGZpcnN0LWNoYXIgb2Ygc2NyZWVuIGxpbmVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3JTY3JlZW46IFswLCAzXTsgZW5zdXJlIFwiZyBeXCIsIGN1cnNvclNjcmVlbjogWzAsIDFdXG4gICAgICAgICAgICBzZXQgY3Vyc29yU2NyZWVuOiBbMSwgM107IGVuc3VyZSBcImcgXlwiLCBjdXJzb3JTY3JlZW46IFsxLCAxXSAjIHNraXAgc29mdHdyYXAgaW5kZW50YXRpb24uXG5cbiAgICAgIGRlc2NyaWJlIFwiYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24gPSBmYWxzZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IHNldHRpbmdzLnNldCgnYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24nLCBmYWxzZSlcblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gZmFsc2UsIGZpcnN0Q29sdW1uSXNWaXNpYmxlID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGZpcnN0LWNoYXIgb2Ygc2NyZWVuIGxpbmVcIiwgLT4gZW5zdXJlIFwiZyBeXCIsIGN1cnNvcjogWzAsIDFdXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzb2Z0d3JhcCA9IGZhbHNlLCBmaXJzdENvbHVtbklzVmlzaWJsZSA9IGZhbHNlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXQgY3Vyc29yOiBbMCwgMTVdOyBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uKDEwKVxuICAgICAgICAgIGl0IFwibW92ZSB0byBmaXJzdC1jaGFyIG9mIHNjcmVlbiBsaW5lXCIsIC0+IGVuc3VyZSBcImcgXlwiLCBjdXJzb3I6IFswLCAxMF1cblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gZW5hYmxlU29mdFdyYXBBbmRFbnN1cmUoKVxuICAgICAgICAgIGl0IFwibW92ZSB0byBmaXJzdC1jaGFyIG9mIHNjcmVlbiBsaW5lXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yU2NyZWVuOiBbMCwgM107IGVuc3VyZSBcImcgXlwiLCBjdXJzb3JTY3JlZW46IFswLCAxXVxuICAgICAgICAgICAgc2V0IGN1cnNvclNjcmVlbjogWzEsIDNdOyBlbnN1cmUgXCJnIF5cIiwgY3Vyc29yU2NyZWVuOiBbMSwgMV0gIyBza2lwIHNvZnR3cmFwIGluZGVudGF0aW9uLlxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgZyAkIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwiYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24gPSB0cnVlKGRlZmF1bHQpXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0dGluZ3Muc2V0KCdhbGxvd01vdmVUb09mZlNjcmVlbkNvbHVtbk9uU2NyZWVuTGluZU1vdGlvbicsIHRydWUpXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzb2Z0d3JhcCA9IGZhbHNlLCBsYXN0Q29sdW1uSXNWaXNpYmxlID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDI3XVxuICAgICAgICAgIGl0IFwibW92ZSB0byBsYXN0LWNoYXIgb2Ygc2NyZWVuIGxpbmVcIiwgLT4gZW5zdXJlIFwiZyAkXCIsIGN1cnNvcjogWzAsIDI5XVxuXG4gICAgICAgIGRlc2NyaWJlIFwic29mdHdyYXAgPSBmYWxzZSwgbGFzdENvbHVtbklzVmlzaWJsZSA9IGZhbHNlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXQgY3Vyc29yOiBbMCwgMTVdOyBlZGl0b3Iuc2V0Rmlyc3RWaXNpYmxlU2NyZWVuQ29sdW1uKDEwKVxuICAgICAgICAgIGl0IFwibW92ZSB0byBsYXN0LWNoYXIgb2Ygc2NyZWVuIGxpbmVcIiwgLT4gZW5zdXJlIFwiZyAkXCIsIGN1cnNvcjogWzAsIDI5XVxuXG4gICAgICAgIGRlc2NyaWJlIFwic29mdHdyYXAgPSB0cnVlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPiBlbmFibGVTb2Z0V3JhcEFuZEVuc3VyZSgpXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGxhc3QtY2hhciBvZiBzY3JlZW4gbGluZVwiLCAtPlxuICAgICAgICAgICAgc2V0IGN1cnNvclNjcmVlbjogWzAsIDNdOyBlbnN1cmUgXCJnICRcIiwgY3Vyc29yU2NyZWVuOiBbMCwgN11cbiAgICAgICAgICAgIHNldCBjdXJzb3JTY3JlZW46IFsxLCAzXTsgZW5zdXJlIFwiZyAkXCIsIGN1cnNvclNjcmVlbjogWzEsIDddXG5cbiAgICAgIGRlc2NyaWJlIFwiYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24gPSBmYWxzZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+IHNldHRpbmdzLnNldCgnYWxsb3dNb3ZlVG9PZmZTY3JlZW5Db2x1bW5PblNjcmVlbkxpbmVNb3Rpb24nLCBmYWxzZSlcblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gZmFsc2UsIGxhc3RDb2x1bW5Jc1Zpc2libGUgPSB0cnVlXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPiBzZXQgY3Vyc29yOiBbMCwgMjddXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGxhc3QtY2hhciBvZiBzY3JlZW4gbGluZVwiLCAtPiBlbnN1cmUgXCJnICRcIiwgY3Vyc29yOiBbMCwgMjldXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzb2Z0d3JhcCA9IGZhbHNlLCBsYXN0Q29sdW1uSXNWaXNpYmxlID0gZmFsc2VcIiwgLT5cbiAgICAgICAgICBiZWZvcmVFYWNoIC0+IHNldCBjdXJzb3I6IFswLCAxNV07IGVkaXRvci5zZXRGaXJzdFZpc2libGVTY3JlZW5Db2x1bW4oMTApXG4gICAgICAgICAgaXQgXCJtb3ZlIHRvIGxhc3QtY2hhciBpbiB2aXNpYmxlIHNjcmVlbiBsaW5lXCIsIC0+IGVuc3VyZSBcImcgJFwiLCBjdXJzb3I6IFswLCAxOF1cblxuICAgICAgICBkZXNjcmliZSBcInNvZnR3cmFwID0gdHJ1ZVwiLCAtPlxuICAgICAgICAgIGJlZm9yZUVhY2ggLT4gZW5hYmxlU29mdFdyYXBBbmRFbnN1cmUoKVxuICAgICAgICAgIGl0IFwibW92ZSB0byBsYXN0LWNoYXIgb2Ygc2NyZWVuIGxpbmVcIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3JTY3JlZW46IFswLCAzXTsgZW5zdXJlIFwiZyAkXCIsIGN1cnNvclNjcmVlbjogWzAsIDddXG4gICAgICAgICAgICBzZXQgY3Vyc29yU2NyZWVuOiBbMSwgM107IGVuc3VyZSBcImcgJFwiLCBjdXJzb3JTY3JlZW46IFsxLCA3XVxuXG4gIGRlc2NyaWJlIFwidGhlIHwga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiBcIiAgYWJjZGVcIiwgY3Vyc29yOiBbMCwgNF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgbnVtYmVyIGNvbHVtblwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3wnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJzEgfCcsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnMyB8JywgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgZW5zdXJlICc0IHwnLCBjdXJzb3I6IFswLCAzXVxuXG4gICAgZGVzY3JpYmUgXCJhcyBvcGVyYXRvcidzIHRhcmdldFwiLCAtPlxuICAgICAgaXQgJ2JlaGF2ZSBleGNsdXNpdmVseScsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2QgNCB8JywgdGV4dDogJ2JjZGUnLCBjdXJzb3I6IFswLCAwXVxuXG4gIGRlc2NyaWJlIFwidGhlICQga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIiAgYWJjZGVcXG5cXG4xMjM0NTY3ODkwXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgNF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb24gZnJvbSBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGVuZCBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICckJywgY3Vyc29yOiBbMSwgMF1cblxuICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICMgRklYTUU6IFNlZSBhdG9tL3ZpbS1tb2RlIzJcbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZW5kIG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnJCcsIGN1cnNvcjogWzAsIDZdXG5cbiAgICAgIGl0IFwic2V0IGdvYWxDb2x1bW4gSW5maW5pdHlcIiwgLT5cbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ29hbENvbHVtbikudG9CZShudWxsKVxuICAgICAgICBlbnN1cmUgJyQnLCBjdXJzb3I6IFswLCA2XVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nb2FsQ29sdW1uKS50b0JlKEluZmluaXR5KVxuXG4gICAgICBpdCBcInNob3VsZCByZW1haW4gaW4gdGhlIGxhc3QgY29sdW1uIHdoZW4gbW92aW5nIGRvd25cIiwgLT5cbiAgICAgICAgZW5zdXJlICckIGonLCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJ2onLCBjdXJzb3I6IFsyLCA5XVxuXG4gICAgICBpdCBcInN1cHBvcnQgY291bnRcIiwgLT5cbiAgICAgICAgZW5zdXJlICczICQnLCBjdXJzb3I6IFsyLCA5XVxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIHNlbGVjdGlvblwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBlbmQgb2YgdGhlIGxpbmVzXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCAkJyxcbiAgICAgICAgICB0ZXh0OiBcIiAgYWJcXG5cXG4xMjM0NTY3ODkwXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAzXVxuXG4gIGRlc2NyaWJlIFwidGhlIC0ga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiBcIlwiXCJcbiAgICAgICAgYWJjZGVmZ1xuICAgICAgICAgIGFiY1xuICAgICAgICAgIGFiY1xcblxuICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwiZnJvbSB0aGUgbWlkZGxlIG9mIGEgbGluZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgM11cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBsYXN0IGNoYXJhY3RlciBvZiB0aGUgcHJldmlvdXMgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnLScsIGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBjdXJyZW50IGFuZCBwcmV2aW91cyBsaW5lXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIC0nLCB0ZXh0OiBcIiAgYWJjXFxuXCIsIGN1cnNvcjogWzAsIDJdXG5cbiAgICBkZXNjcmliZSBcImZyb20gdGhlIGZpcnN0IGNoYXJhY3RlciBvZiBhIGxpbmUgaW5kZW50ZWQgdGhlIHNhbWUgYXMgdGhlIHByZXZpb3VzIG9uZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMl1cblxuICAgICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIHByZXZpb3VzIGxpbmUgKGRpcmVjdGx5IGFib3ZlKVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnLScsIGN1cnNvcjogWzEsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIHByZXZpb3VzIGxpbmUgKGRpcmVjdGx5IGFib3ZlKVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZCAtJywgdGV4dDogXCJhYmNkZWZnXFxuXCJcbiAgICAgICAgICAjIEZJWE1FIGNvbW1lbnRlZCBvdXQgYmVjYXVzZSB0aGUgY29sdW1uIGlzIHdyb25nIGR1ZSB0byBhIGJ1ZyBpbiBga2A7IHJlLWVuYWJsZSB3aGVuIGBrYCBpcyBmaXhlZFxuICAgICAgICAgICMgZW5zdXJlIGN1cnNvcjogWzAsIDJdXG5cbiAgICBkZXNjcmliZSBcImZyb20gdGhlIGJlZ2lubmluZyBvZiBhIGxpbmUgcHJlY2VkZWQgYnkgYW4gaW5kZW50ZWQgbGluZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGUgcHJldmlvdXMgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnLScsIGN1cnNvcjogWzEsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIHByZXZpb3VzIGxpbmVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgLScsIHRleHQ6IFwiYWJjZGVmZ1xcblwiXG5cbiAgICBkZXNjcmliZSBcIndpdGggYSBjb3VudFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIjFcXG4yXFxuM1xcbjRcXG41XFxuNlxcblwiXG4gICAgICAgICAgY3Vyc29yOiBbNCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBvZiB0aGF0IG1hbnkgbGluZXMgcHJldmlvdXNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJzMgLScsIGN1cnNvcjogWzEsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBjdXJyZW50IGxpbmUgcGx1cyB0aGF0IG1hbnkgcHJldmlvdXMgbGluZXNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgMyAtJyxcbiAgICAgICAgICAgIHRleHQ6IFwiMVxcbjZcXG5cIixcbiAgICAgICAgICAgIGN1cnNvcjogWzEsIDBdLFxuXG4gIGRlc2NyaWJlIFwidGhlICsga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0XzogXCJcIlwiXG4gICAgICBfX2FiY1xuICAgICAgX19hYmNcbiAgICAgIGFiY2RlZmdcXG5cbiAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHRoZSBtaWRkbGUgb2YgYSBsaW5lXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAzXVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBuZXh0IGxpbmVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJysnLCBjdXJzb3I6IFsyLCAwXVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgY3VycmVudCBhbmQgbmV4dCBsaW5lXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkICsnLCB0ZXh0OiBcIiAgYWJjXFxuXCJcblxuICAgIGRlc2NyaWJlIFwiZnJvbSB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIGEgbGluZSBpbmRlbnRlZCB0aGUgc2FtZSBhcyB0aGUgbmV4dCBvbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJtb3ZlcyB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBuZXh0IGxpbmUgKGRpcmVjdGx5IGJlbG93KVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnKycsIGN1cnNvcjogWzEsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIG5leHQgbGluZSAoZGlyZWN0bHkgYmVsb3cpXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkICsnLCB0ZXh0OiBcImFiY2RlZmdcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHRoZSBiZWdpbm5pbmcgb2YgYSBsaW5lIGZvbGxvd2VkIGJ5IGFuIGluZGVudGVkIGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT4gc2V0IGN1cnNvcjogWzAsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIG5leHQgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnKycsIGN1cnNvcjogWzEsIDJdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhlIG5leHQgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZCArJyxcbiAgICAgICAgICAgIHRleHQ6IFwiYWJjZGVmZ1xcblwiXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIGEgY291bnRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIxXFxuMlxcbjNcXG40XFxuNVxcbjZcXG5cIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBtb3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBmaXJzdCBjaGFyYWN0ZXIgb2YgdGhhdCBtYW55IGxpbmVzIGZvbGxvd2luZ1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnMyArJywgY3Vyc29yOiBbNCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJhcyBhIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGN1cnJlbnQgbGluZSBwbHVzIHRoYXQgbWFueSBmb2xsb3dpbmcgbGluZXNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgMyArJyxcbiAgICAgICAgICAgIHRleHQ6IFwiMVxcbjZcXG5cIlxuICAgICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICBkZXNjcmliZSBcInRoZSBfIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dF86IFwiXCJcIlxuICAgICAgICBfX2FiY1xuICAgICAgICBfX2FiY1xuICAgICAgICBhYmNkZWZnXFxuXG4gICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJmcm9tIHRoZSBtaWRkbGUgb2YgYSBsaW5lXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+IHNldCBjdXJzb3I6IFsxLCAzXVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoZSBjdXJyZW50IGxpbmVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ18nLCBjdXJzb3I6IFsxLCAyXVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgY3VycmVudCBsaW5lXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIF8nLFxuICAgICAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAgICAgX19hYmNcbiAgICAgICAgICAgIGFiY2RlZmdcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICAgIGRlc2NyaWJlIFwid2l0aCBhIGNvdW50XCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiMVxcbjJcXG4zXFxuNFxcbjVcXG42XFxuXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZmlyc3QgY2hhcmFjdGVyIG9mIHRoYXQgbWFueSBsaW5lcyBmb2xsb3dpbmdcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJzMgXycsIGN1cnNvcjogWzMsIDBdXG5cbiAgICAgIGRlc2NyaWJlIFwiYXMgYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBjdXJyZW50IGxpbmUgcGx1cyB0aGF0IG1hbnkgZm9sbG93aW5nIGxpbmVzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIDMgXycsXG4gICAgICAgICAgICB0ZXh0OiBcIjFcXG41XFxuNlxcblwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuXG4gIGRlc2NyaWJlIFwidGhlIGVudGVyIGtleWJpbmRpbmdcIiwgLT5cbiAgICAjIFtGSVhNRV0gRGlydHkgdGVzdCwgd2hhdHMgdGhpcyE/XG4gICAgc3RhcnRpbmdUZXh0ID0gXCIgIGFiY1xcbiAgYWJjXFxuYWJjZGVmZ1xcblwiXG5cbiAgICBkZXNjcmliZSBcImZyb20gdGhlIG1pZGRsZSBvZiBhIGxpbmVcIiwgLT5cbiAgICAgIHN0YXJ0aW5nQ3Vyc29yUG9zaXRpb24gPSBbMSwgM11cblxuICAgICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgICBpdCBcImFjdHMgdGhlIHNhbWUgYXMgdGhlICsga2V5YmluZGluZ1wiLCAtPlxuICAgICAgICAgICMgZG8gaXQgd2l0aCArIGFuZCBzYXZlIHRoZSByZXN1bHRzXG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBzdGFydGluZ1RleHRcbiAgICAgICAgICAgIGN1cnNvcjogc3RhcnRpbmdDdXJzb3JQb3NpdGlvblxuICAgICAgICAgIGtleXN0cm9rZSAnKydcbiAgICAgICAgICByZWZlcmVuY2VDdXJzb3JQb3NpdGlvbiA9IGVkaXRvci5nZXRDdXJzb3JTY3JlZW5Qb3NpdGlvbigpXG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBzdGFydGluZ1RleHRcbiAgICAgICAgICAgIGN1cnNvcjogc3RhcnRpbmdDdXJzb3JQb3NpdGlvblxuICAgICAgICAgIGVuc3VyZSAnZW50ZXInLFxuICAgICAgICAgICAgY3Vyc29yOiByZWZlcmVuY2VDdXJzb3JQb3NpdGlvblxuXG4gICAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGl0IFwiYWN0cyB0aGUgc2FtZSBhcyB0aGUgKyBrZXliaW5kaW5nXCIsIC0+XG4gICAgICAgICAgIyBkbyBpdCB3aXRoICsgYW5kIHNhdmUgdGhlIHJlc3VsdHNcbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IHN0YXJ0aW5nVGV4dFxuICAgICAgICAgICAgY3Vyc29yOiBzdGFydGluZ0N1cnNvclBvc2l0aW9uXG5cbiAgICAgICAgICBrZXlzdHJva2UgJ2QgKydcbiAgICAgICAgICByZWZlcmVuY2VUZXh0ID0gZWRpdG9yLmdldFRleHQoKVxuICAgICAgICAgIHJlZmVyZW5jZUN1cnNvclBvc2l0aW9uID0gZWRpdG9yLmdldEN1cnNvclNjcmVlblBvc2l0aW9uKClcblxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogc3RhcnRpbmdUZXh0XG4gICAgICAgICAgICBjdXJzb3I6IHN0YXJ0aW5nQ3Vyc29yUG9zaXRpb25cbiAgICAgICAgICBlbnN1cmUgJ2QgZW50ZXInLFxuICAgICAgICAgICAgdGV4dDogcmVmZXJlbmNlVGV4dFxuICAgICAgICAgICAgY3Vyc29yOiByZWZlcmVuY2VDdXJzb3JQb3NpdGlvblxuXG4gIGRlc2NyaWJlIFwidGhlIGdnIGtleWJpbmRpbmcgd2l0aCBzdGF5T25WZXJ0aWNhbE1vdGlvbiA9IGZhbHNlXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25WZXJ0aWNhbE1vdGlvbicsIGZhbHNlKVxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAxYWJjXG4gICAgICAgICAgIDJcbiAgICAgICAgICAzXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzAsIDJdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBkZXNjcmliZSBcImluIG5vcm1hbCBtb2RlXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaXJzdCBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgZW5zdXJlICdnIGcnLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgICAgIGl0IFwibW92ZSB0byBzYW1lIHBvc2l0aW9uIGlmIGl0cyBvbiBmaXJzdCBsaW5lIGFuZCBmaXJzdCBjaGFyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdnIGcnLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgICBkZXNjcmliZSBcImluIGxpbmV3aXNlIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGl0IFwic2VsZWN0cyB0byB0aGUgZmlyc3QgbGluZSBpbiB0aGUgZmlsZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnViBnIGcnLFxuICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIiAxYWJjXFxuIDJcXG5cIlxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJpbiBjaGFyYWN0ZXJ3aXNlIHZpc3VhbCBtb2RlXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIHRoZSBmaXJzdCBsaW5lIGluIHRoZSBmaWxlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICd2IGcgZycsXG4gICAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiMWFiY1xcbiAyXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzAsIDFdXG5cbiAgICBkZXNjcmliZSBcIndoZW4gY291bnQgc3BlY2lmaWVkXCIsIC0+XG4gICAgICBkZXNjcmliZSBcImluIG5vcm1hbCBtb2RlXCIsIC0+XG4gICAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byBmaXJzdCBjaGFyIG9mIGEgc3BlY2lmaWVkIGxpbmVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJzIgZyBnJywgY3Vyc29yOiBbMSwgMV1cblxuICAgICAgZGVzY3JpYmUgXCJpbiBsaW5ld2lzZSB2aXN1YWwgbW90aW9uXCIsIC0+XG4gICAgICAgIGl0IFwic2VsZWN0cyB0byBhIHNwZWNpZmllZCBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgZW5zdXJlICdWIDIgZyBnJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCIgMlxcbjNcXG5cIlxuICAgICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJpbiBjaGFyYWN0ZXJ3aXNlIHZpc3VhbCBtb3Rpb25cIiwgLT5cbiAgICAgICAgaXQgXCJzZWxlY3RzIHRvIGEgZmlyc3QgY2hhcmFjdGVyIG9mIHNwZWNpZmllZCBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgICAgZW5zdXJlICd2IDIgZyBnJyxcbiAgICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCIyXFxuM1wiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuXG4gIGRlc2NyaWJlIFwidGhlIGdfIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dF86IFwiXCJcIlxuICAgICAgICAxX19cbiAgICAgICAgICAgIDJfX1xuICAgICAgICAgM2FiY1xuICAgICAgICBfXG4gICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIG1vdGlvblwiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBsYXN0IG5vbmJsYW5rIGNoYXJhY3RlclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICdnIF8nLCBjdXJzb3I6IFsxLCA0XVxuXG4gICAgICBpdCBcIndpbGwgbW92ZSB0aGUgY3Vyc29yIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUgaWYgbmVjZXNzYXJ5XCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgICBlbnN1cmUgJ2cgXycsIGN1cnNvcjogWzAsIDBdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgcmVwZWF0ZWQgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgZG93bndhcmQgYW5kIG91dHdhcmRcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnMiBnIF8nLCBjdXJzb3I6IFsxLCA0XVxuXG4gICAgZGVzY3JpYmUgXCJhcyBhIHNlbGVjdGlvblwiLCAtPlxuICAgICAgaXQgXCJzZWxlY3RzIHRoZSBjdXJyZW50IGxpbmUgZXhjbHVkaW5nIHdoaXRlc3BhY2VcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzEsIDJdXG4gICAgICAgIGVuc3VyZSAndiAyIGcgXycsXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0OiBcIiAgMiAgXFxuIDNhYmNcIlxuXG4gIGRlc2NyaWJlIFwidGhlIEcga2V5YmluZGluZyAoc3RheU9uVmVydGljYWxNb3Rpb24gPSBmYWxzZSlcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXR0aW5ncy5zZXQoJ3N0YXlPblZlcnRpY2FsTW90aW9uJywgZmFsc2UpXG4gICAgICBzZXRcbiAgICAgICAgdGV4dF86IFwiXCJcIlxuICAgICAgICAxXG4gICAgICAgIF9fX18yXG4gICAgICAgIF8zYWJjXG4gICAgICAgIF9cbiAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzAsIDJdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gdGhlIGxhc3QgbGluZSBhZnRlciB3aGl0ZXNwYWNlXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnRycsIGN1cnNvcjogWzMsIDBdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgcmVwZWF0ZWQgbW90aW9uXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdG8gYSBzcGVjaWZpZWQgbGluZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJzIgRycsIGN1cnNvcjogWzEsIDRdXG5cbiAgICBkZXNjcmliZSBcImFzIGEgc2VsZWN0aW9uXCIsIC0+XG4gICAgICBpdCBcInNlbGVjdHMgdG8gdGhlIGxhc3QgbGluZSBpbiB0aGUgZmlsZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICd2IEcnLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dDogXCIgICAgMlxcbiAzYWJjXFxuIFwiXG4gICAgICAgICAgY3Vyc29yOiBbMywgMV1cblxuICBkZXNjcmliZSBcInRoZSBOJSBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFswLi45OTldLmpvaW4oXCJcXG5cIilcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwicHV0IGN1cnNvciBvbiBsaW5lIHNwZWNpZmllZCBieSBwZXJjZW50XCIsIC0+XG4gICAgICBpdCBcIjUwJVwiLCAtPiBlbnN1cmUgJzUgMCAlJywgY3Vyc29yOiBbNDk5LCAwXVxuICAgICAgaXQgXCIzMCVcIiwgLT4gZW5zdXJlICczIDAgJScsIGN1cnNvcjogWzI5OSwgMF1cbiAgICAgIGl0IFwiMTAwJVwiLCAtPiBlbnN1cmUgJzEgMCAwICUnLCBjdXJzb3I6IFs5OTksIDBdXG4gICAgICBpdCBcIjEyMCVcIiwgLT4gZW5zdXJlICcxIDIgMCAlJywgY3Vyc29yOiBbOTk5LCAwXVxuXG4gIGRlc2NyaWJlIFwidGhlIEgsIE0sIEwga2V5YmluZGluZyggc3RheU9uVmVydGljYWxNb3RpbyA9IGZhbHNlIClcIiwgLT5cbiAgICBbZWVsXSA9IFtdXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25WZXJ0aWNhbE1vdGlvbicsIGZhbHNlKVxuXG4gICAgICBlZWwgPSBlZGl0b3JFbGVtZW50XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAxXG4gICAgICAgICAgMlxuICAgICAgICAgIDNcbiAgICAgICAgICA0XG4gICAgICAgICAgICA1XG4gICAgICAgICAgNlxuICAgICAgICAgIDdcbiAgICAgICAgICA4XG4gICAgICAgICAgOVxuICAgICAgICAgICAgMTBcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbOCwgMF1cblxuICAgIGRlc2NyaWJlIFwidGhlIEgga2V5YmluZGluZ1wiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBub24tYmxhbmstY2hhciBvbiBmaXJzdCByb3cgaWYgdmlzaWJsZVwiLCAtPlxuICAgICAgICBzcHlPbihlZWwsICdnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cnKS5hbmRSZXR1cm4oMClcbiAgICAgICAgZW5zdXJlICdIJywgY3Vyc29yOiBbMCwgMl1cblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBub24tYmxhbmstY2hhciBvbiBmaXJzdCB2aXNpYmxlIHJvdyBwbHVzIHNjcm9sbCBvZmZzZXRcIiwgLT5cbiAgICAgICAgc3B5T24oZWVsLCAnZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93JykuYW5kUmV0dXJuKDIpXG4gICAgICAgIGVuc3VyZSAnSCcsIGN1cnNvcjogWzQsIDJdXG5cbiAgICAgIGl0IFwicmVzcGVjdHMgY291bnRzXCIsIC0+XG4gICAgICAgIHNweU9uKGVlbCwgJ2dldEZpcnN0VmlzaWJsZVNjcmVlblJvdycpLmFuZFJldHVybigwKVxuICAgICAgICBlbnN1cmUgJzQgSCcsIGN1cnNvcjogWzMsIDBdXG5cbiAgICBkZXNjcmliZSBcInRoZSBMIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byBub24tYmxhbmstY2hhciBvbiBsYXN0IHJvdyBpZiB2aXNpYmxlXCIsIC0+XG4gICAgICAgIHNweU9uKGVkaXRvciwgJ2dldExhc3RWaXNpYmxlU2NyZWVuUm93JykuYW5kUmV0dXJuKDkpXG4gICAgICAgIGVuc3VyZSAnTCcsIGN1cnNvcjogWzksIDJdXG5cbiAgICAgIGl0IFwibW92ZXMgdGhlIGN1cnNvciB0byB0aGUgZmlyc3QgdmlzaWJsZSByb3cgcGx1cyBvZmZzZXRcIiwgLT5cbiAgICAgICAgc3B5T24oZWRpdG9yLCAnZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3cnKS5hbmRSZXR1cm4oNylcbiAgICAgICAgZW5zdXJlICdMJywgY3Vyc29yOiBbNCwgMl1cblxuICAgICAgaXQgXCJyZXNwZWN0cyBjb3VudHNcIiwgLT5cbiAgICAgICAgc3B5T24oZWRpdG9yLCAnZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3cnKS5hbmRSZXR1cm4oOSlcbiAgICAgICAgZW5zdXJlICczIEwnLCBjdXJzb3I6IFs3LCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgTSBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNweU9uKGVlbCwgJ2dldEZpcnN0VmlzaWJsZVNjcmVlblJvdycpLmFuZFJldHVybigwKVxuICAgICAgICBzcHlPbihlZGl0b3IsICdnZXRMYXN0VmlzaWJsZVNjcmVlblJvdycpLmFuZFJldHVybigxMClcblxuICAgICAgaXQgXCJtb3ZlcyB0aGUgY3Vyc29yIHRvIHRoZSBub24tYmxhbmstY2hhciBvZiBtaWRkbGUgb2Ygc2NyZWVuXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnTScsIGN1cnNvcjogWzQsIDJdXG5cbiAgZGVzY3JpYmUgXCJzdGF5T25WZXJ0aWNhbE1vdGlvbiBzZXR0aW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0dGluZ3Muc2V0KCdzdGF5T25WZXJ0aWNhbE1vdGlvbicsIHRydWUpXG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgMCAwMDAwMDAwMDAwMDBcbiAgICAgICAgICAxIDExMTExMTExMTExMVxuICAgICAgICAyIDIyMjIyMjIyMjIyMlxcblxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMiwgMTBdXG5cbiAgICBkZXNjcmliZSBcImdnLCBHLCBOJVwiLCAtPlxuICAgICAgaXQgXCJnbyB0byByb3cgd2l0aCBrZWVwIGNvbHVtbiBhbmQgcmVzcGVjdCBjdXJzb3IuZ29hbENvbHVtXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZyBnJywgY3Vyc29yOiBbMCwgMTBdXG4gICAgICAgIGVuc3VyZSAnJCcsIGN1cnNvcjogWzAsIDE1XVxuICAgICAgICBlbnN1cmUgJ0cnLCBjdXJzb3I6IFsyLCAxM11cbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ29hbENvbHVtbikudG9CZShJbmZpbml0eSlcbiAgICAgICAgZW5zdXJlICcxICUnLCBjdXJzb3I6IFswLCAxNV1cbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRMYXN0Q3Vyc29yKCkuZ29hbENvbHVtbikudG9CZShJbmZpbml0eSlcbiAgICAgICAgZW5zdXJlICcxIDAgaCcsIGN1cnNvcjogWzAsIDVdXG4gICAgICAgIGVuc3VyZSAnNSAwICUnLCBjdXJzb3I6IFsxLCA1XVxuICAgICAgICBlbnN1cmUgJzEgMCAwICUnLCBjdXJzb3I6IFsyLCA1XVxuXG4gICAgZGVzY3JpYmUgXCJILCBNLCBMXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNweU9uKGVkaXRvckVsZW1lbnQsICdnZXRGaXJzdFZpc2libGVTY3JlZW5Sb3cnKS5hbmRSZXR1cm4oMClcbiAgICAgICAgc3B5T24oZWRpdG9yLCAnZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3cnKS5hbmRSZXR1cm4oMylcblxuICAgICAgaXQgXCJnbyB0byByb3cgd2l0aCBrZWVwIGNvbHVtbiBhbmQgcmVzcGVjdCBjdXJzb3IuZ29hbENvbHVtXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnSCcsIGN1cnNvcjogWzAsIDEwXVxuICAgICAgICBlbnN1cmUgJ00nLCBjdXJzb3I6IFsxLCAxMF1cbiAgICAgICAgZW5zdXJlICdMJywgY3Vyc29yOiBbMiwgMTBdXG4gICAgICAgIGVuc3VyZSAnJCcsIGN1cnNvcjogWzIsIDEzXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nb2FsQ29sdW1uKS50b0JlKEluZmluaXR5KVxuICAgICAgICBlbnN1cmUgJ0gnLCBjdXJzb3I6IFswLCAxNV1cbiAgICAgICAgZW5zdXJlICdNJywgY3Vyc29yOiBbMSwgMTVdXG4gICAgICAgIGVuc3VyZSAnTCcsIGN1cnNvcjogWzIsIDEzXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RDdXJzb3IoKS5nb2FsQ29sdW1uKS50b0JlKEluZmluaXR5KVxuXG4gIGRlc2NyaWJlICd0aGUgbWFyayBrZXliaW5kaW5ncycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDEyXG4gICAgICAgICAgICAzNFxuICAgICAgICA1NlxcblxuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMV1cblxuICAgIGl0ICdtb3ZlcyB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBsaW5lIG9mIGEgbWFyaycsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgIGtleXN0cm9rZSAnbSBhJ1xuICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICBlbnN1cmUgXCInIGFcIiwgY3Vyc29yOiBbMSwgNF1cblxuICAgIGl0ICdtb3ZlcyBsaXRlcmFsbHkgdG8gYSBtYXJrJywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAga2V5c3Ryb2tlICdtIGEnXG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSAnYCBhJywgY3Vyc29yOiBbMSwgMl1cblxuICAgIGl0ICdkZWxldGVzIHRvIGEgbWFyayBieSBsaW5lJywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsxLCA1XVxuICAgICAga2V5c3Ryb2tlICdtIGEnXG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSBcImQgJyBhXCIsIHRleHQ6ICc1NlxcbidcblxuICAgIGl0ICdkZWxldGVzIGJlZm9yZSB0byBhIG1hcmsgbGl0ZXJhbGx5JywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsxLCA1XVxuICAgICAga2V5c3Ryb2tlICdtIGEnXG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMl1cbiAgICAgIGVuc3VyZSAnZCBgIGEnLCB0ZXh0OiAnICA0XFxuNTZcXG4nXG5cbiAgICBpdCAnZGVsZXRlcyBhZnRlciB0byBhIG1hcmsgbGl0ZXJhbGx5JywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsxLCA1XVxuICAgICAga2V5c3Ryb2tlICdtIGEnXG4gICAgICBzZXQgY3Vyc29yOiBbMiwgMV1cbiAgICAgIGVuc3VyZSAnZCBgIGEnLCB0ZXh0OiAnICAxMlxcbiAgICAzNlxcbidcblxuICAgIGl0ICdtb3ZlcyBiYWNrIHRvIHByZXZpb3VzJywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFsxLCA1XVxuICAgICAga2V5c3Ryb2tlICdgIGAnXG4gICAgICBzZXQgY3Vyc29yOiBbMiwgMV1cbiAgICAgIGVuc3VyZSAnYCBgJywgY3Vyc29yOiBbMSwgNV1cblxuICBkZXNjcmliZSBcImp1bXAgY29tbWFuZCB1cGRhdGUgYCBhbmQgJyBtYXJrXCIsIC0+XG4gICAgZW5zdXJlSnVtcE1hcmsgPSAodmFsdWUpIC0+XG4gICAgICBlbnN1cmUgbWFyazogXCJgXCI6IHZhbHVlXG4gICAgICBlbnN1cmUgbWFyazogXCInXCI6IHZhbHVlXG5cbiAgICBlbnN1cmVKdW1wQW5kQmFjayA9IChrZXlzdHJva2UsIG9wdGlvbikgLT5cbiAgICAgIGFmdGVyTW92ZSA9IG9wdGlvbi5jdXJzb3JcbiAgICAgIGJlZm9yZU1vdmUgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKVxuXG4gICAgICBlbnN1cmUga2V5c3Ryb2tlLCBjdXJzb3I6IGFmdGVyTW92ZVxuICAgICAgZW5zdXJlSnVtcE1hcmsoYmVmb3JlTW92ZSlcblxuICAgICAgZXhwZWN0KGJlZm9yZU1vdmUuaXNFcXVhbChhZnRlck1vdmUpKS50b0JlKGZhbHNlKVxuXG4gICAgICBlbnN1cmUgXCJgIGBcIiwgY3Vyc29yOiBiZWZvcmVNb3ZlXG4gICAgICBlbnN1cmVKdW1wTWFyayhhZnRlck1vdmUpXG5cbiAgICBlbnN1cmVKdW1wQW5kQmFja0xpbmV3aXNlID0gKGtleXN0cm9rZSwgb3B0aW9uKSAtPlxuICAgICAgYWZ0ZXJNb3ZlID0gb3B0aW9uLmN1cnNvclxuICAgICAgYmVmb3JlTW92ZSA9IGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpXG5cbiAgICAgIGV4cGVjdChiZWZvcmVNb3ZlLmNvbHVtbikubm90LnRvQmUoMClcblxuICAgICAgZW5zdXJlIGtleXN0cm9rZSwgY3Vyc29yOiBhZnRlck1vdmVcbiAgICAgIGVuc3VyZUp1bXBNYXJrKGJlZm9yZU1vdmUpXG5cbiAgICAgIGV4cGVjdChiZWZvcmVNb3ZlLmlzRXF1YWwoYWZ0ZXJNb3ZlKSkudG9CZShmYWxzZSlcblxuICAgICAgZW5zdXJlIFwiJyAnXCIsIGN1cnNvcjogW2JlZm9yZU1vdmUucm93LCAwXVxuICAgICAgZW5zdXJlSnVtcE1hcmsoYWZ0ZXJNb3ZlKVxuXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgZm9yIG1hcmsgaW4gXCJgJ1wiXG4gICAgICAgIHZpbVN0YXRlLm1hcmsubWFya3NbbWFya10/LmRlc3Ryb3koKVxuICAgICAgICB2aW1TdGF0ZS5tYXJrLm1hcmtzW21hcmtdID0gbnVsbFxuXG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIDA6IG9vIDBcbiAgICAgICAgMTogMTExMVxuICAgICAgICAyOiAyMjIyXG4gICAgICAgIDM6IG9vIDNcbiAgICAgICAgNDogNDQ0NFxuICAgICAgICA1OiBvbyA1XG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFsxLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJpbml0aWFsIHN0YXRlXCIsIC0+XG4gICAgICBpdCBcInJldHVybiBbMCwgMF1cIiwgLT5cbiAgICAgICAgZW5zdXJlIG1hcms6IFwiJ1wiOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlIG1hcms6IFwiYFwiOiBbMCwgMF1cblxuICAgIGRlc2NyaWJlIFwianVtcCBtb3Rpb24gaW4gbm9ybWFsLW1vZGVcIiwgLT5cbiAgICAgIGluaXRpYWwgPSBbMywgM11cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgamFzbWluZS5hdHRhY2hUb0RPTShnZXRWaWV3KGF0b20ud29ya3NwYWNlKSkgIyBmb3IgTCwgTSwgSFxuXG4gICAgICAgICMgVE9ETzogcmVtb3ZlIHdoZW4gMS4xOSBiZWNvbWUgc3RhYmxlXG4gICAgICAgIGlmIGVkaXRvckVsZW1lbnQubWVhc3VyZURpbWVuc2lvbnM/XG4gICAgICAgICAge2NvbXBvbmVudH0gPSBlZGl0b3JcbiAgICAgICAgICBjb21wb25lbnQuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBjb21wb25lbnQuZ2V0TGluZUhlaWdodCgpICogZWRpdG9yLmdldExpbmVDb3VudCgpICsgJ3B4J1xuICAgICAgICAgIGVkaXRvckVsZW1lbnQubWVhc3VyZURpbWVuc2lvbnMoKVxuXG4gICAgICAgIGVuc3VyZSBtYXJrOiBcIidcIjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSBtYXJrOiBcImBcIjogWzAsIDBdXG4gICAgICAgIHNldCBjdXJzb3I6IGluaXRpYWxcblxuICAgICAgaXQgXCJHIGp1bXAmYmFja1wiLCAtPiBlbnN1cmVKdW1wQW5kQmFjayAnRycsIGN1cnNvcjogWzUsIDNdXG4gICAgICBpdCBcImcgZyBqdW1wJmJhY2tcIiwgLT4gZW5zdXJlSnVtcEFuZEJhY2sgXCJnIGdcIiwgY3Vyc29yOiBbMCwgM11cbiAgICAgIGl0IFwiMTAwICUganVtcCZiYWNrXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrIFwiMSAwIDAgJVwiLCBjdXJzb3I6IFs1LCAzXVxuICAgICAgaXQgXCIpIGp1bXAmYmFja1wiLCAtPiBlbnN1cmVKdW1wQW5kQmFjayBcIilcIiwgY3Vyc29yOiBbNSwgNl1cbiAgICAgIGl0IFwiKCBqdW1wJmJhY2tcIiwgLT4gZW5zdXJlSnVtcEFuZEJhY2sgXCIoXCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICBpdCBcIl0ganVtcCZiYWNrXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrIFwiXVwiLCBjdXJzb3I6IFs1LCAzXVxuICAgICAgaXQgXCJbIGp1bXAmYmFja1wiLCAtPiBlbnN1cmVKdW1wQW5kQmFjayBcIltcIiwgY3Vyc29yOiBbMCwgM11cbiAgICAgIGl0IFwifSBqdW1wJmJhY2tcIiwgLT4gZW5zdXJlSnVtcEFuZEJhY2sgXCJ9XCIsIGN1cnNvcjogWzUsIDZdXG4gICAgICBpdCBcInsganVtcCZiYWNrXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrIFwie1wiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgaXQgXCJMIGp1bXAmYmFja1wiLCAtPiBlbnN1cmVKdW1wQW5kQmFjayBcIkxcIiwgY3Vyc29yOiBbNSwgM11cbiAgICAgIGl0IFwiSCBqdW1wJmJhY2tcIiwgLT4gZW5zdXJlSnVtcEFuZEJhY2sgXCJIXCIsIGN1cnNvcjogWzAsIDNdXG4gICAgICBpdCBcIk0ganVtcCZiYWNrXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrIFwiTVwiLCBjdXJzb3I6IFsyLCAzXVxuICAgICAgaXQgXCIqIGp1bXAmYmFja1wiLCAtPiBlbnN1cmVKdW1wQW5kQmFjayBcIipcIiwgY3Vyc29yOiBbNSwgM11cblxuICAgICAgIyBbQlVHXSBTdHJhbmdlIGJ1ZyBvZiBqYXNtaW5lIG9yIGF0b20ncyBqYXNtaW5lIGVuaGFuY21lbnQ/XG4gICAgICAjIFVzaW5nIHN1YmplY3QgXCIjIGp1bXAgJiBiYWNrXCIgc2tpcHMgc3BlYy5cbiAgICAgICMgTm90ZSBhdCBBdG9tIHYxLjExLjJcbiAgICAgIGl0IFwiU2hhcnAoIykganVtcCZiYWNrXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrKCcjJywgY3Vyc29yOiBbMCwgM10pXG5cbiAgICAgIGl0IFwiLyBqdW1wJmJhY2tcIiwgLT4gZW5zdXJlSnVtcEFuZEJhY2sgJy8gb28gZW50ZXInLCBjdXJzb3I6IFs1LCAzXVxuICAgICAgaXQgXCI/IGp1bXAmYmFja1wiLCAtPiBlbnN1cmVKdW1wQW5kQmFjayAnPyBvbyBlbnRlcicsIGN1cnNvcjogWzAsIDNdXG5cbiAgICAgIGl0IFwibiBqdW1wJmJhY2tcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGVuc3VyZSAnLyBvbyBlbnRlcicsIGN1cnNvcjogWzAsIDNdXG4gICAgICAgIGVuc3VyZUp1bXBBbmRCYWNrIFwiblwiLCBjdXJzb3I6IFszLCAzXVxuICAgICAgICBlbnN1cmVKdW1wQW5kQmFjayBcIk5cIiwgY3Vyc29yOiBbNSwgM11cblxuICAgICAgaXQgXCJOIGp1bXAmYmFja1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICc/IG9vIGVudGVyJywgY3Vyc29yOiBbNSwgM11cbiAgICAgICAgZW5zdXJlSnVtcEFuZEJhY2sgXCJuXCIsIGN1cnNvcjogWzMsIDNdXG4gICAgICAgIGVuc3VyZUp1bXBBbmRCYWNrIFwiTlwiLCBjdXJzb3I6IFswLCAzXVxuXG4gICAgICBpdCBcIkcganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgJ0cnLCBjdXJzb3I6IFs1LCAzXVxuICAgICAgaXQgXCJnIGcganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJnIGdcIiwgY3Vyc29yOiBbMCwgM11cbiAgICAgIGl0IFwiMTAwICUganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCIxIDAgMCAlXCIsIGN1cnNvcjogWzUsIDNdXG4gICAgICBpdCBcIikganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCIpXCIsIGN1cnNvcjogWzUsIDZdXG4gICAgICBpdCBcIigganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCIoXCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICBpdCBcIl0ganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJdXCIsIGN1cnNvcjogWzUsIDNdXG4gICAgICBpdCBcIlsganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJbXCIsIGN1cnNvcjogWzAsIDNdXG4gICAgICBpdCBcIn0ganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJ9XCIsIGN1cnNvcjogWzUsIDZdXG4gICAgICBpdCBcInsganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJ7XCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICBpdCBcIkwganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJMXCIsIGN1cnNvcjogWzUsIDNdXG4gICAgICBpdCBcIkgganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJIXCIsIGN1cnNvcjogWzAsIDNdXG4gICAgICBpdCBcIk0ganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCJNXCIsIGN1cnNvcjogWzIsIDNdXG4gICAgICBpdCBcIioganVtcCZiYWNrIGxpbmV3aXNlXCIsIC0+IGVuc3VyZUp1bXBBbmRCYWNrTGluZXdpc2UgXCIqXCIsIGN1cnNvcjogWzUsIDNdXG5cbiAgZGVzY3JpYmUgJ3RoZSBWIGtleWJpbmRpbmcnLCAtPlxuICAgIFt0ZXh0XSA9IFtdXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgdGV4dCA9IG5ldyBUZXh0RGF0YSBcIlwiXCJcbiAgICAgICAgMDFcbiAgICAgICAgMDAyXG4gICAgICAgIDAwMDNcbiAgICAgICAgMDAwMDRcbiAgICAgICAgMDAwMDA1XFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IHRleHQuZ2V0UmF3KClcbiAgICAgICAgY3Vyc29yOiBbMSwgMV1cblxuICAgIGl0IFwic2VsZWN0cyBkb3duIGEgbGluZVwiLCAtPlxuICAgICAgZW5zdXJlICdWIGogaicsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMS4uM10pXG5cbiAgICBpdCBcInNlbGVjdHMgdXAgYSBsaW5lXCIsIC0+XG4gICAgICBlbnN1cmUgJ1YgaycsIHNlbGVjdGVkVGV4dDogdGV4dC5nZXRMaW5lcyhbMC4uMV0pXG5cbiAgZGVzY3JpYmUgJ01vdmVUbyhQcmV2aW91c3xOZXh0KUZvbGQoU3RhcnR8RW5kKScsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCdsYW5ndWFnZS1jb2ZmZWUtc2NyaXB0JylcbiAgICAgIGdldFZpbVN0YXRlICdzYW1wbGUuY29mZmVlJywgKHN0YXRlLCB2aW0pIC0+XG4gICAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gc3RhdGVcbiAgICAgICAge3NldCwgZW5zdXJlLCBrZXlzdHJva2V9ID0gdmltXG5cbiAgICAgIHJ1bnMgLT5cbiAgICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAgICdbIFsnOiAndmltLW1vZGUtcGx1czptb3ZlLXRvLXByZXZpb3VzLWZvbGQtc3RhcnQnXG4gICAgICAgICAgICAnXSBbJzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS10by1uZXh0LWZvbGQtc3RhcnQnXG4gICAgICAgICAgICAnWyBdJzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS10by1wcmV2aW91cy1mb2xkLWVuZCdcbiAgICAgICAgICAgICddIF0nOiAndmltLW1vZGUtcGx1czptb3ZlLXRvLW5leHQtZm9sZC1lbmQnXG5cbiAgICBhZnRlckVhY2ggLT5cbiAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnKVxuXG4gICAgZGVzY3JpYmUgXCJNb3ZlVG9QcmV2aW91c0ZvbGRTdGFydFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMzAsIDBdXG4gICAgICBpdCBcIm1vdmUgdG8gZmlyc3QgY2hhciBvZiBwcmV2aW91cyBmb2xkIHN0YXJ0IHJvd1wiLCAtPlxuICAgICAgICBlbnN1cmUgJ1sgWycsIGN1cnNvcjogWzIyLCA2XVxuICAgICAgICBlbnN1cmUgJ1sgWycsIGN1cnNvcjogWzIwLCA2XVxuICAgICAgICBlbnN1cmUgJ1sgWycsIGN1cnNvcjogWzE4LCA0XVxuICAgICAgICBlbnN1cmUgJ1sgWycsIGN1cnNvcjogWzksIDJdXG4gICAgICAgIGVuc3VyZSAnWyBbJywgY3Vyc29yOiBbOCwgMF1cblxuICAgIGRlc2NyaWJlIFwiTW92ZVRvTmV4dEZvbGRTdGFydFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwibW92ZSB0byBmaXJzdCBjaGFyIG9mIG5leHQgZm9sZCBzdGFydCByb3dcIiwgLT5cbiAgICAgICAgZW5zdXJlICddIFsnLCBjdXJzb3I6IFs4LCAwXVxuICAgICAgICBlbnN1cmUgJ10gWycsIGN1cnNvcjogWzksIDJdXG4gICAgICAgIGVuc3VyZSAnXSBbJywgY3Vyc29yOiBbMTgsIDRdXG4gICAgICAgIGVuc3VyZSAnXSBbJywgY3Vyc29yOiBbMjAsIDZdXG4gICAgICAgIGVuc3VyZSAnXSBbJywgY3Vyc29yOiBbMjIsIDZdXG5cbiAgICBkZXNjcmliZSBcIk1vdmVUb1ByZXZpc0ZvbGRFbmRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzMwLCAwXVxuICAgICAgaXQgXCJtb3ZlIHRvIGZpcnN0IGNoYXIgb2YgcHJldmlvdXMgZm9sZCBlbmQgcm93XCIsIC0+XG4gICAgICAgIGVuc3VyZSAnWyBdJywgY3Vyc29yOiBbMjgsIDJdXG4gICAgICAgIGVuc3VyZSAnWyBdJywgY3Vyc29yOiBbMjUsIDRdXG4gICAgICAgIGVuc3VyZSAnWyBdJywgY3Vyc29yOiBbMjMsIDhdXG4gICAgICAgIGVuc3VyZSAnWyBdJywgY3Vyc29yOiBbMjEsIDhdXG5cbiAgICBkZXNjcmliZSBcIk1vdmVUb05leHRGb2xkRW5kXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgaXQgXCJtb3ZlIHRvIGZpcnN0IGNoYXIgb2YgbmV4dCBmb2xkIGVuZCByb3dcIiwgLT5cbiAgICAgICAgZW5zdXJlICddIF0nLCBjdXJzb3I6IFsyMSwgOF1cbiAgICAgICAgZW5zdXJlICddIF0nLCBjdXJzb3I6IFsyMywgOF1cbiAgICAgICAgZW5zdXJlICddIF0nLCBjdXJzb3I6IFsyNSwgNF1cbiAgICAgICAgZW5zdXJlICddIF0nLCBjdXJzb3I6IFsyOCwgMl1cblxuICBkZXNjcmliZSAnTW92ZVRvKFByZXZpb3VzfE5leHQpU3RyaW5nJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAnZyBzJzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS10by1uZXh0LXN0cmluZydcbiAgICAgICAgICAnZyBTJzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS10by1wcmV2aW91cy1zdHJpbmcnXG5cbiAgICBkZXNjcmliZSAnZWRpdG9yIGZvciBzb2Z0VGFiJywgLT5cbiAgICAgIHBhY2sgPSAnbGFuZ3VhZ2UtY29mZmVlLXNjcmlwdCdcbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGRpc3Bvc2FibGU/LmRpc3Bvc2UoKVxuICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXdvcmtzcGFjZScsXG4gICAgICAgICAgICAgICdjaGVjay11cCc6IC0+IGZ1bignYmFja3dhcmQnKVxuICAgICAgICAgICAgICAnY2hlY2stZG93bic6IC0+IGZ1bignZm9yd2FyZCcpXG4gICAgICAgICAgICBcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgZ3JhbW1hcjogJ3NvdXJjZS5jb2ZmZWUnXG5cbiAgICAgIGFmdGVyRWFjaCAtPlxuICAgICAgICBhdG9tLnBhY2thZ2VzLmRlYWN0aXZhdGVQYWNrYWdlKHBhY2spXG5cbiAgICAgIGl0IFwibW92ZSB0byBuZXh0IHN0cmluZ1wiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICdnIHMnLCBjdXJzb3I6IFsxLCAzMV1cbiAgICAgICAgZW5zdXJlICdnIHMnLCBjdXJzb3I6IFsyLCAyXVxuICAgICAgICBlbnN1cmUgJ2cgcycsIGN1cnNvcjogWzIsIDIxXVxuICAgICAgICBlbnN1cmUgJ2cgcycsIGN1cnNvcjogWzMsIDJdXG4gICAgICAgIGVuc3VyZSAnZyBzJywgY3Vyc29yOiBbMywgMjNdXG4gICAgICBpdCBcIm1vdmUgdG8gcHJldmlvdXMgc3RyaW5nXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFs0LCAwXVxuICAgICAgICBlbnN1cmUgJ2cgUycsIGN1cnNvcjogWzMsIDIzXVxuICAgICAgICBlbnN1cmUgJ2cgUycsIGN1cnNvcjogWzMsIDJdXG4gICAgICAgIGVuc3VyZSAnZyBTJywgY3Vyc29yOiBbMiwgMjFdXG4gICAgICAgIGVuc3VyZSAnZyBTJywgY3Vyc29yOiBbMiwgMl1cbiAgICAgICAgZW5zdXJlICdnIFMnLCBjdXJzb3I6IFsxLCAzMV1cbiAgICAgIGl0IFwic3VwcG9ydCBjb3VudFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgZW5zdXJlICczIGcgcycsIGN1cnNvcjogWzIsIDIxXVxuICAgICAgICBlbnN1cmUgJzMgZyBTJywgY3Vyc29yOiBbMSwgMzFdXG5cbiAgICBkZXNjcmliZSAnZWRpdG9yIGZvciBoYXJkVGFiJywgLT5cbiAgICAgIHBhY2sgPSAnbGFuZ3VhZ2UtZ28nXG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKHBhY2spXG5cbiAgICAgICAgZ2V0VmltU3RhdGUgJ3NhbXBsZS5nbycsIChzdGF0ZSwgdmltRWRpdG9yKSAtPlxuICAgICAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gc3RhdGVcbiAgICAgICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1FZGl0b3JcblxuICAgICAgYWZ0ZXJFYWNoIC0+XG4gICAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgICAgaXQgXCJtb3ZlIHRvIG5leHQgc3RyaW5nXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3JTY3JlZW46IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2cgcycsIGN1cnNvclNjcmVlbjogWzIsIDddXG4gICAgICAgIGVuc3VyZSAnZyBzJywgY3Vyc29yU2NyZWVuOiBbMywgN11cbiAgICAgICAgZW5zdXJlICdnIHMnLCBjdXJzb3JTY3JlZW46IFs4LCA4XVxuICAgICAgICBlbnN1cmUgJ2cgcycsIGN1cnNvclNjcmVlbjogWzksIDhdXG4gICAgICAgIGVuc3VyZSAnZyBzJywgY3Vyc29yU2NyZWVuOiBbMTEsIDIwXVxuICAgICAgICBlbnN1cmUgJ2cgcycsIGN1cnNvclNjcmVlbjogWzEyLCAxNV1cbiAgICAgICAgZW5zdXJlICdnIHMnLCBjdXJzb3JTY3JlZW46IFsxMywgMTVdXG4gICAgICAgIGVuc3VyZSAnZyBzJywgY3Vyc29yU2NyZWVuOiBbMTUsIDE1XVxuICAgICAgICBlbnN1cmUgJ2cgcycsIGN1cnNvclNjcmVlbjogWzE2LCAxNV1cbiAgICAgIGl0IFwibW92ZSB0byBwcmV2aW91cyBzdHJpbmdcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvclNjcmVlbjogWzE4LCAwXVxuICAgICAgICBlbnN1cmUgJ2cgUycsIGN1cnNvclNjcmVlbjogWzE2LCAxNV1cbiAgICAgICAgZW5zdXJlICdnIFMnLCBjdXJzb3JTY3JlZW46IFsxNSwgMTVdXG4gICAgICAgIGVuc3VyZSAnZyBTJywgY3Vyc29yU2NyZWVuOiBbMTMsIDE1XVxuICAgICAgICBlbnN1cmUgJ2cgUycsIGN1cnNvclNjcmVlbjogWzEyLCAxNV1cbiAgICAgICAgZW5zdXJlICdnIFMnLCBjdXJzb3JTY3JlZW46IFsxMSwgMjBdXG4gICAgICAgIGVuc3VyZSAnZyBTJywgY3Vyc29yU2NyZWVuOiBbOSwgOF1cbiAgICAgICAgZW5zdXJlICdnIFMnLCBjdXJzb3JTY3JlZW46IFs4LCA4XVxuICAgICAgICBlbnN1cmUgJ2cgUycsIGN1cnNvclNjcmVlbjogWzMsIDddXG4gICAgICAgIGVuc3VyZSAnZyBTJywgY3Vyc29yU2NyZWVuOiBbMiwgN11cblxuICBkZXNjcmliZSAnTW92ZVRvKFByZXZpb3VzfE5leHQpTnVtYmVyJywgLT5cbiAgICBwYWNrID0gJ2xhbmd1YWdlLWNvZmZlZS1zY3JpcHQnXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgYXRvbS5rZXltYXBzLmFkZCBcInRlc3RcIixcbiAgICAgICAgJ2F0b20tdGV4dC1lZGl0b3IudmltLW1vZGUtcGx1czpub3QoLmluc2VydC1tb2RlKSc6XG4gICAgICAgICAgJ2cgbic6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tbmV4dC1udW1iZXInXG4gICAgICAgICAgJ2cgTic6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tcHJldmlvdXMtbnVtYmVyJ1xuXG4gICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgICAgcnVucyAtPlxuICAgICAgICBzZXQgZ3JhbW1hcjogJ3NvdXJjZS5jb2ZmZWUnXG5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgbnVtMSA9IDFcbiAgICAgICAgYXJyMSA9IFsxLCAxMDEsIDEwMDFdXG4gICAgICAgIGFycjIgPSBbXCIxXCIsIFwiMlwiLCBcIjNcIl1cbiAgICAgICAgbnVtMiA9IDJcbiAgICAgICAgZnVuKFwiMVwiLCAyLCAzKVxuICAgICAgICBcXG5cbiAgICAgICAgXCJcIlwiXG5cbiAgICBhZnRlckVhY2ggLT5cbiAgICAgIGF0b20ucGFja2FnZXMuZGVhY3RpdmF0ZVBhY2thZ2UocGFjaylcblxuICAgIGl0IFwibW92ZSB0byBuZXh0IG51bWJlclwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICBlbnN1cmUgJ2cgbicsIGN1cnNvcjogWzAsIDddXG4gICAgICBlbnN1cmUgJ2cgbicsIGN1cnNvcjogWzEsIDhdXG4gICAgICBlbnN1cmUgJ2cgbicsIGN1cnNvcjogWzEsIDExXVxuICAgICAgZW5zdXJlICdnIG4nLCBjdXJzb3I6IFsxLCAxNl1cbiAgICAgIGVuc3VyZSAnZyBuJywgY3Vyc29yOiBbMywgN11cbiAgICAgIGVuc3VyZSAnZyBuJywgY3Vyc29yOiBbNCwgOV1cbiAgICAgIGVuc3VyZSAnZyBuJywgY3Vyc29yOiBbNCwgMTJdXG4gICAgaXQgXCJtb3ZlIHRvIHByZXZpb3VzIG51bWJlclwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzUsIDBdXG4gICAgICBlbnN1cmUgJ2cgTicsIGN1cnNvcjogWzQsIDEyXVxuICAgICAgZW5zdXJlICdnIE4nLCBjdXJzb3I6IFs0LCA5XVxuICAgICAgZW5zdXJlICdnIE4nLCBjdXJzb3I6IFszLCA3XVxuICAgICAgZW5zdXJlICdnIE4nLCBjdXJzb3I6IFsxLCAxNl1cbiAgICAgIGVuc3VyZSAnZyBOJywgY3Vyc29yOiBbMSwgMTFdXG4gICAgICBlbnN1cmUgJ2cgTicsIGN1cnNvcjogWzEsIDhdXG4gICAgICBlbnN1cmUgJ2cgTicsIGN1cnNvcjogWzAsIDddXG4gICAgaXQgXCJzdXBwb3J0IGNvdW50XCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSAnNSBnIG4nLCBjdXJzb3I6IFszLCA3XVxuICAgICAgZW5zdXJlICczIGcgTicsIGN1cnNvcjogWzEsIDhdXG5cbiAgZGVzY3JpYmUgJ3N1YndvcmQgbW90aW9uJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBhdG9tLmtleW1hcHMuYWRkIFwidGVzdFwiLFxuICAgICAgICAnYXRvbS10ZXh0LWVkaXRvci52aW0tbW9kZS1wbHVzOm5vdCguaW5zZXJ0LW1vZGUpJzpcbiAgICAgICAgICAncSc6ICd2aW0tbW9kZS1wbHVzOm1vdmUtdG8tbmV4dC1zdWJ3b3JkJ1xuICAgICAgICAgICdRJzogJ3ZpbS1tb2RlLXBsdXM6bW92ZS10by1wcmV2aW91cy1zdWJ3b3JkJ1xuICAgICAgICAgICdjdHJsLWUnOiAndmltLW1vZGUtcGx1czptb3ZlLXRvLWVuZC1vZi1zdWJ3b3JkJ1xuXG4gICAgaXQgXCJtb3ZlIHRvIG5leHQvcHJldmlvdXMgc3Vid29yZFwiLCAtPlxuICAgICAgc2V0IHRleHRDOiBcInxjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdxJywgdGV4dEM6IFwiY2FtZWx8Q2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ3EnLCB0ZXh0QzogXCJjYW1lbENhc2V8ID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAncScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PnwgKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdxJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh8d2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ3EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggfHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAncScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsfCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdxJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIHxDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ3EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhfFJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAncScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSfEFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdxJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlcnxSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ3EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG58ZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAncScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2h8LWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdxJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC18Y2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ3EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG58c25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAncScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlfF9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdxJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZXxfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ3EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcnxkXFxuXCJcbiAgICAgIGVuc3VyZSAnUScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2V8X3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdRJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2V8X2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ1EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG58c25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnUScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtfGNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdRJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaHwtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ1EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG58ZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnUScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJ8UnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdRJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJ8QWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ1EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhfFJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnUScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSB8Q2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdRJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWx8KSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ1EnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggfHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnUScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAofHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdRJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+fCAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ1EnLCB0ZXh0QzogXCJjYW1lbENhc2V8ID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnUScsIHRleHRDOiBcImNhbWVsfENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdRJywgdGV4dEM6IFwifGNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgaXQgXCJtb3ZlLXRvLWVuZC1vZi1zdWJ3b3JkXCIsIC0+XG4gICAgICBzZXQgdGV4dEM6IFwifGNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ2N0cmwtZScsIHRleHRDOiBcImNhbWV8bENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdjdHJsLWUnLCB0ZXh0QzogXCJjYW1lbENhc3xlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnY3RybC1lJywgdGV4dEM6IFwiY2FtZWxDYXNlID18PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ2N0cmwtZScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiB8KHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdjdHJsLWUnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdHxoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnY3RybC1lJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYXxsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ2N0cmwtZScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsfCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdjdHJsLWUnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2h8YVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnY3RybC1lJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYXxSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ2N0cmwtZScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXxyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdjdHJsLWUnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnxzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnY3RybC1lJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzfGgtY2FzZVxcblxcbnNuYWtlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ2N0cmwtZScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2h8LWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdjdHJsLWUnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc3xlXFxuXFxuc25ha2VfY2FzZV93b3JkXFxuXCJcbiAgICAgIGVuc3VyZSAnY3RybC1lJywgdGV4dEM6IFwiY2FtZWxDYXNlID0+ICh3aXRoIHNwZWNpYWwpIENoYVJBY3RlclJzXFxuXFxuZGFzaC1jYXNlXFxuXFxuc25ha3xlX2Nhc2Vfd29yZFxcblwiXG4gICAgICBlbnN1cmUgJ2N0cmwtZScsIHRleHRDOiBcImNhbWVsQ2FzZSA9PiAod2l0aCBzcGVjaWFsKSBDaGFSQWN0ZXJSc1xcblxcbmRhc2gtY2FzZVxcblxcbnNuYWtlX2Nhc3xlX3dvcmRcXG5cIlxuICAgICAgZW5zdXJlICdjdHJsLWUnLCB0ZXh0QzogXCJjYW1lbENhc2UgPT4gKHdpdGggc3BlY2lhbCkgQ2hhUkFjdGVyUnNcXG5cXG5kYXNoLWNhc2VcXG5cXG5zbmFrZV9jYXNlX3dvcnxkXFxuXCJcbiJdfQ==
