import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000",
});

export const uploadInvoices = async (files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await apiClient.post("/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getInvoices = async () => {
  const response = await apiClient.get("/documents");
  return response.data;
};

export const getInvoice = async (id) => {
  const response = await apiClient.get(`/documents/${id}`);
  return response.data;
};

export const updateInvoice = async (id, payload) => {
  const response = await apiClient.put(`/documents/${id}`, payload);
  return response.data;
};

export const reprocessInvoice = async (id) => {
  const response = await apiClient.post(`/reprocess/${id}`);
  return response.data;
};
