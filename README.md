# Llama Runner Async Proxy

This project implements an async HTTP proxy that forwards requests to Llama models. It is designed to be lightweight, fast, and easy to integrate into existing projects.

## Features
- **Async HTTP Proxy**
- **Plug‑and‑play architecture**
- **Customizable filters**
- **Extensible plugin system**

## Getting Started

1. Clone the repository
2. Install the requirements
3. Run the proxy

## Example Usage

```python
# Import the proxy client
from llama_runner_async_proxy import LlamaProxy

proxy = LlamaProxy()
response = proxy.call("What is the weather like today?")
print(response)
```

## Documentation

Please refer to the `docs/` directory for detailed documentation.

## Contributing

Contributions are welcome! Follow the coding conventions and run the tests before submitting a pull request.
