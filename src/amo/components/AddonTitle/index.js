/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import { getAddonURL } from 'amo/utils';
import translate from 'amo/i18n/translate';
import { isRtlLang } from 'amo/i18n/utils';
import LoadingText from 'amo/components/LoadingText';
import { addQueryParams } from 'amo/utils/url';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  as?: string,
  linkToAddon?: boolean,
  queryParamsForAttribution?: { [name: string]: string },
|};

type PropsFromState = {|
  isRTL: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  jed: I18nType,
|};

export const AddonTitleBase = ({
  addon,
  as: Component = 'h1',
  jed,
  isRTL,
  linkToAddon = false,
  queryParamsForAttribution = {},
}: InternalProps): React.Node => {
  const authors = [];

  if (addon && addon.authors) {
    const addonAuthors = addon.authors;

    // L10n: A comma, used in a list of authors: a1, a2, a3.
    const comma = jed.gettext(',');
    const separator = isRTL ? ` ${comma}` : `${comma} `;

    addonAuthors.forEach((author, index) => {
      authors.push(
        author.url ? (
          <Link key={author.id} to={`/user/${author.id}/`}>
            {author.name}
          </Link>
        ) : (
          author.name
        ),
      );

      if (index + 1 < addonAuthors.length) {
        authors.push(separator);
      }
    });
  }

  return (
    <Component className="AddonTitle">
      {addon ? (
        <>
          {linkToAddon ? (
            <Link
              to={addQueryParams(
                getAddonURL(addon.slug),
                queryParamsForAttribution,
              )}
            >
              {addon.name}
            </Link>
          ) : (
            addon.name
          )}
          {authors.length > 0 && (
            <span className="AddonTitle-author">
              {' '}
              {isRTL ? (
                <>
                  {authors}{' '}
                  {
                    // L10n: Example: add-on "by" some authors
                    jed.gettext('by')
                  }
                </>
              ) : (
                <>
                  {jed.gettext('by')} {authors}
                </>
              )}
            </span>
          )}
        </>
      ) : (
        <LoadingText width={80} />
      )}
    </Component>
  );
};

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    isRTL: isRtlLang(state.api.lang),
  };
};

const AddonTitle: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(AddonTitleBase);

export default AddonTitle;
