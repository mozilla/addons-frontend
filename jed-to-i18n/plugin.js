module.exports = function({ types: t }, {commentPadding = true} = {commentPadding: true}) {
  // i18n
  const I18N = 'i18n';
  // List of i18n methods to check
  const i18nMethods = ['gettext', 'ngettext', 'sprintf', 't'];

  // Function to check if the node is a call to a specified i18n method
  function isI18nCall(node, method) {
    if (!i18nMethods.includes(method)) throw new Error(`Invalid i18n method: ${method}`);

    if (t.isMemberExpression(node.callee)) {
      const isMember = t.isMemberExpression(node.callee.object);

      if (node.callee.property.name === method) {
        const root = node.callee.object.name
        ? node.callee.object.name
        : node.callee.object.property.name;

        if (root === I18N) {
          return true;
        }
      }
    }

    return false;
  }

  function mapProps(dest, source) {
    for (prop of source) {
      if (prop.key.name === 'count') {
        prop.key.name = 'count_prop';
      }
      dest.push(prop);
    }
  }

  function enterCallExpression(t, path) {
    // replace i18n.sprintf with i18n.t
    if (isI18nCall(path.node, 'sprintf')) {
      // if the key is a call to i18n.gettext, replace with the key itself
      if (isI18nCall(path.node.arguments[0], 'gettext')) {
        path.node.arguments[0] = path.node.arguments[0].arguments[0];
      }
      path.node.callee.property.name = 't';
    } else if (isI18nCall(path.node, 'gettext')) {
      path.node.callee.property.name = 't';
    } else if (isI18nCall(path.node, 'ngettext')) {
      // process the first argument of the ngettext call
      function extractArgument(childNode) {
        if (
          childNode?.callee?.property?.name
          && isI18nCall(childNode, childNode.callee.property.name)
        ) {
          enterCallExpression(t, {
            node: childNode,
            parent: path.node,
          });
        }
        return childNode;
      }

      // get a comment friendly version of the third argument
      function stringifyCount(thirdArgNode) {
        if (t.isNumericLiteral(thirdArgNode)) {
          return thirdArgNode.value.toString();
        } else if (t.isIdentifier(thirdArgNode)) {
          return thirdArgNode.name;
        } else if (t.isMemberExpression(thirdArgNode)) {
          // Recursively process each part of the member expression
          const object = stringifyCount(thirdArgNode.object);
          const property = thirdArgNode.computed ? `[${stringifyCount(thirdArgNode.property)}]` : `.${thirdArgNode.property.name}`;
          return object + property;
        }

        throw new Error(`Unhandled node type: ${thirdArgNode.type}`);
      }

      // get a comment friendly version of the first and second arguments
      function stringifyKey(argNode) {
        if (t.isStringLiteral(argNode)) {
          return argNode.value;
        } else if (t.isTemplateLiteral(argNode)) {
          return argNode.quasis[0].value.raw;
        } else if (argNode?.callee?.property?.name && isI18nCall(argNode, argNode.callee.property.name)) {
          return stringifyKey(argNode.arguments[0]);
        }
        throw new Error(`Unhandled node type: ${argNode.type}`);
      }

      let pathFirstArg;
      let pathSecondArg = t.objectExpression([]);
      let hasCountProp = false;

      // add third arguemnt of path.node as count member on pathSecondArg
      pathSecondArg.properties.push(t.objectProperty(t.identifier('count'), path.node.arguments[2]));

      const firstArg = extractArgument(path.node.arguments[0]);

      if (isI18nCall(firstArg, 't')) {
        pathFirstArg = Object.assign(firstArg.arguments[0]);

        if (firstArg.arguments[1] && t.isObjectExpression(firstArg.arguments[1])) {
          mapProps(pathSecondArg.properties, firstArg.arguments[1].properties);
        }
      } else if (t.isStringLiteral(firstArg)) {
        pathFirstArg = firstArg;
      } else {
        throw new Error(`Unhandled node type: ${firstArg.type}`);
      }

      const commentLines = [
        'manual-change: merge keys',
      ];

      const firstArgString = stringifyKey(pathFirstArg);

      commentLines[commentLines.length - 1] = commentLines[commentLines.length - 1] + ' ';

      commentLines.push(`'${firstArgString}' -> '${firstArgString}_one'`);

      if (path.node.arguments[1]) {
        const secondArg = extractArgument(path.node.arguments[1]);

        const secondArgString = stringifyKey(
          isI18nCall(secondArg, 't')
            ? secondArg.arguments[0]
            : secondArg
        );

        commentLines.push(`'${secondArgString}' -> '${firstArgString}_other'`)
      }

      let commentText = commentLines.join('\n');

      if (commentPadding) {
        commentText = ` ${commentText} `;
      }

      if (t.isConditionalExpression(path.parent)) {
        t.addComment(path.parent, 'leading', commentText);
      } else {
        t.addComment(path.node, 'leading', commentText);
      }

      path.node.callee.property.name = 't';
      path.node.arguments = [pathFirstArg, pathSecondArg];
    }
  }

  function exitCallExpression(t, path) {
    if (isI18nCall(path.node, 't')) {
      const firstArg = Object.assign(path.node.arguments[0]);
      const secondArg = path.node.arguments[1] && Object.assign(path.node.arguments[1]);


      if (isI18nCall(firstArg, 't')) {
        const params = t.objectExpression([]);

        if (t.isObjectExpression(firstArg.arguments[1])) {
          params.properties.push(
            ...firstArg.arguments[1].properties
          )
        }

        if (t.isObjectExpression(secondArg)) {
          mapProps(params.properties, secondArg.properties);
        }

        path.node.leadingComments = firstArg.leadingComments;
        path.node.arguments = [firstArg.arguments[0], params];

      }
    }
  }
  return {
    visitor: {
      CallExpression: {
        enter(path) {
          enterCallExpression(t, path);
        },
        exit(path) {
          exitCallExpression(t, path);
        }
      },
    },
  };
};
