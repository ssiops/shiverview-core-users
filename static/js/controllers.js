(function (angular) {
angular.module('shiverview')
.controller('userSigninCtrl', ['$scope', '$http', '$rootScope', '$location', function ($scope, $http, $rootScope, $location) {
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.username === 'undefined' || typeof $scope.password === 'undefined')
      return;
    var payload = {
      username: $scope.username,
      password: $scope.password
    };
    $http({
      url: '/users/signin',
      data: payload,
      method: 'post'
    })
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
      $rootScope.$broadcast('userStatusUpdate');
      $location.url('/users/profile');
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
    });
  };
}])
.controller('userSignupCtrl', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  $scope.submit = function (e) {
    if (e) e.preventDefault();
    if (typeof $scope.form.username !== 'undefined' || typeof $scope.form.password !== 'undefined' || typeof $scope.form.email !== 'undefined')
      return;
    if ($scope.form.password !== $scope.form.passwordConfirm)
      return $rootScope.$broadcast('warningMessage', 'Your passwords do not match.');
    delete $scope.form.passwordConfirm;
    $http({
      url: '/users/profile/' + $scope.form.username,
      data: $scope.form,
      method: 'put'
    })
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
      $rootScope.$broadcast('userStatusUpdate');
      $location.url('/users/profile');
    })
    .error(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
    });
  };
}])
.controller('userProfileCtrl', ['$scope', '$http', '$rootScope', '$location', '$upload', function ($scope, $http, $rootScope, $location, $upload) {
  $scope.showProfileImg = true;
  $scope.fetch = function () {
    $http({
      url: '/users/profile',
      method: 'get'
    })
    .success(function (user) {
      $scope.user = user;
    })
    .error(function (err, status) {
      if (status === 404)
        $location.url('/users/signin');
    });
  };
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
      $scope.path = data.path;
      if ($scope.path) {
        $scope.save();
      }
    });
  };
  $scope.save = function () {
    var payload = {
      email: $scope.email,
      profileimg: $scope.path
    };
    $http({
      url: '/users/profile/' + $scope.user.name,
      data: payload,
      method: 'post'
    })
    .success(function (err) {
      if (err) return $rootScope.$broadcast('errorMessage', err.message);
      $rootScope.$broadcast('successMessage', 'Your profile has been saved.');
      $scope.profileimg = $scope.path;
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
  $scope.fetch();
}])
.controller('userSignoutCtrl', ['$http', '$location', '$rootScope', function ($http, $location, $rootScope) {
  $http({url: '/users/signout', method: 'get'})
  .success(function () { $rootScope.$broadcast('userStatusUpdate'); })
  $location.url('/users/signin');
}]);
})(window.angular);
