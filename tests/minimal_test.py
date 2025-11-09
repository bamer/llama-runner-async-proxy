import socket
import sys
import os
import time

print("=== TEST MINIMAL DE L'ENVIRONNEMENT ===")
print(f"Python version: {sys.version}")
print(f"Répertoire courant: {os.getcwd()}")
print("")

def test_port(port):
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        if result == 0:
            print(f"❌ Port {port}: OCCUPÉ")
            return False
        else:
            print(f"✅ Port {port}: LIBRE")
            return True
    except Exception as e:
        print(f"⚠️  Port {port}: erreur de test - {e}")
        return True  # considéré comme libre en cas d'erreur

print("🔍 Test des ports...")
ports = [12345, 11435, 8082, 8083, 1234, 11434, 8080, 8081]
available_ports = []

for port in ports:
    if test_port(port):
        available_ports.append(port)

print(f"\n📋 Ports disponibles: {available_ports}")

print("\n✅ Test minimal terminé avec succès")