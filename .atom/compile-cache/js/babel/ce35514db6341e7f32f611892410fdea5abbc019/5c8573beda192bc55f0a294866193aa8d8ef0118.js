Object.defineProperty(exports, '__esModule', {
  value: true
});

var _atom = require('atom');

var _helpers = require('./helpers');

var VALID_SEVERITY = new Set(['error', 'warning', 'info']);

function validateUI(ui) {
  var messages = [];

  if (ui && typeof ui === 'object') {
    if (typeof ui.name !== 'string') {
      messages.push('UI.name must be a string');
    }
    if (typeof ui.didBeginLinting !== 'function') {
      messages.push('UI.didBeginLinting must be a function');
    }
    if (typeof ui.didFinishLinting !== 'function') {
      messages.push('UI.didFinishLinting must be a function');
    }
    if (typeof ui.render !== 'function') {
      messages.push('UI.render must be a function');
    }
    if (typeof ui.dispose !== 'function') {
      messages.push('UI.dispose must be a function');
    }
  } else {
    messages.push('UI must be an object');
  }

  if (messages.length) {
    (0, _helpers.showError)('Invalid UI received', 'These issues were encountered while registering the UI named \'' + (ui && ui.name ? ui.name : 'Unknown') + '\'', messages);
    return false;
  }

  return true;
}

function validateLinter(linter, version) {
  var messages = [];

  if (linter && typeof linter === 'object') {
    if (typeof linter.name !== 'string') {
      if (version === 2) {
        messages.push('Linter.name must be a string');
      } else linter.name = 'Unknown';
    }
    if (typeof linter.scope !== 'string' || linter.scope !== 'file' && linter.scope !== 'project') {
      messages.push("Linter.scope must be either 'file' or 'project'");
    }
    if (version === 1 && typeof linter.lintOnFly !== 'boolean') {
      messages.push('Linter.lintOnFly must be a boolean');
    } else if (version === 2 && typeof linter.lintsOnChange !== 'boolean') {
      messages.push('Linter.lintsOnChange must be a boolean');
    }
    if (!Array.isArray(linter.grammarScopes)) {
      messages.push('Linter.grammarScopes must be an Array');
    }
    if (typeof linter.lint !== 'function') {
      messages.push('Linter.lint must be a function');
    }
  } else {
    messages.push('Linter must be an object');
  }

  if (messages.length) {
    (0, _helpers.showError)('Invalid Linter received', 'These issues were encountered while registering a Linter named \'' + (linter && linter.name ? linter.name : 'Unknown') + '\'', messages);
    return false;
  }

  return true;
}

function validateIndie(indie) {
  var messages = [];

  if (indie && typeof indie === 'object') {
    if (typeof indie.name !== 'string') {
      messages.push('Indie.name must be a string');
    }
  } else {
    messages.push('Indie must be an object');
  }

  if (messages.length) {
    (0, _helpers.showError)('Invalid Indie received', 'These issues were encountered while registering an Indie Linter named \'' + (indie && indie.name ? indie.name : 'Unknown') + '\'', messages);
    return false;
  }

  return true;
}

function validateMessages(linterName, entries) {
  var messages = [];

  if (Array.isArray(entries)) {
    var invalidURL = false;
    var invalidIcon = false;
    var invalidExcerpt = false;
    var invalidLocation = false;
    var invalidSeverity = false;
    var invalidSolution = false;
    var invalidReference = false;
    var invalidDescription = false;
    var invalidLinterName = false;

    for (var i = 0, _length = entries.length; i < _length; ++i) {
      var message = entries[i];
      var reference = message.reference;
      if (!invalidIcon && message.icon && typeof message.icon !== 'string') {
        invalidIcon = true;
        messages.push('Message.icon must be a string');
      }
      if (!invalidLocation && (!message.location || typeof message.location !== 'object' || typeof message.location.file !== 'string' || typeof message.location.position !== 'object' || !message.location.position)) {
        invalidLocation = true;
        messages.push('Message.location must be valid');
      } else if (!invalidLocation) {
        var range = _atom.Range.fromObject(message.location.position);
        if (Number.isNaN(range.start.row) || Number.isNaN(range.start.column) || Number.isNaN(range.end.row) || Number.isNaN(range.end.column)) {
          invalidLocation = true;
          messages.push('Message.location.position should not contain NaN coordinates');
        }
      }
      if (!invalidSolution && message.solutions && !Array.isArray(message.solutions)) {
        invalidSolution = true;
        messages.push('Message.solutions must be valid');
      }
      if (!invalidReference && reference && (typeof reference !== 'object' || typeof reference.file !== 'string' || typeof reference.position !== 'object' || !reference.position)) {
        invalidReference = true;
        messages.push('Message.reference must be valid');
      } else if (!invalidReference && reference) {
        var position = _atom.Point.fromObject(reference.position);
        if (Number.isNaN(position.row) || Number.isNaN(position.column)) {
          invalidReference = true;
          messages.push('Message.reference.position should not contain NaN coordinates');
        }
      }
      if (!invalidExcerpt && typeof message.excerpt !== 'string') {
        invalidExcerpt = true;
        messages.push('Message.excerpt must be a string');
      }
      if (!invalidSeverity && !VALID_SEVERITY.has(message.severity)) {
        invalidSeverity = true;
        messages.push("Message.severity must be 'error', 'warning' or 'info'");
      }
      if (!invalidURL && message.url && typeof message.url !== 'string') {
        invalidURL = true;
        messages.push('Message.url must be a string');
      }
      if (!invalidDescription && message.description && typeof message.description !== 'function' && typeof message.description !== 'string') {
        invalidDescription = true;
        messages.push('Message.description must be a function or string');
      }
      if (!invalidLinterName && message.linterName && typeof message.linterName !== 'string') {
        invalidLinterName = true;
        messages.push('Message.linterName must be a string');
      }
    }
  } else {
    messages.push('Linter Result must be an Array');
  }

  if (messages.length) {
    (0, _helpers.showError)('Invalid Linter Result received', 'These issues were encountered while processing messages from a linter named \'' + linterName + '\'', messages);
    return false;
  }

  return true;
}

function validateMessagesLegacy(linterName, entries) {
  var messages = [];

  if (Array.isArray(entries)) {
    var invalidFix = false;
    var invalidType = false;
    var invalidClass = false;
    var invalidRange = false;
    var invalidTrace = false;
    var invalidContent = false;
    var invalidFilePath = false;
    var invalidSeverity = false;

    for (var i = 0, _length2 = entries.length; i < _length2; ++i) {
      var message = entries[i];
      if (!invalidType && typeof message.type !== 'string') {
        invalidType = true;
        messages.push('Message.type must be a string');
      }
      if (!invalidContent && (typeof message.text !== 'string' && typeof message.html !== 'string' && !(message.html instanceof HTMLElement) || !message.text && !message.html)) {
        invalidContent = true;
        messages.push('Message.text or Message.html must have a valid value');
      }
      if (!invalidFilePath && message.filePath && typeof message.filePath !== 'string') {
        invalidFilePath = true;
        messages.push('Message.filePath must be a string');
      }
      if (!invalidRange && message.range && typeof message.range !== 'object') {
        invalidRange = true;
        messages.push('Message.range must be an object');
      } else if (!invalidRange && message.range) {
        var range = _atom.Range.fromObject(message.range);
        if (Number.isNaN(range.start.row) || Number.isNaN(range.start.column) || Number.isNaN(range.end.row) || Number.isNaN(range.end.column)) {
          invalidRange = true;
          messages.push('Message.range should not contain NaN coordinates');
        }
      }
      if (!invalidClass && message['class'] && typeof message['class'] !== 'string') {
        invalidClass = true;
        messages.push('Message.class must be a string');
      }
      if (!invalidSeverity && message.severity && !VALID_SEVERITY.has(message.severity)) {
        invalidSeverity = true;
        messages.push("Message.severity must be 'error', 'warning' or 'info'");
      }
      if (!invalidTrace && message.trace && !Array.isArray(message.trace)) {
        invalidTrace = true;
        messages.push('Message.trace must be an Array');
      }
      if (!invalidFix && message.fix && (typeof message.fix.range !== 'object' || typeof message.fix.newText !== 'string' || message.fix.oldText && typeof message.fix.oldText !== 'string')) {
        invalidFix = true;
        messages.push('Message.fix must be valid');
      }
    }
  } else {
    messages.push('Linter Result must be an Array');
  }

  if (messages.length) {
    (0, _helpers.showError)('Invalid Linter Result received', 'These issues were encountered while processing messages from a linter named \'' + linterName + '\'', messages);
    return false;
  }

  return true;
}

exports.ui = validateUI;
exports.linter = validateLinter;
exports.indie = validateIndie;
exports.messages = validateMessages;
exports.messagesLegacy = validateMessagesLegacy;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvLmF0b20vcGFja2FnZXMvbGludGVyL2xpYi92YWxpZGF0ZS9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O29CQUU2QixNQUFNOzt1QkFDVCxXQUFXOztBQUdyQyxJQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQTs7QUFFNUQsU0FBUyxVQUFVLENBQUMsRUFBTSxFQUFXO0FBQ25DLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQTs7QUFFbkIsTUFBSSxFQUFFLElBQUksT0FBTyxFQUFFLEtBQUssUUFBUSxFQUFFO0FBQ2hDLFFBQUksT0FBTyxFQUFFLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUMvQixjQUFRLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUE7S0FDMUM7QUFDRCxRQUFJLE9BQU8sRUFBRSxDQUFDLGVBQWUsS0FBSyxVQUFVLEVBQUU7QUFDNUMsY0FBUSxDQUFDLElBQUksQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO0tBQ3ZEO0FBQ0QsUUFBSSxPQUFPLEVBQUUsQ0FBQyxnQkFBZ0IsS0FBSyxVQUFVLEVBQUU7QUFDN0MsY0FBUSxDQUFDLElBQUksQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFBO0tBQ3hEO0FBQ0QsUUFBSSxPQUFPLEVBQUUsQ0FBQyxNQUFNLEtBQUssVUFBVSxFQUFFO0FBQ25DLGNBQVEsQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsQ0FBQTtLQUM5QztBQUNELFFBQUksT0FBTyxFQUFFLENBQUMsT0FBTyxLQUFLLFVBQVUsRUFBRTtBQUNwQyxjQUFRLENBQUMsSUFBSSxDQUFDLCtCQUErQixDQUFDLENBQUE7S0FDL0M7R0FDRixNQUFNO0FBQ0wsWUFBUSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFBO0dBQ3RDOztBQUVELE1BQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtBQUNu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R0FBRyxDQUFDLE9BQU8sSUFBSSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxLQUFLLFFBQVEsQ0FBQyxBQUFDLEVBQUU7QUFDeEwsa0JBQVUsR0FBRyxJQUFJLENBQUE7QUFDakIsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsMkJBQTJCLENBQUMsQ0FBQTtPQUMzQztLQUNGO0dBQ0YsTUFBTTtBQUNMLFlBQVEsQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLENBQUMsQ0FBQTtHQUNoRDs7QUFFRCxNQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7QUFDbkIsNEJBQVUsZ0NBQWdDLHFGQUFrRixVQUFVLFNBQUssUUFBUSxDQUFDLENBQUE7QUFDcEosV0FBTyxLQUFLLENBQUE7R0FDYjs7QUFFRCxTQUFPLElBQUksQ0FBQTtDQUNaOztRQUdlLEVBQUUsR0FBaEIsVUFBVTtRQUNRLE1BQU0sR0FBeEIsY0FBYztRQUNHLEtBQUssR0FBdEIsYUFBYTtRQUNPLFFBQVEsR0FBNUIsZ0JBQWdCO1FBQ1UsY0FBYyxHQUF4QyxzQkFBc0IiLCJmaWxlIjoiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy9saW50ZXIvbGliL3ZhbGlkYXRlL2luZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogQGZsb3cgKi9cblxuaW1wb3J0IHsgUmFuZ2UsIFBvaW50IH0gZnJvbSAnYXRvbSdcbmltcG9ydCB7IHNob3dFcnJvciB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCB0eXBlIHsgVUksIExpbnRlciwgTWVzc2FnZSwgTWVzc2FnZUxlZ2FjeSwgSW5kaWUgfSBmcm9tICcuLi90eXBlcydcblxuY29uc3QgVkFMSURfU0VWRVJJVFkgPSBuZXcgU2V0KFsnZXJyb3InLCAnd2FybmluZycsICdpbmZvJ10pXG5cbmZ1bmN0aW9uIHZhbGlkYXRlVUkodWk6IFVJKTogYm9vbGVhbiB7XG4gIGNvbnN0IG1lc3NhZ2VzID0gW11cblxuICBpZiAodWkgJiYgdHlwZW9mIHVpID09PSAnb2JqZWN0Jykge1xuICAgIGlmICh0eXBlb2YgdWkubmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG1lc3NhZ2VzLnB1c2goJ1VJLm5hbWUgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgdWkuZGlkQmVnaW5MaW50aW5nICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBtZXNzYWdlcy5wdXNoKCdVSS5kaWRCZWdpbkxpbnRpbmcgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB1aS5kaWRGaW5pc2hMaW50aW5nICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBtZXNzYWdlcy5wdXNoKCdVSS5kaWRGaW5pc2hMaW50aW5nIG11c3QgYmUgYSBmdW5jdGlvbicpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgdWkucmVuZGVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBtZXNzYWdlcy5wdXNoKCdVSS5yZW5kZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiB1aS5kaXNwb3NlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBtZXNzYWdlcy5wdXNoKCdVSS5kaXNwb3NlIG11c3QgYmUgYSBmdW5jdGlvbicpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG1lc3NhZ2VzLnB1c2goJ1VJIG11c3QgYmUgYW4gb2JqZWN0JylcbiAgfVxuXG4gIGlmIChtZXNzYWdlcy5sZW5ndGgpIHtcbiAgICBzaG93RXJyb3IoJ0ludmFsaWQgVUkgcmVjZWl2ZWQnLCBgVGhlc2UgaXNzdWVzIHdlcmUgZW5jb3VudGVyZWQgd2hpbGUgcmVnaXN0ZXJpbmcgdGhlIFVJIG5hbWVkICcke3VpICYmIHVpLm5hbWUgPyB1aS5uYW1lIDogJ1Vua25vd24nfSdgLCBtZXNzYWdlcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTGludGVyKGxpbnRlcjogTGludGVyLCB2ZXJzaW9uOiAxIHwgMik6IGJvb2xlYW4ge1xuICBjb25zdCBtZXNzYWdlcyA9IFtdXG5cbiAgaWYgKGxpbnRlciAmJiB0eXBlb2YgbGludGVyID09PSAnb2JqZWN0Jykge1xuICAgIGlmICh0eXBlb2YgbGludGVyLm5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpZiAodmVyc2lvbiA9PT0gMikge1xuICAgICAgICBtZXNzYWdlcy5wdXNoKCdMaW50ZXIubmFtZSBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgIH0gZWxzZSBsaW50ZXIubmFtZSA9ICdVbmtub3duJ1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGxpbnRlci5zY29wZSAhPT0gJ3N0cmluZycgfHwgKGxpbnRlci5zY29wZSAhPT0gJ2ZpbGUnICYmIGxpbnRlci5zY29wZSAhPT0gJ3Byb2plY3QnKSkge1xuICAgICAgbWVzc2FnZXMucHVzaChcIkxpbnRlci5zY29wZSBtdXN0IGJlIGVpdGhlciAnZmlsZScgb3IgJ3Byb2plY3QnXCIpXG4gICAgfVxuICAgIGlmICh2ZXJzaW9uID09PSAxICYmIHR5cGVvZiBsaW50ZXIubGludE9uRmx5ICE9PSAnYm9vbGVhbicpIHtcbiAgICAgIG1lc3NhZ2VzLnB1c2goJ0xpbnRlci5saW50T25GbHkgbXVzdCBiZSBhIGJvb2xlYW4nKVxuICAgIH0gZWxzZSBpZiAodmVyc2lvbiA9PT0gMiAmJiB0eXBlb2YgbGludGVyLmxpbnRzT25DaGFuZ2UgIT09ICdib29sZWFuJykge1xuICAgICAgbWVzc2FnZXMucHVzaCgnTGludGVyLmxpbnRzT25DaGFuZ2UgbXVzdCBiZSBhIGJvb2xlYW4nKVxuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkobGludGVyLmdyYW1tYXJTY29wZXMpKSB7XG4gICAgICBtZXNzYWdlcy5wdXNoKCdMaW50ZXIuZ3JhbW1hclNjb3BlcyBtdXN0IGJlIGFuIEFycmF5JylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBsaW50ZXIubGludCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbWVzc2FnZXMucHVzaCgnTGludGVyLmxpbnQgbXVzdCBiZSBhIGZ1bmN0aW9uJylcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbWVzc2FnZXMucHVzaCgnTGludGVyIG11c3QgYmUgYW4gb2JqZWN0JylcbiAgfVxuXG4gIGlmIChtZXNzYWdlcy5sZW5ndGgpIHtcbiAgICBzaG93RXJyb3IoJ0ludmFsaWQgTGludGVyIHJlY2VpdmVkJywgYFRoZXNlIGlzc3VlcyB3ZXJlIGVuY291bnRlcmVkIHdoaWxlIHJlZ2lzdGVyaW5nIGEgTGludGVyIG5hbWVkICcke2xpbnRlciAmJiBsaW50ZXIubmFtZSA/IGxpbnRlci5uYW1lIDogJ1Vua25vd24nfSdgLCBtZXNzYWdlcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlSW5kaWUoaW5kaWU6IEluZGllKTogYm9vbGVhbiB7XG4gIGNvbnN0IG1lc3NhZ2VzID0gW11cblxuICBpZiAoaW5kaWUgJiYgdHlwZW9mIGluZGllID09PSAnb2JqZWN0Jykge1xuICAgIGlmICh0eXBlb2YgaW5kaWUubmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG1lc3NhZ2VzLnB1c2goJ0luZGllLm5hbWUgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG1lc3NhZ2VzLnB1c2goJ0luZGllIG11c3QgYmUgYW4gb2JqZWN0JylcbiAgfVxuXG4gIGlmIChtZXNzYWdlcy5sZW5ndGgpIHtcbiAgICBzaG93RXJyb3IoJ0ludmFsaWQgSW5kaWUgcmVjZWl2ZWQnLCBgVGhlc2UgaXNzdWVzIHdlcmUgZW5jb3VudGVyZWQgd2hpbGUgcmVnaXN0ZXJpbmcgYW4gSW5kaWUgTGludGVyIG5hbWVkICcke2luZGllICYmIGluZGllLm5hbWUgPyBpbmRpZS5uYW1lIDogJ1Vua25vd24nfSdgLCBtZXNzYWdlcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlTWVzc2FnZXMobGludGVyTmFtZTogc3RyaW5nLCBlbnRyaWVzOiBBcnJheTxNZXNzYWdlPik6IGJvb2xlYW4ge1xuICBjb25zdCBtZXNzYWdlcyA9IFtdXG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoZW50cmllcykpIHtcbiAgICBsZXQgaW52YWxpZFVSTCA9IGZhbHNlXG4gICAgbGV0IGludmFsaWRJY29uID0gZmFsc2VcbiAgICBsZXQgaW52YWxpZEV4Y2VycHQgPSBmYWxzZVxuICAgIGxldCBpbnZhbGlkTG9jYXRpb24gPSBmYWxzZVxuICAgIGxldCBpbnZhbGlkU2V2ZXJpdHkgPSBmYWxzZVxuICAgIGxldCBpbnZhbGlkU29sdXRpb24gPSBmYWxzZVxuICAgIGxldCBpbnZhbGlkUmVmZXJlbmNlID0gZmFsc2VcbiAgICBsZXQgaW52YWxpZERlc2NyaXB0aW9uID0gZmFsc2VcbiAgICBsZXQgaW52YWxpZExpbnRlck5hbWUgPSBmYWxzZVxuXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbmd0aCA9IGVudHJpZXMubGVuZ3RoOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlbnRyaWVzW2ldXG4gICAgICBjb25zdCByZWZlcmVuY2UgPSBtZXNzYWdlLnJlZmVyZW5jZVxuICAgICAgaWYgKCFpbnZhbGlkSWNvbiAmJiBtZXNzYWdlLmljb24gJiYgdHlwZW9mIG1lc3NhZ2UuaWNvbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW52YWxpZEljb24gPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UuaWNvbiBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZExvY2F0aW9uICYmICghbWVzc2FnZS5sb2NhdGlvbiB8fCB0eXBlb2YgbWVzc2FnZS5sb2NhdGlvbiAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIG1lc3NhZ2UubG9jYXRpb24uZmlsZSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIG1lc3NhZ2UubG9jYXRpb24ucG9zaXRpb24gIT09ICdvYmplY3QnIHx8ICFtZXNzYWdlLmxvY2F0aW9uLnBvc2l0aW9uKSkge1xuICAgICAgICBpbnZhbGlkTG9jYXRpb24gPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UubG9jYXRpb24gbXVzdCBiZSB2YWxpZCcpXG4gICAgICB9IGVsc2UgaWYgKCFpbnZhbGlkTG9jYXRpb24pIHtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KG1lc3NhZ2UubG9jYXRpb24ucG9zaXRpb24pXG4gICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocmFuZ2Uuc3RhcnQucm93KSB8fCBOdW1iZXIuaXNOYU4ocmFuZ2Uuc3RhcnQuY29sdW1uKSB8fCBOdW1iZXIuaXNOYU4ocmFuZ2UuZW5kLnJvdykgfHwgTnVtYmVyLmlzTmFOKHJhbmdlLmVuZC5jb2x1bW4pKSB7XG4gICAgICAgICAgaW52YWxpZExvY2F0aW9uID0gdHJ1ZVxuICAgICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UubG9jYXRpb24ucG9zaXRpb24gc2hvdWxkIG5vdCBjb250YWluIE5hTiBjb29yZGluYXRlcycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZFNvbHV0aW9uICYmIG1lc3NhZ2Uuc29sdXRpb25zICYmICFBcnJheS5pc0FycmF5KG1lc3NhZ2Uuc29sdXRpb25zKSkge1xuICAgICAgICBpbnZhbGlkU29sdXRpb24gPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2Uuc29sdXRpb25zIG11c3QgYmUgdmFsaWQnKVxuICAgICAgfVxuICAgICAgaWYgKCFpbnZhbGlkUmVmZXJlbmNlICYmIHJlZmVyZW5jZSAmJiAodHlwZW9mIHJlZmVyZW5jZSAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIHJlZmVyZW5jZS5maWxlICE9PSAnc3RyaW5nJyB8fCB0eXBlb2YgcmVmZXJlbmNlLnBvc2l0aW9uICE9PSAnb2JqZWN0JyB8fCAhcmVmZXJlbmNlLnBvc2l0aW9uKSkge1xuICAgICAgICBpbnZhbGlkUmVmZXJlbmNlID0gdHJ1ZVxuICAgICAgICBtZXNzYWdlcy5wdXNoKCdNZXNzYWdlLnJlZmVyZW5jZSBtdXN0IGJlIHZhbGlkJylcbiAgICAgIH0gZWxzZSBpZiAoIWludmFsaWRSZWZlcmVuY2UgJiYgcmVmZXJlbmNlKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gUG9pbnQuZnJvbU9iamVjdChyZWZlcmVuY2UucG9zaXRpb24pXG4gICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocG9zaXRpb24ucm93KSB8fCBOdW1iZXIuaXNOYU4ocG9zaXRpb24uY29sdW1uKSkge1xuICAgICAgICAgIGludmFsaWRSZWZlcmVuY2UgPSB0cnVlXG4gICAgICAgICAgbWVzc2FnZXMucHVzaCgnTWVzc2FnZS5yZWZlcmVuY2UucG9zaXRpb24gc2hvdWxkIG5vdCBjb250YWluIE5hTiBjb29yZGluYXRlcycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZEV4Y2VycHQgJiYgdHlwZW9mIG1lc3NhZ2UuZXhjZXJwdCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW52YWxpZEV4Y2VycHQgPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UuZXhjZXJwdCBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZFNldmVyaXR5ICYmICFWQUxJRF9TRVZFUklUWS5oYXMobWVzc2FnZS5zZXZlcml0eSkpIHtcbiAgICAgICAgaW52YWxpZFNldmVyaXR5ID0gdHJ1ZVxuICAgICAgICBtZXNzYWdlcy5wdXNoKFwiTWVzc2FnZS5zZXZlcml0eSBtdXN0IGJlICdlcnJvcicsICd3YXJuaW5nJyBvciAnaW5mbydcIilcbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZFVSTCAmJiBtZXNzYWdlLnVybCAmJiB0eXBlb2YgbWVzc2FnZS51cmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGludmFsaWRVUkwgPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UudXJsIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgICAgfVxuICAgICAgaWYgKCFpbnZhbGlkRGVzY3JpcHRpb24gJiYgbWVzc2FnZS5kZXNjcmlwdGlvbiAmJiB0eXBlb2YgbWVzc2FnZS5kZXNjcmlwdGlvbiAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgbWVzc2FnZS5kZXNjcmlwdGlvbiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW52YWxpZERlc2NyaXB0aW9uID0gdHJ1ZVxuICAgICAgICBtZXNzYWdlcy5wdXNoKCdNZXNzYWdlLmRlc2NyaXB0aW9uIG11c3QgYmUgYSBmdW5jdGlvbiBvciBzdHJpbmcnKVxuICAgICAgfVxuICAgICAgaWYgKCFpbnZhbGlkTGludGVyTmFtZSAmJiBtZXNzYWdlLmxpbnRlck5hbWUgJiYgdHlwZW9mIG1lc3NhZ2UubGludGVyTmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaW52YWxpZExpbnRlck5hbWUgPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UubGludGVyTmFtZSBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbWVzc2FnZXMucHVzaCgnTGludGVyIFJlc3VsdCBtdXN0IGJlIGFuIEFycmF5JylcbiAgfVxuXG4gIGlmIChtZXNzYWdlcy5sZW5ndGgpIHtcbiAgICBzaG93RXJyb3IoJ0ludmFsaWQgTGludGVyIFJlc3VsdCByZWNlaXZlZCcsIGBUaGVzZSBpc3N1ZXMgd2VyZSBlbmNvdW50ZXJlZCB3aGlsZSBwcm9jZXNzaW5nIG1lc3NhZ2VzIGZyb20gYSBsaW50ZXIgbmFtZWQgJyR7bGludGVyTmFtZX0nYCwgbWVzc2FnZXMpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cblxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZU1lc3NhZ2VzTGVnYWN5KGxpbnRlck5hbWU6IHN0cmluZywgZW50cmllczogQXJyYXk8TWVzc2FnZUxlZ2FjeT4pOiBib29sZWFuIHtcbiAgY29uc3QgbWVzc2FnZXMgPSBbXVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGVudHJpZXMpKSB7XG4gICAgbGV0IGludmFsaWRGaXggPSBmYWxzZVxuICAgIGxldCBpbnZhbGlkVHlwZSA9IGZhbHNlXG4gICAgbGV0IGludmFsaWRDbGFzcyA9IGZhbHNlXG4gICAgbGV0IGludmFsaWRSYW5nZSA9IGZhbHNlXG4gICAgbGV0IGludmFsaWRUcmFjZSA9IGZhbHNlXG4gICAgbGV0IGludmFsaWRDb250ZW50ID0gZmFsc2VcbiAgICBsZXQgaW52YWxpZEZpbGVQYXRoID0gZmFsc2VcbiAgICBsZXQgaW52YWxpZFNldmVyaXR5ID0gZmFsc2VcblxuICAgIGZvciAobGV0IGkgPSAwLCBsZW5ndGggPSBlbnRyaWVzLmxlbmd0aDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gZW50cmllc1tpXVxuICAgICAgaWYgKCFpbnZhbGlkVHlwZSAmJiB0eXBlb2YgbWVzc2FnZS50eXBlICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpbnZhbGlkVHlwZSA9IHRydWVcbiAgICAgICAgbWVzc2FnZXMucHVzaCgnTWVzc2FnZS50eXBlIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgICAgfVxuICAgICAgaWYgKCFpbnZhbGlkQ29udGVudCAmJiAoKHR5cGVvZiBtZXNzYWdlLnRleHQgIT09ICdzdHJpbmcnICYmICh0eXBlb2YgbWVzc2FnZS5odG1sICE9PSAnc3RyaW5nJyAmJiAhKG1lc3NhZ2UuaHRtbCBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkpIHx8ICghbWVzc2FnZS50ZXh0ICYmICFtZXNzYWdlLmh0bWwpKSkge1xuICAgICAgICBpbnZhbGlkQ29udGVudCA9IHRydWVcbiAgICAgICAgbWVzc2FnZXMucHVzaCgnTWVzc2FnZS50ZXh0IG9yIE1lc3NhZ2UuaHRtbCBtdXN0IGhhdmUgYSB2YWxpZCB2YWx1ZScpXG4gICAgICB9XG4gICAgICBpZiAoIWludmFsaWRGaWxlUGF0aCAmJiBtZXNzYWdlLmZpbGVQYXRoICYmIHR5cGVvZiBtZXNzYWdlLmZpbGVQYXRoICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpbnZhbGlkRmlsZVBhdGggPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UuZmlsZVBhdGggbXVzdCBiZSBhIHN0cmluZycpXG4gICAgICB9XG4gICAgICBpZiAoIWludmFsaWRSYW5nZSAmJiBtZXNzYWdlLnJhbmdlICYmIHR5cGVvZiBtZXNzYWdlLnJhbmdlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICBpbnZhbGlkUmFuZ2UgPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UucmFuZ2UgbXVzdCBiZSBhbiBvYmplY3QnKVxuICAgICAgfSBlbHNlIGlmICghaW52YWxpZFJhbmdlICYmIG1lc3NhZ2UucmFuZ2UpIHtcbiAgICAgICAgY29uc3QgcmFuZ2UgPSBSYW5nZS5mcm9tT2JqZWN0KG1lc3NhZ2UucmFuZ2UpXG4gICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocmFuZ2Uuc3RhcnQucm93KSB8fCBOdW1iZXIuaXNOYU4ocmFuZ2Uuc3RhcnQuY29sdW1uKSB8fCBOdW1iZXIuaXNOYU4ocmFuZ2UuZW5kLnJvdykgfHwgTnVtYmVyLmlzTmFOKHJhbmdlLmVuZC5jb2x1bW4pKSB7XG4gICAgICAgICAgaW52YWxpZFJhbmdlID0gdHJ1ZVxuICAgICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UucmFuZ2Ugc2hvdWxkIG5vdCBjb250YWluIE5hTiBjb29yZGluYXRlcycpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZENsYXNzICYmIG1lc3NhZ2UuY2xhc3MgJiYgdHlwZW9mIG1lc3NhZ2UuY2xhc3MgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGludmFsaWRDbGFzcyA9IHRydWVcbiAgICAgICAgbWVzc2FnZXMucHVzaCgnTWVzc2FnZS5jbGFzcyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICAgIH1cbiAgICAgIGlmICghaW52YWxpZFNldmVyaXR5ICYmIG1lc3NhZ2Uuc2V2ZXJpdHkgJiYgIVZBTElEX1NFVkVSSVRZLmhhcyhtZXNzYWdlLnNldmVyaXR5KSkge1xuICAgICAgICBpbnZhbGlkU2V2ZXJpdHkgPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goXCJNZXNzYWdlLnNldmVyaXR5IG11c3QgYmUgJ2Vycm9yJywgJ3dhcm5pbmcnIG9yICdpbmZvJ1wiKVxuICAgICAgfVxuICAgICAgaWYgKCFpbnZhbGlkVHJhY2UgJiYgbWVzc2FnZS50cmFjZSAmJiAhQXJyYXkuaXNBcnJheShtZXNzYWdlLnRyYWNlKSkge1xuICAgICAgICBpbnZhbGlkVHJhY2UgPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UudHJhY2UgbXVzdCBiZSBhbiBBcnJheScpXG4gICAgICB9XG4gICAgICBpZiAoIWludmFsaWRGaXggJiYgbWVzc2FnZS5maXggJiYgKHR5cGVvZiBtZXNzYWdlLmZpeC5yYW5nZSAhPT0gJ29iamVjdCcgfHwgdHlwZW9mIG1lc3NhZ2UuZml4Lm5ld1RleHQgIT09ICdzdHJpbmcnIHx8IChtZXNzYWdlLmZpeC5vbGRUZXh0ICYmIHR5cGVvZiBtZXNzYWdlLmZpeC5vbGRUZXh0ICE9PSAnc3RyaW5nJykpKSB7XG4gICAgICAgIGludmFsaWRGaXggPSB0cnVlXG4gICAgICAgIG1lc3NhZ2VzLnB1c2goJ01lc3NhZ2UuZml4IG11c3QgYmUgdmFsaWQnKVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBtZXNzYWdlcy5wdXNoKCdMaW50ZXIgUmVzdWx0IG11c3QgYmUgYW4gQXJyYXknKVxuICB9XG5cbiAgaWYgKG1lc3NhZ2VzLmxlbmd0aCkge1xuICAgIHNob3dFcnJvcignSW52YWxpZCBMaW50ZXIgUmVzdWx0IHJlY2VpdmVkJywgYFRoZXNlIGlzc3VlcyB3ZXJlIGVuY291bnRlcmVkIHdoaWxlIHByb2Nlc3NpbmcgbWVzc2FnZXMgZnJvbSBhIGxpbnRlciBuYW1lZCAnJHtsaW50ZXJOYW1lfSdgLCBtZXNzYWdlcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbmV4cG9ydCB7XG4gIHZhbGlkYXRlVUkgYXMgdWksXG4gIHZhbGlkYXRlTGludGVyIGFzIGxpbnRlcixcbiAgdmFsaWRhdGVJbmRpZSBhcyBpbmRpZSxcbiAgdmFsaWRhdGVNZXNzYWdlcyBhcyBtZXNzYWdlcyxcbiAgdmFsaWRhdGVNZXNzYWdlc0xlZ2FjeSBhcyBtZXNzYWdlc0xlZ2FjeSxcbn1cbiJdfQ==