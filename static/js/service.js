(function (angular) {
angular.module('shiverview')
.factory('user', ['$http', '$rootScope', '$location', function ($http, $rootScope, $location) {
  var user;
  var init = false;
  var service = {
    get: function () {
      if (init)
        return user;
      else
        return service.update();
    },
    set: function (opt) {
      if (typeof user === 'undefined')
        return;
      return $http({
        url: '/users/profile/' + user.name,
        data: opt,
        method: 'post'
      })
      .success(function () {
        for (var prop in opt)
          if (opt[prop] !== 'undefined')
            user[prop] = opt[prop];
      });
    },
    auth: function (id, password, sudo) {
      var emailPatt = /[a-zA-z0-9]+@[a-zA-z0-9]+\.[a-zA-z]+/;
      var payload;
      if (emailPatt.test(id))
        payload = {email: id, password: password};
      else
        payload = {username: id, password: password};
      if (typeof sudo !== 'undefined')
        payload.sudo = true;
      return $http({
        url: '/users/signin',
        data: payload,
        method: 'post'
      })
      .success(function () {
        $rootScope.$broadcast('userStatusUpdate');
      });
    },
    update: function () {
      return $http({
        url: '/users/profile',
        method: 'get'
      })
      .success(function (u) {
        init = true;
        user = u;
        $rootScope.$broadcast('userStatusUpdate');
      })
      .error(function (err, status) {
        init = true;
        if (status === 404) {
          user = undefined;
          $rootScope.$broadcast('userStatusUpdate');
        }
      });
    },
    signout: function () {
      user = undefined;
      return $http({url: '/users/signout', method: 'get'})
      .success(function () {
        $rootScope.$broadcast('userStatusUpdate');
      });
    },
    delete: function (name) {
      return $http({url: '/users/profile/' + name, method: 'delete'})
      .success(function () {
        user = undefined;
        $rootScope.$broadcast('userStatusUpdate');
      });
    },
    sudo: function () {
      var redirect = $location.path();
      $location.path('/users/sudo');
      $location.search('redirect', redirect);
    },
    query: function (name) {
      return $http({
        url: '/users/profile/' + name,
        method: 'get'
      });
    }
  };
  return service;
}]);
})(window.angular);
