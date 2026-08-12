# 🛠️ M-Music NPM Run Commands Reference

Here is a guide to all the available `npm` scripts defined in the project.

---

## 🚀 Running the App (Development)

These commands are used when coding locally. They run the source files directly with hot-reloading.

| Command | Command Under the Hood | Description |
| :--- | :--- | :--- |
| **`npm run dev`** | `concurrently "npm:dev:server" "npm:dev:client"` | Runs both the **Frontend** and **Backend** concurrently in development mode. |
| **`npm run dev:server`** | `tsx watch server/src/server.ts` | Runs only the **Express API backend** (reloads automatically when you save changes). |
| **`npm run dev:client`** | `vite --configLoader runner` | Runs only the **Vite React frontend** (reloads automatically with Hot Module Replacement). |

---

## 📦 Building for Production

These commands compile and bundle the source code so it is ready to be deployed to a live server.

| Command | Command Under the Hood | Description |
| :--- | :--- | :--- |
| **`npm run build`** | `npm run build:client && npm run build:server` | Compiles and bundles **both Frontend + Backend** into the `dist/` directory. |
| **`npm run build:client`** | `vite build --configLoader runner` | Compiles/bundles the React frontend into static HTML/JS/CSS under `dist/client`. |
| **`npm run build:server`** | `tsc -p tsconfig.server.json` | Compiles the TypeScript backend into runnable JavaScript under `dist/server`. |
| **`npm start`** | `node dist/server/server/src/server.js` | Starts the production Express server (which also serves the compiled frontend on the same port). |

---

## 🔍 TypeScript Type Checking

These commands validate that there are no TypeScript syntax or type compilation errors in the codebase without generating built files.

| Command | Command Under the Hood | Description |
| :--- | :--- | :--- |
| **`npm run typecheck`** | `npm run typecheck:client && npm run typecheck:server` | Validates TypeScript rules across the **entire project** (Frontend + Backend). |
| **`npm run typecheck:client`** | `tsc -p tsconfig.client.json --noEmit` | Validates TypeScript rules on the **frontend code only**. |
| **`npm run typecheck:server`** | `tsc -p tsconfig.server.json --noEmit` | Validates TypeScript rules on the **backend code only**. |
