/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Page from 'amo/components/Page';
import {
  expandCollections,
  fetchUserCollections,
} from 'amo/reducers/collections';
import { getCurrentUser } from 'amo/reducers/users';
import AuthenticateButton from 'amo/components/AuthenticateButton';
import { withFixedErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import Button from 'amo/components/Button';
import Card from 'amo/components/Card';
import CardList from 'amo/components/CardList';
import UserCollection from 'amo/components/UserCollection';
import { setViewContext } from 'amo/actions/viewContext';
import { VIEW_CONTEXT_HOME } from 'amo/constants';
import type { CollectionType } from 'amo/reducers/collections';
import type { UserId } from 'amo/reducers/users';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import './styles.scss';

export type Props = {||};

export type PropsFromState = {|
  collections: Array<CollectionType> | null,
  currentUserId: UserId | null,
  isLoggedIn: boolean,
  loadingUserCollections: boolean,
|};

export type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class CollectionListBase extends React.Component<InternalProps> {
  componentDidMount() {
    const {
      collections,
      currentUserId,
      dispatch,
      errorHandler,
      loadingUserCollections,
    } = this.props;

    dispatch(setViewContext(VIEW_CONTEXT_HOME));

    if (currentUserId && !loadingUserCollections && !collections) {
      dispatch(
        fetchUserCollections({
          errorHandlerId: errorHandler.id,
          userId: currentUserId,
        }),
      );
    }
  }

  renderCollections(): React.Node {
    const { i18n, collections } = this.props;
    const noCollectionsText = i18n.gettext('You do not have any collections.');

    const collectionElements = [];

    if (collections) {
      collections.forEach((collection) => {
        const { authorId, id, name, numberOfAddons, slug } = collection;

        collectionElements.push(
          <UserCollection
            authorId={authorId}
            id={id}
            key={id}
            name={name}
            numberOfAddons={numberOfAddons}
            slug={slug}
          />,
        );
      });
    } else {
      // Create 4 "loading" components.
      for (let count = 0; count < 4; count++) {
        collectionElements.push(
          // numberOfAddons is null when the collection is in a loading state.
          <UserCollection id={count} key={count} numberOfAddons={null} />,
        );
      }
    }

    const footer = collectionElements.length ? null : noCollectionsText;

    return (
      <CardList
        className="CollectionList-list"
        footer={footer}
        header={i18n.gettext('My collections')}
      >
        {collectionElements.length && (
          <ul className="CollectionList-listing">{collectionElements}</ul>
        )}
      </CardList>
    );
  }

  render(): React.Node {
    const { i18n, isLoggedIn } = this.props;

    return (
      <Page>
        <div className="CollectionList">
          <div className="CollectionList-wrapper">
            <Card
              className="CollectionList-info"
              header={i18n.gettext('Collections')}
            >
              {!isLoggedIn ? (
                <AuthenticateButton
                  noIcon
                  logInText={i18n.gettext('Log in to view your collections')}
                />
              ) : (
                <>
                  <p className="CollectionList-info-text">
                    {i18n.gettext(
                      'Collections make it easy to keep track of favorite add-ons and share your perfectly customized browser with others.',
                    )}
                  </p>
                  <Button
                    buttonType="action"
                    className="CollectionList-create"
                    puffy
                    to="/collections/add/"
                  >
                    {i18n.gettext('Create a collection')}
                  </Button>
                </>
              )}
            </Card>
            {isLoggedIn ? this.renderCollections() : null}
          </div>
        </div>
      </Page>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  const { collections, users } = state;

  const currentUser = getCurrentUser(users);
  const currentUserId = currentUser && currentUser.id;

  let userCollections;

  if (currentUserId) {
    userCollections = collections.userCollections[currentUserId];
  }

  return {
    currentUserId,
    isLoggedIn: !!currentUser,
    loadingUserCollections: userCollections ? userCollections.loading : false,
    collections: expandCollections(collections, userCollections),
  };
};

export const extractId = (ownProps: InternalProps): UserId | string => {
  const { currentUserId } = ownProps;
  return currentUserId || '';
};

const CollectionList: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(CollectionListBase);

export default CollectionList;
