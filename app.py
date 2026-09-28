from flask import Flask, render_template, request, jsonify, send_file
import os
from builder.database import init_db, list_projects, get_project, save_project, delete_project
from builder.models import create_demo_project, create_empty_project
from builder.generator import export_project

app = Flask(__name__)

@app.route('/')
def dashboard():
    projects = list_projects()
    return render_template('dashboard.html', projects=projects)

@app.route('/editor/<project_id>')
def editor(project_id):
    proj = get_project(project_id)
    if not proj:
        return "Project not found", 404
    return render_template('editor.html', project_id=project_id)

@app.route('/api/projects', methods=['POST'])
def create_project():
    data = request.json or {}
    name = data.get('name', 'New Project')
    if data.get('demo'):
        proj = create_demo_project()
    else:
        proj = create_empty_project(name)
    save_project(proj['id'], proj['name'], proj)
    return jsonify({"id": proj['id']})

@app.route('/api/projects/<project_id>', methods=['GET'])
def fetch_project(project_id):
    proj = get_project(project_id)
    if not proj:
        return jsonify({"error": "Not found"}), 404
    return jsonify(proj)

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.json
    if not data:
        return jsonify({"error": "Invalid data"}), 400
    save_project(project_id, data.get('name', 'Untitled'), data)
    return jsonify({"status": "success"})

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def remove_project(project_id):
    delete_project(project_id)
    return jsonify({"status": "success"})

@app.route('/api/projects/<project_id>/export', methods=['GET'])
def export_proj(project_id):
    try:
        zip_path = export_project(project_id)
        return send_file(zip_path, as_attachment=True, download_name=f"{project_id}_export.zip")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    if not list_projects():
        demo = create_demo_project()
        save_project(demo['id'], demo['name'], demo)
    os.makedirs('exports', exist_ok=True)
    app.run(debug=True, port=5000)
