// utils.js
const { exec } = require('child_process');

function execPromise(command, options) {
  return new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${stderr}`);
        reject(err);
      }
      console.log(`Output: ${stdout}`);
      resolve(stdout);
    });
  });
}

module.exports = { execPromise };
