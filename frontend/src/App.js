import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import { Calendar, Users, MapPin, FileText, Target, Euro, AlertTriangle, CheckSquare, RefreshCw, Clock, MessageSquare } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(false);

  // Form states
  const [projectForm, setProjectForm] = useState({
    title: "",
    customer: "",
    location: "",
    author: "",
    version: "1.0",
    status: "planning"
  });

  const [taskForm, setTaskForm] = useState({
    project_id: "",
    pos: 1,
    index: "",
    date: new Date().toISOString().split('T')[0],
    task: "",
    owner: "",
    due: "",
    status: "right",
    prog: 0,
    risk_level: "low",
    risk_desc: "",
    note: ""
  });

  const [milestoneForm, setMilestoneForm] = useState({
    project_id: "",
    gate: "",
    plan: "",
    fc: "",
    owner: "",
    status: "planned"
  });

  const [milestones, setMilestones] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [risks, setRisks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [changes, setChanges] = useState([]);
  const [timelineView, setTimelineView] = useState("all");

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load project-specific data when project is selected
  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  // Load all tasks for timeline when projects change
  useEffect(() => {
    if (projects.length > 0) {
      loadAllTasks();
      loadAllMilestones();
    }
  }, [projects]);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error("Fehler beim Laden der Projekte:", error);
      toast.error("Fehler beim Laden der Projekte");
    }
  };

  const loadProjectData = async () => {
    if (!selectedProject) return;
    
    setLoading(true);
    try {
      const [milestonesRes, budgetRes, risksRes, tasksRes, changesRes] = await Promise.all([
        axios.get(`${API}/milestones?project_id=${selectedProject}`),
        axios.get(`${API}/budget?project_id=${selectedProject}`),
        axios.get(`${API}/risks?project_id=${selectedProject}`),
        axios.get(`${API}/tasks?project_id=${selectedProject}`),
        axios.get(`${API}/changes?project_id=${selectedProject}`)
      ]);

      setMilestones(milestonesRes.data);
      setBudgetItems(budgetRes.data);
      setRisks(risksRes.data);
      setTasks(tasksRes.data);
      setChanges(changesRes.data);
    } catch (error) {
      console.error("Fehler beim Laden der Projektdaten:", error);
      toast.error("Fehler beim Laden der Projektdaten");
    } finally {
      setLoading(false);
    }
  };

  const loadAllTasks = async () => {
    try {
      const response = await axios.get(`${API}/tasks`);
      setTasks(response.data);
    } catch (error) {
      console.error("Fehler beim Laden aller Aufgaben:", error);
      toast.error("Fehler beim Laden aller Aufgaben");
    }
  };

  const loadAllMilestones = async () => {
    try {
      const response = await axios.get(`${API}/milestones`);
      setMilestones(response.data);
    } catch (error) {
      console.error("Fehler beim Laden aller Meilensteine:", error);
      toast.error("Fehler beim Laden aller Meilensteine");
    }
  };

  const createProject = async () => {
    if (!projectForm.title || !projectForm.customer || !projectForm.author) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    try {
      await axios.post(`${API}/projects`, projectForm);
      toast.success("Projekt erfolgreich erstellt");
      setProjectForm({
        title: "",
        customer: "",
        location: "",
        author: "",
        version: "1.0",
        status: "planning"
      });
      loadProjects();
    } catch (error) {
      console.error("Fehler beim Erstellen des Projekts:", error);
      toast.error("Fehler beim Erstellen des Projekts");
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      planning: { label: "Planung", color: "bg-blue-100 text-blue-800" },
      active: { label: "Aktiv", color: "bg-green-100 text-green-800" },
      on_hold: { label: "Pausiert", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Abgeschlossen", color: "bg-gray-100 text-gray-800" },
      cancelled: { label: "Abgebrochen", color: "bg-red-100 text-red-800" }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const validateProjectSelection = () => {
    if (!selectedProject) {
      toast.error("Bitte wählen Sie zuerst ein Projekt aus");
      return false;
    }
    return true;
  };

  const createTask = async () => {
    if (!validateProjectSelection()) return;
    
    if (!taskForm.task || !taskForm.owner || !taskForm.due) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    try {
      const taskData = {
        ...taskForm,
        project_id: selectedProject,
        date: new Date().toISOString(),
        due: new Date(taskForm.due).toISOString()
      };
      
      await axios.post(`${API}/tasks`, taskData);
      toast.success("Aufgabe erfolgreich erstellt");
      setTaskForm({
        project_id: "",
        pos: 1,
        index: "",
        date: new Date().toISOString().split('T')[0],
        task: "",
        owner: "",
        due: "",
        status: "right",
        prog: 0,
        risk_level: "low",
        risk_desc: "",
        note: ""
      });
      loadProjectData();
      loadAllTasks();
    } catch (error) {
      console.error("Fehler beim Erstellen der Aufgabe:", error);
      toast.error("Fehler beim Erstellen der Aufgabe");
    }
  };

  const createMilestone = async () => {
    if (!validateProjectSelection()) return;
    
    if (!milestoneForm.gate || !milestoneForm.plan || !milestoneForm.owner) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    try {
      const milestoneData = {
        ...milestoneForm,
        project_id: selectedProject,
        plan: new Date(milestoneForm.plan).toISOString(),
        fc: milestoneForm.fc ? new Date(milestoneForm.fc).toISOString() : null
      };
      
      await axios.post(`${API}/milestones`, milestoneData);
      toast.success("Meilenstein erfolgreich erstellt");
      setMilestoneForm({
        project_id: "",
        gate: "",
        plan: "",
        fc: "",
        owner: "",
        status: "planned"
      });
      loadProjectData();
    } catch (error) {
      console.error("Fehler beim Erstellen des Meilensteins:", error);
      toast.error("Fehler beim Erstellen des Meilensteins");
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'up': return <span className="text-green-600 font-bold">↑</span>;
      case 'right': return <span className="text-orange-600 font-bold">→</span>;
      case 'down': return <span className="text-red-600 font-bold">↓</span>;
      default: return <span className="text-gray-600">—</span>;
    }
  };

  const getRiskLevelColor = (level) => {
    switch(level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateTimelineData = () => {
    const timelineData = [];
    
    if (timelineView === "all") {
      // Show all projects with their tasks and milestones
      projects.forEach(project => {
        const projectTasks = tasks.filter(task => task.project_id === project.id);
        const projectMilestones = milestones.filter(milestone => milestone.project_id === project.id);
        timelineData.push({
          type: 'project',
          id: project.id,
          title: project.title,
          customer: project.customer,
          status: project.status,
          tasks: projectTasks,
          milestones: projectMilestones
        });
      });
    } else if (selectedProject) {
      // Show only selected project
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        const projectTasks = tasks.filter(task => task.project_id === selectedProject);
        const projectMilestones = milestones.filter(milestone => milestone.project_id === selectedProject);
        timelineData.push({
          type: 'project',
          id: project.id,
          title: project.title,
          customer: project.customer,
          status: project.status,
          tasks: projectTasks,
          milestones: projectMilestones
        });
      }
    }
    
    return timelineData;
  };

  const getDateRange = () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 31);
    return { start: threeMonthsAgo, end: threeMonthsFromNow };
  };

  const getTaskPosition = (taskDate, startDate, endDate) => {
    const taskTime = new Date(taskDate).getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const totalTime = endTime - startTime;
    const taskOffset = taskTime - startTime;
    
    return Math.max(0, Math.min(100, (taskOffset / totalTime) * 100));
  };

  const handleProjectSelection = (projectId, projectTitle) => {
    console.log("Selecting project:", projectId, projectTitle);
    setSelectedProject(projectId);
    toast.success(`Projekt "${projectTitle}" ausgewählt`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Projekt-Reporting-App</h1>
          <p className="text-slate-600">Verwalten Sie Ihre Projekte effizient und strukturiert</p>
        </div>

        {/* Project Selection */}
        <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-700">
              <Target className="h-5 w-5 text-blue-600" />
              Projektauswahl
            </CardTitle>
            <CardDescription>
              Wählen Sie ein Projekt aus, um mit der Dateneingabe zu beginnen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedProject} onValueChange={(value) => {
              const project = projects.find(p => p.id === value);
              handleProjectSelection(value, project?.title || "Unbekannt");
            }}>
              <SelectTrigger className="w-full border-slate-200 focus:border-blue-500">
                <SelectValue placeholder="Projekt auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{project.title}</span>
                      <span className="text-sm text-slate-500 ml-2">({project.customer})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProject && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                ✅ Ausgewählt: {projects.find(p => p.id === selectedProject)?.title || 'Unbekanntes Projekt'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
            <TabsTrigger value="projects" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Projekte</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Meilensteine</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Euro className="h-4 w-4" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="risks" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Risiken</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Aufgaben</span>
            </TabsTrigger>
            <TabsTrigger value="changes" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Changes</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Termine</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Kommunikation</span>
            </TabsTrigger>
          </TabsList>

          {/* Project Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className={`project-card transition-all duration-300 transform hover:scale-105 ${
                  selectedProject === project.id ? 'selected ring-2 ring-green-500 bg-green-50' : 'hover:shadow-xl'
                }`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 mr-3">
                        <CardTitle className="project-title">
                          {project.title}
                        </CardTitle>
                        {selectedProject === project.id && (
                          <div className="inline-flex items-center px-2 py-1 text-xs font-bold bg-green-600 text-white rounded-full mt-2 animate-pulse">
                            ✓ AKTIVES PROJEKT
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                          project.status === 'active' ? 'bg-green-100 text-green-800' :
                          project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                          project.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          project.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status === 'planning' ? 'Planung' :
                           project.status === 'active' ? 'Aktiv' :
                           project.status === 'on_hold' ? 'Pausiert' :
                           project.status === 'completed' ? 'Abgeschlossen' :
                           project.status === 'cancelled' ? 'Abgebrochen' : project.status}
                        </span>
                      </div>
                    </div>
                    <div className="project-customer">
                      {project.customer}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="project-detail">
                        <MapPin className="h-4 w-4" />
                        <span className="break-words">{project.location}</span>
                      </div>
                      <div className="project-detail">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(project.date).toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="project-detail">
                        <Users className="h-4 w-4" />
                        <span className="break-words">{project.author}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Button clicked for project:", project.id, project.title);
                        handleProjectSelection(project.id, project.title);
                      }}
                      className={`w-full mt-4 font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedProject === project.id 
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {selectedProject === project.id ? '✓ Ausgewählt' : 'Projekt auswählen'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Users className="h-5 w-5 text-blue-600" />
                  Neues Projekt erstellen
                </CardTitle>
                <CardDescription>
                  Erstellen Sie ein neues Projekt mit allen wichtigen Grunddaten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Projekttitel *</Label>
                    <Input
                      id="title"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                      placeholder="Geben Sie den Projekttitel ein..."
                      className="border-slate-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer">Kunde *</Label>
                    <Input
                      id="customer"
                      value={projectForm.customer}
                      onChange={(e) => setProjectForm({...projectForm, customer: e.target.value})}
                      placeholder="Kunde eingeben..."
                      className="border-slate-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Standort</Label>
                    <Input
                      id="location"
                      value={projectForm.location}
                      onChange={(e) => setProjectForm({...projectForm, location: e.target.value})}
                      placeholder="Standort eingeben..."
                      className="border-slate-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="author">Autor *</Label>
                    <Input
                      id="author"
                      value={projectForm.author}
                      onChange={(e) => setProjectForm({...projectForm, author: e.target.value})}
                      placeholder="Ihr Name..."
                      className="border-slate-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={projectForm.version}
                      onChange={(e) => setProjectForm({...projectForm, version: e.target.value})}
                      placeholder="1.0"
                      className="border-slate-200 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={projectForm.status} onValueChange={(value) => setProjectForm({...projectForm, status: value})}>
                      <SelectTrigger className="border-slate-200 focus:border-blue-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planung</SelectItem>
                        <SelectItem value="active">Aktiv</SelectItem>
                        <SelectItem value="on_hold">Pausiert</SelectItem>
                        <SelectItem value="completed">Abgeschlossen</SelectItem>
                        <SelectItem value="cancelled">Abgebrochen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={createProject}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Projekt erstellen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Milestone Creation Form */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Target className="h-5 w-5 text-blue-600" />
                    Neuen Meilenstein erstellen
                  </CardTitle>
                  <CardDescription>
                    {selectedProject ? "Erstellen Sie einen neuen Meilenstein für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedProject ? (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Bitte wählen Sie ein Projekt aus, um Meilensteine zu erstellen</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="milestone_gate">Gate/Meilenstein-Name *</Label>
                        <Input
                          id="milestone_gate"
                          value={milestoneForm.gate}
                          onChange={(e) => setMilestoneForm({...milestoneForm, gate: e.target.value})}
                          placeholder="z.B. Projektstart, Design Review, Go-Live..."
                          className="border-slate-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="milestone_plan">Geplantes Datum *</Label>
                          <Input
                            id="milestone_plan"
                            type="date"
                            value={milestoneForm.plan}
                            onChange={(e) => setMilestoneForm({...milestoneForm, plan: e.target.value})}
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="milestone_fc">Forecast Datum</Label>
                          <Input
                            id="milestone_fc"
                            type="date"
                            value={milestoneForm.fc}
                            onChange={(e) => setMilestoneForm({...milestoneForm, fc: e.target.value})}
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="milestone_owner">Verantwortlicher *</Label>
                          <Input
                            id="milestone_owner"
                            value={milestoneForm.owner}
                            onChange={(e) => setMilestoneForm({...milestoneForm, owner: e.target.value})}
                            placeholder="Name des Verantwortlichen..."
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="milestone_status">Status</Label>
                          <Select value={milestoneForm.status} onValueChange={(value) => setMilestoneForm({...milestoneForm, status: value})}>
                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="planned">Geplant</SelectItem>
                              <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                              <SelectItem value="completed">Abgeschlossen</SelectItem>
                              <SelectItem value="delayed">Verzögert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={createMilestone}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Meilenstein erstellen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Milestones List */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <Target className="h-5 w-5 text-blue-600" />
                    Meilensteine Übersicht
                  </CardTitle>
                  <CardDescription>
                    {selectedProject ? "Meilensteine für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedProject ? (
                    <div className="text-center py-8 text-slate-500">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Bitte wählen Sie ein Projekt aus, um Meilensteine anzuzeigen</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {milestones.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">Noch keine Meilensteine definiert</p>
                      ) : (
                        <div className="space-y-3">
                          {milestones.map((milestone) => (
                            <div key={milestone.id} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="font-medium text-slate-800">{milestone.gate}</h4>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                      milestone.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                      milestone.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                      milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      milestone.status === 'delayed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {milestone.status === 'planned' ? 'Geplant' :
                                       milestone.status === 'in_progress' ? 'In Bearbeitung' :
                                       milestone.status === 'completed' ? 'Abgeschlossen' :
                                       milestone.status === 'delayed' ? 'Verzögert' : milestone.status}
                                    </span>
                                  </div>
                                  <div className="text-sm text-slate-600 space-y-1">
                                    <div>Geplant: {new Date(milestone.plan).toLocaleDateString('de-DE')}</div>
                                    {milestone.fc && (
                                      <div>Forecast: {new Date(milestone.fc).toLocaleDateString('de-DE')}</div>
                                    )}
                                    <div>Verantwortlich: {milestone.owner}</div>
                                    {milestone.delta && (
                                      <div className={`font-medium ${milestone.delta > 0 ? 'text-red-600' : milestone.delta < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                                        Delta: {milestone.delta} Tage
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Euro className="h-5 w-5 text-blue-600" />
                  Budget
                </CardTitle>
                <CardDescription>
                  {selectedProject ? "Verwalten Sie das Budget für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedProject ? (
                  <div className="text-center py-8 text-slate-500">
                    <Euro className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Bitte wählen Sie ein Projekt aus, um das Budget zu verwalten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-center py-4">Budget-Funktionalität wird implementiert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  Risiken
                </CardTitle>
                <CardDescription>
                  {selectedProject ? "Verwalten Sie die Risiken für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedProject ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Bitte wählen Sie ein Projekt aus, um Risiken zu verwalten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-center py-4">Risiko-Funktionalität wird implementiert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Task Creation Form */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    Neue Aufgabe erstellen
                  </CardTitle>
                  <CardDescription>
                    {selectedProject ? "Erstellen Sie eine neue Aufgabe für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedProject ? (
                    <div className="text-center py-8 text-slate-500">
                      <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Bitte wählen Sie ein Projekt aus, um Aufgaben zu erstellen</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="task_index">Index</Label>
                          <Input
                            id="task_index"
                            value={taskForm.index}
                            onChange={(e) => setTaskForm({...taskForm, index: e.target.value})}
                            placeholder="A.1, B.2, etc."
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task_pos">Position</Label>
                          <Input
                            id="task_pos"
                            type="number"
                            value={taskForm.pos}
                            onChange={(e) => setTaskForm({...taskForm, pos: parseInt(e.target.value) || 1})}
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="task_name">Aufgabe *</Label>
                        <Input
                          id="task_name"
                          value={taskForm.task}
                          onChange={(e) => setTaskForm({...taskForm, task: e.target.value})}
                          placeholder="Beschreibung der Aufgabe..."
                          className="border-slate-200 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="task_owner">Verantwortlicher *</Label>
                          <Input
                            id="task_owner"
                            value={taskForm.owner}
                            onChange={(e) => setTaskForm({...taskForm, owner: e.target.value})}
                            placeholder="Name des Verantwortlichen..."
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task_due">Fälligkeitsdatum *</Label>
                          <Input
                            id="task_due"
                            type="date"
                            value={taskForm.due}
                            onChange={(e) => setTaskForm({...taskForm, due: e.target.value})}
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="task_status">Status</Label>
                          <Select value={taskForm.status} onValueChange={(value) => setTaskForm({...taskForm, status: value})}>
                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="up">↑ Grün (Gut)</SelectItem>
                              <SelectItem value="right">→ Orange (OK)</SelectItem>
                              <SelectItem value="down">↓ Rot (Probleme)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task_progress">Fortschritt (%)</Label>
                          <Input
                            id="task_progress"
                            type="number"
                            min="0"
                            max="100"
                            value={taskForm.prog}
                            onChange={(e) => setTaskForm({...taskForm, prog: parseInt(e.target.value) || 0})}
                            className="border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="task_risk">Risiko Level</Label>
                          <Select value={taskForm.risk_level} onValueChange={(value) => setTaskForm({...taskForm, risk_level: value})}>
                            <SelectTrigger className="border-slate-200 focus:border-blue-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Niedrig</SelectItem>
                              <SelectItem value="mid">Mittel</SelectItem>
                              <SelectItem value="high">Hoch</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="task_note">Notizen</Label>
                        <Textarea
                          id="task_note"
                          value={taskForm.note}
                          onChange={(e) => setTaskForm({...taskForm, note: e.target.value})}
                          placeholder="Zusätzliche Informationen..."
                          className="border-slate-200 focus:border-blue-500"
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        onClick={createTask}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Aufgabe erstellen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tasks List */}
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    Aufgaben Übersicht
                  </CardTitle>
                  <CardDescription>
                    {selectedProject ? "Aufgaben für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedProject ? (
                    <div className="text-center py-8 text-slate-500">
                      <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Bitte wählen Sie ein Projekt aus, um Aufgaben anzuzeigen</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tasks.filter(task => task.project_id === selectedProject).length === 0 ? (
                        <p className="text-slate-500 text-center py-4">Noch keine Aufgaben definiert</p>
                      ) : (
                        <div className="space-y-3">
                          {tasks.filter(task => task.project_id === selectedProject).map((task) => (
                            <div key={task.id} className="p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-slate-600">{task.index}</span>
                                    {getStatusIcon(task.status)}
                                    <Badge className={getRiskLevelColor(task.risk_level)}>{task.risk_level}</Badge>
                                  </div>
                                  <h4 className="font-medium text-slate-800 mb-1">{task.task}</h4>
                                  <div className="text-sm text-slate-600 space-y-1">
                                    <div>Verantwortlich: {task.owner}</div>
                                    <div>Fällig: {new Date(task.due).toLocaleDateString('de-DE')}</div>
                                    <div>Fortschritt: {task.prog}%</div>
                                    {task.note && <div>Notiz: {task.note}</div>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-200 rounded-full overflow-hidden h-2">
                                    <div 
                                      className="h-full bg-blue-600 transition-all duration-300"
                                      style={{width: `${task.prog}%`}}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500">{task.prog}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="changes" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  Change Requests
                </CardTitle>
                <CardDescription>
                  {selectedProject ? "Verwalten Sie Change Requests für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedProject ? (
                  <div className="text-center py-8 text-slate-500">
                    <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Bitte wählen Sie ein Projekt aus, um Changes zu verwalten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-slate-500 text-center py-4">Change-Request-Funktionalität wird implementiert</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Multi-Timeline Terminplanung
                </CardTitle>
                <CardDescription>
                  Überblick über alle Projekttermine in einer Timeline-Darstellung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Label>Ansicht:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={timelineView === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimelineView("all")}
                        className={timelineView === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        Alle Projekte
                      </Button>
                      <Button
                        variant={timelineView === "single" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTimelineView("single")}
                        className={timelineView === "single" ? "bg-blue-600 hover:bg-blue-700" : ""}
                      >
                        Einzelprojekt
                      </Button>
                    </div>
                  </div>
                  
                  {timelineView === "single" && (
                    <div className="mb-4">
                      <Label>Projekt für Einzelansicht:</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-full max-w-md border-slate-200 focus:border-blue-500">
                          <SelectValue placeholder="Projekt für Timeline auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.title} ({project.customer})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                
                {/* Simple Timeline Display */}
                <div className="space-y-4">
                  {generateTimelineData().length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Keine Projekte oder Aufgaben für Timeline-Ansicht verfügbar</p>
                    </div>
                  ) : (
                    generateTimelineData().map((projectData) => (
                      <Card key={projectData.id} className="border rounded-lg bg-white shadow-sm">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{projectData.title}</CardTitle>
                            {getStatusBadge(projectData.status)}
                          </div>
                          <CardDescription>{projectData.customer}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {projectData.tasks.length === 0 && projectData.milestones.length === 0 ? (
                            <p className="text-slate-500 text-sm">Keine Aufgaben oder Meilensteine definiert</p>
                          ) : (
                            <div className="space-y-2">
                              {/* Combine and sort milestones and tasks by date */}
                              {[
                                ...projectData.milestones.map(milestone => ({
                                  ...milestone,
                                  type: 'milestone',
                                  sortDate: new Date(milestone.plan).getTime()
                                })),
                                ...projectData.tasks.map(task => ({
                                  ...task,
                                  type: 'task',
                                  sortDate: new Date(task.due).getTime()
                                }))
                              ]
                              .sort((a, b) => a.sortDate - b.sortDate)
                              .map((item) => (
                                item.type === 'milestone' ? (
                                  <div key={`milestone-${item.id}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded font-bold">MS</span>
                                      <div>
                                        <span className="text-sm font-semibold text-blue-800">{item.gate}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-xs px-2 py-1 rounded ${
                                            item.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                                            item.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            item.status === 'delayed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                          }`}>
                                            {item.status === 'planned' ? 'Geplant' :
                                             item.status === 'in_progress' ? 'In Arbeit' :
                                             item.status === 'completed' ? 'Fertig' :
                                             item.status === 'delayed' ? 'Verzögert' : item.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-slate-700">{item.owner}</div>
                                      <div className="text-sm text-blue-600 font-bold">{new Date(item.plan).toLocaleDateString('de-DE')}</div>
                                      {item.fc && (
                                        <div className="text-xs text-orange-600">FC: {new Date(item.fc).toLocaleDateString('de-DE')}</div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div key={`task-${item.id}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs bg-slate-500 text-white px-2 py-1 rounded">{item.index}</span>
                                      <div>
                                        <span className="text-sm font-medium text-slate-800">{item.task}</span>
                                        <div className="flex items-center gap-2 mt-1">
                                          {getStatusIcon(item.status)}
                                          <div className="w-16 bg-slate-200 rounded-full h-2">
                                            <div 
                                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                              style={{width: `${item.prog}%`}}
                                            />
                                          </div>
                                          <span className="text-xs text-slate-500">{item.prog}%</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-slate-700">{item.owner}</div>
                                      <div className="text-sm text-slate-600">{new Date(item.due).toLocaleDateString('de-DE')}</div>
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Kommunikation
                </CardTitle>
                <CardDescription>
                  Projektbezogene Kommunikation (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Kommunikationsfeatures werden in der nächsten Version implementiert</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Toaster />
      </div>
    </div>
  );
}

export default App;