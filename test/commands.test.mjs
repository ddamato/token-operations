import { expect } from 'chai';
import { executeOperation as execute } from '../src/core.js';

describe('commands', function () {

    it('should pass context', function () {
        const operation = ['Math.add', '$value', '$0'];
        const result = execute(operation, { $value: 3, $0: 2 });
        expect(result).to.equal(5);
    });

    describe('Number', function () {
        it('should extend Number', function () {
            const operation = ['Number.parseInt', 'FF', 16];
            const result = execute(operation);
            expect(result).to.equal(255);
        });
    });

    describe('Math', function () {
        it('should extend Math', function () {
            const operation = ['Math.max', 2, 12, 7];
            const result = execute(operation);
            expect(result).to.equal(12);
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
    });

    describe('String', function () {
        it('should extend String', function () {
            const operation = ['String.trim', ' hello world '];
            const result = execute(operation);
            expect(result).to.equal('hello world');
        });

        it('should String.capture', function () {
            const operation = ['String.capture', 'hello', '(l)'];
            const result = execute(operation);
            expect(result).to.equal('l');
        });
    });

    describe('Import', function () {
        it('should Import.operations locally', function () {
            const operation = ['Import.operations', '../lib/hex-value-alpha-rgba', "#ffcc00", 0.2]
            const result = execute(operation);
            expect(result).to.equal('rgba(255,204,0,0.2)');
        });

        it('should Import.operations from library', function () {
            const operation = ['Import.operations', 'token-operations/lib/hex-value-alpha-rgba', "#ffcc00", 0.2]
            const result = execute(operation);
            expect(result).to.equal('rgba(255,204,0,0.2)');
        });
    });
});

