var q = require('q');

var User = require('../lib/user.js');

module.exports = [
  {
    url: '/profile',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (typeof req.session.user === 'undefined')
        return res.status(404).send();
      res.send(req.session.user);
    }
  },
  {
    url: '/profile/:name',
    method: 'get',
    handler: function (req, res, srv, next) {
      srv.db.find({name: req.params.name}, 'users', {limit: 1})
      .then(function (docs) {
        if (docs.length < 1)
          return res.status(404).send();
        else
          return res.send({name: docs[0].name, imgurl: docs[0].profileimg});
      });
    }
  },
  {
    url: '/profile/:name',
    method: 'put',
    handler: function (req, res, srv, next) {
      if (req.params.name && !/^[a-zA-Z0-9\-\_\.]{2,16}$/.test(req.params.name)) {
        res.send(new srv.err('Your username must be 2~16 characters long with only English letters, numbers, "-", "_" and ".".'));
        return;
      }
      if (req.body.password && (req.body.password.length < 6 || req.body.password.length > 20)) {
        res.send(new srv.err('Your password must be 6~20 charaters long.'));
        return;
      }
      if (req.body.email && !/^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,4})$/.test(req.body.email)) {
        res.send(new srv.err('Your email address is not valid.'));
        return;
      }
      req.body.name = req.params.name;
      delete req.body.username;
      delete req.body.admin;
      var user = new User(req.body, req.body.password);
      user.create(srv.db)
      .then(function () {
        var log = new srv.log(req, 'New user.', 'USER_NEW');
        log.store();
        delete user.password;
        req.session.user = user;
        res.status(201).send();
      }, function (err) {
        next(err);
      });
    }
  },
  {
    url: '/profile/:name',
    method: 'post',
    handler: function (req, res, srv, next) {
      if (typeof req.session.user === 'undefined')
        return res.status(401).send();
      if (req.session.user.name !== req.params.name)
        return res.status(403).send();
      var changePassword = function () {
        var d = q.defer();
        if (typeof req.body.password !== 'undefined' && typeof req.body.passwordOld !== 'undefined') {
          var user = new User({name: req.session.user.name}, req.body.passwordOld);
          user.auth(srv.db)
          .then(function () {
            srv.db.update({name: req.session.user.name}, {$set: {password: user.hash(req.body.password)}}, 'users', {})
            .then(function () { d.resolve() }, function (err) { d.reject(err) });
          }, function (err) {
            d.reject(new srv.err(err));
          });
        } else
          d.resolve();
        return d.promise;
      };
      var updateProfile = function () {
        var d = q.defer();
        var updates = {};
        if (req.body.email)
          updates.email = req.body.email;
        if (req.body.profileimg)
          updates.profileimg = req.body.profileimg;
        if (updates.email && !/^[_a-zA-Z0-9-]+(\.[_a-zA-Z0-9-]+)*@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*(\.[a-zA-Z]{2,4})$/.test(req.body.email))
          d.reject(new srv.err('Your email address is not valid.'));
        else {
          var prop;
          for (prop in updates) {}
          if (typeof prop === 'undefined')
            d.resolve();
          else {
            srv.db.update({name: req.session.user.name}, {$set: updates}, 'users', {})
            .then(function () {
              for (var prop in updates)
                req.session.user[prop] = updates[prop];
              d.resolve();
            }, function (err) { d.reject(err) });
          }
        }
        return d.promise;
      };
      changePassword()
      .then(function () {
        return updateProfile();
      }, function (err) {
        if (err.message === 'Invalid username or password.') {
          err.message = 'Invalid old password.'
          var log = new srv.log(req, 'User passwords do not match.', 'AUTH_PASSWORD_UNMATCH');
          log.store();
          res.send(err);
        } else next(err);
      })
      .then(function () {
        return res.send();
      }, function (err) {
        next(err);
      });
    }
  },
  {
    url: '/profile/:name',
    method: 'delete',
    handler: function (req, res, srv, next) {
      if (typeof req.session.user === 'undefined')
        return res.status(401).send();
      if (req.session.user.name !== req.params.name || !req.session.user.admin)
        return res.status(403).send();
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.send(new srv.err('Sudo required.'));
      srv.db.remove({name: req.session.user.name}, 'users', {})
      .then(function (doc) {
        srv.db.insert(doc, 'deleted-users', {});
        var log = new srv.log(req, 'User ' + req.session.user.name + ' deleted.', 'USER_DELETED');
        log.store();
        res.send();
      }, function (err) {
        next(err);
      });
    }
  }
]
