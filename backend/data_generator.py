from datetime import date, timedelta
import random
from models import Account, Balance, Transaction

def get_mock_data():
    account = Account(
        account_id="acc_001",
        name="Main Checking",
        type="depository",
        subtype="checking",
        balances=Balance(available=145000.0, current=150000.0)
    )

    transactions = []
    start_date = date.today() - timedelta(days=90)

    # --- NEW: PHASE 2 INCOME GENERATOR ---
    for i in range(3): # 3 months of salary history
        tx_date = start_date + timedelta(days=(i * 30) + 1)
        transactions.append(Transaction(
            transaction_id=f"inc_{i}",
            account_id="acc_001",
            amount=85000.00, # Realistic INR Monthly Salary
            date=tx_date,
            name="TechCorp Salary",
            category=["Income", "Salary"] # Tagged for the algorithm
        ))

    # Add Recurring "Ghost" Subscriptions
    for i in range(3):
        tx_date = start_date + timedelta(days=i*30)
        transactions.append(Transaction(
            transaction_id=f"ghost_{i}",
            account_id="acc_001",
            amount=499.00,
            date=tx_date,
            name="Netflix Subscription",
            category=["Service", "Entertainment"]
        ))
        
        transactions.append(Transaction(
            transaction_id=f"gym_{i}",
            account_id="acc_001",
            amount=1999.00,
            date=tx_date + timedelta(days=5),
            name="Gold Fitness",
            category=["Health", "Fitness"]
        ))

    # Add Random Daily Spends
    for i in range(60):
        random_date = start_date + timedelta(days=random.randint(0, 90))
        merchant_name = random.choice(["Uber", "Starbucks", "Amazon", "Zomato", "Swiggy", "Blinkit"])
        
        if merchant_name in ["Uber", "Zomato", "Swiggy"]:
            amt = round(random.uniform(150.0, 600.0), 2)
        elif merchant_name == "Starbucks":
            amt = round(random.uniform(300.0, 900.0), 2)
        elif merchant_name == "Blinkit":
            amt = round(random.uniform(400.0, 1500.0), 2)
        else:
            amt = round(random.uniform(800.0, 4500.0), 2)

        transactions.append(Transaction(
            transaction_id=f"rand_{i}",
            account_id="acc_001",
            amount=amt,
            date=random_date,
            name=merchant_name,
            category=["Food" if i%2==0 else "Travel"]
        ))

    return account, transactions

def find_recurring_spends(transactions):
    analysis = {}
    # Ignore Income when looking for ghost subscriptions
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