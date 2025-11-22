
# Testing

## Commands

* npm install  
    install mocha, c8, etc

* npx mocha  
    run all tests

* npm run test:coverage  
    run coverage

* npm run test:unit "test/path"
    run single test

# Test Summary

```
deleteDemoWeb()
  ✔ updates and publishes the entry successfully
  ✔ returns update error from Contentstack when update fails
  ✔ returns publish error details when publish fails
  ✔ should return an error when entryUid is missing
  ✔ should return an error when entryUid is empty string
  ✔ should return an error when demos is missing
  ✔ should return an error when demos is not an array
  ✔ should return an error when demos is undefined

updateAndPublishDemoWeb()
  ✔ updates and publishes successfully
  ✔ returns error when update fails
  ✔ returns error when publish fails
  ✔ returns 500 if exception thrown

updateAndPublishAlert()
  ✔ updates and publishes alerts successfully
  ✔ returns error if update fails
  ✔ returns error if publish fails
  ✔ returns 500 on thrown exception

updateAndPublishVideos()
  ✔ updates and publishes videos successfully
  ✔ returns error when update fails
  ✔ returns error when publish fails
  ✔ returns 500 on thrown exception

uploadAndPublishAsset()
  ✔ uploads and publishes an asset successfully
  ✔ returns error if upload fails
  ✔ returns error if upload succeeds but no UID returned
  ✔ returns error if publish fails
  ✔ returns 500 on thrown exception

appendDemoWebsite()
  ✔ appends a new demo to simplified existing demos
  ✔ returns only the new demo if entry has no demos

appendNotification()
  ✔ returns only the new alert when entry has no alerts
  ✔ normalizes existing alerts and appends the new one
  ✔ handles invalid or non-array alerts gracefully
  ✔ does not mutate the original entry or existing alerts

appendVideo()
  ✔ returns simplified existing videos + new video
  ✔ handles missing videos array
  ✔ does not mutate original entry

extractFields()
  ✔ extracts only specified fields
  ✔ extracts asset UID when field is an object with .uid
  ✔ keeps raw primitive values (string/number/etc)
  ✔ skips null, undefined, and empty-string fields
  ✔ always includes date_posted if present
  ✔ supports multiple array elements
  ✔ does not mutate the original items
  ✔ returns an empty object when no fields match
  ✔ returns an empty array when input array is empty

normalizeDemoWebArray()
  ✔ returns an empty array when input is not an array
  ✔ converts image objects into UID strings
  ✔ preserves link objects exactly
  ✔ preserves date_posted when present
  ✔ fills missing link/title fields safely
  ✔ handles multiple demos and preserves order
  ✔ removes unexpected fields automatically
  ✔ handles demos with image null or missing image field

postAsset()
  ✔ POSTs the asset and returns JSON response (40ms)
  ✔ returns null if fetch throws
  ✔ returns null if response is not ok

54 passing (113ms)
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

