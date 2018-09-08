/* eslint-disable react/no-multi-comp, react/prop-types */

import { shallow } from 'enzyme';
import * as React from 'react';

import { withExperiment } from 'core/withExperiment';
import {
  createFakeEvent,
  createFakeTracking,
  shallowUntilTarget,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('withExperiment', () => {
    let fakeTracking;

    class SomeComponentBase extends React.Component {
      render() {
        return <div className="component">test</div>;
      }
    }

    const SomeComponent = withExperiment({
      nameId: 'ABtest',
      AName: 'AName',
      BName: 'BName',
    })(SomeComponentBase);

    const render = ({ ...props } = {}) => {
      const root = shallowUntilTarget(
        <SomeComponent {...props} />,
        SomeComponentBase,
      );
      return root;
    };

    beforeEach(() => {
      fakeTracking = createFakeTracking();
    });

    it('passes the experimentIsOn prop', () => {
      const componentWithExperiment = shallow(<SomeComponent />);

      expect(componentWithExperiment).toHaveProp('experimentIsOn');
    });

    it('sets experimentIsOn prop to be true or false', () => {
      const nameId = 'Hero';
      const AName = 'Big';
      const BName = 'Small';
      const root = render({ nameId, AName, BName });

      const options = [true, false];

      const { experimentIsOn } = root.instance().props;

      expect(options).toEqual(expect.arrayContaining([experimentIsOn]));
    });

    it('sets cookie to contain one of the variant names', () => {
      // TODO
    });

    it('calls cookie save if cookie is not set yet', () => {
      // TODO
    });

    it('calls tracking on component page view', () => {
      const nameId = 'someTestName';
      const AName = 'VersionA';
      const BName = 'VersionB';
      const root = render({ AName, BName, nameId, _tracking: fakeTracking });
      const { experimentIsOn } = root.instance().props;

      const variantName = experimentIsOn
        ? `AB_TEST_${nameId}_${AName}`
        : `AB_TEST_${nameId}_${BName}`;

      sinon.assert.calledWith(fakeTracking.sendEvent, {
        action: `${nameId} Page View`,
        category: `AMO ${variantName}`,
        label: '',
      });

      sinon.assert.calledOnce(fakeTracking.sendEvent);
    });

    it('calls tracking on click', () => {
      // TODO: isolate this just to click.
    });
  });
});
