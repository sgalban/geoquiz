var express = require('express');
var session = require("express-session");
var path = require("path");
var app = express();

app.set('port', (process.env.PORT || 8888));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: "I don't really know what this is supposed to do",
    resave: false,
    saveUninitialized: false
}));

/*
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

var score = 0;*/

/* Get the main page html */
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "main.html"));
});

/* Get the quiz page html */
app.get('/quiz', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "quiz.html"));
  req.session.ready = true;
  req.session.score = 0;
});

/* Create a question, as well as 4 sample answers. Do not send
   the correct answer in the response. The order of the answers
   should not indicate which one is correct */
app.get('/generate-question', function(req, res) {
    if(req.session.ready) {
        req.session.ready = false;
                
        //TODO: Update curQues here
        
        // And get rid of this
        req.session.curQues = {
            text: "This is a placeholder question",
            answers: [
                "Answer 0",
                "Answer 1",
                "Answer 2",
                "Answer 3"
            ],
            correct: 2
        };
    
        var questionInfo = {
            text: req.session.curQues.text,
            answers: req.session.curQues.answers
        };
        res.send(questionInfo);
    }
    else {
        res.send("Not Ready");
    }
});

/* Verify that the selected answer is correct */
app.get('/verify-answer', function(req, res) {
    var selectedAnswer = req.query.selected;
    if (selectedAnswer == req.session.curQues.correct) {
        req.session.score += 20;
        res.send({newScore: req.session.score, correct: true});
    }
    else {
        req.session.score = Math.max(req.session.score - 10, 0);
        res.send({newScore: req.session.score, correct: false});
    }
    
    // Wait half a second before generating the next question
    setTimeout(function() {
        req.session.ready = true;
        req.session.save(function(err){});
    }, 500);
});


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
