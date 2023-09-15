# Commit message guidelines

## Setup

Set up the commit message template

```
git config commit.template .gitmessage
```

# Commit guidelines
The ideal commit must:

* Have lms ticket number LMS-XYZ
* Have a Google Task title if present
* Have `what` and `why` in commit description
* Have a concise description which if inserted in a sentence should read like:
  `If applied, this commit will <commit message>`

Commit message template can be found at [.gitmessage](.gitmessage) file

Format of a commit message that can be considered a "developer release note":
```
({tickerNumber}) {developerTask} because {developerWhy}
```

Commit message examples:

```
(LMS-79) si connections must include the locationId;

because:

Otherwise the connection is not done to the correct LSP
and therefore data will not be pushed productively from Portal into SI
```

**ALL COMMIT MESSAGES MUST BE IN IMPERATIVE MOOD IN THE SUBJECT LINE**
```
BAD: added, refactored, fixed
GOOD: add, refactor, fix
```

Don't be afraid to make long details commit descriptions if nessesary.

# Pull Request guidelines

Each PR must:

* Have JIRA link
* Include a title that provides a one sentence overview of the purpose of the PR(with the JIRA ticket number LMS-XYZ). Abbreviations can be used when necessary
* Contain a description written using complete sentences of the changes being made and any context necessary to understand them.

Bitbucket will automatically generate such description if all commits are according to the guidelines above
* Has video/images attachments, if nessesary
* Explicitly state when the feedback is needed. A prefix of "WIP-” indicates that PR is not ready for review yet

# Feedback loops

1. Make a feature branch out of lms-spa and another out of lms-e2e. With your_initials/lms_number (eg. ik/lms99)

2. Create a WIP Branch out of your feature branch. Branch name should be your_initials/lms_branch_number-wip(eg. ik/lms99-wip)
  Create a WIP PR of your WIP branch against the feature branch.
  Ask developers for approval.
  When PR is approved merge:
  
  NOTE: in example here `ik/lms99` is feature branch and `ik/lms99-wip` is a wip branch
  ```
    export FEATURE_BRANCH=ik/lms99
    export WIP_BRANCH=ik/lms99-wip
  ```
  ```
    git checkout ik/lms99
    git merge ik/lms99-wip
  ```

  Daily pull new changes from the master.
  ```
    git checkout master
    git pull
    git checkout $FEATURE_BRANCH
    git merge master
    git checkout $WIP_BRANCH
    git rebase -i $FEATURE_BRANCH # -i is iteractive and will show you all of your commit done so far
  ```

**IMPORTANT**: make sure you branch is up to date with master and have no conflicts.

3. Commit daily to your branches. Work on lms-e2e and lms-spa at the same time (in parallel) so that you assert the implementation as you provide the solution.

4. Update daily the IT Daily Tracker with your progress on spa and e2e projects. The spa progress is measured on dev servers by the PO. The e2e progress is measured by the dev. Progress is measured in number of words completed per day meaning implemented in spa or implemented in e2e. Make sure to keep the e2e-spec and the comments in the e2e implementation JS file in sync with the help of the PO.

5. Contact the Product Owner (PO) of your ticket in order to keep the progress daily.

6. Present the solution from a dev server.

7. When the PO approves your feedback loop tell the developers that they should review your WIP PR (see point K).

8. Once the last e2e has been implemented, and the last WIP PR approved, create a final PR from your feature branch PRs (lms-e2e and lms-app) and share the links with the team in hangouts to wait for official approval. Only two senior developers can approve but all developers are welcome to review

9. Make corrections based on developers' feedback from your WIP or final PR as soon as you can

10. Wait for Nestor to merge into master

11. Check that the application has been released and that the e2es have all passed:
    1. Released: http://udesktop1.protranslating.com:8080/#/streams/release.log
    2. Deployed in test: http://udesktop1.protranslating.com:8080/#/streams/gke-deploy.log
    3. Assert the version from portal test: https://lms-test.protranslating.com/api/version
    4. Check that e2es passed for that version: http://udesktop1.protranslating.com:3000/reports/

12. Create WIP or no WIP PRs from your branches as needed to correct tests or the app