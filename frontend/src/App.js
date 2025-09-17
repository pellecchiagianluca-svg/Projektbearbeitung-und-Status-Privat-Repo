// frontend/src/App.js
import { useEffect, useState } from "react";
import "./App.css";

// <<< HIER NUR DIESE EINE ZEILE ANPASSEN, WENN SICH DER REPO-NAME ÄNDERT >>>
const PROJECTS_URL =
  "https://pellecchiagianluca-svg.github.io/Projektbearbeitung-und-Status-Privat-Repo/api/projects/index.json";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(PROJECTS_URL, {
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} beim Laden der Projekte`);
        }
        const data = await res.json();

        if (!Array.isArray(data)) {
          throw new Error("Unerwartetes Datenformat (keine Liste/Array).");
        }

        if (!cancelled) setProjects(data);
      } catch (e) {
        if (!cancelled) setError(e.message || "Unbekannter Fehler");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container">
      <header className="header">
        <h1>Projekt-Reporting-App</h1>
        <p>Verwalten Sie Ihre Projekte effizient und strukturiert</p>
      </header>

      {loading && <div className="card">🔄 Projekte werden geladen…</div>}

      {error && (
        <div className="card error">
          ⚠️ Fehler beim Laden der Projekte: <b>{error}</b>
          <div style={{ marginTop: 8 }}>
            Prüfe, ob <code>index.json</code> erreichbar ist:{" "}
            <a href={PROJECTS_URL} target="_blank" rel="noreferrer">
              {PROJECTS_URL}
            </a>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid">
          {projects.map((p) => (
            <article key={p.id} className="card">
              <h3 style={{ marginBottom: 6 }}>{p.title}</h3>
              <div>
                <b>Kunde:</b> {p.kunde}
              </div>
              <div>
                <b>Autor:</b> {p.autor}
              </div>
              <div>
                <b>Status:</b>{" "}
                <span className={`badge ${p.status?.toLowerCase() || ""}`}>
                  {p.status}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
