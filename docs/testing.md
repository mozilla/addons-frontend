# Testing

We want to maintain a project with a high coverage (aiming for 100%). Our main [coverage criterion](https://en.wikipedia.org/wiki/Code_coverage#Coverage_criteria) is **branch coverage**, that is making sure all possible code branches are covered by test. At an absolute bare minimum, we require 100% line coverage. [Codecov](https://codecov.io/gh/mozilla/addons-frontend) monitors our test coverage for every Pull Request. You can make sure you haven't decreased coverage by checking the Pull Request on GitHub. You can also [generate a coverage report locally](https://github.com/mozilla/addons-frontend/#code-coverage).

## General guidelines

- Imports should be alphabetized, even in test files.
- Comments should be full sentences to ease readability.
- There are a lot of helpers in the `tests/unit/helpers` module–please use them.
- Use action creators in `/actions/` and `/reducers/` instead of hard-coding `dispatch()` arguments or state data for tests. This applies to both UI components and reducers/sagas.
- Use constants (see `core/constants`) when using the same value across files. This avoids hard-coding values and [magic constants](https://en.wikipedia.org/wiki/Magic_constant).

## Jest

[Jest](https://facebook.github.io/jest/docs/en/getting-started.html) is our main testing framework. Please refer to the [`README` section about running the test suite](https://github.com/mozilla/addons-frontend#running-tests) to know how to run the tests. Below are a few rules regarding Jest:

- Prefer `toEqual()` over `toBe()`.
- Do not use `expect.assertions(N)`, this is hard to maintain. Instead, add a `catch()` branch to detect unexpected errors.

When creating a new test file, start with a `describe()` block that takes the current file name as first argument. This makes easy to find/edit a failing test case as Jest will display the test file in its output:

```js
describe(__filename, () => {});
```

## Spies/Stubs/Mocks and Sinon.JS/Jest

We are in the process of moving all of our mocking from [sinon](http://sinonjs.org/) to Jest. Any new tests, or tests that are being updated, should use `Jest` for mocking in place of `sinon`.

## Testing reducers and sagas

For sagas/reducers, there are two useful helpers: `dispatchClientMetadata()` and `dispatchSignInActions()` (`tests/unit/helpers`) that should be used to initialize state in a realistic manner. The former is used to obtain a non-authenticated state while the latter returns an authenticated state.

When you need a `errorHandler` or a `errorHandlerId`, use the `createStubErrorHandler()` helper from `tests/unit/helpers`.

When asserting for exceptions/errors, do not use ES6 shorthand functions/implicit return functions. Instead, you should make visible the method/function that should thrown an exception:

```js
expect(() => {
  methodThatThrowsAnError();
}).toThrow(/expected error message/);
```

When testing sagas, use an action creator to construct the expected actions that should be called by the saga under test:

```js
const expectedLoadAction = autocompleteLoad(results);

await sagaTester.waitFor(expectedLoadAction.type);
mockApi.verify();

const loadAction = sagaTester.getCalledActions()[2];
expect(loadAction).toEqual(expectedLoadAction);
```

## Testing UI components

We use [React Testing Library](https://github.com/testing-library/react-testing-library) for testing UI components (React components). Below are a few rules regarding our use of React Testing Library:

- When locating an element, prefer methods that mirror how a user might find an element, such as `getByRole`, `getByText`, `getByTitle` and `getByAltText`. If available, prefer `getByRole`, which can accept additional options such as `name`. Along the same lines, avoid the use of `getElement`, `getByClassName` and `getByTagName` unless absolutely necessary.
- If a component is only used by a single parent, add tests for the component into the test suite for the parent, and render the component in the context of the parent.
- For page components, use `renderPage` from `tests/unit/helpers`, otherwise use `render`.
- `render` and `renderPage` will provide an instance of `history`, `i18n` and `store` to your component. Unless you need to interact with and/or assert about one of these in your test, you do not need to provide one to you call to `render`.
- when interacting with UI elements, prefer `userEvent` over `fireEvent`. The latter seems to be necessary when needing to listen for calls to `stopPropagation` and `preventDefault`. Note that calls to `userEvent` functions should always be `await`ed.
