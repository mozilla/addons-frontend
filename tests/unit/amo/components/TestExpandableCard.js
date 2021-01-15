import * as React from 'react';
import { shallow } from 'enzyme';

import ExpandableCard, {
  ExpandableCardBase,
  extractId,
} from 'amo/components/ExpandableCard';
import {
  applyUIStateChanges,
  createFakeEvent,
  dispatchClientMetadata,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const getProps = ({ i18n = fakeI18n(), ...props } = {}) => {
    return {
      i18n,
      id: 'expandableCard',
      store: dispatchClientMetadata().store,
      ...props,
    };
  };

  function render({ children, ...otherProps } = {}) {
    const props = getProps(otherProps);
    return shallowUntilTarget(
      <ExpandableCard {...props}>{children || 'some info'}</ExpandableCard>,
      ExpandableCardBase,
    );
  }

  it('renders a ExpandableCard', () => {
    const root = render();

    expect(root.find('.ExpandableCard')).toHaveLength(1);
  });

  it('is unexpanded by default', () => {
    const root = render();
    const card = root.find('.ExpandableCard');

    expect(card).not.toHaveClassName('ExpandableCard--expanded');
  });

  it('toggles when clicked', () => {
    const { store } = dispatchClientMetadata();

    const root = render({ store });

    expect(root).toHaveProp('header');
    const cardHeader = root.prop('header');
    const header = shallow(cardHeader);
    const link = header.find('.ExpandableCard-ToggleLink');

    // This toggles to make expanded true.
    link.simulate('click', createFakeEvent());

    applyUIStateChanges({ root, store });

    expect(root.find('.ExpandableCard--expanded')).toHaveLength(1);

    // This toggles to make expanded false.
    link.simulate('click', createFakeEvent());

    applyUIStateChanges({ root, store });

    expect(root.find('.ExpandableCard--expanded')).toHaveLength(0);
  });

  it('renders className', () => {
    const root = render({ className: 'test' });

    const card = root.find('.ExpandableCard');
    expect(card).toHaveClassName('test');
  });

  it('renders children', () => {
    const root = render({ children: 'Hello I am description' });
    const contents = root.find('.ExpandableCard-contents');

    expect(contents).toHaveText('Hello I am description');
  });

  describe('extractId', () => {
    it('returns a unique ID provided by the ID prop', () => {
      const id = 'custom-card-id';
      expect(extractId(getProps({ id }))).toEqual(id);
    });
  });
});
