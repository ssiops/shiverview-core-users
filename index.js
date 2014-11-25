var async = require('async');
var fs = require('fs');
var User = require('./lib/user.js');

function App() {
  var manifest = require('./manifest.json');
  for (var prop in manifest) {
    this[prop] = manifest[prop];
  }
  this.routes = require('./routes.js');
  this.pkg = require('./package.json');
  this.bower = require('./bower.json');
  this.tests = require('./tests/index.js');
  return this;
}

var app = new App();

App.prototype.init = function (srv, callback) {
  var self = this;
  self.srv = srv;
  if (process.env.verbose) console.log('Checking user indexes.');
  srv.db.index([
    {
      coll: 'users',
      index: 'name',
      options: {unique: true}
    },
    {
      coll: 'users',
      index: 'email',
      options: {unique: true}
    }
  ])
  .then(function () {
    if (process.env.verbose) console.log('Checking root account.');
    return srv.db.find({name: 'root', admin: true}, 'users', {limit: 1});
  }, function (err) {
    return callback(err);
  })
  .then(function (docs) {
    if (docs.length < 1) {
      if (process.env.verbose) console.log('SU not found. A root user will be created.');
      var root = new User({name: 'root', admin: true}, 'shiverview-root');
      root.create(srv.db)
      .then(function () { callback(); }, function (err) { callback(err); });
    } else return callback();
  }, function (err) {
    return callback(err);
  });
};

App.prototype.finally = function (callback) {
  var self = this;
  if (self.srv.config) {
    if (process.env.verbose) console.log('Configuring OAuth urls.');
    var oauthurl = 'https://accounts.google.com/o/oauth2/auth?scope=email%20profile&redirect_uri=' +
      encodeURIComponent(self.srv.config.redirect_uri) +
      '&response_type=code&access_type=offline&client_id=' +
      self.srv.config.client_id;
    var patt = /\/your_oauth_url/g;
    var toReplace = [process.cwd() + '/static/users/views/signin.html', process.cwd() + '/static/users/views/signup.html'];
    async.each(toReplace, function (item, callback) {
      fs.readFile(item, 'utf-8', function (err, content) {
        if (err) return callback(err);
        var result = content.replace(patt, oauthurl);
        fs.writeFile(item, result, 'utf-8', function (err, content) {
          if (err) return callback(err);
          else return callback();
        });
      });
    }, function (err) {
      return callback(err);
    });
  } else return callback();
};

module.exports = app;
