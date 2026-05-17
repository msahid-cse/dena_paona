import { query } from './db';

export async function initializeDatabase() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        age INTEGER,
        gender VARCHAR(20),
        password_hash VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        profile_picture TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Verification codes table
    await query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(10) NOT NULL,
        type VARCHAR(20) DEFAULT 'email_verify',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Contacts table (for unregistered contacts)
    await query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
        contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        contact_name VARCHAR(255),
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        is_registered BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        contact_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        contact_name VARCHAR(255),
        contact_phone VARCHAR(20),
        amount DECIMAL(15, 2) NOT NULL,
        paid_amount DECIMAL(15, 2) DEFAULT 0,
        remaining_amount DECIMAL(15, 2),
        type VARCHAR(10) NOT NULL CHECK (type IN ('dena', 'paona')),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'cleared')),
        notes TEXT,
        due_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Payment history table
    await query(`
      CREATE TABLE IF NOT EXISTS payment_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
        amount DECIMAL(15, 2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Activity log table
    await query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // System logs for admin
    await query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level VARCHAR(20) DEFAULT 'info',
        message TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Notifications table (transaction approval requests + general)
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        data JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        is_actioned BOOLEAN DEFAULT FALSE,
        action_taken VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Messages table (user-to-user chat)
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(owner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_transactions_contact ON transactions(contact_user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON verification_codes(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id)`);

    // Add computed column trigger for remaining_amount
    await query(`
      CREATE OR REPLACE FUNCTION update_remaining_amount()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.remaining_amount := NEW.amount - NEW.paid_amount;
        IF NEW.paid_amount >= NEW.amount THEN
          NEW.status := 'cleared';
        ELSIF NEW.paid_amount > 0 THEN
          NEW.status := 'partial';
        ELSE
          NEW.status := 'pending';
        END IF;
        NEW.updated_at := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await query(`DROP TRIGGER IF EXISTS trigger_update_remaining ON transactions`);
    await query(`
      CREATE TRIGGER trigger_update_remaining
      BEFORE INSERT OR UPDATE ON transactions
      FOR EACH ROW EXECUTE FUNCTION update_remaining_amount()
    `);

    // ── MIGRATIONS: new columns (idempotent) ──────────────────────────
    // users: username_set, profile_completed, bkash_available, language_pref
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username_set BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bkash_available BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language_pref VARCHAR(20) DEFAULT 'en'`);
    // Make username and phone nullable (existing NOT NULL constraints)
    await query(`ALTER TABLE users ALTER COLUMN username DROP NOT NULL`);
    await query(`ALTER TABLE users ALTER COLUMN phone DROP NOT NULL`);
    // Remove the UNIQUE constraint on phone (could be null now)
    await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_key`);

    // payment_history: approval workflow columns
    await query(`ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'`);
    await query(`ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL`);
    await query(`ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`);
    await query(`ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS dispute_reason TEXT`);
    await query(`ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS dispute_proof TEXT`);
    await query(`ALTER TABLE payment_history ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id) ON DELETE SET NULL`);

    // Password reset codes (type already handled by verification_codes type field,
    // but let's ensure the 'password_reset' type works — no new table needed)

    console.log('Database initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}
