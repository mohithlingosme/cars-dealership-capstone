FROM node:20-slim
WORKDIR /app
COPY database/package*.json ./database/
RUN cd database && npm ci --omit=dev
COPY database/ ./database/
COPY data ./data
WORKDIR /app/database
EXPOSE 3030
CMD ["node", "app.js"]
