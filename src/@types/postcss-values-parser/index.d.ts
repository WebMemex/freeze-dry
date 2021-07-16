// Incomplete and probably flawed declaration; just enough to cover our usage.

declare module 'postcss-values-parser' {
    export namespace postcssValuesParser {
        interface Node {
            nodes: Node[];
            type: string;
            value: string;
            toString(): string;
            walk(callback: (node: Node) => any): void;
        }
    }

    export default function postcssValuesParser(cssValue: string):
        { parse(): postcssValuesParser.Node };
}
