#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface TestResult {
  success: boolean;
  output: string;
  errors?: string;
  coverage?: any;
  suggestions?: string[];
}

interface CodeAnalysis {
  language: string;
  framework?: string;
  testFramework?: string;
  apiEndpoints: string[];
  testableComponents: string[];
  existingTests: string[];
}

class AITestingMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'ai-testing-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_codebase',
          description: 'Analyze project structure and identify testable components',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the project directory'
              }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'generate_unit_tests',
          description: 'Generate unit tests for specific functions or components',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to the file to test'
              },
              functionName: {
                type: 'string',
                description: 'Specific function to test (optional)'
              },
              testFramework: {
                type: 'string',
                description: 'Testing framework to use (jest, mocha, pytest, etc.)'
              }
            },
            required: ['filePath']
          }
        },
        {
          name: 'generate_integration_tests',
          description: 'Generate integration tests for API endpoints',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the project directory'
              },
              apiSpec: {
                type: 'string',
                description: 'API specification or documentation'
              }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'run_tests',
          description: 'Execute tests and return results',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the project directory'
              },
              testPattern: {
                type: 'string',
                description: 'Test file pattern or specific test to run'
              },
              framework: {
                type: 'string',
                description: 'Test framework (auto-detected if not specified)'
              }
            },
            required: ['projectPath']
          }
        },
        {
          name: 'analyze_test_results',
          description: 'Analyze test results and provide insights',
          inputSchema: {
            type: 'object',
            properties: {
              testOutput: {
                type: 'string',
                description: 'Raw test output to analyze'
              },
              projectPath: {
                type: 'string',
                description: 'Path to the project directory'
              }
            },
            required: ['testOutput']
          }
        },
        {
          name: 'suggest_fixes',
          description: 'Analyze failing tests and suggest code fixes',
          inputSchema: {
            type: 'object',
            properties: {
              failureOutput: {
                type: 'string',
                description: 'Test failure output'
              },
              sourceCode: {
                type: 'string',
                description: 'Source code that failed'
              },
              testCode: {
                type: 'string',
                description: 'Test code that failed'
              }
            },
            required: ['failureOutput']
          }
        },
        {
          name: 'setup_testing_framework',
          description: 'Initialize testing framework in a project',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to the project directory'
              },
              framework: {
                type: 'string',
                description: 'Testing framework to set up (jest, mocha, pytest, etc.)'
              },
              language: {
                type: 'string',
                description: 'Programming language (javascript, python, go, etc.)'
              }
            },
            required: ['projectPath', 'framework', 'language']
          }
        }
      ] as Tool[]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'analyze_codebase':
            return await this.analyzeCodebase(args.projectPath as string);
          
          case 'generate_unit_tests':
            return await this.generateUnitTests(
              args.filePath as string,
              args.functionName as string,
              args.testFramework as string
            );
          
          case 'generate_integration_tests':
            return await this.generateIntegrationTests(
              args.projectPath as string,
              args.apiSpec as string
            );
          
          case 'run_tests':
            return await this.runTests(
              args.projectPath as string,
              args.testPattern as string,
              args.framework as string
            );
          
          case 'analyze_test_results':
            return await this.analyzeTestResults(
              args.testOutput as string,
              args.projectPath as string
            );
          
          case 'suggest_fixes':
            return await this.suggestFixes(
              args.failureOutput as string,
              args.sourceCode as string,
              args.testCode as string
            );
          
          case 'setup_testing_framework':
            return await this.setupTestingFramework(
              args.projectPath as string,
              args.framework as string,
              args.language as string
            );
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`
            }
          ]
        };
      }
    });
  }

  private async analyzeCodebase(projectPath: string) {
    try {
      const analysis: CodeAnalysis = {
        language: '',
        apiEndpoints: [],
        testableComponents: [],
        existingTests: []
      };

      // Check for package.json (Node.js)
      try {
        const packageJson = await fs.readFile(join(projectPath, 'package.json'), 'utf-8');
        const pkg = JSON.parse(packageJson);
        analysis.language = 'javascript';
        
        // Detect test framework
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.jest) analysis.testFramework = 'jest';
        else if (deps.mocha) analysis.testFramework = 'mocha';
        else if (deps.vitest) analysis.testFramework = 'vitest';
        
        // Detect framework
        if (deps.react) analysis.framework = 'react';
        else if (deps.vue) analysis.framework = 'vue';
        else if (deps.express) analysis.framework = 'express';
        else if (deps.fastify) analysis.framework = 'fastify';
      } catch {}

      // Check for requirements.txt or pyproject.toml (Python)
      try {
        await fs.access(join(projectPath, 'requirements.txt'));
        analysis.language = 'python';
        analysis.testFramework = 'pytest'; // Default assumption
      } catch {}

      // Scan for source files and API endpoints
      const files = await this.getAllFiles(projectPath);
      
      for (const file of files) {
        const ext = extname(file);
        const content = await fs.readFile(file, 'utf-8');
        
        // Find API endpoints
        if (ext === '.js' || ext === '.ts') {
          const endpoints = this.extractJSAPIEndpoints(content);
          analysis.apiEndpoints.push(...endpoints);
        } else if (ext === '.py') {
          const endpoints = this.extractPythonAPIEndpoints(content);
          analysis.apiEndpoints.push(...endpoints);
        }
        
        // Find testable components
        if (this.isSourceFile(file)) {
          analysis.testableComponents.push(file);
        }
        
        // Find existing tests
        if (this.isTestFile(file)) {
          analysis.existingTests.push(file);
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to analyze codebase: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async generateUnitTests(filePath: string, functionName?: string, testFramework?: string) {
    try {
      const sourceCode = await fs.readFile(filePath, 'utf-8');
      const ext = extname(filePath);
      
      let generatedTests = '';
      
      if (ext === '.js' || ext === '.ts') {
        generatedTests = this.generateJSUnitTests(sourceCode, functionName, testFramework || 'jest');
      } else if (ext === '.py') {
        generatedTests = this.generatePythonUnitTests(sourceCode, functionName, testFramework || 'pytest');
      } else {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: generatedTests
          }
        ]
      };
    } catch (error) {
      throw new Error(`Failed to generate unit tests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async runTests(projectPath: string, testPattern?: string, framework?: string): Promise<any> {
    try {
      let command = '';
      let args: string[] = [];

      // Auto-detect test framework if not specified
      if (!framework) {
        framework = await this.detectTestFramework(projectPath);
      }

      switch (framework) {
        case 'jest':
          command = 'npx';
          args = ['jest'];
          if (testPattern) args.push(testPattern);
          args.push('--verbose', '--coverage');
          break;
        case 'pytest':
          command = 'python';
          args = ['-m', 'pytest'];
          if (testPattern) args.push(testPattern);
          args.push('-v', '--cov=.');
          break;
        case 'go':
          command = 'go';
          args = ['test'];
          if (testPattern) args.push(testPattern);
          args.push('-v', '-cover');
          break;
        default:
          throw new Error(`Unsupported test framework: ${framework}`);
      }

      const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`, {
        cwd: projectPath,
        timeout: 60000
      });

      const result: TestResult = {
        success: !stderr || stderr.length === 0,
        output: stdout,
        errors: stderr
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      const result: TestResult = {
        success: false,
        output: '',
        errors: error instanceof Error ? error.message : String(error)
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  }

  // Helper methods for code analysis and generation
  private async getAllFiles(dir: string, files: string[] = []): Promise<string[]> {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        await this.getAllFiles(fullPath, files);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private isSourceFile(filePath: string): boolean {
    const ext = extname(filePath);
    return ['.js', '.ts', '.py', '.go', '.java', '.cpp', '.c'].includes(ext) && 
           !this.isTestFile(filePath);
  }

  private isTestFile(filePath: string): boolean {
    const filename = filePath.toLowerCase();
    return filename.includes('test') || filename.includes('spec') || 
           filename.endsWith('.test.js') || filename.endsWith('.spec.js') ||
           filename.endsWith('.test.ts') || filename.endsWith('.spec.ts') ||
           filename.endsWith('_test.py') || filename.endsWith('_test.go');
  }

  private extractJSAPIEndpoints(code: string): string[] {
    const endpoints: string[] = [];
    const patterns = [
      /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi,
      /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi,
      /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        endpoints.push(`${match[1].toUpperCase()} ${match[2]}`);
      }
    });

    return endpoints;
  }

  private extractPythonAPIEndpoints(code: string): string[] {
    const endpoints: string[] = [];
    const patterns = [
      /@app\.route\(['"`]([^'"`]+)['"`].*methods=\[['"`]([^'"`]+)['"`]\]/gi,
      /@app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        if (match[2]) {
          endpoints.push(`${match[2].toUpperCase()} ${match[1]}`);
        } else {
          endpoints.push(`${match[1].toUpperCase()} ${match[2]}`);
        }
      }
    });

    return endpoints;
  }

  private generateJSUnitTests(sourceCode: string, functionName?: string, framework: string = 'jest'): string {
    // Extract function names from source code
    const functions = this.extractJSFunctions(sourceCode);
    const targetFunctions = functionName ? [functionName] : functions;

    let testCode = '';
    
    if (framework === 'jest') {
      testCode = `const { ${targetFunctions.join(', ')} } = require('./source-file');\n\n`;
      
      targetFunctions.forEach(func => {
        testCode += `describe('${func}', () => {\n`;
        testCode += `  test('should work correctly with valid input', () => {\n`;
        testCode += `    // TODO: Add test implementation\n`;
        testCode += `    expect(${func}).toBeDefined();\n`;
        testCode += `  });\n\n`;
        testCode += `  test('should handle edge cases', () => {\n`;
        testCode += `    // TODO: Add edge case tests\n`;
        testCode += `  });\n\n`;
        testCode += `  test('should handle invalid input', () => {\n`;
        testCode += `    // TODO: Add error handling tests\n`;
        testCode += `  });\n`;
        testCode += `});\n\n`;
      });
    }

    return testCode;
  }

  private generatePythonUnitTests(sourceCode: string, functionName?: string, framework: string = 'pytest'): string {
    const functions = this.extractPythonFunctions(sourceCode);
    const targetFunctions = functionName ? [functionName] : functions;

    let testCode = 'import pytest\nfrom source_file import ' + targetFunctions.join(', ') + '\n\n';
    
    targetFunctions.forEach(func => {
      testCode += `class Test${func.charAt(0).toUpperCase() + func.slice(1)}:\n`;
      testCode += `    def test_${func}_valid_input(self):\n`;
      testCode += `        """Test ${func} with valid input"""\n`;
      testCode += `        # TODO: Add test implementation\n`;
      testCode += `        assert ${func} is not None\n\n`;
      testCode += `    def test_${func}_edge_cases(self):\n`;
      testCode += `        """Test ${func} edge cases"""\n`;
      testCode += `        # TODO: Add edge case tests\n`;
      testCode += `        pass\n\n`;
      testCode += `    def test_${func}_error_handling(self):\n`;
      testCode += `        """Test ${func} error handling"""\n`;
      testCode += `        # TODO: Add error handling tests\n`;
      testCode += `        pass\n\n`;
    });

    return testCode;
  }

  private extractJSFunctions(code: string): string[] {
    const functions: string[] = [];
    const patterns = [
      /function\s+(\w+)\s*\(/gi,
      /const\s+(\w+)\s*=\s*\(/gi,
      /(\w+)\s*:\s*function/gi,
      /(\w+)\s*=>\s*/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        functions.push(match[1]);
      }
    });

    return [...new Set(functions)];
  }

  private extractPythonFunctions(code: string): string[] {
    const functions: string[] = [];
    const pattern = /def\s+(\w+)\s*\(/gi;
    
    let match;
    while ((match = pattern.exec(code)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  private async detectTestFramework(projectPath: string): string {
    try {
      const packageJson = await fs.readFile(join(projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.jest) return 'jest';
      if (deps.mocha) return 'mocha';
      if (deps.vitest) return 'vitest';
    } catch {}

    try {
      await fs.access(join(projectPath, 'requirements.txt'));
      return 'pytest';
    } catch {}

    try {
      await fs.access(join(projectPath, 'go.mod'));
      return 'go';
    } catch {}

    return 'jest'; // default
  }

  // Placeholder implementations for other methods
  private async generateIntegrationTests(projectPath: string, apiSpec?: string) {
    return {
      content: [
        {
          type: 'text',
          text: 'Integration tests generation coming soon...'
        }
      ]
    };
  }

  private async analyzeTestResults(testOutput: string, projectPath?: string) {
    return {
      content: [
        {
          type: 'text',
          text: 'Test results analysis coming soon...'
        }
      ]
    };
  }

  private async suggestFixes(failureOutput: string, sourceCode?: string, testCode?: string) {
    return {
      content: [
        {
          type: 'text',
          text: 'Fix suggestions coming soon...'
        }
      ]
    };
  }

  private async setupTestingFramework(projectPath: string, framework: string, language: string) {
    return {
      content: [
        {
          type: 'text',
          text: 'Testing framework setup coming soon...'
        }
      ]
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AI Testing MCP server running on stdio');
  }
}

const server = new AITestingMCPServer();
server.run().catch(console.error);