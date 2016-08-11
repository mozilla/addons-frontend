import pytest

from pages.discopane import DiscoveryPane


@pytest.fixture(scope='session')
def base_url(base_url):
    '''
    This is hardcoded for now, once we go through about:addons
    we'll be able to use the template expansion
    '''
    base_url += '/en-US/firefox/discovery/pane/48.0/Darwin/normal'
    return base_url


@pytest.fixture
def firefox_profile(firefox_profile, base_url):
    '''
    Set preferences necessary to load discovery pane, and
    for installing extensions and toggling switches to
    install and uninstall.
    '''
    firefox_profile.set_preference('extensions.webapi.testing', True)
    firefox_profile.set_preference('extensions.webservice.discoverURL',
                                   base_url)
    firefox_profile.update_preferences()
    return firefox_profile


@pytest.fixture
def discovery_pane(selenium, base_url):
    return DiscoveryPane(selenium, base_url).open()


@pytest.mark.skipif(
    'localhost' in pytest.config.getoption('base_url'),
    reason='Add-ons cannot be installed without SSL on local')
@pytest.mark.nondestructive
def test_that_discovery_pane_loads(discovery_pane):
    assert discovery_pane.is_discopane_visible
    assert len(discovery_pane.uninstalled_addons) == 7


@pytest.mark.nondestructive
def test_that_welcome_video_plays(discovery_pane):
    assert not discovery_pane.is_close_video_displayed
    discovery_pane.play_video()
    assert not discovery_pane.is_play_video_displayed
    discovery_pane.close_video()
    assert discovery_pane.is_play_video_displayed
    assert not discovery_pane.is_close_video_displayed


@pytest.mark.nondestructive
def test_see_more_addons_button(discovery_pane):
    assert discovery_pane.is_see_more_addons_displayed
