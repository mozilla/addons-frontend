import pytest


@pytest.fixture
def capabilities(capabilities):
    # In order to run these tests in Firefox 48, marionette is required
    capabilities['marionette'] = True
    return capabilities
