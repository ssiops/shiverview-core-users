var fs = require('fs');
var gm = require('gm');
var mkdirp = require('mkdirp');

module.exports = [
  {
    url: '/usercontent/:appname/img',
    method: 'post',
    handler: function (req, res, srv, next) {
      if (typeof req.session.user === 'undefined') {
        return res.status(403).send();
      }
      if (typeof req.files === 'undefined' || typeof req.files.file === 'undefined' || typeof req.params.appname === 'undefined') {
        return res.status(404).send();
      }
      var imgStream = fs.createReadStream(req.files.file.path);
      var writeName = req.files.file.name.replace(/\.[a-zA-Z]+$/g, '') + '-' + new Date().getTime() + '.jpg';
      var writePath = '/usercontent/' + req.params.appname + '/';
      mkdirp(process.cwd() + writePath, function (err) {
        if (err) return next(err);
        gm(imgStream, req.files.file.name).quality(80).write(process.cwd() + writePath + writeName, function (err) {
          if (err) return next(err);
          srv.db.insert({file: writeName, path: writePath + writeName, user: req.session.user.name}, 'usercontent', {});
          return res.status(201).send({file: writeName, path: writePath + writeName});
        });
      });
    }
  },
  {
    url: '/usercontent/list',
    method: 'get',
    handler: function (req, res, srv, next) {
      if (typeof req.session.user === 'undefined')
        return res.status(401).send();
      var query = {};
      if (typeof req.session.user.admin === 'undefined')
        query.user = req.session.user.name;
      srv.db.find(query, 'usercontent', {})
      .then(function (docs) {
        for (var i = 0; i < docs.length; i++)
          docs[i].date = docs[i]._id.getTimestamp();
        res.send(docs);
      }, function (err) {
        next(err);
      });
    }
  },
  {
    url: '/usercontent/:appname/:file',
    method: 'delete',
    handler: function (req, res, srv, next) {
      if (typeof req.session.user === 'undefined')
        return res.status(401).send();
      if (typeof req.session.sudo === 'undefined' || new Date().getTime() - req.session.sudo > 60 * 60 * 1000)
        return res.status(401).send(new srv.err('Sudo required.'));
      var path = '/usercontent/' + req.params.appname + '/' + req.params.file;
      srv.db.find({path: path}, 'usercontent', {})
      .then(function (docs) {
        if (docs.length < 1
          || (docs[0].name !== req.session.user.name && !req.session.user.admin))
          return res.status(404).send();
        fs.unlink(process.cwd() + path, function (err) {
          if (err) return next(err);
          srv.db.remove({path: path}, 'usercontent', {});
          return res.status(202).send();
        });
      }, function (err) {
        next(err);
      });
    }
  }
];
