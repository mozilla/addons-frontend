/* @flow */
/* global window */
import * as React from 'react';

import Link from 'amo/components/Link';
import { checkInternalURL } from 'amo/utils';
import tracking from 'amo/tracking';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'amo/constants';
import { addQueryParams } from 'amo/utils/url';
import LoadingText from 'amo/components/LoadingText';
import type {
  LinkWithTextType,
  SecondaryHeroShelfType,
} from 'amo/reducers/home';
import './styles.scss';

export const SECONDARY_HERO_CLICK_CATEGORY = 'amo_secondary_hero_clicks';
export const SECONDARY_HERO_IMPRESSION_CATEGORY =
  'amo_secondary_hero_impressions';
export const SECONDARY_HERO_SRC = 'homepage-secondary-hero';

type Props = {| shelfData?: SecondaryHeroShelfType |};

type InternalProps = {|
  ...Props,
  _checkInternalURL: typeof checkInternalURL,
  _tracking: typeof tracking,
|};

export const makeCallToActionURL = (urlString: string): string => {
  return addQueryParams(urlString, {
    utm_source: DEFAULT_UTM_SOURCE,
    utm_medium: DEFAULT_UTM_MEDIUM,
    utm_content: SECONDARY_HERO_SRC,
  });
};

export const SecondaryHeroBase = ({
  _checkInternalURL = checkInternalURL,
  _tracking = tracking,
  shelfData,
}: InternalProps): null | React.Node => {
  if (shelfData === null) {
    // No data was returned for the secondary shelf from the API.
    return null;
  }

  const { headline, description, cta } = shelfData || {};
  const modules = (shelfData && shelfData.modules) || Array(3).fill({});

  // Fire impression event when shelfData is loaded.
  React.useEffect(() => {
    if (shelfData) {
      _tracking.sendEvent({
        category: SECONDARY_HERO_IMPRESSION_CATEGORY,
        params: { page_path: window.location.pathname },
      });
    }
  }, [shelfData, _tracking]);

  const onHeroClick = () => {
    _tracking.sendEvent({
      category: SECONDARY_HERO_CLICK_CATEGORY,
      params: { page_path: window.location.pathname },
    });
  };

  const getLinkProps = (link: LinkWithTextType | null) => {
    const props = { onClick: onHeroClick };
    if (link) {
      const urlInfo = _checkInternalURL({ urlString: link.url });
      if (urlInfo.isInternal) {
        return { ...props, to: makeCallToActionURL(urlInfo.relativeURL) };
      }
      return {
        ...props,
        href: makeCallToActionURL(link.url),
        prependClientApp: false,
        prependLang: false,
        target: '_blank',
      };
    }
    return {};
  };

  const renderedModules = [];
  modules.forEach((module) => {
    renderedModules.push(
      <div className="SecondaryHero-module" key={module.description}>
        {module.icon ? (
          <img
            alt={module.description}
            className="SecondaryHero-module-icon"
            src={module.icon}
          />
        ) : (
          <div className="SecondaryHero-module-icon" />
        )}
        <div className="SecondaryHero-module-description">
          {module.description || <LoadingText width={60} />}
        </div>
        {module.cta && (
          <Link
            className="SecondaryHero-module-link"
            {...getLinkProps(module.cta)}
          >
            <span className="SecondaryHero-module-linkText">
              {module.cta && module.cta.text}
            </span>
          </Link>
        )}
        {!module.description && (
          <div className="SecondaryHero-module-link">
            <LoadingText width={60} />
          </div>
        )}
      </div>,
    );
  });

  return (
    <section className="SecondaryHero">
      <div className="SecondaryHero-message">
        <h2 className="SecondaryHero-message-headline">
          {headline || (
            <>
              <LoadingText width={80} />
              <br />
              <LoadingText width={60} />
            </>
          )}
        </h2>
        <div className="SecondaryHero-message-description">
          {description || (
            <>
              <LoadingText width={80} />
              <br />
              <LoadingText width={60} />
            </>
          )}
        </div>
        {cta && (
          <Link className="SecondaryHero-message-link" {...getLinkProps(cta)}>
            <span className="SecondaryHero-message-linkText">{cta.text}</span>
          </Link>
        )}
        {!headline && (
          <div className="SecondaryHero-message-link">
            <LoadingText width={60} />
          </div>
        )}
      </div>
      {renderedModules}
    </section>
  );
};

export default SecondaryHeroBase;
