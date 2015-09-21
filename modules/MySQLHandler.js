/*
 Class that handles the MySQL connection and encryption/decryption dependencies
 */

// Use the MySQL module
var mysql = require('mysql');

// Cryptography settings
var crypto = require('crypto'),
  algorithm = 'aes-256-ctr',
  password = 'ydHtxKBc42t7cM86';

// Connection settings
var connection = mysql.createPool(
  {
    // Openshift is the host that is hosting the app, use the environment variables from them, otherwise default to local ones
    host: process.env.OPENSHIFT_MYSQL_DB_HOST || 'localhost',
    port: process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
    user: process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'manager',
    password: process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'Keep the chicken open',
    database: 'manager'
  }
);

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