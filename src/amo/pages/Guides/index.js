/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import GuidesAddonCard from 'amo/components/GuidesAddonCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import HeadLinks from 'amo/components/HeadLinks';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Icon from 'ui/components/Icon';
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
  clientApp: string,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  slug: string,
  guids: Array<string>,
  i18n: I18nType,
  lang: string,
|};

type SectionsType = {|
  addonGuid: string,
  header: string,
  description: string,
  addonCustomText: string,
  exploreMore: string,
  exploreUrl: string,
|};

type GuideType = {|
  title: string,
  introText: string,
  icon: string,
  sections: Array<SectionsType>,
|};

export const getContent = (slug: string, i18n: I18nType): GuideType | null => {
  switch (slug) {
    case 'privacy':
      return {
        title: i18n.gettext('Stay Safe Online'),
        introText: i18n.gettext(
          `The web is a wonderful but wild place. Your personal data can be used
           without your consent, your activities spied upon, and your passwords
           stolen. Fortunately, extensions can help fortify your online privacy
           and security.`,
        ),
        icon: 'stop-hand',
        sections: [
          // Bitwarden free password manager
          {
            addonGuid: '{446900e4-71c2-419f-a6a7-df9c091e268b}',
            header: i18n.gettext('Create and manage strong passwords'),
            description: i18n.gettext(
              `Password managers can help you create secure passwords, store your
               passwords (safely) in one place, and give you easy access to your
               login credentials wherever you are.`,
            ),
            addonCustomText: i18n.gettext(
              `Fully encrypted password protection. Store your data securely and
               access logins across devices.`,
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

    const { errorHandler, i18n, match } = this.props;
    const { slug } = match.params;
    const content = getContent(slug, i18n);

    if (!content) {
      return;
    }

    const guids = content.sections.map((section) => section.addonGuid);

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
      // TODO: look into having these links use the Router (vs 'a' tag).
      // See https://github.com/mozilla/addons-frontend/issues/6787.
      const exploreMoreLink = i18n.sprintf(section.exploreMore, {
        linkStart: `<a class="Guides-section-explore-more-link" href="/${lang}/${clientApp}${
          section.exploreUrl
        }">`,
        linkEnd: '</a>',
      });

      return (
        <div className="Guides-section" key={section.exploreUrl}>
          <h2 className="Guides-section-title">{section.header}</h2>
          <p className="Guides-section-description">{section.description}</p>

          <GuidesAddonCard
            addonGuid={section.addonGuid}
            addonCustomText={section.addonCustomText}
          />

          <div
            className="Guides-section-explore-more"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeHTML(exploreMoreLink, ['a'])}
          />
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
        <HeadLinks />
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

export const mapStateToProps = (state: AppState) => {
  const { clientApp, lang } = state.api;

  return {
    clientApp,
    lang,
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
