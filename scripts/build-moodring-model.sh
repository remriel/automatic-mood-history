#!/usr/bin/env bash
set -euo pipefail
git clone --quiet https://github.com/UsmarHaider/moodring.git /tmp/amh-moodring
git -C /tmp/amh-moodring checkout --quiet 0520258846018979e7d24bd5597adaabccde4f87
python -m pip install --disable-pip-version-check -q -e /tmp/amh-moodring
(cd /tmp/amh-moodring && python scripts/download_data.py && python scripts/train.py && python scripts/export_js.py)
cp /tmp/amh-moodring/artifacts/model.bin ./moodring-model.bin
node scripts/verify-moodring-model.js moodring-model.bin
