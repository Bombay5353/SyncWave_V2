package com.syncwave.ai;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Ensure web content respects system insets so status bar (charging/clock/battery) does not overlap UI
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
