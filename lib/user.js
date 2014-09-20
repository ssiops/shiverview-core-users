var q = require('q');

function User (opt, password) {
  for (var prop in opt) {
    this[prop] = opt[prop];
  }
  if (typeof password !== 'undefined') {
    if (typeof this.name === 'undefined')
      this.password = password;
    else
      this.password = this.hash(password);
  }
  return this;
}

User.prototype.hash = function(input) {
  var md5 = require('crypto').createHash('md5');
  var sha = require('crypto').createHash('sha256');
  sha.update(input, 'utf-8');
  return sha.update(md5.update(this.name, 'utf-8').digest('hex'), 'utf-8').digest('base64');
};

User.prototype.auth = function(db) {
  var self = this;
  var d = q.defer();
  var query = {};
  if (self.name)
    query.name = self.name;
  else if (self.email)
    query.email = self.email;
  else {
    d.reject(new Error('Invalid username or password.'));
    return d.promise;
  }
  db.find(query, 'users', {limit: 1})
  .then(function (docs) {
    if (docs.length < 1) {
      return d.reject(new Error('Invalid username or password.'));
    } else {
      if (self.email) {
        self.name = docs[0].name;
        self.password = self.hash(self.password);
      }
      if (docs[0].password !== self.password)
        return d.reject(new Error('Invalid username or password.'));
      for (var prop in docs[0])
        self[prop] = docs[0][prop];
      delete self._id;
      delete self.password;
      return d.resolve();
    }
  }, function (err) {
    return d.reject(err);
  });
  return d.promise;
};

User.prototype.create = function(db) {
  var self = this;
  var d = q.defer();
  db.insert(self, 'users', {})
  .then(function (data) {
    d.resolve(data);
  }, function (err) {
    d.reject(err);
  });
  return d.promise;
};

module.exports = User;
