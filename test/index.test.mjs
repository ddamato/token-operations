import { readFileSync } from 'fs';
import { resolve } from 'path';
import { expect } from 'chai';

import tokenOperations from '../src/index.js';

function read(fixturePath) {
    return JSON.parse(readFileSync(resolve('test', 'fixtures', fixturePath), 'utf8'));
}

describe('token-operations', function () {
    it('should be a function', function () {
        expect(tokenOperations).to.be.a('function');
    });

    it('should resolve operations', function () {
        const tokens = read('basic.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('#fffc00');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });

    it('should resolve $value alias before operations', function () {
        const tokens = read('alias.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('{color.yellow.500}');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });

    it('should resolve aliases within operations', function () {
        const tokens = read('alias-in-operation.json');
        expect(tokens['font-size-2'].$value).to.equal('{typography.base-size}');
        const resolved = tokenOperations(tokens);
        expect(resolved['font-size-2'].$value).to.equal('calc(1rem * 1.5625)');
    });

    it('should resolve imported operations', function () {
        const tokens = read('import.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('#fffc00');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });
});

