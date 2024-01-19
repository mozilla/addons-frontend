import * as React from 'react';
import fluent from 'fluent-react';

export function Component() {
  const obj = fluent.useLocalization();

  return obj.l10n.createMessage("hello");
}
