import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { asyncConnect } from 'redux-connect';

import { loadEntities, setCurrentUser } from 'core/actions';
import { fetchProfile } from 'core/api';
import { safePromise } from 'core/utils';

import './styles.scss';

export class UserPageBase extends React.Component {
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

export function mapStateToProps(state) {
  return getUser(state);
}

export function loadProfileIfNeeded({ store: { getState, dispatch } }) {
  const state = getState();
  const user = getUser(state);
  if (!user) {
    return fetchProfile({ api: state.api })
      .then(({ entities, result }) => {
        dispatch(loadEntities(entities));
        dispatch(setCurrentUser(result));
      });
  }
  return Promise.resolve();
}

export default asyncConnect([{
  key: 'UserPage',
  deferred: true,
  promise: safePromise(loadProfileIfNeeded),
}])(connect(mapStateToProps)(UserPageBase));
