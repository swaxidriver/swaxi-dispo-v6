import AuditService from '../services/auditService';

describe('AuditService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('logs audit entries correctly', () => {
    const entry = AuditService.logAction(
      'test_action',
      'test@example.com',
      'admin',
      { detail: 'test detail' },
      1
    );

    expect(entry).toBeTruthy();
    expect(entry.action).toBe('test_action');
    expect(entry.actor).toBe('test@example.com');
    expect(entry.role).toBe('admin');
    expect(entry.count).toBe(1);
    expect(entry.type).toBe('other');
  });

  test('determines action types correctly', () => {
    expect(AuditService.getActionType('Created shift')).toBe('create');
    expect(AuditService.getActionType('Updated shift')).toBe('update');
    expect(AuditService.getActionType('Deleted shift')).toBe('delete');
    expect(AuditService.getActionType('Applied for shift')).toBe('apply');
    expect(AuditService.getActionType('Random action')).toBe('other');
  });

  test('retrieves filtered logs correctly', () => {
    // Log different types of actions
    AuditService.logAction('Created shift', 'user1@example.com', 'admin', {}, 1);
    AuditService.logAction('Updated shift', 'user2@example.com', 'chief', {}, 1);
    AuditService.logAction('Applied for shift', 'user3@example.com', 'disponent', {}, 1);

    const allLogs = AuditService.getFilteredLogs('all');
    expect(allLogs).toHaveLength(3);

    const createLogs = AuditService.getFilteredLogs('create');
    expect(createLogs).toHaveLength(1);
    expect(createLogs[0].action).toBe('Created shift');

    const updateLogs = AuditService.getFilteredLogs('update');
    expect(updateLogs).toHaveLength(1);
    expect(updateLogs[0].action).toBe('Updated shift');

    const applyLogs = AuditService.getFilteredLogs('apply');
    expect(applyLogs).toHaveLength(1);
    expect(applyLogs[0].action).toBe('Applied for shift');
  });

  test('implements ring buffer correctly', () => {
    // Simulate reaching the limit by adding more than MAX_AUDIT_ENTRIES
    for (let i = 0; i < 1005; i++) {
      AuditService.logAction(`action_${i}`, 'test@example.com', 'admin', {}, 1);
    }

    const logs = AuditService.getLogs();
    // Should not exceed the max limit
    expect(logs.length).toBe(1000);
    
    // Should contain the most recent entries
    expect(logs[logs.length - 1].action).toBe('action_1004');
    expect(logs[0].action).toBe('action_5'); // First 5 should be removed
  });

  test('clears logs correctly', () => {
    AuditService.logAction('test_action', 'test@example.com', 'admin', {}, 1);
    expect(AuditService.getLogs()).toHaveLength(1);

    AuditService.clearLogs();
    expect(AuditService.getLogs()).toHaveLength(0);
  });

  test('gets current user context', () => {
    // Test with no auth data
    const context1 = AuditService.getCurrentUserContext();
    expect(context1.actor).toBe('System');
    expect(context1.role).toBe('system');

    // Test with auth data in localStorage
    localStorage.setItem('swaxi-auth', JSON.stringify({
      user: { email: 'test@example.com', role: 'admin', name: 'Test User' }
    }));

    const context2 = AuditService.getCurrentUserContext();
    expect(context2.actor).toBe('test@example.com');
    expect(context2.role).toBe('admin');
  });
});