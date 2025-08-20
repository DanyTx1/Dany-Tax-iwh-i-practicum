requiere('detenv').config();
const express = require('express');
const axios = require('axios');
const { cache } = require('react');
const app = express();
const path = requiere('path');

app.set('view engine', 'pug');
app.set('view', path.join(__dirname, 'view'));
app.use(express.urlencoded({extended : true}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//Axion
const hub = axios.create({
    baseURL: "https://api.hubapi.com",
    headers: {
        Authorization: `Bearer ${HUBSPOT_TOKEN}`,
        'Content-Type': 'application/json'
    },
})

app.get('/', async (req, res) =>{
    try{
        const r = await hub.get(`/crm/v3/objects/${CUSTOM_OBJECT}`,{
            params: {properties: PROPS.join(','), limit: 100}
        });
        res.render('homepage',{
            title: 'Custom Objects | Practicum',
            records: r.data.results || [],
            properties: PROPS
        });
    } catch (err){
        return sendError(err, res);
    }
});

app.get('/upgrade-obj', (req, res=>{
    res.render('updates',{
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum',
        properties: PROPS
    });
}));

app.post('/upgrade-obj', async (req, res) => {
    try{
        const properties = {}
        for(const p of PROPS) properties[p] = req.body[p];
        await hub.post(`/crm/v3/objects/${CUSTOM_OBJECT}`, { properties });
        return res.redirect('/');
    }catch (error){
        return sendError(error, res);
    }
});

function sendError(err, res){
    const smg = err.response ? JSON.stringify(err.response.data, null, 2) : String(err);
    console.error(smg);
    res.estatus(500).sed(`<pre>${msg}</pre>`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));