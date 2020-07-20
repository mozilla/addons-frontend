/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import AddonsCard from 'amo/components/AddonsCard';
import { LANDING_PAGE_PROMOTED_EXTENSION_COUNT } from 'amo/constants';
import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  className?: string,
  loading: boolean,
|};

export type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class PromotedAddonsCardBase extends React.Component<InternalProps> {
  render() {
    const { addonInstallSource, addons, className, i18n, loading } = this.props;

    const header = (
      <>
        <div className="PromotedAddonsCard-headerText">
          {i18n.gettext('Sponsored extensions')}
        </div>
        <a
          className="PromotedAddonsCard-headerLink"
          href="https://support.mozilla.org/kb/recommended-extensions-program"
          rel="noopener noreferrer"
          target="_blank"
          title={i18n.gettext(
            'Firefox only recommends extensions that meet our standards for security and performance.',
          )}
        >
          {i18n.gettext('What is this?')}
        </a>
      </>
    );

    return (
      <AddonsCard
        addonInstallSource={addonInstallSource}
        addons={addons}
        className={makeClassName('PromotedAddonsCard', className)}
        header={header}
        showRecommendedBadge={false}
        type="horizontal"
        loading={loading}
        placeholderCount={LANDING_PAGE_PROMOTED_EXTENSION_COUNT}
      />
    );
  }
}

const PromotedAddonsCard: React.ComponentType<Props> = compose(translate())(
  PromotedAddonsCardBase,
);

export default PromotedAddonsCard;
