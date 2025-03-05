
import axios, { isAxiosError } from 'axios';

// Axios instance oluştur
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASEPATH,
});

export { isAxiosError };
export default axiosInstance;