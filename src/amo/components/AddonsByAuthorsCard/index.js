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
  addons?: Array<AddonType>,
  addonType?: string,
  authorDisplayName: string,
  authorUsernames: Array<string>,
  className?: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  forAddonSlug?: string,
  i18n: I18nType,
  loading?: boolean,
  numberOfAddons: number,
  showMore?: boolean,

  // AddonCards prop this component also accepts
  showSummary?: boolean,
  type?: 'horizontal' | 'vertical',
|};

export class AddonsByAuthorsCardBase extends React.Component<Props> {
  static defaultProps = {
    showSummary: false,
    type: 'horizontal',
    showMore: true,
  }

  componentWillMount() {
    const { addons, addonType, authorUsernames, forAddonSlug } = this.props;

    if (!addons) {
      this.dispatchFetchAddonsByAuthors({ addonType, authorUsernames, forAddonSlug });
    }
  }

  componentWillReceiveProps({
    addonType: newAddonType,
    authorUsernames: newAuthorNames,
    forAddonSlug: newForAddonSlug,
  }: Props) {
    const {
      addonType: oldAddonType,
      authorUsernames: oldAuthorNames,
      forAddonSlug: oldForAddonSlug,
    } = this.props;

    if (
      oldAddonType !== newAddonType ||
      oldForAddonSlug !== newForAddonSlug ||
      !deepEqual(oldAuthorNames, newAuthorNames)
    ) {
      this.dispatchFetchAddonsByAuthors({
        addonType: newAddonType,
        authorUsernames: newAuthorNames,
        forAddonSlug: newForAddonSlug,
      });
    }
  }

  dispatchFetchAddonsByAuthors({ addonType, authorUsernames, forAddonSlug }: Object) {
    this.props.dispatch(fetchAddonsByAuthors({
      addonType,
      authorUsernames,
      forAddonSlug,
      errorHandlerId: this.props.errorHandler.id,
    }));
  }

  render() {
    const {
      addons,
      addonType,
      authorDisplayName,
      authorUsernames,
      className,
      i18n,
      loading,
      numberOfAddons,
      showSummary,
      type,
      showMore,
    } = this.props;

    if (!loading && (!addons || !addons.length)) {
      return null;
    }

    let header;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More dictionaries by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More dictionaries by these translators'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Dictionaries by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Dictionaries by these translators'),
          authorUsernames.length
        );
        break;
      case ADDON_TYPE_EXTENSION:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More extensions by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More extensions by these developers'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Extensions by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Extensions by these developers'),
          authorUsernames.length
        );
        break;
      case ADDON_TYPE_LANG:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More language packs by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More language packs by these translators'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Language packs by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Language packs by these translators'),
          authorUsernames.length
        );
        break;
      case ADDON_TYPE_THEME:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More themes by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More themes by these artists'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Themes by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Themes by these artists'),
          authorUsernames.length
        );
        break;
      default:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More add-ons by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More add-ons by these developers'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Add-ons by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Add-ons by these developers'),
          authorUsernames.length
        );
    }

    const classnames = makeClassName('AddonsByAuthorsCard', className, {
      'AddonsByAuthorsCard--theme': addonType === ADDON_TYPE_THEME,
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
  const { addonType, authorUsernames, forAddonSlug, numberOfAddons } = ownProps;

  let addons = getAddonsForUsernames(
    state.addonsByAuthors, authorUsernames, addonType, forAddonSlug);
  addons = addons ?
    addons.slice(0, numberOfAddons) : addons;
  const loading = getLoadingForAuthorNames(
    state.addonsByAuthors, authorUsernames, addonType);

  return { addons, loading };
};

export default compose(
  translate(),
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonsByAuthorsCard' }),
)(AddonsByAuthorsCardBase);
