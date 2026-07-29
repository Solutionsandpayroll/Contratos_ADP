FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY server/package.json server/package-lock.json* ./

RUN npm install --production

COPY server/ ./

EXPOSE 3001

CMD ["node", "index.js"]
