# Changelog for freeze-dry

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
