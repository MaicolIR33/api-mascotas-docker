const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const PORT = 3000;

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

// MySQL puede tardar unos segundos en aceptar conexiones al arrancar,
// aunque depends_on ya haya iniciado el contenedor. Reintentamos la conexión.
async function connectWithRetry(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      pool = mysql.createPool(dbConfig);
      await pool.query('SELECT 1');
      console.log('Conectado a MySQL correctamente.');
      return;
    } catch (err) {
      console.log(`Intento ${attempt}/${retries}: no se pudo conectar a MySQL (${err.code}). Reintentando en ${delayMs / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  console.error('No se pudo conectar a MySQL tras varios intentos. Saliendo.');
  process.exit(1);
}

// GET /mascotas - listar todas
app.get('/mascotas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mascotas');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar mascotas', detalle: err.message });
  }
});

// GET /mascotas/:id - obtener una por id
app.get('/mascotas/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM mascotas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener mascota', detalle: err.message });
  }
});

// POST /mascotas - registrar
app.post('/mascotas', async (req, res) => {
  try {
    const { nombre, especie, edad, peso } = req.body;
    if (!nombre || !especie || edad === undefined || peso === undefined) {
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre, especie, edad, peso' });
    }
    const [result] = await pool.query(
      'INSERT INTO mascotas (nombre, especie, edad, peso) VALUES (?, ?, ?, ?)',
      [nombre, especie, edad, peso]
    );
    res.status(201).json({ id: result.insertId, nombre, especie, edad, peso });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar mascota', detalle: err.message });
  }
});

// PUT /mascotas/:id - actualizar
app.put('/mascotas/:id', async (req, res) => {
  try {
    const { nombre, especie, edad, peso } = req.body;
    const [result] = await pool.query(
      'UPDATE mascotas SET nombre = ?, especie = ?, edad = ?, peso = ? WHERE id = ?',
      [nombre, especie, edad, peso, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.json({ id: Number(req.params.id), nombre, especie, edad, peso });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar mascota', detalle: err.message });
  }
});

// DELETE /mascotas/:id - eliminar
app.delete('/mascotas/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM mascotas WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Mascota no encontrada' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar mascota', detalle: err.message });
  }
});

connectWithRetry().then(() => {
  app.listen(PORT, () => {
    console.log(`API escuchando en el puerto ${PORT}`);
  });
});
