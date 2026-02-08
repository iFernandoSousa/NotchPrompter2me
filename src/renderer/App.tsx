import ControllerWindow from './windows/ControllerWindow';
import PrompterWindow from './windows/PrompterWindow';

type WindowType = 'controller' | 'prompter';

interface AppProps {
  windowType: WindowType;
}

export default function App({ windowType }: AppProps) {
  if (windowType === 'prompter') {
    return <PrompterWindow />;
  }
  return <ControllerWindow />;
}
