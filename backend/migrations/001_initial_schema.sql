-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'checking',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, currency, account_type)
);

-- Create transactions table (double-entry ledger)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type VARCHAR(20) NOT NULL, -- 'transfer', 'exchange', 'deposit', 'withdrawal'
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    from_account_id UUID REFERENCES accounts(id),
    to_account_id UUID REFERENCES accounts(id),
    exchange_rate DECIMAL(20,8),
    description TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- Create materialized balance view for performance
CREATE TABLE account_balances (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    balance DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_idempotency_key ON transactions(idempotency_key);
CREATE INDEX idx_accounts_user_currency ON accounts(user_id, currency);

-- Create function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update balance for from_account if exists
    IF NEW.from_account_id IS NOT NULL THEN
        INSERT INTO account_balances (account_id, balance, currency, updated_at)
        SELECT 
            NEW.from_account_id,
            COALESCE(SUM(
                CASE 
                    WHEN from_account_id = NEW.from_account_id THEN -amount
                    WHEN to_account_id = NEW.from_account_id THEN amount
                    ELSE 0
                END
            ), 0),
            NEW.currency,
            NOW()
        FROM transactions 
        WHERE from_account_id = NEW.from_account_id OR to_account_id = NEW.from_account_id
        ON CONFLICT (account_id) 
        DO UPDATE SET 
            balance = EXCLUDED.balance,
            updated_at = EXCLUDED.updated_at;
    END IF;

    -- Update balance for to_account if exists
    IF NEW.to_account_id IS NOT NULL THEN
        INSERT INTO account_balances (account_id, balance, currency, updated_at)
        SELECT 
            NEW.to_account_id,
            COALESCE(SUM(
                CASE 
                    WHEN from_account_id = NEW.to_account_id THEN -amount
                    WHEN to_account_id = NEW.to_account_id THEN amount
                    ELSE 0
                END
            ), 0),
            NEW.currency,
            NOW()
        FROM transactions 
        WHERE from_account_id = NEW.to_account_id OR to_account_id = NEW.to_account_id
        ON CONFLICT (account_id) 
        DO UPDATE SET 
            balance = EXCLUDED.balance,
            updated_at = EXCLUDED.updated_at;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update balances
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();
