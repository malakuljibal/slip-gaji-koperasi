package com.koperasi.slipgaji

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.io.OutputStream
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private val PERMISSION_REQUEST_CODE = 101

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        checkPermissions()

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

    private fun checkPermissions() {
        val permissions = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            permissions.add(Manifest.permission.BLUETOOTH_CONNECT)
            permissions.add(Manifest.permission.BLUETOOTH_SCAN)
        } else {
            permissions.add(Manifest.permission.BLUETOOTH)
            permissions.add(Manifest.permission.BLUETOOTH_ADMIN)
            permissions.add(Manifest.permission.ACCESS_FINE_LOCATION)
        }

        val needed = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (needed.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toTypedArray(), PERMISSION_REQUEST_CODE)
        }
    }

    class WebAppInterface(private val activity: MainActivity, private val webView: WebView) {

        private var bluetoothSocket: BluetoothSocket? = null
        private var outputStream: OutputStream? = null

        @JavascriptInterface
        fun printPage() {
            activity.runOnUiThread {
                val printManager = activity.getSystemService(Context.PRINT_SERVICE) as PrintManager
                val printAdapter = webView.createPrintDocumentAdapter(activity.getString(R.string.app_name))
                val jobName = "${activity.getString(R.string.app_name)} Document"
                printManager.print(jobName, printAdapter, PrintAttributes.Builder().build())
            }
        }

        @SuppressLint("MissingPermission")
        @JavascriptInterface
        fun getPairedBluetoothDevices(): String {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter() ?: return "[]"
            if (!bluetoothAdapter.isEnabled) {
                return "[]"
            }
            try {
                val pairedDevices: Set<BluetoothDevice>? = bluetoothAdapter.bondedDevices
                val jsonList = mutableListOf<String>()
                pairedDevices?.forEach { device ->
                    val name = device.name ?: "Unknown Device"
                    val address = device.address
                    jsonList.add("{\"name\":\"$name\",\"address\":\"$address\"}")
                }
                return "[${jsonList.joinToString(",")}]"
            } catch (e: Exception) {
                return "[]"
            }
        }

        @SuppressLint("MissingPermission")
        @JavascriptInterface
        fun connectBluetoothDevice(address: String): Boolean {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter() ?: return false
            try {
                disconnectBluetooth()
                val device = bluetoothAdapter.getRemoteDevice(address)
                val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // SPP UUID
                bluetoothSocket = device.createRfcommSocketToServiceRecord(uuid)
                bluetoothSocket?.connect()
                outputStream = bluetoothSocket?.outputStream
                activity.runOnUiThread {
                    Toast.makeText(activity, "Terhubung ke printer Bluetooth!", Toast.LENGTH_SHORT).show()
                }
                return true
            } catch (e: Exception) {
                e.printStackTrace()
                activity.runOnUiThread {
                    Toast.makeText(activity, "Gagal terhubung ke printer: ${e.message}", Toast.LENGTH_LONG).show()
                }
                return false
            }
        }

        @JavascriptInterface
        fun sendRawBytes(bytesBase64: String): Boolean {
            return try {
                val bytes = android.util.Base64.decode(bytesBase64, android.util.Base64.DEFAULT)
                outputStream?.write(bytes)
                outputStream?.flush()
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        @JavascriptInterface
        fun disconnectBluetooth() {
            try {
                outputStream?.close()
                bluetoothSocket?.close()
                outputStream = null
                bluetoothSocket = null
            } catch (e: Exception) {
                e.printStackTrace()
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
