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

// Socket listener for updates to tables
socket.on('uv', function(data) {
  // Request the updated table
  socket.emit('rt', {name: data.table});
  pageName = data.table;
});

// Socket listener for a new table
socket.on('nt', function(data) {
  var html = "<table>";
  data.forEach(function(elem) {
    html+= "<tr>";
    elem.forEach(function(info) {
      if (info == null) {
        html += "<th> </th>";
      } else {
        html += "<th>" + info.toString().replace("_", " ") + "</th>";
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
var UpdateValues = function(data) {
  // Data contains the type of update and any other necessary values
  socket.emit("uv", data);
};

// Function to request a table
var RequestTable = function(name) {
  socket.emit('rt', {name: name});
  pageName = name;
};

var CreateButtons = function() {
  var html = "";
  if (pageName == "financial") {
    html += "<br><table><tr><th><button onclick='UpdateValues({type: \"f_all\"})'>Update Values</button></th></tr></table><br>";
    html += "<table><tr><th><button onclick='UpdateValues({type: \"f_money\", money: document.getElementById(\"money\").value})'>Update Money</button></th>";
    html += '<th><input type="number" id="money" value="1000"></th></tr></table>';
    content.innerHTML += html;
  }
  else if (pageName == "employees") {
    // Create Employee Creation Inputs
    html += '<br><table><tr><th>Employee</th><th>Values</th></th>';
    html += '<tr><th>First Name:</th><th><input type="text" id="first_name" value=""></th></tr>';
    html += '<tr><th>Last Name:</th><th><input type="text" id="last_name" value=""></th></tr>';
    html += '<tr><th>Salary:</th><th><input type="number" id="salary" value=""></th></tr>';
    html += '<tr><th>Wage:</th><th><input type="number" id="wage" value=""></th></tr>';
    html += '<tr><th>Hours:</th><th><input type="number" id="hours" value=""></th></tr>';
    html += '<tr><th>Manager:</th><th><input type="text" id="manager" value=""></th></tr>';
    html += '<tr><th>Position:</th><th><input type="text" id="position" value=""></th></tr>';
    html += '<tr><th>Notes:</th><th><input type="text" id="notes" value=""></th></tr>';
    html += "<tr><th><button onclick='UpdateValues({type: \"e_create\", first_name: document.getElementById(\"first_name\").value, " +
      "last_name: document.getElementById(\"last_name\").value, salary: document.getElementById(\"salary\").value, wage: document.getElementById(\"wage\").value, " +
      "hours: document.getElementById(\"hours\").value, manager: document.getElementById(\"manager\").value, position: document.getElementById(\"position\").value, " +
      "notes: document.getElementById(\"notes\").value})'>Create Employee</button></tr></th>";
    html += '</table><br>';
    content.innerHTML += html;
    // Delete employee ID Button and Input
    html = "<table><tr><th><button onclick='UpdateValues({type: \"e_delete\", employeeID: document.getElementById(\"deleteID\").value})'>Delete Employee ID</button></th>";
    html += '<th><input type="number" id="deleteID" value="0"></th></tr></table>';
    content.innerHTML += html;
  }
};