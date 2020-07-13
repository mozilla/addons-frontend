/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { CLIENT_APP_ANDROID } from 'core/constants';
import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';
import IconPromotedBadge from 'ui/components/IconPromotedBadge';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
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
  clientApp: string,
  i18n: I18nType,
|};

export const SearchSuggestionBase = ({
  arrowAlt,
  clientApp,
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
      {isRecommended && clientApp !== CLIENT_APP_ANDROID && (
        <IconPromotedBadge
          alt={i18n.gettext('Recommended')}
          category="recommended"
          className="SearchSuggestion-icon-recommended"
          size="small"
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

export const mapStateToProps = (state: AppState) => {
  return {
    clientApp: state.api.clientApp,
  };
};

const SearchSuggestion: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(SearchSuggestionBase);

export default SearchSuggestion;
