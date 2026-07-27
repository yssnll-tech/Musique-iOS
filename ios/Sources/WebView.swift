import SwiftUI
import WebKit
import UniformTypeIdentifiers

// Origine locale servie à la WebView. Un schéma personnalisé (plutôt que file://)
// donne une origine stable et traitée comme sécurisée : indispensable pour qu'IndexedDB,
// createObjectURL et la lecture audio fonctionnent de façon fiable et persistante.
private let appScheme = "app"
private let appHost = "local"
private let startURL = "\(appScheme)://\(appHost)/index.html"

struct WebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // Sert les fichiers statiques buildés (index.html + assets) via app://local/…
        config.setURLSchemeHandler(BundleSchemeHandler(), forURLScheme: appScheme)

        // Lecture audio sans geste utilisateur obligatoire + en ligne.
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        // Stockage persistant (IndexedDB, blobs) dans le conteneur de l'app.
        config.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .black
        webView.scrollView.backgroundColor = .black
        // Pas de rebond élastique : comportement d'app native.
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = false

        if let url = URL(string: startURL) {
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

/// Sert le contenu web embarqué (dossier `web/` du bundle) sous le schéma `app://`.
final class BundleSchemeHandler: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(SchemeError.badURL)
            return
        }

        // Chemin demandé, relatif à la racine du site. "/" ou vide => index.html.
        var path = url.path
        if path.isEmpty || path == "/" {
            path = "/index.html"
        }
        // Retire le / initial pour composer le chemin relatif dans le bundle.
        let relative = path.hasPrefix("/") ? String(path.dropFirst()) : path

        guard let base = resolvedBaseURL() else {
            urlSchemeTask.didFailWithError(SchemeError.notFound)
            return
        }
        let fileURL = base.appendingPathComponent(relative).standardizedFileURL

        // Garde-fou anti-traversée : le fichier doit rester sous la racine web.
        guard fileURL.path.hasPrefix(base.standardizedFileURL.path) else {
            urlSchemeTask.didFailWithError(SchemeError.forbidden)
            return
        }

        if let data = try? Data(contentsOf: fileURL) {
            respond(urlSchemeTask, url: url, data: data, mime: mimeType(for: fileURL))
            return
        }

        // Repli SPA : toute route inconnue renvoie index.html (le routage est géré
        // côté client par HashRouter, mais on reste défensif).
        let indexURL = base.appendingPathComponent("index.html")
        if let indexData = try? Data(contentsOf: indexURL) {
            respond(urlSchemeTask, url: url, data: indexData, mime: "text/html; charset=utf-8")
        } else {
            urlSchemeTask.didFailWithError(SchemeError.notFound)
        }
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    /// Localise la racine du site embarqué. Selon la façon dont Xcode copie le
    /// dossier de ressources (référence de dossier « bleue » vs contenu à plat),
    /// index.html peut être sous `web/` ou directement à la racine des ressources.
    /// Propriété calculée (et non lazy var) : les callbacks du handler peuvent
    /// arriver hors du thread principal, donc on évite tout état mutable partagé.
    private func resolvedBaseURL() -> URL? {
        guard let resources = Bundle.main.resourceURL else { return nil }
        let candidates = [
            resources.appendingPathComponent("web"),
            resources,
        ]
        for dir in candidates {
            if FileManager.default.fileExists(atPath: dir.appendingPathComponent("index.html").path) {
                return dir.standardizedFileURL
            }
        }
        return resources.appendingPathComponent("web").standardizedFileURL
    }

    private func respond(_ task: WKURLSchemeTask, url: URL, data: Data, mime: String) {
        let headers = [
            "Content-Type": mime,
            "Content-Length": String(data.count),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
        ]
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    private func mimeType(for url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "html", "htm": return "text/html; charset=utf-8"
        case "js", "mjs": return "text/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json", "map": return "application/json; charset=utf-8"
        case "svg": return "image/svg+xml"
        case "png": return "image/png"
        case "jpg", "jpeg": return "image/jpeg"
        case "webp": return "image/webp"
        case "gif": return "image/gif"
        case "ico": return "image/x-icon"
        case "woff2": return "font/woff2"
        case "woff": return "font/woff"
        case "ttf": return "font/ttf"
        case "wasm": return "application/wasm"
        default:
            if let type = UTType(filenameExtension: url.pathExtension),
               let mime = type.preferredMIMEType {
                return mime
            }
            return "application/octet-stream"
        }
    }

    enum SchemeError: Error { case badURL, notFound, forbidden }
}
