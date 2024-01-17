/* @flow */
import invariant from 'invariant';
import makeClassName from 'classnames';
import * as React from 'react';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { compose } from 'redux';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';

import { setViewContext } from 'amo/actions/viewContext';
import Link from 'amo/components/Link';
import HeadLinks from 'amo/components/HeadLinks';
import HeadMetaTags from 'amo/components/HeadMetaTags';
import Page from 'amo/components/Page';
import { getAddonURL } from 'amo/utils';
import { withErrorHandler } from 'amo/errorHandler';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_LANG,
  VIEW_CONTEXT_LANGUAGE_TOOLS,
} from 'amo/constants';
import { unfilteredLanguages } from 'amo/languages';
import translate from 'amo/i18n/translate';
import {
  fetchLanguageTools,
  getAllLanguageTools,
} from 'amo/reducers/languageTools';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { LanguageToolType } from 'amo/types/addons';
import type { DispatchFunc } from 'amo/types/redux';
import type { I18nType } from 'amo/types/i18n';

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

export const LanguageToolList = ({
  languageTools,
}: LanguageToolListProps): null | React.Node => {
  invariant(languageTools.length, 'languageTools should not be empty');

  return (
    <ul className="LanguageTools-addon-list">
      {languageTools.map((addon: LanguageToolType) => {
        return (
          <li key={addon.slug}>
            <Link to={getAddonURL(addon.slug)}>{addon.name}</Link>
          </li>
        );
      })}
    </ul>
  );
};

type Props = {||};

type PropsFromState = {|
  lang: string,
  languageTools: Array<LanguageToolType>,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  i18n: I18nType,
|};

export class LanguageToolsBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { dispatch, errorHandler, languageTools } = props;

    dispatch(setViewContext(VIEW_CONTEXT_LANGUAGE_TOOLS));

    if (languageTools.length === 0) {
      dispatch(fetchLanguageTools({ errorHandlerId: errorHandler.id }));
    }
  }

  languageToolsInYourLocale(): null | React.Node {
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

        <ul className="LanguageTools-in-your-locale-list">
          {languageToolsInYourLocale.map((languageTool) => {
            return (
              <li
                className="LanguageTools-in-your-locale-list-item"
                key={languageTool.slug}
              >
                <Link
                  className={`LanguageTools-in-your-locale-list-item--${languageTool.type}`}
                  to={getAddonURL(languageTool.slug)}
                >
                  {languageTool.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  render(): React.Node {
    const { languageTools, errorHandler, i18n } = this.props;

    const header = i18n.gettext('Dictionaries and Language Packs');

    return (
      <Page>
        <Card className="LanguageTools" header={header}>
          <Helmet>
            <title>{header}</title>
          </Helmet>

          <HeadMetaTags
            description={i18n.gettext(
              "Download Firefox dictionaries and language pack extensions. Add a new language option to your browser spell-checker, or change the browser's interface language.",
            )}
            title={header}
          />

          <HeadLinks />

          {errorHandler.renderErrorIfPresent()}

          <p>
            {i18n.gettext(
              'Installing a dictionary add-on will add a new language option to your spell-checker, which checks your spelling as you type in Firefox.',
            )}
          </p>
          <p>
            {i18n.gettext(
              "Language packs change your browser's interface language, including menu options and settings.",
            )}
          </p>

          {this.languageToolsInYourLocale()}

          <h2 className="LanguageTools-header">
            {i18n.gettext('All Locales')}
          </h2>

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

                      const re = new RegExp(`^${language.locale}(-\\w+){0,2}$`);

                      return (
                        addon.target_locale && re.test(addon.target_locale)
                      );
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
                          className={`LanguageTools-lang-${language.locale}-languagePacks`}
                        >
                          {languagePacks.length ? (
                            <LanguageToolList languageTools={languagePacks} />
                          ) : null}
                        </Td>
                        <Td
                          className={`LanguageTools-lang-${language.locale}-dictionaries`}
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
      </Page>
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    lang: state.api.lang,
    languageTools: getAllLanguageTools(state),
  };
};

const LanguageTools: React.ComponentType<Props> = compose(
  withErrorHandler({ name: 'LanguageTools' }),
  connect(mapStateToProps),
  translate(),
)(LanguageToolsBase);

export default LanguageTools;
