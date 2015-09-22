/*
 Class contains functions for inserting data into the MySQL server
 */
var MySQL = require('./MySQLHandler');

var Creator = {
  AddSubject: function (socket, accountID, name) {
    // Insert or creator the mysql financial table
    MySQL.connection.query("INSERT INTO subjects (account_id, name) VALUES (?, ?) ", [accountID, name], function (err, results) {
      if (err) {
        // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
        console.log(err + err.stack);
      } else {
        // Update client
        socket.emit("uv", {table: "subjects"});
      }
    });
  },
  AddTask: function (socket, accountID, subject, name, mark, weighting) {
    // Round the mark and the weighting to one decimal place
    mark = Math.round(mark * 10) / 10;
    weighting = Math.round(weighting * 10) / 10;
    // Insert or creator the mysql financial table
    MySQL.connection.query("INSERT INTO tasks (account_id, subject, name, mark, weighting) VALUES (?, ?, ?, ?, ?) ",
      [accountID, subject, name, mark, weighting], function (err, results) {
        if (err) {
          // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
          console.log(err + err.stack);
        } else {
          // Update client
          socket.emit("uv", {table: "tasks"});
        }
      });
  },
  DeleteSubject: function (socket, accountID, subject) {
    // Delete the subject from the account
    MySQL.connection.query("DELETE FROM subjects WHERE `account_id`=? AND `name`=?", [accountID, subject], function (err, results) {
      if (err) {
        // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
        console.log(err + err.stack);
      } else {
        // Delete all tasks that belong to the subject
        MySQL.connection.query("DELETE FROM tasks WHERE `account_id`=? AND `subject`=?", [accountID, subject], function (err, results) {
          if (err) {
            // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
            console.log(err + err.stack);
          } else {
            // Emit to the client that the table has been updated
            socket.emit("uv", {table: "subjects"});
          }
        });
      }
    });
  },
  DeleteTask: function (socket, accountID, subject, name) {
    // Delete the employeeID from table, making sure the id belongs to the account
    console.log(subject, name);
    MySQL.connection.query("DELETE FROM `tasks` WHERE `account_id`=? AND `subject`=? AND `name`=?",
      [accountID, subject, name], function (err, results) {
        if (err) {
          // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
          console.log(err + err.stack);
        } else {
          if (results.affectedRows != 1) {
            // No deletion occurred (task name must be missing), send that the task doesn't exist
            socket.emit("err", {error: "The task and subject combination does not exist."});
          } else {
            // Emit to the client that the table has been updated
            socket.emit("uv", {table: "tasks"});
          }
        }
      });
  }
};

module.exports = Creator;