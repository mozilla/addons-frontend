import * as React from 'react';

import SignedInUser from 'amo/components/SignedInUser';
import { getCurrentUser } from 'amo/reducers/users';
import { dispatchSignInActions, render, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  const getUser = (userProps = {}) => {
    const { state } = dispatchSignInActions({ userProps });
    return getCurrentUser(state.users);
  };

  it('renders the user name', () => {
    const username = 'some username';

    render(<SignedInUser user={getUser({ username })} />);

    expect(screen.getByText(`Signed in as ${username}`)).toBeInTheDocument();
  });
});
