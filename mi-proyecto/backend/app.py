from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import datetime

app = Flask(__name__)
CORS(app) 

# 1. CONFIGURACIÓN DE BASE DE DATOS
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 2. MODELOS DE DATOS (Las tablas de tu DB)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user') # 'user' o 'admin'
    posts = db.relationship('Message', backref='author', lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(500), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# Crear las tablas al iniciar
with app.app_context():
    db.create_all()

# 3. RUTAS DE AUTENTICACIÓN
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"error": "Faltan datos"}), 400

    hashed_pw = generate_password_hash(password, method='pbkdf2:sha256')
    
    # TIP: El primer usuario que se registre podrías hacerlo admin manualmente si quieres
    new_user = User(username=username, password=hashed_pw, role='user')
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "Usuario registrado"}), 201
    except:
        return jsonify({"error": "El usuario ya existe"}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data.get('username')).first()

    if user and check_password_hash(user.password, data.get('password')):
        return jsonify({
            "message": "Login exitoso",
            "user": {
                "id": user.id, 
                "username": user.username, 
                "role": user.role
            }
        }), 200
    
    return jsonify({"error": "Credenciales inválidas"}), 401

# 4. RUTAS DEL FORO (MENSAJES)
@app.route('/api/posts', methods=['GET'])
def get_posts():
    # Unimos las tablas Message y User para traer el nombre del autor
    messages = db.session.query(Message, User).join(User).order_by(Message.id.desc()).all()
    output = []
    for msg, user in messages:
        output.append({
            "id": msg.id,
            "text": msg.text,
            "username": user.username
            "date": msg.timestamp.isoformat("%H:%M")
        })
    return jsonify(output), 200

@app.route('/api/posts', methods=['POST'])
def create_post():
    data = request.json
    if not data.get('text') or not data.get('user_id'):
        return jsonify({"error": "Mensaje vacío"}), 400
        
    new_msg = Message(text=data['text'], user_id=data['user_id'])
    db.session.add(new_msg)
    db.session.commit()
    return jsonify({"message": "Publicado con éxito"}), 201

# NUEVA: Ruta para que el Admin pueda borrar mensajes
@app.route('/api/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    # Aquí deberías validar si el que borra es Admin, pero para la hackathon lo dejaremos simple
    post = Message.query.get(post_id)
    if post:
        db.session.delete(post)
        db.session.commit()
        return jsonify({"message": "Eliminado"}), 200
    return jsonify({"error": "No encontrado"}), 404

# 5. ARRANQUE
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)