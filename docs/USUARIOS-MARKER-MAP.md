# Usuarios en mapa (CartoLMM)

## Estado actual

CartoLMM renderiza usuarios y popups **exclusivamente desde API/BD**.

- Fuente de datos: `GET /api/users?includeWallets=true`
- Proxy backend: `src/api/controllers/userController.js`
- Servicio frontend: `src/services/UserService.js`
- Marcadores/popup: `src/leaflet/UserMarker.js`

No se usa `public/data/users.json` como fuente runtime.

## Flujo de datos

1. `UserService.loadUsers()` llama a `/api/users?includeWallets=true`.
2. El backend de CartoLMM proxyea a backend blockchain configurado (`BLOCKCHAIN_LOCAL_URL` en desarrollo).
3. El payload incluye `wallets[]` por usuario desde base de datos.
4. `UserMarker` pinta popup y wallets con `user.wallets`.

## Requisitos de backend

Para que un usuario se muestre en mapa:

- Debe venir en `data[]` de `/api/users`.
- Debe tener coordenadas válidas (`localizacion.lat/lng` o `localizacion_lat/lng`).
- Si `includeWallets=true`, popup mostrará addresses desde DB (`wallets`).

## Notas de operación

- Si falla `/api/users`, no hay fallback local JSON: mapa de usuarios queda vacío.
- Para validar un usuario concreto:

```bash
curl -s "http://localhost:8080/api/users/<USER_ID>?includeWallets=true"
```

- Para validar listado con wallets:

```bash
curl -s "http://localhost:8080/api/users?includeWallets=true"
```
