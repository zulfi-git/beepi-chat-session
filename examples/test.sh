#!/bin/bash
# ChatKit Token Service - Testing Script
# Run this script to test the endpoints with curl

set -e

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787}"
ORIGIN="${ORIGIN:-https://example.com}"

echo "============================================"
echo "ChatKit Token Service - Testing Script"
echo "============================================"
echo "Worker URL: $WORKER_URL"
echo "Origin: $ORIGIN"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 0: Health Check
echo -e "${BLUE}Test 0: Health Check${NC}"
echo "GET $WORKER_URL/api/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$WORKER_URL/api/health")

HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Success (HTTP $HTTP_STATUS)${NC}"
  echo "$RESPONSE_BODY" | jq '.'
  
  # Verify response structure
  STATUS=$(echo "$RESPONSE_BODY" | jq -r '.status')
  UPTIME=$(echo "$RESPONSE_BODY" | jq -r '.uptime')
  VERSION=$(echo "$RESPONSE_BODY" | jq -r '.version')
  
  if [ "$STATUS" == "ok" ] && [ "$UPTIME" != "null" ] && [ "$VERSION" != "null" ]; then
    echo -e "${GREEN}✓ Response structure is correct${NC}"
  else
    echo -e "${RED}✗ Response structure is incorrect${NC}"
  fi
else
  echo -e "${RED}✗ Failed (HTTP $HTTP_STATUS)${NC}"
  echo "$RESPONSE_BODY" | jq '.'
fi

echo ""
echo "============================================"
echo ""

# Test 1: Start Session
echo -e "${BLUE}Test 1: Start Session${NC}"
echo "POST $WORKER_URL/api/chatkit/start"
echo ""

START_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$WORKER_URL/api/chatkit/start" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d '{}')

HTTP_STATUS=$(echo "$START_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$START_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Success (HTTP $HTTP_STATUS)${NC}"
  echo "$RESPONSE_BODY" | jq '.'
  CLIENT_SECRET=$(echo "$RESPONSE_BODY" | jq -r '.client_secret')
else
  echo -e "${RED}✗ Failed (HTTP $HTTP_STATUS)${NC}"
  echo "$RESPONSE_BODY" | jq '.'
  exit 1
fi

echo ""
echo "============================================"
echo ""

# Test 2: Refresh Session
echo -e "${BLUE}Test 2: Refresh Session${NC}"
echo "POST $WORKER_URL/api/chatkit/refresh"
echo ""

if [ -z "$CLIENT_SECRET" ]; then
  echo -e "${RED}✗ No client secret from start session${NC}"
  exit 1
fi

REFRESH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$WORKER_URL/api/chatkit/refresh" \
  -H "Content-Type: application/json" \
  -H "Origin: $ORIGIN" \
  -d "{\"currentClientSecret\": \"$CLIENT_SECRET\"}")

HTTP_STATUS=$(echo "$REFRESH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$REFRESH_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Success (HTTP $HTTP_STATUS)${NC}"
  echo "$RESPONSE_BODY" | jq '.'
else
  echo -e "${RED}✗ Failed (HTTP $HTTP_STATUS)${NC}"
  echo "$RESPONSE_BODY" | jq '.'
fi

echo ""
echo "============================================"
echo ""

# Test 3: CORS Preflight
echo -e "${BLUE}Test 3: CORS Preflight${NC}"
echo "OPTIONS $WORKER_URL/api/chatkit/start"
echo ""

CORS_RESPONSE=$(curl -s -i -X OPTIONS "$WORKER_URL/api/chatkit/start" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST")

HTTP_STATUS=$(echo "$CORS_RESPONSE" | grep "HTTP" | head -n1 | cut -d' ' -f2)

if [ "$HTTP_STATUS" -eq 204 ]; then
  echo -e "${GREEN}✓ Success (HTTP $HTTP_STATUS)${NC}"
  echo "$CORS_RESPONSE" | grep -i "access-control"
else
  echo -e "${RED}✗ Failed (HTTP $HTTP_STATUS)${NC}"
  echo "$CORS_RESPONSE"
fi

echo ""
echo "============================================"
echo ""

# Test 4: Invalid Endpoint
echo -e "${BLUE}Test 4: Invalid Endpoint (404)${NC}"
echo "POST $WORKER_URL/api/invalid"
echo ""

INVALID_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$WORKER_URL/api/invalid" \
  -H "Content-Type: application/json" \
  -d '{}')

HTTP_STATUS=$(echo "$INVALID_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$INVALID_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 404 ]; then
  echo -e "${GREEN}✓ Correctly returned 404${NC}"
  echo "$RESPONSE_BODY" | jq '.'
else
  echo -e "${RED}✗ Expected 404, got HTTP $HTTP_STATUS${NC}"
  echo "$RESPONSE_BODY" | jq '.'
fi

echo ""
echo "============================================"
echo ""

# Test 5: Invalid Method
echo -e "${BLUE}Test 5: Invalid Method (405)${NC}"
echo "GET $WORKER_URL/api/chatkit/start"
echo ""

METHOD_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X GET "$WORKER_URL/api/chatkit/start")

HTTP_STATUS=$(echo "$METHOD_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$METHOD_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 405 ]; then
  echo -e "${GREEN}✓ Correctly returned 405${NC}"
  echo "$RESPONSE_BODY" | jq '.'
else
  echo -e "${RED}✗ Expected 405, got HTTP $HTTP_STATUS${NC}"
  echo "$RESPONSE_BODY" | jq '.'
fi

echo ""
echo "============================================"
echo ""

# Test 6: Bad Request (missing field)
echo -e "${BLUE}Test 6: Bad Request (missing currentClientSecret)${NC}"
echo "POST $WORKER_URL/api/chatkit/refresh"
echo ""

BAD_REQUEST_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$WORKER_URL/api/chatkit/refresh" \
  -H "Content-Type: application/json" \
  -d '{}')

HTTP_STATUS=$(echo "$BAD_REQUEST_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$BAD_REQUEST_RESPONSE" | sed '/HTTP_STATUS:/d')

if [ "$HTTP_STATUS" -eq 400 ]; then
  echo -e "${GREEN}✓ Correctly returned 400${NC}"
  echo "$RESPONSE_BODY" | jq '.'
else
  echo -e "${RED}✗ Expected 400, got HTTP $HTTP_STATUS${NC}"
  echo "$RESPONSE_BODY" | jq '.'
fi

echo ""
echo "============================================"
echo ""
echo -e "${GREEN}All tests completed!${NC}"
echo ""
