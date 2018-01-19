# Guides
This document contains some important guides for users and contributors alike.

## 1. How to?
This section tries to answer some of the basic _how to_ questions of the project.

## 1.1 How to setup webmemex-extension in your browser?

#### 1.1.1 Users
1. Clone this repo.
2. Get [Node/NPM] and [yarn](`npm install -g yarn`).
3. Run `make` to install dependencies and compile the source files.
4. Load it in Firefox or Chromium/Chrome:
    * In Firefox (≥49): run `npm run firefox` (or run [web-ext] directly for more control).
      Alternatively, go to `about:debugging`, choose 'Load Temporary Add-on', and pick
      `extension/manifest.json` from this repo.
    * In Chromium/Chrome: go to Tools→Extensions (`chrome://extensions`), enable 'Developer mode',
      click 'Load unpacked extension...', and pick the `extension/` folder from this repo.

#### 1.1.2 Contributors
It is recommended you read the contributors guide before you setup the extension.

##### Build and run it

1. Fork and Clone this repo.
2. Set upstream ```git remote add upstream git@github.com:webmemex/webmemex-extension```
3. Get [Node/NPM] and [yarn](`npm install -g yarn`).
4. Run `make` to install dependencies and compile the source files.
5. Load it in Firefox or Chromium/Chrome:
    * In Firefox (≥49): run `npm run firefox` (or run [web-ext] directly for more control).
      Alternatively, go to `about:debugging`, choose 'Load Temporary Add-on', and pick
      `extension/manifest.json` from this repo.
    * In Chromium/Chrome: go to Tools→Extensions (`chrome://extensions`), enable 'Developer mode',
      click 'Load unpacked extension...', and pick the `extension/` folder from this repo.

##### Keeping the fork updated

1. Fetching upstream ```git fetch upstream```
2. Merge the changes ```git merge upstream/master```
3. Push the updated branch ```git push origin master```

## 1.2 How to start contributing?
Got feedback, bug fixes, new features, tips? Want to help with coding, design, or communication?
Give a shout. 📢

Pop in on #webmemex on [Freenode], send a PR or open an issue on the [GitHub repo], or send me
([Gerben/Treora][Treora]) a message.

All code in this project is in the public domain, free from copyright restrictions. Please waive
your copyrights on any contributions you make. See e.g. [unlicense.org] for more information.


[Freenode]: http://webchat.freenode.net/
[GitHub repo]: https://github.com/WebMemex/webmemex-extension
[Treora]: https://github.com/Treora
[unlicense.org]: https://unlicense.org/

## 2. Contributors Guide
This section describes the contributors guide which will help excited contributors to know the project structure and help them set up their development environment easily.

#### 2.1 Unlicense
It is recommended that the contributors read about [Unlicense](http://unlicense.org/). It is assumed that once a contributor sends a pull request to the project he has read the terms and conditions of Unlicense and ready to publish their work in the public domain and waiving all the copyrights on the code.

#### 2.2 Linting
The project is equipped with [ESLint](http://eslint.org/). It is required of every contributor to run the linter before submitting a pull request so that the code follows the same styling guide. The linter can be run in 3 modes.
* Watch(```npm run watch```): Files being changed are linted immediately, and show the errors simultaneously
* Lint(```npm run lint```): Files changed are linted and the errors are shown
* Fix(```npm run lint-fix```): Removes any trivial errors in the code automatically

#### 2.3 Tests
The project has its own tests that use the testing framework [Jest](https://facebook.github.io/jest/). The tests are placed beside their corresponding ```src``` files. The project also consists of integration tests that are placed in the```tests``` directory. It is required of every contributor to run the testing suite before submitting a pull request so as to maintain the stability of the code. To run the testing suite.
* Test(```npm run test```): Run all the tests

#### 2.4 Building
After the desired changes have been made to the code, the code needs to be bundled. The build command can be run in 2 modes.
* Build(```npm run build```): Bundles all the files
* Watch(```npm run watch```): Bundles all the files simulataneously as the changes are made

#### 2.5 Changes
After the changes are made and the project is built successfully, it is required of the contributor to maintain the code coverage of the project. All the code being pushed should be tested by the contributor and the tests should be added to the correct file. It is also required that the contributor update any documentation that links to the changes made in the code.

#### 2.6 Sending a Pull Request
After the changes are introduced into the project, it is required of every developer to push their local changes into a branch other than ```master``` on their own fork of the project. It is required that the code being used to made the pull request is fully linted and tested.

#### 2.7 Continuous Integration
After a pull request is made to the project, the code is automatically linted and tested using the continuous integration pipeline service [Travis CI](https://travis-ci.org/). If the build fails, please rectify the errors in the code by clicking ```details``` at the bottom of the pull request. It will redirect you to the current build of the project and also show the errors.

## 3. Pull Requests and Issues
This section describes the basic guides of how to send Pull Requests and create Issues.

#### 3.1 Pull Requests
The pull request should be made to the ```master``` of ```git@github.com:WebMemex/webmemex-extension```. It is required by the contributor to have followed the contributor's guide and the build to be passing before the Pull Request is made. It is also expected that the contributor provides a detailed description as well as pictorial representation if any changes to the UI/UX is made.
A Work In Progress Pull Request can be made to the master only if more than a single contributor is working on the same issue. A Work in Progress Pull Requests must be specified in the title with a _[WiP]_ tag.
Please wait a day or two after the pull request has been made to contact the maintainer if no feedback is provided on the pull request. Be assured we will get back to you.

#### 3.2 Issues
The [issue list](https://github.com/WebMemex/webmemex-extension/issues) of the project is the place where all the current issues are present. Please maintain a modicum of decorum, we will get back to your issue as soon as possible. If possible, it is required that the user populate the issue with screenshots, console logs, or any other information that can come in handy for the maintainers to tackle the problem more efficiently.
