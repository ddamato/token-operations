import { proxy } from './proxy.js';

let processRegistry;

export function executeOperation(operation, context = {}) {
    if (!Array.isArray(operation)) {
        // operation is a static value, return as-is
        return operation;
    }
    const [operationReference, ...args] = operation;
    const fn = getOperation(operationReference);
    const result = fn(...args.map((arg) => arg in context ? context[arg] : arg));

    if (fn === proxy.Import.operations) {
        // operation expects nested operation result to execute
        return executeOperations(result, context?.$value);
    }
    return result;
}

function executeOperations(operations, $value) {
    let idx;
    return operations.reduce((completed, operation, index) => {
        idx = `$${index}`;
        return { ...completed, [idx]: executeOperation(operation, completed) }
    }, { $value })[idx];
}

function getOperation(operationReference) {
    const [prototype, reference] = operationReference.split('.');
    if (proxy[prototype]) {
        return proxy[prototype][reference];
    }
    return Function.prototype;
}

function getValue(path, tokens) {
    let { $value } = resolvePath(path, tokens);

    const re = /\{([^)]+)\}/;
    if (re.test($value)) {
        const [, alias] = re.exec($value) || [];
        if (alias) {
            if (processRegistry.get(alias)) {
                throw new Error(`Looping operational path at: ${path}.`);
            }
            const { $operations } = resolvePath(alias, tokens)
            if ($operations) {
                return resolveOperations(alias, tokens);
            }
            return getValue(alias, tokens);
        }
        console.warn(`Unresolved alias at: ${alias}`);
    }
    return $value;
}

function resolveOperations(path, tokens) {
    const { $operations, $value } = resolvePath(path, tokens);

    // if operations have not been executed
    if (!processRegistry.has(path)) {
        processRegistry.set(path, true);
        const value = executeOperations($operations, getValue(path, tokens));
        processRegistry.set(path, false);
        return value;
    }

    return $value;
}

function resolvePath(path, tree) {
    return path.split('.').reduce((obj, ref) => obj && obj[ref], tree);
}

function traverse(path, tree) {
    const entry = path ? resolvePath(path, tree) : tree;
    if (!entry || typeof entry !== 'object') return;
    Object.entries(entry).forEach(([name, token]) => {
        const target = [path, name].filter(Boolean).join('.');
        if (token.$value && token.$operations) {
            token.$value = resolveOperations(target, tree);
            return;
        }
        return traverse(target, tree);
    });
}

export default function tokenOperations(tokens) {
    const clone = structuredClone(tokens);
    processRegistry = new Map();
    traverse(null, clone);
    return clone;
}