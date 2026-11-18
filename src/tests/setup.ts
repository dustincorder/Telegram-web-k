import {installNodeEnv} from './api/nodeEnv';
import {ResizeObserverMock} from './mocks/resizeObserver';
import {matchMediaMock} from './mocks/matchMedia';

installNodeEnv();

vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('matchMedia', matchMediaMock);
