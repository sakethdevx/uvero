# ─── Uvero Compiler API ───────────────────────────────────────────────────────
# Lightweight code execution service for HuggingFace Spaces
# Supports: Python, Node.js, C, C++, Java, Go, Rust, Ruby, PHP, Perl, Bash, Lua, R
# ──────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Create non-root user (HuggingFace requirement: UID 1000)
RUN useradd -m -u 1000 user

# Install system packages: compilers, interpreters, runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    # C / C++
    gcc g++ \
    # Java
    default-jdk \
    # Node.js
    nodejs npm \
    # Go
    golang \
    # Ruby
    ruby \
    # PHP
    php-cli \
    # Perl
    perl \
    # Bash (already included)
    # Lua
    lua5.4 \
    # R
    r-base-core \
    # Utilities
    curl wget \
    && rm -rf /var/lib/apt/lists/*

# Install Rust via rustup (system-level so user 1000 can access)
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path \
    && chmod -R a+rw $RUSTUP_HOME $CARGO_HOME

# Make lua accessible as 'lua'
RUN ln -sf /usr/bin/lua5.4 /usr/bin/lua || true

# Set working directory
WORKDIR /app

# Copy requirements and install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Create temp directory for code execution with proper permissions
RUN mkdir -p /tmp/uvero && chmod 777 /tmp/uvero

# Switch to non-root user
USER user

# Expose port (HuggingFace Spaces default: 7860)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Start the API server
CMD ["python", "app.py"]
