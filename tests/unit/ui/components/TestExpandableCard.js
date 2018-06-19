import { mount } from 'enzyme';
import * as React from 'react';

import ExpandableCard, {
  ExpandableCardBase,
} from 'ui/components/ExpandableCard';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

function render(props) {
  return shallowUntilTarget(
    <ExpandableCard i18n={fakeI18n()} {...props} />,
    ExpandableCardBase,
  );
}

describe(__filename, () => {
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
    // We have to mount for this test because of the usage of `setState`
    // in this component.
    const root = mount(<ExpandableCard i18n={fakeI18n()} />);
    const card = () => root.find('.ExpandableCard');
    const fakeEvent = createFakeEvent();

    // Clicking on the toggle should expand the card.
    root.find('.ExpandableCard-ToggleLink').simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    expect(card()).toHaveClassName('ExpandableCard--expanded');

    // Clicking on the toggle again should set the card to be unexpanded.
    fakeEvent.preventDefault.resetHistory();
    root.find('.ExpandableCard-ToggleLink').simulate('click', fakeEvent);

    sinon.assert.called(fakeEvent.preventDefault);
    expect(card()).not.toHaveClassName('ExpandableCard--expanded');
  });

  it('renders className', () => {
    const root = render({ className: 'test' });

    const card = root.find('.ExpandableCard');
    expect(card).toHaveClassName('test');
  });

  it('renders children', () => {
    const root = render({ children: <p>Hello I am description</p> });
    const contents = root.find('.ExpandableCard-contents');

    expect(contents).toHaveText('Hello I am description');
  });
});
