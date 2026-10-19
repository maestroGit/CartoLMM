# Estandares Tecnicos y Mapa de Dependencias - magnumslocal

## Objetivo
Este documento define la arquitectura base oficial del nodo `magnumslocal`, sus criterios tecnicos, y el mapa de dependencias permitido para mantener seguridad, mantenibilidad y simplicidad operativa.

Alcance:
- Estructura modular en Node.js/Express.
- Seguridad estricta (CSP, Helmet, CORS, OAuth redirects).
- Gestion de configuracion y variables de entorno.
- Stack oficial y dependencias aprobadas.
- Estilo de codigo y principios de implementacion.

Fuera de alcance:
- Implementaciones funcionales concretas.
- Codigo de aplicacion.

---

## 1) Estructura modular (Node.js/Express)

### 1.1 Principio de separacion por capas
La aplicacion debe organizarse en modulos con responsabilidades explicitas:
- `routes/`: definicion de endpoints HTTP y versionado de API.
- `controllers/`: orquestacion de request/response sin logica de dominio pesada.
- `services/`: logica de negocio y coordinacion de casos de uso.
- `middlewares/`: preocupaciones transversales (seguridad, auth, validaciones, logging, manejo de errores).
- `models/`: estructuras de datos y acceso a persistencia.
- `config/`: carga y validacion de configuracion.
- `utils/`: utilidades puras y helpers reutilizables.

### 1.2 Reglas de dependencia interna
- `routes` depende de `controllers` y `middlewares`.
- `controllers` depende de `services` y contratos de entrada/salida.
- `services` depende de `models`, clientes externos y utilidades.
- `models` no depende de `controllers` ni de `routes`.
- `middlewares` no deben incluir logica de negocio.
- Evitar dependencias circulares entre modulos.

### 1.3 Composicion del servidor
- Un punto de entrada principal para arranque del servidor y bootstrap de middleware global.
- Registro de rutas por dominio funcional (no por archivo monolitico).
- Manejo global de errores al final del pipeline de middleware.
- Separar inicializacion de infraestructura (DB, blockchain, P2P, storage) de la capa HTTP.

### 1.4 Criterios de modularidad
- Funciones pequenas, cohesion alta, acoplamiento bajo.
- Interfaces explicitas entre capas (parametros claros y objetos tipados cuando aplique).
- Sin logica de seguridad duplicada: centralizar en middleware comun.

---

## 2) Seguridad estricta

La postura oficial es "secure by default": toda nueva capacidad nace cerrada y se abre solo lo necesario.

### 2.1 CSP (Content Security Policy)
- Aplicar CSP estricta en todas las respuestas HTML.
- Politica por defecto recomendada:
  - `default-src 'self'`
  - `script-src 'self'` (evitar `unsafe-inline` y `unsafe-eval`)
  - `style-src 'self'` (si hay inline legacy, plan de eliminacion progresiva)
  - `img-src 'self' data:`
  - `connect-src 'self'` mas endpoints explicitamente permitidos
  - `frame-ancestors 'none'` salvo requerimiento controlado
  - `base-uri 'self'`
  - `form-action 'self'`
- Cualquier excepcion debe documentarse con justificacion y fecha de revision.

### 2.2 Helmet
- Helmet es obligatorio como baseline de hardening HTTP.
- Mantener habilitadas cabeceras de proteccion por defecto salvo incompatibilidad demostrada.
- Ajustes de Helmet deben vivir en modulo central de seguridad.

### 2.3 CORS
- No usar `*` en produccion para origenes sensibles.
- Definir allowlist explicita por entorno (`dev`, `staging`, `prod`).
- Restringir metodos y headers al minimo necesario.
- Permitir credenciales solo cuando exista necesidad funcional real y evaluada.

### 2.4 OAuth 2.0 (Google) y control de redirecciones
- No se aceptan redirecciones dinamicas sin validacion.
- Mantener lista blanca de `redirect_uri` autorizadas por entorno.
- Validar que `redirect_uri` recibido coincide exactamente con una URI permitida.
- Rechazar cualquier URL con dominio no esperado, protocolos inseguros o puertos no aprobados.
- Usar y verificar parametro `state` para mitigar CSRF en flujo OAuth.
- No exponer tokens en query strings de redireccion final.

### 2.5 Sesiones, tokens y secretos
- Secretos solo por variables de entorno, nunca en codigo fuente.
- Rotacion periodica de claves y revocacion ante incidente.
- Logs sin datos sensibles (tokens, secretos, PII, credenciales).

---

## 3) Configuracion y variables de entorno

### 3.1 Principios
- Configuracion centralizada en un modulo unico.
- Validacion al arranque: si falta variable critica, el proceso falla temprano.
- Valores por defecto solo para variables no sensibles.

### 3.2 Estructura recomendada de configuracion
Categorias minimas:
- `APP`: puerto, entorno, origen publico, modo debug.
- `SECURITY`: secretos, flags de hardening, politicas de CORS/CSP.
- `OAUTH_GOOGLE`: client id, client secret, redirect URIs permitidas.
- `DEPLOY`: dominios y parametros de Railway.
- `SERVICES`: endpoints internos/externos (si aplican).

### 3.3 Rutas base dinamicas en frontend
- Para enlaces y callbacks del cliente, usar `window.location.origin` como base dinamica.
- Evitar hostnames hardcodeados en codigo cliente.
- Cuando una ruta dependa de entorno, resolver desde configuracion servida por backend o convencion controlada.

### 3.4 Estrategia por entornos
- `development`: ergonomia y trazabilidad.
- `staging`: espejo de produccion con datos y secretos acotados.
- `production`: maximo hardening y minimo privilegio.

---

## 4) Stack y dependencias oficiales

## 4.1 Runtime y framework
- Runtime oficial: Node.js (LTS vigente).
- Framework HTTP oficial: Express.

### 4.2 Seguridad HTTP
- Middleware oficial de seguridad: Helmet.
- CORS controlado mediante middleware de CORS con allowlist explicita.
- CSP definida y aplicada de forma centralizada.

### 4.3 Autenticacion
- Proveedor oficial de identidad externa: Google OAuth 2.0.
- Flujo permitido: Authorization Code con validaciones de `state` y `redirect_uri`.

### 4.4 Despliegue
- Plataforma oficial de despliegue: Railway.
- Configuracion de entorno gestionada via variables en Railway.
- No hardcodear valores de infraestructura en repositorio.

### 4.5 Politica de dependencias
- Minimalismo estricto: no agregar librerias de terceros sin justificacion tecnica y riesgo evaluado.
- Priorizar capacidades nativas de Node.js/Express cuando cubran el requerimiento.
- Cada dependencia nueva debe incluir:
  - motivo de inclusion
  - analisis de seguridad/mantenimiento
  - impacto operativo
  - plan de actualizacion
- Evitar duplicidad funcional entre paquetes.

### 4.6 Mapa de dependencias (alto nivel)
- Capa `HTTP`: Express + middlewares oficiales de seguridad.
- Capa `Auth`: Google OAuth 2.0 + validaciones de redireccion y estado.
- Capa `Config`: variables de entorno + modulo central validado.
- Capa `Deploy`: Railway como runtime/plataforma.
- Capa `Dominio`: servicios/controladores/modelos internos del proyecto.

Representacion de flujo:
1. Cliente -> Express (`routes`)
2. `routes` -> middlewares de seguridad (Helmet, CORS, CSP)
3. `routes` -> `controllers`
4. `controllers` -> `services`
5. `services` -> `models` / integraciones externas (OAuth, otros servicios)
6. Respuesta controlada + manejo global de errores

---

## 5) Estilo de codigo (legibilidad, errores, minimalismo)

### 5.1 Legibilidad
- Nombres claros y semanticos.
- Funciones cortas con una responsabilidad.
- Evitar abstracciones prematuras.
- Comentarios solo cuando agregan contexto no obvio.

### 5.2 Manejo limpio de errores
- Error handling centralizado en middleware global.
- Diferenciar errores de negocio, validacion e infraestructura.
- Mensajes hacia cliente: claros, consistentes y sin fuga de detalles sensibles.
- Logs internos: suficientes para diagnostico, sin exponer secretos.

### 5.3 Minimalismo tecnico
- Menos superficie, menos riesgo: preferir soluciones simples y auditables.
- Evitar patrones complejos si no aportan beneficio real.
- Reusar componentes internos antes de introducir nuevos paquetes.

### 5.4 Consistencia
- Convenciones uniformes de estructura, naming y control de errores.
- Reglas de seguridad aplicadas de forma transversal, no opcional.

---

## Checklist de cumplimiento arquitectonico

Antes de aceptar cambios relevantes, verificar:
- El modulo respeta separacion por capas y evita dependencias circulares.
- CSP/Helmet/CORS estan activos y configurados segun entorno.
- OAuth valida `state` y `redirect_uri` contra allowlist.
- No hay secretos hardcodeados; configuracion via entorno validada al inicio.
- No se introducen dependencias de terceros sin justificacion formal.
- El manejo de errores es consistente, seguro y centralizado.

---

## Gobernanza de este documento
- Este archivo es la referencia base de arquitectura para `magnumslocal`.
- Toda excepcion a estos estandares debe documentarse en PR con justificacion y fecha de revision.
- Revision recomendada: mensual o ante cambios de seguridad/plataforma.

---

## Version 2 - Matriz ADR resumida

Esta matriz resume decisiones arquitectonicas clave para facilitar evaluacion de cambios y trazabilidad tecnica.

| Decision | Estado | Responsable | Ultima revision | Frecuencia de revision | Motivo | Riesgo | Alternativa |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Arquitectura modular por capas (`routes`, `controllers`, `services`, `models`, `middlewares`, `config`) | Vigente | Arquitectura Backend | 2026-09-14 | Trimestral | Mejora mantenibilidad, pruebas y evolucion por dominio | Sobre-segmentacion y complejidad innecesaria en modulos pequenos | Estructura monolitica por feature unica con menos capas formales |
| Express como framework HTTP oficial | Vigente | Arquitectura Backend | 2026-09-14 | Trimestral | Ecosistema estable, curva de aprendizaje baja y alta interoperabilidad | Riesgo de deuda si se sobrecarga con logica no HTTP | Framework mas opinionado (por ejemplo, NestJS) con mayor estructura nativa |
| Seguridad por defecto con Helmet + CSP estricta + CORS con allowlist | Vigente | Seguridad de Aplicacion | 2026-09-14 | Mensual | Reduce superficie de ataque y evita configuraciones abiertas por error | Bloqueos funcionales iniciales por politicas demasiado estrictas | Endurecimiento progresivo posterior al desarrollo (menos recomendado) |
| Validacion estricta de `redirect_uri` y uso obligatorio de `state` en OAuth 2.0 | Vigente | Seguridad de Aplicacion | 2026-09-14 | Mensual | Mitiga open redirect, CSRF y desvio de flujo de autenticacion | Fallos de login por desalineacion entre entornos o URIs no registradas | Validacion parcial por dominio (mas flexible, pero menos segura) |
| Gestion centralizada de variables de entorno con validacion al arranque (fail-fast) | Vigente | Plataforma y DevOps | 2026-09-14 | Mensual | Detecta errores de configuracion temprano y evita estados inconsistentes | Interrupcion de arranque si falta variable critica | Resolver faltantes en runtime con defaults amplios (mas fragil) |
| Uso de `window.location.origin` como base dinamica en frontend | Vigente | Frontend Platform | 2026-09-14 | Trimestral | Evita hardcodeo de hosts y facilita portabilidad entre entornos | Dependencia del contexto de ejecucion del navegador/proxy | Inyectar base URL fija por build/env en cada despliegue |
| Railway como plataforma oficial de despliegue | Vigente | Plataforma y DevOps | 2026-09-14 | Trimestral | Simplifica operacion, CI/CD y gestion de variables de entorno | Vendor lock-in y limites de plataforma | Despliegue en contenedores sobre infraestructura propia o multi-cloud |
| Politica de minimalismo de dependencias de terceros | Vigente | Arquitectura Backend | 2026-09-14 | Trimestral | Menor superficie de vulnerabilidades y menor costo de mantenimiento | Reimplementar capacidades ya resueltas por librerias maduras | Ampliar adopcion de paquetes externos con proceso de evaluacion mas flexible |
| Manejo global de errores y respuestas consistentes | Vigente | Arquitectura Backend | 2026-09-14 | Trimestral | Facilita observabilidad, soporte y seguridad de mensajes al cliente | Si se diseña mal, puede ocultar contexto util para debugging | Manejo local por controlador (mas verboso e inconsistente) |
| Prohibicion de secretos en codigo fuente | Vigente | Seguridad de Aplicacion | 2026-09-14 | Mensual | Evita filtraciones en repositorio e incidentes de seguridad | Mayor dependencia de disciplina operativa en entornos | Secretos embebidos cifrados en repositorio (menos recomendado) |

Leyenda de estado:
- Vigente: decision activa y obligatoria.
- En revision: decision temporalmente evaluada por cambios de contexto tecnico.
- Deprecada: decision reemplazada; no debe aplicarse en cambios nuevos.

Leyenda de frecuencia:
- Mensual: revisar cada 30 dias.
- Trimestral: revisar cada 90 dias.

### Uso operativo de la matriz ADR
- Cada cambio relevante debe indicar si confirma, extiende o reemplaza una decision de esta matriz.
- Si una decision cambia, registrar fecha, impacto esperado y plan de rollback.
- Toda decision debe tener responsable explicitado y fecha de ultima revision actualizada.
- Si una decision supera su frecuencia sin revision, debe pasar a estado `En revision` hasta regularizacion.
- Revisar esta matriz junto con el checklist arquitectonico en cada PR de infraestructura, seguridad o autenticacion.