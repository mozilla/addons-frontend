# AMO log in

Currently you need to use the internal config to log in with the AMO app. To do this setup the API
to point to your local addons-server and update it's `settings.py` file like so:

```py
# Find this setting where default and internal are defined.
FXA_CONFIG = {
    'default': { ... },
    'internal': { ... },
}
# Define the default config to be the internal config.
FXA_CONFIG['default'] = FXA_CONFIG['internal']
```

And then make sure you don't commit that, or do it in a local settings file but don't forget that
you did it.
