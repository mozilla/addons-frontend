/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { isRtlLang } from 'core/i18n/utils';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  as?: string,
  addon: AddonType | null,
  linkToAddon?: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  isRTL: boolean,
|};

export const AddonTitleBase = ({
  as: Component = 'h1',
  addon,
  i18n,
  isRTL,
  linkToAddon = false,
}: InternalProps) => {
  const authors = [];

  if (addon && addon.authors) {
    const addonAuthors = addon.authors;

    // translators: A comma, used in a list of authors: a1, a2, a3.
    const comma = i18n.gettext(',');
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
        <React.Fragment>
          {linkToAddon ? (
            <Link to={`/addon/${addon.slug}/`}>{addon.name}</Link>
          ) : (
            addon.name
          )}
          {authors.length > 0 && (
            <span className="AddonTitle-author">
              {isRTL ? (
                <React.Fragment>
                  {authors}{' '}
                  {// translators: Example: add-on "by" some authors
                  i18n.gettext('by')}
                </React.Fragment>
              ) : (
                <React.Fragment>
                  {i18n.gettext('by')} {authors}
                </React.Fragment>
              )}
            </span>
          )}
        </React.Fragment>
      ) : (
        <LoadingText width={70} />
      )}
    </Component>
  );
};

const mapStateToProps = (state: AppState) => {
  return {
    isRTL: isRtlLang(state.api.lang || ''),
  };
};

const AddonTitle: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(AddonTitleBase);

export default AddonTitle;
