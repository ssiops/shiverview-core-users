var crypto = require('crypto');

var User = require('./lib/user.js');

module.exports = [
  {
    url: '/signin',
    method: 'post',
    handler: function (req, res, srv, next) {
      var user = new User({name: req.body.username, email: req.body.email}, req.body.password);
      user.auth(srv.db)
      .then(function () {
        req.session.user = user;
        if (req.body.sudo) {
          req.session.sudo = new Date().getTime();
          var sudoLog = new srv.log(req, 'User entered sudo mode.', 'AUTH_SUCCESS_SUDO');
          sudoLog.store();
        }
        else {
          var successLog = new srv.log(req, 'User sign in.', 'AUTH_SUCCESS');
          successLog.store();
        }
        return res.send();
      }, function (err) {
        if (err.message === 'Invalid username or password.') {
          var failureLog = new srv.log(req, 'User auth failed.', 'AUTH_FAIL');
          failureLog.store();
          return res.send(new srv.err(err));
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
      req.session.destroy();
      res.send();
    }
  }
]
.concat(require('./routes/oauth.js'))
.concat(require('./routes/profile.js'))
.concat(require('./routes/usercontent.js'));
