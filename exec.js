/* eslint-disable no-console */
const { globSync } = require('glob');
const fs = require('fs');
const { transformFileSync } = require('@babel/core');

const globalState = {};

try {
  const files = globSync('src/amo/**/*.js');

  for (const file of files) {
    transformFileSync(file, {
      plugins: [
        [
          require.resolve('./babel-plugin-count-react-elements/dist/plugin'),
          {
            globalState,
          },
        ],
      ],
    });
  }

  const map = new Map();

  for (const obj of Object.values(globalState)) {
    for (const [key, value] of Object.entries(obj)) {
      if (!map.has(key)) {
        map.set(key, value);
      } else {
        const curr = map.get(key);

        curr.total += value.total;
        curr.style += value.style;
        curr.className += value.className;
        curr.files.push(...value.files);
      }
    }
  }

  const result = Object.fromEntries(map.entries());
  const json = JSON.stringify(result, null, 2);
  fs.writeFileSync('babel-plugin-count-react-elements.json', json, 'utf-8');
  console.log(json);
} catch (error) {
  console.error(error);
  process.exit(1);
}
