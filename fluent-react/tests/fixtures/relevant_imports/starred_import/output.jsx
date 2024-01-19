import * as React from 'react';
import * as fluent from 'fluent-react';
export function Component() {
  const obj = fluent.useLocalization();
  return obj.l10n.createMessage('hello');
}
