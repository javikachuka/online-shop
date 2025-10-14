# Descripcion



## Correr en dev
1. clonar repo
2. Crear una copia de ``.env.template`` y llamarlo ``.env``
3. Cargar las variables necesarias
4. Instalar dependencias ```npm install```
5. Levantar la base de datos con ``podman-compose up``
6. Correr las migraciones de prisma ```npx prisma migrate dev```
7. Ejecutar seed ```npm run seed```
7. Correr el proyecto ```npm run dev```
8. 

## Correr en prod