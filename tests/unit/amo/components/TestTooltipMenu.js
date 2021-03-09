import { mount, shallow } from 'enzyme';
import * as React from 'react';
import RCTooltip from 'rc-tooltip';

import ListItem from 'amo/components/ListItem';
import TooltipMenu from 'amo/components/TooltipMenu';

describe(__filename, () => {
  const renderProps = (customProps = {}) => {
    return {
      openerText: 'Open menu',
      items: [<ListItem key="first" />],
      ...customProps,
    };
  };

  const render = (customProps = {}) => {
    return shallow(<TooltipMenu {...renderProps(customProps)} />);
  };

  const renderAndMount = (customProps = {}) => {
    return mount(<TooltipMenu {...renderProps(customProps)} />);
  };

  it('renders an opener with a custom class', () => {
    const root = render({ openerClass: 'MyClass' });

    const opener = root.find('.TooltipMenu-opener');
    expect(opener).toHaveClassName('MyClass');
  });

  it('accepts a custom className', () => {
    const root = render({ className: 'CustomClass' });

    const opener = root.find('.TooltipMenu-opener');
    expect(opener).toHaveClassName('CustomClass');
  });

  it('works with both a custom className and an openerClass', () => {
    const root = render({ className: 'CustomClass', openerClass: 'MyClass' });

    const opener = root.find('.TooltipMenu-opener');
    expect(opener).toHaveClassName('MyClass');
    expect(opener).toHaveClassName('CustomClass');
  });

  it('renders an opener with text', () => {
    const openerText = 'Open the thing';
    const root = render({ openerText });

    expect(root.find('.TooltipMenu-opener')).toHaveText(openerText);
  });

  it('renders an opener with a title', () => {
    const openerTitle = 'Open the tooltip menu. Thanks.';
    const root = render({ openerTitle });

    expect(root.find('.TooltipMenu-opener')).toHaveProp('title', openerTitle);
  });

  it('can create an aria-describedby ID with a prefix', () => {
    const root = render({ idPrefix: 'myId-' });

    expect(root.find(RCTooltip)).toHaveProp('id', 'myId-TooltipMenu');
  });

  it('renders menu items', () => {
    const items = [
      <ListItem key="first" className="FirstItem" />,
      <ListItem key="second" className="SecondItem" />,
    ];
    const root = render({ items });

    const rcTooltip = root.find(RCTooltip);
    expect(rcTooltip).toHaveProp('overlay');

    const overlay = shallow(rcTooltip.prop('overlay'));
    expect(overlay.find('.FirstItem')).toHaveLength(1);
    expect(overlay.find('.SecondItem')).toHaveLength(1);
  });

  it('attaches the tooltip to a container element', () => {
    const root = renderAndMount();

    const tooltip = root.find(RCTooltip);
    expect(tooltip).toHaveProp('getTooltipContainer');

    const getContainer = tooltip.prop('getTooltipContainer');
    const div = getContainer();

    // This checks that a DOM node ref was returned.
    // Attaching the tooltip to a nearby container (as opposed to the
    // body) is necessary for keyboard accessibility.
    expect(div).toBeDefined();
  });
});
