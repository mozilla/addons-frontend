/* @flow */
import makeClassName from 'classnames';
import { oneLine } from 'common-tags';
import invariant from 'invariant';
import * as React from 'react';
import defaultCookie from 'react-cookie';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonsCard from 'amo/components/AddonsCard';
import {
  fetchRecommendations,
  getRecommendationsByGuid,
} from 'amo/reducers/recommendations';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import defaultTracking from 'core/tracking';
import type {
  Recommendations,
  RecommendationsState,
} from 'amo/reducers/recommendations';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { AddonType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';

export const TAAR_IMPRESSION_CATEGORY = 'AMO Addon / Recommendations Shown';
export const TAAR_COHORT_COOKIE_NAME = 'TAARCohort';
export const TAAR_COHORT_INCLUDED: 'TAAR_COHORT_INCLUDED'
  = 'TAAR_COHORT_INCLUDED';
export const TAAR_COHORT_EXCLUDED: 'TAAR_COHORT_EXCLUDED'
  = 'TAAR_COHORT_EXCLUDED';

export type CohortName = typeof TAAR_COHORT_INCLUDED | typeof TAAR_COHORT_EXCLUDED;

type Props = {|
  cookie: typeof defaultCookie,
  randomizer: () => number,
  tracking: typeof defaultTracking,
  addon: AddonType | null,
  className?: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  recommendations: Recommendations | null,
|};


export class AddonRecommendationsBase extends React.Component<Props> {
  static defaultProps = {
    cookie: defaultCookie,
    randomizer: Math.random,
    tracking: defaultTracking,
    recommendations: null,
  };

  componentWillMount() {
    const { cookie, randomizer, addon, recommendations } = this.props;

    // Set a cohort for the experiment.
    this.cohort = cookie.load(TAAR_COHORT_COOKIE_NAME);
    if (this.cohort === undefined) {
      this.cohort = randomizer() > 0.5 ?
        TAAR_COHORT_INCLUDED : TAAR_COHORT_EXCLUDED;
      cookie.save(TAAR_COHORT_COOKIE_NAME, this.cohort, { path: '/' });
    }

    if (!!addon && !recommendations) {
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
    if (oldAddon !== newAddon && !!newAddon) {
      this.dispatchFetchRecommendations({
        guid: newAddon.guid,
        recommended: this.cohort === TAAR_COHORT_INCLUDED,
      });
    }

    // Send the GA ping when recommendations are loaded.
    if (oldRecommendations !== newRecommendations && !!newRecommendations) {
      const { fallbackReason, loading, outcome } = newRecommendations;

      if (loading) {
        return;
      }

      invariant(newAddon, 'newAddon is required');
      invariant(outcome, 'outcome is required');

      // TODO: Determine the exact format for this output.
      const action = oneLine`outcome: ${outcome} |
        fallbackReason: ${fallbackReason || ''}`;
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
      return null;
    }

    const { addons, loading } = recommendations;
    const classnames = makeClassName('AddonRecommendations', className);

    return (
      <AddonsCard
        addons={addons}
        className={classnames}
        header={i18n.gettext('You might also like...')}
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
  const recommendations = !addon ?
    null :
    getRecommendationsByGuid({
      guid: addon.guid,
      state: state.recommendations,
    });
  return { recommendations };
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'AddonRecommendations' }),
)(AddonRecommendationsBase);
