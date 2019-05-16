/* @flow */
import config from 'config';
import * as React from 'react';
import makeClassName from 'classnames';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  arrowAlt?: string,
  iconUrl: string,
  isRecommended: boolean,
  loading: boolean,
  name: string,
  type: string,
|};

type InternalProps = {|
  ...Props,
  _config: typeof config,
  i18n: I18nType,
|};

export const SearchSuggestionBase = ({
  _config = config,
  arrowAlt,
  i18n,
  iconUrl,
  isRecommended,
  loading,
  name,
  type,
}: InternalProps) => {
  return (
    <p
      className={makeClassName('SearchSuggestion', `SearchSuggestion--${type}`)}
    >
      <img alt={name} className="SearchSuggestion-icon" src={iconUrl} />
      <span className="SearchSuggestion-name">
        {loading ? <LoadingText minWidth={20} range={12} /> : name}
      </span>
      {_config.get('enableFeatureRecommendedBadges') && isRecommended && (
        <Icon
          alt={i18n.gettext('Recommended')}
          className="SearchSuggestion-icon-recommended"
          name="recommended-circle"
        />
      )}
      <Icon
        alt={arrowAlt}
        className="SearchSuggestion-icon-arrow"
        name="arrow-blue"
      />
    </p>
  );
};

const SearchSuggestion: React.ComponentType<Props> = translate()(
  SearchSuggestionBase,
);

export default SearchSuggestion;
