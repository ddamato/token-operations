import { expect } from 'chai';
import { executeOperation as execute } from '../src/core.js';

describe('library', function () {

    describe('math-if-string', function () {
        it('should return true value', function () {
            const operation = ['Import.operations', '../lib/math-if-string.json', 1, 'yes', 'no']
            const result = execute(operation);
            expect(result).to.equal('yes');
        });

        it('should return false value', function () {
            const operation = ['Import.operations', '../lib/math-if-string.json', 0, 'yes', 'no']
            const result = execute(operation);
            expect(result).to.equal('no');
        });
    });

    describe('yiq-hex-color', function () {
        it('should return YIQ value', function () {
            const operation = ['Import.operations', '../lib/yiq-hex-color.json', '#ffcc00'];
            const result = execute(operation);
            expect(result).to.equal(195.993);
        });
    });
});

