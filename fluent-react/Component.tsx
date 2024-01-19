import * as React from 'react';

import * as messages from './fluent.ftl';

export function Component() {
  return (
    <div>
      <h1>{messages.simple}</h1>
      <p>{messages.name({ $ref: 'World'})}</p>
      <p>{messages.withTermReference}</p>
    </div>
  );
}



/*

assuming there is a provider <FluentReactProvider>
this should set the locale. defaults to browser locale.

babel will:
- transpile this code into calls to the l10n.getString() method using IDs infered from imported resource.
- inject a hook to setup the resource by calling to the provider with the resource id. if the resource is not already loaded, it will load and cache it in the provider context.

the babel plugin should be able to control:
- where generated fluent files should be stored
- which locales should be supported
- potentially allow for control of the merging algorithm.

 */
