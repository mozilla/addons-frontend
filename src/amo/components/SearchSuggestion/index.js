/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getPromotedCategory } from 'amo/utils/addons';
import Icon from 'amo/components/Icon';
import Badge, { BadgeIcon } from 'amo/components/Badge';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { SuggestionType } from 'amo/reducers/autocomplete';
import translate from 'amo/i18n/translate';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';
import { getPromotedProps } from '../../utils/promoted';

type Props = {|
  arrowAlt?: string,
  loading: boolean,
  suggestion: SuggestionType,
|};

type PropsFromState = {|
  clientApp: string,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  _getPromotedCategory: typeof getPromotedCategory,
  i18n: I18nType,
|};

export const SearchSuggestionBase = ({
  _getPromotedCategory = getPromotedCategory,
  arrowAlt,
  clientApp,
  loading,
  suggestion,
  i18n,
}: InternalProps): React.Node => {
  const { iconUrl, name, type } = suggestion;

  const promotedCategory = _getPromotedCategory({
    addon: suggestion,
    clientApp,
    forBadging: true,
  });

  let badgeIcon = null;

  if (promotedCategory) {
    const badgeProps = getPromotedProps(i18n, promotedCategory);

    badgeIcon = (
      <Badge type={badgeProps.category} label={badgeProps.alt} size="large">
        {(props) => (
          <BadgeIcon {...props} className="SearchSuggestion-icon-promoted" />
        )}
      </Badge>
    );
  }

  return (
    <p
      className={makeClassName('SearchSuggestion', `SearchSuggestion--${type}`)}
    >
      <img alt={name} className="SearchSuggestion-icon" src={iconUrl} />
      <span className="SearchSuggestion-name">
        {loading ? <LoadingText minWidth={20} /> : name}
      </span>
      {badgeIcon}
      <Icon
        alt={arrowAlt}
        className="SearchSuggestion-icon-arrow"
        name="arrow-blue"
      />
    </p>
  );
};

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    clientApp: state.api.clientApp,
  };
};

const SearchSuggestion: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(SearchSuggestionBase);

export default SearchSuggestion;
