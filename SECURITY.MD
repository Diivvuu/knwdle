# Security Policy

## Supported Versions
Security fixes apply only to the latest `main` branch.

---

## Reporting a Vulnerability

Please **do not** open a public GitHub issue.

Instead, contact the maintainer privately:

- Email: security@knwdle.com (or your personal email temporarily)
- Or use GitHub’s private vulnerability reporting feature (if enabled)

Include:

- Description of the issue  
- Steps to reproduce  
- Potential impact  
- Logs/screenshots if possible  

We will:

1. Acknowledge the report quickly  
2. Investigate the issue  
3. Work on a patch  
4. Coordinate responsible disclosure  

---

## Scope
Covers:

- API  
- Web apps  
- Shared packages  
- Scripts & tooling  

Does NOT cover:

- Your custom hosting setups  
- Third-party tools (AWS, Zoho, etc.)  

---

## Recommendations for Self-Hosting
- Use strong JWT/database/SMTP secrets  
- Enable HTTPS  
- Restrict admin URLs using firewall/VPN  
- Use a secrets manager (AWS SSM, Secrets Manager, Vault)  