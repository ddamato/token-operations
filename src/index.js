const proxy = {
    Math: {
        ...Math,
        parseInt: parseInt,
        add: (...args) => args.reduce((total, num) => total + Number(num), 0),
        multiply: (...args) => args.reduce((total, num) => total * Number(num), 0)
    },
    String: {
        ...String,
        concat: (joiner, ...args) => args.join(joiner),
        match: (str, rgx) => {
            const result = str.match(rgx);
            return result?.length ? result[1] : '';
        }
    },
    Import: {
        operations: async (path, ...args) => {
            try {
                const json = await import(path);
                const operations = JSON.parse(json);
                if (!Array.isArray(operations)) throw new Error(`import is not Array: ${path}`);
                return args.concat(operations);
            } catch (err) {
                throw new Error(err);
            }
        }
    }
}

let processRegistry;

function executeOperation(store, operation) {
    if (!Array.isArray(operation)) {
        return operation;
    }
    const [operationReference, ...args] = operation;
    const inputs = args.map((arg) => arg in store ? store[arg] : arg);
    let value = getOperation(operationReference)(...inputs);

    if (operationReference === 'Import.operation') {
        return execute(value, store.$value);
    }
    return value;
}

function execute(operations, $value) {
    let idx;
    return operations.reduce((completed, operation, index) => {
        idx = `$${index}`;
        return { ...completed, [idx]: executeOperation(completed, operation) }
    }, { $value })[idx];
}

function executeOperations(path, tokens) {
    const { $operations, $value } = getPath(path, tokens);

    // if operations have not been executed
    if (!processRegistry.has(path)) {
        processRegistry.set(path, true);
        const value = execute($operations, getValue(path, tokens));
        processRegistry.set(path, false);
        return value;
    }

    return $value;
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
        const [, alias] = re.exec($value) || [];
        if (alias) {
            if (processRegistry.get(alias)) {
                throw new Error(`Looping operational path at: ${path}. Terminating process.`);
            }
            const { $operations } = getPath(alias, tokens)
            if ($operations) {
                return executeOperations(alias, tokens);
            }
            return getValue(alias, tokens);
        }
        console.warn(`Unresolved alias at: ${alias}`);
    }
    return $value;
}

function traverse(path, tree) {
    const target = path ? getPath(path, tree) : tree;
    if (!target || typeof target !== 'object') return;
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