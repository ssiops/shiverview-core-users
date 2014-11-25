var q = require('q');
var request = require('request');

var generator = require('./user-generator.js');
var baseurl = 'http://localhost:' + (process.env.port || 80) + '/users';

module.exports = {
  '/signin': function (it) {
    var d = q.defer();
    it('should sign in a test user', function (Db) {
      generator.newAdmin(Db)
      .then(function () {
        return generator.sudo();
      }, function (err) {
        d.reject(err);
      })
      .then(function () {
        return generator.destroy(Db);
      }, function (err) {
        generator.destroy(Db);
        d.reject(err);
      })
      .then(function () {
        d.resolve();
      }, function (err) {
        d.reject(err);
      });
    });
    return d.promise;
  },
  '/signout': function (it) {
    var d = q.defer();
    it('should sign out a test user', function (Db) {
      generator.newUser()
      .then(function () {
        request.get(baseurl + '/signout', function (err, res) {
          generator.destroy(Db).then(function () {
            if (res.statusCode === 200) {
              d.resolve();
            } else
              d.reject('got status code ' + res.statusCode);
          }, function (err) { d.reject(err); });
        });
      }, function (err) {
        d.reject(err);
      });
    });
    return d.promise;
  },
  '/profile': function (it) {
    var d = q.defer();
    it('should return profile information', function (Db) {
      generator.newUser()
      .then(function () {
        request({
          uri: baseurl + '/profile',
          method: 'GET',
          headers: {Cookie: generator.cookie}
        }, function (err, res, body) {
          generator.destroy(Db).then(function () {
            if (res.statusCode === 200) {
              var obj = JSON.parse(body.toString());
              if (!obj)
                d.reject('got non-object ' + body.toString());
              else
                d.resolve();
            } else
              d.reject('got status code ' + res.statusCode);
          }, function (err) { d.reject(err); });
        });
      }, function (err) {
        d.reject(err);
      });
    });
    return d.promise;
  },
  '/profile/:name': function (it) {
    var d = q.defer();
    it('should perform actions on user profile', function (Db) {
      generator.newUser()
      .then(function () {
        request({
          uri: baseurl + '/profile/test-' + generator.hash,
          method: 'POST',
          form: {displayName: 'test-display'},
          headers: {Cookie: generator.cookie}
        }, function (err, res, body) {
          generator.destroy(Db).then(function () {
            if (res.statusCode === 200) {
              d.resolve();
            } else
              d.reject('got status code ' + res.statusCode);
          }, function (err) { d.reject(err); });
        });
      }, function (err) {
        d.reject(err);
      });
    });
    return d.promise;
  },
  '/check': function (it) {
    var d = q.defer();
    it('should respond that root name is taken', function () {
      request.get(baseurl + '/check?username=root', function (err, res, body) {
        if (res.statusCode === 200) {
          var obj = JSON.parse(body.toString());
          if (obj.nameTaken)
            d.resolve();
          else
            d.reject('unexpected response ' + body.toString());
        } else
          d.reject('got status code ' + res.statusCode);
      });
    });
    return d.promise;
  }
};
