import { jsdom } from 'jsdom';

export default jsdom('', {
  features: {
    FetchExternalResources: false, // disables resource loading over HTTP / filesystem
    ProcessExternalResources: false, // do not execute JS within script blocks
  },
}).defaultView;
