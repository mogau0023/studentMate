# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "MathStudyApp"
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Add Firebase to your React Native app

1. In Firebase Console, click "Add app"
2. Select "Web" platform
3. Register app with nickname: "MathStudyApp"
4. Copy the configuration object

## 3. Update Firebase Configuration

Replace the placeholder values in `src/config/firebase.ts` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 4. Enable Firebase Services

### Authentication
1. Go to Firebase Console > Authentication
2. Click "Get started"
3. Enable "Email/Password" sign-in method
4. Click "Save"

### Firestore Database
1. Go to Firebase Console > Firestore Database
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your region
5. Click "Enable"

### Storage (Optional)
1. Go to Firebase Console > Storage
2. Click "Get started"
3. Choose "Start in production mode"
4. Select your region
5. Click "Done"

## 5. Firestore Security Rules

Copy and paste these rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Favorites are user-specific
    match /favorites/{favoriteId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
    
    // Progress tracking
    match /progress/{progressId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.user_id;
    }
    
    // Categories are public
    match /categories/{categoryId} {
      allow read: if true;
    }
    
    // Papers with access control
    match /papers/{paperId} {
      allow read: if true;
      allow read: if request.auth != null && 
        resource.data.is_locked == false;
    }
    
    // Questions are public if paper is accessible
    match /questions/{questionId} {
      allow read: if true;
    }
  }
}
```

## 6. Firestore Data Structure

### Categories Collection
```javascript
{
  id: "march_tests",
  name: "march_tests", 
  display_name: "March Tests",
  sort_order: 1
}
```

### Papers Collection
```javascript
{
  id: "paper_2025_march_ec",
  category_id: "march_tests",
  year: "2025",
  title: "March Test (EC)",
  is_locked: true,
  total_marks: 100,
  created_at: timestamp
}
```

### Questions Collection
```javascript
{
  id: "question_1_1_1",
  paper_id: "paper_2025_march_ec",
  question_number: "1.1.1",
  content: "x² − 7x + 10 = 0",
  marks: 2,
  sort_order: 1
}
```

### Users Collection
```javascript
{
  uid: "user123",
  email: "user@example.com",
  name: "John Doe",
  plan_type: "free",
  created_at: timestamp,
  last_active: timestamp
}
```

### Favorites Collection
```javascript
{
  id: "favorite_123",
  user_id: "user123",
  question_id: "question_1_1_1",
  created_at: timestamp
}
```

### Progress Collection
```javascript
{
  id: "progress_123",
  user_id: "user123",
  category_id: "march_tests",
  completed_questions: 15,
  total_questions: 25,
  updated_at: timestamp
}
```

## 7. Test the App

1. Run the app: `npm start`
2. Test user registration and login
3. Navigate through categories
4. View questions and answers
5. Add questions to favorites
6. Check progress tracking

## 8. Additional Features to Implement

- Math rendering with proper LaTeX support
- Video player integration
- Offline functionality
- Push notifications
- In-app purchases for premium content
- Analytics tracking