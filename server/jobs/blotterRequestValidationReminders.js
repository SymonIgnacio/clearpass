const runBlotterRequestValidationReminders = async db => {
  try {
    const [pending] = await db.execute(
      `
        SELECT id, validation_assigned_officer_id, validation_due_at
        FROM blotter_requests
        WHERE status = 'for_validation'
          AND validation_assigned_officer_id IS NOT NULL
          AND (validation_due_at IS NULL OR validation_due_at >= NOW())
      `
    );

    for (const row of pending || []) {
      const officerId = row.validation_assigned_officer_id;
      if (officerId && global.createNotification) {
        await global.createNotification(
          officerId,
          'Validation Reminder',
          `Reminder: validate blotter request #${row.id}`,
          'warning',
          'normal',
          { request_id: row.id, due_at: row.validation_due_at }
        );
      }
    }

    // Escalate overdue
    const [overdue] = await db.execute(
      `
        SELECT id, validation_assigned_officer_id, validation_due_at
        FROM blotter_requests
        WHERE status = 'for_validation'
          AND validation_due_at IS NOT NULL
          AND validation_due_at < NOW()
      `
    );
    if (overdue?.length) {
      const [admins] = await db.execute(
        "SELECT id FROM users WHERE role = 'admin' AND is_active = 1"
      );
      const adminIds = admins.map(a => a.id);
      if (adminIds.length && global.createBulkNotification) {
        await global.createBulkNotification(
          adminIds,
          'Validation Overdue',
          `Overdue blotter requests: ${overdue.map(o => `#${o.id}`).join(', ')}`,
          'error',
          'high',
          { request_ids: overdue.map(o => o.id) }
        );
      }
    }
  } catch {}
};

const startBlotterRequestValidationReminderScheduler = db => {
  const enabled = process.env.BLOTTER_REQUEST_REMINDERS_ENABLED !== 'false';
  if (!enabled) return null;
  const runSafe = async () => {
    await runBlotterRequestValidationReminders(db);
  };
  runSafe();
  return setInterval(runSafe, 24 * 60 * 60 * 1000);
};

module.exports = {
  runBlotterRequestValidationReminders,
  startBlotterRequestValidationReminderScheduler,
};
