import { test, describe } from 'node:test';
import assert from 'node:assert';
import { TerminologyService } from '../lib/services/terminology-service';
import { CustomFieldService } from '../lib/services/custom-field-service';
import { PipelineService } from '../lib/services/pipeline-service';
import { prisma } from '../lib/prisma';

describe('3. Terminology, Custom Fields & Pipelines', () => {
    test('Terminology service returns fallback when key is not defined, or customized label when defined', async () => {
        const fallback = await TerminologyService.getLabel('non.existent.key', 'Varsayılan Metin');
        assert.strictEqual(fallback, 'Varsayılan Metin', 'Should return fallback if key missing');

        // Seed or update an existing label
        await prisma.terminologyLabel.upsert({
            where: { key: 'custom.test.key' },
            create: {
                key: 'custom.test.key',
                defaultLabel: 'Varsayılan',
                customLabel: 'Özelleştirilmiş Başlık',
                group: 'TEST',
            },
            update: {
                customLabel: 'Özelleştirilmiş Başlık',
            },
        });

        const custom = await TerminologyService.getLabel('custom.test.key', 'Varsayılan');
        assert.strictEqual(custom, 'Özelleştirilmiş Başlık', 'Should return custom value');

        // Cleanup
        await prisma.terminologyLabel.deleteMany({ where: { key: 'custom.test.key' } });
    });

    test('CustomFieldService manages field definitions and entity values', async () => {
        const fieldKey = `testField_${Date.now()}`;
        const definition = await CustomFieldService.createDefinition({
            moduleKey: 'ENTREPRENEUR',
            fieldKey,
            label: 'Test Özel Alan',
            fieldType: 'TEXT',
            isRequired: false,
            isPublic: true,
        });

        assert.ok(definition.id, 'Definition ID must be created');
        assert.strictEqual(definition.fieldKey, fieldKey.toLowerCase());

        // Save value for an entity
        await CustomFieldService.saveFieldValues('ENTREPRENEUR', 'test-ent-1', {
            [definition.fieldKey]: 'Test Alan Değeri',
        });

        const retrieved = await CustomFieldService.getFieldValues('ENTREPRENEUR', 'test-ent-1');
        assert.strictEqual(retrieved.values[definition.fieldKey], 'Test Alan Değeri');

        // Cleanup
        await prisma.customFieldValue.deleteMany({ where: { entityId: 'test-ent-1' } });
        await prisma.customFieldDefinition.delete({ where: { id: definition.id } });
    });

    test('PipelineService validates status transitions correctly', async () => {
        const isValid = await PipelineService.validateTransition(
            'APPLICATION',
            'NEW',
            'UNDER_REVIEW'
        );
        assert.strictEqual(isValid, true, 'Transition from NEW to UNDER_REVIEW should be valid');
    });
});
