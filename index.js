require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

// Configuración de Pug y estáticos
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ENV
const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const CUSTOM_OBJECT = process.env.HS_CUSTOM_OBJECT; // ej. '2-48909376' o 'p2_pets'
const PROPS = (process.env.HS_CUSTOM_PROPERTIES || 'name,color,species')
  .split(',')
  .map(s => s.trim());

// Cliente Axios para HubSpot
const hub = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// GET "/" — homepage: renderiza tabla con registros del custom object
app.get('/', async (req, res) => {
  try {
    const r = await hub.get(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      params: { properties: PROPS.join(','), limit: 100 },
    });
    res.render('homepage', {
      title: 'Custom Objects | Practicum',
      records: r.data.results || [],
      properties: PROPS,
    });
    res.render('homepage', { title:'Custom Objects | Practicum', records: r.data.results || [], properties: PROPS, labels: LABELS });
  } catch (err) {
    return sendError(err, res);
  }
});

// GET "/update-cobj" — muestra el formulario
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
    properties: PROPS,
  });
});

const LABELS = Object.fromEntries(PROPS.map(p => [p, p.charAt(0).toUpperCase() + p.slice(1)]));

// POST "/update-cobj" — crea un nuevo registro con los datos del form
app.post('/update-cobj', async (req, res) => {
  try {
    const properties = {};
    for (const p of PROPS) properties[p] = req.body[p];
    await hub.post(`/crm/v3/objects/${CUSTOM_OBJECT}`, { properties });
    const PRETTY_LABELS = {
    name: 'Name',
    color: 'Color',
    species: 'Species',
    spacies: 'Species'  // <- si tu internal name quedó así, lo mostramos bien
    };

    const PLACEHOLDERS = {
    name: 'e.g., Toby',
    color: 'e.g., Brown',
    species: 'e.g., Dog',
    spacies: 'e.g., Dog'
    };
    return res.redirect('/');
  } catch (err) {
    return sendError(err, res);
  }
});

// Helper de errores
function sendError(err, res) {
  const msg = err.response
    ? JSON.stringify(err.response.data, null, 2)
    : String(err);
  console.error(msg);
  res.status(500).send(`<pre>${msg}</pre>`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
