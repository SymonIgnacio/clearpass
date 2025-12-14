-- Remove all resident users from the database
-- Staff roles: admin, captain, secretary, clerk
-- Only these should remain in the users table

DELETE FROM users WHERE role = 'resident' AND firebase_uid IS NOT NULL;

-- Verify only staff remain
SELECT id, username, full_name, role, firebase_uid
FROM users
WHERE role IN ('admin', 'captain', 'secretary', 'clerk')
ORDER BY id;
