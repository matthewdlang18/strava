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

def test_premium_features():
    """Test the premium features of the API"""
    print("\n=== Testing Premium Features ===")
    
    # We need a valid user ID to test premium features
    # For testing purposes, we'll use a hardcoded user ID that might exist in the database
    # In a real test environment, we would create a test user with valid Strava tokens
    
    test_user_ids = [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "123e4567-e89b-12d3-a456-426614174000"
    ]
    
    tester = FitTrackerAPITester()
    found_user = False
    
    # Try to find a valid user
    for user_id in test_user_ids:
        success, response = tester.run_test(
            f"Find Valid User (ID: {user_id})",
            "GET",
            f"api/user/{user_id}",
            200
        )
        
        if success:
            found_user = True
            valid_user_id = user_id
            print(f"✅ Found valid user with ID: {valid_user_id}")
            break
    
    if not found_user:
        print("❌ Could not find a valid user to test premium features")
        return False
    
    # Test dashboard with enhanced stats
    dashboard_success, dashboard_data = tester.run_test(
        "Dashboard with Enhanced Stats",
        "GET",
        f"api/user/{valid_user_id}/dashboard",
        200
    )
    
    if dashboard_success:
        # Check for premium dashboard features
        premium_features_present = True
        
        # Check for monthly distance chart data
        if 'monthly_distance' not in dashboard_data:
            print("❌ Monthly distance chart data not found")
            premium_features_present = False
        else:
            print(f"✅ Monthly distance chart data found with {len(dashboard_data['monthly_distance'])} months")
        
        # Check for activities by sport breakdown
        if 'activities_by_sport' not in dashboard_data:
            print("❌ Activities by sport breakdown not found")
            premium_features_present = False
        else:
            print(f"✅ Activities by sport breakdown found with {len(dashboard_data['activities_by_sport'])} sports")
        
        # Check for heart rate zones
        if 'heartrate_zones' not in dashboard_data:
            print("❌ Heart rate zones analysis not found")
            premium_features_present = False
        else:
            print(f"✅ Heart rate zones analysis found with {len(dashboard_data['heartrate_zones'])} zones")
        
        # Check for enhanced stats grid
        enhanced_stats = ['total_elevation', 'avg_heartrate', 'max_heartrate']
        missing_stats = [stat for stat in enhanced_stats if stat not in dashboard_data]
        
        if missing_stats:
            print(f"❌ Enhanced stats missing: {', '.join(missing_stats)}")
            premium_features_present = False
        else:
            print("✅ Enhanced stats grid complete")
        
        if not premium_features_present:
            print("❌ Some premium dashboard features are missing")
            dashboard_success = False
    
    # Test activities endpoint for enhanced activity cards
    activities_success, activities_data = tester.run_test(
        "Activities with Enhanced Data",
        "GET",
        f"api/user/{valid_user_id}/activities?detailed=true",
        200
    )
    
    activity_id = None
    
    if activities_success:
        if 'activities' not in activities_data or not activities_data['activities']:
            print("❌ No activities found for this user")
            activities_success = False
        else:
            # Check the first activity for enhanced fields
            activity = activities_data['activities'][0]
            activity_id = activity.get('strava_id')
            
            # Check for enhanced activity features
            enhanced_fields = [
                'polyline_map', 'summary_polyline', 'start_latlng', 'end_latlng',
                'average_heartrate', 'max_heartrate', 'average_watts', 'calories'
            ]
            
            missing_fields = [field for field in enhanced_fields if field not in activity or activity[field] is None]
            
            if missing_fields:
                print(f"❌ Enhanced activity fields missing: {', '.join(missing_fields)}")
                print("⚠️ Some fields may be legitimately null depending on the activity type")
            else:
                print("✅ Enhanced activity fields present")
    
    # Test activity detail endpoint for interactive maps & routes
    if activity_id:
        detail_success, detail_data = tester.run_test(
            "Activity Detail with Route Map",
            "GET",
            f"api/user/{valid_user_id}/activity/{activity_id}",
            200
        )
        
        if detail_success:
            if 'activity' not in detail_data:
                print("❌ Activity detail not found")
                detail_success = False
            else:
                activity = detail_data['activity']
                
                # Check for route coordinates (for map)
                if 'route_coordinates' not in activity:
                    print("❌ Route coordinates for map not found")
                    detail_success = False
                else:
                    print(f"✅ Route coordinates found with {len(activity['route_coordinates'])} points")
                
                # Check for detailed stats and social stats
                if 'detailed_stats' not in activity:
                    print("❌ Detailed stats not found")
                    detail_success = False
                else:
                    print("✅ Detailed stats present")
                
                if 'social_stats' not in activity:
                    print("❌ Social stats not found")
                    detail_success = False
                else:
                    print("✅ Social stats present")
    else:
        print("⚠️ Skipping activity detail test - no activity ID available")
        detail_success = True  # Don't fail the overall test
    
    # Test activity streams endpoint for detailed activity analysis
    if activity_id:
        streams_success, streams_data = tester.run_test(
            "Activity Streams for Detailed Analysis",
            "GET",
            f"api/user/{valid_user_id}/activity/{activity_id}/streams",
            200
        )
        
        if streams_success:
            if 'streams' not in streams_data:
                print("❌ Activity streams not found")
                streams_success = False
            else:
                streams = streams_data['streams']
                
                # Check for various stream types
                important_streams = ['time', 'distance', 'altitude', 'heartrate', 'velocity_smooth']
                available_streams = [stream for stream in important_streams if stream in streams]
                
                if not available_streams:
                    print("❌ No important streams found")
                    streams_success = False
                else:
                    print(f"✅ Found {len(available_streams)} important streams: {', '.join(available_streams)}")
    else:
        print("⚠️ Skipping activity streams test - no activity ID available")
        streams_success = True  # Don't fail the overall test
    
    # Test activity laps endpoint for lap-by-lap analysis
    if activity_id:
        laps_success, laps_data = tester.run_test(
            "Activity Laps for Split Analysis",
            "GET",
            f"api/user/{valid_user_id}/activity/{activity_id}/laps",
            200
        )
        
        if laps_success:
            if 'laps' not in laps_data:
                print("❌ Activity laps not found")
                laps_success = False
            else:
                laps = laps_data['laps']
                
                if not laps:
                    print("⚠️ No laps found for this activity (this may be normal)")
                else:
                    # Check the first lap for detailed metrics
                    lap = laps[0]
                    lap_fields = [
                        'elapsed_time', 'moving_time', 'distance', 'average_speed',
                        'average_heartrate', 'max_heartrate', 'total_elevation_gain'
                    ]
                    
                    missing_fields = [field for field in lap_fields if field not in lap or lap[field] is None]
                    
                    if missing_fields:
                        print(f"❌ Lap analysis fields missing: {', '.join(missing_fields)}")
                        print("⚠️ Some fields may be legitimately null depending on the activity type")
                    else:
                        print(f"✅ Lap analysis complete with {len(laps)} laps")
    else:
        print("⚠️ Skipping activity laps test - no activity ID available")
        laps_success = True  # Don't fail the overall test
    
    # Overall premium features success
    premium_features_success = dashboard_success and activities_success and detail_success and streams_success and laps_success
    
    if premium_features_success:
        print("\n✅ All premium features are working correctly!")
    else:
        print("\n❌ Some premium features are not working correctly.")
    
    return premium_features_success

def main():
    # Setup
    tester = FitTrackerAPITester()
    
    # Run basic tests
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
    
    # Test premium features
    premium_features_success = test_premium_features()
    
    # Print results
    print(f"\n📊 Basic tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"📊 Premium features: {'✅ Working' if premium_features_success else '❌ Not fully working'}")
    
    # Return success only if all tests passed
    all_tests_passed = (
        root_success and 
        health_success and 
        strava_auth_success and 
        (callback_validation_success or not strava_auth_success) and
        user_not_found_success and
        activities_not_found_success and
        dashboard_not_found_success and
        delete_user_not_found_success and
        premium_features_success
    )
    
    return 0 if all_tests_passed else 1

if __name__ == "__main__":
    # Run as a script
    sys.exit(main())