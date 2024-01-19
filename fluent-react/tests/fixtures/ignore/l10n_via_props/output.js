import * as React from 'react';
import { useLocalization } from 'fluent-react';
export function Component({ l10n }) {
  return l10n.createMessage('hello');
}
