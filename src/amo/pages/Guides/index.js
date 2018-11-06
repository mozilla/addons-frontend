/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import NotFound from 'amo/components/ErrorPage/NotFound';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import { withFixedErrorHandler } from 'core/errorHandler';
import { getAddonByGUID } from 'core/reducers/addons';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Icon from 'ui/components/Icon';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterMatchType } from 'core/types/router';

import './styles.scss';

type Props = {|
  match: {
    ...ReactRouterMatchType,
    params: {| slug: string |},
  },
|};

type InternalProps = {|
  ...Props,
  addons: Array<AddonType>,
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  slug: string,
  guids: Array<string>,
  i18n: I18nType,
  lang: string,
|};

type SectionsType = {|
  header: string,
  description: string,
  addonCustomText: string,
  exploreMore: string,
  exploreUrl: string,
|};

type GetContentType = {|
  title: string,
  introText: string,
  icon: string,
  sections: Array<SectionsType>,
|};

export const getGuids = (slug: string): Array<string> | null => {
  switch (slug) {
    case 'privacy':
      return ['{446900e4-71c2-419f-a6a7-df9c091e268b}'];
    default:
      return null;
  }
};

export const getContent = (
  slug: string,
  i18n: I18nType,
): GetContentType | null => {
  switch (slug) {
    case 'privacy':
      return {
        title: i18n.gettext('Stay Safe Online'),
        introText: i18n.gettext(
          'The web is a wonderful but wild place. Your personal data can be used without your consent, your activities spied upon, and your passwords stolen. Fortunately, extensions can help fortify your online privacy and security.',
        ),
        icon: 'stop-hand',
        sections: [
          // Bitwarden free password manager
          {
            header: i18n.gettext('Create and manage strong passwords'),
            description: i18n.gettext(
              'Password managers can help you create secure passwords, store your passwords (safely) in one place, and give you easy access to your login credentials wherever you are.',
            ),
            addonCustomText: i18n.gettext(
              'Fully encrypted password protection. Store your data securely and access logins across devices.',
            ),
            exploreMore: i18n.gettext(
              'Explore more %(linkStart)spassword manager%(linkEnd)s staff picks.',
            ),
            exploreUrl: '/collections/mozilla/password-managers/',
          },
        ],
      };
    default:
      return null;
  }
};

export class GuidesBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { errorHandler, guids } = this.props;

    this.props.dispatch(
      fetchGuidesAddons({
        guids,
        errorHandlerId: errorHandler.id,
      }),
    );
  }

  getGuidesSections = (
    sections: Array<SectionsType>,
  ): React.ChildrenArray<React.Node> => {
    const { clientApp, i18n, lang } = this.props;

    return sections.map((section) => {
      const exploreMore = i18n.sprintf(section.exploreMore, {
        linkStart: `<a href="/${lang}/${clientApp}${section.exploreUrl}">`,
        linkEnd: '</a>',
      });

      return (
        <div className="Guides-section" key={section.exploreUrl}>
          <h2 className="Guides-section-title">{section.header}</h2>
          <p className="Guides-section-description">{section.description}</p>

          {/* eslint-disable react/no-danger */}
          <div
            className="Guides-section-explore-more"
            dangerouslySetInnerHTML={sanitizeHTML(exploreMore, ['a'])}
          />
          {/* eslint-enable react/no-danger */}
        </div>
      );
    });
  };

  render() {
    const { i18n, match } = this.props;
    const { slug } = match.params;
    const content = getContent(slug, i18n);

    if (!content) {
      return <NotFound />;
    }

    const { introText, icon, title, sections } = content;

    return (
      <div className="Guides-page">
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <div className="Guides">
          <div className="Guides-header">
            <Icon className="Guides-header-icon" name={icon} />
            <h1 className="Guides-header-page-title">{title}</h1>
            <p className="Guides-header-intro">{introText}</p>
            {this.getGuidesSections(sections)}
          </div>
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { match } = ownProps;
  const { slug } = match.params;

  const addons = [];
  const guids = getGuids(slug) || [];

  guids.forEach((guid) => {
    const addon = getAddonByGUID(state, guid);
    if (addon) {
      addons.push(addon);
    }
  });

  return {
    addons,
    clientApp: state.api.clientApp,
    guids,
    lang: state.api.lang,
    slug,
  };
};

export const extractId = (ownProps: InternalProps) => {
  return ownProps.match.params.slug;
};

const Guides: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(GuidesBase);

export default Guides;
