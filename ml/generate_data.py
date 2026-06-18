import pandas as pd
import numpy as np
import random

random.seed(42)
np.random.seed(42)

categories = {
    'Electronics': {'base': 5000, 'depreciation': 0.25},
    'Furniture':   {'base': 3000, 'depreciation': 0.15},
    'Clothing':    {'base': 800,  'depreciation': 0.20},
    'Books':       {'base': 300,  'depreciation': 0.10},
    'Antiques':    {'base': 8000, 'depreciation': -0.05},  # appreciate with age
    'Sports':      {'base': 2000, 'depreciation': 0.18},
    'Art':         {'base': 6000, 'depreciation': -0.03},
}

condition_multiplier = {
    'new':  1.0,
    'good': 0.65,
    'fair': 0.35,
}

rows = []
for _ in range(1000):
    category = random.choice(list(categories.keys()))
    condition = random.choice(list(condition_multiplier.keys()))
    age = random.randint(0, 15)

    base = categories[category]['base']
    dep  = categories[category]['depreciation']

    # price = base * condition_factor * (1 - depreciation * age) + noise
    price = base * condition_multiplier[condition] * max(0.1, 1 - dep * age)
    price += np.random.normal(0, price * 0.1)  # 10% noise
    price = max(50, round(price, -1))           # minimum ₹50, round to 10s

    rows.append({
        'category':  category,
        'condition': condition,
        'age':       age,
        'price':     price
    })

df = pd.DataFrame(rows)
df.to_csv('training_data.csv', index=False)
print(f"Generated {len(df)} rows")
print(df.head(10))
print(df.describe())