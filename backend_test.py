import requests
import sys
import json
import uuid
import time
from datetime import datetime

class FitTrackerProTester:
    def __init__(self, base_url="https://ca56087f-904a-47d2-9ebe-bb5f787bfe7e.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.premium_tests_run = 0
        self.premium_tests_passed = 0
        self.user_id = None
        self.state_param = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, params=params, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, params=params, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, params=params, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, params=params, headers=default_headers)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {json.dumps(response.json())}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        print(f"Root response: {response}")
        return success

    def test_health_endpoint(self):
        """Test the health endpoint"""
        success, response = self.run_test(
            "Health Endpoint",
            "GET",
            "health",
            200
        )
        print(f"Health response: {response}")
        
        if success and response.get('status') == 'healthy':
            print(f"✅ Health status is 'healthy'")
            return True
        else:
            print(f"❌ Health status is not 'healthy'")
            return False

    def test_strava_auth(self):
        """Test Strava authentication initiation"""
        success, response = self.run_test(
            "Strava Auth Initiation",
            "GET",
            "auth/strava",
            200
        )
        
        if success and 'auth_url' in response:
            auth_url = response['auth_url']
            print(f"Auth URL received: {auth_url[:50]}...")
            
            # Extract state parameter for callback testing
            import urllib.parse
            parsed_url = urllib.parse.urlparse(auth_url)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            if 'state' in query_params:
                self.state_param = query_params['state'][0]
                print(f"State parameter extracted: {self.state_param[:10]}...")
                return True
            else:
                print("❌ No state parameter in auth URL")
                return False
        else:
            return False

    def test_strava_callback_invalid(self):
        """Test Strava callback with invalid state"""
        success, _ = self.run_test(
            "Strava Callback Validation (Invalid State)",
            "GET",
            "auth/strava/callback",
            400,
            params={"code": "test_code", "state": "invalid_state_parameter"}
        )
        return success

    def test_nonexistent_user(self):
        """Test endpoints with non-existent user"""
        user_id = "non_existent_user_id"
        
        # Test GET user
        success1, _ = self.run_test(
            "User Endpoint (Non-existent User)",
            "GET",
            f"user/{user_id}",
            404
        )
        
        # Test GET user activities
        success2, _ = self.run_test(
            "User Activities Endpoint (Non-existent User)",
            "GET",
            f"user/{user_id}/activities",
            404
        )
        
        # Test GET user dashboard
        success3, _ = self.run_test(
            "User Dashboard Endpoint (Non-existent User)",
            "GET",
            f"user/{user_id}/dashboard",
            404
        )
        
        # Test DELETE user
        success4, _ = self.run_test(
            "Delete User Endpoint (Non-existent User)",
            "DELETE",
            f"user/{user_id}",
            404
        )
        
        return success1 and success2 and success3 and success4

    def find_valid_user(self):
        """Try to find a valid user to test premium features"""
        print("\n=== Testing Premium Features ===\n")
        
        # Try some common test UUIDs
        test_uuids = [
            "550e8400-e29b-41d4-a716-446655440000",
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            "7c9e6679-7425-40de-944b-e07fc1f90ae7",
            "123e4567-e89b-12d3-a456-426614174000"
        ]
        
        for test_id in test_uuids:
            success, response = self.run_test(
                f"Find Valid User (ID: {test_id})",
                "GET",
                f"user/{test_id}",
                200
            )
            if success:
                self.user_id = test_id
                print(f"✅ Found valid user with ID: {test_id}")
                return True
        
        # Check logs to see if there's a valid user ID
        try:
            success, response = self.run_test(
                "Get Dashboard for Recent User",
                "GET",
                "user/e5f79b7f-a404-43cf-bd8b-7d4688ee2267/dashboard",
                200
            )
            if success:
                self.user_id = "e5f79b7f-a404-43cf-bd8b-7d4688ee2267"
                print(f"✅ Found valid user with ID: {self.user_id}")
                return True
        except:
            pass
            
        print("❌ Could not find a valid user to test premium features")
        return False

    def test_premium_features(self):
        """Test premium features if a valid user is found"""
        if not self.user_id:
            if not self.find_valid_user():
                return False
        
        # Test dashboard with AI insights
        self.premium_tests_run += 1
        success1, dashboard = self.run_test(
            "User Dashboard with AI Insights",
            "GET",
            f"user/{self.user_id}/dashboard",
            200
        )
        if success1:
            self.premium_tests_passed += 1
            if 'ai_insights' in dashboard:
                print(f"✅ AI insights found in dashboard")
            else:
                print(f"❌ AI insights not found in dashboard")
                success1 = False
        
        # Test detailed activities with maps
        self.premium_tests_run += 1
        success2, activities = self.run_test(
            "User Activities with Map Data",
            "GET",
            f"user/{self.user_id}/activities",
            200,
            params={"detailed": "true"}
        )
        if success2:
            self.premium_tests_passed += 1
            if activities and len(activities) > 0:
                if 'map' in activities[0]:
                    print(f"✅ Map data found in activities")
                else:
                    print(f"❌ Map data not found in activities")
                    success2 = False
            else:
                print(f"❌ No activities found")
                success2 = False
        
        return success1 and success2

def main():
    tester = FitTrackerProTester()
    
    # Basic API tests
    basic_tests = [
        tester.test_root_endpoint(),
        tester.test_health_endpoint(),
        tester.test_strava_auth(),
        tester.test_strava_callback_invalid(),
        tester.test_nonexistent_user()
    ]
    
    # Premium features tests
    premium_success = tester.test_premium_features()
    
    # Print results
    print(f"\n📊 Basic tests passed: {tester.tests_passed}/{tester.tests_run}")
    if tester.premium_tests_run > 0:
        print(f"📊 Premium tests passed: {tester.premium_tests_passed}/{tester.premium_tests_run}")
    else:
        print(f"📊 Premium features: ❌ Not fully working")
    
    return 0 if all(basic_tests) and premium_success else 1

if __name__ == "__main__":
    # Run as a script
    sys.exit(main())
