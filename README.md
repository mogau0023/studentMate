# Math Study App

A React Native mobile application for high school students to practice mathematics exam questions, access past papers, and track their learning progress.

## Features

- 📚 **Study Categories**: Organized access to different types of math content (Notes, Quiz Tests, Activities, Practice Problems, March Tests, June Exams, Preliminary Exams, November Exams)
- 🔍 **Question Viewer**: Interactive display of math problems with expandable answers and video solutions
- 📄 **Paper Browser**: Year-based navigation to past exam papers with locked/unlocked status
- ❤️ **Favorites**: Save important questions for quick access
- 📊 **Progress Tracker**: Study statistics and completion tracking
- 🔐 **User Authentication**: Secure login and registration with Firebase Auth
- 📱 **Mobile-First Design**: Optimized for smartphone screens with touch-friendly interface

## Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Navigation**: React Navigation
- **Icons**: Lucide React Native
- **Math Rendering**: react-native-math-view
- **Video Player**: expo-av

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Firebase account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MathStudyApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   
   Follow the detailed instructions in `firebase-setup.md` to:
   - Create a Firebase project
   - Configure authentication
   - Set up Firestore database
   - Configure security rules
   - Add sample data

4. **Update Firebase configuration**
   
   Replace the placeholder values in `src/config/firebase.ts` with your actual Firebase configuration.

5. **Run the app**
   ```bash
   npm start
   ```

## Project Structure

```
MathStudyApp/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (AuthContext)
│   ├── navigation/         # Navigation configuration
│   ├── screens/           # App screens
│   │   ├── auth/         # Authentication screens
│   │   └── ...           # Other screens
│   ├── config/            # Firebase configuration
│   └── utils/             # Utility functions
├── scripts/               # Setup and utility scripts
└── firebase-setup.md      # Detailed Firebase setup instructions
```

## Screens

### Authentication
- **Login**: User authentication with email and password
- **Register**: New user registration with name, email, and password

### Main App
- **Dashboard**: Navigation hub with study categories and welcome banner
- **Paper Browser**: Browse exam papers by year with lock/unlock status
- **Question Viewer**: View individual questions with expandable answers and video solutions
- **Favorites**: Saved questions for quick access
- **Progress Tracker**: Study statistics and completion tracking

## Data Model

### Collections
- **users**: User profiles and authentication data
- **categories**: Study category definitions
- **papers**: Exam papers with metadata
- **questions**: Individual math questions
- **answers**: Step-by-step solutions
- **favorites**: User's saved questions
- **progress**: User's study progress tracking

## Security Rules

The app implements Firebase security rules to:
- Protect user data (users can only access their own data)
- Control access to locked content
- Secure favorites and progress tracking
- Allow public read access to categories and questions

## Development

### Running the app
```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS (requires macOS)
npm run ios

# Run on web
npm run web
```

### Building for production
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Features to Add

- [ ] Math rendering with LaTeX support
- [ ] Video player integration for solutions
- [ ] Offline functionality
- [ ] Push notifications for study reminders
- [ ] In-app purchases for premium content
- [ ] Analytics and crash reporting
- [ ] Dark mode support
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@mathstudyapp.com or join our Slack channel.