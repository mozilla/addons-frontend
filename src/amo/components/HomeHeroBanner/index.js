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
            'Choose the page you see every time you open a new tab.',
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-7" linkTo="/addon/forecastfox-fix-version/">
        <h3>{i18n.gettext('Forecastfox')}</h3>

        <p>
          {i18n.gettext(
            'Get instant global weather information right in Firefox.',
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
            `Have a ton of open tabs? Organize them in a tidy sidebar.`,
          )}
        </p>
      </HeroSection>,
      <HeroSection key="hero-12" linkTo="/addon/imagus/">
        <h3>{i18n.gettext('Imagus')}</h3>

        <p>{i18n.gettext('Enlarge images by hovering your mouse over it.')}</p>
      </HeroSection>,
      <HeroSection key="hero-13" linkTo="/addon/privacy-possum/">
        <h3>{i18n.gettext('Privacy Possum')}</h3>

        <p>{i18n.gettext('Protect yourself against the sneakiest trackers')}</p>
      </HeroSection>,
      <HeroSection key="hero-14" linkTo="/addon/page-translate/">
        <h3>{i18n.gettext('Page Translate')}</h3>

        <p>
          {i18n.gettext('Translate an entire web page with a couple clicks')}
        </p>
      </HeroSection>,
      <HeroSection key="hero-15" linkTo="/addon/textmarkerpro/">
        <h3>{i18n.gettext('Textmarker')}</h3>

        <p>{i18n.gettext('Highly customizable text highlighter')}</p>
      </HeroSection>,
      <HeroSection key="hero-16" linkTo="/addon/forget_me_not/">
        <h3>{i18n.gettext('Forget Me Not')}</h3>

        <p>
          {i18n.gettext(`Make Firefox forget website data like cookies
              & local storage`)}
        </p>
      </HeroSection>,
      <HeroSection key="hero-17" linkTo="/addon/groupspeeddial/">
        <h3>{i18n.gettext('Group Speed Dial')}</h3>

        <p>
          {i18n.gettext(`Visual bookmarks for your favorite places on the
              web`)}
        </p>
      </HeroSection>,
      <HeroSection key="hero-18" linkTo="/addon/styl-us/">
        <h3>{i18n.gettext('Stylus')}</h3>

        <p>{i18n.gettext('Give your favorite websites a new look')}</p>
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
