#!/usr/bin/env python
# -*- coding: utf-8 -*-
from setuptools import setup


setup(
    name='addons-frontend',
    version='0.1.0',
    description='This is https://addons.mozilla.org (AMO)',
    author='The Mozilla Team',
    author_email='amo-developers@mozilla.org',
    url='https://addons.mozilla.org/',
    test_suite='.',
    zip_safe=False,
    classifiers=[
        'Development Status :: 5 - Production/Stable',
        'Environment :: Web Environment',
        'License :: OSI Approved :: Mozilla Public License',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2.7',
    ],
)
