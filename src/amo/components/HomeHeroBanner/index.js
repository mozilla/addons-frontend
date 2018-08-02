/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Hero from 'ui/components/Hero';
import HeroSection from 'ui/components/HeroSection';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  i18n: I18nType,
|};

export class HomeHeroBannerBase extends React.Component<Props> {
  sections() {
    const { i18n } = this.props;

    return [
      <HeroSection key="hero-1" linkTo="/addon/facebook-container/">
        <h3>{i18n.gettext('Facebook Container')}</h3>

        <p>
          {i18n.gettext('Prevent Facebook from tracking you around the web')}
        </p>
      </HeroSection>,
      <HeroSection key="hero-2" linkTo="/addon/midnight-lizard-quantum/">
        <h3>{i18n.gettext('Midnight Lizard')}</h3>

        <p>{i18n.gettext('Give the entire internet a new look')}</p>
      </HeroSection>,
      <HeroSection key="hero-3" linkTo="/addon/turbo-download-manager/">
        <h3>{i18n.gettext('Turbo Download Manager')}</h3>

        <p>
          {i18n.gettext(`Increase download speeds with multi-threading
              support`)}
        </p>
      </HeroSection>,
      <HeroSection key="hero-4" linkTo="/addon/auth-helper/">
        <h3>{i18n.gettext('Authenticator')}</h3>
        <p>
          {i18n.gettext('Generate 2-step verification codes right in Firefox')}
        </p>
      </HeroSection>,
      <HeroSection key="hero-5" linkTo="/addon/ip-address-and-domain-info/">
        <h3>{i18n.gettext('IP Address and Domain Information')}</h3>
        <p>
          {i18n.gettext(
            `See detailed info about every website you visit—IP address, location, provider & more`,
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-6" linkTo="/addon/new-tab-override/">
        <h3>{i18n.gettext('New Tab Override')}</h3>

        <p>
          {i18n.gettext(
            'Choose the page you see every time you open a new tab',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-7" linkTo="/addon/forecastfox-fix-version/">
        <h3>{i18n.gettext('Forecastfox')}</h3>

        <p>
          {i18n.gettext(
            'Get instant global weather information right in Firefox',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-8" linkTo="/addon/multi-account-containers/">
        <h3>{i18n.gettext('Multi-Account Containers')}</h3>

        <p>
          {i18n.gettext(`Keep different parts of your online
              life—work, personal, etc.—separated by color-coded tabs`)}
        </p>
      </HeroSection>,
      <HeroSection key="hero-9" linkTo="/addon/transparent-standalone-image/">
        <h3>{i18n.gettext('Transparent Standalone Images')}</h3>

        <p>{i18n.gettext('Render images on transparent backgrounds')}</p>
      </HeroSection>,
      <HeroSection key="hero-10" linkTo="/addon/tabliss/">
        <h3>{i18n.gettext('Tabliss')}</h3>

        <p>
          {i18n.gettext(`Enjoy a gorgeous new tab page with customizable
              backgrounds, local weather & more`)}
        </p>
      </HeroSection>,
      <HeroSection key="hero-11" linkTo="/addon/tree-style-tab/">
        <h3>{i18n.gettext('Tree Style Tab')}</h3>

        <p>
          {i18n.gettext(
            'Have a ton of open tabs? Organize them in a tidy sidebar',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-12" linkTo="/addon/imagus/">
        <h3>{i18n.gettext('Imagus')}</h3>

        <p>{i18n.gettext('Enlarge images by hovering your mouse over it')}</p>
      </HeroSection>,
      <HeroSection key="hero-13" linkTo="/addon/privacy-possum/">
        <h3>{i18n.gettext('Privacy Possum')}</h3>

        <p>{i18n.gettext('Protect yourself against the sneakiest trackers')}</p>
      </HeroSection>,
      <HeroSection key="hero-14" linkTo="/addon/default-bookmark-folder/">
        <h3>{i18n.gettext('Default Bookmark Folder')}</h3>

        <p>
          {i18n.gettext('Change the default destination for your bookmarks')}
        </p>
      </HeroSection>,
      <HeroSection key="hero-15" linkTo="/addon/textmarkerpro/">
        <h3>{i18n.gettext('Textmarker')}</h3>

        <p>{i18n.gettext('Highly customizable text highlighter')}</p>
      </HeroSection>,
      <HeroSection key="hero-16" linkTo="/addon/w2g/">
        <h3>{i18n.gettext('Watch2Gether')}</h3>

        <p>{i18n.gettext('Watch videos simultaneously with others')}</p>
      </HeroSection>,
      <HeroSection key="hero-17" linkTo="/addon/contextual-search/">
        <h3>{i18n.gettext('Context Search')}</h3>

        <p>
          {i18n.gettext(
            'Highlight text on any webpage to easily search the term',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-18" linkTo="/addon/styl-us/">
        <h3>{i18n.gettext('Stylus')}</h3>

        <p>{i18n.gettext('Give your favorite websites a new look')}</p>
      </HeroSection>,
      <HeroSection key="hero-19" linkTo="/addon/search-encrypt/">
        <h3>{i18n.gettext('Search Encrypt')}</h3>

        <p>{i18n.gettext('Privacy protection for your search data')}</p>
      </HeroSection>,
      <HeroSection key="hero-20" linkTo="/addon/auto-tab-discard/">
        <h3>{i18n.gettext('Auto Tab Discard')}</h3>

        <p>{i18n.gettext('Save memory by disabling inactive tabs')}</p>
      </HeroSection>,
      <HeroSection key="hero-21" linkTo="/addon/update-scanner/">
        <h3>{i18n.gettext('Update Scanner')}</h3>

        <p>
          {i18n.gettext(
            'Get notified when your selected websites update with new content',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-22" linkTo="/addon/autofullscreen/">
        <h3>{i18n.gettext('Auto Fullscreen')}</h3>

        <p>{i18n.gettext('Automatically start Firefox in full screen mode')}</p>
      </HeroSection>,
      <HeroSection key="hero-23" linkTo="/addon/videospeed/">
        <h3>{i18n.gettext('Video Speed Controller')}</h3>

        <p>{i18n.gettext('Adjust video playback speeds with shortcuts')}</p>
      </HeroSection>,
      <HeroSection key="hero-24" linkTo="/addon/view-image/">
        <h3>{i18n.gettext('View Image')}</h3>

        <p>
          {i18n.gettext(
            `Revive the ‘View Image’ and ‘Search by Image’ buttons on Google Images`,
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-25" linkTo="/addon/neat-url/">
        <h3>{i18n.gettext('Neat URL')}</h3>

        <p>{i18n.gettext('Clean up links for easy sharing')}</p>
      </HeroSection>,
      <HeroSection key="hero-26" linkTo="/addon/glitterdrag/">
        <h3>{i18n.gettext('Glitter Drag')}</h3>

        <p>
          {i18n.gettext(
            'Drag text, images, or links to perform actions like copy, open, search, and more',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-27" linkTo="/addon/behind-the-overlay-revival/">
        <h3>{i18n.gettext('Behind The Overlay Revival')}</h3>

        <p>{i18n.gettext('Click a button to close annoying pop-ups')}</p>
      </HeroSection>,
      <HeroSection key="hero-28" linkTo="/addon/auto-sort-bookmarks/">
        <h3>{i18n.gettext('Auto-Sort Bookmarks')}</h3>

        <p>
          {i18n.gettext(
            'Automatically sorts bookmarks so they’re in your preferred position',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-29" linkTo="/addon/britannica-insights/">
        <h3>{i18n.gettext('Britannica Insights')}</h3>

        <p>{i18n.gettext('Add Britannica facts to your search results')}</p>
      </HeroSection>,
    ];
  }

  render() {
    return (
      <div className="HomeHeroBanner">
        <Hero name="Home" random sections={this.sections()} />
      </div>
    );
  }
}

const HomeHeroBanner: React.ComponentType<Props> = compose(translate())(
  HomeHeroBannerBase,
);

export default HomeHeroBanner;
