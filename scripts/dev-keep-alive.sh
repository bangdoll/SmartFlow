#!/bin/bash

# Check if port 3000 is already in use
if lsof -i :3000 > /dev/null; then
    echo "✅ Dev server is already running on port 3000."
    # Optional: Kill it if we want to force restart, but better to respect existing instance
    # exit 0
else
    echo "🚀 Starting Dev Server..."
fi

# Loop to keep it alive
while true; do
    # Check again inside loop just in case
    if ! lsof -i :3000 > /dev/null; then
        echo "🔄 (Re)starting npm run dev..."
        npm run dev
    fi
    
    echo "⚠️ Server stopped or crashed. Restarting in 3 seconds..."
    sleep 3
done
