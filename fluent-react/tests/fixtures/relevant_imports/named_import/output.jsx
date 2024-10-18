import * as React from 'react';
import { useLocalization } from 'fluent-react';
export function Component() {
  const obj = useLocalization();
  return obj.l10n.createMessage('hello');
}
