interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }
  
  export const getFirebaseConfig = (): FirebaseConfig => {
    if (typeof window === 'undefined') {
      return {
        apiKey: 'dummy-key',
        authDomain: 'dummy-domain',
        projectId: 'dummy-project',
        storageBucket: 'dummy-bucket',
        messagingSenderId: 'dummy-id',
        appId: 'dummy-app-id'
      };
    }
  
    // Check if environment variables are available
    const config = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    };
  
    // Log the config for debugging (remove in production)
    console.log('Firebase Config:', config);
  
    // Check if any required fields are missing
    const missingFields = Object.entries(config)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
  
    if (missingFields.length > 0) {
      console.error('Missing Firebase configuration fields:', missingFields);
      return config as FirebaseConfig; // TypeScript will complain but this is handled in clientApp.ts
    }
  
    return config as FirebaseConfig;
  };