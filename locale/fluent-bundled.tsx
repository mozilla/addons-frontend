import * as React from 'react';
import {
  FluentDateTime,
  FluentNumber,
} from '@fluent/bundle';


export function FluentBundled() {
  let title = 'My Title';
  let duration = 2.5;
  let emailCount = 2;
  let userGender = 'female';
  let score = 2.544;
  let pos = 3;
  let lastChecked = new Date();

  const {l10n} = useLocalization();

  const brandName = l10n.getString(
    'generated-id',
    {},
    'Firefox',
  );

  const menuSave = l10n.getString(
    'generated-id',
    {},
    'Save',
  );

  const helloWorld = l10n.getString(
    'generated-id',
    {},
    'Hello, world!',
  );

  const updateSuccessful = l10n.getString(
    'generated-id',
    {
      'generated-id': userGender,
    },
    `Program ${brandName} został zaktualizowany.`
  );

  return (
    <main>
      <h1>
        {helloWorld}
      </h1>
      <p>
        <div>
          <button>
            {l10n.getString(
              'generated-id',
              {},
              'Sign in',
            )}
          </button>
          <button
            className="text"
          >
            {l10n.getString(
              'generated-id',
              {},
              'Cancel',
            )}
          </button>
        </div>
      </p>
      <p>
        {l10n.getString(
          'generated-id',
          {},
          `
            Text can also span multiple lines as long as
            each new line is indented by at least one space.
            Because all lines in this message are indented
            by the same amount, all indentation will be
            removed from the final value.
          `,
        )}
      </p>
      <p>
        {l10n.getString(
          'generated-id',
          { 'generated-id': emailCount },
          `You have ${emailCount} unread emails.`
        )}
      </p>
      <p>
        {l10n.getString(
          'generated-id',
          {
            'generated-id': userGender,
          },
          `their foo.`
        )}
      </p>
      <p>
        {l10n.getString(
          'generated-id',
          {
            'generated-id': brandName,
          },
          `Informacje o ${brandName}`
        )}
      </p>
      {l10n.getString('generated-id', { 'generated-id': title }, `Really remove ${title}?`)}
      {l10n.getString('generated-id', { 'generated-id': brandName }, `Installing ${brandName}.`)}
      {l10n.getString('generated-id', {}, `This message features an opening curly brace: {.`)}
      {l10n.getString('generated-id', {}, `This message features a closing curly brace: }.`)}
      {l10n.getString('generated-id', {}, `This message starts with no blanks.`)}
      {l10n.getString('generated-id', {}, `${`    `}This message starts with 4 spaces.`)}
      {l10n.getString('generated-id', { 'generated-id': duration }, `Time elapsed: ${duration}s.`)}
      {l10n.getString('generated-id', {
        'generated-id': new FluentNumber(duration, {maximumFractionDigits: 0}),
      }, `Time elapsed: ${new FluentNumber(duration, {maximumFractionDigits: 0})}s.`)}
      {l10n.getString('generated-id', {menuSave}, `Click ${menuSave} to save the file.`)}
      {l10n.getString('generated-id', {score}, `You scored ${score} points.`)}

      {l10n.getString('generated-id', {
        'generated-id': new FluentNumber(pos, {type: 'ordinal'})
      }, `You finished ${new FluentNumber(pos, {type: 'ordinal'})}th`)}
      <p>
        {updateSuccessful}
      </p>
      {l10n.getString('generated-id', {}, `Last checked: ${new FluentDateTime(lastChecked, {day: "numeric", month: "long"})}.`)}
      {l10n.getString('generated-id', {}, `
          Indentation common to all indented lines is removed
          from the final text value.
            This line has 2 spaces in front of it.
      `)}
    </main>
  )
}
