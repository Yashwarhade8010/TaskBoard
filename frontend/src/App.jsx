import { useEffect, useState, useCallback } from 'react';
import { listTasks, createTask, updateTask, deleteTask } from './api.js';

const STATUS_LABELS = { todo: 'To do', in_progress: 'In progress', done: 'Done' };
const FILTERS = [['', 'All'], ...Object.entries(STATUS_LABELS)];

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState("todo");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ title: "", description: "" });

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await listTasks(filter));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn) => {
    try {
      await fn();
      setError("");
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const onAdd = (e) => {
    e.preventDefault();
    run(async () => {
      await createTask({ title, description: description || null, status });
      setTitle("");
      setDescription("");
      setStatus("Pending");
    });
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setDraft({ title: t.title, description: t.description || "" });
  };

  const saveEdit = (id) =>
    run(async () => {
      await updateTask(id, {
        title: draft.title,
        description: draft.description || null,
      });
      setEditingId(null);
    });

  return (
    <main className="page">
      <header>
        <h1>Taskboard</h1>
        <p className="sub">
          Track what needs doing, what's underway, and what's finished.
        </p>
      </header>

      <form className="add" onSubmit={onAdd}>
        <input
          aria-label="Task title"
          placeholder="What needs doing?"
          value={title}
          maxLength={200}
          required
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          aria-label="Task details"
          placeholder="Details (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <label>Status: </label>
          <select value={status} onChange={handleStatusChange}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <button type="submit" className="primary">
          Add task
        </button>
      </form>

      <nav className="filters" aria-label="Filter tasks">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            className={filter === value ? "chip active" : "chip"}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}

      {loading ? (
        <p className="muted">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="muted">
          No tasks here yet. Add one above to get started.
        </p>
      ) : (
        <ul className="list">
          {tasks.map((t) => (
            <li key={t.id} className={`task ${t.status}`}>
              {editingId === t.id ? (
                <div className="edit">
                  <input
                    aria-label="Edit title"
                    value={draft.title}
                    maxLength={200}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                  />
                  <input
                    aria-label="Edit details"
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                  <div className="actions">
                    <button className="primary" onClick={() => saveEdit(t.id)}>
                      Save changes
                    </button>
                    <button onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="body">
                    <strong>{t.title}</strong>
                    {t.description && (
                      <span className="desc">{t.description}</span>
                    )}
                  </div>
                  <div className="actions">
                    <select
                      aria-label={`Status of ${t.title}`}
                      value={t.status}
                      onChange={(e) =>
                        run(() => updateTask(t.id, { status: e.target.value }))
                      }
                    >
                      {Object.entries(STATUS_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => startEdit(t)}>Edit</button>
                    <button
                      className="danger"
                      onClick={() =>
                        window.confirm(`Delete "${t.title}"?`) &&
                        run(() => deleteTask(t.id))
                      }
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
