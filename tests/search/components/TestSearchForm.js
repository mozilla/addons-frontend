import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

import SearchForm from 'search/components/SearchForm';

const render = ReactTestUtils.renderIntoDocument;
const findByTag = ReactTestUtils.findRenderedDOMComponentWithTag;

describe('<SearchForm />', () => {
  it('renders a form', () => {
    const root = render(<SearchForm onSearch={sinon.spy()} />);
    const form = findByTag(root, 'form');
    assert.ok(form.classList.contains('search-form'));
  });

  it('renders a search input', () => {
    const root = render(<SearchForm onSearch={sinon.spy()} />);
    const input = findByTag(root, 'input');
    assert.equal(input.placeholder, 'Search');
    assert.equal(input.type, 'text');
  });

  it('calls onSearch with a search query', () => {
    const onSearch = sinon.spy();
    const root = render(<SearchForm onSearch={onSearch} />);
    root.refs.query.value = 'adblock';
    ReactTestUtils.Simulate.submit(root.refs.form);
    assert.ok(onSearch.calledWith('adblock'));
  });
});
