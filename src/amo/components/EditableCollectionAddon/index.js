/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Icon from 'ui/components/Icon';
import type { RemoveCollectionAddonFunc } from 'amo/components/Collection';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType,
  className?: string,
  i18n: I18nType,
  removeAddon: RemoveCollectionAddonFunc,
|};

export class EditableCollectionAddonBase extends React.Component<Props> {
  onRemoveAddon = (event: SyntheticEvent<any>) => {
    const { addon: { id: addonId }, removeAddon } = this.props;

    event.preventDefault();
    event.stopPropagation();

    invariant(addonId, 'addonId is required');

    removeAddon(addonId);
  };

  render() {
    const { addon, className, i18n } = this.props;

    const iconURL = getAddonIconUrl(addon);
    return (
      <li className={makeClassName('EditableCollectionAddon', className)}>
        <img className="EditableCollectionAddon-icon" src={iconURL} alt="" />
        <h2 className="EditableCollectionAddon-name">
          {addon.name}
        </h2>
        <div className="EditableCollectionAddon-comments-icon">
          <Icon name="comments" />
        </div>
        <div className="EditableCollectionAddon-remove-button">
          <Button
            name={addon.id}
            buttonType="alert"
            onClick={this.onRemoveAddon}
            micro
          >
            {i18n.gettext('Remove')}
          </Button>
        </div>
      </li>
    );
  }
}

export default compose(
  translate(),
)(EditableCollectionAddonBase);
