var app = angular.module("Scoreboard", []);

app.controller("scoreboardController", function($scope, $http) {
    var req = $http.get("retrieve-all-scores");
    req.success(function(data){
        for (var i = 0; i < data.length; i++) {
            var ts = new Date(data[i].time);
            data[i].time = ts.toLocaleString();
        }
        $scope.scoreData = data;
    });
});