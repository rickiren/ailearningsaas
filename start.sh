#!/bin/bash

echo "🔄 Stopping all Node.js processes..."
pkill -f "node" || true

echo "⏳ Waiting for processes to stop..."
sleep 2

echo "🚀 Starting the development server..."
npm run dev
