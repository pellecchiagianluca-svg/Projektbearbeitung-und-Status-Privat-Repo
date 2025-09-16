from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TaskStatus(str, Enum):
    UP = "up"
    RIGHT = "right"
    DOWN = "down"

class RiskLevel(str, Enum):
    LOW = "low"
    MID = "mid"
    HIGH = "high"

class MilestoneStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DELAYED = "delayed"

class ChangeStatus(str, Enum):
    OPEN = "open"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"

# Models
class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    customer: str
    location: str
    version: str = "1.0"
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    author: str
    status: ProjectStatus = ProjectStatus.PLANNING
    lamps: Optional[dict] = Field(default_factory=lambda: {
        "scope": "green",
        "time": "green", 
        "cost": "green",
        "risk": "green",
        "quality": "green"
    })

class ProjectCreate(BaseModel):
    title: str
    customer: str
    location: str
    author: str
    version: str = "1.0"
    status: ProjectStatus = ProjectStatus.PLANNING

class Milestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    gate: str
    plan: datetime
    fc: Optional[datetime] = None
    delta: Optional[int] = None
    status: MilestoneStatus = MilestoneStatus.PLANNED
    owner: str

class MilestoneCreate(BaseModel):
    project_id: str
    gate: str
    plan: datetime
    fc: Optional[datetime] = None
    owner: str
    status: MilestoneStatus = MilestoneStatus.PLANNED

class Budget(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    item: str
    plan: float
    actual: float = 0.0
    fc: float = 0.0
    delta: float = 0.0
    comment: Optional[str] = None

class BudgetCreate(BaseModel):
    project_id: str
    item: str
    plan: float
    actual: float = 0.0
    fc: float = 0.0
    comment: Optional[str] = None

class Risk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    title: str
    category: str = "risk"  # "risk" or "chance"
    cea: str  # Cause Effect Action
    p: int  # Probability (1-5)
    a: int  # Impact (1-5)
    score: int = Field(default=0)
    probability: str = "wahrscheinlich"  # "unwahrscheinlich", "wahrscheinlich", "sehr wahrscheinlich"
    trigger: str
    resp: str  # Response
    owner: str
    status: str = "open"

class RiskCreate(BaseModel):
    project_id: str
    title: str
    category: str = "risk"
    cea: str
    p: int = Field(ge=1, le=5)
    a: int = Field(ge=1, le=5)
    probability: str = "wahrscheinlich"
    trigger: str
    resp: str
    owner: str
    status: str = "open"

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    pos: int
    index: str
    date: datetime
    task: str
    owner: str
    due: datetime
    status: TaskStatus = TaskStatus.RIGHT
    prog: int = Field(ge=0, le=100, default=0)  # Progress percentage
    risk_level: RiskLevel = RiskLevel.LOW
    risk_desc: Optional[str] = None
    note: Optional[str] = None

class TaskCreate(BaseModel):
    project_id: str
    pos: int
    index: str
    date: datetime
    task: str
    owner: str
    due: datetime
    status: TaskStatus = TaskStatus.RIGHT
    prog: int = Field(ge=0, le=100, default=0)
    risk_level: RiskLevel = RiskLevel.LOW
    risk_desc: Optional[str] = None
    note: Optional[str] = None

class ChangeRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    subject: str
    impact: dict = Field(default_factory=lambda: {
        "time_days": 0,
        "cost_eur": 0.0,
        "scope": ""
    })
    status: ChangeStatus = ChangeStatus.OPEN
    decision_maker: str

class ChangeRequestCreate(BaseModel):
    project_id: str
    subject: str
    impact: dict = Field(default_factory=lambda: {
        "time_days": 0,
        "cost_eur": 0.0,
        "scope": ""
    })
    decision_maker: str
    status: ChangeStatus = ChangeStatus.OPEN

# Helper functions
def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Parse datetime strings back from MongoDB"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key in ['date', 'plan', 'fc', 'due']:
                try:
                    item[key] = datetime.fromisoformat(value)
                except:
                    pass
    return item

# Project Routes
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    project_dict = project.dict()
    project_obj = Project(**project_dict)
    project_data = prepare_for_mongo(project_obj.dict())
    await db.projects.insert_one(project_data)
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**parse_from_mongo(project)) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**parse_from_mongo(project))

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: ProjectCreate):
    project_dict = project_update.dict()
    project_dict["id"] = project_id
    project_obj = Project(**project_dict)
    project_data = prepare_for_mongo(project_obj.dict())
    
    result = await db.projects.replace_one({"id": project_id}, project_data)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return project_obj

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

# Milestone Routes
@api_router.post("/milestones", response_model=Milestone)
async def create_milestone(milestone: MilestoneCreate):
    milestone_dict = milestone.dict()
    milestone_obj = Milestone(**milestone_dict)
    
    # Calculate delta if fc is provided
    if milestone_obj.fc and milestone_obj.plan:
        delta_days = (milestone_obj.fc - milestone_obj.plan).days
        milestone_obj.delta = delta_days
    
    milestone_data = prepare_for_mongo(milestone_obj.dict())
    await db.milestones.insert_one(milestone_data)
    return milestone_obj

@api_router.get("/milestones", response_model=List[Milestone])
async def get_milestones(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    milestones = await db.milestones.find(query).to_list(1000)
    return [Milestone(**parse_from_mongo(milestone)) for milestone in milestones]

# Budget Routes
@api_router.post("/budget", response_model=Budget)
async def create_budget(budget: BudgetCreate):
    budget_dict = budget.dict()
    budget_obj = Budget(**budget_dict)
    
    # Calculate delta
    budget_obj.delta = budget_obj.fc - budget_obj.plan
    
    budget_data = prepare_for_mongo(budget_obj.dict())
    await db.budget.insert_one(budget_data)
    return budget_obj

@api_router.get("/budget", response_model=List[Budget])
async def get_budget(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    budget_items = await db.budget.find(query).to_list(1000)
    return [Budget(**parse_from_mongo(item)) for item in budget_items]

# Risk Routes
@api_router.post("/risks", response_model=Risk)
async def create_risk(risk: RiskCreate):
    risk_dict = risk.dict()
    risk_obj = Risk(**risk_dict)
    
    # Calculate risk score
    risk_obj.score = risk_obj.p * risk_obj.a
    
    risk_data = prepare_for_mongo(risk_obj.dict())
    await db.risks.insert_one(risk_data)
    return risk_obj

@api_router.get("/risks", response_model=List[Risk])
async def get_risks(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    risks = await db.risks.find(query).to_list(1000)
    return [Risk(**parse_from_mongo(risk)) for risk in risks]

# Task Routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    task_dict = task.dict()
    task_obj = Task(**task_dict)
    task_data = prepare_for_mongo(task_obj.dict())
    await db.tasks.insert_one(task_data)
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    tasks = await db.tasks.find(query).to_list(1000)
    return [Task(**parse_from_mongo(task)) for task in tasks]

# Change Request Routes
@api_router.post("/changes", response_model=ChangeRequest)
async def create_change_request(change: ChangeRequestCreate):
    change_dict = change.dict()
    change_obj = ChangeRequest(**change_dict)
    change_data = prepare_for_mongo(change_obj.dict())
    await db.changes.insert_one(change_data)
    return change_obj

@api_router.get("/changes", response_model=List[ChangeRequest])
async def get_change_requests(project_id: Optional[str] = None):
    query = {"project_id": project_id} if project_id else {}
    changes = await db.changes.find(query).to_list(1000)
    return [ChangeRequest(**parse_from_mongo(change)) for change in changes]

# Legacy routes for compatibility
@api_router.get("/")
async def root():
    return {"message": "Projekt-Reporting-App API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()