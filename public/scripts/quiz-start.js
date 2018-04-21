var app = angular.module("Quiz", []);

app.controller("questionController", function($scope, $http) {

    // Make sure the score is set to an integer
    if(!Number.isInteger($scope.score)) {
        $scope.score = 0;
    }

    var req = $http.get("generate-question");
    req.success(function(data) {
        $scope.questionData = data;
    });
    req.error(function(data) {
        console.log("Error: Cannot GET question");
    });
    
    $scope.verify = function($event) {
        var selectedAnswer = parseInt($event.currentTarget.getAttribute("value"));
        var req = $http({
            url     : "/verify-answer",
            method  : "GET",
            params  : {selected: selectedAnswer}
        });
        req.success(function(res) {
            $scope.score = res.newScore;
        });
    }
});