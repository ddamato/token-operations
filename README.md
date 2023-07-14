# token-operations

This project aims to illustrate the concept of "[Token Operations](https://blog.damato.design/posts/token-operations/)"; the ability to include step-by-step instructions in order to transform a given [design token](https://tr.designtokens.org/format/#design-token) value into another.

## Usage

```js
import tokens from './my-tokens-file-with-operations.json';
import tokenOperations from 'token-operations';

export default tokenOperations(tokens);
```

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
      ["String.match", "$value", "#([0-9A-Fa-f]{2})"],
      ["String.match", "$value", "#(?:[0-9A-Fa-f]{2})([0-9A-Fa-f]{2})"],
      ["String.match", "$value", "#(?:[0-9A-Fa-f]{4})([0-9A-Fa-f]{2})"],
      ["Math.parseInt", "$1", 16],
      ["Math.parseInt", "$2", 16],
      ["Math.parseInt", "$3", 16],
      ["String.concat", ",", "$4", "$5", "$6", "$0"],
      ["String.concat", "", "rgba(", "$7", ")"]
    ]
  }
}
```
While this looks immediately overwhelming, **this project recommends that operations are sharable**. So to make the concept more approachable, the following is also possible with an identical result:

```json
{
  "primary-color-overlay": {
    "$type": "color",
    "$value": "#fffc00",
    "$operations": [
      ["Import.operations", "token-operations/hex-add-alpha-rgba", 0.5]
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
