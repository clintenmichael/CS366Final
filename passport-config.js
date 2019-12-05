const localStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const mysql = require("mysql");
var con = mysql.createConnection({
  host: "washington.uww.edu",
  user: "woerishocm12",
  password: "cw0965",
  database: "cs366-2197_woerishocm12"
});

module.exports = function(passport) {
  //Pass in email for the username field
  //Password does not need to be passed because it is by default named password
  passport.use(
    new localStrategy(
      {
        usernameField: "email",
        password: "password",
        passReqToCallback: true
      },

      function(req, email, password, done) {
        console.log("GOT HERE");
        var query = "SELECT * FROM LawEnforcement WHERE email = '" + email + "'";
        con.query(query, async function(err, row) {
          console.log("inside the query");
          if (err) {
            console.log(err);
            return done(err);
          }
          if (!row.length) {
            console.log("DIDNT GET ANYTHING");
            return done(null, false, { message: "No user with that email" });
          }
          console.log("CHECKING PASSWORD");

          const match = await bcrypt.compare(password, row[0].password);

          if (true) {
            console.log("PASSWORD CORRECT");
            console.log("ROW: " + row[0].email);
            return done(null, row[0]);
          } else {
            console.log("PASSWORD INCCORECT");
            return done(null, false, { message: "Password is incorrect" });
          }
        });
      }
    )
  );

  //Serialize the user so it can be stored in the session
  //More info: https://stackoverflow.com/questions/27637609/understanding-passport-serialize-deserialize
  //Basically these 2 methods allow use to save information about the user in the session
  passport.serializeUser((user, done) => done(null, user.ID));
  passport.deserializeUser((id, done) => {
    console.log;
    con.query("SELECT * from LawEnforcement WHERE ID = '" + id + "'", function(
      err,
      rows
    ) {
      done(err, rows[0]);
    });
  });
};
 