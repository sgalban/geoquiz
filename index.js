var express = require('express');
var path = require("path");
var app = express();

app.set('port', (process.env.PORT || 8888));
app.use(express.static(__dirname + '/public'));

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
    //TODO: This is a placeholder. Remember to query the DB
    res.send({
        question: "Placeholder Question",
        answer1: "Answer 1",
        answer2: "Answer 2",
        answer3: "Answer 3",
        answer4: "Answer 4"
    });
});

/* Verify that the selected answer is correct */
app.get('/verify-answer', function(req, res) {
    //TODO
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
