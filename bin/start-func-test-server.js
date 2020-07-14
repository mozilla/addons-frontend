/* @flow */
/* eslint-disable no-console, amo/only-log-strings */
// This starts a docker server for functional tests to access.
// The script waits for the server to start and prints some logs
// to help with debugging.

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const root = path.join(__dirname, '..');
console.log(`Working directory: ${root}`);
const containerIdFile = path.join(root, 'docker-container-id.txt');

// TODO: make these configurable when we need to start
// servers for multiple apps.
const appInstance = 'disco';
const nodeConfigEnv = 'uitests';

function logDivider(heading) {
  console.log(`${'='.repeat(35)} ${heading} ${'='.repeat(35)}`);
}

function shell(cmd, args) {
  // Execs a command as if it were part of the parent shell
  // (i.e. the output is unbuffered and is displayed in the console).
  logDivider('BEGIN shell');
  const cmdString = `${cmd} ${args.join(' ')}`;
  console.log(`Shell: ${cmdString}`);
  return new Promise((resolve, reject) => {
    const child = childProcess.spawn(cmd, args, {
      cwd: root,
    });

    child.stdout.on('data', (data) => {
      process.stdout.write(data.toString());
    });
    child.stdout.on('error', (error) => reject(error));

    child.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
    child.stderr.on('error', (error) => reject(error));

    child.on('error', (error) => reject(error));
    child.on('exit', (exitCode) => {
      logDivider('END shell');
      if (exitCode !== 0) {
        reject(new Error(
          `shell command failed: ${cmdString} (exit: ${exitCode || '[empty]'})`));
      }
      resolve();
    });
  });
}

function exec(cmd, argParts, { quiet = false } = {}) {
  const cmdString = `${cmd} ${argParts.join(' ')}`;
  if (!quiet) {
    logDivider('BEGIN exec');
    console.log(`Exec: ${cmdString}`);
  }
  return new Promise((resolve, reject) => {
    childProcess.exec(cmdString, { cwd: root }, (error, stdout, stderr) => {
      let hasOutput = false;
      if (stdout) {
        hasOutput = true;
        if (!quiet) {
          logDivider('BEGIN stdout');
          process.stdout.write(stdout.toString());
          logDivider('END stdout');
        }
      }
      if (stderr) {
        hasOutput = true;
        if (!quiet) {
          logDivider('BEGIN stderr');
          process.stderr.write(stderr.toString());
          logDivider('END stderr');
        }
      }
      if (error) {
        if (!hasOutput) {
          console.warn('The command did not return any output');
        }
        if (!quiet) {
          // Don't log all of the error because it includes all of stderr.
          console.error(`Snippet of exec error: ${error.toString().slice(0, 60)}...`);
        }
        reject(new Error(`exec command failed: ${cmdString}`));
      }
      resolve(stdout.toString());
    });
  });
}

function fileExistsSync(file) {
  try {
    return Boolean(fs.statSync(file));
  } catch (error) {
    return false;
  }
}

new Promise((resolve) => {
  if (fileExistsSync(containerIdFile)) {
    console.warn(`Removing existing container ID file: ${containerIdFile}`);
    fs.unlinkSync(containerIdFile);
  }
  resolve();
})
  .then(() => exec('docker', ['build', '-q', '.']))
  .then((imageIdOutput) => imageIdOutput.trim())
  .then((imageId) => {
    // Start the server.
    const runArgs = [
      'run',
      '-d',
      `--add-host=example.com:0.0.0.0`,
      '-p=4000:4000',
      '-e',
      `NODE_APP_INSTANCE=${appInstance}`,
      '-e',
      `NODE_ENV=production`,
      '-e',
      `NODE_CONFIG_ENV=${nodeConfigEnv}`,
      '-e',
      `USE_HTTPS_FOR_DEV=true`,
      `-e`,
      `SERVER_HOST=example.com`,
      `--cidfile=${containerIdFile}`,
      // This will make sure we can read the logs.
      '--log-driver=json-file',
      imageId,
      '/bin/sh -c "yarn build && yarn start"',
    ];
    return exec('docker', runArgs);
  })
  .then(() => {
    return fs.readFileSync(containerIdFile).toString();
  })
  .then((containerId) => {
    // Wait for the server to start and build assets.

    // This is the subresource integrity file, one of several asset files
    // built when the server starts.
    const sampleAssetFile = '/srv/code/dist/sri.json';

    return new Promise((resolve, reject) => {
      // All time is in milleseconds.
      const interval = 1000;
      const timeOut = 1000 * 60 * 5; // 5 minutes
      let timeElapsed = 0;
      console.log(`Waiting for assets to build (looking for ${sampleAssetFile})`);

      const waitForAssets = () => {
        if (timeElapsed >= timeOut) {
          reject(new Error(
            `Timed out waiting for assets file to appear at
            ${sampleAssetFile}`));
          return;
        }
        timeElapsed += interval;

        exec('docker',
          ['exec', containerId, 'ls', sampleAssetFile], { quiet: true }
        )
          .then(() => {
            // The file exists, the server has finished building assets.
            resolve(containerId);
          })
          .catch(() => {
            // The file does not exist yet. Try again.
            setTimeout(waitForAssets, interval);
          });
      };

      waitForAssets();
    });
  })
  .then((containerId) => {
    // Since the asset we just checked for isn't the final asset built,
    // wait just a bit before capturing the logs.
    return new Promise(
      (resolve) => setTimeout(() => resolve(containerId), 2000));
  })
  .then((containerId) => {
    // Show all of the server logs.
    return shell('docker', ['logs', '--tail=all', containerId]);
  })
  .then(() => {
    console.log('The server is ready 🦄 ✨');
  })
  .catch((error) => {
    console.log(''); // Pad with a blank line
    console.error(error.stack);
    process.exit(1);
  });
