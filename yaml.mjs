import fs from 'fs';
import YAML from 'yaml';

const path = process.argv[2];
if (!fs.existsSync(path)) {
    console.error(path, 'does not exist');

    process.exit();
}

if (!path.match(/\.(yml|yaml)/)) {
    console.error(path, 'is not a yaml file');

    process.exit();
}

const file = fs.readFileSync(path, 'utf8');
const doc = YAML.parse(file);

fs.writeFileSync(path, YAML.stringify(fixContexts(doc)));

console.log(path, 'has been amended');

function fixContexts(doc) {
    for (const key in doc) {
        let node = doc[key];
        const isObject = typeof node === 'object';
        const isArray = Array.isArray(node);
        const isContext = key === 'context';

        if (isContext) {
            doc[key] = appendProdEnvToContext(node);

            doc[key] = appendQAEnvToContext(doc[key]);
        }

        if (isObject || isArray) {
            fixContexts(node);
        }
    }

    return doc;
}

function appendProdEnvToContext(context) {
    const isString = typeof context === 'string';
    const isArray = Array.isArray(context);

    if (isString && contextContainsPattern([context], 'prod')) {
        return [...new Set([
            'prod-environment',
            context
        ])];
    } else if (isArray && contextContainsPattern(context, 'prod')) {
        const newContext = context.filter(c => c !== 'prod-environment');

        if (newContext.length > 0) {
            newContext.unshift('prod-environment');

            return newContext;
        }
    }

    return context;
}

function appendQAEnvToContext(context) {
    const isString = typeof context === 'string';
    const isArray = Array.isArray(context);

    if (isString && contextContainsPattern([context], 'qa')) {
        return [...new Set([
            'qa-environment',
            context
        ])];
    } else if (isArray && contextContainsPattern(context, 'qa')) {
        const newContext = context.filter(c => c !== 'qa-environment');

        if (newContext.length > 0) {
            newContext.unshift('qa-environment');

            return newContext;
        }
    }

    return context;
}

function contextContainsPattern(context, pattern) {
    return !!context.filter(c => c.match(new RegExp(pattern))).length;
}
