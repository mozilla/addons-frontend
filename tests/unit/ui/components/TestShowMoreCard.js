import * as React from 'react';
import { shallow } from 'enzyme';

import ShowMoreCard, {
  extractId,
  ShowMoreCardBase,
  MAX_HEIGHT,
} from 'ui/components/ShowMoreCard';
import {
  applyUIStateChanges,
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const getProps = ({ i18n = fakeI18n(), ...props } = {}) => {
    return {
      i18n,
      id: 'showMoreCard',
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  function render({ children, ...otherProps } = {}) {
    const props = getProps(otherProps);
    return shallowUntilTarget(
      <ShowMoreCard {...props}>{children || 'some info'}</ShowMoreCard>,
      ShowMoreCardBase,
    );
  }

  it('reveals more text when clicking "show more" link', () => {
    const { store } = dispatchClientMetadata();
    const root = render({ store });

    expect(root).not.toHaveClassName('ShowMoreCard--expanded');

    expect(root).toHaveProp('footerLink');
    const footerLink = root.prop('footerLink');
    const cardLink = shallow(footerLink);
    const moreLink = cardLink.find('.ShowMoreCard-expand-link');

    moreLink.simulate('click', createFakeEvent());

    applyUIStateChanges({ root, store });

    expect(root).toHaveClassName('ShowMoreCard--expanded');
  });

  it('is unexpanded by default', () => {
    const root = render();

    expect(root).not.toHaveClassName('ShowMoreCard--expanded');
  });

  it('truncates the contents if they are too long', () => {
    const root = render();

    // We are simulating the truncate method call on did mount.
    root.instance().truncateToMaxHeight({ clientHeight: MAX_HEIGHT + 1 });
    root.update();
    expect(root).not.toHaveClassName('ShowMoreCard--expanded');
  });

  it('renders className', () => {
    const className = 'test';
    const root = render({ className });
    expect(root).toHaveClassName(className);
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });
    const contents = root.find('.ShowMoreCard-contents');
    expect(contents).toHaveText('Hello I am description');
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-card-id';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
