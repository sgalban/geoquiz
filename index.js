var express = require('express');
var session = require("express-session");
var path = require("path");
var bodyParser = require("body-parser");
var mongo = require("mongodb");
var mongoClient = require("mongodb").MongoClient;
var mysql = require("mysql");
var app = express();

const mongoUri = "mongodb://geo_dev:geo_dev@ds039674.mlab.com:39674/cis450_geoquiz";
const dbName = "cis450_geoquiz";

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

var pool = mysql.createPool({
    host        : "geoquizid.cglhz5b6lacy.us-east-2.rds.amazonaws.com",
    user        : "geoquiz_user",
    password    : "geopassword",
    database    : "geoquiz",
    port        : 3306
});

const continents = ["North America", "South America", "Asia", "Africa", "Europe"];

function setNextQuestion(req, res, text, answers, correct, points, imgRef=undefined) {
    req.session.curQues = req.session.nextQues;
    req.session.nextQues = {
        text: text,
        answers:    answers,
        correct:    correct,
        points:     points,
        imageRef:   imgRef
    }
    req.session.save(function(err){});
    var questionInfo = {
        text: req.session.curQues.text,
        answers: req.session.curQues.answers,
        imageRef: req.session.curQues.imageRef,
    };
    
    res.send(questionInfo);
}

app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'));
});

function randomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function randomInt(max) {
    return randomIntRange(0, max);
}

function addCommas(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function shuffle(array) {
    for(var i = 0; i < array.length; i++) {
        var rand = randomInt(array.length);
        var temp = array[i];
        array[i] = array[rand];
        array[rand] = temp;
    }
}

/* Get the main page html */
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, "/", "main.html"));
});

/* Get the quiz page html */
app.get('/quiz', function(req, res) {
    res.sendFile(path.join(__dirname, "/", "quiz.html"));
    req.session.score = 0;
    req.session.finished = false;
    req.session.submitted = true;
    req.session.curQues = {};
    req.session.nextQues = {};
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
            req.session.score += req.session.curQues.points;
            req.session.save(function(err){});
            res.send({newScore: req.session.score, correct: true});
        }
        else {
            req.session.score = Math.max(req.session.score - 10, 0);
            req.session.save(function(err){});
            res.send({newScore: req.session.score, correct: false});
        }
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
function q1(req, res) {
    var query = 
        "SELECT name, population FROM Countries " + 
        "ORDER BY RAND() LIMIT 1";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            
            var correct = randomInt(4);
            var country = results[0]["name"];
            var pop = results[0]["population"];
            
            var multipliers = [
                randomIntRange(5, 10), 
                randomIntRange(5, 10),
                randomIntRange(5, 10),
                randomIntRange(5, 10)
            ];
            var i;
            var answers = [];
            for(i = 0; i < 4; i++) {
                var num = Math.floor(pop * Math.pow(multipliers[i], i - correct))
                answers[i] = addCommas(num);
            }
            
            connection.release();
            
            var question = "What is the population of "  + country + "?";
            setNextQuestion(req, res, question, answers, correct, 30);     
        });
    });
}

// <Capital> is the capital of which country?
function q2(req, res) {
    var query = 
        "SELECT name, capital FROM Countries " + 
        "ORDER BY RAND() LIMIT 4";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            
            var correct = randomInt(4);
            var answers = [results[0]["name"], results[1]["name"], results[2]["name"], results[3]["name"]];
            var capital = results[correct]["capital"];
            
            connection.release();
            var question = capital + " is the capital of which country?"
            setNextQuestion(req, res, question, answers, correct, 10);     
        });
    });
}

// What is the capital of <country>?
function q3(req, res) {
    var query = 
        "SELECT name, capital FROM Countries " + 
        "ORDER BY RAND() LIMIT 4";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            
            var correct = randomInt(4);
            var answers = [results[0]["capital"], results[1]["capital"], 
                           results[2]["capital"], results[3]["capital"]];
            var country = results[correct]["name"];
            
            connection.release();
            var question = "What is the capital of " + country + "?"
            setNextQuestion(req, res, question, answers, correct, 10);     
        });
    });
}

// Which of these countries is the largest by area?
function q4(req, res) {
    var query = "SELECT * FROM " +
                "(SELECT code, name, area FROM Countries ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY area DESC";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["code"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the largest by area?"
            setNextQuestion(req, res, question, answers, correct, 15);     
        });
    });
}

// Which of these countries is the smallest by area?
function q5(req, res) {
    var query = "SELECT * FROM " +
                "(SELECT code, name, area FROM Countries ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY area";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            ;
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["code"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the smallest by area?";
            setNextQuestion(req, res, question, answers, correct, 20);     
        });
    });
}


// <Flag> is the flag of which country?
function q6(req, res) {
    var query = 
        "SELECT code, name FROM Countries " + 
        "ORDER BY RAND() LIMIT 4";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {

            var correct = randomInt(4);
            var answers = [results[0]["name"], results[1]["name"], 
                           results[2]["name"], results[3]["name"]];
            var flagRef = "https://www.cia.gov/library/publications/the-world-factbook/graphics/flags/large/" +
                  results[correct]["code"] +
                  "-lgflag.gif"
            connection.release();
            var question = "The following is the flag of which country?"
            setNextQuestion(req, res, question, answers, correct, 20, flagRef); 
        });    
    });    
}

// Which of these countries is largest by gdp?
function q7(req, res) {
    var query = "SELECT * FROM " +
                "(SELECT code, name, gdp FROM Countries ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY gdp DESC";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            ;
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["code"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the largest by gdp?"
            setNextQuestion(req, res, question, answers, correct, 25);     
        });
    });
}

// Which of these countries is smallest by gdp?
function q8(req, res) {
    var query = "SELECT * FROM " +
                "(SELECT code, name, gdp FROM Countries ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY gdp";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["code"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the smallest by gdp?"
            setNextQuestion(req, res, question, answers, correct, 25);     
        });
    });
}

// Which of these countries is largest in population?
function q9(req, res) {
    var query = "SELECT * FROM " +
                "(SELECT code, name, population FROM Countries ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY population DESC";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            ;
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["code"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries has the largest population?";
            setNextQuestion(req, res, question, answers, correct, 20);     
        });
    });
}

// Which of these countries is smallest in population?
function q10(req, res) {
    var query = "SELECT * FROM " +
                "(SELECT code, name, population FROM Countries ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY population";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["code"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries has the smallest population?";
            setNextQuestion(req, res, question, answers, correct, 20);     
        });
    });
}

// Which of these countries is in <Continent>?
function q11(req, res) {
    var con = continents[randomInt(continents.length)];
    var query = 
        "(SELECT code, name, continent FROM Countries WHERE continent = '" + con + "'" + 
        " ORDER BY RAND() LIMIT 1)" +
        " UNION " +
        "(SELECT code, name, continent FROM Countries WHERE continent != '" + con + "'" + 
        " ORDER BY RAND() LIMIT 3)";
    console.log(query);
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            var r = [];
            for(var i = 0; i < 4; i++){
                r[i] = results[i];
            }
            console.log(r);
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < 4; i++){
                if(r[i]["continent"] == con) {
                    correct = i;
                }
            }
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            var question = "The following countries is in " + con + "?";
            setNextQuestion(req, res, question, answers, correct, 10); 
        });    
    }); 
}

//Which of these cities has the largest population?
function q12(req, res) {
	var query = "SELECT * FROM " +
                "(SELECT name, population FROM Cities ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY population DESC";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            ;
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["name"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["name"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these cities has the largest population?";
            setNextQuestion(req, res, question, answers, correct, 25);     
        });
    });
}

//Which of these cities has the smallest population?
function q13(req, res) {
	var query = "SELECT * FROM " +
                "(SELECT name, population FROM Cities ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY population";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            ;
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["name"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["name"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these cities has the smallest population?";
            setNextQuestion(req, res, question, answers, correct, 30);     
        });
    });
}

//Which of these mountains has the greatest elevation?
function q14(req, res) {
	var query = "SELECT * FROM " +
                "(SELECT name, elevation FROM Mountains ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY elevation DESC";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            ;
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["name"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            console.log(r);
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["name"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these mountains is the tallest?";
            setNextQuestion(req, res, question, answers, correct, 30);     
        });
    });
}

//Which of these mountains has the smallest elevation?
function q14(req, res) {
	var query = "SELECT * FROM " +
                "(SELECT name, elevation FROM Mountains ORDER BY RAND() LIMIT 4) T " +
                "ORDER BY elevation";
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            ;
            if(error) {
                throw error;
            }
            
            var correctCode = results[0]["name"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            console.log(r);
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r[i]["name"] == correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these mountains is the shortest?";
            setNextQuestion(req, res, question, answers, correct, 30);     
        });
    });
}

//Which of these countries is <Mountain> in?
function q15(req, res) {
	var query = 
	    "SELECT code, country, name FROM " +
        "(SELECT Countries.code, Countries.name AS country, Mountains.name " +
        "FROM Countries JOIN Mountains " +
        "ON Countries.code = Mountains.countryCode " +
        "ORDER BY RAND()) T " +
        "GROUP BY (country) " +
        "ORDER BY RAND() LIMIT 4;"
                                   
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            
            if(error) {
                throw error;
            }
            var correct = randomInt(4)
            
            var mountain = results[correct]["name"];
            
            var answers = [results[0]["country"], results[1]["country"], 
                           results[2]["country"], results[3]["country"]];
            connection.release();
            
            var question = "Which of these countries is " + mountain + " found in?";
            setNextQuestion(req, res, question, answers, correct, 20);     
        });
    });
}

//Which of these mountains is in <country>?
function q16(req, res) {
	var query = 
	    "SELECT code, country, name FROM " +
        "(SELECT Countries.code, Countries.name AS country, Mountains.name " +
        "FROM Countries JOIN Mountains " +
        "ON Countries.code = Mountains.countryCode " +
        "ORDER BY RAND()) T " +
        "GROUP BY (country) " +
        "ORDER BY RAND() LIMIT 4;"
                                   
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            
            if(error) {
                throw error;
            }
            var correct = randomInt(4)
            
            var country = results[correct]["country"];
            
            var answers = [results[0]["name"], results[1]["name"], 
                           results[2]["name"], results[3]["name"]];
            connection.release();
            
            var question = "Which of these mountains is in " + country + "?";
            setNextQuestion(req, res, question, answers, correct, 20);     
        });
    });
}

//Which of these countries is <city> in?
function q17(req, res) {
	var query = 
	    "SELECT code, country, name FROM " +
        "(SELECT Countries.code, Countries.name AS country, Cities.name " +
        "FROM Countries JOIN Cities " +
        "ON Countries.code = Cities.countryCode " +
        "ORDER BY RAND()) T " +
        "GROUP BY (country) " +
        "ORDER BY RAND() LIMIT 4;"
                                   
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            
            if(error) {
                throw error;
            }
            var correct = randomInt(4)
            
            var city = results[correct]["name"];
            
            var answers = [results[0]["country"], results[1]["country"], 
                           results[2]["country"], results[3]["country"]];
            connection.release();
            
            var question = "Which of these countries is " + city + " found in?";
            setNextQuestion(req, res, question, answers, correct, 15);     
        });
    });
}

//Which of these cities is in <country>?
function q18(req, res) {
	var query = 
	    "SELECT code, country, name FROM " +
        "(SELECT Countries.code, Countries.name AS country, Cities.name " +
        "FROM Countries JOIN Cities " +
        "ON Countries.code = Cities.countryCode " +
        "ORDER BY RAND()) T " +
        "GROUP BY (country) " +
        "ORDER BY RAND() LIMIT 4;"
                                   
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            
            if(error) {
                throw error;
            }
            var correct = randomInt(4)
            
            var country = results[correct]["country"];
            
            var answers = [results[0]["name"], results[1]["name"], 
                           results[2]["name"], results[3]["name"]];
            connection.release();
            
            var question = "Which of these cities is in " + country + "?";
            setNextQuestion(req, res, question, answers, correct, 15);     
        });
    });
}

//What is the largest city in <country>?
function q19(req, res) {
	var query = 
	    "SELECT name, country FROM " +
        "(SELECT name, countryCode, population FROM Cities) T4 " +
        "RIGHT JOIN " +
        "(SELECT code, name AS country FROM " +
        "(SELECT code, name FROM Countries) T1 " +
        "JOIN " +
        "(SELECT countryCode FROM Cities GROUP BY (countryCode) " +
        "HAVING (COUNT(*) > 3) ORDER BY RAND() LIMIT 1) T2 " +
        "ON code = countryCode) T3 " +
        "ON code = CountryCode " +
        "ORDER BY population DESC;"

                                   
    pool.getConnection(function(err, connection) {
        if(err) {
            throw err;
        }
        connection.query(query, function(error, results, fields) {
            if(error) {
                throw error;
            }
            var largest = results[0]["name"];
            var indices = [0];
            while(indices.length < 4) {
                var random = randomIntRange(1, results.length);
                if (indices.indexOf(random) > -1) {
                    continue;
                }
                else {
                    indices.push(random);
                }
            }
            shuffle(indices);
            
            var country = results[0]["country"];
            var answers = [results[indices[0]]["name"], results[indices[1]]["name"], 
                           results[indices[2]]["name"], results[indices[3]]["name"]];
            connection.release();
            
            var correct = 0;
            for (var i = 0; i < 4; i++) {
                if(answers[i] == largest) {
                    correct = i;
                }
            }
            
            var question = "What is the largest city in " + country + "?";
            setNextQuestion(req, res, question, answers, correct, 10);     
        });
    });
}

/* Create a question, as well as 4 sample answers. Do not send
   the correct answer in the response. The order of the answers
   should not indicate which one is correct */
app.get('/generate-question', function(req, res) {
    if(!req.session.finished) {
        
        var questions = [
            q1, q2, q3, q4, q5, q6, q7, q8, q9, q10, q11, q12, q13,
            q14, q15, q16, q17, q18, q19
        ];
        var questionType = questions[randomInt(questions.length)];
        //questionType = questions[5]; // Override. Comment out to cancel
        questionType(req, res);  
    }
});

