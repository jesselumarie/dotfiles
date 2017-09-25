(function() {
  var TextData, dispatch, getVimState, ref, settings;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData;

  settings = require('../lib/settings');

  describe("Motion Find", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      settings.set('useExperimentalFasterInput', true);
      return getVimState(function(state, _vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = _vim.set, ensure = _vim.ensure, keystroke = _vim.keystroke, _vim;
      });
    });
    xdescribe('the f performance', function() {
      var measureWithPerformanceNow, measureWithTimeEnd, timesToExecute;
      timesToExecute = 500;
      measureWithTimeEnd = function(fn) {
        console.time(fn.name);
        fn();
        return console.timeEnd(fn.name);
      };
      measureWithPerformanceNow = function(fn) {
        var t0, t1;
        t0 = performance.now();
        fn();
        t1 = performance.now();
        return console.log("[performance.now] took " + (t1 - t0) + " msec");
      };
      beforeEach(function() {
        return set({
          text: "  " + "l".repeat(timesToExecute),
          cursor: [0, 0]
        });
      });
      xdescribe('the f read-char-via-keybinding performance', function() {
        beforeEach(function() {
          return vimState.useMiniEditor = false;
        });
        return it('[with keybind] moves to l char', function() {
          var testPerformanceOfKeybind;
          testPerformanceOfKeybind = function() {
            var i, n, ref2;
            for (n = i = 1, ref2 = timesToExecute; 1 <= ref2 ? i <= ref2 : i >= ref2; n = 1 <= ref2 ? ++i : --i) {
              keystroke("f l");
            }
            return ensure({
              cursor: [0, timesToExecute + 1]
            });
          };
          console.log("== keybind");
          ensure("f l", {
            cursor: [0, 2]
          });
          set({
            cursor: [0, 0]
          });
          return measureWithTimeEnd(testPerformanceOfKeybind);
        });
      });
      return describe('[with hidden-input] moves to l char', function() {
        return it('[with hidden-input] moves to l char', function() {
          var testPerformanceOfHiddenInput;
          testPerformanceOfHiddenInput = function() {
            var i, n, ref2;
            for (n = i = 1, ref2 = timesToExecute; 1 <= ref2 ? i <= ref2 : i >= ref2; n = 1 <= ref2 ? ++i : --i) {
              keystroke('f l');
            }
            return ensure({
              cursor: [0, timesToExecute + 1]
            });
          };
          console.log("== hidden");
          ensure('f l', {
            cursor: [0, 2]
          });
          set({
            cursor: [0, 0]
          });
          return measureWithTimeEnd(testPerformanceOfHiddenInput);
        });
      });
    });
    describe('the f/F keybindings', function() {
      beforeEach(function() {
        return set({
          text: "abcabcabcabc\n",
          cursor: [0, 0]
        });
      });
      it('moves to the first specified character it finds', function() {
        return ensure('f c', {
          cursor: [0, 2]
        });
      });
      it('extends visual selection in visual-mode and repetable', function() {
        ensure('v', {
          mode: ['visual', 'characterwise']
        });
        ensure('f c', {
          selectedText: 'abc',
          cursor: [0, 3]
        });
        ensure(';', {
          selectedText: 'abcabc',
          cursor: [0, 6]
        });
        return ensure(',', {
          selectedText: 'abc',
          cursor: [0, 3]
        });
      });
      it('moves backwards to the first specified character it finds', function() {
        set({
          cursor: [0, 2]
        });
        return ensure('F a', {
          cursor: [0, 0]
        });
      });
      it('respects count forward', function() {
        return ensure('2 f a', {
          cursor: [0, 6]
        });
      });
      it('respects count backward', function() {
        ({
          cursor: [0, 6]
        });
        return ensure('2 F a', {
          cursor: [0, 0]
        });
      });
      it("doesn't move if the character specified isn't found", function() {
        return ensure('f d', {
          cursor: [0, 0]
        });
      });
      it("doesn't move if there aren't the specified count of the specified character", function() {
        ensure('1 0 f a', {
          cursor: [0, 0]
        });
        ensure('1 1 f a', {
          cursor: [0, 0]
        });
        set({
          cursor: [0, 6]
        });
        ensure('1 0 F a', {
          cursor: [0, 6]
        });
        return ensure('1 1 F a', {
          cursor: [0, 6]
        });
      });
      it("composes with d", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d 2 f a', {
          text: 'abcbc\n'
        });
      });
      return it("F behaves exclusively when composes with operator", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d F a', {
          text: 'abcabcabc\n'
        });
      });
    });
    describe("cancellation", function() {
      return it("keeps multiple-cursors when cancelled", function() {
        set({
          textC: "|   a\n!   a\n|   a\n"
        });
        return ensure("f escape", {
          textC: "|   a\n!   a\n|   a\n"
        });
      });
    });
    describe('the t/T keybindings', function() {
      beforeEach(function() {
        return set({
          text: "abcabcabcabc\n",
          cursor: [0, 0]
        });
      });
      it('moves to the character previous to the first specified character it finds', function() {
        ensure('t a', {
          cursor: [0, 2]
        });
        return ensure('t a', {
          cursor: [0, 2]
        });
      });
      it('moves backwards to the character after the first specified character it finds', function() {
        set({
          cursor: [0, 2]
        });
        return ensure('T a', {
          cursor: [0, 1]
        });
      });
      it('respects count forward', function() {
        return ensure('2 t a', {
          cursor: [0, 5]
        });
      });
      it('respects count backward', function() {
        set({
          cursor: [0, 6]
        });
        return ensure('2 T a', {
          cursor: [0, 1]
        });
      });
      it("doesn't move if the character specified isn't found", function() {
        return ensure('t d', {
          cursor: [0, 0]
        });
      });
      it("doesn't move if there aren't the specified count of the specified character", function() {
        ensure('1 0 t d', {
          cursor: [0, 0]
        });
        ensure('1 1 t a', {
          cursor: [0, 0]
        });
        set({
          cursor: [0, 6]
        });
        ensure('1 0 T a', {
          cursor: [0, 6]
        });
        return ensure('1 1 T a', {
          cursor: [0, 6]
        });
      });
      it("composes with d", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d 2 t b', {
          text: 'abcbcabc\n'
        });
      });
      it("delete char under cursor even when no movement happens since it's inclusive motion", function() {
        set({
          cursor: [0, 0]
        });
        return ensure('d t b', {
          text: 'bcabcabcabc\n'
        });
      });
      it("do nothing when inclusiveness inverted by v operator-modifier", function() {
        ({
          text: "abcabcabcabc\n"
        });
        set({
          cursor: [0, 0]
        });
        return ensure('d v t b', {
          text: 'abcabcabcabc\n'
        });
      });
      it("T behaves exclusively when composes with operator", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d T b', {
          text: 'ababcabcabc\n'
        });
      });
      return it("T don't delete character under cursor even when no movement happens", function() {
        set({
          cursor: [0, 3]
        });
        return ensure('d T c', {
          text: 'abcabcabcabc\n'
        });
      });
    });
    describe('the ; and , keybindings', function() {
      beforeEach(function() {
        return set({
          text: "abcabcabcabc\n",
          cursor: [0, 0]
        });
      });
      it("repeat f in same direction", function() {
        ensure('f c', {
          cursor: [0, 2]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(';', {
          cursor: [0, 8]
        });
      });
      it("repeat F in same direction", function() {
        set({
          cursor: [0, 10]
        });
        ensure('F c', {
          cursor: [0, 8]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(';', {
          cursor: [0, 2]
        });
      });
      it("repeat f in opposite direction", function() {
        set({
          cursor: [0, 6]
        });
        ensure('f c', {
          cursor: [0, 8]
        });
        ensure(',', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 2]
        });
      });
      it("repeat F in opposite direction", function() {
        set({
          cursor: [0, 4]
        });
        ensure('F c', {
          cursor: [0, 2]
        });
        ensure(',', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 8]
        });
      });
      it("alternate repeat f in same direction and reverse", function() {
        ensure('f c', {
          cursor: [0, 2]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 2]
        });
      });
      it("alternate repeat F in same direction and reverse", function() {
        set({
          cursor: [0, 10]
        });
        ensure('F c', {
          cursor: [0, 8]
        });
        ensure(';', {
          cursor: [0, 5]
        });
        return ensure(',', {
          cursor: [0, 8]
        });
      });
      it("repeat t in same direction", function() {
        ensure('t c', {
          cursor: [0, 1]
        });
        return ensure(';', {
          cursor: [0, 4]
        });
      });
      it("repeat T in same direction", function() {
        set({
          cursor: [0, 10]
        });
        ensure('T c', {
          cursor: [0, 9]
        });
        return ensure(';', {
          cursor: [0, 6]
        });
      });
      it("repeat t in opposite direction first, and then reverse", function() {
        set({
          cursor: [0, 3]
        });
        ensure('t c', {
          cursor: [0, 4]
        });
        ensure(',', {
          cursor: [0, 3]
        });
        return ensure(';', {
          cursor: [0, 4]
        });
      });
      it("repeat T in opposite direction first, and then reverse", function() {
        set({
          cursor: [0, 4]
        });
        ensure('T c', {
          cursor: [0, 3]
        });
        ensure(',', {
          cursor: [0, 4]
        });
        return ensure(';', {
          cursor: [0, 3]
        });
      });
      it("repeat with count in same direction", function() {
        set({
          cursor: [0, 0]
        });
        ensure('f c', {
          cursor: [0, 2]
        });
        return ensure('2 ;', {
          cursor: [0, 8]
        });
      });
      return it("repeat with count in reverse direction", function() {
        set({
          cursor: [0, 6]
        });
        ensure('f c', {
          cursor: [0, 8]
        });
        return ensure('2 ,', {
          cursor: [0, 2]
        });
      });
    });
    describe("last find/till is repeatable on other editor", function() {
      var other, otherEditor, pane, ref2;
      ref2 = [], other = ref2[0], otherEditor = ref2[1], pane = ref2[2];
      beforeEach(function() {
        return getVimState(function(otherVimState, _other) {
          set({
            text: "a baz bar\n",
            cursor: [0, 0]
          });
          other = _other;
          other.set({
            text: "foo bar baz",
            cursor: [0, 0]
          });
          otherEditor = otherVimState.editor;
          pane = atom.workspace.getActivePane();
          return pane.activateItem(editor);
        });
      });
      it("shares the most recent find/till command with other editors", function() {
        ensure('f b', {
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 0]
        });
        pane.activateItem(otherEditor);
        other.keystroke(';');
        ensure({
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 4]
        });
        other.keystroke('t r');
        ensure({
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 5]
        });
        pane.activateItem(editor);
        ensure(';', {
          cursor: [0, 7]
        });
        return other.ensure({
          cursor: [0, 5]
        });
      });
      return it("is still repeatable after original editor was destroyed", function() {
        ensure('f b', {
          cursor: [0, 2]
        });
        other.ensure({
          cursor: [0, 0]
        });
        pane.activateItem(otherEditor);
        editor.destroy();
        expect(editor.isAlive()).toBe(false);
        other.ensure(';', {
          cursor: [0, 4]
        });
        other.ensure(';', {
          cursor: [0, 8]
        });
        return other.ensure(',', {
          cursor: [0, 4]
        });
      });
    });
    return describe("vmp unique feature of `f` family", function() {
      describe("ignoreCaseForFind", function() {
        beforeEach(function() {
          return settings.set("ignoreCaseForFind", true);
        });
        return it("ignore case to find", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f a", {
            textC: "    |A    ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    ab    |a    Ab    a"
          });
          return ensure(";", {
            textC: "    A    ab    a    |Ab    a"
          });
        });
      });
      describe("useSmartcaseForFind", function() {
        beforeEach(function() {
          return settings.set("useSmartcaseForFind", true);
        });
        it("ignore case when input is lower char", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f a", {
            textC: "    |A    ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure(";", {
            textC: "    A    ab    |a    Ab    a"
          });
          return ensure(";", {
            textC: "    A    ab    a    |Ab    a"
          });
        });
        return it("find case-sensitively when input is lager char", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f A", {
            textC: "    |A    ab    a    Ab    a"
          });
          ensure("f A", {
            textC: "    A    ab    a    |Ab    a"
          });
          ensure(",", {
            textC: "    |A    ab    a    Ab    a"
          });
          return ensure(";", {
            textC: "    A    ab    a    |Ab    a"
          });
        });
      });
      describe("reuseFindForRepeatFind", function() {
        beforeEach(function() {
          return settings.set("reuseFindForRepeatFind", true);
        });
        it("can reuse f and t as ;, F and T as ',' respectively", function() {
          set({
            textC: "|    A    ab    a    Ab    a"
          });
          ensure("f a", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure("f", {
            textC: "    A    ab    |a    Ab    a"
          });
          ensure("f", {
            textC: "    A    ab    a    Ab    |a"
          });
          ensure("F", {
            textC: "    A    ab    |a    Ab    a"
          });
          ensure("F", {
            textC: "    A    |ab    a    Ab    a"
          });
          ensure("t", {
            textC: "    A    ab   | a    Ab    a"
          });
          ensure("t", {
            textC: "    A    ab    a    Ab   | a"
          });
          ensure("T", {
            textC: "    A    ab    a|    Ab    a"
          });
          return ensure("T", {
            textC: "    A    a|b    a    Ab    a"
          });
        });
        return it("behave as normal f if no successful previous find was exists", function() {
          set({
            textC: "  |  A    ab    a    Ab    a"
          });
          ensure("f escape", {
            textC: "  |  A    ab    a    Ab    a"
          });
          expect(vimState.globalState.get("currentFind")).toBeNull();
          ensure("f a", {
            textC: "    A    |ab    a    Ab    a"
          });
          return expect(vimState.globalState.get("currentFind")).toBeTruthy();
        });
      });
      describe("findAcrossLines", function() {
        beforeEach(function() {
          return settings.set("findAcrossLines", true);
        });
        return it("searches across multiple lines", function() {
          set({
            textC: "|0:    a    a\n1:    a    a\n2:    a    a\n"
          });
          ensure("f a", {
            textC: "0:    |a    a\n1:    a    a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    |a\n1:    a    a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    a\n1:    |a    a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    a\n1:    a    |a\n2:    a    a\n"
          });
          ensure(";", {
            textC: "0:    a    a\n1:    a    a\n2:    |a    a\n"
          });
          ensure("F a", {
            textC: "0:    a    a\n1:    a    |a\n2:    a    a\n"
          });
          ensure("t a", {
            textC: "0:    a    a\n1:    a    a\n2:   | a    a\n"
          });
          ensure("T a", {
            textC: "0:    a    a\n1:    a    |a\n2:    a    a\n"
          });
          return ensure("T a", {
            textC: "0:    a    a\n1:    a|    a\n2:    a    a\n"
          });
        });
      });
      describe("find-next/previous-pre-confirmed", function() {
        beforeEach(function() {
          settings.set("findCharsMax", 10);
          return jasmine.attachToDOM(atom.workspace.getElement());
        });
        return describe("can find one or two char", function() {
          it("adjust to next-pre-confirmed", function() {
            var element;
            set({
              textC: "|    a    ab    a    cd    a"
            });
            keystroke("f a ");
            element = vimState.inputEditor.element;
            dispatch(element, "vim-mode-plus:find-next-pre-confirmed");
            dispatch(element, "vim-mode-plus:find-next-pre-confirmed");
            return ensure("enter", {
              textC: "    a    ab    |a    cd    a"
            });
          });
          it("adjust to previous-pre-confirmed", function() {
            var element;
            set({
              textC: "|    a    ab    a    cd    a"
            });
            ensure("3 f a enter", {
              textC: "    a    ab    |a    cd    a"
            });
            set({
              textC: "|    a    ab    a    cd    a"
            });
            keystroke("3 f a");
            element = vimState.inputEditor.element;
            dispatch(element, "vim-mode-plus:find-previous-pre-confirmed");
            dispatch(element, "vim-mode-plus:find-previous-pre-confirmed");
            return ensure("enter", {
              textC: "    |a    ab    a    cd    a"
            });
          });
          return it("is useful to skip earlier spot interactivelly", function() {
            var element;
            set({
              textC: 'text = "this is |\"example\" of use case"'
            });
            keystroke('c t "');
            element = vimState.inputEditor.element;
            dispatch(element, "vim-mode-plus:find-next-pre-confirmed");
            dispatch(element, "vim-mode-plus:find-next-pre-confirmed");
            return ensure("enter", {
              textC: 'text = "this is |"',
              mode: "insert"
            });
          });
        });
      });
      return describe("findCharsMax", function() {
        beforeEach(function() {
          return jasmine.attachToDOM(atom.workspace.getElement());
        });
        describe("with 2 length", function() {
          beforeEach(function() {
            return settings.set("findCharsMax", 2);
          });
          return describe("can find one or two char", function() {
            it("can find by two char", function() {
              set({
                textC: "|    a    ab    a    cd    a"
              });
              ensure("f a b", {
                textC: "    a    |ab    a    cd    a"
              });
              return ensure("f c d", {
                textC: "    a    ab    a    |cd    a"
              });
            });
            return it("can find by one-char by confirming explicitly", function() {
              set({
                textC: "|    a    ab    a    cd    a"
              });
              ensure("f a enter", {
                textC: "    |a    ab    a    cd    a"
              });
              return ensure("f c enter", {
                textC: "    a    ab    a    |cd    a"
              });
            });
          });
        });
        describe("with 3 length", function() {
          beforeEach(function() {
            return settings.set("findCharsMax", 3);
          });
          return describe("can find 3 at maximum", function() {
            return it("can find by one or two or three char", function() {
              set({
                textC: "|    a    ab    a    cd    efg"
              });
              ensure("f a b enter", {
                textC: "    a    |ab    a    cd    efg"
              });
              ensure("f a enter", {
                textC: "    a    ab    |a    cd    efg"
              });
              ensure("f c d enter", {
                textC: "    a    ab    a    |cd    efg"
              });
              return ensure("f e f g", {
                textC: "    a    ab    a    cd    |efg"
              });
            });
          });
        });
        return describe("autoConfirmTimeout", function() {
          beforeEach(function() {
            settings.set("findCharsMax", 2);
            return settings.set("findConfirmByTimeout", 500);
          });
          return it("auto-confirm single-char input on timeout", function() {
            set({
              textC: "|    a    ab    a    cd    a"
            });
            ensure("f a", {
              textC: "|    a    ab    a    cd    a"
            });
            advanceClock(500);
            ensure({
              textC: "    |a    ab    a    cd    a"
            });
            ensure("f c d", {
              textC: "    a    ab    a    |cd    a"
            });
            ensure("f a", {
              textC: "    a    ab    a    |cd    a"
            });
            advanceClock(500);
            ensure({
              textC: "    a    ab    a    cd    |a"
            });
            ensure("F b", {
              textC: "    a    ab    a    cd    |a"
            });
            advanceClock(500);
            return ensure({
              textC: "    a    a|b    a    cd    a"
            });
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvbW90aW9uLWZpbmQtc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQW9DLE9BQUEsQ0FBUSxlQUFSLENBQXBDLEVBQUMsNkJBQUQsRUFBYyx1QkFBZCxFQUF3Qjs7RUFDeEIsUUFBQSxHQUFXLE9BQUEsQ0FBUSxpQkFBUjs7RUFFWCxRQUFBLENBQVMsYUFBVCxFQUF3QixTQUFBO0FBQ3RCLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7TUFDVCxRQUFRLENBQUMsR0FBVCxDQUFhLDRCQUFiLEVBQTJDLElBQTNDO2FBR0EsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLElBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO2VBQ1IsY0FBRCxFQUFNLG9CQUFOLEVBQWMsMEJBQWQsRUFBMkI7TUFIakIsQ0FBWjtJQUpTLENBQVg7SUFTQSxTQUFBLENBQVUsbUJBQVYsRUFBK0IsU0FBQTtBQUM3QixVQUFBO01BQUEsY0FBQSxHQUFpQjtNQUVqQixrQkFBQSxHQUFxQixTQUFDLEVBQUQ7UUFDbkIsT0FBTyxDQUFDLElBQVIsQ0FBYSxFQUFFLENBQUMsSUFBaEI7UUFDQSxFQUFBLENBQUE7ZUFFQSxPQUFPLENBQUMsT0FBUixDQUFnQixFQUFFLENBQUMsSUFBbkI7TUFKbUI7TUFNckIseUJBQUEsR0FBNEIsU0FBQyxFQUFEO0FBQzFCLFlBQUE7UUFBQSxFQUFBLEdBQUssV0FBVyxDQUFDLEdBQVosQ0FBQTtRQUNMLEVBQUEsQ0FBQTtRQUNBLEVBQUEsR0FBSyxXQUFXLENBQUMsR0FBWixDQUFBO2VBQ0wsT0FB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RUFBTyw4QkFBUDthQUFoQjtZQUVBLE1BQUEsQ0FBTyxLQUFQLEVBQWdCO2NBQUEsS0FBQSxFQUFPLDhCQUFQO2FBQWhCO1lBQ0EsWUFBQSxDQUFhLEdBQWI7WUFDQSxNQUFBLENBQWdCO2NBQUEsS0FBQSxFQUFPLDhCQUFQO2FBQWhCO1lBRUEsTUFBQSxDQUFPLEtBQVAsRUFBZ0I7Y0FBQSxLQUFBLEVBQU8sOEJBQVA7YUFBaEI7WUFDQSxZQUFBLENBQWEsR0FBYjttQkFDQSxNQUFBLENBQWdCO2NBQUEsS0FBQSxFQUFPLDhCQUFQO2FBQWhCO1VBZjhDLENBQWhEO1FBTDZCLENBQS9CO01BaEN1QixDQUF6QjtJQXRHMkMsQ0FBN0M7RUFwU3NCLENBQXhCO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNoLCBUZXh0RGF0YX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiTW90aW9uIEZpbmRcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgc2V0dGluZ3Muc2V0KCd1c2VFeHBlcmltZW50YWxGYXN0ZXJJbnB1dCcsIHRydWUpXG4gICAgIyBqYXNtaW5lLmF0dGFjaFRvRE9NKGF0b20ud29ya3NwYWNlLmdldEVsZW1lbnQoKSlcblxuICAgIGdldFZpbVN0YXRlIChzdGF0ZSwgX3ZpbSkgLT5cbiAgICAgIHZpbVN0YXRlID0gc3RhdGUgIyB0byByZWZlciBhcyB2aW1TdGF0ZSBsYXRlci5cbiAgICAgIHtlZGl0b3IsIGVkaXRvckVsZW1lbnR9ID0gdmltU3RhdGVcbiAgICAgIHtzZXQsIGVuc3VyZSwga2V5c3Ryb2tlfSA9IF92aW1cblxuICB4ZGVzY3JpYmUgJ3RoZSBmIHBlcmZvcm1hbmNlJywgLT5cbiAgICB0aW1lc1RvRXhlY3V0ZSA9IDUwMFxuICAgICMgdGltZXNUb0V4ZWN1dGUgPSAxXG4gICAgbWVhc3VyZVdpdGhUaW1lRW5kID0gKGZuKSAtPlxuICAgICAgY29uc29sZS50aW1lKGZuLm5hbWUpXG4gICAgICBmbigpXG4gICAgICAjIGNvbnNvbGUubG9nIFwiW3RpbWUtZW5kXVwiXG4gICAgICBjb25zb2xlLnRpbWVFbmQoZm4ubmFtZSlcblxuICAgIG1lYXN1cmVXaXRoUGVyZm9ybWFuY2VOb3cgPSAoZm4pIC0+XG4gICAgICB0MCA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICBmbigpXG4gICAgICB0MSA9IHBlcmZvcm1hbmNlLm5vdygpXG4gICAgICBjb25zb2xlLmxvZyBcIltwZXJmb3JtYW5jZS5ub3ddIHRvb2sgI3t0MSAtIHQwfSBtc2VjXCJcblxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcIiAgXCIgKyBcImxcIi5yZXBlYXQodGltZXNUb0V4ZWN1dGUpXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICB4ZGVzY3JpYmUgJ3RoZSBmIHJlYWQtY2hhci12aWEta2V5YmluZGluZyBwZXJmb3JtYW5jZScsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHZpbVN0YXRlLnVzZU1pbmlFZGl0b3IgPSBmYWxzZVxuXG4gICAgICBpdCAnW3dpdGgga2V5YmluZF0gbW92ZXMgdG8gbCBjaGFyJywgLT5cbiAgICAgICAgdGVzdFBlcmZvcm1hbmNlT2ZLZXliaW5kID0gLT5cbiAgICAgICAgICBrZXlzdHJva2UgXCJmIGxcIiBmb3IgbiBpbiBbMS4udGltZXNUb0V4ZWN1dGVdXG4gICAgICAgICAgZW5zdXJlIGN1cnNvcjogWzAsIHRpbWVzVG9FeGVjdXRlICsgMV1cblxuICAgICAgICBjb25zb2xlLmxvZyBcIj09IGtleWJpbmRcIlxuICAgICAgICBlbnN1cmUgXCJmIGxcIiwgY3Vyc29yOiBbMCwgMl1cbiAgICAgICAgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgIG1lYXN1cmVXaXRoVGltZUVuZCh0ZXN0UGVyZm9ybWFuY2VPZktleWJpbmQpXG4gICAgICAgICMgc2V0IGN1cnNvcjogWzAsIDBdXG4gICAgICAgICMgbWVhc3VyZVdpdGhQZXJmb3JtYW5jZU5vdyh0ZXN0UGVyZm9ybWFuY2VPZktleWJpbmQpXG5cbiAgICBkZXNjcmliZSAnW3dpdGggaGlkZGVuLWlucHV0XSBtb3ZlcyB0byBsIGNoYXInLCAtPlxuICAgICAgaXQgJ1t3aXRoIGhpZGRlbi1pbnB1dF0gbW92ZXMgdG8gbCBjaGFyJywgLT5cbiAgICAgICAgdGVzdFBlcmZvcm1hbmNlT2ZIaWRkZW5JbnB1dCA9IC0+XG4gICAgICAgICAga2V5c3Ryb2tlICdmIGwnIGZvciBuIGluIFsxLi50aW1lc1RvRXhlY3V0ZV1cbiAgICAgICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgdGltZXNUb0V4ZWN1dGUgKyAxXVxuXG4gICAgICAgIGNvbnNvbGUubG9nIFwiPT0gaGlkZGVuXCJcbiAgICAgICAgZW5zdXJlICdmIGwnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgICBtZWFzdXJlV2l0aFRpbWVFbmQodGVzdFBlcmZvcm1hbmNlT2ZIaWRkZW5JbnB1dClcbiAgICAgICAgIyBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgIyBtZWFzdXJlV2l0aFBlcmZvcm1hbmNlTm93KHRlc3RQZXJmb3JtYW5jZU9mSGlkZGVuSW5wdXQpXG5cbiAgZGVzY3JpYmUgJ3RoZSBmL0Yga2V5YmluZGluZ3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcImFiY2FiY2FiY2FiY1xcblwiXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCAnbW92ZXMgdG8gdGhlIGZpcnN0IHNwZWNpZmllZCBjaGFyYWN0ZXIgaXQgZmluZHMnLCAtPlxuICAgICAgZW5zdXJlICdmIGMnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgaXQgJ2V4dGVuZHMgdmlzdWFsIHNlbGVjdGlvbiBpbiB2aXN1YWwtbW9kZSBhbmQgcmVwZXRhYmxlJywgLT5cbiAgICAgIGVuc3VyZSAndicsIG1vZGU6IFsndmlzdWFsJywgJ2NoYXJhY3Rlcndpc2UnXVxuICAgICAgZW5zdXJlICdmIGMnLCBzZWxlY3RlZFRleHQ6ICdhYmMnLCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICc7Jywgc2VsZWN0ZWRUZXh0OiAnYWJjYWJjJywgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnLCcsIHNlbGVjdGVkVGV4dDogJ2FiYycsIGN1cnNvcjogWzAsIDNdXG5cbiAgICBpdCAnbW92ZXMgYmFja3dhcmRzIHRvIHRoZSBmaXJzdCBzcGVjaWZpZWQgY2hhcmFjdGVyIGl0IGZpbmRzJywgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICdGIGEnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgJ3Jlc3BlY3RzIGNvdW50IGZvcndhcmQnLCAtPlxuICAgICAgZW5zdXJlICcyIGYgYScsIGN1cnNvcjogWzAsIDZdXG5cbiAgICBpdCAncmVzcGVjdHMgY291bnQgYmFja3dhcmQnLCAtPlxuICAgICAgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnMiBGIGEnLCBjdXJzb3I6IFswLCAwXVxuXG4gICAgaXQgXCJkb2Vzbid0IG1vdmUgaWYgdGhlIGNoYXJhY3RlciBzcGVjaWZpZWQgaXNuJ3QgZm91bmRcIiwgLT5cbiAgICAgIGVuc3VyZSAnZiBkJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGl0IFwiZG9lc24ndCBtb3ZlIGlmIHRoZXJlIGFyZW4ndCB0aGUgc3BlY2lmaWVkIGNvdW50IG9mIHRoZSBzcGVjaWZpZWQgY2hhcmFjdGVyXCIsIC0+XG4gICAgICBlbnN1cmUgJzEgMCBmIGEnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgIyBhIGJ1ZyB3YXMgbWFraW5nIHRoaXMgYmVoYXZpb3VyIGRlcGVuZCBvbiB0aGUgY291bnRcbiAgICAgIGVuc3VyZSAnMSAxIGYgYScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAjIGFuZCBiYWNrd2FyZHMgbm93XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnMSAwIEYgYScsIGN1cnNvcjogWzAsIDZdXG4gICAgICBlbnN1cmUgJzEgMSBGIGEnLCBjdXJzb3I6IFswLCA2XVxuXG4gICAgaXQgXCJjb21wb3NlcyB3aXRoIGRcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICdkIDIgZiBhJywgdGV4dDogJ2FiY2JjXFxuJ1xuXG4gICAgaXQgXCJGIGJlaGF2ZXMgZXhjbHVzaXZlbHkgd2hlbiBjb21wb3NlcyB3aXRoIG9wZXJhdG9yXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgM11cbiAgICAgIGVuc3VyZSAnZCBGIGEnLCB0ZXh0OiAnYWJjYWJjYWJjXFxuJ1xuXG4gIGRlc2NyaWJlIFwiY2FuY2VsbGF0aW9uXCIsIC0+XG4gICAgaXQgXCJrZWVwcyBtdWx0aXBsZS1jdXJzb3JzIHdoZW4gY2FuY2VsbGVkXCIsIC0+XG4gICAgICBzZXQgICAgICAgICAgICAgICAgIHRleHRDOiBcInwgICBhXFxuISAgIGFcXG58ICAgYVxcblwiXG4gICAgICBlbnN1cmUgXCJmIGVzY2FwZVwiLCAgdGV4dEM6IFwifCAgIGFcXG4hICAgYVxcbnwgICBhXFxuXCJcblxuICBkZXNjcmliZSAndGhlIHQvVCBrZXliaW5kaW5ncycsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgc2V0XG4gICAgICAgIHRleHQ6IFwiYWJjYWJjYWJjYWJjXFxuXCJcbiAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgIGl0ICdtb3ZlcyB0byB0aGUgY2hhcmFjdGVyIHByZXZpb3VzIHRvIHRoZSBmaXJzdCBzcGVjaWZpZWQgY2hhcmFjdGVyIGl0IGZpbmRzJywgLT5cbiAgICAgIGVuc3VyZSAndCBhJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgICMgb3Igc3RheXMgcHV0IHdoZW4gaXQncyBhbHJlYWR5IHRoZXJlXG4gICAgICBlbnN1cmUgJ3QgYScsIGN1cnNvcjogWzAsIDJdXG5cbiAgICBpdCAnbW92ZXMgYmFja3dhcmRzIHRvIHRoZSBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIGZpcnN0IHNwZWNpZmllZCBjaGFyYWN0ZXIgaXQgZmluZHMnLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDJdXG4gICAgICBlbnN1cmUgJ1QgYScsIGN1cnNvcjogWzAsIDFdXG5cbiAgICBpdCAncmVzcGVjdHMgY291bnQgZm9yd2FyZCcsIC0+XG4gICAgICBlbnN1cmUgJzIgdCBhJywgY3Vyc29yOiBbMCwgNV1cblxuICAgIGl0ICdyZXNwZWN0cyBjb3VudCBiYWNrd2FyZCcsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnMiBUIGEnLCBjdXJzb3I6IFswLCAxXVxuXG4gICAgaXQgXCJkb2Vzbid0IG1vdmUgaWYgdGhlIGNoYXJhY3RlciBzcGVjaWZpZWQgaXNuJ3QgZm91bmRcIiwgLT5cbiAgICAgIGVuc3VyZSAndCBkJywgY3Vyc29yOiBbMCwgMF1cblxuICAgIGl0IFwiZG9lc24ndCBtb3ZlIGlmIHRoZXJlIGFyZW4ndCB0aGUgc3BlY2lmaWVkIGNvdW50IG9mIHRoZSBzcGVjaWZpZWQgY2hhcmFjdGVyXCIsIC0+XG4gICAgICBlbnN1cmUgJzEgMCB0IGQnLCBjdXJzb3I6IFswLCAwXVxuICAgICAgIyBhIGJ1ZyB3YXMgbWFraW5nIHRoaXMgYmVoYXZpb3VyIGRlcGVuZCBvbiB0aGUgY291bnRcbiAgICAgIGVuc3VyZSAnMSAxIHQgYScsIGN1cnNvcjogWzAsIDBdXG4gICAgICAjIGFuZCBiYWNrd2FyZHMgbm93XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgNl1cbiAgICAgIGVuc3VyZSAnMSAwIFQgYScsIGN1cnNvcjogWzAsIDZdXG4gICAgICBlbnN1cmUgJzEgMSBUIGEnLCBjdXJzb3I6IFswLCA2XVxuXG4gICAgaXQgXCJjb21wb3NlcyB3aXRoIGRcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICdkIDIgdCBiJyxcbiAgICAgICAgdGV4dDogJ2FiY2JjYWJjXFxuJ1xuXG4gICAgaXQgXCJkZWxldGUgY2hhciB1bmRlciBjdXJzb3IgZXZlbiB3aGVuIG5vIG1vdmVtZW50IGhhcHBlbnMgc2luY2UgaXQncyBpbmNsdXNpdmUgbW90aW9uXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSAnZCB0IGInLFxuICAgICAgICB0ZXh0OiAnYmNhYmNhYmNhYmNcXG4nXG4gICAgaXQgXCJkbyBub3RoaW5nIHdoZW4gaW5jbHVzaXZlbmVzcyBpbnZlcnRlZCBieSB2IG9wZXJhdG9yLW1vZGlmaWVyXCIsIC0+XG4gICAgICB0ZXh0OiBcImFiY2FiY2FiY2FiY1xcblwiXG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgIGVuc3VyZSAnZCB2IHQgYicsXG4gICAgICAgIHRleHQ6ICdhYmNhYmNhYmNhYmNcXG4nXG5cbiAgICBpdCBcIlQgYmVoYXZlcyBleGNsdXNpdmVseSB3aGVuIGNvbXBvc2VzIHdpdGggb3BlcmF0b3JcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICdkIFQgYicsXG4gICAgICAgIHRleHQ6ICdhYmFiY2FiY2FiY1xcbidcblxuICAgIGl0IFwiVCBkb24ndCBkZWxldGUgY2hhcmFjdGVyIHVuZGVyIGN1cnNvciBldmVuIHdoZW4gbm8gbW92ZW1lbnQgaGFwcGVuc1wiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDNdXG4gICAgICBlbnN1cmUgJ2QgVCBjJyxcbiAgICAgICAgdGV4dDogJ2FiY2FiY2FiY2FiY1xcbidcblxuICBkZXNjcmliZSAndGhlIDsgYW5kICwga2V5YmluZGluZ3MnLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIHNldFxuICAgICAgICB0ZXh0OiBcImFiY2FiY2FiY2FiY1xcblwiXG4gICAgICAgIGN1cnNvcjogWzAsIDBdXG5cbiAgICBpdCBcInJlcGVhdCBmIGluIHNhbWUgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBlbnN1cmUgJ2YgYycsIGN1cnNvcjogWzAsIDJdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgOF1cblxuICAgIGl0IFwicmVwZWF0IEYgaW4gc2FtZSBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAxMF1cbiAgICAgIGVuc3VyZSAnRiBjJywgY3Vyc29yOiBbMCwgOF1cbiAgICAgIGVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDVdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCAyXVxuXG4gICAgaXQgXCJyZXBlYXQgZiBpbiBvcHBvc2l0ZSBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCA2XVxuICAgICAgZW5zdXJlICdmIGMnLCBjdXJzb3I6IFswLCA4XVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgNV1cbiAgICAgIGVuc3VyZSAnLCcsIGN1cnNvcjogWzAsIDJdXG5cbiAgICBpdCBcInJlcGVhdCBGIGluIG9wcG9zaXRlIGRpcmVjdGlvblwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICBlbnN1cmUgJ0YgYycsIGN1cnNvcjogWzAsIDJdXG4gICAgICBlbnN1cmUgJywnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgOF1cblxuICAgIGl0IFwiYWx0ZXJuYXRlIHJlcGVhdCBmIGluIHNhbWUgZGlyZWN0aW9uIGFuZCByZXZlcnNlXCIsIC0+XG4gICAgICBlbnN1cmUgJ2YgYycsIGN1cnNvcjogWzAsIDJdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgMl1cblxuICAgIGl0IFwiYWx0ZXJuYXRlIHJlcGVhdCBGIGluIHNhbWUgZGlyZWN0aW9uIGFuZCByZXZlcnNlXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMTBdXG4gICAgICBlbnN1cmUgJ0YgYycsIGN1cnNvcjogWzAsIDhdXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA1XVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgOF1cblxuICAgIGl0IFwicmVwZWF0IHQgaW4gc2FtZSBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIGVuc3VyZSAndCBjJywgY3Vyc29yOiBbMCwgMV1cbiAgICAgIGVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDRdXG5cbiAgICBpdCBcInJlcGVhdCBUIGluIHNhbWUgZGlyZWN0aW9uXCIsIC0+XG4gICAgICBzZXQgY3Vyc29yOiBbMCwgMTBdXG4gICAgICBlbnN1cmUgJ1QgYycsIGN1cnNvcjogWzAsIDldXG4gICAgICBlbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA2XVxuXG4gICAgaXQgXCJyZXBlYXQgdCBpbiBvcHBvc2l0ZSBkaXJlY3Rpb24gZmlyc3QsIGFuZCB0aGVuIHJldmVyc2VcIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAzXVxuICAgICAgZW5zdXJlICd0IGMnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgM11cbiAgICAgIGVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDRdXG5cbiAgICBpdCBcInJlcGVhdCBUIGluIG9wcG9zaXRlIGRpcmVjdGlvbiBmaXJzdCwgYW5kIHRoZW4gcmV2ZXJzZVwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDRdXG4gICAgICBlbnN1cmUgJ1QgYycsIGN1cnNvcjogWzAsIDNdXG4gICAgICBlbnN1cmUgJywnLCBjdXJzb3I6IFswLCA0XVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgM11cblxuICAgIGl0IFwicmVwZWF0IHdpdGggY291bnQgaW4gc2FtZSBkaXJlY3Rpb25cIiwgLT5cbiAgICAgIHNldCBjdXJzb3I6IFswLCAwXVxuICAgICAgZW5zdXJlICdmIGMnLCBjdXJzb3I6IFswLCAyXVxuICAgICAgZW5zdXJlICcyIDsnLCBjdXJzb3I6IFswLCA4XVxuXG4gICAgaXQgXCJyZXBlYXQgd2l0aCBjb3VudCBpbiByZXZlcnNlIGRpcmVjdGlvblwiLCAtPlxuICAgICAgc2V0IGN1cnNvcjogWzAsIDZdXG4gICAgICBlbnN1cmUgJ2YgYycsIGN1cnNvcjogWzAsIDhdXG4gICAgICBlbnN1cmUgJzIgLCcsIGN1cnNvcjogWzAsIDJdXG5cbiAgZGVzY3JpYmUgXCJsYXN0IGZpbmQvdGlsbCBpcyByZXBlYXRhYmxlIG9uIG90aGVyIGVkaXRvclwiLCAtPlxuICAgIFtvdGhlciwgb3RoZXJFZGl0b3IsIHBhbmVdID0gW11cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBnZXRWaW1TdGF0ZSAob3RoZXJWaW1TdGF0ZSwgX290aGVyKSAtPlxuICAgICAgICBzZXRcbiAgICAgICAgICB0ZXh0OiBcImEgYmF6IGJhclxcblwiXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgICBvdGhlciA9IF9vdGhlclxuICAgICAgICBvdGhlci5zZXRcbiAgICAgICAgICB0ZXh0OiBcImZvbyBiYXIgYmF6XCIsXG4gICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgb3RoZXJFZGl0b3IgPSBvdGhlclZpbVN0YXRlLmVkaXRvclxuICAgICAgICAjIGphc21pbmUuYXR0YWNoVG9ET00ob3RoZXJFZGl0b3IuZWxlbWVudClcblxuICAgICAgICBwYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgICAgIHBhbmUuYWN0aXZhdGVJdGVtKGVkaXRvcilcblxuICAgIGl0IFwic2hhcmVzIHRoZSBtb3N0IHJlY2VudCBmaW5kL3RpbGwgY29tbWFuZCB3aXRoIG90aGVyIGVkaXRvcnNcIiwgLT5cbiAgICAgIGVuc3VyZSAnZiBiJywgY3Vyc29yOiBbMCwgMl1cbiAgICAgIG90aGVyLmVuc3VyZSBjdXJzb3I6IFswLCAwXVxuXG4gICAgICAjIHJlcGxheSBzYW1lIGZpbmQgaW4gdGhlIG90aGVyIGVkaXRvclxuICAgICAgcGFuZS5hY3RpdmF0ZUl0ZW0ob3RoZXJFZGl0b3IpXG4gICAgICBvdGhlci5rZXlzdHJva2UgJzsnXG4gICAgICBlbnN1cmUgY3Vyc29yOiBbMCwgMl1cbiAgICAgIG90aGVyLmVuc3VyZSBjdXJzb3I6IFswLCA0XVxuXG4gICAgICAjIGRvIGEgdGlsbCBpbiB0aGUgb3RoZXIgZWRpdG9yXG4gICAgICBvdGhlci5rZXlzdHJva2UgJ3QgcidcbiAgICAgIGVuc3VyZSBjdXJzb3I6IFswLCAyXVxuICAgICAgb3RoZXIuZW5zdXJlIGN1cnNvcjogWzAsIDVdXG5cbiAgICAgICMgYW5kIHJlcGxheSBpbiB0aGUgbm9ybWFsIGVkaXRvclxuICAgICAgcGFuZS5hY3RpdmF0ZUl0ZW0oZWRpdG9yKVxuICAgICAgZW5zdXJlICc7JywgY3Vyc29yOiBbMCwgN11cbiAgICAgIG90aGVyLmVuc3VyZSBjdXJzb3I6IFswLCA1XVxuXG4gICAgaXQgXCJpcyBzdGlsbCByZXBlYXRhYmxlIGFmdGVyIG9yaWdpbmFsIGVkaXRvciB3YXMgZGVzdHJveWVkXCIsIC0+XG4gICAgICBlbnN1cmUgJ2YgYicsIGN1cnNvcjogWzAsIDJdXG4gICAgICBvdGhlci5lbnN1cmUgY3Vyc29yOiBbMCwgMF1cblxuICAgICAgcGFuZS5hY3RpdmF0ZUl0ZW0ob3RoZXJFZGl0b3IpXG4gICAgICBlZGl0b3IuZGVzdHJveSgpXG4gICAgICBleHBlY3QoZWRpdG9yLmlzQWxpdmUoKSkudG9CZShmYWxzZSlcbiAgICAgIG90aGVyLmVuc3VyZSAnOycsIGN1cnNvcjogWzAsIDRdXG4gICAgICBvdGhlci5lbnN1cmUgJzsnLCBjdXJzb3I6IFswLCA4XVxuICAgICAgb3RoZXIuZW5zdXJlICcsJywgY3Vyc29yOiBbMCwgNF1cblxuICBkZXNjcmliZSBcInZtcCB1bmlxdWUgZmVhdHVyZSBvZiBgZmAgZmFtaWx5XCIsIC0+XG4gICAgZGVzY3JpYmUgXCJpZ25vcmVDYXNlRm9yRmluZFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoXCJpZ25vcmVDYXNlRm9yRmluZFwiLCB0cnVlKVxuXG4gICAgICBpdCBcImlnbm9yZSBjYXNlIHRvIGZpbmRcIiwgLT5cbiAgICAgICAgc2V0IHRleHRDOiBcInwgICAgQSAgICBhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJmIGFcIiwgdGV4dEM6IFwiICAgIHxBICAgIGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIgICAgQSAgICB8YWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIHxhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgYSAgICB8QWIgICAgYVwiXG5cbiAgICBkZXNjcmliZSBcInVzZVNtYXJ0Y2FzZUZvckZpbmRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KFwidXNlU21hcnRjYXNlRm9yRmluZFwiLCB0cnVlKVxuXG4gICAgICBpdCBcImlnbm9yZSBjYXNlIHdoZW4gaW5wdXQgaXMgbG93ZXIgY2hhclwiLCAtPlxuICAgICAgICBzZXQgdGV4dEM6IFwifCAgICBBICAgIGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcImYgYVwiLCB0ZXh0QzogXCIgICAgfEEgICAgYWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIiAgICBBICAgIHxhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgfGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgICBhICAgIHxBYiAgICBhXCJcblxuICAgICAgaXQgXCJmaW5kIGNhc2Utc2Vuc2l0aXZlbHkgd2hlbiBpbnB1dCBpcyBsYWdlciBjaGFyXCIsIC0+XG4gICAgICAgIHNldCB0ZXh0QzogXCJ8ICAgIEEgICAgYWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiZiBBXCIsIHRleHRDOiBcIiAgICB8QSAgICBhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJmIEFcIiwgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgYSAgICB8QWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIixcIiwgICB0ZXh0QzogXCIgICAgfEEgICAgYWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIGEgICAgfEFiICAgIGFcIlxuXG4gICAgZGVzY3JpYmUgXCJyZXVzZUZpbmRGb3JSZXBlYXRGaW5kXCIsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIHNldHRpbmdzLnNldChcInJldXNlRmluZEZvclJlcGVhdEZpbmRcIiwgdHJ1ZSlcblxuICAgICAgaXQgXCJjYW4gcmV1c2UgZiBhbmQgdCBhcyA7LCBGIGFuZCBUIGFzICcsJyByZXNwZWN0aXZlbHlcIiwgLT5cbiAgICAgICAgc2V0IHRleHRDOiBcInwgICAgQSAgICBhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJmIGFcIiwgdGV4dEM6IFwiICAgIEEgICAgfGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcImZcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgICB8YSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiZlwiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgIGEgICAgQWIgICAgfGFcIlxuICAgICAgICBlbnN1cmUgXCJGXCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgfGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcIkZcIiwgICB0ZXh0QzogXCIgICAgQSAgICB8YWIgICAgYSAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwidFwiLCAgIHRleHRDOiBcIiAgICBBICAgIGFiICAgfCBhICAgIEFiICAgIGFcIlxuICAgICAgICBlbnN1cmUgXCJ0XCIsICAgdGV4dEM6IFwiICAgIEEgICAgYWIgICAgYSAgICBBYiAgIHwgYVwiXG4gICAgICAgIGVuc3VyZSBcIlRcIiwgICB0ZXh0QzogXCIgICAgQSAgICBhYiAgICBhfCAgICBBYiAgICBhXCJcbiAgICAgICAgZW5zdXJlIFwiVFwiLCAgIHRleHRDOiBcIiAgICBBICAgIGF8YiAgICBhICAgIEFiICAgIGFcIlxuXG4gICAgICBpdCBcImJlaGF2ZSBhcyBub3JtYWwgZiBpZiBubyBzdWNjZXNzZnVsIHByZXZpb3VzIGZpbmQgd2FzIGV4aXN0c1wiLCAtPlxuICAgICAgICBzZXQgICAgICAgICAgICAgICAgdGV4dEM6IFwiICB8ICBBICAgIGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGVuc3VyZSBcImYgZXNjYXBlXCIsIHRleHRDOiBcIiAgfCAgQSAgICBhYiAgICBhICAgIEFiICAgIGFcIlxuICAgICAgICBleHBlY3QodmltU3RhdGUuZ2xvYmFsU3RhdGUuZ2V0KFwiY3VycmVudEZpbmRcIikpLnRvQmVOdWxsKClcbiAgICAgICAgZW5zdXJlIFwiZiBhXCIsICAgICAgdGV4dEM6IFwiICAgIEEgICAgfGFiICAgIGEgICAgQWIgICAgYVwiXG4gICAgICAgIGV4cGVjdCh2aW1TdGF0ZS5nbG9iYWxTdGF0ZS5nZXQoXCJjdXJyZW50RmluZFwiKSkudG9CZVRydXRoeSgpXG5cbiAgICBkZXNjcmliZSBcImZpbmRBY3Jvc3NMaW5lc1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzZXR0aW5ncy5zZXQoXCJmaW5kQWNyb3NzTGluZXNcIiwgdHJ1ZSlcblxuICAgICAgaXQgXCJzZWFyY2hlcyBhY3Jvc3MgbXVsdGlwbGUgbGluZXNcIiwgLT5cbiAgICAgICAgc2V0ICAgICAgICAgICB0ZXh0QzogXCJ8MDogICAgYSAgICBhXFxuMTogICAgYSAgICBhXFxuMjogICAgYSAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwiZiBhXCIsIHRleHRDOiBcIjA6ICAgIHxhICAgIGFcXG4xOiAgICBhICAgIGFcXG4yOiAgICBhICAgIGFcXG5cIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiMDogICAgYSAgICB8YVxcbjE6ICAgIGEgICAgYVxcbjI6ICAgIGEgICAgYVxcblwiXG4gICAgICAgIGVuc3VyZSBcIjtcIiwgICB0ZXh0QzogXCIwOiAgICBhICAgIGFcXG4xOiAgICB8YSAgICBhXFxuMjogICAgYSAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwiO1wiLCAgIHRleHRDOiBcIjA6ICAgIGEgICAgYVxcbjE6ICAgIGEgICAgfGFcXG4yOiAgICBhICAgIGFcXG5cIlxuICAgICAgICBlbnN1cmUgXCI7XCIsICAgdGV4dEM6IFwiMDogICAgYSAgICBhXFxuMTogICAgYSAgICBhXFxuMjogICAgfGEgICAgYVxcblwiXG4gICAgICAgIGVuc3VyZSBcIkYgYVwiLCB0ZXh0QzogXCIwOiAgICBhICAgIGFcXG4xOiAgICBhICAgIHxhXFxuMjogICAgYSAgICBhXFxuXCJcbiAgICAgICAgZW5zdXJlIFwidCBhXCIsIHRleHRDOiBcIjA6ICAgIGEgICAgYVxcbjE6ICAgIGEgICAgYVxcbjI6ICAgfCBhICAgIGFcXG5cIlxuICAgICAgICBlbnN1cmUgXCJUIGFcIiwgdGV4dEM6IFwiMDogICAgYSAgICBhXFxuMTogICAgYSAgICB8YVxcbjI6ICAgIGEgICAgYVxcblwiXG4gICAgICAgIGVuc3VyZSBcIlQgYVwiLCB0ZXh0QzogXCIwOiAgICBhICAgIGFcXG4xOiAgICBhfCAgICBhXFxuMjogICAgYSAgICBhXFxuXCJcblxuICAgIGRlc2NyaWJlIFwiZmluZC1uZXh0L3ByZXZpb3VzLXByZS1jb25maXJtZWRcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc2V0dGluZ3Muc2V0KFwiZmluZENoYXJzTWF4XCIsIDEwKVxuICAgICAgICAjIFRvIHBhc3MgaGxGaW5kIGxvZ2ljIGl0IHJlcXVpcmUgXCJ2aXNpYmxlXCIgc2NyZWVuIHJhbmdlLlxuICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGF0b20ud29ya3NwYWNlLmdldEVsZW1lbnQoKSlcblxuICAgICAgZGVzY3JpYmUgXCJjYW4gZmluZCBvbmUgb3IgdHdvIGNoYXJcIiwgLT5cbiAgICAgICAgaXQgXCJhZGp1c3QgdG8gbmV4dC1wcmUtY29uZmlybWVkXCIsIC0+XG4gICAgICAgICAgc2V0ICAgICAgICAgICAgICAgICB0ZXh0QzogXCJ8ICAgIGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICBrZXlzdHJva2UgXCJmIGEgXCJcbiAgICAgICAgICBlbGVtZW50ID0gdmltU3RhdGUuaW5wdXRFZGl0b3IuZWxlbWVudFxuICAgICAgICAgIGRpc3BhdGNoKGVsZW1lbnQsIFwidmltLW1vZGUtcGx1czpmaW5kLW5leHQtcHJlLWNvbmZpcm1lZFwiKVxuICAgICAgICAgIGRpc3BhdGNoKGVsZW1lbnQsIFwidmltLW1vZGUtcGx1czpmaW5kLW5leHQtcHJlLWNvbmZpcm1lZFwiKVxuICAgICAgICAgIGVuc3VyZSBcImVudGVyXCIsICAgICB0ZXh0QzogXCIgICAgYSAgICBhYiAgICB8YSAgICBjZCAgICBhXCJcblxuICAgICAgICBpdCBcImFkanVzdCB0byBwcmV2aW91cy1wcmUtY29uZmlybWVkXCIsIC0+XG4gICAgICAgICAgc2V0ICAgICAgICAgICAgICAgICAgIHRleHRDOiBcInwgICAgYSAgICBhYiAgICBhICAgIGNkICAgIGFcIlxuICAgICAgICAgIGVuc3VyZSBcIjMgZiBhIGVudGVyXCIsIHRleHRDOiBcIiAgICBhICAgIGFiICAgIHxhICAgIGNkICAgIGFcIlxuICAgICAgICAgIHNldCAgICAgICAgICAgICAgICAgICB0ZXh0QzogXCJ8ICAgIGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICBrZXlzdHJva2UgXCIzIGYgYVwiXG4gICAgICAgICAgZWxlbWVudCA9IHZpbVN0YXRlLmlucHV0RWRpdG9yLmVsZW1lbnRcbiAgICAgICAgICBkaXNwYXRjaChlbGVtZW50LCBcInZpbS1tb2RlLXBsdXM6ZmluZC1wcmV2aW91cy1wcmUtY29uZmlybWVkXCIpXG4gICAgICAgICAgZGlzcGF0Y2goZWxlbWVudCwgXCJ2aW0tbW9kZS1wbHVzOmZpbmQtcHJldmlvdXMtcHJlLWNvbmZpcm1lZFwiKVxuICAgICAgICAgIGVuc3VyZSBcImVudGVyXCIsICAgICB0ZXh0QzogXCIgICAgfGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcblxuICAgICAgICBpdCBcImlzIHVzZWZ1bCB0byBza2lwIGVhcmxpZXIgc3BvdCBpbnRlcmFjdGl2ZWxseVwiLCAtPlxuICAgICAgICAgIHNldCAgdGV4dEM6ICd0ZXh0ID0gXCJ0aGlzIGlzIHxcXFwiZXhhbXBsZVxcXCIgb2YgdXNlIGNhc2VcIidcbiAgICAgICAgICBrZXlzdHJva2UgJ2MgdCBcIidcbiAgICAgICAgICBlbGVtZW50ID0gdmltU3RhdGUuaW5wdXRFZGl0b3IuZWxlbWVudFxuICAgICAgICAgIGRpc3BhdGNoKGVsZW1lbnQsIFwidmltLW1vZGUtcGx1czpmaW5kLW5leHQtcHJlLWNvbmZpcm1lZFwiKSAjIHRhYlxuICAgICAgICAgIGRpc3BhdGNoKGVsZW1lbnQsIFwidmltLW1vZGUtcGx1czpmaW5kLW5leHQtcHJlLWNvbmZpcm1lZFwiKSAjIHRhYlxuICAgICAgICAgIGVuc3VyZSBcImVudGVyXCIsIHRleHRDOiAndGV4dCA9IFwidGhpcyBpcyB8XCInLCBtb2RlOiBcImluc2VydFwiXG5cbiAgICBkZXNjcmliZSBcImZpbmRDaGFyc01heFwiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICAjIFRvIHBhc3MgaGxGaW5kIGxvZ2ljIGl0IHJlcXVpcmUgXCJ2aXNpYmxlXCIgc2NyZWVuIHJhbmdlLlxuICAgICAgICBqYXNtaW5lLmF0dGFjaFRvRE9NKGF0b20ud29ya3NwYWNlLmdldEVsZW1lbnQoKSlcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIDIgbGVuZ3RoXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoXCJmaW5kQ2hhcnNNYXhcIiwgMilcblxuICAgICAgICBkZXNjcmliZSBcImNhbiBmaW5kIG9uZSBvciB0d28gY2hhclwiLCAtPlxuICAgICAgICAgIGl0IFwiY2FuIGZpbmQgYnkgdHdvIGNoYXJcIiwgLT5cbiAgICAgICAgICAgIHNldCAgICAgICAgICAgICB0ZXh0QzogXCJ8ICAgIGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgYSBiXCIsIHRleHRDOiBcIiAgICBhICAgIHxhYiAgICBhICAgIGNkICAgIGFcIlxuICAgICAgICAgICAgZW5zdXJlIFwiZiBjIGRcIiwgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgYSAgICB8Y2QgICAgYVwiXG5cbiAgICAgICAgICBpdCBcImNhbiBmaW5kIGJ5IG9uZS1jaGFyIGJ5IGNvbmZpcm1pbmcgZXhwbGljaXRseVwiLCAtPlxuICAgICAgICAgICAgc2V0ICAgICAgICAgICAgICAgICB0ZXh0QzogXCJ8ICAgIGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgYSBlbnRlclwiLCB0ZXh0QzogXCIgICAgfGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgYyBlbnRlclwiLCB0ZXh0QzogXCIgICAgYSAgICBhYiAgICBhICAgIHxjZCAgICBhXCJcblxuICAgICAgZGVzY3JpYmUgXCJ3aXRoIDMgbGVuZ3RoXCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoXCJmaW5kQ2hhcnNNYXhcIiwgMylcblxuICAgICAgICBkZXNjcmliZSBcImNhbiBmaW5kIDMgYXQgbWF4aW11bVwiLCAtPlxuICAgICAgICAgIGl0IFwiY2FuIGZpbmQgYnkgb25lIG9yIHR3byBvciB0aHJlZSBjaGFyXCIsIC0+XG4gICAgICAgICAgICBzZXQgICAgICAgICAgICAgICAgICAgdGV4dEM6IFwifCAgICBhICAgIGFiICAgIGEgICAgY2QgICAgZWZnXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgYSBiIGVudGVyXCIsIHRleHRDOiBcIiAgICBhICAgIHxhYiAgICBhICAgIGNkICAgIGVmZ1wiXG4gICAgICAgICAgICBlbnN1cmUgXCJmIGEgZW50ZXJcIiwgICB0ZXh0QzogXCIgICAgYSAgICBhYiAgICB8YSAgICBjZCAgICBlZmdcIlxuICAgICAgICAgICAgZW5zdXJlIFwiZiBjIGQgZW50ZXJcIiwgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgYSAgICB8Y2QgICAgZWZnXCJcbiAgICAgICAgICAgIGVuc3VyZSBcImYgZSBmIGdcIiwgICAgIHRleHRDOiBcIiAgICBhICAgIGFiICAgIGEgICAgY2QgICAgfGVmZ1wiXG5cbiAgICAgIGRlc2NyaWJlIFwiYXV0b0NvbmZpcm1UaW1lb3V0XCIsIC0+XG4gICAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgICBzZXR0aW5ncy5zZXQoXCJmaW5kQ2hhcnNNYXhcIiwgMilcbiAgICAgICAgICBzZXR0aW5ncy5zZXQoXCJmaW5kQ29uZmlybUJ5VGltZW91dFwiLCA1MDApXG5cbiAgICAgICAgaXQgXCJhdXRvLWNvbmZpcm0gc2luZ2xlLWNoYXIgaW5wdXQgb24gdGltZW91dFwiLCAtPlxuICAgICAgICAgIHNldCAgICAgICAgICAgICB0ZXh0QzogXCJ8ICAgIGEgICAgYWIgICAgYSAgICBjZCAgICBhXCJcblxuICAgICAgICAgIGVuc3VyZSBcImYgYVwiLCAgIHRleHRDOiBcInwgICAgYSAgICBhYiAgICBhICAgIGNkICAgIGFcIlxuICAgICAgICAgIGFkdmFuY2VDbG9jayg1MDApXG4gICAgICAgICAgZW5zdXJlICAgICAgICAgIHRleHRDOiBcIiAgICB8YSAgICBhYiAgICBhICAgIGNkICAgIGFcIlxuXG4gICAgICAgICAgZW5zdXJlIFwiZiBjIGRcIiwgdGV4dEM6IFwiICAgIGEgICAgYWIgICAgYSAgICB8Y2QgICAgYVwiXG5cbiAgICAgICAgICBlbnN1cmUgXCJmIGFcIiwgICB0ZXh0QzogXCIgICAgYSAgICBhYiAgICBhICAgIHxjZCAgICBhXCJcbiAgICAgICAgICBhZHZhbmNlQ2xvY2soNTAwKVxuICAgICAgICAgIGVuc3VyZSAgICAgICAgICB0ZXh0QzogXCIgICAgYSAgICBhYiAgICBhICAgIGNkICAgIHxhXCJcblxuICAgICAgICAgIGVuc3VyZSBcIkYgYlwiLCAgIHRleHRDOiBcIiAgICBhICAgIGFiICAgIGEgICAgY2QgICAgfGFcIlxuICAgICAgICAgIGFkdmFuY2VDbG9jayg1MDApXG4gICAgICAgICAgZW5zdXJlICAgICAgICAgIHRleHRDOiBcIiAgICBhICAgIGF8YiAgICBhICAgIGNkICAgIGFcIlxuIl19
