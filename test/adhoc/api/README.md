# API Tests

## Refactor endpoints


### Method

Create a request and copy its JSON response on mocks folder
Create a test pointing to that specific URL and compare it's same as JSON response
Refactor the method freely and iterate using this tests
Advantage see a clear comparison between API response fields added and missing

### Usage

```
#!/bin/bash
APP_URL=http://localhost:8080 \
E2E_USER=e2e@sample.com \
E2E_PASS=INSERT_PASS_HERE \
mocha
```

### Structure


```
.
├── README.md
├── mocks
│   └── expected-response-1.js
└── test
    ├── list.js
    └── mocha.opts
```
