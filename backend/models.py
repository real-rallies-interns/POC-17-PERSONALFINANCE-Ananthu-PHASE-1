from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date  # <--- This is the missing piece!

# 1. Balance Schema
class Balance(BaseModel):
    available: Optional[float] = None
    current: float
    limit: Optional[float] = None
    currency: str = "INR"  # <-- Changed from USD

# 2. Account Schema
class Account(BaseModel):
    account_id: str
    name: str
    type: str
    subtype: str
    balances: Balance

# 3. Transaction Schema
class Transaction(BaseModel):
    # Metadata
    record_label: str = "SYNTHETIC_DATA_DO_NOT_USE_IN_PRODUCTION"
    
    # Core IDs
    transaction_id: str
    account_id: str
    user_id: str = "USR-0001"
    
    # Persona Data
    user_name: str = "Synthetic User"
    user_age: int = 30
    
    # Temporal Data
    date: date
    month: str  # YYYY-MM
    
    # Transaction Details
    name: str
    category: List[str]
    subcategory: Optional[str] = None
    amount: float
    currency: str = "INR"
    direction: str  # 'credit' or 'debit'
    
    # Institutional Data
    account_type: str = "Checking"
    institution: str = "Synthetic Bank"
    balance_after: float
    is_recurring: bool = False
    
    # Budgeting & Risk
    budget_limit: Optional[float] = None
    budget_pct_used: Optional[float] = None
    tags: str = "general"
    note: str = ""
    risk_flag: bool = False
    anomaly_score: float = 0.0
    
    # FX Data
    fx_rate_to_usd: float = 0.012
    original_currency: str = "INR"
    original_amount: float
    
    # Legacy field (keeping for compatibility if used)
    pending: bool = False
    
    # Map coordinates (needed for current frontend visualization if it uses them)
    lat: Optional[float] = None
    lon: Optional[float] = None