import * as BabelCore from '@babel/core';
import * as t from '@babel/types';

const CONSTANTS = {
  l10n: 'l10n',
  createMessage: 'createMessage',
  useLocalization: 'useLocalization',
  withLocalization: 'withLocalization',
  fluentReactImport: 'fluent-react',
} as const;

function extractStringLiteral(node) {
  return node;
}

function extractTemplateLiteral(node) {
  return node;
}

function extractPluralSelector(node) {
  return node;
}

function extractCaseSelector(node) {
  return node;
}

function extractGenericSelector(node) {
  // if plural selector
  return extractPluralSelector(node);

  // if case selector
  return extractCaseSelector(node);

  // throw unsuported selector type
}

// configuration for the plugin
interface Config {

}

interface ExtractState {
  // include our state here
  config: Config;
}

export interface VisitorState extends BabelCore.PluginPass {
  opts: Partial<Config>;

  // This app state.
  ExtractState: ExtractState;
}

function isMemberOfL10nNode(node: BabelCore.Node) {
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.object)) {
      return true;
    }
  }
  return false;
}

function getMemberCalleeName(node: BabelCore.Node): string | null {
  if (t.isMemberExpression(node)) {
    if (t.isIdentifier(node.property)) {
      return node.property.name
    }
  }
  return null;
}

const Visitor: BabelCore.Visitor<VisitorState> = {
  // handle direct calls to `createMessage`
  CallExpression(path, state) {
    const callee = path.get('callee');

    const isL10nMember = isMemberOfL10nNode(callee.node);
    const memberCalleeName = getMemberCalleeName(callee.node);

    const isCreateMessageCall = callee.referencesImport(
      CONSTANTS.fluentReactImport,
      CONSTANTS.createMessage,
    );

    const isWithLocalizationCall = callee.referencesImport(
      CONSTANTS.fluentReactImport,
      CONSTANTS.withLocalization,
    );

    if (isCreateMessageCall || isWithLocalizationCall) {
      console.log("CallExpression", {
        node: callee.node,
        state: state.ExtractState,
      });
    }

    if (isL10nMember && memberCalleeName === CONSTANTS.createMessage && !isCreateMessageCall) {
      console.warn('createMessage is not imported from fluent-react. do not use props.', {memberCalleeName});
    }

    // only handle calls to `createMessage` or `withLocalization` or `useLocalization`

    // destructure and validate the arguments

        // if the first argument is a string literal
        extractStringLiteral(path.node);

        // if the first argument is a template literal
        extractTemplateLiteral(path.node);

        // if the first argument is a new expression or an identifier
        extractGenericSelector(path.node);

        // throw, unsupported argument type.

  },

  // handle JSX elements that return a message
  JSXElement(path, state) {
    console.log("JSXElement", state.ExtractState);

  },

  // handle Class compoents that inject fluent context
  ClassDeclaration(path, state) {
    console.log("ClassDeclaration", state.ExtractState);

  },

  // handle cunction components that use localization hook
  Function(path, state) {
    console.log("Function", state.ExtractState);

  },

};

export default function (
  api: BabelCore.ConfigAPI,
): BabelCore.PluginObj<VisitorState> {
  api.assertVersion(7);

  return {
    pre() {
      this.ExtractState = {
        config: this.opts,
      };
    },
    visitor: {
      Program(path, state) {
        const shouldTraverse = path.get('body')
          .some((node) =>
            node.isImportDeclaration() && node.node.source.value === CONSTANTS.fluentReactImport
        );

        console.log({shouldTraverse});

        if (shouldTraverse) {
          path.traverse(Visitor, state);
        }
      }
    }
  }
}
