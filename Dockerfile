# Stage 1: Build React App
FROM node:20 AS frontend-build
ARG FRONTEND_ENV
ENV FRONTEND_ENV=${FRONTEND_ENV}
WORKDIR /app
COPY frontend/ /app/
RUN rm /app/.env
RUN touch /app/.env
RUN echo "${FRONTEND_ENV}" | tr ',' '\n' > /app/.env
RUN cat /app/.env
# Enhanced yarn install with network resilience and fallback strategies
RUN yarn config set network-timeout 300000 && \
    yarn config set network-retry 5 && \
    yarn config set registry https://registry.yarnpkg.com/ && \
    (yarn install --frozen-lockfile || \
     (echo "Primary registry failed, trying npm registry..." && \
      yarn config set registry https://registry.npmjs.org/ && \
      yarn install --frozen-lockfile) || \
     (echo "Both registries failed, trying with cache..." && \
      yarn install --frozen-lockfile --cache-folder ~/.yarn-cache --prefer-offline)) && \
    yarn build

# Stage 2: Install Python Backend
FROM python:3.11-slim as backend
WORKDIR /app
COPY backend/ /app/
RUN rm /app/.env
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final Image
FROM nginx:stable-alpine
# Copy built frontend
COPY --from=frontend-build /app/build /usr/share/nginx/html
# Copy backend
COPY --from=backend /app /backend
# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip \
    && pip3 install --break-system-packages -r /backend/requirements.txt

# Add env variables if needed
ENV PYTHONUNBUFFERED=1

# Start both services: Uvicorn and Nginx
CMD ["/entrypoint.sh"]
