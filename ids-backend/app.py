from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
import tensorflow as tf
import numpy as np

app = Flask(__name__)
CORS(app)  # This is the "Magic Line" that lets React talk to Flask

# Load the saved model
try:
    model = tf.keras.models.load_model('ids_model.keras')
    print("Model 'ids_model.keras' loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the 53 features from the request
        data = request.json['features'] 

        # Convert to numpy array and reshape to (1, 1, 53)
        input_data = np.array(data).reshape(1, 1, 53)

        # Get prediction
        prediction = model.predict(input_data)
        raw_score = float(prediction[0][0])
        
        # Determine if it's an anomaly (Threshold: 0.5)
        is_anomaly = raw_score > 0.5  

        # Print to terminal for debugging
        print(f"--- Incoming Request ---")
        print(f"Prediction Score: {raw_score}")
        print(f"Result: {'ANOMALY' if is_anomaly else 'NORMAL'}")

        return jsonify({
            'is_anomaly': bool(is_anomaly), # Convert numpy bool to python bool
            'confidence': round(raw_score * 100, 2)
        })

    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    # Running on port 5000 as requested
    app.run(port=5000, debug=True, use_reloader=False)