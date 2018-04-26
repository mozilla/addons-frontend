/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { Experiment, Variant } from 'react-ab';
import cookie from 'react-cookie';
import { compose } from 'redux';

import tracking from 'core/tracking';
import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

export const TAAR_IMPRESSION_CATEGORY = 'AMO Addon / Recommendations Shown';
export const TAAR_COHORT_COOKIE_NAME = 'TAARCohort';
export const TAAR_COHORT_INCLUDED: 'TAAR_COHORT_INCLUDED'
  = 'TAAR_COHORT_INCLUDED';
export const TAAR_COHORT_EXCLUDED: 'TAAR_COHORT_EXCLUDED'
  = 'TAAR_COHORT_EXCLUDED';

export type cohortName = typeof TAAR_COHORT_INCLUDED | typeof TAAR_COHORT_EXCLUDED;

type Props = {|
  _cookie: typeof cookie,
  _randomizer: Function,
  _tracking: typeof tracking,
  addon: AddonType | null,
  i18n: I18nType,
|};


export class AddonRecommendationsBase extends React.Component<Props> {
  static defaultProps = {
    _cookie: cookie,
    _randomizer: Math.random,
    _tracking: tracking,
  }

  constructor(props: Props) {
    super(props);
    // This will prevent the component from rendering on the server, by only
    // setting this to true in componentDidMount, which is only run on the
    // client.
    this.shouldRender = false;
  }

  componentDidMount() {
    const { _cookie, _randomizer } = this.props;

    // Set a cohort for the experiment.
    this.cohort = _cookie.load(TAAR_COHORT_COOKIE_NAME);
    if (this.cohort === undefined) {
      this.cohort = _randomizer() > 0.5 ?
        TAAR_COHORT_INCLUDED : TAAR_COHORT_EXCLUDED;
      _cookie.save(TAAR_COHORT_COOKIE_NAME, this.cohort, { path: '/' });
    }
    this.shouldRender = true;
  }

  onChoice = (experiment: string, variant: cohortName) => {
    const { _tracking, addon } = this.props;

    invariant(addon, 'An addon is required.');

    _tracking.sendEvent({
      action: variant,
      category: TAAR_IMPRESSION_CATEGORY,
      label: addon.name,
    });
  };

  getVariant = () => {
    return this.cohort;
  };

  cohort: cohortName;
  shouldRender: boolean;

  render() {
    const { i18n, addon } = this.props;

    if (!this.shouldRender || !addon) {
      return null;
    }

    return (
      <div className="AddonRecommendations">
        <Experiment get={this.getVariant} onChoice={this.onChoice} name="TAARExperiment">
          <Variant name={TAAR_COHORT_INCLUDED}>
            <h1 className={TAAR_COHORT_INCLUDED}>
              {i18n.gettext('User is included in TAAR cohort')}
            </h1>
          </Variant>
          <Variant name={TAAR_COHORT_EXCLUDED}>
            <h1 className={TAAR_COHORT_EXCLUDED}>
              {i18n.gettext('User is excluded from TAAR cohort')}
            </h1>
          </Variant>
        </Experiment>
      </div>
    );
  }
}

export default compose(
  translate(),
)(AddonRecommendationsBase);
