# SSO Module

This module allows users to login via external SSO (Single Sign-On) service if one is set up for company. After redirect back from this service Portal checks that data is correct by making request to service from backend gives user tokens to work with at frontend.

## How to set up

First, you need SSO service itself. [OneLogin](https://www.onelogin.com/) is one of them, you can register here and get free 30 days access to test integration manually.

From you SSO Provider you need two things:
* Certificate - certificate from Provider that can be used to verify requests
* Issuer metadata url - endpoint where Portal will check data before giving token to user.
* SAML 2.0 Endpoint - endpoint where Portal will redirect user to login after typing email and choosing LSP.

> If you are testing it locally, I suggest using [ngrok](https://ngrok.com) to tunnel your local connection to outer internet because SSO Service need a way to access it. Note that ngrok should be pointed to frontend app.

After getting this link, you can create/edit company where you need to enable SSO:
1. Check "useSSO" checkbox in the SSO section.
2. Paste Certificate (without BEGIN and END parts), Issuer Metadata and Saml 2.0 Endpoint into correct fields.
3. Copy Consumer URL link from company settings and paste it into Consumer URL field at the SSO side. This is url where user will be redirected by POST request after login.
4. Save settings both on SSO and Company settings side.

Now all contacts from company you added settings to will be redirected to external service to login, then redirected back to verify data from SSO service and receive token on Portal side.

If you need to mock SSO Service you can refer to [mock-saml-redirect readme](../../../frontend/src/components/mock-saml-redirect/Readme.md)
