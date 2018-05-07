/* @flow */
import * as React from 'react';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ReportUserAbuse from 'amo/components/ReportUserAbuse';
import { fetchUserAccount, getUserByUsername } from 'amo/reducers/users';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import { removeProtocolFromURL, sanitizeUserHTML } from 'core/utils';
import Card from 'ui/components/Card';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import UserAvatar from 'ui/components/UserAvatar';
import type { UsersStateType, UserType } from 'amo/reducers/users';
import type { DispatchFunc } from 'core/types/redux';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';


type Props = {|
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  params: {| username: string |},
  user?: UserType,
|};

export class UserProfileBase extends React.Component<Props> {
  componentWillMount() {
    const { dispatch, errorHandler, params, user } = this.props;

    if (!user) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username: params.username,
      }));
    }
  }

  componentWillReceiveProps({ params: newParams }: Props) {
    const { dispatch, errorHandler, params: oldParams } = this.props;

    if (oldParams.username !== newParams.username) {
      dispatch(fetchUserAccount({
        errorHandlerId: errorHandler.id,
        username: newParams.username,
      }));
    }
  }

  render() {
    const {
      errorHandler,
      i18n,
      params,
      user,
    } = this.props;

    let errorMessage;
    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);

      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFound errorCode={errorHandler.capturedError.code} />;
      }

      errorMessage = errorHandler.renderError();
    }

    const userProfileHeader = (
      <React.Fragment>
        <UserAvatar className="UserProfile-avatar" user={user} />

        <h1 className="UserProfile-name">
          {user ? user.displayName : <LoadingText />}
        </h1>
      </React.Fragment>
    );
    const userProfileTitle = i18n.sprintf(
      i18n.gettext('User Profile for %(user)s'), {
        user: user ? user.displayName : params.username,
      }
    );

    return (
      <div className="UserProfile">
        <Helmet>
          <title>{userProfileTitle}</title>
        </Helmet>

        {errorMessage}

        <div className="UserProfile-wrapper">
          <Card
            className="UserProfile-user-info"
            header={userProfileHeader}
          >
            <DefinitionList className="UserProfile-dl">
              {user && user.homepage ? (
                <Definition
                  className="UserProfile-homepage"
                  term={i18n.gettext('Homepage')}
                >
                  <a href={user.homepage}>
                    {removeProtocolFromURL(user.homepage)}
                  </a>
                </Definition>
              ) : null}
              <Definition
                className="UserProfile-user-since"
                term={i18n.gettext('User since')}
              >
                {user ? i18n.moment(user.created).format('ll')
                      : <LoadingText />}
              </Definition>
              <Definition
                className="UserProfile-number-of-addons"
                term={i18n.gettext('Number of add-ons')}
              >
                {user ? user.num_addons_listed : <LoadingText />}
              </Definition>
              <Definition
                className="UserProfile-rating-average"
                term={i18n.gettext('Average rating of developer’s add-ons')}
              >
                {user ? (
                  <Rating
                    rating={user.average_addon_rating}
                    readOnly
                    styleName="small"
                  />
                ) : <LoadingText />}
              </Definition>
            </DefinitionList>

            {user && user.biography && user.biography.length ? (
              <div
                className="UserProfile-biography"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={sanitizeUserHTML(user.biography)}
              />
            ) : null}

            <ReportUserAbuse className="UserProfile-abuse-button" user={user} />
          </Card>

          {user && user.username && (
            <div className="UserProfile-addons-by-author">
              <AddonsByAuthorsCard
                addonType={ADDON_TYPE_EXTENSION}
                authorDisplayName={[user.displayName]}
                authorUsernames={[user.username]}
                numberOfAddons={3}
                showSummary
                type="vertical"
                showMore={false}
              />

              <AddonsByAuthorsCard
                addonType={ADDON_TYPE_THEME}
                authorDisplayName={[user.displayName]}
                authorUsernames={[user.username]}
                numberOfAddons={6}
                showMore={false}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export function mapStateToProps(
  state: {| users: UsersStateType |},
  ownProps: Props,
) {
  return {
    user: getUserByUsername(state.users, ownProps.params.username),
  };
}

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'UserProfile' }),
)(UserProfileBase);
