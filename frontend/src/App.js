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
  const [activeTab, setActiveTab] = useState("overview");
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

  const [milestones, setMilestones] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [risks, setRisks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [changes, setChanges] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [timelineView, setTimelineView] = useState("all"); // "all" or "single"

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
    } catch (error) {
      console.error("Fehler beim Erstellen der Aufgabe:", error);
      toast.error("Fehler beim Erstellen der Aufgabe");
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
      // Show all projects with their tasks
      projects.forEach(project => {
        const projectTasks = tasks.filter(task => task.project_id === project.id);
        timelineData.push({
          type: 'project',
          id: project.id,
          title: project.title,
          customer: project.customer,
          status: project.status,
          tasks: projectTasks
        });
      });
    } else if (selectedProject) {
      // Show only selected project
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        const projectTasks = tasks.filter(task => task.project_id === selectedProject);
        timelineData.push({
          type: 'project',
          id: project.id,
          title: project.title,
          customer: project.customer,
          status: project.status,
          tasks: projectTasks
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

  const generateDateColumns = () => {
    const { start, end } = getDateRange();
    const dates = [];
    const current = new Date(start);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 7); // Weekly columns
    }
    
    return dates;
  };

  const getTaskPosition = (taskDate, startDate, endDate) => {
    const taskTime = new Date(taskDate).getTime();
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const totalTime = endTime - startTime;
    const taskOffset = taskTime - startTime;
    
    return Math.max(0, Math.min(100, (taskOffset / totalTime) * 100));
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
            <Select value={selectedProject} onValueChange={setSelectedProject}>
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
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-9 gap-1 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm">
            <TabsTrigger value="overview" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Projekte</span>
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
                <Card key={project.id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-slate-800">{project.title}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription>{project.customer}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      {new Date(project.date).toLocaleDateString('de-DE')}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      {project.author}
                    </div>
                    <Button 
                      onClick={() => setSelectedProject(project.id)}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Projekt auswählen
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

          {/* Other tabs placeholders */}
          <TabsContent value="milestones" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Target className="h-5 w-5 text-blue-600" />
                  Meilensteine
                </CardTitle>
                <CardDescription>
                  {selectedProject ? "Verwalten Sie die Meilensteine für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedProject ? (
                  <div className="text-center py-8 text-slate-500">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Bitte wählen Sie ein Projekt aus, um Meilensteine zu verwalten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Noch keine Meilensteine definiert</p>
                    ) : (
                      <div className="space-y-2">
                        {milestones.map((milestone) => (
                          <div key={milestone.id} className="p-3 border rounded-lg bg-slate-50">
                            <div className="font-medium">{milestone.gate}</div>
                            <div className="text-sm text-slate-600">Geplant: {new Date(milestone.plan).toLocaleDateString('de-DE')}</div>
                            <div className="text-sm text-slate-600">Verantwortlich: {milestone.owner}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    {budgetItems.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Noch keine Budgetposten definiert</p>
                    ) : (
                      <div className="space-y-2">
                        {budgetItems.map((item) => (
                          <div key={item.id} className="p-3 border rounded-lg bg-slate-50">
                            <div className="font-medium">{item.item}</div>
                            <div className="text-sm text-slate-600">Plan: €{item.plan.toLocaleString('de-DE')}</div>
                            <div className="text-sm text-slate-600">Ist: €{item.actual.toLocaleString('de-DE')}</div>
                            <div className="text-sm text-slate-600">Forecast: €{item.fc.toLocaleString('de-DE')}</div>
                          </div>
                        ))}
                      </div>
                    )}
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
                    {risks.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Noch keine Risiken definiert</p>
                    ) : (
                      <div className="space-y-2">
                        {risks.map((risk) => (
                          <div key={risk.id} className="p-3 border rounded-lg bg-slate-50">
                            <div className="font-medium">{risk.title}</div>
                            <div className="text-sm text-slate-600">Score: {risk.score} (P:{risk.p} × A:{risk.a})</div>
                            <div className="text-sm text-slate-600">Verantwortlich: {risk.owner}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  Aufgaben / OPL
                </CardTitle>
                <CardDescription>
                  {selectedProject ? "Verwalten Sie die Aufgaben für das ausgewählte Projekt" : "Bitte wählen Sie zuerst ein Projekt aus"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedProject ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Bitte wählen Sie ein Projekt aus, um Aufgaben zu verwalten</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Noch keine Aufgaben definiert</p>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div key={task.id} className="p-3 border rounded-lg bg-slate-50">
                            <div className="font-medium">{task.task}</div>
                            <div className="text-sm text-slate-600">Verantwortlich: {task.owner}</div>
                            <div className="text-sm text-slate-600">Fortschritt: {task.prog}%</div>
                            <div className="text-sm text-slate-600">Fällig: {new Date(task.due).toLocaleDateString('de-DE')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    {changes.length === 0 ? (
                      <p className="text-slate-500 text-center py-4">Noch keine Change Requests definiert</p>
                    ) : (
                      <div className="space-y-2">
                        {changes.map((change) => (
                          <div key={change.id} className="p-3 border rounded-lg bg-slate-50">
                            <div className="font-medium">{change.subject}</div>
                            <div className="text-sm text-slate-600">Status: {change.status}</div>
                            <div className="text-sm text-slate-600">Entscheider: {change.decision_maker}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Terminplanung
                </CardTitle>
                <CardDescription>
                  Multi-Timeline Ansicht für Projekttermine (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Terminplanung wird in der nächsten Version implementiert</p>
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