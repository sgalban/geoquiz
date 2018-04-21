var app = angular.module("Quiz", []);

app.controller("questionController", function($scope, $http) {
    var req = $http.get("generate-question");
    req.success(function(data) {
        $scope.questionData = data;
    });
    req.error(function(data) {
        console.log("Error: Cannot GET question");
    });
    
    $scope.verify = function($event) {
        var selectedAnswer = parseInt($event.currentTarget.getAttribute("value"));
        var request = $http({
            url     : "/verify-answer",
            method  : "GET",
            params  : {selected: selectedAnswer}
        });
    }
});