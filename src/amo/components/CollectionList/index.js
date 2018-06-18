/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  expandCollections, fetchUserCollections,
} from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
import AuthenticateButton from 'core/components/AuthenticateButton';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import type {
  CollectionsState, CollectionType,
} from 'amo/reducers/collections';
import type { UsersStateType } from 'amo/reducers/users';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';

import './styles.scss';


export type Props = {|
  collections: Array<CollectionType> | null,
  currentUsername: string | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  isLoggedIn: boolean,
  loadingUserCollections: boolean,
  location: ReactRouterLocation,
|};

export class CollectionListBase extends React.Component<Props> {
  static defaultProps = {
    creating: false,
  };

  componentDidMount() {
    const {
      collections,
      currentUsername,
      dispatch,
      errorHandler,
      loadingUserCollections,
    } = this.props;

    if (currentUsername && !loadingUserCollections && !collections) {
      dispatch(fetchUserCollections({
        errorHandlerId: errorHandler.id, username: currentUsername,
      }));
    }
  }

  render() {
    const { i18n, isLoggedIn, location, collections } = this.props;
    const myCollectionsHeader = i18n.gettext('My Collections');

    if (!isLoggedIn) {
      return (
        <AuthenticateButton
          noIcon
          location={location}
          logInText={i18n.gettext('Log in to view your collections')}
        />
      );
    }

    const collectionElements = [];

    if (collections && collections.length) {
      collections.forEach((collection) => {
        const { authorUsername, id, name, numberOfAddons, slug } = collection;
        const numberText = i18n.sprintf(
          i18n.ngettext(
            '%(total)s add-on', '%(total)s add-ons', numberOfAddons
          ),
          { total: i18n.formatNumber(numberOfAddons) },
        );
        collectionElements.push(
          <li className="CollectionList-collection" key={id}>
            <a
              className="CollectionList-collection-link"
              href={`/collections/${authorUsername}/${slug}/`}
            >
              <h2 className="CollectionList-collection-name">
                {name}
              </h2>
              <p className="CollectionList-collection-number">
                {numberText}
              </p>
            </a>
          </li>
        );
      });
    }

    return (
      <div className="CollectionList">
        <div className="CollectionList-wrapper">
          <Card
            className="CollectionList-info"
            header={myCollectionsHeader}
            key="info"
          >
            <p className="CollectionList-info-text">
              {i18n.gettext(`Collections make it easy to keep track of favorite
                add-ons and share your perfectly customized browser with others.`)}
            </p>
            <Button
              buttonType="action"
              className="CollectionList-create"
              puffy
              to="/collections/add/"
              type="button"
            >
              {i18n.gettext('Create a collection')}
            </Button>
          </Card>
          <Card
            className="CollectionList-list"
            header={myCollectionsHeader}
            key="list"
          >
            {collectionElements.length ? (
              <ul className="CollectionList-listing">
                {collectionElements}
              </ul>
            ) : null}
          </Card>
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (
  state: {| collections: CollectionsState, users: UsersStateType |}
) => {
  const { collections, users } = state;

  const currentUser = getCurrentUser(users);
  const currentUsername = currentUser && currentUser.username;

  let userCollections;

  if (currentUsername) {
    userCollections = collections.userCollections[currentUsername];
  }

  return {
    currentUsername,
    isLoggedIn: !!currentUser,
    loadingUserCollections:
      userCollections ? userCollections.loading : false,
    collections:
      expandCollections(collections, userCollections),
  };
};

export const extractId = (ownProps: Props) => {
  const { currentUsername } = ownProps;
  return currentUsername || '';
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(CollectionListBase);
