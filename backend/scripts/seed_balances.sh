#!/bin/bash

# Script to add money to a specific account
# Usage: ./seed_balances.sh <ACCOUNT_ID> <AMOUNT>
# Example: ./seed_balances.sh 8cb49853-a27d-45c9-8337-c01f98de6150 5000
# Example: ./seed_balances.sh 2e20d99f-3e19-4dc3-a0b4-70e4609e028f 10000

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <ACCOUNT_ID> <AMOUNT>"
    echo "Example: $0 8cb49853-a27d-45c9-8337-c01f98de6150 5000"
    echo ""
    echo "To find account IDs, run:"
    echo "docker compose exec postgres psql -U minibank -d minibank -c \"SELECT id, currency, account_type FROM accounts;\""
    exit 1
fi

ACCOUNT_ID=$1
AMOUNT=$2

echo "Adding $AMOUNT to account $ACCOUNT_ID..."

docker compose exec -T postgres psql -U minibank -d minibank << EOF
DO \$\$
DECLARE
    v_user_id UUID;
    v_account_id UUID := '$ACCOUNT_ID'::UUID;
    v_account_currency VARCHAR(3);
    v_account_exists BOOLEAN;
BEGIN
    -- Get user ID (using the first user in the database)
    SELECT id INTO v_user_id FROM users LIMIT 1;
    
    -- Check if account exists and get its currency
    SELECT EXISTS(SELECT 1 FROM accounts WHERE id = v_account_id), currency
    INTO v_account_exists, v_account_currency
    FROM accounts WHERE id = v_account_id;
    
    IF NOT v_account_exists THEN
        RAISE EXCEPTION 'Account with ID % does not exist', v_account_id;
    END IF;
    
    -- Add money to the account
    INSERT INTO transactions (
        id,
        transaction_type,
        amount,
        currency,
        from_account_id,
        to_account_id,
        description,
        idempotency_key,
        created_by
    ) VALUES (
        gen_random_uuid(),
        'deposit',
        $AMOUNT,
        v_account_currency,
        NULL,
        v_account_id,
        'Deposit - Seed data',
        'seed_deposit_' || v_account_id::text || '_' || extract(epoch from now())::text,
        v_user_id
    );
    
    RAISE NOTICE 'Added % % to account %', $AMOUNT, v_account_currency, v_account_id;
    RAISE NOTICE 'Deposit successful!';
END \$\$;
EOF

echo ""
echo "✅ Balance updated! Check your accounts in the dashboard."

