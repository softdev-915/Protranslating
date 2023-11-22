# Mock SSO Login
For testing purposes of SSO Login a special front-end page was created that will simulate POST request from SAML service.

If you want documentation how to set up SSO in the app itself you can refer to [SSO Module Readme](../../../../app/components/sso/Readme.md)

## Usage
It is located at /mock-saml-redirect/:lspId/:companyId and accepts next query parameters:

* mockSSOSuccess: boolean - do we want to emulate success or failure, works only when mockSSO=true
* mockSSOEmail: email of the user that we want to login as. Not that it should be in the same lsp and id that we specified in :lspId and :companyId params at URL

Page contains single “Send mock SAML request” button.
After click, it sends POST request to SSO Login Callback as if it was external SAML Service.

Note that you still need to have useSSO flag enabled in the company settings for this to work, because this flag is checked even when mocking function. 

This mechanism skips request to external SSO, but tests next things:
* SSO settings can be found in the database by LSP id and Company id from url
* User gets correct data in session
* User gets correct token
* User gets redirected either to /home page in case of success and /login?samlError=${errorCode} in case of failure. 
