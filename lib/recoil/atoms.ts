import { atom } from 'recoil';

export interface AboutMeData {
  profile_image_url?: string;
  name: string;
  title: string;
  introduction: string;
  career?: string[];
  industry_expertise?: string[];
  area_of_expertise?: string[];
  updated_at: string;
}

export const aboutMeDataState = atom<AboutMeData | null>({
  key: 'aboutMeDataState',
  default: null,
}); 