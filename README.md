---
name: "Semantic Table Weaver"
description: "Reorganises semantic information into tables that can be examined, compared and reused."
categories: [interactive-learning-objects, web-app, built-by-ai, powered-by-ai]
updated: 2026-07-16
deployments:
  Appsite:
    "Semantic Table Weaver": https://tabweaver.edutools.fyi/
---
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1hsU4suL9cqm2qq00tINWG5Sh7NKhKnya

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Enter your own Gemini API key in the page when you want to process a table. No environment key is used.
3. Run the app:
   `npm run dev`


## Independent static hosting

Use Node 22.18 or newer. Run `npm ci`, `npm test`, `npm run typecheck` and `npm run build`. The `dist/` directory can be hosted on Cloudflare Pages with build command `npm run build` and output directory `dist`; no server or build-time API key is needed.

Enter your own Gemini API key in the page to process text or image tables. The key stays in this tab; Clear key removes it. Existing saved tables and imported JSON remain available without a key. Requests go directly to the Gemini API and use your API account. Publishing and changing the existing address remain separate release steps.
