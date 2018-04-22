var app = angular.module("Submit", []);

app.controller("submissionController", function($scope, $http) {
    var req = $http.get("retrieve-score");
    req.success(function(data) {
        $scope.score = data.score;
    });
});