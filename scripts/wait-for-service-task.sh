#!/usr/bin/env sh
set -eu

for i in $(seq 1 30); do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/tasks || echo 000)
  if [ "$status" = "401" ]; then
    echo "service-task ready"
    exit 0
  fi

  echo "waiting for service-task... attempt $i (status $status)"
  sleep 2
done

echo "service-task did not become ready" >&2
exit 1
