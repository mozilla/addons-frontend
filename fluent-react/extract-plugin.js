/* eslint-disable no-nested-ternary */
/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');

const { default: generate } = require('@babel/generator');
const fluentAst = require('@fluent/syntax');
const exp = require('constants');

function withPrefix(text, prefix) {
  const prefixStr = prefix ? `${prefix}-` : '';

  return prefixStr + text;
}

function createHash(node) {
  return crypto
    .createHash('shake256', { outputLength: 5 })
    .update(generate(node).code)
    .digest('hex');
}

function extractFunctionCall(t, node) {
  const className = node.callee.name;

  const variableRef = new fluentAst.VariableReference(
    new fluentAst.Identifier(withPrefix(createHash(node), 'selector')),
  );

  const args = node.arguments[1];
  let namedArguments = [];

  if (args) {
    namedArguments = args.properties.map((arg) => {
      const identifier = new fluentAst.Identifier(arg.key.name);
      let value;

      if (t.isStringLiteral(arg.value)) {
        value = new fluentAst.StringLiteral(arg.value.value);
      }

      if (t.isNumericLiteral(arg.value)) {
        value = new fluentAst.NumberLiteral(arg.value.value);
      }

      if (!value) {
        throw new Error(`Invalid variant value ${generate(arg.value).code}`);
      }

      return new fluentAst.NamedArgument(identifier, value);
    });
  }

  const callArguments = new fluentAst.CallArguments(
    [variableRef],
    namedArguments,
  );

  switch (className) {
    case 'FluentNumber':
      return new fluentAst.FunctionReference(
        new fluentAst.Identifier('NUMBER'),
        callArguments,
      );
    case 'FluentDateTime':
      return new fluentAst.FunctionReference(
        new fluentAst.Identifier('DATETIME'),
        callArguments,
      );
    default:
      throw new Error(`Unexpected class name: ${className}`);
  }
}

function extractElementsFromString(t, node) {
  const messageElements = [];

  // handle literal string
  if (t.isStringLiteral(node)) {
    messageElements.push(new fluentAst.TextElement(node.value));
    // handle template literal
  } else if (t.isTemplateLiteral(node)) {
    node.quasis.forEach((quasi, i) => {
      messageElements.push(new fluentAst.TextElement(quasi.value.raw));

      const expr = node.expressions[i];

      if (expr) {
        if (t.isNewExpression(expr)) {
          const functionCall = extractFunctionCall(t, expr);

          messageElements.push(new fluentAst.Placeable(functionCall));
        } else {
          messageElements.push(
            new fluentAst.Placeable(
              new fluentAst.VariableReference(
                new fluentAst.Identifier(
                  withPrefix(createHash(expr), 'expression'),
                ),
              ),
            ),
          );
        }
      }
    });
  }

  return messageElements;
}

function reseolveSelectorExpression(t, node) {
  if (t.isIdentifier(node)) {
    return new fluentAst.VariableReference(new fluentAst.Identifier(node.name));
  }
  if (t.isNewExpression(node)) {
    const className = node.callee.name;

    const variableRef = new fluentAst.VariableReference(
      new fluentAst.Identifier(withPrefix(createHash(node), 'selector')),
    );

    const args = node.arguments[1];
    let namedArguments = [];

    if (args) {
      namedArguments = args.properties.map((arg) => {
        const identifier = new fluentAst.Identifier(arg.key.name);
        let value;

        if (t.isStringLiteral(arg.value)) {
          value = new fluentAst.StringLiteral(arg.value.value);
        }

        if (t.isNumericLiteral(arg.value)) {
          value = new fluentAst.NumberLiteral(arg.value.value);
        }

        if (!value) {
          throw new Error(`Invalid variant value ${generate(arg.value).code}`);
        }

        return new fluentAst.NamedArgument(identifier, value);
      });
    }

    const callArguments = new fluentAst.CallArguments(
      [variableRef],
      namedArguments,
    );

    switch (className) {
      case 'FluentNumber':
        return new fluentAst.FunctionReference(
          new fluentAst.Identifier('NUMBER'),
          callArguments,
        );
      default:
        throw new Error(`Unexpected class name: ${className}`);
    }
  }
  throw new Error('Invalid selector. expecting identifier or new Fluent*');
}

module.exports = function flowExtract({ types: t }, { output }) {
  if (!output) {
    throw new Error('output option is required');
  }
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

            let messageId;
            let messageElements = [];

            if (t.isStringLiteral(firstArg) || t.isTemplateLiteral(firstArg)) {
              messageId = new fluentAst.Identifier(
                withPrefix(createHash(firstArg), 'message'),
              );
              messageElements = extractElementsFromString(t, firstArg);

              // map string literal to add elemtns for static text and expressions for expressions.
            } else if (
              t.isIdentifier(firstArg) ||
              t.isNewExpression(firstArg)
            ) {
              messageId = new fluentAst.Identifier(
                withPrefix(createHash(firstArg), 'message'),
              );

              const selector = reseolveSelectorExpression(t, firstArg);
              let selectorDefaultVariant;

              // if firstArg is identifier, then the selector is a variable reference

              // else if the firstArg is a new expression, we need to map the class name to a builtin function

              // else we should error as this is not a valid use case.

              const secondArg = originalArgs[1];

              if (!secondArg) {
                throw new Error('Selector must provide a variants object');
              }

              if (!t.isObjectExpression(secondArg)) {
                throw new Error(
                  'Invalid variants argument. expecting Record<string, string>',
                );
              }

              // get the default variant
              const getProp = (key) =>
                originalArgs[1].properties.find((prop) => {
                  return prop.key.name === key;
                });
              const thirdArg = originalArgs[2];

              // if there is an explicit third argument, use that as the default variant if valid
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

                selectorDefaultVariant = otherProp.key.name;
                // If there is no explicit third argument, check for "other" property
              } else if (getProp('other')) {
                selectorDefaultVariant = 'other';
                // if there is no explicit third arg and not other, error as this will produce  invalid ftl
              } else {
                throw new Error(
                  'Selector must provide explicit default variant, or a variant named `other`',
                );
              }
              // end default variant

              // map the variant options to the selector variants
              const variants = secondArg.properties.map((prop) => {
                if (
                  !t.isStringLiteral(prop.value) &&
                  !t.isTemplateLiteral(prop.value)
                ) {
                  throw new Error(
                    `Invalid variant value: '${generate(prop).code}'`,
                  );
                }

                let variantId = null;

                if (t.isIdentifier(prop.key)) {
                  variantId = prop.key.name;
                } else if (t.isNumericLiteral(prop.key)) {
                  variantId = String(prop.key.value);
                }

                if (!variantId) {
                  throw new Error(`Invalid variant key: '${prop.key}'`);
                }

                return new fluentAst.Variant(
                  new fluentAst.Identifier(variantId),
                  new fluentAst.Pattern(
                    extractElementsFromString(t, prop.value),
                  ),
                  variantId === selectorDefaultVariant,
                );
              });

              messageElements.push(
                new fluentAst.Placeable(
                  new fluentAst.SelectExpression(selector, variants),
                ),
              );
            }

            const stringified = fluentAst.serialize(
              new fluentAst.Resource([
                new fluentAst.Message(
                  messageId,
                  new fluentAst.Pattern(messageElements),
                ),
              ]),
            );

            fs.writeFileSync(output, stringified, 'utf-8');
          }
        },
      },
    },
  };
};
