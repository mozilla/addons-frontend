/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
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
  }

  render() {
    const { addon, i18n } = this.props;

    return (
      <div>
        <Select className="AddAddonToCollection-select">
          <option>{i18n.gettext('Add to collection')}</option>
        </Select>
      </div>
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
