/* eslint import/no-extraneous-dependencies: 0 */
const chalk = require('chalk');
const {
  getConsoleOutput,
} = require('@jest/console');
const {
  DefaultReporter,
} = require('@jest/reporters');
const {
  utils,
} = require('@jest/reporters');

const TITLE_BULLET = chalk.bold('\u25cf '); // This Jest reporter does not output any console.log except when the tests are
// failing, see: https://github.com/mozilla/addons-frontend/issues/2980.

class FingersCrossedReporter extends DefaultReporter {
  printTestFileHeader(testPath, config, result) {
    this.log(utils.getResultHeader(result, this._globalConfig, config));
    const consoleBuffer = result.console;
    const testFailed = result.numFailingTests > 0;

    if (testFailed && consoleBuffer && consoleBuffer.length) {
      // prettier-ignore
      this.log(`  ${TITLE_BULLET}Console\n\n${getConsoleOutput(consoleBuffer, config, this._globalConfig)}`);
    }
  }

}

module.exports = FingersCrossedReporter;