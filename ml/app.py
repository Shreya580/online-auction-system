from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

# Load model once on startup
with open('model.pkl', 'rb') as f:
    bundle = pickle.load(f)

model        = bundle['model']
le_category  = bundle['le_category']
le_condition = bundle['le_condition']

@app.route('/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ML service running' })

@app.route('/predict-price', methods=['POST'])
def predict_price():
    data = request.get_json()

    category  = data.get('category')
    condition = data.get('condition')
    age       = int(data.get('age', 0))

    # Validate inputs
    known_categories = list(le_category.classes_)
    known_conditions = list(le_condition.classes_)

    if category not in known_categories:
        return jsonify({ 'error': f'Unknown category. Try: {known_categories}' }), 400

    if condition not in known_conditions:
        return jsonify({ 'error': f'Unknown condition. Try: {known_conditions}' }), 400

    # Encode inputs the same way as training
    cat_enc  = le_category.transform([category])[0]
    cond_enc = le_condition.transform([condition])[0]

    # Predict
    features = np.array([[cat_enc, cond_enc, age]])
    predicted = model.predict(features)[0]

    # Return a range: ±15% of predicted value
    low  = round(max(50, predicted * 0.85), -1)
    high = round(predicted * 1.15, -1)

    return jsonify({
        'suggestedPrice': round(predicted, -1),
        'priceRange': { 'low': low, 'high': high },
        'category':  category,
        'condition': condition,
        'age':       age
    })

@app.route('/autobid-increment', methods=['POST'])
def autobid_increment():
    data       = request.get_json()
    current    = float(data.get('currentBid', 0))
    max_budget = float(data.get('maxBudget', 0))

    if max_budget <= current:
        return jsonify({ 'shouldBid': False, 'reason': 'Max budget reached' })

    # Increment strategy — larger increments for higher-value items
    if current < 500:
        increment = 50
    elif current < 2000:
        increment = 100
    elif current < 10000:
        increment = 250
    else:
        increment = 500

    next_bid = current + increment

    if next_bid > max_budget:
        next_bid = max_budget  # bid exactly the max

    return jsonify({
        'shouldBid':  True,
        'nextBid':    next_bid,
        'increment':  increment,
        'remaining':  max_budget - next_bid
    })

if __name__ == '__main__':
    app.run(port=8000, debug=True)