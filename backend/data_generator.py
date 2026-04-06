from datetime import date, timedelta
import random
from models import Account, Balance, Transaction

def get_mock_data():
    account = Account(
        account_id="acc_001",
        name="Main Checking",
        type="depository",
        subtype="checking",
        balances=Balance(available=145000.0, current=150000.0) # Upgraded to realistic INR balance
    )

    transactions = []
    start_date = date.today() - timedelta(days=90)

    # 1. Add Recurring "Ghost" Subscriptions (Realistic INR)
    for i in range(3): # 3 months of history
        tx_date = start_date + timedelta(days=i*30)
        transactions.append(Transaction(
            transaction_id=f"ghost_{i}",
            account_id="acc_001",
            amount=499.00, # Realistic Netflix Standard Plan
            date=tx_date,
            name="Netflix Subscription",
            category=["Service", "Entertainment"]
        ))
        
        # Another one: Gym Membership
        transactions.append(Transaction(
            transaction_id=f"gym_{i}",
            account_id="acc_001",
            amount=1999.00, # Realistic Monthly Gym Fee
            date=tx_date + timedelta(days=5),
            name="Gold Fitness",
            category=["Health", "Fitness"]
        ))

    # 2. Add Random Daily Spends (The "Noise" localized to India)
    for i in range(60):
        random_date = start_date + timedelta(days=random.randint(0, 90))
        merchant_name = random.choice(["Uber", "Starbucks", "Amazon", "Zomato", "Swiggy", "Blinkit"])
        
        # Assign realistic spending ranges based on the merchant
        if merchant_name in ["Uber", "Zomato", "Swiggy"]:
            amt = round(random.uniform(150.0, 600.0), 2)
        elif merchant_name == "Starbucks":
            amt = round(random.uniform(300.0, 900.0), 2)
        elif merchant_name == "Blinkit":
            amt = round(random.uniform(400.0, 1500.0), 2)
        else: # Amazon
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

# --- THE GHOST HUNTER LOGIC ---
def find_recurring_spends(transactions):
    """
    Scans transactions to find items with the same name and amount 
    occurring roughly every 30 days.
    """
    analysis = {}
    for tx in transactions:
        if tx.name not in analysis:
            analysis[tx.name] = []
        analysis[tx.name].append(tx)

    recurring = []
    for name, tx_list in analysis.items():
        if len(tx_list) >= 3: # Seen at least 3 times
            recurring.append({
                "name": name,
                "frequency": "Monthly",
                "amount": tx_list[0].amount,
                "last_date": max(t.date for t in tx_list),
                "total_spent_90d": sum(t.amount for t in tx_list)
            })
    return recurring