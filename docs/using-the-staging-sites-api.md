# Development Using the Stage (or Dev) API

By default the local dev server (ran using `yarn amo`) will load data from the local docker instance (usually found at http://olympia.test/). Admittedly this dataset is incomplete and small. While we discourage usage of the production API for development, you can safely develop against the "Dev" or "Stage" servers using `yarn amo:dev` or `yarn amo:stage`. This will give you a large amount of data to work with when testing out new features.

It's best to use these commands rather than setting the `API_HOST` and other environment variables directly: these commands automatically set the API and CDN variables appropriately so screenshots, icons, etc. will load correctly.
