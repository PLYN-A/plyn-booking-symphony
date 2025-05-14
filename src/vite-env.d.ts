
/// <reference types="vite/client" />
/// <reference types="@types/google.maps" />

interface Window {
  google?: {
    maps: typeof google.maps;
  }
}
