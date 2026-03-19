# Backend Integration Tests

## Purpose

This directory contains backend integration tests that:

- Start a real Next.js server locally
- Send real HTTP requests
- Authenticate against the Supabase test environment
- Validate middleware behavior and HttpOnly cookies

These tests verify **end-to-end backend functionality**, not individual units.

---

## One-Time Setup

Install required dev dependencies:

```bash
npm install --save-dev start-server-and-test cross-env dotenv tough-cookie fetch-cookie
```
## Running Integration Tests

```bash
npm run test:integration
```

# Unit Testing

## Commands

* npm install  
    install mocha, c8, etc

* npx mocha  
    run all tests

* npm run test:coverage  
    run coverage

* npm run test:unit "test/path"
    run single test

```
# Coverage Report

```
--------------------------------|---------|----------|---------|---------|-------------------
File                            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------------------|---------|----------|---------|---------|-------------------
All files                       |   38.58 |    84.53 |   45.83 |   38.58 |
 demo-instructions              |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-199
 demo-instructions/update       |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-94
 feature-requests               |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-18
 feature-requests/[id]          |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-77
 feature-requests/[id]/comments |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-71
 feature-requests/[id]/vote     |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-77
 helper                         |     100 |    97.91 |     100 |     100 |
  appendDemoWebsite.js          |     100 |      100 |     100 |     100 |
  appendNotification.js         |     100 |      100 |     100 |     100 |
  appendVideo.js                |     100 |      100 |     100 |     100 |
  extractFields.js              |     100 |      100 |     100 |     100 |
  normalizeDemoWebArray.js      |     100 |    93.33 |     100 |     100 | 14
  postAsset.js                  |     100 |      100 |     100 |     100 |
 profiles                       |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-25
 profiles/[id]                  |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-60
 update-alerts-in-cs            |   67.39 |    85.71 |      50 |   67.39 |
  route.js                      |       0 |        0 |       0 |       0 | 1-30
  updateAndPublishAlert.js      |     100 |      100 |     100 |     100 |
 update-demo-web-in-cs          |   70.52 |     87.5 |   66.66 |   70.52 |
  deleteDemoWeb.js              |   97.36 |    88.88 |     100 |   97.36 | 74-75
  route.js                      |       0 |        0 |       0 |       0 | 1-54
  updateAndPublishDemoWeb.js    |     100 |      100 |     100 |     100 |
 update-video-library-in-cs     |   68.13 |    85.71 |      50 |   68.13 |
  route.js                      |       0 |        0 |       0 |       0 | 1-29
  updateAndPublishVideos.js     |     100 |      100 |     100 |     100 |
 upload-asset-to-cs             |   75.55 |       90 |      50 |   75.55 |
  route.js                      |       0 |        0 |       0 |       0 | 1-22
  uploadAndPublishAsset.js      |     100 |      100 |     100 |     100 |
 votes                          |       0 |        0 |       0 |       0 |
  route.js                      |       0 |        0 |       0 |       0 | 1-25
--------------------------------|---------|----------|---------|---------|-------------------
```

