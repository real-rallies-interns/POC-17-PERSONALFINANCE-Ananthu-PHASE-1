from datetime import date, timedelta
import random
import json
import csv
import os
from typing import List, Tuple
from models import Account, Balance, Transaction

# Institutional Settings
INSTITUTION_NAME = "Real Rails Global Bank"
USER_PROFILE = {
    "user_id": "USR-2024-X92",
    "user_name": "Ananthu Anil",
    "user_age": 28
}

def generate_synthetic_ledger(num_rows: int = 150) -> Tuple[List[Account], List[Transaction]]:
    accounts = [
        Account(
            account_id="acc_main_001",
            name="Primary Savings",
            type="depository",
            subtype="savings",
            balances=Balance(available=245000.0, current=245000.0)
        ),
        Account(
            account_id="acc_check_002",
            name="Daily Checking",
            type="depository",
            subtype="checking",
            balances=Balance(available=45000.0, current=45000.0)
        ),
        Account(
            account_id="acc_credit_003",
            name="Elite Credit Card",
            type="credit",
            subtype="credit card",
            balances=Balance(available=150000.0, current=-12000.0, limit=200000.0)
        )
    ]

    transactions = []
    base_date = date.today() - timedelta(days=90)
    current_balances = {acc.account_id: acc.balances.current for acc in accounts}

    # 1. Monthly Salary (Synthetic Income)
    for i in range(3):
        tx_date = base_date + timedelta(days=(i * 30) + 1)
        acc_id = "acc_main_001"
        amount = 125000.0
        current_balances[acc_id] += amount
        
        transactions.append(Transaction(
            transaction_id=f"TXN-INC-{1000+i}",
            account_id=acc_id,
            user_id=USER_PROFILE["user_id"],
            user_name=USER_PROFILE["user_name"],
            user_age=USER_PROFILE["user_age"],
            date=tx_date,
            month=tx_date.strftime("%Y-%m"),
            name="Corporate Salary Credit",
            category=["Income"],
            subcategory="Professional Services",
            amount=amount,
            direction="credit",
            institution=INSTITUTION_NAME,
            balance_after=current_balances[acc_id],
            is_recurring=True,
            tags="salary_income",
            original_amount=amount,
            lat=19.07,
            lon=72.87
        ))

    # 2. Fixed Costs (EMI, Rent, etc.)
    fixed_costs = [
        ("HDFC Home Loan EMI", 35000.0, ["Loan", "Housing"], "acc_main_001"),
        ("ICICI Car Loan EMI", 12000.0, ["Loan", "Transport"], "acc_main_001"),
        ("Cloud SaaS Subscription", 1200.0, ["Digital", "SaaS"], "acc_credit_003")
    ]

    for i in range(3):
        for name, amt, cat, acc_id in fixed_costs:
            tx_date = base_date + timedelta(days=(i * 30) + 10 + random.randint(0, 2))
            current_balances[acc_id] -= amt
            transactions.append(Transaction(
                transaction_id=f"TXN-FIX-{2000 + i*10 + fixed_costs.index((name, amt, cat, acc_id))}",
                account_id=acc_id,
                user_id=USER_PROFILE["user_id"],
                user_name=USER_PROFILE["user_name"],
                user_age=USER_PROFILE["user_age"],
                date=tx_date,
                month=tx_date.strftime("%Y-%m"),
                name=name,
                category=cat,
                subcategory="Fixed Expense",
                amount=amt,
                direction="debit",
                institution=INSTITUTION_NAME,
                balance_after=current_balances[acc_id],
                is_recurring=True,
                tags="fixed_cost",
                budget_limit=amt * 1.1,
                budget_pct_used=90.9,
                original_amount=amt,
                lat=12.97,
                lon=77.59
            ))

    # 3. Dynamic "Noise" Spending
    merchants = [
        ("Swiggy", ["Food"], "Essential"),
        ("Zomato", ["Food"], "Discretionary"),
        ("Uber", ["Travel"], "Essential"),
        ("Amazon", ["Shopping"], "Discretionary"),
        ("Netflix", ["Entertainment"], "Recurring"),
        ("Starbucks", ["Food"], "Discretionary"),
        ("Apple Store", ["Tech"], "One-off"),
        ("Shell Fuel", ["Automotive"], "Essential")
    ]

    for i in range(num_rows - len(transactions)):
        tx_date = base_date + timedelta(days=random.randint(0, 90))
        merchant, cat, subcat = random.choice(merchants)
        acc_id = random.choice(["acc_check_002", "acc_credit_003"])
        
        # Random amount logic
        if merchant == "Apple Store":
            amt = round(random.uniform(5000, 45000), 2)
        else:
            amt = round(random.uniform(200, 2500), 2)
            
        current_balances[acc_id] -= amt
        
        # Risk/Anomaly logic
        anomaly = 0.0
        risk = False
        if amt > 30000:
            anomaly = 0.88
            risk = True
        
        transactions.append(Transaction(
            transaction_id=f"TXN-DYN-{5000+i}",
            account_id=acc_id,
            user_id=USER_PROFILE["user_id"],
            user_name=USER_PROFILE["user_name"],
            user_age=USER_PROFILE["user_age"],
            date=tx_date,
            month=tx_date.strftime("%Y-%m"),
            name=merchant,
            category=cat,
            subcategory=subcat,
            amount=amt,
            direction="debit",
            institution=INSTITUTION_NAME,
            balance_after=current_balances[acc_id],
            is_recurring=(subcat == "Recurring"),
            tags=cat[0].lower(),
            risk_flag=risk,
            anomaly_score=anomaly,
            original_amount=amt,
            lat=random.choice([12.97, 19.07, 28.61]),
            lon=random.choice([77.59, 72.87, 77.20])
        ))

    # 4. EDGE CASES
    # Case A: Negative Balance (Overdraft)
    current_balances["acc_check_002"] = -500.0
    transactions.append(Transaction(
        transaction_id="TXN-EC-001",
        account_id="acc_check_002",
        user_id=USER_PROFILE["user_id"],
        user_name=USER_PROFILE["user_name"],
        user_age=USER_PROFILE["user_age"],
        date=date.today(),
        month=date.today().strftime("%Y-%m"),
        name="OVERDRAFT_FEE",
        category=["Bank Fees"],
        subcategory="Penalty",
        amount=25.0,
        direction="debit",
        institution=INSTITUTION_NAME,
        balance_after=current_balances["acc_check_002"],
        note="EDGE: Overdraft triggered due to low liquidity",
        original_amount=25.0
    ))

    # Case B: Future Transaction (Pending/Projected)
    future_date = date.today() + timedelta(days=5)
    transactions.append(Transaction(
        transaction_id="TXN-EC-002",
        account_id="acc_credit_003",
        user_id=USER_PROFILE["user_id"],
        user_name=USER_PROFILE["user_name"],
        user_age=USER_PROFILE["user_age"],
        date=future_date,
        month=future_date.strftime("%Y-%m"),
        name="FUTURE_FLIGHT_BOOKING",
        category=["Travel"],
        subcategory="Discretionary",
        amount=15400.0,
        direction="debit",
        institution=INSTITUTION_NAME,
        balance_after=current_balances["acc_credit_003"] - 15400.0,
        note="EDGE: Future dated transaction",
        original_amount=15400.0
    ))
    
    # Case C: Transaction Reversal (0.0 Amount)
    transactions.append(Transaction(
        transaction_id="TXN-EC-003",
        account_id="acc_credit_003",
        user_id=USER_PROFILE["user_id"],
        user_name=USER_PROFILE["user_name"],
        user_age=USER_PROFILE["user_age"],
        date=date.today() - timedelta(days=2),
        month=date.today().strftime("%Y-%m"),
        name="MERCHANT_REFUND_PENDING",
        category=["Refund"],
        subcategory="Correction",
        amount=0.0,
        direction="credit",
        institution=INSTITUTION_NAME,
        balance_after=current_balances["acc_credit_003"],
        note="EDGE: Reversal state with 0.0 amount",
        original_amount=0.0
    ))

    return accounts, transactions

def export_to_files(accounts, transactions, base_path="datas"):
    if not os.path.exists(base_path):
        os.makedirs(base_path)

    # Prepare JSON
    data = {
        "accounts": [a.model_dump() for a in accounts],
        "transactions": [t.model_dump() for t in transactions]
    }
    
    # Convert dates to strings for JSON serialization
    for tx in data["transactions"]:
        if isinstance(tx["date"], (date, date)):
            tx["date"] = tx["date"].isoformat()
        
    # Save JSON
    json_path = os.path.join(base_path, "personal_finance_mock.json")
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2)
        
    # Save CSV
    csv_path = os.path.join(base_path, "personal_finance_mock.csv")
    if transactions:
        keys = transactions[0].model_dump().keys()
        with open(csv_path, "w", newline='') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            for tx in transactions:
                row = tx.model_dump()
                row["category"] = "|".join(row["category"]) # Flatten list for CSV
                if isinstance(row["date"], (date, date)):
                    row["date"] = row["date"].isoformat()
                dict_writer.writerow(row)

def get_mock_data():
    """Compatibility layer for main.py"""
    json_path = "datas/personal_finance_mock.json"
    if not os.path.exists(json_path):
        # Fallback to backend/datas if running from project root
        json_path = "backend/datas/personal_finance_mock.json"

    try:
        with open(json_path, "r") as f:
            data = json.load(f)
            accounts = [Account(**a) for a in data["accounts"]]
            transactions = [Transaction(**t) for t in data["transactions"]]
            return accounts, transactions
    except Exception as e:
        print(f"Loading failed, generating fresh data: {e}")
        accs, txs = generate_synthetic_ledger()
        return accs, txs

def find_recurring_spends(transactions):
    analysis = {}
    expenses = [tx for tx in transactions if "Income" not in tx.category]
    for tx in expenses:
        if tx.name not in analysis:
            analysis[tx.name] = []
        analysis[tx.name].append(tx)

    recurring = []
    for name, tx_list in analysis.items():
        if len(tx_list) >= 3:
            recurring.append({
                "name": name,
                "frequency": "Monthly",
                "amount": tx_list[0].amount,
                "last_date": max(t.date for t in tx_list),
                "total_spent_90d": sum(t.amount for t in tx_list)
            })
    return recurring

if __name__ == "__main__":
    print("Generating synthetic financial ledger...")
    accs, txs = generate_synthetic_ledger()
    # Check if we are in backend dir or root
    path = "datas"
    if not os.path.exists(path) and os.path.exists("backend/datas"):
        path = "backend/datas"
    export_to_files(accs, txs, path)
    print(f"Success! Generated {len(txs)} rows across {len(accs)} accounts.")
    print(f"Files saved to {path}/")