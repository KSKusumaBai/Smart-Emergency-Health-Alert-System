from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import json
from datetime import datetime, timedelta
import secrets
import hashlib

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', secrets.token_hex(16))

# Simulated user database (in production, use a proper database)
users_db = {}
health_data_db = {}
emergency_contacts_db = {}

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('dashboard.html')

@app.route('/doctor-portal')
def doctor_portal():
    return render_template('doctor-portal.html')

@app.route('/settings')
def settings():
    if 'user_id' not in session:
        return redirect(url_for('index'))
    return render_template('settings.html')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if email in users_db:
        return jsonify({'error': 'User already exists'}), 400
    
    # Hash password
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    user_id = secrets.token_hex(16)
    users_db[email] = {
        'id': user_id,
        'name': name,
        'password_hash': password_hash,
        'created_at': datetime.now().isoformat()
    }
    
    session['user_id'] = user_id
    session['user_email'] = email
    
    return jsonify({'success': True, 'user_id': user_id})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email')
    password = data.get('password')
    
    if email not in users_db:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not password:
        return jsonify({'error': 'Password is required'}), 400
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    if users_db[email]['password_hash'] != password_hash:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    session['user_id'] = users_db[email]['id']
    session['user_email'] = email
    
    return jsonify({'success': True, 'user_id': users_db[email]['id']})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/health-data', methods=['POST'])
def store_health_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = session['user_id']
    
    if user_id not in health_data_db:
        health_data_db[user_id] = []
    
    health_record = {
        'timestamp': datetime.now().isoformat(),
        'heart_rate': data.get('heart_rate'),
        'blood_pressure_systolic': data.get('blood_pressure_systolic'),
        'blood_pressure_diastolic': data.get('blood_pressure_diastolic'),
        'temperature': data.get('temperature'),
        'activity_state': data.get('activity_state', 'rest'),
        'location': data.get('location'),
        'is_abnormal': data.get('is_abnormal', False),
        'analysis_result': data.get('analysis_result')
    }
    
    health_data_db[user_id].append(health_record)
    
    return jsonify({'success': True, 'record_id': len(health_data_db[user_id]) - 1})

@app.route('/api/health-data', methods=['GET'])
def get_health_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    data = health_data_db.get(user_id, [])
    
    # Filter by date range if provided
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date and end_date:
        filtered_data = []
        for record in data:
            record_date = datetime.fromisoformat(record['timestamp']).date()
            if datetime.fromisoformat(start_date).date() <= record_date <= datetime.fromisoformat(end_date).date():
                filtered_data.append(record)
        data = filtered_data
    
    return jsonify(data)

@app.route('/api/emergency-contacts', methods=['POST'])
def save_emergency_contacts():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = session['user_id']
    
    emergency_contacts_db[user_id] = data.get('contacts', [])
    
    return jsonify({'success': True})

@app.route('/api/emergency-contacts', methods=['GET'])
def get_emergency_contacts():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    contacts = emergency_contacts_db.get(user_id, [])
    
    return jsonify(contacts)

@app.route('/api/trigger-emergency', methods=['POST'])
def trigger_emergency():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json or {}
    user_id = session['user_id']
    
    # In a real implementation, this would send actual SMS/calls
    emergency_type = data.get('type', 'health_alert')
    location = data.get('location')
    health_data = data.get('health_data')
    
    # Log emergency trigger
    emergency_log = {
        'user_id': user_id,
        'type': emergency_type,
        'timestamp': datetime.now().isoformat(),
        'location': location,
        'health_data': health_data,
        'status': 'triggered'
    }
    
    return jsonify({'success': True, 'emergency_id': secrets.token_hex(8)})

@app.route('/api/doctor/abnormal-data', methods=['GET'])
def get_abnormal_data():
    # Doctor access to abnormal health data
    doctor_key = request.headers.get('Authorization')
    if not doctor_key or doctor_key != f"Bearer {os.getenv('DOCTOR_ACCESS_KEY', 'doctor123')}":
        return jsonify({'error': 'Unauthorized'}), 401
    
    all_abnormal_data = []
    for user_id, records in health_data_db.items():
        user_email = None
        for email, user_data in users_db.items():
            if user_data['id'] == user_id:
                user_email = email
                break
        
        abnormal_records = [r for r in records if r.get('is_abnormal', False)]
        if abnormal_records:
            all_abnormal_data.append({
                'user_id': user_id,
                'user_email': user_email,
                'records': abnormal_records
            })
    
    return jsonify(all_abnormal_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
