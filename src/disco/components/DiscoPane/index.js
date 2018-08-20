/* global navigator */
import invariant from 'invariant';
import * as React from 'react';
import PropTypes from 'prop-types';
import { camelizeKeys as camelCaseKeys } from 'humps';
import { connect } from 'react-redux';
import { compose } from 'redux';
import config from 'config';

import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import tracking from 'core/tracking';
import { INSTALL_STATE } from 'core/constants';
import InfoDialog from 'core/components/InfoDialog';
import { addChangeListeners } from 'core/addonManager';
import { getAddonByGUID } from 'core/reducers/addons';
import { getDiscoResults } from 'disco/actions';
import { NAVIGATION_CATEGORY } from 'disco/constants';
import { makeQueryStringWithUTM } from 'disco/utils';
import Addon from 'disco/components/Addon';
import Button from 'ui/components/Button';

import './styles.scss';

export class DiscoPaneBase extends React.Component {
  static propTypes = {
    AddonComponent: PropTypes.func,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    handleGlobalEvent: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    mozAddonManager: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        platform: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
    results: PropTypes.arrayOf(PropTypes.object).isRequired,
    _addChangeListeners: PropTypes.func,
    _config: PropTypes.object,
    _tracking: PropTypes.object,
  };

  static defaultProps = {
    AddonComponent: Addon,
    mozAddonManager: config.get('server') ? {} : navigator.mozAddonManager,
    _addChangeListeners: addChangeListeners,
    _config: config,
    _tracking: tracking,
  };

  constructor(props) {
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
      _config,
      handleGlobalEvent,
      mozAddonManager,
    } = this.props;

    if (_config.get('server')) {
      return;
    }

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

  renderFindMoreButton({ position }) {
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
          rel="noopener noreferrer"
          onClick={this.showMoreAddons}
        >
          {i18n.gettext('Find more add-ons')}
        </Button>
      </div>
    );
  }

  render() {
    const { AddonComponent, errorHandler, results, i18n } = this.props;

    return (
      <div
        id="app-view"
        ref={(ref) => {
          this.container = ref;
        }}
      >
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
          <AddonComponent
            addon={item}
            {...camelCaseKeys(item)}
            key={item.guid}
          />
        ))}

        {this.renderFindMoreButton({ position: 'bottom' })}
        <InfoDialog />
      </div>
    );
  }
}

export function loadedAddons(state) {
  return state.discoResults.map((result) => {
    return {
      ...result,
      // `result` comes from the API call in `src/disco/api.js` and
      // normalizer makes everything complicated...
      // `result.addon` is actually the add-on's GUID.
      ...getAddonByGUID(state, result.addon),
    };
  });
}

export function mapStateToProps(state) {
  return {
    results: loadedAddons(state),
  };
}

export function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    handleGlobalEvent: (payload) => {
      dispatch({ type: INSTALL_STATE, payload });
    },
  };
}

export default compose(
  withErrorHandler({ name: 'DiscoPane' }),
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(DiscoPaneBase);
