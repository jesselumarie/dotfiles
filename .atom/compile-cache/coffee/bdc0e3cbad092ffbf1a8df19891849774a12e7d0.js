(function() {
  var getVimState;

  getVimState = require('./spec-helper').getVimState;

  describe("Scrolling", function() {
    var editor, editorElement, ensure, keystroke, ref, set, vimState;
    ref = [], set = ref[0], ensure = ref[1], keystroke = ref[2], editor = ref[3], editorElement = ref[4], vimState = ref[5];
    beforeEach(function() {
      return getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke;
        return jasmine.attachToDOM(editorElement);
      });
    });
    describe("scrolling keybindings", function() {
      beforeEach(function() {
        var component, initialRowRange;
        if (editorElement.measureDimensions != null) {
          component = editor.component;
          component.element.style.height = component.getLineHeight() * 5 + 'px';
          editorElement.measureDimensions();
          initialRowRange = [0, 5];
        } else {
          editor.setLineHeightInPixels(10);
          editorElement.setHeight(10 * 5);
          atom.views.performDocumentPoll();
          initialRowRange = [0, 4];
        }
        set({
          cursor: [1, 2],
          text: "100\n200\n300\n400\n500\n600\n700\n800\n900\n1000"
        });
        return expect(editorElement.getVisibleRowRange()).toEqual(initialRowRange);
      });
      return describe("the ctrl-e and ctrl-y keybindings", function() {
        return it("moves the screen up and down by one and keeps cursor onscreen", function() {
          ensure('ctrl-e', {
            cursor: [2, 2]
          });
          expect(editor.getFirstVisibleScreenRow()).toBe(1);
          expect(editor.getLastVisibleScreenRow()).toBe(6);
          ensure('2 ctrl-e', {
            cursor: [4, 2]
          });
          expect(editor.getFirstVisibleScreenRow()).toBe(3);
          expect(editor.getLastVisibleScreenRow()).toBe(8);
          ensure('2 ctrl-y', {
            cursor: [2, 2]
          });
          expect(editor.getFirstVisibleScreenRow()).toBe(1);
          return expect(editor.getLastVisibleScreenRow()).toBe(6);
        });
      });
    });
    describe("scroll cursor keybindings", function() {
      beforeEach(function() {
        var j, results;
        editor.setText((function() {
          results = [];
          for (j = 1; j <= 200; j++){ results.push(j); }
          return results;
        }).apply(this).join("\n"));
        editorElement.style.lineHeight = "20px";
        editorElement.setHeight(20 * 10);
        if (editorElement.measureDimensions != null) {
          editorElement.measureDimensions();
        } else {
          editorElement.component.sampleFontStyling();
        }
        spyOn(editor, 'moveToFirstCharacterOfLine');
        spyOn(editorElement, 'setScrollTop');
        spyOn(editorElement, 'getFirstVisibleScreenRow').andReturn(90);
        spyOn(editorElement, 'getLastVisibleScreenRow').andReturn(110);
        return spyOn(editorElement, 'pixelPositionForScreenPosition').andReturn({
          top: 1000,
          left: 0
        });
      });
      describe("the z<CR> keybinding", function() {
        return it("moves the screen to position cursor at the top of the window and moves cursor to first non-blank in the line", function() {
          keystroke('z enter');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(960);
          return expect(editor.moveToFirstCharacterOfLine).toHaveBeenCalled();
        });
      });
      describe("the zt keybinding", function() {
        return it("moves the screen to position cursor at the top of the window and leave cursor in the same column", function() {
          keystroke('z t');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(960);
          return expect(editor.moveToFirstCharacterOfLine).not.toHaveBeenCalled();
        });
      });
      describe("the z. keybinding", function() {
        return it("moves the screen to position cursor at the center of the window and moves cursor to first non-blank in the line", function() {
          keystroke('z .');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(900);
          return expect(editor.moveToFirstCharacterOfLine).toHaveBeenCalled();
        });
      });
      describe("the zz keybinding", function() {
        return it("moves the screen to position cursor at the center of the window and leave cursor in the same column", function() {
          keystroke('z z');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(900);
          return expect(editor.moveToFirstCharacterOfLine).not.toHaveBeenCalled();
        });
      });
      describe("the z- keybinding", function() {
        return it("moves the screen to position cursor at the bottom of the window and moves cursor to first non-blank in the line", function() {
          keystroke('z -');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(860);
          return expect(editor.moveToFirstCharacterOfLine).toHaveBeenCalled();
        });
      });
      return describe("the zb keybinding", function() {
        return it("moves the screen to position cursor at the bottom of the window and leave cursor in the same column", function() {
          keystroke('z b');
          expect(editorElement.setScrollTop).toHaveBeenCalledWith(860);
          return expect(editor.moveToFirstCharacterOfLine).not.toHaveBeenCalled();
        });
      });
    });
    return describe("horizontal scroll cursor keybindings", function() {
      beforeEach(function() {
        var i, j, text;
        editorElement.setWidth(600);
        editorElement.setHeight(600);
        editorElement.style.lineHeight = "10px";
        editorElement.style.font = "16px monospace";
        if (editorElement.measureDimensions != null) {
          editorElement.measureDimensions();
        } else {
          atom.views.performDocumentPoll();
        }
        text = "";
        for (i = j = 100; j <= 199; i = ++j) {
          text += i + " ";
        }
        editor.setText(text);
        return editor.setCursorBufferPosition([0, 0]);
      });
      describe("the zs keybinding", function() {
        var startPosition, zsPos;
        zsPos = function(pos) {
          editor.setCursorBufferPosition([0, pos]);
          keystroke('z s');
          return editorElement.getScrollLeft();
        };
        startPosition = 0/0;
        beforeEach(function() {
          return startPosition = editorElement.getScrollLeft();
        });
        xit("does nothing near the start of the line", function() {
          var pos1;
          pos1 = zsPos(1);
          return expect(pos1).toEqual(startPosition);
        });
        it("moves the cursor the nearest it can to the left edge of the editor", function() {
          var pos10, pos11;
          pos10 = zsPos(10);
          expect(pos10).toBeGreaterThan(startPosition);
          pos11 = zsPos(11);
          return expect(pos11 - pos10).toEqual(10);
        });
        it("does nothing near the end of the line", function() {
          var pos340, pos390, posEnd;
          posEnd = zsPos(399);
          expect(editor.getCursorBufferPosition()).toEqual([0, 399]);
          pos390 = zsPos(390);
          expect(pos390).toEqual(posEnd);
          expect(editor.getCursorBufferPosition()).toEqual([0, 390]);
          pos340 = zsPos(340);
          return expect(pos340).toEqual(posEnd);
        });
        return it("does nothing if all lines are short", function() {
          var pos1, pos10;
          editor.setText('short');
          startPosition = editorElement.getScrollLeft();
          pos1 = zsPos(1);
          expect(pos1).toEqual(startPosition);
          expect(editor.getCursorBufferPosition()).toEqual([0, 1]);
          pos10 = zsPos(10);
          expect(pos10).toEqual(startPosition);
          return expect(editor.getCursorBufferPosition()).toEqual([0, 4]);
        });
      });
      return describe("the ze keybinding", function() {
        var startPosition, zePos;
        zePos = function(pos) {
          editor.setCursorBufferPosition([0, pos]);
          keystroke('z e');
          return editorElement.getScrollLeft();
        };
        startPosition = 0/0;
        beforeEach(function() {
          return startPosition = editorElement.getScrollLeft();
        });
        it("does nothing near the start of the line", function() {
          var pos1, pos40;
          pos1 = zePos(1);
          expect(pos1).toEqual(startPosition);
          pos40 = zePos(40);
          return expect(pos40).toEqual(startPosition);
        });
        it("moves the cursor the nearest it can to the right edge of the editor", function() {
          var pos109, pos110;
          pos110 = zePos(110);
          expect(pos110).toBeGreaterThan(startPosition);
          pos109 = zePos(109);
          return expect(pos110 - pos109).toEqual(9);
        });
        it("does nothing when very near the end of the line", function() {
          var pos380, pos382, pos397, posEnd;
          posEnd = zePos(399);
          expect(editor.getCursorBufferPosition()).toEqual([0, 399]);
          pos397 = zePos(397);
          expect(pos397).toBeLessThan(posEnd);
          expect(editor.getCursorBufferPosition()).toEqual([0, 397]);
          pos380 = zePos(380);
          expect(pos380).toBeLessThan(posEnd);
          pos382 = zePos(382);
          return expect(pos382 - pos380).toEqual(19);
        });
        return it("does nothing if all lines are short", function() {
          var pos1, pos10;
          editor.setText('short');
          startPosition = editorElement.getScrollLeft();
          pos1 = zePos(1);
          expect(pos1).toEqual(startPosition);
          expect(editor.getCursorBufferPosition()).toEqual([0, 1]);
          pos10 = zePos(10);
          expect(pos10).toEqual(startPosition);
          return expect(editor.getCursorBufferPosition()).toEqual([0, 4]);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvc2Nyb2xsLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQyxjQUFlLE9BQUEsQ0FBUSxlQUFSOztFQUVoQixRQUFBLENBQVMsV0FBVCxFQUFzQixTQUFBO0FBQ3BCLFFBQUE7SUFBQSxNQUE0RCxFQUE1RCxFQUFDLFlBQUQsRUFBTSxlQUFOLEVBQWMsa0JBQWQsRUFBeUIsZUFBekIsRUFBaUMsc0JBQWpDLEVBQWdEO0lBRWhELFVBQUEsQ0FBVyxTQUFBO2FBQ1QsV0FBQSxDQUFZLFNBQUMsS0FBRCxFQUFRLEdBQVI7UUFDVixRQUFBLEdBQVc7UUFDVix3QkFBRCxFQUFTO1FBQ1IsYUFBRCxFQUFNLG1CQUFOLEVBQWM7ZUFDZCxPQUFPLENBQUMsV0FBUixDQUFvQixhQUFwQjtNQUpVLENBQVo7SUFEUyxDQUFYO0lBT0EsUUFBQSxDQUFTLHVCQUFULEVBQWtDLFNBQUE7TUFDaEMsVUFBQSxDQUFXLFNBQUE7QUFDVCxZQUFBO1FBQUEsSUFBRyx1Q0FBSDtVQUVHLFlBQWE7VUFDZCxTQUFTLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUF4QixHQUFpQyxTQUFTLENBQUMsYUFBVixDQUFBLENBQUEsR0FBNEIsQ0FBNUIsR0FBZ0M7VUFDakUsYUFBYSxDQUFDLGlCQUFkLENBQUE7VUFDQSxlQUFBLEdBQWtCLENBQUMsQ0FBRCxFQUFJLENBQUosRUFMcEI7U0FBQSxNQUFBO1VBU0UsTUFBTSxDQUFDLHFCQUFQLENBQTZCLEVBQTdCO1VBQ0EsYUFBYSxDQUFDLFNBQWQsQ0FBd0IsRUFBQSxHQUFLLENBQTdCO1VBQ0EsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBWCxDQUFBO1VBQ0EsZUFBQSxHQUFrQixDQUFDLENBQUQsRUFBSSxDQUFKLEVBWnBCOztRQWNBLEdBQUEs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QyxDQUFpRCxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpEO1VBQ0EsS0FBQSxHQUFRLEtBQUEsQ0FBTSxFQUFOO1VBQ1IsTUFBQSxDQUFPLEtBQVAsQ0FBYSxDQUFDLE9BQWQsQ0FBc0IsYUFBdEI7aUJBQ0EsTUFBQSxDQUFPLE1BQU0sQ0FBQyx1QkFBUCxDQUFBLENBQVAsQ0FBd0MsQ0FBQyxPQUF6QyxDQUFpRCxDQUFDLENBQUQsRUFBSSxDQUFKLENBQWpEO1FBUndDLENBQTFDO01BeEM0QixDQUE5QjtJQS9EK0MsQ0FBakQ7RUFoSG9CLENBQXRCO0FBRkEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGV9ID0gcmVxdWlyZSAnLi9zcGVjLWhlbHBlcidcblxuZGVzY3JpYmUgXCJTY3JvbGxpbmdcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZWRpdG9yRWxlbWVudClcblxuICBkZXNjcmliZSBcInNjcm9sbGluZyBrZXliaW5kaW5nc1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGlmIGVkaXRvckVsZW1lbnQubWVhc3VyZURpbWVuc2lvbnM/XG4gICAgICAgICMgRm9yIEF0b20tdjEuMTlcbiAgICAgICAge2NvbXBvbmVudH0gPSBlZGl0b3JcbiAgICAgICAgY29tcG9uZW50LmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gY29tcG9uZW50LmdldExpbmVIZWlnaHQoKSAqIDUgKyAncHgnXG4gICAgICAgIGVkaXRvckVsZW1lbnQubWVhc3VyZURpbWVuc2lvbnMoKVxuICAgICAgICBpbml0aWFsUm93UmFuZ2UgPSBbMCwgNV1cblxuICAgICAgZWxzZSAjIEZvciBBdG9tLXYxLjE4XG4gICAgICAgICMgW1RPRE9dIFJlbW92ZSB3aGVuIHYuMS4xOSBiZWNvbWUgc3RhYmxlXG4gICAgICAgIGVkaXRvci5zZXRMaW5lSGVpZ2h0SW5QaXhlbHMoMTApXG4gICAgICAgIGVkaXRvckVsZW1lbnQuc2V0SGVpZ2h0KDEwICogNSlcbiAgICAgICAgYXRvbS52aWV3cy5wZXJmb3JtRG9jdW1lbnRQb2xsKClcbiAgICAgICAgaW5pdGlhbFJvd1JhbmdlID0gWzAsIDRdXG5cbiAgICAgIHNldFxuICAgICAgICBjdXJzb3I6IFsxLCAyXVxuICAgICAgICB0ZXh0OiBcIlwiXCJcbiAgICAgICAgICAxMDBcbiAgICAgICAgICAyMDBcbiAgICAgICAgICAzMDBcbiAgICAgICAgICA0MDBcbiAgICAgICAgICA1MDBcbiAgICAgICAgICA2MDBcbiAgICAgICAgICA3MDBcbiAgICAgICAgICA4MDBcbiAgICAgICAgICA5MDBcbiAgICAgICAgICAxMDAwXG4gICAgICAgIFwiXCJcIlxuICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuZ2V0VmlzaWJsZVJvd1JhbmdlKCkpLnRvRXF1YWwoaW5pdGlhbFJvd1JhbmdlKVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgY3RybC1lIGFuZCBjdHJsLXkga2V5YmluZGluZ3NcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIHNjcmVlbiB1cCBhbmQgZG93biBieSBvbmUgYW5kIGtlZXBzIGN1cnNvciBvbnNjcmVlblwiLCAtPlxuICAgICAgICBlbnN1cmUgJ2N0cmwtZScsIGN1cnNvcjogWzIsIDJdXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Rmlyc3RWaXNpYmxlU2NyZWVuUm93KCkpLnRvQmUgMVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCkpLnRvQmUgNlxuXG4gICAgICAgIGVuc3VyZSAnMiBjdHJsLWUnLCBjdXJzb3I6IFs0LCAyXVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpKS50b0JlIDNcbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRMYXN0VmlzaWJsZVNjcmVlblJvdygpKS50b0JlIDhcblxuICAgICAgICBlbnN1cmUgJzIgY3RybC15JywgY3Vyc29yOiBbMiwgMl1cbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKSkudG9CZSAxXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKSkudG9CZSA2XG5cbiAgZGVzY3JpYmUgXCJzY3JvbGwgY3Vyc29yIGtleWJpbmRpbmdzXCIsIC0+XG4gICAgYmVmb3JlRWFjaCAtPlxuICAgICAgZWRpdG9yLnNldFRleHQgWzEuLjIwMF0uam9pbihcIlxcblwiKVxuICAgICAgZWRpdG9yRWxlbWVudC5zdHlsZS5saW5lSGVpZ2h0ID0gXCIyMHB4XCJcblxuICAgICAgZWRpdG9yRWxlbWVudC5zZXRIZWlnaHQoMjAgKiAxMClcblxuICAgICAgaWYgZWRpdG9yRWxlbWVudC5tZWFzdXJlRGltZW5zaW9ucz9cbiAgICAgICAgIyBGb3IgQXRvbS12MS4xOVxuICAgICAgICBlZGl0b3JFbGVtZW50Lm1lYXN1cmVEaW1lbnNpb25zKClcbiAgICAgIGVsc2UgIyBGb3IgQXRvbS12MS4xOFxuICAgICAgICAjIFtUT0RPXSBSZW1vdmUgd2hlbiB2LjEuMTkgYmVjb21lIHN0YWJsZVxuICAgICAgICBlZGl0b3JFbGVtZW50LmNvbXBvbmVudC5zYW1wbGVGb250U3R5bGluZygpXG5cbiAgICAgIHNweU9uKGVkaXRvciwgJ21vdmVUb0ZpcnN0Q2hhcmFjdGVyT2ZMaW5lJylcbiAgICAgIHNweU9uKGVkaXRvckVsZW1lbnQsICdzZXRTY3JvbGxUb3AnKVxuICAgICAgc3B5T24oZWRpdG9yRWxlbWVudCwgJ2dldEZpcnN0VmlzaWJsZVNjcmVlblJvdycpLmFuZFJldHVybig5MClcbiAgICAgIHNweU9uKGVkaXRvckVsZW1lbnQsICdnZXRMYXN0VmlzaWJsZVNjcmVlblJvdycpLmFuZFJldHVybigxMTApXG4gICAgICBzcHlPbihlZGl0b3JFbGVtZW50LCAncGl4ZWxQb3NpdGlvbkZvclNjcmVlblBvc2l0aW9uJykuYW5kUmV0dXJuKHt0b3A6IDEwMDAsIGxlZnQ6IDB9KVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgejxDUj4ga2V5YmluZGluZ1wiLCAtPlxuICAgICAgaXQgXCJtb3ZlcyB0aGUgc2NyZWVuIHRvIHBvc2l0aW9uIGN1cnNvciBhdCB0aGUgdG9wIG9mIHRoZSB3aW5kb3cgYW5kIG1vdmVzIGN1cnNvciB0byBmaXJzdCBub24tYmxhbmsgaW4gdGhlIGxpbmVcIiwgLT5cbiAgICAgICAga2V5c3Ryb2tlICd6IGVudGVyJ1xuICAgICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3ApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDk2MClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICBkZXNjcmliZSBcInRoZSB6dCBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBzY3JlZW4gdG8gcG9zaXRpb24gY3Vyc29yIGF0IHRoZSB0b3Agb2YgdGhlIHdpbmRvdyBhbmQgbGVhdmUgY3Vyc29yIGluIHRoZSBzYW1lIGNvbHVtblwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ3ogdCdcbiAgICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg5NjApXG4gICAgICAgIGV4cGVjdChlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlIFwidGhlIHouIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIHNjcmVlbiB0byBwb3NpdGlvbiBjdXJzb3IgYXQgdGhlIGNlbnRlciBvZiB0aGUgd2luZG93IGFuZCBtb3ZlcyBjdXJzb3IgdG8gZmlyc3Qgbm9uLWJsYW5rIGluIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAneiAuJ1xuICAgICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3ApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDkwMClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICBkZXNjcmliZSBcInRoZSB6eiBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBzY3JlZW4gdG8gcG9zaXRpb24gY3Vyc29yIGF0IHRoZSBjZW50ZXIgb2YgdGhlIHdpbmRvdyBhbmQgbGVhdmUgY3Vyc29yIGluIHRoZSBzYW1lIGNvbHVtblwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ3ogeidcbiAgICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg5MDApXG4gICAgICAgIGV4cGVjdChlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlIFwidGhlIHotIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIGl0IFwibW92ZXMgdGhlIHNjcmVlbiB0byBwb3NpdGlvbiBjdXJzb3IgYXQgdGhlIGJvdHRvbSBvZiB0aGUgd2luZG93IGFuZCBtb3ZlcyBjdXJzb3IgdG8gZmlyc3Qgbm9uLWJsYW5rIGluIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIGtleXN0cm9rZSAneiAtJ1xuICAgICAgICBleHBlY3QoZWRpdG9yRWxlbWVudC5zZXRTY3JvbGxUb3ApLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKDg2MClcbiAgICAgICAgZXhwZWN0KGVkaXRvci5tb3ZlVG9GaXJzdENoYXJhY3Rlck9mTGluZSkudG9IYXZlQmVlbkNhbGxlZCgpXG5cbiAgICBkZXNjcmliZSBcInRoZSB6YiBrZXliaW5kaW5nXCIsIC0+XG4gICAgICBpdCBcIm1vdmVzIHRoZSBzY3JlZW4gdG8gcG9zaXRpb24gY3Vyc29yIGF0IHRoZSBib3R0b20gb2YgdGhlIHdpbmRvdyBhbmQgbGVhdmUgY3Vyc29yIGluIHRoZSBzYW1lIGNvbHVtblwiLCAtPlxuICAgICAgICBrZXlzdHJva2UgJ3ogYidcbiAgICAgICAgZXhwZWN0KGVkaXRvckVsZW1lbnQuc2V0U2Nyb2xsVG9wKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCg4NjApXG4gICAgICAgIGV4cGVjdChlZGl0b3IubW92ZVRvRmlyc3RDaGFyYWN0ZXJPZkxpbmUpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKClcblxuICBkZXNjcmliZSBcImhvcml6b250YWwgc2Nyb2xsIGN1cnNvciBrZXliaW5kaW5nc1wiLCAtPlxuICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgIGVkaXRvckVsZW1lbnQuc2V0V2lkdGgoNjAwKVxuICAgICAgZWRpdG9yRWxlbWVudC5zZXRIZWlnaHQoNjAwKVxuICAgICAgZWRpdG9yRWxlbWVudC5zdHlsZS5saW5lSGVpZ2h0ID0gXCIxMHB4XCJcbiAgICAgIGVkaXRvckVsZW1lbnQuc3R5bGUuZm9udCA9IFwiMTZweCBtb25vc3BhY2VcIlxuXG4gICAgICBpZiBlZGl0b3JFbGVtZW50Lm1lYXN1cmVEaW1lbnNpb25zP1xuICAgICAgICAjIEZvciBBdG9tLXYxLjE5XG4gICAgICAgIGVkaXRvckVsZW1lbnQubWVhc3VyZURpbWVuc2lvbnMoKVxuICAgICAgZWxzZSAjIEZvciBBdG9tLXYxLjE4XG4gICAgICAgICMgW1RPRE9dIFJlbW92ZSB3aGVuIHYuMS4xOSBiZWNvbWUgc3RhYmxlXG4gICAgICAgIGF0b20udmlld3MucGVyZm9ybURvY3VtZW50UG9sbCgpXG5cbiAgICAgIHRleHQgPSBcIlwiXG4gICAgICBmb3IgaSBpbiBbMTAwLi4xOTldXG4gICAgICAgIHRleHQgKz0gXCIje2l9IFwiXG4gICAgICBlZGl0b3Iuc2V0VGV4dCh0ZXh0KVxuICAgICAgZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKFswLCAwXSlcblxuICAgIGRlc2NyaWJlIFwidGhlIHpzIGtleWJpbmRpbmdcIiwgLT5cbiAgICAgIHpzUG9zID0gKHBvcykgLT5cbiAgICAgICAgZWRpdG9yLnNldEN1cnNvckJ1ZmZlclBvc2l0aW9uKFswLCBwb3NdKVxuICAgICAgICBrZXlzdHJva2UgJ3ogcydcbiAgICAgICAgZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxMZWZ0KClcblxuICAgICAgc3RhcnRQb3NpdGlvbiA9IE5hTlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBzdGFydFBvc2l0aW9uID0gZWRpdG9yRWxlbWVudC5nZXRTY3JvbGxMZWZ0KClcblxuICAgICAgIyBGSVhNRTogcmVtb3ZlIGluIGZ1dHVyZVxuICAgICAgeGl0IFwiZG9lcyBub3RoaW5nIG5lYXIgdGhlIHN0YXJ0IG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIHBvczEgPSB6c1BvcygxKVxuICAgICAgICBleHBlY3QocG9zMSkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuXG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdGhlIG5lYXJlc3QgaXQgY2FuIHRvIHRoZSBsZWZ0IGVkZ2Ugb2YgdGhlIGVkaXRvclwiLCAtPlxuICAgICAgICBwb3MxMCA9IHpzUG9zKDEwKVxuICAgICAgICBleHBlY3QocG9zMTApLnRvQmVHcmVhdGVyVGhhbihzdGFydFBvc2l0aW9uKVxuXG4gICAgICAgIHBvczExID0genNQb3MoMTEpXG4gICAgICAgIGV4cGVjdChwb3MxMSAtIHBvczEwKS50b0VxdWFsKDEwKVxuXG4gICAgICBpdCBcImRvZXMgbm90aGluZyBuZWFyIHRoZSBlbmQgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgICAgcG9zRW5kID0genNQb3MoMzk5KVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDM5OV1cblxuICAgICAgICBwb3MzOTAgPSB6c1BvcygzOTApXG4gICAgICAgIGV4cGVjdChwb3MzOTApLnRvRXF1YWwocG9zRW5kKVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDM5MF1cblxuICAgICAgICBwb3MzNDAgPSB6c1BvcygzNDApXG4gICAgICAgIGV4cGVjdChwb3MzNDApLnRvRXF1YWwocG9zRW5kKVxuXG4gICAgICBpdCBcImRvZXMgbm90aGluZyBpZiBhbGwgbGluZXMgYXJlIHNob3J0XCIsIC0+XG4gICAgICAgIGVkaXRvci5zZXRUZXh0KCdzaG9ydCcpXG4gICAgICAgIHN0YXJ0UG9zaXRpb24gPSBlZGl0b3JFbGVtZW50LmdldFNjcm9sbExlZnQoKVxuICAgICAgICBwb3MxID0genNQb3MoMSlcbiAgICAgICAgZXhwZWN0KHBvczEpLnRvRXF1YWwoc3RhcnRQb3NpdGlvbilcbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsIFswLCAxXVxuICAgICAgICBwb3MxMCA9IHpzUG9zKDEwKVxuICAgICAgICBleHBlY3QocG9zMTApLnRvRXF1YWwoc3RhcnRQb3NpdGlvbilcbiAgICAgICAgZXhwZWN0KGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKS50b0VxdWFsIFswLCA0XVxuXG4gICAgZGVzY3JpYmUgXCJ0aGUgemUga2V5YmluZGluZ1wiLCAtPlxuICAgICAgemVQb3MgPSAocG9zKSAtPlxuICAgICAgICBlZGl0b3Iuc2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oWzAsIHBvc10pXG4gICAgICAgIGtleXN0cm9rZSAneiBlJ1xuICAgICAgICBlZGl0b3JFbGVtZW50LmdldFNjcm9sbExlZnQoKVxuXG4gICAgICBzdGFydFBvc2l0aW9uID0gTmFOXG5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc3RhcnRQb3NpdGlvbiA9IGVkaXRvckVsZW1lbnQuZ2V0U2Nyb2xsTGVmdCgpXG5cbiAgICAgIGl0IFwiZG9lcyBub3RoaW5nIG5lYXIgdGhlIHN0YXJ0IG9mIHRoZSBsaW5lXCIsIC0+XG4gICAgICAgIHBvczEgPSB6ZVBvcygxKVxuICAgICAgICBleHBlY3QocG9zMSkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuXG4gICAgICAgIHBvczQwID0gemVQb3MoNDApXG4gICAgICAgIGV4cGVjdChwb3M0MCkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuXG4gICAgICBpdCBcIm1vdmVzIHRoZSBjdXJzb3IgdGhlIG5lYXJlc3QgaXQgY2FuIHRvIHRoZSByaWdodCBlZGdlIG9mIHRoZSBlZGl0b3JcIiwgLT5cbiAgICAgICAgcG9zMTEwID0gemVQb3MoMTEwKVxuICAgICAgICBleHBlY3QocG9zMTEwKS50b0JlR3JlYXRlclRoYW4oc3RhcnRQb3NpdGlvbilcblxuICAgICAgICBwb3MxMDkgPSB6ZVBvcygxMDkpXG4gICAgICAgIGV4cGVjdChwb3MxMTAgLSBwb3MxMDkpLnRvRXF1YWwoOSlcblxuICAgICAgIyBGSVhNRSBkZXNjcmlwdGlvbiBpcyBubyBsb25nZXIgYXBwcm9wcmlhdGVcbiAgICAgIGl0IFwiZG9lcyBub3RoaW5nIHdoZW4gdmVyeSBuZWFyIHRoZSBlbmQgb2YgdGhlIGxpbmVcIiwgLT5cbiAgICAgICAgcG9zRW5kID0gemVQb3MoMzk5KVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDM5OV1cblxuICAgICAgICBwb3MzOTcgPSB6ZVBvcygzOTcpXG4gICAgICAgIGV4cGVjdChwb3MzOTcpLnRvQmVMZXNzVGhhbihwb3NFbmQpXG4gICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKSkudG9FcXVhbCBbMCwgMzk3XVxuXG4gICAgICAgIHBvczM4MCA9IHplUG9zKDM4MClcbiAgICAgICAgZXhwZWN0KHBvczM4MCkudG9CZUxlc3NUaGFuKHBvc0VuZClcblxuICAgICAgICBwb3MzODIgPSB6ZVBvcygzODIpXG4gICAgICAgIGV4cGVjdChwb3MzODIgLSBwb3MzODApLnRvRXF1YWwoMTkpXG5cbiAgICAgIGl0IFwiZG9lcyBub3RoaW5nIGlmIGFsbCBsaW5lcyBhcmUgc2hvcnRcIiwgLT5cbiAgICAgICAgZWRpdG9yLnNldFRleHQoJ3Nob3J0JylcbiAgICAgICAgc3RhcnRQb3NpdGlvbiA9IGVkaXRvckVsZW1lbnQuZ2V0U2Nyb2xsTGVmdCgpXG4gICAgICAgIHBvczEgPSB6ZVBvcygxKVxuICAgICAgICBleHBlY3QocG9zMSkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDFdXG4gICAgICAgIHBvczEwID0gemVQb3MoMTApXG4gICAgICAgIGV4cGVjdChwb3MxMCkudG9FcXVhbChzdGFydFBvc2l0aW9uKVxuICAgICAgICBleHBlY3QoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpLnRvRXF1YWwgWzAsIDRdXG4iXX0=
