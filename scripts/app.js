angular.module('carApp', [
    'carApp.controllers'
]).filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});;