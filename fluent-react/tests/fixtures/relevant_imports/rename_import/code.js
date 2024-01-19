import * as React from 'react';
import { useLocalization as foo } from 'fluent-react';

export function Component() {
  const { l10n } = foo();
  return l10n.createMessage('hello');
}
