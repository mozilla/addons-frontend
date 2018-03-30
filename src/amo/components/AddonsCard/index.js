/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';

import SearchResult from 'amo/components/SearchResult';
import CardList from 'ui/components/CardList';
import type { AddonType } from 'core/types/addons';

import './styles.scss';


type Props = {|
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  children?: React.Node,
  className?: string,
  loading?: boolean,
  // When loading, this is the number of placeholders
  // that will be rendered.
  placeholderCount: number,
  type?: 'horizontal',
  showMetadata?: boolean,
  showSummary?: boolean,

  // These are all passed through to Card.
  footerLink?: Object | string | null,
  footerText?: string,
  header?: React.Node,
|};

export default class AddonsCard extends React.Component<Props> {
  cardContainer: React.ElementRef<any> | null;

  static defaultProps = {
    loading: false,
    // Set this to the default API page size.
    placeholderCount: 25,
  }

  render() {
    const {
      addonInstallSource,
      addons,
      children,
      className,
      loading,
      placeholderCount,
      showMetadata,
      showSummary,
      type,
      ...otherProps
    } = this.props;

    const searchResults = [];

    if (addons && addons.length) {
      addons.forEach((addon) => {
        searchResults.push(
          <SearchResult
            addonInstallSource={addonInstallSource}
            addon={addon}
            key={addon.slug}
            showMetadata={showMetadata}
            showSummary={showSummary}
          />
        );
      });
    } else if (loading) {
      for (let count = 0; count < placeholderCount; count++) {
        searchResults.push(
          <SearchResult key={count} />
        );
      }
    }

    const allClassNames = makeClassName('AddonsCard', className, {
      'AddonsCard--horizontal': type === 'horizontal',
    });
    return (
      <CardList
        {...otherProps}
        className={allClassNames}
        ref={(ref) => { this.cardContainer = ref; }}
      >
        {children}
        {searchResults.length ? (
          <ul className="AddonsCard-list">
            {searchResults}
          </ul>
        ) : null}
      </CardList>
    );
  }
}
