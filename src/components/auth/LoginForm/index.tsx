import React from 'react';
import { LoginFormMain } from './LoginFormMain';

interface LoginFormProps {
  defaultEmail: string;
  onSuccess: (email: string, token: string, role: 'admin' | 'client') => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function LoginForm(props: LoginFormProps) {
  return <LoginFormMain {...props} />;
}
