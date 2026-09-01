const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const tasks = [
  { id: 1, title: 'Abrir el local', done: false },
  { id: 2, title: 'Revisar inventario', done: true },
  { id: 3, title: 'Limpiar cocina', done: false }
];

app.get('/', (req, res) => {
  res.json({ message: 'StaffHub API funcionando' });
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/login', (req, res) => {
  res.json({ token: 'demo-token-123', user: req.body });
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log('API corriendo en puerto ' + port);
});
