const express = require("express");
const app = express();
//Dependency for hashing passwords
const bcrypt = require("bcrypt");

const port = process.env.PORT || 5000;
//passport will allow us to handle authentication to create express sessions

//Connect to DB
var isConnected = false
const mysql = require('mysql')
var con = mysql.createConnection({
    host: "washington.uww.edu",
    user: "woerishocm12",
    password: "cw0965",
    database: "cs366-2197_woerishocm12",
    multipleStatements: true
  });

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    isconnected = true;
});

const passport = require("passport");
//express-flash allows use to render messages on the client

const flash = require("express-flash");

//allows the server to create sessions to persist variables throughout the session
const session = require("express-session");

//passport handles authentication
require("./passport-config")(passport);

const methodOverride = require("method-override");

const users = [];
// WILL PROBABLY CHANGED TO JSX
app.set("view-engine", "ejs");
// app.set('view engine', 'html');

//Initialize Middleware

//Allows us to access form variables inside post methods
app.use(express.urlencoded({ extended: false }));
app.use( express.static( "public" ) );

app.use(flash());
app.use(
  session({
    secret: "secret", 
    //do not want to resave session variables if nothing has changed
    resave: true,
    saveUninitialized: true
  })
);

// First check if the user is authenticated
// If the user is authenticated create a new session
app.use(passport.initialize());
app.use(passport.session());

//Allows us to use the delete method
//Using delete is safer than using POST
app.use(methodOverride("_method"));

//GET METHODS
app.get("/", checkAuthenticated, (req, res) => {
  //if we get here are authenticated
  //By using passport req.* variables are all accessable
    if (!isconnected) {
      res.redirect("regiser.ejs", {
        message: "Could not connect to database please try again"
      });
    } else {
      var sql = "SELECT Crime.*, CrimeLocation.locationID, CityLocation.* FROM `Crime` JOIN CrimeLocation ON Crime.crimeID = CrimeLocation.crimeID JOIN CityLocation ON CrimeLocation.locationID = CityLocation.locationID LIMIT 100";
      con.query(
        sql,
        function(err, result) {
          if (err) throw err;
          res.render("index.ejs", { name: req.user.email, data : result});
        }
      );
    }
  
});

//Route to the login page
app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login.ejs");
});


app.get("/crime", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM Crime WHERE crimeID = '" + req.query.id + "';" +
  "SELECT Criminal.*, Crime.crimeID " +
  "FROM Criminal, Crime, Accused " +
  "WHERE Criminal.ID = Accused.criminalID " +
  "AND Crime.crimeID = Accused.crimeID " +
  "AND Crime.crimeID = '" + req.query.id + "';" +
  "SELECT Crime.crimeID, CrimeLocation.locationID, CityLocation.* FROM `Crime` JOIN CrimeLocation ON Crime.crimeID = CrimeLocation.crimeID JOIN CityLocation ON CrimeLocation.locationID = CityLocation.locationID WHERE Crime.crimeID = '" + req.query.id + "';" +
  "SELECT Crime.crimeID, RespondTo.lawID, LawEnforcement.* FROM Crime JOIN RespondTo ON Crime.crimeID = RespondTo.crimeID JOIN LawEnforcement ON RespondTo.lawID = LawEnforcement.ID WHERE Crime.crimeID = '" + req.query.id + "';" +
  "SELECT Crime.crimeID, Court.caseID, Cases.* FROM Crime JOIN Court ON Crime.crimeID = Court.crimeID JOIN Cases ON Court.caseID = Cases.caseID WHERE Crime.crimeID = " + req.query.id;
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      var crime = result[0];
      var accused = result[1];
      var location = result[2];
      var officer = result[3];
      var cases = result[4];
      res.render("crime.ejs", {crime : crime, data : accused, location : location, officer : officer, cases : cases});
    }
  );
  
});

app.get("/crimes", checkAuthenticated, (req, res) => {
  var sql = "CALL `GetCrimes`();"
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("crimes.ejs", {data : result[0]});
    }
  );
  
});

app.get("/officers", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM LawEnforcement WHERE title != 'Judge'"
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("officers.ejs", {data : result});
    }
  );
  
});

app.get("/officer", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM LawEnforcement WHERE ID = " + req.query.id + ";" +
  "SELECT LawEnforcement.ID, RespondTo.crimeID, Crime.* FROM LawEnforcement JOIN RespondTo ON LawEnforcement.ID = RespondTo.lawID JOIN Crime ON RespondTo.crimeID = Crime.crimeID WHERE LawEnforcement.ID = '" + req.query.id + "'";
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("officer.ejs", {data : result[0], crime : result[1]});
    }
  );
  
});

app.get("/criminals", checkAuthenticated, (req, res) => {
  var sql = "CALL `GetCriminals`();";
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("criminals.ejs", {data : result[0]});
    }
  );
  
});


app.get("/criminal", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM Criminal WHERE ID = " + req.query.id + ";" +
  "SELECT Criminal.ID, Accused.crimeID, Crime.* FROM Criminal JOIN Accused ON Criminal.ID = Accused.criminalID JOIN Crime ON Accused.crimeID = Crime.crimeID WHERE Criminal.ID = '" + req.query.id + "'";
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("criminal.ejs", {data : result[0], crime : result[1]});
    }
  );
  
});

app.get("/judges", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM LawEnforcement WHERE title = 'Judge'"
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("judges.ejs", {data : result});
    }
  );
  
});

app.get("/judge", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM LawEnforcement WHERE ID = '" + req.query.id + "';"
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("judge.ejs", {data : result[0]});
    }
  );
  
});

app.get("/cases", checkAuthenticated, (req, res) => {
  var sql = "CALL `GetCases`();"
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      res.render("cases.ejs", {data : result[0]});
    }
  );
  
});

app.get("/case", checkAuthenticated, (req, res) => {
  var sql = "SELECT * FROM Cases WHERE caseID = '" + req.query.id + "'" + ";" +
  "SELECT Cases.caseID, Court.crimeID, Crime.* FROM Cases JOIN Court ON Cases.caseID = Court.caseID JOIN Crime ON Court.crimeID = Crime.crimeID WHERE Cases.caseID = '" + req.query.id + "'";
  con.query(sql,
    function(err, result) {
      if (err) throw err;
      console.log("below");
      res.render("case.ejs", {data : result[0], crime : result[1]});
    }
  );
  
});






app.get("/map", (req, res) => {
  
  var sql = "SELECT Crime.*, CrimeLocation.locationID, CityLocation.* FROM `Crime` JOIN CrimeLocation ON Crime.crimeID = CrimeLocation.crimeID JOIN CityLocation ON CrimeLocation.locationID = CityLocation.locationID LIMIT 500"
  // var sql = "SELECT Crime.*, CrimeLocation.locationID, CityLocation.* FROM `Crime` JOIN CrimeLocation ON Crime.crimeID = CrimeLocation.crimeID JOIN CityLocation ON CrimeLocation.locationID = CityLocation.locationID"

  con.query(
    sql,
    function(err, result) {
      if (err) throw err;
      res.render("map.ejs", {data : result});
    }
  );
});


//POST METODS
app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
  })
);


 app.post("/deleteCrime", checkAuthenticated, (req, res) => {
  var sql = "DELETE FROM Crime WHERE crimeID = '" + req.query.id + "';" + 
  "DELETE FROM CrimeLocation WHERE crimeID = '" + req.query.id + "';" + 
  "DELETE FROM Accused WHERE crimeID = '" + req.query.id + "';" + 
  "DELETE FROM COURT WHERE crimeID = '" + req.query.id + "';" + 
  "DELETE FROM RespondTo WHERE crimeID = '" + req.query.id + "';"
  con.query(
    sql,
    function(err, result) {
      if (err) throw err;
      res.render("index.ejs");
    });
 });

app.get("/report", checkAuthenticated, async (req, res) => {
  res.render("create.ejs");

});

app.post("/report", checkAuthenticated, async (req, res) => {
  var crimeParams = "'" + req.body.Description + "','" + req.body.FBICode + "','" + req.body.Type + "','" + req.body.Date + "','" +req.body.Domestic + "','" + req.body.Arrest + "'" 
  
  var criminalParams = "'" + req.body.FirstName + "', '" + req.body.LastName + "', '" +req.body.Gender + "', '" + req.body.SSN + "', '" +req.body.Race + "', '" + req.body.Occupation + "' ,'" + req.body.Address + "' ,'" + req.body.State + "' ,'" + req.body.City + "' ,'" + req.body.Company + "' ,'" +req.body.Email + "' ,'" + req.body.Phone + "'"
  
  var locationParams = "'" + req.body.Latitude + "', '" + req.body.Longitude + "', '" + req.body.PoliceDistrict + "' ,'" + req.body.locationDescription + "' ,'" + req.body.CityBlock + "' ,'" +req.body.ZipCode + "'"

  var sql = "INSERT INTO Crime (description, FBICode, type, Date, domestic, arrest) VALUES (" + crimeParams + "); " +
  "INSERT INTO Criminal (firstName, lastName, gender, ssn, race, occupation, address, state, city, company, email, phone) VALUES (" + criminalParams + "); " +
  "INSERT INTO CityLocation (latitude, longitude, policeDistrict, description, cityBlock, zipCode) VALUES (" + locationParams + ");" 

  con.query(
    sql,
    function(err, result) {
      if (err) throw err;
      res.render("index.ejs");
    });

});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  var hashedPassword;
  try {
    //Hash the password passed to the backen from the passwordform var
    hashedPassword = await bcrypt.hash(req.body.password, 10);
  } catch {
    res.redirect("/register");
  }
  //Very ugly and very temporary
  var firstName = req.body.name.split(" ")[0];
  var lastName = req.body.name.split(" ")[1];
  if (!isconnected) {
    res.redirect("regiser.ejs", {
      message: "Could not connect to database please try again"
    });
  } else {
    //con.query
    /*var sql =
      "INSERT into Profile(firstName, lastName, email, password, phoneNumber, type)" +
      "VALUES(?,?,?,?,?,?)";
    con.query(
      sql,
      [firstName, lastName, req.body.email, hashedPassword, "920-555-555", 1],
      function(err, result) {
        if (err) throw err;
        console.log("inserted");
      }
    );*/

    res.redirect("/login");
  }
});

app.delete("/logout", (req, res) => {
  //Method is given to use by passport
  req.logOut();
  res.redirect("/login");
});

//HELPER FUNCTIONS
//If the user it not authenticated redirect them to the login page
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

//If the user is authenticated we do not want to allow them to auth
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

//console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`)); 
