from flask import Flask, request, jsonify, render_template, send_from_directory
import tensorflow as tf
from PIL import Image
import numpy as np
import io
import os
from tensorflow.keras.preprocessing.image import load_img, img_to_array

app = Flask(__name__)

try:
    model = tf.keras.models.load_model('vit_classifier_mode.h5')
except Exception as e:
    print(f"Error loading model: {str(e)}")
    model = None

def preprocess_image(image_file):
    try:
        image_bytes = image_file.read()
        img_io = io.BytesIO(image_bytes)
        img = Image.open(img_io)
    
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        img = img.resize((100, 100))
        
        img_array = img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        
        return img_array
    
    except Exception as e:
        print(f"Error in preprocessing: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500

        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        input_data = preprocess_image(file)
        
        if input_data is None:
            return jsonify({'error': 'Error preprocessing image'}), 400

        # Make prediction
        prediction = model.predict(input_data)
        class_0_confidence = float(prediction[0][0])  

        # Determine result and confidence
        if class_0_confidence > 0.5:
            result = 'Uninfected'
            confidence = round(class_0_confidence * 100, 2)
        else:
            result = 'Infected'
            confidence = round((1 - class_0_confidence) * 100, 2)

        return jsonify({
            'prediction': result,
            'confidence': confidence,
            'status': 'success'
        })

    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    app.run(debug=True)