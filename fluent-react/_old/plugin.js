/* eslint-disable no-console */
const { default: generate } = require('@babel/generator');
const crypto = require('crypto');

function createHash(node, prefix) {
  const hash = crypto
    .createHash('shake256', { outputLength: 5 })
    .update(generate(node).code)
    .digest('hex');

  const prefixStr = prefix ? `${prefix}-` : '';

  return prefixStr + hash;
}

function mapExpressionsToObjectProps(t, objectMap, node) {
  node.expressions.forEach((expr) => {
    let propName;
    const propValue = t.cloneNode(expr);
    const computed = false;
    let shorthand = true;
    let mapKey;

    if (t.isIdentifier(expr)) {
      propName = propValue;
      mapKey = propName.name;
    } else {
      shorthand = false;
      propName = t.stringLiteral(createHash(expr, 'expression'));
      mapKey = propName.value;
    }

    if (!objectMap.has(mapKey)) {
      objectMap.set(
        mapKey,
        t.objectProperty(propName, propValue, computed, shorthand),
      );
    }
  });
}

module.exports = function flowExtract({ types: t }) {
  return {
    visitor: {
      // Store whether destructuring was used
      Program: {
        enter(path, state) {
          state.ignore = true;
        },
      },
      ImportDeclaration(path, state) {
        if (path.node.source.value === 'fluent-react') {
          path.node.specifiers.forEach((specifier) => {
            if (
              t.isImportSpecifier(specifier) &&
              specifier.imported.name === 'useLocalization'
            ) {
              state.ignore = false;
            }
          });
        }
      },
      CallExpression: {
        enter(path, state) {
          if (state.ignore) return;

          const callee = path.get('callee');

          if (
            t.isMemberExpression(callee.node) &&
            t.isIdentifier(callee.node.property, { name: 'createMessage' })
          ) {
            const originalArgs = path.node.arguments;
            const firstArg = originalArgs[0];

            const getStringId = t.stringLiteral(
              createHash(firstArg, 'message'),
            );
            const getStringArgs = new Map();
            let getStringDefault = firstArg;

            if (t.isTemplateLiteral(firstArg)) {
              mapExpressionsToObjectProps(t, getStringArgs, firstArg);
              // If the first arg is a reference type, not a literal
            } else if (
              t.isIdentifier(firstArg) ||
              t.isNewExpression(firstArg)
            ) {
              const propertyName = t.isIdentifier(firstArg)
                ? t.identifier(firstArg.name)
                : t.stringLiteral(createHash(firstArg, 'selector'));

              getStringArgs.set(
                propertyName,
                t.objectProperty(propertyName, firstArg, false, true),
              );

              // if no second arg, then we should throw
              const secondArg = originalArgs[1];

              if (!secondArg) {
                throw new Error('Selector must provide a variants object');
              }

              if (!t.isObjectExpression(secondArg)) {
                throw new Error(
                  'Invalid variants argument. expecting Record<string, string>',
                );
              }

              secondArg.properties.forEach((prop) => {
                if (t.isTemplateLiteral(prop.value)) {
                  mapExpressionsToObjectProps(t, getStringArgs, prop.value);
                } else if (!t.isStringLiteral(prop.value)) {
                  throw new Error(
                    `Invalid variant value: '${generate(prop).code}'`,
                  );
                }
              });

              const getProp = (key) =>
                originalArgs[1].properties.find((prop) => {
                  return prop.key.name === key;
                });

              const thirdArg = originalArgs[2];
              if (thirdArg) {
                if (!t.isStringLiteral(thirdArg)) {
                  throw new Error('default variant must be string literal');
                }

                const otherProp = getProp(thirdArg.value);

                if (!otherProp) {
                  throw new Error(
                    `property '${thirdArg.value}' does not exist on variants`,
                  );
                }

                getStringDefault = otherProp.value;
              } else {
                // If there is no explicit third argument, check for "other" property
                const otherProp = getProp('other');
                if (otherProp) {
                  getStringDefault = otherProp.value;
                  // if there is no explicit third arg and not other, error as this will produce invalid ftl
                } else {
                  throw new Error(
                    'Selector must provide explicit default variant, or a variant named `other`',
                  );
                }
              }
            } else {
              // TODO: should we check for other types? like ArrayExpression or something...
              // there are probably types where we would want to throw.
            }

            const newArgs = [
              getStringId,
              t.objectExpression(Array.from(getStringArgs.values())),
            ];

            if (getStringDefault) {
              newArgs.push(getStringDefault);
            }

            // TODO: we now have enough information to generate the ftl AST and serialize it.
            // SHOULD this be a separeate plugin? or should we do it here?

            path.replaceWith(
              t.callExpression(
                t.memberExpression(
                  callee.node.object,
                  t.identifier('getString'),
                ),
                newArgs,
              ),
            );
          }
        },
      },
    },
  };
};
