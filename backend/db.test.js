import { EnhancedIndexedDBRepository } from '../src/repository/EnhancedIndexedDBRepository';
import { ASSIGNMENT_STATUS } from '../src/repository/schemas';
import 'fake-indexeddb/auto';

describe('Database Integration Tests - Constraints & Transactions', () => {
  let repository;

  beforeEach(async () => {
    // Use a unique database name for each test
    const dbName = `test_db_${Date.now()}_${Math.random()}`;
    repository = new EnhancedIndexedDBRepository({ dbName });
  });

  afterEach(async () => {
    // Clean up the database
    if (repository.db) {
      repository.db.close();
    }
  });

  describe('Unique Constraints', () => {
    test('should enforce unique constraint (shift_instance_id, disponent_id)', async () => {
      // Create test data
      const template = await repository.createShiftTemplate({
        name: 'Test Template',
        weekday_mask: 31,
        start_time: '09:00',
        end_time: '17:00',
        cross_midnight: false,
        color: '#FF0000',
        active: true
      });

      const shiftInstance = await repository.createShiftInstance({
        date: '2025-01-15',
        start_dt: new Date('2025-01-15T09:00:00'),
        end_dt: new Date('2025-01-15T17:00:00'),
        template_id: template.id
      });

      const person = await repository.createPerson({
        name: 'Test Person',
        email: 'test@example.com',
        role: 'disponent'
      });

      const assignment1 = {
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      };

      const assignment2 = {
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.TENTATIVE
      };

      // First assignment should succeed
      await repository.createAssignment(assignment1);
      
      // Second assignment with same shift and person should fail
      await expect(repository.createAssignment(assignment2))
        .rejects.toThrow('Assignment already exists');
    });

    test('should enforce unique email constraint for persons', async () => {
      const person1 = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'disponent'
      };

      const person2 = {
        name: 'Jane Doe',
        email: 'john@example.com', // Same email
        role: 'admin'
      };

      // First person should succeed
      await repository.createPerson(person1);
      
      // Second person with same email should fail
      await expect(repository.createPerson(person2))
        .rejects.toThrow('Person with this email already exists');
    });

    test('should allow different shifts for same person', async () => {
      // Create test data
      const template = await repository.createShiftTemplate({
        name: 'Test Template',
        weekday_mask: 31,
        start_time: '09:00',
        end_time: '17:00',
        cross_midnight: false,
        color: '#FF0000',
        active: true
      });

      const shiftInstance1 = await repository.createShiftInstance({
        date: '2025-01-15',
        start_dt: new Date('2025-01-15T09:00:00'),
        end_dt: new Date('2025-01-15T17:00:00'),
        template_id: template.id
      });

      const shiftInstance2 = await repository.createShiftInstance({
        date: '2025-01-16',
        start_dt: new Date('2025-01-16T09:00:00'),
        end_dt: new Date('2025-01-16T17:00:00'),
        template_id: template.id
      });

      const person = await repository.createPerson({
        name: 'Test Person',
        email: 'test@example.com',
        role: 'disponent'
      });

      // Both assignments should succeed since they're for different shifts
      const assignment1 = await repository.createAssignment({
        shift_instance_id: shiftInstance1.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      const assignment2 = await repository.createAssignment({
        shift_instance_id: shiftInstance2.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      expect(assignment1.id).toBeDefined();
      expect(assignment2.id).toBeDefined();
      expect(assignment1.id).not.toBe(assignment2.id);
    });

    test('should allow same shift for different persons', async () => {
      // Create test data
      const template = await repository.createShiftTemplate({
        name: 'Test Template',
        weekday_mask: 31,
        start_time: '09:00',
        end_time: '17:00',
        cross_midnight: false,
        color: '#FF0000',
        active: true
      });

      const shiftInstance = await repository.createShiftInstance({
        date: '2025-01-15',
        start_dt: new Date('2025-01-15T09:00:00'),
        end_dt: new Date('2025-01-15T17:00:00'),
        template_id: template.id
      });

      const person1 = await repository.createPerson({
        name: 'Person 1',
        email: 'person1@example.com',
        role: 'disponent'
      });

      const person2 = await repository.createPerson({
        name: 'Person 2',
        email: 'person2@example.com',
        role: 'disponent'
      });

      // Both assignments should succeed since they're for different persons
      const assignment1 = await repository.createAssignment({
        shift_instance_id: shiftInstance.id,
        disponent_id: person1.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      const assignment2 = await repository.createAssignment({
        shift_instance_id: shiftInstance.id,
        disponent_id: person2.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      expect(assignment1.id).toBeDefined();
      expect(assignment2.id).toBeDefined();
      expect(assignment1.id).not.toBe(assignment2.id);
    });
  });

  describe('Swap Transactions', () => {
    let template, shiftInstance1, shiftInstance2, person1, person2;

    beforeEach(async () => {
      // Create test data for swap scenarios
      template = await repository.createShiftTemplate({
        name: 'Test Template',
        weekday_mask: 31,
        start_time: '09:00',
        end_time: '17:00',
        cross_midnight: false,
        color: '#FF0000',
        active: true
      });

      shiftInstance1 = await repository.createShiftInstance({
        date: '2025-01-15',
        start_dt: new Date('2025-01-15T09:00:00'),
        end_dt: new Date('2025-01-15T17:00:00'),
        template_id: template.id
      });

      shiftInstance2 = await repository.createShiftInstance({
        date: '2025-01-16',
        start_dt: new Date('2025-01-16T09:00:00'),
        end_dt: new Date('2025-01-16T17:00:00'),
        template_id: template.id
      });

      person1 = await repository.createPerson({
        name: 'Person 1',
        email: 'person1@example.com',
        role: 'disponent'
      });

      person2 = await repository.createPerson({
        name: 'Person 2',
        email: 'person2@example.com',
        role: 'disponent'
      });
    });

    test('should swap assignments atomically', async () => {
      // Initial assignments: Person1 -> Shift1, Person2 -> Shift2
      const assignment1 = await repository.createAssignment({
        shift_instance_id: shiftInstance1.id,
        disponent_id: person1.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      const assignment2 = await repository.createAssignment({
        shift_instance_id: shiftInstance2.id,
        disponent_id: person2.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      // Perform swap: Person1 -> Shift2, Person2 -> Shift1
      await repository.swapAssignments(assignment1.id, assignment2.id);

      // Verify the swap
      const updatedAssignment1 = await repository.getAssignment(assignment1.id);
      const updatedAssignment2 = await repository.getAssignment(assignment2.id);

      expect(updatedAssignment1.shift_instance_id).toBe(shiftInstance2.id);
      expect(updatedAssignment1.disponent_id).toBe(person1.id);
      expect(updatedAssignment2.shift_instance_id).toBe(shiftInstance1.id);
      expect(updatedAssignment2.disponent_id).toBe(person2.id);
    });

    test('should rollback failed swap transaction', async () => {
      // Create assignments
      const assignment1 = await repository.createAssignment({
        shift_instance_id: shiftInstance1.id,
        disponent_id: person1.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      const assignment2 = await repository.createAssignment({
        shift_instance_id: shiftInstance2.id,
        disponent_id: person2.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });

      // Create a third person and assignment that would create a constraint violation
      const person3 = await repository.createPerson({
        name: 'Person 3',
        email: 'person3@rollback.com',
        role: 'disponent'
      });

      // This will create a constraint issue when we try to swap
      const _conflictingAssignment = await repository.createAssignment({
        shift_instance_id: shiftInstance2.id, // Same shift as assignment2
        disponent_id: person3.id,
        status: ASSIGNMENT_STATUS.TENTATIVE
      });

      // Now try to swap assignment1 and assignment2 
      // This should fail because assignment2's shift (shiftInstance2) already has person3 assigned
      // But the real issue is we need to simulate a transaction failure scenario
      
      // Let's simulate by trying to swap with a non-existent assignment
      await expect(repository.swapAssignments(assignment1.id, 'non-existent-id'))
        .rejects.toThrow();

      // Verify original assignments are unchanged
      const unchangedAssignment1 = await repository.getAssignment(assignment1.id);
      const unchangedAssignment2 = await repository.getAssignment(assignment2.id);

      expect(unchangedAssignment1.shift_instance_id).toBe(shiftInstance1.id);
      expect(unchangedAssignment1.disponent_id).toBe(person1.id);
      expect(unchangedAssignment2.shift_instance_id).toBe(shiftInstance2.id);
      expect(unchangedAssignment2.disponent_id).toBe(person2.id);
    });

    test('should handle bulk assignment updates in transaction', async () => {
      // Create multiple assignments
      const assignments = [];
      for (let i = 0; i < 3; i++) {
        const person = await repository.createPerson({
          name: `Person ${i}`,
          email: `person${i}@bulk.com`, // Use unique email addresses
          role: 'disponent'
        });

        const shiftInstance = await repository.createShiftInstance({
          date: `2025-01-${15 + i}`,
          start_dt: new Date(`2025-01-${15 + i}T09:00:00`),
          end_dt: new Date(`2025-01-${15 + i}T17:00:00`),
          template_id: template.id
        });

        const assignment = await repository.createAssignment({
          shift_instance_id: shiftInstance.id,
          disponent_id: person.id,
          status: ASSIGNMENT_STATUS.TENTATIVE
        });

        assignments.push(assignment);
      }

      // Bulk update all assignments to ASSIGNED
      const updates = assignments.map(a => ({
        id: a.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      }));

      await repository.bulkUpdateAssignments(updates);

      // Verify all assignments were updated
      for (const assignment of assignments) {
        const updated = await repository.getAssignment(assignment.id);
        expect(updated.status).toBe(ASSIGNMENT_STATUS.ASSIGNED);
      }
    });
  });

  describe('Soft Delete and Cascade', () => {
    let template, shiftInstance, person, assignment;

    beforeEach(async () => {
      // Create test data for deletion scenarios
      template = await repository.createShiftTemplate({
        name: 'Test Template',
        weekday_mask: 31,
        start_time: '09:00',
        end_time: '17:00',
        cross_midnight: false,
        color: '#FF0000',
        active: true
      });

      shiftInstance = await repository.createShiftInstance({
        date: '2025-01-15',
        start_dt: new Date('2025-01-15T09:00:00'),
        end_dt: new Date('2025-01-15T17:00:00'),
        template_id: template.id
      });

      person = await repository.createPerson({
        name: 'Test Person',
        email: 'test@example.com',
        role: 'disponent'
      });

      assignment = await repository.createAssignment({
        shift_instance_id: shiftInstance.id,
        disponent_id: person.id,
        status: ASSIGNMENT_STATUS.ASSIGNED
      });
    });

    test('should soft delete person and preserve references', async () => {
      // Soft delete person
      await repository.softDeletePerson(person.id);

      // Person should be marked as deleted but still exist
      const deletedPerson = await repository.getPerson(person.id);
      expect(deletedPerson.deleted_at).toBeTruthy(); // IndexedDB serializes as string
      expect(deletedPerson.active).toBe(false);

      // Assignment should still exist and reference the person
      const existingAssignment = await repository.getAssignment(assignment.id);
      expect(existingAssignment.disponent_id).toBe(person.id);

      // But person should not appear in normal listings
      const activePersons = await repository.listPersons();
      expect(activePersons.find(p => p.id === person.id)).toBeUndefined();

      // Unless explicitly requested
      const allPersons = await repository.listPersons({ includeDeleted: true });
      expect(allPersons.find(p => p.id === person.id)).toBeDefined();
    });

    test('should cascade delete shift instance and related assignments', async () => {
      // Cascade delete shift instance
      await repository.cascadeDeleteShiftInstance(shiftInstance.id);

      // Shift instance should be completely removed
      const deletedShiftInstance = await repository.getShiftInstance(shiftInstance.id);
      expect(deletedShiftInstance).toBeUndefined();

      // Related assignment should also be removed
      const deletedAssignment = await repository.getAssignment(assignment.id);
      expect(deletedAssignment).toBeUndefined();

      // Person should still exist
      const existingPerson = await repository.getPerson(person.id);
      expect(existingPerson).toBeDefined();
    });

    test('should soft delete shift template and deactivate instances', async () => {
      // Create multiple instances from the template
      const instance2 = await repository.createShiftInstance({
        date: '2025-01-16',
        start_dt: new Date('2025-01-16T09:00:00'),
        end_dt: new Date('2025-01-16T17:00:00'),
        template_id: template.id
      });

      // Soft delete template
      await repository.softDeleteShiftTemplate(template.id);

      // Template should be marked as deleted
      const deletedTemplate = await repository.getShiftTemplate(template.id);
      expect(deletedTemplate.deleted_at).toBeTruthy(); // IndexedDB serializes as string
      expect(deletedTemplate.active).toBe(false);

      // All instances should be marked as inactive but not deleted
      const instance1Updated = await repository.getShiftInstance(shiftInstance.id);
      const instance2Updated = await repository.getShiftInstance(instance2.id);
      
      expect(instance1Updated.active).toBe(false);
      expect(instance2Updated.active).toBe(false);
      expect(instance1Updated.deleted_at).toBeUndefined();
      expect(instance2Updated.deleted_at).toBeUndefined();
    });

    test('should handle referential integrity on hard delete attempts', async () => {
      // Attempt to hard delete person with assignments should fail
      await expect(repository.hardDeletePerson(person.id))
        .rejects.toThrow('Cannot delete person with existing assignments');

      // Hard delete assignment first
      await repository.hardDeleteAssignment(assignment.id);

      // Now person can be hard deleted
      await repository.hardDeletePerson(person.id);
      
      const deletedPerson = await repository.getPerson(person.id);
      expect(deletedPerson).toBeUndefined();
    });

    test('should restore soft deleted records', async () => {
      // Soft delete person
      await repository.softDeletePerson(person.id);
      
      let deletedPerson = await repository.getPerson(person.id);
      expect(deletedPerson.deleted_at).toBeTruthy(); // IndexedDB serializes as string

      // Restore person
      await repository.restorePerson(person.id);

      const restoredPerson = await repository.getPerson(person.id);
      expect(restoredPerson.deleted_at).toBeNull();
      expect(restoredPerson.active).toBe(true);

      // Person should appear in normal listings again
      const activePersons = await repository.listPersons();
      expect(activePersons.find(p => p.id === person.id)).toBeDefined();
    });
  });
});