import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const cachedImports = /* @__PURE__ */ new Map();
function createProxy(context, fallback) {
  return new Proxy(context, {
    get(target, prop) {
      return Reflect.get(target, prop) || fallback(prop);
    }
  });
}
const proxies = {
  Math: createProxy({
    add(...args) {
      return args.reduce((total, num) => total + Number(num), 0);
    },
    multiply(...args) {
      return args.reduce((total, num) => total * Number(num), 1);
    }
  }, (prop) => Reflect.get(Math, prop)),
  Number: createProxy({}, (prop) => Reflect.get(Number, prop)),
  String: createProxy({
    join(joiner, ...args) {
      return args.join(joiner);
    },
    capture(str, rgx, flag) {
      const result = str.match(new RegExp(rgx, flag));
      return result?.length && ~result.index ? result[1] : "";
    }
  }, (prop) => (str, ...args) => Reflect.get(String.prototype, prop).call(str, ...args)),
  Import: createProxy({
    operations(path, ...args) {
      if (!cachedImports.has(path)) {
        try {
          const operations = require(path);
          if (!Array.isArray(operations))
            throw new Error(`import is not Array: ${path}`);
          cachedImports.set(path, operations);
        } catch (err) {
          throw new Error(err);
        }
      }
      return args.concat(cachedImports.get(path));
    }
  }, () => Function.prototype)
};

let processRegistry;
function processOperations(tokens) {
  const clone = structuredClone(tokens);
  processRegistry = /* @__PURE__ */ new Map();
  traverse(null, clone);
  return clone;
}
function executeOperation(operation, context = {}) {
  const [operationReference, ...args] = operation;
  const fn = getOperation(operationReference);
  if (typeof fn !== "function")
    return operation;
  const result = fn(...args.map((arg) => arg in context ? context[arg] : arg));
  if (fn === proxies.Import.operations) {
    return executeOperations(result, context?.$value);
  }
  return result;
}
function executeOperations(operations, $value, tokens = {}) {
  let idx;
  return operations.reduce((completed, operation, index) => {
    idx = `$${index}`;
    const resolved = Array.isArray(operation) ? executeOperation(operation, completed) : resolveAlias(operation, tokens);
    return { ...completed, [idx]: resolved };
  }, { $value })[idx];
}
function getOperation(operationReference) {
  const [prototype, reference] = operationReference.split(".");
  return prototype && reference && proxies?.[prototype]?.[reference];
}
function getValue(path, tokens) {
  const { $value } = resolvePath(path, tokens);
  return resolveAlias($value, tokens);
}
function resolveAlias(value, tokens) {
  const re = /\{([^)]+)\}/;
  if (re.test(value)) {
    const [, alias] = re.exec(value) || [];
    if (alias) {
      if (processRegistry.get(alias)) {
        throw new Error(`Looping operational path at: ${alias}.`);
      }
      const { $operations } = resolvePath(alias, tokens) || {};
      return $operations ? resolveOperations(alias, tokens) : getValue(alias, tokens);
    }
    console.warn(`Unresolved alias at: ${alias}`);
  }
  return value;
}
function resolveOperations(path, tokens) {
  const { $operations, $value } = resolvePath(path, tokens);
  if (!processRegistry.has(path)) {
    processRegistry.set(path, true);
    const value = executeOperations($operations, getValue(path, tokens), tokens);
    processRegistry.set(path, false);
    return value;
  }
  return $value;
}
function resolvePath(path, tree) {
  return path.split(".").reduce((obj, ref) => obj && obj[ref], tree);
}
function traverse(path, tree) {
  const entry = path ? resolvePath(path, tree) : tree;
  if (!entry || typeof entry !== "object")
    return;
  Object.entries(entry).forEach(([name, token]) => {
    const target = [path, name].filter(Boolean).join(".");
    if (token.$value && token.$operations) {
      token.$value = resolveOperations(target, tree);
      return;
    }
    return traverse(target, tree);
  });
}

export { processOperations as default };
