/* @flow */
import makeClassName from 'classnames';
import invariant from 'invariant';
import * as React from 'react';

import EditableCollectionAddon from 'amo/components/EditableCollectionAddon';
import SearchResult from 'amo/components/SearchResult';
import { DEFAULT_API_PAGE_SIZE } from 'amo/api';
import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import CardList from 'amo/components/CardList';
import type {
  DeleteAddonNoteFunc,
  RemoveCollectionAddonFunc,
  SaveAddonNoteFunc,
} from 'amo/pages/Collection';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';

import './styles.scss';

type DefaultProps = {|
  editing?: boolean,
  isHomepageCard?: boolean,
  loading?: boolean,
  // When loading, this is the number of placeholders
  // that will be rendered.
  placeholderCount: number,
  showPromotedBadge?: boolean,
  useThemePlaceholder?: boolean,
|};

type Props = {|
  ...DefaultProps,
  addonInstallSource?: string,
  addons?: $ReadOnlyArray<AddonType | CollectionAddonType> | null,
  children?: React.Node,
  className?: string,
  type?: 'horizontal' | 'vertical',
  showFullSizePreview?: boolean,
  showMetadata?: boolean,
  showPromotedBadge?: boolean,
  showSummary?: boolean,

  // These are all passed through to Card.
  footer?: React.Node,
  footerLink?: Object | string | null,
  footerText?: string,
  header?: React.Node,
  isHomepageCard?: boolean,

  // These are passed through to EditableCollectionAddon.
  deleteNote?: DeleteAddonNoteFunc,
  removeAddon?: RemoveCollectionAddonFunc,
  saveNote?: SaveAddonNoteFunc,

  // These are passed through to SearchResult.
  onAddonClick?: (addon: AddonType | CollectionAddonType) => void,
  onAddonImpression?: (addon: AddonType | CollectionAddonType) => void,
|};

export default class AddonsCard extends React.Component<Props> {
  static defaultProps: DefaultProps = {
    editing: false,
    isHomepageCard: false,
    loading: false,
    placeholderCount: DEFAULT_API_PAGE_SIZE,
    showPromotedBadge: true,
    useThemePlaceholder: false,
  };

  render(): React.Node {
    const {
      addonInstallSource,
      addons,
      children,
      className,
      deleteNote,
      editing,
      loading,
      removeAddon,
      saveNote,
      onAddonClick,
      onAddonImpression,
      placeholderCount,
      useThemePlaceholder,
      showFullSizePreview,
      showMetadata,
      showPromotedBadge,
      showSummary,
      type,
      ...otherProps
    } = this.props;

    const addonElements = [];

    if (addons && addons.length) {
      addons.forEach((addon) => {
        // Because a static theme is technically an extension, it has a summary
        // field, but we want it to look like a theme, which does not display
        // any summary or description.
        if (editing) {
          invariant(deleteNote, 'deleteNote() is undefined');
          invariant(removeAddon, 'removeAddon() is undefined');
          invariant(saveNote, 'saveNote() is undefined');
          addonElements.push(
            <EditableCollectionAddon
              addon={addon}
              deleteNote={deleteNote}
              key={addon.slug}
              removeAddon={removeAddon}
              saveNote={saveNote}
            />,
          );
        } else {
          addonElements.push(
            <SearchResult
              addonInstallSource={addonInstallSource}
              addon={addon}
              key={`${addon.slug}-${addon.type}`}
              onClick={onAddonClick}
              onImpression={onAddonImpression}
              showFullSizePreview={showFullSizePreview}
              showMetadata={showMetadata}
              showPromotedBadge={showPromotedBadge}
              showSummary={
                ADDON_TYPE_STATIC_THEME !== addon.type ? showSummary : false
              }
            />,
          );
        }
      });
    } else if (loading) {
      for (let count = 0; count < placeholderCount; count++) {
        addonElements.push(
          <SearchResult
            key={count}
            useThemePlaceholder={useThemePlaceholder}
          />,
        );
      }
    }

    const allClassNames = makeClassName(
      'AddonsCard',
      className,
      type && `AddonsCard--${type}`,
    );
    return (
      <CardList {...otherProps} className={allClassNames}>
        {children}
        {addonElements.length ? (
          <ul className="AddonsCard-list">{addonElements}</ul>
        ) : null}
      </CardList>
    );
  }
}
