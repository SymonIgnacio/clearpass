require('dotenv').config({ path: './server/.env' });
const mysql = require('mysql2/promise');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('DB_NAME:', process.env.DB_NAME);

        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('✅ Database connected successfully');

        // Check if document_templates table exists
        const [tables] = await db.execute('SHOW TABLES LIKE "document_templates"');
        console.log('✅ Templates table exists:', tables.length > 0);

        if (tables.length > 0) {
            // Describe table structure
            const [columns] = await db.execute('DESCRIBE document_templates');
            console.log('✅ Table columns:', columns.map(c => c.Field).join(', '));

            // Check if file_data column exists
            const hasFileData = columns.some(c => c.Field === 'file_data');
            console.log('✅ file_data column exists:', hasFileData);

            // Check recent templates
            const [templates] = await db.execute('SELECT COUNT(*) as count FROM document_templates');
            console.log('✅ Templates count:', templates[0].count);
        }

        await db.end();
        console.log('✅ Test completed successfully');

    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        process.exit(1);
    }
}

testDatabase();
