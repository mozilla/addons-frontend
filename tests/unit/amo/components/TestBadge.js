import * as React from 'react';

import Badge, { BadgeContent, BadgeIcon } from 'amo/components/Badge';
import { render, screen, within } from 'tests/unit/helpers';

describe(__filename, () => {
  it('renders a simple badge with content', () => {
    const content = 'badge content';
    const { container } = render(
      <Badge type="a-type" label={content}>
        <BadgeContent>{content}</BadgeContent>
      </Badge>,
    );

    const badge = container.firstChild;
    expect(badge).toHaveClass('Badge');
    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders a badge with an icon and content', () => {
    const content = 'badge content';
    render(
      <Badge type="recommended" label={content}>
        <BadgeIcon />
        <BadgeContent />
      </Badge>,
    );

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
        <BadgeIcon />
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
      <Badge link={link} type="a-type" label="a-label">
        <BadgeContent>Click me</BadgeContent>
      </Badge>,
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
      <Badge className="custom-class" type="a-type" label="a-label">
        <BadgeContent>custom</BadgeContent>
      </Badge>,
    );
    const badge = container.firstChild;
    expect(badge).toHaveClass('Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders a custom child unaltered', () => {
    const content = 'some other content';
    render(
      <Badge type="some-type" label="some-label">
        <div>{content}</div>
      </Badge>,
    );

    expect(screen.getByText(content)).toBeInTheDocument();
  });

  describe('BadgeIcon', () => {
    it('renders a large icon by default', () => {
      render(<BadgeIcon name="test-icon" alt="alt text" />);
      const icon = screen.getByText('alt text').parentElement;
      expect(icon).toHaveClass('Badge-icon');
      expect(icon).toHaveClass('Badge-icon--large');
      expect(icon).toHaveClass('Icon-test-icon');
      expect(screen.getByText('alt text')).toBeInTheDocument();
    });

    it('renders a small icon', () => {
      render(<BadgeIcon name="test-icon" alt="alt text" size="small" />);
      const icon = screen.getByText('alt text').parentElement;
      expect(icon).toHaveClass('Badge-icon');
      expect(icon).toHaveClass('Badge-icon--small');
    });

    it('can have a custom class name', () => {
      render(
        <BadgeIcon
          name="test-icon"
          alt="alt text"
          className="custom-icon-class"
        />,
      );
      const icon = screen.getByText('alt text').parentElement;
      expect(icon).toHaveClass('Badge-icon');
      expect(icon).toHaveClass('custom-icon-class');
    });

    it('has its `name` prop overridden by `Badge` `type` prop when nested', () => {
      const label = 'badge label';
      render(
        <Badge type="recommended" label={label}>
          <BadgeIcon />
        </Badge>,
      );
      const badge = screen.getByTestId('badge-recommended');
      const icon = within(badge).getByClassName('Badge-icon');
      expect(icon).toHaveClass('Icon-recommended');
    });
  });

  describe('BadgeContent', () => {
    it('renders its children', () => {
      const content = 'This is the content';
      render(<BadgeContent>{content}</BadgeContent>);
      expect(screen.getByText(content)).toBeInTheDocument();
    });
  });
});
