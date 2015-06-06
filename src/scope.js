/* jshint globalstrict: true */
'use strict';

function Scope() {
  this.$$watchers = [];
  this.$$lastDirtyWatch = null;
  this.$$asyncQueue = [];
  this.$$phase = null;
}

Scope.prototype.$eval = function (expr, locals) {
  return expr(this, locals);
};

// Dummy function to seed 'last' property of watch. Since it's unique,
// the initial watched data will be assigned to this in 'last' on first digest.
function initWatchVal() { }

// Function to create new watchers
Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {
  var watcher = {
    watchFn: watchFn,
    // Potential watcher without a listener
    listenerFn: listenerFn || function () { },
    // Watching references or watching values?
    valueEq: !!valueEq,
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch = null;
};

Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
  // If we're watching values...
  if (valueEq) {
    // LoDash equality check for values
    return _.isEqual(newValue, oldValue);
  } else {
    // Compare by reference
    return newValue === oldValue ||
      (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
  }
};

Scope.prototype.$$digestOnce = function () {
  // Need reference to 'this' outside of forEach
  // ref: http://alistapart.com/article/getoutbindingsituations
  var self = this;
  var newValue, oldValue, dirty;
  _.forEach(this.$$watchers, function (watcher) {
    newValue = watcher.watchFn(self);
    oldValue = watcher.last;
    if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
      self.$$lastDirtyWatch = watcher;
      watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
      watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
      dirty = true;
    } else if (self.$$lastDirtyWatch === watcher) {
      return false;
    }
  });
  return dirty;
};

Scope.prototype.$digest = function () {
  // 10 iterations over the watchers, maximum
  var ttl = 10;
  var dirty;
  this.$$lastDirtyWatch = null;
  this.$beginPhase('$digest');
  do {
    while (this.$$asyncQueue.length) {
      var asyncTask = this.$$asyncQueue.shift();
      asyncTask.scope.$eval(asyncTask.expression);
    }
    dirty = this.$$digestOnce();
    if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
      this.$clearPhase();
      throw '10 digest iterations reached';
    }
  } while (dirty || this.$$asyncQueue.length);
  this.$clearPhase();
};

Scope.prototype.$apply = function (expr) {
  try {
    this.$beginPhase('$apply');
    return this.$eval(expr);
  } finally {
    this.$clearPhase();
    this.$digest();
  }
};

Scope.prototype.$evalAsync = function (expr) {
  var self = this;
  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function () {
      if (self.$$asyncQueue.length) {
        self.$digest();
      }
    }, 0);
  }
  self.$$asyncQueue.push({scope: this, expression: expr});
};

Scope.prototype.$beginPhase = function (phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress.';
  }
  this.$$phase = phase;
};

Scope.prototype.$clearPhase = function () {
  this.$$phase = null;
};