import requests
import sys
from datetime import datetime, timezone
import json

class ProjectReportingAPITester:
    def __init__(self, base_url="https://projecthub-84.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")

            return success, response.json() if response.text and response.status_code < 400 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_get_projects_empty(self):
        """Test getting projects when database is empty"""
        return self.run_test("Get Projects (Empty)", "GET", "projects", 200)

    def test_create_project(self):
        """Test creating a new project"""
        project_data = {
            "title": "Test Projekt 1",
            "customer": "Test GmbH",
            "location": "Berlin",
            "author": "Test User",
            "version": "1.0",
            "status": "planning"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.created_project_id = response['id']
            print(f"   Created project ID: {self.created_project_id}")
            return True
        return False

    def test_get_projects_with_data(self):
        """Test getting projects after creating one"""
        success, response = self.run_test("Get Projects (With Data)", "GET", "projects", 200)
        
        if success and isinstance(response, list) and len(response) > 0:
            project = response[0]
            expected_fields = ['id', 'title', 'customer', 'location', 'author', 'version', 'status']
            missing_fields = [field for field in expected_fields if field not in project]
            if missing_fields:
                print(f"   ⚠️  Missing fields in project: {missing_fields}")
            else:
                print(f"   ✅ Project has all required fields")
        
        return success

    def test_get_single_project(self):
        """Test getting a single project by ID"""
        if not self.created_project_id:
            print("❌ No project ID available for single project test")
            return False
            
        return self.run_test(
            "Get Single Project",
            "GET",
            f"projects/{self.created_project_id}",
            200
        )[0]

    def test_update_project(self):
        """Test updating a project"""
        if not self.created_project_id:
            print("❌ No project ID available for update test")
            return False
            
        update_data = {
            "title": "Updated Test Projekt",
            "customer": "Updated Test GmbH",
            "location": "München",
            "author": "Updated Test User",
            "version": "2.0",
            "status": "active"
        }
        
        return self.run_test(
            "Update Project",
            "PUT",
            f"projects/{self.created_project_id}",
            200,
            data=update_data
        )[0]

    def test_project_related_endpoints(self):
        """Test endpoints that require a project_id"""
        if not self.created_project_id:
            print("❌ No project ID available for related endpoint tests")
            return False

        project_id = self.created_project_id
        
        # Test milestones
        milestone_success = self.run_test(
            "Get Milestones",
            "GET",
            "milestones",
            200,
            params={"project_id": project_id}
        )[0]

        # Test budget
        budget_success = self.run_test(
            "Get Budget",
            "GET",
            "budget",
            200,
            params={"project_id": project_id}
        )[0]

        # Test risks
        risks_success = self.run_test(
            "Get Risks",
            "GET",
            "risks",
            200,
            params={"project_id": project_id}
        )[0]

        # Test tasks
        tasks_success = self.run_test(
            "Get Tasks",
            "GET",
            "tasks",
            200,
            params={"project_id": project_id}
        )[0]

        # Test changes
        changes_success = self.run_test(
            "Get Changes",
            "GET",
            "changes",
            200,
            params={"project_id": project_id}
        )[0]

        return all([milestone_success, budget_success, risks_success, tasks_success, changes_success])

    def test_create_milestone(self):
        """Test creating a milestone"""
        if not self.created_project_id:
            print("❌ No project ID available for milestone creation test")
            return False

        milestone_data = {
            "project_id": self.created_project_id,
            "gate": "Projektstart",
            "plan": datetime.now(timezone.utc).isoformat(),
            "owner": "Test User",
            "status": "planned"
        }
        
        return self.run_test(
            "Create Milestone",
            "POST",
            "milestones",
            200,
            data=milestone_data
        )[0]

    def test_create_budget_item(self):
        """Test creating a budget item"""
        if not self.created_project_id:
            print("❌ No project ID available for budget creation test")
            return False

        budget_data = {
            "project_id": self.created_project_id,
            "item": "Entwicklungskosten",
            "plan": 10000.0,
            "actual": 5000.0,
            "fc": 12000.0,
            "comment": "Test budget item"
        }
        
        return self.run_test(
            "Create Budget Item",
            "POST",
            "budget",
            200,
            data=budget_data
        )[0]

    def test_create_risk(self):
        """Test creating a risk"""
        if not self.created_project_id:
            print("❌ No project ID available for risk creation test")
            return False

        risk_data = {
            "project_id": self.created_project_id,
            "title": "Technisches Risiko",
            "cea": "Neue Technologie könnte Probleme verursachen",
            "p": 3,
            "a": 4,
            "trigger": "Erste Tests",
            "resp": "Backup-Plan entwickeln",
            "owner": "Test User",
            "status": "open"
        }
        
        return self.run_test(
            "Create Risk",
            "POST",
            "risks",
            200,
            data=risk_data
        )[0]

    def test_delete_project(self):
        """Test deleting a project"""
        if not self.created_project_id:
            print("❌ No project ID available for deletion test")
            return False
            
        return self.run_test(
            "Delete Project",
            "DELETE",
            f"projects/{self.created_project_id}",
            200
        )[0]

def main():
    print("🚀 Starting Projekt-Reporting-App API Tests")
    print("=" * 50)
    
    tester = ProjectReportingAPITester()
    
    # Run all tests in sequence
    test_results = []
    
    # Basic API tests
    test_results.append(("Root Endpoint", tester.test_root_endpoint()))
    test_results.append(("Get Projects (Empty)", tester.test_get_projects_empty()))
    test_results.append(("Create Project", tester.test_create_project()))
    test_results.append(("Get Projects (With Data)", tester.test_get_projects_with_data()))
    test_results.append(("Get Single Project", tester.test_get_single_project()))
    test_results.append(("Update Project", tester.test_update_project()))
    
    # Project-related endpoint tests
    test_results.append(("Project Related Endpoints", tester.test_project_related_endpoints()))
    
    # Create related data tests
    test_results.append(("Create Milestone", tester.test_create_milestone()))
    test_results.append(("Create Budget Item", tester.test_create_budget_item()))
    test_results.append(("Create Risk", tester.test_create_risk()))
    
    # Cleanup
    test_results.append(("Delete Project", tester.test_delete_project()))
    
    # Print final results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n📈 Overall: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the backend implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())