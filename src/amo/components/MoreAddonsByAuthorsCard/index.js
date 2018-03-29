/* @flow */
import makeClassName from 'classnames';
import deepEqual from 'deep-eql';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonsCard from 'amo/components/AddonsCard';
import {
  fetchAddonsByAuthors,
  getAddonsForUsernames,
  getLoadingForAuthorNames,
} from 'amo/reducers/addonsByAuthors';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import type { AddonsByAuthorsState } from 'amo/reducers/addonsByAuthors';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';


type Props = {|
  addons?: Array<AddonType> | null,
  addonType?: string,
  authorNames: Array<string>,
  className?: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  forAddonSlug?: string,
  i18n: I18nType,
  loading?: boolean,
  numberOfAddons: number,

  // AddonCards prop this component also accepts
  showSummary?: boolean,
  type?: 'horizontal',
|};

export class MoreAddonsByAuthorsCardBase extends React.Component<Props> {
  static defaultProps = {
    showSummary: false,
    type: 'horizontal',
  }

  componentWillMount() {
    const { addons, addonType, authorNames, forAddonSlug } = this.props;

    if (!addons) {
      this.dispatchFetchAddonsByAuthors({ addonType, authorNames, forAddonSlug });
    }
  }

  componentWillReceiveProps({
    addonType: newAddonType,
    authorNames: newAuthorNames,
    forAddonSlug: newForAddonSlug,
  }: Props) {
    const {
      addonType: oldAddonType,
      authorNames: oldAuthorNames,
      forAddonSlug: oldForAddonSlug,
    } = this.props;

    if (
      oldAddonType !== newAddonType ||
      oldForAddonSlug !== newForAddonSlug ||
      !deepEqual(oldAuthorNames, newAuthorNames)
    ) {
      this.dispatchFetchAddonsByAuthors({
        addonType: newAddonType,
        authorNames: newAuthorNames,
        forAddonSlug: newForAddonSlug,
      });
    }
  }

  dispatchFetchAddonsByAuthors({ addonType, authorNames, forAddonSlug }: Object) {
    this.props.dispatch(fetchAddonsByAuthors({
      addonType,
      authorNames,
      forAddonSlug,
      errorHandlerId: this.props.errorHandler.id,
    }));
  }

  render() {
    const {
      addons,
      addonType,
      authorNames,
      className,
      i18n,
      loading,
      numberOfAddons,
      showSummary,
      type,
    } = this.props;

    if (!loading && (!addons || !addons.length)) {
      return null;
    }

    let header;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More dictionaries by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More dictionaries by these translators'),
          authorNames.length
        );
        break;
      case ADDON_TYPE_EXTENSION:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More extensions by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More extensions by these developers'),
          authorNames.length
        );
        break;
      case ADDON_TYPE_LANG:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More language packs by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More language packs by these translators'),
          authorNames.length
        );
        break;
      case ADDON_TYPE_THEME:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More themes by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More themes by these artists'),
          authorNames.length
        );
        break;
      default:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More add-ons by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More add-ons by these developers'),
          authorNames.length
        );
    }

    const classnames = makeClassName('MoreAddonsByAuthorsCard', className, {
      'MoreAddonsByAuthorsCard--theme': addonType === ADDON_TYPE_THEME,
    });

    return (
      <AddonsCard
        addons={addons}
        className={classnames}
        header={header}
        loading={loading}
        placeholderCount={numberOfAddons}
        showMetadata
        showSummary={showSummary}
        type={type}
      />
    );
  }
}

export const mapStateToProps = (
  state: {| addonsByAuthors: AddonsByAuthorsState |}, ownProps: Props
) => {
  const { addonType, authorNames, forAddonSlug, numberOfAddons } = ownProps;

  let addons = getAddonsForUsernames(
    state.addonsByAuthors, authorNames, addonType, forAddonSlug);
  addons = addons ?
    addons.slice(0, numberOfAddons) : addons;
  const loading = getLoadingForAuthorNames(
    state.addonsByAuthors, authorNames, addonType);

  return { addons, loading };
};

export default compose(
  translate(),
  connect(mapStateToProps),
  withErrorHandler({ name: 'MoreAddonsByAuthorsCard' }),
)(MoreAddonsByAuthorsCardBase);
