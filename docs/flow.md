# Flow (static type checker)

To add flow coverage to a source file, put a `/* @flow */` comment at the top. The more source files you can opt into Flow, the better.

Here is our Flow manifesto:

- We use Flow to **declare the intention of our code** and help others refactor it with confidence. Flow also makes it easier to catch mistakes before spending hours in a debugger trying to find out what happened.
- Avoid magic [Flow declarations](https://flowtype.org/en/docs/config/libs/) for any _internal_ code. Just declare a [type alias](https://flowtype.org/en/docs/types/aliases/) next to the code where it's used and [export/import](https://flow.org/en/docs/types/modules/) it like any other object.
- Never import a real JS object just to reference its type. Make a type alias and import that instead.
- Never add more type annotations than you need. Flow is really good at inferring types from standard JS code; it will tell you when you need to add explicit annotations.
- When a function like `getAllAddons` takes object arguments, call its type object `GetAllAddonsParams`. Example:

```js
type GetAllAddonsParams = {|
  categoryId: number,
|};

function getAllAddons({ categoryId }: GetAllAddonsParams = {}) {
  ...
}
```

- Use [Exact object types](https://flowtype.org/en/docs/types/objects/#toc-exact-object-types) via the pipe syntax (`{| key: ... |}`) when possible. Sometimes the spread operator triggers an error like 'Inexact type is incompatible with exact type' but that's a [bug](https://github.com/facebook/flow/issues/2405). You can use the `Exact<T>` workaround from [`src/core/types/util`](https://github.com/mozilla/addons-frontend/blob/master/src/core/types/util.js) if you have to. This is meant as a working replacement for [$Exact<T>](https://flow.org/en/docs/types/utilities/#toc-exact).
- Add a type hint for components wrapped in HOCs (higher order components) so that Flow can validate calls to the component. We need to add a hint because we don't yet have decent type coverage for all the HOCs we rely on. Here is an example:

```js
// Imagine this is something like components/ConfirmButton/index.js
import { compose } from 'redux';
import * as React from 'react';

// This expresses externally used props, i.e. to validate how the app would use <ConfirmButton />
type Props = {|
  prompt?: string | null,
|};

// This expresses internally used props, such as i18n which is injected by translate()
type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class ConfirmButtonBase extends React.Component<InternalProps> {
  render() {
    const prompt = this.props.prompt || this.props.i18n.gettext('Confirm');
    return <button>{prompt}</button>;
  }
}

// This provides a type hint for the final component with its external props.
// The i18n prop is not in external props because it is injected by translate() for internal use only.
const ConfirmButton: React.ComponentType<Props> = compose(translate())(
  ConfirmButtonBase,
);

export default ConfirmButton;
```

- Try to avoid loose types like `Object` or `any` but feel free to use them if you are spending too much time declaring types that depend on other types that depend on other types, and so on.
- You can add a `$FLOW_FIXME` comment to skip a Flow check if you run into a bug or if you hit something that's making you bang your head on the keyboard. If it's something you think is unfixable then use `$FLOW_IGNORE` instead. Please explain your rationale in the comment and link to a GitHub issue if possible.
- If you're stumped on why some Flow annotations aren't working, try using the `yarn flow type-at-pos ...` command to trace which types are being applied to the code. See `yarn flow -- --help type-at-pos` for details.
