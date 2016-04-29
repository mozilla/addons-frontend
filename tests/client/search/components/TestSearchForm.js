import React from 'react';
import { Simulate, renderIntoDocument } from 'react-addons-test-utils';

import SearchForm from 'search/components/SearchForm';

describe('<SearchForm />', () => {
  const pathname = '/somewhere';
  let router;
  let root;
  let form;
  let input;

  class SearchFormWrapper extends React.Component {
    static childContextTypes = {
      router: React.PropTypes.object,
    }

    getChildContext() {
      return {router};
    }

    render() {
      return <SearchForm pathname={pathname} ref="root" />;
    }
  }

  beforeEach(() => {
    router = {push: sinon.spy()};
    root = renderIntoDocument(<SearchFormWrapper />).refs.root;
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

  it('updates the location', () => {
    assert(!router.push.called);
    input.value = 'adblock';
    Simulate.submit(form);
    assert(router.push.calledWith('/somewhere?q=adblock'));
  });
});
