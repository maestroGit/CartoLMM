🚦 Paso a paso: Visualizar pares de transacciones en CartoLMM desde tu wallet
1. En la wallet demo (web-demo.html): obtén el historial filtrado
Cuando el usuario quiera visualizar transacciones específicas en el mapa:

Prepara en JavaScript el objeto historialFiltrado que contenga el array de transacciones que quieres mostrar, con los campos relevantes.
Ejemplo:
js
const historialFiltrado = [
  {
    de: "publicKeyOrigen1",
    destino: "publicKeyDestino1",
    cantidad: 5,
    timestamp: "2025-04-15T16:12:22Z"
  },
  // ... más transacciones
];
2. Envía el historial filtrado al backend de CartoLMM
Realiza una petición POST desde la demo-wallet al endpoint de CartoLMM, por ejemplo:
js
fetch('https://cartolmm.example.com/api/map/intercambio', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ historial: historialFiltrado })
})
.then(res => res.json())
.then(data => {
  // recibimos un jobId u otro parámetro para identificar el dataset
  window.location.href = `https://cartolmm.example.com/mapa/intercambio?id=${data.jobId}`;
});
Nota: Si ambas apps están en localhost, puedes usar http://localhost:xxxx/....
3. Backend de CartoLMM: recibe y procesa el historial
Crea en CartoLMM un endpoint /api/map/intercambio que:

Recibe el historial.
Lo valida y guarda temporalmente (en memoria o en base de datos) asociado a un jobId único (ejemplo: UUID).
Devuelve { jobId } como respuesta.
Ejemplo Node.js/Express:

js
// Mínimo ejemplo de server (usa una store en memoria o BD real)
let jobsData = {}; // O mejor: una base de datos

app.post('/api/map/intercambio', (req, res) => {
  const historial = req.body.historial;
  const jobId = generateJobId(); // Usa un generador seguro
  jobsData[jobId] = historial;
  res.json({ jobId });
});
Protege el endpoint usando algún tipo de autenticación ligera si los datos no son públicos.

4. Redirección automática a la visualización
Cuando el frontend recibe el jobId en respuesta al POST, redirige al mapa de CartoLMM usando una url como:
Code
https://cartolmm.example.com/mapa/intercambio?id=EL_JOB_ID_RECIBIDO
Así el usuario va directo del envío a la visualización gráfica.
5. Visualizador de mapa en CartoLMM
Cuando /mapa/intercambio carga:

Lee el parámetro id de la URL.
Hace una llamada a un endpoint como /api/map/intercambio/get?id=... para obtener los datos del jobId.
Ahora tienes el array de transacciones para pintar.
Ejemplo:

js
// En el frontend CartoLMM
const urlParams = new URLSearchParams(window.location.search);
const jobId = urlParams.get("id");
fetch(`/api/map/intercambio/get?id=${jobId}`)
  .then(res => res.json())
  .then(historial => {
    // Bucle para pintar
  });
Para cada par ({ de, destino }), buscas sus coordenadas (por ejemplo, en una tabla static, una BD, o petición a microservicio):

js
const addressCoords = {
  "publicKeyOrigen1": {lat: xx, lon: yy},
  "publicKeyDestino1": {lat: aa, lon: bb},
  // etc
};
Pintar ambos puntos como L.marker y unirlos con L.polyline:

js
historial.forEach(tx => {
  const from = addressCoords[tx.de];
  const to = addressCoords[tx.destino];
  if (from && to) {
    L.marker([from.lat, from.lon]).addTo(map);
    L.marker([to.lat, to.lon]).addTo(map);
    L.polyline([[from.lat, from.lon], [to.lat, to.lon]], {color: "blue"}).addTo(map);
  }
});
6. Seguridad
Solo envías datos ya filtrados y firmados, nunca la clave privada.
El jobId puede tener una validez corta. Nunca expongas datos sensibles.
Si es necesario, añade autenticación para los endpoints de CartoLMM.
Usa HTTPS siempre en producción.
Resumen Visual del Flujo
Mermaid
sequenceDiagram
    participant WalletDemo as Wallet Demo (web-demo.html)
    participant CartoLMMBE as Backend CartoLMM
    participant CartoLMMFE as Frontend CartoLMM (Mapa)

    WalletDemo->>CartoLMMBE: POST /api/map/intercambio {historial}
    CartoLMMBE-->>WalletDemo: {jobId}
    WalletDemo->>WalletDemo: Redirección automática a /mapa/intercambio?id=jobId
    CartoLMMFE->>CartoLMMBE: GET /api/map/intercambio/get?id=jobId
    CartoLMMBE-->>CartoLMMFE: {historial}
    CartoLMMFE->>CartoLMMFE: Pinta puntos y líneas según historial y addresses
Conclusión
Sí, es totalmente viable y seguro.
La visualización final será siempre en CartoLMM, y todo el flujo está organizado y desacoplado.
Puedes expandirlo para pintar diferentes tipos de transacciones, colores, y detalles extra.
¿Quieres muestras de código reales para cada uno de estos pasos, o necesitas un ejemplo específico (Node.js, Express, Leaflet) integrado a tu repo?

