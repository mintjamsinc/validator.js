// Copyright (c) 2025 MintJams Inc. Licensed under MIT License.

const TYPE_CONVERSION_ERROR = Symbol('TYPE_CONVERSION_ERROR');

function interpolate(template, context = {}) {
	if (!template) return '';
	return template.replace(/\$\{(\w+)\}/g, (_, key) => context[key] ?? '');
}

function getErrorMessage(messages, ruleName, locale, context) {
	const ruleMsgs = messages?.[ruleName];
	const defaultMsgs = messages?.['default'];

	return (
		interpolate(ruleMsgs?.[locale], context) ??
		interpolate(ruleMsgs?.['default'], context) ??
		interpolate(defaultMsgs?.[locale], context) ??
		interpolate(defaultMsgs?.['default'], context) ??
		`[${ruleName}] validation failed`
	);
}

function convertByType(value, type) {
	try {
		switch (type) {
			case 'number':
				const num = parseFloat(value);
				if (isNaN(num)) throw new Error('NaN');
				return num;
			case 'boolean':
				if (value === 'true' || value === 'on') return true;
				if (value === 'false' || value === 'off') return false;
				throw new Error('Invalid boolean');
			case 'date':
				const date = new Date(value);
				if (isNaN(date.getTime())) throw new Error('Invalid Date');
				return date;
			case 'string':
				if (value == null) return '';
				return String(value);
			default:
				return value;
		}
	} catch (e) {
		return TYPE_CONVERSION_ERROR;
	}
}

export class Validator {
	#schema;
	#errors;
	#crossErrors;
	static #rules = {};

	constructor(schema) {
		this.#schema = schema;
		this.#errors = {}; // { fieldName: [message1, ...] }
		this.#crossErrors = []; // [{ type: 'crossField', fields: [...], target, message }]
	}

	validate(formData, locale = 'en') {
		this.#errors = {};
		this.#crossErrors = [];

		const fields = this.#schema.fields || {};
		const rules = Validator.#rules;

		for (const [field, config] of Object.entries(fields)) {
			const rawValue = formData[field];
			const type = config.type || 'string';
			const value = convertByType(rawValue, type);
			const messages = config.messages || {};
			const context = { ...config, value };

			if (value === TYPE_CONVERSION_ERROR) {
				const message = getErrorMessage(messages, 'type', locale, context);
				this.#addError(field, message);
				continue;
			}

			for (const [ruleName, ruleOption] of Object.entries(config)) {
				if (!(ruleName in rules)) continue;
				const rule = rules[ruleName];
				const passed = rule(value, ruleOption);

				if (!passed) {
					const message = getErrorMessage(messages, ruleName, locale, context);
					this.#addError(field, message);
				}
			}
		}

		for (const rule of this.#schema.crossFieldValidations || []) {
			const passed = this.#evalRule(rule.rule, formData);
			if (!passed) {
				const message = getErrorMessage(rule.message, rule.target || 'default', locale, formData);
				const target = rule.target || rule.fields?.[0];
				this.#crossErrors.push({ type: 'crossField', fields: rule.fields, target, message });
				this.#addError(target, message);
			}
		}

		return {
			valid: Object.keys(this.#errors).length === 0,
			errors: this.#errors,
			crossErrors: this.#crossErrors,
		};
	}

	#addError(field, message) {
		if (!this.#errors[field]) {
			this.#errors[field] = [];
		}
		this.#errors[field].push(message);
	}

	#evalRule(rule, formData) {
		try {
			const fn = new Function(...Object.keys(formData), `return ${rule};`);
			return fn(...Object.values(formData));
		} catch (e) {
			return false;
		}
	}

	static registerRule(name, fn) {
		this.#rules[name] = fn;
	}
}

Validator.registerRule('required', (value) => value != null && value !== '');
Validator.registerRule('minLength', (value, len) => typeof value === 'string' && value.length >= len);
Validator.registerRule('maxLength', (value, len) => typeof value === 'string' && value.length <= len);
Validator.registerRule('min', (value, limit) => {
	if (value instanceof Date && !isNaN(value)) return value >= new Date(limit);
	if (typeof value === 'number') return value >= limit;
	return false;
});
Validator.registerRule('max', (value, limit) => {
	if (value instanceof Date && !isNaN(value)) return value <= new Date(limit);
	if (typeof value === 'number') return value <= limit;
	return false;
});
Validator.registerRule('pattern', (value, regex) => new RegExp(regex).test(value));
Validator.registerRule('format', (value, fmt) => {
	if (typeof value !== 'string') return false;

	const patterns = {
		'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/,
		'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
		'YYYYMMDD': /^\d{8}$/,
		'YYYYMMDDHHmmss': /^\d{14}$/,
		'ISO8601': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/,
		'UNIX_MS': /^\d{10,13}$/,
		'TIMESTAMP_MS': /^\d{10,13}$/,
		'HH:mm:ss': /^\d{2}:\d{2}:\d{2}$/,
		'HHmmss': /^\d{6}$/,
	};

	const pattern = patterns[fmt];
	if (!pattern) return false; // 未定義の書式はNG

	return pattern.test(value);
});
Validator.registerRule('enum', (value, list) => Array.isArray(list) && list.includes(value));

export class SchemaRegistry {
	#schemas = new Map();

	register(key, schema) {
		this.#schemas.set(key, schema);
	}

	createValidator(key) {
		const schema = this.#schemas.get(key);
		if (!schema) {
			throw new Error(`Schema not found: ${key}`);
		}
		return new Validator(schema);
	}

	getSchema(key) {
		return this.#schemas.get(key);
	}

	has(key) {
		return this.#schemas.has(key);
	}

	unregister(key) {
		this.#schemas.delete(key);
	}

	get keys() {
		return [...this.#schemas.keys()];
	}
}
