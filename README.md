# CEiVoice

**AI-Enhanced Support Ticket Management System**

## Project Summary

CEiVoice is an AI-enhanced Support Ticket Management System designed to streamline and automate the initial processing of user support requests. The system allows users to submit issues through a simple form requiring only an email address and a message. Using Artificial Intelligence, CEiVoice analyzes each request and automatically generates a structured draft ticket, including a suggested title, category, summary, resolution path, and appropriate assignee.

By automating categorization and assignment, CEiVoice enables administrators and support staff to focus on problem resolution rather than manual sorting. The system supports the full ticket lifecycle, from draft consolidation and submission to resolution, communication, and reporting. The ultimate goal is to improve support efficiency and enhance communication between users and the support team.

---

## System Workflow Overview

### 1. Ticket Initiation (User)

* **Submission**: Users submit support requests through a simplified form containing only their email and a description of the issue.
* **Capture**: CEiVoice receives the request and prepares it for automated processing.

---

### 2. AI Automated Processing (System)

* **Intelligent Analysis**: AI analyzes the message content to determine intent, urgency, and context.
* **Draft Ticket Generation**: The system automatically creates a draft ticket with:

  * A concise **Title** and **Summary**
  * An appropriate **Category**
  * A suggested **Solution / Resolution Path**
  * The most suitable **Assignee**

---

### 3. Administrative Management (Support Staff)

* **Review & Consolidation**: Administrators review AI-generated drafts. Related requests can be consolidated into a single **mass-issue ticket**.
* **Activation**: Approved drafts are submitted into the active ticket lifecycle.
* **Lifecycle Management**:

  * Status updates (Open, In Progress, Resolved)
  * Team collaboration and reassignment
  * Ongoing ticket monitoring

---

### 4. Resolution & Optimization (System)

* **User Communication**: The system facilitates continuous communication with users until issues are resolved.
* **Reporting & Analytics**: Built-in reporting tools analyze support performance, identify trends, and help improve future response efficiency.


# Setup
```
create .env file in backend and frontend(.env file)
.env (backend)
host=localhost
user=root
password=CEiAdmin0
database=ceidb
RECAPTCHA_SECRET_KEY=6LeQBlssAAAAAA1WUVxPRNRIJ0DvJEoo1F6rALBR
GOOGLE_CLIENT_ID = 618947792486-r6e8k3bib6dgm47c4i5di5ekvasc3r08.apps.googleusercontent.com
api_key=AIzaSyD7PDEFM3PSnfRt-g9OsGSuHmtwo7WXklw

EMAIL_USER=ceivoice.team@gmail.com
EMAIL_PASS=tuuc kcjy qpyl dwgs
--------------------------------------------------------------
.env (frontend)
REACT_APP_API_URL=http://localhost:5001/api
```

install in backend:
- npm install dotenv
- npm install multer
- npm install bcrypt
- npm install axios
- npm install google-auth-library
- npm install nodemailer
install in frontend:
- npm install
- npm install @react-oauth/google
- npm install react-google-recaptcha
- npm install react-icons/fi
- npm install jwt-decode
Must install these:
- react ver 18.3.1
```
cd database
docker-compose -f db-compose-dev.yml up
cd backend
node server.js
```

new terminal:
```
cd frontend
npm install
npm run dev
 or
npm start
```

new terminal:
```
cd backend
npm install
node server.js
```
