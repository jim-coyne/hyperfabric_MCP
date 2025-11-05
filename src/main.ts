import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Set up logging - IMPORTANT: MCP servers use stdout for JSON-RPC communication
// so we MUST log to stderr to avoid corrupting the protocol messages
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }: any) => {
      return `${timestamp} - Hyperfabric_MCP - ${level.toUpperCase()} - ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug', 'verbose', 'silly']
    })
  ]
});

interface OpenAPISpec {
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, Record<string, any>>;
  components?: {
    schemas?: Record<string, any>;
  };
}

interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    schema?: any;
    description?: string;
  }>;
  requestBody?: {
    content?: Record<string, any>;
  };
  responses?: Record<string, any>;
}

class HyperfabricMCPServer {
  private server: Server;
  private httpClient: AxiosInstance;
  private openApiSpec: OpenAPISpec | null = null;
  private tools: Tool[] = [];

  constructor() {
    this.server = new Server(
      {
        name: "Hyperfabric_MCP_API_Server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize HTTP client
    const token = process.env.HYPERFABRIC_API_TOKEN;
    if (!token) {
      logger.error("ERROR: HYPERFABRIC_API_TOKEN not found in environment variables.");
      process.exit(1);
    }

    logger.info(`Using token: ${token.slice(0, 4)}...${token.slice(-4)}`);

    this.httpClient = axios.create({
      baseURL: "https://hyperfabric.cisco.com/api/v1",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    this.setupHandlers();
  }

  private async loadOpenAPISpec(): Promise<void> {
    // Get the spec file path - use environment variable if set, otherwise default to project directory
    const specFileName = process.env.OPENAPI_SPEC_PATH || 'hf_spec_modified.json';
    
    // Resolve the path relative to the project directory (where package.json is)
    // When running as MCP server, we need to resolve from the dist directory up to project root
    const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
    const specFilePath = path.join(projectRoot, specFileName);
    
    try {
      const specContent = await fs.readFile(specFilePath, 'utf-8');
      this.openApiSpec = JSON.parse(specContent);
      
      logger.info("✅ OpenAPI spec loaded successfully!");
      if (this.openApiSpec?.info?.title) {
        logger.info(`   Title: ${this.openApiSpec.info.title}`);
        logger.info(`   Version: ${this.openApiSpec.info.version}`);
      }
      
      this.generateTools();
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        logger.error(`ERROR: The file was not found at '${specFilePath}'`);
      } else if (error instanceof SyntaxError) {
        logger.error(`ERROR: The file at '${specFilePath}' is not valid JSON.`);
      } else {
        logger.error(`Error loading OpenAPI spec: ${error}`);
      }
      process.exit(1);
    }
  }

  private generateTools(): void {
    if (!this.openApiSpec?.paths) {
      logger.error("No paths found in OpenAPI spec");
      return;
    }

    this.tools = [];

    for (const [pathKey, pathItem] of Object.entries(this.openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation) continue;
        
        const op = operation as OpenAPIOperation;
        const toolName = this.generateToolName(method, pathKey, op);
        const tool = this.createToolFromOperation(toolName, method, pathKey, op);
        
        if (tool) {
          this.tools.push(tool);
          logger.debug(`Generated tool: ${toolName}`);
        }
      }
    }

    logger.info(`Generated ${this.tools.length} tools from OpenAPI spec`);
  }

  private generateToolName(method: string, path: string, operation: OpenAPIOperation): string {
    if (operation.operationId) {
      return operation.operationId;
    }

    // Generate a name from the method and path
    const pathParts = path.split('/').filter(part => part && !part.startsWith('{'));
    const nameBase = pathParts.join('_').replace(/[^a-zA-Z0-9_]/g, '_');
    return `${method}_${nameBase}`;
  }

  private resolveSchemaRef(schema: any): any {
    // If schema is a reference, resolve it from components
    if (schema.$ref && typeof schema.$ref === 'string') {
      const refPath = schema.$ref.split('/');
      let resolved: any = this.openApiSpec;
      
      for (const part of refPath) {
        if (part === '#') continue;
        resolved = resolved?.[part];
      }
      
      return resolved || schema;
    }
    return schema;
  }

  private deepResolveSchema(schema: any, depth: number = 0): any {
    // Prevent infinite recursion
    if (depth > 5 || !schema || typeof schema !== 'object') {
      return schema;
    }

    // If this is a reference, resolve it
    if (schema.$ref && typeof schema.$ref === 'string') {
      schema = this.resolveSchemaRef(schema);
    }

    // Recursively resolve nested properties
    if (schema.properties && typeof schema.properties === 'object') {
      for (const [key, prop] of Object.entries(schema.properties)) {
        (schema.properties as any)[key] = this.deepResolveSchema(prop as any, depth + 1);
      }
    }

    // Recursively resolve items (for arrays)
    if (schema.items) {
      schema.items = this.deepResolveSchema(schema.items, depth + 1);
    }

    return schema;
  }

  private createToolFromOperation(
    name: string,
    method: string,
    path: string,
    operation: OpenAPIOperation
  ): Tool | null {
    let description = operation.summary || operation.description || `${method.toUpperCase()} ${path}`;
    
    // Enhance description for create/update operations
    if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
      if (method.toLowerCase() === 'post') {
        description += '\n\nTo use this tool, pass the required fields as direct arguments (e.g., fabrics=[{name:"my-fabric", description:"...", ...}])';
      } else if (method.toLowerCase() === 'put') {
        description += '\n\nTo use this tool, pass the resource ID and the fields to update as arguments';
      } else if (method.toLowerCase() === 'patch') {
        description += '\n\nTo use this tool, pass the resource ID and the fields to patch as arguments';
      }
    }
    
    const properties: Record<string, any> = {};
    const required: string[] = [];

    // Process parameters
    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (param.in === 'path' || param.in === 'query') {
          properties[param.name] = {
            type: param.schema?.type || 'string',
            description: param.description || ''
          };
          
          if (param.required) {
            required.push(param.name);
          }
        }
      }
    }

    // Process request body for POST/PUT/PATCH requests
    if (operation.requestBody && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
      // Resolve the requestBody reference if it exists
      const requestBody = this.resolveSchemaRef(operation.requestBody);
      const content = requestBody.content;
      
      if (content?.['application/json']?.schema) {
        let schema = content['application/json'].schema;
        // Deeply resolve schema references
        schema = this.deepResolveSchema(schema);
        
        if (schema.properties) {
          // Expose the request body properties directly
          for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const propDef = propSchema as any;
            properties[propName] = this.deepResolveSchema(propDef, 0);
            
            if (schema.required?.includes(propName)) {
              required.push(propName);
            }
          }
        }
      }
    }

    return {
      name,
      description,
      inputSchema: {
        type: 'object',
        properties,
        required
      }
    };
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: this.tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Calling tool: ${name}`);
      logger.debug(`Tool arguments: ${JSON.stringify(args, null, 2)}`);
      
      try {
        // Find the tool definition
        const tool = this.tools.find(t => t.name === name);
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }

        // Execute the API call
        const result = await this.executeApiCall(name, args);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error(`Error executing tool ${name}:`, error);
        
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private async executeApiCall(toolName: string, args: any): Promise<any> {
    // Extract the original method and path from the tool name
    // This is a simplified approach - in a production system you'd want a more robust mapping
    
    if (!this.openApiSpec?.paths) {
      throw new Error("OpenAPI spec not loaded");
    }

    // Find the corresponding operation
    let foundOperation: { method: string; path: string; operation: OpenAPIOperation } | null = null;
    
    for (const [pathKey, pathItem] of Object.entries(this.openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation) continue;
        
        const op = operation as OpenAPIOperation;
        const expectedToolName = this.generateToolName(method, pathKey, op);
        
        if (expectedToolName === toolName) {
          foundOperation = { method, path: pathKey, operation: op };
          break;
        }
      }
      if (foundOperation) break;
    }

    if (!foundOperation) {
      throw new Error(`No operation found for tool: ${toolName}`);
    }

    // Build the URL by replacing path parameters
    let url = foundOperation.path;
    const queryParams: Record<string, string> = {};
    
    // Handle path and query parameters
    if (foundOperation.operation.parameters) {
      for (const param of foundOperation.operation.parameters) {
        const value = args[param.name];
        if (value !== undefined) {
          if (param.in === 'path') {
            url = url.replace(`{${param.name}}`, encodeURIComponent(value));
          } else if (param.in === 'query') {
            queryParams[param.name] = value;
          }
        }
      }
    }

    // Prepare the request
    const requestConfig: any = {
      method: foundOperation.method.toUpperCase(),
      url,
      params: queryParams,
    };

    // Handle request body for POST/PUT/PATCH
    if (['post', 'put', 'patch'].includes(foundOperation.method.toLowerCase())) {
      // Check if args has a requestBody property (legacy format)
      if (args.requestBody) {
        requestConfig.data = args.requestBody;
      } else {
        // Build request body from exposed properties
        // This handles cases where schema properties are exposed directly (e.g., fabrics, nodes, etc.)
        const requestBody: Record<string, any> = {};
        const pathItem = this.openApiSpec?.paths?.[foundOperation.path];
        const operation = (pathItem as any)?.[foundOperation.method];
        
        if (operation?.requestBody) {
          const requestBodyDef = this.resolveSchemaRef(operation.requestBody);
          const schema = this.deepResolveSchema(requestBodyDef.content?.['application/json']?.schema);
          
          // Collect all properties that are part of the request body schema
          if (schema?.properties) {
            for (const propName of Object.keys(schema.properties)) {
              if (args.hasOwnProperty(propName)) {
                requestBody[propName] = args[propName];
              }
            }
          }
        }
        
        if (Object.keys(requestBody).length > 0) {
          requestConfig.data = requestBody;
        }
      }
    }

    logger.debug(`Making API call: ${requestConfig.method} ${url}`);
    
    try {
      const response = await this.httpClient.request(requestConfig);
      return {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API call failed: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  async run(): Promise<void> {
    await this.loadOpenAPISpec();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info("Hyperfabric MCP Server is running...");
  }
}

// Main execution
const server = new HyperfabricMCPServer();
server.run().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});