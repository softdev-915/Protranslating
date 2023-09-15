# Cloud Storage Bucket

A set of adhoc tests to guarantee files sync with AWS and GCS bucket.

## How does this work?

Test hits different endpoints using superagent to create a new request and upload files.

As white box test, it includes the AWS & GCS Bucket manager to check files are being synced as expected.

## How to run the suite?

Using mocha with the following required flags, in example:

```
GCS_BUCKET="INSERT_GCS_BUCKET_NAME_HERE" \
GCS_KEY_FILE="INSERT_GCS_CONFIG_FILE_PATH_HERE" \
AWS_S3_KEY="INSERT_AWS_KEY_HERE" \
AWS_S3_SECRET="INSERT_AWS_SECRET_HERE" \
AWS_S3_BUCKET="pts-lms-test-files" \
APP_URL="http://localhost:8080" \
E2E_USER="e2e@sample.com" \
E2E_PASS="INSERT_USER_PASS_HERE" \
mocha
```

The expected output should be similar to the following:

```
  AWS Upload Tests
    Authenticate
      ✓ POST /auth Initializes the proper login strategy (4727ms)
      ✓ GET /auth/me Returns the current user
    Create Request
      ✓ POST /api/lsp/:lsp/company Upsert Company named AWSBucketTestCompany
      ✓ GET /api/lsp/:lsp/company Obtain "AWSBucketTestCompany" company id (101ms)
      ✓ POST /api/lsp/:lsp/document-prospect Upload delta.txt document prospect
      ✓ POST /api/lsp/:lsp/document-prospect Upload alpha.txt document prospect
      ✓ POST /api/lsp/:lsp/request/ Create Request (1554ms)
      ✓ AWS Download delta.txt (source file) file from Bucket (767ms)
      ✓ AWS Download alpha.txt source file from Bucket (789ms)
      ✓ AWS List alpha.txt file versions and delete markers from Bucket (927ms)
    Delete Source File delta.txt (source file) from Request
      ✓ PUT /api/lsp/:lsp/request/:request Update Request marking delta.txt file as removed (1004ms)
      ✓ AWS Check unable to download delta.txt (source file) from Bucket (838ms)
      ✓ AWS List delta.txt file versions and markers from Bucket (760ms)
    Add Workflow and Upload final files
      ✓ GET /api/lsp/:lsp/user/provider Obtain one provider (88ms)
      ✓ POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect (38ms)
      ✓ PUT /api/lsp/:lsp/request/:request Update Request create workflow (63ms)
      ✓ PUT /api/lsp/:lsp/request/:request Update Request adding beta.txt final file to workflow (805ms)
      ✓ AWS Download beta.txt final file from Bucket (796ms)
    Add Workflow and Upload task files
      ✓ POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect
      ✓ PUT /api/lsp/:lsp/request/:request Update Request adding Quote task to workflow (68ms)
      ✓ PUT /api/lsp/:lsp/request/:request Update Request adding non final file to workflow Quote task (854ms)
      ✓ AWS Download gamma.txt task file from Bucket (782ms)
    Delete Task File gamma.txt (non final file) from Quote Task
      ✓ PUT /api/lsp/:lsp/request/:request Update Request deleting non final file to workflow Quote task (802ms)
      ✓ AWS Check unable to download gamma.txt (non final file attached to task) from Bucket (734ms)
      ✓ AWS List gamma.txt file versions and delete markers from Bucket (742ms)
    Delete Task File beta.txt (final file) from Validation and Delivery Task
      ✓ PUT /api/lsp/:lsp/request/:request Update Request deleting beta.txt task final file from Validation and Delivery task (819ms)
      ✓ AWS Check unable to download beta.txt (final file attached to task) from Bucket (711ms)
      ✓ AWS List beta.txt file versions and delete markers from Bucket (797ms)
    Upload files again (beta.txt and gamma.txt) to existing tasks
      ✓ POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect again
      ✓ POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect again
      ✓ PUT /api/lsp/:lsp/request/:request Update Request reuploading files to tasks (1820ms)
    Delete Provider Tasks Containing files
      ✓ PUT /api/lsp/:lsp/request/:request Update Request deleting Provider Tasks containing non final files (829ms)
      ✓ AWS Check unable to download gamma.txt (non final file attached to task) from Bucket (758ms)
      ✓ AWS List gamma.txt file versions and delete markers from Bucket (820ms)
      ✓ PUT /api/lsp/:lsp/request/:request Update Request deleting provider tasks containing final files (see documents removed) (906ms)
      ✓ AWS Check unable to download beta.txt (final file attached to task) from Bucket (741ms)
      ✓ AWS List beta.txt file versions and delete markers from Bucket (746ms)
    Upload files again (beta.txt and gamma.txt) to existing tasks and create Provider Tasks again
      ✓ POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect again (38ms)
      ✓ POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect again
      ✓ PUT /api/lsp/:lsp/request/:request Update Request reuploading files to tasks (1692ms)
    Delete Tasks Containing files
      ✓ PUT /api/lsp/:lsp/request/:request Update Request deleting Tasks containing files (see documents removed) (3926ms)
      ✓ AWS Check unable to download gamma.txt (non final file attached to task) from Bucket (716ms)
      ✓ AWS List gamma.txt file versions and delete markers from Bucket (788ms)
      ✓ AWS Check unable to download beta.txt (final file attached to task) from Bucket (795ms)
      ✓ AWS List beta.txt file versions and delete markers from Bucket (730ms)
    Upload files again (beta.txt and gamma.txt) and create tasks again
      ✓ POST /api/lsp/:lsp/document-prospect Upload beta.txt document prospect again
      ✓ POST /api/lsp/:lsp/document-prospect Upload gamma.txt document prospect again
      ✓ PUT /api/lsp/:lsp/request/:request Update Request reuploading files to tasks (1686ms)
    Delete Workflow containing files (and set status as cancelled)
      ✓ PUT /api/lsp/:lsp/request/:request Update Request deleting Workflow containing files (see documents removed) (810ms)
      - AWS Check unable to download gamma.txt (non final file attached to task) from Bucket
      - AWS List gamma.txt file versions and delete markers from Bucket
      ✓ AWS Check unable to download beta.txt (final file attached to task) from Bucket (731ms)
      ✓ AWS List beta.txt file versions and delete markers from Bucket (767ms)
    Execute Document Retention Scheduler
      ✓ GET PUT /api/lsp/:lsp/scheduler List all Schedulers and find Document Retention
      ✓ PUT /api/lsp/:lsp/scheduler Run Document Retention Scheduler
      ✓ GET /api/lsp/:lsp/scheduler/:scheduler Wait for Scheduler to finish (20319ms)
      ✓ AWS Check unable to download gamma.txt (non final file attached to task) from Bucket (729ms)
      ✓ AWS List gamma.txt file versions and delete markers from Bucket (754ms)
      ✓ AWS Check unable to download alpha.txt (source file attached to request) from Bucket (1006ms)
      ✓ AWS List alpha.txt file versions and delete markers from Bucket (2530ms)
      ✓ AWS Check unable to download beta.txt (final file attached to task) from Bucket (746ms)
      ✓ AWS List beta.txt file versions and delete markers from Bucket (768ms)
  AWS Upload Summary
    Request Id:  5b46b7e88837873b8a5ed51a


  60 passing (1m)
  2 pending

```
