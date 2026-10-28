#!/bin/sh
# Run the whole prep pipeline. Masked by default: reads the seed from ~/.nof1-seed (made once,
# 32 random hex characters, mode 600) and writes web/public/data/. With --real, writes the real
# values to prep/private/ only. The seed never enters the repo.
set -eu
cd "$(dirname "$0")"
SEED_FILE="$HOME/.nof1-seed"

if [ "${1:-}" = "--real" ]; then
  python3 build.py --real && python3 write_patterns.py --real && python3 figures.py --real
  exit 0
fi

if [ ! -f "$SEED_FILE" ]; then
  (umask 077 && python3 -c 'import secrets; print(secrets.token_hex(16))' > "$SEED_FILE")
fi
chmod 600 "$SEED_FILE"
NOF1_SEED="$(cat "$SEED_FILE")"
export NOF1_SEED
python3 build.py && python3 write_patterns.py && python3 figures.py
