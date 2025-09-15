"""
Script to download, preprocess, and train a machine learning model
using the Kaggle power system faults dataset.

This script assumes you have Kaggle API configured to download datasets.
"""

import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import json

import joblib

DATA_DIR = "data"
MODEL_PATH = "model.pkl"

def download_dataset():
    """
    Download the dataset using Kaggle API.
    Make sure you have kaggle CLI installed and configured.
    """
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    os.system(f"kaggle datasets download -d ziya07/power-system-faults-dataset -p {DATA_DIR} --unzip")

def load_data():
    """
    Load and preprocess the dataset.
    Returns features X and target y.
    """
    # Adjust the filename if needed based on dataset contents
    csv_path = os.path.join(DATA_DIR, "power_system_faults.csv")
    df = pd.read_csv(csv_path)

    # Example preprocessing: drop columns not needed, handle missing values
    # Adjust this based on actual dataset structure
    df = df.dropna()

    # Assuming the target column is named 'fault' (adjust as needed)
    X = df.drop(columns=['fault'])
    y = df['fault']

    return X, y

def train_model():
    """
    Train a RandomForestClassifier on the dataset and save the model.
    """
    print("Downloading dataset...")
    download_dataset()

    print("Loading and preprocessing data...")
    X, y = load_data()

    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training model...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = clf.predict(X_test)
    print(classification_report(y_test, y_pred))

    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted')
    recall = recall_score(y_test, y_pred, average='weighted')
    f1 = f1_score(y_test, y_pred, average='weighted')
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        'accuracy': accuracy,
        'precision': precision,
        'recall': recall,
        'f1_score': f1,
        'confusion_matrix': cm
    }

    # Save metrics to JSON file
    with open('metrics.json', 'w') as f:
        json.dump(metrics, f)

    print(f"Saving model to {MODEL_PATH}...")
    joblib.dump(clf, MODEL_PATH)
