var crypto = require('crypto');

var OAuth = require('../lib/oauth2.js');
var User = require('../lib/user.js');

module.exports = [
  {
    url: '/oauth2',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (req.query.error)
        return res.redirect('/#/users/oauth?error=' + req.query.error);
      req.session.code = req.query.code;
      res.redirect(303, '/#/users/oauth');
    }
  },
  {
    url: '/oauth2',
    method: 'post',
    handler: function (req, res, srv, next) {
      if (typeof req.session.code === 'undefined')
        return res.status(404).send();
      var auth = new OAuth(req.session.code, srv.config);
      auth.auth()
      .then(function () {
        return auth.get(['emails', 'displayName', 'image']);
      }, function (err) { next(err); })
      .then(function (results) {
        var email;
        for (var i = 0; i < results.emails.length; i++) {
          if (results.emails[i].type === 'account') {
            email = results.emails[i].value;
            break;
          }
        }
        if (typeof email === 'undefined')
          return next(results);
        delete req.session.code;
        req.session.oauthUser = {
          email: email,
          displayName: results.displayName,
          timestamp: new Date().getTime(),
          flags: {google: true}
        };
        if (results.image && typeof results.image.url === 'string')
          req.session.oauthUser.profileimg = results.image.url.replace(/\?.*$/, '');
        return srv.db.find({email: email}, 'users', {limit: 1});
      }, function (err) { next(err); })
      .then(function (docs) {
        if (docs.length < 1) {
          return res.send({newUser: true});
        } else {
          delete docs[0]._id;
          delete docs[0].password;
          req.session.user = docs[0];
          delete req.session.oauthUser;
          return res.send();
        }
      }, function (err) { next(err); });
    }
  },
  {
    url: '/oauth2/profile',
    method: 'put',
    handler: function (req, res, srv, next) {
      if (typeof req.session.oauthUser === 'undefined')
        return res.status(404).send();
      if (new Date().getTime - req.session.oauthUser.timestamp > 60 * 60 * 1000)
        return res.status(403).send(new srv.err('Your session has expired.'));
      delete req.session.oauthUser.timestamp;
      if (req.body.password && (req.body.password.length < 6 || req.body.password.length > 20)) {
        res.send(new srv.err('Your password must be 6~20 charaters long.'));
        return;
      }
      var name = req.session.oauthUser.email.replace(/@.*$/, '');
      var md5 = crypto.createHash('md5');
      var hash = md5.update(req.session.oauthUser.email + new Date().getTime()).digest('hex');
      req.session.oauthUser.name = name + '-' + hash.substr(0, 8);
      var user = new User(req.session.oauthUser, req.body.password);
      user.create(srv.db)
      .then(function () {
        var log = new srv.log(req, 'New user from oauth.', 'USER_NEW');
        log.store();
        delete user._id;
        delete user.password;
        delete req.session.oauthUser;
        req.session.user = user;
        res.status(201).send();
      }, function (err) { next(err); });
    }
  }
];
