/* @flow */
import * as React from 'react';

const svg1 = (
  <svg
    className="HeroRecommendation-decoration"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 480 420"
  >
    <defs>
      <linearGradient
        id="background-noodle-1-a"
        x1="37.554%"
        x2="20.41%"
        y1="51.425%"
        y2="49.159%"
      >
        <stop offset="0%" stopColor="#592ACB" />
        <stop offset="100%" stopColor="#312A65" />
      </linearGradient>
      <linearGradient
        id="background-noodle-1-b"
        x1="0%"
        x2="100%"
        y1="36.092%"
        y2="36.092%"
      >
        <stop offset="0%" stopColor="#9059FF" />
        <stop offset="100%" stopColor="#E31587" />
      </linearGradient>
    </defs>
    <g fill="none" transform="matrix(-1 0 0 1 334 113)">
      <path
        fill="#312A65"
        d="M334,307 L67,307 C119.112636,258.629663 161.220388,194.897267 187.226377,118.874319 C211.561794,47.736239 270.543021,3.04387234 334,0 L334,307 Z"
      />
      <path
        fill="url(#background-noodle-1-a)"
        d="M0,307 C17.5018261,297.066328 34.5740674,285.542356 51.0720591,272.398174 C121.246081,216.489776 216.932316,232.61482 271,307 L0,307 Z"
      />
      <path
        fill="url(#background-noodle-1-b)"
        d="M334,307 L114,307 C145.79039,282.134461 175.545243,252.742423 202.532663,218.864661 C237.964434,174.385973 285.119738,148.906295 334,143 L334,307 Z"
      />
    </g>
  </svg>
);

const svg2 = (
  <svg
    className="HeroRecommendation-decoration"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 480 420"
  >
    <defs>
      <linearGradient
        id="background-noodle-2-a"
        x1="43.792%"
        x2="35.24%"
        y1="72.633%"
        y2="36.647%"
      >
        <stop offset="0%" stopColor="#592ACB" />
        <stop offset="100%" stopColor="#312A65" />
      </linearGradient>
      <linearGradient
        id="background-noodle-2-b"
        x1="0%"
        x2="100%"
        y1="36.092%"
        y2="36.092%"
      >
        <stop offset="0%" stopColor="#9059FF" />
        <stop offset="100%" stopColor="#E31587" />
      </linearGradient>
    </defs>
    <g fill="none" transform="translate(0 8)">
      <path
        fill="#312A65"
        d="M0,412 L0,128.75365 C31.0094766,238.211493 89.1811504,337.098969 169.23274,412 L0,412 Z"
      />
      <path
        fill="url(#background-noodle-2-a)"
        d="M0,412 L0,0 C15.5111978,74.0180542 43.5322127,146.095994 84.6678403,212.277121 C139.500279,300.495165 211.038639,367.631123 290.979914,412 L0,412 Z"
      />
      <path
        fill="url(#background-noodle-2-b)"
        d="M0,412 L0,259.885196 C22.4809046,291.225016 47.4133204,320.994453 74.7800083,348.850262 C97.4362756,371.909451 121.070413,392.95665 145.512407,412 L0,412 Z"
      />
    </g>
  </svg>
);

export const decorations = [svg1, svg2];

export const getDecorationIndex = (randomizer: () => number = Math.random) => {
  return Math.floor(randomizer() * decorations.length);
};
