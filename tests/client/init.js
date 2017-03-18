/* global window */

const realSinon = sinon;
window.sinon = realSinon.sandbox.create();
window.sinon.createStubInstance = realSinon.createStubInstance;
window.sinon.format = realSinon.format;
window.sinon.assert = realSinon.assert;

afterEach(() => {
  window.sinon.restore();
});
