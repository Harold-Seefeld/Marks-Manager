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
var updater = require('./modules/Updater');

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
        mysql.connection.query("SELECT subject, name, mark, weighting, date_due FROM tasks WHERE account_id = ?", [results[0].account_id], function (err, results) {
          // Add all tasks to an array
          var assessments = [];
          for (var i = 0; i < results.length; i++) {
            assessments.push({});
            assessments[i].subject = results[i].subject;
            assessments[i].name = results[i].name;
            assessments[i].mark = results[i].mark;
            assessments[i].weighting = results[i].weighting;
            assessments[i].dateDue = results[i].date_due;
          }
          // Emit the subjects array to the client
          socket.emit(events.Output.ALL_TASKS, assessments)
        });
      }
      else {
        socket.emit(events.Output.ERROR, {error: "Invalid username or password."});
      }
    });
  });

  // User attempts to register
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
  socket.on(events.Input.REQUEST_ASSESSMENTS, function (data) {
    // Check if the socket identifier has a client signed in with it
    if (!sessions.hasOwnProperty(socket.id)) {
      return;
    }
    var account = sessions[socket.id];
    mysql.connection.query("SELECT subject, name, mark, weighting, date_due FROM tasks WHERE account_id = ?", [account], function (err, results) {
      // Add all tasks to an array
      var assessments = [];
      for (var i = 0; i < results.length; i++) {
        assessments.push({});
        assessments[i].subject = results[i].subject;
        assessments[i].name = results[i].name;
        assessments[i].mark = results[i].mark;
        assessments[i].weighting = results[i].weighting;
        assessments[i].dateDue = results[i].date_due;
      }
      // Emit the subjects array to the client
      socket.emit(events.Output.ALL_TASKS, assessments)
    });
  });

  // User wants to create/delete tasks
  socket.on(events.Input.UPDATE_VALUES, function (data) {
    // Check if the socket identifier has a client signed in with it
    if (!sessions.hasOwnProperty(socket.id)) {
      return;
    }
    var account = sessions[socket.id];
    // Check if the user has sent all the required data
    if (!(data.subject && data.name)) {
      // Data is empty or undefined, stop executing further statements
      return;
    }
    // Type of operation that the client wants to perform
    var type = data.type;
    // Choose what the user wants to update
    if (type == "c_task") {
      if (!(data.dateDue && data.weighting)) {
        return;
      }
      updater.AddTask(socket, account, data.subject.toString().trim(), data.name.toString().trim(), data.mark, data.dateDue, data.weighting);
    }
    else if (type == "d_task") {
      updater.DeleteTask(socket, account, data.subject.toString().trim(), data.name.toString().trim());
    }
  });
});

// Allow everything in the ./public directory to be viewed by clients
app.use(express.static((process.env.OPENSHIFT_REPO_DIR || __dirname)'public'));

// Use manager.html as the homepage
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// Set help and manager pages
app.get('/help', function (req, res) {
	res.sendFile(__dirname + '/public/help.html');
});

app.get('/manager', function (req, res) {
	res.sendFile(__dirname + '/public/manager.html');
});

// Start the HTTP server listening on port 80
http.listen(app.get('port'), app.get('ip'), function () {
  console.log('Manager server started on port: ' + app.get('port'));
});

module.exports = app;