var app = angular.module("Quiz", []);

app.controller("questionController", function($scope, $http) {
    var req = $http.get("generate-question");
    req.success(function(data) {
        $scope.questionData = data;
    });
    req.error(function(data) {
        console.log("Error: Cannot GET question");
    });
});