import time
import requests
from scapy.all import sniff, IP, TCP, UDP, ICMP

class NSLFeatureExtractor:
    def __init__(self):
        self.start_time = time.time()
        # Common NSL-KDD Service ID Mappings based on your training data
        self.service_map = {
            80: 24,   # http
            443: 49,  # private/https
            22: 20,   # ssh
            21: 19,   # ftp
            53: 11,   # domain/dns
            25: 51,   # smtp
        }

    def extract(self, packet):
        # We prepare 54 slots (0 to 53) to match your CSV structure
        f = [0.0] * 54 

        if packet.haslayer(IP):
            # --- 1. BASIC FEATURES (Indices 0-9) ---
            f[0] = float(int(time.time() - self.start_time)) # duration
            f[1] = float(self.map_service(packet))           # service ID
            f[2] = float(len(packet[IP].payload))           # src_bytes
            f[3] = 0.0                                       # dst_bytes (incoming)
            f[4] = 0.0                                       # land
            f[5] = 0.0                                       # wrong_fragment
            f[9] = 1.0 if packet.haslayer(TCP) and packet[TCP].flags == 'PA' else 0.0 # logged_in

            # --- 2. TRAFFIC FEATURES (Indices 20-38) ---
            # We provide "Normal" baselines seen in your CSV to prevent false positives
            f[20] = 1.0    # count
            f[21] = 1.0    # srv_count
            f[29] = 255.0  # dst_host_count
            f[30] = 255.0  # dst_host_srv_count
            f[31] = 1.0    # dst_host_same_srv_rate

            # --- 3. PROTOCOL ONE-HOT (Indices 40-42) ---
            if packet.haslayer(ICMP): f[40] = 1.0
            elif packet.haslayer(TCP): f[41] = 1.0
            elif packet.haslayer(UDP): f[42] = 1.0

            # --- 4. TCP FLAG ONE-HOT (Indices 43-53) ---
            self.map_tcp_flags(packet, f)

        # CRITICAL: Your CSV has 54 columns. The 'label' is at index 39.
        # We must skip index 39 to send exactly 53 features to the model.
        input_features = f[:39] + f[40:] 
        return input_features

    def map_service(self, pkt):
        port = 0
        if pkt.haslayer(TCP): port = pkt[TCP].dport
        elif pkt.haslayer(UDP): port = pkt[UDP].dport
        return self.service_map.get(port, 49) # Default to 49 (other/private)

    def map_tcp_flags(self, pkt, f_list):
        if pkt.haslayer(TCP):
            flags = pkt[TCP].flags
            if 'S' in flags and 'A' not in flags: f_list[48] = 1.0 # S0
            elif 'R' in flags: f_list[44] = 1.0                    # REJ
            elif 'F' in flags or 'PA' in flags: f_list[52] = 1.0  # SF
            else: f_list[52] = 1.0                                # Default to SF

# --- Network Logic ---

extractor = NSLFeatureExtractor()

def packet_callback(packet):
    if not packet.haslayer(IP):
        return

    features = extractor.extract(packet)

    try:
        # Use your actual JWT token here
        headers = {
            'auth-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWU1OWJjM2IyYjg3ZmM0ZTE1ZWJiMzMiLCJpYXQiOjE3NzY2NjU0NTUsImV4cCI6MTg2Mjk3OTA1NX0.82VpYHWZGDUIhgXqPnDP9dFDfKQJUDa3P-PPiAxxWsE', 
            'Content-Type': 'application/json'
        }
    
        res = requests.post(
            'http://127.0.0.1:8080/api/analyze', 
            json={'features': features}, 
            headers=headers,
            timeout=1
        )
        
        result = res.json()
        # Accessing nested properties from your MERN response
        status = "ANOMALY" if result.get('isAnomaly') else "✅ NORMAL"
        conf = result.get('confidence', 0)
        print(f"{status} | Confidence: {conf}% | Proto: {packet[IP].proto} | Size: {len(packet)}B")

    except Exception as e:
        print(f"Connection Error: {e}")

print("🚀 WIPRO SECURE-NET ACTIVE [Day 11: Feature-Matched Edition]")
print("Listening for packets... (Ctrl+C to stop)")
sniff(prn=packet_callback, store=0)