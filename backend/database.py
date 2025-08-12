import sqlite3
from datetime import datetime

DB_NAME = 'blackout_predictions.db'

def init_db():
    """
    Initialize the SQLite database and create the predictions table if it doesn't exist.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            features TEXT NOT NULL,
            prediction REAL NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def save_prediction(location, features, prediction):
    """
    Save a prediction record to the database.

    Args:
        location (str): Location for the prediction.
        features (dict): Features used for prediction (will be stored as string).
        prediction (float): Predicted blackout chance.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO predictions (location, features, prediction, timestamp)
        VALUES (?, ?, ?, ?)
    ''', (location, str(features), prediction, datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()

def clear_all_predictions():
    """
    Delete all records from the predictions table.
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM predictions')
    conn.commit()
    conn.close()

def fetch_all_predictions():
    """
    Fetch all prediction records from the database.

    Returns:
        list of dict: List of prediction records with keys: id, location, features, prediction, timestamp
    """
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT id, location, features, prediction, timestamp FROM predictions ORDER BY timestamp DESC')
    rows = cursor.fetchall()
    conn.close()

    predictions = []
    for row in rows:
        predictions.append({
            'id': row[0],
            'location': row[1],
            'features': row[2],
            'prediction': row[3],
            'timestamp': row[4]
        })
    return predictions
