var express = require('express');
var session = require("express-session");
var path = require("path");
var bodyParser = require("body-parser");
var app = express();

app.set('port', (process.env.PORT || 8888));
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: "I don't really know what this is supposed to do",
    resave: false,
    saveUninitialized: false
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

function generateNextQuestion() {
    // This is a placeholder question
    // Replace it with a new question based off our template questions
    var nextQuestion = {
            text: "This is a placeholder question",
            answers: [
                "Answer 0",
                "Answer 1",
                "Answer 2",
                "Answer 3"
            ],
            correct: 2
    };
    
    return nextQuestion
}

/* Get the main page html */
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "main.html"));
});

/* Get the quiz page html */
app.get('/quiz', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "quiz.html"));
  req.session.ready = true;
  req.session.score = 0;
  req.session.finished = false;
  req.session.submitted = true;
  req.session.save(function(err){});
  setTimeout(function() {
    req.session.reload(function(err){
        req.session.finished = true;
        req.session.submitted = false;
        req.session.save(function(err){});
    });
  }, 1000 * 10);
});

/* Get the score submission page html */
app.get('/submission', function (req, res) {
    if(req.session.finished) {
        res.sendFile(path.join(__dirname, "/", "submission.html"));
    }
    else {
        res.sendFile(path.join(__dirname, "/", "main.html"));
    }
});

/* Create a question, as well as 4 sample answers. Do not send
   the correct answer in the response. The order of the answers
   should not indicate which one is correct */
app.get('/generate-question', function(req, res) {
    if(req.session.ready && ! req.session.finished) {
        req.session.ready = false;
                
        req.session.curQues = generateNextQuestion();
    
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
    if(req.session.finished) {
        res.send("Game Finished");
    }
    else {
        var selectedAnswer = req.query.selected;
        if (selectedAnswer == req.session.curQues.correct) {
            req.session.score += 20;
            req.session.save(function(err){});
            res.send({newScore: req.session.score, correct: true});
        }
        else {
            req.session.score = Math.max(req.session.score - 10, 0);
            req.session.save(function(err){});
            res.send({newScore: req.session.score, correct: false});
        }
    
        // Wait half a second before generating the next question
        setTimeout(function() {
            req.session.ready = true;
            req.session.save(function(err){});
        }, 500);
    }
});

/* Retrieve the user's last score */
app.get("/retrieve-score", function(req, res) {
    res.send({score: req.session.score});
});


/* Submit the user's most recent score to the database */
app.post("/submit-score", function(req, res) {
    req.session.username = req.body.username; // Should probably sanitize
    if (req.session.submitted) {
        res.send("Cannot submit again");
    }
    else {
        // This is where we update the db
        res.sendFile(path.join(__dirname, "/", "main.html")); // Make a new page later
    }
    
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
