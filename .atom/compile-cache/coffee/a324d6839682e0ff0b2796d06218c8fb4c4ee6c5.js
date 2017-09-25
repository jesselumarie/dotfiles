(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  describe("dirty work for fast package activation", function() {
    var ensureRequiredFiles, withCleanActivation;
    withCleanActivation = null;
    ensureRequiredFiles = null;
    beforeEach(function() {
      return runs(function() {
        var cleanRequireCache, getRequiredLibOrNodeModulePaths, packPath;
        packPath = atom.packages.loadPackage('vim-mode-plus').path;
        getRequiredLibOrNodeModulePaths = function() {
          return Object.keys(require.cache).filter(function(p) {
            return p.startsWith(packPath + 'lib') || p.startsWith(packPath + 'node_modules');
          });
        };
        cleanRequireCache = function() {
          var oldPaths, savedCache;
          savedCache = {};
          oldPaths = getRequiredLibOrNodeModulePaths();
          oldPaths.forEach(function(p) {
            savedCache[p] = require.cache[p];
            return delete require.cache[p];
          });
          return function() {
            oldPaths.forEach(function(p) {
              return require.cache[p] = savedCache[p];
            });
            return getRequiredLibOrNodeModulePaths().forEach(function(p) {
              if (indexOf.call(oldPaths, p) < 0) {
                return delete require.cache[p];
              }
            });
          };
        };
        withCleanActivation = function(fn) {
          var restoreRequireCache;
          restoreRequireCache = null;
          runs(function() {
            return restoreRequireCache = cleanRequireCache();
          });
          waitsForPromise(function() {
            return atom.packages.activatePackage('vim-mode-plus').then(fn);
          });
          return runs(function() {
            return restoreRequireCache();
          });
        };
        return ensureRequiredFiles = function(files) {
          var should;
          should = files.map(function(file) {
            return packPath + file;
          });
          return expect(getRequiredLibOrNodeModulePaths()).toEqual(should);
        };
      });
    });
    describe("requrie as minimum num of file as possible on startup", function() {
      var shouldRequireFilesInOrdered;
      shouldRequireFilesInOrdered = ["lib/main.js", "lib/base.coffee", "node_modules/delegato/lib/delegator.js", "node_modules/mixto/lib/mixin.js", "lib/settings.js", "lib/global-state.js", "lib/vim-state.js", "lib/mode-manager.js", "lib/command-table.coffee"];
      if (atom.inDevMode()) {
        shouldRequireFilesInOrdered.push('lib/developer.js');
      }
      it("THIS IS WORKAROUND FOR Travis-CI's", function() {
        return withCleanActivation(function() {
          return null;
        });
      });
      it("require minimum set of files", function() {
        return withCleanActivation(function() {
          return ensureRequiredFiles(shouldRequireFilesInOrdered);
        });
      });
      it("[one editor opened] require minimum set of files", function() {
        return withCleanActivation(function() {
          waitsForPromise(function() {
            return atom.workspace.open();
          });
          return runs(function() {
            var files;
            files = shouldRequireFilesInOrdered.concat('lib/status-bar-manager.js');
            return ensureRequiredFiles(files);
          });
        });
      });
      return it("[after motion executed] require minimum set of files", function() {
        return withCleanActivation(function() {
          waitsForPromise(function() {
            return atom.workspace.open().then(function(e) {
              return atom.commands.dispatch(e.element, 'vim-mode-plus:move-right');
            });
          });
          return runs(function() {
            var extraShouldRequireFilesInOrdered, files;
            extraShouldRequireFilesInOrdered = ["lib/status-bar-manager.js", "lib/operation-stack.js", "lib/selection-wrapper.js", "lib/utils.js", "node_modules/underscore-plus/lib/underscore-plus.js", "node_modules/underscore/underscore.js", "lib/blockwise-selection.js", "lib/motion.coffee", "lib/cursor-style-manager.js"];
            files = shouldRequireFilesInOrdered.concat(extraShouldRequireFilesInOrdered);
            return ensureRequiredFiles(files);
          });
        });
      });
    });
    return describe("command-table", function() {
      describe("initial classRegistry", function() {
        return it("contains one entry and it's Base class", function() {
          return withCleanActivation(function(pack) {
            var Base, classRegistry, keys;
            Base = pack.mainModule.provideVimModePlus().Base;
            classRegistry = Base.getClassRegistry();
            keys = Object.keys(classRegistry);
            expect(keys).toHaveLength(1);
            expect(keys[0]).toBe("Base");
            return expect(classRegistry[keys[0]]).toBe(Base);
          });
        });
      });
      describe("fully populated classRegistry", function() {
        return it("generateCommandTableByEagerLoad populate all registry eagerly", function() {
          return withCleanActivation(function(pack) {
            var Base, newRegistriesLength, oldRegistries, oldRegistriesLength;
            Base = pack.mainModule.provideVimModePlus().Base;
            oldRegistries = Base.getClassRegistry();
            oldRegistriesLength = Object.keys(oldRegistries).length;
            expect(Object.keys(oldRegistries)).toHaveLength(1);
            Base.generateCommandTableByEagerLoad();
            newRegistriesLength = Object.keys(Base.getClassRegistry()).length;
            return expect(newRegistriesLength).toBeGreaterThan(oldRegistriesLength);
          });
        });
      });
      return describe("make sure cmd-table is NOT out-of-date", function() {
        return it("generateCommandTableByEagerLoad return table which is equals to initially loaded command table", function() {
          return withCleanActivation(function(pack) {
            var Base, loadedCommandTable, newCommandTable, oldCommandTable, ref;
            Base = pack.mainModule.provideVimModePlus().Base;
            ref = [], oldCommandTable = ref[0], newCommandTable = ref[1];
            oldCommandTable = Base.commandTable;
            newCommandTable = Base.generateCommandTableByEagerLoad();
            loadedCommandTable = require('../lib/command-table');
            expect(oldCommandTable).not.toBe(newCommandTable);
            expect(loadedCommandTable).toEqual(oldCommandTable);
            return expect(loadedCommandTable).toEqual(newCommandTable);
          });
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2plc3NlbHVtYXJpZS8uYXRvbS9wYWNrYWdlcy92aW0tbW9kZS1wbHVzL3NwZWMvZmFzdC1hY3RpdmF0aW9uLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWtCQTtBQUFBLE1BQUE7O0VBQUEsUUFBQSxDQUFTLHdDQUFULEVBQW1ELFNBQUE7QUFDakQsUUFBQTtJQUFBLG1CQUFBLEdBQXNCO0lBQ3RCLG1CQUFBLEdBQXNCO0lBRXRCLFVBQUEsQ0FBVyxTQUFBO2FBQ1QsSUFBQSxDQUFLLFNBQUE7QUFDSCxZQUFBO1FBQUEsUUFBQSxHQUFXLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBZCxDQUEwQixlQUExQixDQUEwQyxDQUFDO1FBRXRELCtCQUFBLEdBQWtDLFNBQUE7aUJBQ2hDLE1BQU0sQ0FBQyxJQUFQLENBQVksT0FBTyxDQUFDLEtBQXBCLENBQTBCLENBQUMsTUFBM0IsQ0FBa0MsU0FBQyxDQUFEO21CQUNoQyxDQUFDLENBQUMsVUFBRixDQUFhLFFBQUEsR0FBVyxLQUF4QixDQUFBLElBQWtDLENBQUMsQ0FBQyxVQUFGLENBQWEsUUFBQSxHQUFXLGNBQXhCO1VBREYsQ0FBbEM7UUFEZ0M7UUFLbEMsaUJBQUEsR0FBb0IsU0FBQTtBQUNsQixjQUFBO1VBQUEsVUFBQSxHQUFhO1VBQ2IsUUFBQSxHQUFXLCtCQUFBLENBQUE7VUFDWCxRQUFRLENBQUMsT0FBVCxDQUFpQixTQUFDLENBQUQ7WUFDZixVQUFXLENBQUEsQ0FBQSxDQUFYLEdBQWdCLE9BQU8sQ0FBQyxLQUFNLENBQUEsQ0FBQTttQkFDOUIsT0FBTyxPQUFPLENBQUMsS0FBTSxDQUFBLENBQUE7VUFGTixDQUFqQjtBQUlBLGlCQUFPLFNBQUE7WUFDTCxRQUFRLENBQUMsT0FBVCxDQUFpQixTQUFDLENBQUQ7cUJBQ2YsT0FBTyxDQUFDLEtBQU0sQ0FBQSxDQUFBLENBQWQsR0FBbUIsVUFBVyxDQUFBLENBQUE7WUFE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QUksQ0FBQywrQkFBTCxDQUFBO1lBQ0EsbUJBQUEsR0FBc0IsTUFBTSxDQUFDLElBQVAsQ0FBWSxJQUFJLENBQUMsZ0JBQUwsQ0FBQSxDQUFaLENBQW9DLENBQUM7bUJBQzNELE1BQUEsQ0FBTyxtQkFBUCxDQUEyQixDQUFDLGVBQTVCLENBQTRDLG1CQUE1QztVQVJrQixDQUFwQjtRQURrRSxDQUFwRTtNQUR3QyxDQUExQzthQVlBLFFBQUEsQ0FBUyx3Q0FBVCxFQUFtRCxTQUFBO2VBQ2pELEVBQUEsQ0FBRyxnR0FBSCxFQUFxRyxTQUFBO2lCQUNuRyxtQkFBQSxDQUFvQixTQUFDLElBQUQ7QUFDbEIsZ0JBQUE7WUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBaEIsQ0FBQSxDQUFvQyxDQUFDO1lBQzVDLE1BQXFDLEVBQXJDLEVBQUMsd0JBQUQsRUFBa0I7WUFFbEIsZUFBQSxHQUFrQixJQUFJLENBQUM7WUFDdkIsZUFBQSxHQUFrQixJQUFJLENBQUMsK0JBQUwsQ0FBQTtZQUNsQixrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7WUFFckIsTUFBQSxDQUFPLGVBQVAsQ0FBdUIsQ0FBQyxHQUFHLENBQUMsSUFBNUIsQ0FBaUMsZUFBakM7WUFDQSxNQUFBLENBQU8sa0JBQVAsQ0FBMEIsQ0FBQyxPQUEzQixDQUFtQyxlQUFuQzttQkFDQSxNQUFBLENBQU8sa0JBQVAsQ0FBMEIsQ0FBQyxPQUEzQixDQUFtQyxlQUFuQztVQVZrQixDQUFwQjtRQURtRyxDQUFyRztNQURpRCxDQUFuRDtJQTdCd0IsQ0FBMUI7RUFwR2lELENBQW5EO0FBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIjIFtEQU5HRVJdXG4jIFdoYXQgSSdtIGRvaW5nIGluIHRoaXMgdGVzdC1zcGVjIGlzIFNVUEVSIGhhY2t5LCBhbmQgSSBkb24ndCBsaWtlIHRoaXMuXG4jXG4jIC0gV2hhdCBJJ20gZG9pbmcgYW5kIHdoeVxuIyAgLSBJbnZhbGlkYXRlIHJlcXVpcmUuY2FjaGUgdG8gXCJvYnNlcnZlIHJlcXVpcmVkIGZpbGUgb24gc3RhcnR1cFwiLlxuIyAgLSBUaGVuIHJlc3RvcmUgcmVxdWlyZS5jYWNoZSB0byBvcmlnaW5hbCBzdGF0ZS5cbiNcbiMgLSBKdXN0IGludmFsaWRhdGluZyBpcyBub3QgZW5vdWdoIHVubGVzcyByZXN0b3JlaW5nIG90aGVyIHNwZWMgZmlsZSBmYWlsLlxuI1xuIyAtIFdoYXQgaGFwcGVucyBqdXN0IGludmFsaWRhdGUgcmVxdWlyZS5jYWNoZSBhbmQgTk9UIHJlc3RvcmVkIHRvIG9yaWdpbmFsIHJlcXVpcmUuY2FjaGU/XG4jICAtIEZvciBtb2R1bGUgc3VjaCBsaWtlIGBnbG9ibGFsLXN0YXRlLmNvZmZlZWAgaXQgaW5zdGFudGlhdGVkIGF0IHJlcXVpcmVkIHRpbWUuXG4jICAtIEludmFsaWRhdGluZyByZXF1aXJlLmNhY2hlIGZvciBgZ2xvYmFsLXN0YXRlLmNvZmZlZWAgbWVhbnMsIGl0J3MgcmVsb2FkZWQgYWdhaW4uXG4jICAtIFRoaXMgMm5kIHJlbG9hZCByZXR1cm4gRElGRkVSRU5UIGdsb2JhbFN0YXRlIGluc3RhbmNlLlxuIyAgLSBTbyBnbG9iYWxTdGF0ZSBpcyBub3cgbm8gbG9uZ2VyIGdsb2JhbGx5IHJlZmVyZW5jaW5nIHNhbWUgc2FtZSBvYmplY3QsIGl0J3MgYnJva2VuLlxuIyAgLSBUaGlzIHNpdHVhdGlvbiBpcyBjYXVzZWQgYnkgZXhwbGljaXQgY2FjaGUgaW52YWxpZGF0aW9uIGFuZCBub3QgaGFwcGVuIGluIHJlYWwgdXNhZ2UuXG4jXG4jIC0gSSBrbm93IHRoaXMgc3BlYyBpcyBzdGlsbCBzdXBlciBoYWNreSBhbmQgSSB3YW50IHRvIGZpbmQgc2FmZXIgd2F5LlxuIyAgLSBCdXQgSSBuZWVkIHRoaXMgc3BlYyB0byBkZXRlY3QgdW53YW50ZWQgZmlsZSBpcyByZXF1aXJlZCBhdCBzdGFydHVwKCB2bXAgZ2V0IHNsb3dlciBzdGFydHVwICkuXG5kZXNjcmliZSBcImRpcnR5IHdvcmsgZm9yIGZhc3QgcGFja2FnZSBhY3RpdmF0aW9uXCIsIC0+XG4gIHdpdGhDbGVhbkFjdGl2YXRpb24gPSBudWxsXG4gIGVuc3VyZVJlcXVpcmVkRmlsZXMgPSBudWxsXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIHJ1bnMgLT5cbiAgICAgIHBhY2tQYXRoID0gYXRvbS5wYWNrYWdlcy5sb2FkUGFja2FnZSgndmltLW1vZGUtcGx1cycpLnBhdGhcblxuICAgICAgZ2V0UmVxdWlyZWRMaWJPck5vZGVNb2R1bGVQYXRocyA9IC0+XG4gICAgICAgIE9iamVjdC5rZXlzKHJlcXVpcmUuY2FjaGUpLmZpbHRlciAocCkgLT5cbiAgICAgICAgICBwLnN0YXJ0c1dpdGgocGFja1BhdGggKyAnbGliJykgb3IgcC5zdGFydHNXaXRoKHBhY2tQYXRoICsgJ25vZGVfbW9kdWxlcycpXG5cbiAgICAgICMgUmV0dXJuIGZ1bmN0aW9uIHRvIHJlc3RvcmUgb3JpZ2luYWwgcmVxdWlyZS5jYWNoZSBvZiBpbnRlcmVzdFxuICAgICAgY2xlYW5SZXF1aXJlQ2FjaGUgPSAtPlxuICAgICAgICBzYXZlZENhY2hlID0ge31cbiAgICAgICAgb2xkUGF0aHMgPSBnZXRSZXF1aXJlZExpYk9yTm9kZU1vZHVsZVBhdGhzKClcbiAgICAgICAgb2xkUGF0aHMuZm9yRWFjaCAocCkgLT5cbiAgICAgICAgICBzYXZlZENhY2hlW3BdID0gcmVxdWlyZS5jYWNoZVtwXVxuICAgICAgICAgIGRlbGV0ZSByZXF1aXJlLmNhY2hlW3BdXG5cbiAgICAgICAgcmV0dXJuIC0+XG4gICAgICAgICAgb2xkUGF0aHMuZm9yRWFjaCAocCkgLT5cbiAgICAgICAgICAgIHJlcXVpcmUuY2FjaGVbcF0gPSBzYXZlZENhY2hlW3BdXG4gICAgICAgICAgZ2V0UmVxdWlyZWRMaWJPck5vZGVNb2R1bGVQYXRocygpLmZvckVhY2ggKHApIC0+XG4gICAgICAgICAgICBpZiBwIG5vdCBpbiBvbGRQYXRoc1xuICAgICAgICAgICAgICBkZWxldGUgcmVxdWlyZS5jYWNoZVtwXVxuXG4gICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uID0gKGZuKSAtPlxuICAgICAgICByZXN0b3JlUmVxdWlyZUNhY2hlID0gbnVsbFxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgcmVzdG9yZVJlcXVpcmVDYWNoZSA9IGNsZWFuUmVxdWlyZUNhY2hlKClcbiAgICAgICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ3ZpbS1tb2RlLXBsdXMnKS50aGVuKGZuKVxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgcmVzdG9yZVJlcXVpcmVDYWNoZSgpXG5cbiAgICAgIGVuc3VyZVJlcXVpcmVkRmlsZXMgPSAoZmlsZXMpIC0+XG4gICAgICAgIHNob3VsZCA9IGZpbGVzLm1hcCgoZmlsZSkgLT4gcGFja1BhdGggKyBmaWxlKVxuICAgICAgICAjIGNvbnNvbGUubG9nIFwiIyBzaG91bGRcIiwgc2hvdWxkLmpvaW4oXCJcXG5cIilcbiAgICAgICAgIyBjb25zb2xlLmxvZyBcIiMgYWN0dWFsXCIsIGdldFJlcXVpcmVkTGliT3JOb2RlTW9kdWxlUGF0aHMoKS5qb2luKFwiXFxuXCIpXG4gICAgICAgIGV4cGVjdChnZXRSZXF1aXJlZExpYk9yTm9kZU1vZHVsZVBhdGhzKCkpLnRvRXF1YWwoc2hvdWxkKVxuXG4gICMgKiBUbyByZWR1Y2UgSU8gYW5kIGNvbXBpbGUtZXZhbHVhdGlvbiBvZiBqcyBmaWxlIG9uIHN0YXJ0dXBcbiAgZGVzY3JpYmUgXCJyZXF1cmllIGFzIG1pbmltdW0gbnVtIG9mIGZpbGUgYXMgcG9zc2libGUgb24gc3RhcnR1cFwiLCAtPlxuICAgIHNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZCA9IFtcbiAgICAgIFwibGliL21haW4uanNcIlxuICAgICAgXCJsaWIvYmFzZS5jb2ZmZWVcIlxuICAgICAgXCJub2RlX21vZHVsZXMvZGVsZWdhdG8vbGliL2RlbGVnYXRvci5qc1wiXG4gICAgICBcIm5vZGVfbW9kdWxlcy9taXh0by9saWIvbWl4aW4uanNcIlxuICAgICAgXCJsaWIvc2V0dGluZ3MuanNcIlxuICAgICAgXCJsaWIvZ2xvYmFsLXN0YXRlLmpzXCJcbiAgICAgIFwibGliL3ZpbS1zdGF0ZS5qc1wiXG4gICAgICBcImxpYi9tb2RlLW1hbmFnZXIuanNcIlxuICAgICAgXCJsaWIvY29tbWFuZC10YWJsZS5jb2ZmZWVcIlxuICAgIF1cbiAgICBpZiBhdG9tLmluRGV2TW9kZSgpXG4gICAgICBzaG91bGRSZXF1aXJlRmlsZXNJbk9yZGVyZWQucHVzaCgnbGliL2RldmVsb3Blci5qcycpXG5cbiAgICBpdCBcIlRISVMgSVMgV09SS0FST1VORCBGT1IgVHJhdmlzLUNJJ3NcIiwgLT5cbiAgICAgICMgSEFDSzpcbiAgICAgICMgQWZ0ZXIgdmVyeSBmaXJzdCBjYWxsIG9mIGF0b20ucGFja2FnZXMuYWN0aXZhdGVQYWNrYWdlKCd2aW0tbW9kZS1wbHVzJylcbiAgICAgICMgcmVxdWlyZS5jYWNoZSBpcyBOT1QgcG9wdWxhdGVkIHlldCBvbiBUcmF2aXMtQ0kuXG4gICAgICAjIEl0IGRvZXNuJ3QgaW5jbHVkZSBsaWIvbWFpbi5jb2ZmZWUoIHRoaXMgaXMgb2RkIHN0YXRlISApLlxuICAgICAgIyBUaGlzIG9ubHkgaGFwcGVucyBpbiB2ZXJ5IGZpcnN0IGFjdGl2YXRpb24uXG4gICAgICAjIFNvIHB1dGluZyBoZXJlIHVzZWxlc3MgdGVzdCBqdXN0IGFjdGl2YXRlIHBhY2thZ2UgY2FuIGJlIHdvcmthcm91bmQuXG4gICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uIC0+XG4gICAgICAgIG51bGxcblxuICAgIGl0IFwicmVxdWlyZSBtaW5pbXVtIHNldCBvZiBmaWxlc1wiLCAtPlxuICAgICAgd2l0aENsZWFuQWN0aXZhdGlvbiAtPlxuICAgICAgICBlbnN1cmVSZXF1aXJlZEZpbGVzKHNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZClcblxuICAgIGl0IFwiW29uZSBlZGl0b3Igb3BlbmVkXSByZXF1aXJlIG1pbmltdW0gc2V0IG9mIGZpbGVzXCIsIC0+XG4gICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oKVxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZmlsZXMgPSBzaG91bGRSZXF1aXJlRmlsZXNJbk9yZGVyZWQuY29uY2F0KCdsaWIvc3RhdHVzLWJhci1tYW5hZ2VyLmpzJylcbiAgICAgICAgICBlbnN1cmVSZXF1aXJlZEZpbGVzKGZpbGVzKVxuXG4gICAgaXQgXCJbYWZ0ZXIgbW90aW9uIGV4ZWN1dGVkXSByZXF1aXJlIG1pbmltdW0gc2V0IG9mIGZpbGVzXCIsIC0+XG4gICAgICB3aXRoQ2xlYW5BY3RpdmF0aW9uIC0+XG4gICAgICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgICAgIGF0b20ud29ya3NwYWNlLm9wZW4oKS50aGVuIChlKSAtPlxuICAgICAgICAgICAgYXRvbS5jb21tYW5kcy5kaXNwYXRjaChlLmVsZW1lbnQsICd2aW0tbW9kZS1wbHVzOm1vdmUtcmlnaHQnKVxuICAgICAgICBydW5zIC0+XG4gICAgICAgICAgZXh0cmFTaG91bGRSZXF1aXJlRmlsZXNJbk9yZGVyZWQgPSBbXG4gICAgICAgICAgICBcImxpYi9zdGF0dXMtYmFyLW1hbmFnZXIuanNcIlxuICAgICAgICAgICAgXCJsaWIvb3BlcmF0aW9uLXN0YWNrLmpzXCJcbiAgICAgICAgICAgIFwibGliL3NlbGVjdGlvbi13cmFwcGVyLmpzXCJcbiAgICAgICAgICAgIFwibGliL3V0aWxzLmpzXCJcbiAgICAgICAgICAgIFwibm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUtcGx1cy9saWIvdW5kZXJzY29yZS1wbHVzLmpzXCJcbiAgICAgICAgICAgIFwibm9kZV9tb2R1bGVzL3VuZGVyc2NvcmUvdW5kZXJzY29yZS5qc1wiXG4gICAgICAgICAgICBcImxpYi9ibG9ja3dpc2Utc2VsZWN0aW9uLmpzXCJcbiAgICAgICAgICAgIFwibGliL21vdGlvbi5jb2ZmZWVcIlxuICAgICAgICAgICAgXCJsaWIvY3Vyc29yLXN0eWxlLW1hbmFnZXIuanNcIlxuICAgICAgICAgIF1cbiAgICAgICAgICBmaWxlcyA9IHNob3VsZFJlcXVpcmVGaWxlc0luT3JkZXJlZC5jb25jYXQoZXh0cmFTaG91bGRSZXF1aXJlRmlsZXNJbk9yZGVyZWQpXG4gICAgICAgICAgZW5zdXJlUmVxdWlyZWRGaWxlcyhmaWxlcylcblxuICBkZXNjcmliZSBcImNvbW1hbmQtdGFibGVcIiwgLT5cbiAgICAjICogTG9hZGluZyBhdG9tIGNvbW1hbmRzIGZyb20gcHJlLWdlbmVyYXRlZCBjb21tYW5kLXRhYmxlLlxuICAgICMgKiBXaHk/XG4gICAgIyAgdm1wIGFkZHMgYWJvdXQgMzAwIGNtZHMsIHdoaWNoIGlzIGh1Z2UsIGR5bmFtaWNhbGx5IGNhbGN1bGF0aW5nIGFuZCByZWdpc3RlciBjbWRzXG4gICAgIyAgdG9vayB2ZXJ5IGxvbmcgdGltZS5cbiAgICAjICBTbyBjYWxjbHVhdGUgbm9uLWR5bmFtaWMgcGFyIHRoZW4gc2F2ZSB0byBjb21tYW5kLXRhYmxlLmNvZmZlIGFuZCBsb2FkIGluIG9uIHN0YXJ0dXAuXG4gICAgIyAgV2hlbiBjb21tYW5kIGFyZSBleGVjdXRlZCwgbmVjZXNzYXJ5IGNvbW1hbmQgY2xhc3MgZmlsZSBpcyBsYXp5LXJlcXVpcmVkLlxuICAgIGRlc2NyaWJlIFwiaW5pdGlhbCBjbGFzc1JlZ2lzdHJ5XCIsIC0+XG4gICAgICBpdCBcImNvbnRhaW5zIG9uZSBlbnRyeSBhbmQgaXQncyBCYXNlIGNsYXNzXCIsIC0+XG4gICAgICAgIHdpdGhDbGVhbkFjdGl2YXRpb24gKHBhY2spIC0+XG4gICAgICAgICAgQmFzZSA9IHBhY2subWFpbk1vZHVsZS5wcm92aWRlVmltTW9kZVBsdXMoKS5CYXNlXG4gICAgICAgICAgY2xhc3NSZWdpc3RyeSA9IEJhc2UuZ2V0Q2xhc3NSZWdpc3RyeSgpXG4gICAgICAgICAga2V5cyA9IE9iamVjdC5rZXlzKGNsYXNzUmVnaXN0cnkpXG4gICAgICAgICAgZXhwZWN0KGtleXMpLnRvSGF2ZUxlbmd0aCgxKVxuICAgICAgICAgIGV4cGVjdChrZXlzWzBdKS50b0JlKFwiQmFzZVwiKVxuICAgICAgICAgIGV4cGVjdChjbGFzc1JlZ2lzdHJ5W2tleXNbMF1dKS50b0JlKEJhc2UpXG5cbiAgICBkZXNjcmliZSBcImZ1bGx5IHBvcHVsYXRlZCBjbGFzc1JlZ2lzdHJ5XCIsIC0+XG4gICAgICBpdCBcImdlbmVyYXRlQ29tbWFuZFRhYmxlQnlFYWdlckxvYWQgcG9wdWxhdGUgYWxsIHJlZ2lzdHJ5IGVhZ2VybHlcIiwgLT5cbiAgICAgICAgd2l0aENsZWFuQWN0aXZhdGlvbiAocGFjaykgLT5cbiAgICAgICAgICBCYXNlID0gcGFjay5tYWluTW9kdWxlLnByb3ZpZGVWaW1Nb2RlUGx1cygpLkJhc2VcbiAgICAgICAgICBvbGRSZWdpc3RyaWVzID0gQmFzZS5nZXRDbGFzc1JlZ2lzdHJ5KClcbiAgICAgICAgICBvbGRSZWdpc3RyaWVzTGVuZ3RoID0gT2JqZWN0LmtleXMob2xkUmVnaXN0cmllcykubGVuZ3RoXG4gICAgICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKG9sZFJlZ2lzdHJpZXMpKS50b0hhdmVMZW5ndGgoMSlcblxuICAgICAgICAgIEJhc2UuZ2VuZXJhdGVDb21tYW5kVGFibGVCeUVhZ2VyTG9hZCgpXG4gICAgICAgICAgbmV3UmVnaXN0cmllc0xlbmd0aCA9IE9iamVjdC5rZXlzKEJhc2UuZ2V0Q2xhc3NSZWdpc3RyeSgpKS5sZW5ndGhcbiAgICAgICAgICBleHBlY3QobmV3UmVnaXN0cmllc0xlbmd0aCkudG9CZUdyZWF0ZXJUaGFuKG9sZFJlZ2lzdHJpZXNMZW5ndGgpXG5cbiAgICBkZXNjcmliZSBcIm1ha2Ugc3VyZSBjbWQtdGFibGUgaXMgTk9UIG91dC1vZi1kYXRlXCIsIC0+XG4gICAgICBpdCBcImdlbmVyYXRlQ29tbWFuZFRhYmxlQnlFYWdlckxvYWQgcmV0dXJuIHRhYmxlIHdoaWNoIGlzIGVxdWFscyB0byBpbml0aWFsbHkgbG9hZGVkIGNvbW1hbmQgdGFibGVcIiwgLT5cbiAgICAgICAgd2l0aENsZWFuQWN0aXZhdGlvbiAocGFjaykgLT5cbiAgICAgICAgICBCYXNlID0gcGFjay5tYWluTW9kdWxlLnByb3ZpZGVWaW1Nb2RlUGx1cygpLkJhc2VcbiAgICAgICAgICBbb2xkQ29tbWFuZFRhYmxlLCBuZXdDb21tYW5kVGFibGVdID0gW11cblxuICAgICAgICAgIG9sZENvbW1hbmRUYWJsZSA9IEJhc2UuY29tbWFuZFRhYmxlXG4gICAgICAgICAgbmV3Q29tbWFuZFRhYmxlID0gQmFzZS5nZW5lcmF0ZUNvbW1hbmRUYWJsZUJ5RWFnZXJMb2FkKClcbiAgICAgICAgICBsb2FkZWRDb21tYW5kVGFibGUgPSByZXF1aXJlKCcuLi9saWIvY29tbWFuZC10YWJsZScpXG5cbiAgICAgICAgICBleHBlY3Qob2xkQ29tbWFuZFRhYmxlKS5ub3QudG9CZShuZXdDb21tYW5kVGFibGUpXG4gICAgICAgICAgZXhwZWN0KGxvYWRlZENvbW1hbmRUYWJsZSkudG9FcXVhbChvbGRDb21tYW5kVGFibGUpXG4gICAgICAgICAgZXhwZWN0KGxvYWRlZENvbW1hbmRUYWJsZSkudG9FcXVhbChuZXdDb21tYW5kVGFibGUpXG4iXX0=
