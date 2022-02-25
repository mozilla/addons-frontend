import * as React from 'react';
import photon from 'photon-colors';

import IconStar, {
  getSvgPath,
  CLOSED_STYLE,
  DIM_CLOSED_STYLE,
  HALF_STYLE,
  OPEN_STYLE,
} from 'amo/components/IconStar';
import { render, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  it('sets the default color to YELLOW', () => {
    render(<IconStar />);

    expect(screen.getByTagName('g')).toHaveAttribute('fill', photon.YELLOW_50);
  });

  it('changes the color to GRAY if yellow is false', () => {
    render(<IconStar yellow={false} />);

    expect(screen.getByTagName('g')).toHaveAttribute('fill', photon.GREY_50);
  });

  it('sets the star style to HALF_STYLE if half and readOnly are true', () => {
    render(<IconStar readOnly half />);

    expect(screen.getByTagName('defs')).toBeInTheDocument();
    expect(screen.getByTagName('path')).toHaveAttribute(
      'd',
      getSvgPath(HALF_STYLE),
    );
  });

  it("sets the star style to CLOSED_STYLE if the star is selected and it's not readOnly", () => {
    render(<IconStar readOnly={false} selected />);

    expect(screen.getByTagName('g')).toHaveAttribute('fill-opacity', '1');
    expect(screen.getByTagName('path')).toHaveAttribute(
      'd',
      getSvgPath(CLOSED_STYLE),
    );
  });

  it("sets the star style to DIM_CLOSED_STYLE if the star is not selected and it's readOnly", () => {
    render(<IconStar readOnly selected={false} />);

    expect(screen.getByTagName('g')).toHaveAttribute('fill-opacity', '0.25');
    expect(screen.getByTagName('path')).toHaveAttribute(
      'd',
      getSvgPath(DIM_CLOSED_STYLE),
    );
  });

  it("sets the star style to OPEN_STYLE if the star is not selected and it's not readOnly", () => {
    render(<IconStar readOnly={false} selected={false} />);

    expect(screen.getByTagName('g')).toHaveAttribute('fill-opacity', '1');
    expect(screen.getByTagName('path')).toHaveAttribute(
      'd',
      getSvgPath(OPEN_STYLE),
    );
  });

  it('passes a className to the Icon component', () => {
    const className = 'twinkle';
    render(<IconStar className={className} />);

    expect(screen.getByClassName('Icon')).toHaveClass(className);
  });
});
