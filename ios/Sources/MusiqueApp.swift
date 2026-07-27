import SwiftUI

@main
struct MusiqueApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                // L'app gère elle-même les zones sûres (safe areas) côté web via
                // env(safe-area-inset-*), donc on laisse la WebView occuper tout l'écran.
                .ignoresSafeArea()
                .preferredColorScheme(.dark)
                .statusBarHidden(false)
        }
    }
}
