# Debugging

This document serve as a guide for finding and fixing issues in the app. Anyone is welcome to contribute.

# Video that shows how to debug two simple issues following these instructions

https://drive.google.com/file/d/1ovmFKox2Qc4wKuwcbC-vWuvaIRutq3xm/view

So there's an issue you need to fix, now what?

# Basic preliminary checkings

Are you running the proper branch?
  If the issue is on the master branch,
    make sure your working directory is clean (git status) and
    run git pull first to make sure you have the latest changes

Is the app running :) ? (backend server and frontend application)

Is the db server running?

# Issue is in the code

  # Replicating the issue

  First thing you want to have is the list of steps to replicate the problem, this is extremely important 
  to make sure that the issue is fixed after providing a patch: If you are not able to replicate it you won't be able to confirm that is fixed


  If there are too many steps in this list, I suggest you to write it down:

  You could follow a structure similar to an e2e spec:

    Login with ..
    Go to ..
    Enter value 'abc' in field 'xyz'
    Expected:
    Got: 

  # Identify where the issue comes from (Frontend or Backend, or both)

    Sometimes this is clear, sometimes it's not. It's hard to generalize a process to find out this but here are some hints:

    In the browser:

        Open the inspector and click the network tab,
        Clear out all the requests from the console,
        Follow the steps to replicate,
        If you see new requests in the list you will have to debug the backend for sure,
        If not, the issue is clearly in the frontend

  # Isolate the files
  
  The issue is somewhere in the code, we want to be sure to have the list of all the files that are involved in the process so we can find the issue faster;

  If you are not familiared with the code, there is a simple technique:

    "Search and debug"

    Frontend files:

      Vue dev tools: this extension will show the components hierarchy, you should be able to identify the components by name and then finding them in the code

      If this is not enough:
        Open the chrome dev tools,
        Look at the Elements tab,
        Locate a single element in the screen (a button or input),
        Look at a particular attribute (id, data-e2e-type or class)
        then look for it in the code
      
      Once you find a file, you can easily find the related files, imported components, libraries and helpers

    Backend files:

      Open the chrome dev tools,
      Go to the network tab
      Clear all the requests
      Follow the steps to replicate
      Look at all the requests (if any) that were generated within the process, pick the url of each one, those urls are endpoints
      Go to the code and search for each url, 
      You will find matches in index.js files, those files contain swagger definitions of endpoints,
      From there you can locate controllers, apis, helpers and related schemas

  # Now we start with the debugging:

    The main idea here is to identify the "code flow" and adding breakpoints to the files that are part of it, For ex;

      Request starts in the frontend,
          Fill up form,
          Click button "Save",
            This button calls a method in the vuejs component,
              this method calls another function from a service
                this service creates a resource and makes a http request to the backend

      the backend receives the request,
        middlewares get executed
          roles are checked
            the controller function is executed
              the related api function is executed
                schema methods and db calls are executed

      Once you identify this, you know where to put the breakpoints

  # Debugging

    Frontend:
      
      Instead of console.logs you can use debugger; calls in the code that allow you to see if functions are getting called, inspecting parameters and data, etc;

      If the issue is more data related you can use Vue dev tools to inspect the state of the components

    Backend:

      You can use node-inspector together with Chrome

  # Debugging techniques

  1. Basics

        Environment checking (is db server running / is app server running / are you in the correct branch?

  2. Scenario:  There's a regression and you want to find what broke it

      git diff master path/to/file 
      or 
      git diff master

  3.  Scenario: A field becomes 0 or empty or null or whatever and you don't know what is the code causing it

      a. Search for all the code lines that modify that field and comment them out, 

          run the test case and enabling them back one by one until you find it

  4.  Scenario: A particular component in the UI doesn't have the expected state (is disabled, it's hidden, etc)

      a. Locate the component and all the logic conditions related to it (computed properties, v-if / v-show ). 
          If you are able to trace down the whole logic related you will be able to find the issue

  5. Scenario: It works some times
      
      Scenario: The same code works for a piece of data A but it doesn't for another piece of data B

      Run a diff between A and B and start checking the logic related to each field that is different