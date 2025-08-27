import os, sys

# Ensure repository root is on sys.path for absolute imports like `apps.api.*`
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

