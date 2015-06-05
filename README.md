#Rectangular
Tearing down and rebuilding AngularJS for fun and profit.

My work from following the "Build Your Own AngularJS" book. http://teropa.info/build-your-own-angular.

##Chapter 1 Notes
- Scope is a plain old JavaScript object. No magic. Honest.
- The special sauce is in the functions: $watch and $digest.

- **$watch**
  - watch() - returns the specified data we're interested in.
  - listener() - called when the watched data changes.
  
- **$digest**
  - Iterates over all the watchers on the scope.
    - Responsible for running watch() and listener() for each watcher.
    - Checks to make sure the watch() data has changed (dirty) before calling listener(), aka ***dirty-checking***.
    - Continues iterating until no dirty properties found, since property updates can be dependent on others.
    - Maximum of 10 total iterations over all watchers, since more than that is probably unintended.
    
- Adding data to a scope doesn't have performance implications by itself since Angular doesn't iterate on properties, but rather on watchers.
- Every watch's watch() is called during each call to $digest.
- In short, **number of watchers has biggest performance impact**.
- **$evalAsync** defers code that is guaranteed to run during the current digest iteration. (In contrast, the **$timeout** service lets the browser decide when to run the code which could be after any number of operations that may be made unnecessary by the current **$digest**.)

####Interesting readings:
- http://alistapart.com/article/getoutbindingsituations

####Interesting observations:
- !! is a double negative shorthand that converts a var to a boolean.
- watch() inside watches should be side-effect free. Bad idea for them to do anything other than returning a value.