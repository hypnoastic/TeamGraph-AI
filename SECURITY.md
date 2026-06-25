# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in TeamGraph AI, **do not open a public issue**.

Please report it privately using one of the following methods:

1. **GitHub Security Advisories**: Use the "Report a vulnerability" button on the Security tab of this repository.
2. **Email**: Contact the maintainers directly at the email listed in the repository profile.

## Supported Versions

| Version | Supported |
|---------|-----------|
| master  | ✅        |

## Security Architecture

- **Authentication**: Session tokens are hashed before storage. API keys are stored as bcrypt hashes.
- **Authorization**: Role-based access control with admin/member separation. Members cannot approve context or manage teams.
- **Data Isolation**: Organizations and projects are isolated via foreign key constraints and query-level filtering.
- **Secrets**: All credentials are loaded from environment variables. No secrets should be committed to the repository.
- **Graphiti Integration**: LLM calls are isolated behind a service wrapper with graceful degradation to approved-context-only search.

## Known Considerations

- Connector integrations (Slack, GitHub, Drive, Notion) are placeholder-only and do not store real OAuth tokens in production.
- The MCP CLI stores API keys locally in a config file; users should protect this file with appropriate filesystem permissions.
