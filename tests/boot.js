(function() {

  window.jasmine = jasmineRequire.core(jasmineRequire);

  jasmineRequire.html(jasmine);

  var env = jasmine.getEnv();

  var jasmineInterface = jasmineRequire.interface(jasmine, env);

  extend(window, jasmineInterface);

  var queryString = new jasmine.QueryString({
    getWindowLocation: function() { return window.location; }
  });

  var catchingExceptions = queryString.getParam("catch");
  env.catchExceptions(typeof catchingExceptions === "undefined" ? true : catchingExceptions);

  var throwingExpectationFailures = queryString.getParam("throwFailures");
  env.throwOnExpectationFailure(throwingExpectationFailures);

  var random = queryString.getParam("random");
  env.randomizeTests(random);

  var seed = queryString.getParam("seed");
  if (seed) {
    env.seed(seed);
  }

  env.addReporter(jasmineInterface.jsApiReporter);

  var specFilter = new jasmine.HtmlSpecFilter({
    filterString: function() { return queryString.getParam("spec"); }
  });

  env.specFilter = function(spec) {
    return specFilter.matches(spec.getFullName());
  };

  window.setTimeout = window.setTimeout;
  window.setInterval = window.setInterval;
  window.clearTimeout = window.clearTimeout;
  window.clearInterval = window.clearInterval;

  window.__karma__.loaded = function() { 
  }

  /**
   * ## Execution
   *
   * Replace the browser window's `onload`, ensure it's called, and then run all of the loaded specs. This includes initializing the `HtmlReporter` instance and then executing the loaded Jasmine environment. All of this will happen after all of the specs are loaded.
   */
  var currentWindowOnload = window.onload;

  window.addEventListener('load', function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }

    // fetch URL list before starting tests
    var urljson = "https://raw.githubusercontent.com/jbaicoianu/janusweb/screenshots/urls.json";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", urljson);
    xhr.addEventListener("load", function(d) {
      rooms = JSON.parse(xhr.responseText);
      roomnames = Object.keys(rooms);
      room = rooms[roomnames[0]];

      window.rooms = rooms;
      var script = document.createElement('script');
      script.src = '/base/tests/janusweb.test.js';
      document.body.appendChild(script);
      script.onload = function() {
        env.execute();
      }
    });
    xhr.send();
  });

  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }

}());
