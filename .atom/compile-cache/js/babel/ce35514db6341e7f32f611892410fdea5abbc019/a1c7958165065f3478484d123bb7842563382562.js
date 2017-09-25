"use babel";
// Borrowed from Atom core's spec.

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.beforeEach = beforeEach;
exports.afterEach = afterEach;

var conditionPromise = _asyncToGenerator(function* (condition) {
  var startTime = Date.now();

  while (true) {
    yield timeoutPromise(100);

    if (yield condition()) {
      return;
    }

    if (Date.now() - startTime > 5000) {
      throw new Error("Timed out waiting on condition");
    }
  }
});

exports.conditionPromise = conditionPromise;
exports.timeoutPromise = timeoutPromise;
exports.emitterEventPromise = emitterEventPromise;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { var callNext = step.bind(null, "next"); var callThrow = step.bind(null, "throw"); function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(callNext, callThrow); } } callNext(); }); }; }

function beforeEach(fn) {
  global.beforeEach(function () {
    var result = fn();
    if (result instanceof Promise) {
      waitsForPromise(function () {
        return result;
      });
    }
  });
}

function afterEach(fn) {
  global.afterEach(function () {
    var result = fn();
    if (result instanceof Promise) {
      waitsForPromise(function () {
        return result;
      });
    }
  });
}

;["it", "fit", "ffit", "fffit"].forEach(function (name) {
  module.exports[name] = function (description, fn) {
    global[name](description, function () {
      var result = fn();
      if (result instanceof Promise) {
        waitsForPromise(function () {
          return result;
        });
      }
    });
  };
});

function timeoutPromise(timeout) {
  return new Promise(function (resolve) {
    global.setTimeout(resolve, timeout);
  });
}

function waitsForPromise(fn) {
  var promise = fn();
  global.waitsFor("spec promise to resolve", function (done) {
    promise.then(done, function (error) {
      jasmine.getEnv().currentSpec.fail(error);
      done();
    });
  });
}

function emitterEventPromise(emitter, event) {
  var timeout = arguments.length <= 2 || arguments[2] === undefined ? 15000 : arguments[2];

  return new Promise(function (resolve, reject) {
    var timeoutHandle = setTimeout(function () {
      reject(new Error("Timed out waiting for '" + event + "' event"));
    }, timeout);
    emitter.once(event, function () {
      clearTimeout(timeoutHandle);
      resolve();
    });
  });
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qZXNzZWx1bWFyaWUvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL2FzeW5jLXNwZWMtaGVscGVycy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUE7Ozs7Ozs7OztJQWdDVyxnQkFBZ0IscUJBQS9CLFdBQWdDLFNBQVMsRUFBRTtBQUNoRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7O0FBRTVCLFNBQU8sSUFBSSxFQUFFO0FBQ1gsVUFBTSxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUE7O0FBRXpCLFFBQUksTUFBTSxTQUFTLEVBQUUsRUFBRTtBQUNyQixhQUFNO0tBQ1A7O0FBRUQsUUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxHQUFHLElBQUksRUFBRTtBQUNqQyxZQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUE7S0FDbEQ7R0FDRjtDQUNGOzs7Ozs7OztBQTNDTSxTQUFTLFVBQVUsQ0FBQyxFQUFFLEVBQUU7QUFDN0IsUUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFXO0FBQzNCLFFBQU0sTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFBO0FBQ25CLFFBQUksTUFBTSxZQUFZLE9BQU8sRUFBRTtBQUM3QixxQkFBZSxDQUFDO2VBQU0sTUFBTTtPQUFBLENBQUMsQ0FBQTtLQUM5QjtHQUNGLENBQUMsQ0FBQTtDQUNIOztBQUVNLFNBQVMsU0FBUyxDQUFDLEVBQUUsRUFBRTtBQUM1QixRQUFNLENBQUMsU0FBUyxDQUFDLFlBQVc7QUFDMUIsUUFBTSxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUE7QUFDbkIsUUFBSSxNQUFNLFlBQVksT0FBTyxFQUFFO0FBQzdCLHFCQUFlLENBQUM7ZUFBTSxNQUFNO09BQUEsQ0FBQyxDQUFBO0tBQzlCO0dBQ0YsQ0FBQyxDQUFBO0NBQ0g7O0FBRUQsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFTLElBQUksRUFBRTtBQUNyRCxRQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVMsV0FBVyxFQUFFLEVBQUUsRUFBRTtBQUMvQyxVQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLFlBQVc7QUFDbkMsVUFBTSxNQUFNLEdBQUcsRUFBRSxFQUFFLENBQUE7QUFDbkIsVUFBSSxNQUFNLFlBQVksT0FBTyxFQUFFO0FBQzdCLHVCQUFlLENBQUM7aUJBQU0sTUFBTTtTQUFBLENBQUMsQ0FBQTtPQUM5QjtLQUNGLENBQUMsQ0FBQTtHQUNILENBQUE7Q0FDRixDQUFDLENBQUE7O0FBa0JLLFNBQVMsY0FBYyxDQUFDLE9BQU8sRUFBRTtBQUN0QyxTQUFPLElBQUksT0FBTyxDQUFDLFVBQVMsT0FBTyxFQUFFO0FBQ25DLFVBQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFBO0dBQ3BDLENBQUMsQ0FBQTtDQUNIOztBQUVELFNBQVMsZUFBZSxDQUFDLEVBQUUsRUFBRTtBQUMzQixNQUFNLE9BQU8sR0FBRyxFQUFFLEVBQUUsQ0FBQTtBQUNwQixRQUFNLENBQUMsUUFBUSxDQUFDLHlCQUF5QixFQUFFLFVBQVMsSUFBSSxFQUFFO0FBQ3hELFdBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsS0FBSyxFQUFFO0FBQ2pDLGFBQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0FBQ3hDLFVBQUksRUFBRSxDQUFBO0tBQ1AsQ0FBQyxDQUFBO0dBQ0gsQ0FBQyxDQUFBO0NBQ0g7O0FBRU0sU0FBUyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFtQjtNQUFqQixPQUFPLHlEQUFHLEtBQUs7O0FBQ2pFLFNBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3RDLFFBQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxZQUFNO0FBQ3JDLFlBQU0sQ0FBQyxJQUFJLEtBQUssNkJBQTJCLEtBQUssYUFBVSxDQUFDLENBQUE7S0FDNUQsRUFBRSxPQUFPLENBQUMsQ0FBQTtBQUNYLFdBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFlBQU07QUFDeEIsa0JBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQTtBQUMzQixhQUFPLEVBQUUsQ0FBQTtLQUNWLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTtDQUNIIiwiZmlsZSI6Ii9Vc2Vycy9qZXNzZWx1bWFyaWUvLmF0b20vcGFja2FnZXMvdmltLW1vZGUtcGx1cy9zcGVjL2FzeW5jLXNwZWMtaGVscGVycy5qcyIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIGJhYmVsXCJcbi8vIEJvcnJvd2VkIGZyb20gQXRvbSBjb3JlJ3Mgc3BlYy5cblxuZXhwb3J0IGZ1bmN0aW9uIGJlZm9yZUVhY2goZm4pIHtcbiAgZ2xvYmFsLmJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gZm4oKVxuICAgIGlmIChyZXN1bHQgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICB3YWl0c0ZvclByb21pc2UoKCkgPT4gcmVzdWx0KVxuICAgIH1cbiAgfSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFmdGVyRWFjaChmbikge1xuICBnbG9iYWwuYWZ0ZXJFYWNoKGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGZuKClcbiAgICBpZiAocmVzdWx0IGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHJlc3VsdClcbiAgICB9XG4gIH0pXG59XG5cbjtbXCJpdFwiLCBcImZpdFwiLCBcImZmaXRcIiwgXCJmZmZpdFwiXS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgbW9kdWxlLmV4cG9ydHNbbmFtZV0gPSBmdW5jdGlvbihkZXNjcmlwdGlvbiwgZm4pIHtcbiAgICBnbG9iYWxbbmFtZV0oZGVzY3JpcHRpb24sIGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gZm4oKVxuICAgICAgaWYgKHJlc3VsdCBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlKCgpID0+IHJlc3VsdClcbiAgICAgIH1cbiAgICB9KVxuICB9XG59KVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29uZGl0aW9uUHJvbWlzZShjb25kaXRpb24pIHtcbiAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKVxuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgYXdhaXQgdGltZW91dFByb21pc2UoMTAwKVxuXG4gICAgaWYgKGF3YWl0IGNvbmRpdGlvbigpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSA+IDUwMDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRpbWVkIG91dCB3YWl0aW5nIG9uIGNvbmRpdGlvblwiKVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGltZW91dFByb21pc2UodGltZW91dCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIGdsb2JhbC5zZXRUaW1lb3V0KHJlc29sdmUsIHRpbWVvdXQpXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHdhaXRzRm9yUHJvbWlzZShmbikge1xuICBjb25zdCBwcm9taXNlID0gZm4oKVxuICBnbG9iYWwud2FpdHNGb3IoXCJzcGVjIHByb21pc2UgdG8gcmVzb2x2ZVwiLCBmdW5jdGlvbihkb25lKSB7XG4gICAgcHJvbWlzZS50aGVuKGRvbmUsIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBqYXNtaW5lLmdldEVudigpLmN1cnJlbnRTcGVjLmZhaWwoZXJyb3IpXG4gICAgICBkb25lKClcbiAgICB9KVxuICB9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZW1pdHRlckV2ZW50UHJvbWlzZShlbWl0dGVyLCBldmVudCwgdGltZW91dCA9IDE1MDAwKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgdGltZW91dEhhbmRsZSA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgcmVqZWN0KG5ldyBFcnJvcihgVGltZWQgb3V0IHdhaXRpbmcgZm9yICcke2V2ZW50fScgZXZlbnRgKSlcbiAgICB9LCB0aW1lb3V0KVxuICAgIGVtaXR0ZXIub25jZShldmVudCwgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRIYW5kbGUpXG4gICAgICByZXNvbHZlKClcbiAgICB9KVxuICB9KVxufVxuIl19