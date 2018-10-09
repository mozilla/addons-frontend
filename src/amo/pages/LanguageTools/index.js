/* @flow */
import makeClassName from 'classnames';
import config from 'config';
import * as React from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { compose } from 'redux';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import { getCanonicalURL } from 'amo/utils';
import { withErrorHandler } from 'core/errorHandler';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'core/constants';
import { unfilteredLanguages } from 'core/languages';
import translate from 'core/i18n/translate';
import {
  fetchLanguageTools,
  getAllLanguageTools,
} from 'core/reducers/languageTools';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { LanguageToolType } from 'core/types/addons';
import type { DispatchFunc } from 'core/types/redux';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type LanguageToolListProps = {|
  languageTools: Array<LanguageToolType>,
|};

// Get languages into a list of objects sorted by the english name.
const sortedLanguages = Object.keys(unfilteredLanguages)
  .map((langKey) => {
    return {
      english: unfilteredLanguages[langKey].English,
      locale: langKey,
      native: unfilteredLanguages[langKey].native,
    };
  })
  .sort((a, b) => a.english.localeCompare(b.english));

const sortedLocales = sortedLanguages.map((language) => language.locale);

export const LanguageToolList = ({ languageTools }: LanguageToolListProps) => {
  if (!languageTools || !languageTools.length) {
    return null;
  }

  return (
    <ul className="LanguageTools-addon-list">
      {languageTools.map((addon: LanguageToolType) => {
        return (
          <li key={addon.slug}>
            <Link to={`/addon/${addon.slug}/`}>{addon.name}</Link>
          </li>
        );
      })}
    </ul>
  );
};

type Props = {|
  _config: typeof config,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
  lang: string,
  languageTools: Array<LanguageToolType>,
  locationPathname: string,
|};

export class LanguageToolsBase extends React.Component<Props> {
  static defaultProps = {
    _config: config,
  };

  constructor(props: Props) {
    super(props);

    const { dispatch, errorHandler, languageTools } = props;

    dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));

    if (languageTools.length === 0) {
      dispatch(fetchLanguageTools({ errorHandlerId: errorHandler.id }));
    }
  }

  languageToolsInYourLocale() {
    const { i18n, lang, languageTools } = this.props;

    const languageToolsInYourLocale = languageTools.filter((languageTool) => {
      return languageTool.target_locale === lang;
    });

    // This means we've loaded language tools but there aren't any available in
    // this user's locale.
    if (!languageToolsInYourLocale || !languageToolsInYourLocale.length) {
      return null;
    }

    return (
      <div className="LanguageTools-in-your-locale">
        <h2 className="LanguageTools-header">
          {i18n.gettext('Available for your locale')}
        </h2>

        {languageToolsInYourLocale ? (
          <ul className="LanguageTools-in-your-locale-list">
            {languageToolsInYourLocale.map((languageTool) => {
              return (
                <li
                  className="LanguageTools-in-your-locale-list-item"
                  key={languageTool.slug}
                >
                  <Link
                    className={`LanguageTools-in-your-locale-list-item--${
                      languageTool.type
                    }`}
                    to={`/addon/${languageTool.slug}/`}
                  >
                    {languageTool.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul>
            <li>
              <LoadingText width={20} />
            </li>
            <li>
              <LoadingText width={20} />
            </li>
          </ul>
        )}
      </div>
    );
  }

  render() {
    const {
      _config,
      languageTools,
      locationPathname,
      errorHandler,
      i18n,
    } = this.props;

    const header = i18n.gettext('Dictionaries and Language Packs');

    return (
      <Card className="LanguageTools" header={header}>
        <Helmet>
          <title>{header}</title>
          <link
            rel="canonical"
            href={getCanonicalURL({ locationPathname, _config })}
          />
        </Helmet>

        {errorHandler.renderErrorIfPresent()}

        <p>
          {i18n.gettext(`Installing a dictionary add-on will add a new language
            option to your spell-checker, which checks your spelling as you
            type in Firefox.`)}
        </p>
        <p>
          {i18n.gettext(`Language packs change your browser's interface
            language, including menu options and settings.`)}
        </p>

        {this.languageToolsInYourLocale()}

        <h2 className="LanguageTools-header">{i18n.gettext('All Locales')}</h2>

        <Table className="LanguageTools-table">
          <Thead>
            <Tr className="LanguageTools-header-row">
              <Th className="LanguageTools-header-cell LanguageTool-localeName">
                {i18n.gettext('Locale Name')}
              </Th>
              <Th className="LanguageTools-header-cell">
                {i18n.gettext('Language Packs')}
              </Th>
              <Th className="LanguageTools-header-cell">
                {i18n.gettext('Dictionaries')}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {languageTools.length
              ? sortedLanguages.map((language) => {
                  const toolsInLocale = languageTools.filter((addon) => {
                    if (sortedLocales.includes(addon.target_locale)) {
                      return addon.target_locale === language.locale;
                    }

                    const re = new RegExp(`${language.locale}(-\\w+)?`);

                    return addon.target_locale && re.test(addon.target_locale);
                  });

                  // This means there are no language tools available in this
                  // known locale.
                  if (!toolsInLocale || !toolsInLocale.length) {
                    return null;
                  }

                  const dictionaries = toolsInLocale.filter((addon) => {
                    return addon.type === ADDON_TYPE_DICT;
                  });

                  const languagePacks = toolsInLocale.filter((addon) => {
                    return addon.type === ADDON_TYPE_LANG;
                  });

                  return (
                    // Required to preserve space between strong and span.
                    /* eslint-disable react/jsx-closing-tag-location */
                    <Tr
                      className={makeClassName(
                        'LanguageTools-table-row',
                        `LanguageTools-lang-${language.locale}`,
                      )}
                      key={language.locale}
                    >
                      <Td>
                        <strong>{language.english}</strong>{' '}
                        <span lang={language.locale}>{language.native}</span>
                      </Td>
                      <Td
                        className={`LanguageTools-lang-${
                          language.locale
                        }-languagePacks`}
                      >
                        {languagePacks.length ? (
                          <LanguageToolList languageTools={languagePacks} />
                        ) : null}
                      </Td>
                      <Td
                        className={`LanguageTools-lang-${
                          language.locale
                        }-dictionaries`}
                      >
                        {dictionaries.length ? (
                          <LanguageToolList languageTools={dictionaries} />
                        ) : null}
                      </Td>
                    </Tr>
                  );
                })
              : Array.from(Array(50)).map((_, i) => (
                  // eslint-disable-next-line react/jsx-indent, react/no-array-index-key
                  <Tr key={`LoadingText-${i}`}>
                    <Td>
                      <LoadingText />
                    </Td>
                    <Td>
                      <LoadingText />
                    </Td>
                    <Td>
                      <LoadingText />
                    </Td>
                  </Tr>
                ))}
          </Tbody>
        </Table>
      </Card>
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    lang: state.api.lang,
    languageTools: getAllLanguageTools(state),
    locationPathname: state.router.location.pathname,
  };
};

const LanguageTools: React.ComponentType<Props> = compose(
  withErrorHandler({ name: 'LanguageTools' }),
  connect(mapStateToProps),
  translate(),
)(LanguageToolsBase);

export default LanguageTools;
