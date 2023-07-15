import { expect } from 'chai';

import { executeOperation as execute } from '../src/index.js';

describe('operations', function () {

    describe('Math', function () {
        it('should Math.parseInt', function () {
            const operation = ['Math.parseInt', 'FF', 16];
            const result = execute(operation);
            expect(result).to.equal(255);
        });
    
        it('should Math.add', function () {
            const operation = ['Math.add', 1, -2, 3, 4];
            const result = execute(operation);
            expect(result).to.equal(6);
        });
    
        it('should Math.multiply', function () {
            const operation = ['Math.multiply', 2, -4, 6];
            const result = execute(operation);
            expect(result).to.equal(-48);
        });

        it('should Math.max', function () {
            const operation = ['Math.max', 2, 12, 7];
            const result = execute(operation);
            expect(result).to.equal(12);
        });

        it('should Math.min', function () {
            const operation = ['Math.min', 2, 12, 7];
            const result = execute(operation);
            expect(result).to.equal(2);
        });
    });

    describe('String', function () {
        it('should String.concat', function () {
            const operation = ['String.concat', '|', 'h', 'e', 'l', 'l', 'o'];
            const result = execute(operation);
            expect(result).to.equal('h|e|l|l|o');
        });

        it('should String.capture', function () {
            const operation = ['String.capture', 'hello', '(l)'];
            const result = execute(operation);
            expect(result).to.equal('l');
        });
    });
});

