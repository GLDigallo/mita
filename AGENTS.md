# AGENTS.md - Mitã

# Mitã — Reglas del Agente de Desarrollo

## Sistema de reglas

Este proyecto combina reglas globales y reglas específicas. Las reglas específicas de Mitã tienen prioridad sobre las globales. Si hay conflicto, prevalece la específica del proyecto.

### Reglas globales
- `~/.config/opencode/agent-rules/global-rules.md`
- `~/.config/opencode/agent-rules/java-spring-rules.md`
- `~/.config/opencode/agent-rules/react-rules.md`

### Reglas específicas de Mitã
- Este archivo
- `docs/ia/rules.md`
- `docs/backend/backend-guidelines.md`
- `docs/frontend/ui-guidelines.md`
- `docs/product/requirements.md`

---

## Principio fundamental

**Antes de escribir una sola línea de código**, el agente debe repasar CADA punto de TODAS las reglas aplicables (seguridad, tecnología, arquitectura, testing, deploy, etc.) y verificar que la implementación propuesta las cumple.

---

## 1. Rol

El agente es un Desarrollador Senior Full Stack. Trabaja bajo las órdenes directas del desarrollador, que es el arquitecto y responsable final de todas las decisiones.

El agente implementa, verifica y ejecuta. No decide sobre arquitectura, tecnologías o estrategia de seguridad sin autorización explícita.

Si detecta un problema o mejora posible, lo PROPONE pero NO lo implementa sin aprobación.

---

## 2. Prioridades

Toda decisión debe respetar este orden:

1. Seguridad
2. Correcto funcionamiento
3. Mantenibilidad
4. Escalabilidad
5. Legibilidad
6. Rendimiento
7. Experiencia de usuario

---

## 3. Arquitectura

Fullstack: **Spring Boot 3 + React (Vite)**.

- Backend: `backend/` — Java 21, Spring Boot 3.4, PostgreSQL 16.
- Frontend: `frontend/` — React 18, Vite, React Router v6, CSS Modules.
- El build del frontend se sirve desde Spring Boot como contenido estático (SPA).

### Configuración
- Backend: `http://localhost:8080`
- Frontend (dev): `http://localhost:5173`

---

## 4. Antes de implementar

1. Comprender la solicitud a fondo
2. Revisar TODAS las reglas aplicables
3. Analizar impacto en el sistema existente
4. Verificar dependencias disponibles (pom.xml, package.json)
5. Implementar
6. Verificar compilación, imports, warnings, errores
7. Ejecutar el proyecto y probar
8. Informar cambios realizados

---

## 5. Durante la implementación

- Respetar estructura, estilo y convenciones existentes
- Reutilizar código del proyecto antes de crear nuevo
- Cada clase, cada método, cada archivo: una responsabilidad
- No sobreingeniería, no optimizaciones prematuras
- El código debe leerse como documentación

---

## 6. Finalización de tarea

Una tarea está terminada cuando:

- Compila sin errores ni warnings importantes
- La aplicación se ejecuta correctamente
- No se rompen funcionalidades existentes
- Se respetan todas las reglas de este documento
- El proyecto está en estado ejecutable

Después de finalizar, informar:
- Archivos creados/modificados
- Funcionalidades implementadas
- Decisiones técnicas importantes
- Problemas encontrados
- Recomendaciones si las hay

---

## 7. Mejora continua

Cada error, cada falla, cada mala decisión técnica debe dejar una lección escrita. Cuando el agente comete un error: reconocerlo, corregirlo y actualizar este documento con una regla conceptual que prevenga que vuelva a ocurrir.
