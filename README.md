# Cisco Hyperfabric MCP Server

An MCP (Model Context Protocol) server that enables LLMs to interact with Cisco Hyperfabric APIs. This server exposes all Hyperfabric OpenAPI endpoints as tools for comprehensive infrastructure management and automation.

**🔧 Dynamic Tool Generation**: Automatically parses Hyperfabric OpenAPI specs and creates MCP tools  
**🛡️ Secure Authentication**: Handles Hyperfabric API token authentication with proper security  
**📊 Complete API Coverage**: Exposes all available Hyperfabric endpoints for infrastructure management

### Prerequisites

- Node.js 18+ installed
- VSCode with GitHub Copilot or Claude Desktop
- Hyperfabric API credentials (API Token)
- Hyperfabric OpenAPI specification file

### 1. Build the Server

```bash
npm install
npm run build
```

### 2. Configure LLM Client

#### For VSCode with GitHub Copilot

1. Open VSCode Settings: `Cmd+Shift+P` → "Preferences: Open User Settings (JSON)"

2. Add this configuration to your `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "hyperfabric": {
      "command": "node",
      "args": ["/path/to/cisco-hyperfabric-mcp-server/dist/main.js"],
      "env": {
        "HYPERFABRIC_API_TOKEN": "your-api-token",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

3. Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window"

#### For Claude Desktop

1. Locate your Claude Desktop configuration file:
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux:** `~/.config/Claude/claude_desktop_config.json`

2. Add this configuration to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hyperfabric": {
      "command": "node",
      "args": ["/path/to/cisco-hyperfabric-mcp-server/dist/main.js"],
      "env": {
        "HYPERFABRIC_API_TOKEN": "your-api-token",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

3. Restart Claude Desktop application

## Available Tools and Capabilities

The MCP server automatically generates tools for all Hyperfabric API endpoints:

### 🖥️ Infrastructure Management
- **Server Operations**: List, query, and manage physical servers
  - `mcp_hyperfabric_list_servers` - Retrieve all servers with filtering
  - `mcp_hyperfabric_get_server_details` - Get detailed server information
  - `mcp_hyperfabric_get_server_hardware` - Access hardware specifications

### 🌐 Network Configuration  
- **VLAN Management**: Configure and manage VLANs across fabric
  - `mcp_hyperfabric_create_vlan` - Create new VLANs
  - `mcp_hyperfabric_update_vlan` - Modify VLAN parameters
  - `mcp_hyperfabric_list_vlans` - Retrieve all configured VLANs

### 📋 Policy Management
- **Configuration Policies**: Create and manage server profiles
  - `mcp_hyperfabric_create_server_profile` - Define new server profiles
  - `mcp_hyperfabric_deploy_profile` - Apply profiles to servers
  - `mcp_hyperfabric_update_policy` - Modify existing policies

### 🔒 Security & Compliance
- **Certificate Management**: Handle SSL/TLS certificates and security
  - `mcp_hyperfabric_list_certificates` - View certificate status
  - `mcp_hyperfabric_security_audit` - Review security configurations
  - `mcp_hyperfabric_compliance_check` - Validate policy compliance

### 📊 Monitoring & Telemetry
- **Performance Metrics**: Track system performance and health
  - `mcp_hyperfabric_get_cpu_metrics` - Monitor CPU utilization
  - `mcp_hyperfabric_get_memory_stats` - Track memory consumption
  - `mcp_hyperfabric_get_power_data` - Power consumption monitoring

### 🔧 Automation & Workflows
- **Firmware Management**: Handle updates and maintenance
  - `mcp_hyperfabric_check_firmware` - Compare firmware versions
  - `mcp_hyperfabric_schedule_update` - Plan firmware upgrades
  - `mcp_hyperfabric_backup_config` - Save configurations

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HYPERFABRIC_API_TOKEN` | Your Hyperfabric API token | - | ✅ |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | info | ❌ |
| `OPENAPI_SPEC_PATH` | Path to OpenAPI spec file | hf_spec_modified.json | ❌ |

## Development Setup

### Project Structure
```
cisco-hyperfabric-mcp-server/
├── src/main.ts              # Main server implementation
├── dist/                    # Compiled JavaScript
├── .vscode/                 # VS Code configuration
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript config
└── hf_spec_modified.json    # OpenAPI specification
```

## Troubleshooting

### Common Issues

**Missing API Token**
```bash
# Check environment file
cat .env | grep HYPERFABRIC_API_TOKEN
```

**Missing OpenAPI Spec**
```bash
# Verify spec file exists
ls -la hf_spec_modified.json
```

**Compilation Errors**
```bash
# Check compilation
npm run build
```
