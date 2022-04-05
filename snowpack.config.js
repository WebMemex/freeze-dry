/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    'test/example-website': { url: '/', static: true },
    'src': { url: '/freeze-dry' },
  },
  packageOptions: {
    polyfillNode: true,
  },
  devOptions: {
    port: 3000,
  },
};
