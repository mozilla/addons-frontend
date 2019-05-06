/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {};

type InternalProps = {|
  i18n: I18nType,
|};

export const RecommendedBadgeBase = (props: InternalProps) => {
  const { i18n } = props;

  const label = i18n.gettext('Recommended');
  return (
    <div className="RecommendedBadge">
      <a
        className="RecommendedBadge-link"
        href="https://support.mozilla.org/"
        rel="noopener noreferrer"
        target="_blank"
        title={i18n.gettext(
          'Recommended extensions are safe, high-quality extensions.',
        )}
      >
        <span className="RecommendedBadge-icon">
          <Icon alt={label} name="recommended" />
        </span>
        <span className="RecommendedBadge-label">{label}</span>
      </a>
    </div>
  );
};

const RecommendedBadge: React.ComponentType<Props> = compose(translate())(
  RecommendedBadgeBase,
);

export default RecommendedBadge;
