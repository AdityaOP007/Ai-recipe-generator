import db from '../config/db.js';
import bcrypt from 'bcryptjs';

class User {
    /**
     * Create a new user
     */
    static async create({ email, password, name }) {
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(
            `INSERT INTO users (email, password_hash, name)
             VALUES ($1, $2, $3)
             RETURNING id, email, name, created_at`,
            [email, hashedPassword, name]
        );

        return result.rows[0];
    }

    /**
     * Find a user by email
     */
    static async findByEmail(email) {
        const result = await db.query(
            `SELECT * FROM users WHERE email = $1`,
            [email]
        );
        return result.rows[0];
    }

    /**
     * Find a user by ID
     */
    static async findById(id) {
        const result = await db.query(
            `SELECT id, email, name, created_at FROM users WHERE id = $1`,
            [id]
        );
        return result.rows[0];
    }

    /**
     * Update user
     */
    static async update(id, updates) {
        const { name, email } = updates;
        const result = await db.query(
            `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3 RETURNING id, email, name, updated_at`,
            [name, email, id]
        );
        return result.rows[0];
    }
    /**
     * Verify user password
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    /**
     * Delete user
     */
    static async delete(id) {
        await db.query(
            `DELETE FROM users WHERE id = $1`,
            [id]
        );
    }
}

export default User;