# Prototype Privacy Notice

SBlind is a development prototype and is not approved for collecting real customer information.

## Current behavior

- Form entries remain only in the running application session.
- The repository contains no backend, database, analytics integration, authentication system, or lead-delivery integration.
- Form entries are not transmitted by this prototype.
- Reloading or closing the application clears the in-memory entries.
- The browser stores only language and appearance preferences under `sblind.ui.v1`; no form entries or customer identifiers are stored there. Clearing site storage removes these preferences.

Use fictitious names, phone numbers, measurements, and appointment details during testing.

## Production gate

Before any public production deployment accepts real customer data, the project must add and document:

- A business-approved privacy notice and explicit collection purpose
- Secure transport, authenticated staff access, and least-privilege authorization
- Server-side validation and durable encrypted storage
- Retention, deletion, access, and incident-response procedures
- Approved third-party processors and data-sharing disclosures
- Separation between public intake and administrative views

This document describes the current prototype behavior; it is not a substitute for legal review of a production service.
