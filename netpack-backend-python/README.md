# NetPack Logistics Python Backend (FastAPI + SQLite)

Welcome to the Python backend for **NetPack Logistics**. This backend replaces the original Node.js/Express service, running natively with your installed **Python 3.14** and using **SQLite** (zero external database configuration required).

---

## 🚀 Quick Start

### 1. Running the Python Server
Open a terminal in `netpack-backend-python` and activate the virtual environment:
```powershell
cd "c:\Users\Postronix\Desktop\netpack logistic integration\netpack-backend-python"
.venv\Scripts\activate
python main.py
```
Or simply double-click **`run_backend.bat`** in the project root!

The server runs at: **`http://localhost:8000`**
Interactive Swagger API documentation: **`http://localhost:8000/docs`**

---

## 🔑 Default Seeded Credentials

* **Admin Email**: `admin@example.com`
* **Admin Password**: `Admin@123`
* **Role**: `ADMIN`

To re-seed or reset the database at any time:
```powershell
python seed.py
```

---

## 🔌 Connecting the React Admin UI

The React admin dashboard in `react-netpack-admin-main` has been configured to connect to this Python backend.
1. Install Node.js LTS (if not already installed):
   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```
2. In `react-netpack-admin-main/react-netpack-admin-main`:
   ```powershell
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` and log in with `admin@example.com` / `Admin@123`.

---

## 🧩 How to Integrate Your Future Python Projects

Because this backend is 100% Python, you can directly import your custom Python scripts, data science pipelines, AI/ML models, or third-party logistics APIs.

### Example: Adding a New Python Module or Endpoint
1. Create your custom script or class in a new folder, e.g. `services/my_custom_project.py`:
   ```python
   # services/my_custom_project.py
   def run_custom_analysis(shipment_data):
       # Your custom Python code here
       return {"result": "success", "processed": len(shipment_data)}
   ```

2. Expose it in a new router or in `main.py`:
   ```python
   from services.my_custom_project import run_custom_analysis

   @app.post("/api/custom-analysis")
   def custom_analysis_endpoint(data: dict):
       return run_custom_analysis(data)
   ```

3. View and test it instantly in **`http://localhost:8000/docs`**!

---

## 📁 Project Structure

```
netpack-backend-python/
├── config.py             # Configuration (ports, JWT secrets, database path)
├── database.py           # SQLAlchemy 2.0 engine & SessionLocal
├── main.py               # FastAPI entrypoint, CORS & router registrations
├── seed.py               # Database seeder (Admin, Roles, Surcharges, Rates, Countries)
├── test_api.py           # Automated test suite (verifies 10 core workflows)
├── netpack.db            # SQLite database file
├── models/               # SQLAlchemy models (User, Customer, Enquiry, Shipment, Rate, MAWB, etc.)
├── schemas/              # Pydantic validation schemas
├── services/             # Rating engine, HAWB generator, Excel manifests, Auth
├── routers/              # REST routers matching all React frontend endpoints
└── uploads/              # Local storage for MAWB documents and files
```
