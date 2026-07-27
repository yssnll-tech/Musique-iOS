import SwiftUI

struct ContentView: View {
    var body: some View {
        // Fond noir sous la WebView : évite tout flash blanc pendant le chargement
        // et se fond dans le thème sombre de l'app.
        ZStack {
            Color.black.ignoresSafeArea()
            WebView()
                .ignoresSafeArea()
        }
    }
}
