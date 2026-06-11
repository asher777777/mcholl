import { getMediaLibrary, addMediaToLibrary } from "./src/features/media/actions";

async function run() {
  console.log("Testing media library...");
  const res = await addMediaToLibrary("http://test.com/img.jpg", "test_image");
  console.log("Add Result:", res);
  const items = await getMediaLibrary();
  console.log("Items:", items);
}

run();
