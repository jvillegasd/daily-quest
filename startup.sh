#!/bin/sh

echo "Running migrations..."
node node_modules/prisma/build/index.js migrate deploy 2>&1 || echo "Migration failed with $?"

echo "Starting server..."
exec node server.js
