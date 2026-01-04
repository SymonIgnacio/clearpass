exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const isResident = req.user.role === 4;

    let query, values;

    if (isResident) {
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        WHERE r.Resident_ID = ?
        ORDER BY c.created_at DESC
      `;
      values = [req.user.id];
    } else {
      query = `
        SELECT c.*, CONCAT(r.First_Name, ' ', r.Last_Name) as resident_name
        FROM certificates_log c
        JOIN residents r ON c.resident_id = r.Resident_ID
        ORDER BY c.created_at DESC
      `;
      values = [];
    }

    const [rows] = await db.execute(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};
