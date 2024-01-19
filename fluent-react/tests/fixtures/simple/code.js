import * as React from 'react';
import { useLocalization } from 'fluent-react';

export function Component() {
  const { l10n } = useLocalization();
  return l10n.createMessage('hello');
}
