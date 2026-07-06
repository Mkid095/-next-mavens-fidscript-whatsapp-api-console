import React from 'react';
import { RegisterFormMain } from './RegisterFormMain';

interface RegisterFormProps {
  onSuccess: (token: string) => void;
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function RegisterForm(props: RegisterFormProps) {
  return <RegisterFormMain {...props} />;
}
