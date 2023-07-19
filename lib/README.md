# Example library

This directory is a collection of sample operations that are able to be imported into root operation sets using the [`Import.operations` command](../README.md#imported-operations). Each is a `.json5` file which allows for comments to be written to help describe the expected arguments and each operational step.


> **Note**
>
> This library does not expect to contain all operations that can be used but instead acts as a showcase to inspire others to create custom ones for their own purposes.

## Conventions

Here are some loose guidelines which helps organize this library:

- Shared operations should have a name that attempts to describe the kind of input and output related to the operation; eg., `hex-value-alpha-rgba`.
- If this results in a name that becomes too complex, consider describing the intended use; `typography-scale-rem-calc`.
- It is highly recommended to author shared operations as `.json5` to include comments which describe the positional arguments and what occurs at each step. Use [`JSDoc` notation](https://jsdoc.app/) to help describe the operation.
- If using standard `.json`, consider updating a `README.md` to describe the operation set. Use `<$N>` to denote the positional arguments.

---

## `binary-if-string`

Returns a given string value depending on the binrary number provided.

### Usage

```json5
["Import.operations", "token-operations/lib/binary-if-string", <$0>, <$1>, <$2>]
```


- `<$0>`: A binary number (`0` or `1`) which represents `false` or `true`.
- `<$1>`: The string value to return if `true`.
- `<$2>`: The string value to return if `false`.

---

## `hex-value-alpha-rgba`

Returns a `rgba()` string conversion of the given hex color and alpha amount.

### Usage

```json5
["Import.operations", "token-operations/lib/hex-value-alpha-rgba", <$0>, <$1>]
```


- `<$0>`: A hex color which includes the `#` symbol.
- `<$1>`: The alpha amount between `0` and `1`.

---

## `hex-value-yiq-brightness`

Returns a [YIQ color brightness](https://en.wikipedia.org/wiki/YIQ) of the given hex color. This is translation of the [color brightness formula provided by the W3C.](https://www.w3.org/TR/AERT/#color-contrast)

### Usage

```json5
["Import.operations", "token-operations/lib/hex-value-yiq-brightness", <$0>]
```


- `<$0>`: A hex color which includes the `#` symbol.

---

## `typography-scale-rem-calc`

Returns a CSS `calc()` string which includes a given base font size and exponential scale increase.

### Usage

```json5
["Import.operations", "token-operations/lib/typography-scale-rem-calc", <$0>, <$1>, <$2>]
```


- `<$0>`: The scale amount as a number, eg., `1.25`.
- `<$1>`: The step to scale as a number, eg., `2` for 2 steps above the base size.
- `<$2>`: The base font size as a string including the units, eg., `'1rem'`.