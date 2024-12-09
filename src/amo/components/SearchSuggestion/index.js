/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { getPromotedCategory } from 'amo/utils/addons';
import Icon from 'amo/components/Icon';
import IconPromotedBadge from 'amo/components/IconPromotedBadge';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { SuggestionType } from 'amo/reducers/autocomplete';

import './styles.scss';

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
|};

export const SearchSuggestionBase = ({
  _getPromotedCategory = getPromotedCategory,
  arrowAlt,
  clientApp,
  loading,
  suggestion,
}: InternalProps): React.Node => {
  const { iconUrl, name, type } = suggestion;

  const promotedCategory = _getPromotedCategory({
    addon: suggestion,
    clientApp,
    forBadging: true,
  });

  return (
    <p
      className={makeClassName('SearchSuggestion', `SearchSuggestion--${type}`)}
    >
      <img alt={name} className="SearchSuggestion-icon" src={iconUrl} />
      <span className="SearchSuggestion-name">
        {loading ? <LoadingText minWidth={20} /> : name}
      </span>
      {promotedCategory ? (
        <IconPromotedBadge
          category={promotedCategory}
          className="SearchSuggestion-icon-promoted"
          showAlt
          size="small"
        />
      ) : null}
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
  connect(mapStateToProps),
)(SearchSuggestionBase);

export default SearchSuggestion;
