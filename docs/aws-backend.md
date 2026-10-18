# Planned AWS backend

SBlind's production backend is planned around two AWS services:

- Amazon EC2 runs the API, server-side validation, business logic, and queued processing.
- Amazon S3 provides durable object storage for approved intake records or generated artifacts.

This infrastructure is not deployed from this repository yet.

## Data flow

```text
SBlind client
  -> HTTPS request
  -> EC2 API
  -> server-side validation and authorization
  -> private S3 bucket
  -> approved downstream business notification
```

The client must not receive general-purpose AWS credentials or write directly to the bucket. If direct uploads are introduced later, the EC2 API must issue short-lived, object-specific presigned URLs after validating the request.

## Required production controls

### EC2

- Use an EC2 instance role with least-privilege access to only the required S3 bucket and object prefix.
- Do not store AWS access keys in source code, environment files committed to Git, or the client bundle.
- Require IMDSv2 and restrict instance metadata access.
- Terminate HTTPS at an approved AWS ingress or hardened reverse proxy; do not expose the application port broadly.
- Restrict security-group ingress to the required HTTPS path and use Systems Manager Session Manager instead of public SSH where practical.
- Keep the operating system and application dependencies patched.
- Send application and security logs to CloudWatch without logging full customer submissions or secrets.
- Store runtime secrets in AWS Secrets Manager or SSM Parameter Store SecureString.

### S3

- Enable Block Public Access at both account and bucket levels.
- Disable public ACLs and public bucket policies.
- Encrypt objects at rest with SSE-S3 or SSE-KMS; use TLS in transit.
- Grant the EC2 role only the minimum bucket actions and prefix access required.
- Enable versioning and define retention/deletion lifecycle rules approved by the business.
- Log and alert on unexpected access; consider CloudTrail data events when real customer information is stored.
- Configure CORS narrowly only if a browser upload flow is explicitly approved.

## Production gate

Before real customer information is accepted, verify the deployed EC2 role, S3 bucket policy, Block Public Access, encryption, TLS, logging, backup/recovery behavior, retention rules, and deletion workflow. The public intake interface and any staff/admin interface must remain separate.
