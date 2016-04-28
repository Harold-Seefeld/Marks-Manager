/*
 Class contains functions for inserting data into the MySQL server
 */
var MySQL = require('./MySQLHandler');
var events = require('./SocketEvents');
var moment = require('moment');

var Updater = {
  AddTask: function (socket, accountID, subject, name, mark, dateDue, weighting) {
    // Round the mark and the weighting to one decimal place'
		if (mark) {
			mark = Math.round(mark * 10) / 10;
		} else {
			mark = -1;
		}
    weighting = Math.round(weighting * 10) / 10;
    // Parse dateDue
    dateDue = moment(dateDue, "DD/MM/YYYY");
    if (!dateDue.isValid()) {
      return;
    }
    // valueOf() gets the number of milliseconds since the Unix Epoch
    dateDue = moment(dateDue).valueOf();
    // unix() gets the unix timestamp
    dateDue = moment(dateDue).unix();
    // Insert the new assessment into the database
    MySQL.connection.query("INSERT INTO tasks (account_id, subject, name, mark, date_due, weighting) VALUES (?, ?, ?, ?, ?, ?)",
      [accountID, subject, name, mark, dateDue, weighting], function (err, results) {
        if (err) {
          // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
          console.log(err + err.stack);
        } else {
          // Update client
          socket.emit(events.Output.UPDATED_VALUES, {table: "tasks"});
        }
      });
  },
  DeleteTask: function (socket, accountID, subject, name) {
    // Delete the employeeID from table, making sure the id belongs to the account
    MySQL.connection.query("DELETE FROM `tasks` WHERE `account_id`=? AND `subject`=? AND `name`=?",
      [accountID, subject, name], function (err, results) {
        if (err) {
          // Print out the error for further debugging (error is not expected unless there is something wrong with the database)
          console.log(err + err.stack);
        } else {
          if (results.affectedRows != 1) {
            // No deletion occurred (task name must be missing), send that the task doesn't exist
            socket.emit(events.Output.ERROR, {error: "The task and subject combination does not exist."});
          } else {
            // Emit to the client that the table has been updated
            socket.emit(events.Output.UPDATED_VALUES, {table: "tasks"});
          }
        }
      });
  }
};

module.exports = Updater;