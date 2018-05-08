/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';

import EditableCollectionAddon from 'amo/components/EditableCollectionAddon';
import SearchResult from 'amo/components/SearchResult';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import CardList from 'ui/components/CardList';
import type { AddonType } from 'core/types/addons';

import './styles.scss';


type Props = {|
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  children?: React.Node,
  className?: string,
  editing?: boolean,
  loading?: boolean,
  placeholderText: string | null,
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
    editing: false,
    loading: false,
    placeholderCount: DEFAULT_API_PAGE_SIZE,
    placeholderText: null,
  }

  render() {
    const {
      addonInstallSource,
      addons,
      children,
      className,
      editing,
      loading,
      placeholderCount,
      showMetadata,
      showSummary,
      type,
      placeholderText,
      ...otherProps
    } = this.props;

    const addonElements = [];

    if (addons && addons.length) {
      addons.forEach((addon) => {
        if (editing) {
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

    const placeholder = placeholderText ?
      <p className="AddonsCard-placeholder-text">{placeholderText}</p> : null;

    const allClassNames = makeClassName('AddonsCard', className,
      type && `AddonsCard--${type}`,
      placeholderText && !addonElements.length && 'AddonCard--placeholder');

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
        ) : <React.Fragment>{placeholder}</React.Fragment>
      }
      </CardList>
    );
  }
}
