var User = require('./lib/user.js');

function App() {
  var manifest = require('./manifest.json');
  for (var prop in manifest) {
    this[prop] = manifest[prop];
  }
  this.routes = require('./routes.js');
  this.pkg = require('./package.json');
  this.bower = require('./bower.json');
  return this;
}

var app = new App();

App.prototype.init = function (srv, callback) {
  var self = this;
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
      .then(function () { callback() }, function (err) { callback(err) });
    } else return callback();
  }, function (err) {
    return callback(err);
  });
}

module.exports = app;
