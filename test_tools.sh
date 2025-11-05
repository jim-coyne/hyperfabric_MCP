#!/bin/bash
# Quick reference for testing Hyperfabric MCP tools

# Source the environment to get the API token
source .env

# Function to test a tool
test_tool() {
  local tool_name=$1
  local args=$2
  
  echo "Testing: $tool_name"
  echo "Arguments: $args"
  echo ""
  
  echo "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"$tool_name\",\"arguments\":$args}}" | \
    node dist/main.js 2>&1 | tail -50
}

# Example 1: Get all fabrics
echo "=== Example 1: Get All Fabrics ==="
test_tool "fabricsGetAllFabrics" "{}"

# Example 2: Create a fabric
echo ""
echo "=== Example 2: Create RDMA Fabric ==="
test_tool "fabricsAddFabrics" "{\"fabrics\":[{\"name\":\"rdma-fabric\",\"description\":\"RDMA-enabled fabric\",\"topology\":\"SPINE_LEAF\",\"entLevel\":\"ESSENTIALS\"}]}"

# Example 3: Create another fabric variant
echo ""
echo "=== Example 3: Create Storage Fabric ==="
test_tool "fabricsAddFabrics" "{\"fabrics\":[{\"name\":\"storage-fabric\",\"description\":\"Storage-optimized fabric\",\"topology\":\"SPINE_LEAF\",\"entLevel\":\"ESSENTIALS\"}]}"

echo ""
echo "=== Done ==="
