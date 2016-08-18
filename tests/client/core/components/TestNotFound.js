import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';

import NotFound from 'core/components/NotFound';

describe('<NotFound />', () => {
  const root = renderIntoDocument(<NotFound />);

  it('sets a heading', () => {
    assert.equal(
      root.refs.heading.textContent, "We're sorry, but we can't find what you're looking for.");
  });
});
