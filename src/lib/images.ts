
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1024;

export async function compressAndSavePhoto(
  uri: string,
  width?: number
): Promise<string> {
  // 1. Resize if needed and re-encode as JPEG at 70% quality.
  const context = ImageManipulator.manipulate(uri);

  if (!width || width > MAX_WIDTH) {
    context.resize({ width: MAX_WIDTH });
  }

  const image = await context.renderAsync();

  const result = await image.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
  });

  // 2. Copy from temporary cache into permanent app storage.
  const folder = new Directory(Paths.document, 'listing-photos');

  if (!folder.exists) {
    folder.create({ intermediates: true, idempotent: true });
  }

  const destination = new File(folder, `photo-${Date.now()}.jpg`);

  await new File(result.uri).copy(destination);

  return destination.uri;
}
