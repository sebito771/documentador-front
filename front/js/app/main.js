import { initCodeFlow } from '../features/code/code-flow.js';
import { initFileFlow } from '../features/file/file-flow.js';
import { initTabs } from '../navigation/tabs.js';
import { initZipFlow } from '../features/zip/zip-flow.js';

initTabs();
initCodeFlow();
initZipFlow();
initFileFlow();
