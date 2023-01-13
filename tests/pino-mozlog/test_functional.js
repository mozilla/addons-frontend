const util = require('util');
const exec = util.promisify(require('child_process').exec);

// eslint-disable-next-line amo/describe-with-filename
describe('functional tests', () => {
  it('converts pino logs to mozlog', async () => {
    const { stdout } = await exec(
      'cat tests/pino-mozlog/fixtures/frontend.log | node bin/pino-mozlog.js',
    );

    // eslint-disable-next-line no-console
    console.log(`${stdout}`);
    expect(stdout).toMatchSnapshot();
  });
});
