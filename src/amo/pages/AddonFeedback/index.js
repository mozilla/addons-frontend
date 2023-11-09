/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { Helmet } from 'react-helmet';

import translate from 'amo/i18n/translate';
import Page from 'amo/components/Page';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'amo/reducers/addons';
import { withFixedErrorHandler } from 'amo/errorHandler';
import AddonFeedbackForm from 'amo/components/AddonFeedbackForm';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterMatchType } from 'amo/types/router';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

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
  i18n: I18nType,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
|};

type State = {||};

export class AddonFeedbackBase extends React.Component<InternalProps, State> {
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
          // We need this in case users navigate back to the add-on detail page.
          showGroupedRatings: true,
          slug: match.params.addonIdentifier,
          errorHandler,
          assumeNonPublic: true,
        }),
      );
    }
  }

  render(): React.Node {
    const { addon, errorHandler, i18n } = this.props;

    return (
      <Page>
        <div className="AddonFeedback-page">
          <Helmet>
            <title>
              {i18n.gettext('Submit feedback or report an add-on to Mozilla')}
            </title>
            <meta name="robots" content="noindex, follow" />
          </Helmet>

          <AddonFeedbackForm addon={addon} errorHandler={errorHandler} />
        </div>
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

const AddonFeedback: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonFeedbackBase);

export default AddonFeedback;
