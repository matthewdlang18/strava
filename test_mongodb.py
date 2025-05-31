#!/usr/bin/env python3
"""
MongoDB Connection Test Script
Test your MongoDB URL before deploying
"""

import sys
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

def test_mongodb_connection(mongo_url):
    """Test MongoDB connection with the provided URL"""
    
    print("🔗 Testing MongoDB Connection...")
    print(f"📝 URL: {mongo_url[:50]}...")  # Show partial URL for security
    
    try:
        # Create client with timeout
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Test connection
        print("⏳ Connecting to MongoDB...")
        client.admin.command('ping')
        
        # Test database operations
        db = client.get_database('strava_fittracker')
        collection = db.get_collection('test_collection')
        
        # Insert test document
        print("📝 Testing write operation...")
        test_doc = {"test": "connection", "status": "working"}
        result = collection.insert_one(test_doc)
        
        # Read test document
        print("📖 Testing read operation...")
        found_doc = collection.find_one({"_id": result.inserted_id})
        
        # Clean up
        collection.delete_one({"_id": result.inserted_id})
        
        print("✅ MongoDB connection successful!")
        print("✅ Database read/write operations working!")
        print("🎉 Your MongoDB URL is configured correctly!")
        
        return True
        
    except ConnectionFailure as e:
        print("❌ Connection failed!")
        print(f"Error: {e}")
        return False
        
    except ServerSelectionTimeoutError as e:
        print("❌ Connection timeout!")
        print("This usually means:")
        print("  - Wrong credentials in URL")
        print("  - Network connectivity issues")
        print("  - MongoDB Atlas IP whitelist restrictions")
        print(f"Error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
        
    finally:
        try:
            client.close()
        except:
            pass

def main():
    """Main function"""
    
    print("🧪 MongoDB Connection Tester")
    print("=" * 40)
    
    # Check if pymongo is installed
    try:
        import pymongo
        print(f"✅ PyMongo version: {pymongo.version}")
    except ImportError:
        print("❌ PyMongo not installed!")
        print("Run: pip install pymongo")
        sys.exit(1)
    
    # Get MongoDB URL
    mongo_url = os.getenv('MONGO_URL')
    
    if not mongo_url:
        print("❌ MONGO_URL environment variable not set!")
        print()
        print("Usage:")
        print("  export MONGO_URL='your_mongodb_url_here'")
        print("  python test_mongodb.py")
        print()
        print("Or provide it directly:")
        mongo_url = input("Enter your MongoDB URL: ").strip()
        
        if not mongo_url:
            print("❌ No URL provided!")
            sys.exit(1)
    
    # Test connection
    success = test_mongodb_connection(mongo_url)
    
    if success:
        print()
        print("🚀 Ready for deployment!")
        print("Your MongoDB URL can be used in:")
        print("  - Render environment variables")
        print("  - Local .env file")
        print("  - GitHub Actions secrets")
        sys.exit(0)
    else:
        print()
        print("🔧 Please check your MongoDB setup:")
        print("  1. Verify username/password in URL")
        print("  2. Check MongoDB Atlas IP whitelist")
        print("  3. Ensure database user has proper permissions")
        sys.exit(1)

if __name__ == "__main__":
    main()
