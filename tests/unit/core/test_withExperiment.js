/* eslint-disable react/no-multi-comp, react/prop-types */

import { shallow } from 'enzyme';
import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import { fakeCookie } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withExperiment', () => {
    class SomeComponentBase extends React.Component {
      render() {
        return <div className="component" />;
      }
    }

    function componentWithExperiment({ experimentProps, props } = {}) {
      const TestComponent = withExperiment({
        id: 'ABtest',
        variantA: 'AName',
        variantB: 'BName',
        ...experimentProps,
      })(SomeComponentBase);

      return shallow(<TestComponent {...props} />);
    }

    it('passes the variant prop', () => {
      const root = componentWithExperiment();
      expect(root).toHaveProp('variant');
    });

    it('loads and saves cookie', () => {
      const _cookie = fakeCookie();
      const id = 'Hero';

      const root = componentWithExperiment({
        props: {
          _cookie,
          id,
        },
      });

      sinon.assert.calledWith(_cookie.load, `experiment_${id}`);

      sinon.assert.calledWith(
        _cookie.save,
        `experiment_${id}`,
        root.instance().experimentCookie,
      );
    });

    it('saves cookie with custom cookie config', () => {
      const overrideCookieConfig = { path: '/test' };
      const _cookie = fakeCookie();
      const id = 'layoutTest';

      const root = componentWithExperiment({
        props: {
          _cookie,
          id,
        },
        experimentProps: { cookieConfig: overrideCookieConfig },
      });

      sinon.assert.calledWith(
        _cookie.save,
        `experiment_${id}`,
        root.instance().experimentCookie,
        overrideCookieConfig,
      );
    });
  });
});
