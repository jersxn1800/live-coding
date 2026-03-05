# Usa una imagen ligera de Node
FROM python:3.11-slim

# Crea el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias y las instala
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del código
COPY . .

# Expone el puerto que usa tu app
EXPOSE 3000

# Comando para arrancar la app
CMD ["python", "app.py"]