# shiverview-core-users

## Symposis

This module adds RESTful user APIs to Project Shiverview. An web interface is provided via the shiverview-core-ui module. This module includes user signin, signup, profile editing, and usercontent uploading.

## HTTP API

* `POST /signin`
* `GET /signout`
* `GET /profile`
* `PUT /profile/:name`
* `POST /profile/:name`
* `DELETE /profile/:name`
* `GET /check`
* `POST /usercontent/:appname/img`
* `DELETE /usercontent/:appname/:filename`
* `GET /usercontent/:appname`
* `GET /oauth2`
* `POST /oauth2`
* `PUT /oauth2/profile`

## `user` service in Angular

* `get()` - get current user
  * return - a user, undefined if not signed in; a promise if this method has not been executed at least once
    * name - username
    * displayName - the name to be displayed
    * email
    * profileimg - url to profile image
    * flags - some flags about this user
* `set(opt)` - set a user property, both client-side and server-side
  * opt - key-value pair used to set property
  * return - $http promise
* `auth(id, password)` - user sign in
  * id - user name or email, will auto detect
  * password - plain text password
  * return - $http promise
* `update()` - Contact the server and get user info
  * return - $http promise
* `signout()` - Sign out, will broadcast userStatusChange on success
  * return - $http promise
* `sudo()` - enter sudo mode
  * return - undefined

## Sign in with Google

Config.json in stardshard should be configured with API keys, client id, client secret, redirect url from Google Developer Console.

* User clicks the button, goes to https://accounts.google.com/o/oauth2/auth
* Google returns auth code to /oauthcallback?code=xxx&...
* Client redirects to /#/users/auth, asks server to auth, and wait (display a huge loading logo here)
* Server posts to accounts.google.com/o/oauth2/token and gets access token
* Server uses access token to get user info, like email, etc.
* Server looks up user database to find the user and add to req.session.user, if not found, add a new one
* oauthcallback complete, client can redirect to original page. If a new user was created, the user will be prompted to set a password.
