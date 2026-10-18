# SBlind — Specialist Blinds mobile demo

Expo / React Native / TypeScript prototype based on the local `specialist-blinds-estimator` web demo. This is a separate project; the web version is untouched.

## Run locally

```bash
git clone https://github.com/sadbeto/SBlind.git
cd SBlind
npm ci
npm start
```

Open the QR code with Expo Go on a compatible phone, or press `w` for a browser preview (`npm run web`). Android and iOS native UI must still be checked on devices. No store build or remote deployment is configured.

## Current flow

Four short screens with persistent bottom navigation: project and area, goal and product, optional measurements and service, then a tentative visit/contact. Each selection remains a conventional click-to-open dropdown, with the suggested products ordered first. Back preserves all answers; Next validates only the current required section; optional measurements can be skipped. The final screen reviews the brief before saving to the in-memory demo inbox.

The real horizontal Specialist wordmark and Beto's circular `specialistlogo.png` badge are bundled locally. The badge is also used for app icons and web favicon.

The example prices and time windows are **not approved live business data**. No API, reservation, persistence, authentication, WhatsApp, or lead delivery exists. Do not enter real personal information; the inbox exists only in the current app session. Product selection, validation, and calculation live in `src/domain.ts`; UI lives in `App.tsx`.

## Verify

```bash
npm test
npm run typecheck
npx expo export --platform web --output-dir dist
npx expo export --platform android --output-dir dist-android
```

GitHub Actions runs the tests, TypeScript checks, Expo validation, a web export,
dependency review, and CodeQL analysis. See `SECURITY.md` for vulnerability
reporting and `PRIVACY.md` for the prototype data-handling boundary.

## Approved direction

This is the selected mobile-first frontend for the Specialist project. It remains a development prototype, accessible through its web export; native store distribution is not required for the initial customer flow.

Target: customer submits on the website -> HTTPS request to an EC2-hosted API -> server-side validation and processing -> durable storage in a private S3 bucket -> approved business notification -> manual forwarding to sales staff. GitHub stores source; hosting and AWS infrastructure are planned but not connected or deployed. No production integration is implemented yet.

The EC2 service will use an IAM role with least-privilege S3 access; the client will not contain AWS credentials or receive general bucket access. See `docs/aws-backend.md` for the planned security boundary.

Keep original customer data authoritative. Automated processing may summarize notes but must not invent measurements, prices or confirmed bookings. Customer intake and a future authenticated staff dashboard must be separate.

Next checkpoint: define the submission contract and durable backend, then replace the in-memory save with a real submission acknowledgement. Approve business pricing and availability before displaying them as live data. AWS provisioning, Vercel deployment and actual WhatsApp sends remain separate approval steps.
