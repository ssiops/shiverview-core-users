(function (angular) {
angular.module('shiverview')
.controller('userSigninCtrl', ['$scope', '$http', '$rootScope', '$location', 'user', function ($scope, $http, $rootScope, $location, user) {
  var u = user.get();
  if (typeof u !== 'undefined') {
    if (typeof u.then === 'function')
      u.success(function () { $location.path('/users/profile') });
    else
      $location.path('/users/profile');
  }
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.username === 'undefined' || typeof $scope.password === 'undefined')
      return;
    user.auth($scope.username, $scope.password)
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
      u.success(function () { $location.path('/users/profile') });
    else
      $location.path('/users/profile');
  }
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.form.username === 'undefined' || typeof $scope.form.password === 'undefined' || typeof $scope.form.email === 'undefined')
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
}])
.controller('userProfileCtrl', ['$scope', '$http', '$rootScope', '$location', '$upload', 'user', function ($scope, $http, $rootScope, $location, $upload, user) {
  $scope.showProfileImg = true;
  $scope.user = user.get();
  if (typeof $scope.user === 'undefined')
    $location.path('/users/signin');
  if (typeof $scope.user.then === 'function')
    $scope.user.success(function () { $scope.user = user.get() }).error(function () { $location.path('/users/signin'); });
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
  $scope.save = function (payload, e) {
    if (e) e.preventDefault();
    user.set(payload)
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
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
}])
.controller('userSignoutCtrl', ['$location', 'user', function ($location, user) {
  user.signout();
  $location.url('/users/signin');
}]);
})(window.angular);
