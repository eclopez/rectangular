/* jshint globalstrict: true */
'use strict';

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
}

// Dummy function to seed 'last' property of watch. Since it's unique,
// the initial watched data will be assigned to this in 'last' on first digest.
function initWatchVal() { }

Scope.prototype.$watch = function (watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    // Potential watcher without a listener
    listenerFn: listenerFn || function () { },
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch = null;
};

Scope.prototype.$$digestOnce = function () {
  // Need reference to 'this' outside of forEach
  // ref: http://alistapart.com/article/getoutbindingsituations
  var self = this;
  var newValue, oldValue, dirty;
  _.forEach(this.$$watchers, function (watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if (newValue !== oldValue) {
      self.$$lastDirtyWatch = watcher;
      watcher.last = newValue;
      watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
      dirty = true;
    } else if (self.$$lastDirtyWatch === watcher) {
      return false;
    }
  });
  return dirty;
};

Scope.prototype.$digest = function () {
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;
  do {
    dirty = this.$$digestOnce();
    if (dirty && !(ttl--)) {
      throw '10 digest iterations reached';
    }
  } while (dirty);
};