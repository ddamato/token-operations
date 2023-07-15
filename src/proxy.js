import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const cachedImports = new Map();

function createProxy(context, fallback) {
    return new Proxy(context, {
        get(target, prop) {
            return Reflect.get(target, prop) || fallback(prop);
        }
    })
}

export const proxy = {
    Math: createProxy({
        parseInt,
        add(...args) { 
            return args.reduce((total, num) => total + Number(num), 0)
        },
        multiply(...args) {
            return args.reduce((total, num) => total * Number(num), 1)
        }
    }, (prop) => Reflect.get(Math, prop)),
    String: createProxy({
        join(joiner, ...args) {
            return args.join(joiner)
        },
        capture(str, rgx, flag) {
            const result = str.match(new RegExp(rgx, flag));
            return result?.length && ~result.index ? result[1] : '';
        }
    }, (prop) => (str, ...args) => Reflect.get(String.prototype, prop).call(str, ...args)),
    Import: createProxy({
        operations(path, ...args) {
            if (!cachedImports.has(path)) {
                try {
                    const operations = require(path);
                    if (!Array.isArray(operations)) throw new Error(`import is not Array: ${path}`);
                    cachedImports.set(path, operations);
                } catch (err) {
                    throw new Error(err);
                }
            }
            return args.concat(cachedImports.get(path));
        }
    }, () => Function.prototype),
}
