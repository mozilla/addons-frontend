/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import NotFound from 'amo/components/ErrorPage/NotFound';
import GuidesAddonCard from 'amo/components/GuidesAddonCard';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import { getAddonByGUID } from 'core/reducers/addons';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Icon from 'ui/components/Icon';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterMatchType } from 'core/types/router';

import './styles.scss';

type Props = {|
  match: {
    ...ReactRouterMatchType,
    params: {| guidesSlug: string |},
  },
|};

type InternalProps = {|
  ...Props,
  addons: Array<AddonType>,
  clientApp: string,
  dispatch: DispatchFunc,
  guidesSlug: string,
  guids: Array<string>,
  i18n: I18nType,
  lang: string,
|};

export const getGuids = (guidesSlug: string): Array<string> | null => {
  switch (guidesSlug) {
    case 'privacy':
      return [
        '{446900e4-71c2-419f-a6a7-df9c091e268b}',
        '{9aa5dd7e-dcf1-483c-9d38-9196f3ccf723}',
        '@contain-facebook',
      ];
    // The following will be addressed in another issue.
    // See https://github.com/mozilla/addons-frontend/issues/6744.
    case 'organize-tabs-and-bookmarks':
    case 'enhance-your-media-experience':
    default:
      return null;
  }
};

const getContent = (guidesSlug: string, i18n: I18nType): Object => {
  switch (guidesSlug) {
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
            staffPick: true,
            exploreMore: i18n.gettext(
              'Explore more %(linkStart)spassword manager%(linkEnd)s staff picks.',
            ),
            exploreUrl: '/collections/mozilla/password-managers/',
          },
          // Ublock origin
          {
            header: i18n.gettext('Block annoying ads'),
            description: i18n.gettext(
              'Today’s web is tangled up with unwanted advertisements that get in your way and slow you down. Ad-blocking extensions can block or filter those ads so you can get back to distraction-free browsing.',
            ),
            addonCustomText: i18n.gettext(
              'Lightweight, highly effective ad blocker. uBlock Origin enforces thousands of content filters without chewing up a bunch of memory.',
            ),
            staffPick: true,
            exploreMore: i18n.gettext(
              'Explore more %(linkStart)sad blockers%(linkEnd)s staff picks.',
            ),
            exploreUrl: '/collections/mozilla/ad-blockers/',
          },
          // Facebook container
          {
            header: i18n.gettext('Stop online trackers from stalking you'),
            description: i18n.gettext(
              'Online advertisers can track your activity from one website to the next, gathering information about you and your interests. Extensions can help cover your digital trail.',
            ),
            addonCustomText: i18n.gettext(
              'Isolate your Facebook identity into a separate “container” to stop Facebook from tracking your activity outside of its social platform.',
            ),
            staffPick: true,
            exploreMore: i18n.gettext(
              'Explore more %(linkStart)sprivacy & security%(linkEnd)s staff picks.',
            ),
            exploreUrl: '/collections/mozilla/privacy-matters/',
          },
        ],
      };
    // The following will be addressed in another issue.
    // See https://github.com/mozilla/addons-frontend/issues/6744.
    case 'organize-tabs-and-bookmarks':
    case 'enhance-your-media-experience':
    default:
      return {};
  }
};

export class GuidesBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { guidesSlug, guids } = this.props;

    if (!this.props.addons.length) {
      this.props.dispatch(
        fetchGuidesAddons({
          guids,
          errorHandlerId: guidesSlug,
        }),
      );
    }
  }

  getGuidesSectionsHtml = (
    sections: Array<Object>,
  ): React.ChildrenArray<React.Node> => {
    const { addons, clientApp, i18n, lang } = this.props;

    return addons
      ? addons.map((addon, key) => {
          // TODO: look into having these links use the Router (vs 'a' tag).
          // See https://github.com/mozilla/addons-frontend/issues/6787.
          const exploreMore = i18n.sprintf(sections[key].exploreMore, {
            linkStart: `<a href="/${lang}/${clientApp}${
              sections[key].exploreUrl
            }">`,
            linkEnd: '</a>',
          });

          return (
            <div className="Guides-section" key={addon && addon.url}>
              <h2 className="Guides-section-title">{sections[key].header}</h2>
              <p className="Guides-section-description">
                {sections[key].description}
              </p>

              <GuidesAddonCard
                addon={addon}
                addonCustomText={sections[key].addonCustomText}
                staffPick={sections[key].staffPick}
              />
              {/* eslint-disable react/no-danger */}
              <div
                className="Guides-section-explore-more"
                dangerouslySetInnerHTML={sanitizeHTML(exploreMore, ['a'])}
              />
              {/* eslint-enable react/no-danger */}
            </div>
          );
        })
      : null;
  };

  getGuidesPage = () => {
    const { i18n, match } = this.props;
    const { guidesSlug } = match.params;
    const { introText, icon, title: pageTitle, sections } = getContent(
      guidesSlug,
      i18n,
    );

    if (pageTitle && introText && icon && sections.length) {
      return (
        <div className="Guides">
          <div className="Guides-header">
            <Icon className="Guides-header-icon" name={icon} />
            <h1 className="Guides-header-page-title">{pageTitle}</h1>
            <p className="Guides-header-intro">{introText}</p>
          </div>
          {this.getGuidesSectionsHtml(sections)}
        </div>
      );
    }

    return null;
  };

  render() {
    const { i18n } = this.props;
    const guidesPage = this.getGuidesPage();

    if (!guidesPage) {
      return <NotFound />;
    }

    const { match } = this.props;
    const { guidesSlug } = match.params;
    const { title } = getContent(guidesSlug, i18n);
    const pageTitle = i18n.sprintf('%(pageTitle)s', {
      pageTitle: title,
    });

    return (
      <div className="Guides-page">
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>
        {guidesPage}
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { match } = ownProps;
  const { guidesSlug } = match.params;

  const addons = [];
  const guids = getGuids(guidesSlug) || [];

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
    guidesSlug,
    lang: state.api.lang,
  };
};

const Guides: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(GuidesBase);

export default Guides;
