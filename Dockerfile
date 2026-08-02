FROM node:20-alpine

WORKDIR /app

# نصب وابستگی‌ها در لایه‌ی جدا تا کش داکر بهتر کار کند
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
# Render مقدار PORT را در زمان اجرا تزریق می‌کند
EXPOSE 3405

CMD ["node", "main.js"]
