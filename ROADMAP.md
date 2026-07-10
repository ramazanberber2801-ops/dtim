# Yasaflow – Roadmap

This roadmap contains future product phases and later work. Current implementation status belongs in `PROJECT_STATUS.md`, while `TODO.md` contains only the next concrete tasks.

## Owner-created onboarding — current phase

The owner creates and configures organizations from Owner Dashboard V2.

Current goals:

- Complete the “Opprett organisasjon” flow.
- Preserve organization editing and the admin invitation flow.
- Configure deployment links, modules, hosting, status and provisioning state.
- Keep all customers on the shared Yasaflow GitHub codebase.

Standard and sponsored organizations may have separate Vercel and Supabase projects when needed. They must not have customer-specific GitHub repositories.

## Public self-service onboarding — later phase

After Owner Dashboard V2 is complete, organizations should be able to start onboarding through a public portal.

Later capabilities may include organization registration, admin onboarding, module and theme selection, deployment preferences and onboarding progress.

## Owner Dashboard V2

Planned completion areas:

- Organization creation and selection.
- Deployment links for Live App, Vercel and Supabase.
- Complete module library.
- Hosting mode and organization status.
- Provisioning timeline.
- Improved owner overview after the core flows are stable.

## yasaflow.com public website

Design and build the public Yasaflow website after Owner Dashboard V2 is complete.

The website should later support product information, customer examples, module overview, contact or sales entry points and access to public onboarding.

## Customer admin portal

Each organization should have an admin experience for managing its own content and operations.

Planned areas include news, activities, push notifications, members, donations, calendar, chat, branding and settings.

## Payments and packages

Payments and package definitions are postponed until the core platform is stable.

Possible providers to evaluate later:

- Lemon Squeezy.
- Paddle.
- Stripe.

Possible package concepts:

- Free.
- Basic.
- Pro.
- Enterprise.

No provider or package structure is final.

## Automated provisioning

Later automation may include:

- Vercel project setup where required.
- Supabase project setup where required.
- Environment variables.
- Domain and subdomain configuration.
- Publish and readiness status.

## Future modules and ideas

Potential future modules and ideas should remain here until they become concrete near-term tasks.

Examples include additional membership features, communication tools, integrations, reporting and organization-specific extensions.
