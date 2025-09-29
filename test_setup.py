#!/usr/bin/env python3
"""
Test script to verify the 3OMLA Intelligence Hub setup
"""

import os
import sys
import subprocess
import time
import requests
from pathlib import Path

def print_status(message, status="INFO"):
    colors = {
        "INFO": "\033[94m",
        "SUCCESS": "\033[92m", 
        "WARNING": "\033[93m",
        "ERROR": "\033[91m"
    }
    reset_color = '\033[0m'
    color = colors.get(status, '')
    print(f"{color}[{status}]{reset_color if status in colors else ''} {message}")

def check_file_exists(file_path, description):
    if Path(file_path).exists():
        print_status(f"✓ {description}", "SUCCESS")
        return True
    else:
        print_status(f"✗ {description} - File not found: {file_path}", "ERROR")
        return False

def check_docker():
    try:
        result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print_status("✓ Docker is installed", "SUCCESS")
            return True
        else:
            print_status("✗ Docker is not installed or not working", "ERROR")
            return False
    except FileNotFoundError:
        print_status("✗ Docker is not installed", "ERROR")
        return False

def check_docker_compose():
    try:
        result = subprocess.run(["docker-compose", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print_status("✓ Docker Compose is installed", "SUCCESS")
            return True
        else:
            print_status("✗ Docker Compose is not installed or not working", "ERROR")
            return False
    except FileNotFoundError:
        print_status("✗ Docker Compose is not installed", "ERROR")
        return False

def check_env_file():
    env_file = Path(".env")
    if env_file.exists():
        print_status("✓ .env file exists", "SUCCESS")
        
        # Check if it's configured
        with open(env_file, 'r') as f:
            content = f.read()
            if "your_binance_api_key" in content:
                print_status("⚠ .env file needs configuration (Binance API keys)", "WARNING")
                return False
            else:
                print_status("✓ .env file appears to be configured", "SUCCESS")
                return True
    else:
        print_status("✗ .env file not found - run: cp env.example .env", "ERROR")
        return False

def test_api_connection():
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print_status("✓ Backend API is responding", "SUCCESS")
            return True
        else:
            print_status(f"✗ Backend API returned status {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"✗ Backend API is not responding: {e}", "ERROR")
        return False

def test_frontend_connection():
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print_status("✓ Frontend is responding", "SUCCESS")
            return True
        else:
            print_status(f"✗ Frontend returned status {response.status_code}", "ERROR")
            return False
    except requests.exceptions.RequestException as e:
        print_status(f"✗ Frontend is not responding: {e}", "ERROR")
        return False

def main():
    print_status("🔍 Testing 3OMLA Intelligence Hub Setup", "INFO")
    print("=" * 60)
    
    # Check prerequisites
    print_status("Checking prerequisites...", "INFO")
    docker_ok = check_docker()
    compose_ok = check_docker_compose()
    env_ok = check_env_file()
    
    if not (docker_ok and compose_ok):
        print_status("Please install Docker and Docker Compose first", "ERROR")
        sys.exit(1)
    
    # Check project structure
    print_status("\nChecking project structure...", "INFO")
    required_files = [
        ("docker-compose.yml", "Docker Compose configuration"),
        ("backend/main.py", "Backend main application"),
        ("backend/requirements.txt", "Backend dependencies"),
        ("frontend/package.json", "Frontend package configuration"),
        ("frontend/pages/index.tsx", "Frontend main page"),
        ("data-ingestion/services/binance_websocket.py", "Data ingestion service"),
        ("start.sh", "Startup script"),
        ("README.md", "Documentation")
    ]
    
    all_files_ok = True
    for file_path, description in required_files:
        if not check_file_exists(file_path, description):
            all_files_ok = False
    
    if not all_files_ok:
        print_status("Some required files are missing", "ERROR")
        sys.exit(1)
    
    # Check if services are running
    print_status("\nChecking running services...", "INFO")
    
    # Test API connection
    api_ok = test_api_connection()
    frontend_ok = test_frontend_connection()
    
    if api_ok and frontend_ok:
        print_status("\n🎉 All services are running correctly!", "SUCCESS")
        print_status("You can access the application at:", "INFO")
        print_status("  Frontend: http://localhost:3000", "INFO")
        print_status("  Backend API: http://localhost:8000", "INFO")
        print_status("  API Docs: http://localhost:8000/docs", "INFO")
    else:
        print_status("\n⚠ Some services are not running", "WARNING")
        print_status("Run './start.sh' to start all services", "INFO")
    
    # Final recommendations
    print_status("\n📋 Next Steps:", "INFO")
    if not env_ok:
        print_status("1. Configure your .env file with Binance API keys", "INFO")
    print_status("2. Start services with: ./start.sh", "INFO")
    print_status("3. Access the application at http://localhost:3000", "INFO")
    print_status("4. Check the README.md for detailed usage instructions", "INFO")
    
    print("\n" + "=" * 60)
    print_status("Setup verification complete!", "SUCCESS")

if __name__ == "__main__":
    main()
