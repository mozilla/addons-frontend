/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonsCard from 'amo/components/AddonsCard';
import {
  fetchRecommendations,
  getRecommendationsByGuid,
  OUTCOME_RECOMMENDED,
} from 'amo/reducers/recommendations';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import log from 'amo/logger';
import defaultTracking from 'amo/tracking';
import LoadingText from 'amo/components/LoadingText';
import type { Recommendations } from 'amo/reducers/recommendations';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { AddonType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';

import './styles.scss';

export const TAAR_IMPRESSION_CATEGORY = 'AMO Addon / Recommendations Shown';

type DefaultProps = {|
  tracking: typeof defaultTracking,
|};

type PropsFromState = {|
  recommendations: Recommendations | null,
|};

type Props = {|
  ...DefaultProps,
  ...PropsFromState,
  addon: AddonType | null,
  className?: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  jed: I18nType,
|};

export class AddonRecommendationsBase extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    tracking: defaultTracking,
  };

  componentDidMount() {
    const { addon, recommendations } = this.props;

    if (addon && !recommendations) {
      this.dispatchFetchRecommendations(addon.guid);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { addon: oldAddon, recommendations: oldRecommendations } = prevProps;
    const {
      addon: newAddon,
      recommendations: newRecommendations,
      tracking,
      errorHandler,
    } = this.props;

    // Fetch recommendations when the add-on changes.
    if (
      newAddon &&
      (!oldAddon || (oldAddon && oldAddon.guid !== newAddon.guid))
    ) {
      this.dispatchFetchRecommendations(newAddon.guid);
    }

    // Send the GA ping when recommendations are loaded.
    if (newRecommendations && oldRecommendations !== newRecommendations) {
      const { fallbackReason, loading, outcome } = newRecommendations;

      if (loading || errorHandler.hasError()) {
        return;
      }

      invariant(newAddon, 'newAddon is required');
      invariant(outcome, 'outcome is required');

      let action = outcome;
      if (fallbackReason) {
        action = `${action}-${fallbackReason}`;
      }
      tracking.sendEvent({
        action,
        category: TAAR_IMPRESSION_CATEGORY,
        label: newAddon.guid,
      });
    }
  }

  dispatchFetchRecommendations(guid: string) {
    this.props.dispatch(
      fetchRecommendations({
        errorHandlerId: this.props.errorHandler.id,
        guid,
      }),
    );
  }

  render(): null | React.Node {
    const { className, jed, recommendations, errorHandler } = this.props;

    if (!recommendations) {
      log.debug(
        'No recommendations, hiding the AddonRecommendations component.',
      );
      return null;
    }

    if (errorHandler.hasError()) {
      log.debug(
        'Error in fetching recommendations, hiding the AddonRecommendations component.',
      );
      return null;
    }

    const { addons, loading, outcome } = recommendations;
    const classnames = makeClassName('AddonRecommendations', className);

    let header: React.Node | string = <LoadingText width={100} />;
    if (!loading) {
      header =
        outcome === OUTCOME_RECOMMENDED
          ? jed.gettext('Other users with this extension also installed')
          : jed.gettext('Other popular extensions');
    }

    return (
      <AddonsCard
        addonInstallSource={outcome || ''}
        addons={addons}
        className={classnames}
        header={header}
        loading={loading}
        placeholderCount={4}
        showMetadata
        showSummary={false}
        type="horizontal"
      />
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const { addon } = ownProps;
  const recommendations = addon
    ? getRecommendationsByGuid({
        guid: addon.guid,
        state: state.recommendations,
      })
    : null;
  return { recommendations };
};

const AddonRecommendations: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ id: 'AddonRecommendations' }),
)(AddonRecommendationsBase);

export default AddonRecommendations;
