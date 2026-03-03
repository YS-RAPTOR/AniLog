package io.github.ys_raptor.anilog

import android.os.Bundle
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import java.util.Locale
import kotlin.math.max

class MainActivity : TauriActivity() {
  private data class SafeAreaInsets(
    val top: Int,
    val right: Int,
    val bottom: Int,
    val left: Int,
    val bottomStatic: Int,
  )

  private var webView: WebView? = null
  private var safeAreaInsets: SafeAreaInsets? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    val rootView = window.decorView
    ViewCompat.setOnApplyWindowInsetsListener(rootView) { _, insets ->
      val systemInsets = insets.getInsets(
        WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout(),
      )
      val imeInsets = insets.getInsets(WindowInsetsCompat.Type.ime())

      safeAreaInsets = SafeAreaInsets(
        top = systemInsets.top,
        right = systemInsets.right,
        bottom = max(systemInsets.bottom, imeInsets.bottom),
        left = systemInsets.left,
        bottomStatic = systemInsets.bottom,
      )

      applySafeAreaCssInsets()
      insets
    }

    ViewCompat.requestApplyInsets(rootView)
  }

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webView = webView

    ViewCompat.requestApplyInsets(window.decorView)
    applySafeAreaCssInsets()
  }

  private fun toCssPx(rawPixels: Int): Float {
    return rawPixels / resources.displayMetrics.density
  }

  private fun applySafeAreaCssInsets() {
    val currentWebView = webView ?: return
    val currentInsets = safeAreaInsets ?: return

    val top = toCssPx(currentInsets.top)
    val right = toCssPx(currentInsets.right)
    val bottom = toCssPx(currentInsets.bottom)
    val left = toCssPx(currentInsets.left)
    val bottomStatic = toCssPx(currentInsets.bottomStatic)
    val imeHeight = bottom - bottomStatic
    val fmt = "%.2f"

    val script = """
      (function() {
        const root = document.documentElement;
        if (!root) return;
        root.style.setProperty('--android-safe-area-top', '${String.format(Locale.US, fmt, top)}px');
        root.style.setProperty('--android-safe-area-right', '${String.format(Locale.US, fmt, right)}px');
        root.style.setProperty('--android-safe-area-bottom', '${String.format(Locale.US, fmt, bottom)}px');
        root.style.setProperty('--android-safe-area-left', '${String.format(Locale.US, fmt, left)}px');
        root.style.setProperty('--android-safe-area-bottom-static', '${String.format(Locale.US, fmt, bottomStatic)}px');
        window.dispatchEvent(new CustomEvent('keyboard-visibility-change', {
          detail: {
            imeVisible: ${imeHeight > 0},
            imeHeightCssPx: ${String.format(Locale.US, fmt, imeHeight)}
          }
        }));
      })();
    """.trimIndent()

    currentWebView.post { currentWebView.evaluateJavascript(script, null) }
  }
}
