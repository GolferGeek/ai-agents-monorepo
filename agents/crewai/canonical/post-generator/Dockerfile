# Use our base image
FROM ai-agents-base:latest

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    HOME="/app/home"

# Set working directory
WORKDIR /app

# Copy project files
COPY --chown=appuser:appuser pyproject.toml .
COPY --chown=appuser:appuser src/ src/

# Switch to non-root user
USER appuser

# Install project-specific dependencies
RUN . $VIRTUAL_ENV/bin/activate && uv pip install --no-cache-dir -e .

# Create mem0 directory with proper permissions
RUN mkdir -p /app/home/.mem0

# Expose port 5002
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5002/health || exit 1

# Command to run the application
CMD ["python", "-m", "uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "5002", "--workers", "4", "--timeout-keep-alive", "300", "--timeout-graceful-shutdown", "300", "--limit-concurrency", "4"] 