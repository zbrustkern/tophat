interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  }
  
  const configs: { [key: string]: FirebaseConfig } = {
    production: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    },
    staging: {
      // Your current project's config
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_STAGING_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_STAGING_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_STAGING_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STAGING_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_STAGING_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_STAGING_APP_ID!,
    },
  };
  
  export const getFirebaseConfig = () => {
    const environment = process.env.NEXT_PUBLIC_FIREBASE_ENVIRONMENT || 'staging';
    return configs[environment];
  };