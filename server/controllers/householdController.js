exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { page = 1, limit = 50, sitio_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let values = [];

    if (sitio_id) {
      whereClause = 'WHERE h.Sitio_ID = ?';
      values.push(sitio_id);
    }

    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name, COUNT(r.Resident_ID) as member_count
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      LEFT JOIN residents r ON h.Household_ID = r.Household_ID
      ${whereClause}
      GROUP BY h.Household_ID
      ORDER BY h.Household_Number
      LIMIT ? OFFSET ?
    `, [...values, parseInt(limit), parseInt(offset)]);

    const [totalRows] = await db.execute(`
      SELECT COUNT(DISTINCT h.Household_ID) as total FROM households h ${whereClause}
    `, values);

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRows[0].total,
        pages: Math.ceil(totalRows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching households:', error);
    res.status(500).json({ error: 'Failed to fetch households' });
  }
};

exports.getById = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.execute(`
      SELECT h.*, s.name as sitio_name
      FROM households h
      LEFT JOIN sitios s ON h.Sitio_ID = s.id
      WHERE h.Household_ID = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Household not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching household:', error);
    res.status(500).json({ error: 'Failed to fetch household' });
  }
};

exports.create = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { household_number, sitio_id, street_address, household_type } = req.body;

    const householdId = `HH-${Date.now()}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`;

    await db.execute(`
      INSERT INTO households (Household_ID, Household_Number, Sitio_ID, Street_Address, Household_Type, Total_Members)
      VALUES (?, ?, ?, ?, ?, 0)
    `, [householdId, household_number, sitio_id, street_address, household_type || 'Nuclear']);

    res.status(201).json({ household_id: householdId, message: 'Household created successfully' });
  } catch (error) {
    console.error('Error creating household:', error);
    res.status(500).json({ error: 'Failed to create household' });
  }
};

exports.update = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { household_number, sitio_id, street_address, household_type } = req.body;

    const updates = [];
    const values = [];

    if (household_number !== undefined) { updates.push('Household_Number = ?'); values.push(household_number); }
    if (sitio_id !== undefined) { updates.push('Sitio_ID = ?'); values.push(sitio_id); }
    if (street_address !== undefined) { updates.push('Street_Address = ?'); values.push(street_address); }
    if (household_type !== undefined) { updates.push('Household_Type = ?'); values.push(household_type); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await db.execute(`UPDATE households SET ${updates.join(', ')} WHERE Household_ID = ?`, values);

    res.json({ message: 'Household updated successfully' });
  } catch (error) {
    console.error('Error updating household:', error);
    res.status(500).json({ error: 'Failed to update household' });
  }
};

exports.delete = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [members] = await db.execute('SELECT COUNT(*) as count FROM residents WHERE Household_ID = ?', [req.params.id]);

    if (members[0].count > 0) {
      return res.status(400).json({ error: 'Cannot delete household with members' });
    }

    await db.execute('DELETE FROM households WHERE Household_ID = ?', [req.params.id]);
    res.json({ message: 'Household deleted successfully' });
  } catch (error) {
    console.error('Error deleting household:', error);
    res.status(500).json({ error: 'Failed to delete household' });
  }
};
