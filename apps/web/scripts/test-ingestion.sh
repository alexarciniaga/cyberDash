#!/bin/bash

# CyberDash Data Ingestion Test Script
# This script tests all data ingestion endpoints

set -e

BASE_URL="http://localhost:3000"
ENDPOINTS=(
    "cisa-kev"
    "nvd-cve" 
    "mitre-attack"
)

echo "🚀 CyberDash Data Ingestion Test"
echo "================================="
echo "Testing endpoints at: $BASE_URL"
echo ""

# Check if the server is running
echo "📡 Checking if server is running..."
if ! curl -sf "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo "❌ Server is not running at $BASE_URL"
    echo "   Please start the development server:"
    echo "   cd cyberDash/apps/web && npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Test each ingestion endpoint
for endpoint in "${ENDPOINTS[@]}"; do
    echo "🔄 Testing $endpoint ingestion..."
    
    # Test GET request (status check)
    echo "   📊 Checking status..."
    if curl -sf "$BASE_URL/api/ingestion/$endpoint" > /dev/null; then
        echo "   ✅ Status endpoint accessible"
    else
        echo "   ⚠️  Status endpoint not responding"
    fi
    
    # Test POST request (actual ingestion) with timeout
    echo "   🚀 Starting ingestion (this may take several minutes)..."
    start_time=$(date +%s)
    
    if timeout 600 curl -X POST "$BASE_URL/api/ingestion/$endpoint" \
        -H "Content-Type: application/json" \
        -s -o "/tmp/ingestion_$endpoint.json" \
        -w "HTTP %{http_code} | Time: %{time_total}s\n"; then
        
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        # Check if response contains success
        if grep -q '"success".*true' "/tmp/ingestion_$endpoint.json" 2>/dev/null; then
            echo "   ✅ $endpoint ingestion completed successfully in ${duration}s"
            
            # Extract key metrics from response
            if command -v jq > /dev/null 2>&1; then
                echo "   📈 Results:"
                jq -r '.data | "      Records processed: \(.recordsProcessed // "N/A"), Added: \(.recordsAdded // "N/A"), Updated: \(.recordsUpdated // "N/A")"' "/tmp/ingestion_$endpoint.json" 2>/dev/null || echo "      (Could not parse detailed results)"
            fi
        else
            echo "   ❌ $endpoint ingestion failed"
            echo "   📄 Response saved to: /tmp/ingestion_$endpoint.json"
        fi
    else
        echo "   ⏰ $endpoint ingestion timed out or failed"
        echo "   📄 Partial response saved to: /tmp/ingestion_$endpoint.json"
    fi
    
    echo ""
done

echo "🎉 Ingestion testing completed!"
echo ""
echo "📋 Next Steps:"
echo "   • Check the dashboard at: $BASE_URL"
echo "   • Review logs: docker logs cyberdash-web"
echo "   • Monitor database: Check data_ingestion_log table"
echo ""
echo "🔄 For automated daily updates, add to crontab:"
echo "   0 2 * * * curl -X POST $BASE_URL/api/ingestion/cisa-kev"
echo "   0 3 * * * curl -X POST $BASE_URL/api/ingestion/nvd-cve"
echo "   0 4 * * * curl -X POST $BASE_URL/api/ingestion/mitre-attack" 