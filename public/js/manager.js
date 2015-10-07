/**
 * Controls login, register and all manager components for the client
 */

// Create socket and connect
var socket = io.connect();

// Active table page
var pageName = "";

// Get and set main content area
var content = document.getElementById('content');

// Cache html string values for options accessible to the client
var managerSigned = "";
var managerCreateSubject = "";
var managerCreateTask = "";
var managerDeleteSubject = "";
var managerDeleteTask = "";

// Store the html used for after signing in
jQuery.get('resources/managerSigned.html', function(data) {
  managerSigned = data;
});

// Store and download the other options
jQuery.get('resources/managerCreateSubject.html', function(data) {
  managerCreateSubject = data;
});
jQuery.get('resources/managerCreateTask.html', function(data) {
  managerCreateTask = data;
});
jQuery.get('resources/managerDeleteSubject.html', function(data) {
  managerDeleteSubject = data;
});
jQuery.get('resources/managerDeleteTask.html', function(data) {
  managerDeleteTask = data;
});

// Subjects that belong to the current client
var subjects = [];

// Socket listener for errors
socket.on('err', function (data) {
  alert(data.error);
});

// Socket listener for registering
socket.on('rs', function (data) {
  alert("You have successfully registered.");
});

// Socket listener for signing in
socket.on('ls', function (data) {
  // Set the html of the area to the html used after signing in
  content.innerHTML = managerSigned;
  // Request the subjects table upon signing in
  RequestTable("subjects");
  // Request the subject creation interface on sign in
  Creator("subject");
});

// Socket listener for updates to tables
socket.on('uv', function (data) {
  // Request the updated table
  RequestTable(data.table);
  alert("Table updated successfully.");
});

// Socket listener for getting all available subjects
socket.on('as', function (data) {
  subjects = data;
});

// Socket listener for a new table
socket.on('nt', function (data) {
  // Set the table title
  var tableTitle = document.getElementById('tableTitle');
  tableTitle.innerHTML = pageName;
  // Create the table headers
  var html = "<thead><tr>";
  for (var i = 0; i < data.titles.length; i++) {
    html += "<th>" + data.titles[i] + "</th>";
  }
  html += "</tr></thead>";
  // Get the table and set the contents of it to the html
  var table = document.getElementById('table');
  table.innerHTML = html;
});

// Socket listener for a new entry in a table
socket.on('ne', function (data) {
  // Fill the table with the new values
  var html = "";
  for (var i = 0; i < data.length; i++) {
      html += "<th>" + data[i] + "</th>";
  }
  // Get the table and set the contents of it to the html
  var table = document.getElementById('table');
  table.innerHTML += html;
});

// Emits the registration details to the server
var Register = function () {
  var data = {username: document.getElementById("rUsername").value, password: document.getElementById("rPassword").value};
  socket.emit('register', data);
};

// Emits the login details to the server
var SignIn = function () {
  var data = {username: document.getElementById("sUsername").value, password: document.getElementById("sPassword").value};
  socket.emit('login', data);
};

// Function to request a table
var RequestTable = function (name) {
  if (pageName == Capitalise(name)) {
    // Don't request the same table twice to decrease server load
    return;
  }
  socket.emit('rt', {name: name});
  pageName = Capitalise(name);
};

// Function to Capitalise strings
var Capitalise = function (s)
{
  return s[0].toUpperCase() + s.slice(1);
};

// Function to generate html for the create user interfaces
var Creator = function (name) {
  // Get creator content space and set it to a variable
  var creatorSpace = document.getElementById("controller");
  // Clear current creator space
  creatorSpace.innerHTML = "";
  // Set the title for the form
  document.getElementById("controllerTitle").innerHTML = "Create " + Capitalise(name);
  if (name == "subject") {
    // Load the html for the input form for subject creation
    creatorSpace.innerHTML = managerCreateSubject;
  }
  else if (name == "task") {
    // Load the html for the input form for task creation
    creatorSpace.innerHTML = managerCreateTask;
    // Get the combobox for the subjects and fill it
    var selector = document.getElementById("subjectSelector");
    for (var i = 0; i < subjects.length; i++) {
      selector.innerHTML += "<option>" + subjects[i] + "</option>";
    }
    // If there are no subjects available, indicate that one needs to be created
    if (selector.innerHTML.length < 15) {
      alert("Please create a new subject first, no subjects currently exist.");
      // Redirect the user to the subject creation screen
      Creator("subject");
    }
  }
};

// Function called when a button is submitted from the creator user interfaces
var Create = function (name) {
  pageName = "Create " + name;
  var data = {};
  if (name == "subject") {
    data.type = "c_subject";
    data.name = $("#subjectName").val();
    socket.emit("uv", data);
  }
  else if (name == "task") {
    data.type = "c_task";
    data.subject = $("#subjectSelector").val();
    data.name = $("#tName").val();
    data.mark = $("#tMark").val();
    data.weighting = $("#tWeighting").val();
    socket.emit("uv", data);
  }
};

var Deleter = function(name) {
  pageName = "Delete " + name;
  // Get creator content space and set it to a variable
  var creatorSpace = document.getElementById("controller");
  // Clear current creator space
  creatorSpace.innerHTML = "";
  // Set the title for the form
  document.getElementById("controllerTitle").innerHTML = "Delete " + Capitalise(name);
  if (name == "subject") {
    // Load the html for the input form for subject creation
    creatorSpace.innerHTML = managerDeleteSubject;
    // Show available subjects that can be deleted in a combobox
    var selector = document.getElementById("subjectSelector");
    for (var i = 0; i < subjects.length; i++) {
      selector.innerHTML += "<option>" + subjects[i] + "</option>";
    }
  }
  else if (name == "task") {
    // Load the html for the input form for task creation
    creatorSpace.innerHTML = managerDeleteTask;
    // Get the combobox for the subjects and fill it
    var selector = document.getElementById("subjectSelector");
    for (var i = 0; i < subjects.length; i++) {
      selector.innerHTML += "<option>" + subjects[i] + "</option>";
    }
    // If there are no subjects available, indicate that one needs to be created
    if (selector.innerHTML.length < 15) {
      alert("Please create a new subject first, no subjects currently exist.");
      // Redirect the user to the subject creation screen
      Creator("subject");
    }
  }
};

// Function called when a button is submitted from the deleter user interfaces
var Delete = function (name) {
  var data = {};
  if (name == "subject") {
    data.type = "d_subject";
    data.name = $("#subjectSelector").val();
    socket.emit("uv", data);
  }
  else if (name == "task") {
    data.type = "d_task";
    data.subject = $("#subjectSelector").val();
    data.name = $("#tName").val();
    socket.emit("uv", data);
  }
};