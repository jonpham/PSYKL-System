#!/usr/bin/env sh
set -eu

for i in $(seq 1 30); do
  if curl -sf http://localhost:5173/ > /dev/null; then
    echo "web-client ready"
    exit 0
  fi

  echo "waiting for web-client... attempt $i"
  sleep 2
done

echo "web-client did not become ready" >&2
exit 1
