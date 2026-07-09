# FaceAI Development Environment

**Last Updated:** 2026-07-09

---

# System Information

| Item                | Value                  |
| ------------------- | ---------------------- |
| Operating System    | Windows 10 Home 64-bit |
| Windows Version     | 2009                   |
| Device Manufacturer | Acer                   |
| Device Model        | Nitro AN515-58         |
| BIOS Version        | V2.19 (Insyde Corp.)   |

---

# Hardware

## CPU

- 12th Gen Intel® Core™ i9-12900H
- 14 Physical Cores
- 20 Logical Processors

## RAM

- 16 GB

## GPU

### Dedicated GPU

- NVIDIA GeForce RTX 3060 Laptop GPU

Driver Version:

32.0.15.9595

### Integrated GPU

- Intel UHD Graphics

Driver Version:

31.0.101.5081

---

# Camera

Default Camera:

- Acer HD User Facing Camera

Additional Device Detected:

- Logitech Webcam C930e (Status: Unknown)

---

# Storage

| Drive |     Total |      Free |
| ----- | --------: | --------: |
| C:    | 366.96 GB | 101.12 GB |
| D:    | 476.94 GB | 469.91 GB |
| E:    | 585.94 GB | 541.86 GB |

---

# Development Tools

| Tool   | Version          |
| ------ | ---------------- |
| Python | 3.10.11          |
| pip    | 23.0.1           |
| Git    | 2.55.0.windows.2 |

---

# Python Environment

Project uses:

- Python Virtual Environment (`.venv`)

All project dependencies must be installed inside the virtual environment.

Global Python packages should not be used for project development.

---

# Browser

Primary Browser:

- Google Chrome (Latest Stable)

---

# IDE

Primary IDE:

- Visual Studio Code

---

# Project Backend

Framework:

- FastAPI

Server:

- Uvicorn

---

# AI Stack (Planned)

The following technologies are planned but NOT yet implemented:

- OpenCV
- InsightFace
- ONNX Runtime
- SQLite

---

# Notes

- Environment verified during Milestone 1.
- Backend successfully started using Uvicorn.
- FastAPI root endpoint (`/`) is working.
- FastAPI documentation (`/docs`) is accessible.
- No known environment issues at the time of writing.

---

# Future Updates

Update this document whenever one of the following changes:

- Python version
- GPU driver
- Windows version
- Major library versions
- IDE
- Browser
- Camera hardware
- Development workflow
