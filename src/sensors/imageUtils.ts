import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_IMAGE_WIDTH = 1280;

export async function seleccionarYReducirFoto(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    return null;
  }
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    quality: 0.9,
  });
  if (picked.canceled || !picked.assets[0]) {
    return null;
  }
  const asset = picked.assets[0];
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: MAX_IMAGE_WIDTH } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return manipulated.uri;
}
