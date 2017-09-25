(function() {
  var CommandError, Ex, VimOption, _, defer, fs, getFullPath, getSearchTerm, path, replaceGroups, saveAs, trySave,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  path = require('path');

  CommandError = require('./command-error');

  fs = require('fs-plus');

  VimOption = require('./vim-option');

  _ = require('underscore-plus');

  defer = function() {
    var deferred;
    deferred = {};
    deferred.promise = new Promise(function(resolve, reject) {
      deferred.resolve = resolve;
      return deferred.reject = reject;
    });
    return deferred;
  };

  trySave = function(func) {
    var deferred, error, errorMatch, fileName, ref, response;
    deferred = defer();
    try {
      response = func();
      if (response instanceof Promise) {
        response.then(function() {
          return deferred.resolve();
        });
      } else {
        deferred.resolve();
      }
    } catch (error1) {
      error = error1;
      if (error.message.endsWith('is a directory')) {
        atom.notifications.addWarning("Unable to save file: " + error.message);
      } else if (error.path != null) {
        if (error.code === 'EACCES') {
          atom.notifications.addWarning("Unable to save file: Permission denied '" + error.path + "'");
        } else if ((ref = error.code) === 'EPERM' || ref === 'EBUSY' || ref === 'UNKNOWN' || ref === 'EEXIST') {
          atom.notifications.addWarning("Unable to save file '" + error.path + "'", {
            detail: error.message
          });
        } else if (error.code === 'EROFS') {
          atom.notifications.addWarning("Unable to save file: Read-only file system '" + error.path + "'");
        }
      } else if ((errorMatch = /ENOTDIR, not a directory '([^']+)'/.exec(error.message))) {
        fileName = errorMatch[1];
        atom.notifications.addWarning("Unable to save file: A directory in the " + ("path '" + fileName + "' could not be written to"));
      } else {
        throw error;
      }
    }
    return deferred.promise;
  };

  saveAs = function(filePath, editor) {
    return fs.writeFileSync(filePath, editor.getText());
  };

  getFullPath = function(filePath) {
    filePath = fs.normalize(filePath);
    if (path.isAbsolute(filePath)) {
      return filePath;
    } else if (atom.project.getPaths().length === 0) {
      return path.join(fs.normalize('~'), filePath);
    } else {
      return path.join(atom.project.getPaths()[0], filePath);
    }
  };

  replaceGroups = function(groups, string) {
    var char, escaped, group, replaced;
    replaced = '';
    escaped = false;
    while ((char = string[0]) != null) {
      string = string.slice(1);
      if (char === '\\' && !escaped) {
        escaped = true;
      } else if (/\d/.test(char) && escaped) {
        escaped = false;
        group = groups[parseInt(char)];
        if (group == null) {
          group = '';
        }
        replaced += group;
      } else {
        escaped = false;
        replaced += char;
      }
    }
    return replaced;
  };

  getSearchTerm = function(term, modifiers) {
    var char, escaped, hasC, hasc, i, len, modFlags, term_;
    if (modifiers == null) {
      modifiers = {
        'g': true
      };
    }
    escaped = false;
    hasc = false;
    hasC = false;
    term_ = term;
    term = '';
    for (i = 0, len = term_.length; i < len; i++) {
      char = term_[i];
      if (char === '\\' && !escaped) {
        escaped = true;
        term += char;
      } else {
        if (char === 'c' && escaped) {
          hasc = true;
          term = term.slice(0, -1);
        } else if (char === 'C' && escaped) {
          hasC = true;
          term = term.slice(0, -1);
        } else if (char !== '\\') {
          term += char;
        }
        escaped = false;
      }
    }
    if (hasC) {
      modifiers['i'] = false;
    }
    if ((!hasC && !term.match('[A-Z]') && atom.config.get('vim-mode.useSmartcaseForSearch')) || hasc) {
      modifiers['i'] = true;
    }
    modFlags = Object.keys(modifiers).filter(function(key) {
      return modifiers[key];
    }).join('');
    try {
      return new RegExp(term, modFlags);
    } catch (error1) {
      return new RegExp(_.escapeRegExp(term), modFlags);
    }
  };

  Ex = (function() {
    function Ex() {
      this.sort = bind(this.sort, this);
      this.vsp = bind(this.vsp, this);
      this.s = bind(this.s, this);
      this.sp = bind(this.sp, this);
      this.x = bind(this.x, this);
      this.xit = bind(this.xit, this);
      this.saveas = bind(this.saveas, this);
      this.xa = bind(this.xa, this);
      this.xall = bind(this.xall, this);
      this.wqa = bind(this.wqa, this);
      this.wqall = bind(this.wqall, this);
      this.wa = bind(this.wa, this);
      this.wq = bind(this.wq, this);
      this.w = bind(this.w, this);
      this.e = bind(this.e, this);
      this.tabo = bind(this.tabo, this);
      this.tabp = bind(this.tabp, this);
      this.tabn = bind(this.tabn, this);
      this.tabc = bind(this.tabc, this);
      this.tabclose = bind(this.tabclose, this);
      this.tabnew = bind(this.tabnew, this);
      this.tabe = bind(this.tabe, this);
      this.tabedit = bind(this.tabedit, this);
      this.qall = bind(this.qall, this);
      this.q = bind(this.q, this);
    }

    Ex.singleton = function() {
      return Ex.ex || (Ex.ex = new Ex);
    };

    Ex.registerCommand = function(name, func) {
      return Ex.singleton()[name] = func;
    };

    Ex.registerAlias = function(alias, name) {
      return Ex.singleton()[alias] = function(args) {
        return Ex.singleton()[name](args);
      };
    };

    Ex.getCommands = function() {
      return Object.keys(Ex.singleton()).concat(Object.keys(Ex.prototype)).filter(function(cmd, index, list) {
        return list.indexOf(cmd) === index;
      });
    };

    Ex.prototype.quit = function() {
      return atom.workspace.getActivePane().destroyActiveItem();
    };

    Ex.prototype.quitall = function() {
      return atom.close();
    };

    Ex.prototype.q = function() {
      return this.quit();
    };

    Ex.prototype.qall = function() {
      return this.quitall();
    };

    Ex.prototype.tabedit = function(args) {
      if (args.args.trim() !== '') {
        return this.edit(args);
      } else {
        return this.tabnew(args);
      }
    };

    Ex.prototype.tabe = function(args) {
      return this.tabedit(args);
    };

    Ex.prototype.tabnew = function(args) {
      if (args.args.trim() === '') {
        return atom.workspace.open();
      } else {
        return this.tabedit(args);
      }
    };

    Ex.prototype.tabclose = function(args) {
      return this.quit(args);
    };

    Ex.prototype.tabc = function() {
      return this.tabclose();
    };

    Ex.prototype.tabnext = function() {
      var pane;
      pane = atom.workspace.getActivePane();
      return pane.activateNextItem();
    };

    Ex.prototype.tabn = function() {
      return this.tabnext();
    };

    Ex.prototype.tabprevious = function() {
      var pane;
      pane = atom.workspace.getActivePane();
      return pane.activatePreviousItem();
    };

    Ex.prototype.tabp = function() {
      return this.tabprevious();
    };

    Ex.prototype.tabonly = function() {
      var tabBar, tabBarElement;
      tabBar = atom.workspace.getPanes()[0];
      tabBarElement = atom.views.getView(tabBar).querySelector(".tab-bar");
      tabBarElement.querySelector(".right-clicked") && tabBarElement.querySelector(".right-clicked").classList.remove("right-clicked");
      tabBarElement.querySelector(".active").classList.add("right-clicked");
      atom.commands.dispatch(tabBarElement, 'tabs:close-other-tabs');
      return tabBarElement.querySelector(".active").classList.remove("right-clicked");
    };

    Ex.prototype.tabo = function() {
      return this.tabonly();
    };

    Ex.prototype.edit = function(arg) {
      var args, editor, filePath, force, fullPath, range;
      range = arg.range, args = arg.args, editor = arg.editor;
      filePath = args.trim();
      if (filePath[0] === '!') {
        force = true;
        filePath = filePath.slice(1).trim();
      } else {
        force = false;
      }
      if (editor.isModified() && !force) {
        throw new CommandError('No write since last change (add ! to override)');
      }
      if (filePath.indexOf(' ') !== -1) {
        throw new CommandError('Only one file name allowed');
      }
      if (filePath.length !== 0) {
        fullPath = getFullPath(filePath);
        if (fullPath === editor.getPath()) {
          return editor.getBuffer().reload();
        } else {
          return atom.workspace.open(fullPath);
        }
      } else {
        if (editor.getPath() != null) {
          return editor.getBuffer().reload();
        } else {
          throw new CommandError('No file name');
        }
      }
    };

    Ex.prototype.e = function(args) {
      return this.edit(args);
    };

    Ex.prototype.enew = function() {
      var buffer;
      buffer = atom.workspace.getActiveTextEditor().buffer;
      buffer.setPath(void 0);
      return buffer.load();
    };

    Ex.prototype.write = function(arg) {
      var args, deferred, editor, filePath, force, fullPath, range, saveas, saved;
      range = arg.range, args = arg.args, editor = arg.editor, saveas = arg.saveas;
      if (saveas == null) {
        saveas = false;
      }
      filePath = args;
      if (filePath[0] === '!') {
        force = true;
        filePath = filePath.slice(1);
      } else {
        force = false;
      }
      filePath = filePath.trim();
      if (filePath.indexOf(' ') !== -1) {
        throw new CommandError('Only one file name allowed');
      }
      deferred = defer();
      editor = atom.workspace.getActiveTextEditor();
      saved = false;
      if (filePath.length !== 0) {
        fullPath = getFullPath(filePath);
      }
      if ((editor.getPath() != null) && ((fullPath == null) || editor.getPath() === fullPath)) {
        if (saveas) {
          throw new CommandError("Argument required");
        } else {
          trySave(function() {
            return editor.save();
          }).then(deferred.resolve);
          saved = true;
        }
      } else if (fullPath == null) {
        fullPath = atom.showSaveDialogSync();
      }
      if (!saved && (fullPath != null)) {
        if (!force && fs.existsSync(fullPath)) {
          throw new CommandError("File exists (add ! to override)");
        }
        if (saveas || editor.getFileName() === null) {
          editor = atom.workspace.getActiveTextEditor();
          trySave(function() {
            return editor.saveAs(fullPath, editor);
          }).then(deferred.resolve);
        } else {
          trySave(function() {
            return saveAs(fullPath, editor);
          }).then(deferred.resolve);
        }
      }
      return deferred.promise;
    };

    Ex.prototype.wall = function() {
      return atom.workspace.saveAll();
    };

    Ex.prototype.w = function(args) {
      return this.write(args);
    };

    Ex.prototype.wq = function(args) {
      return this.write(args).then((function(_this) {
        return function() {
          return _this.quit();
        };
      })(this));
    };

    Ex.prototype.wa = function() {
      return this.wall();
    };

    Ex.prototype.wqall = function() {
      this.wall();
      return this.quitall();
    };

    Ex.prototype.wqa = function() {
      return this.wqall();
    };

    Ex.prototype.xall = function() {
      return this.wqall();
    };

    Ex.prototype.xa = function() {
      return this.wqall();
    };

    Ex.prototype.saveas = function(args) {
      args.saveas = true;
      return this.write(args);
    };

    Ex.prototype.xit = function(args) {
      return this.wq(args);
    };

    Ex.prototype.x = function(args) {
      return this.xit(args);
    };

    Ex.prototype.split = function(arg) {
      var args, file, filePaths, i, j, len, len1, newPane, pane, range, results, results1;
      range = arg.range, args = arg.args;
      args = args.trim();
      filePaths = args.split(' ');
      if (filePaths.length === 1 && filePaths[0] === '') {
        filePaths = void 0;
      }
      pane = atom.workspace.getActivePane();
      if (atom.config.get('ex-mode.splitbelow')) {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitDown();
          results = [];
          for (i = 0, len = filePaths.length; i < len; i++) {
            file = filePaths[i];
            results.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results;
        } else {
          return pane.splitDown({
            copyActiveItem: true
          });
        }
      } else {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitUp();
          results1 = [];
          for (j = 0, len1 = filePaths.length; j < len1; j++) {
            file = filePaths[j];
            results1.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results1;
        } else {
          return pane.splitUp({
            copyActiveItem: true
          });
        }
      }
    };

    Ex.prototype.sp = function(args) {
      return this.split(args);
    };

    Ex.prototype.substitute = function(arg) {
      var args, args_, char, delim, e, editor, escapeChars, escaped, flags, flagsObj, parsed, parsing, pattern, patternRE, range, substition, vimState;
      range = arg.range, args = arg.args, editor = arg.editor, vimState = arg.vimState;
      args_ = args.trimLeft();
      delim = args_[0];
      if (/[a-z1-9\\"|]/i.test(delim)) {
        throw new CommandError("Regular expressions can't be delimited by alphanumeric characters, '\\', '\"' or '|'");
      }
      args_ = args_.slice(1);
      escapeChars = {
        t: '\t',
        n: '\n',
        r: '\r'
      };
      parsed = ['', '', ''];
      parsing = 0;
      escaped = false;
      while ((char = args_[0]) != null) {
        args_ = args_.slice(1);
        if (char === delim) {
          if (!escaped) {
            parsing++;
            if (parsing > 2) {
              throw new CommandError('Trailing characters');
            }
          } else {
            parsed[parsing] = parsed[parsing].slice(0, -1);
          }
        } else if (char === '\\' && !escaped) {
          parsed[parsing] += char;
          escaped = true;
        } else if (parsing === 1 && escaped && (escapeChars[char] != null)) {
          parsed[parsing] += escapeChars[char];
          escaped = false;
        } else {
          escaped = false;
          parsed[parsing] += char;
        }
      }
      pattern = parsed[0], substition = parsed[1], flags = parsed[2];
      if (pattern === '') {
        if (vimState.getSearchHistoryItem != null) {
          pattern = vimState.getSearchHistoryItem();
        } else if (vimState.searchHistory != null) {
          pattern = vimState.searchHistory.get('prev');
        }
        if (pattern == null) {
          atom.beep();
          throw new CommandError('No previous regular expression');
        }
      } else {
        if (vimState.pushSearchHistory != null) {
          vimState.pushSearchHistory(pattern);
        } else if (vimState.searchHistory != null) {
          vimState.searchHistory.save(pattern);
        }
      }
      try {
        flagsObj = {};
        flags.split('').forEach(function(flag) {
          return flagsObj[flag] = true;
        });
        if (atom.config.get('ex-mode.gdefault')) {
          flagsObj.g = !flagsObj.g;
        }
        patternRE = getSearchTerm(pattern, flagsObj);
      } catch (error1) {
        e = error1;
        if (e.message.indexOf('Invalid flags supplied to RegExp constructor') === 0) {
          throw new CommandError("Invalid flags: " + e.message.slice(45));
        } else if (e.message.indexOf('Invalid regular expression: ') === 0) {
          throw new CommandError("Invalid RegEx: " + e.message.slice(27));
        } else {
          throw e;
        }
      }
      return editor.transact(function() {
        var i, line, ref, ref1, results;
        results = [];
        for (line = i = ref = range[0], ref1 = range[1]; ref <= ref1 ? i <= ref1 : i >= ref1; line = ref <= ref1 ? ++i : --i) {
          results.push(editor.scanInBufferRange(patternRE, [[line, 0], [line + 1, 0]], function(arg1) {
            var match, replace;
            match = arg1.match, replace = arg1.replace;
            return replace(replaceGroups(match.slice(0), substition));
          }));
        }
        return results;
      });
    };

    Ex.prototype.s = function(args) {
      return this.substitute(args);
    };

    Ex.prototype.vsplit = function(arg) {
      var args, file, filePaths, i, j, len, len1, newPane, pane, range, results, results1;
      range = arg.range, args = arg.args;
      args = args.trim();
      filePaths = args.split(' ');
      if (filePaths.length === 1 && filePaths[0] === '') {
        filePaths = void 0;
      }
      pane = atom.workspace.getActivePane();
      if (atom.config.get('ex-mode.splitright')) {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitRight();
          results = [];
          for (i = 0, len = filePaths.length; i < len; i++) {
            file = filePaths[i];
            results.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results;
        } else {
          return pane.splitRight({
            copyActiveItem: true
          });
        }
      } else {
        if ((filePaths != null) && filePaths.length > 0) {
          newPane = pane.splitLeft();
          results1 = [];
          for (j = 0, len1 = filePaths.length; j < len1; j++) {
            file = filePaths[j];
            results1.push((function() {
              return atom.workspace.openURIInPane(file, newPane);
            })());
          }
          return results1;
        } else {
          return pane.splitLeft({
            copyActiveItem: true
          });
        }
      }
    };

    Ex.prototype.vsp = function(args) {
      return this.vsplit(args);
    };

    Ex.prototype["delete"] = function(arg) {
      var editor, range, text;
      range = arg.range;
      range = [[range[0], 0], [range[1] + 1, 0]];
      editor = atom.workspace.getActiveTextEditor();
      text = editor.getTextInBufferRange(range);
      atom.clipboard.write(text);
      return editor.buffer.setTextInRange(range, '');
    };

    Ex.prototype.yank = function(arg) {
      var range, txt;
      range = arg.range;
      range = [[range[0], 0], [range[1] + 1, 0]];
      txt = atom.workspace.getActiveTextEditor().getTextInBufferRange(range);
      return atom.clipboard.write(txt);
    };

    Ex.prototype.set = function(arg) {
      var args, i, len, option, options, range, results;
      range = arg.range, args = arg.args;
      args = args.trim();
      if (args === "") {
        throw new CommandError("No option specified");
      }
      options = args.split(' ');
      results = [];
      for (i = 0, len = options.length; i < len; i++) {
        option = options[i];
        results.push((function() {
          var nameValPair, optionName, optionProcessor, optionValue;
          if (option.includes("=")) {
            nameValPair = option.split("=");
            if (nameValPair.length !== 2) {
              throw new CommandError("Wrong option format. [name]=[value] format is expected");
            }
            optionName = nameValPair[0];
            optionValue = nameValPair[1];
            optionProcessor = VimOption.singleton()[optionName];
            if (optionProcessor == null) {
              throw new CommandError("No such option: " + optionName);
            }
            return optionProcessor(optionValue);
          } else {
            optionProcessor = VimOption.singleton()[option];
            if (optionProcessor == null) {
              throw new CommandError("No such option: " + option);
            }
            return optionProcessor();
          }
        })());
      }
      return results;
    };

    Ex.prototype.sort = function(arg) {
      var editor, i, isMultiLine, lineIndex, range, ref, ref1, sortedText, sortingRange, textLines;
      range = arg.range;
      editor = atom.workspace.getActiveTextEditor();
      sortingRange = [[]];
      isMultiLine = range[1] - range[0] > 1;
      if (isMultiLine) {
        sortingRange = [[range[0], 0], [range[1] + 1, 0]];
      } else {
        sortingRange = [[0, 0], [editor.getLastBufferRow(), 0]];
      }
      textLines = [];
      for (lineIndex = i = ref = sortingRange[0][0], ref1 = sortingRange[1][0] - 1; ref <= ref1 ? i <= ref1 : i >= ref1; lineIndex = ref <= ref1 ? ++i : --i) {
        textLines.push(editor.lineTextForBufferRow(lineIndex));
      }
      sortedText = _.sortBy(textLines).join('\n') + '\n';
      return editor.buffer.setTextInRange(sortingRange, sortedText);
    };

    return Ex;

  })();

  module.exports = Ex;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS9kb3RmaWxlcy8uYXRvbS9wYWNrYWdlcy9leC1tb2RlL2xpYi9leC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBLDJHQUFBO0lBQUE7O0VBQUEsSUFBQSxHQUFPLE9BQUEsQ0FBUSxNQUFSOztFQUNQLFlBQUEsR0FBZSxPQUFBLENBQVEsaUJBQVI7O0VBQ2YsRUFBQSxHQUFLLE9BQUEsQ0FBUSxTQUFSOztFQUNMLFNBQUEsR0FBWSxPQUFBLENBQVEsY0FBUjs7RUFDWixDQUFBLEdBQUksT0FBQSxDQUFRLGlCQUFSOztFQUVKLEtBQUEsR0FBUSxTQUFBO0FBQ04sUUFBQTtJQUFBLFFBQUEsR0FBVztJQUNYLFFBQVEsQ0FBQyxPQUFULEdBQXVCLElBQUEsT0FBQSxDQUFRLFNBQUMsT0FBRCxFQUFVLE1BQVY7TUFDN0IsUUFBUSxDQUFDLE9BQVQsR0FBbUI7YUFDbkIsUUFBUSxDQUFDLE1BQVQsR0FBa0I7SUFGVyxDQUFSO0FBSXZCLFdBQU87RUFORDs7RUFTUixPQUFBLEdBQVUsU0FBQyxJQUFEO0FBQ1IsUUFBQTtJQUFBLFFBQUEsR0FBVyxLQUFBLENBQUE7QUFFWDtNQUNFLFFBQUEsR0FBVyxJQUFBLENBQUE7TUFFWCxJQUFHLFFBQUEsWUFBb0IsT0FBdkI7UUFDRSxRQUFRLENBQUMsSUFBVCxDQUFjLFNBQUE7aUJBQ1osUUFBUSxDQUFDLE9BQVQsQ0FBQTtRQURZLENBQWQsRUFERjtPQUFBLE1BQUE7UUFJRSxRQUFRLENBQUMsT0FBVCxDQUFBLEVBSkY7T0FIRjtLQUFBLGNBQUE7TUFRTTtNQUNKLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFkLENBQXVCLGdCQUF2QixDQUFIO1FBQ0UsSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFuQixDQUE4Qix1QkFBQSxHQUF3QixLQUFLLENBQUMsT0FBNUQsRUFERjtPQUFBLE1BRUssSUFBRyxr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SUFMRzs7aUJBdUJMLElBQUEsR0FBTSxTQUFDLEdBQUQ7QUFDSixVQUFBO01BRE8sUUFBRjtNQUNMLE1BQUEsR0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLG1CQUFmLENBQUE7TUFDVCxZQUFBLEdBQWUsQ0FBQyxFQUFEO01BR2YsV0FBQSxHQUFjLEtBQU0sQ0FBQSxDQUFBLENBQU4sR0FBVyxLQUFNLENBQUEsQ0FBQSxDQUFqQixHQUFzQjtNQUNwQyxJQUFHLFdBQUg7UUFDRSxZQUFBLEdBQWUsQ0FBQyxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQVAsRUFBVyxDQUFYLENBQUQsRUFBZ0IsQ0FBQyxLQUFNLENBQUEsQ0FBQSxDQUFOLEdBQVcsQ0FBWixFQUFlLENBQWYsQ0FBaEIsRUFEakI7T0FBQSxNQUFBO1FBR0UsWUFBQSxHQUFlLENBQUMsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFELEVBQVMsQ0FBQyxNQUFNLENBQUMsZ0JBQVAsQ0FBQSxDQUFELEVBQTRCLENBQTVCLENBQVQsRUFIakI7O01BTUEsU0FBQSxHQUFZO0FBQ1osV0FBaUIsaUpBQWpCO1FBQ0UsU0FBUyxDQUFDLElBQVYsQ0FBZSxNQUFNLENBQUMsb0JBQVAsQ0FBNEIsU0FBNUIsQ0FBZjtBQURGO01BSUEsVUFBQSxHQUFhLENBQUMsQ0FBQyxNQUFGLENBQVMsU0FBVCxDQUFtQixDQUFDLElBQXBCLENBQXlCLElBQXpCLENBQUEsR0FBaUM7YUFDOUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFkLENBQTZCLFlBQTdCLEVBQTJDLFVBQTNDO0lBbEJJOzs7Ozs7RUFvQlIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFuZGpCIiwic291cmNlc0NvbnRlbnQiOlsicGF0aCA9IHJlcXVpcmUgJ3BhdGgnXG5Db21tYW5kRXJyb3IgPSByZXF1aXJlICcuL2NvbW1hbmQtZXJyb3InXG5mcyA9IHJlcXVpcmUgJ2ZzLXBsdXMnXG5WaW1PcHRpb24gPSByZXF1aXJlICcuL3ZpbS1vcHRpb24nXG5fID0gcmVxdWlyZSAndW5kZXJzY29yZS1wbHVzJ1xuXG5kZWZlciA9ICgpIC0+XG4gIGRlZmVycmVkID0ge31cbiAgZGVmZXJyZWQucHJvbWlzZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpIC0+XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IHJlc29sdmVcbiAgICBkZWZlcnJlZC5yZWplY3QgPSByZWplY3RcbiAgKVxuICByZXR1cm4gZGVmZXJyZWRcblxuXG50cnlTYXZlID0gKGZ1bmMpIC0+XG4gIGRlZmVycmVkID0gZGVmZXIoKVxuXG4gIHRyeVxuICAgIHJlc3BvbnNlID0gZnVuYygpXG5cbiAgICBpZiByZXNwb25zZSBpbnN0YW5jZW9mIFByb21pc2VcbiAgICAgIHJlc3BvbnNlLnRoZW4gLT5cbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpXG4gICAgZWxzZVxuICAgICAgZGVmZXJyZWQucmVzb2x2ZSgpXG4gIGNhdGNoIGVycm9yXG4gICAgaWYgZXJyb3IubWVzc2FnZS5lbmRzV2l0aCgnaXMgYSBkaXJlY3RvcnknKVxuICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXCJVbmFibGUgdG8gc2F2ZSBmaWxlOiAje2Vycm9yLm1lc3NhZ2V9XCIpXG4gICAgZWxzZSBpZiBlcnJvci5wYXRoP1xuICAgICAgaWYgZXJyb3IuY29kZSBpcyAnRUFDQ0VTJ1xuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnNcbiAgICAgICAgICAuYWRkV2FybmluZyhcIlVuYWJsZSB0byBzYXZlIGZpbGU6IFBlcm1pc3Npb24gZGVuaWVkICcje2Vycm9yLnBhdGh9J1wiKVxuICAgICAgZWxzZSBpZiBlcnJvci5jb2RlIGluIFsnRVBFUk0nLCAnRUJVU1knLCAnVU5LTk9XTicsICdFRVhJU1QnXVxuICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIlVuYWJsZSB0byBzYXZlIGZpbGUgJyN7ZXJyb3IucGF0aH0nXCIsXG4gICAgICAgICAgZGV0YWlsOiBlcnJvci5tZXNzYWdlKVxuICAgICAgZWxzZSBpZiBlcnJvci5jb2RlIGlzICdFUk9GUydcbiAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcoXG4gICAgICAgICAgXCJVbmFibGUgdG8gc2F2ZSBmaWxlOiBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0gJyN7ZXJyb3IucGF0aH0nXCIpXG4gICAgZWxzZSBpZiAoZXJyb3JNYXRjaCA9XG4gICAgICAgIC9FTk9URElSLCBub3QgYSBkaXJlY3RvcnkgJyhbXiddKyknLy5leGVjKGVycm9yLm1lc3NhZ2UpKVxuICAgICAgZmlsZU5hbWUgPSBlcnJvck1hdGNoWzFdXG4gICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhcIlVuYWJsZSB0byBzYXZlIGZpbGU6IEEgZGlyZWN0b3J5IGluIHRoZSBcIitcbiAgICAgICAgXCJwYXRoICcje2ZpbGVOYW1lfScgY291bGQgbm90IGJlIHdyaXR0ZW4gdG9cIilcbiAgICBlbHNlXG4gICAgICB0aHJvdyBlcnJvclxuXG4gIGRlZmVycmVkLnByb21pc2Vcblxuc2F2ZUFzID0gKGZpbGVQYXRoLCBlZGl0b3IpIC0+XG4gIGZzLndyaXRlRmlsZVN5bmMoZmlsZVBhdGgsIGVkaXRvci5nZXRUZXh0KCkpXG5cbmdldEZ1bGxQYXRoID0gKGZpbGVQYXRoKSAtPlxuICBmaWxlUGF0aCA9IGZzLm5vcm1hbGl6ZShmaWxlUGF0aClcblxuICBpZiBwYXRoLmlzQWJzb2x1dGUoZmlsZVBhdGgpXG4gICAgZmlsZVBhdGhcbiAgZWxzZSBpZiBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKS5sZW5ndGggPT0gMFxuICAgIHBhdGguam9pbihmcy5ub3JtYWxpemUoJ34nKSwgZmlsZVBhdGgpXG4gIGVsc2VcbiAgICBwYXRoLmpvaW4oYXRvbS5wcm9qZWN0LmdldFBhdGhzKClbMF0sIGZpbGVQYXRoKVxuXG5yZXBsYWNlR3JvdXBzID0gKGdyb3Vwcywgc3RyaW5nKSAtPlxuICByZXBsYWNlZCA9ICcnXG4gIGVzY2FwZWQgPSBmYWxzZVxuICB3aGlsZSAoY2hhciA9IHN0cmluZ1swXSk/XG4gICAgc3RyaW5nID0gc3RyaW5nWzEuLl1cbiAgICBpZiBjaGFyIGlzICdcXFxcJyBhbmQgbm90IGVzY2FwZWRcbiAgICAgIGVzY2FwZWQgPSB0cnVlXG4gICAgZWxzZSBpZiAvXFxkLy50ZXN0KGNoYXIpIGFuZCBlc2NhcGVkXG4gICAgICBlc2NhcGVkID0gZmFsc2VcbiAgICAgIGdyb3VwID0gZ3JvdXBzW3BhcnNlSW50KGNoYXIpXVxuICAgICAgZ3JvdXAgPz0gJydcbiAgICAgIHJlcGxhY2VkICs9IGdyb3VwXG4gICAgZWxzZVxuICAgICAgZXNjYXBlZCA9IGZhbHNlXG4gICAgICByZXBsYWNlZCArPSBjaGFyXG5cbiAgcmVwbGFjZWRcblxuZ2V0U2VhcmNoVGVybSA9ICh0ZXJtLCBtb2RpZmllcnMgPSB7J2cnOiB0cnVlfSkgLT5cblxuICBlc2NhcGVkID0gZmFsc2VcbiAgaGFzYyA9IGZhbHNlXG4gIGhhc0MgPSBmYWxzZVxuICB0ZXJtXyA9IHRlcm1cbiAgdGVybSA9ICcnXG4gIGZvciBjaGFyIGluIHRlcm1fXG4gICAgaWYgY2hhciBpcyAnXFxcXCcgYW5kIG5vdCBlc2NhcGVkXG4gICAgICBlc2NhcGVkID0gdHJ1ZVxuICAgICAgdGVybSArPSBjaGFyXG4gICAgZWxzZVxuICAgICAgaWYgY2hhciBpcyAnYycgYW5kIGVzY2FwZWRcbiAgICAgICAgaGFzYyA9IHRydWVcbiAgICAgICAgdGVybSA9IHRlcm1bLi4uLTFdXG4gICAgICBlbHNlIGlmIGNoYXIgaXMgJ0MnIGFuZCBlc2NhcGVkXG4gICAgICAgIGhhc0MgPSB0cnVlXG4gICAgICAgIHRlcm0gPSB0ZXJtWy4uLi0xXVxuICAgICAgZWxzZSBpZiBjaGFyIGlzbnQgJ1xcXFwnXG4gICAgICAgIHRlcm0gKz0gY2hhclxuICAgICAgZXNjYXBlZCA9IGZhbHNlXG5cbiAgaWYgaGFzQ1xuICAgIG1vZGlmaWVyc1snaSddID0gZmFsc2VcbiAgaWYgKG5vdCBoYXNDIGFuZCBub3QgdGVybS5tYXRjaCgnW0EtWl0nKSBhbmQgXFxcbiAgICAgIGF0b20uY29uZmlnLmdldCgndmltLW1vZGUudXNlU21hcnRjYXNlRm9yU2VhcmNoJykpIG9yIGhhc2NcbiAgICBtb2RpZmllcnNbJ2knXSA9IHRydWVcblxuICBtb2RGbGFncyA9IE9iamVjdC5rZXlzKG1vZGlmaWVycykuZmlsdGVyKChrZXkpIC0+IG1vZGlmaWVyc1trZXldKS5qb2luKCcnKVxuXG4gIHRyeVxuICAgIG5ldyBSZWdFeHAodGVybSwgbW9kRmxhZ3MpXG4gIGNhdGNoXG4gICAgbmV3IFJlZ0V4cChfLmVzY2FwZVJlZ0V4cCh0ZXJtKSwgbW9kRmxhZ3MpXG5cbmNsYXNzIEV4XG4gIEBzaW5nbGV0b246ID0+XG4gICAgQGV4IHx8PSBuZXcgRXhcblxuICBAcmVnaXN0ZXJDb21tYW5kOiAobmFtZSwgZnVuYykgPT5cbiAgICBAc2luZ2xldG9uKClbbmFtZV0gPSBmdW5jXG5cbiAgQHJlZ2lzdGVyQWxpYXM6IChhbGlhcywgbmFtZSkgPT5cbiAgICBAc2luZ2xldG9uKClbYWxpYXNdID0gKGFyZ3MpID0+IEBzaW5nbGV0b24oKVtuYW1lXShhcmdzKVxuXG4gIEBnZXRDb21tYW5kczogKCkgPT5cbiAgICBPYmplY3Qua2V5cyhFeC5zaW5nbGV0b24oKSkuY29uY2F0KE9iamVjdC5rZXlzKEV4LnByb3RvdHlwZSkpLmZpbHRlcigoY21kLCBpbmRleCwgbGlzdCkgLT5cbiAgICAgIGxpc3QuaW5kZXhPZihjbWQpID09IGluZGV4XG4gICAgKVxuXG4gIHF1aXQ6IC0+XG4gICAgYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpLmRlc3Ryb3lBY3RpdmVJdGVtKClcblxuICBxdWl0YWxsOiAtPlxuICAgIGF0b20uY2xvc2UoKVxuXG4gIHE6ID0+IEBxdWl0KClcblxuICBxYWxsOiA9PiBAcXVpdGFsbCgpXG5cbiAgdGFiZWRpdDogKGFyZ3MpID0+XG4gICAgaWYgYXJncy5hcmdzLnRyaW0oKSBpc250ICcnXG4gICAgICBAZWRpdChhcmdzKVxuICAgIGVsc2VcbiAgICAgIEB0YWJuZXcoYXJncylcblxuICB0YWJlOiAoYXJncykgPT4gQHRhYmVkaXQoYXJncylcblxuICB0YWJuZXc6IChhcmdzKSA9PlxuICAgIGlmIGFyZ3MuYXJncy50cmltKCkgaXMgJydcbiAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oKVxuICAgIGVsc2VcbiAgICAgIEB0YWJlZGl0KGFyZ3MpXG5cbiAgdGFiY2xvc2U6IChhcmdzKSA9PiBAcXVpdChhcmdzKVxuXG4gIHRhYmM6ID0+IEB0YWJjbG9zZSgpXG5cbiAgdGFibmV4dDogLT5cbiAgICBwYW5lID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlUGFuZSgpXG4gICAgcGFuZS5hY3RpdmF0ZU5leHRJdGVtKClcblxuICB0YWJuOiA9PiBAdGFibmV4dCgpXG5cbiAgdGFicHJldmlvdXM6IC0+XG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIHBhbmUuYWN0aXZhdGVQcmV2aW91c0l0ZW0oKVxuXG4gIHRhYnA6ID0+IEB0YWJwcmV2aW91cygpXG5cbiAgdGFib25seTogLT5cbiAgICB0YWJCYXIgPSBhdG9tLndvcmtzcGFjZS5nZXRQYW5lcygpWzBdXG4gICAgdGFiQmFyRWxlbWVudCA9IGF0b20udmlld3MuZ2V0Vmlldyh0YWJCYXIpLnF1ZXJ5U2VsZWN0b3IoXCIudGFiLWJhclwiKVxuICAgIHRhYkJhckVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5yaWdodC1jbGlja2VkXCIpICYmIHRhYkJhckVsZW1lbnQucXVlcnlTZWxlY3RvcihcIi5yaWdodC1jbGlja2VkXCIpLmNsYXNzTGlzdC5yZW1vdmUoXCJyaWdodC1jbGlja2VkXCIpXG4gICAgdGFiQmFyRWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLmFjdGl2ZVwiKS5jbGFzc0xpc3QuYWRkKFwicmlnaHQtY2xpY2tlZFwiKVxuICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2godGFiQmFyRWxlbWVudCwgJ3RhYnM6Y2xvc2Utb3RoZXItdGFicycpXG4gICAgdGFiQmFyRWxlbWVudC5xdWVyeVNlbGVjdG9yKFwiLmFjdGl2ZVwiKS5jbGFzc0xpc3QucmVtb3ZlKFwicmlnaHQtY2xpY2tlZFwiKVxuXG4gIHRhYm86ID0+IEB0YWJvbmx5KClcblxuICBlZGl0OiAoeyByYW5nZSwgYXJncywgZWRpdG9yIH0pIC0+XG4gICAgZmlsZVBhdGggPSBhcmdzLnRyaW0oKVxuICAgIGlmIGZpbGVQYXRoWzBdIGlzICchJ1xuICAgICAgZm9yY2UgPSB0cnVlXG4gICAgICBmaWxlUGF0aCA9IGZpbGVQYXRoWzEuLl0udHJpbSgpXG4gICAgZWxzZVxuICAgICAgZm9yY2UgPSBmYWxzZVxuXG4gICAgaWYgZWRpdG9yLmlzTW9kaWZpZWQoKSBhbmQgbm90IGZvcmNlXG4gICAgICB0aHJvdyBuZXcgQ29tbWFuZEVycm9yKCdObyB3cml0ZSBzaW5jZSBsYXN0IGNoYW5nZSAoYWRkICEgdG8gb3ZlcnJpZGUpJylcbiAgICBpZiBmaWxlUGF0aC5pbmRleE9mKCcgJykgaXNudCAtMVxuICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcignT25seSBvbmUgZmlsZSBuYW1lIGFsbG93ZWQnKVxuXG4gICAgaWYgZmlsZVBhdGgubGVuZ3RoIGlzbnQgMFxuICAgICAgZnVsbFBhdGggPSBnZXRGdWxsUGF0aChmaWxlUGF0aClcbiAgICAgIGlmIGZ1bGxQYXRoIGlzIGVkaXRvci5nZXRQYXRoKClcbiAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnJlbG9hZCgpXG4gICAgICBlbHNlXG4gICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oZnVsbFBhdGgpXG4gICAgZWxzZVxuICAgICAgaWYgZWRpdG9yLmdldFBhdGgoKT9cbiAgICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnJlbG9hZCgpXG4gICAgICBlbHNlXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoJ05vIGZpbGUgbmFtZScpXG5cbiAgZTogKGFyZ3MpID0+IEBlZGl0KGFyZ3MpXG5cbiAgZW5ldzogLT5cbiAgICBidWZmZXIgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCkuYnVmZmVyXG4gICAgYnVmZmVyLnNldFBhdGgodW5kZWZpbmVkKVxuICAgIGJ1ZmZlci5sb2FkKClcblxuICB3cml0ZTogKHsgcmFuZ2UsIGFyZ3MsIGVkaXRvciwgc2F2ZWFzIH0pIC0+XG4gICAgc2F2ZWFzID89IGZhbHNlXG4gICAgZmlsZVBhdGggPSBhcmdzXG4gICAgaWYgZmlsZVBhdGhbMF0gaXMgJyEnXG4gICAgICBmb3JjZSA9IHRydWVcbiAgICAgIGZpbGVQYXRoID0gZmlsZVBhdGhbMS4uXVxuICAgIGVsc2VcbiAgICAgIGZvcmNlID0gZmFsc2VcblxuICAgIGZpbGVQYXRoID0gZmlsZVBhdGgudHJpbSgpXG4gICAgaWYgZmlsZVBhdGguaW5kZXhPZignICcpIGlzbnQgLTFcbiAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoJ09ubHkgb25lIGZpbGUgbmFtZSBhbGxvd2VkJylcblxuICAgIGRlZmVycmVkID0gZGVmZXIoKVxuXG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG4gICAgc2F2ZWQgPSBmYWxzZVxuICAgIGlmIGZpbGVQYXRoLmxlbmd0aCBpc250IDBcbiAgICAgIGZ1bGxQYXRoID0gZ2V0RnVsbFBhdGgoZmlsZVBhdGgpXG4gICAgaWYgZWRpdG9yLmdldFBhdGgoKT8gYW5kIChub3QgZnVsbFBhdGg/IG9yIGVkaXRvci5nZXRQYXRoKCkgPT0gZnVsbFBhdGgpXG4gICAgICBpZiBzYXZlYXNcbiAgICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcihcIkFyZ3VtZW50IHJlcXVpcmVkXCIpXG4gICAgICBlbHNlXG4gICAgICAgICMgVXNlIGVkaXRvci5zYXZlIHdoZW4gbm8gcGF0aCBpcyBnaXZlbiBvciB0aGUgcGF0aCB0byB0aGUgZmlsZSBpcyBnaXZlblxuICAgICAgICB0cnlTYXZlKC0+IGVkaXRvci5zYXZlKCkpLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSlcbiAgICAgICAgc2F2ZWQgPSB0cnVlXG4gICAgZWxzZSBpZiBub3QgZnVsbFBhdGg/XG4gICAgICBmdWxsUGF0aCA9IGF0b20uc2hvd1NhdmVEaWFsb2dTeW5jKClcblxuICAgIGlmIG5vdCBzYXZlZCBhbmQgZnVsbFBhdGg/XG4gICAgICBpZiBub3QgZm9yY2UgYW5kIGZzLmV4aXN0c1N5bmMoZnVsbFBhdGgpXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJGaWxlIGV4aXN0cyAoYWRkICEgdG8gb3ZlcnJpZGUpXCIpXG4gICAgICBpZiBzYXZlYXMgb3IgZWRpdG9yLmdldEZpbGVOYW1lKCkgPT0gbnVsbFxuICAgICAgICBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKClcbiAgICAgICAgdHJ5U2F2ZSgtPiBlZGl0b3Iuc2F2ZUFzKGZ1bGxQYXRoLCBlZGl0b3IpKS50aGVuKGRlZmVycmVkLnJlc29sdmUpXG4gICAgICBlbHNlXG4gICAgICAgIHRyeVNhdmUoLT4gc2F2ZUFzKGZ1bGxQYXRoLCBlZGl0b3IpKS50aGVuKGRlZmVycmVkLnJlc29sdmUpXG5cbiAgICBkZWZlcnJlZC5wcm9taXNlXG5cbiAgd2FsbDogLT5cbiAgICBhdG9tLndvcmtzcGFjZS5zYXZlQWxsKClcblxuICB3OiAoYXJncykgPT5cbiAgICBAd3JpdGUoYXJncylcblxuICB3cTogKGFyZ3MpID0+XG4gICAgQHdyaXRlKGFyZ3MpLnRoZW4oPT4gQHF1aXQoKSlcblxuICB3YTogPT5cbiAgICBAd2FsbCgpXG5cbiAgd3FhbGw6ID0+XG4gICAgQHdhbGwoKVxuICAgIEBxdWl0YWxsKClcblxuICB3cWE6ID0+XG4gICAgQHdxYWxsKClcblxuICB4YWxsOiA9PlxuICAgIEB3cWFsbCgpXG5cbiAgeGE6ID0+XG4gICAgQHdxYWxsKClcblxuICBzYXZlYXM6IChhcmdzKSA9PlxuICAgIGFyZ3Muc2F2ZWFzID0gdHJ1ZVxuICAgIEB3cml0ZShhcmdzKVxuXG4gIHhpdDogKGFyZ3MpID0+IEB3cShhcmdzKVxuXG4gIHg6IChhcmdzKSA9PiBAeGl0KGFyZ3MpXG5cbiAgc3BsaXQ6ICh7IHJhbmdlLCBhcmdzIH0pIC0+XG4gICAgYXJncyA9IGFyZ3MudHJpbSgpXG4gICAgZmlsZVBhdGhzID0gYXJncy5zcGxpdCgnICcpXG4gICAgZmlsZVBhdGhzID0gdW5kZWZpbmVkIGlmIGZpbGVQYXRocy5sZW5ndGggaXMgMSBhbmQgZmlsZVBhdGhzWzBdIGlzICcnXG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnZXgtbW9kZS5zcGxpdGJlbG93JylcbiAgICAgIGlmIGZpbGVQYXRocz8gYW5kIGZpbGVQYXRocy5sZW5ndGggPiAwXG4gICAgICAgIG5ld1BhbmUgPSBwYW5lLnNwbGl0RG93bigpXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVQYXRoc1xuICAgICAgICAgIGRvIC0+XG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lIGZpbGUsIG5ld1BhbmVcbiAgICAgIGVsc2VcbiAgICAgICAgcGFuZS5zcGxpdERvd24oY29weUFjdGl2ZUl0ZW06IHRydWUpXG4gICAgZWxzZVxuICAgICAgaWYgZmlsZVBhdGhzPyBhbmQgZmlsZVBhdGhzLmxlbmd0aCA+IDBcbiAgICAgICAgbmV3UGFuZSA9IHBhbmUuc3BsaXRVcCgpXG4gICAgICAgIGZvciBmaWxlIGluIGZpbGVQYXRoc1xuICAgICAgICAgIGRvIC0+XG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuVVJJSW5QYW5lIGZpbGUsIG5ld1BhbmVcbiAgICAgIGVsc2VcbiAgICAgICAgcGFuZS5zcGxpdFVwKGNvcHlBY3RpdmVJdGVtOiB0cnVlKVxuXG5cbiAgc3A6IChhcmdzKSA9PiBAc3BsaXQoYXJncylcblxuICBzdWJzdGl0dXRlOiAoeyByYW5nZSwgYXJncywgZWRpdG9yLCB2aW1TdGF0ZSB9KSAtPlxuICAgIGFyZ3NfID0gYXJncy50cmltTGVmdCgpXG4gICAgZGVsaW0gPSBhcmdzX1swXVxuICAgIGlmIC9bYS16MS05XFxcXFwifF0vaS50ZXN0KGRlbGltKVxuICAgICAgdGhyb3cgbmV3IENvbW1hbmRFcnJvcihcbiAgICAgICAgXCJSZWd1bGFyIGV4cHJlc3Npb25zIGNhbid0IGJlIGRlbGltaXRlZCBieSBhbHBoYW51bWVyaWMgY2hhcmFjdGVycywgJ1xcXFwnLCAnXFxcIicgb3IgJ3wnXCIpXG4gICAgYXJnc18gPSBhcmdzX1sxLi5dXG4gICAgZXNjYXBlQ2hhcnMgPSB7dDogJ1xcdCcsIG46ICdcXG4nLCByOiAnXFxyJ31cbiAgICBwYXJzZWQgPSBbJycsICcnLCAnJ11cbiAgICBwYXJzaW5nID0gMFxuICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgIHdoaWxlIChjaGFyID0gYXJnc19bMF0pP1xuICAgICAgYXJnc18gPSBhcmdzX1sxLi5dXG4gICAgICBpZiBjaGFyIGlzIGRlbGltXG4gICAgICAgIGlmIG5vdCBlc2NhcGVkXG4gICAgICAgICAgcGFyc2luZysrXG4gICAgICAgICAgaWYgcGFyc2luZyA+IDJcbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoJ1RyYWlsaW5nIGNoYXJhY3RlcnMnKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgcGFyc2VkW3BhcnNpbmddID0gcGFyc2VkW3BhcnNpbmddWy4uLi0xXVxuICAgICAgZWxzZSBpZiBjaGFyIGlzICdcXFxcJyBhbmQgbm90IGVzY2FwZWRcbiAgICAgICAgcGFyc2VkW3BhcnNpbmddICs9IGNoYXJcbiAgICAgICAgZXNjYXBlZCA9IHRydWVcbiAgICAgIGVsc2UgaWYgcGFyc2luZyA9PSAxIGFuZCBlc2NhcGVkIGFuZCBlc2NhcGVDaGFyc1tjaGFyXT9cbiAgICAgICAgcGFyc2VkW3BhcnNpbmddICs9IGVzY2FwZUNoYXJzW2NoYXJdXG4gICAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgICAgZWxzZVxuICAgICAgICBlc2NhcGVkID0gZmFsc2VcbiAgICAgICAgcGFyc2VkW3BhcnNpbmddICs9IGNoYXJcblxuICAgIFtwYXR0ZXJuLCBzdWJzdGl0aW9uLCBmbGFnc10gPSBwYXJzZWRcbiAgICBpZiBwYXR0ZXJuIGlzICcnXG4gICAgICBpZiB2aW1TdGF0ZS5nZXRTZWFyY2hIaXN0b3J5SXRlbT9cbiAgICAgICAgIyB2aW0tbW9kZVxuICAgICAgICBwYXR0ZXJuID0gdmltU3RhdGUuZ2V0U2VhcmNoSGlzdG9yeUl0ZW0oKVxuICAgICAgZWxzZSBpZiB2aW1TdGF0ZS5zZWFyY2hIaXN0b3J5P1xuICAgICAgICAjIHZpbS1tb2RlLXBsdXNcbiAgICAgICAgcGF0dGVybiA9IHZpbVN0YXRlLnNlYXJjaEhpc3RvcnkuZ2V0KCdwcmV2JylcblxuICAgICAgaWYgbm90IHBhdHRlcm4/XG4gICAgICAgIGF0b20uYmVlcCgpXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoJ05vIHByZXZpb3VzIHJlZ3VsYXIgZXhwcmVzc2lvbicpXG4gICAgZWxzZVxuICAgICAgaWYgdmltU3RhdGUucHVzaFNlYXJjaEhpc3Rvcnk/XG4gICAgICAgICMgdmltLW1vZGVcbiAgICAgICAgdmltU3RhdGUucHVzaFNlYXJjaEhpc3RvcnkocGF0dGVybilcbiAgICAgIGVsc2UgaWYgdmltU3RhdGUuc2VhcmNoSGlzdG9yeT9cbiAgICAgICAgIyB2aW0tbW9kZS1wbHVzXG4gICAgICAgIHZpbVN0YXRlLnNlYXJjaEhpc3Rvcnkuc2F2ZShwYXR0ZXJuKVxuXG4gICAgdHJ5XG4gICAgICBmbGFnc09iaiA9IHt9XG4gICAgICBmbGFncy5zcGxpdCgnJykuZm9yRWFjaCgoZmxhZykgLT4gZmxhZ3NPYmpbZmxhZ10gPSB0cnVlKVxuICAgICAgIyBnZGVmYXVsdCBvcHRpb25cbiAgICAgIGlmIGF0b20uY29uZmlnLmdldCgnZXgtbW9kZS5nZGVmYXVsdCcpXG4gICAgICAgIGZsYWdzT2JqLmcgPSAhZmxhZ3NPYmouZ1xuICAgICAgcGF0dGVyblJFID0gZ2V0U2VhcmNoVGVybShwYXR0ZXJuLCBmbGFnc09iailcbiAgICBjYXRjaCBlXG4gICAgICBpZiBlLm1lc3NhZ2UuaW5kZXhPZignSW52YWxpZCBmbGFncyBzdXBwbGllZCB0byBSZWdFeHAgY29uc3RydWN0b3InKSBpcyAwXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJJbnZhbGlkIGZsYWdzOiAje2UubWVzc2FnZVs0NS4uXX1cIilcbiAgICAgIGVsc2UgaWYgZS5tZXNzYWdlLmluZGV4T2YoJ0ludmFsaWQgcmVndWxhciBleHByZXNzaW9uOiAnKSBpcyAwXG4gICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJJbnZhbGlkIFJlZ0V4OiAje2UubWVzc2FnZVsyNy4uXX1cIilcbiAgICAgIGVsc2VcbiAgICAgICAgdGhyb3cgZVxuXG4gICAgZWRpdG9yLnRyYW5zYWN0IC0+XG4gICAgICBmb3IgbGluZSBpbiBbcmFuZ2VbMF0uLnJhbmdlWzFdXVxuICAgICAgICBlZGl0b3Iuc2NhbkluQnVmZmVyUmFuZ2UoXG4gICAgICAgICAgcGF0dGVyblJFLFxuICAgICAgICAgIFtbbGluZSwgMF0sIFtsaW5lICsgMSwgMF1dLFxuICAgICAgICAgICh7bWF0Y2gsIHJlcGxhY2V9KSAtPlxuICAgICAgICAgICAgcmVwbGFjZShyZXBsYWNlR3JvdXBzKG1hdGNoWy4uXSwgc3Vic3RpdGlvbikpXG4gICAgICAgIClcblxuICBzOiAoYXJncykgPT4gQHN1YnN0aXR1dGUoYXJncylcblxuICB2c3BsaXQ6ICh7IHJhbmdlLCBhcmdzIH0pIC0+XG4gICAgYXJncyA9IGFyZ3MudHJpbSgpXG4gICAgZmlsZVBhdGhzID0gYXJncy5zcGxpdCgnICcpXG4gICAgZmlsZVBhdGhzID0gdW5kZWZpbmVkIGlmIGZpbGVQYXRocy5sZW5ndGggaXMgMSBhbmQgZmlsZVBhdGhzWzBdIGlzICcnXG4gICAgcGFuZSA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVBhbmUoKVxuICAgIGlmIGF0b20uY29uZmlnLmdldCgnZXgtbW9kZS5zcGxpdHJpZ2h0JylcbiAgICAgIGlmIGZpbGVQYXRocz8gYW5kIGZpbGVQYXRocy5sZW5ndGggPiAwXG4gICAgICAgIG5ld1BhbmUgPSBwYW5lLnNwbGl0UmlnaHQoKVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlUGF0aHNcbiAgICAgICAgICBkbyAtPlxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSBmaWxlLCBuZXdQYW5lXG4gICAgICBlbHNlXG4gICAgICAgIHBhbmUuc3BsaXRSaWdodChjb3B5QWN0aXZlSXRlbTogdHJ1ZSlcbiAgICBlbHNlXG4gICAgICBpZiBmaWxlUGF0aHM/IGFuZCBmaWxlUGF0aHMubGVuZ3RoID4gMFxuICAgICAgICBuZXdQYW5lID0gcGFuZS5zcGxpdExlZnQoKVxuICAgICAgICBmb3IgZmlsZSBpbiBmaWxlUGF0aHNcbiAgICAgICAgICBkbyAtPlxuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlblVSSUluUGFuZSBmaWxlLCBuZXdQYW5lXG4gICAgICBlbHNlXG4gICAgICAgIHBhbmUuc3BsaXRMZWZ0KGNvcHlBY3RpdmVJdGVtOiB0cnVlKVxuXG4gIHZzcDogKGFyZ3MpID0+IEB2c3BsaXQoYXJncylcblxuICBkZWxldGU6ICh7IHJhbmdlIH0pIC0+XG4gICAgcmFuZ2UgPSBbW3JhbmdlWzBdLCAwXSwgW3JhbmdlWzFdICsgMSwgMF1dXG4gICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpXG5cbiAgICB0ZXh0ID0gZWRpdG9yLmdldFRleHRJbkJ1ZmZlclJhbmdlKHJhbmdlKVxuICAgIGF0b20uY2xpcGJvYXJkLndyaXRlKHRleHQpXG5cbiAgICBlZGl0b3IuYnVmZmVyLnNldFRleHRJblJhbmdlKHJhbmdlLCAnJylcblxuICB5YW5rOiAoeyByYW5nZSB9KSAtPlxuICAgIHJhbmdlID0gW1tyYW5nZVswXSwgMF0sIFtyYW5nZVsxXSArIDEsIDBdXVxuICAgIHR4dCA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKS5nZXRUZXh0SW5CdWZmZXJSYW5nZShyYW5nZSlcbiAgICBhdG9tLmNsaXBib2FyZC53cml0ZSh0eHQpO1xuXG4gIHNldDogKHsgcmFuZ2UsIGFyZ3MgfSkgLT5cbiAgICBhcmdzID0gYXJncy50cmltKClcbiAgICBpZiBhcmdzID09IFwiXCJcbiAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJObyBvcHRpb24gc3BlY2lmaWVkXCIpXG4gICAgb3B0aW9ucyA9IGFyZ3Muc3BsaXQoJyAnKVxuICAgIGZvciBvcHRpb24gaW4gb3B0aW9uc1xuICAgICAgZG8gLT5cbiAgICAgICAgaWYgb3B0aW9uLmluY2x1ZGVzKFwiPVwiKVxuICAgICAgICAgIG5hbWVWYWxQYWlyID0gb3B0aW9uLnNwbGl0KFwiPVwiKVxuICAgICAgICAgIGlmIChuYW1lVmFsUGFpci5sZW5ndGggIT0gMilcbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJXcm9uZyBvcHRpb24gZm9ybWF0LiBbbmFtZV09W3ZhbHVlXSBmb3JtYXQgaXMgZXhwZWN0ZWRcIilcbiAgICAgICAgICBvcHRpb25OYW1lID0gbmFtZVZhbFBhaXJbMF1cbiAgICAgICAgICBvcHRpb25WYWx1ZSA9IG5hbWVWYWxQYWlyWzFdXG4gICAgICAgICAgb3B0aW9uUHJvY2Vzc29yID0gVmltT3B0aW9uLnNpbmdsZXRvbigpW29wdGlvbk5hbWVdXG4gICAgICAgICAgaWYgbm90IG9wdGlvblByb2Nlc3Nvcj9cbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJObyBzdWNoIG9wdGlvbjogI3tvcHRpb25OYW1lfVwiKVxuICAgICAgICAgIG9wdGlvblByb2Nlc3NvcihvcHRpb25WYWx1ZSlcbiAgICAgICAgZWxzZVxuICAgICAgICAgIG9wdGlvblByb2Nlc3NvciA9IFZpbU9wdGlvbi5zaW5nbGV0b24oKVtvcHRpb25dXG4gICAgICAgICAgaWYgbm90IG9wdGlvblByb2Nlc3Nvcj9cbiAgICAgICAgICAgIHRocm93IG5ldyBDb21tYW5kRXJyb3IoXCJObyBzdWNoIG9wdGlvbjogI3tvcHRpb259XCIpXG4gICAgICAgICAgb3B0aW9uUHJvY2Vzc29yKClcblxuICBzb3J0OiAoeyByYW5nZSB9KSA9PlxuICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKVxuICAgIHNvcnRpbmdSYW5nZSA9IFtbXV1cblxuICAgICMgSWYgbm8gcmFuZ2UgaXMgcHJvdmlkZWQsIHRoZSBlbnRpcmUgZmlsZSBzaG91bGQgYmUgc29ydGVkLlxuICAgIGlzTXVsdGlMaW5lID0gcmFuZ2VbMV0gLSByYW5nZVswXSA+IDFcbiAgICBpZiBpc011bHRpTGluZVxuICAgICAgc29ydGluZ1JhbmdlID0gW1tyYW5nZVswXSwgMF0sIFtyYW5nZVsxXSArIDEsIDBdXVxuICAgIGVsc2VcbiAgICAgIHNvcnRpbmdSYW5nZSA9IFtbMCwgMF0sIFtlZGl0b3IuZ2V0TGFzdEJ1ZmZlclJvdygpLCAwXV1cblxuICAgICMgU3RvcmUgZXZlcnkgYnVmZmVyZWRSb3cgc3RyaW5nIGluIGFuIGFycmF5LlxuICAgIHRleHRMaW5lcyA9IFtdXG4gICAgZm9yIGxpbmVJbmRleCBpbiBbc29ydGluZ1JhbmdlWzBdWzBdLi5zb3J0aW5nUmFuZ2VbMV1bMF0gLSAxXVxuICAgICAgdGV4dExpbmVzLnB1c2goZWRpdG9yLmxpbmVUZXh0Rm9yQnVmZmVyUm93KGxpbmVJbmRleCkpXG5cbiAgICAjIFNvcnQgdGhlIGFycmF5IGFuZCBqb2luIHRoZW0gdG9nZXRoZXIgd2l0aCBuZXdsaW5lcyBmb3Igd3JpdGluZyBiYWNrIHRvIHRoZSBmaWxlLlxuICAgIHNvcnRlZFRleHQgPSBfLnNvcnRCeSh0ZXh0TGluZXMpLmpvaW4oJ1xcbicpICsgJ1xcbidcbiAgICBlZGl0b3IuYnVmZmVyLnNldFRleHRJblJhbmdlKHNvcnRpbmdSYW5nZSwgc29ydGVkVGV4dClcblxubW9kdWxlLmV4cG9ydHMgPSBFeFxuIl19
