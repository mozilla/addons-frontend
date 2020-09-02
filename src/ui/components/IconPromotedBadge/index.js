/* @flow */
import makeClassName from 'classnames';
import * as React from 'react';
import { compose } from 'redux';

import { LINE, RECOMMENDED, VERIFIED } from 'core/constants';
import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';
import type { I18nType } from 'core/types/i18n';
import './styles.scss';

export type PromotedBadgeCategory =
  | typeof LINE
  | typeof RECOMMENDED
  | typeof VERIFIED;

export type PromotedBadgeSize = 'large' | 'small';

export const paths = {
  recommended:
    'M15.449999809265137,3.999999523162842 H4.550000190734863 C4.25,3.999999523162842 4,4.219999313354492 4,4.499999523162842 V6.999999523162842 c0,1.100000023841858 0.9800000190734863,2 2.180000066757202,2 h0.05000000074505806 a3.6700000762939453,3.6700000762939453 0 0 0 3.2200000286102295,2.9600000381469727 V13.499999523162842 h1.100000023841858 V11.959999561309814 A3.6700000762939453,3.6700000762939453 0 0 0 13.770000457763672,8.999999523162842 h0.05000000074505806 C15.020000457763672,8.999999523162842 16,8.099998950958252 16,6.999999523162842 V4.499999523162842 c0,-0.2800000011920929 -0.23999999463558197,-0.5 -0.550000011920929,-0.5 zM5.099999904632568,6.999999523162842 V4.999999523162842 h1.100000023841858 v3 c-0.6100000143051147,0 -1.100000023841858,-0.44999998807907104 -1.100000023841858,-1 zm9.819999694824219,0 c0,0.550000011920929 -0.49000000953674316,1 -1.100000023841858,1 V4.999999523162842 h1.100000023841858 v2 zM11.100000381469727,13.999999523162842 H8.899999618530273 c-2.7200000286102295,0 -2.7200000286102295,2 -2.7200000286102295,2 h7.639999866485596 s0,-2 -2.7300000190734863,-2 z',
  verified:
    'M6 14a1 1 0 0 1-.707-.293l-3-3a1 1 0 0 1 1.414-1.414l2.157 2.157 6.316-9.023a1 1 0 0 1 1.639 1.146l-7 10a1 1 0 0 1-.732.427A.863.863 0 0 1 6 14z',
};

type Props = {|
  category: PromotedBadgeCategory,
  className?: string,
  showAlt?: boolean,
  size: PromotedBadgeSize,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export const IconPromotedBadgeBase = ({
  category,
  className,
  i18n,
  showAlt = false,
  size,
}: InternalProps) => {
  const altTexts = {
    line: i18n.gettext('By Firefox'),
    recommended: i18n.gettext('Recommended'),
    verified: i18n.gettext('Verified'),
  };
  const alt = altTexts[category];

  return (
    <Icon
      alt={showAlt && alt ? alt : undefined}
      className={makeClassName('IconPromotedBadge', className, {
        'IconPromotedBadge-large': size === 'large',
        'IconPromotedBadge-small': size === 'small',
      })}
      name="inline-content"
    >
      <svg
        className="IconPromotedBadge-svg"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        {category === 'line' ? (
          <defs>
            <radialGradient
              id="a"
              cx="14.305"
              cy="3.031"
              r="18.199"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#fff36e" />
              <stop offset=".5" stopColor="#fc4055" />
              <stop offset="1" stopColor="#e31587" />
            </radialGradient>
            <radialGradient
              id="b"
              cx="1.315"
              cy="3.784"
              r="10.76"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".001" stopColor="#c60084" />
              <stop offset="1" stopColor="#fc4055" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="c"
              cx="15.858"
              cy="1.995"
              r="21.371"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#ffde67" stopOpacity=".6" />
              <stop offset=".093" stopColor="#ffd966" stopOpacity=".581" />
              <stop offset=".203" stopColor="#ffca65" stopOpacity=".525" />
              <stop offset=".321" stopColor="#feb262" stopOpacity=".432" />
              <stop offset=".446" stopColor="#fe8f5e" stopOpacity=".302" />
              <stop offset=".573" stopColor="#fd6459" stopOpacity=".137" />
              <stop offset=".664" stopColor="#fc4055" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="d"
              cx="8.451"
              cy="8.902"
              r="27.546"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".153" stopColor="#810220" />
              <stop offset=".167" stopColor="#920b27" stopOpacity=".861" />
              <stop offset=".216" stopColor="#cb2740" stopOpacity=".398" />
              <stop offset=".253" stopColor="#ef394f" stopOpacity=".11" />
              <stop offset=".272" stopColor="#fc4055" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="e"
              cx="6.368"
              cy="8.555"
              r="27.542"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".113" stopColor="#810220" />
              <stop offset=".133" stopColor="#920b27" stopOpacity=".861" />
              <stop offset=".204" stopColor="#cb2740" stopOpacity=".398" />
              <stop offset=".257" stopColor="#ef394f" stopOpacity=".11" />
              <stop offset=".284" stopColor="#fc4055" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="f"
              cx="13.937"
              cy="2.416"
              r="17.079"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#ff9640" />
              <stop offset=".8" stopColor="#fc4055" />
            </radialGradient>
            <radialGradient
              id="g"
              cx="13.937"
              cy="2.416"
              r="17.079"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".084" stopColor="#ffde67" />
              <stop offset=".147" stopColor="#ffdc66" stopOpacity=".968" />
              <stop offset=".246" stopColor="#ffd562" stopOpacity=".879" />
              <stop offset=".369" stopColor="#ffcb5d" stopOpacity=".734" />
              <stop offset=".511" stopColor="#ffbc55" stopOpacity=".533" />
              <stop offset=".667" stopColor="#ffaa4b" stopOpacity=".28" />
              <stop offset=".822" stopColor="#ff9640" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="h"
              cx="10.011"
              cy="7.729"
              r="8.36"
              gradientTransform="matrix(.247 .969 -1.011 .258 15.352 -3.965)"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".363" stopColor="#fc4055" />
              <stop offset=".443" stopColor="#fd604d" stopOpacity=".633" />
              <stop offset=".545" stopColor="#fe8644" stopOpacity=".181" />
              <stop offset=".59" stopColor="#ff9640" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="i"
              cx="8.575"
              cy="8.439"
              r="8.353"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".216" stopColor="#fc4055" stopOpacity=".8" />
              <stop offset=".267" stopColor="#fd5251" stopOpacity=".633" />
              <stop offset=".41" stopColor="#fe8345" stopOpacity=".181" />
              <stop offset=".474" stopColor="#ff9640" stopOpacity="0" />
            </radialGradient>
            <radialGradient
              id="j"
              cx="17.326"
              cy=".487"
              r="28.887"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".054" stopColor="#fff36e" />
              <stop offset=".457" stopColor="#ff9640" />
              <stop offset=".639" stopColor="#ff9640" />
            </radialGradient>
            <linearGradient
              id="k"
              x1="8.117"
              y1="-.134"
              x2="12.46"
              y2="12.441"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#b833e1" />
              <stop offset=".371" stopColor="#9059ff" />
              <stop offset=".614" stopColor="#5b6df8" />
              <stop offset="1" stopColor="#0090ed" />
            </linearGradient>
            <linearGradient
              id="l"
              x1="5.542"
              y1=".065"
              x2="13.614"
              y2="8.137"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset=".805" stopColor="#722291" stopOpacity="0" />
              <stop offset="1" stopColor="#592acb" stopOpacity=".5" />
            </linearGradient>
            <linearGradient
              id="m"
              x1="11.836"
              y1="1.378"
              x2="3.632"
              y2="15.587"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#fff36e" stopOpacity=".8" />
              <stop offset=".094" stopColor="#fff36e" stopOpacity=".699" />
              <stop offset=".752" stopColor="#fff36e" stopOpacity="0" />
            </linearGradient>
          </defs>
        ) : null}

        <circle
          className={`IconPromotedBadge-circle-bgColor--${category}`}
          cx="50%"
          cy="50%"
          r="50%"
        />
        {category === 'line' ? (
          <circle
            className="IconPromotedBadge-innerCircle-bgColor"
            cx="50%"
            cy="50%"
            r="46%"
          />
        ) : null}
        {category !== 'line' ? (
          <g fillRule="nonzero">
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--${category}`,
              )}
              d={paths[category]}
            />
          </g>
        ) : (
          <g fillRule="nonzero" style={{ isolation: 'isolate' }}>
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.389 3.14A7.894 7.894 0 0 0 8.318 0a7 7 0 0 0-3.867.97A7.472 7.472 0 0 1 8.059.1a7.1 7.1 0 0 1 7.071 6.087 7 7 0 0 1-6.9 8.2 7.151 7.151 0 0 1-3.949-1.127C1.268 11.3 1.258 7.441 1.26 6.825a8.626 8.626 0 0 1 1.189-4.266A6.656 6.656 0 0 0 .576 4.984a7.734 7.734 0 0 0-.519 4.035c.012.1.023.207.036.31a8.013 8.013 0 1 0 14.3-6.189z"
              fill="url(#a)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.389 3.14A7.894 7.894 0 0 0 8.318 0a7 7 0 0 0-3.867.97A7.472 7.472 0 0 1 8.059.1a7.1 7.1 0 0 1 7.071 6.087 7 7 0 0 1-6.9 8.2 7.151 7.151 0 0 1-3.949-1.127C1.268 11.3 1.258 7.441 1.26 6.825a8.626 8.626 0 0 1 1.189-4.266A6.656 6.656 0 0 0 .576 4.984a7.734 7.734 0 0 0-.519 4.035c.012.1.023.207.036.31a8.013 8.013 0 1 0 14.3-6.189z"
              fill="url(#b)"
              opacity=".67"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.389 3.14A7.894 7.894 0 0 0 8.318 0a7 7 0 0 0-3.867.97A7.472 7.472 0 0 1 8.059.1a7.1 7.1 0 0 1 7.071 6.087 7 7 0 0 1-6.9 8.2 7.151 7.151 0 0 1-3.949-1.127C1.268 11.3 1.258 7.441 1.26 6.825a8.626 8.626 0 0 1 1.189-4.266A6.656 6.656 0 0 0 .576 4.984a7.734 7.734 0 0 0-.519 4.035c.012.1.023.207.036.31a8.013 8.013 0 1 0 14.3-6.189z"
              fill="url(#c)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.389 3.14A7.894 7.894 0 0 0 8.318 0a7 7 0 0 0-3.867.97A7.472 7.472 0 0 1 8.059.1a7.1 7.1 0 0 1 7.071 6.087 7 7 0 0 1-6.9 8.2 7.151 7.151 0 0 1-3.949-1.127C1.268 11.3 1.258 7.441 1.26 6.825a8.626 8.626 0 0 1 1.189-4.266A6.656 6.656 0 0 0 .576 4.984a7.734 7.734 0 0 0-.519 4.035c.012.1.023.207.036.31a8.013 8.013 0 1 0 14.3-6.189z"
              fill="url(#d)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.389 3.14A7.894 7.894 0 0 0 8.318 0a7 7 0 0 0-3.867.97A7.472 7.472 0 0 1 8.059.1a7.1 7.1 0 0 1 7.071 6.087 7 7 0 0 1-6.9 8.2 7.151 7.151 0 0 1-3.949-1.127C1.268 11.3 1.258 7.441 1.26 6.825a8.626 8.626 0 0 1 1.189-4.266A6.656 6.656 0 0 0 .576 4.984a7.734 7.734 0 0 0-.519 4.035c.012.1.023.207.036.31a8.013 8.013 0 1 0 14.3-6.189z"
              fill="url(#e)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M15.325 5.965C14.875 1.9 11.253.078 8.059.1a7.765 7.765 0 0 0-3.608.872 3.913 3.913 0 0 0-.712.54c.026-.021.1-.085.23-.172l.013-.009.011-.007A5.337 5.337 0 0 1 5.531.609 8.713 8.713 0 0 1 8.168.3a6.65 6.65 0 0 1 6.25 6.4 4.818 4.818 0 0 1-4.58 4.869 4.731 4.731 0 0 1-2.967-.72A5.425 5.425 0 0 1 5.06 8.242a4.552 4.552 0 0 1 .285-3.149A4.726 4.726 0 0 1 8.464 2.7a4.3 4.3 0 0 0-1.782-.585A5.4 5.4 0 0 0 1.7 5.177a6.035 6.035 0 0 0-.2 4.638 6.683 6.683 0 0 0 2.4 3.234A7.177 7.177 0 0 0 7.326 14.4s.153.018.309.029a8.085 8.085 0 0 0 5.439-1.6c2.811-2.377 2.315-6.285 2.251-6.864z"
              fill="url(#f)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M15.325 5.965C14.875 1.9 11.253.078 8.059.1a7.765 7.765 0 0 0-3.608.872 3.913 3.913 0 0 0-.712.54c.026-.021.1-.085.23-.172l.013-.009.011-.007A5.337 5.337 0 0 1 5.531.609 8.713 8.713 0 0 1 8.168.3a6.65 6.65 0 0 1 6.25 6.4 4.818 4.818 0 0 1-4.58 4.869 4.731 4.731 0 0 1-2.967-.72A5.425 5.425 0 0 1 5.06 8.242a4.552 4.552 0 0 1 .285-3.149A4.726 4.726 0 0 1 8.464 2.7a4.3 4.3 0 0 0-1.782-.585A5.4 5.4 0 0 0 1.7 5.177a6.035 6.035 0 0 0-.2 4.638 6.683 6.683 0 0 0 2.4 3.234A7.177 7.177 0 0 0 7.326 14.4s.153.018.309.029a8.085 8.085 0 0 0 5.439-1.6c2.811-2.377 2.315-6.285 2.251-6.864z"
              fill="url(#g)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M15.325 5.965C14.875 1.9 11.253.078 8.059.1a7.765 7.765 0 0 0-3.608.872 3.913 3.913 0 0 0-.712.54c.026-.021.1-.085.23-.172l.013-.009.011-.007A5.337 5.337 0 0 1 5.531.609 8.713 8.713 0 0 1 8.168.3a6.65 6.65 0 0 1 6.25 6.4 4.818 4.818 0 0 1-4.58 4.869 4.731 4.731 0 0 1-2.967-.72A5.425 5.425 0 0 1 5.06 8.242a4.552 4.552 0 0 1 .285-3.149A4.726 4.726 0 0 1 8.464 2.7a4.3 4.3 0 0 0-1.782-.585A5.4 5.4 0 0 0 1.7 5.177a6.035 6.035 0 0 0-.2 4.638 6.683 6.683 0 0 0 2.4 3.234A7.177 7.177 0 0 0 7.326 14.4s.153.018.309.029a8.085 8.085 0 0 0 5.439-1.6c2.811-2.377 2.315-6.285 2.251-6.864z"
              style={{ 'mix-blend-mode': 'multiply' }}
              opacity=".53"
              fill="url(#h)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M15.325 5.965C14.875 1.9 11.253.078 8.059.1a7.765 7.765 0 0 0-3.608.872 3.913 3.913 0 0 0-.712.54c.026-.021.1-.085.23-.172l.013-.009.011-.007A5.337 5.337 0 0 1 5.531.609 8.713 8.713 0 0 1 8.168.3a6.65 6.65 0 0 1 6.25 6.4 4.818 4.818 0 0 1-4.58 4.869 4.731 4.731 0 0 1-2.967-.72A5.425 5.425 0 0 1 5.06 8.242a4.552 4.552 0 0 1 .285-3.149A4.726 4.726 0 0 1 8.464 2.7a4.3 4.3 0 0 0-1.782-.585A5.4 5.4 0 0 0 1.7 5.177a6.035 6.035 0 0 0-.2 4.638 6.683 6.683 0 0 0 2.4 3.234A7.177 7.177 0 0 0 7.326 14.4s.153.018.309.029a8.085 8.085 0 0 0 5.439-1.6c2.811-2.377 2.315-6.285 2.251-6.864z"
              style={{ 'mix-blend-mode': 'multiply' }}
              opacity=".53"
              fill="url(#i)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M9.24 11.568a5.148 5.148 0 0 0 3.183-.815 5.67 5.67 0 0 0 2.39-4.234C14.957 3.381 13.094 0 8.168.3a8.713 8.713 0 0 0-2.637.309 5.745 5.745 0 0 0-1.538.715l-.011.007-.013.009c-.076.054-.151.11-.224.168a6.7 6.7 0 0 1 4.2-.787c2.827.371 5.413 2.571 5.413 5.475a4.076 4.076 0 0 1-3.747 3.817A2.849 2.849 0 0 1 6.9 8.156a2.75 2.75 0 0 1 .919-2.729 2.875 2.875 0 0 0-1.81.919A3.07 3.07 0 0 0 5.735 9.6c.84 1.746 3.031 1.929 3.505 1.968z"
              fill="url(#j)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.4 3.745a4.5 4.5 0 0 0-.976-1.629 6.056 6.056 0 0 0-1.819-1.3A8.086 8.086 0 0 0 9.82.184 7.96 7.96 0 0 0 6.507.165a5.727 5.727 0 0 0-2.768 1.346 6.415 6.415 0 0 1 1.606-.64 6.712 6.712 0 0 1 6.234 1.619 5.417 5.417 0 0 1 .866 1.061 4.693 4.693 0 0 1 .123 4.773 3.8 3.8 0 0 1-2.914 1.691A4.726 4.726 0 0 0 14 7.839a4.88 4.88 0 0 0 .4-4.094z"
              fill="url(#k)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M14.4 3.745a4.5 4.5 0 0 0-.976-1.629 6.056 6.056 0 0 0-1.819-1.3A8.086 8.086 0 0 0 9.82.184 7.96 7.96 0 0 0 6.507.165a5.727 5.727 0 0 0-2.768 1.346 6.415 6.415 0 0 1 1.606-.64 6.712 6.712 0 0 1 6.234 1.619 5.417 5.417 0 0 1 .866 1.061 4.693 4.693 0 0 1 .123 4.773 3.8 3.8 0 0 1-2.914 1.691A4.726 4.726 0 0 0 14 7.839a4.88 4.88 0 0 0 .4-4.094z"
              fill="url(#l)"
            />
            <path
              className={makeClassName(
                'IconPromotedBadge-iconPath',
                `IconPromotedBadge-iconPath--line`,
              )}
              d="M8.318 0h-.073c.134 0 .269.013.4.022C8.538.021 8.429 0 8.318 0zM3.747 1.5a3.951 3.951 0 0 1 .453-.359 3.547 3.547 0 0 0-.453.364zm1.7-.653c-.032.008-.066.01-.1.019-.07.022-.147.046-.223.068.101-.029.209-.056.319-.082zm-1.7.658zm0 0zM14.389 3.14a8.12 8.12 0 0 0-.675-.77 6.368 6.368 0 0 0-.747-.677c-.072-.063-.156-.116-.233-.176a5.136 5.136 0 0 1 .693.6 4.5 4.5 0 0 1 .973 1.628 4.88 4.88 0 0 1-.4 4.094 4.723 4.723 0 0 1-4.342 2.175 2.609 2.609 0 0 0 .578-.07 2.81 2.81 0 0 1-.625.069A2.849 2.849 0 0 1 6.9 8.156a2.749 2.749 0 0 1 .919-2.729 2.875 2.875 0 0 0-1.81.919A3.07 3.07 0 0 0 5.735 9.6c.03.062.073.109.107.167a4.744 4.744 0 0 1-.782-1.525 4.552 4.552 0 0 1 .285-3.149A4.726 4.726 0 0 1 8.464 2.7a4.3 4.3 0 0 0-1.782-.585A5.4 5.4 0 0 0 1.7 5.177a5.133 5.133 0 0 0-.414 1.17 8.715 8.715 0 0 1 1.163-3.788A6.656 6.656 0 0 0 .576 4.984a7.734 7.734 0 0 0-.519 4.035c.012.1.023.207.036.31a8.013 8.013 0 1 0 14.3-6.189zM4.541.923c-.026.016-.065.033-.09.049.011-.007.025-.011.036-.018s.037-.02.054-.031zm-.09.049c-.017.01-.028.019-.044.029.025-.016.053-.03.079-.046a.378.378 0 0 0-.035.017z"
              fill="url(#m)"
            />
          </g>
        )}
      </svg>
    </Icon>
  );
};

const IconPromotedBadge: React.ComponentType<Props> = compose(translate())(
  IconPromotedBadgeBase,
);
export default IconPromotedBadge;
