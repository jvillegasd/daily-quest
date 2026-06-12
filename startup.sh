#!/bin/sh

echo "=== startup: pwd=$(pwd) NODE_ENV=$NODE_ENV ==="
echo "=== files: $(ls /app | head -10) ==="

echo "=== Running database migrations ==="
if node node_modules/prisma/build/index.js migrate deploy 2>&1; then
  echo "=== Migrations succeeded ==="
else
  echo "=== Migrations failed (exit $?) - continuing anyway ==="
fi

echo "=== Starting server ==="
node server.js
EXIT=$?
echo "=== server.js exited with $EXIT - keeping container alive ==="
sleep infinity
