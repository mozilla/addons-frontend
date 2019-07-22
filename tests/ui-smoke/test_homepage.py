"""Smoke tests for addons-frontend docker image."""

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


@pytest.fixture
def firefox_options(firefox_options):
    """Set up Firefox options."""
    firefox_options.add_argument("-headless")
    firefox_options.add_argument('-foreground')
    return firefox_options


@pytest.fixture
def selenium(base_url, selenium):
    """Set up selenium."""
    # Simple wait for homepage to load
    selenium.get(base_url)
    WebDriverWait(selenium, 60).until(
        EC.visibility_of_element_located(
            (By.CSS_SELECTOR, ".Hero-contents")
        )
    )
    return selenium


@pytest.mark.nondestructive
def test_hero_section_loads(selenium):
    """Test hero section loads categories."""
    hero = selenium.find_element_by_class_name("Hero-contents")
    hero_elements = hero.find_elements_by_class_name("HeroSection")
    assert len(hero_elements) == 3


@pytest.mark.nondestructive
def test_recommends_load(selenium):
    """Test recommended extensions load."""
    card = selenium.find_element(
        By.CSS_SELECTOR, ".Home-RecommendedExtensions .AddonsCard-list"
    )
    elements = card.find_elements(By.CSS_SELECTOR, ".AddonsCard-list li")
    assert len(elements) == 4
