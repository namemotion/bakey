// https://gist.github.com/straker/a864a59182bed09e0232#file-two-way-binding-js
// By Straker

/**
 * @param {object} scope - Object that all bound data will be attached to.
 */
function twoWayBind(scope) {
  // a list of all bindings used in the DOM
  // @example
  // { 'person.name': [<input type="text" data-bind="person.name"/>] }
  var bindings = {};

  // each bindings old value to be compared for changes
  // @example
  // { 'person.name': 'John' }
  var oldValues = {};

  /**
   * Get the object of a binding.
   *
   * @param {string} path - Path to the bound object.
   * @returns {object}
   */
  function getBoundObject(path) {
    path = path.split('.');
    var binding = window;

    for (var i = 0; i < path.length - 1; i++) {
      if (typeof binding[ path[i] ] === 'undefined') return;

      binding = binding[ path[i] ];
    }

    return binding;
  }

  /**
   * Get the property of a binding.
   *
   * @param {string} path - Path to the bound object.
   * @returns {string}
   */
  function getBoundProperty(path) {
    return path.substring(path.lastIndexOf('.') + 1);
  }

  /**
   * Get the value of a binding.
   *
   * @param {string} path - Path to the bound object.
   * @returns {*}
   */
  function getBoundValue(path) {
    var object = getBoundObject(path);
    var property = getBoundProperty(path);

    return (object ? object[property] : undefined);
  }

  /**
   * Dirty check all bindings and update the DOM if any bindings have changed.
   */
  function updateBindings() {
    // if any binding changes, loop over all bindings again to see if the changed made
    // any changes to other bindings. Similar to Angular.js dirty checking method.
    var changed = true;

    while (changed) {
      changed = false;

      // loop through all bindings and check their old value compared to their current value
      for (var prop in bindings) {
        if (!bindings.hasOwnProperty(prop)) continue;

        var value = getBoundValue(prop)

        if (typeof value === 'function') {
          // a toString function must be called with it's associated object
          // i.e. value = obj.toString; value = value(); doesn't work
          value = value.call(getBoundObject(prop));
        }

        // value has changed, update all DOM
        if (value !== oldValues[prop]) {
          changed = true;
          oldValues[prop] = value;

          bindings[prop].forEach(function(node) {
            if (node.nodeName === 'INPUT') {
              node.value = (typeof value !== 'undefined' ? value : '');
            }
            else {
              node.innerHTML = value;
            }
          });
        }
      }
    }
  }

  /**
   * Bind DOM nodes to their data. Can be used on DOM created after the page has loaded.
   * @param {Node} node - Node to scan for bindings.
   */
  function bindDom(node) {
    var nodes = node.querySelectorAll('[data-bind]');

    for (var i = 0, node; node = nodes[i]; i++) {
      // set up initial values
      var path = node.getAttribute('data-bind');
      var value = getBoundValue(path);

      if (typeof value === 'function') {
        // a toString function must be called with it's associated object
        // i.e. value = obj.toString; value = value(); doesn't work
        value = value.call(getBoundObject(path));
      }

      if (node.nodeName === 'INPUT') {
        node.value = (typeof value !== 'undefined' ? value : '');
      }
      else {
        node.innerHTML = value;
      }

      // set old values for dirty checking
      oldValues[path] = value;

      // add the binds to the list
      bindings[path] = bindings[path] || [];

      if (bindings[path].indexOf(node) === -1) {
        bindings[path].push(node);
      }
    }
  }

  // scan DOM once all scripts have run and bind DOM to data
  // this allows scripts to inject DOM onto the page and still be bound
  document.addEventListener('DOMContentLoaded', function() {
    // bind DOM to data
    bindDom(document);

    // active DOM bindings on input change
    document.addEventListener('change', function(e) {
      var target = e.target;

      // update the associated binding
      if (target.hasAttribute('data-bind')) {
        var path = target.getAttribute('data-bind');
        var object = getBoundObject(path);
        var property = getBoundProperty(path);

        try {
          object[property] = JSON.parse(target.value);
        }
        catch (e) {
          object[property] = target.value;
        }

        updateBindings();
      }
    });
  });

  // attach functions for external use
  scope.getBoundObject = getBoundObject;
  scope.getBoundProperty = getBoundProperty;
  scope.getBoundValue = getBoundValue;
  scope.updateBindings = updateBindings;
  scope.bindDom = bindDom;
}