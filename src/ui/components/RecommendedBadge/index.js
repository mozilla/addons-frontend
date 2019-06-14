/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import IconRecommendedBadge from 'ui/components/IconRecommendedBadge';
import type { RecommendedBadgeSize } from 'ui/components/IconRecommendedBadge';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  onClick?: Function | null,
  size: RecommendedBadgeSize,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const RecommendedBadgeBase = ({
  i18n,
  onClick = null,
  size,
}: InternalProps) => {
  const label = i18n.gettext('Recommended');

  return (
    <div
      className={makeClassName('RecommendedBadge', {
        'RecommendedBadge-large': size === 'large',
        'RecommendedBadge-small': size === 'small',
      })}
    >
      <a
        className="RecommendedBadge-link"
        href="https://support.mozilla.org/kb/recommended-extensions-program"
        onClick={onClick}
        rel="noopener noreferrer"
        target="_blank"
        title={i18n.gettext(
          'Firefox only recommends extensions that meet our standards for security and performance.',
        )}
      >
        <IconRecommendedBadge alt={label} size={size} />
        <span className="RecommendedBadge-label">{label}</span>
      </a>
    </div>
  );
};

const RecommendedBadge: React.ComponentType<Props> = compose(translate())(
  RecommendedBadgeBase,
);

export default RecommendedBadge;
