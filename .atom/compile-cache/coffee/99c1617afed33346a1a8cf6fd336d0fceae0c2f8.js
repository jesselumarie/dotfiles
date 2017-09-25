(function() {
  var TextData, dispatch, getView, getVimState, ref, settings, withMockPlatform;

  ref = require('./spec-helper'), getVimState = ref.getVimState, dispatch = ref.dispatch, TextData = ref.TextData, getView = ref.getView, withMockPlatform = ref.withMockPlatform;

  settings = require('../lib/settings');

  describe("Operator modifier", function() {
    var editor, editorElement, ensure, keystroke, ref1, set, vimState;
    ref1 = [], set = ref1[0], ensure = ref1[1], keystroke = ref1[2], editor = ref1[3], editorElement = ref1[4], vimState = ref1[5];
    beforeEach(function() {
      getVimState(function(state, vim) {
        vimState = state;
        editor = vimState.editor, editorElement = vimState.editorElement;
        return set = vim.set, ensure = vim.ensure, keystroke = vim.keystroke, vim;
      });
      return runs(function() {
        return jasmine.attachToDOM(editorElement);
      });
    });
    return describe("operator-modifier to force wise", function() {
      beforeEach(function() {
        return set({
          text: "012345 789\nABCDEF EFG"
        });
      });
      describe("operator-modifier-characterwise", function() {
        describe("when target is linewise", function() {
          return it("operate characterwisely and exclusively", function() {
            set({
              cursor: [0, 1]
            });
            return ensure("d v j", {
              text: "0BCDEF EFG"
            });
          });
        });
        return describe("when target is characterwise", function() {
          it("operate inclusively for exclusive target", function() {
            set({
              cursor: [0, 9]
            });
            return ensure("d v b", {
              cursor: [0, 6],
              text_: "012345_\nABCDEF EFG"
            });
          });
          return it("operate exclusively for inclusive target", function() {
            set({
              cursor: [0, 0]
            });
            return ensure("d v e", {
              cursor: [0, 0],
              text: "5 789\nABCDEF EFG"
            });
          });
        });
      });
      return describe("operator-modifier-linewise", function() {
        return it("operate linewisely for characterwise target", function() {
          set({
            cursor: [0, 1]
          });
          return ensure('d V / DEF enter', {
            cursor: [0, 0],
            text: ""
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvb3BlcmF0b3ItbW9kaWZpZXItc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLE1BQStELE9BQUEsQ0FBUSxlQUFSLENBQS9ELEVBQUMsNkJBQUQsRUFBYyx1QkFBZCxFQUF3Qix1QkFBeEIsRUFBa0MscUJBQWxDLEVBQTJDOztFQUMzQyxRQUFBLEdBQVcsT0FBQSxDQUFRLGlCQUFSOztFQUVYLFFBQUEsQ0FBUyxtQkFBVCxFQUE4QixTQUFBO0FBQzVCLFFBQUE7SUFBQSxPQUE0RCxFQUE1RCxFQUFDLGFBQUQsRUFBTSxnQkFBTixFQUFjLG1CQUFkLEVBQXlCLGdCQUF6QixFQUFpQyx1QkFBakMsRUFBZ0Q7SUFFaEQsVUFBQSxDQUFXLFNBQUE7TUFDVCxXQUFBLENBQVksU0FBQyxLQUFELEVBQVEsR0FBUjtRQUNWLFFBQUEsR0FBVztRQUNWLHdCQUFELEVBQVM7ZUFDUixhQUFELEVBQU0sbUJBQU4sRUFBYyx5QkFBZCxFQUEyQjtNQUhqQixDQUFaO2FBS0EsSUFBQSxDQUFLLFNBQUE7ZUFDSCxPQUFPLENBQUMsV0FBUixDQUFvQixhQUFwQjtNQURHLENBQUw7SUFOUyxDQUFYO1dBU0EsUUFBQSxDQUFTLGlDQUFULEVBQTRDLFNBQUE7TUFDMUMsVUFBQSxDQUFXLFNBQUE7ZUFDVCxHQUFBLENBQ0U7VUFBQSxJQUFBLEVBQU0sd0JBQU47U0FERjtNQURTLENBQVg7TUFNQSxRQUFBLENBQVMsaUNBQVQsRUFBNEMsU0FBQTtRQUMxQyxRQUFBLENBQVMseUJBQVQsRUFBb0MsU0FBQTtpQkFDbEMsRUFBQSxDQUFHLHlDQUFILEVBQThDLFNBQUE7WUFDNUMsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxJQUFBLEVBQU0sWUFBTjthQURGO1VBRjRDLENBQTlDO1FBRGtDLENBQXBDO2VBT0EsUUFBQSxDQUFTLDhCQUFULEVBQXlDLFNBQUE7VUFDdkMsRUFBQSxDQUFHLDBDQUFILEVBQStDLFNBQUE7WUFDN0MsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2NBQ0EsS0FBQSxFQUFPLHFCQURQO2FBREY7VUFGNkMsQ0FBL0M7aUJBUUEsRUFBQSxDQUFHLDBDQUFILEVBQStDLFNBQUE7WUFDN0MsR0FBQSxDQUFJO2NBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjthQUFKO21CQUNBLE1BQUEsQ0FBTyxPQUFQLEVBQ0U7Y0FBQSxNQUFBLEVBQVEsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFSO2NBQ0EsSUFBQSxFQUFNLG1CQUROO2FBREY7VUFGNkMsQ0FBL0M7UUFUdUMsQ0FBekM7TUFSMEMsQ0FBNUM7YUF5QkEsUUFBQSxDQUFTLDRCQUFULEVBQXVDLFNBQUE7ZUFDckMsRUFBQSxDQUFHLDZDQUFILEVBQWtELFNBQUE7VUFDaEQsR0FBQSxDQUFJO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtXQUFKO2lCQUNBLE1BQUEsQ0FBTyxpQkFBUCxFQUNFO1lBQUEsTUFBQSxFQUFRLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBUjtZQUNBLElBQUEsRUFBTSxFQUROO1dBREY7UUFGZ0QsQ0FBbEQ7TUFEcUMsQ0FBdkM7SUFoQzBDLENBQTVDO0VBWjRCLENBQTlCO0FBSEEiLCJzb3VyY2VzQ29udGVudCI6WyJ7Z2V0VmltU3RhdGUsIGRpc3BhdGNoLCBUZXh0RGF0YSwgZ2V0Vmlldywgd2l0aE1vY2tQbGF0Zm9ybX0gPSByZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuc2V0dGluZ3MgPSByZXF1aXJlICcuLi9saWIvc2V0dGluZ3MnXG5cbmRlc2NyaWJlIFwiT3BlcmF0b3IgbW9kaWZpZXJcIiwgLT5cbiAgW3NldCwgZW5zdXJlLCBrZXlzdHJva2UsIGVkaXRvciwgZWRpdG9yRWxlbWVudCwgdmltU3RhdGVdID0gW11cblxuICBiZWZvcmVFYWNoIC0+XG4gICAgZ2V0VmltU3RhdGUgKHN0YXRlLCB2aW0pIC0+XG4gICAgICB2aW1TdGF0ZSA9IHN0YXRlXG4gICAgICB7ZWRpdG9yLCBlZGl0b3JFbGVtZW50fSA9IHZpbVN0YXRlXG4gICAgICB7c2V0LCBlbnN1cmUsIGtleXN0cm9rZX0gPSB2aW1cblxuICAgIHJ1bnMgLT5cbiAgICAgIGphc21pbmUuYXR0YWNoVG9ET00oZWRpdG9yRWxlbWVudClcblxuICBkZXNjcmliZSBcIm9wZXJhdG9yLW1vZGlmaWVyIHRvIGZvcmNlIHdpc2VcIiwgLT5cbiAgICBiZWZvcmVFYWNoIC0+XG4gICAgICBzZXRcbiAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgIDAxMjM0NSA3ODlcbiAgICAgICAgQUJDREVGIEVGR1xuICAgICAgICBcIlwiXCJcbiAgICBkZXNjcmliZSBcIm9wZXJhdG9yLW1vZGlmaWVyLWNoYXJhY3Rlcndpc2VcIiwgLT5cbiAgICAgIGRlc2NyaWJlIFwid2hlbiB0YXJnZXQgaXMgbGluZXdpc2VcIiwgLT5cbiAgICAgICAgaXQgXCJvcGVyYXRlIGNoYXJhY3Rlcndpc2VseSBhbmQgZXhjbHVzaXZlbHlcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgICBlbnN1cmUgXCJkIHYgalwiLFxuICAgICAgICAgICAgdGV4dDogXCJcIlwiXG4gICAgICAgICAgICAwQkNERUYgRUZHXG4gICAgICAgICAgICBcIlwiXCJcbiAgICAgIGRlc2NyaWJlIFwid2hlbiB0YXJnZXQgaXMgY2hhcmFjdGVyd2lzZVwiLCAtPlxuICAgICAgICBpdCBcIm9wZXJhdGUgaW5jbHVzaXZlbHkgZm9yIGV4Y2x1c2l2ZSB0YXJnZXRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgOV1cbiAgICAgICAgICBlbnN1cmUgXCJkIHYgYlwiLFxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgNl1cbiAgICAgICAgICAgIHRleHRfOiBcIlwiXCJcbiAgICAgICAgICAgIDAxMjM0NV9cbiAgICAgICAgICAgIEFCQ0RFRiBFRkdcbiAgICAgICAgICAgIFwiXCJcIlxuICAgICAgICBpdCBcIm9wZXJhdGUgZXhjbHVzaXZlbHkgZm9yIGluY2x1c2l2ZSB0YXJnZXRcIiwgLT5cbiAgICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICBlbnN1cmUgXCJkIHYgZVwiLFxuICAgICAgICAgICAgY3Vyc29yOiBbMCwgMF1cbiAgICAgICAgICAgIHRleHQ6IFwiXCJcIlxuICAgICAgICAgICAgNSA3ODlcbiAgICAgICAgICAgIEFCQ0RFRiBFRkdcbiAgICAgICAgICAgIFwiXCJcIlxuICAgIGRlc2NyaWJlIFwib3BlcmF0b3ItbW9kaWZpZXItbGluZXdpc2VcIiwgLT5cbiAgICAgIGl0IFwib3BlcmF0ZSBsaW5ld2lzZWx5IGZvciBjaGFyYWN0ZXJ3aXNlIHRhcmdldFwiLCAtPlxuICAgICAgICBzZXQgY3Vyc29yOiBbMCwgMV1cbiAgICAgICAgZW5zdXJlICdkIFYgLyBERUYgZW50ZXInLFxuICAgICAgICAgIGN1cnNvcjogWzAsIDBdXG4gICAgICAgICAgdGV4dDogXCJcIlxuIl19
