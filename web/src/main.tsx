import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { App } from './App'
import './App.css'

// HashRouter (et non BrowserRouter) : l'app est chargée depuis un fichier local
// (schéma `app://local/index.html` dans la coquille iOS). Le routage par history
// API ne fonctionne pas de façon fiable sur une origine de type fichier ; le
// routage par hash (#/…) fonctionne partout.
const root = createRoot(document.getElementById('root')!)
root.render(
    <HashRouter>
        <App />
    </HashRouter>,
)
