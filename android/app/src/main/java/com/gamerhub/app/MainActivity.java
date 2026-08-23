package com.gamerhub.app;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewTreeObserver;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.PermissionRequest;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "GamerHub";
    private static final String CHANNEL_MESSAGES = "messages";
    private static final String CHANNEL_TOURNAMENTS = "tournaments";
    private static final String CHANNEL_FRIENDS = "friends";
    private static final String CHANNEL_TEAM = "team";
    private static final String CHANNEL_SYSTEM = "system";
    private static final int NOTIFICATION_PERMISSION_CODE = 1001;

    private boolean isReady = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Install splash screen BEFORE calling super — holds until first paint
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        // Keep splash visible until WebView reports meaningful paint
        splashScreen.setKeepOnScreenCondition(() -> !isReady);

        super.onCreate(savedInstanceState);

        // ── Edge-to-Edge ──────────────────────────────────────────────
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat insetsController =
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        insetsController.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );

        // Transparent system bars with light icons (contrast on dark bg)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            insetsController.setAppearanceLightStatusBars(false);
            insetsController.setAppearanceLightNavigationBars(false);
        }

        // ── WebView Tuning ───────────────────────────────────────────
        Bridge bridge = getBridge();
        WebView webView = bridge.getWebView();
        WebSettings settings = webView.getSettings();

        // Strip wv token for Google login compatibility
        String ua = settings.getUserAgentString()
                .replaceAll("; wv", "")
                .replaceAll(" wv", "")
                .replaceFirst("Version/\\d+\\.\\d+", "Version/15.0");
        settings.setUserAgentString(ua);

        // Performance & media
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        // Disable overscroll glow
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        // Prevent text zoom breaking layout (but respect font scale in body)
        settings.setTextZoom(100);

        // Hardware acceleration
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        // Disable long-press context menu on non-input elements
        webView.setOnLongClickListener(v -> true);
        webView.setLongClickable(false);

        // ── WebChromeClient for camera/mic permissions ───────────────
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    request.grant(request.getResources());
                });
            }
        });

        // ── Inject CSS env() safe-area insets into WebView ───────────
        webView.getViewTreeObserver().addOnGlobalLayoutListener(() -> {
            injectSafeAreaInsets(webView);
        });

        // ── Predictive Back ──────────────────────────────────────────
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                // Let Capacitor/WebView handle back (router history)
                // If at root, the WebView JS will handle double-tap-to-exit
                if (bridge != null && bridge.getWebView().canGoBack()) {
                    bridge.getWebView().goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        // ── Notification Channels ────────────────────────────────────
        createNotificationChannels();

        // ── Request POST_NOTIFICATIONS permission on Android 13+ ─────
        requestNotificationPermissionIfNeeded();
    }

    /**
     * Inject safe-area insets as CSS custom properties so the web layer
     * can pad content behind system bars correctly.
     */
    private void injectSafeAreaInsets(WebView webView) {
        try {
            View decorView = getWindow().getDecorView();
            WindowInsetsCompat insets = WindowInsetsCompat.toWindowInsetsCompat(decorView.getRootWindowInsets());
            int sat = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int sab = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int sar = insets.getInsets(WindowInsetsCompat.Type.systemBars()).right;
            int sal = insets.getInsets(WindowInsetsCompat.Type.systemBars()).left;
            int ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;

            String js = String.format(
                "document.documentElement.style.setProperty('--sat', '%dpx');" +
                "document.documentElement.style.setProperty('--sab', '%dpx');" +
                "document.documentElement.style.setProperty('--sar', '%dpx');" +
                "document.documentElement.style.setProperty('--sal', '%dpx');" +
                "document.documentElement.style.setProperty('--ime', '%dpx');",
                sat, sab, sar, sal, ime
            );
            webView.evaluateJavascript(js, null);
        } catch (Exception e) {
            Log.w(TAG, "Failed to inject safe-area insets", e);
        }
    }

    /**
     * Create notification channels for each category.
     */
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = getSystemService(NotificationManager.class);

        NotificationChannel messages = new NotificationChannel(
            CHANNEL_MESSAGES, "Messages",
            NotificationManager.IMPORTANCE_HIGH
        );
        messages.setDescription("Direct messages and chat notifications");
        messages.enableLights(true);
        messages.setLightColor(0xFF10B981);

        NotificationChannel tournaments = new NotificationChannel(
            CHANNEL_TOURNAMENTS, "Tournaments",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        tournaments.setDescription("Tournament updates and match results");

        NotificationChannel friends = new NotificationChannel(
            CHANNEL_FRIENDS, "Friend Requests",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        friends.setDescription("Friend requests and social notifications");

        NotificationChannel team = new NotificationChannel(
            CHANNEL_TEAM, "Team",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        team.setDescription("Team invitations and updates");

        NotificationChannel system = new NotificationChannel(
            CHANNEL_SYSTEM, "System",
            NotificationManager.IMPORTANCE_LOW
        );
        system.setDescription("System announcements and updates");

        manager.createNotificationChannels(
            java.util.Arrays.asList(messages, tournaments, friends, team, system)
        );
    }

    /**
     * Request POST_NOTIFICATIONS runtime permission on Android 13+.
     */
    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED) return;

        ActivityCompat.requestPermissions(this,
            new String[]{ Manifest.permission.POST_NOTIFICATIONS },
            NOTIFICATION_PERMISSION_CODE
        );
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Hide system bars on focus (immersive feel)
            WindowInsetsControllerCompat insetsController =
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            insetsController.hide(WindowInsetsCompat.Type.systemBars());
            insetsController.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }
    }

    /**
     * Report that the Activity has fully drawn — releases the splash screen.
     * Called from JS via Capacitor plugin or after WebView first paint.
     */
    public void reportReady() {
        isReady = true;
    }
}
