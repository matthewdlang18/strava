#!/usr/bin/env python3
"""
MongoDB Connection Tester for Strava FitTracker Pro
Run this script to test your MongoDB Atlas connection
"""

import sys
import pymongo
from urllib.parse import quote_plus

def test_mongo_connection(mongo_url):
    """Test MongoDB connection and return status"""
    try:
        print("🔍 Testing MongoDB connection...")
        print(f"📍 URL: {mongo_url.split('@')[1].split('?')[0] if '@' in mongo_url else 'Invalid URL'}")
        
        # Create client
        client = pymongo.MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Test connection
        client.admin.command('ismaster')
        
        # Test database operations
        db = client.get_default_database() or client['strava_fittracker']
        collection = db.test_collection
        
        # Insert test document
        test_doc = {"test": "connection", "status": "working"}
        result = collection.insert_one(test_doc)
        
        # Read test document
        found_doc = collection.find_one({"_id": result.inserted_id})
        
        # Clean up test document
        collection.delete_one({"_id": result.inserted_id})
        
        print("✅ MongoDB connection successful!")
        print(f"📊 Database: {db.name}")
        print(f"🔗 Cluster: {mongo_url.split('@')[1].split('/')[0] if '@' in mongo_url else 'Unknown'}")
        print(f"✍️  Write test: {'✅ Success' if result.inserted_id else '❌ Failed'}")
        print(f"👀 Read test: {'✅ Success' if found_doc else '❌ Failed'}")
        
        client.close()
        return True
        
    except pymongo.errors.ServerSelectionTimeoutError:
        print("❌ Connection timeout - Check your network and MongoDB Atlas settings")
        print("💡 Troubleshooting:")
        print("   1. Verify your internet connection")
        print("   2. Check MongoDB Atlas Network Access (allow your IP)")
        print("   3. Verify cluster is running (not paused)")
        return False
        
    except pymongo.errors.OperationFailure as e:
        print(f"❌ Authentication failed: {e}")
        print("💡 Troubleshooting:")
        print("   1. Check username and password in connection string")
        print("   2. Verify user exists in Database Access")
        print("   3. Check user permissions")
        return False
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("💡 Check your MongoDB URL format")
        return False

def main():
    """Main function to test MongoDB connection"""
    print("🍃 MongoDB Connection Tester")
    print("=" * 40)
    
    # Try to get URL from environment or prompt user
    import os
    mongo_url = os.getenv('MONGO_URL')
    
    if not mongo_url:
        print("📝 Enter your MongoDB URL:")
        print("   Format: mongodb+srv://username:password@cluster.mongodb.net/database?ssl=true&authSource=admin&tlsAllowInvalidCertificates=true")
        print()
        mongo_url = input("MongoDB URL: ").strip()
    
    if not mongo_url:
        print("❌ No MongoDB URL provided")
        return False
    
    # Validate URL format
    if not mongo_url.startswith('mongodb'):
        print("❌ Invalid MongoDB URL format")
        print("💡 URL should start with 'mongodb://' or 'mongodb+srv://'")
        return False
    
    # Test connection
    success = test_mongo_connection(mongo_url)
    
    if success:
        print()
        print("🎉 Your MongoDB connection is working perfectly!")
        print("🚀 You can now use this URL in your deployment")
        print()
        print("📋 For deployment, add this to your environment variables:")
        print(f"   MONGO_URL={mongo_url}")
    else:
        print()
        print("🆘 Need help? Check MONGODB_SETUP.md for detailed instructions")
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n👋 Test cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)
