// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    const inputImage = document.getElementById('inputImage');
    const imagePreview = document.getElementById('imagePreview');
    const btnPredict = document.getElementById('btn-predict');
    const predictionResult = document.getElementById('predictionResult');
    const imagePreviewContainer = document.querySelector('.image-preview');

    // Image upload and preview functionality
    inputImage.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size too large. Please select an image under 5MB.');
                inputImage.value = '';
                return;
            }

            // Check file type
            if (!file.type.match('image.*')) {
                alert('Please select an image file.');
                inputImage.value = '';
                return;
            }

            const reader = new FileReader();
            
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreviewContainer.style.display = 'block';
                predictionResult.innerHTML = '';
            };

            reader.onerror = function() {
                alert('Error reading file.');
                imagePreviewContainer.style.display = 'none';
            };

            reader.readAsDataURL(file);
        } else {
            imagePreviewContainer.style.display = 'none';
            imagePreview.src = '';
        }
    });

    btnPredict.addEventListener('click', async function() {
        if (!inputImage.files || inputImage.files.length === 0) {
            predictionResult.innerHTML = '<div class="alert alert-warning">Please select an image first.</div>';
            return;
        }

        try {
            // Show loading state
            btnPredict.disabled = true;
            predictionResult.innerHTML = '<div class="alert alert-info">Analyzing image...</div>';

            const formData = new FormData();
            formData.append('image', inputImage.files[0]);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                const resultClass = data.prediction === 'Infected' ? 'alert-danger' : 'alert-success';
                predictionResult.innerHTML = `
                    <div class="alert ${resultClass}">
                        <strong>Result:</strong> ${data.prediction}<br>
                        <strong>Confidence:</strong> ${data.confidence}%
                    </div>`;
            } else {
                throw new Error(data.error || 'Prediction failed');
            }
        } catch (error) {
            predictionResult.innerHTML = `
                <div class="alert alert-danger">
                    Error: ${error.message}
                </div>`;
        } finally {
            btnPredict.disabled = false;
        }
    });
});