/*
 Class that handles the MySQL connection and encryption/decryption dependencies
 */

// MySQL module
var mysql =  require('mysql');
// Crypto module
var crypto = require('crypto'),
  algorithm = 'aes-256-ctr',
  password = 'ydHtxKBc42t7cM86';

// Connection settings
var connection =  mysql.createPool(
  {
    host :'sql6.freemysqlhosting.net',
    user : 'sql686273',
    password: 'kK7*fL8%',
    database : 'sql686273'
  });

connection.getConnection(function(err, connection) {
  // Use the connection again on error
  connection.release();
});

// Helper functions
function hexToString (hex)
{
  var  bytes = [],
    str;
  for(var i=0; i< hex.length-1; i+=2)
  {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  str = String.fromCharCode.apply(String, bytes);
  return str;
}

// Decrypt Method
var decrypt = function(text)
{
  text = hexToString(text);
  try
  {
    var decipher = crypto.createDecipher(algorithm,password);
    var dec = decipher.update(text,'string','utf8');
    dec += decipher.final('utf8');
    return dec;
  }
  catch (e)
  {
    return;
  }
};

var encrypt = function(text)
{
  //console.log("type of text : ");
  //console.log(typeof text);
  var cipher = crypto.createCipher(algorithm,password);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
};

module.exports.connection = connection;
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;