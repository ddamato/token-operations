import { commands } from './commands.js';

let processRegistry;

/**
 * Processes a collection of tokens to complete found operations.
 * 
 * @param {Object} tokens - A collection of tokens.
 * @returns {Object} - The updated collection with operations completed.
 */
export function processOperations(tokens) {
    processRegistry = new Map();
    const clone = structuredClone(tokens);
    traverse(null, clone);
    return clone;
}

/**
 * Executes a single operation.
 * 
 * @param {Array<String|Number>} operation - An operation entry.
 * @param {Object} context - Completed operations stored at $index.
 * @returns {String|Number} - The result of the completed operation.
 * 
 * @example (['Number.parseInt', 'ff', '$0'], { $0: 16 }) -> 255
 */
export function executeOperation(operation, context = {}) {
    
    const [commandReference, ...args] = operation;
    const fn = getCommand(commandReference);

    if (typeof fn !== 'function') return operation;
    const result = fn(...args.map((arg) => arg in context ? context[arg] : arg));

    if (fn === commands.Import.operations) {
        // operation expects nested operation result to execute
        return executeOperations(result, context?.$value);
    }
    return result;
}

/**
 * Executes the set of operations for a token.
 * 
 * @param {Array} operations - A set of operation entries.
 * @param {String|Number} $value - The value of the current token.
 * @param {Object} tokens - The collection of all tokens within the file; used to resolve aliases.
 * @returns {String|Number} - The result of completed operations.
 */
function executeOperations(operations, $value, tokens = {}) {
    let idx;
    return operations.reduce((completed, operation, index) => {
        idx = `$${index}`;
        const resolved = Array.isArray(operation)
            ? executeOperation(operation, completed)
            : resolveAlias(operation, tokens);
        return { ...completed, [idx]: resolved }
    }, { $value })[idx];
}

/**
 * Determines which function to call for an operation.
 * 
 * @param {String} commandReference - A reference to an function to complete an operation.
 * @returns {Function} - The function to call.
 */
function getCommand(commandReference) {
    const [prototype, reference] = commandReference.split('.');
    return prototype && reference && commands?.[prototype]?.[reference];
}

/**
 * Gets the resolved value of a token; commonly found at $value.
 * 
 * @param {String} path - A dot-notation path to a token.
 * @param {Object} tokens - Collection of all tokens to resolve aliases or operations.
 * @returns {String|Number} - A resolved value.
 */
function getValue(path, tokens) {
    const { $value } = resolvePath(path, tokens);
    return resolveAlias($value, tokens);
}

/**
 * Determines if given token should be skipped in processing.
 * 
 * @param {Object} token - A single token entry.
 * @returns {Boolean} - Determines if this entry should be skipped.
 */
 function isToken(token) {
    // Only attempt to process token entries which may include $value or $operations
    if (typeof token !== 'object') return;
    // Only attempt to process token entries with a primitive $value entry
    if ('$value' in token) return typeof token.$value !== 'object';
    // If no $value, process $operations array for $value
    return Array.isArray(token.$operations);
}

/**
 * Gets the resolved value from a given value, which might be an alias.
 * 
 * @param {String|Number} value - The $value of a token, which might be an alias.
 * @param {Object} tokens - Collection of all tokens to resolve aliases or operations.
 * @returns {String|Number} - A resolved value. 
 */
function resolveAlias(value, tokens) {
    const re = /\{([^}]+)\}/;
    if (re.test(value)) {
        const [, alias] = re.exec(value) || [];
        if (alias) {
            if (processRegistry.get(alias)) {
                throw new Error(`Looping operational path at: ${alias}.`);
            }
            const { $operations } = resolvePath(alias, tokens) || {};
            return $operations ? resolveOperations(alias, tokens) : getValue(alias, tokens);
        }
        console.warn(`Unresolved alias at: ${value}`);
    }
    return value;
}

/**
 * Completes the operations at a given token, which may include resolving dependent aliases or operations.
 * 
 * @param {String} path - A dot-notation path to a token including $operations 
 * @param {Object} tokens - Collection of all tokens to resolve aliases or operations.
 * @returns {String|Number} - The final value after operations are completed, to be assigned at $value.
 */
function resolveOperations(path, tokens) {
    const { $operations } = resolvePath(path, tokens);

    let value = getValue(path, tokens);

    // if operations have not been executed
    if ($operations && !processRegistry.has(path)) {
        processRegistry.set(path, true);
        value = executeOperations($operations, value, tokens);
        processRegistry.set(path, false);
    }

    return value;
}

/**
 * Returns the value inside the object at the given path.
 * 
 * @param {String} - A dot-notation path.
 * @param {Object} - A collection to traverse.
 * @returns {*} - The value found at the end of the given path.
 */
function resolvePath(path, tree) {
    return path.split('.').reduce((obj, ref) => obj && obj[ref], tree);
}

/**
 * Walks the collection of tokens, looking for $operations to resolve.
 * 
 * @param {String} path - A dot-notation path.
 * @param {Object} tree - A collection to traverse.
 * @returns {Undefined}
 */
function traverse(path, tree) {
    const entry = path ? resolvePath(path, tree) : tree;
    if (!entry || typeof entry !== 'object') return;
    Object.entries(entry).forEach(([name, token]) => {
        const target = [path, name].filter(Boolean).join('.');
        if (isToken(token)) {
            token.$value = resolveOperations(target, tree);
            return;
        }
        return traverse(target, tree);
    });
}
