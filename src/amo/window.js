import { JSDOM } from 'jsdom';

const jsDomDocument = new JSDOM('', {
  features: {
    // disables resource loading over HTTP / filesystem
    FetchExternalResources: false,
    // do not execute JS within script blocks
    ProcessExternalResources: false,
  },
});

export default jsDomDocument.window;
