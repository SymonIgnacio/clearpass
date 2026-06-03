const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { page = 1, limit = 50, role, status } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];

    if (role) {
      whereConditions.push('u.role = ?');
      values.push(parseInt(role));
    }

    if (status === 'active') {
      whereConditions.push('u.is_active = true');
    } else if (status === 'inactive') {
      whereConditions.push('u.is_active = false');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const [rows] = await db.execute(
      `
      SELECT u.id, u.username, u.full_name, u.email, u.contact_number, u.role, u.is_active, 
             u.resident_id, u.last_login, u.created_at,
             r.First_Name, r.Last_Name
      FROM users u
      LEFT JOIN residents r ON u.resident_id = r.Resident_ID
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `,
      [...values, parseInt(limit), parseInt(offset)]
    );

    const [totalRows] = await db.execute(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      values
    );

    res.json({
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRows[0].total,
        pages: Math.ceil(totalRows[0].total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getById = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const [rows] = await db.execute(
      `
      SELECT u.id, u.username, u.full_name, u.email, u.contact_number, u.role, u.is_active,
             u.resident_id, u.last_login, u.created_at,
             r.First_Name, r.Last_Name
      FROM users u
      LEFT JOIN residents r ON u.resident_id = r.Resident_ID
      WHERE u.id = ?
    `,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.create = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { username, password, full_name, email, contact_number, role, resident_id } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `
      INSERT INTO users (username, password_hash, full_name, email, contact_number, role, resident_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, true)
    `,
      [
        username,
        hashedPassword,
        full_name || null,
        email || null,
        contact_number || null,
        role,
        resident_id || null,
      ]
    );

    console.error('User created result:', result);

    // Send welcome email
    const responseData = { user_id: result.insertId || 0, message: 'User created successfully' };
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.update = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { full_name, email, contact_number, role, resident_id } = req.body;

    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (contact_number !== undefined) {
      updates.push('contact_number = ?');
      values.push(contact_number);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (resident_id !== undefined) {
      updates.push('resident_id = ?');
      values.push(resident_id);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.toggleStatus = async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.json({ message: 'User status toggled successfully' });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ error: 'Failed to toggle user status' });
  }
};

exports.resetPassword = async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { new_password } = req.body;

    if (!new_password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [
      hashedPassword,
      req.params.id,
    ]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

exports.delete = async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.execute('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
