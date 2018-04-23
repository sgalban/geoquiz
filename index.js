var express = require('express');
var session = require("express-session");
var path = require("path");
var bodyParser = require("body-parser");
var mongo = require("mongodb");
var mongoClient = require("mongodb").MongoClient;
var app = express();

const mongoUri = "mongodb://geo_dev:geo_dev@ds039674.mlab.com:39674/cis450_geoquiz";
const dbName = "cis450_geoquiz";
var countries = [];

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

/* Get all the countries */
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
  mongoClient.connect(mongoUri, function(err, client){
        var db = client.db(dbName);
        db.collection("all").find({}).project({Code: 1, Government: 1, _id: 0}).toArray(function(err, res) {
            if(err) {
                throw err;
            }
            var i;
            for(i = 0; i < res.length; i++) {
                var entry = {
                    Code:  res[i].Code,
                    Name:  res[i].Government["Country name"]["conventional short form"].text
                }
                countries.push(entry);
            }
            client.close();
        });
    });
});

function randomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function randomInt(max) {
    return randomIntRange(0, max);
}

function getRandomCountry() {
    return countries[randomInt(countries.length)];
}

function getFourRandomCountries() {
    var arr = [];
    while(arr.length < 4) {
        var rand = randomInt(countries.length);
        if(arr.indexOf(rand) > -1) {
            continue;
        }
        else {
            arr.push(rand);
        }
    }
    return [countries[arr[0]], countries[arr[1]], countries[arr[2]], countries[arr[3]]];
}

function addCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function firstNonLetter(str) {
    var i;
    for(i = 0; i < str.length; i++){
        var c = str.charAt(i).toUpperCase();
        if(c != " " && (c < "A" || c > "Z")) {
            return i;
        }
    }
    return -1;
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
    }, 1000 * 90);
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

// What is the population of <country>?
function q1(countryInfo, client, req, res) {
    var country = getRandomCountry();
    countryInfo.findOne({Code: country.Code}, function(err, result) {
        if (err) {
            throw err;
        }
        var popString = result["People and Society"].Population.text;
        popString = popString.replace(/,/g, "");
        var index = popString.indexOf(" ");
        if(index > 0){
            popString = popString.substring(0, index);
        }
        var pop = parseInt(popString);
        var order = Math.floor(randomInt(4));
        var multipliers = [
            randomIntRange(2, 5), 
            randomIntRange(2, 5),
            randomIntRange(2, 5),
            randomIntRange(2, 5)
        ];
        var i;
        var answers = [];
        for(i = 0; i < 4; i++) {
            var num = Math.floor(pop * Math.pow(multipliers[i], i - order))
            answers[i] = addCommas(num);
        }
        
        req.session.curQues = {
            text: "What is the population of " + country.Name + "?",
            answers: answers,
            correct: order
        }
        req.session.save(function(err){});
        var questionInfo = {
            text: req.session.curQues.text,
            answers: req.session.curQues.answers
        };
        res.send(questionInfo);
        
    });
}

// <Capital> is the capital of which country?
function q2(countryInfo, client, req, res) {
    var countries = getFourRandomCountries();
    var codes = [countries[0].Code, countries[1].Code, countries[2].Code, countries[3].Code];
    countryInfo.find({Code: {$in: codes}}).project({_id:0, Code:1, Government:1})
    .toArray(function(err, result) {
        if (err) {
            throw err;
        }
        var answers = [];
        var i;
        for(i = 0; i < 4; i++) {
            answers[i] = result[i].Government["Country name"]["conventional short form"].text;
        }
        var correct = randomInt(4);
        var capital = result[correct].Government.Capital.name.text;
        var index = firstNonLetter(capital);
        if(index > 0) {
            capital = capital.substring(0, index).trim();
        }
        
        req.session.curQues = {
            text: capital + " is the capital of which country?",
            answers: answers,
            correct: correct
        }
        req.session.save(function(err){});
        var questionInfo = {
            text: req.session.curQues.text,
            answers: req.session.curQues.answers
        };
        res.send(questionInfo);
        
    });
}

// What is the capital of <country>?
function q3(countryInfo, client, req, res) {
    var countries = getFourRandomCountries();
    var codes = [countries[0].Code, countries[1].Code, countries[2].Code, countries[3].Code];
    countryInfo.find({Code: {$in: codes}}).project({_id:0, Code:1, Government:1})
    .toArray(function(err, result) {
        if (err) {
            throw err;
        }
        var answers = [];
        var i;
        for(i = 0; i < 4; i++) {
            var capital = result[i].Government.Capital.name.text;
            var index = firstNonLetter(capital);
            if(index > 0) {
                capital = capital.substring(0, index).trim();
            }
            answers[i] = capital;
        }
        var correct = randomInt(4);
        var country = result[correct].Government["Country name"]["conventional short form"].text;
        
        req.session.curQues = {
            text: "What is the capital of " + country,
            answers: answers,
            correct: correct
        }
        req.session.save(function(err){});
        var questionInfo = {
            text: req.session.curQues.text,
            answers: req.session.curQues.answers
        };
        res.send(questionInfo);
        
    });
}

// Which of these countries is the largest by area?
function q4(countryInfo, client, req, res) {
    var countries = getFourRandomCountries();
    var codes = [countries[0].Code, countries[1].Code, countries[2].Code, countries[3].Code];
    countryInfo.find({Code: {$in: codes}}).project({_id:0, Code:1, Geography:1, Government:1})
    .toArray(function(err, result) {
        if (err) {
            throw err;
        }
        var correct = 0;
        var areas = [];
        var answers = [];
        var i;
        for(i = 0; i < result.length; i++) {
            areas[i] = result[i].Geography.Area.total.text;
        }
        for (i = 0; i < areas.length; i++) {
            if(areas[i] > areas[correct]) {
                correct = i;
            }
            answers[i] = result[i].Government["Country name"]["conventional short form"].text;
        }
        
        req.session.curQues = {
            text: "Which of these countries is the largest by area?",
            answers: answers,
            correct: correct
        }
        req.session.save(function(err){});
        var questionInfo = {
            text: req.session.curQues.text,
            answers: req.session.curQues.answers
        };
        res.send(questionInfo);
        
    });
}

// Which of these countries is the smallest by area?
function q5(countryInfo, client, req, res) {
    var countries = getFourRandomCountries();
    var codes = [countries[0].Code, countries[1].Code, countries[2].Code, countries[3].Code];
    countryInfo.find({Code: {$in: codes}}).project({_id:0, Code:1, Geography:1, Government:1})
    .toArray(function(err, result) {
        if (err) {
            throw err;
        }
        var correct = 0;
        var areas = [];
        var answers = [];
        var i;
        for(i = 0; i < result.length; i++) {
            areas[i] = result[i].Geography.Area.total.text;
        }
        for (i = 0; i < areas.length; i++) {
            if(areas[i] < areas[correct]) {
                correct = i;
            }
            answers[i] = result[i].Government["Country name"]["conventional short form"].text;
        }
        
        req.session.curQues = {
            text: "Which of these countries is the smallest by area?",
            answers: answers,
            correct: correct
        }
        req.session.save(function(err){});
        var questionInfo = {
            text: req.session.curQues.text,
            answers: req.session.curQues.answers
        };
        res.send(questionInfo);
        
    });
}

/* Create a question, as well as 4 sample answers. Do not send
   the correct answer in the response. The order of the answers
   should not indicate which one is correct */
app.get('/generate-question', function(req, res) {
    if(req.session.ready && ! req.session.finished) {
        req.session.ready = false;
        
        var nextQuestion = {};
        mongoClient.connect(mongoUri, function(err, client){
            var db = client.db(dbName);
            var countryInfo = db.collection("all");

            var questions = [q1, q2, q3, q4, q5];
            var questionType = questions[randomInt(questions.length)];
            //questionType = questions[3]; // Override. Comment out to cancel
            nextQuestion = questionType(countryInfo, client, req, res);        
        });
    }
    else {
        res.send("Not Ready");
    }
});

