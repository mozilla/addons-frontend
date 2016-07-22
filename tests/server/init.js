import fs from 'fs';
import path from 'path';


/*
 * Throw an error if there are local configs that would pollute the test suite.
 */
export function checkLocalConfigs() {
  const root = path.resolve(path.join(path.dirname(__filename), '..', '..'));
  if (!fs.statSync(root).isDirectory()) {
    throw new Error(`Oops, detected the wrong root? ${root}`);
  }

  const configDir = path.join(root, 'config');
  if (!fs.statSync(configDir).isDirectory()) {
    throw new Error(`Oops, detected the wrong config dir? ${configDir}`);
  }
  const disallowedFiles = fs.readdirSync(configDir)
    // Disallow any local configs except for development configs.
    .filter((name) =>
      name.startsWith('local-') && !name.startsWith('local-development'))
    .map((name) => path.join(configDir, name).replace(process.cwd(), '.'));

  if (disallowedFiles.length) {
    throw new Error(dedent`These local config files are not allowed because
      they might pollute the test environment.
      Prefix them with local-development- instead:
      ${disallowedFiles.join('\n')}`);
  }
}


before(checkLocalConfigs);
