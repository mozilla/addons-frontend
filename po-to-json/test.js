/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

const myPluginFunction = require('./plugin');

const fixturesDir = path.join(__dirname, 'fixtures');

function runPluginOnPOFile(poFilePath) {
  const jsonString = myPluginFunction(poFilePath);
  const jsonFilePath = poFilePath.replace('.po', '.json');
  fs.writeFileSync(jsonFilePath, jsonString);
  return jsonFilePath;
}

function findTestCases(dir) {
  const subdirs = fs.readdirSync(dir);
  return subdirs.map((subdir) => {
    const testCaseDir = path.join(dir, subdir);
    const inputFilePath = path.join(testCaseDir, 'input.po');
    const expectedOutputFilePath = path.join(testCaseDir, 'output.json');

    if (
      !fs.existsSync(inputFilePath) ||
      !fs.existsSync(expectedOutputFilePath)
    ) {
      throw new Error(
        `Missing input.po or output.json in test case: ${subdir}`,
      );
    }

    return { inputFilePath, expectedOutputFilePath, testName: subdir };
  });
}

const removeEmptyLastLine = (str) => {
  const lines = str.split('\n');
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.join('\n');
};

test('test', () => {
  findTestCases(fixturesDir).forEach(
    ({ inputFilePath, expectedOutputFilePath, testName }) => {
      console.log(`Running test case: ${testName}`);

      const generatedFilePath = runPluginOnPOFile(inputFilePath);

      const actualOutput = removeEmptyLastLine(
        fs.readFileSync(generatedFilePath, 'utf8'),
      );
      const expectedOutput = removeEmptyLastLine(
        fs.readFileSync(expectedOutputFilePath, 'utf8'),
      );

      assert.strictEqual(actualOutput, expectedOutput);
    },
  );
});
