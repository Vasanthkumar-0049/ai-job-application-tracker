import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";

const emptyForm = {
  company: "",
  role: "",
  location: "",
  url: "",
  applied_date: "",
  status: "Applied",
  notes: ""
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [tab, setTab] = useState("tracker");
  const [resume, setResume] = useState("");
  const [jd, setJd] = useState("");
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const [jobsRes, statsRes] = await Promise.all([
      fetch(`${API}/jobs`),
      fetch(`${API}/stats`)
    ]);
    setJobs(await jobsRes.json());
    setStats(await statsRes.json());
  }

  useEffect(() => { load(); }, []);

  function change(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveJob(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      alert("Company and role are required");
      return;
    }

    const url = editingId ? `${API}/jobs/${editingId}` : `${API}/jobs`;
    const method = editingId ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setForm(emptyForm);
    setEditingId(null);
    await load();
  }

  function editJob(job) {
    setForm({
      company: job.company,
      role: job.role,
      location: job.location || "",
      url: job.url || "",
      applied_date: job.applied_date || "",
      status: job.status,
      notes: job.notes || ""
    });
    setEditingId(job.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteJob(id) {
    if (!confirm("Delete this application?")) return;
    await fetch(`${API}/jobs/${id}`, { method: "DELETE" });
    await load();
  }

  async function runMatch(e) {
    e.preventDefault();
    if (!resume.trim() || !jd.trim()) return;
    setLoading(true);
    const response = await fetch(`${API}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, job_description: jd })
    });
    setMatch(await response.json());
    setLoading(false);
  }

  const visibleJobs = useMemo(() => jobs.filter(j => {
    const text = `${j.company} ${j.role} ${j.location}`.toLowerCase();
    return text.includes(search.toLowerCase()) &&
      (filter === "All" || j.status === filter);
  }), [jobs, search, filter]);

  return (
    <div className="app">
      <header>
        <div>
          <h1>AI Job Application Tracker</h1>
          <p>Track applications, interviews and resume matches.</p>
        </div>
        <nav>
          <button className={tab === "tracker" ? "active" : ""} onClick={() => setTab("tracker")}>Job Tracker</button>
          <button className={tab === "matcher" ? "active" : ""} onClick={() => setTab("matcher")}>AI Matcher</button>
        </nav>
      </header>

      {tab === "tracker" ? (
        <>
          <section className="stats">
            <Stat title="Total" value={stats.total || 0} />
            <Stat title="Applied" value={stats.applied || 0} />
            <Stat title="Interview" value={stats.interview || 0} />
            <Stat title="Selected" value={stats.selected || 0} />
            <Stat title="Rejected" value={stats.rejected || 0} />
          </section>

          <section className="panel">
            <h2>{editingId ? "Edit Application" : "Add Application"}</h2>
            <form onSubmit={saveJob} className="form">
              <input name="company" placeholder="Company *" value={form.company} onChange={change} />
              <input name="role" placeholder="Job Role *" value={form.role} onChange={change} />
              <input name="location" placeholder="Location" value={form.location} onChange={change} />
              <input name="url" placeholder="Job URL" value={form.url} onChange={change} />
              <input name="applied_date" type="date" value={form.applied_date} onChange={change} />
              <select name="status" value={form.status} onChange={change}>
                <option>Applied</option>
                <option>Interview</option>
                <option>Selected</option>
                <option>Rejected</option>
              </select>
              <textarea name="notes" placeholder="Notes" value={form.notes} onChange={change} />
              <div>
                <button className="primary">{editingId ? "Update Job" : "Add Job"}</button>
                {editingId && <button type="button" onClick={() => {setEditingId(null);setForm(emptyForm)}}>Cancel</button>}
              </div>
            </form>
          </section>

          <section className="panel">
            <div className="toolbar">
              <input placeholder="Search company, role or location..." value={search} onChange={e => setSearch(e.target.value)} />
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option>All</option>
                <option>Applied</option>
                <option>Interview</option>
                <option>Selected</option>
                <option>Rejected</option>
              </select>
            </div>

            <div className="tableWrap">
              <table>
                <thead><tr><th>Company</th><th>Role</th><th>Location</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {visibleJobs.map(job => (
                    <tr key={job.id}>
                      <td><strong>{job.company}</strong></td>
                      <td>{job.role}</td>
                      <td>{job.location || "-"}</td>
                      <td>{job.applied_date || "-"}</td>
                      <td><span className={`badge ${job.status.toLowerCase()}`}>{job.status}</span></td>
                      <td>
                        <button onClick={() => editJob(job)}>Edit</button>
                        <button className="danger" onClick={() => deleteJob(job.id)}>Delete</button>
                        {job.url && <a href={job.url} target="_blank" rel="noreferrer">Open</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!visibleJobs.length && <p className="empty">No applications found.</p>}
            </div>
          </section>
        </>
      ) : (
        <section className="matcher">
          <div className="panel">
            <h2>AI Resume ↔ Job Description Matcher</h2>
            <p className="muted">Uses TF-IDF and cosine similarity to estimate how closely your resume matches a job description.</p>
            <form onSubmit={runMatch}>
              <label>Resume</label>
              <textarea className="large" value={resume} onChange={e => setResume(e.target.value)} placeholder="Paste your resume text here..." />
              <label>Job Description</label>
              <textarea className="large" value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the job description here..." />
              <button className="primary">{loading ? "Checking..." : "Check Match"}</button>
            </form>
          </div>

          {match && (
            <div className="panel result">
              <h2>Match Result</h2>
              <div className="score">{match.match_score}%</div>
              <h3>{match.message}</h3>
              <p><strong>Matching keywords:</strong> {match.keywords_in_resume?.join(", ") || "None detected"}</p>
              <p><strong>Possible missing keywords:</strong> {match.possible_missing_keywords?.join(", ") || "None detected"}</p>
            </div>
          )}
        </section>
      )}

      <footer>React + FastAPI + SQLite + SQLAlchemy + TF-IDF</footer>
    </div>
  );
}

function Stat({ title, value }) {
  return <div className="stat"><span>{title}</span><strong>{value}</strong></div>;
}

export default App;
