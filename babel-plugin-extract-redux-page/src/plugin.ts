import { PluginObj} from '@babel/core';
import traverse, { NodePath } from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

function unwrap<T>(input: T | T[]): T {
  return Array.isArray(input) ? input[0] : input;
}

function findClassComponent(
  path: NodePath<t.Program>,
  unwrapppedExportDefault: NodePath<t.Node>,
): NodePath<t.ClassDeclaration> {
  function resolveClassFromHoc(expression: NodePath<t.CallExpression>): NodePath<t.ClassDeclaration> {
    const [component] = expression.get('arguments');

    if (!component.isIdentifier()) throw new Error('Higher order component expected identifier');

    const classPath = path.scope.getBinding(component.node.name)?.path;

    if (!classPath?.isClassDeclaration()) throw new Error('Expected to export a class component');

    return classPath;

  }

  if (unwrapppedExportDefault.isIdentifier()) {
    const referencedDeclaration = path.scope.getBinding(
      unwrapppedExportDefault.node.name
    )?.path;

    if (!referencedDeclaration) throw new Error('Could not find referenced declaration');

    if (referencedDeclaration.isVariableDeclarator()) {
      const init = referencedDeclaration.get('init');

      if (init.isCallExpression()) {
        return resolveClassFromHoc(init);
      }
    } else if (referencedDeclaration.isClassDeclaration()) {
      return referencedDeclaration;
    }

  }

  if (unwrapppedExportDefault.isCallExpression()) {
    return resolveClassFromHoc(unwrapppedExportDefault);
  }

  if (unwrapppedExportDefault.isTypeCastExpression()) {
    const expression = unwrapppedExportDefault.get('expression');

    if (expression.isCallExpression()) {
      return resolveClassFromHoc(expression);
    }
  }
  throw new Error("Expected to export either a call expression or an identifier");
}

function findClassMethod(path: NodePath<t.ClassDeclaration>, name: string): NodePath<t.ClassMethod> | null {
  for (const node of path.get('body').get('body')) {
    if (node.isClassMethod()) {
      const key = unwrap(node.get('key'));
      if (key.isIdentifier() && key.node.name === name) {
        return node;
      }
    }
  }
  return null;
}

function findPropTypes(path: NodePath<t.ClassDeclaration>): NodePath<t.ClassProperty> | null {
  for (const node of path.get('body').get('body')) {
    if (node.isClassProperty()) {
      const key = unwrap(node.get('key'));
      if (key.isIdentifier() && key.node.name === 'propTypes') {
        return node;
      }
    }
  }
  return null;
}

function findFlowProps(path: NodePath<t.ClassDeclaration>): NodePath<t.FlowType> | null {
  const superTypeParameters = path.get('superTypeParameters');

  if (superTypeParameters.isTypeParameterInstantiation()) {
    const types = superTypeParameters.get('params')[0];

    if (types.isFlowType()) {
      return types;
    }
  }

  return null;
}

function findDefaultExport(path: NodePath<t.Program>): NodePath<t.Node> {
  const body = path.get('body');

  const exportDefault = body.find((node) => {
    return node.isExportDefaultDeclaration();
  });

  if (!exportDefault) {
    throw new Error('Expecting a default export');
  }

  const defaultExportDeclaration = exportDefault.get('declaration');

  return unwrap(defaultExportDeclaration);
}

function transformRenderMethodBody(
  classDeclaration: NodePath<t.ClassDeclaration>,
): [t.FunctionDeclaration, Set<string>] {
  const renderMethod = findClassMethod(classDeclaration, 'render');

  if (!renderMethod) throw new Error('Could not find render method in component');

  const clonedBody = t.cloneNode(renderMethod.get('body').node, true);

  const thisMethods: Set<string> = new Set();

  traverse(clonedBody, {
    noScope: true,
    MemberExpression(path) {
      const property = path.get('property');
      const object = path.get('object');

      if (object.isThisExpression() && property.isIdentifier()) {
        if (property.node.name === 'props') {
          path.replaceWith(t.identifier('props'));
        } else {
          path.replaceWith(t.memberExpression(t.identifier('props'), path.node.property));
          thisMethods.add(property.node.name);
        }
      }
    }
  });

  const renderFunction = t.functionDeclaration(
    t.identifier('RenderFunction'),
    [t.identifier('props')],
    clonedBody
  );

  return [renderFunction, thisMethods];
}

function extractClassmethodTypeAnnotation(
  classMethodNodePath: NodePath<t.ClassMethod>,
): t.FunctionTypeAnnotation {
  const paramsPath = classMethodNodePath.get('params');
  const returnTypePath = classMethodNodePath.get('returnType');

  let paramsType: t.FunctionTypeParam[] = [];
  let returnType: t.FlowType = t.genericTypeAnnotation(
    t.qualifiedTypeIdentifier(
      t.identifier('Node'),
      t.identifier('React'),
    )
  );

  paramsPath.forEach(param => {
    if (param.isIdentifier()) {
      let typeAnnotation: t.FlowType = t.anyTypeAnnotation();

      const annotation = param.get('typeAnnotation');

      if (annotation.isTypeAnnotation()) {
        typeAnnotation = annotation.node.typeAnnotation;
      }

      paramsType.push(
        t.functionTypeParam(
          param.node,
          typeAnnotation
        )
      )
    } else {
      throw new Error('Expected identifier');
    }
  });

  if (returnTypePath.isTypeAnnotation()) {
    const annotation = returnTypePath.get('typeAnnotation');
    if (annotation.isFlowType()) {
      returnType = t.cloneNode(annotation.node, true);
    }
  }

  // Create function type annotation
  return t.functionTypeAnnotation(
    null, // Type parameters, if any
    paramsType, // Parameters' type annotations
    null, // Rest parameter, if any
    returnType // Return type annotation
  );
}

interface State {
  importsReduxCompose: boolean;
  classComponentNodeName: string | null;
  classComponentNode: t.ClassDeclaration | null;
  exportDefaultDeclarationIdentifierName: string | null;
}

const reactDefaultExportCheckerPlugin = (): PluginObj<State> => {
  return {
    name: "react-default-export-checker",
    pre() {
      this.importsReduxCompose = false;
      this.classComponentNodeName = null;
      this.classComponentNode = null;
      this.exportDefaultDeclarationIdentifierName = null;
    },
    visitor: {
      Program(path: NodePath<t.Program>, state) {
        const defaultExport = findDefaultExport(path);
        const classDeclaration = findClassComponent(path, defaultExport);

        if (!classDeclaration) return

        const className = classDeclaration.get('id').node?.name;
        const index = path.node.body.indexOf(classDeclaration.node);

        if (!className) throw new Error('Could not find class name');

        // get Props type from the class component if it exists.
        const flowProps = findFlowProps(classDeclaration);
        const propTypes = findPropTypes(classDeclaration);
        const renderMethod = findClassMethod(classDeclaration, 'render');

        /*
        1. handle static propTypes mapping
        2. handle render method mapping.

        (NOTE: consider using a type of reference which would mean you don't need any explicit mapping and type would auto update)

        Pick<Component, 'renderThing'>

        or {renderThing: typeof Component.renderThing}

        */

        if (renderMethod === null) throw new Error('Could not find render method in component');

        const [transformedBody, classMethodsInRender] = transformRenderMethodBody(classDeclaration);

        const methodProps: t.JSXAttribute[] = [];
        const methodFlowTypes: t.ObjectTypeProperty[] = [];
        const methodPropTypes: t.ObjectProperty[] = [];

        for (const methodName of Array.from(classMethodsInRender)) {
          const methodPath = findClassMethod(classDeclaration, methodName);

          if (!methodPath) throw new Error(`Could not find method ${methodName} in component`);

          if (flowProps) {
            methodFlowTypes.push(
              t.objectTypeProperty(
                t.identifier(methodName),
                extractClassmethodTypeAnnotation(methodPath),
              ),
            );
          }

          if (propTypes) {
            methodPropTypes.push(
              t.objectProperty(
                t.identifier(methodName),
                t.memberExpression(
                  t.memberExpression(
                    t.identifier('PropTypes'),
                    t.identifier('func'),
                  ),
                  t.identifier('isRequired')
                ),
              ),
            );
          }

          methodProps.push(
            t.jsxAttribute(
              t.jsxIdentifier(methodName),
              t.jsxExpressionContainer(
                t.memberExpression(
                  t.thisExpression(),
                  t.identifier(methodName)
                )
              )
            )
          );
        }

        const insert: t.Statement[] = [transformedBody];

        if (propTypes) {
          const objectExpression = propTypes.get('value');

          if (objectExpression.isObjectExpression()) {
            const propTypesNode = objectExpression.node;

            propTypesNode.properties.push(
              ...methodPropTypes,
            );

            insert.push(
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.memberExpression(
                    t.identifier('RenderFunction'),
                    t.identifier('propTypes'),
                  ),
                  objectExpression.node,
                )
              ),
            )
          }
        }

        if (flowProps) {
          let flowType: t.FlowType;

          if (methodFlowTypes.length > 0) {
            const objectTypeAnnotation = t.objectTypeAnnotation(methodFlowTypes);
            flowType = t.intersectionTypeAnnotation([flowProps.node, objectTypeAnnotation]);
          } else {
            flowType = t.cloneNode(flowProps.node, true);
          }
          transformedBody.params[0].typeAnnotation = t.typeAnnotation(flowType);
        }

        path.node.body.splice(index, 0, ...insert);

        renderMethod.get('body').replaceWith(
          t.blockStatement([
            t.returnStatement(
              t.jsxElement(
                t.jsxOpeningElement(
                  t.jsxIdentifier('RenderFunction'),
                  [
                    t.jsxSpreadAttribute(t.memberExpression(t.thisExpression(), t.identifier('props'))),
                    ...methodProps,
                  ],
                  true,
                ),
                null,
                []
              )
            )
          ])
        );
      }
    }
  };
};

export default reactDefaultExportCheckerPlugin;
