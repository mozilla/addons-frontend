import { useLocalization } from 'fluent-react';

export function Component() {
  const { l10n } = useLocalization();

  const userGender = 'masculine';
  const brandName = 'Firefox';

  return l10n.createMessage(userGender, {
    feminine: `${brandName} została zaktualizowana.`,
  }, 'foo');
}
