const util = require('util');

const exec = util.promisify(require('child_process').exec);

const filterFileNamesFromGitStatusOutput = (output) => {
  const files = output.split('\n').map((line) => line.trim()) // Make sure we ignore deleted files.
  .filter((line) => !line.startsWith('D')).map((line) => {
    // Return the new name of a renamed file.
    if (line.startsWith('RM')) {
      return line.substring(line.indexOf('->'));
    }

    return line;
  }).map((line) => line.split(' ')) // .flatMap()
  .reduce((chunks, chunk) => chunks.concat(chunk), []) // We assume no filename can be smaller than 3 to filter the short format
  // statuses: https://git-scm.com/docs/git-status#_short_format.
  .filter((chunk) => chunk.length > 3) // Allow directories OR JS/JSX files
  .filter((filename) => /(\/|\.jsx?)$/.test(filename));
  return files;
};

const getChangedFiles = async () => {
  // We use the Porcelain Format Version 1,
  // See: https://git-scm.com/docs/git-status#_porcelain_format_version_1
  const {
    stdout,
    stderr,
  } = await exec('git status --porcelain=1');

  if (stderr) {
    return null;
  }

  return filterFileNamesFromGitStatusOutput(stdout);
};

module.exports = {
  filterFileNamesFromGitStatusOutput,
  getChangedFiles,
};