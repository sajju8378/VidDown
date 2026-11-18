package com.mediadrop.app.downloader

import okhttp3.OkHttpClient
import okhttp3.RequestBody.Companion.toRequestBody
import org.schabi.newpipe.extractor.downloader.Downloader
import org.schabi.newpipe.extractor.downloader.Request
import org.schabi.newpipe.extractor.downloader.Response
import java.util.concurrent.ConcurrentHashMap

class OkHttpDownloader(private val client: OkHttpClient) : Downloader() {

    override fun execute(request: Request): Response {
        val httpMethod = request.httpMethod()
        val url = request.url()
        val headers = request.headers()
        val dataToSend = request.dataToSend()

        val body = when {
            httpMethod.equals("GET", ignoreCase = true) || httpMethod.equals("HEAD", ignoreCase = true) -> null
            dataToSend != null -> dataToSend.toRequestBody()
            httpMethod.equals("POST", ignoreCase = true) || httpMethod.equals("PUT", ignoreCase = true) -> ByteArray(0).toRequestBody()
            else -> null
        }
        val builder = okhttp3.Request.Builder().url(url)

        headers?.forEach { (key, values) ->
            values?.forEach { value ->
                builder.addHeader(key, value)
            }
        }

        builder.method(httpMethod, body)

        return client.newCall(builder.build()).execute().use { res ->
            val responseBody = res.body?.string() ?: ""
            val responseHeaders = ConcurrentHashMap<String, List<String>>()
            res.headers.toMultimap().forEach { (k, v) ->
                responseHeaders[k] = v
            }

            Response(res.code, res.message, responseHeaders, responseBody, res.request.url.toString())
        }
    }
}
