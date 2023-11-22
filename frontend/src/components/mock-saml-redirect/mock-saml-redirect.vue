<template>
  <form :action="`/api/auth/ssoCallback/${lspId}/${companyId}?&mockSSOSuccess=${mockSSOSuccess}&mockSSOEmail=${mockSSOEmail}`" method="post">
    <input hidden value="MockSAMLRequest" name="SAMLRequest" />
    <button type="submit" data-e2e-type="mock-saml-request-button">Send mock SAML request</button>
  </form>
</template>

<script src="./mock-saml-redirect.js"></script>
