import './style.css';
import { setupMapMaker } from './components/MapMaker';

// Bootstrap the Map Maker tool
document.addEventListener('DOMContentLoaded', () => {
    setupMapMaker('mapmaker-container');
});
