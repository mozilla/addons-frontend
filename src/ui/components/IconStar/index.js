/* @flow */
import * as React from 'react';
import makeClassName from 'classnames';
import photon from 'photon-colors';
import { v4 as uuidv4 } from 'uuid';

import Icon from 'ui/components/Icon';
import type { Props as IconProps } from 'ui/components/Icon';

export const CLOSED_STYLE = 'closed';
export const DIM_CLOSED_STYLE = 'dimClosed';
export const HALF_STYLE = 'half';
export const OPEN_STYLE = 'open';

export const getSvgPath = (starStyle: string) => {
  switch (starStyle) {
    case CLOSED_STYLE:
    case DIM_CLOSED_STYLE:
      return 'M154.994575,670.99995 C153.704598,671.000763 152.477615,670.442079 151.630967,669.468394 C150.784319,668.49471 150.401158,667.201652 150.580582,665.923653 L153.046749,648.259919 L141.193762,635.514481 C140.080773,634.318044 139.711733,632.608076 140.232152,631.058811 C140.752571,629.509546 142.078939,628.369589 143.688275,628.088421 L160.214424,625.130961 L168.013827,609.468577 C168.767364,607.955994 170.3113,607 172.000594,607 C173.689888,607 175.233824,607.955994 175.98736,609.468577 L183.790813,625.130961 L200.329111,628.08437 C201.934946,628.371492 203.25546,629.513805 203.771316,631.062053 C204.287172,632.610301 203.915846,634.316807 202.803377,635.51043 L190.954439,648.26397 L193.420606,665.923653 C193.652457,667.578241 192.93975,669.223573 191.574418,670.185702 C190.209085,671.147831 188.420524,671.265104 186.941351,670.489485 L172.002619,662.698806 L157.047688,670.50569 C156.413201,670.833752 155.708782,671.003331 154.994575,670.99995 Z';
    case HALF_STYLE:
      return 'M1216.67559,197.013479 C1216.54115,196.628667 1216.19883,196.344304 1215.78203,196.271203 L1211.45804,195.530952 L1209.42135,191.617039 C1209.22458,191.238958 1208.8214,191 1208.38027,191 C1207.93914,191 1207.53597,191.238958 1207.33919,191.617039 L1205.30145,195.530952 L1200.98592,196.269177 C1200.56542,196.339521 1200.21894,196.624766 1200.08323,197.012329 C1199.94751,197.399891 1200.04437,197.827503 1200.33557,198.126387 L1203.43079,201.313214 L1202.78679,205.728392 C1202.72624,206.141968 1202.91235,206.553231 1203.26889,206.793722 C1203.62542,207.034213 1204.09248,207.063526 1204.47874,206.869654 L1208.37974,204.921305 L1212.28181,206.872692 C1212.66807,207.066564 1213.13512,207.037251 1213.49166,206.79676 C1213.84819,206.556269 1214.0343,206.145006 1213.97376,205.73143 L1213.3287,201.313214 L1216.42286,198.1274 C1216.71414,197.828621 1216.81115,197.401068 1216.67559,197.013479 Z';
    case OPEN_STYLE:
    default:
      return 'M317.994575,670.99995 C316.704598,671.000763 315.477615,670.442079 314.630967,669.468394 C313.784319,668.49471 313.401158,667.201652 313.580582,665.923653 L316.046749,648.259919 L304.193762,635.514481 C303.080773,634.318044 302.711733,632.608076 303.232152,631.058811 C303.752571,629.509546 305.078939,628.369589 306.688275,628.088421 L323.214424,625.130961 L331.013827,609.468577 C331.767364,607.955994 333.3113,607 335.000594,607 C336.689888,607 338.233824,607.955994 338.98736,609.468577 L346.790813,625.130961 L363.329111,628.08437 C364.934946,628.371492 366.25546,629.513805 366.771316,631.062053 C367.287172,632.610301 366.915846,634.316807 365.803377,635.51043 L353.954439,648.26397 L356.420606,665.923653 C356.652457,667.578241 355.93975,669.223573 354.574418,670.185702 C353.209085,671.147831 351.420524,671.265104 349.941351,670.489485 L335.002619,662.698806 L320.047688,670.50569 C319.413201,670.833752 318.708782,671.003331 317.994575,670.99995 Z M314.678006,634.89463 L324.603415,645.569846 L322.578647,660.041143 L335.002619,653.56309 L347.42254,660.045194 L345.397773,645.573897 L355.323182,634.89463 L341.352288,632.39902 L335.002619,619.637378 L328.648899,632.39902 L314.678006,634.89463 Z';
  }
};

export type Props = {|
  alt?: $PropertyType<IconProps, 'alt'>,
  className?: string,
  half?: boolean,
  selected?: boolean,
  readOnly?: boolean,
  yellow?: boolean,
|};

const IconStar = ({
  className,
  half = false,
  selected = false,
  readOnly = false,
  yellow = true,
  ...iconProps
}: Props) => {
  let color = photon.YELLOW_50;

  if (!yellow) {
    color = photon.GREY_50;
  }

  let starStyle = selected ? CLOSED_STYLE : OPEN_STYLE;

  if (readOnly) {
    if (half) {
      starStyle = HALF_STYLE;
    } else if (!selected) {
      starStyle = DIM_CLOSED_STYLE;
    }
  }

  let defs;
  let gProps = {
    fill: color,
    fillRule: 'nonzero',
  };

  switch (starStyle) {
    case CLOSED_STYLE:
    case DIM_CLOSED_STYLE:
      gProps = {
        ...gProps,
        transform: 'translate(-140.000000, -607.000000)',
        fillOpacity: starStyle === DIM_CLOSED_STYLE ? 0.25 : 1,
      };
      break;
    case HALF_STYLE: {
      // This id is needed in case there are multiple IconStars on 1 page.
      const id = `half${uuidv4()}`;
      defs = (
        <defs>
          <linearGradient id={id} x1="0" x2="100%" y1="0" y2="0">
            <stop offset="50%" stopColor={color} />
            <stop offset="50%" stopColor={color} stopOpacity="0.25" />
          </linearGradient>
        </defs>
      );
      gProps = {
        ...gProps,
        fill: `url(#${id})`,
        transform: 'scale(3.75) translate(-1200.000000, -191.000000)',
      };
      break;
    }
    case OPEN_STYLE:
    default:
      gProps = {
        ...gProps,
        fillOpacity: readOnly ? 0.25 : 1,
        transform: 'translate(-303.000000, -607.000000)',
      };
      break;
  }

  return (
    <Icon
      className={makeClassName('IconStar', className)}
      name="inline-content"
      {...iconProps}
    >
      <svg
        viewBox="0 0 64 64"
        className="IconStar-svg"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
        {defs}
        <g {...gProps}>
          <path d={getSvgPath(starStyle)} />
        </g>
      </svg>
    </Icon>
  );
};

export default IconStar;
