async function onContinue() {
  const canvas = FaceAI.capture.getLastCapture();
  if (!canvas) {
    FaceAI.ui.showError("No captured image found. Please retake.");
    return;
  }

  // Disable button and show loading state
  const btn = document.getElementById("continue-btn");
  const originalText = btn ? btn.textContent : "Continue";
  if (btn) {
    btn.textContent = "Uploading…";
    btn.disabled = true;
  }

  try {
    const response = await FaceAI.upload.send(canvas);
    console.log("Upload successful:", response);
    FaceAI.ui.showError(""); // clear any previous error
    if (btn) {
      btn.textContent = "Upload Successful";
    }
    // Tetap di state CAPTURED, atau bisa siap untuk langkah selanjutnya
  } catch (error) {
    console.error("Upload failed:", error.message);
    FaceAI.ui.showError(error.message);
    if (btn) {
      btn.textContent = "Retry Upload";
      btn.disabled = false;
    }
  }
}
