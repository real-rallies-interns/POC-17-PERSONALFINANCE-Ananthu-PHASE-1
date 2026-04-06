import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_generator import get_mock_data, find_recurring_spends

app = FastAPI(title="Real Rails: Finance Graph")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/intelligence/rail-data")
def get_rail_intelligence():
    account, transactions = get_mock_data()
    df = pd.DataFrame([t.model_dump() for t in transactions])
    
    # Separate Income and Outflow using Pandas
    is_income = df['category'].apply(lambda c: 'Income' in c)
    total_income = df[is_income]['amount'].sum()
    total_spent = df[~is_income]['amount'].sum()
    
    recurring = find_recurring_spends(transactions)
    
    # --- NEW: DETERMINISTIC AI MODEL ---
    # 1. Calculate how much of the 90-day spend was purely recurring bills
    recurring_90d_total = sum(item["total_spent_90d"] for item in recurring)
    
    # 2. Isolate the "Noise" (Food, Uber, etc.)
    noise_90d_total = total_spent - recurring_90d_total
    
    # 3. Calculate the true daily burn rate for the random stuff
    daily_noise_rate = noise_90d_total / 90
    
    # Overall Runway
    daily_burn_rate = total_spent / 90
    runway_days = int(account.balances.current / daily_burn_rate) if daily_burn_rate > 0 else 999
    
    return {
        "main_stage": {
            "transactions": transactions,
        },
        "sidebar": {
            "metrics": {
                "total_spent": float(total_spent),
                "total_income": float(total_income),
                "runway_days": runway_days,
                "daily_noise_rate": float(daily_noise_rate) # Passing the new AI calculation
            },
            "why_it_matters": "Financial rails are the infrastructure of personal stability.",
            "governance": "Individual control over institutional payment cycles.",
            "insights": recurring
        }
    }