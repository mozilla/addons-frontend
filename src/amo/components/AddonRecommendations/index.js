/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';
import defaultCookie from 'react-cookie';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonsCard from 'amo/components/AddonsCard';
import {
  fetchRecommendations,
  getRecommendationsByGuid,
  OUTCOME_RECOMMENDED,
} from 'amo/reducers/recommendations';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import defaultTracking from 'core/tracking';
import LoadingText from 'ui/components/LoadingText';
import type {
  Recommendations,
  RecommendationsState,
} from 'amo/reducers/recommendations';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

export const TAAR_IMPRESSION_CATEGORY = 'AMO Addon / Recommendations Shown';
export const TAAR_COHORT_COOKIE_NAME = 'taar_cohort';
export const TAAR_COHORT_DIMENSION = 'dimension4';
export const TAAR_COHORT_INCLUDED: 'TAAR_COHORT_INCLUDED'
  = 'TAAR_COHORT_INCLUDED';
export const TAAR_COHORT_EXCLUDED: 'TAAR_COHORT_EXCLUDED'
  = 'TAAR_COHORT_EXCLUDED';
export const TAAR_EXPERIMENT_PARTICIPANT = 'TAAR-LITE-AB';
export const TAAR_EXPERIMENT_PARTICIPANT_DIMENSION = 'dimension5';

export type CohortName = typeof TAAR_COHORT_INCLUDED | typeof TAAR_COHORT_EXCLUDED;

type Props = {|
  addon: AddonType | null,
  className?: string,
  cookie: typeof defaultCookie,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  randomizer: () => number,
  recommendations: Recommendations | null,
  tracking: typeof defaultTracking,
|};


export class AddonRecommendationsBase extends React.Component<Props> {
  static defaultProps = {
    cookie: defaultCookie,
    randomizer: Math.random,
    recommendations: null,
    tracking: defaultTracking,
  };

  componentDidMount() {
    const { addon, cookie, randomizer, recommendations, tracking } = this.props;

    // Set a cohort for the experiment.
    this.cohort = cookie.load(TAAR_COHORT_COOKIE_NAME);
    if (this.cohort === undefined) {
      this.cohort = randomizer() >= 0.5 ?
        TAAR_COHORT_INCLUDED : TAAR_COHORT_EXCLUDED;
      cookie.save(TAAR_COHORT_COOKIE_NAME, this.cohort, { path: '/' });
    }

    tracking.setDimension({
      dimension: TAAR_COHORT_DIMENSION,
      value: this.cohort,
    });

    tracking.setDimension({
      dimension: TAAR_EXPERIMENT_PARTICIPANT_DIMENSION,
      value: TAAR_EXPERIMENT_PARTICIPANT,
    });

    if (addon && !recommendations) {
      this.dispatchFetchRecommendations({
        guid: addon.guid,
        recommended: this.cohort === TAAR_COHORT_INCLUDED,
      });
    }
  }

  componentWillReceiveProps({
    addon: newAddon,
    recommendations: newRecommendations,
  }: Props) {
    const {
      addon: oldAddon,
      recommendations: oldRecommendations,
      tracking,
    } = this.props;

    // Fetch recommendations when the add-on changes.
    if (newAddon && oldAddon !== newAddon) {
      this.dispatchFetchRecommendations({
        guid: newAddon.guid,
        recommended: this.cohort === TAAR_COHORT_INCLUDED,
      });
    }

    // Send the GA ping when recommendations are loaded.
    if (newRecommendations && oldRecommendations !== newRecommendations) {
      const { fallbackReason, loading, outcome } = newRecommendations;

      if (loading) {
        return;
      }

      invariant(newAddon, 'newAddon is required');
      invariant(outcome, 'outcome is required');

      // TODO: Determine the exact format for this output.
      let action = outcome;
      if (fallbackReason) {
        action = `${action}-${fallbackReason}`;
      }
      tracking.sendEvent({
        action,
        category: TAAR_IMPRESSION_CATEGORY,
        label: newAddon.name,
      });
    }
  }

  cohort: CohortName;

  dispatchFetchRecommendations({ guid, recommended }: Object) {
    this.props.dispatch(fetchRecommendations({
      errorHandlerId: this.props.errorHandler.id,
      guid,
      recommended,
    }));
  }

  render() {
    const { className, i18n, recommendations } = this.props;

    if (!recommendations) {
      log.debug(
        'No recommandations, hiding the AddonRecommendations component.'
      );
      return null;
    }

    const { addons, loading, outcome } = recommendations;
    const classnames = makeClassName('AddonRecommendations', className);

    let header = <LoadingText width={100} />;
    if (!loading) {
      header = outcome === OUTCOME_RECOMMENDED ?
        i18n.gettext('Other users with this extension also installed') :
        i18n.gettext('Other popular extensions');
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

const mapStateToProps = (
  state: {| recommendations: RecommendationsState |},
  ownProps: Props,
) => {
  const { addon } = ownProps;
  const recommendations = addon ?
    getRecommendationsByGuid({
      guid: addon.guid,
      state: state.recommendations,
    }) :
    null;
  return { recommendations };
};

const AddonRecommendations: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'AddonRecommendations' }),
)(AddonRecommendationsBase);

export default AddonRecommendations;
