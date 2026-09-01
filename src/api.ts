// URL de tu backend en Render
const API_URL = 'https://staffhub-o3d9.onrender.com';

export const getTasks = async () => {
  try {
    const response = await fetch(`${API_URL}/api/tasks`);
    const data = await response.json();
    console.log('Tareas obtenidas del backend:', data);
    return data;
  } catch (error) {
    console.error('Error conectando al backend:', error);
    return [];
  }
};
