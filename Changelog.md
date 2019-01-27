# Changelog for freeze-dry

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
