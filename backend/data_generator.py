from datetime import date, timedelta
import random
from models import Account, Balance, Transaction

def get_mock_data():
    accounts = [
        Account(
            account_id="acc_001",
            name="HDFC Savings",
            type="depository",
            subtype="savings",
            balances=Balance(available=145000.0, current=145000.0)
        ),
        Account(
            account_id="acc_002",
            name="SBI Checking",
            type="depository",
            subtype="checking",
            balances=Balance(available=30000.0, current=30000.0)
        ),
        Account(
            account_id="acc_003",
            name="ICICI Credit Card",
            type="credit",
            subtype="credit card",
            balances=Balance(available=75000.0, current=-25000.0, limit=100000.0)
        )
    ]

    transactions = []
    base_date = date.today() - timedelta(days=90)
    
    locations = {
        "Bangalore": {"lat": 12.97, "lon": 77.59},
        "Mumbai": {"lat": 19.07, "lon": 72.87},
        "Delhi": {"lat": 28.61, "lon": 77.20}
    }

    # 1. Institutional Salary Flow (₹2,55,000 Total)
    for i in range(3):
        tx_date = base_date + timedelta(days=(i * 30) + 1)
        transactions.append(Transaction(
            transaction_id=f"inc_{i}",
            account_id="acc_001",
            amount=85000.00,
            date=tx_date,
            name="TechCorp Salary",
            category=["Income"],
            city="Mumbai",
            **locations["Mumbai"]
        ))

    # 2. Fixed Loan Schedules (₹1,19,100 Total)
    for i in range(3):
        transactions.append(Transaction(
            transaction_id=f"loan_home_{i}",
            account_id="acc_002",
            amount=28500.00,
            date=base_date + timedelta(days=i*30 + 9),
            name="HDFC Home Loan EMI",
            category=["Loan", "Housing"],
            city="Bangalore",
            **locations["Bangalore"]
        ))
        
        transactions.append(Transaction(
            transaction_id=f"loan_car_{i}",
            account_id="acc_002",
            amount=11200.00,
            date=base_date + timedelta(days=i*30 + 14),
            name="ICICI Car Loan EMI",
            category=["Loan", "Transport"],
            city="Bangalore",
            **locations["Bangalore"]
        ))

    # 2.5 Telecom Subscriptions (Every 28 Days, exactly ₹350)
    for i in range(4):
        tx_date = base_date + timedelta(days=5 + (i * 28))
        if tx_date <= date.today():
            transactions.append(Transaction(
                transaction_id=f"jio_recharge_{i}",
                account_id="acc_002",
                amount=350.00,
                date=tx_date,
                name="Jio Recharge",
                category=["Utility", "Telecom"],
                city="Mumbai",
                **locations["Mumbai"]
            ))

    # 3. High-Velocity "Noise" Spending (Targeting ~₹1,25,700)
    # Increased quantity and average transaction size to drop savings rate to ~4%
    for i in range(85):
        random_date = base_date + timedelta(days=random.randint(0, 90))
        merchant_name = random.choice(["Swiggy", "Zomato", "Uber", "Amazon", "Blinkit", "Starbucks", "BookMyShow", "Apollo Pharmacy"])
        city_choice = random.choice(["Delhi", "Mumbai", "Bangalore"])
        
        # Real-life variance based on the seller
        if merchant_name in ["Swiggy", "Zomato", "Uber", "Blinkit", "Starbucks"]:
            amt = round(random.uniform(150.0, 750.0), 2)
        elif merchant_name in ["Apollo Pharmacy"]:
            amt = round(random.uniform(500.0, 1200.0), 2)
        else:
            amt = round(random.uniform(1000.0, 3500.0), 2)

        transactions.append(Transaction(
            transaction_id=f"rand_{i}",
            account_id="acc_003",
            amount=amt,
            date=random_date,
            name=merchant_name,
            category=["Lifestyle"],
            city=city_choice,
            **locations[city_choice]
        ))

    return accounts, transactions

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