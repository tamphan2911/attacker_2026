export type AdminStorageImageCategory =
  | "avatar-images"
  | "content-images"
  | "hero-slide-images"
  | "judge-images"
  | "news-images"
  | "sponsor-images";

export interface AdminStorageReference {
  label: string;
  detail?: string;
  href?: string;
}

export interface AdminStorageImageRow {
  category: AdminStorageImageCategory;
  storageKey: string;
  url: string;
  sizeBytes: number;
  updatedAt: string;
  usedBy: AdminStorageReference[];
}

export interface AdminStorageSubmissionFileRow {
  storageKey: string;
  sizeBytes: number;
  updatedAt: string;
  usedBy: AdminStorageReference[];
}
