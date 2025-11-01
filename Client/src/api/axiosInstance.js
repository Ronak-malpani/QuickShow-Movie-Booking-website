import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL, 
});

export default API;
