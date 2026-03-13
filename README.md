# Stealth CDN Dashboard

A lightweight dashboard to manage and serve files from a GitHub repository as CDN assets via the jsDelivr network.

---

## 🚀 Key Features
* **Instant CDN Integration**: Automatically generates `jsdelivr.net` links for every file.
* **Secure Access**: Protected by password authentication and JWT session management.
* **Stealth Mode**: Filenames are automatically obfuscated during upload for extra security.
* **Modern UI**: Built with React 19, Tailwind CSS, and Framer Motion.
* **Dual View**: Choose between Grid view for images or List view for detailed management.

---

## ⚙️ Configuration

Fill your `.env` file with the following details:

| Variable | Description |
| :--- | :--- |
| `ADMIN_PASSWORD` | Password to access the dashboard. |
| `GITHUB_TOKEN` | GitHub Personal Access Token (scope: `repo`). |
| `GITHUB_OWNER` | Your GitHub username. |
| `GITHUB_REPO` | The repository name for storing files. |
| `GITHUB_BRANCH` | Branch name (e.g., `main`). |
| `JWT_SECRET` | A unique secret for login security. |

---

## 📦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the application**:
   ```bash
   npm run dev
   ```

The application will run at `http://localhost:3000`.

---

## 📖 How to Use

1. **Login**: Enter the password configured in your `.env`.
2. **Upload**: Drag & drop files into the upload area. Filenames will be randomized.
3. **Copy Link**: Click the Copy icon to grab the jsDelivr CDN URL.
4. **Manage**: You can Rename or Delete files directly from the dashboard.

---
<div align="center">
  <p>© 2026 Made With Love by <b>ramadanny</b></p>
</div>