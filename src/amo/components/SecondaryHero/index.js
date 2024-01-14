/* @flow */
import * as React from 'react';

import Link from 'amo/components/Link';
import { checkInternalURL, stripLangFromAmoUrl } from 'amo/utils';
import tracking from 'amo/tracking';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'amo/constants';
import { addQueryParams } from 'amo/utils/url';
import LoadingText from 'amo/components/LoadingText';
import type {
  LinkWithTextType,
  SecondaryHeroShelfType,
} from 'amo/reducers/home';
import type { AnchorEvent } from 'amo/types/dom';

import './styles.scss';

export const SECONDARY_HERO_CLICK_ACTION = 'secondary-hero-click';
export const SECONDARY_HERO_CLICK_CATEGORY = 'AMO Secondary Hero Clicks';
export const SECONDARY_HERO_SRC = 'homepage-secondary-hero';

type Props = {| shelfData?: SecondaryHeroShelfType |};

type InternalProps = {|
  ...Props,
  _checkInternalURL: typeof checkInternalURL,
  _stripLangFromAmoUrl: typeof stripLangFromAmoUrl,
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
  _stripLangFromAmoUrl = stripLangFromAmoUrl,
  _tracking = tracking,
  shelfData,
}: InternalProps): null | React.Node => {
  if (shelfData === null) {
    // No data was returned for the secondary shelf from the API.
    return null;
  }

  const { headline, description, cta } = shelfData || {};
  const modules = (shelfData && shelfData.modules) || Array(3).fill({});

  const onHeroClick = (event: AnchorEvent) => {
    _tracking.sendEvent({
      action: SECONDARY_HERO_CLICK_ACTION,
      category: SECONDARY_HERO_CLICK_CATEGORY,
      label: _stripLangFromAmoUrl({ urlString: event.currentTarget.href }),
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
