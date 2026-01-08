# How to Contribute

Thanks for your interest in contributing to `Hyperfabric MCP Server`! Here are a few
general guidelines on contributing and reporting bugs that we ask you to review.
Following these guidelines helps to communicate that you respect the time of the
contributors managing and developing this open source project. In return, they
should reciprocate that respect in addressing your issue, assessing changes, and
helping you finalize your pull requests. In that spirit of mutual respect, we
endeavor to review incoming issues and pull requests within 10 days, and will
close any lingering issues or pull requests after 60 days of inactivity.

Please note that all of your interactions in the project are subject to our
[Code of Conduct](/CODE_OF_CONDUCT.md). This includes creation of issues or pull
requests, commenting on issues or pull requests, and extends to all interactions
in any real-time space e.g., Slack, Discord, etc.

## Reporting Issues

Before reporting a new issue, please ensure that the issue was not already
reported or fixed by searching through our [issues
list](https://github.com/jim-coyne/hyperfabric_MCP/issues).

When creating a new issue, please be sure to include a **title and clear
description**, as much relevant information as possible, and, if possible, a
test case.

**If you discover a security bug, please do not report it through GitHub.
Instead, please see security procedures in [SECURITY.md](/SECURITY.md).**

## Development Setup

To set up your development environment:

1. **Prerequisites**
   - Node.js 18 or higher
   - npm or yarn package manager
   - Git

2. **Clone the repository**
   ```bash
   git clone https://github.com/jim-coyne/hyperfabric_MCP.git
   cd hyperfabric_MCP
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment**
   - Copy `.env.example` to `.env`
   - Add your Hyperfabric API credentials

5. **Build the project**
   ```bash
   npm run build
   ```

## Sending Pull Requests

Before sending a new pull request, take a look at existing pull requests and
issues to see if the proposed change or fix has been discussed in the past, or
if the change was already implemented but not yet released.

We expect new pull requests to include tests for any affected behavior, and, as
we follow semantic versioning, we may reserve breaking changes until the next
major version release.

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Update documentation as needed
   - Add tests if applicable

3. **Test your changes**
   ```bash
   npm run build
   npm test
   ```

4. **Commit your changes**
   - Use clear, descriptive commit messages
   - Reference any related issues

5. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Describe your changes** in the pull request
   - Explain what you've changed and why
   - Link to any relevant issues
   - Include screenshots if applicable

## Code Style Guidelines

- **TypeScript**: Follow standard TypeScript conventions
- **Formatting**: Use the project's existing formatting style
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex logic
- **Types**: Maintain strong typing, avoid `any` when possible

## Testing

When adding new features or fixing bugs, please include tests:

- Test new tool implementations
- Test error handling paths
- Test edge cases

## Other Ways to Contribute

We welcome anyone that wants to contribute to `Hyperfabric MCP Server` to triage and
reply to open issues to help troubleshoot and fix existing bugs. Here is what
you can do:

- Help ensure that existing issues follows the recommendations from the
  _[Reporting Issues](#reporting-issues)_ section, providing feedback to the
  issue's author on what might be missing.
- Review and update the existing content of our
  [Wiki](https://github.com/jim-coyne/hyperfabric_MCP/wiki) with up-to-date
  instructions and code samples.
- Review existing pull requests, and testing patches against real existing
  applications that use `Hyperfabric MCP Server`.
- Write a test, or add a missing test case to an existing test.
- Improve documentation and examples
- Report bugs and suggest features

Thanks again for your interest on contributing to `Hyperfabric MCP Server`!

:heart:
