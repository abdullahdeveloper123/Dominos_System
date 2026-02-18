import React, { useState } from 'react';
import { FaUpload, FaTimes, FaImage } from 'react-icons/fa';
import '../App.css';

const UploadBanners = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const MAX_FILES = 5;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setError('');
    setSuccess('');

    // Check if adding these files would exceed the limit
    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`You can only upload up to ${MAX_FILES} images`);
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add new files to existing ones
    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Create previews
    const newPreviews = [...previews];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({
          url: reader.result,
          name: file.name
        });
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
    setError('');
    setSuccess('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one image to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData to send files
      const formData = new FormData();
      selectedFiles.forEach((file, index) => {
        formData.append('images', file);
      });

      // First, upload the files to the server
      const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/upload_images`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.message || 'Failed to upload images');
      }

      // Now send the banner update request with image names
      const payload = {
        images_quantity: uploadData.uploadedFiles.length,
        images_name: uploadData.uploadedFiles
      };

      const bannerResponse = await fetch(`${process.env.REACT_APP_API_URL}/seller_account/update_banner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const bannerData = await bannerResponse.json();

      if (bannerResponse.ok && bannerData.success) {
        setSuccess(`Successfully uploaded ${uploadData.uploadedFiles.length} banner image(s)!`);
        // Clear the form
        setSelectedFiles([]);
        setPreviews([]);
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        throw new Error(bannerData.message || 'Failed to update banner');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload images. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-banners-container">
      <div className="upload-banners-header">
        <h2 className="upload-banners-title">Upload Banner Images</h2>
        <p className="upload-banners-subtitle">
          Upload up to {MAX_FILES} images for your store banners
        </p>
      </div>

      {error && (
        <div className="upload-message error-message-box">
          {error}
        </div>
      )}

      {success && (
        <div className="upload-message success-message-box">
          {success}
        </div>
      )}

      <div className="upload-banners-content">
        <div className="upload-area">
          <input
            type="file"
            id="banner-upload"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="upload-input-hidden"
            disabled={selectedFiles.length >= MAX_FILES || uploading}
          />
          <label 
            htmlFor="banner-upload" 
            className={`upload-label ${selectedFiles.length >= MAX_FILES ? 'disabled' : ''}`}
          >
            <FaUpload size={48} className="upload-icon" />
            <h3 className="upload-label-title">
              {selectedFiles.length >= MAX_FILES 
                ? 'Maximum images reached' 
                : 'Click to select images'}
            </h3>
            <p className="upload-label-text">
              {selectedFiles.length >= MAX_FILES
                ? `You have selected ${MAX_FILES} images (maximum)`
                : `Select up to ${MAX_FILES - selectedFiles.length} more image(s)`}
            </p>
            <p className="upload-label-hint">
              Supported formats: JPG, PNG, GIF, WebP
            </p>
          </label>
        </div>

        {previews.length > 0 && (
          <div className="upload-previews-section">
            <div className="upload-previews-header">
              <h3 className="upload-previews-title">
                Selected Images ({previews.length}/{MAX_FILES})
              </h3>
            </div>
            <div className="upload-previews-grid">
              {previews.map((preview, index) => (
                <div key={index} className="upload-preview-card">
                  <div className="upload-preview-image-container">
                    <img 
                      src={preview.url} 
                      alt={`Preview ${index + 1}`}
                      className="upload-preview-image"
                    />
                    <button
                      type="button"
                      className="upload-preview-remove"
                      onClick={() => removeImage(index)}
                      disabled={uploading}
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                  <div className="upload-preview-info">
                    <p className="upload-preview-name">{preview.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="upload-actions">
            <button
              type="button"
              className="upload-btn upload-clear-btn"
              onClick={() => {
                setSelectedFiles([]);
                setPreviews([]);
                setError('');
                setSuccess('');
              }}
              disabled={uploading}
            >
              Clear All
            </button>
            <button
              type="button"
              className="upload-btn upload-submit-btn"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <FaUpload size={16} />
                  Upload {selectedFiles.length} Image{selectedFiles.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}

        {selectedFiles.length === 0 && (
          <div className="upload-empty-state">
            <FaImage size={64} className="upload-empty-icon" />
            <p className="upload-empty-text">No images selected yet</p>
            <p className="upload-empty-hint">Click the upload area above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadBanners;
