export const UTEC_LAT = -12.1219;
export const UTEC_LNG = -77.0282;

export const LIMA_BOUNDS = {
  southWest: { lat: -12.5, lng: -77.2 },
  northEast: { lat: -11.7, lng: -76.8 },
} as const;

export const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
export const OSM_TILE_URL =
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const UTEC_EMAIL_DOMAIN = "@utec.edu.pe";
export const DEFAULT_SEARCH_RADIUS_KM = 3.0;
export const MATCH_TIME_WINDOW_MINUTES = 30;

export const DAYS_OF_WEEK = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const CAREERS = [
  "Ingeniería Civil",
  "Ingeniería de Sistemas",
  "Ingeniería Industrial",
  "Ingeniería Mecatrónica",
  "Ingeniería Eléctrica",
  "Ingeniería Electrónica",
  "Ingeniería Ambiental",
  "Ingeniería Química",
  "Ingeniería de Minas",
  "Administración y Negocios Digitales",
  "Arquitectura",
  "Ciencias de la Computación",
] as const;
