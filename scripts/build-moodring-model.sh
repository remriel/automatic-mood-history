#!/usr/bin/env bash
set -euo pipefail
# Pin both training code and the source dataset; do not ingest floating master revisions.
MOODRING_COMMIT=0520258846018979e7d24bd5597adaabccde4f87
GOEMOTIONS_COMMIT=3ef52111c1fabc301880818f5a547570e926a76b
git clone --quiet https://github.com/UsmarHaider/moodring.git /tmp/amh-moodring
git -C /tmp/amh-moodring checkout --quiet "$MOODRING_COMMIT"
sed -i "s#master/goemotions/data#$GOEMOTIONS_COMMIT/goemotions/data#" /tmp/amh-moodring/moodring/data.py
grep -q "$GOEMOTIONS_COMMIT/goemotions/data" /tmp/amh-moodring/moodring/data.py
# Same algorithm, single worker to prevent joblib sparse-array writeback races on hosted runners.
sed -i 's/n_jobs=-1/n_jobs=1/' /tmp/amh-moodring/moodring/model.py
grep -q 'n_jobs=1' /tmp/amh-moodring/moodring/model.py
# Proven compatible with Python 3.11; avoid dependency drift and NumPy 2 sparse-data incompatibilities.
python -m pip install --disable-pip-version-check -q 'numpy==1.26.4' 'scipy==1.12.0' 'scikit-learn==1.4.2' 'pandas==2.2.3' 'joblib==1.4.2'
python -m pip install --disable-pip-version-check -q --no-deps -e /tmp/amh-moodring
(cd /tmp/amh-moodring && python scripts/download_data.py && python scripts/train.py && python scripts/export_js.py)
cp /tmp/amh-moodring/artifacts/model.bin ./moodring-model.bin
node scripts/verify-moodring-model.js moodring-model.bin
