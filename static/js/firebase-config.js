// Firebase Web App configuration
export const firebaseConfig = {
  apiKey: "AIzaSyANiiA9Dv8SQQIUOfjpUiDo0S3ompHEzT8",
  authDomain: "ai-health-companion-51ce1.firebaseapp.com",
  projectId: "ai-health-companion-51ce1",
  storageBucket: "ai-health-companion-51ce1.firebasestorage.app",
  messagingSenderId: "801683565639",
  appId: "1:801683565639:web:88f3e74996b827de851562"
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);