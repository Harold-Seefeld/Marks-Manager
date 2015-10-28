/*
 Main class of the program:
 - Sets the server properties (ip, port)
 - Starts listening for requests on socket.io and http
 - Serves all static files in the './public' directory
 - Assigns the home, about and manager pages to certain locations on the server
 - Handles registration
 - Handles signing in
 - Handles the requesting of tables (subjects, tasks) from the client
 - Transfers the request for updating a table to the 'Updater' class
 */

// Set up the protocols
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Get all dependencies required to run the main class
var mysql = require('./modules/MySQLHandler');
var path = require('path');
var events = require('./modules/SocketEvents');
var creator = require('./modules/Updater');

// Set port and ip variables for the server address, first trying to get values from the openshift host
app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 80);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "localhost");

// Tracking variable for sessions and their respective clients
var sessions = {};

// Allow socket.io connections to be made from the client, which in turn calls this function
io.on('connection', function (socket) {
  // User attempts to sign in
  socket.on(events.Input.LOGIN, function (data) {
    var password = data.password;
    var username = data.username;
    // Check if input lengths are adequate for the password and the username
    if (!password || !username || password.length < 6 || password.length > 16 || username.length > 16 || username.length < 4) {
      socket.emit(events.Output.ERROR, {error: "Invalid username or password."});
      // Don't execute any further statements if there are invalid values
      return;
    }
    // Add salt to password for decryption later
    password += username.toLowerCase();
    // Get account with that information
    mysql.connection.query("SELECT * FROM accounts WHERE username = ?", [username], function (err, results) {
      if (err) {
        socket.emit(events.Output.ERROR, {error: "Invalid username or password."});
      }
      else if (results.length > 0 && results[0].password != undefined && password == mysql.decrypt(results[0].password)) {
        socket.emit(events.Output.LOGIN_SUCCEEDED, {});
        // Add session and account id to the tracking variable
        sessions[socket.id] = results[0].account_id;
        // Send users subjects
        mysql.connection.query("SELECT name FROM subjects WHERE account_id = ?", [results[0].account_id], function (err, results) {
          // Add all subjects to an array
          var subjects = [];
          for (var i = 0; i < results.length; i++) {
            subjects.push(results[i].name);
          }
          // Emit the subjects array to the client
          socket.emit(events.Output.ALL_SUBJECTS, subjects)
        });
      }
      else {
        socket.emit(events.Output.ERROR, {error: "Invalid username or password."});
      }
    });
  });

  // User wants to register
  socket.on(events.Input.REGISTER, function (data) {
    var password = data.password;
    var username = data.username;
    // Check if lengths are adequate
    if (!password || !username || password.length < 6 || password.length > 16 || username.length > 16 || username.length < 4) {
      socket.emit(events.Output.ERROR, {error: "Invalid values entered!"});
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
            socket.emit(events.Output.ERROR, {error: 'Username already exists!'});
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
      else {
        socket.emit(events.Output.REGISTRATION_SUCCEEDED, {});
      }
    });
  });

  // Event called when a client disconnects
  socket.on('disconnect', function () {
    // Delete socket and id pair from the server if they are authenticated
    if (sessions.hasOwnProperty(socket.id)) {
      delete sessions[socket.id];
    }
  });

  // Event called when the client wants to load a table
  socket.on(events.Input.REQUEST_TABLE, function (data) {
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
    socket.emit(events.Output.NEW_TABLE, dataToSend);
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
        var type = getName();
        // If the client is trying to view the subjects table send the name, number of tasks, final mark and course completion percentage
        if (type == "subjects") {
          // Add all subjects to an array
          var subjects = [];
          for (var i = 0; i < results.length; i++) {
            subjects.push(results[i].name);
          }
          // Emit the subjects array to the client
          socket.emit(events.Output.ALL_SUBJECTS, subjects);
          // Loop over all the found subjects for the account
          results.forEach(function(result) {
            // Set the task name
            var name = result.name;
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
                // Round final mark to 1 decimal place
                finalMark = Math.round(finalMark * 10) / 10;
                // Add the values to the dataToSend array
                dataToSend = [name, taskCount, finalMark, courseCompletion];
                socket.emit(events.Output.NEW_TABLE_ENTRY, dataToSend);
              } else {
                // No tasks under this subject so far, send 0 as values for the subject name
                dataToSend = [name, 0, 0, 0];
                socket.emit(events.Output.NEW_TABLE_ENTRY, dataToSend);
              }
            });
          });
        } else if (type == "tasks") {
          // Loop over all the found tasks for the account
          results.forEach(function(result) {
            var subject = result.subject;
            var name = result.name;
            var mark = result.mark;
            var weighting = result.weighting;
            // Add the values to the dataToSend array
            dataToSend = [subject, name, mark, weighting];
            socket.emit(events.Output.NEW_TABLE_ENTRY, dataToSend);
          });
        }
      }
    });
  });

  // User wants to create/delete tasks/subjects
  socket.on(events.Input.UPDATE_VALUES, function (data) {
    // Check if the socket identifier has a client signed in with it
    if (!sessions.hasOwnProperty(socket.id)) {
      return;
    }
    var account = sessions[socket.id];
    // Type of operation that the client wants to perform
    var type = data.type;
    // Choose what the user wants to creator
    if (type == "c_subject") {
      // Add the subject passing the name variable
      creator.AddSubject(socket, account, data.name.toString().trim());
    } else if (type == "c_task") {
      // Add the task passing the subject, name, mark and weighting
      creator.AddTask(socket, account, data.subject.toString().trim(), data.name.toString().trim(), data.mark, data.weighting);
    } else if (type == "d_subject") {
      // Delete the subject and all tasks linked to it
      creator.DeleteSubject(socket, account, data.name);
    }
    else if (type == "d_task") {
      // Delete the task from the task table
      creator.DeleteTask(socket, account, data.subject, data.name);
    }
  });
});

// Allow everything in the ./public directory to be viewed by clients
app.use(express.static(path.join(__dirname, 'public')));

// Use manager.html as the homepage
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/manager.html');
});

// Start the HTTP server listening on port 80
http.listen(app.get('port'), app.get('ip'), function () {
  console.log('Manager server started on port: ' + app.get('port'));
});

module.exports = app;