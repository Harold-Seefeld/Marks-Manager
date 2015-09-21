/*
 Class that handles all client connections and the connections between the database
 */

// Set up the protocols
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('./modules/MySQLHandler');
var path = require('path');
var update = require("./modules/Creator");

// Set port and ip variables for the server address, first trying to get values from the openshift host
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 80);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

// Tracking variable for sessions and their respective clients
var sessions = {};

// Allow socket.io connections to be made from the client, which in turn calls this function
io.on('connection', function (socket) {
  // User attempts to sign in
  socket.on('login', function (data) {
    var password = data.password;
    var username = data.username;
    // Check if input lengths are adequate for the password and the username
    if (!password || !username || password.length < 6 || password.length > 16 || username.length > 16 || username.length < 4) {
      socket.emit("err", {error: "Invalid username or password."});
      // Don't execute any further statements if there are invalid values
      return;
    }
    // Add salt to password for decryption later
    password += username.toLowerCase();
    // Get account with that information
    mysql.connection.query("SELECT * FROM accounts WHERE username = ?", [username], function (err, results) {
      if (err) {
        socket.emit("err", {error: "Invalid username or password."});
      }
      else if (results.length > 0 && results[0].password != undefined && password == mysql.decrypt(results[0].password)) {
        socket.emit("ls", {});
        // Add session and account id to the tracking variable
        sessions[socket.id] = results[0].account_id;
      }
      else {
        socket.emit("err", {error: "Invalid username or password."});
      }
    });
  });

  // User wants to register
  socket.on('register', function (data) {
    var password = data.password;
    var username = data.username;
    // Check if lengths are adequate
    if (!password || !username || password.length < 6 || password.length > 16 || username.length > 16 || username.length < 4) {
      socket.emit("err", {error: "Invalid values entered!"});
      // Don't execute any further statements if there are invalid values
      return;
    }
    // Encrypt password using lowercase username as salt
    password = mysql.encrypt(password + username.toLowerCase());
    // Insert registration values into table
    mysql.connection.query("INSERT INTO accounts (username, password) VALUES (?, ?)", [username, password], function (error, success) {
      if (error) {
        if (error.stack) {
          if (error.stack.indexOf("username") > -1) {
            socket.emit("err", {error: 'Username already exists!'});
          } else {
            socket.emit("err", {error: "error"});
          }
        } else {
          socket.emit("err", {error: "error"});
        }
      }
      else {
        socket.emit("rs", {});
      }
    });
  });

  // Event called when a client disconnects
  socket.on('disconnect', function () {
    // Delete socket and id pair from the server if they are authenticated
    if (sessions.hasOwnProperty(sessions)) {
      delete sessions[socket.id];
    }
  });

  // Event called when the client wants to load a table
  socket.on('rt', function (data) {
    // Check if the socket identifier has a client signed in with it
    if (!sessions.hasOwnProperty(socket.id)) {
      return;
    }
    // Declare necessary variables
    var name = data.name;
    var account = sessions[socket.id];
    var dataToSend = {};
    // Set column names
    if (name == "subjects") {
      dataToSend.titles = ["Name", "Number of Tasks", "Final Mark (%)", "Course Completion (%)"];
    } else if (name == "tasks") {
      dataToSend.titles = ["Subject", "Name", "Mark (%)", "Weighting (%)"];
    } else {
      // Escape if no available option has been found (An invalid name would've been received)
      return;
    }
    // Emit table titles to the client
    socket.emit("nt", dataToSend);
    // Allow the name value to be retrieved later
    var getName = function () {
      return name;
    };
    // Ask mysql for the data, querying the table of the name variable
    mysql.connection.query("SELECT * FROM `" + name + "` WHERE account_id = ?", [account], function (err, results) {
      // Check if an error occurs
      if (err) {
        // Print error for further debugging
        console.log("Error retrieving data. " + err.stack);
        // Stop executing callback if an error occurs
        return;
      }
      // Make sure there is at least one row, an error isn't thrown when nothing comes back
      if (results && results.length > 0) {
        // Get the name of the table selected
        var name = getName();
        // If the client is trying to view the subjects table send the name, number of tasks, final mark and course completion percentage
        if (name == "subjects") {
          // Loop over all the found subjects for the account
          for (var i = 0; i < results.length; i++) {
            var name = results[0].name;
            // Get all tasks for the subject from the same account
            mysql.connection.query("SELECT * FROM tasks WHERE account_id = ? AND subject = ?", [account, name], function (err, results) {
              if (results && results.length > 0) {
                var taskCount = results.length;
                // Get course completion percentage by adding up all of the weightings of the tasks for the subject
                var courseCompletion = 0;
                for (var n = 0; n < results.length; n++) {
                  courseCompletion += results[n].weighting;
                }
                // Get final mark by adding the mark divided by the weighting divided by course completion
                var finalMark = 0;
                for (var n = 0; n < results.length; n++) {
                  finalMark += results[n].mark * (results[n].weighting / courseCompletion);
                }
                // Add the values to the dataToSend array
                dataToSend = [name, taskCount, finalMark, courseCompletion];
                socket.emit("ne", dataToSend);
              } else {
                // No tasks under this subject so far, send 0 as values
                dataToSend = [name, 0, 0, 0];
                socket.emit("ne", dataToSend);
              }
            });
          }
        } else if (name == "tasks") {

        }
      }
    });
  });

  // User wants to create/delete tasks/subjects
  socket.on('uv', function (data) {
    // Check if the socket identifier has a client signed in with it
    if (!sessions.hasOwnProperty(socket.id)) {
      return;
    }
    var account = sessions[socket.id];
    // Type of operation that the client wants to perform
    var type = data.type;
    // Choose what the user wants to update
    if (type == "c_subject") {
      // update all financial values
      new update().UpdateValues(socket, account);
    } else if (type == "c_task") {
      // update money column of financial table
      if (!isNaN(parseInt(data.money, 10))) {
        new update().UpdateMoney(socket, account, parseInt(data.money, 10));
      }
    } else if (type == "d_subject") {
      // Create an employee in the employees table
      new update().CreateEmployee(socket, account, data);
    }
    else if (type == "d_task") {
      // Delete employee ID row from employees table
      new update().DeleteEmployee(socket, account, parseInt(data.employeeID, 10));
    }
  });
});

// Allow everything in the ./public directory to be viewed by clients
app.use(express.static(path.join(__dirname, 'public')));

// Use manager.html as the homepage
app.get('/', function (req, res) {
  res.sendFile(__dirname + '\\public\\manager.html');
});

// Start the HTTP server listening on port 80
http.listen(app.get('port'), app.get('ip'), function () {
  console.log('Manager server started on port: ' + app.get('port'));
});

module.exports = app;