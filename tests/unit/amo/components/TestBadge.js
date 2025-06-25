import * as React from 'react';

import Badge, {
  BadgePill,
  BadgeContent,
  BadgeIcon,
} from 'amo/components/Badge';
import { render, screen, within } from 'tests/unit/helpers';

describe(__filename, () => {
  it('renders a simple badge with content', () => {
    const content = 'badge content';
    render(<Badge type="star-full" label={content} size="small" />);

    const badge = screen.getByTestId('badge-star-full');
    expect(badge).toHaveClass('Badge');

    const contentEl = within(badge).getByClassName('Badge-content');
    expect(contentEl).toHaveTextContent(content);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a badge with an icon and content', () => {
    const content = 'badge content';
    render(<Badge type="recommended" label={content} size="small" />);

    const badge = screen.getByTestId('badge-recommended');
    expect(badge).toHaveClass('Badge');

    const badgeContent = within(badge).getByClassName('Badge-content');
    expect(badgeContent).toHaveTextContent(content);
    const icon = within(badge).getByClassName('Badge-icon');
    expect(icon).toHaveClass('Icon-recommended');
  });

  it('renders a badge with icon based on size', () => {
    const { container } = render(
      <Badge type="experimental" size="small" label="a-label">
        {(props) => (
          <BadgePill {...props}>
            <BadgeIcon {...props} />
          </BadgePill>
        )}
      </Badge>,
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass('Badge');
    const icon = within(badge).getByClassName('Badge-icon');
    expect(icon).toHaveClass('Badge-icon--small');
  });

  it('renders a badge as a link', () => {
    const link = 'https://example.com';
    const { container } = render(
      <Badge link={link} type="star-full" label="a-label" />,
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass('Badge');
    expect(badge).toHaveClass('Badge-border');
    const linkElement = screen.getByRole('link');
    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute('href', link);
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('can have a custom class name', () => {
    const { container } = render(
      <Badge className="custom-class" type="star-full" label="a-label">
        {(props) => (
          <BadgePill {...props}>
            <BadgeContent {...props} label="custom" />
          </BadgePill>
        )}
      </Badge>,
    );
    const badge = container.firstChild;
    expect(badge).toHaveClass('Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders a custom child unaltered', () => {
    const content = 'some other content';
    render(
      <Badge type="star-full" label="some-label" size="small">
        {() => <div>{content}</div>}
      </Badge>,
    );

    expect(screen.getByText(content)).toBeInTheDocument();
  });

  describe('BadgeIcon', () => {
    it('renders a large icon', () => {
      render(<BadgeIcon name="test-icon" label="alt text" size="large" />);
      const icon = screen.getByText('alt text').parentElement;
      expect(icon).toHaveClass('Badge-icon');
      expect(icon).toHaveClass('Badge-icon--large');
      expect(screen.getByText('alt text')).toBeInTheDocument();
    });

    it('renders a small icon', () => {
      render(<BadgeIcon name="test-icon" label="alt text" size="small" />);
      const icon = screen.getByText('alt text').parentElement;
      expect(icon).toHaveClass('Badge-icon');
      expect(icon).toHaveClass('Badge-icon--small');
    });

    it('can have a custom class name', () => {
      render(
        <BadgeIcon
          name="test-icon"
          label="alt text"
          className="custom-icon-class"
        />,
      );
      const icon = screen.getByText('alt text').parentElement;
      expect(icon).toHaveClass('Badge-icon');
      expect(icon).toHaveClass('custom-icon-class');
    });
  });

  describe('BadgeContent', () => {
    it('renders label', () => {
      const content = 'This is the content';
      render(<BadgeContent label={content} />);
      expect(screen.getByText(content)).toBeInTheDocument();
    });
  });
});
