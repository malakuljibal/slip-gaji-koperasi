package com.koperasi.slipgaji

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            useWideViewPort = true
            loadWithOverviewMode = true
        }

        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                webView.evaluateJavascript(
                    "window.print = function() { AndroidPrint.printPage(); };",
                    null
                )
            }
        }

        webView.addJavascriptInterface(WebAppInterface(this, webView), "AndroidPrint")

        webView.loadUrl("file:///android_asset/index.html")
    }

    class WebAppInterface(private val activity: MainActivity, private val webView: WebView) {
        @JavascriptInterface
        fun printPage() {
            activity.runOnUiThread {
                val printManager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                val printAdapter = webView.createPrintDocumentAdapter(activity.getString(R.string.app_name))
                val jobName = "${activity.getString(R.string.app_name)} Document"
                printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
            }
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
