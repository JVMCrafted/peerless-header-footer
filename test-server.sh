#!/bin/bash

# Simple Test Server for External Navigation
# This simulates hosting the navigation files on an external server

echo "=========================================="
echo "Peerless Pump External Navigation Server"
echo "=========================================="
echo ""
echo "This simulates hosting nav files on a separate domain"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✓ Starting Python HTTP server on port 8000..."
    echo ""
    echo "Access the navigation at:"
    echo "  http://localhost:8000/nav.html"
    echo "  http://localhost:8000/demo.html"
    echo "  http://localhost:8000/test-api.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "=========================================="
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✓ Starting Python HTTP server on port 8000..."
    echo ""
    echo "Access the navigation at:"
    echo "  http://localhost:8000/nav.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "=========================================="
    python -m SimpleHTTPServer 8000
elif command -v php &> /dev/null; then
    echo "✓ Starting PHP built-in server on port 8000..."
    echo ""
    echo "Access the navigation at:"
    echo "  http://localhost:8000/nav.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "=========================================="
    php -S localhost:8000
else
    echo "✗ Error: No suitable server found"
    echo ""
    echo "Please install one of the following:"
    echo "  - Python 3: brew install python3"
    echo "  - PHP: brew install php"
    echo ""
    echo "Or use Node.js:"
    echo "  npm install -g http-server"
    echo "  http-server -p 8000"
fi
