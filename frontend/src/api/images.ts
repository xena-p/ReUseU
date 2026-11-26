import axiosInstance from './axiosInstance';

/** Turns a stored image path into a full URL. Also handles old "uploads\\x.jpg" paths. */
export const imageUrl = (path?: string): string | null => {
  if (!path) return null;
  const filename = path.split(/[\\/]/).pop();
  if (!filename) return null;
  return `${axiosInstance.defaults.baseURL}/uploads/${encodeURIComponent(filename)}`;
};