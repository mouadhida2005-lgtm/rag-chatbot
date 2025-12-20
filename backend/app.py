from flask import Flask, request, jsonify ,send_from_directory
from flask_cors import CORS
from agent.agent_config import build_agent
from embedding.build_index import build_index
import os
from werkzeug.utils import secure_filename
from files_manager.files_utils import *

app = Flask(__name__)
CORS(app)

# Configure upload settings
UPLOAD_FOLDER = './temp_uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'md', 'docx', 'html'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

agent = build_agent()  # initialize once

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"}), 200


@app.route("/api/chat", methods=["POST"])
def chat():
    """Chat endpoint - process user messages"""
    data = request.json
    user_msg = data.get("message", "")
    user_id = data.get("user_id")  # for per-user memory if you want
    
    # ask the agent to handle the message and return answer
    response = agent.run(user_message=user_msg, user_id=user_id)
    return jsonify({
        "reply": response.text, 
        "thoughts": response.debug if hasattr(response, "debug") else None
    }), 200

@app.route("/api/build-index", methods=["POST"])
def build_index_endpoint():
    """Build FAISS index from uploaded documents"""
    try:
        data = request.json or {}
        folder_path = data.get("folder_path", UPLOAD_FOLDER)
        
        print(f"Building index from: {folder_path}")
        
        # Call build_index function from build_index.py
        # This is a long-running operation, so we set a longer timeout
        result = build_index(folder_path=folder_path)
        
        if result["success"]:
            return jsonify({
                "message": "Index built successfully",
                "chunks_created": result["chunks_created"],
                "documents_processed": result["documents_processed"]
            }), 200
        else:
            error_msg = result.get("error", "Failed to build index")
            # Check if it's a quota error
            status_code = 429 if "quota" in error_msg.lower() or "429" in error_msg else 400
            return jsonify({
                "error": error_msg
            }), status_code
    
    except Exception as e:
        error_str = str(e)
        print(f"Error in build_index_endpoint: {error_str}")
        import traceback
        traceback.print_exc()
        
        # Check if it's a quota error
        if "quota" in error_str.lower() or "429" in error_str:
            return jsonify({
                "error": error_str
            }), 429
        else:
            return jsonify({
                "error": error_str
            }), 500


# FEEDING FILES MANAGEMENT END POINTS #####################
# ---------- POST: Upload Files ----------
@app.route("/api/files", methods=["POST"])
def upload_files():
    if "files" not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist("files")
    response = []

    for file in files:
        filename = secure_filename(file.filename)

        if not allowed_file(filename):
            response.append({
                "name": filename,
                "status": "rejected",
                "reason": "unsupported file type"
            })
            continue

        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        response.append({
            "name": filename,
            "status": "uploaded"
        })

    return jsonify(response), 201

# ---------- GET: List Files ----------
@app.route("/api/files", methods=["GET"])
def list_files():
    files = []

    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path) and allowed_file(filename):
            files.append(file_metadata(file_path))

    return jsonify(files), 200

# ---------- DELETE: Remove File ----------
@app.route("/api/files/<string:filename>", methods=["DELETE"])
def delete_file(filename):
    filename = secure_filename(filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    os.remove(file_path)
    return jsonify({"message": f"{filename} deleted successfully"}), 200

# DOWLOAD FILE END POINT
@app.route("/api/files/<string:filename>/download", methods=["GET"])
def download_file(filename):
    filename = secure_filename(filename)

    if not allowed_file(filename):
        return jsonify({"error": "Unsupported file type"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_from_directory(
        directory=UPLOAD_FOLDER,
        path=filename,
        as_attachment=True
    )







if __name__ == "__main__":
    # Configure to prevent constant restarts from venv file changes
    # The watchdog reloader detects changes in venv, causing connection resets during uploads
    
    # Option 1: Disable reloader for production-like stability (recommended for file uploads)
    # Set USE_RELOADER=False in environment to disable, or keep True for development
    use_reloader = os.environ.get('USE_RELOADER', 'True').lower() == 'true'
    
    app.run(
        host="0.0.0.0", 
        port=5000, 
        debug=True,
        use_reloader=use_reloader,  # Set to False to prevent restarts during uploads
        threaded=True  # Enable threading for better concurrent request handling
    )
