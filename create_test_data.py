import requests
import json
from datetime import datetime, timezone, timedelta

# API configuration
BASE_URL = "https://projecthub-84.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def create_test_projects_and_tasks():
    """Create the specific test data mentioned in the review request"""
    
    # First, get existing projects to see what we have
    response = requests.get(f"{API_URL}/projects")
    existing_projects = response.json()
    print(f"Found {len(existing_projects)} existing projects")
    
    # Create specific projects mentioned in the review request if they don't exist
    required_projects = [
        {"title": "Test Projekt 1", "customer": "Test GmbH", "location": "Berlin", "author": "Test User 1"},
        {"title": "Test Projekt 2", "customer": "Test AG", "location": "München", "author": "Test User 2"},
        {"title": "Webshop Projekt", "customer": "E-Commerce GmbH", "location": "Hamburg", "author": "Web Developer"},
        {"title": "Mobile App Entwicklung", "customer": "Mobile Solutions", "location": "Frankfurt", "author": "App Developer"},
        {"title": "ERP System Migration", "customer": "Enterprise Corp", "location": "Köln", "author": "System Architect"}
    ]
    
    project_ids = {}
    
    # Check if projects already exist or create them
    for project_data in required_projects:
        existing = next((p for p in existing_projects if p['title'] == project_data['title']), None)
        if existing:
            project_ids[project_data['title']] = existing['id']
            print(f"✅ Project '{project_data['title']}' already exists with ID: {existing['id']}")
        else:
            # Create new project
            project_data.update({
                "version": "1.0",
                "status": "active"
            })
            response = requests.post(f"{API_URL}/projects", json=project_data)
            if response.status_code == 200:
                project_id = response.json()['id']
                project_ids[project_data['title']] = project_id
                print(f"✅ Created project '{project_data['title']}' with ID: {project_id}")
            else:
                print(f"❌ Failed to create project '{project_data['title']}'")
    
    # Create specific tasks mentioned in the review request
    specific_tasks = [
        {
            "project": "Test Projekt 1",
            "index": "A.1",
            "task": "Requirements Analysis",
            "owner": "Business Analyst",
            "status": "up",  # Green
            "prog": 90,
            "risk_level": "low",
            "due_days_offset": 7
        },
        {
            "project": "Webshop Projekt", 
            "index": "B.2",
            "task": "E-Commerce Frontend",
            "owner": "Frontend Developer",
            "status": "right",  # Orange
            "prog": 45,
            "risk_level": "mid",
            "due_days_offset": 14
        },
        {
            "project": "Mobile App Entwicklung",
            "index": "C.1", 
            "task": "Mobile UI Design",
            "owner": "UI Designer",
            "status": "down",  # Red
            "prog": 15,
            "risk_level": "high",
            "due_days_offset": 21
        }
    ]
    
    # Create the specific tasks
    for task_data in specific_tasks:
        project_title = task_data["project"]
        if project_title in project_ids:
            project_id = project_ids[project_title]
            
            # Check if task already exists
            response = requests.get(f"{API_URL}/tasks", params={"project_id": project_id})
            existing_tasks = response.json()
            
            task_exists = any(t['index'] == task_data['index'] and t['task'] == task_data['task'] for t in existing_tasks)
            
            if not task_exists:
                due_date = datetime.now(timezone.utc) + timedelta(days=task_data['due_days_offset'])
                
                task_payload = {
                    "project_id": project_id,
                    "pos": 1,
                    "index": task_data["index"],
                    "date": datetime.now(timezone.utc).isoformat(),
                    "task": task_data["task"],
                    "owner": task_data["owner"],
                    "due": due_date.isoformat(),
                    "status": task_data["status"],
                    "prog": task_data["prog"],
                    "risk_level": task_data["risk_level"],
                    "note": f"Test task for {project_title}"
                }
                
                response = requests.post(f"{API_URL}/tasks", json=task_payload)
                if response.status_code == 200:
                    print(f"✅ Created task '{task_data['task']}' for project '{project_title}'")
                else:
                    print(f"❌ Failed to create task '{task_data['task']}' for project '{project_title}'")
            else:
                print(f"✅ Task '{task_data['task']}' already exists for project '{project_title}'")
    
    # Get final counts
    response = requests.get(f"{API_URL}/projects")
    final_projects = response.json()
    
    response = requests.get(f"{API_URL}/tasks")
    final_tasks = response.json()
    
    print(f"\n📊 Final Data Summary:")
    print(f"   Projects: {len(final_projects)}")
    print(f"   Tasks: {len(final_tasks)}")
    
    # Show project breakdown
    print(f"\n📋 Projects:")
    for project in final_projects:
        project_tasks = [t for t in final_tasks if t['project_id'] == project['id']]
        print(f"   - {project['title']} ({project['customer']}) - {len(project_tasks)} tasks")
    
    return project_ids

if __name__ == "__main__":
    print("🚀 Creating Test Data for Multi-Timeline Testing")
    print("=" * 50)
    create_test_projects_and_tasks()
    print("✅ Test data creation completed!")