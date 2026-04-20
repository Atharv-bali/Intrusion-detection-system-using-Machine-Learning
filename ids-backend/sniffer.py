from scapy.all import sniff, IP, TCP
import requests

def packet_callback(packet):
    # Check if it's an IP packet
    if packet.haslayer(IP):
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        
        # Check if it has a TCP layer for payload, else use IP payload size
        if packet.haslayer(TCP):
            payload_size = len(packet[TCP].payload)
        else:
            payload_size = len(packet[IP].payload)

        # Corrected Print Statement
        print(f"Captured: {src_ip} -> {dst_ip} | Size: {payload_size}")

        # Prepare features for the AI model
        features = [0.0] * 53
        features[0] = payload_size / 1500.0  # Simple normalization

        try:
            # Send to Flask AI Bridge
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
            print("Logged to DB:", res.json())
        except Exception as e:
            print(f"Error: {e}")

# Start Sniffing
print("Monitoring Network Traffic... (Press Ctrl+C to stop)")
# We remove the filter temporarily to ensure we catch EVERYTHING
sniff(prn=packet_callback, store=0)

