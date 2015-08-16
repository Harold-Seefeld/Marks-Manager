/*
 Class contains functions for updating data for MySQL
 */
var MySQL = require('./MySQLHandler');

var Update = function () {
  this.UpdateValues = function (socket, accountID) {
    var totalExpenses = 0;
    var totalIncome = 0;
    // Get expenses from employees
    MySQL.connection.query("SELECT * FROM employees WHERE account_id = ?", [accountID], function (err, results) {
      if (err) {
        // Do nothing if error
      }
      else if (results.length > 0) {
        results.forEach(function(result) {
          if (result.salary) {
            totalExpenses += result.salary;
          } else if (result.wage && result.hours) {
            // Hours per fortnight in a year
            totalExpenses += result.wage * result.hours * 26;
          }
        });
      }
    });
    // Get expenses and profits from sales
    MySQL.connection.query("SELECT * FROM products WHERE account_id = ?", [accountID], function (err, results) {
      if (err) {
        // Do nothing if error
      }
      else if (results.length > 0) {
        results.forEach(function (result) {
          if (result.price && result.units_sold) {
            // Total of gross income generated by sales
            totalIncome += result.price * result.units_sold;
          } else if (result.cost && result.units_sold) {
            // Total cost for getting the units * the units sold
            totalExpenses += results.cost * result.units_sold;
          }
        })
      }
    });
    // Delay by a second for mysql to retrieve results first
    setTimeout(function () {
      // Calculate net income
      var netIncome = totalIncome - totalExpenses;
      // Insert or update the mysql financial table
      MySQL.connection.query("INSERT INTO finance (account_id, expenses,gross_income,net_income) VALUES (?, ?,?,?) " +
        "ON DUPLICATE KEY UPDATE expenses = ?, gross_income = ?, net_income = ?", [accountID, totalExpenses, totalIncome, netIncome, totalExpenses, totalIncome, netIncome], function (err, results) {
        if (err) {
          // Do nothing if error
          console.log(err + err.stack);
        } else {
          // Update client
          socket.emit("uv", {table:"financial"});
        }
      });
    }, 1000);
  };
  this.UpdateMoney = function (socket, accountID, money) {
    MySQL.connection.query("UPDATE finance SET `money`=? WHERE account_id = ?", [money, accountID], function (err, results) {
      if (err) {
        // Do nothing if error
      }
      else {
        // Update client
        socket.emit("uv", {table:"financial"});
      }
    });
  };
  this.CreateEmployee = function (socket, accountID, data) {
    var firstName = data.first_name,
      lastName = data.last_name,
      salary = parseInt(data.salary, 10),
      wage = parseInt(data.wage, 10),
      hours = parseInt(data.hours, 10),
      manager = data.manager,
      position = data.position,
      notes = data.notes;
    // Don't proceed if vital variables are invalid or don't exist
    if (!firstName || !lastName || !(!isNaN(salary) || !(isNaN(wage) || isNaN(hours)))) {
      return;
    }
    // If values are NaN nullify them
    if (isNaN(salary)) {
      salary = null;
    } else if (isNaN(hours) || isNaN(wage)) {
      wage = null;
      hours = null;
    }
    // Insert values into employee table
    MySQL.connection.query("INSERT INTO employees (account_id, first_name, last_name, salary, wage, hours, manager, position, notes) " +
      "VALUES (?,?,?,?,?,?,?,?,?)"
      , [accountID, firstName, lastName, salary, wage, hours, manager, position, notes], function (err, results) {
      if (err) {
        // Do nothing if error
        console.log(err + err.stack);
      } else {
        // Update client
        socket.emit("uv", {table:"employees"});
      }
    });
  };
  this.DeleteEmployee = function (socket, accountID, employeeID) {
    // Check if employeeID is an integer
    if (isNaN(employeeID)) {
      return;
    }
    // Delete the employeeID from table, making sure the id belongs to the account
    MySQL.connection.query("DELETE FROM employees WHERE account_id = ? AND employee_id = ?",
      [accountID, employeeID], function (err, results) {
        if (err) {
          // Do nothing if error
          console.log(err + err.stack);
        } else {
          // Update client
          socket.emit("uv", {table:"employees"});
        }
      });
  }
};

module.exports = Update;