/*
 Class that creates any schemas and settings required by the program
 */

// Start performing the setup
console.log("Performing setup...");
// End set up automatically after 1 minute (60000 milliseconds)
setTimeout(function() {
  // Exit the process
  process.exit(0);
}, 60000);
// Set up the MySQL schema "manager"
require("./modules/MySQLHandler").setup();