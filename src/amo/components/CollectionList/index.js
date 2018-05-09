/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CollectionManager from 'amo/components/CollectionManager';
import { getCurrentUser } from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import type { UsersStateType } from 'amo/reducers/users';
import type { I18nType } from 'core/types/i18n';
import type { ReactRouterLocation } from 'core/types/router';

import './styles.scss';


export type Props = {|
  creating: boolean,
  i18n: I18nType,
  isLoggedIn: boolean,
  location: ReactRouterLocation,
|};

export class CollectionListBase extends React.Component<Props> {
  static defaultProps = {
    creating: false,
  };

  renderManager() {
    const { creating, i18n, isLoggedIn, location } = this.props;
    if (creating) {
      if (!isLoggedIn) {
        return (
          <AuthenticateButton
            noIcon
            location={location}
            logInText={i18n.gettext('Log in to create a collection')}
          />
        );
      }
      return <CollectionManager {...this.props} creating />;
    }
    return null;
  }

  render() {
    const { i18n, isLoggedIn } = this.props;

    return (
      <div className="CollectionList">
        <div className="CollectionList-wrapper">
          <Card className="CollectionList-create">
            {this.renderManager()}
          </Card>
          {isLoggedIn &&
            <p className="CollectionList-placeholder">
              {i18n.gettext(
                'Please save your collection and then you can add add-ons to it')
              }
            </p>
          }
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (
  state: {| users: UsersStateType |}
) => {
  return {
    isLoggedIn: !!getCurrentUser(state.users),
  };
};

export default compose(
  translate(),
  connect(mapStateToProps),
)(CollectionListBase);
