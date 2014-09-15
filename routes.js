var crypto = require('crypto');

var User = require('./lib/user.js');

module.exports = [
  {
    url: '/signin',
    method: 'post',
    handler: function (req, res, srv, next) {
      var user = new User({name: req.body.username}, req.body.password);
      user.auth(srv.db)
      .then(function () {
        var log = new srv.log(req, 'User login.', 'AUTH_SUCCESS');
        log.store();
        req.session.user = user;
        if (req.body.sudo)
          req.session.sudo = new Date().getTime();
        return res.send();
      }, function (err) {
        if (err.message === 'Invalid username or password.') {
          var log = new srv.log(req, 'User auth failed.', 'AUTH_FAIL');
          log.store();
          return res.send(err);
        } else {
          next(err);
        }
      });
    }
  },
  {
    url: '/signout',
    method: 'get',
    handler: function (req, res) {
      delete req.session.user;
      delete req.session.sudo;
      res.send();
    }
  }
]
.concat(require('./routes/profile.js'))
.concat(require('./routes/usercontent.js'));
