# OI4 OEC dnp encoding helper

During the validation of the OEC Development Spec v1.0 a compatibility problem with DIN SPEC 91406 was identified. The dnp-encoding solves this incompatibility. This project capsules a helper function for decoding & encoding.

## How to use

The library can be imported using the `import`-statement:

```js
import { decode, encode } from 'oi4-oec-dnp-encoding';
```

When using this package within node-red, it can also be loaded, so it can be used in function nodes. Read more about this [here](https://nodered.org/docs/user-guide/writing-functions#loading-additional-modules).

When loaded, it can then be used easily inside your code like this:

```js
encode('Edge Gateway >4GB'); //returns 'Edge,20Gateway,20,3E4GB'
```

Please be aware that all special characters stated below are encoded. It is not possible to directly put in whole oi4 identifiers, as the forward slashes will get encoded. You instead have to encode the single fields for themselves and put the oi4-identifier together afterwards.

## dnp-encoding explained

### Define the mask-sign

The set of allowed and prohibited characters is given by the DIN SPEC 91406.

To provide an urlEncode-like encoding, we have to define an algorithm which is easy to understand/implement and (for better acceptance) as similar as possible to the url encoding:

    use one single character for masking (url: %)

    This character is also used to mask itself (url: % => %25)

    The mask character is followed by a unique definition to represent the masked character (url: %<HEXDIG><HEXDIG>)

The intersection of all reserved characters in DIN SPEC 91406 and masked characters in URL is:

    / ? # [ ] @ $ & + , ; =

The intersection of all reserved characters in DIN SPEC 91406 which are not masked in URL is:

    ! ' ( ) *

We define comma (,ascii = 44dec = 2Chex) is the global mask character for dnp-encoding.

:arrow_forward: An comma-encoding mechanism is used to represent a data octet in a component when that octet's corresponding character is outside the allowed set or is being used as a delimiter of, or within, the component. An comma-encoded octet is encoded as a character triplet, consisting of the apostrophe character "," followed by the two hexadecimal digits representing that octet's numeric value. For example, "'20" is the comma-encoding for the binary octet "00100000", which in US-ASCII corresponds to the space character (SP).

:arrow_forward: The provided dnp-encoding rules are common rules to replace urlEncoding functionality in context of DIN SPEC 91406. It shall not be restricted to the Alliance or even worst to the oi4Identifier.

### What characters are masked within dnp-encoding?

| **dnp-encoding of unreserved characters** |                     |
| ----------------------------------------- | ------------------- |
| _character_                               | _Encoded character_ |
| a .. z, A .. Z                            | a .. z, A .. Z      |
| 0 .. 9                                    | 0 .. 9              |
| – . \_ ~                                  | – . \_ ~            |

| **dnp-encoding of reserved characters** |                   |
| --------------------------------------- | ----------------- |
| _character_                             | _Encoded triplet_ |
| #                                       | ,23               |
| /                                       | ,2F               |
| :                                       | ,3A               |
| ?                                       | ,3F               |
| @                                       | ,40               |
| [                                       | ,5B               |
| ]                                       | ,5D               |
| !                                       | ,21               |
| $                                       | ,24               |
| &                                       | ,26               |
| ‘                                       | ,27               |
| (                                       | ,28               |
| )                                       | ,29               |
| \*                                      | ,2A               |
| +                                       | ,2B               |
| ,                                       | ,2C               |
| ;                                       | ,3B               |
| =                                       | ,3D               |

| **dnp-encoding of prohibited printable characters** |                   |
| --------------------------------------------------- | ----------------- |
| _character_                                         | _Encoded triplet_ |
| SP                                                  | ,20               |
| “                                                   | ,22               |
| %                                                   | ,25               |
| <                                                   | ,3C               |
| >                                                   | ,3E               |
| \                                                   | ,5C               |
| ^                                                   | ,5E               |
| `                                                   | ,60               |
| {                                                   | ,7B               |
| \|                                                  | ,7C               |
| }                                                   | ,7D               |
