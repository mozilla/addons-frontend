import { mount } from 'enzyme';
import * as React from 'react';

import { setHeroBannerOrder } from 'amo/reducers/heroBanners';
import Hero from 'amo/components/Hero';
import { dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  const defaultProps = {
    store: dispatchClientMetadata().store,
  };
  let dispatchSpy;

  beforeEach(() => {
    dispatchSpy = sinon.spy(defaultProps.store, 'dispatch');
  });

  // We mount certain tests to ensure lifecycle methods like componentDidMount
  // are called.
  // See: https://github.com/mozilla/addons-frontend/issues/3349
  function mountRender({ ...props } = {}) {
    return mount(<Hero {...defaultProps} {...props} />);
  }

  it('renders a Hero', () => {
    const name = 'TestingPage';
    const sections = [
      <p className="something" key="something">
        Hello!
      </p>,
      <p className="something-else" key="something-else">
        Bonjour !
      </p>,
    ];
    const root = mountRender({ name, random: true, sections });

    sinon.assert.calledWith(
      dispatchSpy,
      setHeroBannerOrder({ name, random: true, sections }),
    );
    expect(root.find('.Card.Hero')).toHaveLength(1);
    expect(root.find('.Card.Hero-name-TestingPage')).toHaveLength(1);
    expect(root.find('.something')).toHaveLength(1);
    expect(root.find('.something-else')).toHaveLength(1);
  });
});
