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
        fun connectBluetoothDevice(address: String) {
            Thread {
                val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
                if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled) {
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Bluetooth tidak aktif!", Toast.LENGTH_SHORT).show()
                        webView.evaluateJavascript("if (typeof onBtDisconnected === 'function') onBtDisconnected('Bluetooth tidak aktif');", null)
                    }
                    return@Thread
                }
                try {
                    disconnectBluetooth()
                    val device = bluetoothAdapter.getRemoteDevice(address)
                    val uuid = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB") // SPP UUID
                    bluetoothAdapter.cancelDiscovery()
                    val socket = device.createRfcommSocketToServiceRecord(uuid)
                    socket.connect()
                    bluetoothSocket = socket
                    outputStream = socket.outputStream
                    val devName = device.name ?: address
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Terhubung ke $devName!", Toast.LENGTH_SHORT).show()
                        webView.evaluateJavascript("if (typeof onBtConnected === 'function') onBtConnected('$devName');", null)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    val errMsg = e.message ?: "Gagal konek"
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Gagal terhubung: $errMsg", Toast.LENGTH_LONG).show()
                        webView.evaluateJavascript("if (typeof onBtDisconnected === 'function') onBtDisconnected('$errMsg');", null)
                    }
                }
            }.start()
        }

        @JavascriptInterface
        fun isBluetoothConnected(): Boolean {
            return bluetoothSocket != null && bluetoothSocket!!.isConnected
        }

        @JavascriptInterface
        fun sendRawBytes(bytesBase64: String): Boolean {
            return try {
                if (outputStream == null || bluetoothSocket == null || !bluetoothSocket!!.isConnected) {
                    activity.runOnUiThread {
                        Toast.makeText(activity, "Printer Bluetooth belum terhubung!", Toast.LENGTH_SHORT).show()
                    }
                    return false
                }
                val bytes = android.util.Base64.decode(bytesBase64, android.util.Base64.DEFAULT)
                outputStream?.write(bytes)
                outputStream?.flush()
                activity.runOnUiThread {
                    Toast.makeText(activity, "Berhasil mencetak ke printer!", Toast.LENGTH_SHORT).show()
                }
                true
            } catch (e: Exception) {
                e.printStackTrace()
                activity.runOnUiThread {
                    Toast.makeText(activity, "Gagal mencetak: ${e.message}", Toast.LENGTH_LONG).show()
                }
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
