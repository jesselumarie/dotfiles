(function() {
  var TextData, dispatch, getVimState, ref, settings,
    slice = [].slice;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData;

  settings = require('../lib/settings');

  describe("Operator general", function() {
    var editor, editorElement, ensure, ensureByDispatch, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], ensureByDispatch = ref1[2], keystroke = ref1[3], editor = ref1[4], editorElement = ref1[5], vimState = ref1[6];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, ensureByDispatch = vim.ensureByDispatch, keystroke = vim.keystroke, vim;
      });
    });
    describe("cancelling operations", function() {
      return it("clear pending operation", function() {
        keystroke('/');
        expect(vimState.operationStack.isEmpty()).toBe(false);
        vimState.searchInput.cancel();
        expect(vimState.operationStack.isEmpty()).toBe(true);
        return expect(function() {
          return vimState.searchInput.cancel();
        }).not.toThrow();
      });
    });
    describe("the x keybinding", function() {
      describe("on a line with content", function() {
        describe("without vim-mode-plus.wrapLeftRightMotion", function() {
          beforeEach(function() {
            return set({
              text: "abc\n012345\n\nxyz",
              cursor: [1, 4]
            });
          });
          it("deletes a character", function() {
            ensure('x', {
              text: 'abc\n01235\n\nxyz',
              cursor: [1, 4],
              register: {
                '"': {
                  text: '4'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '5'
                }
              }
            });
            ensure('x', {
              text: 'abc\n012\n\nxyz',
              cursor: [1, 2],
              register: {
                '"': {
                  text: '3'
                }
              }
            });
            ensure('x', {
              text: 'abc\n01\n\nxyz',
              cursor: [1, 1],
              register: {
                '"': {
                  text: '2'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '1'
                }
              }
            });
            return ensure('x', {
              text: 'abc\n\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '0'
                }
              }
            });
          });
          return it("deletes multiple characters with a count", function() {
            ensure('2 x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '45'
                }
              }
            });
            set({
              cursor: [0, 1]
            });
            return ensure('3 x', {
              text: 'a\n0123\n\nxyz',
              cursor: [0, 0],
              register: {
                '"': {
                  text: 'bc'
                }
              }
            });
          });
        });
        describe("with multiple cursors", function() {
          beforeEach(function() {
            return set({
              text: "abc\n012345\n\nxyz",
              cursor: [[1, 4], [0, 1]]
            });
          });
          return it("is undone as one operation", function() {
            ensure('x', {
              text: "ac\n01235\n\nxyz"
            });
            return ensure('u', {
              text: 'abc\n012345\n\nxyz'
            });
          });
        });
        return describe("with vim-mode-plus.wrapLeftRightMotion", function() {
          beforeEach(function() {
            set({
              text: 'abc\n012345\n\nxyz',
              cursor: [1, 4]
            });
            return settings.set('wrapLeftRightMotion', true);
          });
          it("deletes a character", function() {
            ensure('x', {
              text: 'abc\n01235\n\nxyz',
              cursor: [1, 4],
              register: {
                '"': {
                  text: '4'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '5'
                }
              }
            });
            ensure('x', {
              text: 'abc\n012\n\nxyz',
              cursor: [1, 2],
              register: {
                '"': {
                  text: '3'
                }
              }
            });
            ensure('x', {
              text: 'abc\n01\n\nxyz',
              cursor: [1, 1],
              register: {
                '"': {
                  text: '2'
                }
              }
            });
            ensure('x', {
              text: 'abc\n0\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '1'
                }
              }
            });
            return ensure('x', {
              text: 'abc\n\n\nxyz',
              cursor: [1, 0],
              register: {
                '"': {
                  text: '0'
                }
              }
            });
          });
          return it("deletes multiple characters and newlines with a count", function() {
            settings.set('wrapLeftRightMotion', true);
            ensure('2 x', {
              text: 'abc\n0123\n\nxyz',
              cursor: [1, 3],
              register: {
                '"': {
                  text: '45'
                }
              }
            });
            set({
              cursor: [0, 1]
            });
            ensure('3 x', {
              text: 'a0123\n\nxyz',
              cursor: [0, 1],
              register: {
                '"': {
                  text: 'bc\n'
                }
              }
            });
            return ensure('7 x', {
              text: 'ayz',
              cursor: [0, 1],
              register: {
                '"': {
                  text: '0123\n\nx'
                }
              }
            });
          });
        });
      });
      return describe("on an empty line", function() {
        beforeEach(function() {
          return set({
            text: "abc\n012345\n\nxyz",
            cursor: [2, 0]
          });
        });
        it("deletes nothing on an empty line when vim-mode-plus.wrapLeftRightMotion is false", function() {
          settings.set('wrapLeftRightMotion', false);
          return ensure('x', {
            text: "abc\n012345\n\nxyz",
            cursor: [2, 0]
          });
        });
        return it("deletes an empty line when vim-mode-plus.wrapLeftRightMotion is true", function() {
          settings.set('wrapLeftRightMotion', true);
          return ensure('x', {
            text: "abc\n012345\nxyz",
            cursor: [2, 0]
          });
        });
      });
    });
    describe("the X keybinding", function() {
      describe("on a line with content", function() {
        beforeEach(function() {
          return set({
            text: "ab\n012345",
            cursor: [1, 2]
          });
        });
        return it("deletes a character", function() {
          ensure('X', {
            text: 'ab\n02345',
            cursor: [1, 1],
            register: {
              '"': {
                text: '1'
              }
            }
          });
          ensure('X', {
            text: 'ab\n2345',
            cursor: [1, 0],
            register: {
              '"': {
                text: '0'
              }
            }
          });
          ensure('X', {
            text: 'ab\n2345',
            cursor: [1, 0],
            register: {
              '"': {
                text: '0'
              }
            }
          });
          settings.set('wrapLeftRightMotion', true);
          return ensure('X', {
            text: 'ab2345',
            cursor: [0, 2],
            register: {
              '"': {
                text: '\n'
              }
            }
          });
        });
      });
      return describe("on an empty line", function() {
        beforeEach(function() {
          return set({
            text: "012345\n\nabcdef",
            cursor: [1, 0]
          });
        });
        it("deletes nothing when vim-mode-plus.wrapLeftRightMotion is false", function() {
          settings.set('wrapLeftRightMotion', false);
          return ensure('X', {
            text: "012345\n\nabcdef",
            cursor: [1, 0]
          });
        });
        return it("deletes the newline when wrapLeftRightMotion is true", function() {
          settings.set('wrapLeftRightMotion', true);
          return ensure('X', {
            text: "012345\nabcdef",
            cursor: [0, 5]
          });
        });
      });
    });
    describe("the d keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12345\nabcde\n\nABCDE\n",
          cursor: [1, 1]
        });
      });
      it("enters operator-pending mode", function() {
        return ensure('d', {
          mode: 'operator-pending'
        });
      });
      describe("when followed by a d", function() {
        it("deletes the current line and exits operator-pending mode", function() {
          set({
            cursor: [1, 1]
          });
          return ensure('d d', {
            text: "12345\n\nABCDE\n",
            cursor: [1, 0],
            register: {
              '"': {
                text: "abcde\n"
              }
            },
            mode: 'normal'
          });
        });
        it("deletes the last line and always make non-blank-line last line", function() {
          set({
            cursor: [2, 0]
          });
          return ensure('2 d d', {
            text: "12345\nabcde\n",
            cursor: [1, 0]
          });
        });
        return it("leaves the cursor on the first nonblank character", function() {
          set({
            textC: "1234|5\n  abcde\n"
          });
          return ensure('d d', {
            textC: "  |abcde\n"
          });
        });
      });
      describe("undo behavior", function() {
        var initialTextC, originalText, ref2;
        ref2 = [], originalText = ref2[0], initialTextC = ref2[1];
        beforeEach(function() {
          initialTextC = "12345\na|bcde\nABCDE\nQWERT";
          set({
            textC: initialTextC
          });
          return originalText = editor.getText();
        });
        it("undoes both lines", function() {
          ensure('d 2 d', {
            textC: "12345\n|QWERT"
          });
          return ensure('u', {
            textC: initialTextC,
            selectedText: ""
          });
        });
        return describe("with multiple cursors", function() {
          describe("setCursorToStartOfChangeOnUndoRedo is true(default)", function() {
            it("clear multiple cursors and set cursor to start of changes of last cursor", function() {
              set({
                text: originalText,
                cursor: [[0, 0], [1, 1]]
              });
              ensure('d l', {
                textC: "|2345\na|cde\nABCDE\nQWERT"
              });
              ensure('u', {
                textC: "12345\na|bcde\nABCDE\nQWERT",
                selectedText: ''
              });
              return ensure('ctrl-r', {
                textC: "2345\na|cde\nABCDE\nQWERT",
                selectedText: ''
              });
            });
            return it("clear multiple cursors and set cursor to start of changes of last cursor", function() {
              set({
                text: originalText,
                cursor: [[1, 1], [0, 0]]
              });
              ensure('d l', {
                text: "2345\nacde\nABCDE\nQWERT",
                cursor: [[1, 1], [0, 0]]
              });
              ensure('u', {
                textC: "|12345\nabcde\nABCDE\nQWERT",
                selectedText: ''
              });
              return ensure('ctrl-r', {
                textC: "|2345\nacde\nABCDE\nQWERT",
                selectedText: ''
              });
            });
          });
          return describe("setCursorToStartOfChangeOnUndoRedo is false", function() {
            initialTextC = null;
            beforeEach(function() {
              initialTextC = "|12345\na|bcde\nABCDE\nQWERT";
              settings.set('setCursorToStartOfChangeOnUndoRedo', false);
              set({
                textC: initialTextC
              });
              return ensure('d l', {
                textC: "|2345\na|cde\nABCDE\nQWERT"
              });
            });
            return it("put cursor to end of change (works in same way of atom's core:undo)", function() {
              return ensure('u', {
                textC: initialTextC,
                selectedText: ['', '']
              });
            });
          });
        });
      });
      describe("when followed by a w", function() {
        it("deletes the next word until the end of the line and exits operator-pending mode", function() {
          set({
            text: 'abcd efg\nabc',
            cursor: [0, 5]
          });
          return ensure('d w', {
            text: "abcd \nabc",
            cursor: [0, 4],
            mode: 'normal'
          });
        });
        return it("deletes to the beginning of the next word", function() {
          set({
            text: 'abcd efg',
            cursor: [0, 2]
          });
          ensure('d w', {
            text: 'abefg',
            cursor: [0, 2]
          });
          set({
            text: 'one two three four',
            cursor: [0, 0]
          });
          return ensure('d 3 w', {
            text: 'four',
            cursor: [0, 0]
          });
        });
      });
      describe("when followed by an iw", function() {
        return it("deletes the containing word", function() {
          set({
            text: "12345 abcde ABCDE",
            cursor: [0, 9]
          });
          ensure('d', {
            mode: 'operator-pending'
          });
          return ensure('i w', {
            text: "12345  ABCDE",
            cursor: [0, 6],
            register: {
              '"': {
                text: 'abcde'
              }
            },
            mode: 'normal'
          });
        });
      });
      describe("when followed by a j", function() {
        var originalText;
        originalText = "12345\nabcde\nABCDE\n";
        beforeEach(function() {
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the file", function() {
          return it("deletes the next two lines", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('d j', {
              text: 'ABCDE\n'
            });
          });
        });
        describe("on the middle of second line", function() {
          return it("deletes the last two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d j', {
              text: '12345\n'
            });
          });
        });
        return describe("when cursor is on blank line", function() {
          beforeEach(function() {
            return set({
              text: "a\n\n\nb\n",
              cursor: [1, 0]
            });
          });
          return it("deletes both lines", function() {
            return ensure('d j', {
              text: "a\nb\n",
              cursor: [1, 0]
            });
          });
        });
      });
      describe("when followed by an k", function() {
        var originalText;
        originalText = "12345\nabcde\nABCDE";
        beforeEach(function() {
          return set({
            text: originalText
          });
        });
        describe("on the end of the file", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [2, 4]
            });
            return ensure('d k', {
              text: '12345\n'
            });
          });
        });
        describe("on the beginning of the file", function() {
          return xit("deletes nothing", function() {
            set({
              cursor: [0, 0]
            });
            return ensure('d k', {
              text: originalText
            });
          });
        });
        describe("when on the middle of second line", function() {
          return it("deletes the first two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d k', {
              text: 'ABCDE'
            });
          });
        });
        return describe("when cursor is on blank line", function() {
          beforeEach(function() {
            return set({
              text: "a\n\n\nb\n",
              cursor: [2, 0]
            });
          });
          return it("deletes both lines", function() {
            return ensure('d k', {
              text: "a\nb\n",
              cursor: [1, 0]
            });
          });
        });
      });
      describe("when followed by a G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('d G', {
              text: '12345\n'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d G', {
              text: '12345\n'
            });
          });
        });
      });
      describe("when followed by a goto line G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('d 2 G', {
              text: '12345\nABCDE'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('d 2 G', {
              text: '12345\nABCDE'
            });
          });
        });
      });
      describe("when followed by a t)", function() {
        return describe("with the entire line yanked before", function() {
          beforeEach(function() {
            return set({
              text: "test (xyz)",
              cursor: [0, 6]
            });
          });
          return it("deletes until the closing parenthesis", function() {
            return ensure('d t )', {
              text: 'test ()',
              cursor: [0, 6]
            });
          });
        });
      });
      describe("with multiple cursors", function() {
        it("deletes each selection", function() {
          set({
            text: "abcd\n1234\nABCD\n",
            cursor: [[0, 1], [1, 2], [2, 3]]
          });
          return ensure('d e', {
            text: "a\n12\nABC",
            cursor: [[0, 0], [1, 1], [2, 2]]
          });
        });
        return it("doesn't delete empty selections", function() {
          set({
            text: "abcd\nabc\nabd",
            cursor: [[0, 0], [1, 0], [2, 0]]
          });
          return ensure('d t d', {
            text: "d\nabc\nd",
            cursor: [[0, 0], [1, 0], [2, 0]]
          });
        });
      });
      return describe("stayOnDelete setting", function() {
        beforeEach(function() {
          settings.set('stayOnDelete', true);
          return set({
            text_: "___3333\n__2222\n_1111\n__2222\n___3333\n",
            cursor: [0, 3]
          });
        });
        describe("target range is linewise range", function() {
          it("keep original column after delete", function() {
            ensure("d d", {
              cursor: [0, 3],
              text_: "__2222\n_1111\n__2222\n___3333\n"
            });
            ensure(".", {
              cursor: [0, 3],
              text_: "_1111\n__2222\n___3333\n"
            });
            ensure(".", {
              cursor: [0, 3],
              text_: "__2222\n___3333\n"
            });
            return ensure(".", {
              cursor: [0, 3],
              text_: "___3333\n"
            });
          });
          return it("v_D also keep original column after delete", function() {
            return ensure("v 2 j D", {
              cursor: [0, 3],
              text_: "__2222\n___3333\n"
            });
          });
        });
        return describe("target range is text object", function() {
          describe("target is indent", function() {
            var indentText, textData;
            indentText = "0000000000000000\n  22222222222222\n  22222222222222\n  22222222222222\n0000000000000000\n";
            textData = new TextData(indentText);
            beforeEach(function() {
              return set({
                text: textData.getRaw()
              });
            });
            it("[from top] keep column", function() {
              set({
                cursor: [1, 10]
              });
              return ensure('d i i', {
                cursor: [1, 10],
                text: textData.getLines([0, 4])
              });
            });
            it("[from middle] keep column", function() {
              set({
                cursor: [2, 10]
              });
              return ensure('d i i', {
                cursor: [1, 10],
                text: textData.getLines([0, 4])
              });
            });
            return it("[from bottom] keep column", function() {
              set({
                cursor: [3, 10]
              });
              return ensure('d i i', {
                cursor: [1, 10],
                text: textData.getLines([0, 4])
              });
            });
          });
          return describe("target is paragraph", function() {
            var B1, B2, B3, P1, P2, P3, paragraphText, textData;
            paragraphText = "p1---------------\np1---------------\np1---------------\n\np2---------------\np2---------------\np2---------------\n\np3---------------\np3---------------\np3---------------\n";
            textData = new TextData(paragraphText);
            P1 = [0, 1, 2];
            B1 = 3;
            P2 = [4, 5, 6];
            B2 = 7;
            P3 = [8, 9, 10];
            B3 = 11;
            beforeEach(function() {
              return set({
                text: textData.getRaw()
              });
            });
            it("set cursor to start of deletion after delete [from bottom of paragraph]", function() {
              var i, results;
              set({
                cursor: [0, 0]
              });
              ensure('d i p', {
                cursor: [0, 0],
                text: textData.getLines((function() {
                  results = [];
                  for (var i = B1; B1 <= B3 ? i <= B3 : i >= B3; B1 <= B3 ? i++ : i--){ results.push(i); }
                  return results;
                }).apply(this), {
                  chomp: true
                })
              });
              ensure('j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2].concat(slice.call(P3), [B3]), {
                  chomp: true
                })
              });
              return ensure('j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2, B3], {
                  chomp: true
                })
              });
            });
            it("set cursor to start of deletion after delete [from middle of paragraph]", function() {
              var i, results;
              set({
                cursor: [1, 0]
              });
              ensure('d i p', {
                cursor: [0, 0],
                text: textData.getLines((function() {
                  results = [];
                  for (var i = B1; B1 <= B3 ? i <= B3 : i >= B3; B1 <= B3 ? i++ : i--){ results.push(i); }
                  return results;
                }).apply(this), {
                  chomp: true
                })
              });
              ensure('2 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2].concat(slice.call(P3), [B3]), {
                  chomp: true
                })
              });
              return ensure('2 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2, B3], {
                  chomp: true
                })
              });
            });
            return it("set cursor to start of deletion after delete [from bottom of paragraph]", function() {
              var i, results;
              set({
                cursor: [1, 0]
              });
              ensure('d i p', {
                cursor: [0, 0],
                text: textData.getLines((function() {
                  results = [];
                  for (var i = B1; B1 <= B3 ? i <= B3 : i >= B3; B1 <= B3 ? i++ : i--){ results.push(i); }
                  return results;
                }).apply(this), {
                  chomp: true
                })
              });
              ensure('3 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2].concat(slice.call(P3), [B3]), {
                  chomp: true
                })
              });
              return ensure('3 j .', {
                cursor: [1, 0],
                text: textData.getLines([B1, B2, B3], {
                  chomp: true
                })
              });
            });
          });
        });
      });
    });
    describe("the D keybinding", function() {
      beforeEach(function() {
        return set({
          text: "0000\n1111\n2222\n3333",
          cursor: [0, 1]
        });
      });
      it("deletes the contents until the end of the line", function() {
        return ensure('D', {
          text: "0\n1111\n2222\n3333"
        });
      });
      return it("in visual-mode, it delete whole line", function() {
        ensure('v D', {
          text: "1111\n2222\n3333"
        });
        return ensure("v j D", {
          text: "3333"
        });
      });
    });
    describe("the y keybinding", function() {
      beforeEach(function() {
        return set({
          textC: "012 |345\nabc\n"
        });
      });
      describe("when useClipboardAsDefaultRegister enabled", function() {
        beforeEach(function() {
          settings.set('useClipboardAsDefaultRegister', true);
          atom.clipboard.write('___________');
          return ensure({
            register: {
              '"': {
                text: '___________'
              }
            }
          });
        });
        return describe("read/write to clipboard through register", function() {
          return it("writes to clipboard with default register", function() {
            var savedText;
            savedText = '012 345\n';
            ensure('y y', {
              register: {
                '"': {
                  text: savedText
                }
              }
            });
            return expect(atom.clipboard.read()).toBe(savedText);
          });
        });
      });
      describe("visual-mode.linewise", function() {
        beforeEach(function() {
          return set({
            textC: "0000|00\n111111\n222222\n"
          });
        });
        describe("selection not reversed", function() {
          return it("saves to register(type=linewise), cursor move to start of target", function() {
            return ensure("V j y", {
              cursor: [0, 0],
              register: {
                '"': {
                  text: "000000\n111111\n",
                  type: 'linewise'
                }
              }
            });
          });
        });
        return describe("selection is reversed", function() {
          return it("saves to register(type=linewise), cursor doesn't move", function() {
            set({
              cursor: [2, 2]
            });
            return ensure("V k y", {
              cursor: [1, 2],
              register: {
                '"': {
                  text: "111111\n222222\n",
                  type: 'linewise'
                }
              }
            });
          });
        });
      });
      describe("visual-mode.blockwise", function() {
        beforeEach(function() {
          set({
            textC_: "000000\n1!11111\n222222\n333333\n4|44444\n555555\n"
          });
          return ensure("ctrl-v l l j", {
            selectedTextOrdered: ["111", "222", "444", "555"],
            mode: ['visual', 'blockwise']
          });
        });
        describe("when stayOnYank = false", function() {
          return it("place cursor at start of block after yank", function() {
            return ensure("y", {
              mode: 'normal',
              textC_: "000000\n1!11111\n222222\n333333\n4|44444\n555555\n"
            });
          });
        });
        return describe("when stayOnYank = true", function() {
          beforeEach(function() {
            return settings.set('stayOnYank', true);
          });
          return it("place cursor at head of block after yank", function() {
            return ensure("y", {
              mode: 'normal',
              textC_: "000000\n111111\n222!222\n333333\n444444\n555|555\n"
            });
          });
        });
      });
      describe("y y", function() {
        it("saves to register(type=linewise), cursor stay at same position", function() {
          return ensure('y y', {
            cursor: [0, 4],
            register: {
              '"': {
                text: "012 345\n",
                type: 'linewise'
              }
            }
          });
        });
        it("[N y y] yank N line, starting from the current", function() {
          return ensure('y 2 y', {
            cursor: [0, 4],
            register: {
              '"': {
                text: "012 345\nabc\n"
              }
            }
          });
        });
        return it("[y N y] yank N line, starting from the current", function() {
          return ensure('2 y y', {
            cursor: [0, 4],
            register: {
              '"': {
                text: "012 345\nabc\n"
              }
            }
          });
        });
      });
      describe("with a register", function() {
        return it("saves the line to the a register", function() {
          return ensure('" a y y', {
            register: {
              a: {
                text: "012 345\n"
              }
            }
          });
        });
      });
      describe("with A register", function() {
        return it("append to existing value of lowercase-named register", function() {
          ensure('" a y y', {
            register: {
              a: {
                text: "012 345\n"
              }
            }
          });
          return ensure('" A y y', {
            register: {
              a: {
                text: "012 345\n012 345\n"
              }
            }
          });
        });
      });
      describe("with a motion", function() {
        beforeEach(function() {
          return settings.set('useClipboardAsDefaultRegister', false);
        });
        it("yank from here to destnation of motion", function() {
          return ensure('y e', {
            cursor: [0, 4],
            register: {
              '"': {
                text: '345'
              }
            }
          });
        });
        it("does not yank when motion failed", function() {
          return ensure('y t x', {
            register: {
              '"': {
                text: void 0
              }
            }
          });
        });
        it("yank and move cursor to start of target", function() {
          return ensure('y h', {
            cursor: [0, 3],
            register: {
              '"': {
                text: ' '
              }
            }
          });
        });
        return it("[with linewise motion] yank and desn't move cursor", function() {
          return ensure('y j', {
            cursor: [0, 4],
            register: {
              '"': {
                text: "012 345\nabc\n",
                type: 'linewise'
              }
            }
          });
        });
      });
      describe("with a text-obj", function() {
        beforeEach(function() {
          return set({
            cursor: [2, 8],
            text: "\n1st paragraph\n1st paragraph\n\n2n paragraph\n2n paragraph\n"
          });
        });
        it("inner-word and move cursor to start of target", function() {
          return ensure('y i w', {
            register: {
              '"': {
                text: "paragraph"
              }
            },
            cursor: [2, 4]
          });
        });
        return it("yank text-object inner-paragraph and move cursor to start of target", function() {
          return ensure('y i p', {
            cursor: [1, 0],
            register: {
              '"': {
                text: "1st paragraph\n1st paragraph\n"
              }
            }
          });
        });
      });
      describe("when followed by a G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE\n";
          return set({
            text: originalText
          });
        });
        it("yank and doesn't move cursor", function() {
          set({
            cursor: [1, 0]
          });
          return ensure('y G', {
            register: {
              '"': {
                text: "abcde\nABCDE\n",
                type: 'linewise'
              }
            },
            cursor: [1, 0]
          });
        });
        return it("yank and doesn't move cursor", function() {
          set({
            cursor: [1, 2]
          });
          return ensure('y G', {
            register: {
              '"': {
                text: "abcde\nABCDE\n",
                type: 'linewise'
              }
            },
            cursor: [1, 2]
          });
        });
      });
      describe("when followed by a goto line G", function() {
        beforeEach(function() {
          var originalText;
          originalText = "12345\nabcde\nABCDE";
          return set({
            text: originalText
          });
        });
        describe("on the beginning of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 0]
            });
            return ensure('y 2 G P', {
              text: '12345\nabcde\nabcde\nABCDE'
            });
          });
        });
        return describe("on the middle of the second line", function() {
          return it("deletes the bottom two lines", function() {
            set({
              cursor: [1, 2]
            });
            return ensure('y 2 G P', {
              text: '12345\nabcde\nabcde\nABCDE'
            });
          });
        });
      });
      describe("with multiple cursors", function() {
        return it("moves each cursor and copies the last selection's text", function() {
          set({
            text: "  abcd\n  1234",
            cursor: [[0, 0], [1, 5]]
          });
          return ensure('y ^', {
            register: {
              '"': {
                text: '123'
              }
            },
            cursor: [[0, 0], [1, 2]]
          });
        });
      });
      return describe("stayOnYank setting", function() {
        var text;
        text = null;
        beforeEach(function() {
          settings.set('stayOnYank', true);
          text = new TextData("0_234567\n1_234567\n2_234567\n\n4_234567\n");
          return set({
            text: text.getRaw(),
            cursor: [1, 2]
          });
        });
        it("don't move cursor after yank from normal-mode", function() {
          ensure("y i p", {
            cursor: [1, 2],
            register: {
              '"': {
                text: text.getLines([0, 1, 2])
              }
            }
          });
          ensure("j y y", {
            cursor: [2, 2],
            register: {
              '"': {
                text: text.getLines([2])
              }
            }
          });
          ensure("k .", {
            cursor: [1, 2],
            register: {
              '"': {
                text: text.getLines([1])
              }
            }
          });
          ensure("y h", {
            cursor: [1, 2],
            register: {
              '"': {
                text: "_"
              }
            }
          });
          return ensure("y b", {
            cursor: [1, 2],
            register: {
              '"': {
                text: "1_"
              }
            }
          });
        });
        it("don't move cursor after yank from visual-linewise", function() {
          ensure("V y", {
            cursor: [1, 2],
            register: {
              '"': {
                text: text.getLines([1])
              }
            }
          });
          return ensure("V j y", {
            cursor: [2, 2],
            register: {
              '"': {
                text: text.getLines([1, 2])
              }
            }
          });
        });
        return it("don't move cursor after yank from visual-characterwise", function() {
          ensure("v l l y", {
            cursor: [1, 4],
            register: {
              '"': {
                text: "234"
              }
            }
          });
          ensure("v h h y", {
            cursor: [1, 2],
            register: {
              '"': {
                text: "234"
              }
            }
          });
          ensure("v j y", {
            cursor: [2, 2],
            register: {
              '"': {
                text: "234567\n2_2"
              }
            }
          });
          return ensure("v 2 k y", {
            cursor: [0, 2],
            register: {
              '"': {
                text: "234567\n1_234567\n2_2"
              }
            }
          });
        });
      });
    });
    describe("the yy keybinding", function() {
      describe("on a single line file", function() {
        beforeEach(function() {
          return set({
            text: "exclamation!\n",
            cursor: [0, 0]
          });
        });
        return it("copies the entire line and pastes it correctly", function() {
          return ensure('y y p', {
            register: {
              '"': {
                text: "exclamation!\n"
              }
            },
            text: "exclamation!\nexclamation!\n"
          });
        });
      });
      return describe("on a single line file with no newline", function() {
        beforeEach(function() {
          return set({
            text: "no newline!",
            cursor: [0, 0]
          });
        });
        it("copies the entire line and pastes it correctly", function() {
          return ensure('y y p', {
            register: {
              '"': {
                text: "no newline!\n"
              }
            },
            text: "no newline!\nno newline!\n"
          });
        });
        return it("copies the entire line and pastes it respecting count and new lines", function() {
          return ensure('y y 2 p', {
            register: {
              '"': {
                text: "no newline!\n"
              }
            },
            text: "no newline!\nno newline!\nno newline!\n"
          });
        });
      });
    });
    describe("the Y keybinding", function() {
      var text;
      text = null;
      beforeEach(function() {
        text = "012 345\nabc\n";
        return set({
          text: text,
          cursor: [0, 4]
        });
      });
      it("saves the line to the default register", function() {
        return ensure('Y', {
          cursor: [0, 4],
          register: {
            '"': {
              text: "012 345\n"
            }
          }
        });
      });
      return it("yank the whole lines to the default register", function() {
        return ensure('v j Y', {
          cursor: [0, 0],
          register: {
            '"': {
              text: text
            }
          }
        });
      });
    });
    describe("the p keybinding", function() {
      describe("with single line character contents", function() {
        beforeEach(function() {
          settings.set('useClipboardAsDefaultRegister', false);
          set({
            textC: "|012\n"
          });
          set({
            register: {
              '"': {
                text: '345'
              }
            }
          });
          set({
            register: {
              'a': {
                text: 'a'
              }
            }
          });
          return atom.clipboard.write("clip");
        });
        describe("from the default register", function() {
          return it("inserts the contents", function() {
            return ensure("p", {
              textC: "034|512\n"
            });
          });
        });
        describe("at the end of a line", function() {
          beforeEach(function() {
            return set({
              textC: "01|2\n"
            });
          });
          return it("positions cursor correctly", function() {
            return ensure("p", {
              textC: "01234|5\n"
            });
          });
        });
        describe("paste to empty line", function() {
          return it("paste content to that empty line", function() {
            set({
              textC: "1st\n|\n3rd",
              register: {
                '"': {
                  text: '2nd'
                }
              }
            });
            return ensure('p', {
              textC: "1st\n2n|d\n3rd"
            });
          });
        });
        describe("when useClipboardAsDefaultRegister enabled", function() {
          return it("inserts contents from clipboard", function() {
            settings.set('useClipboardAsDefaultRegister', true);
            return ensure('p', {
              textC: "0cli|p12\n"
            });
          });
        });
        describe("from a specified register", function() {
          return it("inserts the contents of the 'a' register", function() {
            return ensure('" a p', {
              textC: "0|a12\n"
            });
          });
        });
        return describe("at the end of a line", function() {
          return it("inserts before the current line's newline", function() {
            set({
              textC: "abcde\none |two three"
            });
            return ensure('d $ k $ p', {
              textC_: "abcdetwo thre|e\none_"
            });
          });
        });
      });
      describe("with multiline character contents", function() {
        beforeEach(function() {
          set({
            textC: "|012\n"
          });
          return set({
            register: {
              '"': {
                text: '345\n678'
              }
            }
          });
        });
        it("p place cursor at start of mutation", function() {
          return ensure("p", {
            textC: "0|345\n67812\n"
          });
        });
        return it("P place cursor at start of mutation", function() {
          return ensure("P", {
            textC: "|345\n678012\n"
          });
        });
      });
      describe("with linewise contents", function() {
        describe("on a single line", function() {
          beforeEach(function() {
            return set({
              textC: '0|12',
              register: {
                '"': {
                  text: " 345\n",
                  type: 'linewise'
                }
              }
            });
          });
          it("inserts the contents of the default register", function() {
            return ensure('p', {
              textC_: "012\n_|345\n"
            });
          });
          return it("replaces the current selection and put cursor to the first char of line", function() {
            return ensure('v p', {
              textC_: "0\n_|345\n2"
            });
          });
        });
        return describe("on multiple lines", function() {
          beforeEach(function() {
            return set({
              text: "012\n 345",
              register: {
                '"': {
                  text: " 456\n",
                  type: 'linewise'
                }
              }
            });
          });
          it("inserts the contents of the default register at middle line", function() {
            set({
              cursor: [0, 1]
            });
            return ensure("p", {
              textC: "012\n |456\n 345"
            });
          });
          return it("inserts the contents of the default register at end of line", function() {
            set({
              cursor: [1, 1]
            });
            return ensure('p', {
              textC: "012\n 345\n |456\n"
            });
          });
        });
      });
      describe("with multiple linewise contents", function() {
        beforeEach(function() {
          return set({
            textC: "012\n|abc",
            register: {
              '"': {
                text: " 345\n 678\n",
                type: 'linewise'
              }
            }
          });
        });
        return it("inserts the contents of the default register", function() {
          return ensure('p', {
            textC: "012\nabc\n |345\n 678\n"
          });
        });
      });
      describe("put-after-with-auto-indent command", function() {
        beforeEach(function() {
          waitsForPromise(function() {
            settings.set('useClipboardAsDefaultRegister', false);
            return atom.packages.activatePackage('language-javascript');
          });
          return runs(function() {
            return set({
              grammar: 'source.js'
            });
          });
        });
        describe("paste with auto-indent", function() {
          it("inserts the contents of the default register", function() {
            set({
              register: {
                '"': {
                  text: " 345\n",
                  type: 'linewise'
                }
              },
              textC_: "if| () {\n}"
            });
            return ensureByDispatch('vim-mode-plus:put-after-with-auto-indent', {
              textC_: "if () {\n  |345\n}"
            });
          });
          return it("multi-line register contents with auto indent", function() {
            var registerContent;
            registerContent = "if(3) {\n  if(4) {}\n}";
            set({
              register: {
                '"': {
                  text: registerContent,
                  type: 'linewise'
                }
              },
              textC: "if (1) {\n  |if (2) {\n  }\n}"
            });
            return ensureByDispatch('vim-mode-plus:put-after-with-auto-indent', {
              textC: "if (1) {\n  if (2) {\n    |if(3) {\n      if(4) {}\n    }\n  }\n}"
            });
          });
        });
        return describe("when pasting already indented multi-lines register content", function() {
          beforeEach(function() {
            return set({
              textC: "if (1) {\n  |if (2) {\n  }\n}"
            });
          });
          it("keep original layout", function() {
            var registerContent;
            registerContent = "   a: 123,\nbbbb: 456,";
            set({
              register: {
                '"': {
                  text: registerContent,
                  type: 'linewise'
                }
              }
            });
            return ensureByDispatch('vim-mode-plus:put-after-with-auto-indent', {
              textC: "if (1) {\n  if (2) {\n       |a: 123,\n    bbbb: 456,\n  }\n}"
            });
          });
          return it("keep original layout [register content have blank row]", function() {
            var registerContent;
            registerContent = "if(3) {\n__abc\n\n__def\n}".replace(/_/g, ' ');
            set({
              register: {
                '"': {
                  text: registerContent,
                  type: 'linewise'
                }
              }
            });
            return ensureByDispatch('vim-mode-plus:put-after-with-auto-indent', {
              textC_: "if (1) {\n  if (2) {\n    |if(3) {\n      abc\n\n      def\n    }\n  }\n}"
            });
          });
        });
      });
      describe("pasting twice", function() {
        beforeEach(function() {
          set({
            text: "12345\nabcde\nABCDE\nQWERT",
            cursor: [1, 1],
            register: {
              '"': {
                text: '123'
              }
            }
          });
          return keystroke('2 p');
        });
        it("inserts the same line twice", function() {
          return ensure({
            text: "12345\nab123123cde\nABCDE\nQWERT"
          });
        });
        return describe("when undone", function() {
          return it("removes both lines", function() {
            return ensure('u', {
              text: "12345\nabcde\nABCDE\nQWERT"
            });
          });
        });
      });
      describe("support multiple cursors", function() {
        return it("paste text for each cursors", function() {
          set({
            text: "12345\nabcde\nABCDE\nQWERT",
            cursor: [[1, 0], [2, 0]],
            register: {
              '"': {
                text: 'ZZZ'
              }
            }
          });
          return ensure('p', {
            text: "12345\naZZZbcde\nAZZZBCDE\nQWERT",
            cursor: [[1, 3], [2, 3]]
          });
        });
      });
      return describe("with a selection", function() {
        beforeEach(function() {
          return set({
            text: '012\n',
            cursor: [0, 1]
          });
        });
        describe("with characterwise selection", function() {
          it("replaces selection with charwise content", function() {
            set({
              register: {
                '"': {
                  text: "345"
                }
              }
            });
            return ensure('v p', {
              text: "03452\n",
              cursor: [0, 3]
            });
          });
          return it("replaces selection with linewise content", function() {
            set({
              register: {
                '"': {
                  text: "345\n"
                }
              }
            });
            return ensure('v p', {
              text: "0\n345\n2\n",
              cursor: [1, 0]
            });
          });
        });
        return describe("with linewise selection", function() {
          it("replaces selection with charwise content", function() {
            set({
              text: "012\nabc",
              cursor: [0, 1]
            });
            set({
              register: {
                '"': {
                  text: "345"
                }
              }
            });
            return ensure('V p', {
              text: "345\nabc",
              cursor: [0, 0]
            });
          });
          return it("replaces selection with linewise content", function() {
            set({
              register: {
                '"': {
                  text: "345\n"
                }
              }
            });
            return ensure('V p', {
              text: "345\n",
              cursor: [0, 0]
            });
          });
        });
      });
    });
    describe("the P keybinding", function() {
      return describe("with character contents", function() {
        beforeEach(function() {
          set({
            text: "012\n",
            cursor: [0, 0]
          });
          set({
            register: {
              '"': {
                text: '345'
              }
            }
          });
          set({
            register: {
              a: {
                text: 'a'
              }
            }
          });
          return keystroke('P');
        });
        return it("inserts the contents of the default register above", function() {
          return ensure({
            text: "345012\n",
            cursor: [0, 2]
          });
        });
      });
    });
    describe("the . keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12\n34\n56\n78",
          cursor: [0, 0]
        });
      });
      it("repeats the last operation", function() {
        return ensure('2 d d .', {
          text: ""
        });
      });
      return it("composes with motions", function() {
        return ensure('d d 2 .', {
          text: "78"
        });
      });
    });
    describe("the r keybinding", function() {
      beforeEach(function() {
        return set({
          text: "12\n34\n\n",
          cursor: [[0, 0], [1, 0]]
        });
      });
      it("replaces a single character", function() {
        return ensure('r x', {
          text: 'x2\nx4\n\n'
        });
      });
      it("remain visual-mode when cancelled", function() {
        return ensure('v r escape', {
          text: '12\n34\n\n',
          mode: ['visual', 'characterwise']
        });
      });
      it("replaces a single character with a line break", function() {
        return ensure('r enter', {
          text: '\n2\n\n4\n\n',
          cursor: [[1, 0], [3, 0]]
        });
      });
      it("auto indent when replaced with singe new line", function() {
        set({
          textC_: "__a|bc"
        });
        return ensure('r enter', {
          textC_: "__a\n__|c"
        });
      });
      it("composes properly with motions", function() {
        return ensure('2 r x', {
          text: 'xx\nxx\n\n'
        });
      });
      it("does nothing on an empty line", function() {
        set({
          cursor: [2, 0]
        });
        return ensure('r x', {
          text: '12\n34\n\n'
        });
      });
      it("does nothing if asked to replace more characters than there are on a line", function() {
        return ensure('3 r x', {
          text: '12\n34\n\n'
        });
      });
      describe("cancellation", function() {
        it("does nothing when cancelled", function() {
          return ensure('r escape', {
            text: '12\n34\n\n',
            mode: 'normal'
          });
        });
        it("keep multi-cursor on cancelled", function() {
          set({
            textC: "|    a\n!    a\n|    a\n"
          });
          return ensure("r escape", {
            textC: "|    a\n!    a\n|    a\n",
            mode: "normal"
          });
        });
        return it("keep multi-cursor on cancelled", function() {
          set({
            textC: "|**a\n!**a\n|**a\n"
          });
          ensure("v l", {
            textC: "**|a\n**!a\n**|a\n",
            selectedText: ["**", "**", "**"],
            mode: ["visual", "characterwise"]
          });
          return ensure("r escape", {
            textC: "**|a\n**!a\n**|a\n",
            selectedText: ["**", "**", "**"],
            mode: ["visual", "characterwise"]
          });
        });
      });
      describe("when in visual mode", function() {
        beforeEach(function() {
          return keystroke('v e');
        });
        it("replaces the entire selection with the given character", function() {
          return ensure('r x', {
            text: 'xx\nxx\n\n'
          });
        });
        return it("leaves the cursor at the beginning of the selection", function() {
          return ensure('r x', {
            cursor: [[0, 0], [1, 0]]
          });
        });
      });
      return describe("when in visual-block mode", function() {
        beforeEach(function() {
          set({
            cursor: [1, 4],
            text: "0:2345\n1: o11o\n2: o22o\n3: o33o\n4: o44o\n"
          });
          return ensure('ctrl-v l 3 j', {
            mode: ['visual', 'blockwise'],
            selectedTextOrdered: ['11', '22', '33', '44']
          });
        });
        return it("replaces each selection and put cursor on start of top selection", function() {
          ensure('r x', {
            mode: 'normal',
            cursor: [1, 4],
            text: "0:2345\n1: oxxo\n2: oxxo\n3: oxxo\n4: oxxo\n"
          });
          set({
            cursor: [1, 0]
          });
          return ensure('.', {
            mode: 'normal',
            cursor: [1, 0],
            text: "0:2345\nxx oxxo\nxx oxxo\nxx oxxo\nxx oxxo\n"
          });
        });
      });
    });
    describe('the m keybinding', function() {
      beforeEach(function() {
        return set({
          text: '12\n34\n56\n',
          cursor: [0, 1]
        });
      });
      return it('marks a position', function() {
        keystroke('m a');
        return expect(vimState.mark.get('a')).toEqual([0, 1]);
      });
    });
    describe('the R keybinding', function() {
      beforeEach(function() {
        return set({
          text: "12345\n67890",
          cursor: [0, 2]
        });
      });
      it("enters replace mode and replaces characters", function() {
        ensure('R', {
          mode: ['insert', 'replace']
        });
        editor.insertText("ab");
        return ensure('escape', {
          text: "12ab5\n67890",
          cursor: [0, 3],
          mode: 'normal'
        });
      });
      it("continues beyond end of line as insert", function() {
        ensure('R', {
          mode: ['insert', 'replace']
        });
        editor.insertText("abcde");
        return ensure('escape', {
          text: '12abcde\n67890'
        });
      });
      it('treats backspace as undo', function() {
        editor.insertText("foo");
        keystroke('R');
        editor.insertText("a");
        editor.insertText("b");
        ensure({
          text: "12fooab5\n67890"
        });
        ensure('backspace', {
          text: "12fooa45\n67890"
        });
        editor.insertText("c");
        ensure({
          text: "12fooac5\n67890"
        });
        ensure('backspace backspace', {
          text: "12foo345\n67890",
          selectedText: ''
        });
        return ensure('backspace', {
          text: "12foo345\n67890",
          selectedText: ''
        });
      });
      it("can be repeated", function() {
        keystroke('R');
        editor.insertText("ab");
        keystroke('escape');
        set({
          cursor: [1, 2]
        });
        ensure('.', {
          text: "12ab5\n67ab0",
          cursor: [1, 3]
        });
        set({
          cursor: [0, 4]
        });
        return ensure('.', {
          text: "12abab\n67ab0",
          cursor: [0, 5]
        });
      });
      it("can be interrupted by arrow keys and behave as insert for repeat", function() {});
      it("repeats correctly when backspace was used in the text", function() {
        keystroke('R');
        editor.insertText("a");
        keystroke('backspace');
        editor.insertText("b");
        keystroke('escape');
        set({
          cursor: [1, 2]
        });
        ensure('.', {
          text: "12b45\n67b90",
          cursor: [1, 2]
        });
        set({
          cursor: [0, 4]
        });
        return ensure('.', {
          text: "12b4b\n67b90",
          cursor: [0, 4]
        });
      });
      it("doesn't replace a character if newline is entered", function() {
        ensure('R', {
          mode: ['insert', 'replace']
        });
        editor.insertText("\n");
        return ensure('escape', {
          text: "12\n345\n67890"
        });
      });
      return describe("multiline situation", function() {
        var textOriginal;
        textOriginal = "01234\n56789";
        beforeEach(function() {
          return set({
            text: textOriginal,
            cursor: [0, 0]
          });
        });
        it("replace character unless input isnt new line(\\n)", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          editor.insertText("a\nb\nc");
          return ensure({
            text: "a\nb\nc34\n56789",
            cursor: [2, 1]
          });
        });
        it("handle backspace", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          set({
            cursor: [0, 1]
          });
          editor.insertText("a\nb\nc");
          ensure({
            text: "0a\nb\nc4\n56789",
            cursor: [2, 1]
          });
          ensure('backspace', {
            text: "0a\nb\n34\n56789",
            cursor: [2, 0]
          });
          ensure('backspace', {
            text: "0a\nb34\n56789",
            cursor: [1, 1]
          });
          ensure('backspace', {
            text: "0a\n234\n56789",
            cursor: [1, 0]
          });
          ensure('backspace', {
            text: "0a234\n56789",
            cursor: [0, 2]
          });
          ensure('backspace', {
            text: "01234\n56789",
            cursor: [0, 1]
          });
          ensure('backspace', {
            text: "01234\n56789",
            cursor: [0, 1]
          });
          return ensure('escape', {
            text: "01234\n56789",
            cursor: [0, 0],
            mode: 'normal'
          });
        });
        it("repeate multiline text case-1", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          editor.insertText("abc\ndef");
          ensure({
            text: "abc\ndef\n56789",
            cursor: [1, 3]
          });
          ensure('escape', {
            cursor: [1, 2],
            mode: 'normal'
          });
          ensure('u', {
            text: textOriginal
          });
          ensure('.', {
            text: "abc\ndef\n56789",
            cursor: [1, 2],
            mode: 'normal'
          });
          return ensure('j .', {
            text: "abc\ndef\n56abc\ndef",
            cursor: [3, 2],
            mode: 'normal'
          });
        });
        return it("repeate multiline text case-2", function() {
          ensure('R', {
            mode: ['insert', 'replace']
          });
          editor.insertText("abc\nd");
          ensure({
            text: "abc\nd4\n56789",
            cursor: [1, 1]
          });
          ensure('escape', {
            cursor: [1, 0],
            mode: 'normal'
          });
          return ensure('j .', {
            text: "abc\nd4\nabc\nd9",
            cursor: [3, 0],
            mode: 'normal'
          });
        });
      });
    });
    return describe('AddBlankLineBelow, AddBlankLineAbove', function() {
      beforeEach(function() {
        set({
          textC: "line0\nli|ne1\nline2\nline3"
        });
        return atom.keymaps.add("test", {
          'atom-text-editor.vim-mode-plus.normal-mode': {
            'enter': 'vim-mode-plus:add-blank-line-below',
            'shift-enter': 'vim-mode-plus:add-blank-line-above'
          }
        });
      });
      it("insert blank line below/above", function() {
        ensure("enter", {
          textC: "line0\nli|ne1\n\nline2\nline3"
        });
        return ensure("shift-enter", {
          textC: "line0\n\nli|ne1\n\nline2\nline3"
        });
      });
      return it("[with-count] insert blank line below/above", function() {
        ensure("2 enter", {
          textC: "line0\nli|ne1\n\n\nline2\nline3"
        });
        return ensure("2 shift-enter", {
          textC: "line0\n\n\nli|ne1\n\n\nline2\nline3"
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvb3BlcmF0b3ItZ2VuZXJhbC1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOENBQUE7SUFBQTs7RUFBQSxNQUFvQyxPQUFBLENBQVEsZUFBUixDQUFwQyxFQUFDLDZCQUFELEVBQWMsdUJBQWQsRUFBd0I7O0VBQ3hCLFFBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0VBRVgsUUFBQSxDQUFTLGtCQUFULEVBQTZCLFNBQUE7QUFDM0IsUUFBQTtJQUFBLE9BQThFLEVBQTlFLEVBQUMsYUFBRCxFQUFNLGdCQUFOLEVBQWMsMEJBQWQsRUFBZ0MsbUJBQWhDLEVBQTJDLGdCQUEzQyxFQUFtRCx1QkFBbkQsRUFBa0U7SUFFbEUsVUFBQSxDQUFXLFNBQUE7YUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx1Q0FBZCxFQUFnQyx5QkFBaEMsRUFBNkM7TUFIbkMsQ0FBWjtJQURTLENBQVg7SUFNQSxRQUFBLENBQVMsdUJBQVQsRUFBa0MsU0FBQTthQUNoQyxFQUFBLENBQUcseUJBQUgsRUFBOEIsU0FBQTtRQUM1QixTQUFBLENBQVUsR0FBVjtRQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQXhCLENBQUEsQ0FBUCxDQUF5QyxDQUFDLElBQTFDLENBQStDLEtBQS9DO1FBQ0EsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFyQixDQUFBO1FBQ0EsTUFBQSxDQUFPLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBeEIsQ0FBQSxDQUFQLENBQXlDLENBQUMsSUFBMUMsQ0FBK0MsSUFBL0M7ZUFDQSxNQUFBLENBQU8sU0FBQTtpQkFBRyxRQUFRLENBQUMsV0FBVyxD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TUFBQSxDQUFPLGFBQVAsRUFDRTtVQUFBLEtBQUEsRUFBTyxpQ0FBUDtTQURGO01BVGtDLENBQXBDO2FBbUJBLEVBQUEsQ0FBRyw0Q0FBSCxFQUFpRCxTQUFBO1FBQy9DLE1BQUEsQ0FBTyxTQUFQLEVBQ0U7VUFBQSxLQUFBLEVBQU8saUNBQVA7U0FERjtlQVNBLE1BQUEsQ0FBTyxlQUFQLEVBQ0U7VUFBQSxLQUFBLEVBQU8scUNBQVA7U0FERjtNQVYrQyxDQUFqRDtJQWxDK0MsQ0FBakQ7RUF0NEMyQixDQUE3QjtBQUhBIiwic291cmNlc0NvbnRlbnQiOlsie2dldFZpbVN0YXRlLCBkaXNwYXRjaCwgVGV4dERhdGF9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcbnNldHRpbmdzID0gcmVxdWlyZSAnLi4vbGliL3NldHRpbmdzJ1xuXG5kZXNjcmliZSBcIk9wZXJhdG9yIGdlbmVyYWxcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBlbnN1cmVCeURpc3BhdGNoLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGVuc3VyZUJ5RGlzcGF0Y2gsIGtleXN0cm9rZX0gPSB2aW1cblxuICBkZXNjcmliZSBcImNhbmNlbGxpbmcgb3BlcmF0aW9uc1wiLCAtPlxuICAgIGl0IFwiY2xlYXIgcGVuZGluZyBvcGVyYXRpb25cIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnLydcbiAgICAgIGV4cGVjdCh2aW1TdGF0ZS5vcGVyYXRpb25TdGFjay5pc0VtcHR5KCkpLnRvQmUgZmFsc2VcbiAgICAgIHZpbVN0YXRlLnNlYXJjaElucHV0LmNhbmNlbCgpXG4gICAgICBleHBlY3QodmltU3RhdGUub3BlcmF0aW9uU3RhY2suaXNFbXB0eSgpKS50b0JlIHRydWVcbiAgICAgIGV4cGVjdCgtPiB2aW1TdGF0ZS5zZWFyY2hJbnB1dC5jYW5jZWwoKSkubm90LnRvVGhyb3coKVxuXG4gIGRlc2NyaWJlIFwidGhlIHgga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwib24gYSBsaW5lIHdpdGggY29udGVudFwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJ3aXRob3V0IHZpbS1tb2RlLXBsdXMud3JhcExlZnRSaWdodE1vdGlvblwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcImFiY1xcbjAxMjM0NVxcblxcbnh5elwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCA0XVxuXG4gICAgICAgIGl0IFwiZGVsZXRlcyBhIGNoYXJhY3RlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG4wMTIzNVxcblxcbnh5eicsIGN1cnNvcjogWzEsIDRdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzQnXG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjAxMjNcXG5cXG54eXonICwgY3Vyc29yOiBbMSwgM10sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnNSdcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuMDEyXFxuXFxueHl6JyAgLCBjdXJzb3I6IFsxLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICczJ1xuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG4wMVxcblxcbnh5eicgICAsIGN1cnNvcjogWzEsIDFdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzInXG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjBcXG5cXG54eXonICAgICwgY3Vyc29yOiBbMSwgMF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMSdcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuXFxuXFxueHl6JyAgICAgLCBjdXJzb3I6IFsxLCAwXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcwJ1xuXG4gICAgICAgIGl0IFwiZGVsZXRlcyBtdWx0aXBsZSBjaGFyYWN0ZXJzIHdpdGggYSBjb3VudFwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnMiB4JywgdGV4dDogJ2FiY1xcbjAxMjNcXG5cXG54eXonLCBjdXJzb3I6IFsxLCAzXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICc0NSdcbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgICBlbnN1cmUgJzMgeCcsXG4gICAgICAgICAgICB0ZXh0OiAnYVxcbjAxMjNcXG5cXG54eXonXG4gICAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdiYydcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIG11bHRpcGxlIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJhYmNcXG4wMTIzNDVcXG5cXG54eXpcIlxuICAgICAgICAgICAgY3Vyc29yOiBbWzEsIDRdLCBbMCwgMV1dXG5cbiAgICAgICAgaXQgXCJpcyB1bmRvbmUgYXMgb25lIG9wZXJhdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6IFwiYWNcXG4wMTIzNVxcblxcbnh5elwiXG4gICAgICAgICAgZW5zdXJlICd1JywgdGV4dDogJ2FiY1xcbjAxMjM0NVxcblxcbnh5eidcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIHZpbS1tb2RlLXBsdXMud3JhcExlZnRSaWdodE1vdGlvblwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHRleHQ6ICdhYmNcXG4wMTIzNDVcXG5cXG54eXonLCBjdXJzb3I6IFsxLCA0XVxuICAgICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG5cbiAgICAgICAgaXQgXCJkZWxldGVzIGEgY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgICAgIyBjb3B5IG9mIHRoZSBlYXJsaWVyIHRlc3QgYmVjYXVzZSB3cmFwTGVmdFJpZ2h0TW90aW9uIHNob3VsZCBub3QgYWZmZWN0IGl0XG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjAxMjM1XFxuXFxueHl6JywgY3Vyc29yOiBbMSwgNF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnNCdcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuMDEyM1xcblxcbnh5eicgLCBjdXJzb3I6IFsxLCAzXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICc1J1xuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG4wMTJcXG5cXG54eXonICAsIGN1cnNvcjogWzEsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzMnXG4gICAgICAgICAgZW5zdXJlICd4JywgdGV4dDogJ2FiY1xcbjAxXFxuXFxueHl6JyAgICwgY3Vyc29yOiBbMSwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMidcbiAgICAgICAgICBlbnN1cmUgJ3gnLCB0ZXh0OiAnYWJjXFxuMFxcblxcbnh5eicgICAgLCBjdXJzb3I6IFsxLCAwXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcxJ1xuICAgICAgICAgIGVuc3VyZSAneCcsIHRleHQ6ICdhYmNcXG5cXG5cXG54eXonICAgICAsIGN1cnNvcjogWzEsIDBdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzAnXG5cbiAgICAgICAgaXQgXCJkZWxldGVzIG11bHRpcGxlIGNoYXJhY3RlcnMgYW5kIG5ld2xpbmVzIHdpdGggYSBjb3VudFwiLCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG4gICAgICAgICAgZW5zdXJlICcyIHgnLCB0ZXh0OiAnYWJjXFxuMDEyM1xcblxcbnh5eicsIGN1cnNvcjogWzEsIDNdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzQ1J1xuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAxXVxuICAgICAgICAgIGVuc3VyZSAnMyB4JywgdGV4dDogJ2EwMTIzXFxuXFxueHl6JywgY3Vyc29yOiBbMCwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnYmNcXG4nXG4gICAgICAgICAgZW5zdXJlICc3IHgnLCB0ZXh0OiAnYXl6JywgY3Vyc29yOiBbMCwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMDEyM1xcblxcbngnXG5cbiAgICBkZXNjcmliZSBcIm9uIGFuIGVtcHR5IGxpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiYWJjXFxuMDEyMzQ1XFxuXFxueHl6XCIsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgIGl0IFwiZGVsZXRlcyBub3RoaW5nIG9uIGFuIGVtcHR5IGxpbmUgd2hlbiB2aW0tbW9kZS1wbHVzLndyYXBMZWZ0UmlnaHRNb3Rpb24gaXMgZmFsc2VcIiwgLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJywgZmFsc2UpXG4gICAgICAgIGVuc3VyZSAneCcsIHRleHQ6IFwiYWJjXFxuMDEyMzQ1XFxuXFxueHl6XCIsIGN1cnNvcjogWzIsIDBdXG5cbiAgICAgIGl0IFwiZGVsZXRlcyBhbiBlbXB0eSBsaW5lIHdoZW4gdmltLW1vZGUtcGx1cy53cmFwTGVmdFJpZ2h0TW90aW9uIGlzIHRydWVcIiwgLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd3cmFwTGVmdFJpZ2h0TW90aW9uJywgdHJ1ZSlcbiAgICAgICAgZW5zdXJlICd4JywgdGV4dDogXCJhYmNcXG4wMTIzNDVcXG54eXpcIiwgY3Vyc29yOiBbMiwgMF1cblxuICBkZXNjcmliZSBcInRoZSBYIGtleWJpbmRpbmdcIiwgLT5cbiAgICBkZXNjcmliZSBcIm9uIGEgbGluZSB3aXRoIGNvbnRlbnRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwiYWJcXG4wMTIzNDVcIiwgY3Vyc29yOiBbMSwgMl1cblxuICAgICAgaXQgXCJkZWxldGVzIGEgY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnWCcsIHRleHQ6ICdhYlxcbjAyMzQ1JywgY3Vyc29yOiBbMSwgMV0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMSdcbiAgICAgICAgZW5zdXJlICdYJywgdGV4dDogJ2FiXFxuMjM0NScsIGN1cnNvcjogWzEsIDBdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzAnXG4gICAgICAgIGVuc3VyZSAnWCcsIHRleHQ6ICdhYlxcbjIzNDUnLCBjdXJzb3I6IFsxLCAwXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICcwJ1xuICAgICAgICBzZXR0aW5ncy5zZXQoJ3dyYXBMZWZ0UmlnaHRNb3Rpb24nLCB0cnVlKVxuICAgICAgICBlbnN1cmUgJ1gnLCB0ZXh0OiAnYWIyMzQ1JywgY3Vyc29yOiBbMCwgMl0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnXFxuJ1xuXG4gICAgZGVzY3JpYmUgXCJvbiBhbiBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiMDEyMzQ1XFxuXFxuYWJjZGVmXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuXG4gICAgICBpdCBcImRlbGV0ZXMgbm90aGluZyB3aGVuIHZpbS1tb2RlLXBsdXMud3JhcExlZnRSaWdodE1vdGlvbiBpcyBmYWxzZVwiLCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoJ3dyYXBMZWZ0UmlnaHRNb3Rpb24nLCBmYWxzZSlcbiAgICAgICAgZW5zdXJlICdYJywgdGV4dDogXCIwMTIzNDVcXG5cXG5hYmNkZWZcIiwgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBuZXdsaW5lIHdoZW4gd3JhcExlZnRSaWdodE1vdGlvbiBpcyB0cnVlXCIsIC0+XG4gICAgICAgIHNldHRpbmdzLnNldCgnd3JhcExlZnRSaWdodE1vdGlvbicsIHRydWUpXG4gICAgICAgIGVuc3VyZSAnWCcsIHRleHQ6IFwiMDEyMzQ1XFxuYWJjZGVmXCIsIGN1cnNvcjogWzAsIDVdXG5cbiAgZGVzY3JpYmUgXCJ0aGUgZCBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgYWJjZGVcblxuICAgICAgICAgIEFCQ0RFXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzEsIDFdXG5cbiAgICBpdCBcImVudGVycyBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgIGVuc3VyZSAnZCcsIG1vZGU6ICdvcGVyYXRvci1wZW5kaW5nJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgZFwiLCAtPlxuICAgICAgaXQgXCJkZWxldGVzIHRoZSBjdXJyZW50IGxpbmUgYW5kIGV4aXRzIG9wZXJhdG9yLXBlbmRpbmcgbW9kZVwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgZW5zdXJlICdkIGQnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMTIzNDVcblxuICAgICAgICAgICAgQUJDREVcXG5cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiYWJjZGVcXG5cIlxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGl0IFwiZGVsZXRlcyB0aGUgbGFzdCBsaW5lIGFuZCBhbHdheXMgbWFrZSBub24tYmxhbmstbGluZSBsYXN0IGxpbmVcIiwgLT5cbiAgICAgICAgc2V0IGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGVuc3VyZSAnMiBkIGQnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMTIzNDVcbiAgICAgICAgICAgIGFiY2RlXFxuXG4gICAgICAgICAgICBcIlwiXCIsXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBvbiB0aGUgZmlyc3Qgbm9uYmxhbmsgY2hhcmFjdGVyXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAxMjM0fDVcbiAgICAgICAgICAgIGFiY2RlXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSAnZCBkJyxcbiAgICAgICAgICB0ZXh0QzogXCIgIHxhYmNkZVxcblwiXG5cbiAgICBkZXNjcmliZSBcInVuZG8gYmVoYXZpb3JcIiwgLT5cbiAgICAgIFtvcmlnaW5hbFRleHQsIGluaXRpYWxUZXh0Q10gPSBbXVxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBpbml0aWFsVGV4dEMgPSBcIlwiXCJcbiAgICAgICAgICAxMjM0NVxuICAgICAgICAgIGF8YmNkZVxuICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgUVdFUlRcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgc2V0IHRleHRDOiBpbml0aWFsVGV4dENcbiAgICAgICAgb3JpZ2luYWxUZXh0ID0gZWRpdG9yLmdldFRleHQoKVxuXG4gICAgICBpdCBcInVuZG9lcyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnZCAyIGQnLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAxMjM0NVxuICAgICAgICAgIHxRV0VSVFxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBlbnN1cmUgJ3UnLFxuICAgICAgICAgIHRleHRDOiBpbml0aWFsVGV4dENcbiAgICAgICAgICBzZWxlY3RlZFRleHQ6IFwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIG11bHRpcGxlIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgZGVzY3JpYmUgXCJzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvIGlzIHRydWUoZGVmYXVsdClcIiwgLT5cbiAgICAgICAgICBpdCBcImNsZWFyIG11bHRpcGxlIGN1cnNvcnMgYW5kIHNldCBjdXJzb3IgdG8gc3RhcnQgb2YgY2hhbmdlcyBvZiBsYXN0IGN1cnNvclwiLCAtPlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIHRleHQ6IG9yaWdpbmFsVGV4dFxuICAgICAgICAgICAgICBjdXJzb3I6IFtbMCwgMF0sIFsxLCAxXV1cblxuICAgICAgICAgICAgZW5zdXJlICdkIGwnLFxuICAgICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgICAgIHwyMzQ1XG4gICAgICAgICAgICAgIGF8Y2RlXG4gICAgICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgICAgIFFXRVJUXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgICBlbnN1cmUgJ3UnLFxuICAgICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgICAgIDEyMzQ1XG4gICAgICAgICAgICAgIGF8YmNkZVxuICAgICAgICAgICAgICBBQkNERVxuICAgICAgICAgICAgICBRV0VSVFxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgICAgICAgICBlbnN1cmUgJ2N0cmwtcicsXG4gICAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgICAgMjM0NVxuICAgICAgICAgICAgICBhfGNkZVxuICAgICAgICAgICAgICBBQkNERVxuICAgICAgICAgICAgICBRV0VSVFxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgICAgICAgaXQgXCJjbGVhciBtdWx0aXBsZSBjdXJzb3JzIGFuZCBzZXQgY3Vyc29yIHRvIHN0YXJ0IG9mIGNoYW5nZXMgb2YgbGFzdCBjdXJzb3JcIiwgLT5cbiAgICAgICAgICAgIHNldFxuICAgICAgICAgICAgICB0ZXh0OiBvcmlnaW5hbFRleHRcbiAgICAgICAgICAgICAgY3Vyc29yOiBbWzEsIDFdLCBbMCwgMF1dXG5cbiAgICAgICAgICAgIGVuc3VyZSAnZCBsJyxcbiAgICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIDIzNDVcbiAgICAgICAgICAgICAgYWNkZVxuICAgICAgICAgICAgICBBQkNERVxuICAgICAgICAgICAgICBRV0VSVFxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgICAgY3Vyc29yOiBbWzEsIDFdLCBbMCwgMF1dXG5cbiAgICAgICAgICAgIGVuc3VyZSAndScsXG4gICAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgICAgfDEyMzQ1XG4gICAgICAgICAgICAgIGFiY2RlXG4gICAgICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgICAgIFFXRVJUXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBzZWxlY3RlZFRleHQ6ICcnXG5cbiAgICAgICAgICAgIGVuc3VyZSAnY3RybC1yJyxcbiAgICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgICB8MjM0NVxuICAgICAgICAgICAgICBhY2RlXG4gICAgICAgICAgICAgIEFCQ0RFXG4gICAgICAgICAgICAgIFFXRVJUXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgICAgICBzZWxlY3RlZFRleHQ6ICcnXG5cbiAgICAgICAgZGVzY3JpYmUgXCJzZXRDdXJzb3JUb1N0YXJ0T2ZDaGFuZ2VPblVuZG9SZWRvIGlzIGZhbHNlXCIsIC0+XG4gICAgICAgICAgaW5pdGlhbFRleHRDID0gbnVsbFxuXG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgaW5pdGlhbFRleHRDID0gXCJcIlwiXG4gICAgICAgICAgICAgIHwxMjM0NVxuICAgICAgICAgICAgICBhfGJjZGVcbiAgICAgICAgICAgICAgQUJDREVcbiAgICAgICAgICAgICAgUVdFUlRcbiAgICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgICAgIHNldHRpbmdzLnNldCgnc2V0Q3Vyc29yVG9TdGFydE9mQ2hhbmdlT25VbmRvUmVkbycsIGZhbHNlKVxuICAgICAgICAgICAgc2V0IHRleHRDOiBpbml0aWFsVGV4dENcbiAgICAgICAgICAgIGVuc3VyZSAnZCBsJyxcbiAgICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgICB8MjM0NVxuICAgICAgICAgICAgICBhfGNkZVxuICAgICAgICAgICAgICBBQkNERVxuICAgICAgICAgICAgICBRV0VSVFxuICAgICAgICAgICAgICBcIlwiXCJcblxuICAgICAgICAgIGl0IFwicHV0IGN1cnNvciB0byBlbmQgb2YgY2hhbmdlICh3b3JrcyBpbiBzYW1lIHdheSBvZiBhdG9tJ3MgY29yZTp1bmRvKVwiLCAtPlxuICAgICAgICAgICAgZW5zdXJlICd1JyxcbiAgICAgICAgICAgICAgdGV4dEM6IGluaXRpYWxUZXh0Q1xuICAgICAgICAgICAgICBzZWxlY3RlZFRleHQ6IFsnJywgJyddXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSB3XCIsIC0+XG4gICAgICBpdCBcImRlbGV0ZXMgdGhlIG5leHQgd29yZCB1bnRpbCB0aGUgZW5kIG9mIHRoZSBsaW5lIGFuZCBleGl0cyBvcGVyYXRvci1wZW5kaW5nIG1vZGVcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6ICdhYmNkIGVmZ1xcbmFiYycsIGN1cnNvcjogWzAsIDVdXG4gICAgICAgIGVuc3VyZSAnZCB3JyxcbiAgICAgICAgICB0ZXh0OiBcImFiY2QgXFxuYWJjXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCA0XVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICAgIGl0IFwiZGVsZXRlcyB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBuZXh0IHdvcmRcIiwgLT5cbiAgICAgICAgc2V0IHRleHQ6ICdhYmNkIGVmZycsIGN1cnNvcjogWzAsIDJdXG4gICAgICAgIGVuc3VyZSAnZCB3JywgdGV4dDogJ2FiZWZnJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgc2V0IHRleHQ6ICdvbmUgdHdvIHRocmVlIGZvdXInLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBlbnN1cmUgJ2QgMyB3JywgdGV4dDogJ2ZvdXInLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGFuIGl3XCIsIC0+XG4gICAgICBpdCBcImRlbGV0ZXMgdGhlIGNvbnRhaW5pbmcgd29yZFwiLCAtPlxuICAgICAgICBzZXQgdGV4dDogXCIxMjM0NSBhYmNkZSBBQkNERVwiLCBjdXJzb3I6IFswLCA5XVxuXG4gICAgICAgIGVuc3VyZSAnZCcsIG1vZGU6ICdvcGVyYXRvci1wZW5kaW5nJ1xuXG4gICAgICAgIGVuc3VyZSAnaSB3JyxcbiAgICAgICAgICB0ZXh0OiBcIjEyMzQ1ICBBQkNERVwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJ2FiY2RlJ1xuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBqXCIsIC0+XG4gICAgICBvcmlnaW5hbFRleHQgPSBcIlwiXCJcbiAgICAgICAgMTIzNDVcbiAgICAgICAgYWJjZGVcbiAgICAgICAgQUJDREVcXG5cbiAgICAgICAgXCJcIlwiXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dFxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGZpbGVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBuZXh0IHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZCBqJywgdGV4dDogJ0FCQ0RFXFxuJ1xuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBtaWRkbGUgb2Ygc2Vjb25kIGxpbmVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBsYXN0IHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIGVuc3VyZSAnZCBqJywgdGV4dDogJzEyMzQ1XFxuJ1xuXG4gICAgICBkZXNjcmliZSBcIndoZW4gY3Vyc29yIGlzIG9uIGJsYW5rIGxpbmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIGFcblxuXG4gICAgICAgICAgICAgIGJcXG5cbiAgICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBpdCBcImRlbGV0ZXMgYm90aCBsaW5lc1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnZCBqJywgdGV4dDogXCJhXFxuYlxcblwiLCBjdXJzb3I6IFsxLCAwXVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGFuIGtcIiwgLT5cbiAgICAgIG9yaWdpbmFsVGV4dCA9IFwiXCJcIlxuICAgICAgICAxMjM0NVxuICAgICAgICBhYmNkZVxuICAgICAgICBBQkNERVxuICAgICAgICBcIlwiXCJcblxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGRlc2NyaWJlIFwib24gdGhlIGVuZCBvZiB0aGUgZmlsZVwiLCAtPlxuICAgICAgICBpdCBcImRlbGV0ZXMgdGhlIGJvdHRvbSB0d28gbGluZXNcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgNF1cbiAgICAgICAgICBlbnN1cmUgJ2QgaycsIHRleHQ6ICcxMjM0NVxcbidcblxuICAgICAgZGVzY3JpYmUgXCJvbiB0aGUgYmVnaW5uaW5nIG9mIHRoZSBmaWxlXCIsIC0+XG4gICAgICAgIHhpdCBcImRlbGV0ZXMgbm90aGluZ1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZCBrJywgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBvbiB0aGUgbWlkZGxlIG9mIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgZmlyc3QgdHdvIGxpbmVzXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDJdXG4gICAgICAgICAgZW5zdXJlICdkIGsnLCB0ZXh0OiAnQUJDREUnXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBjdXJzb3IgaXMgb24gYmxhbmsgbGluZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgICAgYVxuXG5cbiAgICAgICAgICAgICAgYlxcblxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIGN1cnNvcjogWzIsIDBdXG4gICAgICAgIGl0IFwiZGVsZXRlcyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdkIGsnLCB0ZXh0OiBcImFcXG5iXFxuXCIsIGN1cnNvcjogWzEsIDBdXG5cbiAgICBkZXNjcmliZSBcIndoZW4gZm9sbG93ZWQgYnkgYSBHXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIG9yaWdpbmFsVGV4dCA9IFwiMTIzNDVcXG5hYmNkZVxcbkFCQ0RFXCJcbiAgICAgICAgc2V0IHRleHQ6IG9yaWdpbmFsVGV4dFxuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIGVuc3VyZSAnZCBHJywgdGV4dDogJzEyMzQ1XFxuJ1xuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBtaWRkbGUgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIGVuc3VyZSAnZCBHJywgdGV4dDogJzEyMzQ1XFxuJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgZ290byBsaW5lIEdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgb3JpZ2luYWxUZXh0ID0gXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcIlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGRlc2NyaWJlIFwib24gdGhlIGJlZ2lubmluZyBvZiB0aGUgc2Vjb25kIGxpbmVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBib3R0b20gdHdvIGxpbmVzXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICdkIDIgRycsIHRleHQ6ICcxMjM0NVxcbkFCQ0RFJ1xuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBtaWRkbGUgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIGVuc3VyZSAnZCAyIEcnLCB0ZXh0OiAnMTIzNDVcXG5BQkNERSdcblxuICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIHQpXCIsIC0+XG4gICAgICBkZXNjcmliZSBcIndpdGggdGhlIGVudGlyZSBsaW5lIHlhbmtlZCBiZWZvcmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB0ZXh0OiBcInRlc3QgKHh5eilcIiwgY3Vyc29yOiBbMCwgNl1cblxuICAgICAgICBpdCBcImRlbGV0ZXMgdW50aWwgdGhlIGNsb3NpbmcgcGFyZW50aGVzaXNcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2QgdCApJyxcbiAgICAgICAgICAgIHRleHQ6ICd0ZXN0ICgpJ1xuICAgICAgICAgICAgY3Vyc29yOiBbMCwgNl1cblxuICAgIGRlc2NyaWJlIFwid2l0aCBtdWx0aXBsZSBjdXJzb3JzXCIsIC0+XG4gICAgICBpdCBcImRlbGV0ZXMgZWFjaCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmNkXG4gICAgICAgICAgICAxMjM0XG4gICAgICAgICAgICBBQkNEXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMV0sIFsxLCAyXSwgWzIsIDNdXVxuXG4gICAgICAgIGVuc3VyZSAnZCBlJyxcbiAgICAgICAgICB0ZXh0OiBcImFcXG4xMlxcbkFCQ1wiXG4gICAgICAgICAgY3Vyc29yOiBbWzAsIDBdLCBbMSwgMV0sIFsyLCAyXV1cblxuICAgICAgaXQgXCJkb2Vzbid0IGRlbGV0ZSBlbXB0eSBzZWxlY3Rpb25zXCIsIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHQ6IFwiYWJjZFxcbmFiY1xcbmFiZFwiXG4gICAgICAgICAgY3Vyc29yOiBbWzAsIDBdLCBbMSwgMF0sIFsyLCAwXV1cblxuICAgICAgICBlbnN1cmUgJ2QgdCBkJyxcbiAgICAgICAgICB0ZXh0OiBcImRcXG5hYmNcXG5kXCJcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMF0sIFsxLCAwXSwgWzIsIDBdXVxuXG4gICAgZGVzY3JpYmUgXCJzdGF5T25EZWxldGUgc2V0dGluZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoJ3N0YXlPbkRlbGV0ZScsIHRydWUpXG4gICAgICAgIHNldFxuICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICBfX18zMzMzXG4gICAgICAgICAgX18yMjIyXG4gICAgICAgICAgXzExMTFcbiAgICAgICAgICBfXzIyMjJcbiAgICAgICAgICBfX18zMzMzXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgM11cblxuICAgICAgZGVzY3JpYmUgXCJ0YXJnZXQgcmFuZ2UgaXMgbGluZXdpc2UgcmFuZ2VcIiwgLT5cbiAgICAgICAgaXQgXCJrZWVwIG9yaWdpbmFsIGNvbHVtbiBhZnRlciBkZWxldGVcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJkIGRcIiwgY3Vyc29yOiBbMCwgM10sIHRleHRfOiBcIl9fMjIyMlxcbl8xMTExXFxuX18yMjIyXFxuX19fMzMzM1xcblwiXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLCBjdXJzb3I6IFswLCAzXSwgdGV4dF86IFwiXzExMTFcXG5fXzIyMjJcXG5fX18zMzMzXFxuXCJcbiAgICAgICAgICBlbnN1cmUgXCIuXCIsIGN1cnNvcjogWzAsIDNdLCB0ZXh0XzogXCJfXzIyMjJcXG5fX18zMzMzXFxuXCJcbiAgICAgICAgICBlbnN1cmUgXCIuXCIsIGN1cnNvcjogWzAsIDNdLCB0ZXh0XzogXCJfX18zMzMzXFxuXCJcblxuICAgICAgICBpdCBcInZfRCBhbHNvIGtlZXAgb3JpZ2luYWwgY29sdW1uIGFmdGVyIGRlbGV0ZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcInYgMiBqIERcIiwgY3Vyc29yOiBbMCwgM10sIHRleHRfOiBcIl9fMjIyMlxcbl9fXzMzMzNcXG5cIlxuXG4gICAgICBkZXNjcmliZSBcInRhcmdldCByYW5nZSBpcyB0ZXh0IG9iamVjdFwiLCAtPlxuICAgICAgICBkZXNjcmliZSBcInRhcmdldCBpcyBpbmRlbnRcIiwgLT5cbiAgICAgICAgICBpbmRlbnRUZXh0ID0gXCJcIlwiXG4gICAgICAgICAgMDAwMDAwMDAwMDAwMDAwMFxuICAgICAgICAgICAgMjIyMjIyMjIyMjIyMjJcbiAgICAgICAgICAgIDIyMjIyMjIyMjIyMjIyXG4gICAgICAgICAgICAyMjIyMjIyMjIyMjIyMlxuICAgICAgICAgIDAwMDAwMDAwMDAwMDAwMDBcXG5cbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICB0ZXh0RGF0YSA9IG5ldyBUZXh0RGF0YShpbmRlbnRUZXh0KVxuICAgICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICAgIHNldFxuICAgICAgICAgICAgICB0ZXh0OiB0ZXh0RGF0YS5nZXRSYXcoKVxuXG4gICAgICAgICAgaXQgXCJbZnJvbSB0b3BdIGtlZXAgY29sdW1uXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMTBdXG4gICAgICAgICAgICBlbnN1cmUgJ2QgaSBpJywgY3Vyc29yOiBbMSwgMTBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbMCwgNF0pXG4gICAgICAgICAgaXQgXCJbZnJvbSBtaWRkbGVdIGtlZXAgY29sdW1uXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMTBdXG4gICAgICAgICAgICBlbnN1cmUgJ2QgaSBpJywgY3Vyc29yOiBbMSwgMTBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbMCwgNF0pXG4gICAgICAgICAgaXQgXCJbZnJvbSBib3R0b21dIGtlZXAgY29sdW1uXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMywgMTBdXG4gICAgICAgICAgICBlbnN1cmUgJ2QgaSBpJywgY3Vyc29yOiBbMSwgMTBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbMCwgNF0pXG5cbiAgICAgICAgZGVzY3JpYmUgXCJ0YXJnZXQgaXMgcGFyYWdyYXBoXCIsIC0+XG4gICAgICAgICAgcGFyYWdyYXBoVGV4dCA9IFwiXCJcIlxuICAgICAgICAgICAgcDEtLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIHAxLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICBwMS0tLS0tLS0tLS0tLS0tLVxuXG4gICAgICAgICAgICBwMi0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgcDItLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgICAgIHAyLS0tLS0tLS0tLS0tLS0tXG5cbiAgICAgICAgICAgIHAzLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgICAgICBwMy0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAgICAgcDMtLS0tLS0tLS0tLS0tLS1cXG5cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgdGV4dERhdGEgPSBuZXcgVGV4dERhdGEocGFyYWdyYXBoVGV4dClcbiAgICAgICAgICBQMSA9IFswLCAxLCAyXVxuICAgICAgICAgIEIxID0gM1xuICAgICAgICAgIFAyID0gWzQsIDUsIDZdXG4gICAgICAgICAgQjIgPSA3XG4gICAgICAgICAgUDMgPSBbOCwgOSwgMTBdXG4gICAgICAgICAgQjMgPSAxMVxuXG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0XG4gICAgICAgICAgICAgIHRleHQ6IHRleHREYXRhLmdldFJhdygpXG5cbiAgICAgICAgICBpdCBcInNldCBjdXJzb3IgdG8gc3RhcnQgb2YgZGVsZXRpb24gYWZ0ZXIgZGVsZXRlIFtmcm9tIGJvdHRvbSBvZiBwYXJhZ3JhcGhdXCIsIC0+XG4gICAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIGVuc3VyZSAnZCBpIHAnLCBjdXJzb3I6IFswLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLi5CM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgICAgZW5zdXJlICdqIC4nLCBjdXJzb3I6IFsxLCAwXSwgdGV4dDogdGV4dERhdGEuZ2V0TGluZXMoW0IxLCBCMiwgUDMuLi4sIEIzXSwgY2hvbXA6IHRydWUpXG4gICAgICAgICAgICBlbnN1cmUgJ2ogLicsIGN1cnNvcjogWzEsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEsIEIyLCBCM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgIGl0IFwic2V0IGN1cnNvciB0byBzdGFydCBvZiBkZWxldGlvbiBhZnRlciBkZWxldGUgW2Zyb20gbWlkZGxlIG9mIHBhcmFncmFwaF1cIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgICAgZW5zdXJlICdkIGkgcCcsIGN1cnNvcjogWzAsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEuLkIzXSwgY2hvbXA6IHRydWUpXG4gICAgICAgICAgICBlbnN1cmUgJzIgaiAuJywgY3Vyc29yOiBbMSwgMF0sIHRleHQ6IHRleHREYXRhLmdldExpbmVzKFtCMSwgQjIsIFAzLi4uLCBCM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgICAgZW5zdXJlICcyIGogLicsIGN1cnNvcjogWzEsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEsIEIyLCBCM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgIGl0IFwic2V0IGN1cnNvciB0byBzdGFydCBvZiBkZWxldGlvbiBhZnRlciBkZWxldGUgW2Zyb20gYm90dG9tIG9mIHBhcmFncmFwaF1cIiwgLT5cbiAgICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgICAgZW5zdXJlICdkIGkgcCcsIGN1cnNvcjogWzAsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEuLkIzXSwgY2hvbXA6IHRydWUpXG4gICAgICAgICAgICBlbnN1cmUgJzMgaiAuJywgY3Vyc29yOiBbMSwgMF0sIHRleHQ6IHRleHREYXRhLmdldExpbmVzKFtCMSwgQjIsIFAzLi4uLCBCM10sIGNob21wOiB0cnVlKVxuICAgICAgICAgICAgZW5zdXJlICczIGogLicsIGN1cnNvcjogWzEsIDBdLCB0ZXh0OiB0ZXh0RGF0YS5nZXRMaW5lcyhbQjEsIEIyLCBCM10sIGNob21wOiB0cnVlKVxuXG4gIGRlc2NyaWJlIFwidGhlIEQga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgMDAwMFxuICAgICAgICAxMTExXG4gICAgICAgIDIyMjJcbiAgICAgICAgMzMzM1xuICAgICAgICBcIlwiXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMV1cblxuICAgIGl0IFwiZGVsZXRlcyB0aGUgY29udGVudHMgdW50aWwgdGhlIGVuZCBvZiB0aGUgbGluZVwiLCAtPlxuICAgICAgZW5zdXJlICdEJywgdGV4dDogXCIwXFxuMTExMVxcbjIyMjJcXG4zMzMzXCJcblxuICAgIGl0IFwiaW4gdmlzdWFsLW1vZGUsIGl0IGRlbGV0ZSB3aG9sZSBsaW5lXCIsIC0+XG4gICAgICBlbnN1cmUgJ3YgRCcsIHRleHQ6IFwiMTExMVxcbjIyMjJcXG4zMzMzXCJcbiAgICAgIGVuc3VyZSBcInYgaiBEXCIsIHRleHQ6IFwiMzMzM1wiXG5cbiAgZGVzY3JpYmUgXCJ0aGUgeSBrZXliaW5kaW5nXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgMDEyIHwzNDVcbiAgICAgICAgYWJjXFxuXG4gICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIHVzZUNsaXBib2FyZEFzRGVmYXVsdFJlZ2lzdGVyIGVuYWJsZWRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlcicsIHRydWUpXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKCdfX19fX19fX19fXycpXG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogJ1wiJzogdGV4dDogJ19fX19fX19fX19fJ1xuXG4gICAgICBkZXNjcmliZSBcInJlYWQvd3JpdGUgdG8gY2xpcGJvYXJkIHRocm91Z2ggcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgaXQgXCJ3cml0ZXMgdG8gY2xpcGJvYXJkIHdpdGggZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgICAgIHNhdmVkVGV4dCA9ICcwMTIgMzQ1XFxuJ1xuICAgICAgICAgIGVuc3VyZSAneSB5JywgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IHNhdmVkVGV4dFxuICAgICAgICAgIGV4cGVjdChhdG9tLmNsaXBib2FyZC5yZWFkKCkpLnRvQmUoc2F2ZWRUZXh0KVxuXG4gICAgZGVzY3JpYmUgXCJ2aXN1YWwtbW9kZS5saW5ld2lzZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgICAwMDAwfDAwXG4gICAgICAgICAgICAxMTExMTFcbiAgICAgICAgICAgIDIyMjIyMlxcblxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIG5vdCByZXZlcnNlZFwiLCAtPlxuICAgICAgICBpdCBcInNhdmVzIHRvIHJlZ2lzdGVyKHR5cGU9bGluZXdpc2UpLCBjdXJzb3IgbW92ZSB0byBzdGFydCBvZiB0YXJnZXRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJWIGogeVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjAwMDAwMFxcbjExMTExMVxcblwiLCB0eXBlOiAnbGluZXdpc2UnXG5cbiAgICAgIGRlc2NyaWJlIFwic2VsZWN0aW9uIGlzIHJldmVyc2VkXCIsIC0+XG4gICAgICAgIGl0IFwic2F2ZXMgdG8gcmVnaXN0ZXIodHlwZT1saW5ld2lzZSksIGN1cnNvciBkb2Vzbid0IG1vdmVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMiwgMl1cbiAgICAgICAgICBlbnN1cmUgXCJWIGsgeVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBbMSwgMl1cbiAgICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjExMTExMVxcbjIyMjIyMlxcblwiLCB0eXBlOiAnbGluZXdpc2UnXG5cbiAgICBkZXNjcmliZSBcInZpc3VhbC1tb2RlLmJsb2Nrd2lzZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICAgIDAwMDAwMFxuICAgICAgICAgIDEhMTExMTFcbiAgICAgICAgICAyMjIyMjJcbiAgICAgICAgICAzMzMzMzNcbiAgICAgICAgICA0fDQ0NDQ0XG4gICAgICAgICAgNTU1NTU1XFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGVuc3VyZSBcImN0cmwtdiBsIGwgalwiLFxuICAgICAgICAgIHNlbGVjdGVkVGV4dE9yZGVyZWQ6IFtcIjExMVwiLCBcIjIyMlwiLCBcIjQ0NFwiLCBcIjU1NVwiXVxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiBzdGF5T25ZYW5rID0gZmFsc2VcIiwgLT5cbiAgICAgICAgaXQgXCJwbGFjZSBjdXJzb3IgYXQgc3RhcnQgb2YgYmxvY2sgYWZ0ZXIgeWFua1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcInlcIixcbiAgICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICAgICAgICAwMDAwMDBcbiAgICAgICAgICAgICAgMSExMTExMVxuICAgICAgICAgICAgICAyMjIyMjJcbiAgICAgICAgICAgICAgMzMzMzMzXG4gICAgICAgICAgICAgIDR8NDQ0NDRcbiAgICAgICAgICAgICAgNTU1NTU1XFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgZGVzY3JpYmUgXCJ3aGVuIHN0YXlPbllhbmsgPSB0cnVlXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoJ3N0YXlPbllhbmsnLCB0cnVlKVxuICAgICAgICBpdCBcInBsYWNlIGN1cnNvciBhdCBoZWFkIG9mIGJsb2NrIGFmdGVyIHlhbmtcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJ5XCIsXG4gICAgICAgICAgICBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICAgICAgdGV4dENfOiBcIlwiXCJcbiAgICAgICAgICAgICAgMDAwMDAwXG4gICAgICAgICAgICAgIDExMTExMVxuICAgICAgICAgICAgICAyMjIhMjIyXG4gICAgICAgICAgICAgIDMzMzMzM1xuICAgICAgICAgICAgICA0NDQ0NDRcbiAgICAgICAgICAgICAgNTU1fDU1NVxcblxuICAgICAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwieSB5XCIsIC0+XG4gICAgICBpdCBcInNhdmVzIHRvIHJlZ2lzdGVyKHR5cGU9bGluZXdpc2UpLCBjdXJzb3Igc3RheSBhdCBzYW1lIHBvc2l0aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSAneSB5JyxcbiAgICAgICAgICBjdXJzb3I6IFswLCA0XVxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjAxMiAzNDVcXG5cIiwgdHlwZTogJ2xpbmV3aXNlJ1xuICAgICAgaXQgXCJbTiB5IHldIHlhbmsgTiBsaW5lLCBzdGFydGluZyBmcm9tIHRoZSBjdXJyZW50XCIsIC0+XG4gICAgICAgIGVuc3VyZSAneSAyIHknLFxuICAgICAgICAgIGN1cnNvcjogWzAsIDRdXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMDEyIDM0NVxcbmFiY1xcblwiXG4gICAgICBpdCBcIlt5IE4geV0geWFuayBOIGxpbmUsIHN0YXJ0aW5nIGZyb20gdGhlIGN1cnJlbnRcIiwgLT5cbiAgICAgICAgZW5zdXJlICcyIHkgeScsXG4gICAgICAgICAgY3Vyc29yOiBbMCwgNF1cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIwMTIgMzQ1XFxuYWJjXFxuXCJcblxuICAgIGRlc2NyaWJlIFwid2l0aCBhIHJlZ2lzdGVyXCIsIC0+XG4gICAgICBpdCBcInNhdmVzIHRoZSBsaW5lIHRvIHRoZSBhIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnXCIgYSB5IHknLFxuICAgICAgICAgIHJlZ2lzdGVyOiBhOiB0ZXh0OiBcIjAxMiAzNDVcXG5cIlxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIEEgcmVnaXN0ZXJcIiwgLT5cbiAgICAgIGl0IFwiYXBwZW5kIHRvIGV4aXN0aW5nIHZhbHVlIG9mIGxvd2VyY2FzZS1uYW1lZCByZWdpc3RlclwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1wiIGEgeSB5JywgcmVnaXN0ZXI6IGE6IHRleHQ6IFwiMDEyIDM0NVxcblwiXG4gICAgICAgIGVuc3VyZSAnXCIgQSB5IHknLCByZWdpc3RlcjogYTogdGV4dDogXCIwMTIgMzQ1XFxuMDEyIDM0NVxcblwiXG5cbiAgICBkZXNjcmliZSBcIndpdGggYSBtb3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlcicsIGZhbHNlKVxuXG4gICAgICBpdCBcInlhbmsgZnJvbSBoZXJlIHRvIGRlc3RuYXRpb24gb2YgbW90aW9uXCIsIC0+XG4gICAgICAgIGVuc3VyZSAneSBlJywgY3Vyc29yOiBbMCwgNF0sIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogJzM0NSd9XG5cbiAgICAgIGl0IFwiZG9lcyBub3QgeWFuayB3aGVuIG1vdGlvbiBmYWlsZWRcIiwgLT5cbiAgICAgICAgZW5zdXJlICd5IHQgeCcsIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogdW5kZWZpbmVkfVxuXG4gICAgICBpdCBcInlhbmsgYW5kIG1vdmUgY3Vyc29yIHRvIHN0YXJ0IG9mIHRhcmdldFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3kgaCcsXG4gICAgICAgICAgY3Vyc29yOiBbMCwgM11cbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJyAnXG5cbiAgICAgIGl0IFwiW3dpdGggbGluZXdpc2UgbW90aW9uXSB5YW5rIGFuZCBkZXNuJ3QgbW92ZSBjdXJzb3JcIiwgLT5cbiAgICAgICAgZW5zdXJlICd5IGonLFxuICAgICAgICAgIGN1cnNvcjogWzAsIDRdXG4gICAgICAgICAgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiBcIjAxMiAzNDVcXG5hYmNcXG5cIiwgdHlwZTogJ2xpbmV3aXNlJ31cblxuICAgIGRlc2NyaWJlIFwid2l0aCBhIHRleHQtb2JqXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIGN1cnNvcjogWzIsIDhdXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG5cbiAgICAgICAgICAxc3QgcGFyYWdyYXBoXG4gICAgICAgICAgMXN0IHBhcmFncmFwaFxuXG4gICAgICAgICAgMm4gcGFyYWdyYXBoXG4gICAgICAgICAgMm4gcGFyYWdyYXBoXFxuXG4gICAgICAgICAgXCJcIlwiXG4gICAgICBpdCBcImlubmVyLXdvcmQgYW5kIG1vdmUgY3Vyc29yIHRvIHN0YXJ0IG9mIHRhcmdldFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3kgaSB3JyxcbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJwYXJhZ3JhcGhcIlxuICAgICAgICAgIGN1cnNvcjogWzIsIDRdXG5cbiAgICAgIGl0IFwieWFuayB0ZXh0LW9iamVjdCBpbm5lci1wYXJhZ3JhcGggYW5kIG1vdmUgY3Vyc29yIHRvIHN0YXJ0IG9mIHRhcmdldFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3kgaSBwJyxcbiAgICAgICAgICBjdXJzb3I6IFsxLCAwXVxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjFzdCBwYXJhZ3JhcGhcXG4xc3QgcGFyYWdyYXBoXFxuXCJcblxuICAgIGRlc2NyaWJlIFwid2hlbiBmb2xsb3dlZCBieSBhIEdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgb3JpZ2luYWxUZXh0ID0gXCJcIlwiXG4gICAgICAgIDEyMzQ1XG4gICAgICAgIGFiY2RlXG4gICAgICAgIEFCQ0RFXFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGl0IFwieWFuayBhbmQgZG9lc24ndCBtb3ZlIGN1cnNvclwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgZW5zdXJlICd5IEcnLFxuICAgICAgICAgIHJlZ2lzdGVyOiB7J1wiJzogdGV4dDogXCJhYmNkZVxcbkFCQ0RFXFxuXCIsIHR5cGU6ICdsaW5ld2lzZSd9XG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgaXQgXCJ5YW5rIGFuZCBkb2Vzbid0IG1vdmUgY3Vyc29yXCIsIC0+XG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICBlbnN1cmUgJ3kgRycsXG4gICAgICAgICAgcmVnaXN0ZXI6IHsnXCInOiB0ZXh0OiBcImFiY2RlXFxuQUJDREVcXG5cIiwgdHlwZTogJ2xpbmV3aXNlJ31cbiAgICAgICAgICBjdXJzb3I6IFsxLCAyXVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIGZvbGxvd2VkIGJ5IGEgZ290byBsaW5lIEdcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgb3JpZ2luYWxUZXh0ID0gXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcIlxuICAgICAgICBzZXQgdGV4dDogb3JpZ2luYWxUZXh0XG5cbiAgICAgIGRlc2NyaWJlIFwib24gdGhlIGJlZ2lubmluZyBvZiB0aGUgc2Vjb25kIGxpbmVcIiwgLT5cbiAgICAgICAgaXQgXCJkZWxldGVzIHRoZSBib3R0b20gdHdvIGxpbmVzXCIsIC0+XG4gICAgICAgICAgc2V0IGN1cnNvcjogWzEsIDBdXG4gICAgICAgICAgZW5zdXJlICd5IDIgRyBQJywgdGV4dDogJzEyMzQ1XFxuYWJjZGVcXG5hYmNkZVxcbkFCQ0RFJ1xuXG4gICAgICBkZXNjcmliZSBcIm9uIHRoZSBtaWRkbGUgb2YgdGhlIHNlY29uZCBsaW5lXCIsIC0+XG4gICAgICAgIGl0IFwiZGVsZXRlcyB0aGUgYm90dG9tIHR3byBsaW5lc1wiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIGVuc3VyZSAneSAyIEcgUCcsIHRleHQ6ICcxMjM0NVxcbmFiY2RlXFxuYWJjZGVcXG5BQkNERSdcblxuICAgIGRlc2NyaWJlIFwid2l0aCBtdWx0aXBsZSBjdXJzb3JzXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIGVhY2ggY3Vyc29yIGFuZCBjb3BpZXMgdGhlIGxhc3Qgc2VsZWN0aW9uJ3MgdGV4dFwiLCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIiAgYWJjZFxcbiAgMTIzNFwiXG4gICAgICAgICAgY3Vyc29yOiBbWzAsIDBdLCBbMSwgNV1dXG4gICAgICAgIGVuc3VyZSAneSBeJyxcbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJzEyMydcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMF0sIFsxLCAyXV1cblxuICAgIGRlc2NyaWJlIFwic3RheU9uWWFuayBzZXR0aW5nXCIsIC0+XG4gICAgICB0ZXh0ID0gbnVsbFxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoJ3N0YXlPbllhbmsnLCB0cnVlKVxuXG4gICAgICAgIHRleHQgPSBuZXcgVGV4dERhdGEgXCJcIlwiXG4gICAgICAgICAgMF8yMzQ1NjdcbiAgICAgICAgICAxXzIzNDU2N1xuICAgICAgICAgIDJfMjM0NTY3XG5cbiAgICAgICAgICA0XzIzNDU2N1xcblxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICBzZXQgdGV4dDogdGV4dC5nZXRSYXcoKSwgY3Vyc29yOiBbMSwgMl1cblxuICAgICAgaXQgXCJkb24ndCBtb3ZlIGN1cnNvciBhZnRlciB5YW5rIGZyb20gbm9ybWFsLW1vZGVcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwieSBpIHBcIiwgY3Vyc29yOiBbMSwgMl0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiB0ZXh0LmdldExpbmVzKFswLi4yXSlcbiAgICAgICAgZW5zdXJlIFwiaiB5IHlcIiwgY3Vyc29yOiBbMiwgMl0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiB0ZXh0LmdldExpbmVzKFsyXSlcbiAgICAgICAgZW5zdXJlIFwiayAuXCIsIGN1cnNvcjogWzEsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogdGV4dC5nZXRMaW5lcyhbMV0pXG4gICAgICAgIGVuc3VyZSBcInkgaFwiLCBjdXJzb3I6IFsxLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiX1wiXG4gICAgICAgIGVuc3VyZSBcInkgYlwiLCBjdXJzb3I6IFsxLCAyXSwgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMV9cIlxuXG4gICAgICBpdCBcImRvbid0IG1vdmUgY3Vyc29yIGFmdGVyIHlhbmsgZnJvbSB2aXN1YWwtbGluZXdpc2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIFwiViB5XCIsIGN1cnNvcjogWzEsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogdGV4dC5nZXRMaW5lcyhbMV0pXG4gICAgICAgIGVuc3VyZSBcIlYgaiB5XCIsIGN1cnNvcjogWzIsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogdGV4dC5nZXRMaW5lcyhbMS4uMl0pXG5cbiAgICAgIGl0IFwiZG9uJ3QgbW92ZSBjdXJzb3IgYWZ0ZXIgeWFuayBmcm9tIHZpc3VhbC1jaGFyYWN0ZXJ3aXNlXCIsIC0+XG4gICAgICAgIGVuc3VyZSBcInYgbCBsIHlcIiwgY3Vyc29yOiBbMSwgNF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjIzNFwiXG4gICAgICAgIGVuc3VyZSBcInYgaCBoIHlcIiwgY3Vyc29yOiBbMSwgMl0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjIzNFwiXG4gICAgICAgIGVuc3VyZSBcInYgaiB5XCIsIGN1cnNvcjogWzIsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIyMzQ1NjdcXG4yXzJcIlxuICAgICAgICBlbnN1cmUgXCJ2IDIgayB5XCIsIGN1cnNvcjogWzAsIDJdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIyMzQ1NjdcXG4xXzIzNDU2N1xcbjJfMlwiXG5cbiAgZGVzY3JpYmUgXCJ0aGUgeXkga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwib24gYSBzaW5nbGUgbGluZSBmaWxlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcImV4Y2xhbWF0aW9uIVxcblwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcImNvcGllcyB0aGUgZW50aXJlIGxpbmUgYW5kIHBhc3RlcyBpdCBjb3JyZWN0bHlcIiwgLT5cbiAgICAgICAgZW5zdXJlICd5IHkgcCcsXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiZXhjbGFtYXRpb24hXFxuXCJcbiAgICAgICAgICB0ZXh0OiBcImV4Y2xhbWF0aW9uIVxcbmV4Y2xhbWF0aW9uIVxcblwiXG5cbiAgICBkZXNjcmliZSBcIm9uIGEgc2luZ2xlIGxpbmUgZmlsZSB3aXRoIG5vIG5ld2xpbmVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IFwibm8gbmV3bGluZSFcIiwgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJjb3BpZXMgdGhlIGVudGlyZSBsaW5lIGFuZCBwYXN0ZXMgaXQgY29ycmVjdGx5XCIsIC0+XG4gICAgICAgIGVuc3VyZSAneSB5IHAnLFxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIm5vIG5ld2xpbmUhXFxuXCJcbiAgICAgICAgICB0ZXh0OiBcIm5vIG5ld2xpbmUhXFxubm8gbmV3bGluZSFcXG5cIlxuXG4gICAgICBpdCBcImNvcGllcyB0aGUgZW50aXJlIGxpbmUgYW5kIHBhc3RlcyBpdCByZXNwZWN0aW5nIGNvdW50IGFuZCBuZXcgbGluZXNcIiwgLT5cbiAgICAgICAgZW5zdXJlICd5IHkgMiBwJyxcbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogXCJubyBuZXdsaW5lIVxcblwiXG4gICAgICAgICAgdGV4dDogXCJubyBuZXdsaW5lIVxcbm5vIG5ld2xpbmUhXFxubm8gbmV3bGluZSFcXG5cIlxuXG4gIGRlc2NyaWJlIFwidGhlIFkga2V5YmluZGluZ1wiLCAtPlxuICAgIHRleHQgPSBudWxsXG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgdGV4dCA9IFwiXCJcIlxuICAgICAgMDEyIDM0NVxuICAgICAgYWJjXFxuXG4gICAgICBcIlwiXCJcbiAgICAgIHNldCB0ZXh0OiB0ZXh0LCBjdXJzb3I6IFswLCA0XVxuXG4gICAgaXQgXCJzYXZlcyB0aGUgbGluZSB0byB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgZW5zdXJlICdZJywgY3Vyc29yOiBbMCwgNF0sIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiBcIjAxMiAzNDVcXG5cIlxuXG4gICAgaXQgXCJ5YW5rIHRoZSB3aG9sZSBsaW5lcyB0byB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgZW5zdXJlICd2IGogWScsIGN1cnNvcjogWzAsIDBdLCByZWdpc3RlcjogJ1wiJzogdGV4dDogdGV4dFxuXG4gIGRlc2NyaWJlIFwidGhlIHAga2V5YmluZGluZ1wiLCAtPlxuICAgIGRlc2NyaWJlIFwid2l0aCBzaW5nbGUgbGluZSBjaGFyYWN0ZXIgY29udGVudHNcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KCd1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlcicsIGZhbHNlKVxuXG4gICAgICAgIHNldCB0ZXh0QzogXCJ8MDEyXFxuXCJcbiAgICAgICAgc2V0IHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMzQ1J1xuICAgICAgICBzZXQgcmVnaXN0ZXI6ICdhJzogdGV4dDogJ2EnXG4gICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKFwiY2xpcFwiKVxuXG4gICAgICBkZXNjcmliZSBcImZyb20gdGhlIGRlZmF1bHQgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50c1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcInBcIiwgdGV4dEM6IFwiMDM0fDUxMlxcblwiXG5cbiAgICAgIGRlc2NyaWJlIFwiYXQgdGhlIGVuZCBvZiBhIGxpbmVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB0ZXh0QzogXCIwMXwyXFxuXCJcbiAgICAgICAgaXQgXCJwb3NpdGlvbnMgY3Vyc29yIGNvcnJlY3RseVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcInBcIiwgdGV4dEM6IFwiMDEyMzR8NVxcblwiXG5cbiAgICAgIGRlc2NyaWJlIFwicGFzdGUgdG8gZW1wdHkgbGluZVwiLCAtPlxuICAgICAgICBpdCBcInBhc3RlIGNvbnRlbnQgdG8gdGhhdCBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgICAxc3RcbiAgICAgICAgICAgIHxcbiAgICAgICAgICAgIDNyZFxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgICByZWdpc3RlcjogJ1wiJzogdGV4dDogJzJuZCdcblxuICAgICAgICAgIGVuc3VyZSAncCcsXG4gICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgICAxc3RcbiAgICAgICAgICAgIDJufGRcbiAgICAgICAgICAgIDNyZFxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiB1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlciBlbmFibGVkXCIsIC0+XG4gICAgICAgIGl0IFwiaW5zZXJ0cyBjb250ZW50cyBmcm9tIGNsaXBib2FyZFwiLCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCgndXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXInLCB0cnVlKVxuICAgICAgICAgIGVuc3VyZSAncCcsIHRleHRDOiBcIjBjbGl8cDEyXFxuXCJcblxuICAgICAgZGVzY3JpYmUgXCJmcm9tIGEgc3BlY2lmaWVkIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIGl0IFwiaW5zZXJ0cyB0aGUgY29udGVudHMgb2YgdGhlICdhJyByZWdpc3RlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnXCIgYSBwJywgdGV4dEM6IFwiMHxhMTJcXG5cIixcblxuICAgICAgZGVzY3JpYmUgXCJhdCB0aGUgZW5kIG9mIGEgbGluZVwiLCAtPlxuICAgICAgICBpdCBcImluc2VydHMgYmVmb3JlIHRoZSBjdXJyZW50IGxpbmUncyBuZXdsaW5lXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICB0ZXh0QzogXCJcIlwiXG4gICAgICAgICAgICBhYmNkZVxuICAgICAgICAgICAgb25lIHx0d28gdGhyZWVcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGVuc3VyZSAnZCAkIGsgJCBwJyxcbiAgICAgICAgICAgIHRleHRDXzogXCJcIlwiXG4gICAgICAgICAgICBhYmNkZXR3byB0aHJlfGVcbiAgICAgICAgICAgIG9uZV9cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIG11bHRpbGluZSBjaGFyYWN0ZXIgY29udGVudHNcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHRDOiBcInwwMTJcXG5cIlxuICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICczNDVcXG42NzgnXG5cbiAgICAgIGl0IFwicCBwbGFjZSBjdXJzb3IgYXQgc3RhcnQgb2YgbXV0YXRpb25cIiwgLT4gZW5zdXJlIFwicFwiLCB0ZXh0QzogXCIwfDM0NVxcbjY3ODEyXFxuXCJcbiAgICAgIGl0IFwiUCBwbGFjZSBjdXJzb3IgYXQgc3RhcnQgb2YgbXV0YXRpb25cIiwgLT4gZW5zdXJlIFwiUFwiLCB0ZXh0QzogXCJ8MzQ1XFxuNjc4MDEyXFxuXCJcblxuICAgIGRlc2NyaWJlIFwid2l0aCBsaW5ld2lzZSBjb250ZW50c1wiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJvbiBhIHNpbmdsZSBsaW5lXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHRDOiAnMHwxMidcbiAgICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB7dGV4dDogXCIgMzQ1XFxuXCIsIHR5cGU6ICdsaW5ld2lzZSd9XG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAncCcsXG4gICAgICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICAgICAgMDEyXG4gICAgICAgICAgICBffDM0NVxcblxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgaXQgXCJyZXBsYWNlcyB0aGUgY3VycmVudCBzZWxlY3Rpb24gYW5kIHB1dCBjdXJzb3IgdG8gdGhlIGZpcnN0IGNoYXIgb2YgbGluZVwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAndiBwJywgIyAnMScgd2FzIHJlcGxhY2VkXG4gICAgICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICAgICAgMFxuICAgICAgICAgICAgX3wzNDVcbiAgICAgICAgICAgIDJcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcIm9uIG11bHRpcGxlIGxpbmVzXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMDEyXG4gICAgICAgICAgICAgMzQ1XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB7dGV4dDogXCIgNDU2XFxuXCIsIHR5cGU6ICdsaW5ld2lzZSd9XG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlciBhdCBtaWRkbGUgbGluZVwiLCAtPlxuICAgICAgICAgIHNldCBjdXJzb3I6IFswLCAxXVxuICAgICAgICAgIGVuc3VyZSBcInBcIixcbiAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgIDAxMlxuICAgICAgICAgICAgIHw0NTZcbiAgICAgICAgICAgICAzNDVcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGl0IFwiaW5zZXJ0cyB0aGUgY29udGVudHMgb2YgdGhlIGRlZmF1bHQgcmVnaXN0ZXIgYXQgZW5kIG9mIGxpbmVcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgICBlbnN1cmUgJ3AnLFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgMDEyXG4gICAgICAgICAgICAgMzQ1XG4gICAgICAgICAgICAgfDQ1NlxcblxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICBkZXNjcmliZSBcIndpdGggbXVsdGlwbGUgbGluZXdpc2UgY29udGVudHNcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgIDAxMlxuICAgICAgICAgIHxhYmNcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICByZWdpc3RlcjogJ1wiJzoge3RleHQ6IFwiIDM0NVxcbiA2NzhcXG5cIiwgdHlwZTogJ2xpbmV3aXNlJ31cblxuICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlclwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3AnLFxuICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAwMTJcbiAgICAgICAgICBhYmNcbiAgICAgICAgICAgfDM0NVxuICAgICAgICAgICA2NzhcXG5cbiAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwicHV0LWFmdGVyLXdpdGgtYXV0by1pbmRlbnQgY29tbWFuZFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICB3YWl0c0ZvclByb21pc2UgLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoJ3VzZUNsaXBib2FyZEFzRGVmYXVsdFJlZ2lzdGVyJywgZmFsc2UpXG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWphdmFzY3JpcHQnKVxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgc2V0IGdyYW1tYXI6ICdzb3VyY2UuanMnXG5cbiAgICAgIGRlc2NyaWJlIFwicGFzdGUgd2l0aCBhdXRvLWluZGVudFwiLCAtPlxuICAgICAgICBpdCBcImluc2VydHMgdGhlIGNvbnRlbnRzIG9mIHRoZSBkZWZhdWx0IHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgICAgc2V0XG4gICAgICAgICAgICByZWdpc3RlcjogJ1wiJzoge3RleHQ6IFwiIDM0NVxcblwiLCB0eXBlOiAnbGluZXdpc2UnfVxuICAgICAgICAgICAgdGV4dENfOiBcIlwiXCJcbiAgICAgICAgICAgIGlmfCAoKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBlbnN1cmVCeURpc3BhdGNoICd2aW0tbW9kZS1wbHVzOnB1dC1hZnRlci13aXRoLWF1dG8taW5kZW50JyxcbiAgICAgICAgICAgIHRleHRDXzogXCJcIlwiXG4gICAgICAgICAgICBpZiAoKSB7XG4gICAgICAgICAgICAgIHwzNDVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGl0IFwibXVsdGktbGluZSByZWdpc3RlciBjb250ZW50cyB3aXRoIGF1dG8gaW5kZW50XCIsIC0+XG4gICAgICAgICAgcmVnaXN0ZXJDb250ZW50ID0gXCJcIlwiXG4gICAgICAgICAgICBpZigzKSB7XG4gICAgICAgICAgICAgIGlmKDQpIHt9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBzZXRcbiAgICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB7dGV4dDogcmVnaXN0ZXJDb250ZW50LCB0eXBlOiAnbGluZXdpc2UnfVxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgaWYgKDEpIHtcbiAgICAgICAgICAgICAgfGlmICgyKSB7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGVuc3VyZUJ5RGlzcGF0Y2ggJ3ZpbS1tb2RlLXBsdXM6cHV0LWFmdGVyLXdpdGgtYXV0by1pbmRlbnQnLFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgaWYgKDEpIHtcbiAgICAgICAgICAgICAgaWYgKDIpIHtcbiAgICAgICAgICAgICAgICB8aWYoMykge1xuICAgICAgICAgICAgICAgICAgaWYoNCkge31cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gcGFzdGluZyBhbHJlYWR5IGluZGVudGVkIG11bHRpLWxpbmVzIHJlZ2lzdGVyIGNvbnRlbnRcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgaWYgKDEpIHtcbiAgICAgICAgICAgICAgfGlmICgyKSB7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgIGl0IFwia2VlcCBvcmlnaW5hbCBsYXlvdXRcIiwgLT5cbiAgICAgICAgICByZWdpc3RlckNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgICAgICAgIGE6IDEyMyxcbiAgICAgICAgICAgIGJiYmI6IDQ1NixcbiAgICAgICAgICAgIFwiXCJcIlxuXG4gICAgICAgICAgc2V0IHJlZ2lzdGVyOiAnXCInOiB7dGV4dDogcmVnaXN0ZXJDb250ZW50LCB0eXBlOiAnbGluZXdpc2UnfVxuICAgICAgICAgIGVuc3VyZUJ5RGlzcGF0Y2ggJ3ZpbS1tb2RlLXBsdXM6cHV0LWFmdGVyLXdpdGgtYXV0by1pbmRlbnQnLFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgaWYgKDEpIHtcbiAgICAgICAgICAgICAgaWYgKDIpIHtcbiAgICAgICAgICAgICAgICAgICB8YTogMTIzLFxuICAgICAgICAgICAgICAgIGJiYmI6IDQ1NixcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgICAgICAgaXQgXCJrZWVwIG9yaWdpbmFsIGxheW91dCBbcmVnaXN0ZXIgY29udGVudCBoYXZlIGJsYW5rIHJvd11cIiwgLT5cbiAgICAgICAgICByZWdpc3RlckNvbnRlbnQgPSBcIlwiXCJcbiAgICAgICAgICAgIGlmKDMpIHtcbiAgICAgICAgICAgIF9fYWJjXG5cbiAgICAgICAgICAgIF9fZGVmXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcIlwiXCIucmVwbGFjZSgvXy9nLCAnICcpXG5cbiAgICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHt0ZXh0OiByZWdpc3RlckNvbnRlbnQsIHR5cGU6ICdsaW5ld2lzZSd9XG4gICAgICAgICAgZW5zdXJlQnlEaXNwYXRjaCAndmltLW1vZGUtcGx1czpwdXQtYWZ0ZXItd2l0aC1hdXRvLWluZGVudCcsXG4gICAgICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICAgICAgaWYgKDEpIHtcbiAgICAgICAgICAgICAgaWYgKDIpIHtcbiAgICAgICAgICAgICAgICB8aWYoMykge1xuICAgICAgICAgICAgICAgICAgYWJjXG5cbiAgICAgICAgICAgICAgICAgIGRlZlxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgIyBIRVJFXG4gICAgIyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAgIGRlc2NyaWJlIFwicGFzdGluZyB0d2ljZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIjEyMzQ1XFxuYWJjZGVcXG5BQkNERVxcblFXRVJUXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuICAgICAgICAgIHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMTIzJ1xuICAgICAgICBrZXlzdHJva2UgJzIgcCdcblxuICAgICAgaXQgXCJpbnNlcnRzIHRoZSBzYW1lIGxpbmUgdHdpY2VcIiwgLT5cbiAgICAgICAgZW5zdXJlIHRleHQ6IFwiMTIzNDVcXG5hYjEyMzEyM2NkZVxcbkFCQ0RFXFxuUVdFUlRcIlxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gdW5kb25lXCIsIC0+XG4gICAgICAgIGl0IFwicmVtb3ZlcyBib3RoIGxpbmVzXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICd1JywgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcXG5RV0VSVFwiXG5cbiAgICBkZXNjcmliZSBcInN1cHBvcnQgbXVsdGlwbGUgY3Vyc29yc1wiLCAtPlxuICAgICAgaXQgXCJwYXN0ZSB0ZXh0IGZvciBlYWNoIGN1cnNvcnNcIiwgLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcbmFiY2RlXFxuQUJDREVcXG5RV0VSVFwiXG4gICAgICAgICAgY3Vyc29yOiBbWzEsIDBdLCBbMiwgMF1dXG4gICAgICAgICAgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICdaWlonXG4gICAgICAgIGVuc3VyZSAncCcsXG4gICAgICAgICAgdGV4dDogXCIxMjM0NVxcbmFaWlpiY2RlXFxuQVpaWkJDREVcXG5RV0VSVFwiXG4gICAgICAgICAgY3Vyc29yOiBbWzEsIDNdLCBbMiwgM11dXG5cbiAgICBkZXNjcmliZSBcIndpdGggYSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogJzAxMlxcbidcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIGNoYXJhY3Rlcndpc2Ugc2VsZWN0aW9uXCIsIC0+XG4gICAgICAgIGl0IFwicmVwbGFjZXMgc2VsZWN0aW9uIHdpdGggY2hhcndpc2UgY29udGVudFwiLCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIzNDVcIlxuICAgICAgICAgIGVuc3VyZSAndiBwJywgdGV4dDogXCIwMzQ1MlxcblwiLCBjdXJzb3I6IFswLCAzXVxuICAgICAgICBpdCBcInJlcGxhY2VzIHNlbGVjdGlvbiB3aXRoIGxpbmV3aXNlIGNvbnRlbnRcIiwgLT5cbiAgICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMzQ1XFxuXCJcbiAgICAgICAgICBlbnN1cmUgJ3YgcCcsIHRleHQ6IFwiMFxcbjM0NVxcbjJcXG5cIiwgY3Vyc29yOiBbMSwgMF1cblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIGxpbmV3aXNlIHNlbGVjdGlvblwiLCAtPlxuICAgICAgICBpdCBcInJlcGxhY2VzIHNlbGVjdGlvbiB3aXRoIGNoYXJ3aXNlIGNvbnRlbnRcIiwgLT5cbiAgICAgICAgICBzZXQgdGV4dDogXCIwMTJcXG5hYmNcIiwgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6IFwiMzQ1XCJcbiAgICAgICAgICBlbnN1cmUgJ1YgcCcsIHRleHQ6IFwiMzQ1XFxuYWJjXCIsIGN1cnNvcjogWzAsIDBdXG4gICAgICAgIGl0IFwicmVwbGFjZXMgc2VsZWN0aW9uIHdpdGggbGluZXdpc2UgY29udGVudFwiLCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogXCIzNDVcXG5cIlxuICAgICAgICAgIGVuc3VyZSAnViBwJywgdGV4dDogXCIzNDVcXG5cIiwgY3Vyc29yOiBbMCwgMF1cblxuICBkZXNjcmliZSBcInRoZSBQIGtleWJpbmRpbmdcIiwgLT5cbiAgICBkZXNjcmliZSBcIndpdGggY2hhcmFjdGVyIGNvbnRlbnRzXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjAxMlxcblwiLCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBzZXQgcmVnaXN0ZXI6ICdcIic6IHRleHQ6ICczNDUnXG4gICAgICAgIHNldCByZWdpc3RlcjogYTogdGV4dDogJ2EnXG4gICAgICAgIGtleXN0cm9rZSAnUCdcblxuICAgICAgaXQgXCJpbnNlcnRzIHRoZSBjb250ZW50cyBvZiB0aGUgZGVmYXVsdCByZWdpc3RlciBhYm92ZVwiLCAtPlxuICAgICAgICBlbnN1cmUgdGV4dDogXCIzNDUwMTJcXG5cIiwgY3Vyc29yOiBbMCwgMl1cblxuICBkZXNjcmliZSBcInRoZSAuIGtleWJpbmRpbmdcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXQgdGV4dDogXCIxMlxcbjM0XFxuNTZcXG43OFwiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgXCJyZXBlYXRzIHRoZSBsYXN0IG9wZXJhdGlvblwiLCAtPlxuICAgICAgZW5zdXJlICcyIGQgZCAuJywgdGV4dDogXCJcIlxuXG4gICAgaXQgXCJjb21wb3NlcyB3aXRoIG1vdGlvbnNcIiwgLT5cbiAgICAgIGVuc3VyZSAnZCBkIDIgLicsIHRleHQ6IFwiNzhcIlxuXG4gIGRlc2NyaWJlIFwidGhlIHIga2V5YmluZGluZ1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgMTJcbiAgICAgICAgMzRcbiAgICAgICAgXFxuXG4gICAgICAgIFwiXCJcIlxuICAgICAgICBjdXJzb3I6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgIGl0IFwicmVwbGFjZXMgYSBzaW5nbGUgY2hhcmFjdGVyXCIsIC0+XG4gICAgICBlbnN1cmUgJ3IgeCcsIHRleHQ6ICd4Mlxcbng0XFxuXFxuJ1xuXG4gICAgaXQgXCJyZW1haW4gdmlzdWFsLW1vZGUgd2hlbiBjYW5jZWxsZWRcIiwgLT5cbiAgICAgIGVuc3VyZSAndiByIGVzY2FwZScsXG4gICAgICAgIHRleHQ6ICcxMlxcbjM0XFxuXFxuJ1xuICAgICAgICBtb2RlOiBbJ3Zpc3VhbCcsICdjaGFyYWN0ZXJ3aXNlJ11cblxuICAgIGl0IFwicmVwbGFjZXMgYSBzaW5nbGUgY2hhcmFjdGVyIHdpdGggYSBsaW5lIGJyZWFrXCIsIC0+XG4gICAgICBlbnN1cmUgJ3IgZW50ZXInLFxuICAgICAgICB0ZXh0OiAnXFxuMlxcblxcbjRcXG5cXG4nXG4gICAgICAgIGN1cnNvcjogW1sxLCAwXSwgWzMsIDBdXVxuXG4gICAgaXQgXCJhdXRvIGluZGVudCB3aGVuIHJlcGxhY2VkIHdpdGggc2luZ2UgbmV3IGxpbmVcIiwgLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICBfX2F8YmNcbiAgICAgICAgXCJcIlwiXG4gICAgICBlbnN1cmUgJ3IgZW50ZXInLFxuICAgICAgICB0ZXh0Q186IFwiXCJcIlxuICAgICAgICBfX2FcbiAgICAgICAgX198Y1xuICAgICAgICBcIlwiXCJcblxuICAgIGl0IFwiY29tcG9zZXMgcHJvcGVybHkgd2l0aCBtb3Rpb25zXCIsIC0+XG4gICAgICBlbnN1cmUgJzIgciB4JywgdGV4dDogJ3h4XFxueHhcXG5cXG4nXG5cbiAgICBpdCBcImRvZXMgbm90aGluZyBvbiBhbiBlbXB0eSBsaW5lXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMiwgMF1cbiAgICAgIGVuc3VyZSAnciB4JywgdGV4dDogJzEyXFxuMzRcXG5cXG4nXG5cbiAgICBpdCBcImRvZXMgbm90aGluZyBpZiBhc2tlZCB0byByZXBsYWNlIG1vcmUgY2hhcmFjdGVycyB0aGFuIHRoZXJlIGFyZSBvbiBhIGxpbmVcIiwgLT5cbiAgICAgIGVuc3VyZSAnMyByIHgnLCB0ZXh0OiAnMTJcXG4zNFxcblxcbidcblxuICAgIGRlc2NyaWJlIFwiY2FuY2VsbGF0aW9uXCIsIC0+XG4gICAgICBpdCBcImRvZXMgbm90aGluZyB3aGVuIGNhbmNlbGxlZFwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3IgZXNjYXBlJywgdGV4dDogJzEyXFxuMzRcXG5cXG4nLCBtb2RlOiAnbm9ybWFsJ1xuXG4gICAgICBpdCBcImtlZXAgbXVsdGktY3Vyc29yIG9uIGNhbmNlbGxlZFwiLCAtPlxuICAgICAgICBzZXQgICAgICAgICAgICAgICAgdGV4dEM6IFwifCAgICBhXFxuISAgICBhXFxufCAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwiciBlc2NhcGVcIiwgdGV4dEM6IFwifCAgICBhXFxuISAgICBhXFxufCAgICBhXFxuXCIsIG1vZGU6IFwibm9ybWFsXCJcblxuICAgICAgaXQgXCJrZWVwIG11bHRpLWN1cnNvciBvbiBjYW5jZWxsZWRcIiwgLT5cbiAgICAgICAgc2V0ICAgICAgICAgICAgICAgIHRleHRDOiBcInwqKmFcXG4hKiphXFxufCoqYVxcblwiXG4gICAgICAgIGVuc3VyZSBcInYgbFwiLCAgICAgIHRleHRDOiBcIioqfGFcXG4qKiFhXFxuKip8YVxcblwiLCBzZWxlY3RlZFRleHQ6IFtcIioqXCIsIFwiKipcIiwgXCIqKlwiXSwgbW9kZTogW1widmlzdWFsXCIsIFwiY2hhcmFjdGVyd2lzZVwiXVxuICAgICAgICBlbnN1cmUgXCJyIGVzY2FwZVwiLCB0ZXh0QzogXCIqKnxhXFxuKiohYVxcbioqfGFcXG5cIiwgc2VsZWN0ZWRUZXh0OiBbXCIqKlwiLCBcIioqXCIsIFwiKipcIl0sIG1vZGU6IFtcInZpc3VhbFwiLCBcImNoYXJhY3Rlcndpc2VcIl1cblxuICAgIGRlc2NyaWJlIFwid2hlbiBpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBrZXlzdHJva2UgJ3YgZSdcblxuICAgICAgaXQgXCJyZXBsYWNlcyB0aGUgZW50aXJlIHNlbGVjdGlvbiB3aXRoIHRoZSBnaXZlbiBjaGFyYWN0ZXJcIiwgLT5cbiAgICAgICAgZW5zdXJlICdyIHgnLCB0ZXh0OiAneHhcXG54eFxcblxcbidcblxuICAgICAgaXQgXCJsZWF2ZXMgdGhlIGN1cnNvciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgZW5zdXJlICdyIHgnLCBjdXJzb3I6IFtbMCwgMF0sIFsxLCAwXV1cblxuICAgIGRlc2NyaWJlIFwid2hlbiBpbiB2aXN1YWwtYmxvY2sgbW9kZVwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICBjdXJzb3I6IFsxLCA0XVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMDoyMzQ1XG4gICAgICAgICAgICAxOiBvMTFvXG4gICAgICAgICAgICAyOiBvMjJvXG4gICAgICAgICAgICAzOiBvMzNvXG4gICAgICAgICAgICA0OiBvNDRvXFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgZW5zdXJlICdjdHJsLXYgbCAzIGonLFxuICAgICAgICAgIG1vZGU6IFsndmlzdWFsJywgJ2Jsb2Nrd2lzZSddXG4gICAgICAgICAgc2VsZWN0ZWRUZXh0T3JkZXJlZDogWycxMScsICcyMicsICczMycsICc0NCddLFxuXG4gICAgICBpdCBcInJlcGxhY2VzIGVhY2ggc2VsZWN0aW9uIGFuZCBwdXQgY3Vyc29yIG9uIHN0YXJ0IG9mIHRvcCBzZWxlY3Rpb25cIiwgLT5cbiAgICAgICAgZW5zdXJlICdyIHgnLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgY3Vyc29yOiBbMSwgNF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDA6MjM0NVxuICAgICAgICAgICAgMTogb3h4b1xuICAgICAgICAgICAgMjogb3h4b1xuICAgICAgICAgICAgMzogb3h4b1xuICAgICAgICAgICAgNDogb3h4b1xcblxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgIHNldCBjdXJzb3I6IFsxLCAwXVxuICAgICAgICBlbnN1cmUgJy4nLFxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMF1cbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDA6MjM0NVxuICAgICAgICAgICAgeHggb3h4b1xuICAgICAgICAgICAgeHggb3h4b1xuICAgICAgICAgICAgeHggb3h4b1xuICAgICAgICAgICAgeHggb3h4b1xcblxuICAgICAgICAgICAgXCJcIlwiXG5cbiAgZGVzY3JpYmUgJ3RoZSBtIGtleWJpbmRpbmcnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldCB0ZXh0OiAnMTJcXG4zNFxcbjU2XFxuJywgY3Vyc29yOiBbMCwgMV1cblxuICAgIGl0ICdtYXJrcyBhIHBvc2l0aW9uJywgLT5cbiAgICAgIGtleXN0cm9rZSAnbSBhJ1xuICAgICAgZXhwZWN0KHZpbVN0YXRlLm1hcmsuZ2V0KCdhJykpLnRvRXF1YWwgWzAsIDFdXG5cbiAgZGVzY3JpYmUgJ3RoZSBSIGtleWJpbmRpbmcnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAxMjM0NVxuICAgICAgICAgIDY3ODkwXG4gICAgICAgICAgXCJcIlwiXG4gICAgICAgIGN1cnNvcjogWzAsIDJdXG5cbiAgICBpdCBcImVudGVycyByZXBsYWNlIG1vZGUgYW5kIHJlcGxhY2VzIGNoYXJhY3RlcnNcIiwgLT5cbiAgICAgIGVuc3VyZSAnUicsXG4gICAgICAgIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJhYlwiXG4gICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgIHRleHQ6IFwiMTJhYjVcXG42Nzg5MFwiXG4gICAgICAgIGN1cnNvcjogWzAsIDNdXG4gICAgICAgIG1vZGU6ICdub3JtYWwnXG5cbiAgICBpdCBcImNvbnRpbnVlcyBiZXlvbmQgZW5kIG9mIGxpbmUgYXMgaW5zZXJ0XCIsIC0+XG4gICAgICBlbnN1cmUgJ1InLFxuICAgICAgICBtb2RlOiBbJ2luc2VydCcsICdyZXBsYWNlJ11cbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYWJjZGVcIlxuICAgICAgZW5zdXJlICdlc2NhcGUnLCB0ZXh0OiAnMTJhYmNkZVxcbjY3ODkwJ1xuXG4gICAgaXQgJ3RyZWF0cyBiYWNrc3BhY2UgYXMgdW5kbycsIC0+XG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImZvb1wiXG4gICAgICBrZXlzdHJva2UgJ1InXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImFcIlxuICAgICAgZWRpdG9yLmluc2VydFRleHQgXCJiXCJcbiAgICAgIGVuc3VyZSB0ZXh0OiBcIjEyZm9vYWI1XFxuNjc4OTBcIlxuXG4gICAgICBlbnN1cmUgJ2JhY2tzcGFjZScsIHRleHQ6IFwiMTJmb29hNDVcXG42Nzg5MFwiXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImNcIlxuICAgICAgZW5zdXJlIHRleHQ6IFwiMTJmb29hYzVcXG42Nzg5MFwiXG4gICAgICBlbnN1cmUgJ2JhY2tzcGFjZSBiYWNrc3BhY2UnLFxuICAgICAgICB0ZXh0OiBcIjEyZm9vMzQ1XFxuNjc4OTBcIlxuICAgICAgICBzZWxlY3RlZFRleHQ6ICcnXG5cbiAgICAgIGVuc3VyZSAnYmFja3NwYWNlJyxcbiAgICAgICAgdGV4dDogXCIxMmZvbzM0NVxcbjY3ODkwXCJcbiAgICAgICAgc2VsZWN0ZWRUZXh0OiAnJ1xuXG4gICAgaXQgXCJjYW4gYmUgcmVwZWF0ZWRcIiwgLT5cbiAgICAgIGtleXN0cm9rZSAnUidcbiAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYWJcIlxuICAgICAga2V5c3Ryb2tlICdlc2NhcGUnXG4gICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiMTJhYjVcXG42N2FiMFwiLCBjdXJzb3I6IFsxLCAzXVxuICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIjEyYWJhYlxcbjY3YWIwXCIsIGN1cnNvcjogWzAsIDVdXG5cbiAgICBpdCBcImNhbiBiZSBpbnRlcnJ1cHRlZCBieSBhcnJvdyBrZXlzIGFuZCBiZWhhdmUgYXMgaW5zZXJ0IGZvciByZXBlYXRcIiwgLT5cbiAgICAgICMgRklYTUUgZG9uJ3Qga25vdyBob3cgdG8gdGVzdCB0aGlzIChhbHNvLCBkZXBlbmRzIG9uIFBSICM1NjgpXG5cbiAgICBpdCBcInJlcGVhdHMgY29ycmVjdGx5IHdoZW4gYmFja3NwYWNlIHdhcyB1c2VkIGluIHRoZSB0ZXh0XCIsIC0+XG4gICAgICBrZXlzdHJva2UgJ1InXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImFcIlxuICAgICAga2V5c3Ryb2tlICdiYWNrc3BhY2UnXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImJcIlxuICAgICAga2V5c3Ryb2tlICdlc2NhcGUnXG4gICAgICBzZXQgY3Vyc29yOiBbMSwgMl1cbiAgICAgIGVuc3VyZSAnLicsIHRleHQ6IFwiMTJiNDVcXG42N2I5MFwiLCBjdXJzb3I6IFsxLCAyXVxuICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICBlbnN1cmUgJy4nLCB0ZXh0OiBcIjEyYjRiXFxuNjdiOTBcIiwgY3Vyc29yOiBbMCwgNF1cblxuICAgIGl0IFwiZG9lc24ndCByZXBsYWNlIGEgY2hhcmFjdGVyIGlmIG5ld2xpbmUgaXMgZW50ZXJlZFwiLCAtPlxuICAgICAgZW5zdXJlICdSJywgbW9kZTogWydpbnNlcnQnLCAncmVwbGFjZSddXG4gICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcIlxcblwiXG4gICAgICBlbnN1cmUgJ2VzY2FwZScsIHRleHQ6IFwiMTJcXG4zNDVcXG42Nzg5MFwiXG5cbiAgICBkZXNjcmliZSBcIm11bHRpbGluZSBzaXR1YXRpb25cIiwgLT5cbiAgICAgIHRleHRPcmlnaW5hbCA9IFwiXCJcIlxuICAgICAgICAwMTIzNFxuICAgICAgICA1Njc4OVxuICAgICAgICBcIlwiXCJcbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6IHRleHRPcmlnaW5hbCwgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGl0IFwicmVwbGFjZSBjaGFyYWN0ZXIgdW5sZXNzIGlucHV0IGlzbnQgbmV3IGxpbmUoXFxcXG4pXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnUicsIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImFcXG5iXFxuY1wiXG4gICAgICAgIGVuc3VyZVxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYVxuICAgICAgICAgICAgYlxuICAgICAgICAgICAgYzM0XG4gICAgICAgICAgICA1Njc4OVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMiwgMV1cbiAgICAgIGl0IFwiaGFuZGxlIGJhY2tzcGFjZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ1InLCBtb2RlOiBbJ2luc2VydCcsICdyZXBsYWNlJ11cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDFdXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYVxcbmJcXG5jXCJcbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwYVxuICAgICAgICAgICAgYlxuICAgICAgICAgICAgYzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsyLCAxXVxuICAgICAgICBlbnN1cmUgJ2JhY2tzcGFjZScsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwYVxuICAgICAgICAgICAgYlxuICAgICAgICAgICAgMzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsyLCAwXVxuICAgICAgICBlbnN1cmUgJ2JhY2tzcGFjZScsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwYVxuICAgICAgICAgICAgYjM0XG4gICAgICAgICAgICA1Njc4OVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMSwgMV1cbiAgICAgICAgZW5zdXJlICdiYWNrc3BhY2UnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMGFcbiAgICAgICAgICAgIDIzNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDBdXG4gICAgICAgIGVuc3VyZSAnYmFja3NwYWNlJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIDBhMjM0XG4gICAgICAgICAgICA1Njc4OVxuICAgICAgICAgICAgXCJcIlwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgZW5zdXJlICdiYWNrc3BhY2UnLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMDEyMzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ2JhY2tzcGFjZScsICMgZG8gbm90aGluZ1xuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgMDEyMzRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAxXVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwMTIzNFxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcbiAgICAgIGl0IFwicmVwZWF0ZSBtdWx0aWxpbmUgdGV4dCBjYXNlLTFcIiwgLT5cbiAgICAgICAgZW5zdXJlICdSJywgbW9kZTogWydpbnNlcnQnLCAncmVwbGFjZSddXG4gICAgICAgIGVkaXRvci5pbnNlcnRUZXh0IFwiYWJjXFxuZGVmXCJcbiAgICAgICAgZW5zdXJlXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICBhYmNcbiAgICAgICAgICAgIGRlZlxuICAgICAgICAgICAgNTY3ODlcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzEsIDNdXG4gICAgICAgIGVuc3VyZSAnZXNjYXBlJywgY3Vyc29yOiBbMSwgMl0sIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGVuc3VyZSAndScsIHRleHQ6IHRleHRPcmlnaW5hbFxuICAgICAgICBlbnN1cmUgJy4nLFxuICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgYWJjXG4gICAgICAgICAgICBkZWZcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAyXVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICAgIGVuc3VyZSAnaiAuJyxcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgZGVmXG4gICAgICAgICAgICA1NmFiY1xuICAgICAgICAgICAgZGVmXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFszLCAyXVxuICAgICAgICAgIG1vZGU6ICdub3JtYWwnXG4gICAgICBpdCBcInJlcGVhdGUgbXVsdGlsaW5lIHRleHQgY2FzZS0yXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnUicsIG1vZGU6IFsnaW5zZXJ0JywgJ3JlcGxhY2UnXVxuICAgICAgICBlZGl0b3IuaW5zZXJ0VGV4dCBcImFiY1xcbmRcIlxuICAgICAgICBlbnN1cmVcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAgIGFiY1xuICAgICAgICAgICAgZDRcbiAgICAgICAgICAgIDU2Nzg5XG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFsxLCAxXVxuICAgICAgICBlbnN1cmUgJ2VzY2FwZScsIGN1cnNvcjogWzEsIDBdLCBtb2RlOiAnbm9ybWFsJ1xuICAgICAgICBlbnN1cmUgJ2ogLicsXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgYWJjXG4gICAgICAgICAgZDRcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBkOVxuICAgICAgICAgIFwiXCJcIlxuICAgICAgICAgIGN1cnNvcjogWzMsIDBdXG4gICAgICAgICAgbW9kZTogJ25vcm1hbCdcblxuICBkZXNjcmliZSAnQWRkQmxhbmtMaW5lQmVsb3csIEFkZEJsYW5rTGluZUFib3ZlJywgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICBsaW5lMFxuICAgICAgICBsaXxuZTFcbiAgICAgICAgbGluZTJcbiAgICAgICAgbGluZTNcbiAgICAgICAgXCJcIlwiXG5cbiAgICAgIGF0b20ua2V5bWFwcy5hZGQgXCJ0ZXN0XCIsXG4gICAgICAgICdhdG9tLXRleHQtZWRpdG9yLnZpbS1tb2RlLXBsdXMubm9ybWFsLW1vZGUnOlxuICAgICAgICAgICdlbnRlcic6ICd2aW0tbW9kZS1wbHVzOmFkZC1ibGFuay1saW5lLWJlbG93J1xuICAgICAgICAgICdzaGlmdC1lbnRlcic6ICd2aW0tbW9kZS1wbHVzOmFkZC1ibGFuay1saW5lLWFib3ZlJ1xuXG4gICAgaXQgXCJpbnNlcnQgYmxhbmsgbGluZSBiZWxvdy9hYm92ZVwiLCAtPlxuICAgICAgZW5zdXJlIFwiZW50ZXJcIixcbiAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICBsaW5lMFxuICAgICAgICBsaXxuZTFcblxuICAgICAgICBsaW5lMlxuICAgICAgICBsaW5lM1xuICAgICAgICBcIlwiXCJcbiAgICAgIGVuc3VyZSBcInNoaWZ0LWVudGVyXCIsXG4gICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgbGluZTBcblxuICAgICAgICBsaXxuZTFcblxuICAgICAgICBsaW5lMlxuICAgICAgICBsaW5lM1xuICAgICAgICBcIlwiXCJcblxuICAgIGl0IFwiW3dpdGgtY291bnRdIGluc2VydCBibGFuayBsaW5lIGJlbG93L2Fib3ZlXCIsIC0+XG4gICAgICBlbnN1cmUgXCIyIGVudGVyXCIsXG4gICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgbGluZTBcbiAgICAgICAgbGl8bmUxXG5cblxuICAgICAgICBsaW5lMlxuICAgICAgICBsaW5lM1xuICAgICAgICBcIlwiXCJcbiAgICAgIGVuc3VyZSBcIjIgc2hpZnQtZW50ZXJcIixcbiAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICBsaW5lMFxuXG5cbiAgICAgICAgbGl8bmUxXG5cblxuICAgICAgICBsaW5lMlxuICAgICAgICBsaW5lM1xuICAgICAgICBcIlwiXCJcbiJdfQ==
