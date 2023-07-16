import { expect } from 'chai';
import { executeOperation as execute } from '../src/core.js';

describe('library', function () {

    describe('math-if-string', function () {
        it('should return true value', function () {
            const operation = ['Import.operations', '../lib/math-if-string', 1, 'yes', 'no']
            const result = execute(operation);
            expect(result).to.equal('yes');
        });

        it('should return false value', function () {
            const operation = ['Import.operations', '../lib/math-if-string', 0, 'yes', 'no']
            const result = execute(operation);
            expect(result).to.equal('no');
        });
    });

    describe('yiq-hex-color', function () {
        it('should return YIQ value', function () {
            const operation = ['Import.operations', '../lib/yiq-hex-color', '#ffcc00'];
            const result = execute(operation);
            expect(result).to.equal(195.993);
        });
    });
});

