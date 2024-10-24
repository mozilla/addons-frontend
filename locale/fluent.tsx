import * as React from 'react';
import {
  FluentDateTime,
  FluentNumber,
} from '@fluent/bundle';
import { useLocalization } from '@fluent/extract';

/*
1. babel plugin to create Resource ast from Source code components and calls.
  - find rendering of components or calls to functions
  - create resource ast from components or calls, using id or auto generated id
  - use resource ast to serialize ftl file.
2. babel plugin to strip Source code components and calls and replace with context calls
  - find rendering of components or calls to functions
  - replace with context calls
  - replace return value of hook with l10n instnace
3. function to generate hashed ID that is shared between 1 and 2
4. handle edge cases
*/

interface SelectProps {
  value: unknown;
  options: Record<string, string>;
}

interface SelectPropsWithChildren {
  value: unknown;
  children: React.ReactNode;
}

function Select(props: SelectProps | SelectPropsWithChildren) {
  if ('children' in props) {
    return (
      <>
      {props.children}
      </>
    )
  }

  return null;
}

function Localize(props: {children: React.ReactNode}) {
  return (
    <>
    {props.children}
    </>
  )
}

export function FluentSource() {
  let title = 'My Title';
  let duration = 2.5;
  let emailCount = 2;
  let userGender = 'female';
  let score = 2.544;
  let pos = 3;
  let lastChecked = new Date();

  const {createMessage} = useLocalization();

  const brandName = createMessage('Firefox', {
    descrption: 'Name of the browser',
  });
  const menuSave = createMessage('Save', {
    description: 'Label for the save button',
  });

  const helloWorld = createMessage('Hello, world!');

  const updateSuccessful = createMessage(userGender, {
    masculine: `${brandName} został zaktualizowany.`,
    feminine: `${brandName} została zaktualizowana.`,
    other: `Program ${brandName} został zaktualizowany.`,
  });

  return (
    <main>
      <h1>
        {helloWorld}
      </h1>
      <p>
        <div>
          <button>
            <Localize children="Sign in" />
          </button>
          <button
            className="text"
          >
            <Localize children="Cancel" />
          </button>
        </div>
      </p>
      <p>
        <Localize>
          {`
            Text can also span multiple lines as long as
            each new line is indented by at least one space.
            Because all lines in this message are indented
            by the same amount, all indentation will be
            removed from the final value.
          `}
        </Localize>
      </p>
      <p>
        <Localize>
          {`You have`}
          <Select value={emailCount}>
            <Select.One children="one unread email." />
            <Select.Other>
              {`${emailCount} unread emails.`}
            </Select.Other>
          </Select>
        </Localize>
      </p>
      <p>
        <Select value={userGender} defaultValue="nonbinary">
          <Select.Option value="male" children="his foo." />
          <Select.Option value="female" children="her foo." />
          <Select.Option value="nonbinary" children="their foo." />
        </Select>
      </p>
      <p>
        <Localize>
          {`Informacje o ${brandName}`}
        </Localize>
      </p>
      <Localize>{`Really remove ${title}?`}</Localize>
      <Localize>{`Installing ${brandName}.`}</Localize>
      <Localize>
        {`This message features an opening curly brace: ${`{`}.`}
      </Localize>
      <Localize>
        {`This message features a closing curly brace: ${`}`}.`}
      </Localize>
      <Localize>{`This message starts with no blanks.`}</Localize>
      <Localize>{ `${`    `}This message starts with 4 spaces.`}</Localize>
      <Localize>{ `Time elapsed: ${duration}s.`}</Localize>
      <Localize>
        {`Time elapsed: ${new FluentNumber(duration, {maximumFractionDigits: 0})}s.`}
      </Localize>
      <Localize>{`Click ${menuSave} to save the file.`}</Localize>
      <Select
        value={new FluentNumber(score, {minimumFractionDigits: 1})}
        options={{
          0: 'You scored zero points. What happened?',
          other: `You scored ${score} points.`,
        }}
      />
      <Select
        value={new FluentNumber(pos, {type: 'ordinal'})}
        options={{
          1: 'You finished first!',
          one: `You finished ${pos}st`,
          two: `You finished ${pos}nd`,
          few: `You finished ${pos}rd`,
          other: `You finished ${pos}th`,
        }}
      />
      <p>
        {updateSuccessful}
      </p>
      <Localize>
        {`Last checked: ${new FluentDateTime(lastChecked, {day: "numeric", month: "long"})}.`}
      </Localize>
      <Localize>
        {`
          Indentation common to all indented lines is removed
          from the final text value.
            This line has 2 spaces in front of it.
        `}
      </Localize>
    </main>
  )
}

