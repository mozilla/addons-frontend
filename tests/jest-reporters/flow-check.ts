/* eslint-disable no-console, amo/only-log-strings */
const {
  spawn,
} = require('child_process');

const pathToFlowBin = require('flow-bin');

const NO_FLOW_ENV_VAR = 'NO_FLOW';
const magicExitCodes = {
  someFileHadAFlowError: 2,
  serverAlreadyRunning: 11,
};

function execFlow(commandArgs) {
  return new Promise((resolve, reject) => {
    const flow = spawn(pathToFlowBin, commandArgs, {
      cwd: process.cwd(),
    });
    const stdout = [];
    const stderr = [];
    flow.stdout.on('data', (data) => {
      stdout.push(data);
    });
    flow.stderr.on('data', (data) => {
      stderr.push(data);
    });
    flow.on('error', (error) => {
      reject(new Error(`Could not execute Flow binary (${pathToFlowBin}): ${error}`));
    });
    flow.on('close', (code) => {
      resolve({
        code,
        stdout: stdout.join(''),
        stderr: stderr.join(''),
      });
    });
  });
}

class FlowCheckReporter {
  constructor() {
    this.flowErrorOutput = null;
    this.displayedSlowStartupMessage = false;
  }

  isDisabled() {
    return process.env[NO_FLOW_ENV_VAR] === '1';
  }

  async onRunStart() {
    if (this.isDisabled()) {
      return;
    }

    const {
      code,
      stdout,
      stderr,
    } = await execFlow(['start']);

    if (code !== 0 && code !== magicExitCodes.serverAlreadyRunning) {
      console.error(stdout);
      console.error(stderr);
      throw new Error(`'flow start' exited ${code}`);
    }
  }

  async onTestStart() {
    if (this.isDisabled()) {
      return;
    }

    const slowStartUpNotice = setTimeout(() => {
      if (this.displayedSlowStartupMessage) {
        return;
      }

      console.log('Flow: hold on a sec while the server starts 💅');
      console.log('');
      this.displayedSlowStartupMessage = true;
    }, 800);
    const {
      code,
      stdout,
      stderr,
    } = await execFlow(['status', '--color', 'always']);
    clearTimeout(slowStartUpNotice);

    if (code === 0) {
      // All good.
      this.flowErrorOutput = null;
    } else if (code === magicExitCodes.someFileHadAFlowError) {
      this.flowErrorOutput = stdout; // We ignore stderr here because it contains messages like
      // 'Server is handling a request (starting up)'
    } else {
      console.error(stdout);
      console.error(stderr);
      throw new Error(`'flow status' exited ${code}`);
    }
  }

  getLastError() {
    if (this.isDisabled()) {
      return undefined;
    }

    console.log('');

    if (this.flowErrorOutput) {
      console.log(this.flowErrorOutput.trim());
      console.log(`Set ${NO_FLOW_ENV_VAR}=1 in the environment to disable Flow checks`);
      return new Error('Flow errors');
    }

    console.log('Flow: no errors 🌈  ✨');
    return undefined;
  }

}

module.exports = FlowCheckReporter;