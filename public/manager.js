/**
 * Controls login, register and all manager components
 */

// Create socket and connect
var socket = io.connect();

// Active page
var pageName = "";

// Socket listener for errors
socket.on('err', function(data) {
  CancelUI();
  content.innerHTML += '<br><p>' + data.error + '</p>';
});

// Socket listener for registering
socket.on('rs', function(data) {
  CancelUI();
  content.innerHTML += '<br><p>You have successfully registered.</p>';
});

// Socket listener for signing in
socket.on('ls', function(data) {
  content.innerHTML = '<br><p>You have successfully signed in.</p>';
  content.innerHTML += '<br><p>Retrieving Data...</p>';
  // Request the financial table
  socket.emit('rt', {name: "financial"});
  pageName = "financial";
});

// Socket listener for a new table
socket.on('nt', function(data) {
  var html = "<table>";
  //JSON.parse(data);
  console.log(data);
  data.forEach(function(elem) {
    html+= "<tr>";
    elem.forEach(function(info) {
      if (!info) {
        html += "<th> </th>";
      } else {
        html += "<th>" + info + "</th>";
      }
    });
    html += "</tr>";
  });
  html += "</table>";
  content.innerHTML = html;
  CreateButtons();
});

// Get and set main content area
var content = document.getElementById('content');
content.innerHTML = "<button onclick='SignInUI()'>Sign In</button>";
content.innerHTML += "<button onclick='RegisterUI()'>Register</button>";

// RegisterUI function opens registration panel
var RegisterUI = function() {
  content.innerHTML = "<h1>Registration</h1><br><br>";
  content.innerHTML += '<p>Username:</p><br><input type="text" id="username" value=""><br>';
  content.innerHTML += "<p>Username must be less than 24 characters long.</p><br><br>";
  content.innerHTML += '<p>Password:</p><br><input type="password" id="password" value=""><br>';
  content.innerHTML += "<p>Password must be between 6 and 16 characters long.</p><br><br>";
  content.innerHTML += "<button onclick='Register()'>Register</button>";
  content.innerHTML += "<button onclick='CancelUI()'>Cancel</button>";
};

// SignInUI function opens login panel
var SignInUI = function() {
  content.innerHTML = "<h1>Sign In</h1><br><br>";
  content.innerHTML += '<p>Username:</p><br><input type="text" id="username" value=""><br><br>';
  content.innerHTML += '<p>Password:</p><br><input type="password" id="password" value=""><br><br>';
  content.innerHTML += "<button onclick='SignIn()'>Sign In</button>";
  content.innerHTML += "<button onclick='CancelUI()'>Cancel</button>";
};

// On cancel ui
var CancelUI = function () {
  content.innerHTML = "<button onclick='SignInUI()'>Sign In</button>";
  content.innerHTML += "<button onclick='RegisterUI()'>Register</button>";
};

// Register opens a connection with the server and registers
var Register = function() {
  var data = {username: document.getElementById("username").value, password: document.getElementById("password").value};
  socket.emit('register', data);
};

// SignIn opens a connection with the server and logs in
var SignIn = function() {
  var data = {username: document.getElementById("username").value, password: document.getElementById("password").value};
  socket.emit('login', data);
};

// Update Values, updates values for the financial
var UpdateValues = function() {
  socket.emit("uv", {});
};

var CreateButtons = function() {
  if (pageName == "financial") {
    content.innerHTML += "<button onclick='UpdateValues()'>Update Values</button><br>";
    content.innerHTML += '<p>Money:</p><input type="number" id="money" value="1000">';
    content.innerHTML += "<button onclick='UpdateMoney()'>Update Money</button>";
  }
};