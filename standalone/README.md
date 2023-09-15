# Standalone script

This script creates a new clean volatile environment that can be used to test e2e, migrations.

## How to use 

To simply run a clean cluster run

```sh
./run-adhoc-server.sh
```

But you can use this script to run e2e by passing the `lms-e2e` project folder like this

```sh
./run-adhoc-server.sh ~/workspace/protranslating/lms-e2e
```

You can further configure the e2e run by passing the following variables

`E2E_PARALLEL_MAX` defines the amount of workers to execute in parallel
`E2E_BROWSER` defines the e2e browser to run the e2e

For instance, you can run the e2e test with headless chrome like this

```sh
E2E_PARALLEL_MAX=3 E2E_BROWSER=invisiblechrome ./run-adhoc-server.sh ~/workspace/protranslating/lms-e2e
```

In OSX, curl seems to fail validating ssl certificates eventhought the `-k` option is present, I've tried to install `curl` with `openssl` as well as `wget` but both solution failed.
