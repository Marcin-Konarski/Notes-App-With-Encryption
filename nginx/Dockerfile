FROM nginx:1.29-alpine

# Remove default configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy modified configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy SSL certificates (if using HTTPS)
# COPY ssl/ /etc/nginx/ssl/

EXPOSE 80
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]