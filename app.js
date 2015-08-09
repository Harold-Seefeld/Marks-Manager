/*
 Class that handles all client connections and the connections between the database
 */

// Requirements
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MySQL = require('./modules/MySQLHandler');
var path = require('path');

// Tracking variables
var searchingIDs = [];
var searchingIDsSockets = [];

// Config Variables
var validTables = ["financial", "employees", "managers", "products", "branches", "notes"];
var tableNames = ["finance", "employees", "managers", "products", "branches", "notes"];

io.on('connection', function(socket){
  // User wants to log in
  socket.on('login', function(data) {
    var password = data.password;
    var username = data.username;
    // Check if lengths are adequate
    if (password.length < 6 || password.length > 16 || username.length > 24) {
      socket.emit("err", {error: "Invalid username or password."});
    }
    // Remove salt from encrypted string
    password += username.toLowerCase();
    // Get account with that information
    MySQL.connection.query("SELECT * FROM accounts WHERE username = ?" , [username] , function(err,results)
    {
      if (err) {
        socket.emit("err", {error: "Invalid username or password."});
      }
      else if (results.length > 0 && results[0].password != undefined &&  password == MySQL.decrypt(results[0].password))
      {
        socket.emit("ls", {});
        // Add session
        searchingIDs.push(results[0].account_id);
        searchingIDsSockets.push(socket.id);
      }
      else
      {
        socket.emit("err", {error: "Invalid username or password."});
      }
    });
  });

  // User wants to register
  socket.on('register', function(data) {
    var password = data.password;
    var username = data.username;
    // Check if lengths are adequate
    if (!password || !username || password.length < 6 || password.length > 16 || username.length > 24) {
      socket.emit("invalid");
    }
    // Encrypt password using username as salt
    password = MySQL.encrypt(password + username.toLowerCase());
    // Insert registration values into table
    MySQL.connection.query("INSERT INTO accounts (username, password) VALUES (?, ?)", [username, password], function(error, success)
      {
        if (error)
        {
          if (error.stack) {
            if (error.stack.indexOf("username") > -1) {
              socket.emit("err", {error:'Username already exists!'});
            } else {
              socket.emit("err", {error:"error"});
            }
          } else {
            socket.emit("err", {error:"error"});
          }
        }
        else
        {
          socket.emit("rs", {});
        }
      });
  });

  // Socket disconnected
  socket.on('disconnect', function () {
    // Delete socket and id pair from server
    if (searchingIDsSockets.indexOf(socket.id) > -1) {
      searchingIDs.splice(searchingIDsSockets.indexOf(socket.id));
      searchingIDsSockets.splice(searchingIDsSockets.indexOf(socket.id));
    }
  });

  // User wants to load a table
  socket.on('rt', function(data) {
    console.log("Requested table: " + data.name);
    // Check if valid socket
    if (searchingIDsSockets.indexOf(socket.id) == 1) {
      return;
    }
    // Declare variables
    var name = data.name;
    var account = searchingIDs[searchingIDsSockets.indexOf(socket.id)];
    var info = [];
    // Check if valid table name
    if (validTables.indexOf(name) == -1) {
      return
    } else {
      name = tableNames[validTables.indexOf(name)];
    }
    // Set column names
    if (name == "finance") {
      info.push(["money", "gross_income", "net_income", "expenses","invested"]);
    } else if (name == "employees") {
      info.push(["first_name", "last_name", "salary", "wage", "hours", "manager", "position", "notes"]);
    } else if (name == "notes") {
      info.push(["note_id", "note"]);
    } else {
      return;
    }
    // Query MySQL for the data
    MySQL.connection.query("SELECT " + "? " + (Array(info[0].length).join(", ?")) + " FROM " + name + " WHERE account_id = ?" , info[0].concat([account]) , function(err,results)
    {
      if (err) {
        // Print error for further debugging
        console.log("Error retrieving data. " + err.stack);
      }
      else
      {
        // Push results to info array
        info.push(results);
        // Add empty row to results
        info.push(Array(info[0].length));
        socket.emit("nt", info);
      }
    });
  });

  // User wants to update the financial window
  socket.on('uv', function(data) {

  });
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '\\public\\manager.html');
});

app.use(function(req, res) {
  res.send("Error: Not Found");
});

http.listen(80, function(){
  console.log('Manager server started on port 80.');
});

module.exports = app;