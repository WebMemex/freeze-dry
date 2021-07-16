declare module 'flat-options' {
    export default function flatOptions<T extends Object>(options: Partial<T>, defaults: T): T
}
