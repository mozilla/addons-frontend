import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import { renderIntoDocument as render } from 'react-addons-test-utils';

import SearchForm from 'search/components/SearchForm';


describe('<SearchForm />', () => {
  let onSearch;
  let root; // eslint-disable-line prefer-const
  let form;
  let input;

  beforeEach(() => {
    onSearch = sinon.spy();
    root = render(<SearchForm onSearch={onSearch} />);
    form = root.refs.form;
    input = root.refs.query;
  });

  it('renders a form', () => {
    assert.ok(form.classList.contains('search-form'));
  });

  it('renders a search input', () => {
    assert.equal(input.placeholder, 'Search');
    assert.equal(input.type, 'search');
  });

  it('calls onSearch with a search query', () => {
    input.value = 'adblock';
    ReactTestUtils.Simulate.submit(form);
    assert.ok(onSearch.calledWith('adblock'));
  });
});
