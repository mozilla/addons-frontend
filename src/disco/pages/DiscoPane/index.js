/* @flow */
/* global navigator */
import invariant from 'invariant';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';
import mozCompare from 'mozilla-version-comparator';
import { oneLine } from 'common-tags';

import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import { DISCO_NAVIGATION_CATEGORY, INSTALL_STATE } from 'core/constants';
import InfoDialog from 'core/components/InfoDialog';
import { addChangeListeners } from 'core/addonManager';
import log from 'core/logger';
import { getDiscoResults } from 'disco/reducers/discoResults';
import { makeQueryStringWithUTM } from 'disco/utils';
import Addon from 'disco/components/Addon';
import Button from 'ui/components/Button';
import Notice, { genericType } from 'ui/components/Notice';
import type { MozAddonManagerType } from 'core/addonManager';
import type { ErrorHandlerType } from 'core/types/errorHandler';
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
    params: {|
      platform: string,
      version: string,
    |},
  |},
|};

type InternalProps = {|
  ...Props,
  _addChangeListeners: typeof addChangeListeners,
  _log: typeof log,
  _tracking: typeof tracking,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  handleGlobalEvent: Function,
  hasRecommendations: boolean,
  hashedClientId: string | null,
  i18n: I18nType,
  mozAddonManager: MozAddonManagerType,
  results: DiscoResultsType,
  siteLang: string,
|};

export class DiscoPaneBase extends React.Component<InternalProps> {
  static defaultProps = {
    _addChangeListeners: addChangeListeners,
    _log: log,
    _tracking: tracking,
    // $FlowFixMe: `mozAddonManager` might be available.
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
  };

  constructor(props: InternalProps) {
    super(props);

    const {
      _log,
      dispatch,
      errorHandler,
      hashedClientId,
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
      let taarParams = {
        ...location.query,
        platform: params.platform,
      };

      if (hashedClientId) {
        if (mozCompare(params.version, '65.0.1') >= 0) {
          taarParams = {
            ...taarParams,
            clientId: hashedClientId,
          };
        } else {
          _log.debug(
            oneLine`Not passing the client ID to the API because the
            browser version (%s) is < 65.0.1`,
            params.version,
          );
        }
      }

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
      category: DISCO_NAVIGATION_CATEGORY,
      label: 'Find More Add-ons',
    });
  };

  renderFindMoreButton({ position }: {| position: 'top' | 'bottom' |}) {
    const { i18n } = this.props;

    invariant(position, 'position is required');

    return (
      <div className={`DiscoPane-amo-link DiscoPane-amo-link-${position}`}>
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

  getSupportURL() {
    const { siteLang, match } = this.props;
    const { platform, version } = match.params;

    return `https://support.mozilla.org/1/firefox/${version}/${platform}/${siteLang}/personalized-addons`;
  }

  render() {
    const { errorHandler, hasRecommendations, results, i18n } = this.props;

    return (
      <div className="DiscoPane">
        {errorHandler.renderErrorIfPresent()}

        <header className="DiscoPane-header">
          <div className="DiscoPane-header-intro">
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
        </header>

        {this.renderFindMoreButton({ position: 'top' })}

        {hasRecommendations && (
          <Notice
            actionHref={this.getSupportURL()}
            actionTarget="_blank"
            actionText={i18n.gettext('Learn More')}
            className="DiscoPane-notice-recommendations"
            type={genericType}
          >
            {i18n.gettext(`Some of these recommendations are personalized.
              They are based on other extensions you've installed, profile
              preferences, and usage statistics.`)}
          </Notice>
        )}

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
  const { lang: siteLang } = state.api;
  const { results, hasRecommendations } = state.discoResults;

  return {
    hasRecommendations,
    hashedClientId: state.telemetry.hashedClientId,
    results,
    siteLang,
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
  connect(mapStateToProps, mapDispatchToProps),
  translate(),
)(DiscoPaneBase);

export default DiscoPane;
