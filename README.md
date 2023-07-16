# token-operations

This project aims to illustrate the concept of "[Token Operations](https://blog.damato.design/posts/token-operations/)"; the ability to include step-by-step instructions in order to transform a given [design token](https://tr.designtokens.org/format/#design-token) value into another.

## Usage

```js
import tokens from './my-tokens-file-with-operations.json';
import tokenOperations from 'token-operations';

export default tokenOperations(tokens);
```
This assumes that the `.json` file has token operations as described below.

## Syntax

The concept is to include a `$operations` key on a design token based on the [DTCG specifications](https://tr.designtokens.org/) existing at the same level as `$value`. Assume the following abridged `tokens.json` file structure:

```json
{
  "primary-color-overlay": {
    "$type": "color",
    "$value": "#fffc00",
    "$operations": [...]
  }
}
```

Within the `$operations` key is an ordered set of instructions to take to create a new value for this token:

```json
{
  "primary-color-overlay": {
    "$type": "color",
    "$value": "#fffc00",
    "$operations": [
      0.5,
      ["String.capture", "$value", "#([0-9A-Fa-f]{2})"],
      ["String.capture", "$value", "#(?:[0-9A-Fa-f]{2})([0-9A-Fa-f]{2})"],
      ["String.capture", "$value", "#(?:[0-9A-Fa-f]{4})([0-9A-Fa-f]{2})"],
      ["Number.parseInt", "$1", 16],
      ["Number.parseInt", "$2", 16],
      ["Number.parseInt", "$3", 16],
      ["String.infix", ",", "$4", "$5", "$6", "$0"],
      ["String.infix", "", "rgba(", "$7", ")"]
    ]
  }
}
```
After running `tokenOperations` on this data, the value of `primary-color-overlay` would now be `rgba(255,252,0,0.5)`.

While this looks immediately overwhelming, **this project recommends that operations are sharable**. So to make the concept more approachable, the following is also possible with an identical result:

```json
{
  "primary-color-overlay": {
    "$type": "color",
    "$value": "#fffc00",
    "$operations": [
      ["Import.operations", "token-operations/lib/hex-add-alpha-rgba", 0.5]
    ]
  }
}
```

In this example, the operations are abstracted to an import with the remaining array values as arguments for the operation to complete. This will also allow for custom shared operations to be imported also:

```json
{
  "primary-color-overlay": {
    "$type": "color",
    "$value": "#fffc00",
    "$operations": [
      ["Import.operations", "./my-custom-alpha-operations.json", 0.5]
    ]
  }
}
```

## Operations

The following describes what operations are available to perform.

### `Math`

All methods are extended from the global `Math` object with the following additions:
- `Math.add` - Adds all arguments together.
- `Math.multiply` - Multiplies all arguments together.

```json5
{
  "hypothetical-token": {
    "$value": 3, // Represents $value
    "$operations": [
      [
        "Math.max", // Operation name
        2, // First argument
        4, // Second argument
      ]
    ]
  }
}
```
After resolving, the value of `hypothetical-token` would be `4`.

### `Number`

All methods are extended from the global `Number` object

```json5
{
  "hypothetical-token": {
    "$value": "ff", // Represents $value
    "$operations": [
      [
        "Number.parseInt", // Operation name
        "$value", // First argument
        16, // Second argument
      ]
    ]
  }
}
```
After resolving, the value of `hypothetical-token` would be `255`.
### `String`

All methods are extended from the `String.prototype` object with the following additions:
- `String.infix` - First argument defines the joiner, the rest of the arguments are joined between the joiner.
- `String.capture` - First argument is the string, second is a Regular Expression with a capture group, third argument is a Regular Expression flag. Returns the first capture if found; empty string if not found.

```json5
{
  "hypothetical-token": {
    "$value": "#fff", // Represents $value
    "$operations": [
      [
        "String.padEnd", // Operation name
        "$value", // First argument, represents `this` for String extend
        7, // Second argument
        "a" // Third argument
      ]
    ]
  }
}
```

After resolving, the value of `hypothetical-token` would be `#fffaaa`.

### `Import`
This custom group allows for file importing.
- `Import.operations` - First argument is path to `.json` operations file; which should have a single array of operations. Additional arguments are passed as the first entries to the operation. Example below:

```json5
// simple-add.json
[
  ["Math.add", "$value", "$0", "$1"]
]
```

```json5
// design-tokens.json
{
  "hypothetical-token": {
    "$value": 3, // Represents $value
    "$operations": [
      [
        "Import.operations", // Operation name
        "./simple-add.json", // Path to import
        2, // First argument for simple-add stored in $0
        4, // Second argument for simple-add stored in $1
      ]
    ]
  }
}
```

After resolving, the value of `hypothetical-token` would be `9`.

## Examples

Create a typography scale using `Math.pow`.

```json5
{
  "typography": {
    "base-size": {
      "$value": "1rem"
    },
    "scale": {
      "$value": 1.25
    }
  },
  "font-size-2": {
    "$value": "{typography.base-size}", // Represents 1rem
    "$operations": [
      "{typography.scale}", // Resolve alias, set at $0
      ["Math.pow", "$0", 2], // Math.pow(1.25, 2) = 1.5625, set at $1
      ["String.infix", "", "calc(", "$value", " * ", "$1", ")"] // calc(1rem * 1.5625)
    ]
  }
}
```