import { resolve } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

require('json5/lib/register');

const cachedImports = new Map();

/**
 * Creates a proxy for a category of operations so custom functions can be added.
 * 
 * @param {Object} handlers - Collection of custom functions to support common patterns.
 * @param {Function} fallback - The handler to catch extended usage or noop.
 * @returns {Proxy} - A proxy to catch the prop getter and route function.
 */
function createProxy(handlers = {}, fallback = Function.prototype) {
    return new Proxy(handlers, {
        get(target, prop) {
            return Reflect.get(target, prop) || fallback(prop);
        }
    })
}

export const commands = {

    Math: createProxy({
        add(...args) { 
            return args.reduce((total, num) => total + Number(num), 0)
        },
        multiply(...args) {
            return args.reduce((total, num) => total * Number(num), 1)
        }
    }, (prop) => Reflect.get(Math, prop)),

    Number: createProxy({

    }, (prop) => Reflect.get(Number, prop)),

    String: createProxy({
        capture(str, rgx, flag) {
            const result = str.match(new RegExp(rgx, flag));
            return result?.length && ~result.index ? result[1] : '';
        }
    }, (prop) => (str, ...args) => Reflect.get(String.prototype, prop).call(str, ...args)),

    Import: createProxy({
        operations(filepath, ...args) {
            if (!cachedImports.has(filepath)) {
                let operations;
                try {
                    operations = require(resolve(filepath));
                } catch (err) {
                    operations = require(filepath);
                }
                if (!Array.isArray(operations)) throw new Error(`import is not Array: ${filepath}`);
                cachedImports.set(filepath, operations);
            }
            return args.concat(cachedImports.get(filepath));
        }
    }, () => Function.prototype),
}
