var q = require('q');
var request = require('request');

var baseurl = 'http://localhost:' + (process.env.port || 80) + '/users';

function Generator () {
  return this;
}

Generator.prototype.newUser = function () {
  var d = q.defer();
  var self = this;
  if (typeof self.hash !== 'undefined')
    d.reject('An user has already been generated.');
  else {
    var hash = self.hash = require('crypto').createHash('md5').update(new Date().getTime().toString()).digest('hex').substr(0, 8);
    request({
      uri: baseurl + '/profile/' + 'test-' + hash,
      method: 'PUT',
      body: {
        email: hash + '@testing.org',
        password: hash
      },
      json: true
    }, function (err, res, body) {
      if (res.statusCode === 201) {
        if (typeof res.headers['set-cookie'] === 'undefined')
          d.reject('Session id not provided by server.');
        else {
          self.cookie = res.headers['set-cookie'];
          d.resolve();
        }
      }
      else
        d.reject(err);
    });
  }
  return d.promise;
};

Generator.prototype.newAdmin = function (Db) {
  var d = q.defer();
  var self = this;
  var db = new Db('shiverview');
  if (typeof self.hash !== 'undefined') {
    db.update({name: 'test-' + self.hash}, {$set: {admin: true}}, 'users', {})
    .then(function () {
      d.resolve();
    }, function (err) {
      d.reject(err);
    });
  } else {
    self.newUser().then(function () {
      db.update({name: 'test-' + self.hash}, {$set: {admin: true}}, 'users', {})
      .then(function () {
        d.resolve();
      }, function (err) {
        d.reject(err);
      });
    });
  }
  return d.promise;
};

Generator.prototype.sudo = function () {
  var d = q.defer();
  var self = this;
  if (typeof self.hash === 'undefined')
    d.reject('No user has been generated.');
  else {
    request({
      uri: baseurl + '/signin',
      method: 'POST',
      body: {
        email: self.hash + '@testing.org',
        password: self.hash,
        sudo: true
      },
      json: true,
      headers: {Cookie: self.cookie}
    }, function (err, res, body) {
      if (res.statusCode === 200)
        d.resolve();
      else
        d.reject(err);
    });
  }
  return d.promise;
};

Generator.prototype.destroy = function (Db) {
  var d = q.defer();
  var self = this;
  if (typeof self.hash === 'undefined')
    d.reject('No user has been generated.');
  else {
    var db = new Db('shiverview');
    db.remove({name: 'test-' + self.hash}, 'users', {})
    .then(function () {
      delete self.hash;
      delete self.cookie;
      d.resolve();
    }, function (err) {
      d.reject(err);
    });
  }
  return d.promise;
};

module.exports = new Generator();
