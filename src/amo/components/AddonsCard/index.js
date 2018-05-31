/* @flow */
/* eslint-disable react/sort-comp */
import makeClassName from 'classnames';
import * as React from 'react';

import EditableCollectionAddon from 'amo/components/EditableCollectionAddon';
import SearchResult from 'amo/components/SearchResult';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { ADDON_TYPE_THEMES } from 'core/constants';
import CardList from 'ui/components/CardList';
import type { RemoveCollectionAddonFunc } from 'amo/components/Collection';
import type { AddonType } from 'core/types/addons';

import './styles.scss';


type Props = {|
  addonInstallSource?: string,
  addons?: Array<AddonType> | null,
  children?: React.Node,
  className?: string,
  editing?: boolean,
  loading?: boolean,
  // This is passed through to EditableCollectionAddon.
  removeAddon?: RemoveCollectionAddonFunc,
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
  }

  render() {
    const {
      addonInstallSource,
      addons,
      children,
      className,
      editing,
      loading,
      removeAddon,
      placeholderCount,
      showMetadata,
      showSummary,
      type,
      ...otherProps
    } = this.props;

    const addonElements = [];

    if (addons && addons.length) {
      addons.forEach((addon) => {
        // Because static themes are technically an extension type it has a summary
        // field, but we want it to look like a theme which does not display this
        // or description field here
        const isTheme = ADDON_TYPE_THEMES.includes(addon.type);
        if (editing) {
          addonElements.push(
            <EditableCollectionAddon
              addon={addon}
              key={addon.slug}
              removeAddon={removeAddon}
            />
          );
        } else {
          addonElements.push(
            <SearchResult
              addonInstallSource={addonInstallSource}
              addon={addon}
              key={addon.slug}
              showMetadata={showMetadata}
              showSummary={!isTheme ? showSummary : false}
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
