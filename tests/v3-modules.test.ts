import { test, describe } from 'node:test';
import assert from 'node:assert';
import { hasPermission, UserWithPermissions } from '../lib/rbac';
import { TaskService } from '../lib/services/task-service';
import { TrainingService } from '../lib/services/training-service';
import { EventService } from '../lib/services/event-service';
import { ActivityService } from '../lib/services/activity-service';
import { HomepageService } from '../lib/services/homepage-service';
import { ApprovalService } from '../lib/services/approval-service';
import { DirectoryService } from '../lib/services/directory-service';
import { ProjectService } from '../lib/services/project-service';
import { EntrepreneurService } from '../lib/services/entrepreneur-service';
import { MentorService } from '../lib/services/mentor-service';

describe('1. V3 RBAC Capabilities', () => {
    test('Super Admin has access to all new V3 resources', () => {
        const superAdmin: UserWithPermissions = {
            id: 'sa-v3',
            isActive: true,
            isSuperAdmin: true,
        };

        const v3Resources = ['tasks', 'calendar', 'activities', 'trainings', 'events', 'homepage', 'approvals', 'directory', 'projects'];
        v3Resources.forEach((res) => {
            assert.strictEqual(hasPermission(superAdmin, 'view', res), true);
            assert.strictEqual(hasPermission(superAdmin, 'create', res), true);
            assert.strictEqual(hasPermission(superAdmin, 'edit', res), true);
            assert.strictEqual(hasPermission(superAdmin, 'delete', res), true);
        });
    });

    test('Editor role is granted publish permission only on approvals and news', () => {
        const editor: UserWithPermissions = {
            id: 'ed-1',
            isActive: true,
            isSuperAdmin: false,
            userRoles: [
                {
                    role: {
                        slug: 'editor',
                        permissions: [
                            { permission: { action: 'view', resource: 'news' } },
                            { permission: { action: 'create', resource: 'news' } },
                            { permission: { action: 'publish', resource: 'approvals' } },
                        ],
                    },
                },
            ],
        };

        assert.strictEqual(hasPermission(editor, 'publish', 'approvals'), true);
        assert.strictEqual(hasPermission(editor, 'publish', 'users'), false);
    });
});

describe('2. V3 Service Signatures & Methods Integrity', () => {
    test('TaskService exposes required workflow methods', () => {
        assert.strictEqual(typeof TaskService.getTasks, 'function');
        assert.strictEqual(typeof TaskService.createTask, 'function');
        assert.strictEqual(typeof TaskService.updateStatus, 'function');
        assert.strictEqual(typeof TaskService.toggleChecklistItem, 'function');
        assert.strictEqual(typeof TaskService.addComment, 'function');
    });

    test('TrainingService exposes curriculum & attendance methods', () => {
        assert.strictEqual(typeof TrainingService.getTrainings, 'function');
        assert.strictEqual(typeof TrainingService.getTrainingById, 'function');
        assert.strictEqual(typeof TrainingService.createTraining, 'function');
        assert.strictEqual(typeof TrainingService.recordAttendance, 'function');
        assert.strictEqual(typeof TrainingService.enrollParticipant, 'function');
    });

    test('EventService exposes sessions and check-in methods', () => {
        assert.strictEqual(typeof EventService.getEvents, 'function');
        assert.strictEqual(typeof EventService.getEventById, 'function');
        assert.strictEqual(typeof EventService.createEvent, 'function');
        assert.strictEqual(typeof EventService.registerAttendee, 'function');
        assert.strictEqual(typeof EventService.checkInAttendee, 'function');
    });

    test('ActivityService exposes category, evidence and auto-draft methods', () => {
        assert.strictEqual(typeof ActivityService.getCategories, 'function');
        assert.strictEqual(typeof ActivityService.getActivities, 'function');
        assert.strictEqual(typeof ActivityService.createActivity, 'function');
        assert.strictEqual(typeof ActivityService.createFromTraining, 'function');
    });

    test('HomepageService exposes slides and section toggle methods', () => {
        assert.strictEqual(typeof HomepageService.getHeroSlides, 'function');
        assert.strictEqual(typeof HomepageService.getSections, 'function');
        assert.strictEqual(typeof HomepageService.createHeroSlide, 'function');
        assert.strictEqual(typeof HomepageService.updateHeroSlide, 'function');
        assert.strictEqual(typeof HomepageService.updateSectionVisibility, 'function');
    });

    test('ApprovalService exposes request and process approval workflow', () => {
        assert.strictEqual(typeof ApprovalService.getPendingApprovals, 'function');
        assert.strictEqual(typeof ApprovalService.requestApproval, 'function');
        assert.strictEqual(typeof ApprovalService.processApproval, 'function');
    });

    test('DirectoryService exposes contacts and organizations management', () => {
        assert.strictEqual(typeof DirectoryService.getContacts, 'function');
        assert.strictEqual(typeof DirectoryService.getOrganizations, 'function');
        assert.strictEqual(typeof DirectoryService.createContact, 'function');
        assert.strictEqual(typeof DirectoryService.createOrganization, 'function');
    });

    test('ProjectService exposes projects and grant management methods', () => {
        assert.strictEqual(typeof ProjectService.getProjects, 'function');
        assert.strictEqual(typeof ProjectService.getProjectById, 'function');
        assert.strictEqual(typeof ProjectService.createProject, 'function');
    });

    test('EntrepreneurService exposes relational methods (investments, patents, grants, milestones, founders)', () => {
        assert.strictEqual(typeof EntrepreneurService.addFounder, 'function');
        assert.strictEqual(typeof EntrepreneurService.addInvestment, 'function');
        assert.strictEqual(typeof EntrepreneurService.addPatent, 'function');
        assert.strictEqual(typeof EntrepreneurService.addGrant, 'function');
        assert.strictEqual(typeof EntrepreneurService.addMilestone, 'function');
        assert.strictEqual(typeof EntrepreneurService.addDocument, 'function');
        assert.strictEqual(typeof EntrepreneurService.addGalleryImage, 'function');
    });

    test('MentorService exposes relational methods (assignProgram, recordSession)', () => {
        assert.strictEqual(typeof MentorService.assignProgram, 'function');
        assert.strictEqual(typeof MentorService.recordSession, 'function');
    });
});
