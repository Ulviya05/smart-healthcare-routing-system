import '@/styles/globals.css';
import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import Loading from '@/components/common/LoadingSpinner';
import axios from 'axios';
import { AuthProvider } from '../hooks/useAuth'; 

export default function App({ Component, pageProps }) {
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    axios.interceptors.request.use((config) => {
      setLoading(true);
      return config;
    });

    axios.interceptors.response.use(
      (response) => {
        setLoading(false);
        return response;
      },
      (error) => {
        setLoading(false);
        toast.error(
          error.response?.data?.message || 'An error occurred. Please try again.'
        );
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject();
      axios.interceptors.response.eject();
    };
  }, []);

  return (
    <AuthProvider>
      {isLoading && <Loading />}
      <Component {...pageProps} setLoading={setLoading}/>
      <ToastContainer position="bottom-right" />
    </AuthProvider>
  );
}



