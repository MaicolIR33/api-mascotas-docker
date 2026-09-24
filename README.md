# API de Mascotas — Clínica Veterinaria (Docker + Nginx + Node.js + MySQL)

## Descripción

Para esta actividad desarrollé una API REST para el registro de mascotas de una clínica veterinaria, empaquetada completamente en Docker para que pueda ejecutarse en cualquier computador sin instalar Node.js ni MySQL localmente.

La arquitectura tiene tres capas, cada una en su propio contenedor:

- **Nginx** (puerto publicado `8080`): actúa como proxy inverso y es el único punto de entrada al sistema, cumpliendo con el requisito de que la API no se exponga directamente.
- **API en Node.js/Express** (puerto interno `3000`, no publicado): expone los 5 endpoints del CRUD de mascotas.
- **MySQL** (puerto interno `3306`, no publicado): guarda los datos en un volumen para que sobrevivan aunque los contenedores se eliminen.

Los tres servicios se orquestan con un solo `docker-compose.yml`, de modo que todo el entorno se levanta con un solo comando.

## Cómo lo construí

1. Escribí la API en `api/index.js` usando Express y el cliente `mysql2`. La configuración de conexión a la base de datos (host, usuario, contraseña, nombre de la BD) se toma de variables de entorno, así que no dejé ninguna credencial escrita directamente en el código.
2. Como noté que MySQL puede tardar unos segundos en estar listo para aceptar conexiones aunque el contenedor ya haya "arrancado", agregué lógica de reintento en la API para que no falle al iniciar.
3. En `api/Dockerfile` usé la imagen base `node:22-alpine` (liviana, con la versión fijada), copié primero el `package.json` para aprovechar la caché de capas de Docker, instalé dependencias con `npm install --omit=dev`, y luego copié el resto del código.
4. Agregué un `.dockerignore` para no llevar `node_modules` ni archivos de control de versiones dentro de la imagen.
5. En `db/init.sql` definí la tabla `mascotas` (id, nombre, especie, edad, peso) e inserté tres mascotas de ejemplo, para que el script se ejecute automáticamente la primera vez que arranca el contenedor de MySQL.
6. Configuré `nginx/default.conf` con un `proxy_pass` hacia `http://api:3000`, usando el nombre del servicio de Docker Compose como host, y reenviando las cabeceras `Host` y `X-Real-IP`.
7. En `docker-compose.yml` declaré los tres servicios en una misma red interna, usé `depends_on` para que el orden de arranque sea db → api → nginx, y definí un volumen con nombre (`db_data`) para persistir los datos de MySQL.

## Cómo ejecutarlo

```bash
# Construir las imágenes
docker compose build

# Levantar el sistema en segundo plano
docker compose up -d

# Verificar que los tres contenedores están corriendo
docker compose ps

# Revisar logs hasta confirmar que la API se conectó a MySQL
docker compose logs -f api
```

## Endpoints (siempre a través de Nginx, puerto 8080)

Probé los cinco endpoints con `curl`, todos contra Nginx y nunca directamente contra la API:

```bash
# Listar todas las mascotas
curl http://localhost:8080/mascotas

# Obtener una mascota por id
curl http://localhost:8080/mascotas/1

# Registrar una mascota
curl -X POST http://localhost:8080/mascotas -H "Content-Type: application/json" -d "{\"nombre\":\"Luna\",\"especie\":\"Perro\",\"edad\":3,\"peso\":12.5}"

# Actualizar una mascota
curl -X PUT http://localhost:8080/mascotas/1 -H "Content-Type: application/json" -d "{\"nombre\":\"Michi\",\"especie\":\"Gato\",\"edad\":4,\"peso\":4.2}"

# Eliminar una mascota
curl -X DELETE http://localhost:8080/mascotas/2
```

## Verificación de persistencia

Para comprobar que los datos sobreviven al ciclo de vida de los contenedores, registré una mascota nueva, luego bajé el entorno sin borrar el volumen y lo volví a levantar:

```bash
docker compose down
docker compose up -d
curl http://localhost:8080/mascotas
```

La mascota registrada antes de bajar el sistema seguía apareciendo después de levantarlo de nuevo, confirmando que el volumen `db_data` conserva la información aunque los contenedores se eliminen y recreen.

## Limpieza completa

```bash
# Elimina contenedores y también el volumen de datos
docker compose down -v

# Listar y borrar imágenes si es necesario
docker images
docker rmi <id_imagen>
```

## Estructura del proyecto

```
proyecto/
├── docker-compose.yml
├── api/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── index.js
├── nginx/
│   └── default.conf
└── db/
    └── init.sql
```

## Evidencias

En la carpeta de evidencias (o adjuntas en la entrega) incluyo capturas de:

- `docker compose ps` mostrando los tres contenedores corriendo.
- Los cinco endpoints funcionando a través de Nginx (puerto 8080).
- La prueba de persistencia (mascota registrada antes de `docker compose down`, presente después de `docker compose up -d`)."# api-mascotas-docker" 
