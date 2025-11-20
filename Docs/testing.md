
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

## Tests

-  updateAndPublishAlert()
    *  updates and publishes alerts successfully  
    *  returns error if update fails  
    *  returns error if publish fails  
    *  returns 500 on thrown exception  

-  updateAndPublishDemoWeb()  
    *  updates and publishes successfully  
    *  returns error when update fails  
    *  returns error when publish fails  
    *  returns 500 if exception thrown  

-  updateAndPublishVideos()  
    *  updates and publishes videos successfully  
    *  returns error when update fails
    *  returns error when publish fails  
    *  returns 500 on thrown exception  

-  uploadAndPublishAsset()  
    *  uploads and publishes an asset successfully  
    *  returns error if upload fails  
    *  returns error if upload succeeds but no UID returned  
    *  returns error if publish fails  
    *  returns 500 on thrown exception  

-  appendDemoWebsite()  
    *  appends a new demo to simplified existing demos  
    *  returns only the new demo if entry has no demos  

-  appendNotification()  
    *  returns only the new alert when entry has no alerts  
    *  normalizes existing alerts and appends the new one  
    *  handles invalid or non-array alerts gracefully  
    *  does not mutate the original entry or existing alerts  

-  appendVideo()  
    *  returns simplified existing videos + new video  
    *  handles missing videos array  
    *  does not mutate original entry  

-  extractFields()  
    *  extracts only specified fields  
    *  extracts asset UID when field is an object with .uid  
    *  keeps raw primitive values (string/number/etc)  
    *  skips null, undefined, and empty-string fields  
    *  always includes date_posted if present  
    *  supports multiple array elements  
    *  does not mutate the original items  
    *  returns an empty object when no fields match  
    *  returns an empty array when input array is empty  

-  postAsset()  
    *  POSTs the asset and returns JSON response (62ms)  
    *  returns null if fetch throws  
    *  returns null if response is not ok  


38 passing (127ms)


## Coverage
<table>
<thead>
<tr>
  <th>File</th><th>% Stmts</th><th>% Branch</th><th>% Funcs</th><th>% Lines</th><th>Uncovered</th>
</tr>
</thead>
<tbody>

<tr><td>All files</td>
<td><span style="color:#DAA520;">35.06</span></td>
<td><span style="color:#DAA520;">82.19</span></td>
<td><span style="color:#DAA520;">40.9</span></td>
<td><span style="color:#DAA520;">35.06</span></td>
<td></td></tr>

<tr><td>demo-instructions/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-199</td></tr>

<tr><td>demo-instructions/update/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-94</td></tr>

<tr><td>feature-requests/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-18</td></tr>

<tr><td>feature-requests/[id]/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-77</td></tr>

<tr><td>feature-requests/[id]/comments/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-71</td></tr>

<tr><td>feature-requests/[id]/vote/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-77</td></tr>

<tr><td>helper/appendDemoWebsite.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>helper/appendNotification.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>helper/appendVideo.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>helper/extractFields.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>helper/postAsset.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>profiles/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-25</td></tr>

<tr><td>profiles/[id]/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-60</td></tr>

<tr><td>update-alerts-in-cs/updateAndPublishAlert.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>update-demo-web-in-cs/updateAndPublishDemoWeb.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>update-video-library-in-cs/updateAndPublishVideos.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>upload-asset-to-cs/uploadAndPublishAsset.js</td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td><span style="color:#0c0;">100</span></td>
<td></td></tr>

<tr><td>upload-asset-to-cs/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-8</td></tr>

<tr><td>votes/route.js</td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td><span style="color:#c00;">0</span></td>
<td>1-25</td></tr>

</tbody>
</table>
