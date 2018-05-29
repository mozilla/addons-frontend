import * as React from 'react';

import EditableCollectionAddon, {
  EditableCollectionAddonBase,
} from 'amo/components/EditableCollectionAddon';
import fallbackIcon from 'amo/img/icons/default-64.png';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeEvent,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';

describe(__filename, () => {
  function render(props = {}) {
    return shallowUntilTarget(
      <EditableCollectionAddon
        addon={props.addon || createInternalAddon(fakeAddon)}
        i18n={fakeI18n()}
        removeAddon={sinon.stub()}
        {...props}
      />,
      EditableCollectionAddonBase
    );
  }

  it('renders a className if provided', () => {
    const className = 'testClassName';
    const root = render({ className });
    expect(root).toHaveClassName(className);
  });

  it("renders the add-on's icon", () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });
    expect(root.find('.EditableCollectionAddon-icon'))
      .toHaveProp('src', addon.icon_url);
  });

  it('renders the fallback icon if the origin is not allowed', () => {
    const addon = createInternalAddon({
      ...fakeAddon,
      icon_url: 'http://foo.com/hax.png',
    });
    const root = render({ addon });
    expect(root.find('.EditableCollectionAddon-icon'))
      .toHaveProp('src', fallbackIcon);
  });

  it('renders the comments icon', () => {
    const root = render();
    expect(root.find(Icon)).toHaveProp('name', 'comments');
  });

  it('renders the remove button icon', () => {
    const addon = createInternalAddon(fakeAddon);
    const root = render({ addon });
    const button = root.find(Button);
    expect(button).toHaveProp('name', addon.id);
    expect(button.prop('children')).toEqual('Remove');
  });

  it('calls the removeAddon function when the remove button is clicked', () => {
    const addon = createInternalAddon(fakeAddon);
    const removeAddon = sinon.spy();
    const root = render({ addon, removeAddon });

    const removeButton = root.find(Button);
    const clickEvent = createFakeEvent();
    removeButton.simulate('click', clickEvent);

    sinon.assert.called(clickEvent.preventDefault);
    sinon.assert.called(clickEvent.stopPropagation);
    sinon.assert.calledWith(removeAddon, addon.id);
  });
});
