package com.gamerhub.app;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebSettings settings = getBridge().getWebView().getSettings();
        String ua = settings.getUserAgentString()
                .replaceAll("; wv", "")
                .replaceAll(" wv", "")
                .replaceFirst("Version/\\d+\\.\\d+", "Version/15.0");
        settings.setUserAgentString(ua);
    }
}