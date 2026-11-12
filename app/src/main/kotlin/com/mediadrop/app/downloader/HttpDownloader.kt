package com.mediadrop.app.downloader

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import com.mediadrop.app.data.DownloadStatus
import com.mediadrop.app.data.MediaType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.isActive
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.InputStream
import java.io.OutputStream
import java.net.URLDecoder
import java.util.concurrent.TimeUnit

data class ProbeResult(
    val fileName: String,
    val mimeType: String,
    val mediaType: MediaType,
    val contentLength: Long
)

class HttpDownloader(private val context: Context) {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .followRedirects(true)
        .followSslRedirects(true)
        .build()

    suspend fun probeUrl(url: String): ProbeResult = withContext(Dispatchers.IO) {
        val request = Request.Builder()
            .url(url)
            .head()
            .header("User-Agent", "Mozilla/5.0 (Android; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0")
            .build()

        var fileName = deriveFilename(url)
        var mimeType = "application/octet-stream"
        var contentLength = -1L

        try {
            client.newCall(request).execute().use { response ->
                contentLength = response.header("Content-Length")?.toLongOrNull() ?: -1L
                mimeType = response.header("Content-Type")?.split(";")?.firstOrNull()?.trim() ?: mimeType
                
                // Parse Content-Disposition filename if available
                response.header("Content-Disposition")?.let { cd ->
                    val nameMatch = Regex("""filename\*?=['"]?(?:UTF-8'')?([^'";]+)['"]?""", RegexOption.IGNORE_CASE).find(cd)
                    nameMatch?.groupValues?.get(1)?.let { cdName ->
                        fileName = URLDecoder.decode(cdName, "UTF-8")
                    }
                }
            }
        } catch (_: Exception) {
            // Fallback to URL path inspection
        }

        val mediaType = categorizeMediaType(mimeType, fileName)
        ProbeResult(fileName, mimeType, mediaType, contentLength)
    }

    suspend fun downloadToFile(
        url: String,
        targetDirUri: Uri,
        fileName: String,
        mimeType: String,
        onProgress: (bytesRead: Long, totalBytes: Long, speedBps: Long) -> Unit,
        isCancelled: () -> Boolean
    ): Uri = withContext(Dispatchers.IO) {
        val dir = DocumentFile.fromTreeUri(context, targetDirUri)
            ?: throw IllegalStateException("Cannot access destination directory")

        // Create target file inside user's selected SAF folder
        val targetDoc = dir.createFile(mimeType, fileName)
            ?: throw IllegalStateException("Failed to create file in selected folder")

        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "Mozilla/5.0 (Android; Mobile; rv:130.0) Gecko/130.0 Firefox/130.0")
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            targetDoc.delete()
            throw IllegalStateException("HTTP Error: ${response.code} ${response.message}")
        }

        val body = response.body ?: throw IllegalStateException("Empty HTTP response body")
        val totalBytes = body.contentLength()

        var inputStream: InputStream? = null
        var outputStream: OutputStream? = null

        try {
            inputStream = body.byteStream()
            outputStream = context.contentResolver.openOutputStream(targetDoc.uri)
                ?: throw IllegalStateException("Cannot open output stream for document")

            val buffer = ByteArray(16 * 1024) // 16KB buffer
            var bytesCopied = 0L
            var lastTime = System.currentTimeMillis()
            var bytesSinceLastCheck = 0L
            var currentSpeed = 0L

            while (coroutineContext.isActive && !isCancelled()) {
                val read = inputStream.read(buffer)
                if (read == -1) break
                outputStream.write(buffer, 0, read)
                bytesCopied += read
                bytesSinceLastCheck += read

                val now = System.currentTimeMillis()
                val delta = now - lastTime
                if (delta >= 500) { // Update speed twice per second
                    currentSpeed = (bytesSinceLastCheck * 1000) / delta
                    lastTime = now
                    bytesSinceLastCheck = 0L
                    onProgress(bytesCopied, totalBytes, currentSpeed)
                }
            }

            if (isCancelled()) {
                targetDoc.delete()
                throw IllegalStateException("Download was cancelled by user")
            }

            outputStream.flush()
            onProgress(bytesCopied, totalBytes, 0L)
            targetDoc.uri
        } catch (e: Exception) {
            targetDoc.delete()
            throw e
        } finally {
            inputStream?.close()
            outputStream?.close()
            response.close()
        }
    }

    private fun deriveFilename(url: String): String {
        return try {
            val uri = Uri.parse(url)
            val host = uri.host?.lowercase() ?: ""
            
            // Handle YouTube URLs specifically
            if (host.contains("youtube.com") || host.contains("youtu.be")) {
                val videoId = uri.getQueryParameter("v") ?: uri.lastPathSegment ?: "video"
                return "youtube_video_$videoId.mp4"
            }

            val lastPath = uri.lastPathSegment
            if (!lastPath.isNullOrBlank() && lastPath.contains(".")) {
                URLDecoder.decode(lastPath, "UTF-8")
            } else if (!lastPath.isNullOrBlank() && lastPath != "watch") {
                URLDecoder.decode(lastPath, "UTF-8") + ".mp4"
            } else {
                "media_${System.currentTimeMillis()}.mp4"
            }
        } catch (_: Exception) {
            "media_${System.currentTimeMillis()}.mp4"
        }
    }

    private fun categorizeMediaType(mimeType: String, fileName: String): MediaType {
        val lowerMime = mimeType.lowercase()
        val lowerName = fileName.lowercase()

        return when {
            lowerMime.startsWith("video/") || lowerName.endsWith(".mp4") || lowerName.endsWith(".mkv") || lowerName.endsWith(".webm") -> MediaType.VIDEO_MP4
            lowerMime.startsWith("audio/") || lowerName.endsWith(".mp3") || lowerName.endsWith(".m4a") || lowerName.endsWith(".aac") || lowerName.endsWith(".wav") || lowerName.endsWith(".ogg") -> MediaType.AUDIO_MP3
            lowerMime.startsWith("image/") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg") || lowerName.endsWith(".png") || lowerName.endsWith(".webp") || lowerName.endsWith(".gif") -> MediaType.IMAGE
            else -> MediaType.GENERIC
        }
    }
}
