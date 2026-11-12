package com.mediadrop.app.data

enum class DownloadStatus {
    IDLE,
    PROBING,
    QUEUED,
    DOWNLOADING,
    PAUSED,
    COMPLETED,
    FAILED,
    CANCELLED
}

enum class MediaType {
    VIDEO_MP4,
    AUDIO_MP3,
    IMAGE,
    DOCUMENT,
    GENERIC
}

data class DownloadItem(
    val id: String,
    val originalUrl: String,
    val fileName: String,
    val mediaType: MediaType,
    val mimeType: String,
    val totalBytes: Long = 0L,
    val downloadedBytes: Long = 0L,
    val progress: Float = 0f,
    val speedBytesPerSec: Long = 0L,
    val status: DownloadStatus = DownloadStatus.IDLE,
    val destinationFolderUri: String? = null,
    val savedFileUri: String? = null,
    val errorMessage: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)
