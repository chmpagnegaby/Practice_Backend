# Dockerfile de React
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Especificamos la variable de entorno del puerto
ENV PORT=5000

# Exponemos el puerto del backend
EXPOSE 5000

CMD ["npm", "start"]
