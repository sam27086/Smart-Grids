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

if __name__ == '__main__':
    app.run(debug=True)
