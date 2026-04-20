##  Table of Contents

1. [IDS Engine (Backend - Python/Flask)](#ids-engine-backend---pythonflask)
2. [Management Server](#management-server-expressjs--mongodb)
3. [Security Dashboard](#security-dashboard-react--tailwind-css)
4. [Model Development](#model-development-cybersecipynb)
5. [Installation & Execution](#installation--execution)

## System Architecture
The project is architected into three specialized layers to ensure zero-latency threat detection and high data integrity:

## 1. IDS Engine (Backend - Python/Flask)

**Packet Interception**: Utilizes the Scapy library in sniffer.py to capture raw data packets directly from the network interface.

**Real-time Feature Engineering**: Extracts and maps 53 critical network features (Duration, Service ID, Source Bytes, TCP Flags, etc.) to align with the NSL-KDD data distribution.

**AI Inference**: app.py hosts a pre-trained LSTM (Long Short-Term Memory) model. The model processes incoming feature vectors against .keras weights to predict anomalies with high precision.

## 2. Management Server (Express.js & MongoDB)
**Security Gateway**: Coordinates between the Python sniffer and the database. It secures sensor data transmission using JWT (JSON Web Tokens).

**Data Persistence**: Records every detection (Normal/Anomaly) into a MongoDB cluster for historical forensic analysis.

**WebSocket Integration**: Employs Socket.io to "push" live threat data to the frontend, eliminating the need for page reloads and providing a seamless "live-stream" experience.

## 3. Security Dashboard (React & Tailwind CSS)
**Real-Time Visualization:** Renders a dynamic Threat Confidence Trend graph using Recharts.

**Dynamic Risk Meter:** A color-coded status panel that shifts between SECURE (Green), SUSPICIOUS (Yellow), and CRITICAL (Red) based on live AI confidence scores.

**Compliance Reporting:** Includes a one-click Export Report feature that generates a CSV audit log of all captured incidents.

## 4. Model Development (cybersec.ipynb)
The detection core is built on the NSL-KDD dataset, globally recognized for benchmarking Intrusion Detection Systems.

**Pre-processing:** Applied One-Hot Encoding to transform categorical variables (Protocol Types, TCP Flags) into numerical tensors.

**Model Architecture:** Developed using LSTM (Recurrent Neural Networks) to effectively capture temporal dependencies in network traffic.

**Performance Metrics:** * Accuracy: 99.22%

**Training:** 10 Epochs with iterative loss optimization.

**Format:** Exported to .keras for efficient production-level inference.

## 5. Installation & Execution

**Prerequisites**

Node.js & npm

Python 3.x

MongoDB (Running locally on port 27017)

**1. Setup Backend (AI & Sniffer)**
Bash
```
cd ids-backend
pip install scapy flask tensorflow requests pandas
python app.py # Starts the AI Bridge on port 5000
# In a new terminal (Admin/Sudo required for sniffing):
python sniffer.py
```
**2. Setup Server**
Bash
```
cd ids-server
npm install
npm start # Starts the MERN server on port 8080
```
**3. Setup Frontend**
Bash
```
cd ids-frontend
npm install
npm run dev # Launches the dashboard on port 5173
```
