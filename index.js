var express = require('express');
var path = require("path");
var app = express();

app.set('port', (process.env.PORT || 8888));
app.use(express.static(__dirname + '/public'));

var curQues = {
    text: "This is a placeholder question",
    answers: [
        "Answer 0",
        "Answer 1",
        "Answer 2",
        "Answer 3"
    ],
    correct: 2 // This answer is also a placeholder
};
var ready = true;

var score = 0;

/* Get the main page html */
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "main.html"));
});

/* Get the quiz page html */
app.get('/quiz', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "quiz.html"));
});

/* Create a question, as well as 4 sample answers. Do not send
   the correct answer in the response. The order of the answers
   should not indicate which one is correct */
app.get('/generate-question', function(req, res) {
    if(ready) {
        ready = false;
                
        //TODO: Update curQues here
    
        var questionInfo = {
            text: curQues.text,
            answers: curQues.answers
        }
        res.send(questionInfo);
    }
    else {
        res.send("Not Ready");
    }
});

/* Verify that the selected answer is correct */
app.get('/verify-answer', function(req, res) {
    var selectedAnswer = req.query.selected;
    if (selectedAnswer == curQues.correct) {
        score += 20;
        res.send({newScore: score, correct: true});
    }
    else {
        score = Math.max(score - 10, 0);
        res.send({newScore: score, correct: false});
    }
    
    // Wait half a second before generating the next question
    setTimeout(function() {
        ready = true;
    }, 500);
});


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
