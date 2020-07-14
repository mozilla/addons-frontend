# Testing

We want to maintain a project with a high coverage (aiming for 100%). Our main [coverage criterion](https://en.wikipedia.org/wiki/Code_coverage#Coverage_criteria) is **branch coverage**, that is making sure all possible code branches are covered by test. At an absolute bare minimum, we require 100% line coverage. [Codecov](https://codecov.io/gh/mozilla/addons-frontend) monitors our test coverage for every Pull Request. You can make sure you haven't decreased coverage by checking the Pull Request on GitHub. You can also [generate a coverage report locally](https://github.com/mozilla/addons-frontend/#code-coverage).

## General guidelines

- Imports should be alphabetized, even in test files.
- Comments should be full sentences to ease readability.
- There are a lot of helpers in the `tests/unit/helpers` and `tests/unit/amo/helpers` modules–please use them.
- Use action creators in `amo/actions/` and `core/actions/` instead of hard-coding `dispatch()` arguments or state data for tests. This applies to both UI components and reducers/sagas.
- Use constants (see `core/constants`) when using the same value across files. This avoids hard-coding values and [magic constants](https://en.wikipedia.org/wiki/Magic_constant).

## Jest

[Jest](https://facebook.github.io/jest/docs/en/getting-started.html) is our main testing framework. Please refer to the [`README` section about running the test suite](https://github.com/mozilla/addons-frontend#running-tests) to know how to run the tests. Below are a few rules regarding Jest:

- Prefer `toEqual()` over `toBe()`.
- Do not use `expect.assertions(N)`, this is hard to maintain. Instead, add a `catch()` branch to detect unexpected errors.

When creating a new test file, start with a `describe()` block that takes the current file name as first argument. This makes easy to find/edit a failing test case as Jest will display the test file in its output:

```js
describe(__filename, () => {});
```

## Spies/Stubs/Mocks and Sinon.JS

We use [sinon](http://sinonjs.org/) for spies, stubs and mocks. In addition, we use [sinon assertions](http://sinonjs.org/releases/v3.2.1/assertions/) over Jest expectations because failure messages are more descriptive.

```js
const spy = sinon.spy();
// ...

// NOT GOOD
expect(spy.called).toEqual(true);

// GOOD
sinon.assert.called(spy);
```

There is no need to import sinon, it is already in the global scope for all test files.

## Testing reducers and sagas

For sagas/reducers, there are two useful helpers: `dispatchClientMetadata()` and `dispatchSignInActions()` (`tests/unit/amo/helpers`) that should be used to initialize state in a realistic manner. The former is used to obtain a non-authenticated state while the latter returns an authenticated state.

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

We use [Enzyme](http://airbnb.io/enzyme/docs/api/index.html) for testing UI components (React components). You should test the final component ideally. Below are a few rules regarding Enzyme:

- Prefer `shallow()` over `mount()` when it makes sense.
- Assert components on public properties (props), _e.g._:

  ```js
  expect(root.find(Badge)).toHaveProp('type', 'experimental');
  ```

- You can use `shallowUntilTarget()` (`tests/unit/helpers`) for testing a component wrapped in one or more HOCs (higher order components). See `tests/unit/core/components/TestInstallButton.js` for an example of a test case with this helper.
