import { shallow } from 'enzyme';
import * as React from 'react';

import PaginatorLink from 'core/components/PaginatorLink';
import Button from 'ui/components/Button';


describe(__filename, () => {
  function render(customProps = {}) {
    const props = {
      currentPage: 2,
      page: 3,
      pageCount: 4,
      pathname: '/some/link',
      ...customProps,
    };

    return shallow(<PaginatorLink {...props} />);
  }

  it('requires currentPage', () => {
    expect(() => render({ currentPage: undefined }))
      .toThrowError(/currentPage .* cannot be undefined/);
  });

  it('requires pathname', () => {
    expect(() => render({ pathname: undefined }))
      .toThrowError(/pathname .* cannot be undefined/);
  });

  it('requires a page', () => {
    expect(() => render({ page: undefined }))
      .toThrowError(/page .* cannot be undefined/);
  });

  it('requires pageCount', () => {
    expect(() => render({ pageCount: undefined }))
      .toThrowError(/pageCount .* cannot be undefined/);
  });

  it('renders a PaginatorLink', () => {
    const link = render();

    expect(link.find('.Paginate-item')).toHaveLength(1);
  });

  it('passes className to Button', () => {
    const link = render({ className: 'my-cool-class' });

    expect(link.find('.my-cool-class')).toHaveLength(1);
  });

  describe('when the link is to the current page', () => {
    it('does not contain a link and is disabled', () => {
      const item = render({ currentPage: 3, page: 3 });

      expect(item).toHaveClassName('Paginate-item--current-page');
      expect(item).toHaveProp('disabled', true);
      expect(item.prop('to')).toEqual(undefined);
      expect(item.prop('children')).toEqual(3);
    });

    it('uses the provided text', () => {
      const item = render({
        currentPage: 3, page: 3, text: 'go to page',
      });

      expect(item.find(Button)).toHaveProp('children', 'go to page');
    });
  });

  describe('when the link is to a different page', () => {
    it('renders a button with a to prop (creates a link)', () => {
      const link = render({ page: 3 });
      const button = link.find(Button);

      expect(button).toHaveLength(1);
      expect(button.prop('to')).toMatchObject({ query: { page: 3 } });
      expect(button.prop('children')).toEqual(3);
      expect(button).not.toHaveClassName('Paginate-item--current-page');
    });

    it('uses the pathname', () => {
      const link = render({ page: 3, pathname: '/search/' });

      expect(link.find(Button).prop('to'))
        .toMatchObject({ pathname: '/search/' });
    });

    it('uses the page', () => {
      const link = render({ page: 3, pathname: '/search/' });

      expect(link.find(Button).prop('to'))
        .toMatchObject({ query: { page: 3 } });
    });

    it('uses the provided text', () => {
      const link = render({ page: 3, text: 'go to next page' });

      expect(link.prop('children')).toEqual('go to next page');
    });
  });
});
