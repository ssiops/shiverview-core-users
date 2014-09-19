var request = require('request');
var q = require('q');

var config = {
  client_id: 'your_client_id.apps.googleusercontent.com',
  client_secret: 'your_client_secret',
  redirect_uri: 'http://localhost/users/oauth2',
  api_key: 'your_api_key'
};

function OAuth (code, opt) {
  if (typeof code !== 'string')
    return null;
  this.code = code;
  if (typeof opt === 'undefined')
    opt = config;
  this.id = opt.client_id;
  this.secret = opt.client_secret;
  this.redirect = opt.redirect_uri;
  this.key = opt.api_key;
  return this;
}

OAuth.prototype.auth = function () {
  var self = this;
  var d = q.defer();
  var options = {
    url: 'https://accounts.google.com/o/oauth2/token',
    method: 'POST',
    form: {
      code: self.code,
      client_id: self.id,
      client_secret: self.secret,
      redirect_uri: self.redirect,
      grant_type: 'authorization_code'
    }
  };
  request(options, function (err, response, body) {
    if (err) d.reject(err);
    else {
      var authResponse = JSON.parse(body.toString());
      if (response.statusCode != 200)
        d.reject(authResponse);
      else {
        d.resolve(authResponse);
        self.authorization = authResponse.token_type + ' ' + authResponse.access_token;
      }
    }
  });
  return d.promise;
};

OAuth.prototype.get = function (fields) {
  var self = this;
  var d = q.defer();
  var query = {
    key: self.key
  };
  if (fields instanceof Array)
    query.fields = fields.join(',');
  if (typeof fields === 'string')
    query.fields = fields;
  if (typeof self.authorization === 'undefined')
    d.reject('Not authenticated.');
  else {
    var options = {
      url: 'https://www.googleapis.com/plus/v1/people/me',
      method: 'GET',
      qs: query,
      headers: {
        'Authorization': self.authorization
      }
    };
    request(options, function (err, response, body) {
      if (err) d.reject(err);
      else {
        var apiResponse = JSON.parse(body.toString());
        if (response.statusCode != 200)
          d.reject(apiResponse);
        else
          d.resolve(apiResponse);
      }
    });
  }
  return d.promise;
};

module.exports = OAuth;
