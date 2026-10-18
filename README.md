# GEA Group AU — Cloudflare Pages live mirror (starter)

This repository provides a **basic live reverse proxy** of the main `https://geagroupau.com` website at a Cloudflare Pages project URL, e.g. `https://geagroupau.pages.dev` (if available).

## Deploy using GitHub

1. Create a new GitHub repository and upload the contents of this ZIP **at the repository root** (`functions/`, `public/`, and `README.md`).
2. In Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git, select the repository.
3. Framework preset: **None**. Build command: **leave blank**. Build output directory: **`public`**.
4. Deploy. Open the `*.pages.dev` URL assigned by Cloudflare.

## What it does

- Proxies the main site's requests to `https://geagroupau.com` in real time.
- Preserves request paths and query strings.
- Rewrites same-origin HTTP redirects back to the mirror host.
- Does **not** forward authentication cookies or authorization headers; intended for public site content.

## Important limitations

- It does not mirror other subdomains, such as `files.geagroupau.com`.
- It does not rewrite absolute links embedded in HTML, CSS, or JavaScript. Links may navigate to the original domain.
- It is **not suitable as-is** for Nextcloud, login-protected apps, WebDAV, uploads, or WebSockets.
- Content Security Policy, caching, upstream bot protection, and Cloudflare request limits can affect operation.
- Obtain administrator approval for access under managed-network filtering policies.
- If you see the placeholder page, check the Pages Functions deployment and project root.

To change the upstream domain, edit `ORIGIN` in `functions/_middleware.js`.
