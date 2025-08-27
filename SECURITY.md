# Security

- Never commit `.env` or secrets. Secrets are ignored via `.gitignore`.
- Rotate any leaked keys immediately. Document rotations in `BUILD_LOG.md`.
- Outbound calls to NWS must set `NWS_USER_AGENT` or fail fast.
- Dependencies must be kept up to date and scanned in CI (to be added in CI workflows).
