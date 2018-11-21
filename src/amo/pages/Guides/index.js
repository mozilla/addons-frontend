/* @flow */
import Helmet from 'react-helmet';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import GuidesAddonCard from 'amo/components/GuidesAddonCard';
import Link from 'amo/components/Link';
import NotFound from 'amo/components/ErrorPage/NotFound';
import HeadLinks from 'amo/components/HeadLinks';
import { fetchGuidesAddons } from 'amo/reducers/guides';
import { getAddonByGUID } from 'core/reducers/addons';
import { withFixedErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
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
  addons: {
    [guid: string]: AddonType | null,
  },
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  guids: Array<string>,
  i18n: I18nType,
  loading: boolean,
  slug: string,
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

export const getSections = ({
  slug,
  i18n,
}: {|
  slug: string,
  i18n: I18nType,
|}): Array<SectionsType> => {
  switch (slug) {
    case 'stay-safe-online':
      return [
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
        // uBlock Origin
        {
          addonGuid: '{9aa5dd7e-dcf1-483c-9d38-9196f3ccf723}',
          header: i18n.gettext('Block annoying ads'),
          description: i18n.gettext(
            `Today’s web is tangled up with unwanted advertisements that get
            in your way and slow you down. Ad-blocking extensions can block
            or filter those ads so you can get back to distraction-free
            browsing.`,
          ),
          addonCustomText: i18n.gettext(
            `Lightweight, highly effective ad blocker. uBlock Origin enforces
            thousands of content filters without chewing up a bunch of memory.`,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)sad blocker%(linkEnd)s staff picks.',
          ),
          exploreUrl: '/collections/mozilla/ad-blockers/',
        },
        // Facebook Container
        {
          addonGuid: '@contain-facebook',
          header: i18n.gettext('Stop online trackers from stalking you'),
          description: i18n.gettext(
            `Online advertisers can track your activity from one website to
            the next, gathering information about you and your interests.
            Extensions can help cover your digital trail.`,
          ),
          addonCustomText: i18n.gettext(
            `Isolate your Facebook identity into a separate “container” to stop
            Facebook from tracking your activity outside of its social platform.`,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)sprivacy & security%(linkEnd)s staff picks.',
          ),
          exploreUrl: '/collections/mozilla/privacy-matters/',
        },
      ];
    case 'organize-your-tabs':
      return [
        // Tree Style Tab
        {
          addonGuid: 'treestyletab@piro.sakura.ne.jp',
          header: i18n.gettext('Re-imagine tab management'),
          description: i18n.gettext(
            `If you typically work with a lot of open tabs, you’re probably
              familiar with the frustration of searching through a row of
              unidentifiable tabs looking for just the one you need. Extensions
              can offer creative solutions for streamlining tab management.`,
          ),
          addonCustomText: i18n.gettext(
            `Arrange and visualize your tabs in a cascading “tree” style format
               in Firefox’s sidebar.`,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)stab management%(linkEnd)s staff picks.',
          ),
          exploreUrl: '/collections/mozilla/change-up-your-tabs/',
        },
        // OneNote Web Clipper
        {
          addonGuid: 'Clipper@OneNote.com',
          header: i18n.gettext('Better browsing with improved bookmarks'),
          description: i18n.gettext(
            `Extensions can help you organize your online interests. Bookmark
              managers are ideal for folks with a lot of content to track.`,
          ),
          addonCustomText: i18n.gettext(
            `Want help organizing all of your favorite online cooking recipes,
              how-to articles, YouTube videos, or just about anything you find
              on the web? OneNote Web Clipper lets you collect and store all
              your favorite online content in a powerful repository that syncs
              across devices.`,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)sbookmark manager%(linkEnd)s staff picks.',
          ),
          exploreUrl: '/collections/mozilla/bookmark-managers/',
        },
        // Tabliss
        {
          addonGuid: 'extension@tabliss.io',
          header: i18n.gettext('Enjoy a fresh new tab experience'),
          description: i18n.gettext(
            `Start each browsing session tailored just for you by customizing
              your new tab experience.`,
          ),
          addonCustomText: i18n.gettext(
            `Enjoy a beautiful new page with customizable backgrounds, local
              weather info, and more.`,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)sfun ways to change up your tabs%(linkEnd)s with these staff picks.',
          ),
          exploreUrl: '/collections/mozilla/good-time-tabs/',
        },
      ];
    case 'enhance-your-media-experience':
      return [
        // Enhancer for YouTube
        {
          addonGuid: 'enhancerforyoutube@maximerf.addons.mozilla.org',
          header: i18n.gettext('Improve videos'),
          description: i18n.gettext(
            `If you enjoy video content, extensions offer a number of ways to
            optimize your experience, from customizing YouTube to taste, to
            playing videos in theater mode, and much more.`,
          ),
          addonCustomText: i18n.gettext(
            `Add a control bar to all YouTube video pages so you can easily
            adjust volume, playback speed, video player size, advertising and
            annotation blocking, and other features. `,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)svideo extensions%(linkEnd)s staff picks.',
          ),
          exploreUrl: '/collections/mozilla/watching-videos/',
        },
        // Search by Image - Reverse Image Search
        {
          addonGuid: '{2e5ff8c8-32fe-46d0-9fc8-6b8986621f3c}',
          header: i18n.gettext('Get more out of media'),
          description: i18n.gettext(
            `Extensions can address a wide variety of niche media needs and
            interests, like image searching, download management, and text
            readers, to name a few.`,
          ),
          addonCustomText: i18n.gettext(
            `Have you ever stumbled upon an intriguing image on the web and
            want to learn more about it, like who’s the person in the pic?
            Are there related images? This extension lets you perform quick
            and easy reverse image searches through a variety of engines.`,
          ),
          exploreMore: i18n.gettext(
            'Explore more %(linkStart)smedia extensions%(linkEnd)s staff picks.',
          ),
          exploreUrl: '/collections/mozilla/must-have-media/',
        },
        // Worldwide Radio
        {
          addonGuid: 'worldwide@radio',
          header: i18n.gettext('Bring media right into the browser'),
          description: i18n.gettext(
            `Extensions can turn Firefox into your very own entertainment
            hub that gives you instant access to music, image capturing,
            gaming, and more.`,
          ),
          addonCustomText: i18n.gettext(
            `Access 30,000+ radio stations from all over the globe, always
            just a click away.`,
          ),
          exploreMore: i18n.gettext(
            'Explore among thousands of %(linkStart)sphoto, music & video extensions%(linkEnd)s.',
          ),
          exploreUrl: '/extensions/photos-music-videos/',
        },
      ];
    default:
      return [];
  }
};

export const getContent = (slug: string, i18n: I18nType): GuideType | null => {
  switch (slug) {
    case 'stay-safe-online': {
      return {
        title: i18n.gettext('Stay Safe Online'),
        introText: i18n.gettext(
          `The web is a wonderful but wild place. Your personal data can be used
          without your consent, your activities spied upon, and your passwords
          stolen. Fortunately, extensions can help fortify your online privacy
          and security.`,
        ),
        icon: 'stop-hand',
        sections: getSections({ slug, i18n }),
      };
    }
    case 'organize-your-tabs': {
      return {
        title: i18n.gettext('Organize Tabs & Bookmarks'),
        introText: i18n.gettext(
          `Do you deal with too many open tabs or a dizzying number of bookmarks?
          Extensions can help! From organization assistance to providing fun
          new features, extensions can dramatically change the way you deal
          with tabs and bookmarks.`,
        ),
        icon: 'browser',
        sections: getSections({ slug, i18n }),
      };
    }
    case 'enhance-your-media-experience': {
      return {
        title: i18n.gettext('Enhance Your Media Experience'),
        introText: i18n.gettext(
          `Extensions can augment online media in all sorts of interesting ways,
          from watching videos to handling images, music, and more.`,
        ),
        icon: 'video',
        sections: getSections({ slug, i18n }),
      };
    }
    default:
      return null;
  }
};

export class GuidesBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const {
      addons,
      errorHandler,
      i18n,
      loading,
      match: {
        params: { slug },
      },
    } = this.props;

    if (!loading && Object.keys(addons).length === 0) {
      const guids = getSections({ slug, i18n }).map(
        (section) => section.addonGuid,
      );
      this.props.dispatch(
        fetchGuidesAddons({
          guids,
          errorHandlerId: errorHandler.id,
        }),
      );
    }
  }

  getGuidesSections = (
    sections: Array<SectionsType>,
  ): React.ChildrenArray<React.Node> => {
    const { addons, i18n } = this.props;

    return sections.map((section) => {
      const linkParts = getLocalizedTextWithLinkParts({
        i18n,
        text: section.exploreMore,
      });

      const addon = addons[section.addonGuid] || null;

      return (
        <div className="Guides-section" key={section.exploreUrl}>
          <h2 className="Guides-section-title">{section.header}</h2>
          <p className="Guides-section-description">{section.description}</p>

          <GuidesAddonCard
            addon={addon}
            addonCustomText={section.addonCustomText}
          />

          <div className="Guides-section-explore-more">
            {linkParts.beforeLinkText}
            <Link to={section.exploreUrl}>{linkParts.innerLinkText}</Link>
            {linkParts.afterLinkText}
          </div>
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

export const mapStateToProps = (state: AppState): $Shape<InternalProps> => {
  const { guids, loading } = state.guides;

  const addons = {};

  guids.forEach((guid) => {
    addons[guid] = getAddonByGUID(state, guid);
  });

  return {
    addons,
    loading,
  };
};

export const extractId = (ownProps: InternalProps) => {
  return ownProps.match.params.slug;
};

const Guides: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(GuidesBase);

export default Guides;
