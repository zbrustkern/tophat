interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getFirebaseConfig = (): FirebaseConfig => {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    // Return a dummy config for server-side rendering
    return {
      apiKey: 'dummy-key',
      authDomain: 'dummy-domain',
      projectId: 'dummy-project',
      storageBucket: 'dummy-bucket',
      messagingSenderId: 'dummy-id',
      appId: 'dummy-app-id'
    };
  }

  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    throw new Error('Firebase configuration is missing');
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
  };
};