#!/usr/bin/env python3
"""
Advanced MongoDB Connection Test for Render Deployment
Tests multiple connection strategies to find the one that works on Render
"""

import os
import sys
import ssl
import certifi
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

def test_connection_strategies():
    """Test different MongoDB connection strategies for Render compatibility"""
    
    base_url = "mongodb+srv://strava_app:strava_app@strava-fittracker-pro.dvvyezk.mongodb.net/strava_fittracker"
    
    strategies = [
        {
            "name": "Strategy 1: No SSL parameters (Render auto-SSL)",
            "url": base_url,
            "extra_options": {}
        },
        {
            "name": "Strategy 2: Basic SSL enabled",
            "url": f"{base_url}?ssl=true",
            "extra_options": {}
        },
        {
            "name": "Strategy 3: SSL with retryWrites",
            "url": f"{base_url}?ssl=true&retryWrites=true&w=majority",
            "extra_options": {}
        },
        {
            "name": "Strategy 4: SSL with tlsInsecure (for Render)",
            "url": f"{base_url}?ssl=true&tlsInsecure=true",
            "extra_options": {}
        },
        {
            "name": "Strategy 5: Complete SSL bypass",
            "url": f"{base_url}?ssl=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true",
            "extra_options": {}
        },
        {
            "name": "Strategy 6: Enhanced SSL context",
            "url": base_url,
            "extra_options": {
                "ssl_context": True,
                "serverSelectionTimeoutMS": 30000,
                "connectTimeoutMS": 30000,
                "socketTimeoutMS": 30000
            }
        }
    ]
    
    working_strategies = []
    
    for strategy in strategies:
        print(f"\n🧪 Testing: {strategy['name']}")
        print(f"   URL: {strategy['url'][:80]}...")
        
        try:
            if strategy['extra_options'].get('ssl_context'):
                # Create SSL context
                ssl_context = ssl.create_default_context(cafile=certifi.where())
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                client = MongoClient(
                    strategy['url'],
                    ssl_context=ssl_context,
                    serverSelectionTimeoutMS=strategy['extra_options'].get('serverSelectionTimeoutMS', 5000),
                    connectTimeoutMS=strategy['extra_options'].get('connectTimeoutMS', 5000),
                    socketTimeoutMS=strategy['extra_options'].get('socketTimeoutMS', 5000)
                )
            else:
                client = MongoClient(strategy['url'], serverSelectionTimeoutMS=5000)
            
            # Test connection
            client.admin.command('ping')
            print(f"   ✅ SUCCESS!")
            working_strategies.append(strategy)
            
            client.close()
            
        except Exception as e:
            print(f"   ❌ FAILED: {str(e)[:100]}...")
    
    return working_strategies

async def test_async_strategies():
    """Test async MongoDB connections (Motor)"""
    
    base_url = "mongodb+srv://strava_app:strava_app@strava-fittracker-pro.dvvyezk.mongodb.net/strava_fittracker"
    
    print(f"\n🔄 Testing Async Connections (Motor)...")
    
    strategies = [
        {
            "name": "Async Strategy 1: Basic Motor connection",
            "url": base_url,
            "ssl_context": False
        },
        {
            "name": "Async Strategy 2: Motor with SSL context",
            "url": base_url,
            "ssl_context": True
        }
    ]
    
    working_async = []
    
    for strategy in strategies:
        print(f"\n🧪 Testing: {strategy['name']}")
        
        try:
            if strategy['ssl_context']:
                ssl_context = ssl.create_default_context(cafile=certifi.where())
                ssl_context.check_hostname = False
                ssl_context.verify_mode = ssl.CERT_NONE
                
                client = AsyncIOMotorClient(
                    strategy['url'],
                    ssl_context=ssl_context,
                    serverSelectionTimeoutMS=30000,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000
                )
            else:
                client = AsyncIOMotorClient(strategy['url'])
            
            # Test async connection
            await client.admin.command('ping')
            print(f"   ✅ ASYNC SUCCESS!")
            working_async.append(strategy)
            
            client.close()
            
        except Exception as e:
            print(f"   ❌ ASYNC FAILED: {str(e)[:100]}...")
    
    return working_async

def generate_render_config(working_strategies):
    """Generate recommended configuration for Render"""
    
    if not working_strategies:
        print("\n❌ No working strategies found!")
        return
    
    print(f"\n🎉 Found {len(working_strategies)} working strategies!")
    print("\n" + "="*60)
    print("📋 RECOMMENDED RENDER CONFIGURATION")
    print("="*60)
    
    best_strategy = working_strategies[0]
    
    print(f"\n🏆 Best Strategy: {best_strategy['name']}")
    print(f"📝 Recommended MONGO_URL for Render:")
    print(f"   {best_strategy['url']}")
    
    print(f"\n📋 Environment Variable:")
    print(f"   MONGO_URL={best_strategy['url']}")
    
    if len(working_strategies) > 1:
        print(f"\n🔄 Backup Options:")
        for i, strategy in enumerate(working_strategies[1:], 1):
            print(f"   {i}. {strategy['name']}")
            print(f"      URL: {strategy['url']}")

if __name__ == "__main__":
    print("🧪 Advanced MongoDB Connection Test for Render")
    print("=" * 50)
    
    # Test synchronous connections
    working_sync = test_connection_strategies()
    
    # Test asynchronous connections  
    working_async = asyncio.run(test_async_strategies())
    
    # Generate recommendations
    if working_sync or working_async:
        generate_render_config(working_sync)
        
        if working_async:
            print(f"\n✅ Async connections also working: {len(working_async)} strategies")
    else:
        print("\n💥 All connection strategies failed!")
        print("\n🔍 Troubleshooting steps:")
        print("1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0)")
        print("2. Verify username/password in connection string")
        print("3. Ensure MongoDB cluster is running")
        print("4. Try from a different network/environment")
