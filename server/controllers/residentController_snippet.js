exports.getPublicList = async (req, res) => {
    const db = req.app.locals.db;
    if (!db) {
        return res.status(500).json({ error: 'Database connection not available' });
    }

    try {
        const { search, limit = 20 } = req.query;
        let query = `
      SELECT Resident_ID, First_Name, Last_Name, Middle_Name, Suffix
      FROM residents 
      WHERE Residency_Status = 'Active'
    `;

        const params = [];

        if (search && search.trim()) {
            query += ` AND (CONCAT_WS(' ', First_Name, Last_Name) LIKE ? OR CONCAT_WS(' ', First_Name, Middle_Name, Last_Name) LIKE ?)`;
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm);
        }

        query += ` ORDER BY Last_Name, First_Name LIMIT ?`;
        params.push(parseInt(limit));

        const [rows] = await db.execute(query, params);

        // Format for frontend
        const residents = rows.map(r => ({
            Resident_ID: r.Resident_ID,
            full_name: `${r.First_Name} ${r.Middle_Name ? r.Middle_Name + ' ' : ''}${r.Last_Name}${r.Suffix ? ' ' + r.Suffix : ''}`.trim()
        }));

        res.json(residents);
    } catch (error) {
        console.error('Error fetching public resident list:', error);
        res.status(500).json({ error: 'Failed to fetch resident list' });
    }
};
