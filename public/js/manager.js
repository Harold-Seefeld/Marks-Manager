/**
 * Controls login, register and all manager components for the client
 */

// Create socket and connect
var socket = io.connect();

// Active table page (subjects by default)
var viewPageName = "subjects";
// Active manage page (create by default)
var managePageName = "create";

// Get and set main content area
var content = document.getElementById('content');

// Set socket events
var events = {
  Output: {
    REQUEST_ASSESSMENTS: "ra",
    LOGIN: "l",
    REGISTER: "r",
    UPDATE_VALUES: "uv"
  },
  Input: {
    LOGIN_SUCCEEDED: "ls",
    REGISTRATION_SUCCEEDED: "rs",
    ERROR: "err",
    UPDATED_VALUES: "uv",
    ALL_TASKS: "at"
  }
};

// Cache html string values for options accessible to the client
var managerSignedHTML = "";
var managerCreateTaskHTML = "";
var managerDeleteTaskHTML = "";

// Store the html used for after signing in
jQuery.get('resources/managerSigned.html', function(data) {
  managerSignedHTML = data;
});

// Store and download the manage options
jQuery.get('resources/managerCreateTask.html', function(data) {
  managerCreateTaskHTML = data;
});
jQuery.get('resources/managerDeleteTask.html', function(data) {
  managerDeleteTaskHTML = data;
});

// Assessment tasks that belong to the current client
var assessments = [];
// Subjects that belong to the current client
var subjects = [];

// Socket listener for errors
socket.on(events.Input.ERROR, function (data) {
  alert(data.error);
});

// Socket listener for registering
socket.on(events.Input.REGISTRATION_SUCCEEDED, function (data) {
  alert("You have successfully registered.");
});

// Socket listener for signing in
socket.on(events.Input.LOGIN_SUCCEEDED, function (data) {
  // Set the html of the area to the html used after signing in
  content.innerHTML = managerSignedHTML;
  // Request the subjects table upon signing in
  RequestAssessments();
  //Create the subject creation interface on sign in
  Creator();
});

// Socket listener for updates to tables
socket.on(events.Input.UPDATED_VALUES, function (data) {
  // Request the updated table
  RequestAssessments();
  alert("Table updated successfully.");
});

// Socket listener for getting all available subjects
socket.on(events.Input.ALL_TASKS, function (data) {
  assessments = data;
  // Set subjects
  subjects = [];
  assessments.forEach(function(assessment) {
    if (subjects.indexOf(assessment.subject) == -1) {
      subjects.push(assessment.subject);
    }
  });
  ViewOption(viewPageName);
  // Update the manage section
  if (managePageName == "create") {
    Creator();
  } else {
    Deleter();
  }
});

// Emits the registration details to the server
var Register = function () {
  var data = {username: document.getElementById("rUsername").value, password: document.getElementById("rPassword").value};
  socket.emit(events.Output.REGISTER, data);
};

// Emits the login details to the server
var SignIn = function () {
  var data = {username: document.getElementById("sUsername").value, password: document.getElementById("sPassword").value};
  socket.emit(events.Output.LOGIN, data);
};

// Function to request a table
var RequestAssessments = function () {
  socket.emit(events.Output.REQUEST_ASSESSMENTS);
};

// Creates the headers for a new table
var ShowTable = function (data) {
  // Set the table title
  var tableTitle = document.getElementById('tableTitle');
  tableTitle.innerHTML = Capitalise(viewPageName);
  // Create the table headers
  var html = "<thead><tr>";
  for (var i = 0; i < data.length; i++) {
    html += "<th>" + data[i] + "</th>";
  }
  html += "</tr></thead>";
  // Get the table and set the contents of it to the html
  var table = document.getElementById('table');
  table.innerHTML = html;
};

// Function to Capitalise strings
var Capitalise = function (s)
{
  return s[0].toUpperCase() + s.slice(1);
};

var ViewOption = function(name) {
  viewPageName = name;
  // Remove any active instance of the calendar
  var calendar = $("#calendar").html("");
  if (name == "subjects") {
    ShowTable(["Name", "Number of Tasks", "Final Mark (%)", "Course Completion (%)"]);
    // Loop over all the found subjects
    subjects.forEach(function(subject) {
      // Tasks is used for tracking all assessments within a given subject
      var tasks = [];
      for (var i = 0; i < assessments.length; i++) {
        if (assessments[i].subject == subject) {
          tasks.push(assessments[i]);
        }
      }
      // Set the subject name
      var name = subject;
      // Get the count of tasks for the subject
      var taskCount = tasks.length;
      // Get course completion percentage by adding up all of the weightings of the tasks for the subject
      var courseCompletion = 0;
      for (var n = 0; n < tasks.length; n++) {
        courseCompletion += tasks[n].weighting;
      }
      // Get final mark by adding the mark divided by the weighting divided by course completion
      var finalMark = 0;
      for (var n = 0; n < tasks.length; n++) {
        finalMark += tasks[n].mark * (tasks[n].weighting / courseCompletion);
      }
      // Round final mark to 1 decimal place
      finalMark = Math.round(finalMark * 10) / 10;
      // Add the values to the dataToSend array
      NewEntry([name, taskCount, finalMark, courseCompletion]);
    });
  }
  else if (name == "tasks") {
    ShowTable(["Subject", "Name", "Mark (%)", "Weighting (%)", "Date Due"]);
    // Loop over all the found tasks
    assessments.forEach(function(result) {
      var subject = result.subject;
      var name = result.name;
      var mark = result.mark;
      var weighting = result.weighting;
      var dateDue = moment.unix(result.dateDue).format("DD/MM/YYYY");
      // Add an entry to the table being displayed
      NewEntry([subject, name, mark, weighting, dateDue]);
    });
  }
  else if (name == "calendar") {
    $("#tableTitle").html("Calendar");
    $("#table").html("");
    // Display the calendar
    $("#calendar").monthly({
      stylePast: true,
      mode: 'event',
      xmlString: GenerateMonthyAssessmentXML()
    });
  }
};

// Function to show html for the create task interface
var Creator = function () {
  managePageName = "create";
  // Get updater content space and set it to a variable
  var creatorSpace = document.getElementById("controller");
  // Set the title for the form
  document.getElementById("controllerTitle").innerHTML = "Create Assessment";
  // Show the html for the input form for task creation
  creatorSpace.innerHTML = managerCreateTaskHTML;
  // Allow the date picker to be interacted with
  $('#datePicker').datetimepicker({
    format: "DD/MM/YYYY"
  });
};

// Function called when the create button is submitted from the updater user interfaces
var Create = function () {
  var data = {};
  data.type = "c_task";
  data.subject = $("#tSubject").val();
  data.name = $("#tName").val();
  data.mark = $("#tMark").val();
  data.weighting = $("#tWeighting").val();
  data.dateDue = $("#datePicker").val();
  socket.emit("uv", data);
};

// Shows html for the delete task interface
var Deleter = function() {
  managePageName = "delete";
  // Get updater content space and set it to a variable
  var creatorSpace = document.getElementById("controller");
  // Set the title for the form
  document.getElementById("controllerTitle").innerHTML = "Delete Assessment";
  // Show the html for the input form for task deletion
  creatorSpace.innerHTML = managerDeleteTaskHTML;
  // Fill the subject selection panel
  var html = "";
  for (var i = 0; i < subjects.length; i++) {
    html += "<option value='" + subjects[i] + "'>" + subjects[i] + "</option>";
  }
  // Get the table and set the contents of it to the html
  var subjectSelector = document.getElementById('subjectSelector');
  subjectSelector.innerHTML = html;
  // Update the task selector field
  UpdateTaskSelector();
};

// Update the task selector on the delete menu
var UpdateTaskSelector = function () {
  // Get the selected subject
  var subjectSelected = $('#subjectSelector').val();
  // Fill the task selection panel
  var html = "";
  for (var i = 0; i < assessments.length; i++) {
    if (subjectSelected == assessments[i].subject) {
      html += "<option value='" + assessments[i].name + "'>" + assessments[i].name + "</option>";
    }
  }
  // Get the table and set the contents of it to the html
  var taskSelector = document.getElementById('taskSelector');
  taskSelector.innerHTML = html;
};

// Called when a button is submitted from the delete interface
var Delete = function () {
  var data = {};
  data.type = "d_task";
  data.subject = $("#subjectSelector").val();
  data.name = $("#taskSelector").val();
  socket.emit("uv", data);
};

// Puts in a row into a table
var NewEntry = function (data) {
  // Create table row html using the values
  var html = "";
  for (var i = 0; i < data.length; i++) {
    html += "<th>" + data[i] + "</th>";
  }
  // Get the table and set the contents of it to the html
  var table = document.getElementById('table');
  table.innerHTML += html;
};

var GenerateMonthyAssessmentXML = function() {
  var xml = "<?xml version=\"1.0\"?><monthly>";
  for (var i = 0; i < assessments.length; i++) {
    var assessment = assessments[i];
    xml += "<event>";
    // Add ID
    xml += "<id>" + i + "</id>";
    // Add name
    xml += "<name>" + assessment.subject + ": " + assessment.name + "</name>";
    // Add date the assessment is due
    xml += "<startdate>" + moment.unix(assessment.dateDue).format("YYYY-M-DD") + "</startdate>";
    xml += "</event>";
  }
  xml += "</monthly>";
  return xml;
};