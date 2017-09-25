(function() {
  var CompositeDisposable, Emitter, getEditorState, ref,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ref = require('atom'), Emitter = ref.Emitter, CompositeDisposable = ref.CompositeDisposable;

  getEditorState = null;

  module.exports = {
    activate: function() {
      var self;
      this.emitter = new Emitter;
      this.subscriptions = new CompositeDisposable;
      self = this;
      this.notifiedUseExMode = atom.config.get('vim-mode-plus-ex-mode.notifiedUseExMode');
      return this.subscriptions.add(atom.commands.add('atom-text-editor:not([mini])', {
        'vim-mode-plus-ex-mode:open': function() {
          return self.toggle(this.getModel(), 'normalCommands');
        },
        'vim-mode-plus-ex-mode:toggle-setting': function() {
          return self.toggle(this.getModel(), 'toggleCommands');
        }
      }));
    },
    toggle: function(editor, commandKind) {
      if (!this.notifiedUseExMode) {
        this.notifyUseExMode();
        return;
      }
      return this.getEditorState(editor).then((function(_this) {
        return function(vimState) {
          return _this.getView().toggle(vimState, commandKind);
        };
      })(this));
    },
    notifyUseExMode: function() {
      var message;
      message = "Use [ex-mode](https://atom.io/packages/ex-mode) if you want better ex-mode then uninstall this package,";
      atom.notifications.addInfo(message, {
        dismissable: true
      });
      this.notifiedUseExMode = true;
      return atom.config.set('vim-mode-plus-ex-mode.notifiedUseExMode', this.notifiedUseExMode);
    },
    getEditorState: function(editor) {
      if (getEditorState != null) {
        return Promise.resolve(getEditorState(editor));
      } else {
        return new Promise((function(_this) {
          return function(resolve) {
            return _this.onDidConsumeVim(function() {
              return resolve(getEditorState(editor));
            });
          };
        })(this));
      }
    },
    deactivate: function() {
      var ref1, ref2;
      this.subscriptions.dispose();
      if ((ref1 = this.view) != null) {
        if (typeof ref1.destroy === "function") {
          ref1.destroy();
        }
      }
      return ref2 = {}, this.subscriptions = ref2.subscriptions, this.view = ref2.view, ref2;
    },
    getView: function() {
      return this.view != null ? this.view : this.view = new (require('./view'));
    },
    onDidConsumeVim: function(fn) {
      return this.emitter.on('did-consume-vim', fn);
    },
    consumeVim: function(service) {
      var Base, Motion, MoveToLineAndColumn;
      getEditorState = service.getEditorState, Base = service.Base;
      Motion = MoveToLineAndColumn = (function(superClass) {
        extend(MoveToLineAndColumn, superClass);

        function MoveToLineAndColumn() {
          return MoveToLineAndColumn.__super__.constructor.apply(this, arguments);
        }

        MoveToLineAndColumn.extend();

        MoveToLineAndColumn.commandPrefix = 'vim-mode-plus-user';

        MoveToLineAndColumn.prototype.wise = 'characterwise';

        MoveToLineAndColumn.prototype.column = null;

        MoveToLineAndColumn.prototype.moveCursor = function(cursor) {
          var point;
          MoveToLineAndColumn.__super__.moveCursor.apply(this, arguments);
          point = [cursor.getBufferRow(), this.column - 1];
          return cursor.setBufferPosition(point);
        };

        return MoveToLineAndColumn;

      })(Base.getClass('MoveToFirstLine'));
      return this.emitter.emit('did-consume-vim');
    }
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzLWV4LW1vZGUvbGliL21haW4uY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQSxpREFBQTtJQUFBOzs7RUFBQSxNQUFpQyxPQUFBLENBQVEsTUFBUixDQUFqQyxFQUFDLHFCQUFELEVBQVU7O0VBQ1YsY0FBQSxHQUFpQjs7RUFFakIsTUFBTSxDQUFDLE9BQVAsR0FDRTtJQUFBLFFBQUEsRUFBVSxTQUFBO0FBQ1IsVUFBQTtNQUFBLElBQUMsQ0FBQSxPQUFELEdBQVcsSUFBSTtNQUNmLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUk7TUFDckIsSUFBQSxHQUFPO01BQ1AsSUFBQyxDQUFBLGlCQUFELEdBQXFCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBWixDQUFnQix5Q0FBaEI7YUFFckIsSUFBQyxDQUFBLGFBQWEsQ0FBQyxHQUFmLENBQW1CLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBZCxDQUFrQiw4QkFBbEIsRUFDakI7UUFBQSw0QkFBQSxFQUE4QixTQUFBO2lCQUM1QixJQUFJLENBQUMsTUFBTCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBWixFQUF5QixnQkFBekI7UUFENEIsQ0FBOUI7UUFFQSxzQ0FBQSxFQUF3QyxTQUFBO2lCQUN0QyxJQUFJLENBQUMsTUFBTCxDQUFZLElBQUMsQ0FBQSxRQUFELENBQUEsQ0FBWixFQUF5QixnQkFBekI7UUFEc0MsQ0FGeEM7T0FEaUIsQ0FBbkI7SUFOUSxDQUFWO0lBWUEsTUFBQSxFQUFRLFNBQUMsTUFBRCxFQUFTLFdBQVQ7TUFDTixJQUFBLENBQU8sSUFBQyxDQUFBLGlCQUFSO1FBQ0UsSUFBQyxDQUFBLGVBQUQsQ0FBQTtBQUNBLGVBRkY7O2FBSUEsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEIsQ0FBdUIsQ0FBQyxJQUF4QixDQUE2QixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsUUFBRDtpQkFDM0IsS0FBQyxDQUFBLE9BQUQsQ0FBQSxDQUFVLENBQUMsTUFBWCxDQUFrQixRQUFsQixFQUE0QixXQUE1QjtRQUQyQjtNQUFBLENBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBN0I7SUFMTSxDQVpSO0lBb0JBLGVBQUEsRUFBaUIsU0FBQTtBQUNmLFVBQUE7TUFBQSxPQUFBLEdBQVU7TUFHVixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQW5CLENBQTJCLE9BQTNCLEVBQW9DO1FBQUEsV0FBQSxFQUFhLElBQWI7T0FBcEM7TUFDQSxJQUFDLENBQUEsaUJBQUQsR0FBcUI7YUFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHlDQUFoQixFQUEyRCxJQUFDLENBQUEsaUJBQTVEO0lBTmUsQ0FwQmpCO0lBNEJBLGNBQUEsRUFBZ0IsU0FBQyxNQUFEO01BQ2QsSUFBRyxzQkFBSDtlQUNFLE9BQU8sQ0FBQyxPQUFSLENBQWdCLGNBQUEsQ0FBZSxNQUFmLENBQWhCLEVBREY7T0FBQSxNQUFBO2VBR00sSUFBQSxPQUFBLENBQVEsQ0FBQSxTQUFBLEtBQUE7aUJBQUEsU0FBQyxPQUFEO21CQUNWLEtBQUMsQ0FBQSxlQUFELENBQWlCLFNBQUE7cUJBQ2YsT0FBQSxDQUFRLGNBQUEsQ0FBZSxNQUFmLENBQVI7WUFEZSxDQUFqQjtVQURVO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFSLEVBSE47O0lBRGMsQ0E1QmhCO0lBb0NBLFVBQUEsRUFBWSxTQUFBO0FBQ1YsVUFBQTtNQUFBLElBQUMsQ0FBQSxhQUFhLENBQUMsT0FBZixDQUFBOzs7Y0FDSyxDQUFFOzs7YUFDUCxPQUEwQixFQUExQixFQUFDLElBQUMsQ0FBQSxxQkFBQSxhQUFGLEVBQWlCLElBQUMsQ0FBQSxZQUFBLElBQWxCLEVBQUE7SUFIVSxDQXBDWjtJQXlDQSxPQUFBLEVBQVMsU0FBQTtpQ0FDUCxJQUFDLENBQUEsT0FBRCxJQUFDLENBQUEsT0FBUSxJQUFJLENBQUMsT0FBQSxDQUFRLFFBQVIsQ0FBRDtJQUROLENBekNUO0lBNENBLGVBQUEsRUFBaUIsU0FBQyxFQUFEO2FBQ2YsSUFBQyxDQUFBLE9BQU8sQ0FBQyxFQUFULENBQVksaUJBQVosRUFBK0IsRUFBL0I7SUFEZSxDQTVDakI7SUErQ0EsVUFBQSxFQUFZLFNBQUMsT0FBRDtBQUNWLFVBQUE7TUFBQyx1Q0FBRCxFQUFpQjtNQUNqQixNQUFBLEdBR007Ozs7Ozs7UUFDSixtQkFBQyxDQUFBLE1BQUQsQ0FBQTs7UUFDQSxtQkFBQyxDQUFBLGFBQUQsR0FBZ0I7O3NDQUNoQixJQUFBLEdBQU07O3NDQUNOLE1BQUEsR0FBUTs7c0NBRVIsVUFBQSxHQUFZLFNBQUMsTUFBRDtBQUNWLGNBQUE7VUFBQSxxREFBQSxTQUFBO1VBQ0EsS0FBQSxHQUFRLENBQUMsTUFBTSxDQUFDLFlBQVAsQ0FBQSxDQUFELEVBQXdCLElBQUMsQ0FBQSxNQUFELEdBQVUsQ0FBbEM7aUJBQ1IsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEtBQXpCO1FBSFU7Ozs7U0FOb0IsSUFBSSxDQUFDLFFBQUwsQ0FBYyxpQkFBZDthQVdsQyxJQUFDLENBQUEsT0FBTyxDQUFDLElBQVQsQ0FBYyxpQkFBZDtJQWhCVSxDQS9DWjs7QUFKRiIsInNvdXJjZXNDb250ZW50IjpbIntFbWl0dGVyLCBDb21wb3NpdGVEaXNwb3NhYmxlfSA9IHJlcXVpcmUgJ2F0b20nXG5nZXRFZGl0b3JTdGF0ZSA9IG51bGxcblxubW9kdWxlLmV4cG9ydHMgPVxuICBhY3RpdmF0ZTogLT5cbiAgICBAZW1pdHRlciA9IG5ldyBFbWl0dGVyXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIHNlbGYgPSB0aGlzXG4gICAgQG5vdGlmaWVkVXNlRXhNb2RlID0gYXRvbS5jb25maWcuZ2V0KCd2aW0tbW9kZS1wbHVzLWV4LW1vZGUubm90aWZpZWRVc2VFeE1vZGUnKVxuXG4gICAgQHN1YnNjcmlwdGlvbnMuYWRkIGF0b20uY29tbWFuZHMuYWRkICdhdG9tLXRleHQtZWRpdG9yOm5vdChbbWluaV0pJyxcbiAgICAgICd2aW0tbW9kZS1wbHVzLWV4LW1vZGU6b3Blbic6IC0+XG4gICAgICAgIHNlbGYudG9nZ2xlKEBnZXRNb2RlbCgpLCAnbm9ybWFsQ29tbWFuZHMnKVxuICAgICAgJ3ZpbS1tb2RlLXBsdXMtZXgtbW9kZTp0b2dnbGUtc2V0dGluZyc6IC0+XG4gICAgICAgIHNlbGYudG9nZ2xlKEBnZXRNb2RlbCgpLCAndG9nZ2xlQ29tbWFuZHMnKVxuXG4gIHRvZ2dsZTogKGVkaXRvciwgY29tbWFuZEtpbmQpIC0+XG4gICAgdW5sZXNzIEBub3RpZmllZFVzZUV4TW9kZVxuICAgICAgQG5vdGlmeVVzZUV4TW9kZSgpXG4gICAgICByZXR1cm5cblxuICAgIEBnZXRFZGl0b3JTdGF0ZShlZGl0b3IpLnRoZW4gKHZpbVN0YXRlKSA9PlxuICAgICAgQGdldFZpZXcoKS50b2dnbGUodmltU3RhdGUsIGNvbW1hbmRLaW5kKVxuXG4gIG5vdGlmeVVzZUV4TW9kZTogLT5cbiAgICBtZXNzYWdlID0gXCJcIlwiXG4gICAgVXNlIFtleC1tb2RlXShodHRwczovL2F0b20uaW8vcGFja2FnZXMvZXgtbW9kZSkgaWYgeW91IHdhbnQgYmV0dGVyIGV4LW1vZGUgdGhlbiB1bmluc3RhbGwgdGhpcyBwYWNrYWdlLFxuICAgIFwiXCJcIlxuICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKG1lc3NhZ2UsIGRpc21pc3NhYmxlOiB0cnVlKVxuICAgIEBub3RpZmllZFVzZUV4TW9kZSA9IHRydWVcbiAgICBhdG9tLmNvbmZpZy5zZXQoJ3ZpbS1tb2RlLXBsdXMtZXgtbW9kZS5ub3RpZmllZFVzZUV4TW9kZScsIEBub3RpZmllZFVzZUV4TW9kZSlcblxuICBnZXRFZGl0b3JTdGF0ZTogKGVkaXRvcikgLT5cbiAgICBpZiBnZXRFZGl0b3JTdGF0ZT9cbiAgICAgIFByb21pc2UucmVzb2x2ZShnZXRFZGl0b3JTdGF0ZShlZGl0b3IpKVxuICAgIGVsc2VcbiAgICAgIG5ldyBQcm9taXNlIChyZXNvbHZlKSA9PlxuICAgICAgICBAb25EaWRDb25zdW1lVmltIC0+XG4gICAgICAgICAgcmVzb2x2ZShnZXRFZGl0b3JTdGF0ZShlZGl0b3IpKVxuXG4gIGRlYWN0aXZhdGU6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHZpZXc/LmRlc3Ryb3k/KClcbiAgICB7QHN1YnNjcmlwdGlvbnMsIEB2aWV3fSA9IHt9XG5cbiAgZ2V0VmlldzogLT5cbiAgICBAdmlldyA/PSBuZXcgKHJlcXVpcmUoJy4vdmlldycpKVxuXG4gIG9uRGlkQ29uc3VtZVZpbTogKGZuKSAtPlxuICAgIEBlbWl0dGVyLm9uKCdkaWQtY29uc3VtZS12aW0nLCBmbilcblxuICBjb25zdW1lVmltOiAoc2VydmljZSkgLT5cbiAgICB7Z2V0RWRpdG9yU3RhdGUsIEJhc2V9ID0gc2VydmljZVxuICAgIE1vdGlvbiA9XG5cbiAgICAjIGtleW1hcDogZyBnXG4gICAgY2xhc3MgTW92ZVRvTGluZUFuZENvbHVtbiBleHRlbmRzIEJhc2UuZ2V0Q2xhc3MoJ01vdmVUb0ZpcnN0TGluZScpXG4gICAgICBAZXh0ZW5kKClcbiAgICAgIEBjb21tYW5kUHJlZml4OiAndmltLW1vZGUtcGx1cy11c2VyJ1xuICAgICAgd2lzZTogJ2NoYXJhY3Rlcndpc2UnXG4gICAgICBjb2x1bW46IG51bGxcblxuICAgICAgbW92ZUN1cnNvcjogKGN1cnNvcikgLT5cbiAgICAgICAgc3VwZXJcbiAgICAgICAgcG9pbnQgPSBbY3Vyc29yLmdldEJ1ZmZlclJvdygpLCBAY29sdW1uIC0gMV1cbiAgICAgICAgY3Vyc29yLnNldEJ1ZmZlclBvc2l0aW9uKHBvaW50KVxuXG4gICAgQGVtaXR0ZXIuZW1pdCgnZGlkLWNvbnN1bWUtdmltJylcbiJdfQ==
