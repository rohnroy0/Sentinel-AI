# Security Policy

## Supported Versions

Currently, Sentinel-AI is in an initial MVP stage.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Sentinel-AI, please do not disclose it publicly. Instead, submit a report privately via GitHub Security Advisories or contact the repository owner directly. We will investigate all legitimate reports and address them in a timely manner.

## Safe Configuration Practices

- **Never commit secrets**: Do not commit your `.env` file, API keys, passwords, or tokens to the repository.
- **Environment Variables**: Use `.env` (which is ignored by Git via `.gitignore`) for all configuration variables. An `.env.example` file is provided for reference.
- **Private Data**: Do not commit real vulnerability scans, database files (`investigations.db`), or private network logs. Use the `demo_data/` directory for safe dummy scans.
- **Frontend Security**: API keys should never be hardcoded or stored in the browser's `localStorage` or `sessionStorage`. All API communication requiring authentication must be handled server-side.
