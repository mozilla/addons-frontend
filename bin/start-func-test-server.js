/* @flow */
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
const nodeEnv = 'uitests';

function logDivider(heading) {
  console.log(`${'='.repeat(35)} ${heading} ${'='.repeat(35)}`);
};

function shell(cmd, args) {
  // Execs a command as if it were part of the parent shell
  // (i.e. the output is unbuffered and is displayed in the console).
  console.log(`Shell exec: ${cmd} ${args.join(' ')}`);
  logDivider('BEGIN shell');
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
          `shell command failed: ${cmd} (exit: ${exitCode || '[empty]'})`));
      }
      resolve();
    });
  });
}

function exec(cmd, argParts) {
  const cmdString = `${cmd} ${argParts.join(' ')}`;
  console.log(`Exec: ${cmdString}`);
  return new Promise((resolve, reject) => {
    childProcess.exec(cmdString, { cwd: root }, (error, stdout, stderr) => {
      let gotOutput = false;
      if (stdout) {
        gotOutput = true;
        logDivider('BEGIN stdout');
        process.stdout.write(stdout.toString());
        logDivider('END stdout');
      }
      if (stderr) {
        gotOutput = true;
        logDivider('BEGIN stderr');
        process.stderr.write(stderr.toString());
        logDivider('END stderr');
      }
      if (error) {
        if (!gotOutput) {
          console.warn('The command did not return any output');
        }
        // Don't log all of the error because it includes all of stderr.
        console.error(`Snippet of exec error: ${error.toString().slice(0, 60)}...`);
        reject(new Error(`exec command failed: ${cmd}`));
      }
      resolve(stdout.toString());
    });
  });
}

new Promise((resolve) => {
  let idStat;
  try {
    idStat = fs.statSync(containerIdFile);
  } catch (error) {
    idStat = false;
  }
  if (idStat) {
    console.warn(`Removing existing container ID file: ${containerIdFile}`);
    fs.unlinkSync(containerIdFile);
  }
  resolve();
})
  .then(() => exec('docker', ['build', '-q', '.']))
  .then((builtContainerId) => {
    const runArgs = [
      'run',
      '-d',
      '-p=4000:4000',
      '-e',
      `NODE_APP_INSTANCE=${appInstance}`,
      '-e',
      `NODE_ENV=${nodeEnv}`,
      `--cidfile=${containerIdFile}`,
      // This will make sure we can read the logs.
      '--log-driver=json-file',
      builtContainerId.trim(),
      '/bin/sh -c "npm run build && npm run start"',
    ];
    return exec('docker', runArgs);
  })
  .then(() => {
    // TODO: wait for webpack-assets
    const runningContainerId = fs.readFileSync(containerIdFile);
    return shell(
      'docker', ['logs', '--tail=all', runningContainerId.toString()]);
  })
  .then(() => {
    console.log('The server has started 🦄 ✨');
  })
  .catch((error) => {
    console.log(''); // blank line
    console.error(error.stack);
    process.exit(1);
  });
