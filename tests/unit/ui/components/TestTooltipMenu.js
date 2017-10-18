import { shallow } from 'enzyme';
import React from 'react';
import RCTooltip from 'rc-tooltip';

import ListItem from 'ui/components/ListItem';
import TooltipMenu from 'ui/components/TooltipMenu';


describe(__filename, () => {
  const render = (customProps = {}) => {
    const props = {
      openerText: 'Open menu',
      items: [<ListItem key="first" />],
      ...customProps,
    };
    return shallow(<TooltipMenu {...props} />);
  };

  it('renders an opener with a custom class', () => {
    const root = render({ openerClass: 'MyClass' });

    const opener = root.find('.TooltipMenu-opener');
    expect(opener).toHaveClassName('MyClass');
  });

  it('renders an opener with text', () => {
    const openerText = 'Open the thing';
    const root = render({ openerText });

    expect(root.find('.TooltipMenu-opener')).toHaveText(openerText);
  });

  it('renders an opener with a title', () => {
    const openerTitle = 'Open the tooltip menu. Thanks.';
    const root = render({ openerTitle });

    expect(root.find('.TooltipMenu-opener'))
      .toHaveProp('title', openerTitle);
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
});
