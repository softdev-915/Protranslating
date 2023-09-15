# Culture
This file enumerates a list of rules to follow for which we do not have an automated check. It is crucial that we follow these:

# Definition of done

After your PR is merged you are responsable of the following.

# LMS-E2E PR

  Make sure that your code passes before stating "done".

# LMS-SPA PR

  Make sure that all the app tests pass. If you find out that the number of failing tests is greater than the number of failing tests in the previous suite state

    # Pull the changelog.log and the e2e-changelog.log files
    # Ping those that have pushed code lately in the two projects to collectively either fix the issues or reverting the changes.

Ask for PR merging only if you:

  # Can be available once the suite finishes running (2 hours currently)
  
  # Can be available to fix the failing tests or reverting the breaking changes.

  # Cannot be available, but you find a partner that can do the above.

In any other case you must state "DO NOT MERGE" in the team PR channel to make sure no merge happens.

# Working on tickets

  # Software Developer Training Guideline: 
  
    https://docs.google.com/document/d/1xBqhzANJiFHJKwEQjbMlfU_F3_cYOda3KMiRc3wXCeI/edit#heading=h.dn4fqy189fuc

# About e2e tests

  - Each e2e test  must run in less than 5 minutes and therefore you might need to divide your test. When you divide your test you must ensure that the setup for each of them will not interefere with each other (While we use conventions like ticket ID in front of entities created for e2e tests, be aware of multiple files for the same ticket).

  - e2e specs should not be rewritten but fixed.

  - If an e2e is changed then that e2e has an lms-XX identifier that needs to be used to locate the JIRA ticket 

  - Build *only* idempotent tests: A test that is guaranteed to assert functionality correctness independently of the current state of the data set. Do not assume, build everything your test needs from scratch and request the product owner to make the necessary adjustments in the e2e specification before you deviate from what is written in there.

  - HTML attributes like data-e2e-type are used for e2e purposes.

  - Do not make decisions without including POs

# General

- A Daily meeting happens every day. The objective of this meeting is to understand if there is any issue stopping you from going at your regular pace. Other members of the team can help so speak up. This does not mean that you cannot have an issue and communicate at any time.

- Google Hangouts and Google Drive documents are at the core of our collaboration but code reviews in bitbucket are as important.

- Any LMS entity has to appear in the Menu Search as well as next to any select widget that manages such entity, as well as in Swagger API definition.

- Any field added to an entity should be available in the corresponding grid for selection and should be present in Swagger API definition.

- Default grid columns should be specified per MMF. Do not show them all by default. If the defaults are not specified please ask the Product Owner because it is a mistake on their side.

- The following fields are mandatory for all entities: lsp_id, inactive(deleted), created_on, updated_on, deleted_on, restored_on, created_by and updated_by, deleted_by. restored_by.

- Never ever check for group in code. Always check for role. If the Product owner speaks about groups, fight back explaining that specifications need to be written based on roles and not groups. The groups are an artifact for the LMS users. It allows them to group permissions but LMS code must not be aware of those. Groups can come and go. Migrations for groups are OK because they simplify the job for Operations.

- All form editable entities (meaning a user can edit them using the frontend application) must check the readDate before executing any updates. If the readDate coming from the client is older than the one stored in the server a 409 must be returned with the refreshed entity from de database stored in status.data. Check ConcurrencyReadDateChecker at app/utils/concurrency/index.js to see more details.

- Every time you add/modify a component of the application, make sure it works and looks nice on mobile devices. (You can use Chrome device emulator)

- Adding others people code into your branch
  * When you create a PR you are responsible for it 100%
  * As a general rule do not merge into your branch things that you don't understand
  * Always ask, until each and everyone of the changes you are importing makes sense to you because you need to be able to respond for them. Otherwise cherrypick only the ones you understand
  * Test very carefully after merging others people code and ensure the app is working before requesting the merge to master

- Prefer CSS classes over ids.

- Use framework classes to control elements visibility and placement on different screen breakpoints:
  * https://v4-alpha.getbootstrap.com/layout/grid/
  * https://v4-alpha.getbootstrap.com/layout/responsive-utilities/
  * https://hackerthemes.com/bootstrap-cheatsheet/

- Before adding CSS code:

 * Do a quick research to confirm the CSS framework you are using doesn''t have already cover what you are trying to accomplish. (For instance, p-0 is a class from Bootstrap to add padding: 0 on any element, and h-100 is a class for height 100% )

- When thinking about the look and feel of the UI, make sure you follow these rules:

 * Fat finger rule: Buttons and every element that the user can "tap" into, must have a minimum height of 44px, so that the target of the finger can actually hit that when a user is interacting with it.

 * Real estate: Don't abuse of padding on main containers. You want to take advantage of every pixel of the available screen space.

 * Air: Make sure you add enough vertical space between elements.

 * Native select elements are prohibited. Always use custom selects.

- Developers must stay away from using copyleft license libraries.

- Use the logger component for writing log messages in the API methods, this helps us to track down issues and fixing bugs.
