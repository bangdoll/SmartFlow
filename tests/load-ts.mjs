import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

export function loadTS(file, dependencies = {}, globals = {}) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    const compiled = { exports: {} };
    const require = name => {
        assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
        return dependencies[name];
    };
    new Function('require', 'module', 'exports', ...Object.keys(globals), outputText)(
        require, compiled, compiled.exports, ...Object.values(globals),
    );
    return compiled.exports;
}
