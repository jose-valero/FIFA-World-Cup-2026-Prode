# Quiniela Mundial 2026

## 1. Resumen del proyecto

Proyecto de **quiniela/prode del Mundial FIFA 2026**.

### Stack

- Frontend: React + TypeScript + MUI + TanStack Query + React Router
- Backend: Supabase (Postgres + Auth + RLS + RPC/functions)
- Deploy frontend: Cloudflare
- Idioma de UI: español
- Rutas: inglés

### Objetivo actual

Cerrar producto y backend con calidad de producción, manteniendo una arquitectura escalable y evitando deuda estructural innecesaria.

El foco actual es:

1. robustez del backend
2. consistencia de tipos y arquitectura frontend
3. mejoras funcionales concretas
4. base sólida para futuras escalas y múltiples quinielas/grupos

---

## 2. Estado actual del producto

La app ya cuenta con:

- autenticación con Supabase Auth
- registro/login
- carga de pronósticos
- fixture
- leaderboard/ranking
- dashboard
- panel admin para partidos, resultados y settings
- auditoría integrada dentro de leaderboard
- soporte para participantes deshabilitados
- sincronización de knockout en backend

Estado actual:

- ya probada en deploy
- buen rendimiento general
- no priorizar optimización prematura
- priorizar robustez, consistencia y mantenibilidad

---

## 3. Reglas de negocio

### 3.1 Pronósticos

Los usuarios pronostican resultados por partido.

### Puntuación

- 5 puntos por resultado exacto
- 3 puntos por acierto de signo
- 0 puntos si falla

### Restricciones de pronóstico

- Las predicciones se cargan por partido
- Existe bloqueo según estado global y/o timing de cierre
- Un partido que no debe permitir predicciones no debe permitir insert/update/delete
- Validar esto tanto en frontend como en backend cuando corresponda

### 3.2 Ranking

Orden principal:

1. puntos totales
2. exactos
3. nombre

Reglas:

- los usuarios deshabilitados no compiten
- no deben entrar en Top 3
- no deben tener posición competitiva
- sí deben seguir mostrándose en la tabla pública
- deben ir al final
- deben verse muted o con badge de deshabilitado

### 3.3 Participantes deshabilitados

Un participante deshabilitado:

- no puede ver:
  - ranking
  - dashboard
  - carga de pronósticos
- sí puede ver:
  - home
  - fixture

Debe quedar bloqueado tanto en UI como en backend cuando corresponda.

### 3.4 Auditoría

La auditoría ya no vive como página separada principal.

Decisión actual:

- vive integrada en `LeaderboardPage`
- se abre desde un drawer/modal por participante
- dentro del drawer se ven sus pronósticos
- puede filtrarse por etapa y grupo

### 3.5 Admin de resultados

El admin puede:

- editar resultados oficiales
- cambiar estado del partido (`scheduled`, `live`, `finished`)
- sincronizar knockout a partir de resultados oficiales

### 3.6 Knockout sync

Existe lógica de sincronización reversible para knockout.

Regla importante:

- si se prueban resultados y luego se revierten, no deben quedar partidos downstream “pegados”
- cualquier cambio relacionado debe mantener compatibilidad con esa lógica

---

## 4. Arquitectura frontend

### 4.1 Estructura general

```txt
src/
  app/
    layout/
    providers/
    router/
  assets/
  lib/
    react-query/
    supabase/
  modules/
    admin/
    audits/
    auth/
    dashboard/
    fixture/
    home/
    leaderboard/
    matches/
    predictions/
    teams/
    tournament/
  shared/
    components/
    utils/
  styles/
  main.tsx
```
