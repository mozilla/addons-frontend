/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';

import EditableCollectionAddon from 'amo/components/EditableCollectionAddon';
import SearchResult from 'amo/components/SearchResult';
import CardList from 'ui/components/CardList';
import type { AddonType } from 'core/types/addons';

import './styles.scss';


type Props = {|
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  children?: React.Node,
  className?: string,
  forCollectionMaintenance?: boolean,
  loading?: boolean,
  // When loading, this is the number of placeholders
  // that will be rendered.
  placeholderCount: number,
  type?: 'horizontal' | 'vertical',
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
    forCollectionMaintenance: false,
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
      forCollectionMaintenance,
      loading,
      placeholderCount,
      showMetadata,
      showSummary,
      type,
      ...otherProps
    } = this.props;

    const addonElements = [];

    if (addons && addons.length) {
      addons.forEach((addon) => {
        if (forCollectionMaintenance) {
          addonElements.push(
            <EditableCollectionAddon
              addon={addon}
              key={addon.slug}
            />
          );
        } else {
          addonElements.push(
            <SearchResult
              addonInstallSource={addonInstallSource}
              addon={addon}
              key={addon.slug}
              showMetadata={showMetadata}
              showSummary={showSummary}
            />
          );
        }
      });
    } else if (loading) {
      for (let count = 0; count < placeholderCount; count++) {
        addonElements.push(
          <SearchResult key={count} />
        );
      }
    }

    const allClassNames = makeClassName('AddonsCard', className,
      type && `AddonsCard--${type}`);
    return (
      <CardList
        {...otherProps}
        className={allClassNames}
        ref={(ref) => { this.cardContainer = ref; }}
      >
        {children}
        {addonElements.length ? (
          <ul className="AddonsCard-list">
            {addonElements}
          </ul>
        ) : null}
      </CardList>
    );
  }
}
