(function (angular) {
angular.module('shiverview')
.controller('userSigninCtrl', ['$scope', '$http', '$rootScope', '$location', 'user', function ($scope, $http, $rootScope, $location, user) {
  var u = user.get();
  if (typeof u !== 'undefined') {
    if (typeof u.then === 'function')
      u.success(function () { $location.path('/users/profile'); });
    else
      $location.path('/users/profile');
  }
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.userid === 'undefined' || typeof $scope.password === 'undefined')
      return;
    user.auth($scope.userid, $scope.password)
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
      user.update()
      .success(function (err) {
        $location.url('/users/profile');
      });
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
    });
  };
}])
.controller('userSignupCtrl', ['$scope', '$http', '$rootScope', '$location', 'user', function ($scope, $http, $rootScope, $location, user) {
  var u = user.get();
  if (typeof u !== 'undefined') {
    if (typeof u.then === 'function')
      u.success(function () { $location.path('/users/profile'); });
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
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
      user.update()
      .success(function (err) {
        $location.url('/users/profile');
      });
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
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
    .success(function (data) {
      $scope.nameTaken = data.nameTaken;
      $scope.emailTaken = data.emailTaken;
    });
  };
}])
.controller('userProfileCtrl', ['$scope', '$http', '$rootScope', '$location', '$upload', 'user', function ($scope, $http, $rootScope, $location, $upload, user) {
  $scope.showProfileImg = true;
  $scope.user = user.get();
  if (typeof $scope.user === 'undefined')
    $location.path('/users/signin');
  else if (typeof $scope.user.then === 'function')
    $scope.user.success(function () { $scope.user = user.get(); }).error(function () { $location.path('/users/signin'); });
  $scope.toggleUploader = function () {
    $scope.showProfileImg = !$scope.showProfileImg;
  };
  $scope.upload = function ($files) {
    $scope.progress = 0;
    $rootScope.$broadcast('setProgress', 0);
    $scope.upload = $upload.upload({
      url: '/users/usercontent/profile/img',
      file: $files[0]
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
    .success(function (data) {
      $scope.nameTaken = data.nameTaken;
      $scope.emailTaken = data.emailTaken;
    });
  };
  $scope.save = function (payload, e) {
    if (e) e.preventDefault();
    user.set(payload)
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
      $scope.editName = $scope.editEmail = false;
      $rootScope.$broadcast('successMessage', 'Your profile has been saved.');
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
    });
  };
  $scope.openFileSelect = function () {
    var input = document.getElementById('file-input');
    var event = new MouseEvent('click', {'view': window, 'bubbles': true, 'calcelable': true});
    input.dispatchEvent(event);
  };
  $scope.deleteAccount = function (e) {
    if (e) e.preventDefault();
    user.delete($scope.delPayload.username)
    .success(function () {
      $location.path('/');
    })
    .error(function (err) {
      if (err && err.message === 'Sudo required.')
        user.sudo();
      else
        $rootScope.$broadcast('errorMessage', err.message);
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
    .success(function () {
      $rootScope.$broadcast('warningMessage', 'You entered sudo mode.');
      if ($params.redirect)
        $location.url($params.redirect);
      else
        $location.url('/users/profile');
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
    });
  };
}])
.controller('userOauthCtrl', ['$scope', '$http', '$location', '$routeParams', '$rootScope', function ($scope, $http, $location, $params, $rootScope) {
  $scope.message = 'Authenticating...';
  $http({
    url: '/users/oauth2',
    method: 'post'
  })
  .success(function (res) {
    if (res && res.newUser) {
      $scope.message = 'Success!';
      $scope.oauthSuccess = true;
    } else {
      $location.path('/users/profile');
    }
  })
  .error(function (err) {
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
    .success(function () {
      $location.url('/users/profile');
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
    });
  };
}]);
})(window.angular);
