/*
 Class that handles all client connections and the connections between the database
 */

// Requirements
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var MySQL = require('./modules/MySQLHandler');

// Tracking variables
var searchingIDs = [];
var searchingIDsSockets = [];

io.on('connection', function(socket){
  socket.on('login', function(data) {
    var password = data.password;
    var username = data.username;
    // Check if lengths are adequate
    if (password.length < 6 || password.length > 16 || username.length > 24) {
      socket.emit("invalid");
    }
    // Get account with that information
    MySQL.connection.query("SELECT * FROM br_account WHERE username = ?" , [username] , function(err,results) //
    {
      if (err) {
        socket.emit('invalid');
      }
      if (results[0] != undefined && results[0].password != undefined &&  password == MySQL.decrypt(results[0].password))
      {
        res.send("Login Succeeded.");
        // Add session
        searchingIDs.push(results[0].account_id);
        searchingIDsSockets.push(socket.id);
      }
      else
      {
        res.send("invalid");
      }
    });
  });

  socket.on('register', function(data) {
    var password = data.password;
    var username = data.username;
    // Check if lengths are adequate
    if (password.length < 6 || password.length > 16 || username.length > 24) {
      socket.emit("invalid");
    }
    // Encrypt password using username as salt
    password = MySQL.encrypt(password + username);
    // Insert registration values into table
    MySQL.connection.query("INSERT INTO accounts (username, password) VALUES (?, ?)", [username, password], function(error, success)
      {
        if (error)
        {
          res.send("An error occurred : " + error.stack);
        }
        else
        {
          res.send("Registration Succeeded.");
        }
      });
  });

  socket.on('disconnect', function () {
    // Delete socket and id pair from server
    if (searchingIDsSockets.indexOf(socket.id) > -1) {
      searchingIDs.splice(searchingIDsSockets.indexOf(socket.id));
      searchingIDsSockets.splice(searchingIDsSockets.indexOf(socket.id));
    }
  });
});

http.listen(80, function(){
  console.log('Manager server started on port 80.');
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '\\manager.html');
  console.log(  res.sendFile(__dirname + '\\manager.html'));
});

module.exports = app;