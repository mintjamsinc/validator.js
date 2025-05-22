# ValidatorJS

> A lightweight, schema-driven, internationalized form validator for JavaScript.

## ✨ Features

* ✅ Schema-based validation
* 🌐 Built-in i18n with fallback support
* 🧹 Supports field-level and cross-field validation
* 🔧 Custom rule registration supported
* 🔐 No runtime dependencies

---

## 📦 Usage in Browser

Download `validator.js` or `validator.min.js` and import it in your module:

```html
<script type="module">
  import { Validator } from './validator.min.js';

  const schema = JSON.parse(mySchemaJSON);
  const validator = new Validator(schema);
  const result = validator.validate({ username: 'あ', age: 'abc' }, 'ja');
  console.log(result.errors);
</script>
```

> Note: The path `./validator.min.js` should be adjusted according to your project structure.

---

## 📘 Schema Definition Example (JSON)

---

## 🧩 About `${}` Placeholders in Messages

Message templates support dynamic placeholders using `${...}` syntax. These placeholders are interpolated at runtime based on the schema configuration.

### Available Placeholders

You can reference any key defined in the field’s schema. For example:

```json
"username": {
  "minLength": 3,
  "messages": {
    "minLength": {
      "default": "Minimum length is ${minLength}."
    }
  }
}
```

In this example:
- `${minLength}` will be replaced with `3`, as specified in the schema.

### Special Placeholder: `${value}`

- The `${value}` placeholder is always available and refers to the input value (converted by `type` if specified).

### Cross-field Validations

In cross-field validation messages, placeholders refer to keys from the entire `formData`.

```json
"message": {
  "default": "Start (${startDate}) must be before end (${endDate})."
}
```

### Fallback Behavior

If a message is not available for the selected locale, the following fallback order is used:

1. `messages[rule][locale]`
2. `messages[rule]['default']`
3. `messages['default'][locale]`
4. `messages['default']['default']`

```json
{
  "fields": {
    "username": {
      "required": true,
      "minLength": 3,
      "maxLength": 20,
      "pattern": "^[a-zA-Z0-9_]+$",
      "messages": {
        "required": {
          "en": "Username is required.",
          "ja": "ユーザー名は必須です。"
        },
        "minLength": {
          "default": "At least ${minLength} characters."
        },
        "default": {
          "en": "Invalid username."
        }
      }
    },
    "age": {
      "type": "number",
      "min": 0,
      "max": 120,
      "messages": {
        "type": {
          "default": "Age must be a number."
        },
        "max": {
          "default": "Maximum allowed age is ${max}."
        }
      }
    }
  },
  "crossFieldValidations": [
    {
      "rule": "startDate <= endDate",
      "fields": ["startDate", "endDate"],
      "target": "endDate",
      "message": {
        "default": "Start date must be before end date."
      }
    }
  ]
}
```

---

## 🧬 Supported Field Types and Type Conversion

Each field can specify a `type`, which determines how the input value is automatically converted before validation. If conversion fails, a `"type"` validation error will be generated.


---

## 📏 Built-in Validation Rules

ValidatorJS includes the following built-in rules. These rules can be applied directly in the field schema.

| Rule Name   | Description                                                                                   | Applies to Type(s)      |
|-------------|-----------------------------------------------------------------------------------------------|--------------------------|
| `required`  | Checks that the value is not null or empty string.                                            | All                     |
| `minLength` | Checks that the string has at least N characters.                                             | `string`                |
| `maxLength` | Checks that the string has at most N characters.                                              | `string`                |
| `pattern`   | Checks that the string matches the provided regular expression.                               | `string`                |
| `format`    | Checks for a specific format (currently supports `YYYY/MM/DD` format).                        | `string`                |
| `min`       | Checks that the value is >= specified minimum (number or date).                               | `number`, `date`        |
| `max`       | Checks that the value is <= specified maximum (number or date).                               | `number`, `date`        |
| `enum`      | Checks that the value is included in the allowed list.                                        | All                     |

> 💡 **Note**: Custom rules can be added using `Validator.registerRule(name, fn)`.
> See [🔧 Register Custom Rule](#-register-custom-rule) for examples.

### format Rule Values

The `format` rule supports the following built-in formats:

| Format Name        | Example Value           | Description                                                      |
|--------------------|-------------------------|------------------------------------------------------------------|
| `YYYY/MM/DD`       | `2025/05/22`            | A date in slash-separated year/month/day format.                |
| `YYYY-MM-DD`       | `2025-05-22`            | A date in ISO-style hyphen-separated format.                    |
| `YYYYMMDD`         | `20250522`              | A compact date without separators.                              |
| `YYYYMMDDHHmmss`   | `20250522143000`        | A compact datetime with 14 digits (YMDHMS).                     |
| `HH:mm:ss`         | `14:30:00`              | A colon-separated time format.                                  |
| `HHmmss`           | `143000`                | A compact 6-digit time format (HHMMSS).                         |
| `ISO8601`          | `2025-05-22T14:30:00Z`  | ISO 8601 datetime with optional milliseconds and timezone.      |
| `TIMESTAMP_MS`     | `1716369000000`         | Number of milliseconds since the UNIX epoch (Jan 1, 1970 UTC).  |
| `UNIX_MS`          | `1716369000000`         | Alias of TIMESTAMP_MS.                                          |

### Supported `type` values

| Type    | Description                                                              |
|---------|--------------------------------------------------------------------------|
| `string`  | Converts any value using `String(value)`. `null` and `undefined` become `""`. |
| `number`  | Converted using `parseFloat(value)`.                                   |
| `boolean` | Accepts `"true"`, `"false"`, `"on"`, `"off"`.                         |
| `date`    | Parsed using `new Date(value)`. Invalid dates trigger `"type"` errors. |

### Type Conversion Example

```json
"age": {
  "type": "number",
  "messages": {
    "type": {
      "default": "Age must be a valid number."
    }
  }
}
```

If the user inputs `"abc"` for `age`, it will fail to convert to a number, and a `"type"` error message will be shown.

> Note: Type conversion happens before all other validation rules. Custom rules receive the converted value.

---

## 🚀 Usage Example

```js
const schema = JSON.parse(mySchemaJSON);
const validator = new Validator(schema);

const result = validator.validate({
  username: 'あ',
  age: 'abc',
  startDate: '2025/01/01',
  endDate: '2024/12/31'
}, 'ja');

console.log(result.errors);      // { username: [...], age: [...], endDate: [...] }
console.log(result.crossErrors); // [ { target, fields, message } ]
```

---

## 🔧 Register Custom Rule

```js
Validator.registerRule('even', value => parseInt(value, 10) % 2 === 0);
```

---

## 🗋 Validator API

| Method                           | Description                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `new Validator(schema)`          | Creates a new Validator instance.                                            |
| `validate(formData, locale?)`    | Validates input against the schema. Returns `{ valid, errors, crossErrors }` |
| `static registerRule(name, fn)`  | Registers a custom validation rule function.                                 |

* **Return format of `validate()`**:

  ```js
  {
    valid: boolean,           // true if all validations pass
    errors: { [field]: string[] }, // field-specific errors
    crossErrors: [
      { type: 'crossField', fields: string[], target: string, message: string }
    ]
  }
  ```

---

## 📚 SchemaRegistry Usage

`SchemaRegistry` is a utility class designed to manage multiple validation schemas and generate `Validator` instances on demand. This is especially useful in applications that handle many forms dynamically, such as content management systems or chat apps with server-driven form definitions.

### ✨ Example

```js
import { SchemaRegistry, Validator } from './validator.min.js';

const registry = new SchemaRegistry();

// Register multiple schemas
registry.register('channelForm', channelFormSchema);
registry.register('messageForm', messageFormSchema);

// Create a validator instance from a registered schema
if (registry.has('channelForm')) {
  const validator = registry.createValidator('channelForm');
  const result = validator.validate({ name: '', description: '' });
  console.log(result.errors);
}

// Get raw schema if needed
const schema = registry.getSchema('channelForm');

// List all registered schema keys
console.log(registry.keys); // ["channelForm", "messageForm"]

// Remove a schema if no longer needed
registry.unregister('messageForm');
```

### 📅 SchemaRegistry API

| Method                  | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `register(key, schema)` | Registers a new schema with the given key         |
| `createValidator(key)`  | Returns a new `Validator` instance for the schema |
| `getSchema(key)`        | Returns the raw schema associated with the key    |
| `has(key)`              | Checks if a schema is registered for the key      |
| `unregister(key)`       | Removes the schema from the registry              |
| `keys` (getter)         | Returns an array of all registered schema keys    |

> `SchemaRegistry` is lightweight and designed to work seamlessly with the Validator class. It does not cache Validator instances — a new one is created each time `createValidator()` is called.

---

## 🛡 License

MIT License
