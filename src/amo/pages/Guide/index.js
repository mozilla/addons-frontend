/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import makeClassName from 'classnames';

import NotFound from 'amo/components/ErrorPage/NotFound';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import { getAddonByGUID } from 'core/reducers/addons';
import translate from 'core/i18n/translate';
import { sanitizeHTML } from 'core/utils';
import Icon from 'ui/components/Icon';
import GuideAddonCard from 'amo/components/GuideAddonCard';
import type { AddonType } from 'core/types/addons';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';

import './styles.scss';

export const privacyGuids = [
  '{446900e4-71c2-419f-a6a7-df9c091e268b}',
  '{9aa5dd7e-dcf1-483c-9d38-9196f3ccf723}',
  '@contain-facebook',
];

type Props = {|
  addons: Array<AddonType>,
  clientApp: string,
  _fetchGuidesAddons: Function,
  lang: string,
  match: {
    params: {
      guideSlug: string,
    },
  },
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class GuideBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    if (this.props._fetchGuidesAddons) {
      this.props._fetchGuidesAddons();
    }
  }

  getGuideSectionsHtml = (sections: Array<Object>) => {
    const { addons, clientApp, i18n, lang } = this.props;

    return addons && addons.length
      ? addons.map((addon, key) => {
          let exploreMore;

          if (sections[key].exploreMore) {
            // TODO: look into having these links use the Router (vs 'a' tag).
            // See https://github.com/mozilla/addons-frontend/issues/6787.
            exploreMore = i18n.sprintf(sections[key].exploreMore, {
              linkStart: `<a href="/${lang}/${clientApp}${
                sections[key].exploreUrl
              }">`,
              linkEnd: '</a>',
            });
          }

          return addon ? (
            <div className="Guide-section" key={addon.url}>
              <h2 className="Guide-section-title">{sections[key].header}</h2>
              <p className="Guide-section-description">
                {sections[key].description}
              </p>

              <GuideAddonCard
                addon={addon}
                addonText={sections[key].addonText}
                staffPick={sections[key].staffPick}
              />
              {/* eslint-disable react/no-danger */}
              {exploreMore && (
                <div
                  className="Guide-section-explore-more"
                  dangerouslySetInnerHTML={sanitizeHTML(exploreMore, ['a'])}
                />
              )}
              {/* eslint-enable react/no-danger */}
            </div>
          ) : null;
        })
      : null;
  };

  getPageTitle() {
    const { i18n, match } = this.props;
    const { guideSlug } = match.params;

    switch (guideSlug) {
      case 'privacy':
        return i18n.gettext('Stay Safe Online');
      default:
        break;
    }

    return false;
  }

  getGuideIntroHtml = ({ pageTitle, icon, introText, sections }) => {
    return (
      <div className="Guide">
        <div className="Guide-header">
          <Icon className="Guide-header-icon" name={icon} />
          <h1 className="Guide-header-page-title">{pageTitle}</h1>
          <p className="Guide-header-intro">{introText}</p>
        </div>
        {this.getGuideSectionsHtml(sections)}
      </div>
    );
  };

  getGuidePage = () => {
    const { i18n, match } = this.props;
    const { guideSlug } = match.params;

    switch (guideSlug) {
      // TODO: finalize urls.
      case 'privacy': {
        const introText = i18n.gettext(
          'The web is a wonderful but wild place. Your personal data can be used without your consent, your activities spied upon, and your passwords stolen. Fortunately, extensions can help fortify your online privacy and security.',
        );

        const sections = [
          // Bitwarden free password manager
          {
            header: i18n.gettext('Create and manage strong passwords'),
            description: i18n.gettext(
              'Password managers can help you create secure passwords, store your passwords (safely) in one place, and give you easy access to your login credentials wherever you are.',
            ),
            addonText: i18n.gettext(
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
            addonText: i18n.gettext(
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
            addonText: i18n.gettext(
              'Isolate your Facebook identity into a separate “container” to stop Facebook from tracking your activity outside of its social platform.',
            ),
            staffPick: true,
            exploreMore: i18n.gettext(
              'Explore more %(linkStart)sprivacy & security%(linkEnd)s staff picks.',
            ),
            exploreUrl: '/collections/mozilla/privacy-matters/',
          },
        ];

        return this.getGuideIntroHtml({
          icon: 'stop-hand',
          pageTitle: this.getPageTitle(),
          introText,
          sections,
        });
      }
      // The following will be addressed in another issue.
      // See https://github.com/mozilla/addons-frontend/issues/6744.
      case 'organize-tabs-and-bookmarks':
      case 'enhance-your-media-experience':
      default:
        return false;
    }
  };

  render() {
    const { i18n } = this.props;

    const guidePage = this.getGuidePage();
    const guideClass = makeClassName({ 'Guide-page': guidePage });

    const pageTitle = i18n.sprintf('%(pageTitle)s', {
      pageTitle: this.getPageTitle(),
    });

    return (
      <div className={guideClass}>
        <Helmet>
          <title>{pageTitle}</title>
        </Helmet>

        {guidePage || <NotFound />}
      </div>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { match } = ownProps;
  const { guideSlug } = match.params;

  const addons = [];
  let guids = [];

  switch (guideSlug) {
    case 'privacy':
      guids = privacyGuids;
      break;
    // The following will be addressed in another issue.
    // See https://github.com/mozilla/addons-frontend/issues/6744.
    case 'organize-tabs-and-bookmarks':
    case 'enhance-your-media-experience':
    default:
      break;
  }

  guids.forEach((guid) => {
    addons.push(getAddonByGUID(state, guid));
  });

  return {
    addons,
    clientApp: state.api.clientApp,
    lang: state.api.lang,
  };
};

export function mapDispatchToProps(dispatch: DispatchFunc, ownProps: Props) {
  const { match } = ownProps;
  const { guideSlug } = match.params;

  let guids;

  switch (guideSlug) {
    case 'privacy':
      guids = privacyGuids;
      break;
    default:
      break;
  }

  return {
    _fetchGuidesAddons: () =>
      dispatch(fetchGuidesAddons({ guids, errorHandlerId: guideSlug })),
  };
}

const Guide: React.ComponentType<Props> = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(GuideBase);

export default Guide;
