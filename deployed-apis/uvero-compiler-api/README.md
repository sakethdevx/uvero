---
title: Uvero Compiler API
emoji: ⚡
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# Uvero Compiler API

Lightweight code execution API powering the [Uvero](https://uvero.vercel.app) online compiler.

## Supported Languages

Python 3, Node.js, C (GCC), C++ (G++), Java, Go, Rust, Ruby, PHP, Perl, Bash, Lua, R, and more.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service info |
| `GET` | `/health` | Health check |
| `GET` | `/languages` | List available languages |
| `POST` | `/execute` | Execute code |

## Execute Code

```bash
curl -X POST https://YOUR-SPACE.hf.space/execute \
  -H "Content-Type: application/json" \
  -d '{
    "language": "python",
    "code": "print(\"Hello from Uvero!\")",
    "stdin": "",
    "timeout": 10
  }'
```

## Response Format

```json
{
  "stdout": "Hello from Uvero!\n",
  "stderr": "",
  "compile_output": "",
  "exit_code": 0,
  "execution_time_ms": 42.5,
  "memory_used_kb": 0,
  "status": "success",
  "language": "python",
  "language_name": "Python 3"
}
```
