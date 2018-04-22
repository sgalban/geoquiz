var app = angular.module("Quiz", []);

var endGame = function() {
    $("#answers").remove();
    $("#correctness").remove();
    $("#question").remove();
    $("#finish").css("visibility", "visible");
}

app.controller("questionController", function($scope, $http) {

    setTimeout(endGame, 1000 * 90);

    var newQuestion = function() {
    
        // Make sure the answer options are visible
        $("#answers").css("visibility", "visible");
        $("#correctness").css("visibility", "hidden");

        // Make sure the score is set to an integer
        if(!Number.isInteger($scope.score)) {
            $scope.score = 0;
        }

        var req = $http.get("generate-question");
        req.success(function(data) {
            if($scope.questionData == "Not Ready") {
                console.log("Question not ready");
            }
            else {
                $scope.questionData = data;
            }
        });
        req.error(function(data) {
            console.log("Error: Cannot GET question");
        });
    }
    
    newQuestion();
    
    $scope.verify = function($event) {
        $("#answers").css("visibility", "hidden");
    
        var selectedAnswer = parseInt($event.currentTarget.getAttribute("value"));
        
        var req = $http({
            url     : "/verify-answer",
            method  : "GET",
            params  : {selected: selectedAnswer}
        });
        
        req.success(function(res) {
            $scope.score = res.newScore;
            $("#correctness").css({
                "visibility":   "visible",
                "color":        res.correct ? "green" : "red"
            });
            $("#correctness").text(res.correct ? "Correct" : "Wrong");
            setTimeout(newQuestion, 600);
        });
        
        req.error(function(res) {
            console.log("Error: Cannot verify answer");
        });
    }
});