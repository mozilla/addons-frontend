/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import RCTooltip from 'rc-tooltip';

import ListItem from 'amo/components/ListItem';

import './styles.scss';

type Props = {|
  idPrefix?: string,
  items: Array<null | React.Element<typeof ListItem>>,
  openerClass?: string,
  openerText: string,
  openerTitle?: string,
|};

export default class TooltipMenu extends React.Component<Props> {
  container: React.ElementRef<'div'> | null;

  render(): React.Element<"div"> {
    const {
      idPrefix,
      items,
      openerClass,
      openerText,
      openerTitle,
    } = this.props;

    // This will tell a screen reader to read the menu when focusing
    // on the opener.
    const describedBy = `${idPrefix || ''}TooltipMenu`;

    return (
      <div
        ref={(ref) => {
          this.container = ref;
        }}
      >
        <RCTooltip
          align={{ offset: [0, 6] }}
          getTooltipContainer={() => this.container}
          destroyTooltipOnHide
          id={describedBy}
          overlay={<ul className="TooltipMenu-list">{items}</ul>}
          placement="bottom"
          prefixCls="TooltipMenu"
          trigger={['click']}
        >
          <button
            aria-describedby={describedBy}
            className={makeClassName('TooltipMenu-opener', openerClass)}
            title={openerTitle}
            type="button"
          >
            {openerText}
          </button>
        </RCTooltip>
      </div>
    );
  }
}
