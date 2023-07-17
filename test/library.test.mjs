import { expect } from 'chai';
import { executeOperation as execute } from '../src/core.js';

function prepareOperation({ test }, ...args) {
    return ['Import.operations', `../lib/${test.parent.title}`, ...args];
}

describe('library', function () {

    describe('binary-if-string', function () {
        it('should return true value', function () {
            const operation = prepareOperation(this, 1, 'yes', 'no');
            const result = execute(operation);
            expect(result).to.equal('yes');
        });

        it('should return false value', function () {
            const operation = prepareOperation(this, 0, 'yes', 'no');
            const result = execute(operation);
            expect(result).to.equal('no');
        });
    });

    describe('hex-value-alpha-rgba', function () {
        it('should add an alpha amount to hex color', function () {
            const operation = prepareOperation(this, '#ffcc00', 0.2);
            const result = execute(operation);
            expect(result).to.equal('rgba(255,204,0,0.2)');
        });
    });

    describe('hex-value-yiq-color', function () {
        it('should return YIQ value', function () {
            const operation = prepareOperation(this, '#ffcc00');
            const result = execute(operation);
            expect(result).to.equal(195.993);
        });
    });

    describe('typography-scale-rem-calc', function () {
        it('should increase scale at step', function () {
            const operation = prepareOperation(this, 1.25, 2, '1rem');
            const result = execute(operation);
            expect(result).to.equal('calc(1.5625 * 1rem)');
        });
    });
});

