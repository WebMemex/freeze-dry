interface MutableProxy<T extends object> {
    setTarget(newTarget: T): void,
    setHandler(newHandler: typeof Reflect): void,
    getTarget(): T,
    getHandler(): typeof Reflect,
    proxy: T,
}

declare module 'mutable-proxy' {
    export default function mutableProxyFactory<T extends object>(defaultTarget: T): MutableProxy<T>
}
