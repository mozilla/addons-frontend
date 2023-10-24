/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import Page from 'amo/components/Page';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'amo/reducers/addons';
import { withFixedErrorHandler } from 'amo/errorHandler';
import FeedbackForm from 'amo/components/FeedbackForm';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';

type Props = {|
  match: {|
    ...ReactRouterMatchType,
    params: {| addonIdentifier: string |},
  |},
|};

type PropsFromState = {|
  addon: AddonType | null,
  addonIsLoading: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
|};

type State = {||};

export class FeedbackBase extends React.Component<InternalProps, State> {
  constructor(props: InternalProps) {
    super(props);
    this.loadDataIfNeeded();
  }

  componentDidUpdate() {
    this.loadDataIfNeeded();
  }

  componentWillUnmount() {
    this.props.errorHandler.clear();
  }

  loadDataIfNeeded() {
    const { addon, addonIsLoading, dispatch, errorHandler, match } = this.props;

    if (!addon && !addonIsLoading) {
      dispatch(
        fetchAddon({
          slug: match.params.addonIdentifier,
          errorHandler,
        }),
      );
    }
  }

  render(): React.Node {
    const { errorHandler, match } = this.props;
    let { addon } = this.props;

    if (errorHandler.hasError()) {
      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFoundPage />;
      }

      if ([401, 403].includes(errorHandler.capturedError.responseStatusCode)) {
        // If we cannot load an add-on because of a 401 or 403, this might be
        // because we're attempting to load an unlisted add-on.
        addon = null;
      }
    }

    return (
      <Page>
        <FeedbackForm
          addonId={match.params.addonIdentifier}
          addon={addon}
          errorHandler={errorHandler}
        />
      </Page>
    );
  }
}

function mapStateToProps(
  state: AppState,
  ownProps: InternalProps,
): PropsFromState {
  const { addonIdentifier } = ownProps.match.params;
  const addon = getAddonByIdInURL(state.addons, addonIdentifier);

  return {
    addonIsLoading: isAddonLoading(state, addonIdentifier),
    addon,
  };
}

export const extractId = (ownProps: InternalProps): string => {
  return ownProps.match.params.addonIdentifier;
};

const Feedback: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(FeedbackBase);

export default Feedback;
