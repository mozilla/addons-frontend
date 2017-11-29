/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import Select from 'ui/components/Select';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { UserStateType } from 'core/reducers/user';

import './styles.scss';


type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
  siteUserId: number | null,
|};

export class AddAddonToCollectionBase extends React.Component<Props> {
  add(event: SyntheticEvent<any>) {
    event.preventDefault();
    console.log('clicked add button');
  }

  render() {
    const { addon, i18n } = this.props;

    return (
      <Card
        className="AddAddonToCollection"
        header={i18n.gettext('Collections')}
      >
        <p className="AddAddonToCollection-prompt">
          {i18n.sprintf(
            i18n.gettext('Add %(addonName)s to a collection'),
            { addonName: addon.name }
          )}
        </p>
        <div className="AddAddonToCollection-control">
          <Select className="AddAddonToCollection-select">
            <option>{i18n.gettext('Choose a collection')}</option>
          </Select>
          <Button
            className="AddAddonToCollection-add Button--action"
            onClick={this.add}
          >
            {i18n.gettext('Add')}
          </Button>
        </div>
      </Card>
    );
  }
}

export const mapStateToProps = (state: {| user: UserStateType |}) => {
  return {
    siteUserId: state.user.id,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(AddAddonToCollectionBase);
