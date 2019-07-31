"""Smoke tests for addons-frontend docker image."""

import pytest
import requests


def test_hidden_comment_is_found(base_url):
    """Test hidden element is found."""
    r = requests.get(base_url)
    assert "<!-- Godzilla of browsers -->" in r.text
