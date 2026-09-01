import { useEffect, useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://staffhub-o3d9.onrender.com/api/tasks')
      .then(res => res.json())
      .then(data => {
        setTasks(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial' }}>
      <h1>🚀 StaffHub - Prueba de Conexión</h1>
      <h2>✅ Frontend en Vercel + Backend en Render</h2>
      
      {loading ? (
        <p>Cargando tareas del servidor... (puede tardar 30 seg la primera vez)</p>
      ) : (
        <div>
          <h3>Tareas reales desde el backend:</h3>
          <ul>
            {tasks.map(task => (
              <li key={task.id}>
                {task.done ? '✅' : '⬜'} {task.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
