# ValidatorJS

> A lightweight, schema-driven, internationalized form validator for JavaScript.

## ✨ Features

* ✅ Schema-based validation structure (JSON format)
* 🌐 Built-in i18n with fallback support
* 🧩 Supports field-level and cross-field validation
* 🔧 Custom rule registration supported
* 🔐 No runtime dependencies

---

## 📦 Usage in Browser

Download `validator.js` or `validator.min.js` and import it in your module:

```html
<script type="module">
  import { ValidatorEngine } from './validator.min.js';

  const schema = JSON.parse(mySchemaJSON);
  const validator = new ValidatorEngine(schema, 'ja');
  const result = validator.validate({ username: 'あ', age: 'abc' });
  console.log(result.errors);
</script>
```

> Note: The path `./validator.min.js` should be adjusted according to your project structure.

---

## 📘 Schema Definition Example (JSON)

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

## 🚀 Usage Example

```js
const schema = JSON.parse(mySchemaJSON);
const validator = new ValidatorEngine(schema, 'ja');

const result = validator.validate({
  username: 'あ',
  age: 'abc',
  startDate: '2025/01/01',
  endDate: '2024/12/31'
});

console.log(result.errors);      // { username: [...], age: [...], endDate: [...] }
console.log(result.crossErrors); // [ { target, fields, message } ]
```

---

## 🔧 Register Custom Rule

```js
ValidatorEngine.registerRule('even', value => parseInt(value, 10) % 2 === 0);
```

---

## 🛡 License

MIT License
