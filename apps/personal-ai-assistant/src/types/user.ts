export interface UserProfile {
  uid: string;
  email: string;
  apiKeys: {
    openai?: string;
    anthropic?: string;
    serper?: string;
    tavily?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
} 