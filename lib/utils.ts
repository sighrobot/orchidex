import { IBM_Plex_Sans } from 'next/font/google';

export async function fetchJson<T>(url: string): Promise<T[]> {
  return fetch(url).then((res) => res.json());
}

export const ibmPlexSans = IBM_Plex_Sans({
  display: 'swap',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['300', '400'],
});

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
