declare module 'memoize-weak' {
    export default function memoize<T extends Function>(fn: T): T
}
