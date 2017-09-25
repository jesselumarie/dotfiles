var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _sbDebounce = require('sb-debounce');

var _sbDebounce2 = _interopRequireDefault(_sbDebounce);

var _disposableEvent = require('disposable-event');

var _disposableEvent2 = _interopRequireDefault(_disposableEvent);

var _atom = require('atom');

var _tooltip = require('../tooltip');

var _tooltip2 = _interopRequireDefault(_tooltip);

var _helpers = require('../helpers');

var _helpers2 = require('./helpers');

var Editor = (function () {
  function Editor(textEditor) {
    var _this = this;

    _classCallCheck(this, Editor);

    this.tooltip = null;
    this.emitter = new _atom.Emitter();
    this.markers = new Map();
    this.messages = new Set();
    this.textEditor = textEditor;
    this.subscriptions = new _atom.CompositeDisposable();
    this.ignoreTooltipInvocation = false;

    this.subscriptions.add(this.emitter);
    this.subscriptions.add(atom.config.observe('linter-ui-default.showTooltip', function (showTooltip) {
      _this.showTooltip = showTooltip;
      if (!_this.showTooltip && _this.tooltip) {
        _this.removeTooltip();
      }
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.showProviderName', function (showProviderName) {
      _this.showProviderName = showProviderName;
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.showDecorations', function (showDecorations) {
      var notInitial = typeof _this.showDecorations !== 'undefined';
      _this.showDecorations = showDecorations;
      if (notInitial) {
        _this.updateGutter();
      }
    }));
    this.subscriptions.add(atom.config.observe('linter-ui-default.gutterPosition', function (gutterPosition) {
      var notInitial = typeof _this.gutterPosition !== 'undefined';
      _this.gutterPosition = gutterPosition;
      if (notInitial) {
        _this.updateGutter();
      }
    }));
    this.subscriptions.add(textEditor.onDidDestroy(function () {
      _this.dispose();
    }));

    var tooltipSubscription = undefined;
    this.subscriptions.add(atom.config.observe('linter-ui-default.tooltipFollows', function (tooltipFollows) {
      _this.tooltipFollows = tooltipFollows;
      if (tooltipSubscription) {
        tooltipSubscription.dispose();
      }
      tooltipSubscription = new _atom.CompositeDisposable();
      if (tooltipFollows === 'Mouse' || tooltipFollows === 'Both') {
        tooltipSubscription.add(_this.listenForMouseMovement());
      }
      if (tooltipFollows === 'Keyboard' || tooltipFollows === 'Both') {
        tooltipSubscription.add(_this.listenForKeyboardMovement());
      }
      _this.removeTooltip();
    }));
    this.subscriptions.add(new _atom.Disposable(function () {
      tooltipSubscription.dispose();
    }));

    var lastCursorPositions = new WeakMap();
    this.subscriptions.add(textEditor.onDidChangeCursorPosition(function (_ref) {
      var cursor = _ref.cursor;
      var newBufferPosition = _ref.newBufferPosition;

      var lastBufferPosition = lastCursorPositions.get(cursor);
      if (!lastBufferPosition || !lastBufferPosition.isEqual(newBufferPosition)) {
        lastCursorPositions.set(cursor, newBufferPosition);
        _this.ignoreTooltipInvocation = false;
      }
      if (_this.tooltipFollows === 'Mouse') {
        _this.removeTooltip();
      }
    }));
    this.subscriptions.add(textEditor.getBuffer().onDidChangeText(function () {
      var cursors = textEditor.getCursors();
      cursors.forEach(function (cursor) {
        lastCursorPositions.set(cursor, cursor.getBufferPosition());
      });
      if (_this.tooltipFollows !== 'Mouse') {
        _this.ignoreTooltipInvocation = true;
        _this.removeTooltip();
      }
    }));
    this.updateGutter();
    this.listenForCurrentLine();
  }

  _createClass(Editor, [{
    key: 'listenForCurrentLine',
    value: function listenForCurrentLine() {
      var _this2 = this;

      this.subscriptions.add(this.textEditor.observeCursors(function (cursor) {
        var marker = undefined;
        var lastRange = undefined;
        var lastEmpty = undefined;
        var handlePositionChange = function handlePositionChange(_ref2) {
          var start = _ref2.start;
          var end = _ref2.end;

          var gutter = _this2.gutter;
          if (!gutter || _this2.subscriptions.disposed) return;
          // We need that Range.fromObject hack below because when we focus index 0 on multi-line selection
          // end.column is the column of the last line but making a range out of two and then accesing
          // the end seems to fix it (black magic?)
          var currentRange = _atom.Range.fromObject([start, end]);
          var linesRange = _atom.Range.fromObject([[start.row, 0], [end.row, Infinity]]);
          var currentEmpty = currentRange.isEmpty();

          // NOTE: Atom does not paint gutter if multi-line and last line has zero index
          if (start.row !== end.row && currentRange.end.column === 0) {
            linesRange.end.row--;
          }
          if (lastRange && lastRange.isEqual(linesRange) && currentEmpty === lastEmpty) return;
          if (marker) marker.destroy();
          lastRange = linesRange;
          lastEmpty = currentEmpty;

          marker = _this2.textEditor.markScreenRange(linesRange, {
            invalidate: 'never'
          });
          var item = document.createElement('span');
          item.className = 'line-number cursor-line linter-cursor-line ' + (currentEmpty ? 'cursor-line-no-selection' : '');
          gutter.decorateMarker(marker, {
            item: item,
            'class': 'linter-row'
          });
        };

        var cursorMarker = cursor.getMarker();
        var subscriptions = new _atom.CompositeDisposable();
        subscriptions.add(cursorMarker.onDidChange(function (_ref3) {
          var newHeadScreenPosition = _ref3.newHeadScreenPosition;
          var newTailScreenPosition = _ref3.newTailScreenPosition;

          handlePositionChange({ start: newHeadScreenPosition, end: newTailScreenPosition });
        }));
        subscriptions.add(cursor.onDidDestroy(function () {
          _this2.subscriptions.remove(subscriptions);
          subscriptions.dispose();
        }));
        subscriptions.add(new _atom.Disposable(function () {
          if (marker) marker.destroy();
        }));
        _this2.subscriptions.add(subscriptions);
        handlePositionChange(cursorMarker.getScreenRange());
      }));
    }
  }, {
    key: 'listenForMouseMovement',
    value: function listenForMouseMovement() {
      var _this3 = this;

      var editorElement = atom.views.getView(this.textEditor);

      return (0, _disposableEvent2['default'])(editorElement, 'mousemove', (0, _sbDebounce2['default'])(function (event) {
        if (!editorElement.component || _this3.subscriptions.disposed || !(0, _helpers2.hasParent)(event.target, 'div.scroll-view')) {
          return;
        }
        var tooltip = _this3.tooltip;
        if (tooltip && (0, _helpers2.mouseEventNearPosition)({
          event: event,
          editor: _this3.textEditor,
          editorElement: editorElement,
          tooltipElement: tooltip.element,
          screenPosition: tooltip.marker.getStartScreenPosition()
        })) {
          return;
        }

        _this3.cursorPosition = (0, _helpers2.getBufferPositionFromMouseEvent)(event, _this3.textEditor, editorElement);
        _this3.ignoreTooltipInvocation = false;
        if (_this3.textEditor.largeFileMode) {
          // NOTE: Ignore if file is too large
          _this3.cursorPosition = null;
        }
        if (_this3.cursorPosition) {
          _this3.updateTooltip(_this3.cursorPosition);
        } else {
          _this3.removeTooltip();
        }
      }, 300, true));
    }
  }, {
    key: 'listenForKeyboardMovement',
    value: function listenForKeyboardMovement() {
      var _this4 = this;

      return this.textEditor.onDidChangeCursorPosition((0, _sbDebounce2['default'])(function (_ref4) {
        var newBufferPosition = _ref4.newBufferPosition;

        _this4.cursorPosition = newBufferPosition;
        _this4.updateTooltip(newBufferPosition);
      }, 16));
    }
  }, {
    key: 'updateGutter',
    value: function updateGutter() {
      var _this5 = this;

      this.removeGutter();
      if (!this.showDecorations) {
        this.gutter = null;
        return;
      }
      var priority = this.gutterPosition === 'Left' ? -100 : 100;
      this.gutter = this.textEditor.addGutter({
        name: 'linter-ui-default',
        priority: priority
      });
      this.markers.forEach(function (marker, message) {
        _this5.decorateMarker(message, marker, 'gutter');
      });
    }
  }, {
    key: 'removeGutter',
    value: function removeGutter() {
      if (this.gutter) {
        try {
          this.gutter.destroy();
        } catch (_) {
          /* This throws when the text editor is disposed */
        }
      }
    }
  }, {
    key: 'updateTooltip',
    value: function updateTooltip(position) {
      var _this6 = this;

      if (!position || this.tooltip && this.tooltip.isValid(position, this.messages)) {
        return;
      }
      this.removeTooltip();
      if (!this.showTooltip) {
        return;
      }
      if (this.ignoreTooltipInvocation) {
        return;
      }

      var messages = (0, _helpers.filterMessagesByRangeOrPoint)(this.messages, this.textEditor.getPath(), position);
      if (!messages.length) {
        return;
      }

      this.tooltip = new _tooltip2['default'](messages, position, this.textEditor);
      this.tooltip.onDidDestroy(function () {
        _this6.tooltip = null;
      });
    }
  }, {
    key: 'removeTooltip',
    value: function removeTooltip() {
      if (this.tooltip) {
        this.tooltip.marker.destroy();
      }
    }
  }, {
    key: 'apply',
    value: function apply(added, removed) {
      var _this7 = this;

      var textBuffer = this.textEditor.getBuffer();

      for (var i = 0, _length = removed.length; i < _length; i++) {
        var message = removed[i];
        var marker = this.markers.get(message);
        if (marker) {
          marker.destroy();
        }
        this.messages['delete'](message);
        this.markers['delete'](message);
      }

      var _loop = function (i, _length2) {
        var message = added[i];
        var markerRange = (0, _helpers.$range)(message);
        if (!markerRange) {
          // Only for backward compatibility
          return 'continue';
        }
        var marker = textBuffer.markRange(markerRange, {
          invalidate: 'never'
        });
        _this7.markers.set(message, marker);
        _this7.messages.add(message);
        marker.onDidChange(function (_ref5) {
          var oldHeadPosition = _ref5.oldHeadPosition;
          var newHeadPosition = _ref5.newHeadPosition;
          var isValid = _ref5.isValid;

          if (!isValid || newHeadPosition.row === 0 && oldHeadPosition.row !== 0) {
            return;
          }
          if (message.version === 1) {
            message.range = marker.previousEventState.range;
          } else {
            message.location.position = marker.previousEventState.range;
          }
        });
        _this7.decorateMarker(message, marker);
      };

      for (var i = 0, _length2 = added.length; i < _length2; i++) {
        var _ret = _loop(i, _length2);

        if (_ret === 'continue') continue;
      }

      this.updateTooltip(this.cursorPosition);
    }
  }, {
    key: 'decorateMarker',
    value: function decorateMarker(message, marker) {
      var paint = arguments.length <= 2 || arguments[2] === undefined ? 'both' : arguments[2];

      if (paint === 'both' || paint === 'editor') {
        this.textEditor.decorateMarker(marker, {
          type: 'highlight',
          'class': 'linter-highlight linter-' + message.severity
        });
      }

      var gutter = this.gutter;
      if (gutter && (paint === 'both' || paint === 'gutter')) {
        var element = document.createElement('span');
        element.className = 'linter-gutter linter-highlight linter-' + message.severity + ' icon icon-' + (message.icon || 'primitive-dot');
        gutter.decorateMarker(marker, {
          'class': 'linter-row',
          item: element
        });
      }
    }
  }, {
    key: 'onDidDestroy',
    value: function onDidDestroy(callback) {
      return this.emitter.on('did-destroy', callback);
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      this.emitter.emit('did-destroy');
      this.subscriptions.dispose();
      this.removeGutter();
      this.removeTooltip();
    }
  }]);

  return Editor;
})();

module.exports = Editor;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvLmF0b20vcGFja2FnZXMvbGludGVyLXVpLWRlZmF1bHQvbGliL2VkaXRvci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7MEJBRXFCLGFBQWE7Ozs7K0JBQ04sa0JBQWtCOzs7O29CQUNrQixNQUFNOzt1QkFHbEQsWUFBWTs7Ozt1QkFDcUIsWUFBWTs7d0JBQ2tCLFdBQVc7O0lBR3hGLE1BQU07QUFnQkMsV0FoQlAsTUFBTSxDQWdCRSxVQUFzQixFQUFFOzs7MEJBaEJoQyxNQUFNOztBQWlCUixRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQTtBQUNuQixRQUFJLENBQUMsT0FBTyxHQUFHLG1CQUFhLENBQUE7QUFDNUIsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0FBQ3hCLFFBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUN6QixRQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQTtBQUM1QixRQUFJLENBQUMsYUFBYSxHQUFHLCtCQUF5QixDQUFBO0FBQzlDLFFBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUE7O0FBRXBDLFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtBQUNwQyxRQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsRUFBRSxVQUFDLFdBQVcsRUFBSztBQUMzRixZQUFLLFdBQVcsR0FBRyxXQUFXLENBQUE7QUFDOUIsVUFBSSxDQUFDLE1BQUssV0FBVyxJQUFJLE1BQUssT0FBTyxFQUFFO0FBQ3JDLGNBQUssYUFBYSxFQUFFLENBQUE7T0FDckI7S0FDRixDQUFDLENBQUMsQ0FBQTtBQUNILFFBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFD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bGUiOiIvVXNlcnMvamVzc2VsdW1hcmllLy5hdG9tL3BhY2thZ2VzL2xpbnRlci11aS1kZWZhdWx0L2xpYi9lZGl0b3IvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBAZmxvdyAqL1xuXG5pbXBvcnQgZGVib3VuY2UgZnJvbSAnc2ItZGVib3VuY2UnXG5pbXBvcnQgZGlzcG9zYWJsZUV2ZW50IGZyb20gJ2Rpc3Bvc2FibGUtZXZlbnQnXG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBFbWl0dGVyLCBSYW5nZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgdHlwZSB7IFRleHRFZGl0b3IsIEJ1ZmZlck1hcmtlciwgVGV4dEVkaXRvckd1dHRlciwgUG9pbnQgfSBmcm9tICdhdG9tJ1xuXG5pbXBvcnQgVG9vbHRpcCBmcm9tICcuLi90b29sdGlwJ1xuaW1wb3J0IHsgJHJhbmdlLCBmaWx0ZXJNZXNzYWdlc0J5UmFuZ2VPclBvaW50IH0gZnJvbSAnLi4vaGVscGVycydcbmltcG9ydCB7IGhhc1BhcmVudCwgbW91c2VFdmVudE5lYXJQb3NpdGlvbiwgZ2V0QnVmZmVyUG9zaXRpb25Gcm9tTW91c2VFdmVudCB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgTGludGVyTWVzc2FnZSB9IGZyb20gJy4uL3R5cGVzJ1xuXG5jbGFzcyBFZGl0b3Ige1xuICBndXR0ZXI6ID9UZXh0RWRpdG9yR3V0dGVyO1xuICB0b29sdGlwOiA/VG9vbHRpcDtcbiAgZW1pdHRlcjogRW1pdHRlcjtcbiAgbWFya2VyczogTWFwPExpbnRlck1lc3NhZ2UsIEJ1ZmZlck1hcmtlcj47XG4gIG1lc3NhZ2VzOiBTZXQ8TGludGVyTWVzc2FnZT47XG4gIHRleHRFZGl0b3I6IFRleHRFZGl0b3I7XG4gIHNob3dUb29sdGlwOiBib29sZWFuO1xuICBzdWJzY3JpcHRpb25zOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICBjdXJzb3JQb3NpdGlvbjogP1BvaW50O1xuICBndXR0ZXJQb3NpdGlvbjogYm9vbGVhbjtcbiAgdG9vbHRpcEZvbGxvd3M6IHN0cmluZztcbiAgc2hvd0RlY29yYXRpb25zOiBib29sZWFuO1xuICBzaG93UHJvdmlkZXJOYW1lOiBib29sZWFuO1xuICBpZ25vcmVUb29sdGlwSW52b2NhdGlvbjogYm9vbGVhbjtcblxuICBjb25zdHJ1Y3Rvcih0ZXh0RWRpdG9yOiBUZXh0RWRpdG9yKSB7XG4gICAgdGhpcy50b29sdGlwID0gbnVsbFxuICAgIHRoaXMuZW1pdHRlciA9IG5ldyBFbWl0dGVyKClcbiAgICB0aGlzLm1hcmtlcnMgPSBuZXcgTWFwKClcbiAgICB0aGlzLm1lc3NhZ2VzID0gbmV3IFNldCgpXG4gICAgdGhpcy50ZXh0RWRpdG9yID0gdGV4dEVkaXRvclxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucyA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKClcbiAgICB0aGlzLmlnbm9yZVRvb2x0aXBJbnZvY2F0aW9uID0gZmFsc2VcblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQodGhpcy5lbWl0dGVyKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQuc2hvd1Rvb2x0aXAnLCAoc2hvd1Rvb2x0aXApID0+IHtcbiAgICAgIHRoaXMuc2hvd1Rvb2x0aXAgPSBzaG93VG9vbHRpcFxuICAgICAgaWYgKCF0aGlzLnNob3dUb29sdGlwICYmIHRoaXMudG9vbHRpcCkge1xuICAgICAgICB0aGlzLnJlbW92ZVRvb2x0aXAoKVxuICAgICAgfVxuICAgIH0pKVxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQuc2hvd1Byb3ZpZGVyTmFtZScsIChzaG93UHJvdmlkZXJOYW1lKSA9PiB7XG4gICAgICB0aGlzLnNob3dQcm92aWRlck5hbWUgPSBzaG93UHJvdmlkZXJOYW1lXG4gICAgfSkpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItdWktZGVmYXVsdC5zaG93RGVjb3JhdGlvbnMnLCAoc2hvd0RlY29yYXRpb25zKSA9PiB7XG4gICAgICBjb25zdCBub3RJbml0aWFsID0gdHlwZW9mIHRoaXMuc2hvd0RlY29yYXRpb25zICE9PSAndW5kZWZpbmVkJ1xuICAgICAgdGhpcy5zaG93RGVjb3JhdGlvbnMgPSBzaG93RGVjb3JhdGlvbnNcbiAgICAgIGlmIChub3RJbml0aWFsKSB7XG4gICAgICAgIHRoaXMudXBkYXRlR3V0dGVyKClcbiAgICAgIH1cbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci11aS1kZWZhdWx0Lmd1dHRlclBvc2l0aW9uJywgKGd1dHRlclBvc2l0aW9uKSA9PiB7XG4gICAgICBjb25zdCBub3RJbml0aWFsID0gdHlwZW9mIHRoaXMuZ3V0dGVyUG9zaXRpb24gIT09ICd1bmRlZmluZWQnXG4gICAgICB0aGlzLmd1dHRlclBvc2l0aW9uID0gZ3V0dGVyUG9zaXRpb25cbiAgICAgIGlmIChub3RJbml0aWFsKSB7XG4gICAgICAgIHRoaXMudXBkYXRlR3V0dGVyKClcbiAgICAgIH1cbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRleHRFZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMuZGlzcG9zZSgpXG4gICAgfSkpXG5cbiAgICBsZXQgdG9vbHRpcFN1YnNjcmlwdGlvblxuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLXVpLWRlZmF1bHQudG9vbHRpcEZvbGxvd3MnLCAodG9vbHRpcEZvbGxvd3MpID0+IHtcbiAgICAgIHRoaXMudG9vbHRpcEZvbGxvd3MgPSB0b29sdGlwRm9sbG93c1xuICAgICAgaWYgKHRvb2x0aXBTdWJzY3JpcHRpb24pIHtcbiAgICAgICAgdG9vbHRpcFN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICAgIH1cbiAgICAgIHRvb2x0aXBTdWJzY3JpcHRpb24gPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG4gICAgICBpZiAodG9vbHRpcEZvbGxvd3MgPT09ICdNb3VzZScgfHwgdG9vbHRpcEZvbGxvd3MgPT09ICdCb3RoJykge1xuICAgICAgICB0b29sdGlwU3Vic2NyaXB0aW9uLmFkZCh0aGlzLmxpc3RlbkZvck1vdXNlTW92ZW1lbnQoKSlcbiAgICAgIH1cbiAgICAgIGlmICh0b29sdGlwRm9sbG93cyA9PT0gJ0tleWJvYXJkJyB8fCB0b29sdGlwRm9sbG93cyA9PT0gJ0JvdGgnKSB7XG4gICAgICAgIHRvb2x0aXBTdWJzY3JpcHRpb24uYWRkKHRoaXMubGlzdGVuRm9yS2V5Ym9hcmRNb3ZlbWVudCgpKVxuICAgICAgfVxuICAgICAgdGhpcy5yZW1vdmVUb29sdGlwKClcbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKG5ldyBEaXNwb3NhYmxlKGZ1bmN0aW9uKCkge1xuICAgICAgdG9vbHRpcFN1YnNjcmlwdGlvbi5kaXNwb3NlKClcbiAgICB9KSlcblxuICAgIGNvbnN0IGxhc3RDdXJzb3JQb3NpdGlvbnMgPSBuZXcgV2Vha01hcCgpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmFkZCh0ZXh0RWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oKHsgY3Vyc29yLCBuZXdCdWZmZXJQb3NpdGlvbiB9KSA9PiB7XG4gICAgICBjb25zdCBsYXN0QnVmZmVyUG9zaXRpb24gPSBsYXN0Q3Vyc29yUG9zaXRpb25zLmdldChjdXJzb3IpXG4gICAgICBpZiAoIWxhc3RCdWZmZXJQb3NpdGlvbiB8fCAhbGFzdEJ1ZmZlclBvc2l0aW9uLmlzRXF1YWwobmV3QnVmZmVyUG9zaXRpb24pKSB7XG4gICAgICAgIGxhc3RDdXJzb3JQb3NpdGlvbnMuc2V0KGN1cnNvciwgbmV3QnVmZmVyUG9zaXRpb24pXG4gICAgICAgIHRoaXMuaWdub3JlVG9vbHRpcEludm9jYXRpb24gPSBmYWxzZVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMudG9vbHRpcEZvbGxvd3MgPT09ICdNb3VzZScpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVUb29sdGlwKClcbiAgICAgIH1cbiAgICB9KSlcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRleHRFZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2VUZXh0KCgpID0+IHtcbiAgICAgIGNvbnN0IGN1cnNvcnMgPSB0ZXh0RWRpdG9yLmdldEN1cnNvcnMoKVxuICAgICAgY3Vyc29ycy5mb3JFYWNoKChjdXJzb3IpID0+IHtcbiAgICAgICAgbGFzdEN1cnNvclBvc2l0aW9ucy5zZXQoY3Vyc29yLCBjdXJzb3IuZ2V0QnVmZmVyUG9zaXRpb24oKSlcbiAgICAgIH0pXG4gICAgICBpZiAodGhpcy50b29sdGlwRm9sbG93cyAhPT0gJ01vdXNlJykge1xuICAgICAgICB0aGlzLmlnbm9yZVRvb2x0aXBJbnZvY2F0aW9uID0gdHJ1ZVxuICAgICAgICB0aGlzLnJlbW92ZVRvb2x0aXAoKVxuICAgICAgfVxuICAgIH0pKVxuICAgIHRoaXMudXBkYXRlR3V0dGVyKClcbiAgICB0aGlzLmxpc3RlbkZvckN1cnJlbnRMaW5lKClcbiAgfVxuICBsaXN0ZW5Gb3JDdXJyZW50TGluZSgpIHtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHRoaXMudGV4dEVkaXRvci5vYnNlcnZlQ3Vyc29ycygoY3Vyc29yKSA9PiB7XG4gICAgICBsZXQgbWFya2VyXG4gICAgICBsZXQgbGFzdFJhbmdlXG4gICAgICBsZXQgbGFzdEVtcHR5XG4gICAgICBjb25zdCBoYW5kbGVQb3NpdGlvbkNoYW5nZSA9ICh7IHN0YXJ0LCBlbmQgfSkgPT4ge1xuICAgICAgICBjb25zdCBndXR0ZXIgPSB0aGlzLmd1dHRlclxuICAgICAgICBpZiAoIWd1dHRlciB8fCB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZWQpIHJldHVyblxuICAgICAgICAvLyBXZSBuZWVkIHRoYXQgUmFuZ2UuZnJvbU9iamVjdCBoYWNrIGJlbG93IGJlY2F1c2Ugd2hlbiB3ZSBmb2N1cyBpbmRleCAwIG9uIG11bHRpLWxpbmUgc2VsZWN0aW9uXG4gICAgICAgIC8vIGVuZC5jb2x1bW4gaXMgdGhlIGNvbHVtbiBvZiB0aGUgbGFzdCBsaW5lIGJ1dCBtYWtpbmcgYSByYW5nZSBvdXQgb2YgdHdvIGFuZCB0aGVuIGFjY2VzaW5nXG4gICAgICAgIC8vIHRoZSBlbmQgc2VlbXMgdG8gZml4IGl0IChibGFjayBtYWdpYz8pXG4gICAgICAgIGNvbnN0IGN1cnJlbnRSYW5nZSA9IFJhbmdlLmZyb21PYmplY3QoW3N0YXJ0LCBlbmRdKVxuICAgICAgICBjb25zdCBsaW5lc1JhbmdlID0gUmFuZ2UuZnJvbU9iamVjdChbW3N0YXJ0LnJvdywgMF0sIFtlbmQucm93LCBJbmZpbml0eV1dKVxuICAgICAgICBjb25zdCBjdXJyZW50RW1wdHkgPSBjdXJyZW50UmFuZ2UuaXNFbXB0eSgpXG5cbiAgICAgICAgLy8gTk9URTogQXRvbSBkb2VzIG5vdCBwYWludCBndXR0ZXIgaWYgbXVsdGktbGluZSBhbmQgbGFzdCBsaW5lIGhhcyB6ZXJvIGluZGV4XG4gICAgICAgIGlmIChzdGFydC5yb3cgIT09IGVuZC5yb3cgJiYgY3VycmVudFJhbmdlLmVuZC5jb2x1bW4gPT09IDApIHtcbiAgICAgICAgICBsaW5lc1JhbmdlLmVuZC5yb3ctLVxuICAgICAgICB9XG4gICAgICAgIGlmIChsYXN0UmFuZ2UgJiYgbGFzdFJhbmdlLmlzRXF1YWwobGluZXNSYW5nZSkgJiYgY3VycmVudEVtcHR5ID09PSBsYXN0RW1wdHkpIHJldHVyblxuICAgICAgICBpZiAobWFya2VyKSBtYXJrZXIuZGVzdHJveSgpXG4gICAgICAgIGxhc3RSYW5nZSA9IGxpbmVzUmFuZ2VcbiAgICAgICAgbGFzdEVtcHR5ID0gY3VycmVudEVtcHR5XG5cbiAgICAgICAgbWFya2VyID0gdGhpcy50ZXh0RWRpdG9yLm1hcmtTY3JlZW5SYW5nZShsaW5lc1JhbmdlLCB7XG4gICAgICAgICAgaW52YWxpZGF0ZTogJ25ldmVyJyxcbiAgICAgICAgfSlcbiAgICAgICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NwYW4nKVxuICAgICAgICBpdGVtLmNsYXNzTmFtZSA9IGBsaW5lLW51bWJlciBjdXJzb3ItbGluZSBsaW50ZXItY3Vyc29yLWxpbmUgJHtjdXJyZW50RW1wdHkgPyAnY3Vyc29yLWxpbmUtbm8tc2VsZWN0aW9uJyA6ICcnfWBcbiAgICAgICAgZ3V0dGVyLmRlY29yYXRlTWFya2VyKG1hcmtlciwge1xuICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgY2xhc3M6ICdsaW50ZXItcm93JyxcbiAgICAgICAgfSlcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3Vyc29yTWFya2VyID0gY3Vyc29yLmdldE1hcmtlcigpXG4gICAgICBjb25zdCBzdWJzY3JpcHRpb25zID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKVxuICAgICAgc3Vic2NyaXB0aW9ucy5hZGQoY3Vyc29yTWFya2VyLm9uRGlkQ2hhbmdlKCh7IG5ld0hlYWRTY3JlZW5Qb3NpdGlvbiwgbmV3VGFpbFNjcmVlblBvc2l0aW9uIH0pID0+IHtcbiAgICAgICAgaGFuZGxlUG9zaXRpb25DaGFuZ2UoeyBzdGFydDogbmV3SGVhZFNjcmVlblBvc2l0aW9uLCBlbmQ6IG5ld1RhaWxTY3JlZW5Qb3NpdGlvbiB9KVxuICAgICAgfSkpXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChjdXJzb3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25zLnJlbW92ZShzdWJzY3JpcHRpb25zKVxuICAgICAgICBzdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgICAgfSkpXG4gICAgICBzdWJzY3JpcHRpb25zLmFkZChuZXcgRGlzcG9zYWJsZShmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKG1hcmtlcikgbWFya2VyLmRlc3Ryb3koKVxuICAgICAgfSkpXG4gICAgICB0aGlzLnN1YnNjcmlwdGlvbnMuYWRkKHN1YnNjcmlwdGlvbnMpXG4gICAgICBoYW5kbGVQb3NpdGlvbkNoYW5nZShjdXJzb3JNYXJrZXIuZ2V0U2NyZWVuUmFuZ2UoKSlcbiAgICB9KSlcbiAgfVxuICBsaXN0ZW5Gb3JNb3VzZU1vdmVtZW50KCkge1xuICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcodGhpcy50ZXh0RWRpdG9yKVxuXG4gICAgcmV0dXJuIGRpc3Bvc2FibGVFdmVudChlZGl0b3JFbGVtZW50LCAnbW91c2Vtb3ZlJywgZGVib3VuY2UoKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWVkaXRvckVsZW1lbnQuY29tcG9uZW50IHx8IHRoaXMuc3Vic2NyaXB0aW9ucy5kaXNwb3NlZCB8fCAhaGFzUGFyZW50KGV2ZW50LnRhcmdldCwgJ2Rpdi5zY3JvbGwtdmlldycpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgY29uc3QgdG9vbHRpcCA9IHRoaXMudG9vbHRpcFxuICAgICAgaWYgKHRvb2x0aXAgJiYgbW91c2VFdmVudE5lYXJQb3NpdGlvbih7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBlZGl0b3I6IHRoaXMudGV4dEVkaXRvcixcbiAgICAgICAgZWRpdG9yRWxlbWVudCxcbiAgICAgICAgdG9vbHRpcEVsZW1lbnQ6IHRvb2x0aXAuZWxlbWVudCxcbiAgICAgICAgc2NyZWVuUG9zaXRpb246IHRvb2x0aXAubWFya2VyLmdldFN0YXJ0U2NyZWVuUG9zaXRpb24oKSxcbiAgICAgIH0pKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICB0aGlzLmN1cnNvclBvc2l0aW9uID0gZ2V0QnVmZmVyUG9zaXRpb25Gcm9tTW91c2VFdmVudChldmVudCwgdGhpcy50ZXh0RWRpdG9yLCBlZGl0b3JFbGVtZW50KVxuICAgICAgdGhpcy5pZ25vcmVUb29sdGlwSW52b2NhdGlvbiA9IGZhbHNlXG4gICAgICBpZiAodGhpcy50ZXh0RWRpdG9yLmxhcmdlRmlsZU1vZGUpIHtcbiAgICAgICAgLy8gTk9URTogSWdub3JlIGlmIGZpbGUgaXMgdG9vIGxhcmdlXG4gICAgICAgIHRoaXMuY3Vyc29yUG9zaXRpb24gPSBudWxsXG4gICAgICB9XG4gICAgICBpZiAodGhpcy5jdXJzb3JQb3NpdGlvbikge1xuICAgICAgICB0aGlzLnVwZGF0ZVRvb2x0aXAodGhpcy5jdXJzb3JQb3NpdGlvbilcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVtb3ZlVG9vbHRpcCgpXG4gICAgICB9XG4gICAgfSwgMzAwLCB0cnVlKSlcbiAgfVxuICBsaXN0ZW5Gb3JLZXlib2FyZE1vdmVtZW50KCkge1xuICAgIHJldHVybiB0aGlzLnRleHRFZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihkZWJvdW5jZSgoeyBuZXdCdWZmZXJQb3NpdGlvbiB9KSA9PiB7XG4gICAgICB0aGlzLmN1cnNvclBvc2l0aW9uID0gbmV3QnVmZmVyUG9zaXRpb25cbiAgICAgIHRoaXMudXBkYXRlVG9vbHRpcChuZXdCdWZmZXJQb3NpdGlvbilcbiAgICB9LCAxNikpXG4gIH1cbiAgdXBkYXRlR3V0dGVyKCkge1xuICAgIHRoaXMucmVtb3ZlR3V0dGVyKClcbiAgICBpZiAoIXRoaXMuc2hvd0RlY29yYXRpb25zKSB7XG4gICAgICB0aGlzLmd1dHRlciA9IG51bGxcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBjb25zdCBwcmlvcml0eSA9IHRoaXMuZ3V0dGVyUG9zaXRpb24gPT09ICdMZWZ0JyA/IC0xMDAgOiAxMDBcbiAgICB0aGlzLmd1dHRlciA9IHRoaXMudGV4dEVkaXRvci5hZGRHdXR0ZXIoe1xuICAgICAgbmFtZTogJ2xpbnRlci11aS1kZWZhdWx0JyxcbiAgICAgIHByaW9yaXR5LFxuICAgIH0pXG4gICAgdGhpcy5tYXJrZXJzLmZvckVhY2goKG1hcmtlciwgbWVzc2FnZSkgPT4ge1xuICAgICAgdGhpcy5kZWNvcmF0ZU1hcmtlcihtZXNzYWdlLCBtYXJrZXIsICdndXR0ZXInKVxuICAgIH0pXG4gIH1cbiAgcmVtb3ZlR3V0dGVyKCkge1xuICAgIGlmICh0aGlzLmd1dHRlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5ndXR0ZXIuZGVzdHJveSgpXG4gICAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIC8qIFRoaXMgdGhyb3dzIHdoZW4gdGhlIHRleHQgZWRpdG9yIGlzIGRpc3Bvc2VkICovXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHVwZGF0ZVRvb2x0aXAocG9zaXRpb246ID9Qb2ludCkge1xuICAgIGlmICghcG9zaXRpb24gfHwgKHRoaXMudG9vbHRpcCAmJiB0aGlzLnRvb2x0aXAuaXNWYWxpZChwb3NpdGlvbiwgdGhpcy5tZXNzYWdlcykpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgdGhpcy5yZW1vdmVUb29sdGlwKClcbiAgICBpZiAoIXRoaXMuc2hvd1Rvb2x0aXApIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAodGhpcy5pZ25vcmVUb29sdGlwSW52b2NhdGlvbikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgbWVzc2FnZXMgPSBmaWx0ZXJNZXNzYWdlc0J5UmFuZ2VPclBvaW50KHRoaXMubWVzc2FnZXMsIHRoaXMudGV4dEVkaXRvci5nZXRQYXRoKCksIHBvc2l0aW9uKVxuICAgIGlmICghbWVzc2FnZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB0aGlzLnRvb2x0aXAgPSBuZXcgVG9vbHRpcChtZXNzYWdlcywgcG9zaXRpb24sIHRoaXMudGV4dEVkaXRvcilcbiAgICB0aGlzLnRvb2x0aXAub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgIHRoaXMudG9vbHRpcCA9IG51bGxcbiAgICB9KVxuICB9XG4gIHJlbW92ZVRvb2x0aXAoKSB7XG4gICAgaWYgKHRoaXMudG9vbHRpcCkge1xuICAgICAgdGhpcy50b29sdGlwLm1hcmtlci5kZXN0cm95KClcbiAgICB9XG4gIH1cbiAgYXBwbHkoYWRkZWQ6IEFycmF5PExpbnRlck1lc3NhZ2U+LCByZW1vdmVkOiBBcnJheTxMaW50ZXJNZXNzYWdlPikge1xuICAgIGNvbnN0IHRleHRCdWZmZXIgPSB0aGlzLnRleHRFZGl0b3IuZ2V0QnVmZmVyKClcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW5ndGggPSByZW1vdmVkLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gcmVtb3ZlZFtpXVxuICAgICAgY29uc3QgbWFya2VyID0gdGhpcy5tYXJrZXJzLmdldChtZXNzYWdlKVxuICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICBtYXJrZXIuZGVzdHJveSgpXG4gICAgICB9XG4gICAgICB0aGlzLm1lc3NhZ2VzLmRlbGV0ZShtZXNzYWdlKVxuICAgICAgdGhpcy5tYXJrZXJzLmRlbGV0ZShtZXNzYWdlKVxuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW5ndGggPSBhZGRlZC5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGFkZGVkW2ldXG4gICAgICBjb25zdCBtYXJrZXJSYW5nZSA9ICRyYW5nZShtZXNzYWdlKVxuICAgICAgaWYgKCFtYXJrZXJSYW5nZSkge1xuICAgICAgICAvLyBPbmx5IGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG4gICAgICBjb25zdCBtYXJrZXIgPSB0ZXh0QnVmZmVyLm1hcmtSYW5nZShtYXJrZXJSYW5nZSwge1xuICAgICAgICBpbnZhbGlkYXRlOiAnbmV2ZXInLFxuICAgICAgfSlcbiAgICAgIHRoaXMubWFya2Vycy5zZXQobWVzc2FnZSwgbWFya2VyKVxuICAgICAgdGhpcy5tZXNzYWdlcy5hZGQobWVzc2FnZSlcbiAgICAgIG1hcmtlci5vbkRpZENoYW5nZSgoeyBvbGRIZWFkUG9zaXRpb24sIG5ld0hlYWRQb3NpdGlvbiwgaXNWYWxpZCB9KSA9PiB7XG4gICAgICAgIGlmICghaXNWYWxpZCB8fCAobmV3SGVhZFBvc2l0aW9uLnJvdyA9PT0gMCAmJiBvbGRIZWFkUG9zaXRpb24ucm93ICE9PSAwKSkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGlmIChtZXNzYWdlLnZlcnNpb24gPT09IDEpIHtcbiAgICAgICAgICBtZXNzYWdlLnJhbmdlID0gbWFya2VyLnByZXZpb3VzRXZlbnRTdGF0ZS5yYW5nZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1lc3NhZ2UubG9jYXRpb24ucG9zaXRpb24gPSBtYXJrZXIucHJldmlvdXNFdmVudFN0YXRlLnJhbmdlXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICB0aGlzLmRlY29yYXRlTWFya2VyKG1lc3NhZ2UsIG1hcmtlcilcbiAgICB9XG5cbiAgICB0aGlzLnVwZGF0ZVRvb2x0aXAodGhpcy5jdXJzb3JQb3NpdGlvbilcbiAgfVxuICBkZWNvcmF0ZU1hcmtlcihtZXNzYWdlOiBMaW50ZXJNZXNzYWdlLCBtYXJrZXI6IE9iamVjdCwgcGFpbnQ6ICdndXR0ZXInIHwgJ2VkaXRvcicgfCAnYm90aCcgPSAnYm90aCcpIHtcbiAgICBpZiAocGFpbnQgPT09ICdib3RoJyB8fCBwYWludCA9PT0gJ2VkaXRvcicpIHtcbiAgICAgIHRoaXMudGV4dEVkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHtcbiAgICAgICAgdHlwZTogJ2hpZ2hsaWdodCcsXG4gICAgICAgIGNsYXNzOiBgbGludGVyLWhpZ2hsaWdodCBsaW50ZXItJHttZXNzYWdlLnNldmVyaXR5fWAsXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGd1dHRlciA9IHRoaXMuZ3V0dGVyXG4gICAgaWYgKGd1dHRlciAmJiAocGFpbnQgPT09ICdib3RoJyB8fCBwYWludCA9PT0gJ2d1dHRlcicpKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpXG4gICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGBsaW50ZXItZ3V0dGVyIGxpbnRlci1oaWdobGlnaHQgbGludGVyLSR7bWVzc2FnZS5zZXZlcml0eX0gaWNvbiBpY29uLSR7bWVzc2FnZS5pY29uIHx8ICdwcmltaXRpdmUtZG90J31gXG4gICAgICBndXR0ZXIuZGVjb3JhdGVNYXJrZXIobWFya2VyLCB7XG4gICAgICAgIGNsYXNzOiAnbGludGVyLXJvdycsXG4gICAgICAgIGl0ZW06IGVsZW1lbnQsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuICBvbkRpZERlc3Ryb3koY2FsbGJhY2s6IEZ1bmN0aW9uKTogRGlzcG9zYWJsZSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdHRlci5vbignZGlkLWRlc3Ryb3knLCBjYWxsYmFjaylcbiAgfVxuICBkaXNwb3NlKCkge1xuICAgIHRoaXMuZW1pdHRlci5lbWl0KCdkaWQtZGVzdHJveScpXG4gICAgdGhpcy5zdWJzY3JpcHRpb25zLmRpc3Bvc2UoKVxuICAgIHRoaXMucmVtb3ZlR3V0dGVyKClcbiAgICB0aGlzLnJlbW92ZVRvb2x0aXAoKVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yXG4iXX0=