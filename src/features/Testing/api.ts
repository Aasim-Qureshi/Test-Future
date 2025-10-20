import { api } from "../../shared/utils/api";


export const addEquipmentReport = async (
  baseData: any,
  excelFile: File,
  pdfFiles: File[]
) => {
  const formData = new FormData();
  formData.append("baseData", JSON.stringify(baseData));
  formData.append("excel", excelFile);
  pdfFiles.forEach(file => formData.append('pdfs', file));

  try {
    const response = await api.post("/scripts/equip/fillForm", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding report:", error);
    throw new Error("Error adding report");
  }
};

export const getAllAssets = async () => {
  try {
    const response = await api.get("/scripts/equip/assets");
    return response.data;
  } catch (error) {
    console.error("Error getting assets:", error);
    throw new Error("Error getting assets");
  }
};

export const uploadAssetsToDB = async (reportId: string, excelFile: File) => {
  const formData = new FormData();
  formData.append("reportId", reportId);
  formData.append("excel", excelFile);

  try {
    const response = await api.post("/scripts/equip/extractData", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading assets to DB:", error);
    throw new Error("Error uploading assets to DB");
  }
};

export const withFormUploadHalfReportToDB = async (formData: any, excelFile: File, pdfFiles: File[]) => {
  const formData2 = new FormData();
  formData2.append("formData", JSON.stringify(formData));
  formData2.append("excel", excelFile);
  pdfFiles.forEach(file => formData2.append('pdfs', file));

  try {
    const response = await api.post("/scripts/equip/withFormExtract", formData2, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error adding report:", error);
    throw new Error("Error adding report");
  }
};

export const addAssetsToReport = async (reportId: string) => {
  try {
    const response = await api.post("/scripts/equip/addAssets", {reportId});
    return response.data;
  } catch (error) {
    console.error("Error adding assets to report:", error);
    throw new Error("Error adding assets to report");
  }
};

export const checkAssets = async (reportId: string) => {
  try {
    const response = await api.post("/scripts/equip/check", {reportId});
    return response.data;
  } catch (error) {
    console.error("Error checking assets:", error);
    throw new Error("Error checking assets");
  }
};

export const getReportsData = async () => {
  try {
    const response = await api.get("/scripts/equip/reports");
    return response.data;
  } catch (error) {
    console.error("Error getting reports data:", error);
    throw new Error("Error getting reports data");
  }
};

export const extractReportData = async (excel: File, pdfs: File[]) => {
  const formData = new FormData();
  formData.append("excel", excel);
  pdfs.forEach((file) => formData.append("pdfs", file));

  try {
    const response = await api.post("/scripts/equip/reportDataExtract", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error extracting report data:", error);
    throw new Error("Error extracting report data");
  }
};

// ============ Taqeem Authentication ============

export const taqeemLogin = async (email: string, password: string, otp?: string) => {
  try {
    const response = await api.post('/scripts/equip/login', {
      email: email.trim(),
      password: password.trim(),
      otp: otp?.trim(), 
    });
    return response.data;
  } catch (error) {
    throw new Error('Error logging in');
  }
};

// ============ DEPRECATED HTTP APIs (Kept for fallback) ============
// These are now handled via Socket.IO in the component
// But kept here for backwards compatibility or testing

export const checkMacros = async (id: string, tabsNum: number) => {
  try {
    const response = await api.post("/scripts/equip/check", {id, tabsNum});
    return response.data;
  } catch (error) {
    console.error("Error checking assets:", error);
    throw new Error("Error checking assets");
  }
};

export const retryMacros = async (id: string, tabsNum: number) => {
  try {
    const response = await api.post("/scripts/equip/retry", {id, tabsNum});
    return response.data;
  } catch (error) {
    console.error("Error retrying assets:", error);
    throw new Error("Error retrying assets");
  }
};

export const halfReportSubmit = async (id: string, tabsNum: number) => {
  try {
    const response = await api.post("/scripts/equip/fillForm2", {id, tabsNum});
    return response.data;
  } catch (error) {
    console.error("Error submitting report:", error);
    throw new Error("Error submitting report");
  }
};

// Control APIs - These can still be used if not using socket
export const stop = async (id: string) => {
  try {
    const response = await api.post("/scripts/equip/stop", {id});
    return response.data;
  } catch (error) {
    console.error("Error stopping assets:", error);
    throw new Error("Error stopping assets");
  }
};

export const pause = async (id: string) => {
  try {
    const response = await api.post("/scripts/equip/pause", {id});
    return response.data;
  } catch (error) {
    console.error("Error pausing assets:", error);
    throw new Error("Error pausing assets");
  }
};

export const resume = async (id: string) => {
  try {
    const response = await api.post("/scripts/equip/resume", {id});
    return response.data;
  } catch (error) {
    console.error("Error resuming assets:", error);
    throw new Error("Error resuming assets");
  }
};