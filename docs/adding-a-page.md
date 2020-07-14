# How to Add a Page

**Note:** this page needs to be expanded.

A basic knowledge of [react](https://facebook.github.io/react/docs/getting-started.html) and [redux](http://redux.js.org/) is assumed.

We follow the [Ducks proposal](https://github.com/erikras/ducks-modular-redux) to create isolated and self contained modules including reducers, action types and action creators. See `src/core/reducers/autocomplete.js` for an example of a Ducks module. We use [redux-saga](https://github.com/redux-saga/redux-saga) for API requests. See `src/amo/components/Categories/index.js` for an example of a component that makes API/async requests for data and `src/core/sagas/autocomplete.js` for an example of a saga. Each reducer, saga, component has a corresponding test file. Please refer to it to know how to properly test your code and read [our dedicated page to testing](./testing.md).
