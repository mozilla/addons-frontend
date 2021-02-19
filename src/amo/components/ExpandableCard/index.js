/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'amo/i18n/translate';
import withUIState from 'amo/withUIState';
import Card from 'amo/components/Card';
import Icon from 'amo/components/Icon';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type UIStateType = {|
  expanded: boolean,
|};

type Props = {|
  children: React.Element<any> | string,
  className?: string,
  header?: React.Element<any> | string,
  id: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  setUIState: ($Shape<UIStateType>) => void,
  uiState: UIStateType,
|};

const initialUIState: UIStateType = { expanded: false };

export class ExpandableCardBase extends React.Component<InternalProps> {
  onClick: ((event: SyntheticEvent<any>) => void) = (event: SyntheticEvent<any>) => {
    const { uiState } = this.props;
    event.preventDefault();

    this.props.setUIState({ expanded: !uiState.expanded });
  };

  render(): React.Node {
    const { children, className, header, id, i18n, uiState } = this.props;
    const { expanded } = uiState;

    invariant(children, 'The children property is required');
    invariant(id, 'The id property is required');

    const headerWithExpandLink = (
      <a
        aria-checked={expanded}
        className="ExpandableCard-ToggleLink"
        href="#toggle-content"
        onClick={this.onClick}
        role="switch"
        title={i18n.gettext('Toggle contents')}
      >
        {header}
        <Icon
          className="ExpandableCard-ToggleArrow"
          name="triangle-down-black"
        />
      </a>
    );

    return (
      <Card
        className={makeClassName('ExpandableCard', className, {
          'ExpandableCard--expanded': expanded,
        })}
        header={headerWithExpandLink}
      >
        <div className="ExpandableCard-contents">{children}</div>
      </Card>
    );
  }
}

export const extractId = (props: Props): string => {
  return props.id;
};

const ExpandableCard: React.ComponentType<Props> = compose(
  translate(),
  withUIState({
    fileName: __filename,
    extractId,
    initialState: initialUIState,
  }),
)(ExpandableCardBase);

export default ExpandableCard;
