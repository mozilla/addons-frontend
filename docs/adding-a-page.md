# addons-frontend

This will outline what is required to add a page to the project. A basic knowledge of
[react](https://facebook.github.io/react/docs/getting-started.html) and
[redux](http://redux.js.org/) is assumed.

## Structure

A basic app structure will look like this:

```
src/
  <app-name>/
    components/
      MyComponent/
        index.js
        styles.scss
    containers/
      MyContainer/
        index.js
        styles.scss
    reducers/
    client.js
    routes.js
    store.js
tests/
  client/
    <app-name>/
      components/
        TestMyComponent.js
      containers/
        TestMyContainer.js
      reducers/
```

## Components vs Containers

A component should have no usage of redux in it. It only operates on the data passed into it
through props. A container will use redux to connect data from the store to a component. A
container may or may not wrap a component, whatever makes sense to you.

# How to Add a Page

We'll make a basic user profile component that hits the API. We'll start by creating a basic
component with data set manually, then we'll hit the API to populate redux, then we'll update the
component to pull its data from the redux store.

## Creating a Component

We'll create our component in the search app since it will use the currently logged in user. Our
component is going to show the currently logged in user's email address and username. To start
we'll create a component without any outside data.

### Basic component

```jsx
// src/search/containers/UserPage/index.js
import React from 'react';

export default class UserPage extends React.Component {
  render() {
    return (
      <div className="user-page">
        <h1>Hi there!</h1>
        <ul>
          <li>username: my-username</li>
          <li>email: me@example.com</li>
        </ul>
      </div>
    );
  }
}
```

### Adding a route

To render this component we'll tell [react-router](https://github.com/reactjs/react-router) to load
it at the `/user` path.

```jsx
// src/search/routes.js
// ... omit imports

export default (
  <Route path="/" component={App}>
    <Route component={LoginRequired}>
      <Route path="search">
        <IndexRoute component={CurrentSearchPage} />
        <Route path="addons/:slug" component={AddonPage} />
      </Route>
      // Add this line to use the `UserPage` component at the `/user` path.
      <Route path="user" component={UserPage} />
    </Route>
    <Route path="fxa-authenticate" component={HandleLogin} />
  </Route>
);
```

### Starting the server

Now that the component is setup we can run `npm start dev:search` and navigate to
[http://localhost:3000/user](http://localhost:3000/user) to see the page. Since our component is
wrapped in the `LoginRequired` component you will need to be logged in to see the page.

### Using props

We want our component's data to be able to change based on the current user. For now we'll update
the component so that it uses props but we won't yet connect it to redux. We will however use
react-redux's `connect()` to set the props for us as if it were pulling the data from redux.

```jsx
// src/search/containers/UserPage/index.js
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

class UserPage extends React.Component {
  static propTypes = {
    email: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }

  render() {
    const { email, username } = this.props;
    return (
      <div className="user-page">
        <h1>Hi there!</h1>
        <ul>
          <li>username: {username}</li>
          <li>email: {email}</li>
        </ul>
      </div>
    );
  }
}

function mapStateToProps() {
  return {
    email: 'me@example.com',
    username: 'my-username',
  };
}

export default compose(
  connect(mapStateToProps),
)(UserPage);
```

Changing the values in `mapStateToProps` will now update the values shown on the page.

NOTE: You may need to restart your server to see any changes as there is currently a bug that
does not update the server rendered code on the dev server.

### Making API Requests

To access the user's data we'll add a new API function and a
[`normalizr`](https://github.com/paularmstrong/normalizr) schema for user objects. Our API function
will be pretty basic since it will use our internal `callApi()` function to handle accessing the
API along with the `normalizr` schema to format the response data.

```js
// src/core/api/index.js
// ... omit imports

const addon = new schema.Entity('addons', {}, { idAttribute: 'slug' });
// Tell normalizr we have "users" and they use the `username` property for
// their primary key.
const user = new schema.Entity('users', {}, { idAttribute: 'username' });

// Add this function.
export function fetchProfile({ api }) {
  return callApi({
    endpoint: 'accounts/profile',
    schema: user,
    params: { lang: 'en-US' },
    auth: true,
    state: api,
  });
}
```

Calling the `fetchProfile()` function will hit the API, now we need to get the data into redux. We
can use the `loadEntities()` action creator to dispatch a generic action for loading data from our
API but we'll need to add a users reducer to store the data.

```js
// src/core/reducers/users.js
export default function users(state = {}, { payload = {} }) {
  if (payload.entities && payload.entities.users) {
    return {...state, ...payload.entities.users};
  }
  return state;
}
```

No we need to tell the app to use the reducer by adding it to our store.

```js
// src/search/store.js
import users from 'core/reducers/users';

export default function createStore(initialState = {}) {
  return _createStore(
    // Add the `users` reducer here.
    combineReducers({addons, api, auth, search, reduxAsyncConnect, users}),
    initialState,
    middleware(),
  );
}
```

We also don't have any record of the user's username. We'll need that to pull the right user. We
can update the `auth` reducer to store it.

```js
// src/core/reducers/authentication.js
export default function authentication(state = {}, action) {
  const { payload, type } = action;
  if (type === 'SET_JWT') {
    return {token: payload.token};
  } else if (type === 'SET_CURRENT_USER') {
    return {...state, username: payload.username};
  }
  return state;
}
```

We'll also want to add an action creator to set the current user. The action creator just
simplifies interacting with redux to keep the code clean.

```js
// src/search/actions/index.js

// Add this at the bottom of the file.
export function setCurrentUser(username) {
  return {
    type: 'SET_CURRENT_USER',
    payload: {
      username,
    },
  };
}
```

### Combining redux and the API

Now that we can hit the API and we can store that data in the redux store we need to update our
component to hit the API, update the store, and pull the data from the store. To do this we will
use [redux-connect](https://github.com/makeomatic/redux-connect)'s `asyncConnect()`.

```jsx
// src/search/containers/AddonPage/index.js
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { asyncConnect } from 'redux-connect';

import { loadEntities, setCurrentUser } from 'core/actions';
import { fetchProfile } from 'core/api';

class UserPage extends React.Component {
  static propTypes = {
    email: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
  }

  render() {
    const { email, username } = this.props;
    return (
      <div className="user-page">
        <h1>Hi there!</h1>
        <ul>
          <li>username: {username}</li>
          <li>email: {email}</li>
        </ul>
      </div>
    );
  }
}

function getUser({ auth, users }) {
  return users[auth.username];
}

function mapStateToProps(state) {
  return getUser(state);
}

function loadProfileIfNeeded({ store: { getState, dispatch } }) {
  const state = getState();
  const user = getUser(state);
  if (!user) {
    return fetchProfile({api: state.api})
      .then(({entities, result}) => {
        dispatch(loadEntities(entities));
        dispatch(setCurrentUser(result));
      });
  }
  return Promise.resolve();
}

export default compose(
  asyncConnect([{
    deferred: true,
    promise: loadProfileIfNeeded,
  }]),
  connect(mapStateToProps),
)(UserPage);
```

### Styling the page

To style your page you just need to import your SCSS file in your component. All of the CSS will
be transpiled and minified into a single bundle in production so you will still need to namespace
your styles.

```js
// src/search/containers/AddonPage/index.js
// Add this line with the other imports.
import './styles.scss';
```

```scss
// src/search/containers/AddonPage/styles.scss
.user-page {
  h1 {
    text-decoration: underline;
  }
  li {
    text-transform: uppercase;
  }
}
```
