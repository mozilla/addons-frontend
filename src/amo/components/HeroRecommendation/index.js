/* @flow */
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import type { I18nType } from 'core/types/i18n';

import promoImage from './img/christin-hume-mfB1B1s4sMc-unsplash.png';
import './styles.scss';

type Props = {|
  body: string,
  heading: string,
  linkText: string,
  linkHref: string,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class HeroRecommendationBase extends React.Component<InternalProps> {
  renderOverlayShape() {
    const gradientA = 'HeroRecommendation-gradient-a';
    const gradientB = 'HeroRecommendation-gradient-b';

    return (
      <svg
        className="HeroRecommendation-overlayShape"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 334 307"
      >
        <defs>
          <linearGradient
            id={gradientA}
            x1="37.554%"
            x2="20.41%"
            y1="51.425%"
            y2="49.159%"
          >
            <stop
              className="HeroRecommendation-gradientA-startColor"
              offset="0%"
            />
            <stop
              className="HeroRecommendation-gradientA-endColor"
              offset="100%"
            />
          </linearGradient>
          <linearGradient
            id={gradientB}
            x1="0%"
            x2="100%"
            y1="36.092%"
            y2="36.092%"
          >
            <stop
              className="HeroRecommendation-gradientB-startColor"
              offset="0%"
            />
            <stop
              className="HeroRecommendation-gradientB-endColor"
              offset="100%"
            />
          </linearGradient>
        </defs>
        <g fill="none">
          <path
            className="HeroRecommendation-solidSwoosh"
            d="M0 307h267c-52.113-48.37-94.22-112.103-120.226-188.126C122.438 47.736 63.457 3.044 0 0v307z"
          />
          <path
            fill={`url(#${gradientA})`}
            d="M0 307c17.502-9.934 34.574-21.458 51.072-34.602C121.246 216.49 216.932 232.615 271 307H0z"
            transform="matrix(-1 0 0 1 334 0)"
          />
          <path
            fill={`url(#${gradientB})`}
            d="M334 307H114c31.79-24.866 61.545-54.258 88.533-88.135C237.964 174.386 285.12 148.906 334 143v164z"
            transform="matrix(-1 0 0 1 334 0)"
          />
        </g>
      </svg>
    );
  }

  render() {
    const { body, heading, i18n, linkText, linkHref } = this.props;

    invariant(body, 'The body property is required');
    invariant(heading, 'The heading property is required');
    invariant(linkText, 'The linkText property is required');
    invariant(linkHref, 'The linkHref property is required');

    // translators: If uppercase does not work in your locale, change it to lowercase.
    // This is used as a secondary heading.
    const recommended = i18n.gettext('RECOMMENDED');

    return (
      <section className="HeroRecommendation HeroRecommendation-purple">
        <div>
          <img className="HeroRecommendation-image" alt="" src={promoImage} />
        </div>
        <div className="HeroRecommendation-info">
          <div className="HeroRecommendation-recommended">{recommended}</div>
          <h2 className="HeroRecommendation-heading">{heading}</h2>
          <p className="HeroRecommendation-body">{body}</p>
          <a className="HeroRecommendation-link" href={linkHref}>
            <span className="HeroRecommendation-linkText">{linkText}</span>
          </a>
        </div>
        {this.renderOverlayShape()}
      </section>
    );
  }
}

const HeroRecommendation: React.ComponentType<Props> = compose(translate())(
  HeroRecommendationBase,
);

export default HeroRecommendation;
