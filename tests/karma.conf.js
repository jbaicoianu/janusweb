// Karma configuration
// Generated on Sun May 08 2016 23:14:26 GMT-0700 (PDT)

module.exports = function(config) {
  var settings = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      //{pattern: 'node_modules/jasmine-core/lib/jasmine-core/jasmine-html.js', watched: false, included: true, served: true},
      //{pattern: 'tests/boot.js', watched: true, included: true, served: true},
      //{pattern: 'build/*', watched: true, included: true, served: true},
      {pattern: 'build/janusweb.js', watched: true, included: true, served: true},
      {pattern: 'build/janusweb.assetworker.js', watched: true, included: false, served: true},
      {pattern: 'build/janusweb.css', watched: true, included: true, served: true},
      {pattern: 'build/media/*', watched: false, included: false, served: true},
      {pattern: 'build/media/**', watched: false, included: false, served: true},
      //'tests/imagediff.js',
      //{pattern: 'tests/janusweb.test.js', watched: true, included: true, served: true},
      {pattern: 'tests/assets/*.test.js', watched: true, included: true, served: true},
      //{pattern: 'tests/render/*.test.js', watched: true, included: true, served: true},
      {pattern: 'tests/room.test.js', watched: true, included: true, served: true},
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    customLaunchers: {
        Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox', '--enable-webgl', '--ignore-gpu-blacklist']
        }
    },


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    //browsers: ['Chrome', 'Firefox'],
    //browsers: ['Chrome_travis_ci'],
    browsers: ['ChromeHeadless'],
    browserNoActivityTimeout: 60000,


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  };

  if (process.env.TRAVIS) {
    //settings.browsers = ['Chrome_travis_ci'];
  }

  config.set(settings);
}
