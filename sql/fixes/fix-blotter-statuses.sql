-- CRITICAL FIX #1: Update empty blotter statuses
-- 404 cases have empty status which bypasses certificate issuance checks

UPDATE blotter 
SET Status = 'Pending' 
WHERE Status = '' OR Status IS NULL;

-- Verify the fix
SELECT Status, COUNT(*) as count 
FROM blotter 
GROUP BY Status 
ORDER BY count DESC;
