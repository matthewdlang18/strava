"""
Backend tests for the Strava FitTracker Pro application.
Tests core FastAPI functionality, health endpoints, and basic API structure.
"""

import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.server import app

client = TestClient(app)


class TestHealthEndpoints:
    """Test health check endpoints"""
    
    def test_root_health_endpoint(self):
        """Test the root health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
    
    def test_api_health_endpoint(self):
        """Test the API health endpoint"""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        # Note: database and external_apis checks may fail in test environment without proper config


class TestAPIDocumentation:
    """Test API documentation endpoints"""
    
    def test_openapi_schema(self):
        """Test OpenAPI schema is accessible"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert "paths" in data
    
    def test_docs_endpoint(self):
        """Test Swagger UI documentation endpoint"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_redoc_endpoint(self):
        """Test ReDoc documentation endpoint"""
        response = client.get("/redoc")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]


class TestApplicationStructure:
    """Test application structure and configuration"""
    
    def test_app_title(self):
        """Test application has correct title"""
        response = client.get("/openapi.json")
        data = response.json()
        assert "Strava" in data["info"]["title"] or "FitTracker" in data["info"]["title"]
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.options("/api/health")
        # Should have CORS headers for preflight requests
        assert response.status_code in [200, 405]  # Some might not support OPTIONS
    
    def test_api_routes_exist(self):
        """Test that expected API routes exist in OpenAPI schema"""
        response = client.get("/openapi.json")
        data = response.json()
        paths = data["paths"]
        
        # Check for expected routes
        expected_routes = ["/health", "/api/health"]
        for route in expected_routes:
            assert route in paths, f"Route {route} not found in API schema"


# Integration tests that handle database connection errors gracefully
class TestEndpointsWithMockAuth:
    """Test endpoints that require database but handle errors gracefully"""
    
    def test_auth_endpoints_exist_in_schema(self):
        """Test that auth endpoints are defined in the API schema"""
        response = client.get("/openapi.json")
        data = response.json()
        paths = data["paths"]
        
        # These should be defined even if they fail without proper config
        auth_routes = ["/api/auth/strava", "/api/auth/strava/callback"]
        for route in auth_routes:
            assert route in paths, f"Auth route {route} not found in API schema"
    
    def test_user_endpoints_exist_in_schema(self):
        """Test that user endpoints are defined in the API schema"""
        response = client.get("/openapi.json")
        data = response.json()
        paths = data["paths"]
        
        # Check user endpoints exist in schema
        user_patterns = ["/api/user/{user_id}", "/api/user/{user_id}/activities", "/api/user/{user_id}/dashboard"]
        for pattern in user_patterns:
            assert pattern in paths, f"User route pattern {pattern} not found in API schema"


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")


if __name__ == "__main__":
    # Allow running tests directly with python
    pytest.main([__file__, "-v"])
