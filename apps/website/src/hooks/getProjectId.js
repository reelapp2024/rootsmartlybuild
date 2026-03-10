// utils/getProjectId.js
export const getProjectId = () => {
  // return localStorage.getItem('projectId') || import.meta.env.VITE_PROJECT_ID;
  return  import.meta.env.VITE_PROJECT_ID;
};