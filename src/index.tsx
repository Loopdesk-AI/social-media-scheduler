import { render } from 'react-dom';
import { App } from './App';
import './index.css';
import { ThemeProvider } from './lib/ThemeContext';

render(
	<ThemeProvider>
		<App />
	</ThemeProvider>,
	document.getElementById('root')
);