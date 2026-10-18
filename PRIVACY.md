# Prototype Privacy Notice

SBlind is a development prototype and is not approved for collecting real customer information.

## Current behavior

- Form entries remain only in the running application session.
- The repository contains no backend, database, analytics integration, authentication system, or lead-delivery integration.
- Form entries are not transmitted by this prototype.
- Reloading or closing the application clears the in-memory entries.

Use fictitious names, phone numbers, measurements, and appointment details during testing.

## Production gate

Before any public production deployment accepts real customer data, the project must add and document:

- A business-approved privacy notice and explicit collection purpose
- Secure transport, authenticated staff access, and least-privilege authorization
- Server-side validation and durable encrypted storage using an EC2-hosted API and a private S3 bucket
- An EC2 IAM role with least-privilege S3 access and no AWS credentials in the client
- Retention, deletion, access, and incident-response procedures
- Approved third-party processors and data-sharing disclosures
- Separation between public intake and administrative views

This document describes the current prototype behavior; it is not a substitute for legal review of a production service.
