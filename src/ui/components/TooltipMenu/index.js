/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';
import RCTooltip from 'rc-tooltip';

import ListItem from 'ui/components/ListItem';

import './styles.scss';

type Props = {|
  idPrefix?: string,
  items: Array<React.Element<typeof ListItem>>,
  openerClass?: string,
  openerText: string,
  openerTitle?: string,
|};

export default class TooltipMenu extends React.Component<Props> {
  render() {
    const {
      idPrefix, items, openerClass, openerText, openerTitle,
    } = this.props;

    // This will tell a screen reader to read the menu when focusing
    // on the opener.
    const describedBy = `${idPrefix || ''}TooltipMenu`;

    return (
      <RCTooltip
        align={{ offset: [0, 6] }}
        destroyTooltipOnHide
        id={describedBy}
        overlay={
          <ul className="TooltipMenu-list">
            {items}
          </ul>
        }
        placement="bottom"
        prefixCls="TooltipMenu"
        trigger={['click']}
      >
        <button
          className={makeClassName('TooltipMenu-opener', openerClass)}
          aria-describedby={describedBy}
          title={openerTitle}
        >
          {openerText}
        </button>
      </RCTooltip>
    );
  }
}
