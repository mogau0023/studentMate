# StudentMATE Admin Panel Guide

This document outlines the requirements and functionality for the **StudentMATE Admin Panel (Web App)**. The purpose of this panel is to populate the Firestore database with the necessary data (Universities, Modules, Assessments, Memos) so that the mobile app functions correctly.

## 1. Project Overview
*   **Platform**: Web Application (React.js recommended)
*   **Backend**: Firebase (Auth, Firestore, Storage)
*   **Users**: Admins only (Super Admin, University Admin)

## 2. Core Features & Screens

### 16. Admin Login Screen
*   **Purpose**: Secure access for authorized personnel only.
*   **Functionality**:
    *   Email/Password authentication via Firebase Auth.
    *   Check `admins` collection in Firestore to verify role (`superadmin` or `university_admin`).

### 17. Admin Dashboard
*   **Purpose**: High-level overview of system health.
*   **Stats to Display**:
    *   Total Users (count from `users` collection)
    *   Total Subscriptions (active users)
    *   Total Modules (count from `modules` collection)
    *   Total Revenue (estimated or from RevenueCat webhook)

### 18. Manage Universities (Super Admin Only)
*   **Purpose**: Add universities to the system.
*   **Data Fields**:
    *   Name (e.g., "University of Pretoria")
    *   Code (e.g., "UP")
    *   Logo (Upload to Firebase Storage -> save URL)
*   **Firestore Path**: `universities/{universityId}`

### 19. Upload Module Screen
*   **Purpose**: Create a module that students can add to their dashboard.
*   **Data Fields**:
    *   Module Name (e.g., "Calculus 1")
    *   Module Code (e.g., "SMTH011")
    *   University (Dropdown selection from `universities` collection)
    *   Course/Degree (Optional string)
*   **Firestore Path**: `modules/{moduleId}`

### 20. Upload Assessment (Paper/Test/Exam)
*   **Purpose**: Upload the core content students will study.
*   **Data Fields**:
    *   **Module**: Select from existing modules.
    *   **Type**: Dropdown (`practice`, `test`, `exam`, `supplementary`).
    *   **Year**: Number (e.g., 2023).
    *   **Topic**: String (Required only if Type is `practice`).
    *   **Question Paper**: File Upload (PDF) -> Firebase Storage.
*   **Firestore Path**: `assessments/{assessmentId}`

### 21. Upload Memo & Solutions
*   **Purpose**: Attach solutions to an existing assessment.
*   **Data Fields**:
    *   **Link to Assessment**: Select the assessment uploaded in step 20.
    *   **Memo**: File Upload (PDF) -> Firebase Storage.
    *   **Video Solution**: URL (YouTube/Vimeo link) or File Upload.
    *   **Points Cost**: Number (Default: 1).
*   **Firestore Update**: Update the existing document in `assessments/{assessmentId}` with `memoUrl` and `videoSolutionUrl`.

### 22. Manage Users Screen
*   **Purpose**: User oversight and moderation.
*   **Functionality**:
    *   List all users with pagination.
    *   Search by email or name.
    *   View Points Balance.
    *   View Subscription Status.
    *   **Action**: Ban User (disable account).

### 23. Analytics Screen
*   **Purpose**: Track engagement and revenue.
*   **Metrics**:
    *   Daily Active Users (DAU).
    *   Ad Revenue (if AdMob API integration exists).
    *   Subscription Growth.

### 24. Featured Modules Management
*   **Purpose**: Highlight specific modules on the mobile app home screen (if applicable) or add/remove them.
*   **Functionality**:
    *   List all modules.
    *   Toggle `isFeatured` boolean on module documents.

---

## 3. Database Structure (Firestore)

To support the above features, the database must follow this schema:

### `universities` Collection
```json
{
  "name": "University of Pretoria",
  "code": "UP",
  "logoUrl": "https://..."
}
```

### `modules` Collection
```json
{
  "code": "SMTH011",
  "name": "Calculus 1",
  "universityId": "university_doc_id",
  "isFeatured": false
}
```

### `assessments` Collection
This is the most critical collection for the app's content.
```json
{
  "universityId": "university_doc_id",
  "moduleId": "module_doc_id",
  "type": "practice" | "test" | "exam" | "supplementary",
  "topic": "Limits and Continuity", // Only for type='practice'
  "year": 2023,
  "title": "Test 1 - 2023", // Generated or manual
  "questionPaperUrl": "https://...",
  "memoUrl": "https://...", // Optional (can be added later)
  "videoSolutionUrl": "https://...", // Optional
  "createdAt": timestamp
}
```

### `users` Collection
Managed automatically by mobile app, but read by Admin Panel.
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "universityId": "university_doc_id",
  "points": 10,
  "subscriptionActive": true,
  "subscriptionExpiry": timestamp,
  "role": "student" // Default
}
```

### `admins` Collection
Manually created in Firebase Console to grant access.
```json
{
  "email": "admin@studentmate.com",
  "role": "superadmin" | "university_admin",
  "universityId": "university_doc_id" // Required if role is university_admin
}
```

### `announcements` Collection
```json
{
  "title": "Exam Season!",
  "message": "Good luck with your exams.",
  "universityId": "university_doc_id" | "all",
  "active": true,
  "createdAt": timestamp
}
```

---

## 4. Implementation Steps for Admin

1.  **Set up Firebase Project**: Ensure Auth, Firestore, and Storage are enabled.
2.  **Create Admin User**: Manually create the first admin user in Firebase Auth and add their UID to the `admins` collection in Firestore.
3.  **Build Upload Forms**: Create forms that upload files to Storage first, get the download URL, and then save the metadata to Firestore.
4.  **Data Integrity**: Ensure that when deleting a module, you prompt to delete all associated assessments to avoid orphaned data.
