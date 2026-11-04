
import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

export async function api(path, options = {}) {
  const token = await SecureStore.getItemAsync('token');

  const isForm = options.body instanceof FormData;

  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;

  try {
    res = await fetch(API_URL + path, {
      ...options,
      headers,
    });
  } catch (e) {
    console.log('API error:', path, e);
    throw new Error(`Network error: ${e.message}`);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  return data;
}
