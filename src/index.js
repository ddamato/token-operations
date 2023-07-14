import proxy from './proxy.js';

let processRegistry;

function executeOperation(store, operation) {
    if (!Array.isArray(operation)) {
        return operation;
    }
    const [operationReference, ...args] = operation;
    const inputs = args.map((arg) => arg in store ? store[arg] : arg);
    return getOperation(operationReference)(...inputs);
}

function executeOperations(path, tokens) {
    const token = getPath(path, tokens);

    // if operations have not been executed
    if (!processRegistry.has(path)) {
        processRegistry.set(path, true);
        let idx;
        
        const _store = token.$operations.reduce((steps, operation, index) => {
          idx = `$${index}`;
          return { ...steps, [idx]: executeOperation(steps, operation) }
        }, { $value: getValue(path, tokens) });

        processRegistry.set(path, false);
        return _store[idx];
    }
    
    return token.$value;
}

function getOperation(operationReference) {
    const [prototype, reference] = operationReference.split('.');
    if (proxy[prototype] && reference in proxy[prototype]) {
        return proxy[prototype][reference];
    }
    return Function.prototype;
}

function getPath(path, tree) {
    return path.split('.').reduce((obj, ref) => obj && obj[ref], tree);
}

function getValue(path, tokens) {
    let { $value } = getPath(path, tokens);

    const re = /\{([^)]+)\}/;
    if (re.test($value)) {
        const [, refPath] = re.exec($value) || [];
        if (refPath) {
            if (processRegistry.get(refPath)) {
                throw new Error(`Looping operational path at: ${path}. Terminating process.`);
            }
            const { $operations } = getPath(refPath, tokens)
            if ($operations) {
                return executeOperations(refPath, tokens);
            }
            return getValue(refPath, tokens);
        }
        console.warn(`Unresolved path at: ${path}`);
    }
    return $value;
}

function traverse(path, tree) {
    const target = path ? getPath(path, tree) : tree;
    Object.entries(target).forEach(([name, token]) => {
        const concat = [path, name].filter(Boolean).join('.');
        if (token.$value && token.$operations) {
            token.$value = executeOperations(concat, tree);
            return;
        }
        return traverse(concat, tree);
    });
}

export default function tokenOperations(tokens) {
    const clone = structuredClone(tokens);
    processRegistry = new Map();
    traverse(null, clone);
    return clone;
}