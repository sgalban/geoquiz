var app = angular.module("Quiz", []);

app.controller("questionController", function($scope, $http, $window) {

    var endGame = function() {
        $("#answers").remove();
        $("#correctness").remove();
        $("#question").remove();
        $("#finish").css("visibility", "visible");
        setTimeout(function() {
            $window.location.href = "/submission";
        }, 1000 * 2);
    }

    setTimeout(endGame, 1000 * 10);

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
            $scope.questionData = data;
            if(data.imageRef) {
                $("#question-image").attr("src", data.imageRef);
                $("#question-image").css({
                    "width": "10%",
                    "border-style": "solid" 
                });
            }
            else{
                $("#question-image").css({
                    "width": "0%",
                    "border-style": "none" 
                });
            }
        });
        req.error(function(data) {
            console.log("Error: Cannot GET question");
        });
    }
    
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
    
    // We call generate question once to get nextQuestion
    var req = $http.get("generate-question");
        req.success(function(data) {
            newQuestion();
        });
        req.error(function(data) {
            console.log("Error: Cannot GET question");
        });
});