const {
  runBlotterRequestValidationReminders,
} = require('../jobs/blotterRequestValidationReminders');

describe('Blotter Request Validation Reminders', () => {
  test('sends reminders to assigned officers', async () => {
    const mockDb = {
      execute: jest
        .fn()
        // pending for validation
        .mockResolvedValueOnce([
          [
            { id: 1, validation_assigned_officer_id: 10, validation_due_at: null },
            {
              id: 2,
              validation_assigned_officer_id: 11,
              validation_due_at: new Date(Date.now() + 86400000).toISOString(),
            },
          ],
        ])
        // overdue list
        .mockResolvedValueOnce([[]]),
    };
    global.createNotification = jest.fn();
    await runBlotterRequestValidationReminders(mockDb);
    expect(global.createNotification).toHaveBeenCalledTimes(2);
  });

  test('escalates overdue to admins', async () => {
    const mockDb = {
      execute: jest
        .fn()
        // pending
        .mockResolvedValueOnce([[]])
        // overdue
        .mockResolvedValueOnce([
          [
            {
              id: 3,
              validation_assigned_officer_id: 15,
              validation_due_at: new Date(Date.now() - 86400000).toISOString(),
            },
          ],
        ])
        // admins
        .mockResolvedValueOnce([[{ id: 1 }, { id: 2 }]]),
    };
    global.createBulkNotification = jest.fn();
    await runBlotterRequestValidationReminders(mockDb);
    expect(global.createBulkNotification).toHaveBeenCalledTimes(1);
  });
});
