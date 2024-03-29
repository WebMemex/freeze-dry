/**
 * For most of the freeze-drying functionality, the {@link freezeDry} function is all you need. Its
 * behaviour can be {@link FreezeDryConfig | configured} through its `options` parameter.
 *
 * For slightly more control, you can use the {@link FreezeDryer} class directly (`freezeDry` is a
 * simple convenience wrapper around it).
 *
 * For still more advanced customisation needs, freeze-dry exposes many of its internal classes and
 * functions, that you could use to build your own `freezeDry`-ish function.
 *
 * Note that these exposed internals are not a stable API, and may be updated in future versions
 * once typical usage patterns and needs become clear.
 *
 * The {@link Resource} and {@link Link} abstractions help deal with links and subresources of web
 * pages. Several utility functions are available too.
 *
 * @module
 */

/**
 * The {@link freezeDry} function is exported both as `default` and as a named export, to work
 * nicely with both `import` (ES modules) and `require` (CommonJS):
 * ```
 * import freezeDry from 'freeze-dry';
 * const { freezeDry } = require('freeze-dry');
 * ```
 *
 * @category Main
 */
export { freezeDry as default } from './freeze-dry'
export * from './freeze-dry'

export * from './resource'
export * from './util'

export * from './types'
