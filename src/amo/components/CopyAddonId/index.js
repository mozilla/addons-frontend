/* @flow */
/* global navigator */
import * as React from 'react';
import { compose } from 'redux';

import Icon from 'amo/components/Icon';
import translate from 'amo/i18n/translate';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addonId: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

type State = {| copied: boolean |};

export class CopyAddonIdBase extends React.Component<InternalProps, State> {
  state: State = { copied: false };

  onClick: (SyntheticEvent<HTMLAnchorElement>) => void = (event) => {
    event.preventDefault();
    navigator.clipboard.writeText(this.props.addonId).then(() => {
      this.setState({ copied: true });
    });
  };

  render(): React.Node {
    const { i18n } = this.props;

    if (this.state.copied) {
      return (
        <span className="CopyAddonId">
          <Icon name="check-mark" />
          {i18n.gettext('Add-on ID copied')}
        </span>
      );
    }

    return (
      // eslint-disable-next-line jsx-a11y/anchor-is-valid
      <a className="CopyAddonId" href="#" onClick={this.onClick}>
        <Icon name="copy" />
        {i18n.gettext('Copy add-on ID')}
      </a>
    );
  }
}

const CopyAddonId: React.ComponentType<Props> =
  compose(translate())(CopyAddonIdBase);

export default CopyAddonId;
