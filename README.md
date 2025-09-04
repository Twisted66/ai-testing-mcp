# AI Testing MCP Server

An AI-powered testing automation MCP server for Claude Code that provides TestSprite-like functionality.

## Features

### Core Testing Tools
- **Code Analysis**: Analyze project structure and identify testable components
- **Test Generation**: AI-powered unit, integration, and E2E test generation
- **Test Execution**: Run tests with framework auto-detection
- **Results Analysis**: Intelligent test result analysis with fix suggestions
- **Framework Setup**: Initialize testing frameworks in projects

### Supported Languages & Frameworks
- **JavaScript/TypeScript**: Jest, Mocha, Vitest
- **Python**: Pytest
- **Go**: Built-in testing
- **Frameworks**: React, Vue, Express, FastAPI, Flask

## Installation

1. Clone or create the project:
```bash
git clone <repo> ai-testing-mcp
cd ai-testing-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

## Configuration

### For Claude Code
Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "ai-testing": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/absolute/path/to/ai-testing-mcp"
    }
  }
}
```

## Usage

Once configured, you can use these tools in Claude Code:

### 1. Analyze Codebase
```
Use the analyze_codebase tool on my project at /path/to/project
```

### 2. Generate Unit Tests
```
Generate unit tests for src/utils.js using Jest framework
```

### 3. Run Tests
```
Run all tests in my project with coverage
```

### 4. Analyze Test Results
```
Analyze these test failures and suggest fixes: [paste test output]
```

## Available Tools

### `analyze_codebase`
- **Purpose**: Scan project structure, detect languages/frameworks, find API endpoints
- **Input**: `projectPath` - Path to project directory
- **Output**: JSON with language, framework, API endpoints, testable components

### `generate_unit_tests`
- **Purpose**: Create unit tests for functions/components
- **Input**: 
  - `filePath` - File to test
  - `functionName` - Specific function (optional)
  - `testFramework` - Framework to use
- **Output**: Generated test code

### `generate_integration_tests`
- **Purpose**: Create API endpoint tests
- **Input**: 
  - `projectPath` - Project directory
  - `apiSpec` - API documentation (optional)
- **Output**: Integration test code

### `run_tests`
- **Purpose**: Execute tests with auto-detection
- **Input**: 
  - `projectPath` - Project directory
  - `testPattern` - Specific tests to run (optional)
  - `framework` - Force specific framework (optional)
- **Output**: Test results with coverage

### `analyze_test_results`
- **Purpose**: Analyze test output and provide insights
- **Input**: `testOutput` - Raw test results
- **Output**: Analysis with suggestions

### `suggest_fixes`
- **Purpose**: Generate fix suggestions for failing tests
- **Input**: 
  - `failureOutput` - Test failure output
  - `sourceCode` - Source code (optional)
  - `testCode` - Test code (optional)
- **Output**: Suggested fixes

### `setup_testing_framework`
- **Purpose**: Initialize testing in a project
- **Input**: 
  - `projectPath` - Project directory
  - `framework` - Testing framework
  - `language` - Programming language
- **Output**: Setup instructions/files

## Example Workflow

1. **Analyze your project**:
   ```
   Use analyze_codebase on ./my-app
   ```

2. **Generate tests for a component**:
   ```
   Generate unit tests for src/components/Button.jsx using Jest
   ```

3. **Run the generated tests**:
   ```
   Run tests in ./my-app matching *Button*
   ```

4. **Fix any failures**:
   ```
   Analyze these test failures and suggest fixes: [paste output]
   ```

## Benefits Over Manual Testing

- **Speed**: Generate comprehensive test suites in seconds
- **Coverage**: Automatically identifies all testable components
- **Intelligence**: AI-powered test case generation with edge cases
- **Integration**: Works with existing test frameworks and CI/CD
- **Analysis**: Intelligent failure analysis with fix suggestions

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Adding New Features
The server is modular - add new tools by:
1. Adding tool definition to `ListToolsRequestSchema` handler
2. Adding tool implementation to `CallToolRequestSchema` handler
3. Creating helper methods as needed

## Comparison to TestSprite

| Feature | TestSprite | AI Testing MCP |
|---------|------------|----------------|
| Test Generation | ✅ | ✅ |
| Multi-language | ✅ | ✅ |
| Cloud Execution | ✅ | Local |
| IDE Integration | ✅ | ✅ (via Claude Code) |
| Cost | Subscription | Free |
| Customization | Limited | Full source access |

## License

MIT