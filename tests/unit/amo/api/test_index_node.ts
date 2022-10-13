/**
 * @jest-environment node
 */
import FormData from '@willdurand/isomorphic-formdata';
// eslint-disable-next-line import/no-extraneous-dependencies
import FormDataNode from 'formdata-node';

describe(__filename, () => {
  describe('core.callApi', () => {
    it('uses a server implementation of FormData', () => {
      expect(FormData).toEqual(FormDataNode);
    });
  });
});