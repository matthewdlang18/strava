import requests
import unittest
import sys
from datetime import datetime

class FitTrackerAPITester:
    def __init__(self, base_url="https://ca56087f-904a-47d2-9ebe-bb5f787bfe7e.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

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
                print(f"Auth URL received: {response['auth_url'][:60]}...")
                return True
            else:
                print("❌ Failed - No auth_url in response")
                return False
        return False

class TestFitTrackerAPI(unittest.TestCase):
    def setUp(self):
        self.tester = FitTrackerAPITester()
    
    def test_health_endpoint(self):
        self.assertTrue(self.tester.test_health_endpoint())
    
    def test_strava_auth_initiation(self):
        self.assertTrue(self.tester.test_strava_auth_initiation())

def main():
    # Setup
    tester = FitTrackerAPITester()
    
    # Run tests
    health_success = tester.test_health_endpoint()
    strava_auth_success = tester.test_strava_auth_initiation()
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    # Return success only if all tests passed
    return 0 if health_success and strava_auth_success else 1

if __name__ == "__main__":
    # Run as a script
    sys.exit(main())