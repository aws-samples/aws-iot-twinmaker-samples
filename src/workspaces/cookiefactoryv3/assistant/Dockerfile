FROM --platform=linux/amd64 node:20-slim
RUN npm install -g pnpm

# Install Python and other dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    unzip \
    jq

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf awscliv2.zip aws


# Copy your application files
WORKDIR /app
COPY . .

# Install dependencies using your install.sh script
RUN sh install.sh

# Expose the port Chainlit will listen on 
EXPOSE 8000  

# Start the Chainlit app using your run.sh script
CMD ["sh", "run.sh"] 