import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';

export async function generateAndDownloadProjectZip(onProgress?: (percent: number) => void): Promise<void> {
  const zip = new JSZip();

  // Add all Android project source files
  for (const file of ANDROID_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  // Add README.md for developer instructions
  const readmeContent = `# MediaDrop - Android Media Downloader (Kotlin + Jetpack Compose)

Personal Android app for intercepting shared direct media links (MP4, MP3, Images), downloading them with real-time speed & progress to a chosen Storage Access Framework (SAF) folder, with automated signed APK release via GitHub Actions.

## Quick Start in Android Studio

1. **Open Project**: Launch Android Studio (Ladybug / Koala / Hedgehog or newer) and select **Open** on this directory.
2. **JDK Version**: Ensure **JDK 17** is selected in *Settings > Build, Execution, Deployment > Build Tools > Gradle*.
3. **Build & Run**:
   \`\`\`bash
   ./gradlew assembleDebug
   \`\`\`
   Or click the green **Run** button to launch on an emulator or connected phone.

## Features Included

- **Share Target Interception**: Catches \`Intent.ACTION_SEND\` from Chrome, Twitter/X, Reddit, Telegram, WhatsApp, etc.
- **Direct Media URL Catching**: Automatically detects \`.mp4\`, \`.mp3\`, \`.m4a\`, \`.jpg\`, \`.png\`, \`.webp\` links.
- **Storage Access Framework (SAF)**: Prompts user to pick any folder on internal storage or SD card and retains persistent read/write access.
- **Live Progress & Speed**: OkHttp streaming engine with chunked progress reporting, byte count, and MB/s speed calculation.
- **Foreground Service**: Continuous downloading even when app is minimized, with notifications containing cancel controls.
- **Jetpack Compose UI**: Modern Material 3 interface with dark/light dynamic theme.
- **GitHub Actions CI/CD**: Automatic signed release APK generation on push or tag release.

## GitHub Actions Automated Signed APK Setup

1. Generate your release keystore:
   \`\`\`bash
   keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias mediadrop
   \`\`\`
2. Convert the keystore to base64:
   \`\`\`bash
   base64 -w 0 release.jks > keystore_base64.txt
   # (On macOS: base64 -i release.jks | pbcopy)
   \`\`\`
3. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions > New repository secret**:
   - \`RELEASE_KEYSTORE_BASE64\`: The full base64 string
   - \`KEYSTORE_PASSWORD\`: Your keystore password
   - \`KEY_ALIAS\`: mediadrop
   - \`KEY_PASSWORD\`: Your private key password
4. Push a git tag (e.g. \`git tag v1.0.0 && git push origin v1.0.0\`) or trigger manually in the Actions tab.
5. Download your signed APK from the GitHub Actions Artifacts or Releases page!
`;

  zip.file('README.md', readmeContent);

  // Generate the zip blob
  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(metadata.percent);
    }
  });

  // Trigger browser download
  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'MediaDrop-Android-Project.zip';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
