import axios from "axios";
import { envConf } from "./envConf";

const axiosInstance = axios.create({
  baseURL: `${envConf.VITE_API_URL}/api/v1` || "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies in request
  timeout: 10000, // Set a timeout for requests
});

export default axiosInstance;
