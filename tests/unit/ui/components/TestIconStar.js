import * as React from 'react';
import { shallow } from 'enzyme';
import photon from 'photon-colors';

import Icon from 'ui/components/Icon';
import IconStar, {
  getSvgPath,
  CLOSED_STYLE,
  DIM_CLOSED_STYLE,
  HALF_STYLE,
  OPEN_STYLE,
} from 'ui/components/IconStar';

describe(__filename, () => {
  it('sets the default color to YELLOW', () => {
    const star = shallow(<IconStar />);

    expect(star.find('g')).toHaveProp('fill', photon.YELLOW_50);
  });

  it('changes the color to GRAY if yellow is false', () => {
    const star = shallow(<IconStar yellow={false} />);

    expect(star.find('g')).toHaveProp('fill', photon.GREY_50);
  });

  it('sets the star style to HALF_STYLE if half and readOnly are true', () => {
    const star = shallow(<IconStar readOnly half />);

    expect(star.find('defs')).toHaveLength(1);
    expect(star.find('path')).toHaveProp('d', getSvgPath(HALF_STYLE));
  });

  it("sets the star style to CLOSED_STYLE if the star is selected and it's not readOnly", () => {
    const star = shallow(<IconStar readOnly={false} selected />);

    expect(star.find('g')).toHaveProp('fillOpacity', 1);
    expect(star.find('path')).toHaveProp('d', getSvgPath(CLOSED_STYLE));
  });

  it("sets the star style to DIM_CLOSED_STYLE if the star is not selected and it's readOnly", () => {
    const star = shallow(<IconStar readOnly selected={false} />);

    expect(star.find('g')).toHaveProp('fillOpacity', 0.25);
    expect(star.find('path')).toHaveProp('d', getSvgPath(DIM_CLOSED_STYLE));
  });

  it("sets the star style to OPEN_STYLE if the star is not selected and it's not readOnly", () => {
    const star = shallow(<IconStar readOnly={false} selected={false} />);

    expect(star.find('g')).toHaveProp('fillOpacity', 1);
    expect(star.find('path')).toHaveProp('d', getSvgPath(OPEN_STYLE));
  });

  it('passes a className to the Icon component', () => {
    const star = shallow(<IconStar className="twinkle" />);

    expect(star.find(Icon)).toHaveClassName('twinkle');
  });
});
