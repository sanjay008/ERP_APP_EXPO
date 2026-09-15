type ImageLike = {
  uri: string;
  name?: string;
  type?: string;
  [key: string]: unknown;
};

export async function compressImages<T extends ImageLike>(images: T[]): Promise<T[]> {
  return images;
}
