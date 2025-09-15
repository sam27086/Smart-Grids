import json
from flask import Flask, request, jsonify
from model import BlackoutPredictor
from database import init_db, save_prediction, clear_all_predictions, fetch_all_predictions
from flask_cors import CORS


app = Flask(__name__, static_folder='../frontend', static_url_path='/')
CORS(app)  # Enable CORS for all routes

# Initialize the database
init_db()

# Initialize the placeholder ML model
model = BlackoutPredictor()

@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint to predict blackout chances for a given location.
    Expects JSON payload with 'location' and 'features' (dict of feature values).
    """
    data = request.get_json()
    if not data or 'location' not in data or 'features' not in data:
        return jsonify({'error': 'Invalid input, expected JSON with location and features'}), 400

    location = data['location']
    features = data['features']

    # Use the model to predict blackout chance
    prediction = model.predict(features)

    # Save the prediction to the database
    save_prediction(location, features, prediction)

    # Update metrics based on input features
    feature1 = features.get('feature1', 0)
    feature2 = features.get('feature2', 0)
    feature3 = features.get('feature3', 0)
    new_metrics = {
        'accuracy': feature1 / 100,
        'precision': feature2 / 100,
        'recall': feature3 / 100,
        'f1_score': (feature1 + feature2 + feature3) / 300,
        'confusion_matrix': [[int(feature1), int(feature2)], [int(feature3), int(prediction)]]
    }
    with open('../metrics.json', 'w') as f:
        json.dump(new_metrics, f)

    return jsonify({'location': location, 'blackout_chance': prediction})


@app.route('/clear_data', methods=['POST'])
def clear_data():
    """
    API endpoint to clear all prediction data from the database.
    """
    clear_all_predictions()
    return jsonify({'message': 'All prediction data cleared.'})

@app.route('/history', methods=['GET'])
def history():
    """
    API endpoint to fetch all prediction history.
    """
    predictions = fetch_all_predictions()
    return jsonify(predictions)

@app.route('/metrics', methods=['GET'])
def get_metrics():
    """
    API endpoint to fetch model performance metrics.
    """
    try:
        with open('../metrics.json', 'r') as f:
            metrics = json.load(f)

        # Convert metrics values to float if they are strings
        for key in ['accuracy', 'precision', 'recall', 'f1_score']:
            if key in metrics and isinstance(metrics[key], str):
                try:
                    metrics[key] = float(metrics[key])
                except ValueError:
                    pass
        return jsonify(metrics)
    except FileNotFoundError:
        return jsonify({'error': 'Metrics file not found.'}), 404


if __name__ == '__main__':
    app.run(debug=True)
