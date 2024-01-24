import { PluginObj, types } from '@babel/core';
interface ElementCount {
    total: number;
    style: number;
    className: number;
    files: string[];
}
interface PluginState {
    opts: {
        globalState: Record<string, Record<string, ElementCount>>;
    };
    filename: string;
    localCounts: Record<string, ElementCount>;
}
export default function ({ types: t }: {
    types: typeof types;
}): PluginObj<PluginState>;
export {};
