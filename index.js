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


function dbConnect() {
    // Remove
}

function setNextQuestion(req, res, text, answers, correct, imgRef=undefined) {
    req.session.curQues = req.session.nextQues;
    req.session.nextQues = {
        text: text,
        answers:    answers,
        correct:    correct,
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

function getRandomCountry() {
    return countries[randomInt(countries.length)];
}

function getFourRandomCountries() {
	var con = dbConnect();
    con.connect(function(err) {
		if(err) throw err;
		var countries = [];
		con.query("SELECT name FROM Countries ORDER BY RAND() LIMIT 4", function(err, results, fields) {
			if (err) throw err;
			for (i = 0; i < results.length; i++) {
				countries.push(results[i].name);
			}
			return countries;
		})
	})
}

function getFourRandomCities() {
	var con = dbConnect();
    con.connect(function(err) {
		if(err) throw err;
		var cities = [];
		con.query("SELECT name FROM Cities ORDER BY RAND() LIMIT 4", function(err, results, fields) {
			if (err) throw err;
			for (i = 0; i < results.length; i++) {
				cities.push(results[i].name);
			}
			return cities;
		})
	})
}

function getFourRandomMtns() {
	var con = dbConnect();
    con.connect(function(err) {
		if(err) throw err;
		var mtns = [];
		con.query("SELECT name FROM Mountains ORDER BY RAND() LIMIT 4", function(err, results, fields) {
			if (err) throw err;
			for (i = 0; i < results.length; i++) {
				mtns.push(results[i].name);
			}
			return mtns;
		})
	})
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
            req.session.score += 20;
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
            setNextQuestion(req, res, question, answers, correct);     
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
            setNextQuestion(req, res, question, answers, correct);     
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
            setNextQuestion(req, res, question, answers, correct);     
        });
    });
}

// Which of these countries is the largest by area?
function q4(req, res) {
    var query = "SELECT code, area, name FROM " +
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
                if(r["code"] = correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the largest by area?"
            setNextQuestion(req, res, question, answers, correct);     
        });
    });
}

// Which of these countries is the smallest by area?
function q5(req, res) {
    var query = "SELECT code, area, name FROM " +
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
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r["code"] = correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the smallest by area?";
            setNextQuestion(req, res, question, answers, correct);     
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
            setNextQuestion(req, res, question, answers, correct, flagRef); 
        });    
    });    
}

// Which of these countries is largest by gdp?
function q7(req, res) {
    var query = "SELECT code, name FROM " +
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
            
            var correctCode = results[0]["code"];
            var r = [];
            for(var i = 0; i < results.length; i++) {
                r[i] = results[i];
            }
            connection.release();
            shuffle(r);
            correct = 0;
            for(var i = 0; i < r.length; i++) {
                if(r["code"] = correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the largest by gdp?"
            setNextQuestion(req, res, question, answers, correct);     
        });
    });
}

// Which of these countries is smallest by gdp?
function q8(req, res) {
    var query = "SELECT code, name FROM " +
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
                if(r["code"] = correctCode) {
                    correct = i;
                }
            }
            
            var answers = [r[0]["name"], r[1]["name"], 
                           r[2]["name"], r[3]["name"]];
            
            var question = "Which of these countries is the smallest by gdp?"
            setNextQuestion(req, res, question, answers, correct);     
        });
    });
}

// Which of these countries is largest in population?
function q9(req, res) {
	var con = dbConnect();
	var countries = getFourRandomCountries();
    var names = [countries[0].Name, countries[1].Name, countries[2].Name, countries[3].Name];
	var pops = [];
	var answers = [];
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, population FROM Countries WHERE name IN names", function(err, results, fields) {
			if (err) throw err;
			var correct = 0;
        	for (i = 0; i < results.length; i++) {
				pops[i] = results[i].population;
 			}
			for (i = 0; i < pops.length; i++) {
				if (pops[i] > pops[correct]) {
					correct = i;
				}
				answers[i] = results[i].name;
			}
			req.session.curQues = {
            text: "Which of these countries has the largest population?",
            answers: answers,
            correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);
		})
	})
	
}

// Which of these countries is smallest in population?
function q10(req, res) {
	var con = dbConnect();
	var countries = getFourRandomCountries();
    var names = [countries[0].Name, countries[1].Name, countries[2].Name, countries[3].Name];
	var pops = [];
	var answers = [];
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, population FROM Countries WHERE name IN names", function(err, results, fields) {
			if (err) throw err;
			var correct = 0;
        	for (i = 0; i < results.length; i++) {
				pops[i] = results[i].population;
 			}
			for (i = 0; i < pops.length; i++) {
				if (pops[i] <  pops[correct]) {
					correct = i;
				}
				answers[i] = results[i].name;
			}
			req.session.curQues = {
            text: "Which of these countries has the smallest population?",
            answers: answers,
            correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);
		})
	})
	
}

// Which of these countries is from <Continent>?
function q11(req, res) {
	var con = dbConnect();
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, continent FROM Countries", function(err, results, fields) {
			if (err) throw err;
			var continents = [];
			var answers = [];
			var ctr = 0;
			while (ctr < 4) {
				var random = randomInt(results.length);
				if (continents.indexOf(results[random].continent) == -1) {
					continents.push(results[random].continent);
					answers.push(results[random].name);
					ctr++;
				}
			}
			var correct = randomInt(4);
			req.session.curQues = {
            text: "Which of these countries is in " + continents[correct] + " ?",
            	answers: answers,
            	correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);			
		})
	})
}

//Which of these continents is <Country> in?
function q12(req, res) {
	var con = dbConnect();
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, continent FROM Countries", function(err, results, fields) {
			if (err) throw err;
			var counts = [];
			var answers = [];
			var ctr = 0;
			while (ctr < 4) {
				var random = randomInt(results.length);
				if (answers.indexOf(results[random].continent) == -1) {
					answers.push(results[random].continent);
					counts.push(results[random].name);
					ctr++;
				}
			}
			var correct = randomInt(4);
			req.session.curQues = {
            text: "Which of these continents is " + counts[correct] + " in?",
            	answers: answers,
            	correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);			
		})
	})
}

//Which of these cities has the largest population?
function q13(req, res) {
	var con = dbConnect();
	var cities = getFourRandomCities();
	var names = [cities[0].name, cities[1].name, cities[2].name, cities[3].name];
	var pops = [];
	var answers = [];
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, population FROM Cities WHERE name IN names", function(err, results, fields) {
			if (err) throw err;
			var correct = 0;
        	for (i = 0; i < results.length; i++) {
				pops[i] = results[i].population;
 			}
			for (i = 0; i < pops.length; i++) {
				if (pops[i] >  pops[correct]) {
					correct = i;
				}
				answers[i] = results[i].name;
			}
			req.session.curQues = {
            text: "Which of these cities has the largest population?",
            answers: answers,
            correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);
        	client.close();
		})
	})
}

//Which of these cities has the smallest population?
function q14(req, res) {
	var con = dbConnect();
	var cities = getFourRandomCities();
	var names = [cities[0].name, cities[1].name, cities[2].name, cities[3].name];
	var pops = [];
	var answers = [];
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, population FROM Cities WHERE name IN names", function(err, results, fields) {
			if (err) throw err;
			var correct = 0;
        	for (i = 0; i < results.length; i++) {
				pops[i] = results[i].population;
 			}
			for (i = 0; i < pops.length; i++) {
				if (pops[i] <  pops[correct]) {
					correct = i;
				}
				answers[i] = results[i].name;
			}
			req.session.curQues = {
            text: "Which of these cities has the smallest population?",
            answers: answers,
            correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);
        	client.close();
		})
	})
}

//Which of these mountains has the greatest elevation?
function q15(req, res) {
	var con = dbConnect();
	var mtns = getFourRandomMtns();
	var names = [mtns[0].name, mtns[1].name, mtns[2].name, mtns[3].name];
	var elevs = [];
	var answers = [];
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, elevation FROM Mountains WHERE name IN names", function(err, results, fields) {
			if (err) throw err;
			var correct = 0;
        	for (i = 0; i < results.length; i++) {
				elevs[i] = results[i].elevation;
 			}
			for (i = 0; i < elevs.length; i++) {
				if (elevs[i] >  elevs[correct]) {
					correct = i;
				}
				answers[i] = results[i].name;
			}
			req.session.curQues = {
            text: "Which of these mountains is the tallest?",
            answers: answers,
            correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);
        	client.close();
		})
	})
}

//Which of these mountains has the smallest elevation?
function q16(req, res) {
	var con = dbConnect();
	var mtns = getFourRandomMtns();
	var names = [mtns[0].name, mtns[1].name, mtns[2].name, mtns[3].name];
	var elevs = [];
	var answers = [];
	con.connect(function(err) {
		if (err) throw err;
		con.query("SELECT name, elevation FROM Mountains WHERE name IN names", function(err, results, fields) {
			if (err) throw err;
			var correct = 0;
        	for (i = 0; i < results.length; i++) {
				elevs[i] = results[i].elevation;
 			}
			for (i = 0; i < elevs.length; i++) {
				if (elevs[i] <  elevs[correct]) {
					correct = i;
				}
				answers[i] = results[i].name;
			}
			req.session.curQues = {
            text: "Which of these mountains is the smallest?",
            answers: answers,
            correct: correct
        	}
        	req.session.save(function(err){});
        	var questionInfo = {
            	text: req.session.curQues.text,
            	answers: req.session.curQues.answers
        	};
        	res.send(questionInfo);
        	client.close();
		})
	})
}
/* Create a question, as well as 4 sample answers. Do not send
   the correct answer in the response. The order of the answers
   should not indicate which one is correct */
app.get('/generate-question', function(req, res) {
    if(!req.session.finished) {
        
        var questions = [q1, q2, q3, q4, q5, q6, q7, q8];
        var questionType = questions[randomInt(questions.length)];
        //questionType = questions[5]; // Override. Comment out to cancel
        questionType(req, res);  
    }
});

