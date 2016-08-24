/* global window */

const realSinon = sinon;
window.sinon = realSinon.sandbox.create();
window.sinon.createStubInstance = realSinon.createStubInstance;
window.sinon.format = realSinon.format;

afterEach(() => {
  window.sinon.restore();
});
