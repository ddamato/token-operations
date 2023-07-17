# token-operations

This project aims to illustrate the concept of "[Token Operations](https://blog.damato.design/posts/token-operations/)"; the ability to include step-by-step instructions in order to transform a given [design token](https://tr.designtokens.org/format/#design-token) value into another.

## Usage

```js
import tokens from './my-tokens-file-with-operations.json';
import tokenOperations from 'token-operations';

export default tokenOperations(tokens);
```
This assumes that the `.json` file has token operations as described below. The system will also accept `.json5` files with supports comments among other features.

## Syntax

The concept is to include a `$operations` key on a design token based on the [DTCG specifications](https://tr.designtokens.org/) existing at the same level as `$value`. Assume the following abridged tokens.json file structure:

```json5
{
  "font-size-2": {
    "$type": "dimension",
    "$value": "2rem",
    "$operations": [...]
  }
}
```

Within the `$operations` key is an ordered set of instructions to take to create a new value for this token (assuming aliases exist):

```json5
{
  "font-size-2": {
    "$type": "dimension",
    "$value": "2rem", // Default value, rewritten after operations
    "$operations": [
      // Alias at typography.base-size, stored at $0
      "{typography.base-size}",

      // Alias at typography.scale, stored at $1
      "{typography.scale}",

      // Math.pow({typography.scale}, 2), stored at $2
      ["Math.pow", "$1", 2],

      // calc(Math.pow({typography.scale}) * {typography.base-size}) set as new $value
      ["String.infix", "", "calc(", "$2", " * ", "$0", ")"]
    ]
  }
}
```

While this may look immediately overwhelming, **this project recommends that operations are sharable**. So to make the concept more approachable, the following is also possible with an identical result:

```json5
{
  "font-size-2": {
    "$type": "dimension",
    "$value": "2rem", // Default value, rewritten after operations
    "$operations": [
       // Alias at typography.base-size, stored at $0
      "{typography.scale}",

      // Alias at typography.scale, stored at $1
      "{typography.base-size}",

      // Convenience operation, signature of (scale, step, base-size)
      ["Import.operations", "token-operations/lib/typography-scale-rem-calc", "$0", 2, "$1"]
    ]
  }
}
```
This introduces the concept of [imported operations](#imported-operations); reusable sets of lower level operations which can be used multiple times.

## Anatomy

The `$operations` key expects an array of data. This data could be a value, a token alias, or an "operation" array. 

```json5
[
  42, // Primitive value, stored at $0
  "{numbers.seven}", // Alias, resolved as 7 and stored at $1
  ["Math.add", "$0", "$1"] // Operation resulting in 49, Stored at $2 
]
```

The placement matters in the larger set of operations as the result is stored at the local index where the operation was set. For example, the result of the first item in the set is stored at `$0`. References to the results of previous operations are then available to later operations.

Altogether, you can think of the above `$operations` as the following:

```js
const $0 = 42;
const $1 = lookup('numbers.seven');
const $2, $value = add($0, $1);
```

The final operation sets the new `$value` for the token.
### Operation Array

The following describes the anatomy of an operation array.

```json5
["command", "arg1", "arg2", "arg3", ...]
```

You can think of an operation array like a function, where the first item in the array is the function name, and all other items given are arguments for the function.

> TODO: include commands

### Aliases

When referencing token aliases, the operations will attempt to resolve the alias _and_ perform any operations that might exist on the token before returning that value. As an example, if an alias for `{button-bg-hover}` itself has an operation which darkens the color at the token. The operation of darkening the color will occur first before and the resulting value will be return.


```json5
{
  "button-bg": {
    "$type": "color",
    "$value": "#ccccff"
  },
  "button-bg-hover": {
    "$type": "color",
    "$value": "{button-bg}",
    "$operations": [...] // Operations which darken the {button-bg} color
  }
}
```

A limitation of the system is that **aliases cannot be used directly in operations**. They must be stored at a local index first before they can be used.

```json5
// NOT VALID!
// {numbers.seven} will not resolve and
// be treated as the literal string
[
  42,
  ["Math.add", "$0", "{numbers.seven}"]
]
```

### Root Operations Set

The set of operations found at the same level as `$value` in a token is known as the "root operation set" for the token. This distinction is made because it is possible to run nested operations.

The root operations set has access to a special `$value` reference, which refers to the orignal token value. If this is an alias, it will be resolved before performing the operation.

```json5
{
  "font-size-2": {
    "$type": "dimension",
    "$value": "1rem", // Will be rewritten with calc in final operation
    "$operations": [
      "{typography.scale}",
      ["Math.pow", "$1", 2],

      // The original '1rem' is used in the final output for the calc
      ["String.infix", "", "calc(", "$2", " * ", "$value", ")"]
    ]
  }
}
```
The final operation will set its result as the new `$value` in the token.

### Imported Operations

The `Import.operations` command can inject a set of operations into a parent set, where the result is stored at the local index.

```json5
// token-operations/lib/hex-value-alpha-rgba.json5
[
    // @param {String} $0 - Hex value including #
    // @param {Number} $1 - Alpha amount
    ["String.capture", "$0", "#([0-9A-Fa-f]{2})"], // Capture first two characters
    ["String.capture", "$0", "#(?:[0-9A-Fa-f]{2})([0-9A-Fa-f]{2})"], // Capture second 2 characters
    ["String.capture", "$0", "#(?:[0-9A-Fa-f]{4})([0-9A-Fa-f]{2})"], // Capture third 2 characters
    ["Number.parseInt", "$2", 16], // Transform red channel hexadecimal to decimal
    ["Number.parseInt", "$3", 16], // Transform green channel hexadecimal to decimal
    ["Number.parseInt", "$4", 16], // Transform blue channel hexadecimal to decimal
    ["String.infix", ",", "$5", "$6", "$7", "$1"], // Comma separate values
    ["String.infix", "", "rgba(", "$8", ")"] // Returns 'rgba(hex-as-rgb, $0)'
]
```

```json5
// tokens.json
{
  "primary-color-overlay": {
    "$type": "color",
    "$value": "#fffc00",
    "$operations": [
      ["Import.operations", "token-operations/lib/hex-value-alpha-rgba", "$value", 0.5]
    ]
  }
}
```
The result of `hex-value-alpha-rgba` would be stored at `$0` but also applied as the new token value because it is the final operation in the root operation set.

The signature of `Import.operations` is the following:

```json5
["Import.operations", "path/to/operation", "arg-index0", "arg-index1", "arg-index2", ...]
```

`arg-indexN` means this value will be set at the local position within the operation as `$N`. This allows values to be passed into imported operations as positional arguments. Then within the `path/to/operation`:

```json5
[
  // arg-index0
  // arg-index1,
  // arg-index2,
  ["Math.add", "$0", "$1", "$2"]
]
```
It is helpful to leave a comment where the positional arguments will be to act as placeholders for future operational reference.

A limitation of imported operations is that they do not have access to the `$value` in storage. It must be passed in as a positional argument.

```json5
// token-operations/lib/hex-value-alpha-rgba.json5

// NOT VALID!
// Cannot use $value within the imported operation
[
    ["String.capture", "$value", "#([0-9A-Fa-f]{2})"],
    ...
]
```

You can have several imported operations within an operation set. Here is an example which determines the best foreground color to use, given a background hex color using the convenience imports:

```json5
{
    "color": {
        "primary": {
            "$value": "#ffcc00"
        },
        "light": {
            "$value": "white"
        },
        "dark": {
            "$value": "black"
        }
    },
    "on-primary-color": {
        "$type": "color",
        "$value": "{color.light}",
        "$operations": [
            // Store aliases to be used at $0 and $1.
            "{color.primary}",
            "{color.dark}",

            // Import the YIQ color operation set, and find YIQ value for {color.primary}
            ["Import.operations", "token-operations/lib/hex-value-yiq-color", "$0"],

            // Compare the resulting value against 128
            ["Math.pow", "$2", -1], // 1 / YIQ
            ["Math.multiply", 128, "$3"], // 128 / YIQ
            ["Math.floor", "$4"], // Math.floor(128 / YIQ)

            // If $5 is 1, return white else black
            ["Import.operations", "token-operations/lib/binary-if-string", "$5", "$value", "$1"]
        ]
    }
}
```

This is possible because the nested operation has its own set of local indexes. In other words, in the root operation set, `$1` is the resolved value of `{color.dark}`. Inside the `hex-value-yiq-color` nested operation, `$1` is the result of whatever the second operation is within `hex-value-yiq-color`. The local indexes are not available between operation sets; positional arguments must be passed to share values. The result of a nested operation is set at the parent's local index where it was positioned. In the above example, the result of `hex-value-yiq-color` is set at `$2` in the root operation set and used in the following operation.