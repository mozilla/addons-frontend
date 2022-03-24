import * as React from 'react';

import MetadataCard from 'amo/components/MetadataCard';
import { render as defaultRender, screen } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ metadata = [], ...props } = {}) {
    return defaultRender(<MetadataCard metadata={metadata} {...props} />);
  }

  it('renders metadata', () => {
    const content = 'Hello I am content';
    const title = 'I am title';
    render({ metadata: [{ content, title }] });

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('adds a custom className', () => {
    const className = 'MyClassName';
    render({ className });

    expect(screen.getByClassName('MetadataCard')).toHaveClass(className);
  });

  it('requires content', () => {
    expect(() => {
      render({
        metadata: [
          {
            title: 'I am a title',
          },
        ],
      });
    }).toThrow('content is required');
  });

  it('requires a title', () => {
    expect(() => {
      render({
        metadata: [
          {
            content: 'Hello I am content',
          },
        ],
      });
    }).toThrow('title is required');
  });

  it('renders null content as LoadingText', () => {
    const title = 'I am title';
    render({ metadata: [{ content: null, title }] });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('allows an empty string to render empty content', () => {
    const content = '';
    const title = 'I am title';
    render({ metadata: [{ content, title }] });

    expect(screen.getByTagName('dd')).toHaveTextContent('');
    expect(screen.getByText(title)).toBeInTheDocument();
  });

  it('allows a zero value to render empty content', () => {
    const content = 0;
    const title = 'I am title';
    render({ metadata: [{ content, title }] });

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.getByText(title)).toBeInTheDocument();
  });
});
