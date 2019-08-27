/* @flow */
import invariant from 'invariant';
import * as React from 'react';

import type { SecondaryHeroShelfType } from 'amo/reducers/home';

import './styles.scss';

type Props = {| shelfData: SecondaryHeroShelfType |};

export const SecondaryHeroBase = ({ shelfData }: Props) => {
  const { headline, description, cta, modules } = shelfData;

  invariant(headline, 'The headline property is required');
  invariant(description, 'The description property is required');
  invariant(modules, 'The modules property is required');

  const renderedModules = [];
  modules.forEach((module) => {
    renderedModules.push(
      <div className="SecondaryHero-module" key={module.description}>
        <img
          alt={module.description}
          className="SecondaryHero-module-icon"
          src={module.icon}
        />
        <div className="SecondaryHero-module-description">
          {module.description}
        </div>
        {module.cta && (
          <a className="SecondaryHero-module-link" href={module.cta.url}>
            <span className="SecondaryHero-module-linkText">
              {module.cta.text}
            </span>
          </a>
        )}
      </div>,
    );
  });

  return (
    <section className="SecondaryHero">
      <div className="SecondaryHero-message">
        <div className="SecondaryHero-message-headline">{headline}</div>
        <div className="SecondaryHero-message-description">{description}</div>
        {cta && (
          <a className="SecondaryHero-message-link" href={cta.url}>
            <span className="SecondaryHero-message-linkText">{cta.text}</span>
          </a>
        )}
      </div>
      <div className="SecondaryHero-modules">{renderedModules}</div>
    </section>
  );
};

export default SecondaryHeroBase;
