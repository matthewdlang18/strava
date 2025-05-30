import requests
import unittest
import sys
from datetime import datetime
import urllib.parse

class FitTrackerAPITester:
    def __init__(self, base_url="https://ca56087f-904a-47d2-9ebe-bb5f787bfe7e.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.auth_url = None
        self.state_param = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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
                    print(f"Response: {response.text}")
                except:
                    pass
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
        if success:
            print(f"Root response: {response}")
        return success

    def test_health_endpoint(self):
        """Test the health endpoint"""
        success, response = self.run_test(
            "Health Endpoint",
            "GET",
            "api/health",
            200
        )
        if success:
            print(f"Health response: {response}")
            if 'status' in response and response['status'] == 'healthy':
                print("✅ Health status is 'healthy'")
            else:
                print("❌ Health status is not 'healthy'")
                return False
        return success

    def test_strava_auth_initiation(self):
        """Test Strava auth initiation"""
        success, response = self.run_test(
            "Strava Auth Initiation",
            "GET",
            "api/auth/strava",
            200
        )
        if success:
            if 'auth_url' in response:
                self.auth_url = response['auth_url']
                print(f"Auth URL received: {self.auth_url[:60]}...")
                
                # Extract state parameter from auth_url
                parsed_url = urllib.parse.urlparse(self.auth_url)
                query_params = urllib.parse.parse_qs(parsed_url.query)
                if 'state' in query_params:
                    self.state_param = query_params['state'][0]
                    print(f"State parameter extracted: {self.state_param[:10]}...")
                    return True
                else:
                    print("❌ Failed - No state parameter in auth_url")
                    return False
            else:
                print("❌ Failed - No auth_url in response")
                return False
        return False

    def test_strava_callback_validation(self):
        """Test Strava callback validation with invalid state"""
        if not self.state_param:
            print("❌ Cannot test callback - No state parameter available")
            return False
            
        # Test with invalid state
        invalid_state = "invalid_state_parameter"
        success, response = self.run_test(
            "Strava Callback Validation (Invalid State)",
            "GET",
            "api/auth/strava/callback",
            400,
            params={"code": "test_code", "state": invalid_state}
        )
        
        # We expect this to fail with 400 status code
        return success

    def test_user_endpoint_not_found(self):
        """Test user endpoint with non-existent user ID"""
        non_existent_user_id = "non_existent_user_id"
        success, response = self.run_test(
            "User Endpoint (Non-existent User)",
            "GET",
            f"api/user/{non_existent_user_id}",
            404
        )
        
        # We expect this to fail with 404 status code
        return success

    def test_user_activities_not_found(self):
        """Test user activities endpoint with non-existent user ID"""
        non_existent_user_id = "non_existent_user_id"
        success, response = self.run_test(
            "User Activities Endpoint (Non-existent User)",
            "GET",
            f"api/user/{non_existent_user_id}/activities",
            404
        )
        
        # We expect this to fail with 404 status code
        return success

    def test_user_dashboard_not_found(self):
        """Test user dashboard endpoint with non-existent user ID"""
        non_existent_user_id = "non_existent_user_id"
        success, response = self.run_test(
            "User Dashboard Endpoint (Non-existent User)",
            "GET",
            f"api/user/{non_existent_user_id}/dashboard",
            404
        )
        
        # We expect this to fail with 404 status code
        return success

    def test_delete_user_not_found(self):
        """Test delete user endpoint with non-existent user ID"""
        non_existent_user_id = "non_existent_user_id"
        success, response = self.run_test(
            "Delete User Endpoint (Non-existent User)",
            "DELETE",
            f"api/user/{non_existent_user_id}",
            404
        )
        
        # We expect this to fail with 404 status code
        return success

class TestFitTrackerAPI(unittest.TestCase):
    def setUp(self):
        self.tester = FitTrackerAPITester()
    
    def test_root_endpoint(self):
        self.assertTrue(self.tester.test_root_endpoint())
        
    def test_health_endpoint(self):
        self.assertTrue(self.tester.test_health_endpoint())
    
    def test_strava_auth_initiation(self):
        self.assertTrue(self.tester.test_strava_auth_initiation())
        
    def test_strava_callback_validation(self):
        self.assertTrue(self.tester.test_strava_callback_validation())
        
    def test_user_endpoint_not_found(self):
        self.assertTrue(self.tester.test_user_endpoint_not_found())
        
    def test_user_activities_not_found(self):
        self.assertTrue(self.tester.test_user_activities_not_found())
        
    def test_user_dashboard_not_found(self):
        self.assertTrue(self.tester.test_user_dashboard_not_found())
        
    def test_delete_user_not_found(self):
        self.assertTrue(self.tester.test_delete_user_not_found())

def main():
    # Setup
    tester = FitTrackerAPITester()
    
    # Run tests
    root_success = tester.test_root_endpoint()
    health_success = tester.test_health_endpoint()
    strava_auth_success = tester.test_strava_auth_initiation()
    
    # Only run these tests if we have a state parameter from the auth test
    if strava_auth_success:
        callback_validation_success = tester.test_strava_callback_validation()
    else:
        callback_validation_success = False
        print("\n⚠️ Skipping callback validation test due to auth initiation failure")
    
    # Test user endpoints with non-existent user ID
    user_not_found_success = tester.test_user_endpoint_not_found()
    activities_not_found_success = tester.test_user_activities_not_found()
    dashboard_not_found_success = tester.test_user_dashboard_not_found()
    delete_user_not_found_success = tester.test_delete_user_not_found()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Return success only if all tests passed
    all_tests_passed = (
        root_success and 
        health_success and 
        strava_auth_success and 
        (callback_validation_success or not strava_auth_success) and
        user_not_found_success and
        activities_not_found_success and
        dashboard_not_found_success and
        delete_user_not_found_success
    )
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    # Run as a script
    sys.exit(main())