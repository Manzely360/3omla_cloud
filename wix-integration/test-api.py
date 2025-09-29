#!/usr/bin/env python3
"""
Test script to verify API is working and get ngrok URL
"""
import requests
import subprocess
import time
import json

def test_local_api():
    """Test if local API is working"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Local API is working!")
            return True
        else:
            print(f"❌ Local API returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Local API not accessible: {e}")
        return False

def get_ngrok_url():
    """Get ngrok public URL"""
    try:
        response = requests.get("http://localhost:4040/api/tunnels", timeout=5)
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get('tunnels', [])
            for tunnel in tunnels:
                if tunnel.get('proto') == 'https':
                    return tunnel.get('public_url')
        return None
    except Exception as e:
        print(f"❌ Could not get ngrok URL: {e}")
        return None

def start_ngrok():
    """Start ngrok tunnel"""
    try:
        # Kill any existing ngrok processes
        subprocess.run(["pkill", "ngrok"], capture_output=True)
        time.sleep(2)
        
        # Start ngrok
        subprocess.Popen(["ngrok", "http", "8000"], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        print("🚀 Starting ngrok tunnel...")
        time.sleep(5)
        return True
    except Exception as e:
        print(f"❌ Failed to start ngrok: {e}")
        return False

def main():
    print("🔧 Testing Coin Matcher API Setup")
    print("=" * 40)
    
    # Test local API
    if not test_local_api():
        print("❌ Please start your backend first: docker-compose up -d backend")
        return
    
    # Start ngrok
    if start_ngrok():
        time.sleep(3)
        url = get_ngrok_url()
        if url:
            print(f"🌐 Your public API URL: {url}")
            print(f"📋 Use this URL in your Wix integration: {url}")
            
            # Test the public URL
            try:
                response = requests.get(f"{url}/health", timeout=10)
                if response.status_code == 200:
                    print("✅ Public API is accessible!")
                else:
                    print(f"⚠️  Public API returned status {response.status_code}")
            except Exception as e:
                print(f"⚠️  Could not test public API: {e}")
        else:
            print("❌ Could not get ngrok URL")
    else:
        print("❌ Could not start ngrok")

if __name__ == "__main__":
    main()
