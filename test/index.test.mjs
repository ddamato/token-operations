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

    it('should not transform tokens without aliases or operations', function () {
        const tokens = read('no-process.json');
        expect(tokens['as-is-token'].$value).to.equal('#ffcc00');
        const resolved = tokenOperations(tokens);
        expect(resolved['as-is-token'].$value).to.equal('#ffcc00');
    });

    it('should not transform composite tokens', function () {
        const shadow = {
            "color": "#00000080",
            "offsetX": "0.5rem",
            "offsetY": "0.5rem",
            "blur": "1.5rem",
            "spread": "0rem"
        };
        const tokens = read('no-process.json');
        expect(tokens['composite-token'].$value).to.deep.equal(shadow);
        const resolved = tokenOperations(tokens);
        console.log(resolved);
        expect(resolved['composite-token'].$value).to.deep.equal(shadow);
    });

    it('should resolve operations without a $value set', function () {
        const tokens = read('no-value.json');
        expect(tokens['primary-color-overlay'].$value).to.not.exist;
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });

    it('should resolve aliases without operations', function () {
        const tokens = read('alias.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('{color.yellow.500}');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('#fffc00');
    });

    it('should resolve operations', function () {
        const tokens = read('basic.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('#fffc00');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });

    it('should resolve $value alias before operations', function () {
        const tokens = read('alias-with-operation.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('{color.yellow.500}');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });

    it('should resolve aliases within operations', function () {
        const tokens = read('alias-in-operation.json');
        expect(tokens['font-size-2'].$value).to.equal('{typography.base-size}');
        const resolved = tokenOperations(tokens);
        expect(resolved['font-size-2'].$value).to.equal('calc(1.5625 * 1rem)');
    });

    it('should resolve imported operations', function () {
        const tokens = read('import.json');
        expect(tokens['primary-color-overlay'].$value).to.equal('#fffc00');
        const resolved = tokenOperations(tokens);
        expect(resolved['primary-color-overlay'].$value).to.equal('rgba(255,252,0,0.5)');
    });

    it('should resolve alias within imported operations', function () {
        const tokens = read('alias-and-import.json');
        expect(tokens['font-size-2'].$value).to.equal('{typography.base-size}');
        const resolved = tokenOperations(tokens);
        expect(resolved['font-size-2'].$value).to.equal('calc(1.5625 * 1rem)');
    });

    it('should allow multiple imported operations', function () {
        const tokens = read('multi-import.json');
        expect(tokens['on-primary-color'].$value).to.equal('{color.light}');
        const resolved = tokenOperations(tokens);
        expect(resolved['on-primary-color'].$value).to.equal('black');
    });
});

