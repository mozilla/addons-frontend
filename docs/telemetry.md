# Hybrid Content Telemetry

Telemetry is being introduced to the discovery pane to replace Google Analytics.

The following events are logged to telemetry if:

- HCT is enabled for the host
- Telemetry collection is allowed by the end-user.

| Category          | Method            | Action                    | Value               | This is logged when...                  |
| ----------------- | ----------------- | ------------------------- | ------------------- | --------------------------------------- |
| disco.interaction | addon_click       | [addon/theme/statictheme] | [Add-on name]       | An add-on link is clicked               |
| disco.interaction | download_failed   | [addon/theme/statictheme] | [Add-on name]       | The download of an extension has failed |
| disco.interaction | enabled           | [addon/theme/statictheme] | [Add-on name]       | Add-on is enabled                       |
| disco.interaction | installed         | [addon/theme/statictheme] | [Add-on name]       | Add-on is installed                     |
| disco.interaction | install_cancelled | [addon/theme/statictheme] | [Add-on name]       | Add-on install is cancelled             |
| disco.interaction | install_started   | [addon/theme/statictheme] | [Add-on name]       | Add-on install has started              |
| disco.interaction | uninstalled       | [addon/theme/statictheme] | [Add-on name]       | Add-on uninstalled                      |
| disco.interaction | navigation_click  | click                     | [Click description] | When user clicks "Find more Add-ons"    |

## Testing in your local development environment

Here are the steps to test collection locally:

- `hctEnabled` is set to `true` by default in `config/development-disco.js`
- Run `yarn disco:https` to start the disco app because HCT requires HTTPS
- Go to `about:config` and enable `devtools.chrome.enabled` so that the browser console has the CLI enabled.
- Open the Browser Console (and not the classic devtools) and type:
  ```javascript
  const hostURI = Services.io.newURI('https://example.com:3000');
  Services.perms.add(hostURI, 'hc_telemetry', Services.perms.ALLOW_ACTION);
  ```

## Testing on dev

You'll need to enable installs from -dev before enabling collection. You can skip this step if it's already been done.

**NOTE: It's recommended you do these settings changes in a new profile as changing to the -dev cert will mark all existing add-ons as invalid.**

- Right click in `about:config`, select `new` and then add `xpinstall.signatures.dev-root` as `Boolean`. It should be `true`.
- Right click in `about:config`, select `new` and add `extensions.webapi.testing` as `Boolean`. It should be `true`.
- Restart the browser

Now enable collection on -dev.

- open the Browser Console (and not the classic devtools) and type:
  ```javascript
  const hostURI = Services.io.newURI(
    'https://discovery.addons-dev.allizom.org',
  );
  Services.perms.add(hostURI, 'hc_telemetry', Services.perms.ALLOW_ACTION);
  ```

## Viewing data collected

- Navigate to `about:telemetry#events-tab` and select the `dynamic` filter (top-right dropdown)

If there's no data shown, interact with the disco pane and refresh the page (you will need to reselect dynamic) in the filter.

Here's the [link to the -dev disco pane](https://discovery.addons-dev.allizom.org/en-US/firefox/discovery/pane/57.0/Darwin/normal)
