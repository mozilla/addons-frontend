/* @flow */
/* global navigator */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import { INSTALL_STATE } from 'core/constants';
import InfoDialog from 'core/components/InfoDialog';
import { addChangeListeners } from 'core/addonManager';
import { getDiscoResults } from 'disco/reducers/discoResults';
import { NAVIGATION_CATEGORY } from 'disco/constants';
import { makeQueryStringWithUTM } from 'disco/utils';
import Addon from 'disco/components/Addon';
import Button from 'ui/components/Button';
import type { MozAddonManagerType } from 'core/addonManager';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type {
  ReactRouterLocationType,
  ReactRouterMatchType,
} from 'core/types/router';
import type { DiscoResultsType } from 'disco/reducers/discoResults';
import type { AppState } from 'disco/store';

import './styles.scss';

type Props = {|
  location: ReactRouterLocationType,
  match: {|
    ...ReactRouterMatchType,
    params: {| platform: string |},
  |},
|};

type InternalProps = {|
  ...Props,
  _addChangeListeners: typeof addChangeListeners,
  _tracking: typeof tracking,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  handleGlobalEvent: Function,
  i18n: I18nType,
  mozAddonManager: MozAddonManagerType,
  results: DiscoResultsType,
|};

export class DiscoPaneBase extends React.Component<InternalProps> {
  static defaultProps = {
    _addChangeListeners: addChangeListeners,
    _tracking: tracking,
    // $FLOW_FIXME: `mozAddonManager` might be available.
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
  };

  constructor(props: InternalProps) {
    super(props);

    const {
      dispatch,
      errorHandler,
      location,
      match: { params },
      results,
    } = props;

    // TODO: fix this; it's not the right way to detect whether a
    // dispatch is needed. This should look for an undefined value
    // instead of an empty list because an empty list could be a valid
    // (yet unlikley) API response.
    if (!errorHandler.hasError() && !results.length) {
      // We accept all query params here and filter them out based on the
      // `discoParamsToUse` config value. See:
      // https://github.com/mozilla/addons-frontend/issues/4155
      const taarParams = { ...location.query, platform: params.platform };

      dispatch(
        getDiscoResults({
          errorHandlerId: errorHandler.id,
          taarParams,
        }),
      );
    }
  }

  componentDidMount() {
    const {
      _addChangeListeners,
      handleGlobalEvent,
      mozAddonManager,
    } = this.props;

    // Use addonManager.addChangeListener to setup and filter events.
    _addChangeListeners(handleGlobalEvent, mozAddonManager);
  }

  showMoreAddons = () => {
    const { _tracking } = this.props;

    _tracking.sendEvent({
      action: 'click',
      category: NAVIGATION_CATEGORY,
      label: 'Find More Add-ons',
    });
  };

  renderFindMoreButton({ position }: {| position: 'top' | 'bottom' |}) {
    const { i18n } = this.props;

    invariant(position, 'position is required');

    return (
      <div className={`amo-link amo-link-${position}`}>
        <Button
          buttonType="action"
          href={`https://addons.mozilla.org/${makeQueryStringWithUTM({
            utm_content: `find-more-link-${position}`,
            // The parameter below is not an UTM parameter, but it's used
            // internally by AMO to track downloads in the stats dashboards for
            // developers.
            src: 'api',
          })}`}
          target="_blank"
          onClick={this.showMoreAddons}
        >
          {i18n.gettext('Find more add-ons')}
        </Button>
      </div>
    );
  }

  render() {
    const { errorHandler, results, i18n } = this.props;

    return (
      <div id="app-view">
        {errorHandler.renderErrorIfPresent()}

        <header>
          <div className="disco-header">
            <div className="disco-content">
              <h1>{i18n.gettext('Personalize Your Firefox')}</h1>
              <p>
                {i18n.gettext(`There are thousands of free add-ons, created by
                  developers all over the world, that you can install to
                  personalize your Firefox. From fun visual themes to powerful
                  tools that make browsing faster and safer, add-ons make your
                  browser yours.

                  To help you get started, here are some we recommend for their
                  stand-out performance and functionality.`)}
              </p>
            </div>
          </div>
        </header>

        {this.renderFindMoreButton({ position: 'top' })}

        {results.map((item) => (
          <Addon
            addonId={item.addonId}
            description={item.description}
            heading={item.heading}
            key={item.addonId}
          />
        ))}

        {this.renderFindMoreButton({ position: 'bottom' })}

        <InfoDialog />
      </div>
    );
  }
}

function mapStateToProps(state: AppState) {
  const { results } = state.discoResults;

  return {
    results,
  };
}

export function mapDispatchToProps(dispatch: DispatchFunc) {
  return {
    dispatch,
    handleGlobalEvent: (payload: Object) => {
      dispatch({ type: INSTALL_STATE, payload });
    },
  };
}

const DiscoPane: React.ComponentType<Props> = compose(
  withErrorHandler({ name: 'DiscoPane' }),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(DiscoPaneBase);

export default DiscoPane;
