import random
import os
import joblib
import numpy as np
import json


class BlackoutPredictor:
    """
    Machine learning model for predicting blackout chances.
    Loads a trained model from 'model.pkl' if available.
    Falls back to random prediction if model file is missing.
    """

    def __init__(self):
        self.model_path = "model.pkl"
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        else:
            self.model = None

    def predict(self, features):
        """
        Predict the chance of blackout given input features.

        Args:
            features (dict): Dictionary of feature names and values.

        Returns:
            float: Predicted blackout chance as a percentage (0 to 100).
        """
        if self.model:
            # Convert features dict to array in the correct order
            # Assuming the model expects features in sorted key order
            feature_keys = sorted(features.keys())
            X = np.array([features[k] for k in feature_keys]).reshape(1, -1)
            pred = self.model.predict_proba(X)
            # Assuming binary classification, get probability of positive class
            blackout_prob = pred[0][1] * 100
            return round(blackout_prob, 2)
        else:
            # Fallback to random prediction
            return round(random.uniform(0, 100), 2)

    def get_metrics(self):
        """
        Load and return the saved model evaluation metrics from 'metrics.json'.

        Returns:
            dict: Dictionary containing accuracy, precision, recall, f1_score, and confusion_matrix.
        """
        metrics_path = "metrics.json"
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                metrics = json.load(f)
            return metrics
        else:
            return None
