/*
 Class that handles the MySQL connection and encryption/decryption dependencies
 */

// Use the MySQL module
var mysql = require('mysql');

// Use filesystem and path for loading the sql for database generation
var fs = require("fs");

// Cryptography settings
var crypto = require('crypto'),
  algorithm = 'aes-256-ctr',
  password = 'ydHtxKBc42t7cM86';

// Sets the MySQL schema up for the database
var setup = function () {
  // Connection settings for checking whether the database exists or not
  var connection = mysql.createConnection(
    {
      // Openshift is the host that is hosting the app, use the environment variables from them, otherwise default to local ones
      host: process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
      port: process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
      user: process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'manager',
      password: process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'password',
      // Allow usage of multiple statements for using the database updater
      multipleStatements: true
    }
  );
  // Check if the database exists already
  connection.query('SHOW DATABASES LIKE "manager"', function(err, rows) {
    // An unexpected error occurred here, shut down the application as database may not have been created
    if (err) {
      // Exit the process with a failure code
      throw err;
    }
    // If no error check if no rows exist
    if (rows.length == 0) {
      // Read sql generation statements from the DatabaseGenerator.sql file
      fs.readFile(__dirname + "/DatabaseGenerator.sql", "utf-8", function (err, data) {
        // Throw an error if the file cannot be read
        if (err) {
          throw err;
        }
        // Query mysql using the contents of the .sql file
        connection.query(data, function(err, rows) {
          // Throws an error if MySQL encounters an error
          if (err) {
            throw err;
          }
          // Otherwise log that a new database was created
          console.log("The 'manager' database was created.");
        });
      });
    } else {
      // Log that it has already been created
      console.log("The database has already been set up.");
    }
  });
};

// Default connection pool and its settings
var connection = mysql.createPool(
  {
    // Openshift is the host that is hosting the app, use the environment variables from them, otherwise default to local ones
    host: process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
    port: process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
    user: process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'manager',
    password: process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'password',
    database: "manager"
  }
);

// Called on receiving data from the mysql database
connection.getConnection(function (err, connection) {
  // If an error occurs, recycle the connection
  if (connection) {
    connection.release();
  }
});

// Convert hex to string
function hexToString(hex) {
  var bytes = [],
    str;
  // Loop over all characters in the hex
  for (var i = 0; i < hex.length - 1; i += 2) {
    // Convert hex character to a character code
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  // Convert character codes to a string
  str = String.fromCharCode.apply(String, bytes);
  return str;
}

// Decryption Method
var decrypt = function (text) {
  text = hexToString(text);
  try {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'string', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }
  catch (e) {
    return;
  }
};

// Encryption method
var encrypt = function (text) {
  var cipher = crypto.createCipher(algorithm, password);
  var encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

module.exports.connection = connection;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
module.exports.setup = setup;