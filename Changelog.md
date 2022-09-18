# Changelog for freeze-dry

## 1.0.0 (2022-09-18)

- Call it good enough.

## 0.3.0 (2022-07-19)

- Support extensive customisation.
- Export internals: Resource classes, Link types, and utility functions.
- Support iframes with `srcdoc` attribute.
- Add browser-based tests using Playwright.
- Write documentation

## 0.2.5 (2021-07-16)

- Fix failure on invalid itemProp/itemType attributes.
- Support bringing your own globalThis (for e.g. use in JSDOM)
- Provide TypeScript declarations (whole codebase is TS now)

## 0.2.4 (2019-06-04)

- Fix tiny but fatal error in previous release.

## 0.2.3 (2019-06-04)

- Presumptively put a `<meta charset="utf-8">` declaration in the snapshot by default; while adding
  the charsetDeclaration option for choosing another value. (solves issue #29)
- Keep/make links within the document (e.g. `<a href="#top">`) relative. (solves issue #40)
- Fix choking on invalid URLs (solves issue #41)

## 0.2.2 (2019-01-27)

- Allow passing a custom fetchResource function.
- Solve error that appeared when installing with yarn.
- Take steps towards being usable as a plain ES module.

## 0.2.1 (2018-10-04)

- Parse CSS properly; and now also recursively crawl through `@import` rules.
- Add Memento-style metadata to note a snapshot's provenance.
- Add a timeout option to limit the time spent fetching subresources.

## 0.2.0 (2018-07-19)

Near-complete rewrite.
- Separate the process into steps of (1) capturing DOM state, (2) crawling subresources,
  (3) tweaking the DOM and (4) compiling everything into a single string. Designed with
  future extensibility, configurability & code reusability in mind.
- Now also capture content inside iframes, recursively.
- Add integration test with an example page.
- Add explanations in Readme files.
- Add inline documentation that vaguely resembles jsdoc.

## 0.1.3 (2018-06-27)
- Fix missing dependency

## 0.1.2 (2018-05-18)

- Stop adding a `<base href="...">` tag; make URLs absolute instead (except for within-document
  links). (solves issues #4, #5, #6)
- Keep the document's `<!DOCTYPE ...>` declaration. (commit bfdcba9)
- Remove URLs appearing before the Content Security Policy `<meta>` tag.

## 0.1.1 (2018-02-19)

- Stop inlining a stylesheet `<link>` using `<style>`; just use a data URL as href. (solves issue
  #17)

## 0.1.0 (2017-07-14)

- First release, of the code factored out from [webmemex-extension](https://github.com/WebMemex/webmemex-extension)
