import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import pickle

# Load data
df = pd.read_csv('training_data.csv')

# Encode categorical columns — ML models need numbers, not strings
le_category  = LabelEncoder()
le_condition = LabelEncoder()

df['category_enc']  = le_category.fit_transform(df['category'])
df['condition_enc'] = le_condition.fit_transform(df['condition'])

# Features (input) and target (what we predict)
X = df[['category_enc', 'condition_enc', 'age']]
y = df['price']

# Split: 80% train, 20% test
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train Random Forest — an ensemble of decision trees
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2  = r2_score(y_test, y_pred)

print(f"Mean Absolute Error: ₹{mae:.0f}")
print(f"R² Score: {r2:.3f}  (1.0 = perfect, 0 = random)")

# Save model + encoders — Flask loads these on startup
with open('model.pkl', 'wb') as f:
    pickle.dump({
        'model':        model,
        'le_category':  le_category,
        'le_condition': le_condition,
    }, f)

print("Model saved to model.pkl")
