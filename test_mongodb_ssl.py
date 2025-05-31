#!/usr/bin/env python3
"""
MongoDB SSL Connection Test Script
Tests MongoDB connection with SSL parameters for Render deployment
"""

import os
import sys
from pymongo import MongoClient
from urllib.parse import quote_plus

def test_mongodb_connection():
    """Test MongoDB connection with different SSL configurations"""
    
    # Get MongoDB URL from environment
    mongo_url = os.getenv('MONGO_URL')
    
    if not mongo_url:
        print("❌ MONGO_URL environment variable not set")
        print("   Set it with: export MONGO_URL='your_mongodb_url_here'")
        return False
    
    print(f"🔍 Testing MongoDB connection...")
    print(f"   URL: {mongo_url[:50]}..." if len(mongo_url) > 50 else f"   URL: {mongo_url}")
    
    # Test 1: Basic connection
    try:
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command('ping')
        print("✅ Basic connection successful")
        
        # Test database operations
        db_name = os.getenv('DB_NAME', 'strava_fittracker')
        db = client[db_name]
        
        # Try to list collections
        collections = db.list_collection_names()
        print(f"✅ Database '{db_name}' accessible")
        print(f"   Collections: {collections if collections else 'None (empty database)'}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        
        # If SSL error, suggest SSL-enabled URL
        if 'SSL' in str(e) or 'TLS' in str(e) or 'handshake' in str(e).lower():
            print("\n🔧 SSL/TLS Error Detected!")
            print("   For Render deployment, try SSL-enabled URL:")
            
            # Extract base URL and add SSL parameters
            if '?' in mongo_url:
                base_url = mongo_url.split('?')[0]
                ssl_url = f"{base_url}?ssl=true&authSource=admin&tlsAllowInvalidCertificates=true"
            else:
                ssl_url = f"{mongo_url}?ssl=true&authSource=admin&tlsAllowInvalidCertificates=true"
            
            print(f"   {ssl_url}")
            print("\n   Update your MONGO_URL environment variable with this SSL-enabled version")
        
        return False

def check_ssl_requirements():
    """Check if SSL parameters are in the MongoDB URL"""
    mongo_url = os.getenv('MONGO_URL', '')
    
    ssl_params = ['ssl=true', 'authSource=admin', 'tlsAllowInvalidCertificates=true']
    missing_params = [param for param in ssl_params if param not in mongo_url]
    
    if missing_params:
        print(f"⚠️  Missing SSL parameters: {', '.join(missing_params)}")
        print("   Recommended for Render deployment")
    else:
        print("✅ SSL parameters configured")

if __name__ == "__main__":
    print("🧪 MongoDB SSL Connection Test")
    print("=" * 40)
    
    # Check SSL configuration
    check_ssl_requirements()
    print()
    
    # Test connection
    success = test_mongodb_connection()
    
    print()
    if success:
        print("🎉 MongoDB connection test PASSED!")
        print("   Your database is ready for deployment")
    else:
        print("💥 MongoDB connection test FAILED!")
        print("   Check the error messages above and fix the issues")
        print("\n💡 Common fixes:")
        print("   1. Check username/password in URL")
        print("   2. Add IP 0.0.0.0/0 to MongoDB Atlas Network Access")
        print("   3. Use SSL-enabled URL for Render deployment")
        
    sys.exit(0 if success else 1)
