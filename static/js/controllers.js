(function (angular) {
angular.module('shiverview')
.controller('userSigninCtrl', ['$scope', '$http', '$rootScope', '$location', 'user', function ($scope, $http, $rootScope, $location, user) {
  var u = user.get();
  if (typeof u !== 'undefined') {
    if (typeof u.then === 'function')
      u.then(function () { $location.path('/users/profile'); });
    else
      $location.path('/users/profile');
  }
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.userid === 'undefined' || typeof $scope.password === 'undefined')
      return;
    user.auth($scope.userid, $scope.password)
    .then(function (res) {
      if (res.data.message) return $rootScope.$broadcast('errorMessage', res.data.message);
      user.update()
      .then(function () {
        $location.url('/users/profile');
      });
    }, function (res) {
      $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
}])
.controller('userSignupCtrl', ['$scope', '$http', '$rootScope', '$location', 'user', function ($scope, $http, $rootScope, $location, user) {
  var u = user.get();
  if (typeof u !== 'undefined') {
    if (typeof u.then === 'function')
      u.then(function () { $location.path('/users/profile'); });
    else
      $location.path('/users/profile');
  }
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.form.username === 'undefined' || typeof $scope.form.password === 'undefined' || typeof $scope.form.email === 'undefined' || $scope.nameTaken || $scope.emailTaken)
      return;
    if ($scope.form.password !== $scope.passwordConfirm)
      return $rootScope.$broadcast('warningMessage', 'Your passwords do not match.');
    $http({
      url: '/users/profile/' + $scope.form.username,
      data: $scope.form,
      method: 'put'
    })
    .then(function (res) {
      if (res.data.message) return $rootScope.$broadcast('errorMessage', res.data.message.message);
      user.update()
      .then(function () {
        $location.url('/users/profile');
      });
    }, function (res) {
      $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
  $scope.check = function (opt) {
    var payload = {};
    if (typeof opt !== 'string' || typeof $scope.form[opt] === 'undefined')
      return;
    payload[opt] = $scope.form[opt];
    $http({
      url: '/users/check',
      params: payload,
      method: 'get'
    })
    .then(function (res) {
      $scope.nameTaken = res.data.nameTaken;
      $scope.emailTaken = res.data.emailTaken;
    });
  };
}])
.controller('userProfileCtrl', ['$scope', '$http', '$rootScope', '$location', 'Upload', 'user', function ($scope, $http, $rootScope, $location, $upload, user) {
  $scope.showProfileImg = true;
  $scope.user = user.get();
  if (typeof $scope.user === 'undefined')
    $location.path('/users/signin');
  else if (typeof $scope.user.then === 'function')
    $scope.user.then(function () { $scope.user = user.get(); }, function () { $location.path('/users/signin'); });
  $scope.toggleUploader = function () {
    $scope.showProfileImg = !$scope.showProfileImg;
  };
  $scope.upload = function ($file) {
    $scope.progress = 0;
    $rootScope.$broadcast('setProgress', 0);
    var upload = $upload.upload({
      url: '/users/usercontent/profile/img',
      file: $file
    })
    .progress(function (e) {
      $rootScope.$broadcast('setProgress', parseInt(100.0 * e.loaded / e.total));
    })
    .success(function (data) {
      $rootScope.$broadcast('setProgress', 100);
      if (data.path) {
        $scope.save({profileimg: data.path});
        $scope.showProfileImg = true;
      }
    })
    .error(function (err) {
      $rootScope.$broadcast('setProgress', -1);
      $rootScope.$broadcast('errorMessage', err.message);
    });
  };
  $scope.check = function (scope, opt) {
    var payload = {};
    if (typeof scope !== 'string' || typeof opt !== 'string' || typeof $scope[scope] === 'undefined' || typeof $scope[scope][opt] === 'undefined')
      return;
    payload[opt] = $scope[scope][opt];
    $http({
      url: '/users/check',
      params: payload,
      method: 'get'
    })
    .then(function (res) {
      $scope.nameTaken = res.data.nameTaken;
      $scope.emailTaken = res.data.emailTaken;
    });
  };
  $scope.save = function (payload, e) {
    if (e) e.preventDefault();
    user.set(payload)
    .then(function (res) {
      if (res.data.message) return $rootScope.$broadcast('errorMessage', res.data.message);
      $scope.editName = $scope.editEmail = false;
      $rootScope.$broadcast('successMessage', 'Your profile has been saved.');
    }, function (res) {
      $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
  $scope.deleteAccount = function (e) {
    if (e) e.preventDefault();
    user.delete($scope.delPayload.username)
    .then(function () {
      $location.path('/');
    }, function (res) {
      if (res.data.message === 'Sudo required.')
        user.sudo();
      else
        $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
}])
.controller('userSignoutCtrl', ['$location', 'user', function ($location, user) {
  user.signout();
  $location.url('/users/signin');
}])
.controller('userSudoCtrl', ['$scope', '$location', '$routeParams', '$rootScope', 'user', function ($scope, $location, $params, $rootScope, user) {
  $scope.user = user.get();
  if (typeof $scope.user === 'undefined' || typeof $scope.user.name === 'undefined')
    $location.path('/users/signin');
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    user.auth($scope.user.name, $scope.password, true)
    .then(function () {
      $rootScope.$broadcast('warningMessage', 'You entered sudo mode.');
      if ($params.redirect)
        $location.url($params.redirect);
      else
        $location.url('/users/profile');
    }, function (res) {
      $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
}])
.controller('userOauthCtrl', ['$scope', '$http', '$location', '$routeParams', '$rootScope', function ($scope, $http, $location, $params, $rootScope) {
  $scope.message = 'Authenticating...';
  $http({
    url: '/users/oauth2',
    method: 'post'
  })
  .then(function (res) {
    if (res.data && res.data.newUser) {
      $scope.message = 'Success!';
      $scope.oauthSuccess = true;
    } else {
      $location.path('/users/profile');
    }
  }, function () {
    $rootScope.$broadcast('warningMessage', 'Failed to sign in with Google. Please try again.');
    $location.path('/users/signin');
  });
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.password === 'undefined')
      return;
    if ($scope.password !== $scope.passwordConfirm)
      return $rootScope.$broadcast('warningMessage', 'Your passwords do not match.');
    $http({
      url: '/users/oauth2/profile',
      method: 'put',
      data: {password: $scope.password}
    })
    .then(function () {
      $location.url('/users/profile');
    }, function (res) {
      $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
}])
.controller('userContentCtrl', ['$scope', '$http', '$rootScope', 'user', function ($scope, $http, $rootScope, user) {
  $scope.predicate = 'file';
  $scope.reverse = false;
  $scope.templateUrl = 'profilePopover.html';
  $scope.order = function (predicate) {
    $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
    $scope.predicate = predicate;
  };
  $scope.get = function () {
    $http({
      url: '/users/usercontent/list',
      method: 'get'
    })
    .then(function (res) {
      $scope.list = res.data;
    }, function (res) {
      $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
  $scope.delete = function (path) {
    $http({
      url: '/users' + path,
      method: 'delete'
    })
    .then(function () {
      $scope.get();
      $rootScope.$broadcast('successMessage', 'Successfully deleted \'' + path + '\'');
    }, function (res) {
      if (res.data.message === 'Sudo required.')
        user.sudo();
      else
        $rootScope.$broadcast('errorMessage', res.data.message);
    });
  };
  $scope.query = function (file) {
    if (file.cached) return;
    user.query(file.user).then(function (res) {
      file.username = res.data.displayName;
      file.userimg = res.data.profileimg;
      file.cached = true;
    });
  };
  $scope.get();
}]);
})(window.angular);
