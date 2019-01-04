import * as React from 'react';
import { shallow } from 'enzyme';

import Icon from 'ui/components/Icon';
import IconStar, {
  getSvgPath,
  CLOSED_STYLE,
  DIM_CLOSED_STYLE,
  HALF_STYLE,
  OPEN_STYLE,
  YELLOW,
  GRAY,
} from 'ui/components/IconStar';

describe(__filename, () => {
  it('sets the default color to YELLOW', () => {
    const star = shallow(<IconStar />);

    expect(star.find('g')).toHaveProp('fill', YELLOW);
  });

  it('changes the color to GRAY if yellow is false', () => {
    const star = shallow(<IconStar yellow={false} />);

    expect(star.find('g')).toHaveProp('fill', GRAY);
  });

  it('sets the star style to HALF_STYLE if half and readOnly are true', () => {
    const star = shallow(<IconStar readOnly half />);

    expect(star.find('defs')).toHaveLength(1);
    expect(star.find('path').html()).toContain(getSvgPath(HALF_STYLE));
  });

  it("sets the star style to CLOSED_STYLE if the star is selected and it's not readOnly", () => {
    const star = shallow(<IconStar readOnly={false} selected />);

    expect(star.find('g')).toHaveProp('fillOpacity', 1);
    expect(star.find('path').html()).toContain(getSvgPath(CLOSED_STYLE));
  });

  it("sets the star style to DIM_CLOSED_STYLE if the star is not selected and it's readOnly", () => {
    const star = shallow(<IconStar readOnly selected={false} />);

    expect(star.find('g')).toHaveProp('fillOpacity', 0.25);
    expect(star.find('path').html()).toContain(getSvgPath(DIM_CLOSED_STYLE));
  });

  it("sets the star style to OPEN_STYLE if the star is not selected and it's not readOnly ", () => {
    const star = shallow(<IconStar readOnly={false} selected={false} />);

    expect(star.find('g')).toHaveProp('fillOpacity', 1);
    expect(star.find('path').html()).toContain(getSvgPath(OPEN_STYLE));
  });

  it('passes a className to the Icon component', () => {
    const star = shallow(<IconStar className="twinkle" />);

    expect(star.find(Icon)).toHaveClassName('twinkle');
  });
});
