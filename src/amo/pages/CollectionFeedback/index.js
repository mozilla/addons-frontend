/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';
import invariant from 'invariant';

import FeedbackForm, {
  CATEGORY_FEEDBACK_SPAM,
  CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
  CATEGORY_ILLEGAL,
  CATEGORY_SOMETHING_ELSE,
} from 'amo/components/FeedbackForm';
import LoadingText from 'amo/components/LoadingText';
import Card from 'amo/components/Card';
import log from 'amo/logger';
import translate from 'amo/i18n/translate';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import {
  fetchCurrentCollection,
  getCurrentCollection,
} from 'amo/reducers/collections';
import { sendCollectionAbuseReport } from 'amo/reducers/collectionAbuseReports';
import { withFixedErrorHandler } from 'amo/errorHandler';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';
import type { FeedbackFormValues } from 'amo/components/FeedbackForm';
import type { CollectionType } from 'amo/reducers/collections';

import './styles.scss';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| authorId: number, collectionSlug: string |},
  |},
|};

type PropsFromState = {|
  collection: CollectionType | null,
  isCollectionLoading: boolean,
  hasSubmitted: boolean,
  isSubmitting: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
|};

export class CollectionFeedbackBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { collection, dispatch, errorHandler, isCollectionLoading, match } =
      props;
    const { params } = match;

    if (errorHandler.hasError()) {
      log.warn('Not loading data because of an error.');
      return;
    }

    if (!collection && !isCollectionLoading) {
      dispatch(
        fetchCurrentCollection({
          errorHandlerId: errorHandler.id,
          userId: params.authorId,
          slug: params.collectionSlug,
        }),
      );
    }
  }

  onFormSubmitted: (values: FeedbackFormValues) => void = (values) => {
    const { dispatch, errorHandler, collection } = this.props;
    const {
      anonymous,
      email,
      name,
      text,
      category,
      illegalCategory,
      illegalSubcategory,
    } = values;

    invariant(collection, 'collection is required');

    dispatch(
      sendCollectionAbuseReport({
        // Only authenticate the API call when the report isn't submitted
        // anonymously.
        auth: anonymous === false,
        errorHandlerId: errorHandler.id,
        message: text,
        collectionId: collection.id,
        reason: category,
        reporterEmail: anonymous ? '' : email,
        reporterName: anonymous ? '' : name,
        illegalCategory,
        illegalSubcategory,
      }),
    );
  };

  render(): React.Node {
    const { collection, errorHandler, hasSubmitted, i18n, isSubmitting } =
      this.props;

    if (
      errorHandler.hasError() &&
      errorHandler.capturedError.responseStatusCode === 404
    ) {
      return <NotFoundPage />;
    }

    return (
      <Page>
        <div className="CollectionFeedback-page">
          <Helmet>
            <title>
              {i18n.gettext(
                'Submit feedback or report a collection to Mozilla',
              )}
            </title>
            <meta name="robots" content="noindex, follow" />
          </Helmet>

          <FeedbackForm
            errorHandler={errorHandler}
            contentHeader={
              <Card className="CollectionFeedback-header">
                <h1 className="CollectionFeedback-header-name">
                  {collection ? collection.name : <LoadingText />}
                  <span className="CollectionFeedback-header-creator">
                    {collection ? (
                      i18n.sprintf(i18n.gettext('by %(authorName)s'), {
                        authorName: collection.authorName,
                      })
                    ) : (
                      <LoadingText />
                    )}
                  </span>
                </h1>

                <div className="CollectionFeedback-header-metadata">
                  <p className="CollectionFeedback-header-metadata-addons">
                    <span>{i18n.gettext('Add-ons')}</span>
                    {collection ? collection.numberOfAddons : <LoadingText />}
                  </p>
                  <p className="CollectionFeedback-header-metadata-last-updated">
                    <span>{i18n.gettext('Last updated')}</span>
                    {collection ? (
                      i18n.moment(collection.lastUpdatedDate).format('ll')
                    ) : (
                      <LoadingText />
                    )}
                  </p>
                </div>
              </Card>
            }
            abuseIsLoading={isSubmitting}
            abuseSubmitted={hasSubmitted}
            categoryHeader={i18n.gettext('Report this collection to Mozilla')}
            feedbackTitle={i18n.gettext(
              'Send some feedback about the collection',
            )}
            reportTitle={i18n.gettext(
              "Report the collection because it's illegal or incompliant",
            )}
            categories={[
              CATEGORY_FEEDBACK_SPAM,
              CATEGORY_HATEFUL_VIOLENT_DECEPTIVE,
              CATEGORY_ILLEGAL,
              CATEGORY_SOMETHING_ELSE,
            ]}
            showLocation={false}
            onSubmit={this.onFormSubmitted}
          />
        </div>
      </Page>
    );
  }
}

function mapStateToProps(state: AppState): PropsFromState {
  const { collections, collectionAbuseReports } = state;

  const { loading } = collections.current;
  const collection = getCurrentCollection(collections);
  const abuseReport =
    (collection && collectionAbuseReports.byCollectionId[collection.id]) || {};

  return {
    collection,
    isCollectionLoading: loading,
    isSubmitting: abuseReport.isSubmitting || false,
    hasSubmitted: abuseReport.hasSubmitted || false,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  const { params } = ownProps.match;

  return `${params.authorId}-${params.collectionSlug}`;
};

const CollectionFeedback: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(CollectionFeedbackBase);

export default CollectionFeedback;
