Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, 'next'); var callThrow = step.bind(null, 'throw'); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

// eslint-disable-next-line import/extensions, import/no-extraneous-dependencies

var _atom = require('atom');

var _fsPlus = require('fs-plus');

var _fsPlus2 = _interopRequireDefault(_fsPlus);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _atomLinter = require('atom-linter');

var helpers = _interopRequireWildcard(_atomLinter);

// Local variables
'use babel';var parseRegex = /(\d+):(\d+):\s(([A-Z])\d{2,3})\s+(.*)/g;

var applySubstitutions = function applySubstitutions(givenExecPath, projDir) {
  var execPath = givenExecPath;
  var projectName = _path2['default'].basename(projDir);
  execPath = execPath.replace(/\$PROJECT_NAME/ig, projectName);
  execPath = execPath.replace(/\$PROJECT/ig, projDir);
  var paths = execPath.split(';');
  for (var i = 0; i < paths.length; i += 1) {
    if (_fsPlus2['default'].existsSync(paths[i])) {
      return paths[i];
    }
  }
  return execPath;
};

var getVersionString = _asyncToGenerator(function* (versionPath) {
  if (!Object.hasOwnProperty.call(getVersionString, 'cache')) {
    getVersionString.cache = new Map();
  }
  if (!getVersionString.cache.has(versionPath)) {
    getVersionString.cache.set(versionPath, (yield helpers.exec(versionPath, ['--version'])));
  }
  return getVersionString.cache.get(versionPath);
});

var generateInvalidPointTrace = _asyncToGenerator(function* (execPath, match, filePath, textEditor, point) {
  var flake8Version = yield getVersionString(execPath);
  var issueURL = 'https://github.com/AtomLinter/linter-flake8/issues/new';
  var title = encodeURIComponent('Flake8 rule \'' + match[3] + '\' reported an invalid point');
  var body = encodeURIComponent(['Flake8 reported an invalid point for the rule `' + match[3] + '`, ' + ('with the messge `' + match[5] + '`.'), '', '', '<!-- If at all possible, please include code that shows this issue! -->', '', '', 'Debug information:', 'Atom version: ' + atom.getVersion(), 'Flake8 version: `' + flake8Version + '`'].join('\n'));
  var newIssueURL = issueURL + '?title=' + title + '&body=' + body;
  return {
    type: 'Error',
    severity: 'error',
    html: 'ERROR: Flake8 provided an invalid point! See the trace for details. ' + ('<a href="' + newIssueURL + '">Report this!</a>'),
    filePath: filePath,
    range: helpers.generateRange(textEditor, 0),
    trace: [{
      type: 'Trace',
      text: 'Original message: ' + match[3] + ' — ' + match[5],
      filePath: filePath,
      severity: 'info'
    }, {
      type: 'Trace',
      text: 'Requested point: ' + (point.line + 1) + ':' + (point.col + 1),
      filePath: filePath,
      severity: 'info'
    }]
  };
});

exports['default'] = {
  activate: function activate() {
    var _this = this;

    this.idleCallbacks = new Set();

    var packageDepsID = undefined;
    var linterFlake8Deps = function linterFlake8Deps() {
      _this.idleCallbacks['delete'](packageDepsID);

      // Request checking / installation of package dependencies
      if (!atom.inSpecMode()) {
        require('atom-package-deps').install('linter-flake8');
      }

      // FIXME: Remove after a few versions
      if (typeof atom.config.get('linter-flake8.disableTimeout') !== 'undefined') {
        atom.config.unset('linter-flake8.disableTimeout');
      }
    };
    packageDepsID = window.requestIdleCallback(linterFlake8Deps);
    this.idleCallbacks.add(packageDepsID);

    this.subscriptions = new _atom.CompositeDisposable();
    this.subscriptions.add(atom.config.observe('linter-flake8.projectConfigFile', function (value) {
      _this.projectConfigFile = value;
    }), atom.config.observe('linter-flake8.maxLineLength', function (value) {
      _this.maxLineLength = value;
    }), atom.config.observe('linter-flake8.ignoreErrorCodes', function (value) {
      _this.ignoreErrorCodes = value;
    }), atom.config.observe('linter-flake8.maxComplexity', function (value) {
      _this.maxComplexity = value;
    }), atom.config.observe('linter-flake8.selectErrors', function (value) {
      _this.selectErrors = value;
    }), atom.config.observe('linter-flake8.hangClosing', function (value) {
      _this.hangClosing = value;
    }), atom.config.observe('linter-flake8.executablePath', function (value) {
      _this.executablePath = value;
    }), atom.config.observe('linter-flake8.pycodestyleErrorsToWarnings', function (value) {
      _this.pycodestyleErrorsToWarnings = value;
    }), atom.config.observe('linter-flake8.flakeErrors', function (value) {
      _this.flakeErrors = value;
    }), atom.config.observe('linter-flake8.builtins', function (value) {
      _this.builtins = value;
    }));
  },

  deactivate: function deactivate() {
    this.idleCallbacks.forEach(function (callbackID) {
      return window.cancelIdleCallback(callbackID);
    });
    this.idleCallbacks.clear();
    this.subscriptions.dispose();
  },

  provideLinter: function provideLinter() {
    var _this2 = this;

    return {
      name: 'Flake8',
      grammarScopes: ['source.python', 'source.python.django'],
      scope: 'file',
      lintOnFly: true,
      lint: _asyncToGenerator(function* (textEditor) {
        var filePath = textEditor.getPath();
        var fileText = textEditor.getText();

        var parameters = ['--format=default'];

        var projectPath = atom.project.relativizePath(filePath)[0];
        var baseDir = projectPath !== null ? projectPath : _path2['default'].dirname(filePath);
        var configFilePath = yield helpers.findCachedAsync(baseDir, _this2.projectConfigFile);

        if (_this2.projectConfigFile && baseDir !== null && configFilePath !== null) {
          parameters.push('--config', configFilePath);
        } else {
          if (_this2.maxLineLength) {
            parameters.push('--max-line-length', _this2.maxLineLength);
          }
          if (_this2.ignoreErrorCodes.length) {
            parameters.push('--ignore', _this2.ignoreErrorCodes.join(','));
          }
          if (_this2.maxComplexity !== 79) {
            parameters.push('--max-complexity', _this2.maxComplexity);
          }
          if (_this2.hangClosing) {
            parameters.push('--hang-closing');
          }
          if (_this2.selectErrors.length) {
            parameters.push('--select', _this2.selectErrors.join(','));
          }
          if (_this2.builtins.length) {
            parameters.push('--builtins', _this2.builtins.join(','));
          }
        }

        parameters.push('-');

        var execPath = _fsPlus2['default'].normalize(applySubstitutions(_this2.executablePath, baseDir));
        var forceTimeout = 1000 * 60 * 5; // (ms * s * m) = Five minutes
        var options = {
          stdin: fileText,
          cwd: _path2['default'].dirname(textEditor.getPath()),
          ignoreExitCode: true,
          timeout: forceTimeout,
          uniqueKey: 'linter-flake8:' + filePath
        };

        var result = undefined;
        try {
          result = yield helpers.exec(execPath, parameters, options);
        } catch (e) {
          var pyTrace = e.message.split('\n');
          var pyMostRecent = pyTrace[pyTrace.length - 1];
          atom.notifications.addError('Flake8 crashed!', {
            detail: 'linter-flake8:: Flake8 threw an error related to:\n' + (pyMostRecent + '\n') + "Please check Atom's Console for more details"
          });
          // eslint-disable-next-line no-console
          console.error('linter-flake8:: Flake8 returned an error', e.message);
          // Tell Linter to not update any current messages it may have
          return null;
        }

        if (result === null) {
          // Process was killed by a future invocation
          return null;
        }

        if (textEditor.getText() !== fileText) {
          // Editor contents have changed, tell Linter not to update
          return null;
        }

        var messages = [];

        var match = parseRegex.exec(result);
        while (match !== null) {
          // Note that these positions are being converted to 0-indexed
          var line = Number.parseInt(match[1], 10) - 1 || 0;
          var col = Number.parseInt(match[2], 10) - 1 || undefined;

          var isErr = match[4] === 'E' && !_this2.pycodestyleErrorsToWarnings || match[4] === 'F' && _this2.flakeErrors;

          try {
            messages.push({
              type: isErr ? 'Error' : 'Warning',
              text: match[3] + ' — ' + match[5],
              filePath: filePath,
              range: helpers.generateRange(textEditor, line, col)
            });
          } catch (point) {
            // generateRange encountered an invalid point
            messages.push(generateInvalidPointTrace(execPath, match, filePath, textEditor, point));
          }

          match = parseRegex.exec(result);
        }
        // Ensure that any invalid point messages have finished resolving
        return Promise.all(messages);
      })
    };
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvZG90ZmlsZXMvLmF0b20vcGFja2FnZXMvbGludGVyLWZsYWtlOC9saWIvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7b0JBR29DLE1BQU07O3NCQUMzQixTQUFTOzs7O29CQUNQLE1BQU07Ozs7MEJBQ0UsYUFBYTs7SUFBMUIsT0FBTzs7O0FBTm5CLFdBQVcsQ0FBQyxBQVNaLElBQU0sVUFBVSxHQUFHLHdDQUF3QyxDQUFDOztBQUU1RCxJQUFNLGtCQUFrQixHQUFHLFNBQXJCLGtCQUFrQixDQUFJLGFBQWEsRUFBRSxPQUFPLEVBQUs7QUFDckQsTUFBSSxRQUFRLEdBQUcsYUFBYSxDQUFDO0FBQzdCLE1BQU0sV0FBVyxHQUFHLGtCQUFLLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMzQyxVQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUM3RCxVQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDcEQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQyxPQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3hDLFFBQUksb0JBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0FBQzNCLGFBQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pCO0dBQ0Y7QUFDRCxTQUFPLFFBQVEsQ0FBQztDQUNqQixDQUFDOztBQUVGLElBQU0sZ0JBQWdCLHFCQUFHLFdBQU8sV0FBVyxFQUFLO0FBQzlDLE1BQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMs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eUIsQ0FDckMsUUFBUSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7V0FDbEQ7O0FBRUQsZUFBSyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDakM7O0FBRUQsZUFBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQzlCLENBQUE7S0FDRixDQUFDO0dBQ0g7Q0FDRiIsImZpbGUiOiIvVXNlcnMvamVzc2VsdW1hcmllL2RvdGZpbGVzLy5hdG9tL3BhY2thZ2VzL2xpbnRlci1mbGFrZTgvbGliL21haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGJhYmVsJztcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9leHRlbnNpb25zLCBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXNcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tICdhdG9tJztcbmltcG9ydCBmcyBmcm9tICdmcy1wbHVzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgaGVscGVycyBmcm9tICdhdG9tLWxpbnRlcic7XG5cbi8vIExvY2FsIHZhcmlhYmxlc1xuY29uc3QgcGFyc2VSZWdleCA9IC8oXFxkKyk6KFxcZCspOlxccygoW0EtWl0pXFxkezIsM30pXFxzKyguKikvZztcblxuY29uc3QgYXBwbHlTdWJzdGl0dXRpb25zID0gKGdpdmVuRXhlY1BhdGgsIHByb2pEaXIpID0+IHtcbiAgbGV0IGV4ZWNQYXRoID0gZ2l2ZW5FeGVjUGF0aDtcbiAgY29uc3QgcHJvamVjdE5hbWUgPSBwYXRoLmJhc2VuYW1lKHByb2pEaXIpO1xuICBleGVjUGF0aCA9IGV4ZWNQYXRoLnJlcGxhY2UoL1xcJFBST0pFQ1RfTkFNRS9pZywgcHJvamVjdE5hbWUpO1xuICBleGVjUGF0aCA9IGV4ZWNQYXRoLnJlcGxhY2UoL1xcJFBST0pFQ1QvaWcsIHByb2pEaXIpO1xuICBjb25zdCBwYXRocyA9IGV4ZWNQYXRoLnNwbGl0KCc7Jyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwYXRoc1tpXSkpIHtcbiAgICAgIHJldHVybiBwYXRoc1tpXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGV4ZWNQYXRoO1xufTtcblxuY29uc3QgZ2V0VmVyc2lvblN0cmluZyA9IGFzeW5jICh2ZXJzaW9uUGF0aCkgPT4ge1xuICBpZiAoIU9iamVjdC5oYXNPd25Qcm9wZXJ0eS5jYWxsKGdldFZlcnNpb25TdHJpbmcsICdjYWNoZScpKSB7XG4gICAgZ2V0VmVyc2lvblN0cmluZy5jYWNoZSA9IG5ldyBNYXAoKTtcbiAgfVxuICBpZiAoIWdldFZlcnNpb25TdHJpbmcuY2FjaGUuaGFzKHZlcnNpb25QYXRoKSkge1xuICAgIGdldFZlcnNpb25TdHJpbmcuY2FjaGUuc2V0KHZlcnNpb25QYXRoLFxuICAgICAgYXdhaXQgaGVscGVycy5leGVjKHZlcnNpb25QYXRoLCBbJy0tdmVyc2lvbiddKSk7XG4gIH1cbiAgcmV0dXJuIGdldFZlcnNpb25TdHJpbmcuY2FjaGUuZ2V0KHZlcnNpb25QYXRoKTtcbn07XG5cbmNvbnN0IGdlbmVyYXRlSW52YWxpZFBvaW50VHJhY2UgPSBhc3luYyAoZXhlY1BhdGgsIG1hdGNoLCBmaWxlUGF0aCwgdGV4dEVkaXRvciwgcG9pbnQpID0+IHtcbiAgY29uc3QgZmxha2U4VmVyc2lvbiA9IGF3YWl0IGdldFZlcnNpb25TdHJpbmcoZXhlY1BhdGgpO1xuICBjb25zdCBpc3N1ZVVSTCA9ICdodHRwczovL2dpdGh1Yi5jb20vQXRvbUxpbnRlci9saW50ZXItZmxha2U4L2lzc3Vlcy9uZXcnO1xuICBjb25zdCB0aXRsZSA9IGVuY29kZVVSSUNvbXBvbmVudChgRmxha2U4IHJ1bGUgJyR7bWF0Y2hbM119JyByZXBvcnRlZCBhbiBpbnZhbGlkIHBvaW50YCk7XG4gIGNvbnN0IGJvZHkgPSBlbmNvZGVVUklDb21wb25lbnQoW1xuICAgIGBGbGFrZTggcmVwb3J0ZWQgYW4gaW52YWxpZCBwb2ludCBmb3IgdGhlIHJ1bGUgXFxgJHttYXRjaFszXX1cXGAsIGAgK1xuICAgIGB3aXRoIHRoZSBtZXNzZ2UgXFxgJHttYXRjaFs1XX1cXGAuYCxcbiAgICAnJywgJycsXG4gICAgJzwhLS0gSWYgYXQgYWxsIHBvc3NpYmxlLCBwbGVhc2UgaW5jbHVkZSBjb2RlIHRoYXQgc2hvd3MgdGhpcyBpc3N1ZSEgLS0+JyxcbiAgICAnJywgJycsXG4gICAgJ0RlYnVnIGluZm9ybWF0aW9uOicsXG4gICAgYEF0b20gdmVyc2lvbjogJHthdG9tLmdldFZlcnNpb24oKX1gLFxuICAgIGBGbGFrZTggdmVyc2lvbjogXFxgJHtmbGFrZThWZXJzaW9ufVxcYGAsXG4gIF0uam9pbignXFxuJykpO1xuICBjb25zdCBuZXdJc3N1ZVVSTCA9IGAke2lzc3VlVVJMfT90aXRsZT0ke3RpdGxlfSZib2R5PSR7Ym9keX1gO1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdFcnJvcicsXG4gICAgc2V2ZXJpdHk6ICdlcnJvcicsXG4gICAgaHRtbDogJ0VSUk9SOiBGbGFrZTggcHJvdmlkZWQgYW4gaW52YWxpZCBwb2ludCEgU2VlIHRoZSB0cmFjZSBmb3IgZGV0YWlscy4gJyArXG4gICAgICBgPGEgaHJlZj1cIiR7bmV3SXNzdWVVUkx9XCI+UmVwb3J0IHRoaXMhPC9hPmAsXG4gICAgZmlsZVBhdGgsXG4gICAgcmFuZ2U6IGhlbHBlcnMuZ2VuZXJhdGVSYW5nZSh0ZXh0RWRpdG9yLCAwKSxcbiAgICB0cmFjZTogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAnVHJhY2UnLFxuICAgICAgICB0ZXh0OiBgT3JpZ2luYWwgbWVzc2FnZTogJHttYXRjaFszXX0g4oCUICR7bWF0Y2hbNV19YCxcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIHNldmVyaXR5OiAnaW5mbycsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICB0eXBlOiAnVHJhY2UnLFxuICAgICAgICB0ZXh0OiBgUmVxdWVzdGVkIHBvaW50OiAke3BvaW50LmxpbmUgKyAxfToke3BvaW50LmNvbCArIDF9YCxcbiAgICAgICAgZmlsZVBhdGgsXG4gICAgICAgIHNldmVyaXR5OiAnaW5mbycsXG4gICAgICB9LFxuICAgIF0sXG4gIH07XG59O1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGFjdGl2YXRlKCkge1xuICAgIHRoaXMuaWRsZUNhbGxiYWNrcyA9IG5ldyBTZXQoKTtcblxuICAgIGxldCBwYWNrYWdlRGVwc0lEO1xuICAgIGNvbnN0IGxpbnRlckZsYWtlOERlcHMgPSAoKSA9PiB7XG4gICAgICB0aGlzLmlkbGVDYWxsYmFja3MuZGVsZXRlKHBhY2thZ2VEZXBzSUQpO1xuXG4gICAgICAvLyBSZXF1ZXN0IGNoZWNraW5nIC8gaW5zdGFsbGF0aW9uIG9mIHBhY2thZ2UgZGVwZW5kZW5jaWVzXG4gICAgICBpZiAoIWF0b20uaW5TcGVjTW9kZSgpKSB7XG4gICAgICAgIHJlcXVpcmUoJ2F0b20tcGFja2FnZS1kZXBzJykuaW5zdGFsbCgnbGludGVyLWZsYWtlOCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBGSVhNRTogUmVtb3ZlIGFmdGVyIGEgZmV3IHZlcnNpb25zXG4gICAgICBpZiAodHlwZW9mIGF0b20uY29uZmlnLmdldCgnbGludGVyLWZsYWtlOC5kaXNhYmxlVGltZW91dCcpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBhdG9tLmNvbmZpZy51bnNldCgnbGludGVyLWZsYWtlOC5kaXNhYmxlVGltZW91dCcpO1xuICAgICAgfVxuICAgIH07XG4gICAgcGFja2FnZURlcHNJRCA9IHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrKGxpbnRlckZsYWtlOERlcHMpO1xuICAgIHRoaXMuaWRsZUNhbGxiYWNrcy5hZGQocGFja2FnZURlcHNJRCk7XG5cbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIHRoaXMuc3Vic2NyaXB0aW9ucy5hZGQoXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItZmxha2U4LnByb2plY3RDb25maWdGaWxlJywgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMucHJvamVjdENvbmZpZ0ZpbGUgPSB2YWx1ZTtcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWZsYWtlOC5tYXhMaW5lTGVuZ3RoJywgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMubWF4TGluZUxlbmd0aCA9IHZhbHVlO1xuICAgICAgfSksXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItZmxha2U4Lmlnbm9yZUVycm9yQ29kZXMnLCAodmFsdWUpID0+IHtcbiAgICAgICAgdGhpcy5pZ25vcmVFcnJvckNvZGVzID0gdmFsdWU7XG4gICAgICB9KSxcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1mbGFrZTgubWF4Q29tcGxleGl0eScsICh2YWx1ZSkgPT4ge1xuICAgICAgICB0aGlzLm1heENvbXBsZXhpdHkgPSB2YWx1ZTtcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWZsYWtlOC5zZWxlY3RFcnJvcnMnLCAodmFsdWUpID0+IHtcbiAgICAgICAgdGhpcy5zZWxlY3RFcnJvcnMgPSB2YWx1ZTtcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWZsYWtlOC5oYW5nQ2xvc2luZycsICh2YWx1ZSkgPT4ge1xuICAgICAgICB0aGlzLmhhbmdDbG9zaW5nID0gdmFsdWU7XG4gICAgICB9KSxcbiAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoJ2xpbnRlci1mbGFrZTguZXhlY3V0YWJsZVBhdGgnLCAodmFsdWUpID0+IHtcbiAgICAgICAgdGhpcy5leGVjdXRhYmxlUGF0aCA9IHZhbHVlO1xuICAgICAgfSksXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItZmxha2U4LnB5Y29kZXN0eWxlRXJyb3JzVG9XYXJuaW5ncycsICh2YWx1ZSkgPT4ge1xuICAgICAgICB0aGlzLnB5Y29kZXN0eWxlRXJyb3JzVG9XYXJuaW5ncyA9IHZhbHVlO1xuICAgICAgfSksXG4gICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKCdsaW50ZXItZmxha2U4LmZsYWtlRXJyb3JzJywgKHZhbHVlKSA9PiB7XG4gICAgICAgIHRoaXMuZmxha2VFcnJvcnMgPSB2YWx1ZTtcbiAgICAgIH0pLFxuICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZSgnbGludGVyLWZsYWtlOC5idWlsdGlucycsICh2YWx1ZSkgPT4ge1xuICAgICAgICB0aGlzLmJ1aWx0aW5zID0gdmFsdWU7XG4gICAgICB9KSxcbiAgICApO1xuICB9LFxuXG4gIGRlYWN0aXZhdGUoKSB7XG4gICAgdGhpcy5pZGxlQ2FsbGJhY2tzLmZvckVhY2goY2FsbGJhY2tJRCA9PiB3aW5kb3cuY2FuY2VsSWRsZUNhbGxiYWNrKGNhbGxiYWNrSUQpKTtcbiAgICB0aGlzLmlkbGVDYWxsYmFja3MuY2xlYXIoKTtcbiAgICB0aGlzLnN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpO1xuICB9LFxuXG4gIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6ICdGbGFrZTgnLFxuICAgICAgZ3JhbW1hclNjb3BlczogWydzb3VyY2UucHl0aG9uJywgJ3NvdXJjZS5weXRob24uZGphbmdvJ10sXG4gICAgICBzY29wZTogJ2ZpbGUnLFxuICAgICAgbGludE9uRmx5OiB0cnVlLFxuICAgICAgbGludDogYXN5bmMgKHRleHRFZGl0b3IpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSB0ZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgY29uc3QgZmlsZVRleHQgPSB0ZXh0RWRpdG9yLmdldFRleHQoKTtcblxuICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gWyctLWZvcm1hdD1kZWZhdWx0J107XG5cbiAgICAgICAgY29uc3QgcHJvamVjdFBhdGggPSBhdG9tLnByb2plY3QucmVsYXRpdml6ZVBhdGgoZmlsZVBhdGgpWzBdO1xuICAgICAgICBjb25zdCBiYXNlRGlyID0gcHJvamVjdFBhdGggIT09IG51bGwgPyBwcm9qZWN0UGF0aCA6IHBhdGguZGlybmFtZShmaWxlUGF0aCk7XG4gICAgICAgIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gYXdhaXQgaGVscGVycy5maW5kQ2FjaGVkQXN5bmMoYmFzZURpciwgdGhpcy5wcm9qZWN0Q29uZmlnRmlsZSk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvamVjdENvbmZpZ0ZpbGUgJiYgYmFzZURpciAhPT0gbnVsbCAmJiBjb25maWdGaWxlUGF0aCAhPT0gbnVsbCkge1xuICAgICAgICAgIHBhcmFtZXRlcnMucHVzaCgnLS1jb25maWcnLCBjb25maWdGaWxlUGF0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMubWF4TGluZUxlbmd0aCkge1xuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKCctLW1heC1saW5lLWxlbmd0aCcsIHRoaXMubWF4TGluZUxlbmd0aCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmlnbm9yZUVycm9yQ29kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goJy0taWdub3JlJywgdGhpcy5pZ25vcmVFcnJvckNvZGVzLmpvaW4oJywnKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLm1heENvbXBsZXhpdHkgIT09IDc5KSB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goJy0tbWF4LWNvbXBsZXhpdHknLCB0aGlzLm1heENvbXBsZXhpdHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5oYW5nQ2xvc2luZykge1xuICAgICAgICAgICAgcGFyYW1ldGVycy5wdXNoKCctLWhhbmctY2xvc2luZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodGhpcy5zZWxlY3RFcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goJy0tc2VsZWN0JywgdGhpcy5zZWxlY3RFcnJvcnMuam9pbignLCcpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHRoaXMuYnVpbHRpbnMubGVuZ3RoKSB7XG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnB1c2goJy0tYnVpbHRpbnMnLCB0aGlzLmJ1aWx0aW5zLmpvaW4oJywnKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcGFyYW1ldGVycy5wdXNoKCctJyk7XG5cbiAgICAgICAgY29uc3QgZXhlY1BhdGggPSBmcy5ub3JtYWxpemUoYXBwbHlTdWJzdGl0dXRpb25zKHRoaXMuZXhlY3V0YWJsZVBhdGgsIGJhc2VEaXIpKTtcbiAgICAgICAgY29uc3QgZm9yY2VUaW1lb3V0ID0gMTAwMCAqIDYwICogNTsgLy8gKG1zICogcyAqIG0pID0gRml2ZSBtaW51dGVzXG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RkaW46IGZpbGVUZXh0LFxuICAgICAgICAgIGN3ZDogcGF0aC5kaXJuYW1lKHRleHRFZGl0b3IuZ2V0UGF0aCgpKSxcbiAgICAgICAgICBpZ25vcmVFeGl0Q29kZTogdHJ1ZSxcbiAgICAgICAgICB0aW1lb3V0OiBmb3JjZVRpbWVvdXQsXG4gICAgICAgICAgdW5pcXVlS2V5OiBgbGludGVyLWZsYWtlODoke2ZpbGVQYXRofWAsXG4gICAgICAgIH07XG5cbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXN1bHQgPSBhd2FpdCBoZWxwZXJzLmV4ZWMoZXhlY1BhdGgsIHBhcmFtZXRlcnMsIG9wdGlvbnMpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY29uc3QgcHlUcmFjZSA9IGUubWVzc2FnZS5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgY29uc3QgcHlNb3N0UmVjZW50ID0gcHlUcmFjZVtweVRyYWNlLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignRmxha2U4IGNyYXNoZWQhJywge1xuICAgICAgICAgICAgZGV0YWlsOiAnbGludGVyLWZsYWtlODo6IEZsYWtlOCB0aHJldyBhbiBlcnJvciByZWxhdGVkIHRvOlxcbicgK1xuICAgICAgICAgICAgICBgJHtweU1vc3RSZWNlbnR9XFxuYCArXG4gICAgICAgICAgICAgIFwiUGxlYXNlIGNoZWNrIEF0b20ncyBDb25zb2xlIGZvciBtb3JlIGRldGFpbHNcIixcbiAgICAgICAgICB9KTtcbiAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2xpbnRlci1mbGFrZTg6OiBGbGFrZTggcmV0dXJuZWQgYW4gZXJyb3InLCBlLm1lc3NhZ2UpO1xuICAgICAgICAgIC8vIFRlbGwgTGludGVyIHRvIG5vdCB1cGRhdGUgYW55IGN1cnJlbnQgbWVzc2FnZXMgaXQgbWF5IGhhdmVcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgICAgICAvLyBQcm9jZXNzIHdhcyBraWxsZWQgYnkgYSBmdXR1cmUgaW52b2NhdGlvblxuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRleHRFZGl0b3IuZ2V0VGV4dCgpICE9PSBmaWxlVGV4dCkge1xuICAgICAgICAgIC8vIEVkaXRvciBjb250ZW50cyBoYXZlIGNoYW5nZWQsIHRlbGwgTGludGVyIG5vdCB0byB1cGRhdGVcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gW107XG5cbiAgICAgICAgbGV0IG1hdGNoID0gcGFyc2VSZWdleC5leGVjKHJlc3VsdCk7XG4gICAgICAgIHdoaWxlIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgICAgIC8vIE5vdGUgdGhhdCB0aGVzZSBwb3NpdGlvbnMgYXJlIGJlaW5nIGNvbnZlcnRlZCB0byAwLWluZGV4ZWRcbiAgICAgICAgICBjb25zdCBsaW5lID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoWzFdLCAxMCkgLSAxIHx8IDA7XG4gICAgICAgICAgY29uc3QgY29sID0gTnVtYmVyLnBhcnNlSW50KG1hdGNoWzJdLCAxMCkgLSAxIHx8IHVuZGVmaW5lZDtcblxuICAgICAgICAgIGNvbnN0IGlzRXJyID0gKG1hdGNoWzRdID09PSAnRScgJiYgIXRoaXMucHljb2Rlc3R5bGVFcnJvcnNUb1dhcm5pbmdzKVxuICAgICAgICAgICAgfHwgKG1hdGNoWzRdID09PSAnRicgJiYgdGhpcy5mbGFrZUVycm9ycyk7XG5cbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaCh7XG4gICAgICAgICAgICAgIHR5cGU6IGlzRXJyID8gJ0Vycm9yJyA6ICdXYXJuaW5nJyxcbiAgICAgICAgICAgICAgdGV4dDogYCR7bWF0Y2hbM119IOKAlCAke21hdGNoWzVdfWAsXG4gICAgICAgICAgICAgIGZpbGVQYXRoLFxuICAgICAgICAgICAgICByYW5nZTogaGVscGVycy5nZW5lcmF0ZVJhbmdlKHRleHRFZGl0b3IsIGxpbmUsIGNvbCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGNhdGNoIChwb2ludCkge1xuICAgICAgICAgICAgLy8gZ2VuZXJhdGVSYW5nZSBlbmNvdW50ZXJlZCBhbiBpbnZhbGlkIHBvaW50XG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoKGdlbmVyYXRlSW52YWxpZFBvaW50VHJhY2UoXG4gICAgICAgICAgICAgIGV4ZWNQYXRoLCBtYXRjaCwgZmlsZVBhdGgsIHRleHRFZGl0b3IsIHBvaW50KSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbWF0Y2ggPSBwYXJzZVJlZ2V4LmV4ZWMocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBFbnN1cmUgdGhhdCBhbnkgaW52YWxpZCBwb2ludCBtZXNzYWdlcyBoYXZlIGZpbmlzaGVkIHJlc29sdmluZ1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwobWVzc2FnZXMpO1xuICAgICAgfSxcbiAgICB9O1xuICB9LFxufTtcbiJdfQ==