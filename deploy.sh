#!/bin/bash
# Deploy dashboard (auto-syncs curriculum via firebase predeploy hook)
# Usage: ./deploy.sh

set -e
firebase deploy --only hosting:dashboard
