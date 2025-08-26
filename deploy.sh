#!/bin/bash

# Quick deployment script for swaxi-dispo-v6
# This script helps deploy to multiple platforms

echo "🚀 Swaxi Dispo Deployment Helper"
echo "================================"

# Check if build exists
if [ ! -d "dist" ]; then
    echo "📦 Building application..."
    npm run build
fi

echo ""
echo "🌐 Deployment Options:"
echo "1. GitHub Pages (automatic) - https://swaxidriver.github.io/swaxi-dispo-v6/"
echo "2. Surge.sh (manual, 30 seconds)"
echo "3. Firebase Hosting (manual, 1 minute)"
echo "4. Netlify Drop (manual, drag & drop)"
echo ""

read -p "Choose deployment method (1-4): " choice

case $choice in
    1)
        echo "✅ GitHub Pages deployment already triggered!"
        echo "   Check: https://github.com/swaxidriver/swaxi-dispo-v6/actions"
        ;;
    2)
        echo "📡 Installing Surge.sh..."
        npm install -g surge
        echo "🚀 Deploying to Surge.sh..."
        cd dist && surge --domain swaxi-dispo.surge.sh
        ;;
    3)
        echo "🔥 Installing Firebase CLI..."
        npm install -g firebase-tools
        echo "🚀 Initializing Firebase project..."
        firebase login
        firebase init hosting
        firebase deploy
        ;;
    4)
        echo "📂 Manual deployment instructions:"
        echo "   1. Open https://app.netlify.com/drop"
        echo "   2. Drag the 'dist' folder to the drop zone"
        echo "   3. Get instant URL!"
        ;;
    *)
        echo "❌ Invalid choice. Using GitHub Pages (default)."
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo "🧪 Don't forget to test at: /test"
