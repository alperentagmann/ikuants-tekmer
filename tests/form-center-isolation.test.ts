/**
 * Central Form Platform, form versioning and Program / TEKMER isolation.
 * All records created here use the "qa-fc-" marker and are removed by exact id.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../lib/prisma';
import { FormService } from '../lib/services/form-service';
import { FormSubmissionService } from '../lib/services/form-submission-service';
import { ApplicationCampaignService } from '../lib/services/application-campaign-service';
import { ApplicationService } from '../lib/services/application-service';
import { validateSubmission, isFieldVisible, validateFormDefinition, isSafePattern, FormFieldDefinition } from '../lib/forms/schema';
import { decryptTcNumber } from '../lib/security/identity-security';

const RUN = `qa-fc-${Date.now().toString(36)}`;
const created = { forms: [] as string[], campaigns: [] as string[], applications: [] as string[], submissions: [] as string[], spaceAssignments: [] as string[], entrepreneurs: [] as string[], programAssignments: [] as string[], programs: [] as string[] };
let actor: { id: string; name: string; email: string };
const VALID_TC = '10000000146';

function baseFields(extra: FormFieldDefinition[] = []): FormFieldDefinition[] {
    return [
        { fieldKey: 'fullName', label: 'Ad Soyad', fieldType: 'TEXT', isRequired: true, stepNumber: 1, uiConfig: { systemKey: 'applicant_name' } },
        { fieldKey: 'email', label: 'E-posta', fieldType: 'EMAIL', isRequired: true, stepNumber: 1 },
        { fieldKey: 'hasCompany', label: 'Şirketiniz var mı?', fieldType: 'RADIO', isRequired: true, stepNumber: 1, options: [{ label: 'Evet', value: 'Evet' }, { label: 'Hayır', value: 'Hayır' }] },
        { fieldKey: 'companyName', label: 'Şirket adı', fieldType: 'TEXT', isRequired: true, stepNumber: 1, conditionalRules: { logic: 'ALL', rules: [{ fieldKey: 'hasCompany', operator: 'equals', value: 'Evet' }] }, uiConfig: { systemKey: 'company_name' } },
        { fieldKey: 'tcNo', label: 'T.C. Kimlik No', fieldType: 'TC_NO', isRequired: false, stepNumber: 1 },
        { fieldKey: 'consent', label: 'Aydınlatma metnini okudum.', fieldType: 'CONSENT', isRequired: true, stepNumber: 1, uiConfig: { consentKind: 'PRIVACY_NOTICE' } },
        ...extra,
    ];
}

async function createPublishedForm(suffix: string, formType: string, extra: FormFieldDefinition[] = []) {
    const { form } = await FormService.createForm({ title: `${RUN} ${suffix}`, slug: `${RUN}-${suffix}`, formType, sections: [{ stepNumber: 1, title: 'Bölüm 1' }], fields: baseFields(extra) }, actor);
    created.forms.push(form.id);
    await FormService.publishDraft(form.id, actor);
    return form;
}

const OLD = () => ({ _ts: Date.now() - 10_000 });

describe('Central Form Platform & Program/TEKMER isolation', () => {
    let programForm: { id: string; slug: string };
    let tekmerForm: { id: string; slug: string };
    let programCampaignId: string;
    let tekmerCampaignId: string;
    let programId: string;

    before(async () => {
        const user = await prisma.user.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } });
        assert.ok(user, 'A user is required for audit actor');
        actor = { id: user.id, name: user.name, email: user.email };

        const program = await prisma.program.create({ data: { name: `${RUN} Program`, slug: `${RUN}-program` } as never });
        created.programs.push(program.id);
        programId = program.id;

        programForm = await createPublishedForm('program', 'PROGRAM_APPLICATION');
        tekmerForm = await createPublishedForm('tekmer', 'TEKMER_APPLICATION', [
            { fieldKey: 'workspace', label: 'Alan ihtiyacı', fieldType: 'SELECT', isRequired: true, stepNumber: 1, options: [{ label: 'Kapalı Ofis', value: 'Kapalı Ofis' }, { label: 'Açık Alan / Masa', value: 'Açık Alan / Masa' }] },
        ]);

        const pc = await ApplicationCampaignService.create({ name: `${RUN} Program Kampanyası`, slug: `${RUN}-program-kampanya`, applicationType: 'PROGRAM', programId, formId: programForm.id, status: 'OPEN' }, actor);
        const tc = await ApplicationCampaignService.create({ name: `${RUN} TEKMER Kampanyası`, slug: `${RUN}-tekmer-kampanya`, applicationType: 'TEKMER', formId: tekmerForm.id, status: 'OPEN' }, actor);
        programCampaignId = pc!.id;
        tekmerCampaignId = tc!.id;
        created.campaigns.push(programCampaignId, tekmerCampaignId);
    });

    after(async () => {
        await prisma.spaceAssignment.deleteMany({ where: { id: { in: created.spaceAssignments } } });
        await prisma.entrepreneurProgram.deleteMany({ where: { id: { in: created.programAssignments } } });
        const apps = await prisma.application.findMany({ where: { id: { in: created.applications } }, select: { id: true, submissionId: true } });
        await prisma.applicationStatusHistory.deleteMany({ where: { applicationId: { in: apps.map((a) => a.id) } } });
        await prisma.activityTimeline.deleteMany({ where: { entityId: { in: apps.map((a) => a.id) } } });
        await prisma.emailOutbox.deleteMany({ where: { entityId: { in: apps.map((a) => a.id) } } });
        await prisma.application.deleteMany({ where: { id: { in: apps.map((a) => a.id) } } });
        await prisma.submission.deleteMany({ where: { id: { in: [...created.submissions, ...apps.map((a) => a.submissionId)] } } });
        await prisma.submission.deleteMany({ where: { formId: { in: created.forms } } });
        await prisma.applicationCampaign.deleteMany({ where: { id: { in: created.campaigns } } });
        await prisma.form.deleteMany({ where: { id: { in: created.forms } } });
        await prisma.entrepreneur.deleteMany({ where: { id: { in: created.entrepreneurs } } });
        await prisma.program.deleteMany({ where: { id: { in: created.programs } } });
        await prisma.notification.deleteMany({ where: { message: { contains: RUN } } });
    });

    test('Form engine: conditional fields, validation and unknown keys', () => {
        const fields = baseFields();
        assert.strictEqual(isFieldVisible(fields[3], { hasCompany: 'Hayır' }), false);
        assert.strictEqual(isFieldVisible(fields[3], { hasCompany: 'Evet' }), true);

        const hidden = validateSubmission(fields, { fullName: 'A B', email: 'a@b.co', hasCompany: 'Hayır', consent: true, injected: 'x' });
        assert.ok(hidden.isValid, 'Hidden required field must not block submission');
        assert.strictEqual(hidden.cleaned.injected, undefined, 'Unknown keys are dropped');
        assert.strictEqual(hidden.cleaned.companyName, undefined, 'Hidden field values are dropped');

        const visible = validateSubmission(fields, { fullName: 'A B', email: 'a@b.co', hasCompany: 'Evet', consent: true });
        assert.ok(visible.errors.companyName, 'Visible required field is enforced');

        const bad = validateSubmission(fields, { fullName: 'A', email: 'not-an-email', hasCompany: 'Belki', tcNo: '12345678901', consent: false });
        assert.ok(bad.errors.email && bad.errors.hasCompany && bad.errors.tcNo && bad.errors.consent);
    });

    test('Form definition: unsafe regex, duplicate keys and broken conditions are rejected', () => {
        assert.strictEqual(isSafePattern('(a+)+$'), false);
        assert.strictEqual(isSafePattern('^[0-9]{10}$'), true);
        const problems = validateFormDefinition([
            { fieldKey: 'a', label: 'A', fieldType: 'TEXT' },
            { fieldKey: 'a', label: 'A2', fieldType: 'TEXT' },
            { fieldKey: 'b', label: 'B', fieldType: 'SELECT', options: [] },
            { fieldKey: 'c', label: 'C', fieldType: 'TEXT', conditionalRules: { logic: 'ALL', rules: [{ fieldKey: 'missing', operator: 'equals', value: 'x' }] } },
        ]);
        assert.ok(problems.length >= 3, problems.join(' | '));
    });

    test('Versioning: published version is immutable, drafts create new versions, history stays linked', async () => {
        const before = await FormService.getFormDetail(programForm.id);
        const v1 = before!.versions.find((v) => v.status === 'PUBLISHED')!;

        const submission = await FormSubmissionService.submitPublicForm(programForm.slug, { fullName: 'Versiyon Test', email: `${RUN}-v@example.com`, hasCompany: 'Hayır', consent: true, ...OLD() });
        const sub = await prisma.submission.findUnique({ where: { submissionNumber: submission.submissionNumber } });
        assert.strictEqual(sub!.formVersionId, v1.id);
        if (submission.applicationNumber) {
            const app = await prisma.application.findUnique({ where: { applicationNumber: submission.applicationNumber } });
            created.applications.push(app!.id);
        }

        const draft = await FormService.saveDraft(programForm.id, {
            sections: before!.editing.sections,
            fields: [...before!.editing.fields, { fieldKey: 'newQuestion', label: 'Yeni soru', fieldType: 'TEXT', stepNumber: 1 }],
        }, actor);
        assert.strictEqual(draft.versionNumber, v1.versionNumber + 1);

        const publicBefore = await FormService.getPublishedFormBySlug(programForm.slug);
        assert.ok(!publicBefore!.fields.some((f) => f.fieldKey === 'newQuestion'), 'Draft changes are not visible publicly');

        await FormService.publishDraft(programForm.id, actor);
        const publicAfter = await FormService.getPublishedFormBySlug(programForm.slug);
        assert.ok(publicAfter!.fields.some((f) => f.fieldKey === 'newQuestion'), 'Published question is visible publicly');

        const oldVersion = await prisma.formVersion.findUnique({ where: { id: v1.id }, include: { fields: true } });
        assert.strictEqual(oldVersion!.status, 'ARCHIVED');
        assert.ok(!oldVersion!.fields.some((f) => f.fieldKey === 'newQuestion'), 'Old version fields are unchanged');
        const subAfter = await prisma.submission.findUnique({ where: { id: sub!.id } });
        assert.strictEqual(subAfter!.formVersionId, v1.id, 'Historic submission stays on its version');
    });

    test('Program submission creates a PROGRAM application targeting the campaign program', async () => {
        const result = await FormSubmissionService.submitPublicForm(programForm.slug, { fullName: 'Program Başvuran', email: `${RUN}-p@example.com`, hasCompany: 'Evet', companyName: 'QA Girişim', consent: true, ...OLD() });
        const app = await prisma.application.findUnique({ where: { applicationNumber: result.applicationNumber! } });
        created.applications.push(app!.id);
        assert.strictEqual(app!.applicationType, 'PROGRAM');
        assert.strictEqual(app!.campaignId, programCampaignId);
        assert.strictEqual(app!.programId, programId);
        assert.ok(app!.applicationNumber.startsWith('PRG-'));
    });

    test('TEKMER submission creates a TEKMER application with no program target; T.C. is masked and encrypted', async () => {
        const result = await FormSubmissionService.submitPublicForm(tekmerForm.slug, { fullName: 'TEKMER Başvuran', email: `${RUN}-t@example.com`, hasCompany: 'Hayır', tcNo: VALID_TC, workspace: 'Kapalı Ofis', consent: true, ...OLD() });
        const app = await prisma.application.findUnique({ where: { applicationNumber: result.applicationNumber! }, include: { submission: { include: { answers: true } } } });
        created.applications.push(app!.id);
        assert.strictEqual(app!.applicationType, 'TEKMER');
        assert.strictEqual(app!.campaignId, tekmerCampaignId);
        assert.strictEqual(app!.programId, null, 'TEKMER applications never target a program');
        assert.ok(app!.applicationNumber.startsWith('TKM-'));
        assert.notStrictEqual(app!.tcNumberEncrypted, VALID_TC, 'T.C. must not be stored in plaintext');
        assert.strictEqual(decryptTcNumber(app!.tcNumberEncrypted), VALID_TC);
        const tcAnswer = app!.submission.answers.find((a) => a.fieldKey === 'tcNo');
        assert.ok(tcAnswer && !tcAnswer.textValue!.includes('0000000'), 'Stored answer is masked');
        assert.ok(!app!.submission.rawSnapshot.includes(VALID_TC), 'Raw snapshot is masked');
    });

    test('Form isolation: a form can belong to one campaign only; editing one form does not change another', async () => {
        await assert.rejects(
            () => ApplicationCampaignService.create({ name: `${RUN} Çakışma`, slug: `${RUN}-cakisma`, applicationType: 'PROGRAM', programId, formId: tekmerForm.id }, actor),
            /kullanılıyor/
        );
        const tekmerBefore = await FormService.getPublishedFormBySlug(tekmerForm.slug);
        const programDetail = await FormService.getFormDetail(programForm.id);
        await FormService.saveDraft(programForm.id, { sections: programDetail!.editing.sections, fields: [...programDetail!.editing.fields, { fieldKey: 'onlyProgram', label: 'Yalnız program', fieldType: 'TEXT', stepNumber: 1 }] }, actor);
        await FormService.publishDraft(programForm.id, actor);
        const tekmerAfter = await FormService.getPublishedFormBySlug(tekmerForm.slug);
        assert.deepStrictEqual(tekmerAfter!.fields.map((f) => f.fieldKey), tekmerBefore!.fields.map((f) => f.fieldKey), 'FORM CROSS-CONTAMINATION must be 0');
        assert.strictEqual(tekmerAfter!.versionNumber, tekmerBefore!.versionNumber);
    });

    test('TEKMER campaigns cannot target a program; PROGRAM campaigns require one', async () => {
        await assert.rejects(() => ApplicationCampaignService.create({ name: 'x', slug: `${RUN}-x1`, applicationType: 'TEKMER', programId }, actor), /programa bağlanamaz/);
        await assert.rejects(() => ApplicationCampaignService.create({ name: 'x', slug: `${RUN}-x2`, applicationType: 'PROGRAM' }, actor), /program seçilmelidir/);
    });

    test('Workflow isolation: stages are validated per campaign; editing one workflow leaves the other unchanged', async () => {
        const tekmerApp = await prisma.application.findFirst({ where: { campaignId: tekmerCampaignId } });
        await assert.rejects(() => ApplicationService.updateStatus({ applicationId: tekmerApp!.id, toStatus: 'JURY', actor }), /iş akışında tanımlı değil/);

        const program = await ApplicationCampaignService.get(programCampaignId);
        const tekmerBefore = await ApplicationCampaignService.get(tekmerCampaignId);
        await ApplicationCampaignService.update(programCampaignId, {
            name: program!.name, slug: program!.slug, applicationType: 'PROGRAM', programId, formId: programForm.id, status: 'OPEN',
            workflowStages: [...program!.workflowStages, { key: 'CONTRACT', label: 'Sözleşme', order: 99 }],
        }, actor);
        const tekmerAfter = await ApplicationCampaignService.get(tekmerCampaignId);
        assert.deepStrictEqual(tekmerAfter!.workflowStages, tekmerBefore!.workflowStages, 'WORKFLOW CROSS-CONTAMINATION must be 0');
    });

    test('Accepted program application: explicit assignment only; TEKMER cannot be assigned to a program', async () => {
        const programApp = await prisma.application.findFirst({ where: { campaignId: programCampaignId, id: { in: created.applications } } });
        await assert.rejects(() => ApplicationService.assignAcceptedToProgram({ applicationId: programApp!.id, newEntrepreneur: { name: `${RUN} Girişim` }, actor }), /kabul edilmiş/);

        await ApplicationService.updateStatus({ applicationId: programApp!.id, toStatus: 'ACCEPTED', actor });
        const stillUnassigned = await prisma.entrepreneurProgram.count({ where: { programId } });
        assert.strictEqual(stillUnassigned, 0, 'No automatic program assignment on acceptance');

        const result = await ApplicationService.assignAcceptedToProgram({ applicationId: programApp!.id, newEntrepreneur: { name: `${RUN} Girişim` }, actor });
        created.entrepreneurs.push(result.entrepreneurId);
        created.programAssignments.push(result.assignmentId);
        const assignment = await prisma.entrepreneurProgram.findUnique({ where: { id: result.assignmentId } });
        assert.strictEqual(assignment!.programId, programId);

        const tekmerApp = await prisma.application.findFirst({ where: { campaignId: tekmerCampaignId } });
        await assert.rejects(() => ApplicationService.assignAcceptedToProgram({ applicationId: tekmerApp!.id, newEntrepreneur: { name: 'x' }, actor }), /programa atanamaz/);
    });

    test('Accepted TEKMER application: explicit space assignment process; no program membership, contract or rent is created', async () => {
        const tekmerApp = await prisma.application.findFirst({ where: { campaignId: tekmerCampaignId } });
        await ApplicationService.updateStatus({ applicationId: tekmerApp!.id, toStatus: 'ACCEPTED', actor });
        const facility = await prisma.facility.findFirst();
        const rentBefore = await prisma.rentContract.count();
        const programBefore = await prisma.entrepreneurProgram.count();

        const assignment = await ApplicationService.startSpaceAssignment({ applicationId: tekmerApp!.id, facilityId: facility!.id, actor });
        created.spaceAssignments.push(assignment.id);
        assert.strictEqual(assignment.status, 'PLANNED');
        assert.strictEqual(await prisma.rentContract.count(), rentBefore, 'No automatic RentContract');
        assert.strictEqual(await prisma.entrepreneurProgram.count(), programBefore, 'No automatic program membership');

        const programApp = await prisma.application.findFirst({ where: { campaignId: programCampaignId, id: { in: created.applications } } });
        await assert.rejects(() => ApplicationService.startSpaceAssignment({ applicationId: programApp!.id, facilityId: facility!.id, actor }), /yalnız TEKMER/);
    });

    test('Public submission protection: honeypot, minimum fill time and idempotency', async () => {
        await assert.rejects(() => FormSubmissionService.submitPublicForm(programForm.slug, { fullName: 'Bot', email: 'b@b.co', hasCompany: 'Hayır', consent: true, _hp: 'spam', ...OLD() }), /reddedildi/);
        await assert.rejects(() => FormSubmissionService.submitPublicForm(programForm.slug, { fullName: 'Hızlı', email: 'h@b.co', hasCompany: 'Hayır', consent: true, _ts: Date.now() }), /hızlı/);

        const key = `${RUN}-idem`;
        const first = await FormSubmissionService.submitPublicForm(programForm.slug, { fullName: 'Tekrar', email: `${RUN}-i@example.com`, hasCompany: 'Hayır', consent: true, ...OLD() }, { idempotencyKey: key });
        const second = await FormSubmissionService.submitPublicForm(programForm.slug, { fullName: 'Tekrar', email: `${RUN}-i@example.com`, hasCompany: 'Hayır', consent: true, ...OLD() }, { idempotencyKey: key });
        assert.strictEqual(second.submissionNumber, first.submissionNumber);
        assert.strictEqual(second.duplicate, true);
        const app = await prisma.application.findUnique({ where: { applicationNumber: first.applicationNumber! } });
        created.applications.push(app!.id);
    });

    test('Closed campaign rejects new submissions', async () => {
        await ApplicationCampaignService.setStatus(tekmerCampaignId, 'CLOSED', actor);
        await assert.rejects(() => FormSubmissionService.submitPublicForm(tekmerForm.slug, { fullName: 'Geç', email: 'g@b.co', hasCompany: 'Hayır', workspace: 'Kapalı Ofis', consent: true, ...OLD() }), /kapalı/);
    });
});
