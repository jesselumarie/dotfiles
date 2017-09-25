(function() {
  var getVimState, settings,
    slice = [].slice;

  getVimState = require('./spec-helper').getVimState;

  settings = require('../lib/settings');

  describe("Prefixes", function() {
    var editor, editorElement, ensure, keystroke, ref, set, vimState;
    ref = [], set = ref[0], ensure = ref[1], keystroke = ref[2], editor = ref[3], editorElement = ref[4], vimState = ref[5];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
    });
    describe("Repeat", function() {
      describe("with operations", function() {
        beforeEach(function() {
          return set({
            text: "123456789abc",
            cursor: [0, 0]
          });
        });
        it("repeats N times", function() {
          return ensure('3 x', {
            text: '456789abc'
          });
        });
        return it("repeats NN times", function() {
          return ensure('1 0 x', {
            text: 'bc'
          });
        });
      });
      describe("with motions", function() {
        beforeEach(function() {
          return set({
            text: 'one two three',
            cursor: [0, 0]
          });
        });
        return it("repeats N times", function() {
          return ensure('d 2 w', {
            text: 'three'
          });
        });
      });
      return describe("in visual mode", function() {
        beforeEach(function() {
          return set({
            text: 'one two three',
            cursor: [0, 0]
          });
        });
        return it("repeats movements in visual mode", function() {
          return ensure('v 2 w', {
            cursor: [0, 9]
          });
        });
      });
    });
    describe("Register", function() {
      beforeEach(function() {
        return vimState.globalState.reset('register');
      });
      describe("the a register", function() {
        it("saves a value for future reading", function() {
          set({
            register: {
              a: {
                text: 'new content'
              }
            }
          });
          return ensure({
            register: {
              a: {
                text: 'new content'
              }
            }
          });
        });
        return it("overwrites a value previously in the register", function() {
          set({
            register: {
              a: {
                text: 'content'
              }
            }
          });
          set({
            register: {
              a: {
                text: 'new content'
              }
            }
          });
          return ensure({
            register: {
              a: {
                text: 'new content'
              }
            }
          });
        });
      });
      describe("with yank command", function() {
        beforeEach(function() {
          return set({
            cursor: [0, 0],
            text: "aaa bbb ccc"
          });
        });
        it("save to pre specified register", function() {
          ensure('" a y i w', {
            register: {
              a: {
                text: 'aaa'
              }
            }
          });
          ensure('w " b y i w', {
            register: {
              b: {
                text: 'bbb'
              }
            }
          });
          return ensure('w " c y i w', {
            register: {
              c: {
                text: 'ccc'
              }
            }
          });
        });
        return it("work with motion which also require input such as 't'", function() {
          return ensure('" a y t c', {
            register: {
              a: {
                text: 'aaa bbb '
              }
            }
          });
        });
      });
      describe("With p command", function() {
        beforeEach(function() {
          vimState.globalState.reset('register');
          set({
            register: {
              a: {
                text: 'new content'
              }
            }
          });
          return set({
            text: "abc\ndef",
            cursor: [0, 0]
          });
        });
        describe("when specified register have no text", function() {
          it("can paste from a register", function() {
            ensure({
              mode: "normal"
            });
            return ensure('" a p', {
              textC: "anew conten|tbc\ndef"
            });
          });
          return it("but do nothing for z register", function() {
            return ensure('" z p', {
              textC: "|abc\ndef"
            });
          });
        });
        return describe("blockwise-mode paste just use register have no text", function() {
          return it("paste from a register to each selction", function() {
            return ensure('ctrl-v j " a p', {
              textC: "|new contentbc\nnew contentef"
            });
          });
        });
      });
      describe("the B register", function() {
        it("saves a value for future reading", function() {
          set({
            register: {
              B: {
                text: 'new content'
              }
            }
          });
          ensure({
            register: {
              b: {
                text: 'new content'
              }
            }
          });
          return ensure({
            register: {
              B: {
                text: 'new content'
              }
            }
          });
        });
        it("appends to a value previously in the register", function() {
          set({
            register: {
              b: {
                text: 'content'
              }
            }
          });
          set({
            register: {
              B: {
                text: 'new content'
              }
            }
          });
          return ensure({
            register: {
              b: {
                text: 'contentnew content'
              }
            }
          });
        });
        it("appends linewise to a linewise value previously in the register", function() {
          set({
            register: {
              b: {
                text: 'content\n',
                type: 'linewise'
              }
            }
          });
          set({
            register: {
              B: {
                text: 'new content'
              }
            }
          });
          return ensure({
            register: {
              b: {
                text: 'content\nnew content\n'
              }
            }
          });
        });
        return it("appends linewise to a character value previously in the register", function() {
          set({
            register: {
              b: {
                text: 'content'
              }
            }
          });
          set({
            register: {
              B: {
                text: 'new content\n',
                type: 'linewise'
              }
            }
          });
          return ensure({
            register: {
              b: {
                text: 'content\nnew content\n'
              }
            }
          });
        });
      });
      describe("the * register", function() {
        describe("reading", function() {
          return it("is the same the system clipboard", function() {
            return ensure({
              register: {
                '*': {
                  text: 'initial clipboard content',
                  type: 'characterwise'
                }
              }
            });
          });
        });
        return describe("writing", function() {
          beforeEach(function() {
            return set({
              register: {
                '*': {
                  text: 'new content'
                }
              }
            });
          });
          return it("overwrites the contents of the system clipboard", function() {
            return expect(atom.clipboard.read()).toEqual('new content');
          });
        });
      });
      describe("the + register", function() {
        describe("reading", function() {
          return it("is the same the system clipboard", function() {
            return ensure({
              register: {
                '*': {
                  text: 'initial clipboard content',
                  type: 'characterwise'
                }
              }
            });
          });
        });
        return describe("writing", function() {
          beforeEach(function() {
            return set({
              register: {
                '*': {
                  text: 'new content'
                }
              }
            });
          });
          return it("overwrites the contents of the system clipboard", function() {
            return expect(atom.clipboard.read()).toEqual('new content');
          });
        });
      });
      describe("the _ register", function() {
        describe("reading", function() {
          return it("is always the empty string", function() {
            return ensure({
              register: {
                '_': {
                  text: ''
                }
              }
            });
          });
        });
        return describe("writing", function() {
          return it("throws away anything written to it", function() {
            set({
              register: {
                '_': {
                  text: 'new content'
                }
              }
            });
            return ensure({
              register: {
                '_': {
                  text: ''
                }
              }
            });
          });
        });
      });
      describe("the % register", function() {
        beforeEach(function() {
          return spyOn(editor, 'getURI').andReturn('/Users/atom/known_value.txt');
        });
        describe("reading", function() {
          return it("returns the filename of the current editor", function() {
            return ensure({
              register: {
                '%': {
                  text: '/Users/atom/known_value.txt'
                }
              }
            });
          });
        });
        return describe("writing", function() {
          return it("throws away anything written to it", function() {
            set({
              register: {
                '%': {
                  text: 'new content'
                }
              }
            });
            return ensure({
              register: {
                '%': {
                  text: '/Users/atom/known_value.txt'
                }
              }
            });
          });
        });
      });
      describe("the numbered 0-9 register", function() {
        describe("0", function() {
          return it("keep most recent yank-ed text", function() {
            ensure({
              register: {
                '"': {
                  text: 'initial clipboard content'
                },
                '0': {
                  text: void 0
                }
              }
            });
            set({
              textC: "|000"
            });
            ensure("y w", {
              register: {
                '"': {
                  text: "000"
                },
                '0': {
                  text: "000"
                }
              }
            });
            return ensure("y l", {
              register: {
                '"': {
                  text: "0"
                },
                '0': {
                  text: "0"
                }
              }
            });
          });
        });
        return describe("1-9 and small-delete(-) register", function() {
          beforeEach(function() {
            return set({
              textC: "|0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n"
            });
          });
          it("keep deleted text", function() {
            ensure("d d", {
              textC: "|1\n2\n3\n4\n5\n6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '0\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '0\n'
                },
                '2': {
                  text: void 0
                },
                '3': {
                  text: void 0
                },
                '4': {
                  text: void 0
                },
                '5': {
                  text: void 0
                },
                '6': {
                  text: void 0
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|2\n3\n4\n5\n6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '1\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '1\n'
                },
                '2': {
                  text: '0\n'
                },
                '3': {
                  text: void 0
                },
                '4': {
                  text: void 0
                },
                '5': {
                  text: void 0
                },
                '6': {
                  text: void 0
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|3\n4\n5\n6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '2\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '2\n'
                },
                '2': {
                  text: '1\n'
                },
                '3': {
                  text: '0\n'
                },
                '4': {
                  text: void 0
                },
                '5': {
                  text: void 0
                },
                '6': {
                  text: void 0
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|4\n5\n6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '3\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '3\n'
                },
                '2': {
                  text: '2\n'
                },
                '3': {
                  text: '1\n'
                },
                '4': {
                  text: '0\n'
                },
                '5': {
                  text: void 0
                },
                '6': {
                  text: void 0
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|5\n6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '4\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '4\n'
                },
                '2': {
                  text: '3\n'
                },
                '3': {
                  text: '2\n'
                },
                '4': {
                  text: '1\n'
                },
                '5': {
                  text: '0\n'
                },
                '6': {
                  text: void 0
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '5\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '5\n'
                },
                '2': {
                  text: '4\n'
                },
                '3': {
                  text: '3\n'
                },
                '4': {
                  text: '2\n'
                },
                '5': {
                  text: '1\n'
                },
                '6': {
                  text: '0\n'
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '6\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '6\n'
                },
                '2': {
                  text: '5\n'
                },
                '3': {
                  text: '4\n'
                },
                '4': {
                  text: '3\n'
                },
                '5': {
                  text: '2\n'
                },
                '6': {
                  text: '1\n'
                },
                '7': {
                  text: '0\n'
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|8\n9\n10\n",
              register: {
                '"': {
                  text: '7\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '7\n'
                },
                '2': {
                  text: '6\n'
                },
                '3': {
                  text: '5\n'
                },
                '4': {
                  text: '4\n'
                },
                '5': {
                  text: '3\n'
                },
                '6': {
                  text: '2\n'
                },
                '7': {
                  text: '1\n'
                },
                '8': {
                  text: '0\n'
                },
                '9': {
                  text: void 0
                }
              }
            });
            ensure(".", {
              textC: "|9\n10\n",
              register: {
                '"': {
                  text: '8\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '8\n'
                },
                '2': {
                  text: '7\n'
                },
                '3': {
                  text: '6\n'
                },
                '4': {
                  text: '5\n'
                },
                '5': {
                  text: '4\n'
                },
                '6': {
                  text: '3\n'
                },
                '7': {
                  text: '2\n'
                },
                '8': {
                  text: '1\n'
                },
                '9': {
                  text: '0\n'
                }
              }
            });
            return ensure(".", {
              textC: "|10\n",
              register: {
                '"': {
                  text: '9\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '9\n'
                },
                '2': {
                  text: '8\n'
                },
                '3': {
                  text: '7\n'
                },
                '4': {
                  text: '6\n'
                },
                '5': {
                  text: '5\n'
                },
                '6': {
                  text: '4\n'
                },
                '7': {
                  text: '3\n'
                },
                '8': {
                  text: '2\n'
                },
                '9': {
                  text: '1\n'
                }
              }
            });
          });
          it("also keeps changed text", function() {
            return ensure("c j", {
              textC: "|\n2\n3\n4\n5\n6\n7\n8\n9\n10\n",
              register: {
                '"': {
                  text: '0\n1\n'
                },
                '-': {
                  text: void 0
                },
                '1': {
                  text: '0\n1\n'
                },
                '2': {
                  text: void 0
                },
                '3': {
                  text: void 0
                },
                '4': {
                  text: void 0
                },
                '5': {
                  text: void 0
                },
                '6': {
                  text: void 0
                },
                '7': {
                  text: void 0
                },
                '8': {
                  text: void 0
                },
                '9': {
                  text: void 0
                }
              }
            });
          });
          return describe("which goes to numbered and which goes to small-delete register", function() {
            beforeEach(function() {
              return set({
                textC: "|{abc}\n"
              });
            });
            it("small-change goes to - register", function() {
              return ensure("c $", {
                textC: "|\n",
                register: {
                  '"': {
                    text: '{abc}'
                  },
                  '-': {
                    text: '{abc}'
                  },
                  '1': {
                    text: void 0
                  },
                  '2': {
                    text: void 0
                  },
                  '3': {
                    text: void 0
                  },
                  '4': {
                    text: void 0
                  },
                  '5': {
                    text: void 0
                  },
                  '6': {
                    text: void 0
                  },
                  '7': {
                    text: void 0
                  },
                  '8': {
                    text: void 0
                  },
                  '9': {
                    text: void 0
                  }
                }
              });
            });
            it("small-delete goes to - register", function() {
              return ensure("d $", {
                textC: "|\n",
                register: {
                  '"': {
                    text: '{abc}'
                  },
                  '-': {
                    text: '{abc}'
                  },
                  '1': {
                    text: void 0
                  },
                  '2': {
                    text: void 0
                  },
                  '3': {
                    text: void 0
                  },
                  '4': {
                    text: void 0
                  },
                  '5': {
                    text: void 0
                  },
                  '6': {
                    text: void 0
                  },
                  '7': {
                    text: void 0
                  },
                  '8': {
                    text: void 0
                  },
                  '9': {
                    text: void 0
                  }
                }
              });
            });
            it("[exception] % motion always save to numbered", function() {
              set({
                textC: "|{abc}\n"
              });
              return ensure("d %", {
                textC: "|\n",
                register: {
                  '"': {
                    text: '{abc}'
                  },
                  '-': {
                    text: void 0
                  },
                  '1': {
                    text: '{abc}'
                  },
                  '2': {
                    text: void 0
                  }
                }
              });
            });
            it("[exception] / motion always save to numbered", function() {
              jasmine.attachToDOM(atom.workspace.getElement());
              set({
                textC: "|{abc}\n"
              });
              return ensure("d / } enter", {
                textC: "|}\n",
                register: {
                  '"': {
                    text: '{abc'
                  },
                  '-': {
                    text: void 0
                  },
                  '1': {
                    text: '{abc'
                  },
                  '2': {
                    text: void 0
                  }
                }
              });
            });
            it("/, n motion always save to numbered", function() {
              jasmine.attachToDOM(atom.workspace.getElement());
              set({
                textC: "|abc axx abc\n"
              });
              ensure("d / a enter", {
                textC: "|axx abc\n",
                register: {
                  '"': {
                    text: 'abc '
                  },
                  '-': {
                    text: void 0
                  },
                  '1': {
                    text: 'abc '
                  },
                  '2': {
                    text: void 0
                  }
                }
              });
              return ensure("d n", {
                textC: "|abc\n",
                register: {
                  '"': {
                    text: 'axx '
                  },
                  '-': {
                    text: void 0
                  },
                  '1': {
                    text: 'axx '
                  },
                  '2': {
                    text: 'abc '
                  }
                }
              });
            });
            return it("?, N motion always save to numbered", function() {
              jasmine.attachToDOM(atom.workspace.getElement());
              set({
                textC: "abc axx |abc\n"
              });
              ensure("d ? a enter", {
                textC: "abc |abc\n",
                register: {
                  '"': {
                    text: 'axx '
                  },
                  '-': {
                    text: void 0
                  },
                  '1': {
                    text: 'axx '
                  },
                  '2': {
                    text: void 0
                  }
                }
              });
              ensure("0", {
                textC: "|abc abc\n"
              });
              return ensure("c N", {
                textC: "|abc\n",
                register: {
                  '"': {
                    text: 'abc '
                  },
                  '-': {
                    text: void 0
                  },
                  '1': {
                    text: 'abc '
                  },
                  '2': {
                    text: "axx "
                  }
                }
              });
            });
          });
        });
      });
      describe("the ctrl-r command in insert mode", function() {
        beforeEach(function() {
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
                text: 'abc'
              }
            }
          });
          set({
            register: {
              '*': {
                text: 'abc'
              }
            }
          });
          atom.clipboard.write("clip");
          set({
            text: "012\n",
            cursor: [0, 2]
          });
          return ensure('i', {
            mode: 'insert'
          });
        });
        describe("useClipboardAsDefaultRegister = true", function() {
          beforeEach(function() {
            settings.set('useClipboardAsDefaultRegister', true);
            set({
              register: {
                '"': {
                  text: '345'
                }
              }
            });
            return atom.clipboard.write("clip");
          });
          return it("inserts contents from clipboard with \"", function() {
            return ensure('ctrl-r "', {
              text: '01clip2\n'
            });
          });
        });
        describe("useClipboardAsDefaultRegister = false", function() {
          beforeEach(function() {
            settings.set('useClipboardAsDefaultRegister', false);
            set({
              register: {
                '"': {
                  text: '345'
                }
              }
            });
            return atom.clipboard.write("clip");
          });
          return it("inserts contents from \" with \"", function() {
            return ensure('ctrl-r "', {
              text: '013452\n'
            });
          });
        });
        it("inserts contents of the 'a' register", function() {
          return ensure('ctrl-r a', {
            text: '01abc2\n'
          });
        });
        return it("is cancelled with the escape key", function() {
          return ensure('ctrl-r escape', {
            text: '012\n',
            mode: 'insert',
            cursor: [0, 2]
          });
        });
      });
      return describe("per selection clipboard", function() {
        var ensurePerSelectionRegister;
        ensurePerSelectionRegister = function() {
          var i, j, len, ref1, results, selection, texts;
          texts = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          ref1 = editor.getSelections();
          results = [];
          for (i = j = 0, len = ref1.length; j < len; i = ++j) {
            selection = ref1[i];
            results.push(ensure({
              register: {
                '*': {
                  text: texts[i],
                  selection: selection
                }
              }
            }));
          }
          return results;
        };
        beforeEach(function() {
          settings.set('useClipboardAsDefaultRegister', true);
          return set({
            text: "012:\nabc:\ndef:\n",
            cursor: [[0, 1], [1, 1], [2, 1]]
          });
        });
        describe("on selection destroye", function() {
          return it("remove corresponding subscriptin and clipboard entry", function() {
            var clipboardBySelection, j, len, ref1, ref2, selection, subscriptionBySelection;
            ref1 = vimState.register, clipboardBySelection = ref1.clipboardBySelection, subscriptionBySelection = ref1.subscriptionBySelection;
            expect(clipboardBySelection.size).toBe(0);
            expect(subscriptionBySelection.size).toBe(0);
            keystroke("y i w");
            ensurePerSelectionRegister('012', 'abc', 'def');
            expect(clipboardBySelection.size).toBe(3);
            expect(subscriptionBySelection.size).toBe(3);
            ref2 = editor.getSelections();
            for (j = 0, len = ref2.length; j < len; j++) {
              selection = ref2[j];
              selection.destroy();
            }
            expect(clipboardBySelection.size).toBe(0);
            return expect(subscriptionBySelection.size).toBe(0);
          });
        });
        describe("Yank", function() {
          return it("save text to per selection register", function() {
            keystroke("y i w");
            return ensurePerSelectionRegister('012', 'abc', 'def');
          });
        });
        describe("Delete family", function() {
          it("d", function() {
            ensure("d i w", {
              text: ":\n:\n:\n"
            });
            return ensurePerSelectionRegister('012', 'abc', 'def');
          });
          it("x", function() {
            ensure("x", {
              text: "02:\nac:\ndf:\n"
            });
            return ensurePerSelectionRegister('1', 'b', 'e');
          });
          it("X", function() {
            ensure("X", {
              text: "12:\nbc:\nef:\n"
            });
            return ensurePerSelectionRegister('0', 'a', 'd');
          });
          return it("D", function() {
            ensure("D", {
              text: "0\na\nd\n"
            });
            return ensurePerSelectionRegister('12:', 'bc:', 'ef:');
          });
        });
        describe("Put family", function() {
          it("p paste text from per selection register", function() {
            return ensure("y i w $ p", {
              text: "012:012\nabc:abc\ndef:def\n"
            });
          });
          return it("P paste text from per selection register", function() {
            return ensure("y i w $ P", {
              text: "012012:\nabcabc:\ndefdef:\n"
            });
          });
        });
        return describe("ctrl-r in insert mode", function() {
          return it("insert from per selection registe", function() {
            ensure("d i w", {
              text: ":\n:\n:\n"
            });
            ensure('a', {
              mode: 'insert'
            });
            return ensure('ctrl-r "', {
              text: ":012\n:abc\n:def\n"
            });
          });
        });
      });
    });
    return describe("Count modifier", function() {
      beforeEach(function() {
        return set({
          text: "000 111 222 333 444 555 666 777 888 999",
          cursor: [0, 0]
        });
      });
      it("repeat operator", function() {
        return ensure('3 d w', {
          text: "333 444 555 666 777 888 999"
        });
      });
      it("repeat motion", function() {
        return ensure('d 2 w', {
          text: "222 333 444 555 666 777 888 999"
        });
      });
      return it("repeat operator and motion respectively", function() {
        return ensure('3 d 2 w', {
          text: "666 777 888 999"
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvcHJlZml4LXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxxQkFBQTtJQUFBOztFQUFDLGNBQWUsT0FBQSxDQUFRLGVBQVI7O0VBQ2hCLFFBQUEsR0FBVyxPQUFBLENBQVEsaUJBQVI7O0VBRVgsUUFBQSxDQUFTLFVBQVQsRUFBcUIsU0FBQTtBQUNuQixRQUFBO0lBQUEsTUFBNEQsRUFBNUQsRUFBQyxZQUFELEVBQU0sZUFBTixFQUFjLGtCQUFkLEVBQXlCLGVBQXpCLEVBQWlDLHNCQUFqQyxFQUFnRDtJQUVoRCxVQUFBLENBQVcsU0FBQTthQUNULFdBQUEsQ0FBWSxTQUFDLEtBQUQsRUFBUSxHQUFSO1FBQ1YsUUFBQSxHQUFXO1FBQ1Ysd0JBQUQsRUFBUztlQUNSLGFBQUQsRUFBTSxtQkFBTixFQUFjLHlCQUFkLEVBQTJCO01BSGpCLENBQVo7SUFEUyxDQUFYO0lBTUEsUUFBQSxDQUFTLFFBQVQsRUFBbUIsU0FBQTtNQUNqQixRQUFBLENBQVMsaUJBQVQsRUFBNEIsU0FBQTtRQUMxQixVQUFBLENBQVcsU0FBQTtpQkFDVCxHQUFBLENBQUk7WUFBQSxJQUFBLEVBQU0sY0FBTjtZQUFzQixNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUE5QjtXQUFKO1FBRFMsQ0FBWDtRQUdBLEVBQUEsQ0FBRyxpQkFBSCxFQUFzQixTQUFBO2lCQUNwQixNQUFBLENBQU8sS0FBUCxFQUFjO1lBQUEsSUFBQSxFQUFNLFdBQU47V0FBZDtRQURvQixDQUF0QjtlQUdBLEVBQUEsQ0FBRyxrQkFBSCxFQUF1QixTQUFBO2lCQUNyQixNQUFBLENBQU8sT0FBUCxFQUFnQjtZQUFBLElBQUEsRUFBTSxJQUFOO1dBQWhCO1FBRHFCLENBQXZCO01BUDBCLENBQTVCO01BVUEsUUFBQSxDQUFT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QUF3QyxTQUFBO1lBQ3RDLE1BQUEsQ0FBTyxPQUFQLEVBQWdCO2NBQUEsSUFBQSxFQUFNLFdBQU47YUFBaEI7WUFDQSxNQUFBLENBQU8sR0FBUCxFQUFZO2NBQUEsSUFBQSxFQUFNLFFBQU47YUFBWjttQkFDQSxNQUFBLENBQU8sVUFBUCxFQUNFO2NBQUEsSUFBQSxFQUFNLG9CQUFOO2FBREY7VUFIc0MsQ0FBeEM7UUFEZ0MsQ0FBbEM7TUFoRWtDLENBQXBDO0lBNVRtQixDQUFyQjtXQXVZQSxRQUFBLENBQVMsZ0JBQVQsRUFBMkIsU0FBQTtNQUN6QixVQUFBLENBQVcsU0FBQTtlQUNULEdBQUEsQ0FDRTtVQUFBLElBQUEsRUFBTSx5Q0FBTjtVQUNBLE1BQUEsRUFBUSxDQUFDLENBQUQsRUFBSSxDQUFKLENBRFI7U0FERjtNQURTLENBQVg7TUFLQSxFQUFBLENBQUcsaUJBQUgsRUFBc0IsU0FBQTtlQUNwQixNQUFBLENBQU8sT0FBUCxFQUFnQjtVQUFBLElBQUEsRUFBTSw2QkFBTjtTQUFoQjtNQURvQixDQUF0QjtNQUVBLEVBQUEsQ0FBRyxlQUFILEVBQW9CLFNBQUE7ZUFDbEIsTUFBQSxDQUFPLE9BQVAsRUFBZ0I7VUFBQSxJQUFBLEVBQU0saUNBQU47U0FBaEI7TUFEa0IsQ0FBcEI7YUFFQSxFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtlQUM1QyxNQUFBLENBQU8sU0FBUCxFQUFrQjtVQUFBLElBQUEsRUFBTSxpQkFBTjtTQUFsQjtNQUQ0QyxDQUE5QztJQVZ5QixDQUEzQjtFQXphbUIsQ0FBckI7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIntnZXRWaW1TdGF0ZX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiUHJlZml4ZXNcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cblxuICBkZXNjcmliZSBcIlJlcGVhdFwiLCAtPlxuICAgIGRlc2NyaWJlIFwid2l0aCBvcGVyYXRpb25zXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCB0ZXh0OiBcIjEyMzQ1Njc4OWFiY1wiLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBpdCBcInJlcGVhdHMgTiB0aW1lc1wiLCAtPlxuICAgICAgICBlbnN1cmUgJzMgeCcsIHRleHQ6ICc0NTY3ODlhYmMnXG5cbiAgICAgIGl0IFwicmVwZWF0cyBOTiB0aW1lc1wiLCAtPlxuICAgICAgICBlbnN1cmUgJzEgMCB4JywgdGV4dDogJ2JjJ1xuXG4gICAgZGVzY3JpYmUgXCJ3aXRoIG1vdGlvbnNcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6ICdvbmUgdHdvIHRocmVlJywgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJyZXBlYXRzIE4gdGltZXNcIiwgLT5cbiAgICAgICAgZW5zdXJlICdkIDIgdycsIHRleHQ6ICd0aHJlZSdcblxuICAgIGRlc2NyaWJlIFwiaW4gdmlzdWFsIG1vZGVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0IHRleHQ6ICdvbmUgdHdvIHRocmVlJywgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgaXQgXCJyZXBlYXRzIG1vdmVtZW50cyBpbiB2aXN1YWwgbW9kZVwiLCAtPlxuICAgICAgICBlbnN1cmUgJ3YgMiB3JywgY3Vyc29yOiBbMCwgOV1cblxuICBkZXNjcmliZSBcIlJlZ2lzdGVyXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgdmltU3RhdGUuZ2xvYmFsU3RhdGUucmVzZXQoJ3JlZ2lzdGVyJylcblxuICAgIGRlc2NyaWJlIFwidGhlIGEgcmVnaXN0ZXJcIiwgLT5cbiAgICAgIGl0IFwic2F2ZXMgYSB2YWx1ZSBmb3IgZnV0dXJlIHJlYWRpbmdcIiwgLT5cbiAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiBhOiB0ZXh0OiAnbmV3IGNvbnRlbnQnXG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogYTogdGV4dDogJ25ldyBjb250ZW50J1xuXG4gICAgICBpdCBcIm92ZXJ3cml0ZXMgYSB2YWx1ZSBwcmV2aW91c2x5IGluIHRoZSByZWdpc3RlclwiLCAtPlxuICAgICAgICBzZXQgICAgcmVnaXN0ZXI6IGE6IHRleHQ6ICdjb250ZW50J1xuICAgICAgICBzZXQgICAgcmVnaXN0ZXI6IGE6IHRleHQ6ICduZXcgY29udGVudCdcbiAgICAgICAgZW5zdXJlIHJlZ2lzdGVyOiBhOiB0ZXh0OiAnbmV3IGNvbnRlbnQnXG5cbiAgICBkZXNjcmliZSBcIndpdGggeWFuayBjb21tYW5kXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldFxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgYWFhIGJiYiBjY2NcbiAgICAgICAgICBcIlwiXCJcbiAgICAgIGl0IFwic2F2ZSB0byBwcmUgc3BlY2lmaWVkIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnXCIgYSB5IGkgdycsIHJlZ2lzdGVyOiBhOiB0ZXh0OiAnYWFhJ1xuICAgICAgICBlbnN1cmUgJ3cgXCIgYiB5IGkgdycsIHJlZ2lzdGVyOiBiOiB0ZXh0OiAnYmJiJ1xuICAgICAgICBlbnN1cmUgJ3cgXCIgYyB5IGkgdycsIHJlZ2lzdGVyOiBjOiB0ZXh0OiAnY2NjJ1xuXG4gICAgICBpdCBcIndvcmsgd2l0aCBtb3Rpb24gd2hpY2ggYWxzbyByZXF1aXJlIGlucHV0IHN1Y2ggYXMgJ3QnXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnXCIgYSB5IHQgYycsIHJlZ2lzdGVyOiBhOiB0ZXh0OiAnYWFhIGJiYiAnXG5cbiAgICBkZXNjcmliZSBcIldpdGggcCBjb21tYW5kXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHZpbVN0YXRlLmdsb2JhbFN0YXRlLnJlc2V0KCdyZWdpc3RlcicpXG4gICAgICAgIHNldCByZWdpc3RlcjogYTogdGV4dDogJ25ldyBjb250ZW50J1xuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICBhYmNcbiAgICAgICAgICBkZWZcbiAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgICBkZXNjcmliZSBcIndoZW4gc3BlY2lmaWVkIHJlZ2lzdGVyIGhhdmUgbm8gdGV4dFwiLCAtPlxuICAgICAgICBpdCBcImNhbiBwYXN0ZSBmcm9tIGEgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgbW9kZTogXCJub3JtYWxcIlxuICAgICAgICAgIGVuc3VyZSAnXCIgYSBwJyxcbiAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgIGFuZXcgY29udGVufHRiY1xuICAgICAgICAgICAgZGVmXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgICBpdCBcImJ1dCBkbyBub3RoaW5nIGZvciB6IHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgICAgZW5zdXJlICdcIiB6IHAnLFxuICAgICAgICAgICAgdGV4dEM6IFwiXCJcIlxuICAgICAgICAgICAgfGFiY1xuICAgICAgICAgICAgZGVmXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgICAgZGVzY3JpYmUgXCJibG9ja3dpc2UtbW9kZSBwYXN0ZSBqdXN0IHVzZSByZWdpc3RlciBoYXZlIG5vIHRleHRcIiwgLT5cbiAgICAgICAgaXQgXCJwYXN0ZSBmcm9tIGEgcmVnaXN0ZXIgdG8gZWFjaCBzZWxjdGlvblwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnY3RybC12IGogXCIgYSBwJyxcbiAgICAgICAgICAgIHRleHRDOiBcIlwiXCJcbiAgICAgICAgICAgIHxuZXcgY29udGVudGJjXG4gICAgICAgICAgICBuZXcgY29udGVudGVmXG4gICAgICAgICAgICBcIlwiXCJcblxuICAgIGRlc2NyaWJlIFwidGhlIEIgcmVnaXN0ZXJcIiwgLT5cbiAgICAgIGl0IFwic2F2ZXMgYSB2YWx1ZSBmb3IgZnV0dXJlIHJlYWRpbmdcIiwgLT5cbiAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiBCOiB0ZXh0OiAnbmV3IGNvbnRlbnQnXG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogYjogdGV4dDogJ25ldyBjb250ZW50J1xuICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6IEI6IHRleHQ6ICduZXcgY29udGVudCdcblxuICAgICAgaXQgXCJhcHBlbmRzIHRvIGEgdmFsdWUgcHJldmlvdXNseSBpbiB0aGUgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiBiOiB0ZXh0OiAnY29udGVudCdcbiAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiBCOiB0ZXh0OiAnbmV3IGNvbnRlbnQnXG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogYjogdGV4dDogJ2NvbnRlbnRuZXcgY29udGVudCdcblxuICAgICAgaXQgXCJhcHBlbmRzIGxpbmV3aXNlIHRvIGEgbGluZXdpc2UgdmFsdWUgcHJldmlvdXNseSBpbiB0aGUgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiBiOiB0ZXh0OiAnY29udGVudFxcbicsIHR5cGU6ICdsaW5ld2lzZSdcbiAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiBCOiB0ZXh0OiAnbmV3IGNvbnRlbnQnXG4gICAgICAgIGVuc3VyZSByZWdpc3RlcjogYjogdGV4dDogJ2NvbnRlbnRcXG5uZXcgY29udGVudFxcbidcblxuICAgICAgaXQgXCJhcHBlbmRzIGxpbmV3aXNlIHRvIGEgY2hhcmFjdGVyIHZhbHVlIHByZXZpb3VzbHkgaW4gdGhlIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIHNldCAgICByZWdpc3RlcjogYjogdGV4dDogJ2NvbnRlbnQnXG4gICAgICAgIHNldCAgICByZWdpc3RlcjogQjogdGV4dDogJ25ldyBjb250ZW50XFxuJywgdHlwZTogJ2xpbmV3aXNlJ1xuICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6IGI6IHRleHQ6ICdjb250ZW50XFxubmV3IGNvbnRlbnRcXG4nXG5cbiAgICBkZXNjcmliZSBcInRoZSAqIHJlZ2lzdGVyXCIsIC0+XG4gICAgICBkZXNjcmliZSBcInJlYWRpbmdcIiwgLT5cbiAgICAgICAgaXQgXCJpcyB0aGUgc2FtZSB0aGUgc3lzdGVtIGNsaXBib2FyZFwiLCAtPlxuICAgICAgICAgIGVuc3VyZSByZWdpc3RlcjogJyonOiB0ZXh0OiAnaW5pdGlhbCBjbGlwYm9hcmQgY29udGVudCcsIHR5cGU6ICdjaGFyYWN0ZXJ3aXNlJ1xuXG4gICAgICBkZXNjcmliZSBcIndyaXRpbmdcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCByZWdpc3RlcjogJyonOiB0ZXh0OiAnbmV3IGNvbnRlbnQnXG5cbiAgICAgICAgaXQgXCJvdmVyd3JpdGVzIHRoZSBjb250ZW50cyBvZiB0aGUgc3lzdGVtIGNsaXBib2FyZFwiLCAtPlxuICAgICAgICAgIGV4cGVjdChhdG9tLmNsaXBib2FyZC5yZWFkKCkpLnRvRXF1YWwgJ25ldyBjb250ZW50J1xuXG4gICAgIyBGSVhNRTogb25jZSBsaW51eCBzdXBwb3J0IGNvbWVzIG91dCwgdGhpcyBuZWVkcyB0byByZWFkIGZyb21cbiAgICAjIHRoZSBjb3JyZWN0IGNsaXBib2FyZC4gRm9yIG5vdyBpdCBiZWhhdmVzIGp1c3QgbGlrZSB0aGUgKiByZWdpc3RlclxuICAgICMgU2VlIDpoZWxwIHgxMS1jdXQtYnVmZmVyIGFuZCA6aGVscCByZWdpc3RlcnMgZm9yIG1vcmUgZGV0YWlscyBvbiBob3cgdGhlc2VcbiAgICAjIHJlZ2lzdGVycyB3b3JrIG9uIGFuIFgxMSBiYXNlZCBzeXN0ZW0uXG4gICAgZGVzY3JpYmUgXCJ0aGUgKyByZWdpc3RlclwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCJyZWFkaW5nXCIsIC0+XG4gICAgICAgIGl0IFwiaXMgdGhlIHNhbWUgdGhlIHN5c3RlbSBjbGlwYm9hcmRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6XG4gICAgICAgICAgICAnKic6IHRleHQ6ICdpbml0aWFsIGNsaXBib2FyZCBjb250ZW50JywgdHlwZTogJ2NoYXJhY3Rlcndpc2UnXG5cbiAgICAgIGRlc2NyaWJlIFwid3JpdGluZ1wiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0IHJlZ2lzdGVyOiAnKic6IHRleHQ6ICduZXcgY29udGVudCdcblxuICAgICAgICBpdCBcIm92ZXJ3cml0ZXMgdGhlIGNvbnRlbnRzIG9mIHRoZSBzeXN0ZW0gY2xpcGJvYXJkXCIsIC0+XG4gICAgICAgICAgZXhwZWN0KGF0b20uY2xpcGJvYXJkLnJlYWQoKSkudG9FcXVhbCAnbmV3IGNvbnRlbnQnXG5cbiAgICBkZXNjcmliZSBcInRoZSBfIHJlZ2lzdGVyXCIsIC0+XG4gICAgICBkZXNjcmliZSBcInJlYWRpbmdcIiwgLT5cbiAgICAgICAgaXQgXCJpcyBhbHdheXMgdGhlIGVtcHR5IHN0cmluZ1wiLCAtPlxuICAgICAgICAgIGVuc3VyZSByZWdpc3RlcjogJ18nOiB0ZXh0OiAnJ1xuXG4gICAgICBkZXNjcmliZSBcIndyaXRpbmdcIiwgLT5cbiAgICAgICAgaXQgXCJ0aHJvd3MgYXdheSBhbnl0aGluZyB3cml0dGVuIHRvIGl0XCIsIC0+XG4gICAgICAgICAgc2V0IHJlZ2lzdGVyOiAgICAnXyc6IHRleHQ6ICduZXcgY29udGVudCdcbiAgICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6ICdfJzogdGV4dDogJydcblxuICAgIGRlc2NyaWJlIFwidGhlICUgcmVnaXN0ZXJcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc3B5T24oZWRpdG9yLCAnZ2V0VVJJJykuYW5kUmV0dXJuICcvVXNlcnMvYXRvbS9rbm93bl92YWx1ZS50eHQnXG5cbiAgICAgIGRlc2NyaWJlIFwicmVhZGluZ1wiLCAtPlxuICAgICAgICBpdCBcInJldHVybnMgdGhlIGZpbGVuYW1lIG9mIHRoZSBjdXJyZW50IGVkaXRvclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSByZWdpc3RlcjogJyUnOiB0ZXh0OiAnL1VzZXJzL2F0b20va25vd25fdmFsdWUudHh0J1xuXG4gICAgICBkZXNjcmliZSBcIndyaXRpbmdcIiwgLT5cbiAgICAgICAgaXQgXCJ0aHJvd3MgYXdheSBhbnl0aGluZyB3cml0dGVuIHRvIGl0XCIsIC0+XG4gICAgICAgICAgc2V0ICAgIHJlZ2lzdGVyOiAnJSc6IHRleHQ6ICduZXcgY29udGVudCdcbiAgICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6ICclJzogdGV4dDogJy9Vc2Vycy9hdG9tL2tub3duX3ZhbHVlLnR4dCdcblxuICAgIGRlc2NyaWJlIFwidGhlIG51bWJlcmVkIDAtOSByZWdpc3RlclwiLCAtPlxuICAgICAgZGVzY3JpYmUgXCIwXCIsIC0+XG4gICAgICAgIGl0IFwia2VlcCBtb3N0IHJlY2VudCB5YW5rLWVkIHRleHRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgcmVnaXN0ZXI6ICdcIic6IHt0ZXh0OiAnaW5pdGlhbCBjbGlwYm9hcmQgY29udGVudCd9LCAnMCc6IHt0ZXh0OiB1bmRlZmluZWR9XG4gICAgICAgICAgc2V0IHRleHRDOiBcInwwMDBcIlxuICAgICAgICAgIGVuc3VyZSBcInkgd1wiLCByZWdpc3RlcjogJ1wiJzoge3RleHQ6IFwiMDAwXCJ9LCAnMCc6IHt0ZXh0OiBcIjAwMFwifVxuICAgICAgICAgIGVuc3VyZSBcInkgbFwiLCByZWdpc3RlcjogJ1wiJzoge3RleHQ6IFwiMFwifSwgJzAnOiB7dGV4dDogXCIwXCJ9XG5cbiAgICAgIGRlc2NyaWJlIFwiMS05IGFuZCBzbWFsbC1kZWxldGUoLSkgcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldCB0ZXh0QzogXCJ8MFxcbjFcXG4yXFxuM1xcbjRcXG41XFxuNlxcbjdcXG44XFxuOVxcbjEwXFxuXCJcblxuICAgICAgICBpdCBcImtlZXAgZGVsZXRlZCB0ZXh0XCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiZCBkXCIsXG4gICAgICAgICAgICB0ZXh0QzogIFwifDFcXG4yXFxuM1xcbjRcXG41XFxuNlxcbjdcXG44XFxuOVxcbjEwXFxuXCJcbiAgICAgICAgICAgIHJlZ2lzdGVyOlxuICAgICAgICAgICAgICAnXCInOiB7dGV4dDogJzBcXG4nfSwgICAgICctJzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICcxJzoge3RleHQ6ICcwXFxuJ30sICAgICAnMic6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMyc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnNCc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnNSc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnNic6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnNyc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnOCc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnOSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgIGVuc3VyZSBcIi5cIixcbiAgICAgICAgICAgIHRleHRDOiAgXCJ8MlxcbjNcXG40XFxuNVxcbjZcXG43XFxuOFxcbjlcXG4xMFxcblwiXG4gICAgICAgICAgICByZWdpc3RlcjpcbiAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICcxXFxuJ30sICAgICAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiAnMVxcbid9LCAgICAgJzInOiB7dGV4dDogJzBcXG4nfSwgJzMnOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICAgICAgJzQnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzUnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzYnOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICAgICAgJzcnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzgnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzknOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICBlbnN1cmUgXCIuXCIsXG4gICAgICAgICAgICB0ZXh0QzogIFwifDNcXG40XFxuNVxcbjZcXG43XFxuOFxcbjlcXG4xMFxcblwiXG4gICAgICAgICAgICByZWdpc3RlcjpcbiAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICcyXFxuJ30sICctJzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICcxJzoge3RleHQ6ICcyXFxuJ30sICcyJzoge3RleHQ6ICcxXFxuJ30sICczJzoge3RleHQ6ICcwXFxuJ30sXG4gICAgICAgICAgICAgICc0Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc1Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc2Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICc3Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc4Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc5Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLFxuICAgICAgICAgICAgdGV4dEM6ICBcInw0XFxuNVxcbjZcXG43XFxuOFxcbjlcXG4xMFxcblwiXG4gICAgICAgICAgICByZWdpc3RlcjpcbiAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICczXFxuJ30sICctJzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICcxJzoge3RleHQ6ICczXFxuJ30sICcyJzoge3RleHQ6ICcyXFxuJ30sICczJzoge3RleHQ6ICcxXFxuJ30sXG4gICAgICAgICAgICAgICc0Jzoge3RleHQ6ICcwXFxuJ30sICc1Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc2Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICc3Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc4Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc5Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLFxuICAgICAgICAgICAgdGV4dEM6ICBcInw1XFxuNlxcbjdcXG44XFxuOVxcbjEwXFxuXCJcbiAgICAgICAgICAgIHJlZ2lzdGVyOlxuICAgICAgICAgICAgICAnXCInOiB7dGV4dDogJzRcXG4nfSwgJy0nOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICAgICAgJzEnOiB7dGV4dDogJzRcXG4nfSwgICAgICcyJzoge3RleHQ6ICczXFxuJ30sICAgICAnMyc6IHt0ZXh0OiAnMlxcbid9LFxuICAgICAgICAgICAgICAnNCc6IHt0ZXh0OiAnMVxcbid9LCAgICAgJzUnOiB7dGV4dDogJzBcXG4nfSwgICAgICc2Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICc3Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc4Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc5Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLFxuICAgICAgICAgICAgdGV4dEM6ICBcInw2XFxuN1xcbjhcXG45XFxuMTBcXG5cIlxuICAgICAgICAgICAgcmVnaXN0ZXI6XG4gICAgICAgICAgICAgICdcIic6IHt0ZXh0OiAnNVxcbid9LCAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiAnNVxcbid9LCAgICAgJzInOiB7dGV4dDogJzRcXG4nfSwgICAgICczJzoge3RleHQ6ICczXFxuJ30sXG4gICAgICAgICAgICAgICc0Jzoge3RleHQ6ICcyXFxuJ30sICAgICAnNSc6IHt0ZXh0OiAnMVxcbid9LCAgICAgJzYnOiB7dGV4dDogJzBcXG4nfSxcbiAgICAgICAgICAgICAgJzcnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzgnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzknOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICBlbnN1cmUgXCIuXCIsXG4gICAgICAgICAgICB0ZXh0QzogIFwifDdcXG44XFxuOVxcbjEwXFxuXCJcbiAgICAgICAgICAgIHJlZ2lzdGVyOlxuICAgICAgICAgICAgICAnXCInOiB7dGV4dDogJzZcXG4nfSwgJy0nOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICAgICAgJzEnOiB7dGV4dDogJzZcXG4nfSwgJzInOiB7dGV4dDogJzVcXG4nfSwgICAgICczJzoge3RleHQ6ICc0XFxuJ30sXG4gICAgICAgICAgICAgICc0Jzoge3RleHQ6ICczXFxuJ30sICc1Jzoge3RleHQ6ICcyXFxuJ30sICAgICAnNic6IHt0ZXh0OiAnMVxcbid9LFxuICAgICAgICAgICAgICAnNyc6IHt0ZXh0OiAnMFxcbid9LCAnOCc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnOSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgIGVuc3VyZSBcIi5cIixcbiAgICAgICAgICAgIHRleHRDOiAgXCJ8OFxcbjlcXG4xMFxcblwiXG4gICAgICAgICAgICByZWdpc3RlcjpcbiAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICc3XFxuJ30sICctJzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICcxJzoge3RleHQ6ICc3XFxuJ30sICcyJzoge3RleHQ6ICc2XFxuJ30sICczJzoge3RleHQ6ICc1XFxuJ30sXG4gICAgICAgICAgICAgICc0Jzoge3RleHQ6ICc0XFxuJ30sICc1Jzoge3RleHQ6ICczXFxuJ30sICc2Jzoge3RleHQ6ICcyXFxuJ30sXG4gICAgICAgICAgICAgICc3Jzoge3RleHQ6ICcxXFxuJ30sICc4Jzoge3RleHQ6ICcwXFxuJ30sICc5Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgZW5zdXJlIFwiLlwiLFxuICAgICAgICAgICAgdGV4dEM6ICBcInw5XFxuMTBcXG5cIlxuICAgICAgICAgICAgcmVnaXN0ZXI6XG4gICAgICAgICAgICAgICdcIic6IHt0ZXh0OiAnOFxcbid9LCAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiAnOFxcbid9LCAnMic6IHt0ZXh0OiAnN1xcbid9LCAnMyc6IHt0ZXh0OiAnNlxcbid9LFxuICAgICAgICAgICAgICAnNCc6IHt0ZXh0OiAnNVxcbid9LCAnNSc6IHt0ZXh0OiAnNFxcbid9LCAnNic6IHt0ZXh0OiAnM1xcbid9LFxuICAgICAgICAgICAgICAnNyc6IHt0ZXh0OiAnMlxcbid9LCAnOCc6IHt0ZXh0OiAnMVxcbid9LCAnOSc6IHt0ZXh0OiAnMFxcbid9LFxuICAgICAgICAgIGVuc3VyZSBcIi5cIixcbiAgICAgICAgICAgIHRleHRDOiAgXCJ8MTBcXG5cIlxuICAgICAgICAgICAgcmVnaXN0ZXI6XG4gICAgICAgICAgICAgICdcIic6IHt0ZXh0OiAnOVxcbid9LCAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiAnOVxcbid9LCAnMic6IHt0ZXh0OiAnOFxcbid9LCAnMyc6IHt0ZXh0OiAnN1xcbid9LFxuICAgICAgICAgICAgICAnNCc6IHt0ZXh0OiAnNlxcbid9LCAnNSc6IHt0ZXh0OiAnNVxcbid9LCAnNic6IHt0ZXh0OiAnNFxcbid9LFxuICAgICAgICAgICAgICAnNyc6IHt0ZXh0OiAnM1xcbid9LCAnOCc6IHt0ZXh0OiAnMlxcbid9LCAnOSc6IHt0ZXh0OiAnMVxcbid9XG4gICAgICAgIGl0IFwiYWxzbyBrZWVwcyBjaGFuZ2VkIHRleHRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJjIGpcIixcbiAgICAgICAgICAgIHRleHRDOiAgXCJ8XFxuMlxcbjNcXG40XFxuNVxcbjZcXG43XFxuOFxcbjlcXG4xMFxcblwiXG4gICAgICAgICAgICByZWdpc3RlcjpcbiAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICcwXFxuMVxcbid9LCAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiAnMFxcbjFcXG4nfSwgJzInOiB7dGV4dDogdW5kZWZpbmVkfSwgJzMnOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICAgICAgJzQnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzUnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzYnOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICAgICAgJzcnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzgnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzknOiB7dGV4dDogdW5kZWZpbmVkfSxcblxuICAgICAgICBkZXNjcmliZSBcIndoaWNoIGdvZXMgdG8gbnVtYmVyZWQgYW5kIHdoaWNoIGdvZXMgdG8gc21hbGwtZGVsZXRlIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgICAgc2V0IHRleHRDOiBcInx7YWJjfVxcblwiXG5cbiAgICAgICAgICBpdCBcInNtYWxsLWNoYW5nZSBnb2VzIHRvIC0gcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSBcImMgJFwiLFxuICAgICAgICAgICAgICB0ZXh0QzogXCJ8XFxuXCJcbiAgICAgICAgICAgICAgcmVnaXN0ZXI6XG4gICAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICd7YWJjfSd9LCAnLSc6IHt0ZXh0OiAne2FiY30nfSxcbiAgICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMic6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMyc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAgICc0Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc1Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc2Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICAgJzcnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzgnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzknOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICBpdCBcInNtYWxsLWRlbGV0ZSBnb2VzIHRvIC0gcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgICAgIGVuc3VyZSBcImQgJFwiLFxuICAgICAgICAgICAgICB0ZXh0QzogXCJ8XFxuXCJcbiAgICAgICAgICAgICAgcmVnaXN0ZXI6XG4gICAgICAgICAgICAgICAgJ1wiJzoge3RleHQ6ICd7YWJjfSd9LCAnLSc6IHt0ZXh0OiAne2FiY30nfSxcbiAgICAgICAgICAgICAgICAnMSc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMic6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMyc6IHt0ZXh0OiB1bmRlZmluZWR9LFxuICAgICAgICAgICAgICAgICc0Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc1Jzoge3RleHQ6IHVuZGVmaW5lZH0sICc2Jzoge3RleHQ6IHVuZGVmaW5lZH0sXG4gICAgICAgICAgICAgICAgJzcnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzgnOiB7dGV4dDogdW5kZWZpbmVkfSwgJzknOiB7dGV4dDogdW5kZWZpbmVkfSxcbiAgICAgICAgICBpdCBcIltleGNlcHRpb25dICUgbW90aW9uIGFsd2F5cyBzYXZlIHRvIG51bWJlcmVkXCIsIC0+XG4gICAgICAgICAgICBzZXQgdGV4dEM6IFwifHthYmN9XFxuXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImQgJVwiLCB0ZXh0QzogXCJ8XFxuXCIsIHJlZ2lzdGVyOiB7J1wiJzoge3RleHQ6ICd7YWJjfSd9LCAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMSc6IHt0ZXh0OiAne2FiY30nfSwgJzInOiB7dGV4dDogdW5kZWZpbmVkfX1cbiAgICAgICAgICBpdCBcIltleGNlcHRpb25dIC8gbW90aW9uIGFsd2F5cyBzYXZlIHRvIG51bWJlcmVkXCIsIC0+XG4gICAgICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGF0b20ud29ya3NwYWNlLmdldEVsZW1lbnQoKSlcbiAgICAgICAgICAgIHNldCB0ZXh0QzogXCJ8e2FiY31cXG5cIlxuICAgICAgICAgICAgZW5zdXJlIFwiZCAvIH0gZW50ZXJcIixcbiAgICAgICAgICAgICAgdGV4dEM6IFwifH1cXG5cIixcbiAgICAgICAgICAgICAgcmVnaXN0ZXI6IHsnXCInOiB7dGV4dDogJ3thYmMnfSwgJy0nOiB7dGV4dDogdW5kZWZpbmVkfSwgJzEnOiB7dGV4dDogJ3thYmMnfSwgJzInOiB7dGV4dDogdW5kZWZpbmVkfX1cblxuICAgICAgICAgIGl0IFwiLywgbiBtb3Rpb24gYWx3YXlzIHNhdmUgdG8gbnVtYmVyZWRcIiwgLT5cbiAgICAgICAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oYXRvbS53b3Jrc3BhY2UuZ2V0RWxlbWVudCgpKVxuICAgICAgICAgICAgc2V0IHRleHRDOiBcInxhYmMgYXh4IGFiY1xcblwiXG4gICAgICAgICAgICBlbnN1cmUgXCJkIC8gYSBlbnRlclwiLFxuICAgICAgICAgICAgICB0ZXh0QzogXCJ8YXh4IGFiY1xcblwiLFxuICAgICAgICAgICAgICByZWdpc3RlcjogeydcIic6IHt0ZXh0OiAnYWJjICd9LCAnLSc6IHt0ZXh0OiB1bmRlZmluZWR9LCAnMSc6IHt0ZXh0OiAnYWJjICd9LCAnMic6IHt0ZXh0OiB1bmRlZmluZWR9fVxuICAgICAgICAgICAgZW5zdXJlIFwiZCBuXCIsXG4gICAgICAgICAgICAgIHRleHRDOiBcInxhYmNcXG5cIixcbiAgICAgICAgICAgICAgcmVnaXN0ZXI6IHsnXCInOiB7dGV4dDogJ2F4eCAnfSwgJy0nOiB7dGV4dDogdW5kZWZpbmVkfSwgJzEnOiB7dGV4dDogJ2F4eCAnfSwgJzInOiB7dGV4dDogJ2FiYyAnfX1cbiAgICAgICAgICBpdCBcIj8sIE4gbW90aW9uIGFsd2F5cyBzYXZlIHRvIG51bWJlcmVkXCIsIC0+XG4gICAgICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGF0b20ud29ya3NwYWNlLmdldEVsZW1lbnQoKSlcbiAgICAgICAgICAgIHNldCB0ZXh0QzogXCJhYmMgYXh4IHxhYmNcXG5cIlxuICAgICAgICAgICAgZW5zdXJlIFwiZCA/IGEgZW50ZXJcIixcbiAgICAgICAgICAgICAgdGV4dEM6IFwiYWJjIHxhYmNcXG5cIixcbiAgICAgICAgICAgICAgcmVnaXN0ZXI6IHsnXCInOiB7dGV4dDogJ2F4eCAnfSwgJy0nOiB7dGV4dDogdW5kZWZpbmVkfSwgJzEnOiB7dGV4dDogJ2F4eCAnfSwgJzInOiB7dGV4dDogdW5kZWZpbmVkfX1cbiAgICAgICAgICAgIGVuc3VyZSBcIjBcIixcbiAgICAgICAgICAgICAgdGV4dEM6IFwifGFiYyBhYmNcXG5cIixcbiAgICAgICAgICAgIGVuc3VyZSBcImMgTlwiLFxuICAgICAgICAgICAgICB0ZXh0QzogXCJ8YWJjXFxuXCIsXG4gICAgICAgICAgICAgIHJlZ2lzdGVyOiB7J1wiJzoge3RleHQ6ICdhYmMgJ30sICctJzoge3RleHQ6IHVuZGVmaW5lZH0sICcxJzoge3RleHQ6ICdhYmMgJ30sICcyJzoge3RleHQ6IFwiYXh4IFwifX1cblxuICAgIGRlc2NyaWJlIFwidGhlIGN0cmwtciBjb21tYW5kIGluIGluc2VydCBtb2RlXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldCByZWdpc3RlcjogJ1wiJzogdGV4dDogJzM0NSdcbiAgICAgICAgc2V0IHJlZ2lzdGVyOiAnYSc6IHRleHQ6ICdhYmMnXG4gICAgICAgIHNldCByZWdpc3RlcjogJyonOiB0ZXh0OiAnYWJjJ1xuICAgICAgICBhdG9tLmNsaXBib2FyZC53cml0ZSBcImNsaXBcIlxuICAgICAgICBzZXQgdGV4dDogXCIwMTJcXG5cIiwgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgZW5zdXJlICdpJywgbW9kZTogJ2luc2VydCdcblxuICAgICAgZGVzY3JpYmUgXCJ1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlciA9IHRydWVcIiwgLT5cbiAgICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAgIHNldHRpbmdzLnNldCAndXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXInLCB0cnVlXG4gICAgICAgICAgc2V0IHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMzQ1J1xuICAgICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlIFwiY2xpcFwiXG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIGNvbnRlbnRzIGZyb20gY2xpcGJvYXJkIHdpdGggXFxcIlwiLCAtPlxuICAgICAgICAgIGVuc3VyZSAnY3RybC1yIFwiJywgdGV4dDogJzAxY2xpcDJcXG4nXG5cbiAgICAgIGRlc2NyaWJlIFwidXNlQ2xpcGJvYXJkQXNEZWZhdWx0UmVnaXN0ZXIgPSBmYWxzZVwiLCAtPlxuICAgICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgICAgc2V0dGluZ3Muc2V0ICd1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlcicsIGZhbHNlXG4gICAgICAgICAgc2V0IHJlZ2lzdGVyOiAnXCInOiB0ZXh0OiAnMzQ1J1xuICAgICAgICAgIGF0b20uY2xpcGJvYXJkLndyaXRlIFwiY2xpcFwiXG5cbiAgICAgICAgaXQgXCJpbnNlcnRzIGNvbnRlbnRzIGZyb20gXFxcIiB3aXRoIFxcXCJcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgJ2N0cmwtciBcIicsIHRleHQ6ICcwMTM0NTJcXG4nXG5cbiAgICAgIGl0IFwiaW5zZXJ0cyBjb250ZW50cyBvZiB0aGUgJ2EnIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgIGVuc3VyZSAnY3RybC1yIGEnLCB0ZXh0OiAnMDFhYmMyXFxuJ1xuXG4gICAgICBpdCBcImlzIGNhbmNlbGxlZCB3aXRoIHRoZSBlc2NhcGUga2V5XCIsIC0+XG4gICAgICAgIGVuc3VyZSAnY3RybC1yIGVzY2FwZScsXG4gICAgICAgICAgdGV4dDogJzAxMlxcbidcbiAgICAgICAgICBtb2RlOiAnaW5zZXJ0J1xuICAgICAgICAgIGN1cnNvcjogWzAsIDJdXG5cbiAgICBkZXNjcmliZSBcInBlciBzZWxlY3Rpb24gY2xpcGJvYXJkXCIsIC0+XG4gICAgICBlbnN1cmVQZXJTZWxlY3Rpb25SZWdpc3RlciA9ICh0ZXh0cy4uLikgLT5cbiAgICAgICAgZm9yIHNlbGVjdGlvbiwgaSBpbiBlZGl0b3IuZ2V0U2VsZWN0aW9ucygpXG4gICAgICAgICAgZW5zdXJlIHJlZ2lzdGVyOiAnKic6IHt0ZXh0OiB0ZXh0c1tpXSwgc2VsZWN0aW9uOiBzZWxlY3Rpb259XG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0ICd1c2VDbGlwYm9hcmRBc0RlZmF1bHRSZWdpc3RlcicsIHRydWVcbiAgICAgICAgc2V0XG4gICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwMTI6XG4gICAgICAgICAgICBhYmM6XG4gICAgICAgICAgICBkZWY6XFxuXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgICAgICBjdXJzb3I6IFtbMCwgMV0sIFsxLCAxXSwgWzIsIDFdXVxuXG4gICAgICBkZXNjcmliZSBcIm9uIHNlbGVjdGlvbiBkZXN0cm95ZVwiLCAtPlxuICAgICAgICBpdCBcInJlbW92ZSBjb3JyZXNwb25kaW5nIHN1YnNjcmlwdGluIGFuZCBjbGlwYm9hcmQgZW50cnlcIiwgLT5cbiAgICAgICAgICB7Y2xpcGJvYXJkQnlTZWxlY3Rpb24sIHN1YnNjcmlwdGlvbkJ5U2VsZWN0aW9ufSA9IHZpbVN0YXRlLnJlZ2lzdGVyXG4gICAgICAgICAgZXhwZWN0KGNsaXBib2FyZEJ5U2VsZWN0aW9uLnNpemUpLnRvQmUoMClcbiAgICAgICAgICBleHBlY3Qoc3Vic2NyaXB0aW9uQnlTZWxlY3Rpb24uc2l6ZSkudG9CZSgwKVxuXG4gICAgICAgICAga2V5c3Ryb2tlIFwieSBpIHdcIlxuICAgICAgICAgIGVuc3VyZVBlclNlbGVjdGlvblJlZ2lzdGVyKCcwMTInLCAnYWJjJywgJ2RlZicpXG5cbiAgICAgICAgICBleHBlY3QoY2xpcGJvYXJkQnlTZWxlY3Rpb24uc2l6ZSkudG9CZSgzKVxuICAgICAgICAgIGV4cGVjdChzdWJzY3JpcHRpb25CeVNlbGVjdGlvbi5zaXplKS50b0JlKDMpXG4gICAgICAgICAgc2VsZWN0aW9uLmRlc3Ryb3koKSBmb3Igc2VsZWN0aW9uIGluIGVkaXRvci5nZXRTZWxlY3Rpb25zKClcbiAgICAgICAgICBleHBlY3QoY2xpcGJvYXJkQnlTZWxlY3Rpb24uc2l6ZSkudG9CZSgwKVxuICAgICAgICAgIGV4cGVjdChzdWJzY3JpcHRpb25CeVNlbGVjdGlvbi5zaXplKS50b0JlKDApXG5cbiAgICAgIGRlc2NyaWJlIFwiWWFua1wiLCAtPlxuICAgICAgICBpdCBcInNhdmUgdGV4dCB0byBwZXIgc2VsZWN0aW9uIHJlZ2lzdGVyXCIsIC0+XG4gICAgICAgICAga2V5c3Ryb2tlIFwieSBpIHdcIlxuICAgICAgICAgIGVuc3VyZVBlclNlbGVjdGlvblJlZ2lzdGVyKCcwMTInLCAnYWJjJywgJ2RlZicpXG5cbiAgICAgIGRlc2NyaWJlIFwiRGVsZXRlIGZhbWlseVwiLCAtPlxuICAgICAgICBpdCBcImRcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJkIGkgd1wiLCB0ZXh0OiBcIjpcXG46XFxuOlxcblwiXG4gICAgICAgICAgZW5zdXJlUGVyU2VsZWN0aW9uUmVnaXN0ZXIoJzAxMicsICdhYmMnLCAnZGVmJylcbiAgICAgICAgaXQgXCJ4XCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwieFwiLCB0ZXh0OiBcIjAyOlxcbmFjOlxcbmRmOlxcblwiXG4gICAgICAgICAgZW5zdXJlUGVyU2VsZWN0aW9uUmVnaXN0ZXIoJzEnLCAnYicsICdlJylcbiAgICAgICAgaXQgXCJYXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiWFwiLCB0ZXh0OiBcIjEyOlxcbmJjOlxcbmVmOlxcblwiXG4gICAgICAgICAgZW5zdXJlUGVyU2VsZWN0aW9uUmVnaXN0ZXIoJzAnLCAnYScsICdkJylcbiAgICAgICAgaXQgXCJEXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiRFwiLCB0ZXh0OiBcIjBcXG5hXFxuZFxcblwiXG4gICAgICAgICAgZW5zdXJlUGVyU2VsZWN0aW9uUmVnaXN0ZXIoJzEyOicsICdiYzonLCAnZWY6JylcblxuICAgICAgZGVzY3JpYmUgXCJQdXQgZmFtaWx5XCIsIC0+XG4gICAgICAgIGl0IFwicCBwYXN0ZSB0ZXh0IGZyb20gcGVyIHNlbGVjdGlvbiByZWdpc3RlclwiLCAtPlxuICAgICAgICAgIGVuc3VyZSBcInkgaSB3ICQgcFwiLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIDAxMjowMTJcbiAgICAgICAgICAgICAgYWJjOmFiY1xuICAgICAgICAgICAgICBkZWY6ZGVmXFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBpdCBcIlAgcGFzdGUgdGV4dCBmcm9tIHBlciBzZWxlY3Rpb24gcmVnaXN0ZXJcIiwgLT5cbiAgICAgICAgICBlbnN1cmUgXCJ5IGkgdyAkIFBcIixcbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgICAwMTIwMTI6XG4gICAgICAgICAgICAgIGFiY2FiYzpcbiAgICAgICAgICAgICAgZGVmZGVmOlxcblxuICAgICAgICAgICAgICBcIlwiXCJcbiAgICAgIGRlc2NyaWJlIFwiY3RybC1yIGluIGluc2VydCBtb2RlXCIsIC0+XG4gICAgICAgIGl0IFwiaW5zZXJ0IGZyb20gcGVyIHNlbGVjdGlvbiByZWdpc3RlXCIsIC0+XG4gICAgICAgICAgZW5zdXJlIFwiZCBpIHdcIiwgdGV4dDogXCI6XFxuOlxcbjpcXG5cIlxuICAgICAgICAgIGVuc3VyZSAnYScsIG1vZGU6ICdpbnNlcnQnXG4gICAgICAgICAgZW5zdXJlICdjdHJsLXIgXCInLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAgIDowMTJcbiAgICAgICAgICAgICAgOmFiY1xuICAgICAgICAgICAgICA6ZGVmXFxuXG4gICAgICAgICAgICAgIFwiXCJcIlxuXG4gIGRlc2NyaWJlIFwiQ291bnQgbW9kaWZpZXJcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCIwMDAgMTExIDIyMiAzMzMgNDQ0IDU1NSA2NjYgNzc3IDg4OCA5OTlcIlxuICAgICAgICBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgXCJyZXBlYXQgb3BlcmF0b3JcIiwgLT5cbiAgICAgIGVuc3VyZSAnMyBkIHcnLCB0ZXh0OiBcIjMzMyA0NDQgNTU1IDY2NiA3NzcgODg4IDk5OVwiXG4gICAgaXQgXCJyZXBlYXQgbW90aW9uXCIsIC0+XG4gICAgICBlbnN1cmUgJ2QgMiB3JywgdGV4dDogXCIyMjIgMzMzIDQ0NCA1NTUgNjY2IDc3NyA4ODggOTk5XCJcbiAgICBpdCBcInJlcGVhdCBvcGVyYXRvciBhbmQgbW90aW9uIHJlc3BlY3RpdmVseVwiLCAtPlxuICAgICAgZW5zdXJlICczIGQgMiB3JywgdGV4dDogXCI2NjYgNzc3IDg4OCA5OTlcIlxuIl19
