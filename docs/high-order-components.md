# High Order Components

## `translate`

This HOC enables internationalization of a given React component.

It injects a pre-configured `i18n` object, documented with the [`I18nType` Flow type](https://github.com/mozilla/addons-frontend/blob/master/src/core/types/i18n.js).

## `withErrorHandler`

This HOC gives a component the ability to handle errors.

It injects an [`ErrorHandler`](https://github.com/mozilla/addons-frontend/blob/master/src/core/errorHandler.js) instance to the errorHandler property.

Example:

```js
class SomeComponent extends React.Component {
  static propTypes = {
    errorHandler: PropTypes.object.isRequired,
  };

  render() {
    const { errorHandler } = this.props;

    return (
      <div>
        {errorHandler.renderErrorIfPresent()}
        <div>some content</div>
      </div>
    );
  }
}

export default withErrorHandler({ name: 'SomeComponent' })(SomeComponent);
```

Note: for convenience, you can use `withRenderedErrorHandler()` which renders the error automatically at the beginning of the component's output.

## `withFixedErrorHandler`

This HOC works like the `withErrorHandler` HOC but aims at synchronizing both the server and client sides by using a fixed error handler ID.

The `fileName` parameter must be set to `__filename` in the component code.

The `extractId` function is used to create a unique error handler per rendered component. This function takes the component's props and must return a unique string based on these props (e.g., based on the `slug`, `uniqueId`, `page`, etc.).

## `withInstallHelpers`

This HOC provides a set of install helper methods bound to the `mozAddonManager` if available. The injected props are documented with the `WithInstallHelpersInjectedProps` Flow type (in `src/core/installAddon.js`).

This HOC requires three props set on the wrapped component: `addon`, `location` and `userAgentInfo`. Example:

```js
// components/Component/index.js
const ComponentBase = () => <div className="Component" />;

export function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.match.params;
  const addon = getAddonBySlug(state, slug);

  return {
    addon,
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  connect(mapStateToProps),
  withRouter,
  // Must be positioned after `connect()` and `withRouter` to receive the
  // `addon`, `userAgentInfo` and `location` props.
  withInstallHelpers(),
)(ComponentBase);
```

## `withUIState`

This HOC can be used to somewhat mimic the behavior of `this.setState()` with Redux reducers/actions.

It renders your component with a `setUIState()` prop that can be used just like `this.setState()` to dispatch actions that change the internal state of the component.

It provides a `uiState` prop which can be used to read internal state like you would read `this.state`.

One key difference from `this.setState()` is that your component will not reset its state when mounted. Instead, it uses the ID returned from `extractID(props)` to get its state from the Redux store.

You can make the component always reset its state by configuring `withUIState({ ..., resetOnUnmount: true })`.

This will behave more like `this.setState()` but you will lose some features of Redux persistence such as predictable hot reloading and possibly other state replay features.
